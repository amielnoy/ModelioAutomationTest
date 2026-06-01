import * as fs from 'fs';
import * as path from 'path';

interface Stats {
  expected: number;
  unexpected: number;
  skipped: number;
  flaky: number;
  duration: number;
}

function readStats(): Stats | null {
  const resultsPath = path.resolve('test-results/results.json');
  if (!fs.existsSync(resultsPath)) return null;
  try {
    const { stats } = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    return stats ?? null;
  } catch {
    return null;
  }
}

function formatDuration(ms: number): string {
  return ms < 60_000
    ? `${(ms / 1000).toFixed(1)}s`
    : `${Math.floor(ms / 60_000)}m ${((ms % 60_000) / 1000).toFixed(0)}s`;
}

function printTable(stats: Stats): void {
  const passed  = stats.expected;
  const failed  = stats.unexpected;
  const skipped = stats.skipped;
  const flaky   = stats.flaky;
  const total   = passed + failed + skipped;
  const duration = formatDuration(stats.duration);

  const rows: [string, string][] = [
    ['Total',   String(total)],
    ['Passed',  String(passed)],
    ['Failed',  String(failed)],
    ['Skipped', String(skipped)],
    ['Flaky',   String(flaky)],
    ['Duration', duration],
  ];

  const colW = Math.max(...rows.map(([k]) => k.length)) + 2;
  const valW = Math.max(...rows.map(([, v]) => v.length)) + 2;
  const line = '─'.repeat(colW + valW + 3);

  const icon = failed > 0 ? '✗' : flaky > 0 ? '~' : '✓';
  const label = failed > 0 ? 'FAILED' : flaky > 0 ? 'FLAKY' : 'PASSED';

  console.log(`\n${line}`);
  console.log(`  Test results  ${icon} ${label}`);
  console.log(line);
  for (const [key, val] of rows) {
    console.log(`  ${key.padEnd(colW)}${val.padStart(valW)}`);
  }
  console.log(`${line}\n`);
}

function appendToEnvironmentProperties(stats: Stats): void {
  const envFile = path.resolve('allure-results/environment.properties');
  if (!fs.existsSync(path.resolve('allure-results'))) return;

  const lines = [
    `tests_total=${stats.expected + stats.unexpected + stats.skipped}`,
    `tests_passed=${stats.expected}`,
    `tests_failed=${stats.unexpected}`,
    `tests_skipped=${stats.skipped}`,
    `tests_flaky=${stats.flaky}`,
    `tests_duration=${formatDuration(stats.duration)}`,
  ].join('\n') + '\n';

  try {
    fs.appendFileSync(envFile, lines, 'utf8');
  } catch {
    // allure-results not present (e.g. allure reporter disabled) — skip silently
  }
}

export default async function globalTeardown(): Promise<void> {
  const stats = readStats();
  if (!stats) return;
  printTable(stats);
  appendToEnvironmentProperties(stats);
}
