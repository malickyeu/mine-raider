/* ── entities.js ── game entities: player, treasures, enemies, exit ── */

import { T, PLAYER_MAX_HP, PLAYER_SPEED, PLAYER_ROT_SPEED, PLAYER_MOUSE_SENS,
         ENEMY_SPEED, ENEMY_DAMAGE, ENEMY_HIT_INTERVAL,
         SPRINT_MULT, STAMINA_MAX, STAMINA_DRAIN, STAMINA_REGEN,
         WEAPON_STATS, DYNAMITE_THROW_DURATION } from './config.js';
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
        this.stamina = STAMINA_MAX;
        this.staminaMax = STAMINA_MAX;
        this.sprinting = false;
        this.staminaExhausted = false;
        this.shakeTimer = 0;
         this.keys = new Set();  // collected key types (T.KEY_RED, T.KEY_BLUE)
         this.hasFlashlight = false; // true once player picks up the lantern
         this.flashlightOn = true;   // toggleable on/off (L key)
         this.lastHitByType = null;  // set by Enemy.update() → read by main.js for sfx
         // Weapon system
         this.currentWeapon = 'pickaxe';
         this.weapons = {
             pickaxe:   { owned: true,  ammo: -1 },
             warhammer: { owned: false, ammo: -1 },
             crossbow:  { owned: false, ammo: 0  },
             dynamite:  { owned: false, ammo: 0  },
         };
         this.weaponThrowTimer = 0;   // for dynamite wind-up
         this.lastAttackWeapon = null; // track per-weapon cooldown
     }

    update(dt, mapData, doorStates) {
        // ── Input snapshot (computed once, used by sprint + movement + rotation) ──
        const wantSprint = isDown('ShiftLeft') || isDown('ShiftRight');
        const wantsMove  = isDown('KeyW') || isDown('ArrowUp')
                        || isDown('KeyS') || isDown('ArrowDown')
                        || isDown('KeyA') || isDown('KeyD');

        // ── Stamina & Sprint ──
        // Drain only while actually moving; require SHIFT release to recover from exhaustion
        if (this.stamina <= 0) {
            this.staminaExhausted = true;
        } else if (this.staminaExhausted && this.stamina >= this.staminaMax * 0.25 && !wantSprint) {
            this.staminaExhausted = false;
        }
        this.sprinting = wantSprint && wantsMove && !this.staminaExhausted;
        if (this.sprinting) {
            this.stamina = Math.max(0, this.stamina - STAMINA_DRAIN * dt);
        } else {
            this.stamina = Math.min(this.staminaMax, this.stamina + STAMINA_REGEN * dt);
        }
        const speedMult = this.sprinting ? SPRINT_MULT : 1.0;

        // ── Rotation (speedMult applied so SHIFT+arrows rotates faster too) ──
        const mdx = consumeMouseDX();
        this.angle += mdx * PLAYER_MOUSE_SENS;

        if (isDown('ArrowLeft')  || isDown('KeyQ')) this.angle -= PLAYER_ROT_SPEED * speedMult * dt;
        if (isDown('ArrowRight')) this.angle += PLAYER_ROT_SPEED * speedMult * dt;

        // ── Movement ──
        let moveX = 0, moveY = 0;
        const cosA = Math.cos(this.angle);
        const sinA = Math.sin(this.angle);

        if (isDown('KeyW') || isDown('ArrowUp')) {
            moveX += cosA * PLAYER_SPEED * speedMult * dt;
            moveY += sinA * PLAYER_SPEED * speedMult * dt;
        }
        if (isDown('KeyS') || isDown('ArrowDown')) {
            moveX -= cosA * PLAYER_SPEED * speedMult * dt;
            moveY -= sinA * PLAYER_SPEED * speedMult * dt;
        }
        if (isDown('KeyA')) {
            moveX += sinA * PLAYER_SPEED * speedMult * dt;
            moveY -= cosA * PLAYER_SPEED * speedMult * dt;
        }
        if (isDown('KeyD')) {
            moveX -= sinA * PLAYER_SPEED * speedMult * dt;
            moveY += cosA * PLAYER_SPEED * speedMult * dt;
        }

        if (moveX !== 0 || moveY !== 0) {
            this.bobPhase += dt * 10 * speedMult;
        }

        const result = moveWithCollision(mapData, this.x, this.y, moveX, moveY, undefined, doorStates);
        this.x = result.x;
        this.y = result.y;

         // ── Attack ──
         if (this.attackTimer > 0) this.attackTimer -= dt;
         if (this.shakeTimer > 0) this.shakeTimer -= dt;
         
         const isAttackPressed = isDown('Space');
         if (isAttackPressed && this.attackTimer <= 0) {
             // Dynamite: track throw power while held
             if (this.currentWeapon === 'dynamite') {
                 this.weaponThrowTimer = Math.min(DYNAMITE_THROW_DURATION, this.weaponThrowTimer + dt);
                 this.attacking = true;
             } else {
                 // Melee/ranged: immediate attack
                 this.attacking = true;
                 const stats = WEAPON_STATS[this.currentWeapon];
                 this.attackTimer = stats.cooldown;
             }
         } else if (!isAttackPressed && this.attacking && this.currentWeapon === 'dynamite') {
             // Dynamite release → trigger throw in main.js
             const stats = WEAPON_STATS['dynamite'];
             this.attackTimer = stats.cooldown;
             this.attacking = false;
         } else {
             this.attacking = false;
         }
    }

    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        this.shakeTimer = 0.2;
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

