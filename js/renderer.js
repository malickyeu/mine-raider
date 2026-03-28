/* ── renderer.js ── orchestrates all rendering: ceiling, floor, walls, sprites, HUD ── */

import { SCREEN_W, SCREEN_H, T } from './config.js';
import { castRays } from './raycaster.js';
import { getTexture, getTextureSize } from './textures.js';
import { renderSprites } from './sprites.js';
import { drawHUD } from './hud.js';

let ctx;
let canvas;

export function initRenderer(canvasEl) {
    canvas = canvasEl;
    canvas.width = SCREEN_W;
    canvas.height = SCREEN_H;
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
}

export function renderFrame(mapData, player, entities, levelInfo, breakableWalls = {}, doorStates = {}) {
    // ── Head bob + screen shake offset ──
    const bobY = Math.sin(player.bobPhase) * 3;
    const shakeX = player.shakeTimer > 0 ? (Math.random() - 0.5) * 8 * player.shakeTimer : 0;
    const shakeY = player.shakeTimer > 0 ? (Math.random() - 0.5) * 6 * player.shakeTimer : 0;
    const offY = bobY + shakeY;
    const offX = shakeX;

    ctx.save();
    ctx.translate(offX, offY);

    // ── Ceiling (dark grey-brown) ──
    ctx.fillStyle = '#1a1510';
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H / 2);

    // ── Floor (dark brown/dirt) ──
    ctx.fillStyle = '#2a2015';
    ctx.fillRect(0, SCREEN_H / 2, SCREEN_W, SCREEN_H / 2);

    // ── Floor gradient for depth ──
    const floorGrad = ctx.createLinearGradient(0, SCREEN_H / 2, 0, SCREEN_H);
    floorGrad.addColorStop(0, 'rgba(0,0,0,0.7)');
    floorGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, SCREEN_H / 2, SCREEN_W, SCREEN_H / 2);

    // ── Ceiling gradient ──
    const ceilGrad = ctx.createLinearGradient(0, 0, 0, SCREEN_H / 2);
    ceilGrad.addColorStop(0, 'rgba(0,0,0,0)');
    ceilGrad.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = ceilGrad;
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H / 2);

    // ── Walls (raycasting) ──
    const texSize = getTextureSize();

    const drawColumn = (col, dist, tileType, texX, side, mx, my) => {

        const lineHeight = SCREEN_H / dist;
        const drawStart = Math.floor((SCREEN_H - lineHeight) / 2);
        const drawEnd = Math.ceil(drawStart + lineHeight);

        const tex = getTexture(tileType);
        const srcX = Math.floor(texX * texSize);

        ctx.drawImage(tex, srcX, 0, 1, texSize,
                      col, drawStart, 1, drawEnd - drawStart);

        // Darken one side for depth illusion
        if (side === 1) {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(col, drawStart, 1, drawEnd - drawStart);
        }

        // ── Crack overlay for damaged wood walls ──
        const wallKey = `${mx},${my}`;
        const remaining = breakableWalls[wallKey];
        if (remaining !== undefined) {
            // remaining: 2 = 1 hit, 1 = 2 hits, drawn darker each stage
            const damageRatio = 1 - remaining / 3;
            ctx.fillStyle = `rgba(0,0,0,${damageRatio * 0.55})`;
            ctx.fillRect(col, drawStart, 1, drawEnd - drawStart);
            // Add a lighter "crack" stripe in center for visual interest
            if (damageRatio > 0.5) {
                ctx.fillStyle = `rgba(60,30,10,0.4)`;
                ctx.fillRect(col, drawStart + (drawEnd - drawStart) * 0.3,
                             1, (drawEnd - drawStart) * 0.4);
            }
        }

        // Distance fog
        const fogAlpha = Math.min(0.85, dist / 12);
        if (fogAlpha > 0.01) {
            ctx.fillStyle = `rgba(10,8,5,${fogAlpha})`;
            ctx.fillRect(col, drawStart, 1, drawEnd - drawStart);
        }
    };

    const depthBuffer = castRays(mapData, player.x, player.y, player.angle, drawColumn, doorStates);

    // ── Sprites ──
    renderSprites(ctx, entities, player, depthBuffer);

    // ── Attack overlay ──
    if (player.attackTimer > 0.2) {
        ctx.fillStyle = 'rgba(255,200,50,0.15)';
        ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
        // pickaxe swing indicator
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⛏', SCREEN_W / 2 + Math.sin(player.attackTimer * 20) * 30,
                     SCREEN_H * 0.7);
    }

    // ── Damage flash ──
    if (player.hp < player.maxHp) {
        const dmgAlpha = Math.max(0, (1 - player.hp / player.maxHp) * 0.3);
        if (dmgAlpha > 0) {
            ctx.fillStyle = `rgba(180,0,0,${dmgAlpha})`;
            ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
        }
    }

    // ── View bob ──
    // (applied via ctx.translate at frame start)
    ctx.restore();

    // ── HUD (drawn without bob/shake offset) ──
    drawHUD(ctx, player, mapData, levelInfo);

    // ── "Click to play" hint ──
    // (shown from main.js overlay)
}

export function getContext() { return ctx; }
