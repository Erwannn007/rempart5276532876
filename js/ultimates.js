'use strict';

/* =========================================================
   Ultimes des légendes
   ========================================================= */
const ULTS = {
  gengis:   ['Pluie de flèches', 'Une pluie de flèches frappe tous les ennemis du terrain (triple dégâts) et les ralentit.'],
  cesar:    ['Veni, vidi, vici', 'Pendant 8 s, toute ton armée frappe 50 % plus fort et 30 % plus vite.'],
  alexandre:['Charge de la cavalerie', 'Balaie les ennemis au sol autour de lui (six fois ses dégâts) et les repousse sur le chemin.'],
  leonidas: ['Ceci est Sparte !', 'Repousse les ennemis au sol autour de lui et les étourdit 3 s (1,5 s pour les boss).'],
  jeanne:   ['Bannière sacrée', 'Rend 3 vies au rempart. Pendant 8 s, toute ton armée frappe 40 % plus vite.'],
  hannibal: ['Charge des éléphants', 'Les éléphants piétinent tous les ennemis au sol du terrain (quatre fois ses dégâts) et les étourdissent.'],
  zeus:     ['Colère de l’Olympe', 'La foudre frappe chaque ennemi du terrain (quatre fois ses dégâts).'],
  thor:     ['Tempête de Mjöllnir', 'Un éclair rebondit sur 15 ennemis sans faiblir (triple dégâts).'],
  merlin:   ['Éternité', 'Fige tous les ennemis du terrain pendant 5 s (2,5 s pour les boss).'],
  anubis:   ['Jugement des âmes', 'Marque tous les ennemis et leur inflige trois fois ses dégâts, puis achève ceux qui passent sous 30 % de leur vie. Les boss subissent huit fois ses dégâts.'],
  hercule:  ['Douzième travail', 'Un coup colossal sur l’ennemi le plus résistant (douze fois ses dégâts), qui l’assomme 2 s.']
};
for (const id in ULTS){ LEGENDS[id].ult = ULTS[id][0]; LEGENDS[id].ultDesc = ULTS[id][1]; }
const ULT_TIME = [32, 29, 26, 23, 20];
let buffT = 0, buffDmg = 0, buffRate = 0;
function legendOnBoard(){ const i = S.board.findIndex(t => t && t.leg && !t.ko); return i < 0 ? null : { i, t:S.board[i] }; }
function chargeUlt(dt){
  const lb = legendOnBoard();
  if (!lb || !inWave) return;
  S.ult = Math.min(1, (S.ult || 0) + dt / ULT_TIME[lb.t.l - 1]);
}
function castUltimate(){
  const lb = legendOnBoard();
  if (!lb || !inWave || (S.ult || 0) < 1) return false;
  const { i, t:lt } = lb, LG = LEGENDS[lt.leg], L = lt.l, cx = i%COLS + .5, cy = ((i/COLS)|0) + .5;
  const D = stats(lt, i).dmg, live = enemies.filter(e => !e.dead && e.y >= -.2), ground = live.filter(e => !EN[e.k].fly);
  const near = (arr, r) => arr.filter(e => (e.x-cx)**2 + (e.y-cy)**2 <= r*r);
  S.ult = 0;
  const prevDT = hitDT; hitDT = TYPE_DT[lt.t];
  switch (lt.leg){
    case 'gengis':
      for (const e of live){ hit(e, D*3); applySlow(e, .3, 2); fx.push({ k:'rain', x:e.x + (Math.random()-.5)*.3, y:e.y, life:.45, max:.45 }); }
      sfx('arrow'); break;
    case 'cesar':
      buffT = 8; buffDmg = .5; buffRate = .3; break;
    case 'alexandre':
      for (const e of near(ground, 3.2)){ hit(e, D*6); e.frozenT = Math.max(e.frozenT || 0, .8); }
      fx.push({ k:'ring', x:cx, y:cy, r:3.2, life:.5, max:.5, col:'#fff3b0' }); sfx('stomp'); break;
    case 'leonidas':
      for (const e of near(ground, 3.2)){ e.frozenT = Math.max(e.frozenT || 0, isBoss(e) ? 1.5 : 3); }
      fx.push({ k:'ring', x:cx, y:cy, r:3.2, life:.5, max:.5, col:'#c42a35' }); sfx('clang'); break;
    case 'jeanne':
      S.lives += 3; buffT = 8; buffDmg = 0; buffRate = .4; break;
    case 'hannibal':
      for (const e of ground){ hit(e, D*4); e.frozenT = Math.max(e.frozenT || 0, isBoss(e) ? .75 : 1.5); burst(e.x, e.y, '#b39b7a', 4, 2); }
      shake = .5; sfx('stomp'); break;
    case 'zeus':
      for (const e of live){ hit(e, D*4); fx.push({ k:'bolt', pts:[{ x:e.x + (Math.random()-.5)*.6, y:e.y - 3 }, { x:e.x, y:e.y - .2 }], life:.3, max:.3, L:5, col:'#9ec9ff' }); }
      shake = .3; sfx('thunder'); break;
    case 'thor': {
      let tg = live.sort((a,b) => d2(a,{x:cx,y:cy}) - d2(b,{x:cx,y:cy}))[0];
      if (tg) lightning(cx, cy - .5, tg, D*3, 14, 1, 0, 5, '#9ec9ff');
      sfx('thunder'); break;
    }
    case 'merlin':
      for (const e of live){ e.frozenT = Math.max(e.frozenT || 0, isBoss(e) ? 2.5 : 5); burst(e.x, e.y - .3, '#bff6ff', 4, 1.5); }
      timeStop = 5; sfx('freeze'); break;
    case 'anubis':
      for (const e of live){
        e.markT = 4; e.markB = ANUBIS_GOLD[L-1];
        hit(e, D * (isBoss(e) ? 8 : 3));
        if (!e.dead && !isBoss(e) && e.hp < e.max*.3){ hit(e, e.hp + 1); burst(e.x, e.y-.3, '#f2c14e', 6, 2); }
      }
      sfx('jackpot'); break;
    case 'hercule': {
      const t = live.slice().sort((a,b) => b.hp - a.hp)[0];
      if (t){ hit(t, D*12); t.frozenT = Math.max(t.frozenT || 0, isBoss(t) ? 1 : 2); fx.push({ k:'ring', x:t.x, y:t.y, r:1, life:.4, max:.4, col:'#f2c14e' }); burst(t.x, t.y-.3, '#f2c14e', 18, 3.5); }
      shake = .35; sfx('stomp'); break;
    }
  }
  hitDT = prevDT;
  burst(cx, cy - .3, '#f2c14e', 24, 3.5);
  fx.push({ k:'ring', x:cx, y:cy, r:1.4, life:.5, max:.5, col:'#fff3c4' });
  banner = { t:1.8, max:1.8, text:LG.ult, sub:LG.name, col:'#f2c14e' };
  sfx('legend'); shake = Math.max(shake, .15);
  return true;
}
function updUltButton(){
  const btn = $('bWave'), lb = (hasGame && !over && inWave) ? legendOnBoard() : null;
  btn.classList.toggle('ult', !!lb);
  if (!lb){ btn.classList.remove('ready'); return; }
  const src = LURL[lb.t.leg][lb.t.l - 1]; if ($('wUltImg').getAttribute('src') !== src) $('wUltImg').src = src;
  const v = S.ult || 0;
  $('wUltFill').style.width = Math.round(v * 100) + '%';
  btn.classList.toggle('ready', v >= 1);
}

