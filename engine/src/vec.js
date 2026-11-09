// Flat-vector kit with depth: soft gradients, one light from the upper left, shade on the far side, ground shadows.
// Everything is drawn in code (no image files), so it stays free to render every day.
import { ctx, W, H, TAU, clamp, lerp, rnd } from './core/lib.js';

export const C = {
  ink: '#2A2230', navy: '#1F2A55', red: '#C2302B', cream: '#F4EBD6', creamDark: '#E4D3AE',
  skin: '#F1C29C', skinDark: '#D89A72', blush: '#EE9F8C', white: '#FFFFFF', eyeLine: '#3A2A2A',
  sky0: '#8DBCDD', sky1: '#E6EEE0', grass0: '#9CC765', grass1: '#6E9F45', dirt0: '#D9A76A', dirt1: '#B9824A',
  asphalt0: '#6D6F76', asphalt1: '#55575E', steel0: '#F7F8FA', steel1: '#B6BCC6',
};

// ---- paths ----
export const R = (x, y, w, h, r = 0) => () => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };
export const E = (x, y, rx, ry, rot = 0) => () => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, TAU); };
export const Poly = (pts) => () => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); };

export function lin(x0, y0, x1, y1, stops) { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
export function rad(x, y, r0, r1, stops) { const g = ctx.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }

/**
 * Fill a shape and give it volume: base colour, shade on the right/bottom, a soft highlight on the upper left.
 * box = [x, y, w, h] bounds of the shape. o.shade 0..1, o.round (cylinder-like shading), o.outline colour.
 */
export function solid(path, base, box, o = {}) {
  const [x, y, w, h] = box, sh = o.shade ?? 0.22;
  ctx.save();
  if (o.drop) { ctx.shadowColor = 'rgba(30,20,40,0.28)'; ctx.shadowBlur = 24 * o.drop; ctx.shadowOffsetY = 10 * o.drop; ctx.shadowOffsetX = 4 * o.drop; }
  path(); ctx.fillStyle = base; ctx.fill();
  ctx.restore();
  ctx.save(); path(); ctx.clip();
  if (o.round) ctx.fillStyle = lin(x, y, x + w, y, [[0, `rgba(0,0,0,${sh * 0.5})`], [0.25, 'rgba(255,255,255,0.12)'], [0.55, 'rgba(0,0,0,0)'], [1, `rgba(0,0,0,${sh})`]]);
  else if (o.vertical) ctx.fillStyle = lin(x, y, x, y + h, [[0, 'rgba(255,255,255,0.18)'], [0.45, 'rgba(0,0,0,0)'], [1, `rgba(0,0,0,${sh})`]]);
  else ctx.fillStyle = lin(x, y, x + w, y + h, [[0, 'rgba(255,255,255,0.16)'], [0.5, 'rgba(0,0,0,0)'], [1, `rgba(0,0,0,${sh})`]]);
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.restore();
  if (o.outline) { path(); ctx.strokeStyle = o.outline; ctx.lineWidth = o.lw ?? 3; ctx.stroke(); }
}
export function fill(path, color) { path(); ctx.fillStyle = color; ctx.fill(); }
export function stroke(pts, color, w, cap = 'round') { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = cap; ctx.lineJoin = 'round'; ctx.stroke(); }
export function groundShadow(x, y, rx, ry = rx * 0.16, a = 0.22) { ctx.save(); ctx.fillStyle = rad(0, 0, 0, 1, [[0, `rgba(40,30,20,${a})`], [1, 'rgba(40,30,20,0)']]); ctx.translate(x, y); ctx.scale(rx, ry); ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill(); ctx.restore(); }

// ---- scenery ----
export function sky(top = C.sky0, bottom = C.sky1, horizon = 1060) {
  ctx.fillStyle = lin(0, -200, 0, horizon, [[0, top], [1, bottom]]); ctx.fillRect(-400, -400, W + 800, horizon + 400);
}
export function sunGlow(x, y, r = 420) { ctx.fillStyle = rad(x, y, 0, r, [[0, 'rgba(255,246,214,0.9)'], [0.25, 'rgba(255,240,200,0.45)'], [1, 'rgba(255,240,200,0)']]); ctx.fillRect(x - r, y - r, r * 2, r * 2); }
export function cloud(x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const puffs = [[-120, 10, 60], [-60, -30, 80], [20, -45, 95], [100, -15, 70], [160, 15, 50], [0, 15, 70]];
  const path = () => { ctx.beginPath(); puffs.forEach(([px, py, r]) => { ctx.moveTo(px + r, py); ctx.arc(px, py, r, 0, TAU); }); ctx.moveTo(200, 30); ctx.ellipse(10, 30, 190, 38, 0, 0, TAU); };
  ctx.save(); path(); ctx.fillStyle = C.white; ctx.fill(); ctx.restore();
  ctx.save(); path(); ctx.clip(); ctx.fillStyle = lin(0, -100, 0, 65, [[0.45, 'rgba(160,185,210,0)'], [1, 'rgba(160,185,210,0.55)']]); ctx.fillRect(-250, -150, 500, 220); ctx.restore();
  ctx.restore();
}
/** a range of peaks; each has a lit left face and a shaded right face */
export function mountains(baseY, peaks, light, dark) {
  for (const [x, w, h] of peaks) {
    fill(Poly([[x - w / 2, baseY], [x, baseY - h], [x + w / 2, baseY]]), light);
    fill(Poly([[x, baseY - h], [x + w / 2, baseY], [x + w * 0.08, baseY]]), dark);
  }
}
export function treeline(y, color, seed = 1) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(-300, y + 80);
  for (let x = -300; x <= W + 300; x += 34) { const r = 26 + rnd(x * 0.1 + seed) * 26; ctx.arc(x, y - rnd(x + seed) * 18, r, Math.PI, 0); }
  ctx.lineTo(W + 300, y + 80); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(-300, y + 10, W + 600, 70);
}
export function grassTuft(x, y, s = 1, color = '#5D8A3A') {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = color;
  for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 7 - 5, 0); ctx.quadraticCurveTo(i * 9, -22, i * 13 + (i % 2 ? 4 : -4), -38 - (3 - Math.abs(i)) * 6); ctx.quadraticCurveTo(i * 9 + 4, -18, i * 7 + 5, 0); ctx.fill(); }
  ctx.restore();
}
export function stone(x, y, rx, ry = rx * 0.6) { solid(E(x, y, rx, ry), '#A9A39A', [x - rx, y - ry, rx * 2, ry * 2], { shade: 0.3 }); fill(E(x - rx * 0.3, y - ry * 0.35, rx * 0.35, ry * 0.25), 'rgba(255,255,255,0.35)'); }

