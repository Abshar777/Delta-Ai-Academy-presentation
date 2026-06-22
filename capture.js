const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FILE = process.argv[2] || 'overlay.html';
const OUT = process.argv[3] || '/tmp/overlayframes';
const MODE = process.argv[4] || 'full';   // 'full' | 'spot:t1,t2,...'
const FPS = 30000 / 1001;                  // 29.97

(async () => {
  if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--force-color-profile=srgb', '--hide-scrollbars'],
    defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
  });
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => { window.RENDER = true; });
  await page.goto('file://' + path.resolve(__dirname, FILE), { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.FONTS_READY === true', { timeout: 20000 }).catch(() => {});
  // explicitly load every weight we use so the render never falls back to a default font
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.load) {
      await Promise.all([
        document.fonts.load('400 60px "DM Sans"'),
        document.fonts.load('500 60px "DM Sans"'),
        document.fonts.load('600 60px "DM Sans"'),
        document.fonts.load('700 60px "DM Sans"'),
      ]);
      await document.fonts.ready;
    }
    // ensure all images (logo) are fully decoded
    await Promise.all([...document.images].map(im => im.complete ? im.decode().catch(()=>{}) : new Promise(r => { im.onload = r; im.onerror = r; })));
  });
  await new Promise(r => setTimeout(r, 700));

  const total = await page.evaluate('window.TOTAL_S');
  const opaque = await page.evaluate('window.OPAQUE === true');
  const shot = (p) => opaque
    ? page.screenshot({ path: p, type: 'jpeg', quality: 92 })
    : page.screenshot({ path: p, omitBackground: true });

  if (MODE.startsWith('spot')) {
    const ts = MODE.split(':')[1].split(',').map(Number);
    for (const t of ts) {
      await page.evaluate((tt) => window.seek(tt), t);
      await shot(path.join(OUT, 'spot_' + String(t).replace('.', '_') + (opaque ? '.jpg' : '.png')));
    }
    console.log('spot frames done:', ts.join(','));
    await browser.close();
    return;
  }

  const step = 1 / FPS;
  const frames = Math.round(total * FPS);
  const ext = opaque ? '.jpg' : '.png';
  console.log(`total=${total.toFixed(3)}s  fps=${FPS.toFixed(3)}  frames=${frames}  opaque=${opaque}`);
  for (let i = 0; i < frames; i++) {
    await page.evaluate((tt) => window.seek(tt), i * step);
    await shot(path.join(OUT, 'f' + String(i).padStart(5, '0') + ext));
    if (i % 90 === 0) process.stdout.write(`\r  frame ${i}/${frames}`);
  }
  console.log(`\r  frame ${frames}/${frames}  done`);
  await browser.close();
})();
