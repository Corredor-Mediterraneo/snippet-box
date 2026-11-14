import { Request, Response, NextFunction } from 'express';
import archiver from 'archiver';
import path from 'path';
import matter from 'gray-matter';
import { asyncWrapper } from '../middleware';
import { SnippetModel, TagModel } from '../models';
import { ErrorResponse, tagParser, createTags } from '../utils';

/**
 * Obsidian frontmatter structure expected in .md files
 */
interface ObsidianFrontmatter {
  title?: string;
  description?: string;
  language?: string;
  tags?: string[];
  code?: string;
  docs?: string;
  isPinned?: boolean;
  [key: string]: unknown;
}

/**
 * Parse an Obsidian markdown file content into snippet data
 * Supports both frontmatter-only and body-with-code-block formats
 */
function parseObsidianFile(content: string, fileName: string): {
  title: string;
  description: string;
  language: string;
  code: string;
  docs: string;
  tags: string[];
  isPinned: boolean;
} {
  const parsed = matter(content);
  const frontmatter = parsed.data as ObsidianFrontmatter;
  const body = parsed.content.trim();

  // Extract tags from frontmatter (can be string or array)
  let tags: string[] = [];
  const rawTags: unknown = frontmatter.tags;
  if (typeof rawTags === 'string') {
    tags = rawTags.split(',').map((t: string) => t.trim()).filter(Boolean);
  } else if (Array.isArray(rawTags)) {
    tags = rawTags.filter(Boolean) as string[];
  }

  // Determine language
  let language = frontmatter.language || 'text';
  if (typeof language === 'string') {
    language = language.toLowerCase().trim();
  }

  // Extract code and docs from body if not in frontmatter
  let code = frontmatter.code || '';
  let docs = frontmatter.docs || '';

  if (!code && body) {
    // Try to extract code blocks from the body
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    const codeBlocks: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(body)) !== null) {
      if (match[1] && !language) {
        language = match[1].toLowerCase();
      }
      codeBlocks.push(match[2]);
    }

    if (codeBlocks.length > 0) {
      code = codeBlocks.join('\n\n');
      // Remove code blocks from body to get docs
      docs = body.replace(codeBlockRegex, '').trim();
    } else {
      // No code blocks found; entire body is the code
      code = body;
    }
  }

  // Title from frontmatter or filename
  const title = frontmatter.title || path.basename(fileName, '.md');

  // Description from frontmatter or docs
  const description = frontmatter.description || docs;

  // isPinned
  const isPinned = !!frontmatter.isPinned;

  return {
    title,
    description,
    language,
    code,
    docs,
    tags,
    isPinned
  };
}

/**
 * @description Import snippets from Obsidian vault (ZIP or JSON array of files)
 * @route /api/snippets/import/obsidian
 * @request POST
 * Body: { files: [{ name: string, content: string }, ...] } or multipart with ZIP
 */
export const importFromObsidian = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { files } = req.body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return next(new ErrorResponse(400, 'No files provided. Send { files: [{ name, content }, ...] }'));
    }

    const imported: number[] = [];
    const skipped: { name: string; reason: string }[] = [];
    const errors: { name: string; error: string }[] = [];

    for (const file of files) {
      const { name, content } = file;

      if (!name || !content) {
        errors.push({ name: name || 'unknown', error: 'Missing name or content' });
        continue;
      }

      // Only process .md files
      if (!name.endsWith('.md')) {
        skipped.push({ name, reason: 'Not a markdown file' });
        continue;
      }

      try {
        const snippet = parseObsidianFile(content, name);

        // Validate required fields
        if (!snippet.code.trim()) {
          skipped.push({ name, reason: 'No code content found' });
          continue;
        }

        // Create snippet
        const created = await SnippetModel.create({
          title: snippet.title,
          description: snippet.description,
          language: snippet.language,
          code: snippet.code,
          docs: snippet.docs,
          isPinned: snippet.isPinned ? 1 : 0
        });

        // Create tags including language
        const allTags = tagParser([...snippet.tags, snippet.language]);
        await createTags(allTags, created.id);

        imported.push(created.id);
      } catch (err: any) {
        errors.push({ name, error: err.message || 'Failed to parse file' });
      }
    }

    res.status(200).json({
      data: {
        imported: imported.length,
        skipped: skipped.length,
        errors: errors.length,
        importedIds: imported,
        skippedDetails: skipped,
        errorDetails: errors
      }
    });
  }
);

