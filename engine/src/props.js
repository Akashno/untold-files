// More cut-paper objects for `object` scenes. Each draws centred on (x, y) at scale s; t is film time for small
// idle motion. They share the Paper Atlas palette so they sit next to the originals in shots.js.
import { ctx, TAU, circle, line } from './core/lib.js';
import * as K from './core/kit.js';
const { P, cut, P_rr, P_poly, P_circ } = K;

const MANILA = '#D9B77A', MANILA_DARK = '#C29B5A', STEEL = '#8C9488', STEEL_DARK = '#6E7569', OLIVE = '#6B7046', OLIVE_DARK = '#545937';
const at = (x, y, s, fn) => { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); fn(); ctx.restore(); };
const ell = (x, y, rx, ry) => () => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); };
const text = (t, x, y, size, color = P.ink, font = 'Caladea') => { ctx.font = `700 ${size}px ${font}`; ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, x, y); };

function tank(t) {
  cut(P_rr(-300, -40, 600, 140, 60), P.ink);
  for (let i = 0; i < 6; i++) { cut(P_circ(-230 + i * 92, 30, 40), STEEL_DARK, { shadow: 0, edge: 3 }); line([[-230 + i * 92, 30], [-230 + i * 92 + Math.cos(t * 4 + i) * 30, 30 + Math.sin(t * 4 + i) * 30]], P.ink, 6); }
  cut(P_poly([[-280, -40], [-250, -130], [260, -130], [300, -40]]), OLIVE);
  cut(P_rr(-140, -240, 260, 120, 40), OLIVE_DARK);
  cut(P_rr(100, -205, 300, 36, 12), OLIVE_DARK);
  circle(-40, -180, 14, P.ink);
}
function submarine(t) {
  ctx.rotate(Math.sin(t * 1.4) * 0.03);
  cut(ell(0, 0, 340, 100), STEEL_DARK);
  cut(P_rr(-60, -190, 160, 110, 20), STEEL);
  line([[60, -190], [60, -270], [110, -270]], P.ink, 12);
  for (let i = 0; i < 4; i++) { cut(P_circ(-200 + i * 110, 0, 24), '#CFE3E6', { shadow: 0, edge: 4 }); }
  cut(P_poly([[300, -10], [380, -80], [380, 60]]), STEEL);
  for (let i = 0; i < 4; i++) { const k = (t * 0.6 + i / 4) % 1; ctx.save(); ctx.globalAlpha = 1 - k; circle(-360 - k * 40, -k * 300, 10 + k * 14, '#E8F0EE'); ctx.restore(); }
}
function car(t) {
  cut(P_rr(-320, -90, 640, 130, 40), P.wine);
  cut(P_poly([[-180, -90], [-120, -230], [140, -230], [210, -90]]), P.wine);
  cut(P_poly([[-150, -100], [-105, -205], [0, -205], [0, -100]]), '#CFE3E6', { shadow: 0, edge: 3 });
  cut(P_poly([[20, -100], [20, -205], [125, -205], [180, -100]]), '#CFE3E6', { shadow: 0, edge: 3 });
  cut(P_circ(300, -40, 22), '#F2C14E', { shadow: 0, edge: 3 });
  for (const wx of [-190, 190]) { cut(P_circ(wx, 50, 78), P.ink); cut(P_circ(wx, 50, 34), P.stone, { shadow: 0, edge: 3 }); line([[wx, 50], [wx + Math.cos(t * 7) * 30, 50 + Math.sin(t * 7) * 30]], P.ink, 6); }
}
function rocket(t) {
  const f = 0.8 + 0.2 * Math.sin(t * 30);
  cut(P_poly([[-60, 260], [0, 260 + 220 * f], [60, 260]]), '#F2C14E', { shadow: 0, edge: 4 });
  cut(P_poly([[-34, 260], [0, 260 + 130 * f], [34, 260]]), P.crimson, { shadow: 0, edge: 0 });
  cut(P_poly([[-90, 120], [-200, 280], [-90, 260]]), P.crimson); cut(P_poly([[90, 120], [200, 280], [90, 260]]), P.crimson);
  cut(P_rr(-100, -200, 200, 470, 30), P.edge);
  cut(() => { ctx.beginPath(); ctx.moveTo(-100, -190); ctx.quadraticCurveTo(0, -460, 100, -190); ctx.closePath(); }, P.crimson);
  cut(P_circ(0, -60, 52), P.royal); cut(P_circ(0, -60, 34), '#CFE3E6', { shadow: 0, edge: 0 });
}
function balloon(t) {
  ctx.translate(0, Math.sin(t * 1.5) * 20);
  const cols = [P.crimson, P.edge, P.gold, P.edge, P.crimson];
  cols.forEach((c, i) => cut(() => { ctx.beginPath(); const x0 = -250 + i * 100; ctx.moveTo(-40 + i * 20, 150); ctx.quadraticCurveTo(x0 - 30, -150, x0 + 50 - (i - 2) * 30, -340); ctx.quadraticCurveTo(x0 + 130, -150, -20 + i * 20, 150); ctx.closePath(); }, c, { shadow: i === 0 ? 1 : 0.3, edge: 3 }));
  for (const sx of [-40, 40]) line([[sx, 150], [sx * 1.6, 300]], P.ink, 5);
  cut(P_rr(-80, 300, 160, 110, 10), '#9C6B3E');
  for (let i = 0; i < 3; i++) line([[-80, 330 + i * 30], [80, 330 + i * 30]], '#7A4B33', 5);
}
function telephone(t) {
  cut(P_poly([[-230, 200], [-170, -40], [170, -40], [230, 200]]), P.ink);
  cut(P_circ(0, 80, 110), P.edge); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + 0.3; circle(Math.cos(a) * 72, 80 + Math.sin(a) * 72, 16, P.ink); }
  circle(0, 80, 26, P.crimson);
  ctx.save(); ctx.translate(0, -100 - Math.max(0, Math.sin(t * 20)) * 8 * (Math.sin(t * 2) > 0.6 ? 1 : 0));
  cut(P_rr(-260, -50, 520, 70, 34), P.ink); cut(P_rr(-280, -40, 110, 120, 40), P.ink); cut(P_rr(170, -40, 110, 120, 40), P.ink);
  ctx.restore();
}
function camera(t) {
  cut(P_rr(-260, -150, 520, 320, 24), P.ink);
  cut(P_rr(-200, -220, 160, 80, 12), P.ink);
  cut(P_rr(-260, -60, 520, 60, 0), P.sepia, { shadow: 0, edge: 0 });
  cut(P_circ(40, 10, 130), STEEL_DARK); cut(P_circ(40, 10, 90), P.ink, { shadow: 0, edge: 4 }); cut(P_circ(40, 10, 50), P.royal, { shadow: 0, edge: 0 }); circle(20, -10, 14, '#CFE3E6');
  const flash = Math.max(0, Math.sin(t * 1.3)) ** 30;
  if (flash > 0.02) { ctx.save(); ctx.globalAlpha = flash; circle(170, -200, 160, '#FFF6D8'); ctx.restore(); }
  cut(P_rr(130, -230, 90, 50, 8), STEEL);
}
function book(t) {
  const turn = Math.sin(t * 1.2) * 0.5 + 0.5;
  cut(P_poly([[-330, -200], [0, -160], [330, -200], [330, 220], [0, 260], [-330, 220]]), P.wine);
  cut(P_poly([[-300, -190], [-10, -150], [-10, 240], [-300, 200]]), '#F3E9D2', { shadow: 0.4, edge: 3 });
  cut(P_poly([[10, -150], [300, -190], [300, 200], [10, 240]]), '#F3E9D2', { shadow: 0.4, edge: 3 });
  for (let i = 0; i < 8; i++) { line([[-260, -120 + i * 42], [-50, -95 + i * 42]], 'rgba(62,44,30,0.4)', 8); line([[50, -95 + i * 42], [260 - (i === 7 ? 120 : 0), -120 + i * 42]], 'rgba(62,44,30,0.4)', 8); }
  ctx.save(); ctx.globalAlpha = 0.9; cut(P_poly([[10, -150], [10 + 290 * (1 - turn * 2), -190 - turn * 40], [10 + 290 * (1 - turn * 2), 200 - turn * 40], [10, 240]]), P.edge, { shadow: 0.3, edge: 2 }); ctx.restore();
}
function medal(t) {
  cut(P_poly([[-120, -330], [-20, -330], [40, -60], [-40, -60]]), P.royal); cut(P_poly([[120, -330], [20, -330], [-40, -60], [40, -60]]), P.crimson);
  ctx.save(); ctx.translate(0, 100); ctx.rotate(Math.sin(t * 2) * 0.08);
  cut(P_circ(0, 0, 170), P.gold); cut(P_circ(0, 0, 130), '#B8862A', { shadow: 0, edge: 3 });
  cut(P_poly(Array.from({ length: 10 }, (_, i) => { const a = i / 10 * TAU - Math.PI / 2, r = i % 2 ? 40 : 100; return [Math.cos(a) * r, Math.sin(a) * r]; })), P.gold, { shadow: 0.3, edge: 2 });
  ctx.restore();
}
function ring(t) {
  ctx.lineWidth = 60; ctx.strokeStyle = '#A87A22'; ctx.beginPath(); ctx.ellipse(0, 60, 210, 180, 0, 0, TAU); ctx.stroke();
  ctx.lineWidth = 40; ctx.strokeStyle = P.gold; ctx.beginPath(); ctx.ellipse(0, 60, 210, 180, 0, 0, TAU); ctx.stroke();
  cut(P_poly([[-90, -150], [-50, -210], [50, -210], [90, -150], [0, -60]]), '#CFE3E6');
  const sp = Math.max(0, Math.sin(t * 3)); ctx.save(); ctx.globalAlpha = sp; ctx.translate(70, -220); ctx.rotate(t); cut(P_poly([[0, -40], [10, -10], [40, 0], [10, 10], [0, 40], [-10, 10], [-40, 0], [-10, -10]]), '#FFF', { shadow: 0, edge: 0 }); ctx.restore();
}
function sword() {
  ctx.rotate(-0.6);
  cut(P_poly([[-30, -120], [-30, -520], [0, -600], [30, -520], [30, -120]]), '#D7DCD4');
  line([[0, -140], [0, -540]], STEEL, 6);
  cut(P_rr(-160, -130, 320, 50, 20), P.gold);
  cut(P_rr(-26, -80, 52, 220, 14), P.wine);
  cut(P_circ(0, 170, 44), P.gold);
}
function helmet() {
  cut(() => { ctx.beginPath(); ctx.moveTo(-260, 60); ctx.quadraticCurveTo(-260, -260, 0, -260); ctx.quadraticCurveTo(260, -260, 260, 60); ctx.closePath(); }, OLIVE);
  cut(ell(0, 70, 330, 50), OLIVE_DARK);
  ctx.save(); ctx.globalAlpha = 0.25; cut(() => { ctx.beginPath(); ctx.moveTo(-180, -60); ctx.quadraticCurveTo(-170, -200, -40, -220); ctx.quadraticCurveTo(-130, -160, -140, -60); ctx.closePath(); }, '#FFF', { shadow: 0, edge: 0 }); ctx.restore();
  line([[-200, 100], [-120, 240], [120, 240], [200, 100]], '#7A4B33', 10);
}
function compassRose(t) {
  cut(P_circ(0, 0, 260), '#B8862A'); cut(P_circ(0, 0, 225), P.edge, { shadow: 0, edge: 3 });
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; line([[Math.cos(a) * 190, Math.sin(a) * 190], [Math.cos(a) * 215, Math.sin(a) * 215]], P.ink, i % 4 ? 4 : 8); }
  ['N', 'E', 'S', 'W'].forEach((d, i) => { const a = i / 4 * TAU - Math.PI / 2; text(d, Math.cos(a) * 160, Math.sin(a) * 160, 44, d === 'N' ? P.crimson : P.ink); });
  ctx.save(); ctx.rotate(Math.sin(t * 1.7) * 0.35 + Math.sin(t * 4.3) * 0.05);
  cut(P_poly([[0, -130], [26, 0], [-26, 0]]), P.crimson, { shadow: 0.4, edge: 2 }); cut(P_poly([[0, 130], [26, 0], [-26, 0]]), P.ink, { shadow: 0.4, edge: 2 });
  ctx.restore(); circle(0, 0, 14, P.gold);
}
function lantern(t) {
  const g = 0.6 + 0.4 * Math.sin(t * 6) * Math.sin(t * 2.3);
  ctx.save(); ctx.globalAlpha = 0.18 + 0.12 * g; circle(0, 0, 330, '#F2C14E'); ctx.restore();
  ctx.lineWidth = 16; ctx.strokeStyle = P.ink; ctx.beginPath(); ctx.arc(0, -300, 70, Math.PI, 0); ctx.stroke();
  cut(P_rr(-150, -280, 300, 60, 14), P.ink);
  cut(P_rr(-120, -220, 240, 380, 10), '#F6E2A0'); ctx.save(); ctx.globalAlpha = g; cut(P_poly([[0, -120], [40, 20], [0, 80], [-40, 20]]), '#F2C14E', { shadow: 0, edge: 0 }); ctx.restore();
  for (const x of [-120, 0, 120]) line([[x, -220], [x, 160]], P.ink, 12);
  cut(P_rr(-170, 160, 340, 70, 14), P.ink);
}
function anchor(t) {
  ctx.rotate(Math.sin(t * 1.2) * 0.05);
  ctx.lineWidth = 36; ctx.strokeStyle = STEEL_DARK; ctx.beginPath(); ctx.arc(0, -300, 70, 0, TAU); ctx.stroke();
  cut(P_rr(-30, -240, 60, 520, 14), STEEL_DARK); cut(P_rr(-180, -170, 360, 50, 20), STEEL_DARK);
  ctx.lineWidth = 46; ctx.beginPath(); ctx.arc(0, 120, 240, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  for (const sx of [-1, 1]) cut(P_poly([[sx * 215, 180], [sx * 300, 120], [sx * 260, 240]]), STEEL_DARK);
}
function bottle(t) {
  ctx.rotate(-0.35 + Math.sin(t * 1.5) * 0.06);
  ctx.save(); ctx.globalAlpha = 0.75; cut(P_rr(-130, -180, 260, 460, 90), '#9DC2B4'); cut(P_rr(-50, -330, 100, 170, 20), '#9DC2B4'); ctx.restore();
  cut(P_rr(-56, -380, 112, 70, 12), '#9C6B3E');
  cut(P_rr(-70, -100, 140, 300, 20), '#F3E9D2', { shadow: 0.3, edge: 3 }); line([[-50, -20], [50, -20]], P.sepia, 6); line([[-50, 30], [40, 30]], P.sepia, 6);
  cut(P_rr(-30, 40, 60, 30, 8), P.crimson, { shadow: 0, edge: 0 });
}
function typewriter(t, o) {
  cut(P_rr(-260, -380, 520, 300, 6), '#F3E9D2', { shadow: 0.4, edge: 3 });
  const n = Math.min(4, Math.floor(t * 2) % 6);
  for (let i = 0; i < n; i++) line([[-200, -330 + i * 50], [i === n - 1 ? 40 : 200, -330 + i * 50]], 'rgba(62,44,30,0.55)', 9);
  if (o.headline) text(String(o.headline).toUpperCase().slice(0, 18), 0, -150, 40, P.ink, 'Caladea');
  cut(P_rr(-330, -110, 660, 70, 30), P.ink);
  cut(P_poly([[-300, -40], [300, -40], [360, 220], [-360, 220]]), '#2F3A33');
  for (let r = 0; r < 3; r++) for (let k = 0; k < 9 - r; k++) circle(-250 + r * 30 + k * 62, 20 + r * 62, 22, (k + r) % 5 === Math.floor(t * 6) % 5 ? P.gold : P.edge);
}
function goldbars() {
  const bar = (x, y) => { cut(P_poly([[x - 150, y + 60], [x - 110, y - 40], [x + 110, y - 40], [x + 150, y + 60]]), P.gold); cut(P_poly([[x - 110, y - 40], [x + 110, y - 40], [x + 90, y - 10], [x - 90, y - 10]]), '#E2B651', { shadow: 0, edge: 0 }); };
  bar(-160, 200); bar(160, 200); bar(0, 100);
}
function folder(t, o) {
  cut(P_rr(-320, -330, 260, 80, 16), MANILA_DARK);
  cut(P_rr(-320, -280, 640, 600, 12), MANILA_DARK);
  cut(P_rr(-290, -250, 590, 560, 6), '#F3E9D2', { shadow: 0.3, edge: 2 });
  for (let i = 0; i < 6; i++) line([[-240, -40 + i * 50], [i === 5 ? 60 : 240, -40 + i * 50]], 'rgba(62,44,30,0.4)', 9);
  cut(P_rr(-320, -130, 640, 450, 12), MANILA);
  ctx.save(); ctx.rotate(-0.12); ctx.strokeStyle = P.crimson; ctx.lineWidth = 10; ctx.strokeRect(-230, 20, 460, 130); text(String(o.headline || 'TOP SECRET').toUpperCase().slice(0, 16), 0, 88, 66, P.crimson, 'Caladea'); ctx.restore();
}
function castle() {
  const wall = (x, y, w, h, c) => { cut(P_rr(x, y, w, h, 0), c); for (let k = 0; k < Math.floor(w / 60); k++) cut(P_rr(x + 8 + k * 60, y - 40, 40, 44, 0), c, { shadow: 0.3, edge: 3 }); };
  wall(-330, -40, 660, 340, P.stone);
  wall(-380, -300, 170, 600, P.stoneDark); wall(210, -300, 170, 600, P.stoneDark);
  cut(() => { ctx.beginPath(); ctx.moveTo(-80, 300); ctx.lineTo(-80, 160); ctx.arc(0, 160, 80, Math.PI, 0); ctx.lineTo(80, 300); ctx.closePath(); }, P.ink);
  for (const x of [-295, 295]) cut(P_rr(x - 18, -200, 36, 70, 18), P.ink, { shadow: 0, edge: 0 });
  cut(P_rr(-6, -260, 12, 220, 4), P.ink, { shadow: 0, edge: 0 }); cut(P_poly([[6, -260], [120, -230], [6, -200]]), P.crimson, { shadow: 0.3, edge: 2 });
}
function lighthouse(t) {
  const a = t * 1.6;
  ctx.save(); ctx.globalAlpha = 0.28; ctx.fillStyle = '#F6E2A0'; ctx.beginPath(); ctx.moveTo(0, -380); ctx.lineTo(Math.cos(a) * 900, -380 - 160); ctx.lineTo(Math.cos(a) * 900, -380 + 160); ctx.closePath(); ctx.fill(); ctx.restore();
  cut(P_poly([[-150, 380], [-90, -300], [90, -300], [150, 380]]), P.edge);
  for (let i = 0; i < 3; i++) { const y0 = -180 + i * 190, y1 = y0 + 90, w0 = 90 + (y0 + 300) / 680 * 60, w1 = 90 + (y1 + 300) / 680 * 60; cut(P_poly([[-w0, y0], [w0, y0], [w1, y1], [-w1, y1]]), P.crimson, { shadow: 0, edge: 0 }); }
  cut(P_rr(-110, -330, 220, 40, 6), P.ink); cut(P_rr(-70, -440, 140, 110, 10), '#F6E2A0'); cut(P_poly([[-90, -440], [0, -520], [90, -440]]), P.ink);
}
function pyramid() {
  cut(P_poly([[-420, 300], [0, -330], [420, 300]]), '#D9B57A');
  cut(P_poly([[0, -330], [420, 300], [120, 300]]), '#C89B5E', { shadow: 0, edge: 0 });
  for (let i = 1; i < 7; i++) { const y = -330 + i * 90, hw = 420 * (y + 330) / 630; line([[-hw, y], [hw * 0.3, y]], 'rgba(62,44,30,0.25)', 4); }
  cut(P_rr(-40, 200, 80, 100, 0), P.ink, { shadow: 0, edge: 0 });
}
function temple() {
  cut(P_poly([[-380, -200], [0, -380], [380, -200]]), P.stone);
  cut(P_rr(-380, -210, 760, 50, 0), P.stoneDark);
  for (let i = 0; i < 6; i++) { cut(P_rr(-330 + i * 126, -160, 60, 400, 0), P.edge); for (let k = 1; k < 3; k++) line([[-330 + i * 126 + k * 20, -150], [-330 + i * 126 + k * 20, 230]], 'rgba(62,44,30,0.2)', 4); }
  cut(P_rr(-410, 240, 820, 50, 0), P.stoneDark); cut(P_rr(-450, 290, 900, 50, 0), P.stone);
}
function volcano(t) {
  for (let i = 0; i < 5; i++) { const k = (t * 0.35 + i / 5) % 1; ctx.save(); ctx.globalAlpha = (1 - k) * 0.85; cut(P_circ(-60 + Math.sin(i * 2 + k * 3) * 80, -300 - k * 420, 60 + k * 90), '#8F8A82', { shadow: 0, edge: 3 }); ctx.restore(); }
  cut(P_poly([[-480, 340], [-110, -260], [110, -260], [480, 340]]), '#6E5A48');
  cut(P_poly([[-110, -260], [-40, -200], [0, -240], [50, -190], [110, -260], [70, -60], [20, -120], [-20, 40], [-70, -110]]), P.crimson, { shadow: 0, edge: 0 });
  cut(P_poly([[-110, -260], [110, -260], [90, -230], [-90, -230]]), '#F2C14E', { shadow: 0, edge: 0 });
}
function fire(t) {
  cut(P_rr(-260, 200, 520, 60, 30), '#7A4B33'); cut(P_rr(-200, 160, 400, 50, 25), '#9C6B3E');
  const flame = (w, h, c, ph) => cut(() => { ctx.beginPath(); ctx.moveTo(-w, 180); ctx.quadraticCurveTo(-w * 1.1, 0, Math.sin(t * 6 + ph) * 40, -h); ctx.quadraticCurveTo(w * 1.1, 0, w, 180); ctx.closePath(); }, c, { shadow: 0.3, edge: 0 });
  flame(220, 420 + Math.sin(t * 7) * 30, P.crimson, 0); flame(160, 320 + Math.sin(t * 9) * 25, '#E07A2E', 1); flame(90, 200 + Math.sin(t * 11) * 20, '#F2C14E', 2);
}

// name -> draw(o, t, sc). Objects that stand on the ground sit lower in the frame.
const place = (fn, y = 900, s = 1.2) => (o, t, sc) => at(540, y, s * sc, () => fn(t, o));
export const PROPS = {
  tank: place(tank, 1150, 1.3), submarine: place(submarine, 1230, 1.3), car: place(car, 1150, 1.4), rocket: place(rocket, 850, 1.2),
  balloon: place(balloon, 850, 1.2), telephone: place(telephone, 950, 1.3), camera: place(camera, 950, 1.4), book: place(book, 950, 1.35),
  medal: place(medal, 900, 1.4), ring: place(ring, 950, 1.3), sword: place(sword, 1050, 1.2), helmet: place(helmet, 950, 1.4),
  compass: place(compassRose, 900, 1.5), lantern: place(lantern, 950, 1.3), anchor: place(anchor, 950, 1.3), bottle: place(bottle, 950, 1.4),
  typewriter: place(typewriter, 1000, 1.3), goldbars: place(goldbars, 1000, 1.4), folder: place(folder, 950, 1.3),
  castle: place(castle, 1150, 1.25), lighthouse: place(lighthouse, 1050, 1.25), pyramid: place(pyramid, 1150, 1.15), temple: place(temple, 1100, 1.15),
  volcano: place(volcano, 1150, 1.1), fire: place(fire, 1050, 1.4),
};
