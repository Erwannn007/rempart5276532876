'use strict';

/* =========================================================
   Audio (synthé minimal)
   ========================================================= */
let AC = null, noiseBuf = null; const lastSfx = {};
/* iOS coupe le contexte audio quand l'app passe en arrière-plan (état « interrupted »,
   parfois un contexte « zombie » qui ne joue plus rien). On le recrée au premier toucher. */
let acCheck = null;
function audio(){
  if (AC && AC.state === 'running' && acCheck && performance.now() - acCheck.t > 1000 && AC.currentTime === acCheck.ct){
    try { AC.close(); } catch(e){}
    AC = null;
  }
  if (AC && AC.state === 'closed') AC = null;
  if (!AC){
    try { AC = new (window.AudioContext || window.webkitAudioContext)(); noiseBuf = null; } catch(e){ return null; }
  }
  if (AC.state !== 'running'){ try { const r = AC.resume(); if (r && r.catch) r.catch(() => {}); } catch(e){} }
  try {
    const b = AC.createBuffer(1, 1, 22050), src = AC.createBufferSource();
    src.buffer = b; src.connect(AC.destination); src.start(0);
  } catch(e){}
  acCheck = { t: performance.now(), ct: AC.currentTime };
  return AC;
}
const liveAC = () => (AC && AC.state === 'running') ? AC : null;
function dropAudio(){ if (AC){ try { AC.close(); } catch(e){} } AC = null; acCheck = null; }
function tone(f, d, type, v, f2, delay=0){
  const c = liveAC(); if (!c) return;
  const t0 = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t0);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0+d);
  g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(.0001, t0+d);
  o.connect(g).connect(c.destination); o.start(t0); o.stop(t0+d+.02);
}
function noise(d, v, freq){
  const c = liveAC(); if (!c) return;
  if (!noiseBuf){ noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate); const ch = noiseBuf.getChannelData(0); for (let i=0;i<ch.length;i++) ch[i]=Math.random()*2-1; }
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = noiseBuf; f.type = 'lowpass'; f.frequency.value = freq;
  g.gain.setValueAtTime(v, c.currentTime); g.gain.exponentialRampToValueAtTime(.0001, c.currentTime+d);
  s.connect(f).connect(g).connect(c.destination); s.start(); s.stop(c.currentTime+d+.02);
}
const SFX = {
  arrow:  () => tone(900,.05,'square',.02,500),
  slash:  () => noise(.07,.06,3200),
  lob:    () => tone(200,.12,'triangle',.05,320),
  boom:   () => { noise(.32,.13,700); tone(95,.25,'sine',.12,40); },
  ice:    () => tone(1500,.09,'triangle',.03,900),
  zap:    () => tone(260,.14,'sawtooth',.03,1300),
  kill:   () => tone(700,.05,'square',.025,1050),
  split:  () => { tone(330,.08,'square',.04,520); tone(260,.1,'square',.03,180,.06); },
  merge:  () => [523,659,784,1046].forEach((f,i) => tone(f,.1,'square',.035,0,i*.055)),
  recruit:() => { tone(392,.07,'square',.035); tone(587,.09,'square',.035,0,.07); },
  leak:   () => tone(130,.28,'sawtooth',.06,55),
  wave:   () => [392,523,659].forEach((f,i) => tone(f,.13,'triangle',.06,0,i*.09)),
  clear:  () => [659,784,988,1318].forEach((f,i) => tone(f,.1,'triangle',.05,0,i*.07)),
  bad:    () => tone(170,.1,'square',.035,120),
  sell:   () => { tone(988,.06,'square',.03); tone(1318,.08,'square',.03,0,.06); },
  goblin: () => [1318,1568,1760,2093].forEach((f,i) => tone(f,.07,'square',.025,0,i*.05)),
  jackpot:() => [784,988,1175,1568,1976].forEach((f,i) => tone(f,.09,'square',.035,0,i*.05)),
  spike:  () => noise(.05,.05,5000),
  build:  () => { noise(.12,.08,1200); tone(196,.12,'square',.04,294,.05); },
  legend: () => [392,523,659,784,1046].forEach((f,i) => tone(f,.22,'triangle',.06,0,i*.11)),
  offer:  () => [659,880,1175,1568].forEach((f,i) => tone(f,.16,'triangle',.05,0,i*.07)),
  thunder:() => { noise(.45,.14,900); tone(70,.4,'sine',.12,35); },
  stomp:  () => { noise(.18,.1,400); tone(80,.2,'sine',.12,45); },
  clang:  () => { tone(1250,.08,'square',.025,900); tone(1880,.06,'triangle',.02); },
  freeze: () => [2093,1568,1175,880].forEach((f,i) => tone(f,.12,'triangle',.04,0,i*.06)),
  ko:     () => { tone(220,.18,'square',.05,90); noise(.12,.06,900); },
  bless:  () => [523,784,1046,1568].forEach((f,i) => tone(f,.18,'triangle',.05,0,i*.08)),
  win:    () => [523,659,784,1046,784,1046].forEach((f,i) => tone(f,.2,'triangle',.06,0,i*.13)),
  over:   () => [392,330,262,196].forEach((f,i) => tone(f,.22,'triangle',.06,0,i*.18))
};
function sfx(k){
  if (!prefs.sound) return;
  const n = performance.now(); if (n - (lastSfx[k]||0) < 45) return; lastSfx[k] = n;
  try { SFX[k](); } catch(e){}
}
