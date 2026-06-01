import type {
  Reporter,
  FullConfig,
  Suite,
  FullResult,
} from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

function formatDuration(ms: number): string {
  return ms < 60_000
    ? `${(ms / 1000).toFixed(1)}s`
    : `${Math.floor(ms / 60_000)}m ${((ms % 60_000) / 1000).toFixed(0)}s`;
}

export default class SummaryReporter implements Reporter {
  private passed  = 0;
  private failed  = 0;
  private skipped = 0;
  private flaky   = 0;
  private startMs = 0;

  onBegin(_config: FullConfig, _suite: Suite): void {
    this.startMs = Date.now();
  }

  onEnd(result: FullResult): void {
    const duration = formatDuration(Date.now() - this.startMs);

    // FullResult carries aggregate counts in Playwright ≥ 1.40
    const passed  = (result as never as Record<string, number>)['passed']  ?? this.passed;
    const failed  = (result as never as Record<string, number>)['failed']  ?? this.failed;
    const skipped = (result as never as Record<string, number>)['skipped'] ?? this.skipped;
    const flaky   = (result as never as Record<string, number>)['flaky']   ?? this.flaky;

    // Fallback: read from results.json written by the json reporter
    let p = passed, f = failed, s = skipped, fl = flaky;
    try {
      const json = JSON.parse(fs.readFileSync(path.resolve('test-results/results.json'), 'utf8'));
      const st = json.stats;
      if (st) { p = st.expected; f = st.unexpected; s = st.skipped; fl = st.flaky; }
    } catch { /* json reporter may not have flushed yet; use FullResult */ }

    const total = p + f + s;
    const icon  = f > 0 ? '✗' : fl > 0 ? '~' : '✓';
    const label = f > 0 ? 'FAILED' : fl > 0 ? 'FLAKY' : 'PASSED';

    const rows: [string, string][] = [
      ['Total',    String(total)],
      ['Passed',   String(p)],
      ['Failed',   String(f)],
      ['Skipped',  String(s)],
      ['Flaky',    String(fl)],
      ['Duration', duration],
    ];

    const colW = Math.max(...rows.map(([k]) => k.length)) + 2;
    const valW = Math.max(...rows.map(([, v]) => v.length)) + 2;
    const line = '─'.repeat(colW + valW + 3);

    process.stdout.write(`\n${line}\n`);
    process.stdout.write(`  Test results  ${icon} ${label}\n`);
    process.stdout.write(`${line}\n`);
    for (const [key, val] of rows) {
      process.stdout.write(`  ${key.padEnd(colW)}${val.padStart(valW)}\n`);
    }
    process.stdout.write(`${line}\n\n`);

    // Append counts to Allure environment.properties so they appear on the Overview page
    const envFile = path.resolve('allure-results/environment.properties');
    if (fs.existsSync(path.resolve('allure-results'))) {
      try {
        const props = [
          `tests_total=${total}`,
          `tests_passed=${p}`,
          `tests_failed=${f}`,
          `tests_skipped=${s}`,
          `tests_flaky=${fl}`,
          `tests_duration=${duration}`,
        ].join('\n') + '\n';
        fs.appendFileSync(envFile, props, 'utf8');
      } catch { /* non-fatal */ }
    }
  }
}
