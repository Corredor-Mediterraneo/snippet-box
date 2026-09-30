import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { SnippetModel, TagModel, Snippet_TagModel } from './models';
import { createTags } from './utils/createTags';
import { tagParser } from './utils/tagParser';

export async function startMcpServer(): Promise<void> {
  const server = new McpServer({
    name: 'snippet-box',
    version: '2.0.0',
  });

  // List all snippets
  server.registerTool('list_snippets', {
    title: 'List all snippets',
    description: 'List all snippets with their tags, ordered by pinned status and creation date',
    inputSchema: {}
  }, async (_args: any) => {
    const snippets = await SnippetModel.findAll({
      include: [
        {
          model: TagModel,
          as: 'tags',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        }
      ],
      order: [['isPinned', 'DESC'], ['createdAt', 'DESC']]
    });

    const data = snippets.map((snippet: any) => {
      const raw = snippet.get({ plain: true });
      return {
        ...raw,
        tags: raw.tags?.map((t: any) => t.name) || []
      };
    });

    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }]
    };
  });

  // Get single snippet by ID
  server.registerTool('get_snippet', {
    title: 'Get snippet by ID',
    description: 'Get a single snippet by its ID, including all associated tags',
    inputSchema: z.object({
      id: z.string()
    })
  }, async (args: any) => {
    const snippet = await SnippetModel.findOne({
      where: { id: args.id },
      include: [
        {
          model: TagModel,
          as: 'tags',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        }
      ]
    });

    if (!snippet) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: 'Snippet not found' }) }]
      };
    }

    const raw = snippet.get({ plain: true });
    return {
      content: [{ type: 'text', text: JSON.stringify({ ...raw, tags: raw.tags?.map((t: any) => t.name) || [] }, null, 2) }]
    };
  });

  // Create new snippet
  server.registerTool('create_snippet', {
    title: 'Create new snippet',
    description: 'Create a new snippet with title, code, language, tags, and optional description and documentation',
    inputSchema: z.object({
      title: z.string(),
      description: z.string().default(''),
      code: z.string(),
      language: z.string(),
      docs: z.string().default(''),
      tags: z.array(z.string()).default([]),
      pinned: z.boolean().default(false)
    })
  }, async (args: any) => {
    const { title, description, code, language, docs, tags, pinned } = args;

    const snippet = await SnippetModel.create({
      title,
      description: description || '',
      code,
      language: language.toLowerCase(),
      docs: docs || '',
      isPinned: pinned ? 1 : 0
    });

    const parsedTags = tagParser([...tags, language.toLowerCase()]);
    await createTags(parsedTags as Set<string>, snippet.id);

    const created = await SnippetModel.findOne({
      where: { id: snippet.id },
      include: [
        {
          model: TagModel,
          as: 'tags',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        }
      ]
    });

    const raw = created!.get({ plain: true });
    return {
      content: [{ type: 'text', text: JSON.stringify({ ...raw, tags: raw.tags?.map((t: any) => t.name) || [] }, null, 2) }]
    };
  });

  // Update snippet
  server.registerTool('update_snippet', {
    title: 'Update snippet',
    description: 'Update an existing snippet by ID, modifying any provided fields',
    inputSchema: z.object({
      id: z.string(),
      title: z.string().default(''),
      description: z.string().default(''),
      code: z.string().default(''),
      language: z.string().default(''),
      docs: z.string().default(''),
      tags: z.array(z.string()).default([]),
      pinned: z.boolean().default(false)
    })
  }, async (args: any) => {
    const snippet = await SnippetModel.findOne({
      where: { id: args.id }
    });

    if (!snippet) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: 'Snippet not found' }) }]
      };
    }

    await snippet.update({
      title: args.title || snippet.title,
      description: args.description || snippet.description,
      code: args.code || snippet.code,
      language: args.language || snippet.language,
      docs: args.docs || snippet.docs,
      isPinned: args.pinned ? 1 : 0
    });

    await Snippet_TagModel.destroy({ where: { snippet_id: args.id } });
    
    const parsedTags = tagParser([...(args.tags || []), (args.language || snippet.language).toLowerCase()]);
    await createTags(parsedTags, parseInt(args.id));

    const updated = await SnippetModel.findOne({
      where: { id: args.id },
      include: [
        {
          model: TagModel,
          as: 'tags',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        }
      ]
    });

    const raw = updated!.get({ plain: true });
    return {
      content: [{ type: 'text', text: JSON.stringify({ ...raw, tags: raw.tags?.map((t: any) => t.name) || [] }, null, 2) }]
    };
  });

  // Delete snippet
  server.registerTool('delete_snippet', {
    title: 'Delete snippet',
    description: 'Delete a snippet by ID',
    inputSchema: z.object({
      id: z.string()
    })
  }, async (args: any) => {
    const snippet = await SnippetModel.findOne({
      where: { id: args.id }
    });

    if (!snippet) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: 'Snippet not found' }) }]
      };
    }

    await snippet.destroy();

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, message: `Snippet ${args.id} deleted` }) }]
    };
  });

  // Search snippets
  server.registerTool('search_snippets', {
    title: 'Search snippets',
    description: 'Search snippets by query string, matching title or description',
    inputSchema: z.object({
      query: z.string()
    })
  }, async (args: any) => {
    const { query } = args;
    const { Op } = await import('sequelize');

    const snippets = await SnippetModel.findAll({
      where: query ? {
        [Op.or]: [
          { title: { [Op.substring]: query } },
          { description: { [Op.substring]: query } }
        ]
      } : {},
      include: [
        {
          model: TagModel,
          as: 'tags',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        }
      ],
      order: [['isPinned', 'DESC'], ['createdAt', 'DESC']]
    });

    const data = snippets.map((snippet: any) => {
      const raw = snippet.get({ plain: true });
      return {
        ...raw,
        tags: raw.tags?.map((t: any) => t.name) || []
      };
    });

    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }]
    };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('MCP Server started for snippet-box');
}
