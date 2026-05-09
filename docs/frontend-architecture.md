# Frontend Architecture

## Overview

The frontend is a **React 19** single-page application built with Vite. It uses a feature-sliced directory layout where each user role (child, parent, admin) owns its own pages, components, and API layer. Routing is handled by React Router v7, data fetching by TanStack React Query, and UI components by Material-UI (MUI) v7.

```
frontend/
├── src/
│   ├── main.tsx               # Entry point — provider setup
│   ├── App.tsx                # Root component with AchievementProvider
│   ├── routes/
│   │   └── AppRoutes.tsx      # All route definitions
│   ├── features/
│   │   ├── auth/              # Login, signup, password reset
│   │   ├── child/             # Child learning interface
│   │   ├── parent/            # Parent dashboard
│   │   ├── admin/             # Admin panel
│   │   └── public/            # Landing page, role select
│   ├── app/
│   │   └── guards/
│   │       └── RouteGuard.tsx # Role-based route protection
│   ├── shared/
│   │   ├── components/        # Navbar, Footer, ProtectedRoute
│   │   └── theme/             # MUI theme config
│   ├── services/
│   │   └── apiClient.ts       # Axios instance with JWT refresh interceptor
│   ├── store/                 # Global context providers
│   ├── hooks/                 # Global custom hooks
│   └── types/                 # Shared TypeScript interfaces
├── e2e/                       # Playwright E2E tests
├── vite.config.ts
├── playwright.config.ts
└── tsconfig.json
```

---

## Technology Stack

| Concern | Choice |
|---------|--------|
| Framework | React 19.2 |
| Language | TypeScript 5.9 |
| Build tool | Vite |
| Router | React Router v7 |
| Data fetching | TanStack React Query v5 |
| UI components | Material-UI (MUI) v7 + Emotion |
| HTTP client | Axios |
| Auth (OAuth) | `@react-oauth/google` |
| Unit/component tests | Vitest + React Testing Library + MSW |
| E2E tests | Playwright |
| Deployment | Vercel |

---

## Application Bootstrap

**`src/main.tsx`** wraps the app in:

```tsx
<GoogleOAuthProvider clientId={VITE_GOOGLE_CLIENT_ID}>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
</GoogleOAuthProvider>
```

**`src/App.tsx`** adds:

```tsx
<AchievementProvider>
  <ThemeProvider theme={muiTheme}>
    <AppRoutes />
  </ThemeProvider>
</AchievementProvider>
```

---

## Routing

**`src/routes/AppRoutes.tsx`** defines all routes using React Router v7 `<Routes>/<Route>`.

### Route Map

| Path | Component | Guard |
|------|-----------|-------|
| `/` | `LandingPage` | Public |
| `/auth/role` | `RoleSelectPage` | PublicOnly |
| `/auth/signup` | `ParentSignupPage` | PublicOnly |
| `/auth/verify-email` | `VerifyEmailPage` | PublicOnly |
| `/auth/login` | `ParentLoginPage` | PublicOnly |
| `/auth/forgot-password` | `ForgotPasswordPage` | PublicOnly |
| `/auth/reset-password` | `ResetPasswordPage` | PublicOnly |
| `/auth/child/select` | `ChildSelectPage` | PublicOnly |
| `/auth/child/pin` | `ChildPinPage` | PublicOnly |
| `/parent/dashboard` | `ParentDashboardPage` | ParentRoute |
| `/parent/children/new` | `CreateChildPage` | ParentRoute |
| `/parent/child/:childId` | `ChildProgressPage` | ParentRoute |
| `/parent/settings` | `ParentSettingsPage` | ParentRoute |
| `/parent/profile` | `ParentProfilePage` | ParentRoute |
| `/child/dashboard` | `ChildDashboardPage` | ChildRoute |
| `/child/placement` | `PlacementQuizPage` | ChildRoute |
| `/child/quiz/:categoryId` | `AdaptiveQuizPage` | ChildRoute |
| `/child/practice/mistakes` | `MistakesPracticePage` | ChildRoute |
| `/child/games` | `GamesPage` | ChildRoute |
| `/child/games/word-finder` | `WordFinderGame` | ChildRoute |
| `/child/games/spelling-challenge` | `SpellingChallengeGame` | ChildRoute |
| `/child/games/word-builder` | `WordBuilderGame` | ChildRoute |
| `/admin/dashboard` | `AdminDashboardPage` | AdminRoute |
| `/admin/quizzes` | `QuizzesPage` | AdminRoute |
| `/admin/categories` | `CategoriesPage` | AdminRoute |
| `/admin/users` | `UserManagementPage` | AdminRoute |
| `/admin/performance` | `PerformancePage` | AdminRoute |
| `/admin/age-groups` | `AgeGroupsPage` | AdminRoute |
| `/admin/settings` | `AdminSettingsPage` | AdminRoute |
| `/admin/profile` | `AdminProfilePage` | AdminRoute |

