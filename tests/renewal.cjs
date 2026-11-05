const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright-core');
const http = require('http');
const fs = require('fs');

let server;
let browser;
(async () => {
  server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(fs.readFileSync('/workspace/mishalab/index.html'));
  }).listen(8773, '127.0.0.1');
  browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:8773');

  const result = await page.evaluate(() => {
    const api = MishaLab;
    const fail = [];
    const firstTheme = api.themeForDay('2026-11-05');
    const sameTheme = api.themeForDay('2026-11-05');
    const nextTheme = api.themeForDay('2026-11-06');
    if (firstTheme.name.he !== sameTheme.name.he) fail.push('daily-theme-not-stable');
    if (firstTheme.name.he === nextTheme.name.he) fail.push('daily-theme-did-not-change');

    const order = api.dailyOrder('2026-11-05');
    const nextOrder = api.dailyOrder('2026-11-06');
    if (new Set(order).size !== 4 || order.join() === nextOrder.join()) fail.push('daily-domain-rotation');

    const bands = { steady: 0, stretch: 0, review: 0 };
    for (let i = 0; i < 20; i++) bands[api.challengePlan('math', i).band] += 1;
    if (bands.steady !== 12 || bands.stretch !== 5 || bands.review !== 3) fail.push(`challenge-mix:${JSON.stringify(bands)}`);

    const data = api.getData();
    data.history = [
      { domain: 'math', type: 'add', open: false, correct: false, hints: 2 },
      { domain: 'math', type: 'add', open: false, correct: false, hints: 2 }
    ];
    if (api.challengePlan('math', 0).band !== 'review') fail.push('struggle-review');
    data.history = [];
    data.recent = [];
    data.recentTypes = [];

    const signatures = new Set();
    for (let i = 0; i < 300; i++) {
      const q = api.generateQuestion('math', 10);
      if (!api.validQuestion(q)) fail.push(`invalid-question:${q.type}`);
      signatures.add(q.signature);
    }
    if (signatures.size < 285) fail.push(`anti-repeat:${signatures.size}`);
    if (data.recent.length !== 300 || data.recentTypes.length > 40) fail.push('recent-memory-limit');
    api.generateQuestion('logic', 8);
    if (data.recent.length !== 300) fail.push('recent-memory-overflow');

    const storyFrames = new Set();
    for (let i = 0; i < 120; i++) storyFrames.add(api.generateQuestion('math', 6, 'story').prompt.he.replace(/\d+/g, '#'));
    if (storyFrames.size < 5) fail.push(`story-variety:${storyFrames.size}`);
    return { fail, bands, unique: signatures.size, storyFrames: storyFrames.size };
  });
  if (result.fail.length) throw new Error(JSON.stringify(result));

  await page.locator('[data-action="daily"]').click();
  if (!await page.locator('.daily-theme').count()) throw new Error('Daily theme is not visible in the mission');
  if (!await page.locator('.challenge-band').count()) throw new Error('Adaptive challenge band is not visible');
  const mission = await page.evaluate(() => MishaLab.getData().session);
  if (new Set(mission.dailyOrder).size !== 4 || !Number.isInteger(mission.themeIndex)) throw new Error('Daily mission metadata is missing');

  console.log(JSON.stringify(result));
  console.log('Automatic renewal, anti-repeat memory, adaptive mix and daily themes passed');
  await browser.close();
  server.close();
})().catch(async error => {
  if (browser) await browser.close().catch(() => {});
  if (server) server.close();
  console.error(error);
  process.exit(1);
});
