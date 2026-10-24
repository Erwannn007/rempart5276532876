'use strict';

/* =========================================================
   Profil, portraits et écran d'accueil
   ========================================================= */
const RANKS = [[0,'Recrue'],[25,'Sentinelle'],[75,'Sergent'],[150,'Capitaine'],[300,'Commandant'],[600,'Maréchal'],[1000,'Légende du rempart']];
function rankOf(w){ let r = RANKS[0], next = null; for (const k of RANKS){ if (w >= k[0]) r = k; else { next = k; break; } } return { name:r[1], next }; }

/* ---------- portraits 20×20 ---------- */
const PORTRAITS = [];   // { key, url, sil, unlock(), label }
function portraitURL(src, bg, offx, offy){
  const c = document.createElement('canvas'); c.width = 20; c.height = 20;
  const x = c.getContext('2d');
  const top = shade(bg, .62), low = shade(bg, .42);
  for (let y=0;y<20;y++) for (let i=0;i<20;i++){
    let col = y < 11 ? top : low;
    if (y >= 9 && y <= 12 && (i + y) % 2 === 0) col = y < 11 ? low : top;
    x.fillStyle = col; x.fillRect(i, y, 1, 1);
  }
  x.fillStyle = shade(bg, .78);
  for (let k=0;k<6;k++) x.fillRect((k*7 + 3) % 19, (k*5 + 2) % 8, 1, 1);
  x.drawImage(src, offx, offy);
  return c.toDataURL();
}
for (let t=0;t<TYPES.length;t++) for (let l=1;l<=MAXL;l++){
  const o = troopPixels(t,l);
  PORTRAITS.push({ key:`s:${t}:${l}`, label:TYPES[t].ranks[l-1],
    url: portraitURL(SPR[t][l-1], TYPES[t].col, 0, 4),
    sil: portraitURL(pxCanvas(o,'sil'), '#5a4a38', 0, 4),
    unlock: () => l === 1 || seen.has(t*MAXL + l - 1) });
}
for (const id of LEG_ORDER) for (let l=1;l<=5;l++){
  const o = legendPixels(id,l);
  PORTRAITS.push({ key:`l:${id}:${l}`, label:LEGENDS[id].ranks[l-1], legend:id,
    url: portraitURL(LSPR[id][l-1], '#9a7428', -2, 1),
    sil: portraitURL(pxCanvas(o,'sil'), '#5a4a38', -2, 1),
    unlock: () => seenLeg.has(id + ':' + l) });
}
const PORTRAIT_BY = Object.fromEntries(PORTRAITS.map(p => [p.key, p]));
function avatarSprite(key){
  const [k, a, l] = String(key).split(':');
  if (k === 'l' && LSPR[a]) return LSPR[a][(+l||1)-1];
  return SPR[+a || 0][(+l||1)-1];
}

/* ---------- statistiques ---------- */
let pstat = { games:0, waves:0, kills:0, bosses:0, goblins:0, merges:0, offers:0, gold:0, time:0, legPick:{}, traps:0, terra:0, beaten:[], bestStreak:0, ach:[] };
let profile = { name:'Défenseur', avatar:'s:0:1', title:null, cards:[], chests:1 };
const addGold = n => { pstat.gold += n; };
function fmtTime(s){ s = Math.floor(s); const h = Math.floor(s/3600), m = Math.floor(s%3600/60); return h ? h + ' h ' + String(m).padStart(2,'0') : m + ' min'; }
const fmtN = n => Math.floor(n).toLocaleString('fr-FR');


/* ---------- succès et titres ---------- */
function beatBoss(k){ if (!pstat.beaten.includes(k)) pstat.beaten.push(k); }
const anySeenLvl = min => [...seen].some(k => k % MAXL >= min - 1);
const ACH = [
  { id:'gardien', name:'Première garde', desc:'Repousser une vague.', title:'Gardien', icon:() => BI.wall, test:() => pstat.waves >= 1 },
  { id:'tenace', name:'Tenace', desc:'Atteindre la vague 25 en mode sans fin.', title:'Tenace', icon:() => BI.banner, test:() => best >= 25 },
  { id:'inebranlable', name:'Inébranlable', desc:'Atteindre la vague 50 en mode sans fin.', title:'Inébranlable', icon:() => BI.gate, test:() => best >= 50 },
  { id:'immortel', name:'Immortel', desc:'Atteindre la vague 75 en mode sans fin.', title:'Immortel', icon:() => BI.star, test:() => best >= 75 },
  { id:'briseur', name:'Briseur de siège', desc:'Gagner un siège.', title:'Briseur de siège', icon:() => ENS.king.url, test:() => siegeRec.wins >= 1 },
  { id:'rempartvivant', name:'Rempart vivant', desc:'Gagner un siège avec trois étoiles.', title:'Rempart vivant', icon:() => STAR_URL, test:() => siegeRec.stars >= 3 },
  { id:'regicide', name:'Régicide', desc:'Abattre le Roi Gluant.', title:'Tueur de rois', icon:() => ENS.king.url, test:() => pstat.beaten.includes('king') },
  { id:'chasseur', name:'Chasseur de monstres', desc:'Abattre 10 boss.', title:'Chasseur de monstres', icon:() => ENS.dragon.url, test:() => pstat.bosses >= 10 },
  { id:'fleau', name:'Fléau des titans', desc:'Vaincre chacun des 12 boss au moins une fois.', title:'Fléau des titans', icon:() => ENS.titan.url, test:() => BOSS_ALL.every(k => pstat.beaten.includes(k)) },
  { id:'detrousseur', name:'Détrousseur', desc:'Attraper 10 gobelins d’or.', title:'Détrousseur', icon:() => ENS.goblin.url, test:() => pstat.goblins >= 10 },
  { id:'veteran', name:'Vétéran', desc:'Obtenir un soldat de niveau 5.', title:'Vétéran', icon:() => URL_[0][4], test:() => anySeenLvl(5) },
  { id:'celeste', name:'Céleste', desc:'Obtenir un soldat de niveau 8.', title:'Céleste', icon:() => URL_[0][7], test:() => anySeenLvl(8) },
  { id:'invocateur', name:'Invocateur', desc:'Recruter une légende.', title:'Invocateur', icon:() => LURL.cesar[0], test:() => Object.keys(pstat.legPick).length > 0 },
  { id:'mythe', name:'Mythe vivant', desc:'Mener une légende au niveau 5.', title:'Mythe vivant', icon:() => LURL.zeus[4], test:() => LEG_ORDER.some(id => seenLeg.has(id + ':5')) },
  { id:'historien', name:'Historien', desc:'Rencontrer les 11 légendes.', title:'Historien', icon:() => BI.scroll, test:() => LEG_ORDER.every(id => seenLeg.has(id + ':1')) },
  { id:'alchimiste', name:'Alchimiste', desc:'Réussir 500 fusions.', title:'Alchimiste', icon:() => BI.merge, test:() => pstat.merges >= 500 },
  { id:'exterminateur', name:'Exterminateur', desc:'Vaincre 10 000 ennemis.', title:'Exterminateur', icon:() => BI.sword, test:() => pstat.kills >= 10000 },
  { id:'tresorier', name:'Trésor royal', desc:'Avoir 2 000 or en même temps.', title:'Trésorier royal', icon:() => BI.chest, test:() => hasGame && S.gold >= 2000 },
  { id:'ingenieux', name:'Ingénieux', desc:'Poser 50 pièges.', title:'Ingénieux', icon:() => TRAP_URL.pics, test:() => pstat.traps >= 50 },
  { id:'batisseur', name:'Bâtisseur', desc:'Acheter 10 aménagements de terrain.', title:'Bâtisseur', icon:() => BI.hill, test:() => pstat.terra >= 10 },
  { id:'intouchable', name:'Intouchable', desc:'Repousser 20 vagues d’affilée sans perdre de vie.', title:'Intouchable', icon:() => BI.potion, test:() => (pstat.bestStreak|0) >= 20 },
  { id:'eclaireur', name:'Éclaireur', desc:'Libérer la Forêt sombre.', title:'Éclaireur', icon:() => WORLD_THUMB[0], test:() => story.stars[0] > 0 },
  { id:'aventurier', name:'Aventurier', desc:'Libérer les Pics gelés.', title:'Aventurier', icon:() => WORLD_THUMB[3], test:() => story.stars[3] > 0 },
  { id:'liberateur', name:'Libérateur', desc:'Renverser le Trône noir.', title:'Libérateur', icon:() => WORLD_THUMB[7], test:() => story.stars[7] > 0 },
  { id:'parfait', name:'Sans faute', desc:'Obtenir les 24 étoiles du mode Histoire.', title:'Légende du royaume', icon:() => STAR_URL, test:() => story.stars.every(v => v >= 3) },
  { id:'beni', name:'Béni des dieux', desc:'Réunir 8 bénédictions dans une même partie.', title:'Béni des dieux', icon:() => BI.crit, test:() => hasGame && S.bless.length >= 8 }
];
const ACH_BY = Object.fromEntries(ACH.map(a => [a.id, a]));
const achQueue = []; let achShowing = false, achT = 0;
function checkAch(silent){
  for (const a of ACH){
    if (pstat.ach.includes(a.id)) continue;
    let ok = false; try { ok = a.test(); } catch(e){}
    if (!ok) continue;
    pstat.ach.push(a.id);
    if (!silent) achQueue.push(a);
  }
  if (achQueue.length && !achShowing) showAch();
}
function showAch(){
  const a = achQueue.shift(); if (!a){ achShowing = false; return; }
  achShowing = true;
  $('achIcon').src = a.icon(); $('achName').textContent = a.name; $('achTitle').textContent = 'Titre débloqué : ' + a.title;
  const el = $('achToast'); el.classList.add('show'); sfx('legend'); persist();
  setTimeout(() => { el.classList.remove('show'); setTimeout(showAch, 350); }, 2800);
}
const displayTitle = () => (profile.title && pstat.ach.includes(profile.title) && ACH_BY[profile.title]) ? ACH_BY[profile.title].title : rankOf(pstat.waves).name;

