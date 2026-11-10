const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright-core');
const { createStaticServer } = require('./static-server.cjs');

let server;
(async () => {
  server = createStaticServer(8768);
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:8768');
  await page.locator('[data-action="daily"]').click();
  for (let i = 0; i < 5; i++) {
    await page.locator('[data-action="skip"]').click();
    await page.locator('[data-action="next"]').click();
  }
  if (!await page.getByText('מצב רציף · גרסה 2', { exact: true }).count()) {
    throw new Error('Continuous mode result screen did not appear');
  }
  await page.waitForTimeout(3400);
  if (!await page.locator('[data-action="skip"]').count()) {
    throw new Error('The next round did not start automatically');
  }
  const state = await page.evaluate(() => MishaLab.getData());
  if (state.rounds.length !== 1 || state.session.results.length !== 0) {
    throw new Error('Automatic run did not preserve the completed round and start a clean one');
  }
  await browser.close();
  server.close();
  console.log('Continuous automatic run and three-second transition passed');
})().catch(error => {
  if (server) server.close();
  console.error(error);
  process.exit(1);
});
