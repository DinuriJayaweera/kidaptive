# API Reference

Base URL: `http://localhost:5000/api` (development) | `https://<render-host>/api` (production)

All authenticated endpoints require a `Authorization: Bearer <access_token>` header unless noted otherwise.

---

## Authentication

### POST /auth/signup
Register a new parent account.

**Body**
```json
{
  "name": "string",
  "email": "string",
  "password": "string (min 8 chars, must include uppercase, number, special char)"
}
```

**Response `201`**
```json
{ "message": "Verification OTP sent to <email>" }
```

---

### POST /auth/verify-email
Verify the parent's email with the OTP received.

**Body**
```json
{ "email": "string", "otp": "string" }
```

**Response `200`**
```json
{ "message": "Email verified successfully" }
```

---

### POST /auth/login
Login as parent (or admin).

**Body**
```json
{ "email": "string", "password": "string" }
```

**Response `200`**
```json
{
  "accessToken": "string",
  "user": { "id": "string", "name": "string", "email": "string", "role": "parent|admin" }
}
```
Sets an `httpOnly` refresh token cookie.

---

### POST /auth/google/login
Authenticate an existing account via Google OAuth.

**Body**
```json
{ "credential": "string (Google ID token)" }
```

**Response `200`** — same shape as `/auth/login`.

---

### POST /auth/google/signup
Create a new parent account via Google OAuth.

**Body**
```json
{ "credential": "string" }
```

---

### POST /auth/forgot-password
Request a password reset OTP.

**Body**
```json
{ "email": "string" }
```

---

### POST /auth/reset-password
Set a new password using the OTP.

**Body**
```json
{ "email": "string", "otp": "string", "newPassword": "string" }
```

---

### POST /auth/refresh
Exchange a valid refresh token cookie for a new access token. No body required.

**Response `200`**
```json
{ "accessToken": "string" }
```

---

### POST /auth/logout
Invalidate the refresh token cookie.

**Response `200`**
```json
{ "message": "Logged out" }
```

---

### GET /auth/me
Return the currently authenticated user.

**Auth:** required

**Response `200`**
```json
{ "id": "string", "name": "string", "email": "string", "role": "string" }
```

---

## Parent

> All `/parent/*` and `/parents/*` endpoints require role `parent`.

### GET /parents/children
List all children belonging to the authenticated parent.

**Response `200`**
```json
[{ "id": "string", "name": "string", "age": 7, "avatarEmoji": "🐱" }]
```

---

### POST /parents/children
Create a new child profile.

**Body**
```json
{
  "name": "string",
  "age": 7,
  "loginMethod": "pin | emoji",
  "pin": "string (4 digits, if loginMethod=pin)",
  "emojiSequence": ["🐱","🌟","🎈"] 
}
```

**Response `201`**
```json
{ "child": { "id": "string", "name": "string", ... } }
```

---

### GET /parent/child/:id/progress
Full progress breakdown for one child.

**Response `200`**
```json
{
  "xp": 240,
  "gems": 50,
  "streak": 3,
  "categoryProgress": [
    { "categoryId": "string", "name": "Grammar", "level": "explorer", "xp": 80 }
  ],
  "recentActivity": [{ "action": "quiz_completed", "timestamp": "ISO8601" }]
}
```

---

### PUT /parent/child/:id
Update a child's profile (name, age, avatar, login method/credential).

---

### DELETE /parent/child/:id
Remove a child profile.

---

### GET /parent/profile
Return the parent's own account details.

---

### PATCH /parent/profile
Update the parent's name, notification preferences, or screen-time settings.

---

### POST /parent/avatar
Upload a custom avatar image for the parent. Multipart form-data.

---

## Child

> All `/child/*` endpoints require role `child`.

### GET /child/profile
Return the child's profile and aggregate stats.

**Response `200`**
```json
{
  "name": "string",
  "avatarEmoji": "🐱",
  "xp": 240,
  "gems": 50,
  "streak": 3,
  "level": "explorer"
}
```

---

### PATCH /child/profile
Update avatar emoji or image.

---

### GET /child/leaderboard
Return the top children ranked by XP.

**Response `200`**
```json
[{ "rank": 1, "name": "string", "xp": 900, "avatarEmoji": "🐯" }]
```

---

### GET /child/mistakes
Return the child's unanswered / incorrectly answered questions for remedial practice.

---

### POST /child/mistakes
Mark a mistake as resolved (answered correctly in practice).

