<div align="center">

# 🎓 Kidaptive

### Adaptive English Learning System for Children (Ages 5–10)

A personalized, gamified English learning web app for children, with full parental supervision and an adaptive lesson engine that adjusts to each child's strengths and weaknesses.

![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![MUI](https://img.shields.io/badge/MUI_v7-007FFF?style=for-the-badge&logo=mui&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express_5-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

</div>

---

## 📖 About the Project

**Kidaptive** is a final-year individual project — a responsive web application that provides personalized English education for children aged 5–10.

The system uses an **adaptive learning engine** that continuously analyzes each child's performance and adjusts lesson difficulty, category focus, and recommendations accordingly.

### Key Highlights
- 👨‍👩‍👧 **Parent-controlled accounts** — parents register and create child profiles
- 🧠 **Adaptive learning** — lessons adapt based on a child's weaknesses (grammar, spelling, vocabulary, etc.)
- 🎮 **Gamification** — XP, badges, levels (Beginner → Intermediate → Advanced), and avatars
- 📊 **Parent dashboard** — real-time analytics on each child's progress
- 📝 **Placement test** — sets a child's starting level on first login

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, TypeScript, MUI v7, React Router v7, TanStack Query |
| **Backend** | Node.js, Express 5, TypeScript (MVC architecture) |
| **Validation** | Zod (backend request schemas) |
| **Database** | MongoDB Atlas, Mongoose |
| **Auth** | JWT (role-based: `parent` / `child`) |
| **Code Quality** | ESLint, Prettier |
| **Deployment** | Vercel (frontend), Render (backend), MongoDB Atlas |

---

## 📁 Project Structure

```
kidaptive/                          # Monorepo
│
├── frontend/                       # React (Vite) app
│   └── src/
│       ├── features/               # Feature-sliced architecture
│       │   ├── auth/               # Login, registration
│       │   │   ├── components/
│       │   │   ├── hooks/          # useAuth
│       │   │   ├── pages/          # LoginPage, RegisterPage
│       │   │   ├── services/       # authService.ts
│       │   │   └── types.ts
│       │   ├── child/              # Child learning experience
│       │   │   ├── components/
│       │   │   ├── hooks/
│       │   │   ├── pages/          # Dashboard, Lesson, Progress, Badges
│       │   │   ├── services/
│       │   │   └── types.ts
│       │   ├── parent/             # Parent management panel
│       │   │   ├── components/
│       │   │   ├── hooks/
│       │   │   ├── pages/          # Dashboard, AddChild, ChildDetail
│       │   │   ├── services/
│       │   │   └── types.ts
│       │   └── public/             # Public pages (no auth)
│       │       ├── components/
│       │       └── pages/          # LandingPage, ChooseRolePage
│       ├── hooks/                  # Global shared hooks
│       ├── routes/                 # AppRoutes.tsx
│       ├── services/               # apiClient.ts (Axios instance)
│       ├── shared/
│       │   ├── components/         # ProtectedRoute, reusable UI
│       │   └── theme/              # MUI theme
│       ├── store/                  # Global state (Context)
│       ├── types/                  # Global TypeScript types
│       ├── App.tsx
│       └── main.tsx
│
├── backend/                        # Express API
│   └── src/
│       ├── config/                 # db.ts (MongoDB connection)
│       ├── controllers/            # Request handlers
│       ├── middleware/             # auth.middleware.ts
│       ├── models/                 # Mongoose schemas (User, Lesson, Progress)
│       ├── routes/                 # Express routers
│       ├── services/               # Business logic + adaptive engine
│       ├── utils/                  # jwt.ts helpers
│       ├── app.ts                  # Express app setup
│       └── server.ts               # Entry point
│
└── docs/                           # Architecture notes, API reference
```

---

## ⚙️ Local Development Setup

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free account

---

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/kidaptive.git
cd kidaptive
```

---

### 2. MongoDB Atlas Setup

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → Create a free **M0 cluster**
2. **Database Access** → Add a user (e.g. `kidaptive-admin`) with read/write permission
3. **Network Access** → Add `0.0.0.0/0` for development
4. **Connect** → Drivers → Copy your connection URI

It will look like:
```
mongodb+srv://kidaptive-admin:<password>@cluster0.xxxxx.mongodb.net/kidaptive
```

---

### 3. Backend Setup

```bash
cd backend
npm install
```

Create **`backend/.env`**:

```env
PORT=5000
MONGO_URI=mongodb+srv://kidaptive-admin:<password>@cluster0.xxxxx.mongodb.net/kidaptive
JWT_SECRET=your_strong_secret_key_here
CLIENT_ORIGIN=http://localhost:5173
```

Run the backend:

```bash
npm run dev
# → 🚀 Backend running on http://localhost:5000
# → ✅ MongoDB connected successfully
```

---

### 4. Frontend Setup

```bash
cd frontend
npm install
```

Create **`frontend/.env`**:

```env
VITE_API_URL=http://localhost:5000/api
```

Run the frontend:

```bash
npm run dev
# → App running on http://localhost:5173
```

---

## 🔌 API Overview

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Server health check |
| `POST` | `/api/auth/register` | Public | Parent registration |
| `POST` | `/api/auth/login` | Public | Login (parent or child) |
| `POST` | `/api/auth/child` | Parent | Create a child account |
| `GET` | `/api/auth/children` | Parent | List own children |
| `POST` | `/api/auth/placement` | Child | Submit placement test result |
| `GET` | `/api/lessons` | Authenticated | Get lessons by category/level |
| `GET` | `/api/lessons/recommended` | Child | Adaptive lesson recommendations |
| `POST` | `/api/progress` | Child | Save lesson completion |
| `GET` | `/api/progress/:childId` | Child/Parent | Get child analytics |

---

## 🌊 User Flows

```
Landing Page
  └── Get Started → "Who are you?"
        ├── I'm a Child  → Login (username + password)
        │     └── First time? → Placement Test → Dashboard
        │           └── Categories → Lessons → Progress + Badges
        └── I'm a Parent → Login (email + password) | Sign Up
              └── Parent Dashboard
                    ├── Add Child → generates credentials
                    └── View Child → Analytics + Progress Report
```

---

## 🚀 Deployment

| Service | Platform | Config |
|---|---|---|
| Frontend | [Vercel](https://vercel.com) | Set `VITE_API_URL` to Render URL |
| Backend | [Render](https://render.com) | Set all env vars, add `MONGO_URI` |
| Database | MongoDB Atlas | Whitelist Render's IP |

---

## 📋 Development Status

| Phase | Description | Status |
|---|---|---|
| 0 | Project setup, structure, tooling | ✅ Done |
| 1 | Backend — Auth (register, login, child accounts) | 🔄 In Progress |
| 2 | Backend — Lessons, Progress, Adaptive Engine | ⏳ Pending |
| 3 | Frontend — Landing Page | ⏳ Pending |
| 4 | Frontend — Auth flow | ⏳ Pending |
| 5 | Frontend — Child experience (lessons, badges, XP) | ⏳ Pending |
| 6 | Frontend — Parent dashboard + analytics | ⏳ Pending |
| 7 | Polish, ESLint/Prettier, CI | ⏳ Pending |
| 8 | Deployment (Vercel + Render) | ⏳ Pending |

---

## 👩‍💻 Author

**Dinuri Jayaweera** — Final Year Individual Project  
Adaptive English Learning System · 2026