# Backend Architecture

## Overview

The backend is a **Node.js / Express 5** REST API written in TypeScript. It follows a classic layered architecture: Routes → Controllers → Services → Models. All business logic lives in services; controllers are thin request/response adapters.

```
backend/
├── src/
│   ├── server.ts          # HTTP server bootstrap
│   ├── app.ts             # Express app, middleware, route mounting
│   ├── config/
│   │   └── db.ts          # MongoDB connection
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   └── error.middleware.ts
│   ├── routes/            # Route definitions
│   ├── controllers/       # Request handlers
│   ├── services/          # Business logic
│   ├── models/            # Mongoose schemas
│   ├── validators/        # Zod input schemas
│   ├── utils/             # jwt, email, AppError helpers
│   └── tests/             # Jest test suites
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

**`src/config/db.ts`** connects to MongoDB Atlas using `MONGO_URI`. Connection options include:
- `serverSelectionTimeoutMS: 5000`
- `socketTimeoutMS: 45000`

Mongoose models are loaded automatically when imported by services.

---

### 3. Data Models

All schemas live in `src/models/`. Every document has auto-managed `createdAt`/`updatedAt` via `{ timestamps: true }`.

| Model | Collection | Purpose |
|-------|-----------|---------|
| `User` | `users` | Parent, child, and admin accounts. Stores hashed password, OTP fields, role, child-specific fields (parentId, ageGroup, loginMethod, xp, gems, streak, currentLevel) |
| `Category` | `categories` | Learning categories with `active \| pending` status |
| `QuizQuestion` | `quizquestions` | Questions linked to a category, age group, and difficulty |
| `PlacementQuestion` | `placementquestions` | Placement test questions |
| `PlacementResult` | `placementresults` | Assigned starting level per category for a child |
| `CategoryProgress` | `categoryprogresses` | Per-child, per-category XP and current level (`starter \| explorer \| champion`) |
| `GameProgress` | `gameprogresses` | Per-child, per-game level completions and gems earned |
| `Achievement` | `achievements` | Unlocked achievements stored per child (locked ones computed live) |
| `Mistake` | `mistakes` | Incorrect quiz answers, upserted on wrong answer |
| `ActivityLog` | `activitylogs` | Timestamped audit trail of child actions |
| `UnlockedGame` | `unlockedgames` | Records which games a child has unlocked with gems |

#### User Schema (simplified)

```typescript
{
  name: String,
  email: String,           // parent/admin only
  password: String,        // hashed (bcrypt)
  role: 'parent' | 'child' | 'admin',
  isVerified: Boolean,     // email OTP verified (parent)
  otp: String,
  otpExpiry: Date,
  refreshToken: String,

  // child-specific
  parentId: ObjectId,
  ageGroup: '5-6' | '7-8' | '9-10',
  loginMethod: 'pin' | 'emoji',
  pin: String,
  emojiSequence: [String],
  avatarEmoji: String,
  xp: Number,
  gems: Number,
  streak: Number,
  lastActiveDate: Date,
  currentLevel: 'starter' | 'explorer' | 'champion'
}
```

---

### 4. Middleware

#### `auth.middleware.ts`

Exports two middleware functions:

- **`authenticate`** — Verifies the `Authorization: Bearer <token>` header using `JWT_SECRET`. Attaches decoded `{ userId, role }` to `req.user`. Returns 401 on missing/invalid token.
- **`authorize(...roles)`** — Returns middleware that checks `req.user.role` against the allowed roles list. Returns 403 on mismatch.

Routes compose these:

```typescript
router.get('/child/profile', authenticate, authorize('child'), childController.getProfile);
```

#### `error.middleware.ts`

Central error handler (4-argument Express middleware). Handles:
- Custom `AppError` subclasses → maps to their HTTP status
- Mongoose `ValidationError` → 400
- JWT errors → 401
- Unhandled errors → 500

Always returns the standard `{ success: false, message, statusCode }` envelope.

---

### 5. Services

Services encapsulate all domain logic and interact directly with Mongoose models.

#### `quiz.service.ts` — Adaptive Quiz Engine

```
startQuiz(childId, categoryId)
  → fetch child's current level for category
  → map level to difficulty (starter→easy, explorer→medium, champion→hard)
  → query QuizQuestion: matching category + ageGroup + difficulty, exclude recent attempts
  → return 5 random questions

