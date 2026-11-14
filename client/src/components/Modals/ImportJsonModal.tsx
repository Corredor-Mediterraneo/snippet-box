import { useState } from 'react';
import axios from 'axios';

interface Props {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportJsonModal = (props: Props): JSX.Element => {
  const { show, onClose, onSuccess } = props;
  const [jsonText, setJsonText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!show) return <></>;

  const handleImport = async () => {
    if (!jsonText.trim()) {
      setError('Please paste JSON content');
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const parsed = JSON.parse(jsonText);
      const res = await axios.post('/api/snippets/import', parsed);
      const data = res.data.data;
      setResult(`Imported: ${data.imported}, Errors: ${data.errors}`);
      if (data.errorDetails?.length) {
        setResult(prev => prev + `\nFirst error: ${data.errorDetails[0].error}`);
      }
      setJsonText('');
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setJsonText(ev.target?.result as string);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Import Snippets (JSON)</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">
                Paste JSON content or load from file
                <span className="ms-2">
                  <small className="text-muted">
                    (Format: {"{"} "snippets": [{"{"} "title": "...", "language": "...", "code": "..." {"}"}] {"}"}{" "}
                  </small>
                </span>
              </label>
              <div className="d-flex gap-2 mb-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={handleLoadFile}
                >
                  Load from file
                </button>
              </div>
              <textarea
                className="form-control"
                rows={12}
                value={jsonText}
                onChange={e => setJsonText(e.target.value)}
                placeholder='{"snippets": [{"title": "...", "language": "...", "code": "..."}]}'
              />
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
              Close
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleImport}
              disabled={loading || !jsonText.trim()}
            >
              {loading ? 'Importing...' : 'Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
