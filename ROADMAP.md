# ⛏️ Mine Raider – Roadmap

> Živý dokument sledující plánované funkce a nápady pro další rozvoj hry.  
> Poslední aktualizace: **2026-03-28** · verze **0.4.0** · 17 features (8 hotovo, 9 zbývá)

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

---

## 🔝 Plánované features



### 4. 🪤 Pasti (traps)
- **Spike Trap** – dlaždice na zemi, spustí se při přechodu (animovaný overlay na podlaze)
- **Rolling Boulder** – pohybující se objekt po chodbě, inspirováno Indiana Jones
- Viditelné varování (jiná barva dlaždice) na nižší obtížnosti


### 7. 🗺️ Automap (odhalená mapa)
- Navštívené části mapy se ukládají a zobrazují ve zvětšeném mapovém módu (`Tab`)
- Nenavštívené oblasti jsou zakryté tmou (Fog of War)
- Minimap zobrazuje pouze odhalené buňky

### 8. 🎒 Inventář & použitelné předměty
- Hráč může nosit až 3 lékárničky a použít je klávesou `F`
- Nový předmět: **Dynamit** — odpálí blok zdi na dálku (max 2 ks)
- HUD ikonky inventáře vpravo dole

### 9. 🧱 Tajné stěny (Secret Walls)
- Speciální kamenné zdi, které vypadají normálně, ale jsou interaktivní (`E`)
- Za tajnou stěnou může být skrytá místnost s bonusovým pokladem nebo klíčem
- Editor: tile "Secret Wall" v paletě, vizuálně rozlišený jen v editoru

### 10. 🎬 Mezi-levelové obrazovky & příběh
- Krátká textová obrazovka mezi levely (místo přímého přechodu)
- Zobrazí: název dalšího levelu, skóre za aktuální level, čas průchodu
- Postupně se odkrývající příběh o záhadách starých dolů (několik řádků textu)


### 13. 🎵 Ambientní soundtrack dolu
- Loopující procedurální ambientní skladba: nízký dronující oscilátor + filtrovaný šum
- Příležitostné kapky vody / echo tóny generované Web Audio
- Infrastruktura (`AudioContext`, `OscillatorNode`, `GainNode`) je již připravena v `audio.js`
- Modulace hlasitosti/tónu dle aktuálního HP nebo blízkosti nepřítele

### 15. 🏹 Ranged zbraň (Kuše / Dynamit)
- Sekundární zbraň přepínatelná číselnými klávesami vedle pickaxe
- **Kuše** — hit-scan projektil přes `raycaster.js`, poškodí prvního nepřítele v linii
- **Dynamit** — vhozený objekt, po 2 s exploduje, poškodí vše v poloměru a rozbije dřevěné zdi
- Náboje/zásoby jako pickup, nový SFX, HUD indikátor zvolené zbraně

### 16. 👹 Boss nepřítel na finálním levelu
- Speciální `T.BOSS` typ v `entities.js` — vysoké HP, unikátní vzor útoku (nabíhání + ranged projektil)
- Větší sprite generovaný v `textures.js` (2× standardní výška)
- Boss HP bar v `drawHUD` (zobrazí se jen na Level 5)
- Vítězná fanfára v `audio.js` po jeho porážce — dává kampani uspokojivé vyvrcholení

---

## 💡 Further Considerations

Nápady v ranější fázi nebo vyžadující větší diskusi:

| Nápad | Poznámka |
|---|---|
| **Procedurálně generovaná kampaň** | Generátor map + pravidla pro rozmístění nepřátel/pokladů → nekonečný "roguelite" mód |
| **Ranged nepřátelé** | Skeleton Archer / Mine Goblin střílí projektily — vyžaduje ray-vs-sprite kolize |
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

Sprint 2 (gameplay hloubka):
  → #3  Výbušné sudy ✅
  → #4  Pasti

Sprint 3 (polishing & atmosféra):
  → #13 Ambientní soundtrack
  → #7  Automap / Fog of War
  → #10 Příběhové obrazovky

Sprint 4 (zbraně & tajemství):
  → #15 Ranged zbraň (kuše / dynamit)
  → #8  Inventář
  → #9  Tajné stěny

Sprint 5 (endgame & boss):
  → #16 Boss nepřítel (Level 5)
  → Rozšíření high score / achievementy
  → Procedurální kampaň (roguelite mód)
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
