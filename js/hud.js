/* ── hud.js ── heads-up display: health, score, minimap, level ── */

import { SCREEN_W, SCREEN_H, MINIMAP_SCALE, MINIMAP_MARGIN, WALL_TYPES, T } from './config.js';
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

export function drawHUD(ctx, player, mapData, levelInfo, doorStates = {}) {
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
    ctx.fillRect(barX - 2, barY - 26, 120, 20);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`\u26CF ${player.score}`, barX + 4, barY - 11);

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

        for (let y = offY; y < tileY1; y++) {
            for (let x = offX; x < tileX1; x++) {
                const tile = mapData.tiles[y][x];
                if (tile === T.DOOR) continue; // doors drawn separately below
                if (!WALL_TYPES.has(tile)) continue;
                ctx.fillStyle = WALL_COLORS[tile] || '#555';
                ctx.fillRect(
                    mmX + (x - offX) * MINIMAP_SCALE,
                    mmY + (y - offY) * MINIMAP_SCALE,
                    MINIMAP_SCALE, MINIMAP_SCALE
                );
            }
        }

        // ── Doors: thin line at tile center, gap when open ──
        for (let y = offY; y < tileY1; y++) {
            for (let x = offX; x < tileX1; x++) {
                if (mapData.tiles[y][x] !== T.DOOR) continue;
                const ds = doorStates[`${x},${y}`];
                const openAmt = ds ? ds.open : 0;
                if (openAmt >= 0.99) continue; // fully open → invisible

                const tx = mmX + (x - offX) * MINIMAP_SCALE;
                const ty = mmY + (y - offY) * MINIMAP_SCALE;
                const s = MINIMAP_SCALE;
                const closedPx = s * (1 - openAmt);

                ctx.fillStyle = '#aa8833';
                // Walls above/below → vertical door (line along Y), else horizontal
                const hasWallUp   = y > 0 && WALL_TYPES.has(mapData.tiles[y - 1][x]) && mapData.tiles[y - 1][x] !== T.DOOR;
                const hasWallDown = y < mapData.height - 1 && WALL_TYPES.has(mapData.tiles[y + 1][x]) && mapData.tiles[y + 1][x] !== T.DOOR;
                if (hasWallUp || hasWallDown) {
                    // Door runs N-S (vertical), draw vertical line at center
                    ctx.fillRect(tx + s / 2 - 1, ty, 2, closedPx);
                } else {
                    // Door runs E-W (horizontal), draw horizontal line at center
                    ctx.fillRect(tx, ty + s / 2 - 1, closedPx, 2);
                }
            }
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
