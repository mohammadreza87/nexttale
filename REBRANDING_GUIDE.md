# NextTale Rebranding Guide
## Child Platform → Adult Creator Platform

---

## Executive Summary

This document identifies all code, content, and configuration that must be updated to transform NextTale from a children's storytelling app to a professional creative platform for adults.

---

## Critical Files Requiring Changes

### 1. AI Generation Prompts (HIGHEST PRIORITY)

#### `supabase/functions/generate-story-stream/index.ts`

**Lines 149-182: Story generation system prompts**

Current:
```typescript
systemPrompt = `You are a creative children's story writer...`
"Children's story writer for ages 5-10..."
"Simple, safe language for kids"
```

Change to:
```typescript
systemPrompt = `You are a creative story writer for interactive fiction. Write engaging,
compelling narratives that captivate adult audiences. Include:
- Complex themes and moral ambiguity
- Sophisticated vocabulary
- Emotionally resonant storytelling
- Mature consequences to choices`
```

---

#### `supabase/functions/process-story-queue/index.ts`

**Lines 653-700: Story generation prompts**

Current:
```typescript
return `You are a children's story writer for ages 5-10.
...
6. Simple words for children aged 5-10`
```

Change to:
```typescript
return `You are an interactive fiction writer creating compelling stories for adult audiences.
...
6. Sophisticated vocabulary appropriate for adult readers`
```

**Lines 736-737: Content moderation**

Current:
```typescript
`Is this content appropriate for children aged 5-10? Check for violence, scary content...`
"You are a content moderator for children's stories..."
```

Change to:
```typescript
// Replace with adult-appropriate content guidelines
`Review this content for platform policy violations. Check for:
- Hate speech or discrimination
- Explicit illegal activities
- Harassment or threats
Flag only severe violations - mature themes are allowed.`

"You are a content moderator for a creative platform. Allow mature themes, violence,
and complex topics. Flag only illegal content, hate speech, or explicit adult content."
```

**Line 905: Outline generation**

Current:
```typescript
"Outline generator for children's branching stories..."
```

Change to:
```typescript
"Outline generator for interactive fiction. Create sophisticated branching narratives
with complex themes suitable for adult audiences."
```

---

### 2. Database Schema Changes

#### `supabase/migrations/20251120103406_create_interactive_story_system.sql`

**Line 56: Default age range**

Current:
```sql
age_range text DEFAULT '5-10',
```

Change to:
```sql
content_rating text DEFAULT 'general', -- 'general', 'mature', 'adult'
```

**New migration needed:**
```sql
-- Migration: Transform age_range to content_rating

-- Add new column
ALTER TABLE stories ADD COLUMN IF NOT EXISTS content_rating text DEFAULT 'general';

-- Migrate existing data
UPDATE stories SET content_rating = 'general' WHERE age_range IS NOT NULL;

-- Drop old column (in future migration after UI updated)
-- ALTER TABLE stories DROP COLUMN age_range;

-- Add content rating index
CREATE INDEX IF NOT EXISTS idx_stories_content_rating ON stories(content_rating);
```

---

### 3. Product Documentation

#### `PRODUCTOVERVIE.md` (Complete Rewrite Required)

This file is entirely child-focused and needs complete replacement:

Current messaging:
- "children ages 5-10"
- "parents and educators"
- "Parent Dashboard"
- "child-first design"
- "COPPA compliance"

New messaging:
- "creative professionals"
- "content creators, game designers, musicians, writers"
- "Creator Dashboard"
- "creator-first design"
- "Revenue sharing and NFT ownership"

**Recommended: Archive as `PRODUCTOVERVIE_LEGACY.md` and create new**

---

### 4. Mobile & Legal Documentation

#### `MOBILE_APP_GUIDE.md`

**Lines 135-136:**

Current:
```markdown
### COPPA (Children's Apps)
- Parental consent for data collection
```

Remove COPPA section entirely. Replace with:
```markdown
### Content Creator Guidelines
- User-generated content policies
- Revenue sharing compliance
- Cryptocurrency regulations (when applicable)
```

---

#### `GAMIFICATION_ROADMAP.md`

**Lines 190-192:**

Current:
```markdown
### Child Safety (COPPA)
- Parental controls for social features
```

Replace with:
```markdown
### Creator Safety
- Content moderation systems
- Anti-harassment tools
- Spam prevention
```

---

### 5. UI Components

#### `src/components/LandingPage.tsx`

**Line 492: Testimonial**

Current:
```typescript
"Finally, interactive fiction that doesn't feel childish. The AI writing is genuinely compelling."
```

This can stay - it actually supports adult positioning. But add more creator-focused testimonials:

```typescript
const testimonials = [
  {
    quote: "I made my first game in 30 minutes. Now it's earning TaleCoin daily.",
    author: "Sarah K., Game Designer"
  },
  {
    quote: "Finally, a platform that respects creators. The revenue share is unmatched.",
    author: "Marcus T., Musician"
  },
  {
    quote: "My interactive stories have found an audience I never could reach before.",
    author: "Elena R., Writer"
  }
];
```

---

### 6. Type Definitions

#### `src/lib/types.ts` and `packages/types/src/story.ts`

Add content rating types:
```typescript
export type ContentRating = 'general' | 'teen' | 'mature' | 'adult';

