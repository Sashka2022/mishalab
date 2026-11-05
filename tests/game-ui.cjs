const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright-core');
const http = require('http');
const fs = require('fs');

let server;
(async () => {
  server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(fs.readFileSync('/workspace/mishalab/index.html'));
  }).listen(8769, '127.0.0.1');
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:8769');
  if (await page.locator('.achievement').count() !== 5) throw new Error('Badge shelf is missing');
  await page.locator('[data-action="daily"]').click();
  if (!await page.locator('#runClock').count()) throw new Error('Run clock is missing');
  await page.waitForTimeout(1100);
  if (await page.locator('#runClock').textContent() === '00:00') throw new Error('Run clock did not advance');

  const task = await page.evaluate(() => MishaLab.getData().session.task);
  if (task.mode === 'number') await page.locator('#answer').fill(String(task.answer));
  else if (task.mode === 'options') await page.locator(`[data-option="${task.answer}"]`).click();
  else if (task.mode === 'grid') {
    for (let i = 0; i < task.answer; i++) await page.locator(`[data-cell="${i}"]`).click();
  }
  else if (task.mode === 'chess') await page.locator(`[data-square="${task.answer[0]}"]`).click();
  else throw new Error(`Unexpected first-task mode: ${task.mode}`);
  await page.locator('[data-action="check"]').click();
  const state = await page.evaluate(() => MishaLab.getData());
  if (state.xp <= 0 || state.currentStreak !== 1 || !state.badges.includes('first')) {
    throw new Error('XP, streak or first badge was not awarded');
  }
  if (!await page.locator('.xp-pop').count() || !await page.locator('.level-up').count()) {
    throw new Error('Reward feedback is not visible');
  }
  await page.locator('[data-action="toggle-clock"]').click();
  if (await page.locator('#runClock').textContent() !== '••:••') throw new Error('Clock could not be hidden');
  await browser.close();
  server.close();
  console.log('Game HUD, active timer, XP, streak and badges passed');
})().catch(error => {
  if (server) server.close();
  console.error(error);
  process.exit(1);
});
