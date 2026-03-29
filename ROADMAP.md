# ⛏️ Mine Raider – Roadmap

> Živ dokument sledujc plnovan funkce a npady pro dalš rozvoj hry.  
> Posledn aktualizace: **2026-03-29**  verze **0.6.0**  28 features (15 hotovo, 13 zbývá)

---

## ✅ Hotovo (aktuální stav)

- [x] DDA raycasting engine (Wolf3D styl), textúrované zdi, fog
- [x] 6 typů zdí: Stone, Wood *(breakable)*, Ore, Mossy, Crystal, Iron
- [x] 4 nepřátelé: Bat 🦇, Spider 🕷️, Skeleton 💀, Ghost 👻
- [x] Sběratelné předměty: zlaté mince, drahokamy, lékárničky
- [x] Dekorace: pochodně, kamenné sloupy
- [x] 5-úrovňová kampaň s rostoucí obtížností
- [x] Mřížkový map editor s paletou, validací a save/load
- [x] Procedurálně generované textury a zvuky (Canvas 2D + Web Audio)
- [x] Minimap s přepínačem `M`
- [x] HUD: HP, skóre, název levelu, help overlay (`H`)
- [x] i18n: CZ 🇨🇿 / EN 🇬🇧
- [x] Opakovatelné hraní po smrti / dohrání hry
- [x] Generátor map v editoru (20×20, 32×32, 64×64, 128×128) s garantovaným přístupem k exitu
- [x] Systém obtížností – Horník / Prospekter / Hlubokopáč (škáluje HP, rychlost, damage nepřátel)
- [x] Sprint + stamina systém (`Shift`, stamina bar v HUD, drain/regen)
- [x] Head Bob & Screen Shake (`bobPhase` Y-offset + `shakeTimer` při zásahu)
- [x] Otevíratelné dveře (`T.DOOR`, klávesa `F`, 3D zárubně, thin-door raycasting, auto-close po 3 s)
- [x] Malá lékárnička (`T.HEALTH_SMALL`, +15 HP)
- [x] Dřevo sousedící s dveřmi nelze rozbít
- [x] Klíče a zamčené dveře (`T.KEY_RED`, `T.KEY_BLUE`, `T.DOOR_RED`, `T.DOOR_BLUE`) — 2 barvy, BFS-safe generátor, HUD ikonky klíčů, minimap barevné rozlišení
- [x] **Svítilna / Lucerna** 🔦 — collectible `T.FLASHLIGHT`, kužel světla (přepracovaný fog + vignette), přepínač `L`, HUD indikátor ON/OFF; pochodeň-flicker animace na zdech i spritech
- [x] **Redesign palety editoru** — skupiny dlaždic (Prostředí / Vybavení / Předměty / Nepřátelé), ikony místo textů, tooltip s názvem + popisem při najetí myší
- [x] **Oprava logiky zamčených dveří v generátoru** — exit je vždy za zamčenou branou; klíč je ukrytý v nejodlehlejší třetině otevřené zóny (nikdy ve startovací místnosti); v uzamčené zóně jsou bonus poklady
- [x] **Globální žebříček skóre** 🏆 — `highscore.js`, localStorage, per-difficulty best score na difficulty screen, rekordní zobrazení po výhře/prohře
- [x] **Výbušné sudy** 💣 — `T.BARREL` entita, výbuch krumpáčem / kontaktem nepřítele, řetězové výbuchy, plošné poškození (hráč, nepřátelé, dřevo), exploze sprite, screen shake, SFX
- [x] **Ambientní dekorace** ⛏️ — důlní světla (`T.MINE_LIGHT`, dynamické osvětlení radius 3.5), důlní vozíky (`T.MINE_CART`, blokují pohyb), opřené krumpáče (`T.PICKAXE_DECOR`); v editoru i generátoru
- [x] **Fog-of-War minimapa** 🗺️ — `explored[][]` grid odhalovaný BFS flood-fill (zastaví se na zdech a zavřených dveřích); vzdálené prozkoumané dlaždice ztmaveny; ikonky statických entit v minimapě; dveřní rám se odhalí spolu s dveřmi
- [x] **Vylepšený generátor map** ⚙️ — parametr `targetScore` škáluje nepřátele a sběratelné předměty; dynamický max místností dle velikosti mapy; `healthSmall` = 0.5 × místnost; zvýšené základní počty nepřátel (hard: 5/3/5/3); mine carty seneumísťují vedle dveří; lékárničky a krumpáče vždy u zdi (`nearWallEmpty` pool); živý preview v editoru s odhadovaným skóre
- [x] **Ambientní soundtrack** 🎵 — procedurální smyčka bez audio souborů: drone (2 rozladěné 55 Hz siny), šum jeskyně (white noise → lowpass), napěťová vrstva (sawtooth fades in dle vzdálenosti nepřítele), kapky vody (random setTimeout 5–19 s s echem); modulace dle HP (drone pitch) a proximity (filter cutoff); `startAmbient` / `stopAmbient` / `updateAmbient` v `audio.js`, integrace v `main.js`
- [x] **Per-enemy SFX** 🔊 — každý typ nepřítele má vlastní zvuk útoku (bat screech, spider hiss, skeleton rattle, ghost wail) i smrti; hráč slyší `sfxHit` + typový zvuk překrytím; implementováno přes `player.lastHitByType` + HP-diff detekce v `main.js`
- [x] **Nastavení submenu** ⚙️ — zvláštní obrazovka Nastavení dostupná z hlavního menu: přepínač SFX (🔊/🔇), přepínač hudby (🎵), přepínač jazyka (🌐); vše persistováno v `localStorage`; odpojeno z hlavního menu
- [x] **Plná klávesnicová navigace** ⌨️ — šipky + Enter/Numpad Enter v menu, výběru obtížnosti, nastavení a overlay; Backspace = ESC; fix focus-trap (blur při switchState); fix synchronní race condition Enter → return po akcích

