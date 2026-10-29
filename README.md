# LearnSphere

An online learning platform inspired by NPTEL, built as a **MERN stack** project
(MongoDB, Express, React, Node.js).

The repository contains two folders that work together:

```
LearnSphere/
├── frontend/   # React + Vite + Tailwind CSS single-page app
└── backend/    # Express + MongoDB (Mongoose) REST API
```

The frontend talks to the backend **only over HTTP** (no backend code is imported
into React). Authentication uses a JWT stored in an **HttpOnly cookie**, and all
quiz grading happens on the server.

---

## Tech stack

**Frontend**

- React 19 (JavaScript, functional components + hooks)
- Vite
- React Router DOM
- Tailwind CSS v4
- Lucide React icons
- Axios

**Backend**

- Node.js + Express 4
- MongoDB Atlas with Mongoose
- JWT (HttpOnly cookie) + bcryptjs
- Node's built-in test runner (`node --test`)

---

## Quick start

You need **two terminals**: one for the API, one for the frontend, plus a MongoDB
Atlas connection string.

### 1. Backend (API)

```powershell
cd LearnSphere\backend
Copy-Item .env.example .env     # then edit .env with your MONGODB_URI + JWT_SECRET
npm install
npm test                        # runs without a database
npm run seed                    # inserts sample courses + module quizzes
npm run seed:admin -- "Admin Name" admin@example.com Admin@12345
npm start                       # http://localhost:5000
```

See [`backend/README.md`](backend/README.md) for the full MongoDB Atlas tutorial,
the data model, the API reference and troubleshooting.

### 2. Frontend (SPA)

```powershell
cd LearnSphere\frontend
Copy-Item .env.example .env     # VITE_API_BASE_URL=http://localhost:5000/api
npm install
npm run dev                     # http://localhost:5173
```

> **Important:** the backend only allows the origin in `CLIENT_URL`
> (`http://localhost:5173` by default) and CORS is configured with
> `credentials: true`. Run the Vite dev server on that exact port, otherwise the
> browser blocks the requests.

### 3. Log in

- Register a **student** account from the UI (`/register`), or
- Sign in as the admin you created with `npm run seed:admin`.

---

## How the pieces fit together

```
React page  ──Axios (withCredentials)──▶  Express route  ──▶  Controller
   ▲                                                                 │
   └────────────── JSON (never the answer key) ◀──  Mongoose ──▶  MongoDB
```

- `frontend/src/services/*` is the **only** place that knows the API URLs.
- `AuthContext` restores the session on load (`GET /api/auth/me`) and exposes
  `user`, `login`, `register`, `logout`.
- `ProtectedRoute` and `AdminRoute` guard `/learn`, `/quiz`, `/dashboard` and
  `/admin` based on the authenticated user and role.

---

## Folder structure

