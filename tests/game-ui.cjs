const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright-core');
const { createStaticServer } = require('./static-server.cjs');

let server;
(async () => {
  server = createStaticServer(8769);
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
  else if (task.mode === 'match') await page.evaluate(() => {
    const q = MishaLab.getData().session.task;
    for (let from = 0; from < q.initial.length; from++) {
      if (!q.initial[from]) continue;
      for (let to = 0; to < q.initial.length; to++) {
        if (q.initial[to]) continue;
        const board = [...q.initial];
        board[from] = 0;
        board[to] = 1;
        const digits = [0, 1, 2].map(index => MishaLab.SEG.findIndex(segments => segments.every((value, segment) => value === board[index * 7 + segment])));
        if (digits.every(digit => digit >= 0) && digits[0] + digits[1] === digits[2]) {
          q.board = board;
          q.moves = 1;
          return;
        }
      }
    }
    throw new Error('No matchstick solution found');
  });
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
