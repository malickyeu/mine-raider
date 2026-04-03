/* ── main.js ── game bootstrap, state machine, game loop ── */

import { T, BREAKABLE_TYPES, WALL_HP, DIFFICULTIES, GAME_VERSION, ALL_DOOR_TYPES, WALL_TYPES, LOCKED_DOOR_TYPES, DOOR_KEY_MAP, BARREL_EXPLOSION_RADIUS, BARREL_EXPLOSION_DAMAGE, FOG_REVEAL_RADIUS, WEAPON_STATS, DYNAMITE_THROW_DURATION, DYNAMITE_MAX_DISTANCE, DYNAMITE_EXPLOSION_RADIUS, DYNAMITE_EXPLOSION_DAMAGE } from './config.js';
import { loadMap, extractEntities, getCampaignLevel, getCampaignLength, isWall, getTile } from './map.js';
import { initInput, releasePointer, isDown } from './input.js';
import { initRenderer, renderFrame } from './renderer.js';
import { Player, Enemy, Treasure, HealthPack, SmallHealthPack, Exit, Torch, Pillar, KeyItem, Flashlight, Barrel, MineLight, MineCart, WeaponPickup, AmmoPickup, CrossbowBolt, DynamiteThrown, ExplosionFX, createEntities } from './entities.js';
import { initEditor, showEditor, rebuildEditorUI } from './editor.js';
import { sfxPickup, sfxGem, sfxAttack, sfxDeath, sfxWin, sfxHeal, sfxHit, sfxEnemyDie, sfxEnemyAttack, sfxHitWood, sfxBreakWood, sfxDoorOpen, sfxDoorLocked, sfxKeyPickup, sfxFlashlightPickup, sfxExplosion, startAmbient, stopAmbient, updateAmbient, toggleSfx, isSfxEnabled, toggleAmbient, isAmbientEnabled, sfxCrossbowShot, sfxDynamiteThrow, sfxDynamiteExplode, sfxWeaponSwitch } from './audio.js';
import { toggleMinimap, toggleHelp, isHelpVisible, hideHelp } from './hud.js';
import { t, toggleLang } from './i18n.js';
import { getHighScore, submitScore, getBestCampaignScore } from './highscore.js';

// ── DOM elements ──
const menuScreen    = document.getElementById('menu-screen');
const menuSubtitle  = document.getElementById('menu-subtitle');
const gameCanvas    = document.getElementById('game-canvas');
const editorScreen  = document.getElementById('editor-screen');
const editorCanvas  = document.getElementById('editor-canvas');
const editorPanel   = document.getElementById('editor-panel');
const overlay       = document.getElementById('overlay');
const overlayTitle  = document.getElementById('overlay-title');
const overlayText   = document.getElementById('overlay-text');
const overlayBtn    = document.getElementById('overlay-btn');
const helpOverlay   = document.getElementById('help-overlay');
const helpTitle     = document.getElementById('help-title');
const helpLines     = document.getElementById('help-lines');
const helpClose     = document.getElementById('help-close');

const btnPlay  = document.getElementById('btn-play');
const btnEditor = document.getElementById('btn-editor');
const btnSettings = document.getElementById('btn-settings');
const menuHighscore = document.getElementById('menu-highscore');
document.getElementById('game-version').textContent = `v${GAME_VERSION}`;

const settingsScreen   = document.getElementById('settings-screen');
const settingsTitle    = document.getElementById('settings-title');
const settingsSfxBtn   = document.getElementById('settings-sfx');
const settingsAmbBtn   = document.getElementById('settings-ambient');
const settingsLangBtn  = document.getElementById('settings-lang');
const settingsBackBtn  = document.getElementById('settings-back');

const difficultyScreen  = document.getElementById('difficulty-screen');
const diffScreenTitle   = document.getElementById('diff-screen-title');
const diffChoiceEasy    = document.getElementById('diff-choice-easy');
const diffChoiceNormal  = document.getElementById('diff-choice-normal');
const diffChoiceHard    = document.getElementById('diff-choice-hard');
const diffBackBtn       = document.getElementById('diff-back-btn');

// ── State ──
let state = 'menu';
let player, entities, mapData;
let lastTime = 0;
let animFrame = null;

// ── Keyboard navigation focus ──
let menuFocusIdx     = 0;
let diffFocusIdx     = 1; // default to 'normal'
let settingsFocusIdx = 0;

function menuButtons()     { return [btnPlay, btnEditor, btnSettings]; }
function diffButtons()     { return [diffChoiceEasy, diffChoiceNormal, diffChoiceHard, diffBackBtn]; }
function settingsButtons() { return [settingsSfxBtn, settingsAmbBtn, settingsLangBtn, settingsBackBtn]; }

function applyFocus(buttons, idx) {
    buttons.forEach((b, i) => b.classList.toggle('kb-focus', i === idx));
}
function moveFocus(buttons, currentIdx, delta) {
    return (currentIdx + delta + buttons.length) % buttons.length;
}

// ── Level system ──
let currentLevel = 0;
let levelInfo = null;
let gameMode = 'campaign';

// ── Difficulty ──
let selectedDifficulty = 'normal';

// ── Breakable walls: "x,y" → remaining HP ──
let breakableWalls = {};

// ── Door states: "x,y" → { open: 0..1, opening: bool } ──
let doorStates = {};

// ── Fog-of-war: explored[y][x] = 1 if player has been nearby ──
let explored = null;

// ── Init ──
initInput(gameCanvas);
initRenderer(gameCanvas);
initEditor(editorCanvas, editorPanel, null, () => {
    gameMode = 'custom';
    switchState('game');
}, () => {
    switchState('menu');
});

