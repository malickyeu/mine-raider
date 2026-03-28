/* ── editor.js ── grid-based map editor with tabbed UI ── */

import { T, TILE_LABEL_KEYS, TILE_COLORS, ENTITY_TYPES } from './config.js';
import { loadMap, saveMap, createEmptyMap, createDefaultMap, getCampaignLevel, getCampaignLength } from './map.js';
import { t } from './i18n.js';
import { generateMap } from './mapgen.js';

let canvas, ctx;
let mapData;
let selectedTile = T.STONE;
let cellSize = 24;
let painting = false;
let onPlay = null;
let onBack = null;
let panelEl = null;
let activeTab = 'tiles';

const PANEL_W = 224; // matches CSS width

const ALL_TILES = [
    T.EMPTY, T.STONE, T.WOOD, T.ORE, T.MOSSY, T.CRYSTAL, T.IRON,
    T.PLAYER, T.GOLD, T.GEM, T.BAT, T.SKELETON, T.SPIDER, T.GHOST,
    T.EXIT, T.TORCH, T.HEALTH, T.HEALTH_SMALL, T.PILLAR,
];

// ════════════════════════════════════════
//  Init
// ════════════════════════════════════════

export function initEditor(canvasEl, panel, _buttonsEl, playCallback, backCallback) {
    canvas = canvasEl;
    ctx    = canvas.getContext('2d');
    onPlay = playCallback;
    onBack = backCallback;
    panelEl = panel;
    mapData = loadMap();

    buildPanel();
    resizeCanvas();
    drawGrid();

    canvas.addEventListener('mousedown',  e => { painting = true; paint(e); });
    canvas.addEventListener('mousemove',  e => { if (painting) paint(e); });
    canvas.addEventListener('mouseup',    () => painting = false);
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

// ════════════════════════════════════════
//  Panel builder
// ════════════════════════════════════════

function switchTab(id) {
    activeTab = id;
    panelEl.querySelectorAll('.ed-tab').forEach(b =>
        b.classList.toggle('active', b.dataset.tab === id));
    panelEl.querySelectorAll('.ed-tabcontent').forEach(c =>
        c.classList.toggle('active', c.id === 'ed-tab-' + id));
}

function buildPanel() {
    panelEl.innerHTML = '';

    // ── Top action bar ──
    const topbar = document.createElement('div');
    topbar.id = 'ed-topbar';

    const backBtn = document.createElement('button');
    backBtn.id    = 'ed-back';
    backBtn.textContent = t('edBack');
    backBtn.onclick = () => { if (onBack) onBack(); };

    const playBtn = document.createElement('button');
    playBtn.id    = 'ed-play-top';
    playBtn.className = 'play-btn';
    playBtn.textContent = t('edPlay');
    playBtn.onclick = handlePlay;

    topbar.appendChild(backBtn);
    topbar.appendChild(playBtn);
    panelEl.appendChild(topbar);

    // ── Tab bar ──
    const tabBar = document.createElement('div');
    tabBar.id = 'ed-tabs';
    const TABS = [
        { id: 'tiles', icon: '🎨', key: 'edTabTiles' },
        { id: 'map',   icon: '🗺️', key: 'edTabMap'   },
        { id: 'gen',   icon: '🎲', key: 'edTabGen'   },
    ];
    for (const tab of TABS) {
        const btn = document.createElement('button');
        btn.className  = 'ed-tab' + (activeTab === tab.id ? ' active' : '');
        btn.dataset.tab = tab.id;
        btn.innerHTML = `<span class="tab-icon">${tab.icon}</span><br><span class="tab-lbl">${t(tab.key)}</span>`;
        btn.onclick = () => switchTab(tab.id);
        tabBar.appendChild(btn);
    }
    panelEl.appendChild(tabBar);

    // ── Tab content areas ──
    buildTilesTab();
    buildMapTab();
    buildGenTab();
}

function makeTabContent(id) {
    const div = document.createElement('div');
    div.id = 'ed-tab-' + id;
    div.className = 'ed-tabcontent' + (activeTab === id ? ' active' : '');
    panelEl.appendChild(div);
    return div;
}

// ── Tiles tab ──
function buildTilesTab() {
    const pane = makeTabContent('tiles');
    for (const tile of ALL_TILES) {
        const item = document.createElement('div');
        item.className  = 'palette-item' + (tile === selectedTile ? ' selected' : '');
        item.dataset.tile = tile;

        const swatch = document.createElement('div');
        swatch.className = 'palette-swatch';
        swatch.style.background = TILE_COLORS[tile];

        const label = document.createElement('span');
        label.textContent = t(TILE_LABEL_KEYS[tile]);

        item.appendChild(swatch);
        item.appendChild(label);
        item.addEventListener('click', () => {
            pane.querySelectorAll('.palette-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            selectedTile = Number(item.dataset.tile);
        });
        pane.appendChild(item);
    }
}

// ── Map tab ──
function buildMapTab() {
    const pane = makeTabContent('map');

    // Campaign level loader
    const grpLoad = makeGroup(pane, t('edLevelSelect'));
    const levelSelect = document.createElement('select');
    levelSelect.id = 'level-select';
    levelSelect.className = 'ed-select';
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
        mapData = val === 'custom'
            ? loadMap()
            : JSON.parse(JSON.stringify(getCampaignLevel(parseInt(val))));
        resizeCanvas();
        drawGrid();
    });
    grpLoad.appendChild(levelSelect);

    // Map size
    const grpSize = makeGroup(pane, t('edMapSize'));
    const sizeRow = document.createElement('div');
    sizeRow.className = 'ed-size-row';
    sizeRow.innerHTML = `
        <label class="ed-small-lbl">${t('edWidth')}</label>
        <input type="number" id="map-w" class="ed-num" min="8" max="64" value="${mapData.width}">
        <label class="ed-small-lbl">${t('edHeight')}</label>
        <input type="number" id="map-h" class="ed-num" min="8" max="64" value="${mapData.height}">
    `;
    grpSize.appendChild(sizeRow);
    grpSize.appendChild(makeEdBtn(t('edResize'), '', () => {
        const w = parseInt(document.getElementById('map-w').value) || 24;
        const h = parseInt(document.getElementById('map-h').value) || 24;
        mapData = createEmptyMap(Math.max(8, Math.min(64, w)), Math.max(8, Math.min(64, h)));
        resizeCanvas(); drawGrid();
    }));

    // File actions
    const grpFile = makeGroup(pane, t('edFileActions'));
    grpFile.appendChild(makeEdBtn(t('edSave'), '', () => {
        saveMap(mapData);
        showFlash(pane, t('edSaved'));
    }));
    grpFile.appendChild(makeEdBtn(t('edLoad'), '', () => {
        mapData = loadMap(); resizeCanvas(); drawGrid();
    }));
    grpFile.appendChild(makeEdBtn(t('edDefault'), '', () => {
        mapData = createDefaultMap(); resizeCanvas(); drawGrid();
    }));
    grpFile.appendChild(makeEdBtn(t('edClear'), 'danger-btn', () => {
        if (confirm(t('edConfirmClear'))) {
            mapData = createEmptyMap(mapData.width, mapData.height);
            drawGrid();
        }
    }));
}

