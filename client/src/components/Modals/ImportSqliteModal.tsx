import { useState } from 'react';
import axios from 'axios';

interface Props {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportSqliteModal = (props: Props): JSX.Element => {
  const { show, onClose, onSuccess } = props;
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileData, setFileData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!show) return <></>;

  const handleFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.sqlite3,.db,.sqlite';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (ev) => {
          // Convert to base64
          const base64 = btoa(
            new Uint8Array(ev.target?.result as ArrayBuffer)
              .reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          setFileData(base64);
        };
        reader.readAsArrayBuffer(file);
      }
    };
    input.click();
  };

  const handleImport = async () => {
    if (!fileData) {
      setError('Please select a SQLite file');
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await axios.post('/api/snippets/import/sqlite', {
        database: fileData
      });
      const data = res.data.data;
      setResult(`Imported: ${data.imported}, Errors: ${data.errors}`);
      if (data.errorDetails?.length) {
        setResult(prev => prev + `\nFirst error: ${data.errorDetails[0].error}`);
      }
      setFileName(null);
      setFileData(null);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ display: 'block', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Import SQLite Database</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">
                Select a SQLite database file
                <span className="ms-2">
                  <small className="text-muted">
                    (.sqlite3, .db, .sqlite — from pawelmalak/snippet-box)
                  </small>
                </span>
              </label>
              <div className="d-flex gap-2 mb-2 align-items-center">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={handleFileSelect}
                >
                  Select File
                </button>
                {fileName && (
                  <span className="text-muted">
                    {fileName}
                  </span>
                )}
              </div>
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            {result && (
              <div className="alert alert-success">
                <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{result}</pre>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleImport}
              disabled={loading || !fileData}
            >
              {loading ? 'Importing...' : 'Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
