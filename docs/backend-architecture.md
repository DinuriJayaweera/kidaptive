# Backend Architecture

## Overview

The backend is a **Node.js / Express 5** REST API written in TypeScript. It follows a classic layered architecture: Routes → Controllers → Services → Models. All business logic lives in services; controllers are thin request/response adapters.

```
backend/
├── src/
│   ├── server.ts              # HTTP server bootstrap
│   ├── app.ts                 # Express app, middleware, route mounting
│   ├── config/
│   │   └── db.ts              # MongoDB connection
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── upload.middleware.ts
│   │   └── error.middleware.ts
│   ├── routes/                # Route definitions (one file per domain)
│   ├── controllers/           # Request handlers
│   ├── services/              # Business logic
│   ├── models/                # Mongoose schemas
│   ├── validators/            # Zod input schemas
│   ├── utils/                 # jwt, email, AppError helpers
│   └── tests/                 # Jest test suites
├── jest.config.cjs
├── tsconfig.json
└── nodemon.json
```

---

## Technology Stack

| Concern | Choice |
|---------|--------|
| Runtime | Node.js (ESM) |
| Language | TypeScript 5 |
| Framework | Express 5.2.1 |
| Database | MongoDB Atlas via Mongoose 9 |
| Auth | JWT (jsonwebtoken) + httpOnly refresh cookie |
| Email | Nodemailer + Gmail SMTP |
| Validation | Zod |
| File uploads | Multer (story PDFs, music audio/video, cover images) |
| Testing | Jest + ts-jest + mongodb-memory-server |
| Deployment | Render |

---

## Layer Breakdown

### 1. Entry Point

**`src/server.ts`** — creates the HTTP server from the Express app and listens on `PORT` (default `5000`).

**`src/app.ts`** — configures:
- CORS (origin from `CLIENT_ORIGIN` env var)
- `express.json()` body parsing
- Cookie parser
- All route modules mounted under `/api`
- Global error handler last

---

### 2. Database

**`src/config/db.ts`** connects to MongoDB Atlas using `MONGO_URI`. Mongoose models are loaded automatically when imported by services.

---

### 3. Data Models

All schemas live in `src/models/`. Every document has auto-managed `createdAt`/`updatedAt` via `{ timestamps: true }`.

#### Core User & Auth

| Model | Collection | Purpose |
|-------|-----------|---------|
| `User` | `users` | Parent, child, and admin accounts. Stores hashed password/PIN/emoji, OTP fields, role, child-specific fields (parentId, ageGroup, loginMethod, xp, gems, streak, currentLevel) |
| `PasswordResetRequest` | `passwordresetrequests` | Child forgot-password flow — tracks request status (`pending`, `otp_sent`, `completed`, `expired`), OTP hash, and expiry |

#### Learning Content

| Model | Collection | Purpose |
|-------|-----------|---------|
| `Category` | `categories` | Learning categories with `active \| pending` status |
| `QuizQuestion` | `quizquestions` | Quiz questions linked to category, age group, and difficulty |
| `PlacementQuestion` | `placementquestions` | Placement test questions |
| `DailyQuestQuestion` | `dailyquestquestions` | Daily quest question bank (types: `mcq`, `fill`, `input`, `boolean`); filtered by `ageGroup` |
| `Story` | `stories` | PDF stories with cover image; `published \| draft` status |
| `Music` | `music` | Audio/video tracks with cover image; `published \| draft` status |

#### Progress & Records

