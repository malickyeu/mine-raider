/* ── main.js ── game bootstrap, state machine, game loop ── */

import { T, BREAKABLE_TYPES, WALL_HP } from './config.js';
import { loadMap, extractEntities, getCampaignLevel, getCampaignLength, isWall, getTile } from './map.js';
import { initInput, releasePointer } from './input.js';
import { initRenderer, renderFrame } from './renderer.js';
import { Player, Enemy, Treasure, HealthPack, Exit, Torch, Pillar, createEntities } from './entities.js';
import { initEditor, showEditor, rebuildEditorUI } from './editor.js';
import { sfxPickup, sfxGem, sfxAttack, sfxDeath, sfxWin, sfxHeal, sfxEnemyDeath, sfxHitWood, sfxBreakWood } from './audio.js';
import { toggleMinimap, toggleHelp, isHelpVisible, hideHelp } from './hud.js';
import { t, toggleLang } from './i18n.js';

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
const btnLang  = document.getElementById('btn-lang');

// ── State ──
let state = 'menu';
let player, entities, mapData;
let lastTime = 0;
let animFrame = null;

// ── Level system ──
let currentLevel = 0;
let levelInfo = null;
let gameMode = 'campaign';

// ── Breakable walls: "x,y" → remaining HP ──
let breakableWalls = {};

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
function refreshUIText() {
    btnPlay.textContent   = t('btnPlay');
    btnEditor.textContent = t('btnEditor');
    btnLang.textContent   = t('btnLang');
    menuSubtitle.textContent = t('subtitle');

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

// ── Menu buttons ──
btnPlay.addEventListener('click', () => {
    gameMode = 'campaign';
    currentLevel = 0;
    switchState('game');
});
btnEditor.addEventListener('click', () => switchState('editor'));
btnLang.addEventListener('click', () => {
    toggleLang();
    refreshUIText();
});
overlayBtn.addEventListener('click', () => {
    if (state === 'nextlevel') switchState('game');
    else switchState('menu');
});

// ── Keyboard shortcuts ──
let mKeyWasDown = false;
let hKeyWasDown = false;

window.addEventListener('keydown', e => {
    if (e.code === 'Escape') {
        if (isHelpVisible()) { hideHelp(); return; }
        if (state === 'game')   { releasePointer(); switchState('menu'); }
        if (state === 'editor') { switchState('menu'); }
    }
    if (e.code === 'KeyM' && state === 'game' && !mKeyWasDown) {
        mKeyWasDown = true;
        toggleMinimap();
    }
    if (e.code === 'KeyH' && state === 'game' && !hKeyWasDown) {
        hKeyWasDown = true;
        toggleHelp();
    }
});
window.addEventListener('keyup', e => {
    if (e.code === 'KeyM') mKeyWasDown = false;
    if (e.code === 'KeyH') hKeyWasDown = false;
});

function switchState(newState) {
    state = newState;
    menuScreen.style.display = 'none';
    editorScreen.classList.remove('active');
    overlay.classList.remove('active');
    gameCanvas.style.display = 'none';
    hideHelp();
    if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }

    switch (newState) {
        case 'menu':
            menuScreen.style.display = 'flex';
            releasePointer();
            // Reset player so next game always starts with full HP & zero score
            player = null;
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
            overlayTitle.textContent = t('deathTitle');
            overlayTitle.style.color = '#ff4444';
            overlayText.textContent = `${t('deathScore')} ${player.score}`;
            overlayBtn.textContent = t('backToMenu');
            sfxDeath();
            releasePointer();
            break;
        case 'nextlevel':
            gameCanvas.style.display = 'block';
            overlay.classList.add('active');
            overlayTitle.textContent = t('nextLevelTitle');
            overlayTitle.style.color = '#44ff88';
            overlayText.textContent = `${t('deathScore')} ${player.score} — ${t('nextLevelText')}`;
            overlayBtn.textContent = t('nextLevelBtn');
            sfxWin();
            releasePointer();
            break;
        case 'win':
            gameCanvas.style.display = 'block';
            overlay.classList.add('active');
            overlayTitle.textContent = t('winTitle');
            overlayTitle.style.color = '#ffd700';
            overlayText.textContent = gameMode === 'campaign'
                ? t('winAllText', getCampaignLength(), player.score)
                : t('winCustomText', player.score);
            overlayBtn.textContent = t('backToMenu');
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
            total: getCampaignLength()
        };
    } else {
        rawMap = loadMap();
        levelInfo = { name: rawMap.name || 'Custom', current: 1, total: 1 };
    }

    mapData = JSON.parse(JSON.stringify(rawMap));
    const { entities: entList, playerStart } = extractEntities(mapData);

    const prevScore = (player && gameMode === 'campaign') ? player.score : 0;
    const prevHp = (player && gameMode === 'campaign') ? player.hp : null;

    player = new Player(playerStart.x, playerStart.y);
    player.score = prevScore;
    if (prevHp !== null) player.hp = prevHp;

    entities = createEntities(entList);
    breakableWalls = {};
    lastTime = performance.now();
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

function gameLoop(now) {
    if (state !== 'game') return;
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    // Don't update game while help is open
    if (!isHelpVisible()) {
        player.update(dt, mapData);

        // ── Pillar collision (push player out) ──
        for (const ent of entities) {
            if (!(ent instanceof Pillar) || !ent.alive) continue;
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
            sfxAttack();
            const cosA = Math.cos(player.angle);
            const sinA = Math.sin(player.angle);

            // ── Hit enemies ──
            for (const ent of entities) {
                if (!(ent instanceof Enemy) || !ent.alive) continue;
                const dx = ent.x - player.x;
                const dy = ent.y - player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 2.0) continue;
                const dot = (dx * cosA + dy * sinA) / dist;
                if (dot > 0.7) {
                    ent.takeDamage();
                    if (!ent.alive) {
                        sfxEnemyDeath();
                        player.addScore(getEnemyScore(ent.type));
                    }
                }
            }

            // ── Break wood walls ──
            const ATTACK_RANGE = 1.5;
            for (let d = 0.25; d <= ATTACK_RANGE; d += 0.15) {
                const wx = Math.floor(player.x + cosA * d);
                const wy = Math.floor(player.y + sinA * d);
                const tile = getTile(mapData, wx, wy);
                if (BREAKABLE_TYPES.has(tile)) {
                    const key = `${wx},${wy}`;
                    if (breakableWalls[key] === undefined) breakableWalls[key] = WALL_HP[tile];
                    breakableWalls[key]--;
                    if (breakableWalls[key] <= 0) {
                        mapData.tiles[wy][wx] = T.EMPTY;
                        delete breakableWalls[key];
                        sfxBreakWood();
                    } else {
                        sfxHitWood();
                    }
                    break; // only one wall per swing
                } else if (isWall(mapData, wx, wy)) {
                    break; // solid wall stops ray
                }
            }
        }

        for (const ent of entities) {
            if (ent instanceof Enemy) ent.update(dt, mapData, player);
            else if (ent instanceof Torch) ent.update(dt);
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
                } else if (ent instanceof HealthPack) {
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
    }

    renderFrame(mapData, player, entities, levelInfo, breakableWalls);
    animFrame = requestAnimationFrame(gameLoop);
}

switchState('menu');