// ── Refresh all UI text for current language ──
function setDiffBtnContent(btn, icon, nameKey, descKey, difficulty) {
    const hs = getHighScore('campaign', difficulty);
    const hsText = hs > 0 ? `🏆 ${hs.toLocaleString()}` : t('noRecord');
    btn.innerHTML =
        `<span class="diff-choice-name">${icon} ${t(nameKey)}</span>` +
        `<span class="diff-choice-desc">${t(descKey)}</span>` +
        `<span class="diff-choice-score">${hsText}</span>`;
}

function refreshUIText() {
    btnPlay.textContent     = t('btnPlay');
    btnEditor.textContent   = t('btnEditor');
    btnSettings.textContent = t('btnSettings');

    // Settings screen
    settingsTitle.textContent   = t('settingsTitle');
    settingsSfxBtn.textContent  = isSfxEnabled()    ? t('settingsSfxOn')     : t('settingsSfxOff');
    settingsAmbBtn.textContent  = isAmbientEnabled() ? t('settingsAmbientOn') : t('settingsAmbientOff');
    settingsLangBtn.textContent = t('btnLang');
    settingsBackBtn.textContent = t('settingsBack');
    menuSubtitle.textContent = t('subtitle');

    // Menu high score
    if (menuHighscore) {
        const best = getBestCampaignScore();
        menuHighscore.textContent = best > 0
            ? `🏆 ${t('bestScore')}: ${best.toLocaleString()}`
            : '';
    }

    // Difficulty screen
    diffScreenTitle.textContent = t('diffScreenTitle');
    setDiffBtnContent(diffChoiceEasy,   '⛏️', 'diffEasy',   'diffEasyDesc',   'easy');
    setDiffBtnContent(diffChoiceNormal, '🔥', 'diffNormal', 'diffNormalDesc', 'normal');
    setDiffBtnContent(diffChoiceHard,   '💀', 'diffHard',   'diffHardDesc',   'hard');
    diffBackBtn.textContent = t('diffBack');

    // Help overlay
    helpTitle.textContent = t('helpTitle');
    helpClose.textContent = t('helpClose');
    helpLines.innerHTML = '';
    for (const line of t('helpLines')) {
        const div = document.createElement('div');
        div.className = 'help-line';
        const parts = line.split(' — ');
        if (parts.length === 2) {
            div.innerHTML = `<span>${parts[0]}</span> — ${parts[1]}`;
        } else {
            div.textContent = line;
        }
        helpLines.appendChild(div);
    }

    // Rebuild editor palette/buttons with new lang
    rebuildEditorUI();
}

refreshUIText();

// ── Difficulty screen handlers ──
diffChoiceEasy.addEventListener('click',   () => { selectedDifficulty = 'easy';   switchState('game'); });
diffChoiceNormal.addEventListener('click', () => { selectedDifficulty = 'normal'; switchState('game'); });
diffChoiceHard.addEventListener('click',   () => { selectedDifficulty = 'hard';   switchState('game'); });
diffBackBtn.addEventListener('click',      () => switchState('menu'));

// ── Menu buttons ──
btnPlay.addEventListener('click', () => {
    gameMode = 'campaign';
    currentLevel = 0;
    switchState('difficulty');
});
btnEditor.addEventListener('click', () => switchState('editor'));
btnSettings.addEventListener('click', () => switchState('settings'));

// ── Settings screen handlers ──
settingsSfxBtn.addEventListener('click', () => {
    toggleSfx();
    settingsSfxBtn.textContent = isSfxEnabled() ? t('settingsSfxOn') : t('settingsSfxOff');
});
settingsAmbBtn.addEventListener('click', () => {
    toggleAmbient();
    settingsAmbBtn.textContent = isAmbientEnabled() ? t('settingsAmbientOn') : t('settingsAmbientOff');
});
settingsLangBtn.addEventListener('click', () => {
    toggleLang();
    refreshUIText();
});
settingsBackBtn.addEventListener('click', () => switchState('menu'));
overlayBtn.addEventListener('click', () => {
    if (state === 'nextlevel') switchState('game');
    else if (gameMode === 'custom') switchState('editor');
    else switchState('menu');
});

// ── Keyboard shortcuts ──
let mKeyWasDown = false;
let hKeyWasDown = false;
let fKeyWasDown = false;
let lKeyWasDown = false;

