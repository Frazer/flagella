// Title, motor spin-up cutscene, swim tally, game over.
const FACTS = [
  'THE FLAGELLAR MOTOR CAN SPIN AROUND 300 TIMES A SECOND - ABOUT 18000 RPM.',
  'IT RUNS ON PROTONS, NOT ATP. H+ IONS FLOWING INTO THE CELL TURN THE ROTOR.',
  'THE MOTOR IS BUILT FROM ABOUT 25 DIFFERENT PROTEINS AND THOUSANDS OF COPIES.',
  'FLAGELLIN TRAVELS UP THE HOLLOW CORE OF THE FILAMENT AND IS ADDED AT THE TIP.',
  'THE FILAMENT CAN BE 10 MICRONS LONG - SEVERAL TIMES LONGER THAN THE CELL.',
  'CCW ROTATION BUNDLES THE FLAGELLA (RUN). CW FLIES THEM APART (TUMBLE).',
  'STATORS PLUG IN AND OUT OF THE MOTOR DEPENDING ON THE LOAD IT FEELS.',
  'IF THE MOTOR STOPS, THE CELL COASTS LESS THAN THE WIDTH OF AN ATOM.',
  'AT THIS SCALE WATER FEELS THICKER THAN HONEY. INERTIA IS MEANINGLESS.',
  'THE MOTOR CAN REVERSE DIRECTION IN A FEW MILLISECONDS.',
  'THE C RING SWITCH IS FLIPPED BY CHEY-P, A CHEMOTAXIS SIGNAL PROTEIN.',
  'EVERY PROTEIN IN THE CELL IS BEING KICKED BY WATER TRILLIONS OF TIMES A SECOND.',
];
const pickFact = () => FACTS[(Math.random() * FACTS.length) | 0];
function drawFact(ctx, fact, y) {
  Font.center(ctx, 'DID YOU KNOW?', 128, y, PAL.yellow);
  Font.wrap(fact, 38).forEach((ln, i) => Font.center(ctx, ln, 128, y + 11 + i * 9, PAL.lgray));
}

// Protons trickling down through the stators -> torque
function makeProtonSystem() {
  return {
    list: [], t: 0,
    update(dt, rate, sound) {
      this.t += dt * rate;
      while (this.t > 0) {
        this.t -= 0.08;
        const side = Math.random() < 0.5 ? L.cx - 25 : L.cx + 24;
        this.list.push({ x: side + (Math.random() * 4 - 2) * 3, y: L.omB + 2, tx: side, phase: 0 });
      }
      for (let i = this.list.length - 1; i >= 0; i--) {
        const p = this.list[i];
        if (p.y < L.pg) { p.y += 30 * dt; p.x += (p.tx - p.x) * dt * 3; }
        else { p.x += (p.tx - p.x) * dt * 10; p.y += 55 * dt; }
        if (p.y > L.imB + 4 && !p.done) { p.done = true; if (sound && Math.random() < 0.5) Sfx.fx.proton(); }
        if (p.y > L.imB + 16) this.list.splice(i, 1);
      }
    },
    draw(ctx) {
      ctx.fillStyle = PAL.fire;
      for (const p of this.list) { const x = p.x | 0, y = p.y | 0; ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x, y - 1, 1, 3); }
    },
  };
}

