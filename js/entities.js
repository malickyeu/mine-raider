/* ── entities.js ── game entities: player, treasures, enemies, exit ── */

import { T, PLAYER_MAX_HP, PLAYER_SPEED, PLAYER_ROT_SPEED, PLAYER_MOUSE_SENS,
         ENEMY_SPEED, ENEMY_DAMAGE, ENEMY_HIT_INTERVAL } from './config.js';
import { isDown, consumeMouseDX } from './input.js';
import { moveWithCollision } from './collision.js';
import { isWall } from './map.js';

// ── Player ──
export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.hp = PLAYER_MAX_HP;
        this.maxHp = PLAYER_MAX_HP;
        this.score = 0;
        this.attacking = false;
        this.attackTimer = 0;
        this.bobPhase = 0;
    }

    update(dt, mapData) {
        // ── Rotation ──
        const mdx = consumeMouseDX();
        this.angle += mdx * PLAYER_MOUSE_SENS;

        if (isDown('ArrowLeft')  || isDown('KeyQ')) this.angle -= PLAYER_ROT_SPEED * dt;
        if (isDown('ArrowRight') || isDown('KeyE')) this.angle += PLAYER_ROT_SPEED * dt;

        // ── Movement ──
        let moveX = 0, moveY = 0;
        const cosA = Math.cos(this.angle);
        const sinA = Math.sin(this.angle);

        if (isDown('KeyW') || isDown('ArrowUp')) {
            moveX += cosA * PLAYER_SPEED * dt;
            moveY += sinA * PLAYER_SPEED * dt;
        }
        if (isDown('KeyS') || isDown('ArrowDown')) {
            moveX -= cosA * PLAYER_SPEED * dt;
            moveY -= sinA * PLAYER_SPEED * dt;
        }
        if (isDown('KeyA')) {
            moveX += sinA * PLAYER_SPEED * dt;
            moveY -= cosA * PLAYER_SPEED * dt;
        }
        if (isDown('KeyD')) {
            moveX -= sinA * PLAYER_SPEED * dt;
            moveY += cosA * PLAYER_SPEED * dt;
        }

        if (moveX !== 0 || moveY !== 0) {
            this.bobPhase += dt * 10;
        }

        const result = moveWithCollision(mapData, this.x, this.y, moveX, moveY);
        this.x = result.x;
        this.y = result.y;

        // ── Attack ──
        if (this.attackTimer > 0) this.attackTimer -= dt;
        if (isDown('Space') && this.attackTimer <= 0) {
            this.attacking = true;
            this.attackTimer = 0.4;
        } else {
            this.attacking = false;
        }
    }

    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
    }

    addScore(pts) {
        this.score += pts;
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    get alive() { return this.hp > 0; }
}

// ── Generic game entity ──
export class Entity {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.alive = true;
        this.hp = 1;
    }
}

// ── Treasure ──
export class Treasure extends Entity {
    constructor(type, x, y) {
        super(type, x, y);
        this.value = type === T.GEM ? 500 : 100;
    }
}

// ── HealthPack ──
export class HealthPack extends Entity {
    constructor(x, y) {
        super(T.HEALTH, x, y);
        this.healAmount = 30;
    }
}

// ── Torch (decorative, no pickup) ──
export class Torch extends Entity {
    constructor(x, y) {
        super(T.TORCH, x, y);
        this.flickerPhase = Math.random() * Math.PI * 2;
    }
    update(dt) {
        this.flickerPhase += dt * 5;
    }
}

// ── Exit ──
export class Exit extends Entity {
    constructor(x, y) {
        super(T.EXIT, x, y);
    }
}

