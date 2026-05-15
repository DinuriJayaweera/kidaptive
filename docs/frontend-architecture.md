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
│   │   └── public/            # Landing, About, Contact, Privacy, Terms, Safety
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
| Unit/component tests | Vitest + React Testing Library |
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

#### Public

| Path | Component | Guard |
|------|-----------|-------|
| `/` | `LandingPage` | Public |
| `/about` | `AboutUsPage` | Public |
| `/contact` | `ContactUsPage` | Public |
| `/privacy` | `PrivacyPolicyPage` | Public |
| `/terms` | `TermsOfServicePage` | Public |
| `/safety` | `ChildSafetyPage` | Public |

#### Auth (Public only — redirects authenticated users)

| Path | Component | Guard |
|------|-----------|-------|
| `/auth/role` | `RoleSelectPage` | PublicOnly |
| `/auth/admin-login` | `AdminLoginPage` | PublicOnly |
| `/auth/signup` | `ParentSignupPage` | PublicOnly |
| `/auth/verify-email` | `VerifyEmailPage` | Public |
| `/auth/login` | `ParentLoginPage` | PublicOnly |
| `/auth/forgot-password` | `ForgotPasswordPage` | PublicOnly |
| `/auth/reset-password` | `ResetPasswordPage` | PublicOnly |
| `/auth/child/select` | `ChildSelectPage` | PublicOnly |
| `/auth/child/pin` | `ChildPinPage` | PublicOnly |
| `/auth/child/forgot` | `ChildForgotPage` | Public |

#### Parent (ParentRoute — requires authenticated parent)

| Path | Component |
|------|-----------|
| `/parent/dashboard` | `ParentDashboardPage` |
| `/parent/children` | `ParentChildrenPage` |
| `/parent/children/new` | `CreateChildPage` |
| `/parent/child/:childId` | `ChildProgressPage` |
| `/parent/settings` | `ParentSettingsPage` |
| `/parent/profile` | `ParentProfilePage` |
| `/parent/notifications` | `NotificationsPage` |
| `/parent/reset-child/:childId` | `ChildPasswordResetPage` |

#### Child (ChildRoute — requires authenticated child)

| Path | Component |
|------|-----------|
| `/child/intro` | `ChildIntroPage` |
| `/child/intro/achievements` | `ChildIntroAchievements` |
| `/child/intro/find-level` | `ChildIntroFindLevel` |
| `/child/intro/placement` | `ChildIntroPlacement` |
| `/child/intro/loading` | `ChildIntroLoading` |
| `/child/dashboard` | `ChildDashboardPage` |
| `/child/placement` | `PlacementQuizPage` |
| `/child/placement/results` | `PlacementResultsPage` |
| `/child/category-progress/:categoryId` | `CategoryProgressPage` |
| `/child/quiz/:categoryId` | `AdaptiveQuizPage` |
| `/child/letters` | `LettersPage` |
| `/child/profile` | `ChildProfilePage` |
| `/child/leaderboards` | `LeaderboardPage` |
| `/child/practice` | `PracticePage` |
| `/child/practice/mistakes` | `MistakesPracticePage` |
| `/child/achievements` | `AchievementsPage` |
| `/child/quests` | `QuestsPage` |
| `/child/daily-quest` | `DailyQuestPage` |
| `/child/games` | `GamesPage` |
| `/child/games/word-finder` | `WordFinderGame` |
| `/child/games/spelling-challenge` | `SpellingChallengeGame` |
| `/child/games/word-builder` | `WordBuilderGame` |
| `/child/stories` | `StoriesPage` |
| `/child/stories/:storyId` | `StoryReaderPage` |
| `/child/music` | `MusicPage` |

#### Admin (AdminRoute — requires authenticated admin, nested under `AdminLayout`)

| Path | Component |
|------|-----------|
| `/admin/dashboard` | `AdminDashboardPage` |
| `/admin/age-groups` | `AgeGroupsPage` |
| `/admin/placement-tests` | `PlacementTestsPage` |
| `/admin/quizzes` | `QuizzesPage` |
| `/admin/daily-quests` | `DailyQuestQuestionsPage` |
| `/admin/categories` | `CategoriesPage` |
| `/admin/users` | `UserManagementPage` |
| `/admin/performance` | `PerformancePage` |
| `/admin/settings` | `SettingsPage` |
| `/admin/profile` | `AdminProfilePage` |
| `/admin/notifications` | `AdminNotificationsPage` |
| `/admin/stories` | `AdminStoriesPage` |
| `/admin/music` | `AdminMusicPage` |
| `/admin/ratings` | `AdminRatingsPage` |

