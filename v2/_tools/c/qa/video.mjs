// Header video checks (needs a temporary assets/video/<slug>.mp4 and a build run): plays muted + looping, pause button, never with reduced motion / saveData / slow connection.
import { launch, newPage, sleep, BASE, OUT } from './lib.mjs';
const b = await launch();
const res = []; const ok = (n, c, x = '') => res.push([c ? 'PASS' : 'FAIL', n, c ? '' : x]);
async function open(url, W, o = {}) {
  const p = await newPage(b, W, W < 768 ? 844 : 900, { rm: o.rm });
  if (o.conn) await p.evaluateOnNewDocument((c) => { Object.defineProperty(navigator, 'connection', { value: c, configurable: true }); }, o.conn);
  const reqs = []; p.on('request', (r) => { if (/\.(mp4|webm)(\?|$)/.test(r.url())) reqs.push(r.url()); });
  await p.goto(`${BASE}/${url}`, { waitUntil: 'load' }); await sleep(o.wait ?? 2500);
  p.__reqs = reqs; return p;
}
const state = (p) => p.evaluate(() => { const v = document.querySelector('.shero__video'), t = document.querySelector('.shero__toggle'); return { video: !!v, playing: document.querySelector('.shero').classList.contains('is-playing'), paused: v ? v.paused : null, muted: v ? v.muted : null, loop: v ? v.loop : null, tHidden: t.hidden, aria: t.getAttribute('aria-pressed'), label: t.querySelector('.shero__lbl').textContent, fg: getComputedStyle(document.querySelector('.shero__h1')).color }; });

for (const W of [1440, 390]) {
  const p = await open('tretmani/telo.html', W);
  const s = await state(p);
  ok(`telo @${W}: video created, playing, muted, looping, poster class kept`, s.video && s.playing && s.paused === false && s.muted && s.loop, JSON.stringify(s));
  ok(`telo @${W}: pause button visible while playing`, !s.tHidden && s.aria === 'false', JSON.stringify(s));
  await p.screenshot({ path: `${OUT}video-telo-${W}.png` });
  await p.click('.shero__toggle'); await sleep(300);
  const s2 = await state(p);
  ok(`telo @${W}: pause button pauses (aria-pressed, label)`, s2.paused === true && s2.aria === 'true' && s2.label === 'Pokreni video', JSON.stringify(s2));
  await p.click('.shero__toggle'); await sleep(500);
  ok(`telo @${W}: and resumes`, (await state(p)).paused === false);
  ok(`telo @${W}: no console errors`, !p.__log.errors.length && !p.__log.notfound.length, JSON.stringify(p.__log));
  await p.close();
}
{ const p = await open('tretmani/telo.html', 1440, { rm: true, wait: 1500 }); const s = await state(p); ok('reduced motion: no video element, no download, poster only', !s.video && !s.playing && p.__reqs.length === 0 && s.tHidden, JSON.stringify([s, p.__reqs])); await p.close(); }
{ const p = await open('tretmani/telo.html', 1440, { conn: { saveData: true, effectiveType: '4g' }, wait: 1500 }); const s = await state(p); ok('data saver: no video, no download', !s.video && p.__reqs.length === 0, JSON.stringify([s, p.__reqs])); await p.close(); }
{ const p = await open('tretmani/telo.html', 1440, { conn: { saveData: false, effectiveType: '3g' }, wait: 1500 }); const s = await state(p); ok('3g: no video, no download', !s.video && p.__reqs.length === 0, JSON.stringify([s, p.__reqs])); await p.close(); }
{ const p = await open('tretmani/telo.html', 1440, { conn: { saveData: false, effectiveType: '4g' } }); const s = await state(p); ok('4g: video plays', s.playing, JSON.stringify(s)); await p.close(); }
{ // light photo hero: ink text stays on phones (stacked layout), white text over the video on desktop
  for (const W of [390, 1440]) {
    const p = await open('tretmani/estetske-procedure.html', W); const s = await state(p);
    await p.screenshot({ path: `${OUT}video-estetske-${W}.png` });
    ok(`estetske @${W}: playing; text colour ${s.fg}`, s.playing && (W < 1024 ? s.fg === 'rgb(90, 87, 88)' : s.fg === 'rgb(255, 255, 255)'), JSON.stringify(s)); await p.close();
  }
}
{ const p = await open('tretmani/dermatologija.html', 1440, { wait: 800 }); const s = await state(p); ok('segment without video file: nothing loads, poster only', !s.video && p.__reqs.length === 0 && s.tHidden, JSON.stringify(s)); await p.close(); }
await b.close();
console.log(res.map((r) => r.join(' ')).join('\n')); const f = res.filter((r) => r[0] === 'FAIL').length; console.log(`\n${res.length - f}/${res.length} passed`); process.exit(f ? 1 : 0);
