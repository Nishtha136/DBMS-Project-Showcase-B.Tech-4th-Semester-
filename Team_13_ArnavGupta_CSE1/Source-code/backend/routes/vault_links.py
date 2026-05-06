"""
routes/vault_links.py  --  mirrors backend/routes/vaultLinks.js
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
    if isinstance(value, _dt):   return value.isoformat()
    if isinstance(value, _date): return value.isoformat()
    if isinstance(value, _Dec):  return float(value)
    if isinstance(value, dict):  return {k: _jsonable(v) for k, v in value.items()}
    if isinstance(value, list):  return [_jsonable(v) for v in value]
    return value


# ---------------------------------------------------------------------------
# GET /api/vault-links  [?subjectId=…]
# ---------------------------------------------------------------------------
@router.get("")
@router.get("/")
def list_vault_links(request: Request):
    try:
        subject_id = request.query_params.get("subjectId")
        with get_connection() as conn:
            cur = conn.cursor(dictionary=True)
            if subject_id:
                cur.execute(
                    """
                    SELECT
                        vl.*,
                        s.name      AS subject_name,
                        s.color_hex AS subject_color,
                        LENGTH(vl.url)                       AS url_length,
                        DATE_FORMAT(vl.added_at, '%Y-%m-%d') AS added_date
                     FROM vault_links vl
                     INNER JOIN subjects s ON s.id = vl.subject_id
                     WHERE vl.subject_id = %s
                       AND s.firebase_uid = %s
                     ORDER BY vl.added_at DESC
                    """,
                    (subject_id, request.state.user["uid"]),
                )
            else:
                cur.execute(
                    """
                    SELECT
                        vl.*,
                        s.name      AS subject_name,
                        s.color_hex AS subject_color,
                        LENGTH(vl.url)                       AS url_length,
                        DATE_FORMAT(vl.added_at, '%Y-%m-%d') AS added_date
                     FROM vault_links vl
                     INNER JOIN subjects s ON s.id = vl.subject_id
                     WHERE s.firebase_uid = %s
                     ORDER BY vl.added_at DESC
                    """,
                    (request.state.user["uid"],),
                )
            rows = cur.fetchall()
            cur.close()
        return normalize_rows(rows)
    except Exception as e:
        return _err(500, str(e))


# ---------------------------------------------------------------------------
# POST /api/vault-links
# ---------------------------------------------------------------------------
class _NoSubject(Exception): pass


@router.post("")
@router.post("/")
async def create_vault_link(request: Request):
    try:
        body = await request.json()
    except Exception:
        return _err(400, "Invalid JSON body")

    subject_id = body.get("subject_id")
    link_name  = body.get("link_name")
    url        = body.get("url")

    if not subject_id or not url:
        return _err(400, "subject_id and url are required")

    lid = str(uuid.uuid4())
    try:
        with transaction() as conn:
            cur = conn.cursor(dictionary=True)
            cur.execute(
                "SELECT id FROM subjects WHERE id = %s AND firebase_uid = %s",
                (subject_id, request.state.user["uid"]),
            )
            if not cur.fetchall():
                cur.close()
                raise _NoSubject()

            cur.execute(
                """INSERT INTO vault_links (id, subject_id, link_name, url)
                   VALUES (%s, %s, %s, %s)""",
                (lid, subject_id, link_name, url),
            )
            cur.execute(
                """INSERT INTO activity_log
                       (account_id, action_type, entity_type, entity_id, metadata)
                   VALUES (%s, 'CREATE', 'vault_link', %s, %s)""",
                (
                    request.state.user["uid"],
                    lid,
                    json.dumps({
                        "subject_id": subject_id,
                        "url":        url,
                        "link_name":  link_name,
                    }),
                ),
            )
            cur.execute("SELECT * FROM vault_links WHERE id = %s", (lid,))
            created = cur.fetchone()
            cur.close()

        return JSONResponse(status_code=201, content=_jsonable(normalize_row(created)))
    except _NoSubject:
        return _err(404, "Subject not found")
    except Exception as e:
        return _err(500, str(e))


# ---------------------------------------------------------------------------
# PUT /api/vault-links/:id
# ---------------------------------------------------------------------------
@router.put("/{link_id}")
async def update_vault_link(link_id: str, request: Request):
    try:
        body = await request.json()
    except Exception:
        return _err(400, "Invalid JSON body")

    link_name = body.get("link_name")
    url       = body.get("url")
    try:
        with transaction() as conn:
            cur = conn.cursor()
            cur.execute(
                "UPDATE vault_links SET link_name = %s, url = %s WHERE id = %s",
                (link_name, url, link_id),
            )
            cur.execute(
                """INSERT INTO activity_log
                       (account_id, action_type, entity_type, entity_id, metadata)
                   VALUES (%s, 'UPDATE', 'vault_link', %s, %s)""",
                (
                    request.state.user["uid"],
                    link_id,
                    json.dumps({"link_name": link_name, "url": url}),
                ),
            )
            cur.close()
        return {"success": True}
    except Exception as e:
        return _err(500, str(e))


# ---------------------------------------------------------------------------
# DELETE /api/vault-links/:id
# ---------------------------------------------------------------------------
@router.delete("/{link_id}")
def delete_vault_link(link_id: str, request: Request):
    try:
        with transaction() as conn:
            cur = conn.cursor()
            cur.execute("DELETE FROM vault_links WHERE id = %s", (link_id,))
            affected = cur.rowcount
            if affected and affected > 0:
                cur.execute(
                    """INSERT INTO activity_log
                           (account_id, action_type, entity_type, entity_id)
                       VALUES (%s, 'DELETE', 'vault_link', %s)""",
                    (request.state.user["uid"], link_id),
                )
            cur.close()
        return {"success": True}
    except Exception as e:
        return _err(500, str(e))