window.addEventListener('keydown', e => {
    // ── Weapon selection (1-4) during game ──
    if (state === 'game') {
        const weapons = ['pickaxe', 'warhammer', 'crossbow', 'dynamite'];
        if (e.key >= '1' && e.key <= '4') {
            const weaponIdx = parseInt(e.key) - 1;
            const weapon = weapons[weaponIdx];
            const w = player.weapons[weapon];
            // Only switch if owned AND has ammo (or unlimited ammo)
            if (w && w.owned && (w.ammo === -1 || w.ammo > 0)) {
                player.currentWeapon = weapon;
                sfxWeaponSwitch();
                e.preventDefault();
            }
        }
    }
    if (e.code === 'Escape' || e.code === 'Backspace') {
        // Don't intercept Backspace inside text inputs (editor)
        if (e.code === 'Backspace' && e.target.tagName === 'INPUT') return;
        if (isHelpVisible()) { hideHelp(); return; }
        if (state === 'difficulty') { switchState('menu'); return; }
        if (state === 'settings')   { switchState('menu'); return; }
        if (state === 'game') {
            releasePointer();
            switchState(gameMode === 'custom' ? 'editor' : 'menu');
            return;
        }
        if (state === 'editor') { switchState('menu'); return; }
    }

    // ── Menu keyboard navigation ──
    if (state === 'menu') {
        const btns = menuButtons();
        if (e.code === 'ArrowDown') {
            menuFocusIdx = moveFocus(btns, menuFocusIdx, 1);
            applyFocus(btns, menuFocusIdx); e.preventDefault();
        } else if (e.code === 'ArrowUp') {
            menuFocusIdx = moveFocus(btns, menuFocusIdx, -1);
            applyFocus(btns, menuFocusIdx); e.preventDefault();
        } else if (e.key === 'Enter') {
            btns[menuFocusIdx].click(); e.preventDefault();
            return; // prevent cascading into other state checks after synchronous switchState
        }
        return;
    }

    // ── Difficulty keyboard navigation ──
    if (state === 'difficulty') {
        const btns = diffButtons();
        if (e.code === 'ArrowDown') {
            diffFocusIdx = moveFocus(btns, diffFocusIdx, 1);
            applyFocus(btns, diffFocusIdx); e.preventDefault();
        } else if (e.code === 'ArrowUp') {
            diffFocusIdx = moveFocus(btns, diffFocusIdx, -1);
            applyFocus(btns, diffFocusIdx); e.preventDefault();
        } else if (e.key === 'Enter') {
            btns[diffFocusIdx].click(); e.preventDefault();
            return;
        }
        return;
    }

    // ── Settings keyboard navigation ──
    if (state === 'settings') {
        const btns = settingsButtons();
        if (e.code === 'ArrowDown') {
            settingsFocusIdx = moveFocus(btns, settingsFocusIdx, 1);
            applyFocus(btns, settingsFocusIdx); e.preventDefault();
        } else if (e.code === 'ArrowUp') {
            settingsFocusIdx = moveFocus(btns, settingsFocusIdx, -1);
            applyFocus(btns, settingsFocusIdx); e.preventDefault();
        } else if (e.key === 'Enter') {
            btns[settingsFocusIdx].click(); e.preventDefault();
            return;
        }
        return;
    }

    // ── Overlay (gameover / nextlevel / win): Enter confirms ──
    if (state === 'gameover' || state === 'nextlevel' || state === 'win') {
        if (e.key === 'Enter') { overlayBtn.click(); e.preventDefault(); }
        return;
    }
    if (e.code === 'KeyM' && state === 'game' && !mKeyWasDown) {
        mKeyWasDown = true;
        toggleMinimap();
    }
    if (e.code === 'KeyH' && state === 'game' && !hKeyWasDown) {
        hKeyWasDown = true;
        toggleHelp();
    }
    if (e.code === 'KeyL' && state === 'game' && !lKeyWasDown && player && player.hasFlashlight) {
        lKeyWasDown = true;
        player.flashlightOn = !player.flashlightOn;
    }
});
window.addEventListener('keyup', e => {
    if (e.code === 'KeyM') mKeyWasDown = false;
    if (e.code === 'KeyH') hKeyWasDown = false;
    if (e.code === 'KeyF') fKeyWasDown = false;
    if (e.code === 'KeyL') lKeyWasDown = false;
});

function switchState(newState) {
    state = newState;
    // Remove DOM focus from any button so Enter can't re-trigger hidden buttons
    if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur();
    }
    menuScreen.style.display = 'none';
    difficultyScreen.classList.remove('active');
    settingsScreen.classList.remove('active');
    editorScreen.classList.remove('active');
    overlay.classList.remove('active');
    gameCanvas.style.display = 'none';
    hideHelp();
    if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }

    // Stop ambient when leaving the game (not during level transitions)
    if (newState !== 'game' && newState !== 'nextlevel') stopAmbient();

    switch (newState) {
        case 'menu':
            menuScreen.style.display = 'flex';
            releasePointer();
            player = null;
            applyFocus(menuButtons(), menuFocusIdx);
            break;
        case 'difficulty':
            difficultyScreen.classList.add('active');
            releasePointer();
            applyFocus(diffButtons(), diffFocusIdx);
            break;
        case 'settings':
            settingsScreen.classList.add('active');
            releasePointer();
            refreshUIText(); // ensure button texts are up to date
            applyFocus(settingsButtons(), settingsFocusIdx);
            break;
        case 'editor':
            editorScreen.classList.add('active');
            showEditor();
            releasePointer();
            break;
        case 'game':
            gameCanvas.style.display = 'block';
            startGame();
            break;
        case 'gameover':
            gameCanvas.style.display = 'block';
            overlay.classList.add('active');
            overlayBtn.classList.add('kb-focus');
            overlayTitle.textContent = t('deathTitle');
            overlayTitle.style.color = '#ff4444';
            {
                const hsResult = submitScore(gameMode, selectedDifficulty, player.score);
                let txt = `${t('deathScore')} ${player.score.toLocaleString()}`;
                if (hsResult.isNew) txt += `\n${t('newRecord')}`;
                else if (hsResult.prev > 0) txt += `\n🏆 ${t('bestScore')}: ${hsResult.prev.toLocaleString()}`;
                overlayText.textContent = txt;
                refreshUIText(); // refresh diff screen scores
            }
            overlayBtn.textContent = gameMode === 'custom' ? t('backToEditor') : t('backToMenu');
            sfxDeath();
            releasePointer();
            break;
        case 'nextlevel':
            gameCanvas.style.display = 'block';
            overlay.classList.add('active');
            overlayBtn.classList.add('kb-focus');
            overlayTitle.textContent = t('nextLevelTitle');
            overlayTitle.style.color = '#44ff88';
            overlayText.textContent = `${t('deathScore')} ${player.score.toLocaleString()} — ${t('nextLevelText')}`;
            overlayBtn.textContent = t('nextLevelBtn');
            sfxWin();
            releasePointer();
            break;
        case 'win':
            gameCanvas.style.display = 'block';
            overlay.classList.add('active');
            overlayBtn.classList.add('kb-focus');
            overlayTitle.textContent = t('winTitle');
            overlayTitle.style.color = '#ffd700';
            {
                const hsResult = submitScore(gameMode, selectedDifficulty, player.score);
                let winText = gameMode === 'campaign'
                    ? t('winAllText', getCampaignLength(), player.score.toLocaleString())
                    : t('winCustomText', player.score.toLocaleString());
                if (hsResult.isNew) winText += `\n${t('newRecord')}`;
                else if (hsResult.prev > 0) winText += `\n🏆 ${t('bestScore')}: ${hsResult.prev.toLocaleString()}`;
                overlayText.textContent = winText;
                refreshUIText(); // refresh diff screen scores
            }
            overlayBtn.textContent = gameMode === 'custom' ? t('backToEditor') : t('backToMenu');
            sfxWin();
            releasePointer();
            break;
    }
}

