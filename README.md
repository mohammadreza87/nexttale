# Mina - AI-Powered Interactive Storytelling for Children

**Create, share, and experience personalized interactive stories brought to life with AI-generated illustrations and narration.**

Mina transforms storytelling into an immersive, interactive experience for children ages 5-10. Users create their own branching narratives or explore community stories, with each choice leading to unique paths and outcomes.

## Features

### Story Creation
- **AI-Powered Generation** - Generate complete interactive stories with branching paths using Gemini
- **Story Memory System** - Proprietary technology maintains narrative coherence across chapters (characters remember events, plot threads resolve naturally)
- **Visual Storytelling** - AI-generated illustrations for every scene with Gemini image generation
- **Audio Narration** - Professional text-to-speech brings stories to life (ElevenLabs voices)
- **Multi-language Support** - Create stories in multiple languages with automatic detection

### Story Library
- **Discover Stories** - Browse public stories from the community
- **Interactive Reading** - Make choices that shape the story outcome
- **Multiple Endings** - Each path leads to different conclusions
- **Progress Tracking** - Automatic save and resume functionality

### Social Features
- **User Profiles** - Customizable profiles with avatars and bios
- **Follow System** - Follow favorite creators
- **Reactions** - Like/dislike stories
- **Comments** - Discuss stories with the community

### Gamification
- **Points System** - Earn points for reading and creating
- **Daily/Weekly Quests** - Complete challenges for rewards
- **Progress Tracking** - Track reading and creation stats

### Subscription Tiers
- **Free** - 2 story generations per day
- **Pro** ($20/month or $200/year) - Unlimited generation, priority features

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for development and builds
- **Tailwind CSS** for styling
- **Lucide React** for icons

### Backend
- **Supabase** - Database, authentication, storage
- **PostgreSQL** with Row Level Security
- **Edge Functions** (Deno runtime) for serverless APIs

### AI Services
- **Gemini (Google AI)** - Story generation and image generation
- **ElevenLabs** - Audio narration

### Payments
- **Stripe** - Checkout, subscriptions, webhooks

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Gemini API key
- ElevenLabs API key (and a voice ID)
- Stripe account (for subscriptions)

### Installation

1. Clone and install:
```bash
git clone <repository-url>
cd mina
npm install
```

2. Configure environment variables (`.env`):
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

3. Configure Supabase Edge Function secrets:
```
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-1.5-flash-latest (optional override)
GEMINI_IMAGE_MODEL=imagegeneration (optional override)
ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_VOICE_ID=your_default_voice_id
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

4. Run database migrations:
```bash
supabase db push
```

5. Deploy Edge Functions:
```bash
supabase functions deploy
```

6. Start development server:
```bash
npm run dev
```

## Project Structure

```
mina/
├── src/
│   ├── components/           # React components
│   │   ├── auth/            # Authentication (login, signup)
│   │   └── subscription/    # Billing components
│   ├── lib/                 # Services and utilities
│   │   ├── supabase.ts     # Supabase client
│   │   ├── authContext.tsx # Auth state management
│   │   ├── storyService.ts # Story CRUD operations
│   │   ├── pointsService.ts # Gamification
│   │   └── types.ts        # TypeScript interfaces
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components
│   └── App.tsx             # Main application
├── supabase/
│   ├── functions/          # Edge Functions
│   │   ├── generate-story/ # Story generation with memory
│   │   ├── generate-image/ # Image generation
│   │   ├── text-to-speech/ # Audio generation
│   │   ├── create-checkout/# Stripe checkout
│   │   ├── stripe-webhook/ # Payment webhooks
│   │   └── _shared/        # Shared types
│   └── migrations/         # Database schema
└── dist/                   # Production build
```

## Database Schema

### Core Tables
- **stories** - Story metadata, outline, memory
- **story_nodes** - Individual chapters/scenes
- **story_choices** - Branching decision points
- **user_profiles** - User data, subscription, points
- **user_story_progress** - Reading progress

### Social Tables
- **story_reactions** - Likes/dislikes
- **story_comments** - User comments
- **user_followers** - Follow relationships

### Gamification Tables
- **user_quests** - Daily/weekly challenges
- **reading_progress** - Chapter tracking
- **story_completions** - Completion records

## Key Technical Features

### Story Memory System
Stories use a two-phase generation approach:
1. **Outline Generation** - Complete story structure with characters, plot threads, chapters
2. **Chapter Generation** - Each chapter references the outline and accumulated memory

This ensures:
- Consistent character appearances
- Plot threads that resolve naturally
- Coherent narrative progression
- Visual consistency in images

### Security
- Row Level Security on all tables
- JWT-based authentication
- Secure API key management
- HTTPS-only communication

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking
npm run test         # Run tests
npm run test:run     # Run tests once
npm run test:coverage # Run tests with coverage
```

## Deployment

### Frontend
Deploy the `dist/` folder to any static host:
- Netlify
- Vercel
- Cloudflare Pages

### Backend
- Supabase handles database and auth
- Edge Functions deploy via `supabase functions deploy`

## Documentation

- [Stripe Setup Guide](./STRIPE_SETUP.md) - Payment configuration
- [Mobile App Guide](./MOBILE_APP_GUIDE.md) - iOS/Android deployment with Capacitor
- [Gamification Roadmap](./GAMIFICATION_ROADMAP.md) - Future engagement features

## License

Proprietary software. All rights reserved.

## Support

For issues or feature requests, contact the development team.
