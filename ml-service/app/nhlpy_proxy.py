from __future__ import annotations

# Thin wrapper around nhl-api-py (nhlpy) that provides
# One shared NHLClient instance for the whole backend process
# A small capabilities helper to introspect which modules and methods are available

from typing import Any, Dict, Optional

try:
    from nhlpy import NHLClient  # pip install nhl-api-py
except Exception:
    NHLClient = None  # type: ignore


# Cached singleton client so routes do not re-create a new client per request
_client: Optional[Any] = None

# Single shared client instance
def nhl_client() -> Any:

    global _client
    if NHLClient is None:
        raise RuntimeError("nhl-api-py is not installed (pip install nhl-api-py).")

    # Lazy-init to avoid import-time failures and speed up cold start
    if _client is None:
        _client = NHLClient(
            debug=False,
            timeout=30,
            ssl_verify=True,
            follow_redirects=True,
        )
    return _client

# modules + methods exposed by nhl-api-py
def capabilities() -> Dict[str, Any]:
    if NHLClient is None:
        return {"installed": False, "modules": {}}

    c = nhl_client()

    modules: Dict[str, Any] = {}
    for mod_name in sorted([n for n in dir(c) if not n.startswith("_")]):
        mod = getattr(c, mod_name, None)
        if mod is None or callable(mod):
            continue

        # Collect public callables on each sub-module
        methods = []
        for fn in dir(mod):
            if fn.startswith("_"):
                continue
            if callable(getattr(mod, fn, None)):
                methods.append(fn)

        if methods:
            modules[mod_name] = sorted(set(methods))

    return {"installed": True, "modules": modules}
