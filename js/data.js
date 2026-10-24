'use strict';

/* =========================================================
   Données de jeu
   ========================================================= */
const TYPES = [
  { name:'Épéiste',       col:'#c4473d', range:1.35, dmg:11, rate:.55,
    ranks:['Écuyer','Soldat','Chevalier','Paladin','Roi-lame','Chevalier de mythril','Seigneur d’obsidienne','Lame céleste'],
    desc:'Frappe au contact, très vite.' },
  { name:'Archère',       col:'#5a9a4c', range:2.9,  dmg:6,  rate:.7,
    ranks:['Braconnière','Chasseuse','Tireuse d’élite','Rôdeuse','Reine des flèches','Archère de mythril','Chasseresse d’obsidienne','Archère céleste'],
    desc:'Tire de très loin.' },
  { name:'Artificier',    col:'#d9822b', range:2.2,  dmg:12, rate:1.5, splash:.7,
    ranks:['Apprenti','Sapeur','Pétardier','Maître-poudre','Grand artificier','Artificier de mythril','Forgeron d’obsidienne','Tonnerre céleste'],
    desc:'Lance des bombes qui touchent tout un groupe.' },
  { name:'Mage de givre', col:'#3f7fcf', range:2.2,  dmg:3,  rate:1.0,
    ranks:['Novice','Givrier','Mage de glace','Archimage','Seigneur de l’hiver','Mage de mythril','Givre d’obsidienne','Hiver céleste'],
    desc:'Ralentit les ennemis qu’il touche.' },
  { name:'Foudroyeur',    col:'#7a58c9', range:2.4,  dmg:7,  rate:1.25,
    ranks:['Étincelle','Orageux','Fulminant','Tempétueux','Avatar de foudre','Foudre de mythril','Orage d’obsidienne','Foudre céleste'],
    desc:'Son éclair rebondit d’ennemi en ennemi.' },
  { name:'Gardien nain',  col:'#3a8a8a', range:1.1,  dmg:5,  rate:1.0,
    ranks:['Mineur','Porte-bouclier','Gardien','Brise-fer','Roi sous la montagne','Gardien de mythril','Rempart d’obsidienne','Bastion céleste'],
    desc:'Le seul soldat qui se poste sur la route. Les monstres au sol butent sur lui et doivent l’abattre pour passer.' },
  { name:'Pyromancienne', col:'#d8364e', range:2.3,  dmg:6,  rate:1.1,
    ranks:['Allumeuse','Brandon','Pyromancienne','Cœur de braise','Reine des cendres','Flamme de mythril','Brasier d’obsidienne','Soleil céleste'],
    desc:'Ses boules de feu embrasent le chemin : tout ce qui marche dans les flammes brûle.' },
  { name:'Catapulte',     col:'#a0703c', range:3.6,  dmg:26, rate:3.0, splash:1.0, minRange:1.3,
    ranks:['Fronde','Mangonneau','Catapulte','Trébuchet','Brise-remparts','Trébuchet de mythril','Catapulte d’obsidienne','Foudre des cieux'],
    desc:'Artillerie : portée énorme et grosse explosion, mais lente, et aveugle tout près d’elle.' },
  { name:'Myconide',      col:'#c9b04a', range:1.3,  dmg:5,  rate:1.2,
    ranks:['Pousse','Champignon','Myconide','Vieux-chapeau','Roi des spores','Myconide de mythril','Spore d’obsidienne','Champignon céleste'],
    desc:'Souffle des spores qui empoisonnent tout autour. Quand on le frappe, il en relâche un nuage.' },
  { name:'Baliste',       col:'#7a8a9a', range:3.2,  dmg:20, rate:2.2,
    ranks:['Arbalète lourde','Scorpion','Baliste','Baliste de siège','Perce-titans','Baliste de mythril','Baliste d’obsidienne','Lance céleste'],
    desc:'Son carreau traverse tous les monstres alignés, volants compris.' },
  { name:'Paladine',      col:'#f0e2a8', range:1.4,  dmg:10, rate:.8,
    ranks:['Novice','Écuyère','Paladine','Lame de l’aube','Championne solaire','Paladine de mythril','Aube d’obsidienne','Sainte céleste'],
    desc:'Frappe d’une lumière sacrée que la magie noire n’arrête pas. Les morts-vivants la craignent.' },
  { name:'Fauconnier',    col:'#7aa0c0', range:2.8,  dmg:7,  rate:.9,  air:true,
    ranks:['Oiseleur','Fauconnier','Maître-fauconnier','Chasseur des cimes','Seigneur des serres','Fauconnier de mythril','Serre d’obsidienne','Aigle céleste'],
    desc:'Son faucon fond d’abord sur les volants, et attrape même les fantômes intangibles.' },
  { name:'Hallebardier',  col:'#3a4a9a', range:2.0,  dmg:13, rate:1.0,
    ranks:['Piquier','Hallebardier','Garde suisse','Capitaine des piques','Rempart vivant','Hallebardier de mythril','Pique d’obsidienne','Garde céleste'],
    desc:'Sa hallebarde perce l’armure et tous les monstres alignés derrière sa cible.' },
  { name:'Assassin',      col:'#a03a8a', range:1.5,  dmg:9,  rate:.5,
    ranks:['Tire-laine','Lame furtive','Assassin','Ombre mortelle','Maître des ombres','Assassin de mythril','Lame d’obsidienne','Ombre céleste'],
    desc:'Frappe le monstre le plus affaibli, en coups critiques, et achève les blessés. Les monstres ne la voient pas.' },
  { name:'Sorcière du marais', col:'#5a3a6a', range:2.4, dmg:4, rate:1.2, air:true,
    ranks:['Rebouteuse','Jeteuse de sorts','Sorcière','Mère des crapauds','Reine du marais','Sorcière de mythril','Maléfice d’obsidienne','Sorcière céleste'],
    desc:'Change régulièrement un monstre en crapaud : lent, fragile, et il ne frappe plus.' },
  { name:'Druide',        col:'#9ac83a', range:2.2, dmg:4,  rate:1.4,
    ranks:['Cueilleur','Druide','Gardien des chênes','Cerf-esprit','Cœur de la forêt','Druide de mythril','Ronce d’obsidienne','Druide céleste'],
    desc:'Fait pousser des ronces sur le chemin : elles ralentissent et empoisonnent tout ce qui passe.' },
  { name:'Troll des cavernes', col:'#5a7a6a', range:1.3, dmg:14, rate:1.3,
    ranks:['Trollot','Troll','Troll des cavernes','Brise-os','Roi des cavernes','Troll de mythril','Troll d’obsidienne','Colosse céleste'],
    desc:'Sa massue repousse les monstres en arrière sur le chemin. Il se régénère sans cesse.' },
  { name:'Chasseur de primes', col:'#8a3a2a', range:2.6, dmg:8, rate:1.0, air:true,
    ranks:['Traqueur','Chasseur','Chasseur de primes','Tueur à gages','Seigneur des primes','Chasseur de mythril','Traqueur d’obsidienne','Chasseur céleste'],
    desc:'Marque le monstre le plus coriace : tous tes soldats lui font plus de dégâts, et sa mort rapporte une prime.' },
  { name:'Prêtresse',     col:'#c8d8f0', range:2.2, dmg:4,  rate:1.0, air:true,
    ranks:['Novice','Sœur','Prêtresse','Grande prêtresse','Voix de l’aube','Prêtresse de mythril','Oracle d’obsidienne','Sainte céleste'],
    desc:'Soigne les soldats autour d’elle, et relève ceux qui tombent.' },
  { name:'Barde',         col:'#e0a0c0', range:2.4, dmg:3,  rate:1.2, air:true,
    ranks:['Ménestrel','Barde','Troubadour','Maître chanteur','Voix des légendes','Barde de mythril','Chant d’obsidienne','Barde céleste'],
    desc:'Ses chansons donnent du cœur à l’ouvrage aux soldats tout autour de lui.' },
  { name:'Horloger',      col:'#d0b080', range:2.0, dmg:5,  rate:1.0,
    ranks:['Apprenti','Horloger','Mécanicien','Maître des rouages','Seigneur du temps','Horloger de mythril','Rouage d’obsidienne','Horloge céleste'],
    desc:'Ses réglages font tirer plus vite les soldats tout autour de lui.' },
  { name:'Banquier gobelin', col:'#d8b040', range:1.8, dmg:2, rate:1.5,
    ranks:['Grippe-sou','Changeur','Banquier','Usurier','Roi de l’or','Banquier de mythril','Trésor d’obsidienne','Banquier céleste'],
    desc:'Se bat à peine, mais remplit ta bourse à chaque vague et sur chaque monstre abattu près de lui.' },
  { name:'Sylvain',       col:'#6a8a3a', range:1.2, dmg:6,  rate:1.2,
    ranks:['Pousse','Sylvain','Vieux-chêne','Chêne-roi','Cœur des bois','Sylvain de mythril','Chêne d’obsidienne','Arbre céleste'],
    desc:'Un arbre vivant qui se poste sur la route : il bloque les monstres au sol, et ses racines ralentissent tout autour.' },
  { name:'Dragonnet',     col:'#e05030', range:2.2, dmg:7,  rate:1.3, air:true,
    ranks:['Œuf éclos','Dragonnet','Jeune dragon','Dragon de braise','Dragon royal','Dragon de mythril','Dragon d’obsidienne','Dragon céleste'],
    desc:'Crache son feu en cône. Le seul à se percher sur les rochers et les arbres, où il voit plus loin.' },
  { name:'Nécromancien',  col:'#b8b0a0', range:2.3, dmg:5,  rate:1.1, air:true,
    ranks:['Fossoyeur','Nécromant','Nécromancien','Seigneur des os','Roi des morts','Nécromancien de mythril','Ossuaire d’obsidienne','Liche céleste'],
    desc:'Les monstres tués près de lui se relèvent en squelettes alliés, qui remontent le chemin en frappant tout sur leur passage.' },
  { name:'Ingénieur',     col:'#6a8aa8', range:2.0, dmg:6,  rate:1.0,
    ranks:['Bricoleur','Ingénieur','Artilleur','Maître d’œuvre','Génie militaire','Ingénieur de mythril','Génie d’obsidienne','Ingénieur céleste'],
    desc:'À chaque vague, pose gratuitement des barils explosifs sur la route à sa portée.' }
];
/* Familles : deux voisins de la même famille (et de types différents) se renforcent. */
const FAM = {
  garnison:{ name:'Garnison', col:'#e8dcc0', fx:{dmg:.1},           txt:'+10 % de dégâts' },
  montagne:{ name:'Montagne', col:'#c3cbd3', fx:{dmg:.08, hp:.15},  txt:'+8 % de dégâts, +15 % de vie' },
  arcane:  { name:'Arcane',   col:'#bfa8ff', fx:{rate:.1},          txt:'+10 % de cadence' },
  machine: { name:'Machine',  col:'#d9a066', fx:{range:.3},         txt:'+0,3 de portée' },
  sylve:   { name:'Sylve',    col:'#9ed36a', fx:{dmg:.06, rate:.06},txt:'+6 % de dégâts et de cadence' }
};
['garnison','garnison','montagne','arcane','arcane','montagne','arcane','machine','sylve','machine','garnison','sylve','garnison','sylve','arcane','sylve','montagne','garnison','garnison','sylve','machine','montagne','sylve','arcane','arcane','machine'].forEach((f,t) => { TYPES[t].fam = f; });
[1,3,4,6,9].forEach(t => { TYPES[t].air = true; });
const MAXL = 8;
const DMUL = [1, 2.2, 4.8, 10.5, 23, 50, 108, 235];
const RMUL = [1, .94, .88, .82, .76, .72, .68, .64];
const EN = {
  slime:   { name:'Gluant',        hp:1,   spd:1.0, gold:2,   dmg:1,  col:'#79c25b', desc:'Lent et mou. Il vient en nombre.' },
  wolf:    { name:'Loup',          hp:.55, spd:1.9, gold:2,   dmg:1,  col:'#8b8f9c', desc:'Fragile, mais il file à toute allure.' },
  golem:   { name:'Golem',         hp:3.4, spd:.62, gold:5,   dmg:2,  col:'#8f897c', desc:'Un bloc de pierre qui encaisse beaucoup.' },
  bigslime:{ name:'Gros gluant',   hp:2.0, spd:.8,  gold:4,   dmg:2,  col:'#3fae8f', split:['mini',2], desc:'Quand on le crève, il se coupe en deux petits gluants.' },
  mini:    { name:'Petit gluant',  hp:.4,  spd:1.3, gold:1,   dmg:1,  col:'#3fae8f', desc:'Né d’un gros gluant. Petit et pressé.' },
  goblin:  { name:'Gobelin d’or',  hp:.45, spd:2.7, gold:30,  dmg:0,  col:'#e0a93a', desc:'Rare et très rapide. S’il passe le rempart, il s’enfuit avec son or.' },
  boss:    { name:'Seigneur noir', boss:true, hint:'Le seigneur noir approche', hp:26,  spd:.45, gold:40,  dmg:6,  col:'#b33a3a', desc:'Revient toutes les dix vagues, toujours plus fort.' },
  skeleton:{ name:'Squelette',     hp:.8,  spd:1.15,gold:2,  dmg:1,  col:'#e8e2d0', desc:'Un soldat d’os qui ne sait plus mourir. Plus rapide qu’un gluant.' },
  spider:  { name:'Araignée',      hp:.35, spd:1.8, gold:1,  dmg:1,  col:'#3a2a4a', desc:'Petite, rapide, et jamais seule.' },
  bat:     { name:'Chauve-souris', hp:.4,  spd:2.1, gold:2,  dmg:1,  col:'#4a3a5a', fly:true, desc:'Elle vole : ni pièges, ni marais, ni goudron ne l’arrêtent.' },
  orc:     { name:'Orc à bouclier',hp:1.7, spd:.8,  gold:4,  dmg:2,  col:'#6a8a3a', armor:.6, desc:'Son bouclier réduit de 40 % les flèches, les coups et les sorts. Les explosions et la foudre passent.' },
  shaman:  { name:'Chaman gobelin',hp:1.2, spd:.9,  gold:4,  dmg:1,  col:'#7fae4a', heal:.05, desc:'Soigne les monstres autour de lui (mais ni lui-même, ni les autres soigneurs). À abattre en premier.' },
  ghost:   { name:'Fantôme',       hp:.9,  spd:1.1, gold:3,  dmg:1,  col:'#dfe8f4', phase:[3,1.2], desc:'Devient intouchable par moments.' },
  beetle:  { name:'Scarabée',      hp:2,   spd:.9,  gold:3,  dmg:1,  col:'#2f6a5a', noSlow:true, desc:'Sa carapace l’immunise contre le ralentissement et l’étourdissement.' },
  imp:     { name:'Diablotin',     hp:.7,  spd:1.4, gold:3,  dmg:1,  col:'#c8402a', blink:4, desc:'Disparaît et réapparaît un peu plus loin sur le chemin.' },
  head:    { name:'Tête d’hydre',  hp:1.2, spd:1.2, gold:3,  dmg:1,  col:'#3f8a4a', desc:'Quand on tranche l’Hydre, ses têtes repoussent et filent seules.' },
  dragon:  { name:'Dragon de braise', boss:true, hp:20, spd:.55, gold:50, dmg:6, col:'#b8322a', fly:true, blink:5, hint:'Il vole et bondit en avant', desc:'Il survole les pièges et bondit en avant toutes les 5 s.' },
  lich:    { name:'Liche',            boss:true, hp:18, spd:.4,  gold:50, dmg:6, col:'#7cff8a', summon:['skeleton',2,5], hint:'Elle relève les morts', desc:'Relève deux squelettes toutes les 5 s.' },
  kraken:  { name:'Kraken des marais',boss:true, hp:24, spd:.38, gold:50, dmg:6, col:'#8a3a6a', regen:.015, hint:'Il se régénère sans cesse', desc:'Se régénère sans cesse, trois fois plus vite dans le marais.' },
  titan:   { name:'Titan de pierre',  boss:true, hp:30, spd:.3,  gold:60, dmg:8, col:'#6e6a64', armorAll:.6, noSlow:true, hint:'Rien ne le ralentit', desc:'Encaisse tous les coups à 60 %, et ne se laisse ni ralentir ni étourdir.' },
  queen:   { name:'Reine des araignées', boss:true, hp:18, spd:.42, gold:50, dmg:6, col:'#5a2a6a', summon:['spider',2,3], hint:'Elle pond sans arrêt', desc:'Lâche deux araignées toutes les 3 s.' },
  mino:    { name:'Minotaure',        boss:true, hp:22, spd:.45, gold:50, dmg:6, col:'#6a4228', enrage:true, hint:'Blessé, il charge', desc:'Sous la moitié de sa vie, il charge presque deux fois plus vite.' },
  wraith:  { name:'Spectre hurleur',  boss:true, hp:18, spd:.5,  gold:50, dmg:6, col:'#7fe3ff', phase:[3,1.5], hint:'Il devient intouchable', desc:'Devient intouchable 1,5 s toutes les 4,5 s.' },
  hydra:   { name:'Hydre',            boss:true, hp:18, spd:.4,  gold:50, dmg:6, col:'#3f8a4a', split:['head',3], hint:'Ses têtes repoussent', desc:'À sa mort, trois têtes s’en détachent et continuent la route.' },
  vampire: { name:'Comte vampire',    boss:true, hp:20, spd:.5,  gold:50, dmg:6, col:'#9a1a2a', bats:6, hint:'Il se change en nuée', desc:'Sous 40 % de sa vie, il se change en nuée de chauves-souris.' },
  warlord: { name:'Chef de guerre orc', boss:true, hp:22, spd:.42, gold:50, dmg:6, col:'#5a7a2a', heal:.04, armorAll:.8, hint:'Il soigne sa horde', desc:'Soigne les monstres autour de lui et encaisse mieux les coups.' },
  slime_moss:  Object.assign({}, { hp:1, spd:1.0, gold:2, dmg:1 }, { name:'Gluant moussu', col:'#3f8a6a', desc:'Un gluant qui a trop traîné sous les fougères.' }),
  slime_mud:   { name:'Gluant de vase', hp:1.1, spd:.9, gold:2, dmg:1, col:'#7a6a3a', desc:'Lourd et collant, il traîne la vase avec lui.' },
  slime_sand:  { name:'Gluant des sables', hp:1, spd:1.1, gold:2, dmg:1, col:'#d9b86a', desc:'Sec et nerveux, il file sur le sable chaud.' },
  slime_ice:   { name:'Gluant de givre', hp:1.2, spd:.9, gold:2, dmg:1, col:'#8fd0f0', desc:'À moitié gelé, il encaisse un peu mieux.' },
  slime_ember: { name:'Gluant de braise', hp:1, spd:1.15, gold:2, dmg:1, col:'#e0602a', desc:'Il fume, il crépite, il fonce.' },
  slime_shadow:{ name:'Gluant d’ombre', hp:1.3, spd:1, gold:3, dmg:1, col:'#5a3a7a', desc:'Né au pied du Trône noir.' },
  wolf_black:  { name:'Loup noir', hp:.6, spd:2, gold:2, dmg:1, col:'#3a3640', desc:'Il chasse dans le noir, plus vite que ses cousins gris.' },
  wolf_white:  { name:'Loup blanc', hp:.7, spd:1.9, gold:2, dmg:1, col:'#e8eef4', noSlow:true, desc:'Le froid ne lui fait rien : impossible de le ralentir.' },
  wolf_war:    { name:'Loup de guerre', hp:1, spd:1.8, gold:3, dmg:1, col:'#8a6a4a', armor:.7, desc:'Harnaché par les orcs, il encaisse mieux les flèches et les coups.' },
  golem_ice:   { name:'Golem de glace', hp:3.6, spd:.6, gold:5, dmg:2, col:'#9fc8e0', noSlow:true, desc:'Un bloc de glace vivante, insensible au froid.' },
  golem_lava:  { name:'Golem de lave', hp:3.4, spd:.68, gold:5, dmg:2, col:'#ff6a2a', regen:.01, desc:'La lave qui coule en lui referme ses blessures.' },
  toad:        { name:'Crapaud géant', hp:1.3, spd:.8, gold:3, dmg:1, col:'#6a8a3a', blink:3, desc:'Il bondit d’un coup sur le chemin toutes les 3 s.' },
  scorpion:    { name:'Scorpion', hp:1.4, spd:1.1, gold:3, dmg:1, col:'#c86a2a', armorAll:.75, desc:'Sa carapace absorbe un quart de chaque coup.' },
  mummy:       { name:'Momie', hp:3, spd:.6, gold:4, dmg:2, col:'#e8dcc0', regen:.012, desc:'Lente, mais ses bandelettes se resserrent sur ses blessures.' },
  yeti:        { name:'Yéti', hp:3.5, spd:.75, gold:5, dmg:2, col:'#eef2f6', noSlow:true, desc:'Une montagne de fourrure que rien ne ralentit.' },
  ghoul:       { name:'Goule', hp:1.1, spd:1.3, gold:3, dmg:1, col:'#7a8a6a', enrage:true, desc:'Blessée, elle se jette en avant presque deux fois plus vite.' },
  hydra_sand:  { name:'Hydre des sables', boss:true, hp:20, spd:.42, gold:60, dmg:6, col:'#c8a050', split:['head',3], hint:'Ses têtes repoussent', desc:'La cousine du désert : à sa mort, trois têtes s’en détachent.' },
  titan_ice:   { name:'Titan de givre', boss:true, hp:32, spd:.3, gold:70, dmg:8, col:'#9fc8e0', armorAll:.6, noSlow:true, hint:'Rien ne le ralentit', desc:'Un titan de glace : il encaisse tout à 60 % et ignore le froid.' },
  king:    { name:'Roi Gluant',    boss:true, hp:60,  spd:.3,  gold:200, dmg:20, col:'#3fae8f', split:['bigslime',4], desc:'Le maître du siège. À sa mort, il se répand en quatre gros gluants.' }
};
const RES = {
  golem:{armor:.3}, golem_ice:{armor:.4}, golem_lava:{armor:.4}, orc:{armor:.5}, wolf_war:{armor:.3, armorAll:0}, beetle:{armor:.5},
  scorpion:{armor:.4, armorAll:0}, yeti:{armor:.2}, mino:{armor:.2}, boss:{armor:.3}, titan:{armor:.4, armorAll:.75}, titan_ice:{armor:.4, armorAll:.75},
  warlord:{armor:.4, armorAll:0}, ghost:{mres:.5}, wraith:{mres:.5}, imp:{mres:.5}, lich:{mres:.4}, shaman:{mres:.4}, vampire:{mres:.3},
  slime_shadow:{mres:.3}, kraken:{mres:.3}, dragon:{mres:.3}, mummy:{mres:.3}
};
for (const k in RES) Object.assign(EN[k], RES[k]);
Object.assign(EN.orc, { desc:'Un mur de muscles derrière un grand bouclier.' });
Object.assign(EN.scorpion, { desc:'Sa carapace arrête une bonne partie des coups physiques.' });
Object.assign(EN.titan, { desc:'Lourdement cuirassé, insensible au froid, il encaisse tout.' });
Object.assign(EN.titan_ice, { desc:'Un titan de glace lourdement cuirassé, qui ignore le froid.' });
Object.assign(EN.wolf_war, { desc:'Harnaché par les orcs, il encaisse mieux les coups physiques.' });
const TYPE_DT = ['phys','phys','boom','magic','magic','phys','magic','boom','poison','phys','holy','phys','sunder','phys','magic','poison','phys','phys','holy','magic','phys','phys','phys','magic','magic','phys'];
/* Combat au contact : certains monstres s'arrêtent pour frapper les soldats voisins du chemin.
   Un soldat à zéro est KO jusqu'à la fin de la vague. */
