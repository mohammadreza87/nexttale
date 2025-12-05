import { useState, useEffect } from 'react';
import { Sparkles, Loader, Wand2, Crown, Film } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { startStoryGeneration } from '../lib/storyService';
import { getSubscriptionUsage, SubscriptionUsage } from '../lib/subscriptionService';
import UsageBadge from './UsageBadge';
import UpgradeModal from './UpgradeModal';
import { progressQuest } from '../lib/questsService';

interface StoryCreatorProps {
  userId: string;
  onStoryCreated: (storyId: string) => void;
}

export function StoryCreator({ userId, onStoryCreated }: StoryCreatorProps) {
  const [prompt, setPrompt] = useState('');
  const [artStyle, setArtStyle] = useState('cinematic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [isPublic, setIsPublic] = useState(false);
  const [narratorEnabled, setNarratorEnabled] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [randomSuggestions, setRandomSuggestions] = useState<string[]>([]);

  useEffect(() => {
    loadUsage();
    randomizeSuggestions();
  }, [userId]);

  const randomizeSuggestions = () => {
    const shuffled = [...suggestions].sort(() => Math.random() - 0.5);
    setRandomSuggestions(shuffled.slice(0, 2));
  };

  const loadUsage = async () => {
    const data = await getSubscriptionUsage(userId);
    setUsage(data);
    setNarratorEnabled(true);
  };

  const handleNarratorToggle = () => {
    setNarratorEnabled(!narratorEnabled);
  };

  const handleVideoToggle = () => {
    if (usage?.isPro) {
      setVideoEnabled(!videoEnabled);
    } else {
      setShowUpgradeModal(true);
    }
  };

  const handleGenerateStory = async () => {
    if (!prompt.trim()) {
      setError('Please describe the story you want to create');
      return;
    }

    if (usage && !usage.canGenerate) {
      setShowUpgradeModal(true);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress('Creating your story with AI...');
    setProgressPercent(5);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Session error:', sessionError);
        setError('Authentication error. Please sign in again.');
        setIsGenerating(false);
        setProgress('');
        setProgressPercent(0);
        return;
      }

      if (!session) {
        console.error('No session found');
        setError('Please sign in to create stories');
        setIsGenerating(false);
        setProgress('');
        setProgressPercent(0);
        return;
      }

      console.log('Session valid, user ID:', session.user.id);

      setProgress('Generating story details...');
      setProgressPercent(10);

      const response = await fetch(
        `${supabaseUrl}/functions/v1/generate-story`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            userPrompt: prompt,
            generateFullStory: true,
          }),
        }
      );

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        console.error('API error response:', errorData);

        if (response.status === 401) {
          const detailMsg = errorData.details ? ` (${errorData.details})` : '';
          const hintMsg = errorData.hint ? ` ${errorData.hint}` : '';
          setError(`Authentication failed${detailMsg}${hintMsg}. Please try signing out and back in.`);
          setIsGenerating(false);
          setProgress('');
          setProgressPercent(0);
          return;
        }

        if (errorData.error === 'daily_limit_reached') {
          setShowUpgradeModal(true);
          setIsGenerating(false);
          setProgress('');
          setProgressPercent(0);
          return;
        }
        throw new Error(errorData.error || 'Failed to generate story');
      }

      const generatedData = await response.json();

      setProgress('Creating story structure...');
      setProgressPercent(40);

      const storyInsertData: Record<string, unknown> = {
        title: generatedData.title,
        description: generatedData.description,
        age_range: '18+',
        estimated_duration: generatedData.estimatedDuration || 15,
        story_context: generatedData.storyContext,
        created_by: userId,
        is_public: isPublic,
        is_user_generated: true,
        generation_status: 'first_chapter_ready',
        generation_progress: 10,
        language: generatedData.language || 'en',
        art_style: artStyle,
        narrator_enabled: narratorEnabled,
        video_enabled: videoEnabled,
        cover_image_url: null,
      };

      if (generatedData.outline) {
        storyInsertData.story_outline = generatedData.outline;
      }
      if (generatedData.initialMemory) {
        storyInsertData.story_memory = generatedData.initialMemory;
      }

      let storyInsertError: any = null;
      let storyResult: any = null;
      const storyResponse = await supabase.from('stories').insert(storyInsertData).select().single();
      storyResult = storyResponse.data;
      storyInsertError = storyResponse.error;

      if (storyInsertError?.code === 'PGRST204' && storyInsertError?.message?.includes('story_memory')) {
        delete storyInsertData.story_memory;
        const retry = await supabase.from('stories').insert(storyInsertData).select().single();
        storyResult = retry.data;
        storyInsertError = retry.error;
      }

      if (storyInsertError?.code === 'PGRST204' && storyInsertError?.message?.includes('story_outline')) {
        delete storyInsertData.story_outline;
        const retry = await supabase.from('stories').insert(storyInsertData).select().single();
        storyResult = retry.data;
        storyInsertError = retry.error;
      }

      if (storyInsertError) throw storyInsertError;
      const story = storyResult;

      setProgress('Creating first chapter...');
      setProgressPercent(50);

      const startNodeData: Record<string, unknown> = {
        story_id: story.id,
        node_key: 'start',
        content: generatedData.startContent,
        is_ending: false,
        ending_type: null,
        order_index: 0,
        parent_choice_id: null,
        image_prompt: generatedData.styleGuide ? JSON.stringify(generatedData.styleGuide) : null,
      };

      const { data: startNode, error: startNodeError } = await supabase
        .from('story_nodes')
        .insert(startNodeData)
        .select()
        .single();

      if (startNodeError) throw startNodeError;

      setProgress('Creating story choices...');
      setProgressPercent(70);

      if (generatedData.initialChoices && generatedData.initialChoices.length > 0) {
        for (let i = 0; i < generatedData.initialChoices.length; i++) {
          const choice = generatedData.initialChoices[i];

          const { data: placeholderNode } = await supabase
            .from('story_nodes')
            .insert({
              story_id: story.id,
              node_key: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_placeholder`,
              content: '',
              is_ending: false,
              ending_type: null,
              order_index: i + 1,
              parent_choice_id: null,
              is_placeholder: true,
            })
            .select()
            .single();

          if (placeholderNode) {
            await supabase
              .from('story_choices')
              .insert({
                from_node_id: startNode.id,
                to_node_id: placeholderNode.id,
                choice_text: choice.text,
                consequence_hint: choice.hint,
                choice_order: i,
              });
          }
        }
      }

      setProgress('Starting background generation...');
      setProgressPercent(85);

      await startStoryGeneration(story.id, userId);

      setProgress('Story ready to begin!');
      setProgressPercent(100);

      loadUsage().catch(err => console.error('Failed to reload usage:', err));
      progressQuest('create_story').catch(err => console.error('Failed to update quest:', err));

      console.log('Navigating to story:', story.id);
      onStoryCreated(story.id);
    } catch (err) {
      console.error('Error generating story:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate story. Please try again.');
      setIsGenerating(false);
      setProgress('');
      setProgressPercent(0);
    }
  };

  // Adult-focused story suggestions with romance, tension, and chemistry
  const suggestions = [
    // Romance & Chemistry
    'A forbidden romance between rival family heirs at a Venetian masquerade ball',
    'Two strangers stuck in a snowbound cabin with undeniable chemistry',
    'A bodyguard falling for the person they\'re sworn to protect',
    'Reconnecting with your first love at a destination wedding in Santorini',
    'A fake relationship that becomes dangerously real at a family reunion',
    'An enemies-to-lovers story between competing CEOs forced to merge companies',
    'A secret affair between a senator and their campaign manager',
    'Tension-filled encounters with your ex who just moved next door',
    'A passionate romance blooming during a cross-country road trip',
    'Falling for the mysterious artist you commissioned for a portrait',
    // Thriller & Mystery
    'A noir detective investigating murders in 1940s Los Angeles with a femme fatale',
    'A psychological thriller where you wake up in a stranger\'s apartment',
    'A corporate spy uncovering dark secrets at a powerful tech company',
    'A journalist investigating disappearances with a suspicious but attractive source',
    'A therapist whose patient\'s confessions become dangerously personal',
    'A hacker who stumbles upon a conspiracy with an unexpected ally',
    'A casino dealer who notices something wrong with the high-rollers',
    'A photographer who captures something they shouldn\'t have',
    'A witness protection agent whose identity is compromised',
    // Drama & Tension
    'A chef competing in a cutthroat culinary competition against an old flame',
    'A lawyer defending a client while navigating attraction to opposing counsel',
    'A fashion designer facing betrayal from their business partner and lover',
    'A wine merchant in Tuscany caught between two powerful families',
    'A diplomat navigating political crisis with romantic complications',
    'A musician and their muse in a complicated creative partnership',
    'A surgeon facing ethical dilemmas with personal stakes',
    // Adventure & Fantasy
    'A treasure hunter racing against a charming rival to find lost artifacts',
    'A space commander torn between duty and an forbidden attraction',
    'An archeologist and rival discovering an ancient tomb together',
    'A retired spy pulled back in for one final mission with an old partner',
    'Two pilots stranded on a mysterious island after a crash',
    'A paranormal investigator in a haunted mansion with unexpected company',
  ];

  return (
    <div className="min-h-screen bg-gray-950 pb-20">
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
      <div className="max-w-2xl w-full mx-auto px-4 pt-4 pb-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Create Your Story</h1>
          <p className="text-sm text-gray-400">Describe the adventure you want to experience</p>
          <div className="mt-4 flex justify-center">
            <UsageBadge onUpgradeClick={() => setShowUpgradeModal(true)} />
          </div>
        </div>

        <div className={`bg-gray-900 rounded-3xl shadow-xl p-6 mb-6 space-y-4 relative border border-gray-800 ${usage?.isPro ? 'pt-12' : ''}`}>
          {usage?.isPro && (
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center gap-2 rounded-t-3xl">
              <Crown className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-bold">PRO</span>
            </div>
          )}

          {/* Story Topic */}
          <div className="p-4 bg-gray-800/50 rounded-2xl">
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              Story Concept
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., A psychological thriller where I'm a detective investigating impossible crimes..."
              className="w-full h-32 px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-2xl focus:outline-none focus:border-purple-500 resize-none text-white placeholder-gray-500"
              disabled={isGenerating}
            />
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500">
                  Need inspiration? Try these:
                </p>
                <button
                  onClick={randomizeSuggestions}
                  disabled={isGenerating}
                  className="text-xs text-purple-400 hover:text-purple-300 font-medium disabled:opacity-50 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  More ideas
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {randomSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPrompt(suggestion)}
                    disabled={isGenerating}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-purple-400 text-xs rounded-xl transition-colors disabled:opacity-50 border border-gray-700"
                  >
                    {suggestion.length > 60 ? suggestion.substring(0, 60) + '...' : suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Art Style */}
          <div className="p-4 bg-gray-800/50 rounded-2xl">
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              Visual Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'cinematic', label: 'Cinematic' },
                { value: 'noir', label: 'Film Noir' },
                { value: 'realistic', label: 'Realistic' },
                { value: 'fantasy', label: 'Fantasy' },
                { value: 'anime', label: 'Anime' },
                { value: 'oil-painting', label: 'Oil Painting' },
                { value: 'graphic-novel', label: 'Graphic Novel' },
                { value: 'concept-art', label: 'Concept Art' }
              ].map((style) => (
                <button
                  key={style.value}
                  type="button"
                  onClick={() => setArtStyle(style.value)}
                  disabled={isGenerating}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${
                    artStyle === style.value
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div className="p-4 bg-gray-800/50 rounded-2xl">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-300">
                Story Visibility
              </label>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-400">
                  {isPublic ? 'Public' : 'Private'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  disabled={isGenerating}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                    isPublic ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isPublic ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Narrator */}
          <div className="p-4 bg-gray-800/50 rounded-2xl">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-300">
                Voice Narration
              </label>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-400">
                  {narratorEnabled ? 'On' : 'Off'}
                </span>
                <button
                  type="button"
                  onClick={handleNarratorToggle}
                  disabled={isGenerating}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                    narratorEnabled ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      narratorEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* AI Video Clips - Pro Feature */}
          <div className="p-4 bg-gray-800/50 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-purple-400" />
                <label className="text-sm font-semibold text-gray-300">
                  AI Video Clips
                </label>
                {!usage?.isPro && (
                  <span className="px-2 py-0.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-full">
                    PRO
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-400">
                  {videoEnabled ? 'On' : 'Off'}
                </span>
                <button
                  type="button"
                  onClick={handleVideoToggle}
                  disabled={isGenerating}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                    videoEnabled && usage?.isPro
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                      : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      videoEnabled && usage?.isPro ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Generate cinematic video clips for each chapter using AI
            </p>
          </div>

          {error && (
            <div className="mt-4 bg-red-900/30 border border-red-500/50 rounded-2xl p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {isGenerating && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300 font-medium">{progress}</span>
                <span className="text-gray-500">{progressPercent}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-purple-600 to-pink-600"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 text-center">
                {progressPercent < 100 ? 'Please wait while we craft your story...' : 'Ready to begin!'}
              </p>
            </div>
          )}

          <button
            onClick={handleGenerateStory}
            disabled={isGenerating || !prompt.trim()}
            className="w-full mt-8 py-6 text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isGenerating ? (
              <>
                <Loader className="w-6 h-6 animate-spin" />
                Creating Your Story...
              </>
            ) : (
              <>
                <Wand2 className="w-6 h-6" />
                Generate Story
              </>
            )}
          </button>
        </div>

        <div className="bg-gray-900 rounded-3xl shadow-xl p-6 border border-gray-800">
          <div className="text-sm text-gray-300 space-y-2">
            <p className="font-semibold">How it works:</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-400">
              <li>Describe the story concept you want to explore</li>
              <li>AI generates the opening chapter instantly</li>
              <li>Make choices that shape your narrative</li>
              <li>Every decision leads to different outcomes</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
