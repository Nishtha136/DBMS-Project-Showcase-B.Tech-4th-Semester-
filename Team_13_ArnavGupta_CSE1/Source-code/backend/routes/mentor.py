"""
routes/mentor.py  --  mirrors backend/routes/mentor.js

Mounted under /api/mentor with verify_mentor applied at router level
(see main.py). request.state.user.uid is the mentor's accounts.id.
"""
from __future__ import annotations

import json
import math
import uuid
from datetime import date as _date, datetime as _dt
from decimal import Decimal as _Dec

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from config.database import (
    get_connection, transaction, normalize_row, normalize_rows,
)
from config.redis_config import cache


router = APIRouter()


def _err(status_code: int, message: str, **extra) -> JSONResponse:
    body = {"error": message}
    body.update(extra)
    return JSONResponse(status_code=status_code, content=body)


def _jsonable(value):
    """Recursively turn datetime / date / Decimal / nested containers into
    JSON-safe primitives. Used when we return through JSONResponse instead
    of letting FastAPI's default encoder do the work."""
    if value is None: return None
    if isinstance(value, _dt):   return value.isoformat()
    if isinstance(value, _date): return value.isoformat()
    if isinstance(value, _Dec):  return float(value)
    if isinstance(value, dict):  return {k: _jsonable(v) for k, v in value.items()}
    if isinstance(value, list):  return [_jsonable(v) for v in value]
    return value


def _invalidate_mentor_caches(mentor_uid: str, *, student_ids=()):
    """Drop every cached read whose answer depends on this mentor's roster,
    stats, or the named students.

    Called after any write that mutates a mentee, task, or assignment so
    the next GET cannot serve a stale snapshot. Safe to call when the
    Redis client is unavailable: every method on the cache wrapper
    silently no-ops in that case."""
    cache.delete(f"mentor_overview:{mentor_uid}")
    cache.delete_pattern(f"mentor_leaderboard:{mentor_uid}:*")
    for sid in student_ids:
        cache.delete(f"mentee_detail:{mentor_uid}:{sid}")


# ---------------------------------------------------------------------------
# Safe sort allowlist for the mentees table. NEVER interpolate raw input.
# ---------------------------------------------------------------------------
MENTEES_SORT_MAP = {
    "habit_logs":    "daily_entries_7d",
    "daily_entries": "daily_entries_7d",
    "subjects":      "subjects_count",
    "last_active":   "last_login_at",
    "name":          "student_name",
}

LEADERBOARD_METRICS = {
    "habit_logs":    {"col": "daily_entries_30d",   "label": "Daily entries (30d)" },
    "daily_entries": {"col": "daily_entries_30d",   "label": "Daily entries (30d)" },
    "subjects":      {"col": "subjects_count",      "label": "Subjects"            },
    "storage":       {"col": "storage_kb",          "label": "Storage (KB)"        },
    "study_time":    {"col": "study_minutes_30d",   "label": "Study minutes (30d)" },
}


