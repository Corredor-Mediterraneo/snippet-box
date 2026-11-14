import { Router } from 'express';
import {
  countTags,
  createSnippet,
  deleteSnippet,
  getAllSnippets,
  getRawCode,
  getSnippet,
  importSnippets,
  searchSnippets,
  updateSnippet
} from '../controllers/snippets';
import {
  exportAllSnippets,
  exportSelectedSnippets,
  exportByTagMarkdown,
  exportSelectedSnippetsMarkdown
} from '../controllers/export';
import {
  importFromObsidian,
  exportToObsidian,
  exportSingleToObsidian
} from '../controllers/obsidian';
import {
  importFromSqlite,
  importFromMarkdown
} from '../controllers/import';
import {
  removeDuplicates,
  countDuplicates
} from '../controllers/deduplication';
import { requireBody } from '../middleware';

export const snippetRouter = Router();

snippetRouter
  .route('/')
  .post(requireBody('title', 'language', 'code'), createSnippet)
  .get(getAllSnippets);

// Routes with :id param must come AFTER static routes to avoid conflicts
snippetRouter.route('/statistics/count').get(countTags);
snippetRouter.route('/raw/:id').get(getRawCode);
snippetRouter.route('/search').post(searchSnippets);

// Export routes
snippetRouter.route('/export').post(exportAllSnippets);
snippetRouter.route('/export/json').post(exportSelectedSnippets);
snippetRouter.route('/export/markdown').post(exportByTagMarkdown);
snippetRouter.route('/export/markdown/selected').post(exportSelectedSnippetsMarkdown);
snippetRouter.route('/export/obsidian').post(exportToObsidian);

// Import routes
snippetRouter.route('/import').post(importSnippets);
snippetRouter.route('/import/obsidian').post(importFromObsidian);
snippetRouter.route('/import/sqlite').post(importFromSqlite);
snippetRouter.route('/import/markdown').post(importFromMarkdown);

// Deduplication routes (must be before /:id generic routes)
snippetRouter.route('/deduplicate').post(removeDuplicates);
snippetRouter.route('/duplicates/count').get(countDuplicates);

// Single snippet Obsidian export (must be before /:id generic routes)
snippetRouter.route('/:id/export/obsidian').get(exportSingleToObsidian);

// Generic snippet CRUD (must be last among :id routes)
snippetRouter
  .route('/:id')
  .get(getSnippet)
  .put(updateSnippet)
  .delete(deleteSnippet);
