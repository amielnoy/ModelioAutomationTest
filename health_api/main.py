import asyncio
import os
import shutil
import time
from datetime import datetime, timezone
from typing import Literal

import httpx
from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from prometheus_client import Gauge
from prometheus_fastapi_instrumentator import Instrumentator
from pydantic import BaseModel

START_TIME = time.monotonic()

app = FastAPI(
    title="QA System Health API",
    description=(
        "Health and readiness checks for all systems under test.\n\n"
        "Use **/docs** (Swagger UI) or **/redoc** to explore every endpoint interactively."
    ),
    version="1.0.0",
    contact={"name": "QA Automation"},
)

Instrumentator().instrument(app).expose(app)


# ── Custom Prometheus Gauges ──────────────────────────────────────────────────

# Test results — pushed by Playwright SummaryReporter after every run
qa_tests_total    = Gauge("qa_tests_total",              "Total tests in last run")
qa_tests_passed   = Gauge("qa_tests_passed",             "Passed tests in last run")
qa_tests_failed   = Gauge("qa_tests_failed",             "Failed tests in last run")
qa_tests_skipped  = Gauge("qa_tests_skipped",            "Skipped tests in last run")
qa_tests_flaky    = Gauge("qa_tests_flaky",              "Flaky tests in last run")
qa_tests_duration = Gauge("qa_tests_duration_seconds",   "Last run duration (seconds)")
qa_tests_last_run = Gauge("qa_tests_last_run_timestamp", "Unix timestamp of last test push")

# Service health — updated by background probe loop every 60 s
qa_service_up         = Gauge("qa_service_up",         "1=ok 0=down",        ["service"])
qa_service_latency_ms = Gauge("qa_service_latency_ms", "Probe latency (ms)", ["service"])
qa_service_http_code  = Gauge("qa_service_http_code",  "Last HTTP status",   ["service"])

# Disk / volume
qa_disk_used_bytes  = Gauge("qa_disk_used_bytes",  "Disk used bytes")
qa_disk_free_bytes  = Gauge("qa_disk_free_bytes",  "Disk free bytes")
qa_disk_total_bytes = Gauge("qa_disk_total_bytes", "Disk total bytes")


# ── Pydantic models ───────────────────────────────────────────────────────────

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


class TestResults(BaseModel):
    total:            int
    passed:           int
    failed:           int
    skipped:          int
    flaky:            int
    duration_seconds: float


# ── Helpers ───────────────────────────────────────────────────────────────────

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


def _update_disk() -> None:
    usage = shutil.disk_usage("/")
    qa_disk_used_bytes.set(usage.used)
    qa_disk_free_bytes.set(usage.free)
    qa_disk_total_bytes.set(usage.total)


# Services probed by the background loop
PROBE_TARGETS: dict[str, str] = {
    "web_ui":     os.getenv("WEB_BASE_URL",   "https://www.saucedemo.com"),
    "json_api":   os.getenv("API_BASE_URL",   "https://jsonplaceholder.typicode.com") + "/posts/1",
    "prometheus": os.getenv("PROMETHEUS_URL", "http://prometheus:9090/-/healthy"),
    "grafana":    os.getenv("GRAFANA_URL",    "http://grafana:3000/api/health"),
}


async def run_probe_loop() -> None:
    """Probe all services every 60 s and update Prometheus Gauges."""
    while True:
        for name, url in PROBE_TARGETS.items():
            result = await probe(url)
            qa_service_up.labels(service=name).set(1 if result.status == "ok" else 0)
            qa_service_latency_ms.labels(service=name).set(result.latency_ms or 0)
            qa_service_http_code.labels(service=name).set(result.http_status or 0)
        _update_disk()
        await asyncio.sleep(60)


# ── Lifecycle ─────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup() -> None:
    _update_disk()
    asyncio.create_task(run_probe_loop())


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")


@app.get("/health", response_model=SystemHealth, summary="Overall system health", tags=["Health"])
async def health_all():
    """Aggregated health across all monitored services."""
    web = await probe(os.getenv("WEB_BASE_URL", "https://www.saucedemo.com"))
    api = await probe(os.getenv("API_BASE_URL", "https://jsonplaceholder.typicode.com") + "/posts/1")

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


@app.get("/health/ui", response_model=ServiceHealth, summary="SauceDemo UI reachability", tags=["Health"])
async def health_ui():
    return await probe(os.getenv("WEB_BASE_URL", "https://www.saucedemo.com"))


@app.get("/health/api", response_model=ServiceHealth, summary="JSONPlaceholder API reachability", tags=["Health"])
async def health_api_route():
    return await probe(os.getenv("API_BASE_URL", "https://jsonplaceholder.typicode.com") + "/posts/1")


@app.get("/health/self", summary="Health API self-check", tags=["Health"])
async def health_self():
    return {
        "status": "ok",
        "uptime_seconds": round(time.monotonic() - START_TIME, 2),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/metrics/test-results", summary="Push Playwright test run results", tags=["Metrics"])
async def push_test_results(results: TestResults):
    """
    Called by the Playwright SummaryReporter after every run.
    Updates Prometheus Gauges so Grafana can display live test metrics and history.
    """
    qa_tests_total.set(results.total)
    qa_tests_passed.set(results.passed)
    qa_tests_failed.set(results.failed)
    qa_tests_skipped.set(results.skipped)
    qa_tests_flaky.set(results.flaky)
    qa_tests_duration.set(results.duration_seconds)
    qa_tests_last_run.set(time.time())
    return {"ok": True, "received": results.model_dump()}