# ---------------------------------------------------------------------------
# GET /api/mentor/mentees
# ---------------------------------------------------------------------------
@router.get("/mentees")
def list_mentees(request: Request):
    """List a mentor's roster, paginated and enriched with per-mentee stats.

    The previous implementation used a single SELECT with six LEFT JOINs and
    COUNT(DISTINCT ...) over the resulting cartesian product, which exploded
    multiplicatively (subjects x habits x daily_entries x files x ...). This
    rewrite keeps the public response shape identical but fetches the page
    in two phases:

      1. Base query  -- mentor_assignments + accounts only -- pulls the page
         of roster rows (or the full roster, when sorting by an aggregate).
      2. Per-aggregate IN(...) lookups -- one focused, indexed GROUP BY per
         metric, scoped to the page's student IDs -- get stitched in Python.

    Sorts on accounts columns (name, last_login_at) are pushed to the
    database with LIMIT/OFFSET. Sorts on aggregates (subjects_count,
    daily_entries_7d) require the metric for every roster row before
    pagination, so we enrich everything first, then sort + slice in Python.
    """
    try:
        sort_input = request.query_params.get("sort") or "name"
        order_in   = (request.query_params.get("order") or "asc").lower()
        status     = request.query_params.get("filter_status")
        search     = (request.query_params.get("search") or "").strip()
        try:
            page  = max(1, int(request.query_params.get("page")  or "1"))
        except (TypeError, ValueError):
            page = 1
        try:
            limit = min(100, max(1, int(request.query_params.get("limit") or "20")))
        except (TypeError, ValueError):
            limit = 20
        offset = (page - 1) * limit

        sort_col = MENTEES_SORT_MAP.get(sort_input, "student_name")
        order    = "DESC" if order_in == "desc" else "ASC"

        # Sorts on derived aggregates can't be pushed to the base query.
        AGGREGATE_SORTS = {"daily_entries_7d", "subjects_count"}
        is_aggregate_sort = sort_col in AGGREGATE_SORTS

        mentor_uid = request.state.user["uid"]
        base_params: list = [mentor_uid]
        search_filter = ""
        if search:
            search_filter = "AND (a.name LIKE %s OR a.email LIKE %s)"
            term = f"%{search}%"
            base_params.extend([term, term])

        # Active / inactive is based on activity_log within the last 2 days,
        # not on last_login_at. Any write the student does (study session
        # start/end, focus event, daily entry, task update, vault upload)
        # writes a row to activity_log via triggers.
        status_filter = ""
        if status == "active":
            status_filter = (
                "AND EXISTS (SELECT 1 FROM activity_log al "
                "             WHERE al.account_id = a.id "
                "               AND al.performed_at >= DATE_SUB(NOW(), INTERVAL 2 DAY))"
            )
        elif status == "inactive":
            status_filter = (
                "AND NOT EXISTS (SELECT 1 FROM activity_log al "
                "                 WHERE al.account_id = a.id "
                "                   AND al.performed_at >= DATE_SUB(NOW(), INTERVAL 2 DAY))"
            )

        with get_connection() as conn:
            cur = conn.cursor(dictionary=True)

            # ----- 1. Total count for pagination meta. ---------------------
            cur.execute(
                f"""
                SELECT COUNT(DISTINCT a.id) AS total
                  FROM mentor_assignments ma
                  JOIN accounts a ON a.id = ma.student_account_id
                 WHERE ma.mentor_account_id = %s
                   {status_filter}
                   {search_filter}
                """,
                base_params,
            )
            total = cur.fetchone()["total"]

            # ----- 2. Base roster rows (no aggregates yet). ---------------
            base_cols = (
                "a.id            AS student_id, "
                "a.name          AS full_name, "
                "a.email, "
                "a.last_login_at, "
                "a.is_active"
            )
            if is_aggregate_sort:
                # Pull the whole roster -- we need the aggregate for every
                # candidate before we can sort + paginate.
                cur.execute(
                    f"""
                    SELECT {base_cols}
                      FROM mentor_assignments ma
                      JOIN accounts a ON a.id = ma.student_account_id
                     WHERE ma.mentor_account_id = %s
                       {status_filter}
                       {search_filter}
                    """,
                    base_params,
                )
            else:
                # Sort + paginate at the database. order_by_col is built from
                # the whitelisted MENTEES_SORT_MAP, never raw user input.
                order_by_col = "a.name" if sort_col == "student_name" else f"a.{sort_col}"
                cur.execute(
                    f"""
                    SELECT {base_cols}
                      FROM mentor_assignments ma
                      JOIN accounts a ON a.id = ma.student_account_id
                     WHERE ma.mentor_account_id = %s
                       {status_filter}
                       {search_filter}
                     ORDER BY {order_by_col} {order}, a.id ASC
                     LIMIT %s OFFSET %s
                    """,
                    base_params + [limit, offset],
                )
            roster = cur.fetchall()

            # Empty roster -- short-circuit, skip the IN(...) enrichment.
            if not roster:
                cur.close()
                total_pages = math.ceil(total / limit) if limit else 0
                return JSONResponse(content=_jsonable({
                    "data":        [],
                    "page":        page,
                    "limit":       limit,
                    "total":       total,
                    "total_pages": total_pages,
                }))

            # ----- 3. Per-aggregate enrichment over the roster IDs. -------
            student_ids = [r["student_id"] for r in roster]
            in_marks = ", ".join(["%s"] * len(student_ids))

            # 3a. subjects_count + files_count (vault domain).
            #     LEFT JOIN keeps subjects with zero files at count(vf.id) = 0.
            cur.execute(
                f"""
                SELECT s.firebase_uid AS student_id,
                       COUNT(DISTINCT s.id)  AS subjects_count,
                       COUNT(vf.id)          AS files_count
                  FROM subjects s
                  LEFT JOIN vault_files vf ON vf.subject_id = s.id
                 WHERE s.firebase_uid IN ({in_marks})
                   AND s.is_archived = 0
                 GROUP BY s.firebase_uid
                """,
                student_ids,
            )
            subj_map = {r["student_id"]: r for r in cur.fetchall()}

            # 3b. habits + daily_entries via the legacy users.email bridge.
            cur.execute(
                f"""
                SELECT a.id      AS student_id,
                       u.user_id AS user_id
                  FROM accounts a
                  JOIN users u ON u.email = a.email
                 WHERE a.id IN ({in_marks})
                """,
                student_ids,
            )
            uid_map = {r["student_id"]: r["user_id"] for r in cur.fetchall()}

            habit_counts: dict   = {}
            entries_counts: dict = {}
            user_ids = list(uid_map.values())
            if user_ids:
                u_marks = ", ".join(["%s"] * len(user_ids))
                cur.execute(
                    f"""
                    SELECT user_id, COUNT(*) AS total_habits
                      FROM habits
                     WHERE user_id IN ({u_marks})
                       AND is_archived = 0
                     GROUP BY user_id
                    """,
                    user_ids,
                )
                habit_counts = {r["user_id"]: r["total_habits"] for r in cur.fetchall()}

                cur.execute(
                    f"""
                    SELECT user_id, COUNT(*) AS daily_entries_7d
                      FROM dailyentries
                     WHERE user_id IN ({u_marks})
                       AND entry_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                     GROUP BY user_id
                    """,
                    user_ids,
                )
                entries_counts = {r["user_id"]: r["daily_entries_7d"] for r in cur.fetchall()}

            # 3c. Open tasks for THIS mentor, per student.
            cur.execute(
                f"""
                SELECT student_id, COUNT(*) AS open_tasks
                  FROM mentor_tasks
                 WHERE mentor_id = %s
                   AND student_id IN ({in_marks})
                   AND status IN ('pending','in_progress')
                 GROUP BY student_id
                """,
                [mentor_uid] + student_ids,
            )
            task_counts = {r["student_id"]: r["open_tasks"] for r in cur.fetchall()}

            # 3d. last_activity_at -- canonical "last seen" per the 2-day rule.
            cur.execute(
                f"""
                SELECT account_id, MAX(performed_at) AS last_activity_at
                  FROM activity_log
                 WHERE account_id IN ({in_marks})
                 GROUP BY account_id
                """,
                student_ids,
            )
            last_act = {r["account_id"]: r["last_activity_at"] for r in cur.fetchall()}

            # 3e. Study minutes (ended sessions only). One pass returns both
            #     the all-time total and the 7-day window.
            cur.execute(
                f"""
                SELECT student_id,
                       COALESCE(SUM(duration_minutes), 0) AS total_study_minutes,
                       COALESCE(SUM(CASE
                           WHEN ended_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                           THEN duration_minutes ELSE 0 END), 0) AS study_minutes_7d
                  FROM study_sessions
                 WHERE student_id IN ({in_marks})
                   AND ended_at IS NOT NULL
                 GROUP BY student_id
                """,
                student_ids,
            )
            study_map = {r["student_id"]: r for r in cur.fetchall()}

            cur.close()

        # ----- 4. Stitch aggregates onto each roster row. -----------------
        for r in roster:
            sid = r["student_id"]
            subj = subj_map.get(sid)
            r["subjects_count"]      = int(subj["subjects_count"]) if subj else 0
            r["files_count"]         = int(subj["files_count"])    if subj else 0

            uid = uid_map.get(sid)
            r["total_habits"]        = int(habit_counts.get(uid, 0))   if uid else 0
            r["daily_entries_7d"]    = int(entries_counts.get(uid, 0)) if uid else 0

            r["open_tasks"]          = int(task_counts.get(sid, 0))
            r["last_activity_at"]    = last_act.get(sid)

            ss = study_map.get(sid)
            r["study_minutes_7d"]    = float(ss["study_minutes_7d"])    if ss else 0
            r["total_study_minutes"] = float(ss["total_study_minutes"]) if ss else 0

        # ----- 5. For aggregate sorts, sort + slice the enriched roster. --
        if is_aggregate_sort:
            roster.sort(
                key=lambda r: (r[sort_col] or 0, r["full_name"] or ""),
                reverse=(order == "DESC"),
            )
            roster = roster[offset : offset + limit]

        total_pages = math.ceil(total / limit) if limit else 0
        return JSONResponse(content=_jsonable({
            "data":         normalize_rows(roster),
            "page":         page,
            "limit":        limit,
            "total":        total,
            "total_pages":  total_pages,
        }))
    except Exception as e:
        return _err(500, str(e))


