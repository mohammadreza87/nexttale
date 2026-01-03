/**
 * Feedback Page
 * Form for users to submit bug reports, feature requests, and general feedback
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Bug,
  Lightbulb,
  Wrench,
  HelpCircle,
  Send,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import {
  submitFeedback,
  type FeedbackType,
} from '../lib/feedbackService';

const FEEDBACK_TYPES: Array<{
  id: FeedbackType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = [
  {
    id: 'bug',
    label: 'Bug Report',
    description: 'Something isn\'t working correctly',
    icon: Bug,
    color: 'text-red-400 bg-red-600/20 border-red-600/30',
  },
  {
    id: 'feature',
    label: 'Feature Request',
    description: 'I have an idea for a new feature',
    icon: Lightbulb,
    color: 'text-yellow-400 bg-yellow-600/20 border-yellow-600/30',
  },
  {
    id: 'improvement',
    label: 'Improvement',
    description: 'Something could be better',
    icon: Wrench,
    color: 'text-blue-400 bg-blue-600/20 border-blue-600/30',
  },
  {
    id: 'other',
    label: 'Other',
    description: 'General feedback or question',
    icon: HelpCircle,
    color: 'text-gray-400 bg-gray-600/20 border-gray-600/30',
  },
];

export function FeedbackPage() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedType || !title.trim() || !description.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await submitFeedback({
        type: selectedType,
        title: title.trim(),
        description: description.trim(),
      });
      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedType(null);
    setTitle('');
    setDescription('');
    setIsSubmitted(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-white">Feedback</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-12">
        {isSubmitted ? (
          /* Success state */
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-600/20">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <h1 className="mb-3 text-2xl font-bold text-white">
              Thank you for your feedback!
            </h1>
            <p className="mb-8 text-gray-400">
              We appreciate you taking the time to help us improve Joyixir.
              Your feedback helps us make the product better for everyone.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleReset}
                className="rounded-lg border border-gray-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-gray-600 hover:bg-gray-800"
              >
                Submit another
              </button>
              <button
                onClick={() => navigate('/')}
                className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500"
              >
                Back to Joyixir
              </button>
            </div>
          </div>
        ) : (
          /* Feedback form */
          <form onSubmit={handleSubmit}>
            <h1 className="mb-2 text-2xl font-bold text-white">
              Send us feedback
            </h1>
            <p className="mb-8 text-gray-400">
              Help us improve Joyixir by sharing your thoughts, reporting bugs,
              or suggesting new features.
            </p>

            {/* Error message */}
            {error && (
              <div className="mb-6 rounded-lg border border-red-800 bg-red-900/20 p-4 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Feedback type selection */}
            <div className="mb-6">
              <label className="mb-3 block text-sm font-medium text-white">
                What type of feedback is this?
              </label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {FEEDBACK_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type.id)}
                    className={`flex flex-col items-center rounded-lg border p-4 transition-all ${
                      selectedType === type.id
                        ? type.color
                        : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <type.icon className="mb-2 h-6 w-6" />
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title input */}
            <div className="mb-4">
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-medium text-white"
              >
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of your feedback"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 outline-none ring-violet-500 focus:border-transparent focus:ring-2"
              />
            </div>

            {/* Description textarea */}
            <div className="mb-6">
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-white"
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please provide as much detail as possible..."
                rows={6}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 outline-none ring-violet-500 focus:border-transparent focus:ring-2"
              />
              <p className="mt-2 text-xs text-gray-500">
                {selectedType === 'bug' &&
                  'Include steps to reproduce the issue if possible.'}
                {selectedType === 'feature' &&
                  'Describe what problem this feature would solve.'}
                {selectedType === 'improvement' &&
                  'Explain what you would change and why.'}
                {selectedType === 'other' && 'Tell us what\'s on your mind.'}
              </p>
            </div>

            {/* Submit button */}
            <div className="flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="rounded-lg border border-gray-700 px-5 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:border-gray-600 hover:bg-gray-800 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedType || !title.trim() || !description.trim()}
                className="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Feedback
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
