# LearnSphere Backend (Express + MongoDB API)

This is the REST API for LearnSphere. It is written in plain JavaScript with
Express and Mongoose, and stores data in a MongoDB Atlas database.

It handles:

- Authentication with JWT stored in an **HttpOnly cookie**
- Courses, modules and lessons (admins create/edit/delete)
- Module quizzes with **server-side grading** (correct answers never reach the browser)
- Attempt-based quiz flow (deadline, autosave, duplicate-submit protection)
- Student enrolment, lesson completion and quiz attempt history

> The frontend in `../frontend` is connected to this API. It talks to it only
> over HTTP (Axios with credentials); no backend code is imported into React.

---

## 1. Folder structure (what every file does)

```
backend/
├── server.js                # Starts the app: loads .env, connects to MongoDB, listens
├── app.js                   # Builds the Express app (middleware + routes). No DB here.
├── package.json             # Dependencies and npm scripts
├── .env.example             # Template for your secret .env file (safe to commit)
│
├── config/
│   └── db.js                # Connects Mongoose to MongoDB Atlas
│
├── models/                  # Mongoose schemas = the MongoDB collections
│   ├── User.js              # users: students and admins (hashed passwords)
│   ├── Course.js            # courses: embedded modules and lessons
│   ├── Quiz.js              # module quizzes: questions, options and the answer key
│   ├── QuizAttempt.js       # one doc per quiz attempt (deadline, answers, score)
│   └── Progress.js          # progress: one doc per student per course
│
├── controllers/             # The actual logic for each route
│   ├── authController.js    # register, login, logout, me
│   ├── courseController.js  # list, read, create, update, delete, enroll
│   ├── quizController.js    # attempts (start/save/submit) + admin quiz CRUD
│   └── progressController.js# get progress, mark lesson complete/incomplete
│
├── routes/                  # Map URLs to controllers
│   ├── authRoutes.js
│   ├── courseRoutes.js
│   ├── quizRoutes.js
│   └── progressRoutes.js
│
├── middleware/              # Code that runs between request and controller
│   ├── authMiddleware.js    # "protect": verifies the JWT and loads the user
│   ├── adminMiddleware.js   # "adminOnly": allows only role === 'admin'
│   └── errorMiddleware.js   # 404 handler + central error → JSON
│
├── services/                # Pure, testable business logic
│   ├── quizService.js       # shuffle, build attempt state, grade an attempt
│   └── progressService.js   # completion + progress calculations
│
├── utils/                   # Small reusable helpers
│   ├── asyncHandler.js      # Sends async errors to the error middleware
│   ├── generateToken.js     # Signs the JWT and sets/clears the cookie
│   ├── shuffle.js           # Fisher–Yates shuffle
│   └── validate.js          # ObjectId / string / YouTube URL validation
│
├── seed/                    # One-time scripts to fill the database
│   ├── seedData.js          # Inserts sample courses + module quizzes
│   ├── createAdmin.js       # Creates/updates an admin account
│   └── dbHelpers.js         # shared close-connection helper
│
└── tests/                   # Tests run with the built-in `node --test`
    ├── app.test.js
    ├── quizService.test.js
    └── validate.test.js
```

---

## 2. Database collections (the data model)

| Collection | Fields | Notes |
| --- | --- | --- |
| **users** | `name`, `email` (unique), `password` (hashed), `role` (`student`/`admin`), `createdAt`, `updatedAt` | Password is hashed with bcryptjs and never returned by the API. |
| **courses** | `title`, `description`, `category`, `instructor`, `difficulty`, `thumbnail`, `published`, `modules[]` | Each module has `title`, `description`, `lessons[]`. Each lesson has `title`, `type` (`video`/`text`), `content`, `videoUrl`, `resources[]`, `duration`, `order`. |
| **quizzes** | `courseId` (ref Course), `moduleId`, `title`, `timeLimit`, `passingPercentage`, `shuffle`, `questions[]` | A quiz belongs to one **module** (`courseId` + `moduleId`, unique). Each question has `questionText`, `options[]` (`id`, `label`), `correctOptionId`, `marks`, `explanation`. |
| **quizattempts** | `userId` (ref User), `quizId` (ref Quiz), `courseId`, `moduleId`, `status` (`in-progress`/`submitted`/`expired`), `deadline`, `answers[]`, `events[]`, `score`, `totalMarks`, `percentage`, `passed`, `submittedAt` | One document per attempt. Enforces the deadline, autosave and duplicate-submit rules. The answer key is never stored in the client-facing payload. |
| **progress** | `userId` (ref User), `courseId` (ref Course), `completedLessons[]`, `lastAccessedLesson`, `createdAt`, `updatedAt` | One document per student per course (unique index). |

