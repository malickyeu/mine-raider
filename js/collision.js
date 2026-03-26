/* ── collision.js ── grid AABB collision with wall sliding ── */

import { PLAYER_RADIUS } from './config.js';
import { isWall } from './map.js';

/**
 * Try to move from (x,y) by (dx,dy). Returns corrected (nx, ny).
 * Slides along walls by testing axes independently.
 */
export function moveWithCollision(mapData, x, y, dx, dy, radius = PLAYER_RADIUS) {
    let nx = x + dx;
    let ny = y + dy;

    // Test X axis
    if (dx !== 0) {
        const testX = nx + (dx > 0 ? radius : -radius);
        const testY1 = y - radius;
        const testY2 = y + radius;
        if (isWall(mapData, Math.floor(testX), Math.floor(testY1)) ||
            isWall(mapData, Math.floor(testX), Math.floor(testY2))) {
            nx = x; // block X movement
        }
    }

    // Test Y axis
    if (dy !== 0) {
        const testY = ny + (dy > 0 ? radius : -radius);
        const testX1 = nx - radius;
        const testX2 = nx + radius;
        if (isWall(mapData, Math.floor(testX1), Math.floor(testY)) ||
            isWall(mapData, Math.floor(testX2), Math.floor(testY))) {
            ny = y; // block Y movement
        }
    }

    return { x: nx, y: ny };
}
