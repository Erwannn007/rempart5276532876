'use strict';

/* =========================================================
   Combat
   ========================================================= */
const d2 = (a,b) => (a.x-b.x)**2 + (a.y-b.y)**2;
const slowed = e => e.slowT > 0 || e.stunT > 0 || e.frozenT > 0;
function findTarget(cx, cy, range, not, air = true, minR = 0){
  let bestE = null, r2 = range*range, m2 = minR*minR;
  for (const e of enemies){
    if (e.dead || e === not || e.y < -.2 || e.ph || (!air && EN[e.k].fly)) continue;
    const q = (e.x-cx)**2 + (e.y-cy)**2;
    if (q <= r2 && q >= m2 && (!bestE || e.rem < bestE.rem)) bestE = e;
  }
  return bestE;
}
let hitDT = '';
function hit(e, dmg){
  if (e.dead || e.ph) return;
  const B = EN[e.k];
  if (B.armor){ if (hitDT === 'phys') dmg *= 1 - B.armor; else if (hitDT === 'boom' || hitDT === 'pierce') dmg *= 1 - B.armor/2; }
  if (B.mres && hitDT === 'magic') dmg *= 1 - B.mres;
  if (B.armorAll) dmg *= B.armorAll;
  e.hp -= dmg; e.flash = .07;
  if (B.bats && !e.batsDone && e.hp > 0 && e.hp < e.max*.4){
    e.batsDone = true; e.dead = true;
    const each = Math.max(1, e.hp / B.bats);
    for (let k=0;k<B.bats;k++) pendingSpawn.push({ k:'bat', from:{ x:e.x, y:e.y, cell:e.cell, next:e.next }, hp:each });
    S.gold += e.gold; addGold(e.gold); pstat.kills++; pstat.bosses++; beatBoss(e.k);
    burst(e.x, e.y-.3, '#9a1a2a', 22, 3.5); burst(e.x, e.y-.3, '#1e1a24', 14, 3);
    fx.push({ k:'t', x:e.x, y:e.y-.9, s:'La nuée !', col:'#ff6a7a', life:1.2, max:1.2 });
    shake = .25; sfx('split');
    return;
  }
  if (e.hp <= 0){
    if (B.boss) beatBoss(e.k);
    e.dead = true; legKills++;
    const gv = Math.round(e.gold * (e.markT > 0 ? 1 + e.markB : 1));
    S.gold += gv; addGold(gv); pstat.kills++;
    if (isBoss(e)) pstat.bosses++;
    const gob = e.k === 'goblin';
    if (gob) pstat.goblins++;
    if (e.markT > 0) burst(e.x, e.y-.3, '#f2c14e', 6, 2);
    fx.push({ k:'t', x:e.x, y:e.y-.5, s:'+'+gv, col:'#f6c94a', life: gob ? 1.4 : .8, max: gob ? 1.4 : .8, big:gob });
    burst(e.x, e.y-.2, EN[e.k].col, B.boss ? 26 : 9);
    if (gob){ burst(e.x, e.y-.2, '#fbe08a', 22, 4); sfx('jackpot'); }
    const sp = EN[e.k].split;
    if (sp){
      for (let k=0;k<sp[1];k++) pendingSpawn.push({ k:sp[0], from:{ x:e.x, y:e.y, cell:e.cell, next:e.next } });
      sfx('split');
      if (B.boss) shake = .5;
    } else if (!gob) sfx('kill');
  }
}
/* Dégâts dans la durée (poison, brûlure, sol en feu) : sans faire clignoter le monstre. */
let fires = [];
function dotHit(e, dmg, type){
  const fl = e.flash, pv = hitDT; hitDT = type; hit(e, dmg); hitDT = pv;
  if (!e.dead) e.flash = fl;
}
function dotTick(e, dt){
  if (e.poisonT > 0){
    e.poisonT -= dt; dotHit(e, e.poisonD*dt, 'poison');
    if (Math.random() < dt*5) fx.push({ k:'p', x:e.x+(Math.random()-.5)*.4, y:e.y-.4, vx:0, vy:-.6, life:.45, max:.45, col:'#9ed36a', s:1 });
  }
  if (!e.dead && e.burnT > 0){
    e.burnT -= dt; dotHit(e, e.burnD*dt, 'magic');
    if (Math.random() < dt*6) fx.push({ k:'p', x:e.x+(Math.random()-.5)*.4, y:e.y-.5, vx:0, vy:-.8, life:.35, max:.35, col: Math.random() < .5 ? '#ff8a2a' : '#ffd23f', s:1 });
  }
}
function poison(e, dps, dur = 3){ e.poisonD = Math.max(e.poisonT > 0 ? e.poisonD : 0, dps); e.poisonT = Math.max(e.poisonT || 0, dur); }
function updFires(dt){
  for (const f of fires){
    f.t -= dt;
    for (const e of enemies) if (!e.dead && !e.ph && !EN[e.k].fly && (e.x-f.x)**2 + (e.y-f.y)**2 <= f.r*f.r) dotHit(e, f.dps*dt, 'magic');
    if (Math.random() < dt*8) fx.push({ k:'p', x:f.x+(Math.random()-.5)*f.r*1.6, y:f.y-.1, vx:0, vy:-.9, life:.35, max:.35, col: Math.random() < .5 ? '#ff8a2a' : '#ffd23f', s:1 });
  }
  if (fires.some(f => f.t <= 0)) fires = fires.filter(f => f.t > 0);
}
/* Myconide : nuage de spores autour de lui. */
function sporeCloud(tw, cx, cy, D, r){
  const L = tw.l, pv = hitDT; hitDT = 'poison';
  for (const e of enemies){
    if (e.dead || e.ph || e.y < -.2 || (e.x-cx)**2 + (e.y-cy)**2 > r*r) continue;
    hit(e, D*.4); if (e.dead) continue;
    poison(e, D*.6*(L>=6 ? 1.5 : 1));
    if (L>=4) applySlow(e, .2, 1);
  }
  hitDT = pv;
  fx.push({ k:'ring', x:cx, y:cy-.1, r, life:.35, max:.35, col:'#b8e070' });
  for (let k=0;k<8;k++){ const a = Math.random()*Math.PI*2, d = Math.random()*r; fx.push({ k:'mote', x:cx+Math.cos(a)*d, y:cy+Math.sin(a)*d-.2, vx:(Math.random()-.5)*.6, vy:-.4-Math.random()*.4, life:.6, max:.6, col: Math.random() < .5 ? '#d8f0a0' : '#9ed36a' }); }
}
function burst(x, y, col, n, spd=3){
  for (let i=0;i<n;i++){
    const a = Math.random()*Math.PI*2, v = (.4 + Math.random())*spd;
    fx.push({ k:'p', x, y, vx:Math.cos(a)*v, vy:Math.sin(a)*v - 1.5, life:.35+Math.random()*.35, max:.7, col, s: Math.random()<.3 ? 2 : 1 });
  }
}
function applySlow(e, s, dur = 1.6){
  if (EN[e.k].noSlow) return;
  if (isBoss(e)) s *= .5;
  s = Math.min(.6, s);
  e.slow = Math.max(e.slowT > 0 ? e.slow : 0, s); e.slowT = Math.max(e.slowT, dur);
}
function lightning(x0, y0, tg, dmg, jumps, decay, vsSlow, L, col){
  const prevDT = hitDT; hitDT = 'magic';
  const pts = [{ x:x0, y:y0 }], hs = new Set();
  let cur = tg, dm = dmg;
  for (let k=0; k<=jumps && cur; k++){
    hs.add(cur); pts.push({ x:cur.x, y:cur.y-.25 });
    hit(cur, dm * (slowed(cur) ? 1+vsSlow : 1)); dm *= decay;
    let nx = null, bd = 2.9;
    for (const e of enemies){ if (e.dead || hs.has(e)) continue; const dd = d2(e,cur); if (dd < bd){ bd = dd; nx = e; } }
    cur = nx;
  }
  fx.push({ k:'bolt', pts, life:.2, max:.2, L, col });
  hitDT = prevDT;
}
const isBoss = e => !!EN[e.k].boss;
const enemyHit = (e, a) => waveHP(S.wave) * a * K_ENEMY * Math.min(1, .35 + S.wave/KE_RAMP) * Math.sqrt(e.thr || 1);
function legendFire(tw, cx, cy, tg, st, D){
  const L = tw.l, id = tw.leg;
  fx.push({ k:'ring', x:tg.x, y:tg.y - .2, r:.45, life:.22, max:.22, col:LEG_FXC[id] });
  for (let k=0;k<3;k++) fx.push({ k:'mote', x:tg.x + (Math.random()-.5)*.5, y:tg.y - .3, vx:(Math.random()-.5)*1.2, vy:-1 - Math.random(), life:.4, max:.4, col:LEG_FXC[id] });
  switch (id){
    case 'gengis': {
      const n = L>=5 ? 4 : L>=3 ? 3 : 2, r2 = st.range*st.range;
      const tgts = enemies.filter(e => !e.dead && e.y >= -.2 && (e.x-cx)**2 + (e.y-cy)**2 <= r2).sort((a,b) => a.rem - b.rem).slice(0, n);
      for (const t of tgts) projs.push({ k:'arrow', x:cx+tw.face*.2, y:cy-.3, tg:t, spd:13, dmg:D, L:5, aslow:0, pierce:false });
      sfx('arrow'); break;
    }
    case 'cesar': case 'leonidas': {
      hit(tg, D);
      fx.push({ k:'slash', x:tg.x, y:tg.y-.2, a:Math.atan2(tg.y-cy, tg.x-cx), life:.16, max:.16, col: L===5 ? '#fff3b0' : '#ffffff' });
      if (id === 'leonidas' && tw.ab <= 0 && !tg.dead){
        tw.ab = LEO_CD[L-1];
        tg.frozenT = Math.max(tg.frozenT || 0, LEO_STUN[L-1] * (isBoss(tg) ? .5 : 1));
        fx.push({ k:'ring', x:tg.x, y:tg.y-.2, r:.5, life:.3, max:.3, col:'#f2c14e' });
        fx.push({ k:'t', x:tg.x, y:tg.y-.8, s:'Halte !', col:'#f2c14e', life:.8, max:.8 });
        sfx('clang');
      }
      sfx('slash'); break;
    }
    case 'alexandre': {
      const dx = tg.x-cx, dy = tg.y-cy, dl = Math.hypot(dx,dy) || 1, ux = dx/dl, uy = dy/dl, reach = dl + (L>=4 ? 3 : 2);
      for (const e of enemies){
        if (e.dead) continue;
        const vx = e.x-cx, vy = e.y-cy, pr = vx*ux + vy*uy, pe = Math.abs(vx*uy - vy*ux);
        if (pr > 0 && pr <= reach && pe < .45 && !EN[e.k].fly) hit(e, D * (isBoss(e) ? 2 : 1));
      }
      fx.push({ k:'beam', x0:cx, y0:cy-.3, x1:cx+ux*reach, y1:cy-.3+uy*reach, life:.2, max:.2, col: L===5 ? '#fff3b0' : '#ffffff' });
      sfx('slash'); break;
    }
    case 'jeanne':
      lightning(cx + .3*tw.face, cy-.6, tg, D, 1, .8, 0, L, '#f2c14e'); sfx('zap'); break;
    case 'hannibal': {
      const stn = .3 + .1*L;
      for (const e of enemies) if (!e.dead && !EN[e.k].fly && d2(e,tg) <= .81){ hit(e, D); if (!isBoss(e)) e.stunT = Math.max(e.stunT, stn); }
      fx.push({ k:'ring', x:tg.x, y:tg.y, r:.9, life:.3, max:.3, col:'#c9a77a' });
      burst(tg.x, tg.y, '#b39b7a', 12, 3); shake = Math.max(shake, .08);
      sfx('stomp'); break;
    }
    case 'zeus': {
      let t = tg, r2 = st.range*st.range;
      for (const e of enemies) if (!e.dead && !e.ph && e.y >= -.2 && (e.x-cx)**2 + (e.y-cy)**2 <= r2 && e.hp > t.hp) t = e;
      hit(t, D);
      for (const e of enemies) if (!e.dead && e !== t && d2(e,t) < .49){ hit(e, D*.5); if (L>=4 && !isBoss(e)) e.stunT = Math.max(e.stunT, .4); }
      if (L>=4 && !t.dead && !isBoss(t)) t.stunT = Math.max(t.stunT, .4);
      fx.push({ k:'bolt', pts:[{ x:t.x+(Math.random()-.5)*.8, y:t.y-3.2 }, { x:t.x+(Math.random()-.5)*.4, y:t.y-1.6 }, { x:t.x, y:t.y-.2 }], life:.28, max:.28, L:5, col:'#9ec9ff' });
      fx.push({ k:'ring', x:t.x, y:t.y-.1, r:.7, life:.3, max:.3, col:'#fffbe0' });
      shake = Math.max(shake, .1); sfx('thunder'); break;
    }
    case 'thor':
      projs.push({ k:'hammer', x:cx+.3*tw.face, y:cy-.4, tg, spd:9, dmg:D, left:2+L, hitSet:new Set(), home:{ x:cx, y:cy-.4 }, back:false, a:0, L });
      sfx('lob'); break;
    case 'merlin':
      projs.push({ k:'shard', x:cx, y:cy-.4, tg, spd:9, dmg:D, slow: L===5 ? .4 : .3, dur:1.6, L, style:'merlin' }); sfx('ice'); break;
    case 'anubis':
      projs.push({ k:'shard', x:cx, y:cy-.4, tg, spd:9, dmg:D, slow:.2, dur:1.2, L:1, style:'anubis', mark:ANUBIS_GOLD[L-1] }); sfx('ice'); break;
    case 'hercule': {
      const stn = .2 + .1*L;
      for (const e of enemies) if (!e.dead && !EN[e.k].fly && d2(e,tg) <= .36){ hit(e, D); if (!isBoss(e)) e.stunT = Math.max(e.stunT, stn); }
      fx.push({ k:'slash', x:tg.x, y:tg.y-.2, a:Math.atan2(tg.y-cy, tg.x-cx), life:.2, max:.2, col:'#f2c14e' });
      fx.push({ k:'ring', x:tg.x, y:tg.y, r:.6, life:.25, max:.25, col:'#e6b46a' });
      shake = Math.max(shake, .05); sfx('stomp'); break;
    }
  }
}
/* Gardien nain niv. 6+ : son bouclier sonne tous les monstres qu'il retient. */
function wardBash(tw, i, held){
  const cx = i%COLS + .5, cy = ((i/COLS)|0) + .5;
  for (const e of held) if (!EN[e.k].noSlow) e.stunT = Math.max(e.stunT, WARD.bashStun * (isBoss(e) ? .5 : 1));
  tw.anim = .2;
  fx.push({ k:'ring', x:cx, y:cy - .2, r:1, life:.3, max:.3, col:'#7fe3ff' });
  fx.push({ k:'t', x:cx, y:cy - .9, s:'Bouclier !', col:'#7fe3ff', life:.8, max:.8 });
  burst(cx, cy - .3, '#c3cbd3', 8, 2); shake = Math.max(shake, .06); sfx('clang');
}
function merlinFreeze(tw, cx, cy){
  const dur = MERLIN_DUR[tw.l-1];
  for (const e of enemies) if (!e.dead && e.y >= 0) e.frozenT = Math.max(e.frozenT || 0, dur * (isBoss(e) ? .5 : 1));
  tw.ab = MERLIN_CD[tw.l-1]; timeStop = Math.max(timeStop, dur);
  fx.push({ k:'ring', x:cx, y:cy, r:2.5, life:.5, max:.5, col:'#bff6ff' });
  fx.push({ k:'t', x:cx, y:cy-.9, s:'Le temps s’arrête', col:'#bff6ff', life:1.2, max:1.2 });
  sfx('freeze');
}
function fire(tw, cx, cy, tg, st){
  const n0 = projs.length, prevDT = hitDT, dt = TYPE_DT[tw.t];
  hitDT = dt;
  fireInner(tw, cx, cy, tg, st);
  for (let k=n0; k<projs.length; k++) if (!projs[k].dt) projs[k].dt = dt;
  hitDT = prevDT;
}
function fireInner(tw, cx, cy, tg, st){
  tw.anim = .12;
  if (tg.x < cx - .05) tw.face = -1; else if (tg.x > cx + .05) tw.face = 1;
  const L = tw.l, sy = tw.syn || NOSYN, M = MODS;
  const crit = M.crit && Math.random() < M.crit, D = st.dmg * (crit ? 2.5 : 1);
  if (crit) fx.push({ k:'t', x:tg.x, y:tg.y-.8, s:'×2,5', col:'#ffe066', life:.5, max:.5 });
  if (tw.leg){ legendFire(tw, cx, cy, tg, st, D); return; }
  switch (tw.t){
    case 0: {
      const vs = e => slowed(e) ? 1 + sy.vsSlow : 1;
      if (M.whirl){
        const r2 = st.range*st.range;
        for (const e of enemies) if (!e.dead && !EN[e.k].fly && (e.x-cx)**2 + (e.y-cy)**2 <= r2) hit(e, D*.6*vs(e));
        fx.push({ k:'ring', x:cx, y:cy-.1, r:st.range*.9, life:.18, max:.18, col:'#ffffff' });
      } else {
        hit(tg, D*vs(tg));
        fx.push({ k:'slash', x:tg.x, y:tg.y-.2, a:Math.atan2(tg.y-cy, tg.x-cx), life:.16, max:.16, col: L===5 ? '#fff3b0' : '#ffffff' });
        if (L>=3) for (const e of enemies) if (e!==tg && !e.dead && !EN[e.k].fly && d2(e,tg) < .64) hit(e, D*.5*vs(e));
      }
      if (sy.zap && Math.random() < sy.zap && !tg.dead) lightning(cx + .3*tw.face, cy-.5, tg, D*.5, 2, .8, 0, 1);
      sfx('slash'); break;
    }
    case 1: {
      const mk_ = t => ({ k:'arrow', x:cx+tw.face*.2, y:cy-.25, tg:t, spd:12, dmg:D, L, aslow:sy.arrowSlow, pierce:M.pierce });
      projs.push(mk_(tg));
      if (L>=4){ const t2 = findTarget(cx, cy, st.range, tg); if (t2) projs.push(mk_(t2)); }
      sfx('arrow'); break;
    }
    case 2: {
      const rad = TYPES[2].splash + .08*(L-1) + sy.splash, dur = .55;
      const sp_ = (tg.eng != null || tg.bash || tg.frozenT > 0 || tg.stunT > 0) ? 0 : tg.spd*(tg.slowT>0 ? 1-tg.slow : 1);
      const f = { x: tg.x + (tg.vx || 0)*sp_*dur, y: tg.y + (tg.vy || 0)*sp_*dur };
      projs.push({ k:'bomb', sx:cx+tw.face*.3, sy:cy-.3, tx:f.x, ty:f.y, t:0, dur, dmg:D, rad, L, bslow:sy.bombSlow, frag:M.frag });
      sfx('lob'); break;
    }
    case 3: {
      projs.push({ k:'shard', x:cx, y:cy-.35, tg, spd:9, dmg:D, slow:.3+.07*(L-1)+sy.slow+M.slowAdd, dur:1.6+M.slowDur, L });
      sfx('ice'); break;
    }
    case 4: {
      lightning(cx + .3*tw.face, cy-.55, tg, D, 1 + L + sy.chain + M.chainAdd, M.decay, sy.vsSlow, L);
      sfx('zap'); break;
    }
    case 6: {
      projs.push({ k:'fire', x:cx+.3*tw.face, y:cy-.45, tg, spd:8, dmg:D, L, patch:{ dps:D*.9, t:2.4+.15*L, r: L>=6 ? .7 : .48 }, burn: L>=4 ? D*.5 : 0 });
      sfx('lob'); break;
    }
    case 7: {
      const rad = TYPES[7].splash + .06*(L-1) + sy.splash, dur = .9;
      const sp_ = (tg.eng != null || tg.wall != null || tg.bash || tg.frozenT > 0 || tg.stunT > 0) ? 0 : tg.spd*(tg.slowT>0 ? 1-tg.slow : 1);
      projs.push({ k:'bomb', rock:true, sx:cx+tw.face*.2, sy:cy-.4, tx:tg.x + (tg.vx || 0)*sp_*dur, ty:tg.y + (tg.vy || 0)*sp_*dur, t:0, dur, dmg:D, rad, L, bslow:0, frag:M.frag || L>=6, stun: L>=4 ? .5 : 0 });
      sfx('lob'); break;
    }
    case 8: {
      sporeCloud(tw, cx, cy, D, st.range);
      sfx('split'); break;
    }
    case 9: {
      const dx = tg.x-cx, dy = tg.y-.25-(cy-.3), dl = Math.hypot(dx,dy) || 1;
      projs.push({ k:'ballista', x:cx + tw.face*.3, y:cy-.3, ux:dx/dl, uy:dy/dl, a:Math.atan2(dy,dx), left:st.range + .5, spd:16, dmg:D, hitSet:new Set(), L, dt: L>=4 ? 'pierce' : 'phys' });
      sfx('arrow'); break;
    }
    case 5: {
      hit(tg, D);
      fx.push({ k:'slash', x:tg.x, y:tg.y-.2, a:Math.atan2(tg.y-cy, tg.x-cx), life:.16, max:.16, col: L>=5 ? '#fff3b0' : '#c3cbd3' });
      sfx('clang'); break;
    }
  }
}
function explode(x, y, rad, dmg, bslow, big){
  const prevDT = hitDT; hitDT = 'boom';
  for (const e of enemies) if (!e.dead && !EN[e.k].fly && (e.x-x)**2 + (e.y-y)**2 <= rad*rad){ hit(e, dmg); if (bslow) applySlow(e, bslow, 1.4); }
  hitDT = prevDT;
  fx.push({ k:'ring', x, y, r:rad, life:.3, max:.3, col: bslow ? '#bff0ff' : '#ffcf6a' });
  burst(x, y, bslow ? '#bff0ff' : '#ffb347', big ? 10 : 5, big ? 3.5 : 2.5);
  if (big) burst(x, y, '#6b6258', 6, 2);
}
function triggerTrap(tr, e){
  if (tr.used || e.y < 0) return;
  const cx = tr.i%COLS + .5, cy = ((tr.i/COLS)|0) + .5;
  if (tr.k === 'pics'){
    if (!e.trapHit) e.trapHit = new Set();
    if (e.trapHit.has(tr.id)) return;
    e.trapHit.add(tr.id);
    hit(e, waveHP(S.wave) * .6);
    tr.anim = .25; burst(e.x, e.y-.1, '#e8eef2', 4, 1.5); sfx('spike');
  } else if (tr.k === 'baril'){
    tr.used = true;
    explode(cx, cy, 1.2, waveHP(S.wave) * 3, 0, true);
    burst(cx, cy, '#ff8a2a', 16, 4.5); burst(cx, cy, '#8a5a32', 8, 3);
    fx.push({ k:'ring', x:cx, y:cy, r:1.3, life:.4, max:.4, col:'#fff3b0' });
    shake = .3; sfx('boom');
  } else if (tr.k === 'givre'){
    if (tr.cd > 0) return;
    tr.cd = 6; tr.anim = .4;
    for (const o of enemies){
      if (o.dead || (o.x-cx)**2 + (o.y-cy)**2 > 1.21) continue;
      o.stunT = Math.max(o.stunT, (o.k === 'boss' || o.k === 'king') ? .4 : 1.2);
    }
    fx.push({ k:'ring', x:cx, y:cy, r:1.1, life:.35, max:.35, col:'#bff0ff' });
    burst(cx, cy, '#e8f8ff', 14, 3); sfx('ice');
  }
}
function updProj(p, dt){
  const prevDT = hitDT; hitDT = p.dt || '';
  updProjInner(p, dt);
  hitDT = prevDT;
}
function updProjInner(p, dt){
  if (p.k === 'ballista'){
    const step = Math.min(p.left, p.spd*dt); p.x += p.ux*step; p.y += p.uy*step; p.left -= step;
    for (const e of enemies){
      if (e.dead || e.ph || p.hitSet.has(e) || (e.x-p.x)**2 + (e.y-.25-p.y)**2 > .16) continue;
      p.hitSet.add(e); hit(e, p.dmg); burst(e.x, e.y-.25, '#e8dcc0', 3, 1.5);
      if (p.L >= 6 && !e.dead) applySlow(e, .3, 1.2);
    }
    if (p.left <= 0) p.done = true;
    return;
  }
  if (p.k === 'hammer'){
    p.a += dt*16;
    const tx = p.back ? p.home.x : p.tg.x, ty = p.back ? p.home.y : p.tg.y - .25;
    const dx = tx-p.x, dy = ty-p.y, dist = Math.hypot(dx,dy), step = p.spd*dt;
    if (dist <= step){
      p.x = tx; p.y = ty;
      if (p.back){ p.done = true; return; }
      const tg = p.tg;
      if (!tg.dead){ hit(tg, p.dmg); burst(tg.x, tg.y-.25, '#c3cbd3', 5, 2); if (p.L === 5) burst(tg.x, tg.y-.25, LY, 4, 2); }
      p.hitSet.add(tg); p.left--;
      let nx = null, bd = 4;
      if (p.left > 0) for (const e of enemies){ if (e.dead || p.hitSet.has(e)) continue; const dd = d2(e,tg); if (dd < bd){ bd = dd; nx = e; } }
      if (nx) p.tg = nx; else { p.back = true; p.spd = 12; }
      sfx('clang');
    } else { p.x += dx/dist*step; p.y += dy/dist*step; }
    return;
  }
  if (p.k === 'bomb'){
    p.t += dt;
    if (p.t >= p.dur){
      p.done = true;
      explode(p.tx, p.ty, p.rad, p.dmg, p.bslow, true);
      if (p.stun) for (const e of enemies) if (!e.dead && !EN[e.k].fly && !EN[e.k].noSlow && (e.x-p.tx)**2 + (e.y-p.ty)**2 <= p.rad*p.rad) e.stunT = Math.max(e.stunT, p.stun * (isBoss(e) ? .5 : 1));
      if (p.rock) burst(p.tx, p.ty, '#8f8a80', 10, 3.5);
      if (p.frag) for (let k=0;k<3;k++){
        const a = Math.random()*Math.PI*2, r = .5 + Math.random()*.35;
        explode(p.tx + Math.cos(a)*r, p.ty + Math.sin(a)*r, .45, p.dmg*.25, p.bslow, false);
      }
      shake = Math.max(shake, .06);
      sfx('boom');
    }
    return;
  }
  const tx = p.tg.x, ty = p.tg.y - .25, dx = tx-p.x, dy = ty-p.y, dist = Math.hypot(dx,dy), step = p.spd*dt;
  p.a = Math.atan2(dy,dx);
  if (dist <= step){
    p.done = true;
    const tg = p.tg;
    if (!tg.dead){
      hit(tg, p.dmg);
      if (p.k === 'arrow' && p.aslow) applySlow(tg, p.aslow, 1.2);
      if (p.k === 'shard'){
        applySlow(tg, p.slow, p.dur);
        if (p.mark){ tg.markT = 4; tg.markB = p.mark; }
        if (MODS.freeze && tg.k !== 'boss' && tg.k !== 'king' && Math.random() < MODS.freeze){
          tg.stunT = .6;
          burst(tg.x, tg.y-.2, '#ffffff', 8, 2);
        }
        if (p.L >= 4) for (const e of enemies) if (!e.dead && e!==tg && d2(e,tg) < .64){ applySlow(e, p.slow, p.dur); hit(e, p.dmg*.5); }
      }
    }
    if (p.k === 'arrow' && p.pierce){
      let nx = null, bd = 1;
      for (const e of enemies){ if (e.dead || e === tg) continue; const dd = (e.x-tx)**2 + (e.y-tg.y)**2; if (dd < bd){ bd = dd; nx = e; } }
      if (nx){ hit(nx, p.dmg*.5); burst(nx.x, nx.y-.25, '#e8dcc0', 3, 1.5); }
    }
    if (p.k === 'fire'){
      if (!tg.dead && p.burn){ tg.burnT = 3; tg.burnD = Math.max(tg.burnD || 0, p.burn); }
      if (!EN[tg.k].fly) fires.push({ x:tg.x, y:tg.y, r:p.patch.r, t:p.patch.t, max:p.patch.t, dps:p.patch.dps });
      burst(tx, ty, '#ff8a2a', 8, 2.2); fx.push({ k:'ring', x:tx, y:ty+.25, r:p.patch.r, life:.25, max:.25, col:'#ffd23f' });
    }
    if (p.k === 'shard'){ burst(tx, ty, '#bff0ff', 6, 2); if (p.L>=4) fx.push({ k:'ring', x:tx, y:ty, r:.8, life:.25, max:.25, col:'#bff0ff' }); }
  } else { p.x += dx/dist*step; p.y += dy/dist*step; }
}

