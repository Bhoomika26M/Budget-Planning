"""Tiny in-memory rate limiter used for login / OTP endpoints.

Good enough for a single-process deployment. For multiple workers use a
shared store such as Redis instead.
"""

import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import HTTPException, Request, status


class RateLimiter:
    def __init__(self, max_calls: int, period_seconds: int):
        self.max_calls = max_calls
        self.period = period_seconds
        self._calls: dict[str, deque] = defaultdict(deque)
        self._lock = Lock()

    def hit(self, key: str) -> None:
        now = time.monotonic()
        with self._lock:
            calls = self._calls[key]
            while calls and now - calls[0] > self.period:
                calls.popleft()
            if len(calls) >= self.max_calls:
                retry = int(self.period - (now - calls[0])) + 1
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Too many attempts. Please try again in {retry} seconds.",
                )
            calls.append(now)

    def reset(self) -> None:
        with self._lock:
            self._calls.clear()


login_limiter = RateLimiter(max_calls=10, period_seconds=300)
otp_limiter = RateLimiter(max_calls=5, period_seconds=300)


def client_key(request: Request, extra: str = "") -> str:
    host = request.client.host if request.client else "unknown"
    return f"{host}:{extra.lower()}"
