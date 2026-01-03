import { useState, useCallback, useRef } from 'react';
import { generateCode, type GenerateRequest } from '../lib/joyixirService';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  files?: Array<{ path: string; content: string }>;
}

interface UseJoyixirChatOptions {
  onFilesGenerated?: (files: Array<{ path: string; content: string }>) => Promise<void>;
  onNeedsThreeJs?: () => Promise<void>; // Called when AI requests Three.js
  readFile?: (path: string) => Promise<string>;
  hasThreeJs?: boolean; // Whether Three.js template is already loaded
}

export interface UseJoyixirChatReturn {
  messages: ChatMessage[];
  isGenerating: boolean;
  error: string | null;
  sendMessage: (prompt: string, selectedFile?: string) => Promise<void>;
  clearMessages: () => void;
  addSystemMessage: (content: string) => void;
}

export function useJoyixirChat(options: UseJoyixirChatOptions = {}): UseJoyixirChatReturn {
  const { onFilesGenerated, onNeedsThreeJs, readFile, hasThreeJs = false } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hi! I'm Joyixir, your AI game builder. Choose a template below to get started, then tell me what game you want to create!",
      timestamp: new Date(),
    },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep track of generated files for context
  const filesRef = useRef<Record<string, string>>({});

  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  }, []);

  const addSystemMessage = useCallback((content: string) => {
    addMessage({ role: 'system', content });
  }, [addMessage]);

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content:
          "Hi! I'm Joyixir, your AI game builder. Choose a template below to get started, then tell me what game you want to create!",
        timestamp: new Date(),
      },
    ]);
    filesRef.current = {};
  }, []);

  const sendMessage = useCallback(
    async (prompt: string, selectedFile?: string) => {
      if (!prompt.trim() || isGenerating) return;

      setError(null);
      setIsGenerating(true);

      // Add user message
      addMessage({ role: 'user', content: prompt });

      try {
        // Build current files context
        const currentFiles: Record<string, string> = { ...filesRef.current };

        // Try to read the selected file if provided
        if (selectedFile && readFile) {
          try {
            const content = await readFile(selectedFile);
            currentFiles[selectedFile] = content;
          } catch {
            // File might not exist yet, that's ok
          }
        }

        // Build conversation history for context
        const conversationHistory = messages
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .slice(-10)
          .map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }));

        // Call the AI
        const request: GenerateRequest = {
          prompt,
          currentFiles,
          selectedFile,
          conversationHistory,
          hasThreeJs,
        };

        const response = await generateCode(request);

        // Check if AI requested Three.js
        if (response.needsThreeJs && !hasThreeJs && onNeedsThreeJs) {
          addMessage({
            role: 'system',
            content: 'This game needs 3D graphics. Installing Three.js...',
          });
          await onNeedsThreeJs();
        }

        // Update our file cache
        for (const file of response.files) {
          const normalizedPath = file.path.startsWith('/') ? file.path : `/${file.path}`;
          filesRef.current[normalizedPath] = file.content;
        }

        // Apply files if callback provided
        if (onFilesGenerated && response.files.length > 0) {
          await onFilesGenerated(response.files);
        }

        // Add assistant response
        addMessage({
          role: 'assistant',
          content: response.message + (response.explanation ? `\n\n${response.explanation}` : ''),
          files: response.files,
        });

        // Add system message about files modified
        if (response.files.length > 0) {
          addMessage({
            role: 'system',
            content: `Modified ${response.files.length} file(s): ${response.files.map((f) => f.path).join(', ')}`,
          });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate code';
        setError(errorMessage);
        addMessage({
          role: 'system',
          content: `Error: ${errorMessage}`,
        });
      } finally {
        setIsGenerating(false);
      }
    },
    [isGenerating, messages, addMessage, onFilesGenerated, readFile]
  );

  return {
    messages,
    isGenerating,
    error,
    sendMessage,
    clearMessages,
    addSystemMessage,
  };
}