const Title = (() => {
  const S = {};
  const FULL = new Set(['MS', 'CRING', 'GATE', 'ROD', 'PRING', 'LRING', 'HOOK', 'JUNC', 'CAP', 'STATOR']);
  FULL.statorCount = 2;
  function enter() {
    S.t = 0; S.spin = 0; S.protons = makeProtonSystem();
    S.water = makeWater(60, L.cyto, H);
    S.fact = pickFact();
    Sfx.motorOff();
    Sfx.playSong('title');
  }
  function update(dt) {
    S.t += dt; S.spin += dt * 1.2;
    S.protons.update(dt, 0.6, false);
    updateWater(S.water, 1);
    if (Input.pressed.video) { Sfx.fx.select(); Game.setScene(Prologue); return; }
    if (Input.pressed.start || Input.pressed.a) {
      if (!Game.sawPrologue) { Sfx.fx.select(); Game.setScene(Prologue); return; }
      Sfx.fx.start();
      Game.newGame();
      Game.setScene(Assembly);
    }
  }
  function draw(ctx) {
    ctx.fillStyle = PAL.black; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(0, 24);
    drawEnvelope(ctx, S.t);
    drawWater(ctx, S.water);
    drawMotor(ctx, FULL, 5, S.spin, null, false);
    S.protons.draw(ctx);
    ctx.restore();
    ctx.fillStyle = PAL.black; ctx.fillRect(0, 0, W, 46);
    const title = 'FLAGELLA';
    const cols = [PAL.lgreen, PAL.lime, PAL.yellow, PAL.orange, PAL.rose, PAL.lpurple, PAL.lblue, PAL.cyan];
    const x0 = 128 - Font.width(title, 3) / 2;
    for (let i = 0; i < title.length; i++) {
      const bob = Math.round(Math.sin(S.t * 4 + i * 0.7) * 1.5);
      Font.draw(ctx, title[i], x0 + i * 18, 6 + bob, cols[(i + (S.t * 6 | 0)) % cols.length], 3, PAL.dblue);
    }
    Font.center(ctx, 'A PROTEIN DYNAMICS ADVENTURE', 128, 34, PAL.lgray);
    ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(18, 172, 220, 62);
    if ((S.t * 2 | 0) % 2 === 0) Font.center(ctx, 'PRESS ENTER', 128, 176, PAL.white, 1, PAL.dgray);
    Font.center(ctx, 'BUILD THE MOTOR. THEN SWIM.', 128, 188, PAL.lgreen);
    Font.center(ctx, 'USE THE ARROW KEYS', 128, 200, PAL.lgray);
    Font.center(ctx, 'P PAUSE  M MUTE  V VIDEO', 128, 209, PAL.gray);
    Font.center(ctx, 'HI ' + String(Game.hi).padStart(6, '0'), 128, 222, PAL.yellow);
  }
  return { enter, update, draw };
})();

const Spinup = (() => {
  const S = {};
  function enter(arg) {
    S.t = 0; S.spin = 0; S.rate = 0; S.built = arg.built; S.flags = arg.flags;
    S.protons = makeProtonSystem();
    S.water = makeWater(60, L.cyto, H).concat(makeWater(30, L.extTop, L.om - 3));
    S.bonus = Math.round(Game.atp) * 10 * Game.level; S.shown = 0;
    S.fact = pickFact(); S.announced = false;
    Sfx.stopSong();
    Sfx.motorOn();
  }
  function update(dt) {
    S.t += dt;
    S.rate = Math.min(1.6, S.rate + dt * 0.45);
    S.spin += S.rate * dt;
    S.protons.update(dt, 0.4 + S.rate * 2, true);
    Sfx.motorSet(30 + S.rate * 70, 0.05 + S.rate * 0.05);
    updateWater(S.water, 1);
    if (S.t > 3 && !S.announced) { S.announced = true; Sfx.fx.fanfare(); }
    if (S.t > 3.5 && S.shown < S.bonus) {
      const step = Math.max(10, Math.ceil(S.bonus * dt * 1.5));
      S.shown = Math.min(S.bonus, S.shown + step);
      if ((S.t * 30 | 0) % 2) Sfx.fx.tick();
    }
    if (S.t > 4 && (Input.pressed.start || Input.pressed.a)) {
      Game.score += S.bonus;
      Sfx.fx.select();
      Game.setScene(Swim);
    }
  }
  function draw(ctx) {
    drawEnvelope(ctx, S.t);
    drawWater(ctx, S.water);
    drawMotor(ctx, S.built, S.flags, S.spin, null, false);
    S.protons.draw(ctx);
    ctx.fillStyle = PAL.black; ctx.fillRect(0, 0, W, L.hud);
    Font.center(ctx, 'PROTON MOTIVE FORCE ENGAGED', 128, 3, PAL.fire);
    const rpm = Math.round(S.rate / 1.6 * 18000);
    Font.center(ctx, String(rpm).padStart(5, ' ') + ' RPM', 128, 13, PAL.white);
    if (S.t > 3) {
      ctx.fillStyle = 'rgba(0,0,0,0.78)'; ctx.fillRect(10, 150, 236, 86);
      const c = (S.t * 8 | 0) % 2 ? PAL.lgreen : PAL.lime;
      Font.center(ctx, 'MOTOR ONLINE!', 128, 154, c, 2, PAL.dgreen);
      Font.center(ctx, 'ATP BONUS ' + S.shown, 128, 173, PAL.yellow);
      drawFact(ctx, S.fact, 185);
      if (S.t > 4 && (S.t * 2 | 0) % 2 === 0) Font.center(ctx, 'PRESS ENTER TO SWIM', 128, 226, PAL.white);
    }
  }
  return { enter, update, draw };
})();