/* ---------- titre en lettres pixel ---------- */
const FONT = {
  R:['####.','#...#','#...#','####.','#.#..','#..#.','#...#'],
  E:['#####','#....','#....','####.','#....','#....','#####'],
  M:['#...#','##.##','#.#.#','#.#.#','#...#','#...#','#...#'],
  P:['####.','#...#','#...#','####.','#....','#....','#....'],
  A:['.###.','#...#','#...#','#####','#...#','#...#','#...#'],
  T:['#####','..#..','..#..','..#..','..#..','..#..','..#..']
};
function titleURL(word){
  const s = new Spr(word.length*6 + 2, 11);
  [...word].forEach((ch, n) => FONT[ch].forEach((row, y) => [...row].forEach((v, x) => { if (v === '#') s.p(1 + n*6 + x, 1 + y + 2, '#5a2a10', 1); })));
  [...word].forEach((ch, n) => FONT[ch].forEach((row, y) => [...row].forEach((v, x) => {
    if (v !== '#') return;
    const col = y === 0 ? '#fff0a0' : y >= 5 ? '#d9932a' : '#f2c14e';
    s.p(1 + n*6 + x, 1 + y, col, 1);
  })));
  return pxCanvas(s.pixels()).toDataURL();
}

/* ---------- scène animée ---------- */
let homeOn = false, hStage = 'title', hMB = null, hGlow = null, hcv = null, hctx = null, hP = 3, hAW = 0, hAH = 0, hBG = null, hFG = null, hLay = null;
const FLIES = Array.from({ length:9 }, () => ({ x:Math.random(), y:.6 + Math.random()*.35, p:Math.random()*6.28, s:.4 + Math.random()*.6 }));
function buildHome(){
  hcv = $('homeCv'); hctx = hcv.getContext('2d');
  const r = hcv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 3);
  hcv.width = Math.max(1, Math.round(r.width*d)); hcv.height = Math.max(1, Math.round(r.height*d));
  hP = Math.max(2, Math.floor(hcv.width / 100));
  const aw = hAW = Math.ceil(hcv.width / hP), ah = hAH = Math.ceil(hcv.height / hP);
  const mk2 = () => { const c = document.createElement('canvas'); c.width = aw; c.height = ah; const x = c.getContext('2d'); return { c, x, id:x.createImageData(aw, ah) }; };
  const B = mk2(), F = mk2(), cache = {};
  const put = (L, px, py, col) => { px |= 0; py |= 0; if (px<0||py<0||px>=aw||py>=ah) return; const v = cache[col] || (cache[col] = hex2(col)); const i = (py*aw + px)*4; L.id.data[i]=v[0]; L.id.data[i+1]=v[1]; L.id.data[i+2]=v[2]; L.id.data[i+3]=255; };

  const horizon = Math.round(ah*.57), wallY = horizon - 4, cx = Math.round(aw/2), towerTop = wallY - 15;
  hLay = { horizon, wallY, cx, towerTop };
  // ciel du soir en bandes tramées
  const bands = ['#1b1830','#221d3a','#2c2446','#3a2b50','#4f3356','#6a3d59','#8a4a5a','#ad5a58','#cc6f56','#e48b58','#f2ab64'];
  for (let y=0;y<horizon;y++){
    const t = y / horizon * (bands.length - 1), b0 = Math.floor(t), fr = t - b0;
    for (let x=0;x<aw;x++){
      let col = bands[b0];
      if ((fr > .66 && (x+y)%2 === 0) || (fr > .33 && fr <= .66 && x%2 === 0 && y%2 === 0)) col = bands[Math.min(b0+1, bands.length-1)];
      put(B, x, y, col);
    }
  }
  for (let k=0;k<40;k++){ const x = hash(k,1,77)*aw|0, y = hash(k,2,77)*horizon*.45|0; put(B, x, y, hash(k,3,77) > .5 ? '#fff3c4' : '#b9b2dc'); }
  // soleil rayé
  const sr = Math.max(8, Math.round(aw*.11)), sy = horizon - 3;
  for (let y=-sr;y<=0;y++) for (let x=-sr;x<=sr;x++){
    if (x*x + y*y > sr*sr) continue;
    const yy = sy + y, stripe = (y > -sr*.55) && ((-y) % 3 === 1);
    if (stripe) continue;
    put(B, cx + x, yy, x*x + y*y < (sr-2)*(sr-2) ? '#ffd27a' : '#ffb85e');
  }
  // montagnes
  for (let x=0;x<aw;x++){
    const h1 = 8 + Math.round(6*Math.sin(x*.09) + 4*Math.sin(x*.23 + 1) + 3*hash(x,0,5));
    for (let y=horizon-h1;y<horizon;y++) put(B, x, y, y < horizon-h1+1 ? '#5a3e60' : '#3b2b4d');
    const h2 = 3 + Math.round(3*Math.sin(x*.15 + 2) + 2*hash(x,1,5));
    for (let y=horizon-h2;y<horizon;y++) put(B, x, y, '#2c2338');
  }
  // sol
  for (let y=horizon;y<ah;y++) for (let x=0;x<aw;x++){
    const n = hash(x,y,11);
    let col = (y - horizon) < 3 ? '#2a3a28' : '#304a2a';
    if (n > .94) col = '#3f5e34'; else if (n < .05) col = '#26391f';
    put(B, x, y, col);
  }
  for (let k=0;k<60;k++){ const x = hash(k,4,13)*aw|0, y = horizon + 14 + (hash(k,5,13)*(ah-horizon-14)|0); put(B, x, y, '#4f7a3e'); put(B, x+2, y, '#4f7a3e'); put(B, x+1, y+1, '#3f6232'); }
  // chemin vers la porte
  for (let y=horizon+10;y<ah;y++){
    const half = 4 + Math.round((y - horizon - 10)*.35);
    for (let x=cx-half;x<=cx+half;x++){
      const edge = x === cx-half || x === cx+half, n = hash(x,y,21);
      put(B, x, y, edge ? '#3e2e22' : n > .92 ? '#8a6a4a' : n < .1 ? '#5a4232' : '#6a5038');
    }
  }
  // muraille
  const stone = (x,y) => { const row = ((y - wallY)/3)|0, off = row%2 ? 3 : 0; return ((x+off)%6 === 0 || (y - wallY)%3 === 2) ? '#45404c' : (hash(((x+off)/6)|0, row, 3) > .5 ? '#6e6874' : '#625d6a'); };
  for (let y=wallY;y<horizon+10;y++) for (let x=0;x<aw;x++) put(B, x, y, stone(x,y));
  for (let x=0;x<aw;x++) put(B, x, wallY, '#c98a6a');
  // tour
  const tw2 = 11;
  for (let y=towerTop;y<horizon+10;y++) for (let x=cx-tw2;x<=cx+tw2;x++){
    let col = stone(x,y);
    if (x === cx-tw2) col = '#c98a6a'; else if (x === cx+tw2) col = '#3a3540';
    put(B, x, y, col);
  }
  for (let x=cx-tw2;x<=cx+tw2;x++) put(B, x, towerTop, '#d99a74');
  for (let y=towerTop+5;y<towerTop+10;y++){ put(B, cx-1, y, '#1a1420'); put(B, cx, y, '#1a1420'); }
  put(B, cx-1, towerTop+9, '#e8a050'); put(B, cx, towerTop+9, '#e8a050');
  // porte
  for (let y=horizon-2;y<horizon+10;y++) for (let x=cx-5;x<=cx+5;x++){
    const ay = y - (horizon-2), arch = ay < 3 && Math.abs(x-cx) > 2 + ay;
    if (arch) continue;
    put(B, x, y, ((x - cx) % 2 === 0 || (y % 3 === 0)) ? '#2a2420' : '#14101a');
  }
  // créneaux (premier plan, devant les soldats)
  const merlons = (y0, x0, x1) => {
    for (let x=x0;x<=x1;x++){
      const tall = ((x - x0) % 6) < 4;
      for (let y=y0-(tall ? 4 : 1); y<=y0+1; y++){
        let col = stone(x, y + 30);
        if (y === y0-(tall ? 4 : 1)) col = '#d99a74';
        put(F, x, y, col);
      }
    }
  };
  merlons(wallY, 0, cx-tw2-1); merlons(wallY, cx+tw2+1, aw-1); merlons(towerTop, cx-tw2, cx+tw2);
  B.x.putImageData(B.id, 0, 0); F.x.putImageData(F.id, 0, 0);
  hBG = B.c; hFG = F.c; hMB = null;
}
/* Fond du menu : l'intérieur du château (mur de pierre, bannières, torches, plancher). */
function buildMenuBG(){
  const aw = hAW, ah = hAH, c = document.createElement('canvas'); c.width = aw; c.height = ah;
  const x = c.getContext('2d'), id = x.createImageData(aw, ah), cache = {};
  const put = (px, py, col) => { px |= 0; py |= 0; if (px<0||py<0||px>=aw||py>=ah) return; const v = cache[col] || (cache[col] = hex2(col)); const i = (py*aw + px)*4; id.data[i]=v[0]; id.data[i+1]=v[1]; id.data[i+2]=v[2]; id.data[i+3]=255; };
  const floorY = Math.round(ah*.8);
  for (let y=0;y<floorY;y++){
    const row = (y/5)|0, off = row%2 ? 5 : 0;
    for (let px=0;px<aw;px++){
      const mortar = (px+off)%10 === 0 || y%5 === 4, n = hash(((px+off)/10)|0, row, 41);
      let col = mortar ? '#16121c' : n > .8 ? '#352c3e' : n < .15 ? '#241e2c' : '#2c2534';
      if (!mortar && y%5 === 0) col = shade(col, 1.12);
      put(px, y, col);
    }
  }
  for (let y=floorY;y<ah;y++) for (let px=0;px<aw;px++){
    const seam = y === floorY || (y - floorY)%4 === 3 || (px + ((y - floorY)>>2)*7)%23 === 0;
    put(px, y, y === floorY ? '#1a1208' : seam ? '#2a1d12' : hash(px, y, 43) > .9 ? '#4a3524' : '#3b2b1e');
  }
  const banner = (bx) => {
    for (let y=0;y<Math.round(ah*.3);y++) for (let k=0;k<11;k++){
      const edge = k === 0 || k === 10, tip = y > ah*.3 - 5 && Math.abs(k - 5) < (y - (ah*.3 - 5)) + 1;
      if (tip) continue;
      put(bx + k, y, edge ? '#e0a93a' : '#8a2a3a');
    }
    const ty = Math.round(ah*.12);
    for (const [dx,dy] of [[3,0],[5,0],[7,0],[3,1],[4,1],[5,1],[6,1],[7,1],[4,2],[5,2],[6,2],[4,3],[5,3],[6,3],[4,4],[6,4]]) put(bx + dx, ty + dy, '#f2c14e');
  };
  banner(Math.round(aw*.2) - 5); banner(Math.round(aw*.8) - 5);
  for (let y=0;y<ah;y++) for (let px=0;px<aw;px++){
    const dx = (px - aw/2)/(aw/2), dy = (y - ah*.45)/(ah*.6), v = dx*dx + dy*dy;
    if (v > .55 && (px + y)%2 === 0 || v > .9){ const i = (y*aw + px)*4; id.data[i] *= .7; id.data[i+1] *= .7; id.data[i+2] *= .7; }
  }
  x.putImageData(id, 0, 0);
  return c;
}
/* Halo de torche tramé, un pixel sur deux. */
function buildGlow(R){
  const c = document.createElement('canvas'); c.width = c.height = 2*R + 1;
  const x = c.getContext('2d'); x.fillStyle = '#ffb347';
  for (let dy=-R;dy<=R;dy++) for (let dx=-R;dx<=R;dx++){ const d = dx*dx + dy*dy; if (d <= R*R && ((dx + dy) % 2 === 0 || d < R*R*.3)) x.fillRect(dx + R, dy + R, 1, 1); }
  return c;
}
function drawMenu(){
  if (!hMB){ hMB = buildMenuBG(); hGlow = [buildGlow(14), buildGlow(15)]; }
  const g = hctx, P_ = hP, t = performance.now()/1000;
  g.drawImage(hMB, 0, 0, hAW*P_, hAH*P_);
  for (const fx2 of [.06, .94]){
    const tx = Math.round(hAW*fx2), ty = Math.round(hAH*.42);
    g.fillStyle = '#4a3020'; g.fillRect((tx-1)*P_, ty*P_, 3*P_, 5*P_); g.fillStyle = '#6b6b78'; g.fillRect((tx-2)*P_, (ty+4)*P_, 5*P_, P_);
    const f = Math.floor(t*8 + fx2*10) % 3;
    const gl = hGlow[f === 1 ? 1 : 0], R = (gl.width - 1)/2;
    g.globalAlpha = .1 + .03*f; g.drawImage(gl, (tx - R)*P_, (ty - 2 - R)*P_, gl.width*P_, gl.height*P_); g.globalAlpha = 1;
    g.fillStyle = '#ff8a2a'; g.fillRect((tx-1)*P_, (ty-3)*P_, 3*P_, 3*P_);
    g.fillStyle = '#ffd23f'; g.fillRect(tx*P_, (ty-4 - (f === 1 ? 1 : 0))*P_, P_, 3*P_);
    g.fillStyle = '#fff3b0'; g.fillRect(tx*P_, (ty-2)*P_, P_, P_);
  }
}
function drawHome(dt){
  if (!hBG) buildHome();
  if (hStage === 'menu'){ hctx.imageSmoothingEnabled = false; drawMenu(); return; }
  const g = hctx, P_ = hP, { wallY, cx, towerTop, horizon } = hLay;
  g.imageSmoothingEnabled = false;
  g.drawImage(hBG, 0, 0, hAW*P_, hAH*P_);
  const t = performance.now()/1000;
  // étoiles qui scintillent
  for (let k=0;k<6;k++){ if (Math.sin(t*2 + k*1.7) < .6) continue; g.fillStyle = '#ffffff'; g.fillRect((hash(k,9,7)*hAW|0)*P_, (hash(k,8,7)*horizon*.4|0)*P_, P_, P_); }
  // drapeau
  const fx_ = cx + 7, fy = towerTop - 14;
  g.fillStyle = '#4a3020'; g.fillRect(fx_*P_, fy*P_, P_, 14*P_);
  const wave = Math.floor(t*3) % 2;
  for (let y=0;y<5;y++) for (let x=0;x<8;x++){
    const off = (wave && x > 3) ? 1 : 0;
    g.fillStyle = (x === 3 && y === 2) || (x === 4 && y === 2) ? '#f2c14e' : y === 0 ? '#e0574a' : '#b8323a';
    g.fillRect((fx_ + 1 + x)*P_, (fy + 1 + y + off)*P_, P_, P_);
  }
  // soldats sur les créneaux, profil sur la tour
  const bob = k => (Math.floor(t*1.6 + k) % 2) ? P_ : 0;
  const guards = [[.12, SPR[1][3]], [.28, SPR[0][4]], [.72, SPR[3][4]], [.88, SPR[2][3]]];
  guards.forEach(([fx2, can], k) => { const x = Math.round(hAW*fx2) - 10; g.drawImage(can, x*P_, (wallY - 18)*P_ - bob(k), 20*P_, 20*P_); });
  const av = avatarSprite(profile.avatar), sz = av.width;
  g.drawImage(av, (cx - Math.round(sz/2))*P_, (towerTop - sz + 2)*P_ - bob(5), sz*P_, sz*P_);
  g.drawImage(hFG, 0, 0, hAW*P_, hAH*P_);
  // lucioles
  for (const f of FLIES){
    f.p += dt*f.s;
    const x = (f.x*hAW + Math.sin(f.p)*6)|0, y = (f.y*hAH + Math.cos(f.p*1.3)*3)|0;
    if (Math.sin(f.p*3) < -.2) continue;
    g.fillStyle = '#fff3a0'; g.fillRect(x*P_, y*P_, P_, P_);
    g.globalAlpha = .35; g.fillRect((x-1)*P_, y*P_, P_*3, P_); g.fillRect(x*P_, (y-1)*P_, P_, P_*3); g.globalAlpha = 1;
  }
}

