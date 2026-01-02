import { useState, useCallback, useRef, useEffect } from 'react';

interface UseVoiceInputOptions {
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
  language?: string;
  continuous?: boolean;
}

interface UseVoiceInputReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

// Web Speech API type definitions
interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  readonly isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

// Extend Window interface for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const { onResult, onError, language = 'en-US', continuous = false } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognitionClass();

    const recognition = recognitionRef.current;
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);

      if (finalTranscript && onResult) {
        onResult(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);

      if (onError) {
        let errorMessage = 'Speech recognition error';
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
          case 'audio-capture':
            errorMessage = 'No microphone found. Please check your microphone.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone access.';
            break;
          case 'network':
            errorMessage = 'Network error. Please check your connection.';
            break;
          default:
            errorMessage = `Error: ${event.error}`;
        }
        onError(errorMessage);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    return () => {
      recognition.abort();
    };
  }, [isSupported, language, continuous, onResult, onError]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;

    setTranscript('');
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;

    recognitionRef.current.stop();
    setIsListening(false);
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
  };
}

// Helper function to match voice input to choices
export function matchVoiceToChoice(
  transcript: string,
  choices: { id: string; text: string }[]
): { id: string; text: string } | null {
  const normalizedTranscript = transcript.toLowerCase().trim();

  // Try exact match first
  for (const choice of choices) {
    if (
      choice.text.toLowerCase().includes(normalizedTranscript) ||
      normalizedTranscript.includes(choice.text.toLowerCase())
    ) {
      return choice;
    }
  }

  // Try number matching (e.g., "one", "first", "1")
  const numberWords: Record<string, number> = {
    one: 0,
    first: 0,
    '1': 0,
    a: 0,
    two: 1,
    second: 1,
    '2': 1,
    b: 1,
    three: 2,
    third: 2,
    '3': 2,
    c: 2,
    four: 3,
    fourth: 3,
    '4': 3,
    d: 3,
  };

  for (const [word, index] of Object.entries(numberWords)) {
    if (normalizedTranscript.includes(word) && choices[index]) {
      return choices[index];
    }
  }

  // Try keyword matching
  for (const choice of choices) {
    const choiceWords = choice.text.toLowerCase().split(/\s+/);
    for (const word of choiceWords) {
      if (word.length > 3 && normalizedTranscript.includes(word)) {
        return choice;
      }
    }
  }

  return null;
}
