const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright-core');
const fs = require('fs');
const { createStaticServer } = require('./static-server.cjs');

let server;
let browser;
(async () => {
  fs.mkdirSync('/workspace/mishalab/artifacts', { recursive: true });
  server = createStaticServer(8774);
  browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => errors.push(`${request.url()}: ${request.failure()?.errorText}`));

  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : width === 768 ? 1024 : 1000 });
    await page.goto('http://127.0.0.1:8774', { waitUntil: 'networkidle' });
    await page.screenshot({ path: `/workspace/mishalab/artifacts/home-${width}.png`, fullPage: true });
    const layout = await page.evaluate(() => {
      const map = document.querySelector('.map-card')?.getBoundingClientRect();
      const mission = document.querySelector('.mission-card')?.getBoundingClientRect();
      return {
        scrollWidth: document.documentElement.scrollWidth,
        viewport: innerWidth,
        map: map && { x: map.x, y: map.y, width: map.width },
        mission: mission && { x: mission.x, y: mission.y, width: mission.width },
        hotspots: [...document.querySelectorAll('.island-hotspot')].map(button => {
          const rect = button.getBoundingClientRect();
          return { track: button.dataset.track, width: rect.width, height: rect.height, label: button.getAttribute('aria-label') };
        }),
        brokenImages: [...document.images].filter(img => !img.complete || !img.naturalWidth).map(img => img.src),
        primary: getComputedStyle(document.documentElement).getPropertyValue('--purple').trim(),
        bodyText: document.body.innerText
      };
    });
    if (layout.scrollWidth > layout.viewport) throw new Error(`${width}px horizontal overflow`);
    if (layout.brokenImages.length) throw new Error(`${width}px broken art: ${layout.brokenImages.join(', ')}`);
    if (!layout.map || !layout.mission) throw new Error(`${width}px map composition is missing`);
    if (layout.hotspots.length !== 4 || new Set(layout.hotspots.map(item => item.track)).size !== 4) throw new Error(`${width}px interactive islands are missing`);
    if (layout.hotspots.some(item => item.width < 44 || item.height < 44 || !item.label)) throw new Error(`${width}px island target is too small or unlabeled`);
    if (width >= 1024 && !(layout.map.width > layout.mission.width && Math.abs(layout.map.y - layout.mission.y) < 4)) throw new Error('Desktop composition does not match the two-column reference');
    if (width <= 768 && !(layout.map.y < layout.mission.y && Math.abs(layout.map.width - layout.mission.width) < 4)) throw new Error(`${width}px composition is not stacked map-first: ${JSON.stringify({ map: layout.map, mission: layout.mission })}`);
    if (layout.primary !== '#6a61e8') throw new Error('Reference palette token mismatch');
    if (/[🚀🔭🔥🧭🏆⚗🤖🧩]/u.test(layout.bodyText)) throw new Error('Emoji art remains in the home screen');
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:8774', { waitUntil: 'networkidle' });
  await page.locator('.island-hotspot[data-track="math"]').click();
  await page.locator('.task-shell').waitFor();
  if (!await page.locator('.quest-head').getByText('חשבון חכם', { exact: true }).count()) throw new Error('Clickable math island did not open the math route');
  await page.locator('[data-action="home"]').click();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.screenshot({ path: '/workspace/mishalab/artifacts/home-focus-390.png', fullPage: false });
  await page.locator('[data-action="toggle-speech"]').click();
  await page.screenshot({ path: '/workspace/mishalab/artifacts/home-readaloud-390.png', fullPage: false });

  await page.setViewportSize({ width: 1440, height: 1060 });
  await page.setContent('<style>*{box-sizing:border-box}html,body{margin:0;width:1440px;height:1060px;overflow:hidden}img{display:block;width:1440px;height:1060px}</style><img src="http://127.0.0.1:8774/design/reference-home-map.svg" alt="">');
  await page.locator('img').evaluate(img => img.decode());
  await page.screenshot({ path: '/workspace/mishalab/artifacts/reference-home-map.png', fullPage: false, timeout: 10000 });

  if (errors.length) throw new Error(errors.join('\n'));
  console.log('Clickable islands, reference composition, SVG assets, RTL responsive layouts, focus and read-aloud screenshots passed');
  await browser.close();
  server.close();
})().catch(async error => {
  if (browser) await browser.close().catch(() => {});
  if (server) server.close();
  console.error(error);
  process.exit(1);
});