---

### GET /child/achievements
Return all unlocked achievements and the full catalog with unlock status.

---

### POST /child/achievements
Evaluate and award any newly earned achievements (called by quiz service internally).

---

## Quiz

> Role `child` required.

### POST /quiz/start
Fetch a fresh set of 5 questions for a category.

**Body**
```json
{ "categoryId": "string" }
```

**Response `200`**
```json
{
  "quizId": "string",
  "questions": [
    {
      "id": "string",
      "question": "string",
      "options": ["A","B","C","D"],
      "difficulty": "easy | medium | hard"
    }
  ]
}
```

---

### POST /quiz/submit
Submit answers and receive results.

**Body**
```json
{
  "quizId": "string",
  "categoryId": "string",
  "answers": [
    { "questionId": "string", "selectedOption": "string", "timeTaken": 8 }
  ]
}
```

**Response `200`**
```json
{
  "score": 4,
  "xpEarned": 120,
  "gemsEarned": 10,
  "levelUp": false,
  "newLevel": "explorer",
  "achievements": [{ "id": "string", "name": "First Quiz!" }],
  "mistakes": ["questionId1"]
}
```

---

## Placement Test

### GET /placement-questions
Return a batch of placement questions (20 questions across 4 categories).

**Auth:** role `child` required.

---

### POST /placement-test/submit
Submit placement answers. May need multiple calls (batches of 4 categories at a time).

**Body**
```json
{
  "answers": [
    { "questionId": "string", "selectedOption": "string" }
  ]
}
```

**Response `200`**
```json
{
  "complete": false,
  "nextBatch": { ... }
}
```
When `complete: true`, the child's category levels have been assigned.

---

### GET /placement/status
Check whether the child has completed placement.

**Response `200`**
```json
{ "completed": true, "assignedLevels": { "Grammar": "explorer", ... } }
```

---

## Categories

### GET /categories
Return all active learning categories.

**Auth:** role `child` or `parent`.

**Response `200`**
```json
[{ "id": "string", "name": "Grammar", "description": "string", "status": "active" }]
```

---

## Games

> Role `child` required.

### GET /games
Return all games and their unlock status for the child.

### POST /games/:gameId/unlock
Spend gems to unlock a game.

### GET /games/:gameId/progress
Return the child's level and completion status for a game.

### POST /games/:gameId/complete-level
Mark a game level as completed and award gems.

---

## Admin

> All `/admin/*` endpoints require role `admin`.

### Users — GET /admin/users
List all users with filters (`?role=parent|child|admin&search=name`).

### GET /admin/users/:id
Full user details.

### PATCH /admin/users/:id
Lock/unlock account or update details.

### DELETE /admin/users/:id
Delete a user.

---

### Quizzes — GET /admin/questions
List quiz questions with filters (`?category=&difficulty=&ageGroup=`).

### POST /admin/questions
Create a quiz question.

**Body**
```json
{
  "categoryId": "string",
  "ageGroup": "5-6 | 7-8 | 9-10",
  "difficulty": "easy | medium | hard",
  "question": "string",
  "options": ["A","B","C","D"],
  "correctAnswer": "string",
  "explanation": "string"
}
```

### PUT /admin/questions/:id
Update a question.

### DELETE /admin/questions/:id
Delete a question.

---

### Categories — GET /admin/categories
### POST /admin/categories
### PUT /admin/categories/:id
### DELETE /admin/categories/:id

---

### Age Groups — GET /admin/age-groups
Return per-age-group statistics and category matrix data.

---

### Performance — GET /admin/performance
Return platform-wide analytics: active users, quiz completion rates, average scores, struggling learners.

---

### Admin Profile — GET /admin/profile
### PATCH /admin/profile

---

## Health

### GET /health
Liveness check.

**Response `200`**
```json
{ "status": "ok", "timestamp": "ISO8601" }
```

---

## Error Format

All errors return a consistent envelope:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "statusCode": 400
}
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request / validation error |
| 401 | Unauthenticated |
| 403 | Forbidden (wrong role) |
| 404 | Resource not found |
| 409 | Conflict (e.g. duplicate email) |
| 500 | Internal server error |

---

## Token Lifecycle

```
Signup ──► verify-email ──► login ──► [accessToken 15m] + [refreshToken cookie 7d]
                                           │
                               401 on request ──► POST /auth/refresh ──► new accessToken
                                                         │
                                               refresh expired ──► redirect /login
```
