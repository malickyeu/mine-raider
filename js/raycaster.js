/* ── raycaster.js ── DDA raycasting engine ── */

import { SCREEN_W, FOV, HALF_FOV } from './config.js';
import { getTile, isWall } from './map.js';

/**
 * Cast all rays for one frame.
 * Returns depthBuffer[screenX] = perpDist (for sprite clipping)
 * and calls drawColumn(screenX, perpDist, tileType, texX, side) for each column.
 */
export function castRays(mapData, px, py, pAngle, drawColumn) {
    const depthBuffer = new Float64Array(SCREEN_W);

    for (let col = 0; col < SCREEN_W; col++) {
        const rayAngle = pAngle - HALF_FOV + (col / SCREEN_W) * FOV;
        const sinA = Math.sin(rayAngle);
        const cosA = Math.cos(rayAngle);

        // ── DDA setup ──
        let mapX = Math.floor(px);
        let mapY = Math.floor(py);

        const deltaDistX = cosA === 0 ? 1e30 : Math.abs(1 / cosA);
        const deltaDistY = sinA === 0 ? 1e30 : Math.abs(1 / sinA);

        let stepX, stepY, sideDistX, sideDistY;

        if (cosA < 0) {
            stepX = -1;
            sideDistX = (px - mapX) * deltaDistX;
        } else {
            stepX = 1;
            sideDistX = (mapX + 1 - px) * deltaDistX;
        }

        if (sinA < 0) {
            stepY = -1;
            sideDistY = (py - mapY) * deltaDistY;
        } else {
            stepY = 1;
            sideDistY = (mapY + 1 - py) * deltaDistY;
        }

        // ── DDA march ──
        let side = 0; // 0 = vertical (X-side), 1 = horizontal (Y-side)
        let hit = false;

        for (let i = 0; i < 64; i++) { // max steps
            if (sideDistX < sideDistY) {
                sideDistX += deltaDistX;
                mapX += stepX;
                side = 0;
            } else {
                sideDistY += deltaDistY;
                mapY += stepY;
                side = 1;
            }

            if (isWall(mapData, mapX, mapY)) {
                hit = true;
                break;
            }
        }

        if (!hit) {
            depthBuffer[col] = 1e30;
            continue;
        }

        // perpendicular distance (fish-eye corrected)
        let perpDist;
        if (side === 0) {
            perpDist = (mapX - px + (1 - stepX) / 2) / cosA;
        } else {
            perpDist = (mapY - py + (1 - stepY) / 2) / sinA;
        }

        // fix negative / zero
        if (perpDist < 0.01) perpDist = 0.01;

        // fish-eye correction
        const correctedDist = perpDist * Math.cos(rayAngle - pAngle);

        // wall hit point for texture coordinate
        let wallX;
        if (side === 0) {
            wallX = py + perpDist * sinA;
        } else {
            wallX = px + perpDist * cosA;
        }
        wallX -= Math.floor(wallX); // fractional part [0,1)

        const tileType = getTile(mapData, mapX, mapY);

        depthBuffer[col] = correctedDist;
        drawColumn(col, correctedDist, tileType, wallX, side, mapX, mapY);
    }

    return depthBuffer;
}
