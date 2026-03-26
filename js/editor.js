/* ── editor.js ── grid-based map editor ── */

import { T, TILE_LABEL_KEYS, TILE_COLORS, WALL_TYPES, ENTITY_TYPES } from './config.js';
import { loadMap, saveMap, createEmptyMap, createDefaultMap, getCampaignLevel, getCampaignLength } from './map.js';
import { t } from './i18n.js';

let canvas, ctx;
let mapData;
let selectedTile = T.STONE;
let cellSize = 24;
let painting = false;
let onPlay = null;
let panelEl = null;

const ALL_TILES = [T.EMPTY, T.STONE, T.WOOD, T.ORE, T.MOSSY, T.CRYSTAL, T.IRON, T.PLAYER, T.GOLD, T.GEM, T.BAT, T.SKELETON, T.SPIDER, T.GHOST, T.EXIT, T.TORCH, T.HEALTH];

export function initEditor(canvasEl, panel, buttonsEl, playCallback) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    onPlay = playCallback;
    panelEl = panel;
    mapData = loadMap();

    buildPalette(panel);
    buildButtons(buttonsEl);
    resizeCanvas();
    drawGrid();

    canvas.addEventListener('mousedown', e => { painting = true; paint(e); });
    canvas.addEventListener('mousemove', e => { if (painting) paint(e); });
    canvas.addEventListener('mouseup', () => painting = false);
    canvas.addEventListener('mouseleave', () => painting = false);

    canvas.addEventListener('contextmenu', e => {
        e.preventDefault();
        const { gx, gy } = getCellFromEvent(e);
        if (gx >= 0 && gy >= 0 && gx < mapData.width && gy < mapData.height) {
            mapData.tiles[gy][gx] = T.EMPTY;
            drawGrid();
        }
    });
}