| Model | Collection | Purpose |
|-------|-----------|---------|
| `PlacementResult` | `placementresults` | Assigned starting level per category for a child |
| `CategoryProgress` | `categoryprogresses` | Per-child, per-category XP and current level (`starter \| explorer \| champion`) |
| `DailyQuestCompletion` | `dailyquestcompletions` | Daily quest attempt record per child per date; unique index `(childId, date)` |
| `GameProgress` | `gameprogresses` | Per-child, per-game level completions and gems earned |
| `UnlockedGame` | `unlockedgames` | Records which games a child has unlocked |
| `Achievement` | `achievements` | Unlocked achievements per child |
| `Mistake` | `mistakes` | Incorrect quiz answers — upserted on wrong answer; avoids duplicates |
| `ActivityLog` | `activitylogs` | Timestamped audit trail of child actions |
| `ChildSession` | `childsessions` | Screen-time tracking: session start and last heartbeat per child per date |

#### Notifications & Feedback

| Model | Collection | Purpose |
|-------|-----------|---------|
| `Notification` | `notifications` | Parent-facing notifications triggered by child events (level-up, champion, achievement, daily quest, streak, inactive). Linked to `parentId + childId` |
| `AdminNotification` | `adminnotifications` | System alerts for admins (new registrations, question bank low, high activity, errors) |
| `ParentRating` | `parentratings` | Star rating (1–5) + optional feedback submitted by parents |

#### Notification Types

**Parent notifications** (`NotificationType`):
`level_up` | `champion` | `achievement` | `daily_quest` | `streak_milestone` | `gems_milestone` | `inactive` | `password_reset_request`

**Admin notifications** (`AdminNotificationType`):
`new_parent` | `new_child` | `placement_completed` | `champion_reached` | `question_bank_low` | `daily_quest_low` | `high_activity` | `system_error`

---

### 4. Routes

Routes are mounted in `app.ts` under `/api`. One file per domain:

| Route file | Prefix | Role required | Summary |
|-----------|--------|--------------|---------|
| `auth.routes.ts` | `/api/auth` | Public / any | Signup, verify, login, Google OAuth, refresh, logout |
| `parent.routes.ts` | `/api/parent`, `/api/parents` | parent | Profile, children CRUD, child progress |
| `child.routes.ts` | `/api/child` | child | Profile, leaderboard, achievements, mistakes |
| `quiz.routes.ts` | `/api/quiz` | child | Start quiz, submit quiz, progress, dashboard |
| `placement.routes.ts` | `/api/placement` | child | Placement status and results |
| `placement-test.routes.ts` | `/api/placement-test` | child | Generate + submit placement questions |
| `category.routes.ts` | `/api/categories` | child, parent | List active categories |
| `childDailyQuest.routes.ts` | `/api/child/daily-quest` | child | Today status, start, submit daily quest |
| `game.routes.ts` | `/api/games` | child | List games, unlock, level data, submit score |
| `childStory.routes.ts` | `/api/child/stories` | child | List and read published stories |
| `childMusic.routes.ts` | `/api/child/music` | child | List and play published music |
| `childSession.routes.ts` | `/api/child/session` | child | Screen-time heartbeat |
| `childPasswordReset.routes.ts` | `/api/child-password-reset` | Public + parent | Forgot-password request flow + OTP reset |
| `parentNotification.routes.ts` | `/api/parent/notifications` | parent | List, mark read, delete notifications |
| `parentRating.routes.ts` | `/api/parent/rating` | parent | Submit app rating, prompt status |
| `adminDashboard.routes.ts` | `/api/admin/dashboard` | admin | Platform stats |
| `adminUsers.routes.ts` | `/api/admin/users` | admin | User list, lock/unlock, delete |
| `adminPerformance.routes.ts` | `/api/admin/performance` | admin | Analytics data |
| `adminAgeGroups.routes.ts` | `/api/admin/age-groups` | admin | Age-group breakdown |
| `adminProfile.routes.ts` | `/api/admin/profile` | admin | Admin profile |
| `dailyQuest.routes.ts` | `/api/admin/daily-quests` | admin | Daily quest question CRUD |
| `adminNotification.routes.ts` | `/api/admin/notifications` | admin | Admin notification list + mark read |
| `adminStory.routes.ts` | `/api/admin/stories` | admin | Story CRUD + file upload |
| `adminMusic.routes.ts` | `/api/admin/music` | admin | Music CRUD + file upload |
| `adminRatings.routes.ts` | `/api/admin/ratings` | admin | View all parent ratings |
| `publicRatings.routes.ts` | `/api/ratings` | Public | Public rating summary (landing page) |
| `contact.routes.ts` | `/api/contact` | Public | Contact form submission |
| `health.routes.ts` | `/api/health` | Public | Liveness probe |

