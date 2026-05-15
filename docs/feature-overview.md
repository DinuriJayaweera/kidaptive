# Feature Overview

## What is Kidaptive?

Kidaptive is an **adaptive English learning platform** for children aged 5–10. It adjusts the difficulty of questions to each child's ability in real time, rewards progress with a gamification system, and gives parents a clear view of their children's learning journey.

---

## User Roles

| Role | How they access the app |
|------|------------------------|
| **Parent** | Email + password (or Google OAuth) |
| **Child** | Emoji sequence or 4-digit PIN — configured by parent |
| **Admin** | Email + password (internal accounts only) |

---

## Feature Areas

### 1. Authentication & Onboarding

**Parent signup**
- Register with name, email, and a strong password
- Email OTP verification before account activation
- Alternative: one-click Google OAuth sign-in/sign-up

**Child account creation (by parent)**
- Parent adds child profiles: name, age, and login method (PIN or emoji sequence)
- Each child appears under the parent's account and logs in from the child selection screen

**Password recovery**
- Forgot password flow: OTP sent to email → enter OTP → set new password

**Child forgot pattern**
- Child submits their username on the `/auth/child/forgot` page
- This creates a `PasswordResetRequest` record and notifies the parent
- Parent receives a notification and can reset the child's PIN/emoji from their dashboard
- Two methods: change using the old emoji pattern, or receive an OTP via parent email

---

### 2. Child Intro & Onboarding Flow

First-time child login triggers a guided introduction before the placement test:

```
Child intro → Achievements preview → "Find your level" explanation
  → Placement explanation → Loading screen → Placement quiz
```

This ensures every child understands the system before being assessed.

---

### 3. Initial Placement Test

Before a child can start learning, they take a placement test to determine their starting level in each category.

- Questions are delivered in batches of up to 4 categories (5 questions per category)
- The process repeats until all active categories for the child's age group are assessed
- Scoring thresholds assign a starting level per category:
  - ≥ 80% correct → **Explorer**
  - < 80% correct → **Starter**
- Once complete, the child's dashboard shows their categories with assigned levels

---

### 4. Adaptive Quiz Engine

The quiz is the core learning activity.

**Starting a quiz**
- Child selects a category tile from their dashboard
- The system fetches 5 questions matched to their current level and age group
- Questions already attempted recently are excluded to ensure variety

**Difficulty mapping**

| Level | Difficulty |
|-------|-----------|
| Starter | Easy |
| Explorer | Medium |
| Champion | Hard |

**Answering questions**
- Multiple-choice with 4 options
- A countdown timer creates gentle time pressure
- Time-weighted scoring rewards faster correct answers:

| Time taken | Score |
|-----------|-------|
| 0–10 seconds | 100 pts |
| 11–15 seconds | 80 pts |
| 16–20 seconds | 60 pts |
| > 20 seconds | 40 pts |

**Results**
- XP earned, gems earned, score
- Any new achievements unlocked (shown as toast notifications)
- Wrong answers recorded for Mistakes Practice

---

### 5. Level Progression

Each category is independent. A child progresses through three levels per category:

```
Starter ──(50 XP)──► Explorer ──(50 XP more)──► Champion
```

At Champion level, wins are tracked separately. Milestone badges unlock at win thresholds:

```
Bronze (5 wins) → Silver (15 wins) → Gold (30 wins) → Master (50 wins)
```

---

### 6. Learning Categories

Categories are defined and managed by admins. Each category has:
- A name and description
- An `active` or `pending` status (only active categories appear to children)
- Questions assigned by age group (5–6, 7–8, 9–10) and difficulty (easy, medium, hard)

Typical categories: Grammar, Vocabulary, Spelling, Phonics, Sentence Structure, Reading Comprehension, Writing.

---

### 7. Daily Quest

A daily cross-category challenge available once per day.

- 10 questions sampled from the daily quest question bank, matched to the child's age group
- Previously seen questions are excluded where possible
- Question types: multiple-choice (`mcq`), fill-in-the-blank (`fill`), free text (`input`), true/false (`boolean`)
- Skip and Check flow with immediate correct/incorrect feedback
- Scoring:
  - `score = round((correctCount / 10) × 100)`
  - Pass threshold: ≥ 75%
  - XP: `floor(score / 100 × 20)` — max 20 XP
  - Gems: `floor(score / 100 × 100)` + 50 bonus gems at 100%
- Cannot be replayed the same day; a 409 response prevents duplicates
- Completion triggers a parent notification

---

### 8. Mistakes Practice

Wrong answers from quizzes are automatically logged. A dedicated Practice section lets children revisit and retry those specific questions.

- Questions are presented in the same multiple-choice format
- Answering correctly resolves the mistake

---

### 9. Gamification System

**XP (Experience Points)**
- Earned on every correct quiz answer, scaled by time taken
- Drives level progression within categories
- Shown in the top bar and on the leaderboard

**Gems**
- Earned on quiz passes: +10 per Starter/Explorer pass, +20 per Champion pass
- +20 bonus gems every 5th completed quiz
- Earned on daily quest completion (up to +150 at 100%)
- Spent to unlock mini-games
- Visible in the top bar

