// Palette, sprites and shared drawing helpers.
const W = 256, H = 240;
const PAL = {
  black: '#000000', white: '#fcfcfc', lgray: '#bcbcbc', gray: '#7c7c7c', dgray: '#3c3c3c',
  red: '#d82800', red2: '#a81000', pink: '#f878f8', mag: '#d800cc', rose: '#f85898',
  orange: '#fca044', orange2: '#e45c10', yellow: '#f8b800', cream: '#fce0a8',
  green: '#00a800', lgreen: '#58d854', dgreen: '#005800', lime: '#b8f818',
  blue: '#0058f8', lblue: '#3cbcfc', dblue: '#0000a8', navy: '#00002c', sky: '#a4e4fc',
  purple: '#6844fc', lpurple: '#9878f8', teal: '#008888', cyan: '#00e8d8',
  brown: '#ac7c00', tan: '#f0d0b0', salmon: '#f87858', fire: '#f83800',
};

function makeSprite(rows, legend) {
  const h = rows.length, w = rows[0].length;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  rows.forEach((r, j) => {
    for (let i = 0; i < w; i++) {
      const col = legend[r[i]];
      if (col) { x.fillStyle = col; x.fillRect(i, j, 1, 1); }
    }
  });
  return c;
}
function silhouette(src, color) {
  const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
  const x = c.getContext('2d');
  x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in';
  x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
  return c;
}
function blit(ctx, spr, x, y) { ctx.drawImage(spr, Math.round(x - spr.width / 2), Math.round(y - spr.height / 2)); }

// ---------- Sprites ----------
const SPR = {};
(() => {
  const P = PAL;
  SPR.chapA = makeSprite([
    '....DDDD....',
    '..DDggggDD..',
    '.DggggGGGGD.',
    '.DgWKGGWKGD.',
    'DGGWKGGWKGGD',
    'DGGGGGGGGGGD',
    'DGGGGGGGGGGD',
    'DGGGDDDDGGGD',
    '.DGGGGGGGGD.',
    '..DDGGGGDD..',
    '...D.DD.D...',
    '..D..D..D...',
  ], { D: P.dgreen, g: P.lime, G: P.lgreen, W: P.white, K: P.black });
  SPR.chapB = makeSprite([
    '....DDDD....',
    '..DDggggDD..',
    '.DggggGGGGD.',
    '.DgWKGGWKGD.',
    'DGGWKGGWKGGD',
    'DGGGGGGGGGGD',
    'DGGGGGGGGGGD',
    'DGGGGDDGGGGD',
    '.DGGGGGGGGD.',
    '..DDGGGGDD..',
    '...D.DD.D...',
    '...D..D..D..',
  ], { D: P.dgreen, g: P.lime, G: P.lgreen, W: P.white, K: P.black });

  const pro = { R: P.rose, r: P.red2, W: P.white, K: P.black, Y: P.cream };
  SPR.protA = makeSprite([
    'r..........r',
    'Rr........rR',
    '.Rr......rR.',
    '..RRRRRRRR..',
    '.RRRRRRRRRR.',
    'RRWKRRRRWKRR',
    'RRRRRRRRRRRR',
    'RrYrYrYrYrRR',
    '.RRRRRRRRRR.',
    '..RRRRRRRR..',
    '.R..R..R..R.',
    'R..R....R..R',
  ], pro);
  SPR.protB = makeSprite([
    '.....rr.....',
    '....rRRr....',
    '...rR..Rr...',
    '..RRRRRRRR..',
    '.RRRRRRRRRR.',
    'RRWKRRRRWKRR',
    'RRRRRRRRRRRR',
    'RRYrYrYrYrRR',
    '.RRRRRRRRRR.',
    '..RRRRRRRR..',
    '..R..RR..R..',
    '.R...RR...R.',
  ], pro);

  SPR.atp = makeSprite([
    '.YYY........',
    'YccYY.O.O.O.',
    'YcYYYOOOOOOO',
    'YYYYY.O.O.O.',
    '.YYY........',
  ], { Y: P.yellow, c: P.cream, O: P.orange2 });

  SPR.ribo = makeSprite([
    '...bbbbb......',
    '..bBBBBBb.....',
    '.bBBTBBBBb....',
    '.bBBBBBBBBb...',
    'bBBBBBBBBBBb..',
    'bBBBBBTBBBBb..',
    '.bBBBBBBBBb...',
    '..bbbbbbbb....',
    '.bBBBBBBBbb...',
    'bBBTBBBBBBBb..',
    'bBBBBBBBBBBb..',
    '.bbbbbbbbbb...',
  ], { b: P.brown, B: P.tan, T: P.orange });

  SPR.glucose = makeSprite([
    '...ooo...',
    '..oWWWo..',
    '.oWsssWo.',
    'oWsWWWsWo',
    'oWsWWWsWo',
    'oWsWWWsWo',
    '.oWsssWo.',
    '..oWWWo..',
    '...ooo...',
  ], { W: P.white, s: P.sky, o: P.dblue });

  SPR.pill = makeSprite([
    '.RRRWWW.',
    'RRRRWWWW',
    'RrRRWWlW',
    '.RRRWWW.',
  ], { R: P.red, r: P.salmon, W: P.white, l: P.lgray });

  SPR.phage = makeSprite([
    '...PPP...',
    '..PpppP..',
    '.PpPPPpP.',
    '.PpPPPpP.',
    '..PpppP..',
    '...PPP...',
    '....G....',
    '....g....',
    '....G....',
    '....g....',
    '..GGGGG..',
    '.G.G.G.G.',
    'G..G.G..G',
  ], { P: P.lpurple, p: P.pink, G: P.lgray, g: P.gray });
})();