---

### 5. Middleware

#### `auth.middleware.ts`

- **`authenticate`** — Verifies the `Authorization: Bearer <token>` header using `JWT_SECRET`. Attaches decoded `{ userId, role }` to `req.user`. Returns 401 on missing/invalid token.
- **`requireRole(...roles)`** (aliased as `authorize`) — Checks `req.user.role` against the allowed roles list. Returns 403 on mismatch.

#### `upload.middleware.ts`

Multer instances configured for:
- `storyUpload` — accepts `pdf` + `cover` fields; stores to `uploads/stories/`
- `musicUpload` — accepts `audio`, `video`, `cover` fields; stores to `uploads/music/`

#### `error.middleware.ts`

Central error handler. Handles:
- Custom `AppError` subclasses → their HTTP status
- Mongoose `ValidationError` → 400
- JWT errors → 401
- Unhandled errors → 500

Always returns `{ success: false, message, statusCode }`.

---

### 6. Services

#### `auth.service.ts`

- Signup: hash password (bcrypt), generate 6-digit OTP, send via email, store with 10-min expiry
- Login: compare bcrypt hash, issue JWT pair, store refresh token on User document
- Google OAuth: decode Google ID token, find-or-create user, issue JWT pair
- Password reset: OTP flow, verify, hash new password
- Child login: find child by parentId + username, compare PIN or emoji sequence

#### `quiz.service.ts` — Adaptive Quiz Engine

```
startQuiz(childId, categoryId)
  → fetch child's current level for category
  → map level → difficulty (starter→easy, explorer→medium, champion→hard)
  → query QuizQuestion: matching category + ageGroup + difficulty, exclude recent attempts
  → return 5 random questions

submitQuiz(childId, categoryId, answers)
  → time-weighted scoring: 0-10s=100pts, 11-15s=80pts, 16-20s=60pts, >20s=40pts
  → XP = sum of time scores
  → gems: +10 per Starter/Explorer pass, +20 per Champion pass, +20 bonus every 5th quiz
  → persist incorrect answers as Mistake documents (upsert)
  → update CategoryProgress XP; check level-up at 50/100 XP thresholds
  → champion win milestones: Bronze(5) → Silver(15) → Gold(30) → Master(50)
  → trigger achievement evaluation + notification
  → return { score, xpEarned, gemsEarned, levelUp, mistakes, achievements }
```

#### `placement-test.service.ts`

```
generateTestQuestions(childId)
  → select next batch of unevaluated categories (up to 4)
  → fetch 5 questions per category (mixed difficulties)

submitPlacementTest(childId, answers)
  → score per category: ≥80% → Explorer, <80% → Starter
  → store PlacementResult; mark placement complete when all categories done
```

#### `childDailyQuest.service.ts`

```
getTodayStatus(childId)
  → find DailyQuestCompletion for today's date
  → return { status: "available" } or { status: "completed", score, xpEarned, gemsEarned }

startDailyQuest(childId)
  → check no completion exists for today (409 if duplicate)
  → fetch 10 DailyQuestQuestions for child's ageGroup, excluding previously seen IDs
  → store pending DailyQuestCompletion (questionIds)
  → return questions WITHOUT correctAnswer field

submitDailyQuest(childId, answers)
  → score each answer against stored correctAnswers
  → score = round((correctCount / 10) × 100)
  → XP = floor(score / 100 × 20) max 20
  → Gems = floor(score / 100 × 100) + 50 bonus if 100%
  → update child xp and gems; update DailyQuestCompletion; log ActivityLog
  → createNotification("daily_quest") to parent
```

