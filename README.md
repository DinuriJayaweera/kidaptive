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

- **Adaptive placement test** — assigns a starting level (Starter / Explorer / Champion) per category before the child begins learning
- **Per-category adaptive quizzes** — 5-question quizzes with difficulty matched to the child's current level; time-weighted scoring rewards faster answers
- **Mistake tracking & remedial practice** — incorrect answers are stored and surfaced in a dedicated Mistakes Practice section
- **Three-tier level progression** — Starter → Explorer → Champion per category, driven by XP thresholds; Champion wins unlock milestone badges
- **Gamification** — XP, gems, daily streaks, 20+ achievements, avatar customisation, and a real-time leaderboard
- **Mini-games** — Word Finder, Spelling Challenge, and Word Builder; each unlocked with gems, 5 levels each
- **Parent dashboard** — per-child analytics covering XP, gems, streak, category levels, quiz history, and recent activity
- **Admin panel** — full CRUD for questions, categories, and users; platform-wide performance analytics and age-group breakdowns
- **Dual auth modes** — parents log in with email/password or Google OAuth; children log in with an emoji sequence or 4-digit PIN set by their parent
- **Secure JWT auth** — short-lived access tokens (15 min) + httpOnly refresh token cookies (7 days) with automatic silent refresh

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
│       │   ├── auth/                # Login, signup, OTP verify, Google OAuth, child PIN
│       │   │   ├── api/             # authApi.ts
│       │   │   ├── context/         # AuthContext.tsx (global auth state)
│       │   │   ├── hooks/           # useAuth
│       │   │   ├── components/      # EmojiKeypad, AuthHeader
│       │   │   └── pages/
│       │   ├── child/               # Child learning interface
│       │   │   ├── pages/           # Dashboard, PlacementQuiz, AdaptiveQuiz,
│       │   │   │                    # MistakesPractice, Games, WordFinder,
│       │   │   │                    # SpellingChallenge, WordBuilder
│       │   │   ├── components/      # CategoryCard, TopBarStats, ChildSidebar,
│       │   │   │                    # LeaderboardCard, DailyQuestCard
│       │   │   ├── services/        # quizApi.ts, placementTestApi.ts
│       │   │   ├── hooks/           # useAchievementToasts (toast queue)
│       │   │   └── constants/       # achievementCatalog.ts
│       │   ├── parent/              # Parent dashboard
│       │   │   ├── pages/           # Dashboard, CreateChild, ChildProgress,
│       │   │   │                    # Settings, Profile
│       │   │   ├── api/             # parentApi.ts
│       │   │   └── layouts/         # ParentLayout
│       │   ├── admin/               # Admin panel
│       │   │   ├── pages/           # Dashboard, Quizzes, Categories,
│       │   │   │                    # UserManagement, Performance, AgeGroups,
│       │   │   │                    # Settings, Profile
│       │   │   ├── api/             # adminQuizApi, adminUsersApi, etc.
│       │   │   └── layouts/         # AdminLayout
│       │   └── public/              # LandingPage, RoleSelectPage
│       ├── app/guards/              # RouteGuard (PublicOnly / ParentRoute /
│       │                            # ChildRoute / AdminRoute)
│       ├── shared/
│       │   ├── components/          # Navbar, Footer, ProtectedRoute
│       │   └── theme/               # MUI theme config
│       ├── services/                # apiClient.ts (Axios + refresh interceptor)
│       ├── routes/                  # AppRoutes.tsx
│       ├── store/                   # Global context providers
│       ├── hooks/                   # Shared custom hooks
│       ├── types/                   # Global TypeScript interfaces
│       ├── App.tsx
│       └── main.tsx
│
├── backend/                         # Express 5 REST API
│   └── src/
│       ├── config/                  # db.ts (MongoDB Atlas connection)
│       ├── middleware/              # auth.middleware.ts, error.middleware.ts
│       ├── routes/                  # auth, parent, child, quiz, placement,
│       │                            # categories, games, admin, health
│       ├── controllers/             # Thin request/response handlers
│       ├── services/                # Business logic
│       │   ├── quiz.service.ts      # Adaptive quiz + scoring engine
│       │   ├── placement-test.service.ts
│       │   ├── achievements.service.ts
│       │   ├── auth.service.ts
│       │   ├── game.service.ts
│       │   └── mistakes.service.ts
│       ├── models/                  # Mongoose schemas
│       │   ├── User.ts              # parent / child / admin
│       │   ├── CategoryProgress.ts
│       │   ├── QuizQuestion.ts
│       │   ├── PlacementQuestion.ts
│       │   ├── PlacementResult.ts
│       │   ├── Achievement.ts
│       │   ├── Mistake.ts
│       │   ├── ActivityLog.ts
│       │   └── GameProgress.ts
│       ├── validators/              # Zod request schemas
│       ├── utils/                   # jwt.ts, email.ts, AppError.ts
│       ├── tests/
│       │   ├── helpers/             # testDb, testUser, mockEmail
│       │   ├── unit/                # auth.service.test.ts
│       │   └── integration/         # auth, placement, quiz route tests
│       ├── app.ts
│       └── server.ts
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
  → Placement test (multi-batch, all categories)
  → Starting level assigned per category
  → Daily quizzes → XP & gems earned
  → Level up: Starter → Explorer → Champion
  → Unlock and play mini-games with gems
  → Parent monitors progress on dashboard
```

---

## Gamification

| Element | Description |
|---------|------------|
| **XP** | Earned on correct answers; drives level progression |
| **Gems** | 1 per correct answer; spent to unlock mini-games |
| **Streaks** | Daily login streaks; bonus XP at 3 and 5 days |
| **Levels** | Starter → Explorer → Champion per category |
| **Champion badges** | Bronze (5 wins) → Silver (15) → Gold (30) → Master (50) |
| **Achievements** | 20+ badges for milestones: first quiz, streaks, perfect scores, gem totals |
| **Leaderboard** | All children ranked by total XP |

---

## Running Tests

### Backend

```bash
cd backend
npm run test               # All tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
```

### Frontend

```bash
cd frontend
npm run test               # Vitest watch mode
npm run test:coverage      # Coverage report
npm run test:e2e           # Playwright E2E (requires dev server running)
npm run test:e2e:ui        # Playwright interactive UI
```

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
