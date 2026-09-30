import { useEffect, useContext, useState, Fragment } from 'react';
import { SnippetsContext } from '../store';
import { SnippetGrid } from '../components/Snippets/SnippetGrid';
import { Button, Card, EmptyState, Layout } from '../components/UI';
import { Snippet } from '../typescript/interfaces';

export const Snippets = (): JSX.Element => {
  const {
    snippets,
    tagCount,
    getSnippets,
    countTags,
    clearSelection,
    selectedSnippets,
    exportAllAsJson,
    exportSelectedAsMarkdown
  } = useContext(SnippetsContext);

  const [filter, setFilter] = useState<string | null>(null);
  const [localSnippets, setLocalSnippets] = useState<Snippet[]>([]);

  useEffect(() => {
    getSnippets();
    countTags();
  }, []);

  useEffect(() => {
    setLocalSnippets([...snippets]);
  }, [snippets]);

  const filterHandler = (tag: string) => {
    setFilter(tag);
    const filteredSnippets = snippets.filter(s => s.tags.includes(tag));
    setLocalSnippets(filteredSnippets);
  };

  const clearFilterHandler = () => {
    setFilter(null);
    setLocalSnippets([...snippets]);
  };

  const handleExportAllJson = async () => {
    const data = await exportAllAsJson();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'snippets-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSelectedMarkdown = async () => {
    const content = await exportSelectedAsMarkdown(Array.from(selectedSnippets));
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'snippets-selected.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      {snippets.length === 0 ? (
        <EmptyState />
      ) : (
        <Fragment>
          <div className='col-12 col-md-4 col-lg-3'>
            <Card>
              <h5 className='card-title'>All snippets</h5>
              <div className='mb-3 d-flex justify-content-between'>
                <span>Total</span>
                <span>{snippets.length}</span>
              </div>
              <div className='mb-3 d-flex justify-content-between'>
                <span>Selected</span>
                <span>{selectedSnippets.size}</span>
              </div>
              <hr />

              <h5 className='card-title'>Filter by tags</h5>
              <Fragment>
                {tagCount.map((tag, idx) => {
                  const isActiveFilter = filter === tag.name;

                  return (
                    <div
                      key={idx}
                      className={`d-flex justify-content-between cursor-pointer ${
                        isActiveFilter && 'text-success'
                      }`}
                      onClick={() => filterHandler(tag.name)}
                    >
                      <span>{tag.name}</span>
                      <span>{tag.count}</span>
                    </div>
                  );
                })}
              </Fragment>
              <div className='d-grid mt-3'>
                <Button
                  text='Clear filters'
                  color='secondary'
                  small
                  outline
                  handler={clearFilterHandler}
                />
              </div>
              <hr />
              <h5 className='card-title'>Export</h5>
              <div className='d-grid gap-2'>
                <Button
                  text='Export all as JSON'
                  color='info'
                  small
                  handler={handleExportAllJson}
                />
                <Button
                  text={`Export ${selectedSnippets.size} selected as Markdown`}
                  color='warning'
                  small
                  disabled={selectedSnippets.size === 0}
                  handler={handleExportSelectedMarkdown}
                />
              </div>
            </Card>
          </div>
          <div className='col-12 col-md-8 col-lg-9'>
            <SnippetGrid snippets={localSnippets} />
          </div>
        </Fragment>
      )}
    </Layout>
  );
};
