import { Logger } from '../../utils/Logger';
import { sequelize } from '../index';

const logger = new Logger('migration[03]');

export const up = async (): Promise<void> => {
  const queries = [
    // Snippets indexes
    'CREATE INDEX IF NOT EXISTS idx_snippets_title ON snippets(title)',
    'CREATE INDEX IF NOT EXISTS idx_snippets_description ON snippets(description)',
    'CREATE INDEX IF NOT EXISTS idx_snippets_language ON snippets(language)',
    // Tags indexes
    'CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name)',
    // Snippets_tags indexes
    'CREATE INDEX IF NOT EXISTS idx_snippets_tags_snippet_id ON snippets_tags(snippet_id)',
    'CREATE INDEX IF NOT EXISTS idx_snippets_tags_tag_id ON snippets_tags(tag_id)'
  ];

  for (const query of queries) {
    try {
      await sequelize.query(query);
      logger.log(`Executed: ${query}`);
    } catch (err) {
      logger.log(`Error executing: ${query}`, 'ERROR');
    }
  }
};

export const down = async (): Promise<void> => {
  const indexes = [
    'idx_snippets_title',
    'idx_snippets_description',
    'idx_snippets_language',
    'idx_tags_name',
    'idx_snippets_tags_snippet_id',
    'idx_snippets_tags_tag_id'
  ];

  for (const index of indexes) {
    try {
      await sequelize.query(`DROP INDEX IF EXISTS ${index}`);
      logger.log(`Dropped index: ${index}`);
    } catch (err) {
      logger.log(`Error dropping index: ${index}`, 'ERROR');
    }
  }
};
