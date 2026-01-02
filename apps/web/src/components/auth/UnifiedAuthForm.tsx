import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { trackLogin, trackSignUp } from '../../lib/analytics';
import { GoogleIcon, AppleIcon as _AppleIcon } from './SocialIcons';

interface UnifiedAuthFormProps {
  onSuccess?: () => void;
  featurePrompt?: string;
}

export function UnifiedAuthForm({ onSuccess, featurePrompt }: UnifiedAuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const nameToUse = displayName.trim() || email.split('@')[0] || 'Reader';

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!signInError) {
        trackLogin('email');
        onSuccess?.();
        return;
      }

      if (
        signInError.message.includes('Invalid login credentials') ||
        signInError.message.includes('Email not confirmed')
      ) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: nameToUse,
            },
          },
        });

        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
          return;
        }

        trackSignUp('email');
        onSuccess?.();
        return;
      }

      setError(signInError.message);
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setResetEmailSent(true);
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'apple') => {
    setSocialLoading(provider);
    setError(null);

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/create`,
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        setSocialLoading(null);
        return;
      }

      trackLogin(provider);
    } catch {
      setError('An unexpected error occurred');
      setSocialLoading(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-3xl border border-gray-800 bg-gray-900 p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <img src="/nexttale-logo.png" alt="Next Tale" className="mx-auto mb-4 h-20 w-20" />
          <h1 className="mb-2 text-3xl font-bold text-white">
            {forgotPassword ? 'Reset Password' : 'Welcome to Next Tale'}
          </h1>
          <p className="text-gray-400">
            {forgotPassword
              ? "Enter your email and we'll send you a reset link"
              : featurePrompt || 'Enter email and password to sign in or create an account.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/50 bg-red-900/30 p-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {resetEmailSent && (
          <div className="mb-6 rounded-lg border border-green-500/50 bg-green-900/30 p-4">
            <p className="text-sm font-medium text-green-400">Password reset email sent!</p>
            <p className="mt-1 text-sm text-green-500">
              Check your inbox and follow the link to reset your password.
            </p>
          </div>
        )}

        <form onSubmit={forgotPassword ? handleForgotPassword : handleSubmit} className="space-y-5">
          {!forgotPassword && (
            <div>
              <label htmlFor="displayName" className="mb-2 block text-sm font-medium text-gray-300">
                Display Name (optional)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-500" />
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 py-3 pl-10 pr-4 text-white placeholder-gray-500 transition-all focus:border-transparent focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter a display name"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-300">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-500" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-700 bg-gray-800 py-3 pl-10 pr-4 text-white placeholder-gray-500 transition-all focus:border-transparent focus:ring-2 focus:ring-purple-500"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          {!forgotPassword && (
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 py-3 pl-10 pr-12 text-white placeholder-gray-500 transition-all focus:border-transparent focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {!forgotPassword && (
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPassword(true);
                      setError(null);
                      setResetEmailSent(false);
                    }}
                    className="text-sm font-medium text-purple-400 hover:text-purple-300"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || resetEmailSent}
            className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 font-semibold text-white shadow-lg transition-all hover:opacity-90 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                {forgotPassword ? 'Sending...' : 'Signing In...'}
              </span>
            ) : forgotPassword ? (
              resetEmailSent ? (
                'Email Sent'
              ) : (
                'Send Reset Link'
              )
            ) : (
              'Continue'
            )}
          </button>

          {!forgotPassword && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-gray-900 px-2 text-gray-500">or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => handleSocialSignIn('google')}
                  disabled={loading || socialLoading !== null}
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 transition-all hover:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {socialLoading === 'google' ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></span>
                  ) : (
                    <GoogleIcon />
                  )}
                  <span className="font-medium text-gray-300">Google</span>
                </button>
              </div>
            </>
          )}
        </form>

        {forgotPassword && (
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setForgotPassword(false);
                setError(null);
                setResetEmailSent(false);
              }}
              className="text-sm font-medium text-purple-400 hover:text-purple-300"
            >
              Back to Sign In
            </button>
          </div>
        )}

        <div className="mt-6 border-t border-gray-800 pt-6">
          <p className="text-center text-xs text-gray-500">
            By continuing, you agree to our{' '}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 underline hover:text-purple-300"
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 underline hover:text-purple-300"
            >
              Privacy Policy
            </a>
          </p>
          <p className="mt-2 text-center text-xs text-gray-600">You must be 18+ to use Next Tale</p>
        </div>
      </div>
    </div>
  );
}
