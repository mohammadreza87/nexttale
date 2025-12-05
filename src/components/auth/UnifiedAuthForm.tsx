import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { trackLogin, trackSignUp } from '../../lib/analytics';
import { GoogleIcon, AppleIcon } from './SocialIcons';

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

      if (signInError.message.includes('Invalid login credentials') || signInError.message.includes('Email not confirmed')) {
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
      setError('An unexpected error occurred');
      setSocialLoading(null);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-gray-900 rounded-3xl shadow-2xl p-8 border border-gray-800">
        <div className="text-center mb-8">
          <img src="/nexttale-logo.png" alt="Next Tale" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">
            {forgotPassword ? 'Reset Password' : 'Welcome to Next Tale'}
          </h1>
          <p className="text-gray-400">
            {forgotPassword
              ? 'Enter your email and we\'ll send you a reset link'
              : featurePrompt || 'Enter email and password to sign in or create an account.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {resetEmailSent && (
          <div className="mb-6 p-4 bg-green-900/30 border border-green-500/50 rounded-lg">
            <p className="text-green-400 text-sm font-medium">Password reset email sent!</p>
            <p className="text-green-500 text-sm mt-1">Check your inbox and follow the link to reset your password.</p>
          </div>
        )}

        <form onSubmit={forgotPassword ? handleForgotPassword : handleSubmit} className="space-y-5">
          {!forgotPassword && (
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">
                Display Name (optional)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter a display name"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          {!forgotPassword && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                    className="text-sm text-purple-400 hover:text-purple-300 font-medium"
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
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-semibold hover:opacity-90 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                {forgotPassword ? 'Sending...' : 'Signing In...'}
              </span>
            ) : forgotPassword ? (
              resetEmailSent ? 'Email Sent' : 'Send Reset Link'
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
                  <span className="px-2 bg-gray-900 text-gray-500">or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => handleSocialSignIn('google')}
                  disabled={loading || socialLoading !== null}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {socialLoading === 'google' ? (
                    <span className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
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
              className="text-sm text-purple-400 hover:text-purple-300 font-medium"
            >
              Back to Sign In
            </button>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-800">
          <p className="text-xs text-gray-500 text-center">
            By continuing, you agree to our{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">
              Privacy Policy
            </a>
          </p>
          <p className="text-xs text-gray-600 text-center mt-2">
            You must be 18+ to use Next Tale
          </p>
        </div>
      </div>
    </div>
  );
}
