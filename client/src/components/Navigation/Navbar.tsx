import { NavLink } from 'react-router-dom';
import { Route } from '../../typescript/interfaces';
import routeConfig from './routes.json';

interface Props {
  onShowJsonImport: () => void;
  onShowObsidianImport: () => void;
  onShowSqliteImport: () => void;
  onShowMarkdownImport: () => void;
  onShowDeduplicate: () => void;
  onShowBackup: () => void;
  onShowSettings: () => void;
}

export const Navbar = (props: Props): JSX.Element => {
  const routes = routeConfig.routes as Route[];
  const { onShowJsonImport, onShowObsidianImport, onShowSqliteImport, onShowMarkdownImport, onShowDeduplicate, onShowBackup, onShowSettings } = props;

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
                    type='button'
                    className='dropdown-item'
                    onClick={onShowJsonImport}
                  >
                    Import JSON
                  </button>
                </li>
                <li>
                  <button
                    type='button'
                    className='dropdown-item'
                    onClick={onShowSqliteImport}
                  >
                    Import SQLite
                  </button>
                </li>
                <li>
                  <button
                    type='button'
                    className='dropdown-item'
                    onClick={onShowMarkdownImport}
                  >
                    Import Markdown
                  </button>
                </li>
                <li>
                  <button
                    type='button'
                    className='dropdown-item'
                    onClick={onShowObsidianImport}
                  >
                    Import Obsidian
                  </button>
                </li>
              </ul>
            </li>
            <li className='nav-item'>
              <button
                type='button'
                className='nav-link btn'
                onClick={onShowDeduplicate}
                style={{ color: '#adb5bd' }}
              >
                Remove Duplicates
              </button>
            </li>
            <li className='nav-item'>
              <button
                type='button'
                className='nav-link btn'
                onClick={onShowBackup}
                style={{ color: '#adb5bd' }}
              >
                Backup / Restore
              </button>
            </li>
            <li className='nav-item'>
              <button
                type='button'
                className='nav-link btn'
                onClick={onShowSettings}
                style={{ color: '#adb5bd', fontSize: '1.2rem' }}
                title='Settings'
              >
                ⚙️
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
};
