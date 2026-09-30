import { Router } from 'express';
import {
  countTags,
  createSnippet,
  deleteSnippet,
  getAllSnippets,
  getRawCode,
  getSnippet,
  searchSnippets,
  updateSnippet
} from '../controllers/snippets';
import {
  exportAllSnippets,
  exportSelectedSnippets,
  exportByTagMarkdown,
  exportSelectedSnippetsMarkdown
} from '../controllers/export';
import { requireBody } from '../middleware';

export const snippetRouter = Router();

snippetRouter
  .route('/')
  .post(requireBody('title', 'language', 'code'), createSnippet)
  .get(getAllSnippets);

snippetRouter
  .route('/:id')
  .get(getSnippet)
  .put(updateSnippet)
  .delete(deleteSnippet);

snippetRouter.route('/statistics/count').get(countTags);
snippetRouter.route('/raw/:id').get(getRawCode);
snippetRouter.route('/search').post(searchSnippets);

// Export routes
snippetRouter.route('/export').post(exportAllSnippets);
snippetRouter.route('/export/json').post(exportSelectedSnippets);
snippetRouter.route('/export/markdown').post(exportByTagMarkdown);
snippetRouter.route('/export/markdown/selected').post(exportSelectedSnippetsMarkdown);