# ---------------------------------------------------------------------------
# POST /api/mentor/mentees  -- atomic mentee creation + assignment
# ---------------------------------------------------------------------------
class _EmailTaken(Exception): pass


@router.post("/mentees")
async def create_mentee(request: Request):
    try:
        body = await request.json()
    except Exception:
        return _err(400, "Invalid JSON body")

    full_name     = body.get("full_name")
    email         = body.get("email")
    temp_password = body.get("temp_password")

    if not full_name or not email:
        return _err(400, "full_name and email are required")

    # Generate a temp password if the mentor did not supply one (>= 6 chars).
    import secrets, string
    if temp_password and len(temp_password) >= 6:
        password = temp_password
    else:
        alphabet = string.ascii_letters + string.digits
        password = "".join(secrets.choice(alphabet) for _ in range(8)) + "A!"

    student_id = str(uuid.uuid4())

    try:
        import bcrypt
        with transaction() as conn:
            cur = conn.cursor(dictionary=True)
            cur.execute("SELECT id FROM accounts WHERE email = %s", (email,))
            if cur.fetchall():
                cur.close()
                raise _EmailTaken()

            password_hash = bcrypt.hashpw(
                password.encode("utf-8"), bcrypt.gensalt(rounds=12)
            ).decode("utf-8")

            cur.execute(
                """INSERT INTO accounts (id, name, email, password_hash, role)
                   VALUES (%s, %s, %s, %s, 'student')""",
                (student_id, full_name, email, password_hash),
            )
            cur.execute(
                """INSERT INTO mentor_assignments
                       (id, mentor_account_id, student_account_id)
                   VALUES (%s, %s, %s)""",
                (str(uuid.uuid4()), request.state.user["uid"], student_id),
            )
            cur.execute(
                """INSERT INTO notifications (id, account_id, type, message, link)
                   VALUES (%s, %s, 'WELCOME', %s, '/vault')""",
                (
                    str(uuid.uuid4()),
                    student_id,
                    f"Welcome, {full_name}! Your mentor has set up your account.",
                ),
            )
            cur.execute(
                """INSERT INTO activity_log
                       (account_id, action_type, entity_type, entity_id, metadata)
                   VALUES (%s, 'CREATE_MENTEE', 'account', %s, %s)""",
                (
                    request.state.user["uid"],
                    student_id,
                    json.dumps({"email": email, "full_name": full_name}),
                ),
            )
            cur.close()

        _invalidate_mentor_caches(request.state.user["uid"])
        return JSONResponse(status_code=201, content={
            "student_id":    student_id,
            "email":         email,
            "temp_password": password,
        })
    except _EmailTaken:
        return _err(409, "Email already registered")
    except Exception as e:
        return _err(500, str(e))


# ---------------------------------------------------------------------------
# DELETE /api/mentor/mentees/{student_id}?mode=delete_all|self
# ---------------------------------------------------------------------------
# Two-mode removal initiated from the mentor-CRM detail page:
#
#   mode=delete_all  -> nuke the account. accounts.id is the FK target for
#                       mentor_assignments, mentor_tasks, notifications,
#                       activity_log, study_sessions, subjects (via
#                       firebase_uid), vault_files, etc. Every dependent row
#                       cascade-deletes via the schema's ON DELETE CASCADE.
#
#   mode=self        -> keep the account + all its data, but flip the
#                       mentor_assignments row to a self-referential
#                       "self-mentored" slot. The student is no longer on
#                       this mentor's roster but their study history,
#                       habits, vault, and assessments remain intact for
#                       them to keep using.
#
# Both modes:
#   * require the calling mentor to currently own the assignment (no
#     cross-mentor deletes);
#   * write an audit row keyed by the mentor's account so the action is
#     visible on this mentor's activity feed (the student's own audit
#     trail is wiped in delete_all mode, so the mentor-side row is the
#     only durable trace).
# ---------------------------------------------------------------------------
class _DeleteNotOwned(Exception):  pass


