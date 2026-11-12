const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright-core');
const { createStaticServer } = require('./static-server.cjs');

let server;
let browser;
(async () => {
  server = createStaticServer(8776);
  browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const viewports = [
    { width: 360, height: 640 },
    { width: 390, height: 844 },
    { width: 768, height: 700 },
    { width: 1440, height: 800 }
  ];
  const domains = ['math', 'logic', 'geometry', 'chess'];
  const failures = [];

  const inspect = async (page, label) => {
    await page.waitForTimeout(120);
    const metrics = await page.evaluate(() => {
      const panel = document.querySelector('.task-shell');
      const actions = panel?.querySelector(':scope > .actions');
      const panelRect = panel?.getBoundingClientRect();
      const actionsRect = actions?.getBoundingClientRect();
      const visibleChildren = panel ? [...panel.children].filter(element => getComputedStyle(element).display !== 'none') : [];
      return {
        viewport: { width: innerWidth, height: innerHeight },
        scrollWidth: document.documentElement.scrollWidth,
        panelOverflow: panel ? panel.scrollHeight - panel.clientHeight : 999,
        panelBottom: panelRect?.bottom,
        actionTop: actionsRect?.top,
        actionBottom: actionsRect?.bottom,
        hiddenChildren: visibleChildren.filter(element => {
          const rect = element.getBoundingClientRect();
          return rect.bottom > Math.min(innerHeight, panelRect.bottom) + 2 || rect.top < panelRect.top - 2;
        }).map(element => element.className || element.tagName),
        compact: document.body.classList.contains('task-compact'),
        tight: document.body.classList.contains('task-tight'),
        zoom: getComputedStyle(document.querySelector('main')).zoom
      };
    });
    if (metrics.scrollWidth > metrics.viewport.width + 1) failures.push(`${label}:horizontal:${JSON.stringify(metrics)}`);
    if (metrics.panelOverflow > 2) failures.push(`${label}:panel-overflow:${JSON.stringify(metrics)}`);
    if (metrics.panelBottom > metrics.viewport.height + 2 || metrics.actionBottom > metrics.viewport.height + 2 || metrics.actionTop < 0) failures.push(`${label}:actions-clipped:${JSON.stringify(metrics)}`);
    if (metrics.hiddenChildren.length) failures.push(`${label}:hidden:${JSON.stringify(metrics)}`);
  };

  for (const viewport of viewports) {
    for (const domain of domains) {
      const page = await browser.newPage({ viewport });
      await page.goto('http://127.0.0.1:8776', { waitUntil: 'networkidle' });
      await page.evaluate(currentDomain => { MishaLab.getData().levels[currentDomain] = 10; }, domain);
      await page.locator(`.island-hotspot[data-track="${domain}"]`).click();
      await page.locator('.task-shell').waitFor();
      await inspect(page, `${viewport.width}x${viewport.height}:${domain}:question`);
      if (viewport.width === 390 && domain === 'math') await page.screenshot({ path: '/workspace/mishalab/artifacts/task-math-390x844.png' });
      const hint = page.locator('[data-action="hint"]');
      if (await hint.count()) {
        await hint.click();
        await hint.click();
        await hint.click();
        await inspect(page, `${viewport.width}x${viewport.height}:${domain}:hints`);
        if (viewport.width === 360 && domain === 'chess') await page.screenshot({ path: '/workspace/mishalab/artifacts/task-chess-hints-360x640.png' });
      }
      await page.locator('[data-action="skip"]').click();
      await inspect(page, `${viewport.width}x${viewport.height}:${domain}:feedback`);
      await page.close();
    }
  }

  if (failures.length) throw new Error(failures.slice(0, 20).join('\n'));
  console.log('Questions, hints, feedback and controls fit 360–1440px viewports without scrolling');
  await browser.close();
  server.close();
})().catch(async error => {
  if (browser) await browser.close().catch(() => {});
  if (server) server.close();
  console.error(error);
  process.exit(1);
});
