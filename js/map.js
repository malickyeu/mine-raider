/* ── map.js ── map data, load / save, multi-level campaign ── */

import { T, WALL_TYPES, ENTITY_TYPES } from './config.js';

const STORAGE_KEY = 'mine_raider_map';

// ════════════════════════════════════════
//  Built-in campaign levels
// ════════════════════════════════════════

function level1() {
    const W = 20, H = 20;
    const S = T.STONE, D = T.WOOD, O = T.ORE, _ = T.EMPTY;
    const P = T.PLAYER, G = T.GOLD, M = T.GEM, B = T.BAT, E = T.EXIT, R = T.TORCH, L = T.HEALTH;
    // prettier-ignore
    const tiles = [
        [S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S],
        [S,P,_,_,_,_,D,_,_,_,S,_,_,_,_,_,S,_,_,S],
        [S,_,_,_,_,_,D,_,G,_,S,_,_,_,_,_,S,_,_,S],
        [S,_,_,_,_,_,D,_,_,_,O,_,_,_,_,_,_,_,_,S],
        [S,_,_,S,S,_,_,_,_,_,S,_,_,S,S,_,_,_,_,S],
        [S,_,_,S,R,_,_,_,_,_,S,_,_,S,G,_,_,_,_,S],
        [S,_,_,_,_,_,S,S,D,S,S,_,_,_,_,_,S,S,_,S],
        [S,_,_,_,_,_,S,M,_,_,_,_,_,_,_,S,_,S,_,S],
        [S,_,_,_,B,_,S,_,_,_,_,_,_,_,_,S,_,S,_,S],
        [S,S,D,S,S,_,S,_,_,_,_,_,_,_,_,D,_,S,_,S],
        [S,_,_,_,_,_,_,_,_,S,_,_,S,_,_,S,G,S,_,S],
        [S,_,G,_,_,_,_,_,_,S,_,_,D,_,_,S,_,S,_,S],
        [S,_,_,_,_,S,S,S,_,_,_,_,S,_,_,S,S,S,_,S],
        [S,_,_,_,_,S,L,S,_,_,_,_,S,_,_,_,_,_,_,S],
        [S,_,_,B,_,S,_,_,_,_,_,_,S,_,G,_,_,_,_,S],
        [S,_,_,_,_,_,_,_,_,_,S,S,S,_,_,_,_,_,_,S],
        [S,S,S,D,S,S,_,_,_,_,_,_,_,_,_,S,S,D,S,S],
        [S,_,_,_,_,S,_,_,_,_,_,_,_,_,_,D,_,_,E,S],
        [S,_,G,_,_,D,_,_,_,_,_,_,_,_,_,S,_,_,_,S],
        [S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S],
    ];
    return { width: W, height: H, tiles, nameKey: 'level1Name', name: 'Úroveň 1 – Opuštěný důl' };
}

