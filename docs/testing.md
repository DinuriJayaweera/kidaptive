# Testing

Kidaptive has three layers of automated tests: **backend unit tests**, **backend integration tests**, and **frontend component + E2E tests**.

---

## Backend Tests

**Location:** `backend/src/tests/`  
**Framework:** [Jest](https://jestjs.io/) with [ts-jest](https://kulshekhar.github.io/ts-jest/)  
**Run mode:** `--runInBand` (serial) to avoid port/DB collisions  

### Test Database

All backend tests use **[mongodb-memory-server](https://github.com/nodkz/mongodb-memory-server)** — an in-process MongoDB instance that starts before any test suite and tears down after. This means:

- No external database required
- Tests are fully isolated from production data
- Each suite starts with a clean state via `beforeEach` collection clears

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

**`src/tests/helpers/testUser.ts`** — functions to create ready-to-use test fixtures:

| Helper | Creates |
|--------|---------|
| `createVerifiedParent()` | A parent with `isVerified: true` |
| `createChild(parentId)` | A child profile linked to a parent |
| `createAdmin()` | An admin account |
| `loginAs(email, password)` | Returns a valid `{ accessToken, refreshToken }` |

**`src/tests/helpers/mockEmail.ts`** — replaces Nodemailer transport with a jest mock so OTP emails are never actually sent during tests.

**`src/tests/helpers/testPlacement.ts`** / **`testQuiz.ts`** — seed placement questions and quiz questions for integration test scenarios.

---

### Unit Tests — `src/tests/unit/`

#### `auth.service.test.ts`

Tests the auth service functions directly (no HTTP layer).

| Test | What it verifies |
|------|----------------|
| `signupParent` with valid data | Creates user, hashes password, sends OTP |
| `signupParent` with duplicate email | Throws `ConflictError` |
| `verifyEmail` with correct OTP | Sets `isVerified: true`, clears OTP |
| `verifyEmail` with expired OTP | Throws `BadRequestError` |
| `loginParent` correct credentials | Returns access + refresh tokens |
| `loginParent` wrong password | Throws `UnauthorizedError` |
| `resetPassword` full flow | OTP verified, new password hashed and stored |

---

### Integration Tests — `src/tests/integration/`

Integration tests spin up the full Express app and make real HTTP calls via [supertest](https://github.com/ladjs/supertest).

#### `auth.routes.test.ts`

**Signup**
- Valid parent signup returns 201 and sends OTP
- Duplicate email returns 409
- Weak password returns 400 with validation message

**Email verification**
- Correct OTP → 200, account verified
- Wrong OTP → 400
- Expired OTP → 400

**Login**
- Verified account + correct password → 200, returns access token and sets refresh cookie
- Unverified account → 403
- Wrong password → 401

**Token refresh**
- Valid refresh cookie → 200, new access token
- No cookie → 401

**Logout**
- Clears the refresh cookie

**Protected route access**
- Correct role + valid token → passes through
- Wrong role → 403
- No token → 401

---

#### `placement.routes.test.ts`

- Child with no placement → `GET /placement-questions` returns 20 questions (4 categories × 5)
- Submit answers → correct level assignment per category
- Already-completed placement → `GET /placement/status` returns `{ completed: true }`

---

#### `quiz.routes.test.ts`

- `POST /quiz/start` → returns 5 questions matching child's level and age group
- `POST /quiz/submit` all correct → correct XP/gem calculation
- `POST /quiz/submit` with wrong answers → mistakes recorded, lower XP
- Level-up boundary: XP crossing 50 threshold changes level in `CategoryProgress`
- Achievement evaluation fires after submit

---

### Running Backend Tests

```bash
# All tests
npm run test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration
```

**`jest.config.cjs`** key settings:

```javascript
{
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 30000,
  runner: 'jest-runner',
  globals: { 'ts-jest': { useESM: true } }
}
```

ESM modules require `NODE_OPTIONS=--experimental-vm-modules` (set in the `test` npm script).

---

## Frontend Tests

### Component Tests

**Location:** `frontend/src/tests/`  
**Framework:** [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/react)  
**HTTP mocking:** [MSW (Mock Service Worker)](https://mswjs.io/) — intercepts `fetch`/`axios` calls at the service-worker level  

**Setup — `src/tests/setup.tsx`**
- Initialises `@testing-library/jest-dom` matchers
- Starts the MSW server before all tests and resets handlers between tests

#### Test Files

| File | Component under test | Key scenarios |
|------|---------------------|---------------|
| `CategoryCard.test.tsx` | `CategoryCard` | Renders name, level badge, XP bar; click navigates to quiz route |
| `ChildDashboardPage.test.tsx` | `ChildDashboardPage` | Shows categories from API, redirects to placement if not complete |
| `ParentLoginPage.test.tsx` | `ParentLoginPage` | Form validation, successful login stores token and redirects, wrong credentials shows error |
| `PlacementQuizPage.test.tsx` | `PlacementQuizPage` | Renders questions, submits answers, advances to next batch, shows completion message |

**Pattern for each test:**

```tsx
import { render, screen, userEvent } from '@testing-library/react';
import { server } from '../mocks/server';
import { rest } from 'msw';

test('login with correct credentials redirects to dashboard', async () => {
  server.use(
    rest.post('/api/auth/login', (req, res, ctx) =>
      res(ctx.json({ accessToken: 'tok', user: { role: 'parent' } }))
    )
  );

  render(<ParentLoginPage />, { wrapper: Providers });
  await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
  await userEvent.type(screen.getByLabelText(/password/i), 'Password1!');
  await userEvent.click(screen.getByRole('button', { name: /log in/i }));

  expect(await screen.findByText(/dashboard/i)).toBeInTheDocument();
});
```

---

### Running Component Tests

```bash
# Watch mode
npm run test

# Browser UI
npm run test:ui

# Coverage report (C8)
npm run test:coverage
```

Coverage output goes to `coverage/` and includes line, branch, and function metrics.

---

### E2E Tests

**Location:** `frontend/e2e/`  
**Framework:** [Playwright](https://playwright.dev/)  
**Browser:** Chromium headless  
**Base URL:** `http://localhost:5173` (Vite dev server must be running)  

**`playwright.config.ts`** key settings:

```typescript
{
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  }
}
```

#### E2E Test Files

| File | Flow tested |
|------|------------|
| `auth.parent.signup.spec.ts` | Fill signup form → submit → OTP input → verify → redirect to login |
| `auth.parent.login.spec.ts` | Enter email + password → land on parent dashboard |
| `auth.child.pin.spec.ts` | Select child account → enter emoji sequence → land on child dashboard |
| `auth.forgot.password.spec.ts` | Enter email → receive OTP → enter new password → login with new password |

**Example test structure:**

```typescript
test('parent can sign up and verify email', async ({ page }) => {
  await page.goto('/auth/signup');
  await page.fill('[name=name]', 'Test Parent');
  await page.fill('[name=email]', 'parent@test.com');
  await page.fill('[name=password]', 'Password1!');
  await page.click('button[type=submit]');

  // OTP page
  await expect(page.locator('h1')).toContainText('Verify your email');
  await page.fill('[data-testid=otp-input]', '123456');  // intercepted in test env
  await page.click('button[type=submit]');

  await expect(page).toHaveURL('/auth/login');
});
```

---

### Running E2E Tests

```bash
# Headless (requires dev server running separately)
npm run test:e2e

# Interactive Playwright UI
npm run test:e2e:ui
```

---

## Test Coverage Summary

| Layer | Framework | Scope |
|-------|-----------|-------|
| Backend unit | Jest | Service functions in isolation |
| Backend integration | Jest + supertest | Full HTTP request/response with real DB logic |
| Frontend component | Vitest + RTL + MSW | Individual components with mocked API |
| Frontend E2E | Playwright | End-to-end user flows in a real browser |

---

## CI Notes

- Backend tests run with `--runInBand` to avoid concurrent MongoDB Memory Server conflicts
- Frontend unit tests use Vitest's native ESM support — no Babel required
- E2E tests assume the Vite dev server is already running; in CI, start it as a background job before running Playwright
- Email is mocked in all test environments — no SMTP credentials needed
