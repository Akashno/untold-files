// Untold Files: turns story.json into shots. Claude writes one `scene` per narration line (or none, to hold the
// previous shot); everything here is fixed code in a flat-vector look with depth (src/vec.js, src/places.js).
//
// Scene types (all optional fields have defaults):
//   date      { text, sub?, setting?, night? }                       gold date ribbon, optional slip under it
//   map       { title?, land?: 'continent'|'islands', places: [{ name, x, y }], route?, mover?: 'ship'|'plane'|'army', focus? }
//   people    { setting?, night?, figures: [{ role, label? }], action?: 'stand'|'walk'|'point'|'wave', text?, on? }
//   object    { object, setting?, night?, text?, on?, color? }
//   count     { setting?, night?, items: [{ text, on? }] }            slips that pop in on their words
//   timeline  { years: [..], active?, title? }
//   end       { }                                                     added automatically after the last line
//
// Around the scenes: a case-file header with the title over the first line (the frame people decide on), and an end
// card that asks for the follow. script.file is the running file number (set by scripts/make.ts).
import { ctx, W, H, TAU, clamp, lerp, seg, eo, eio, eob, rnd, rr, circle, line } from './core/lib.js';
import { L, Le, Wd, T } from './core/timing.js';
import * as K from './core/kit.js';
import { PROPS } from './props.js';
import { PLACES, nightOver } from './places.js';
import * as V from './vec.js';
const { P, cut, P_rr, P_poly, P_circ } = K;

export const BRAND = { name: 'UNTOLD FILES', handle: '@untoldfiles', seal: 'U', sub: 'A new story every day' };

// ═════════════════════════ SETTINGS (backgrounds: src/places.js) ═════════════════════════
const GROUND = 1450;
function setting(name, night, t) {
  (PLACES[name] || PLACES.parchment)(t, !!night);
  if (night) nightOver(t);
}

