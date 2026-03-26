/* ── sprites.js ── billboard sprite rendering ── */

import { SCREEN_W, SCREEN_H, FOV, T } from './config.js';
import { getSpriteTexture, getPillarTexture } from './textures.js';

/**
 * Render all visible entity sprites.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Entity[]} entities
 * @param {Player} player
 * @param {Float64Array} depthBuffer  - from raycaster
 */
export function renderSprites(ctx, entities, player, depthBuffer) {
    const cosA = Math.cos(player.angle);
    const sinA = Math.sin(player.angle);

    // Transform & sort
    const visible = [];

    for (const ent of entities) {
        if (!ent.alive) continue;

        const dx = ent.x - player.x;
        const dy = ent.y - player.y;

        // Camera-space transform (rotate into view space)
        const tx = cosA * dx + sinA * dy;   // depth (along view direction)
        const ty = -sinA * dx + cosA * dy;  // lateral

        if (tx < 0.1) continue; // behind camera

        visible.push({ ent, tx, ty });
    }

    // Sort back to front
    visible.sort((a, b) => b.tx - a.tx);

    const planeDist = Math.tan(FOV / 2);

    for (const { ent, tx, ty } of visible) {
        // Screen X
        const screenX = (SCREEN_W / 2) * (1 + ty / (tx * planeDist));

        // Sprite height on screen
        const spriteH = Math.min(SCREEN_H * 1.5, SCREEN_H / tx);
        const spriteW = spriteH;

        const drawX = screenX - spriteW / 2;

        // Column clipping against depth buffer
        const tex = ent.type === T.PILLAR ? getPillarTexture() : getSpriteTexture(ent.type);
        // Pillars render at full wall height; other sprites are square
        const spriteH2 = ent.type === T.PILLAR ? SCREEN_H / tx : spriteH;
        const drawY2   = (SCREEN_H - spriteH2) / 2;
        const startCol = Math.max(0, Math.floor(drawX));
        const endCol = Math.min(SCREEN_W - 1, Math.floor(drawX + spriteW));

        for (let col = startCol; col <= endCol; col++) {
            if (tx < depthBuffer[col]) {
                const texX = ((col - drawX) / spriteW) * tex.width;

                // Hurt flash for enemies
                if (ent.hurtTimer > 0) {
                    ctx.globalAlpha = 0.5 + Math.sin(ent.hurtTimer * 40) * 0.5;
                }

                ctx.drawImage(tex, texX, 0, 1, tex.height,
                              col, drawY2, 1, spriteH2);

                ctx.globalAlpha = 1;
            }
        }
    }
}
