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

// Pillar needs its own cache so alpha is preserved
const pillarCache = {};
export function getPillarTexture() {
    if (!pillarCache.tex) pillarCache.tex = drawPillar();
    return pillarCache.tex;
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
};

export function getSpriteTexture(entityType) {
    if (!spriteCache[entityType]) {
        const gen = spriteGenerators[entityType];
        spriteCache[entityType] = gen ? gen() : drawGold();
    }
    return spriteCache[entityType];
}
