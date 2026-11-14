import { useEffect, useContext, Fragment } from 'react';
import { SnippetsContext } from '../store';
import { Layout, PageHeader, EmptyState } from '../components/UI';
import { SnippetGrid } from '../components/Snippets/SnippetGrid';
import { SearchBar } from '../components/SearchBar';

interface Props {
  onShowAdvanced?: () => void;
  onShowHelp?: () => void;
}

export const Home = (props: Props): JSX.Element => {
  const { snippets, getSnippets, searchResults } = useContext(SnippetsContext);
  const { onShowAdvanced, onShowHelp } = props;

  useEffect(() => {
    getSnippets();
  }, []);

  return (
    <Layout>
      {snippets.length === 0 ? (
        <EmptyState />
      ) : (
        <Fragment>
          <PageHeader title='Search' />
          <SearchBar onShowAdvanced={onShowAdvanced} onShowHelp={onShowHelp} />
          <div className='col-12 mb-4'>
            <SnippetGrid snippets={searchResults} />
          </div>

          {snippets.some(s => s.isPinned) && (
            <Fragment>
              <PageHeader title='Pinned snippets' />
              <div className='col-12 mt-3'>
                <SnippetGrid snippets={snippets.filter(s => s.isPinned)} />
              </div>
            </Fragment>
          )}
        </Fragment>
      )}
    </Layout>
  );
};