// ═════════════════════════ OBJECTS ═════════════════════════
function plane(x, y, s, rot = 0, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  cut(P_poly([[-60, -10], [40, -170], [90, -170], [50, -10]]), P.stoneDark); cut(P_poly([[-60, 10], [40, 170], [90, 170], [50, 10]]), P.stoneDark);
  cut(P_rr(-230, -38, 420, 76, 38), P.stone); cut(P_poly([[-230, -10], [-280, -90], [-240, -90], [-190, -10]]), P.stoneDark);
  cut(P_rr(110, -26, 50, 30, 10), '#9DB4B0', { shadow: 0, edge: 3 });
  ctx.save(); ctx.translate(200, 0); ctx.scale(1, Math.abs(Math.sin(t * 40)) * 0.9 + 0.1); cut(P_rr(-8, -90, 16, 180, 8), P.ink, { shadow: 0, edge: 2 }); ctx.restore();
  ctx.restore();
}
function letter(x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); cut(P_rr(-260, -170, 520, 340, 8), P.edge); line([[-260, -170], [0, 30], [260, -170]], P.sepia, 6); K.seal(0, 30, 0.7, BRAND.seal); ctx.restore(); }
function radio(x, y, s, t) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); cut(P_rr(-240, -180, 480, 300, 40), '#7A4B33'); cut(P_circ(-110, -30, 90), P.sepia); for (let i = 0; i < 5; i++) line([[-170, -80 + i * 25], [-50, -80 + i * 25]], P.ink, 5); cut(P_rr(20, -110, 180, 60, 10), P.edge); circle(60 + Math.sin(t * 2) * 50, -80, 8, P.crimson); cut(P_circ(70, 40, 34), P.ink); cut(P_circ(170, 40, 34), P.ink); line([[150, -180], [220, -320]], P.ink, 8); ctx.restore(); }
function newspaper(x, y, s, text) { ctx.save(); ctx.translate(x, y); ctx.rotate(-0.04); ctx.scale(s, s); cut(P_rr(-300, -380, 600, 760, 6), '#F3E9D2'); ctx.fillStyle = P.ink; ctx.font = '700 46px Caladea'; ctx.textAlign = 'center'; ctx.fillText('THE DAILY NEWS', 0, -310); line([[-260, -280], [260, -280]], P.ink, 4); wrap(text || 'EXTRA!', 0, -200, 520, 74, P.ink); for (let i = 0; i < 9; i++) line([[-260, 40 + i * 34], [i % 3 === 2 ? 60 : 260, 40 + i * 34]], 'rgba(62,44,30,0.45)', 10); ctx.restore(); }
function clock(x, y, s, t) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); cut(P_circ(0, 0, 230), P.edge); ctx.strokeStyle = P.ink; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(0, 0, 230, 0, TAU); ctx.stroke(); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; line([[Math.cos(a) * 190, Math.sin(a) * 190], [Math.cos(a) * 215, Math.sin(a) * 215]], P.ink, 8); } const m = t * 2, hh = t * 0.2; line([[0, 0], [Math.sin(hh) * 110, -Math.cos(hh) * 110]], P.ink, 14); line([[0, 0], [Math.sin(m) * 170, -Math.cos(m) * 170]], P.crimson, 8); circle(0, 0, 16, P.ink); ctx.restore(); }
function crown(x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s * 3, s * 3); cut(P_poly([[-60, 40], [-70, -40], [-35, 0], [0, -60], [35, 0], [70, -40], [60, 40]]), P.gold, { shadow: 0.5, edge: 2 }); [-35, 0, 35].forEach((dx) => circle(dx, 22, 7, P.crimson)); ctx.restore(); }
function diamond(x, y, s, t) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); cut(P_poly([[-170, -60], [-90, -150], [90, -150], [170, -60], [0, 170]]), '#CFE3E6'); line([[-170, -60], [170, -60]], '#86A09B', 6); line([[-90, -150], [-50, -60], [0, 170], [50, -60], [90, -150]], '#86A09B', 5); const sp = Math.max(0, Math.sin(t * 3)); ctx.save(); ctx.globalAlpha = sp; ctx.translate(110, -130); ctx.rotate(t); cut(P_poly([[0, -50], [12, -12], [50, 0], [12, 12], [0, 50], [-12, 12], [-50, 0], [-12, -12]]), '#FFF', { shadow: 0, edge: 0 }); ctx.restore(); ctx.restore(); }
function coins(x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); for (let i = 0; i < 7; i++) cut(() => { ctx.beginPath(); ctx.ellipse(((i % 2) - 0.5) * 12, -i * 34, 150, 44, 0, 0, TAU); }, i % 2 ? '#B8862A' : P.gold, { shadow: 0.4, edge: 3 }); ctx.restore(); }
function train(x, y, s, t) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); cut(P_rr(-320, -200, 420, 200, 10), P.ink); cut(P_rr(100, -300, 180, 300, 10), P.wine); cut(P_rr(130, -270, 120, 90, 6), '#F2C14E', { shadow: 0, edge: 3 }); cut(P_rr(-260, -300, 60, 100, 4), P.ink); for (const wx of [-240, -80, 180]) { cut(P_circ(wx, 0, 62), P.ink); line([[wx, 0], [wx + Math.cos(t * 6) * 50, Math.sin(t * 6) * 50]], P.stone, 8); } for (let i = 0; i < 3; i++) { const k = (t * 0.8 + i / 3) % 1; ctx.save(); ctx.globalAlpha = 1 - k; cut(P_circ(-230 - k * 120, -330 - k * 260, 40 + k * 60), '#B9B2A6', { shadow: 0, edge: 3 }); ctx.restore(); } ctx.restore(); }
function flag(x, y, s, t, color = P.crimson) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); cut(P_rr(-12, -620, 24, 640, 8), P.ink, { shadow: 0.5, edge: 3 }); cut(() => { ctx.beginPath(); ctx.moveTo(12, -600); for (let k = 0; k <= 10; k++) ctx.lineTo(12 + k * 36, -600 + Math.sin(t * 4 + k * 0.7) * 16); for (let k = 10; k >= 0; k--) ctx.lineTo(12 + k * 36, -360 + Math.sin(t * 4 + k * 0.7) * 16); ctx.closePath(); }, color, { shadow: 0.6, edge: 4 }); ctx.restore(); }
function scroll(x, y, s, text) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); cut(P_rr(-260, -330, 520, 660, 8), '#F3E9D2'); cut(P_rr(-300, -370, 600, 70, 35), P.sepia); cut(P_rr(-300, 300, 600, 70, 35), P.sepia); wrap(text || '', 0, -180, 440, 64, P.ink); K.seal(160, 200, 0.6, BRAND.seal); ctx.restore(); }
function key(x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineWidth = 46; ctx.strokeStyle = P.gold; ctx.beginPath(); ctx.arc(-170, 0, 90, 0, TAU); ctx.stroke(); cut(P_rr(-90, -22, 340, 44, 10), P.gold); cut(P_rr(170, 0, 30, 90, 6), P.gold); cut(P_rr(220, 0, 30, 60, 6), P.gold); ctx.restore(); }
function bag(x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); cut(() => { ctx.beginPath(); ctx.moveTo(-90, -200); ctx.quadraticCurveTo(-260, 40, -180, 200); ctx.lineTo(180, 200); ctx.quadraticCurveTo(260, 40, 90, -200); ctx.closePath(); }, '#B68A5C'); cut(P_rr(-100, -230, 200, 50, 20), P.sepia); ctx.font = '700 160px Caladea'; ctx.fillStyle = P.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', 0, 40); ctx.restore(); }
function bulb(x, y, s, t) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); const g = 0.5 + 0.5 * Math.sin(t * 4); ctx.save(); ctx.globalAlpha = 0.25 + 0.2 * g; circle(0, -80, 260, '#F2C14E'); ctx.restore(); cut(P_circ(0, -80, 170), '#F6E2A0'); cut(P_rr(-80, 60, 160, 130, 20), P.stoneDark); for (let i = 0; i < 3; i++) line([[-80, 95 + i * 35], [80, 95 + i * 35]], P.ink, 6); ctx.restore(); }

