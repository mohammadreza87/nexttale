import { useState, useCallback, useRef } from 'react';
import { generateCode, type GenerateRequest } from '../lib/joyixirService';
import type { ChatMessage, NextStep } from '../types';

// Re-export ChatMessage for backwards compatibility
export type { ChatMessage } from '../types';

// Helper to parse AI response and extract features/next steps
function parseAIResponse(message: string): {
  content: string;
  features: string[];
  nextSteps: NextStep[];
} {
  const features: string[] = [];
  const nextSteps: NextStep[] = [];
  const content = message;

  // Extract bullet points that start with common bullet characters
  const bulletRegex = /^[\s]*[-•*]\s*(.+)$/gmu;
  const bullets = message.match(bulletRegex);
  if (bullets) {
    bullets.forEach(bullet => {
      const cleaned = bullet.replace(/^[\s]*[-•*]\s*/, '').trim();
      if (cleaned.length > 0 && cleaned.length < 100) {
        features.push(cleaned);
      }
    });
  }

  // Generate smart next step suggestions based on content
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('game') || lowerContent.includes('created') || lowerContent.includes('built')) {
    nextSteps.push(
      { label: 'Add sound effects', prompt: 'Add sound effects for game actions like collecting items, jumping, and game over' },
      { label: 'Add animations', prompt: 'Add smooth animations for player movement and transitions' },
      { label: 'Add a leaderboard', prompt: 'Add a local leaderboard to track high scores' }
    );
  }

  if (lowerContent.includes('player') || lowerContent.includes('character')) {
    nextSteps.push(
      { label: 'Add power-ups', prompt: 'Add power-up items that give the player special abilities' },
      { label: 'Add enemies', prompt: 'Add enemies that the player must avoid or defeat' }
    );
  }

  if (lowerContent.includes('score') || lowerContent.includes('points')) {
    nextSteps.push(
      { label: 'Add combo system', prompt: 'Add a combo multiplier system for consecutive actions' }
    );
  }

  if (lowerContent.includes('level') || lowerContent.includes('stage')) {
    nextSteps.push(
      { label: 'Add more levels', prompt: 'Add 3 more levels with increasing difficulty' }
    );
  }

  // Limit to 3 suggestions
  return {
    content,
    features: features.slice(0, 5),
    nextSteps: nextSteps.slice(0, 3),
  };
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
        "Hi! I'm Joyixir, your AI game builder. Describe the game you want to create and I'll build it for you!",
      timestamp: new Date(),
      nextSteps: [
        { label: 'Create a snake game', prompt: 'Create a classic snake game with arrow key controls, food collection, and score tracking' },
        { label: 'Build a platformer', prompt: 'Create a 2D platformer game with a jumping character, platforms, and collectible coins' },
        { label: 'Make a puzzle game', prompt: 'Create a match-3 puzzle game like Candy Crush with colorful tiles and scoring' },
      ],
    },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep track of generated files for context
  const filesRef = useRef<Record<string, string>>({});

  const addMessage = useCallback((message: Omit<ChatMessage, 'id'> & { timestamp?: Date }) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      timestamp: message.timestamp || new Date(),
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

        // Parse the AI response to extract features and next steps
        const fullContent = response.message + (response.explanation ? `\n\n${response.explanation}` : '');
        const parsed = parseAIResponse(fullContent);

        // Add assistant response with parsed features and suggestions
        addMessage({
          role: 'assistant',
          content: parsed.content,
          files: response.files,
          features: parsed.features,
          nextSteps: parsed.nextSteps,
        });

        // Add system message about files modified
        if (response.files.length > 0) {
          addMessage({
            role: 'system',
            content: `Updated ${response.files.length} file${response.files.length > 1 ? 's' : ''}: ${response.files.map((f) => f.path.split('/').pop()).join(', ')}`,
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
