import { useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  Sparkles,
  LogOut,
  Code2,
  ChevronDown,
  ChevronUp,
  LayoutTemplate,
} from 'lucide-react';
import { ChatPanel } from '../features/builder/components/ChatPanel';
import { PreviewPanel } from '../features/builder/components/PreviewPanel';
import { CodePanel } from '../features/builder/components/CodePanel';
import { TemplateSelector } from '../features/builder/components/TemplateSelector';

interface BuilderPageProps {
  user: User;
  onSignOut: () => void;
}

export function BuilderPage({ user, onSignOut }: BuilderPageProps) {
  const [currentHtml, setCurrentHtml] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [iframeError, setIframeError] = useState<{
    message: string;
    line?: number;
    col?: number;
    stack?: string;
  } | null>(null);

  const handleHtmlGenerated = useCallback((html: string) => {
    setCurrentHtml(html);
    setIframeError(null);
  }, []);

  const handleCodeChange = useCallback((code: string) => {
    setCurrentHtml(code);
    setIframeError(null);
  }, []);

  const handleIframeError = useCallback(
    (error: { message: string; line?: number; col?: number; stack?: string }) => {
      setIframeError(error);
    },
    []
  );

  const handleTemplateSelect = useCallback((starterPrompt: string, baseHtml?: string) => {
    setShowTemplates(false);
    if (baseHtml) {
      setCurrentHtml(baseHtml);
    }
    // The starter prompt will be handled by the ChatPanel
  }, []);

  return (
    <div className="flex h-screen flex-col bg-gray-950">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-gray-800 px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-pink-600">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-lg font-bold text-transparent">
            NextForge
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTemplates(true)}
            className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:border-gray-600 hover:bg-gray-700"
          >
            <LayoutTemplate className="h-4 w-4" />
            Templates
          </button>
          <button
            onClick={() => setShowCode(!showCode)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              showCode
                ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600 hover:bg-gray-700'
            }`}
          >
            <Code2 className="h-4 w-4" />
            Code
          </button>
          <div className="ml-2 flex items-center gap-2 border-l border-gray-700 pl-4">
            <img
              src={user.user_metadata?.avatar_url || ''}
              alt=""
              className="h-7 w-7 rounded-full"
            />
            <button
              onClick={onSignOut}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex min-h-0 flex-1">
        {/* Chat Panel */}
        <div className="flex w-96 shrink-0 flex-col border-r border-gray-800">
          <ChatPanel
            onHtmlGenerated={handleHtmlGenerated}
            currentHtml={currentHtml}
            iframeError={iframeError}
          />
        </div>

        {/* Preview Panel */}
        <div className="flex flex-1 flex-col">
          <PreviewPanel
            htmlContent={currentHtml}
            onIframeError={handleIframeError}
          />
        </div>
      </div>

      {/* Code Panel (Collapsible) */}
      {showCode && (
        <div className="shrink-0 border-t border-gray-800">
          <div className="flex items-center justify-between bg-gray-900 px-4 py-2">
            <span className="text-sm font-medium text-gray-300">Generated Code</span>
            <button
              onClick={() => setShowCode(false)}
              className="text-gray-400 hover:text-white"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
          <CodePanel code={currentHtml || ''} onChange={handleCodeChange} />
        </div>
      )}

      {/* Collapsed Code Toggle */}
      {!showCode && currentHtml && (
        <button
          onClick={() => setShowCode(true)}
          className="flex items-center justify-center gap-2 border-t border-gray-800 bg-gray-900 py-2 text-sm text-gray-400 transition-colors hover:text-white"
        >
          <ChevronUp className="h-4 w-4" />
          Show Code
        </button>
      )}

      {/* Template Selector Modal */}
      {showTemplates && (
        <TemplateSelector
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
}