function wrap(text, x, y, maxW, size, color) {
  ctx.font = `700 ${size}px Caladea`; ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const words = String(text).split(/\s+/); let lineTxt = '', yy = y;
  for (const w of words) { const test = lineTxt ? lineTxt + ' ' + w : w; if (ctx.measureText(test).width > maxW && lineTxt) { ctx.fillText(lineTxt, x, yy); lineTxt = w; yy += size * 1.15; } else lineTxt = test; }
  if (lineTxt) ctx.fillText(lineTxt, x, yy);
}

const OBJECTS = {
  plane: (s, t, sc) => plane(540 + Math.sin(t) * 30, 860 + Math.sin(t * 1.7) * 20, 1.5 * sc, -0.06, t),
  ship: (s, t, sc) => K.ship(540, 1150 + Math.sin(t * 2) * 10, 1.3 * sc, Math.sin(t * 1.6) * 0.04),
  letter: (s, t, sc) => letter(540, 900, 1.3 * sc),
  telegram: (s, t, sc) => scroll(540, 900, 1.05 * sc, s.text ? '' : 'STOP'),
  radio: (s, t, sc) => radio(540, 950, 1.3 * sc, t),
  newspaper: (s, t, sc) => newspaper(540, 900, 1.05 * sc, s.headline || s.text),
  clock: (s, t, sc) => clock(540, 900, 1.3 * sc, t),
  crown: (s, t, sc) => crown(540, 900, 1.2 * sc),
  diamond: (s, t, sc) => diamond(540, 900, 1.6 * sc, t),
  coins: (s, t, sc) => coins(540, 1150, 1.3 * sc),
  moneybag: (s, t, sc) => bag(540, 950, 1.4 * sc),
  train: (s, t, sc) => train(560, 1350, 1.1 * sc, t),
  flag: (s, t, sc) => flag(420, 1350, 1.2 * sc, t, s.color || P.crimson),
  scroll: (s, t, sc) => scroll(540, 900, 1.05 * sc, s.headline || ''),
  key: (s, t, sc) => key(540, 900, 1.3 * sc),
  lightbulb: (s, t, sc) => bulb(540, 900, 1.3 * sc, t),
  ...PROPS,
};
export const OBJECT_NAMES = Object.keys(OBJECTS);

