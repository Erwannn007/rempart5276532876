'use strict';

/* =========================================================
   Dessin
   ========================================================= */
const snapP = v => Math.round(v/P)*P;
function cellXY(ref){
  if (ref.k === 'b') return { X: ox + (ref.i%COLS)*CS, Y: oy + ((ref.i/COLS)|0)*CS };
  if (ref.k === 'n') return { X: ox + ref.i*CS, Y: oy + BENCH_Y*P };
  return { X: ox + BENCH_N*CS, Y: oy + BENCH_Y*P };
}
function text(s, x, y, size, col){
  ctx.font = `800 ${size}px "Avenir Next Condensed","Avenir Next","Arial Narrow",sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, size/4.5); ctx.strokeStyle = '#120d08';
  ctx.strokeText(s, x, y); ctx.fillStyle = col; ctx.fillText(s, x, y);
}
function drawTroop(tw, X, Y, alpha=1, scale=1){
  const lg = !!tw.leg;
  const can = lg ? LSPR[tw.leg][tw.l-1] : SPR[tw.t][tw.l-1], SZ = lg ? 24*P : CS;
  const bob = (Math.floor(clock*1.7 + tw.seed) % 2) ? P : 0;
  const dx = tw.anim > 0 ? tw.face*P : 0;
  const sc = scale * (1 + (tw.pop > 0 ? tw.pop*1.1 : 0));
  ctx.globalAlpha = alpha * .3; ctx.fillStyle = '#000';
  ctx.fillRect(X+5*P, Y+17*P, 10*P, 2*P); ctx.fillRect(X+4*P, Y+18*P, 12*P, P);
  if (lg && !tw.ko){
    const glow = .5 + .5*Math.sin(clock*3 + tw.seed), gc = LEG_FXC[tw.leg] || '#f2c14e';
    ctx.globalAlpha = alpha * (.12 + .1*glow); ctx.fillStyle = gc;
    ctx.beginPath(); ctx.ellipse(X + CS/2, Y + 17*P, 11*P + glow*2*P, 4*P + glow*P, 0, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = alpha * (.35 + .2*Math.sin(clock*3 + tw.seed)); ctx.fillStyle = '#f2c14e';
    ctx.fillRect(X+5*P, Y+16*P, 10*P, P); ctx.fillRect(X+3*P, Y+17*P, 2*P, 2*P); ctx.fillRect(X+15*P, Y+17*P, 2*P, 2*P); ctx.fillRect(X+5*P, Y+19*P, 10*P, P);
  }
  ctx.globalAlpha = alpha * (tw.ko ? .5 : 1);
  ctx.save();
  const shk = tw.hitFx > 0 ? (Math.random() < .5 ? -P : P) : 0;
  ctx.translate(X + CS/2 + dx + shk, Y + CS);
  if (tw.ko){ ctx.translate(0, -3*P); ctx.rotate(Math.PI/2 * (tw.face < 0 ? -1 : 1)); ctx.translate(0, SZ*.35); }
  if (tw.face < 0) ctx.scale(-1, 1);
  if (sc !== 1) ctx.scale(sc, sc);
  ctx.drawImage(can, -SZ/2, -SZ - (tw.ko ? 0 : bob), SZ, SZ);
  ctx.restore();
  ctx.globalAlpha = alpha;
  if (tw.ko){
    for (let k=0;k<3;k++){ const a = clock*3 + k*2.1; ctx.fillStyle = '#fff3a0'; ctx.fillRect(snapP(X + CS/2 + Math.cos(a)*5*P), snapP(Y + 6*P + Math.sin(a)*2*P), P, P); }
  } else if (tw.hp != null && tw.hp < troopMax(tw)){
    const f = Math.max(0, tw.hp / troopMax(tw)), bx = X + 3*P, by = Y + (lg ? -3 : 1)*P;
    ctx.fillStyle = '#120d08'; ctx.fillRect(bx - P, by - P, 16*P, 3*P);
    ctx.fillStyle = f > .5 ? '#7bd34f' : f > .25 ? '#f2c14e' : '#e0523f'; ctx.fillRect(bx, by, Math.max(P, Math.round(14*f)*P), P);
  }
  if (tw.l <= 5 || lg){
    const w = tw.l*3 - 1, px0 = X + Math.round((T-w)/2)*P, py0 = Y + 18*P;
    ctx.fillStyle = '#120d08'; ctx.fillRect(px0-P, py0-P, (w+2)*P, 4*P);
    ctx.fillStyle = (tw.l===5 || lg) ? '#f2c14e' : TYPES[tw.t].col;
    for (let k=0;k<tw.l;k++) ctx.fillRect(px0 + k*3*P, py0, 2*P, 2*P);
  } else {
    const n = tw.l - 5, col = ['#4fc0d4','#ff6a2a','#fff3a0'][n-1], w = n*4 - 1, px0 = X + Math.round((T-w)/2)*P, py0 = Y + 17*P;
    ctx.fillStyle = '#120d08'; ctx.fillRect(px0-P, py0-P, (w+2)*P, 5*P);
    for (let k=0;k<n;k++){ const qx = px0 + k*4*P; ctx.fillStyle = col; ctx.fillRect(qx+P, py0, P, 3*P); ctx.fillRect(qx, py0+P, 3*P, P); }
  }
  if (buffT > 0){
    ctx.globalAlpha = alpha * (.4 + .3*Math.sin(clock*8 + tw.seed)); ctx.fillStyle = '#f2c14e';
    ctx.fillRect(X + 3*P, Y + 2*P, P, P); ctx.fillRect(X + 16*P, Y + 5*P, P, P); ctx.fillRect(X + 4*P, Y + 12*P, P, P);
    ctx.globalAlpha = alpha;
  }
  if (!lg && tw.xp > 0 && tw.l < MAXL){
    const f = Math.min(1, tw.xp / xpNeed(tw.l)), bx = X + 4*P, by = Y + (tw.l > 5 ? 15 : 16)*P;
    ctx.fillStyle = '#120d08'; ctx.fillRect(bx - P, by - P, 14*P, 3*P);
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(bx, by, 12*P, P);
    ctx.fillStyle = '#7fd6ff'; ctx.fillRect(bx, by, Math.max(P, Math.round(12*f)*P), P);
  }
  if (tw.l === 5 || (lg && tw.l >= 3)){
    ctx.fillStyle = '#fff1a8';
    for (let k=0;k<3;k++){
      const a = clock*1.6 + k*2.1, fl = (Math.sin(clock*6+k*3)+1)/2;
      if (fl < .35) continue;
      const sx = snapP(X + CS/2 + Math.cos(a)*8*P), sy = snapP(Y + CS/2 - 2*P + Math.sin(a)*6*P);
      ctx.fillRect(sx, sy-P, P, 3*P); ctx.fillRect(sx-P, sy, 3*P, P);
    }
  }
  ctx.globalAlpha = 1;
}
function drawEnemy(e){
  const o = e.toadT > 0 ? ENS.toad : ENS[e.k];
  const can = e.flash > 0 ? o.flash : (slowed(e) ? o.frost : o.n);
  const bob = (Math.floor((e.x + e.y)*5) % 2) ? P : 0;
  let bx = 0, by = 0;
  if (e.bump > 0 && e.eng != null){ const tx = e.eng%COLS + .5 - e.x, ty = ((e.eng/COLS)|0) + .5 - e.y, L = Math.hypot(tx,ty) || 1; bx = tx/L*.18; by = ty/L*.18; }
  const cx = ox + (e.x + e.ox + bx)*CS, fy = oy + (e.y + .42 + by)*CS;
  const B = EN[e.k], lift = B.fly ? 4*P + (Math.floor(clock*4 + e.ox*9) % 2)*P : 0;
  const X = snapP(cx - o.w*P/2), Y = snapP(fy - o.h*P) - bob - lift;
  const big = !!B.boss;
  ctx.globalAlpha = .3; ctx.fillStyle = '#000';
  const sw = o.w >= 27 ? 20 : big ? 14 : B.fly ? 6 : 9;
  ctx.fillRect(snapP(cx - sw*P/2), snapP(fy - 2*P), sw*P, 2*P);
  ctx.globalAlpha = e.ph ? .28 : 1;
  ctx.drawImage(can, X, Y, o.w*P, o.h*P);
  ctx.globalAlpha = 1;
  let ix = X + P;
  for (const [on, col] of [[B.armor, '#c3cbd3'], [B.mres, '#8aa8ff']]){
    if (!on) continue;
    ctx.fillStyle = '#120d08'; ctx.fillRect(ix - P, Y - 2*P, 5*P, 5*P);
    ctx.fillStyle = col; ctx.fillRect(ix, Y - P, 3*P, 2*P); ctx.fillRect(ix + P, Y + P, P, P);
    ix += 5*P;
  }
  if (e.huntT > 0){
    const mx = snapP(cx) - 3*P, my = Y - 7*P - (Math.floor(clock*4) % 2)*P;
    ctx.fillStyle = '#120d08'; ctx.fillRect(mx - P, my - P, 8*P, 8*P);
    ctx.fillStyle = '#ff6a4a'; ctx.fillRect(mx, my + 2*P, 6*P, 2*P); ctx.fillRect(mx + 2*P, my, 2*P, 6*P);
    ctx.fillStyle = '#120d08'; ctx.fillRect(mx + 2*P, my + 2*P, 2*P, 2*P);
  }
  if (e.stunT > 0 || e.frozenT > 0){ ctx.globalAlpha = .45; ctx.fillStyle = '#e8f8ff'; ctx.fillRect(X+3*P, Y+3*P, (o.w-6)*P, (o.h-5)*P); ctx.globalAlpha = 1; }
  if (e.hp < e.max){
    const bw = o.w >= 27 ? 22 : big ? 18 : 12, f = Math.max(0, e.hp/e.max);
    const bx = snapP(cx - bw*P/2), by = Y + (e.k==='slime' ? 5*P : e.k==='mini' ? 9*P : big ? 0 : P);
    ctx.fillStyle = '#120d08'; ctx.fillRect(bx-P, by-P, (bw+2)*P, 3*P);
    ctx.fillStyle = f > .5 ? '#7bd34f' : f > .25 ? '#f2c14e' : '#e0523f';
    ctx.fillRect(bx, by, Math.max(P, Math.round(bw*f)*P), P);
  }
}
function drawBars(){
  for (const b of S.bars || []){
    const X = ox + (b.i%COLS)*CS, Y = oy + ((b.i/COLS)|0)*CS;
    const dragged = barDrag && barDrag.moved && barDrag.b === b;
    ctx.globalAlpha = dragged ? .3 : 1;
    if (b.broken){
      ctx.fillStyle = '#5a3a22'; ctx.fillRect(X + 3*P, Y + 13*P, 5*P, 2*P); ctx.fillRect(X + 10*P, Y + 11*P, 6*P, 2*P); ctx.fillRect(X + 7*P, Y + 15*P, 4*P, 2*P);
      ctx.fillStyle = '#8a5a32'; ctx.fillRect(X + 4*P, Y + 13*P, 3*P, P); ctx.fillRect(X + 11*P, Y + 11*P, 4*P, P);
    } else if (!b.open){
      ctx.fillStyle = '#120d08'; ctx.fillRect(X + 2*P, Y + 4*P, 16*P, 13*P);
      for (let k=0;k<4;k++){ const sx = X + 3*P + k*4*P; ctx.fillStyle = k%2 ? '#7a4a2a' : '#8a5a32'; ctx.fillRect(sx, Y + 6*P, 3*P, 10*P); ctx.fillStyle = '#a8742a'; ctx.fillRect(sx + P, Y + 5*P, P, P); }
      ctx.fillStyle = '#5a3a22'; ctx.fillRect(X + 3*P, Y + 8*P, 14*P, 2*P); ctx.fillRect(X + 3*P, Y + 12*P, 14*P, 2*P);
      ctx.fillStyle = '#8e99a4'; ctx.fillRect(X + 5*P, Y + 8*P, P, 2*P); ctx.fillRect(X + 14*P, Y + 12*P, P, 2*P);
    } else {
      for (const px of [2, 15]){ ctx.fillStyle = '#120d08'; ctx.fillRect(X + (px-1)*P, Y + 4*P, 5*P, 13*P); ctx.fillStyle = '#8a5a32'; ctx.fillRect(X + px*P, Y + 5*P, 3*P, 11*P); ctx.fillStyle = '#a8742a'; ctx.fillRect(X + (px+1)*P, Y + 4*P, P, P); }
      ctx.fillStyle = '#5a3a22'; ctx.fillRect(X + 5*P, Y + 6*P, 2*P, 9*P); ctx.fillRect(X + 13*P, Y + 6*P, 2*P, 9*P);
    }
    if (!b.broken && b.hp != null && b.hp < barMaxHp()){
      const f = Math.max(0, b.hp / barMaxHp());
      ctx.fillStyle = '#120d08'; ctx.fillRect(X + 3*P, Y + 2*P, 14*P, 3*P);
      ctx.fillStyle = f > .5 ? '#c9a27a' : f > .25 ? '#f2c14e' : '#e0523f'; ctx.fillRect(X + 4*P, Y + 3*P, Math.max(P, Math.round(12*f)*P), P);
    }
    ctx.globalAlpha = 1;
  }
  if (barDrag && barDrag.moved){
    const X = barDrag.x - CS/2, Y = barDrag.y - CS*.45 - CS/2;
    ctx.globalAlpha = .9; ctx.fillStyle = '#8a5a32'; for (let k=0;k<4;k++) ctx.fillRect(X + 3*P + k*4*P, Y + 6*P, 3*P, 10*P);
    ctx.fillStyle = '#5a3a22'; ctx.fillRect(X + 3*P, Y + 8*P, 14*P, 2*P); ctx.fillRect(X + 3*P, Y + 12*P, 14*P, 2*P); ctx.globalAlpha = 1;
  }
}
function drawEntranceTags(){
  if (!NET || NET.ents.length < 2 || !Array.isArray(S.nextQ) || !Array.isArray(S.nextE)) return;
  NET.ents.forEach((ent, j) => {
    const cnt = {}; let tot = 0;
    S.nextQ.forEach((k, n) => { if ((S.nextE[n]|0) === j){ cnt[k] = (cnt[k] || 0) + 1; tot++; } });
    if (!tot) return;
    const top = Object.keys(cnt).sort((a,b) => (EN[b].boss ? 1e3 : 0) + cnt[b] - (EN[a].boss ? 1e3 : 0) - cnt[a])[0];
    const X = ox + (ent%COLS)*CS, Y = oy + 2*P, o = ENS[top], sc = Math.max(1, Math.floor(P*.45)), w = o.w*sc, h = o.h*sc;
    ctx.globalAlpha = .85; ctx.fillStyle = '#120d08'; ctx.fillRect(X + P, Y, CS - 2*P, Math.max(h, CS*.45) + 2*P); ctx.globalAlpha = 1;
    ctx.drawImage(o.n, X + 2*P, Y + P, w, h);
    text('×' + tot, X + CS*.72, Y + Math.max(h, CS*.45)/2 + P, Math.round(CS*.24), EN[top].boss ? '#ff7a62' : '#f3e7cc');
  });
}
/* Bandeau au-dessus du terrain : la vague suivante entre deux vagues, les ennemis restants pendant la vague. */
function drawNextWave(list = S.nextQ, l1 = 'Vague', l2 = 'suivante'){
  const cnt = {};
  for (const k of list) cnt[k] = (cnt[k] || 0) + 1;
  const kinds = Object.keys(cnt).sort((a,b) => (EN[b].boss ? 1e3 : 0) + cnt[b] - (EN[a].boss ? 1e3 : 0) - cnt[a]).slice(0, 6);
  const ps = Math.max(1, Math.floor(P*.55)), cell = 20*ps, h = cell + 4*P;
  const y0 = Math.max(0, oy - h - 3*P), x0 = ox;
  ctx.globalAlpha = .82; ctx.fillStyle = '#120d08'; ctx.fillRect(x0, y0, ART_W*P, h); ctx.globalAlpha = 1;
  text(l1, x0 + Math.round(CS*.55), y0 + h/2 - Math.round(CS*.13), Math.round(CS*.22), '#e8dcc0');
  text(l2, x0 + Math.round(CS*.55), y0 + h/2 + Math.round(CS*.13), Math.round(CS*.22), '#e8dcc0');
  let x = x0 + Math.round(CS*1.15);
  for (const k of kinds){
    const o = ENS[k], sc = Math.min(ps, Math.floor(cell / Math.max(o.w, o.h)) || 1);
    ctx.drawImage(o.n, x + (cell - o.w*sc)/2, y0 + 2*P + (cell - o.h*sc), o.w*sc, o.h*sc);
    const B = EN[k];
    text('×' + cnt[k], x + cell + Math.round(CS*.12), y0 + h - 3*P, Math.round(CS*.2), B.boss ? '#ff7a62' : '#f3e7cc');
    if (B.armor || B.mres || B.fly){
      ctx.fillStyle = B.fly ? '#f2c14e' : B.armor ? '#c3cbd3' : '#8aa8ff'; ctx.fillRect(x + cell - P, y0 + 2*P, 2*P, 2*P);
    }
    x += cell + Math.round(CS*.32);
    if (x > ox + ART_W*P - cell*2) break;
  }
  const th = threat();
  if (Math.abs(th - 1) > .005){
    const xr = ox + ART_W*P - Math.round(CS*.6), up = th > 1;
    text('Menace', xr, y0 + h/2 - Math.round(CS*.13), Math.round(CS*.2), '#e8dcc0');
    text((up ? '+' : '−') + Math.round(Math.abs(th - 1)*100) + ' %', xr, y0 + h/2 + Math.round(CS*.13), Math.round(CS*.22), up ? '#ff7a62' : '#8fd08a');
  }
}
function drawBolt(f){
  const a = f.life/f.max, pts = [];
  for (let k=0;k<f.pts.length-1;k++){
    const A = f.pts[k], B = f.pts[k+1];
    for (let s=0;s<4;s++){
      const t = s/4, nx = -(B.y-A.y), ny = (B.x-A.x), L = Math.hypot(nx,ny) || 1, j = s ? (Math.random()-.5)*.28 : 0;
      pts.push({ x:A.x + (B.x-A.x)*t + nx/L*j, y:A.y + (B.y-A.y)*t + ny/L*j });
    }
  }
  pts.push(f.pts[f.pts.length-1]);
  const line = (w, col, al) => {
    ctx.globalAlpha = al; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineJoin = 'miter'; ctx.beginPath();
    pts.forEach((p,i) => { const X = ox + p.x*CS, Y = oy + p.y*CS; i ? ctx.lineTo(X,Y) : ctx.moveTo(X,Y); });
    ctx.stroke();
  };
  line(P*4, f.col || (f.L===5 ? '#c9b8ff' : '#7a58c9'), .45*a); line(P*1.5, '#fffbe0', a);
  ctx.globalAlpha = 1;
}
function gem(x, y, col, alpha){
  const X = snapP(ox + x*CS), Y = snapP(oy + y*CS);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#120d08';
  ctx.fillRect(X-P, Y-3*P, 2*P, 6*P); ctx.fillRect(X-2*P, Y-2*P, 4*P, 4*P); ctx.fillRect(X-3*P, Y-P, 6*P, 2*P);
  ctx.fillStyle = col;
  ctx.fillRect(X-P, Y-2*P, 2*P, 4*P); ctx.fillRect(X-2*P, Y-P, 4*P, 2*P);
  ctx.fillStyle = '#fffbe0'; ctx.fillRect(X-P, Y-P, P, P);
  ctx.globalAlpha = 1;
}
function linkPos(i, j){
  const ci = i%COLS, ri = (i/COLS)|0, cj = j%COLS, rj = (j/COLS)|0;
  if (ri === rj) return { x: Math.max(ci,cj), y: ri + .55 };
  return { x: ci + .82, y: Math.max(ri,rj) + .05 };
}
function drawLinks(){
  const hidden = drag && drag.moved ? drag.troop : null;
  for (let i=0;i<S.board.length;i++){
    const a = S.board[i]; if (!a || a === hidden) continue;
    const c = i%COLS, r = (i/COLS)|0;
    for (const j of [c+1 < COLS ? i+1 : -1, r+1 < ROWS ? i+COLS : -1]){
      if (j < 0) continue;
      const b = S.board[j]; if (!b || b === hidden) continue;
      const lk = synLink(a.t, b.t); if (!lk) continue;
      const p = linkPos(i,j);
      gem(p.x, p.y, lk.col, .95);
    }
  }
}
function draw(){
  ctx.setTransform(1,0,0,1,0,0); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#1c1610'; ctx.fillRect(0,0,W,H);
  if (!bgCan) return;
  let sx = 0, sy = 0;
  if (shake > 0){ sx = Math.round((Math.random()*2-1)*2)*P; sy = Math.round((Math.random()*2-1)*2)*P; }
  ctx.translate(sx, sy);

  ctx.fillStyle = '#0e0a06'; ctx.fillRect(ox-2*P, oy-2*P, ART_W*P+4*P, ART_H*P+4*P);
  ctx.drawImage(bgCan, ox, oy, ART_W*P, ART_H*P);

  // runes qui pulsent
  for (let i=0;i<S.terrain.length;i++){
    if (S.terrain[i] !== TER.RUNE) continue;
    const X = ox + (i%COLS)*CS, Y = oy + ((i/COLS)|0)*CS;
    ctx.globalAlpha = .35 + .35*Math.sin(clock*2.5 + i); ctx.fillStyle = '#c8f8ff';
    for (const [gx,gy] of RUNE_GLYPH) ctx.fillRect(X+gx*P, Y+gy*P, P, P);
    ctx.globalAlpha = 1;
  }
  // prochain chemin
  if (!inWave && NET && !over) for (const ent of NET.ents){
    const F = flowFrom(ent);
    ctx.fillStyle = 'rgba(255,240,205,.65)';
    const off = (clock*1.1) % .5;
    for (let d = off; d < F.len; d += .5){
      const o = alongFlow(F, d);
      if (o.y < 0 || o.y > ROWS) continue;
      ctx.fillRect(snapP(ox + o.x*CS - P), snapP(oy + o.y*CS - P), 2*P, 2*P);
    }
  }
  drawBars();
  // sol en feu
  for (const f of fires){
    if (f.kind === 'thorn'){
      const a = Math.min(1, f.t / .5), n = Math.round(f.r*26);
      ctx.globalAlpha = .5*a; ctx.fillStyle = '#1e2e14';
      ctx.fillRect(snapP(ox + (f.x - f.r)*CS), snapP(oy + (f.y - f.r*.6)*CS), snapP(f.r*2*CS), snapP(f.r*1.2*CS));
      ctx.globalAlpha = a;
      for (let k=0;k<n;k++){
        const gx = f.x + (hash(k, 3, f.seed) - .5)*f.r*1.8, gy = f.y + (hash(k, 4, f.seed) - .5)*f.r*1.1;
        const X = snapP(ox + gx*CS), Y = snapP(oy + gy*CS), tall = 1 + (hash(k, 5, f.seed) > .5 ? 1 : 0);
        ctx.fillStyle = '#120d08'; ctx.fillRect(X - P, Y - (tall+1)*P, 3*P, (tall+2)*P);
        ctx.fillStyle = '#5a7a2a'; ctx.fillRect(X, Y - tall*P, P, tall*P + P); ctx.fillRect(X - P, Y - P, P, P);
        ctx.fillStyle = k % 3 ? '#c8402a' : '#9ac83a'; ctx.fillRect(X, Y - (tall+1)*P, P, P);
      }
      ctx.globalAlpha = 1;
      continue;
    }
    const a = Math.min(1, f.t / .5), n = Math.round(f.r*10);
    ctx.globalAlpha = .25*a; ctx.fillStyle = '#ff6a2a';
    ctx.fillRect(snapP(ox + (f.x - f.r)*CS), snapP(oy + (f.y - f.r*.6)*CS), snapP(f.r*2*CS), snapP(f.r*1.2*CS));
    ctx.globalAlpha = a;
    for (let k=0;k<n;k++){
      const h = hash(k, Math.floor(clock*10), 31), gx = f.x + (hash(k, 7, 5) - .5)*f.r*1.8, gy = f.y + (hash(k, 9, 5) - .5)*f.r*1.1;
      const X = snapP(ox + gx*CS), Y = snapP(oy + gy*CS), ht = 1 + Math.floor(h*3);
      ctx.fillStyle = '#ff8a2a'; ctx.fillRect(X, Y - ht*P, P, ht*P);
      ctx.fillStyle = h > .5 ? '#ffd23f' : '#fff3b0'; ctx.fillRect(X, Y - ht*P, P, P);
    }
    ctx.globalAlpha = 1;
  }
  // pièges
  for (const tr of S.traps){
    if (tr.used) continue;
    const X = ox + (tr.i%COLS)*CS, Y = oy + ((tr.i/COLS)|0)*CS;
    ctx.drawImage(TRAPC[tr.k], X, Y - (tr.k === 'pics' && tr.anim > 0 ? P : 0), CS, CS);
    if (tr.k === 'givre'){
      ctx.globalAlpha = tr.cd > 0 ? .12 : .4 + .3*Math.sin(clock*3 + tr.i); ctx.fillStyle = '#ffffff';
      for (const [gx,gy] of FROST_GLYPH) ctx.fillRect(X+gx*P, Y+gy*P, P, P);
      ctx.globalAlpha = 1;
    } else if (tr.k === 'baril'){
      ctx.fillStyle = Math.floor(clock*12 + tr.i)%2 ? '#ffd23f' : '#ff8a2a';
      ctx.fillRect(X+12*P, Y+2*P, P, P);
    } else if (tr.k === 'goudron' && Math.floor(clock*2 + tr.i)%3 === 0){
      ctx.fillStyle = '#4a4458'; ctx.fillRect(X+(8 + (tr.i%5))*P, Y+11*P, P, P);
    }
  }
  if (placing && placing.spots){
    const pulse = .25 + .25*Math.sin(clock*7);
    for (const i of placing.spots){
      const X = ox + (i%COLS)*CS, Y = oy + ((i/COLS)|0)*CS;
      ctx.fillStyle = `rgba(255,240,200,${pulse})`; ctx.fillRect(X+P, Y+P, CS-2*P, CS-2*P);
      ctx.strokeStyle = '#f2c14e'; ctx.lineWidth = P; ctx.strokeRect(X+1.5*P, Y+1.5*P, CS-3*P, CS-3*P);
    }
  }
  if (NET) for (const ent of NET.ents){
    const ec = ent%COLS, X = ox + ec*CS + 10*P, Y = oy + P;
    if (Math.floor(clock*3)%2 || inWave){
      ctx.fillStyle = '#120d08'; ctx.fillRect(X-4*P, Y, 8*P, P); ctx.fillRect(X-3*P, Y+P, 6*P, P); ctx.fillRect(X-2*P, Y+2*P, 4*P, P); ctx.fillRect(X-P, Y+3*P, 2*P, P);
      ctx.fillStyle = '#e0523f'; ctx.fillRect(X-3*P, Y, 6*P, P); ctx.fillRect(X-2*P, Y+P, 4*P, P); ctx.fillRect(X-P, Y+2*P, 2*P, P);
    }
  }
  if (NET){
    if (gateFlash > 0){
      const gc = NET.exit%COLS;
      ctx.globalAlpha = gateFlash/.35*.6; ctx.fillStyle = '#ff3b2a';
      ctx.fillRect(ox + gc*CS, oy + ROWS*CS, CS, WALL*P); ctx.globalAlpha = 1;
    }
  }

  // glisser-déposer : cibles
  if (drag && drag.moved){
    const a = drag.troop, pulse = (Math.sin(clock*8)+1)/2;
    const mark = ref => {
      const t = getT(ref); if (!t || t === a) return;
      const lgx = a.leg ? a : t, sox = a.leg ? t : a;
      const combo = (!t.leg && !a.leg && t.t===a.t && t.l===a.l && a.l<MAXL) || (!!t.leg !== !!a.leg && sox.l >= lgx.l + OFFER_GAP && lgx.l < 5);
      const absorb = !combo && !t.leg && !a.leg && t.t === a.t && t.l !== a.l && Math.max(t.l, a.l) < MAXL;
      if (combo || absorb){
        const { X, Y } = cellXY(ref);
        ctx.globalAlpha = .45 + pulse*.5; ctx.strokeStyle = combo ? '#f2c14e' : '#7fd6ff'; ctx.lineWidth = 2*P;
        ctx.strokeRect(X+P, Y+P, CS-2*P, CS-2*P); ctx.globalAlpha = 1;
      }
    };
    S.board.forEach((_,i) => mark({k:'b',i})); S.bench.forEach((_,i) => mark({k:'n',i}));
    if (drag.over){
      const { X, Y } = cellXY(drag.over), r = drag.eval;
      ctx.fillStyle = !r.ok ? 'rgba(224,82,63,.4)' : r.kind==='merge' ? 'rgba(242,193,78,.35)' : r.kind==='absorb' ? 'rgba(127,214,255,.3)' : r.kind==='sell' ? 'rgba(242,193,78,.25)' : 'rgba(255,255,255,.18)';
      ctx.fillRect(X, Y, CS, CS);
    }
  }

  if (ulx.length) drawUlxFloor();
  // portée du soldat sélectionné
  const selT = sel && getT(sel);
  if (selT && sel.k === 'b'){
    const c = sel.i%COLS + .5, r = ((sel.i/COLS)|0) + .5, rg = stats(selT, sel.i).range;
    ctx.fillStyle = 'rgba(255,245,220,.12)'; ctx.strokeStyle = 'rgba(255,245,220,.7)'; ctx.lineWidth = P;
    ctx.setLineDash([2*P, 2*P]);
    ctx.beginPath(); ctx.arc(ox + c*CS, oy + r*CS, rg*CS, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.setLineDash([]);
  }
  if (sel){ const { X, Y } = cellXY(sel); ctx.strokeStyle = '#f3e7cc'; ctx.lineWidth = P; ctx.strokeRect(X+P/2, Y+P/2, CS-P, CS-P); }

  // soldats
  for (let i=0;i<S.board.length;i++){
    const tw = S.board[i]; if (!tw) continue;
    const ghosted = drag && drag.moved && drag.troop === tw;
    const lift = S.terrain[i] === TER.HILL ? 2*P : (tw.t === 23 && (S.terrain[i] === TER.ROCK || S.terrain[i] === TER.TREE)) ? 5*P : 0;
    drawTroop(tw, ox + (i%COLS)*CS, oy + ((i/COLS)|0)*CS - lift, ghosted ? .3 : 1);
  }
  S.bench.forEach((tw,i) => { if (!tw) return; const ghosted = drag && drag.moved && drag.troop === tw; drawTroop(tw, ox + i*CS, oy + BENCH_Y*P, ghosted ? .3 : 1); });
  drawLinks();
  if (drag && drag.moved && drag.links){
    const pulse = .55 + .45*Math.sin(clock*9);
    for (const L of drag.links) gem(L.x, L.y, L.col, pulse);
  }

  // ennemis
  ctx.save();
  ctx.beginPath(); ctx.rect(ox, oy, ART_W*P, (ROWS*T + WALL)*P); ctx.clip();
  enemies.slice().sort((a,b) => a.y - b.y).forEach(drawEnemy);
  for (const a of allies){
    const o = ENS.skeleton, X = snapP(ox + a.x*CS - o.w*P/2), Y = snapP(oy + (a.y + .42)*CS - o.h*P) - ((a.bump || 0) > 0 ? P : 0);
    ctx.globalAlpha = .3; ctx.fillStyle = '#000'; ctx.fillRect(snapP(ox + a.x*CS - 4*P), snapP(oy + (a.y + .42)*CS - 2*P), 8*P, 2*P);
    ctx.globalAlpha = Math.min(1, a.t*2); ctx.drawImage(o.frost, X, Y, o.w*P, o.h*P);
    ctx.fillStyle = '#7cff8a'; ctx.fillRect(X + 8*P, Y + 5*P, P, P); ctx.fillRect(X + 11*P, Y + 5*P, P, P);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  if (S) drawAmbiance(ambDt);

  // projectiles
  for (const p of projs){
    if (p.k === 'bomb' && p.rock){
      const t = Math.min(1, p.t/p.dur), x = p.sx + (p.tx-p.sx)*t, y = p.sy + (p.ty-p.sy)*t - Math.sin(Math.PI*t)*2;
      const X = snapP(ox + x*CS), Y = snapP(oy + y*CS), hot = p.L >= 5;
      ctx.fillStyle = '#120d08'; ctx.fillRect(X-3*P, Y-2*P, 6*P, 5*P); ctx.fillRect(X-2*P, Y-3*P, 4*P, 7*P);
      ctx.fillStyle = hot ? '#ff8a2a' : '#8f8a80'; ctx.fillRect(X-2*P, Y-2*P, 4*P, 4*P);
      ctx.fillStyle = hot ? '#ffd23f' : '#bdb6aa'; ctx.fillRect(X-2*P, Y-2*P, 2*P, P);
      ctx.fillStyle = hot ? '#b5452a' : '#5e5a52'; ctx.fillRect(X, Y+P, 2*P, P);
    } else if (p.k === 'bomb'){
      const t = Math.min(1, p.t/p.dur), x = p.sx + (p.tx-p.sx)*t, y = p.sy + (p.ty-p.sy)*t - Math.sin(Math.PI*t)*1.1;
      const X = snapP(ox + x*CS), Y = snapP(oy + y*CS);
      ctx.fillStyle = '#120d08'; ctx.fillRect(X-2*P, Y-P, 4*P, 3*P); ctx.fillRect(X-P, Y-2*P, 2*P, 5*P);
      ctx.fillStyle = p.L===5 ? '#9b1d2a' : p.bslow ? '#6aa6c8' : '#3a3a44'; ctx.fillRect(X-P, Y-P, 2*P, 2*P);
      ctx.fillStyle = Math.floor(clock*20)%2 ? '#ffd23f' : '#ff8a2a'; ctx.fillRect(X+P, Y-3*P, P, P);
    } else {
      ctx.save(); ctx.translate(ox + p.x*CS, oy + p.y*CS); ctx.rotate(p.a || 0);
      if (p.k === 'arrow'){
        ctx.fillStyle = '#120d08'; ctx.fillRect(-4*P, -P, 8*P, 2*P);
        ctx.fillStyle = p.L===5 ? '#fff6d0' : '#d9c7a0'; ctx.fillRect(-4*P, -P/2, 7*P, P);
        ctx.fillStyle = p.aslow ? '#aeeeff' : '#eef4f8'; ctx.fillRect(2*P, -P, 2*P, 2*P);
        ctx.fillStyle = '#c8473d'; ctx.fillRect(-4*P, -P, 2*P, 2*P);
      } else if (p.k === 'ballista'){
        ctx.fillStyle = '#120d08'; ctx.fillRect(-6*P, -P, 12*P, 3*P); ctx.fillRect(4*P, -2*P, 3*P, 5*P);
        ctx.fillStyle = p.L >= 5 ? '#f2ead6' : '#c9b48a'; ctx.fillRect(-6*P, 0, 10*P, P);
        ctx.fillStyle = '#eef4f8'; ctx.fillRect(4*P, -P, 2*P, 3*P); ctx.fillRect(6*P, 0, P, P);
        ctx.fillStyle = '#c4473d'; ctx.fillRect(-6*P, -P, 2*P, P); ctx.fillRect(-6*P, P, 2*P, P);
      } else if (p.k === 'falcon'){
        if (p.face < 0) ctx.scale(-1, 1);
        const up = Math.floor(p.flap) % 2, br = p.L >= 5 ? '#f2ead6' : '#8a5a33';
        ctx.fillStyle = '#120d08'; ctx.fillRect(-3*P, -2*P, 7*P, 4*P); ctx.fillRect(-2*P, up ? -5*P : P, 4*P, 4*P);
        ctx.fillStyle = br; ctx.fillRect(-2*P, -P, 5*P, 2*P); ctx.fillRect(-P, up ? -4*P : P, 2*P, 3*P);
        ctx.fillStyle = '#c9a27a'; ctx.fillRect(P, -P, P, P);
        ctx.fillStyle = '#e0a93a'; ctx.fillRect(3*P, 0, P, P);
      } else if (p.k === 'fire'){
        const fl = Math.floor(clock*16) % 2;
        ctx.fillStyle = '#120d08'; ctx.fillRect(-3*P, -3*P, 6*P, 6*P);
        ctx.fillStyle = '#ff8a2a'; ctx.fillRect(-2*P, -2*P, 4*P, 4*P);
        ctx.fillStyle = '#ffd23f'; ctx.fillRect(-P, -P, 2*P, 2*P);
        ctx.fillStyle = '#fff3b0'; ctx.fillRect(fl ? 0 : -P, -P, P, P);
        ctx.fillStyle = '#ff8a2a'; ctx.fillRect(-5*P, fl ? -P : 0, 2*P, P); ctx.fillRect(-4*P, fl ? P : -2*P, P, P);
      } else if (p.k === 'hammer'){
        ctx.rotate(p.a);
        ctx.fillStyle = '#120d08'; ctx.fillRect(-3*P, -4*P, 6*P, 5*P); ctx.fillRect(-P, P, 2*P, 4*P);
        ctx.fillStyle = '#7d8a96'; ctx.fillRect(-2*P, -3*P, 4*P, 3*P);
        ctx.fillStyle = '#c3cbd3'; ctx.fillRect(-2*P, -3*P, 4*P, P);
        ctx.fillStyle = '#6b4428'; ctx.fillRect(-P/2, 0, P, 4*P);
      } else {
        const sty = p.style === 'hex' ? ['#120d08','#7fff8a','#ffffff'] : p.style === 'holy' ? ['#120d08','#fff3b0','#ffffff'] : p.style === 'note' ? ['#120d08','#e0a0c0','#ffffff']
          : p.style === 'gear' ? ['#120d08','#c8963a','#4a3a20'] : p.style === 'necro' ? ['#120d08','#7cff8a','#e8e2d0'] : p.style === 'coin' ? ['#120d08','#f6c94a','#fff3c4'] : p.style === 'anubis' ? ['#24212e','#e0a93a','#fff3b0'] : p.style === 'merlin' ? ['#120d08','#9ec9ff','#ffffff'] : ['#120d08','#aeeeff','#ffffff'];
        ctx.fillStyle = sty[0]; ctx.fillRect(-3*P, -2*P, 6*P, 4*P);
        ctx.fillStyle = sty[1]; ctx.fillRect(-2*P, -P, 4*P, 2*P);
        ctx.fillStyle = sty[2]; ctx.fillRect(P, -P/2, P, P);
      }
      ctx.restore();
    }
  }

  if (ulx.length) drawUlxTop();
  // effets
  for (const f of fx){
    const a = Math.max(0, f.life/f.max);
    if (f.k === 'p' || f.k === 'mote'){
      ctx.globalAlpha = Math.min(1, a*1.5); ctx.fillStyle = f.col;
      ctx.fillRect(snapP(ox + f.x*CS), snapP(oy + f.y*CS), (f.s || 1)*P, (f.s || 1)*P);
    } else if (f.k === 'ring'){
      ctx.globalAlpha = a; ctx.strokeStyle = f.col; ctx.lineWidth = 2*P;
      ctx.beginPath(); ctx.arc(ox + f.x*CS, oy + f.y*CS, f.r*CS*(1-a*.6), 0, Math.PI*2); ctx.stroke();
    } else if (f.k === 'slash'){
      ctx.globalAlpha = a; ctx.strokeStyle = f.col; ctx.lineWidth = 2*P;
      const sp = (1-a)*1.4;
      ctx.beginPath(); ctx.arc(ox + f.x*CS, oy + f.y*CS, .36*CS, f.a - 1.2 + sp, f.a - .2 + sp); ctx.stroke();
    } else if (f.k === 'bolt') drawBolt(f);
    else if (f.k === 'rain'){
      const pr = 1 - a, X = snapP(ox + f.x*CS), Y = snapP(oy + (f.y - 2.6 + pr*2.4)*CS);
      ctx.globalAlpha = 1; ctx.fillStyle = '#120d08'; ctx.fillRect(X - P, Y - 4*P, 3*P, 6*P);
      ctx.fillStyle = '#d9c7a0'; ctx.fillRect(X, Y - 4*P, P, 4*P); ctx.fillStyle = '#eef4f8'; ctx.fillRect(X, Y, P, P); ctx.fillStyle = '#c8473d'; ctx.fillRect(X, Y - 4*P, P, P);
    }
    else if (f.k === 'beam'){
      ctx.globalAlpha = a; ctx.strokeStyle = '#120d08'; ctx.lineWidth = 4*P;
      ctx.beginPath(); ctx.moveTo(ox + f.x0*CS, oy + f.y0*CS); ctx.lineTo(ox + f.x1*CS, oy + f.y1*CS); ctx.stroke();
      ctx.strokeStyle = f.col; ctx.lineWidth = 2*P; ctx.stroke();
    }
    else if (f.k === 't'){
      ctx.globalAlpha = Math.min(1, a*2);
      text(f.s, ox + f.x*CS, oy + f.y*CS, Math.round(CS*(f.big ? .42 : .32)), f.col);
    }
    ctx.globalAlpha = 1;
  }

  if (!inWave && !over && hasGame && Array.isArray(S.nextQ) && S.nextQ.length){ drawNextWave(); drawEntranceTags(); }
  else if (inWave && !over){
    const left = queue.concat(enemies.filter(e => !e.dead).map(e => e.k), pendingSpawn.map(p => p.k));
    if (left.length) drawNextWave(left, 'Restants', String(left.length));
  }
  if (timeStop > 0){
    ctx.globalAlpha = Math.min(.22, timeStop*.2); ctx.fillStyle = '#bfe9ff';
    ctx.fillRect(ox, oy, ART_W*P, ROWS*CS); ctx.globalAlpha = 1;
  }
  drawAimPreview();
  // soldat en main
  if (drag && drag.moved){
    const X = drag.x - CS/2, Y = drag.y - CS*.45 - CS/2;
    drawTroop(drag.troop, X, Y, 1, 1.15);
    if (drag.names && drag.names.length) text(drag.names.join(' + '), ox + ART_W*P/2, Math.max(oy + CS*.3, Y - CS*.32), Math.round(CS*.3), '#f2c14e');
  }

  // bandeau
  if (banner){
    const k = banner.t/banner.max, a = Math.min(1, k*4, (1-k)*6);
    const cy = oy + CS*2.2;
    ctx.globalAlpha = a*.85; ctx.fillStyle = '#120d08';
    ctx.fillRect(ox, cy - CS*.55, ART_W*P, banner.sub ? CS*1.25 : CS*1.05);
    ctx.globalAlpha = a;
    text(banner.text, ox + ART_W*P/2, cy, Math.round(CS*.6), banner.col);
    if (banner.sub) text(banner.sub, ox + ART_W*P/2, cy + CS*.48, Math.round(CS*.32), '#e8dcc0');
    ctx.globalAlpha = 1;
  }
  ctx.setTransform(1,0,0,1,0,0);
}
