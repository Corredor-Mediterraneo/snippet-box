import { Request, Response, NextFunction } from 'express';
import { QueryTypes, Op } from 'sequelize';
import { sequelize } from '../db';
import { asyncWrapper } from '../middleware';
import { SnippetModel, Snippet_TagModel } from '../models';
import { createHash } from 'crypto';

/**
 * @description Remove duplicate snippets based on title and code
 * @route /api/snippets/deduplicate
 * @request POST
 * Keeps the oldest snippet (lowest id) and removes newer duplicates
 */
export const removeDuplicates = asyncWrapper(
  async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    // Get all snippets with title and code
    const allSnippets = await SnippetModel.findAll({
      attributes: ['id', 'title', 'code', 'createdAt'],
      order: [['createdAt', 'ASC']]
    });

    if (allSnippets.length === 0) {
      res.status(200).json({
        data: {
          duplicatesFound: 0,
          removed: 0,
          kept: allSnippets.length,
          removedIds: []
        }
      });
      return;
    }

    // Group by title + code hash to find duplicates
    const seen = new Map<string, number>(); // key -> first snippet id to keep
    const duplicateIds: number[] = [];

    for (const snippet of allSnippets) {
      const codeHash = createHash('md5').update(snippet.code).digest('hex');
      const key = `${snippet.title.toLowerCase().trim()}||${codeHash}`;

      if (seen.has(key)) {
        // This is a duplicate - mark for deletion
        duplicateIds.push(snippet.id);
      } else {
        // First occurrence - keep it
        seen.set(key, snippet.id);
      }
    }

    if (duplicateIds.length === 0) {
      res.status(200).json({
        data: {
          duplicatesFound: 0,
          removed: 0,
          kept: allSnippets.length,
          removedIds: []
        }
      });
      return;
    }

    // Remove Snippet_Tag associations for duplicates
    if (duplicateIds.length > 0) {
      await Snippet_TagModel.destroy({
        where: { snippet_id: { [Op.in]: duplicateIds } }
      });
    }

    // Delete duplicate snippets
    await SnippetModel.destroy({
      where: { id: { [Op.in]: duplicateIds } }
    });

    // Update FTS5 if available
    try {
      await sequelize.query(
        'INSERT INTO snippets_fts SELECT id, title, description, code FROM snippets',
        { type: QueryTypes.RAW }
      );
    } catch {
      // FTS5 may not be available, ignore
    }

    res.status(200).json({
      data: {
        duplicatesFound: duplicateIds.length,
        removed: duplicateIds.length,
        kept: seen.size,
        removedIds: duplicateIds
      }
    });
  }
);

/**
 * @description Count duplicate snippets without removing them
 * @route /api/snippets/duplicates/count
 * @request GET
 */
export const countDuplicates = asyncWrapper(
  async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const allSnippets = await SnippetModel.findAll({
      attributes: ['id', 'title', 'code'],
      order: [['createdAt', 'ASC']]
    });

    const duplicateIds: number[] = [];
    const duplicateGroups: { key: string; ids: number[] }[] = [];

    const groupMap = new Map<string, number[]>();

    for (const snippet of allSnippets) {
      const codeHash = createHash('md5').update(snippet.code).digest('hex');
      const key = `${snippet.title.toLowerCase().trim()}||${codeHash}`;

      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push(snippet.id);
    }

    // Find groups with more than 1 snippet
    for (const [key, ids] of groupMap.entries()) {
      if (ids.length > 1) {
        duplicateGroups.push({ key, ids });
        // All except the first are duplicates
        duplicateIds.push(...ids.slice(1));
      }
    }

    res.status(200).json({
      data: {
        totalSnippets: allSnippets.length,
        duplicatesFound: duplicateIds.length,
        duplicateGroups: duplicateGroups.length,
        groups: duplicateGroups.map(g => ({
          title: g.key.split('||')[0],
          ids: g.ids,
          keep: g.ids[0],
          remove: g.ids.slice(1)
        }))
      }
    });
  }
);