// ---- buildings ----
export function hangar(x, base, w, h, label = '') {
  const top = base - h, arch = h * 0.42;
  const shell = () => { ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x, top + arch); ctx.quadraticCurveTo(x + w / 2, top - arch * 0.6, x + w, top + arch); ctx.lineTo(x + w, base); ctx.closePath(); };
  solid(shell, '#C9CDD3', [x, top - arch, w, h + arch], { shade: 0.3, drop: 0.6 });
  ctx.save(); shell(); ctx.clip(); for (let k = x + 14; k < x + w; k += 18) stroke([[k, top - arch], [k, base]], 'rgba(60,70,85,0.13)', 3, 'butt'); ctx.restore();
  const dw = w * 0.62, dx = x + (w - dw) / 2, dh = h * 0.62;
  fill(R(dx, base - dh, dw, dh), lin(0, base - dh, 0, base, [[0, '#2C2F38'], [1, '#474B55']]));
  for (let k = 1; k < 4; k++) stroke([[dx + dw * k / 4, base - dh], [dx + dw * k / 4, base]], 'rgba(0,0,0,0.35)', 4, 'butt');
  fill(R(dx - 10, base - dh - 14, dw + 20, 16), '#8E949E');
  if (label) { ctx.font = '900 40px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = C.navy; ctx.fillText(label, x + w * 0.72, top + arch * 0.75); }
}
export function tower(x, base, t) {
  solid(R(x - 34, base - 330, 68, 330), '#D7D2C6', [x - 34, base - 330, 68, 330], { round: true, shade: 0.35 });
  solid(Poly([[x - 95, base - 330], [x + 95, base - 330], [x + 80, base - 300], [x - 80, base - 300]]), '#8E949E', [x - 95, base - 330, 190, 30]);
  fill(Poly([[x - 105, base - 450], [x + 105, base - 450], [x + 92, base - 330], [x - 92, base - 330]]), lin(x - 105, 0, x + 105, 0, [[0, '#7FB2D2'], [0.5, '#A9D2E8'], [1, '#5D8FB0']]));
  ctx.save(); ctx.globalAlpha = 0.45; fill(Poly([[x - 60, base - 450], [x - 20, base - 450], [x - 60, base - 330], [x - 90, base - 330]]), '#FFFFFF'); ctx.restore();
  for (const k of [-0.5, 0, 0.5]) stroke([[x + k * 200 * 0.97, base - 450], [x + k * 180, base - 330]], '#3C4250', 6);
  solid(R(x - 120, base - 478, 240, 30, 6), '#3C4250', [x - 120, base - 478, 240, 30]);
  stroke([[x, base - 478], [x, base - 560]], '#3C4250', 6);
  const on = Math.sin(t * 4) > 0; fill(E(x, base - 566, 9, 9), on ? '#FF4A3D' : '#7A2A26');
  if (on) fill(E(x, base - 566, 26, 26), 'rgba(255,74,61,0.25)');
}
export function fence(y, x0 = -40, x1 = W + 40) {
  for (let x = x0; x <= x1; x += 64) solid(R(x - 5, y - 70, 10, 74, 3), '#8A8F96', [x - 5, y - 70, 10, 74], { shade: 0.3 });
  for (const yy of [y - 60, y - 34, y - 8]) stroke([[x0, yy], [x1, yy]], 'rgba(90,95,105,0.7)', 2.5);
}
export function cone(x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  groundShadow(8, 4, 70, 14, 0.3);
  solid(R(-56, -14, 112, 18, 4), '#E2601F', [-56, -14, 112, 18]);
  solid(Poly([[-38, -14], [-10, -120], [10, -120], [38, -14]]), '#F07A2E', [-38, -120, 76, 106], { round: true, shade: 0.3 });
  fill(Poly([[-28, -50], [28, -50], [23, -72], [-23, -72]]), '#F5F5F0');
  ctx.restore();
}

