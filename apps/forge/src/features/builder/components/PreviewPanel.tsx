import { Sparkles } from 'lucide-react';
import { InteractiveViewer } from '@nexttale/shared';

interface PreviewPanelProps {
  htmlContent: string | null;
  onIframeError?: (error: { message: string; line?: number; col?: number; stack?: string }) => void;
}

export function PreviewPanel({ htmlContent, onIframeError }: PreviewPanelProps) {
  if (!htmlContent) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-gray-900 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600/20 to-pink-600/20">
          <Sparkles className="h-8 w-8 text-purple-400" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-white">Your creation will appear here</h3>
        <p className="max-w-sm text-sm text-gray-400">
          Describe what you want to build in the chat, and watch it come to life instantly.
        </p>
      </div>
    );
  }

  return (
    <InteractiveViewer
      htmlContent={htmlContent}
      title="Preview"
      className="h-full"
      onIframeError={onIframeError}
    />
  );
}
