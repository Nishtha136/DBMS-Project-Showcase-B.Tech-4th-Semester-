# StudyLabs Mentor CRM

A Next.js 14 (App Router) + TypeScript dashboard for mentors to track and
manage their mentees. It talks to the **same Express backend** the Android
app uses, on a new `/api/mentor/*` API surface.

```
backend/   ← shared Express + MySQL (Aiven) server
mentor-crm/ ← this app (Next.js, runs on port 3001)
db/        ← schema + upgrade scripts (run once on the MySQL instance)
```

---

## 1 · One-time database setup

Apply the schema additions on your MySQL instance (Aiven). These are
idempotent — re-running is safe.

```bash
# from repo root
mysql -h <host> -P <port> -u <user> -p --ssl-mode=REQUIRED studylab-dbms < db/upgrades.sql
mysql -h <host> -P <port> -u <user> -p --ssl-mode=REQUIRED studylab-dbms < db/mentor_crm.sql
# (optional but recommended for the viva demo)
mysql -h <host> -P <port> -u <user> -p --ssl-mode=REQUIRED studylab-dbms < db/mentor_seed.sql
```

`db/mentor_crm.sql` adds the `mentor_tasks` table, the
`trg_mentor_tasks_after_insert` trigger, and the `vw_mentor_roster` view.

`db/mentor_seed.sql` is **idempotent** demo data: 3 mentor accounts, 6
student accounts with mentor_assignments, ~120 dailyentries spanning the
last 21 days, ~360 scores, 8 mentor_tasks, 8 notifications, and ~40
backdated activity_log rows so every CRM page has real data on first
boot. Re-running wipes any prior `@example.com` data and re-inserts.

#### Demo logins after seeding

| Role     | Email                       | Password      | Notes                       |
|----------|-----------------------------|---------------|-----------------------------|
| Mentor   | `aarav.mentor@example.com`  | `Mentor123!`  | 3 mentees                   |
| Mentor   | `mira.mentor@example.com`   | `Mentor123!`  | 3 mentees                   |
| Mentor   | `devraj.mentor@example.com` | `Mentor123!`  | 0 mentees (empty-state)     |
| Student  | `priya.s@example.com`       | `Student123!` | high engagement, daily logs |
| Student  | `rohan.j@example.com`       | `Student123!` | medium                      |
| Student  | `neha.k@example.com`        | `Student123!` | low (inactive 14d)          |
| Student  | `arjun.m@example.com`       | `Student123!` | high engagement             |
| Student  | `tara.p@example.com`        | `Student123!` | medium                      |
| Student  | `karan.v@example.com`       | `Student123!` | none (inactive 35d)         |

### Seed your own mentor account (without the demo seed)

The `accounts.role` column was added by `db/upgrades.sql` and defaults to
`'student'`. Promote an existing email **or** create a fresh mentor with
a known password — paste the bcrypt hash from your favourite generator
(or run `node -e "console.log(require('bcryptjs').hashSync('Mentor123!', 12))"`):

```sql
-- Option A: promote an existing student to mentor
UPDATE accounts SET role = 'mentor' WHERE email = 'priyanshs042005@gmail.com';

-- Option B: create a fresh mentor
INSERT INTO accounts (id, name, email, password_hash, role, is_active)
VALUES (
  UUID(),
  'Aarav Mentor',
  'aarav.mentor@example.com',
  '$2a$12$REPLACE_WITH_REAL_BCRYPT_HASH_FOR_Mentor123!',
  'mentor',
  1
);
```

### Assign existing students to that mentor

```sql
INSERT INTO mentor_assignments (id, mentor_account_id, student_account_id)
SELECT UUID(), m.id, s.id
  FROM accounts m
  JOIN accounts s ON s.role = 'student'
 WHERE m.email = 'aarav.mentor@example.com'
   AND s.email IN ('student1@example.com', 'student2@example.com', 'student3@example.com');
```

`mentor_assignments` has a UNIQUE constraint on `student_account_id` —
each student can have at most one mentor.

---

## 2 · Run the backend

The mentor CRM uses the existing Express server on port 3000. From the
repo root:

```bash
cd backend
npm install
npm run dev   # nodemon, hot reload
# — or —
npm start     # plain node
```

The new `/api/mentor/*` routes are mounted automatically by `server.js`
behind the `verifyMentor` middleware (JWT + `role = 'mentor'` check).

---

## 3 · Run the Mentor CRM

```bash
cd mentor-crm
npm install                      # first time only
cp .env.local.example .env.local # then edit if backend isn't on localhost:3000
npm run dev                      # http://localhost:3001
```

`.env.local` keys:

| Key                   | Default                          | Description                                  |
|-----------------------|----------------------------------|----------------------------------------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000/api`      | Origin of the existing Express backend.      |

---

## 4 · Page map

All URLs after sign-in require `accounts.role = 'mentor'`. Sign-in itself
re-uses the existing `POST /api/auth/login` endpoint and then probes
`GET /api/mentor/overview` to confirm the role.

| URL                            | Description                                                         |
|--------------------------------|---------------------------------------------------------------------|
| `/login`                       | Sign in (mentor accounts only).                                     |
| `/mentor`                      | Overview — 4 stat cards, recent activity, quick actions.            |
| `/mentor/mentees`              | Searchable / sortable / filterable table; bulk-assign tasks.        |
| `/mentor/mentees/[id]`         | One mentee — Overview / Habits / Activity / Subjects / Tasks tabs. |
| `/mentor/analytics`            | Stacked weekly activity chart + ranked leaderboard.                 |
| `/mentor/activity`             | Full paginated audit feed for all mentees (infinite scroll).        |

---

## 5 · Backend routes added (`/api/mentor/*`)

All require `Authorization: Bearer <token>` from a mentor account.

| Method | Path                                 | Body / params                                                      |
|--------|--------------------------------------|--------------------------------------------------------------------|
| GET    | `/mentor/overview`                   | —                                                                  |
| GET    | `/mentor/mentees`                    | `?search&sort&order&filter_status&page&limit`                      |
| POST   | `/mentor/mentees`                    | `{ full_name, email, temp_password? }`                             |
| GET    | `/mentor/mentees/:id`                | —                                                                  |
| POST   | `/mentor/tasks/bulk`                 | `{ student_ids[], title, description?, due_date?, priority? }`     |
| PATCH  | `/mentor/tasks/:id`                  | `{ title?, description?, due_date?, priority?, status? }`          |
| GET    | `/mentor/activity-feed`              | `?page&limit&action_type`                                          |
| GET    | `/mentor/leaderboard`                | `?metric=habit_logs|subjects|storage`                              |
| GET    | `/mentor/analytics/activity`         | `?weeks=4` (max 26)                                                |

Sort keys for `/mentor/mentees`: `name`, `habit_logs` / `daily_entries`,
`subjects`, `last_active`. The columns are mapped through a server-side
allowlist — raw input is never interpolated into SQL.

---

## 6 · Smoke-test the API with curl

```bash
# 1. Get a mentor token via the existing login endpoint.
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"aarav.mentor@example.com","password":"Mentor123!"}' \
  | jq -r .token)

# 2. Hit the mentor endpoints.
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/mentor/overview | jq
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/mentor/mentees?limit=5" | jq
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/mentor/leaderboard?metric=habit_logs" | jq
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/mentor/analytics/activity?weeks=4" | jq
```

A 403 from any of these means the account is not actually `role='mentor'`.
A 401 means the token is missing or expired.

---

## 7 · Architecture notes

- **Single source of truth.** The CRM does not have its own database — it
  writes through the same Express backend as the Android app.
- **Schema reality.** The CRM queries adapt to the real MySQL columns:
  `accounts.name` (not `full_name`), `mentor_assignments.{mentor,student}_account_id`,
  `subjects.firebase_uid` (used as `account_id`), `dailyentries.entry_date` /
  `entry_id`, `activity_log.account_id` / `log_id`. Habit-domain joins go
  through `users.email = accounts.email` because the legacy `users` table
  has an INT PK while `accounts` is UUID.
- **Transactions.** Every multi-write mentor route (registration,
  bulk-task, task-update, mentee-create) is wrapped in
  `withTransaction()` from `backend/transaction.js`. The only "write +
  audit" trigger that is invisible to the route is
  `trg_mentor_tasks_after_insert`, which fans out a notification and
  audit row whenever a task is bulk-inserted.
- **Auth.** JWT is stored in `localStorage`; an axios interceptor adds
  the `Authorization` header and redirects to `/login` on any 401. The
  mentor middleware does a fresh `accounts.role` lookup on every request
  rather than trusting a JWT claim, so demoting a mentor takes effect on
  the next request.
- **No Android route was modified.** The CRM lives entirely under
  `/api/mentor/*` and a new `mentor-crm/` directory.

---

## 8 · Troubleshooting

| Symptom                                                  | Likely cause                                                        |
|----------------------------------------------------------|---------------------------------------------------------------------|
| Login succeeds but you bounce back to `/login`           | Account is not `role = 'mentor'`. Promote it (see step 1).          |
| Mentees list is empty after login                        | No `mentor_assignments` rows for this mentor. Insert some.          |
| `/mentor/analytics/activity` returns `[]`                | Mentees haven't generated any `activity_log` rows yet.              |
| `db/upgrades.sql` errors on `ADD COLUMN`                 | MySQL < 8.0.29. The `sp_add_column` helper avoids this — re-run.    |
| 500 from `POST /api/mentor/tasks/bulk` with `Some student_ids are not your mentees` | The mentor isn't actually assigned to those students.          |