---

## 3. API reference

Base URL in development: `http://localhost:5000`

| Method | URL | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | Public | Confirms the API is running |
| POST | `/api/auth/register` | Public | Create a **student** account |
| POST | `/api/auth/login` | Public | Log in and receive the auth cookie |
| POST | `/api/auth/logout` | Public | Clear the auth cookie |
| GET | `/api/auth/me` | Student | Get the logged-in user |
| GET | `/api/courses` | Public | List published courses (`?search=&category=&difficulty=`) |
| GET | `/api/courses/admin/all` | Admin | List all courses incl. unpublished |
| GET | `/api/courses/:id` | Public | Get one course with modules and lessons |
| POST | `/api/courses` | Admin | Create a course |
| PUT | `/api/courses/:id` | Admin | Update a course |
| DELETE | `/api/courses/:id` | Admin | Delete a course |
| POST | `/api/courses/:courseId/enroll` | Student | Enrol in a course |
| GET | `/api/quizzes/course/:courseId` | Public | List quiz metadata for a course (no questions) |
| GET | `/api/quizzes/module/:courseId/:moduleId` | Public | Quiz metadata for one module (no answer key) |
| GET | `/api/quizzes/:quizId` | Public | Get a quiz with questions but **no answer key** |
| POST | `/api/quizzes/:quizId/start` | Student | Start an attempt (server issues a deadline) |
| GET | `/api/quizzes/attempts/:attemptId` | Student | Fetch your in-progress attempt |
| PATCH | `/api/quizzes/attempts/:attemptId/answers` | Student | Autosave answers |
| POST | `/api/quizzes/attempts/:attemptId/events` | Student | Record integrity events (e.g. tab switches) |
| POST | `/api/quizzes/attempts/:attemptId/submit` | Student | Submit, get the graded result (409 on re-submit) |
| GET | `/api/quizzes/my-attempts` | Student | Get your attempt history |
| GET | `/api/quizzes/:quizId/admin` | Admin | Full quiz incl. answer key |
| GET | `/api/quizzes/admin/module/:courseId/:moduleId` | Admin | Full module quiz incl. answer key (404 if none) |
| POST | `/api/quizzes` | Admin | Create a module quiz |
| PUT | `/api/quizzes/:quizId` | Admin | Update a quiz |
| DELETE | `/api/quizzes/:quizId` | Admin | Delete a quiz |
| GET | `/api/progress` | Student | Get all your progress records |
| GET | `/api/progress/:courseId` | Student | Get your progress in a course |
| PUT | `/api/progress/lessons/:lessonId/complete` | Student | Mark a lesson complete (send `courseId` in body) |
| PUT | `/api/progress/lessons/:lessonId/incomplete` | Student | Mark a lesson incomplete |

### Example: how React talks to Express talks to Mongoose talks to MongoDB

```js
// 1. React (browser) starts an attempt, then submits answers.
//    The cookie is included automatically because the frontend sets withCredentials.
const { attempt } = await axios.post(
  `http://localhost:5000/api/quizzes/${quizId}/start`,
  {},
  { withCredentials: true },
)
await axios.post(
  `http://localhost:5000/api/quizzes/attempts/${attempt.id}/submit`,
  { answers: { "questionId1": "b", "questionId2": "a" } },
  { withCredentials: true },
)
```

```js
// 2. Express route -> controller (backend/routes/quizRoutes.js -> quizController.js)
router.post('/:quizId/start', protect, startAttempt)
router.post('/attempts/:attemptId/submit', protect, submitAttempt)
```

```js
// 3. The controller loads the quiz, grades on the server and stores the attempt.
const quiz = await Quiz.findById(quizId)                  // Mongoose query
const result = gradeAttempt(quiz, attempt, answers)       // server-side scoring
await attempt.save()                                      // write to MongoDB
```

```text
4. Mongoose translates that into a MongoDB call:
   findById       -> db.quizzes.findOne({ _id: ObjectId("...") })
   attempt.save() -> db.quizattempts.updateOne({ _id: ... }, { $set: { ... } })
   MongoDB Atlas stores the document and returns the result.
