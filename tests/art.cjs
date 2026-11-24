const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('/opt/codex/cua_node/lib/node_modules/playwright-core');
const {createStaticServer} = require('./static-server.cjs');

const order = ['microscope','test-tube','magnet','telescope','abacus','ruler-compass','cubes','balance','puzzle-piece','light-bulb','matches','tiles','knight','rook','crown','chess-board','globe','compass','balloon','treasure-map','crane','paper-boat','maze','book'];
const samples = order.map((slug,i)=>`assets/stickers/sticker-${String(i+1).padStart(2,'0')}-${slug}.svg`).concat(['think','cheer','sleepy'].map(mood=>`assets/characters/mishi-${mood}.svg`),'assets/characters/mishi.svg');
const palette = ['#203047','#F5C451','#6A61E8','#F47C6C','#81D3C0','#DDF5E9','#FFF8E8','#FFFDF7','#F7FAFF','#DCEAF4','#E8E5FF','#FFFFFF'];
let browser, server;
(async () => {
  server = createStaticServer(0);
  await new Promise(resolve => server.once('listening', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
  const page = await browser.newPage({viewport:{width:1800,height:1000}});
  await page.goto(origin + '/design/art-review.html');
  await page.evaluate(()=>window.artReady);
  for (const file of samples) {
    const svg = fs.readFileSync(path.join(__dirname,'..',file),'utf8');
    assert.ok(Buffer.byteLength(svg) < 15*1024, file + ': under 15KB');
    const result = await page.evaluate(({svg,palette}) => {
      const doc = new DOMParser().parseFromString(svg,'image/svg+xml');
      const root = doc.documentElement;
      const allowed = ['svg','g','rect','circle','ellipse','path','polygon','line','defs','linearGradient','stop'];
      const nodes = [...doc.querySelectorAll('*')];
      return {
        parseError:!!doc.querySelector('parsererror'),
        viewBox:root.getAttribute('viewBox'),
        elementCount:nodes.length,
        gradients:doc.querySelectorAll('linearGradient').length,
        forbidden:nodes.filter(node => !allowed.includes(node.localName)).map(node => node.localName),
        invalidColors:nodes.flatMap(node => ['fill','stroke','stop-color'].filter(attr => node.hasAttribute(attr)).map(attr => node.getAttribute(attr))).filter(color => color !== 'none' && !palette.includes(color)),
        unsafe:nodes.flatMap(node => [...node.attributes].filter(attr => /^on/i.test(attr.name) || /^(href|style|filter)$/i.test(attr.name) || /(?:base64|url\s*\()/i.test(attr.value)).map(attr => attr.name)),
        head:doc.querySelector('rect[x="91"][y="78"][width="178"][height="177"][rx="58"]') !== null,
        screen:doc.querySelector('rect[x="112"][y="112"][width="136"][height="100"][rx="38"]') !== null,
        antenna:doc.querySelector('circle[cx="180"][cy="39"][r="12"]') !== null,
        body:doc.querySelector('rect[x="122"][y="234"][width="116"][height="108"][rx="38"]') !== null,
        moods:[...doc.querySelectorAll('g[data-mood]')].map(group=>group.getAttribute('data-mood')),
        sharedBody:!!doc.querySelector('g#body')
      };
    },{svg,palette});
    assert.equal(result.parseError,false,file + ': XML parses');
    assert.deepEqual(result.forbidden,[],file + ': permitted elements');
    assert.deepEqual(result.invalidColors,[],file + ': fixed shared palette');
    assert.deepEqual(result.unsafe,[],file + ': no scripts, styles, filters, or external assets');
    assert.ok(result.gradients<=1,file + ': at most one gradient');
    if(file.includes('/stickers/')) {
      assert.equal(result.viewBox,'0 0 512 512',file);
      assert.ok(result.elementCount<=40,file + ': shape budget');
    } else {
      assert.equal(result.viewBox,'0 0 360 420',file);
      assert.ok(result.head && result.screen && result.antenna && result.body,file + ': preserve original robot geometry');
      if(file.endsWith('/mishi.svg')) {
        assert.ok(result.sharedBody,'Layered robot has a shared body');
        assert.deepEqual([...result.moods].sort(),['cheer','idle','sleepy','success','think'],'Five distinct mood layers');
      }
    }
  }
  await page.locator('img').evaluateAll(imgs => Promise.all(imgs.map(img => img.decode())));
  assert.equal(await page.locator('figure').count(),30,'Original robot, five moods and24stickers');
  assert.equal(await page.locator('.large').count(),30);
  assert.equal(await page.locator('.small').count(),30);
  assert.deepEqual(await page.locator('.large').evaluateAll(imgs=>imgs.map(img=>[img.clientWidth,img.clientHeight])),Array.from({length:30},()=>[512,512]));
  assert.deepEqual(await page.locator('.small').evaluateAll(imgs=>imgs.map(img=>[img.clientWidth,img.clientHeight])),Array.from({length:30},()=>[64,64]));
  fs.mkdirSync(path.join(__dirname,'..','artifacts'),{recursive:true});
  await page.screenshot({path:path.join(__dirname,'..','artifacts','art-sheet.png'),fullPage:true});
  // Smaller sheets retain legible labels when inspecting a large collection.
  for(let start=0;start<30;start+=6) {
    const first=await page.locator('figure').nth(start).boundingBox();
    const last=await page.locator('figure').nth(start+5).boundingBox();
    await page.screenshot({path:path.join(__dirname,'..','artifacts',`art-sheet-${start/6+1}.png`),fullPage:true,clip:{x:32,y:first.y-8,width:1736,height:last.y+last.height-first.y+16}});
  }
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth),false,'Review page fits mobile');
  console.log('Art:24 stickers,3 new expression files and5-mood sprite pass XML, palette, geometry, shape budgets,512/64 render and mobile review.');
})().catch(error => {console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.close();});
