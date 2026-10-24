'use strict';

/* =========================================================
   Musique chiptune (séquenceur WebAudio)
   ========================================================= */
const MIDI = n => 440 * Math.pow(2, (n - 69) / 12);
const CH = { m:[0,3,7], M:[0,4,7] };
/* lead : par mesure, une liste [pas, note MIDI, durée en pas] ; 16 pas par mesure */
const TRACKS = {
  home: { bpm:92, prog:[[57,'m'],[53,'M'],[48,'M'],[55,'M'],[57,'m'],[53,'M'],[55,'M'],[57,'m']],
    bass:'R.......F.......', arpEvery:2, arpVol:.018, drums:null, leadType:'triangle', leadVol:.05,
    lead:[
      [[0,76,4],[4,74,2],[6,72,2],[8,71,4],[12,72,4]],
      [[0,69,6],[6,72,2],[8,77,4],[12,76,4]],
      [[0,79,4],[4,76,4],[8,72,4],[12,74,2],[14,76,2]],
      [[0,74,8],[8,71,4]],
      [[0,76,2],[2,81,2],[4,79,4],[8,76,4],[12,74,4]],
      [[0,72,4],[4,74,4],[8,77,8]],
      [[0,79,4],[4,77,2],[6,76,2],[8,74,4],[12,71,4]],
      [[0,69,12]]
    ] },
  battle: { bpm:132, prog:[[52,'m'],[48,'M'],[55,'M'],[50,'M'],[52,'m'],[48,'M'],[50,'M'],[47,'M']],
    bass:'R.R.R.R.R.R.O.R.', arpEvery:1, arpVol:.012,
    drums:{ k:'x.......x.x.....', s:'....x.......x...', h:'x.x.x.x.x.x.x.xx' }, leadType:'square', leadVol:.035,
    lead:[
      [[0,71,2],[2,76,2],[4,79,2],[6,83,4],[10,81,2],[12,79,4]],
      [[0,76,4],[4,79,2],[6,76,2],[8,72,4],[12,76,4]],
      [[0,74,2],[2,79,2],[4,83,4],[8,81,2],[10,79,2],[12,78,4]],
      [[0,81,6],[6,78,2],[8,74,8]],
      [[0,76,2],[2,79,2],[4,83,2],[6,88,4],[10,86,2],[12,83,4]],
      [[0,84,4],[4,83,2],[6,81,2],[8,79,4],[12,76,4]],
      [[0,78,4],[4,81,4],[8,86,4],[12,84,2],[14,81,2]],
      [[0,83,8],[8,75,4],[12,71,4]]
    ] },
  boss: { bpm:146, prog:[[48,'m'],[49,'M'],[48,'m'],[55,'M']],
    bass:'RRORRROR RRORROFR'.replace(' ',''), arpEvery:0, arpVol:0,
    drums:{ k:'x.....x.x.....x.', s:'....x.......x..x', h:'xxxxxxxxxxxxxxxx' }, leadType:'sawtooth', leadVol:.022,
    lead:[
      [[0,72,2],[2,75,2],[4,79,2],[6,84,2],[8,82,2],[10,79,2],[12,75,4]],
      [[0,73,2],[2,77,2],[4,80,4],[8,79,2],[10,77,2],[12,73,4]],
      [[0,84,4],[4,79,2],[6,80,2],[8,79,2],[10,75,2],[12,72,4]],
      [[0,71,4],[4,74,2],[6,77,2],[8,79,8]]
    ] }
};
const WORLD_KEY = [0, -2, 2, -3, -5, 1, -1, -4];
const MUS = { cur:null, want:null, gain:null, ac:null, step:0, next:0, vol:.55 };
function musNote(c, t, f, dur, type, vol){
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .008);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(MUS.gain); o.start(t); o.stop(t + dur + .02);
}
function musNoise(c, t, dur, vol, hp){
  if (!noiseBuf){ noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate); const ch = noiseBuf.getChannelData(0); for (let i=0;i<ch.length;i++) ch[i] = Math.random()*2-1; }
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = hp;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(f).connect(g).connect(MUS.gain); s.start(t, Math.random()*.5); s.stop(t + dur + .02);
}
function musKick(c, t){
  const o = c.createOscillator(), g = c.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + .12);
  g.gain.setValueAtTime(.13, t); g.gain.exponentialRampToValueAtTime(.0001, t + .16);
  o.connect(g).connect(MUS.gain); o.start(t); o.stop(t + .18);
}
function musStep(c, tr, step, t, key){
  const bar = Math.floor(step / 16), s = step % 16, sp = 60 / tr.bpm / 4;
  const [root, q] = tr.prog[bar % tr.prog.length];
  const r = root + key, iv = CH[q];
  const b = tr.bass[s];
  if (b && b !== '.') musNote(c, t, MIDI((b === 'O' ? r : b === 'F' ? r + 7 - 12 : r - 12)), sp * (tr.bpm > 120 ? .9 : 3.6), 'triangle', .07);
  if (tr.arpEvery && s % tr.arpEvery === 0){ const k = (s / tr.arpEvery) % 4, n = r + 12 + (k === 3 ? 12 : iv[k]); musNote(c, t, MIDI(n), sp * tr.arpEvery * .9, 'square', tr.arpVol); }
  if (tr.drums){
    if (tr.drums.k[s] === 'x') musKick(c, t);
    if (tr.drums.s[s] === 'x') musNoise(c, t, .12, .06, 1400);
    if (tr.drums.h[s] === 'x') musNoise(c, t, .03, .018, 7000);
  }
  const L = tr.lead[bar % tr.lead.length];
  for (const [ls, n, len] of L) if (ls === s) musNote(c, t, MIDI(n + key), sp * len * .95, tr.leadType, tr.leadVol);
}
function musicWanted(){
  if (!prefs.music) return null;
  if (homeOn || !hasGame) return 'home';
  if (over) return null;
  if (inWave) return (enemies.some(e => EN[e.k].boss) || queue.some(k => EN[k].boss)) ? 'boss' : 'battle';
  return 'home';
}
function musicTick(){
  const c = (typeof liveAC === 'function') ? liveAC() : null;
  if (!c) return;
  if (MUS.ac !== c){ MUS.ac = c; MUS.gain = c.createGain(); MUS.gain.gain.value = MUS.vol; MUS.gain.connect(c.destination); MUS.cur = null; }
  const want = musicWanted();
  if (want !== MUS.cur){
    MUS.gain.gain.cancelScheduledValues(c.currentTime);
    MUS.gain.gain.setValueAtTime(.0001, c.currentTime);
    MUS.gain.gain.exponentialRampToValueAtTime(MUS.vol, c.currentTime + .6);
    MUS.cur = want; MUS.step = 0; MUS.next = c.currentTime + .08;
  }
  if (!MUS.cur) return;
  const tr = TRACKS[MUS.cur], key = (hasGame && S && S.mode === 'story') ? WORLD_KEY[S.world|0] : 0;
  if (MUS.next < c.currentTime - .5) MUS.next = c.currentTime + .05;
  while (MUS.next < c.currentTime + .25){
    musStep(c, tr, MUS.step, MUS.next, key);
    MUS.step = (MUS.step + 1) % (tr.lead.length * 16);
    MUS.next += 60 / tr.bpm / 4;
  }
}
setInterval(musicTick, 70);
