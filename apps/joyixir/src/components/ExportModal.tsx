import { useState, memo } from 'react';
import { X, Download, Github, Loader2, Check, ExternalLink } from 'lucide-react';
import { getFileTree, readFile } from '../lib/webcontainer';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName?: string;
}

export const ExportModal = memo(function ExportModal({
  isOpen,
  onClose,
  projectName = 'joyixir-project',
}: ExportModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleDownloadZip = async () => {
    setIsExporting(true);
    setExportStatus('idle');
    setErrorMessage('');

    try {
      // Dynamic import JSZip to reduce initial bundle size
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Get all files recursively
      const files = await getFileTree('/');

      // File node type
      interface FileNode {
        name: string;
        type: 'file' | 'directory';
        path: string;
        children?: FileNode[];
      }

      // Helper function to add files to zip
      const addFilesToZip = async (
        nodes: FileNode[],
        zipFolder: typeof zip
      ) => {
        for (const node of nodes) {
          if (node.type === 'file') {
            try {
              const content = await readFile(node.path);
              // Remove leading slash for zip path
              const zipPath = node.path.startsWith('/') ? node.path.slice(1) : node.path;
              zipFolder.file(zipPath, content);
            } catch (err) {
              console.warn(`Failed to read file: ${node.path}`, err);
            }
          } else if (node.type === 'directory' && node.children) {
            await addFilesToZip(node.children, zipFolder);
          }
        }
      };

      await addFilesToZip(files, zip);

      // Generate and download
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportStatus('success');
    } catch (err) {
      console.error('Export failed:', err);
      setExportStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Failed to export project');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePushToGithub = async () => {
    // TODO: Implement GitHub OAuth and push functionality
    // For now, show instructions
    setExportStatus('idle');
    setErrorMessage('GitHub integration coming soon! For now, download the ZIP and push manually.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Export Project</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="mb-6 text-sm text-gray-400">
            Export your project to continue development locally or deploy it anywhere.
          </p>

          <div className="space-y-3">
            {/* Download ZIP */}
            <button
              onClick={handleDownloadZip}
              disabled={isExporting}
              className="flex w-full items-center gap-4 rounded-xl border border-gray-700 bg-gray-800 p-4 text-left transition-colors hover:border-violet-500 hover:bg-gray-800/80 disabled:opacity-50"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-600">
                {isExporting ? (
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                ) : exportStatus === 'success' ? (
                  <Check className="h-6 w-6 text-white" />
                ) : (
                  <Download className="h-6 w-6 text-white" />
                )}
              </div>
              <div>
                <p className="font-medium text-white">Download ZIP</p>
                <p className="text-sm text-gray-400">Get all project files as a zip archive</p>
              </div>
            </button>

            {/* GitHub */}
            <button
              onClick={handlePushToGithub}
              className="flex w-full items-center gap-4 rounded-xl border border-gray-700 bg-gray-800 p-4 text-left transition-colors hover:border-violet-500 hover:bg-gray-800/80"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-700">
                <Github className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-medium text-white">Push to GitHub</p>
                <p className="text-sm text-gray-400">Create a new repository or push to existing</p>
              </div>
            </button>
          </div>

          {/* Status messages */}
          {exportStatus === 'success' && (
            <div className="mt-4 rounded-lg bg-green-500/10 p-3 text-sm text-green-400">
              Project exported successfully!
            </div>
          )}

          {errorMessage && (
            <div className="mt-4 rounded-lg bg-yellow-500/10 p-3 text-sm text-yellow-400">
              {errorMessage}
            </div>
          )}

          {/* Quick deploy links */}
          <div className="mt-6 border-t border-gray-800 pt-6">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">
              Deploy to
            </p>
            <div className="flex gap-2">
              <a
                href="https://vercel.com/new"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-gray-800 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
              >
                <span>Vercel</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://app.netlify.com/drop"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-gray-800 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
              >
                <span>Netlify</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://railway.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-gray-800 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
              >
                <span>Railway</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