function level2() {
    const W = 24, H = 24;
    const S = T.STONE, D = T.WOOD, O = T.ORE, Y = T.MOSSY, _ = T.EMPTY;
    const P = T.PLAYER, G = T.GOLD, M = T.GEM, B = T.BAT, K = T.SKELETON, E = T.EXIT, R = T.TORCH, L = T.HEALTH, I = T.SPIDER;
    // prettier-ignore
    const tiles = [
        [S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S],
        [S,P,_,_,_,_,Y,_,_,_,S,_,_,_,_,_,Y,_,_,_,_,_,_,S],
        [S,_,_,_,_,_,Y,_,G,_,S,_,_,_,_,_,Y,_,_,_,_,_,_,S],
        [S,_,_,_,_,_,Y,_,_,_,O,_,_,_,_,_,_,_,_,S,S,S,_,S],
        [S,_,_,S,S,_,_,_,_,_,S,_,_,Y,Y,Y,_,_,_,S,G,S,_,S],
        [S,_,_,S,R,_,_,_,_,_,S,_,_,Y,G,Y,_,_,_,_,_,_,_,S],
        [S,_,_,_,_,_,S,S,D,S,S,_,_,_,_,_,S,_,_,Y,_,_,Y,_,S],
        [S,_,_,_,I,_,S,M,_,_,_,_,_,_,_,S,S,D,S,S,S,S,_,S],
        [S,_,_,_,_,_,S,_,_,_,_,_,_,_,_,S,_,_,_,_,R,S,_,S],
        [S,S,D,S,S,_,S,_,_,S,_,_,_,_,_,S,_,K,_,_,_,S,_,S],
        [S,_,_,_,_,_,_,_,_,S,_,_,Y,Y,_,D,_,_,_,_,_,S,_,S],
        [S,_,G,_,_,_,_,_,_,S,_,_,Y,_,_,S,_,_,_,G,_,S,_,S],
        [S,_,_,_,_,S,S,S,_,_,_,_,D,_,_,S,_,_,_,_,_,S,_,S],
        [S,_,_,_,_,S,L,S,_,_,_,_,Y,_,_,S,S,S,D,S,S,S,_,S],
        [S,_,_,B,_,S,_,S,_,_,_,_,Y,_,G,_,_,_,_,_,_,_,_,S],
        [S,_,_,_,_,_,_,_,_,_,Y,Y,Y,_,_,_,_,_,I,_,_,_,_,S],
        [S,S,S,D,S,S,_,_,_,_,Y,M,Y,_,_,S,S,S,_,_,S,S,S,S],
        [S,_,_,_,_,S,_,_,_,_,Y,_,_,_,_,S,_,_,_,_,_,_,E,S],
        [S,_,G,_,_,D,_,_,_,_,_,_,_,_,_,D,_,_,_,_,_,_,_,S],
        [S,_,_,_,_,S,_,_,S,S,S,S,_,_,_,S,_,_,Y,Y,D,Y,_,S],
        [S,_,_,K,_,S,_,_,S,R,_,S,_,_,_,S,_,_,Y,M,_,Y,_,S],
        [S,_,_,_,_,S,_,_,S,_,_,D,_,_,_,S,_,_,D,_,_,Y,_,S],
        [S,_,M,_,_,S,_,_,S,_,G,S,_,_,_,S,_,_,Y,_,R,Y,_,S],
        [S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S],
    ];
    return { width: W, height: H, tiles, nameKey: 'level2Name', name: 'Úroveň 2 – Zarostlé šachty' };
}

function level3() {
    const W = 24, H = 24;
    const S = T.STONE, D = T.WOOD, C = T.CRYSTAL, N = T.IRON, _ = T.EMPTY;
    const P = T.PLAYER, G = T.GOLD, M = T.GEM, B = T.BAT, K = T.SKELETON, E = T.EXIT, R = T.TORCH, L = T.HEALTH, I = T.SPIDER, H_ = T.GHOST;
    // prettier-ignore
    const tiles = [
        [N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N],
        [N,P,_,_,_,C,_,_,_,_,N,_,_,_,_,_,N,_,_,_,_,_,_,N],
        [N,_,_,_,_,C,_,M,_,_,N,_,_,_,H_,_,N,_,_,_,_,_,_,N],
        [N,_,_,_,_,C,_,_,_,_,C,_,_,_,_,_,_,_,_,N,N,N,_,N],
        [N,_,_,N,N,_,_,_,_,_,N,_,_,C,C,C,_,_,_,N,G,N,_,N],
        [N,_,_,N,R,_,_,_,_,_,N,_,_,C,G,C,_,_,_,_,_,_,_,N],
        [N,_,_,_,_,_,N,N,D,N,N,_,_,_,_,_,_,_,_,_,_,_,_,N],
        [N,_,_,_,_,_,N,M,_,_,_,_,_,_,_,N,N,D,N,N,N,N,_,N],
        [N,_,_,K,_,_,N,_,_,_,_,_,_,_,_,N,_,_,_,_,R,N,_,N],
        [N,N,D,N,N,_,N,_,_,C,_,_,_,_,_,N,_,K,_,_,_,N,_,N],
        [N,_,_,_,_,_,_,_,_,C,_,_,N,N,_,D,_,_,_,_,_,N,_,N],
        [N,_,G,_,L,_,_,_,_,C,_,_,N,_,_,N,_,_,_,G,_,N,_,N],
        [N,_,_,_,_,C,C,C,_,_,_,_,D,_,_,N,_,_,_,_,_,N,_,N],
        [N,_,_,H_,_,C,M,C,_,_,_,_,N,_,_,N,N,N,D,N,N,N,_,N],
        [N,_,_,_,_,C,_,C,_,_,_,_,N,_,G,_,_,_,_,_,_,_,_,N],
        [N,_,_,_,_,_,_,_,_,_,N,N,N,_,_,_,_,_,_,_,_,_,_,N],
        [N,N,N,D,N,N,_,_,_,_,N,M,N,_,_,C,C,C,_,_,N,N,N,N],
        [N,_,_,_,_,N,_,_,_,_,N,_,_,_,_,C,_,_,_,_,_,_,E,N],
        [N,_,G,_,_,D,_,_,_,_,_,_,_,_,_,D,_,_,_,_,_,_,_,N],
        [N,_,_,_,_,N,_,_,N,N,N,N,_,_,_,C,_,_,C,C,D,C,_,N],
        [N,_,_,I,_,N,_,_,N,R,_,N,_,_,_,C,_,_,C,M,_,C,_,N],
        [N,_,_,_,_,N,_,_,N,_,_,D,_,_,_,N,_,_,D,_,L,C,_,N],
        [N,_,M,_,_,N,_,_,N,_,G,N,_,_,_,N,_,_,C,_,R,C,_,N],
        [N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N],
    ];
    return { width: W, height: H, tiles, nameKey: 'level3Name', name: 'Úroveň 3 – Krystalové jeskyně' };
}