```

---

## 4. Step-by-step: create a free MongoDB Atlas database

1. Go to <https://www.mongodb.com/cloud/atlas/register> and create a free account.
2. Click **Build a Database** and choose the **M0 Free** tier. Pick any cloud
   provider and a region close to you, then click **Create**.
3. **Create a database user.** In the security prompt, set a username (for
   example `learnsphere`) and a strong password. Write these down — you need
   them in the connection string. Click **Create User**.
4. **Allow your IP address.** Add your current IP (`Add My Current IP Address`),
   or click **Allow Access from Anywhere** (`0.0.0.0/0`) for a student project.
   Click **Finish and Close**.
5. Wait until the cluster shows **Connected**, then click **Connect**.
6. Choose **Drivers** (the "Connect your application" option).
7. Copy the connection string. It looks like this:

   ```
   mongodb+srv://learnsphere:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
   ```

8. Replace `<password>` with your real database user password, and add a
   database name (`learnsphere`) before the `?`. The final string should look
   like:

   ```
   mongodb+srv://learnsphere:YourRealPassword@cluster0.abcde.mongodb.net/learnsphere?retryWrites=true&w=majority
   ```

9. If your password contains special characters such as `@`, `#` or `/`, they
   must be URL-encoded (for example `@` becomes `%40`).

---

## 5. Configure and run the backend

### 5.1 Create the `.env` file

Copy `.env.example` to `.env` inside the `backend/` folder and fill it in:

```env
PORT=5000
MONGODB_URI=mongodb+srv://learnsphere:YourRealPassword@cluster0.abcde.mongodb.net/learnsphere?retryWrites=true&w=majority
JWT_SECRET=replace-this-with-a-long-random-string
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Generate a strong `JWT_SECRET` with:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 5.2 PowerShell commands (Windows)

```powershell
# From the project root
cd C:\Users\<you>\Desktop\MSD_Project\LearnSphere\backend

# Copy the environment template and edit it
Copy-Item .env.example .env
notepad .env        # paste your real MONGODB_URI and JWT_SECRET, then save

# Install dependencies
npm install

# Run the automated tests (no database needed)
npm test

# Seed sample courses and quizzes (needs a working MONGODB_URI)
npm run seed

# Create your first admin account
npm run seed:admin -- "Admin Name" admin@example.com secret123

# Start the API (normal)
npm start

# Start the API with auto-restart on file changes
npm run dev
```

When it works you will see:

```
MongoDB connected successfully: cluster0-shard-00-00.abcde.mongodb.net
LearnSphere API listening on http://localhost:5000
```

Test it in the browser or PowerShell:

```powershell
Invoke-RestMethod http://localhost:5000/api/health
```

---

## 6. Common MongoDB connection errors and fixes

| Error message | Meaning | Fix |
| --- | --- | --- |
| `MONGODB_URI is not set` | No `.env` or blank value | Create `backend/.env` and set `MONGODB_URI` |
| `bad auth : Authentication failed` | Wrong username or password | Fix the user/password in the string; URL-encode special characters |
| `IP ... is not whitelisted` / `Could not connect to any servers` | Your IP is not allowed | Add your IP (or `0.0.0.0/0`) in Atlas **Network Access** |
| `querySrv ENOTFOUND _mongodb._tcp...` | Bad hostname or no internet/DNS | Recopy the connection string from Atlas; check your network |
| `TLS / SSL handshake failed` | Corporate firewall or proxy | Try another network, or allow Atlas in the firewall |
| `E11000 duplicate key error` | Same email registered twice | Use a different email or log in instead |
| `Cannot find module 'express'` | Dependencies not installed | Run `npm install` inside `backend/` |

> **Security note:** never commit `.env`. It is already listed in `.gitignore`.

---

## 7. Security choices (and why they matter)

- **Passwords are hashed** with bcryptjs and stored with `select: false`, so they
  never leave the database, even by accident.
- **JWTs live in HttpOnly cookies**, so page scripts cannot read the token. In
  production the cookie is `secure` + `sameSite: 'none'`; in development it is
  `sameSite: 'lax'` so it works over `http://localhost`.
- **Grading happens on the server.** The quiz sent to the browser contains no
  `correctOptionId` and no `explanation`. A student cannot change their score by
  editing the page.
- **Roles are enforced**, not just hidden in the UI. `protect` checks the token
  and `adminOnly` checks `role === 'admin'` before any admin action runs.
- **Admins are never created through registration.** Only `npm run seed:admin`
  can create one, so anyone cannot sign up as an administrator.

---

## 8. Frontend integration (done)

The React app in `../frontend` is wired to this API:

1. `frontend/src/services/*` holds the Axios instance (`withCredentials: true`)
   and one module per resource (auth, courses, progress, quizzes).
2. Mock data files were removed; pages now load from the endpoints above.
3. Login/register call `POST /api/auth/login` and `POST /api/auth/register`, and
   `AuthContext` restores the session via `GET /api/auth/me`.
4. Module quizzes map to a `Quiz` document identified by `courseId` + `moduleId`.
   Students start an attempt, autosave answers, and the server grades on submit.

To run both together, start the backend (`npm start`) and the frontend
(`npm run dev`) and make sure `CLIENT_URL` matches the Vite origin
(`http://localhost:5173` by default).
