/* ── hud.js ── heads-up display: health, score, minimap, level ── */

import { SCREEN_W, SCREEN_H, MINIMAP_SCALE, MINIMAP_MARGIN, WALL_TYPES, T, ALL_DOOR_TYPES, FOG_REVEAL_RADIUS, DYNAMITE_THROW_DURATION } from './config.js';
import { t } from './i18n.js';

let minimapVisible = true;
let helpVisible = false;

// ── Module-level constants (no per-frame allocation) ──
const WALL_COLORS = {
    [T.WOOD]: '#6a4020', [T.ORE]: '#5a5a30',
    [T.MOSSY]: '#3a5a2a', [T.CRYSTAL]: '#4466aa',
    [T.IRON]: '#6a6a80',
};
const DIFF_COLORS = { easy: '#66dd55', normal: '#f0c040', hard: '#ff7744' };
const DIFF_KEYS   = { easy: 'diffEasy', normal: 'diffNormal', hard: 'diffHard' };

// Entity icon colors for the minimap (static/collectible only — no enemies)
const MM_ENT_COLORS = {
    [T.TORCH]:        '#ff8800',
    [T.MINE_LIGHT]:   '#ddaa33',
    [T.MINE_CART]:    '#888',
    [T.PICKAXE_DECOR]:'#996633',
    [T.BARREL]:       '#cc4422',
    [T.HEALTH]:       '#ff3333',
    [T.HEALTH_SMALL]: '#cc5577',
    [T.EXIT]:         '#44ff88',
    [T.GOLD]:         '#ffd700',
    [T.GEM]:          '#ff44ff',
    [T.KEY_RED]:      '#ff4444',
    [T.KEY_BLUE]:     '#4488ff',
    [T.FLASHLIGHT]:   '#ffe080',
    [T.PILLAR]:       '#887766',
};

const MAX_MM_PX = 120; // max minimap size in pixels

export function toggleMinimap() { minimapVisible = !minimapVisible; }

export function toggleHelp() {
    helpVisible = !helpVisible;
    const el = document.getElementById('help-overlay');
    if (el) el.classList.toggle('active', helpVisible);
}

export function isHelpVisible() { return helpVisible; }

export function hideHelp() {
    helpVisible = false;
    const el = document.getElementById('help-overlay');
    if (el) el.classList.remove('active');
}

