import { useState, useEffect } from 'react';
import axios from 'axios';

interface Props {
  show: boolean;
  onClose: () => void;
}

export const BackupModal = (props: Props): JSX.Element => {
  const { show, onClose } = props;
  const [configured, setConfigured] = useState(false);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [backups, setBackups] = useState<any[]>([]);

  if (!show) return <></>;

  useEffect(() => {
    if (show) {
      checkStatus();
    }
  }, [show]);

  const checkStatus = async () => {
    try {
      const res = await axios.get('/api/backup/status');
      setConfigured(res.data.configured);
      setReady(res.data.ready);
    } catch {
      setConfigured(false);
      setReady(false);
    }
  };

  const handleBackup = async () => {
    if (!apiKey.trim()) {
      setError('Please enter the Backup API key');
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await axios.post(
        '/api/backup',
        {},
        { headers: { 'x-backup-api-key': apiKey } }
      );
      setResult(`Backup successful: ${res.data.filename}`);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Backup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!apiKey.trim()) {
      setError('Please enter the Backup API key');
      return;
    }

    if (!window.confirm('This will replace your current database with the latest backup. Continue?')) {
      return;
    }

    setRestoring(true);
    setResult(null);
    setError(null);

    try {
      await axios.post(
        '/api/backup/restore',
        {},
        { headers: { 'x-backup-api-key': apiKey } }
      );
      setResult('Restore successful! Reloading...');
      setTimeout(() => window.location.reload(), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Restore failed');
    } finally {
      setRestoring(false);
    }
  };

  const handleListBackups = async () => {
    if (!apiKey.trim()) {
      setError('Please enter the Backup API key');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await axios.get(
        '/api/backup/list',
        { headers: { 'x-backup-api-key': apiKey } }
      );
      setBackups(res.data.backups || []);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'List failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Google Drive Backup</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            {!configured ? (
              <div className="alert alert-warning">
                <strong>Not configured</strong>
                <p className="mb-0">
                  Google Drive Backup requires configuring credentials in the server environment:
                  GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, and BACKUP_API_KEY.
                </p>
              </div>
            ) : (
              <>
                <div className={`alert ${ready ? 'alert-success' : 'alert-warning'}`}>
                  {ready
                    ? 'Google Drive Backup is configured and ready'
                    : 'Google Drive is configured but BACKUP_API_KEY is missing'}
                </div>

                <div className="mb-3">
                  <label className="form-label">Backup API Key</label>
                  <input
                    type="password"
                    className="form-control"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="Enter your BACKUP_API_KEY"
                  />
                </div>

                <div className="d-grid gap-2">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleBackup}
                    disabled={loading || restoring || !ready}
                  >
                    {loading ? 'Backing up...' : 'Create Backup'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-info btn-sm"
                    onClick={handleListBackups}
                    disabled={loading || restoring || !ready}
                  >
                    List Backups
                  </button>
                  <button
                    type="button"
                    className="btn btn-warning btn-sm"
                    onClick={handleRestore}
                    disabled={restoring || loading || !ready}
                  >
                    {restoring ? 'Restoring...' : 'Restore Latest Backup'}
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
              </>
            )}

            {error && <div className="alert alert-danger mt-2">{error}</div>}
            {result && <div className="alert alert-success mt-2">{result}</div>}
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
