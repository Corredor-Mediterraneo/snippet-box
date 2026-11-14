import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Route } from '../../typescript/interfaces';
import routeConfig from './routes.json';
import {
  ImportJsonModal,
  ImportObsidianModal,
  DeduplicateModal,
  BackupModal
} from '../Modals';

export const Navbar = (): JSX.Element => {
  const routes = routeConfig.routes as Route[];
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [showObsidianImport, setShowObsidianImport] = useState(false);
  const [showDeduplicate, setShowDeduplicate] = useState(false);
  const [showBackup, setShowBackup] = useState(false);

  const handleImportSuccess = () => {
    window.location.reload();
  };

  return (
    <>
      <nav className='navbar navbar-dark bg-dark navbar-expand'>
        <div className='container-fluid'>
          <ul className='navbar-nav'>
            {routes.map(({ name, dest }, idx) => (
              <li className='nav-item' key={idx}>
                <NavLink to={dest} className='nav-link'>
                  {name}
                </NavLink>
              </li>
            ))}
          </ul>
          <ul className='navbar-nav ms-auto'>
            <li className='nav-item dropdown'>
              <a
                className='nav-link dropdown-toggle'
                href='#'
                role='button'
                onClick={e => e.preventDefault()}
                data-bs-toggle='dropdown'
                aria-expanded='false'
              >
                Import
              </a>
              <ul className='dropdown-menu dropdown-menu-end'>
                <li>
                  <button
                    className='dropdown-item'
                    onClick={() => setShowJsonImport(true)}
                  >
                    Import JSON
                  </button>
                </li>
                <li>
                  <button
                    className='dropdown-item'
                    onClick={() => setShowObsidianImport(true)}
                  >
                    Import Obsidian
                  </button>
                </li>
              </ul>
            </li>
            <li className='nav-item'>
              <button
                className='nav-link btn'
                onClick={() => setShowDeduplicate(true)}
                style={{ color: '#adb5bd' }}
              >
                Remove Duplicates
              </button>
            </li>
            <li className='nav-item'>
              <button
                className='nav-link btn'
                onClick={() => setShowBackup(true)}
                style={{ color: '#adb5bd' }}
              >
                Backup / Restore
              </button>
            </li>
          </ul>
        </div>
      </nav>

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
      <DeduplicateModal
        show={showDeduplicate}
        onClose={() => setShowDeduplicate(false)}
        onSuccess={handleImportSuccess}
      />
      <BackupModal
        show={showBackup}
        onClose={() => setShowBackup(false)}
      />
    </>
  );
};
