const assert = require('node:assert/strict');
const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright-core');
const { createStaticServer } = require('./static-server.cjs');
let server, browser;
(async () => {
  server = createStaticServer(8774);
  browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    for (const lang of ['he', 'ru', 'both']) {
      await page.goto('http://127.0.0.1:8774', { waitUntil: 'networkidle' });
      await page.locator(`[data-lang="${lang}"]`).click();
      const layout = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        games: [...document.querySelectorAll('.arcade-world')].map(button => { const r = button.getBoundingClientRect(); return { width: r.width, height: r.height, label: button.getAttribute('aria-label'), domain: button.dataset.track }; }),
        brokenImages: [...document.images].filter(img => !img.complete || !img.naturalWidth).map(img => img.src),
        difficultyTop: document.querySelector('.difficulty-picker').getBoundingClientRect().top,
        playTop: document.querySelector('[data-action="daily"]').getBoundingClientRect().top
      }));
      assert.equal(layout.overflow, false, `${width}:${lang}:horizontal-overflow`);
      assert.deepEqual(layout.brokenImages, []);
      assert.equal(new Set(layout.games.map(g => g.domain)).size, 4);
      assert.ok(layout.games.every(g => g.width >= 44 && g.height >= 44 && g.label));
      assert.ok(layout.difficultyTop < layout.playTop, 'Difficulty should precede starting a game');
      if (lang === 'both') await page.screenshot({ path: `/workspace/mishalab/artifacts/game-home-${width}.png`, fullPage: true });
      await page.locator('.arcade-world[data-track="math"]').click();await page.locator('[data-session-action="begin"]').click();
      assert.equal(await page.evaluate(() => MishaLab.getData().session.track), 'math');
      await page.locator('[data-action="home"]').first().click();
      await page.locator('.puzzle-card[data-puzzle-kind="nonogram"]').click();await page.locator('[data-session-action="begin"]').click();
      const size = await page.locator('button.copy-tile').first().boundingBox();
      assert.ok(size.width >= 44 && size.height >= 44, `${width}:${lang}:paint-target-too-small`);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      if (lang === 'both') await page.screenshot({ path: `/workspace/mishalab/artifacts/game-paint-${width}.png` });
      // A focused cell stays focused after an input causes the board to render again.
      const tile = page.locator('button.copy-tile:not(:disabled)').first();
      const index = await tile.getAttribute('data-puzzle-value');
      await tile.focus(); await page.keyboard.press('Space');
      assert.equal(await page.locator('button.copy-tile:focus').getAttribute('data-puzzle-value'), index);
      await page.locator('[data-action="home"]').first().click();
    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const duration = await page.locator('.arcade-world').first().evaluate(el => getComputedStyle(el).transitionDuration);
  assert.ok(duration.split(',').every(v => parseFloat(v) === 0));
  await page.locator('[data-action="toggle-speech"]').click();
  assert.equal(await page.locator('[data-action="toggle-speech"]').getAttribute('aria-pressed'), 'true');
  assert.deepEqual(errors, []);
  console.log('Arcade home, playable world cards, difficulty placement, 12 language layouts, painting targets, keyboard focus, speech and reduced motion passed');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); if (server) server.close(); });
