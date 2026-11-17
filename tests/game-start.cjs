const assert = require('node:assert/strict');
const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright-core');
const { createStaticServer } = require('./static-server.cjs');
let browser, server;
(async () => {
  server = createStaticServer(8788);
  browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:8788');
  const targets = ['math', 'logic', 'geometry', 'chess', 'daily', 'puzzles'];
  for (const difficulty of [1, 4, 7, 10]) {
    for (const target of targets) {
      if (difficulty === 10) await page.locator('#difficulty-range').fill('10');
      else await page.locator(`[data-difficulty="${difficulty}"]`).click();
      // Previous difficulties, weak skills and challenge bands cannot override an explicit opening choice.
      await page.evaluate(() => {
        const d = MishaLab.getData();
        d.history.push(...Object.keys(d.levels).flatMap(domain => Array.from({ length: 2 }, () => ({ domain, type: 'add', open: false, correct: false, hints: 2 }))));
      });
      if (target === 'daily') await page.locator('[data-action="daily"]').click();
      else if (target === 'puzzles') await page.locator('[data-puzzle-kind="mixed"]').click();
      else await page.locator(`.arcade-world[data-track="${target}"]`).click();
      assert.equal(await page.evaluate(() => MishaLab.getData().session.task.level), difficulty, `${target}:opening-level`);
      await page.locator('[data-action="home"]').first().click();
    }
  }
  await page.locator('[data-difficulty="4"]').click();
  await page.locator('.arcade-world[data-track="math"]').click();
  const original = await page.evaluate(() => MishaLab.getData().session.task.signature);
  await page.locator('[data-action="home"]').first().click();
  await page.locator('[data-difficulty="7"]').click();
  await page.reload();
  assert.equal(await page.evaluate(() => MishaLab.getData().startDifficulty), 7);
  await page.locator('[data-action="resume"]').click();
  assert.equal(await page.evaluate(() => MishaLab.getData().session.task.signature), original, 'Preference change must preserve saved play');
  await page.locator('[data-action="home"]').first().click();
  await page.locator('[data-difficulty="auto"]').click();
  assert.equal(await page.evaluate(() => MishaLab.getData().startDifficulty), null);

  // A saved numerical nonogram upgrades to the accessible version, without losing history or rewards.
  await page.evaluate(() => {
    const d = MishaLab.getData();
    d.xp = 123; d.levels.logic = 6;
    d.session = { ...d.session, track: 'puzzles', puzzleKind: 'nonogram', task: { ...d.session.task, type: 'nonogram', mode: 'puzzle', level: 6, finished: false } };
    delete d.session.task.variant;
    localStorage.setItem('misha-lab-v1', JSON.stringify(d));
  });
  const before = await page.evaluate(() => ({ history: MishaLab.getData().history.length, rounds: MishaLab.getData().rounds.length }));
  await page.reload();
  const migrated = await page.evaluate(() => ({ task: MishaLab.getData().session.task, xp: MishaLab.getData().xp, level: MishaLab.getData().levels.logic, history: MishaLab.getData().history.length, rounds: MishaLab.getData().rounds.length }));
  assert.equal(migrated.task.variant, 'copyPattern');
  assert.equal(migrated.task.n, 3);
  assert.equal(migrated.xp, 123);
  assert.equal(migrated.level, 6);
  assert.equal(migrated.history, before.history);
  assert.equal(migrated.rounds, before.rounds);
  await page.locator('[data-action="resume"]').click();
  await page.locator('[data-action="hint"]').click();
  assert.equal(await page.locator('.copy-tile.guided').count(), 2);
  const painting = await page.evaluate(() => MishaLab.getData().session.task);
  const next = painting.board.findIndex((v, i) => v !== painting.answer[i]);
  await page.locator(`[data-puzzle-action="tile"][data-puzzle-value="${next}"]`).click();
  const highlighted = await page.locator('button.copy-tile.guided').getAttribute('data-puzzle-value');
  assert.notEqual(Number(highlighted), next, 'Hint must follow the next missing cell');
  await page.reload();
  await page.locator('[data-action="resume"]').click();
  assert.equal(await page.evaluate(i => MishaLab.getData().session.task.board[i], next), 1);
  console.log('24 explicit difficulty openings, preference persistence, resume isolation, old-puzzle migration and live painting hints passed');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); if (server) server.close(); });