function level4() {
    const W = 28, H = 28;
    const S = T.STONE, D = T.WOOD, O = T.ORE, Y = T.MOSSY, C = T.CRYSTAL, N = T.IRON, _ = T.EMPTY;
    const P = T.PLAYER, G = T.GOLD, M = T.GEM, B = T.BAT, K = T.SKELETON, E = T.EXIT, R = T.TORCH, L = T.HEALTH, I = T.SPIDER, H_ = T.GHOST;
    // prettier-ignore
    const tiles = [
        [S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S],
        [S,P,_,_,_,_,S,_,_,_,_,_,O,_,_,_,S,_,_,_,_,_,_,_,_,_,_,S],
        [S,_,_,_,_,_,S,_,G,_,_,_,O,_,_,_,D,_,_,_,_,_,_,_,_,_,_,S],
        [S,_,_,_,_,_,D,_,_,_,_,_,S,_,_,_,S,_,_,Y,Y,Y,Y,_,_,_,_,S],
        [S,_,_,S,S,_,_,_,_,S,S,S,S,_,_,_,S,_,_,Y,_,_,Y,_,_,_,_,S],
        [S,_,_,S,R,_,_,_,_,_,_,_,_,_,B,_,S,_,_,Y,_,G,Y,_,_,_,_,S],
        [S,_,_,_,_,_,S,S,_,_,_,_,_,_,_,_,S,_,_,Y,_,_,Y,_,_,_,_,S],
        [S,_,_,I,_,_,S,M,_,_,N,N,N,D,N,N,N,_,_,Y,Y,D,Y,_,_,_,_,S],
        [S,_,_,_,_,_,S,_,_,_,N,_,_,_,_,_,N,_,_,_,_,_,_,_,_,K,_,S],
        [S,S,D,S,S,_,_,_,_,_,N,_,H_,_,_,_,N,_,_,_,_,_,_,_,_,_,_,S],
        [S,_,_,_,_,_,_,_,_,_,N,_,_,_,M,_,N,_,_,S,S,S,S,D,S,S,S,S],
        [S,_,G,_,_,_,_,_,_,_,N,_,_,_,_,_,N,_,_,S,_,_,_,_,_,_,R,S],
        [S,_,_,_,_,C,C,C,_,_,N,N,D,N,N,N,N,_,_,S,_,_,_,_,_,_,_,S],
        [S,_,_,_,_,C,L,C,_,_,_,_,_,_,_,_,_,_,_,S,_,_,K,_,_,_,_,S],
        [S,_,_,B,_,C,_,C,_,_,_,_,_,_,_,_,_,_,_,D,_,_,_,_,_,_,_,S],
        [S,_,_,_,_,_,_,_,_,_,O,O,O,_,_,_,_,_,_,S,_,_,_,_,G,_,_,S],
        [S,S,S,D,S,S,_,_,_,_,O,M,O,_,_,C,C,C,_,S,_,_,_,_,_,_,_,S],
        [S,_,_,_,_,S,_,_,_,_,O,_,_,_,_,C,_,_,_,S,S,S,S,_,_,S,S,S],
        [S,_,G,_,_,D,_,_,_,_,_,_,_,_,_,D,_,_,_,_,_,_,_,_,_,_,E,S],
        [S,_,_,_,_,S,_,_,Y,Y,Y,Y,_,_,_,C,_,_,_,_,_,_,_,_,_,_,_,S],
        [S,_,_,I,_,S,_,_,Y,R,_,Y,_,_,_,C,_,_,C,C,D,C,_,_,S,S,S,S],
        [S,_,_,_,_,S,_,_,Y,_,_,D,_,_,_,C,_,_,C,M,_,C,_,_,_,_,_,S],
        [S,_,M,_,_,S,_,_,Y,_,G,Y,_,_,_,S,_,_,D,_,L,C,_,H_,_,_,S],
        [S,_,_,_,_,S,_,_,Y,Y,Y,Y,_,_,_,S,_,_,C,_,R,C,_,_,_,_,_,S],
        [S,S,S,S,_,_,_,_,_,_,_,_,_,_,_,S,_,_,C,C,C,C,_,_,_,_,_,S],
        [S,_,G,_,_,_,_,K,_,_,_,_,_,_,_,S,_,_,_,_,_,_,_,_,_,G,_,S],
        [S,_,_,_,_,_,_,_,_,_,_,_,_,_,_,S,_,_,_,_,_,_,_,_,_,_,_,S],
        [S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S],
    ];
    return { width: W, height: H, tiles, nameKey: 'level4Name', name: 'Úroveň 4 – Hluboké štoly' };
}

