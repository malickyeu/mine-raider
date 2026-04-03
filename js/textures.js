/* ── textures.js ── procedural texture generation ── */

import { T } from './config.js';

const TEX_SIZE = 64;
const cache = {};

function createCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
}

function noise(ctx, w, h, baseR, baseG, baseB, variance) {
    const id = ctx.getImageData(0, 0, w, h);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
        const v = (Math.random() - 0.5) * variance;
        d[i]     = Math.max(0, Math.min(255, baseR + v));
        d[i + 1] = Math.max(0, Math.min(255, baseG + v));
        d[i + 2] = Math.max(0, Math.min(255, baseB + v));
        d[i + 3] = 255;
    }
    ctx.putImageData(id, 0, 0);
}

function genStone() {
    const c = createCanvas(TEX_SIZE, TEX_SIZE);
    const ctx = c.getContext('2d');
    noise(ctx, TEX_SIZE, TEX_SIZE, 90, 85, 80, 40);
    // mortar lines
    ctx.strokeStyle = 'rgba(40,35,30,0.6)';
    ctx.lineWidth = 1;
    const brickH = 16, brickW = 32;
    for (let row = 0; row < TEX_SIZE / brickH; row++) {
        const y = row * brickH;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(TEX_SIZE, y); ctx.stroke();
        const offset = (row % 2) * (brickW / 2);
        for (let col = 0; col <= TEX_SIZE / brickW + 1; col++) {
            const x = col * brickW + offset;
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + brickH); ctx.stroke();
        }
    }
    return c;
}

function genWood() {
    const c = createCanvas(TEX_SIZE, TEX_SIZE);
    const ctx = c.getContext('2d');
    noise(ctx, TEX_SIZE, TEX_SIZE, 100, 65, 30, 25);
    // vertical grain lines
    ctx.strokeStyle = 'rgba(60,35,10,0.5)';
    ctx.lineWidth = 1;
    for (let x = 0; x < TEX_SIZE; x += 6 + Math.random() * 4) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        for (let y = 0; y < TEX_SIZE; y += 8) {
            ctx.lineTo(x + (Math.random() - 0.5) * 3, y);
        }
        ctx.stroke();
    }
    // horizontal beam bands
    ctx.fillStyle = 'rgba(50,30,10,0.3)';
    ctx.fillRect(0, 0, TEX_SIZE, 4);
    ctx.fillRect(0, TEX_SIZE - 4, TEX_SIZE, 4);
    ctx.fillRect(0, 30, TEX_SIZE, 4);
    return c;
}

function genOre() {
    const c = createCanvas(TEX_SIZE, TEX_SIZE);
    const ctx = c.getContext('2d');
    noise(ctx, TEX_SIZE, TEX_SIZE, 80, 80, 65, 35);
    // ore veins (yellowish spots)
    for (let i = 0; i < 8; i++) {
        const x = Math.random() * TEX_SIZE;
        const y = Math.random() * TEX_SIZE;
        const r = 3 + Math.random() * 5;
        ctx.fillStyle = `rgba(${180 + Math.random()*50}, ${160 + Math.random()*40}, 40, 0.7)`;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    // stone mortar
    ctx.strokeStyle = 'rgba(40,40,30,0.4)';
    ctx.lineWidth = 1;
    for (let row = 0; row < 4; row++) {
        ctx.beginPath(); ctx.moveTo(0, row * 16); ctx.lineTo(TEX_SIZE, row * 16); ctx.stroke();
    }
    return c;
}

function genMossy() {
    const c = createCanvas(TEX_SIZE, TEX_SIZE);
    const ctx = c.getContext('2d');
    noise(ctx, TEX_SIZE, TEX_SIZE, 70, 90, 60, 35);
    // stone mortar underneath
    ctx.strokeStyle = 'rgba(30,50,20,0.5)';
    ctx.lineWidth = 1;
    const brickH = 16, brickW = 32;
    for (let row = 0; row < TEX_SIZE / brickH; row++) {
        const y = row * brickH;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(TEX_SIZE, y); ctx.stroke();
        const offset = (row % 2) * (brickW / 2);
        for (let col = 0; col <= TEX_SIZE / brickW + 1; col++) {
            const x = col * brickW + offset;
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + brickH); ctx.stroke();
        }
    }
    // moss patches
    for (let i = 0; i < 12; i++) {
        const x = Math.random() * TEX_SIZE;
        const y = Math.random() * TEX_SIZE;
        const r = 4 + Math.random() * 8;
        ctx.fillStyle = `rgba(${40 + Math.random()*30}, ${100 + Math.random()*50}, ${30 + Math.random()*20}, 0.6)`;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    return c;
}

function genCrystal() {
    const c = createCanvas(TEX_SIZE, TEX_SIZE);
    const ctx = c.getContext('2d');
    noise(ctx, TEX_SIZE, TEX_SIZE, 60, 70, 120, 30);
    // crystal shards
    for (let i = 0; i < 6; i++) {
        const cx = Math.random() * TEX_SIZE;
        const cy = Math.random() * TEX_SIZE;
        const h = 10 + Math.random() * 20;
        const w = 3 + Math.random() * 5;
        ctx.fillStyle = `rgba(${120 + Math.random()*80}, ${150 + Math.random()*60}, ${220 + Math.random()*35}, 0.7)`;
        ctx.beginPath();
        ctx.moveTo(cx, cy - h / 2);
        ctx.lineTo(cx + w / 2, cy + h / 2);
        ctx.lineTo(cx - w / 2, cy + h / 2);
        ctx.closePath();
        ctx.fill();
        // highlight
        ctx.fillStyle = `rgba(200,220,255,0.4)`;
        ctx.beginPath();
        ctx.moveTo(cx - 1, cy - h / 2 + 3);
        ctx.lineTo(cx + w / 4, cy);
        ctx.lineTo(cx - w / 4, cy);
        ctx.closePath();
        ctx.fill();
    }
    return c;
}

function genIron() {
    const c = createCanvas(TEX_SIZE, TEX_SIZE);
    const ctx = c.getContext('2d');
    noise(ctx, TEX_SIZE, TEX_SIZE, 100, 100, 115, 20);
    // rivets / plates
    ctx.strokeStyle = 'rgba(60,60,70,0.7)';
    ctx.lineWidth = 2;
    // horizontal plate lines
    for (let y = 0; y < TEX_SIZE; y += 16) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(TEX_SIZE, y); ctx.stroke();
    }
    // vertical plate lines
    for (let x = 0; x < TEX_SIZE; x += 32) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, TEX_SIZE); ctx.stroke();
    }
    // rivets
    ctx.fillStyle = '#bbbbc0';
    for (let y = 8; y < TEX_SIZE; y += 16) {
        for (let x = 4; x < TEX_SIZE; x += 16) {
            ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
        }
    }
    // rust spots
    for (let i = 0; i < 5; i++) {
        const x = Math.random() * TEX_SIZE;
        const y = Math.random() * TEX_SIZE;
        ctx.fillStyle = `rgba(${140 + Math.random()*40}, ${80 + Math.random()*30}, 40, 0.35)`;
        ctx.beginPath(); ctx.arc(x, y, 3 + Math.random() * 5, 0, Math.PI * 2); ctx.fill();
    }
    return c;
}

