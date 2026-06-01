import os
import time
from datetime import datetime, timezone
from typing import Literal

import httpx
from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from prometheus_fastapi_instrumentator import Instrumentator
from pydantic import BaseModel

START_TIME = time.monotonic()

app = FastAPI(
    title="QA System Health API",
    description=(
        "Health and readiness checks for all systems under test.\n\n"
        "Use **/docs** (Swagger UI) or **/redoc** to explore and invoke every endpoint interactively."
    ),
    version="1.0.0",
    contact={"name": "QA Automation"},
)

# Expose /metrics for Prometheus scraping
Instrumentator().instrument(app).expose(app)


# ── Models ───────────────────────────────────────────────────────────────────

class ServiceHealth(BaseModel):
    status: Literal["ok", "degraded", "down"]
    url: str
    http_status: int | None = None
    error: str | None = None
    latency_ms: float | None = None


class SystemHealth(BaseModel):
    status: Literal["ok", "degraded", "down"]
    timestamp: str
    uptime_seconds: float
    services: dict[str, ServiceHealth]


# ── Helpers ──────────────────────────────────────────────────────────────────

async def probe(url: str, timeout: float = 5.0) -> ServiceHealth:
    t0 = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            resp = await client.get(url)
        latency = round((time.monotonic() - t0) * 1000, 1)
        status: Literal["ok", "degraded", "down"] = "ok" if resp.status_code < 400 else "degraded"
        return ServiceHealth(status=status, url=url, http_status=resp.status_code, latency_ms=latency)
    except Exception as exc:
        latency = round((time.monotonic() - t0) * 1000, 1)
        return ServiceHealth(status="down", url=url, error=str(exc), latency_ms=latency)


# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")


@app.get(
    "/health",
    response_model=SystemHealth,
    summary="Overall system health",
    tags=["Health"],
)
async def health_all():
    """Returns aggregated health across all monitored services."""
    web_url = os.getenv("WEB_BASE_URL", "https://www.saucedemo.com")
    api_url = os.getenv("API_BASE_URL", "https://jsonplaceholder.typicode.com") + "/posts/1"

    web = await probe(web_url)
    api = await probe(api_url)

    services = {"web_ui": web, "json_api": api}
    overall: Literal["ok", "degraded", "down"] = (
        "down" if any(s.status == "down" for s in services.values())
        else "degraded" if any(s.status == "degraded" for s in services.values())
        else "ok"
    )

    return SystemHealth(
        status=overall,
        timestamp=datetime.now(timezone.utc).isoformat(),
        uptime_seconds=round(time.monotonic() - START_TIME, 2),
        services=services,
    )


@app.get(
    "/health/ui",
    response_model=ServiceHealth,
    summary="SauceDemo UI reachability",
    tags=["Health"],
)
async def health_ui():
    """Probes the web UI under test and returns latency + HTTP status."""
    url = os.getenv("WEB_BASE_URL", "https://www.saucedemo.com")
    return await probe(url)


@app.get(
    "/health/api",
    response_model=ServiceHealth,
    summary="JSONPlaceholder API reachability",
    tags=["Health"],
)
async def health_api():
    """Probes the REST API under test and returns latency + HTTP status."""
    url = os.getenv("API_BASE_URL", "https://jsonplaceholder.typicode.com") + "/posts/1"
    return await probe(url)


@app.get(
    "/health/self",
    summary="Health API self-check",
    tags=["Health"],
)
async def health_self():
    """Returns the health API's own status and uptime."""
    return {
        "status": "ok",
        "uptime_seconds": round(time.monotonic() - START_TIME, 2),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