#### `achievements.service.ts`

Evaluates ~20 achievement definitions after every quiz. Bulk-inserts newly earned ones. Returns the list of newly unlocked achievements for toast display.

#### `notification.service.ts`

```
createNotification(childId, type, title, message, icon)
  → look up child's parentId
  → create Notification document (non-fatal — errors are swallowed)
```

Called by quiz, placement, and daily quest services on key events.

#### `game.service.ts`

Game catalog (3 hardcoded games, 5 levels each):

| Game | Unlock cost |
|------|------------|
| Word Finder | 100 gems |
| Spelling Challenge | 150 gems |
| Word Builder | 200 gems |

Handles: unlock via gem deduction, level completion + gem rewards, progress retrieval.

#### `mistakes.service.ts`

`recordMistake(childId, questionId, categoryId, source?)` — upsert (avoids duplicates).
`getMistakesForPractice(childId)` — returns unresolved mistakes with populated question details.

#### `parent-profile.service.ts`

Manages parent account details: `getParentProfile`, `updateParentProfile` (name, phone, avatar, notification settings, monitoring settings, timezone, date format).

#### `adminNotification.service.ts`

Creates admin-scoped notifications (no parentId). Triggered by system events.

---

### 7. Validators

`src/validators/` uses **Zod** to define request schemas. Controllers call `schema.parse(req.body)` — Zod throws on invalid input, caught by the global error handler and returned as 400.

---

### 8. Utilities

#### `src/utils/jwt.ts`

```typescript
signAccessToken(payload)   // exp: 15m
signRefreshToken(payload)  // exp: 7d
verifyToken(token)         // throws on invalid/expired
```

#### `src/utils/email.ts`

Nodemailer transporter configured via SMTP env vars. Exports:
- `sendOtpEmail(to, otp)` — HTML email with OTP code
- `generateOtp()` — 6-digit numeric string

#### `src/utils/AppError.ts`

```typescript
class AppError extends Error { statusCode: number }
class BadRequestError   extends AppError { statusCode = 400 }
class UnauthorizedError extends AppError { statusCode = 401 }
class ForbiddenError    extends AppError { statusCode = 403 }
class NotFoundError     extends AppError { statusCode = 404 }
class ConflictError     extends AppError { statusCode = 409 }
```

---

## Request Flow

```
Client
  │
  ▼
Express Router (route match + param extraction)
  │
  ▼
authenticate middleware (JWT verify → req.user)
  │
  ▼
requireRole middleware (role check)
  │
  ▼
Validator (Zod schema.parse)
  │
  ▼
Controller (extract req.body/params, call service, send response)
  │
  ▼
Service (business logic, Mongoose calls)
  │
  ▼
Mongoose Model (MongoDB Atlas)
  │
  ▼ (error thrown anywhere)
error.middleware (map to HTTP status + JSON envelope)
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Signing secret for access + refresh tokens |
| `PORT` | No | HTTP port (default 5000) |
| `CLIENT_ORIGIN` | Yes | Allowed CORS origin (frontend URL) |
| `SMTP_HOST` | Yes | SMTP server hostname |
| `SMTP_PORT` | Yes | SMTP port |
| `SMTP_USER` | Yes | SMTP username |
| `SMTP_PASS` | Yes | SMTP password / app password |

---

## Development Scripts

```bash
npm run dev          # nodemon: watch src/, restart on change
npm run build        # tsc: compile to dist/
npm run start        # run compiled dist/server.js
npm run seed:admin   # create initial admin user
npm run lint         # eslint src/**/*.ts
npm run format       # prettier --write
npm run test         # jest --runInBand (all tests)
npm run test:unit    # unit tests only
npm run test:integration  # integration tests only
```
