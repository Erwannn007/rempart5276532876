'use strict';

/* =========================================================
   Vagues
   ========================================================= */
let NMAX = 70, BOSS_HPM = .6, WAVE_W = 1.15, waveNorm = 1, KE_RAMP = 25;
let SIZE_GOLD = [0, 40, 80], SIZE_EARLY = .2;
let HPG = [1.17, 1.10, 20], GOLDW = 6, EARLY = [1, 12], START_GOLD = 40;
const blessEvery = () => finiteMode() ? 4 : 5;
function waveHP(w){
  if (S.mode === 'story') w += WORLDS[S.world].off;
  const early = w >= EARLY[1] ? 1 : EARLY[0] + (1 - EARLY[0]) * (w - 1) / (EARLY[1] - 1);
  const bigEarly = S.mode === 'endless' && S.size ? 1 - SIZE_EARLY*S.size*Math.max(0, (15 - w)/14) : 1;
  return Math.round(waveHPraw(w) * early * bigEarly);
}
function waveHPraw(w){
  return S.mode === 'siege' ? Math.round(16*Math.pow(1.2, w-1) + 5*w) : Math.round(16*Math.pow(HPG[0], Math.min(w,HPG[2])-1)*Math.pow(HPG[1], Math.max(0, w-HPG[2])) + 4*w);
}
const BOSS_MIN_WAVE = { dragon:20, titan:15, vampire:15 };
function nextBoss(w){
  if (!Array.isArray(S.bossBag) || !S.bossBag.length) S.bossBag = shuffle(BOSS_POOL.slice());
  const i = S.bossBag.findIndex(k => (BOSS_MIN_WAVE[k] || 0) <= w);
  if (i < 0) return 'boss';
  return S.bossBag.splice(i, 1)[0];
}
/* Pic, respiration, pic : la vague qui suit un boss souffle, puis la pression remonte jusqu'au boss suivant. */
let PACE = [1, .92, .97, 1.03, 1.08];
/* Les deux espèces mises en avant n'ont jamais la même défense (pas de vague « tout blindé »). */
const trait = k => { const B = EN[k]; return B.fly ? 'fly' : B.armor >= .3 ? 'armor' : B.mres >= .3 ? 'mres' : 'none'; };
function pickTheme(avail){
  const sh = shuffle(avail.slice()), out = [];
  for (const k of sh){ if (out.length >= 2) break; if (out.length && trait(k) !== 'none' && trait(k) === trait(out[0])) continue; out.push(k); }
  return out;
}
const wavePace = w => w <= 10 ? 1 : PACE[w % 5];
function makeStoryWave(w){
  const W = WORLDS[S.world], q = [], last = w >= W.waves;
  const ew = w + W.off, n = Math.round(Math.min(8 + Math.floor(ew*1.5), NMAX) * wavePace(w));
  const step = Math.max(1, Math.floor(W.waves / (W.mobs.length + 1)));
  const avail = W.mobs.slice(0, Math.min(W.mobs.length, Math.floor((w - 1) / step) + 1));
  const theme = pickTheme(avail);
  for (let i=0;i<n;i++){
    const r = Math.random(); let k = W.base;
    if (theme.length && r < .45) k = theme[Math.random()*theme.length|0];
    else if (avail.length && r < .62) k = avail[Math.random()*avail.length|0];
    q.push(k);
    if (k === 'spider' && i < n-1){ q.push('spider'); i++; }
  }
  if (last) q.push(...W.finals);
  else if (w % 5 === 0){
    const pool = BOSS_POOL.filter(b => !W.finals.includes(b) && b !== 'boss');
    q.push(pool[Math.random()*pool.length|0]);
  }
  if (w >= 3 && Math.random() < (MODS.bounty ? .6 : .2)) q.splice(2 + (Math.random()*(q.length-2)|0), 0, 'goblin');
  return q;
}
function makeWave(w){
  if (S.mode === 'story') return makeStoryWave(w);
  const q = [], siege = S.mode === 'siege';
  const n = Math.round(Math.min(8 + Math.floor(w*1.5), NMAX) * wavePace(w));
  const avail = MONSTER_UNLOCK.filter(([k, from]) => w >= (siege ? Math.ceil(from*.7) : from)).map(a => a[0]);
  const theme = pickTheme(avail), thS = Math.min(.5, .2 + w*.012);
  for (let i=0;i<n;i++){
    const r = Math.random(); let k = 'slime';
    if (theme.length && r < thS) k = theme[Math.random()*theme.length|0];
    else if (avail.length && r < thS + .2) k = avail[Math.random()*avail.length|0];
    q.push(k);
    if (k === 'spider' && i < n-1){ q.push('spider'); i++; }
  }
  if (w % 5 === 0){
    if (siege && w === SIEGE_WAVES) q.push('bigslime','bigslime','king');
    else { const b = nextBoss(w), cnt = siege ? 1 : 1 + Math.floor(w/30); for (let c=0;c<cnt;c++) q.push(b); }
  }
  const gob = w >= 3 ? (MODS.bounty ? .6 : .2) : 0;
  if (Math.random() < gob) q.splice(2 + (Math.random()*(q.length-2)|0), 0, 'goblin');
  return q;
}
/* ---------- menace : les ennemis s'adaptent aux résultats du joueur ---------- */
/* Après chaque vague, on regarde la part du chemin qui restait au monstre le plus avancé.
   Vague écrasée loin de la porte : la suivante est plus solide. Seules de vraies fuites l'adoucissent,
   et jamais sous keep × son record (pas de triche en défendant à la porte ou en laissant passer exprès).
   Les boss ont leur propre menace, mesurée sur eux seuls : un boss qui frôle la porte ne doit pas
   faire croire que les monstres ordinaires, eux, ont résisté.
   La menace multiplie la vie des ennemis, et leurs coups par sa racine carrée. */
