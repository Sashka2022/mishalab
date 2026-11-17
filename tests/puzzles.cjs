const assert = require('node:assert/strict');
const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright-core');
const { createStaticServer } = require('./static-server.cjs');

let browser, server;
(async () => {
  server = createStaticServer(8782);
  browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:8782');
  const generated = await page.evaluate(() => {
    const fail = [], totals = {};
    const neighbors = (i, n) => Array.from({ length: n * n }, (_, j) => j).filter(j => Math.abs(Math.floor(i / n) - Math.floor(j / n)) + Math.abs(i % n - j % n) === 1);
    const toggle = (b, i, n) => { for (const j of [i, ...neighbors(i, n)]) b[j] = 1 - b[j]; };
    const groups = b => [
      ...Array.from({ length: 4 }, (_, r) => b.slice(r * 4, r * 4 + 4)),
      ...Array.from({ length: 4 }, (_, c) => [b[c], b[c + 4], b[c + 8], b[c + 12]]),
      ...[0, 2, 8, 10].map(i => [b[i], b[i + 1], b[i + 4], b[i + 5]])
    ];
    for (const kind of PuzzleGames.kinds) {
      totals[kind] = 0;
      for (let level = 1; level <= 10; level++) for (let sample = 0; sample < 20; sample++) {
        const q = MishaLab.generateQuestion('logic', level, kind);
        totals[kind]++;
        if (!MishaLab.validQuestion(q) || MishaLab.checkAnswer(q)) fail.push(`${kind}:invalid-or-solved-start`);
        if (kind === 'sudoku') {
          if (groups(q.answer).some(g => new Set(g).size !== 4 || g.some(v => v < 1 || v > 4))) fail.push('sudoku:invalid-solution');
          // Independent exhaustive solve checks givens and uniqueness.
          let solutions = 0;
          const b = q.initial.slice();
          function solve() {
            const i = b.indexOf(0);
            if (i < 0) { solutions++; return; }
            for (let v = 1; v <= 4; v++) {
              b[i] = v;
              if (groups(b).every(g => new Set(g.filter(Boolean)).size === g.filter(Boolean).length)) solve();
              b[i] = 0;
            }
          }
          solve(); if (solutions !== 1) fail.push(`sudoku:solutions:${solutions}`);
          q.board = q.answer.slice();
        } else if (kind === 'lights') {
          for (const i of q.solution) toggle(q.board, i, q.n);
        } else if (kind === 'sliding') {
          const b = q.board.slice();
          for (const tile of q.solution) {
            const from = b.indexOf(tile), blank = b.indexOf(0);
            if (!neighbors(blank, 3).includes(from)) fail.push('sliding:illegal-solution-step');
            [b[from], b[blank]] = [b[blank], b[from]];
          }
          if (b.join() !== q.answer.join()) fail.push('sliding:unsolvable');
          q.board = b;
        } else {
          const lineRuns = line => (line.join('').match(/1+/g) || ['']).map(s => s.length);
          const valid = b => Array.from({ length: 4 }, (_, i) => i).every(i => lineRuns(b.slice(i * 4, i * 4 + 4)).join() === q.rowClues[i].join() && lineRuns([b[i], b[i + 4], b[i + 8], b[i + 12]]).join() === q.colClues[i].join());
          // Exhaust all 65,536 boards for a sample at every level.
          if (sample === 0) {
            let solutions = 0;
            for (let mask = 0; mask < 65536; mask++) if (valid(Array.from({ length: 16 }, (_, i) => mask >> i & 1))) solutions++;
            if (solutions !== 1) fail.push(`nonogram:solutions:${solutions}`);
          }
          q.board = q.answer.map(v => v || -1);
          if (!valid(q.answer)) fail.push('nonogram:bad-clues');
        }
        if (!MishaLab.checkAnswer(q)) fail.push(`${kind}:rejected-solution`);
        q.board[0] = q.type === 'sudoku' || q.type === 'sliding' ? 99 : q.board[0] === 1 ? 0 : 1;
        if (MishaLab.checkAnswer(q)) fail.push(`${kind}:accepted-wrong-board`);
      }
    }
    // Even small puzzle spaces must avoid immediate repetition.
    for (const kind of PuzzleGames.kinds) {
      let last = '';
      for (let i = 0; i < 80; i++) { const q = MishaLab.generateQuestion('logic', 1, kind); if (q.signature === last) fail.push(`${kind}:immediate-repeat`); last = q.signature; }
    }
    return { fail, totals };
  });
  assert.deepEqual(generated.fail, []);

  async function solveCurrent() {
    const q = await page.evaluate(() => MishaLab.getData().session.task);
    if (q.type === 'sudoku') {
      for (let i = 0; i < 16; i++) if (!q.initial[i]) {
        await page.locator(`[data-puzzle-action="select"][data-puzzle-value="${i}"]`).click();
        await page.locator(`[data-puzzle-action="digit"][data-puzzle-value="${q.answer[i]}"]`).click();
      }
    } else if (q.type === 'lights') {
      for (const i of q.solution) await page.locator(`[data-puzzle-action="tile"][data-puzzle-value="${i}"]`).click();
    } else if (q.type === 'sliding') {
      for (const tile of q.solution) {
        const i = await page.evaluate(tile => MishaLab.getData().session.task.board.indexOf(tile), tile);
        await page.locator(`[data-puzzle-action="tile"][data-puzzle-value="${i}"]`).click();
      }
    } else {
      for (let i = 0; i < 16; i++) if (q.answer[i]) await page.locator(`[data-puzzle-action="tile"][data-puzzle-value="${i}"]`).click();
    }
    await page.locator('[data-action="check"]').click();
    await page.locator('.feedback.success').waitFor();
  }
  // Verify all four playable boards, undo, local persistence and manual renewal.
  await page.locator('[data-action="puzzle-auto"]').click();
  for (const kind of ['sudoku', 'lights', 'sliding', 'nonogram']) {
    await page.locator(`[data-puzzle-kind="${kind}"]`).click();
    if (kind === 'lights') {
      const initial = await page.evaluate(() => MishaLab.getData().session.task.board);
      await page.locator('[data-puzzle-action="tile"]').first().click();
      await page.reload();
      await page.locator('[data-action="resume"]').click();
      assert.notDeepEqual(await page.evaluate(() => MishaLab.getData().session.task.board), initial);
      await page.locator('[data-puzzle-action="undo"]').click();
      assert.deepEqual(await page.evaluate(() => MishaLab.getData().session.task.board), initial);
    }
    await solveCurrent();
    await page.locator('[data-action="next"]').click();
    assert.equal(await page.evaluate(() => MishaLab.getData().session.task.type), kind);
    await page.locator('[data-action="home"]').first().click();
  }
  await page.clock.install();
  await page.locator('[data-action="puzzle-auto"]').click();
  await page.locator('[data-puzzle-kind="mixed"]').click();
  const seen = [];
  for (let i = 0; i < 5; i++) {
    seen.push(await page.evaluate(() => MishaLab.getData().session.task.type));
    await solveCurrent();
    await page.clock.runFor(5100);
  }
  assert.equal(new Set(seen.slice(0, 4)).size, 4);
  assert.equal(await page.evaluate(() => MishaLab.getData().rounds.at(-1).track), 'puzzles');
  await page.clock.runFor(3100);
  assert.equal(await page.evaluate(() => MishaLab.getData().session.results.length), 0);
  await solveCurrent();
  const finishedSignature = await page.evaluate(() => MishaLab.getData().session.task.signature);
  await page.locator('[data-action="puzzle-auto"]').click();
  await page.clock.runFor(8000);
  assert.equal(await page.evaluate(() => MishaLab.getData().session.task.signature), finishedSignature);
  await page.reload();
  assert.equal(await page.evaluate(() => MishaLab.getData().puzzleAuto), false);
  await page.locator('[data-action="resume"]').click();
  await page.locator('[data-action="next"]').click();
  await page.locator('[data-action="skip"]').click();
  const skippedSignature = await page.evaluate(() => MishaLab.getData().session.task.signature);
  await page.locator('[data-action="puzzle-auto"]').click();
  await page.clock.runFor(8000);
  assert.equal(await page.evaluate(() => MishaLab.getData().session.task.signature), skippedSignature);

  // Board targets stay usable at phone/tablet/desktop sizes in both languages.
  await page.locator('[data-action="home"]').first().click();
  for (const width of [360, 390, 768, 1440]) for (const lang of ['he', 'ru', 'both']) {
    await page.setViewportSize({ width, height: width < 768 ? 640 : 900 });
    await page.locator(`[data-lang="${lang}"]`).click();
    for (const kind of ['sudoku', 'lights', 'sliding', 'nonogram']) {
      await page.locator(`[data-puzzle-kind="${kind}"]`).click();
      const box = await page.locator('.puzzle-tile').first().boundingBox();
      assert.ok(box.width >= 43, `Small target ${kind}: ${box.width}`);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      await page.locator('[data-action="hint"]').click();
      await page.locator('[data-action="skip"]').click();
      await page.locator('[data-action="next"]').click();
      await page.locator('[data-action="home"]').first().click();
    }
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ generated: generated.totals, mixedOrder: seen }));
  console.log('Unique solutions, legal moves, four board UIs, persistence, automatic/manual renewal and 48 responsive language layouts passed');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); if (server) server.close(); });
