import { Logger } from '../../utils/Logger';
import { DataTypes } from 'sequelize';
import {
  SnippetModel,
  Snippet_TagModel,
  TagModel
} from '../../models';

const { STRING, INTEGER } = DataTypes;
const logger = new Logger('migration[02]');

export const up = async (context: any): Promise<void> => {
  await context.context.createTable('tags', {
    id: {
      type: INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: STRING,
      allowNull: false,
      unique: true
    }
  });

  await context.context.createTable('snippets_tags', {
    id: {
      type: INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    snippet_id: {
      type: INTEGER,
      allowNull: false
    },
    tag_id: {
      type: INTEGER,
      allowNull: false
    }
  });

  // Create new tags from language column
  const snippets = await SnippetModel.findAll();
  const languages = snippets.map(snippet => snippet.language);
  const uniqueLanguages = [...new Set(languages)];
  const tags: any[] = [];

  if (snippets.length > 0) {
    // Use Promise.all properly with async operations
    await Promise.all(uniqueLanguages.map(async language => {
      try {
        const tag = await TagModel.create({ name: language });
        tags.push(tag);
      } catch (err) {
        logger.log('Error while creating new tags', 'ERROR');
      }
    }));

    // Assign tag to snippet
    await Promise.all(snippets.map(async snippet => {
      try {
        const tag = tags.find(tag => tag.name === snippet.language);
        if (tag) {
          await Snippet_TagModel.create({
            snippet_id: snippet.id,
            tag_id: tag.id
          });
        }
      } catch (err) {
        logger.log('Error while assigning tags to snippets', 'ERROR');
      }
    }));
  }
};

export const down = async (context: any): Promise<void> => {
  await context.context.dropTable('tags');
  await context.context.dropTable('snippets_tags');
};