// ── SmallHealthPack ──
export class SmallHealthPack extends Entity {
    constructor(x, y) {
        super(T.HEALTH_SMALL, x, y);
        this.healAmount = 15;
    }
}

// ── Torch (decorative, no pickup) ──
export class Torch extends Entity {
    constructor(x, y) {
        super(T.TORCH, x, y);
        this.flickerPhase = Math.random() * Math.PI * 2;
        this.lightRadius = 4.8;
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
    constructor(type, x, y, difficulty = null) {
        super(type, x, y);
        // Per-type base stats
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
        // Apply difficulty multipliers
        if (difficulty) {
            this.hp       = Math.max(1, Math.round(this.hp * difficulty.enemyHpMult));
            this.speed   *= difficulty.enemySpeedMult;
            this.damage  *= difficulty.enemyDamageMult;
            this.hitInterval = ENEMY_HIT_INTERVAL * difficulty.enemyHitIntervalMult;
        } else {
            this.hitInterval = ENEMY_HIT_INTERVAL;
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
            this.hitCooldown = this.hitInterval;
            player.lastHitByType = this.type; // consumed by main.js → sfxEnemyAttack
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

    takeDamage(amount = 1) {
        this.hp -= amount;
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

// ── KeyItem ── collectible key for locked doors
export class KeyItem extends Entity {
    constructor(type, x, y) {
        super(type, x, y);
    }
}

// ── Flashlight ── collectible lantern; gives player dynamic lighting cone
export class Flashlight extends Entity {
    constructor(x, y) {
        super(T.FLASHLIGHT, x, y);
        this.bobPhase = Math.random() * Math.PI * 2; // gentle float animation
    }
    update(dt) {
        this.bobPhase += dt * 1.8;
    }
}

// ── Barrel ── explodes on pickaxe hit or enemy contact
export class Barrel extends Entity {
    constructor(x, y) {
        super(T.BARREL, x, y);
        this.exploding = false;
        this.explodeTimer = 0;
    }
    update(dt) {
        if (this.exploding) {
            this.explodeTimer -= dt;
            if (this.explodeTimer <= 0) this.alive = false;
        }
    }
}

// ── MineLight ── ambient light source (like torch but different visual)
export class MineLight extends Entity {
    constructor(x, y) {
        super(T.MINE_LIGHT, x, y);
        this.flickerPhase = Math.random() * Math.PI * 2;
        this.lightRadius = 3.5;
    }
    update(dt) {
        this.flickerPhase += dt * 3; // slower, steadier flicker than torch
    }
}

// ── MineCart ── decorative, blocks movement
export class MineCart extends Entity {
    constructor(x, y) {
        super(T.MINE_CART, x, y);
    }
}

// ── PickaxeDecor ── decorative, walk-through
export class PickaxeDecor extends Entity {
    constructor(x, y) {
        super(T.PICKAXE_DECOR, x, y);
    }
}

// ── WeaponPickup ── collectible weapon (warhammer, crossbow)
export class WeaponPickup extends Entity {
    constructor(type, x, y) {
        super(type, x, y);
        // type: T.WARHAMMER | T.CROSSBOW
    }
}

// ── AmmoPickup ── collectible ammunition (bolts, dynamite)
export class AmmoPickup extends Entity {
    constructor(type, x, y) {
        super(type, x, y);
        // type: T.AMMO_BOLT | T.AMMO_DYNAMITE
        this.count = type === T.AMMO_BOLT ? 5 : 2; // default stack sizes
    }
}

// ── CrossbowBolt ── visual-only projectile (hit-scan already handled damage)
export class CrossbowBolt extends Entity {
    constructor(x, y, vx, vy) {
        super(T.BOLT_PROJECTILE, x, y);
        this.vx = vx;
        this.vy = vy;
        this.lifespan = 0.6; // sec — enough to cross visible area
        this.age = 0;
    }
    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.age += dt;
        if (this.age > this.lifespan) this.alive = false;
    }
}

// ── ExplosionFX ── purely visual explosion sprite; extends Barrel so it reuses
//   Barrel.update() lifecycle and the sprites.js explosion-texture path.
export class ExplosionFX extends Barrel {
    constructor(x, y) {
        super(x, y);
        this.exploding    = true;
        this.explodeTimer = 0.5;  // visible for half a second
    }
}

// ── DynamiteThrown ── vhozený dynamit, 2s fuse, explodes
export class DynamiteThrown extends Entity {
    constructor(x, y, vx, vy) {
        super(T.AMMO_DYNAMITE, x, y);
        this.vx = vx;
        this.vy = vy;
        this.vz = 0.3; // upward velocity (gravity simulation)
        this.gravity = -1.2; // units/s²
        this.fuseTimer = 2.0; // seconds until explosion
        this.hasExploded = false;
        this.bounceCount = 0;
        this.maxBounces = 2;
    }
    update(dt) {
        this.vz += this.gravity * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.z = Math.max(0, (this.z || 0) + this.vz * dt);

        this.fuseTimer -= dt;
        if (this.fuseTimer <= 0) {
            this.hasExploded = true;
            this.alive = false;
        }
    }
}

/** Create entity instances from extracted entity list */
export function createEntities(entityList, difficulty = null) {
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
                entities.push(new Enemy(e.type, e.x, e.y, difficulty));
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
            case T.HEALTH_SMALL:
                entities.push(new SmallHealthPack(e.x, e.y));
                break;
            case T.PILLAR:
                entities.push(new Pillar(e.x, e.y));
                break;
            case T.KEY_RED:
            case T.KEY_BLUE:
                entities.push(new KeyItem(e.type, e.x, e.y));
                break;
            case T.FLASHLIGHT:
                entities.push(new Flashlight(e.x, e.y));
                break;
            case T.BARREL:
                entities.push(new Barrel(e.x, e.y));
                break;
            case T.MINE_LIGHT:
                entities.push(new MineLight(e.x, e.y));
                break;
            case T.MINE_CART:
                entities.push(new MineCart(e.x, e.y));
                break;
             case T.PICKAXE_DECOR:
                 entities.push(new PickaxeDecor(e.x, e.y));
                 break;
             case T.WARHAMMER:
             case T.CROSSBOW:
                 entities.push(new WeaponPickup(e.type, e.x, e.y));
                 break;
             case T.AMMO_BOLT:
             case T.AMMO_DYNAMITE:
                 entities.push(new AmmoPickup(e.type, e.x, e.y));
                 break;
         }
     }
     return entities;
}
