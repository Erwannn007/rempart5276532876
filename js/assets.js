'use strict';

/* =========================================================
   Rendu des sprites en canvas
   ========================================================= */
function pxCanvas(o, mode){
  const c = document.createElement('canvas'); c.width = o.w; c.height = o.h;
  const x = c.getContext('2d'), id = x.createImageData(o.w, o.h);
  for (let i=0;i<o.px.length;i++){
    const col = o.px[i]; if (!col) continue;
    let [r,g,b] = hex2(col);
    if (mode==='frost'){ r = r*.5+110*.5; g = g*.5+200*.5; b = b*.5+255*.5; }
    else if (mode==='flash'){ r = r*.3+255*.7; g = g*.3+255*.7; b = b*.3+255*.7; }
    else if (mode==='sil'){ [r,g,b] = col===OUT ? [14,10,6] : [52,40,28]; }
    id.data[i*4]=r; id.data[i*4+1]=g; id.data[i*4+2]=b; id.data[i*4+3]=255;
  }
  x.putImageData(id,0,0);
  return c;
}
function patt(rows, map, shaded){
  const w = Math.max(...rows.map(r => r.length));
  const s = new Spr(w+2, rows.length+2);
  rows.forEach((row,y) => [...row].forEach((ch,x) => { if (map[ch]) s.p(x+1, y+1, map[ch], shaded ? ch==='W' : 1); }));
  return s.pixels();
}
const SPR = [], SIL = [], URL_ = [];
for (let t=0;t<5;t++){
  SPR[t]=[]; SIL[t]=[]; URL_[t]=[];
  for (let l=1;l<=MAXL;l++){
    const o = troopPixels(t,l);
    SPR[t].push(pxCanvas(o)); SIL[t].push(pxCanvas(o,'sil'));
    URL_[t].push(SPR[t][l-1].toDataURL());
  }
}
const LSPR = {}, LSIL = {}, LURL = {};
for (const id of LEG_ORDER){
  LSPR[id] = []; LSIL[id] = []; LURL[id] = [];
  for (let l=1;l<=5;l++){ const o = legendPixels(id,l); const c = pxCanvas(o); LSPR[id].push(c); LURL[id].push(c.toDataURL()); LSIL[id].push(pxCanvas(o,'sil').toDataURL()); }
}
const ENS = {};
for (const k of EN_ORDER){
  const o = enemyPixels(k);
  ENS[k] = { w:o.w, h:o.h, n:pxCanvas(o), frost:pxCanvas(o,'frost'), flash:pxCanvas(o,'flash') };
  ENS[k].url = ENS[k].n.toDataURL(); ENS[k].sil = pxCanvas(o,'sil').toDataURL();
}
const ICON = {
  heart: patt(['.RR.RR.','RWRRRRR','RRRRRRR','.RRRRR.','..RRR..','...R...'], {R:'#d9443c',W:'#ffb3a8'}),
  coin:  patt(['.GGGG.','GYWYDG','GYYYDG','GYYYDG','GYYDDG','.GGGG.'], {G:'#a86d16',Y:'#f6c94a',D:'#e0a12e',W:'#fff3c4'}),
  flag:  patt(['PRRRR.','PRRWRR','PRRRR.','P.....','P.....','P.....'], {P:'#d8c7a8',R:'#c4473d',W:'#f3e7cc'}),
  star:  patt(['.....Y.....','....YYY....','....YWY....','YYYYYWYYYYY','.YYYYYYYYY.','..YYYYYYY..','..YYY.YYY..','.YYY...YYY.','.YY.....YY.'], {Y:'#f6c94a',W:'#fff3c4'}, true)
};
const ICONC = {}; for (const k in ICON) ICONC[k] = pxCanvas(ICON[k]);
const COIN_URL = ICONC.coin.toDataURL(), STAR_URL = ICONC.star.toDataURL();
document.getElementById('icHeart').src = ICONC.heart.toDataURL();
document.getElementById('icCoin').src = COIN_URL;
document.getElementById('icCoin2').src = COIN_URL;
document.getElementById('icFlag').src = ICONC.flag.toDataURL();

