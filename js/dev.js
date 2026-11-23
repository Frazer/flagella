// Hidden developer menu. Press ` (backtick) anywhere to open it, then a number to jump.
const Dev = (() => {
  const ITEMS = [
    ['FINAL STATOR', 'LAST PART IN HAND', () => { Dev.toBuild(); Assembly.devFinal(); }],
    ['MOTOR SPIN-UP', 'AFTER THE BUILD', () => {
      const built = new Set(['MS', 'CRING', 'GATE', 'ROD', 'PRING', 'LRING', 'HOOK', 'JUNC', 'CAP', 'STATOR']);
      built.statorCount = 2;
      Game.setScene(Spinup, { built, flags: 1 + Game.level });
    }],
    ['SWIM STAGE', 'RUN AND TUMBLE', () => Game.setScene(Swim)],
    ['NEXT LEVEL', 'BUILD LEVEL +1', () => { Game.level++; Game.atp = 100; Game.setScene(Assembly); }],
    ['FULL ATP', 'TOP UP ENERGY', () => { Game.atp = 100; }],
  ];

  const D = {
    open: false,
    toggle() {
      D.open = !D.open; Sfx.fx.select();
      if (D.open && Game.scene === Prologue) { Prologue.close(); Game.setScene(Title); }  // menu can't draw over the video
    },
    toBuild() { Game.atp = 100; Game.setScene(Assembly); },
    pick(n) {
      const item = ITEMS[n - 1];
      if (!item) return;
      D.open = false;
      Sfx.fx.start();
      if (n !== 5) {   // jumping from a menu screen (or the video) starts a fresh game first
        if (Game.scene === Prologue) Prologue.close();
        if (Game.scene === Title || Game.scene === GameOver || Game.scene === Prologue) Game.newGame();
      }
      item[2]();
    },
    draw(ctx) {
      ctx.fillStyle = 'rgba(0,0,0,0.96)'; ctx.fillRect(24, 50, 208, 136);
      ctx.fillStyle = PAL.lime;
      ctx.fillRect(24, 50, 208, 1); ctx.fillRect(24, 185, 208, 1); ctx.fillRect(24, 50, 1, 136); ctx.fillRect(231, 50, 1, 136);
      Font.center(ctx, 'DEV MENU', 128, 56, PAL.lime, 1, PAL.dgreen);
      ITEMS.forEach(([name, sub], i) => {
        const y = 74 + i * 19;
        Font.draw(ctx, String(i + 1), 34, y, PAL.yellow);
        Font.draw(ctx, name, 46, y, PAL.white);
        Font.draw(ctx, sub, 46, y + 8, PAL.gray);
      });
      Font.center(ctx, 'ESC TO CLOSE', 128, 174, PAL.gray);
    },
  };
  return D;
})();