// ---- vehicles ----
/** a jet airliner in side view, nose to the right, wheels at y. noseDown tilts it onto its nose. */
export function jet(x, y, s = 1, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); if (o.tilt) ctx.rotate(o.tilt);
  const fy = -150; // fuselage centre
  // far wing + engine (behind the body)
  fill(Poly([[-40, fy + 20], [120, fy + 20], [-120, fy - 60], [-190, fy - 60]]), '#9AA1AC');
  // tail
  solid(Poly([[-420, fy - 30], [-500, fy - 250], [-430, fy - 250], [-300, fy - 40]]), o.tail || C.navy, [-500, fy - 250, 200, 220], { shade: 0.3 });
  fill(Poly([[-470, fy - 200], [-440, fy - 200], [-400, fy - 120], [-430, fy - 120]]), o.stripe || C.red);
  // body
  const body = () => { ctx.beginPath(); ctx.moveTo(-430, fy - 50); ctx.lineTo(330, fy - 55); ctx.bezierCurveTo(430, fy - 55, 470, fy, 470, fy + 15); ctx.bezierCurveTo(470, fy + 40, 430, fy + 55, 330, fy + 55); ctx.lineTo(-330, fy + 55); ctx.quadraticCurveTo(-410, fy + 40, -470, fy - 25); ctx.closePath(); };
  solid(body, C.steel0, [-470, fy - 55, 940, 110], { vertical: true, shade: 0.4, drop: 0.5 });
  ctx.save(); body(); ctx.clip(); fill(R(-480, fy + 12, 960, 12), o.stripe || C.red); fill(R(-480, fy + 24, 960, 6), C.navy); ctx.restore();
  for (let k = -300; k < 300; k += 30) fill(R(k, fy - 22, 14, 18, 5), '#2E4A66');
  fill(Poly([[372, fy - 34], [430, fy - 30], [446, fy - 12], [380, fy - 14]]), '#2E4A66');
  stroke([[300, fy - 40], [300, fy + 10]], 'rgba(60,70,85,0.35)', 3); stroke([[-360, fy - 36], [-360, fy + 10]], 'rgba(60,70,85,0.35)', 3);
  // tailplane
  fill(Poly([[-440, fy - 20], [-330, fy - 20], [-380, fy + 10], [-520, fy + 10]]), '#AEB4BE');
  // near wing + engine
  solid(Poly([[-80, fy + 30], [80, fy + 30], [-150, fy + 120], [-230, fy + 120]]), '#C3C8D0', [-230, fy + 30, 310, 90], { shade: 0.3 });
  solid(R(-40, fy + 50, 170, 70, 35), '#D9DDE3', [-40, fy + 50, 170, 70], { vertical: true, shade: 0.45 });
  fill(E(128, fy + 85, 14, 33), '#3A3F48');
  // gear
  stroke([[-20, fy + 55], [-20, -38]], '#5A5F68', 12); stroke([[360, fy + 55], [o.noseGear === false ? 330 : 360, o.noseGear === false ? fy + 70 : -38]], '#5A5F68', 10);
  for (const wx of [-40, 0]) { fill(E(wx, -24, 26, 26), '#2A2D33'); fill(E(wx, -24, 10, 10), '#8E949E'); }
  if (o.noseGear !== false) { fill(E(360, -22, 22, 22), '#2A2D33'); fill(E(360, -22, 8, 8), '#8E949E'); }
  ctx.restore();
}

