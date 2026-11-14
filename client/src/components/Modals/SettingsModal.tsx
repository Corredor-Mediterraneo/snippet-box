import { useState, useRef } from 'react';
import axios from 'axios';

interface Props {
  show: boolean;
  onClose: () => void;
}

interface DriveCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export const SettingsModal = (props: Props): JSX.Element => {
  const { show, onClose } = props;
  const [credentials, setCredentials] = useState<DriveCredentials>({
    clientId: '',
    clientSecret: '',
    refreshToken: ''
  });
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState<'unknown' | 'configured' | 'not-configured'>('unknown');
  const [loading, setLoading] = useState(false);
  const loadedRef = useRef(false);

  if (!show) {
    loadedRef.current = false;
    return <></>;
  }

  // Initialize only once when modal opens — no useEffect needed
  if (!loadedRef.current) {
    loadedRef.current = true;
    const savedCreds = localStorage.getItem('snip_drive_credentials');
    if (savedCreds) {
      try {
        setCredentials(JSON.parse(savedCreds));
      } catch {
        // Ignore parse errors
      }
    }
    axios.get('/api/backup/status')
      .then(res => {
        setStatus(res.data.data?.configured === true ? 'configured' : 'not-configured');
      })
      .catch(() => {
        setStatus('not-configured');
      });
  }

  const handleSave = () => {
    localStorage.setItem('snip_drive_credentials', JSON.stringify(credentials));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleApplyToServer = async () => {
    setLoading(true);
    try {
      await axios.post('/api/backup/configure', credentials);
      setStatus('configured');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Server-side config not available, credentials saved locally only
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCredentials({ clientId: '', clientSecret: '', refreshToken: '' });
    localStorage.removeItem('snip_drive_credentials');
    setSaved(false);
  };

  const handleBackup = async () => {
    setLoading(true);
    try {
      // Send saved credentials with backup request
      const stored = localStorage.getItem('snip_drive_credentials');
      const creds = stored ? JSON.parse(stored) : credentials;
      await axios.post('/api/backup', creds);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Backup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{ display: 'block', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div className="modal-dialog modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <span className="me-2">⚙️</span>Settings
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            {/* Google Drive Backup Section */}
            <div className="mb-4">
              <h6>Google Drive Backup</h6>
              <p className="text-muted small">
                Configure credentials to enable automatic backups to Google Drive.
                Credentials are stored in your browser's local storage.
              </p>

              {/* Status indicator */}
              <div className="mb-3">
                <span className={`badge ${status === 'configured' ? 'bg-success' : status === 'not-configured' ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                  {status === 'configured' ? '✓ Configured' : status === 'not-configured' ? '⚠ Not configured' : 'Checking...'}
                </span>
              </div>

              <div className="mb-3">
                <label className="form-label">Client ID</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Your Google OAuth Client ID"
                  value={credentials.clientId}
                  onChange={e => setCredentials({ ...credentials, clientId: e.target.value })}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Client Secret</label>
                <input
                  type="password"
                  className="form-control form-control-sm"
                  placeholder="Your Google OAuth Client Secret"
                  value={credentials.clientSecret}
                  onChange={e => setCredentials({ ...credentials, clientSecret: e.target.value })}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Refresh Token</label>
                <input
                  type="password"
                  className="form-control form-control-sm"
                  placeholder="Your Google OAuth Refresh Token"
                  value={credentials.refreshToken}
                  onChange={e => setCredentials({ ...credentials, refreshToken: e.target.value })}
                />
                <div className="form-text">
                  Get a refresh token from the{' '}
                  <a href="https://developers.google.com/oauthplayground/" target="_blank" rel="noreferrer">
                    Google OAuth 2.0 Playground
                  </a>
                  . Select Drive API scopes and exchange for tokens.
                </div>
              </div>

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={handleSave}
                  disabled={!credentials.clientId || !credentials.clientSecret || !credentials.refreshToken}
                >
                  Save to Browser
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-success"
                  onClick={handleBackup}
                  disabled={loading || !credentials.clientId}
                >
                  {loading ? 'Backing up...' : 'Run Backup Now'}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={handleClear}
                >
                  Clear
                </button>
              </div>

              {saved && (
                <div className="alert alert-success mt-2 mb-0 py-1" role="alert">
                  <small>Credentials saved!</small>
                </div>
              )}
            </div>

            {/* Other Settings */}
            <div>
              <h6>About</h6>
              <p className="text-muted small mb-0">
                Snippet Box — Self-hosted snippet manager.
                <br />
                Fork with advanced search, import/export, deduplication, and Google Drive backup.
              </p>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
