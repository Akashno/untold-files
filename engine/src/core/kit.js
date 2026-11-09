// The component kit: every shape gets depth from cut() (soft drop shadow, light and shade inside the edge), maps are
// stylized, routes are crimson, dates ride on gold ribbons, plain scenes sit on a cork case board.
import { ctx, W, H, TAU, lerp, clamp, rnd, rr, circle, ell, line } from './lib.js';

export const P = {
  parch: '#E9DCBC', parchDark: '#D6C39B', ink: '#3E2C1E', sepia: '#8A6A48', crimson: '#A8322D', gold: '#C8952F',
  sea: '#9DB4B0', seaDark: '#86A09B', land: '#DCC9A0', forest: '#7E8B5A', skin: '#E3B98F', edge: '#F7EFDC',
  royal: '#3D5A80', green: '#4F6D4A', wine: '#7A2E3A', stone: '#B9A98C', stoneDark: '#9C8C70', sky: '#E7D7AE',
};
const SERIF = 'Caladea';

// ═════════════════════════ CUT PAPER ═════════════════════════
/**
 * Draw a shape with depth (flat-vector style): a soft drop shadow, then the fill, then light on the upper-left edge
 * and shade on the lower-right edge inside the shape. path() builds the path. edge 0 = flat (backgrounds).
 */
export function cut(path, fill, { shadow = 1, edge = 6 } = {}) {
  ctx.save();
  if (shadow) { ctx.shadowColor = 'rgba(30,22,40,0.26)'; ctx.shadowBlur = 20 * shadow; ctx.shadowOffsetX = 3 * shadow; ctx.shadowOffsetY = 10 * shadow; }
  path(); ctx.fillStyle = fill; ctx.fill();
  ctx.restore();
  if (edge) { inner(path, 'rgba(20,10,30,0.30)', -9, 20); inner(path, 'rgba(255,255,255,0.32)', 5, 8); }
}
/** inner shadow / light: the area outside the shape casts a blurred shadow inward, offset by (o, o) device pixels */
function inner(path, color, o, blur) {
  ctx.save(); path(); ctx.clip();
  ctx.shadowColor = color; ctx.shadowBlur = blur; ctx.shadowOffsetX = o; ctx.shadowOffsetY = o;
  path(); ctx.rect(-20000, -20000, 40000, 40000); ctx.fillStyle = '#000'; ctx.fill('evenodd');
  ctx.restore();
}
export const P_rr = (x, y, w, h, r) => () => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };
export const P_circ = (x, y, r) => () => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); };
export const P_poly = (pts) => () => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); };

/** aged parchment page: base, blotches, fibres, darker edges */
export function parchment(seed = 0) {
  // the "file room": a warm wall lit by a lamp, a wooden desk along the bottom (used behind maps, dates, counts)
  ctx.fillStyle = lin(0, -300, 0, 1520, [[0, '#CDB894'], [1, '#E9DABD']]); ctx.fillRect(-300, -300, W + 600, 1820);
  for (let x = -300; x < W + 300; x += 90) { ctx.fillStyle = 'rgba(120,90,50,0.05)'; ctx.fillRect(x, -300, 40, 1820); }
  const g = ctx.createRadialGradient(540, 760, 60, 540, 760, 900); g.addColorStop(0, 'rgba(255,244,214,0.75)'); g.addColorStop(1, 'rgba(255,244,214,0)'); ctx.fillStyle = g; ctx.fillRect(-300, -300, W + 600, 1820);
  // the case board: cork in a wooden frame, where maps, numbers and dates get pinned
  cut(() => { ctx.beginPath(); ctx.roundRect(70, 250, 940, 1170, 14); }, lin(0, 250, 0, 1420, [[0, '#8A5A34'], [1, '#6E4627']]), { shadow: 1.2, edge: 6 });
  cut(() => { ctx.beginPath(); ctx.rect(100, 280, 880, 1110); }, lin(0, 280, 0, 1390, [[0, '#C99A62'], [1, '#B8864E']]), { shadow: 0, edge: 6 });
  for (let i = 0; i < 260; i++) { ctx.fillStyle = `rgba(${rnd(i) > 0.5 ? '90,55,25' : '240,210,160'},0.22)`; ctx.beginPath(); ctx.arc(104 + rnd(i * 3 + 1) * 872, 284 + rnd(i * 7 + 2) * 1102, 2 + rnd(i) * 3, 0, TAU); ctx.fill(); }
  ctx.fillStyle = lin(0, 1520, 0, H + 300, [[0, '#9A6A3E'], [1, '#6E4627']]); ctx.fillRect(-300, 1520, W + 600, 700);
  ctx.fillStyle = 'rgba(255,230,190,0.18)'; ctx.fillRect(-300, 1520, W + 600, 10);
  ctx.strokeStyle = 'rgba(60,35,15,0.25)'; ctx.lineWidth = 3; for (let i = 0; i < 6; i++) { const y = 1580 + i * 70 + rnd(i + seed) * 20; ctx.beginPath(); ctx.moveTo(-300, y); ctx.bezierCurveTo(300, y - 12, 700, y + 14, W + 300, y); ctx.stroke(); }
  const v = ctx.createRadialGradient(540, 960, 600, 540, 960, 1300); v.addColorStop(0, 'rgba(40,25,10,0)'); v.addColorStop(1, 'rgba(40,25,10,0.35)'); ctx.fillStyle = v; ctx.fillRect(-300, -300, W + 600, H + 600);
}
function lin(x0, y0, x1, y1, stops) { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }

// ═════════════════════════ MAPS ═════════════════════════
/** an invented coastline polygon around (cx, cy) */
export function landPts(cx, cy, rx, ry, seed, n = 90) { const pts = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, k = 1 + 0.18 * Math.sin(3 * a + seed) + 0.1 * Math.sin(7 * a + seed * 2) + 0.05 * Math.sin(13 * a + seed * 3); pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); } return pts; }
/** a sea-and-land map page. o = { highlight: index of land to fill crimson-edged gold (0..2), route: 0..1, labels } */
export function map(o = {}) {
  parchment(o.seed || 3);
  ctx.save(); ctx.globalAlpha = 0.85; ctx.fillStyle = P.sea; ctx.fillRect(60, 160, 960, 1300); ctx.restore();
  ctx.strokeStyle = 'rgba(62,44,30,0.18)'; ctx.lineWidth = 2; for (let x = 60; x <= 1020; x += 120) { ctx.beginPath(); ctx.moveTo(x, 160); ctx.lineTo(x, 1460); ctx.stroke(); } for (let y = 160; y <= 1460; y += 130) { ctx.beginPath(); ctx.moveTo(60, y); ctx.lineTo(1020, y); ctx.stroke(); }
  const lands = [landPts(330, 520, 260, 300, 1.3), landPts(770, 1090, 230, 260, 4.1), landPts(820, 400, 120, 110, 2.2)];
  lands.forEach((pts, i) => cut(P_poly(pts), i === o.highlight ? P.gold : P.land, { shadow: 0.8, edge: 5 }));
  if (o.highlight != null) { P_poly(lands[o.highlight])(); ctx.strokeStyle = P.crimson; ctx.lineWidth = 8; ctx.stroke(); }
  ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.strokeRect(60, 160, 960, 1300);
  compass(900, 1340, 0.55);
  const route = [[420, 640], [560, 820], [640, 960], [720, 1040]];
  if (o.route) dashedRoute(route, o.route);
  const L = o.labels || [['OLD PORT', 420, 640], ['NEW HARBOR', 720, 1040]];
  L.forEach(([t, x, y]) => { circle(x, y, 12, P.ink); label(t, x, y - 40, 34); });
  return { route };
}
/** crimson dashed route through pts; p 0..1 draws it on; returns the head point [x, y, angle] */
export function dashedRoute(pts, p = 1) {
  const seglen = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seglen.push(l); tot += l; }
  let left = tot * clamp(p); ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); let head = [...pts[0], 0];
  for (let i = 1; i < pts.length && left > 0; i++) { const k = Math.min(1, left / seglen[i - 1]); const x = lerp(pts[i - 1][0], pts[i][0], k), y = lerp(pts[i - 1][1], pts[i][1], k); ctx.lineTo(x, y); head = [x, y, Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0])]; left -= seglen[i - 1]; }
  ctx.setLineDash([22, 16]); ctx.strokeStyle = P.crimson; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.stroke(); ctx.setLineDash([]);
  return head;
}
export function compass(x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); circle(0, 0, 110, 'rgba(233,220,188,0.9)'); ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 110, 0, TAU); ctx.stroke(); for (let i = 0; i < 4; i++) { ctx.save(); ctx.rotate(i * Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, -100); ctx.lineTo(18, 0); ctx.lineTo(-18, 0); ctx.closePath(); ctx.fillStyle = i ? P.ink : P.crimson; ctx.fill(); ctx.restore(); } ctx.font = `700 40px ${SERIF}`; ctx.fillStyle = P.ink; ctx.textAlign = 'center'; ctx.fillText('N', 0, -120); ctx.restore(); }
/** ink map label (small caps serif) */
export function label(text, x, y, size = 36, color = P.ink) { ctx.font = `700 ${size}px ${SERIF}`; ctx.letterSpacing = '4px'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = color; ctx.fillText(text, x, y); ctx.letterSpacing = '0px'; }

