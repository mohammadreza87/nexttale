import { UnifiedAuthForm } from './auth/UnifiedAuthForm';

interface AuthProps {
  onAuthSuccess: () => void;
  initialMode?: 'login' | 'signup';
  featurePrompt?: string;
}

export function Auth({ onAuthSuccess, featurePrompt }: AuthProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <UnifiedAuthForm onSuccess={onAuthSuccess} featurePrompt={featurePrompt} />
    </div>
  );
}
