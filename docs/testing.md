# Testing

Kidaptive has three layers of automated tests: **backend unit tests**, **backend integration tests**, and **frontend component tests**.

---

## Quick Numbers

| Layer | Framework | Suites | Tests |
|-------|-----------|--------|-------|
| Backend unit | Jest + ts-jest + mongodb-memory-server | 6 | 136 |
| Backend integration | Jest + supertest + mongodb-memory-server | 6 | 143 |
| Frontend component | Vitest + React Testing Library | 14 | 162 |
| **Total** | | **26** | **441** |

---

## Running Tests

### Backend

```bash
cd backend

npm test              # all 279 tests
npm run test:unit     # unit tests only
npm run test:integration  # integration tests only
```

### Frontend

```bash
cd frontend

npx vitest run        # all 162 component tests (single pass)
npm run test          # watch mode
npm run test:coverage # coverage report (C8)
```

---

## Backend Tests

**Location:** `backend/src/tests/`
**Framework:** Jest + ts-jest (ESM mode via `NODE_OPTIONS=--experimental-vm-modules`)
**Run mode:** `--runInBand` — serial execution to avoid port and MongoDB collisions

### Test Database

All backend tests use **[mongodb-memory-server](https://github.com/nodkz/mongodb-memory-server)** — an in-process MongoDB instance that starts before the first test and tears down after the last. No external database is required; each suite gets a clean state via `beforeEach` collection clears.

**`src/tests/helpers/testDb.ts`**

```typescript
export const connectTestDb = async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
};

export const clearTestDb = async () => {
  for (const model of Object.values(mongoose.models)) {
    await model.deleteMany({});
  }
};

export const disconnectTestDb = async () => {
  await mongoose.disconnect();
  await mongod.stop();
};
```

### Test Helpers

| Helper file | Purpose |
|-------------|---------|
| `helpers/testUser.ts` | `createVerifiedParent()`, `createChild(parentId)`, `createAdmin()`, `loginAs(email, password)` |
| `helpers/mockEmail.ts` | Replaces Nodemailer with a Jest mock — no SMTP needed |
| `helpers/testPlacement.ts` | Seeds placement questions for integration scenarios |
| `helpers/testQuiz.ts` | Seeds quiz questions for integration scenarios |

---

### Unit Tests — `src/tests/unit/`

Unit tests call service functions directly with a real in-memory MongoDB. No HTTP layer.

#### `auth.service.test.ts` — 29 tests

| Suite | Key scenarios |
|-------|--------------|
| `signupParent` | creates user, hashes password, sends OTP; duplicate email → ConflictError |
| `verifyEmailOtp` | correct OTP → `isVerified: true`; expired OTP → BadRequestError |
| `resendEmailOtp` | sends fresh OTP; missing email → error |
| `loginParent` | correct credentials → JWT pair; wrong password → UnauthorizedError; unverified → error |
| `forgotPassword` | generates reset OTP and sends email |
| `resetPassword` | verifies OTP, hashes new password, stores |
| `refreshTokens` | valid refresh token → new access token |
| `logoutUser` | clears stored refresh token |
| `loginAdmin` | admin login returns tokens; non-admin → error |
| `loginChild` | emoji sequence match → tokens; wrong sequence → error |

#### `placement.service.test.ts` — 25 tests

| Suite | Key scenarios |
|-------|--------------|
| `getCategoriesForAge` | returns only active categories for the child's age group |
| `getUnevaluatedCategories` | excludes already-placed categories |
| `generateTestQuestions` | batch of 4 categories × 5 questions; no duplicate exposure |
| `submitTestAnswers` | ≥80% → Explorer, <80% → Starter; level stored in PlacementResult |
| Level assignment thresholds | boundary conditions at exactly 80% and below |
| `getPlacementStatus` | returns `{ completed: true/false }` |
| `getFinalResults` | returns assigned levels per category |
| `resetPlacement` | clears all PlacementResults for the child |

#### `quiz.service.test.ts` — 46 tests

| Suite | Key scenarios |
|-------|--------------|
| `startQuiz` | maps level → difficulty; excludes recent questions; age-group filter |
| `submitQuiz` — scoring | time-weighted XP (0–10s=100, 11–15s=80, 16–20s=60, >20s=40) |
| `submitQuiz` — gems | +10 gems per Starter/Explorer pass; +20 per Champion pass; +20 bonus at 5th quiz |
| `submitQuiz` — level-up | Starter → Explorer at 50 XP; Explorer → Champion at 100 XP |
| Champion badge system | Bronze 5 wins, Silver 15, Gold 30, Master 50 — badge stored on User |
| `getCategoryProgress` | returns XP bar data and current level |

#### `mistakes.service.test.ts` — 6 tests

| Scenario | What is verified |
|----------|-----------------|
| Creates new mistake record | `childId`, `questionId`, `categoryId` stored |
| Deduplicates same child + question | upsert does not create duplicate |
| Separate mistakes per question | two different questions → two records |
| Separate mistakes per child | same question, different child → two records |
| Preserves original `childAnswer` on upsert | `$setOnInsert` semantics |
| Placement-source mistakes | `source: "placement"` stored correctly |

#### `quest.service.test.ts` — 16 tests

| Suite | Key scenarios |
|-------|--------------|
| `getTodayStatus` | returns `{ status: "available" }` fresh; `{ status: "completed" }` after completion |
| `startDailyQuest` | returns questions + correctAnswers; correctAnswers NOT leaked to client; duplicate start → error |
| `startDailyQuest` — no questions | throws when no questions available |
| `submitDailyQuest` — perfect 10/10 | score=100, XP=20, gems=150 (100 + 50 bonus) |
| `submitDailyQuest` — 8/10 | score=80, passes threshold |
| `submitDailyQuest` — DB update | child `xp` and `gems` incremented |
| `submitDailyQuest` — completion record | DailyQuestRecord created |
| `submitDailyQuest` — replay prevention | second submit → ConflictError |

#### `game.service.test.ts` — 14 tests

| Suite | Key scenarios |
|-------|--------------|
| `getGamesForChild` | all locked for fresh child; unlocked after record; progress data included |
| `unlockGame` | deducts gem cost; creates UnlockedGame record; insufficient gems → 400; already unlocked → 409; unknown game → 404 |
| `unlockGame` — all games | word-finder (100g), spelling-challenge (150g), word-builder (200g) |
| `getLevelData` | valid level returns data; out-of-range level → error; unknown gameId → error |
| `submitScore` | new level awards gems + updates balance; replay → 0 gems; highestLevel tracking; not-unlocked guard; invalid level |

---

### Integration Tests — `src/tests/integration/`

Integration tests boot the full Express app and send real HTTP requests via [supertest](https://github.com/ladjs/supertest). All hits a real in-memory MongoDB.

#### `auth.routes.test.ts` — 52 tests

Covers every auth endpoint plus parent/child management:

- **Signup** — 201 valid; 409 duplicate email; 400 weak password
- **Email verify** — 200 correct OTP; 400 wrong OTP; 400 expired OTP
- **Login** — 200 + cookie; 401 wrong password; 403 unverified
- **Refresh** — 200 valid cookie; 401 missing cookie
- **Logout** — 200, cookie cleared
- **Role guards** — 401 no token; 403 wrong role
- **Children CRUD** — add, list, update, delete child profiles

#### `placement.routes.test.ts` — 22 tests

- `GET /placement-questions` returns 20 questions (4 cats × 5)
- `POST /placement-test/submit` assigns correct levels; handles multi-batch
- `GET /placement/status` reflects completion state
- Full flow: submit all batches → placement complete → dashboard unlocked

#### `quiz.routes.test.ts` — 33 tests

- `POST /quiz/start` — 5 questions matched to child's level and age group
- `POST /quiz/submit` all correct — correct XP and gem calculation
- `POST /quiz/submit` with wrong answers — mistakes recorded; lower XP
- Level-up boundary — XP crossing 50/100 threshold changes `CategoryProgress`
- Achievement evaluation fires after submit
- `GET /quiz/progress` and `GET /quiz/dashboard` return correct data

#### `quest.routes.test.ts` — 10 tests

| Endpoint | Scenarios |
|----------|-----------|
| `GET /child/daily-quest/today` | 401 no auth; 403 wrong role; `{ status: "available" }`; `{ status: "completed" }` after completion |
| `POST /child/daily-quest/start` | 401 no auth; returns questions without leaking `correctAnswers`; 409 duplicate start |
| `POST /child/daily-quest/submit` | 401 no auth; perfect score → `{ score: 100, xpEarned: 20, gemsEarned: 150 }`; 409 replay |

#### `game.routes.test.ts` — 14 tests

| Endpoint | Scenarios |
|----------|-----------|
| `GET /games` | 401 no auth; 403 wrong role; fresh child sees all games locked |
| `POST /games/unlock` | 401; success + updated gem balance; 400 insufficient gems; 409 already unlocked; 404 unknown game |
| `GET /games/:gameId/levels` | 401; valid level data; 404 out-of-range level |
| `POST /games/:gameId/score` | 401; new level awards gems; 0 gems on replay; 403 game not unlocked |

#### `leaderboard.routes.test.ts` — 12 tests

| Scenario | What is verified |
|----------|-----------------|
| 401 no auth | Unauthenticated requests rejected |
| 403 wrong role | Parent cannot access child leaderboard |
| `unlocked: false` below 5 quizzes | Child with `globalQuizzesCompleted < 5` sees locked state |
| `unlocked: true` at threshold | Child with ≥5 quizzes sees the ranked list |
| Hidden below threshold | Children with <5 quizzes excluded from visible rankings |
| Sorted by XP descending | Correct rank order across multiple children |
| `currentChildRank` identified | Calling child's position flagged in response |
| Age-group scope | Excludes children outside the child's age bracket |
| Global scope | Includes all children regardless of age group |
| Scope field in response | `scope` property reflects the requested filter |

---

## Frontend Tests

**Location:** `frontend/src/tests/`
**Framework:** [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/react)
**Mocking strategy:** `vi.mock()` replaces API modules directly; no MSW needed

**Setup — `src/tests/setup.tsx`**
- Initialises `@testing-library/jest-dom` matchers

**Shared helper — `src/tests/helpers/renderWithProviders.tsx`**
- Wraps the component under test in `MemoryRouter` + `AuthProvider`

---

### Component Tests — `src/tests/components/`

#### Auth Pages

| File | Component | Tests | Key scenarios |
|------|-----------|-------|--------------|
| `AdminLoginPage.test.tsx` | `AdminLoginPage` | 6 | renders form, validation, login success → admin dashboard, error display |
| `ChildPinPage.test.tsx` | `ChildPinPage` | 11 | emoji keypad visible, username input shown/hidden by sessionStorage, button disabled until 4 emojis selected, pre-selected child from sessionStorage, forgot pattern link |
| `ForgotPasswordPage.test.tsx` | `ForgotPasswordPage` | 6 | email input, submit calls API, success/error states, back to login |
| `ParentLoginPage.test.tsx` | `ParentLoginPage` | 12 | required fields, successful login + redirect, wrong credentials error, Google OAuth button, loading state |
| `ParentSignupPage.test.tsx` | `ParentSignupPage` | 9 | all fields render, password strength rules, duplicate email error, success → verify page |
| `ResetPasswordPage.test.tsx` | `ResetPasswordPage` | 7 | OTP input, password + confirm fields, mismatch error, success navigates to login |
| `VerifyEmailPage.test.tsx` | `VerifyEmailPage` | 10 | OTP input, correct OTP → login, wrong OTP error, resend link, countdown |
| `RoleSelectPage.test.tsx` | `RoleSelectPage` | 5 | renders role cards, clicking child → child select, clicking parent → parent login |

#### Child Learning Interface

| File | Component | Tests | Key scenarios |
|------|-----------|-------|--------------|
| `TopBarStats.test.tsx` | `TopBarStats` | 6 | renders XP/streak/gems values, correct alt text on icons, zero values, large values |
| `CategoryCard.test.tsx` | `CategoryCard` | 10 | name/level/icon/XP bar rendered, level badge (Starter/Explorer/Champion), click → navigate to quiz route, xpToNextLevel label |
| `ChildDashboardPage.test.tsx` | `ChildDashboardPage` | 26 | loading spinner, placement redirect (not completed / API error / completed), greeting with child name, XP/streak/gems stats, category grid (3 cards + level labels + icons), empty state, category click navigation ×3, sidebar/leaderboard/daily-quest widgets, API call verification |
| `PlacementQuizPage.test.tsx` | `PlacementQuizPage` | 23 | loading, MCQ + input question types, answer selection, submit → feedback, next question, batch progress, completion screen, category results display |
| `PlacementResultsPage.test.tsx` | `PlacementResultsPage` | 11 | assigned levels per category, XP bars, Explorer/Starter display, go to dashboard button |
| `DailyQuestPage.test.tsx` | `DailyQuestPage` | 20 | loading spinner, 409 already-completed message, generic error + back button + navigate to dashboard, MCQ question/options render, question counter (1/1), fill-blank input type, skip/check buttons, check disabled before answer selection, check enabled after selection, correct → Amazing feedback, wrong → Correct Solution feedback, skip submits empty answer, result screen (score/XP/gems), pass title (Amazing Quest), fail title (Good Effort) |

---

## ESM Mocking Patterns

### Backend (Jest ESM)

```typescript
// Must come BEFORE static imports; use async function not jest.fn().mockResolvedValue(undefined)
jest.unstable_mockModule("../../services/notification.service.js", () => ({
    createNotification: async () => {},
}));

// Static imports — Jest resolves them AFTER unstable_mockModule
import { startDailyQuest } from "../../services/childDailyQuest.service.js";
```

### Frontend (Vitest)

```typescript
// Hoist mocks that need to be referenced in beforeEach
const { mockStart, mockSubmit } = vi.hoisted(() => ({
    mockStart: vi.fn(),
    mockSubmit: vi.fn(),
}));

vi.mock("../../features/child/services/childDailyQuestApi", () => ({
    startDailyQuest: mockStart,
    submitDailyQuest: mockSubmit,
}));
```

### React 18 StrictMode

Effects run twice in test mode. Use `toHaveBeenCalled()` not `toHaveBeenCalledTimes(1)` for API call assertions.

---

## CI Notes

- Backend tests run with `--runInBand` to avoid concurrent MongoDB Memory Server conflicts
- Frontend tests use Vitest's native ESM support — no Babel transform needed
- Email is mocked in all environments — no SMTP credentials required
- `NODE_OPTIONS=--experimental-vm-modules` is set in the backend `test` npm script
