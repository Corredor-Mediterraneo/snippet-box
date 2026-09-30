import { useState, createContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Context,
  Snippet,
  Response,
  TagCount,
  NewSnippet,
  SearchQuery
} from '../typescript/interfaces';

export const SnippetsContext = createContext<Context>({
  snippets: [],
  searchResults: [],
  currentSnippet: null,
  tagCount: [],
  selectedSnippets: new Set<number>(),
  getSnippets: () => {},
  getSnippetById: (id: number) => {},
  setSnippet: (id: number) => {},
  createSnippet: (snippet: NewSnippet) => {},
  updateSnippet: (snippet: NewSnippet, id: number, isLocal?: boolean) => {},
  deleteSnippet: (id: number) => {},
  toggleSnippetPin: (id: number) => {},
  countTags: () => {},
  searchSnippets: (query: SearchQuery) => {},
  toggleSnippetSelection: (id: number) => {},
  clearSelection: () => {},
  exportAllAsJson: () => Promise.resolve([]),
  exportSelectedAsJson: (ids: number[]) => Promise.resolve([]),
  exportByTagAsMarkdown: (tag: string) => Promise.resolve(''),
  exportSelectedAsMarkdown: (ids: number[]) => Promise.resolve('')
});

interface Props {
  children: JSX.Element | JSX.Element[];
}

export const SnippetsContextProvider = (props: Props): JSX.Element => {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [searchResults, setSearchResults] = useState<Snippet[]>([]);
  const [currentSnippet, setCurrentSnippet] = useState<Snippet | null>(null);
  const [tagCount, setTagCount] = useState<TagCount[]>([]);
  const [selectedSnippets, setSelectedSnippets] = useState<Set<number>>(new Set());

  const navigate = useNavigate();

  const redirectOnError = () => {
    navigate('/');
  };

  const getSnippets = (): void => {
    axios
      .get<Response<Snippet[]>>('/api/snippets')
      .then(res => setSnippets(res.data.data))
      .catch(err => redirectOnError());
  };

  const getSnippetById = (id: number): void => {
    axios
      .get<Response<Snippet>>(`/api/snippets/${id}`)
      .then(res => setCurrentSnippet(res.data.data))
      .catch(err => redirectOnError());
  };

  const setSnippet = (id: number): void => {
    if (id < 0) {
      setCurrentSnippet(null);
      return;
    }

    getSnippetById(id);

    const snippet = snippets.find(s => s.id === id);

    if (snippet) {
      setCurrentSnippet(snippet);
    }
  };

  const createSnippet = (snippet: NewSnippet): void => {
    axios
      .post<Response<Snippet>>('/api/snippets', snippet)
      .then(res => {
        setSnippets([...snippets, res.data.data]);
        setCurrentSnippet(res.data.data);
        navigate(`/snippet/${res.data.data.id}`);
      })
      .catch(err => redirectOnError());
  };

  const updateSnippet = (
    snippet: NewSnippet,
    id: number,
    isLocal?: boolean
  ): void => {
    axios
      .put<Response<Snippet>>(`/api/snippets/${id}`, snippet)
      .then(res => {
        const oldSnippetIdx = snippets.findIndex(s => s.id === id);
        setSnippets([
          ...snippets.slice(0, oldSnippetIdx),
          res.data.data,
          ...snippets.slice(oldSnippetIdx + 1)
        ]);
        setCurrentSnippet(res.data.data);

        if (!isLocal) {
          navigate(`/snippet/${res.data.data.id}`);
        }
      })
      .catch(err => redirectOnError());
  };

  const deleteSnippet = (id: number): void => {
    if (window.confirm('Are you sure you want to delete this snippet?')) {
      axios
        .delete<Response<{}>>(`/api/snippets/${id}`)
        .then(res => {
          const deletedSnippetIdx = snippets.findIndex(s => s.id === id);
          setSnippets([
            ...snippets.slice(0, deletedSnippetIdx),
            ...snippets.slice(deletedSnippetIdx + 1)
          ]);
          setSnippet(-1);
          navigate('/snippets');
        })
        .catch(err => redirectOnError());
    }
  };

  const toggleSnippetPin = (id: number): void => {
    const snippet = snippets.find(s => s.id === id);

    if (snippet) {
      updateSnippet({ ...snippet, isPinned: !snippet.isPinned }, id, true);
    }
  };

  const countTags = (): void => {
    axios
      .get<Response<TagCount[]>>('/api/snippets/statistics/count')
      .then(res => setTagCount(res.data.data))
      .catch(err => redirectOnError());
  };

  const searchSnippets = (query: SearchQuery): void => {
    axios
      .post<Response<Snippet[]>>('/api/snippets/search', query)
      .then(res => {
        setSearchResults(res.data.data);
        console.log(res.data.data);
      })
      .catch(err => console.log(err));
  };

  // Selection functions for export
  const toggleSnippetSelection = (id: number): void => {
    const newSelection = new Set(selectedSnippets);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedSnippets(newSelection);
  };

  const clearSelection = (): void => {
    setSelectedSnippets(new Set());
  };

  // Export functions
  const exportAllAsJson = async (): Promise<any[]> => {
    try {
      const res = await axios.post<Response<Snippet[]>>('/api/snippets/export');
      return res.data.data;
    } catch (err) {
      console.error('Export failed:', err);
      return [];
    }
  };

  const exportSelectedAsJson = async (ids: number[]): Promise<any[]> => {
    try {
      const res = await axios.post<Response<Snippet[]>>(
        '/api/snippets/export/json',
        { snippetIds: ids }
      );
      return res.data.data;
    } catch (err) {
      console.error('Export failed:', err);
      return [];
    }
  };

  const exportByTagAsMarkdown = async (tag: string): Promise<string> => {
    try {
      const res = await axios.post<Response<{ content: string; snippetCount: number }>>(
        '/api/snippets/export/markdown',
        { tag }
      );
      return res.data.data.content;
    } catch (err) {
      console.error('Export failed:', err);
      return '';
    }
  };

  const exportSelectedAsMarkdown = async (ids: number[]): Promise<string> => {
    try {
      const res = await axios.post<Response<{ content: string; snippetCount: number }>>(
        '/api/snippets/export/markdown/selected',
        { snippetIds: ids }
      );
      return res.data.data.content;
    } catch (err) {
      console.error('Export failed:', err);
      return '';
    }
  };

  const context = {
    snippets,
    searchResults,
    currentSnippet,
    tagCount,
    selectedSnippets,
    getSnippets,
    getSnippetById,
    setSnippet,
    createSnippet,
    updateSnippet,
    deleteSnippet,
    toggleSnippetPin,
    countTags,
    searchSnippets,
    toggleSnippetSelection,
    clearSelection,
    exportAllAsJson,
    exportSelectedAsJson,
    exportByTagAsMarkdown,
    exportSelectedAsMarkdown
  };

  return (
    <SnippetsContext.Provider value={context}>
      {props.children}
    </SnippetsContext.Provider>
  );
};
