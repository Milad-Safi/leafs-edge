from __future__ import annotations

import time
from typing import Any, Dict, Optional, Tuple

_TTL_CACHE: Dict[str, Tuple[float, Any]] = {}


def cache_get(key: str) -> Optional[Any]:
    item = _TTL_CACHE.get(key)
    if not item:
        return None
    expires_at, val = item
    if time.time() > expires_at:
        _TTL_CACHE.pop(key, None)
        return None
    return val


def cache_set(key: str, val: Any, ttl_seconds: int) -> None:
    _TTL_CACHE[key] = (time.time() + ttl_seconds, val)


def cached(key: str, ttl_seconds: int, fn):
    v = cache_get(key)
    if v is not None:
        return v
    v = fn()
    cache_set(key, v, ttl_seconds)
    return v
