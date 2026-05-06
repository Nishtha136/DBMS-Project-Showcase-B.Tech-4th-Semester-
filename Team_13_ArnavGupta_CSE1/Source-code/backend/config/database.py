"""
Single MySQL connection pool shared across the app.

Mirrors backend/db.js (Express) which used mysql2/promise with createPool().
SSL is required by Aiven; we accept their server certificate without
verifying the CA, matching the Express side's `rejectUnauthorized: false`.

Public surface:
    get_connection()  -> context manager yielding a pooled MySQLConnection
                          in autocommit mode (each .execute commits).
    transaction()     -> context manager yielding a connection that has
                          BEGUN a transaction; commits on clean exit,
                          rolls back if an exception escapes the block.
                          Equivalent of withTransaction() in
                          backend/transaction.js.
    normalize_row(s)  -> coerce mysql-connector-python types into the
                          shapes the Express side returned (Decimal -> float,
                          JSON-string `metadata` -> dict, bytes -> str).
"""
from __future__ import annotations

import json
import os
from contextlib import contextmanager
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Iterable
from urllib.parse import urlparse

import mysql.connector
from mysql.connector import pooling


# ---------------------------------------------------------------------------
# Pool config
# ---------------------------------------------------------------------------

def _config_from_env() -> dict:
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL environment variable is not set")
    parsed = urlparse(url)
    return {
        "host": parsed.hostname,
        "port": parsed.port or 3306,
        "user": parsed.username,
        "password": parsed.password,
        "database": parsed.path.lstrip("/"),
        # Aiven requires SSL; we don't verify the CA (matches the Node side).
        "ssl_disabled": False,
        "ssl_verify_cert": False,
        "ssl_verify_identity": False,
        "use_pure": True,           # pure-Python driver, no C-ext fuss
        "autocommit": True,           # default; transaction() flips it
        "charset": "utf8mb4",
        "collation": "utf8mb4_unicode_ci",
    }


_pool: pooling.MySQLConnectionPool | None = None


def _get_pool() -> pooling.MySQLConnectionPool:
    global _pool
    if _pool is None:
        _pool = pooling.MySQLConnectionPool(
            pool_name="studylabs",
            pool_size=10,
            pool_reset_session=True,
            **_config_from_env(),
        )
    return _pool


# ---------------------------------------------------------------------------
# Connection / transaction context managers
# ---------------------------------------------------------------------------

@contextmanager
def get_connection():
    """Yield a pooled connection in autocommit mode."""
    conn = _get_pool().get_connection()
    try:
        if not conn.autocommit:
            conn.autocommit = True
        yield conn
    finally:
        conn.close()  # returns to pool


@contextmanager
def transaction():
    """
    Yield a connection inside a real BEGIN/COMMIT/ROLLBACK block.

    Same contract as backend/transaction.js withTransaction(callback):
      - commits if the body returns normally
      - rolls back if the body raises (exception re-raised)
      - the connection always returns to the pool
    """
    conn = _get_pool().get_connection()
    try:
        conn.autocommit = False
        conn.start_transaction()
        try:
            yield conn
            conn.commit()
        except Exception:
            try:
                conn.rollback()
            except Exception:
                pass
            raise
    finally:
        # Reset session state before handing the conn back to the pool.
        try:
            conn.autocommit = True
        except Exception:
            pass
        conn.close()


# ---------------------------------------------------------------------------
# Row coercion
# ---------------------------------------------------------------------------
# mysql-connector-python returns Decimal for NUMERIC columns, str (or
# bytearray on some setups) for JSON columns, and datetime objects for
# DATETIME / TIMESTAMP. mysql2 in Node returned plain numbers and parsed
# JSON. Without coercion the wire format the frontend sees changes,
# which the spec forbids ("same response JSON shape").

def _normalize_value(key: str, value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, Decimal):
        return float(value)
    # datetime BEFORE date (datetime IS a date subclass, order matters).
    # Mirror mysql2 + JS Date.toJSON(): UTC ISO with millisecond precision.
    if isinstance(value, datetime):
        ms = value.microsecond // 1000
        return value.strftime("%Y-%m-%dT%H:%M:%S") + f".{ms:03d}Z"
    if isinstance(value, date):
        # DATE columns: mysql2 returned them as midnight-UTC Date objects.
        return value.strftime("%Y-%m-%dT00:00:00.000Z")
    if isinstance(value, (bytes, bytearray)):
        try:
            value = value.decode("utf-8")
        except UnicodeDecodeError:
            return value.hex()
    # `metadata` (JSON column on activity_log) -- mysql-connector-python
    # returns it as a string, but the Express side returned a parsed dict.
    if key == "metadata" and isinstance(value, str):
        try:
            return json.loads(value) if value else None
        except (ValueError, TypeError):
            return value
    return value


def normalize_row(row: dict | None) -> dict | None:
    if row is None:
        return None
    return {k: _normalize_value(k, v) for k, v in row.items()}


def normalize_rows(rows: Iterable[dict] | None) -> list[dict] | None:
    if rows is None:
        return None
    return [normalize_row(r) for r in rows]