@router.delete("/mentees/{student_id}")
def delete_mentee(student_id: str, request: Request):
    mode = (request.query_params.get("mode") or "").lower()
    if mode not in ("delete_all", "self"):
        return _err(400, "mode must be 'delete_all' or 'self'")

    mentor_uid = request.state.user["uid"]

    try:
        with transaction() as conn:
            cur = conn.cursor(dictionary=True)

            # Ownership check inside the transaction so a concurrent
            # reassignment cannot slip through between the SELECT and the
            # mutation.
            cur.execute(
                """SELECT a.id, a.name, a.email
                     FROM mentor_assignments ma
                     JOIN accounts a ON a.id = ma.student_account_id
                    WHERE ma.mentor_account_id  = %s
                      AND ma.student_account_id = %s""",
                (mentor_uid, student_id),
            )
            rows = cur.fetchall()
            if not rows:
                cur.close()
                raise _DeleteNotOwned()
            student = rows[0]

            if mode == "delete_all":
                # Audit FIRST -- the cascade about to fire will wipe any row
                # keyed by the student, but the mentor-keyed audit row stays.
                cur.execute(
                    """INSERT INTO activity_log
                           (account_id, action_type, entity_type, entity_id, metadata)
                       VALUES (%s, 'DELETE_MENTEE', 'account', %s, %s)""",
                    (
                        mentor_uid,
                        student_id,
                        json.dumps({
                            "mode":  "delete_all",
                            "email": student["email"],
                            "name":  student["name"],
                        }),
                    ),
                )
                cur.execute("DELETE FROM accounts WHERE id = %s", (student_id,))
            else:  # mode == "self"
                # Clear the unique-key slot keyed by student_account_id, then
                # write the new self-referential row in the same transaction.
                cur.execute(
                    "DELETE FROM mentor_assignments WHERE student_account_id = %s",
                    (student_id,),
                )
                cur.execute(
                    """INSERT INTO mentor_assignments
                           (id, mentor_account_id, student_account_id, is_self_mentored)
                       VALUES (%s, %s, %s, 1)""",
                    (str(uuid.uuid4()), student_id, student_id),
                )
                cur.execute(
                    """INSERT INTO activity_log
                           (account_id, action_type, entity_type, entity_id, metadata)
                       VALUES (%s, 'UNASSIGN_MENTEE', 'account', %s, %s)""",
                    (
                        mentor_uid,
                        student_id,
                        json.dumps({
                            "mode":  "self",
                            "email": student["email"],
                            "name":  student["name"],
                        }),
                    ),
                )

            cur.close()

        _invalidate_mentor_caches(mentor_uid, student_ids=[student_id])
        return {"ok": True, "mode": mode, "student_id": student_id}
    except _DeleteNotOwned:
        return _err(404, "Mentee not found on your roster")
    except Exception as e:
        return _err(500, str(e))



