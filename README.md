# ClassQuest

A gamified, full-stack coding platform for classrooms — students solve coding challenges to earn XP and level up, and instructors can build timed, password-protected exams that mix multiple-choice, true/false, short-answer, and coding questions. A companion desktop app proctors students during exams and flags suspicious activity.

---

## What's in here

| Area | Stack |
|---|---|
| Backend API | Node.js, Express 5, PostgreSQL (raw `pg`, no ORM) |
| Frontend | React 19, Vite, Tailwind CSS 4, React Router 7 |
| Code editor | Monaco Editor (in-browser, VS Code's editor) |
| Proctoring | Electron desktop app (Node `get-windows`) |
| Auth | JWT (`jsonwebtoken`), password hashing via `bcryptjs` |

---

## Features

### For students
- Browse and solve coding **Challenges** (JavaScript / C++, executed server-side against public and hidden test cases), earn XP, and level up
- Take **Exams**: a mix of MCQ, True/False, Short-Answer, and Coding questions
  - Exams can require a password, entered once before the timer starts
  - The countdown timer is backend-authoritative — refreshing the page or manipulating the browser clock doesn't extend your time
  - Each exam can only be attempted once per student
- Coding questions inside an exam use the exact same editor, Run, and Submit flow as standalone challenges

### For admins/instructors
- Create and publish Challenges (title, description, difficulty, starter code per language, public/hidden test cases)
- Create and publish Exams:
  - Set title, description, duration, and an optional password (hashed, never exposed via the API)
  - Add questions one at a time, in a repeatable multi-row form, or via JSON bulk import
  - Create a brand-new coding challenge inline, without leaving the exam builder
- Review results:
  - **Student Attempts** tab per exam — every student's score, status, and a full per-question breakdown (including submitted source code for coding questions)
  - **Student Submissions** dashboard — a flat feed across all coding challenges and all exam answers
  - **Test Violations** — proctoring events (window/app switches, etc.) during exam sessions, grouped by student

---

## Project structure

```
ClassQuest/
├── backend/
│   ├── src/                 # active backend (this is what actually runs)
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── config/          # db connection
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/      # auth, admin-only guard
│   │   ├── validators/
│   │   └── utils/
│   ├── routes/ controllers/ models/ server.js   # legacy Phase-1 code, not wired up — kept for reference only
│   └── .env                 # not committed; see .env.example
├── frontend/
│   └── src/
│       ├── pages/           # one file per route (student + admin)
│       ├── components/
│       ├── context/         # auth context
│       └── services/api.js  # single axios client, all API calls
├── database/
│   └── migrations/          # numbered, idempotent .sql files — run in order
├── monitor/                 # Electron proctoring app
└── package.json             # root: migrate/seed scripts
```

> **Note:** `backend/routes`, `backend/controllers`, `backend/models`, and `backend/server.js` (top-level, not under `src/`) are leftover Phase-1 files. `backend/package.json`'s `dev`/`start` scripts point at `backend/src/server.js`, so **`backend/src/` is the only backend that actually runs.**

---

## Database schema (high level)

- `users` — auth, role (`admin`/`student`), XP, level
- `challenges`, `challenge_languages`, `test_cases`, `submissions` — the coding-challenge system
- `exams`, `exam_questions`, `exam_attempts`, `exam_answers` — the exam system
  - `exam_questions.type` is one of `mcq`, `true_false`, `short_answer`, `coding`
  - a `coding`-type exam question points at an existing row in `challenges` — the editor/Run/Submit logic is fully reused, not duplicated
  - `submissions.exam_attempt_id` (nullable) links a coding submission back to the exam attempt it was answering, when relevant
- `test_sessions`, `test_violations` — proctoring; a session can belong to a standalone challenge (`challenge_id`) or a full exam (`exam_attempt_id`)

All migrations are plain, numbered `.sql` files run in order by `database/migrations/migrate.js`, and are written to be safe to re-run (`IF NOT EXISTS` throughout).

---

## Getting started

### Prerequisites
- Node.js 18+
- PostgreSQL running locally (or a connection string to a hosted instance)

### 1. Clone and configure

```bash
git clone https://github.com/eyobarega-debug/Class-Quest.git
cd Class-Quest
cp .env.example backend/.env
```

Edit `backend/.env`:

```env
PORT=5000
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/classquest
JWT_SECRET=replace_this_with_a_long_random_string
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Generate a strong `JWT_SECRET` with:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Create the database and run migrations

```bash
createdb classquest        # or create it however you normally would
cd backend
node ../database/migrations/migrate.js
```

This applies every file in `database/migrations/` in order — safe to re-run any time.

### 3. Install dependencies

```bash
# from the repo root
npm install               # root-level (migrate/seed helpers)

cd backend && npm install
cd ../frontend && npm install
cd ../monitor && npm install
```

### 4. Run it

```bash
# terminal 1 — backend (http://localhost:5000)
cd backend
npm run dev

# terminal 2 — frontend (http://localhost:5173)
cd frontend
npm run dev

# terminal 3 — proctoring monitor (optional, needed for exam proctoring)
cd monitor
npm start
```

Open **http://localhost:5173**, register an account, and get started. To try the admin side, promote a user to `admin` directly in the database:

```sql
UPDATE users SET role = 'admin' WHERE username = 'your_username';
```

### 5. (Optional) Seed sample data

```bash
node database/seed.js
```

---

## API overview

All endpoints are under `/api`, JWT-authenticated via `Authorization: Bearer <token>` unless noted.

**Auth** — `POST /auth/register`, `POST /auth/login`, `GET /auth/me`

**Challenges** — `GET /challenges`, `GET /challenges/:slug`, `POST /challenges` *(admin)*, `PATCH /challenges/:id` *(admin)*, `POST /challenges/:slug/run`, `POST /challenges/:slug/submit`

**Exams**

| Method & path | Who | What |
|---|---|---|
| `GET /exams` | any | list exams (students see published only, with their own attempt status) |
| `GET /exams/:id` | any | exam detail (admins get questions with answers; students don't) |
| `POST /exams` · `PATCH /exams/:id` · `PATCH /exams/:id/password` · `DELETE /exams/:id` | admin | exam CRUD |
| `POST /exams/:id/questions` · `.../bulk` · `PATCH .../questions/:id` · `DELETE .../questions/:id` | admin | question CRUD (single or bulk) |
| `POST /exams/:id/verify-password` | student | check password without starting the timer |
| `POST /exams/:id/start` | student | verify password (if any) + start/resume the attempt |
| `GET /exams/attempts/:attemptId` | student | poll remaining time / status |
| `POST /exams/attempts/:attemptId/answers` | student | submit an MCQ/True-False/Short-Answer answer |
| `POST /exams/attempts/:attemptId/finish` | student | submit the whole exam |
| `GET /exams/:id/attempts` · `GET /exams/attempts/:attemptId/admin` | admin | review student attempts + per-question breakdown |
| `GET /exams/answers` | admin | flat feed of every exam answer, across all exams |

**Violations (proctoring)** — `POST /violations/sessions/start`, `POST /violations/report`, `POST /violations/sessions/finish`, `GET /violations` *(admin)*, `GET /violations/session/:sessionId` *(admin)*

---

## Security notes

- Exam passwords are hashed with `bcrypt` and never returned by any endpoint — only a `hasPassword` boolean is exposed.
- The exam timer is enforced server-side: remaining time is always computed from `started_at` + `duration_minutes` against the server clock, and every attempt-touching endpoint re-checks expiry before accepting further answers.
- Each student may attempt a given exam exactly once — a second `start` request after submission/expiry is rejected.
- Coding submissions made during an exam are re-validated server-side (attempt ownership, not expired) before being scored.

---

## Known limitations

- The code-execution engine currently runs **JavaScript** and **C++** only. Python is selectable in the challenge-creation UI but submissions in it will return `unsupported_language` until execution support is added.
- Coding challenges must be **Published** to appear in the exam question-builder's dropdown — a draft challenge won't show up there.
- There is no password-reset flow yet; admin role changes are done directly in the database.

---

## License

ISC (see `package.json`).