// ── Generator tab ──
function buildGenTab() {
    const pane = makeTabContent('gen');

    const grp = makeGroup(pane, t('edGenTitle'));
    grp.innerHTML += `
        <div class="gen-row">
            <label class="ed-small-lbl">${t('edGenWall')}</label>
            <select id="gen-wall" class="ed-select">
                <option value="${T.STONE}">${t('edWallStone')}</option>
                <option value="${T.MOSSY}">${t('edWallMossy')}</option>
                <option value="${T.CRYSTAL}">${t('edWallCrystal')}</option>
                <option value="${T.IRON}">${t('edWallIron')}</option>
            </select>
        </div>
        <div class="gen-row">
            <label class="ed-small-lbl">${t('edGenSize')}</label>
            <select id="gen-size" class="ed-select">
                <option value="16">${t('edGenSmall')}</option>
                <option value="24" selected>${t('edGenMedium')}</option>
                <option value="32">${t('edGenLarge')}</option>
                <option value="48">${t('edGenXL')}</option>
                <option value="64">${t('edGenHuge')}</option>
                <option value="96">${t('edGenMassive')}</option>
                <option value="128">${t('edGenEpic')}</option>
            </select>
        </div>
        <div class="gen-row">
            <label class="ed-small-lbl">${t('edGenDiff')}</label>
            <select id="gen-diff" class="ed-select">
                <option value="easy">${t('edDiffEasy')}</option>
                <option value="normal" selected>${t('edDiffNormal')}</option>
                <option value="hard">${t('edDiffHard')}</option>
            </select>
        </div>
        <div class="gen-row">
            <label class="ed-small-lbl">${t('edGenRooms')}</label>
            <input type="number" id="gen-rooms" class="ed-num" min="4" max="60" value="8">
        </div>
    `;

    // ── Live preview ──
    const previewDiv = document.createElement('div');
    previewDiv.className = 'gen-preview';
    pane.appendChild(previewDiv);

    function updatePreview() {
        const rooms = Math.max(4, Math.min(60, parseInt(document.getElementById('gen-rooms')?.value) || 8));
        const diff  = document.getElementById('gen-diff')?.value  || 'normal';
        const scale = Math.max(1, rooms / 8);
        const DS = {
            easy:   { bats:1, skeletons:0, spiders:1, ghosts:0, gold:4, gems:2, health:3, torches:rooms },
            normal: { bats:2, skeletons:1, spiders:2, ghosts:1, gold:3, gems:1, health:2, torches:Math.ceil(rooms*0.8) },
            hard:   { bats:3, skeletons:2, spiders:3, ghosts:2, gold:2, gems:1, health:1, torches:Math.ceil(rooms*0.5) },
        }[diff] ?? { bats:2, skeletons:1, spiders:2, ghosts:1, gold:3, gems:1, health:2, torches:Math.ceil(rooms*0.8) };

        previewDiv.innerHTML =
            `<div class="gen-preview-title">${t('edGenPreview')}</div>` +
            `<div class="gen-preview-grid">` +
            `<span>🦇 ×${Math.max(0,Math.round(DS.bats*scale))}</span>` +
            `<span>💀 ×${Math.max(0,Math.round(DS.skeletons*scale))}</span>` +
            `<span>🕷️ ×${Math.max(0,Math.round(DS.spiders*scale))}</span>` +
            `<span>👻 ×${Math.max(0,Math.round(DS.ghosts*scale))}</span>` +
            `<span>💰 ×${Math.max(2,Math.round(DS.gold*scale))}</span>` +
            `<span>💎 ×${Math.max(1,Math.round(DS.gems*scale))}</span>` +
            `<span>❤️ ×${Math.max(1,Math.round(DS.health*scale))}</span>` +
            `<span>🔥 ×${Math.round(DS.torches)}</span>` +
            `</div>`;
    }

    // Attach live listeners after elements exist in DOM
    document.getElementById('gen-size').addEventListener('change', updatePreview);
    document.getElementById('gen-diff').addEventListener('change', updatePreview);
    document.getElementById('gen-rooms').addEventListener('input',  updatePreview);
    updatePreview(); // initial render

    pane.appendChild(makeEdBtn(t('edGenerate'), 'gen-btn', () => {
        const wallType   = parseInt(document.getElementById('gen-wall').value);
        const size       = parseInt(document.getElementById('gen-size').value);
        const difficulty = document.getElementById('gen-diff').value;
        const roomCount  = Math.max(4, Math.min(60, parseInt(document.getElementById('gen-rooms').value) || 8));
        mapData = generateMap({ width: size, height: size, wallType, roomCount, difficulty });
        resizeCanvas(); drawGrid();
        showFlash(pane, t('edGenDone'));
    }));
}

