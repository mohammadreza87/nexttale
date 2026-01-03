import { useCallback, memo } from 'react';
import Editor, { OnMount, loader } from '@monaco-editor/react';

// Configure Monaco to use CDN
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs',
  },
});

interface CodeEditorProps {
  filePath: string | null;
  content: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  className?: string;
}

// Get language from file extension
function getLanguage(filePath: string | null): string {
  if (!filePath) return 'plaintext';

  const ext = filePath.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'json':
      return 'json';
    case 'css':
      return 'css';
    case 'scss':
      return 'scss';
    case 'html':
      return 'html';
    case 'md':
    case 'mdx':
      return 'markdown';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'xml':
      return 'xml';
    case 'sql':
      return 'sql';
    case 'sh':
    case 'bash':
      return 'shell';
    case 'py':
      return 'python';
    default:
      return 'plaintext';
  }
}

export const CodeEditor = memo(function CodeEditor({
  filePath,
  content,
  onChange,
  readOnly = false,
  className = '',
}: CodeEditorProps) {
  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    // Define custom theme
    monaco.editor.defineTheme('joyixir-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ff79c6' },
        { token: 'string', foreground: 'f1fa8c' },
        { token: 'number', foreground: 'bd93f9' },
        { token: 'type', foreground: '8be9fd', fontStyle: 'italic' },
        { token: 'function', foreground: '50fa7b' },
        { token: 'variable', foreground: 'f8f8f2' },
        { token: 'constant', foreground: 'bd93f9' },
        { token: 'parameter', foreground: 'ffb86c' },
        { token: 'tag', foreground: 'ff79c6' },
        { token: 'attribute.name', foreground: '50fa7b' },
        { token: 'attribute.value', foreground: 'f1fa8c' },
      ],
      colors: {
        'editor.background': '#0d0d0d',
        'editor.foreground': '#f8f8f2',
        'editor.lineHighlightBackground': '#1a1a2e',
        'editor.selectionBackground': '#44475a',
        'editor.inactiveSelectionBackground': '#44475a88',
        'editorCursor.foreground': '#a78bfa',
        'editorLineNumber.foreground': '#6272a4',
        'editorLineNumber.activeForeground': '#f8f8f2',
        'editorIndentGuide.background': '#282a3655',
        'editorIndentGuide.activeBackground': '#6272a4',
        'editorGutter.background': '#0d0d0d',
        'editor.wordHighlightBackground': '#44475a55',
        'editor.wordHighlightStrongBackground': '#44475a88',
        'editorBracketMatch.background': '#44475a',
        'editorBracketMatch.border': '#f1fa8c',
        'scrollbar.shadow': '#0000001a',
        'scrollbarSlider.background': '#44475a55',
        'scrollbarSlider.hoverBackground': '#44475a88',
        'scrollbarSlider.activeBackground': '#44475a',
      },
    });

    // Set theme
    monaco.editor.setTheme('joyixir-dark');

    // Configure TypeScript/JavaScript defaults
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
      strict: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      allowJs: true,
      checkJs: false,
    });

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
      allowJs: true,
    });

    // Add React types
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      `declare module 'react' {
        export * from '@types/react';
      }`,
      'react.d.ts'
    );

    // Focus editor
    editor.focus();
  }, []);

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined) {
        onChange(value);
      }
    },
    [onChange]
  );

  const language = getLanguage(filePath);

  if (!filePath) {
    return (
      <div className={`flex h-full items-center justify-center bg-[#0d0d0d] text-gray-500 ${className}`}>
        Select a file to edit
      </div>
    );
  }

  return (
    <div className={`h-full ${className}`}>
      <Editor
        height="100%"
        language={language}
        value={content}
        onChange={handleChange}
        theme="vs-dark"
        onMount={handleEditorMount}
        options={{
          readOnly,
          fontSize: 14,
          fontFamily: 'JetBrains Mono, Menlo, Monaco, "Courier New", monospace',
          fontLigatures: true,
          lineHeight: 22,
          letterSpacing: 0.5,
          minimap: { enabled: true, scale: 2 },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          tabSize: 2,
          insertSpaces: true,
          autoIndent: 'full',
          formatOnPaste: true,
          formatOnType: true,
          quickSuggestions: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          folding: true,
          foldingStrategy: 'indentation',
          renderLineHighlight: 'line',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          mouseWheelZoom: true,
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          padding: { top: 12, bottom: 12 },
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
        }}
        loading={
          <div className="flex h-full items-center justify-center bg-[#0d0d0d] text-gray-500">
            Loading editor...
          </div>
        }
      />
    </div>
  );
});
