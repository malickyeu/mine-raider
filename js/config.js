/* ── config.js ── game-wide constants ── */

export const GAME_VERSION = '0.1.0';

export const SCREEN_W = 640;
export const SCREEN_H = 400;

export const FOV = Math.PI / 3;          // 60°
export const HALF_FOV = FOV / 2;

export const TILE_SIZE = 1;              // each map cell = 1 unit

export const PLAYER_SPEED = 3.0;         // units/sec
export const PLAYER_ROT_SPEED = 2.5;     // rad/sec  (keyboard)
export const PLAYER_MOUSE_SENS = 0.002;  // rad/px
export const PLAYER_RADIUS = 0.25;
export const PLAYER_MAX_HP = 100;

export const ENEMY_SPEED = 1.4;
export const ENEMY_DAMAGE = 12;          // per hit
export const ENEMY_HIT_INTERVAL = 0.8;   // sec between hits

// Sprint & Stamina
export const SPRINT_MULT        = 1.6;   // speed multiplier while sprinting
export const STAMINA_MAX        = 100;
export const STAMINA_DRAIN      = 35;    // per second while sprinting
export const STAMINA_REGEN      = 25;    // per second while not sprinting

// Difficulty presets  (multipliers applied to base enemy stats)
export const DIFFICULTIES = {
    easy:   { enemyHpMult: 0.75, enemySpeedMult: 0.8,  enemyDamageMult: 0.7,  enemyHitIntervalMult: 1.35 },
    normal: { enemyHpMult: 1.0,  enemySpeedMult: 1.0,  enemyDamageMult: 1.0,  enemyHitIntervalMult: 1.0  },
    hard:   { enemyHpMult: 1.5,  enemySpeedMult: 1.3,  enemyDamageMult: 1.4,  enemyHitIntervalMult: 0.7  },
};

export const MINIMAP_SCALE = 6;          // px per tile
export const MINIMAP_MARGIN = 10;

// Tile types
export const T = {
    EMPTY:    0,
    STONE:    1,
    WOOD:     2,
    ORE:      3,   // ore-vein wall (decorative variant)
    MOSSY:    4,   // mossy stone wall
    CRYSTAL:  5,   // crystal cave wall
    IRON:     6,   // iron-reinforced wall
    PLAYER:   10,
    GOLD:     11,
    GEM:      12,
    BAT:      13,
    SKELETON: 14,
    EXIT:     15,
    TORCH:    16,
    HEALTH:   17,
    SPIDER:   18,
    GHOST:    19,
    PILLAR:   20,   // decorative column – transparent sprite, blocks movement
};

export const WALL_TYPES = new Set([T.STONE, T.WOOD, T.ORE, T.MOSSY, T.CRYSTAL, T.IRON]);
export const ENTITY_TYPES = new Set([T.PLAYER, T.GOLD, T.GEM, T.BAT, T.SKELETON, T.EXIT, T.TORCH, T.HEALTH, T.SPIDER, T.GHOST, T.PILLAR]);

// Breakable walls: tile → initial HP
export const BREAKABLE_TYPES = new Set([T.WOOD]);
export const WALL_HP = { [T.WOOD]: 3 };

// i18n keys for tile labels (resolved at runtime via t())
export const TILE_LABEL_KEYS = {
    [T.EMPTY]:    'tEmpty',
    [T.STONE]:    'tStone',
    [T.WOOD]:     'tWood',
    [T.ORE]:      'tOre',
    [T.MOSSY]:    'tMossy',
    [T.CRYSTAL]:  'tCrystal',
    [T.IRON]:     'tIron',
    [T.PLAYER]:   'tPlayer',
    [T.GOLD]:     'tGold',
    [T.GEM]:      'tGem',
    [T.BAT]:      'tBat',
    [T.SKELETON]: 'tSkeleton',
    [T.EXIT]:     'tExit',
    [T.TORCH]:    'tTorch',
    [T.HEALTH]:   'tHealth',
    [T.SPIDER]:   'tSpider',
    [T.GHOST]:    'tGhost',
    [T.PILLAR]:   'tPillar',
};

export const TILE_COLORS = {
    [T.EMPTY]:    '#1a1a1a',
    [T.STONE]:    '#666666',
    [T.WOOD]:     '#8B5A2B',
    [T.ORE]:      '#7a7a50',
    [T.MOSSY]:    '#4a6a3a',
    [T.CRYSTAL]:  '#6688cc',
    [T.IRON]:     '#8888a0',
    [T.PLAYER]:   '#00ccff',
    [T.GOLD]:     '#ffd700',
    [T.GEM]:      '#ff00ff',
    [T.BAT]:      '#884488',
    [T.SKELETON]: '#cccccc',
    [T.EXIT]:     '#00ff66',
    [T.TORCH]:    '#ff8800',
    [T.HEALTH]:   '#ff4444',
    [T.SPIDER]:   '#446622',
    [T.GHOST]:    '#aaddff',
    [T.PILLAR]:   '#887766',
};
