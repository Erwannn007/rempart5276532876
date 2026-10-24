'use strict';

/* ---------- cycle de vie ---------- */
document.addEventListener('visibilitychange', () => {
  paused = document.hidden;
  if (document.hidden){ persist(); dropAudio(); } else last = performance.now();
});
window.addEventListener('pagehide', dropAudio);
document.addEventListener('touchend', audio, { capture:true, passive:true });
document.addEventListener('pointerdown', audio, { capture:true, passive:true });
document.addEventListener('gesturestart', e => e.preventDefault());
new ResizeObserver(resize).observe(stage);
window.addEventListener('orientationchange', () => setTimeout(resize, 200));

load();
computeMods();
for (const tw of S.board) if (tw) markSeen(tw.t, tw.l);
for (const tw of S.bench) if (tw) markSeen(tw.t, tw.l);
quiet = false;
recomputeSyn();
resize();
if (!hasGame) genTerrain();
resize();
if (!restoreNet(S.savedNet) && !(S.savedPreview && restoreNet({ cells:S.savedPreview, ents:[S.savedPreview[0]], exit:S.savedPreview[S.savedPreview.length-1] }))) makeNet(null);
delete S.savedNet;
S.traps = (S.savedTraps || []).filter(a => a && NET.cells.has(a[0]) && !barAt(a[0]) && TRAPS[a[1]]).map(a => ({ i:a[0], k:a[1], id:++trapSeq, cd:0, anim:0, used:false }));
delete S.savedPreview; delete S.savedTraps;
rebuildTraps();
if (hasGame && !S.nextQ) S.nextQ = makeWave(S.wave + 1);
snap(); persist();
hud();
checkAch(true);
showHome();
if (!prefs.helped) show('ovHelp');
requestAnimationFrame(t => { last = t; frame(t); });

if ('serviceWorker' in navigator){
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