// ---- people ----
/** hair colours a story can ask for */
export const HAIR = { black: '#1E1A18', brown: '#5A3A22', blonde: '#D9B45A', red: '#A8482A', grey: '#C8C4BC' };
export const SKINS = { light: ['#F1C29C', '#D89A72'], medium: ['#DDA77E', '#C08460'], tan: ['#C08A5E', '#A06E45'], dark: ['#8D5A3C', '#714630'] };
/** what each story role wears */
export function roleLook(role) {
  return ({
    king: { top: '#8C2230', robe: true, fur: true, hat: 'crown', beard: '#D8D2C6', hair: '#D8D2C6', brow: '#B8B2A6' },
    queen: { top: '#3D5A9E', dress: true, hat: 'crown', hair: '#6B3E26', hairStyle: 'long', lips: true },
    sailor: { top: '#F3F1EA', pants: '#24365C', hat: 'sailor', sailorCollar: true, hair: '#3A2A1E' },
    scholar: { top: '#4F6D4A', robe: true, glasses: true, beard: '#E8E4DA', hair: '#E8E4DA', hairStyle: 'bald', brow: '#C8C2B6' },
    guard: { top: '#8C949C', armor: true, pants: '#5A3A2A', hat: 'knight' },
    merchant: { top: '#7A2E3A', jacket: true, pants: '#3A2A22', hat: 'tophat', mustache: '#3A2A1E' },
    worker: { top: '#B8443A', plaid: true, pants: '#3B5A85', hat: 'cap', hatColor: '#C9A24A' },
    soldier: { top: '#5E6B45', pants: '#4E5A38', hat: 'helmet', jacket: true, shoes: '#3A2E22' },
    officer: { top: '#4E5A3A', pants: '#3E4A2E', jacket: true, hat: 'captain', hatColor: '#4E5A3A', mustache: '#3A2A1E', shoes: '#241C16' },
    pilot: { top: '#22305C', pants: '#1E2847', jacket: true, hat: 'captain', mustache: '#ECE7DC', hair: '#D7D2C8', brow: '#9A9590', shoes: '#1D1A1E' },
    civilian: { top: '#3B6EA5', pants: '#5A4636', hat: 'flatcap', hatColor: '#6A5240' },
    woman: { top: '#9E3A4A', dress: true, hair: '#4A2E1E', hairStyle: 'long', lips: true },
    child: { top: '#E07A3A', pants: '#3B5A85', hair: '#7A4A2A', hairStyle: 'short', child: true },
    man: { top: '#3B6EA5', pants: '#3A3A44', hair: '#3A2A1E', hairStyle: 'short', shoes: '#2A2220' },
    girl: { top: '#D9586A', pants: '#3B5A85', hair: '#4A2E1E', hairStyle: 'long', lips: true, teen: true },
    boy: { top: '#4F8A5A', pants: '#3B4A6A', hair: '#4A2E1E', hairStyle: 'short', teen: true },
    scientist: { top: '#F4F3EE', jacket: true, pants: '#3A3A44', glasses: true, hair: '#5A4A3A', hairStyle: 'short' },
    oldman: { top: '#7A6A5A', jacket: true, pants: '#4A4038', hair: '#D8D2C6', hairStyle: 'bald', mustache: '#D8D2C6', brow: '#B8B2A6', glasses: true },
    oldwoman: { top: '#6A5A8A', dress: true, hair: '#D8D2C6', hairStyle: 'long', lips: true, glasses: true, brow: '#B8B2A6' },
  })[role] || { top: '#3B6EA5', pants: '#5A4636', hair: '#3A2A1E', hairStyle: 'short' };
}
/**
 * A side-on cartoon person: big round eye, big nose, shaded clothes, a shadow at the feet.
 * o: x, y (feet), h (body height without hat), dir (1 faces right), role (roleLook) and/or any look fields,
 *    skin ('light'|'medium'|'tan'|'dark'), blink 0..1, talk 0..1, arm ('down'|'point'|'up'|'wave'), walk (phase), t
 */
