import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPublicDemoExport } from '../outputs/demoExport.js';
import { renderDashboardHtml } from '../outputs/dashboardHtml.js';
import { renderDemoWalkthroughHtml, renderDemoWalkthroughMarkdown } from '../outputs/demoWalkthrough.js';
import { assembleLaunchKit } from '../outputs/launchKit.js';
import { renderSimpleAppHtml } from '../outputs/simpleAppHtml.js';
import { runLaunchKitDemo } from '../workflows/launchKitDemo.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUTPUT_DIR = resolve(ROOT, 'outputs');
const MARKDOWN_PATH = resolve(OUTPUT_DIR, 'launch-kit.md');
const JSON_PATH = resolve(OUTPUT_DIR, 'demo-result.json');
const DASHBOARD_PATH = resolve(OUTPUT_DIR, 'dashboard.html');
const WALKTHROUGH_MD_PATH = resolve(OUTPUT_DIR, 'demo-walkthrough.md');
const WALKTHROUGH_HTML_PATH = resolve(OUTPUT_DIR, 'demo-walkthrough.html');
const APP_PATH = resolve(OUTPUT_DIR, 'app.html');

async function main(): Promise<void> {
  const result = await runLaunchKitDemo({ now: new Date('2026-06-18T14:30:00.000Z') });
  const markdown = assembleLaunchKit(result);
  const dashboard = renderDashboardHtml(result);
  const walkthroughMarkdown = renderDemoWalkthroughMarkdown(result);
  const walkthroughHtml = renderDemoWalkthroughHtml(result);
  const appHtml = renderSimpleAppHtml(result);

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(MARKDOWN_PATH, markdown, 'utf8');
  await writeFile(JSON_PATH, JSON.stringify(createPublicDemoExport(result), null, 2), 'utf8');
  await writeFile(DASHBOARD_PATH, dashboard, 'utf8');
  await writeFile(WALKTHROUGH_MD_PATH, walkthroughMarkdown, 'utf8');
  await writeFile(WALKTHROUGH_HTML_PATH, walkthroughHtml, 'utf8');
  await writeFile(APP_PATH, appHtml, 'utf8');

  console.log('TenderBoard demo complete');
  console.log(`Bids: ${result.summary.totalBids}`);
  console.log(`Eligible: ${result.summary.eligibleBids}`);
  console.log(`Blocked: ${result.summary.blockedBids}`);
  console.log(`Awarded: ${result.summary.awardedBids}`);
  console.log(`Completed mock CROO orders: ${result.summary.completedOrders}`);
  console.log(`Markdown: ${relativeForDisplay(MARKDOWN_PATH)}`);
  console.log(`JSON: ${relativeForDisplay(JSON_PATH)}`);
  console.log(`Dashboard: ${relativeForDisplay(DASHBOARD_PATH)}`);
  console.log(`Walkthrough MD: ${relativeForDisplay(WALKTHROUGH_MD_PATH)}`);
  console.log(`Walkthrough HTML: ${relativeForDisplay(WALKTHROUGH_HTML_PATH)}`);
  console.log(`One-page app: ${relativeForDisplay(APP_PATH)}`);
}

function relativeForDisplay(path: string): string {
  return path.startsWith(ROOT) ? path.slice(ROOT.length + 1).replaceAll('\\', '/') : path;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
