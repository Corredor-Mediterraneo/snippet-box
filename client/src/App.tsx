import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navigation/Navbar';
import { Editor, Home, Snippet, Snippets } from './containers';
import { SnippetsContextProvider } from './store';
import {
  ImportJsonModal,
  ImportObsidianModal,
  ImportSqliteModal,
  ImportMarkdownModal,
  DeduplicateModal,
  BackupModal
} from './components/Modals';

export const App = () => {
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [showObsidianImport, setShowObsidianImport] = useState(false);
  const [showSqliteImport, setShowSqliteImport] = useState(false);
  const [showMarkdownImport, setShowMarkdownImport] = useState(false);
  const [showDeduplicate, setShowDeduplicate] = useState(false);
  const [showBackup, setShowBackup] = useState(false);

  const handleImportSuccess = () => {
    window.location.reload();
  };

  return (
    <BrowserRouter>
      <SnippetsContextProvider>
        <Navbar
          onShowJsonImport={() => setShowJsonImport(true)}
          onShowObsidianImport={() => setShowObsidianImport(true)}
          onShowSqliteImport={() => setShowSqliteImport(true)}
          onShowMarkdownImport={() => setShowMarkdownImport(true)}
          onShowDeduplicate={() => setShowDeduplicate(true)}
          onShowBackup={() => setShowBackup(true)}
        />
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/snippets' element={<Snippets />} />
          <Route path='/snippet/:id' element={<Snippet />} />
          <Route path='/editor/:id?' element={<Editor />} />
        </Routes>
        <ImportJsonModal
          show={showJsonImport}
          onClose={() => setShowJsonImport(false)}
          onSuccess={handleImportSuccess}
        />
        <ImportObsidianModal
          show={showObsidianImport}
          onClose={() => setShowObsidianImport(false)}
          onSuccess={handleImportSuccess}
        />
        <ImportSqliteModal
          show={showSqliteImport}
          onClose={() => setShowSqliteImport(false)}
          onSuccess={handleImportSuccess}
        />
        <ImportMarkdownModal
          show={showMarkdownImport}
          onClose={() => setShowMarkdownImport(false)}
          onSuccess={handleImportSuccess}
        />
        <DeduplicateModal
          show={showDeduplicate}
          onClose={() => setShowDeduplicate(false)}
          onSuccess={handleImportSuccess}
        />
        <BackupModal
          show={showBackup}
          onClose={() => setShowBackup(false)}
        />
      </SnippetsContextProvider>
    </BrowserRouter>
  );
};
