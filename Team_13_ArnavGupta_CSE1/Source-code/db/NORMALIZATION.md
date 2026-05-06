# StudyLabs DBMS — Normalization Analysis

This document explains how the StudyLabs MySQL schema (in `backend/schema.sql`
plus the additions in `db/upgrades.sql`) satisfies the first three normal
forms.

## Table inventory

| Table                | Purpose                                             | Primary Key                    |
|----------------------|-----------------------------------------------------|--------------------------------|
| `accounts`           | App-managed user accounts (used by login/register)  | `id` (UUID, VARCHAR(36))       |
| `users`              | Legacy Firebase-linked profile                      | `user_id` (INT auto-inc)       |
| `subjects`           | A user's vault subject (Math, Physics, …)           | `id` (UUID, VARCHAR(36))       |
| `vault_files`        | A file or note under a subject                      | `id` (UUID, VARCHAR(36))       |
| `vault_links`        | A URL bookmarked under a subject                    | `id` (UUID, VARCHAR(36))       |
| `habits`             | A behaviour-tracking habit owned by a user          | `habit_id` (INT auto-inc)      |
| `questions`          | A scoring question attached to a habit              | `question_id` (INT auto-inc)   |
| `dailyentries`       | One per (user, habit, day) check-in                 | `entry_id` (INT auto-inc)      |
| `scores`             | Score answer to one question on one daily entry     | `score_id` (INT auto-inc)      |
| `habitanalysis`      | Aggregated stats for a habit                        | `analysis_id` (INT auto-inc)   |
| `analysisvisuals`    | Charts attached to a habit analysis                 | `visual_id` (INT auto-inc)     |
| `notifications`      | Per-account inbox messages                          | `id` (UUID, VARCHAR(36))       |
| `activity_log`       | Append-only audit trail                             | `log_id` (BIGINT auto-inc)     |
| `tags`               | Reusable label catalogue                            | `tag_id` (INT auto-inc)        |
| `habit_tags`         | M:N bridge between habits and tags                  | `(habit_id, tag_id)` composite |
| `mentor_assignments` | M:N self-bridge on accounts (mentor ↔ student)      | `id` (UUID, VARCHAR(36))       |

## Key inventory

| Table                 | Primary Key            | Foreign Keys                                                  | Candidate Keys                              |
|-----------------------|------------------------|---------------------------------------------------------------|---------------------------------------------|
| `accounts`            | `id`                   | —                                                             | `email` (UNIQUE)                            |
| `users`               | `user_id`              | —                                                             | `firebase_uid` (UNIQUE), `email`            |
| `subjects`            | `id`                   | `firebase_uid` → owner account (loose ref)                    | —                                           |
| `vault_files`         | `id`                   | `subject_id` → `subjects.id`                                  | —                                           |
| `vault_links`         | `id`                   | `subject_id` → `subjects.id`                                  | —                                           |
| `habits`              | `habit_id`             | `user_id` → `users.user_id`                                   | —                                           |
| `questions`           | `question_id`          | `habit_id` → `habits.habit_id`                                | `(habit_id, question_order)` (logical)      |
| `dailyentries`        | `entry_id`             | `habit_id`, `user_id`                                         | `(habit_id, user_id, entry_date)` (logical) |
| `scores`              | `score_id`             | `entry_id`, `question_id`                                     | `(entry_id, question_id)` (logical)         |
| `habitanalysis`       | `analysis_id`          | `habit_id`                                                    | —                                           |
| `analysisvisuals`     | `visual_id`            | `analysis_id`                                                 | —                                           |
| `notifications`       | `id`                   | `account_id` → `accounts.id`                                  | —                                           |
| `activity_log`        | `log_id`               | `account_id` → `accounts.id` (ON DELETE SET NULL)             | —                                           |
| `tags`                | `tag_id`               | —                                                             | `name` (UNIQUE)                             |
| `habit_tags`          | `(habit_id, tag_id)`   | `habit_id`, `tag_id`                                          | composite PK *is* the only candidate        |
| `mentor_assignments`  | `id`                   | `mentor_account_id`, `student_account_id` → `accounts.id`     | `student_account_id` (UNIQUE)               |

## 1NF — First Normal Form

> Every column holds one atomic value; there are no repeating groups or
> arrays masquerading as columns; every row is uniquely identifiable by its
> primary key.

- All scalar columns (`name`, `email`, `score`, `entry_date`, …) are
  atomic — never comma-separated lists or JSON-encoded arrays of business
  data.
- The `metadata JSON` columns on `activity_log` and `analysisvisuals.chart_data`
  are deliberately schemaless extension points used for audit / chart payloads,
  not relational data — they never hold queryable business attributes that
  would belong in their own normalised columns.
