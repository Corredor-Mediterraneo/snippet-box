import { useState, useRef } from 'react';
import axios from 'axios';

interface Props {
  show: boolean;
  onClose: () => void;
}

interface DriveCredentials {
  accessToken: string;
  refreshToken: string;
}

export const SettingsModal = (props: Props): JSX.Element => {
  const { show, onClose } = props;
  const [credentials, setCredentials] = useState<DriveCredentials>({
    accessToken: '',
    refreshToken: ''
  });
  const [saved, setSaved] = useState(false);
  const [result_, setResult_] = useState<string | null>(null);
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
    const savedToken = localStorage.getItem('gdrive_access_token');
    const savedRefresh = localStorage.getItem('gdrive_refresh_token');
    if (savedToken) {
      setCredentials(prev => ({ ...prev, accessToken: savedToken }));
    }
    if (savedRefresh) {
      setCredentials(prev => ({ ...prev, refreshToken: savedRefresh }));
    }
    axios.get('/api/backup/status')
      .then(res => {
        setStatus(res.data.configured === true ? 'configured' : 'not-configured');
      })
      .catch(() => {
        setStatus('not-configured');
      });
  }

  const handleSave = () => {
    localStorage.setItem('gdrive_access_token', credentials.accessToken.trim());
    if (credentials.refreshToken.trim()) {
      localStorage.setItem('gdrive_refresh_token', credentials.refreshToken.trim());
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    setCredentials({ accessToken: '', refreshToken: '' });
    localStorage.removeItem('gdrive_access_token');
    localStorage.removeItem('gdrive_refresh_token');
    setSaved(false);
  };

  const handleBackup = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/backup', {
        accessToken: credentials.accessToken.trim(),
        refreshToken: credentials.refreshToken.trim() || undefined,
      });
      setResult_(`Backup successful: ${res.data.filename}`);
    } catch (err: any) {
      alert(err.response?.data?.details || err.response?.data?.error || 'Backup failed');
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

              <div className="alert alert-info" style={{ fontSize: '0.875rem' }}>
                <strong>📋 Cómo obtener los tokens desde Google OAuth 2.0 Playground:</strong>
                <ol className="mb-0 mt-1">
                  <li>Visita <a href="https://developers.google.com/oauthplayground" target="_blank" rel="noreferrer">OAuth 2.0 Playground</a></li>
                  <li><strong>Step 1:</strong> Selecciona <code>Drive - https://www.googleapis.com/auth/drive</code> y pulsa <strong>Authorize APIs</strong></li>
                  <li><strong>Step 2:</strong> Pulsa <strong>Exchange authorization code for tokens</strong></li>
                  <li>Aparecerán 2 campos. Copia cada valor en el campo que tenga <strong>el mismo nombre</strong>:</li>
                </ol>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">
                  🔑 Access token <span className="text-danger">*</span>
                </label>
                <p className="text-muted mb-1" style={{ fontSize: '0.8rem' }}>
                  Este es el campo <strong>"Access token"</strong> que aparece en el Step 2 de OAuth Playground.
                  <br/>Empieza con <code>ya29.</code> y es muy largo (~200 caracteres).
                </p>
                <textarea
                  className="form-control font-monospace"
                  rows={3}
                  value={credentials.accessToken}
                  onChange={e => setCredentials({ ...credentials, accessToken: e.target.value })}
                  placeholder="ya29... (paste your access token here)"
                  style={{ fontSize: '0.8rem' }}
                />
                {credentials.accessToken && (
                  <small className="text-success">✓ Token cargado ({credentials.accessToken.length} caracteres)</small>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">
                  🔄 Refresh token <span className="text-muted">(opcional, recomendado)</span>
                </label>
                <p className="text-muted mb-1" style={{ fontSize: '0.8rem' }}>
                  Este es el campo <strong>"Refresh token"</strong> que aparece en el Step 2 de OAuth Playground.
                  <br/>Empieza con <code>1//</code>. Si lo guardas, el backup funcionará incluso después de que expire el Access token.
                </p>
                <textarea
                  className="form-control font-monospace"
                  rows={2}
                  value={credentials.refreshToken}
                  onChange={e => setCredentials({ ...credentials, refreshToken: e.target.value })}
                  placeholder="1//... (paste your refresh token here)"
                  style={{ fontSize: '0.8rem' }}
                />
                {credentials.refreshToken && (
                  <small className="text-success">✓ Refresh token cargado ({credentials.refreshToken.length} caracteres)</small>
                )}
              </div>

              <div className="alert alert-warning" style={{ fontSize: '0.8rem' }}>
                <strong>⚠️ Importante:</strong> El Access token expira en ~1 hora. Si no pones el Refresh token, tendrás que obtener un nuevo Access token cada hora.
              </div>

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={handleSave}
                  disabled={!credentials.accessToken.trim()}
                >
                  💾 Save to Browser
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-success"
                  onClick={handleBackup}
                  disabled={loading || !credentials.accessToken.trim()}
                >
                  {loading ? '⏳ Backing up...' : '📦 Run Backup Now'}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={handleClear}
                >
                  🗑️ Clear
                </button>
              </div>

              {saved && (
                <div className="alert alert-success mt-2 mb-0 py-1" role="alert">
                  <small>✅ Credentials saved!</small>
                </div>
              )}
              {result_ && (
                <div className="alert alert-success mt-2 mb-0 py-1" role="alert">
                  <small>✅ {result_}</small>
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
