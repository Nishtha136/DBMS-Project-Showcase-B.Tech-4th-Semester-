"""
routes/student.py  --  endpoints the Android mentee app calls to push and
pull its own tasks / assessments / check-ins.

Mounted under /api/student with verify_auth applied at router level. Every
write hardcodes student_id = JWT.uid; the request body cannot specify a
different account.

What lives where:
    /api/student/tasks            -> mentor_tasks (mentor_id NULL = self-task)
    /api/student/assessments      -> assessments  (mentor_id NULL = self-task)
    /api/student/check-ins        -> check_ins
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


router = APIRouter()


def _err(status_code: int, message: str) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"error": message})


def _jsonable(value):
    if value is None: return None
    if isinstance(value, _dt):   return value.isoformat()
    if isinstance(value, _date): return value.isoformat()
    if isinstance(value, _Dec):  return float(value)
    if isinstance(value, dict):  return {k: _jsonable(v) for k, v in value.items()}
    if isinstance(value, list):  return [_jsonable(v) for v in value]
    return value


# ============================================================================
# TASKS  (mentor_tasks, with mentor_id NULL meaning self-tracked)
# ============================================================================

# GET /api/student/tasks
# Returns every task assigned to me (mentor-assigned + self-tracked).
@router.get("/tasks")
def list_tasks(request: Request):
    try:
        with get_connection() as conn:
            cur = conn.cursor(dictionary=True)
            cur.execute(
                """SELECT mt.id, mt.title, mt.description,
                          mt.due_date, mt.priority, mt.status,
                          mt.mentor_id,
                          (mt.mentor_id IS NULL)        AS is_self,
                          mt.created_at, mt.updated_at,
                          a.name  AS mentor_name
                     FROM mentor_tasks mt
                     LEFT JOIN accounts a ON a.id = mt.mentor_id
                    WHERE mt.student_id = %s
                    ORDER BY
                      CASE mt.status WHEN 'pending'     THEN 1
                                     WHEN 'in_progress' THEN 2
                                     WHEN 'done'        THEN 3
                                     ELSE 4 END,
                      mt.due_date IS NULL,
                      mt.due_date ASC,
                      mt.created_at DESC""",
                (request.state.user["uid"],),
            )
            rows = cur.fetchall()
            cur.close()
        return JSONResponse(content=_jsonable(normalize_rows(rows)))
    except Exception as e:
        return _err(500, str(e))


# POST /api/student/tasks
# Body: { title, description?, due_date?, priority? }
# Always written with mentor_id = NULL (self-tracked). If a student wants
# to update a mentor-assigned task, use PATCH /tasks/:id.
@router.post("/tasks")
async def create_task(request: Request):
    try:
        body = await request.json()
    except Exception:
        return _err(400, "Invalid JSON body")

    title       = body.get("title")
    description = body.get("description")
    due_date    = body.get("due_date")
    priority    = body.get("priority")

    if not title or not str(title).strip():
        return _err(400, "title is required")
    safe_priority = priority if priority in ("low", "medium", "high") else "medium"

    tid = str(uuid.uuid4())
    try:
        with transaction() as conn:
            cur = conn.cursor(dictionary=True)
            cur.execute(
                """INSERT INTO mentor_tasks
                       (id, mentor_id, student_id, title, description,
                        due_date, priority, status)
                   VALUES (%s, NULL, %s, %s, %s, %s, %s, 'pending')""",
                (tid, request.state.user["uid"], str(title).strip(),
                 description, due_date, safe_priority),
            )
            cur.execute(
                """SELECT mt.id, mt.title, mt.description, mt.due_date,
                          mt.priority, mt.status, mt.mentor_id,
                          (mt.mentor_id IS NULL) AS is_self,
                          mt.created_at, mt.updated_at
                     FROM mentor_tasks mt WHERE mt.id = %s""",
                (tid,),
            )
            created = cur.fetchone()
            cur.close()
        return JSONResponse(status_code=201,
                            content=_jsonable(normalize_row(created)))
    except Exception as e:
        return _err(500, str(e))


# PATCH /api/student/tasks/:id
# Students can update any of their own tasks (whether mentor-assigned or
# self-tracked). Authorization: mt.student_id must match JWT.uid.
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

    try:
        with transaction() as conn:
            cur = conn.cursor()
            cur.execute(
                """UPDATE mentor_tasks
                      SET title       = COALESCE(%s, title),
                          description = COALESCE(%s, description),
                          due_date    = COALESCE(%s, due_date),
                          priority    = COALESCE(%s, priority),
                          status      = COALESCE(%s, status)
                    WHERE id = %s AND student_id = %s""",
                (title or None, description or None, due_date or None,
                 priority or None, status or None,
                 task_id, request.state.user["uid"]),
            )
            if cur.rowcount == 0:
                cur.close()
                return _err(404, "Task not found")
            cur.execute(
                """INSERT INTO activity_log
                       (account_id, action_type, entity_type, entity_id, metadata)
                   VALUES (%s, 'STUDENT_UPDATE_TASK', 'mentor_task', %s, %s)""",
                (request.state.user["uid"], task_id, json.dumps(body)),
            )
            cur.close()
        return {"success": True}
    except Exception as e:
        return _err(500, str(e))


# DELETE /api/student/tasks/:id
# Only allowed for self-tracked tasks (mentor_id IS NULL). Mentor-assigned
# tasks have to be removed by the mentor.
@router.delete("/tasks/{task_id}")
def delete_task(task_id: str, request: Request):
    try:
        with transaction() as conn:
            cur = conn.cursor()
            cur.execute(
                """DELETE FROM mentor_tasks
                    WHERE id = %s AND student_id = %s AND mentor_id IS NULL""",
                (task_id, request.state.user["uid"]),
            )
            if cur.rowcount == 0:
                cur.close()
                return _err(404, "Self-tracked task not found")
            cur.close()
        return {"success": True}
    except Exception as e:
        return _err(500, str(e))


# ============================================================================
# ASSESSMENTS
# ============================================================================

@router.get("/assessments")
def list_assessments(request: Request):
    try:
        with get_connection() as conn:
            cur = conn.cursor(dictionary=True)
            cur.execute(
                """SELECT a.id, a.type, a.title, a.notes,
                          a.due_at, a.is_done, a.score, a.max_score,
                          a.subject_id,
                          a.mentor_id,
                          (a.mentor_id IS NULL) AS is_self,
                          a.created_at, a.updated_at,
                          s.name      AS subject_name,
                          s.color_hex AS subject_color,
                          m.name      AS mentor_name
                     FROM assessments a
                     LEFT JOIN subjects s ON s.id = a.subject_id
                     LEFT JOIN accounts m ON m.id = a.mentor_id
                    WHERE a.student_id = %s
                    ORDER BY a.is_done ASC,
                             a.due_at IS NULL,
                             a.due_at ASC,
                             a.created_at DESC""",
                (request.state.user["uid"],),
            )
            rows = cur.fetchall()
            cur.close()
        return JSONResponse(content=_jsonable(normalize_rows(rows)))
    except Exception as e:
        return _err(500, str(e))


# POST /api/student/assessments
# Body: { type, title, notes?, due_at?, max_score?, subject_id? }
# Writes mentor_id NULL (self-tracked).
@router.post("/assessments")
async def create_assessment(request: Request):
    try:
        body = await request.json()
    except Exception:
        return _err(400, "Invalid JSON body")

    type_  = body.get("type") or "assignment"
    title  = body.get("title")
    notes  = body.get("notes")
    due_at = body.get("due_at")
    max_score  = body.get("max_score")
    subject_id = body.get("subject_id")

    if not title or not str(title).strip():
        return _err(400, "title is required")
    if type_ not in ("quiz", "exam", "assignment", "project"):
        return _err(400, "type must be quiz / exam / assignment / project")

    aid = str(uuid.uuid4())
    try:
        with transaction() as conn:
            cur = conn.cursor(dictionary=True)
            # Optional: confirm subject ownership.
            if subject_id:
                cur.execute(
                    "SELECT id FROM subjects WHERE id = %s AND firebase_uid = %s",
                    (subject_id, request.state.user["uid"]),
                )
                if not cur.fetchall():
                    cur.close()
                    return _err(404, "Subject not found")

            cur.execute(
                """INSERT INTO assessments
                       (id, student_id, mentor_id, subject_id, type, title,
                        notes, due_at, is_done, max_score)
                   VALUES (%s, %s, NULL, %s, %s, %s, %s, %s, 0, %s)""",
                (aid, request.state.user["uid"], subject_id, type_,
                 str(title).strip(), notes, due_at, max_score),
            )
            cur.execute(
                """SELECT a.id, a.type, a.title, a.notes, a.due_at,
                          a.is_done, a.score, a.max_score,
                          a.subject_id, a.mentor_id,
                          (a.mentor_id IS NULL) AS is_self,
                          a.created_at, a.updated_at
                     FROM assessments a WHERE a.id = %s""",
                (aid,),
            )
            created = cur.fetchone()
            cur.close()
        return JSONResponse(status_code=201,
                            content=_jsonable(normalize_row(created)))
    except Exception as e:
        return _err(500, str(e))


# PATCH /api/student/assessments/:id
@router.patch("/assessments/{assessment_id}")
async def update_assessment(assessment_id: str, request: Request):
    try:
        body = await request.json()
    except Exception:
        return _err(400, "Invalid JSON body")

    type_     = body.get("type")
    title     = body.get("title")
    notes     = body.get("notes")
    due_at    = body.get("due_at")
    is_done   = body.get("is_done")
    score     = body.get("score")
    max_score = body.get("max_score")

    try:
        with transaction() as conn:
            cur = conn.cursor()
            cur.execute(
                """UPDATE assessments
                      SET type      = COALESCE(%s, type),
                          title     = COALESCE(%s, title),
                          notes     = COALESCE(%s, notes),
                          due_at    = COALESCE(%s, due_at),
                          is_done   = COALESCE(%s, is_done),
                          score     = COALESCE(%s, score),
                          max_score = COALESCE(%s, max_score)
                    WHERE id = %s AND student_id = %s""",
                (type_ or None, title or None, notes or None, due_at or None,
                 is_done, score, max_score,
                 assessment_id, request.state.user["uid"]),
            )
            if cur.rowcount == 0:
                cur.close()
                return _err(404, "Assessment not found")
            cur.close()
        return {"success": True}
    except Exception as e:
        return _err(500, str(e))


# DELETE /api/student/assessments/:id  --  self-tracked only.
@router.delete("/assessments/{assessment_id}")
def delete_assessment(assessment_id: str, request: Request):
    try:
        with transaction() as conn:
            cur = conn.cursor()
            cur.execute(
                """DELETE FROM assessments
                    WHERE id = %s AND student_id = %s AND mentor_id IS NULL""",
                (assessment_id, request.state.user["uid"]),
            )
            if cur.rowcount == 0:
                cur.close()
                return _err(404, "Self-tracked assessment not found")
            cur.close()
        return {"success": True}
    except Exception as e:
        return _err(500, str(e))


# ============================================================================
# CHECK-INS
# ============================================================================

@router.get("/check-ins")
def list_check_ins(request: Request):
    try:
        try:
            limit = min(200, max(1, int(request.query_params.get("limit") or "50")))
        except (TypeError, ValueError):
            limit = 50
        with get_connection() as conn:
            cur = conn.cursor(dictionary=True)
            cur.execute(
                """SELECT id, experiment_local_id, date_at,
                          metric_values, notes, created_at, updated_at
                     FROM check_ins
                    WHERE student_id = %s
                    ORDER BY date_at DESC
                    LIMIT %s""",
                (request.state.user["uid"], limit),
            )
            rows = cur.fetchall()
            cur.close()
        # `metric_values` is a JSON column -- normalize_row leaves it alone
        # (it isn't named "metadata"), so parse here.
        for r in rows:
            mv = r.get("metric_values")
            if isinstance(mv, str) and mv:
                try: r["metric_values"] = json.loads(mv)
                except Exception: pass
        return JSONResponse(content=_jsonable(normalize_rows(rows)))
    except Exception as e:
        return _err(500, str(e))


@router.post("/check-ins")
async def create_check_in(request: Request):
    try:
        body = await request.json()
    except Exception:
        return _err(400, "Invalid JSON body")

    experiment_local_id = body.get("experiment_local_id")
    date_at             = body.get("date_at")
    metric_values       = body.get("metric_values")
    notes               = body.get("notes")

    if not date_at:
        return _err(400, "date_at is required")

    cid = str(uuid.uuid4())
    mv_json = (json.dumps(metric_values)
               if metric_values is not None else None)

    try:
        with transaction() as conn:
            cur = conn.cursor(dictionary=True)
            cur.execute(
                """INSERT INTO check_ins
                       (id, student_id, experiment_local_id, date_at,
                        metric_values, notes)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (cid, request.state.user["uid"], experiment_local_id,
                 date_at, mv_json, notes),
            )
            cur.execute(
                """SELECT id, experiment_local_id, date_at,
                          metric_values, notes, created_at, updated_at
                     FROM check_ins WHERE id = %s""",
                (cid,),
            )
            created = cur.fetchone()
            cur.close()
        if created and isinstance(created.get("metric_values"), str):
            try: created["metric_values"] = json.loads(created["metric_values"])
            except Exception: pass
        return JSONResponse(status_code=201,
                            content=_jsonable(normalize_row(created)))
    except Exception as e:
        return _err(500, str(e))


