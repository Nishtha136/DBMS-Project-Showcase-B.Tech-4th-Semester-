"""
routes/study.py  --  endpoints the Android mentee app calls to log study
sessions and focus-mode events.

Mounted under /api/study with verify_auth applied at router level
(any logged-in account can post their OWN sessions; the JWT.uid is
always treated as the student_id, never trusted from the request body).
"""
from __future__ import annotations

import json
import uuid

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from config.database import (
    get_connection, transaction, normalize_row, normalize_rows,
)


router = APIRouter()


def _err(status_code: int, message: str) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"error": message})


def _jsonable(value):
    from datetime import date as _date, datetime as _dt
    from decimal import Decimal as _Dec
    if value is None: return None
    if isinstance(value, _dt):   return value.isoformat()
    if isinstance(value, _date): return value.isoformat()
    if isinstance(value, _Dec):  return float(value)
    if isinstance(value, dict):  return {k: _jsonable(v) for k, v in value.items()}
    if isinstance(value, list):  return [_jsonable(v) for v in value]
    return value


# ---------------------------------------------------------------------------
# POST /api/study/sessions/start
# ---------------------------------------------------------------------------
# Body: { subject_id?: str, subject_label?: str, started_at?: ISO datetime }
# Returns: { id, started_at }
# The id should be passed back on /end. started_at defaults to NOW() if omitted.
@router.post("/sessions/start")
async def start_session(request: Request):
    try:
        body = await request.json() if (await request.body()) else {}
    except Exception:
        body = {}

    subject_id    = body.get("subject_id")
    subject_label = body.get("subject_label")
    started_at    = body.get("started_at")  # ISO string or None

    sid = str(uuid.uuid4())
    try:
        with transaction() as conn:
            cur = conn.cursor(dictionary=True)
            # Subject ownership check (if a subject_id was provided).
            if subject_id:
                cur.execute(
                    "SELECT id FROM subjects WHERE id = %s AND firebase_uid = %s",
                    (subject_id, request.state.user["uid"]),
                )
                if not cur.fetchall():
                    cur.close()
                    return _err(404, "Subject not found")

            if started_at:
                cur.execute(
                    """INSERT INTO study_sessions
                           (id, student_id, subject_id, subject_label, started_at)
                       VALUES (%s, %s, %s, %s, %s)""",
                    (sid, request.state.user["uid"], subject_id, subject_label, started_at),
                )
            else:
                cur.execute(
                    """INSERT INTO study_sessions
                           (id, student_id, subject_id, subject_label, started_at)
                       VALUES (%s, %s, %s, %s, NOW())""",
                    (sid, request.state.user["uid"], subject_id, subject_label),
                )
            cur.execute(
                "SELECT id, student_id, subject_id, subject_label, started_at FROM study_sessions WHERE id = %s",
                (sid,),
            )
            row = cur.fetchone()
            cur.close()
        return JSONResponse(status_code=201, content=_jsonable(normalize_row(row)))
    except Exception as e:
        return _err(500, str(e))