// ── UI helpers ──
function makeGroup(parent, title) {
    const wrap = document.createElement('div');
    wrap.className = 'ed-group';
    if (title) {
        const h = document.createElement('div');
        h.className = 'ed-group-title';
        h.textContent = title;
        wrap.appendChild(h);
    }
    parent.appendChild(wrap);
    return wrap;
}

function makeEdBtn(text, cls, fn) {
    const b = document.createElement('button');
    b.textContent = text;
    b.className = 'ed-btn' + (cls ? ' ' + cls : '');
    b.addEventListener('click', fn);
    return b;
}

function showFlash(parent, msg) {
    const f = document.createElement('div');
    f.className = 'ed-flash';
    f.textContent = msg;
    parent.appendChild(f);
    setTimeout(() => f.remove(), 1800);
}

function handlePlay() {
    let playerCount = 0, exitCount = 0;
    for (let y = 0; y < mapData.height; y++)
        for (let x = 0; x < mapData.width; x++) {
            if (mapData.tiles[y][x] === T.PLAYER) playerCount++;
            if (mapData.tiles[y][x] === T.EXIT)   exitCount++;
        }
    if (playerCount === 0) { alert(t('edNoPlayer'));   return; }
    if (playerCount > 1)   { alert(t('edMultiPlayer')); return; }
    if (exitCount === 0)   { alert(t('edNoExit'));      return; }
    saveMap(mapData);
    if (onPlay) onPlay();
}