/* ---------- écrans ---------- */
function refreshHome(){
  const p = PORTRAIT_BY[profile.avatar] || PORTRAITS[0];
  $('hAvatar').src = p.url; $('hName').textContent = profile.name;
  $('hRank').textContent = displayTitle();
  $('hResume').style.display = hasGame ? '' : 'none';
  if (hasGame) $('hResumeSub').textContent = (S.mode === 'story' ? WORLDS[S.world].name + ', vague ' + Math.min(S.wave + 1, maxWaves()) + '/' + maxWaves() : S.mode === 'siege' ? 'Siège, vague ' + Math.min(S.wave + 1, SIEGE_WAVES) + '/' + SIEGE_WAVES : 'Sans fin ' + SIZES[S.size || 0].name.toLowerCase() + ', vague ' + (S.wave + 1)) + (S.legend ? ', avec ' + LEGENDS[S.legend].name : '');
  renderModel();
  $('hSoundBtn').textContent = prefs.sound ? 'Son : oui' : 'Son : non';
  $('hMusicBtn').textContent = prefs.music ? 'Musique : oui' : 'Musique : non';
  $('hChestBadge').textContent = profile.chests | 0; $('hChestBadge').style.display = (profile.chests | 0) ? '' : 'none';
  renderChestSlots();
  const d0 = fixDeck()[0]; $('htDeck').src = cardArt(d0, Math.max(1, cardBest(d0)), false);
}
function showHome(stage = 'menu'){
  hStage = stage; $('ovHome').classList.toggle('titled', stage === 'title'); $('ovHome').classList.remove('leaving');
  closeSheet(); stopPlacing(); drag = null;
  ['ovMenu','ovOver','ovWin','ovBless','ovLegend','ovShop'].forEach(hide);
  if (hasGame && !inWave) save(); else persist();
  homeOn = true; hBG = null; hTab = 1;
  refreshHome(); homeTab(1);
  show('ovHome');
  requestAnimationFrame(() => { hBG = null; });
}
function hideHome(){ homeOn = false; hide('ovHome'); }
function resumeGame(){
  hideHome();
  if (S.legendOffer) openLegendOffer();
  else if (S.pending) openBless();
}
let pendingMode = null;
let pendingWorld = 0, pendingSize = 0;
function openSizeChooser(){
  $('sizeBody').innerHTML = SIZES.map((Z, k) => `<button class="mode size${k}" data-size="${k}"><span class="sz-grid">${Z.cols}×${Z.rows}</span><div><b>${Z.name}</b><span>${Z.desc}</span><small>${bestBy[k] ? 'Record : vague ' + bestBy[k] : 'Pas encore de record'}</small></div></button>`).join('');
  $('sizeBody').querySelectorAll('[data-size]').forEach(b => b.onclick = () => { audio(); hide('ovSize'); askNew('endless', 0, +b.dataset.size); });
  show('ovSize');
}
function askNew(mode, world = 0, size = 0){
  if (mode === 'story' && world == null) return openStoryMap();
  if (!hasGame){ hide('ovStory'); hideHome(); newGame(mode, world, size); return; }
  pendingMode = mode; pendingWorld = world; pendingSize = size;
  $('cfText').textContent = 'Ta partie en cours (' + $('hResumeSub').textContent + ') sera perdue.';
  $('cfGo').textContent = 'Lancer ' + (mode === 'story' ? WORLDS[world].name : 'une partie sans fin (' + SIZES[size].name.toLowerCase() + ')');
  show('ovConfirm');
}
function openProfile(){
  const p = PORTRAIT_BY[profile.avatar] || PORTRAITS[0];
  $('pAvatar').src = p.url; $('pName').value = profile.name;
  const rk = rankOf(pstat.waves);
  $('pRank').textContent = rk.name + (rk.next ? '. Prochain grade : ' + rk.next[1] + ', dans ' + (rk.next[0] - pstat.waves) + ' vagues.' : '. Grade le plus haut.');
  let fav = null, favN = 0; for (const id in pstat.legPick) if (pstat.legPick[id] > favN){ favN = pstat.legPick[id]; fav = id; }
  const metN = LEG_ORDER.filter(id => [1,2,3,4,5].some(l => seenLeg.has(id + ':' + l))).length;
  const cells = [
    ['Parties jouées', fmtN(pstat.games)], ['Vagues repoussées', fmtN(pstat.waves)],
    ['Record sans fin', best ? 'vague ' + best : '—'], ['Sièges gagnés', siegeRec.wins ? siegeRec.wins + ' ' + '★'.repeat(siegeRec.stars) : '0'],
    ['Ennemis vaincus', fmtN(pstat.kills)], ['Boss abattus', fmtN(pstat.bosses)],
    ['Gobelins d’or', fmtN(pstat.goblins)], ['Or gagné', fmtN(pstat.gold)],
    ['Fusions', fmtN(pstat.merges)], ['Offrandes', fmtN(pstat.offers)],
    ['Soldats découverts', seen.size + '/' + TYPES.length*MAXL], ['Légendes rencontrées', metN + '/' + LEG_ORDER.length],
    ['Légende favorite', fav ? LEGENDS[fav].name : '—'], ['Temps de jeu', fmtTime(pstat.time)]
  ];
  $('pStats').innerHTML = cells.map(([k,v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('');
  const unl = PORTRAITS.filter(p => p.unlock()).length;
  $('pAvNote').textContent = unl + ' portraits débloqués sur ' + PORTRAITS.length + '. Découvre de nouveaux soldats et fais monter tes légendes pour en gagner d’autres.';
  const block = (title, list) => `<p class="av-h">${title}</p><div class="av-grid">${list.map(p => {
    const ok = p.unlock(), on = p.key === profile.avatar;
    return `<button class="av${ok ? '' : ' lock'}${on ? ' on' : ''}" data-key="${p.key}" aria-label="${ok ? p.label : 'Portrait verrouillé'}"><img class="px" src="${ok ? p.url : p.sil}" alt=""></button>`;
  }).join('')}</div>`;
  const got = pstat.ach.length;
  $('pAch').innerHTML = `<p class="cx-note">${got} succès sur ${ACH.length}. Chacun débloque un titre à afficher sous ton pseudo.</p>
    <div class="title-chips"><button class="tchip${!profile.title ? ' on' : ''}" data-title="">Grade : ${rk.name}</button>${ACH.filter(a => pstat.ach.includes(a.id)).map(a => `<button class="tchip${profile.title === a.id ? ' on' : ''}" data-title="${a.id}">${a.title}</button>`).join('')}</div>` +
    ACH.map(a => { const ok = pstat.ach.includes(a.id);
      return `<div class="ach-row${ok ? '' : ' lock'}"><img class="px" src="${a.icon()}" alt=""><div><b>${a.name}</b><span>${a.desc}</span><small>Titre : ${a.title}</small></div>${ok ? '<em>✓</em>' : ''}</div>`; }).join('');
  $('pAch').querySelectorAll('.tchip').forEach(b => b.onclick = () => {
    profile.title = b.dataset.title || null; persist(); refreshHome();
    $('pAch').querySelectorAll('.tchip.on').forEach(x => x.classList.remove('on')); b.classList.add('on');
  });
  $('pAvatars').innerHTML = TYPES.map((ty,t) => block(ty.name, PORTRAITS.filter(p => p.key.startsWith('s:' + t + ':'))).replace('av-grid', 'av-grid r8')).join('')
    + LEG_ORDER.map(id => block(LEGENDS[id].name, PORTRAITS.filter(p => p.legend === id))).join('');
  $('pAvatars').querySelectorAll('.av').forEach(b => b.onclick = () => {
    const p = PORTRAIT_BY[b.dataset.key];
    if (!p.unlock()){ toast(p.legend ? 'Fais monter cette légende jusqu’à ce rang pour le débloquer' : 'Découvre ce soldat pour débloquer son portrait'); sfx('bad'); return; }
    profile.avatar = p.key; persist(); sfx('recruit');
    $('pAvatar').src = p.url;
    $('pAvatars').querySelectorAll('.av.on').forEach(x => x.classList.remove('on')); b.classList.add('on');
    refreshHome();
  });
  show('ovProfile');
  document.querySelector('#ovProfile .scroll').scrollTop = 0;
}
function saveName(){
  const v = $('pName').value.replace(/\s+/g, ' ').trim().slice(0, 16);
  profile.name = v || 'Défenseur'; $('pName').value = profile.name; persist(); refreshHome();
}

/* ---------- carte des mondes ---------- */
function worldThumb(i){
  const W = WORLDS[i], B = BIOMES[W.biome];
  const c = document.createElement('canvas'); c.width = 64; c.height = 30;
  const x = c.getContext('2d'), id = x.createImageData(64, 30), cache = {};
  const put = (px,py,col) => { if (px<0||py<0||px>=64||py>=30) return; const v = cache[col] || (cache[col] = hex2(col)); const k = (py*64+px)*4; id.data[k]=v[0]; id.data[k+1]=v[1]; id.data[k+2]=v[2]; id.data[k+3]=255; };
  for (let y=0;y<30;y++) for (let xx=0;xx<64;xx++){
    const n = hash(xx, y, 40 + i);
    put(xx, y, n < .08 ? B.gd[0] : n > .95 ? B.gl[0] : B.g[(xx>>3)+(y>>3) & 1]);
  }
  for (let y=0;y<30;y++){ const cx = 20 + Math.round(Math.sin(y*.25)*4); for (let k=-3;k<=3;k++) put(cx+k, y, Math.abs(k) === 3 ? B.edge[0] : (hash(cx+k,y,9) > .9 ? B.dirt[2] : B.dirt[0])); }
  const stamp = (o, X0, Y0) => { for (let k=0;k<o.px.length;k++){ const col = o.px[k]; if (col) put(X0 + k%o.w, Y0 + ((k/o.w)|0), col); } };
  stamp(terTree(B), -4, -2); stamp(terRock(B), 2, 12); stamp(terTree(B), 26, 10);
  x.putImageData(id, 0, 0);
  const boss = ENS[W.finals[W.finals.length-1]].n;
  x.drawImage(boss, 64 - boss.width - 2, 30 - boss.height);
  return c.toDataURL();
}
const WORLD_THUMB = WORLDS.map((_,i) => worldThumb(i));
/* Maquette d'un monde : un bloc de terrain posé sur un socle en bois, avec ses décors, un monstre et son boss. */
const MDL_W = 88, MDL_H = 74;
function worldModel(i){
  const endless = i < 0, W = endless ? null : WORLDS[i], B = BIOMES[endless ? 0 : W.biome];
  const c = document.createElement('canvas'); c.width = MDL_W; c.height = MDL_H;
  const x = c.getContext('2d');
  const put = (px, py, col) => { if (px < 0 || py < 0 || px >= MDL_W || py >= MDL_H || !col) return; x.fillStyle = col; x.fillRect(px|0, py|0, 1, 1); };
  const stamp = (o, X0, Y0) => { for (let k=0;k<o.px.length;k++) put(X0 + k%o.w, Y0 + ((k/o.w)|0), o.px[k]); };
  const top0 = 14, top1 = 47, inset = y => Math.round((top1 - y)*6/(top1 - top0));
  // dessus : le sol du biome, en légère perspective
  for (let y=top0;y<=top1;y++){
    const a = 4 + inset(y), b = 83 - inset(y);
    for (let px=a;px<=b;px++){
      const n = hash(px, y, 60 + i);
      put(px, y, px === a || px === b ? B.gd[1] : n < .1 ? B.gd[0] : n > .92 ? B.gl[0] : B.g[((px>>2) + (y>>2)) & 1]);
    }
  }
  // chemin qui serpente de l'arrière vers l'avant
  for (let y=top0+1;y<=top1;y++){
    const cx = 44 + Math.round(Math.sin(y*.28 + i)*9), hw = 2 + Math.round((y - top0)/12);
    for (let k=-hw;k<=hw;k++) put(cx + k, y, Math.abs(k) === hw ? B.edge[0] : hash(cx+k, y, 9) > .88 ? B.dirt[2] : B.dirt[0]);
  }
  // tranche avant : strates de terre et de roche
  for (let y=48;y<=58;y++) for (let px=4;px<=83;px++){
    const n = hash(px, y, 70);
    let col = y === 48 ? B.gd[0] : y < 53 ? (n > .85 ? B.dirt[2] : B.dirt[1]) : y < 56 ? shade(B.dirt[1], .75) : (n > .8 ? '#6a6660' : '#4e4a46');
    if (px === 4 || px === 83) col = shade(col, .7);
    put(px, y, col);
  }
  // socle en bois et plaque dorée
  for (let y=59;y<=68;y++) for (let px=1;px<=86;px++) put(px, y, y === 59 ? '#a0703c' : y === 68 ? '#3a2414' : (hash(px, y, 80) > .9 || (px + y*3) % 17 === 0) ? '#4a3018' : '#6b4422');
  for (let y=61;y<=66;y++) for (let px=33;px<=54;px++) put(px, y, y === 61 || y === 66 || px === 33 || px === 54 ? '#a86d16' : y === 62 ? '#fbe08a' : '#e0a93a');
  for (const [px,py] of [[35,63],[52,63],[35,64],[52,64]]) put(px, py, '#a86d16');
  if (endless){
    // le rempart, sa tour et sa porte, au bord avant du plateau
    for (let y=34;y<=46;y++) for (let px=7;px<=80;px++){
      const row = ((y-34)/3)|0, off = row % 2 ? 3 : 0, mortar = (px + off) % 6 === 0 || (y - 34) % 3 === 2;
      put(px, y, y === 34 ? '#c98a6a' : mortar ? '#45404c' : hash(((px+off)/6)|0, row, 3) > .5 ? '#6e6874' : '#625d6a');
    }
    for (let px=7;px<=80;px++) if ((px - 7) % 6 < 4) for (let y=31;y<=33;y++) put(px, y, y === 31 ? '#d99a74' : '#6e6874');
    for (let y=22;y<=46;y++) for (let px=37;px<=51;px++) put(px, y, y === 22 ? '#d99a74' : px === 37 ? '#c98a6a' : px === 51 ? '#3a3540' : (px + y) % 5 === 0 ? '#5a5462' : '#686270');
    for (let px=37;px<=51;px++) if ((px - 37) % 4 < 2) put(px, 21, '#d99a74');
    for (let y=38;y<=46;y++) for (let px=41;px<=47;px++) if (!(y < 40 && Math.abs(px - 44) > 1 + (y - 38))) put(px, y, (px % 2 === 0 || y % 3 === 0) ? '#2a2420' : '#14101a');
    put(44, 27, '#e8a050'); put(44, 28, '#1a1420');
    for (let y=14;y<=21;y++) put(48, y, '#4a3020');
    for (let y=14;y<=17;y++) for (let px=49;px<=53;px++) put(px, y, y === 14 ? '#e0574a' : '#b8323a');
    stamp(terTree(B), 2, 12); stamp(terTree(B), 66, 11);
    const bo = ENS.boss.n; x.drawImage(bo, 56, 34 - bo.height);
    x.drawImage(ENS.slime.n, 18, 14);
  } else {
    stamp(terTree(B), 5, 10); stamp(terTree(B), 63, 9); stamp(terRock(B), 10, 29);
    if (B.water && i % 2) for (let y=38;y<=43;y++) for (let px=64;px<=76;px++) if ((px-70)**2/40 + (y-40.5)**2/7 <= 1) put(px, y, y === 38 ? B.water[2] : B.water[(px + y) % 2]);
    const mob = ENS[W.base].n; x.drawImage(mob, 20, 46 - mob.height);
    const boss = ENS[W.finals[W.finals.length-1]].n; x.drawImage(boss, 50, 45 - boss.height);
  }
  return c;
}
/* Version verrouillée : la même maquette en gris très sombre, calculée une fois. */
function darkModel(c){
  const d = document.createElement('canvas'); d.width = c.width; d.height = c.height;
  const x = d.getContext('2d'); x.drawImage(c, 0, 0);
  const im = x.getImageData(0, 0, d.width, d.height), a = im.data;
  for (let i=0;i<a.length;i+=4){ const v = (a[i]*.3 + a[i+1]*.59 + a[i+2]*.11)*.32; a[i] = a[i+1] = a[i+2] = v; }
  x.putImageData(im, 0, 0);
  return d.toDataURL();
}
const WORLD_MODEL = WORLDS.map((_,i) => { const c = worldModel(i); return { url:c.toDataURL(), dark:darkModel(c) }; });
const ENDLESS_MODEL = worldModel(-1).toDataURL();
function openStoryMap(){
  $('storyBody').innerHTML = WORLDS.map((W,i) => {
    const open = i < story.unlocked, st = story.stars[i]|0;
    const bosses = W.finals.map(k => EN[k].name).join(', puis ');
    return `${i ? '<div class="map-trail"></div>' : ''}<button class="world${open ? '' : ' lock'}" data-w="${i}">
      <span class="wthumb"><img class="px" src="${WORLD_THUMB[i]}" alt="">${open ? '' : '<i></i>'}</span>
      <span class="winfo"><em>Monde ${i+1}</em><b>${open ? W.name : '???'}</b>
      <small>${open ? W.waves + ' vagues. Boss : ' + bosses + '.' : 'Termine le monde précédent pour l’ouvrir.'}</small>
      <span class="wstars">${[0,1,2].map(k => `<img class="px${k < st ? '' : ' off'}" src="${STAR_URL}" alt="">`).join('')}</span></span>
    </button>`;
  }).join('');
  $('storyBody').querySelectorAll('.world').forEach(b => b.onclick = () => {
    const i = +b.dataset.w;
    if (i >= story.unlocked){ toast('Termine le monde précédent pour l’ouvrir'); sfx('bad'); return; }
    audio(); askNew('story', i);
  });
  const total = story.stars.reduce((a,b) => a+b, 0);
  $('storyLead').textContent = 'Libère les mondes un à un. Étoiles : ' + total + ' sur ' + WORLDS.length*3 + '. Tu peux rejouer chaque monde ouvert pour améliorer ton score.';
  show('ovStory');
}
$('winMap').addEventListener('click', () => { hide('ovWin'); hMode = 'story'; hWorld = Math.min(story.unlocked, WORLDS.length) - 1; showHome(); });

$('hTitle').src = titleURL('REMPART');
$('hProfile').addEventListener('click', () => { audio(); openProfile(); });
$('hResume').addEventListener('click', () => { audio(); resumeGame(); });
/* ---------- écran Combat : maquette du monde choisi ---------- */
let hMode = 'story', hWorld = -1;
function renderModel(){
  if (hWorld < 0 || hWorld >= WORLDS.length) hWorld = Math.min(story.unlocked, WORLDS.length) - 1;
  const st = hMode === 'story', open = !st || hWorld < story.unlocked;
  document.querySelectorAll('#hModeSw button').forEach(b => b.classList.toggle('on', b.dataset.mode === hMode));
  $('mdlImg').src = st ? WORLD_MODEL[hWorld][open ? 'url' : 'dark'] : ENDLESS_MODEL;
  $('mdlFig').classList.toggle('lock', !open);
  if (st){
    const W = WORLDS[hWorld], n = story.stars[hWorld] | 0;
    $('mdlKicker').textContent = 'Monde ' + (hWorld + 1) + ' sur ' + WORLDS.length;
    $('mdlName').textContent = open ? W.name : '???';
    $('mdlStars').innerHTML = [0,1,2].map(k => `<img class="px${k < n ? '' : ' off'}" src="${STAR_URL}" alt="">`).join('');
    $('mdlSub').textContent = open ? W.waves + ' vagues. Boss : ' + W.finals.map(k => EN[k].name).join(', puis ') + '.' : 'Libère ' + WORLDS[hWorld - 1].name + ' pour l’ouvrir.';
    $('mdlDots').innerHTML = WORLDS.map((_,k) => `<i data-w="${k}" class="${k === hWorld ? 'on' : k >= story.unlocked ? 'lock' : ''}"></i>`).join('');
  } else {
    $('mdlKicker').textContent = 'Mode libre';
    $('mdlName').textContent = 'Sans fin';
    $('mdlStars').innerHTML = '';
    $('mdlSub').textContent = bestBy.some(Boolean) ? 'Records : facile ' + bestBy[0] + ', moyen ' + bestBy[1] + ', difficile ' + bestBy[2] + '.' : 'Tiens le plus longtemps possible. Trois tailles de carte.';
    $('mdlDots').innerHTML = '';
  }
  $('mdlGo').classList.toggle('off', !open);
  $('mdlGo').textContent = open ? 'Lancer' : 'Verrouillé';
}
function stepWorld(d){
  const n = Math.max(0, Math.min(WORLDS.length - 1, hWorld + d)); if (n === hWorld) return;
  hWorld = n; sfx('arrow'); renderModel();
  const f = $('mdlFig'); f.classList.remove('swap', 'swapL'); void f.offsetWidth; f.classList.add(d > 0 ? 'swap' : 'swapL');
}
$('mdlDots').addEventListener('click', e => { const d = e.target.closest('[data-w]'); if (d){ audio(); stepWorld(+d.dataset.w - hWorld); } });
document.querySelectorAll('#hModeSw button').forEach(b => b.addEventListener('click', () => { audio(); if (hMode !== b.dataset.mode){ hMode = b.dataset.mode; sfx('arrow'); renderModel(); } }));
$('mdlGo').addEventListener('click', () => {
  audio();
  if (hMode === 'endless') return openSizeChooser();
  if (hWorld >= story.unlocked){ toast('Libère le monde précédent pour ouvrir celui-ci'); sfx('bad'); return; }
  askNew('story', hWorld);
});
$('cfGo').addEventListener('click', () => { hide('ovConfirm'); hide('ovStory'); hideHome(); newGame(pendingMode, pendingWorld, pendingSize); });
$('pName').addEventListener('change', saveName);
$('pName').addEventListener('blur', saveName);
$('pName').addEventListener('keydown', e => { if (e.key === 'Enter') e.target.blur(); });
document.querySelectorAll('[data-hact]').forEach(b => b.addEventListener('click', () => {
  audio();
  const a = b.dataset.hact;
  if (a === 'codex'){ buildCodex(); show('ovCodex'); }
  else if (a === 'help') show('ovHelp');
  else if (a === 'deck') openDeck();
  else if (a === 'profile') openProfile();
  else if (a === 'sound'){ prefs.sound = !prefs.sound; persist(); refreshHome(); }
  else if (a === 'music'){ prefs.music = !prefs.music; persist(); refreshHome(); }
}));
window.addEventListener('resize', () => { hBG = null; });

/* =========================================================
   Deck : cinq soldats choisis pour la bataille
   ========================================================= */
const DECK_N = 5;
const CARD_ROLE = ['Mêlée','Distance','Zone','Contrôle','Chaîne','Bloqueur','Feu','Artillerie','Poison','Perforant','Sacré','Anti-air','Perce-armure','Exécution','Métamorphose','Ronces','Recul','Prime','Soin','Chant','Horlogerie','Économie','Racines','Souffle','Nécromancie','Pièges'];
/* Cartes à gagner : elles ne peuvent sortir d'un coffre qu'une fois leur condition remplie. */
const CARD_REQ = [null, null, null, null, null,
  { test:() => best >= 10 || story.unlocked >= 2, txt:'Atteins la vague 10 en Sans fin, ou termine la Forêt sombre.' },
  { test:() => pstat.waves >= 50, txt:() => 'Repousse 50 vagues au total (' + Math.min(50, pstat.waves) + '/50).' },
  { test:() => pstat.kills >= 1000, txt:() => 'Abats 1 000 monstres au total (' + fmtN(Math.min(1000, pstat.kills)) + '/1 000).' },
  { test:() => best >= 20 || story.unlocked >= 3, txt:'Atteins la vague 20 en Sans fin, ou termine le Marais putride.' },
  { test:() => pstat.bosses >= 5, txt:() => 'Abats 5 boss au total (' + Math.min(5, pstat.bosses) + '/5).' },
  { test:() => best >= 25 || story.unlocked >= 4, txt:'Atteins la vague 25 en Sans fin, ou libère le Désert brûlant.' },
  { test:() => pstat.games >= 10, txt:() => 'Joue 10 parties (' + Math.min(10, pstat.games) + '/10).' },
  { test:() => pstat.merges >= 100, txt:() => 'Réussis 100 fusions (' + Math.min(100, pstat.merges) + '/100).' },
  { test:() => pstat.kills >= 3000, txt:() => 'Abats 3 000 monstres au total (' + fmtN(Math.min(3000, pstat.kills)) + '/3 000).' },
  { test:() => best >= 30 || story.unlocked >= 3, txt:'Atteins la vague 30 en Sans fin, ou libère le Marais putride.' },
  { test:() => (profile.cards || []).length >= 3, txt:() => 'Gagne 3 cartes dans des coffres (' + Math.min(3, (profile.cards || []).length) + '/3).' },
  { test:() => pstat.bosses >= 20, txt:() => 'Abats 20 boss au total (' + Math.min(20, pstat.bosses) + '/20).' },
  { test:() => pstat.gold >= 20000, txt:() => 'Ramasse 20 000 or au total (' + fmtN(Math.min(20000, pstat.gold)) + '/20 000).' },
  { test:() => story.stars.some(n => n >= 3), txt:'Libère un monde avec trois étoiles.' },
  { test:() => pstat.ach.length >= 10, txt:() => 'Débloque 10 succès (' + Math.min(10, pstat.ach.length) + '/10).' },
  { test:() => pstat.merges >= 300, txt:() => 'Réussis 300 fusions (' + Math.min(300, pstat.merges) + '/300).' },
  { test:() => pstat.gold >= 50000, txt:() => 'Ramasse 50 000 or au total (' + fmtN(Math.min(50000, pstat.gold)) + '/50 000).' },
  { test:() => best >= 35 || story.unlocked >= 5, txt:'Atteins la vague 35 en Sans fin, ou libère les Pics gelés.' },
  { test:() => pstat.beaten.includes('dragon'), txt:'Abats le Dragon de braise.' },
  { test:() => pstat.kills >= 10000, txt:() => 'Abats 10 000 monstres au total (' + fmtN(Math.min(10000, pstat.kills)) + '/10 000).' },
  { test:() => pstat.traps >= 50, txt:() => 'Pose 50 pièges (' + Math.min(50, pstat.traps) + '/50).' }];
const reqTxt = t => { const x = CARD_REQ[t].txt; return typeof x === 'function' ? x() : x; };
const cardBest = t => { let b = 0; for (let l=1;l<=MAXL;l++) if (seen.has(t*MAXL + l - 1)) b = l; return b; };
const cardOpen = t => !CARD_REQ[t] || (profile.cards || []).includes(t) || cardBest(t) > 0;
const cardWinnable = t => !cardOpen(t) && CARD_REQ[t].test();
/* Coffres : un toutes les CHEST_EVERY vagues repoussées, et un par monde libéré la première fois. */
const CHEST_EVERY = 10;
function giveChest(why){
  profile.chests = (profile.chests | 0) + 1; persist();
  setTimeout(() => { toast(why + ' : un coffre t’attend dans Mon deck'); sfx('jackpot'); }, 900);
}
const deckTypes = () => S && S.deck ? S.deck : TYPES.map((_,t) => t);
/* Deck valide : cinq types distincts et débloqués, complété dans l'ordre si besoin. */
function fixDeck(){
  const ok = [];
  for (const t of (Array.isArray(profile.deck) ? profile.deck : [])) if (TYPES[t] && cardOpen(t) && !ok.includes(t)) ok.push(t);
  for (let t=0; ok.length < DECK_N && t < TYPES.length; t++) if (cardOpen(t) && !ok.includes(t)) ok.push(t);
  profile.deck = ok.slice(0, DECK_N);
  return profile.deck;
}
/* Illustration de carte : le meilleur rang atteint, sur un fond aux couleurs du type. */
const CARD_ART = {};
function cardArt(t, l, lock){
  const key = t + ':' + l + ':' + (lock ? 1 : 0); if (CARD_ART[key]) return CARD_ART[key];
  const c = document.createElement('canvas'); c.width = 26; c.height = 24;
  const x = c.getContext('2d'), col = lock ? '#5a5048' : TYPES[t].col;
  for (let y=0;y<24;y++) for (let i=0;i<26;i++){
    const ground = y >= 19, k = ground ? .3 : y < 8 ? .58 : y < 14 ? ((i + y) % 2 ? .5 : .46) : .42;
    x.fillStyle = shade(col, ground && y === 19 ? .48 : k); x.fillRect(i, y, 1, 1);
    if (!ground && hash(i, y, 70 + t) > .965){ x.fillStyle = shade(col, 1.35); x.fillRect(i, y, 1, 1); }
  }
  x.drawImage(lock ? SIL[t][0] : SPR[t][Math.max(1, l) - 1], 3, 3);
  return CARD_ART[key] = c.toDataURL();
}
function cardHTML(t, cls = '', mini = false){
  const open = cardOpen(t), lb = Math.max(1, cardBest(t)), ty = TYPES[t];
  const pips = Array.from({length:MAXL}, (_,k) => `<i class="${k < cardBest(t) ? 'on' : ''}"></i>`).join('');
  const win = !open && cardWinnable(t);
  return `<div class="card${open ? '' : ' lock'}${win ? ' win' : ''} ${cls}" data-t="${t}" style="--cc:${open ? ty.col : win ? '#a8781e' : '#5a5048'}">
    <img class="px card-art" src="${cardArt(t, lb, !open)}" alt="" draggable="false">
    ${mini ? '' : `<span class="card-role">${open ? CARD_ROLE[t] : win ? 'À gagner' : 'Verrouillée'}</span>`}
    <b class="card-name">${open ? ty.name : '???'}</b>
    ${mini ? '' : `<span class="card-pips">${pips}</span>`}
  </div>`;
}
let deckSel = -1, deckDrag = null, deckDropT = 0;
function deckInfo(t){
  const el = $('deckInfo');
  if (t < 0){ el.innerHTML = '<span class="dim">Touche une carte pour la lire, puis un emplacement pour l’y poser. Ou maintiens-la et fais-la glisser.</span>'; return; }
  const ty = TYPES[t], open = cardOpen(t), b = cardBest(t);
  el.innerHTML = open
    ? `<b style="color:${ty.col}">${ty.name}</b> · ${CARD_ROLE[t]}<br>${ty.desc} <span class="dim">${b ? 'Meilleur rang : ' + ty.ranks[b-1] + '.' : 'Pas encore recruté.'}</span>`
    : cardWinnable(t) ? `<b>Carte à gagner</b><br>Condition remplie : elle peut sortir de ton prochain coffre.`
    : `<b>Carte verrouillée</b><br>Pour qu’elle puisse sortir d’un coffre : ${reqTxt(t)}`;
}
function renderDeck(){
  const d = fixDeck();
  $('deckSlots').innerHTML = d.map((t,k) => `<div class="dslot" data-k="${k}">${cardHTML(t, deckSel === t ? 'sel' : '', true)}</div>`).join('');
  $('deckColl').innerHTML = TYPES.map((_,t) => cardHTML(t, (d.includes(t) ? 'in' : '') + (deckSel === t ? ' sel' : ''))).join('');
  const nOpen = TYPES.filter((_,t) => cardOpen(t)).length;
  $('deckCount').textContent = nOpen + '/' + TYPES.length;
  const nc = profile.chests | 0;
  $('deckChestN').textContent = nc; $('deckChest').classList.toggle('empty', !nc);
  $('deckNote').textContent = hasGame ? 'Ta partie en cours garde son deck. Le nouveau servira à la prochaine partie.' : 'Seuls les soldats du deck sortent au recrutement, et seules leurs bénédictions te sont proposées.';
  deckInfo(deckSel);
}
function deckPut(t, from, k){
  const d = profile.deck;
  if (from >= 0){ [d[from], d[k]] = [d[k], d[from]]; }
  else { const j = d.indexOf(t); if (j >= 0) [d[j], d[k]] = [d[k], d[j]]; else d[k] = t; }
  deckSel = -1; persist(); renderDeck(); refreshHome(); sfx('recruit');
  const s = $('deckSlots').children[k]; if (s){ s.classList.add('pop'); }
}
function openDeck(){ deckSel = -1; homeTab(0); }
function deckTap(t, slot){
  if (!cardOpen(t)){ deckSel = -1; renderDeck(); deckInfo(t); sfx('bad'); return; }
  if (slot >= 0 && deckSel >= 0 && deckSel !== t){ deckPut(deckSel, profile.deck.indexOf(deckSel), slot); return; }
  deckSel = deckSel === t ? -1 : t; renderDeck(); sfx('arrow');
}
/* Dans la collection (qui défile), une carte se saisit par un appui maintenu ; dans le deck, tout de suite. */
const DECK_HOLD = 200;
$('deckWin').addEventListener('pointerdown', e => {
  const card = e.target.closest('.card'); if (!card || deckDrag) return;
  const slotEl = card.closest('.dslot');
  const d = deckDrag = { t:+card.dataset.t, from: slotEl ? +slotEl.dataset.k : -1, el:card, sx:e.clientX, sy:e.clientY, ghost:null, over:null, id:e.pointerId };
  d.armed = !!slotEl || e.pointerType === 'mouse';
  if (!d.armed && cardOpen(d.t)) d.timer = setTimeout(() => { if (deckDrag === d){ d.armed = true; card.classList.add('armed'); } }, DECK_HOLD);
});
$('deckWin').addEventListener('touchmove', e => { if (deckDrag && (deckDrag.armed || deckDrag.ghost)) e.preventDefault(); }, { passive:false });
window.addEventListener('pointermove', e => {
  const d = deckDrag; if (!d || e.pointerId !== d.id) return;
  if (!d.ghost){
    const far = Math.hypot(e.clientX - d.sx, e.clientY - d.sy) >= 8;
    if (far && !d.armed){ clearTimeout(d.timer); deckDrag = null; return; }
    if (!far || !cardOpen(d.t)) return;
    d.el.classList.remove('armed');
    const r = d.el.getBoundingClientRect();
    d.ghost = d.el.cloneNode(true); d.ghost.classList.add('ghost'); d.ghost.classList.remove('sel','in');
    Object.assign(d.ghost.style, { width:r.width + 'px', height:r.height + 'px' });
    d.dx = e.clientX - r.left; d.dy = e.clientY - r.top;
    document.body.appendChild(d.ghost); d.el.classList.add('lifted');
  }
  d.ghost.style.transform = `translate(${e.clientX - d.dx}px,${e.clientY - d.dy}px) rotate(-4deg) scale(1.08)`;
  const hit = document.elementFromPoint(e.clientX, e.clientY), slot = hit && hit.closest('.dslot');
  if (d.over && d.over !== slot) d.over.classList.remove('hot');
  d.over = slot; if (slot) slot.classList.add('hot');
});
function endDeckDrag(e, cancel){
  const d = deckDrag; if (!d || e.pointerId !== d.id) return;
  deckDrag = null; clearTimeout(d.timer); d.el.classList.remove('armed');
  if (!d.ghost){ if (!cancel) deckTap(d.t, d.from); return; }
  d.ghost.remove(); d.el.classList.remove('lifted'); deckDropT = performance.now();
  if (d.over) d.over.classList.remove('hot');
  if (!cancel && d.over && +d.over.dataset.k !== d.from) deckPut(d.t, d.from, +d.over.dataset.k);
}
window.addEventListener('pointerup', e => endDeckDrag(e, false));
window.addEventListener('pointercancel', e => endDeckDrag(e, true));

/* ---------- coffres ---------- */
const CHEST_C = { D:'#4a2e1a', B:'#8a5a32', G:'#e0a93a', Y:'#f6c94a', K:'#1e140c', W:'#fff3c4' };
const CHEST_SHUT = pxCanvas(patt(['..DDDDDDDDDDDDDD..','.DBBBBBBBBBBBBBBD.','DBBBBBBBBBBBBBBBBD','DGGGGGGGGGGGGGGGGD','DBBBBBBBYYBBBBBBBD',
  'DGGGGGGGYKGGGGGGGD','DBBBBBBBYYBBBBBBBD','DBBBBBBBBBBBBBBBBD','DGBBBBBBBBBBBBBBGD','DGBBBBBBBBBBBBBBGD','DGGGGGGGGGGGGGGGGD','.DDDDDDDDDDDDDDDD.'], CHEST_C)).toDataURL();
const CHEST_OPEN = pxCanvas(patt(['.DDDDDDDDDDDDDDDD.','DBBBBBBBBBBBBBBBBD','DGGGGGGGGGGGGGGGGD','DBBBBBBBBBBBBBBBBD','DKKKKKKKKKKKKKKKKD',
  'DKYYWYYKYYYWYYYKKD','DGGGGGGGGGGGGGGGGD','DBBBBBBBYYBBBBBBBD','DBBBBBBBYYBBBBBBBD','DGBBBBBBBBBBBBBBGD','DGBBBBBBBBBBBBBBGD','DGGGGGGGGGGGGGGGGD','.DDDDDDDDDDDDDDDD.'], CHEST_C)).toDataURL();
$('deckChestImg').src = CHEST_SHUT;
let chestState = null;
function openChest(){
  if ((profile.chests | 0) <= 0){ toast('Aucun coffre : tu en gagnes un toutes les ' + CHEST_EVERY + ' vagues repoussées'); sfx('bad'); return; }
  const pool = TYPES.map((_,t) => t).filter(cardWinnable);
  $('chestImg').src = CHEST_SHUT; $('chestImg').className = 'px chest-img'; $('chestCard').innerHTML = ''; $('chestStage').classList.remove('lit');
  if (!pool.length){
    const next = TYPES.map((_,t) => t).filter(t => !cardOpen(t));
    chestState = 'none';
    $('chestTitle').textContent = 'Coffre fermé';
    $('chestLead').innerHTML = next.length ? 'Aucune carte n’est encore prête à en sortir. Remplis une condition :<br>' + next.map(t => '• ' + reqTxt(t)).join('<br>') : 'Tu as déjà toutes les cartes. De nouvelles troupes arrivent bientôt.';
    $('chestBtn').textContent = 'Fermer';
  } else {
    chestState = 'shut';
    $('chestTitle').textContent = (profile.chests | 0) > 1 ? 'Coffre (' + profile.chests + ')' : 'Coffre';
    $('chestLead').textContent = 'Touche le coffre pour l’ouvrir.';
    $('chestBtn').textContent = 'Ouvrir';
  }
  show('ovChest');
}
function crackChest(){
  if (chestState === 'none' || chestState === 'done'){ hide('ovChest'); renderDeck(); return; }
  if (chestState !== 'shut') return;
  const pool = TYPES.map((_,t) => t).filter(cardWinnable); if (!pool.length) return;
  chestState = 'shaking'; $('chestImg').classList.add('shake'); sfx('clang');
  setTimeout(() => {
    const t = pool[Math.random()*pool.length|0];
    profile.cards = (profile.cards || []).concat(t); profile.chests = Math.max(0, (profile.chests | 0) - 1); persist();
    $('chestImg').classList.remove('shake'); $('chestImg').src = CHEST_OPEN; $('chestStage').classList.add('lit');
    $('chestCard').innerHTML = cardHTML(t, 'reveal');
    $('chestTitle').textContent = 'Nouvelle carte !';
    $('chestLead').innerHTML = `<b style="color:${TYPES[t].col}">${TYPES[t].name}</b> rejoint ta collection. ${TYPES[t].desc}`;
    $('chestBtn').textContent = 'Super !'; chestState = 'done';
    sfx('legend'); refreshHome();
  }, 900);
}
$('deckChest').addEventListener('click', () => { audio(); openChest(); });
$('chestBtn').addEventListener('click', () => { audio(); crackChest(); });
$('chestImg').addEventListener('click', () => { audio(); crackChest(); });

/* ---------- accueil en trois pages : Deck, Combat, Plus ---------- */
let hTab = 1, hSwipe = null;
function homeTab(n){
  hTab = Math.max(0, Math.min(2, n));
  $('hTrack').style.transform = `translateX(${-hTab*100/3}%)`;
  document.querySelectorAll('.htab').forEach(b => b.classList.toggle('on', +b.dataset.tab === hTab));
  document.querySelectorAll('.hpage').forEach((pg, k) => pg.classList.toggle('cur', k === hTab));
  if (hTab === 0){ deckSel = -1; renderDeck(); }
}
$('htPlay').src = BI.sword; $('htMore').src = BI.star;
$('hiCodex').src = BI.scroll; $('hiProfile').src = BI.helm; $('hiHelp').src = BI.banner;
document.querySelectorAll('.htab').forEach(b => b.addEventListener('click', () => { audio(); if (+b.dataset.tab !== hTab) sfx('arrow'); homeTab(+b.dataset.tab); }));
$('hPager').addEventListener('pointerdown', e => { hSwipe = { x:e.clientX, y:e.clientY, id:e.pointerId, model: !!e.target.closest('#hModel') }; });
window.addEventListener('pointerup', e => {
  const w = hSwipe; hSwipe = null;
  if (!w || e.pointerId !== w.id || !homeOn || document.querySelector('.ov.show:not(.home)') || performance.now() - deckDropT < 80 || deckDrag) return;
  const dx = e.clientX - w.x, dy = e.clientY - w.y;
  if (Math.abs(dx) > 40 && w.model && hMode === 'story'){ stepWorld(dx < 0 ? 1 : -1); return; }
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)*1.5){ homeTab(hTab + (dx < 0 ? 1 : -1)); sfx('arrow'); }
});

/* ---------- emplacements de coffres (écran Combat) ---------- */
const CHEST_SLOTS = 4;
function renderChestSlots(){
  const n = profile.chests | 0, left = CHEST_EVERY - pstat.waves % CHEST_EVERY;
  let h = '';
  for (let k=0;k<CHEST_SLOTS;k++){
    if (k < n) h += `<button class="cslot full" data-k="${k}"><img class="px" src="${CHEST_SHUT}" alt="Coffre"><span>Ouvrir</span></button>`;
    else if (k === n) h += `<div class="cslot"><b>${CHEST_EVERY - left}/${CHEST_EVERY}</b><span>vagues</span></div>`;
    else h += `<div class="cslot"></div>`;
  }
  $('hChests').innerHTML = h + (n > CHEST_SLOTS ? `<em class="cslot-more">+${n - CHEST_SLOTS} en réserve</em>` : '');
}
$('hChests').addEventListener('click', e => { if (e.target.closest('.cslot.full')){ audio(); openChest(); } });

/* ---------- écran titre ---------- */
function fanfare(){
  if (!prefs.sound && !prefs.music) return;
  const c = audio(); if (!c) return;
  const g = c.createGain(); g.gain.value = .5; g.connect(c.destination);
  const t0 = c.currentTime + .05;
  const n = (s, m, d, type, v) => { const o = c.createOscillator(), e = c.createGain(); o.type = type; o.frequency.value = MIDI(m);
    e.gain.setValueAtTime(.0001, t0 + s); e.gain.exponentialRampToValueAtTime(v, t0 + s + .01); e.gain.exponentialRampToValueAtTime(.0001, t0 + s + d);
    o.connect(e).connect(g); o.start(t0 + s); o.stop(t0 + s + d + .05); };
  [[0,67,.14],[.15,72,.14],[.3,76,.14],[.45,79,.3],[.78,76,.12],[.92,79,.7]].forEach(([s,m,d]) => { n(s, m, d, 'square', .06); n(s, m - 12, d, 'triangle', .08); });
  [[0,48,.4],[.45,55,.3],[.92,48,.8]].forEach(([s,m,d]) => n(s, m, d, 'triangle', .1));
}
function enterMenu(){
  if (hStage !== 'title' || $('ovHome').classList.contains('leaving')) return;
  fanfare();
  $('ovHome').classList.add('leaving');
  setTimeout(() => {
    showHome('menu');
    if (!prefs.helped) show('ovHelp');
  }, 900);
}
$('hLogo').src = titleURL('REMPART');
$('hTitleScr').addEventListener('click', enterMenu);
