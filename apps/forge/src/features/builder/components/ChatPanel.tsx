import { useState, useRef, useEffect } from 'react';
import { Send, Loader, AlertCircle, Wand2 } from 'lucide-react';
import { generateInteractiveContent } from '@nexttale/shared';
import type { InteractiveContentType } from '@nexttale/shared';
import { ChatMessage, type Message } from './ChatMessage';

interface ChatPanelProps {
  onHtmlGenerated: (html: string) => void;
  currentHtml: string | null;
  iframeError: { message: string; line?: number; col?: number; stack?: string } | null;
}

export function ChatPanel({ onHtmlGenerated, currentHtml, iframeError }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hi! I'm your AI game builder. Tell me what you'd like to create - a game, tool, widget, or quiz. Be as specific as you like!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Show error from iframe
  useEffect(() => {
    if (iframeError) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'error',
        content: `Error in generated code: ${iframeError.message}${iframeError.line ? ` (line ${iframeError.line})` : ''}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  }, [iframeError]);

  const detectContentType = (prompt: string): InteractiveContentType => {
    const lower = prompt.toLowerCase();
    if (lower.includes('game') || lower.includes('play') || lower.includes('arcade')) return 'game';
    if (lower.includes('quiz') || lower.includes('trivia') || lower.includes('question')) return 'quiz';
    if (lower.includes('tool') || lower.includes('calculator') || lower.includes('converter')) return 'tool';
    if (lower.includes('visualization') || lower.includes('chart') || lower.includes('graph')) return 'visualization';
    return 'widget';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);

    try {
      // Build conversation history for context
      const conversationHistory = messages.slice(-5).map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      }));

      const contentType = detectContentType(input);

      // Determine if this is an edit or new generation
      const isEdit = currentHtml && (
        input.toLowerCase().includes('change') ||
        input.toLowerCase().includes('make it') ||
        input.toLowerCase().includes('add') ||
        input.toLowerCase().includes('remove') ||
        input.toLowerCase().includes('fix') ||
        input.toLowerCase().includes('update')
      );

      const response = await generateInteractiveContent({
        prompt: input.trim(),
        contentType,
        style: 'modern',
        editMode: isEdit,
        existingHtml: isEdit ? currentHtml || undefined : undefined,
        editPrompt: isEdit ? input.trim() : undefined,
        conversationHistory,
        errorContext: iframeError ? iframeError.message : undefined,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Created "${response.title}": ${response.description}`,
        timestamp: new Date(),
        generatedHtml: response.html,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      onHtmlGenerated(response.html);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'error',
        content: error instanceof Error ? error.message : 'Failed to generate content',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFixError = async () => {
    if (!iframeError || !currentHtml || isGenerating) return;

    setIsGenerating(true);

    try {
      const fixPrompt = `Fix this error in the code: ${iframeError.message}`;

      const response = await generateInteractiveContent({
        prompt: fixPrompt,
        contentType: 'widget',
        editMode: true,
        existingHtml: currentHtml,
        editPrompt: fixPrompt,
        errorContext: iframeError.stack || iframeError.message,
      });

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Fixed the error: ${response.description}`,
        timestamp: new Date(),
        generatedHtml: response.html,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      onHtmlGenerated(response.html);
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'error',
        content: 'Failed to fix the error. Please try describing the fix you need.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isGenerating && (
            <div className="flex items-center gap-2 text-purple-400">
              <Loader className="h-4 w-4 animate-spin" />
              <span className="text-sm">Generating...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error Fix Button */}
      {iframeError && !isGenerating && (
        <div className="border-t border-gray-800 bg-red-900/20 px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <div className="flex-1">
              <p className="text-sm text-red-300">{iframeError.message}</p>
              <button
                onClick={handleFixError}
                className="mt-2 flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                <Wand2 className="h-3.5 w-3.5" />
                Fix with AI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-800 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={currentHtml ? 'Describe changes...' : 'Describe what to build...'}
            disabled={isGenerating}
            className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            className="flex items-center justify-center rounded-lg bg-purple-600 px-4 py-2.5 text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