export interface Story {
  // ... existing fields
  content_rating: ContentRating;
  // Remove: age_range
}
```

---

### 7. Traffic Generator Scripts

#### `scripts/traffic-generator.ts`

**Line 70:**

Current:
```typescript
'A young wizard learns their first spell goes wrong',
```

Replace with adult-appropriate prompts:
```typescript
'A detective uncovers a conspiracy that reaches the highest levels of power',
'An AI gains consciousness and must decide humanity\'s fate',
'A corporate whistleblower risks everything to expose corruption',
'A veteran returns home to find their world has changed beyond recognition',
```

---

## UI/UX Changes Required

### Landing Page Redesign

| Current | New |
|---------|-----|
| "Stories for children" | "Create. Play. Earn." |
| "Parents love it" | "Creators thrive here" |
| "Age-appropriate" | "Unlimited creativity" |
| "Educational" | "Professional tools" |
| Purple/pink playful | Dark/gradient professional |
| Child illustrations | Creator-focused imagery |

### Navigation Changes

| Current | New |
|---------|-----|
| "Create Story" | "Create" |
| "My Stories" | "My Content" |
| (none) | "Earnings" |
| (none) | "Analytics" |
| (none) | "NFTs" (future) |

### Profile Changes

| Current | New |
|---------|-----|
| Points display | TaleCoin balance (future) |
| Streaks | Creator level + XP |
| Basic stats | Full analytics dashboard |
| (none) | Revenue history |
| (none) | NFT collection |

---

## Content Moderation Policy Changes

### From (Child-Safe):
- No violence whatsoever
- No scary themes
- No complex emotions
- Strictly educational content

### To (Creator Platform):

#### Allowed Content:
- Violence (non-gratuitous)
- Horror and thriller themes
- Complex moral themes
- Political and social commentary
- Dark humor
- Mature relationships (non-explicit)

#### Still Prohibited:
- Explicit sexual content
- Hate speech / discrimination
- Real-world violence promotion
- Harassment
- Illegal activity promotion
- Misinformation

---

## Database Migration Plan

### Phase 1: Add New Fields
```sql
-- Add content rating
ALTER TABLE stories ADD COLUMN content_rating text DEFAULT 'general';

-- Add creator-focused fields
ALTER TABLE user_profiles ADD COLUMN creator_level integer DEFAULT 1;
ALTER TABLE user_profiles ADD COLUMN total_xp integer DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN talecoin_balance decimal(18,8) DEFAULT 0;

-- Add content monetization fields
ALTER TABLE stories ADD COLUMN is_premium boolean DEFAULT false;
ALTER TABLE stories ADD COLUMN price_talecoin decimal(18,8);
ALTER TABLE interactive_content ADD COLUMN is_premium boolean DEFAULT false;
ALTER TABLE interactive_content ADD COLUMN price_talecoin decimal(18,8);
```

### Phase 2: Deprecate Old Fields
```sql
-- Mark age_range as deprecated (don't remove yet)
COMMENT ON COLUMN stories.age_range IS 'DEPRECATED: Use content_rating instead';
```

### Phase 3: Remove Old Fields (After UI Updated)
```sql
-- Run after all UI references removed
ALTER TABLE stories DROP COLUMN IF EXISTS age_range;
```

---

## Environment Variable Updates

### Add New Variables:
```env
# Content moderation
VITE_ALLOW_MATURE_CONTENT=true
VITE_DEFAULT_CONTENT_RATING=general

# Creator economy (Phase 3+)
VITE_TALECOIN_ENABLED=false
VITE_NFT_MINTING_ENABLED=false
VITE_ADS_ENABLED=false

# Analytics
VITE_CREATOR_ANALYTICS_ENABLED=true
```

---

## Testing Checklist

### AI Generation Tests:
- [ ] Story generation produces adult-appropriate content
- [ ] Content moderation allows mature themes
- [ ] No child-specific vocabulary in outputs
- [ ] Complex narratives generated successfully

### UI Tests:
- [ ] No child references visible
- [ ] Creator-focused messaging throughout
- [ ] Professional design elements
- [ ] Mobile responsive

### Database Tests:
- [ ] Content rating migration successful
- [ ] New fields added correctly
- [ ] Old data preserved during transition

---

## Timeline

| Week | Tasks |
|------|-------|
| 1 | Update AI prompts, add content moderation |
| 2 | Database migrations, type updates |
| 3 | Landing page redesign |
| 4 | Full UI audit and cleanup |
| 5 | Testing and QA |
| 6 | Soft launch to adult creators |

---

## Files Summary

### High Priority (AI/Backend):
1. `supabase/functions/generate-story-stream/index.ts`
2. `supabase/functions/process-story-queue/index.ts`
3. New migration for content_rating

### Medium Priority (Documentation):
4. `PRODUCTOVERVIE.md` (archive and rewrite)
5. `MOBILE_APP_GUIDE.md`
6. `GAMIFICATION_ROADMAP.md`

### Lower Priority (UI Polish):
7. `src/components/LandingPage.tsx`
8. `src/components/LandingPageMinimal.tsx`
9. Various UI components (testimonials, onboarding)

### Already Good:
- Technical architecture (no child-specific code)
- Authentication system
- Database structure (mostly)
- Subscription system

---

*Document Version: 1.0*
*Last Updated: January 2025*