### Route Guards — `src/app/guards/RouteGuard.tsx`

| Guard | Behaviour |
|-------|-----------|
| `PublicOnly` | Redirect authenticated users to their role's dashboard |
| `ParentRoute` | Redirect to `/auth/login` if not authenticated as `parent` |
| `ChildRoute` | Redirect to `/auth/child/select` if not authenticated as `child` |
| `AdminRoute` | Redirect to `/auth/admin-login` if not authenticated as `admin` |

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
│   ├── AdminLoginPage.tsx
│   ├── ChildSelectPage.tsx  # Lists child accounts under a parent
│   ├── ChildPinPage.tsx     # Child enters emoji/pin sequence
│   └── ChildForgotPage.tsx  # Child submits username to request parent help
└── types.ts                 # AuthUser interface
```

---

### `features/child/`

The core learning interface used by children.

```
child/
├── pages/
│   ├── ChildDashboardPage.tsx      # Category grid + stats
│   ├── ChildIntroPage.tsx          # First-login onboarding flow entry
│   ├── ChildIntroAchievements.tsx  # Onboarding: achievements preview
│   ├── ChildIntroFindLevel.tsx     # Onboarding: placement explanation
│   ├── ChildIntroPlacement.tsx     # Onboarding: placement start
│   ├── ChildIntroLoading.tsx       # Onboarding: transition screen
│   ├── PlacementQuizPage.tsx       # Initial placement test
│   ├── PlacementResultsPage.tsx    # Assigned levels display
│   ├── CategoryProgressPage.tsx    # Per-category detail + quiz entry
│   ├── AdaptiveQuizPage.tsx        # Per-category adaptive quiz
│   ├── LettersPage.tsx             # Alphabet reference page
│   ├── ChildProfilePage.tsx        # Child avatar + stats
│   ├── LeaderboardPage.tsx         # Ranked leaderboard
│   ├── PracticePage.tsx            # Practice hub (mistakes + review)
│   ├── MistakesPracticePage.tsx    # Remedial practice
│   ├── PracticeQuizPage.tsx        # Practice quiz runner
│   ├── AchievementsPage.tsx        # Full achievements catalog
│   ├── QuestsPage.tsx              # Quests overview
│   ├── DailyQuestPage.tsx          # Daily 10-question challenge
│   ├── GamesPage.tsx               # Game selection + gem costs
│   ├── StoriesPage.tsx             # Published stories library
│   ├── StoryReaderPage.tsx         # PDF story reader
│   ├── MusicPage.tsx               # Music/songs player
│   └── games/
│       ├── WordFinderGame.tsx
│       ├── SpellingChallengeGame.tsx
│       └── WordBuilderGame.tsx
├── components/
│   ├── CategoryCard.tsx            # Category tile (name, level, XP bar)
│   ├── CategoryGrid.tsx            # Grid layout of CategoryCards
│   ├── ChildSidebar.tsx            # Left navigation
│   ├── TopBarStats.tsx             # XP / gems / streak display
│   ├── LeaderboardCard.tsx         # Ranked list of children
│   └── DailyQuestCard.tsx          # Daily challenge summary card
├── services/
│   ├── quizApi.ts                  # POST /quiz/start, /quiz/submit, GET /quiz/dashboard
│   ├── placementTestApi.ts         # Placement endpoints
│   ├── childDailyQuestApi.ts       # GET /today, POST /start, POST /submit
│   ├── achievementsApi.ts          # GET /child/achievements
│   ├── gamesApi.ts                 # Games endpoints
│   └── screenTimeService.ts        # Session heartbeat calls
├── hooks/
│   └── useAchievementToasts.tsx    # AchievementProvider + toast queue
└── constants/
    └── achievementCatalog.ts       # Frontend catalog (icons, labels)