---

## 🔝 Plánované features

### 4. 🪤 Pasti (traps)
- **Spike Trap** – dlaždice na zemi, spustí se při přechodu (animovaný overlay na podlaze)
- **Rolling Boulder** – pohybující se objekt po chodbě, inspirováno Indiana Jones
- Viditelné varování (jiná barva dlaždice) na nižší obtížnosti

### 8. 🎒 Inventář & použitelné předměty
- Hráč může nosit až 3 lékárničky a použít je klávesou
- Nový předmět: **Dynamit** — odpálí blok zdi na dálku (max 2 ks)
- HUD ikonky inventáře vpravo dole

### 9. 🧱 Tajné stěny (Secret Walls)
- Speciální kamenné zdi, které vypadají normálně, ale jsou interaktivní
- Za tajnou stěnou může být skrytá místnost s bonusovým pokladem nebo klíčem
- Editor: tile "Secret Wall" v paletě, vizuálně rozlišený jen v editoru

### 10. 🎬 Mezi-levelové obrazovky & příběh
- Krátká textová obrazovka mezi levely (místo přímého přechodu)
- Zobrazí: název dalšího levelu, skóre za aktuální level, čas průchodu
- Postupně se odkrývající příběh o záhadách starých dolů (několik řádků textu)

### 15. ⚔️ Systém zbraní (Weapon System)
- **First-person view zbraně** — krumpáč viditelný z pohledu hráče, animace máchnutí při útoku
- **Krumpáč** (výchozí) — melee, neomezené použití, stávající mechanika
- **Válečný krumpáč / Kladivo** — silnější melee zbraň (2× damage, pomalejší swing), pickup
- **Kuše** — ranged hit-scan, poškodí prvního nepřítele v linii; omezená munice (šipky jako pickup)
- **Dynamit** — vhozený objekt, po 2 s exploduje, poškodí vše v poloměru a rozbije dřevěné zdi; omezené zásoby
- Přepínání zbraní klávesami `1–4`; HUD indikátor zvolené zbraně + munice
- Nové SFX pro každou zbraň; pickupy munice/zbraní jako entity v mapě

### 16. 🏹 Ranged nepřátelé
- **Skeleton Archer** — střílí šípové projektily po hráči, pomalá kadence, nízké HP
- **Mine Goblin** — hází kameny / výbušniny, střední kadence, uhýbá
- Projektily jako pohybující se entity s kolizí (ray-vs-sprite nebo AABB)
- Nové textury v `textures.js`, nové SFX v `audio.js`