// ═════════════════════════ MAP ═════════════════════════
const MX = 110, MY = 330, MW = 860, MH = 1050;
const toMap = (p) => [MX + 40 + clamp(p.x) * (MW - 80), MY + 60 + clamp(p.y) * (MH - 120)];
function mapPage(sc, lt, d, t) {
  K.parchment(4);
  ctx.save(); ctx.globalAlpha = 0.85; ctx.fillStyle = P.sea; ctx.fillRect(MX, MY, MW, MH); ctx.restore();
  ctx.strokeStyle = 'rgba(62,44,30,0.18)'; ctx.lineWidth = 2;
  for (let x = MX; x <= MX + MW; x += 108) { ctx.beginPath(); ctx.moveTo(x, MY); ctx.lineTo(x, MY + MH); ctx.stroke(); }
  for (let y = MY; y <= MY + MH; y += 131) { ctx.beginPath(); ctx.moveTo(MX, y); ctx.lineTo(MX + MW, y); ctx.stroke(); }
  const pts = (sc.places || []).map(toMap);
  ctx.save(); ctx.beginPath(); ctx.rect(MX, MY, MW, MH); ctx.clip();
  if ((sc.land || 'continent') === 'continent') {
    const cx = pts.length ? pts.reduce((a, p) => a + p[0], 0) / pts.length : 540, cy = pts.length ? pts.reduce((a, p) => a + p[1], 0) / pts.length : 850;
    cut(P_poly(K.landPts(cx, cy, 420, 520, 2.7)), P.land, { shadow: 0.8, edge: 5 });
    cut(P_poly(K.landPts(MX + MW - 60, MY + 80, 160, 130, 5.1)), P.land, { shadow: 0.8, edge: 5 });
  } else pts.forEach(([x, y], i) => cut(P_poly(K.landPts(x, y, 120 + rnd(i) * 70, 100 + rnd(i + 2) * 70, i * 1.9 + 1)), P.land, { shadow: 0.8, edge: 5 }));
  ctx.restore();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.strokeRect(MX, MY, MW, MH);
  K.compass(MX + MW - 90, MY + MH - 100, 0.5);
  // route + mover
  let head = null;
  if (sc.route !== false && pts.length > 1) {
    const p = eio(seg(lt, 0.35, Math.max(0.9, d * 0.85)));
    head = K.dashedRoute(pts, p);
    const m = sc.mover || 'arrow';
    if (p > 0) {
      ctx.save(); ctx.translate(head[0], head[1]);
      if (m === 'plane') { ctx.rotate(head[2]); plane(0, 0, 0.22, 0, t); }
      else if (m === 'ship') { K.ship(0, 20, 0.18, 0); }
      else if (m === 'army') { for (let k = 0; k < 3; k++) cut(P_rr(-30 + k * 22 - 22, -30 - k * 6, 44, 60, 8), P.forest, { shadow: 0.4, edge: 3 }); }
      else cut(P_poly([[0, -26], [30, 26], [-30, 26]].map(([x, y]) => [x * Math.cos(head[2] + Math.PI / 2) - y * Math.sin(head[2] + Math.PI / 2), x * Math.sin(head[2] + Math.PI / 2) + y * Math.cos(head[2] + Math.PI / 2)])), P.crimson, { shadow: 0.4, edge: 3 });
      ctx.restore();
    }
  }
  // places: dots + labels on slips, the focus pulses crimson
  (sc.places || []).forEach((pl, i) => {
    const [x, y] = pts[i], show = eob(seg(lt, 0.1 + i * 0.15, 0.4 + i * 0.15)); if (show <= 0) return;
    const focus = sc.focus && pl.name.toLowerCase() === String(sc.focus).toLowerCase();
    if (focus) { const r = 40 + 14 * Math.sin(t * 5); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.strokeStyle = P.crimson; ctx.lineWidth = 8; ctx.stroke(); }
    circle(x, y, 13 * show, focus ? P.crimson : P.ink);
    const ly = y < MY + 140 ? y + 70 : y - 62;
    K.slip(pl.name.toUpperCase(), clamp(x, 260, 820), ly, show, i % 2 ? 0.03 : -0.03, 34);
  });
  if (sc.title) K.ribbon(sc.title.toUpperCase(), 540, 200, eob(seg(lt, 0.05, 0.4)), 64);
}

