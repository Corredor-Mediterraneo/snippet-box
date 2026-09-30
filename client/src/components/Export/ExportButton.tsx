import { useState, useContext } from 'react';
import { Button } from '../UI/Button';
import { SnippetsContext } from '../../store/SnippetsContext';

interface Props {
  variant?: 'json' | 'markdown' | 'selected-json' | 'selected-markdown' | 'tag';
  tag?: string;
}

export const ExportButton = (props: Props): JSX.Element | null => {
  const { variant = 'json', tag } = props;
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<string | null>(null);
  const context = useContext(SnippetsContext);

  if (!context) return null;

  const {
    exportAllAsJson,
    exportSelectedAsJson,
    exportByTagAsMarkdown,
    exportSelectedAsMarkdown,
    selectedSnippets
  } = context;

  const handleExport = async () => {
    setExporting(true);
    setExportResult(null);

    try {
      let content: string | any[] = '';

      switch (variant) {
        case 'json':
          content = await exportAllAsJson();
          downloadFile(JSON.stringify(content, null, 2), 'snippets-export.json', 'application/json');
          break;
        case 'selected-json':
          content = await exportSelectedAsJson(Array.from(selectedSnippets));
          downloadFile(JSON.stringify(content, null, 2), 'snippets-selected.json', 'application/json');
          break;
        case 'selected-markdown':
          content = await exportSelectedAsMarkdown(Array.from(selectedSnippets));
          downloadFile(content, 'snippets-selected.md', 'text/markdown');
          break;
        case 'tag':
          if (tag) {
            content = await exportByTagAsMarkdown(tag);
            downloadFile(content, `snippets-${tag}.md`, 'text/markdown');
          }
          break;
      }

      setExportResult('Export completed successfully!');
    } catch (error) {
      setExportResult(`Export failed: ${error}`);
    } finally {
      setExporting(false);
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string): void => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="export-button-container">
      <Button
        text={exporting ? 'Exporting...' : 'Export'}
        color="primary"
        small={true}
        handler={handleExport}
        disabled={variant !== 'json' && variant !== 'selected-json' && variant !== 'selected-markdown' && variant !== 'tag' ? selectedSnippets.size === 0 : false}
      />
      {exportResult && (
        <div className="mt-1 text-muted small">{exportResult}</div>
      )}
    </div>
  );
};
