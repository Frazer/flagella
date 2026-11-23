// STAGE 1: assemble a flagellar motor, part by part, in a jittery Brownian cytoplasm.
const Assembly = (() => {
  const S = {};
  const BOUND = { x0: 8, x1: W - 8, y0: L.cyto + 7, y1: H - 6 };
  const BASE_ORDER = ['MS', 'CRING', 'GATE', 'ROD', 'PRING', 'LRING', 'HOOK', 'JUNC', 'CAP'];

  function enter() {
    const lv = Game.level;
    S.t = 0;
    S.temp = 1 + (lv - 1) * 0.3;
    S.kelvin = 310 + (lv - 1) * 8;
    S.order = BASE_ORDER.concat(Array(1 + lv).fill('FLAG'), ['STATOR', 'STATOR']);
    S.idx = 0;
    S.built = new Set(); S.built.statorCount = 0; S.flags = 0;
    S.player = { x: 128, y: 214, vx: 0, vy: 0, carry: null, inv: 0, anim: 0 };
    S.parts = []; S.prots = []; S.atps = []; S.texts = []; S.sparks = []; S.docking = [];
    S.spawnT = 0.3; S.atpT = 3; S.kickT = 9 + Math.random() * 5; S.shake = 0;
    S.needT = 0; S.combo = 0; S.lastDock = -99; S.done = false; S.doneT = 0;
    S.ribo = [{ x: 9, y: 178, pulse: 0 }, { x: W - 9, y: 206, pulse: 0 }];
    S.water = makeWater(70, L.cyto, H).concat(makeWater(30, L.extTop, L.om - 3), makeWater(14, L.omB, L.pg - 1));
    for (let i = 0; i < 3; i++) spawnPart(true);
    const nProt = Math.min(1 + Math.floor((lv - 1) / 1), 5);
    for (let i = 0; i < nProt; i++) {
      const left = i % 2 === 0;
      S.prots.push({ x: left ? 24 + Math.random() * 30 : 202 + Math.random() * 30, y: BOUND.y0 + 6 + Math.random() * 20, vx: 0, vy: 0, ph: Math.random() });
    }
    S.player.inv = 2;
    S.coach = lv === 1 ? 0 : 3; S.coachT = 0; S.grabCool = 0; S.nopeT = 0;
    S.banner = lv === 1 ? 0 : 3;
    S.intro = lv === 1; S.introT = 0;
    Sfx.playSong('assembly');
  }

  const need = () => S.order[S.idx];

  function spawnPart(instant) {
    const r = S.ribo[Math.random() < 0.5 ? 0 : 1];
    const want = need();
    const present = S.parts.some(p => p.type === want) || (S.player.carry && S.player.carry.type === want);
    let type;
    if (want && (!present || Math.random() < 0.35)) type = want;
    else {
      const pool = Object.keys(PARTS).filter(k => k !== want);
      type = pool[(Math.random() * pool.length) | 0];
    }
    const p = { type, x: r.x + (r.x < 128 ? 8 : -8), y: r.y, vx: (r.x < 128 ? 1 : -1) * (40 + Math.random() * 30), vy: randn() * 20, age: 0 };
    if (instant) { p.x = 30 + Math.random() * 196; p.y = BOUND.y0 + 10 + Math.random() * 70; }
    else { r.pulse = 0.3; Sfx.fx.spawn(); }
    S.parts.push(p);
  }

  function say(text, x, y, color = PAL.white, life = 1.2) { S.texts.push({ text, x, y, t: life, life, color }); }
  function burst(x, y, color, n = 10, sp = 60) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = sp * (0.4 + Math.random());
      S.sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0.4 + Math.random() * 0.3, color });
    }
  }

  // Brownian dynamics step: random kick + viscous damping (we're at low Reynolds number!)
  function brown(e, kick, damp, dt) {
    const s = Math.sqrt(dt);
    e.vx += randn() * kick * s * 10; e.vy += randn() * kick * s * 10;
    const f = Math.exp(-damp * dt);
    e.vx *= f; e.vy *= f;
    e.x += e.vx * dt; e.y += e.vy * dt;
    if (e.x < BOUND.x0) { e.x = BOUND.x0; e.vx = Math.abs(e.vx); }
    if (e.x > BOUND.x1) { e.x = BOUND.x1; e.vx = -Math.abs(e.vx); }
    if (e.y < BOUND.y0) { e.y = BOUND.y0; e.vy = Math.abs(e.vy); }
    if (e.y > BOUND.y1) { e.y = BOUND.y1; e.vy = -Math.abs(e.vy); }
  }

  function slotPos(type) {
    const cx = L.cx;
    switch (type) {
      case 'MS': return [cx, L.im + 4];
      case 'CRING': case 'GATE': return [cx, L.imB + 8];
      case 'ROD': return [cx, L.pg - 4];
      case 'PRING': return [cx, L.pg + 3];
      case 'LRING': return [cx, L.om + 4];
      case 'HOOK': return [cx + 6, L.om - 12];
      case 'JUNC': return [cx + 14, L.om - 20];
      case 'STATOR': return S.built.statorCount + S.docking.filter(d => d.type === 'STATOR').length === 0 ? [cx - 25, L.im] : [cx + 24, L.im];
      default: { // CAP / FLAG at the filament tip
        const len = S.flags * 12, a = -0.42;
        return [cx + 18 + Math.cos(a) * len, L.om - 20 + Math.sin(a) * len];
      }
    }
  }

  function deliver(part) {
    const pl = S.player;
    pl.carry = null;
    if (part.type === need()) {
      S.idx++;
      const [tx, ty] = slotPos(part.type);
      S.docking.push({ type: part.type, x: L.dockX, y: L.dockY - 6, sx: L.dockX, sy: L.dockY - 6, tx, ty, t: 0 });
      S.combo = (S.t - S.lastDock < 8) ? S.combo + 1 : 1;
      S.lastDock = S.t;
      const pts = 100 * S.combo * Game.level;
      Game.score += pts;
      Game.atp = Math.min(100, Game.atp + 4);
      say('+' + pts + (S.combo > 1 ? ' x' + S.combo : ''), L.dockX - 10, L.dockY - 14, PAL.yellow);
      Sfx.fx.dock();
      burst(L.dockX, L.dockY - 4, PARTS[part.type].color, 14);
      if (S.coach === 1) { S.coach = 2; S.coachT = 4; }
      if (S.idx >= S.order.length) S.done = true;
    } else {
      Sfx.fx.wrong();
      Game.atp -= 10;
      S.combo = 0;
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2;
      part.x = L.dockX; part.y = L.dockY + 4; part.vx = Math.cos(a) * 160; part.vy = Math.abs(Math.sin(a)) * 160;
      S.parts.push(part);
      say('WRONG PART!', L.dockX - 32, L.dockY - 16, PAL.red);
      S.shake = 0.2;
    }
  }

  function update(dt) {
    if (S.intro) {
      S.t += dt; S.introT += dt;
      if (S.introT > 0.6 && (Input.pressed.start || Input.pressed.a)) { S.intro = false; Sfx.fx.select(); }
      return;
    }
    S.t += dt;
    const pl = S.player, lv = Game.level;
    updateWater(S.water, S.temp);
    if (S.banner > 0) S.banner -= dt;

    // ---- ATP economy ----
    const drain = 0.9 + lv * 0.25 + (pl.carry ? 1.4 : 0);
    if (!S.done) Game.atp -= drain * dt * (S.coach < 3 ? 0.5 : 1);  // gentler while learning
    if (Game.atp <= 0) { Game.atp = 0; Game.setScene(GameOver, 'ATP DEPLETED'); return; }

    // ---- player ----
    const acc = 520;
    let ix = 0, iy = 0;
    if (Input.down.left) ix -= 1; if (Input.down.right) ix += 1;
    if (Input.down.up) iy -= 1; if (Input.down.down) iy += 1;
    if (ix && iy) { ix *= 0.707; iy *= 0.707; }
    pl.vx += ix * acc * dt; pl.vy += iy * acc * dt;
    brown(pl, 4 * S.temp, 5, dt);
    const sp = Math.hypot(pl.vx, pl.vy), max = pl.carry ? 85 : 105;
    if (sp > max) { pl.vx *= max / sp; pl.vy *= max / sp; }
    pl.anim += dt * (sp > 10 ? 1 : 0.3);
    if (pl.inv > 0) pl.inv -= dt;

    // Touch the part you NEED and you grab it automatically. Other parts just get nudged aside.
    if (S.grabCool > 0) S.grabCool -= dt;
    if (S.nopeT > 0) S.nopeT -= dt;
    if (!pl.carry && S.grabCool <= 0 && need()) {   // nothing left to grab once the motor is complete
      for (const p of S.parts) {
        const d2 = dist2(p, pl);
        if (d2 > 13 * 13) continue;
        if (p.type === need()) {
          S.parts.splice(S.parts.indexOf(p), 1);
          pl.carry = p; Sfx.fx.grab();
          const msg = 'GOT ' + PARTS[p.type].name + '!';
          say(msg, pl.x - Font.width(msg) / 2, pl.y - 26, PARTS[p.type].color, 1);
          if (S.coach === 0) S.coach = 1;
          break;
        }
        const d = Math.sqrt(d2) || 1;
        p.vx += (p.x - pl.x) / d * 900 * dt; p.vy += (p.y - pl.y) / d * 900 * dt;
        if (S.nopeT <= 0) {
          const msg = 'WRONG PART - FIND ' + PARTS[need()].name;
          say(msg, pl.x - Font.width(msg) / 2, pl.y - 24, PAL.lgray, 1);
          Sfx.fx.nope(); S.nopeT = 2;
        }
      }
    }
    if (Input.pressed.a && pl.carry) {   // optional: drop what you're holding
      const c = pl.carry; pl.carry = null;
      c.vx = pl.vx * 1.2; c.vy = pl.vy * 1.2 + 20; S.parts.push(c);
      S.grabCool = 0.7; Sfx.fx.drop();
    }
    if (pl.carry) {
      const c = pl.carry;
      c.x += (pl.x - c.x) * Math.min(1, dt * 14); c.y += (pl.y - 11 - c.y) * Math.min(1, dt * 14);
      c.x += randn() * 0.4 * S.temp; c.y += randn() * 0.4 * S.temp;
      if (Math.abs(pl.x - L.dockX) < 18 && Math.abs(pl.y - L.dockY) < 14) deliver(c);
    }
    if (S.coach === 2) { S.coachT -= dt; if (S.coachT <= 0) S.coach = 3; }
    if (S.coach === 1 && !pl.carry && !S.docking.length) S.coach = 0;  // lost the part: back to step 1

    // ---- floating parts ----
    S.needT += dt;
    for (const p of S.parts) { p.age += dt; brown(p, 7 * S.temp, 2.2, dt); if (p.type === need()) S.needT = 0; }
    if (pl.carry && pl.carry.type === need()) S.needT = 0;
    S.spawnT -= dt;
    const target = 5 + Math.min(lv, 4);
    if ((S.spawnT <= 0 && S.parts.length < target) || (S.needT > 2.5 && !S.done)) {
      spawnPart(false); S.spawnT = 1.1; S.needT = 0;
    }
    // cull extras so the soup never gets too thick
    if (S.parts.length > target + 3) {
      const i = S.parts.findIndex(p => p.type !== need() && p.age > 4);
      if (i >= 0) { burst(S.parts[i].x, S.parts[i].y, PAL.gray, 5, 30); S.parts.splice(i, 1); }
    }
    S.ribo.forEach(r => { if (r.pulse > 0) r.pulse -= dt; });

    // ---- proteases: they hunt for cargo ----
    for (const e of S.prots) {
      e.ph += dt;
      const hunt = S.coach < 3 ? 0.15 : (pl.carry ? 1 : 0.35);  // no hunting while you're learning
      const dx = pl.x - e.x, dy = pl.y - e.y, d = Math.hypot(dx, dy) || 1;
      const speed = (14 + lv * 5) * hunt;
      e.vx += (dx / d) * speed * dt * 3; e.vy += (dy / d) * speed * dt * 3;
      brown(e, 8 * S.temp, 2, dt);
      if (d < 11 && pl.inv <= 0) {
        pl.inv = 1.4;
        pl.vx = (dx / d) * 200; pl.vy = (dy / d) * 200;
        e.vx = -pl.vx * 0.5; e.vy = -pl.vy * 0.5;
        if (pl.carry) {
          burst(pl.carry.x, pl.carry.y, PARTS[pl.carry.type].color, 16, 80);
          say('CHOMP! PART DEGRADED', pl.x - 60, pl.y - 26, PAL.rose);
          pl.carry = null; Game.atp -= 12; Sfx.fx.chomp();
        } else { Game.atp -= 6; Sfx.fx.hurt(); say('OUCH', pl.x - 12, pl.y - 20, PAL.rose, 0.7); }
        S.shake = 0.25; S.combo = 0;
      }
    }

    // ---- ATP pickups ----
    S.atpT -= dt;
    if (S.atpT <= 0 && S.atps.length < 3) {
      S.atps.push({ x: 20 + Math.random() * 216, y: BOUND.y0 + 5 + Math.random() * 90, vx: 0, vy: 0, t: 0 });
      S.atpT = 3.5 + Math.random() * 3;
    }
    for (let i = S.atps.length - 1; i >= 0; i--) {
      const a = S.atps[i]; a.t += dt;
      brown(a, 6 * S.temp, 2.5, dt);
      if (dist2(a, pl) < 12 * 12) {
        S.atps.splice(i, 1); Game.atp = Math.min(100, Game.atp + 15); Game.score += 10 * lv;
        Sfx.fx.atp(); say('+ATP', a.x - 10, a.y - 10, PAL.yellow, 0.8); burst(a.x, a.y, PAL.yellow, 6, 40);
      } else if (a.t > 12) S.atps.splice(i, 1);
    }

    // ---- thermal fluctuations: big random kicks ----
    S.kickT -= dt;
    if (S.kickT <= 0) {
      S.kickT = Math.max(5, 14 - lv * 1.5) + Math.random() * 5;
      const k = 120 + lv * 30;
      const all = [pl, ...S.parts, ...S.prots, ...S.atps];
      all.forEach(e => { e.vx += randn() * k; e.vy += randn() * k; });
      S.water.forEach(w => { w.x += randn() * 10; });
      S.shake = 0.45; Sfx.fx.kick();
      say('THERMAL FLUCTUATION!', 128 - 60, 140, PAL.orange, 1.4);
      if (pl.carry && lv >= 2 && Math.random() < 0.25 + lv * 0.08) {
        const c = pl.carry; pl.carry = null; c.vx = randn() * 150; c.vy = randn() * 150; S.parts.push(c);
        say('KNOCKED LOOSE!', pl.x - 40, pl.y - 26, PAL.orange, 1);
      }
    }

    // ---- docking animations ----
    for (let i = S.docking.length - 1; i >= 0; i--) {
      const d = S.docking[i]; d.t += dt * 1.8;
      const s = Math.min(1, d.t);
      // travel up through the central channel first, then out to the slot
      const mid = { x: L.cx, y: Math.min(d.ty, L.imB) };
      if (s < 0.5) { const u = s / 0.5; d.x = d.sx + (mid.x - d.sx) * u; d.y = d.sy + (mid.y - d.sy) * u; }
      else { const u = (s - 0.5) / 0.5; d.x = mid.x + (d.tx - mid.x) * u; d.y = mid.y + (d.ty - mid.y) * u; }
      if (s >= 1) {
        S.docking.splice(i, 1);
        if (d.type === 'FLAG') S.flags++;
        else if (d.type === 'STATOR') S.built.statorCount++;
        S.built.add(d.type);
        burst(d.tx, d.ty, PARTS[d.type].color, 10, 40);
        Sfx.fx.tick();
      }
    }

    if (S.done && S.docking.length === 0) {
      S.doneT += dt;
      if (S.doneT > 1.0) { Game.setScene(Spinup, { built: S.built, flags: S.flags }); return; }
    }

    // ---- cosmetics ----
    for (let i = S.sparks.length - 1; i >= 0; i--) {
      const p = S.sparks[i]; p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92;
      if (p.t <= 0) S.sparks.splice(i, 1);
    }
    for (let i = S.texts.length - 1; i >= 0; i--) { const t = S.texts[i]; t.t -= dt; t.y -= 12 * dt; if (t.t <= 0) S.texts.splice(i, 1); }
    if (S.shake > 0) S.shake -= dt;
  }

  function drawHud(ctx) {
    ctx.fillStyle = PAL.black; ctx.fillRect(0, 0, W, L.hud);
    ctx.fillStyle = PAL.dgray; ctx.fillRect(0, L.hud - 1, W, 1);
    Font.draw(ctx, 'SC' + String(Game.score).padStart(6, '0'), 3, 3, PAL.white);
    Font.draw(ctx, 'LV' + Game.level, 60, 3, PAL.lblue);
    Font.draw(ctx, S.kelvin + 'K', 88, 3, S.temp > 1.6 ? PAL.fire : PAL.orange);
    Font.draw(ctx, 'ATP', 3, 13, PAL.yellow);
    ctx.fillStyle = PAL.dgray; ctx.fillRect(22, 13, 82, 7);
    const lowBlink = Game.atp < 25 && (S.t * 4 | 0) % 2;
    ctx.fillStyle = lowBlink ? PAL.red : (Game.atp < 25 ? PAL.fire : PAL.yellow);
    ctx.fillRect(23, 14, Math.max(0, Math.round(80 * Game.atp / 100)), 5);
    Font.draw(ctx, (Math.min(S.idx, S.order.length)) + '/' + S.order.length, 112, 13, PAL.lgray);
    // NEXT box
    const n = need();
    Font.draw(ctx, 'NEXT', 128, 3, PAL.gray);
    ctx.fillStyle = PAL.dgray; ctx.fillRect(153, 2, 14, 14);
    ctx.fillStyle = PAL.black; ctx.fillRect(154, 3, 12, 12);
    if (n) {
      blit(ctx, PARTS[n].icon, 160, 9);
      Font.draw(ctx, PARTS[n].name, 171, 3, PARTS[n].color);
      Font.draw(ctx, PARTS[n].gene, 171, 13, PAL.gray);
    } else Font.draw(ctx, 'COMPLETE!', 171, 3, PAL.lgreen);
  }

  function draw(ctx) {
    ctx.save();
    if (S.shake > 0) ctx.translate(Math.round(randn() * 2), Math.round(randn() * 2));
    drawEnvelope(ctx, S.t);
    drawWater(ctx, S.water);
    const blink = (S.t * 3 | 0) % 2 === 0;
    drawMotor(ctx, S.built, S.flags, 0, need(), blink);

    drawDock(ctx);

    S.ribo.forEach(r => blit(ctx, SPR.ribo, r.x + (r.pulse > 0 ? (r.x < 128 ? 1 : -1) : 0), r.y));
    S.atps.forEach(a => { if (a.t < 10 || (a.t * 8 | 0) % 2) blit(ctx, SPR.atp, a.x, a.y); });
    const lv = Game.level;
    S.parts.forEach(p => {
      const wanted = p.type === need() && !S.player.carry;
      const glow = wanted && lv <= 2 && (S.t * 4 | 0) % 2 === 0;
      blit(ctx, glow ? PARTS[p.type].flash : PARTS[p.type].icon, p.x, p.y);
      if (wanted) brackets(ctx, p.x, p.y, 8 + ((S.t * 4 | 0) % 2), PARTS[p.type].color);
    });
    S.prots.forEach(e => blit(ctx, (e.ph * 5 | 0) % 2 ? SPR.protA : SPR.protB, e.x, e.y));

    const pl = S.player;
    if (pl.inv <= 0 || (S.t * 12 | 0) % 2) blit(ctx, (pl.anim * 5 | 0) % 2 ? SPR.chapA : SPR.chapB, pl.x, pl.y);
    if (pl.carry) {
      ctx.fillStyle = PAL.lgreen; ctx.fillRect(Math.round(pl.x), Math.round(pl.y - 7), 1, 2);
      blit(ctx, PARTS[pl.carry.type].icon, pl.carry.x, pl.carry.y);
    }
    S.docking.forEach(d => blit(ctx, PARTS[d.type].icon, d.x, d.y));
    S.sparks.forEach(p => { ctx.fillStyle = p.color; ctx.fillRect(p.x | 0, p.y | 0, 1, 1); });
    S.texts.forEach(t => {
      if (t.t < 0.3 && (t.t * 20 | 0) % 2) return;
      Font.draw(ctx, t.text, clamp(t.x, 2, W - Font.width(t.text) - 2), t.y, t.color, 1, PAL.black);
    });
    ctx.restore();

    drawHud(ctx);

    drawCoach(ctx);
    if (S.intro) drawIntro(ctx);
  }

  // ---------- guidance visuals ----------
  function brackets(ctx, x, y, r, color) {
    ctx.fillStyle = color;
    const x0 = Math.round(x - r), y0 = Math.round(y - r), s = r * 2;
    [[x0, y0, 1, 1], [x0 + s, y0, -1, 1], [x0, y0 + s, 1, -1], [x0 + s, y0 + s, -1, -1]].forEach(([cx, cy, dx, dy]) => {
      ctx.fillRect(Math.min(cx, cx + dx * 3), cy, 4, 1);
      ctx.fillRect(cx, Math.min(cy, cy + dy * 3), 1, 4);
    });
  }

  // The dock: a landing pad under the export gate that glows brighter while you carry a part.
  function drawDock(ctx, x = L.dockX, y = L.dockY, mini = false) {
    const carrying = mini || !!S.player.carry;
    const col = mini ? PAL.lgreen : (need() ? PARTS[need()].color : PAL.lgreen);
    const w = mini ? 22 : 34, h = mini ? 14 : 22, x0 = Math.round(x - w / 2), y0 = Math.round(y - h / 2);
    const pulse = 0.5 + 0.5 * Math.sin(S.t * (carrying ? 7 : 3));
    // soft halo
    for (let i = 3; i >= 1; i--) {
      ctx.globalAlpha = (carrying ? 0.07 + 0.06 * pulse : 0.03) * (4 - i);
      ctx.fillStyle = col; ctx.fillRect(x0 - i * 2, y0 - i * 2, w + i * 4, h + i * 4);
    }
    ctx.globalAlpha = carrying ? 0.35 + 0.25 * pulse : 0.12 + 0.06 * pulse;
    ctx.fillRect(x0, y0, w, h);
    ctx.globalAlpha = carrying ? 0.7 + 0.3 * pulse : 0.35;
    ctx.fillRect(x0, y0, w, 1); ctx.fillRect(x0, y0 + h - 1, w, 1); ctx.fillRect(x0, y0, 1, h); ctx.fillRect(x0 + w - 1, y0, 1, h);
    ctx.globalAlpha = 1;
    if (!mini && !carrying) Font.center(ctx, 'DOCK', x, y0 + h + 4, PAL.gray);
  }

  function coachBox(ctx, lines) {
    ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(14, 26, 228, 46);
    ctx.fillStyle = PAL.lblue; ctx.fillRect(14, 26, 228, 1); ctx.fillRect(14, 71, 228, 1);
    lines.forEach(([txt, col], i) => Font.center(ctx, txt, 128, 30 + i * 13, col));
  }

  function drawCoach(ctx) {
    const n = need();
    if (S.coach === 0 && n) {
      coachBox(ctx, [['STEP 1: FIND THIS PART', PAL.white], ['', PAL.white], ['SWIM INTO IT TO GRAB IT', PAL.lgray]]);
      const label = PARTS[n].name;
      const wdt = Font.width(label) + 16;
      blit(ctx, PARTS[n].icon, 128 - wdt / 2 + 5, 46);
      brackets(ctx, 128 - wdt / 2 + 5, 46, 7, PARTS[n].color);
      Font.draw(ctx, label, 128 - wdt / 2 + 16, 43, PARTS[n].color);
    } else if (S.coach === 1) {
      coachBox(ctx, [['STEP 2: CARRY IT TO THE DOCK', PAL.white], ['THE GLOWING PAD UNDER THE MOTOR', PAL.lgray], ['SWIM ONTO IT TO DROP IT OFF', PARTS[S.player.carry ? S.player.carry.type : 'MS'].color]]);
    } else if (S.coach === 2) {
      coachBox(ctx, [['IT CLICKED INTO PLACE!', PAL.lgreen], ['KEEP BUILDING IN ORDER.', PAL.white], ['NEXT PART IS SHOWN TOP RIGHT ^', PAL.lgray]]);
    } else if (S.banner > 0) {
      coachBox(ctx, [['LEVEL ' + Game.level, PAL.white], ['HOTTER: ' + S.kelvin + 'K', PAL.orange], ['MORE NOISE. MORE PROTEASES.', PAL.rose]]);
    }
  }

  function drawIntro(ctx) {
    ctx.fillStyle = '#00000a'; ctx.fillRect(0, 0, W, H);
    Font.center(ctx, 'BUILD THE MOTOR', 128, 10, PAL.yellow, 2, PAL.brown);
    const rows = [
      [() => blit(ctx, (S.t * 4 | 0) % 2 ? SPR.chapA : SPR.chapB, 30, 0), 'THIS IS YOU, A CHAPERONE.', 'USE THE ARROW KEYS TO SWIM.', PAL.lgreen],
      [() => { blit(ctx, PARTS.MS.icon, 30, 0); brackets(ctx, 30, 0, 8, PARTS.MS.color); }, 'SWIM INTO THE PART IN', 'BRACKETS TO GRAB IT.', PAL.lpurple],
      [() => drawDock(ctx, 30, 0, true), 'CARRY IT TO THE GLOWING', 'DOCK UNDER THE MOTOR.', PAL.lgreen],
      [() => blit(ctx, (S.t * 5 | 0) % 2 ? SPR.protA : SPR.protB, 30, 0), 'PROTEASES CHEW UP YOUR', 'PART. DODGE THEM!', PAL.rose],
      [() => blit(ctx, SPR.atp, 30, 0), 'ATP IS YOUR ENERGY. IT', 'DRAINS - SO GRAB MORE!', PAL.yellow],
    ];
    rows.forEach(([icon, l1, l2, col], i) => {
      const y = 46 + i * 31;
      ctx.save(); ctx.translate(0, y); icon(); ctx.restore();
      Font.draw(ctx, l1, 54, y - 8, col);
      Font.draw(ctx, l2, 54, y + 2, PAL.lgray);
    });
    if ((S.t * 2 | 0) % 2 === 0) Font.center(ctx, 'PRESS ENTER TO START', 128, 216, PAL.white);
  }

  // DEV: everything built except the last stator, which is in your hands just below the dock
  function devFinal() {
    S.intro = false; S.coach = 3; S.banner = 0;
    S.order.slice(0, -1).forEach(k => {
      if (k === 'FLAG') S.flags++;
      else if (k === 'STATOR') S.built.statorCount++;
      S.built.add(k);
    });
    S.idx = S.order.length - 1;
    S.player.x = L.dockX; S.player.y = 200; S.player.vx = S.player.vy = 0; S.player.inv = 2;
    S.player.carry = { type: 'STATOR', x: L.dockX, y: 189, vx: 0, vy: 0, age: 0 };
    S.prots.forEach((e, i) => { e.x = i % 2 ? W - 16 : 16; e.y = H - 10; e.vx = e.vy = 0; });
  }

  return { enter, update, draw, state: S, devFinal };
})();
