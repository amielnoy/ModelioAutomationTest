#!/usr/bin/env bash
set -euo pipefail

# ── Usage ────────────────────────────────────────────────────────────────────
# ./run.sh              — run all tests, generate Allure report
# ./run.sh ui           — UI tests only (chromium project)
# ./run.sh api          — API tests only
# ./run.sh report       — open the last Allure report (local, no Docker)
# ./run.sh clean        — remove all test output directories

CMD=${1:-all}

build() {
  echo "▶ Building Docker image..."
  docker compose build
}

run_tests() {
  echo "▶ Running tests: $*"
  docker compose run --rm tests "$@"
}

generate_report() {
  echo "▶ Generating Allure report..."
  docker compose run --rm tests npm run report:allure:ci
  echo "✅ Report written to allure-report/"
}

case "$CMD" in
  all)
    build
    run_tests npx playwright test --workers=4
    generate_report
    ;;
  ui)
    build
    run_tests npx playwright test --project=chromium tests/ui --workers=4
    generate_report
    ;;
  api)
    build
    run_tests npx playwright test --project=api tests/api --workers=4
    generate_report
    ;;
  report)
    npm run report:allure
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
