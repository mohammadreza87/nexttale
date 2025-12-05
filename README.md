# Next Tale - AI-Powered Interactive Storytelling

**Create, share, and experience personalized interactive stories brought to life with AI-generated illustrations, video clips, and voice narration.**

Next Tale transforms storytelling into an immersive, voice-driven interactive experience. Users create their own branching narratives or explore community stories, with each choice leading to unique paths and outcomes.

## Google Cloud x ElevenLabs Hackathon Submission

This project is submitted for the **ElevenLabs Challenge** in the Google Cloud Hackathon.

### Challenge Requirements Met

- **ElevenLabs Integration**: Professional AI voice narration for all story chapters using ElevenLabs' text-to-speech API with the `eleven_flash_v2_5` model
- **Google Cloud/Gemini Integration**: Story generation powered by Google's Gemini AI for creating coherent, branching narratives
- **Voice-Driven Interaction**: Users can speak their story choices using browser speech recognition, making the app fully conversational
- **Natural Voice Experience**: Stories are narrated with natural, expressive voices that bring characters to life

### How It Works

1. **Story Creation**: Users describe their story idea, and Gemini AI generates a complete branching narrative with multiple paths
2. **Voice Narration**: Each chapter is automatically narrated using ElevenLabs' high-quality text-to-speech
3. **Voice Input**: Users can speak to choose their story path (e.g., "option one", "explore the cave", etc.)
4. **Visual & Video**: AI-generated images and video clips enhance the storytelling experience

## Features

### Voice-Driven Storytelling
- **ElevenLabs Narration** - Professional AI voices narrate every chapter
- **Speech-to-Text Choices** - Speak your story choices instead of clicking
- **Multi-language Support** - Stories and narration in multiple languages

### AI-Powered Story Creation
- **Gemini Story Generation** - Create complete interactive stories with branching paths
- **Story Memory System** - Maintains narrative coherence across chapters
- **Visual Storytelling** - AI-generated illustrations for every scene (Leonardo AI)
- **Video Clips** - Animated scenes for Pro users (Leonardo Motion)

### Story Library
- **Discover Stories** - Browse public stories from the community
- **Interactive Reading** - Make choices that shape the story outcome
- **Multiple Endings** - Each path leads to different conclusions
- **Progress Tracking** - Automatic save and resume functionality

### Social Features
- **User Profiles** - Customizable profiles with avatars and bios
- **Follow System** - Follow favorite creators
- **Reactions & Comments** - Engage with the community

### Gamification
- **Points System** - Earn points for reading and creating
- **Daily/Weekly Quests** - Complete challenges for rewards

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for development and builds
- **Tailwind CSS** for styling
- **Web Speech API** for voice input

### Backend
- **Supabase** - Database, authentication, storage
- **PostgreSQL** with Row Level Security
- **Edge Functions** (Deno runtime) for serverless APIs

### AI Services
- **Google Gemini** - Story generation (via Vertex AI / Google AI)
- **ElevenLabs** - Voice narration with `eleven_flash_v2_5` model
- **Leonardo AI** - Image and video generation

### Payments
- **Stripe** - Subscriptions and checkout

## ElevenLabs Integration Details

### Text-to-Speech Implementation

Located in `supabase/functions/text-to-speech/index.ts`:

```typescript
// ElevenLabs TTS Configuration
const elevenLabsApiKey = Deno.env.get("ELEVENLABS_API_KEY");
const voiceId = Deno.env.get("ELEVENLABS_VOICE_ID"); // wyWA56cQNU2KqUW4eCsI
const modelId = Deno.env.get("ELEVENLABS_MODEL_ID"); // eleven_flash_v2_5

// Generate speech
const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
  method: "POST",
  headers: {
    "xi-api-key": elevenLabsApiKey,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    text,
    model_id: modelId,
    voice_settings: {
      stability: 0.4,
      similarity_boost: 0.7,
    },
    output_format: "mp3_44100_128",
  }),
});
```

### Features
- **Automatic Narration**: Stories with narrator enabled auto-play audio for each chapter
- **Audio Caching**: Generated audio is cached to reduce API calls
- **Progress Sync**: Audio playback syncs with text highlighting
- **Manual Control**: Play/pause narration at any time

## Google Cloud / Gemini Integration Details

### Story Generation

Located in `supabase/functions/generate-story/index.ts`:

```typescript
// Gemini Configuration
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = "gemini-2.0-flash";

// Generate story with context
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.85,
        topP: 0.9,
        maxOutputTokens: 4096,
      },
    }),
  }
);
```

### Story Memory System
- **Outline Generation**: Creates complete story structure upfront
- **Character Consistency**: Maintains character traits across chapters
- **Plot Threading**: Tracks and resolves narrative threads
- **Image Context**: Ensures visual consistency in generated images

## Voice Input Implementation

Located in `src/hooks/useVoiceInput.ts`:

```typescript
// Browser Speech Recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.continuous = false;
recognition.interimResults = true;
recognition.lang = 'en-US'; // Supports multiple languages

// Match spoken words to story choices
function matchVoiceToChoice(transcript, choices) {
  // Supports: "one", "first", "1", or keywords from choice text
}
```

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Google Cloud / Gemini API key
- ElevenLabs API key and voice ID
- Stripe account (for subscriptions)

### Installation

1. Clone and install:
```bash
git clone https://github.com/mohammadreza87/nexttale.git
cd nexttale
npm install
```

2. Configure environment variables (`.env`):
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GA_MEASUREMENT_ID=your_ga_id
```

3. Configure Supabase Edge Function secrets:
```bash
supabase secrets set GEMINI_API_KEY=your_gemini_key
supabase secrets set ELEVENLABS_API_KEY=your_elevenlabs_key
supabase secrets set ELEVENLABS_VOICE_ID=your_voice_id
supabase secrets set ELEVENLABS_MODEL_ID=eleven_flash_v2_5
supabase secrets set LEONARDO_API_KEY=your_leonardo_key
supabase secrets set STRIPE_SECRET_KEY=your_stripe_secret
```

4. Deploy Edge Functions:
```bash
supabase functions deploy
```

5. Start development server:
```bash
npm run dev
```

## Live Demo

- **App URL**: https://nexttale.vercel.app
- **Demo Video**: [Coming Soon]

## Project Structure

```
nexttale/
├── src/
│   ├── components/           # React components
│   │   ├── StoryReader.tsx  # Main reader with voice input
│   │   ├── StoryCreator.tsx # Story creation interface
│   │   └── ...
│   ├── hooks/
│   │   └── useVoiceInput.ts # Speech recognition hook
│   ├── lib/                 # Services and utilities
│   │   ├── supabase.ts     # Supabase client
│   │   ├── storyService.ts # Story CRUD operations
│   │   └── types.ts        # TypeScript interfaces
│   └── App.tsx             # Main application
├── supabase/
│   └── functions/          # Edge Functions
│       ├── generate-story/ # Gemini story generation
│       ├── text-to-speech/ # ElevenLabs TTS
│       ├── generate-image/ # Leonardo image generation
│       └── generate-video/ # Leonardo video generation
└── LICENSE                 # MIT License
```

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run test         # Run tests
```

## License

MIT License - See [LICENSE](./LICENSE) for details.

## Team

Built with passion for storytelling and AI innovation.

## Acknowledgments

- **Google Cloud / Gemini** - For powerful AI story generation
- **ElevenLabs** - For natural, expressive voice synthesis
- **Leonardo AI** - For beautiful image and video generation
- **Supabase** - For the excellent backend infrastructure
