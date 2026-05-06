"""
routes/auth.py  --  mirrors backend/routes/auth.js
"""
from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from config.database import get_connection, transaction
from config.redis_config import cache


router = APIRouter()


# Sentinel: the user-app picked a mentor_id that is not a valid active mentor.
class _BadMentor(Exception): pass


def _err(status_code: int, message: str) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"error": message})


def _sign(uid: str, email: str) -> str:
    return jwt.encode(
        {
            "uid":   uid,
            "email": email,
            "exp":   datetime.now(timezone.utc) + timedelta(days=30),
        },
        os.environ["JWT_SECRET"],
        algorithm="HS256",
    )


# Sentinel exceptions used to short-circuit out of `transaction()` cleanly.
class _EmailTaken(Exception): pass
class _BadCreds(Exception):   pass
class _Disabled(Exception):   pass


# ---------------------------------------------------------------------------
# POST /api/auth/register
# ---------------------------------------------------------------------------
# TRANSACTION: registration writes three rows that must succeed or fail
# together -- accounts (the new user), notifications (welcome message),
# and activity_log (audit trail). A partial failure would leave a user
# without their welcome state, or audit gaps without a corresponding user.
@router.post("/register")
async def register(request: Request):
    try:
        body = await request.json()
    except Exception:
        return _err(400, "Invalid JSON body")

    name      = body.get("name")
    email     = body.get("email")
    password  = body.get("password")
    mentor_id = body.get("mentor_id")  # optional: user-app dropdown selection

    if not name or not email or not password:
        return _err(400, "name, email and password are required")
    if len(password) < 6:
        return _err(400, "Password must be at least 6 characters")

    uid = str(uuid.uuid4())
    try:
        with transaction() as conn:
            cur = conn.cursor(dictionary=True)
            # Pre-check inside the transaction so we cannot race two
            # simultaneous registrations onto the same email.
            cur.execute("SELECT id FROM accounts WHERE email = %s", (email,))
            if cur.fetchall():
                cur.close()
                raise _EmailTaken()

            # If a mentor was selected, validate inside the transaction so a
            # bad id rolls back the whole signup instead of leaving an
            # orphaned account behind.
            if mentor_id:
                cur.execute(
                    """SELECT id FROM accounts
                        WHERE id = %s AND role = 'mentor' AND is_active = 1""",
                    (mentor_id,),
                )
                if not cur.fetchall():
                    cur.close()
                    raise _BadMentor()

            password_hash = bcrypt.hashpw(
                password.encode("utf-8"), bcrypt.gensalt(rounds=12)
            ).decode("utf-8")

            # Write 1: the account itself.
            cur.execute(
                """INSERT INTO accounts (id, name, email, password_hash, role)
                   VALUES (%s, %s, %s, %s, 'student')""",
                (uid, name, email, password_hash),
            )

            # Write 2: link this student to the chosen mentor so the new
            # mentee surfaces immediately on the mentor-CRM /mentees roster.
            # The mentor_assignments.uk_one_mentor_per_student unique key
            # guarantees a student only has one mentor; since this student
            # was just inserted, no prior row can collide.
            if mentor_id:
                cur.execute(
                    """INSERT INTO mentor_assignments
                           (id, mentor_account_id, student_account_id)
                       VALUES (%s, %s, %s)""",
                    (str(uuid.uuid4()), mentor_id, uid),
                )

            # Write 3: a welcome notification.
            cur.execute(
                """INSERT INTO notifications
                       (id, account_id, type, message, link)
                   VALUES (%s, %s, 'WELCOME', %s, '/vault')""",
                (
                    str(uuid.uuid4()),
                    uid,
                    f"Welcome, {name}! Create your first subject to get started.",
                ),
            )

            # Write 4: an explicit registration audit row. (The accounts
            # INSERT trigger also writes one; this one carries richer metadata.)
            cur.execute(
                """INSERT INTO activity_log
                       (account_id, action_type, entity_type, entity_id, metadata)
                   VALUES (%s, 'REGISTER', 'account', %s, %s)""",
                (
                    uid,
                    uid,
                    json.dumps({
                        "email":     email,
                        "role":      "student",
                        "mentor_id": mentor_id,
                    }),
                ),
            )
            cur.close()

        return JSONResponse(
            status_code=201,
            content={"token": _sign(uid, email), "name": name, "email": email},
        )
    except _EmailTaken:
        return _err(409, "Email already registered")
    except _BadMentor:
        return _err(400, "Selected mentor is not available")
    except Exception as e:
        return _err(500, str(e))


# ---------------------------------------------------------------------------
# GET /api/auth/mentors
# ---------------------------------------------------------------------------
# Public list of mentors that the user-app populates its register-screen
# dropdown from. Only id + name are returned; emails and other PII are not
# exposed since this endpoint is unauthenticated.
_AUTH_MENTORS_CACHE_KEY = "auth_mentors"


@router.get("/mentors")
def list_mentors():
    try:
        # Public, non-personalised list -- single cache entry shared across
        # every register-screen open. 5 min TTL is generous since adding a
        # mentor requires a manual seed/role-flip and brand-new mentees can
        # tolerate a few minutes of staleness.
        cached = cache.get(_AUTH_MENTORS_CACHE_KEY)
        if cached is not None:
            return cached

        with get_connection() as conn:
            cur = conn.cursor(dictionary=True)
            cur.execute(
                """SELECT id, name
                     FROM accounts
                    WHERE role = 'mentor' AND is_active = 1
                    ORDER BY name ASC"""
            )
            rows = cur.fetchall()
            cur.close()

        result = {"data": rows}
        cache.set(_AUTH_MENTORS_CACHE_KEY, result, expire=300)
        return result
    except Exception as e:
        return _err(500, str(e))


# ---------------------------------------------------------------------------
# POST /api/auth/login
# ---------------------------------------------------------------------------
# TRANSACTION: SELECT to validate credentials + UPDATE last_login_at, kept
# atomic so we don't bump last_login_at unless the response actually goes
# out.
@router.post("/login")
async def login(request: Request):
    try:
        body = await request.json()
    except Exception:
        return _err(400, "Invalid JSON body")

    email    = body.get("email")
    password = body.get("password")

    if not email or not password:
        return _err(400, "email and password are required")

    try:
        with transaction() as conn:
            cur = conn.cursor(dictionary=True)
            cur.execute(
                """SELECT id, name, email, password_hash, is_active
                     FROM accounts
                    WHERE email = %s""",
                (email,),
            )
            rows = cur.fetchall()
            if not rows:
                cur.close()
                raise _BadCreds()

            user = rows[0]
            if not user["is_active"]:
                cur.close()
                raise _Disabled()

            valid = bcrypt.checkpw(
                password.encode("utf-8"),
                user["password_hash"].encode("utf-8"),
            )
            if not valid:
                cur.close()
                raise _BadCreds()

            cur.execute(
                "UPDATE accounts SET last_login_at = NOW() WHERE id = %s",
                (user["id"],),
            )
            cur.close()

        return {
            "token": _sign(user["id"], user["email"]),
            "name":  user["name"],
            "email": user["email"],
        }
    except _BadCreds:
        return _err(401, "Invalid email or password")
    except _Disabled:
        return _err(403, "Account is disabled")
    except Exception as e:
        return _err(500, str(e))