export function drawHUD(ctx, player, mapData, levelInfo, doorStates = {}, entities = [], explored = null) {
    // ── Health bar ──
    const barW = 160, barH = 16;
    const barX = 14, barY = SCREEN_H - 30;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);

    const hp = Math.round(player.hp);
    const hpRatio = hp / player.maxHp;
    const hpColor = hpRatio > 0.5 ? '#44cc44' : hpRatio > 0.25 ? '#cccc44' : '#cc4444';
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barW * hpRatio, barH);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${t('hp')}: ${hp}`, barX + 4, barY + 12);

    // ── Stamina bar ──
    const stBarY = barY + barH + 4;
    const stBarH = 6;
    const stRatio = player.stamina / player.staminaMax;
    const stColor = stRatio > 0.5 ? '#00bbff' : stRatio > 0.2 ? '#ffcc00' : '#ff6622';
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(barX - 2, stBarY - 1, barW + 4, stBarH + 2);
    ctx.fillStyle = '#222';
    ctx.fillRect(barX, stBarY, barW, stBarH);
    ctx.fillStyle = stColor;
    ctx.fillRect(barX, stBarY, barW * stRatio, stBarH);
    if (player.sprinting) {
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('>>>', barX + 2, stBarY + stBarH - 1);
    }

    // ── Score ──
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(barX - 2, barY - 28, 168, 24);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`\u26CF ${player.score}`, barX + 4, barY - 12);

    // ── Key inventory ──
    if (player.keys && player.keys.size > 0) {
        let kx = barX + 126;
        const ky = barY - 25;
        for (const keyType of [T.KEY_RED, T.KEY_BLUE]) {
            if (!player.keys.has(keyType)) continue;
            const kColor = keyType === T.KEY_RED ? '#ff4444' : '#4488ff';
            // Draw small key icon: ring + shaft + teeth
            ctx.strokeStyle = kColor;
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(kx + 5, ky + 6, 4, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = kColor;
            ctx.fillRect(kx + 3, ky + 10, 3, 7);
            ctx.fillRect(kx + 6, ky + 13, 3, 2);
            ctx.fillRect(kx + 6, ky + 16, 2, 2);
            kx += 18;
        }
    }

     // ── Flashlight indicator ──
     if (player.hasFlashlight) {
         const flx = barX, fly = barY - 46;
         const isOn = player.flashlightOn;
         ctx.fillStyle = 'rgba(0,0,0,0.55)';
         ctx.fillRect(flx - 2, fly - 2, 68, 18);
         ctx.fillStyle = isOn ? '#ffe080' : '#888';
         ctx.font = '11px monospace';
         ctx.textAlign = 'left';
         ctx.fillText(isOn ? '🔦 ON' : '🔦 OFF', flx + 2, fly + 12);
     }

     // ── Weapon indicator ──
     if (player.currentWeapon && player.weapons) {
         const wpx = barX + 90, wpy = barY - 46;
         const weapon = player.currentWeapon;
         const weaponIcons = { pickaxe: '⛏️', warhammer: '🔨', crossbow: '🏹', dynamite: '💣' };
         const icon = weaponIcons[weapon] || '⚔️';

         ctx.fillStyle = 'rgba(0,0,0,0.55)';
         const ammo = player.weapons[weapon].ammo;
         const ammoText = ammo >= 0 ? ` (${ammo})` : '';
         const wtext = `${icon}${ammoText}`;
         const wtw = ctx.measureText(wtext).width;
         ctx.fillRect(wpx - 4, wpy - 2, Math.max(60, wtw + 8), 18);

         ctx.fillStyle = weapon === 'pickaxe' ? '#ffd700' : '#f0a040';
         ctx.font = '11px monospace';
         ctx.textAlign = 'left';
         ctx.fillText(wtext, wpx, wpy + 12);

         // ── Dynamite throw charge bar ──
         if (weapon === 'dynamite' && player.weaponThrowTimer > 0) {
             const chargeRatio = Math.min(1, player.weaponThrowTimer / DYNAMITE_THROW_DURATION);
             const cbX = wpx - 4, cbY = wpy + 18;
             const cbW = Math.max(60, wtw + 8), cbH = 5;
             ctx.fillStyle = 'rgba(0,0,0,0.7)';
             ctx.fillRect(cbX, cbY, cbW, cbH);
             // Colour: yellow → orange → red as charge increases
             const r = Math.round(255);
             const g = Math.round(200 * (1 - chargeRatio));
             ctx.fillStyle = `rgb(${r},${g},0)`;
             ctx.fillRect(cbX, cbY, cbW * chargeRatio, cbH);
             // "CHARGE" label
             ctx.fillStyle = '#fff';
             ctx.font = '7px monospace';
             ctx.textAlign = 'left';
             ctx.fillText('CHARGE', cbX + 2, cbY + cbH - 1);
         }
     }

    // ── Level indicator (top center) ──
    if (levelInfo) {
        const displayName = levelInfo.nameKey ? t(levelInfo.nameKey) : (levelInfo.name || '');
        const lvlText = `\u26CF ${displayName}`;
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        const tw = ctx.measureText(lvlText).width;

        const diff = levelInfo.difficulty;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(SCREEN_W / 2 - tw / 2 - 8, 6, tw + 16, diff ? 30 : 20);

        ctx.fillStyle = '#f0c040';
        ctx.fillText(lvlText, SCREEN_W / 2, diff ? 18 : 20);

        if (diff) {
            ctx.font = '9px monospace';
            ctx.fillStyle = DIFF_COLORS[diff] || '#f0c040';
            ctx.fillText(t(DIFF_KEYS[diff]) || '', SCREEN_W / 2, 31);
        }
    }

    // ── Minimap ──
    if (minimapVisible) {
        const mmViewW = Math.min(mapData.width  * MINIMAP_SCALE, MAX_MM_PX);
        const mmViewH = Math.min(mapData.height * MINIMAP_SCALE, MAX_MM_PX);
        const mmX = SCREEN_W - mmViewW - MINIMAP_MARGIN;
        const mmY = MINIMAP_MARGIN;

        // Integer tile offset – tiles sit on exact pixel boundaries, no clip() needed
        const viewTilesX = Math.floor(mmViewW / MINIMAP_SCALE);
        const viewTilesY = Math.floor(mmViewH / MINIMAP_SCALE);
        const offX = Math.floor(Math.max(0, Math.min(mapData.width  - viewTilesX, player.x - viewTilesX / 2)));
        const offY = Math.floor(Math.max(0, Math.min(mapData.height - viewTilesY, player.y - viewTilesY / 2)));

        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(mmX - 1, mmY - 1, mmViewW + 2, mmViewH + 2);

        // Only iterate tiles inside the viewport
        const tileX1 = Math.min(mapData.width,  offX + viewTilesX);
        const tileY1 = Math.min(mapData.height, offY + viewTilesY);
        const hasFow = explored !== null;
        const rr2 = FOG_REVEAL_RADIUS * FOG_REVEAL_RADIUS;

        // ── Walls (fog-of-war filtered) ──
        for (let y = offY; y < tileY1; y++) {
            for (let x = offX; x < tileX1; x++) {
                if (hasFow && !explored[y][x]) continue; // unexplored → hidden
                const tile = mapData.tiles[y][x];
                if (ALL_DOOR_TYPES.has(tile)) continue;
                if (!WALL_TYPES.has(tile)) continue;
                ctx.fillStyle = WALL_COLORS[tile] || '#555';
                const px = mmX + (x - offX) * MINIMAP_SCALE;
                const py = mmY + (y - offY) * MINIMAP_SCALE;
                ctx.fillRect(px, py, MINIMAP_SCALE, MINIMAP_SCALE);
                // Dim explored-but-distant tiles
                if (hasFow) {
                    const ddx = x - player.x, ddy = y - player.y;
                    if (ddx * ddx + ddy * ddy > rr2) {
                        ctx.fillStyle = 'rgba(0,0,0,0.4)';
                        ctx.fillRect(px, py, MINIMAP_SCALE, MINIMAP_SCALE);
                    }
                }
            }
        }

        // ── Doors (fog-of-war filtered) ──
        for (let y = offY; y < tileY1; y++) {
            for (let x = offX; x < tileX1; x++) {
                if (hasFow && !explored[y][x]) continue;
                const tile = mapData.tiles[y][x];
                if (!ALL_DOOR_TYPES.has(tile)) continue;
                const ds = doorStates[`${x},${y}`];
                const openAmt = ds ? ds.open : 0;
                if (openAmt >= 0.99) continue;

                const tx = mmX + (x - offX) * MINIMAP_SCALE;
                const ty = mmY + (y - offY) * MINIMAP_SCALE;
                const s = MINIMAP_SCALE;
                const closedPx = s * (1 - openAmt);

                if (tile === T.DOOR_RED) ctx.fillStyle = '#ff4444';
                else if (tile === T.DOOR_BLUE) ctx.fillStyle = '#4488ff';
                else ctx.fillStyle = '#aa8833';

                const hasWallUp   = y > 0 && WALL_TYPES.has(mapData.tiles[y - 1][x]) && !ALL_DOOR_TYPES.has(mapData.tiles[y - 1][x]);
                const hasWallDown = y < mapData.height - 1 && WALL_TYPES.has(mapData.tiles[y + 1][x]) && !ALL_DOOR_TYPES.has(mapData.tiles[y + 1][x]);
                if (hasWallUp || hasWallDown) {
                    ctx.fillRect(tx + s / 2 - 1, ty, 2, closedPx);
                } else {
                    ctx.fillRect(tx, ty + s / 2 - 1, closedPx, 2);
                }
            }
        }

        // ── Entity icons (only on explored tiles) ──
        for (const ent of entities) {
            if (!ent.alive) continue;
            const color = MM_ENT_COLORS[ent.type];
            if (!color) continue; // skip enemies & unknown
            const etx = Math.floor(ent.x), ety = Math.floor(ent.y);
            if (hasFow && !explored[ety]?.[etx]) continue;
            // Skip if outside viewport
            if (etx < offX || etx >= tileX1 || ety < offY || ety >= tileY1) continue;
            const ex = mmX + (ent.x - offX) * MINIMAP_SCALE;
            const ey = mmY + (ent.y - offY) * MINIMAP_SCALE;
            ctx.fillStyle = color;
            const r = ent.type === T.EXIT ? 2 : 1.3;
            ctx.beginPath(); ctx.arc(ex, ey, r, 0, Math.PI * 2); ctx.fill();
        }

        // Player dot + direction
        const px = mmX + (player.x - offX) * MINIMAP_SCALE;
        const py = mmY + (player.y - offY) * MINIMAP_SCALE;
        ctx.fillStyle = '#0cf';
        ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#0cf'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(player.angle) * 8, py + Math.sin(player.angle) * 8);
        ctx.stroke();
    }

    // ── Hint bar ──
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(t('hintBar'), SCREEN_W - 10, SCREEN_H - 6);
}