const ATK = { wolf:.5, skeleton:.6, golem:1.2, orc:1, wolf_war:.8, ghoul:1, yeti:1.2, golem_ice:1.2, golem_lava:1.3, mummy:.9, scorpion:.9, beetle:.7, imp:.6, head:.8,
  boss:2.5, titan:3, titan_ice:3, warlord:2, mino:2, hydra:2, hydra_sand:2, kraken:2, vampire:2, dragon:2, lich:1.5, queen:1.5, wraith:1.5, king:3 };
for (const k in ATK) if (EN[k]) EN[k].atk = ATK[k];
const HPT = [3, 1.2, 1.6, 1.1, 1.1, 5, 1.1, 1.6, 2.2, 1.4, 2.4, 1.2, 1.8, 1.2, 1.1, 1.3, 4, 1.4, 1.4, 1.1, 1.3, 1.2, 4.5, 1.4, 1.2, 1.3], LEG_HPT = 2.4;
/* Gardien nain : posté sur la route, il arrête les monstres au sol. Armure, riposte (niv. 4+), coup de bouclier (niv. 6+). */
const WARD_T = 5;
const WARD = { armor:[.2,.25,.3,.35,.4,.45,.5,.55], thorns:[0,0,0,.3,.35,.4,.45,.5], bashCd:6, bashStun:.8, recruit:1, taunt:.5 };
const isWarden = tw => !!tw && tw.t === WARD_T && !tw.leg;
/* Bloqueurs de route : le gardien nain et le sylvain. */
const isBlocker = tw => !!tw && !tw.leg && (tw.t === WARD_T || tw.t === 22);
const wardArmor = tw => Math.min(.8, WARD.armor[tw.l-1] + (tw.syn ? tw.syn.armor : 0));
const wardThorns = tw => WARD.thorns[tw.l-1] + (tw.syn ? tw.syn.thorns : 0);
let K_SOLDIER = 40, K_ENEMY = .25;
const troopMax = tw => (tw.leg ? LEG_HPT : HPT[tw.t]) * (tw.leg ? LMUL : DMUL)[tw.l-1] * K_SOLDIER * (1 + (tw.syn ? tw.syn.hp : 0)) * (isWarden(tw) ? MODS.wardHp : 1);
const troopHp = tw => tw.hp == null ? troopMax(tw) : tw.hp;
function findPrey(e){
  const c0 = Math.floor(e.x), r0 = Math.floor(e.y); let best = -1, bd = 1.1;
  for (let r=r0-1;r<=r0+1;r++) for (let c=c0-1;c<=c0+1;c++){
    if (c<0||r<0||c>=COLS||r>=ROWS) continue;
    const j = idx(c,r), tw = S.board[j]; if (!tw || tw.ko || (tw.t === 13 && !tw.leg)) continue;
    const d = Math.hypot(c + .5 - e.x, r + .5 - e.y) - (isBlocker(tw) ? WARD.taunt : 0); if (d < bd){ bd = d; best = j; }
  }
  return best;
}
function hurtTroop(j, dmg, from){
  const tw = S.board[j]; if (!tw || tw.ko) return;
  if (tw.t === 22 && !tw.leg) dmg *= 1 - SPEC.sylvArmor;
  if (isWarden(tw)){
    dmg *= 1 - wardArmor(tw);
    const th = wardThorns(tw);
    if (th > 0 && from && !from.dead){ const pv = hitDT; hitDT = 'phys'; hit(from, dmg*th); hitDT = pv; }
  }
  if (tw.t === 8 && !tw.leg && !(tw.ab > 0)){ tw.ab = 1.5; sporeCloud(tw, j%COLS + .5, ((j/COLS)|0) + .5, stats(tw, j).dmg, stats(tw, j).range); }
  tw.hp = troopHp(tw) - dmg; tw.hurtT = 0; tw.hitFx = .15;
  const cx = j%COLS + .5, cy = ((j/COLS)|0) + .5;
  burst(cx, cy - .2, '#e0523f', 3, 1.4);
  if (tw.hp <= 0){
    tw.hp = 0; tw.ko = true; koCount++;
    fx.push({ k:'t', x:cx, y:cy - .7, s:'KO', col:'#ff7a62', life:1, max:1, big:true });
    burst(cx, cy, '#8a8a8a', 10, 2); sfx('ko');
    if (sel && sel.k === 'b' && sel.i === j) closeSheet();
  }
}
let koCount = 0, spawnHP = 0;
function reviveAll(){ for (const tw of S.board.concat(S.bench)) if (tw){ tw.hp = null; tw.ko = false; tw.hurtT = 0; tw.rez = 0; } }
const DT_NAME = { phys:'physiques', boom:'explosifs (ignorent la moitié de l’armure)', magic:'magiques', poison:'de poison (ignorent l’armure et la résistance magique)', holy:'sacrés (ignorent la résistance magique, doublés contre les morts-vivants)', sunder:'perforants (ignorent l’armure)' };
const UNDEAD = new Set(['skeleton','ghost','mummy','ghoul','lich','wraith','vampire']);
/* Spécialistes : seuils et bonus par niveau. */
const SPEC = { flyMul:3, execute:[.15,.15,.15,.2,.2,.22,.24,.26], assaCrit:[.25,.25,.25,.35,.35,.4,.45,.5], palaHeal:.02,
  hexCd:[8,7.5,7,6.5,6,5.5,5,4.5], hexDur:3, druidT:5, trollPush:[.6,.65,.7,.8,.85,.9,1,1.1], trollRegen:.02, huntCd:4, huntMul:[.25,.25,.25,.35,.35,.4,.45,.5],
  heal:[.03,.03,.035,.04,.045,.05,.055,.06], rez:[0,0,0,1,1,2,2,2], bardAura:[.08,.1,.12,.14,.16,.18,.2,.22], sleepCd:9, sleepDur:[2.5,2.5,2.5,2.5,3,3.5,4,4.5],
  clockAura:[.06,.08,.1,.12,.14,.16,.18,.2], rewindCd:[0,0,0,16,14,12,10,8], bankWave:[4,7,11,16,22,30,40,52], bankKill:[1,1,1,2,2,2,3,3],
  sylvSlow:[.25,.25,.28,.32,.35,.38,.4,.42], sylvRegen:.03, sylvArmor:.1, perchRange:.6, perchDmg:.2,
  skelCap:[2,2,3,3,4,4,5,6], skelLife:[5,5,5.5,6,6.5,7,7.5,8], mines:[1,1,1,2,2,3,3,3] };
