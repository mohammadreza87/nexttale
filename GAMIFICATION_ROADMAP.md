# Gamification Roadmap

This document outlines the gamification features for Mina, separating what's currently implemented from planned future features.

---

## Currently Implemented

### Points System
- **Reading Points** - Earned by reading chapters
- **Creating Points** - Earned by creating stories
- **Total Points** - Combined score displayed on profile

Database fields in `user_profiles`:
- `total_points`
- `reading_points`
- `creating_points`

### Daily/Weekly Quests
- Quest system with progress tracking
- Daily and weekly challenge types
- Point rewards for completion

Database tables:
- `user_quests` - User quest progress

### Basic Progress Tracking
- `reading_progress` - Track chapters read
- `story_completions` - Track stories completed
- Usage counters for subscription limits

---

## Planned Features

### Phase 1: Engagement Foundation

#### Reading Streaks
Track consecutive days of reading activity.

```sql
-- Database additions needed
ALTER TABLE user_profiles ADD COLUMN reading_streak_current INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN reading_streak_best INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN last_reading_date DATE;
ALTER TABLE user_profiles ADD COLUMN streak_freeze_tokens INTEGER DEFAULT 2;
```

Features:
- Flame icon with streak count
- Streak freezes (2 free/month, Pro gets 5)
- Milestone rewards at 7, 30, 100 days
- Streak reminder notifications

#### Enhanced Points Economy
Expand point earning and spending:

**Earning:**
- Read chapter: 10 SP
- Complete story: 50 SP bonus
- Create story: 100 SP
- Receive like: 5 SP
- Daily login: 20 SP

**Spending:**
- Unlock special themes
- Custom avatar frames
- Narrator voice options

#### Level System
```
Levels 1-100 with titles:
1-10: Story Seedling
11-20: Page Turner
21-30: Chapter Champion
31-40: Plot Master
41-50: Narrative Ninja
51-60: Epic Explorer
61-70: Legend Weaver
71-80: Myth Maker
81-90: Saga Sage
91-100: Story Sovereign
```

### Phase 2: Achievement System

#### Progressive Badges

**Reading Achievements:**
- Bookworm (Read 5/25/100 stories)
- Explorer (Try 5/10/20 genres)
- Completionist (Finish 10/50/200 stories)

**Creation Achievements:**
- Storyteller (Create 1/5/20 stories)
- Rising Star (Get 10/50/200 likes)
- Community Builder (10/50/100 followers)

**Special Achievements:**
- Unicorn Hunter (Find rare ending)
- Generous (Give 50 likes)
- Early Bird (Read before 7am, 7 days)

```sql
-- Achievement table
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  achievement_id VARCHAR(100) NOT NULL,
  achievement_name VARCHAR(255) NOT NULL,
  achievement_description TEXT,
  achievement_icon VARCHAR(50),
  earned_at TIMESTAMP DEFAULT NOW(),
  progress INTEGER DEFAULT 0,
  max_progress INTEGER DEFAULT 1,
  UNIQUE(user_id, achievement_id)
);
```

### Phase 3: Social & Competitive

#### Leaderboards
- Weekly reading leaderboard
- Top creators
- Streak champions

#### Story Battles
- Weekly voting on best stories
- Categories: Funniest, Most Creative, Best Ending
- Winners get crown icon

#### Reading Clubs
- Create/join clubs (max 20 members)
- Club challenges
- Shared reading lists

### Phase 4: Advanced Features

#### Character Companions
- Virtual pets that grow with reading
- Starter companions (fox, owl, dragon, unicorn)
- Evolution every 10 levels

#### Story Collections
- Collect "cards" for completed stories
- Rarity levels (Common, Rare, Epic, Legendary)
- Album completion bonuses

#### Seasonal Events
- Halloween: Spooky story challenge
- Summer: Beach reading marathon
- Back to School: Educational boost
- Limited-time badges and rewards

---

## Implementation Priority

### Quick Wins (Highest Impact)
1. **Reading Streaks** - Highest retention impact
2. **Basic Achievements** - Immediate dopamine hits
3. **Level System** - Long-term progression

### Medium Priority
4. Daily challenge enhancements
5. Leaderboards
6. Achievement showcase on profile

### Future Roadmap
7. Character companions
8. Story collections
9. Reading clubs
10. Seasonal events

---

## Success Metrics

### Target Improvements
- 40% increase in DAU within 3 months
- Day 7 retention > 40%
- Average session > 15 minutes
- 70% of users earning at least one badge
- 50% maintaining 7+ day streaks

---

## Design Principles

### Child Safety (COPPA)
- No real names in leaderboards
- Parental controls for social features
- Moderated discussions
- Report/block functionality

### Avoiding Dark Patterns
- No pay-to-win mechanics
- No gambling/loot boxes
- Transparent point earning
- Respect quiet time settings

### Accessibility
- Colorblind-friendly badges
- Screen reader support
- Simple mode option
