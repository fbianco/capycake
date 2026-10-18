# CAPYCAKE

A cute baking game for one player, played with your **hands** in front of the
webcam. You are a little capybara chef in a pastel cake factory: grab the
ingredients from the conveyor belt, crack the eggs, whisk, stir, pour, bake
and decorate cupcakes, biscuits and cakes - in the right order.
Made by Bianco's Labs.

Built on the architecture of Unicorn Run (`../UnicornRun`): same local server,
same vendored MediaPipe library, synthesised sound, fixed logical canvas and
automated tests - but with MediaPipe **Hand** Landmarker instead of Pose.

## Play

1. Double-click **start.bat**. A small window opens (the local game server) and
   your browser shows the game at http://localhost:8085. Keep that window open.
   The first time, it downloads the hand tracking model (7.5 MB) into `models\`.
2. Click **CLICK TO START** and allow the camera.
3. Sit or stand about **1 metre** from the webcam, palms towards the camera.
   Your two hands become the capybara's two paws on the screen.
4. **PLAY** -> dress up your chef (hat + apron) -> choose a level.
   The first time, a short **training** teaches every move (SKIP or Enter to skip).
   **HOW TO PLAY** on the title screen replays it.

Menus: hold a paw over a button for one second, or make a fist on it.

| Your hands                                      | In the kitchen                          |
|-------------------------------------------------|-----------------------------------------|
| Make a **fist** on an ingredient                | grab it from the belt                   |
| **Open** your hand over the bowl                | drop it in                              |
| **Clap** your hands (or fist twice on the egg)  | crack the egg                           |
| **Shake** a hand left-right over the bowl       | whisk                                   |
| Draw **circles** over the bowl                  | stir                                    |
| Fist on the **bowl**, carry it, open on the tin | pour the batter                         |
| Fist on the **tin**, open it in the oven        | bake                                    |
| Fist on the **oven** when the gauge is GREEN    | take it out (perfect bake!)             |
| Circles / shaking over the baked cake           | frost / sprinkle                        |
| Fist on a strawberry or cherry, open on the cake| put the topping on                      |

The recipe is always shown at the bottom of the screen (ingredients and moves,
in order, the current one blinking); the counter shows what to do right now.
Right step = points, and every 3 good steps in a row raise the combo
(up to x3). A wrong ingredient bounces out of the bowl: **Oops!**, the combo
is lost (and points on Chef / Master). Each order has a timer; time left is a
bonus. Stars per cake: no mistakes and a perfect bake = 3 stars.

Secrets: capybaras love mandarins - drop one on the chef's head. Veggies
dropped on the capybara get eaten. Do not feed it the chili.

### Levels

| Level        | Belt   | Recipes                   | Penalty | Hints                       |
|--------------|--------|---------------------------|---------|-----------------------------|
| Baby Capy    | slow   | cupcakes, biscuits, muffins | none  | glowing target + dotted path |
| Chef Capy    | normal | + strawberry & chocolate cake | small | glowing target           |
| Master Capy  | fast   | + Capy Honey Cake         | big     | none, tighter green zone    |

### Mouse / keyboard

No webcam? The mouse is a paw: click and hold = fist, release = open,
**Space** = clap. Works with a touch screen too.

P pause, M mute, V hide the camera picture, R retry the camera,
Enter confirm / skip the training, Esc back to the menu.

## Troubleshooting

- **"Camera blocked"**: allow the camera for localhost in the address bar,
  close other apps that use the webcam, then press R.
- **"Hand model missing"**: the computer was offline at the first start.
  Go online once and press R (or restart start.bat).
- **Fist not detected**: show the palm to the camera, a bit closer; fingers
  should fold clearly. Thresholds: `GESTURE.fistClose` / `fistOpen` in `src/config.js`.
- **Arms get tired / cannot reach the corners**: make the `CAM` box smaller
  in `src/config.js` (less movement for the whole screen).
- **Slow tracking**: open http://localhost:8085/?delegate=CPU or close heavy tabs.
- **Opening index.html directly does not work**: browsers block the webcam and
  JavaScript modules for files. Always use start.bat.

## Project layout

```
index.html, css/style.css   page and start card
src/main.js                  wiring, screens, menu buttons, main loop
src/config.js                every tuning constant (levels, gestures, layout, score)
src/data/                    recipes.js (ingredients, recipes), outfits.js (hats, aprons)
src/input/                   HandTracker (webcam + MediaPipe, 2 hands), HandGestures (landmarks
                             -> paws, open/fist), Motion (whisk, stir, clap detectors), InputManager
src/game/                    Kitchen (all the rules), Tutorial (training), Bot (robot chef)
src/render/                  Renderer (screens, HUD, recipe bar), scene (factory, belt, oven),
                             art (ingredients, capybara, outfits, tins), Particles
src/audio/Sound.js           synthesised sound effects and music
vendor/mediapipe/            Google MediaPipe Tasks Vision 0.10.14 (Apache-2.0)
models/                      hand_landmarker.task (downloaded by start.bat, Apache-2.0)
fonts/                       Fredoka (SIL Open Font License)
tests/                       automated tests, gallery.html (all drawings), dev-server.mjs
serve.ps1, start.bat         local web server for Windows, nothing to install
```

Debug addresses: `/?demo` watch the robot chef play (`&level=easy|normal|hard`),
`/?auto&screen=game&level=hard` skip the start card, `/tests/gallery.html`
every drawing on one page.

## Tests

With Node.js installed: `npm test`. The tests check open hand / fist detection
on synthetic hands, which hand is which paw, the whisk / stir / clap detectors,
the kitchen rules (wrong ingredient, eggs, baking too early / perfect / burnt,
timer, the mandarin secret), the training, and complete games played by the
robot chef on every level and every recipe.

## License

Copyright (C) 2026 François Bianco, Bianco's Labs.

The game's own code (everything except `vendor/`, `models/` and `fonts/`) is
free software: you can redistribute it and/or modify it under the terms of the
GNU General Public License as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.
It is distributed WITHOUT ANY WARRANTY; see [LICENSE](LICENSE) for details.

Third-party parts keep their own license (details and sources in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)):

- `vendor/mediapipe/` - Google MediaPipe Tasks Vision 0.10.14, Apache-2.0
- `models/hand_landmarker.task` - Google MediaPipe Hand Landmarker model, Apache-2.0
- `fonts/` - Fredoka by The Fredoka Project Authors, SIL Open Font License 1.1