/* =========================================================
   Boucle
   ========================================================= */
function update(dt){
  if (over) return;
  if (!inWave && prefs.auto && autoT > 0 && !S.pending){ autoT -= dt; if (autoT <= 0) startWave(); }
  if (inWave){
    waveTime += dt;
    spawnT -= dt;
    if (queue.length && spawnT <= 0){ spawn(queue.shift(), { ent: queueEnt.shift() || 0 }); spawnT = spawnGap; }
  }
  for (const e of enemies){
    if (e.dead) continue;
    if (e.poisonT > 0 || e.burnT > 0){ dotTick(e, dt); if (e.dead) continue; }
    const B = EN[e.k];
    if (B.noSlow){ e.slowT = 0; e.stunT = 0; }
    if (e.slowT > 0) e.slowT -= dt;
    if (e.stunT > 0) e.stunT -= dt;
    if (e.markT > 0) e.markT -= dt;
    if (e.flash > 0) e.flash -= dt;
    if (e.frozenT > 0) e.frozenT -= dt;
    let sp = (e.stunT > 0 || e.frozenT > 0) ? 0 : e.spd * (e.slowT > 0 ? 1-e.slow : 1);
    if (B.enrage && e.hp < e.max/2 && !(e.frozenT > 0)){ sp *= 1.8; if (!e.rage){ e.rage = true; fx.push({ k:'t', x:e.x, y:e.y-.9, s:'Furie !', col:'#ff6a4a', life:1, max:1 }); burst(e.x, e.y-.3, '#ff6a4a', 10, 2.5); } }
    const c = Math.floor(e.x), r = Math.floor(e.y);
    const ci = (r >= 0 && r < ROWS && c >= 0 && c < COLS) ? idx(c,r) : -1;
    const inMarsh = ci >= 0 && S.terrain[ci] === TER.MARSH;
    if (inMarsh && !B.fly) sp *= 1 - MARSH_SLOW;
    if (e.wall != null && (e.ph || !wardAt(e.wall))) e.wall = null;
    if (e.wall != null){
      sp = 0; e.eng = null;
      if (!(e.stunT > 0 || e.frozenT > 0)){
        e.atkT -= dt;
        if (e.atkT <= 0){ e.atkT = 1; e.bump = .15; hurtTroop(e.wall, enemyHit(e, Math.max(.5, B.atk || 0)), e); }
      }
    } else if (B.atk && K_ENEMY > 0 && e.y >= 0 && !e.ph){
      if (e.eng != null){ const tw = S.board[e.eng]; if (!tw || tw.ko || Math.hypot(e.eng%COLS + .5 - e.x, ((e.eng/COLS)|0) + .5 - e.y) > 1.2) e.eng = null; }
      if (e.eng == null){ e.engCd = (e.engCd || 0) - dt; if (e.engCd <= 0){ e.engCd = .25; const j = findPrey(e); if (j >= 0){ e.eng = j; e.atkT = .35; } } }
      if (e.eng != null){
        sp = 0;
        if (!(e.stunT > 0 || e.frozenT > 0)){
          e.atkT -= dt;
          if (e.atkT <= 0){ e.atkT = 1; e.bump = .15; hurtTroop(e.eng, enemyHit(e, B.atk), e); }
        }
      }
    }
    if (e.bump > 0) e.bump -= dt;
    if (sp > 0 && ulx.length && phalanxBlocks(e)) sp = 0;
    const tr = (ci >= 0 && !B.fly) ? trapMap.get(ci) : null;
    if (tr && tr.k === 'goudron') sp *= .5;
    if (tr) triggerTrap(tr, e);
    if (e.dead) continue;
    if (B.phase){
      e.phT -= dt;
      if (e.phT <= 0){ e.ph = !e.ph; e.phT = e.ph ? B.phase[1] : B.phase[0]; if (e.ph) burst(e.x, e.y-.3, '#dfe8f4', 5, 1.5); }
    }
    if (B.blink && e.y >= 0 && !(e.frozenT > 0)){
      e.blT -= dt;
      if (e.blT <= 0 && !e.bash && e.eng == null && e.wall == null){ e.blT = B.blink; burst(e.x, e.y-.3, '#a83a5a', 8, 2); moveEnemy(e, 1.2); if (e.out){ e.dead = true; leak(e); if (over) return; continue; } }
    }
    if (B.regen && e.hp < e.max){ e.hp = Math.min(e.max, e.hp + e.max*B.regen*(inMarsh ? 3 : 1)*dt); if (Math.random() < dt*4) fx.push({ k:'t', x:e.x+(Math.random()-.5)*.5, y:e.y-.6, s:'+', col:'#7bd34f', life:.5, max:.5 }); }
    if (B.heal && e.y >= 0){
      e.hlT -= dt;
      if (e.hlT <= 0){
        e.hlT = 2;
        for (const o of enemies){
          if (o.dead || o === e || EN[o.k].heal || o.hp >= o.max || d2(o,e) >= 2.25) continue;
          if (o.healedAt != null && waveTime - o.healedAt < 1.9) continue;
          o.healedAt = waveTime; o.hp = Math.min(o.max, o.hp + o.max*B.heal); burst(o.x, o.y-.3, '#7bd34f', 3, 1.2);
        }
        fx.push({ k:'ring', x:e.x, y:e.y-.2, r:1.5, life:.35, max:.35, col:'#7bd34f' });
      }
    }
    if (B.summon && e.y >= 0){
      e.smT -= dt;
      if (e.smT <= 0){
        e.smT = B.summon[2];
        for (let k=0;k<B.summon[1];k++) pendingSpawn.push({ k:B.summon[0], from:{ x:e.x, y:e.y, cell:e.cell, next:e.next } });
        burst(e.x, e.y-.2, B.col, 8, 2);
      }
    }
    if (e.bash){
      const b = e.bash;
      if (b.open || b.broken || !S.bars.includes(b)) e.bash = null;
      else {
        sp = 0;
        if (!(e.stunT > 0 || e.frozenT > 0)){
          e.atkT = (e.atkT == null ? .4 : e.atkT) - dt;
          if (e.atkT <= 0){
            e.atkT = 1; e.bump = .15;
            if (b.hp == null) b.hp = barMaxHp();
            b.hp -= enemyHit(e, Math.max(.6, B.atk || .6)) * 1.4;
            const c = cellC(b.i); burst(c.x, c.y, '#8a5a32', 4, 1.8);
            if (b.hp <= 0){ b.hp = 0; b.broken = true; burst(c.x, c.y, '#c9a27a', 16, 3); sfx('boom'); toast('Une barricade a cédé'); rerouteAfterToggle(b.i); e.bash = null; }
          }
        }
      }
    }
    moveEnemy(e, sp * dt);
    if (e.out){ e.dead = true; leak(e); if (over) return; continue; }
    e.rem = remOf(e);
    if (!e.child && e.k !== 'goblin'){ if (B.boss){ if (e.rem < waveBossRem) waveBossRem = e.rem; } else if (e.rem < waveMinRem) waveMinRem = e.rem; }
    if (e.k === 'goblin' && Math.random() < dt*12) fx.push({ k:'p', x:e.x+(Math.random()-.5)*.4, y:e.y-.3, vx:0, vy:-.6, life:.4, max:.4, col: Math.random()<.5 ? '#fbe08a' : '#ffffff', s:1 });
  }
  for (let i=0;i<S.board.length;i++){
    const tw = S.board[i]; if (!tw) continue;
    if (tw.anim > 0) tw.anim -= dt; if (tw.pop > 0) tw.pop -= dt; if (tw.hitFx > 0) tw.hitFx -= dt;
    if (tw.ko) continue;
    if (tw.hp != null){
      tw.hurtT = (tw.hurtT || 0) + dt;
      const rg = (tw.hurtT > 3 ? .05 : 0) + (MODS.wardRegen && isWarden(tw) ? MODS.wardRegen : 0);
      if (rg){ tw.hp += troopMax(tw) * rg * dt; if (tw.hp >= troopMax(tw)) tw.hp = null; }
    }
    tw.cd -= dt;
    if (tw.t === 8 && !tw.leg && tw.ab > 0) tw.ab -= dt;
    if (isWarden(tw) && tw.l >= 6 && inWave){
      if (tw.ab > 0) tw.ab -= dt;
      else {
        const held = enemies.filter(e => !e.dead && e.wall === i);
        if (held.length){ tw.ab = WARD.bashCd; wardBash(tw, i, held); }
      }
    }
    if (tw.leg){
      if (tw.ab > 0) tw.ab -= dt;
      if (tw.leg === 'merlin' && inWave && tw.ab <= 0){
        const mx = i%COLS + .5, my = ((i/COLS)|0) + .5;
        if (findTarget(mx, my, stats(tw, i).range)) merlinFreeze(tw, mx, my);
      }
    }
    if (tw.cd <= 0 && inWave){
      const cx = i%COLS + .5, cy = ((i/COLS)|0) + .5, st = stats(tw, i);
      const tg = findTarget(cx, cy, st.range, null, canHitAir(tw.t), tw.leg ? 0 : TYPES[tw.t].minRange || 0);
      if (tg){ fire(tw, cx, cy, tg, st); tw.cd = st.rate; } else tw.cd = 0;
    }
  }
  for (const tw of S.bench) if (tw && tw.pop > 0) tw.pop -= dt;
  chargeUlt(dt);
  updUlx(dt);
  legendAmbient(dt);
  for (const tr of S.traps){ if (tr.cd > 0) tr.cd -= dt; if (tr.anim > 0) tr.anim -= dt; }
  if (S.traps.some(t => t.used)){ S.traps = S.traps.filter(t => !t.used); rebuildTraps(); }
  updFires(dt);
  for (const p of projs) updProj(p, dt);
  projs = projs.filter(p => !p.done);
  enemies = enemies.filter(e => !e.dead);
  if (pendingSpawn.length){ for (const s of pendingSpawn) spawn(s.k, { from:s.from, hp:s.hp }); pendingSpawn = []; }
  if (inWave && !queue.length && !enemies.length) endWave();
}
function updateFx(dt){
  for (const f of fx){
    f.life -= dt;
    if (f.k === 'p'){ f.x += f.vx*dt; f.y += f.vy*dt; f.vy += 7*dt; }
    else if (f.k === 'mote'){ f.x += f.vx*dt; f.y += f.vy*dt; }
    else if (f.k === 't') f.y -= .7*dt;
  }
  fx = fx.filter(f => f.life > 0);
  if (shake > 0) shake -= dt;
  if (gateFlash > 0) gateFlash -= dt;
  if (timeStop > 0) timeStop -= dt;
  if (buffT > 0) buffT -= dt;
  if (banner){ banner.t -= dt; if (banner.t <= 0) banner = null; }
}

let last = performance.now(), ambDt = 0;
function frame(now){
  let dt = Math.min(.05, (now-last)/1000); last = now;
  ambDt = dt;
  const running = !paused && !anyOverlay() && !placing && !aiming;
  if (running && hasGame && !over) pstat.time += dt;
  achT += dt; if (achT > .7){ achT = 0; checkAch(); }
  if (homeOn && !paused) drawHome(dt);
  if (placing || aiming) clock += dt;
  if (running){
    clock += dt;
    if (!over) for (let k=0;k<prefs.speed;k++) update(dt);
    updateFx(dt*prefs.speed);
  }
  draw(); hud();
  requestAnimationFrame(frame);
}
