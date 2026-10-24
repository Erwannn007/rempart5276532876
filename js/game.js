'use strict';

/* =========================================================
   État
   ========================================================= */
let bestBy = [0,0,0];
let S, prefs = { sound:true, music:true, speed:1, auto:false, helped:false }, best = 0, siegeRec = { wins:0, stars:0 }, story = { unlocked:1, stars:[0,0,0,0,0,0,0,0] };
let seen = new Set(), seenEn = new Set(), seenLeg = new Set(), legKills = 0, timeStop = 0, snapshot = null, hasGame = false;
let enemies = [], projs = [], fx = [], queue = [], pendingSpawn = [], spawnT = 0, spawnGap = .8;
let inWave = false, over = false, paused = false, waveTime = 0, herseUsed = false, waveLeaks = 0;
let queueEnt = [], barDrag = null;
let autoT = 0, shake = 0, gateFlash = 0, banner = null, clock = 0;
let drag = null, sel = null, quiet = true, placing = null, trapMap = new Map(), trapSeq = 0;

const mk = (t,l,leg,xp) => ({ t, l, leg: leg || null, xp: xp || 0, cd:0, ab:0, anim:0, face:1, pop:.3, seed:Math.random()*10, syn:null });

function freshGame(mode = 'endless', world = 0, size = 0){
  size = mode === 'endless' ? size : 0;
  setSize(size);
  S = { mode, world, size, bars:[], barStock:SIZES[size].bars, wave:0, gold: mode==='story' ? WORLDS[world].gold : mode==='siege' ? 50 : START_GOLD + SIZE_GOLD[size], lives:20, cost:10,
    board:new Array(COLS*ROWS).fill(null), bench:new Array(BENCH_N).fill(null),
    terrain:new Array(COLS*ROWS).fill(0), biome:0, bless:[], pending:null,
    traps:[], trapBuys:0, shopBuys:{ dyn:0, hill:0, marsh:0, rune:0 },
    legend:null, legendOffer:null, legendSlot:-1, legendPity:0, bossBag:null, streak:0, threat:1 };
}