// ═════════════════════════ SHOTS ═════════════════════════
export function buildShots(script) {
  const S = [], CUES = [], cue = (t, type, o = {}) => CUES.push({ t: +Math.max(0, t).toFixed(3), type, ...o });
  // the time a word is said in line i (falls back to shortly after the line starts)
  const at = (word, i, fallback = 0.3) => { if (!word) return L(i) + fallback; try { return Wd(String(word).split(/\s+/)[0], i); } catch { return L(i) + fallback; } };
  const lines = script.lines;
  lines.forEach((ln, i) => {
    const sc = ln.scene; if (!sc) return;
    const st = i === 0 ? 0 : L(i) - 0.08;
    const pop = (word, a = 0.3) => at(word, i, a) - st;
    const top = i === 0 ? 600 : 300; // the intro header covers the top of the first scene
    const base = { id: `S${String(S.length + 1).padStart(2, '0')}`, at: st, note: `${sc.type}: ${ln.text.slice(0, 50)}` };
    cue(st, 'whoosh', { gain: 0.6 });
    if (sc.type === 'date') {
      const o = pop(sc.on, 0.15), sub = sc.sub ? pop(sc.subOn, 0.6) : 0;
      S.push({ ...base, cam: [540, 800], zoom: 0.07, draw(lt, d, t) { setting(sc.setting || 'parchment', sc.night, t); K.ribbon(String(sc.text), 540, 620, eob(seg(lt, o, o + 0.4)), 120); if (sc.sub) K.slip(sc.sub.toUpperCase(), 540, 860, eob(seg(lt, sub, sub + 0.3)), 0.03, 52); } });
      cue(st + o, 'thud', { gain: 0.7 }); if (sc.sub) cue(st + sub, 'pop', { gain: 0.5 });
    } else if (sc.type === 'map') {
      S.push({ ...base, cam: [540, 860], zoom: 0.05, draw(lt, d, t) { mapPage(i === 0 ? { ...sc, title: undefined } : sc, lt, d, t); } });
      (sc.places || []).forEach((_, k) => cue(st + 0.1 + k * 0.15, 'pop', { gain: 0.35 }));
      if (sc.route !== false && (sc.places || []).length > 1) cue(st + 0.35, 'slide', { dur: 1.4, gain: 0.5 });
    } else if (sc.type === 'people') {
      const figs = (sc.figures || [{ role: 'civilian' }]).slice(0, 3), n = figs.length, txt = sc.text ? pop(sc.on, 0.5) : 0;
      S.push({ ...base, cam: [540, 1000], zoom: 0.09, draw(lt, d, t) {
        setting(sc.setting || 'day', sc.night, t);
        figs.forEach((f, k) => {
          const x0 = n === 1 ? 540 : n === 2 ? 340 + k * 400 : 230 + k * 310, walk = sc.action === 'walk';
          const x = walk ? x0 + lerp(-120, 120, lt / d) : x0, h = n === 1 ? 680 : n === 2 ? 600 : 520;
          const arm = k === 0 && sc.action === 'point' ? 'point' : k === 0 && sc.action === 'wave' ? 'wave' : 'down';
          const blink = clamp(1 - Math.abs(((t + k * 1.3) % 3.4) - 1.7) / 0.09);
          const y = GROUND + 20 - (eob(seg(lt, 0.05 + k * 0.12, 0.4 + k * 0.12)) < 1 ? (1 - eob(seg(lt, 0.05 + k * 0.12, 0.4 + k * 0.12))) * -300 : 0);
          V.person({ x, y, h, role: f.role, skin: f.skin, dir: n > 1 && k === n - 1 ? -1 : 1, walk: walk ? t * 6 + k : null, arm, blink, t });
          if (f.label) K.slip(f.label.toUpperCase(), x, GROUND - h * (f.role === 'child' ? 0.9 : 1.3) - 40, eob(seg(lt, 0.3 + k * 0.15, 0.6 + k * 0.15)), k % 2 ? 0.03 : -0.03, 38);
        });
        if (sc.text) K.slip(sc.text.toUpperCase(), 540, top, eob(seg(lt, txt, txt + 0.3)), -0.02, 54);
      } });
      if (sc.text) cue(st + txt, 'pop', { gain: 0.5 });
    } else if (sc.type === 'object') {
      const draw = OBJECTS[sc.object] || OBJECTS.scroll, txt = sc.text ? pop(sc.on, 0.5) : 0;
      S.push({ ...base, cam: [540, 950], zoom: 0.12, draw(lt, d, t) {
        setting(sc.setting || 'parchment', sc.night, t);
        const p = eob(seg(lt, 0.05, 0.45)); ctx.save(); ctx.translate(0, (1 - p) * 300); ctx.globalAlpha = clamp(p * 2); draw(sc, t, 1); ctx.restore();
        if (sc.text) K.slip(sc.text.toUpperCase(), 540, top, eob(seg(lt, txt, txt + 0.3)), 0.02, 56);
      } });
      cue(st + 0.1, 'pop', { gain: 0.5 }); if (sc.text) cue(st + txt, 'pop', { gain: 0.5 });
    } else if (sc.type === 'count') {
      const items = (sc.items || []).slice(0, 3).map((it) => ({ ...it, a: pop(it.on, 0.3) }));
      S.push({ ...base, cam: [540, 800], zoom: 0.07, draw(lt, d, t) {
        setting(sc.setting || 'parchment', sc.night, t);
        const y0 = 900 - (items.length - 1) * 150;
        items.forEach((it, k) => K.slip(it.text.toUpperCase(), 540, y0 + k * 300, lt > it.a ? eob(seg(lt, it.a, it.a + 0.3)) : 0, k % 2 ? 0.03 : -0.03, k === 0 ? 110 : 84));
      } });
      items.forEach((it) => cue(st + it.a, 'pop', { gain: 0.7 }));
    } else if (sc.type === 'timeline') {
      const ys = (sc.years || []).map(String), act = sc.active ?? ys.length - 1;
      S.push({ ...base, cam: [540, 800], zoom: 0.06, draw(lt, d, t) {
        setting('parchment', false, t);
        if (sc.title) K.ribbon(sc.title.toUpperCase(), 540, 520, eob(seg(lt, 0.05, 0.4)), 80);
        const p = eio(seg(lt, 0.3, Math.max(0.8, d * 0.75))) * (ys.length > 1 ? act / (ys.length - 1) : 1);
        ctx.save(); ctx.translate(540, 950); ctx.scale(1.15, 1.15); ctx.translate(-540, -950);
        K.timeline(ys, 240, 950, 600, p, lt > d * 0.75 ? act : -1); ctx.restore();
        if (ys[act]) K.ribbon(ys[act], 540, 1250, lt > d * 0.75 ? eob(seg(lt, d * 0.75, d * 0.75 + 0.35)) : 0, 100);
      } });
      cue(st + 0.3, 'slide', { dur: 1.2, gain: 0.5 });
    }
  });
  // case-file header over the first line: the title is readable from the very first frame
  const file = Number(script.file) || 0, title = String(script.title || '');
  const liftAt = Math.min(lines.length > 1 ? L(1) : 3, 3.2); // long enough to read, short enough to see the scene
  // the hook card: two big lines (dark, then red) on torn paper, readable from the very first frame
  const words = title.toUpperCase().split(/\s+/), half = Math.ceil(words.length / 2);
  const hl = script.headline || { top: words.slice(0, half).join(' '), bottom: words.slice(half).join(' ') };
  const overlay = (t) => {
    const lift = eio(seg(t, liftAt - 0.25, liftAt + 0.2)); if (lift >= 1) return;
    ctx.save(); ctx.translate(0, -lift * 640);
    V.headline(String(hl.top).toUpperCase(), String(hl.bottom).toUpperCase(), 330, 0.88 + 0.12 * eob(seg(t, 0, 0.3)));
    if (file) K.slip(`FILE NO. ${file}`, 900, 140, eob(seg(t, 0.25, 0.5)), 0.05, 40);
    ctx.restore();
  };
  cue(0.12, 'thud', { gain: 0.7 });
  // end card: plays in the padded silence after the voice. Whisper can stretch the last word into that silence,
  // so the card starts at most 2.2 s before the end, whatever the timing says.
  const endAt = Math.max(L(lines.length - 1) + 0.6, Math.min(Le(lines.length - 1) + 0.15, T.dur - 2.2));
  S.push({ id: 'END', at: endAt, cam: [540, 900], zoom: 0.04, note: 'end card', draw(lt, d, t) {
    K.parchment(12);
    const p = eob(seg(lt, 0, 0.35)); ctx.save(); ctx.translate(0, (1 - p) * 600);
    cut(P_rr(130, 436, 400, 90, 14), MANILA_DARK);
    K.label(file ? `FILE NO. ${file}` : 'CASE FILE', 330, 482, 44, P.ink);
    cut(P_rr(110, 500, 860, 820, 12), MANILA);
    K.seal(540, 690, eob(seg(lt, 0.15, 0.45)) * 1.2, BRAND.seal);
    K.ribbon(BRAND.name, 540, 910, eob(seg(lt, 0.25, 0.55)), 76);
    K.slip(BRAND.handle, 540, 1075, eob(seg(lt, 0.35, 0.65)), -0.02, 58);
    K.label(file ? `NEXT: FILE NO. ${file + 1}` : BRAND.sub.toUpperCase(), 540, 1215, 46, P.ink);
    ctx.restore();
    stamp('FOLLOW', 540, 1420, -0.06, seg(lt, 0.75, 0.92), 80);
  } });
  cue(endAt, 'whoosh', { gain: 0.6 }); cue(endAt + 0.1, 'thud', { gain: 0.6 }); cue(endAt + 0.75, 'thud', { gain: 0.8 });
  return { shots: S, cues: CUES, overlay, endAt };
}

