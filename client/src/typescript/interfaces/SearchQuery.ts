export interface SearchQuery {
  query: string;
  tags: string[];
  languages: string[];
  title?: string;
  content?: string;
  sortBy?: 'createdAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}