function startGame() {
    let rawMap;
    if (gameMode === 'campaign') {
        rawMap = getCampaignLevel(currentLevel);
        if (!rawMap) { switchState('win'); return; }
        levelInfo = {
            name: rawMap.name,
            nameKey: rawMap.nameKey || null,
            current: currentLevel + 1,
            total: getCampaignLength(),
            difficulty: selectedDifficulty,
        };
    } else {
        rawMap = loadMap();
        levelInfo = { name: rawMap.name || 'Custom', current: 1, total: 1, difficulty: selectedDifficulty };
    }

    mapData = JSON.parse(JSON.stringify(rawMap));
    const { entities: entList, playerStart } = extractEntities(mapData);

     const prevScore = (player && gameMode === 'campaign') ? player.score : 0;
     const prevHp = (player && gameMode === 'campaign') ? player.hp : null;
     const prevKeys = (player && gameMode === 'campaign') ? new Set(player.keys) : new Set();
     const prevFlashlight = (player && gameMode === 'campaign') ? player.hasFlashlight : false;
     const prevFlashlightOn = (player && gameMode === 'campaign') ? player.flashlightOn : true;
     const prevWeapons = (player && gameMode === 'campaign') ? JSON.parse(JSON.stringify(player.weapons)) : null;
     const prevWeapon  = (player && gameMode === 'campaign') ? player.currentWeapon : 'pickaxe';

     player = new Player(playerStart.x, playerStart.y);
     player.score = prevScore;
     if (prevHp !== null) player.hp = prevHp;
     player.keys = prevKeys;
     player.hasFlashlight = prevFlashlight;
     player.flashlightOn = prevFlashlightOn;
     if (prevWeapons) { player.weapons = prevWeapons; player.currentWeapon = prevWeapon; }

    entities = createEntities(entList, DIFFICULTIES[selectedDifficulty]);
    breakableWalls = {};
    doorStates = {};
    explored = Array.from({ length: mapData.height }, () => new Uint8Array(mapData.width));
    lastTime = performance.now();
    startAmbient(); // begin / continue ambient track
    gameLoop(lastTime);
}

function getEnemyScore(type) {
    switch (type) {
        case T.SKELETON: return 200;
        case T.SPIDER:   return 100;
        case T.GHOST:    return 300;
        default:         return 50;
    }
}

function isEntityInTile(tx, ty) {
    // Check if player or any enemy is inside this tile
    if (Math.floor(player.x) === tx && Math.floor(player.y) === ty) return true;
    for (const ent of entities) {
        if (ent instanceof Enemy && ent.alive &&
            Math.floor(ent.x) === tx && Math.floor(ent.y) === ty) return true;
    }
    return false;
}

