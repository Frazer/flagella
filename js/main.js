// Game loop, input, scene management.
const cv = document.getElementById('screen');
const ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;

function fit() {
  const s = Math.max(1, Math.floor(Math.min(innerWidth / W, innerHeight / H)));
  cv.style.width = W * s + 'px'; cv.style.height = H * s + 'px';
}
addEventListener('resize', fit); fit();

const Input = { down: {}, pressed: {} };
const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  Space: 'a', KeyZ: 'a', KeyX: 'a', KeyJ: 'a',
  Enter: 'start', NumpadEnter: 'start', KeyP: 'pause', Escape: 'pause', KeyM: 'mute', KeyV: 'video',
};
addEventListener('keydown', e => {
  const k = KEYMAP[e.code];
  Sfx.unlock();
  // hidden dev menu: ` to open, 1-5 to jump
  if (e.code === 'Backquote' || e.key === '`' || e.key === '~') { e.preventDefault(); Dev.toggle(); return; }
  if (Dev.open) {
    e.preventDefault();
    const n = /^[1-5]$/.test(e.key) ? +e.key : (/^(Digit|Numpad)[1-5]$/.test(e.code) ? +e.code.slice(-1) : 0);
    if (n) Dev.pick(n);
    else if (e.code === 'Escape' || e.key === 'Escape') Dev.toggle();
    return;
  }
  if (!k) return;
  e.preventDefault();
  if (!Input.down[k]) Input.pressed[k] = true;
  Input.down[k] = true;
});
addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) Input.down[k] = false; });
addEventListener('blur', () => { Input.down = {}; if (Game.scene === Assembly || Game.scene === Swim) Game.paused = true; });
cv.addEventListener('pointerdown', () => { Sfx.unlock(); Input.pressed.start = true; });

const Game = {
  scene: null, paused: false, score: 0, level: 1, atp: 100,
  hi: (() => { try { return parseInt(localStorage.getItem('flagella_hi')) || 0; } catch (e) { return 0; } })(),
  newGame() { this.score = 0; this.level = 1; this.atp = 100; },
  setScene(s, arg) { this.scene = s; this.paused = false; s.enter(arg); },
};

let last = performance.now(), muteMsg = 0;
function frame(now) {
  requestAnimationFrame(frame);   // schedule first, so one bad frame can never freeze the game
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  try { step(dt); } catch (err) { console.error(err); }
  Input.pressed = {};
}

function step(dt) {
  if (Dev.open) { Game.scene.draw(ctx); Dev.draw(ctx); return; }
  if (Input.pressed.mute) { const m = Sfx.toggleMute(); muteMsg = 1.2; Game.muteText = m ? 'MUTED' : 'SOUND ON'; }
  const playing = Game.scene === Assembly || Game.scene === Swim;
  if (Input.pressed.pause && playing) { Game.paused = !Game.paused; Sfx.fx.select(); }
  if (!Game.paused) Game.scene.update(dt);
  Game.scene.draw(ctx);
  if (Game.paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H);
    Font.center(ctx, 'PAUSED', 128, 104, PAL.white, 2, PAL.dgray);
    Font.center(ctx, 'P TO RESUME', 128, 126, PAL.lgray);
  }
  if (muteMsg > 0) { muteMsg -= dt; Font.draw(ctx, Game.muteText, W - Font.width(Game.muteText) - 3, H - 10, PAL.white, 1, PAL.black); }
}

Game.setScene(Title);
requestAnimationFrame(frame);

// Debug hooks for testing
window.__game = { Game, Assembly, Swim, Spinup, Tally, Title, GameOver, Prologue, Input, Dev };