function level5() {
    const W = 30, H = 30;
    const S = T.STONE, D = T.WOOD, O = T.ORE, Y = T.MOSSY, C = T.CRYSTAL, N = T.IRON, _ = T.EMPTY;
    const P = T.PLAYER, G = T.GOLD, M = T.GEM, B = T.BAT, K = T.SKELETON, E = T.EXIT, R = T.TORCH, L = T.HEALTH, I = T.SPIDER, H_ = T.GHOST;
    // prettier-ignore
    const tiles = [
        [N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N],
        [N,P,_,_,_,N,_,_,_,_,_,C,_,_,_,N,_,_,_,_,_,_,_,N,_,_,_,_,_,N],
        [N,_,_,_,_,N,_,G,_,_,_,C,_,_,_,D,_,_,_,_,_,_,_,N,_,_,_,_,_,N],
        [N,_,_,_,_,D,_,_,_,_,_,C,_,_,_,N,_,_,N,N,N,_,_,N,_,N,N,N,_,N],
        [N,_,_,_,_,N,_,_,_,C,C,C,_,K,_,N,_,_,N,M,_,_,_,D,_,_,_,N,_,N],
        [N,_,_,_,_,N,_,_,_,_,_,_,_,_,_,N,_,_,N,_,_,_,_,N,_,_,_,N,_,N],
        [N,N,D,N,_,N,_,_,_,_,_,_,_,_,_,N,_,_,N,N,N,_,_,N,_,K,_,N,_,N],
        [N,_,_,_,_,_,_,_,N,N,N,D,N,N,N,N,_,_,_,_,_,_,_,N,_,_,_,N,_,N],
        [N,_,I,_,_,_,_,_,N,_,_,_,_,_,R,N,_,_,_,_,_,_,_,N,N,D,N,N,_,N],
        [N,_,_,_,_,_,_,_,N,_,_,_,_,_,_,N,_,_,_,_,_,_,_,_,_,_,_,_,_,N],
        [N,N,N,N,N,D,N,_,N,_,H_,_,M,_,_,D,_,_,O,O,O,O,O,_,_,_,_,_,N],
        [N,_,_,_,_,_,N,_,N,_,_,_,_,_,_,N,_,_,O,_,_,_,O,_,_,_,_,_,_,N],
        [N,_,G,_,_,_,N,_,N,N,N,N,N,N,N,N,_,_,O,_,G,_,O,_,_,Y,Y,Y,Y,N],
        [N,_,_,_,L,_,N,_,_,_,_,_,_,_,_,_,_,_,O,_,_,_,O,_,_,Y,_,_,_,N],
        [N,_,_,_,_,_,N,_,_,_,_,_,_,_,_,_,_,_,O,O,D,O,O,_,_,Y,_,G,_,N],
        [N,_,B,_,_,_,D,_,_,_,Y,Y,Y,D,Y,Y,_,_,_,_,_,_,_,_,_,Y,_,_,_,N],
        [N,_,_,_,_,_,N,_,_,_,Y,_,_,_,_,Y,_,_,_,_,_,_,_,_,_,D,_,_,_,N],
        [N,_,_,_,I,_,N,_,_,_,Y,_,M,_,_,Y,_,_,C,C,C,D,C,C,_,Y,_,H_,_,N],
        [N,N,N,N,N,N,N,_,_,_,Y,_,_,_,_,Y,_,_,C,_,_,_,_,C,_,Y,_,_,_,N],
        [N,_,_,_,_,_,_,_,_,_,Y,_,K,_,L,Y,_,_,C,_,M,_,_,C,_,Y,Y,Y,Y,N],
        [N,_,G,_,_,_,_,_,_,_,Y,_,_,_,_,Y,_,_,C,_,_,_,_,C,_,_,_,_,_,N],
        [N,_,_,_,_,_,_,_,_,_,Y,Y,Y,Y,Y,Y,_,_,C,_,_,K,_,C,_,_,_,_,_,N],
        [N,_,_,_,K,_,_,_,_,_,_,_,_,_,_,_,_,_,C,C,C,C,C,C,_,_,_,_,_,N],
        [N,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,N],
        [N,N,N,N,N,N,D,N,N,N,_,_,N,N,N,D,N,N,N,N,_,_,N,N,N,D,N,N,N,N],
        [N,R,_,_,_,_,_,_,_,N,_,_,N,_,_,_,_,_,_,N,_,_,N,_,_,_,_,_,R,N],
        [N,_,_,G,_,_,B,_,_,N,_,_,N,_,H_,_,I,_,_,N,_,_,N,_,_,G,_,_,_,N],
        [N,_,_,_,_,_,_,_,_,D,_,_,D,_,_,M,_,_,_,D,_,_,D,_,_,_,_,_,_,N],
        [N,_,M,_,_,_,_,G,_,N,_,_,N,_,_,_,_,_,_,N,_,_,N,_,_,_,_,G,E,N],
        [N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N],
    ];
    return { width: W, height: H, tiles, nameKey: 'level5Name', name: 'Úroveň 5 – Prokleté hlubiny' };
}

