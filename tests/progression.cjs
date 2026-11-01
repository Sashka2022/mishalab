const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright-core');
const http = require('http');
const fs = require('fs');

let server;
(async () => {
  server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(fs.readFileSync('/workspace/mishalab/index.html'));
  }).listen(8766, '127.0.0.1');

  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:8766');
  await page.locator('[data-action="daily"]').click();
  for (let i = 0; i < 5; i++) {
    await page.locator('[data-action="skip"]').click();
    await page.locator('[data-action="next"]').click();
  }

  const score = await page.evaluate(() => MishaLab.getData().rounds.at(-1).score);
  if (score !== 0 || !await page.getByText('0/100', { exact: true }).count()) {
    throw new Error('Numeric score was not calculated or displayed');
  }

  if (!await page.locator('[data-action="next-round"]').isEnabled()) {
    throw new Error('Automatic progression is blocked by the teacher alert');
  }
  if (await page.locator('[data-action="harder-level"], [data-action="same-level"]').count()) {
    throw new Error('Manual level controls are still shown');
  }
  await page.locator('[data-action="raise-hand"]').click();
  await page.locator('[data-action="next-round"]').click();
  if (!await page.locator('[data-action="skip"]').count()) {
    throw new Error('Automatic next round did not open immediately');
  }

  await page.locator('[data-action="teacher"]').click();
  if (await page.locator('[data-level]').count() || await page.locator('select').count()) {
    throw new Error('Teacher can still edit levels');
  }
  if (!await page.locator('[data-ack]').count()) {
    throw new Error('Teacher did not receive the hand-raise alert');
  }
  await page.locator('[data-ack]').click();
  await page.reload();
  await page.locator('[data-action="teacher"]').click();
  if (await page.locator('[data-ack]').count()) {
    throw new Error('Acknowledged hand-raise alert returned after reload');
  }

  await browser.close();
  server.close();
  console.log('Score, automatic progression, locked teacher levels and hand-raise alert passed');
})().catch(error => {
  if (server) server.close();
  console.error(error);
  process.exit(1);
});
