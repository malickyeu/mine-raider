/* ── raycaster.js ── DDA raycasting engine ── */

import { SCREEN_W, FOV, HALF_FOV, T } from './config.js';
import { getTile, isWall } from './map.js';

/**
 * Cast all rays for one frame.
 * doorStates: { "x,y": { open: 0..1 } }  — thin-door offset
 */
export function castRays(mapData, px, py, pAngle, drawColumn, doorStates = {}) {
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
        let side = 0;
        let hit = false;
        let hitDoor = false;
        let doorTexX = 0;
        let doorPerpDist = 0;

        for (let i = 0; i < 64; i++) {
            if (sideDistX < sideDistY) {
                sideDistX += deltaDistX;
                mapX += stepX;
                side = 0;
            } else {
                sideDistY += deltaDistY;
                mapY += stepY;
                side = 1;
            }

            const tile = getTile(mapData, mapX, mapY);

            // ── Thin door check: door sits at center of tile (offset 0.5) ──
            if (tile === T.DOOR) {
                const ds = doorStates[`${mapX},${mapY}`];
                const openAmt = ds ? ds.open : 0;

                // Distance to the center plane of this tile
                let doorDist;
                if (side === 0) {
                    doorDist = (mapX - px + (1 - stepX) / 2 + 0.5 * stepX) / cosA;
                } else {
                    doorDist = (mapY - py + (1 - stepY) / 2 + 0.5 * stepY) / sinA;
                }

                if (doorDist > 0.01) {
                    // Texture coordinate at door center plane
                    let dtx;
                    if (side === 0) {
                        dtx = py + doorDist * sinA;
                    } else {
                        dtx = px + doorDist * cosA;
                    }
                    dtx -= Math.floor(dtx);

                    // Door slides: the open portion (0..openAmt) is passable
                    if (dtx < openAmt) {
                        // Ray passes through the open gap → continue DDA
                        continue;
                    }

                    // Hit the closed part of the door
                    hitDoor = true;
                    doorTexX = dtx - openAmt; // shift texture so it appears to slide
                    doorPerpDist = doorDist;
                }
                hit = true;
                break;
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

        if (hitDoor) {
            // Thin door hit at center of tile
            if (doorPerpDist < 0.01) doorPerpDist = 0.01;
            const correctedDist = doorPerpDist * Math.cos(rayAngle - pAngle);
            depthBuffer[col] = correctedDist;
            drawColumn(col, correctedDist, T.DOOR, doorTexX, side, mapX, mapY);
            continue;
        }

        // perpendicular distance (fish-eye corrected)
        let perpDist;
        if (side === 0) {
            perpDist = (mapX - px + (1 - stepX) / 2) / cosA;
        } else {
            perpDist = (mapY - py + (1 - stepY) / 2) / sinA;
        }
        if (perpDist < 0.01) perpDist = 0.01;

        const correctedDist = perpDist * Math.cos(rayAngle - pAngle);

        let wallX;
        if (side === 0) {
            wallX = py + perpDist * sinA;
        } else {
            wallX = px + perpDist * cosA;
        }
        wallX -= Math.floor(wallX);

        const tileType = getTile(mapData, mapX, mapY);

        depthBuffer[col] = correctedDist;
        drawColumn(col, correctedDist, tileType, wallX, side, mapX, mapY);
    }

    return depthBuffer;
}


