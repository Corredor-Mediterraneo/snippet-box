import { TagCount, NewSnippet, Snippet, SearchQuery } from '.';

export interface Context {
  snippets: Snippet[];
  searchResults: Snippet[];
  currentSnippet: Snippet | null;
  tagCount: TagCount[];
  selectedSnippets: Set<number>;
  getSnippets: () => void;
  getSnippetById: (id: number) => void;
  setSnippet: (id: number) => void;
  createSnippet: (snippet: NewSnippet) => void;
  updateSnippet: (snippet: NewSnippet, id: number, isLocal?: boolean) => void;
  deleteSnippet: (id: number) => void;
  toggleSnippetPin: (id: number) => void;
  countTags: () => void;
  searchSnippets: (query: SearchQuery) => void;
  toggleSnippetSelection: (id: number) => void;
  clearSelection: () => void;
  exportAllAsJson: () => Promise<any[]>;
  exportSelectedAsJson: (ids: number[]) => Promise<any[]>;
  exportByTagAsMarkdown: (tag: string) => Promise<string>;
  exportSelectedAsMarkdown: (ids: number[]) => Promise<string>;
}
