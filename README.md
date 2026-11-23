# FLAGELLA

An 8-bit game about protein dynamics: build a bacterial flagellar motor one protein at a time inside a jittery, Brownian cytoplasm, then switch it on and swim.

Inspired by [**"Self Assembling Nanomachine: the Bacterial Flagellar Motor"**](https://www.youtube.com/shorts/Xe52W5kRu1w) by iJEP Studio, which plays at the start of the game.

## How to play

**Stage 1: Build the motor**
- Swim your chaperone around with the **arrow keys** (or WASD).
- The part you need next glows and has brackets around it. Swim into it to pick it up.
- Carry it to the glowing **dock** under the motor.
- Parts go in the order the real motor assembles: MS ring, C ring, export gate, rod, P ring, L ring, hook, junction, cap, flagellin, then the stators.
- Dodge **proteases**, which chew up whatever you're carrying, and grab **ATP** to keep your energy up.
- Every level is hotter, which means more thermal noise, a longer filament and more enemies.

**Stage 2: Swim**
- The motor runs. Your bacterium swims forward on its own (counter-clockwise rotation means **run**).
- Hold **Left/Right** to tumble and turn (clockwise rotation means **tumble**). Space does a random tumble, like a real bacterium.
- Eat the white glucose dots and avoid antibiotics and phages. The glucose you eat becomes ATP for the next build.

**Keys:** Enter to start · P to pause · M to mute · V to watch the video again

## Run it locally

It's plain HTML and JavaScript with no build step. Serve the folder with any static server so the YouTube embed works:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Under the hood

- `js/assembly.js`: build stage (Brownian dynamics, docking, proteases, thermal kicks)
- `js/swim.js`: run-and-tumble chemotaxis stage
- `js/audio.js`: tiny chiptune engine (NES-style pulse waves, triangle bass, noise drums), all synthesized live with Web Audio
- `js/gfx.js`: palette, pixel sprites and the motor cross-section
- `js/font.js`: 5x7 bitmap font
- `js/scenes.js`, `js/prologue.js`: title, spin-up cutscene, tally, game over and the intro video screen
