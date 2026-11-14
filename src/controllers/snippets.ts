import { Request, Response, NextFunction } from 'express';
import { QueryTypes, Op } from 'sequelize';
import { sequelize } from '../db';
import { asyncWrapper } from '../middleware';
import { SnippetModel, Snippet_TagModel, TagModel } from '../models';
import { ErrorResponse, tagParser, createTags } from '../utils';
import { Body, SearchQuery } from '../typescript/interfaces';

/**
 * @description Create new snippet
 * @route /api/snippets
 * @request POST
 */
export const createSnippet = asyncWrapper(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    // Get tags from request body
    const { language, tags: requestTags } = <Body>req.body;
    const parsedRequestTags = tagParser([
      ...requestTags,
      language.toLowerCase()
    ]);

    // Create snippet
    const snippet = await SnippetModel.create({
      ...req.body,
      tags: [...parsedRequestTags].join(',')
    });

    // Create tags
    await createTags(parsedRequestTags, snippet.id);

    // Get raw snippet values
    const rawSnippet = snippet.get({ plain: true });

    res.status(201).json({
      data: {
        ...rawSnippet,
        tags: [...parsedRequestTags]
      }
    });
  }
);

/**
 * @description Get all snippets (with optional pagination)
 * @route /api/snippets
 * @request GET
 * @query limit - max snippets to return (default: all, max: 200)
 * @query offset - number of snippets to skip (default: 0)
 */
export const getAllSnippets = asyncWrapper(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const limit = parseInt(req.query.limit as string, 10);
    const offset = parseInt(req.query.offset as string, 10);
    const MAX_LIMIT = 200;

    const findOptions: any = {
      include: {
        model: TagModel,
        as: 'tags',
        attributes: ['name'],
        through: {
          attributes: []
        }
      }
    };

    // Apply pagination only if valid limit is provided
    if (!isNaN(limit) && limit > 0) {
      findOptions.limit = Math.min(limit, MAX_LIMIT);
      findOptions.offset = (!isNaN(offset) && offset >= 0) ? offset : 0;
    }

    const snippets = await SnippetModel.findAll(findOptions);

    const populatedSnippets = snippets.map(snippet => {
      const rawSnippet = snippet.get({ plain: true });

      return {
        ...rawSnippet,
        tags: rawSnippet.tags?.map(tag => tag.name)
      };
    });

    res.status(200).json({
      data: populatedSnippets
    });
  }
);

/**
 * @description Get single snippet by id
 * @route /api/snippets/:id
 * @request GET
 */
export const getSnippet = asyncWrapper(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const snippet = await SnippetModel.findOne({
      where: { id: req.params.id },
      include: {
        model: TagModel,
        as: 'tags',
        attributes: ['name'],
        through: {
          attributes: []
        }
      }
    });

    if (!snippet) {
      return _next(
        new ErrorResponse(
          404,
          `Snippet with id of ${req.params.id} was not found`
        )
      );
    }

    const rawSnippet = snippet.get({ plain: true });
    const populatedSnippet = {
      ...rawSnippet,
      tags: rawSnippet.tags?.map(tag => tag.name)
    };

    res.status(200).json({
      data: populatedSnippet
    });
  }
);

/**
 * @description Update snippet
 * @route /api/snippets/:id
 * @request PUT
 */
export const updateSnippet = asyncWrapper(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    let snippet = await SnippetModel.findOne({
      where: { id: req.params.id }
    });

    if (!snippet) {
      return _next(
        new ErrorResponse(
          404,
          `Snippet with id of ${req.params.id} was not found`
        )
      );
    }

    // Get tags from request body
    const { language, tags: requestTags } = <Body>req.body;
    let parsedRequestTags = tagParser([...requestTags, language.toLowerCase()]);

    // Update snippet
    snippet = await snippet.update({
      ...req.body,
      tags: [...parsedRequestTags].join(',')
    });

    // Delete old tags and create new ones
    await Snippet_TagModel.destroy({ where: { snippet_id: req.params.id } });
    await createTags(parsedRequestTags, snippet.id);

    // Get raw snippet values
    const rawSnippet = snippet.get({ plain: true });

    res.status(200).json({
      data: {
        ...rawSnippet,
        tags: [...parsedRequestTags]
      }
    });
  }
);

/**
 * @description Delete snippet
 * @route /api/snippets/:id
 * @request DELETE
 */
export const deleteSnippet = asyncWrapper(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const snippet = await SnippetModel.findOne({
      where: { id: req.params.id }
    });

    if (!snippet) {
      return _next(
        new ErrorResponse(
          404,
          `Snippet with id of ${req.params.id} was not found`
        )
      );
    }

    await Snippet_TagModel.destroy({ where: { snippet_id: req.params.id } });
    await snippet.destroy();

    res.status(200).json({
      data: {}
    });
  }
);

