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

## Daily Quest

> Role `child` required.

### GET /child/daily-quest/today
Check whether the daily quest is available or already completed today.

**Response `200`**
```json
{ "status": "available" }
```
```json
{ "status": "completed", "completedAt": "ISO8601" }
```

---

### POST /child/daily-quest/start
Start today's daily quest and receive 10 questions.

**Response `200`**
```json
{
  "questions": [
    {
      "_id": "string",
      "questionText": "string",
      "type": "mcq | input",
      "category": "string",
      "difficulty": "easy | medium | hard",
      "options": ["A","B","C","D"]
    }
  ],
  "totalQuestions": 10
}
```
Correct answers are **not** included in the response.

**Error `409`** — quest already started or completed today.

---

### POST /child/daily-quest/submit
Submit answers for the daily quest.

**Body**
```json
{
  "answers": [
    { "questionId": "string", "selectedAnswer": "string" }
  ]
}
```

**Response `200`**
```json
{
  "score": 100,
  "passed": true,
  "correctCount": 10,
  "totalQuestions": 10,
  "xpEarned": 20,
  "gemsEarned": 150,
  "totalXP": 340,
  "totalGems": 200
}
```

Scoring: `score = round((correctCount / 10) × 100)`. Pass threshold: ≥ 75.
XP: `floor(score / 100 × 20)` max 20. Gems: `floor(score / 100 × 100)` + 50 bonus at 100%.

**Error `409`** — already submitted today.

---

## Games

> Role `child` required.

### GET /games
Return all games and their unlock status for the child.

**Response `200`**
```json
[
  {
    "id": "word-finder",
    "name": "Word Finder",
    "description": "string",
    "gemCost": 100,
    "unlocked": false,
    "highestLevel": 0
  }
]
```

---

### POST /games/unlock
Spend gems to unlock a game.

**Body**
```json
{ "gameId": "word-finder | spelling-challenge | word-builder" }
```

**Response `200`**
```json
{ "message": "Game unlocked", "remainingGems": 50 }
```

**Error `400`** — not enough gems. **Error `404`** — unknown game ID. **Error `409`** — already unlocked.

---

### GET /games/:gameId/levels
Return level data for a specific game.

**Response `200`**
```json
{ "levels": [{ "level": 1, "words": ["apple","grape"] }] }
```

**Error `404`** — game not found or level out of range.

---

### POST /games/:gameId/score
Submit a completed level and receive gem rewards.

**Body**
```json
{ "level": 1 }
```

**Response `200`**
```json
{ "gemsEarned": 20, "totalGems": 70, "highestLevel": 1 }
```

Replaying a completed level awards 0 gems. Requires game to be unlocked (403 if not).

---

## Parent Notifications

> Role `parent` required.

### GET /parent/notifications
Return the parent's notification feed.

**Response `200`**
```json
[{
  "_id": "string",
  "type": "level_up | champion | achievement | daily_quest | streak_milestone | gems_milestone | inactive | password_reset_request",
  "title": "string",
  "message": "string",
  "icon": "🏆",
  "read": false,
  "childName": "string",
  "createdAt": "ISO8601"
}]
```

### GET /parent/notifications/unread-count
```json
{ "count": 3 }
```

### PATCH /parent/notifications/read-all
Mark all notifications as read.

### PATCH /parent/notifications/:id/read
Mark a single notification as read.

### DELETE /parent/notifications/:id
Delete a notification.

---

## Child Password Reset

### POST /child-password-reset/request
Child submits their username to request help from their parent. No auth required.

**Body**
```json
{ "username": "string" }
```

**Response `200`**
```json
{ "message": "Request submitted. Ask your parent to check their notifications." }
```

### GET /child-password-reset/pending/:childId
Return the pending reset request for a child. **Role `parent` required.**

### POST /child-password-reset/change/:childId
Reset child's credentials using the current emoji/PIN. **Role `parent` required.**

**Body**
```json
{ "newEmojiSequence": ["🐶","🐱","🐻","🦊"] }
```