function triggerBarrelExplosion(barrel, processedBarrels = new Set()) {
    if (processedBarrels.has(barrel) || barrel.exploding) return;
    processedBarrels.add(barrel);
    barrel.exploding = true;
    barrel.explodeTimer = 0.3;

    const RADIUS = BARREL_EXPLOSION_RADIUS;
    const DAMAGE = BARREL_EXPLOSION_DAMAGE;

    sfxExplosion();

    // Screen shake proportional to proximity
    const pdx = player.x - barrel.x, pdy = player.y - barrel.y;
    const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
    const shakeAmount = Math.max(0.15, 0.5 * Math.max(0, 1 - pdist / (RADIUS * 2)));
    player.shakeTimer = Math.max(player.shakeTimer, shakeAmount);

    // Damage player
    if (pdist < RADIUS) {
        const dmg = Math.round(DAMAGE * (1 - pdist / RADIUS));
        player.takeDamage(dmg);
    }

     // Damage enemies
     for (const ent of entities) {
         if (!(ent instanceof Enemy) || !ent.alive) continue;
         const edx = ent.x - barrel.x, edy = ent.y - barrel.y;
         const edist = Math.sqrt(edx * edx + edy * edy);
         if (edist < RADIUS) {
             const dmg = Math.max(1, Math.round(DAMAGE * (1 - edist / RADIUS)));
             ent.takeDamage(dmg);
             if (!ent.alive) {
                 sfxEnemyDie(ent.type);
                 player.addScore(getEnemyScore(ent.type));
             }
         }
     }

    // Break wood walls in radius
    const minTX = Math.max(0, Math.floor(barrel.x - RADIUS));
    const maxTX = Math.min(mapData.width - 1, Math.ceil(barrel.x + RADIUS));
    const minTY = Math.max(0, Math.floor(barrel.y - RADIUS));
    const maxTY = Math.min(mapData.height - 1, Math.ceil(barrel.y + RADIUS));
    for (let ty = minTY; ty <= maxTY; ty++) {
        for (let tx = minTX; tx <= maxTX; tx++) {
            const tile = mapData.tiles[ty][tx];
            if (!BREAKABLE_TYPES.has(tile)) continue;
            const wdx = (tx + 0.5) - barrel.x, wdy = (ty + 0.5) - barrel.y;
            if (Math.sqrt(wdx * wdx + wdy * wdy) >= RADIUS) continue;
            // Don't break wood adjacent to doors
            const adjDoor = ALL_DOOR_TYPES.has(getTile(mapData, tx - 1, ty)) ||
                            ALL_DOOR_TYPES.has(getTile(mapData, tx + 1, ty)) ||
                            ALL_DOOR_TYPES.has(getTile(mapData, tx, ty - 1)) ||
                            ALL_DOOR_TYPES.has(getTile(mapData, tx, ty + 1));
            if (adjDoor) continue;
            mapData.tiles[ty][tx] = T.EMPTY;
            delete breakableWalls[`${tx},${ty}`];
            sfxBreakWood();
        }
    }

     // Chain explosions to nearby barrels
     for (const ent of entities) {
         if (!(ent instanceof Barrel) || !ent.alive || ent.exploding) continue;
         if (processedBarrels.has(ent)) continue;
         const bdx = ent.x - barrel.x, bdy = ent.y - barrel.y;
         if (Math.sqrt(bdx * bdx + bdy * bdy) < RADIUS) {
             triggerBarrelExplosion(ent, processedBarrels);
         }
     }

     // Extra explosion FX (barrel already shows its own exploding sprite,
     // but add a secondary flash for impact)
     entities.push(new ExplosionFX(barrel.x, barrel.y));

     player.addScore(25);
 }

 function throwDynamite(power) {
     player.weaponThrowTimer = 0; // always reset, even if no ammo
     if (player.weapons.dynamite.ammo <= 0) {
         autoSwitchWeapon();
         return;
     }

     const cosA = Math.cos(player.angle);
     const sinA = Math.sin(player.angle);
     
     const distance = power * DYNAMITE_MAX_DISTANCE;
     const vx = cosA * distance * 2;
     const vy = sinA * distance * 2;
     
     const dyn = new DynamiteThrown(player.x + cosA * 0.5, player.y + sinA * 0.5, vx, vy);
     entities.push(dyn);
     
     player.weapons.dynamite.ammo--;
     sfxDynamiteThrow();
     player.weaponThrowTimer = 0;
     if (player.weapons.dynamite.ammo <= 0) autoSwitchWeapon();
 }

 /** Switch to best available weapon when current runs out of ammo */
 function autoSwitchWeapon() {
     const priority = ['crossbow', 'warhammer', 'pickaxe'];
     for (const id of priority) {
         const w = player.weapons[id];
         if (w && w.owned && (w.ammo === -1 || w.ammo > 0)) {
             player.currentWeapon = id;
             return;
         }
     }
     player.currentWeapon = 'pickaxe'; // fallback
 }

 function triggerDynamiteExplosion(dyn) {
     if (dyn.explosionTriggered) return;   // ← guard: only explode once
     dyn.explosionTriggered = true;
     dyn.hasExploded = true;
     dyn.alive = false;
     
     const RADIUS = DYNAMITE_EXPLOSION_RADIUS;
     const DAMAGE = DYNAMITE_EXPLOSION_DAMAGE;
     
     sfxExplosion();
     
     // Screen shake
     const pdx = player.x - dyn.x, pdy = player.y - dyn.y;
     const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
     const shakeAmount = Math.max(0.2, 0.6 * Math.max(0, 1 - pdist / (RADIUS * 2)));
     player.shakeTimer = Math.max(player.shakeTimer, shakeAmount);
     
     // Damage player
     if (pdist < RADIUS) {
         const dmg = Math.round(DAMAGE * (1 - pdist / RADIUS));
         player.takeDamage(dmg);
     }
     
     // Damage enemies
     for (const ent of entities) {
         if (!(ent instanceof Enemy) || !ent.alive) continue;
         const edx = ent.x - dyn.x, edy = ent.y - dyn.y;
         const edist = Math.sqrt(edx * edx + edy * edy);
         if (edist < RADIUS) {
             const dmg = Math.max(1, Math.round(DAMAGE * (1 - edist / RADIUS)));
             ent.takeDamage(dmg);
             if (!ent.alive) {
                 sfxEnemyDie(ent.type);
                 player.addScore(getEnemyScore(ent.type));
             }
         }
     }
     
     // Break wood walls in radius
     const minTX = Math.max(0, Math.floor(dyn.x - RADIUS));
     const maxTX = Math.min(mapData.width - 1, Math.ceil(dyn.x + RADIUS));
     const minTY = Math.max(0, Math.floor(dyn.y - RADIUS));
     const maxTY = Math.min(mapData.height - 1, Math.ceil(dyn.y + RADIUS));
     for (let ty = minTY; ty <= maxTY; ty++) {
         for (let tx = minTX; tx <= maxTX; tx++) {
             const tile = mapData.tiles[ty][tx];
             if (!BREAKABLE_TYPES.has(tile)) continue;
             const wdx = (tx + 0.5) - dyn.x, wdy = (ty + 0.5) - dyn.y;
             if (Math.sqrt(wdx * wdx + wdy * wdy) >= RADIUS) continue;
             mapData.tiles[ty][tx] = T.EMPTY;
             delete breakableWalls[`${tx},${ty}`];
             sfxBreakWood();
         }
     }
     
     // Trigger nearby barrels
     for (const ent of entities) {
         if (!(ent instanceof Barrel) || !ent.alive || ent.exploding) continue;
         const bdx = ent.x - dyn.x, bdy = ent.y - dyn.y;
         if (Math.sqrt(bdx * bdx + bdy * bdy) < RADIUS) {
             triggerBarrelExplosion(ent);
         }
     }
     
     // Spawn visual explosion effect
     entities.push(new ExplosionFX(dyn.x, dyn.y));
     
     player.addScore(40);
 }

