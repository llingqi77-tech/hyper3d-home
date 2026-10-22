const { chromium } = require('C:/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');

// Exercise the actual links from the shared homepage, including model loading.
const rooms = ['厨房', '客厅', '公卫 1', '公卫 2', '三门交汇区'];
const out = path.join(__dirname, 'room-pages');
(async () => {
  await fs.mkdir(out, { recursive: true });
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });
  const reports = [];
  try {
    for (const room of rooms) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      page.setDefaultTimeout(15000);
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('response', r => {
        if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) errors.push(`${r.status()} ${r.url()}`);
      });
      page.on('requestfailed', r => errors.push(`${r.failure()?.errorText} ${r.url()}`));
      try {
        await page.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'domcontentloaded' });
        await page.locator('a.card').filter({ has: page.getByRole('heading', { name: room, exact: true }) }).click();
        await page.waitForFunction(name => {
          if (name === '厨房') return window.kitchenModelsReady === true;
          if (name === '客厅') return !document.querySelector('#loading');
          if (name === '公卫 1') return document.querySelector('#loading')?.classList.contains('hidden');
          if (name === '公卫 2') return window.__bathroomReady === true;
          return document.querySelector('#scene')?.dataset.ready === 'true';
        }, room, { timeout: 90000 });
        const state = await page.evaluate(() => ({
          canvas: [...document.querySelectorAll('canvas')].map(c => ({ width: c.width, height: c.height })),
          assets: document.querySelector('#asset-summary, #asset-count, #asset-progress')?.textContent,
          modelErrors: Number(document.body.dataset.errors || 0),
          junctionLoaded: document.querySelector('#scene')?.dataset.loaded,
        }));
        assert.ok(state.canvas.some(c => c.width > 0 && c.height > 0), 'No render canvas');
        assert.equal(state.modelErrors, 0);
        if (room === '公卫 1') assert.match(state.assets, /^5 个/);
        await page.screenshot({ path: path.join(out, `${room}.png`), timeout: 60000 });
        // Verify an actual room interaction where provided.
        const topView = page.locator('[data-view="top"]');
        if (await topView.count()) {
          await topView.click();
        }
        assert.deepEqual(errors, []);
        const result = { room, ok: true, url: decodeURI(page.url()), ...state, errors };
        reports.push(result);
        console.log(JSON.stringify(result));
      } catch (e) {
        const result = { room, ok: false, error: e.message, errors };
        reports.push(result);
        console.log(JSON.stringify(result));
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
    await fs.writeFile(path.join(out, 'report.json'), JSON.stringify(reports, null, 2));
  }
  if (reports.some(r => !r.ok)) process.exitCode = 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
