import { useState } from 'react';
import axios from 'axios';

interface Props {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeduplicateModal = (props: Props): JSX.Element => {
  const { show, onClose, onSuccess } = props;
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [duplicateCount, setDuplicateCount] = useState<number | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!show) return <></>;

  const handleCheckDuplicates = async () => {
    setChecking(true);
    setError(null);
    setDuplicateCount(null);

    try {
      const res = await axios.get('/api/snippets/duplicates/count');
      const data = res.data.data;
      setDuplicateCount(data.duplicatesFound);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Check failed');
    } finally {
      setChecking(false);
    }
  };

  const handleRemoveDuplicates = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await axios.post('/api/snippets/deduplicate');
      const data = res.data.data;
      setResult(
        `Removed: ${data.removed} duplicates\nKept: ${data.kept} unique snippets`
      );
      setDuplicateCount(null);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Deduplication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ display: 'block', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Remove Duplicate Snippets</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <p>
              This will find snippets with the same title and code, keeping only the oldest one.
            </p>

            <div className="d-grid gap-2 mb-3">
              <button
                type="button"
                className="btn btn-outline-info btn-sm"
                onClick={handleCheckDuplicates}
                disabled={checking}
              >
                {checking ? 'Checking...' : 'Check for duplicates'}
              </button>
            </div>

            {duplicateCount !== null && (
              <div className={`alert ${duplicateCount > 0 ? 'alert-warning' : 'alert-success'}`}>
                {duplicateCount > 0
                  ? `${duplicateCount} duplicate(s) found`
                  : 'No duplicates found'}
              </div>
            )}

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
              className="btn btn-danger"
              onClick={handleRemoveDuplicates}
              disabled={loading || (duplicateCount !== null && duplicateCount === 0)}
            >
              {loading ? 'Removing...' : 'Remove Duplicates'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
