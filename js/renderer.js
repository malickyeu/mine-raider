/* ── renderer.js ── orchestrates all rendering: ceiling, floor, walls, sprites, HUD ── */

import { SCREEN_W, SCREEN_H, T, FOV, HALF_FOV } from './config.js';
import { castRays } from './raycaster.js';
import { getTexture, getTextureSize, getWeaponTexture } from './textures.js';
import { renderSprites } from './sprites.js';
import { drawHUD } from './hud.js';

let ctx;
let canvas;

// ── Lighting constants ──
const TORCH_RANGE   = 4.8;   // units; torch illumination radius
const TORCH_FALLOFF = 1.8;   // exponent for distance attenuation

export function initRenderer(canvasEl) {
    canvas = canvasEl;
    canvas.width = SCREEN_W;
    canvas.height = SCREEN_H;
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
}

export function renderFrame(mapData, player, entities, levelInfo, breakableWalls = {}, doorStates = {}, explored = null) {
    // ── Pre-filter nearby light sources (torches + mine lights) ──
    const TR2 = (TORCH_RANGE + 2) * (TORCH_RANGE + 2);
    const nearbyTorches = entities.filter(e => {
        if (!e.alive || !e.lightRadius) return false;
        const dx = e.x - player.x, dy = e.y - player.y;
        return dx * dx + dy * dy < TR2;
    });

    // ── Closest torch ambient (for floor/ceiling warmth) ──
    let closestTorchBrightness = 0;
    for (const torch of nearbyTorches) {
        const dx = torch.x - player.x, dy = torch.y - player.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        const lr = torch.lightRadius || TORCH_RANGE;
        if (d < lr) {
            const flicker = 0.7 + 0.3 * Math.sin(torch.flickerPhase) * Math.sin(torch.flickerPhase * 2.3 + 1.1);
            const b = Math.pow(Math.max(0, 1 - d / lr), TORCH_FALLOFF) * flicker;
            closestTorchBrightness = Math.max(closestTorchBrightness, b);
        }
    }
    const torchAmbient = closestTorchBrightness * 0.35;

    // ── Head bob + screen shake offset ──
    const bobY = Math.sin(player.bobPhase) * 3;
    const shakeX = player.shakeTimer > 0 ? (Math.random() - 0.5) * 8 * player.shakeTimer : 0;
    const shakeY = player.shakeTimer > 0 ? (Math.random() - 0.5) * 6 * player.shakeTimer : 0;
    const offY = bobY + shakeY;
    const offX = shakeX;

    ctx.save();
    ctx.translate(offX, offY);

    // ── Ceiling ──
    // Mix from pitch-black towards warm brown depending on torch ambient
    const ceilR = Math.round(26 + torchAmbient * 60);
    const ceilG = Math.round(21 + torchAmbient * 30);
    const ceilB = Math.round(16 + torchAmbient * 5);
    ctx.fillStyle = `rgb(${ceilR},${ceilG},${ceilB})`;
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H / 2);

    // ── Floor ──
    const floorR = Math.round(42 + torchAmbient * 80);
    const floorG = Math.round(32 + torchAmbient * 40);
    const floorB = Math.round(21 + torchAmbient * 8);
    ctx.fillStyle = `rgb(${floorR},${floorG},${floorB})`;
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
            const damageRatio = 1 - remaining / 3;
            ctx.fillStyle = `rgba(0,0,0,${damageRatio * 0.55})`;
            ctx.fillRect(col, drawStart, 1, drawEnd - drawStart);
            if (damageRatio > 0.5) {
                ctx.fillStyle = `rgba(60,30,10,0.4)`;
                ctx.fillRect(col, drawStart + (drawEnd - drawStart) * 0.3,
                             1, (drawEnd - drawStart) * 0.4);
            }
        }

        // ── Dynamic lighting ──
        const rayAngle = player.angle - HALF_FOV + (col / SCREEN_W) * FOV;

        // 1. Base fog (no flashlight = very dark mine)
        let fogAlpha;
        if (!player.hasFlashlight || !player.flashlightOn) {
            fogAlpha = Math.min(0.96, Math.max(0, (dist - 1.5) / 4.5));
        } else {
            // With flashlight: base falloff is gentler
            fogAlpha = Math.min(0.92, Math.max(0, (dist - 2.5) / 9.5));
            // Flashlight cone: reduce fog within player's facing angle
            let angleDiff = rayAngle - player.angle;
            // normalise to [-π, π]
            angleDiff -= Math.round(angleDiff / (Math.PI * 2)) * Math.PI * 2;
            if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            const absDiff = Math.abs(angleDiff);
            const coneHalf = FOV * 0.52; // slightly wider than view
            if (absDiff < coneHalf) {
                const coneT    = Math.pow(1 - absDiff / coneHalf, 1.5);
                const distFade = Math.max(0, 1 - dist / 16);
                fogAlpha = Math.max(0, fogAlpha - coneT * distFade * 0.88);
            }
        }

        // 2. Torch proximity lighting on the wall surface
        const hitX = player.x + Math.cos(rayAngle) * dist;
        const hitY = player.y + Math.sin(rayAngle) * dist;
        let torchBrightness = 0;

        for (const torch of nearbyTorches) {
            const tdx = hitX - torch.x;
            const tdy = hitY - torch.y;
            const td2 = tdx * tdx + tdy * tdy;
            const lr = torch.lightRadius || TORCH_RANGE;
            if (td2 < lr * lr) {
                const td = Math.sqrt(td2);
                const flicker = 0.7 + 0.3 *
                    Math.sin(torch.flickerPhase) *
                    Math.sin(torch.flickerPhase * 2.3 + 1.1);
                const b = Math.pow(Math.max(0, 1 - td / lr), TORCH_FALLOFF) * flicker * 0.9;
                torchBrightness = Math.max(torchBrightness, b);
            }
        }

        fogAlpha = Math.max(0, fogAlpha - torchBrightness);

        // 3. Apply fog
        if (fogAlpha > 0.01) {
            ctx.fillStyle = `rgba(10,8,5,${fogAlpha.toFixed(3)})`;
            ctx.fillRect(col, drawStart, 1, drawEnd - drawStart);
        }

        // 4. Warm torch tint on illuminated surfaces
        if (torchBrightness > 0.05) {
            const tintA = (torchBrightness * 0.22).toFixed(3);
            ctx.fillStyle = `rgba(255,130,20,${tintA})`;
            ctx.fillRect(col, drawStart, 1, drawEnd - drawStart);
        }
    };

    const lightingState = { nearbyTorches, torchRange: TORCH_RANGE, torchFalloff: TORCH_FALLOFF };
    const depthBuffer = castRays(mapData, player.x, player.y, player.angle, drawColumn, doorStates);

    // ── Sprites ──
    renderSprites(ctx, entities, player, depthBuffer, lightingState);

    // ── First-person weapon ──
    {
        const weaponId = player.currentWeapon || 'pickaxe';
        const weaponTex = getWeaponTexture(weaponId);
        const wScale = 2.6;
        const wW = weaponTex.width * wScale;
        const wH = weaponTex.height * wScale;

        // Base position: center-right, most of weapon visible
        let baseX = SCREEN_W * 0.52;
        let baseY = SCREEN_H - wH * 0.85;

        // Idle bob (subtle, synced to player walk)
        baseX += Math.sin(player.bobPhase * 0.5) * 3;
        baseY += Math.abs(Math.sin(player.bobPhase)) * 4;

        // Swing animation — wind up to the right, then slam left toward center
        // with pseudo-3D: scale grows during strike (weapon thrusts forward)
        let swingAngle = 0;
        let swingOX = 0, swingOY = 0;
        let swingScale = 1.0;
        if (player.attackTimer > 0) {
            const t = 1 - player.attackTimer / 0.4;  // 0 → 1
            if (t < 0.25) {
                // Wind-up: tilt right & up, shrink slightly (pulling back)
                const p = t / 0.25;
                swingAngle = 0.35 * p;
                swingOX = 20 * p;
                swingOY = -25 * p;
                swingScale = 1.0 - 0.06 * p;   // slight shrink (pulling away)
            } else if (t < 0.55) {
                // Strike: swing left & down, grow (thrusting forward into scene)
                const p = (t - 0.25) / 0.3;
                swingAngle = 0.35 - 0.85 * p;
                swingOX = 20 - 70 * p;
                swingOY = -25 + 55 * p;
                swingScale = 0.94 + 0.18 * p;  // grow past 1.0 → 1.12 (forward lunge)
            } else {
                // Recovery: return to rest
                const p = (t - 0.55) / 0.45;
                swingAngle = -0.50 * (1 - p);
                swingOX = -50 * (1 - p);
                swingOY = 30 * (1 - p);
                swingScale = 1.12 - 0.12 * p;  // back to 1.0
            }
        }

        ctx.save();
        const pivotX = baseX + wW * 0.55 + swingOX;
        const pivotY = baseY + wH * 0.95 + swingOY;
        ctx.translate(pivotX, pivotY);
        ctx.rotate(swingAngle);
        ctx.scale(swingScale, swingScale);
        ctx.drawImage(weaponTex, -wW * 0.55, -wH * 0.95, wW, wH);
        ctx.translate(pivotX, pivotY);
        ctx.rotate(swingAngle);
        ctx.drawImage(weaponTex, -wW * 0.55, -wH * 0.95, wW, wH);
        ctx.restore();
    }

    // ── Attack flash (brief golden tint at impact) ──
    if (player.attackTimer > 0.15 && player.attackTimer < 0.3) {
        ctx.fillStyle = 'rgba(255,200,50,0.08)';
        ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    }

    // ── Damage flash ──
    if (player.hp < player.maxHp) {
        const dmgAlpha = Math.max(0, (1 - player.hp / player.maxHp) * 0.3);
        if (dmgAlpha > 0) {
            ctx.fillStyle = `rgba(180,0,0,${dmgAlpha})`;
            ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
        }
    }

    // ── Vignette (stronger without flashlight) ──
    {
        const vInner  = (player.hasFlashlight && player.flashlightOn) ? SCREEN_H * 0.18 : SCREEN_H * 0.04;
        const vOuter  = (player.hasFlashlight && player.flashlightOn) ? SCREEN_W * 0.72 : SCREEN_W * 0.52;
        const vAlpha  = (player.hasFlashlight && player.flashlightOn) ? 0.55 : 0.78;
        const vGrad = ctx.createRadialGradient(SCREEN_W / 2, SCREEN_H / 2, vInner,
                                               SCREEN_W / 2, SCREEN_H / 2, vOuter);
        vGrad.addColorStop(0, 'rgba(0,0,0,0)');
        vGrad.addColorStop(1, `rgba(0,0,0,${vAlpha})`);
        ctx.fillStyle = vGrad;
        ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    }

    ctx.restore();

    // ── HUD (drawn without bob/shake offset) ──
    drawHUD(ctx, player, mapData, levelInfo, doorStates, entities, explored);
}

export function getContext() { return ctx; }