/* =========================================================
   Ultimes à placer sur la carte
   ========================================================= */
const ULT_SHAPE = { cesar:{ sq:1 }, jeanne:{ r:1.6 }, leonidas:{ path:1 }, gengis:{ r:1.8 }, zeus:{ r:1.6 }, merlin:{ r:2.2 },
  hannibal:{ path:1 }, alexandre:{ path:1 }, thor:{ r:1.7 }, anubis:{ r:1.8 }, hercule:{ r:1.3 } };
Object.assign(ULTS, {
  cesar:    ['Étendard de l’aigle', 'Plante l’aigle romain sur une zone de 3 × 3 cases pendant 10 s : les soldats dedans font 60 % de dégâts en plus et frappent 40 % plus vite.'],
  jeanne:   ['Bannière sacrée', 'Plante sa bannière : relève et soigne les soldats autour, rend 3 vies au rempart, puis soigne la zone pendant 8 s.'],
  leonidas: ['Phalange', 'Dresse un mur de boucliers sur le chemin : les monstres au sol y restent bloqués 6 s (3 s pour les boss).'],
  gengis:   ['Pluie de flèches', 'Une pluie de flèches s’abat 2 s sur la zone choisie : environ cinq fois ses dégâts à chaque ennemi dedans.'],
  zeus:     ['Colère de l’Olympe', 'Un éclair géant frappe la zone : six fois ses dégâts, et les ennemis restent sonnés.'],
  merlin:   ['Éternité', 'Une horloge de givre fige tout ce qui entre dans la zone pendant 5 s (les boss, la moitié du temps).'],
  hannibal: ['Charge des éléphants', 'Les éléphants remontent le chemin depuis le point choisi et piétinent les ennemis au sol (quatre fois ses dégâts).'],
  alexandre:['Charge de la cavalerie', 'Alexandre remonte le chemin au galop : cinq fois ses dégâts et les ennemis sont repoussés.'],
  thor:     ['Tempête de Mjöllnir', 'Une tempête gronde 4 s sur la zone : la foudre y tombe sans arrêt.'],
  anubis:   ['Jugement des âmes', 'Juge la zone : marque les ennemis, leur inflige trois fois ses dégâts et achève ceux qui passent sous 30 % de vie. Huit fois ses dégâts aux boss.'],
  hercule:  ['Douzième travail', 'Un coup colossal sur l’ennemi le plus résistant de la zone : douze fois ses dégâts, assommé 2 s.']
});
for (const id in ULTS){ LEGENDS[id].ult = ULTS[id][0]; LEGENDS[id].ultDesc = ULTS[id][1]; }