/* steps / boss : [part du chemin qui restait au plus avancé, multiplicateur], du plus facile au plus serré.
   Les monstres meurent souvent d'un coup : il faut de gros paliers pour rattraper une armée fusionnée.
   hard : la menace la plus haute où le joueur a peiné (fuites, ou un monstre passé sous hard × le chemin).
   near : arrivée à near[0] × ce niveau, elle ne monte plus que de near[1] au plus (pas de bond qui fait tout déborder). */
let THREAT = { from:5, keep:.75, leak:[.07, 3], hard:.35, near:[.9, 1.10],
  steps:[[.9, 1.35], [.75, 1.2], [.55, 1.1], [.35, 1.04], [0, 1]],
  boss:[[.85, 1.15], [.65, 1.10], [.4, 1.05], [0, 1]],
  endless:[.75, 50], story:[1, 1.5] };
let waveMinRem = INF, waveBossRem = INF, waveBossLeaks = 0;
const threat = () => S.threat || 1;
const bossThreat = () => S.bossThreat || 1;
function nudgeThreat(cur, peak, hard, far, leaks, steps, lo, hi){
  const C = THREAT;
  let k = leaks ? 1 - C.leak[0] * Math.min(leaks, C.leak[1]) : steps.find(([f]) => far >= f)[1];
  if (k > 1 && hard && cur >= hard * C.near[0]) k = Math.min(k, C.near[1]);
  if (leaks || far < C.hard) hard = Math.max(hard || 0, cur);
  const next = Math.max(Math.min(cur, Math.max(lo, (peak || 1) * C.keep)), Math.min(hi, cur * k));
  return [next, Math.max(peak || 1, next), hard || 0];
}
function updThreat(){
  if (S.mode === 'siege' || S.wave < THREAT.from || !NET) return 1;
  const C = THREAT, [lo, hi] = C[S.mode === 'story' ? 'story' : 'endless'];
  const path = Math.max(1, Math.min(...NET.ents.map(i => NET.distB[i] + 1)));
  const before = threat(), leaks = waveLeaks - waveBossLeaks;
  if (waveMinRem < INF || leaks) [S.threat, S.threatPeak, S.threatHard] = nudgeThreat(before, S.threatPeak, S.threatHard, Math.min(1, waveMinRem / path), leaks, C.steps, lo, hi);
  if (waveBossRem < INF || waveBossLeaks) [S.bossThreat, S.bossPeak, S.bossHard] = nudgeThreat(bossThreat(), S.bossPeak, S.bossHard, Math.min(1, waveBossRem / path), waveBossLeaks, C.boss, lo, hi);
  return S.threat / before;
}
function startWave(){
  if (inWave || over || !hasGame) return;
  if (!NET) makeNet(null);
  closeSheet(); stopAim && aiming && stopAim();
  S.wave++;
  const hasNext = Array.isArray(S.nextQ) && S.nextQ.length;
  queue = hasNext ? S.nextQ : makeWave(S.wave);
  queueEnt = (hasNext && Array.isArray(S.nextE) && S.nextE.length === queue.length) ? S.nextE.map(v => Math.min(v|0, NET.ents.length - 1)) : assignEntrances(queue);
  S.nextQ = null; S.nextE = null; spawnT = .3; pendingSpawn = []; waveMinRem = waveBossRem = INF; waveBossLeaks = 0;
  for (const b of S.bars) if (b.hp == null) b.hp = barMaxHp();
  { const reg = queue.filter(k => !EN[k].boss && k !== 'goblin'); const wt = reg.reduce((a,k) => a + EN[k].hp, 0);
    waveNorm = reg.length ? Math.max(.5, Math.min(2, reg.length * WAVE_W / wt)) : 1; }
  spawnGap = Math.max(.28, .95 - S.wave*.017);
  inWave = true; autoT = 0; waveTime = 0; herseUsed = false; waveLeaks = 0; legKills = 0;
  if (typeof recruitLevel === 'function' && recruitLevel() > (S.recLvl || 1)){ S.recLvl = recruitLevel(); setTimeout(() => toast('Tes recrues arrivent désormais au niveau ' + S.recLvl), 2400); }
  for (const tw of S.board) if (tw) tw.ab = 0;
  renderBG();
  const siege = S.mode === 'siege';
  let sub = '', col = '#f3e7cc', text = 'Vague ' + S.wave;
  const bk = queue.find(k => EN[k].boss);
  if (S.mode === 'story' && S.wave >= maxWaves()){
    const fs = WORLDS[S.world].finals;
    text = 'Vague finale'; sub = fs.map(k => EN[k].name).join(', puis ') + (fs.length > 1 ? '' : ' approche'); col = '#ff7a62';
  } else if (siege && S.wave === SIEGE_WAVES){ text = 'Vague finale'; sub = 'Le Roi Gluant arrive'; col = '#ff7a62'; }
  else if (bk){ text = EN[bk].name; sub = 'Vague ' + S.wave + '. ' + EN[bk].hint; col = '#ff7a62'; }
  banner = { t:2.2, max:2.2, text, sub, col };
  sfx('wave');
}
function spawn(k, opt = {}){
  const base = EN[k], hpOver = opt.hp;
  let hp = hpOver || waveHP(S.wave) * base.hp * MODS.hpMul * (base.boss || k === 'goblin' ? 1 : waveNorm);
  if (!hpOver && S.mode === 'story' && base.boss && S.wave < maxWaves()) hp *= .6;
  if (!hpOver && base.boss) hp *= BOSS_HPM;
  const thr = base.boss ? bossThreat() : threat();
  if (!hpOver) hp *= thr;
  if (!hpOver && base.boss){ const ew = S.wave + (S.mode === 'story' ? WORLDS[S.world].off : 0); hp *= Math.min(1, .3 + ew*.045); }
  const spdScale = Math.min(1.3, 1 + S.wave*.006);
  let gold = base.gold + Math.floor(S.wave/GOLDW) + MODS.goldKill;
  if (k === 'mini') gold = 1 + MODS.goldKill;
  if (k === 'goblin') gold = Math.round((30 + S.wave*2) * (MODS.bounty ? 1.5 : 1));
  const e = { k, hp, max:hp, spd:base.spd*spdScale, cell:-1, next:-1, rem:99, seedR:Math.random()*8|0, vx:0, vy:1, x:0, y:0, slow:0, slowT:0, stunT:0, flash:0,
    gold, ox:(Math.random()-.5)*.22, dead:false, thr, child:!!opt.from,
    phT: base.phase ? Math.random()*base.phase[0] : 0, ph:false, blT: base.blink || 0, smT: base.summon ? 2 : 0, hlT: 1.5, rage:false };
  if (opt.from){ const f = opt.from; e.x = f.x + (Math.random()-.5)*.2; e.y = f.y; e.cell = f.cell; e.next = f.next; e.bash = f.bash || null; }
  else { const ent = NET.ents[Math.min(opt.ent || 0, NET.ents.length - 1)]; e.x = ent%COLS + .5; e.y = -.7; e.cell = -1; e.next = ent; }
  e.rem = remOf(e);
  enemies.push(e); spawnHP += hp;
  seenEn.add(k);
  if (k === 'goblin'){ toast('Un gobelin d’or !'); sfx('goblin'); }
}
function endWave(){
  inWave = false;
  reviveAll(); ulx = [];
  const bonus = Math.round((8 + S.wave*2) * MODS.waveBonus);
  const intr = MODS.interest ? Math.min(25, Math.floor(S.gold*.1)) : 0;
  S.gold += bonus + intr; addGold(bonus + intr); pstat.waves++;
  if (pstat.waves % CHEST_EVERY === 0) giveChest(pstat.waves + ' vagues repoussées');
  S.streak = waveLeaks === 0 ? (S.streak|0) + 1 : 0; pstat.bestStreak = Math.max(pstat.bestStreak|0, S.streak);
  let regen = false;
  if (MODS.regen && waveLeaks === 0){ S.lives++; regen = true; }
  const dThreat = updThreat();
  if (S.mode === 'endless'){ best = Math.max(best, S.wave); bestBy[S.size || 0] = Math.max(bestBy[S.size || 0], S.wave); }
  if (S.mode === 'siege' && S.wave >= SIEGE_WAVES){ victory(); return; }
  if (S.mode === 'story' && S.wave >= maxWaves()){ storyVictory(); return; }
  const newPath = S.wave % PATH_EVERY === 0;
  let sub = '+' + bonus + ' or';
  if (intr) sub += ', +' + intr + ' d’intérêts';
  if (regen) sub += ', +1 vie';
  if (dThreat > 1.001) sub += ', les monstres se renforcent'; else if (dThreat < .999) sub += ', les monstres faiblissent';
  const lt = S.board.find(t => t && t.leg);
  if (lt && lt.leg === 'cesar' && lt.l === 5){ S.gold += 25; sub += ', +25 or de César'; }
  if (lt && lt.leg === 'jeanne' && livesFree()){
    const n = lt.l >= 5 ? 2 : lt.l >= 3 ? 1 : (S.wave % 2 === 0 ? 1 : 0);
    if (n){ S.lives += n; sub += ', +' + n + (n > 1 ? ' vies' : ' vie') + ' de Jeanne'; }
  }
  if (newPath) sub += ', nouveau chemin';
  banner = { t: newPath ? 2.6 : 2, max: newPath ? 2.6 : 2, text:'Vague ' + S.wave + ' repoussée', sub, col:'#f2c14e' };
  sfx('clear');
  S.traps = []; S.trapBuys = 0; rebuildTraps();
  for (const b of S.bars){ b.broken = false; b.hp = null; }
  if (newPath || !NET) makeNet(NET ? NET.cells : null); else { recomputeDist(); renderBG(); }
  if (!(finiteMode() && S.wave >= maxWaves())){ S.nextQ = makeWave(S.wave + 1); S.nextE = assignEntrances(S.nextQ); }
  if (S.wave % blessEvery() === 0) S.pending = drawBless(3);
  save();
  if (S.pending) setTimeout(openBless, 1100);
  if (prefs.auto) autoT = 1.6;
}
function leak(e){
  const dmg = EN[e.k].dmg;
  if (!dmg){ toast('Le gobelin s’est enfui avec son or'); return; }
  if (MODS.herse && !herseUsed){
    herseUsed = true; gateFlash = .35; toast('La herse a retenu un ennemi'); sfx('bad'); return;
  }
  waveLeaks++; if (EN[e.k].boss) waveBossLeaks++;
  S.lives = Math.max(0, S.lives - dmg);
  shake = .25; gateFlash = .35; sfx('leak');
  const el = $('sLives'); el.classList.remove('hurt'); void el.offsetWidth; el.classList.add('hurt');
  if (S.lives <= 0) gameOver();
}
function gameOver(){
  over = true; inWave = false; hasGame = false;
  if (S.mode === 'endless') best = Math.max(best, S.wave - 1);
  snapshot = null; persist();
  sfx('over');
  const done = Math.max(0, S.wave - 1);
  const fell = 'Tombé pendant la vague ' + S.wave + '.';
  $('overRetry').style.display = S.mode === 'story' ? '' : 'none';
  if (S.mode === 'story'){
    const W = WORLDS[S.world];
    $('overWave').textContent = done + '/' + W.waves;
    $('overSub').textContent = (done > 1 ? 'vagues tenues' : 'vague tenue') + ' dans : ' + W.name + '. ' + fell;
    $('overRetry').onclick = () => { hide('ovOver'); newGame('story', S.world); };
  } else if (S.mode === 'siege'){
    $('overWave').textContent = done + '/' + SIEGE_WAVES;
    $('overSub').textContent = (done > 1 ? 'vagues tenues' : 'vague tenue') + ' pendant le siège. ' + fell;
  } else {
    $('overWave').textContent = done;
    $('overSub').textContent = (done > 1 ? 'vagues repoussées. ' : 'vague repoussée. ') + fell + ' Record : ' + best + '.';
  }
  setTimeout(() => show('ovOver'), 700);
}
function storyVictory(){
  over = true; hasGame = false;
  const w = S.world, W = WORLDS[w], stars = S.lives >= 18 ? 3 : S.lives >= 10 ? 2 : 1;
  const first = story.unlocked <= w + 1 && w + 1 < WORLDS.length;
  if (!(story.stars[w] > 0)) giveChest(W.name + ' libéré');
  story.stars[w] = Math.max(story.stars[w]|0, stars);
  story.unlocked = Math.max(story.unlocked, Math.min(WORLDS.length, w + 2));
  snapshot = null; persist();
  sfx('win');
  burst(COLS/2, ROWS/2, '#f2c14e', 40, 5);
  $('winTitle').textContent = W.name;
  $('winStars').innerHTML = [0,1,2].map(k => `<img class="px${k < stars ? '' : ' off'}" src="${STAR_URL}" alt="">`).join('');
  $('winSub').textContent = (w === WORLDS.length - 1 ? 'Le Trône noir est tombé ! ' : 'Monde libéré ! ') + 'Il te reste ' + S.lives + (S.lives > 1 ? ' vies.' : ' vie.') + (first ? ' Nouveau monde débloqué : ' + WORLDS[w+1].name + '.' : w === WORLDS.length - 1 ? ' Tu as terminé l’histoire.' : '');
  $('winNext').style.display = w + 1 < WORLDS.length ? '' : 'none';
  $('winNext').textContent = w + 1 < WORLDS.length ? 'Monde suivant : ' + WORLDS[w+1].name : '';
  $('winNext').onclick = () => { hide('ovWin'); newGame('story', w + 1); };
  $('winMap').style.display = '';
  setTimeout(() => show('ovWin'), 1200);
}
function victory(){
  $('winTitle').textContent = 'Le siège est levé';
  $('winNext').style.display = 'none'; $('winMap').style.display = 'none';
  over = true; hasGame = false;
  const stars = S.lives >= 18 ? 3 : S.lives >= 10 ? 2 : 1;
  siegeRec.wins++; siegeRec.stars = Math.max(siegeRec.stars, stars);
  snapshot = null; persist();
  sfx('win');
  burst(COLS/2, ROWS/2, '#f2c14e', 40, 5);
  $('winStars').innerHTML = [0,1,2].map(k => `<img class="px${k < stars ? '' : ' off'}" src="${STAR_URL}" alt="">`).join('');
  $('winSub').textContent = 'Il te reste ' + S.lives + (S.lives > 1 ? ' vies.' : ' vie.') + ' Sièges gagnés : ' + siegeRec.wins + '.';
  setTimeout(() => show('ovWin'), 1200);
}
function newGame(mode, world = 0, size = 0){
  freshGame(mode, world, size);
  resize();
  ulx = []; aiming = null;
  hasGame = true; pstat.games++;
  enemies = []; projs = []; fx = []; queue = []; pendingSpawn = []; fires = [];
  inWave = false; over = false; banner = null; drag = null; closeSheet();
  NET = null; stopPlacing(); rebuildTraps();
  hideHome();
  genTerrain();
  if (mode === 'story') S.biome = WORLDS[world].biome;
  computeMods(); recomputeSyn();
  makeNet(null);
  S.pending = drawBless(3);
  S.nextQ = makeWave(1); S.nextE = assignEntrances(S.nextQ);
  save(); hud();
  banner = mode === 'story'
    ? { t:2.6, max:2.6, text: WORLDS[world].name, sub: 'Monde ' + (world+1) + ', ' + WORLDS[world].waves + ' vagues', col:'#f2c14e' }
    : { t:2.4, max:2.4, text: mode === 'siege' ? 'Siège' : 'Sans fin', sub: BIOMES[S.biome].name, col:'#f2c14e' };
  setTimeout(openBless, 500);
}

