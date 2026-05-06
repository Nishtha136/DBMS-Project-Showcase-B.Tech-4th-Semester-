"""
Auth middleware -- Express parity.

  verify_auth   <-> backend/middleware/auth.js
  verify_mentor <-> backend/middleware/mentorAuth.js

Both raise APIError on failure; main.py registers a handler that turns
APIError into the Express-style {"error": "..."} JSON body. Dependencies
attach the resolved user dict to ``request.state.user`` so route handlers
can read it the same way the Express handlers read req.user.
"""
from __future__ import annotations

import os

import jwt
from fastapi import Request

from config.database import get_connection


class APIError(Exception):
    """Express-style error: {status_code, body={"error": message}}."""

    def __init__(self, status_code: int, message: str) -> None:
        self.status_code = status_code
        self.message = message
        super().__init__(message)


def _decode_bearer(authorization: str | None) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise APIError(401, "Missing auth token")
    token = authorization.split("Bearer ", 1)[1].strip()
    try:
        return jwt.decode(token, os.environ["JWT_SECRET"], algorithms=["HS256"])
    except jwt.PyJWTError:
        raise APIError(401, "Invalid or expired token")


def verify_auth(request: Request) -> dict:
    """JWT + account-existence check. Sets request.state.user = {"uid", "email"}."""
    decoded = _decode_bearer(request.headers.get("authorization"))
    uid = decoded.get("uid")
    with get_connection() as conn:
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT id, email FROM accounts WHERE id = %s", (uid,))
        rows = cur.fetchall()
        cur.close()
    if not rows:
        raise APIError(401, "Account not found")
    user = {"uid": rows[0]["id"], "email": rows[0]["email"]}
    request.state.user = user
    return user


def verify_mentor(request: Request) -> dict:
    """
    JWT + a fresh DB lookup of accounts.role.

    Mirrors mentorAuth.js: rejects with 401 for missing/invalid token or
    missing account, 403 for is_active=0 or role!=mentor.
    """
    decoded = _decode_bearer(request.headers.get("authorization"))
    with get_connection() as conn:
        cur = conn.cursor(dictionary=True)
        cur.execute(
            "SELECT id, name, email, role, is_active FROM accounts WHERE id = %s",
            (decoded.get("uid"),),
        )
        rows = cur.fetchall()
        cur.close()

    if not rows:
        raise APIError(401, "Account not found")
    acct = rows[0]
    if not acct["is_active"]:
        raise APIError(403, "Account is disabled")
    if acct["role"] != "mentor":
        raise APIError(403, "Mentor role required")

    user = {
        "uid":   acct["id"],
        "email": acct["email"],
        "role":  acct["role"],
        "name":  acct["name"],
    }
    request.state.user = user
    return user
