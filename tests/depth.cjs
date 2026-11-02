const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright-core');
const http = require('http');
const fs = require('fs');

let server;
(async () => {
  server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(fs.readFileSync('/workspace/mishalab/index.html'));
  }).listen(8770, '127.0.0.1');
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:8770');
  const result = await page.evaluate(() => {
    const diversity = {};
    for (const domain of ['math', 'logic', 'geometry', 'chess']) {
      const signatures = new Set(), types = new Set();
      for (let i = 0; i < 600; i++) {
        const q = MishaLab.generateQuestion(domain, 10);
        signatures.add(q.signature);
        types.add(q.type);
      }
      diversity[domain] = { unique: signatures.size, types: types.size };
    }
    const averageOperand = level => {
      let total = 0;
      for (let i = 0; i < 200; i++) {
        const q = MishaLab.generateQuestion('math', level, 'add');
        total += Number(q.display.match(/\d+/)[0]);
      }
      return total / 200;
    };
    return { diversity, lowOperand: averageOperand(1), highOperand: averageOperand(10) };
  });
  const minimum = { math: 300, logic: 140, geometry: 100, chess: 100 };
  for (const [domain, expected] of Object.entries(minimum)) {
    if (result.diversity[domain].unique < expected) throw new Error(`${domain} diversity ${result.diversity[domain].unique} < ${expected}`);
  }
  if (result.highOperand < result.lowOperand * 5) throw new Error('Level 10 number scale is not substantially higher than level 1');
  console.log(JSON.stringify(result));
  await browser.close();
  server.close();
})().catch(error => {
  if (server) server.close();
  console.error(error);
  process.exit(1);
});