/* ---------- icônes des bénédictions ---------- */
const IC = { M:'#c3cbd3', L:'#8e99a4', W:'#ffffff', G:'#e0a93a', Y:'#f6c94a', B:'#7a4a2a', K:'#2b2b33', R:'#c8473d',
  C:'#aeeeff', S:'#8f8a80', D:'#6b665b', P:'#e8dcc0', V:'#5aa04a', O:'#ff8a2a', N:'#7fe3ff' };
const BI_ROWS = {
  sword:   [['.........MW','........MWM','.......MWM.','......MWM..','.....MWM...','..G.MWM....','...GWM.....','...BG......','..BBGG.....','.BB...G....','BB.........']],
  arrow:   [['.......MMM.','........WM.','.......B.M.','......B....','.....B.....','....B......','R..B.......','.RB........','RRR........','.R.........']],
  bomb:    [['........O..','.......Y.O.','......B....','....KKB....','..KKKKKK...','.KKWKKKKK..','.KWKKKKKK..','KKKKKKKKKK.','KKKKKKKKKK.','.KKKKKKKK..','..KKKKKK...'], {K:'#3a3a46'}],
  snow:    [['.....C.....','...C.C.C...','....CWC....','.C..CWC..C.','..C..C..C..','CCWWCWCWWCC','..C..C..C..','.C..CWC..C.','....CWC....','...C.C.C...','.....C.....']],
  bolt:    [['.....YYYY..','....YYYY...','...YYYY....','..YYYY.....','.YYYYYYYY..','....YYYW...','...YYYY....','..YYY......','.YY........','.Y.........']],
  coin:    [['...GGGGG...','..GYYYYYG..','.GYYWYYYYG.','.GYWYYYYDG.','.GYYYYYYDG.','.GYYYYYYDG.','.GYYYYYDDG.','..GYDDDDG..','...GGGGG...'], {D:'#e0a12e'}],
  coins:   [['...GGGGGG..','..GYYWYYYG.','...GGGGGG..','.GGGGGG....','GYYWYYYG...','.GGGGGG....','..GGGGGG...','.GYYWYYYG..','..GGGGGG...']],
  chest:   [['.BBBBBBBBB.','BRRRRRRRRRB','BRRWRRRRRRB','BBBBBGBBBBB','BRRRRGRRRRB','BRRRRRRRRRB','BRRRRRRRRRB','BBBBBBBBBBB'], {R:'#a0602f', B:'#5a3a22'}],
  wall:    [['S.S.S.S.S.S','SSSSSSSSSSS','SWSSSDSSSDS','SSSSSSSSSSS','SSDSSSSSDSS','SSSSKKKSSSS','SSSKKKKKSSS','SSSKKKKKSSS','SSSKKKKKSSS']],
  gate:    [['SSSSSSSSSSS','SKKKKKKKKKS','SLKLKLKLKLS','SLKLKLKLKLS','SLLLLLLLLLS','SLKLKLKLKLS','SLKLKLKLKLS','SLLLLLLLLLS','SLKLKLKLKLS','SMKMKMKMKMS']],
  potion:  [['...BBB...','...PPP...','...CPC...','..CRRRC..','.CRRRRRC.','CRWRRRRRC','CRWRRRRRC','CRRRRRRRC','.CRRRRRC.','..CCCCC..'], {C:'#bfe4f0'}],
  horn:    [['.........GG','.......GGYG','.....GGYYG.','...GGYYG...','.GGYYGG....','GGYGG......','GYG........','BB.........','.B.........']],
  spyglass:[['.........BB','........BMB','.......BMB.','......GMG..','.....GLG...','....BLB....','...BLB.....','..GLG......','.BLB.......','BWB........','BB.........']],
  hourglass:[['BBBBBBBBB','.C.....C.','.CYYYYYC.','..CYYYC..','...CYC...','...CYC...','..C.Y.C..','.C..Y..C.','.CYYYYYC.','BBBBBBBBB']],
  chain:   [['.LLL.......','L...L......','L...LLLL...','L...L...L..','.LLLL...L..','....L...L..','.....LLL...'], {L:'#c3cbd3'}],
  hill:    [['....VVV....','..VVWVVVV..','.VVWVVVVVD.','VVVVVVVVVDD','VVVVVVVVDDD'], {D:'#3f6a30'}],
  rune:    [['..SSSSS..','.SSSNSSS.','SSNSNSNSS','SSSNNNSSS','SSSSNSSSS','SSSSNSSSS','.SSSNSSS.','..SSSSS..'], {S:'#7d7a86'}],
  star:    [['.....Y.....','....YYY....','....YWY....','YYYYYWYYYYY','.YYYYYYYYY.','..YYYYYYY..','..YYY.YYY..','.YYY...YYY.','.YY.....YY.']],
  drop:    [['....R....','....R....','...RRR...','..RRRRR..','.RRWRRRR.','.RWRRRRR.','.RRRRRRR.','..RRRRR..','...RRR...'], {R:'#b8202a'}],
  crit:    [['Y....Y....Y','.Y...Y...Y.','..Y.YYY.Y..','...YYWYY...','YYYYWWWYYYY','...YYWYY...','..Y.YYY.Y..','.Y...Y...Y.','Y....Y....Y']],
  merge:   [['C.........C','CC.......CC','.CC.....CC.','..CC...CC..','...CCWCC...','....CCC....','.....Y.....','....YYY....','...YYWYY...','....YYY....','.....Y.....']],
  scroll:  [['.BB.......','BPPPPPPPP.','.BPKKKKKP.','..PPPPPPP.','..PKKKKKP.','..PPPPPPP.','..PKKKP.P.','..PPPPPPPB','.......BB.']],
  helm:    [['....R....','...RRR...','..LLLLL..','.LMMMMML.','.LMWMMML.','.LKKMKKL.','.LMMMMML.','.LM...ML.']],
  banner:  [['P..........','PRRRRRRR...','PRRWRRRRR..','PRRRRRRRR..','PRRRRRRR...','P..........','P..........','P..........','P..........'], {P:'#d8c7a8'}]
};
const BI = {};
for (const k in BI_ROWS){ const [rows, over] = BI_ROWS[k]; BI[k] = pxCanvas(patt(rows, Object.assign({}, IC, over || {}), true)).toDataURL(); }
function blessIcon(key){
  const { b, p } = blessInfo(key);
  if (b.icon === 'troop') return URL_[p][1];
  if (b.icon === 'goblin') return ENS.goblin.url;
  return BI[b.icon];
}

