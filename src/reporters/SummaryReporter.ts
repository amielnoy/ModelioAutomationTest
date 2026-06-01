import type {
  Reporter,
  FullConfig,
  Suite,
  FullResult,
} from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';
import { c } from '../utils/colors';

function formatDuration(ms: number): string {
  return ms < 60_000
    ? `${(ms / 1000).toFixed(1)}s`
    : `${Math.floor(ms / 60_000)}m ${((ms % 60_000) / 1000).toFixed(0)}s`;
}

export default class SummaryReporter implements Reporter {
  private startMs = 0;

  onBegin(_config: FullConfig, _suite: Suite): void {
    this.startMs = Date.now();
  }

  onEnd(_result: FullResult): void {
    const duration = formatDuration(Date.now() - this.startMs);

    // Read authoritative counts from the json reporter output
    let p = 0, f = 0, s = 0, fl = 0;
    try {
      const json = JSON.parse(fs.readFileSync(path.resolve('test-results/results.json'), 'utf8'));
      const st = json.stats;
      if (st) { p = st.expected; f = st.unexpected; s = st.skipped; fl = st.flaky; }
    } catch { /* reporter may not have flushed; leave zeroes */ }

    const total = p + f + s;

    const statusColor = f > 0 ? c.red : fl > 0 ? c.yellow : c.green;
    const icon        = f > 0 ? '✗' : fl > 0 ? '~' : '✓';
    const label       = f > 0 ? 'FAILED' : fl > 0 ? 'FLAKY' : 'PASSED';

    const rows: [string, string, ((s: string) => string)?][] = [
      ['Total',    String(total),    c.white],
      ['Passed',   String(p),        p > 0 ? c.green : c.gray],
      ['Failed',   String(f),        f > 0 ? c.red   : c.gray],
      ['Skipped',  String(s),        s > 0 ? c.yellow: c.gray],
      ['Flaky',    String(fl),       fl > 0 ? c.yellow: c.gray],
      ['Duration', duration,         c.cyan],
    ];

    const colW = Math.max(...rows.map(([k]) => k.length)) + 2;
    const valW = Math.max(...rows.map(([, v]) => v.length)) + 2;
    const border = c.dim('─'.repeat(colW + valW + 3));

    const out = (s: string) => process.stdout.write(s);

    out(`\n${border}\n`);
    out(`  ${c.bold('Test results')}  ${statusColor(c.bold(`${icon} ${label}`))}\n`);
    out(`${border}\n`);
    for (const [key, val, color] of rows) {
      const padded = val.padStart(valW);
      out(`  ${c.gray(key.padEnd(colW))}${color ? color(padded) : padded}\n`);
    }
    out(`${border}\n\n`);

    // Push counts to health API (fire-and-forget)
    const apiUrl = process.env['HEALTH_API_URL'];
    if (apiUrl) {
      const durationSeconds = (Date.now() - this.startMs) / 1000;
      fetch(`${apiUrl}/metrics/test-results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total, passed: p, failed: f, skipped: s, flaky: fl, duration_seconds: durationSeconds }),
      }).catch(() => { /* non-fatal */ });
    }

    // Append plain counts to Allure environment.properties
    const envFile = path.resolve('allure-results/environment.properties');
    if (fs.existsSync(path.resolve('allure-results'))) {
      try {
        fs.appendFileSync(envFile, [
          `tests_total=${total}`,
          `tests_passed=${p}`,
          `tests_failed=${f}`,
          `tests_skipped=${s}`,
          `tests_flaky=${fl}`,
          `tests_duration=${duration}`,
        ].join('\n') + '\n', 'utf8');
      } catch { /* non-fatal */ }
    }
  }
}
