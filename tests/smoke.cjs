const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright-core');
const { createStaticServer } = require('./static-server.cjs');

let server;
let browser;
(async () => {
  server = createStaticServer(8765);
  browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:8765');
  const results = await page.evaluate(() => {
    const api = MishaLab, fail = [];
    let checks = 0;
    for (const domain of ['math', 'logic', 'geometry', 'chess']) for (let level = 1; level <= 10; level++) for (let i = 0; i < 40; i++) {
      const q = api.generateQuestion(domain, level);
      checks++;
      if (q.mode === 'number' && !api.checkAnswer(q, q.answer)) fail.push(q);
      if (q.mode === 'number' && q.display) {
        const nums = q.display.match(/\d+/g)?.map(Number) || [];
        let expected;
        if (q.type === 'add') expected = nums[0] + nums[1];
        if (q.type === 'missing') expected = nums[1] - nums[0];
        if (q.type === 'multiply') expected = nums[0] / nums[1];
        if (q.type === 'fraction') expected = nums[0] / nums[1] * nums[2];
        if (q.type === 'story') expected = nums[0] * nums[1] - nums[2];
        if (q.type === 'pair') expected = (nums[0] + nums[1]) / 2;
        if (q.type === 'sequence') { const diff = nums[3] - nums[2], prior = nums[2] - nums[1]; expected = nums[3] + diff + (diff - prior); }
        if (expected !== undefined && q.answer !== expected) fail.push({ type: q.type, expected, actual: q.answer });
        if (api.checkAnswer(q, q.answer + 1)) fail.push({ falsePositive: q.type });
      }
      if (q.mode === 'chess') {
        if (!q.answer.length) fail.push(q);
        for (const to of q.answer) if (!api.attacks(q.piece, q.from, to, q.board)) fail.push(q);
      }
      if (q.mode === 'match') {
        const solutions = [];
        q.initial.forEach((value, from) => {
          if (!value) return;
          q.initial.forEach((target, to) => {
            if (target) return;
            const board = q.initial.slice(); board[from] = 0; board[to] = 1;
            if (api.checkAnswer({ ...q, board, moves: 1 })) solutions.push([from, to]);
          });
        });
        if (!solutions.length) fail.push({ digits: q.digits });
      }
    }
    const data = api.getData();
    data.levels.math = 3; data.mastery = {}; data.history = [];
    for (let i = 0; i < 3; i++) api.adaptDifficulty({ domain: 'math', type: 'missing', correct: true, attempts: 1, hints: 0, seconds: 20 });
    if (data.levels.math !== 4) fail.push('three-success advancement');
    data.levels.math = 3; data.mastery = {};
    for (let i = 0; i < 3; i++) api.adaptDifficulty({ domain: 'math', type: 'missing', correct: true, attempts: 1, hints: 1, seconds: 20 });
    if (data.levels.math !== 3) fail.push('hinted answers advanced');
    return { checks, fail };
  });
  console.log(JSON.stringify(results));
  if (results.fail.length) throw new Error('generator failures');
  await page.locator('[data-action="daily"]').click();
  for (let i = 0; i < 5; i++) { await page.locator('[data-action="skip"]').click(); await page.locator('[data-action="next"]').click(); }
  await page.locator('[data-action="home"]').first().click();
  await page.locator('[data-action="teacher"]').click();
  if (await page.evaluate(() => MishaLab.getData().rounds.length) !== 1) throw new Error('round persistence');
  await page.reload();
  if (await page.evaluate(() => MishaLab.getData().rounds.length) !== 1) throw new Error('reload persistence');
  await page.locator('[data-lang="ru"]').click();
  if (await page.locator('html').getAttribute('dir') !== 'ltr') throw new Error('Russian direction');
  await page.locator('[data-lang="both"]').click();
  if (!await page.locator('[lang="he"][dir="rtl"]').count() || !await page.locator('[lang="ru"][dir="ltr"]').count()) throw new Error('bilingual direction');
  await page.setViewportSize({ width: 390, height: 844 });
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) {
    const offenders = await page.evaluate(() => [...document.querySelectorAll('*')].filter(el => {
      const box = el.getBoundingClientRect();
      return box.right > innerWidth + 1 || box.left < -1;
    }).slice(0, 12).map(el => ({ tag: el.tagName, class: el.className?.baseVal || el.className || '', left: Math.round(el.getBoundingClientRect().left), right: Math.round(el.getBoundingClientRect().right), width: Math.round(el.getBoundingClientRect().width) })));
    throw new Error(`mobile overflow: ${JSON.stringify(offenders)}`);
  }
  await page.screenshot({ path: '/workspace/mishalab/tests/home.png', fullPage: true });
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('UI, five-task session, storage, languages and mobile checks passed');
  await browser.close(); server.close();
})().catch(async error => {
  if (browser) await browser.close().catch(() => {});
  if (server) server.close();
  console.error(error); process.exit(1);
});