```
LearnSphere/
├── frontend/
│   ├── .env.example              # VITE_API_BASE_URL template
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx              # Entry point — mounts React
│       ├── App.jsx               # Routes + AuthProvider + guards
│       ├── index.css             # Tailwind import + theme tokens
│       ├── layouts/
│       │   └── MainLayout.jsx    # Shared Navbar + Footer
│       ├── context/
│       │   └── AuthContext.jsx   # Session state + useAuth()
│       ├── services/             # API layer (Axios)
│       │   ├── api.js            # Instance, base URL, error normalizer
│       │   ├── authService.js
│       │   ├── courseService.js  # + normalizeCourse(_id -> id)
│       │   ├── progressService.js
│       │   └── quizService.js
│       ├── components/           # Reusable UI
│       │   ├── Navbar.jsx / Footer.jsx
│       │   ├── ProtectedRoute.jsx / AdminRoute.jsx
│       │   ├── CourseCard.jsx / CourseFilters.jsx
│       │   ├── ModuleSidebar.jsx / LessonViewer.jsx / VideoEmbed.jsx
│       │   ├── QuizQuestion.jsx
│       │   ├── ProgressBar.jsx / DashboardStatCard.jsx
│       │   ├── LoadingState.jsx / EmptyState.jsx / ErrorMessage.jsx
│       │   └── CodeQuestion.jsx  # client-only prototype (not wired to the API)
│       ├── pages/                # One file per route
│       │   ├── Home.jsx / Courses.jsx / CourseDetails.jsx
│       │   ├── Learning.jsx / Quiz.jsx / Dashboard.jsx
│       │   ├── Login.jsx / Register.jsx
│       │   ├── AdminDashboard.jsx
│       │   └── About.jsx / NotFound.jsx
│       ├── data/
│       │   └── courseOptions.js  # Static category/difficulty options
│       └── utils/
│           └── codeRunner.js     # client-only code checker (prototype)
│
└── backend/
    ├── server.js / app.js
    ├── .env.example
    ├── config/db.js
    ├── models/       # User, Course, Quiz, QuizAttempt, Progress
    ├── controllers/  # auth, course, quiz, progress
    ├── routes/       # auth, course, quiz, progress
    ├── middleware/   # auth (protect), admin (adminOnly), error
    ├── services/     # quizService, progressService (pure logic)
    ├── utils/        # validate, shuffle, generateToken, asyncHandler
    ├── seed/         # seedData.js, createAdmin.js
    └── tests/
```

---

## Routes

| URL | Page | Access |
| --- | --- | --- |
| `/` | Landing page | Public |
| `/courses` | Course catalog with search and filters | Public |
| `/courses/:courseId` | Course details + syllabus | Public |
| `/learn/:courseId/:lessonId` | Lesson player with sidebar | Signed in |
| `/quiz/:courseId/:moduleId` | Timed, server-graded quiz | Signed in |
| `/dashboard` | Student dashboard | Signed in |
| `/login` | Login | Public |
| `/register` | Registration | Public |
| `/admin` | Course / module / lesson / quiz builder | Admin |
| `/about` | About page | Public |
| `*` | 404 page | Public |

---

## API reference (summary)

Base URL: `http://localhost:5000`. All responses are JSON. Protected routes rely
on the auth cookie, so the frontend always sends requests with credentials.

| Method | URL | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | Public | Health check |
| POST | `/api/auth/register` | Public | Create a **student** account |
| POST | `/api/auth/login` | Public | Log in (sets the auth cookie) |
| POST | `/api/auth/logout` | Public | Clear the auth cookie |
| GET | `/api/auth/me` | Signed in | Current user |
| GET | `/api/courses` | Public | List published courses (`?search=&category=&difficulty=`) |
| GET | `/api/courses/admin/all` | Admin | List all courses incl. unpublished |
| GET | `/api/courses/:id` | Public | One course with modules + lessons |
| POST/PUT/DELETE | `/api/courses[/:id]` | Admin | Course CRUD |
| POST | `/api/courses/:courseId/enroll` | Student | Enrol in a course |
| GET | `/api/quizzes/course/:courseId` | Public | Quiz metadata for a course |
| GET | `/api/quizzes/module/:courseId/:moduleId` | Public | Quiz metadata for one module (no answer key) |
| GET | `/api/quizzes/:quizId` | Public | Quiz with questions but **no answer key** |
| POST | `/api/quizzes/:quizId/start` | Student | Start an attempt (server issues a deadline) |
| GET | `/api/quizzes/attempts/:attemptId` | Student | Fetch your in-progress attempt |
| PATCH | `/api/quizzes/attempts/:attemptId/answers` | Student | Autosave answers |
| POST | `/api/quizzes/attempts/:attemptId/events` | Student | Record integrity events (e.g. tab switches) |
| POST | `/api/quizzes/attempts/:attemptId/submit` | Student | Submit and receive the graded result |
| GET | `/api/quizzes/my-attempts` | Student | Your attempt history |
| GET | `/api/quizzes/:quizId/admin` | Admin | Full quiz incl. answer key |
| GET | `/api/quizzes/admin/module/:courseId/:moduleId` | Admin | Full module quiz incl. answer key (404 if none) |
| POST/PUT/DELETE | `/api/quizzes[/:quizId]` | Admin | Quiz CRUD |
| GET | `/api/progress` | Student | All your progress records |
| GET | `/api/progress/:courseId` | Student | Your progress in one course |
| PUT | `/api/progress/lessons/:lessonId/complete` | Student | Mark a lesson complete (`courseId` in body) |
| PUT | `/api/progress/lessons/:lessonId/incomplete` | Student | Mark a lesson incomplete |

