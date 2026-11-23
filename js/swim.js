// STAGE 2: the motor works! Swim by run-and-tumble chemotaxis.
// CCW rotation = flagella bundle = RUN (you always swim forward).
// CW rotation = bundle flies apart = TUMBLE (you stop and spin to a new heading).
const Swim = (() => {
  const S = {};
  const TOP = L.hud + 2;

  function enter() {
    const lv = Game.level;
    S.t = 0; S.time = 40; S.got = 0; S.inv = 0; S.shake = 0;
    S.goal = 8 + lv * 2;
    S.intro = lv === 1; S.introT = 0; S.banner = lv === 1 ? 0 : 2.5;
    S.cell = { x: 128, y: 160, h: -Math.PI / 2, ph: 0, tumbling: false, tdir: 1 };
    S.speed = 50 + lv * 5;
    S.food = { x: 40 + Math.random() * 176, y: 60 + Math.random() * 60 };
    S.glu = []; S.pills = []; S.phages = []; S.texts = []; S.sparks = [];
    for (let i = 0; i < 10; i++) S.glu.push(newGlucose());
    for (let i = 0; i < 1 + lv; i++) S.pills.push(newPill());
    for (let i = 0; i < Math.max(0, lv - 1); i++) S.phages.push({ x: Math.random() < 0.5 ? 10 : 246, y: TOP + 20 + Math.random() * 180, ph: Math.random() * 6 });
    S.dots = [];
    for (let i = 0; i < 900; i++) S.dots.push({ x: Math.random() * W, y: TOP + Math.random() * (H - TOP), th: Math.random() });
    S.water = makeWater(50, TOP, H);
    Sfx.playSong('swim');
    Sfx.motorOn();
  }

  function newGlucose() {
    return { x: clamp(S.food.x + randn() * 32, 8, W - 8), y: clamp(S.food.y + randn() * 32, TOP + 8, H - 8), vx: 0, vy: 0 };
  }
  function newPill() {
    const a = Math.random() * Math.PI * 2, v = 16 + Math.random() * 12 + Game.level * 3;
    let x, y;
    do { x = 10 + Math.random() * 236; y = TOP + 10 + Math.random() * 190; } while (Math.hypot(x - 128, y - 160) < 50);
    return { x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v };
  }
  const conc = (x, y) => Math.exp(-((x - S.food.x) ** 2 + (y - S.food.y) ** 2) / (2 * 70 * 70));
  function say(text, x, y, color = PAL.white, life = 1) { S.texts.push({ text, x, y, t: life, color }); }

  function finish() {
    const bonus = S.got >= S.goal ? Math.ceil(Math.max(0, S.time)) * 20 * Game.level : 0;
    Game.score += bonus;
    Sfx.motorOff();
    Game.setScene(Tally, { glucose: S.got, goal: S.goal, bonus });
  }

  function update(dt) {
    if (S.intro) {
      S.t += dt; S.introT += dt; S.cell.ph += dt * 40;
      Sfx.motorSet(92, 0.04);
      if (S.introT > 0.6 && (Input.pressed.start || Input.pressed.a)) { S.intro = false; Sfx.fx.select(); }
      return;
    }
    S.t += dt;
    if (S.banner > 0) S.banner -= dt;
    S.time -= dt;
    if (S.time <= 0) { finish(); return; }
    updateWater(S.water, 1);
    const c = S.cell, lv = Game.level;

    // LEFT/RIGHT = tumble and turn that way.  SPACE = tumble in a random direction (the real thing!)
    const turn = (Input.down.left ? -1 : 0) + (Input.down.right ? 1 : 0);
    const wasT = c.tumbling;
    c.tumbling = turn !== 0 || !!Input.down.a;
    if (c.tumbling && !wasT) { Sfx.fx.tumble(); c.tdir = Math.random() < 0.5 ? -1 : 1; }
    if (c.tumbling) {
      if (turn) c.h += turn * (3.4 + randn() * 1.2) * dt;
      else c.h += c.tdir * (4.2 + randn() * 2.5) * dt;
      c.ph += dt * 30;
      c.x += Math.cos(c.h) * 6 * dt; c.y += Math.sin(c.h) * 6 * dt;
      Sfx.motorSet(55 + Math.sin(S.t * 40) * 8, 0.1);
    } else {
      c.h += randn() * 0.9 * Math.sqrt(dt);  // rotational Brownian drift: you never swim perfectly straight
      c.ph += dt * 40;
      c.x += Math.cos(c.h) * S.speed * dt; c.y += Math.sin(c.h) * S.speed * dt;
      Sfx.motorSet(92, 0.08);
    }
    if (c.x < 8 || c.x > W - 8) { c.h = Math.PI - c.h; c.x = clamp(c.x, 8, W - 8); }
    if (c.y < TOP + 6 || c.y > H - 6) { c.h = -c.h; c.y = clamp(c.y, TOP + 6, H - 6); }
    if (S.inv > 0) S.inv -= dt;

    for (const g of S.glu) {
      g.vx += randn() * 3; g.vy += randn() * 3; g.vx *= 0.9; g.vy *= 0.9;
      g.x = clamp(g.x + g.vx * dt, 6, W - 6); g.y = clamp(g.y + g.vy * dt, TOP + 6, H - 6);
    }
    for (let i = S.glu.length - 1; i >= 0; i--) {
      const g = S.glu[i];
      if (Math.hypot(g.x - c.x, g.y - c.y) < 10) {
        S.glu.splice(i, 1); S.got++; Game.score += 50 * lv; Sfx.fx.eat();
        say('+' + 50 * lv, g.x - 8, g.y - 10, PAL.sky, 0.7);
        for (let k = 0; k < 6; k++) S.sparks.push({ x: g.x, y: g.y, vx: randn() * 50, vy: randn() * 50, t: 0.4, color: PAL.sky });
        if (S.got >= S.goal) { Sfx.fx.fanfare(); finish(); return; }
        if (S.got % 6 === 0) {
          S.food = { x: 30 + Math.random() * 196, y: TOP + 30 + Math.random() * 150 };
          say('THE FOOD MOVED! FOLLOW THE ARROW', 128 - 96, 120, PAL.sky, 1.6);
          Sfx.fx.select();
        }
        S.glu.push(newGlucose());
      }
    }
    for (const p of S.pills) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < 6 || p.x > W - 6) p.vx *= -1;
      if (p.y < TOP + 4 || p.y > H - 4) p.vy *= -1;
      if (S.inv <= 0 && Math.hypot(p.x - c.x, p.y - c.y) < 8) {
        S.inv = 1.2; S.time -= 4; S.shake = 0.25; Sfx.fx.hurt();
        say('ANTIBIOTIC! -4 SEC', c.x - 50, c.y - 16, PAL.red);
      }
    }
    for (const f of S.phages) {
      f.ph += dt;
      const dx = c.x - f.x, dy = c.y - f.y, d = Math.hypot(dx, dy) || 1;
      const v = 11 + lv * 2;
      f.x += (dx / d) * v * dt + Math.sin(f.ph * 2) * 0.3; f.y += (dy / d) * v * dt;
      if (S.inv <= 0 && d < 9) {
        S.inv = 1.5; S.time -= 6; S.shake = 0.4; Sfx.fx.chomp();
        say('PHAGE ATTACK! -6 SEC', c.x - 56, c.y - 16, PAL.lpurple);
        f.x = f.x < 128 ? W - 10 : 10; f.y = TOP + 20 + Math.random() * 180;
      }
    }
    for (let i = S.sparks.length - 1; i >= 0; i--) {
      const p = S.sparks[i]; p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.t <= 0) S.sparks.splice(i, 1);
    }
    for (let i = S.texts.length - 1; i >= 0; i--) { const t = S.texts[i]; t.t -= dt; t.y -= 10 * dt; if (t.t <= 0) S.texts.splice(i, 1); }
    if (S.shake > 0) S.shake -= dt;
  }

  function arrow(ctx, x, y, ang, color) {
    const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
    ctx.fillStyle = color;
    for (let t = 0; t <= 4; t++) {
      const w = t * 0.9;
      for (let s = -w; s <= w; s += 0.5) ctx.fillRect(Math.round(x + dx * (3 - t) + nx * s), Math.round(y + dy * (3 - t) + ny * s), 1, 1);
    }
  }

  function drawCell(ctx, c) {
    const dx = Math.cos(c.h), dy = Math.sin(c.h), nx = -dy, ny = dx;
    ctx.fillStyle = PAL.lgreen;
    if (!c.tumbling) {
      for (let s = 0; s < 20; s++) {
        const a = Math.sin(s * 0.55 - c.ph) * 2.5 * Math.min(1, s / 4);
        ctx.fillRect(Math.round(c.x - dx * (7 + s) + nx * a), Math.round(c.y - dy * (7 + s) + ny * a), 1, 1);
      }
    } else {
      for (let k = -1; k <= 1; k++) {
        const ang = c.h + Math.PI + k * 0.9 + Math.sin(c.ph * 0.3 + k) * 0.3;
        const fx = Math.cos(ang), fy = Math.sin(ang);
        for (let s = 0; s < 13; s++) {
          const a = Math.sin(s * 0.7 - c.ph) * 2;
          ctx.fillRect(Math.round(c.x + fx * (4 + s) - fy * a), Math.round(c.y + fy * (4 + s) + fx * a), 1, 1);
        }
      }
    }
    const flash = S.inv > 0 && (S.t * 14 | 0) % 2;
    const layers = [[PAL.dgreen, 4], [flash ? PAL.white : PAL.green, 3], [flash ? PAL.white : PAL.lgreen, 1]];
    for (const [col, r] of layers) {
      ctx.fillStyle = col;
      for (let i = -6; i <= 6; i++) ctx.fillRect(Math.round(c.x + dx * i - r), Math.round(c.y + dy * i - r), r * 2, r * 2);
    }
    ctx.fillStyle = PAL.lime;
    ctx.fillRect(Math.round(c.x + dx * 3 - nx), Math.round(c.y + dy * 3 - ny), 1, 1);
  }

  function draw(ctx) {
    ctx.save();
    if (S.shake > 0) ctx.translate(Math.round(randn() * 2), Math.round(randn() * 2));
    ctx.fillStyle = '#041020'; ctx.fillRect(0, TOP - 2, W, H);
    ctx.fillStyle = '#245a7c';   // glucose gradient: dot density = concentration
    for (const d of S.dots) if (conc(d.x, d.y) > d.th) ctx.fillRect(d.x | 0, d.y | 0, 1, 1);
    drawWater(ctx, S.water, '#0c2440');
    const tw = (S.t * 3 | 0) % 2;
    S.glu.forEach((g, i) => { blit(ctx, SPR.glucose, g.x, g.y); if ((i + (S.t * 2 | 0)) % 5 === 0 && tw) { ctx.fillStyle = PAL.white; ctx.fillRect((g.x | 0) + 4, (g.y | 0) - 5, 1, 1); } });
    S.pills.forEach(p => blit(ctx, SPR.pill, p.x, p.y));
    S.phages.forEach(f => blit(ctx, SPR.phage, f.x, f.y));
    const c = S.cell;
    drawCell(ctx, c);
    // heading arrow: where you'll go when you stop tumbling
    arrow(ctx, c.x + Math.cos(c.h) * 13, c.y + Math.sin(c.h) * 13, c.h, c.tumbling ? PAL.orange : PAL.white);
    // food pointer when no glucose is close by
    let best = null, bd = 1e9;
    for (const g of S.glu) { const d = (g.x - c.x) ** 2 + (g.y - c.y) ** 2; if (d < bd) { bd = d; best = g; } }
    if (best && bd > 45 * 45 && (S.t * 4 | 0) % 2) {
      const a = Math.atan2(best.y - c.y, best.x - c.x);
      arrow(ctx, c.x + Math.cos(a) * 22, c.y + Math.sin(a) * 22, a, PAL.sky);
    }
    S.sparks.forEach(p => { ctx.fillStyle = p.color; ctx.fillRect(p.x | 0, p.y | 0, 1, 1); });
    S.texts.forEach(t => Font.draw(ctx, t.text, clamp(t.x, 2, W - Font.width(t.text) - 2), t.y, t.color, 1, PAL.black));
    ctx.restore();

    // HUD
    ctx.fillStyle = PAL.black; ctx.fillRect(0, 0, W, L.hud);
    ctx.fillStyle = PAL.dgray; ctx.fillRect(0, L.hud - 1, W, 1);
    Font.draw(ctx, 'SC' + String(Game.score).padStart(6, '0'), 3, 3, PAL.white);
    Font.draw(ctx, 'LV' + Game.level, 60, 3, PAL.lblue);
    const tl = Math.max(0, Math.ceil(S.time));
    Font.draw(ctx, 'TIME ' + tl, 88, 3, tl <= 5 && (S.t * 4 | 0) % 2 ? PAL.red : PAL.white);
    blit(ctx, SPR.glucose, 160, 7);
    Font.draw(ctx, 'FOOD ' + S.got + '/' + S.goal, 168, 3, PAL.sky);
    const run = !c.tumbling;
    Font.draw(ctx, 'MOTOR', 3, 13, PAL.gray);
    Font.draw(ctx, run ? 'CCW = RUN' : 'CW = TUMBLE', 36, 13, run ? PAL.lgreen : PAL.orange);
    Font.draw(ctx, 'SMELL', 160, 13, PAL.gray);
    const sig = conc(c.x, c.y);
    ctx.fillStyle = PAL.dgray; ctx.fillRect(192, 13, 60, 6);
    ctx.fillStyle = PAL.sky; ctx.fillRect(193, 14, Math.round(58 * sig), 4);
    if (Game.level === 1) Font.center(ctx, 'LEFT/RIGHT: TUMBLE TO TURN', 128, H - 9, '#4c6c8c');
    if (S.banner > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(34, 30, 188, 24);
      Font.center(ctx, 'GOAL: EAT ' + S.goal + ' GLUCOSE', 128, 34, PAL.sky);
      Font.center(ctx, 'LEFT/RIGHT TO TUMBLE + TURN', 128, 44, PAL.lgray);
    }
    if (S.intro) drawIntro(ctx);
  }

  function drawIntro(ctx) {
    ctx.fillStyle = '#00000a'; ctx.fillRect(0, 0, W, H);
    Font.center(ctx, 'NOW SWIM!', 128, 8, PAL.lgreen, 2, PAL.dgreen);
    const demo = { x: 34, y: 0, h: 0, ph: S.cell.ph, tumbling: false };
    const tumbleDemo = { x: 34, y: 0, h: S.t * 4, ph: S.cell.ph, tumbling: true };
    const rows = [
      [() => drawCell(ctx, demo), 'THIS IS YOUR BACTERIUM. IT', 'SWIMS FORWARD ON ITS OWN.', PAL.lgreen],
      [() => drawCell(ctx, tumbleDemo), 'HOLD LEFT OR RIGHT TO', 'TUMBLE AND TURN. LET GO = GO!', PAL.orange],
      [() => blit(ctx, SPR.glucose, 30, 0), 'EAT THE WHITE DOTS.', 'THEY ARE GLUCOSE - FOOD!', PAL.sky],
      [() => { blit(ctx, SPR.pill, 22, 0); blit(ctx, SPR.phage, 38, 0); }, 'AVOID ANTIBIOTICS AND', 'PHAGE VIRUSES. THEY COST TIME.', PAL.rose],
    ];
    rows.forEach(([icon, l1, l2, col], i) => {
      const y = 44 + i * 32;
      ctx.save(); ctx.translate(0, y); icon(); ctx.restore();
      Font.draw(ctx, l1, 54, y - 8, col);
      Font.draw(ctx, l2, 54, y + 2, PAL.lgray);
    });
    Font.center(ctx, 'GOAL: EAT ' + S.goal + ' BEFORE TIME RUNS OUT', 128, 178, PAL.yellow);
    Font.center(ctx, 'NO FOOD NEARBY? FOLLOW THE BLUE ARROW', 128, 190, PAL.sky);
    if ((S.t * 2 | 0) % 2 === 0) Font.center(ctx, 'PRESS ENTER TO SWIM', 128, 216, PAL.white);
  }

  return { enter, update, draw, state: S };
})();