const canHitAir = t => !!TYPES[t].air;
function resText(B){
  const r = [];
  if (B.armor) r.push('Armure : −' + Math.round(B.armor*100) + ' % de dégâts physiques');
  if (B.mres) r.push('Résistance magique : −' + Math.round(B.mres*100) + ' %');
  if (B.fly) r.push('Volant : l’Épéiste et l’Artificier ne peuvent pas l’atteindre');
  return r.join('. ');
}
const EN_ORDER = ['slime','wolf','golem','bigslime','mini','goblin','skeleton','spider','bat','orc','shaman','ghost','beetle','imp','head','slime_moss','slime_mud','slime_sand','slime_ice','slime_ember','slime_shadow','wolf_black','wolf_white','wolf_war','golem_ice','golem_lava','toad','scorpion','mummy','yeti','ghoul','boss','hydra_sand','titan_ice','dragon','lich','kraken','titan','queen','mino','wraith','hydra','vampire','warlord','king'];
const BOSS_POOL = ['boss','dragon','lich','kraken','titan','queen','mino','wraith','hydra','vampire','warlord'];
const BOSS_ALL = BOSS_POOL.concat('king');
const WORLDS = [
  { name:'Forêt sombre',    waves:10, biome:3, off:0, gold:40,  base:'slime_moss',   mobs:['wolf_black','spider','bat','skeleton'], finals:['queen'] },
  { name:'Marais putride',  waves:15, biome:4, off:1, gold:55,  base:'slime_mud',    mobs:['toad','bigslime','shaman','bat','skeleton'], finals:['kraken'] },
  { name:'Désert brûlant',  waves:20, biome:5, off:2, gold:70,  base:'slime_sand',   mobs:['scorpion','beetle','mummy','imp','spider'], finals:['hydra_sand'] },
  { name:'Pics gelés',      waves:25, biome:2, off:3, gold:85,  base:'slime_ice',    mobs:['wolf_white','golem_ice','yeti','bat','beetle'], finals:['titan_ice'] },
  { name:'Cimetière hanté', waves:30, biome:6, off:4, gold:100, base:'skeleton',     mobs:['ghost','ghoul','bat','spider','slime_shadow','mummy'], finals:['lich','vampire'] },
  { name:'Volcan',          waves:35, biome:7, off:5, gold:115, base:'slime_ember',  mobs:['imp','golem_lava','wolf_black','bat','scorpion','beetle'], finals:['dragon'] },
  { name:'Citadelle orque', waves:40, biome:8, off:6, gold:130, base:'wolf_war',     mobs:['orc','shaman','golem','skeleton','imp','ghoul'], finals:['warlord'] },
  { name:'Trône noir',      waves:40, biome:9, off:8, gold:150, base:'slime_shadow', mobs:['orc','ghost','yeti','mummy','golem_lava','ghoul','imp','wolf_war'], finals:['boss','king'] }
];
const maxWaves = () => S.mode === 'siege' ? SIEGE_WAVES : S.mode === 'story' ? WORLDS[S.world|0].waves : Infinity;
const finiteMode = () => S.mode === 'siege' || S.mode === 'story';
const MONSTER_UNLOCK = [['wolf',4],['golem',6],['bigslime',7],['skeleton',8],['bat',12],['spider',10],['orc',12],['beetle',13],['shaman',14],['ghost',16],['imp',18]];

