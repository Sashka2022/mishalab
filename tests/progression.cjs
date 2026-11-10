const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright-core');
const { createStaticServer } = require('./static-server.cjs');

let server;
(async () => {
  server = createStaticServer(8766);

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
  if (!await page.locator('[data-action="reset"]').count()) {
    throw new Error('Teacher reset button is missing');
  }
  page.once('dialog', dialog => dialog.accept());
  await page.locator('[data-action="reset"]').first().click();
  const reset = await page.evaluate(() => MishaLab.getData());
  if (reset.history.length || reset.rounds.length || reset.xp || reset.levels.math !== 3 || reset.levels.logic !== 1) {
    throw new Error('Teacher reset did not clear all progress');
  }

  await browser.close();
  server.close();
  console.log('Score, automatic progression, teacher alert and progress reset passed');
})().catch(error => {
  if (server) server.close();
  console.error(error);
  process.exit(1);
});