@router.patch("/check-ins/{check_in_id}")
async def update_check_in(check_in_id: str, request: Request):
    try:
        body = await request.json()
    except Exception:
        return _err(400, "Invalid JSON body")

    date_at       = body.get("date_at")
    metric_values = body.get("metric_values")
    notes         = body.get("notes")

    mv_json = (json.dumps(metric_values)
               if metric_values is not None else None)
    try:
        with transaction() as conn:
            cur = conn.cursor()
            cur.execute(
                """UPDATE check_ins
                      SET date_at        = COALESCE(%s, date_at),
                          metric_values  = COALESCE(%s, metric_values),
                          notes          = COALESCE(%s, notes)
                    WHERE id = %s AND student_id = %s""",
                (date_at or None, mv_json, notes or None,
                 check_in_id, request.state.user["uid"]),
            )
            if cur.rowcount == 0:
                cur.close()
                return _err(404, "Check-in not found")
            cur.close()
        return {"success": True}
    except Exception as e:
        return _err(500, str(e))


@router.delete("/check-ins/{check_in_id}")
def delete_check_in(check_in_id: str, request: Request):
    try:
        with transaction() as conn:
            cur = conn.cursor()
            cur.execute(
                "DELETE FROM check_ins WHERE id = %s AND student_id = %s",
                (check_in_id, request.state.user["uid"]),
            )
            if cur.rowcount == 0:
                cur.close()
                return _err(404, "Check-in not found")
            cur.close()
        return {"success": True}
    except Exception as e:
        return _err(500, str(e))