function genDoor() {
    const c = createCanvas(TEX_SIZE, TEX_SIZE);
    const ctx = c.getContext('2d');
    noise(ctx, TEX_SIZE, TEX_SIZE, 110, 75, 25, 20);
    // Door frame
    ctx.fillStyle = 'rgba(50,30,10,0.6)';
    ctx.fillRect(0, 0, 3, TEX_SIZE);
    ctx.fillRect(TEX_SIZE - 3, 0, 3, TEX_SIZE);
    ctx.fillRect(0, 0, TEX_SIZE, 3);
    ctx.fillRect(0, TEX_SIZE - 3, TEX_SIZE, 3);
    // Cross brace
    ctx.strokeStyle = 'rgba(60,35,10,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(3, 3); ctx.lineTo(TEX_SIZE - 3, TEX_SIZE - 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(TEX_SIZE - 3, 3); ctx.lineTo(3, TEX_SIZE - 3); ctx.stroke();
    // Handle
    ctx.fillStyle = '#aa8833';
    ctx.beginPath(); ctx.arc(TEX_SIZE - 12, TEX_SIZE / 2, 3, 0, Math.PI * 2); ctx.fill();
    return c;
}

function genDoorRed() {
    const c = createCanvas(TEX_SIZE, TEX_SIZE);
    const ctx = c.getContext('2d');
    noise(ctx, TEX_SIZE, TEX_SIZE, 120, 50, 40, 20);
    // Door frame (dark red)
    ctx.fillStyle = 'rgba(80,20,15,0.6)';
    ctx.fillRect(0, 0, 3, TEX_SIZE);
    ctx.fillRect(TEX_SIZE - 3, 0, 3, TEX_SIZE);
    ctx.fillRect(0, 0, TEX_SIZE, 3);
    ctx.fillRect(0, TEX_SIZE - 3, TEX_SIZE, 3);
    // Cross brace
    ctx.strokeStyle = 'rgba(100,30,20,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(3, 3); ctx.lineTo(TEX_SIZE - 3, TEX_SIZE - 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(TEX_SIZE - 3, 3); ctx.lineTo(3, TEX_SIZE - 3); ctx.stroke();
    // Lock icon (red tinted)
    ctx.fillStyle = '#cc4444';
    ctx.beginPath(); ctx.arc(TEX_SIZE / 2, TEX_SIZE / 2, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#881111';
    ctx.fillRect(TEX_SIZE / 2 - 4, TEX_SIZE / 2 + 2, 8, 6);
    // Handle
    ctx.fillStyle = '#cc5533';
    ctx.beginPath(); ctx.arc(TEX_SIZE - 12, TEX_SIZE / 2, 3, 0, Math.PI * 2); ctx.fill();
    return c;
}

function genDoorBlue() {
    const c = createCanvas(TEX_SIZE, TEX_SIZE);
    const ctx = c.getContext('2d');
    noise(ctx, TEX_SIZE, TEX_SIZE, 50, 60, 130, 20);
    // Door frame (dark blue)
    ctx.fillStyle = 'rgba(15,20,80,0.6)';
    ctx.fillRect(0, 0, 3, TEX_SIZE);
    ctx.fillRect(TEX_SIZE - 3, 0, 3, TEX_SIZE);
    ctx.fillRect(0, 0, TEX_SIZE, 3);
    ctx.fillRect(0, TEX_SIZE - 3, TEX_SIZE, 3);
    // Cross brace
    ctx.strokeStyle = 'rgba(20,30,100,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(3, 3); ctx.lineTo(TEX_SIZE - 3, TEX_SIZE - 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(TEX_SIZE - 3, 3); ctx.lineTo(3, TEX_SIZE - 3); ctx.stroke();
    // Lock icon (blue tinted)
    ctx.fillStyle = '#4488ff';
    ctx.beginPath(); ctx.arc(TEX_SIZE / 2, TEX_SIZE / 2, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#113388';
    ctx.fillRect(TEX_SIZE / 2 - 4, TEX_SIZE / 2 + 2, 8, 6);
    // Handle
    ctx.fillStyle = '#3366cc';
    ctx.beginPath(); ctx.arc(TEX_SIZE - 12, TEX_SIZE / 2, 3, 0, Math.PI * 2); ctx.fill();
    return c;
}

const generators = {
    [T.STONE]:     genStone,
    [T.WOOD]:      genWood,
    [T.ORE]:       genOre,
    [T.MOSSY]:     genMossy,
    [T.CRYSTAL]:   genCrystal,
    [T.IRON]:      genIron,
    [T.DOOR]:      genDoor,
    [T.DOOR_RED]:  genDoorRed,
    [T.DOOR_BLUE]: genDoorBlue,
};

export function getTexture(tileType) {
    if (!cache[tileType]) {
        const gen = generators[tileType];
        cache[tileType] = gen ? gen() : genStone();
    }
    return cache[tileType];
}

export function getTextureSize() {
    return TEX_SIZE;
}

/* ── Sprite textures (simple drawn icons) ── */

const spriteCache = {};

function drawGold() {
    const c = createCanvas(32, 32);
    const ctx = c.getContext('2d');
    // gold nugget
    ctx.fillStyle = '#ffd700';
    ctx.beginPath(); ctx.arc(16, 18, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffec80';
    ctx.beginPath(); ctx.arc(13, 15, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b8960f';
    ctx.beginPath(); ctx.arc(20, 22, 3, 0, Math.PI * 2); ctx.fill();
    return c;
}

function drawGem() {
    const c = createCanvas(32, 32);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ff44ff';
    ctx.beginPath();
    ctx.moveTo(16, 4); ctx.lineTo(28, 14); ctx.lineTo(22, 28);
    ctx.lineTo(10, 28); ctx.lineTo(4, 14);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffaaff';
    ctx.beginPath();
    ctx.moveTo(16, 8); ctx.lineTo(22, 14); ctx.lineTo(16, 16); ctx.closePath(); ctx.fill();
    return c;
}

function drawBat() {
    const c = createCanvas(32, 32);
    const ctx = c.getContext('2d');
    // body
    ctx.fillStyle = '#663366';
    ctx.beginPath(); ctx.ellipse(16, 18, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
    // wings
    ctx.fillStyle = '#553355';
    ctx.beginPath();
    ctx.moveTo(11, 16); ctx.quadraticCurveTo(2, 8, 4, 18);
    ctx.lineTo(11, 20); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(21, 16); ctx.quadraticCurveTo(30, 8, 28, 18);
    ctx.lineTo(21, 20); ctx.closePath(); ctx.fill();
    // eyes
    ctx.fillStyle = '#ff4444';
    ctx.beginPath(); ctx.arc(14, 15, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(18, 15, 2, 0, Math.PI * 2); ctx.fill();
    return c;
}

function drawSkeleton() {
    const c = createCanvas(32, 32);
    const ctx = c.getContext('2d');
    // skull
    ctx.fillStyle = '#ddddcc';
    ctx.beginPath(); ctx.arc(16, 10, 7, 0, Math.PI * 2); ctx.fill();
    // eyes
    ctx.fillStyle = '#222';
    ctx.fillRect(12, 8, 3, 3);
    ctx.fillRect(18, 8, 3, 3);
    // mouth
    ctx.fillRect(13, 14, 2, 1); ctx.fillRect(16, 14, 2, 1); ctx.fillRect(19, 14, 2, 1);
    // body
    ctx.strokeStyle = '#ddddcc'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(16, 17); ctx.lineTo(16, 26); ctx.stroke();
    // ribs
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(12, 20); ctx.lineTo(20, 20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(12, 22); ctx.lineTo(20, 22); ctx.stroke();
    // arms
    ctx.beginPath(); ctx.moveTo(16, 19); ctx.lineTo(9, 24); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(16, 19); ctx.lineTo(23, 24); ctx.stroke();
    return c;
}

function drawExit() {
    const c = createCanvas(32, 32);
    const ctx = c.getContext('2d');
    // door frame
    ctx.fillStyle = '#8B5A2B';
    ctx.fillRect(6, 2, 20, 28);
    // door
    ctx.fillStyle = '#5a3010';
    ctx.fillRect(8, 4, 16, 24);
    // light glow
    ctx.fillStyle = '#44ff88';
    ctx.globalAlpha = 0.6;
    ctx.beginPath(); ctx.arc(16, 16, 12, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    // arrow
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⇧', 16, 22);
    return c;
}

function drawTorch() {
    const c = createCanvas(32, 32);
    const ctx = c.getContext('2d');
    // stick
    ctx.fillStyle = '#8B5A2B';
    ctx.fillRect(14, 14, 4, 16);
    // flame
    const grad = ctx.createRadialGradient(16, 10, 1, 16, 10, 8);
    grad.addColorStop(0, '#ffe060');
    grad.addColorStop(0.5, '#ff8800');
    grad.addColorStop(1, 'rgba(255,60,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(16, 10, 8, 0, Math.PI * 2); ctx.fill();
    return c;
}

function drawHealth() {
    const c = createCanvas(32, 32);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ff3333';
    // cross
    ctx.fillRect(12, 6, 8, 20);
    ctx.fillRect(6, 12, 20, 8);
    ctx.fillStyle = '#ff8888';
    ctx.fillRect(14, 8, 4, 16);
    ctx.fillRect(8, 14, 16, 4);
    return c;
}

function drawHealthSmall() {
    const c = createCanvas(32, 32);
    const ctx = c.getContext('2d');
    // Smaller pink cross – visually lighter than the full health pack
    ctx.fillStyle = '#cc3366';
    ctx.fillRect(13, 9, 6, 14);
    ctx.fillRect(9, 13, 14, 6);
    ctx.fillStyle = '#ee88aa';
    ctx.fillRect(14, 11, 4, 10);
    ctx.fillRect(11, 14, 10, 4);
    // Small white center dot to distinguish at a glance
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.arc(16, 16, 2, 0, Math.PI * 2); ctx.fill();
    return c;
}

function drawSpider() {
    const c = createCanvas(32, 32);
    const ctx = c.getContext('2d');
    // body
    ctx.fillStyle = '#3a4a20';
    ctx.beginPath(); ctx.ellipse(16, 18, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
    // head
    ctx.fillStyle = '#2a3a10';
    ctx.beginPath(); ctx.arc(16, 11, 4, 0, Math.PI * 2); ctx.fill();
    // eyes (multiple, spider-like)
    ctx.fillStyle = '#ff2222';
    ctx.beginPath(); ctx.arc(14, 10, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(18, 10, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#cc1111';
    ctx.beginPath(); ctx.arc(15, 8, 1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(17, 8, 1, 0, Math.PI * 2); ctx.fill();
    // legs
    ctx.strokeStyle = '#2a3a10';
    ctx.lineWidth = 1.5;
    const legPairs = [[-8, -4], [-10, 0], [-9, 4], [-7, 7]];
    for (const [ox, oy] of legPairs) {
        // left
        ctx.beginPath(); ctx.moveTo(12, 16 + oy / 2); ctx.quadraticCurveTo(8 + ox, 14 + oy, 6 + ox, 20 + oy); ctx.stroke();
        // right (mirrored)
        ctx.beginPath(); ctx.moveTo(20, 16 + oy / 2); ctx.quadraticCurveTo(24 - ox, 14 + oy, 26 - ox, 20 + oy); ctx.stroke();
    }
    return c;
}

function drawGhost() {    const c = createCanvas(32, 32);
    const ctx = c.getContext('2d');
    // translucent body
    ctx.fillStyle = 'rgba(170, 200, 255, 0.7)';
    ctx.beginPath();
    ctx.moveTo(10, 28);
    ctx.lineTo(10, 12);
    ctx.quadraticCurveTo(10, 4, 16, 4);
    ctx.quadraticCurveTo(22, 4, 22, 12);
    ctx.lineTo(22, 28);
    // wavy bottom
    ctx.lineTo(20, 25); ctx.lineTo(18, 28);
    ctx.lineTo(16, 25); ctx.lineTo(14, 28);
    ctx.lineTo(12, 25); ctx.lineTo(10, 28);
    ctx.closePath();
    ctx.fill();
    // inner glow
    ctx.fillStyle = 'rgba(220, 240, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(16, 14, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // eyes
    ctx.fillStyle = '#112244';
    ctx.beginPath(); ctx.ellipse(13, 13, 2, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(19, 13, 2, 3, 0, 0, Math.PI * 2); ctx.fill();
    // mouth
    ctx.beginPath(); ctx.ellipse(16, 20, 2, 2, 0, 0, Math.PI * 2); ctx.fill();
    return c;
}

function drawPillar() {
    const c = createCanvas(32, 32);
    const ctx = c.getContext('2d');
    // Transparent background – draw only the central column (x 10–22)
    const x0 = 10, w = 12;

    const grad = ctx.createLinearGradient(x0, 0, x0 + w, 0);
    grad.addColorStop(0,    '#3a3530');
    grad.addColorStop(0.15, '#6a5f55');
    grad.addColorStop(0.5,  '#9a8a7a');
    grad.addColorStop(0.85, '#6a5f55');
    grad.addColorStop(1,    '#3a3530');
    ctx.fillStyle = grad;
    ctx.fillRect(x0, 0, w, 32);

    // Horizontal mortar lines
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    for (let y = 7; y < 32; y += 8) ctx.fillRect(x0, y, w, 1);

    // Top cap
    ctx.fillStyle = 'rgba(180,160,140,0.6)';
    ctx.fillRect(x0 - 1, 0, w + 2, 3);

    // Hard edge shadows
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x0, 0, 2, 32);
    ctx.fillRect(x0 + w - 2, 0, 2, 32);

    return c;
}

function drawKey(color, highlight, shadow) {
    const c = createCanvas(32, 32);
    const ctx = c.getContext('2d');
    // Key bow (round ring at top)
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(16, 10, 6, 0, Math.PI * 2); ctx.stroke();
    // Highlight on bow
    ctx.strokeStyle = highlight;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(14, 8, 3, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke();
    // Shaft
    ctx.fillStyle = color;
    ctx.fillRect(14, 16, 4, 12);
    // Teeth
    ctx.fillStyle = shadow;
    ctx.fillRect(18, 22, 4, 2);
    ctx.fillRect(18, 26, 3, 2);
    // Shaft highlight
    ctx.fillStyle = highlight;
    ctx.fillRect(15, 16, 1, 12);
    return c;
}

function drawKeyRed()  { return drawKey('#ff4444', '#ff8888', '#aa2222'); }
function drawKeyBlue() { return drawKey('#4488ff', '#88bbff', '#2255aa'); }

function drawFlashlight() {
    const c = createCanvas(32, 32);
    const ctx = c.getContext('2d');
    // Outer glow / halo
    const halo = ctx.createRadialGradient(16, 17, 3, 16, 17, 14);
    halo.addColorStop(0,   'rgba(255,220,80,0.55)');
    halo.addColorStop(0.6, 'rgba(255,140,10,0.25)');
    halo.addColorStop(1,   'rgba(255,80,0,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, 32, 32);
    // Lantern body
    ctx.fillStyle = '#888';
    ctx.fillRect(12, 6,  8, 2);   // top cap
    ctx.fillRect(11, 8,  1, 16);  // left frame
    ctx.fillRect(20, 8,  1, 16);  // right frame
    ctx.fillRect(11, 23, 10, 2);  // bottom frame
    // Metal bands
    ctx.fillStyle = '#666';
    ctx.fillRect(11, 13, 10, 1);
    ctx.fillRect(11, 18, 10, 1);
    // Glass (amber glow inside)
    ctx.fillStyle = 'rgba(255,215,80,0.75)';
    ctx.fillRect(12, 9, 8, 14);
    // Inner flame
    const flameGrad = ctx.createRadialGradient(16, 15, 1, 16, 16, 5);
    flameGrad.addColorStop(0, 'rgba(255,255,220,0.95)');
    flameGrad.addColorStop(0.5, 'rgba(255,200,50,0.7)');
    flameGrad.addColorStop(1,   'rgba(255,100,0,0)');
    ctx.fillStyle = flameGrad;
    ctx.beginPath(); ctx.ellipse(16, 16, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
    // Handle
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(16, 5, 3, Math.PI, 0); ctx.stroke();
    // Base
    ctx.fillStyle = '#777';
    ctx.fillRect(10, 25, 12, 3);
    return c;
}

function drawBarrel() {
    const c = createCanvas(32, 32);
    const ctx = c.getContext('2d');
    // ── Compact barrel sitting on ground ──
    // Barrel occupies bottom ~45% of texture (realistic height ~1m)
    const bTop = 17, bBot = 31, bMid = (bTop + bBot) / 2;
    const wTop = 7, wMid = 9, wBot = 7; // half-widths (bulge in center)
    // Barrel silhouette with slight bulge
    ctx.fillStyle = '#7a4a22';
    ctx.beginPath();
    ctx.moveTo(16 - wTop, bTop);
    ctx.quadraticCurveTo(16 - wMid - 1, bMid, 16 - wBot, bBot);
    ctx.lineTo(16 + wBot, bBot);
    ctx.quadraticCurveTo(16 + wMid + 1, bMid, 16 + wTop, bTop);
    ctx.closePath();
    ctx.fill();
    // Vertical stave lines
    ctx.strokeStyle = 'rgba(40,20,5,0.35)';
    ctx.lineWidth = 0.7;
    for (let sx = -5; sx <= 5; sx += 2.5) {
        ctx.beginPath();
        ctx.moveTo(16 + sx * 0.85, bTop + 1);
        ctx.quadraticCurveTo(16 + sx * 1.1, bMid, 16 + sx * 0.85, bBot - 1);
        ctx.stroke();
    }
    // Light side highlight
    ctx.fillStyle = 'rgba(160,110,50,0.22)';
    ctx.fillRect(9, bTop + 1, 2, bBot - bTop - 2);
    // Metal bands (3 hoops)
    const bands = [bTop + 2, bMid, bBot - 2];
    for (const by of bands) {
        ctx.fillStyle = '#666';
        ctx.fillRect(16 - wMid, by, wMid * 2, 1.5);
        ctx.fillStyle = 'rgba(200,200,210,0.3)';
        ctx.fillRect(16 - wMid, by, wMid * 2, 0.7);
    }
    // Top cap
    ctx.fillStyle = '#8a5a28';
    ctx.beginPath(); ctx.ellipse(16, bTop, wTop, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(40,20,5,0.4)';
    ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.ellipse(16, bTop, wTop, 2, 0, 0, Math.PI * 2); ctx.stroke();
    // TNT marking
    ctx.fillStyle = '#cc2222';
    ctx.font = 'bold 6px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TNT', 16, bMid + 1);
    // Fuse
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(16, bTop - 1);
    ctx.quadraticCurveTo(18, bTop - 4, 20, bTop - 3);
    ctx.stroke();
    // Spark
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath(); ctx.arc(20, bTop - 3, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,200,50,0.45)';
    ctx.beginPath(); ctx.arc(20, bTop - 3, 2.5, 0, Math.PI * 2); ctx.fill();
    return c;
}

function drawMineLight() {
    const c = createCanvas(32, 32);
    const ctx = c.getContext('2d');
    // Glow halo
    const halo = ctx.createRadialGradient(16, 14, 2, 16, 14, 12);
    halo.addColorStop(0, 'rgba(255,220,100,0.5)');
    halo.addColorStop(0.6, 'rgba(255,180,40,0.2)');
    halo.addColorStop(1, 'rgba(200,120,0,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, 32, 32);
    // Mounting bracket (metal)
    ctx.fillStyle = '#666';
    ctx.fillRect(14, 2, 4, 4);
    // Wire / chain
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(16, 6); ctx.lineTo(16, 9); ctx.stroke();
    // Lamp housing (small cage)
    ctx.fillStyle = '#777';
    ctx.fillRect(11, 9, 10, 2);   // top plate
    ctx.fillRect(11, 21, 10, 2);  // bottom plate
    ctx.fillRect(11, 9, 1, 14);   // left bar
    ctx.fillRect(20, 9, 1, 14);   // right bar
    // Glass / light
    ctx.fillStyle = 'rgba(255,230,120,0.8)';
    ctx.fillRect(12, 11, 8, 10);
    // Inner filament glow
    const glow = ctx.createRadialGradient(16, 15, 1, 16, 16, 4);
    glow.addColorStop(0, 'rgba(255,255,200,1)');
    glow.addColorStop(0.5, 'rgba(255,200,60,0.7)');
    glow.addColorStop(1, 'rgba(255,150,20,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.ellipse(16, 16, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
    return c;
}

function drawMineCart() {
    const c = createCanvas(32, 32);
    const ctx = c.getContext('2d');
    // ── Mine cart on rails, everything in bottom ~55% of texture ──
    // Rails at very bottom
    ctx.fillStyle = '#5a5a5a';
    ctx.fillRect(2, 31, 28, 1);
    // Rail ties
    ctx.fillStyle = '#4a3a28';
    ctx.fillRect(5, 30, 3, 2);
    ctx.fillRect(14, 30, 3, 2);
    ctx.fillRect(23, 30, 3, 2);
    // Wheels (on rails)
    ctx.fillStyle = '#5a5a5a';
    ctx.beginPath(); ctx.arc(9, 29, 2.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(23, 29, 2.8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#777';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(9, 29, 2.8, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(23, 29, 2.8, 0, Math.PI * 2); ctx.stroke();
    // Wheel hubs
    ctx.fillStyle = '#888';
    ctx.beginPath(); ctx.arc(9, 29, 1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(23, 29, 1, 0, Math.PI * 2); ctx.fill();
    // Axle
    ctx.fillStyle = '#555';
    ctx.fillRect(9, 28.5, 14, 1.2);
    // Cart body (trapezoidal bucket)
    ctx.fillStyle = '#7a6a58';
    ctx.beginPath();
    ctx.moveTo(4, 26);
    ctx.lineTo(7, 15);
    ctx.lineTo(25, 15);
    ctx.lineTo(28, 26);
    ctx.closePath();
    ctx.fill();
    // Side plank lines
    ctx.strokeStyle = 'rgba(40,30,18,0.4)';
    ctx.lineWidth = 0.7;
    for (let y = 17; y <= 25; y += 2.5) {
        const t = (y - 15) / 11;
        const inL = 7 - t * 3;
        const inR = 25 + t * 3;
        ctx.beginPath(); ctx.moveTo(inL, y); ctx.lineTo(inR, y); ctx.stroke();
    }
    // Metal rim
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(4, 26); ctx.lineTo(7, 15); ctx.lineTo(25, 15); ctx.lineTo(28, 26); ctx.closePath();
    ctx.stroke();
    // Corner rivets
    ctx.fillStyle = '#aaa';
    ctx.beginPath(); ctx.arc(7, 15, 1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(25, 15, 1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5, 25, 1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(27, 25, 1, 0, Math.PI * 2); ctx.fill();
    // Ore / rocks inside
    ctx.fillStyle = '#5a5040';
    ctx.beginPath(); ctx.ellipse(16, 16, 7, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    // Individual rocks
    const rocks = [[11,15,2,'#6a6048'],[17,14.5,1.8,'#7a704a'],[14,17,1.5,'#555038'],[21,16,1.3,'#686050']];
    for (const [rx,ry,rr,rc] of rocks) {
        ctx.fillStyle = rc;
        ctx.beginPath(); ctx.arc(rx, ry, rr, 0, Math.PI * 2); ctx.fill();
    }
    // Gold vein
    ctx.fillStyle = 'rgba(200,180,60,0.5)';
    ctx.beginPath(); ctx.arc(12, 14.5, 1, 0, Math.PI * 2); ctx.fill();
    return c;
}

function drawPickaxeDecor() {
    const c = createCanvas(32, 32);
    const ctx = c.getContext('2d');
    // ── Pickaxe leaning slightly against wall, bottom ~60% of texture ──
    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(16, 31, 4, 1, 0, 0, Math.PI * 2); ctx.fill();
    // Handle — nearly vertical, very slight lean
    ctx.strokeStyle = '#6e4420';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(17, 31); ctx.lineTo(15, 13); ctx.stroke();
    // Handle highlight
    ctx.strokeStyle = 'rgba(160,115,55,0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(16, 31); ctx.lineTo(14, 13); ctx.stroke();
    // ── Pick head — thick bar across the top ──
    // Dark iron head shape (curved pick on right, flat adze on left)
    ctx.fillStyle = '#6e6e74';
    ctx.beginPath();
    // Right side: curved pick spike
    ctx.moveTo(15, 14);          // center/handle junction
    ctx.lineTo(27, 11);          // tip of pick
    ctx.lineTo(28, 13);          // underside of pick tip
    ctx.lineTo(15, 15);          // back to center bottom
    ctx.closePath();
    ctx.fill();
    // Left side: flat adze/chisel
    ctx.fillStyle = '#636368';
    ctx.beginPath();
    ctx.moveTo(15, 14);
    ctx.lineTo(4, 12);           // blunt end
    ctx.lineTo(3, 14);           // bottom edge
    ctx.lineTo(15, 15);
    ctx.closePath();
    ctx.fill();
    // Metal shine along top edge of pick
    ctx.strokeStyle = 'rgba(190,190,200,0.5)';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(5, 12.5); ctx.lineTo(27, 11.5); ctx.stroke();
    // Dark underside edge
    ctx.strokeStyle = 'rgba(30,30,35,0.4)';
    ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(4, 14); ctx.lineTo(28, 13); ctx.stroke();
    // Binding collar (where head meets handle)
    ctx.fillStyle = '#555';
    ctx.fillRect(13, 12, 5, 4);
    ctx.fillStyle = '#777';
    ctx.fillRect(14, 12.5, 3, 3);
    return c;
}

function drawExplosion() {
    const c = createCanvas(32, 32);
    const ctx = c.getContext('2d');
    // Explosion flash
    const grad = ctx.createRadialGradient(16, 16, 1, 16, 16, 15);
    grad.addColorStop(0, '#ffffee');
    grad.addColorStop(0.2, '#ffcc33');
    grad.addColorStop(0.5, '#ff6600');
    grad.addColorStop(0.8, '#cc2200');
    grad.addColorStop(1, 'rgba(80,10,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(16, 16, 15, 0, Math.PI * 2); ctx.fill();
    // Sparks
    ctx.fillStyle = '#ffee66';
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const r = 8 + Math.random() * 5;
        ctx.beginPath();
        ctx.arc(16 + Math.cos(a) * r, 16 + Math.sin(a) * r, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
    return c;
}

// Pillar needs its own cache so alpha is preserved
const pillarCache = {};
export function getPillarTexture() {
    if (!pillarCache.tex) pillarCache.tex = drawPillar();
    return pillarCache.tex;
}

// ── Pickup sprites for weapon / ammo pickups ──
// All use standard 32×32 canvas so they render at the same scale as other sprites.
function drawSpriteWarhammer() {
    const c = createCanvas(32, 32); const ctx = c.getContext('2d');
    // Handle (lower half, centered)
    ctx.fillStyle = '#6B4226';
    ctx.fillRect(14, 13, 4, 17);
    ctx.fillStyle = '#555';
    for (let i = 0; i < 2; i++) ctx.fillRect(13, 15 + i * 7, 6, 2); // grip bands
    // Head (upper portion)
    ctx.fillStyle = '#5A5A5A';
    ctx.fillRect(5, 3, 22, 12);
    ctx.fillStyle = '#777';
    ctx.fillRect(7, 5, 14, 4);  // top face highlight
    ctx.fillStyle = '#888';
    ctx.fillRect(25, 5, 2, 8);  // side shine
    return c;
}

function drawSpriteCrossbow() {
    const c = createCanvas(32, 32); const ctx = c.getContext('2d');
    // Stock (horizontal beam, vertically centred)
    ctx.fillStyle = '#7a5230';
    ctx.fillRect(4, 14, 24, 5);
    // Bow limbs (vertical, at left end)
    ctx.strokeStyle = '#5a3a10'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(5, 12); ctx.lineTo(5, 5);  ctx.stroke(); // top limb
    ctx.beginPath(); ctx.moveTo(5, 22); ctx.lineTo(5, 27); ctx.stroke(); // bottom limb
    // Bowstring
    ctx.strokeStyle = '#cccccc'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(5, 5); ctx.lineTo(16, 17); ctx.lineTo(5, 27); ctx.stroke();
    // Bolt on stock
    ctx.fillStyle = '#aaaaaa';
    ctx.fillRect(16, 16, 12, 2);
    ctx.fillStyle = '#888888';
    ctx.beginPath(); ctx.moveTo(28, 15); ctx.lineTo(32, 17); ctx.lineTo(28, 19); ctx.fill();
    return c;
}

function drawSpriteAmmoBolt() {
    const c = createCanvas(32, 32); const ctx = c.getContext('2d');
    // 3 crossbow bolts bundled, centered in canvas
    for (let i = 0; i < 3; i++) {
        const y = 10 + i * 5;
        // Shaft
        ctx.fillStyle = '#8B5E3C';
        ctx.fillRect(4, y, 20, 2);
        // Metal tip
        ctx.fillStyle = '#aaaaaa';
        ctx.beginPath(); ctx.moveTo(24, y - 1); ctx.lineTo(28, y + 1); ctx.lineTo(24, y + 3); ctx.fill();
        // Feather/fletch
        ctx.fillStyle = '#cc9944';
        ctx.fillRect(2, y, 4, 2);
    }
    // Binding twine
    ctx.strokeStyle = '#888888'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(11, 10); ctx.lineTo(11, 24); ctx.stroke();
    return c;
}

function drawSpriteAmmoDynamite() {
    const c = createCanvas(32, 32); const ctx = c.getContext('2d');
    // 2 dynamite sticks side by side, centered
    for (let i = 0; i < 2; i++) {
        const x = 6 + i * 13;
        // Body
        ctx.fillStyle = '#cc4422';
        ctx.fillRect(x, 9, 9, 17);
        // Cap
        ctx.fillStyle = '#aa3311';
        ctx.fillRect(x, 9, 9, 4);
        // Label stripe
        ctx.fillStyle = '#ffeecc';
        ctx.fillRect(x + 1, 16, 7, 3);
        // Fuse
        ctx.strokeStyle = '#777777'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x + 4, 9); ctx.lineTo(x + 6, 3); ctx.stroke();
    }
    // Binding wire
    ctx.strokeStyle = '#888888'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(6, 17); ctx.lineTo(27, 17); ctx.stroke();
    return c;
}

// ── FP weapon textures: crossbow (first-person aimed-forward view) ──
function drawWeaponCrossbow() {
    const W = 128, H = 128;
    const c = createCanvas(W, H);
    const ctx = c.getContext('2d');

    ctx.save();
    ctx.translate(W * 0.5, H * 0.92); // anchor bottom-center

    // ── Stock — foreshortened trapezoid (wider near player) ──
    ctx.fillStyle = '#7a5230';
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo( 16, 0);
    ctx.lineTo(  9, -56);
    ctx.lineTo( -9, -56);
    ctx.fill();
    // Wood grain
    ctx.strokeStyle = 'rgba(50,30,10,0.4)'; ctx.lineWidth = 0.8;
    for (let i = 1; i <= 3; i++) {
        const y = -i * 14; const hw = 16 - i * 2;
        ctx.beginPath(); ctx.moveTo(-hw, y); ctx.lineTo(hw, y); ctx.stroke();
    }

    // ── Grip / forestock ──
    ctx.fillStyle = '#5C3A1E';
    ctx.fillRect(-14, -14, 28, 16);
    ctx.fillStyle = '#4a2c10';
    for (let i = 0; i < 3; i++) ctx.fillRect(-15, -12 + i * 4, 30, 2.5);

    // ── Trigger ──
    ctx.fillStyle = '#444';
    ctx.fillRect(-3, -24, 6, 8);
    ctx.strokeStyle = '#444'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, -20, 5, 0, Math.PI); ctx.stroke();

    // ── Bow arms (horizontal wings near far end) ──
    ctx.fillStyle = '#5a3a10';
    ctx.fillRect(-50, -50, 40, 8); // left arm
    ctx.fillRect(  10, -50, 40, 8); // right arm
    ctx.fillStyle = '#3a2a05';
    ctx.fillRect(-52, -50, 5, 8);   // left tip
    ctx.fillRect( 47, -50, 5, 8);   // right tip

    // ── Bowstring ──
    ctx.strokeStyle = '#d8d8c8'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-50, -46);
    ctx.lineTo(  0, -42);
    ctx.lineTo( 50, -46);
    ctx.stroke();

    // ── Bolt track (centre rail) ──
    ctx.fillStyle = '#8B6633';
    ctx.fillRect(-2.5, -58, 5, 40);

    // ── Loaded bolt ──
    ctx.fillStyle = '#8B5E3C'; // shaft
    ctx.fillRect(-1.5, -60, 3, 28);
    ctx.fillStyle = '#cccccc'; // tip
    ctx.beginPath();
    ctx.moveTo(-3.5, -58); ctx.lineTo(3.5, -58); ctx.lineTo(0, -68);
    ctx.fill();
    ctx.fillStyle = '#eeeeee'; // tip shine
    ctx.beginPath(); ctx.moveTo(-1, -62); ctx.lineTo(1, -62); ctx.lineTo(0, -68); ctx.fill();
    // Fletching
    ctx.fillStyle = '#cc9944';
    ctx.beginPath(); ctx.moveTo(-1.5, -35); ctx.lineTo(-6, -30); ctx.lineTo(-1.5, -30); ctx.fill();
    ctx.beginPath(); ctx.moveTo( 1.5, -35); ctx.lineTo( 6, -30); ctx.lineTo( 1.5, -30); ctx.fill();

    ctx.restore();
    return c;
}

// ── FP weapon textures: dynamite ──
function drawWeaponDynamite() {
    const W = 128, H = 128;
    const c = createCanvas(W, H);
    const ctx = c.getContext('2d');

    ctx.save();
    ctx.translate(W * 0.58, H * 0.75);
    ctx.rotate(0.3); // slight tilt as if holding it

    // Stick body
    ctx.fillStyle = '#cc4422';
    ctx.fillRect(-8, -50, 16, 50);
    // Top cap
    ctx.fillStyle = '#aa3311';
    ctx.fillRect(-8, -50, 16, 10);
    // Label
    ctx.fillStyle = '#ffeecc';
    ctx.fillRect(-6, -38, 12, 10);
    ctx.fillStyle = '#cc4422';
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TNT', 0, -31);
    // Fuse
    ctx.strokeStyle = '#999'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -50);
    ctx.quadraticCurveTo(10, -62, 5, -72);
    ctx.stroke();
    // Fuse spark
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath(); ctx.arc(5, -72, 2.5, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
    return c;
}

// ── Flying bolt projectile sprite (billboard, runtime-only) ──
function drawBoltProjectile() {
    const c = createCanvas(16, 16);
    const ctx = c.getContext('2d');
    // Subtle glow halo
    ctx.fillStyle = 'rgba(200,220,255,0.35)';
    ctx.beginPath(); ctx.arc(8, 7, 5, 0, Math.PI * 2); ctx.fill();
    // Arrowhead tip (top)
    ctx.fillStyle = '#dddddd';
    ctx.beginPath();
    ctx.moveTo(8, 1); ctx.lineTo(12, 7); ctx.lineTo(8, 6); ctx.lineTo(4, 7);
    ctx.fill();
    // Shaft
    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(7, 6, 2, 7);
    // Fletching
    ctx.fillStyle = '#cc9944';
    ctx.beginPath(); ctx.moveTo(7, 12); ctx.lineTo(3, 15); ctx.lineTo(7, 14); ctx.fill();
    ctx.beginPath(); ctx.moveTo(9, 12); ctx.lineTo(13, 15); ctx.lineTo(9, 14); ctx.fill();
    return c;
}

const spriteGenerators = {    [T.GOLD]:     drawGold,
    [T.GEM]:      drawGem,
    [T.BAT]:      drawBat,
    [T.SKELETON]: drawSkeleton,
    [T.EXIT]:     drawExit,
    [T.TORCH]:    drawTorch,
    [T.HEALTH]:   drawHealth,
    [T.HEALTH_SMALL]: drawHealthSmall,
    [T.SPIDER]:   drawSpider,
    [T.GHOST]:    drawGhost,
    [T.PILLAR]:   drawPillar,
    [T.KEY_RED]:  drawKeyRed,
    [T.KEY_BLUE]: drawKeyBlue,
    [T.FLASHLIGHT]: drawFlashlight,
    [T.BARREL]:       drawBarrel,
    [T.MINE_LIGHT]:   drawMineLight,
    [T.MINE_CART]:    drawMineCart,
    [T.PICKAXE_DECOR]:drawPickaxeDecor,
    [T.WARHAMMER]:    drawSpriteWarhammer,
    [T.CROSSBOW]:     drawSpriteCrossbow,
    [T.AMMO_BOLT]:    drawSpriteAmmoBolt,
    [T.AMMO_DYNAMITE]:drawSpriteAmmoDynamite,
    [T.BOLT_PROJECTILE]: drawBoltProjectile,
};

export function getSpriteTexture(entityType) {
    if (!spriteCache[entityType]) {
        const gen = spriteGenerators[entityType];
        spriteCache[entityType] = gen ? gen() : drawGold();
    }
    return spriteCache[entityType];
}

export function getExplosionTexture() {
    if (!spriteCache['_explosion']) spriteCache['_explosion'] = drawExplosion();
    return spriteCache['_explosion'];
}

// ─────────────────────────────────────────────
// ── First-Person Weapon Textures ──
// ─────────────────────────────────────────────

const weaponCache = {};

function drawWeaponPickaxe() {
    const W = 128, H = 128;
    const c = createCanvas(W, H);
    const ctx = c.getContext('2d');

    // The pickaxe is drawn in the lower-right quadrant, angled so
    // handle goes bottom-right → top-left, head at top-left.
    ctx.save();
    ctx.translate(W * 0.72, H * 0.88);
    ctx.rotate(-0.75); // tilt the whole weapon

    // ── Handle (wooden shaft) ──
    const handleLen = 82, handleW = 7;
    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(-handleW / 2, -handleLen, handleW, handleLen);
    // Wood grain
    ctx.strokeStyle = 'rgba(60,35,15,0.5)';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 6; i++) {
        const y = -handleLen + 8 + i * 13;
        ctx.beginPath(); ctx.moveTo(-3, y); ctx.lineTo(3, y + 4); ctx.stroke();
    }
    // Grip wrapping at bottom
    ctx.fillStyle = '#5C3A1E';
    for (let i = 0; i < 4; i++) {
        ctx.fillRect(-handleW / 2 - 1, -8 + i * 5, handleW + 2, 3);
    }

    // ── Metal head ──
    const headY = -handleLen + 2;

    // Left pick — curves downward (toward handle)
    ctx.fillStyle = '#707070';
    ctx.beginPath();
    ctx.moveTo(-4, headY + 4);
    ctx.lineTo(-28, headY - 2);
    ctx.quadraticCurveTo(-34, headY + 4, -32, headY + 14);
    ctx.lineTo(-28, headY + 10);
    ctx.quadraticCurveTo(-30, headY + 6, -4, headY + 9);
    ctx.fill();
    // Pick edge highlight
    ctx.fillStyle = '#999';
    ctx.beginPath();
    ctx.moveTo(-28, headY - 1);
    ctx.quadraticCurveTo(-33, headY + 4, -32, headY + 12);
    ctx.lineTo(-30, headY + 10);
    ctx.quadraticCurveTo(-31, headY + 5, -27, headY + 1);
    ctx.fill();

    // Right pick — also curves downward
    ctx.fillStyle = '#707070';
    ctx.beginPath();
    ctx.moveTo(4, headY + 4);
    ctx.lineTo(24, headY - 2);
    ctx.quadraticCurveTo(30, headY + 4, 28, headY + 14);
    ctx.lineTo(24, headY + 10);
    ctx.quadraticCurveTo(26, headY + 6, 4, headY + 9);
    ctx.fill();
    // Flat edge highlight
    ctx.fillStyle = '#888';
    ctx.beginPath();
    ctx.moveTo(24, headY);
    ctx.quadraticCurveTo(29, headY + 4, 28, headY + 12);
    ctx.lineTo(26, headY + 10);
    ctx.quadraticCurveTo(27, headY + 5, 23, headY + 2);
    ctx.fill();

    // Center collar (binds head to handle)
    ctx.fillStyle = '#555';
    ctx.fillRect(-5, headY, 10, 10);
    ctx.fillStyle = '#777';
    ctx.fillRect(-4, headY + 2, 8, 3);

    ctx.restore();

    return c;
}

function drawWeaponWarHammer() {
    const W = 128, H = 128;
    const c = createCanvas(W, H);
    const ctx = c.getContext('2d');

    // Handle — thicker, reinforced
    ctx.save();
    ctx.translate(W * 0.60, H * 0.92);
    ctx.rotate(-0.55);
    ctx.fillStyle = '#6B4226';
    ctx.fillRect(-7, -95, 14, 95);
    // Iron bands
    ctx.fillStyle = '#666';
    for (let i = 0; i < 4; i++) {
        ctx.fillRect(-8, -88 + i * 22, 16, 4);
    }
    ctx.restore();

    // Hammer head — placed at the true tip of the handle
    // Handle origin=(W*0.60,H*0.92), rot=-0.55, length=95 → tip≈(W*0.21, H*0.29)
    ctx.save();
    ctx.translate(W * 0.21, H * 0.29);
    ctx.rotate(-0.55);

    // Main block
    ctx.fillStyle = '#5A5A5A';
    ctx.fillRect(-28, -10, 56, 22);
    // Top face (lighter)
    ctx.fillStyle = '#777';
    ctx.fillRect(-26, -8, 52, 6);
    // Spike on back
    ctx.fillStyle = '#6A6A6A';
    ctx.beginPath();
    ctx.moveTo(-28, -6);
    ctx.lineTo(-42, 2);
    ctx.lineTo(-28, 8);
    ctx.fill();
    // Front flat face
    ctx.fillStyle = '#888';
    ctx.fillRect(22, -8, 6, 18);

    ctx.restore();

    return c;
}

export function getWeaponTexture(weaponId) {
    if (!weaponCache[weaponId]) {
        switch (weaponId) {
            case 'pickaxe':   weaponCache[weaponId] = drawWeaponPickaxe(); break;
            case 'warhammer': weaponCache[weaponId] = drawWeaponWarHammer(); break;
            case 'crossbow':  weaponCache[weaponId] = drawWeaponCrossbow(); break;
            case 'dynamite':  weaponCache[weaponId] = drawWeaponDynamite(); break;
            default:          weaponCache[weaponId] = drawWeaponPickaxe();
        }
    }
    return weaponCache[weaponId];
}

