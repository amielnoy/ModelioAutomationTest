import { config } from './config';

export default async function globalSetup(): Promise<void> {
  const line = '─'.repeat(56);
  console.log(`\n${line}`);
  console.log('  Server links');
  console.log(line);
  console.log(`  Allure       ${config.health.allureReportUrl}`);

  if (!process.env.CI) {
    // Local Docker services — not reachable from CI or GitHub Pages
    console.log(`  Swagger UI   ${config.health.apiUrl}/docs`);
    console.log(`  FastAPI      ${config.health.apiUrl}`);
    console.log(`  Grafana      ${config.health.grafanaUrl}`);
  }

  console.log(`${line}\n`);
}
