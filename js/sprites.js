/* ── sprites.js ── billboard sprite rendering ── */

import { SCREEN_W, SCREEN_H, FOV, T } from './config.js';
import { getSpriteTexture, getPillarTexture } from './textures.js';

/**
 * Render all visible entity sprites.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Entity[]} entities
 * @param {Player} player
 * @param {Float64Array} depthBuffer  - from raycaster
 * @param {{ nearbyTorches: Entity[], torchRange: number, torchFalloff: number }} lightingState
 */
export function renderSprites(ctx, entities, player, depthBuffer, lightingState = {}) {
    const { nearbyTorches = [], torchRange = 4.8, torchFalloff = 1.8 } = lightingState;

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

        visible.push({ ent, tx, ty, wx: ent.x, wy: ent.y });
    }

    // Sort back to front
    visible.sort((a, b) => b.tx - a.tx);

    const planeDist = Math.tan(FOV / 2);

    for (const { ent, tx, ty, wx, wy } of visible) {
        // Screen X
        const screenX = (SCREEN_W / 2) * (1 + ty / (tx * planeDist));

        // Sprite height on screen
        const spriteH = Math.min(SCREEN_H * 1.5, SCREEN_H / tx);
        const spriteW = spriteH;

        const drawX = screenX - spriteW / 2;

        // ── Sprite lighting (fog + torch) ──
        // Compute fog alpha for this sprite's world position
        let spriteFog;
        if (!player.hasFlashlight || !player.flashlightOn) {
            spriteFog = Math.min(0.96, Math.max(0, (tx - 1.5) / 4.5));
        } else {
            spriteFog = Math.min(0.92, Math.max(0, (tx - 2.5) / 9.5));
            // Flashlight cone
            let angleDiff = Math.atan2(wy - player.y, wx - player.x) - player.angle;
            angleDiff -= Math.round(angleDiff / (Math.PI * 2)) * Math.PI * 2;
            if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            const absDiff = Math.abs(angleDiff);
            const coneHalf = FOV * 0.52;
            if (absDiff < coneHalf) {
                const coneT    = Math.pow(1 - absDiff / coneHalf, 1.5);
                const distFade = Math.max(0, 1 - tx / 16);
                spriteFog = Math.max(0, spriteFog - coneT * distFade * 0.88);
            }
        }

        // Torch contribution at sprite position
        let torchBright = 0;
        for (const torch of nearbyTorches) {
            const tdx = wx - torch.x, tdy = wy - torch.y;
            const td2 = tdx * tdx + tdy * tdy;
            if (td2 < torchRange * torchRange) {
                const td = Math.sqrt(td2);
                const flicker = 0.7 + 0.3 *
                    Math.sin(torch.flickerPhase) *
                    Math.sin(torch.flickerPhase * 2.3 + 1.1);
                const b = Math.pow(Math.max(0, 1 - td / torchRange), torchFalloff) * flicker * 0.9;
                torchBright = Math.max(torchBright, b);
            }
        }
        spriteFog = Math.max(0, spriteFog - torchBright);

        // Column clipping against depth buffer
        const tex = ent.type === T.PILLAR ? getPillarTexture() : getSpriteTexture(ent.type);
        // Pillars render at full wall height; other sprites are square
        const spriteH2 = ent.type === T.PILLAR ? SCREEN_H / tx : spriteH;
        const drawY2   = (SCREEN_H - spriteH2) / 2;
        const startCol = Math.max(0, Math.floor(drawX));
        const endCol = Math.min(SCREEN_W - 1, Math.floor(drawX + spriteW));

        // Combine fog + hurt flash into a single globalAlpha to avoid fillRect rectangle
        // artifacts on transparent sprite regions (transparent corners would otherwise show
        // the dark fog or warm torch tint as a visible rectangular halo).
        const baseA = ent.hurtTimer > 0 ? (0.5 + Math.sin(ent.hurtTimer * 40) * 0.5) : 1;
        const drawA = Math.max(0.02, baseA * (1 - spriteFog));

        ctx.globalAlpha = drawA;
        for (let col = startCol; col <= endCol; col++) {
            if (tx < depthBuffer[col]) {
                const texX = ((col - drawX) / spriteW) * tex.width;
                ctx.drawImage(tex, texX, 0, 1, tex.height,
                              col, drawY2, 1, spriteH2);
            }
        }
        ctx.globalAlpha = 1;
    }
}