const TER = { GRASS:0, ROCK:1, HILL:2, MARSH:3, RUNE:4, TREE:5 };
const WALK  = [1,0,0,1,0,0];
const BUILD = [1,0,1,0,1,0];
const TER_WHY = ['', 'Impossible de bâtir sur un rocher', '', 'Impossible de bâtir dans le marais', '', 'Impossible de bâtir sur un arbre'];
const HILL_RANGE = .6, RUNE_DMG = .3, MARSH_SLOW = .3, SIEGE_WAVES = 20;
const RUNE_GLYPH = [[10,7],[10,8],[10,9],[10,10],[10,11],[10,12],[10,13],[9,8],[8,7],[11,8],[12,7],[9,12],[11,12]];

const BIOMES = [
  { name:'Prairie', g:['#4a7b39','#457335'], gd:['#3f6a30','#3b642d'], gl:['#5a8c45','#558641'], tuft:['#6aa04f','#5e9449'],
    fl:['#f0d65c','#eaa6c0'], stem:'#2f5426', dirt:['#a77b4e','#996e44','#bb8f5f','#c9a77a'], edge:['#6d4c30','#86603d'], peb:['#cdb089','#8a6440'],
    leaf:'#3f7e3a', leafL:'#62a64f', trunk:'#6b4428', pine:false, snow:false, rock:'#8d8a83', moss:'#5d8a3c',
    water:['#3f6f73','#4c8186','#7fb3b0'], mud:'#4d5a3a', reed:'#6b8a3a', pad:'#4f8f3a', hill:['#62a04c','#82bd63','#355c29'] },
  { name:'Automne', g:['#7d7b3c','#767338'], gd:['#6a6731','#64612e'], gl:['#918e4a','#8a8745'], tuft:['#a99a4c','#988a42'],
    fl:['#d9692b','#e6b23a'], stem:'#4a4520', dirt:['#a0714a','#936641','#b4855a','#c49c72'], edge:['#654428','#7d5836'], peb:['#c7a77f','#835d3b'],
    leaf:'#c8642b', leafL:'#eb9a3c', trunk:'#5a3a22', pine:false, snow:false, rock:'#8a8378', moss:'#8a7a3a',
    water:['#4a6a5e','#557a6c','#8aa898'], mud:'#5a5230', reed:'#8a7a3a', pad:'#8a8a3a', hill:['#a39a4e','#c2b765','#59562a'] },
  { name:'Hiver', g:['#dfe7ee','#d5dee6'], gd:['#c6d1db','#bfcad5'], gl:['#f3f7fa','#eef3f7'], tuft:['#b4c3d0','#a9b9c7'],
    fl:['#9ec9e8','#c7b8e8'], stem:'#8a9aa8', dirt:['#8d7e70','#827365','#9b8c7e','#b2a598'], edge:['#5f5248','#74665a'], peb:['#c9bfb4','#6a5d52'],
    leaf:'#2f5e48', leafL:'#f4f8fb', trunk:'#5a3a22', pine:true, snow:true, rock:'#96969e', moss:'#f4f8fb',
    water:['#7fb3cf','#94c3dc','#d8eef8'], mud:'#9fb3c2', reed:'#8a9a8a', pad:null, hill:['#eef3f7','#ffffff','#a9b8c6'] },
  { name:'Forêt sombre', g:['#2f4a3a','#2b4436'], gd:['#243a2e','#213629'], gl:['#3f6250','#3a5a4a'], tuft:['#4f7a5a','#456e50'],
    fl:['#7fe3ff','#c8a0ff'], stem:'#1e3024', dirt:['#5a4a3a','#4e4032','#6a5848','#7a6a58'], edge:['#3a2e24','#4a3c2e'], peb:['#8a7a68','#3a2e24'],
    leaf:'#1f3a2e', leafL:'#3f6a50', trunk:'#3a2a20', pine:false, snow:false, rock:'#6a6a70', moss:'#3f6a50',
    water:['#2a3a4a','#34485a','#5a7a8a'], mud:'#1e2a24', reed:'#3a5a3a', pad:'#2f5a3a', hill:['#3a5a46','#4a6e58','#24382c'], tree:'mushroom' },
  { name:'Marais putride', g:['#4a5a2e','#44532a'], gd:['#3a4824','#364420'], gl:['#5a6e3a','#566a36'], tuft:['#6a7a3a','#5e6e34'],
    fl:['#c8d860','#a8c040'], stem:'#2a3418', dirt:['#6a5a3a','#5e5032','#7a6a48','#8a7a58'], edge:['#3e3420','#4e4228'], peb:['#9a8a68','#4a3e28'],
    leaf:'#3a4a24', leafL:'#5a6e34', trunk:'#3a2e1e', pine:false, snow:false, rock:'#6a6a5a', moss:'#4a6a2a',
    water:['#3a4a2a','#4a5a32','#7a8a5a'], mud:'#2a2a18', reed:'#5a6a2a', pad:'#4a6a2a', hill:['#566a36','#6a7e46','#34421e'], tree:'dead', trunkC:'#4a3e2a' },
  { name:'Désert brûlant', g:['#e0c080','#d8b878'], gd:['#c8a868','#c0a060'], gl:['#f0d8a0','#ecd298'], tuft:['#b89858','#a88a4c'],
    fl:['#e05a3a','#f0a040'], stem:'#6a8a3a', dirt:['#b8885a','#a87a4e','#c89868','#d8b080'], edge:['#8a6040','#9a7050'], peb:['#f0e0c0','#8a6a48'],
    leaf:'#5a8a3a', leafL:'#8ab85a', trunk:'#4a6a2a', pine:false, snow:false, rock:'#b89070', moss:'#d8b878',
    water:['#3f8aa0','#4f9ab0','#9fd8e8'], mud:'#c8a060', reed:'#5a8a3a', pad:'#5a8a3a', hill:['#e8c888','#f8e0a8','#b89058'], tree:'cactus' },
  { name:'Cimetière hanté', g:['#4a4a52','#45454c'], gd:['#3a3a42','#36363e'], gl:['#5a5a62','#56565e'], tuft:['#5a6a5a','#4e5e4e'],
    fl:['#e8e0f0','#a08ac8'], stem:'#3a4a3a', dirt:['#5a5048','#4e4640','#6a6058','#7a7068'], edge:['#2e2a26','#3a3530'], peb:['#8a8278','#2e2a26'],
    leaf:'#2a2a30', leafL:'#4a4a52', trunk:'#2a2420', pine:false, snow:false, rock:'#8a8a92', moss:'#5a6a5a',
    water:['#2a2a3a','#34344a','#6a6a8a'], mud:'#24242c', reed:'#4a5a4a', pad:null, hill:['#56565e','#6a6a72','#34343a'], tree:'dead', trunkC:'#2a2420', rockKind:'tomb' },
  { name:'Volcan', g:['#3a2a2a','#352626'], gd:['#2a1e1e','#261b1b'], gl:['#4a3434','#463030'], tuft:['#5a3a2a','#4e3426'],
    fl:['#ff8a2a','#ffd27a'], stem:'#2a1a14', dirt:['#4a3a34','#40322c','#5a4a42','#6a5a50'], edge:['#1e1614','#2a201c'], peb:['#7a6a60','#1e1614'],
    leaf:'#2a2020', leafL:'#4a3a30', trunk:'#1e1614', pine:false, snow:false, rock:'#4a4048', moss:'#ff6a2a',
    water:['#e0501a','#ff7a2a','#ffd27a'], mud:'#2a1414', reed:'#5a2a1a', pad:null, hill:['#4a3838','#5a4646','#2a1e1e'], tree:'dead', trunkC:'#1a1210' },
  { name:'Citadelle orque', g:['#6e6a62','#68645c'], gd:['#5a564e','#56524a'], gl:['#827e76','#7e7a72'], tuft:['#5a6a4a','#4e5e40'],
    fl:['#c8473d','#f2c14e'], stem:'#3a4a2a', dirt:['#8a7458','#7e6a4e','#9a8468','#aa9478'], edge:['#4a3e30','#5a4c3c'], peb:['#b8a888','#4a3e30'],
    leaf:'#5a3a2a', leafL:'#8a5a3a', trunk:'#3a2a1e', pine:false, snow:false, rock:'#8a8680', moss:'#5a6a4a',
    water:['#3a4a5a','#4a5a6a','#8a9aaa'], mud:'#3a3a3a', reed:'#5a6a4a', pad:null, hill:['#7a766e','#928e86','#4e4a44'], tree:'brazier' },
  { name:'Trône noir', g:['#2e2638','#2a2234'], gd:['#221c2a','#1e1826'], gl:['#3e3448','#3a3044'], tuft:['#4a3a5a','#42344e'],
    fl:['#c8a0ff','#ff6a8a'], stem:'#1e1826', dirt:['#4a3a4a','#403240','#5a4a5a','#6a5a6a'], edge:['#1a141e','#261e2a'], peb:['#7a6a7a','#1a141e'],
    leaf:'#2a1e2a', leafL:'#5a3a6a', trunk:'#1a1418', pine:false, snow:false, rock:'#4a4058', moss:'#7a5aa0',
    water:['#3a1a4a','#4a2a5a','#8a5aa0'], mud:'#1a1020', reed:'#4a2a5a', pad:null, hill:['#3a3046','#4a3e58','#221c2a'], tree:'brazier' }
];
const BASE_BIOMES = 3;