function buildPalette(panel) {
    const existing = panel.querySelectorAll('.palette-header, .palette-item');
    existing.forEach(el => el.remove());

    const h3 = document.createElement('h3');
    h3.className = 'palette-header';
    h3.textContent = t('palette');
    panel.insertBefore(h3, panel.firstChild);

    for (const tile of ALL_TILES) {
        const item = document.createElement('div');
        item.className = 'palette-item' + (tile === selectedTile ? ' selected' : '');
        item.dataset.tile = tile;

        const swatch = document.createElement('div');
        swatch.className = 'palette-swatch';
        swatch.style.background = TILE_COLORS[tile];

        const label = document.createElement('span');
        label.textContent = t(TILE_LABEL_KEYS[tile]);

        item.appendChild(swatch);
        item.appendChild(label);

        item.addEventListener('click', () => {
            panel.querySelectorAll('.palette-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            selectedTile = Number(item.dataset.tile);
        });

        const buttonsDiv = panel.querySelector('#editor-buttons');
        panel.insertBefore(item, buttonsDiv);
    }
}

function buildButtons(container) {
    container.innerHTML = '';

    const makeBtn = (text, cls, fn) => {
        const b = document.createElement('button');
        b.textContent = text;
        if (cls) b.className = cls;
        b.addEventListener('click', fn);
        container.appendChild(b);
        return b;
    };

    // Level selector
    const levelWrap = document.createElement('div');
    levelWrap.id = 'level-select-wrap';
    const levelLabel = document.createElement('label');
    levelLabel.textContent = t('edLevelSelect');
    const levelSelect = document.createElement('select');
    levelSelect.id = 'level-select';

    const optCustom = document.createElement('option');
    optCustom.value = 'custom';
    optCustom.textContent = t('edCustomMap');
    levelSelect.appendChild(optCustom);

    for (let i = 0; i < getCampaignLength(); i++) {
        const lvl = getCampaignLevel(i);
        const opt = document.createElement('option');
        opt.value = String(i);
        opt.textContent = lvl.name;
        levelSelect.appendChild(opt);
    }

    levelSelect.addEventListener('change', () => {
        const val = levelSelect.value;
        if (val === 'custom') {
            mapData = loadMap();
        } else {
            const lvl = getCampaignLevel(parseInt(val));
            if (lvl) mapData = JSON.parse(JSON.stringify(lvl));
        }
        resizeCanvas();
        drawGrid();
    });

    levelWrap.appendChild(levelLabel);
    levelWrap.appendChild(levelSelect);
    container.appendChild(levelWrap);

    makeBtn(t('edClear'), '', () => {
        if (confirm(t('edConfirmClear'))) {
            mapData = createEmptyMap(mapData.width, mapData.height);
            drawGrid();
        }
    });

    makeBtn(t('edDefault'), '', () => {
        mapData = createDefaultMap();
        resizeCanvas();
        drawGrid();
    });

    makeBtn(t('edSave'), '', () => {
        saveMap(mapData);
        alert(t('edSaved'));
    });

    makeBtn(t('edLoad'), '', () => {
        mapData = loadMap();
        resizeCanvas();
        drawGrid();
    });

    const sizeDiv = document.createElement('div');
    sizeDiv.id = 'map-size-controls';
    sizeDiv.innerHTML = `
        <label>${t('edWidth')}</label><input type="number" id="map-w" min="8" max="64" value="${mapData.width}">
        <label>${t('edHeight')}</label><input type="number" id="map-h" min="8" max="64" value="${mapData.height}">
        <button id="resize-btn">${t('edResize')}</button>
    `;
    container.appendChild(sizeDiv);

    setTimeout(() => {
        document.getElementById('resize-btn')?.addEventListener('click', () => {
            const w = parseInt(document.getElementById('map-w').value) || 24;
            const h = parseInt(document.getElementById('map-h').value) || 24;
            mapData = createEmptyMap(Math.max(8, Math.min(64, w)), Math.max(8, Math.min(64, h)));
            resizeCanvas();
            drawGrid();
        });
    }, 0);

    makeBtn(t('edPlay'), 'play-btn', () => {
        let playerCount = 0, exitCount = 0;
        for (let y = 0; y < mapData.height; y++)
            for (let x = 0; x < mapData.width; x++) {
                if (mapData.tiles[y][x] === T.PLAYER) playerCount++;
                if (mapData.tiles[y][x] === T.EXIT) exitCount++;
            }
        if (playerCount === 0) { alert(t('edNoPlayer')); return; }
        if (playerCount > 1) { alert(t('edMultiPlayer')); return; }
        if (exitCount === 0) { alert(t('edNoExit')); return; }
        saveMap(mapData);
        if (onPlay) onPlay();
    });
}

export function rebuildEditorUI() {
    if (!panelEl) return;
    buildPalette(panelEl);
    const buttonsEl = document.getElementById('editor-buttons');
    if (buttonsEl) buildButtons(buttonsEl);
}

function resizeCanvas() {
    const maxW = window.innerWidth - 220;
    const maxH = window.innerHeight - 20;
    cellSize = Math.max(8, Math.min(32, Math.floor(Math.min(maxW / mapData.width, maxH / mapData.height))));
    canvas.width = mapData.width * cellSize;
    canvas.height = mapData.height * cellSize;
}

function getCellFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    return { gx: Math.floor(mx * sx / cellSize), gy: Math.floor(my * sy / cellSize) };
}

function paint(e) {
    const { gx, gy } = getCellFromEvent(e);
    if (gx < 0 || gy < 0 || gx >= mapData.width || gy >= mapData.height) return;
    if (selectedTile === T.PLAYER) {
        for (let y = 0; y < mapData.height; y++)
            for (let x = 0; x < mapData.width; x++)
                if (mapData.tiles[y][x] === T.PLAYER) mapData.tiles[y][x] = T.EMPTY;
    }
    mapData.tiles[gy][gx] = selectedTile;
    drawGrid();
}

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < mapData.height; y++) {
        for (let x = 0; x < mapData.width; x++) {
            const tile = mapData.tiles[y][x];
            ctx.fillStyle = TILE_COLORS[tile] || '#1a1a1a';
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
            if (ENTITY_TYPES.has(tile)) {
                ctx.fillStyle = '#fff';
                ctx.font = `${Math.max(10, cellSize - 6)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const icons = {
                    [T.PLAYER]: '🧑', [T.GOLD]: '💰', [T.GEM]: '💎',
                    [T.BAT]: '🦇', [T.SKELETON]: '💀', [T.SPIDER]: '🕷️',
                    [T.GHOST]: '👻', [T.EXIT]: '🚪', [T.TORCH]: '🔥',
                    [T.HEALTH]: '❤️', [T.PILLAR]: '🪨',
                };
                ctx.fillText(icons[tile] || '?', x * cellSize + cellSize / 2, y * cellSize + cellSize / 2);
            }
        }
    }
}

export function showEditor() {
    mapData = loadMap();
    resizeCanvas();
    drawGrid();
}
