/* ── audio.js ── minimal Web Audio API sound effects (no files) ── */

import { T } from './config.js';

let actx;

// ── SFX on/off (persisted) ──
let _sfxEnabled = localStorage.getItem('mine_raider_sfx') !== 'off';

export function isSfxEnabled() { return _sfxEnabled; }
export function toggleSfx() {
    _sfxEnabled = !_sfxEnabled;
    localStorage.setItem('mine_raider_sfx', _sfxEnabled ? 'on' : 'off');
    return _sfxEnabled;
}

// ── Ambient on/off (persisted) ──
let _ambEnabled = localStorage.getItem('mine_raider_ambient') !== 'off';

export function isAmbientEnabled() { return _ambEnabled; }
export function toggleAmbient() {
    _ambEnabled = !_ambEnabled;
    localStorage.setItem('mine_raider_ambient', _ambEnabled ? 'on' : 'off');
    if (_ambNodes) {
        // live mute / unmute while game is running
        const now = actx.currentTime;
        _ambNodes.master.gain.cancelScheduledValues(now);
        if (_ambEnabled) {
            _ambNodes.master.gain.setValueAtTime(0, now);
            _ambNodes.master.gain.linearRampToValueAtTime(0.12, now + 0.4);
        } else {
            _ambNodes.master.gain.setTargetAtTime(0, now, 0.3);
        }
    }
    return _ambEnabled;
}

function ensure() {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    return actx;
}

