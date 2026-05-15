<div align="center">

# Kidaptive

### Adaptive English Learning Platform for Children (Ages 5–10)

A personalized, gamified English learning web application for children with full parental supervision and an adaptive quiz engine that continuously adjusts to each child's strengths and weaknesses.

![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![MUI](https://img.shields.io/badge/MUI_v7-007FFF?style=for-the-badge&logo=mui&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express_5-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

</div>

---

## About the Project

**Kidaptive** is a final-year individual project — a responsive full-stack web application that delivers personalized English education for children aged 5–10.

The system opens with an **initial placement test** that measures a child's starting level across all learning categories. From there, every quiz is dynamically matched to the child's current ability level, age group, and category. Wrong answers are tracked for targeted remedial practice, and a gamification layer (XP, gems, streaks, badges, mini-games) keeps children engaged.

Parents register and manage child accounts, monitor progress per category, and review recent activity. An admin panel allows content managers to create and maintain questions, categories, and user accounts.

---

## Key Features

- **Guided child onboarding** — first-login intro flow explains the system before the placement test begins
- **Adaptive placement test** — assigns a starting level (Starter / Explorer) per category before the child begins learning
- **Per-category adaptive quizzes** — 5-question quizzes matched to the child's current level and age group; time-weighted scoring
- **Daily quest** — one 10-question cross-category challenge per day; up to 20 XP and 150 gems at 100%
- **Mistake tracking & remedial practice** — incorrect answers stored and surfaced for targeted retry
- **Three-tier level progression** — Starter → Explorer → Champion per category; Champion milestone badges (Bronze/Silver/Gold/Master)
- **Mini-games** — Word Finder, Spelling Challenge, Word Builder; gem-unlockable, 5 levels each
- **Stories library** — admin-curated PDF stories browsable and readable in-app by children
- **Music player** — admin-uploaded audio/video tracks playable in-app
- **Gamification** — XP, gems, daily streaks, 20+ achievements, avatar customisation, and age-scoped leaderboard (unlocks after 5 quizzes)
- **Parent dashboard** — per-child progress analytics, real-time notification feed, child PIN/emoji reset flow
- **Parent notifications** — automatic alerts for level-ups, champion milestones, achievements, daily quest, streaks, and inactivity
- **Admin panel** — full CRUD for quiz, placement, and daily quest questions; story and music upload; user management; performance analytics; admin notification feed; parent ratings dashboard
- **Dual auth modes** — parents use email/password or Google OAuth; children use emoji sequence or 4-digit PIN
- **Secure JWT auth** — short-lived access tokens (15 min) + httpOnly refresh token cookies (7 days) with automatic silent refresh
- **Public pages** — landing, about, contact form, privacy policy, terms of service, child safety policy

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, TypeScript, MUI v7, React Router v7, TanStack React Query v5 |
| **Backend** | Node.js, Express 5, TypeScript |
| **Database** | MongoDB Atlas, Mongoose 9 |
| **Auth** | JWT, bcrypt, Google OAuth (`@react-oauth/google`) |
| **Email** | Nodemailer + Gmail SMTP (OTP delivery) |
| **Validation** | Zod (backend request schemas) |
| **HTTP client** | Axios with JWT refresh interceptor |
| **Testing — backend** | Jest, ts-jest, Supertest, mongodb-memory-server |
| **Testing — frontend** | Vitest, React Testing Library, MSW |
| **Testing — E2E** | Playwright (Chromium) |
| **Code quality** | ESLint, Prettier |
| **Deployment** | Vercel (frontend), Render (backend), MongoDB Atlas |

---

## Project Structure

```
kidaptive/
├── frontend/                        # React 19 + Vite SPA
│   └── src/
│       ├── features/
│       │   ├── auth/                # Login, signup, OTP verify, Google OAuth,
│       │   │                        # child PIN, child forgot-pattern
│       │   ├── child/               # Child learning interface
│       │   │   ├── pages/           # Dashboard, Intro flow, Placement, AdaptiveQuiz,
│       │   │   │                    # DailyQuest, Practice, Achievements, Quests,
│       │   │   │                    # Leaderboard, Games, Stories, Music, Letters, Profile
│       │   │   ├── components/      # CategoryCard, TopBarStats, ChildSidebar,
│       │   │   │                    # LeaderboardCard, DailyQuestCard
│       │   │   └── services/        # quizApi, placementTestApi, childDailyQuestApi,
│       │   │                        # achievementsApi, gamesApi, screenTimeService
│       │   ├── parent/              # Parent dashboard
│       │   │   └── pages/           # Dashboard, Children, CreateChild, ChildProgress,
│       │   │                        # Settings, Profile, Notifications, ChildPasswordReset
│       │   ├── admin/               # Admin panel
│       │   │   └── pages/           # Dashboard, Quizzes, PlacementTests, DailyQuests,
│       │   │                        # Categories, Users, Performance, AgeGroups,
│       │   │                        # Stories, Music, Notifications, Ratings,
│       │   │                        # Settings, Profile
│       │   └── public/              # Landing, About, Contact, Privacy, Terms, Safety
│       ├── app/guards/              # RouteGuard (PublicOnly / ParentRoute /
│       │                            # ChildRoute / AdminRoute)
│       ├── shared/components/       # Navbar, Footer
│       ├── services/                # apiClient.ts (Axios + refresh interceptor)
│       └── routes/                  # AppRoutes.tsx (all 50+ routes)
│
├── backend/                         # Express 5 REST API
│   └── src/
│       ├── config/                  # db.ts (MongoDB Atlas connection)
│       ├── middleware/              # auth, upload (Multer), error
│       ├── routes/                  # 28 route files (auth, quiz, placement,
│       │                            # dailyQuest, games, stories, music, notifications,
│       │                            # childPasswordReset, ratings, contact, admin/*, health)
│       ├── controllers/             # Thin request/response handlers
│       ├── services/
│       │   ├── quiz.service.ts           # Adaptive quiz + scoring
│       │   ├── placement-test.service.ts # Placement engine
│       │   ├── childDailyQuest.service.ts # Daily quest engine
│       │   ├── achievements.service.ts   # Achievement evaluation
│       │   ├── notification.service.ts   # Parent notification creation
│       │   ├── adminNotification.service.ts
│       │   ├── game.service.ts
│       │   ├── mistakes.service.ts
│       │   ├── parent-profile.service.ts
│       │   └── auth.service.ts
│       ├── models/                  # 20 Mongoose schemas
│       │   ├── User.ts              # parent / child / admin
│       │   ├── CategoryProgress.ts, QuizQuestion.ts, PlacementQuestion.ts
│       │   ├── PlacementResult.ts, Achievement.ts, Mistake.ts, ActivityLog.ts
│       │   ├── DailyQuestQuestion.ts, DailyQuestCompletion.ts
│       │   ├── GameProgress.ts, UnlockedGame.ts, ChildSession.ts
│       │   ├── Notification.ts, AdminNotification.ts
│       │   ├── PasswordResetRequest.ts, Story.ts, Music.ts, ParentRating.ts
│       │   └── category.model.ts
│       ├── validators/              # Zod request schemas
│       ├── utils/                   # jwt.ts, email.ts, AppError.ts
│       └── tests/
│           ├── helpers/             # testDb, testUser, mockEmail, testPlacement, testQuiz
│           ├── unit/                # 6 suites, 136 tests
│           └── integration/         # 6 suites, 143 tests
│
└── docs/                            # Project documentation
    ├── api.md                       # Full API reference
    ├── backend-architecture.md      # Backend design and layer breakdown
    ├── frontend-architecture.md     # Frontend design and feature slices
    ├── feature-overview.md          # End-to-end feature descriptions
    └── testing.md                   # Testing strategy and coverage
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB Atlas cluster (free tier is sufficient)
- Gmail account with an App Password (for SMTP)
- Google OAuth Client ID (for Google sign-in)

---

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `.env`:

```env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/kidaptive
JWT_SECRET=your_secret_here
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
```

```bash
npm run dev          # Start with hot-reload
npm run seed:admin   # Create the initial admin account
```

---

### Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

```bash
npm run dev          # Start Vite dev server on port 5173
```

---

## User Roles

| Role | Login method | Access |
|------|-------------|--------|
| **Parent** | Email + password or Google OAuth | Manage child profiles, view progress |
| **Child** | Emoji sequence or 4-digit PIN | Learning dashboard, quizzes, games |
| **Admin** | Email + password (seeded account) | Content management, analytics, user management |

---

## Learning Flow

```
Parent signs up → verifies email → creates child profile
  → Child selects account → enters PIN/emoji
  → Guided intro onboarding (4 screens)
  → Placement test (multi-batch, all categories)
  → Starting level assigned per category
  → Daily quizzes + daily quest → XP & gems earned
  → Level up: Starter → Explorer → Champion
  → Unlock and play mini-games with gems
  → Read stories and listen to music
  → Parent receives notifications + monitors progress
```

---

## Gamification

| Element | Description |
|---------|------------|
| **XP** | Earned on correct answers; drives level progression |
| **Gems** | +10 per Starter/Explorer quiz pass, +20 per Champion pass, +20 every 5th quiz; up to +150 from daily quest; spent to unlock mini-games |
| **Streaks** | Daily learning streaks; bonus XP at 3-day and 5-day milestones |
| **Levels** | Starter → Explorer → Champion per category |
| **Champion badges** | Bronze (5 wins) → Silver (15) → Gold (30) → Master (50) |
| **Achievements** | 20+ badges for milestones: first quiz, streaks, perfect scores, gem totals |
| **Leaderboard** | Children ranked by total XP, scoped by age group or global; unlocks after 5 quizzes |

---

## Running Tests

### Backend — 279 tests

```bash
cd backend
npm test                     # All tests (unit + integration)
npm run test:unit            # Unit tests only  (136 tests, 6 suites)
npm run test:integration     # Integration tests only (143 tests, 6 suites)
```

Tests use an in-process MongoDB (mongodb-memory-server). No external database or SMTP needed.

### Frontend — 162 tests

```bash
cd frontend
npx vitest run               # Single run (CI-friendly)
npm run test                 # Watch mode
npm run test:coverage        # Coverage report (C8)
npm run test:e2e             # Playwright E2E (requires dev server running)
npm run test:e2e:ui          # Playwright interactive UI
```

| Layer | Suites | Tests |
|-------|--------|-------|
| Backend unit | 6 | 136 |
| Backend integration | 6 | 143 |
| Frontend component | 14 | 162 |
| **Total** | **26** | **441** |

---

## Documentation

Full documentation is in the [`docs/`](docs/) directory:

| Document | Description |
|----------|------------|
| [API Reference](docs/api.md) | All endpoints with request/response shapes |
| [Backend Architecture](docs/backend-architecture.md) | Layer design, models, services, middleware |
| [Frontend Architecture](docs/frontend-architecture.md) | Feature slices, routing, state management |
| [Feature Overview](docs/feature-overview.md) | Every feature explained end-to-end |
| [Testing](docs/testing.md) | Testing strategy, frameworks, and coverage |

---

## Deployment

| Service | Platform |
|---------|---------|
| Frontend | Vercel |
| Backend API | Render |
| Database | MongoDB Atlas |
