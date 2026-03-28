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
export const T = { EMPTY: 0, STONE: 1, WOOD: 2, ..., GHOST: 19, PILLAR: 20 };
export const WALL_TYPES   = new Set([T.STONE, T.WOOD, T.ORE, T.MOSSY, T.CRYSTAL, T.IRON]);
export const ENTITY_TYPES = new Set([T.PLAYER, T.GOLD, T.GEM, T.BAT, ...]);
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
1. Draw ceiling & floor flat fills + depth gradients
2. `castRays()` → calls `drawColumn` for each screen column (wall textures + fog + crack overlay)
3. `renderSprites()` — billboard sprites depth-clipped against `depthBuffer`
4. `drawHUD()` — health bar, score, minimap, level name

## Key Constraints
- **No bundler / no transpilation** — all files use native ES module `import/export`; must run through the Express server (not `file://`)
- **No external assets** — do not add image or audio files; extend `textures.js` / `audio.js` instead
- **Screen resolution is fixed** at `640×400` (`SCREEN_W` / `SCREEN_H` in `config.js`)

