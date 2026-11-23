// Tiny chiptune engine: NES-style pulse waves, triangle bass, noise drums.
const Sfx = (() => {
  let ac = null, master = null, musicBus = null, sfxBus = null;
  let pulse12 = null, pulse25 = null, pulse50 = null, noiseBuf = null;
  let muted = false;

  function makePulse(duty) {
    const n = 64, real = new Float32Array(n), imag = new Float32Array(n);
    for (let i = 1; i < n; i++) real[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * duty);
    return ac.createPeriodicWave(real, imag);
  }

  function unlock() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain(); master.gain.value = muted ? 0 : 0.5; master.connect(ac.destination);
    musicBus = ac.createGain(); musicBus.gain.value = 0.32; musicBus.connect(master);
    sfxBus = ac.createGain(); sfxBus.gain.value = 0.7; sfxBus.connect(master);
    pulse12 = makePulse(0.125); pulse25 = makePulse(0.25); pulse50 = makePulse(0.5);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    // NES-ish noise: sample-and-hold random values for a gritty texture
    let v = 0;
    for (let i = 0; i < d.length; i++) { if (i % 4 === 0) v = Math.random() * 2 - 1; d[i] = v; }
    if (wanted) playSong(wanted);
  }

  function wave(osc, type) {
    if (type === 'p12') osc.setPeriodicWave(pulse12);
    else if (type === 'p25') osc.setPeriodicWave(pulse25);
    else if (type === 'p50' || type === 'square') osc.setPeriodicWave(pulse50);
    else osc.type = type; // triangle, sawtooth, sine
  }

  // Play a single tone. slide: target freq at end.
  function tone(freq, dur, type = 'p25', vol = 0.3, slide = null, delay = 0, bus = null) {
    if (!ac) return;
    const t = ac.currentTime + delay;
    const o = ac.createOscillator(), g = ac.createGain();
    wave(o, type);
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.setValueAtTime(vol, t + dur * 0.7);
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g); g.connect(bus || sfxBus);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function noise(dur, vol = 0.3, freq = 4000, delay = 0, bus = null, sweepTo = null) {
    if (!ac) return;
    const t = ac.currentTime + delay;
    const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(freq, t); f.Q.value = 0.8;
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(bus || sfxBus);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }

  const N = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  function hz(note) {
    const m = /^([A-G]#?)(\d)$/.exec(note);
    if (!m) return 0;
    const midi = N[m[1]] + (parseInt(m[2]) + 1) * 12;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // ---------- Sound effects ----------
  const fx = {
    grab()   { tone(440, 0.05, 'p25', 0.25, 880); tone(880, 0.06, 'p25', 0.2, null, 0.05); },
    drop()   { tone(660, 0.08, 'p25', 0.2, 220); },
    dock()   { ['C5','E5','G5','C6'].forEach((n, i) => tone(hz(n), 0.07, 'p12', 0.25, null, i * 0.055)); },
    wrong()  { tone(160, 0.12, 'p50', 0.3, 90); tone(150, 0.18, 'p50', 0.3, 70, 0.12); },
    atp()    { tone(hz('B5'), 0.06, 'p25', 0.22); tone(hz('E6'), 0.14, 'p25', 0.22, null, 0.06); },
    hurt()   { noise(0.2, 0.4, 1200, 0, null, 300); tone(300, 0.2, 'p50', 0.2, 60); },
    chomp()  { noise(0.08, 0.35, 2500); noise(0.08, 0.35, 1800, 0.1); tone(120, 0.15, 'p12', 0.25, 50, 0.05); },
    spawn()  { tone(hz('G4'), 0.04, 'triangle', 0.25); tone(hz('D5'), 0.05, 'triangle', 0.25, null, 0.04); },
    kick()   { noise(0.5, 0.35, 600, 0, null, 4000); tone(80, 0.3, 'triangle', 0.4, 200); },
    proton() { tone(2400 + Math.random() * 800, 0.025, 'p12', 0.08); },
    tumble() { noise(0.12, 0.2, 3000, 0, null, 800); },
    eat()    { tone(hz('E5'), 0.04, 'p12', 0.22); tone(hz('A5'), 0.05, 'p12', 0.22, null, 0.04); },
    select() { tone(hz('A5'), 0.05, 'p25', 0.22); },
    start()  { ['C5','G5','C6','E6','G6'].forEach((n, i) => tone(hz(n), 0.08, 'p25', 0.22, null, i * 0.07)); },
    fanfare() {
      const seq = [['C5',0.1],['E5',0.1],['G5',0.1],['C6',0.25],['A5',0.1],['C6',0.4]];
      let t = 0; seq.forEach(([n, d]) => { tone(hz(n), d, 'p25', 0.24, null, t); tone(hz(n) / 2, d, 'triangle', 0.3, null, t); t += d; });
    },
    gameover() {
      const seq = ['G4','F#4','F4','E4','D#4','D4','C#4','C4'];
      seq.forEach((n, i) => tone(hz(n), 0.14, 'p50', 0.22, null, i * 0.13));
      tone(hz('C3'), 0.8, 'triangle', 0.35, 40, seq.length * 0.13);
    },
    tick()   { tone(1200, 0.02, 'p12', 0.12); },
    nope()   { tone(220, 0.06, 'p25', 0.15); tone(196, 0.08, 'p25', 0.15, null, 0.07); },
  };

  // ---------- Motor hum (continuous) ----------
  let motor = null;
  function motorOn() {
    if (!ac || motor) return;
    const o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain();
    wave(o, 'p12'); o2.type = 'triangle';
    o.frequency.value = 40; o2.frequency.value = 20;
    g.gain.value = 0;
    o.connect(g); o2.connect(g); g.connect(sfxBus);
    o.start(); o2.start();
    motor = { o, o2, g };
  }
  function motorSet(freq, vol = 0.12) {
    if (!motor) return;
    const t = ac.currentTime;
    motor.o.frequency.setTargetAtTime(freq, t, 0.05);
    motor.o2.frequency.setTargetAtTime(freq / 2, t, 0.05);
    motor.g.gain.setTargetAtTime(vol, t, 0.05);
  }
  function motorOff() {
    if (!motor) return;
    const m = motor; motor = null;
    m.g.gain.setTargetAtTime(0, ac.currentTime, 0.05);
    setTimeout(() => { try { m.o.stop(); m.o2.stop(); } catch (e) {} }, 300);
  }

  // ---------- Music sequencer ----------
  // Songs are 64 sixteenth-note steps. '.' = rest/hold.
  function seq(str) { return str.trim().split(/\s+/); }
  function chordArp(chords) { // chords: array of 4 arrays of 4 notes -> 64 steps
    const out = [];
    chords.forEach(c => { for (let i = 0; i < 16; i++) out.push(c[i % 4]); });
    return out;
  }
  function bassBounce(roots) {
    const out = [];
    roots.forEach(([lo, hi]) => { for (let i = 0; i < 16; i++) out.push(i % 2 ? '.' : (i % 4 === 0 ? lo : hi)); });
    return out;
  }

  const SONGS = {
    assembly: {
      bpm: 132,
      lead: seq(`
        E5 . . . A5 . G5 . E5 . . . D5 . C5 .
        D5 . . . C5 . A4 . C5 . . . . . . .
        E5 . . . G5 . E5 . G5 . A5 . G5 . E5 .
        D5 . . . B4 . G4 . B4 . D5 . . . . .`),
      arp: chordArp([['A4','C5','E5','C5'], ['F4','A4','C5','A4'], ['G4','C5','E5','C5'], ['G4','B4','D5','B4']]),
      bass: bassBounce([['A2','A3'], ['F2','F3'], ['C3','C4'], ['G2','G3']]),
      drums: 'k.h.s.h.k.h.s.hh',
    },
    swim: {
      bpm: 156,
      lead: seq(`
        C5 . E5 . G5 . E5 . C6 . . . G5 . . .
        A5 . . . E5 . C5 . E5 . A5 . . . . .
        F5 . A5 . C6 . A5 . F5 . . . A5 . . .
        G5 . . . D5 . B4 . D5 . G5 . B5 . D6 .`),
      arp: chordArp([['C5','E5','G5','E5'], ['A4','C5','E5','C5'], ['F4','A4','C5','A4'], ['G4','B4','D5','B4']]),
      bass: bassBounce([['C3','C4'], ['A2','A3'], ['F2','F3'], ['G2','G3']]),
      drums: 'k.hhs.h.k.hks.hh',
    },
    title: {
      bpm: 108,
      lead: seq(`
        A4 . . . . . E5 . . . . . D5 . C5 .
        B4 . . . . . . . G4 . . . . . . .
        A4 . . . . . E5 . . . . . G5 . A5 .
        B5 . . . . . G5 . . . . . . . . .`),
      arp: chordArp([['A3','E4','A4','E4'], ['G3','D4','G4','D4'], ['F3','C4','F4','C4'], ['E3','B3','E4','G#4']]),
      bass: bassBounce([['A2','A2'], ['G2','G2'], ['F2','F2'], ['E2','E2']]),
      drums: 'k.......s.......',
    },
  };

  let song = null, step = 0, nextT = 0, loop = 0, timer = null, wanted = null;
  function playSong(name) {
    wanted = name;
    if (!ac) return;
    if (song === SONGS[name]) return;
    stopSong();
    song = SONGS[name]; step = 0; loop = 0; nextT = ac.currentTime + 0.05;
    timer = setInterval(schedule, 25);
  }
  function stopSong() { if (timer) clearInterval(timer); timer = null; song = null; wanted = null; }

  function schedule() {
    if (!song) return;
    const dt = 60 / song.bpm / 4;
    while (nextT < ac.currentTime + 0.12) {
      const d = nextT - ac.currentTime;
      const L = song.lead[step], A = song.arp[step], B = song.bass[step];
      // Lead plays every other loop on the assembly/swim tracks, always on title
      if (L && L !== '.' && (loop % 2 === 1 || song === SONGS.title)) {
        let len = 1; while (song.lead[step + len] === '.' && len < 6) len++;
        tone(hz(L), dt * len * 0.95, 'p25', 0.22, null, d, musicBus);
      }
      if (A && A !== '.') tone(hz(A), dt * 0.8, 'p12', 0.09, null, d, musicBus);
      if (B && B !== '.') tone(hz(B), dt * 1.8, 'triangle', 0.4, null, d, musicBus);
      const dr = song.drums[step % 16];
      if (dr === 'k') { tone(150, 0.08, 'triangle', 0.5, 40, d, musicBus); }
      else if (dr === 's') noise(0.1, 0.18, 1800, d, musicBus);
      else if (dr === 'h') noise(0.03, 0.08, 8000, d, musicBus);
      step++;
      if (step >= 64) { step = 0; loop++; }
      nextT += dt;
    }
  }

  function toggleMute() {
    muted = !muted;
    if (master) master.gain.setTargetAtTime(muted ? 0 : 0.5, ac.currentTime, 0.02);
    return muted;
  }

  return { unlock, fx, tone, noise, hz, motorOn, motorSet, motorOff, playSong, stopSong, toggleMute, get muted() { return muted; } };
})();