### Route Guards — `src/app/guards/RouteGuard.tsx`

| Guard | Behaviour |
|-------|-----------|
| `PublicOnly` | Redirect authenticated users to their role's dashboard |
| `ParentRoute` | Redirect to `/auth/login` if not authenticated as `parent` |
| `ChildRoute` | Redirect to `/auth/child/select` if not authenticated as `child` |
| `AdminRoute` | Redirect to `/auth/login` if not authenticated as `admin` |

---

## Feature Slices

### `features/auth/`

Handles all authentication flows.

```
auth/
├── api/
│   └── authApi.ts          # HTTP calls: login, signup, verify, refresh, logout, Google
├── context/
│   └── AuthContext.tsx      # Global auth state (user, login, logout, isLoading)
├── hooks/
│   └── useAuth.ts          # Convenience wrapper for AuthContext
├── components/
│   ├── AuthHeader.tsx
│   └── EmojiKeypad.tsx     # Emoji-based PIN input for child login
├── pages/
│   ├── ParentLoginPage.tsx
│   ├── ParentSignupPage.tsx
│   ├── VerifyEmailPage.tsx
│   ├── ForgotPasswordPage.tsx
│   ├── ResetPasswordPage.tsx
│   ├── ChildSelectPage.tsx  # Lists child accounts under a parent
│   └── ChildPinPage.tsx     # Child enters emoji/pin sequence
└── types.ts                 # AuthUser interface
```

**AuthContext** stores:
```typescript
{
  user: AuthUser | null,   // { id, name, role, email? }
  login(user, token): void,
  logout(): void,
  isLoading: boolean
}
```
The token is persisted in `localStorage` and read back on page load.

---

### `features/child/`

The core learning interface used by children.

```
child/
├── pages/
│   ├── ChildDashboardPage.tsx    # Category grid + stats
│   ├── PlacementQuizPage.tsx     # Initial placement test
│   ├── AdaptiveQuizPage.tsx      # Per-category adaptive quiz
│   ├── MistakesPracticePage.tsx  # Remedial practice
│   ├── GamesPage.tsx             # Game selection + gem costs
│   └── games/
│       ├── WordFinderGame.tsx
│       ├── SpellingChallengeGame.tsx
│       └── WordBuilderGame.tsx
├── components/
│   ├── CategoryCard.tsx          # Category tile (name, level, XP bar)
│   ├── CategoryGrid.tsx          # Grid layout of CategoryCards
│   ├── ChildSidebar.tsx          # Left navigation
│   ├── TopBarStats.tsx           # XP / gems / streak display
│   ├── LeaderboardCard.tsx       # Ranked list of children
│   └── DailyQuestCard.tsx        # Daily challenge display
├── services/
│   ├── quizApi.ts                # POST /quiz/start, /quiz/submit
│   └── placementTestApi.ts       # GET /placement-questions, POST /placement-test/submit
├── hooks/
│   └── useAchievementToasts.tsx  # AchievementProvider + queue system
└── constants/
    └── achievementCatalog.ts     # Frontend catalog (icons, labels, descriptions)
```

**Key page flows:**

*AdaptiveQuizPage* — fetches 5 questions via `quizApi.startQuiz`, renders one question at a time with a countdown timer, collects answers, calls `quizApi.submitQuiz`, shows results screen with XP/gem awards and any unlocked achievements.