/* ---------- pièges et atelier : sprites ---------- */
function trapPics(){
  const s = new Spr(), m = '#c3cbd3', w = '#eef4f8', b = '#5a3d26';
  s.r(3,13,15,3,b); s.hl(4,16,13,'#7a5434',1);
  for (const x0 of [3,7,11,15]){
    if (x0 + 2 > 17) continue;
    s.p(x0+1,7,w,1); s.p(x0+1,8,m); s.hl(x0,x0+2,9,m); s.r(x0,10,3,3,m); s.p(x0,10,w,1);
  }
  return s.pixels();
}
function trapTar(){
  const s = new Spr(), k = '#1e1a22', sh = '#4a4458';
  s.hl(6,13,7,k); s.hl(4,15,8,k); s.r(3,9,14,5,k); s.hl(4,15,14,k); s.hl(6,12,15,k); s.p(16,15,k);
  s.hl(6,8,9,sh,1); s.p(5,10,sh,1); s.p(12,12,'#3a3446',1); s.p(14,10,'#3a3446',1);
  return s.pixels();
}
function trapBarrel(){
  const s = new Spr(), wd = '#8a5a32', dk = '#6b4422', hp = '#8e99a4';
  s.hl(7,12,5,'#a8742a'); s.r(6,6,8,10,wd); s.hl(7,12,16,wd);
  s.v(8,7,15,dk,1); s.v(11,7,15,dk,1);
  s.hl(6,13,8,hp); s.hl(6,13,14,hp);
  s.r(7,10,6,3,'#b8202a'); s.p(8,11,'#ffffff',1); s.p(10,11,'#ffffff',1); s.p(12,11,'#ffffff',1);
  s.p(10,4,dk); s.p(11,3,dk);
  return s.pixels();
}
function trapFrost(){
  const s = new Spr();
  for (let y=0;y<T;y++) for (let x=0;x<T;x++){
    const dx = (x-9.5)/7.5, dy = (y-11)/5.8, q = dx*dx+dy*dy;
    if (q < 1) s.p(x, y, q > .7 ? '#3f5a78' : '#5a7a96', q <= .7 ? 1 : 0);
  }
  for (const [x,y] of FROST_GLYPH) s.p(x, y, '#aeeeff', 1);
  return s.pixels();
}
const FROST_GLYPH = [[9,7],[9,8],[9,9],[9,10],[9,11],[9,12],[9,13],[9,14],[10,7],[10,14],[6,10],[7,10],[8,10],[11,10],[12,10],[13,10],[7,8],[12,8],[7,13],[12,13],[8,9],[11,9],[8,12],[11,12]];

