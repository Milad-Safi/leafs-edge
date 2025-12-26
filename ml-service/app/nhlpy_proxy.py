from __future__ import annotations

from typing import Any, Dict, Optional

try:
    from nhlpy import NHLClient  # pip install nhl-api-py
except Exception:
    NHLClient = None  # type: ignore


_client: Optional[Any] = None


def nhl_client() -> Any:
    """
    Single shared client instance.
    Keep args aligned with nhl-api-py supported configuration:
    debug, timeout, ssl_verify, follow_redirects.
    """
    global _client
    if NHLClient is None:
        raise RuntimeError("nhl-api-py is not installed (pip install nhl-api-py).")

    if _client is None:
        _client = NHLClient(
            debug=False,
            timeout=30,
            ssl_verify=True,
            follow_redirects=True,
        )
    return _client


def capabilities() -> Dict[str, Any]:
    """
    Best-effort introspection of modules + methods exposed by nhl-api-py.
    """
    if NHLClient is None:
        return {"installed": False, "modules": {}}

    c = nhl_client()

    modules: Dict[str, Any] = {}
    for mod_name in sorted([n for n in dir(c) if not n.startswith("_")]):
        mod = getattr(c, mod_name, None)
        if mod is None or callable(mod):
            continue

        methods = []
        for fn in dir(mod):
            if fn.startswith("_"):
                continue
            if callable(getattr(mod, fn, None)):
                methods.append(fn)

        if methods:
            modules[mod_name] = sorted(set(methods))

    return {"installed": True, "modules": modules}