submitQuiz(childId, categoryId, answers)
  → score each answer (correct/incorrect)
  → apply time-weighted scoring: 0-10s=100pts, 11-15s=80pts, 16-20s=60pts, >20s=40pts
  → calculate XP = sum of time scores
  → award gems (1 per correct answer)
  → persist incorrect answers as Mistake documents (upsert)
  → update CategoryProgress XP
  → check for level-up (Starter→Explorer at 50XP, Explorer→Champion at 100XP)
  → trigger achievement evaluation
  → return { score, xpEarned, gemsEarned, levelUp, mistakes, achievements }
```

#### `placement-test.service.ts` — Initial Placement

```
generateTestQuestions(childId)
  → determine which categories still need placement
  → select next batch of 4 categories
  → fetch 5 questions per category (mixed difficulties)
  → return questions grouped by category

submitPlacementTest(childId, answers)
  → score per category
  → assign level: ≥80% → explorer, ≥50% → starter, <50% → starter (with remedial flag)
  → store PlacementResult
  → if all categories evaluated → mark placement complete on child User
```

#### `achievements.service.ts` — Achievement Engine

Maintains a catalog of ~20 achievement definitions:

| Achievement | Trigger |
|------------|---------|
| First Quiz | Complete first quiz |
| Quiz Streak 7 | 7-day learning streak |
| Quiz Master | Complete 50 quizzes |
| Perfect Score | 5/5 on a quiz |
| Gem Collector | Earn 100 gems |
| Category Champion | Reach Champion in any category |
| Champion Bronze/Silver/Gold/Master | 5/15/30/50 champion wins |

`evaluateAchievements(childId)` loads all existing unlocked achievements, recalculates eligibility for every catalog entry, and bulk-inserts newly earned ones. Returns the list of newly unlocked achievements.

#### `auth.service.ts`

- Signup: hash password (bcrypt), generate 6-digit OTP, send via email, store with 10-min expiry
- Login: compare bcrypt hash, issue JWT pair, store refresh token on User document
- Google OAuth: decode Google ID token, find-or-create user, issue JWT pair
- Password reset: new OTP flow, verify, hash new password
- Child login: find child by parentId + name, compare PIN or emoji sequence

#### `game.service.ts`

Game catalog (hardcoded, 3 games):
- **Word Finder** — grid-based word search, 5 levels
- **Spelling Challenge** — memory spelling test, 5 levels
- **Word Builder** — anagram/construction, 5 levels

Handles: unlock via gem deduction, level completion + gem rewards, progress retrieval.

#### `mistakes.service.ts`

`recordMistake(childId, questionId, categoryId)` — upsert into Mistakes collection (avoids duplicates).
`getMistakesForPractice(childId)` — returns unresolved mistakes with populated question details.

---

### 6. Validators

`src/validators/auth.validators.ts` uses **Zod** to define schemas:

```typescript
export const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special character')
});
```

Controllers call `schema.parse(req.body)` — Zod throws on invalid input which is caught by the global error handler and returned as 400.

---

### 7. Utilities

#### `src/utils/jwt.ts`

```typescript
signAccessToken(payload)   // exp: 15m, secret: JWT_SECRET
signRefreshToken(payload)  // exp: 7d
verifyToken(token)         // throws on invalid/expired
```

#### `src/utils/email.ts`

Nodemailer transporter configured with SMTP credentials from env. Exports:
- `sendOtpEmail(to, otp)` — sends HTML email with the OTP code
- `generateOtp()` — returns a 6-digit numeric string

#### `src/utils/AppError.ts`

Custom error hierarchy extending native `Error`:

```typescript
class AppError extends Error { statusCode: number }
class BadRequestError extends AppError   { statusCode = 400 }
class UnauthorizedError extends AppError { statusCode = 401 }
class ForbiddenError extends AppError    { statusCode = 403 }
class NotFoundError extends AppError     { statusCode = 404 }
class ConflictError extends AppError     { statusCode = 409 }
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
authorize middleware (role check)
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