/* ---------- synergies de voisinage ---------- */
const SYN = {
  '0-1': { name:'Escorte',             fx:{0:{range:.3}, 1:{dmg:.2}},            txt:{0:'+0,3 de portée', 1:'+20 % de dégâts'} },
  '0-2': { name:'Brèche',              fx:{0:{dmg:.15}, 2:{splash:.2}},          txt:{0:'+15 % de dégâts', 2:'+0,2 de rayon d’explosion'} },
  '0-3': { name:'Lame gelée',          fx:{0:{vsSlow:.35}, 3:{slow:.1}},         txt:{0:'+35 % contre les ennemis ralentis', 3:'+10 % de ralentissement'} },
  '0-4': { name:'Lame chargée',        fx:{0:{zap:.2}, 4:{rate:.15}},            txt:{0:'20 % de chances de lancer un éclair', 4:'+15 % de cadence'} },
  '1-2': { name:'Flèches incendiaires',fx:{1:{dmg:.2}, 2:{dmg:.2}},              txt:{1:'+20 % de dégâts', 2:'+20 % de dégâts'} },
  '1-3': { name:'Pointes de glace',    fx:{1:{arrowSlow:.15}, 3:{range:.3}},     txt:{1:'ses flèches ralentissent de 15 %', 3:'+0,3 de portée'} },
  '1-4': { name:'Ciel d’orage',        fx:{1:{rate:.2}, 4:{range:.3}},           txt:{1:'+20 % de cadence', 4:'+0,3 de portée'} },
  '2-3': { name:'Bombe givrante',      fx:{2:{bombSlow:.25}, 3:{dmg:.15}},       txt:{2:'ses explosions ralentissent de 25 %', 3:'+15 % de dégâts'} },
  '2-4': { name:'Poudre chargée',      fx:{2:{rate:.2}, 4:{dmg:.2}},             txt:{2:'+20 % de cadence', 4:'+20 % de dégâts'} },
  '3-4': { name:'Supraconduction',     fx:{3:{rate:.15}, 4:{vsSlow:.4, chain:1}},txt:{3:'+15 % de cadence', 4:'+40 % contre les ralentis, 1 rebond de plus'} },
  '0-5': { name:'Mur de boucliers',    fx:{0:{dmg:.15}, 5:{hp:.25}},             txt:{0:'+15 % de dégâts', 5:'+25 % de vie'} },
  '1-5': { name:'Couverture',          fx:{1:{rate:.15}, 5:{thorns:.15}},        txt:{1:'+15 % de cadence', 5:'+15 % de riposte'} },
  '2-5': { name:'Enclume',             fx:{2:{dmg:.2}, 5:{dmg:.3}},              txt:{2:'+20 % de dégâts', 5:'+30 % de dégâts'} },
  '3-5': { name:'Rempart de givre',    fx:{3:{slow:.08}, 5:{armor:.1}},          txt:{3:'+8 % de ralentissement', 5:'+10 % d’armure'} },
  '4-5': { name:'Paratonnerre',        fx:{4:{chain:1}, 5:{thorns:.2}},          txt:{4:'1 rebond de plus', 5:'+20 % de riposte'} },
  '3-6': { name:'Choc thermique',      fx:{3:{dmg:.2}, 6:{dmg:.2}},              txt:{3:'+20 % de dégâts', 6:'+20 % de dégâts'} },
  '6-8': { name:'Spores ardentes',     fx:{6:{rate:.15}, 8:{dmg:.25}},           txt:{6:'+15 % de cadence', 8:'+25 % de dégâts'} },
  '2-7': { name:'Poudrière',           fx:{2:{rate:.15}, 7:{splash:.25}},        txt:{2:'+15 % de cadence', 7:'+0,25 de rayon d’explosion'} },
  '1-9': { name:'Tir croisé',          fx:{1:{range:.3}, 9:{rate:.15}},          txt:{1:'+0,3 de portée', 9:'+15 % de cadence'} },
  '5-8': { name:'Tapis de mousse',     fx:{5:{hp:.2}, 8:{dmg:.2}},               txt:{5:'+20 % de vie', 8:'+20 % de dégâts'} },
  '1-11':{ name:'Ciel de chasse',      fx:{1:{range:.2}, 11:{dmg:.25}},          txt:{1:'+0,2 de portée', 11:'+25 % de dégâts'} },
  '5-12':{ name:'Hérisson',            fx:{5:{thorns:.2}, 12:{dmg:.2}},          txt:{5:'+20 % de riposte', 12:'+20 % de dégâts'} },
  '3-13':{ name:'Proie gelée',         fx:{3:{slow:.08}, 13:{vsSlow:.5}},        txt:{3:'+8 % de ralentissement', 13:'+50 % contre les ralentis'} },
  '6-15':{ name:'Feu de forêt',        fx:{6:{dmg:.2}, 15:{dmg:.3}},             txt:{6:'+20 % de dégâts', 15:'+30 % de dégâts'} },
  '14-15':{ name:'Sabbat',             fx:{14:{rate:.15}, 15:{rate:.15}},        txt:{14:'+15 % de cadence', 15:'+15 % de cadence'} },
  '5-16':{ name:'Peuple des cavernes', fx:{5:{hp:.15}, 16:{dmg:.25}},            txt:{5:'+15 % de vie', 16:'+25 % de dégâts'} },
  '13-17':{ name:'Contrat',            fx:{13:{dmg:.2}, 17:{rate:.2}},           txt:{13:'+20 % de dégâts', 17:'+20 % de cadence'} },
  '10-18':{ name:'Foi',                fx:{10:{dmg:.2}, 18:{range:.3}},          txt:{10:'+20 % de dégâts', 18:'+0,3 de portée'} },
  '1-19':{ name:'Ballade',             fx:{1:{rate:.15}, 19:{range:.3}},         txt:{1:'+15 % de cadence', 19:'+0,3 de portée'} },
  '7-20':{ name:'Contrepoids',         fx:{7:{rate:.2}, 20:{dmg:.2}},            txt:{7:'+20 % de cadence', 20:'+20 % de dégâts'} },
  '17-21':{ name:'Recel',              fx:{17:{range:.3}, 21:{dmg:.5}},          txt:{17:'+0,3 de portée', 21:'+50 % de dégâts'} },
  '5-22':{ name:'Racines de pierre',   fx:{5:{armor:.1}, 22:{hp:.25}},           txt:{5:'+10 % d’armure', 22:'+25 % de vie'} },
  '15-22':{ name:'Bosquet',            fx:{15:{range:.3}, 22:{dmg:.3}},          txt:{15:'+0,3 de portée', 22:'+30 % de dégâts'} },
  '6-23':{ name:'Brasier',             fx:{6:{dmg:.2}, 23:{dmg:.2}},             txt:{6:'+20 % de dégâts', 23:'+20 % de dégâts'} },
  '13-24':{ name:'Danse macabre',      fx:{13:{rate:.15}, 24:{range:.3}},        txt:{13:'+15 % de cadence', 24:'+0,3 de portée'} },
  '7-25':{ name:'Génie militaire',     fx:{7:{dmg:.2}, 25:{rate:.2}},            txt:{7:'+20 % de dégâts', 25:'+20 % de cadence'} },
  '5-10':{ name:'Serment d’acier',     fx:{5:{armor:.1}, 10:{dmg:.2}},           txt:{5:'+10 % d’armure', 10:'+20 % de dégâts'} }
};
const FORMATION = .08;
const synKey = (a,b) => a < b ? a+'-'+b : b+'-'+a;
/* Lien entre deux types voisins : formation, paire nommée, ou famille commune (sinon aucun). */
function synLink(a, b){
  if (a === b) return { name:'Formation', col:TYPES[a].col };
  const sy = SYN[synKey(a,b)]; if (sy) return { name:sy.name, col:'#f2c14e', sy };
  const f = TYPES[a].fam; if (f && f === TYPES[b].fam) return { name:FAM[f].name, col:FAM[f].col, fam:f };
  return null;
}