// ═════════════════════════ PLACES ═════════════════════════
export function ship(x, y, s = 1, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  cut(P_poly([[-260, -60], [260, -60], [200, 50], [-200, 50]]), P.sepia);
  cut(P_rr(-10, -480, 20, 430, 6), P.ink, { shadow: 0.5, edge: 3 });
  cut(P_poly([[-200, -420], [180, -420], [150, -110], [-170, -110]]), P.edge);
  cut(P_poly([[10, -500], [110, -470], [10, -440]]), P.crimson, { shadow: 0.3, edge: 3 });
  ctx.restore();
}

// ═════════════════════════ GRAPHICS ═════════════════════════
/** gold date ribbon. sc = pop scale */
export function ribbon(text, x, y, sc = 1, size = 110) {
  if (sc <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.font = `700 ${size}px ${SERIF}`;
  const w = ctx.measureText(text).width + size * 1.2, h = size * 1.35;
  for (const s of [-1, 1]) cut(P_poly([[s * w / 2, -h / 2 + 30], [s * (w / 2 + 110), -h / 2 + 30], [s * (w / 2 + 70), 30], [s * (w / 2 + 110), h / 2 + 30], [s * w / 2, h / 2 + 30]]), '#A87A22', { shadow: 0.6, edge: 4 });
  cut(P_rr(-w / 2, -h / 2, w, h, 6), P.gold); ctx.fillStyle = P.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, 6);
  ctx.restore();
}
/** red wax seal with an initial */
export function seal(x, y, s = 1, letter = 'R') { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); cut(() => { ctx.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU, r = 90 + Math.sin(a * 9) * 7; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); }, P.crimson, { shadow: 0.7, edge: 0 }); ctx.beginPath(); ctx.arc(0, 0, 62, 0, TAU); ctx.strokeStyle = '#7E2420'; ctx.lineWidth = 6; ctx.stroke(); ctx.font = `700 80px ${SERIF}`; ctx.fillStyle = '#7E2420'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(letter, 0, 6); ctx.restore(); }
/** horizontal timeline with years; p 0..1 moves the marker; active = index of the highlighted year */
export function timeline(years, x, y, w, p = 0, active = -1) {
  line([[x, y], [x + w, y]], P.ink, 8);
  years.forEach((yr, i) => { const tx = x + w * i / (years.length - 1); circle(tx, y, i === active ? 22 : 14, i === active ? P.crimson : P.ink); label(String(yr), tx, y + 60, 40, i === active ? P.crimson : P.ink); });
  const mx = x + w * clamp(p); cut(P_poly([[mx, y - 26], [mx - 26, y - 70], [mx + 26, y - 70]]), P.crimson, { shadow: 0.5, edge: 4 });
}
/** a pinned paper slip with a few words (for names, places, numbers) */
export function slip(text, x, y, sc = 1, rot = -0.03, size = 54) { if (sc <= 0) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc); ctx.font = `700 ${size}px ${SERIF}`; const w = ctx.measureText(text).width + 70; cut(P_rr(-w / 2, -size * 0.8, w, size * 1.6, 4), P.edge); ctx.fillStyle = P.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, 4); circle(0, -size * 0.8 + 6, 10, P.crimson); ctx.restore(); }

// ═════════════════════════ CAPTION LOOK ═════════════════════════
export const CAPLOOK = { font: `700 88px ${SERIF}`, y: 1640, maxW: 940, fg: P.ink, hi: P.crimson };
/** caption on a torn paper strip */
export function captionStrip(words, x, y, sc = 1, look = CAPLOOK) {
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.font = look.font; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  const sp = 24, ws = words.map((w) => ctx.measureText(w.txt).width), tw = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1), hw = tw / 2 + 50;
  const fit = Math.min(1, (look.maxW || 960) / (tw + 100)); ctx.scale(fit, fit);
  cut(() => { ctx.beginPath(); ctx.moveTo(-hw, -70); for (let x = -hw; x <= hw; x += 24) ctx.lineTo(x, -70 + (rnd(x) - 0.5) * 12); for (let x = hw; x >= -hw; x -= 24) ctx.lineTo(x, 70 + (rnd(x + 7) - 0.5) * 12); ctx.closePath(); }, '#F3E9D2', { shadow: 0.8, edge: 0 });
  let cx = -tw / 2; words.forEach((w, i) => { ctx.fillStyle = w.hi ? look.hi : look.fg; ctx.fillText(w.txt, cx, 6); cx += ws[i] + sp; });
  ctx.restore();
}
