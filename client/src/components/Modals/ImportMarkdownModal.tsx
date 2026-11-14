import { useState } from 'react';
import axios from 'axios';

interface Props {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportMarkdownModal = (props: Props): JSX.Element => {
  const { show, onClose, onSuccess } = props;
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [files, setFiles] = useState<Array<{ name: string; content: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!show) return <></>;

  const handleFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md';
    input.multiple = true;
    input.onchange = (e: Event) => {
      const selectedFiles = (e.target as HTMLInputElement).files;
      if (selectedFiles && selectedFiles.length > 0) {
        const names: string[] = [];
        const fileData: Array<{ name: string; content: string }> = [];

        Array.from(selectedFiles).forEach(file => {
          names.push(file.name);
          const reader = new FileReader();
          reader.onload = (ev) => {
            fileData.push({ name: file.name, content: ev.target?.result as string });
            if (fileData.length === selectedFiles.length) {
              setFiles(prev => [...prev, ...fileData]);
              setFileNames(prev => [...prev, ...names]);
            }
          };
          reader.readAsText(file);
        });
      }
    };
    input.click();
  };

  const handleImport = async () => {
    if (files.length === 0) {
      setError('Please select markdown files');
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await axios.post('/api/snippets/import/markdown', {
        files
      });
      const data = res.data.data;
      setResult(`Imported: ${data.imported}, Skipped: ${data.skipped}, Errors: ${data.errors}`);
      if (data.errorDetails?.length) {
        setResult(prev => prev + `\nFirst error: ${data.errorDetails[0].error}`);
      }
      setFileNames([]);
      setFiles([]);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ display: 'block', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Import Markdown Files</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">
                Select Markdown files (.md)
                <span className="ms-2">
                  <small className="text-muted">
                    (Files with code blocks will be imported as snippets)
                  </small>
                </span>
              </label>
              <div className="d-flex gap-2 mb-2 align-items-center">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={handleFileSelect}
                >
                  Select Files
                </button>
                {fileNames.length > 0 && (
                  <span className="text-muted">
                    {fileNames.length} file(s) selected
                  </span>
                )}
              </div>
              {fileNames.length > 0 && (
                <div className="list-group mt-2" style={{ maxHeight: '200px', overflow: 'auto' }}>
                  {fileNames.map((name, idx) => (
                    <div key={idx} className="list-group-item list-group-item-action">
                      {name}
                    </div>
                  ))}
                </div>
              )}
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
              disabled={loading || files.length === 0}
            >
              {loading ? 'Importing...' : 'Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