const Tally = (() => {
  const S = {};
  function enter(arg) {
    S.t = 0; S.got = arg.glucose; S.goal = arg.goal; S.bonus = arg.bonus;
    S.atp = Math.min(100, 45 + S.got * 5);
    S.fact = pickFact();
    Sfx.stopSong(); Sfx.fx.fanfare();
  }
  function update(dt) {
    S.t += dt;
    if (S.t > 1.5 && (Input.pressed.start || Input.pressed.a)) {
      Game.atp = S.atp; Game.level++;
      Sfx.fx.start();
      Game.setScene(Assembly);
    }
  }
  function draw(ctx) {
    ctx.fillStyle = '#041020'; ctx.fillRect(0, 0, W, H);
    Font.center(ctx, 'LEVEL ' + Game.level + ' CLEAR', 128, 20, PAL.lgreen, 2, PAL.dgreen);
    blit(ctx, SPR.glucose, 92, 62);
    Font.draw(ctx, 'GLUCOSE EATEN ' + S.got + '/' + S.goal, 102, 59, PAL.sky);
    if (S.bonus) Font.center(ctx, 'GOAL REACHED! TIME BONUS +' + S.bonus, 128, 44, PAL.yellow);
    if (S.t > 0.5) Font.center(ctx, 'GLYCOLYSIS + RESPIRATION...', 128, 78, PAL.gray);
    if (S.t > 1.0) {
      blit(ctx, SPR.atp, 82, 98);
      Font.draw(ctx, 'NEXT BUILD ATP: ' + S.atp, 92, 95, PAL.yellow);
      Font.center(ctx, 'SCORE ' + String(Game.score).padStart(6, '0'), 128, 116, PAL.white);
    }
    Font.center(ctx, 'NEXT: HOTTER CELL. MORE NOISE.', 128, 136, PAL.orange);
    Font.center(ctx, 'LONGER FILAMENT. MORE PROTEASES.', 128, 145, PAL.orange);
    drawFact(ctx, S.fact, 166);
    if (S.t > 1.5 && (S.t * 2 | 0) % 2 === 0) Font.center(ctx, 'PRESS ENTER', 128, 222, PAL.white);
  }
  return { enter, update, draw };
})();

const GameOver = (() => {
  const S = {};
  function enter(reason) {
    S.t = 0; S.reason = reason || 'GAME OVER';
    S.newHi = Game.score > Game.hi;
    if (S.newHi) { Game.hi = Game.score; try { localStorage.setItem('flagella_hi', Game.hi); } catch (e) {} }
    S.fact = pickFact();
    Sfx.stopSong(); Sfx.motorOff(); Sfx.fx.gameover();
  }
  function update(dt) {
    S.t += dt;
    if (S.t > 2 && (Input.pressed.start || Input.pressed.a)) Game.setScene(Title);
  }
  function draw(ctx) {
    ctx.fillStyle = '#100008'; ctx.fillRect(0, 0, W, H);
    Font.center(ctx, S.reason, 128, 40, PAL.red, 2, PAL.red2);
    Font.center(ctx, 'THE CELL RAN OUT OF ENERGY', 128, 66, PAL.lgray);
    Font.center(ctx, 'SCORE ' + String(Game.score).padStart(6, '0'), 128, 90, PAL.white);
    Font.center(ctx, 'REACHED LEVEL ' + Game.level, 128, 101, PAL.lblue);
    if (S.newHi && (S.t * 4 | 0) % 2) Font.center(ctx, 'NEW HIGH SCORE!', 128, 114, PAL.yellow);
    drawFact(ctx, S.fact, 140);
    if (S.t > 2 && (S.t * 2 | 0) % 2 === 0) Font.center(ctx, 'PRESS ENTER', 128, 210, PAL.white);
  }
  return { enter, update, draw };
})();
