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

---

### 2. Initial Placement Test

Before a child can start learning, they take a placement test to determine their starting level in each category.

- Questions are delivered in batches of ~4 categories at a time (5 questions per category)
- The process repeats until all active categories are assessed
- Scoring thresholds assign a starting level per category:
  - ≥ 80% correct → **Explorer**
  - < 80% correct → **Starter**
- Once complete, the child's dashboard shows their categories with assigned levels and they can begin quizzes

---

### 3. Adaptive Quiz Engine

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
- XP earned, gems earned, score out of 5
- Any new achievements unlocked (shown as toast notifications)
- Wrong answers recorded for Mistakes Practice

---

### 4. Level Progression

Each category is independent. A child progresses through three levels per category:

```
Starter ──(50 XP)──► Explorer ──(50 XP more)──► Champion
```

At Champion level:
- Wins are tracked separately
- Milestone badges unlock at win thresholds: Bronze (5) → Silver (15) → Gold (30) → Master (50)

---

### 5. Learning Categories

Categories are defined and managed by admins. Each category has:
- A name and description
- An `active` or `pending` status (only active categories appear to children)
- Questions assigned by age group (5–6, 7–8, 9–10) and difficulty (easy, medium, hard)

Typical categories: Grammar, Vocabulary, Spelling, Phonics, Sentence Structure, Reading Comprehension, Writing.

---

### 6. Mistakes Practice

Wrong answers from quizzes are automatically logged. A dedicated "Mistakes Practice" section lets children revisit and retry those specific questions to reinforce learning.

- Questions are presented in the same multiple-choice format
- Answering correctly resolves the mistake and removes it from the practice list

---

### 7. Gamification System

**XP (Experience Points)**
- Earned on every correct quiz answer, scaled by time taken
- Drives level progression within categories
- Shown in the top bar and on leaderboard

**Gems**
- Earned at a rate of 1 gem per correct answer
- Spent to unlock mini-games
- Visible in the top bar

**Streaks**
- Increment each day the child completes at least one quiz
- Bonus XP at 3-day and 5-day milestones
- Reset to 0 if a day is missed

**Leaderboard**
- All children on the platform ranked by total XP
- Updates in real time after each quiz submission

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

### 8. Mini-Games

Three vocabulary-focused games, each with 5 levels. Levels must be unlocked with gems.

| Game | Description |
|------|-------------|
| **Word Finder** | Find hidden words in a letter grid |
| **Spelling Challenge** | Study a word, then spell it from memory |
| **Word Builder** | Construct words from a scrambled set of letters |

Completing levels earns additional gems, creating a loop between quizzes and games.

---

### 9. Parent Dashboard

Parents have a dedicated interface separate from the child experience.

**Children overview**
- Cards for each child showing name, avatar, current streak, total XP
- Quick link to each child's detailed progress page

**Per-child progress page**
- Total XP, gems, and streak
- Category-by-category level breakdown with XP bars
- Quiz completion count and accuracy rate
- Recent activity log (timestamps of quizzes, achievements, games)

**Account management**
- Add, edit, or remove child profiles
- Change child login method (PIN ↔ emoji)
- Update own profile and notification preferences

---

### 10. Admin Panel

Internal tool for managing platform content and monitoring users.

**Content management**
- Create, edit, and delete quiz questions (filter by category, age group, difficulty)
- Create, edit, and delete placement test questions
- Manage categories (activate, deactivate, edit details)

**User management**
- View all users filtered by role
- Lock or unlock accounts
- View user details and activity

**Analytics**
- Platform-wide performance: active users, quiz completions, average scores
- Age group breakdown: per-group statistics and category completion matrices
- Identify struggling learners (low accuracy, high mistake rate)

---

## User Flows at a Glance

### New Child Flow

```
Parent signs up → Verifies email → Creates child profile
  → Child selects account → Enters PIN/emoji
  → Placement test (multi-batch)
  → Assigned levels appear on dashboard
  → Child completes daily quizzes
  → Earns XP, gems, achievements
  → Unlocks and plays mini-games
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
  → Clicks child → Sees full progress breakdown
  → Reviews recent activity log
  → Adjusts child settings if needed
```