// ---------- Motor parts ----------
const PART_ICONS = {
  MS: [
    '...pppp...', '.ppPPPPpp.', '.pPP..PPp.', 'pPP....PPp', 'pP......Pp',
    'pP......Pp', 'pPP....PPp', '.pPP..PPp.', '.ppPPPPpp.', '...pppp...'],
  CRING: [
    '..........', '.bbbbbbbb.', 'bBBBBBBBBb', 'bB.bB.bBBb', 'bB......Bb',
    'bBB....BBb', '.bBB..BBb.', '..bBBBBb..', '...bbbb...', '..........'],
  GATE: [
    '....OO....', '...OOOO...', '..OOOOOO..', '....OO....', '.oooOOooo.',
    '.o..OO..o.', '.o..OO..o.', '.o......o.', '.oooooooo.', '..........'],
  ROD: [
    '...LLLL...', '...LllL...', '...LLLL...', '...LllL...', '...LLLL...',
    '...LllL...', '...LLLL...', '...LllL...', '...LLLL...', '...LllL...'],
  PRING: [
    '..........', '..........', '.tttttttt.', 'tTtTtTtTTt', 'TTT....TTT',
    'tTtTtTtTTt', '.tttttttt.', '..........', '..........', '..........'],
  LRING: [
    '..........', '..........', '.yyyyyyyy.', 'yYYYYYYYYy', 'YYY....YYY',
    'yYYYYYYYYy', '.yyyyyyyy.', '..........', '..........', '..........'],
  HOOK: [
    '..KKKK....', '.KkkkKK...', 'KK....KK..', 'K......K..', '.......KK.',
    '.......kK.', '.......KK.', '.......kK.', '.......KK.', '.......kK.'],
  JUNC: [
    '..........', '..cccccc..', '.cCCCCCCc.', '..cccccc..', '..........',
    '..cccccc..', '.cCCCCCCc.', '..cccccc..', '..........', '..........'],
  CAP: [
    '..........', '...WWWW...', '.WWWWWWWW.', 'WWwWWWWwWW', 'WWWWWWWWWW',
    'w.w.ww.w.w', 'w.w.ww.w.w', '..........', '..........', '..........'],
  FLAG: [
    '..GG......', '.GggG.....', '..GGgG....', '....GgG...', '.....GgG..',
    '....GgG...', '...GgG....', '..GgG.....', '...GG.....', '..........'],
  STATOR: [
    '..........', '.rrr..rrr.', '.RRR..RRR.', '.RrR..RrR.', '.RrR..RrR.',
    '.RrR..RrR.', '.RRR..RRR.', '.RRRRRRRR.', '..RRRRRR..', '..........'],
};
const PART_LEGEND = {
  p: PAL.lpurple, P: PAL.purple, b: PAL.lblue, B: PAL.blue, O: PAL.orange, o: PAL.orange2,
  L: PAL.lgray, l: PAL.gray, t: PAL.cyan, T: PAL.teal, y: PAL.cream, Y: PAL.yellow,
  K: PAL.pink, k: PAL.mag, c: PAL.teal, C: PAL.cyan, W: PAL.white, w: PAL.lgray,
  G: PAL.lgreen, g: PAL.green, R: PAL.fire, r: PAL.salmon,
};
const PARTS = {
  MS:     { name: 'MS RING',      gene: 'FLIF',      color: PAL.lpurple },
  CRING:  { name: 'C RING',       gene: 'FLIG/M/N',  color: PAL.lblue },
  GATE:   { name: 'EXPORT GATE',  gene: 'FLHA/B',    color: PAL.orange },
  ROD:    { name: 'ROD',          gene: 'FLGB/C/F/G',color: PAL.lgray },
  PRING:  { name: 'P RING',       gene: 'FLGI',      color: PAL.cyan },
  LRING:  { name: 'L RING',       gene: 'FLGH',      color: PAL.yellow },
  HOOK:   { name: 'HOOK',         gene: 'FLGE',      color: PAL.pink },
  JUNC:   { name: 'JUNCTION',     gene: 'FLGK/L',    color: PAL.cyan },
  CAP:    { name: 'FILAMENT CAP', gene: 'FLID',      color: PAL.white },
  FLAG:   { name: 'FLAGELLIN',    gene: 'FLIC',      color: PAL.lgreen },
  STATOR: { name: 'STATOR',       gene: 'MOTA/B',    color: PAL.fire },
};
for (const k in PARTS) {
  PARTS[k].icon = makeSprite(PART_ICONS[k], PART_LEGEND);
  PARTS[k].flash = silhouette(PARTS[k].icon, PAL.white);
}

