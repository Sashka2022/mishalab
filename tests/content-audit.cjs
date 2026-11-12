const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright-core');
const { createStaticServer } = require('./static-server.cjs');

let server;
let browser;
(async () => {
  server = createStaticServer(8775);
  browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:8775');
  const result = await page.evaluate(() => {
    const fail = [];
    const optionNumber = (q, index = q.answer) => Number(q.options[index].he);

    for (let i = 0; i < 500; i++) {
      const estimate = MishaLab.generateQuestion('math', 4, 'estimate');
      const [x, y] = estimate.display.match(/\d+/g).map(Number);
      const expected = Math.round(x / 10) * 10 + Math.round(y / 10) * 10;
      if (optionNumber(estimate) !== expected) fail.push(`estimate:${estimate.display}:${optionNumber(estimate)}!=${expected}`);
      if (new Set(estimate.options.map(option => option.he)).size !== estimate.options.length) fail.push('estimate:duplicate-options');

      const divisibility = MishaLab.generateQuestion('math', 8, 'divisibility');
      const divisor = Number(divisibility.prompt.he.match(/\d+/)[0]);
      const values = divisibility.options.map(option => Number(option.he));
      if (new Set(values).size !== values.length) fail.push(`divisibility:duplicate:${values.join(',')}`);
      const valid = values.filter(value => value % divisor === 0);
      if (valid.length !== 1 || optionNumber(divisibility) !== valid[0]) fail.push(`divisibility:${divisor}:${values.join(',')}`);

      const visual = MishaLab.generateQuestion('logic', 4, 'visualSequence');
      const symbols = visual.display.match(/[●▲■]/g);
      let period = 1;
      while (period < symbols.length && !symbols.every((symbol, index) => symbol === symbols[index % period])) period++;
      const expectedSymbol = symbols[symbols.length % period];
      if (!visual.options[visual.answer].he.includes(expectedSymbol)) fail.push(`visual-sequence:${visual.display}:${visual.options[visual.answer].he}`);

      const balance = MishaLab.generateQuestion('logic', 1, 'balance');
      if (balance.hints.some(hint => /החסר 0|Вычти 0/.test(`${hint.he} ${hint.ru}`))) fail.push('balance:subtract-zero');
    }

    const optionTypes = {
      math: ['estimate', 'divisibility'],
      logic: ['visualSequence', 'oddone', 'ordering', 'truth'],
      geometry: ['angle', 'compose', 'rotation']
    };
    for (const [domain, types] of Object.entries(optionTypes)) {
      for (const type of types) {
        for (let i = 0; i < 100; i++) {
          const q = MishaLab.generateQuestion(domain, 8, type);
          const labels = q.options.map(option => option.he);
          if (new Set(labels).size !== labels.length) fail.push(`${domain}:${type}:duplicate-options`);
        }
      }
    }

    const levelPools = {
      math: {
        1: ['add', 'subtract', 'missing', 'sequence', 'estimate'],
        4: ['add', 'subtract', 'missing', 'multiply', 'sequence', 'fraction', 'story', 'estimate'],
        7: ['pair', 'story', 'fraction', 'sequence', 'twoStep', 'divisibility', 'multi', 'always'],
        10: ['pair', 'story', 'twoStep', 'divisibility', 'combinations', 'algebra', 'multi', 'always', 'research']
      },
      logic: {
        1: ['balance', 'sequence', 'deduce', 'oddone'],
        4: ['balance', 'sequence', 'match', 'deduce', 'oddone', 'visualSequence'],
        8: ['match', 'deduce', 'visualSequence', 'ordering', 'code', 'truth']
      },
      geometry: {
        1: ['shape', 'perimeter', 'area'],
        4: ['shape', 'perimeter', 'area', 'symmetry', 'angle', 'coordinates'],
        8: ['perimeter', 'area', 'symmetry', 'angle', 'compose', 'hidden', 'rotation', 'coordinates']
      },
      chess: {
        1: ['identity', 'move'],
        4: ['move', 'capture', 'threat', 'identity'],
        7: ['capture', 'threat', 'safe', 'fork'],
        10: ['safe', 'mate', 'threat', 'fork']
      }
    };
    for (const [domain, levels] of Object.entries(levelPools)) {
      for (const [level, allowed] of Object.entries(levels)) {
        for (let i = 0; i < 300; i++) {
          const q = MishaLab.generateQuestion(domain, Number(level));
          if (!allowed.includes(q.type)) fail.push(`${domain}:level-${level}:unexpected-${q.type}`);
        }
      }
    }

    const blackSquares = q => Object.entries(q.board)
      .filter(([, piece]) => /[a-z]/.test(piece))
      .map(([square, piece]) => ({ square: Number(square), piece }));
    const knightThreats = (q, square) => blackSquares(q).filter(target => MishaLab.attacks('N', square, target.square, q.board));
    const attackedByBlack = (q, square) => {
      const board = { ...q.board };
      delete board[q.from];
      return blackSquares(q).some(target => {
        if (target.piece === 'k') {
          const dx = Math.abs(target.square % 8 - square % 8);
          const dy = Math.abs(Math.floor(target.square / 8) - Math.floor(square / 8));
          return Math.max(dx, dy) === 1;
        }
        return /[rbnq]/.test(target.piece) && MishaLab.attacks(target.piece.toUpperCase(), target.square, square, board);
      });
    };

    const chessSeen = { fork: 0, safe: 0, threat: 0, mate: 0 };
    for (let i = 0; i < 2400; i++) {
      const q = MishaLab.generateQuestion('chess', 10);
      chessSeen[q.type] = (chessSeen[q.type] || 0) + 1;
      const pieces = Object.values(q.board);
      if (!pieces.includes('k') || !pieces.includes('K')) fail.push(`chess:${q.type}:missing-king`);
      if (q.type === 'fork') {
        const solutions = q.candidates.filter(square => knightThreats(q, square).length >= 2);
        if (solutions.length !== 1 || solutions[0] !== q.answer[0]) fail.push(`fork:${q.candidates.join(',')}:${solutions.join(',')}`);
      }
      if (q.type === 'safe') {
        const safe = q.candidates.filter(square => !attackedByBlack(q, square));
        if (safe.length !== 1 || safe[0] !== q.answer[0]) fail.push(`safe:${q.candidates.join(',')}:${safe.join(',')}`);
      }
      if (q.type === 'threat') {
        const threatened = blackSquares(q).filter(target => MishaLab.attacks(q.piece, q.from, target.square, q.board));
        if (threatened.length !== 1 || threatened[0].square !== q.answer[0]) fail.push(`threat:${threatened.map(item => item.square).join(',')}:${q.answer[0]}`);
      }
    }
    for (const type of Object.keys(chessSeen)) if (!chessSeen[type]) fail.push(`chess-missing:${type}`);
    return { fail: fail.slice(0, 30), chessSeen };
  });
  if (result.fail.length) throw new Error(JSON.stringify(result, null, 2));
  await page.evaluate(() => {
    const old = { ...MishaLab.getData(), contentVersion: 1, session: { task: { type: 'old-buggy-task' } } };
    localStorage.setItem('misha-lab-v1', JSON.stringify(old));
  });
  await page.reload();
  const migrated = await page.evaluate(() => ({ contentVersion: MishaLab.getData().contentVersion, session: MishaLab.getData().session }));
  if (migrated.contentVersion !== 2 || migrated.session !== null) throw new Error(`Old active task was not retired: ${JSON.stringify(migrated)}`);
  console.log(JSON.stringify(result));
  console.log('Exercise semantics, unique options and unique chess solutions passed');
  await browser.close();
  server.close();
})().catch(async error => {
  if (browser) await browser.close().catch(() => {});
  if (server) server.close();
  console.error(error);
  process.exit(1);
});
