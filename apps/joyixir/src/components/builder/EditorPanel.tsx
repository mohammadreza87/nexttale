/**
 * Editor Panel Component
 * Code editor with file header
 */

import { Code, Loader2 } from 'lucide-react';
import { CodeEditor } from '../CodeEditor';

interface EditorPanelProps {
  selectedFile: string | null;
  fileContent: string;
  isLoading: boolean;
  onChange: (content: string) => void;
}

export function EditorPanel({
  selectedFile,
  fileContent,
  isLoading,
  onChange,
}: EditorPanelProps) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden border-r border-gray-800">
      {/* Editor header */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900 px-3">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Code className="h-4 w-4" />
          {selectedFile ? (
            <span className="text-white">{selectedFile}</span>
          ) : (
            <span>Select a file to edit</span>
          )}
        </div>
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex h-full items-center justify-center bg-[#0d0d0d]">
            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
          </div>
        ) : (
          <CodeEditor
            filePath={selectedFile}
            content={fileContent}
            onChange={onChange}
          />
        )}
      </div>
    </div>
  );
}
