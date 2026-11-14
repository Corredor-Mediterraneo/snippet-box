import { Request, Response, NextFunction } from 'express';
import { QueryTypes } from 'sequelize';
import { asyncWrapper } from '../middleware';
import { SnippetModel } from '../models';
import { ErrorResponse, tagParser, createTags } from '../utils';

/**
 * @description Import snippets from a native SQLite database (pawelmalak/snippet-box format)
 * @route /api/snippets/import/sqlite
 * @request POST
 * Body: { database: string } — base64-encoded SQLite file
 */
export const importFromSqlite = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { database } = req.body;

    if (!database || typeof database !== 'string') {
      return next(new ErrorResponse(400, 'No database provided. Send { database: "<base64>" }'));
    }

    try {
      // Decode base64 to Buffer
      const buffer = Buffer.from(database, 'base64');

      // Write to a temporary file in OS-specific temp directory
      const os = require('os');
      const fs = require('fs');
      const tmpDir = os.tmpdir();
      const tmpPath = `${tmpDir}/import_${Date.now()}_${Math.random().toString(36).slice(2)}.sqlite3`;
      fs.writeFileSync(tmpPath, buffer);

      // Open the source database
      const SourceSequelize = new (require('sequelize')).Sequelize({
        dialect: 'sqlite',
        storage: tmpPath,
        logging: false
      });

      const imported: number[] = [];
      const errors: { title: string; error: string }[] = [];

      // Check if snippets table exists
      const tablesResult = await SourceSequelize.query(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='snippets'",
        { type: QueryTypes.SELECT }
      );

      if (!(tablesResult as any[]).length) {
        await SourceSequelize.close();
        fs.unlinkSync(tmpPath);
        return next(new ErrorResponse(400, 'Source database does not contain a snippets table'));
      }

      // Get all snippets from source
      const sourceSnippets = await SourceSequelize.query(
        'SELECT * FROM snippets',
        { type: QueryTypes.SELECT }
      );

      // Get all tags from source
      const sourceTagsResult = await SourceSequelize.query(
        'SELECT * FROM tags',
        { type: QueryTypes.SELECT }
      );
      const sourceTags = (sourceTagsResult as any[]).reduce(
        (acc: Record<number, string>, tag: any) => {
          acc[tag.id] = tag.name;
          return acc;
        },
        {}
      );

      // Get all snippet_tag relations from source
      const sourceRelations = await SourceSequelize.query(
        'SELECT * FROM snippets_tags',
        { type: QueryTypes.SELECT }
      );

      // Build a map: snippet_id -> [tag_ids]
      const snippetTagMap: Record<number, number[]> = {};
      (sourceRelations as any[]).forEach(rel => {
        if (!snippetTagMap[rel.snippet_id]) {
          snippetTagMap[rel.snippet_id] = [];
        }
        snippetTagMap[rel.snippet_id].push(rel.tag_id);
      });

      // Import each snippet
      for (const snippet of sourceSnippets as any[]) {
        try {
          const created = await SnippetModel.create({
            title: snippet.title,
            description: snippet.description || '',
            language: snippet.language || 'text',
            code: snippet.code || '',
            docs: snippet.docs || '',
            isPinned: snippet.isPinned ? 1 : 0
          });

          // Reconstruct tags for this snippet
          const tagIds = snippetTagMap[snippet.id] || [];
          const tagNames = tagIds
            .map(id => sourceTags[id])
            .filter(Boolean);

          if (tagNames.length > 0) {
            const allTags = tagParser([...tagNames, created.language.toLowerCase()]);
            await createTags(allTags, created.id);
          } else {
            const langTag = tagParser([created.language.toLowerCase()]);
            await createTags(langTag, created.id);
          }

          imported.push(created.id);
        } catch (err: any) {
          errors.push({
            title: snippet.title || `snippet-${snippet.id}`,
            error: err.message || 'Failed to create snippet'
          });
        }
      }

      // Cleanup
      await SourceSequelize.close();
      fs.unlinkSync(tmpPath);

      res.status(200).json({
        data: {
          imported: imported.length,
          errors: errors.length,
          importedIds: imported,
          errorDetails: errors
        }
      });
    } catch (err: any) {
      return next(new ErrorResponse(500, `Failed to parse SQLite database: ${err.message}`));
    }
  }
);

