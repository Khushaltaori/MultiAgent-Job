"""
Rate-limiter configuration using slowapi.

`limiter` is the single shared instance that:
  - auth router imports to decorate /register and /login
  - any future router can also import and reuse

Key function: identify requests by real IP even behind a proxy.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
