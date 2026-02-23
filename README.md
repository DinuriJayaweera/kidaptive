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