*PlacementQuizPage* — multi-batch flow; calls placement API in sequence until `complete: true`, then redirects to the child dashboard with assigned levels.

---

### `features/parent/`

```
parent/
├── pages/
│   ├── ParentDashboardPage.tsx   # Children overview cards
│   ├── CreateChildPage.tsx       # Add child form
│   ├── ChildProgressPage.tsx     # Per-child analytics
│   ├── ParentSettingsPage.tsx
│   └── ParentProfilePage.tsx
├── api/
│   └── parentApi.ts              # HTTP wrappers for /parent/* endpoints
├── components/                   # Reusable parent UI fragments
└── layouts/
    └── ParentLayout.tsx          # Sidebar + top bar shell
```

---

### `features/admin/`

```
admin/
├── pages/
│   ├── AdminDashboardPage.tsx
│   ├── QuizzesPage.tsx           # Question CRUD table + modal
│   ├── CategoriesPage.tsx        # Category management
│   ├── UserManagementPage.tsx    # User list + lock/unlock
│   ├── PerformancePage.tsx       # Analytics charts
│   ├── AgeGroupsPage.tsx         # Age group stats + category matrix
│   ├── AdminSettingsPage.tsx
│   └── AdminProfilePage.tsx
├── api/
│   ├── adminQuizApi.ts
│   ├── adminUsersApi.ts
│   ├── adminCategoryApi.ts
│   └── adminPerformanceApi.ts
├── components/
│   ├── QuestionModal.tsx
│   └── AdminHeader.tsx
└── layouts/
    └── AdminLayout.tsx
```

---

## HTTP Client

**`src/services/apiClient.ts`** — singleton Axios instance.

```typescript
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true  // sends refresh token cookie
});
```

**Request interceptor** — injects Bearer token from `localStorage`:
```typescript
config.headers.Authorization = `Bearer ${localStorage.getItem('accessToken')}`;
```

**Response interceptor** — handles 401 automatically:
1. Calls `POST /auth/refresh` (uses httpOnly cookie)
2. Retries the original request with the new token
3. On refresh failure — clears localStorage, redirects to `/auth/login`
4. Queues concurrent requests that arrive during a refresh to avoid race conditions

---

## State Management

The app avoids a global store library. State is managed through:

| Mechanism | Used For |
|-----------|---------|
| `AuthContext` | Current user identity, login/logout |
| `AchievementProvider` | Achievement toast queue across the child session |
| TanStack React Query | Server state — fetching, caching, invalidation |
| Local `useState` | Ephemeral UI state (form values, modal open, timer) |

---

## Styling

- **MUI ThemeProvider** — custom palette, typography, and breakpoints in `src/shared/theme/theme.ts`
- **CSS custom properties** — `src/styles/theme.css` defines design tokens (colours, spacing) used outside MUI context
- **Emotion** — MUI's default styling engine; `sx` prop used throughout for component-level overrides
- **Fonts** — Baloo 2 (child interface) and Poppins (admin/parent) via `@fontsource`

---

## Key Components

### `EmojiKeypad`
Renders a grid of emoji buttons for children to enter their login sequence. Manages a local sequence state and calls `onComplete` when the required length is reached.

### `CategoryCard`
Displays a learning category with:
- Category name and icon
- Current level badge (Starter / Explorer / Champion)
- XP progress bar toward next level
- Click → navigate to `/child/quiz/:categoryId`

### `TopBarStats`
Persistent header bar for the child interface showing real-time XP, gem count, and current streak. Refreshes via React Query on quiz completion.

### `AchievementProvider` + `useAchievementToasts`
A context + queue system that:
1. Receives an array of newly unlocked achievements after quiz submit
2. Renders MUI `Snackbar` toasts one at a time with animation
3. Drains the queue at a configurable interval

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID |

---

## Build & Development Scripts

```bash
npm run dev              # Vite dev server (port 5173, HMR)
npm run build            # tsc -b && vite build → dist/
npm run lint             # eslint .
npm run test             # vitest (watch mode)
npm run test:ui          # vitest with browser UI
npm run test:coverage    # vitest run --coverage (C8)
npm run test:e2e         # playwright test (headless Chromium)
npm run test:e2e:ui      # playwright test --ui
```