// ── Enemy base ──
export class Enemy extends Entity {
    constructor(type, x, y) {
        super(type, x, y);
        // Per-type stats
        switch (type) {
            case T.SKELETON:
                this.hp = 3; this.speed = ENEMY_SPEED * 0.7; this.damage = ENEMY_DAMAGE * 1.2; break;
            case T.SPIDER:
                this.hp = 2; this.speed = ENEMY_SPEED * 1.4; this.damage = ENEMY_DAMAGE * 0.8; break;
            case T.GHOST:
                this.hp = 4; this.speed = ENEMY_SPEED * 0.5; this.damage = ENEMY_DAMAGE * 1.5; this.phaseThrough = true; break;
            default: // BAT
                this.hp = 2; this.speed = ENEMY_SPEED; this.damage = ENEMY_DAMAGE; break;
        }
        this.hitCooldown = 0;
        this.chasing = false;
        this.patrolAngle = Math.random() * Math.PI * 2;
        this.patrolTimer = 0;
        this.hurtTimer = 0;
        this.phaseThrough = this.phaseThrough || false; // ghost can pass through walls
    }

    update(dt, mapData, player) {
        if (!this.alive) return;

        this.hitCooldown = Math.max(0, this.hitCooldown - dt);
        this.hurtTimer = Math.max(0, this.hurtTimer - dt);

        // Check LOS to player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 8) {
            // Simple LOS: step towards player and check for walls
            this.chasing = this.phaseThrough || this.hasLOS(mapData, player);
        } else {
            this.chasing = false;
        }

        if (this.chasing && dist > 0.5) {
            // Move toward player
            const mx = (dx / dist) * this.speed * dt;
            const my = (dy / dist) * this.speed * dt;
            if (this.phaseThrough) {
                // Ghost passes through walls
                this.x += mx;
                this.y += my;
            } else {
                const result = moveWithCollision(mapData, this.x, this.y, mx, my, 0.2);
                this.x = result.x;
                this.y = result.y;
            }
        } else if (!this.chasing) {
            // Random patrol
            this.patrolTimer -= dt;
            if (this.patrolTimer <= 0) {
                this.patrolAngle = Math.random() * Math.PI * 2;
                this.patrolTimer = 1 + Math.random() * 2;
            }
            const mx = Math.cos(this.patrolAngle) * this.speed * 0.3 * dt;
            const my = Math.sin(this.patrolAngle) * this.speed * 0.3 * dt;
            const result = moveWithCollision(mapData, this.x, this.y, mx, my, 0.2);
            this.x = result.x;
            this.y = result.y;
        }

        // Contact damage to player
        if (dist < 0.6 && this.hitCooldown <= 0) {
            player.takeDamage(this.damage);
            this.hitCooldown = ENEMY_HIT_INTERVAL;
        }
    }

    hasLOS(mapData, player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.ceil(dist * 2);
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const cx = this.x + dx * t;
            const cy = this.y + dy * t;
            if (isWall(mapData, Math.floor(cx), Math.floor(cy))) return false;
        }
        return true;
    }

    takeDamage() {
        this.hp--;
        this.hurtTimer = 0.15;
        if (this.hp <= 0) {
            this.alive = false;
        }
    }
}

// ── Pillar ── transparent sprite that blocks movement
export class Pillar extends Entity {
    constructor(x, y) {
        super(T.PILLAR, x, y);
    }
}

/** Create entity instances from extracted entity list */
export function createEntities(entityList) {
    const entities = [];
    for (const e of entityList) {
        switch (e.type) {
            case T.GOLD:
            case T.GEM:
                entities.push(new Treasure(e.type, e.x, e.y));
                break;
            case T.BAT:
            case T.SKELETON:
            case T.SPIDER:
            case T.GHOST:
                entities.push(new Enemy(e.type, e.x, e.y));
                break;
            case T.EXIT:
                entities.push(new Exit(e.x, e.y));
                break;
            case T.TORCH:
                entities.push(new Torch(e.x, e.y));
                break;
            case T.HEALTH:
                entities.push(new HealthPack(e.x, e.y));
                break;
            case T.PILLAR:
                entities.push(new Pillar(e.x, e.y));
                break;
        }
    }
    return entities;
}
