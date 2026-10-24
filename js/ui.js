'use strict';

/* =========================================================
   Interface DOM
   ========================================================= */
function $(id){ return document.getElementById(id); }
const hudCache = {};
function setTxt(id, v){ if (hudCache[id] !== v){ hudCache[id] = v; $(id).textContent = v; } }
function hud(){
  if (!S) return;
  updUltButton();
  const siege = finiteMode(), MW = maxWaves();
  setTxt('vLives', String(S.lives));
  setTxt('vGold', String(Math.floor(S.gold)));
  const wn = (inWave || over) ? S.wave : Math.min(S.wave + 1, siege ? MW : 1e9);
  setTxt('vWave', siege ? wn + '/' + MW : String(wn));
  const rl = recruitLevel(), rp = recruitPrice();
  setTxt('vCost', rl > 1 ? rp + ' · niv. ' + rl : String(rp));
  $('bRecruit').classList.toggle('poor', S.gold < rp);
  if (over){
    setTxt('vWaveBtn', 'Terminée');
    setTxt('vWaveSub', 'vague ' + S.wave);
  } else if (inWave && legendOnBoard()){
    const v = S.ult || 0;
    setTxt('vWaveBtn', 'Ultime');
    setTxt('vWaveSub', v >= 1 ? '' : Math.round(v*100) + ' %');
  } else if (inWave){
    const left = queue.length + enemies.length + pendingSpawn.length;
    setTxt('vWaveBtn', 'En cours');
    setTxt('vWaveSub', left + (left > 1 ? ' ennemis' : ' ennemi'));
  } else {
    setTxt('vWaveBtn', 'Lancer');
    setTxt('vWaveSub', (siege && S.wave + 1 >= MW) ? 'vague finale' : 'vague ' + (S.wave + 1));
  }
  const ultMode = inWave && !over && !!legendOnBoard();
  $('bWave').classList.toggle('busy', (inWave && !ultMode) || over);
  $('bAuto').classList.toggle('on', !!prefs.auto);
  setTxt('bSpeed', '×' + prefs.speed);
}
let toastT = 0;
function toast(msg){
  const el = $('toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 1600);
}
function show(id){ $(id).classList.add('show'); }
function hide(id){ $(id).classList.remove('show'); }
const anyOverlay = () => !!document.querySelector('.ov.show');

/* ---------- emplacements ---------- */
function getT(ref){ return ref.k==='b' ? S.board[ref.i] : ref.k==='n' ? S.bench[ref.i] : null; }
function setT(ref, v){ if (ref.k==='b') S.board[ref.i] = v; else if (ref.k==='n') S.bench[ref.i] = v; }
const sameRef = (a,b) => a && b && a.k===b.k && a.i===b.i;
function refAt(x, y){
  const bx = (x-ox)/CS, by = (y-oy)/CS;
  if (bx < 0 || bx >= COLS) return null;
  if (by >= 0 && by < ROWS) return { k:'b', i: idx(bx|0, by|0) };
  const benchTop = BENCH_Y/T;
  if (by >= benchTop - .15 && by < benchTop + 1.25){ const c = bx|0; return c < BENCH_N ? { k:'n', i:c } : c === BENCH_N ? { k:'sell' } : null; }
  return null;
}
function markSeen(t, l){
  const key = t*MAXL + l - 1;
  if (!seen.has(key)){ seen.add(key); if (l > 1 && !quiet) setTimeout(() => toast('Nouveau : ' + TYPES[t].ranks[l-1]), 250); }
}
/* Sur la route, seul un gardien nain peut se poster, entre les vagues. */
const onRoad = ref => ref.k === 'b' && netHas(ref.i);
function roadWhy(tw, i){
  if (!isWarden(tw)) return 'Seul le gardien nain peut se poster sur la route';
  if (inWave) return 'Le gardien se poste sur la route entre les vagues';
  if (!wardSpot(i)) return 'Ni sur une entrée, ni devant la porte';
  if (barAt(i) || trapMap.has(i)) return 'La place est déjà prise';
  return '';
}
function evalDrop(src, dst){
  if (!dst || sameRef(src,dst)) return { ok:false, none:true };
  const a = getT(src);
  if (dst.k === 'sell') return a.leg ? { ok:false, why:'Une légende ne se vend pas' } : { ok:true, kind:'sell' };
  const b = getT(dst);
  if (b && (b.t !== a.t || !!a.leg !== !!b.leg)){
    const offer = !!a.leg !== !!b.leg && (a.leg ? b : a).l >= (a.leg ? a : b).l + OFFER_GAP;
    const w = (onRoad(dst) && roadWhy(offer ? (a.leg ? a : b) : a, dst.i)) || (!offer && onRoad(src) && roadWhy(b, src.i));
    if (w) return { ok:false, why:w };
  }
  if (b && (a.leg || b.leg)){
    if (!(a.leg && b.leg)){
      const lg = a.leg ? a : b, so = a.leg ? b : a;
      if (so.l >= lg.l + OFFER_GAP){
        if (lg.l >= 5) return { ok:false, why:'Ta légende est déjà au sommet' };
        return { ok:true, kind:'offer' };
      }
    }
    return { ok:true, kind:'swap' };
  }
  if (b){
    if (b.t===a.t && b.l===a.l){
      if (a.l >= MAXL) return { ok:false, why:'Niveau maximum déjà atteint' };
      return { ok:true, kind:'merge' };
    }
    if (b.t===a.t && Math.max(a.l, b.l) < MAXL) return { ok:true, kind:'absorb' };
    return { ok:true, kind:'swap' };
  }
  if (dst.k === 'b'){
    const tt = S.terrain[dst.i];
    if (netHas(dst.i)){
      if (!isWarden(a)) return { ok:false, why:'Une route passe ici jusqu’au prochain changement' };
      const w = roadWhy(a, dst.i);
      return w ? { ok:false, why:w } : { ok:true, kind:'move' };
    }
    if (!BUILD[tt]) return { ok:false, why:TER_WHY[tt] };
    if (!routeOK(dst.i, src.k==='b' ? src.i : -1)) return { ok:false, why:'Il faut laisser un passage aux ennemis' };
  }
  return { ok:true, kind:'move' };
}
function dropPreview(src, dst, r){
  if (!r.ok || !dst || dst.k !== 'b' || (r.kind !== 'move' && r.kind !== 'swap')) return { links:null, names:null };
  const a = getT(src), names = [], links = [], seenK = new Set();
  for (const j of neighbors(dst.i)){
    if (src.k === 'b' && j === src.i) continue;
    const o = S.board[j]; if (!o || o === a) continue;
    const p = linkPos(dst.i, j);
    const lk = synLink(a.t, o.t); if (!lk) continue;
    links.push({ x:p.x, y:p.y, col:lk.col });
    const nm = lk.name;
    if (!seenK.has(nm)){ seenK.add(nm); names.push(nm); }
  }
  return { links, names };
}
function applyDrop(src, dst, r){
  const a = getT(src);
  if (r.kind === 'sell'){
    const v = troopSell(a); S.gold += v; setT(src, null);
    const { X, Y } = cellXY(dst);
    fx.push({ k:'t', x:(X-ox)/CS + .5, y:(Y-oy)/CS, s:'+'+v, col:'#f6c94a', life:.9, max:.9 });
    sfx('sell');
  } else if (r.kind === 'merge'){
    const b = getT(dst); pstat.merges++;
    const jump = b.l + 2 <= MAXL && MODS.skip && Math.random() < MODS.skip;
    b.l = Math.min(MAXL, b.l + (jump ? 2 : 1)); b.pop = .35; b.cd = 0; setT(src, null);
    b.xp = (b.xp || 0) + (a.xp || 0); xpLevel(b); b.hp = null; b.ko = false;
    if (jump) markSeen(b.t, b.l-1);
    markSeen(b.t, b.l);
    const { X, Y } = cellXY(dst), cx = (X-ox)/CS + .5, cy = (Y-oy)/CS + .5;
    burst(cx, cy, TYPES[b.t].col, 14, 3); burst(cx, cy, '#fff3c4', jump ? 18 : 8, 2.5);
    fx.push({ k:'ring', x:cx, y:cy, r:.7, life:.35, max:.35, col:'#fff3c4' });
    fx.push({ k:'t', x:cx, y:cy-.6, s:(jump ? 'Bond ! Niv. ' : 'Niv. ') + b.l, col: b.l===5 || jump ? '#f2c14e' : '#f3e7cc', life:1, max:1, big:true });
    sfx('merge');
  } else if (r.kind === 'absorb'){
    const b = getT(dst), hi = a.l > b.l ? a : b, lo = hi === a ? b : a;
    setT(src, null); setT(dst, hi);
    const gain = (xpNeed(lo.l) + (lo.xp || 0)) * MODS.absorbMul, before = hi.l;
    hi.xp = (hi.xp || 0) + gain; hi.pop = .25; xpLevel(hi);
    pstat.merges++;
    const { X, Y } = cellXY(dst), cx = (X-ox)/CS + .5, cy = (Y-oy)/CS + .5;
    burst(cx, cy, '#7fd6ff', 10, 2.2);
    if (hi.l > before){
      burst(cx, cy, '#fff3c4', 14, 3); fx.push({ k:'ring', x:cx, y:cy, r:.7, life:.35, max:.35, col:'#fff3c4' });
      fx.push({ k:'t', x:cx, y:cy-.6, s:'Niv. ' + hi.l, col:'#f2c14e', life:1, max:1, big:true });
      sfx('merge');
    } else {
      fx.push({ k:'t', x:cx, y:cy-.6, s:'+' + Math.round(gain / xpNeed(hi.l) * 100) + ' %', col:'#7fd6ff', life:.9, max:.9 });
      sfx('recruit');
    }
  } else if (r.kind === 'offer'){
    const b = getT(dst), lgT = a.leg ? a : b, so = a.leg ? b : a; pstat.offers++;
    setT(src, null); setT(dst, lgT);
    const from = lgT.l;
    lgT.l = Math.min(5, Math.max(lgT.l + 1, so.l + 1 - OFFER_GAP)); lgT.pop = .45; lgT.cd = 0;
    for (let l = from + 1; l <= lgT.l; l++) markSeenLeg(lgT.leg, l);
    const { X, Y } = cellXY(dst), cx = (X-ox)/CS + .5, cy = (Y-oy)/CS + .5;
    burst(cx, cy, '#f2c14e', 22, 3.5); burst(cx, cy, '#fff3c4', 12, 2.5);
    fx.push({ k:'ring', x:cx, y:cy, r:.9, life:.45, max:.45, col:'#f2c14e' });
    fx.push({ k:'t', x:cx, y:cy-.7, s:'Offrande, niv. ' + lgT.l, col:'#f2c14e', life:1.1, max:1.1, big:true });
    banner = { t:2, max:2, text: LEGENDS[lgT.leg].ranks[lgT.l-1], sub: LEGENDS[lgT.leg].name + ', niveau ' + lgT.l, col:'#f2c14e' };
    sfx('offer');
  } else if (r.kind === 'swap'){
    const b = getT(dst); setT(dst, a); setT(src, b);
  } else {
    setT(dst, a); setT(src, null);
  }
  recomputeSyn();
  save();
}

/* ---------- glisser-déposer ---------- */
function toDev(e){ const r = cv.getBoundingClientRect(); return { x:(e.clientX - r.left)*dpr, y:(e.clientY - r.top)*dpr }; }
cv.addEventListener('pointerdown', e => {
  audio();
  if (over || !hasGame) return;
  const p = toDev(e), ref = refAt(p.x, p.y);
  if (aiming){ aimAt(p); aiming.active = true; try { cv.setPointerCapture(e.pointerId); } catch(_){} return; }
  if (placing){ if (ref && ref.k === 'b') placeAt(ref.i); return; }
  if (ref && ref.k === 'b' && barAt(ref.i)){
    barDrag = { b:barAt(ref.i), sx:p.x, sy:p.y, x:p.x, y:p.y, moved:false };
    try { cv.setPointerCapture(e.pointerId); } catch(_){}
    return;
  }
  if (ref && ref.k !== 'sell' && getT(ref)){
    drag = { ref, troop:getT(ref), x:p.x, y:p.y, sx:p.x, sy:p.y, moved:false, over:null, eval:{ok:false} };
    try { cv.setPointerCapture(e.pointerId); } catch(_){}
  } else {
    closeSheet();
    if (ref && ref.k === 'b'){
      const tt = S.terrain[ref.i], tr = trapMap.get(ref.i);
      if (tr) toast(TRAPS[tr.k].name + (tr.k === 'givre' && tr.cd > 0 ? ' : se recharge' : ' : posé pour cette vague'));
      else if (tt === TER.HILL) toast('Colline : un soldat posté ici gagne +0,6 de portée');
      else if (tt === TER.RUNE) toast('Pierre runique : +' + Math.round(RUNE_DMG*MODS.runeMul*100) + ' % de dégâts pour le soldat posté ici');
      else if (tt === TER.MARSH) toast('Marais : les ennemis y avancent 30 % moins vite');
    } else if (ref && ref.k === 'n') toast('Touche Recruter pour remplir la réserve');
  }
});
cv.addEventListener('pointermove', e => {
  if (aiming && aiming.active){ aimAt(toDev(e)); return; }
  if (barDrag){ const p = toDev(e); barDrag.x = p.x; barDrag.y = p.y; if (!inWave && Math.hypot(p.x - barDrag.sx, p.y - barDrag.sy) > 9*dpr) barDrag.moved = true; return; }
  if (!drag) return;
  const p = toDev(e); drag.x = p.x; drag.y = p.y;
  if (!drag.moved && Math.hypot(p.x-drag.sx, p.y-drag.sy) > 9*dpr){ drag.moved = true; closeSheet(); }
  if (drag.moved){
    if (getT(drag.ref) !== drag.troop){ drag = null; return; }
    drag.over = refAt(p.x, p.y - CS*.45);
    drag.eval = drag.over ? evalDrop(drag.ref, drag.over) : { ok:false };
    Object.assign(drag, dropPreview(drag.ref, drag.over, drag.eval));
  }
});
function endDrag(cancel){
  if (!drag) return;
  const d = drag; drag = null;
  if (getT(d.ref) !== d.troop) return;
  if (!d.moved){ if (!cancel) openSheet(d.ref); return; }
  if (cancel || !d.over) return;
  const r = evalDrop(d.ref, d.over);
  if (r.ok) applyDrop(d.ref, d.over, r);
  else if (r.why){ toast(r.why); sfx('bad'); }
}
cv.addEventListener('pointerup', () => {
  if (aiming && aiming.active){ const a = aiming; stopAim(); castAt(a.x, a.y); return; }
  if (barDrag){ const d = barDrag; barDrag = null; if (!d.moved) toggleBar(d.b); else dropBar(d); return; }
  endDrag(false);
});
cv.addEventListener('pointercancel', () => endDrag(true));

/* ---------- fiche ---------- */
function openSheet(ref){
  const tw = getT(ref); if (!tw) return;
  sel = ref;
  const ty = TYPES[tw.t], i = ref.k === 'b' ? ref.i : null, st = stats(tw, i), L = tw.l, LG = tw.leg ? LEGENDS[tw.leg] : null;
  const NP = LG ? 5 : MAXL, PIPC = ['','','','','','#4fc0d4','#ff6a2a','#fff3a0'];
  const pips = Array.from({length:NP}, (_,k) => `<i style="background:${k<L ? (LG ? '#f2c14e' : k>=5 ? PIPC[k] : L>=5 ? '#f2c14e' : ty.col) : ''}"></i>`).join('');
  const next = LG ? (L < 5
    ? `<div class="sh-next"><img class="px" src="${LURL[tw.leg][L]}" alt="">Prochain rang : ${LG.ranks[L]}. Offrande : un soldat de niveau ${L + OFFER_GAP} ou plus. Elle prend le niveau du soldat offert.</div>`
    : `<div class="sh-next">Sommet de sa légende.</div>`)
    : L < MAXL
    ? `<div class="sh-next"><img class="px" src="${URL_[tw.t][L]}" alt="">Fusionné avec un soldat identique, il devient ${ty.ranks[L]}. Il peut aussi absorber un ${ty.name.toLowerCase()} d’un autre niveau pour gagner de l’expérience.</div>`
    : `<div class="sh-next">Rang le plus haut de sa lignée.</div>`;
  let syn = '';
  if (i != null){
    const dbl = MODS.synMul > 1 ? ' (+50 %)' : '';
    const rows = (tw.syn ? tw.syn.list : []).map(s => `<div><img class="px" src="${s.icon || URL_[s.with][0]}" alt=""><span><b>${s.name}</b> : ${s.txt}${s.name === 'Formation' ? '' : dbl}</span></div>`);
    const ter = S.terrain[i];
    if (ter === TER.HILL) rows.push(`<div><img class="px" src="${BI.hill}" alt=""><span><b>Colline</b> : +0,6 de portée</span></div>`);
    if (ter === TER.RUNE) rows.push(`<div><img class="px" src="${BI.rune}" alt=""><span><b>Pierre runique</b> : +${Math.round(RUNE_DMG*MODS.runeMul*100)} % de dégâts</span></div>`);
    syn = `<div class="sh-syn">${rows.length ? rows.join('') : '<span class="dim">Aucune synergie. Poste-le juste à côté d’un autre soldat.</span>'}</div>`;
  }
  $('sheet').innerHTML = `
    <div class="sh-top">
      <img class="px${LG ? ' leg' : ''}" src="${LG ? LURL[tw.leg][L-1] : URL_[tw.t][L-1]}" alt="">
      <div><div class="sh-name">${LG ? LG.ranks[L-1] : ty.ranks[L-1]}</div>
      <div class="sh-sub">${LG ? LG.name + ', légende' : ty.name}, niveau ${L}<span class="pips">${pips}</span></div></div>
    </div>
    <div class="stats">
      <div>Dégâts<b>${Math.round(st.dmg)}</b></div>
      ${isWarden(tw) ? `<div>Vie<b>${Math.round(troopHp(tw))}</b></div>
      <div>Armure<b>${Math.round(wardArmor(tw)*100)} %</b></div>` : `<div>Portée<b>${st.range.toFixed(1)}</b></div>
      <div>Cadence<b>${st.rate.toFixed(2)} s</b></div>`}
    </div>
    ${!LG && L < MAXL ? `<div class="sh-xp"><span>Expérience</span><i><b style="width:${Math.round(Math.min(1,(tw.xp||0)/xpNeed(L))*100)}%"></b></i><small>${fmtXp(tw.xp||0)} / ${xpNeed(L)}</small></div>` : ''}
    ${LG ? `<p class="sh-ult"><b>Ultime : ${LG.ult}.</b> ${LG.ultDesc}</p>` : ''}
    <p class="sh-note">${LG ? LG.power(L) + (ref.k==='n' ? ' En réserve, les légendes ne combattent pas.' : '') : ty.desc + ' ' + specialText(tw.t, L) + (ref.k==='n' ? ' En réserve, il ne combat pas.' : '')}</p>
    <p class="sh-dt">Dégâts ${DT_NAME[TYPE_DT[tw.t]]}${canHitAir(tw.t) ? '. Touche les volants.' : '. Ne touche pas les volants.'}</p>
    ${syn}
    ${next}
    <div class="sh-btns">
      ${LG ? '' : `<button class="btn sell" id="shSell"><img class="px" src="${COIN_URL}" alt="">Vendre ${troopSell(tw)}</button>`}
      <button class="btn" id="shClose">Fermer</button>
    </div>`;
  $('sheet').classList.add('show');
  $('shClose').onclick = closeSheet;
  if (LG) return;
  $('shSell').onclick = () => {
    if (!getT(ref)) return closeSheet();
    applyDrop(ref, { k:'sell' }, { ok:true, kind:'sell' });
    closeSheet();
  };
}
function closeSheet(){ sel = null; $('sheet').classList.remove('show'); }
function specialText(t,l){
  switch(t){
    case 0: return l>=3 ? 'Ses coups touchent aussi les ennemis collés à sa cible (50 %).' : 'Au niveau 3, ses coups toucheront aussi les ennemis voisins.';
    case 1: return l>=4 ? 'Décoche deux flèches sur deux cibles différentes.' : 'Au niveau 4, elle décochera deux flèches à la fois.';
    case 2: return 'Explosion d’un rayon de ' + (TYPES[2].splash + .08*(l-1)).toFixed(1).replace('.', ',') + ' case.';
    case 3: return 'Ralentit de ' + Math.round(Math.min(.6, .3+.07*(l-1)+MODS.slowAdd)*100) + ' %' + (l>=4 ? ', et tout le groupe autour de la cible.' : '. Au niveau 4, le froid touchera tout un groupe.');
    case 4: return 'L’éclair rebondit sur ' + (1+l+MODS.chainAdd) + ' ennemis de plus' + ', en perdant ' + Math.round((1-MODS.decay)*100) + ' % à chaque saut.';
    case 5: return 'Armure : −' + Math.round(WARD.armor[l-1]*100) + ' % de dégâts subis. Les monstres tout proches le frappent en priorité. '
      + (l>=4 ? 'Riposte : renvoie ' + Math.round(WARD.thorns[l-1]*100) + ' % des coups reçus. ' : 'Au niveau 4, il renverra une partie des coups reçus. ')
      + (l>=6 ? 'Toutes les ' + WARD.bashCd + ' s, son bouclier étourdit les monstres qu’il retient.' : 'Au niveau 6, son bouclier étourdira les monstres qu’il retient.')
      + ' Les volants et les fantômes intangibles passent.';
    case 6: return 'Le feu reste ' + fr1(2.4+.15*l) + ' s au sol' + (l>=6 ? ', sur une large zone' : '') + '. '
      + (l>=4 ? 'Ses cibles brûlent encore 3 s.' : 'Au niveau 4, ses cibles brûleront encore 3 s.') + ' Les volants ne marchent pas dans les flammes.';
    case 7: return 'Explosion d’un rayon de ' + fr1(TYPES[7].splash + .06*(l-1)) + ' case. Ne tire pas à moins de ' + fr1(TYPES[7].minRange) + ' case. '
      + (l>=4 ? 'Étourdit les monstres touchés. ' : 'Au niveau 4, elle étourdira. ') + (l>=6 ? 'Ses pierres éclatent en trois éclats.' : 'Au niveau 6, ses pierres éclateront.');
    case 8: return 'Empoisonne 3 s tous les monstres autour de lui, volants compris. '
      + (l>=4 ? 'Ses spores ralentissent de 20 %. ' : 'Au niveau 4, ses spores ralentiront. ') + (l>=6 ? 'Poison 50 % plus fort.' : 'Au niveau 6, son poison sera plus fort.');
    case 9: return 'Le carreau traverse tous les monstres alignés. '
      + (l>=4 ? 'Il ignore la moitié de l’armure. ' : 'Au niveau 4, il ignorera la moitié de l’armure. ') + (l>=6 ? 'Il ralentit chaque monstre touché.' : 'Au niveau 6, il ralentira.');
  }
}

/* ---------- atelier : pièges et terrain ---------- */
const nextWaveN = () => inWave ? S.wave : S.wave + 1;
function trapPrice(k){ const t = TRAPS[k]; return Math.round((t.base + t.per*nextWaveN()) * (1 + .25*S.trapBuys)); }
function landPrice(k){ const l = LAND[k]; return l.base + l.step*(S.shopBuys[k] || 0); }
const barPrice = () => 80 + 60*(S.barBought || 0);
const itemPrice = (kind, id) => kind === 'trap' ? trapPrice(id) : kind === 'bar' ? 0 : landPrice(id);
function placeSpots(kind, id){
  const out = [], lock = NET ? NET.cells : new Set();
  for (let i=0;i<COLS*ROWS;i++){
    const t = S.terrain[i];
    if (kind === 'bar'){ if (NET && barSpot(i)) out.push(i); }
    else if (kind === 'trap'){ if (lock.has(i) && !trapMap.has(i) && !barAt(i) && !S.board[i]) out.push(i); }
    else if (id === 'dyn'){ if (t === TER.ROCK || t === TER.TREE) out.push(i); }
    else if (id === 'marsh'){ if (t === TER.GRASS && !S.board[i] && !trapMap.has(i)) out.push(i); }
    else if (t === TER.GRASS && !lock.has(i) && (S.board[i] || routeOK(i, -1))) out.push(i);
  }
  return out;
}
function openShop(){
  if (!hasGame || over) return;
  closeSheet();
  $('shopLead').innerHTML = `Tu as <b>${Math.floor(S.gold)} or</b>. Les pièges se posent sur le chemin et durent une vague. Le terrain, lui, reste jusqu’à la fin de la partie.`;
  const row = (kind, id, icon, name, desc) => {
    const price = itemPrice(kind, id), spots = placeSpots(kind, id).length;
    const why = !spots ? (kind === 'trap' ? 'Le chemin est déjà couvert' : 'Aucune case possible') : S.gold < price ? 'Il te manque ' + (price - Math.floor(S.gold)) + ' or' : '';
    return `<button class="shop-item${why ? ' off' : ''}" data-kind="${kind}" data-id="${id}" data-why="${why}">
      <img class="px" src="${icon}" alt=""><div><b>${name}</b><span>${desc}</span>${why ? `<small>${why}</small>` : ''}</div>
      <em><img class="px" src="${COIN_URL}" alt="">${price}</em></button>`;
  };
  $('shopBody').innerHTML =
    `<h3 class="cx-h">Pièges</h3><p class="cx-note">${S.trapBuys ? 'Déjà ' + S.trapBuys + ' posé' + (S.trapBuys > 1 ? 's' : '') + ' pour cette vague : chaque piège rend le suivant 25 % plus cher.' : 'Leur prix suit la vague. Chaque piège posé rend le suivant 25 % plus cher, jusqu’à la fin de la vague.'}</p>` +
    TRAP_ORDER.map(k => row('trap', k, TRAP_URL[k], TRAPS[k].name, TRAPS[k].desc)).join('') +
    `<h3 class="cx-h">Recrutement ciblé</h3><p class="cx-note">Choisis le type de ta recrue, pour deux fois le prix d’une recrue au hasard. Elle arrive dans ta réserve.</p>` +
    deckTypes().map(t => {
      const ty = TYPES[t], lv = recruitLevel(), price = recruitPrice()*2, free = S.bench.some(x => !x);
      const why = !free ? 'Réserve pleine' : S.gold < price ? 'Il te manque ' + (price - Math.floor(S.gold)) + ' or' : '';
      return `<button class="shop-item${why ? ' off' : ''}" data-kind="hire" data-id="${t}" data-why="${why}">
        <img class="px" src="${URL_[t][lv-1]}" alt=""><div><b>${ty.name}, niveau ${lv}</b><span>${t === WARD_T ? 'Se poste sur la route et bloque les monstres' : 'Dégâts ' + DT_NAME[TYPE_DT[t]].split(' (')[0] + (canHitAir(t) ? ', touche les volants' : '')}.</span>${why ? `<small>${why}</small>` : ''}</div>
        <em><img class="px" src="${COIN_URL}" alt="">${price}</em></button>`;
    }).join('') +
    `<h3 class="cx-h">Terrain</h3><p class="cx-note">Chaque achat rend le suivant du même genre plus cher.</p>` +
    LAND_ORDER.map(k => row('land', k, LAND_URL[k], LAND[k].name, LAND[k].desc)).join('') +
    (S.mode === 'endless' && S.size > 0 ? `<h3 class="cx-h">Barricades</h3><p class="cx-note">Pose‑les sur les routes. Touche une barricade pour l’ouvrir ou la fermer, même pendant une vague ; glisse‑la pour la déplacer entre les vagues, ou hors du terrain pour la ranger. Les brutes défoncent les barricades fermées.</p>
      <button class="shop-item${S.barStock > 0 ? '' : ' off'}" data-kind="bar" data-id="bar" data-why="${S.barStock > 0 ? '' : 'Plus de barricade en stock'}"><img class="px" src="${BAR_URL}" alt=""><div><b>Poser une barricade</b><span>${S.barStock} en stock, ${S.bars.length} posée${S.bars.length > 1 ? 's' : ''}.</span></div><em>${S.barStock}</em></button>
      <button class="shop-item${S.gold >= barPrice() ? '' : ' off'}" data-kind="barbuy" data-id="bar" data-why="${S.gold >= barPrice() ? '' : 'Il te manque ' + (barPrice() - Math.floor(S.gold)) + ' or'}"><img class="px" src="${BAR_URL}" alt=""><div><b>Acheter une barricade</b><span>Une de plus en stock, pour toute la partie.</span></div><em><img class="px" src="${COIN_URL}" alt="">${barPrice()}</em></button>` : '');
  $('shopBody').querySelectorAll('.shop-item').forEach(b => b.onclick = () => {
    if (b.dataset.why){ toast(b.dataset.why); sfx('bad'); return; }
    if (b.dataset.kind === 'hire'){ hire(+b.dataset.id); openShop(); return; }
    if (b.dataset.kind === 'barbuy'){ S.gold -= barPrice(); S.barBought = (S.barBought || 0) + 1; S.barStock++; sfx('build'); save(); openShop(); return; }
    startPlacing(b.dataset.kind, b.dataset.id);
  });
  show('ovShop');
}
function hire(t){
  const i = S.bench.findIndex(x => !x), price = recruitPrice()*2, lv = recruitLevel();
  if (i < 0 || S.gold < price) return;
  S.gold -= price; S.cost += MODS.costInc;
  S.bench[i] = mk(t, lv); markSeen(t, lv);
  burst(i + .5, BENCH_Y/T + .5, TYPES[t].col, 14, 2.5);
  sfx('recruit'); save();
}
function startPlacing(kind, id){
  hide('ovShop');
  placing = { kind, id, spots:[] };
  refreshPlacing();
  $('placeBar').classList.add('show');
}
function refreshPlacing(){
  if (!placing) return;
  const { kind, id } = placing, price = itemPrice(kind, id);
  placing.spots = placeSpots(kind, id);
  $('pbIcon').src = kind === 'trap' ? TRAP_URL[id] : kind === 'bar' ? BAR_URL : LAND_URL[id];
  $('pbName').textContent = kind === 'bar' ? 'Barricade : ' + S.barStock + ' en stock' : (kind === 'trap' ? TRAPS[id].name : LAND[id].name) + ' : ' + price + ' or';
  $('pbHint').textContent = !placing.spots.length ? 'Plus aucune case possible.'
    : S.gold < price ? 'Il te manque ' + (price - Math.floor(S.gold)) + ' or.'
    : 'Touche une case qui clignote. Le jeu est en pause.';
}
function stopPlacing(){ placing = null; const b = $('placeBar'); if (b) b.classList.remove('show'); }
function placeAt(i){
  const { kind, id } = placing, price = itemPrice(kind, id);
  if (!placing.spots.includes(i)){
    toast(kind === 'trap' ? 'Les pièges se posent sur le chemin tracé' : 'Choisis une case qui clignote'); sfx('bad'); return;
  }
  if (S.gold < price){ toast('Il te manque ' + (price - Math.floor(S.gold)) + ' or'); sfx('bad'); return; }
  S.gold -= price;
  const cx = i%COLS + .5, cy = ((i/COLS)|0) + .5;
  if (kind === 'bar'){
    S.bars.push({ i, open:true, hp:null, broken:false }); S.barStock--; recomputeDist();
    burst(cx, cy, '#c9a27a', 10, 2);
  } else if (kind === 'trap'){
    S.traps.push({ i, k:id, id:++trapSeq, cd:0, anim:.3, used:false }); pstat.traps++;
    S.trapBuys++; rebuildTraps();
    burst(cx, cy, '#e8dcc0', 8, 2);
  } else {
    S.terrain[i] = id === 'dyn' ? TER.GRASS : id === 'hill' ? TER.HILL : id === 'marsh' ? TER.MARSH : TER.RUNE;
    S.shopBuys[id] = (S.shopBuys[id] || 0) + 1; pstat.terra++;
    if (id === 'dyn'){ burst(cx, cy, '#ff8a2a', 14, 4); burst(cx, cy, '#8f8a80', 10, 3); shake = .2; sfx('boom'); }
    else burst(cx, cy, id === 'rune' ? '#7fe3ff' : id === 'marsh' ? '#7fb3b0' : '#9ed36a', 14, 2.5);
    fx.push({ k:'ring', x:cx, y:cy, r:.7, life:.4, max:.4, col:'#fff3c4' });
    renderBG();
  }
  if (price) fx.push({ k:'t', x:cx, y:cy-.5, s:'-' + price, col:'#f6c94a', life:.8, max:.8 });
  sfx('build');
  save();
  refreshPlacing();
  if (kind === 'land' || !placing.spots.length || S.gold < itemPrice(kind, id) || (kind === 'bar' && S.barStock <= 0)) stopPlacing();
}
$('bShop').addEventListener('click', () => { audio(); openShop(); });
$('pbDone').addEventListener('click', () => { if (aiming) stopAim(); else stopPlacing(); });

/* ---------- légendes : choix et suivi ---------- */
function markSeenLeg(id, l){ seenLeg.add(id + ':' + l); }
function openLegendOffer(){
  if (!S.legendOffer || over || !hasGame) return;
  $('lgCards').innerHTML = S.legendOffer.map(id => {
    const L = LEGENDS[id];
    return `<button class="lcard" data-id="${id}">
      <img class="px" src="${LURL[id][0]}" alt="">
      <div><em>${L.kind}, ${L.era}</em><b>${L.name}</b>
      <span>${L.power(1)}</span>
      <span class="lult"><b>Ultime :</b> ${L.ult}</span>
      <small><img class="px" src="${LURL[id][4]}" alt="">Au niveau 5 : ${L.ranks[4]}. Famille ${TYPES[L.fam].name.toLowerCase()}.</small></div>
    </button>`;
  }).join('');
  $('lgCards').querySelectorAll('.lcard').forEach(b => b.onclick = () => pickLegend(b.dataset.id));
  show('ovLegend');
}
function pickLegend(id){
  if (!S.legendOffer || !LEGENDS[id]) return;
  const L = LEGENDS[id], lv0 = Math.min(5, recruitLevel()), tw = mk(L.fam, lv0, id);
  S.legend = id; S.legendOffer = null; pstat.legPick[id] = (pstat.legPick[id] || 0) + 1;
  let slot = S.legendSlot;
  if (!(slot >= 0 && slot < BENCH_N) || S.bench[slot]) slot = S.bench.findIndex(x => !x);
  if (slot < 0){
    let k = 0; for (let j=1;j<BENCH_N;j++) if (S.bench[j] && S.bench[j].l < S.bench[k].l) k = j;
    S.gold += troopSell(S.bench[k]); slot = k;
  }
  S.bench[slot] = tw; S.legendSlot = -1;
  for (let l = 1; l <= lv0; l++) markSeenLeg(id, l);
  hide('ovLegend');
  burst(slot + .5, BENCH_Y/T + .5, '#f2c14e', 26, 3.5);
  banner = { t:2.4, max:2.4, text:L.name, sub:'rejoint ton rempart', col:'#f2c14e' };
  sfx('legend');
  save();
  if (S.pending) setTimeout(openBless, 700);
}

/* ---------- boutons ---------- */
/* Recrues aguerries : à partir de la vague at[i], les recrues arrivent au niveau i+2.
   price[n] multiplie le prix du recrutement pour une recrue de niveau n+1. */
let OFFER_GAP = 1;
let RECRUIT = { at:[6,14,24,36], price:[1,1.6,2.6,4.2,6.8] };
function recruitLevel(){
  const w = nextWaveN() + (S.mode === 'story' ? WORLDS[S.world].off : 0);
  let l = 1; RECRUIT.at.forEach((v,i) => { if (w >= v) l = i + 2; });
  return l;
}
const recruitPrice = () => Math.round(S.cost * RECRUIT.price[recruitLevel() - 1]);
function recruit(){
  audio();
  if (over || !hasGame) return;
  const i = S.bench.findIndex(x => !x);
  if (i < 0){ toast('Réserve pleine : poste ou fusionne un soldat'); sfx('bad'); return; }
  const price = recruitPrice(), base = recruitLevel();
  if (S.gold < price){ toast('Il te manque ' + (price - Math.floor(S.gold)) + ' or'); sfx('bad'); return; }
  S.gold -= price; S.cost += MODS.costInc;
  if (!S.legend && !S.legendOffer && nextWaveN() >= 5){
    const ch = nextWaveN() > 10 ? 1 : Math.min(1, .05 + .05*S.legendPity);
    if (Math.random() < ch){
      S.legendOffer = shuffle(LEG_ORDER.slice()).slice(0,3); S.legendSlot = i;
      for (const id of S.legendOffer) markSeenLeg(id, 1);
      save(); sfx('legend'); setTimeout(openLegendOffer, 150); return;
    }
    S.legendPity++;
  }
  const dk = deckTypes(), w = dk.map(t => (t === WARD_T ? WARD.recruit : 1) + MODS.school[t]);
  let r = Math.random() * w.reduce((a,b) => a+b, 0), n = 0;
  for (; n<dk.length-1; n++){ r -= w[n]; if (r <= 0) break; }
  const t = dk[n];
  const vet = MODS.vet && Math.random() < MODS.vet, lvl = base + (vet ? 1 : 0);
  S.bench[i] = mk(t, lvl); markSeen(t, lvl);
  burst(i + .5, BENCH_Y/T + .5, TYPES[t].col, lvl > 1 ? 18 : 10, 2.5);
  if (vet) toast('Un vétéran rejoint tes rangs');
  sfx('recruit');
  save();
}
$('bRecruit').addEventListener('click', recruit);
$('bWave').addEventListener('click', () => {
  audio();
  if (!inWave){ startWave(); return; }
  if (!legendOnBoard()) return;
  if (aiming){ stopAim(); return; }
  if (!startAim()) toast('L’ultime se recharge : ' + Math.round((S.ult || 0)*100) + ' %');
});
$('bAuto').addEventListener('click', () => {
  prefs.auto = !prefs.auto; persist();
  toast(prefs.auto ? 'Les vagues s’enchaînent' : 'Tu lances chaque vague');
  if (prefs.auto && !inWave && !over) autoT = 1.2;
});
$('bSpeed').addEventListener('click', () => { prefs.speed = prefs.speed % 5 + 1; persist(); });
$('bMenu').addEventListener('click', () => { closeSheet(); openMenu(); });

function openMenu(){
  $('menuBest').textContent = 'Record sans fin : ' + (best ? 'vague ' + best : '—') + '. Sièges gagnés : ' + siegeRec.wins + '.';
  $('bSound').textContent = 'Son : ' + (prefs.sound ? 'activé' : 'coupé');
  $('bMusic').textContent = 'Musique : ' + (prefs.music ? 'activée' : 'coupée');
  $('bBlessN').textContent = S.bless.length ? '(' + S.bless.length + ')' : '';
  show('ovMenu');
}
function buildCodex(){
  $('cxCount').textContent = seen.size + ' soldats découverts sur ' + TYPES.length*MAXL;
  const troops = TYPES.map((ty,t) => `
    <div class="cx-type">
      <h3><i style="background:${ty.col}"></i>${ty.name}</h3>
      <p>${ty.desc} Dégâts ${DT_NAME[TYPE_DT[t]]}${canHitAir(t) ? ', touche les volants' : ', ne touche pas les volants'}.</p>
      <div class="cx-row r8">${Array.from({length:MAXL}, (_,k) => k+1).map(l => {
        const ok = seen.has(t*MAXL + l - 1);
        return `<div class="cx-cell${ok ? '' : ' lock'}"><img class="px" src="${ok ? URL_[t][l-1] : SIL[t][l-1].toDataURL()}" alt=""><span>${ok ? ty.ranks[l-1] : 'Niveau ' + l}</span></div>`;
      }).join('')}</div>
    </div>`).join('');
  const fams = Object.keys(FAM).map(f => {
    const mem = TYPES.map((ty,t) => ty.fam === f ? t : -1).filter(t => t >= 0);
    return `<div class="syn-row"><div class="pair">${mem.slice(0,2).map(t => `<img class="px" src="${URL_[t][0]}" alt="">`).join('')}</div>
      <div><b>Famille ${FAM[f].name}</b><span>${mem.map(t => TYPES[t].name).join(', ')}.</span><span>Deux voisins de types différents : ${FAM[f].txt} chacun.</span></div></div>`;
  }).join('');
  const syns = Object.keys(SYN).map(k => {
    const [a,b] = k.split('-').map(Number), sy = SYN[k];
    return `<div class="syn-row"><div class="pair"><img class="px" src="${URL_[a][0]}" alt=""><img class="px" src="${URL_[b][0]}" alt=""></div>
      <div><b>${sy.name}</b><span>${TYPES[a].name} : ${sy.txt[a]}</span><span>${TYPES[b].name} : ${sy.txt[b]}</span></div></div>`;
  }).join('') + `<div class="syn-row"><div class="pair"><img class="px" src="${URL_[0][0]}" alt=""><img class="px" src="${URL_[0][0]}" alt=""></div>
      <div><b>Formation</b><span>Deux soldats du même type côte à côte : +8 % de dégâts chacun, par voisin.</span></div></div>`;
  const beasts = EN_ORDER.map(k => {
    const ok = seenEn.has(k), e = EN[k];
    return `<div class="syn-row"><div class="pair"><img class="px big" src="${ok ? ENS[k].url : ENS[k].sil}" alt=""></div>
      <div><b>${ok ? e.name : '???'}</b><span>${ok ? e.desc : 'Pas encore croisé.'}</span>${ok && resText(e) ? `<span class="res">${resText(e)}</span>` : ''}</div></div>`;
  }).join('');
  const pantheon = LEG_ORDER.map(id => {
    const L = LEGENDS[id], met = [1,2,3,4,5].some(l => seenLeg.has(id + ':' + l));
    return `<div class="cx-type">
      <h3><i style="background:#f2c14e"></i>${met ? L.name : '???'}</h3>
      <p>${met ? L.kind + ', ' + L.era + '. ' + L.power(1) + ' Ultime : ' + L.ult + ', ' + L.ultDesc.charAt(0).toLowerCase() + L.ultDesc.slice(1) : 'Légende pas encore rencontrée.'}</p>
      <div class="cx-row">${[1,2,3,4,5].map(l => {
        const ok = seenLeg.has(id + ':' + l);
        return `<div class="cx-cell${ok ? '' : ' lock'}"><img class="px" src="${ok ? LURL[id][l-1] : LSIL[id][l-1]}" alt=""><span>${ok ? L.ranks[l-1] : 'Niveau ' + l}</span></div>`;
      }).join('')}</div></div>`;
  }).join('');
  const metN = LEG_ORDER.filter(id => [1,2,3,4,5].some(l => seenLeg.has(id + ':' + l))).length;
  $('cxBody').innerHTML = troops +
    `<h3 class="cx-h">Panthéon</h3><p class="cx-note">${metN} légendes rencontrées sur ${LEG_ORDER.length}. À partir de la vague 5, un recrutement peut faire apparaître trois légendes : tu en choisis une pour toute la partie. Offre-lui un soldat d’au moins un niveau de plus qu’elle : la légende prend le niveau du soldat offert (5 au maximum).</p>${pantheon}` +
    `<h3 class="cx-h">Synergies</h3><p class="cx-note">Deux soldats posés côte à côte (haut, bas, gauche, droite) se renforcent s’ils forment une paire, ou s’ils sont de la même famille. Un losange apparaît entre eux.</p>${syns}<h3 class="cx-h">Familles</h3><p class="cx-note">Quand deux voisins ne forment pas de paire, leur famille commune les renforce.</p>${fams}` +
    `<h3 class="cx-h">Bestiaire</h3>${beasts}`;
}
document.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => {
  audio();
  const a = b.dataset.act;
  if (a === 'resume') hide('ovMenu');
  else if (a === 'codex'){ buildCodex(); hide('ovMenu'); show('ovCodex'); }
  else if (a === 'help'){ hide('ovMenu'); show('ovHelp'); }
  else if (a === 'bless'){ hide('ovMenu'); openBlessList(); }
  else if (a === 'sound'){ prefs.sound = !prefs.sound; persist(); b.textContent = 'Son : ' + (prefs.sound ? 'activé' : 'coupé'); }
  else if (a === 'music'){ prefs.music = !prefs.music; persist(); b.textContent = 'Musique : ' + (prefs.music ? 'activée' : 'coupée'); }
  else if (a === 'home'){ hide('ovMenu'); showHome(); }
  else if (a === 'again'){ hide('ovOver'); hide('ovWin'); showHome(); }
}));
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => {
  const ov = b.closest('.ov'); ov.classList.remove('show');
  if (ov.id === 'ovHelp' && !prefs.helped){ prefs.helped = true; persist(); }
}));