# ---------------------------------------------------------------------------
# POST /api/study/sessions/end
# ---------------------------------------------------------------------------
# Body: { id: required, ended_at?: ISO, focus_seconds?: int, notes?: str }
@router.post("/sessions/end")
async def end_session(request: Request):
    try:
        body = await request.json()
    except Exception:
        return _err(400, "Invalid JSON body")

    sid           = body.get("id")
    ended_at      = body.get("ended_at")
    focus_seconds = body.get("focus_seconds")
    notes         = body.get("notes")

    if not sid:
        return _err(400, "id is required")

    try:
        with transaction() as conn:
            cur = conn.cursor(dictionary=True)
            # Authorisation: the caller must own this session.
            cur.execute(
                "SELECT id, ended_at FROM study_sessions WHERE id = %s AND student_id = %s",
                (sid, request.state.user["uid"]),
            )
            existing = cur.fetchall()
            if not existing:
                cur.close()
                return _err(404, "Session not found")
            if existing[0]["ended_at"] is not None:
                cur.close()
                return _err(409, "Session already ended")

            if ended_at:
                cur.execute(
                    """UPDATE study_sessions
                          SET ended_at      = %s,
                              focus_seconds = COALESCE(%s, focus_seconds),
                              notes         = COALESCE(%s, notes)
                        WHERE id = %s""",
                    (ended_at, focus_seconds, notes, sid),
                )
            else:
                cur.execute(
                    """UPDATE study_sessions
                          SET ended_at      = NOW(),
                              focus_seconds = COALESCE(%s, focus_seconds),
                              notes         = COALESCE(%s, notes)
                        WHERE id = %s""",
                    (focus_seconds, notes, sid),
                )

            cur.execute("SELECT * FROM study_sessions WHERE id = %s", (sid,))
            row = cur.fetchone()
            cur.close()
        return JSONResponse(content=_jsonable(normalize_row(row)))
    except Exception as e:
        return _err(500, str(e))


# ---------------------------------------------------------------------------
# POST /api/study/focus-events
# ---------------------------------------------------------------------------
# Body: { event_type: 'enabled'|'disabled', session_id?: str, event_at?: ISO }
@router.post("/focus-events")
async def log_focus_event(request: Request):
    try:
        body = await request.json()
    except Exception:
        return _err(400, "Invalid JSON body")

    event_type = body.get("event_type")
    session_id = body.get("session_id")
    event_at   = body.get("event_at")
    metadata   = body.get("metadata")

    if event_type not in ("enabled", "disabled"):
        return _err(400, "event_type must be 'enabled' or 'disabled'")

    eid = str(uuid.uuid4())
    try:
        with transaction() as conn:
            cur = conn.cursor()
            # If a session_id is supplied, verify ownership.
            if session_id:
                cur.execute(
                    "SELECT id FROM study_sessions WHERE id = %s AND student_id = %s",
                    (session_id, request.state.user["uid"]),
                )
                if not cur.fetchall():
                    cur.close()
                    return _err(404, "Session not found")

            md_json = json.dumps(metadata) if metadata is not None else None
            if event_at:
                cur.execute(
                    """INSERT INTO focus_mode_events
                           (id, session_id, student_id, event_type, event_at, metadata)
                       VALUES (%s, %s, %s, %s, %s, %s)""",
                    (eid, session_id, request.state.user["uid"], event_type, event_at, md_json),
                )
            else:
                cur.execute(
                    """INSERT INTO focus_mode_events
                           (id, session_id, student_id, event_type, metadata)
                       VALUES (%s, %s, %s, %s, %s)""",
                    (eid, session_id, request.state.user["uid"], event_type, md_json),
                )
            cur.close()
        return JSONResponse(status_code=201, content={"id": eid})
    except Exception as e:
        return _err(500, str(e))


# ---------------------------------------------------------------------------
# GET /api/study/sessions/mine?limit=20
# ---------------------------------------------------------------------------
@router.get("/sessions/mine")
def my_sessions(request: Request):
    try:
        try:
            limit = min(100, max(1, int(request.query_params.get("limit") or "20")))
        except (TypeError, ValueError):
            limit = 20
        with get_connection() as conn:
            cur = conn.cursor(dictionary=True)
            cur.execute(
                """SELECT ss.id, ss.subject_id, ss.subject_label,
                          ss.started_at, ss.ended_at,
                          ss.duration_minutes, ss.focus_seconds, ss.notes,
                          s.name AS subject_name
                     FROM study_sessions ss
                     LEFT JOIN subjects s ON s.id = ss.subject_id
                    WHERE ss.student_id = %s
                    ORDER BY ss.started_at DESC
                    LIMIT %s""",
                (request.state.user["uid"], limit),
            )
            rows = cur.fetchall()
            cur.close()
        return JSONResponse(content=_jsonable(normalize_rows(rows)))
    except Exception as e:
        return _err(500, str(e))
