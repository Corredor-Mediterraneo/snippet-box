import { Logger } from '../../utils/Logger';
import { sequelize } from '../index';

const logger = new Logger('migration[04]');

export const up = async (): Promise<void> => {
  // Create FTS5 virtual table for full-text search on title and description
  try {
    await sequelize.query(`
      CREATE VIRTUAL TABLE IF NOT EXISTS snippets_fts USING fts5(
        title,
        description,
        content='snippets',
        content_rowid='id'
      )
    `);
    logger.log('Created FTS5 virtual table snippets_fts');
  } catch (err) {
    logger.log(`Error creating FTS5 table: ${err}`, 'ERROR');
    return;
  }

  // Populate FTS table from existing snippets
  try {
    await sequelize.query(`
      INSERT INTO snippets_fts (rowid, title, description)
      SELECT id, title, description FROM snippets
    `);
    logger.log('Populated FTS5 table from existing snippets');
  } catch (err) {
    logger.log(`Error populating FTS5 table: ${err}`, 'ERROR');
  }

  // Create triggers to keep FTS table in sync
  const triggers = [
    `
      CREATE TRIGGER IF NOT EXISTS snippets_ai AFTER INSERT ON snippets
      BEGIN
        INSERT INTO snippets_fts(rowid, title, description)
        VALUES (new.id, new.title, new.description);
      END
    `,
    `
      CREATE TRIGGER IF NOT EXISTS snippets_ad AFTER DELETE ON snippets
      BEGIN
        DELETE FROM snippets_fts WHERE rowid = old.id;
      END
    `,
    `
      CREATE TRIGGER IF NOT EXISTS snippets_au AFTER UPDATE ON snippets
      BEGIN
        UPDATE snippets_fts
        SET title = new.title, description = new.description
        WHERE rowid = new.id;
      END
    `
  ];

  for (const trigger of triggers) {
    try {
      await sequelize.query(trigger);
      logger.log('Created FTS5 trigger');
    } catch (err) {
      logger.log(`Error creating trigger: ${err}`, 'ERROR');
    }
  }
};

export const down = async (): Promise<void> => {
  const triggers = [
    'snippets_ai',
    'snippets_ad',
    'snippets_au'
  ];

  for (const trigger of triggers) {
    try {
      await sequelize.query(`DROP TRIGGER IF EXISTS ${trigger}`);
      logger.log(`Dropped trigger: ${trigger}`);
    } catch (err) {
      logger.log(`Error dropping trigger: ${err}`, 'ERROR');
    }
  }

  try {
    await sequelize.query('DROP TABLE IF EXISTS snippets_fts');
    logger.log('Dropped FTS5 virtual table');
  } catch (err) {
    logger.log(`Error dropping FTS5 table: ${err}`, 'ERROR');
  }
};