let aiming = null, ulx = [];
const EAGLE = pxCanvas(patt([
  'G.........G','GG.......GG','.GGG.Y.GGG.','..GGGYGGG..','...GYWYG...','....GYG....','...GG.GG...','..R.....R..'
], { G:'#e0a93a', Y:'#f6c94a', W:'#fff3c4', R:'#b3262e' }, true));
const SHIELD = pxCanvas(patt([
  '..BBBB..','.BBBBBB.','BBRBBRBB','BBRBBRBB','BRBBBBRB','BBBBBBBB','.BBBBBB.','..BBBB..'
], { B:'#c8913a', R:'#b3262e' }, true));
function polyLen(pts){ let L = 0; for (let k=1;k<pts.length;k++) L += Math.hypot(pts[k].x-pts[k-1].x, pts[k].y-pts[k-1].y); return L; }
function alongPts(pts, d){
  for (let k=1;k<pts.length;k++){ const L = Math.hypot(pts[k].x-pts[k-1].x, pts[k].y-pts[k-1].y); if (d <= L || k === pts.length-1){ const t = L ? Math.min(1, d/L) : 0; return { x:pts[k-1].x + (pts[k].x-pts[k-1].x)*t, y:pts[k-1].y + (pts[k].y-pts[k-1].y)*t }; } d -= L; }
  return pts[pts.length-1];
}
function startAim(){
  const lb = legendOnBoard();
  if (!lb || !inWave || (S.ult || 0) < 1) return false;
  aiming = { id:lb.t.leg, x:COLS/2, y:ROWS/2, active:false };
  $('pbIcon').src = LURL[lb.t.leg][lb.t.l - 1];
  $('pbName').textContent = LEGENDS[lb.t.leg].ult;
  $('pbHint').textContent = 'Pose le doigt sur le terrain, ajuste, puis relâche pour lancer. Le jeu est en pause.';
  $('pbDone').textContent = 'Annuler';
  $('placeBar').classList.add('show');
  sfx('bless');
  return true;
}
function stopAim(){ aiming = null; $('placeBar').classList.remove('show'); $('pbDone').textContent = 'Terminer'; }
function aimAt(p){
  const x = Math.max(0, Math.min(COLS - .01, (p.x - ox)/CS)), y = Math.max(0, Math.min(ROWS - .01, (p.y - oy - CS*.6)/CS));
  aiming.x = Math.floor(x) + .5; aiming.y = Math.floor(y) + .5;
}
function castAt(x, y){
  const lb = legendOnBoard();
  if (!lb || !inWave || (S.ult || 0) < 1) return false;
  const { i, t:lt } = lb, id = lt.leg, LG = LEGENDS[id], L = lt.l, D = stats(lt, i).dmg, SH = ULT_SHAPE[id];
  const live = enemies.filter(e => !e.dead && e.y >= -.2);
  const inZ = e => SH.sq ? (Math.abs(e.x - x) <= SH.sq + .5 && Math.abs(e.y - y) <= SH.sq + .5) : (e.x-x)**2 + (e.y-y)**2 <= SH.r*SH.r;
  const zone = live.filter(inZ), dt0 = TYPE_DT[lt.t];
  S.ult = 0;
  const prevDT = hitDT; hitDT = dt0;
  switch (id){
    case 'cesar':
      ulx.push({ k:'cesar', x, y, t:10, max:10 }); burst(x, y, '#f2c14e', 30, 4); break;
    case 'jeanne':
      S.lives += 3;
      for (let j=0;j<S.board.length;j++){
        const tw = S.board[j]; if (!tw) continue;
        const cx = j%COLS + .5, cy = ((j/COLS)|0) + .5;
        if ((cx-x)**2 + (cy-y)**2 <= 1.6*1.6 + .01){ if (tw.ko) fx.push({ k:'t', x:cx, y:cy - .7, s:'Debout !', col:'#fff3c4', life:1, max:1 }); tw.ko = false; tw.hp = null; burst(cx, cy, '#fff3c4', 10, 2); }
      }
      ulx.push({ k:'banner', x, y, r:1.6, t:8, max:8 }); break;
    case 'leonidas':
      ulx.push({ k:'phalanx', cell:nearestNetCell(x, y), t:6, max:6 }); sfx('clang'); break;
    case 'gengis':
      ulx.push({ k:'rain', x, y, r:1.8, t:2, max:2, tick:0, D, dt:dt0 }); sfx('arrow'); break;
    case 'zeus':
      for (const e of zone){ hit(e, D*6); e.frozenT = Math.max(e.frozenT || 0, isBoss(e) ? .5 : 1.2); }
      for (let k=0;k<4;k++) fx.push({ k:'bolt', pts:[{ x:x + (Math.random()-.5)*1.4, y:-1 }, { x:x + (Math.random()-.5)*.8, y:y - 1.5 }, { x:x + (Math.random()-.5)*.6, y }], life:.45, max:.45, L:5, col:'#9ec9ff' });
      ulx.push({ k:'flash', t:.35, max:.35 }); ulx.push({ k:'ring', x, y, r:1.6, t:.5, max:.5, col:'#fffbe0' });
      shake = .45; sfx('thunder'); break;
    case 'merlin':
      ulx.push({ k:'clock', x, y, r:2.2, t:5, max:5 }); sfx('freeze'); break;
    case 'hannibal':
      ulx.push({ k:'charge', pts:upstreamFrom(nearestNetCell(x, y)), s:0, spd:3.2, t:2.8, max:2.8, hit:new Set(), spr:LSPR.hannibal[L-1], D:D*4, frz:1.2, push:0, dt:dt0 }); sfx('stomp'); break;
    case 'alexandre':
      ulx.push({ k:'charge', pts:upstreamFrom(nearestNetCell(x, y)), s:0, spd:4.5, t:2.2, max:2.2, hit:new Set(), spr:LSPR.alexandre[L-1], D:D*5, frz:.5, push:1.2, dt:dt0 }); sfx('slash'); break;
    case 'thor':
      ulx.push({ k:'storm', x, y, r:1.7, t:4, max:4, tick:0, D }); sfx('thunder'); break;
    case 'anubis':
      for (const e of zone){
        e.markT = 4; e.markB = ANUBIS_GOLD[L-1];
        hit(e, D * (isBoss(e) ? 8 : 3));
        if (!e.dead && !isBoss(e) && e.hp < e.max*.3) hit(e, e.hp + 1);
      }
      ulx.push({ k:'sand', x, y, r:1.8, t:1.4, max:1.4 }); sfx('jackpot'); break;
    case 'hercule': {
      const t = zone.slice().sort((a,b) => b.hp - a.hp)[0] || live.slice().sort((a,b) => d2(a,{x,y}) - d2(b,{x,y}))[0];
      if (t){ hit(t, D*12); t.frozenT = Math.max(t.frozenT || 0, isBoss(t) ? 1 : 2); ulx.push({ k:'slam', x:t.x, y:t.y, t:.7, max:.7 }); burst(t.x, t.y - .3, '#ff9a4a', 22, 4); }
      shake = .5; sfx('stomp'); break;
    }
  }
  hitDT = prevDT;
  const lx = i%COLS + .5, ly = ((i/COLS)|0) + .5;
  burst(lx, ly - .3, '#f2c14e', 20, 3);
  banner = { t:1.8, max:1.8, text:LG.ult, sub:LG.name, col:'#f2c14e' };
  sfx('legend'); shake = Math.max(shake, .15);
  return true;
}
function inCesarZone(i){
  const cx = i%COLS + .5, cy = ((i/COLS)|0) + .5;
  return ulx.some(u => u.k === 'cesar' && Math.abs(cx - u.x) <= 1.01 && Math.abs(cy - u.y) <= 1.01);
}
function updUlx(dt){
  for (const u of ulx){
    u.t -= dt;
    if (u.k === 'rain'){
      u.tick -= dt;
      if (u.tick <= 0){
        u.tick = .1;
        const pd = hitDT; hitDT = u.dt;
        for (const e of enemies) if (!e.dead && (e.x-u.x)**2 + (e.y-u.y)**2 <= u.r*u.r) hit(e, u.D*.25);
        hitDT = pd;
        for (let k=0;k<3;k++){ const a = Math.random()*6.28, r = Math.random()*u.r; fx.push({ k:'rain', x:u.x + Math.cos(a)*r, y:u.y + Math.sin(a)*r, life:.4, max:.4 }); }
      }
    } else if (u.k === 'clock'){
      for (const e of enemies){
        if (e.dead || (e.x-u.x)**2 + (e.y-u.y)**2 > u.r*u.r) continue;
        if (isBoss(e) && u.t < u.max/2) continue;
        e.frozenT = Math.max(e.frozenT || 0, .15);
      }
    } else if (u.k === 'storm'){
      u.tick -= dt;
      if (u.tick <= 0){
        u.tick = .3;
        const zs = enemies.filter(e => !e.dead && (e.x-u.x)**2 + (e.y-u.y)**2 <= u.r*u.r);
        if (zs.length){ const e = zs[Math.random()*zs.length|0]; lightning(e.x + (Math.random()-.5)*.6, -1, e, u.D*1.2, 2, .9, 0, 5, '#9ec9ff'); }
        else fx.push({ k:'bolt', pts:[{ x:u.x + (Math.random()-.5)*2, y:-1 }, { x:u.x + (Math.random()-.5)*2, y:u.y + (Math.random()-.5)*2 }], life:.2, max:.2, L:5, col:'#9ec9ff' });
      }
    } else if (u.k === 'banner'){
      for (let j=0;j<S.board.length;j++){
        const tw = S.board[j]; if (!tw || tw.ko || tw.hp == null) continue;
        const cx = j%COLS + .5, cy = ((j/COLS)|0) + .5;
        if ((cx-u.x)**2 + (cy-u.y)**2 <= u.r*u.r){ tw.hp += troopMax(tw)*.15*dt; if (tw.hp >= troopMax(tw)) tw.hp = null; }
      }
    } else if (u.k === 'charge'){
      u.s += u.spd*dt;
      if (u.s >= polyLen(u.pts)){ u.t = 0; continue; }
      const o = alongPts(u.pts, u.s); u.px = u.x; u.x = o.x; u.y = o.y;
      if (Math.random() < dt*30) fx.push({ k:'p', x:u.x + (Math.random()-.5)*.5, y:u.y + .3, vx:(Math.random()-.5)*1.5, vy:-1.2, life:.4, max:.5, col:'#c9a77a', s:2 });
      const pd = hitDT; hitDT = u.dt;
      for (const e of enemies){
        if (e.dead || EN[e.k].fly || u.hit.has(e) || (e.x-u.x)**2 + (e.y-u.y)**2 > .36) continue;
        u.hit.add(e); hit(e, u.D);
        e.frozenT = Math.max(e.frozenT || 0, isBoss(e) ? u.frz/2 : u.frz);
        if (u.push) e.frozenT = Math.max(e.frozenT || 0, u.frz + .6);
        burst(e.x, e.y - .2, '#fff3c4', 5, 2);
      }
      hitDT = pd;
    } else if (u.k === 'sand'){
      if (Math.random() < dt*40){ const a = Math.random()*6.28; fx.push({ k:'mote', x:u.x + Math.cos(a)*u.r*.9, y:u.y + Math.sin(a)*u.r*.9, vx:-Math.sin(a)*1.5, vy:Math.cos(a)*1.5 - .4, life:.6, max:.6, col:'#e0a93a' }); }
    }
  }
  ulx = ulx.filter(u => u.t > 0);
}
function phalanxBlocks(e){
  if (EN[e.k].fly) return false;
  for (const u of ulx) if (u.k === 'phalanx' && e.next === u.cell && !(isBoss(e) && u.t < u.max/2)) return true;
  return false;
}
function drawUlxFloor(){
  for (const u of ulx){
    const a = Math.min(1, u.t / Math.min(u.max, .5)), pulse = .5 + .5*Math.sin(clock*6);
    if (u.k === 'cesar'){
      const X = ox + (u.x - 1.5)*CS, Y = oy + (u.y - 1.5)*CS, Wd = 3*CS;
      ctx.globalAlpha = a*(.14 + .1*pulse); ctx.fillStyle = '#f2c14e'; ctx.fillRect(X, Y, Wd, Wd);
      ctx.globalAlpha = a*.9; ctx.strokeStyle = '#f2c14e'; ctx.lineWidth = 2*P; ctx.setLineDash([3*P, 2*P]); ctx.strokeRect(X + P, Y + P, Wd - 2*P, Wd - 2*P); ctx.setLineDash([]);
      ctx.fillStyle = '#fff3a0'; for (const [dx,dy] of [[0,0],[1,0],[0,1],[1,1]]) ctx.fillRect(X + dx*(Wd - 4*P), Y + dy*(Wd - 4*P), 4*P, 4*P);
    } else if (u.k === 'banner' || u.k === 'clock' || u.k === 'storm' || u.k === 'sand'){
      const col = u.k === 'banner' ? '#fff3c4' : u.k === 'clock' ? '#9fe0ff' : u.k === 'storm' ? '#2a3448' : '#e0a93a';
      ctx.globalAlpha = a*(u.k === 'storm' ? .28 : .14 + .08*pulse); ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(ox + u.x*CS, oy + u.y*CS, u.r*CS, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = a*.8; ctx.strokeStyle = u.k === 'storm' ? '#9ec9ff' : col; ctx.lineWidth = 2*P; ctx.stroke();
      if (u.k === 'clock'){
        for (let k=0;k<12;k++){ const an = k/12*Math.PI*2; ctx.fillStyle = '#e8f8ff'; ctx.fillRect(snapP(ox + (u.x + Math.cos(an)*u.r*.85)*CS - P), snapP(oy + (u.y + Math.sin(an)*u.r*.85)*CS - P), 2*P, 2*P); }
      }
    }
  }
  ctx.globalAlpha = 1;
}
function drawUlxTop(){
  for (const u of ulx){
    const a = Math.min(1, u.t / Math.min(u.max, .4));
    ctx.globalAlpha = a;
    if (u.k === 'cesar'){
      const s = 2*P, w = EAGLE.width*s, h = EAGLE.height*s, fl = Math.round(Math.sin(clock*3)*2)*P;
      ctx.drawImage(EAGLE, snapP(ox + u.x*CS - w/2), snapP(oy + u.y*CS - h/2 - CS*.4) + fl, w, h);
    } else if (u.k === 'banner'){
      const X = snapP(ox + u.x*CS), Y = snapP(oy + u.y*CS);
      ctx.fillStyle = '#120d08'; ctx.fillRect(X - 2*P, Y - 17*P, 3*P, 18*P); ctx.fillRect(X, Y - 17*P, 10*P, 9*P);
      ctx.fillStyle = '#d9a441'; ctx.fillRect(X - P, Y - 16*P, P, 16*P);
      const wv = Math.floor(clock*4) % 2;
      ctx.fillStyle = '#f4f0e4'; ctx.fillRect(X, Y - 16*P + wv*P, 9*P, 7*P);
      ctx.fillStyle = '#e0a93a'; ctx.fillRect(X + 4*P, Y - 15*P + wv*P, P, 4*P); ctx.fillRect(X + 3*P, Y - 14*P + wv*P, 3*P, P); ctx.fillRect(X + 3*P, Y - 11*P + wv*P, 3*P, P);
    } else if (u.k === 'clock'){
      const X = ox + u.x*CS, Y = oy + u.y*CS, an = (1 - u.t/u.max)*Math.PI*2 - Math.PI/2;
      ctx.strokeStyle = '#e8f8ff'; ctx.lineWidth = 2*P; ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X + Math.cos(an)*u.r*.7*CS, Y + Math.sin(an)*u.r*.7*CS); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(snapP(X - 2*P), snapP(Y - 2*P), 4*P, 4*P);
    } else if (u.k === 'phalanx'){
      const o = cellC(u.cell), dn = neighbors(u.cell).filter(n => NET.cells.has(n)).sort((a,b) => NET.distB[a] - NET.distB[b])[0];
      const o2 = dn != null ? cellC(dn) : { x:o.x, y:o.y + 1 };
      let dx = o2.x - o.x, dy = o2.y - o.y; const L = Math.hypot(dx,dy) || 1; dx /= L; dy /= L;
      const s = 2*P;
      for (const k of [-1,0,1]){
        const X = ox + (o.x - dy*k*.32)*CS, Y = oy + (o.y + dx*k*.32)*CS;
        ctx.drawImage(SHIELD, snapP(X - SHIELD.width*s/2), snapP(Y - SHIELD.height*s/2 - P*2), SHIELD.width*s, SHIELD.height*s);
      }
    } else if (u.k === 'charge'){
      const w = u.spr.width*P*1.2, h = u.spr.height*P*1.2, X = ox + u.x*CS, Y = oy + u.y*CS, bob = (Math.floor(clock*12) % 2)*P;
      ctx.save(); ctx.translate(X, Y + .45*CS); if ((u.px || u.x) > u.x) ctx.scale(-1, 1);
      ctx.drawImage(u.spr, -w/2, -h - bob, w, h); ctx.restore();
    } else if (u.k === 'storm'){
      const X = ox + u.x*CS, Y = oy + (u.y - u.r - .3)*CS;
      ctx.fillStyle = '#3a4258'; for (let k=-3;k<=3;k++) ctx.fillRect(snapP(X + k*3*P), snapP(Y + Math.abs(k)*P + Math.sin(clock*2 + k)*P), 4*P, 3*P);
      ctx.fillStyle = '#5a6278'; for (let k=-2;k<=2;k++) ctx.fillRect(snapP(X + k*3*P), snapP(Y - 2*P), 3*P, 2*P);
    } else if (u.k === 'flash'){
      ctx.globalAlpha = u.t / u.max * .65; ctx.fillStyle = '#ffffff'; ctx.fillRect(ox, oy, ART_W*P, ROWS*CS);
    } else if (u.k === 'slam' || u.k === 'ring'){
      const pr = 1 - u.t/u.max;
      ctx.globalAlpha = 1 - pr; ctx.strokeStyle = u.col || '#ff9a4a'; ctx.lineWidth = 3*P;
      ctx.beginPath(); ctx.arc(ox + u.x*CS, oy + u.y*CS, (u.r || 1.4)*CS*(.3 + pr), 0, Math.PI*2); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}
function drawAimPreview(){
  if (!aiming) return;
  const SH = ULT_SHAPE[aiming.id], pulse = .5 + .5*Math.sin(clock*8);
  ctx.globalAlpha = .25 + .2*pulse; ctx.fillStyle = '#f2c14e'; ctx.strokeStyle = '#fff3a0'; ctx.lineWidth = 2*P;
  if (SH.path){
    const cell = nearestNetCell(aiming.x, aiming.y), o = cellC(cell);
    ctx.beginPath(); ctx.arc(ox + o.x*CS, oy + o.y*CS, .6*CS, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = .9; ctx.stroke();
    if (aiming.id !== 'leonidas'){
      ctx.setLineDash([2*P, 2*P]); ctx.beginPath();
      if (!aiming.up || aiming.upCell !== cell){ aiming.up = upstreamFrom(cell); aiming.upCell = cell; }
      aiming.up.forEach((q,k) => { const X = ox + q.x*CS, Y = oy + q.y*CS; k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
      ctx.stroke(); ctx.setLineDash([]);
    }
  } else if (SH.sq){
    const X = ox + (aiming.x - SH.sq - .5)*CS, Y = oy + (aiming.y - SH.sq - .5)*CS, Wd = (SH.sq*2 + 1)*CS;
    ctx.fillRect(X, Y, Wd, Wd); ctx.globalAlpha = .9; ctx.strokeRect(X + P, Y + P, Wd - 2*P, Wd - 2*P);
  } else {
    ctx.beginPath(); ctx.arc(ox + aiming.x*CS, oy + aiming.y*CS, SH.r*CS, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = .9; ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/* ---------- auras et particules des légendes ---------- */
const LEG_FXC = { gengis:'#e8e2d0', cesar:'#f2c14e', alexandre:'#fff3b0', leonidas:'#e2334a', jeanne:'#fffbe0', hannibal:'#c9a77a',
  zeus:'#9ec9ff', thor:'#7fe3ff', merlin:'#bff6ff', anubis:'#e0a93a', hercule:'#ff9a4a' };
function legendAmbient(dt){
  S.board.forEach((tw, i) => {
    if (!tw || !tw.leg || tw.ko) return;
    if (Math.random() < dt*7){
      const cx = i%COLS + .5 + (Math.random()-.5)*.8, cy = ((i/COLS)|0) + .4 + (Math.random()-.5)*.6;
      fx.push({ k:'mote', x:cx, y:cy, vx:(Math.random()-.5)*.2, vy:-.5 - Math.random()*.4, life:.9, max:.9, col:LEG_FXC[tw.leg] });
    }
  });
}
