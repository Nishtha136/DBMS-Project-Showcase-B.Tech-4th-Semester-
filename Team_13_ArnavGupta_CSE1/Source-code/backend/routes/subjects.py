"""
routes/subjects.py  --  mirrors backend/routes/subjects.js

Mounted under /api/subjects with verify_auth applied at router level
(see main.py). request.state.user.uid is always set.
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from config.database import get_connection, transaction, normalize_rows, normalize_row


router = APIRouter()


def _err(status_code: int, message: str) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"error": message})


# ---------------------------------------------------------------------------
# GET /api/subjects
# ---------------------------------------------------------------------------
# Upgraded SELECT: LEFT JOINs to vault_files and vault_links plus an
# aggregated GROUP BY so the listing carries file_count, link_count, total
# storage, and last-activity timestamp.
@router.get("")
@router.get("/")
def list_subjects(request: Request):
    try:
        with get_connection() as conn:
            cur = conn.cursor(dictionary=True)
            cur.execute(
                """
                SELECT
                    s.id,
                    s.firebase_uid,
                    s.name,
                    s.color_hex,
                    s.color_light_hex,
                    s.created_at,
                    COALESCE(s.is_archived, 0)            AS is_archived,
                    COUNT(DISTINCT vf.id)                  AS file_count,
                    COUNT(DISTINCT vl.id)                  AS link_count,
                    COALESCE(SUM(vf.file_size_kb), 0)      AS total_storage_kb,
                    ROUND(COALESCE(SUM(vf.file_size_kb), 0) / NULLIF(1024, 0), 2)
                                                           AS total_storage_mb,
                    /* Scalar subquery (UNION inside a derived table) gives the
                       most recent activity across both children. */
                    (
                        SELECT MAX(latest) FROM (
                            SELECT MAX(uploaded_at) AS latest
                              FROM vault_files
                             WHERE subject_id = s.id
                            UNION ALL
                            SELECT MAX(added_at) AS latest
                              FROM vault_links
                             WHERE subject_id = s.id
                        ) sub
                    )                                       AS last_activity_at
                 FROM subjects s
                 LEFT JOIN vault_files vf ON vf.subject_id = s.id
                 LEFT JOIN vault_links vl ON vl.subject_id = s.id
                 WHERE s.firebase_uid = %s
                   AND COALESCE(s.is_archived, 0) = 0
                 GROUP BY s.id, s.firebase_uid, s.name, s.color_hex,
                          s.color_light_hex, s.created_at, s.is_archived
                 ORDER BY s.created_at DESC
                """,
                (request.state.user["uid"],),
            )
            rows = cur.fetchall()
            cur.close()
        return normalize_rows(rows)
    except Exception as e:
        return _err(500, str(e))


# ---------------------------------------------------------------------------
# POST /api/subjects
# ---------------------------------------------------------------------------
# TRANSACTION: subjects INSERT + activity_log INSERT must commit together.
@router.post("")
@router.post("/")
async def create_subject(request: Request):
    try:
        body = await request.json()
    except Exception:
        return _err(400, "Invalid JSON body")

    name             = body.get("name")
    color_hex        = body.get("color_hex")
    color_light_hex  = body.get("color_light_hex")

    if not name:
        return _err(400, "name is required")

    sid = str(uuid.uuid4())
    try:
        with transaction() as conn:
            cur = conn.cursor(dictionary=True)
            cur.execute(
                """INSERT INTO subjects
                       (id, firebase_uid, name, color_hex, color_light_hex)
                   VALUES (%s, %s, %s, %s, %s)""",
                (
                    sid,
                    request.state.user["uid"],
                    name,
                    color_hex       or "#22C1A8",
                    color_light_hex or "#E1F7F2",
                ),
            )
            cur.execute("SELECT * FROM subjects WHERE id = %s", (sid,))
            created = cur.fetchone()
            cur.close()

        return JSONResponse(status_code=201, content=_jsonable(normalize_row(created)))
    except Exception as e:
        return _err(500, str(e))


# ---------------------------------------------------------------------------
# DELETE /api/subjects/:id
# ---------------------------------------------------------------------------
@router.delete("/{subject_id}")
def delete_subject(subject_id: str, request: Request):
    try:
        with transaction() as conn:
            cur = conn.cursor()
            cur.execute(
                "DELETE FROM subjects WHERE id = %s AND firebase_uid = %s",
                (subject_id, request.state.user["uid"]),
            )
            affected = cur.rowcount
            if affected and affected > 0:
                cur.execute(
                    """INSERT INTO activity_log
                           (account_id, action_type, entity_type, entity_id, metadata)
                       VALUES (%s, 'DELETE', 'subject', %s, %s)""",
                    (
                        request.state.user["uid"],
                        subject_id,
                        json.dumps({"deleted_at": datetime.now(timezone.utc).isoformat()}),
                    ),
                )
            cur.close()
        return {"success": True}
    except Exception as e:
        return _err(500, str(e))


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _jsonable(value):
    """Recursively turn datetime/Decimal/etc. into JSON-safe primitives."""
    from datetime import date as _date, datetime as _dt
    from decimal import Decimal as _Dec

    if value is None:
        return None
    if isinstance(value, _dt):
        return value.isoformat()
    if isinstance(value, _date):
        return value.isoformat()
    if isinstance(value, _Dec):
        return float(value)
    if isinstance(value, dict):
        return {k: _jsonable(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_jsonable(v) for v in value]
    return value