/**
 * @description Export snippets as Obsidian vault (ZIP with .md files)
 * @route /api/snippets/export/obsidian
 * @request POST
 * Body: { snippetIds?: number[], tag?: string } — export all if empty
 */
export const exportToObsidian = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { snippetIds, tag } = req.body;

    // Build where clause
    const where: any = {};
    if (snippetIds && Array.isArray(snippetIds) && snippetIds.length > 0) {
      where.id = snippetIds;
    }
    if (tag) {
      // Will filter via include
    }

    const includeOptions: any = {
      model: TagModel,
      as: 'tags',
      attributes: ['name'],
      through: { attributes: [] }
    };

    if (tag) {
      includeOptions.where = { name: tag };
    }

    const snippets = await SnippetModel.findAll({
      where,
      include: includeOptions
    });

    if (snippets.length === 0) {
      return next(new ErrorResponse(404, 'No snippets found for export'));
    }

    // Set response headers for ZIP download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="snippet-box-obsidian-vault.zip"');

    // Create ZIP archive
    const archive = new archiver.ZipArchive({
      zlib: { level: 9 }
    });

    archive.pipe(res);

    snippets.forEach(snippet => {
      const raw = snippet.get({ plain: true });
      const tags = raw.tags?.map((t: { name: string }) => t.name) || [];

      // Remove language from tags for Obsidian (it's in frontmatter separately)
      const obsidianTags = tags.filter(t => t !== raw.language);

      // Build frontmatter
      const frontmatter: Record<string, unknown> = {
        title: raw.title,
        language: raw.language
      };

      if (raw.description && raw.description.trim()) {
        frontmatter.description = raw.description.trim();
      }

      if (obsidianTags.length > 0) {
        frontmatter.tags = obsidianTags;
      }

      if (raw.isPinned) {
        frontmatter.isPinned = true;
      }

      // Build body: code block + docs
      let body = ` \n\`\`\`${raw.language}\n${raw.code}\n\`\`\`\n`;

      if (raw.docs && raw.docs.trim()) {
        body += `\n\n${raw.docs.trim()}\n`;
      }

      // Sanitize filename from title
      const safeName = raw.title
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase()
        .substring(0, 100);

      const fileName = safeName || `snippet-${raw.id}`;

      // Create the full markdown content with frontmatter
      const mdContent = matter.stringify(body, frontmatter);

      // Add to archive — use folder structure based on language
      const folderName = raw.language || 'other';
      archive.append(mdContent, { name: `${folderName}/${fileName}.md` });
    });

    await archive.finalize();
  }
);

/**
 * @description Export a single snippet as Obsidian markdown (for preview)
 * @route /api/snippets/:id/export/obsidian
 * @request GET
 */
export const exportSingleToObsidian = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const snippet = await SnippetModel.findOne({
      where: { id: req.params.id },
      include: {
        model: TagModel,
        as: 'tags',
        attributes: ['name'],
        through: { attributes: [] }
      }
    });

    if (!snippet) {
      return next(new ErrorResponse(404, `Snippet with id ${req.params.id} not found`));
    }

    const raw = snippet.get({ plain: true });
    const tags = raw.tags?.map((t: { name: string }) => t.name) || [];
    const obsidianTags = tags.filter(t => t !== raw.language);

    const frontmatter: Record<string, unknown> = {
      title: raw.title,
      language: raw.language
    };

    if (raw.description && raw.description.trim()) {
      frontmatter.description = raw.description.trim();
    }

    if (obsidianTags.length > 0) {
      frontmatter.tags = obsidianTags;
    }

    if (raw.isPinned) {
      frontmatter.isPinned = true;
    }

    let body = ` \n\`\`\`${raw.language}\n${raw.code}\n\`\`\`\n`;

    if (raw.docs && raw.docs.trim()) {
      body += `\n\n${raw.docs.trim()}\n`;
    }

    const mdContent = matter.stringify(body, frontmatter);

    res.setHeader('Content-Type', 'text/markdown');
    res.status(200).send(mdContent);
  }
);
