import { Fragment, useEffect, useContext, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { SnippetForm } from '../components/Snippets/SnippetForm';
import { Layout, PageHeader } from '../components/UI';
import { SnippetsContext } from '../store';

interface Params {
  id?: string;
}

export const Editor = (): JSX.Element => {
  const { setSnippet: setCurrentSnippet } = useContext(SnippetsContext);
  const [inEdit, setInEdit] = useState(false);

  // Get previous location
  const location = useLocation();
  const from = ((location.state as { from: string } | null) || { from: '/snippets' }).from;

  // Get id
  const { id } = useParams<string>();

  // Set snippet
  useEffect(() => {
    if (id) {
      setCurrentSnippet(+id);
      setInEdit(true);
    }
  }, []);

  return (
    <Layout>
      {inEdit ? (
        <Fragment>
          <PageHeader
            title='Edit snippet'
            prevDest={from}
          />
          <SnippetForm inEdit />
        </Fragment>
      ) : (
        <Fragment>
          <PageHeader title='Add new snippet' />
          <SnippetForm />
        </Fragment>
      )}
    </Layout>
  );
};
