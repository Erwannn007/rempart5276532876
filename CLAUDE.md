# Rempart — fusion et défense

Tower defense / merge en PWA pour iPhone (portrait), entièrement en français.
HTML + CSS + JS vanilla, aucune dépendance, aucun build : on pousse sur `main`, GitHub Pages sert le jeu tel quel.
Dépôt : `git@github.com:Erwannn007/rempart5276532876.git` — chaque push sur `main` est en ligne.

## Fichiers
- `index.html` — uniquement le balisage (HUD, canvas, fenêtres `.ov`) + les `<script>` dans l'ordre.
- `style.css` — tout le CSS.
- `js/*.js` — scripts classiques (pas de modules) qui partagent la portée globale. **L'ordre de chargement compte** : le code exécuté au chargement ne peut utiliser que ce qui est déclaré dans un fichier précédent (les fonctions appelées plus tard, en jeu, peuvent être n'importe où).
  1. `config.js` — réglages (`STORE_KEY`, `COLS`/`ROWS`, `WALL`, `BENCH_N`)
  2. `sprites.js` — classe `Spr`, soldats, ennemis, boss, variantes, décors, Légendes 24×24
  3. `data.js` — `TYPES`, `EN`, `WORLDS`, `BIOMES`, `SYN`, `BLESS`, `LEGENDS`
  4. `assets.js` — rendu des sprites en canvas (`pxCanvas`, `patt`, caches `SPR`/`ENS`/`LSPR`, icônes)
  5. `game.js` — état et sauvegarde (`freshGame`, `snap`, `persist`, `load`, clé `localStorage` `rempart-merge-td`, format `v:3`), synergies, terrain, réseau de routes
  6. `audio.js` — effets sonores WebAudio
  7. `background.js` — canvas et décor (`resize`, `renderBG`)
  8. `waves.js` — vagues, fin de partie, bénédictions
  9. `combat.js` — ciblage, tirs, projectiles, boucle `update`/`frame`
  10. `render.js` — dessin des troupes, ennemis, effets
  11. `ui.js` — interface DOM (emplacements, glisser-déposer, fiche, atelier, boutons)
  12. `home.js` — profil, portraits, succès, écran d'accueil, carte des mondes
  13. `music.js` — musique chiptune
  14. `weather.js` — météo d'ambiance
  15. `ultimates.js` — ultimes des Légendes
  16. `main.js` — cycle de vie et démarrage (doit rester en dernier)
- Chaque fichier commence par `'use strict';`. Ne pas déclarer de nom global qui existe déjà sur `window` (`name`, `top`, `close`, `open`, `stop`, `find`…).
- `sw.js` — service worker cache-first. **Incrémenter `CACHE` (`rempart-merge-td-vNN`) à chaque modification livrée**, sinon l'iPhone garde l'ancienne version. **Tout nouveau fichier doit être ajouté à `ASSETS`**, sinon le jeu ne marche plus hors ligne.
- `manifest.json`, `icon-*.png` — PWA.

## Direction artistique pixel art — À RESPECTER
- **Tout est dessiné en code**, pixel par pixel, avec la classe `Spr` : `s.p(x,y,c,flat)`, `s.r(x,y,w,h,c,f)`, `s.hl(x0,x1,y,c,f)`, `s.v(x,y0,y1,c,f)`, `sline(...)`, `recolor(s,map)`. Pas d'images externes, pas d'emoji dans le jeu.
- Grille de base `T = 20` (sprites 20×20). Légendes et boss moyens 24×24, grands boss jusqu'à 28×27 (`NEW_EN_SIZE`).
- `pixels()` applique automatiquement : contour `OUT = '#1a1320'`, ombre bas/droite (×0.76), lumière haut/gauche (×1.16). Passer `flat=1` pour les pixels qui ne doivent pas être ombrés (yeux, reflets, gemmes, glyphes).
- Palette partagée : peau `SK/SKD`, yeux `EYE`, `GOLD`, `GEM`, `HAIR`, métaux `MET` (cuir → fer → acier → or → ivoire) par rang 1–5.
- Rangs 6–8 (mythril / obsidienne / céleste) = rang 5 recoloré via `TIER_MAP` + quelques pixels d'effet. Nouvelles couleurs du rang 5 → les ajouter à `TIER_MAP`.
- Variantes d'ennemis par monde = `VARIANTS` (base + table de recoloration), plutôt qu'un nouveau dessin.
- Icônes UI : `patt([...lignes...], {lettre:couleur})`.
- Rendu : `image-rendering: pixelated`, échelle entière `P`, positions multiples de `P`. Animations « pixel » (bob d'1 px, clignotements par paliers), pas de lissage.
- UI : panneaux bois (`.plank`, `.btn`), bordures 3 px `--edge`, ombres internes, `border-radius:0`, police condensée `--font`. Couleurs via les variables `:root` (`--wood`, `--gold`, `--ink`, `--dim`…).

## Conventions de code
- Style compact existant : fonctions courtes sur une ligne quand c'est possible, noms courts (`S` état, `tw` troupe, `e` ennemi, `B` stats ennemi, `M`/`MODS` modificateurs), commentaires de section en français.
- Nouveau contenu = étendre les tables de données (`EN`, `EN_ORDER`, `NEW_EN_DRAW`, `LEGENDS` + `LEGEND_DRAW`, `BLESS`, `WORLDS`, `BIOMES`…) plutôt que du code spécial.
- Tout ajout à l'état persistant doit passer par `snap()` / `load()` et rester compatible avec les anciennes sauvegardes.
- Textes joueur en français soigné (apostrophes typographiques `’`, espaces avant `%`).
- Cible : Safari iOS, tactile, safe-areas (`--st`, `--sb`…), 60 fps sur iPhone.

## Équilibrage
- Courbe de base : `waveHP`/`HPG` (vie par vague), `RECRUIT.at` (niveau des recrues), `K_ENEMY`/`KE_RAMP` (coups des ennemis), `DMUL` (dégâts par niveau).
- Menace adaptative (`THREAT` dans `js/waves.js`) : après chaque vague dès la vague 5, `S.threat` monte si l'ennemi le plus avancé est resté loin de la porte, et baisse en cas de fuites. Elle multiplie la vie des ennemis (et leurs coups par sa racine). Bornes : Sans fin ×0,75 à ×50, Histoire ×1 à ×1,5, Siège non concerné. Sauvegardée dans `snap()`/`load()`.
