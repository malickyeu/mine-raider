# AGENTS.md – Mine Raider Codebase Guide

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
| `js/main.js` | State machine (`menu` → `game` → `editor`), game loop, breakable-wall HP tracking |
| `js/map.js` | Campaign level definitions (inline 2-D tile arrays), localStorage save/load |
| `js/mapgen.js` | Procedural level generator; BFS connectivity guarantee |
| `js/raycaster.js` | DDA ray-marching; returns `depthBuffer[]` + calls `drawColumn` callback |
| `js/renderer.js` | Orchestrates ceiling/floor/walls/sprites/HUD per frame |
| `js/textures.js` | Generates all wall & sprite textures on `<canvas>` (no image files) |
| `js/sprites.js` | Billboard sprite rendering; clips against `depthBuffer` from raycaster |
| `js/entities.js` | `Player`, `Enemy` subclasses (`Bat`, `Spider`, `Skeleton`, `Ghost`), collectibles |
| `js/collision.js` | AABB slide collision; axes tested independently to allow wall-sliding |
| `js/audio.js` | Web Audio oscillator SFX; no audio files |
| `js/hud.js` | Health bar, score, minimap, help overlay toggle |
| `js/i18n.js` | Czech / English strings via `t(key)`; persisted in `localStorage` |
| `js/input.js` | `isDown(code)` + pointer-lock mouse delta |
| `js/editor.js` | Grid map editor with palette, resize, save/load |

## Critical Patterns

### Tile Type System (`config.js`)
Every tile (walls, entities, collectibles) is a number defined in the `T` object:
```js
export const T = { EMPTY: 0, STONE: 1, WOOD: 2, ..., GHOST: 19, PILLAR: 20, HEALTH_SMALL: 21, DOOR: 22, KEY_RED: 23, KEY_BLUE: 24, DOOR_RED: 25, DOOR_BLUE: 26 };
export const WALL_TYPES   = new Set([T.STONE, T.WOOD, T.ORE, T.MOSSY, T.CRYSTAL, T.IRON, T.DOOR, T.DOOR_RED, T.DOOR_BLUE]);
export const ENTITY_TYPES = new Set([T.PLAYER, T.GOLD, T.GEM, T.BAT, ..., T.KEY_RED, T.KEY_BLUE]);
export const LOCKED_DOOR_TYPES = new Set([T.DOOR_RED, T.DOOR_BLUE]);
export const ALL_DOOR_TYPES    = new Set([T.DOOR, T.DOOR_RED, T.DOOR_BLUE]);
export const DOOR_KEY_MAP      = { [T.DOOR_RED]: T.KEY_RED, [T.DOOR_BLUE]: T.KEY_BLUE };
```
**Adding a new tile type** requires updates in: `T`, the appropriate Set (`WALL_TYPES` or `ENTITY_TYPES`), `TILE_COLORS`, `TILE_LABEL_KEYS`, and a texture generator in `textures.js`.

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
3. `castRays(mapData, ..., doorStates)` → calls `drawColumn` for each screen column (wall textures + thin-door rendering + fog + crack overlay)
4. `renderSprites()` — billboard sprites depth-clipped against `depthBuffer`
5. `ctx.restore()` — remove bob/shake offset
6. `drawHUD()` — health bar, score, minimap (with door state lines), level name

## Key Constraints
- **No bundler / no transpilation** — all files use native ES module `import/export`; must run through the Express server (not `file://`)
- **No external assets** — do not add image or audio files; extend `textures.js` / `audio.js` instead
- **Screen resolution is fixed** at `640×400` (`SCREEN_W` / `SCREEN_H` in `config.js`)