const TRAPS = {
  pics:   { name:'Pics',            base:20, per:2, desc:'Blessent chaque ennemi qui passe dessus, à 60 % de la vie d’un gluant de la vague.' },
  goudron:{ name:'Goudron',         base:15, per:2, desc:'Les ennemis y avancent deux fois moins vite.' },
  baril:  { name:'Baril de poudre', base:30, per:3, desc:'Explose au passage du premier ennemi et souffle tout le groupe autour.' },
  givre:  { name:'Rune de givre',   base:35, per:3, desc:'Fige les ennemis proches dès qu’on marche dessus. Se recharge en 6 s.' }
};
const TRAP_ORDER = ['pics','goudron','baril','givre'];
const TRAPC = { pics:pxCanvas(trapPics()), goudron:pxCanvas(trapTar()), baril:pxCanvas(trapBarrel()), givre:pxCanvas(trapFrost()) };
const TRAP_URL = {}; for (const k in TRAPC) TRAP_URL[k] = TRAPC[k].toDataURL();
const LAND = {
  dyn:   { name:'Dynamiter',                 base:50,  step:30, desc:'Fait sauter un rocher ou un arbre. La case redevient de l’herbe.' },
  hill:  { name:'Élever une colline',        base:80,  step:50, desc:'Sur l’herbe, même sous un soldat : il gagne +0,6 de portée.' },
  marsh: { name:'Creuser un marais',         base:60,  step:40, desc:'Sur une case d’herbe libre, chemin compris. Les ennemis y avancent 30 % moins vite.' },
  rune:  { name:'Graver une pierre runique', base:140, step:90, desc:'Sur l’herbe, même sous un soldat : il gagne +30 % de dégâts.' }
};
const LAND_ORDER = ['dyn','hill','marsh','rune'];
const BAR_URL = pxCanvas(patt(['B.B.B.B','BBBBBBB','DDDDDDD','BBBBBBB','BBBBBBB','DDDDDDD','BBBBBBB','B.B.B.B'], { B:'#8a5a32', D:'#5a3a22' }, true)).toDataURL();
const SHOP_IC = {
  dynamite: pxCanvas(patt(['......YO','.....B..','....B...','RRRRRRR.','RWRRWRR.','RRRRRRR.','KKKKKKK.','RRRRRRR.','RWRRWRR.','RRRRRRR.'], Object.assign({}, IC, { R:'#c8473d', K:'#3a2a1a' }), true)).toDataURL(),
  marsh:    pxCanvas(patt(['...V.......','...V..V....','.B.V..V....','CCCCCCCCCC.','CWCCCCCWCC.','CCCCCCCCCC.','.CCCCCCCC..'], Object.assign({}, IC, { C:'#4c8186', W:'#7fb3b0', V:'#6b8a3a', B:'#6b4428' }), true)).toDataURL(),
  hammer:   pxCanvas(patt(['.LLLLL...','LMMMMML..','LMWMMML..','.LLLBLL..','....B....','....B....','....B....','....B....','....B....'], Object.assign({}, IC, { B:'#8a5a32' }), true)).toDataURL()
};
const LAND_URL = { dyn:SHOP_IC.dynamite, hill:BI.hill, marsh:SHOP_IC.marsh, rune:BI.rune };
document.getElementById('icHammer').src = SHOP_IC.hammer;