// ---------- Cell envelope layout (assembly view) ----------
const L = {
  hud: 22, extTop: 22, om: 84, omB: 92, pg: 101, pgB: 107, im: 120, imB: 128, cyto: 128,
  cx: 128, dockX: 128, dockY: 160,
};

function drawEnvelope(ctx, t) {
  // exterior
  ctx.fillStyle = '#001a2c'; ctx.fillRect(0, L.extTop, W, L.om - L.extTop);
  // periplasm
  ctx.fillStyle = '#0c1438'; ctx.fillRect(0, L.omB, W, L.im - L.omB);
  // cytoplasm
  ctx.fillStyle = '#10082a'; ctx.fillRect(0, L.cyto, W, H - L.cyto);
  drawBilayer(ctx, L.om, L.omB, PAL.yellow, PAL.brown, t, true);
  drawBilayer(ctx, L.im, L.imB, PAL.salmon, PAL.red2, t, false);
  // peptidoglycan mesh
  for (let x = 0; x < W; x++) {
    const y = L.pg + ((x >> 2) % 2 ? 1 : 0);
    if (x % 8 < 6) { ctx.fillStyle = PAL.teal; ctx.fillRect(x, y, 1, 1); ctx.fillRect(x, y + 4, 1, 1); }
    if (x % 8 === 0) { ctx.fillStyle = PAL.teal; ctx.fillRect(x, L.pg, 1, 6); }
  }
  // labels
  Font.draw(ctx, 'OUTSIDE', 3, L.extTop + 3, '#1f4a66');
  Font.draw(ctx, 'OUTER MEMBRANE', 3, L.om - 9, '#4a4020');
  Font.draw(ctx, 'PERIPLASM', 3, L.omB + 1, '#26306a');
  Font.draw(ctx, 'CYTOPLASM', 3, H - 9, '#2c1c5a');
}
function drawBilayer(ctx, y0, y1, head, tail, t, outer) {
  for (let x = 0; x < W; x += 2) {
    const wob = Math.sin(x * 0.3 + t * 3) > 0.6 ? 1 : 0;
    ctx.fillStyle = head; ctx.fillRect(x, y0 + wob, 2, 2); ctx.fillRect(x, y1 - 2 - wob, 2, 2);
    ctx.fillStyle = tail;
    ctx.fillRect(x, y0 + 2 + wob, 1, (y1 - y0) / 2 - 2);
    ctx.fillRect(x + 1, y0 + (y1 - y0) / 2, 1, (y1 - y0) / 2 - 2 - wob);
  }
  if (outer) { // LPS sugar chains on outer leaflet
    ctx.fillStyle = '#3a3010';
    for (let x = 1; x < W; x += 6) ctx.fillRect(x + (Math.sin(x + t * 2) > 0 ? 1 : 0), y0 - 3, 1, 3);
  }
}

