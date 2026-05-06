"""
routes/vault_files.py  --  mirrors backend/routes/vaultFiles.js
"""
from __future__ import annotations

import json
import uuid

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from config.database import get_connection, transaction, normalize_rows, normalize_row


router = APIRouter()


def _err(status_code: int, message: str) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"error": message})


def _jsonable(value):
    from datetime import date as _date, datetime as _dt
    from decimal import Decimal as _Dec
    if value is None: return None
    if isinstance(value, _dt):  return value.isoformat()
    if isinstance(value, _date): return value.isoformat()
    if isinstance(value, _Dec): return float(value)
    if isinstance(value, dict): return {k: _jsonable(v) for k, v in value.items()}
    if isinstance(value, list): return [_jsonable(v) for v in value]
    return value


# ---------------------------------------------------------------------------
# GET /api/vault-files  [?subjectId=…]
# ---------------------------------------------------------------------------
@router.get("")
@router.get("/")
def list_vault_files(request: Request):
    try:
        subject_id = request.query_params.get("subjectId")
        with get_connection() as conn:
            cur = conn.cursor(dictionary=True)
            if subject_id:
                cur.execute(
                    """
                    SELECT
                        vf.*,
                        s.name                        AS subject_name,
                        s.color_hex                   AS subject_color,
                        UPPER(COALESCE(vf.file_type, '')) AS file_type_upper,
                        ROUND(vf.file_size_kb / 1024.0, 2) AS file_size_mb,
                        DATE_FORMAT(vf.uploaded_at, '%Y-%m-%d') AS uploaded_date
                     FROM vault_files vf
                     INNER JOIN subjects s ON s.id = vf.subject_id
                     WHERE vf.subject_id = %s
                       AND s.firebase_uid = %s
                     ORDER BY vf.uploaded_at DESC
                    """,
                    (subject_id, request.state.user["uid"]),
                )
            else:
                cur.execute(
                    """
                    SELECT
                        vf.*,
                        s.name                        AS subject_name,
                        s.color_hex                   AS subject_color,
                        UPPER(COALESCE(vf.file_type, '')) AS file_type_upper,
                        ROUND(vf.file_size_kb / 1024.0, 2) AS file_size_mb,
                        DATE_FORMAT(vf.uploaded_at, '%Y-%m-%d') AS uploaded_date
                     FROM vault_files vf
                     INNER JOIN subjects s ON s.id = vf.subject_id
                     WHERE s.firebase_uid = %s
                     ORDER BY vf.uploaded_at DESC
                    """,
                    (request.state.user["uid"],),
                )
            rows = cur.fetchall()
            cur.close()
        return normalize_rows(rows)
    except Exception as e:
        return _err(500, str(e))


# ---------------------------------------------------------------------------
# POST /api/vault-files
# ---------------------------------------------------------------------------
class _NoSubject(Exception): pass


@router.post("")
@router.post("/")
async def create_vault_file(request: Request):
    try:
        body = await request.json()
    except Exception:
        return _err(400, "Invalid JSON body")

    subject_id        = body.get("subject_id")
    note_name         = body.get("note_name")
    note_description  = body.get("note_description")
    file_name         = body.get("file_name")
    file_local_path   = body.get("file_local_path")
    file_type         = body.get("file_type")
    file_size_kb      = body.get("file_size_kb") or 0

    if not subject_id:
        return _err(400, "subject_id is required")

    fid = str(uuid.uuid4())
    try:
        with transaction() as conn:
            cur = conn.cursor(dictionary=True)
            # Owner check (correlated subquery via JOIN ensures only the
            # owner can attach files).
            cur.execute(
                "SELECT id FROM subjects WHERE id = %s AND firebase_uid = %s",
                (subject_id, request.state.user["uid"]),
            )
            if not cur.fetchall():
                cur.close()
                raise _NoSubject()

            cur.execute(
                """INSERT INTO vault_files
                       (id, subject_id, note_name, note_description, file_name,
                        file_local_path, file_type, file_size_kb)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                (fid, subject_id, note_name, note_description, file_name,
                 file_local_path, file_type, file_size_kb),
            )
            cur.execute(
                """INSERT INTO activity_log
                       (account_id, action_type, entity_type, entity_id, metadata)
                   VALUES (%s, 'CREATE', 'vault_file', %s, %s)""",
                (
                    request.state.user["uid"],
                    fid,
                    json.dumps({
                        "subject_id": subject_id,
                        "file_name":  file_name,
                        "size_kb":    file_size_kb,
                    }),
                ),
            )
            cur.execute("SELECT * FROM vault_files WHERE id = %s", (fid,))
            created = cur.fetchone()
            cur.close()

        return JSONResponse(status_code=201, content=_jsonable(normalize_row(created)))
    except _NoSubject:
        return _err(404, "Subject not found")
    except Exception as e:
        return _err(500, str(e))


# ---------------------------------------------------------------------------
# PUT /api/vault-files/:id
# ---------------------------------------------------------------------------
@router.put("/{file_id}")
async def update_vault_file(file_id: str, request: Request):
    try:
        body = await request.json()
    except Exception:
        return _err(400, "Invalid JSON body")

    note_name        = body.get("note_name")
    note_description = body.get("note_description")
    try:
        with transaction() as conn:
            cur = conn.cursor()
            cur.execute(
                """UPDATE vault_files
                      SET note_name = %s, note_description = %s
                    WHERE id = %s""",
                (note_name, note_description, file_id),
            )
            cur.execute(
                """INSERT INTO activity_log
                       (account_id, action_type, entity_type, entity_id, metadata)
                   VALUES (%s, 'UPDATE', 'vault_file', %s, %s)""",
                (
                    request.state.user["uid"],
                    file_id,
                    json.dumps({
                        "note_name":        note_name,
                        "note_description": note_description,
                    }),
                ),
            )
            cur.close()
        return {"success": True}
    except Exception as e:
        return _err(500, str(e))


# ---------------------------------------------------------------------------
# DELETE /api/vault-files/:id
# ---------------------------------------------------------------------------
@router.delete("/{file_id}")
def delete_vault_file(file_id: str, request: Request):
    try:
        with transaction() as conn:
            cur = conn.cursor()
            cur.execute("DELETE FROM vault_files WHERE id = %s", (file_id,))
            affected = cur.rowcount
            if affected and affected > 0:
                cur.execute(
                    """INSERT INTO activity_log
                           (account_id, action_type, entity_type, entity_id)
                       VALUES (%s, 'DELETE', 'vault_file', %s)""",
                    (request.state.user["uid"], file_id),
                )
            cur.close()
        return {"success": True}
    except Exception as e:
        return _err(500, str(e))