# ---------------------------------------------------------------------------
# GET /api/mentor/mentees/:id
# ---------------------------------------------------------------------------
@router.get("/mentees/{student_id}")
def get_mentee(student_id: str, request: Request):
    try:
        mentor_uid = request.state.user["uid"]
        # Per-mentor cache so two mentors viewing different mentees never
        # see each other's authorisation results. 60s TTL keeps the
        # heaviest profile query (11 correlated subqueries) off the DB
        # for back-to-back tab switches without hiding edits for long.
        cache_key = f"mentee_detail:{mentor_uid}:{student_id}"
        cached = cache.get(cache_key)
        if cached:
            return JSONResponse(content=cached)

        with get_connection() as conn:
            cur = conn.cursor(dictionary=True)

            # 1) Profile + correlated counters (auth check via JOIN to ma).
            cur.execute(
                """
                SELECT
                    a.id, a.name AS full_name, a.email, a.role, a.is_active,
                    a.bio, a.last_login_at, a.created_at,
                    (SELECT COUNT(*) FROM subjects s
                      WHERE s.firebase_uid = a.id AND s.is_archived = 0) AS subjects_count,
                    (SELECT COUNT(*) FROM vault_files vf
                      JOIN subjects s ON s.id = vf.subject_id
                      WHERE s.firebase_uid = a.id) AS files_count,
                    (SELECT COALESCE(SUM(vf.file_size_kb),0) FROM vault_files vf
                      JOIN subjects s ON s.id = vf.subject_id
                      WHERE s.firebase_uid = a.id) AS storage_kb,
                    (SELECT COUNT(*) FROM habits h
                      JOIN users u ON u.user_id = h.user_id
                      WHERE u.email = a.email AND h.is_archived = 0) AS habits_count,
                    (SELECT COUNT(*) FROM dailyentries de
                      JOIN users u ON u.user_id = de.user_id
                      WHERE u.email = a.email
                        AND de.entry_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY))
                      AS daily_entries_7d,
                    (SELECT COUNT(*) FROM mentor_tasks mt
                      WHERE mt.student_id = a.id
                        AND mt.mentor_id  = ma.mentor_account_id
                        AND mt.status IN ('pending','in_progress'))
                      AS open_tasks,
                    /* canonical "last seen" -- any activity_log row */
                    (SELECT MAX(al.performed_at) FROM activity_log al
                      WHERE al.account_id = a.id)         AS last_activity_at,
                    /* study time aggregates -- only ENDED sessions */
                    COALESCE((SELECT SUM(ss.duration_minutes) FROM study_sessions ss
                               WHERE ss.student_id = a.id AND ss.ended_at IS NOT NULL), 0)
                                                          AS total_study_minutes,
                    COALESCE((SELECT SUM(ss.duration_minutes) FROM study_sessions ss
                               WHERE ss.student_id = a.id AND ss.ended_at IS NOT NULL
                                 AND ss.ended_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)), 0)
                                                          AS study_minutes_7d,
                    COALESCE((SELECT SUM(ss.focus_seconds) FROM study_sessions ss
                               WHERE ss.student_id = a.id), 0)
                                                          AS total_focus_seconds
                  FROM mentor_assignments ma
                  JOIN accounts a ON a.id = ma.student_account_id
                 WHERE ma.mentor_account_id = %s
                   AND a.id = %s
                """,
                (request.state.user["uid"], student_id),
            )
            profile = cur.fetchall()
            if not profile:
                cur.close()
                return _err(404, "Mentee not found")
            student = profile[0]

            # 2) Recent activity (last 20).
            cur.execute(
                """SELECT log_id, action_type, entity_type, entity_id,
                          metadata, performed_at
                     FROM activity_log
                    WHERE account_id = %s
                    ORDER BY performed_at DESC
                    LIMIT 20""",
                (student_id,),
            )
            activity = cur.fetchall()

            # 3) Recent notifications (last 10).
            cur.execute(
                """SELECT id, type, message, link, is_read, created_at
                     FROM notifications
                    WHERE account_id = %s
                    ORDER BY created_at DESC
                    LIMIT 10""",
                (student_id,),
            )
            notifications = cur.fetchall()

            # 4) Last 14 days of daily entries (for the chart).
            #    Recursive CTE generates one row per day in the window so the
            #    chart renders an empty bar on zero-entry days instead of
            #    skipping them.
            cur.execute(
                """WITH RECURSIVE date_series AS (
                       SELECT DATE_SUB(CURDATE(), INTERVAL 14 DAY) AS dt
                       UNION ALL
                       SELECT dt + INTERVAL 1 DAY
                         FROM date_series
                        WHERE dt < CURDATE()
                   )
                   SELECT ds.dt                       AS date,
                          COUNT(de.entry_id)          AS entry_count,
                          COALESCE(AVG(sc.score), 0)  AS avg_score
                     FROM date_series ds
                     LEFT JOIN dailyentries de
                            ON de.entry_date = ds.dt
                           AND de.user_id = (SELECT user_id FROM users
                                              WHERE email = %s LIMIT 1)
                     LEFT JOIN scores sc ON sc.entry_id = de.entry_id
                    GROUP BY ds.dt
                    ORDER BY ds.dt""",
                (student["email"],),
            )
            daily_series = cur.fetchall()

            # 5) Habits with this-week log counts.
            cur.execute(
                """SELECT h.habit_id, h.habit_name, h.status, h.experiment_duration,
                          COUNT(DISTINCT CASE
                             WHEN de.entry_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                             THEN de.entry_id END) AS logs_7d
                     FROM habits h
                     JOIN users u ON u.user_id = h.user_id
                     LEFT JOIN dailyentries de ON de.habit_id = h.habit_id
                    WHERE u.email = %s AND h.is_archived = 0
                    GROUP BY h.habit_id, h.habit_name, h.status, h.experiment_duration
                    ORDER BY h.habit_name""",
                (student["email"],),
            )
            habits = cur.fetchall()

            # 6) Subjects (vault domain).
            cur.execute(
                """SELECT s.id, s.name, s.color_hex, s.created_at,
                          COUNT(DISTINCT vf.id) AS file_count,
                          COUNT(DISTINCT vl.id) AS link_count,
                          GREATEST(
                            COALESCE(MAX(vf.uploaded_at), '1970-01-01'),
                            COALESCE(MAX(vl.added_at),   '1970-01-01')
                          ) AS last_activity
                     FROM subjects s
                     LEFT JOIN vault_files vf ON vf.subject_id = s.id
                     LEFT JOIN vault_links vl ON vl.subject_id = s.id
                    WHERE s.firebase_uid = %s AND s.is_archived = 0
                    GROUP BY s.id, s.name, s.color_hex, s.created_at
                    ORDER BY s.created_at DESC""",
                (student_id,),
            )
            subjects = cur.fetchall()

            # 7) Open mentor tasks for this student (this mentor only).
            cur.execute(
                """SELECT id, title, description, due_date, priority, status, created_at
                     FROM mentor_tasks
                    WHERE student_id = %s AND mentor_id = %s
                    ORDER BY
                      CASE status WHEN 'pending'     THEN 1
                                  WHEN 'in_progress' THEN 2
                                  WHEN 'done'        THEN 3
                                  ELSE 4 END,
                      due_date IS NULL, due_date ASC""",
                (student_id, request.state.user["uid"]),
            )
            tasks = cur.fetchall()

            # 8) Recent study sessions (last 20).
            cur.execute(
                """SELECT ss.id, ss.subject_id, ss.subject_label,
                          ss.started_at, ss.ended_at,
                          ss.duration_minutes, ss.focus_seconds, ss.notes,
                          s.name AS subject_name, s.color_hex AS subject_color
                     FROM study_sessions ss
                     LEFT JOIN subjects s ON s.id = ss.subject_id
                    WHERE ss.student_id = %s
                    ORDER BY ss.started_at DESC
                    LIMIT 20""",
                (student_id,),
            )
            study_sessions = cur.fetchall()

            # 9) Assessments for this student.
            #    Includes both mentor-assigned (mentor_id IS NOT NULL) and
            #    self-tracked (mentor_id IS NULL) assessments. The Android
            #    app keeps its own local copy in Room; this is the
            #    server-side mirror used by the mentor CRM.
            cur.execute(
                """SELECT a.id, a.type, a.title, a.notes, a.due_at,
                          a.is_done, a.score, a.max_score,
                          a.created_at, a.subject_id,
                          s.name      AS subject_name,
                          s.color_hex AS subject_color,
                          a.mentor_id,
                          CASE WHEN a.mentor_id IS NULL THEN 1 ELSE 0 END AS is_self,
                          CASE
                            WHEN a.is_done = 1                    THEN 'done'
                            WHEN a.due_at IS NOT NULL
                                 AND a.due_at < NOW()             THEN 'overdue'
                            WHEN a.due_at IS NOT NULL
                                 AND a.due_at < DATE_ADD(NOW(), INTERVAL 2 DAY)
                                                                  THEN 'due_soon'
                            ELSE                                       'upcoming'
                          END                                         AS computed_status
                     FROM assessments a
                     LEFT JOIN subjects s ON s.id = a.subject_id
                    WHERE a.student_id = %s
                    ORDER BY a.is_done ASC,
                             a.due_at IS NULL,
                             a.due_at ASC,
                             a.created_at DESC""",
                (student_id,),
            )
            assessments = cur.fetchall()

            cur.close()

        result = _jsonable({
            "student":         normalize_row(student),
            "activity":        normalize_rows(activity),
            "notifications":   normalize_rows(notifications),
            "daily_series":    normalize_rows(daily_series),
            "habits":          normalize_rows(habits),
            "subjects":        normalize_rows(subjects),
            "tasks":           normalize_rows(tasks),
            "study_sessions":  normalize_rows(study_sessions),
            "assessments":     normalize_rows(assessments),
        })
        cache.set(cache_key, result, expire=60)
        return JSONResponse(content=result)
    except Exception as e:
        return _err(500, str(e))