/* ---------- sauvegarde (une seule clé) ---------- */
function snap(){
  if (inWave || over || !hasGame) return;
  snapshot = { mode:S.mode, world:S.world, wave:S.wave, gold:S.gold, lives:S.lives, cost:S.cost, terrain:S.terrain, biome:S.biome,
    bless:S.bless, pending:S.pending, size:S.size || 0, net:netSave(), bars:(S.bars || []).map(b => [b.i, b.open ? 1 : 0]), barStock:S.barStock | 0, nextE:S.nextE || null,
    traps:S.traps.filter(t => !t.used).map(t => [t.i, t.k]), trapBuys:S.trapBuys, shopBuys:S.shopBuys,
    ult:S.ult || 0, bossBag:S.bossBag, streak:S.streak, threat:threat(), nextQ:S.nextQ || null, legend:S.legend, legendOffer:S.legendOffer, legendSlot:S.legendSlot, legendPity:S.legendPity,
    board:S.board.map(t => t ? [t.t,t.l,t.leg||0,t.xp||0] : 0), bench:S.bench.map(t => t ? [t.t,t.l,t.leg||0,t.xp||0] : 0) };
}
function persist(){
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ v:3, best, bestBy, siege:siegeRec, story, profile, stats:pstat, seen:[...seen], seenEn:[...seenEn], seenLeg:[...seenLeg], prefs, game: (over || !hasGame) ? null : snapshot }));
  } catch(e){}
}
function save(){ snap(); persist(); }
function load(){
  let d = null;
  try { d = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch(e){}
  { const g0 = d && d.game; setSize(g0 && g0.mode === 'endless' ? (g0.size|0) : 0); }
  freshGame('endless', 0, d && d.game && d.game.mode === 'endless' ? (d.game.size|0) : 0);
  if (!d) return;
  best = d.best || 0; seen = new Set((d.seen || []).map(k => (d.v || 1) < 3 ? Math.floor(k/5)*MAXL + k%5 : k)); seenEn = new Set(d.seenEn || []); seenLeg = new Set(d.seenLeg || []);
  if (Array.isArray(d.bestBy)) bestBy = [0,1,2].map(k => d.bestBy[k]|0); else bestBy = [d.best || 0, 0, 0];
  if (d.siege) siegeRec = Object.assign({ wins:0, stars:0 }, d.siege);
  if (d.story){ story.unlocked = Math.max(1, Math.min(WORLDS.length, d.story.unlocked|0)); if (Array.isArray(d.story.stars)) story.stars = WORLDS.map((_,i) => d.story.stars[i]|0); }
  Object.assign(prefs, d.prefs || {});
  if (d.profile) Object.assign(profile, d.profile);
  if (d.stats) Object.assign(pstat, d.stats);
  if (!pstat.legPick) pstat.legPick = {};
  for (const k of ['beaten','ach']) if (!Array.isArray(pstat[k])) pstat[k] = [];
  if (![1,2,3,4,5].includes(prefs.speed)) prefs.speed = 1;
  const g = d.game;
  if (g && Array.isArray(g.board) && g.board.length === COLS*ROWS && (g.lives|0) > 0){
    S.mode = ['siege','story'].includes(g.mode) ? g.mode : 'endless';
    S.world = Math.max(0, Math.min(WORLDS.length-1, g.world|0));
    Object.assign(S, { wave:g.wave|0, gold:g.gold|0, lives:g.lives|0, cost:+g.cost || 10 });
    S.terrain = (Array.isArray(g.terrain) && g.terrain.length === COLS*ROWS) ? g.terrain.map(v => v|0) : new Array(COLS*ROWS).fill(0);
    S.biome = Math.min(BIOMES.length-1, g.biome|0);
    S.bless = Array.isArray(g.bless) ? g.bless.filter(k => blessInfo(k).b) : [];
    S.pending = Array.isArray(g.pending) && g.pending.length ? g.pending.filter(k => blessInfo(k).b) : null;
    S.trapBuys = g.trapBuys|0;
    S.shopBuys = Object.assign({ dyn:0, hill:0, marsh:0, rune:0 }, g.shopBuys || {});
    S.savedPreview = Array.isArray(g.preview) ? g.preview : null;
    S.savedNet = g.net || null;
    S.bars = Array.isArray(g.bars) ? g.bars.filter(a => Array.isArray(a)).map(a => ({ i:a[0], open:!!a[1], hp:null, broken:false })) : [];
    S.barStock = g.barStock != null ? g.barStock|0 : SIZES[S.size].bars;
    S.nextE = Array.isArray(g.nextE) ? g.nextE : null;
    S.savedTraps = Array.isArray(g.traps) ? g.traps : [];
    const okLeg = id => LEGENDS[id] ? id : null;
    S.legend = okLeg(g.legend);
    S.legendOffer = Array.isArray(g.legendOffer) && g.legendOffer.every(id => LEGENDS[id]) ? g.legendOffer : null;
    S.legendSlot = Number.isInteger(g.legendSlot) ? g.legendSlot : -1;
    S.legendPity = g.legendPity|0;
    S.bossBag = Array.isArray(g.bossBag) ? g.bossBag.filter(k => BOSS_POOL.includes(k)) : null;
    S.streak = g.streak|0; S.ult = Math.min(1, +g.ult || 0);
    S.threat = Math.max(.5, +g.threat || 1);
    S.nextQ = Array.isArray(g.nextQ) ? g.nextQ.filter(k => EN[k]) : null;
    S.board = g.board.map(a => a ? mk(a[0],a[1],okLeg(a[2]),a[3]|0) : null);
    S.bench = (g.bench||[]).slice(0,BENCH_N).map(a => a ? mk(a[0],a[1],okLeg(a[2]),a[3]|0) : null);
    while (S.bench.length < BENCH_N) S.bench.push(null);
    hasGame = true;
  }
}

/* =========================================================
   Modificateurs et synergies
   ========================================================= */
function computeMods(){
  const M = baseMods();
  for (const k of (S.bless || [])){ const { b, p } = blessInfo(k); if (b && b.mod) b.mod(M, p); }
  MODS = M;
}
function emptySyn(){ return { dmg:0, rate:0, range:0, splash:0, slow:0, vsSlow:0, zap:0, arrowSlow:0, bombSlow:0, chain:0, list:[] }; }
const NOSYN = emptySyn();
const D4 = [[0,1],[-1,0],[1,0],[0,-1]];
const idx = (c,r) => r*COLS + c;
function neighbors(i){
  const c = i%COLS, r = (i/COLS)|0, out = [];
  for (const [dc,dr] of D4){ const nc=c+dc, nr=r+dr; if (nc>=0 && nr>=0 && nc<COLS && nr<ROWS) out.push(idx(nc,nr)); }
  return out;
}
function synergyFor(t, i, ignore){
  const s = emptySyn(), done = new Set(), mul = MODS.synMul;
  let same = 0;
  for (const j of neighbors(i)){
    const o = S.board[j]; if (!o || o === ignore) continue;
    if (o.t === t){ same++; continue; }
    const k = synKey(t, o.t); if (done.has(k)) continue; done.add(k);
    const sy = SYN[k], f = sy.fx[t];
    for (const key in f) s[key] += f[key] * (key === 'chain' ? 1 : mul);
    s.list.push({ name:sy.name, with:o.t, icon: o.leg ? LURL[o.leg][0] : null, txt:sy.txt[t] });
  }
  if (same){
    s.dmg += FORMATION*same*mul;
    s.list.push({ name:'Formation', with:t, txt:'+' + Math.round(FORMATION*same*mul*100) + ' % de dégâts' });
  }
  return s;
}
function recomputeSyn(){
  for (const tw of S.bench) if (tw) tw.syn = null;
  S.board.forEach((tw,i) => { if (tw) tw.syn = synergyFor(tw.t, i); });
  S.board.forEach((lt,i) => {
    if (!lt || (lt.leg !== 'cesar' && lt.leg !== 'jeanne')) return;
    const c = i%COLS, r = (i/COLS)|0;
    for (let dr=-1; dr<=1; dr++) for (let dc=-1; dc<=1; dc++){
      if (!dc && !dr) continue;
      const nc = c+dc, nr = r+dr; if (nc<0||nr<0||nc>=COLS||nr>=ROWS) continue;
      const o = S.board[idx(nc,nr)]; if (!o || !o.syn) continue;
      if (lt.leg === 'cesar'){ const v = CESAR_AURA[lt.l-1]; o.syn.dmg += v; o.syn.list.push({ name:'Aura de César', icon:LURL.cesar[lt.l-1], txt:'+' + Math.round(v*100) + ' % de dégâts' }); }
      else { const v = JEANNE_AURA[lt.l-1]; o.syn.rate += v; o.syn.list.push({ name:'Inspiration de Jeanne', icon:LURL.jeanne[lt.l-1], txt:'+' + Math.round(v*100) + ' % de cadence' }); }
    }
  });
}
function stats(tw, i){
  const ty = TYPES[tw.t], L = tw.l, sy = tw.syn || NOSYN, M = MODS;
  const lg = tw.leg ? LEGENDS[tw.leg] : null, base = lg || ty;
  const ter = i != null ? S.terrain[i] : 0;
  let dmg = base.dmg*(lg ? LMUL : DMUL)[L-1] * (1+sy.dmg) * M.dmgAll * M.dmgType[tw.t];
  if (L >= 5) dmg *= M.elite;
  if (L < 5 && !lg) dmg *= M.low;
  if (ter === TER.RUNE) dmg *= 1 + RUNE_DMG*M.runeMul;
  const range = base.range + .12*(L-1) + sy.range + M.range + (ter === TER.HILL ? HILL_RANGE : 0);
  const khan = tw.leg === 'gengis' ? Math.min(L === 5 ? .5 : .3, .02*legKills) : 0;
  let rate = base.rate*RMUL[L-1] / (1 + sy.rate + M.rateType[tw.t] + khan);
  if (M.frenzy && inWave) rate = waveTime < 6 ? rate/1.25 : rate*1.1;
  if (buffT > 0){ dmg *= 1 + buffDmg; rate /= 1 + buffRate; }
  if (i != null && ulx.length && inCesarZone(i)){ dmg *= 1.6; rate /= 1.4; }
  return { dmg, range, rate };
}

/* =========================================================
   Terrain et chemin procédural
   ========================================================= */
function shuffle(a){ for (let i=a.length-1;i>0;i--){ const j=Math.random()*(i+1)|0; [a[i],a[j]]=[a[j],a[i]]; } return a; }
const isWalk = i => !!WALK[S.terrain[i]];
const isBuild = i => !!BUILD[S.terrain[i]];

function routeOK(add, rem){
  const occ = i => i===add || (i!==rem && !!S.board[i]) || !WALK[S.terrain[i]];
  const seenB = new Uint8Array(COLS*ROWS), q = [];
  for (let c=0;c<COLS;c++){ const i=idx(c,0); if (!occ(i)){ seenB[i]=1; q.push(i); } }
  while (q.length){
    const i = q.shift(), r = (i/COLS)|0;
    if (r === ROWS-1) return true;
    for (const ni of neighbors(i)){ if (seenB[ni] || occ(ni)) continue; seenB[ni]=1; q.push(ni); }
  }
  return false;
}
function genTerrain(){
  const rnd = n => Math.random()*n|0;
  for (let tries=0; tries<80; tries++){
    const t = new Array(COLS*ROWS).fill(0);
    const spot = () => { for (let k=0;k<50;k++){ const i = idx(rnd(COLS), 1 + rnd(ROWS-2)); if (!t[i]) return i; } return -1; };
    const nObs = 4 + rnd(4);
    for (let k=0;k<nObs;k++){ const i = spot(); if (i>=0) t[i] = Math.random() < .5 ? TER.ROCK : TER.TREE; }
    const nHill = 2 + rnd(2);
    for (let k=0;k<nHill;k++){ const i = spot(); if (i>=0) t[i] = TER.HILL; }
    const nMarsh = 1 + rnd(2);
    for (let k=0;k<nMarsh;k++){
      let i = spot(); if (i<0) continue; t[i] = TER.MARSH;
      const grow = 1 + rnd(3);
      for (let m=0;m<grow;m++){
        const nb = neighbors(i).filter(j => !t[j] && ((j/COLS)|0) > 0 && ((j/COLS)|0) < ROWS-1);
        if (!nb.length) break;
        i = nb[rnd(nb.length)]; t[i] = TER.MARSH;
      }
    }
    const nRune = Math.random() < .35 ? 2 : 1;
    for (let k=0;k<nRune;k++){ const i = spot(); if (i>=0) t[i] = TER.RUNE; }
    S.terrain = t;
    let walkable = 0; for (const v of t) if (WALK[v]) walkable++;
    if (routeOK(-1,-1) && walkable >= COLS*ROWS*.7){ S.biome = rnd(BASE_BIOMES); return; }
  }
  S.terrain = new Array(COLS*ROWS).fill(0); S.biome = 0;
}
function terrainSpots(){
  const lock = NET ? NET.cells : new Set(), out = [];
  for (let i=COLS; i<COLS*(ROWS-1); i++) if (S.terrain[i] === TER.GRASS && !S.board[i] && !lock.has(i)) out.push(i);
  return out;
}
function addTerrain(type, n){
  let added = 0;
  for (const i of shuffle(terrainSpots())){
    if (added >= n) break;
    if (!routeOK(i, -1)) continue;
    S.terrain[i] = type; added++;
    const cx = i%COLS + .5, cy = ((i/COLS)|0) + .5;
    burst(cx, cy, type === TER.RUNE ? '#7fe3ff' : '#9ed36a', 12, 2.5);
    fx.push({ k:'ring', x:cx, y:cy, r:.7, life:.4, max:.4, col:'#fff3c4' });
  }
  renderBG();
}
function weightedDirs(){
  const w = [3, 2, 2, .6];
  return D4.map((d,k) => ({ d, k: Math.pow(Math.random(), 1/w[k]) })).sort((a,b) => b.k-a.k).map(o => o.d);
}
function tryDFS(free){
  const starts = shuffle([...Array(COLS).keys()].filter(c => free(idx(c,0))));
  for (const sc of starts.slice(0,3)){
    const start = idx(sc,0), p = [start], inP = new Set([start]); let steps = 0;
    const rec = cur => {
      if (++steps > 2500) return false;
      const c = cur%COLS, r = (cur/COLS)|0;
      if (r === ROWS-1) return true;
      for (const [dc,dr] of weightedDirs()){
        const nc=c+dc, nr=r+dr;
        if (nc<0||nr<1||nc>=COLS||nr>=ROWS) continue;
        const ni = idx(nc,nr);
        if (!free(ni) || inP.has(ni)) continue;
        let bad = false;
        for (const xi of neighbors(ni)) if (xi!==cur && inP.has(xi)){ bad = true; break; }
        if (bad) continue;
        p.push(ni); inP.add(ni);
        if (rec(ni)) return true;
        p.pop(); inP.delete(ni);
      }
      return false;
    };
    if (rec(start)) return p;
  }
  return null;
}
function bfsPath(free){
  const prev = new Int16Array(COLS*ROWS).fill(-2), q = [];
  for (const c of shuffle([...Array(COLS).keys()])){ const i=idx(c,0); if (free(i)){ prev[i]=-1; q.push(i); } }
  while (q.length){
    const i = q.shift(), r = (i/COLS)|0;
    if (r === ROWS-1){ const out=[]; let k=i; while (k!==-1){ out.push(k); k=prev[k]; } return out.reverse(); }
    for (const ni of shuffle(neighbors(i))){ if (prev[ni]!==-2 || !free(ni)) continue; prev[ni]=i; q.push(ni); }
  }
  return null;
}
const PATH_EVERY = 5;
function overlapRatio(p, set){ if (!set || !set.size) return 0; let n = 0; for (const i of p) if (set.has(i)) n++; return n / p.length; }
/* Nouveau chemin. Il doit s'écarter nettement de l'ancien : on essaie d'abord
   de contourner les soldats, et si ce n'est pas possible on passe à travers
   (les soldats concernés seront déplacés). */
function relocateOff(set){
  let moved = 0, toBench = 0, sold = 0;
  for (const i of set){
    const tw = S.board[i]; if (!tw) continue;
    S.board[i] = null;
    let bestJ = -1, bd = Infinity;
    for (let j=0;j<COLS*ROWS;j++){
      if (S.board[j] || set.has(j) || !isBuild(j)) continue;
      const d = Math.abs(j%COLS - i%COLS) + Math.abs(((j/COLS)|0) - ((i/COLS)|0)) + (S.terrain[j] === TER.GRASS ? 0 : -.1);
      if (d < bd){ bd = d; bestJ = j; }
    }
    if (bestJ >= 0){ S.board[bestJ] = tw; tw.pop = .3; moved++; burst(bestJ%COLS + .5, ((bestJ/COLS)|0) + .5, '#fff3c4', 6, 1.5); continue; }
    const b = S.bench.findIndex(x => !x);
    if (b >= 0){ S.bench[b] = tw; toBench++; continue; }
    if (tw.leg){
      let k = -1; for (let j=0;j<BENCH_N;j++) if (!S.bench[j].leg && (k < 0 || S.bench[j].l < S.bench[k].l)) k = j;
      if (k >= 0){ S.gold += troopSell(S.bench[k]); S.bench[k] = tw; toBench++; sold++; continue; }
    }
    S.gold += troopSell(tw); sold++;
  }
  if (moved || toBench || sold){
    const parts = [];
    if (moved) parts.push(moved + (moved > 1 ? ' soldats déplacés' : ' soldat déplacé'));
    if (toBench) parts.push(toBench + ' en réserve');
    if (sold) parts.push(sold + (sold > 1 ? ' revendus' : ' revendu'));
    setTimeout(() => toast('Nouveau réseau : ' + parts.join(', ')), 300);
    recomputeSyn();
  }
}
function rebuildTraps(){ trapMap = new Map(S.traps.filter(t => !t.used).map(t => [t.i, t])); }
/* =========================================================
   Réseau de routes : plusieurs entrées, une porte, des carrefours
   ========================================================= */
const SIZES = [
  { name:'Facile',    cols:7,  rows:10, ents:1, bars:0, links:0, desc:'La carte d’origine : un seul chemin.' },
  { name:'Moyen',     cols:9,  rows:13, ents:2, bars:2, links:1, desc:'Deux entrées, des routes qui se croisent, deux barricades.' },
  { name:'Difficile', cols:11, rows:16, ents:3, bars:3, links:2, desc:'Trois entrées, un réseau de carrefours, trois barricades.' }
];
function setSize(sz){
  const Z = SIZES[sz] || SIZES[0];
  COLS = Z.cols; ROWS = Z.rows;
  ART_W = COLS*T; BENCH_Y = ROWS*T + WALL + 2; ART_H = BENCH_Y + T + 2;
}
const INF = 1e9, GONE = -2;
let NET = null;
const cellC = i => ({ x:i%COLS + .5, y:((i/COLS)|0) + .5 });
const netHas = i => !!NET && NET.cells.has(i);

function bfsDist(cells, exit, blocked){
  const d = new Array(COLS*ROWS).fill(INF);
  if (!cells.has(exit)) return d;
  d[exit] = 0; const q = [exit];
  while (q.length){
    const i = q.shift();
    for (const n of neighbors(i)) if (cells.has(n) && d[n] === INF && !blocked(n)){ d[n] = d[i] + 1; q.push(n); }
  }
  return d;
}
const barAt = i => (S.bars || []).find(b => b.i === i) || null;
const barClosed = i => { const b = barAt(i); return !!b && !b.open && !b.broken; };
function recomputeDist(){
  if (!NET) return;
  NET.dist = bfsDist(NET.cells, NET.exit, barClosed);
  NET.distB = bfsDist(NET.cells, NET.exit, () => false);
}
/* Marche aléatoire sans se coller à soi‑même. canJoin(ni) : la case appartient au réseau et on peut s'y raccrocher. */
function routeDFS(start, isGoal, free, canJoin, avoid){
  const p = [start], inP = new Set([start]); let steps = 0;
  const rec = cur => {
    if (++steps > 4000) return false;
    if (isGoal(cur)) return true;
    for (const [dc,dr] of weightedDirs()){
      const nc = cur%COLS + dc, nr = ((cur/COLS)|0) + dr;
      if (nc<0||nr<1||nc>=COLS||nr>=ROWS) continue;
      const ni = idx(nc,nr);
      if (inP.has(ni)) continue;
      if (canJoin(ni)){ p.push(ni); return true; }
      if (!free(ni) || avoid(ni)) continue;
      let bad = false;
      for (const xi of neighbors(ni)) if (xi !== cur && (inP.has(xi) || avoid(xi))){ bad = true; break; }
      if (bad) continue;
      p.push(ni); inP.add(ni);
      if (rec(ni)) return true;
      p.pop(); inP.delete(ni);
    }
    return false;
  };
  return rec(start) ? p : null;
}
function netOK(N){
  const d = bfsDist(N.cells, N.exit, () => false);
  return N.ents.every(e => d[e] < INF);
}
function genNetOnce(free, oldCells){
  const Z = SIZES[S.size || 0], nE = Z.ents;
  const seg = COLS / nE, ents = [];
  for (let k=0;k<nE;k++){
    const lo = Math.max(0, Math.floor(k*seg + (nE > 1 ? .5 : 0))), hi = Math.min(COLS-1, Math.ceil((k+1)*seg - 1 - (nE > 1 ? .5 : 0)));
    const opts = []; for (let c=lo;c<=hi;c++) if (free(idx(c,0))) opts.push(idx(c,0));
    if (!opts.length) return null;
    ents.push(opts[Math.random()*opts.length|0]);
  }
  const cells = new Set();
  const first = routeDFS(ents[0], cur => ((cur/COLS)|0) === ROWS-1, free, () => false, () => false);
  if (!first) return null;
  first.forEach(i => cells.add(i));
  const exit = first[first.length-1];
  const minJoin = Math.floor(ROWS*.35);
  for (let k=1;k<nE;k++){
    const r = routeDFS(ents[k], () => false, free,
      ni => cells.has(ni) && ((ni/COLS)|0) >= minJoin,
      ni => cells.has(ni) && ((ni/COLS)|0) < minJoin);
    if (!r) return null;
    r.forEach(i => cells.add(i));
  }
  for (let k=0;k<Z.links;k++){
    const pool = [...cells].filter(i => { const r = (i/COLS)|0; return r >= ROWS*.25 && r <= ROWS*.75 && neighbors(i).some(n => !cells.has(n) && free(n)); });
    let made = false;
    for (let t=0;t<12 && !made;t++){
      const A = pool[Math.random()*pool.length|0]; if (A == null) break;
      const dA = bfsDist(cells, A, () => false);
      const r = routeDFS(A, () => false, free, ni => cells.has(ni) && dA[ni] >= 5 && dA[ni] < INF, ni => cells.has(ni) && ni !== A && dA[ni] < 5);
      if (r && r.length >= 3){ r.forEach(i => cells.add(i)); made = true; }
    }
  }
  const N = { cells, ents, exit };
  if (!netOK(N)) return null;
  if (cells.size > COLS*ROWS*.42) return null;
  return N;
}
/* Nouveau réseau. Il doit s'écarter de l'ancien, et contourne les soldats si possible. */
function genNet(oldCells){
  let best = null, bs = Infinity;
  for (const freeFn of [i => !S.board[i] && isWalk(i), i => isWalk(i)]){
    for (let a=0;a<30;a++){
      const N = genNetOnce(freeFn, oldCells); if (!N) continue;
      let ov = 0; if (oldCells) for (const i of N.cells) if (oldCells.has(i)) ov++;
      const cross = [...N.cells].filter(i => S.board[i]).length;
      const sc = (oldCells ? ov / N.cells.size * 60 : 0) + cross*12 + Math.random()*4;
      if (sc < bs){ bs = sc; best = N; }
    }
    if (best && (!oldCells || [...best.cells].filter(i => oldCells.has(i)).length / best.cells.size <= .5)) break;
  }
  if (!best){
    const p = bfsPath(i => isWalk(i));
    best = { cells:new Set(p), ents:[p[0]], exit:p[p.length-1] };
  }
  return best;
}
function setNet(N, relocate){
  NET = N;
  if (relocate) relocateOff(NET.cells);
  S.bars = (S.bars || []).filter(b => NET.cells.has(b.i) && !NET.ents.includes(b.i) && b.i !== NET.exit);
  recomputeDist();
  renderBG();
}
function makeNet(oldCells){
  const lost = (S.bars || []).length;
  S.bars = [];
  setNet(genNet(oldCells), true);
  if (lost && oldCells) setTimeout(() => toast('Nouveau réseau : tes barricades sont revenues en stock'), 900);
}
function restoreNet(o){
  if (!o || !Array.isArray(o.cells) || !Array.isArray(o.ents)) return false;
  const cells = new Set(o.cells);
  for (const i of cells) if (!(i >= 0 && i < COLS*ROWS) || S.board[i] || !isWalk(i)) return false;
  if (!cells.has(o.exit) || ((o.exit/COLS)|0) !== ROWS-1) return false;
  if (!o.ents.every(e => cells.has(e) && ((e/COLS)|0) === 0)) return false;
  const N = { cells, ents:o.ents.slice(), exit:o.exit };
  if (!netOK(N)) return false;
  setNet(N, false);
  return true;
}
const netSave = () => NET ? { cells:[...NET.cells], ents:NET.ents, exit:NET.exit } : null;

/* ---------- déplacement des monstres ---------- */
const isBrute = e => { const B = EN[e.k]; return !!B.boss || (B.atk || 0) >= 1; };
function chooseNext(e){
  if (e.cell === NET.exit) return GONE;
  const B = EN[e.k], ignore = B.fly || isBrute(e) || NET.dist[e.cell] >= INF;
  const f = ignore ? NET.distB : NET.dist;
  const here = f[e.cell];
  let opts = neighbors(e.cell).filter(n => NET.cells.has(n) && f[n] < here);
  if (!opts.length) opts = neighbors(e.cell).filter(n => NET.cells.has(n) && NET.distB[n] < NET.distB[e.cell]);
  if (!opts.length) return GONE;
  const m = Math.min(...opts.map(n => f[n]));
  const best = opts.filter(n => f[n] === m);
  return best[(e.seedR || 0) % best.length];
}
function moveEnemy(e, step){
  let guard = 0;
  while (step > 1e-6 && guard++ < 10){
    let tx, ty, stopAtBar = false;
    if (e.next === GONE){ const c = cellC(NET.exit); tx = c.x; ty = ROWS + .3; }
    else {
      const c = cellC(e.next); tx = c.x; ty = c.y;
      if (e.cell >= 0 && e.next !== e.cell && barClosed(e.next) && !EN[e.k].fly){
        const a = cellC(e.cell); tx = a.x + (c.x - a.x)*.45; ty = a.y + (c.y - a.y)*.45; stopAtBar = true;
      }
    }
    const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy);
    if (d > 1e-6){ e.vx = dx/d; e.vy = dy/d; }
    if (d <= step){
      e.x = tx; e.y = ty; step -= d;
      if (stopAtBar){ e.bash = barAt(e.next); return; }
      if (e.next === GONE){ e.out = true; return; }
      e.cell = e.next; e.next = chooseNext(e);
    } else { e.x += dx/d*step; e.y += dy/d*step; step = 0; }
  }
}
function remOf(e){
  if (!NET || e.next === GONE) return Math.max(0, ROWS + .3 - e.y);
  const c = cellC(e.next);
  return NET.distB[e.next] + Math.hypot(c.x - e.x, c.y - e.y);
}
/* Après une barricade fermée : ceux qui fonçaient dessus font demi‑tour. */
function rerouteAfterToggle(i){
  recomputeDist();
  for (const e of enemies){
    if (e.dead || e.cell < 0) continue;
    if (e.bash && e.bash.i === i && !barClosed(i)) e.bash = null;
    if (e.next === i && barClosed(i) && !EN[e.k].fly && !isBrute(e) && NET.dist[e.cell] < INF){ e.next = e.cell; e.bash = null; }
  }
}
function canClose(i){
  const blocked = n => n === i || barClosed(n);
  const d = bfsDist(NET.cells, NET.exit, blocked);
  return NET.ents.every(e => d[e] < INF);
}
function barSpot(i){ return NET.cells.has(i) && !NET.ents.includes(i) && i !== NET.exit && !barAt(i) && !trapMap.has(i); }
function dropBar(d){
  const ref = refAt(d.x, d.y - CS*.45);
  if (ref && ref.k === 'b' && barSpot(ref.i)){ d.b.i = ref.i; d.b.open = true; recomputeDist(); sfx('build'); }
  else if (!ref || ref.k !== 'b'){ S.bars = S.bars.filter(b => b !== d.b); S.barStock++; recomputeDist(); toast('Barricade rangée : ' + S.barStock + ' en stock'); sfx('sell'); }
  else { toast('Une barricade se pose sur une route, hors entrée et porte'); sfx('bad'); }
  save();
}
function toggleBar(b){
  if (b.broken){ toast('Barricade en morceaux : elle sera réparée après la vague'); sfx('bad'); return; }
  if (b.open && !canClose(b.i)){ toast('Impossible : il faut laisser un passage à chaque entrée'); sfx('bad'); return; }
  b.open = !b.open;
  const c = cellC(b.i); burst(c.x, c.y, '#c9a27a', 8, 2);
  sfx(b.open ? 'sell' : 'clang');
  rerouteAfterToggle(b.i);
  save();
}
const barMaxHp = () => waveHP(Math.max(1, S.wave)) * 3;
/* Chemin que suit une vague depuis une entrée (pour l'aperçu). */
function flowFrom(ent){
  const pts = [{ x:ent%COLS + .5, y:-.5 }]; let cur = ent, g = 0;
  while (cur !== NET.exit && g++ < 200){
    pts.push(cellC(cur));
    const f = NET.dist[cur] < INF ? NET.dist : NET.distB;
    const n = neighbors(cur).filter(x => NET.cells.has(x) && f[x] < f[cur]).sort((a,b) => f[a] - f[b])[0];
    if (n == null) break; cur = n;
  }
  pts.push(cellC(NET.exit)); pts.push({ x:NET.exit%COLS + .5, y:ROWS + .3 });
  const cum = [0]; for (let k=1;k<pts.length;k++) cum.push(cum[k-1] + Math.hypot(pts[k].x-pts[k-1].x, pts[k].y-pts[k-1].y));
  return { pts, cum, len:cum[cum.length-1] };
}
function alongFlow(F, d){
  let k = 0; while (k < F.pts.length - 2 && F.cum[k+1] < d) k++;
  const a = F.pts[k], b = F.pts[k+1], L = F.cum[k+1] - F.cum[k], t = L ? Math.min(1, Math.max(0, (d - F.cum[k]) / L)) : 0;
  return { x:a.x + (b.x - a.x)*t, y:a.y + (b.y - a.y)*t };
}
function nearestNetCell(x, y){
  let best = NET.exit, bd = Infinity;
  for (const i of NET.cells){ const c = cellC(i), q = (c.x-x)**2 + (c.y-y)**2; if (q < bd){ bd = q; best = i; } }
  return best;
}
/* Remonte le réseau vers une entrée (pour les charges des ultimes). */
function upstreamFrom(i, n = 14){
  const out = [i]; let cur = i;
  for (let k=0;k<n;k++){
    const up = neighbors(cur).filter(x => NET.cells.has(x) && NET.distB[x] === NET.distB[cur] + 1 && !out.includes(x));
    if (!up.length) break; cur = up[Math.random()*up.length|0]; out.push(cur);
  }
  return out.map(cellC);
}
/* Répartition d'une vague entre les entrées : chaque espèce arrive par une entrée. */
function assignEntrances(q){
  const n = NET ? NET.ents.length : 1;
  if (n <= 1) return q.map(() => 0);
  const home = {}, seen = {};
  shuffle([...new Set(q)]).forEach((k, j) => { home[k] = (j + (Math.random()*n|0)) % n; });
  return q.map(k => {
    if (EN[k].boss || k === 'goblin') return Math.random()*n|0;
    const c = seen[k] = (seen[k] || 0) + 1;
    const block = Math.floor((c - 1) / 5);
    return block === 0 ? home[k] : (home[k] + block + (Math.random() < .3 ? 1 : 0)) % n;
  });
}