export function person(o) {
  o = { ...roleLook(o.role), ...Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) };
  if (HAIR[o.hairColor]) { o.hair = HAIR[o.hairColor]; if (o.mustache) o.mustache = o.hair; if (o.beard) o.beard = o.hair; o.brow = shade(o.hair, -20); }
  const s = (o.h * (o.child ? 0.66 : o.teen ? 0.86 : 1)) / 600, dir = o.dir ?? 1;
  const [skin, skinD] = SKINS[o.skin] || SKINS.light;
  const top = o.top || '#3B6EA5', pants = o.pants || '#2F3E5C', shoes = o.shoes || '#4A3426';
  const wk = o.walk != null ? Math.sin(o.walk) : 0, bob = o.walk != null ? Math.abs(Math.cos(o.walk)) * 8 : 0;
  groundShadow(o.x, o.y, 120 * s, 20 * s, 0.25);
  ctx.save(); ctx.translate(o.x, o.y - bob * s); ctx.scale(s * dir, s);
  if (o.child) { ctx.translate(0, -0); }
  const leg = (x, c, rot) => { ctx.save(); ctx.translate(x + 23, -270); ctx.rotate(rot); solid(R(-23, 0, 46, 250, 12), c, [-23, 0, 46, 250], { round: true }); ctx.restore(); };
  const shoe = (x, c, rot) => { ctx.save(); ctx.translate(x + 23, -270); ctx.rotate(rot); solid(R(-28, 240, 74, 32, [14, 24, 4, 4]), c, [-28, 240, 74, 32]); ctx.restore(); };
  // legs (under robes only the shoes show)
  const legC = o.dress ? skinD : pants;
  if (!o.robe) { leg(-50, shade(legC, -18), wk * 0.35); leg(0, legC, -wk * 0.35); }
  shoe(-50, shade(shoes, -15), o.robe ? 0 : wk * 0.35); shoe(0, shoes, o.robe ? 0 : -wk * 0.35);
  // long hair falls behind the body
  if (o.hairStyle === 'long') solid(R(-86, -690, 120, 300, [60, 30, 40, 60]), o.hair, [-86, -690, 120, 300], { shade: 0.25 });
  // back arm
  ctx.save(); ctx.translate(-54, -470); ctx.rotate(-wk * 0.3); solid(R(-20, 0, 40, 190, 20), shade(top, -25), [-20, 0, 40, 190], { round: true }); ctx.restore();
  // torso / robe / dress
  if (o.robe) {
    const robe = Poly([[-80, -480], [80, -480], [120, -10], [-120, -10]]);
    solid(robe, top, [-120, -480, 240, 470], { round: true, shade: 0.3 });
    fill(R(-10, -480, 20, 470), o.trim || 'rgba(217,178,76,0.9)');
    if (o.fur) { solid(R(-92, -500, 184, 50, 25), '#F4F0E6', [-92, -500, 184, 50]); for (let k = -3; k <= 3; k++) fill(E(k * 26, -475, 4, 7), '#2A2230'); }
  } else {
    const torso = R(-80, -490, 160, 236, [46, 46, 16, 16]);
    solid(torso, top, [-80, -490, 160, 236], { round: true, shade: 0.28 });
    ctx.save(); torso(); ctx.clip();
    if (o.plaid) { for (let k = -80; k < 90; k += 26) fill(R(k, -490, 9, 240), 'rgba(0,0,0,0.18)'); for (let k = -480; k < -250; k += 26) fill(R(-90, k, 180, 8), 'rgba(0,0,0,0.15)'); }
    if (o.armor) { for (let k = -440; k < -260; k += 50) fill(R(-90, k, 180, 6), 'rgba(0,0,0,0.2)'); fill(E(-20, -430, 40, 24), 'rgba(255,255,255,0.3)'); }
    if (o.sailorCollar) { fill(Poly([[-90, -495], [40, -495], [10, -420], [-90, -420]]), '#24365C'); stroke([[-90, -435], [20, -435]], '#FFFFFF', 4); fill(Poly([[10, -430], [40, -400], [0, -400]]), '#C2302B'); }
    if (o.vest) { fill(R(-90, -495, 180, 245), o.vest); fill(R(-90, -390, 180, 18), '#E8ECEF'); fill(R(-90, -330, 180, 18), '#E8ECEF'); fill(R(-20, -495, 40, 245), top); }
    if (o.jacket) { fill(Poly([[8, -490], [44, -490], [12, -400]]), shade(top, 25)); fill(Poly([[8, -490], [-6, -420], [12, -400]]), '#F2F0EA'); for (const by of [-400, -350, -300]) fill(E(34, by, 7, 7), '#D9B24C'); }
    ctx.restore();
    if (o.dress) solid(Poly([[-80, -300], [80, -300], [130, -60], [-130, -60]]), shade(top, -10), [-130, -300, 260, 240], { round: true, shade: 0.3 });
    else solid(R(-80, -268, 160, 20, 4), '#2D2420', [-80, -268, 160, 20]);
  }
  // neck + head
  fill(R(-20, -520, 44, 40), skinD);
  solid(R(-70, -680, 140, 170, [62, 70, 56, 46]), skin, [-70, -680, 140, 170], { round: true, shade: 0.2 });
  if (o.hair && o.hairStyle !== 'bald') fill(R(-74, -686, o.hairStyle === 'long' ? 120 : 90, o.hairStyle === 'long' ? 110 : 80, [56, 40, 10, 30]), o.hair);
  if (o.hairStyle === 'bald' && o.hair) fill(R(-72, -620, 34, 50, [10, 0, 0, 20]), o.hair);
  solid(E(-24, -590, 18, 26), shade(skin, -10), [-42, -616, 36, 52]); fill(E(-24, -590, 8, 13), skinD);
  if (o.beard) solid(() => { ctx.beginPath(); ctx.moveTo(-40, -560); ctx.quadraticCurveTo(-30, -470, 40, -470); ctx.quadraticCurveTo(90, -480, 96, -548); ctx.lineTo(50, -540); ctx.lineTo(-10, -560); ctx.closePath(); }, o.beard, [-40, -560, 136, 90], { shade: 0.2 });
  // nose, eye, brow, mouth
  solid(E(72, -584, 30, 26), skin, [42, -610, 60, 52], { shade: 0.18 }); fill(E(64, -594, 9, 6), 'rgba(255,255,255,0.4)');
  fill(E(46, -560, 22, 12), 'rgba(238,140,120,0.35)');
  const blink = clamp(o.blink || 0);
  ctx.save(); ctx.translate(36, -620); ctx.scale(1, 1 - blink * 0.92);
  fill(E(0, 0, 24, 30), C.white); ctx.lineWidth = 3; ctx.strokeStyle = C.eyeLine; ctx.stroke();
  fill(E(9, 3, 12, 14), '#2A1E1A'); fill(E(13, -3, 4.5, 4.5), C.white);
  if (o.lips) stroke([[-14, -24], [-26, -32]], '#2A1E1A', 4);
  ctx.restore();
  if (o.glasses) { ctx.lineWidth = 5; ctx.strokeStyle = '#2A2230'; ctx.beginPath(); ctx.arc(36, -620, 34, 0, TAU); ctx.stroke(); stroke([[2, -624], [-30, -612]], '#2A2230', 5); }
  stroke([[14, -662], [56, -656]], o.brow || o.hair || '#5A4030', 9);
  if (o.mustache) fill(() => { ctx.beginPath(); ctx.moveTo(30, -560); ctx.quadraticCurveTo(70, -575, 100, -556); ctx.quadraticCurveTo(80, -538, 56, -548); ctx.quadraticCurveTo(40, -536, 22, -548); ctx.closePath(); }, o.mustache);
  const m = clamp(o.talk || 0); fill(E(52, -532, 14, 3 + m * 9), o.lips ? '#B23A3A' : '#7A3B34');
  hat(o);
  // front arm
  const arm = o.arm || 'down';
  ctx.save(); ctx.translate(14, -462); ctx.rotate(arm === 'point' ? -1.25 : arm === 'up' ? -2.35 : arm === 'wave' ? -2.4 + Math.sin((o.t || 0) * 8) * 0.25 : 0.06 + wk * 0.3);
  solid(R(-20, 0, 42, 196, 20), o.robe || o.dress ? top : top, [-20, 0, 42, 196], { round: true }); if (o.plaid) fill(R(-20, 60, 42, 8), 'rgba(0,0,0,0.18)');
  solid(E(2, 206, 22, 24), skin, [-20, 182, 44, 48]);
  ctx.restore();
  ctx.restore();
}
function hat(o) {
  const c = o.hatColor;
  if (o.hat === 'captain') {
    solid(() => { ctx.beginPath(); ctx.moveTo(-82, -664); ctx.quadraticCurveTo(-90, -730, 0, -742); ctx.quadraticCurveTo(96, -742, 90, -680); ctx.closePath(); }, c || C.navy, [-90, -742, 186, 80], { vertical: true });
    fill(R(-78, -682, 160, 26, 6), shade(c || C.navy, -30)); fill(R(-78, -686, 160, 6, 3), '#D9B24C');
    fill(Poly([[30, -660], [118, -646], [112, -636], [30, -650]]), '#111522'); fill(E(40, -712, 14, 11), '#D9B24C');
  } else if (o.hat === 'cap' || o.hat === 'flatcap') {
    const cc = c || '#2F7A3F', flat = o.hat === 'flatcap';
    solid(() => { ctx.beginPath(); ctx.moveTo(-76, -650); ctx.quadraticCurveTo(-72, flat ? -712 : -735, 6, flat ? -716 : -735); ctx.quadraticCurveTo(84, flat ? -712 : -735, 82, -650); ctx.closePath(); }, cc, [-76, -735, 158, 85], { vertical: true });
    fill(Poly([[40, -662], [126, -650], [118, -638], [40, -648]]), shade(cc, -25));
  } else if (o.hat === 'crown') {
    solid(Poly([[-66, -670], [-74, -760], [-36, -712], [0, -778], [36, -712], [74, -760], [66, -670]]), '#D9B24C', [-74, -778, 148, 108], { shade: 0.3 });
    for (const k of [-36, 0, 36]) fill(E(k, -690, 9, 9), '#C2302B');
  } else if (o.hat === 'helmet') {
    solid(() => { ctx.beginPath(); ctx.ellipse(0, -664, 92, 76, 0, Math.PI, TAU); ctx.closePath(); }, c || '#5E6B45', [-92, -740, 184, 76], { vertical: true, shade: 0.35 });
    solid(E(0, -664, 108, 16), shade(c || '#5E6B45', -20), [-108, -680, 216, 32]);
  } else if (o.hat === 'knight') {
    solid(() => { ctx.beginPath(); ctx.ellipse(0, -650, 84, 96, 0, Math.PI, TAU); ctx.lineTo(84, -560); ctx.lineTo(60, -560); ctx.lineTo(60, -640); ctx.lineTo(-84, -640); ctx.closePath(); }, '#A9B0B8', [-84, -746, 168, 186], { round: true, shade: 0.35 });
    solid(() => { ctx.beginPath(); ctx.moveTo(-10, -746); ctx.quadraticCurveTo(-120, -800, -140, -700); ctx.quadraticCurveTo(-80, -740, -10, -720); ctx.closePath(); }, '#C2302B', [-140, -800, 130, 100]);
  } else if (o.hat === 'tophat') {
    solid(R(-56, -800, 112, 130, 6), '#22202A', [-56, -800, 112, 130], { round: true, shade: 0.35 }); fill(R(-56, -700, 112, 18), '#7A2E3A'); solid(E(0, -670, 96, 14), '#22202A', [-96, -684, 192, 28]);
  } else if (o.hat === 'sailor') {
    solid(() => { ctx.beginPath(); ctx.ellipse(0, -680, 82, 34, 0, Math.PI, TAU); ctx.closePath(); }, '#F6F4EE', [-82, -714, 164, 34], { vertical: true }); fill(R(-80, -690, 160, 16, 4), '#24365C');
  }
}
/** lighten (+) or darken (-) a #rrggbb colour by n (0..255) */
export function shade(hex, n) {
  const v = parseInt(hex.slice(1), 16), f = (c) => clamp(c + n, 0, 255) | 0;
  return '#' + [(v >> 16) & 255, (v >> 8) & 255, v & 255].map((c) => f(c).toString(16).padStart(2, '0')).join('');
}