function playTone(freq, duration, type = 'square', volume = 0.12) {
    if (!_sfxEnabled) return;
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

/** Per-enemy-type death sound */
export function sfxEnemyDie(type) {
    switch (type) {
        case T.BAT:      // high squeak dropping fast
            playTone(1100, 0.07, 'sawtooth', 0.10);
            setTimeout(() => playTone(700, 0.08, 'sawtooth', 0.09), 55);
            setTimeout(() => playTone(400, 0.12, 'sawtooth', 0.07), 110);
            break;
        case T.SPIDER:   // crunchy crackle
            playTone(220, 0.06, 'sawtooth', 0.13);
            setTimeout(() => playTone(160, 0.08, 'sawtooth', 0.11), 50);
            setTimeout(() => playTone(100, 0.14, 'sawtooth', 0.09), 110);
            break;
        case T.SKELETON: // bone clatter – descending square clicks
            playTone(350, 0.05, 'square', 0.12);
            setTimeout(() => playTone(280, 0.05, 'square', 0.11), 50);
            setTimeout(() => playTone(220, 0.07, 'square', 0.10), 105);
            setTimeout(() => playTone(160, 0.12, 'square', 0.08), 165);
            break;
        case T.GHOST:    // ethereal ascending dissolve
            playTone(300, 0.25, 'sine', 0.09);
            setTimeout(() => playTone(500, 0.22, 'sine', 0.07), 90);
            setTimeout(() => playTone(750, 0.30, 'sine', 0.05), 190);
            break;
        default:
            sfxEnemyDeath();
    }
}

/** Per-enemy-type attack sound (layered on top of sfxHit in main.js) */
export function sfxEnemyAttack(type) {
    switch (type) {
        case T.BAT:      // high screech + flutter
            playTone(1400, 0.12, 'sawtooth', 0.18);
            setTimeout(() => playTone(900, 0.14, 'sawtooth', 0.15), 60);
            setTimeout(() => playTone(600, 0.18, 'sawtooth', 0.12), 130);
            break;
        case T.SPIDER:   // hiss + venomous click
            playTone(500, 0.10, 'square', 0.18);
            setTimeout(() => playTone(350, 0.15, 'sawtooth', 0.16), 55);
            setTimeout(() => playTone(200, 0.20, 'sawtooth', 0.14), 120);
            break;
        case T.SKELETON: // low bone rattle + crack
            playTone(220, 0.15, 'square', 0.20);
            setTimeout(() => playTone(180, 0.18, 'square', 0.18), 80);
            setTimeout(() => playTone(130, 0.22, 'sawtooth', 0.16), 160);
            break;
        case T.GHOST:    // chilling wail
            playTone(280, 0.40, 'sine', 0.18);
            setTimeout(() => playTone(210, 0.35, 'sine', 0.15), 120);
            setTimeout(() => playTone(160, 0.30, 'sine', 0.12), 260);
            break;
        default:
            playTone(250, 0.25, 'sawtooth', 0.18);
    }
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

export function sfxDoorLocked() {
    // dissonant buzz – door won't open without a key
    playTone(100, 0.1, 'sawtooth', 0.12);
    setTimeout(() => playTone(80, 0.15, 'sawtooth', 0.1), 80);
}

export function sfxKeyPickup() {
    // bright ascending jingle
    playTone(700, 0.08, 'sine', 0.12);
    setTimeout(() => playTone(900, 0.08, 'sine', 0.12), 60);
    setTimeout(() => playTone(1200, 0.15, 'sine', 0.1), 120);
}

export function sfxFlashlightPickup() {
    // warm whomp + rising chime – lantern igniting
    playTone(120, 0.18, 'sine', 0.14);
    setTimeout(() => playTone(300, 0.12, 'sine', 0.10), 80);
    setTimeout(() => playTone(500, 0.10, 'sine', 0.10), 160);
    setTimeout(() => playTone(800, 0.20, 'sine', 0.08), 240);
}

export function sfxExplosion() {
    // deep boom + rumble + debris
    playTone(60, 0.4, 'sawtooth', 0.18);
    playTone(45, 0.5, 'sine', 0.15);
    setTimeout(() => playTone(80, 0.25, 'sawtooth', 0.14), 50);
    setTimeout(() => playTone(120, 0.15, 'square', 0.10), 100);
    setTimeout(() => playTone(40, 0.35, 'sine', 0.08), 200);
}

// ─────────────────────────────────────────────
// ── Ambient Soundtrack ──
// ─────────────────────────────────────────────

let _ambNodes = null;
let _ambDripTimer = null;

export function startAmbient() {
    if (_ambNodes) return;
    if (!_ambEnabled) return; // ambient disabled in settings
    const ctx = ensure();

    // ── Master gain (starts silent, fades in once context is confirmed running) ──
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    // ── Drone: two detuned sines ──
    const d1 = ctx.createOscillator(); d1.type = 'sine'; d1.frequency.value = 55;
    const d2 = ctx.createOscillator(); d2.type = 'sine'; d2.frequency.value = 55.7;
    const droneGain = ctx.createGain(); droneGain.gain.value = 0.9;
    d1.connect(droneGain); d2.connect(droneGain); droneGain.connect(master);
    d1.start(); d2.start();

    // ── Cave noise: white noise through lowpass ──
    const bufLen = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buf; noiseSource.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass'; noiseFilter.frequency.value = 160; noiseFilter.Q.value = 0.8;
    const noiseGain = ctx.createGain(); noiseGain.gain.value = 0.35;
    noiseSource.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(master);
    noiseSource.start();

    // ── Tension layer: sawtooth fades in near enemies ──
    const tension = ctx.createOscillator(); tension.type = 'sawtooth'; tension.frequency.value = 82.4;
    const tensionFilter = ctx.createBiquadFilter();
    tensionFilter.type = 'lowpass'; tensionFilter.frequency.value = 220; tensionFilter.Q.value = 2;
    const tensionGain = ctx.createGain(); tensionGain.gain.value = 0;
    tension.connect(tensionFilter); tensionFilter.connect(tensionGain); tensionGain.connect(master);
    tension.start();

    _ambNodes = { d1, d2, droneGain, noiseSource, noiseFilter, noiseGain,
                  tension, tensionFilter, tensionGain, master };

    // Fade master gain in — synchronously if already running, else after resume resolves
    const doFadeIn = () => {
        if (!_ambNodes) return;
        const now = ctx.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(0, now);
        master.gain.linearRampToValueAtTime(0.12, now + 0.5);
        _scheduleAmbDrip();
    };

    if (ctx.state === 'running') {
        doFadeIn();
    } else {
        ctx.resume()
            .then(doFadeIn)
            .catch(e => console.error('[Ambient] resume error:', e));
    }
}

function _scheduleAmbDrip() {
    if (!_ambNodes) return;
    _ambDripTimer = setTimeout(() => {
        _playAmbDrip();
        _scheduleAmbDrip();
    }, 5000 + Math.random() * 14000);
}

function _playAmbDrip() {
    if (!_ambNodes || !actx) return;
    const ctx = actx;
    const freq = 700 + Math.random() * 700; // 700–1400 Hz plinking drop
    const osc = ctx.createOscillator();
    osc.type = 'sine'; osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.065, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(g); g.connect(_ambNodes.master);
    osc.start(); osc.stop(ctx.currentTime + 0.3);

    // ~35% chance of faint echo
    if (Math.random() < 0.35) {
        const delay = 0.18 + Math.random() * 0.28;
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine'; osc2.frequency.value = freq * 0.87;
        const g2 = ctx.createGain();
        g2.gain.setValueAtTime(0.025, ctx.currentTime + delay);
        g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.22);
        osc2.connect(g2); g2.connect(_ambNodes.master);
        osc2.start(ctx.currentTime + delay);
        osc2.stop(ctx.currentTime + delay + 0.22);
    }
}

export function stopAmbient() {
    if (_ambDripTimer) { clearTimeout(_ambDripTimer); _ambDripTimer = null; }
    if (!_ambNodes || !actx) { _ambNodes = null; return; }
    const { d1, d2, noiseSource, tension, master } = _ambNodes;
    const now = actx.currentTime;
    master.gain.setTargetAtTime(0, now, 0.6); // smooth fade out ~1.5 s
    try { d1.stop(now + 3); }          catch(e) {}
    try { d2.stop(now + 3); }          catch(e) {}
    try { noiseSource.stop(now + 3); } catch(e) {}
    try { tension.stop(now + 3); }     catch(e) {}
    _ambNodes = null;
}

/**
 * Call every game frame.
 * @param {number} playerHp        current player HP (0–100)
 * @param {number} nearestEnemy    distance to nearest alive enemy (Infinity if none)
 */
export function updateAmbient(playerHp, nearestEnemy) {
    if (!_ambNodes || !actx) return;
    const now = actx.currentTime;

    // Tension: smoothly rises as nearest enemy closes within 7 tiles
    const proximity = Math.max(0, (7 - Math.min(nearestEnemy, 7))) / 7; // 0..1
    const tLevel = Math.pow(proximity, 1.8) * 0.048;
    _ambNodes.tensionGain.gain.setTargetAtTime(tLevel, now, 0.9);
    _ambNodes.tensionFilter.frequency.setTargetAtTime(220 + proximity * 600, now, 0.9);

    // Noise filter opens up with proximity
    _ambNodes.noiseFilter.frequency.setTargetAtTime(160 + proximity * 1200, now, 0.9);

    // Low HP: drone pitch drifts down slightly, noise gets grittier
    const hpRatio = Math.max(0, Math.min(1, playerHp / 100));
    const dronePitch = 55 - (1 - hpRatio) * 9; // 55 Hz → 46 Hz at 0 HP
    _ambNodes.d1.frequency.setTargetAtTime(dronePitch,       now, 3.0);
    _ambNodes.d2.frequency.setTargetAtTime(dronePitch + 0.7, now, 3.0);
    _ambNodes.droneGain.gain.setTargetAtTime(0.038 + (1 - hpRatio) * 0.03, now, 2.0);
}
