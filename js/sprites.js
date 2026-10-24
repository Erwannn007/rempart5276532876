'use strict';

// <SPRITES>
const T = 20;
const OUT = '#1a1320', SK = '#f0bf98', SKD = '#cf8f6a', EYE = '#21182a';
const GOLD = '#e0a93a', GEM = '#e2334a', HAIR = '#6b4428';
const MET = [
  { m:'#8a6a4a', h:'#b08a60' },  // cuir
  { m:'#8e99a4', h:'#c3cbd3' },  // fer
  { m:'#b9c6d2', h:'#eef4f8' },  // acier
  { m:'#e0a93a', h:'#fbe08a' },  // or
  { m:'#f2ead6', h:'#ffffff' }   // ivoire
];
const hex2 = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
const toHex = a => '#' + a.map(v => Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
const shade = (h,k) => toHex(hex2(h).map(v => k > 1 ? v + (255-v)*(k-1) : v*k));

class Spr {
  constructor(w = T, h = T){ this.w = w; this.h = h; this.g = new Array(w*h).fill(null); this.ns = new Uint8Array(w*h); }
  p(x,y,c,flat){ if (x<0||y<0||x>=this.w||y>=this.h) return; const i=y*this.w+x; this.g[i]=c; this.ns[i]=flat?1:0; }
  r(x,y,w,h,c,f){ for(let j=0;j<h;j++) for(let i=0;i<w;i++) this.p(x+i,y+j,c,f); }
  hl(x0,x1,y,c,f){ for(let x=x0;x<=x1;x++) this.p(x,y,c,f); }
  v(x,y0,y1,c,f){ for(let y=y0;y<=y1;y++) this.p(x,y,c,f); }
  pixels(){
    const {w,h,g,ns} = this, out = new Array(w*h).fill(null);
    const at = (x,y) => (x<0||y<0||x>=w||y>=h) ? null : g[y*w+x];
    for (let y=0;y<h;y++) for (let x=0;x<w;x++){
      const i=y*w+x, c=g[i];
      if (c){
        if (ns[i]) out[i]=c;
        else if (!at(x,y+1) || !at(x+1,y)) out[i]=shade(c,.76);
        else if (!at(x,y-1) || !at(x-1,y)) out[i]=shade(c,1.16);
        else out[i]=c;
      } else if (at(x-1,y)||at(x+1,y)||at(x,y-1)||at(x,y+1)) out[i]=OUT;
    }
    return { w, h, px: out };
  }
}

/* ---- Épéiste ---- */
function drawLame(s,l){
  const m = MET[l-1], c = l===5 ? '#a8323a' : '#c4473d', cd = '#7a2622';
  if (l>=4){ s.r(5,10,10,7, l===5 ? '#4f2a74' : cd); if (l===5) s.hl(5,14,16,GOLD); }
  s.r(7,15,2,2,'#4b3a2e'); s.r(11,15,2,2,'#4b3a2e');
  const boot = l>=3 ? m.m : '#3a2a1f'; s.r(6,17,3,1,boot); s.r(11,17,3,1,boot);
  s.r(6,10,8,5,c);
  if (l>=3){ s.r(7,10,6,3,m.m); s.hl(8,11,10,m.h,1); }
  else if (l===2){ s.r(8,10,4,1,m.m); }
  s.hl(6,13,13,'#4b3020'); s.r(9,13,2,1, l>=4 ? GOLD : m.h, 1);
  s.r(5,10,1,3,c); s.r(14,10,1,3,c); s.p(5,13,SK); s.p(14,13,SK);
  if (l>=2){ s.p(5,12,m.m); s.p(14,12,m.m); }
  if (l>=3){ s.r(4,9,3,2,m.m); s.r(13,9,3,2,m.m); s.hl(4,6,9,m.h,1); s.hl(13,15,9,m.h,1); }
  s.r(7,4,6,6,SK); s.p(8,7,EYE,1); s.p(11,7,EYE,1); s.hl(9,10,9,SKD,1);
  if (l===1){ s.r(7,3,6,2,HAIR); s.hl(7,12,5,c); }
  else {
    s.r(7,3,6,4,m.m); s.hl(8,11,3,m.h,1);
    s.p(7,7,m.m); s.p(12,7,m.m); s.p(9,7,m.m); s.p(10,7,m.m);
  }
  if (l===4){ s.r(9,1,2,2,c); s.p(11,1,c); s.p(12,2,c); }
  if (l===5){ s.hl(7,12,2,GOLD); s.p(7,1,GOLD); s.p(9,1,GOLD); s.p(10,1,GOLD); s.p(12,1,GOLD); s.r(9,2,2,1,GEM,1); }
  if (l>=2){
    const face = l===2 ? '#8b5a33' : l===5 ? '#f2ead6' : c, rim = l>=4 ? GOLD : m.m;
    s.hl(3,4,10,rim); s.v(2,11,14,rim); s.v(5,11,14,rim); s.hl(3,4,15,rim);
    s.r(3,11,2,4,face);
    s.r(3,12,2,2, l===5 ? GEM : rim, l>=4?1:0);
  }
  const blade = l===5 ? '#eafcff' : l>=3 ? '#dfe6ec' : '#c2c9d0';
  const top = [6,5,4,3,2][l-1];
  if (l>=4){ s.r(15,top,2,12-top,blade); s.p(16,top,null); if (l===5) s.v(16,top+1,11,'#ffffff',1); }
  else s.v(15,top,11,blade);
  s.hl(14,16,12, l>=4 ? GOLD : '#6b4a2e'); if (l>=4) s.p(17,12,GOLD);
  s.v(15,13,14,'#5a3a24'); s.p(15,15, l>=4 ? GOLD : m.m);
}

/* ---- Archère ---- */
function drawArc(s,l){
  const m = MET[l-1];
  const tun = l===5 ? '#2f6f8f' : '#5a9a4c';
  const hood = l===5 ? '#ece6d4' : l===4 ? '#2f6a33' : '#3f7d3a';
  if (l>=4) s.r(6,9,8,8, l===5 ? '#24557a' : '#2c5a2a');
  s.r(13,6,2,6, l>=4 ? '#6b3f1f' : '#7a4a2a'); if (l>=2) s.hl(13,14,8,m.m);
  s.p(13,5,'#e8e2d0',1); s.p(14,4,'#e8e2d0',1); s.p(14,5,'#c8473d',1);
  s.r(7,15,2,2,'#5a4a36'); s.r(11,15,2,2,'#5a4a36');
  const boot = l>=3 ? '#4a3020' : '#3a2a1f';
  s.r(7,17,2,1,boot); s.r(11,17,2,1,boot); if (l>=3){ s.p(7,16,boot); s.p(12,16,boot); }
  s.r(6,10,8,5,tun);
  s.hl(6,13,13,'#4b3020'); s.p(9,13, l>=4 ? GOLD : m.h, 1);
  s.p(12,10,'#4b3020'); s.p(11,11,'#4b3020'); s.p(10,12,'#4b3020');
  s.r(14,10,1,3,tun); s.p(14,13,SK);
  const bw = l===5 ? '#f2ead6' : l===4 ? GOLD : l===3 ? '#5b3820' : '#8b5a2b';
  const yT = l>=3 ? 4 : 6, yB = l>=3 ? 17 : 16;
  s.v(4,yT+1,yB-1,'#eee6cf',1);
  s.p(4,yT,bw); s.p(3,yT+1,bw); s.v(2,yT+2,yB-2,bw); s.p(3,yB-1,bw); s.p(4,yB,bw);
  if (l>=2){ s.p(4,yT,m.h,1); s.p(4,yB,m.h,1); }
  if (l===5){ s.p(2,10,GEM,1); s.p(2,11,GEM,1); }
  s.p(5,10,tun); s.r(4,11,2,1,tun); s.p(3,11,SK);
  if (l>=2) s.p(4,11,m.m);
  if (l>=3){ const mt = l===5 ? '#c9c1aa' : '#2c5a2a'; s.r(5,9,10,2,mt); s.hl(6,13,9,shade(mt,1.2)); }
  if (l===2){ s.r(13,9,2,2,m.m); s.p(7,14,'#7a4a2a'); }
  s.r(7,4,6,6,SK); s.p(8,7,EYE,1); s.p(11,7,EYE,1);
  s.p(7,6,'#a35a2a'); s.p(8,6,'#a35a2a'); s.p(12,6,'#a35a2a');
  if (l===1){ s.r(7,3,6,2,'#a35a2a'); s.p(7,5,'#a35a2a'); s.p(12,5,'#a35a2a'); s.v(13,4,7,'#a35a2a'); s.hl(7,12,5,'#c8473d'); }
  else { s.r(6,3,8,3,hood); s.v(6,6,9,hood); s.v(13,6,9,hood); s.p(12,2,hood); s.p(13,2,hood); }
  if (l>=4) s.hl(7,12,5,GOLD,1);
  if (l===4){ s.p(15,2,'#c8473d',1); s.p(15,3,'#e86a5a',1); }
  if (l===5){ s.r(9,5,2,1,GEM,1); s.p(15,1,'#ffffff',1); s.p(15,2,'#dff3ff',1); s.p(15,3,'#bfe4ff',1); }
}

/* ---- Artificier (nain) ---- */
function drawBombe(s,l){
  const m = MET[l-1], c = l===5 ? '#b5452a' : '#d9822b';
  const beard = l===5 ? '#ece6d4' : '#8a3a1a';
  if (l>=4){ s.r(2,7,4,7,'#8a5a32'); s.hl(2,5,8,m.m); s.hl(2,5,12,m.m); s.hl(2,5,6,'#6b4422'); }
  s.r(6,16,3,1,'#4b3a2e'); s.r(11,16,3,1,'#4b3a2e');
  const boot = l>=3 ? m.m : '#3a2a1f'; s.r(5,17,4,1,boot); s.r(11,17,4,1,boot);
  s.r(5,10,10,6,c);
  s.hl(5,14,14,'#4b3020'); s.r(9,14,2,1, l>=4 ? GOLD : m.h, 1);
  if (l>=2){ ['#4b3020'].forEach(b=>{ s.p(13,10,b); s.p(12,11,b); s.p(13,12,b); s.p(12,13,b); }); s.p(13,11,'#2b2b33',1); s.p(12,12,'#2b2b33',1); }
  if (l>=3){ s.r(4,9,3,2,m.m); s.r(13,9,3,2,m.m); s.hl(4,6,9,m.h,1); s.hl(13,15,9,m.h,1); }
  s.r(4,10,1,4,c); s.p(4,14,SK);
  s.r(15,10,1,2,c); s.p(15,12,SK);
  s.r(7,4,6,5,SK);
  s.hl(7,12,5,'#4b3020'); s.p(8,5,'#8fd3ef',1); s.p(11,5,'#8fd3ef',1);
  s.p(8,6,EYE,1); s.p(11,6,EYE,1);
  s.hl(7,8,7,beard); s.hl(11,12,7,beard); s.r(9,7,2,1,'#e0866a');
  s.r(6,8,8,3,beard); s.hl(7,12,11,beard); s.hl(8,11,12,beard); s.hl(9,10,13,beard);
  s.hl(8,11,8, shade(beard,1.15), 1);
  if (l===1){ s.r(7,3,6,2,'#6b4a2e'); }
  else { s.r(7,2,6,3,m.m); s.hl(6,13,4,m.m); s.hl(8,10,2,m.h,1); }
  if (l===3 || l===4) s.r(9,1,2,1,m.m);
  if (l===5){ s.p(6,3,'#efe6d0'); s.p(5,2,'#efe6d0'); s.p(5,1,'#efe6d0'); s.p(13,3,'#efe6d0'); s.p(14,2,'#efe6d0'); s.p(14,1,'#efe6d0'); s.r(9,2,2,1,GEM,1); }
  const bc = l===5 ? '#9b1d2a' : '#2b2b33';
  s.hl(16,17,12,bc); s.hl(15,18,13,bc); s.hl(15,18,14,bc); s.hl(16,17,15,bc);
  s.p(16,13,'#6b6b78',1);
  if (l>=4) s.hl(15,18,14,GOLD);
  s.p(18,12,'#8a6a3a'); s.p(18,11,'#ffd23f',1);
  if (l>=3){ s.p(17,10,'#ff8a2a',1); s.p(18,10,'#fff3b0',1); }
}

/* ---- Mage de givre ---- */
function drawGivre(s,l){
  const m = MET[l-1];
  let c = '#3f7fcf', cd = '#25508c', trim = '#e8f4ff';
  if (l===5){ c = '#d6ebff'; cd = '#8fb6dc'; trim = '#3f7fcf'; }
  const staff = ['#7a5230','#7a5230','#5b3b22',GOLD,'#f2ead6'][l-1];
  const ice = '#aeeeff', iceW = '#ffffff';
  const sTop = l>=4 ? 5 : 4;
  s.v(3,sTop,17,staff);
  if (l===1){ s.p(3,2,ice); s.p(3,3,ice); }
  else if (l<=3){ s.p(3,1,ice); s.hl(2,4,2,ice); s.p(3,3,ice); s.p(3,2,iceW,1); }
  else { s.p(3,1,ice); s.hl(2,4,2,ice); s.hl(2,4,3,ice); s.p(3,4,ice); s.p(3,2,iceW,1); s.p(1,2,ice,1); s.p(5,3,ice,1); }
  s.r(6,10,8,5,c); s.r(5,15,10,3,c);
  if (l>=2){ s.hl(5,14,17,trim); s.v(10,14,16,cd); }
  s.hl(6,13,13, l>=4 ? GOLD : '#c9b37a');
  s.r(14,10,1,3,c); s.p(14,13,SK);
  s.r(4,10,2,2,c); s.p(4,12,SK);
  if (l>=3){ s.p(5,9,ice); s.p(14,9,ice); s.p(15,9,ice,1); s.p(4,9,ice,1); }
  s.r(7,5,6,5,SK); s.p(8,7,EYE,1); s.p(11,7,EYE,1);
  const bd = '#eef2f6';
  s.hl(8,11,8,bd); s.r(7,9,6,2,bd); s.hl(8,11,11,bd); s.hl(9,10,12,bd);
  s.hl(5,14,5,c); s.hl(7,12,4,c); s.hl(8,11,3,c); s.hl(9,11,2,c); s.hl(10,12,1,c);
  if (l>=2) s.hl(7,12,4, l>=4 ? GOLD : cd);
  if (l===4) s.p(10,3,'#fff3a0',1);
  if (l===5){ s.p(6,4,ice); s.p(13,4,ice); s.p(7,3,ice); s.p(12,3,ice); s.p(10,3,GEM,1); }
  if (l>=4){ s.p(16,6,ice); s.hl(15,17,7,ice); s.p(16,8,ice); s.p(16,7,iceW,1); }
}

/* ---- Foudroyeur ---- */
function drawFoudre(s,l){
  const m = MET[l-1];
  let c = '#7a58c9', cd = '#4a3388';
  if (l===5){ c = '#2f3f8f'; cd = '#1f2a5a'; }
  const Y = '#ffe066', YW = '#fffbe0';
  if (l>=4) s.r(5,10,10,7, l===5 ? '#c8962e' : cd);
  s.r(7,15,2,2,'#3a3046'); s.r(11,15,2,2,'#3a3046');
  s.r(6,17,3,1,'#241d2e'); s.r(11,17,3,1,'#241d2e');
  s.r(6,10,8,5,c);
  s.hl(6,13,13,'#2a2238'); s.r(9,13,2,1,Y,1);
  s.p(10,10,Y,1); s.p(9,11,Y,1); s.p(10,11,Y,1); s.p(9,12,Y,1);
  if (l>=3){ s.r(4,9,3,2,m.m); s.r(13,9,3,2,m.m); s.p(4,8,m.m); s.p(15,8,m.m); }
  s.r(5,10,1,3,c); s.p(5,13,SK); if (l>=2) s.p(5,12,m.m);
  if (l>=2){ s.p(4,14,Y,1); s.p(3,15,YW,1); }
  s.p(14,10,c); s.v(15,7,9,c); s.p(15,6,SK); if (l>=2) s.p(15,8,m.m);
  if (l===1){ s.p(15,5,Y,1); s.p(15,4,YW,1); s.p(16,3,Y,1); }
  else if (l===2){ s.r(15,4,2,2,Y,1); s.p(15,4,YW,1); s.p(17,3,YW,1); s.p(14,3,Y,1); }
  else {
    const o = l===5 ? YW : Y;
    s.hl(15,16,2,o,1); s.r(14,3,4,2,o,1); s.hl(15,16,5,o,1);
    s.r(15,3,2,2, l===5 ? '#ffffff' : YW, 1);
    s.p(18,2,YW,1); s.p(13,1,YW,1);
  }
  s.r(7,4,6,6,SK);
  const eye = l>=3 ? '#fff3a0' : EYE;
  s.p(8,7,eye,1); s.p(11,7,eye,1);
  const hr = l===5 ? '#f4f0ff' : l===1 ? '#7a4a24' : '#f0c94a';
  s.r(7,3,6,2,hr); s.p(7,5,hr); s.p(12,5,hr);
  if (l===1){ s.p(8,2,hr); s.p(11,2,hr); }
  else { s.p(7,2,hr); s.p(9,1,hr); s.p(9,2,hr); s.p(11,2,hr); s.p(12,1,hr); s.p(6,3,hr); s.p(13,3,hr); }
  if (l===5){ s.hl(7,12,4,GOLD,1); s.r(9,4,2,1,GEM,1); }
  if (l>=4){ s.r(2,6,2,2,Y,1); s.p(2,6,YW,1); }
}

/* ---- Gardien nain : heaume clos, barbe tressée, bouclier-tour ---- */
function drawNain(s,l){
  const m = MET[l-1], c = l===5 ? '#2a6a6a' : '#3a8a8a', cd = '#24555a';
  const beard = l===5 ? '#ece6d4' : '#8a5a3a', hlm = l===5 ? GOLD : m.m, ring = l>=4 ? GOLD : m.m;
  if (l>=4){ s.r(4,10,9,7, l===5 ? '#4f2a74' : cd); if (l===5) s.hl(4,12,16,GOLD); }
  // marteau, tenu derrière l'épaule
  s.v(2,9,15,'#6b4a2e');
  if (l===1){ s.hl(0,4,7,'#8e99a4'); s.p(0,8,'#8e99a4'); s.p(4,8,'#8e99a4'); s.v(2,6,8,'#6b4a2e'); }
  else {
    const hm = l===5 ? GOLD : m.m;
    s.r(0,6,5,3,hm); s.hl(0,4,6,m.h,1);
    if (l===4){ s.v(0,6,8,GOLD); s.v(4,6,8,GOLD); }
    if (l===5) s.p(2,7,GEM,1);
  }
  s.r(6,16,2,1,'#3a3036'); s.r(10,16,2,1,'#3a3036');
  const boot = l>=3 ? m.m : '#3a2a1f'; s.r(5,17,4,1,boot); s.r(9,17,4,1,boot);
  s.r(5,11,8,5,c);
  if (l>=2){ s.r(6,11,6,2,hlm); s.hl(6,11,11, l===5 ? '#fbe08a' : m.h,1); }
  s.hl(5,12,14,'#4b3020'); s.r(8,14,2,1, l>=4 ? GOLD : m.h, 1);
  if (l>=3){ s.r(4,10,3,2,m.m); s.hl(4,6,10,m.h,1); }
  s.r(4,12,1,3,c); s.p(3,12,SK); s.p(4,11,SK);
  // tête
  s.r(6,6,6,4,SK);
  if (l<=2){
    s.p(7,8,EYE,1); s.p(10,8,EYE,1);
    if (l===1){ s.r(6,4,6,3,m.m); s.hl(5,12,6,m.m); s.p(9,4,'#ffd23f',1); }
    else { s.r(6,3,6,4,m.m); s.hl(7,10,3,m.h,1); s.hl(5,12,6,m.m); s.r(8,7,2,2,m.m); }
  } else {
    const glow = l>=4 ? '#7fe3ff' : '#f2c14e';
    s.r(6,3,6,6,hlm); s.hl(7,10,2,hlm); s.hl(7,9,3, l===5 ? '#fbe08a' : m.h,1);
    s.hl(6,11,7,'#21182a',1); s.p(7,7,glow,1); s.p(10,7,glow,1);
    s.v(8,4,6, l===4 ? GOLD : l===5 ? '#f2ead6' : m.h, 1);
  }
  if (l===4){ s.p(5,4,'#efe6d0'); s.p(4,3,'#efe6d0'); s.p(4,2,'#efe6d0'); s.p(12,4,'#efe6d0'); s.p(13,3,'#efe6d0'); s.p(13,2,'#efe6d0'); }
  if (l===5){ s.hl(6,11,1,GOLD); s.p(6,0,GOLD); s.p(8,0,GOLD); s.p(9,0,GOLD); s.p(11,0,GOLD); s.p(9,1,GEM,1); }
  // barbe en deux tresses
  s.r(6,9,6,3,beard); s.hl(7,10,12,beard); s.v(7,13,15,beard); s.v(10,13,15,beard);
  s.hl(7,10,9, shade(beard,1.25), 1);
  if (l>=2){ s.p(7,14,ring,1); s.p(10,14,ring,1); }
  if (l>=4){ s.p(7,12,ring,1); s.p(10,12,ring,1); }
  // bouclier-tour, face à l'ennemi
  if (l===1){
    s.r(13,10,5,5,'#8b5a33'); s.hl(14,16,9,'#8e99a4'); s.hl(14,16,15,'#8e99a4'); s.v(12,11,13,'#8e99a4'); s.v(18,11,13,'#8e99a4');
    s.p(15,12,'#c3cbd3',1);
  } else {
    const rim = l>=4 ? GOLD : m.m, face = l===2 ? '#8b5a33' : l===3 ? m.m : l===4 ? c : '#f2ead6';
    s.r(12,7,6,10,rim); s.r(13,8,4,8,face); s.hl(13,16,16,null);
    s.p(12,7,null); s.p(17,7,null); s.p(12,16,null); s.p(17,16,null); s.hl(13,16,17,rim);
    if (l===2){ s.v(15,8,15,'#6b4422'); s.hl(13,16,10,'#8e99a4'); s.hl(13,16,14,'#8e99a4'); }
    else {
      const em = l===3 ? c : l===4 ? '#7fe3ff' : GEM;
      s.r(14,10,2,4,em,1); s.r(13,11,4,2,em,1);
      if (l>=4) s.p(14,11,'#ffffff',1);
    }
  }
  s.p(12,12,SK);
}

/* ---- Pyromancienne : chevelure de flammes, boule de feu au poing ---- */
function drawPyro(s,l){
  const m = MET[l-1], c = l===5 ? '#9b1d2a' : '#d8364e', cd = '#7a1a2a';
  const F1 = '#ff8a2a', F2 = '#ffd23f', F3 = '#fff3b0';
  if (l>=4) s.r(5,10,10,7, l===5 ? '#2a1a22' : cd);
  s.r(6,17,3,1,'#3a2028'); s.r(11,17,3,1,'#3a2028');
  s.r(6,10,8,5,c); s.r(5,15,10,2,c); s.hl(5,14,16, l>=4 ? GOLD : cd);
  s.hl(6,13,13,'#4b2030'); s.p(9,13,F2,1); s.p(10,13,F1,1);
  if (l>=2){ s.p(9,11,F1,1); s.p(10,11,F2,1); }
  if (l>=3){ s.r(4,9,3,2,m.m); s.r(13,9,3,2,m.m); s.hl(4,6,9,m.h,1); s.hl(13,15,9,m.h,1); }
  s.r(5,10,1,3,c); s.p(5,13,SK);
  s.r(14,10,2,1,c); s.p(16,10,SK);
  if (l===1){ s.r(16,8,2,2,F1,1); s.p(16,8,F2,1); s.p(17,7,F1,1); }
  else if (l<=3){ s.r(16,7,3,3,F1,1); s.p(17,8,F3,1); s.p(17,6,F2,1); s.p(18,5,F1,1); }
  else { s.r(16,6,4,4,F1,1); s.r(17,7,2,2,F2,1); s.p(17,7,F3,1); s.p(18,5,F2,1); s.p(16,4,F1,1); s.p(19,4,F1,1); }
  s.r(7,4,6,6,SK);
  const eye = l>=3 ? F2 : EYE; s.p(8,7,eye,1); s.p(11,7,eye,1); s.hl(9,10,9,SKD,1);
  s.r(7,3,6,2,F1); s.v(6,4,9,F1); s.v(13,4,9,F1); s.p(7,5,F1); s.p(12,5,F1);
  s.p(7,2,F2,1); s.p(8,1,F1); s.p(9,2,F1); s.p(10,1,F2,1); s.p(11,2,F1); s.p(12,2,F2,1); s.p(6,3,F1); s.p(13,3,F1);
  s.p(6,9,F2,1); s.p(13,9,F2,1);
  if (l>=3){ s.p(10,0,F3,1); s.p(8,0,F2,1); s.p(5,5,F1); s.p(14,6,F1); }
  if (l===5){ s.hl(7,12,4,GOLD,1); s.p(9,4,GEM,1); s.p(10,4,GEM,1); }
}

/* ---- Catapulte : bras armé, pierre dans la cuillère ---- */
function drawCata(s,l){
  const m = MET[l-1], w = l===5 ? '#7a4a2a' : '#a0703c', wd = '#5a3a20', band = l>=4 ? GOLD : m.m;
  if (l>=4){ s.v(17,4,12,wd); s.r(18,4,2,3, l===5 ? '#4f2a74' : '#c4473d'); if (l===5) s.p(18,5,GOLD,1); }
  s.r(2,12,15,3,w); s.hl(2,16,12, shade(w,1.15)); s.v(6,12,14,band); s.v(12,12,14,band);
  s.r(2,15,4,3,wd); s.r(13,15,4,3,wd); s.p(3,16,band,1); s.p(14,16,band,1);
  if (l===5){ s.p(3,16,GEM,1); s.p(14,16,GEM,1); }
  sline(s,8,11,10,6,wd); sline(s,12,11,10,6,wd); s.hl(9,11,7,band);
  sline(s,14,10,4,4,w); sline(s,14,11,5,4,w);
  s.r(1,3,4,2,wd); s.p(1,2,wd); s.p(4,2,wd);
  const rock = l===5 ? '#ff8a2a' : '#8f8a80';
  s.r(2,1,2,2,rock, l===5 ? 1 : 0); if (l===5) s.p(2,1,'#ffd23f',1);
  if (l>=3){ s.r(14,9,3,3,m.m); s.hl(14,16,9,m.h,1); }
  else { s.p(15,10,'#c9b48a'); s.p(16,11,'#c9b48a'); }
  if (l>=2) s.p(10,7,m.h,1);
}

/* ---- Myconide : chapeau tacheté, spores ---- */
function drawMyco(s,l){
  const m = MET[l-1], cap = l===5 ? GOLD : '#c9b04a', spot = '#f3e7cc', stem = '#efe2c8', gill = '#8a6a3a';
  s.r(6,17,3,1,'#a89878'); s.r(11,17,3,1,'#a89878');
  s.r(6,10,8,7,stem);
  s.r(4,12,2,1,stem); s.p(4,13,stem); s.r(14,12,2,1,stem); s.p(15,13,stem);
  s.p(8,12,EYE,1); s.p(11,12,EYE,1); s.p(7,13,'#e8a0a0',1); s.p(12,13,'#e8a0a0',1); s.hl(9,10,13,'#8a5a4a',1);
  if (l>=2){ s.hl(6,13,15,m.m); s.p(9,15,m.h,1); }
  s.hl(7,12,3,cap); s.hl(5,14,4,cap); s.hl(4,15,5,cap); s.r(3,6,14,3,cap); s.hl(4,15,9,gill);
  s.p(4,9,null); s.p(15,9,null);
  const spots = [[8,4],[12,6],[5,7],[10,7],[14,7],[7,6],[11,4]].slice(0, 2 + l);
  for (const [x,y] of spots) s.p(x,y,spot,1);
  if (l>=3){ s.p(1,4,'#d8f0a0',1); s.p(18,6,'#d8f0a0',1); s.p(2,10,'#b8e070',1); s.p(17,2,'#b8e070',1); }
  if (l>=4){ s.p(3,16,'#5a9a4c'); s.p(4,16,'#5a9a4c'); s.p(15,16,'#5a9a4c'); s.p(16,16,'#5a9a4c'); s.p(16,15,'#5a9a4c'); }
  if (l===5){ s.r(9,1,2,2,'#e2334a'); s.p(9,1,spot,1); s.p(7,2,'#e2334a'); s.p(12,2,'#e2334a'); s.p(9,10,GEM,1); s.p(10,10,GEM,1); }
}

/* ---- Baliste : arbalète géante sur trépied ---- */
function drawBal(s,l){
  const m = MET[l-1], w = '#8a5a33', wd = '#5a3a20', bow = l>=4 ? GOLD : m.m;
  sline(s,9,11,5,16,wd); sline(s,10,11,14,16,wd); s.v(9,12,16,wd);
  s.hl(4,6,17,wd); s.hl(13,15,17,wd); s.hl(8,10,17,wd);
  s.r(6,10,7,2,w);
  s.r(2,8,13,2,w); s.hl(2,14,8, shade(w,1.15));
  sline(s,13,1,15,4,bow); s.v(15,4,13,bow); sline(s,15,13,13,16,bow);
  sline(s,13,2,4,7,'#e8dcc0',1); sline(s,13,15,4,10,'#e8dcc0',1);
  const bolt = l===5 ? '#f2ead6' : '#c9b48a';
  s.hl(3,16,7,bolt); s.p(17,6,m.h); s.p(17,7,m.h); s.p(18,7,m.h); s.p(17,8,m.h);
  s.p(3,6,'#c4473d'); s.p(2,6,'#c4473d');
  if (l>=3){ s.r(3,10,3,3,m.m); s.p(4,11,wd,1); }
  if (l>=4){ s.r(11,10,3,4,m.m); s.hl(11,13,10,m.h,1); }
  if (l===5){ s.p(12,12,GEM,1); s.p(15,8,GEM,1); }
}

/* ---- Ennemis ---- */
function enSlime(s){
  const c = '#79c25b';
  s.hl(8,11,8,c); s.hl(6,13,9,c); s.r(5,10,10,5,c); s.hl(4,15,15,c);
  s.p(7,10,'#c9f2a8',1); s.p(6,11,'#c9f2a8',1);
  s.r(8,11,1,2,EYE,1); s.r(11,11,1,2,EYE,1); s.hl(9,10,14,'#3a6b2a',1);
}
function enWolf(s){
  const g = '#8b8f9c', d = '#5d6170', l = '#c9ccd4';
  s.r(5,11,10,5,d); s.r(5,16,2,2,d); s.r(13,16,2,2,d);
  s.r(6,5,8,6,g); s.p(6,3,g); s.r(6,4,2,1,g); s.p(13,3,g); s.r(12,4,2,1,g);
  s.p(7,4,'#d98a8a',1); s.p(12,4,'#d98a8a',1);
  s.r(8,9,4,3,l); s.r(9,9,2,1,EYE,1); s.p(8,12,'#ffffff',1); s.p(11,12,'#ffffff',1);
  s.p(7,7,'#ffcf3a',1); s.p(12,7,'#ffcf3a',1);
  s.r(7,14,2,4,g); s.r(11,14,2,4,g);
}
function enGolem(s){
  const st = '#8f897c', dk = '#6b665b', mo = '#5d8a3c', gl = '#7cf3ff';
  s.r(2,7,3,8,st); s.r(15,7,3,8,st);
  s.r(5,6,10,10,st);
  s.r(6,16,3,2,dk); s.r(11,16,3,2,dk);
  s.r(7,2,6,5,st);
  s.p(8,4,gl,1); s.p(11,4,gl,1);
  s.v(9,8,11,dk); s.p(10,12,dk); s.p(8,13,dk);
  s.hl(5,8,6,mo); s.p(7,2,mo); s.hl(15,17,7,mo); s.p(12,2,mo); s.p(2,12,mo);
  s.p(11,10,gl,1);
}
function enBoss(s){
  const a = '#3d3550', ad = '#2a2438', tr = '#b33a3a', hn = '#e9dcc0', ey = '#ff4a3a';
  s.r(4,10,16,11,tr);
  s.r(7,19,4,3,ad); s.r(13,19,4,3,ad);
  s.r(6,10,12,9,a);
  s.r(3,9,4,3,a); s.r(17,9,4,3,a); s.p(3,8,hn); s.p(20,8,hn);
  s.hl(6,17,16,'#d9a334'); s.r(11,16,2,1,'#ffe08a',1);
  s.v(21,4,20,'#6b4a2e'); s.r(18,4,3,4,'#b9c6d2'); s.p(18,4,'#eef4f8',1);
  s.r(18,12,2,4,a); s.p(19,16,ad);
  s.r(4,12,2,4,a);
  s.r(8,3,8,7,a); s.hl(9,14,6,ad); s.p(10,6,ey,1); s.p(13,6,ey,1);
  s.hl(9,14,3, shade(a,1.25), 1);
  s.p(7,3,hn); s.p(6,2,hn); s.p(6,1,hn); s.p(16,3,hn); s.p(17,2,hn); s.p(17,1,hn);
  s.p(11,12,'#d9a334',1); s.p(12,12,'#d9a334',1);
}

function enBigSlime(s){
  const c = '#3fae8f', l = '#bff2e4', d = '#1f6a54';
  s.hl(8,11,4,c); s.hl(6,13,5,c); s.hl(4,15,6,c); s.r(3,7,14,9,c); s.hl(2,17,16,c);
  s.p(6,7,l,1); s.p(5,8,l,1); s.p(7,6,l,1); s.p(5,9,l,1);
  s.p(13,13,'#2f8a70',1); s.p(14,11,'#2f8a70',1); s.p(12,8,'#2f8a70',1);
  s.r(8,10,1,2,EYE,1); s.r(12,10,1,2,EYE,1); s.p(7,9,EYE,1); s.p(13,9,EYE,1);
  s.hl(9,11,14,d,1); s.p(10,15,d,1);
}
function enMini(s){
  const c = '#3fae8f';
  s.hl(9,10,11,c); s.hl(8,11,12,c); s.r(7,13,6,3,c); s.hl(6,13,16,c);
  s.p(8,12,'#bff2e4',1); s.p(8,14,EYE,1); s.p(11,14,EYE,1);
}
function enGoblin(s){
  const sk = '#7fae4a', sd = '#5d8a35', bag = '#a8742a';
  s.r(2,8,6,7,bag); s.hl(3,6,7,bag); s.p(4,6,'#6b4422'); s.p(5,6,'#6b4422');
  s.p(3,8,GOLD,1); s.p(4,7,'#fbe08a',1); s.p(6,8,GOLD,1); s.p(4,11,'#6b4422',1); s.p(5,12,'#6b4422',1);
  s.r(9,15,2,2,sd); s.r(12,15,2,2,sd); s.hl(8,10,17,'#4a3020'); s.hl(12,14,17,'#4a3020');
  s.r(8,11,7,4,'#6b4a2e'); s.hl(8,14,13,'#3a2a1a'); s.p(11,13,GOLD,1);
  s.p(7,12,sk); s.p(15,11,sk); s.p(16,10,sk);
  s.r(8,4,7,7,sk); s.p(6,5,sk); s.p(7,6,sk); s.p(5,4,sk); s.p(16,5,sk); s.p(15,6,sk); s.p(17,4,sk);
  s.p(9,7,'#ffcf3a',1); s.p(13,7,'#ffcf3a',1); s.p(10,7,EYE,1); s.p(12,7,EYE,1);
  s.r(11,8,1,1,sd); s.hl(9,13,9,'#3a2a1a',1); s.p(10,9,'#ffffff',1); s.p(12,9,'#ffffff',1);
  s.hl(9,13,3,'#c8473d'); s.hl(10,12,2,'#c8473d'); s.p(11,1,GOLD,1);
  s.p(17,5,GOLD,1);
}
function enKing(s){
  const c = '#3fae8f', l = '#bff2e4', d = '#1f6a54';
  s.hl(10,17,8,c); s.hl(7,20,9,c); s.hl(5,22,10,c); s.hl(4,23,11,c); s.r(3,12,22,12,c); s.hl(2,25,24,c);
  s.r(6,11,2,1,l,1); s.p(5,12,l,1); s.p(5,13,l,1); s.p(9,9,l,1);
  s.p(20,19,'#2f8a70',1); s.p(21,16,'#2f8a70',1); s.p(6,20,'#2f8a70',1); s.p(17,22,'#2f8a70',1);
  s.r(9,13,2,3,EYE,1); s.r(17,13,2,3,EYE,1); s.p(9,13,'#ffffff',1); s.p(17,13,'#ffffff',1);
  s.hl(8,11,12,EYE,1); s.hl(16,19,12,EYE,1);
  s.hl(10,17,19,d,1); s.hl(11,16,20,d,1); s.p(12,19,'#ffffff',1); s.p(15,19,'#ffffff',1);
  s.r(9,5,10,3,GOLD); s.hl(9,18,7,'#a06d1f');
  s.p(9,4,GOLD); s.p(9,3,GOLD); s.p(12,4,GOLD); s.p(13,3,GOLD); s.p(14,3,GOLD); s.p(15,4,GOLD); s.p(18,4,GOLD); s.p(18,3,GOLD);
  s.p(13,2,'#fbe08a',1); s.p(11,6,GEM,1); s.p(14,5,'#4ea8de',1); s.p(16,6,GEM,1);
  s.hl(10,17,5,'#fbe08a',1);
}

/* ---------- outils ---------- */
function sline(s, x0, y0, x1, y1, c, f){
  const n = Math.max(Math.abs(x1-x0), Math.abs(y1-y0)) || 1;
  for (let i=0;i<=n;i++) s.p(Math.round(x0 + (x1-x0)*i/n), Math.round(y0 + (y1-y0)*i/n), c, f);
}
function recolor(s, map){ for (let i=0;i<s.g.length;i++){ const c = s.g[i]; if (c && map[c]) s.g[i] = map[c]; } }

/* ---------- rangs 6 à 8 : mythril, obsidienne, céleste ---------- */
const TIER_MAP = [
  null,
  { '#e0a93a':'#4fc0d4', '#fbe08a':'#c8f6ff', '#f2ead6':'#8fd4e4', '#ffffff':'#e0fbff', '#e2334a':'#3fe0c0', '#a06d1f':'#2f7f8f', '#d1a23a':'#4fa8b8', '#c8962e':'#5fb0c0',
    '#4f2a74':'#2a5a78', '#24557a':'#1f5a6a', '#2a6a6a':'#2f8f9f', '#ece6d4':'#b8e4ee', '#d6ebff':'#8fd8e4', '#8fb6dc':'#3f8aa0', '#2f3f8f':'#235a78', '#9b1d2a':'#1f6a7a' },
  { '#e0a93a':'#ff6a2a', '#fbe08a':'#ffc06a', '#f2ead6':'#3e3450', '#e2334a':'#ff3a1a', '#a06d1f':'#a8381a', '#d1a23a':'#e0501a',
    '#a8323a':'#4a1a28', '#4f2a74':'#2a1830', '#2f6f8f':'#2a2838', '#24557a':'#1e1a28', '#2a6a6a':'#2a2838', '#b5452a':'#4a2228', '#9b1d2a':'#2a1a22',
    '#d6ebff':'#3a3050', '#8fb6dc':'#2a2440', '#2f3f8f':'#241a34', '#c8962e':'#3a2a40', '#ece6d4':'#4a4058' },
  { '#e0a93a':'#ffe680', '#fbe08a':'#fffbe0', '#f2ead6':'#ffffff', '#e2334a':'#7fd8ff', '#a06d1f':'#e0b850', '#d1a23a':'#f2d070',
    '#a8323a':'#f08a8a', '#4f2a74':'#c8b8f0', '#2f6f8f':'#8ad0f0', '#24557a':'#b8e0f8', '#2a6a6a':'#8ad0d8', '#b5452a':'#f0b070', '#9b1d2a':'#f0d0a0',
    '#d6ebff':'#ffffff', '#8fb6dc':'#c0e0ff', '#2f3f8f':'#b8a8ff', '#c8962e':'#fff0c0' }
];
function drawSoldier(s, t, l){
  if (l <= 5){ DRAW[t](s, l); return; }
  const tier = l - 5;
  if (tier === 3){
    const W = '#ffffff';
    for (const [y, x0, x1] of [[5,3,4],[6,2,4],[7,1,4],[8,1,4],[9,1,4],[10,1,3],[11,2,3],[12,2,2]]){
      s.hl(x0, x1, y, W); s.hl(19-x1, 19-x0, y, W);
    }
    s.hl(1,3,9,'#d8e4f0',1); s.hl(16,18,9,'#d8e4f0',1); s.p(2,11,'#d8e4f0',1); s.p(17,11,'#d8e4f0',1);
  }
  if (tier === 2){ s.p(2,6,'#ff8a2a',1); s.p(17,4,'#ffc06a',1); s.p(1,12,'#ff6a2a',1); s.p(18,10,'#ff8a2a',1); }
  DRAW[t](s, 5);
  recolor(s, TIER_MAP[tier]);
  if (tier === 1){ s.p(9,11,'#c8f6ff',1); s.p(3,4,'#c8f6ff',1); s.p(16,3,'#7fe3ff',1); }
  if (tier === 2){ s.p(9,11,'#ff8a2a',1); s.p(10,12,'#ffc06a',1); }
  if (tier === 3){ s.hl(8,11,0,'#fff3a0',1); s.p(7,1,'#fff3a0',1); s.p(12,1,'#fff3a0',1); }
}

/* ---------- nouveaux monstres ---------- */
function enSkeleton(s){
  const b = '#e8e2d0', k = '#2a2430';
  s.r(7,3,6,5,b); s.hl(8,11,2,b); s.hl(8,11,8,b);
  s.r(8,5,1,2,k,1); s.r(11,5,1,2,k,1); s.p(9,7,k,1); s.p(10,7,k,1);
  s.p(9,8,k,1); s.p(11,8,k,1);
  s.v(9,9,14,b); s.v(10,9,14,b);
  s.hl(7,12,10,b); s.hl(7,12,12,b); s.p(7,11,b); s.p(12,11,b);
  s.hl(8,11,14,b);
  s.v(8,15,17,b); s.v(11,15,17,b); s.p(7,17,b); s.p(12,17,b);
  s.v(6,10,13,b); s.v(13,10,12,b); s.p(14,12,b);
  s.v(15,6,12,'#9a8a7a'); s.p(15,5,'#c9bfb4',1); s.hl(14,16,13,'#6b4428'); s.p(15,14,'#6b4428');
}
function enSpider(s){
  const c = '#3a2a4a', leg = '#2a1e36';
  for (const [a,b,x,y] of [[7,9,4,6],[7,10,2,10],[7,12,3,15],[12,9,15,6],[12,10,17,10],[12,12,16,15]]){ sline(s,a,b,x,y,leg); }
  s.p(3,6,leg); s.p(16,6,leg); s.p(2,16,leg); s.p(17,16,leg);
  s.hl(8,11,5,c); s.r(7,6,6,5,c); s.hl(8,11,11,c);
  s.r(8,11,4,3,c);
  s.p(9,7,'#c8302a',1); s.p(10,7,'#c8302a',1); s.hl(9,10,8,'#e05040',1); s.p(9,9,'#c8302a',1); s.p(10,9,'#c8302a',1);
  s.p(8,12,'#ff4a3a',1); s.p(9,12,'#ff4a3a',1); s.p(10,12,'#ff4a3a',1); s.p(11,12,'#ff4a3a',1);
  s.p(9,14,'#5a4a6e'); s.p(10,14,'#5a4a6e');
}
function enBat(s){
  const c = '#4a3a5a', w = '#3a2a48', m = '#6a5a7a';
  const wing = [[4,1,1],[5,1,3],[6,2,5],[7,2,7],[8,3,7],[9,3,7],[10,5,7],[11,6,7]];
  for (const [y,x0,x1] of wing){ s.hl(x0,x1,y,w); s.hl(19-x1,19-x0,y,w); }
  s.p(4,10,w); s.p(15,10,w);
  sline(s,7,7,2,5,m,1); sline(s,7,8,4,10,m,1); sline(s,12,7,17,5,m,1); sline(s,12,8,15,10,m,1);
  s.r(8,7,4,6,c); s.p(8,5,c); s.p(8,6,c); s.p(11,5,c); s.p(11,6,c);
  s.p(9,8,'#ff4a3a',1); s.p(10,8,'#ff4a3a',1); s.p(9,10,'#ffffff',1); s.p(10,10,'#ffffff',1);
  s.p(9,13,c); s.p(10,13,c);
}
function enOrc(s){
  const sk = '#6a8a3a', ar = '#6b4a2e', ir = '#8e99a4', wd = '#8a5a32';
  s.v(15,6,15,'#6b4428'); s.r(16,5,3,4,ir); s.p(16,5,'#c3cbd3',1);
  s.r(8,16,2,2,'#4a3a2a'); s.r(11,16,2,2,'#4a3a2a');
  s.r(7,10,7,6,ar); s.hl(7,13,14,'#3a2a1a');
  s.r(14,10,1,4,sk); s.p(14,14,sk);
  s.r(7,3,6,6,sk); s.r(7,2,6,2,ir); s.hl(8,11,1,ir); s.hl(8,10,2,'#c3cbd3',1);
  s.hl(7,12,4,'#4a6a2a'); s.p(8,5,'#ffcf3a',1); s.p(11,5,'#ffcf3a',1);
  s.p(8,8,'#f2ead6',1); s.p(11,8,'#f2ead6',1); s.hl(9,10,6,'#5a7a2a',1);
  s.r(2,8,6,9,wd); s.hl(2,7,8,ir); s.hl(2,7,16,ir); s.v(2,8,16,ir); s.v(7,8,16,ir);
  s.v(4,9,15,'#6b4422',1); s.r(4,11,2,2,'#c3cbd3');
}
function enShaman(s){
  const sk = '#7fae4a', robe = '#5a4a2a', leaf = '#4f7a2e';
  s.v(15,4,17,'#6b4428'); s.r(14,1,3,3,'#7cff8a'); s.p(15,2,'#eaffea',1);
  s.r(8,16,2,2,sk); s.r(11,16,2,2,sk);
  s.r(7,10,6,6,robe); s.hl(7,12,15,leaf); s.p(8,11,leaf,1); s.p(11,12,leaf,1); s.p(9,13,leaf,1);
  s.p(6,11,sk); s.p(6,12,sk); s.p(13,11,sk); s.p(14,10,sk);
  s.r(7,4,6,6,sk); s.p(5,5,sk); s.p(6,6,sk); s.p(14,5,sk); s.p(13,6,sk);
  s.p(8,6,'#ffe066',1); s.p(11,6,'#ffe066',1); s.hl(8,11,8,'#3a2a1a',1);
  s.p(8,7,'#c8473d',1); s.p(11,7,'#c8473d',1);
  s.hl(7,12,4,'#8a5a32');
  s.p(8,2,'#c8473d'); s.p(8,3,'#c8473d'); s.v(10,1,3,'#3f7fcf'); s.p(12,2,'#f2c14e'); s.p(12,3,'#f2c14e');
}
function enGhost(s){
  const c = '#dfe8f4', e = '#2a3048';
  s.hl(8,11,3,c); s.hl(6,13,4,c); s.r(5,5,10,10,c);
  s.hl(5,6,15,c); s.hl(8,9,15,c); s.hl(11,12,15,c); s.p(14,15,c); s.p(5,16,c); s.p(9,16,c); s.p(12,16,c);
  s.p(4,9,c); s.p(4,10,c); s.p(15,9,c); s.p(15,10,c); s.p(3,11,c); s.p(16,11,c);
  s.r(7,7,2,3,e,1); s.r(11,7,2,3,e,1); s.r(9,11,2,2,e,1);
  s.p(7,5,'#ffffff',1); s.p(6,6,'#ffffff',1);
}
function enBeetle(s){
  const sh = '#2f6a5a', hl = '#5fc8a8', dk = '#1e3a34';
  for (const [x,y] of [[3,9],[2,10],[3,12],[2,13],[4,15],[3,16]]){ s.p(x,y,dk); s.p(19-x,y,dk); }
  s.hl(6,13,6,sh); s.r(4,7,12,8,sh); s.hl(5,14,15,sh); s.hl(7,12,16,sh);
  s.v(9,7,15,dk,1); s.v(10,7,15,dk,1);
  s.hl(5,7,8,hl,1); s.p(5,9,hl,1); s.hl(12,14,8,hl,1); s.p(14,9,hl,1); s.p(6,12,'#4fa890',1); s.p(13,12,'#4fa890',1);
  s.r(7,3,6,4,dk); s.p(9,1,dk); s.p(10,1,dk); s.p(9,2,dk); s.p(10,2,dk);
  s.p(8,5,'#ffcf3a',1); s.p(11,5,'#ffcf3a',1);
}
function enImp(s){
  const r = '#c8402a', d = '#8a2a1a', w = '#5a1a2a';
  for (const [y,x0,x1] of [[7,3,6],[8,2,6],[9,3,6],[10,4,5]]){ s.hl(x0,x1,y,w); s.hl(19-x1,19-x0,y,w); }
  s.p(14,15,r); s.p(15,14,r); s.p(16,13,r); s.p(16,12,d); s.hl(15,17,11,d);
  s.r(8,15,1,2,r); s.r(11,15,1,2,r); s.p(8,17,'#2a1a1a'); s.p(11,17,'#2a1a1a');
  s.r(7,10,6,5,r); s.r(9,11,2,3,'#e06a4a',1);
  s.p(6,11,r); s.p(13,11,r);
  s.r(7,5,6,5,r); s.p(7,4,'#f2ead6'); s.p(6,3,'#f2ead6'); s.p(12,4,'#f2ead6'); s.p(13,3,'#f2ead6');
  s.p(8,7,'#ffe066',1); s.p(11,7,'#ffe066',1); s.hl(8,11,9,'#3a1010',1); s.p(9,9,'#ffffff',1); s.p(10,9,'#ffffff',1);
}
function enHead(s){
  const g = '#3f8a4a', l = '#7cc25b', d = '#2a5a30';
  s.r(8,11,4,7,g); s.v(9,12,17,l,1); s.v(10,12,17,l,1);
  s.r(6,5,8,6,g); s.r(7,10,6,2,g);
  s.p(5,5,d); s.p(5,6,d); s.p(14,5,d); s.p(14,6,d); s.p(8,4,d); s.p(11,4,d); s.p(9,3,d);
  s.p(8,7,'#ffe066',1); s.p(11,7,'#ffe066',1); s.p(9,10,d,1); s.p(10,10,d,1);
  s.p(8,12,'#ffffff',1); s.p(11,12,'#ffffff',1);
}

/* ---------- boss ---------- */
function enDragon(s){
  const r = '#b8322a', rd = '#7a1f1f', bl = '#e8a050', h = '#e9dcc0', w = '#8a2a2a', wm = '#c84a3a';
  const mem = { 4:[7,9], 5:[5,9], 6:[3,9], 7:[1,9], 8:[1,9], 9:[1,9], 10:[1,9], 11:[1,9], 12:[2,9], 13:[3,9], 14:[5,9] };
  for (const y in mem){ s.hl(mem[y][0], mem[y][1], +y, w); s.hl(27-mem[y][1], 27-mem[y][0], +y, w); }
  sline(s,9,4,1,8,wm,1); sline(s,9,6,2,12,wm,1); sline(s,18,4,26,8,wm,1); sline(s,18,6,25,12,wm,1);
  s.p(2,13,'#1a1320'); s.p(4,14,'#1a1320'); s.p(25,13,'#1a1320'); s.p(23,14,'#1a1320');
  s.p(19,22,r); s.p(20,23,r); s.p(21,23,r); s.p(22,22,rd);
  s.r(10,10,8,10,r); s.r(12,12,4,8,bl);
  for (let y=13;y<=19;y+=2) s.hl(12,15,y,shade(bl,.85),1);
  s.r(9,19,3,4,r); s.r(16,19,3,4,r); s.p(9,23,h); s.p(11,23,h); s.p(16,23,h); s.p(18,23,h);
  s.r(8,13,2,3,r); s.r(18,13,2,3,r);
  s.r(12,7,4,4,r);
  s.r(10,2,8,6,r); s.r(11,7,6,2,r);
  s.p(10,1,h); s.p(9,0,h); s.p(17,1,h); s.p(18,0,h);
  s.p(11,4,'#ffe066',1); s.p(16,4,'#ffe066',1); s.p(12,4,'#1a1320',1); s.p(15,4,'#1a1320',1);
  s.p(12,8,rd,1); s.p(15,8,rd,1);
  s.hl(12,15,9,'#ff8a2a',1); s.p(13,10,'#ffe066',1); s.p(14,10,'#ffe066',1); s.p(13,11,'#ff8a2a',1);
}
function enLich(s){
  const robe = '#3a2a5a', bone = '#e8e2d0', gr = '#7cff8a', tr = '#5a3a8a';
  s.v(20,3,22,'#4a3a2a'); s.r(19,0,3,3,bone); s.p(19,1,'#1a1320',1); s.p(21,1,'#1a1320',1); s.p(20,3,gr,1);
  s.r(7,10,10,9,robe); s.r(6,19,12,2,robe); s.p(6,21,robe); s.p(9,21,robe); s.p(13,21,robe); s.p(17,21,robe);
  s.hl(6,17,20,tr); s.p(11,14,gr,1); s.p(12,16,gr,1); s.p(10,17,gr,1);
  s.r(5,11,2,5,robe); s.r(17,11,2,5,robe); s.p(5,16,bone); s.p(18,16,bone); s.p(19,15,bone);
  s.hl(7,16,10,tr);
  s.r(8,3,8,7,robe); s.r(9,5,6,5,bone);
  s.p(10,7,gr,1); s.p(13,7,gr,1); s.p(10,6,'#1a1320',1); s.p(13,6,'#1a1320',1); s.p(11,8,'#1a1320',1);
  s.p(10,9,'#1a1320',1); s.p(12,9,'#1a1320',1);
  s.hl(9,14,3,GOLD); s.p(9,2,GOLD); s.p(11,2,GOLD); s.p(12,2,GOLD); s.p(14,2,GOLD); s.p(11,3,GEM,1);
}
function enKraken(s){
  const c = '#8a3a6a', d = '#5a2048', l = '#c06a98', su = '#e8a0c0';
  s.hl(10,17,1,c); s.hl(8,19,2,c); s.r(7,3,14,9,c); s.hl(8,19,12,c);
  for (const [x,y] of [[10,4],[16,5],[12,6],[18,9],[9,9]]) s.p(x,y,l,1);
  s.r(9,8,3,3,'#ffe066',1); s.r(16,8,3,3,'#ffe066',1); s.v(10,8,10,EYE,1); s.v(17,8,10,EYE,1);
  [6,9,12,15,18,21].forEach((x0,k) => {
    let x = x0;
    for (let y=13;y<=21;y++){
      x = x0 + Math.round(Math.sin((y-13)*.7 + k)*1.2);
      s.p(x,y,c); s.p(x+1,y,c);
      if (y%2 === 0) s.p(x + (k < 3 ? 1 : 0), y, su, 1);
    }
    s.p(x + (k < 3 ? -1 : 2), 22, c);
  });
}
function enTitan(s){
  const st = '#6e6a64', dk = '#4e4a46', lv = '#ff8a2a', lvL = '#ffd27a', mo = '#5d8a3c';
  s.r(1,14,5,6,st); s.r(22,14,5,6,st); s.r(3,8,4,7,st); s.r(21,8,4,7,st);
  s.r(5,6,5,4,st); s.r(18,6,5,4,st);
  s.r(8,6,12,14,st);
  s.r(8,20,5,5,dk); s.r(15,20,5,5,dk); s.hl(7,13,25,dk); s.hl(15,21,25,dk);
  s.r(11,1,6,6,st); s.p(12,3,lv,1); s.p(15,3,lv,1); s.hl(12,15,5,dk,1);
  s.v(13,8,13,lv,1); s.p(14,13,lv,1); s.p(12,14,lv,1); s.p(11,15,lv,1); s.v(17,15,18,lv,1); s.p(6,10,lv,1); s.p(23,11,lv,1); s.p(3,17,lv,1); s.p(24,16,lv,1);
  s.r(13,10,2,2,lvL,1);
  s.hl(5,8,6,mo); s.hl(19,22,6,mo); s.p(11,1,mo); s.p(16,1,mo); s.p(2,14,mo);
}
function enQueen(s){
  const c = '#2a1e36', ab = '#5a2a6a', ml = '#c8302a', leg = '#1e1628';
  for (const pts of [[[10,9],[4,5],[1,9]],[[10,11],[3,10],[1,15]],[[10,13],[4,15],[2,20]],[[11,14],[7,18],[6,21]]]){
    sline(s,pts[0][0],pts[0][1],pts[1][0],pts[1][1],leg); sline(s,pts[1][0],pts[1][1],pts[2][0],pts[2][1],leg);
    sline(s,27-pts[0][0],pts[0][1],27-pts[1][0],pts[1][1],leg); sline(s,27-pts[1][0],pts[1][1],27-pts[2][0],pts[2][1],leg);
  }
  s.hl(10,17,2,ab); s.r(9,3,10,8,ab); s.hl(10,17,11,ab);
  s.p(13,5,ml,1); s.p(14,5,ml,1); s.hl(12,15,6,ml,1); s.p(13,7,ml,1); s.p(14,7,ml,1); s.p(11,4,'#8a4a9a',1); s.p(16,8,'#8a4a9a',1);
  s.r(10,11,8,5,c); s.r(11,15,6,4,c);
  s.p(12,16,'#ff4a3a',1); s.p(15,16,'#ff4a3a',1); s.p(13,17,'#ff4a3a',1); s.p(14,17,'#ff4a3a',1); s.p(12,18,'#ff9a6a',1); s.p(15,18,'#ff9a6a',1);
  s.hl(12,15,14,GOLD); s.p(12,13,GOLD); s.p(15,13,GOLD); s.p(13,13,'#fbe08a',1);
  s.p(13,19,'#e8e2d0'); s.p(14,19,'#e8e2d0');
}
function enMino(s){
  const fur = '#6a4228', fd = '#4a2e1a', sk = '#b07a50', h = '#efe6d0', ax = '#c3cbd3';
  s.v(20,2,21,'#6b4428'); s.r(17,3,3,4,ax); s.r(21,3,2,4,ax); s.p(17,3,'#eef4f8',1);
  s.r(8,18,3,3,fur); s.r(13,18,3,3,fur); s.hl(8,10,21,'#2a1a12'); s.hl(13,15,21,'#2a1a12');
  s.r(8,15,8,3,'#8a2a2a'); s.hl(8,15,15,'#5a1a1a');
  s.r(7,9,10,6,sk); s.hl(8,10,10,shade(sk,1.15),1); s.hl(13,15,10,shade(sk,1.15),1); s.p(11,12,shade(sk,.82),1); s.p(12,12,shade(sk,.82),1);
  s.r(5,9,2,6,sk); s.r(17,9,2,3,sk); s.r(18,11,2,2,sk);
  s.r(8,2,8,7,fur); s.r(9,7,6,3,'#8a5a3a');
  s.p(10,8,fd,1); s.p(13,8,fd,1); s.hl(11,12,10,GOLD,1);
  s.p(9,4,'#ff4a3a',1); s.p(14,4,'#ff4a3a',1);
  s.p(7,3,h); s.p(6,2,h); s.p(5,2,h); s.p(4,1,h); s.p(4,0,h);
  s.p(16,3,h); s.p(17,2,h); s.p(18,2,h); s.p(19,1,h); s.p(19,0,h);
  s.p(7,4,fur); s.p(16,4,fur);
}
function enWraith(s){
  const c = '#2a4a5a', l = '#4a7a8a', gl = '#7fe3ff', b = '#c8d8d8';
  s.r(7,8,10,10,c); s.r(6,18,12,2,c);
  s.p(6,20,c); s.p(8,21,c); s.p(11,20,c); s.p(13,21,c); s.p(16,20,c); s.p(17,21,c);
  s.r(4,10,3,3,c); s.r(17,10,3,3,c);
  s.p(3,13,b); s.p(4,13,b); s.p(2,12,b); s.p(20,13,b); s.p(19,13,b); s.p(21,12,b);
  for (let x=7;x<=16;x++) s.p(x,14, x%2 ? '#8e99a4' : '#5e6872', 1);
  s.r(7,2,10,7,c); s.hl(8,15,1,c); s.p(11,0,c); s.p(12,0,c);
  s.r(9,4,6,5,'#0e0a14'); s.p(10,6,gl,1); s.p(13,6,gl,1); s.hl(11,12,8,gl,1);
  s.p(7,9,l,1); s.p(16,11,l,1); s.p(8,17,l,1); s.p(15,16,l,1);
}
function enHydra(s){
  const g = '#3f8a4a', l = '#7cc25b', d = '#2a5a30', y = '#ffe066';
  sline(s,10,14,5,7,g); sline(s,11,14,6,7,g);
  sline(s,13,13,13,5,g); sline(s,14,13,14,5,g);
  sline(s,17,14,22,7,g); sline(s,16,14,21,7,g);
  s.r(8,14,12,7,g); s.hl(9,18,21,g); s.r(8,21,3,2,d); s.r(17,21,3,2,d); s.r(11,15,6,5,l);
  for (const [hx,hy] of [[2,3],[11,1],[21,3]]){
    s.r(hx,hy,6,4,g); s.p(hx+1,hy+1,y,1); s.p(hx+4,hy+1,y,1); s.p(hx+1,hy+4,'#ffffff',1); s.p(hx+4,hy+4,'#ffffff',1);
    s.p(hx,hy-1,d); s.p(hx+5,hy-1,d);
  }
}
function enVamp(s){
  const cape = '#1e1a24', inner = '#9a1a2a', sk = '#e8e0e8', hair = '#1a1420', suit = '#2a2430';
  s.r(4,9,16,13,cape); s.r(5,11,2,10,inner); s.r(17,11,2,10,inner);
  s.r(6,4,3,6,inner); s.r(15,4,3,6,inner);
  s.r(9,10,6,10,suit); s.r(11,10,2,4,'#efe8f0'); s.p(11,13,GOLD,1); s.p(12,13,GEM,1);
  s.r(9,20,2,2,suit); s.r(13,20,2,2,suit);
  s.r(9,3,6,6,sk); s.hl(9,14,2,hair); s.hl(9,14,3,hair); s.p(11,4,hair); s.p(12,4,hair);
  s.p(10,5,'#ff2a3a',1); s.p(13,5,'#ff2a3a',1); s.hl(11,12,8,'#5a1a2a',1); s.p(10,8,'#ffffff',1); s.p(13,8,'#ffffff',1);
  s.p(8,15,sk); s.p(15,15,sk);
}
function enWarlord(s){
  const sk = '#5a7a2a', fur = '#8a6a4a', ir = '#7d8a96', red = '#b3262e';
  s.v(3,1,21,'#6b4428'); s.r(4,2,4,5,red); s.p(5,3,'#e8e2d0',1); s.p(6,3,'#e8e2d0',1); s.hl(5,6,4,'#e8e2d0',1); s.p(5,5,'#1a1320',1);
  s.v(19,8,16,'#6b4428'); s.r(17,3,5,6,ir); s.hl(17,21,3,'#c3cbd3',1);
  s.r(8,18,3,3,'#4a3a2a'); s.r(13,18,3,3,'#4a3a2a'); s.hl(7,10,21,'#2a1a12'); s.hl(13,16,21,'#2a1a12');
  s.r(7,10,10,8,'#5a4a3a'); s.hl(7,16,16,'#3a2a1a'); s.p(11,16,'#e8e2d0',1); s.p(12,16,'#e8e2d0',1);
  s.hl(6,17,9,fur); s.hl(6,17,10,fur);
  s.r(5,10,2,6,sk); s.r(17,10,2,5,sk);
  s.r(8,3,8,6,sk); s.r(8,2,8,2,ir); s.p(7,2,'#efe6d0'); s.p(6,1,'#efe6d0'); s.p(16,2,'#efe6d0'); s.p(17,1,'#efe6d0');
  s.p(9,5,'#ffcf3a',1); s.p(14,5,'#ffcf3a',1); s.p(10,6,red,1); s.p(13,6,red,1);
  s.hl(10,13,8,'#4a6a2a',1); s.p(9,8,'#f2ead6',1); s.p(14,8,'#f2ead6',1);
}
const NEW_EN_DRAW = { skeleton:enSkeleton, spider:enSpider, bat:enBat, orc:enOrc, shaman:enShaman, ghost:enGhost, beetle:enBeetle, imp:enImp, head:enHead,
  dragon:enDragon, lich:enLich, kraken:enKraken, titan:enTitan, queen:enQueen, mino:enMino, wraith:enWraith, hydra:enHydra, vampire:enVamp, warlord:enWarlord };
const NEW_EN_SIZE = { dragon:[28,25], kraken:[28,24], titan:[28,27], queen:[28,22], hydra:[28,24], lich:[24,24], mino:[24,23], wraith:[24,23], vampire:[24,23], warlord:[24,23] };

/* ---------- mode Histoire : nouvelles créatures ---------- */
function enToad(s){
  const g = '#6a8a3a', d = '#4a6a2a', b = '#c8d890';
  s.r(3,14,3,3,g); s.r(14,14,3,3,g); s.p(2,17,g); s.p(17,17,g);
  s.hl(6,13,9,g); s.r(4,10,12,6,g); s.hl(5,14,16,g);
  s.r(7,12,6,4,b);
  s.r(5,7,3,3,g); s.r(12,7,3,3,g);
  s.p(6,8,'#ffe066',1); s.p(13,8,'#ffe066',1); s.p(6,9,EYE,1); s.p(13,9,EYE,1);
  s.hl(6,13,11,d,1); s.p(5,10,d,1); s.p(14,10,d,1);
  s.p(8,10,'#8aaa4a',1); s.p(11,10,'#8aaa4a',1); s.p(5,13,'#8aaa4a',1);
}
function enScorpion(s){
  const c = '#c86a2a', d = '#8a4418', l = '#e8964a';
  for (const [x,y] of [[5,9],[4,10],[5,12],[4,13],[6,14],[5,15]]){ s.p(x,y,d); s.p(19-x,y,d); }
  s.r(7,8,6,7,c); s.hl(8,11,15,c);
  s.hl(7,12,10,d,1); s.hl(7,12,12,d,1);
  s.r(4,15,3,2,c); s.r(13,15,3,2,c); s.p(3,17,c); s.p(5,17,c); s.p(14,17,c); s.p(16,17,c);
  s.p(8,15,'#1a1320',1); s.p(11,15,'#1a1320',1);
  s.v(9,4,7,c); s.v(10,4,7,c); s.p(10,3,c); s.p(11,2,c); s.p(12,2,c); s.p(12,3,l); s.p(13,3,'#f2ead6',1);
  s.p(8,9,l,1); s.p(11,9,l,1);
}
function enMummy(s){
  const w = '#e8dcc0', d = '#b8a888', gl = '#7fff8a';
  s.r(8,15,2,3,w); s.r(10,15,2,3,w);
  s.r(7,9,6,6,w); s.r(5,9,2,2,w); s.r(13,9,2,2,w); s.p(4,10,w); s.p(15,10,w);
  s.r(7,3,6,6,w);
  for (let y=4;y<=16;y+=2) s.hl(7,12,y,d,1);
  s.p(6,10,d,1); s.p(14,10,d,1);
  s.hl(8,11,6,'#2a2420',1); s.p(8,6,gl,1); s.p(11,6,gl,1);
  s.p(13,13,w); s.p(14,14,w); s.p(6,16,w);
}
function enYeti(s){
  const f = '#eef2f6', d = '#c8d4e0', fc = '#8aa0b8';
  s.r(5,16,4,2,f); s.r(11,16,4,2,f);
  s.r(4,7,12,10,f); s.hl(5,14,6,f);
  s.r(2,8,2,8,f); s.r(16,8,2,8,f); s.r(2,16,2,1,fc); s.r(16,16,2,1,fc);
  s.r(6,2,8,6,f); s.p(6,1,f); s.p(13,1,f);
  s.r(7,4,6,4,fc); s.p(8,5,'#1a2a3a',1); s.p(11,5,'#1a2a3a',1); s.hl(8,11,7,'#2a3a4a',1); s.p(8,7,'#ffffff',1); s.p(11,7,'#ffffff',1);
  s.p(5,9,d,1); s.p(14,11,d,1); s.p(7,13,d,1); s.p(12,14,d,1);
}
function enGhoul(s){
  const c = '#7a8a6a', d = '#5a6a4a', cl = '#5a4a3a';
  s.r(8,15,2,3,c); s.r(11,15,2,3,c);
  s.r(7,8,6,7,c); s.r(7,12,6,3,cl); s.p(8,15,cl); s.p(11,15,cl);
  s.p(9,9,d,1); s.p(10,10,d,1); s.p(9,11,d,1);
  s.v(5,9,14,c); s.v(14,9,14,c); s.p(4,15,'#e8e2d0'); s.p(5,15,'#e8e2d0'); s.p(14,15,'#e8e2d0'); s.p(15,15,'#e8e2d0');
  s.r(7,3,6,5,c); s.p(6,4,c); s.p(13,4,c);
  s.p(8,5,'#ffffff',1); s.p(11,5,'#ffffff',1); s.hl(8,11,7,'#2a1a1a',1); s.p(9,7,'#e8e2d0',1); s.p(11,7,'#e8e2d0',1);
  s.p(7,3,d); s.p(12,3,d);
}

/* ---------- variantes de couleur ---------- */
const VARIANTS = {
  slime_moss:  { base:'slime', map:{ '#79c25b':'#3f8a6a', '#c9f2a8':'#9fe0c0', '#3a6b2a':'#1f4a3a' } },
  slime_mud:   { base:'slime', map:{ '#79c25b':'#7a6a3a', '#c9f2a8':'#c0b080', '#3a6b2a':'#4a3a1a' } },
  slime_sand:  { base:'slime', map:{ '#79c25b':'#d9b86a', '#c9f2a8':'#fff0c0', '#3a6b2a':'#8a6a2a' } },
  slime_ice:   { base:'slime', map:{ '#79c25b':'#8fd0f0', '#c9f2a8':'#e8f8ff', '#3a6b2a':'#3a7aa0' } },
  slime_ember: { base:'slime', map:{ '#79c25b':'#e0602a', '#c9f2a8':'#ffd27a', '#3a6b2a':'#7a2a10' } },
  slime_shadow:{ base:'slime', map:{ '#79c25b':'#5a3a7a', '#c9f2a8':'#b090e0', '#3a6b2a':'#2a1a3a' } },
  wolf_black:  { base:'wolf', map:{ '#8b8f9c':'#3a3640', '#5d6170':'#24212a', '#c9ccd4':'#6a6470', '#ffcf3a':'#ff4a3a' } },
  wolf_white:  { base:'wolf', map:{ '#8b8f9c':'#e8eef4', '#5d6170':'#b0bcc8', '#c9ccd4':'#ffffff', '#ffcf3a':'#3fa0e0' } },
  wolf_war:    { base:'wolf', map:{ '#8b8f9c':'#8a6a4a', '#5d6170':'#5a4030', '#c9ccd4':'#c9a27a', '#ffcf3a':'#ff4a3a', '#d98a8a':'#b3262e' } },
  golem_ice:   { base:'golem', map:{ '#8f897c':'#9fc8e0', '#6b665b':'#6a98b8', '#5d8a3c':'#e8f8ff', '#7cf3ff':'#ffffff' } },
  golem_lava:  { base:'golem', map:{ '#8f897c':'#4a3a38', '#6b665b':'#2e2422', '#5d8a3c':'#ff6a2a', '#7cf3ff':'#ffd27a' } },
  hydra_sand:  { base:'hydra', map:{ '#3f8a4a':'#c8a050', '#7cc25b':'#f0d890', '#2a5a30':'#8a6a2a' } },
  titan_ice:   { base:'titan', map:{ '#6e6a64':'#9fc8e0', '#4e4a46':'#6a98b8', '#ff8a2a':'#7fe3ff', '#ffd27a':'#e8f8ff', '#5d8a3c':'#ffffff' } }
};

/* ---------- décors ---------- */
function terMushroom(){
  const s = new Spr(), cap = '#5a3a8a', st = '#d8d0c0', gl = '#7fe3ff';
  s.r(8,11,4,6,st); s.p(7,17,st); s.p(12,17,st);
  s.hl(7,12,4,cap); s.hl(5,14,5,cap); s.r(4,6,12,4,cap); s.hl(3,16,10,cap);
  s.p(6,6,gl,1); s.p(10,5,gl,1); s.p(13,7,gl,1); s.p(8,8,gl,1); s.p(14,9,gl,1);
  s.hl(5,14,11,'#3a2a5a');
  s.p(15,15,cap); s.hl(14,16,14,cap); s.p(15,16,st); s.p(14,14,gl,1);
  return s.pixels();
}
function terDeadTree(trunk){
  const s = new Spr(), t = trunk || '#3a2a20';
  s.r(9,8,2,9,t); s.p(8,17,t); s.p(11,17,t);
  sline(s,9,10,5,6,t); sline(s,10,9,14,4,t); sline(s,9,7,8,3,t); sline(s,10,12,14,10,t); sline(s,6,7,4,7,t); sline(s,13,5,16,5,t);
  return s.pixels();
}
function terCactus(){
  const s = new Spr(), g = '#5a8a3a', l = '#8ab85a';
  s.r(8,4,4,14,g); s.hl(9,10,3,g);
  s.r(4,8,2,5,g); s.hl(4,7,12,g); s.r(14,6,2,5,g); s.hl(12,15,10,g);
  s.v(9,5,16,l,1); s.p(4,9,l,1); s.p(14,7,l,1);
  s.p(10,2,'#f06a8a',1); s.p(9,2,'#f8a0b8',1);
  s.hl(7,12,18,'#c8a060');
  return s.pixels();
}
function terTomb(){
  const s = new Spr(), st = '#8a8a92', d = '#5a5a62';
  s.hl(8,11,5,st); s.hl(7,12,6,st); s.r(6,7,8,9,st); s.hl(5,14,16,'#4a4a52');
  s.v(9,8,13,d,1); s.v(10,8,13,d,1); s.hl(8,11,9,d,1);
  s.p(7,7,'#b0b0b8',1); s.p(13,14,'#5a6a5a'); s.p(6,15,'#5a6a5a');
  return s.pixels();
}
function terBrazier(){
  const s = new Spr(), ir = '#4a4048';
  s.v(7,12,17,ir); s.v(12,12,17,ir); s.hl(6,13,17,ir);
  s.hl(5,14,9,ir); s.hl(6,13,10,ir); s.hl(7,12,11,ir);
  s.hl(6,13,8,'#ff6a2a',1); s.hl(7,12,7,'#ff8a2a',1); s.hl(8,11,6,'#ffb347',1); s.hl(8,11,5,'#ffd27a',1); s.p(9,4,'#fff3b0',1); s.p(10,3,'#ffd27a',1); s.p(8,4,'#ff8a2a',1); s.p(11,4,'#ff8a2a',1);
  return s.pixels();
}

const STORY_EN_DRAW = { toad:enToad, scorpion:enScorpion, mummy:enMummy, yeti:enYeti, ghoul:enGhoul };
const DRAW = [drawLame, drawArc, drawBombe, drawGivre, drawFoudre, drawNain, drawPyro, drawCata, drawMyco, drawBal];
function troopPixels(t,l){ const s = new Spr(); drawSoldier(s,t,l); return s.pixels(); }
const EN_DRAW = { slime:enSlime, wolf:enWolf, golem:enGolem, boss:enBoss, bigslime:enBigSlime, mini:enMini, goblin:enGoblin, king:enKing };
function enemyPixels(k){
  const v = VARIANTS[k], kk = v ? v.base : k;
  const sz = NEW_EN_SIZE[kk];
  const s = kk==='king' ? new Spr(28,27) : kk==='boss' ? new Spr(24,24) : sz ? new Spr(sz[0], sz[1]) : new Spr();
  (EN_DRAW[kk] || NEW_EN_DRAW[kk] || STORY_EN_DRAW[kk])(s);
  if (v) recolor(s, v.map);
  return s.pixels();
}
/* ---------- Légendes : sprites 24×24 ---------- */
const LY = '#ffe066', LYW = '#fffbe0';
function lgLegs(s, leg, boot){ s.r(9,18,2,3,leg); s.r(13,18,2,3,leg); s.r(8,21,3,1,boot); s.r(13,21,3,1,boot); }
function lgEyes(s, c = EYE, y = 9){ s.p(10,y,c,1); s.p(13,y,c,1); }
function lgCircle(s, cx, cy, r, fill, rim, rimW = .9){
  for (let y=0;y<24;y++) for (let x=0;x<24;x++){
    const d = Math.hypot(x-cx, y-cy);
    if (d <= r) s.p(x, y, d > r-rimW ? rim : fill);
  }
}

/* Gengis Khan : archer des steppes */
function lgGengis(s,l){
  const deel = l===5 ? '#7a1f2a' : '#3d5a8a', trim = l>=4 ? GOLD : '#c9a26b';
  const fur = '#8a6440', furL = '#c9a26b', sk = '#e0a878', hair = l>=4 ? '#6a6a6a' : '#2a1a12';
  if (l===5){
    s.v(20,3,21,'#6b4428'); s.r(19,1,3,1,GOLD); s.p(20,2,GOLD);
    s.r(19,3,3,4,'#f2ead6'); s.p(18,6,'#f2ead6'); s.p(22,6,'#f2ead6'); s.hl(19,21,7,'#d8cfbd'); s.p(20,8,'#d8cfbd');
  }
  if (l>=3){ s.r(16,7,2,7,'#7a4a2a'); s.p(16,6,'#e8e2d0',1); s.p(17,5,'#e8e2d0',1); s.p(17,6,'#c8473d',1); s.hl(16,17,10,trim,1); }
  s.r(9,18,2,3,'#4a3428'); s.r(13,18,2,3,'#4a3428');
  s.r(8,21,3,1,'#2a1a12'); s.r(13,21,3,1,'#2a1a12'); s.p(7,20,'#2a1a12'); s.p(16,20,'#2a1a12');
  s.r(8,12,8,7,deel);
  s.p(9,12,trim,1); s.p(10,13,trim,1); s.p(11,14,trim,1); s.p(12,15,trim,1);
  s.hl(8,15,16,'#5a3a22'); s.r(11,16,2,1,GOLD,1); s.hl(8,15,18,trim,1);
  if (l>=3){
    const lm = l>=4 ? GOLD : '#8e99a4', lmd = l>=4 ? '#a06d1f' : '#5e6872';
    for (let y=12;y<=15;y++) for (let x=9;x<=14;x++) s.p(x,y,(x+y)%2 ? lm : lmd,1);
  }
  s.r(16,12,1,4,deel); s.p(16,16,sk);
  const bw = l>=4 ? '#5a2a1a' : '#7a4a2a';
  s.v(6,8,20,'#eee6cf',1);
  s.p(7,6,bw); s.p(6,7,bw); s.p(5,8,bw); s.v(4,9,19,bw); s.p(5,20,bw); s.p(6,21,bw); s.p(7,22,bw);
  if (l>=2){ s.p(4,13,GOLD,1); s.p(4,14,GOLD,1); }
  s.p(7,12,deel); s.p(7,13,deel); s.p(6,13,deel); s.p(5,14,sk);
  s.r(9,6,6,6,sk); lgEyes(s, EYE, 9);
  s.hl(11,12,10,hair,1); s.p(10,10,hair,1); s.p(13,10,hair,1); s.p(10,11,hair,1); s.p(13,11,hair,1); s.hl(11,12,11,SKD,1);
  if (l<=3){
    const cap = '#a83a2a';
    s.r(9,3,6,3,cap); s.hl(10,13,2,cap);
    if (l>=2) s.hl(11,12,1,GOLD);
    s.r(8,6,8,2,fur); s.v(8,8,10,fur); s.v(15,8,10,fur);
    s.p(9,6,furL,1); s.p(12,7,furL,1); s.p(14,6,furL,1); s.p(8,9,furL,1);
  } else {
    const m = l===5 ? '#f2e2a0' : GOLD, md = l===5 ? '#d1a23a' : '#a06d1f';
    s.hl(11,12,1, l===5 ? '#ffffff' : m); s.hl(10,13,2,m); s.hl(9,14,3,m); s.r(8,4,8,2,m);
    s.hl(9,11,3,shade(m,1.2),1); s.hl(8,15,5,md,1);
    s.r(8,6,8,1,fur); s.v(8,7,10,md); s.v(15,7,10,md);
    s.p(14,0,'#2a1a12'); s.p(15,1,'#2a1a12'); s.v(16,2,5,'#2a1a12');
  }
}

/* Jules César */
function lgCesar(s,l){
  const red = '#b3262e', purp = '#5a2272', hair = '#4a3020', sk = SK;
  if (l===5){
    s.v(20,4,21,'#6b4428');
    s.hl(18,22,2,GOLD); s.hl(19,21,1,GOLD); s.p(17,1,GOLD); s.p(23,1,GOLD);
    s.r(19,3,3,1,GOLD); s.p(20,4,GOLD);
    s.r(18,6,5,3,red); s.hl(19,21,7,GOLD,1);
  }
  if (l>=3) s.r(7,11,10,10, l===5 ? purp : '#8a1f26');
  s.r(9,18,2,3,sk); s.r(13,18,2,3,sk);
  s.r(8,21,3,1,'#6b4428'); s.r(13,21,3,1,'#6b4428'); s.p(9,19,'#6b4428',1); s.p(14,19,'#6b4428',1);
  s.r(8,12,8,6,red);
  if (l>=2){
    for (let x=8;x<=15;x++) s.p(x,17, x%2 ? '#6b4428' : '#8a5a32');
    const cu = l===2 ? '#8e99a4' : l===3 ? '#c8913a' : GOLD;
    if (l===2){ for (let y=12;y<=15;y++) s.hl(8,15,y, y%2 ? cu : shade(cu,.82)); }
    else {
      s.r(8,12,8,4,cu);
      s.hl(9,10,13,shade(cu,1.25),1); s.hl(13,14,13,shade(cu,1.25),1);
      s.p(11,14,shade(cu,.8),1); s.p(12,14,shade(cu,.8),1); s.p(11,15,shade(cu,.8),1); s.p(12,15,shade(cu,.8),1);
    }
    if (l>=4) s.hl(8,15,15,purp);
  }
  s.hl(8,15,16, l>=4 ? GOLD : '#5a3a22');
  s.r(7,12,1,2,red); s.r(7,14,1,3,sk); s.r(16,12,1,2,red); s.r(16,14,1,2,sk);
  s.v(17,8,13,'#dfe6ec'); s.p(17,7,'#eef4f8',1); s.hl(16,18,14, l>=4 ? GOLD : '#6b4428'); s.p(17,15,'#5a3a22'); s.p(17,16, l>=3 ? GOLD : '#8e99a4');
  s.r(9,6,6,6,sk); lgEyes(s, EYE, 9); s.hl(11,12,11,SKD,1); s.p(11,10,SKD,1);
  s.p(8,9,sk); s.p(15,9,sk);
  s.r(9,5,6,2,hair); s.p(9,7,hair); s.p(14,7,hair); s.p(10,7,hair); s.p(12,7,hair);
  if (l>=4){
    const lf = l===5 ? GOLD : '#4f8f3a', lfL = l===5 ? '#fbe08a' : '#7cc25b';
    s.p(8,8,lf); s.p(8,7,lf); s.p(8,6,lf); s.p(9,4,lf); s.p(10,4,lf); s.p(15,8,lf); s.p(15,7,lf); s.p(15,6,lf); s.p(14,4,lf); s.p(13,4,lf);
    s.p(8,7,lfL,1); s.p(15,7,lfL,1); s.p(9,4,lfL,1); s.p(14,4,lfL,1);
    if (l===4){ s.p(16,9,red); s.p(16,10,red); }
  }
}

/* Alexandre le Grand */
function lgAlex(s,l){
  const purp = '#5a2a8a', bz = l===5 ? GOLD : '#c8913a', hair = '#d9a441', hairD = '#a8742a', sk = SK;
  if (l>=3) s.r(7,11,10,10, l===5 ? '#7a2a9a' : purp);
  const leg = l>=2 ? bz : sk;
  s.r(9,18,2,3,leg); s.r(13,18,2,3,leg); s.r(8,21,3,1,'#6b4428'); s.r(13,21,3,1,'#6b4428');
  if (l===1){ s.r(8,12,8,6,'#5a7ab0'); s.hl(8,15,16,'#c9b37a'); }
  else {
    const ch = l>=4 ? GOLD : '#efe8d4';
    s.r(8,12,8,6,ch);
    for (let x=8;x<=15;x++) s.p(x,17, x%2 ? '#efe8d4' : '#c9b37a');
    s.r(9,12,2,1,'#c9b37a'); s.r(13,12,2,1,'#c9b37a');
    s.hl(8,15,16,bz); s.p(11,14,l>=4 ? '#fbe08a' : GOLD,1); s.p(12,14,l>=4 ? '#fbe08a' : GOLD,1);
  }
  s.r(7,12,1,4,sk); s.p(7,16,sk); s.r(16,12,1,4,sk); s.p(16,16,sk);
  if (l===1){ s.v(5,2,21,'#7a5230'); s.p(5,1,'#c3cbd3',1); s.p(5,2,'#c3cbd3'); s.p(6,13,sk); }
  else {
    const face = l===2 ? '#2f4a8a' : purp, rim = l>=4 ? GOLD : bz;
    lgCircle(s, 4.5, 15, 3.6, face, rim, 1);
    const G = l===5 ? '#fff3b0' : GOLD;
    s.r(4,14,2,2,G,1); s.p(4,12,G,1); s.p(5,17,G,1); s.p(2,15,G,1); s.p(7,14,G,1); s.p(3,13,G,1); s.p(6,16,G,1); s.p(6,13,G,1); s.p(3,16,G,1);
  }
  s.v(17,9,14,'#dfe6ec'); s.p(18,11,'#dfe6ec'); s.p(17,8,'#eef4f8',1); s.hl(16,18,15,bz); s.p(17,16,'#5a3a22');
  s.r(9,6,6,6,sk); lgEyes(s, '#2a4a8a', 9); s.hl(11,12,11,SKD,1);
  if (l===3 || l===5){
    const h = l===5 ? GOLD : bz;
    s.r(9,4,6,4,h); s.hl(10,13,3,h); s.p(11,2,h); s.p(12,2,h);
    s.v(9,8,10,h); s.v(14,8,10,h); s.hl(10,12,4,shade(h,1.25),1);
    s.v(8,0,4,'#ffffff'); s.v(15,0,4,'#ffffff'); s.p(7,1,'#ffffff'); s.p(16,1,'#ffffff');
    if (l===5){ s.p(7,6,'#e9dcc0'); s.p(6,7,'#e9dcc0'); s.p(6,8,'#e9dcc0'); s.p(16,6,'#e9dcc0'); s.p(17,7,'#e9dcc0'); s.p(17,8,'#e9dcc0'); }
  } else {
    s.r(9,5,6,2,hair); s.v(8,6,10,hair); s.v(15,6,10,hair); s.p(11,4,hair); s.p(12,4,hair); s.p(12,3,hair);
    s.p(9,5,hairD,1); s.p(14,6,hairD,1); s.p(8,8,hairD,1); s.p(15,9,hairD,1);
    if (l===4){
      const h = '#e9dcc0';
      s.hl(9,14,7,GOLD);
      s.p(8,5,h); s.p(7,6,h); s.p(6,7,h); s.p(6,8,h); s.p(7,9,h);
      s.p(15,5,h); s.p(16,6,h); s.p(17,7,h); s.p(17,8,h); s.p(16,9,h);
    }
  }
}

/* Léonidas */
function lgLeon(s,l){
  const red = '#b3262e', bz = l===5 ? GOLD : '#c8913a', bzD = l===5 ? '#a06d1f' : '#8a5a2a', bzL = l===5 ? '#fbe08a' : '#e6b46a', sk = '#e0a878', hair = '#3a2418';
  if (l>=3) s.r(7,11,10,10, l===5 ? '#c42a35' : '#8a1f26');
  s.v(17,2,21,'#7a5230'); s.p(17,0,bzL,1); s.p(17,1,bz);
  s.r(9,18,2,3, l>=2 ? bz : sk); s.r(13,18,2,3, l>=2 ? bz : sk); s.r(8,21,3,1,'#6b4428'); s.r(13,21,3,1,'#6b4428');
  s.r(8,12,8,6,red);
  if (l>=2){
    s.r(8,12,8,4,bz); s.hl(9,10,13,bzL,1); s.hl(13,14,13,bzL,1); s.p(11,14,bzD,1); s.p(12,14,bzD,1);
    for (let x=8;x<=15;x++) s.p(x,17, x%2 ? red : '#8a1f26');
  }
  s.hl(8,15,16,'#5a3a22');
  s.r(16,12,1,3,sk); s.p(16,15,sk);
  const face = l===1 ? '#8a5a32' : bz, rim = l===1 ? '#5a3a22' : bzD;
  lgCircle(s, 4.5, 15, 4.3, face, rim, 1);
  if (l>=3){ const L = l===5 ? '#c42a35' : red;
    for (const [x,y] of [[4,12],[5,12],[3,13],[6,13],[3,14],[6,14],[2,15],[7,15],[2,16],[7,16]]) s.p(x,y,L,1); }
  else if (l===2) s.p(4,14,bzL,1);
  if (l===1){
    s.r(9,6,6,6,sk); lgEyes(s, EYE, 8);
    s.r(9,5,6,2,hair); s.v(8,6,12,hair); s.v(15,6,12,hair);
    s.r(10,10,4,2,hair); s.hl(11,12,12,hair);
  } else {
    s.r(9,5,6,7,bz); s.hl(10,13,4,bz);
    s.p(10,8,SK); s.p(13,8,SK); s.p(10,8,'#1a1320',1); s.p(13,8,'#1a1320',1);
    s.r(10,10,4,2,hair);
    s.hl(10,12,5,bzL,1);
    s.v(8,9,13,hair); s.v(15,9,13,hair);
    if (l>=4){
      const C = l===5 ? '#e2334a' : red;
      s.hl(9,14,1,C); s.hl(7,16,2,C); s.hl(7,16,3,C); 
      s.hl(9,14,4,bzD); s.p(8,2,shade(C,1.2),1); s.p(15,2,shade(C,1.2),1);
    } else { s.r(11,1,2,4,red); s.p(10,2,red); s.p(13,2,red); s.p(11,1,shade(red,1.25),1); }
  }
}

/* Jeanne d'Arc */
function lgJeanne(s,l){
  const steel = l===5 ? '#f2ead6' : '#c9d3dc', steelD = l===5 ? '#d1a23a' : '#8e99a4', hair = '#5a3a22', blue = '#2f4a9a', sk = SK;
  if (l===1){
    s.v(17,4,21,'#7a5230'); s.p(18,3,'#7a5230'); s.p(19,4,'#7a5230'); s.p(19,5,'#7a5230');
  } else {
    s.v(17,2,21, l===5 ? GOLD : '#7a5230');
    s.r(18,2,5,7,'#f4f0e4');
    if (l>=3){ s.p(19,4,GOLD,1); s.v(20,3,6,GOLD,1); s.p(21,4,GOLD,1); s.hl(19,21,6,GOLD,1); }
    if (l===5){ s.hl(18,22,9,GOLD); s.p(17,1,GOLD,1); }
  }
  if (l===1){
    const dr = '#9a3a2a';
    s.r(8,12,8,6,dr); s.r(7,18,10,3,dr); s.r(9,14,6,4,'#e8dcc0');
    s.r(8,21,3,1,'#4a3020'); s.r(13,21,3,1,'#4a3020');
    s.r(7,12,1,4,dr); s.r(16,12,1,4,dr); s.p(7,16,sk); s.p(16,16,sk);
  } else {
    s.r(9,18,2,3,steel); s.r(13,18,2,3,steel); s.r(8,21,3,1,steelD); s.r(13,21,3,1,steelD);
    s.p(9,19,steelD,1); s.p(14,19,steelD,1);
    s.r(8,12,8,6,steel); s.hl(9,14,13,shade(steel,1.12),1); s.hl(8,15,16,steelD);
    s.r(7,12,1,4,steel); s.r(16,12,1,4,steel); s.p(7,16,steelD); s.p(16,16,steelD);
    s.r(7,11,2,2,steel); s.r(15,11,2,2,steel);
    if (l>=4){ s.r(9,12,6,6,blue); s.p(11,13,GOLD,1); s.v(12,13,15,GOLD,1); s.p(13,13,GOLD,1); s.hl(11,13,15,GOLD,1); s.hl(9,14,16,steelD); }
    if (l>=3){ s.v(6,14,20,'#dfe6ec'); s.hl(5,7,13, l>=4 ? GOLD : steelD); s.p(6,12,'#5a3a22'); }
  }
  s.r(9,6,6,6,sk); lgEyes(s, '#3a5a8a', 9); s.hl(11,12,11,'#d98a7a',1);
  s.r(9,5,6,2,hair); s.v(8,6,10,hair); s.v(15,6,10,hair); s.hl(9,14,7,hair); s.p(11,8,hair);
  if (l===5){ s.hl(9,14,2,GOLD,1); s.p(8,3,GOLD,1); s.p(15,3,GOLD,1); s.hl(10,13,1,'#fff3b0',1); }
}

/* Hannibal et son éléphant */
function lgHannibal(s,l){
  const g = '#8d8a93', gD = '#6f6c76', tusk = '#f2ead6', purp = '#5a2272', sk = '#c98a5a', tun = l>=3 ? purp : '#9a3a2a';
  const bz = l===5 ? GOLD : '#c8913a';
  s.p(21,13,g); s.p(22,14,g); s.p(22,15,'#3a3640');
  s.hl(10,17,10,g); s.hl(8,19,11,g); s.r(7,12,14,7,g);
  for (const x of [8,11,16,19]){ s.r(x,19,2,3,g); s.hl(x,x+1,21,'#c9c6cc',1); }
  s.r(3,10,6,6,g); s.hl(4,7,9,g);
  s.r(7,11,3,5,gD);
  s.v(3,16,18,g); s.p(2,19,g); s.p(2,20,g); s.p(3,21,g);
  s.p(4,16,tusk); s.p(5,17,tusk); s.p(6,17,tusk);
  if (l>=4) s.p(6,17,GOLD,1);
  s.p(5,12,EYE,1);
  if (l>=2){
    const bl = l===5 ? purp : '#b3262e', ed = l>=4 ? GOLD : '#e6b46a';
    s.r(10,11,9,4,bl); s.hl(10,18,15,ed); for (let x=10;x<=18;x+=2) s.p(x,16,ed,1);
  }
  if (l>=3){ const ar = l===5 ? GOLD : bz; s.r(3,9,5,2,ar); s.p(4,11,ar); s.p(5,11,ar); s.hl(4,6,9,shade(ar,1.2),1); }
  s.r(12,7,4,5,tun); s.p(12,12,tun); s.p(12,13,'#4a3020');
  s.v(11,8,10,tun); s.p(11,11,sk);
  s.v(16,7,9,tun); s.p(16,10,sk);
  if (l>=4){ s.v(17,1,13,'#7a5230'); s.p(17,0, l===5 ? '#fff3b0' : '#c3cbd3',1); }
  s.r(12,3,4,4,sk); s.p(12,4,EYE,1); s.p(14,4,EYE,1);
  s.hl(12,15,6,'#2a1a12'); s.p(13,5,'#2a1a12',1);
  if (l===1){ s.hl(12,15,2,'#2a1a12'); s.p(16,3,'#2a1a12'); s.p(16,4,'#2a1a12'); }
  else { s.hl(12,15,2,bz); s.hl(12,15,1,bz); s.p(16,3,bz); s.p(16,4,bz); s.hl(13,14,1,shade(bz,1.25),1);
    if (l===5){ s.p(14,0,'#e2334a'); s.p(15,0,'#e2334a'); } }
}

/* Zeus */
function lgZeus(s,l){
  const robe = '#eef0f2', robeS = '#c9ced6', drape = l>=4 ? '#2f4a9a' : '#5a7ab0';
  const beard = l===1 ? '#5a4a3a' : l===2 ? '#a8a29a' : '#f4f4f4', sk = SK;
  if (l===5){
    const cl = '#9aa3b8', clL = '#d6dcea';
    s.r(1,3,6,2,cl); s.hl(2,4,2,cl); s.hl(2,4,2,clL,1); s.p(3,5,LY,1); s.p(4,6,LY,1); s.p(3,7,LYW,1);
    s.r(18,17,5,2,cl); s.hl(19,21,16,cl); s.hl(19,21,16,clL,1);
  }
  s.r(8,12,8,9,robe); s.v(10,15,20,robeS,1); s.v(13,16,20,robeS,1);
  s.r(8,21,3,1,GOLD); s.r(13,21,3,1,GOLD);
  for (let k=0;k<7;k++){ s.p(8+k,12+k,drape); s.p(9+k,12+k,drape); }
  if (l>=4) s.hl(8,15,19,GOLD,1);
  s.r(7,12,1,5,drape); s.p(7,17,sk);
  s.p(16,12,sk); s.v(17,8,11,sk); s.p(17,7,sk);
  const bolt = l>=3
    ? [[19,1],[18,2],[19,2],[17,3],[18,3],[18,4],[19,4],[20,4],[19,5],[18,6]]
    : [[18,3],[17,4],[18,4],[18,5],[17,6]];
  for (const [x,y] of bolt) s.p(x,y, l===5 ? LYW : LY, 1);
  if (l>=3){ s.p(20,1,LYW,1); s.p(16,5,LYW,1); }
  s.r(9,6,6,6,sk);
  lgEyes(s, l===5 ? '#bfe9ff' : EYE, 8);
  s.r(9,4,6,2,beard); s.v(8,5,12,beard); s.v(15,5,12,beard);
  s.hl(10,13,9,beard); s.r(9,10,6,2,beard); s.r(10,12,4,2,beard); s.hl(11,12,14,beard);
  if (l>=3) s.hl(11,12,15,beard);
  if (l>=4){ const lf = l===5 ? GOLD : '#5aa04a';
    s.hl(9,14,4,lf); s.p(8,5,lf); s.p(15,5,lf); s.p(10,3,lf); s.p(13,3,lf); s.p(9,4,shade(lf,1.3),1); s.p(14,4,shade(lf,1.3),1); }
}

/* Thor */
function lgThor(s,l){
  const red = '#c8502a', redD = '#9a3a1a', tun = '#3a4a5a', fur = '#8a7a6a', iron = '#7d8a96', ironL = '#c3cbd3', sk = SK;
  if (l>=3) s.r(7,11,10,10, l===5 ? '#6a1f1f' : '#5a3a2a');
  s.r(9,18,2,3,'#4a3a30'); s.r(13,18,2,3,'#4a3a30'); s.p(9,19,fur,1); s.p(14,19,fur,1);
  s.r(8,21,3,1,fur); s.r(13,21,3,1,fur);
  s.r(8,12,8,6,tun);
  if (l>=2) for (let y=13;y<=15;y++) for (let x=8;x<=15;x++) if ((x+y)%2) s.p(x,y,iron,1);
  if (l>=4){ s.r(8,16,8,2,GOLD); s.hl(9,14,16,'#fbe08a',1); } else s.hl(8,15,16,'#4a3020');
  if (l>=3){ s.hl(7,16,12,fur); s.p(9,12,shade(fur,1.25),1); s.p(14,12,shade(fur,1.25),1); }
  s.r(7,13,1,3,sk); s.p(7,16, l===5 ? iron : sk); s.r(16,13,1,2,sk); s.p(16,15, l===5 ? iron : sk);
  if (l>=2){ s.p(7,15,iron); s.p(16,14,iron); }
  s.v(17,14,18,'#6b4428'); s.p(17,19,'#4a3020');
  s.r(15,10,5,4,iron); s.hl(16,18,10,ironL,1); s.v(15,11,13,shade(iron,.8),1);
  if (l>=3) s.p(17,12,'#7fe3ff',1);
  if (l===5){ s.p(21,9,LY,1); s.p(21,10,LYW,1); s.p(14,9,LY,1); s.p(20,14,LY,1); s.p(13,8,LYW,1); }
  s.r(9,6,6,6,sk); lgEyes(s, l===5 ? '#bfe9ff' : '#3a5a8a', 8);
  s.r(9,5,6,2,red); s.hl(9,14,6,red); s.v(8,6,13,red); s.v(15,6,13,red);
  s.hl(10,13,10,red); s.p(9,10,red); s.p(14,10,red); s.r(9,11,6,1,red); s.r(10,12,4,1,red);
  if (l>=2){ s.p(10,13,redD); s.p(13,13,redD); }
  if (l>=4){ s.p(10,14,GOLD,1); s.p(13,14,GOLD,1); }
  if (l>=2){ const h = l>=4 ? '#8e99a4' : iron; s.hl(10,13,3,h); s.r(9,4,6,2,h); s.hl(10,12,3,ironL,1); if (l>=4) s.hl(9,14,5,GOLD); }
}

/* Merlin */
function lgMerlin(s,l){
  const robe = l===5 ? '#eef0f2' : l>=3 ? '#2a4a6a' : '#2f5a46', trim = l>=4 ? GOLD : '#c9b37a', beard = '#eef2f6', orb = '#7fe3ff', sk = SK;
  s.v(4,4,21,'#6b4a2e'); s.p(3,7,'#6b4a2e'); s.p(5,11,'#6b4a2e'); s.p(3,15,'#6b4a2e');
  s.r(3,1,3,3,orb); s.p(4,2,'#ffffff',1);
  if (l>=4){ s.p(2,2,'#bff6ff',1); s.p(6,2,'#bff6ff',1); s.p(4,0,'#bff6ff',1); }
  s.r(8,12,8,6,robe); s.r(7,18,10,3,robe); s.hl(7,16,20,trim); s.v(11,13,19,trim,1);
  s.r(8,21,3,1,'#4a3020'); s.r(13,21,3,1,'#4a3020');
  if (l>=4){ s.p(9,14,'#fff3a0',1); s.p(14,17,'#fff3a0',1); s.p(9,19,'#fff3a0',1); s.p(14,13,'#fff3a0',1); }
  s.r(6,12,2,3,robe); s.p(5,13,sk);
  s.r(16,12,2,3,robe); s.p(17,15,sk); s.p(18,14,'#bff6ff',1);
  s.r(8,4,8,3,robe); s.v(8,7,11,robe); s.v(15,7,11,robe); s.hl(9,14,3,robe); s.hl(10,13,2,robe);
  s.hl(9,14,6, l>=4 ? trim : shade(robe,1.2), l>=4 ? 1 : 0);
  s.r(9,7,6,5,sk); s.p(10,8,EYE,1); s.p(13,8,EYE,1); s.hl(9,10,7,beard,1); s.hl(13,14,7,beard,1);
  s.hl(10,13,9,beard); s.r(9,10,6,2,beard); s.r(10,12,4,3,beard); s.hl(11,12,15,beard);
  if (l>=3){
    const ow = '#8a6a4a';
    s.r(16,8,3,3,ow); s.p(16,7,ow); s.p(18,7,ow);
    s.p(16,9,'#ffcf3a',1); s.p(18,9,'#ffcf3a',1); s.p(17,10,'#e0a93a',1); s.hl(16,18,11,'#6b4a2e');
  }
  if (l===5){ s.p(21,4,orb,1); s.p(20,6,'#bff6ff',1); s.p(21,18,orb,1); s.p(2,18,'#bff6ff',1); s.hl(9,14,1,'#a8d870'); s.p(10,0,'#a8d870'); s.p(13,0,'#a8d870'); }
}

/* Anubis */
function lgAnubis(s,l){
  const blk = '#24212e', gold = GOLD, sk = '#8a5a3a', kilt = '#efe8d4', lapis = '#2f4a9a';
  const st = l>=3 ? gold : '#6b4428';
  s.v(18,3,21,st); s.hl(17,19,3,st); s.p(19,2,st); s.p(17,21,st); s.p(19,21,st);
  s.r(9,18,2,3,sk); s.r(13,18,2,3,sk); s.r(8,21,3,1,gold); s.r(13,21,3,1,gold);
  s.r(8,16,8,4,kilt); s.v(10,17,19,'#c9c0a8',1); s.v(13,17,19,'#c9c0a8',1); s.hl(8,15,16,gold);
  if (l>=4) s.r(11,17,2,3,lapis);
  s.r(8,12,8,4,sk);
  s.hl(8,15,12,gold); s.hl(8,15,13,lapis); s.hl(9,14,14,gold);
  if (l>=3) s.hl(10,13,15,lapis);
  s.r(7,12,1,4,sk); s.p(7,16,sk); s.r(16,12,1,4,sk); s.p(16,16,sk);
  if (l>=2){ s.p(7,13,gold,1); s.p(16,13,gold,1); }
  if (l>=3 && l<5){
    s.hl(2,7,13,gold); s.v(4,12,13,gold);
    s.v(2,14,15,'#c9b37a',1); s.v(7,14,15,'#c9b37a',1); s.hl(1,3,16,gold); s.hl(6,8,16,gold);
  }
  if (l===5){
    s.p(4,10,gold); s.p(3,11,gold); s.p(5,11,gold); s.p(3,12,gold); s.p(5,12,gold); s.p(4,13,gold);
    s.hl(2,6,14,gold); s.v(4,15,18,gold);
  }
  if (l>=4){ for (let y=7;y<=13;y++){ s.p(8,y, y%2 ? gold : lapis); s.p(15,y, y%2 ? gold : lapis); } }
  s.r(9,5,6,5,blk); s.r(10,10,4,2,blk); s.hl(11,12,11,'#111111',1);
  s.r(9,1,2,4,blk); s.r(13,1,2,4,blk);
  if (l>=2){ s.p(10,2,gold,1); s.p(13,2,gold,1); }
  const ey = l===5 ? '#7fe3ff' : '#ffcf3a';
  s.p(10,7,ey,1); s.p(13,7,ey,1); s.p(9,7,gold,1); s.p(14,7,gold,1);
  s.hl(10,13,5,'#3a3648',1);
}

/* Hercule */
function lgHercule(s,l){
  const sk = '#d9a070', pelt = l===5 ? GOLD : '#c8963a', peltD = l===5 ? '#a06d1f' : '#8a5a2a', mane = l===5 ? '#d1a23a' : '#7a4a1f';
  const club = l===5 ? GOLD : '#6b4428', clubD = l===5 ? '#a06d1f' : '#4a2e18';
  if (l>=2) s.r(7,10,10,11,pelt);
  s.r(9,18,2,3,sk); s.r(13,18,2,3,sk); s.r(8,21,3,1,'#6b4428'); s.r(13,21,3,1,'#6b4428');
  s.r(8,12,8,4,sk);
  s.hl(9,10,12,shade(sk,1.15),1); s.hl(13,14,12,shade(sk,1.15),1);
  s.p(11,13,shade(sk,.82),1); s.p(12,13,shade(sk,.82),1); s.p(11,15,shade(sk,.82),1); s.p(12,15,shade(sk,.82),1);
  s.r(8,16,8,2, l===1 ? '#efe8d4' : pelt); s.hl(8,15,16, l===1 ? '#c9b37a' : peltD);
  if (l>=3){ s.p(9,13,pelt); s.p(9,14,pelt); s.p(14,13,pelt); s.p(14,14,pelt); s.p(9,15,peltD,1); s.p(14,15,peltD,1); }
  s.r(6,12,2,4,sk); s.p(6,16,sk); s.p(7,16,sk);
  s.r(16,12,2,4,sk); s.p(16,16,sk); s.p(17,16,sk);
  if (l>=4){ s.p(6,13,GOLD,1); s.p(17,13,GOLD,1); }
  if (l===4){ s.p(5,16,GOLD); s.p(5,17,'#e0a93a'); s.p(4,16,'#5aa04a',1); }
  s.r(18,3,3,6,club); s.r(18,9,2,4,club); s.v(18,13,17,club);
  s.p(19,4,clubD,1); s.p(20,7,clubD,1); s.p(18,6,clubD,1); s.p(19,10,clubD,1); s.p(21,5,club); s.p(17,7,club);
  if (l>=4) s.hl(18,20,9, l===5 ? '#fbe08a' : '#c8913a');
  s.r(9,6,6,6,sk); lgEyes(s, EYE, 9);
  s.r(9,10,6,2,'#5a3a1f'); s.hl(10,13,12,'#5a3a1f'); s.hl(11,12,10,SKD,1);
  if (l===1){ s.r(9,5,6,2,'#5a3a1f'); s.p(8,6,'#5a3a1f'); s.p(15,6,'#5a3a1f'); s.p(10,4,'#5a3a1f'); s.p(13,4,'#5a3a1f'); }
  else {
    s.v(7,4,11,mane); s.v(16,4,11,mane); s.hl(8,15,3,mane);
    s.r(8,4,8,4,pelt); s.p(8,2,pelt); s.p(15,2,pelt);
    s.p(10,5,'#2a1a12',1); s.p(13,5,'#2a1a12',1); s.hl(11,12,6,'#2a1a12',1);
    s.p(10,7,'#ffffff',1); s.p(13,7,'#ffffff',1);
    s.hl(9,14,4,shade(pelt,1.2),1);
  }
}

const LEGEND_DRAW = { gengis:lgGengis, cesar:lgCesar, alexandre:lgAlex, leonidas:lgLeon, jeanne:lgJeanne,
  hannibal:lgHannibal, zeus:lgZeus, thor:lgThor, merlin:lgMerlin, anubis:lgAnubis, hercule:lgHercule };
function legendPixels(id, l){ const s = new Spr(24,24); LEGEND_DRAW[id](s,l); return s.pixels(); }

// </SPRITES>