# ---------------------------------------------------------------------------
# GET /api/mentor/overview
# ---------------------------------------------------------------------------
@router.get("/overview")
def overview(request: Request):
    try:
        uid = request.state.user["uid"]
        
        # Try to get from cache first
        cache_key = f"mentor_overview:{uid}"
        cached_data = cache.get(cache_key)
        if cached_data:
            return JSONResponse(content=cached_data)

        with get_connection() as conn:
            cur = conn.cursor(dictionary=True)
            cur.execute(
                """
                SELECT
                    (SELECT COUNT(*) FROM mentor_assignments
                      WHERE mentor_account_id = %s)                AS total_mentees,
                    /* Active = any activity_log row in the last 2 days */
                    (SELECT COUNT(DISTINCT ma.student_account_id)
                       FROM mentor_assignments ma
                      WHERE ma.mentor_account_id = %s
                        AND EXISTS (SELECT 1 FROM activity_log al
                                     WHERE al.account_id = ma.student_account_id
                                       AND al.performed_at >= DATE_SUB(NOW(), INTERVAL 2 DAY)))
                                                                  AS active_2d,
                    /* Inactive = no activity_log row in the last 2 days */
                    (SELECT COUNT(*) FROM mentor_assignments ma
                      WHERE ma.mentor_account_id = %s
                        AND NOT EXISTS (SELECT 1 FROM activity_log al
                                         WHERE al.account_id = ma.student_account_id
                                           AND al.performed_at >= DATE_SUB(NOW(), INTERVAL 2 DAY)))
                                                                  AS inactive_count,
                    (SELECT COUNT(*) FROM subjects s
                       JOIN mentor_assignments ma
                         ON ma.student_account_id = s.firebase_uid
                      WHERE ma.mentor_account_id = %s AND s.is_archived = 0)
                                                                  AS total_subjects,
                    (SELECT COUNT(*) FROM mentor_tasks
                      WHERE mentor_id = %s AND status IN ('pending','in_progress'))
                                                                  AS open_tasks,
                    /* Total study minutes (ended sessions) across this mentor's roster */
                    COALESCE((SELECT SUM(ss.duration_minutes)
                                FROM study_sessions ss
                                JOIN mentor_assignments ma
                                  ON ma.student_account_id = ss.student_id
                               WHERE ma.mentor_account_id = %s
                                 AND ss.ended_at IS NOT NULL), 0) AS total_study_minutes,
                    COALESCE((SELECT SUM(ss.duration_minutes)
                                FROM study_sessions ss
                                JOIN mentor_assignments ma
                                  ON ma.student_account_id = ss.student_id
                               WHERE ma.mentor_account_id = %s
                                 AND ss.ended_at IS NOT NULL
                                 AND ss.ended_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)), 0)
                                                                  AS study_minutes_7d
                """,
                (uid, uid, uid, uid, uid, uid, uid),
            )
            row = cur.fetchone()
            cur.close()
        
        result = _jsonable(normalize_row(row))
        # Store in cache for 5 minutes
        cache.set(cache_key, result, expire=300)
        return JSONResponse(content=result)
    except Exception as e:
        return _err(500, str(e))


# ---------------------------------------------------------------------------
# POST /api/mentor/tasks/bulk
# ---------------------------------------------------------------------------
class _NotMentee(Exception):
    def __init__(self, unknown):
        self.unknown = unknown


