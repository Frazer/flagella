// The inspiration screen: the real flagellar motor video, then "now it's our turn".
// The video autoplays, loops and has no controls. If the browser blocks autoplay with sound,
// we fall back to muted autoplay and show a "tap for sound" button.
const Prologue = (() => {
  const S = { leaving: false };
  const YT = 'https://www.youtube.com';
  const root = document.getElementById('prologue');
  const frame = document.getElementById('pro-iframe');
  const btn = document.getElementById('pro-go');
  const soundBtn = document.getElementById('pro-sound');

  // Pixel-font label drawn with the game's own bitmap font
  const lbl = document.getElementById('pro-label').getContext('2d');
  Font.draw(lbl, 'THE INSPIRATION', 1, 1, PAL.yellow, 2, PAL.brown);

  function yt(func, args = []) {
    if (frame.contentWindow) frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args }), YT);
  }

  // Listen for the player's state so we know whether autoplay actually started.
  addEventListener('message', e => {
    if (e.origin !== YT || e.source !== frame.contentWindow) return;
    let d; try { d = JSON.parse(e.data); } catch (err) { return; }
    if (d && d.info && d.info.playerState === 1) S.playing = true;
  });

  frame.addEventListener('load', () => {
    if (root.hidden) return;
    frame.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), YT);
  });

  function enter() {
    S.t = 0; S.leaving = false; S.playing = false; S.fallback = false;
    Sfx.stopSong(); Sfx.motorOff();
    soundBtn.hidden = true;
    frame.src = frame.dataset.src + '&origin=' + encodeURIComponent(location.origin);
    root.hidden = false;
    btn.focus();
  }

  function leave() {
    if (S.leaving) return;
    S.leaving = true;
    root.hidden = true;
    frame.src = 'about:blank';           // stops the video
    document.getElementById('screen').focus();
    Game.sawPrologue = true;
    Sfx.fx.start();
    Game.newGame();
    Game.setScene(Assembly);
  }

  function close() {   // hide the video screen without starting a game (used by the dev menu)
    S.leaving = true;
    root.hidden = true;
    frame.src = 'about:blank';
    document.getElementById('screen').focus();
  }

  btn.addEventListener('click', () => { Sfx.unlock(); leave(); });
  soundBtn.addEventListener('click', () => { yt('unMute'); yt('setVolume', [100]); yt('playVideo'); soundBtn.hidden = true; btn.focus(); });

  function update(dt) {
    S.t += dt;
    // Autoplay with sound didn't start? Mute and play, then offer sound.
    if (!S.playing && !S.fallback && S.t > 2.5) {
      S.fallback = true;
      yt('mute'); yt('playVideo');
      soundBtn.hidden = false;
    }
    if (S.t > 0.4 && Input.pressed.start) leave();
  }
  function draw(ctx) { ctx.fillStyle = PAL.black; ctx.fillRect(0, 0, W, H); }

  return { enter, update, draw, state: S, close };
})();
