'use strict';

/* =========================================================
   Canvas & décor
   ========================================================= */
const cv = document.getElementById('cv'), ctx = cv.getContext('2d'), stage = document.getElementById('stage');
let ART_W = COLS*T, BENCH_Y = ROWS*T + WALL + 2, ART_H = BENCH_Y + T + 2;
let W=0, H=0, dpr=1, P=1, CS=T, ox=0, oy=0, bgCan = null;

function resize(){
  const r = stage.getBoundingClientRect();
  dpr = Math.min(window.devicePixelRatio || 1, 3);
  W = cv.width = Math.max(1, Math.round(r.width*dpr));
  H = cv.height = Math.max(1, Math.round(r.height*dpr));
  P = Math.max(1, Math.floor(Math.min(W/ART_W, H/ART_H)));
  CS = T*P; ox = Math.floor((W - ART_W*P)/2); oy = Math.floor((H - ART_H*P)/2);
}
function hash(x,y,s){ let h = (x*374761393 + y*668265263 + s*982451653) | 0; h = (h ^ (h>>>13)) * 1274126177 | 0; return ((h ^ (h>>>16)) >>> 0) / 4294967295; }

function terRock(B){
  if (B.rockKind === 'tomb') return terTomb();
  const s = new Spr(), c = B.rock, hl = shade(c,1.3), dk = shade(c,.72);
  s.hl(7,11,6,c); s.hl(6,13,7,c); s.r(5,8,10,7,c); s.r(4,10,1,4,c); s.hl(6,13,15,c);
  s.r(14,12,4,4,c); s.hl(15,16,11,c);
  s.hl(7,10,7,hl,1); s.p(6,8,hl,1); s.p(15,12,hl,1);
  s.p(10,10,dk,1); s.p(11,11,dk,1); s.p(11,12,dk,1);
  if (B.snow){ s.hl(7,11,5,'#f4f8fb'); s.hl(6,12,6,'#f4f8fb'); s.hl(15,16,10,'#f4f8fb'); }
  else { s.hl(5,7,14,B.moss); s.p(13,8,B.moss,1); }
  return s.pixels();
}
function terTree(B){
  if (B.tree === 'mushroom') return terMushroom();
  if (B.tree === 'dead') return terDeadTree(B.trunkC);
  if (B.tree === 'cactus') return terCactus();
  if (B.tree === 'brazier') return terBrazier();
  const s = new Spr();
  if (B.pine){
    const w = { 2:[9,10],3:[8,11],4:[7,12],5:[8,11],6:[7,12],7:[6,13],8:[7,12],9:[6,13],10:[5,14],11:[6,13],12:[5,14],13:[4,15] };
    s.r(9,14,2,4,B.trunk);
    for (const y in w) s.hl(w[y][0], w[y][1], +y, B.leaf);
    s.hl(9,10,2,B.leafL,1); s.hl(8,9,3,B.leafL,1); s.hl(8,10,5,B.leafL,1); s.hl(7,9,8,B.leafL,1); s.hl(6,8,11,B.leafL,1);
    s.p(12,7,B.leafL,1); s.p(13,10,B.leafL,1);
  } else {
    s.r(9,12,2,5,B.trunk); s.p(8,17,B.trunk); s.p(11,17,B.trunk);
    s.hl(8,11,2,B.leaf); s.hl(6,13,3,B.leaf); s.r(4,4,12,7,B.leaf); s.hl(5,14,11,B.leaf); s.hl(7,12,12,B.leaf);
    s.hl(7,9,4,B.leafL,1); s.p(6,5,B.leafL,1); s.p(8,3,B.leafL,1); s.p(12,6,B.leafL,1); s.p(5,7,B.leafL,1);
    const dk = shade(B.leaf,.78); s.p(10,9,dk,1); s.p(13,8,dk,1); s.p(6,9,dk,1); s.p(11,10,dk,1);
  }
  return s.pixels();
}
function renderBG(){
  const B = BIOMES[S.biome || 0];
  const c = document.createElement('canvas'); c.width = ART_W; c.height = ART_H;
  const x = c.getContext('2d'), id = x.createImageData(ART_W, ART_H), d = id.data;
  const cache = {};
  const put = (px,py,col) => { if (px<0||py<0||px>=ART_W||py>=ART_H) return; const v = cache[col] || (cache[col]=hex2(col)); const i=(py*ART_W+px)*4; d[i]=v[0]; d[i+1]=v[1]; d[i+2]=v[2]; d[i+3]=255; };
  const stamp = (o,X0,Y0) => { for (let k=0;k<o.px.length;k++){ const col=o.px[k]; if (col) put(X0 + k%o.w, Y0 + ((k/o.w)|0), col); } };
  const ps = NET ? NET.cells : new Set();
  const pArr = NET ? [...NET.cells] : null;
  const ter = S.terrain;

  // sol
  for (let r=0;r<ROWS;r++) for (let cc=0;cc<COLS;cc++){
    const odd = (r+cc)&1, X0 = cc*T, Y0 = r*T;
    for (let y=0;y<T;y++) for (let xx=0;xx<T;xx++){
      const n = hash(X0+xx, Y0+y, 7);
      let col = B.g[odd];
      if (n < .07) col = B.gd[odd]; else if (n > .965) col = B.gl[odd];
      put(X0+xx, Y0+y, col);
    }
    if (ter[idx(cc,r)] !== TER.GRASS) continue;
    for (let k=0;k<2;k++){
      const tx = X0 + 3 + (hash(cc,r,k*11+3)*13|0), ty = Y0 + 4 + (hash(cc,r,k*17+5)*12|0);
      put(tx,ty,B.tuft[0]); put(tx+2,ty,B.tuft[0]); put(tx+1,ty+1,B.tuft[1]);
    }
    if (hash(cc,r,99) > .82){
      const fx_ = X0 + 3 + (hash(cc,r,41)*14|0), fy = Y0 + 3 + (hash(cc,r,43)*14|0);
      put(fx_,fy, hash(cc,r,45) > .5 ? B.fl[0] : B.fl[1]); put(fx_+1,fy+1,B.stem);
    }
  }
  // terrain au sol
  for (let i=0;i<COLS*ROWS;i++){
    const tt = ter[i]; if (!tt) continue;
    const cc = i%COLS, r = (i/COLS)|0, X0 = cc*T, Y0 = r*T;
    if (tt === TER.HILL){
      for (let y=0;y<T;y++) for (let xx=0;xx<T;xx++){
        const dx = (xx-9.5)/9.6, dy = (y-12)/7.4, q = dx*dx+dy*dy;
        if (q >= 1) continue;
        const top = 12 - 7.4*Math.sqrt(Math.max(0,1-dx*dx));
        let col = B.hill[0];
        if (q > .8 && y > 10) col = B.hill[2];
        else if (y < top + 2) col = B.hill[1];
        else if (q > .55 && y > 13) col = shade(B.hill[0], .88);
        else if (hash(X0+xx,Y0+y,5) > .93) col = B.hill[1];
        put(X0+xx, Y0+y, col);
      }
      put(X0+6,Y0+9,B.tuft[0]); put(X0+8,Y0+9,B.tuft[0]); put(X0+7,Y0+10,B.tuft[1]);
    } else if (tt === TER.MARSH){
      const same = (dc,dr) => { const nc=cc+dc, nr=r+dr; if (nc<0||nr<0||nc>=COLS||nr>=ROWS) return false; const j = idx(nc,nr); return ter[j]===TER.MARSH && !ps.has(j); };
      const L = same(-1,0), R = same(1,0), U = same(0,-1), D = same(0,1);
      const xl = L?0:2, xr = R?T-1:T-3, yt = U?0:2, yb = D?T-1:T-3;
      for (let y=yt;y<=yb;y++) for (let xx=xl;xx<=xr;xx++){
        const ex = (xx===xl&&!L)||(xx===xr&&!R), ey = (y===yt&&!U)||(y===yb&&!D);
        if (ex && ey) continue;
        put(X0+xx, Y0+y, (ex||ey) ? B.mud : B.water[hash(X0+xx,Y0+y,8) > .82 ? 1 : 0]);
      }
      for (let k=0;k<2;k++){ const rx = X0+4+(hash(cc,r,50+k)*9|0), ry = Y0+5+(hash(cc,r,60+k)*10|0); put(rx,ry,B.water[2]); put(rx+1,ry,B.water[2]); put(rx+2,ry,B.water[2]); }
      if (hash(cc,r,31) > .35){
        const rx = X0+4+(hash(cc,r,32)*10|0), ry = Y0+7;
        for (let y=0;y<5;y++) put(rx,ry+y,B.reed);
        put(rx,ry-1,'#6b4428'); put(rx,ry-2,'#6b4428');
        for (let y=2;y<5;y++) put(rx+2,ry+y,B.reed);
      }
      if (B.pad && hash(cc,r,33) > .45){ const lx = X0+9, ly = Y0+12; put(lx,ly,B.pad); put(lx+1,ly,B.pad); put(lx+2,ly,B.pad); put(lx,ly+1,B.pad); put(lx+2,ly+1,B.pad); }
    } else if (tt === TER.RUNE){
      for (let y=0;y<T;y++) for (let xx=0;xx<T;xx++){
        const dx = (xx-9.8)/7.6, dy = (y-10.5)/6.2, q = dx*dx+dy*dy;
        if (q >= 1) continue;
        put(X0+xx, Y0+y, q > .72 ? '#5c5966' : (y < 7 ? '#a19eab' : '#7d7a86'));
      }
      for (const [gx,gy] of RUNE_GLYPH) put(X0+gx, Y0+gy, '#3fb6d6');
    }
  }
  // terre du chemin
  if (pArr){
    for (const i of pArr){
      const cc = i%COLS, r = (i/COLS)|0, X0 = cc*T, Y0 = r*T;
      for (let y=0;y<T;y++) for (let xx=0;xx<T;xx++){
        const n = hash(X0+xx, Y0+y, 3);
        let col = B.dirt[0];
        if (n < .12) col = B.dirt[1]; else if (n > .985) col = B.dirt[3]; else if (n > .93) col = B.dirt[2];
        put(X0+xx, Y0+y, col);
      }
      if (ter[i] === TER.MARSH){
        for (let k=0;k<3;k++){
          const px = X0 + 4 + (hash(cc,r,k*13+70)*10|0), py = Y0 + 4 + (hash(cc,r,k*13+71)*11|0), w = 2 + (k%2);
          for (let q=0;q<w;q++) put(px+q, py, B.water[0]);
          put(px, py, B.water[1]);
        }
      }
      const open = (dc,dr) => {
        const nc = cc+dc, nr = r+dr;
        if (nr < 0) return NET.ents.includes(i);
        if (nr >= ROWS) return i === NET.exit;
        if (nc < 0 || nc >= COLS) return false;
        return ps.has(idx(nc,nr));
      };
      if (!open(0,-1)) for (let k=0;k<T;k++){ put(X0+k,Y0,B.edge[0]); put(X0+k,Y0+1,B.edge[1]); }
      if (!open(0,1))  for (let k=0;k<T;k++) put(X0+k,Y0+T-1,B.edge[0]);
      if (!open(-1,0)) for (let k=0;k<T;k++){ put(X0,Y0+k,B.edge[0]); put(X0+1,Y0+k,B.edge[1]); }
      if (!open(1,0))  for (let k=0;k<T;k++) put(X0+T-1,Y0+k,B.edge[0]);
      for (let k=0;k<3;k++){
        const sx = X0 + 4 + (hash(cc,r,k*7+60)*12|0), sy = Y0 + 4 + (hash(cc,r,k*5+61)*12|0);
        put(sx,sy,B.peb[0]); put(sx+1,sy,B.peb[1]);
      }
    }
  }
  // rochers et arbres
  const rock = terRock(B), tree = terTree(B);
  for (let i=0;i<COLS*ROWS;i++){
    const tt = ter[i]; if (tt !== TER.ROCK && tt !== TER.TREE) continue;
    const X0 = (i%COLS)*T, Y0 = ((i/COLS)|0)*T;
    for (let xx=5;xx<15;xx++) put(X0+xx, Y0+17, B.gd[0]);
    stamp(tt === TER.ROCK ? rock : tree, X0, Y0);
  }
  // rempart
  const wy = ROWS*T;
  for (let y=0;y<WALL;y++) for (let xx=0;xx<ART_W;xx++){
    const row = (y/4)|0, off = row%2 ? 5 : 0;
    let col = ((xx+off)%10===0 || y%4===3) ? '#4f4a44' : (hash(((xx+off)/10)|0, row, 9) > .5 ? '#8f8a80' : '#7f7a71');
    if (y===0) col = B.snow ? '#f4f8fb' : '#aaa396';
    put(xx, wy+y, col);
  }
  if (pArr){
    const gx = (NET.exit%COLS)*T;
    for (let y=0;y<WALL;y++) for (let xx=4;xx<16;xx++){
      const edge = (xx===4||xx===15||y===0);
      put(gx+xx, wy+y, edge ? '#2a221c' : ((xx-4)%3===0 ? '#4a3020' : '#6a4528'));
    }
  }
  // réserve
  for (let y=wy+WALL; y<ART_H; y++) for (let xx=0;xx<ART_W;xx++){
    const py = y-(wy+WALL);
    let col = ((py/5|0)%2) ? '#553a24' : '#4e3521';
    if (py%5===4) col = '#36251a';
    if (hash(xx,y,21) > .97) col = '#5f4229';
    put(xx,y,col);
  }
  for (let k=0;k<BENCH_N+1;k++){
    const X0 = k*T, Y0 = BENCH_Y, sell = k===BENCH_N;
    for (let y=1;y<T-1;y++) for (let xx=1;xx<T-1;xx++){
      let col = sell ? '#4b241b' : '#2e2016';
      if (y===1) col = sell ? '#3a1a13' : '#21170f';
      if (y===T-2 || xx===T-2) col = sell ? '#6e3b2a' : '#6b4a30';
      if (xx===1) col = sell ? '#3a1a13' : '#21170f';
      put(X0+xx, Y0+y, col);
    }
  }
  x.putImageData(id,0,0);
  const coin = ICONC.coin; x.drawImage(coin, BENCH_N*T + ((T-coin.width)>>1), BENCH_Y + ((T-coin.height)>>1));
  bgCan = c;
}