function gameLoop(now) {
    if (state !== 'game') return;
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    // Don't update game while help is open
    if (!isHelpVisible()) {
        player.update(dt, mapData, doorStates);

        // ── Fog-of-war: BFS reveal that stops at walls / closed doors ──
        {
            const fpx = Math.floor(player.x), fpy = Math.floor(player.y);
            const rr2 = FOG_REVEAL_RADIUS * FOG_REVEAL_RADIUS;
            const w = mapData.width, h = mapData.height;
            const vis = new Set();
            const q = [[fpx, fpy]];
            vis.add(fpy * w + fpx);
            while (q.length > 0) {
                const [cx, cy] = q.shift();
                explored[cy][cx] = 1;
                // Walls / closed doors: reveal them but don't expand through
                if (isWall(mapData, cx, cy, doorStates)) {
                    // Doors: also reveal adjacent solid walls (door frame)
                    const tile = mapData.tiles[cy]?.[cx];
                    if (tile !== undefined && ALL_DOOR_TYPES.has(tile)) {
                        for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
                            const nx = cx + dx, ny = cy + dy;
                            if (nx >= 0 && ny >= 0 && nx < w && ny < h) {
                                const nt = mapData.tiles[ny][nx];
                                if (WALL_TYPES.has(nt) && !ALL_DOOR_TYPES.has(nt))
                                    explored[ny][nx] = 1;
                            }
                        }
                    }
                    continue;
                }
                for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
                    const nx = cx + dx, ny = cy + dy;
                    if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
                    const nk = ny * w + nx;
                    if (vis.has(nk)) continue;
                    const ddx = nx - fpx, ddy = ny - fpy;
                    if (ddx * ddx + ddy * ddy > rr2) continue;
                    vis.add(nk);
                    q.push([nx, ny]);
                }
            }
        }

        // ── Open/close doors (F key) ──
        if (isDown('KeyF') && !fKeyWasDown) {
            fKeyWasDown = true;
            const cosA = Math.cos(player.angle);
            const sinA = Math.sin(player.angle);
            for (let d = 0.5; d <= 1.5; d += 0.25) {
                const dx = Math.floor(player.x + cosA * d);
                const dy = Math.floor(player.y + sinA * d);
                const tile = getTile(mapData, dx, dy);
                if (ALL_DOOR_TYPES.has(tile)) {
                    const key = `${dx},${dy}`;
                    // Check if locked door requires a key
                    if (LOCKED_DOOR_TYPES.has(tile)) {
                        const alreadyUnlocked = doorStates[key] && doorStates[key].unlocked;
                        if (!alreadyUnlocked) {
                            const requiredKey = DOOR_KEY_MAP[tile];
                            if (!player.keys.has(requiredKey)) {
                                sfxDoorLocked();
                                break;
                            }
                        }
                    }
                    const ds = doorStates[key];
                    if (!ds) {
                        // First open (or first unlock)
                        doorStates[key] = {
                            open: 0, opening: true, closeTimer: 0,
                            unlocked: LOCKED_DOOR_TYPES.has(tile) || false,
                        };
                        sfxDoorOpen();
                    } else if (ds.open <= 0 && !ds.opening) {
                        // Re-open a fully closed door
                        ds.opening = true;
                        ds.closing = false;
                        ds.closeTimer = 0;
                        sfxDoorOpen();
                    } else if (ds.open >= 1 && !ds.closing) {
                        // Manual close
                        ds.opening = false;
                        ds.closing = true;
                        ds.closeTimer = 0;
                        sfxDoorOpen();
                    }
                    break;
                }
            }
        }

        // ── Animate doors ──
        for (const key in doorStates) {
            const ds = doorStates[key];
            if (ds.opening && ds.open < 1) {
                ds.open = Math.min(1, ds.open + dt * 2);
                if (ds.open >= 1) {
                    ds.opening = false;
                    ds.closeTimer = 3; // auto-close after 3 s
                }
            } else if (ds.open >= 1 && ds.closeTimer > 0 && !ds.closing) {
                ds.closeTimer -= dt;
                if (ds.closeTimer <= 0) {
                    ds.closing = true;
                }
            } else if (ds.closing) {
                // Check nobody is standing in the door tile before closing
                const [wx, wy] = key.split(',').map(Number);
                const blocked = isEntityInTile(wx, wy);
                if (!blocked) {
                    ds.open = Math.max(0, ds.open - dt * 2);
                    if (ds.open <= 0) {
                        if (ds.unlocked) {
                            // Keep entry so door remembers it was unlocked
                            ds.open = 0;
                            ds.closing = false;
                        } else {
                            delete doorStates[key]; // fully closed, back to normal wall
                        }
                    }
                }
            }
        }

        // ── Blocking entity collision (pillars, barrels, mine carts) ──
        for (const ent of entities) {
            if (!ent.alive) continue;
            const isBlocking = ent instanceof Pillar ||
                               (ent instanceof Barrel && !ent.exploding) ||
                               ent instanceof MineCart;
            if (!isBlocking) continue;
            const dx = player.x - ent.x;
            const dy = player.y - ent.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = 0.42;
            if (dist < minDist && dist > 0.001) {
                player.x = ent.x + (dx / dist) * minDist;
                player.y = ent.y + (dy / dist) * minDist;
            }
        }

         if (player.attacking) {
             const weapon = player.currentWeapon;
             const stats = WEAPON_STATS[weapon];
             
             if (weapon === 'pickaxe' || weapon === 'warhammer') {
                 // ── Melee attack ──
                 sfxAttack();
                 const cosA = Math.cos(player.angle);
                 const sinA = Math.sin(player.angle);
                 const damage = stats.damage;

                 // Hit enemies & barrels
                 for (const ent of entities) {
                     if (!ent.alive) continue;
                     const isEnemy = ent instanceof Enemy;
                     const isBarrel = ent instanceof Barrel && !ent.exploding;
                     if (!isEnemy && !isBarrel) continue;
                     const dx = ent.x - player.x;
                     const dy = ent.y - player.y;
                     const dist = Math.sqrt(dx * dx + dy * dy);
                     if (dist > 2.0) continue;
                     const dot = (dx * cosA + dy * sinA) / dist;
                     if (dot > 0.7) {
                         if (isBarrel) {
                             triggerBarrelExplosion(ent);
                         } else {
                             // Apply weapon damage (pickaxe 1×, warhammer 2×)
                             for (let i = 0; i < damage; i++) ent.takeDamage();
                             if (!ent.alive) {
                                 sfxEnemyDie(ent.type);
                                 player.addScore(getEnemyScore(ent.type));
                             }
                         }
                     }
                 }

                 // Break wood walls
                 const ATTACK_RANGE = 1.5;
                 for (let d = 0.25; d <= ATTACK_RANGE; d += 0.15) {
                     const wx = Math.floor(player.x + cosA * d);
                     const wy = Math.floor(player.y + sinA * d);
                     const tile = getTile(mapData, wx, wy);
                     if (BREAKABLE_TYPES.has(tile)) {
                         const adjDoor = ALL_DOOR_TYPES.has(getTile(mapData, wx-1, wy)) ||
                                         ALL_DOOR_TYPES.has(getTile(mapData, wx+1, wy)) ||
                                         ALL_DOOR_TYPES.has(getTile(mapData, wx, wy-1)) ||
                                         ALL_DOOR_TYPES.has(getTile(mapData, wx, wy+1));
                         if (adjDoor) break;

                         const key = `${wx},${wy}`;
                         if (breakableWalls[key] === undefined) breakableWalls[key] = WALL_HP[tile];
                         breakableWalls[key]--;
                         if (breakableWalls[key] <= 0) {
                             mapData.tiles[wy][wx] = T.EMPTY;
                             delete breakableWalls[key];
                             sfxBreakWood();
                             player.addScore(25);
                         } else {
                             sfxHitWood();
                         }
                         break;
                     } else if (isWall(mapData, wx, wy)) {
                         break;
                     }
                 }
               } else if (weapon === 'crossbow') {
                  // ── Ranged crossbow attack (hit-scan) ──
                  if (player.weapons.crossbow.ammo > 0) {
                      sfxCrossbowShot();
                      const cosA = Math.cos(player.angle);
                      const sinA = Math.sin(player.angle);
                      let hitEnemy = null;
                      let hitDist = Infinity;

                      // Ray-cast to find first enemy in line of sight
                      for (const ent of entities) {
                          if (!(ent instanceof Enemy) || !ent.alive) continue;
                          const dx = ent.x - player.x;
                          const dy = ent.y - player.y;
                          const dist = Math.sqrt(dx * dx + dy * dy);
                          if (dist > 12) continue; // max range

                          // Must be in forward cone
                          const dot = (dx * cosA + dy * sinA) / dist;
                          if (dot <= 0.3) continue;

                          // Line-of-sight: bolt must not pass through walls
                          let blocked = false;
                          const steps = Math.ceil(dist * 3);
                          for (let si = 1; si < steps; si++) {
                              const tt = si / steps;
                              const cx = player.x + dx * tt, cy = player.y + dy * tt;
                              if (isWall(mapData, Math.floor(cx), Math.floor(cy), doorStates)) {
                                  blocked = true; break;
                              }
                          }
                          if (blocked) continue;

                          if (dist < hitDist) { hitDist = dist; hitEnemy = ent; }
                      }

                      if (hitEnemy) {
                          // Apply damage multiplier (crossbow.damage = 1.5 → 2 hits)
                          const hits = Math.round(stats.damage);
                          for (let h = 0; h < hits; h++) hitEnemy.takeDamage();
                          if (!hitEnemy.alive) {
                              sfxEnemyDie(hitEnemy.type);
                              player.addScore(getEnemyScore(hitEnemy.type));
                          }
                      }

                      // Spawn visual bolt from crossbow barrel center (no lateral offset
                      // since the FP crossbow is now centered at screen centre)
                      const boltSpeed = 14;
                      const bolt = new CrossbowBolt(
                          player.x + cosA * 1.2,
                          player.y + sinA * 1.2,
                          cosA * boltSpeed,
                          sinA * boltSpeed
                      );
                      entities.push(bolt);

                      player.weapons.crossbow.ammo--;
                      if (player.weapons.crossbow.ammo <= 0) autoSwitchWeapon();
                  }
              }
             // Note: dynamite wind-up is handled in entities.js (player.weaponThrowTimer)
         } // end if (player.attacking)

         const hpBefore = player.hp; // snapshot for hit detection

         // ── Handle dynamite throw on release ──
         if (!player.attacking && player.weaponThrowTimer > 0 && player.currentWeapon === 'dynamite') {
             const power = player.weaponThrowTimer / DYNAMITE_THROW_DURATION;
             throwDynamite(power);
         }

         for (const ent of entities) {
             if (ent instanceof Enemy) ent.update(dt, mapData, player);
             else if (ent instanceof Torch) ent.update(dt);
             else if (ent instanceof Flashlight) ent.update(dt);
             else if (ent instanceof Barrel) ent.update(dt);
             else if (ent instanceof MineLight) ent.update(dt);
             else if (ent instanceof DynamiteThrown) {
                 if (ent.alive) {
                     ent.update(dt);
                     // Wall collision → explode immediately
                     if (ent.alive && isWall(mapData, Math.floor(ent.x), Math.floor(ent.y), doorStates)) {
                         ent.hasExploded = true;
                         ent.alive = false;
                     }
                     // Enemy proximity → explode immediately
                     if (ent.alive) {
                         for (const other of entities) {
                             if (!(other instanceof Enemy) || !other.alive) continue;
                             const ddx = other.x - ent.x, ddy = other.y - ent.y;
                             if (ddx * ddx + ddy * ddy < 0.36) { // 0.6 tile radius
                                 ent.hasExploded = true;
                                 ent.alive = false;
                                 break;
                             }
                         }
                     }
                 }
                 if (ent.hasExploded && !ent.explosionTriggered) {
                     triggerDynamiteExplosion(ent);
                 }
             }
             else if (ent instanceof CrossbowBolt) {
                 if (ent.alive) {
                     ent.update(dt);
                     // Die on wall hit
                     if (ent.alive && isWall(mapData, Math.floor(ent.x), Math.floor(ent.y), doorStates)) {
                         ent.alive = false;
                     }
                     // Die on enemy hit
                     if (ent.alive) {
                         for (const other of entities) {
                             if (!(other instanceof Enemy) || !other.alive) continue;
                             const ddx = other.x - ent.x, ddy = other.y - ent.y;
                             if (ddx * ddx + ddy * ddy < 0.25) { // 0.5-tile hit radius
                                 ent.alive = false;
                                 break;
                             }
                         }
                     }
                 }
             }
             else if (ent instanceof ExplosionFX) ent.update(dt);
         }

        // ── Enemy attack SFX: base hit sound + per-type flavour ──
        if (player.hp < hpBefore) {
            sfxHit();
            if (player.lastHitByType !== null) {
                sfxEnemyAttack(player.lastHitByType);
            }
            player.lastHitByType = null;
        }

        // ── Enemy-barrel proximity → explosion ──
        for (const barrel of entities) {
            if (!(barrel instanceof Barrel) || !barrel.alive || barrel.exploding) continue;
            for (const enemy of entities) {
                if (!(enemy instanceof Enemy) || !enemy.alive) continue;
                const edx = enemy.x - barrel.x, edy = enemy.y - barrel.y;
                if (Math.sqrt(edx * edx + edy * edy) < 0.6) {
                    triggerBarrelExplosion(barrel);
                    break;
                }
            }
        }

         for (const ent of entities) {
             if (!ent.alive) continue;
             const dx = ent.x - player.x;
             const dy = ent.y - player.y;
             const dist = Math.sqrt(dx * dx + dy * dy);
             if (dist < 0.5) {
                 if (ent instanceof Treasure) {
                     ent.alive = false;
                     player.addScore(ent.value);
                     if (ent.type === T.GEM) sfxGem(); else sfxPickup();
                 } else if (ent instanceof KeyItem) {
                     ent.alive = false;
                     player.keys.add(ent.type);
                     sfxKeyPickup();
                 } else if (ent instanceof Flashlight) {
                     ent.alive = false;
                     if (!player.hasFlashlight) {
                         player.hasFlashlight = true;
                         player.flashlightOn = true;
                         sfxFlashlightPickup();
                     }
                 } else if (ent instanceof WeaponPickup) {
                     const weaponMap = { [T.WARHAMMER]: 'warhammer', [T.CROSSBOW]: 'crossbow' };
                     const weapon = weaponMap[ent.type];
                     if (weapon) {
                         if (!player.weapons[weapon].owned) {
                             // First pickup: unlock + auto-equip
                             player.weapons[weapon].owned = true;
                             if (weapon === 'crossbow') player.weapons.crossbow.ammo = Math.max(player.weapons.crossbow.ammo, 5);
                             player.currentWeapon = weapon;
                         } else if (weapon === 'crossbow') {
                             // Already have it: pick up for +5 bolts
                             player.weapons.crossbow.ammo += 5;
                         }
                         // Warhammer: no ammo to give — just pick up (already owned = noop)
                         ent.alive = false;
                         sfxPickup();
                     }
                 } else if (ent instanceof AmmoPickup) {
                     // Ammo pickup
                     const ammoMap = { [T.AMMO_BOLT]: 'crossbow', [T.AMMO_DYNAMITE]: 'dynamite' };
                     const weapon = ammoMap[ent.type];
                     if (weapon) {
                         const ammoCount = ent.type === T.AMMO_BOLT ? 5 : 2;
                         player.weapons[weapon].ammo += ammoCount;
                         // Dynamite ammo auto-unlocks the dynamite weapon slot
                         if (ent.type === T.AMMO_DYNAMITE) player.weapons.dynamite.owned = true;
                         ent.alive = false;
                         sfxPickup();
                     }
                 } else if (ent instanceof HealthPack || ent instanceof SmallHealthPack) {
                     if (player.hp < player.maxHp) {
                         ent.alive = false;
                         player.heal(ent.healAmount);
                         sfxHeal();
                     }
                 } else if (ent instanceof Exit) {
                     if (gameMode === 'campaign') {
                         currentLevel++;
                         if (currentLevel >= getCampaignLength()) switchState('win');
                         else switchState('nextlevel');
                     } else {
                         switchState('win');
                     }
                     return;
                 }
             }
         }

        if (!player.alive) { switchState('gameover'); return; }

        // ── Modulate ambient soundtrack ──
        let nearestEnemyDist = Infinity;
        for (const ent of entities) {
            if (!(ent instanceof Enemy) || !ent.alive) continue;
            const edx = ent.x - player.x, edy = ent.y - player.y;
            const d = Math.sqrt(edx * edx + edy * edy);
            if (d < nearestEnemyDist) nearestEnemyDist = d;
        }
        updateAmbient(player.hp, nearestEnemyDist);
    }

    renderFrame(mapData, player, entities, levelInfo, breakableWalls, doorStates, explored);
    animFrame = requestAnimationFrame(gameLoop);
}

switchState('menu');