/* ---------- bénédictions ---------- */
const RAR = { c:{ name:'Commune', col:'#b9a684', w:62 }, r:{ name:'Rare', col:'#5ea0e0', w:30 }, l:{ name:'Légendaire', col:'#f2c14e', w:8 } };
const SCHOOL = ['de l’épée','de l’arc','de la poudre','du givre','de la foudre','de la montagne','du feu','du siège','des spores','du carreau','de la lumière','de la fauconnerie','de la pique','de l’ombre','du chaudron','des ronces','des cavernes','de la traque','du temple','de la ballade','des rouages','de la banque','des bois','des dragons','des os','du génie'];
const PLUR = ['épéistes','archères','artificiers','mages de givre','foudroyeurs','gardiens nains','pyromanciennes','catapultes','myconides','balistes','paladines','fauconniers','hallebardiers','assassins','sorcières','druides','trolls','chasseurs de primes','prêtresses','bardes','horlogers','banquiers','sylvains','dragonnets','nécromanciens','ingénieurs'];
const BLESS = [
  { id:'lames', rar:'c', icon:'sword', max:3, name:'Lames affûtées', desc:'Épéistes : +25 % de dégâts.', mod:M => { M.dmgType[0] *= 1.25; } },
  { id:'tourbillon', rar:'r', icon:'sword', name:'Tourbillon', desc:'Les épéistes frappent tous les ennemis à leur portée, à 60 % de leurs dégâts.', mod:M => { M.whirl = true; } },
  { id:'carquois', rar:'c', icon:'arrow', max:3, name:'Carquois profond', desc:'Archères : +20 % de cadence.', mod:M => { M.rateType[1] += .2; } },
  { id:'perforant', rar:'r', icon:'arrow', name:'Flèches perforantes', desc:'Chaque flèche touche aussi l’ennemi le plus proche de sa cible, à 50 %.', mod:M => { M.pierce = true; } },
  { id:'poudre', rar:'c', icon:'bomb', max:3, name:'Poudre noire', desc:'Artificiers : +25 % de dégâts.', mod:M => { M.dmgType[2] *= 1.25; } },
  { id:'fragment', rar:'r', icon:'bomb', name:'Fragmentation', desc:'Chaque bombe projette trois éclats qui explosent autour, à 25 %.', mod:M => { M.frag = true; } },
  { id:'hiver', rar:'c', icon:'snow', max:2, name:'Hiver précoce', desc:'Mages de givre : +8 % de ralentissement, qui dure 0,5 s de plus.', mod:M => { M.slowAdd += .08; M.slowDur += .5; } },
  { id:'gel', rar:'r', icon:'snow', name:'Gel', desc:'Les éclats de givre ont 10 % de chances de figer l’ennemi un instant. Les boss y résistent.', mod:M => { M.freeze = .1; } },
  { id:'conducteur', rar:'c', icon:'bolt', max:3, name:'Conducteur', desc:'L’éclair des foudroyeurs rebondit sur 1 ennemi de plus.', mod:M => { M.chainAdd += 1; } },
  { id:'surcharge', rar:'r', icon:'bolt', name:'Surcharge', desc:'Les éclairs ne perdent plus que 8 % à chaque rebond, au lieu de 20 %.', mod:M => { M.decay = .92; } },
  { id:'ecole', rar:'c', icon:'troop', max:3, name:p => 'École ' + SCHOOL[p], desc:p => 'Les recrues sont bien plus souvent des ' + PLUR[p] + '.', mod:(M,p) => { M.school[p] += 1.7; } },
  { id:'recruteur', rar:'r', icon:'scroll', name:'Sergent recruteur', desc:'Le prix du recrutement monte de 1,5 or au lieu de 2.', mod:M => { M.costInc = 1.5; } },
  { id:'veterans', rar:'r', icon:'helm', name:'Vétérans', desc:'Une recrue sur quatre arrive avec un niveau d’avance sur les autres.', mod:M => { M.vet = .25; } },
  { id:'fusion', rar:'l', icon:'merge', name:'Fusion parfaite', desc:'Une fusion sur huit saute un niveau, à tous les niveaux.', mod:M => { M.skip = .125; } },
  { id:'butin', rar:'c', icon:'coin', max:3, name:'Butin', desc:'Chaque ennemi rapporte 1 or de plus.', mod:M => { M.goldKill += 1; } },
  { id:'tresorier', rar:'c', icon:'coins', max:3, name:'Trésorier', desc:'Bonus de fin de vague : +50 %.', mod:M => { M.waveBonus += .5; } },
  { id:'interets', rar:'r', icon:'coins', name:'Intérêts', desc:'À la fin de chaque vague, gagne 10 % de ton or (25 au plus).', mod:M => { M.interest = true; } },
  { id:'coffre', rar:'c', icon:'chest', max:3, name:'Coffre de guerre', desc:() => 'Reçois ' + (50 + 5*S.wave) + ' or tout de suite.', pick:() => { S.gold += 50 + 5*S.wave; } },
  { id:'primes', rar:'r', icon:'goblin', name:'Chasseur de primes', desc:'Les gobelins d’or viennent trois fois plus souvent et rapportent 50 % de plus.', mod:M => { M.bounty = true; } },
  { id:'maitre', rar:'c', icon:'sword', max:2, name:'Maître d’armes', desc:'Absorber un soldat rapporte 50 % d’expérience en plus.', mod:M => { M.absorbMul += .5; } },
  { id:'barbe', rar:'c', icon:'helm', max:2, name:'Barbe de fer', desc:'Gardiens nains : +30 % de vie.', mod:M => { M.wardHp += .3; } },
  { id:'forteresse', rar:'r', icon:'wall', name:'Forteresse', desc:'Les gardiens nains regagnent 3 % de leur vie par seconde, même sous les coups.', mod:M => { M.wardRegen = .03; } },
  { id:'murailles', rar:'c', icon:'wall', max:3, name:'Murailles renforcées', desc:'+5 vies.', pick:() => { S.lives += 5; } },
  { id:'herse', rar:'r', icon:'gate', name:'Herse', desc:'À chaque vague, le premier ennemi qui atteint le rempart ne te coûte aucune vie.', mod:M => { M.herse = true; } },
  { id:'remedes', rar:'r', icon:'potion', name:'Remèdes', desc:'Chaque vague terminée sans perdre de vie t’en rend une.', mod:M => { M.regen = true; } },
  { id:'cor', rar:'c', icon:'horn', max:3, name:'Cor de guerre', desc:'Tous les soldats : +10 % de dégâts.', mod:M => { M.dmgAll *= 1.1; } },
  { id:'longuevue', rar:'c', icon:'spyglass', max:2, name:'Longue-vue', desc:'Tous les soldats : +0,2 de portée.', mod:M => { M.range += .2; } },
  { id:'frenesie', rar:'r', icon:'hourglass', name:'Frénésie', desc:'Pendant les 6 premières secondes de chaque vague, tous les soldats frappent 25 % plus vite. Ensuite, 10 % plus lentement.', mod:M => { M.frenzy = true; } },
  { id:'fraternite', rar:'r', icon:'chain', name:'Fraternité', desc:'Les bonus de synergie sont augmentés de moitié.', mod:M => { M.synMul = 1.5; } },
  { id:'geomancie', rar:'c', icon:'hill', max:2, name:'Géomancie', desc:'Deux collines surgissent sur le terrain. Un soldat posté dessus gagne +0,6 de portée.', pick:() => addTerrain(TER.HILL, 2), req:() => terrainSpots().length >= 2 },
  { id:'runes', rar:'r', icon:'rune', name:'Runes anciennes', desc:'Une pierre runique apparaît, et le bonus de toutes les pierres double (+60 % de dégâts).', mod:M => { M.runeMul = 2; }, pick:() => addTerrain(TER.RUNE, 1), req:() => terrainSpots().length >= 1 },
  { id:'elite', rar:'l', icon:'star', name:'Élite', desc:'Les soldats de niveau 5 et plus font +40 % de dégâts.', mod:M => { M.elite = 1.4; } },
  { id:'pacte', rar:'l', icon:'drop', name:'Pacte de sang', desc:'Tous les soldats : +35 % de dégâts. En échange, tu perds 5 vies.', mod:M => { M.dmgAll *= 1.35; }, pick:() => { S.lives -= 5; }, req:() => S.lives > 8 },
  { id:'avarice', rar:'r', icon:'chest', name:'Avarice', desc:'Chaque ennemi rapporte 2 or de plus, mais tous ont 15 % de vie en plus.', mod:M => { M.goldKill += 2; M.hpMul *= 1.15; } },
  { id:'commandement', rar:'c', icon:'banner', name:'Commandement', desc:'Les soldats en dessous du niveau 5 font +30 % de dégâts.', mod:M => { M.low = 1.3; } },
  { id:'faucon', rar:'r', icon:'crit', name:'Œil du faucon', desc:'Chaque attaque a 15 % de chances d’infliger deux fois et demie ses dégâts.', mod:M => { M.crit = .15; } }
];

