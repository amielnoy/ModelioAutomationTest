import { config } from './config';

export default async function globalSetup(): Promise<void> {
  const swaggerUrl    = `${config.health.apiUrl}/docs`;
  const fastApiUrl    = config.health.apiUrl;
  const grafanaUrl    = config.health.grafanaUrl;
  const allureUrl     = config.health.allureReportUrl;

  const line = '─'.repeat(56);
  console.log(`\n${line}`);
  console.log('  Server links');
  console.log(line);
  console.log(`  Swagger UI   ${swaggerUrl}`);
  console.log(`  FastAPI      ${fastApiUrl}`);
  console.log(`  Grafana      ${grafanaUrl}`);
  console.log(`  Allure       ${allureUrl}`);
  console.log(`${line}\n`);
}
