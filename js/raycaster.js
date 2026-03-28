/* ── raycaster.js ── DDA raycasting engine ── */

import { SCREEN_W, FOV, HALF_FOV, T, WALL_TYPES } from './config.js';
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
        let hitDoorFrame = false;
        let doorTexX = 0;
        let doorPerpDist = 0;
        let doorFrameType = T.STONE;

        const FW = 0.07; // frame post width (7% of tile)

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

            if (tile === T.DOOR) {
                const ds = doorStates[`${mapX},${mapY}`];
                const openAmt = ds ? ds.open : 0;

                // ── Detect door orientation from neighbors ──
                // Walls above/below → door runs N-S (vertical, plane ⊥ X)
                // Walls left/right → door runs E-W (horizontal, plane ⊥ Y)
                const upT   = getTile(mapData, mapX, mapY - 1);
                const downT = getTile(mapData, mapX, mapY + 1);
                const isVert = (WALL_TYPES.has(upT) && upT !== T.DOOR) ||
                               (WALL_TYPES.has(downT) && downT !== T.DOOR);

                // Adjacent wall type for frame texture
                let fType = T.STONE;
                for (const [nx, ny] of [[mapX-1,mapY],[mapX+1,mapY],[mapX,mapY-1],[mapX,mapY+1]]) {
                    const nt = getTile(mapData, nx, ny);
                    if (WALL_TYPES.has(nt) && nt !== T.DOOR) { fType = nt; break; }
                }

                // Frame posts are square columns at center of tile:
                //   isVert → door plane perpendicular to X, posts at low/high Y
                //   !isVert → door plane perpendicular to Y, posts at low/high X
                // Post depth range: [0.5 - FW/2, 0.5 + FW/2] on the door-plane axis
                // Post cross range: [0, FW] and [1-FW, 1] on the cross axis

                const FWH = FW / 2;
                let bestT = 1e30, bestSide = 0, bestTexX = 0, bestIsFrame = false;

                // Helper: record a candidate hit
                const tryHit = (t, s, tx, frame) => {
                    if (t > 0.01 && t < bestT) {
                        bestT = t; bestSide = s;
                        bestTexX = Math.max(0, Math.min(0.999, tx));
                        bestIsFrame = frame;
                    }
                };

                if (isVert) {
                    // Door plane at x = mapX + 0.5, cross axis = Y
                    const cx = mapX + 0.5;

                    // ── A) Center plane (x = cx): frame front/back + door panel ──
                    if (Math.abs(cosA) > 1e-12) {
                        const t = (cx - px) / cosA;
                        if (t > 0.01) {
                            const hy = py + t * sinA - mapY;
                            if (hy >= 0 && hy <= 1) {
                                if (hy < FW || hy > 1 - FW) {
                                    // Frame face
                                    const tx = hy < FW ? hy / FW : (hy - (1 - FW)) / FW;
                                    tryHit(t, 0, tx, true);
                                } else {
                                    // Door panel
                                    const inner = (hy - FW) / (1 - 2 * FW);
                                    if (inner <= 1 - openAmt) {
                                        const tx = openAmt < 0.999 ? inner / (1 - openAmt) : 0;
                                        tryHit(t, 0, tx, false);
                                    }
                                }
                            }
                        }
                    }

                    // ── B) Near/far face of frame posts (x = cx ± FWH) ──
                    if (Math.abs(cosA) > 1e-12) {
                        for (const fx of [cx - FWH, cx + FWH]) {
                            const t = (fx - px) / cosA;
                            if (t > 0.01) {
                                const hy = py + t * sinA - mapY;
                                if ((hy >= 0 && hy <= FW) || (hy >= 1 - FW && hy <= 1)) {
                                    const tx = hy < FW ? hy / FW : (hy - (1 - FW)) / FW;
                                    tryHit(t, 0, tx, true);
                                }
                            }
                        }
                    }

                    // ── C) Side faces of frame posts (y = mapY + FW, y = mapY + 1 - FW) ──
                    if (Math.abs(sinA) > 1e-12) {
                        for (const fy of [mapY + FW, mapY + 1 - FW]) {
                            const t = (fy - py) / sinA;
                            if (t > 0.01) {
                                const hx = px + t * cosA;
                                const lx = hx - (cx - FWH);
                                if (lx >= 0 && lx <= FW) {
                                    tryHit(t, 1, lx / FW, true);
                                }
                            }
                        }
                    }
                } else {
                    // Door plane at y = mapY + 0.5, cross axis = X
                    const cy = mapY + 0.5;

                    // ── A) Center plane (y = cy): frame front/back + door panel ──
                    if (Math.abs(sinA) > 1e-12) {
                        const t = (cy - py) / sinA;
                        if (t > 0.01) {
                            const hx = px + t * cosA - mapX;
                            if (hx >= 0 && hx <= 1) {
                                if (hx < FW || hx > 1 - FW) {
                                    const tx = hx < FW ? hx / FW : (hx - (1 - FW)) / FW;
                                    tryHit(t, 1, tx, true);
                                } else {
                                    const inner = (hx - FW) / (1 - 2 * FW);
                                    if (inner <= 1 - openAmt) {
                                        const tx = openAmt < 0.999 ? inner / (1 - openAmt) : 0;
                                        tryHit(t, 1, tx, false);
                                    }
                                }
                            }
                        }
                    }

                    // ── B) Near/far face of frame posts (y = cy ± FWH) ──
                    if (Math.abs(sinA) > 1e-12) {
                        for (const fy of [cy - FWH, cy + FWH]) {
                            const t = (fy - py) / sinA;
                            if (t > 0.01) {
                                const hx = px + t * cosA - mapX;
                                if ((hx >= 0 && hx <= FW) || (hx >= 1 - FW && hx <= 1)) {
                                    const tx = hx < FW ? hx / FW : (hx - (1 - FW)) / FW;
                                    tryHit(t, 1, tx, true);
                                }
                            }
                        }
                    }

                    // ── C) Side faces of frame posts (x = mapX + FW, x = mapX + 1 - FW) ──
                    if (Math.abs(cosA) > 1e-12) {
                        for (const fx of [mapX + FW, mapX + 1 - FW]) {
                            const t = (fx - px) / cosA;
                            if (t > 0.01) {
                                const hy = py + t * sinA;
                                const ly = hy - (cy - FWH);
                                if (ly >= 0 && ly <= FW) {
                                    tryHit(t, 0, ly / FW, true);
                                }
                            }
                        }
                    }
                }

                if (bestT < 1e30) {
                    hitDoor = true;
                    hitDoorFrame = bestIsFrame;
                    doorFrameType = fType;
                    doorTexX = bestTexX;
                    doorPerpDist = bestT;
                    side = bestSide;
                    hit = true;
                    break;
                }

                // No hit → ray passes through open gap
                continue;
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
            if (doorPerpDist < 0.01) doorPerpDist = 0.01;
            const correctedDist = doorPerpDist * Math.cos(rayAngle - pAngle);
            depthBuffer[col] = correctedDist;
            if (hitDoorFrame) {
                // Frame uses adjacent wall texture
                drawColumn(col, correctedDist, doorFrameType, doorTexX, side, mapX, mapY);
            } else {
                drawColumn(col, correctedDist, T.DOOR, doorTexX, side, mapX, mapY);
            }
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


