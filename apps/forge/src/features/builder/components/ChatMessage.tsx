import { User, Bot, AlertCircle, Sparkles } from 'lucide-react';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'error' | 'system';
  content: string;
  timestamp: Date;
  generatedHtml?: string;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isError = message.role === 'error';
  const isSystem = message.role === 'system';

  return (
    <div
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser
            ? 'bg-purple-600'
            : isError
              ? 'bg-red-600'
              : isSystem
                ? 'bg-gray-600'
                : 'bg-gradient-to-br from-purple-600 to-pink-600'
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : isError ? (
          <AlertCircle className="h-4 w-4 text-white" />
        ) : isSystem ? (
          <Sparkles className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-white" />
        )}
      </div>

      {/* Content */}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? 'bg-purple-600 text-white'
            : isError
              ? 'border border-red-500/30 bg-red-900/30 text-red-200'
              : isSystem
                ? 'border border-gray-700 bg-gray-800 text-gray-300'
                : 'bg-gray-800 text-gray-200'
        }`}
      >
        <p className="text-sm leading-relaxed">{message.content}</p>
        {message.generatedHtml && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-purple-300">
            <Sparkles className="h-3 w-3" />
            <span>Content generated</span>
          </div>
        )}
      </div>
    </div>
  );
}
