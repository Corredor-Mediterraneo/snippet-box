import { useState, useRef } from 'react';
import axios from 'axios';

interface Props {
  show: boolean;
  onClose: () => void;
}

export const BackupModal = (props: Props): JSX.Element => {
  const { show, onClose } = props;
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [listing, setListing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [backups, setBackups] = useState<any[]>([]);
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const initialized = useRef(false);

  if (!show) {
    initialized.current = false;
    return <></>;
  }

  // Load saved credentials on first open
  if (!initialized.current) {
    initialized.current = true;
    const savedToken = localStorage.getItem('gdrive_access_token');
    const savedRefresh = localStorage.getItem('gdrive_refresh_token');
    if (savedToken) {
      setAccessToken(savedToken);
    }
    if (savedRefresh) {
      setRefreshToken(savedRefresh);
    }
  }

  const handleBackup = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await axios.post('/api/backup', {
        accessToken: accessToken.trim(),
        refreshToken: refreshToken.trim() || undefined,
      });
      // Save tokens for next time
      localStorage.setItem('gdrive_access_token', accessToken.trim());
      if (refreshToken.trim()) {
        localStorage.setItem('gdrive_refresh_token', refreshToken.trim());
      }
      setResult(`Backup successful: ${res.data.filename}`);
    } catch (err: any) {
      setError(err.response?.data?.details || err.response?.data?.error || err.message || 'Backup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!window.confirm('This will replace your current database with the latest backup. Continue?')) {
      return;
    }

    setRestoring(true);
    setResult(null);
    setError(null);

    try {
      await axios.post('/api/backup/restore', {
        accessToken: accessToken.trim(),
        refreshToken: refreshToken.trim() || undefined,
      });
      setResult('Restore successful! Reloading...');
      setTimeout(() => window.location.reload(), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Restore failed');
    } finally {
      setRestoring(false);
    }
  };

  const handleListBackups = async () => {
    setListing(true);
    setError(null);

    try {
      const res = await axios.get('/api/backup/list', {
        params: { accessToken: accessToken.trim() }
      });
      setBackups(res.data.backups || []);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'List failed');
    } finally {
      setListing(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ display: 'block', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Google Drive Backup</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <div className="alert alert-info">
              <strong>📋 Cómo obtener los tokens desde Google OAuth 2.0 Playground:</strong>
              <ol className="mb-0 mt-1" style={{ fontSize: '0.875rem' }}>
                <li>Visita <a href="https://developers.google.com/oauthplayground" target="_blank" rel="noreferrer">OAuth 2.0 Playground</a></li>
                <li>En Settings (⚙️ arriba a la derecha), marca <code>Use your own OAuth credentials</code> (opcional) o usa las credenciales por defecto</li>
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
                value={accessToken}
                onChange={e => setAccessToken(e.target.value)}
                placeholder="ya29.a0AehfT..."
                style={{ fontSize: '0.8rem' }}
              />
              {accessToken && (
                <small className="text-success">✓ Token cargado ({accessToken.length} caracteres)</small>
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
                value={refreshToken}
                onChange={e => setRefreshToken(e.target.value)}
                placeholder="1//04_I39eaG..."
                style={{ fontSize: '0.8rem' }}
              />
              {refreshToken && (
                <small className="text-success">✓ Refresh token cargado ({refreshToken.length} caracteres)</small>
              )}
            </div>

            <div className="alert alert-warning" style={{ fontSize: '0.8rem' }}>
              <strong>⚠️ Importante:</strong> El Access token expira en ~1 hora. Si no pones el Refresh token, tendrás que obtener un nuevo Access token cada hora.
            </div>

            <div className="d-grid gap-2">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleBackup}
                disabled={loading || restoring || !accessToken.trim()}
              >
                {loading ? '⏳ Backing up...' : '📦 Create Backup'}
              </button>
              <button
                type="button"
                className="btn btn-outline-info btn-sm"
                onClick={handleListBackups}
                disabled={listing || loading || restoring || !accessToken.trim()}
              >
                {listing ? '⏳ Loading...' : '📋 List Backups'}
              </button>
              <button
                type="button"
                className="btn btn-warning btn-sm"
                onClick={handleRestore}
                disabled={restoring || loading || !accessToken.trim()}
              >
                {restoring ? '⏳ Restoring...' : '🔄 Restore Latest Backup'}
              </button>
            </div>

            {backups.length > 0 && (
              <div className="mt-3">
                <h6>Available Backups</h6>
                <ul className="list-group">
                  {backups.map((b, i) => (
                    <li key={i} className="list-group-item list-group-item-sm">
                      <small>{b.name}</small><br />
                      <small className="text-muted">
                        {new Date(b.modifiedTime).toLocaleString()}
                      </small>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {error && <div className="alert alert-danger mt-2">❌ {error}</div>}
            {result && <div className="alert alert-success mt-2">✅ {result}</div>}
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