const MANILA = '#D9B77A', MANILA_DARK = '#C29B5A';
/** a red rubber stamp that slams down as p goes 0 -> 1 */
function stamp(text, x, y, rot, p, size) {
  if (p <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); const k = 1 + (1 - eo(p)) * 1.4; ctx.scale(k, k); ctx.globalAlpha = 0.9 * clamp(p * 3);
  ctx.font = `900 ${size}px Inter`; ctx.letterSpacing = '6px'; const w = ctx.measureText(text).width + size * 0.9, h = size * 1.6;
  ctx.strokeStyle = P.crimson; ctx.lineWidth = size * 0.14; ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = P.crimson; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 3, size * 0.06);
  ctx.restore(); ctx.letterSpacing = '0px';
}
/** the largest size (from sizes) at which text fits maxLines lines of maxW, centred on (x, y) */
function fitText(text, x, y, maxW, maxLines, sizes) {
  let lines = [], size = sizes[sizes.length - 1];
  for (const sz of sizes) {
    ctx.font = `700 ${sz}px Caladea`; const out = []; let cur = '';
    for (const w of text.split(/\s+/)) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t; }
    if (cur) out.push(cur); lines = out; size = sz; if (out.length <= maxLines) break;
  }
  ctx.font = `700 ${size}px Caladea`; ctx.fillStyle = P.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  lines.forEach((l, k) => ctx.fillText(l, x, y + (k - (lines.length - 1) / 2) * size * 1.12));
}
