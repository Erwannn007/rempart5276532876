'use strict';

/* =========================================================
   Météo d'ambiance selon le décor
   ========================================================= */
const BIOME_FX = ['pollen','leaves','snow','fireflies','fireflies','dust','mist','embers','embers','motes'];
const AMB = Array.from({ length:28 }, () => ({ x:Math.random(), y:Math.random(), p:Math.random()*6.28, s:.5 + Math.random() }));
function drawAmbiance(dt){
  const kind = BIOME_FX[S.biome|0] || 'pollen', Wd = ART_W*P, Hd = ROWS*CS;
  ctx.save(); ctx.beginPath(); ctx.rect(ox, oy, Wd, Hd); ctx.clip();
  for (const a of AMB){
    a.p += dt * a.s;
    let vx = 0, vy = 0;
    if (kind === 'snow'){ vy = .05*a.s; vx = Math.sin(a.p)*.01; }
    else if (kind === 'leaves'){ vy = .035*a.s; vx = Math.sin(a.p*1.3)*.02 + .01; }
    else if (kind === 'embers'){ vy = -.04*a.s; vx = Math.sin(a.p*2)*.01; }
    else if (kind === 'dust'){ vx = .06*a.s; vy = Math.sin(a.p)*.004; }
    else if (kind === 'mist'){ vx = .008*a.s; }
    else { vx = Math.sin(a.p)*.006; vy = Math.cos(a.p*.7)*.006; }
    a.x = (a.x + vx*dt + 1) % 1; a.y = (a.y + vy*dt + 1) % 1;
    const X = snapP(ox + a.x*Wd), Y = snapP(oy + a.y*Hd);
    if (kind === 'snow'){ ctx.fillStyle = '#ffffff'; ctx.globalAlpha = .85; ctx.fillRect(X, Y, P*(a.s > 1 ? 2 : 1), P*(a.s > 1 ? 2 : 1)); }
    else if (kind === 'leaves'){ ctx.globalAlpha = .9; ctx.fillStyle = a.s > 1 ? '#d9692b' : '#b8862e'; ctx.fillRect(X, Y, 2*P, P); ctx.fillRect(X + (Math.sin(a.p) > 0 ? P : 0), Y + P, P, P); }
    else if (kind === 'embers'){ ctx.globalAlpha = .5 + .5*Math.sin(a.p*3); ctx.fillStyle = a.s > 1 ? '#ffd27a' : '#ff6a2a'; ctx.fillRect(X, Y, P, P); }
    else if (kind === 'dust'){ ctx.globalAlpha = .35; ctx.fillStyle = '#f0dca8'; ctx.fillRect(X, Y, 3*P, P); }
    else if (kind === 'mist'){ ctx.globalAlpha = .07; ctx.fillStyle = '#d8dce8'; ctx.fillRect(X, Y, 18*P, 4*P); ctx.fillRect(X + 4*P, Y - 2*P, 10*P, 2*P); }
    else if (kind === 'fireflies'){ const g = Math.sin(a.p*2.5); if (g < -.3) continue; ctx.globalAlpha = .4 + .5*g; ctx.fillStyle = S.biome === 4 ? '#c8f07a' : '#bff6ff'; ctx.fillRect(X, Y, P, P); ctx.globalAlpha *= .4; ctx.fillRect(X - P, Y, 3*P, P); ctx.fillRect(X, Y - P, P, 3*P); }
    else if (kind === 'motes'){ ctx.globalAlpha = .4 + .4*Math.sin(a.p*2); ctx.fillStyle = '#c8a0ff'; ctx.fillRect(X, Y, P, P); }
    else { ctx.globalAlpha = .35 + .3*Math.sin(a.p*2); ctx.fillStyle = '#fff3a0'; ctx.fillRect(X, Y, P, P); }
  }
  ctx.globalAlpha = 1; ctx.restore();
}