---

## Authentication and roles

- Registration **always** creates a `student`. Admins can only be created with
  `npm run seed:admin`.
- The JWT is signed server-side and stored in an **HttpOnly** cookie named
  `token`. Development uses `sameSite: 'lax'`; production uses `secure` +
  `sameSite: 'none'` so the SPA and API can live on different hosts.
- `protect` verifies the token and loads the user; `adminOnly` checks
  `role === 'admin'`. Role checks are enforced on the server, not just hidden in
  the UI.

---

## Secure quiz flow (server-side grading)

Quizzes are attached to a **module** (`courseId` + `moduleId`, unique). When a
student starts a quiz:

1. The client calls `POST /api/quizzes/:quizId/start`.
2. The server creates a `QuizAttempt`, records a **deadline**, and shuffles the
   question/option order if configured.
3. The attempt payload contains questions and options **without**
   `correctOptionId` or `explanation`.
4. Answers are autosaved (`PATCH .../answers`, debounced in the UI) and tab
   switches are reported via `POST .../events`.
5. On submit (or when the timer hits zero) the server grades the answers. A
   duplicate submit returns `409`; an expired attempt is auto-graded as
   `expired`. The attempt limit is enforced.
6. Students can only read their **own** attempts; the answer key is revealed
   only when the quiz policy allows it, and never before submission.

Grading lives in `backend/services/quizService.js` and is covered by tests, so the
browser can never influence the score.

---

## Testing and builds

```powershell
# Backend unit tests (no database required)
cd LearnSphere\backend
npm test

# Frontend lint + production build
cd LearnSphere\frontend
npm run lint
npm run build
npm run preview
```

---

## Design theme

| Token | Value |
| --- | --- |
| Primary orange | `#F97316` |
| Dark orange | `#EA580C` |
| Light orange background | `#FFF7ED` |
| White | `#FFFFFF` |
| Dark text | `#1F2937` |
| Muted text | `#6B7280` |

Custom Tailwind tokens (`primary-500`, `ink`, `muted`, …) live in
`frontend/src/index.css`.

---

## Known limitations

- **Quiz questions are multiple-choice only.** The backend grades MCQs. The
  original client-side JavaScript/SQL code questions (`CodeQuestion.jsx` +
  `utils/codeRunner.js`) remain as a prototype but are **not** used by the secure
  quiz flow and are not graded by the server.
- **Some display fields are frontend fallbacks.** The backend course model has no
  `rating`, `enrolledStudents`, `duration` or `outcomes`, so the UI hides those or
  shows sensible placeholders (for example "Self-paced"). `normalizeCourse`
  aliases Mongo `_id` to `id` for convenience.
- **Anti-cheating is best-effort.** Client-side blockers (copy blocking, tab
  switch reporting) raise the bar but are not a substitute for a proctored exam.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Requests fail with a CORS error | Frontend not on `http://localhost:5173` | Run Vite on port 5173 or update `CLIENT_URL` |
| `401` on every protected call | Cookie not sent / not logged in | Ensure `withCredentials` is on and you are signed in |
| `Cannot find module 'express'` | Dependencies not installed | Run `npm install` in `backend/` (and `frontend/`) |
| Mongo connection errors | Bad `MONGODB_URI` / IP not allowed | See `backend/README.md` § 6 |