/**
 * @description Count tags
 * @route /api/snippets/statistics/count
 * @request GET
 */
export const countTags = asyncWrapper(
  async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const result = await sequelize.query(
      `SELECT
        COUNT(tags.name) as count,
        tags.name
      FROM snippets_tags
      INNER JOIN tags ON snippets_tags.tag_id = tags.id
      GROUP BY tags.name
      ORDER BY name ASC`,
      {
        type: QueryTypes.SELECT
      }
    );

    res.status(200).json({
      data: result
    });
  }
);

/**
 * @description Get raw snippet code
 * @route /api/snippets/raw/:id
 * @request GET
 */
export const getRawCode = asyncWrapper(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const snippet = await SnippetModel.findOne({
      where: { id: req.params.id },
      raw: true
    });

    if (!snippet) {
      return _next(
        new ErrorResponse(
          404,
          `Snippet with id of ${req.params.id} was not found`
        )
      );
    }

    res.status(200).send(snippet.code);
  }
);

/**
 * @description Search snippets (uses FTS5 if available, falls back to LIKE)
 * @route /api/snippets/search
 * @request POST
 */
export const searchSnippets = asyncWrapper(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { query, tags, languages } = <SearchQuery>req.body;

    // Check if FTS5 table exists
    let ftsAvailable = false;
    try {
      const result = await sequelize.query(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='snippets_fts'",
        { type: QueryTypes.SELECT }
      );
      ftsAvailable = (result as any[]).length > 0;
    } catch {
      // FTS5 not available, fall back to LIKE
    }

    // Build dynamic where clause
    const whereConditions: any[] = [];

    // Only add text search if query is not empty
    if (query && query.trim() !== '') {
      if (ftsAvailable) {
        // Use FTS5 for full-text search — get matching IDs first
        const ftsResults = await sequelize.query(
          `SELECT rowid FROM snippets_fts WHERE snippets_fts MATCH :query`,
          {
            type: QueryTypes.SELECT,
            replacements: { query }
          }
        );
        const ftsIds = (ftsResults as any[]).map((r: any) => r.rowid);

        if (ftsIds.length === 0) {
          res.status(200).json({ data: [] });
          return;
        }

        whereConditions.push({
          id: { [Op.in]: ftsIds }
        });
      } else {
        // Fallback to LIKE search
        whereConditions.push({
          [Op.or]: [
            { title: { [Op.substring]: query } },
            { description: { [Op.substring]: query } }
          ]
        });
      }
    }

    // Only add language filter if languages array has items
    if (languages && languages.length > 0) {
      whereConditions.push({
        language: { [Op.in]: languages }
      });
    }

    const snippets = await SnippetModel.findAll({
      where: whereConditions.length > 0 ? { [Op.and]: whereConditions } : {},
      include: {
        model: TagModel,
        as: 'tags',
        attributes: ['name'],
        ...(tags && tags.length > 0 ? {
          where: {
            name: { [Op.in]: tags }
          }
        } : {}),
        through: {
          attributes: []
        }
      }
    });

    res.status(200).json({
      data: snippets
    });
  }
);

/**
 * @description Import snippets from JSON
 * @route /api/snippets/import
 * @request POST
 */
export const importSnippets = asyncWrapper(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { snippets: importData } = req.body;

    if (!importData || !Array.isArray(importData)) {
      return _next(
        new ErrorResponse(400, 'Invalid format: snippets must be an array')
      );
    }

    const imported: number[] = [];
    const errors: { index: number; error: string }[] = [];

    for (let i = 0; i < importData.length; i++) {
      const item = importData[i];

      // Validate required fields
      if (!item.title || !item.language || !item.code) {
        errors.push({
          index: i,
          error: 'Missing required fields: title, language, and code are required'
        });
        continue;
      }

      try {
        // Create snippet
        const snippet = await SnippetModel.create({
          title: item.title,
          description: item.description || '',
          language: item.language.toLowerCase(),
          code: item.code,
          docs: item.docs || '',
          isPinned: item.isPinned ? 1 : 0
        });

        // Create tags if provided
        if (item.tags && Array.isArray(item.tags) && item.tags.length > 0) {
          const parsedTags = tagParser([
            ...item.tags,
            item.language.toLowerCase()
          ]);
          await createTags(parsedTags, snippet.id);
        } else {
          // Create language tag at minimum
          const parsedTags = tagParser([item.language.toLowerCase()]);
          await createTags(parsedTags, snippet.id);
        }

        imported.push(snippet.id);
      } catch (err: any) {
        errors.push({
          index: i,
          error: err.message || 'Failed to create snippet'
        });
      }
    }

    res.status(200).json({
      data: {
        imported: imported.length,
        errors: errors.length,
        importedIds: imported,
        errorDetails: errors
      }
    });
  }
);