```

**Key page flows:**

*AdaptiveQuizPage* — fetches 5 questions, countdown timer, collects answers, shows results with XP/gem awards and achievement toasts.

*DailyQuestPage* — fetches 10 daily quest questions, supports MCQ, fill-blank, and input types, shows skip/check flow, submits all answers on completion, displays result screen.

*PlacementQuizPage* — multi-batch flow; calls placement API sequentially until `complete: true`, redirects to results page.

*ChildIntroPage flow* — first-login onboarding: intro → achievements preview → find-level explanation → placement start → loading → placement quiz.

---

### `features/parent/`

```
parent/
├── pages/
│   ├── ParentDashboardPage.tsx    # Children overview cards
│   ├── ParentChildrenPage.tsx     # Full children list
│   ├── CreateChildPage.tsx        # Add child form
│   ├── ChildProgressPage.tsx      # Per-child analytics
│   ├── ParentSettingsPage.tsx     # Account settings
│   ├── ParentProfilePage.tsx      # Profile management
│   ├── NotificationsPage.tsx      # Parent notification feed
│   └── ChildPasswordResetPage.tsx # Reset child's emoji/PIN
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
│   ├── QuizzesPage.tsx               # Question CRUD
│   ├── PlacementTestsPage.tsx        # Placement question CRUD
│   ├── DailyQuestQuestionsPage.tsx   # Daily quest question CRUD
│   ├── CategoriesPage.tsx            # Category management
│   ├── UserManagementPage.tsx        # User list + lock/unlock
│   ├── AgeGroupsPage.tsx             # Age-group stats + matrix
│   ├── PerformancePage.tsx           # Platform analytics
│   ├── AdminNotificationsPage.tsx    # System notification feed
│   ├── AdminStoriesPage.tsx          # Story upload + management
│   ├── AdminMusicPage.tsx            # Music upload + management
│   ├── AdminRatingsPage.tsx          # Parent ratings dashboard
│   ├── SettingsPage.tsx
│   ├── AdminProfilePage.tsx
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

### `features/public/`

Static informational pages — no auth required.

| Page | Path |
|------|------|
| `LandingPage` | `/` |
| `AboutUsPage` | `/about` |
| `ContactUsPage` | `/contact` |
| `PrivacyPolicyPage` | `/privacy` |
| `TermsOfServicePage` | `/terms` |
| `ChildSafetyPage` | `/safety` |

---

## HTTP Client

**`src/services/apiClient.ts`** — singleton Axios instance.

```typescript
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true  // sends refresh token cookie
});
```

**Request interceptor** — injects Bearer token from `localStorage`.

**Response interceptor** — handles 401 automatically:
1. Calls `POST /auth/refresh` (uses httpOnly cookie)
2. Retries the original request with the new token
3. On refresh failure — clears localStorage, redirects to `/auth/login`
4. Queues concurrent requests during a refresh to avoid race conditions

---

## State Management

| Mechanism | Used For |
|-----------|---------|
| `AuthContext` | Current user identity, login/logout |
| `AchievementProvider` | Achievement toast queue across the child session |
| TanStack React Query | Server state — fetching, caching, invalidation |
| Local `useState` | Ephemeral UI state (form values, modal open, timer) |

---

## Styling

- **MUI ThemeProvider** — custom palette, typography, and breakpoints in `src/shared/theme/theme.ts`
- **CSS custom properties** — `src/styles/theme.css` defines design tokens used outside MUI context
- **Emotion** — MUI's default styling engine; `sx` prop used throughout
- **Fonts** — Baloo 2 (child interface) and Poppins (admin/parent) via `@fontsource`

---

## Key Components

### `EmojiKeypad`
Grid of emoji buttons for children to enter their login sequence. Manages local sequence state, calls `onComplete` when required length is reached.

### `CategoryCard`
Displays a learning category with name, icon, level badge, XP progress bar. Click → `/child/quiz/:categoryId`.

### `TopBarStats`
Persistent header bar showing real-time XP, gem count, and streak. Refreshes via React Query after quiz completion.

### `AchievementProvider` + `useAchievementToasts`
Context + queue system that receives newly unlocked achievements and renders MUI Snackbar toasts one at a time.

### `DailyQuestCard`
Dashboard widget showing today's quest status (available / completed) and a quick-launch button.

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
npx vitest run           # Run all component tests once
npm run test             # vitest watch mode
npm run test:coverage    # coverage report (C8)
npm run test:e2e         # playwright test (headless Chromium)
npm run test:e2e:ui      # playwright test --ui
```