- A repeating group like *"a habit's questions"* is moved into its own
  table `questions`, one row per question, joined by `habit_id`.
  Same pattern for *"a daily entry's answers"* → `scores`.
- Every table has a single-column or composite primary key, so each row is
  individually addressable.

✅ The schema is in **1NF**.

## 2NF — Second Normal Form

> Already in 1NF; **no partial dependencies** — every non-key attribute
> depends on the **whole** primary key, not just part of it.

- Tables with single-column auto-increment / UUID PKs (`accounts`,
  `subjects`, `habits`, `dailyentries`, `scores`, `notifications`, …) have
  no opportunity for partial dependency: the key is one column, so every
  attribute depends on the whole of it.
- The two composite-PK tables are designed so every non-key column
  depends on **both** parts:
  - `habit_tags(habit_id, tag_id)` has only `tagged_at`, which is the
    moment *this specific* habit was given *this specific* tag — depends
    on both columns.
  - `scores` has a logical candidate `(entry_id, question_id)`; the
    `score` column is meaningful only for that exact pairing (the answer
    of one question on one entry), so it depends on both.

✅ The schema is in **2NF**.

## 3NF — Third Normal Form

> Already in 2NF; **no transitive dependencies** — non-key columns do not
> depend on other non-key columns. Each fact is stored once.

Concrete checks that would have *violated* 3NF — and how the schema avoids
them:

| Hypothetical violation                                          | What we did instead                                                                              |
|-----------------------------------------------------------------|--------------------------------------------------------------------------------------------------|
| Storing `mentor_name` on `mentor_assignments`                   | We store only `mentor_account_id`; the name is fetched by joining `accounts`.                    |
| Storing `subject_name` on every `vault_files` row               | `vault_files.subject_id` → `subjects.id`; the name lives on `subjects` only.                     |
| Storing `habit_name` on every `dailyentries` row                | `dailyentries.habit_id` → `habits.habit_id`; the name lives on `habits` only.                    |
| Storing the question text on `scores`                           | `scores.question_id` → `questions.question_id`; the text lives on `questions` only.              |
| Storing computed average score on every habit row               | Aggregation is done on demand via the view `vw_habit_score_stats` or stored in `habitanalysis`.  |
| Storing day-of-week as a duplicate of `entry_date`              | `dailyentries.day_of_week` is a **GENERATED STORED** column, not an independent attribute.       |
| Storing `total_files` per subject as a column on `subjects`     | Computed by aggregation in `vw_subject_overview`; not duplicated.                                |
| Storing the email twice (on `accounts` and on `notifications`)  | `notifications` carries only `account_id`; the email is dereferenced from `accounts` when shown. |

The only intentionally denormalised columns are:
- **Generated stored columns** (`dailyentries.day_of_week`) — by definition
  derived from another column on the same row, but materialised for index
  speed; these do not violate 3NF because the dependency is declarative,
  not user-maintained.
- **Cached aggregates** (`habitanalysis.average_score`, etc.) — explicitly
  recomputed by `proc_recompute_habit_analysis`; the source of truth
  remains `dailyentries × scores`. This is a *materialised view* pattern,
  not a 3NF violation.

✅ The schema is in **3NF**.

## M:N relationships and bridge tables

The rubric specifically asks for "handling of M:N using bridge entity".
The schema resolves three M:N relationships:

| Logical M:N                                  | Bridge table          | Note                                                                                  |
|----------------------------------------------|-----------------------|---------------------------------------------------------------------------------------|
| habits ↔ tags                                | `habit_tags`          | One habit can have many tags, one tag many habits.                                    |
| dailyentries ↔ questions (with score)        | `scores`              | A daily entry has many question-answers; a question is answered on many entries.      |
| accounts (as mentor) ↔ accounts (as student) | `mentor_assignments`  | Self-referential M:N; UNIQUE on `student_account_id` enforces *one mentor per student*. |

## Closing remarks

- The schema as a whole sits at **3NF**. Going to BCNF would require
  removing the (intended) overlap between `accounts.email` and
  `users.email` — those are deliberately parallel because the project
  retains the legacy Firebase profile while moving auth to the app-managed
  `accounts` table.
- All foreign keys carry an explicit `ON DELETE` rule (`CASCADE` for child
  rows, `SET NULL` for the audit log so deletions do not destroy history).
- Indexes are sized to the actual access patterns: `(firebase_uid,
  is_archived, created_at DESC)` for the subject list, `(habit_id,
  entry_date)` for habit history, `(account_id, is_read, created_at DESC)`
  for the notification inbox.
