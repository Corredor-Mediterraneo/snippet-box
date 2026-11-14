import { useState, useContext, useRef } from 'react';
import axios from 'axios';
import { SnippetsContext } from '../../store';
import { SearchQuery } from '../../typescript/interfaces';

interface Props {
  show: boolean;
  onClose: () => void;
}

interface Suggestions {
  tags: string[];
  languages: string[];
}

export const AdvancedSearchModal = (props: Props): JSX.Element => {
  const { show, onClose } = props;
  const { searchSnippets } = useContext(SnippetsContext);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [langInput, setLangInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'createdAt' | 'title'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [langSuggestions, setLangSuggestions] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [showLangSuggestions, setShowLangSuggestions] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  if (!show) {
    return <></>;
  }

  const fetchSuggestions = async (query: string, type: 'tags' | 'languages') => {
    if (query.length < 1) {
      if (type === 'tags') setTagSuggestions([]);
      else setLangSuggestions([]);
      return;
    }
    try {
      const res = await axios.get('/api/snippets/search/suggestions', {
        params: { q: query, type }
      });
      const data: Suggestions = res.data.data;
      if (type === 'tags') setTagSuggestions(data.tags);
      else setLangSuggestions(data.languages);
    } catch {
      // Ignore errors
    }
  };

  const handleTagInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagInput(value);
    fetchSuggestions(value, 'tags');
    setShowTagSuggestions(true);
  };

  const handleLangInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLangInput(value);
    fetchSuggestions(value, 'languages');
    setShowLangSuggestions(true);
  };

  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (t && !selectedTags.includes(t)) {
      setSelectedTags([...selectedTags, t]);
    }
    setTagInput('');
    setShowTagSuggestions(false);
  };

  const addLang = (lang: string) => {
    const l = lang.trim().toLowerCase();
    if (l && !selectedLangs.includes(l)) {
      setSelectedLangs([...selectedLangs, l]);
    }
    setLangInput('');
    setShowLangSuggestions(false);
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const removeLang = (lang: string) => {
    setSelectedLangs(selectedLangs.filter(l => l !== lang));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, items: string[], addFn: (item: string) => void) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addFn(tagInput);
    }
  };

  const handleSearch = () => {
    const queryObj: SearchQuery = {
      query: '',
      tags: selectedTags,
      languages: selectedLangs,
      title: title.trim() || undefined,
      content: content.trim() || undefined,
      sortBy,
      sortOrder
    };
    searchSnippets(queryObj);
    onClose();
  };

  const handleClear = () => {
    setTitle('');
    setContent('');
    setTagInput('');
    setLangInput('');
    setSelectedTags([]);
    setSelectedLangs([]);
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  const handleKeyDownGlobal = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{ display: 'block', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
      onKeyDown={handleKeyDownGlobal}
    >
      <div className="modal-dialog modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Advanced Search</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            {/* Title field */}
            <div className="mb-3">
              <label className="form-label">Title</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search by title..."
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            {/* Content field */}
            <div className="mb-3">
              <label className="form-label">Content (code & docs)</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search in code and documentation..."
                value={content}
                onChange={e => setContent(e.target.value)}
              />
            </div>

            {/* Tags with autocomplete */}
            <div className="mb-3">
              <label className="form-label">Tags</label>
              <div className="position-relative">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Type and press Enter to add tags..."
                  value={tagInput}
                  onChange={handleTagInput}
                  onKeyDown={e => handleKeyDown(e, tagSuggestions, addTag)}
                  onFocus={() => tagSuggestions.length > 0 && setShowTagSuggestions(true)}
                />
                {showTagSuggestions && tagSuggestions.length > 0 && (
                  <ul className="list-group position-absolute w-100" style={{ zIndex: 1050, maxHeight: '150px', overflowY: 'auto' }}>
                    {tagSuggestions.map((tag, idx) => (
                      <li
                        key={idx}
                        className="list-group-item list-group-item-action px-2 py-1"
                        style={{ cursor: 'pointer', fontSize: '0.875rem' }}
                        onClick={() => addTag(tag)}
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {selectedTags.length > 0 && (
                <div className="mt-2 d-flex flex-wrap gap-1">
                  {selectedTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="badge bg-primary d-inline-flex align-items-center"
                      style={{ fontSize: '0.8rem' }}
                    >
                      {tag}
                      <button
                        type="button"
                        className="btn-close btn-close-white ms-1 p-0"
                        style={{ fontSize: '0.5rem' }}
                        onClick={() => removeTag(tag)}
                      />
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Languages with autocomplete */}
            <div className="mb-3">
              <label className="form-label">Languages</label>
              <div className="position-relative">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Type and press Enter to add languages..."
                  value={langInput}
                  onChange={handleLangInput}
                  onKeyDown={e => handleKeyDown(e, langSuggestions, addLang)}
                  onFocus={() => langSuggestions.length > 0 && setShowLangSuggestions(true)}
                />
                {showLangSuggestions && langSuggestions.length > 0 && (
                  <ul className="list-group position-absolute w-100" style={{ zIndex: 1050, maxHeight: '150px', overflowY: 'auto' }}>
                    {langSuggestions.map((lang, idx) => (
                      <li
                        key={idx}
                        className="list-group-item list-group-item-action px-2 py-1"
                        style={{ cursor: 'pointer', fontSize: '0.875rem' }}
                        onClick={() => addLang(lang)}
                      >
                        {lang}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {selectedLangs.length > 0 && (
                <div className="mt-2 d-flex flex-wrap gap-1">
                  {selectedLangs.map((lang, idx) => (
                    <span
                      key={idx}
                      className="badge bg-success d-inline-flex align-items-center"
                      style={{ fontSize: '0.8rem' }}
                    >
                      {lang}
                      <button
                        type="button"
                        className="btn-close btn-close-white ms-1 p-0"
                        style={{ fontSize: '0.5rem' }}
                        onClick={() => removeLang(lang)}
                      />
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Sort options */}
            <div className="mb-3">
              <label className="form-label">Sort by</label>
              <div className="d-flex gap-3">
                <div className="form-check">
                  <input
                    type="radio"
                    className="form-check-input"
                    id="sortDate"
                    name="sortBy"
                    value="createdAt"
                    checked={sortBy === 'createdAt'}
                    onChange={() => setSortBy('createdAt')}
                  />
                  <label className="form-check-label" htmlFor="sortDate">Date</label>
                </div>
                <div className="form-check">
                  <input
                    type="radio"
                    className="form-check-input"
                    id="sortTitle"
                    name="sortBy"
                    value="title"
                    checked={sortBy === 'title'}
                    onChange={() => setSortBy('title')}
                  />
                  <label className="form-check-label" htmlFor="sortTitle">Title</label>
                </div>
              </div>
              <div className="d-flex gap-3 mt-2">
                <div className="form-check">
                  <input
                    type="radio"
                    className="form-check-input"
                    id="sortAsc"
                    name="sortOrder"
                    value="asc"
                    checked={sortOrder === 'asc'}
                    onChange={() => setSortOrder('asc')}
                  />
                  <label className="form-check-label" htmlFor="sortAsc">Ascending</label>
                </div>
                <div className="form-check">
                  <input
                    type="radio"
                    className="form-check-input"
                    id="sortDesc"
                    name="sortOrder"
                    value="desc"
                    checked={sortOrder === 'desc'}
                    onChange={() => setSortOrder('desc')}
                  />
                  <label className="form-check-label" htmlFor="sortDesc">Descending</label>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-light" onClick={handleClear}>
              Clear
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSearch}>
              Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