// ---- the hook headline ----
/** a torn paper card with a two-colour headline (line 1 dark, line 2 red), dropping in as p goes 0 -> 1 */
export function headline(l1, l2, y, p, seed = 3) {
  if (p <= 0) return;
  ctx.save(); ctx.translate(540, y + (1 - p) * -520); ctx.rotate(-0.012 + (1 - p) * 0.08);
  const w = 940, h = 360, pts = [];
  for (let i = 0; i <= 24; i++) pts.push([-w / 2 + (w * i) / 24, -h / 2 + (rnd(i + seed) - 0.5) * 22]);
  for (let i = 1; i <= 8; i++) pts.push([w / 2 + (rnd(i + 40 + seed) - 0.5) * 18, -h / 2 + (h * i) / 8]);
  for (let i = 23; i >= 0; i--) pts.push([-w / 2 + (w * i) / 24, h / 2 + (rnd(i + 70 + seed) - 0.5) * 22]);
  for (let i = 7; i >= 1; i--) pts.push([-w / 2 + (rnd(i + 90 + seed) - 0.5) * 18, -h / 2 + (h * i) / 8]);
  solid(Poly(pts), C.cream, [-w / 2, -h / 2, w, h], { vertical: true, shade: 0.12, drop: 1 });
  const fit = (txt, max, size) => { ctx.font = `700 ${size}px Caladea`; while (ctx.measureText(txt).width > max && size > 60) { size -= 4; ctx.font = `700 ${size}px Caladea`; } return size; };
  const draw = (txt, yy, color, size) => { ctx.font = `700 ${size}px Caladea`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.07; ctx.strokeStyle = color; ctx.fillStyle = color; ctx.strokeText(txt, 0, yy); ctx.fillText(txt, 0, yy); };
  const s1 = fit(l1, 840, 150), s2 = fit(l2, 840, 150);
  draw(l1, l2 ? -70 : 0, C.navy, s1); if (l2) draw(l2, 80, C.red, s2);
  ctx.restore();
}
