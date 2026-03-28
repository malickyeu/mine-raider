/* ── mapgen.js ── procedural map generator with connectivity guarantee ── */

import { T } from './config.js';

// ── Helpers ──
function rng(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const SOLID_WALL_TILES = new Set([T.STONE, T.WOOD, T.ORE, T.MOSSY, T.CRYSTAL, T.IRON]);

function isWall(tiles, x, y, width, height) {
    if (x < 0 || y < 0 || x >= width || y >= height) return true;
    return SOLID_WALL_TILES.has(tiles[y][x]);
}

// BFS distance map – returns Map<key, distance> for all reachable cells
function bfsDistance(tiles, width, height, startX, startY) {
    const key = (x, y) => y * width + x;
    const dist = new Map();
    dist.set(key(startX, startY), 0);
    const queue = [[startX, startY]];
    const DIRS = [[1,0],[-1,0],[0,1],[0,-1]];
    while (queue.length > 0) {
        const [cx, cy] = queue.shift();
        const d = dist.get(key(cx, cy));
        for (const [dx, dy] of DIRS) {
            const nx = cx + dx, ny = cy + dy;
            if (isWall(tiles, nx, ny, width, height)) continue;
            const k = key(nx, ny);
            if (dist.has(k)) continue;
            dist.set(k, d + 1);
            queue.push([nx, ny]);
        }
    }
    return dist;
}

// Carve an L-shaped corridor between two points
function carveCorridor(tiles, x1, y1, x2, y2) {
    if (Math.random() < 0.5) {
        for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) tiles[y1][x] = T.EMPTY;
        for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) tiles[y][x2] = T.EMPTY;
    } else {
        for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) tiles[y][x1] = T.EMPTY;
        for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) tiles[y2][x] = T.EMPTY;
    }
}

// Scatter wall accent tiles (ore veins, mossy patches etc.)
function addWallAccents(tiles, width, height, wallType, accentType, probability) {
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            if (tiles[y][x] === wallType && Math.random() < probability) {
                tiles[y][x] = accentType;
            }
        }
    }
}

/**
 * Generate a random map with guaranteed player→exit connectivity via BFS.
 *
 * @param {Object} options
 * @param {number} options.width       Map width  (default 24)
 * @param {number} options.height      Map height (default 24)
 * @param {number} options.wallType    Primary wall tile (T.STONE / T.MOSSY / T.CRYSTAL / T.IRON)
 * @param {number} options.roomCount   Target room count (default 8)
 * @param {string} options.difficulty  'easy' | 'normal' | 'hard'
 * @returns {Object} mapData  { width, height, tiles, name }
 */
