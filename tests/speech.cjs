const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright-core');
const { createStaticServer } = require('./static-server.cjs');

let server;
let browser;
(async () => {
  server = createStaticServer(8772);
  browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.addInitScript(() => {
    window.__spoken = [];
    window.__cancelled = 0;
    class TestUtterance {
      constructor(text) { this.text = text; }
    }
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: TestUtterance });
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        cancel() { window.__cancelled += 1; },
        speak(utterance) { window.__spoken.push({ text: utterance.text, lang: utterance.lang }); },
        getVoices() { return [{ lang: 'he-IL' }, { lang: 'ru-RU' }]; }
      }
    });
  });
  await page.goto('http://127.0.0.1:8772');

  const toggle = page.locator('[data-action="toggle-speech"]');
  if (await toggle.getAttribute('aria-pressed') !== 'false') throw new Error('Read-aloud toggle should start off');
  await toggle.click();
  if (await toggle.getAttribute('aria-pressed') !== 'true') throw new Error('Read-aloud toggle did not activate');
  if (!await page.evaluate(() => MishaLab.getData().readAloud)) throw new Error('Read-aloud preference was not saved');
  let spoken = await page.evaluate(() => window.__spoken);
  if (!spoken.some(x => x.lang === 'he-IL') || !spoken.some(x => x.lang === 'ru-RU')) throw new Error('Bilingual home narration is missing');

  await page.locator('[data-action="daily"]').click();
  const prompt = await page.evaluate(() => MishaLab.getData().session.task.prompt);
  spoken = await page.evaluate(() => window.__spoken);
  if (!spoken.some(x => x.text.includes(prompt.he)) || !spoken.some(x => x.text.includes(prompt.ru))) throw new Error('New task was not narrated in both languages');

  const beforeSelection = spoken.length;
  const task = await page.evaluate(() => MishaLab.getData().session.task);
  if (task.mode === 'options') await page.locator('[data-option="0"]').click();
  if (await page.evaluate(() => window.__spoken.length) !== beforeSelection) throw new Error('Selecting an answer repeated the narration');

  await page.locator('[data-action="hint"]').click();
  if (await page.evaluate(() => window.__spoken.length) <= beforeSelection) throw new Error('Hint was not narrated');
  await toggle.click();
  if (await toggle.getAttribute('aria-pressed') !== 'false') throw new Error('Read-aloud toggle did not deactivate');
  if (await page.evaluate(() => MishaLab.getData().readAloud)) throw new Error('Disabled preference was not saved');
  if (await page.evaluate(() => window.__cancelled) < 1) throw new Error('Speech was not cancelled');

  console.log('Read-aloud toggle, bilingual task narration, hint narration and persistence passed');
  await browser.close();
  server.close();
})().catch(async error => {
  if (browser) await browser.close().catch(() => {});
  if (server) server.close();
  console.error(error);
  process.exit(1);
});
