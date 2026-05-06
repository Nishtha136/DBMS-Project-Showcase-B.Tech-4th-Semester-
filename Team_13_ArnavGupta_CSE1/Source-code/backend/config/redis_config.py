import os
import redis
import json
from typing import Optional, Any

# Get Redis URL from environment or default to localhost
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

class RedisCache:
    def __init__(self):
        self._client = None
        # Mask the password segment of the URL before logging so .env
        # leaks don't end up in stdout / shared screenshots.
        safe_url = REDIS_URL
        if "@" in REDIS_URL and "://" in REDIS_URL:
            scheme, rest = REDIS_URL.split("://", 1)
            host_part = rest.split("@", 1)[1]
            safe_url = f"{scheme}://***@{host_part}"

        try:
            self._client = redis.from_url(REDIS_URL, decode_responses=True)
            self._client.ping()
            print(f"[REDIS] OK   connected -> {safe_url}")
        except Exception as e:
            print(f"[REDIS] FAIL not connected ({safe_url}) -- "
                  f"endpoints will hit MySQL every request. Reason: {e}")
            self._client = None

    @property
    def is_connected(self) -> bool:
        """True if Redis pinged successfully at startup. Used by /health
        and any diagnostics endpoint that wants to surface cache status."""
        return self._client is not None

    def get(self, key: str) -> Optional[Any]:
        if not self._client:
            return None
        try:
            data = self._client.get(key)
            return json.loads(data) if data else None
        except Exception:
            return None

    def set(self, key: str, value: Any, expire: int = 300):
        if not self._client:
            return
        try:
            self._client.set(key, json.dumps(value), ex=expire)
        except Exception:
            pass

    def delete(self, key: str):
        if not self._client:
            return
        try:
            self._client.delete(key)
        except Exception:
            pass

    def delete_pattern(self, pattern: str):
        """Wipe every key matching a glob pattern (e.g. "mentor_leaderboard:UID:*").

        Uses SCAN in batches so a large keyspace cannot block Redis the way a
        bare KEYS call would. Silently no-ops if Redis is unavailable, in line
        with the rest of the wrapper.
        """
        if not self._client:
            return
        try:
            cursor = 0
            while True:
                cursor, keys = self._client.scan(
                    cursor=cursor, match=pattern, count=200
                )
                if keys:
                    self._client.delete(*keys)
                if cursor == 0:
                    break
        except Exception:
            pass

# Global instance
cache = RedisCache()
