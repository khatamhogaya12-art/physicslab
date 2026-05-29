import { spawn } from 'child_process';
import puppeteer from 'puppeteer';

(async () => {
  console.log('Starting server...');
  const server = spawn('npm.cmd', ['run', 'dev'], { shell: true, stdio: 'pipe' });
  
  server.stdout.on('data', data => console.log('SERVER OUT:', data.toString()));
  server.stderr.on('data', data => console.error('SERVER ERR:', data.toString()));

  console.log('Waiting 25 seconds for server to start...');
  await new Promise(r => setTimeout(r, 25000));

  console.log('Starting puppeteer...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
  page.on('pageerror', error => console.error('BROWSER_PAGE_ERROR:', error.message));
  page.on('requestfailed', request => console.error('BROWSER_REQUEST_FAILED:', request.url(), request.failure()?.errorText));
  
  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 }).catch(e => console.error('GOTO ERROR:', e.message));
  
  const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML);
  console.log('ROOT_HTML_LENGTH:', rootHtml ? rootHtml.length : 0);
  if (rootHtml === '') console.log('ROOT_IS_EMPTY!');
  
  await browser.close();
  server.kill();
  console.log('Done.');
  process.exit(0);
})();
