import { Fragment, useContext, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { SnippetCode } from '../components/Snippets/SnippetCode';
import { Layout, PageHeader, Card, Button } from '../components/UI';
import { SnippetsContext } from '../store';
import { SnippetDetails } from '../components/Snippets/SnippetDetails';
import { SnippetDocs } from '../components/Snippets/SnippetDocs';

interface Params {
  id: string;
}

export const Snippet = (): JSX.Element => {
  const {
    currentSnippet,
    getSnippetById,
    exportSelectedAsMarkdown
  } = useContext(SnippetsContext);
  const { id } = useParams<string>();

  // Get previous location
  const location = useLocation();
  const from = ((location.state as { from: string } | null) || { from: '/snippets' }).from;

  useEffect(() => {
    getSnippetById(+id);
  }, []);

  const handleExportMarkdown = async () => {
    if (!currentSnippet) return;
    const content = await exportSelectedAsMarkdown([currentSnippet.id]);
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snippet-${currentSnippet.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      {!currentSnippet ? (
        <div className='col-12'>Loading...</div>
      ) : (
        <Fragment>
          <PageHeader title='' prevDest={from} />
          <div className='col-12 col-md-7 col-lg-8 mt-3'>
            <SnippetCode
              code={currentSnippet.code}
              language={currentSnippet.language}
            />
          </div>
          <div className='col-12 col-md-5 col-lg-4 mt-md-3'>
            <SnippetDetails snippet={currentSnippet} />
            <div className='mt-3 d-grid gap-2'>
              <Button
                text='Export as Markdown'
                color='info'
                small
                handler={handleExportMarkdown}
              />
            </div>
          </div>
          {currentSnippet.docs && (
            <div className='col-12'>
              <Card title='Snippet documentation'>
                <hr />
                <SnippetDocs markdown={currentSnippet.docs} />
              </Card>
            </div>
          )}
        </Fragment>
      )}
    </Layout>
  );
};
