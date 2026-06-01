import * as fs from 'fs';
import * as path from 'path';
import { c } from './colors';

const LOGS_DIR = path.resolve(process.cwd(), 'logs');

function ensureLogsDir(): void {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
}

function dailyLogPath(): string {
  const date = new Date().toISOString().slice(0, 10);
  return path.join(LOGS_DIR, `${date}.log`);
}

function timestamp(): string {
  return new Date().toISOString();
}

const LEVELS: Record<string, (tag: string) => string> = {
  '[INFO] ': tag => c.gray(tag),
  '[STEP] ': tag => c.cyan(tag),
  '[PASS] ': tag => c.green(tag),
  '[FAIL] ': tag => c.red(tag),
  '[WARN] ': tag => c.yellow(tag),
  '[DEBUG]': tag => c.dim(tag),
};

function write(level: string, message: string): void {
  const ts   = c.dim(c.gray(timestamp()));
  const tag  = (LEVELS[level] ?? (t => t))(level);
  const line = `${ts} ${tag} ${message}`;

  console.log(line);

  // Strip ANSI for the log file
  const plain = `${timestamp()} ${level} ${message}`;
  try {
    ensureLogsDir();
    fs.appendFileSync(dailyLogPath(), plain + '\n', 'utf8');
  } catch {
    // never let logging break a test
  }
}

export const logger = {
  info:  (msg: string)               => write('[INFO] ', msg),
  step:  (msg: string)               => write('[STEP] ', msg),
  pass:  (msg: string)               => write('[PASS] ', msg),
  fail:  (msg: string, err?: unknown) =>
    write('[FAIL] ', err ? `${msg} — ${err instanceof Error ? err.message : String(err)}` : msg),
  warn:  (msg: string)               => write('[WARN] ', msg),
  debug: (msg: string)               => write('[DEBUG]', msg),
};
