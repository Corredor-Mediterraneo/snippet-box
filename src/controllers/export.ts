import { Request, Response, NextFunction } from 'express';
import { SnippetModel, TagModel } from '../models';
import { asyncWrapper } from '../middleware';
import { ErrorResponse } from '../utils/ErrorResponse';

/**
 * @description Export all snippets as JSON
 * @route /api/snippets/export
 * @request POST
 */
export const exportAllSnippets = asyncWrapper(
  async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const snippets = await SnippetModel.findAll({
      include: {
        model: TagModel,
        as: 'tags',
        attributes: ['name'],
        through: {
          attributes: []
        }
      }
    });

    const populatedSnippets = snippets.map(snippet => {
      const rawSnippet = snippet.get({ plain: true });
      return {
        ...rawSnippet,
        tags: rawSnippet.tags?.map(tag => tag.name) || []
      };
    });

    res.status(200).json({
      data: populatedSnippets
    });
  }
);

/**
 * @description Export selected snippets as JSON
 * @route /api/snippets/export/json
 * @request POST
 */
export const exportSelectedSnippets = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { snippetIds } = req.body;

    if (!snippetIds || !Array.isArray(snippetIds) || snippetIds.length === 0) {
      return next(new ErrorResponse(400, 'No snippet IDs provided'));
    }

    const snippets = await SnippetModel.findAll({
      where: { id: snippetIds },
      include: {
        model: TagModel,
        as: 'tags',
        attributes: ['name'],
        through: {
          attributes: []
        }
      }
    });

    const populatedSnippets = snippets.map(snippet => {
      const rawSnippet = snippet.get({ plain: true });
      return {
        ...rawSnippet,
        tags: rawSnippet.tags?.map(tag => tag.name) || []
      };
    });

    res.status(200).json({
      data: populatedSnippets
    });
  }
);

/**
 * @description Export snippets by tag as Markdown
 * @route /api/snippets/export/markdown
 * @request POST
 */
export const exportByTagMarkdown = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { tag } = req.body;

    if (!tag) {
      return next(new ErrorResponse(400, 'Tag name is required'));
    }

    const snippets = await SnippetModel.findAll({
      include: {
        model: TagModel,
        as: 'tags',
        attributes: ['name'],
        through: {
          attributes: []
        },
        where: {
          name: tag
        }
      }
    });

    if (snippets.length === 0) {
      res.status(200).json({
        data: { content: `# Snippets with tag: ${tag}\n\nNo snippets found.\n`, snippetCount: 0 }
      });
      return;
    }

    let markdown = `# Snippets with tag: ${tag}\n\n`;

    snippets.forEach((snippet, _index) => {
      const rawSnippet = snippet.get({ plain: true });
      markdown += `## ${rawSnippet.title}\n\n`;
      if (rawSnippet.description) {
        markdown += `${rawSnippet.description}\n\n`;
      }
      markdown += `### Code\n\n\`\`\`${rawSnippet.language}\n${rawSnippet.code}\n\`\`\`\n\n`;
      if (rawSnippet.docs) {
        markdown += `### Documentation\n\n${rawSnippet.docs}\n\n`;
      }
      markdown += `---\n\n`;
    });

    res.status(200).json({
      data: {
        content: markdown,
        snippetCount: snippets.length
      }
    });
  }
);

/**
 * @description Export selected snippets as Markdown
 * @route /api/snippets/export/markdown/selected
 * @request POST
 */
export const exportSelectedSnippetsMarkdown = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { snippetIds } = req.body;

    if (!snippetIds || !Array.isArray(snippetIds) || snippetIds.length === 0) {
      return next(new ErrorResponse(400, 'No snippet IDs provided'));
    }

    const snippets = await SnippetModel.findAll({
      where: { id: snippetIds },
      include: {
        model: TagModel,
        as: 'tags',
        attributes: ['name'],
        through: {
          attributes: []
        }
      }
    });

    if (snippets.length === 0) {
      res.status(200).json({
        data: { content: '# Selected Snippets\n\nNo snippets found.\n', snippetCount: 0 }
      });
      return;
    }

    let markdown = '# Selected Snippets\n\n';

    snippets.forEach((snippet, _index) => {
      const rawSnippet = snippet.get({ plain: true });
      const tags = rawSnippet.tags?.map((tag: { name: string }) => tag.name) || [];
      markdown += `## ${rawSnippet.title}\n\n`;
      if (rawSnippet.description) {
        markdown += `${rawSnippet.description}\n\n`;
      }
      markdown += `**Language:** ${rawSnippet.language}\n`;
      markdown += `**Tags:** ${tags.join(', ')}\n\n`;
      markdown += `### Code\n\n\`\`\`${rawSnippet.language}\n${rawSnippet.code}\n\`\`\`\n\n`;
      if (rawSnippet.docs) {
        markdown += `### Documentation\n\n${rawSnippet.docs}\n\n`;
      }
      markdown += `---\n\n`;
    });

    res.status(200).json({
      data: {
        content: markdown,
        snippetCount: snippets.length
      }
    });
  }
);