### POST /child-password-reset/:requestId/send-otp
Send OTP to parent's email for the forgot flow. **Role `parent` required.**

### POST /child-password-reset/:requestId/reset
Reset child credentials using OTP. **Role `parent` required.**

**Body**
```json
{ "otp": "string", "newEmojiSequence": ["🐶","🐱","🐻","🦊"] }
```

---

## Stories (Child)

> Role `child` required.

### GET /child/stories
Return all published stories.

**Response `200`**
```json
[{
  "_id": "string",
  "title": "string",
  "description": "string",
  "coverImagePath": "string",
  "status": "published"
}]
```

### GET /child/stories/:id
Return a single published story with the PDF path for in-app reading.

---

## Music (Child)

> Role `child` required.

### GET /child/music
Return all published music tracks.

**Response `200`**
```json
[{
  "_id": "string",
  "title": "string",
  "description": "string",
  "artist": "string",
  "coverImagePath": "string",
  "audioPath": "string",
  "videoPath": "string"
}]
```

### GET /child/music/:id
Return a single published track.

---

## Parent Rating

> Role `parent` required.

### GET /parent/rating/prompt-status
Check whether the rating prompt should be shown.

**Response `200`**
```json
{ "shouldPrompt": true }
```

### POST /parent/rating
Submit a star rating with optional feedback.

**Body**
```json
{ "rating": 5, "feedback": "string (optional, max 1000 chars)" }
```

### POST /parent/rating/not-now
Dismiss the rating prompt temporarily.

### POST /parent/rating/never-ask
Permanently dismiss the rating prompt.

---

## Public Ratings

### GET /ratings
Return a summary of all parent ratings (for landing page). No auth required.

**Response `200`**
```json
{ "averageRating": 4.7, "totalRatings": 43 }
```

---

## Contact

### POST /contact
Submit a contact form message. No auth required.

**Body**
```json
{ "name": "string", "email": "string", "message": "string" }
```

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

### Placement Test Questions — GET /admin/placement-tests
### POST /admin/placement-tests
### PUT /admin/placement-tests/:id
### DELETE /admin/placement-tests/:id

---

### Daily Quest Questions — GET /admin/daily-quests
List daily quest questions with filters (`?ageGroup=&type=`).

### POST /admin/daily-quests
Create a daily quest question.

**Body**
```json
{
  "questionText": "string",
  "ageGroup": "5-6 | 7-8 | 9-10",
  "category": "string",
  "type": "mcq | fill | input | boolean",
  "difficulty": "easy | medium | hard",
  "options": ["A","B","C","D"],
  "correctAnswer": "string"
}
```

### PUT /admin/daily-quests/:id
### DELETE /admin/daily-quests/:id

---

### Categories — GET /admin/categories
### POST /admin/categories
### PUT /admin/categories/:id
### DELETE /admin/categories/:id

---

### Stories — GET /admin/stories
List all stories (published and draft).

### POST /admin/stories
Upload a story. Multipart form-data with fields: `title`, `description`, `pdf` (file), `cover` (file, optional).

### PUT /admin/stories/:id
Update story metadata or files.

### DELETE /admin/stories/:id

### PATCH /admin/stories/:id/status
Toggle between `published` and `draft`.

---

### Music — GET /admin/music
List all music tracks (published and draft).

### POST /admin/music
Upload a track. Multipart form-data with fields: `title`, `description`, `artist`, `audio` (file), `video` (file), `cover` (file, optional).

### PUT /admin/music/:id
### DELETE /admin/music/:id

### PATCH /admin/music/:id/status
Toggle between `published` and `draft`.

---

### Admin Notifications — GET /admin/notifications
Return the admin notification feed. Types: `new_parent`, `new_child`, `placement_completed`, `champion_reached`, `question_bank_low`, `daily_quest_low`, `high_activity`, `system_error`.

### PATCH /admin/notifications/:id/read
### PATCH /admin/notifications/read-all

---

### Ratings — GET /admin/ratings
Return all parent ratings with feedback text.

---

### Age Groups — GET /admin/age-groups
Return per-age-group statistics and category completion matrix.

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
