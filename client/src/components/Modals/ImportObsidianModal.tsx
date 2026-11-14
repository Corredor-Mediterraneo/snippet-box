import { useState } from 'react';
import axios from 'axios';

interface Props {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportObsidianModal = (props: Props): JSX.Element => {
  const { show, onClose, onSuccess } = props;
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileCount, setFileCount] = useState(0);

  if (!show) return <></>;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      setError('Please select at least one .md file');
      return;
    }

    const mdFiles = Array.from(files).filter(f => f.name.endsWith('.md'));
    if (mdFiles.length === 0) {
      setError('No .md files selected');
      return;
    }

    setFileCount(mdFiles.length);
    setLoading(true);
    setResult(null);
    setError(null);
    setProgress(`Reading ${mdFiles.length} files...`);

    try {
      // Read all files
      const filesArray = await Promise.all(
        mdFiles.map(async (file) => {
          const content = await file.text();
          return { name: file.name, content };
        })
      );

      setProgress(`Importing ${filesArray.length} files in batches...`);

      // Send in batches to avoid body size limit
      const batchSize = 10;
      let totalImported = 0;
      let totalSkipped = 0;
      let totalErrors = 0;

      for (let i = 0; i < filesArray.length; i += batchSize) {
        const batch = filesArray.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(filesArray.length / batchSize);

        setProgress(`Batch ${batchNum}/${totalBatches} (${batch.length} files)...`);

        try {
          const res = await axios.post('/api/snippets/import/obsidian', { files: batch });
          const data = res.data.data;
          totalImported += data.imported || 0;
          totalSkipped += data.skipped || 0;
          totalErrors += data.errors || 0;
        } catch (err: any) {
          totalErrors += batch.length;
        }
      }

      setResult(
        `Imported: ${totalImported}, Skipped: ${totalSkipped}, Errors: ${totalErrors}`
      );
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Import failed');
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Import from Obsidian Vault</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">
                Select .md files from your Obsidian vault
                <span className="ms-2">
                  <small className="text-muted">
                    (Select multiple files or drag & drop)
                  </small>
                </span>
              </label>
              <div
                className="border border-dashed rounded p-4 text-center"
                style={{ minHeight: '150px', borderColor: '#dee2e6' }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <input
                  type="file"
                  multiple
                  accept=".md"
                  onChange={handleFileInput}
                  disabled={loading}
                  style={{ display: 'none' }}
                  id="obsidian-file-input"
                />
                <label
                  htmlFor="obsidian-file-input"
                  className="btn btn-primary btn-sm cursor-pointer"
                >
                  Select .md files
                </label>
                <p className="text-muted mt-2 mb-0">
                  or drag & drop .md files here
                </p>
                {fileCount > 0 && (
                  <p className="text-info mt-2 mb-0">
                    {fileCount} files selected
                  </p>
                )}
              </div>
            </div>
            {progress && (
              <div className="mb-3">
                <div className="progress">
                  <div
                    className="progress-bar progress-bar-striped progress-bar-animated"
                    role="progressbar"
                    style={{ width: '100%' }}
                  />
                </div>
                <small className="text-muted">{progress}</small>
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
          </div>
        </div>
      </div>
    </div>
  );
};
