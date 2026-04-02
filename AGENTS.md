# AGENTS.md – Mine Raider Codebase Guide
> Version **0.7.0** · Last updated 2026-04-02

## Project Overview
Wolfenstein 3D-style raycasting game in **vanilla JavaScript + HTML5 Canvas**. No bundler, no game engine, no external assets — textures and audio are all procedurally generated at runtime.

## Dev Workflow
```bash
npm install          # install Express (only dependency)
npm start            # serve at http://localhost:3000
npm run dev          # auto-restart server on file change (node --watch)
```
No build step. Changes to `js/` or `index.html` take effect on browser reload. The server (`server.js`) only exists to set correct `Content-Type: application/javascript` MIME types for ES modules.

## Architecture: Module Map

| File | Responsibility |
|---|---|
| `js/config.js` | All constants + the `T` tile-type enum + `WALL_TYPES` / `ENTITY_TYPES` sets |
| `js/main.js` | State machine (`menu` → `game` → `editor`), game loop, breakable-wall HP tracking, barrel explosions |
| `js/map.js` | Campaign level definitions (inline 2-D tile arrays), localStorage save/load |
| `js/mapgen.js` | Procedural level generator; BFS connectivity guarantee |
| `js/raycaster.js` | DDA ray-marching; returns `depthBuffer[]` + calls `drawColumn` callback |
| `js/renderer.js` | Orchestrates ceiling/floor/walls/sprites/HUD per frame; dynamic lighting from torches + mine lights |
| `js/textures.js` | Generates all wall & sprite textures on `<canvas>` (no image files) |
| `js/sprites.js` | Billboard sprite rendering; clips against `depthBuffer` from raycaster |
| `js/entities.js` | `Player`, `Enemy` subclasses (`Bat`, `Spider`, `Skeleton`, `Ghost`), collectibles, decorations (`Barrel`, `MineLight`, `MineCart`, `PickaxeDecor`) |
| `js/collision.js` | AABB slide collision; axes tested independently to allow wall-sliding |
| `js/audio.js` | Web Audio oscillator SFX **+ ambient soundtrack** (`startAmbient` / `stopAmbient` / `updateAmbient`) **+ per-enemy SFX** (`sfxEnemyAttack(type)` / `sfxEnemyDie(type)`) **+ settings toggles** (`toggleSfx` / `toggleAmbient`); no audio files |
| `js/hud.js` | Health bar, score, minimap, help overlay toggle |
| `js/i18n.js` | Czech / English strings via `t(key)`; persisted in `localStorage` |
| `js/input.js` | `isDown(code)` + pointer-lock mouse delta |
| `js/editor.js` | Grid map editor with palette, resize, save/load |

## Critical Patterns

### Tile Type System (`config.js`)
Every tile (walls, entities, collectibles) is a number defined in the `T` object:
```js
export const T = { EMPTY: 0, STONE: 1, WOOD: 2, ..., GHOST: 19, PILLAR: 20, HEALTH_SMALL: 21, DOOR: 22, KEY_RED: 23, KEY_BLUE: 24, DOOR_RED: 25, DOOR_BLUE: 26, FLASHLIGHT: 27, BARREL: 28, MINE_LIGHT: 29, MINE_CART: 30, PICKAXE_DECOR: 31 };
export const WALL_TYPES   = new Set([T.STONE, T.WOOD, T.ORE, T.MOSSY, T.CRYSTAL, T.IRON, T.DOOR, T.DOOR_RED, T.DOOR_BLUE]);
export const ENTITY_TYPES = new Set([T.PLAYER, T.GOLD, T.GEM, T.BAT, ..., T.KEY_RED, T.KEY_BLUE, T.FLASHLIGHT, T.BARREL, T.MINE_LIGHT, T.MINE_CART, T.PICKAXE_DECOR]);
export const LOCKED_DOOR_TYPES = new Set([T.DOOR_RED, T.DOOR_BLUE]);
export const ALL_DOOR_TYPES    = new Set([T.DOOR, T.DOOR_RED, T.DOOR_BLUE]);
export const DOOR_KEY_MAP      = { [T.DOOR_RED]: T.KEY_RED, [T.DOOR_BLUE]: T.KEY_BLUE };
```
**Adding a new tile type** requires updates in: `T`, the appropriate Set (`WALL_TYPES` or `ENTITY_TYPES`), `TILE_COLORS`, `TILE_LABEL_KEYS`, a texture generator in `textures.js`, i18n keys in `i18n.js` (both languages), and an editor icon + group in `editor.js`.

### Procedural Textures (`textures.js`)
Each wall/sprite type has a dedicated `genXxx()` function that draws onto an off-screen `<canvas>` using Canvas 2D API. Results are cached by tile type. To add a new wall texture: write `genXxx()` and register it in `getTexture(tileType)`.

### Campaign Levels (`map.js`)
Levels are defined as literal 2-D arrays with single-letter variable aliases for readability:
```js
const S = T.STONE, D = T.WOOD, P = T.PLAYER, E = T.EXIT, _ = T.EMPTY;
const tiles = [[S,S,...],[S,P,_,...], ...];
return { width: W, height: H, tiles, nameKey: 'level1Name' };
```
`nameKey` maps to an i18n key resolved at runtime via `t()`.

