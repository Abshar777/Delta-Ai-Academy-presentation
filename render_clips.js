// Render each scene's frames, encode to an MP4 clip, delete frames, repeat.
// Keeps disk usage to one scene at a time. Writes manifest.json for the pptx builder.
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FILE = process.argv[2];
const OUT = process.argv[3];
const FPS = 30000 / 1001;
const STARTS = [0, 6, 13.5, 20.5, 27, 34, 42, 50.5, 60, 72.5, 77.5, 91.5, 98.5, 109.5, 120.5, 132.5];
const END = 140.5;
const TMP = '/tmp/_rf';

(async () => {
  if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--force-color-profile=srgb', '--hide-scrollbars'],
    defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
  });
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => { window.RENDER = true; });
  await page.goto('file://' + path.resolve(__dirname, FILE), { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.FONTS_READY === true', { timeout: 20000 }).catch(() => {});
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.load) {
      await Promise.all(['400', '500', '600', '700'].map(w => document.fonts.load(`${w} 60px "DM Sans"`)));
      await document.fonts.ready;
    }
    await Promise.all([...document.images].map(im => im.complete ? im.decode().catch(() => {}) : new Promise(r => { im.onload = r; im.onerror = r; })));
  });
  await new Promise(r => setTimeout(r, 700));

  const manifest = [];
  const step = 1 / FPS;
  for (let i = 0; i < STARTS.length; i++) {
    const t0 = STARTS[i];
    const t1 = i + 1 < STARTS.length ? STARTS[i + 1] : END;
    const count = Math.round(t1 * FPS) - Math.round(t0 * FPS);
    if (fs.existsSync(TMP)) fs.rmSync(TMP, { recursive: true });
    fs.mkdirSync(TMP, { recursive: true });
    const baseFrame = Math.round(t0 * FPS);
    for (let f = 0; f < count; f++) {
      await page.evaluate((tt) => window.seek(tt), (baseFrame + f) * step);
      await page.screenshot({ path: `${TMP}/f${String(f).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 92 });
    }
    const clip = `${OUT}/scene${String(i).padStart(2, '0')}.mp4`;
    const poster = `${OUT}/poster${String(i).padStart(2, '0')}.jpg`;
    execFileSync('ffmpeg', ['-y', '-framerate', '30000/1001', '-i', `${TMP}/f%05d.jpg`,
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'veryfast',
      '-movflags', '+faststart', clip], { stdio: 'ignore' });
    fs.copyFileSync(`${TMP}/f00000.jpg`, poster);
    fs.rmSync(TMP, { recursive: true });
    manifest.push({ clip, poster, dur_ms: Math.round(count / FPS * 1000) });
    process.stdout.write(`\r  scene ${i + 1}/${STARTS.length} (${count} frames)`);
  }
  fs.writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2));
  console.log(`\n  done -> ${OUT}/manifest.json`);
  await browser.close();
})();
