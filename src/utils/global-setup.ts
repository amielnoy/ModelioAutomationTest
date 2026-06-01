import { config } from './config';
import { c } from './colors';

export default async function globalSetup(): Promise<void> {
  const border = c.dim(c.cyan('─'.repeat(56)));
  const out = (s: string) => process.stdout.write(s);

  out(`\n${border}\n`);
  out(`  ${c.bold(c.cyan('▶ Server links'))}\n`);
  out(`${border}\n`);
  out(`  ${c.gray('Allure      ')}  ${c.cyan(config.health.allureReportUrl)}\n`);

  if (!process.env.CI) {
    out(`  ${c.gray('Swagger UI  ')}  ${c.cyan(`${config.health.apiUrl}/docs`)}\n`);
    out(`  ${c.gray('FastAPI     ')}  ${c.cyan(config.health.apiUrl)}\n`);
    out(`  ${c.gray('Grafana     ')}  ${c.cyan(config.health.grafanaUrl)}\n`);
  }

  out(`${border}\n\n`);
}
