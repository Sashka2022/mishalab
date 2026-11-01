const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright-core');
const http = require('http');
const fs = require('fs');

let server;
(async () => {
  server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(fs.readFileSync('/workspace/mishalab/index.html'));
  }).listen(8767, '127.0.0.1');
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:8767');
  const result = await page.evaluate(() => {
    const fail = [];
    const forced = {
      math: ['add', 'missing', 'multiply', 'sequence', 'fraction', 'estimate', 'story', 'pair', 'multi', 'always', 'research'],
      logic: ['balance', 'sequence', 'match', 'deduce', 'oddone', 'visualSequence'],
      geometry: ['shape', 'area', 'symmetry', 'perimeter', 'angle', 'compose', 'hidden']
    };
    for (const [domain, types] of Object.entries(forced)) {
      for (const type of types) {
        for (let i = 0; i < 15; i++) {
          const q = MishaLab.generateQuestion(domain, 8, type);
          if (q.type !== type) fail.push(`${domain}:${type}:wrong-type`);
          if (q.hints.length !== 3 || !q.prompt.he || !q.prompt.ru) fail.push(`${domain}:${type}:translation`);
          if (q.mode === 'number' && !MishaLab.checkAnswer(q, q.answer)) fail.push(`${domain}:${type}:answer`);
          if (q.mode === 'options' && !MishaLab.checkAnswer({ ...q, selected: q.answer })) fail.push(`${domain}:${type}:option`);
        }
      }
    }
    const chessTypes = new Set();
    for (let i = 0; i < 400; i++) {
      const q = MishaLab.generateQuestion('chess', 10);
      chessTypes.add(q.type);
      if (!q.answer.length || !MishaLab.checkAnswer({ ...q, selected: q.answer[0] })) fail.push(`chess:${q.type}:answer`);
    }
    for (const type of ['safe', 'mate', 'threat']) if (!chessTypes.has(type)) fail.push(`chess:${type}:missing`);

    const data = MishaLab.getData();
    data.levels.math = 3;
    const good = Array.from({ length: 5 }, () => ({ domain: 'math', open: false, correct: true, attempts: 1, hints: 0 }));
    const changes = MishaLab.applyRoundProgress(good, { ...data.levels });
    if (data.levels.math !== 5 || changes.math.after !== 5) fail.push('automatic-round-advance');
    return { fail, checkedTypes: Object.values(forced).flat().length + chessTypes.size };
  });
  if (result.fail.length) throw new Error(JSON.stringify(result.fail.slice(0, 20)));
  console.log(`${result.checkedTypes} task types and automatic round advancement passed`);
  await browser.close();
  server.close();
})().catch(error => {
  if (server) server.close();
  console.error(error);
  process.exit(1);
});