// ════════════════════════════════════════
//  Public API
// ════════════════════════════════════════

export function rebuildEditorUI() {
    if (!panelEl) return;
    buildPanel();
}

export function showEditor() {
    mapData = loadMap();
    resizeCanvas();
    drawGrid();
}

// ════════════════════════════════════════
//  Canvas helpers
// ════════════════════════════════════════

function resizeCanvas() {
    const maxW = window.innerWidth  - PANEL_W - 6;
    const maxH = window.innerHeight - 10;
    cellSize = Math.max(8, Math.min(32, Math.floor(
        Math.min(maxW / mapData.width, maxH / mapData.height)
    )));
    canvas.width  = mapData.width  * cellSize;
    canvas.height = mapData.height * cellSize;
}

function getCellFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width  / rect.width;
    const sy = canvas.height / rect.height;
    return {
        gx: Math.floor((e.clientX - rect.left) * sx / cellSize),
        gy: Math.floor((e.clientY - rect.top)  * sy / cellSize),
    };
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
    const icons = {
        [T.PLAYER]:   '🧑', [T.GOLD]:     '💰', [T.GEM]:   '💎',
        [T.BAT]:      '🦇', [T.SKELETON]: '💀', [T.SPIDER]:'🕷️',
        [T.GHOST]:    '👻', [T.EXIT]:      '🚪', [T.TORCH]: '🔥',
        [T.HEALTH]:   '❤️', [T.HEALTH_SMALL]: '🩹', [T.PILLAR]: '🪨',
    };
    for (let y = 0; y < mapData.height; y++) {
        for (let x = 0; x < mapData.width; x++) {
            const tile = mapData.tiles[y][x];
            ctx.fillStyle = TILE_COLORS[tile] || '#1a1a1a';
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            ctx.strokeStyle = 'rgba(255,255,255,0.07)';
            ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
            if (ENTITY_TYPES.has(tile) && icons[tile]) {
                ctx.font = `${Math.max(10, cellSize - 6)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(icons[tile], x * cellSize + cellSize / 2, y * cellSize + cellSize / 2);
            }
        }
    }
}