@router.post("/tasks/bulk")
async def bulk_assign_tasks(request: Request):
    try:
        body = await request.json()
    except Exception:
        return _err(400, "Invalid JSON body")

    student_ids = body.get("student_ids")
    title       = body.get("title")
    description = body.get("description")
    due_date    = body.get("due_date")
    priority    = body.get("priority")

    if not isinstance(student_ids, list) or len(student_ids) == 0:
        return _err(400, "student_ids must be a non-empty array")
    if not title or not str(title).strip():
        return _err(400, "title is required")

    safe_priority = priority if priority in ("low", "medium", "high") else "medium"

    # Express converted due_date with `new Date(...)`. mysql-connector-python
    # accepts ISO strings for DATETIME columns; pass through unchanged.
    safe_due = due_date or None

    try:
        with transaction() as conn:
            cur = conn.cursor(dictionary=True)

            # Authorisation: every student_id must be one of THIS mentor's mentees.
            placeholders = ",".join(["%s"] * len(student_ids))
            cur.execute(
                f"""SELECT student_account_id FROM mentor_assignments
                     WHERE mentor_account_id = %s
                       AND student_account_id IN ({placeholders})""",
                [request.state.user["uid"], *student_ids],
            )
            authorised = {r["student_account_id"] for r in cur.fetchall()}
            unknown = [sid for sid in student_ids if sid not in authorised]
            if unknown:
                cur.close()
                raise _NotMentee(unknown)

            rows = [
                (
                    str(uuid.uuid4()),
                    request.state.user["uid"],
                    sid,
                    str(title).strip(),
                    description or None,
                    safe_due,
                    safe_priority,
                )
                for sid in student_ids
            ]
            cur.executemany(
                """INSERT INTO mentor_tasks
                       (id, mentor_id, student_id, title, description, due_date, priority)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                rows,
            )
            cur.close()

        _invalidate_mentor_caches(
            request.state.user["uid"], student_ids=student_ids,
        )
        return JSONResponse(status_code=201, content={"created": len(rows)})
    except _NotMentee as nm:
        return _err(403, "Some students are not your mentees", unknown=nm.unknown)
    except Exception as e:
        return _err(500, str(e))


# ---------------------------------------------------------------------------
# GET /api/mentor/activity-feed
# ---------------------------------------------------------------------------
@router.get("/activity-feed")
def activity_feed(request: Request):
    try:
        try:
            page  = max(1, int(request.query_params.get("page")  or "1"))
        except (TypeError, ValueError):
            page = 1
        try:
            limit = min(100, max(1, int(request.query_params.get("limit") or "20")))
        except (TypeError, ValueError):
            limit = 20
        offset = (page - 1) * limit
        type_filter = request.query_params.get("action_type")
        search = (request.query_params.get("search") or "").strip()

        type_clause = ""
        type_params: list = []
        if type_filter:
            type_clause = "AND al.action_type = %s"
            type_params.append(type_filter)

        search_clause = ""
        search_params: list = []
        if search:
            # Substring match on the mentee's name or email.
            search_clause = "AND (a.name LIKE %s OR a.email LIKE %s)"
            pattern = f"%{search}%"
            search_params.extend([pattern, pattern])

        with get_connection() as conn:
            cur = conn.cursor(dictionary=True)
            cur.execute(
                f"""SELECT al.log_id     AS id,
                           al.account_id AS user_id,
                           al.action_type, al.entity_type, al.entity_id,
                           al.metadata, al.performed_at,
                           a.name        AS full_name,
                           a.email
                      FROM activity_log al
                      JOIN accounts a ON a.id = al.account_id
                     WHERE al.account_id IN (
                            SELECT student_account_id FROM mentor_assignments
                             WHERE mentor_account_id = %s)
                       {type_clause}
                       {search_clause}
                     ORDER BY al.performed_at DESC
                     LIMIT %s OFFSET %s""",
                [request.state.user["uid"], *type_params, *search_params, limit, offset],
            )
            rows = cur.fetchall()

            cur.execute(
                f"""SELECT COUNT(*) AS total
                      FROM activity_log al
                      JOIN accounts a ON a.id = al.account_id
                     WHERE al.account_id IN (
                            SELECT student_account_id FROM mentor_assignments
                             WHERE mentor_account_id = %s)
                       {type_clause}
                       {search_clause}""",
                [request.state.user["uid"], *type_params, *search_params],
            )
            total = cur.fetchone()["total"]
            cur.close()

        total_pages = math.ceil(total / limit) if limit else 0
        return JSONResponse(content=_jsonable({
            "data":         normalize_rows(rows),
            "page":         page,
            "limit":        limit,
            "total":        total,
            "total_pages":  total_pages,
        }))
    except Exception as e:
        return _err(500, str(e))


# ---------------------------------------------------------------------------
# GET /api/mentor/leaderboard
# ---------------------------------------------------------------------------
@router.get("/leaderboard")
def leaderboard(request: Request):
    try:
        metric_input = request.query_params.get("metric") or "habit_logs"
        metric = metric_input if metric_input in LEADERBOARD_METRICS else "habit_logs"
        cfg = LEADERBOARD_METRICS[metric]
        col = cfg["col"]      # safe, allowlisted
        label = cfg["label"]

        uid = request.state.user["uid"]
        cache_key = f"mentor_leaderboard:{uid}:{metric}"
        cached_data = cache.get(cache_key)
        if cached_data:
            return JSONResponse(content=cached_data)

        with get_connection() as conn:
            cur = conn.cursor(dictionary=True)
            cur.execute(
                f"""
                SELECT * FROM (
                    SELECT
                        a.id    AS student_id,
                        a.name  AS full_name,
                        a.email,
                        COUNT(DISTINCT CASE
                             WHEN de.entry_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                             THEN de.entry_id END) AS daily_entries_30d,
                        COUNT(DISTINCT s.id)        AS subjects_count,
                        COALESCE(SUM(vf.file_size_kb), 0) AS storage_kb,
                        COALESCE((SELECT SUM(ss.duration_minutes)
                                    FROM study_sessions ss
                                   WHERE ss.student_id = a.id
                                     AND ss.ended_at IS NOT NULL
                                     AND ss.ended_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)), 0)
                                                    AS study_minutes_30d
                      FROM mentor_assignments ma
                      JOIN accounts a       ON a.id = ma.student_account_id
                      LEFT JOIN users u     ON u.email = a.email
                      LEFT JOIN dailyentries de ON de.user_id = u.user_id
                      LEFT JOIN subjects s  ON s.firebase_uid = a.id AND s.is_archived = 0
                      LEFT JOIN vault_files vf ON vf.subject_id = s.id
                     WHERE ma.mentor_account_id = %s
                     GROUP BY a.id, a.name, a.email
                ) base
                ORDER BY {col} DESC
                LIMIT 50
                """,
                (request.state.user["uid"],),
            )
            rows = cur.fetchall()
            cur.close()

        rows = normalize_rows(rows) or []
        # Add rank in Python (matches the Express version's tie-handling).
        prev_value = None
        prev_rank = 0
        ranked = []
        for i, r in enumerate(rows):
            val = r.get(col)
            rank = prev_rank if val == prev_value else i + 1
            prev_value, prev_rank = val, rank
            ranked.append({**r, "rank": rank, "value": val,
                           "metric": metric, "metric_label": label})
        
        result = _jsonable({
            "metric":       metric,
            "metric_label": label,
            "data":         ranked,
        })
        # Store in cache for 10 minutes
        cache.set(cache_key, result, expire=600)
        return JSONResponse(content=result)
    except Exception as e:
        return _err(500, str(e))


# ---------------------------------------------------------------------------
# GET /api/mentor/analytics/activity?weeks=4
# ---------------------------------------------------------------------------
@router.get("/analytics/activity")
def analytics_activity(request: Request):
    try:
        try:
            weeks = min(26, max(1, int(request.query_params.get("weeks") or "4")))
        except (TypeError, ValueError):
            weeks = 4
        with get_connection() as conn:
            cur = conn.cursor(dictionary=True)
            cur.execute(
                """
                WITH RECURSIVE date_series AS (
                     SELECT DATE_SUB(CURDATE(), INTERVAL %s WEEK) AS wk
                     UNION ALL
                     SELECT DATE_ADD(wk, INTERVAL 1 WEEK)
                       FROM date_series
                      WHERE wk < CURDATE()
                ),
                mentees AS (
                     SELECT a.id, a.name AS full_name
                       FROM mentor_assignments ma
                       JOIN accounts a ON a.id = ma.student_account_id
                      WHERE ma.mentor_account_id = %s
                )
                SELECT
                     ds.wk                        AS week_start,
                     m.id                         AS student_id,
                     m.full_name,
                     COUNT(al.log_id)             AS activity_count
                   FROM date_series ds
                   CROSS JOIN mentees m
                   LEFT JOIN activity_log al
                          ON al.account_id = m.id
                         AND DATE(al.performed_at) BETWEEN ds.wk
                                                      AND DATE_ADD(ds.wk, INTERVAL 6 DAY)
                  GROUP BY ds.wk, m.id, m.full_name
                  ORDER BY ds.wk, m.full_name
                """,
                (weeks, request.state.user["uid"]),
            )
            rows = cur.fetchall()
            cur.close()
        return JSONResponse(content=_jsonable({
            "weeks": weeks,
            "data":  normalize_rows(rows),
        }))
    except Exception as e:
        return _err(500, str(e))


# ---------------------------------------------------------------------------
# PATCH /api/mentor/tasks/:id
# ---------------------------------------------------------------------------
class _NotFound(Exception): pass


@router.patch("/tasks/{task_id}")
async def update_task(task_id: str, request: Request):
    try:
        body = await request.json()
    except Exception:
        return _err(400, "Invalid JSON body")

    title       = body.get("title")
    description = body.get("description")
    due_date    = body.get("due_date")
    priority    = body.get("priority")
    status      = body.get("status")

    mentor_uid = request.state.user["uid"]
    affected_student_id: str | None = None
    try:
        with transaction() as conn:
            cur = conn.cursor(dictionary=True)
            cur.execute(
                """UPDATE mentor_tasks
                      SET title       = COALESCE(%s, title),
                          description = COALESCE(%s, description),
                          due_date    = COALESCE(%s, due_date),
                          priority    = COALESCE(%s, priority),
                          status      = COALESCE(%s, status)
                    WHERE id = %s AND mentor_id = %s""",
                (
                    title or None, description or None, due_date or None,
                    priority or None, status or None,
                    task_id, mentor_uid,
                ),
            )
            if cur.rowcount == 0:
                cur.close()
                raise _NotFound()
            # Fetch the student so we can drop their cached detail page.
            cur.execute(
                "SELECT student_id FROM mentor_tasks WHERE id = %s",
                (task_id,),
            )
            row = cur.fetchone()
            if row:
                affected_student_id = row["student_id"]
            cur.execute(
                """INSERT INTO activity_log
                       (account_id, action_type, entity_type, entity_id, metadata)
                   VALUES (%s, 'UPDATE_TASK', 'mentor_task', %s, %s)""",
                (mentor_uid, task_id, json.dumps(body)),
            )
            cur.close()

        _invalidate_mentor_caches(
            mentor_uid,
            student_ids=[affected_student_id] if affected_student_id else (),
        )
        return {"success": True}
    except _NotFound:
        return _err(404, "Task not found")
    except Exception as e:
        return _err(500, str(e))


# ---------------------------------------------------------------------------
# GET /api/mentor/analytics/top-students
# Demonstrates: Correlated Subquery
# ---------------------------------------------------------------------------
@router.get("/analytics/top-students")
def get_top_students(request: Request):
    try:
        with get_connection() as conn:
            cur = conn.cursor(dictionary=True)
            cur.execute(
                """
                SELECT a.id, a.name AS student_name, 
                       COALESCE((SELECT SUM(duration_minutes) FROM study_sessions WHERE student_id = a.id), 0) AS individual_study_time
                FROM accounts a
                JOIN mentor_assignments ma ON a.id = ma.student_account_id
                WHERE a.role = 'student'
                  AND ma.mentor_account_id = %s
                  AND COALESCE((SELECT SUM(duration_minutes) FROM study_sessions WHERE student_id = a.id), 0) > 
                      (
                          SELECT COALESCE(AVG(total_study), 0)
                          FROM (
                              SELECT ss.student_id, SUM(ss.duration_minutes) AS total_study
                              FROM study_sessions ss
                              JOIN mentor_assignments ma_inner ON ss.student_id = ma_inner.student_account_id
                              WHERE ma_inner.mentor_account_id = ma.mentor_account_id
                              GROUP BY ss.student_id
                          ) AS mentor_averages
                      )
                ORDER BY individual_study_time DESC;
                """,
                (request.state.user["uid"],)
            )
            rows = cur.fetchall()
            cur.close()
        return JSONResponse(content=_jsonable(normalize_rows(rows)))
    except Exception as e:
        return _err(500, str(e))

# ---------------------------------------------------------------------------
# GET /api/mentor/analytics/performance-summary
# Demonstrates: Using a VIEW
# ---------------------------------------------------------------------------
@router.get("/analytics/performance-summary")
def get_performance_summary(request: Request):
    try:
        with get_connection() as conn:
            cur = conn.cursor(dictionary=True)
            cur.execute(
                """
                SELECT mps.* 
                FROM mentee_performance_summary mps
                JOIN mentor_assignments ma ON mps.student_id = ma.student_account_id
                WHERE ma.mentor_account_id = %s
                ORDER BY mps.total_study_minutes DESC;
                """,
                (request.state.user["uid"],)
            )
            rows = cur.fetchall()
            cur.close()
        return JSONResponse(content=_jsonable(normalize_rows(rows)))
    except Exception as e:
        return _err(500, str(e))

# ---------------------------------------------------------------------------
# POST /api/mentor/admin/archive-inactive
# Demonstrates: Calling a STORED PROCEDURE with an OUT parameter
# ---------------------------------------------------------------------------
@router.post("/admin/archive-inactive")
def trigger_archive_inactive(request: Request):
    try:
        with get_connection() as conn:
            cur = conn.cursor(dictionary=True)
            cur.execute("CALL ArchiveInactiveMentees(@archived_count)")
            cur.execute("SELECT @archived_count AS archived_count")
            result = cur.fetchone()
            cur.close()

        # The procedure flips is_active across many accounts, which changes
        # the active_2d / inactive_count cards on EVERY mentor's overview --
        # not just the caller's. We can only safely wipe this caller's
        # caches here; other mentors will see staleness up to the 5-min TTL.
        _invalidate_mentor_caches(request.state.user["uid"])
        return JSONResponse(content=_jsonable(normalize_row(result)))
    except Exception as e:
        return _err(500, str(e))

# ---------------------------------------------------------------------------
# GET /api/mentor/admin/overloaded-mentors
# Demonstrates: GROUP BY + HAVING + INNER JOIN
# ---------------------------------------------------------------------------
@router.get("/admin/overloaded-mentors")
def get_overloaded_mentors(request: Request):
    try:
        with get_connection() as conn:
            cur = conn.cursor(dictionary=True)
            cur.execute(
                """
                SELECT 
                    m.id AS mentor_id,
                    m.name AS mentor_name, 
                    COUNT(ma.student_account_id) AS active_mentee_count
                FROM accounts m
                INNER JOIN mentor_assignments ma ON m.id = ma.mentor_account_id
                INNER JOIN accounts s ON ma.student_account_id = s.id
                WHERE m.role = 'mentor' AND s.is_active = 1
                GROUP BY m.id, m.name
                HAVING active_mentee_count > 0
                ORDER BY active_mentee_count DESC;
                """
            )
            rows = cur.fetchall()
            cur.close()
        return JSONResponse(content=_jsonable(normalize_rows(rows)))
    except Exception as e:
        return _err(500, str(e))