**Streaks**
- Increment each day the child completes at least one quiz
- Bonus XP at 3-day and 5-day milestones
- Reset to 0 if a day is missed

**Leaderboard**
- Children ranked by total XP
- Scoped to age group (default) or global
- Unlocks after completing at least 5 quizzes
- Updates after each quiz submission

**Achievements**
Unlockable badges for reaching milestones:

| Category | Examples |
|----------|---------|
| Participation | First Quiz, 10 Quizzes, 50 Quizzes |
| Streaks | 3-Day Streak, 7-Day Streak |
| Performance | Perfect Score, 90% Accuracy |
| Collection | 100 Gems Earned |
| Mastery | Category Champion, Champion Bronze/Silver/Gold/Master |

Achievements are evaluated automatically after every quiz submission. New unlocks appear as animated toast notifications.

**Avatar customisation**
- Children can set an emoji avatar or upload a custom image

---

### 10. Mini-Games

Three vocabulary-focused games, each with 5 levels. Levels must be unlocked with gems.

| Game | Unlock cost | Description |
|------|-------------|-------------|
| **Word Finder** | 100 gems | Find hidden words in a letter grid |
| **Spelling Challenge** | 150 gems | Study a word, then spell it from memory |
| **Word Builder** | 200 gems | Construct words from a scrambled set of letters |

Completing levels earns additional gems, creating a reward loop between quizzes and games.

---

### 11. Stories

An in-app library of PDF stories curated by admins.

- Admins upload stories (PDF + optional cover image) and set them to `published` or `draft`
- Published stories appear in the child's Stories section
- Children can browse the library and read stories in-app

---

### 12. Music

An in-app collection of educational songs and tracks.

- Admins upload audio or video tracks with cover images; `published \| draft` status
- Published tracks appear in the child's Music section
- Children can browse and play tracks in-app

---

### 13. Letters Page

An alphabet reference page within the child interface for quick lookup while reading or writing.

---

### 14. Parent Dashboard

Parents have a dedicated interface separate from the child experience.

**Children overview**
- Cards for each child showing name, avatar, current streak, total XP
- Quick link to each child's detailed progress page

**Per-child progress page**
- Total XP, gems, and streak
- Category-by-category level breakdown with XP bars
- Quiz completion count and accuracy rate
- Recent activity log

**Account management**
- Add, edit, or remove child profiles
- Change child login method (PIN ↔ emoji)
- Reset child password via the dedicated `/parent/reset-child/:childId` page
- Update own profile, notification preferences, and monitoring settings

**Notifications**
- Real-time feed of child activity events: level-ups, champion reached, achievements unlocked, daily quest completed, streak milestones, inactivity alerts
- Unread count badge; mark all read

---

### 15. Admin Panel

Internal tool for managing platform content and monitoring users.

**Content management**
- Quiz questions: create, edit, delete (filter by category, age group, difficulty)
- Placement test questions: full CRUD
- Daily quest questions: full CRUD (filtered by age group and type)
- Categories: activate, deactivate, edit
- Stories: upload PDF + cover image, publish/draft toggle
- Music: upload audio/video + cover image, publish/draft toggle

**User management**
- View all users filtered by role
- Lock or unlock accounts
- View user details and activity

**Analytics**
- Platform-wide stats: active users, quiz completions, average scores
- Age group breakdown: per-group stats and category completion matrices
- Identify struggling learners

**Notifications**
- System alert feed: new registrations, low question banks, high activity, errors

**Ratings**
- View all parent star ratings and written feedback

---

### 16. Parent Ratings

Parents can rate the platform (1–5 stars) with optional written feedback.

- A smart prompt appears in the parent dashboard at an appropriate time
- Parents can dismiss with "Not now" or "Never ask"
- Ratings are visible to admins and summarised on the public landing page

---

### 17. Contact & Legal Pages

**Contact** (`/contact`) — parents and visitors can submit a message directly to the team.

**Legal pages** (`/about`, `/privacy`, `/terms`, `/safety`) — About us, Privacy Policy, Terms of Service, and Child Safety policy pages available to all visitors.

---

## User Flows at a Glance

### New Child Flow

```
Parent signs up → Verifies email → Creates child profile
  → Child selects account → Enters PIN/emoji
  → Intro onboarding flow (4 screens)
  → Placement test (multi-batch)
  → Assigned levels appear on dashboard
  → Child completes daily quests + category quizzes
  → Earns XP, gems, achievements
  → Unlocks and plays mini-games
  → Reads stories and listens to music
```

### Returning Child Flow

```
Child selects account → Enters PIN/emoji
  → Dashboard shows categories + stats
  → Child picks a category → Takes 5-question quiz
  → Results screen: XP + gems earned, achievements toasted
  → Returns to dashboard (stats updated)
```

### Parent Monitoring Flow

```
Parent logs in → Dashboard lists children
  → Notification bell shows recent events
  → Clicks child → Sees full progress breakdown
  → Adjusts child settings or resets PIN if needed
```

### Child Forgot Pattern Flow

```
Child taps "Forgot pattern" on login
  → Submits username
  → Parent receives notification
  → Parent goes to Notifications → clicks "Reset"
  → Parent resets via old emoji OR sends OTP to their email
  → Child logs in with new pattern
```
