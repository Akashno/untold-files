// Backgrounds ("settings") in the flat-vector style: layered depth, soft gradients, a little motion.
// People stand at y ≈ 1470 and captions sit near y 1640, so the busy detail stays above and to the sides.
import { ctx, W, H, TAU, clamp, rnd } from './core/lib.js';
import * as V from './vec.js';
import * as K from './core/kit.js';

const HZ = 1100; // horizon
const { lin, rad, solid, fill, R, E, Poly, stroke } = V;

function ground(c0, c1, y = HZ) { ctx.fillStyle = lin(0, y, 0, H, [[0, c0], [1, c1]]); ctx.fillRect(-300, y, W + 600, H + 300 - y); }
function band(y, amp, seed, c0, c1, step = 30) {
  ctx.beginPath(); ctx.moveTo(-300, H + 300); ctx.lineTo(-300, y);
  for (let x = -300; x <= W + 300; x += step) ctx.lineTo(x, y - Math.abs(Math.sin(x * 0.004 + seed)) * amp - Math.sin(x * 0.011 + seed * 2) * amp * 0.3);
  ctx.lineTo(W + 300, H + 300); ctx.closePath(); ctx.fillStyle = lin(0, y - amp, 0, y + 300, [[0, c0], [1, c1]]); ctx.fill();
}
function haze(y0, y1, color) { ctx.fillStyle = lin(0, y0, 0, y1, [[0, `rgba(${color},0)`], [1, `rgba(${color},0.5)`]]); ctx.fillRect(-300, y0, W + 600, y1 - y0); }
function clouds(t, k = 1) { V.cloud(160 + t * 12, 520, 0.8 * k); V.cloud(830 - t * 7, 400, 1.05 * k); V.cloud(560 + t * 9, 690, 0.55 * k); }

// ---- props ----
export function tree(x, y, s = 1, c = '#5E8C3E') {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  V.groundShadow(0, 0, 90, 16, 0.25);
  solid(R(-16, -160, 32, 160, 8), '#7A5232', [-16, -160, 32, 160], { round: true });
  for (const [dx, dy, r] of [[-50, -190, 70], [50, -200, 72], [0, -260, 85]]) solid(E(dx, dy, r, r), c, [dx - r, dy - r, r * 2, r * 2], { shade: 0.3 });
  fill(E(-30, -290, 26, 18), 'rgba(255,255,255,0.18)');
  ctx.restore();
}
function pine(x, y, s = 1, snow = false) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  solid(R(-12, -50, 24, 50, 4), '#6A4A30', [-12, -50, 24, 50]);
  for (let i = 0; i < 3; i++) {
    const w = 110 - i * 26, yb = -40 - i * 70;
    solid(Poly([[-w, yb], [0, yb - 130], [w, yb]]), '#3F6B48', [-w, yb - 130, w * 2, 130], { shade: 0.3 });
    if (snow) fill(Poly([[-w * 0.55, yb - 55], [0, yb - 130], [w * 0.55, yb - 55], [w * 0.2, yb - 45], [0, yb - 60], [-w * 0.25, yb - 44]]), '#F4F7FA');
  }
  ctx.restore();
}
function house(x, base, w, h, wall, roof, night) {
  const top = base - h;
  solid(R(x, top, w, h), wall, [x, top, w, h], { shade: 0.25, drop: 0.5 });
  solid(Poly([[x - 24, top + 4], [x + w / 2, top - h * 0.55], [x + w + 24, top + 4]]), roof, [x - 24, top - h * 0.55, w + 48, h * 0.6], { shade: 0.3 });
  solid(R(x + w * 0.7, top - h * 0.5, 30, h * 0.35), '#8C5A44', [x + w * 0.7, top - h * 0.5, 30, h * 0.35]);
  solid(R(x + w / 2 - 26, base - 92, 52, 92, [26, 26, 0, 0]), '#6E4630', [x + w / 2 - 26, base - 92, 52, 92]);
  for (const wx of [x + w * 0.2, x + w * 0.8]) { fill(R(wx - 26, top + h * 0.25, 52, 52, 4), night ? '#F6D27A' : lin(0, top + h * 0.25, 0, top + h * 0.25 + 52, [[0, '#BFE0F2'], [1, '#7FAFCB']])); stroke([[wx, top + h * 0.25], [wx, top + h * 0.25 + 52]], '#FFFFFF', 5, 'butt'); stroke([[wx - 26, top + h * 0.25 + 26], [wx + 26, top + h * 0.25 + 26]], '#FFFFFF', 5, 'butt'); }
}
function grassField(y0, y1, n = 14, seed = 0) { for (let i = 0; i < n; i++) V.grassTuft(rnd(i + seed) * W, y0 + rnd(i + 7 + seed) * (y1 - y0), 0.8 + rnd(i + 3) * 0.7); }
function facade(x, base, w, h, color, seed, night) {
  const top = base - h;
  solid(R(x, top, w, h), color, [x, top, w, h], { shade: 0.25 });
  fill(R(x - 8, top, w + 16, 22), V.shade(color, -40));
  const cols = Math.max(2, Math.floor(w / 80)), rows = Math.max(2, Math.floor((h - 160) / 110));
  for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
    const wx = x + (w / cols) * (k + 0.5) - 22, wy = top + 50 + r * 110, lit = night && rnd(seed * 31 + r * 7 + k) > 0.45;
    fill(R(wx, wy, 44, 66, [22, 22, 2, 2]), lit ? '#F6D27A' : lin(0, wy, 0, wy + 66, [[0, '#A8CDE0'], [1, '#5F8DAA']]));
    fill(R(wx - 6, wy + 66, 56, 8), V.shade(color, -30));
  }
  fill(R(x + 10, base - 120, w - 20, 120), V.shade(color, -55));
  solid(Poly([[x + 4, base - 130], [x + w - 4, base - 130], [x + w + 10, base - 90], [x - 10, base - 90]]), seed % 2 ? '#B8443A' : '#2F6E6A', [x - 10, base - 130, w + 20, 40]);
}
function lamp(x, base, night) {
  solid(R(x - 7, base - 300, 14, 300), '#2E3138', [x - 7, base - 300, 14, 300], { round: true });
  solid(R(x - 24, base - 350, 48, 56, 8), '#2E3138', [x - 24, base - 350, 48, 56]);
  fill(R(x - 16, base - 342, 32, 40, 4), night ? '#FFE3A0' : '#E9E1C8');
  if (night) fill(E(x, base - 320, 120, 120), rad(x, base - 320, 0, 120, [[0, 'rgba(255,220,140,0.4)'], [1, 'rgba(255,220,140,0)']]));
}
function bigLeaf(x, y, s, rot, c) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  solid(() => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(90, -110, 0, -300); ctx.quadraticCurveTo(-90, -110, 0, 0); }, c, [-90, -300, 180, 300], { shade: 0.35 });
  stroke([[0, -10], [0, -280]], 'rgba(255,255,255,0.25)', 4);
  ctx.restore();
}

