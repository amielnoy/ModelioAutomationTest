#!/usr/bin/env bash
set -euo pipefail

# ── Usage ────────────────────────────────────────────────────────────────────
# ./run.sh              — run all tests, generate Allure report
# ./run.sh ui           — UI tests only (chromium project)
# ./run.sh api          — API tests only
# ./run.sh report       — open the last Allure report (local, no Docker)
# ./run.sh clean        — remove all test output directories

CMD=${1:-all}
TEST_EXIT_CODE=0

build() {
  echo "▶ Building Docker image..."
  docker compose build
}

run_tests() {
  echo "▶ Running tests: $*"
  docker compose run --rm tests "$@" || TEST_EXIT_CODE=$?
}

generate_report() {
  echo "▶ Generating Allure report..."
  docker compose run --rm tests npm run report:allure:ci
  echo "✅ Report written to allure-report/"
}

open_servers() {
  local allure_url="http://localhost:5050"
  local swagger_url="http://localhost:8000/docs"
  local grafana_url="http://localhost:3000/d/qa-health/qa-system-health?orgId=1&from=now-3h&to=now&timezone=browser&refresh=15s"

  echo "▶ Opening servers in Chrome tabs..."

  # Kill any existing http-server on port 5050 before starting a new one
  local old_pid
  old_pid=$(lsof -ti tcp:5050 2>/dev/null || true)
  if [ -n "$old_pid" ]; then
    echo "  Stopping existing server on port 5050 (PID $old_pid)..."
    kill "$old_pid" 2>/dev/null || true
    sleep 1
  fi

  # Serve Allure report on a temporary port so it's reachable in the browser
  if command -v npx &>/dev/null && [ -d allure-report ]; then
    npx --yes http-server allure-report -p 5050 -s &
    HTTP_SERVER_PID=$!
    sleep 1
  fi

  if [[ "$OSTYPE" == "darwin"* ]]; then
    open -a "Google Chrome" "$allure_url" "$swagger_url" "$grafana_url" 2>/dev/null \
      || open "$allure_url" "$swagger_url" "$grafana_url"
  else
    for url in "$allure_url" "$swagger_url" "$grafana_url"; do
      xdg-open "$url" 2>/dev/null || true
    done
  fi

  echo "  Allure  → $allure_url"
  echo "  Swagger → $swagger_url"
  echo "  Grafana → $grafana_url"
}

case "$CMD" in
  all)
    build
    docker compose up -d health-api prometheus grafana 2>/dev/null || true
    run_tests npx playwright test --workers=4
    generate_report
    open_servers
    exit $TEST_EXIT_CODE
    ;;
  ui)
    build
    run_tests npx playwright test --project=chromium tests/ui --workers=4
    generate_report
    exit $TEST_EXIT_CODE
    ;;
  api)
    build
    run_tests npx playwright test --project=api tests/api --workers=4
    generate_report
    exit $TEST_EXIT_CODE
    ;;
  report)
    npm run report:allure
    open_servers
    ;;
  clean)
    echo "▶ Cleaning output directories..."
    rm -rf allure-results allure-report allure-report-prev playwright-report test-results logs
    echo "✅ Cleaned"
    ;;
  *)
    echo "Unknown command: $CMD"
    echo "Usage: $0 [all|ui|api|report|clean]"
    exit 1
    ;;
esac
