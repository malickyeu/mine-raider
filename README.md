# ⛏️ Mine Raider – Treasure of the Old Mines

> A Wolfenstein 3D-style raycasting game built entirely in **vanilla JavaScript** and **HTML5 Canvas** — no game engine, no bundler, no image or audio assets required.

🕹️ **[LIVE DEMO → mine-raider.koduj.dev](https://mine-raider.koduj.dev/)**

![Mine Raider Menu](docs/screenshot.png)

---

## 🎮 About

Mine Raider drops you into a series of abandoned mine shafts filled with traps, monsters, and hidden treasure. Navigate dark corridors, smash through wooden barriers with your pickaxe, collect gold and gems, and find the exit before the monsters find you.

Everything — wall textures, sprites, sounds — is **procedurally generated at runtime** using the Canvas 2D API and Web Audio API.

---

## ✨ Features

| Category | Details |
|---|---|
| **Rendering** | DDA raycasting engine (Wolf3D-style), textured walls, distance fog, floor/ceiling gradients, head bob & screen shake on damage |
| **Wall types** | Stone, Wood *(breakable)*, Ore, Mossy Stone, Crystal, Iron, **Door** *(openable, Wolf3D-style thin wall with 3D frame)* |
| **Enemies** | Bat, Spider, Skeleton, Ghost *(phases through walls!)* |
| **Collectibles** | Gold coins, Gemstones, Health packs (large +40 HP, small +15 HP), **Lantern** 🔦 *(unlocks dynamic lighting cone)*, Keys 🔑 |
| **Decorations** | Torches *(flickering ambient light)*, Stone pillars, **Mine lights** 💡 *(ambient glow)*, **Mine carts** 🛒 *(block movement)*, **Pickaxes** ⛏️ |
| **Explosive barrels** | `T.BARREL` — detonate with pickaxe or enemy contact; chain explosions, area damage to player/enemies/wood walls, screen shake |
| **Doors** | Press `F` to open; auto-close after 3 s; 3D square frame posts; wood walls adjacent to doors cannot be broken |
| **Locked doors** | Red 🔴 / Blue 🔵 locked doors require matching keys; keys carried across campaign levels |
| **Flashlight** | Collectible lantern widens the lighting cone; toggle on/off with `L`; HUD shows ON/OFF state |
| **Fog of War** | Minimap reveals only explored areas via BFS flood-fill (stops at walls/closed doors); distant explored tiles dimmed; static entity icons shown |
| **Campaign** | 5 hand-crafted levels of increasing size and difficulty |
| **Difficulty** | Miner / Prospector / Deep Delver — scales enemy HP, speed, damage and attack rate |
| **Sprint** | Hold `Shift` to move 1.6× faster; stamina bar in HUD drains and regenerates |
| **Map editor** | Grid-based editor with grouped icon palette (tooltips on hover), level selector, resize, save/load, map generator |
| **Map generator** | Configurable size/rooms/difficulty/**target score**; BFS connectivity guarantee; locked door placement; dynamic room cap; items placed near walls |
| **High score** | Per-difficulty best score in `localStorage`; shown on difficulty screen and end screens |
| **i18n** | Czech 🇨🇿 / English 🇬🇧 UI language switch (persisted in localStorage) |
| **Audio** | **Ambient soundtrack** *(drone + cave noise + tension + water drips; modulated by HP and enemy proximity)*, per-enemy SFX *(bat screech, spider hiss, skeleton rattle, ghost wail)* — all procedurally generated, no audio files |
| **Settings** | Submenu accessible from main menu: SFX on/off, Music on/off, Language toggle — all persisted in localStorage |
| **Keyboard navigation** | Full arrow-key + Enter navigation in menu, difficulty, settings, and overlays; ESC / Backspace to go back |
| **HUD** | Health bar, stamina bar, score, minimap with FoW + entity icons, level name + difficulty badge, key icons, flashlight indicator |
| **Help overlay** | In-game help screen (press `H`) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18 or newer
- A modern browser (Chrome, Firefox, Edge)

### Install & Run

```bash
git clone <repo-url>
cd action-game
npm install
npm start
```

Then open **http://localhost:3000** in your browser.

For development with automatic server restart on file changes:

```bash
npm run dev
```

---

## 🕹️ Controls

| Key | Action |
|---|---|
| `W A S D` / Arrow keys | Move / Navigate menus |
| `Shift` | Sprint (1.6× speed, drains stamina) |
| Mouse | Look around (click canvas to lock pointer) |
| `Space` | Swing pickaxe — attack enemies, break wood walls |
| `1` `2` `3` `4` | Switch weapon (Pickaxe / Warhammer / Crossbow / Dynamite) |
| `F` | Open / close doors (locked doors need matching key) |
| `L` | Toggle lantern on / off |
| `M` | Toggle minimap |
| `H` | Toggle help overlay |
| `Enter` / `Numpad Enter` | Confirm menu selection |
| `ESC` / `Backspace` | Return to menu (or editor when playing a custom map) |

---

## 🏔️ Campaign Levels

| # | Name | Size | New elements |
|---|---|---|---|
| 1 | Abandoned Mine | 20×20 | Basics – bats, gold, wood beams |
| 2 | Overgrown Shafts | 24×24 | Mossy stone walls, spiders |
| 3 | Crystal Caves | 24×24 | Crystal & iron walls, ghosts |
| 4 | Deep Tunnels | 28×28 | All wall types, mixed enemies, **red & blue locked doors + keys** |
| 5 | Cursed Depths | 30×30 | Maximum difficulty, all enemy types |

Score and HP carry over between levels. Find the **green exit door 🚪** to advance.

---

## ⛏️ Breakable Walls

**Wooden walls** (brown beam texture) can be destroyed with 3 pickaxe hits:

1. Face the wall from close range
2. Press `Space` three times
3. The wall darkens with each hit, then disappears — opening a new path

This mechanic unlocks hidden areas and shortcuts in every level.

> **Note:** Wooden walls directly adjacent to a door cannot be broken — they serve as structural supports for the door frame.

---

## 🗝️ Keys & Locked Doors

Some corridors are sealed by **coloured locked doors** — red 🔴 or blue 🔵. They look like regular doors but display a lock icon and require a matching key to open.

1. Find the **red key** 🔑 or **blue key** 🔑 somewhere in the level
2. Walk up to the matching locked door and press `F`
3. The door unlocks permanently and opens like a regular door — it can be closed and re-opened freely afterwards

**HUD:** Collected keys appear as small coloured icons next to your score.  
**Minimap:** Locked doors are shown in their matching colour (red / blue) even after being unlocked.

> In generated maps (editor generator), the locked door sits on the **main path to the exit** — the exit is only reachable after finding the key. The key is always placed in the farthest reachable zone from the player start (never in the starting room), and the locked zone behind the door contains bonus treasure.

---

## 👻 Enemy Types

| Enemy | HP | Speed | Damage | Score | Special |
|---|---|---|---|---|---|
| 🦇 Bat | 2 | Normal | Medium | 50 | — |
| 🕷️ Spider | 2 | **Fast** | Low | 100 | — |
| 💀 Skeleton | 3 | Slow | High | 200 | — |
| 👻 Ghost | 4 | Slow | **Very high** | 300 | Phases through walls |

All enemies patrol randomly until they spot you (line-of-sight check). Ghosts always track you regardless of walls.

---

## 🗺️ Map Editor

Click **Map Editor** from the main menu to open the grid editor.

**Palette** (left panel):
- Click a tile type to select it
- Left-click on the grid to paint
- Right-click to erase

**Level selector dropdown** — load any of the 5 campaign levels as a starting point, then customise and save.

**Validation** — the editor checks for a player start `🧑` and at least one exit `🚪` before letting you play.

**Saving** — maps are stored in browser `localStorage`. Use **💾 Save** before switching levels.

### Placing Pillars
Stone pillars `🪨` are placed like any entity. They:
- Block player movement (push-back collision)
- Render as a tall transparent-edged stone column sprite
- Do not block raycasting (enemies and lines of sight pass through)

---

## 📁 Project Structure

```
action-game/
├── server.js            ← Express static server
├── index.html           ← Single HTML entry point
├── css/
│   └── style.css        ← All UI styles
├── docs/
│   └── screenshot.png   ← Menu screenshot
└── js/
    ├── main.js          ← Game loop, state machine, level progression
    ├── config.js        ← All constants, tile type enum, wall sets
    ├── i18n.js          ← Czech / English translations
    ├── map.js           ← 5 built-in campaign levels, save/load, entity extraction
    ├── mapgen.js        ← Procedural level generator with BFS connectivity guarantee
    ├── raycaster.js     ← DDA raycasting engine (+ thin-door multi-plane intersection)
    ├── renderer.js      ← Frame orchestration (ceiling, floor, walls, sprites, HUD)
    ├── textures.js      ← Procedural wall textures + billboard sprites
    ├── sprites.js       ← Sprite sorting, depth clipping, billboard rendering
    ├── entities.js      ← Player, Enemy, Treasure, Pillar, Exit, Torch, HealthPack, KeyItem, Flashlight
    ├── collision.js     ← AABB grid collision with wall sliding
    ├── input.js         ← Keyboard state + pointer-lock mouse delta
    ├── hud.js           ← Health bar, score, minimap, level name, help overlay
    ├── audio.js         ← Web Audio oscillator SFX (no audio files)
    └── editor.js        ← Grid map editor, palette, level selector
```

---

## 🛠️ Technical Notes

- **No build step** — pure ES modules served as-is via Express (correct MIME types for `import`)
- **No external dependencies** at runtime — only `express` for the dev server
- **Textures** are generated once into `<canvas>` elements and cached; wall columns are drawn with `drawImage` 1px slice technique
- **Sprite rendering** uses painter's algorithm (sorted by distance), depth-buffer clipped against the wall depth buffer
- **Breakable walls** track remaining HP in a `Map` keyed by tile coordinates; damage is visualised as a darkening overlay on each wall column
- **Doors** are Wolf3D-style thin walls rendered at tile centre via multi-plane intersection in the raycaster (centre plane + frame AABBs); door open/close state is tracked per tile with auto-close timer
- **Flashlight** is a collectible entity (`T.FLASHLIGHT`) that enables a lighting cone: fog falloff and vignette are gentler within the player's facing angle; toggled on/off with `L`; `player.flashlightOn` is separate from `player.hasFlashlight` so the state survives level transitions
- **Sprite fog** is applied via `globalAlpha` (not a `fillRect` overlay) to avoid rectangular artefacts on sprites with transparent backgrounds
- **Locked doors** (`T.DOOR_RED`, `T.DOOR_BLUE`) keep their tile type permanently — an `unlocked` flag in `doorStates` records the first successful key use; the coloured texture and minimap colour are always preserved
- **Ambient soundtrack** runs continuously during gameplay: two detuned 55 Hz sine oscillators (drone), white noise through lowpass filter (cave rumble), sawtooth tension layer (fades in with enemy proximity), random water drips; modulated by `updateAmbient(playerHp, nearestEnemyDist)` every frame; can be toggled on/off in Settings submenu
- **Per-enemy SFX** — each enemy type has unique attack and death sounds layered on top of base `sfxHit`; `player.lastHitByType` is set by `Enemy.update()` and consumed by `main.js` after entity loop to fire `sfxEnemyAttack(type)`
- **Head bob & screen shake** apply Y / XY canvas translation before rendering; HUD is drawn after `ctx.restore()` so it remains stable
- **Ghost enemy** skips collision checks and always has line-of-sight, making it the most dangerous enemy type

---

## 📸 Adding an In-Game Screenshot

The `docs/screenshot.png` currently shows the main menu. To replace it with an in-game shot:

1. Start the game (`npm start`)
2. Open http://localhost:3000, play to a nice view
3. Press `F12` → Console → `document.getElementById('game-canvas').toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download='screenshot.png'; a.click() })`
4. Replace `docs/screenshot.png` with the downloaded file

![Mine Raider Game](docs/screenshot2.png)

---

## 📄 License

MIT — do whatever you want with it.