// Water: tiny jittering H2O dots -- the "dynamics" in protein dynamics
function makeWater(n, yMin, yMax) {
  const arr = [];
  for (let i = 0; i < n; i++) arr.push({ x: Math.random() * W, y: yMin + Math.random() * (yMax - yMin), yMin, yMax });
  return arr;
}
function updateWater(arr, temp) {
  for (const w of arr) {
    w.x += (Math.random() - 0.5) * 2.2 * temp; w.y += (Math.random() - 0.5) * 2.2 * temp;
    if (w.x < 0) w.x += W; if (w.x >= W) w.x -= W;
    if (w.y < w.yMin) w.y = w.yMax - 1; if (w.y >= w.yMax) w.y = w.yMin;
  }
}
function drawWater(ctx, arr, color = '#2c4c8c') {
  ctx.fillStyle = color;
  for (const w of arr) {
    const x = w.x | 0, y = w.y | 0;
    ctx.fillRect(x, y, 1, 1); ctx.fillRect(x - 1, y + 1, 1, 1); ctx.fillRect(x + 1, y + 1, 1, 1);
  }
}

// ---------- Assembled motor (cross-section) ----------
// built: Set of part keys; flags: flagellin count; spin: rotation phase; ghost: next part key
function drawMotor(ctx, built, flags, spin, ghost, blinkOn) {
  const cx = L.cx;
  const has = k => built.has(k);
  const draw = (k, fn) => {
    if (has(k)) fn(1);
    else if (ghost === k && blinkOn) { ctx.globalAlpha = 0.35; fn(0); ctx.globalAlpha = 1; }
  };
  const stripes = (x0, y0, w, h, c1, c2) => {
    for (let x = 0; x < w; x++) {
      ctx.fillStyle = ((x + Math.floor(spin * 6)) % 6 < 3) ? c1 : c2;
      ctx.fillRect(x0 + x, y0, 1, h);
    }
  };
  // STATORS (behind)
  if (has('STATOR') || ghost === 'STATOR') {
    const n = built.statorCount || 0;
    [[cx - 27, 0], [cx + 22, 1]].forEach(([x, i]) => {
      const on = i < n;
      if (!on && !(ghost === 'STATOR' && blinkOn && i === n)) return;
      if (!on) ctx.globalAlpha = 0.35;
      ctx.fillStyle = PAL.fire; ctx.fillRect(x, L.pg, 5, L.imB - L.pg + 4);
      ctx.fillStyle = PAL.salmon; ctx.fillRect(x + 1, L.pg + 1, 1, L.imB - L.pg + 2);
      ctx.globalAlpha = 1;
    });
  }
  draw('CRING', () => {
    for (let y = 0; y < 18; y++) {
      const w = Math.round(42 - y * 0.7);
      const x0 = cx - (w >> 1);
      if (y < 3 || y > 14) { stripes(x0, L.imB + y, w, 1, PAL.blue, PAL.lblue); }
      else { stripes(x0, L.imB + y, 5, 1, PAL.blue, PAL.lblue); stripes(x0 + w - 5, L.imB + y, 5, 1, PAL.blue, PAL.lblue); }
    }
  });
  draw('GATE', () => {
    ctx.fillStyle = PAL.orange2; ctx.fillRect(cx - 6, L.imB + 2, 12, 12);
    ctx.fillStyle = PAL.orange; ctx.fillRect(cx - 4, L.imB + 3, 8, 10);
    ctx.fillStyle = PAL.orange2; ctx.fillRect(cx - 1, L.imB + 3, 2, 10);
  });
  draw('MS', () => {
    stripes(cx - 19, L.im - 1, 38, 4, PAL.purple, PAL.lpurple);
    stripes(cx - 15, L.im + 3, 30, 6, PAL.lpurple, PAL.purple);
  });
  draw('ROD', () => {
    for (let y = L.omB; y < L.im - 1; y++) {
      ctx.fillStyle = (y + Math.floor(spin * 4)) % 4 < 2 ? PAL.lgray : PAL.gray;
      ctx.fillRect(cx - 3, y, 6, 1);
    }
  });
  draw('PRING', () => { stripes(cx - 13, L.pg - 1, 26, 8, PAL.teal, PAL.cyan); ctx.fillStyle = '#0c1438'; ctx.fillRect(cx - 4, L.pg + 1, 8, 4); });
  draw('LRING', () => { stripes(cx - 13, L.om, 26, 8, PAL.yellow, PAL.cream); ctx.fillStyle = '#0c1438'; ctx.fillRect(cx - 4, L.om + 2, 8, 4); });
  if (has('ROD')) { ctx.fillStyle = PAL.lgray; ctx.fillRect(cx - 3, L.om, 6, 8); }

  // HOOK: a curve from the outer membrane up and to the right
  const hookPts = [];
  for (let i = 0; i <= 20; i++) {
    const s = i / 20;
    const x = (1 - s) * (1 - s) * cx + 2 * (1 - s) * s * cx + s * s * (cx + 12);
    const y = (1 - s) * (1 - s) * L.om + 2 * (1 - s) * s * (L.om - 16) + s * s * (L.om - 20);
    hookPts.push([x, y]);
  }
  draw('HOOK', () => {
    hookPts.forEach(([x, y], i) => {
      ctx.fillStyle = (i + Math.floor(spin * 5)) % 4 < 2 ? PAL.pink : PAL.mag;
      ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 5, 4);
    });
  });
  const hx = cx + 12, hy = L.om - 20;
  draw('JUNC', () => {
    ctx.fillStyle = PAL.cyan; ctx.fillRect(hx, hy - 3, 6, 6);
    ctx.fillStyle = PAL.teal; ctx.fillRect(hx + 2, hy - 3, 1, 6);
  });
  // FILAMENT: a waving helix that grows one flagellin at a time
  const ang = -0.42, dx = Math.cos(ang), dy = Math.sin(ang);
  const nx = -dy, ny = dx;
  const sx = hx + 6, sy = hy;
  const len = flags * 12;
  const shown = ghost === 'FLAG' && blinkOn ? len + 12 : len;
  for (let d = 0; d < shown; d += 1) {
    const a = Math.sin(d * 0.5 - spin * 8) * 3;
    const x = sx + dx * d + nx * a, y = sy + dy * d + ny * a;
    if (d >= len) ctx.globalAlpha = 0.35;
    ctx.fillStyle = ((d / 12) | 0) % 2 ? PAL.green : PAL.lgreen;
    ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
    ctx.globalAlpha = 1;
  }
  // CAP sits at the growing tip
  const tipX = sx + dx * len, tipY = sy + dy * len;
  draw('CAP', () => {
    ctx.fillStyle = PAL.white; ctx.fillRect(Math.round(tipX) - 2, Math.round(tipY) - 3, 5, 6);
    ctx.fillStyle = PAL.lgray; ctx.fillRect(Math.round(tipX) + 2, Math.round(tipY) - 3, 1, 6);
  });
  return { tipX, tipY };
}

// Gauss-ish random for Brownian kicks
function randn() { return (Math.random() + Math.random() + Math.random() - 1.5) * 1.15; }
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function dist2(a, b) { const dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy; }
