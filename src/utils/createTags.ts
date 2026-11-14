import { TagModel, Snippet_TagModel } from '../models';

// In-memory cache for tags to avoid repeated SELECT * queries
let tagCache: Map<string, { id: number; name: string }> | null = null;
let tagCacheTime = 0;
const CACHE_TTL = 30 * 1000; // 30 seconds

async function getTagCache(): Promise<Map<string, { id: number; name: string }>> {
  const now = Date.now();
  if (!tagCache || (now - tagCacheTime) > CACHE_TTL) {
    const tags = await TagModel.findAll({ attributes: ['id', 'name'] });
    tagCache = new Map(tags.map(tag => [tag.name, { id: tag.id, name: tag.name }]));
    tagCacheTime = now;
  }
  return tagCache!;
}

export const createTags = async (
  parsedTags: Set<string>,
  snippetId: number
): Promise<void> => {
  // Get cached tags
  const tagMap = await getTagCache();

  // Find tags that don't exist yet
  const newTags = [...parsedTags].filter(tag => !tagMap.has(tag));

  // Create new tags in parallel
  if (newTags.length > 0) {
    const createdTags = await Promise.all(
      newTags.map(tagName => TagModel.create({ name: tagName }))
    );
    // Update cache with new tags
    for (const tag of createdTags) {
      tagMap.set(tag.name, { id: tag.id, name: tag.name });
    }
  }

  // Associate tags with snippet in parallel
  const associations = [...parsedTags]
    .map(tagName => tagMap.get(tagName))
    .filter((tagObj): tagObj is { id: number; name: string } => tagObj !== undefined);

  if (associations.length > 0) {
    await Promise.all(
      associations.map(tagObj =>
        Snippet_TagModel.create({
          snippet_id: snippetId,
          tag_id: tagObj.id
        })
      )
    );
  }
};