export function generateMap({
    width    = 24,
    height   = 24,
    wallType = T.STONE,
    roomCount = 8,
    difficulty = 'normal',
} = {}) {

    // ── 1. Fill grid with the chosen wall type ──
    const tiles = Array.from({ length: height }, () => new Array(width).fill(wallType));

    // ── 2. Generate non-overlapping rooms ──
    const rooms = [];
    const MAX_ATTEMPTS = roomCount * 25;
    const maxRW = Math.max(4, Math.min(8, Math.floor(width  / 4)));
    const maxRH = Math.max(4, Math.min(7, Math.floor(height / 4)));

    for (let attempt = 0; attempt < MAX_ATTEMPTS && rooms.length < roomCount; attempt++) {
        const rw = rng(3, maxRW);
        const rh = rng(3, maxRH);
        const rx = rng(1, width  - rw - 2);
        const ry = rng(1, height - rh - 2);
        const overlap = rooms.some(r =>
            rx - 1 <= r.x2 && rx + rw >= r.x1 - 1 &&
            ry - 1 <= r.y2 && ry + rh >= r.y1 - 1
        );
        if (!overlap) rooms.push({ x1: rx, y1: ry, x2: rx + rw - 1, y2: ry + rh - 1 });
    }

    // Guarantee at least 2 rooms (fallback corners)
    if (rooms.length < 2) {
        rooms.push({ x1: 1, y1: 1, x2: 5, y2: 5 });
        rooms.push({ x1: width - 7, y1: height - 7, x2: width - 2, y2: height - 2 });
    }

    // ── 3. Carve rooms ──
    const centerOf = r => ({
        x: Math.floor((r.x1 + r.x2) / 2),
        y: Math.floor((r.y1 + r.y2) / 2),
    });

    for (const r of rooms) {
        for (let cy = r.y1; cy <= r.y2; cy++)
            for (let cx = r.x1; cx <= r.x2; cx++)
                tiles[cy][cx] = T.EMPTY;
    }

    // ── 4. Connect all rooms (Prim's MST on room centers) ──
    const connected   = new Set([0]);
    const unconnected = new Set(rooms.map((_, i) => i).slice(1));

    while (unconnected.size > 0) {
        let bestDist = Infinity, from = -1, to = -1;
        for (const i of connected) {
            const ci = centerOf(rooms[i]);
            for (const j of unconnected) {
                const cj = centerOf(rooms[j]);
                const d = Math.abs(ci.x - cj.x) + Math.abs(ci.y - cj.y);
                if (d < bestDist) { bestDist = d; from = i; to = j; }
            }
        }
        const cf = centerOf(rooms[from]);
        const ct = centerOf(rooms[to]);
        carveCorridor(tiles, cf.x, cf.y, ct.x, ct.y);
        connected.add(to);
        unconnected.delete(to);
    }

    // ── 5. Enforce solid border ──
    for (let x = 0; x < width;  x++) { tiles[0][x]        = wallType; tiles[height-1][x] = wallType; }
    for (let y = 0; y < height; y++) { tiles[y][0]         = wallType; tiles[y][width-1]  = wallType; }

    // ── 6. Place player in first room ──
    const sc = centerOf(rooms[0]);
    tiles[sc.y][sc.x] = T.PLAYER;

    // ── 7. Find FARTHEST reachable room (BFS) and place exit there ──
    //    This guarantees exit is always reachable and provides the longest path.
    const distMap = bfsDistance(tiles, width, height, sc.x, sc.y);
    const cellKey = (x, y) => y * width + x;

    let exitRoom = rooms[rooms.length - 1];
    let maxDist  = -1;
    for (let i = 1; i < rooms.length; i++) {
        const c = centerOf(rooms[i]);
        const d = distMap.get(cellKey(c.x, c.y));
        if (d !== undefined && d > maxDist) { maxDist = d; exitRoom = rooms[i]; }
    }
    const ec = centerOf(exitRoom);
    tiles[ec.y][ec.x] = T.EXIT;

    // ── 8. Collect free cells for entity placement ──
    const allEmpty    = [];
    const nonStartEmpty = [];
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            if (tiles[y][x] !== T.EMPTY) continue;
            const inStart = x >= rooms[0].x1 && x <= rooms[0].x2 &&
                            y >= rooms[0].y1 && y <= rooms[0].y2;
            allEmpty.push({ x, y });
            if (!inStart) nonStartEmpty.push({ x, y });
        }
    }

    // Difficulty table (counts scale with number of rooms)
    const scale = Math.max(1, rooms.length / 8);
    const DS = {
        easy:   { bats: 1, skeletons: 0, spiders: 1, ghosts: 0, gold: 4, gems: 2, health: 3, torches: rooms.length },
        normal: { bats: 2, skeletons: 1, spiders: 2, ghosts: 1, gold: 3, gems: 1, health: 2, torches: Math.ceil(rooms.length * 0.8) },
        hard:   { bats: 3, skeletons: 2, spiders: 3, ghosts: 2, gold: 2, gems: 1, health: 1, torches: Math.ceil(rooms.length * 0.5) },
    }[difficulty] ?? { bats:2, skeletons:1, spiders:2, ghosts:1, gold:3, gems:1, health:2, torches: Math.ceil(rooms.length*0.8) };

    // Helper: place N entities from a shuffled pool
    const placeEntities = (type, count, pool) => {
        const p = shuffle(pool);
        let placed = 0;
        for (const cell of p) {
            if (placed >= count) break;
            if (tiles[cell.y][cell.x] === T.EMPTY) {
                tiles[cell.y][cell.x] = type;
                placed++;
            }
        }
    };

    placeEntities(T.TORCH,    Math.round(DS.torches),                               allEmpty);
    placeEntities(T.HEALTH,   Math.max(1, Math.round(DS.health * scale)),           allEmpty);
    placeEntities(T.GOLD,     Math.max(2, Math.round(DS.gold    * scale)),          allEmpty);
    placeEntities(T.GEM,      Math.max(1, Math.round(DS.gems    * scale)),          allEmpty);
    placeEntities(T.BAT,      Math.max(0, Math.round(DS.bats    * scale)),          nonStartEmpty);
    placeEntities(T.SKELETON, Math.max(0, Math.round(DS.skeletons * scale)),        nonStartEmpty);
    placeEntities(T.SPIDER,   Math.max(0, Math.round(DS.spiders * scale)),          nonStartEmpty);
    placeEntities(T.GHOST,    Math.max(0, Math.round(DS.ghosts  * scale)),          nonStartEmpty);

    // ── 9. Wall accent decoration ──
    if (wallType === T.STONE) {
        addWallAccents(tiles, width, height, T.STONE,   T.ORE,   0.05);
        addWallAccents(tiles, width, height, T.STONE,   T.MOSSY, 0.04);
    } else if (wallType === T.MOSSY) {
        addWallAccents(tiles, width, height, T.MOSSY,   T.STONE, 0.06);
        addWallAccents(tiles, width, height, T.MOSSY,   T.ORE,   0.03);
    } else if (wallType === T.CRYSTAL) {
        addWallAccents(tiles, width, height, T.CRYSTAL, T.IRON,  0.05);
    } else if (wallType === T.IRON) {
        addWallAccents(tiles, width, height, T.IRON,    T.STONE, 0.05);
        addWallAccents(tiles, width, height, T.IRON,    T.ORE,   0.03);
    }

    // Always add some breakable wood walls (shortcuts / variety)
    addWallAccents(tiles, width, height, wallType, T.WOOD, 0.025);

    return { width, height, tiles, name: 'Generated Map' };
}
