// Untold Files: turns story.json into shots. Every line shows a real picture (Wikipedia / Wikimedia Commons, found
// by scripts/images.ts and saved by scripts/make.ts as line.scene = { type: 'photo', src }), edge to edge over a
// blurred copy of itself, with a slow push in or drift toward one side, and a hard cut to the next. A line without
// a picture keeps the previous one on screen.
//
// Around the pictures: the headline card over the first line (the frame people decide on) and an end card that
// asks for the follow. script.file is the running file number (set by scripts/make.ts).
import { ctx, W, H, clamp, seg, eo, eob, eio } from './core/lib.js';
import { L, Le, T } from './core/timing.js';
import * as K from './core/kit.js';
import * as V from './vec.js';
const { P, cut, P_rr } = K;

export const BRAND = { name: 'UNTOLD FILES', handle: '@unt.oldfiles', seal: 'U', sub: 'A new story every day' };

// Where the camera drifts toward, in turn: straight in, then toward the left, then the right.
const DRIFT = [[540, 980], [330, 980], [750, 980]];
const PIC_Y = 980; // centre of the picture: under the headline card, above the captions

/** the picture: a dark blurred copy filling the frame, then the picture itself across the full width */
function photo(img) {
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const cover = Math.max(W / iw, H / ih);
  ctx.save(); ctx.filter = 'blur(36px) brightness(0.5) saturate(1.1)';
  ctx.drawImage(img, (W - iw * cover) / 2, (H - ih * cover) / 2, iw * cover, ih * cover);
  ctx.restore();
  // full width, 900-1320 high: a tall picture is cropped top and bottom (faces sit near the top, so favour it),
  // a wide one loses its sides (the left/right drift then pans across it)
  const h = clamp(W * ih / iw, 900, 1320);
  let sx = 0, sy = 0, sw = iw, sh = ih;
  if (iw / ih > W / h) { sw = ih * W / h; sx = (iw - sw) / 2; }
  else { sh = iw * h / W; sy = (ih - sh) * 0.35; }
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 20;
  ctx.drawImage(img, sx, sy, sw, sh, 0, PIC_Y - h / 2, W, h);
  ctx.restore();
}

export function buildShots(script) {
  const S = [], CUES = [], cue = (t, type, o = {}) => CUES.push({ t: +Math.max(0, t).toFixed(3), type, ...o });
  const lines = script.lines;
  let n = 0;
  lines.forEach((ln, i) => {
    const sc = ln.scene; if (!sc || sc.type !== 'photo') return;
    const img = (script._img || {})[sc.src]; if (!img) return;
    const st = i === 0 ? 0 : L(i) - 0.08;
    // a still picture with a slow camera: no punch-in on the cut, just a clean cut
    S.push({ id: `S${String(S.length + 1).padStart(2, '0')}`, at: st, cam: DRIFT[n++ % DRIFT.length], zoom: 0.07, punch: 0, note: `photo ${sc.src}: ${ln.text.slice(0, 50)}`, draw() { photo(img); } });
    if (i > 0) cue(st, 'whoosh', { gain: 0.25 });
  });
  if (!S.length) throw new Error('no pictures: every story needs at least the first line\'s picture');
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

function stamp(text, x, y, rot, p, size) {
  if (p <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); const k = 1 + (1 - eo(p)) * 1.4; ctx.scale(k, k); ctx.globalAlpha = 0.9 * clamp(p * 3);
  ctx.font = `900 ${size}px Inter`; ctx.letterSpacing = '6px'; const w = ctx.measureText(text).width + size * 0.9, h = size * 1.6;
  ctx.strokeStyle = P.crimson; ctx.lineWidth = size * 0.14; ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = P.crimson; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 3, size * 0.06);
  ctx.restore(); ctx.letterSpacing = '0px';
}
