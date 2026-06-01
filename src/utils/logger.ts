import * as fs from 'fs';
import * as path from 'path';

const LOGS_DIR = path.resolve(process.cwd(), 'logs');

function ensureLogsDir(): void {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
}

function dailyLogPath(): string {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return path.join(LOGS_DIR, `${date}.log`);
}

function timestamp(): string {
  return new Date().toISOString();
}

function write(level: string, message: string): void {
  const line = `${timestamp()} ${level} ${message}`;
  console.log(line);
  try {
    ensureLogsDir();
    fs.appendFileSync(dailyLogPath(), line + '\n', 'utf8');
  } catch {
    // never let logging break a test
  }
}

export const logger = {
  info:  (msg: string)              => write('[INFO] ', msg),
  step:  (msg: string)              => write('[STEP] ', msg),
  pass:  (msg: string)              => write('[PASS] ', msg),
  fail:  (msg: string, err?: unknown) =>
    write('[FAIL] ', err ? `${msg} — ${err instanceof Error ? err.message : String(err)}` : msg),
  warn:  (msg: string)              => write('[WARN] ', msg),
  debug: (msg: string)              => write('[DEBUG]', msg),
};