// ---- the settings ----
export const PLACES = {
  day(t, n) {
    V.sky('#86B6DA', '#EEF1E2', HZ); V.sunGlow(860, 520, 460); clouds(t);
    V.mountains(HZ, [[80, 560, 240], [420, 640, 320], [780, 600, 270], [1080, 540, 240]], '#ABA8C6', '#8F8BAE');
    haze(880, HZ, '238,241,226'); V.treeline(HZ + 6, '#5E8247', 2);
    ground('#93C060', '#6A9A40');
    house(40, 1240, 230, 170, '#EAD8B8', '#B8443A', n); house(800, 1230, 210, 160, '#D9E2E6', '#3E5A78', n);
    tree(330, 1250, 0.9); tree(700, 1240, 0.8, '#6E9A44'); tree(1020, 1290, 1.0);
    ctx.fillStyle = lin(0, 1240, 0, H, [[0, '#D9B57A'], [1, '#C4975A']]); ctx.beginPath(); ctx.moveTo(500, 1240); ctx.lineTo(580, 1240); ctx.lineTo(900, H + 100); ctx.lineTo(180, H + 100); ctx.closePath(); ctx.fill();
    grassField(1300, 1900, 12, 1); V.stone(140, 1820, 30); V.stone(960, 1860, 40);
  },
  field(t, n) {
    V.sky('#8CB9D8', '#F1EEDC', HZ); V.sunGlow(820, 470, 420); clouds(t, 0.9);
    band(HZ - 10, 70, 2, '#86A85A', '#6E9446'); V.treeline(HZ + 10, '#567A40', 5);
    ground('#C9B35A', '#9C8A3E');
    for (let i = 0; i < 9; i++) { const y0 = HZ + 30 + i * i * 10, y1 = HZ + 30 + (i + 1) * (i + 1) * 10; if (i % 2) { ctx.fillStyle = 'rgba(110,140,60,0.35)'; ctx.fillRect(-300, y0, W + 600, y1 - y0); } }
    for (const [x, s] of [[150, 1], [880, 0.8]]) { ctx.save(); ctx.translate(x, 1250); ctx.scale(s, s); V.groundShadow(0, 0, 130, 20, 0.3); solid(() => { ctx.beginPath(); ctx.moveTo(-120, 0); ctx.quadraticCurveTo(-110, -190, 0, -190); ctx.quadraticCurveTo(110, -190, 120, 0); ctx.closePath(); }, '#E2BE5A', [-120, -190, 240, 190], { round: true }); for (let k = -2; k <= 2; k++) stroke([[k * 40, -170 + Math.abs(k) * 12], [k * 48, 0]], 'rgba(150,110,30,0.35)', 4); ctx.restore(); }
    V.fence(1330, -40, W + 40); grassField(1360, 1900, 10, 4);
  },
  jungle(t, n) {
    V.sky('#B9D3A8', '#E8EBC8', HZ);
    for (let k = 0; k < 3; k++) { const y = 700 + k * 170, c = ['#8FAE78', '#6E9458', '#4F7740'][k]; ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-300, H); for (let x = -300; x <= W + 300; x += 60) ctx.arc(x, y - rnd(x * 0.1 + k) * 60, 60 + rnd(x + k) * 30, Math.PI, 0); ctx.lineTo(W + 300, H); ctx.closePath(); ctx.fill(); }
    ctx.save(); ctx.globalAlpha = 0.18; for (const x of [200, 520, 840]) fill(Poly([[x, -100], [x + 90, -100], [x + 260, 1500], [x + 60, 1500]]), '#FFF6D0'); ctx.restore();
    ground('#4F7A3A', '#355728', 1300);
    for (const x of [60, 240, 860, 1040]) for (let v = 0; v < 2; v++) stroke([[x + v * 30, -50], [x + v * 30 + Math.sin(t + x) * 10, 260 + rnd(x + v) * 260]], '#3E6A34', 6);
    for (let i = 0; i < 8; i++) { const left = i < 4, x = left ? -30 + i * 50 : W + 30 - (i - 4) * 50; bigLeaf(x, 1500 + (i % 4) * 60, 1.1 + rnd(i) * 0.6, (left ? 0.7 : -0.7) + Math.sin(t * 1.3 + i) * 0.05, i % 2 ? '#3F7A3C' : '#5A9447'); }
    grassField(1320, 1900, 10, 9);
  },
  sea(t, n) {
    V.sky('#7FB2D8', '#EAF0E6', HZ - 120); V.sunGlow(800, 560, 420); clouds(t, 0.9);
    fill(Poly([[-60, HZ - 120], [80, HZ - 190], [200, HZ - 160], [330, HZ - 120]]), '#7C9A86');
    ctx.fillStyle = lin(0, HZ - 120, 0, H, [[0, '#6FA3C2'], [0.4, '#4E86A8'], [1, '#2F6688']]); ctx.fillRect(-300, HZ - 120, W + 600, H);
    for (let i = 0; i < 14; i++) { const y = HZ - 100 + i * i * 6.5, a = 0.25 + i * 0.02; ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 2 + i * 0.5; ctx.beginPath(); for (let x = -300; x <= W + 300; x += 20) ctx.lineTo(x, y + Math.sin(x * (0.02 - i * 0.0008) + t * 1.6 + i) * (2 + i * 0.8)); ctx.stroke(); }
    fill(E(800, HZ - 60, 220, 14), 'rgba(255,246,214,0.35)');
    solid(R(-60, 1560, 360, 36), '#8A5A34', [-60, 1560, 360, 36]); for (const x of [0, 120, 240]) solid(R(x, 1560, 26, 400), '#7A4E2C', [x, 1560, 26, 400], { round: true });
  },
  hall(t, n) {
    ctx.fillStyle = lin(0, -300, 0, 1250, [[0, '#B8A588'], [1, '#D8C7A6']]); ctx.fillRect(-300, -300, W + 600, 1550);
    for (const x of [180, 900]) { fill(() => { ctx.beginPath(); ctx.moveTo(x - 90, 1000); ctx.lineTo(x - 90, 380); ctx.arc(x, 380, 90, Math.PI, 0); ctx.lineTo(x + 90, 1000); ctx.closePath(); }, lin(0, 300, 0, 1000, [[0, '#BFE0F2'], [1, '#F5EBD0']])); ctx.save(); ctx.globalAlpha = 0.15; fill(Poly([[x - 90, 1000], [x + 90, 1000], [x + 260, 1250], [x - 40, 1250]]), '#FFF6D0'); ctx.restore(); }
    for (const x of [370, 710]) { solid(Poly([[x - 70, 240], [x + 70, 240], [x + 70, 820], [x, 760], [x - 70, 820]]), '#9E2A2A', [x - 70, 240, 140, 580], { shade: 0.3 }); fill(E(x, 420, 34, 34), '#D9B24C'); }
    for (const x of [40, 1040]) { solid(R(x - 60, 120, 120, 1140), '#EDE3CF', [x - 60, 120, 120, 1140], { round: true, shade: 0.35 }); fill(R(x - 75, 110, 150, 40), '#D8CCB2'); fill(R(x - 75, 1230, 150, 40), '#D8CCB2'); }
    ctx.fillStyle = lin(0, 1250, 0, H, [[0, '#CFC2A8'], [1, '#A99A7C']]); ctx.fillRect(-300, 1250, W + 600, H);
    for (let i = 0; i < 9; i++) { const y = 1250 + i * i * 9; stroke([[-300, y], [W + 300, y]], 'rgba(90,70,40,0.18)', 2); }
    for (let k = -8; k <= 8; k++) stroke([[540 + k * 70, 1250], [540 + k * 260, H + 200]], 'rgba(90,70,40,0.15)', 2);
    fill(Poly([[470, 1250], [610, 1250], [800, H + 100], [280, H + 100]]), lin(0, 1250, 0, H, [[0, '#A32E2E'], [1, '#7A1E22']]));
    solid(R(470, 960, 140, 230, [40, 40, 6, 6]), '#8C2230', [470, 960, 140, 230], { shade: 0.3 }); solid(R(450, 1150, 180, 50, 8), '#D9B24C', [450, 1150, 180, 50]); fill(E(540, 950, 40, 22), '#D9B24C');
    ctx.save(); ctx.translate(540, 120); stroke([[0, -200], [0, 40]], '#5A4A30', 6); solid(R(-140, 40, 280, 24, 12), '#C9A24A', [-140, 40, 280, 24]); for (let k = -3; k <= 3; k++) { fill(R(k * 44 - 5, 10, 10, 34), '#F2E8D0'); fill(E(k * 44, 2, 6, 10 + Math.sin(t * 9 + k) * 2), '#FFD36A'); } ctx.restore();
  },
  room(t, n) {
    ctx.fillStyle = lin(0, -300, 0, 1300, [[0, '#7E8F78'], [1, '#9EAE94']]); ctx.fillRect(-300, -300, W + 600, 1600);
    for (let x = -300; x < W + 300; x += 70) { ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(x, -300, 30, 1300); }
    solid(R(-300, 1000, W + 600, 300), '#6E5A44', [-300, 1000, W + 600, 300], { shade: 0.2 }); for (let x = -260; x < W + 300; x += 220) stroke([[x, 1030], [x, 1270]], 'rgba(0,0,0,0.15)', 4);
    fill(R(600, 300, 330, 420, 6), lin(0, 300, 0, 720, [[0, n ? '#20294A' : '#9CCBE6'], [1, n ? '#3A4670' : '#E6F0E6']])); if (!n) V.cloud(760, 470, 0.5);
    stroke([[765, 300], [765, 720]], '#F3EEE2', 12, 'butt'); stroke([[600, 510], [930, 510]], '#F3EEE2', 12, 'butt'); ctx.strokeStyle = '#F3EEE2'; ctx.lineWidth = 18; ctx.strokeRect(600, 300, 330, 420);
    for (const [x, d] of [[560, 1], [970, -1]]) solid(Poly([[x - 50 * d, 260], [x + 50 * d, 260], [x + 30 * d, 760], [x - 50 * d, 780]]), '#A8443C', [Math.min(x - 50 * d, x + 50 * d), 260, 100, 520], { shade: 0.3 });
    solid(R(120, 380, 260, 200, 4), '#C9A24A', [120, 380, 260, 200]); fill(R(140, 400, 220, 160), lin(0, 400, 0, 560, [[0, '#8FB0C4'], [1, '#5E8B5A']]));
    ctx.fillStyle = lin(0, 1300, 0, H, [[0, '#9A6A3E'], [1, '#6E4627']]); ctx.fillRect(-300, 1300, W + 600, H);
    for (let k = -6; k <= 6; k++) stroke([[540 + k * 120, 1300], [540 + k * 330, H + 200]], 'rgba(40,20,10,0.2)', 3);
    fill(E(540, 1500, 430, 90), lin(0, 1530, 0, 1750, [[0, '#B8443A'], [1, '#8C2E2A']])); ctx.strokeStyle = '#D9B24C'; ctx.lineWidth = 8; ctx.beginPath(); ctx.ellipse(540, 1500, 390, 74, 0, 0, TAU); ctx.stroke();
  },
  desert(t, n) {
    V.sky('#E9B87A', '#F7E3B8', HZ); V.sunGlow(780, 560, 520); fill(E(780, 560, 110, 110), '#FBE6A4');
    band(HZ - 40, 90, 6, '#E2B878', '#D2A060'); band(HZ + 120, 120, 9, '#D9A863', '#C08A4C'); band(HZ + 330, 100, 2, '#E8BE7E', '#C99355');
    ctx.save(); ctx.globalAlpha = 0.12; for (let i = 0; i < 6; i++) fill(R(-300, HZ - 60 + i * 14 + Math.sin(t * 2 + i) * 4, W + 600, 4), '#FFF'); ctx.restore();
    V.stone(160, 1700, 60, 34); V.stone(930, 1600, 46, 26);
  },
  snow(t, n) {
    V.sky('#9FBCD2', '#EEF2F4', HZ);
    for (const [x, w, h] of [[120, 620, 360], [520, 720, 440], [960, 640, 340]]) { fill(Poly([[x - w / 2, HZ], [x, HZ - h], [x + w / 2, HZ]]), '#A9B6C8'); fill(Poly([[x, HZ - h], [x + w / 2, HZ], [x + w * 0.06, HZ]]), '#8E9BB0'); fill(Poly([[x - w * 0.14, HZ - h * 0.72], [x, HZ - h], [x + w * 0.14, HZ - h * 0.72], [x + w * 0.05, HZ - h * 0.66], [x - w * 0.04, HZ - h * 0.74]]), '#F4F7FA'); }
    haze(860, HZ, '238,242,244');
    ground('#EEF3F7', '#CBD7E2', HZ);
    for (let i = 0; i < 9; i++) pine(i * 135 - 30 + rnd(i) * 40, HZ + 60 + rnd(i + 4) * 50, 0.7 + rnd(i + 2) * 0.3, true);
    pine(80, 1450, 1.6, true); pine(1010, 1420, 1.4, true);
    ctx.fillStyle = '#FFFFFF'; for (let i = 0; i < 70; i++) { const x = (rnd(i) * W + t * 22 * (1 + rnd(i + 2))) % W, y = (rnd(i + 4) * H + t * 110 * (1 + rnd(i + 1))) % H; ctx.beginPath(); ctx.arc(x, y, 3 + rnd(i) * 5, 0, TAU); ctx.fill(); }
  },
  city(t, n) {
    V.sky('#8DB7D6', '#F0EDE0', HZ); clouds(t, 0.8);
    ctx.fillStyle = '#A9B4C2'; for (let x = -40; x < W + 40; x += 90) ctx.fillRect(x, 640 + rnd(x) * 200, 80, 600);
    const row = [[-60, 260, 560, '#D9C2A0'], [190, 230, 700, '#C98E74'], [410, 250, 520, '#E2D6BE'], [650, 230, 640, '#9FB3A8'], [870, 270, 560, '#D3A86E']];
    row.forEach(([x, w, h, c], i) => facade(x, 1260, w, h, c, i + 1, n));
    ctx.fillStyle = lin(0, 1260, 0, 1330, [[0, '#B8B2A6'], [1, '#9E978A']]); ctx.fillRect(-300, 1260, W + 600, 70);
    ctx.fillStyle = lin(0, 1330, 0, H, [[0, '#7E7A74'], [1, '#5E5A55']]); ctx.fillRect(-300, 1330, W + 600, H);
    for (let r = 0; r < 10; r++) for (let k = 0; k < 14; k++) { const y = 1340 + r * r * 6 + r * 10, x = ((k + (r % 2) * 0.5) / 13) * (W + 200) - 100; fill(R(x, y, 60 + r * 4, 12 + r * 2, 4), 'rgba(255,255,255,0.06)'); }
    lamp(120, 1300, n); lamp(960, 1300, n);
  },
  parchment(t) { K.parchment(9); },
};

export function nightOver(t) {
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#7484B8'; ctx.fillRect(-300, -300, W + 600, H + 600); ctx.restore();
  ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = '#141A33'; ctx.fillRect(-300, -300, W + 600, H + 600); ctx.restore();
  for (let i = 0; i < 40; i++) { const tw = 0.6 + 0.4 * Math.sin(t * 3 + i); ctx.globalAlpha = tw; fill(E(rnd(i + 3) * W, rnd(i + 40) * 700 + 60, 2 + rnd(i) * 3, 2 + rnd(i) * 3), '#F4EBD0'); }
  ctx.globalAlpha = 1; fill(E(820, 300, 70, 70), '#F2EBD2'); fill(E(850, 285, 62, 62), 'rgba(20,26,51,0.9)');
}