/* =========================================================
   Bénédictions
   ========================================================= */
function drawBless(n){
  const count = {};
  for (const k of S.bless){ const id = String(k).split(':')[0]; count[id] = (count[id] || 0) + 1; }
  const dk = deckTypes(), pool = BLESS.filter(b => (count[b.id] || 0) < (b.max || 1) && (!b.req || b.req()) && (BLESS_TY[b.id] == null || dk.includes(BLESS_TY[b.id])));
  const out = [], used = new Set();
  while (out.length < n){
    const avail = pool.filter(b => !used.has(b.id)); if (!avail.length) break;
    let r = Math.random() * avail.reduce((a,b) => a + RAR[b.rar].w, 0), pick = avail[0];
    for (const b of avail){ r -= RAR[b.rar].w; if (r <= 0){ pick = b; break; } }
    used.add(pick.id);
    out.push(pick.id === 'ecole' ? 'ecole:' + dk[Math.random()*dk.length|0] : pick.id);
  }
  return out;
}
function openBless(){
  if (!S.pending || over || !hasGame) return;
  const lead = S.wave === 0 ? 'Elle durera toute la partie.' : 'Une nouvelle faveur, jusqu’à la fin de la partie.';
  $('blessLead').textContent = lead;
  $('blessCards').innerHTML = S.pending.map((k,n) => {
    const { b } = blessInfo(k), R = RAR[b.rar];
    const had = S.bless.filter(x => String(x).split(':')[0] === b.id).length;
    const tag = (b.max || 1) > 1 ? `, ${had + 1} sur ${b.max}` : '';
    return `<button class="bcard" data-n="${n}" style="--rc:${R.col}">
      <img class="px" src="${blessIcon(k)}" alt="">
      <div><em>${R.name}${tag}</em><b>${blessName(k)}</b><span>${blessDesc(k)}</span></div>
    </button>`;
  }).join('');
  $('blessCards').querySelectorAll('.bcard').forEach(btn => btn.onclick = () => pickBless(+btn.dataset.n));
  show('ovBless');
}
function pickBless(n){
  const key = S.pending && S.pending[n]; if (!key) return;
  const { b, p } = blessInfo(key);
  S.bless.push(key); S.pending = null;
  computeMods();
  if (b.pick) b.pick(p);
  recomputeSyn();
  hide('ovBless');
  sfx('bless');
  toast(blessName(key));
  save(); hud();
}
function openBlessList(){
  const list = $('blBody');
  if (!S.bless.length){ list.innerHTML = '<p class="lead">Aucune pour l’instant.</p>'; }
  else {
    list.innerHTML = S.bless.map(k => {
      const { b } = blessInfo(k), R = RAR[b.rar];
      return `<div class="bl-item"><img class="px" src="${blessIcon(k)}" alt=""><div><b style="color:${R.col}">${blessName(k)}</b><span>${blessDesc(k)}</span></div></div>`;
    }).join('');
  }
  $('blNext').textContent = hasGame ? 'Prochaine bénédiction après la vague ' + (Math.floor(S.wave/blessEvery())+1)*blessEvery() + '.' : '';
  show('ovBlessList');
}