const CAMPAIGN_LEVELS = [level1, level2, level3, level4, level5];

export function getCampaignLevel(index) {
    if (index < 0 || index >= CAMPAIGN_LEVELS.length) return null;
    return CAMPAIGN_LEVELS[index]();
}

export function getCampaignLength() {
    return CAMPAIGN_LEVELS.length;
}

// ════════════════════════════════════════
//  Editor save / load  (custom maps)
// ════════════════════════════════════════

export function loadMap() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const data = JSON.parse(raw);
            if (data && data.tiles && data.width && data.height) return data;
        }
    } catch (e) { /* ignore */ }
    return level1();
}

export function saveMap(mapData) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mapData));
}

export function createEmptyMap(w = 24, h = 24) {
    const tiles = [];
    for (let y = 0; y < h; y++) {
        const row = [];
        for (let x = 0; x < w; x++) {
            if (y === 0 || y === h - 1 || x === 0 || x === w - 1) row.push(T.STONE);
            else row.push(T.EMPTY);
        }
        tiles.push(row);
    }
    return { width: w, height: h, tiles, name: 'Nová mapa' };
}

export function createDefaultMap() {
    return level1();
}

/** Extract entities from tile grid, replacing them with EMPTY. Returns { entities[], playerStart } */
export function extractEntities(mapData) {
    const entities = [];
    let playerStart = null;

    for (let y = 0; y < mapData.height; y++) {
        for (let x = 0; x < mapData.width; x++) {
            const t = mapData.tiles[y][x];
            if (ENTITY_TYPES.has(t)) {
                if (t === T.PLAYER) {
                    playerStart = { x: x + 0.5, y: y + 0.5 };
                } else {
                    entities.push({ type: t, x: x + 0.5, y: y + 0.5 });
                }
                mapData.tiles[y][x] = T.EMPTY;
            }
        }
    }

    if (!playerStart) playerStart = { x: 1.5, y: 1.5 };
    return { entities, playerStart };
}

export function isWall(mapData, gx, gy, doorStates) {
    if (gx < 0 || gy < 0 || gx >= mapData.width || gy >= mapData.height) return true;
    const tile = mapData.tiles[gy][gx];
    if (tile === T.DOOR && doorStates) {
        const ds = doorStates[`${gx},${gy}`];
        if (ds && ds.open >= 0.9) return false; // open door is passable
    }
    return WALL_TYPES.has(tile);
}

export function getTile(mapData, gx, gy) {
    if (gx < 0 || gy < 0 || gx >= mapData.width || gy >= mapData.height) return T.STONE;
    return mapData.tiles[gy][gx];
}
