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
let homeOn = false, hcv = null, hctx = null, hP = 3, hAW = 0, hAH = 0, hBG = null, hFG = null, hLay = null;
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
  hBG = B.c; hFG = F.c;
}
function drawHome(dt){
  if (!hBG) buildHome();
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
  $('hEndRec').textContent = bestBy.some(Boolean) ? 'Records : ' + bestBy.join(' / ') : 'Trois tailles de carte';
  const stN = story.stars.reduce((a,b) => a+b, 0);
  $('hSiegeRec').textContent = 'Monde ' + Math.min(story.unlocked, WORLDS.length) + ' sur ' + WORLDS.length + ', ★ ' + stN + '/' + WORLDS.length*3;
  $('hSoundBtn').textContent = prefs.sound ? 'Son : oui' : 'Son : non';
  $('hMusicBtn').textContent = prefs.music ? 'Musique : oui' : 'Musique : non';
  $('hChestBadge').textContent = profile.chests | 0; $('hChestBadge').style.display = (profile.chests | 0) ? '' : 'none';
  renderChestSlots();
  const d0 = fixDeck()[0]; $('htDeck').src = cardArt(d0, Math.max(1, cardBest(d0)), false);
}
function showHome(){
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
$('winMap').addEventListener('click', () => { hide('ovWin'); showHome(); openStoryMap(); });

$('hTitle').src = titleURL('REMPART');
$('hiEndless').src = ENS.boss.url;
$('hiSiege').src = ENS.dragon.url;
$('hProfile').addEventListener('click', () => { audio(); openProfile(); });
$('hResume').addEventListener('click', () => { audio(); resumeGame(); });
document.querySelectorAll('[data-new]').forEach(b => b.addEventListener('click', () => { audio(); if (b.dataset.new === 'story') openStoryMap(); else openSizeChooser(); }));
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
const CARD_ROLE = ['Mêlée','Distance','Zone','Contrôle','Chaîne','Bloqueur','Feu','Artillerie','Poison','Perforant','Sacré','Anti-air','Perce-armure','Exécution'];
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
  { test:() => pstat.kills >= 3000, txt:() => 'Abats 3 000 monstres au total (' + fmtN(Math.min(3000, pstat.kills)) + '/3 000).' }];
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
  if (hTab === 0){ deckSel = -1; renderDeck(); }
}
$('htPlay').src = BI.sword; $('htMore').src = BI.star;
$('hiCodex').src = BI.scroll; $('hiProfile').src = BI.helm; $('hiHelp').src = BI.banner;
document.querySelectorAll('.htab').forEach(b => b.addEventListener('click', () => { audio(); if (+b.dataset.tab !== hTab) sfx('arrow'); homeTab(+b.dataset.tab); }));
$('hPager').addEventListener('pointerdown', e => { hSwipe = { x:e.clientX, y:e.clientY, id:e.pointerId }; });
window.addEventListener('pointerup', e => {
  const w = hSwipe; hSwipe = null;
  if (!w || e.pointerId !== w.id || !homeOn || document.querySelector('.ov.show:not(.home)') || performance.now() - deckDropT < 80 || deckDrag) return;
  const dx = e.clientX - w.x, dy = e.clientY - w.y;
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