### 17. 👹 Boss nepřátelé
- Speciální `T.BOSS_*` typy v `entities.js` — vysoké HP, unikátní vzory útoku
- 3–4 různí bossové (jeden na konci každé kampaně):
  - **Mine Foreman** — velký melee boss, nabíhá + ground slam
  - **Crystal Golem** — krystalový obr, střílí krystalové střepy, odolný proti melee
  - **Shadow Wraith** — ghostový boss, teleportuje se, AoE dark wave
  - **Deep Dweller** — finální boss, kombinace melee + ranged + summon minions
- Větší sprite generovaný v `textures.js` (2× standardní výška)
- Boss HP bar v `drawHUD`; vítězná fanfára po porážce

### 18. 🗺️ Kampaňový systém (Campaign System)
- Inspirováno Wolf3D (6 epizod) — Mine Raider bude mít **4 kampaně** (epizody)
- Každá kampaň = 5–8 levelů s vlastním vizuálním tématem a postupně rostoucí obtížností
- Kampaň 1: Opuštěný důl (stávající levely — tutorial)
- Kampaň 2: Zaplavené šachty (nové tile typy? water floor)
- Kampaň 3: Krystalové jeskyně (crystal heavy, golem boss)
- Kampaň 4: Prokleté hlubiny (nejtěžší, finální boss)
- Každá kampaň končí boss fightem
- Menu výběru kampaně; progress persistovaný v localStorage

---

## 💡 Further Considerations

Nápady v ranější fázi nebo vyžadující větší diskusi:

| Nápad | Poznámka |
|---|---|
| **Pushwalls** (Wolf3D Easter egg) | Speciální zeď, která se dá posunout — odkryje tajnou chodbu |
| **Multiplayer (local co-op)** | Dva hráči na jedné klávesnici (split-screen) — velmi náročné na renderer |
| **WebSocket multiplayer** | Node.js server jako game server, 2–4 hráči online — velký projekt |
| **Mobilní ovládání** | On-screen joystick a tlačítka pro touch zařízení |
| **Exportovat / importovat mapy jako JSON** | Tlačítko v editoru stáhne `.json` soubor, nebo nahraje existující |
| **Steam-style achievementy** | Lokální odznaky (první zlatý, 100 nepřátel, žádné poškození, apod.) |
| **Baterie svítilny** | Svítilna má omezenou výdrž — dobíjí se u pochodeň-triggerů; přidá strategické rozhodování |
| **Minimap editor overlay** | Při editaci velké mapy (128×128) zobrazit minimapu v rohu editoru |
| **Level editor – undo/redo** | `Ctrl+Z` / `Ctrl+Y` pro editační historii tahů |
| **Různé druhy podlah / stropů** | Tile-based floor/ceiling s textúrami (water, lava, dirt) |

---

## 🗓️ Navrhované pořadí implementace

```
Sprint 1 ✅ (hotovo):
  → #1  Svítilna / dynamické osvětlení
  → #6  High score (localStorage, per-difficulty best score)

Sprint 2 ✅ (hotovo):
  → #3  Výbušné sudy
  → #13 Ambientní soundtrack
  → #7  Automap / Fog of War

Sprint 3 (zbraně):
  → #15 Systém zbraní (first-person view, krumpáč, kladivo, kuše, dynamit)

Sprint 4 (nepřátelé & pasti):
  → #16 Ranged nepřátelé (Skeleton Archer, Mine Goblin)
  → #4  Pasti (spike trap, rolling boulder)

Sprint 5 (polishing & příběh):
  → #10 Mezi-levelové obrazovky
  → #9  Tajné stěny
  → #8  Inventář

Sprint 6 (endgame):
  → #17 Boss nepřátelé (4 bossové)
  → #18 Kampaňový systém (4 epizody po 5–8 levelech)
  → Rozšíření high score / achievementy
```

---

## 📝 Poznámky k architektuře

- Všechny nové tile typy přidat do `config.js` (konstanta `T`) + `TILE_LABEL_KEYS` + `TILE_COLORS`
- Nové entity implementovat jako třídu v `entities.js` se standardním rozhraním (`update`, `getSprite`)
- Nové textury a sprite generátory patří do `textures.js` (pozor na duplicitní `spriteGenerators` deklaraci — ověřeno opraveno)
- Nové tlačítko palety editoru → `editor.js` funkce `buildButtons()`
- i18n klíče pro nové tile/UI → `i18n.js` (obě jazykové varianty CZ + EN)

---

*Dokument je volně upravitelný — přidej ✅ u hotových položek, nebo doplň nové nápady do sekce "Further Considerations".*