### Breakable Walls (`main.js`)
HP is tracked in a plain object keyed by `"x,y"` string, separate from the map grid:
```js
let breakableWalls = {};  // "x,y" → remaining HP (initial: WALL_HP[T.WOOD] = 3)
```
Wood walls adjacent to doors (`T.DOOR`) cannot be broken.

### Door System (`raycaster.js`, `main.js`)
Doors are Wolf3D-style thin walls at tile center with 3D square frame posts:
```js
let doorStates = {};  // "x,y" → { open: 0..1, opening: bool, closing: bool, closeTimer: number }
```
- **Orientation** auto-detected from neighbors: walls above/below → vertical door (N-S)
- **Raycaster** handles doors via multi-plane intersection (center plane + frame post AABBs), not standard DDA wall hit
- **Collision**: `isWall(mapData, gx, gy, doorStates)` — open doors (≥90%) are passable; `doorStates` must be passed through `moveWithCollision`
- **Auto-close** after 3 s; blocked if entity stands in tile
- Interaction key: `F` (not `E` — `E` was previously rotation)

### Locked Doors & Keys (`config.js`, `main.js`, `entities.js`)
Two colored locked door types (`T.DOOR_RED`, `T.DOOR_BLUE`) and matching key entities (`T.KEY_RED`, `T.KEY_BLUE`):
- **Locked doors** render like regular doors but with red/blue tinted textures and a lock icon
- **Keys** are collectible billboard sprites stored in `player.keys` (a `Set`)
- Pressing `F` at a locked door checks `player.keys.has(DOOR_KEY_MAP[tile])`; if missing → `sfxDoorLocked()` plays; if present → `doorStates[key].unlocked = true` is set and the door opens normally — **the tile type is never changed**, so the colored texture and minimap color are always preserved
- **Minimap** shows locked doors in matching color (#ff4444 red, #4488ff blue)
- **HUD** draws small key icons next to the score when keys are collected
- **Map generator** (`mapgen.js`) places locked doors at corridor chokepoints; BFS ensures keys are reachable without passing through their own locked door
- Keys persist across campaign levels (carried like score/HP)

### Head Bob & Screen Shake (`renderer.js`, `entities.js`)
`player.bobPhase` drives Y-offset via `ctx.translate()` at frame start. `player.shakeTimer` (set in `takeDamage()`) adds random X/Y jitter. HUD is drawn after `ctx.restore()` so it stays stable.

### Ghost Special Behavior (`entities.js`)
`Ghost` bypasses `isWall()` checks during movement — the only entity that ignores wall collisions. Handle this explicitly when touching enemy pathfinding.

### Explosive Barrels (`main.js`, `entities.js`)
`Barrel` entity (`T.BARREL`) — explodes on pickaxe hit OR when an enemy walks into it (dist < 0.6):
- **Chain explosions**: barrels within `BARREL_EXPLOSION_RADIUS` (2.5) of an exploding barrel also detonate
- **Area damage**: damages player & enemies within radius; breaks wood walls (unless adjacent to doors)
- **Collision**: blocks movement like pillars; `ent.exploding` barrels become walk-through
- `triggerBarrelExplosion()` in `main.js` is the recursive entry point; uses `processedBarrels` Set to prevent infinite loops
- Barrel briefly stays alive in `exploding` state (0.3 s) for explosion sprite rendering

### Light-Emitting Entities (`renderer.js`, `sprites.js`)
Both `Torch` and `MineLight` entities have a `lightRadius` property and `flickerPhase`:
- Torch: `lightRadius = 4.8`, fast flicker
- MineLight: `lightRadius = 3.5`, slower/steadier flicker
- The renderer filters nearby light sources via `e.lightRadius > 0` (not by tile type), then uses each entity's `lightRadius` for per-surface and per-sprite brightness calculations

### Decorative Entities
- **MineCart** (`T.MINE_CART`): blocks movement (collision handled alongside `Pillar`)
- **PickaxeDecor** (`T.PICKAXE_DECOR`): walk-through decoration, no interaction
- Both are rendered as billboard sprites; mine cart renders at full wall height

### i18n (`i18n.js`)
All UI strings go through `t(key)`. Some values are functions:
```js
winAllText: (n, s) => `Prošel jsi všech ${n} úrovní! Celkové skóre: ${s}`
```
Language persisted under `localStorage` key `mine_raider_lang`; map saved under `mine_raider_map`.

### Rendering Pipeline (per frame)
`renderer.js → renderFrame()`:
1. Apply head bob + screen shake via `ctx.translate()`
2. Draw ceiling & floor flat fills + depth gradients
3. `castRays(mapData, ..., doorStates)` → calls `drawColumn` for each screen column (wall textures + thin-door rendering + fog + crack overlay + dynamic torch/mine-light illumination)
4. `renderSprites()` — billboard sprites depth-clipped against `depthBuffer`; exploding barrels use explosion texture
5. `ctx.restore()` — remove bob/shake offset
6. `drawHUD()` — health bar, score, minimap (with door state lines), level name

### Weapon System (`config.js`, `entities.js`, `main.js`, `renderer.js`, `hud.js`, `textures.js`)
Four weapons selectable via keys `1–4`; SPACE fires/swings:
- **Pickaxe** (default, unlimited): melee 1× damage, 0.4 s cooldown
- **Warhammer** (`T.WARHAMMER` pickup): melee 2× damage, 0.6 s cooldown
- **Crossbow** (`T.CROSSBOW` pickup + `T.AMMO_BOLT` ammo): hit-scan with full wall LOS check; `WEAPON_STATS.crossbow.damage = 1.5` → 2 `takeDamage()` calls
- **Dynamite** (`T.AMMO_DYNAMITE` ammo auto-unlocks weapon): hold SPACE to charge throw power (`player.weaponThrowTimer` increments in `Player.update()`), release to throw `DynamiteThrown` entity; 2 s fuse then `triggerDynamiteExplosion()` in `main.js`

Key patterns:
- `player.weapons[id] = { owned, ammo }` — ammo = -1 means unlimited
- `player.currentWeapon` — active weapon id string; switched with keys 1–4 only if `owned`
- `player.weaponThrowTimer` — incremented exclusively in `entities.js Player.update()`; **do not also increment in main.js** (was a double-count bug)
- `throwDynamite(power)` always resets `player.weaponThrowTimer = 0` even on no ammo to prevent infinite re-trigger
- FP weapon textures drawn in `renderer.js`; charge-up animation via `player.weaponThrowTimer > 0`; swing via `player.attackTimer > 0`
- Dynamite charge bar rendered in `hud.js` when `currentWeapon === 'dynamite' && weaponThrowTimer > 0`
- Campaign map pickups: Level 2 → Warhammer; Level 3 → Crossbow + Bolts; Level 4 → Bolts + Dynamite; Level 5 → more ammo
- Generated maps (`mapgen.js`): `C.warhammer/crossbow/ammoBolt/ammoDyn` counts per difficulty

### Ambient Soundtrack (`audio.js`, `main.js`)
Procedural in-game ambient track; no audio files:
- **`startAmbient()`** — creates (idempotent: skips if already running): drone (two detuned 55 Hz sines), cave noise (white noise → lowpass), tension sawtooth layer. Fades in over 2.5 s. Called from `startGame()`.
- **`stopAmbient()`** — fades master gain out, schedules oscillator `.stop()` in 3 s, clears drip timer. Called in `switchState` for any state except `'game'` / `'nextlevel'` so ambient persists across level transitions.
- **`updateAmbient(playerHp, nearestEnemyDist)`** — called every frame; modulates tension gain + noise filter cutoff (enemy proximity) and drone pitch (HP). Uses `setTargetAtTime` so changes are smooth.
- **Water drips** — random `setTimeout` chain (5–19 s intervals) plays sine plops ± faint echo while ambient is running.

### Per-Enemy SFX (`audio.js`, `main.js`, `entities.js`)
- `sfxEnemyAttack(type)` — per-type attack sound (bat screech, spider hiss, skeleton rattle, ghost wail); layered on top of generic `sfxHit()`
- `sfxEnemyDie(type)` — per-type death sound; called from `main.js` with `ent.type`
- **Hit detection**: `main.js` snapshots `hpBefore = player.hp` before entity updates; if HP decreased → fires `sfxHit()` + `sfxEnemyAttack(player.lastHitByType)`
- `player.lastHitByType` — set in `Enemy.update()` when contact damage is dealt; consumed and reset in `main.js` after entity loop; avoids audio import in `entities.js`

### Settings Screen (`main.js`, `audio.js`, `i18n.js`)
State `'settings'` — submenu accessible from main menu via `⚙️ Nastavení`:
- **SFX toggle**: `toggleSfx()` / `isSfxEnabled()` — gates `playTone()` calls; persisted as `mine_raider_sfx` in localStorage
- **Ambient toggle**: `toggleAmbient()` / `isAmbientEnabled()` — live mutes/unmutes master gain if ambient is running; persisted as `mine_raider_ambient`
- **Language toggle**: moved here from main menu
- Settings are independent — SFX and ambient can be toggled separately

### Keyboard Navigation (`main.js`)
All menu screens fully navigable without mouse:
- **Arrow keys** move visual focus (`kb-focus` CSS class) between buttons
- **Enter / Numpad Enter** (`e.key === 'Enter'`) confirms focused button
- **ESC / Backspace** goes back (Backspace skipped inside `<input>` elements)
- **Critical pattern**: keydown handler uses `return` after Enter action to prevent synchronous state-change cascade (e.g., Enter on menu → `switchState('settings')` → same keydown event would re-trigger settings handler without the `return`)
- `document.activeElement.blur()` called at start of every `switchState` to prevent focus-trap on hidden buttons

## Key Constraints
- **No bundler / no transpilation** — all files use native ES module `import/export`; must run through the Express server (not `file://`)
- **No external assets** — do not add image or audio files; extend `textures.js` / `audio.js` instead
- **Screen resolution is fixed** at `640×400` (`SCREEN_W` / `SCREEN_H` in `config.js`)
