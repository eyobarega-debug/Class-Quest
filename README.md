# ClassQuest — Phase 1

> Code. Compete. Level Up.

A private, gamified coding-practice platform for a class of ~30-50 students.
This is **Phase 1 only**: authentication, roles, the student/admin dashboards,
and the profile page. Challenges, code execution, XP-earning, battles, and
tournaments are Phase 2 onward — see [Roadmap](#roadmap) below.

Everything in this package has been built and tested end-to-end: the
database migration ran, the API was hit with real requests (login, wrong
password, role-blocked routes, student creation), and the frontend was
built and served successfully.

---

## 1. Architecture

```
┌─────────────────┐        HTTPS/JSON        ┌──────────────────┐        SQL        ┌──────────────┐
│  React (Vite)    │ ───────────────────────▶ │  Express REST API │ ─────────────────▶ │  PostgreSQL   │
│  frontend/        │ ◀─────────────────────── │  backend/          │ ◀───────────────── │  database/    │
└─────────────────┘        JSON responses      └──────────────────┘        rows        └──────────────┘
        │                                              │
        │ stores JWT in localStorage                   │ verifies JWT (jsonwebtoken)
        │ sends it as                                   │ hashes/checks passwords (bcryptjs)
        │ "Authorization: Bearer <token>"                │ role check middleware (admin vs student)
```

- **Frontend**: React 18 + Vite + React Router + Tailwind CSS v4. Talks to the
  API only through `src/services/api.js` (an axios instance).
- **Backend**: Node.js + Express. Organized as
  `routes → middleware → controllers → models → PostgreSQL`.
- **Database**: PostgreSQL. Raw SQL via the `pg` driver (no ORM) — for a
  Phase-1 schema this small, plain parameterized SQL is easier to read and
  debug than adding a full ORM.
- **Auth**: JWT (stateless — the server doesn't store sessions) + bcrypt
  password hashing. No public registration; only an admin can create student
  accounts.

### Request/response flow example — logging in

```
Student types email + password, clicks "Log In"
        ↓
React (Login.jsx) calls api.post('/auth/login', { identifier, password })
        ↓
Express receives POST /api/auth/login (authRoutes.js)
        ↓
Rate limiter checks: not too many attempts from this IP
        ↓
authController.login() looks up the user by email/username (userModel.js)
        ↓
bcrypt.compare() checks the password against the stored hash
        ↓
If correct: jsonwebtoken signs a token containing { id, role, username }
        ↓
Express sends back { token, user } as JSON
        ↓
React saves the token in localStorage and the user in AuthContext
        ↓
React redirects to /dashboard (student) or /admin (admin)
        ↓
Every future request (e.g. "load my students") automatically attaches
"Authorization: Bearer <token>" via an axios interceptor
        ↓
Express's requireAuth middleware verifies the token on each protected route
```

---

## 2. Folder structure

```
ClassQuest/
├── frontend/                    React app (Vite)
│   └── src/
│       ├── components/
│       │   ├── layout/          Sidebar, Topbar, AppLayout (shell + mobile nav)
│       │   ├── ui/               XPBar, LevelBadge, StatCard (reusable pieces)
│       │   └── ProtectedRoute.jsx
│       ├── context/AuthContext.jsx   Holds the logged-in user + token
│       ├── services/api.js           axios instance, auto-attaches JWT
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── StudentDashboard.jsx
│       │   ├── Profile.jsx
│       │   ├── AdminDashboard.jsx
│       │   ├── AdminStudents.jsx     create/list/disable students
│       │   └── NotFound.jsx
│       ├── App.jsx                   all routes
│       └── main.jsx                  entry point
│
├── backend/                     Express API
│   ├── config/db.js              PostgreSQL connection pool
│   ├── controllers/              authController.js, userController.js
│   ├── middleware/authMiddleware.js  requireAuth, requireAdmin
│   ├── models/userModel.js       every SQL query for "users" lives here
│   ├── routes/                   authRoutes.js, userRoutes.js
│   ├── utils/                    levelSystem.js, asyncHandler.js
│   ├── validators/authValidators.js
│   ├── database/runMigrations.js
│   └── server.js                 wires it all together
│
├── database/
│   ├── migrations/001_create_users.sql
│   └── seed/seed.js               creates 1 admin + 3 demo students
│
├── .env.example
└── README.md   (this file)
```

---

## 3. Database design (Phase 1)

Only one table exists yet, on purpose — see the "don't overengineer" rule
in the brief. Everything else (`challenges`, `submissions`, `battles`,
`achievements`, etc.) gets added table-by-table as each phase needs it.

```sql
users
├── id              SERIAL PRIMARY KEY
├── name            VARCHAR(100)
├── email           VARCHAR(150) UNIQUE
├── username        VARCHAR(50)  UNIQUE
├── password_hash   VARCHAR(255)          -- bcrypt hash, never plain text
├── role            ENUM('admin','student')
├── avatar_url      TEXT
├── xp              INTEGER DEFAULT 0
├── level           INTEGER DEFAULT 1     -- derived by utils/levelSystem.js
├── rating          INTEGER DEFAULT 1000  -- ELO-style, used from Phase 5
├── streak          INTEGER DEFAULT 0
├── is_active       BOOLEAN DEFAULT true  -- admin can disable an account
├── created_at      TIMESTAMPTZ
└── updated_at      TIMESTAMPTZ           -- auto-updated by a trigger
```

Indexes: `role` (fast "list all students"), `xp DESC` (fast leaderboard
later).

---

## 4. Dependencies

**Backend** (`backend/package.json`): `express`, `pg`, `bcryptjs`,
`jsonwebtoken`, `cors`, `dotenv`, `morgan`, `express-rate-limit`.

**Frontend** (`frontend/package.json`): `react`, `react-router-dom`,
`axios`, `lucide-react`, `tailwindcss` v4 + `@tailwindcss/vite`.

No code editor library (Monaco) or execution sandbox (Judge0) yet — those
belong to Phase 2/3.

---

## 5. Running it yourself

### Prerequisites
- Node.js 18+
- PostgreSQL running locally (or a connection string to one)

### Setup

```bash
# 1. Database
createdb classquest
cp .env.example backend/.env
# edit backend/.env — set DATABASE_URL and a real JWT_SECRET

# 2. Backend
cd backend
npm install
npm run migrate     # creates the users table
npm run seed        # creates 1 admin + 3 demo students
npm run dev          # http://localhost:5000

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev          # http://localhost:5173
```

### Demo accounts (from `npm run seed`)

| Role    | Username | Password        |
|---------|----------|------------------|
| Admin   | `admin`  | `AdminPass123`   |
| Student | `eyob`   | `StudentPass123` |
| Student | `abel`   | `StudentPass123` |
| Student | `hana`   | `StudentPass123` |

Change these passwords (or delete the seed data) before using this with
real classmates.

---

## 6. What was tested

- Migration runs cleanly and is safe to re-run.
- Login: correct password succeeds, wrong password is rejected with a
  generic "invalid credentials" message (doesn't reveal which field was
  wrong), disabled accounts are blocked.
- `GET /api/auth/me` restores a session from a saved token.
- A student token hitting an admin-only route (`GET /api/users`) correctly
  gets `403`.
- Admin can list students, create a new student, and gets `409` on a
  duplicate email.
- Frontend builds cleanly with `npm run build` and the production bundle
  was served and loaded successfully.

---

## 7. Roadmap

- **Phase 2** — Challenges table, Coding Arena page, Monaco editor,
  language selection.
- **Phase 3** — Code execution (Judge0 or similar sandbox), Run vs Submit,
  test cases, submission results.
- **Phase 4** — XP awarding, level-up celebration, leaderboard,
  achievements, streaks.
- **Phase 5** — Daily challenge, head-to-head battles, ELO rating,
  weekly tournaments.
- **Phase 6** — HTML/CSS challenges, richer admin challenge creation,
  statistics, notifications, animation polish.

The sidebar in the app already shows where these will live (locked with a
"Soon" tag) so the navigation shape doesn't need to be rebuilt each phase.

---

## 8. Security notes (Phase 1)

- Passwords hashed with bcrypt (10 salt rounds), never stored or logged
  in plain text.
- JWT signed with a secret from `.env`, never committed to git.
- All SQL is parameterized (`$1, $2, ...`) — no string concatenation, so
  no SQL injection surface.
- `requireAdmin` middleware enforces role checks **server-side** — the
  frontend hiding admin buttons is a UX nicety, not the real security
  boundary.
- Login is rate-limited (10 attempts / 15 min / IP).
- Hidden test cases, DB credentials, and JWT secret are never sent to the
  frontend (not applicable yet in Phase 1, but the `.env` pattern is
  already in place for when Phase 2/3 add them).
