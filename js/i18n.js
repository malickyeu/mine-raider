/* ── i18n.js ── Czech / English localization ── */

const STORAGE_KEY = 'mine_raider_lang';

const translations = {
    cs: {
        // Difficulty screen
        diffScreenTitle: 'Vyber obtížnost',
        diffEasy:        'Horník',
        diffEasyDesc:    'Pomalejší a slabší nepřátelé',
        diffNormal:      'Prospekter',
        diffNormalDesc:  'Standardní výzva',
        diffHard:        'Hlubokopáč',
        diffHardDesc:    'Rychlí a silní nepřátelé',
        diffBack:        '← Zpět',

        // Menu
        title:          '⛏️ Mine Raider',
        subtitle:       'Poklad starých dolů',
        btnPlay:        '▶ Hrát',
        btnEditor:      '🗺️ Editor map',
        btnLang:        '🌐 English',

        // HUD
        hp:             'HP',
        hintBar:        'H — Nápověda',

        // Help overlay
        helpTitle:      '📖 Ovládání',
        helpLines: [
            'WASD / Šipky — Pohyb',
            'SHIFT — Sprint (spotřebovává staminu)',
            'Myš — Rozhlížení',
            'SPACE — Útok krumpáčem',
            'F — Otevřít dveře (zamčené vyžadují klíč)',
            'SPACE u dřevěné zdi — Prolomit (3 rány)',
            'M — Skrýt / zobrazit mapu',
            'H — Nápověda',
            'L — Přepnout lucernu (zapnout / vypnout)',
            'ESC — Menu',
        ],
        helpClose:      'Stiskni H pro zavření',

        // Overlay states
        deathTitle:     '💀 Konec!',
        deathScore:     'Skóre:',
        nextLevelTitle: '🚪 Úroveň dokončena!',
        nextLevelText:  'Připrav se na další úroveň...',
        nextLevelBtn:   '▶ Další úroveň',
        winTitle:       '🏆 Gratulace!',
        winAllText:     (n, s) => `Prošel jsi všech ${n} úrovní! Celkové skóre: ${s}`,
        winCustomText:  (s) => `Našel jsi cestu ven! Skóre: ${s}`,
        backToMenu:     'Zpět do menu',
        backToEditor:   'Zpět do editoru',

        // Editor
        palette:        '🎨 Paleta',
        edClear:        '🗑️ Vyčistit',
        edDefault:      '🔄 Výchozí mapa',
        edSave:         '💾 Uložit',
        edLoad:         '📂 Načíst',
        edResize:       '↔ Změnit',
        edPlay:         '▶ Hrát!',
        edWidth:        'Š:',
        edHeight:       'V:',
        edLevelSelect:  '📋 Načíst úroveň:',
        edCustomMap:    '— Vlastní mapa —',
        edConfirmClear: 'Opravdu vyčistit mapu?',
        edSaved:        'Mapa uložena!',
        edNoPlayer:     'Umísti pozici hráče!',
        edMultiPlayer:  'Může být jen 1 pozice hráče!',
        edNoExit:       'Umísti alespoň 1 východ!',

        // Editor tabs & UI
        edBack:         '← Menu',
        edTabTiles:     'Dlaždice',
        edTabMap:       'Mapa',
        edTabGen:       'Generátor',
        edMapSize:      'Rozměry:',
        edFileActions:  'Soubor:',
        edGenDone:      '✓ Mapa vygenerována!',
        edGenPreview:   '📊 Odhadovaný obsah',

        // Map generator
        edGenTitle:     '🎲 Generátor map',
        edGenerate:     '🎲 Generovat!',
        edGenWall:      'Zdi:',
        edGenDiff:      'Obtížnost:',
        edGenRooms:     'Místnosti:',
        edGenSize:      'Velikost:',
        edGenSmall:     'Malá (16×16)',
        edGenMedium:    'Střední (24×24)',
        edGenLarge:     'Velká (32×32)',
        edGenXL:        'XL (48×48)',
        edGenHuge:      'Obří (64×64)',
        edGenMassive:   'Masivní (96×96)',
        edGenEpic:      'Epická (128×128)',
        edDiffEasy:     'Lehká',
        edDiffNormal:   'Střední',
        edDiffHard:     'Těžká',
        edWallStone:    'Kámen',
        edWallMossy:    'Mech',
        edWallCrystal:  'Krystal',
        edWallIron:     'Železo',

        // Level names (used in HUD via nameKey)
        level1Name:     'Úroveň 1 – Opuštěný důl',
        level2Name:     'Úroveň 2 – Zarostlé šachty',
        level3Name:     'Úroveň 3 – Krystalové jeskyně',
        level4Name:     'Úroveň 4 – Hluboké štoly',
        level5Name:     'Úroveň 5 – Prokleté hlubiny',

        // Tile labels
        tEmpty:    'Prázdno',   tStone:    'Kámen',
        tWood:     'Dřevo',     tOre:      'Ruda',
        tMossy:    'Mech',      tCrystal:  'Krystal',
        tIron:     'Železo',    tPlayer:   'Hráč',
        tGold:     'Zlato',     tGem:      'Drahokam',
        tBat:      'Netopýr',   tSkeleton: 'Kostlivec',
        tExit:     'Východ',    tTorch:    'Pochodeň',
        tHealth:   'Zdraví',    tSpider:   'Pavouk',
        tGhost:    'Duch',      tPillar:   'Pilíř',
        tHealthSmall: 'Malé zdraví',
        tDoor:     'Dveře',
        tKeyRed:   'Červený klíč',
        tKeyBlue:  'Modrý klíč',
        tDoorRed:  'Červené dveře',
        tDoorBlue: 'Modré dveře',
        tFlashlight: 'Lucerna',

        // Editor tile-group labels
        edGroupEmpty:   'Prázdno',
        edGroupEnv:     'Prostředí',
        edGroupEquip:   'Vybavení',
        edGroupCollect: 'Předměty',
        edGroupEnemies: 'Nepřátelé',

        // Tile descriptions (editor tooltip)
        tDescEmpty:       'Průchozí prázdné místo',
        tDescStone:       'Pevná kamenná zeď — nezničitelná',
        tDescWood:        'Dřevěná zeď — zbourat 3 údery krumpáče (SPACE)',
        tDescOre:         'Dekorativní zeď s rudou',
        tDescMossy:       'Mechem porostlá kamenná zeď',
        tDescCrystal:     'Křišťálová jeskynní zeď',
        tDescIron:        'Železem zpevněná zeď — nezničitelná',
        tDescDoor:        'Dveře — otevírají se klávesou F',
        tDescDoorRed:     'Červené zamčené dveře — vyžadují červený klíč',
        tDescDoorBlue:    'Modré zamčené dveře — vyžadují modrý klíč',
        tDescPillar:      'Dekorativní sloup — blokuje pohyb',
        tDescPlayer:      'Počáteční pozice hráče — pouze 1 na mapě',
        tDescExit:        'Východ z úrovně',
        tDescTorch:       'Pochodeň — osvětluje okolí',
        tDescGold:        'Zlatá hrouda — +50 bodů',
        tDescGem:         'Drahokam — +150 bodů',
        tDescKeyRed:      'Odemyká červené zamčené dveře',
        tDescKeyBlue:     'Odemyká modré zamčené dveře',
        tDescFlashlight:  'Lucerna — zapíná lepší viditelnost (klávesa L)',
        tDescHealth:      'Lékárnička — obnoví 40 HP',
        tDescHealthSmall: 'Malá lékárnička — obnoví 15 HP',
        tDescBat:         'Netopýr — slabý, ale rychlý',
        tDescSkeleton:    'Kostlivec — středně silný nepřítel',
        tDescSpider:      'Pavouk — středně silný nepřítel',
        tDescGhost:       'Duch — prochází zdmi, silný nepřítel',

        // High score
        bestScore:  'Nejlepší',
        newRecord:  '⭐ Nový rekord!',
        noRecord:   '—',
    },

    en: {
        // Difficulty screen
        diffScreenTitle: 'Choose Difficulty',
        diffEasy:        'Miner',
        diffEasyDesc:    'Slower and weaker enemies',
        diffNormal:      'Prospector',
        diffNormalDesc:  'Standard challenge',
        diffHard:        'Deep Delver',
        diffHardDesc:    'Fast and tough enemies',
        diffBack:        '← Back',

        title:          '⛏️ Mine Raider',
        subtitle:       'Treasure of the Old Mines',
        btnPlay:        '▶ Play',
        btnEditor:      '🗺️ Map Editor',
        btnLang:        '🌐 Čeština',

        hp:             'HP',
        hintBar:        'H — Help',

        helpTitle:      '📖 Controls',
        helpLines: [
            'WASD / Arrows — Move',
            'SHIFT — Sprint (uses stamina)',
            'Mouse — Look around',
            'SPACE — Pickaxe attack',
            'F — Open door (locked doors need a key)',
            'SPACE at wood wall — Break wall (3 hits)',
            'M — Toggle minimap',
            'H — Help',
            'L — Toggle lantern (on / off)',
            'ESC — Menu',
        ],
        helpClose:      'Press H to close',

        deathTitle:     '💀 Game Over!',
        deathScore:     'Score:',
        nextLevelTitle: '🚪 Level Complete!',
        nextLevelText:  'Get ready for the next level...',
        nextLevelBtn:   '▶ Next Level',
        winTitle:       '🏆 Congratulations!',
        winAllText:     (n, s) => `You cleared all ${n} levels! Total score: ${s}`,
        winCustomText:  (s) => `You found the way out! Score: ${s}`,
        backToMenu:     'Back to Menu',
        backToEditor:   'Back to Editor',

        palette:        '🎨 Palette',
        edClear:        '🗑️ Clear',
        edDefault:      '🔄 Default Map',
        edSave:         '💾 Save',
        edLoad:         '📂 Load',
        edResize:       '↔ Resize',
        edPlay:         '▶ Play!',
        edWidth:        'W:',
        edHeight:       'H:',
        edLevelSelect:  '📋 Load level:',
        edCustomMap:    '— Custom map —',
        edConfirmClear: 'Really clear the map?',
        edSaved:        'Map saved!',
        edNoPlayer:     'Place the player start position!',
        edMultiPlayer:  'Only 1 player position allowed!',
        edNoExit:       'Place at least 1 exit!',

        // Editor tabs & UI
        edBack:         '← Menu',
        edTabTiles:     'Tiles',
        edTabMap:       'Map',
        edTabGen:       'Generator',
        edMapSize:      'Dimensions:',
        edFileActions:  'File:',
        edGenDone:      '✓ Map generated!',
        edGenPreview:   '📊 Estimated contents',

        // Map generator
        edGenTitle:     '🎲 Map Generator',
        edGenerate:     '🎲 Generate!',
        edGenWall:      'Walls:',
        edGenDiff:      'Difficulty:',
        edGenRooms:     'Rooms:',
        edGenSize:      'Size:',
        edGenSmall:     'Small (16×16)',
        edGenMedium:    'Medium (24×24)',
        edGenLarge:     'Large (32×32)',
        edGenXL:        'XL (48×48)',
        edGenHuge:      'Huge (64×64)',
        edGenMassive:   'Massive (96×96)',
        edGenEpic:      'Epic (128×128)',
        edDiffEasy:     'Easy',
        edDiffNormal:   'Normal',
        edDiffHard:     'Hard',
        edWallStone:    'Stone',
        edWallMossy:    'Mossy',
        edWallCrystal:  'Crystal',
        edWallIron:     'Iron',

        tEmpty:    'Empty',     tStone:    'Stone',
        tWood:     'Wood',      tOre:      'Ore',
        tMossy:    'Mossy',     tCrystal:  'Crystal',
        tIron:     'Iron',      tPlayer:   'Player',
        tGold:     'Gold',      tGem:      'Gem',
        tBat:      'Bat',       tSkeleton: 'Skeleton',
        tExit:     'Exit',      tTorch:    'Torch',
        tHealth:   'Health',    tSpider:   'Spider',
        tGhost:    'Ghost',     tPillar:   'Pillar',
        tHealthSmall: 'Small Health',
        tDoor:     'Door',
        tKeyRed:   'Red Key',
        tKeyBlue:  'Blue Key',
        tDoorRed:  'Red Door',
        tDoorBlue: 'Blue Door',
        tFlashlight: 'Lantern',

        // Editor tile-group labels
        edGroupEmpty:   'Empty',
        edGroupEnv:     'Environment',
        edGroupEquip:   'Equipment',
        edGroupCollect: 'Items',
        edGroupEnemies: 'Enemies',

        // Tile descriptions (editor tooltip)
        tDescEmpty:       'Walkable empty space',
        tDescStone:       'Solid stone wall — indestructible',
        tDescWood:        'Wood wall — break with 3 pickaxe hits (SPACE)',
        tDescOre:         'Decorative ore-vein wall',
        tDescMossy:       'Mossy stone wall',
        tDescCrystal:     'Crystal cave wall',
        tDescIron:        'Iron-reinforced wall — indestructible',
        tDescDoor:        'Door — open with F key',
        tDescDoorRed:     'Red locked door — needs red key',
        tDescDoorBlue:    'Blue locked door — needs blue key',
        tDescPillar:      'Decorative pillar — blocks movement',
        tDescPlayer:      'Player start position — only 1 per map',
        tDescExit:        'Level exit',
        tDescTorch:       'Torch — lights up nearby area',
        tDescGold:        'Gold nugget — +50 points',
        tDescGem:         'Gem — +150 points',
        tDescKeyRed:      'Unlocks red locked doors',
        tDescKeyBlue:     'Unlocks blue locked doors',
        tDescFlashlight:  'Lantern — enables better visibility (L key)',
        tDescHealth:      'Health pack — restores 40 HP',
        tDescHealthSmall: 'Small health pack — restores 15 HP',
        tDescBat:         'Bat — weak but fast',
        tDescSkeleton:    'Skeleton — moderate enemy',
        tDescSpider:      'Spider — moderate enemy',
        tDescGhost:       'Ghost — passes through walls, strong',

        // High score
        bestScore:  'Best',
        newRecord:  '⭐ New Record!',
        noRecord:   '—',

        // Level names
        level1Name: 'Level 1 – Abandoned Mine',
        level2Name: 'Level 2 – Overgrown Shafts',
        level3Name: 'Level 3 – Crystal Caves',
        level4Name: 'Level 4 – Deep Tunnels',
        level5Name: 'Level 5 – Cursed Depths',
    },
};

let currentLang = localStorage.getItem(STORAGE_KEY) || 'cs';

export function t(key, ...args) {
    const val = translations[currentLang]?.[key] ?? translations.cs[key] ?? key;
    return typeof val === 'function' ? val(...args) : val;
}

export function getLang() { return currentLang; }

export function setLang(lang) {
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
}

export function toggleLang() {
    setLang(currentLang === 'cs' ? 'en' : 'cs');
}