/* ---------- Légendes ---------- */
const LMUL = [4.8, 10.5, 23, 40, 70];
const LEO_CD = [9,8,7,6,5], LEO_STUN = [1,1.2,1.4,1.6,2];
const MERLIN_CD = [16,15,14,12,10], MERLIN_DUR = [1,1.2,1.4,1.6,2];
const CESAR_AURA = [.1,.12,.14,.17,.2], JEANNE_AURA = [.08,.1,.12,.15,.2], ANUBIS_GOLD = [.5,.6,.75,.9,1];
const fr1 = v => v.toFixed(1).replace('.', ',');
const LEGENDS = {
  gengis:   { name:'Gengis Khan', fam:1, kind:'Historique', era:'Mongolie, XIIIe siècle', range:3.1, dmg:6, rate:.6,
    ranks:['Témoudjin','Chef de clan','Khan des steppes','Gengis Khan','Empereur universel'],
    power:l => 'Décoche une volée sur ' + (l>=5 ? 4 : l>=3 ? 3 : 2) + ' cibles. Chaque ennemi tué pendant la vague accélère ses tirs de 2 % (jusqu’à +' + (l===5 ? 50 : 30) + ' %).' },
  cesar:    { name:'Jules César', fam:0, kind:'Historique', era:'Rome, Ier siècle av. J.-C.', range:1.45, dmg:12, rate:.55,
    ranks:['Tribun','Légionnaire','Général','Consul','Imperator'],
    power:l => 'Aura de commandement : les soldats sur les 8 cases autour de lui font +' + Math.round(CESAR_AURA[l-1]*100) + ' % de dégâts.' + (l===5 ? ' Rapporte 25 or à chaque vague repoussée.' : ' Au niveau 5, il rapportera de l’or à chaque vague.') },
  alexandre:{ name:'Alexandre le Grand', fam:0, kind:'Historique', era:'Macédoine, IVe siècle av. J.-C.', range:1.6, dmg:16, rate:.9,
    ranks:['Prince de Macédoine','Hétaïre','Roi de Macédoine','Fils d’Amon','Conquérant du monde'],
    power:l => 'Sa charge transperce tous les ennemis alignés derrière sa cible, sur ' + (l>=4 ? 3 : 2) + ' cases. Dégâts doublés contre les boss.' },
  leonidas: { name:'Léonidas', fam:0, kind:'Historique', era:'Sparte, Ve siècle av. J.-C.', range:1.4, dmg:12, rate:.55,
    ranks:['Élève de l’agogé','Hoplite','Spartiate','Roi de Sparte','Chef des Trois-Cents'],
    power:l => 'Toutes les ' + LEO_CD[l-1] + ' s, son bouclier arrête net sa cible pendant ' + fr1(LEO_STUN[l-1]) + ' s (moitié pour les boss).' },
  jeanne:   { name:'Jeanne d’Arc', fam:4, kind:'Historique', era:'France, XVe siècle', range:2.5, dmg:7, rate:.8,
    ranks:['Bergère de Domrémy','Pucelle','Chef de guerre','Libératrice d’Orléans','Sainte'],
    power:l => 'Les soldats sur les 8 cases autour d’elle frappent ' + Math.round(JEANNE_AURA[l-1]*100) + ' % plus vite. ' + (!livesFree() ? '' : l>=5 ? 'Rend 2 vies à chaque vague repoussée.' : l>=3 ? 'Rend 1 vie à chaque vague repoussée.' : 'Rend 1 vie toutes les deux vagues.') },
  hannibal: { name:'Hannibal', fam:2, kind:'Historique', era:'Carthage, IIIe siècle av. J.-C.', range:1.8, dmg:18, rate:1.6,
    ranks:['Fils d’Hamilcar','Cornac','Général carthaginois','Passeur des Alpes','Terreur de Rome'],
    power:l => 'Son éléphant piétine tous les ennemis autour de sa cible et les étourdit ' + fr1(.3+.1*l) + ' s (pas les boss).' },
  zeus:     { name:'Zeus', fam:4, kind:'Mythologie grecque', era:'Mont Olympe', range:3.4, dmg:30, rate:2.0,
    ranks:['Fils de Cronos','Vainqueur des Titans','Roi de l’Olympe','Maître du ciel','Père des dieux'],
    power:l => 'La foudre tombe sur l’ennemi le plus résistant à portée et frappe aussi ceux qui l’entourent' + (l>=4 ? ', en les étourdissant un instant.' : '. Au niveau 4, elle étourdira.') },
  thor:     { name:'Thor', fam:4, kind:'Mythologie nordique', era:'Ásgard', range:2.6, dmg:12, rate:1.2,
    ranks:['Fils d’Odin','Gardien de Midgard','Porteur de Mjöllnir','Dieu du tonnerre','Tueur de géants'],
    power:l => 'Mjöllnir rebondit sur ' + (2+l) + ' ennemis sans faiblir, puis revient dans sa main.' },
  merlin:   { name:'Merlin', fam:3, kind:'Légende arthurienne', era:'Bretagne', range:2.5, dmg:5, rate:1.0,
    ranks:['Apprenti druide','Barde','Conseiller du roi','Enchanteur','Merlin l’Enchanteur'],
    power:l => 'Ses sorts ralentissent. Toutes les ' + MERLIN_CD[l-1] + ' s, il fige le temps : tous les ennemis du terrain s’arrêtent ' + fr1(MERLIN_DUR[l-1]) + ' s (moitié pour les boss).' },
  anubis:   { name:'Anubis', fam:3, kind:'Mythologie égyptienne', era:'Duat', range:2.4, dmg:8, rate:.8,
    ranks:['Chacal des sables','Gardien des tombes','Peseur des âmes','Seigneur de la nécropole','Dieu des morts'],
    power:l => 'Ses coups ralentissent et marquent les ennemis : s’ils meurent dans les 4 s, ils rapportent +' + Math.round(ANUBIS_GOLD[l-1]*100) + ' % d’or.' },
  hercule:  { name:'Hercule', fam:0, kind:'Mythologie grecque', era:'Thèbes', range:1.4, dmg:22, rate:1.0,
    ranks:['Fils d’Alcmène','Vainqueur du lion','Héros des douze travaux','Porteur des pommes d’or','Demi-dieu'],
    power:l => 'Sa massue écrase tous les ennemis autour de sa cible et les assomme ' + fr1(.2+.1*l) + ' s (pas les boss).' }
};
const LEG_ORDER = Object.keys(LEGENDS);
/* En Sans fin, seules les bénédictions rendent des vies. */
const livesFree = () => !S || S.mode !== 'endless';
const BLESS_BY = Object.fromEntries(BLESS.map(b => [b.id, b]));
/* Bénédictions propres à un type : proposées seulement s'il est dans le deck de la partie. */
const BLESS_TY = { lames:0, tourbillon:0, carquois:1, perforant:1, poudre:2, fragment:2, hiver:3, gel:3, conducteur:4, surcharge:4, barbe:5, forteresse:5 };
function blessInfo(key){ const [id, p] = String(key).split(':'); return { b: BLESS_BY[id], p: p != null ? +p : null }; }
const blessName = key => { const { b, p } = blessInfo(key); return typeof b.name === 'function' ? b.name(p) : b.name; };
const blessDesc = key => { const { b, p } = blessInfo(key); return typeof b.desc === 'function' ? b.desc(p) : b.desc; };

