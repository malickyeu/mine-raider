/* ── audio.js ── minimal Web Audio API sound effects (no files) ── */

let actx;

function ensure() {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    return actx;
}

function playTone(freq, duration, type = 'square', volume = 0.12) {
    const ctx = ensure();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
}

export function sfxPickup() {
    playTone(600, 0.08, 'square', 0.1);
    setTimeout(() => playTone(900, 0.1, 'square', 0.1), 60);
}

export function sfxGem() {
    playTone(800, 0.06, 'sine', 0.12);
    setTimeout(() => playTone(1200, 0.06, 'sine', 0.12), 50);
    setTimeout(() => playTone(1600, 0.12, 'sine', 0.1), 100);
}

export function sfxHit() {
    playTone(150, 0.15, 'sawtooth', 0.15);
}

export function sfxAttack() {
    playTone(200, 0.06, 'square', 0.08);
    setTimeout(() => playTone(120, 0.08, 'sawtooth', 0.06), 40);
}

export function sfxDeath() {
    playTone(300, 0.2, 'sawtooth', 0.15);
    setTimeout(() => playTone(200, 0.3, 'sawtooth', 0.12), 150);
    setTimeout(() => playTone(100, 0.5, 'sawtooth', 0.1), 350);
}

export function sfxWin() {
    playTone(523, 0.15, 'square', 0.1);
    setTimeout(() => playTone(659, 0.15, 'square', 0.1), 120);
    setTimeout(() => playTone(784, 0.15, 'square', 0.1), 240);
    setTimeout(() => playTone(1047, 0.3, 'square', 0.12), 360);
}

export function sfxHeal() {
    playTone(400, 0.1, 'sine', 0.1);
    setTimeout(() => playTone(600, 0.15, 'sine', 0.1), 80);
}

export function sfxEnemyDeath() {
    playTone(400, 0.1, 'sawtooth', 0.1);
    setTimeout(() => playTone(200, 0.2, 'sawtooth', 0.08), 80);
}

export function sfxHitWood() {
    // dull thud – wall takes a hit but holds
    playTone(220, 0.06, 'square', 0.12);
    setTimeout(() => playTone(140, 0.1, 'sawtooth', 0.09), 40);
}

export function sfxBreakWood() {
    // cracking/snapping sound – wall breaks
    playTone(300, 0.05, 'sawtooth', 0.14);
    setTimeout(() => playTone(180, 0.08, 'sawtooth', 0.12), 40);
    setTimeout(() => playTone(100, 0.18, 'sawtooth', 0.1),  90);
}

export function sfxDoorOpen() {
    playTone(180, 0.12, 'square', 0.08);
    setTimeout(() => playTone(250, 0.15, 'sine', 0.06), 80);
}

