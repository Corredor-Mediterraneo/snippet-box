import { useState } from 'react';

interface Props {
  show: boolean;
  onClose: () => void;
}

export const SearchHelpModal = (props: Props): JSX.Element => {
  const { show, onClose } = props;
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'api'>('basic');

  if (!show) return <></>;

  return (
    <div
      className="modal-overlay"
      style={{ display: 'block', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div className="modal-dialog modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Search Help</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            {/* Tabs */}
            <ul className="nav nav-tabs mb-3">
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link ${activeTab === 'basic' ? 'active' : ''}`}
                  onClick={() => setActiveTab('basic')}
                >
                  Basic Search
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link ${activeTab === 'advanced' ? 'active' : ''}`}
                  onClick={() => setActiveTab('advanced')}
                >
                  Advanced Search
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link ${activeTab === 'api' ? 'active' : ''}`}
                  onClick={() => setActiveTab('api')}
                >
                  API Examples
                </button>
              </li>
            </ul>

            {/* Basic Search Tab */}
            {activeTab === 'basic' && (
              <div>
                <h6>Quick Search</h6>
                <p>Use the search bar to find snippets by title or description. Press <kbd>Enter</kbd> to search, <kbd>Esc</kbd> to clear.</p>

                <h6>Filter Syntax</h6>
                <p>You can add filters directly in the search bar:</p>
                <ul>
                  <li>
                    <code>lang:typescript</code> — filter by language
                  </li>
                  <li>
                    <code>lang:python,java</code> — filter by multiple languages
                  </li>
                  <li>
                    <code>tags:react,hooks</code> — filter by tags
                  </li>
                  <li>
                    <code>react hooks lang:typescript tags:ui</code> — combine text with filters
                  </li>
                </ul>

                <h6>Examples</h6>
                <div className="list-group">
                  <div className="list-group-item">
                    <strong>Search text:</strong>
                    <br />
                    <code>database connection</code>
                  </div>
                  <div className="list-group-item">
                    <strong>Language filter:</strong>
                    <br />
                    <code>api lang:typescript</code>
                  </div>
                  <div className="list-group-item">
                    <strong>Tag filter:</strong>
                    <br />
                    <code>utility tags:logging</code>
                  </div>
                  <div className="list-group-item">
                    <strong>Combined:</strong>
                    <br />
                    <code>auth lang:python tags:security,django</code>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Search Tab */}
            {activeTab === 'advanced' && (
              <div>
                <h6>Advanced Search Modal</h6>
                <p>Click the <strong>Advanced</strong> button next to the search bar to open the advanced search form with categorized fields.</p>

                <h6>Fields</h6>
                <ul>
                  <li>
                    <strong>Title</strong> — search only in snippet titles
                  </li>
                  <li>
                    <strong>Content</strong> — search in code and documentation fields
                  </li>
                  <li>
                    <strong>Tags</strong> — type to autocomplete, press Enter to add multiple tags
                  </li>
                  <li>
                    <strong>Languages</strong> — type to autocomplete, press Enter to add multiple languages
                  </li>
                </ul>

                <h6>Sorting</h6>
                <p>Choose how to sort results:</p>
                <ul>
                  <li><strong>Date</strong> — sort by creation date (newest or oldest first)</li>
                  <li><strong>Title</strong> — sort alphabetically by title (A-Z or Z-A)</li>
                </ul>

                <h6>Tips</h6>
                <ul>
                  <li>Combine multiple fields for precise results</li>
                  <li>Tags and languages show autocomplete suggestions as you type</li>
                  <li>Selected tags/languages appear as removable badges</li>
                  <li>Press <kbd>Enter</kbd> anywhere in the modal to execute the search</li>
                  <li>Press <kbd>Esc</kbd> to close without searching</li>
                </ul>
              </div>
            )}

            {/* API Examples Tab */}
            {activeTab === 'api' && (
              <div>
                <h6>Search API Endpoint</h6>
                <p><code>POST /api/snippets/search</code></p>

                <h6>Request Body</h6>
                <pre className="bg-dark text-light p-3" style={{ fontSize: '0.85rem' }}>
{`{
  "query": "react hooks",
  "title": "useEffect",
  "content": "useState",
  "tags": ["react", "hooks"],
  "languages": ["typescript"],
  "sortBy": "createdAt",
  "sortOrder": "desc"
}`}
                </pre>

                <h6>Examples</h6>
                <div className="list-group">
                  <div className="list-group-item">
                    <strong>Full-text search (FTS5):</strong>
                    <br />
                    <code style={{ fontSize: '0.8rem' }}>
                      POST /api/snippets/search {"\n"}
                      {"{"} "query": "react hooks useEffect" {"}"}
                    </code>
                  </div>
                  <div className="list-group-item">
                    <strong>Filter by language:</strong>
                    <br />
                    <code style={{ fontSize: '0.8rem' }}>
                      POST /api/snippets/search {"\n"}
                      {"{"} "languages": ["typescript", "python"] {"}"}
                    </code>
                  </div>
                  <div className="list-group-item">
                    <strong>Filter by tags:</strong>
                    <br />
                    <code style={{ fontSize: '0.8rem' }}>
                      POST /api/snippets/search {"\n"}
                      {"{"} "tags": ["utility", "logging"] {"}"}
                    </code>
                  </div>
                  <div className="list-group-item">
                    <strong>Combined with sorting:</strong>
                    <br />
                    <code style={{ fontSize: '0.8rem' }}>
                      POST /api/snippets/search {"\n"}
                      {"{"} "query": "api", "tags": ["backend"], "sortBy": "title", "sortOrder": "asc" {"}"}
                    </code>
                  </div>
                </div>

                <h6 className="mt-3">Suggestions API</h6>
                <p><code>GET /api/snippets/search/suggestions?q=react&type=tags</code></p>
                <p>Returns autocomplete suggestions for tags and/or languages matching the query.</p>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
