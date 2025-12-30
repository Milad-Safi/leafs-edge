from __future__ import annotations
import time
from typing import Any, Dict, Optional, Tuple

# Unshared in-memory dict used as a tiny TTL cache in python process memory 
_TTL_CACHE: Dict[str, Tuple[float, Any]] = {}


# Given key return value 
def cache_get(key: str) -> Optional[Any]:
    item = _TTL_CACHE.get(key)
    # if the key isnt present return early
    if not item:
        return None
    
    # if its past the expiry time, remove value and return none
    expires_at, val = item
    if time.time() > expires_at:
        _TTL_CACHE.pop(key, None)
        return None
    
    # checks passed, value is returned
    return val


# Assign a given value to a given key with expiry now+ttl seconds
def cache_set(key: str, val: Any, ttl_seconds: int) -> None:
    _TTL_CACHE[key] = (time.time() + ttl_seconds, val)

# Cache wrapper
def cached(key: str, ttl_seconds: int, fn):

    # if value exists and is not expired, return it
    v = cache_get(key)
    if v is not None:
        return v
    
    # otherwise compute it, cache it , return it.
    v = fn()
    cache_set(key, v, ttl_seconds)
    return v
