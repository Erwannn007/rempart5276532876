# Rempart — fusion et défense

Tower defense / merge en PWA pour iPhone (portrait), entièrement en français.
Tout le jeu tient dans `index.html` (HTML + CSS + JS vanilla dans une IIFE, aucune dépendance, aucun build).

## Fichiers
- `index.html` — le jeu complet (~5500 lignes).
- `sw.js` — service worker cache-first. **Incrémenter `CACHE` (`rempart-merge-td-vNN`) à chaque modification livrée**, sinon l'iPhone garde l'ancienne version.
- `manifest.json`, `icon-*.png` — PWA.

## Carte de `index.html` (sections `/* ===== Titre ===== */`)
Réglages → `<SPRITES>` (classe `Spr`, soldats, ennemis, boss, variantes, décors, Légendes 24×24) → Données de jeu (`TYPES`, `EN`, `WORLDS`, `BIOMES`, `SYN`, `BLESS`, `LEGENDS`) → Rendu des sprites en canvas (`pxCanvas`, `patt`, caches `SPR`/`ENS`/`LSPR`) → état/sauvegarde (`freshGame`, `snap`, `persist`, `load`, clé `localStorage` `rempart-merge-td`, format `v:3`) → stats/synergies → terrain et chemins → audio (SFX WebAudio) → Canvas & décor (`renderBG`) → vagues → bénédictions → combat → boucle `update`/`frame` → Dessin → Interface DOM → Profil/accueil/succès → musique chiptune → météo → ultimes des Légendes → cycle de vie.

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
