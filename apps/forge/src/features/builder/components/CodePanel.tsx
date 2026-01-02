import { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';

interface CodePanelProps {
  code: string;
  onChange: (code: string) => void;
}

export function CodePanel({ code, onChange }: CodePanelProps) {
  const [localCode, setLocalCode] = useState(code);
  const [isDirty, setIsDirty] = useState(false);

  // Update local code when prop changes (from AI generation)
  useEffect(() => {
    setLocalCode(code);
    setIsDirty(false);
  }, [code]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setLocalCode(value);
      setIsDirty(value !== code);
    }
  };

  const handleApplyChanges = () => {
    onChange(localCode);
    setIsDirty(false);
  };

  const handleRevert = () => {
    setLocalCode(code);
    setIsDirty(false);
  };

  return (
    <div className="flex h-64 flex-col bg-gray-900">
      {/* Toolbar */}
      {isDirty && (
        <div className="flex items-center justify-between border-b border-gray-800 bg-yellow-900/20 px-4 py-2">
          <span className="text-sm text-yellow-300">You have unsaved changes</span>
          <div className="flex gap-2">
            <button
              onClick={handleRevert}
              className="rounded-lg border border-gray-600 px-3 py-1 text-sm text-gray-300 transition-colors hover:bg-gray-800"
            >
              Revert
            </button>
            <button
              onClick={handleApplyChanges}
              className="rounded-lg bg-purple-600 px-3 py-1 text-sm text-white transition-colors hover:bg-purple-700"
            >
              Apply Changes
            </button>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1">
        <Editor
          defaultLanguage="html"
          value={localCode}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            padding: { top: 8, bottom: 8 },
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}
