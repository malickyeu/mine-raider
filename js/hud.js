/* ── hud.js ── heads-up display: health, score, minimap, level ── */

import { SCREEN_W, SCREEN_H, MINIMAP_SCALE, MINIMAP_MARGIN, WALL_TYPES, T } from './config.js';
import { t } from './i18n.js';

let minimapVisible = true;
let helpVisible = false;

export function toggleMinimap() {
    minimapVisible = !minimapVisible;
}

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

export function drawHUD(ctx, player, mapData, levelInfo) {
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
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('⚡', barX + 2, stBarY + stBarH - 1);
    }

    // ── Score ──
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(barX - 2, barY - 26, 120, 20);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`💰 ${player.score}`, barX + 4, barY - 11);

    // ── Level indicator (top center) ──
    if (levelInfo) {
        const displayName = levelInfo.nameKey ? t(levelInfo.nameKey) : (levelInfo.name || '');
        const lvlText = `⛏ ${displayName}`;
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        const tw = ctx.measureText(lvlText).width;

        const hasDiff = !!levelInfo.difficulty;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(SCREEN_W / 2 - tw / 2 - 8, 6, tw + 16, hasDiff ? 30 : 20);

        ctx.fillStyle = '#f0c040';
        ctx.fillText(lvlText, SCREEN_W / 2, hasDiff ? 18 : 20);

        if (hasDiff) {
            const diffNames  = { easy: t('diffEasy'), normal: t('diffNormal'), hard: t('diffHard') };
            const diffColors = { easy: '#66dd55', normal: '#f0c040', hard: '#ff7744' };
            ctx.font = '9px monospace';
            ctx.fillStyle = diffColors[levelInfo.difficulty] || '#f0c040';
            ctx.fillText(diffNames[levelInfo.difficulty] || '', SCREEN_W / 2, 31);
        }
    }

    // ── Minimap ──
    if (minimapVisible) {
        const mmW = mapData.width * MINIMAP_SCALE;
        const mmH = mapData.height * MINIMAP_SCALE;
        const mmX = SCREEN_W - mmW - MINIMAP_MARGIN;
        const mmY = MINIMAP_MARGIN;

        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(mmX - 1, mmY - 1, mmW + 2, mmH + 2);

        for (let y = 0; y < mapData.height; y++) {
            for (let x = 0; x < mapData.width; x++) {
                const tile = mapData.tiles[y][x];
                if (WALL_TYPES.has(tile)) {
                    const colors = {
                        [T.WOOD]: '#6a4020', [T.ORE]: '#5a5a30',
                        [T.MOSSY]: '#3a5a2a', [T.CRYSTAL]: '#4466aa',
                        [T.IRON]: '#6a6a80',
                    };
                    ctx.fillStyle = colors[tile] || '#555';
                    ctx.fillRect(mmX + x * MINIMAP_SCALE, mmY + y * MINIMAP_SCALE,
                                 MINIMAP_SCALE, MINIMAP_SCALE);
                }
            }
        }

        const px = mmX + player.x * MINIMAP_SCALE;
        const py = mmY + player.y * MINIMAP_SCALE;
        ctx.fillStyle = '#0cf';
        ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#0cf'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(player.angle) * 8, py + Math.sin(player.angle) * 8);
        ctx.stroke();
    }

    // ── Hint bar (just "H — Help") ──
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(t('hintBar'), SCREEN_W - 10, SCREEN_H - 6);
}