/**
 * @description Import snippets from individual Markdown files
 * @route /api/snippets/import/markdown
 * @request POST
 * Body: { files: [{ name: string, content: string }, ...] }
 */
export const importFromMarkdown = asyncWrapper(
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
        // Parse markdown: extract code blocks and metadata
        const parsed = parseMarkdownFile(content, name);

        if (!parsed.code.trim()) {
          skipped.push({ name, reason: 'No code content found' });
          continue;
        }

        // Create snippet
        const created = await SnippetModel.create({
          title: parsed.title,
          description: parsed.description,
          language: parsed.language,
          code: parsed.code,
          docs: parsed.docs,
          isPinned: parsed.isPinned ? 1 : 0
        });

        // Create tags including language
        const allTags = tagParser([...parsed.tags, parsed.language]);
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
 * Parse a markdown file into snippet data
 * Supports code blocks and basic metadata extraction
 */
function parseMarkdownFile(content: string, fileName: string): {
  title: string;
  description: string;
  language: string;
  code: string;
  docs: string;
  tags: string[];
  isPinned: boolean;
} {
  // Try to extract YAML frontmatter if present
  let body = content;
  let frontmatter: Record<string, unknown> = {};

  const yamlMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (yamlMatch) {
    // Simple YAML parsing for common fields
    const yamlContent = yamlMatch[1];
    body = yamlMatch[2];

    const titleMatch = yamlContent.match(/^title:\s*(.+)$/m);
    if (titleMatch) frontmatter.title = titleMatch[1].trim();

    const descMatch = yamlContent.match(/^description:\s*(.+)$/m);
    if (descMatch) frontmatter.description = descMatch[1].trim();

    const langMatch = yamlContent.match(/^language:\s*(.+)$/m);
    if (langMatch) frontmatter.language = langMatch[1].trim();

    const tagsMatch = yamlContent.match(/^tags:\s*\[([^\]]*)\]/m);
    if (tagsMatch) {
      frontmatter.tags = tagsMatch[1].split(',').map((t: string) => t.trim().replace(/"/g, ''));
    }
  }

  // Extract code blocks
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const codeBlocks: { lang: string; code: string }[] = [];
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(body)) !== null) {
    codeBlocks.push({ lang: match[1] || '', code: match[2] });
  }

  // Determine language
  let language = (frontmatter.language as string) || 'text';
  if (codeBlocks.length > 0 && !frontmatter.language) {
    // Use the most common language in code blocks
    const langCounts: Record<string, number> = {};
    codeBlocks.forEach(cb => {
      if (cb.lang) {
        langCounts[cb.lang] = (langCounts[cb.lang] || 0) + 1;
      }
    });
    const mostCommon = Object.entries(langCounts).sort((a, b) => b[1] - a[1])[0];
    if (mostCommon) {
      language = mostCommon[0];
    }
  }
  language = language.toLowerCase().trim();

  // Combine all code blocks
  const code = codeBlocks.map(cb => cb.code).join('\n\n');

  // Remove code blocks from body to get docs
  const docs = body.replace(codeBlockRegex, '').trim();

  // Title from frontmatter or filename
  const title = (frontmatter.title as string) || fileName.replace('.md', '');

  // Description from frontmatter or first line of docs
  const description = (frontmatter.description as string) || docs.split('\n')[0] || '';

  // Tags from frontmatter
  const tags = (frontmatter.tags as string[]) || [];

  // isPinned (default false)
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