function baseMods(){
  return { dmgAll:1, dmgType:TYPES.map(() => 1), rateType:TYPES.map(() => 0), wardHp:1, wardRegen:0, range:0, chainAdd:0, slowAdd:0, slowDur:0, freeze:0,
    decay:.8, whirl:false, pierce:false, frag:false, costInc:2, vet:0, skip:0, school:TYPES.map(() => 0), goldKill:0,
    waveBonus:1, interest:false, bounty:false, sellMul:1, herse:false, regen:false, frenzy:false, synMul:1,
    elite:1, low:1, crit:0, hpMul:1, runeMul:1, absorbMul:1 };
}
let MODS = baseMods();
const sellValue = (l, xp = 0) => Math.round(5 * ((1 << (l-1)) + xp) * MODS.sellMul);
const troopSell = t => sellValue(t.l, t.xp || 0);
const fmtXp = v => Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ',');
/* Absorption : l'expérience se compte en recrues de niveau 1. Passer du niveau l au niveau l+1 en demande 2^(l-1),
   exactement ce qu'apporterait un jumeau à fusionner. */
const xpNeed = l => 1 << (l-1);
function xpLevel(t){
  while (t.l < MAXL && (t.xp || 0) >= xpNeed(t.l)){ t.xp -= xpNeed(t.l); t.l++; markSeen(t.t, t.l); }
  if (t.l >= MAXL) t.xp = 0;
}
