// Taller de Lapidario y Piedras Mágicas — Krysalis
// Web Audio procedimental + Minijuego interactivo de 4 Fases (Cincelado de Ganga, Cortes Sinuosos de Pulso, Sweet Spot, Evaluación) + Cálculo de Probabilidad de Rotura

function getInitialCrustPlates(){
  return [
    { id: 1, cx: 85,  cy: 80,  r: 30, type: 'gangue', label: 'Costra NO', cleared: false },
    { id: 2, cx: 150, cy: 65,  r: 32, type: 'gangue', label: 'Matriz Norte', cleared: false },
    { id: 3, cx: 215, cy: 80,  r: 30, type: 'gangue', label: 'Costra NE', cleared: false },
    { id: 4, cx: 65,  cy: 150, r: 32, type: 'gangue', label: 'Costra Oeste', cleared: false },
    { id: 5, cx: 235, cy: 150, r: 32, type: 'gangue', label: 'Costra Este',  cleared: false },
    { id: 6, cx: 85,  cy: 220, r: 30, type: 'gangue', label: 'Costra SO', cleared: false },
    { id: 7, cx: 150, cy: 235, r: 32, type: 'gangue', label: 'Matriz Sur',  cleared: false },
    { id: 8, cx: 215, cy: 220, r: 30, type: 'gangue', label: 'Costra SE',  cleared: false },
    // Vetas críticas frágiles (Zonas Prohibidas)
    { id: 9,  cx: 115, cy: 145, r: 26, type: 'fissure', label: '⚠️ FISURA', cleared: false },
    { id: 10, cx: 185, cy: 145, r: 26, type: 'fissure', label: '⚠️ FISURA', cleared: false }
  ];
}

// Vértices 3D del icosaedro geoda (R = 82px)
function get3DGeodeVertices(){
  var phi = (1 + Math.sqrt(5)) / 2;
  var s = 82 / Math.sqrt(1 + phi * phi);
  var a = s;
  var b = s * phi;
  return [
    { x: -a, y:  b, z:  0 }, // 0
    { x:  a, y:  b, z:  0 }, // 1
    { x: -a, y: -b, z:  0 }, // 2
    { x:  a, y: -b, z:  0 }, // 3
    { x:  0, y: -a, z:  b }, // 4
    { x:  0, y:  a, z:  b }, // 5
    { x:  0, y: -a, z: -b }, // 6
    { x:  0, y:  a, z: -b }, // 7
    { x:  b, y:  0, z: -a }, // 8
    { x:  b, y:  0, z:  a }, // 9
    { x: -b, y:  0, z: -a }, // 10
    { x: -b, y:  0, z:  a }  // 11
  ];
}

// 20 Caras poligonales 3D: 16 de ganga basáltica y 4 fisuras críticas con sistema Buscaminas
function getInitial3DGeodeFaces(){
  var rawFaces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9],  [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4],  [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5],  [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
  ];

  var fissureIndices = [3, 7, 12, 18];

  // Precalcular vecinos que comparten arista (exactamente 2 vértices en común)
  var neighborsMap = rawFaces.map(function(fA, i){
    var nList = [];
    for(var j = 0; j < rawFaces.length; j++){
      if(i === j) continue;
      var fB = rawFaces[j];
      var shared = 0;
      for(var v = 0; v < 3; v++){
        if(fB.indexOf(fA[v]) !== -1) shared++;
      }
      if(shared === 2) nList.push(j);
    }
    return nList;
  });

  return rawFaces.map(function(indices, id){
    var isFissure = fissureIndices.indexOf(id) !== -1;
    var neighbors = neighborsMap[id] || [];
    var dangerCount = neighbors.filter(function(nIdx){
      return fissureIndices.indexOf(nIdx) !== -1;
    }).length;

    return {
      id: id + 1,
      indices: indices,
      neighbors: neighbors,
      type: isFissure ? 'fissure' : 'gangue',
      dangerCount: isFissure ? 0 : dangerCount,
      cleared: false,
      flagged: false,
      label: isFissure ? '⚠️ FISURA' : ('Costra #' + (id + 1))
    };
  });
}

// Cascada de revelación Buscaminas (al abrir una faceta con 0 fallas vecinas)
function cascadeClearSafeFaces(startIdx){
  var faces = lapidaryMinigameState.geodeFaces || [];
  if(startIdx < 0 || startIdx >= faces.length) return false;

  var queue = [startIdx];
  var visited = {};
  visited[startIdx] = true;
  var clearedAny = false;

  while(queue.length > 0){
    var curIdx = queue.shift();
    var f = faces[curIdx];
    if(!f || f.type === 'fissure' || f.flagged) continue;

    if(!f.cleared){
      f.cleared = true;
      clearedAny = true;
    }

    // Si la faceta tiene 0 fisuras adyacentes, propagar a las vecinas no marcadas
    if(f.dangerCount === 0 && f.neighbors){
      for(var i = 0; i < f.neighbors.length; i++){
        var nIdx = f.neighbors[i];
        var nFace = faces[nIdx];
        if(nFace && !nFace.cleared && !nFace.flagged && nFace.type !== 'fissure' && !visited[nIdx]){
          visited[nIdx] = true;
          queue.push(nIdx);
        }
      }
    }
  }
  return clearedAny;
}

var lapidaryMinigameState = {
  active: false,
  charId: null,
  stoneId: null,
  phase: 1, // 1: Geoda 3D Buscaminas, 2: Sierra diamantada de alta habilidad, 3: Sweet spot timing, 4: Resumen y rotura

  // Fase 1: Geoda 3D Buscaminas (Inspección 360° y Cincelado Lógico)
  cleanPct: 0,
  fragileHits: 0,
  maxFragileHits: 4,
  phase1Score: 100,
  crustPlates: getInitialCrustPlates(),
  geodeFaces: getInitial3DGeodeFaces(),
  selectedTool: 'chisel', // 'chisel' | 'flag' | 'hammer'
  geodeRotX: 0.35,
  geodeRotY: 0.50,
  isDraggingGeode: false,
  geodeDragMoved: false,
  lastGeodeX: 0,
  lastGeodeY: 0,
  geodeAnimId: null,
  isTouchCutting: false,
  touchFingerPt: null,
  fragileVeins: [
    { x: 115, y: 145, r: 26, label: "Fisura A" },
    { x: 185, y: 145, r: 26, label: "Fisura B" },
    { x: 150, y: 220, r: 26, label: "Fisura C" }
  ],
  isChiseling: false,
  lastChiselTime: 0,

  // Fase 2: Sierra Diamantada de Alta Habilidad (Tacómetro, Calor de Fricción e Inclusiones)
  slidePass: 1,
  maxSlidePasses: 3,
  slideScores: [],
  currentSlideActive: false,
  slideSamples: 0,
  slideDeviations: 0,
  slideProgress: 0,
  slidePrecision: 100,
  traveledPoints: [],
  pathProgressIdx: 0,
  sawSpeed: 0,
  lastSawPos: null,
  lastSawTime: 0,
  frictionHeat: 0,
  clearedInclusions: [],
  slidePoints: [
    {
      id: 1,
      name: "Corte 1: Onda Sinuosa de Cintura",
      type: "sinusoidal",
      desc: "Onda de faceta: modula la velocidad en zona óptima (40-110 px/s) y pasa con cautela por los 2 nódulos.",
      tolerance: 8,
      inclusions: [0.35, 0.70],
      x1: 45, y1: 150, x2: 255, y2: 150,
      waypoints: [
        { x: 45,  y: 150 },
        { x: 75,  y: 112 },
        { x: 105, y: 92 },
        { x: 135, y: 118 },
        { x: 150, y: 150 },
        { x: 165, y: 182 },
        { x: 195, y: 208 },
        { x: 225, y: 188 },
        { x: 255, y: 150 }
      ]
    },
    {
      id: 2,
      name: "Corte 2: Perfil en Zigzag de Corona",
      type: "zigzag",
      desc: "Facetado angular: contrarresta la micro-vibración y reduce a 30 px/s en los ángulos cerrados.",
      tolerance: 8,
      inclusions: [0.38, 0.72],
      x1: 45, y1: 220, x2: 255, y2: 220,
      waypoints: [
        { x: 45,  y: 220 },
        { x: 80,  y: 120 },
        { x: 115, y: 195 },
        { x: 150, y: 80 },
        { x: 185, y: 195 },
        { x: 220, y: 120 },
        { x: 255, y: 220 }
      ]
    },
    {
      id: 3,
      name: "Corte 3: Arco Parabólico de Pabellón",
      type: "arch",
      desc: "Arco de alta tensión: tolerancia crítica en la cúspide (8px); desacelera para perforar el nódulo apical.",
      tolerance: 8,
      inclusions: [0.48, 0.80],
      x1: 60, y1: 240, x2: 240, y2: 240,
      waypoints: [
        { x: 60,  y: 240 },
        { x: 85,  y: 165 },
        { x: 110, y: 105 },
        { x: 135, y: 65 },
        { x: 150, y: 52 },
        { x: 165, y: 65 },
        { x: 190, y: 105 },
        { x: 215, y: 165 },
        { x: 240, y: 240 }
      ]
    }
  ],
  lastSlidePos: null,
  phase2Score: 0,

  // Fase 3: Facetado Sweet Spot (Timing oscilante)
  timingPass: 1,
  maxPasses: 3,
  timingHits: 0,
  cursorPos: 0.5,
  cursorDir: 1,
  cursorSpeed: 0.024,
  sweetSpotStart: 0.38,
  sweetSpotEnd: 0.62,
  animId: null,
  passResults: [],
  phase3Score: 0,

  // Fase 4: Resumen, Riesgo de Rotura y Tirada
  totalArtisanScore: 0,
  breakRisk: 10,
  rollBonus: 0,
  pendingBreakRoll: null
};

/* ==========================================================================
   1. MOTOR DE AUDIO PROCEDIMENTAL (Web Audio API — Sin archivos externos)
   ========================================================================== */

function getLapidaryAudioCtx(){
  if(typeof getAudioCtx === "function"){
    return getAudioCtx();
  }
  if(!window._lapidaryAudioCtx){
    try {
      window._lapidaryAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e){}
  }
  if(window._lapidaryAudioCtx && window._lapidaryAudioCtx.state === 'suspended'){
    window._lapidaryAudioCtx.resume();
  }
  return window._lapidaryAudioCtx;
}

// Raspado arenoso normal de la ganga
function playLapidaryScrape(){
  var ctx = getLapidaryAudioCtx();
  if(!ctx) return;
  try {
    var dur = 0.09;
    var bufSize = Math.floor(ctx.sampleRate * dur);
    var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for(var i = 0; i < bufSize; i++){
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.45));
    }
    var src = ctx.createBufferSource();
    src.buffer = buf;

    var bpf = ctx.createBiquadFilter();
    bpf.type = "bandpass";
    bpf.frequency.setValueAtTime(1600 + Math.random() * 500, ctx.currentTime);
    bpf.Q.setValueAtTime(2.8, ctx.currentTime);

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);

    src.connect(bpf);
    bpf.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  } catch(e){}
}

// Golpe con cincel y desprendimiento de placa de ganga
function playLapidaryChiselStrike(){
  var ctx = getLapidaryAudioCtx();
  if(!ctx) return;
  try {
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var oscGain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1750, now);
    osc.frequency.exponentialRampToValueAtTime(380, now + 0.08);

    oscGain.gain.setValueAtTime(0.2, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);

    var dur = 0.12;
    var bufSize = Math.floor(ctx.sampleRate * dur);
    var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for(var i = 0; i < bufSize; i++){
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.35));
    }
    var noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = buf;
    var bpf = ctx.createBiquadFilter();
    bpf.type = "bandpass";
    bpf.frequency.setValueAtTime(1150, now);
    bpf.Q.setValueAtTime(2.2, now);

    var nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.18, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noiseSrc.connect(bpf);
    bpf.connect(nGain);
    nGain.connect(ctx.destination);
    noiseSrc.start(now);
  } catch(e){}
}

// Golpe contundente con martillo pesado de geoda
function playLapidaryHeavyHammer(){
  var ctx = getLapidaryAudioCtx();
  if(!ctx) return;
  try {
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.18);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  } catch(e){}
}

// Siseo de sobrecalentamiento térmico por fricción en sierra
function playLapidaryThermalSizzle(){
  var ctx = getLapidaryAudioCtx();
  if(!ctx) return;
  try {
    var dur = 0.25;
    var bufSize = Math.floor(ctx.sampleRate * dur);
    var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for(var i = 0; i < bufSize; i++){
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.4));
    }
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var hpf = ctx.createBiquadFilter();
    hpf.type = "highpass";
    hpf.frequency.setValueAtTime(3200, ctx.currentTime);

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);

    src.connect(hpf);
    hpf.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  } catch(e){}
}

// Zumbido de advertencia al salirse del canal de corte (falta de pulso)
function playPulsoWarning(){
  var ctx = getLapidaryAudioCtx();
  if(!ctx) return;
  try {
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(170, now);
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  } catch(e){}
}

// Fricción / desbaste de corte continuo para slides
function playSlideCutWhir(){
  var ctx = getLapidaryAudioCtx();
  if(!ctx) return;
  try {
    var dur = 0.12;
    var bufSize = Math.floor(ctx.sampleRate * dur);
    var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for(var i = 0; i < bufSize; i++){
      data[i] = (Math.random() * 2 - 1) * 0.6;
    }
    var src = ctx.createBufferSource();
    src.buffer = buf;

    var bpf = ctx.createBiquadFilter();
    bpf.type = "bandpass";
    bpf.frequency.setValueAtTime(2200, ctx.currentTime);
    bpf.Q.setValueAtTime(4, ctx.currentTime);

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.09, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.002, ctx.currentTime + dur);

    src.connect(bpf);
    bpf.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  } catch(e){}
}

// Crujido de advertencia al rozar una veta frágil
function playGemFractureTick(){
  var ctx = getLapidaryAudioCtx();
  if(!ctx) return;
  try {
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.14);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  } catch(e){}
}

// Éxito al completar un slide de corte guiado
function playSlideSuccess(){
  var ctx = getLapidaryAudioCtx();
  if(!ctx) return;
  try {
    var now = ctx.currentTime;
    var freqs = [1046.50, 1567.98]; // C6, G6
    freqs.forEach(function(f, i){
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, now + i * 0.07);

      gain.gain.setValueAtTime(0.001, now + i * 0.07);
      gain.gain.linearRampToValueAtTime(0.12, now + i * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.32);
    });
  } catch(e){}
}

// Fricción / desbaste giratorio
function playLapidaryGrind(){
  var ctx = getLapidaryAudioCtx();
  if(!ctx) return;
  try {
    var dur = 0.22;
    var bufSize = Math.floor(ctx.sampleRate * dur);
    var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for(var i = 0; i < bufSize; i++){
      data[i] = (Math.random() * 2 - 1) * 0.7;
    }
    var src = ctx.createBufferSource();
    src.buffer = buf;

    var hpf = ctx.createBiquadFilter();
    hpf.type = "highpass";
    hpf.frequency.setValueAtTime(750, ctx.currentTime);

    var peak = ctx.createBiquadFilter();
    peak.type = "peaking";
    peak.frequency.setValueAtTime(2400, ctx.currentTime);
    peak.gain.setValueAtTime(8, ctx.currentTime);

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.002, ctx.currentTime + dur);

    src.connect(hpf);
    hpf.connect(peak);
    peak.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  } catch(e){}
}

// Acierto en Sweet Spot: Resonancia cristalina pura (armónico brillante)
function playGemSweetSpotHit(){
  var ctx = getLapidaryAudioCtx();
  if(!ctx) return;
  try {
    var now = ctx.currentTime;
    var osc1 = ctx.createOscillator();
    var osc2 = ctx.createOscillator();
    var gain = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(1318.51, now); // E6
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(2637.02, now); // E7

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.4);
    osc2.stop(now + 0.4);
  } catch(e){}
}

// Fallo en Sweet Spot / Desvío de corte
function playGemSweetSpotMiss(){
  var ctx = getLapidaryAudioCtx();
  if(!ctx) return;
  try {
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.18);

    var lpf = ctx.createBiquadFilter();
    lpf.type = "lowpass";
    lpf.frequency.setValueAtTime(280, now);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(lpf);
    lpf.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  } catch(e){}
}

// Acorde cristalino armónico de finalización exitosa (Buena / Perfecta)
function playGemChime(qualityId){
  var ctx = getLapidaryAudioCtx();
  if(!ctx) return;
  try {
    var now = ctx.currentTime;
    var freqs = (qualityId === "perfecta") ? [1046.50, 1318.51, 1567.98, 1975.53, 2093.00, 3135.96] : [1046.50, 1318.51, 1567.98, 2093.00];
    freqs.forEach(function(f, idx){
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, now + idx * 0.08);

      var start = now + idx * 0.08;
      var dur = (qualityId === "perfecta") ? 1.6 : 1.1;

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0005, start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur + 0.05);
    });
  } catch(e){}
}

// Fractura de la gema (Arruinada): crujido disonante con caída rápida
function playGemFracture(){
  var ctx = getLapidaryAudioCtx();
  if(!ctx) return;
  try {
    var now = ctx.currentTime;
    var osc1 = ctx.createOscillator();
    var osc2 = ctx.createOscillator();
    var gain = ctx.createGain();

    osc1.type = "sawtooth";
    osc2.type = "square";
    osc1.frequency.setValueAtTime(320, now);
    osc2.frequency.setValueAtTime(338, now);

    osc1.frequency.exponentialRampToValueAtTime(70, now + 0.45);
    osc2.frequency.exponentialRampToValueAtTime(65, now + 0.45);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.52);
    osc2.stop(now + 0.52);
  } catch(e){}
}

/* ==========================================================================
   2. FUNCIONES DE BÚSQUEDA Y UTILIDADES DE GEMAS
   ========================================================================== */

function getStoneFamily(colorId){
  var safeId = String(colorId || "blanca").toLowerCase().trim();
  var found = (typeof MAGIC_STONE_FAMILIES !== "undefined") ? MAGIC_STONE_FAMILIES.find(function(f){ return f.id === safeId; }) : null;
  return found || {
    id: safeId,
    name: colorId || "Desconocida",
    hex: "#DEC392",
    glow: "rgba(222, 195, 146, 0.6)",
    gema: "Gema Mística",
    familia: "Afinidad Arcana",
    desc: "Piedra mágica de propiedades sutiles.",
    icon: "💎"
  };
}

function getLapidaryTier(tierId){
  var safeId = String(tierId || "hierro").toLowerCase().trim();
  var found = (typeof LAPIDARY_TIERS !== "undefined") ? LAPIDARY_TIERS.find(function(t){ return t.id === safeId; }) : null;
  return found || {
    id: "hierro",
    name: "Puntas de Hierro",
    tier: 1,
    bonusRoll: 0,
    icon: "⛏️",
    desc: "Herramienta rudimentaria."
  };
}

function getStoneQuality(qualityId){
  var safeId = String(qualityId || "buena").toLowerCase().trim();
  var found = (typeof STONE_QUALITIES !== "undefined") ? STONE_QUALITIES.find(function(q){ return q.id === safeId; }) : null;
  return found || {
    id: safeId,
    label: safeId.toUpperCase(),
    color: "#60A5FA",
    badgeClass: "badge-rara",
    desc: "Calidad estándar."
  };
}

function getStoneQualityByRoll(rollTotal){
  var tot = Math.max(0, parseInt(rollTotal, 10) || 0);
  if(tot < 8) return getStoneQuality("arruinada");
  if(tot <= 13) return getStoneQuality("imperfecta");
  if(tot <= 17) return getStoneQuality("buena");
  return getStoneQuality("perfecta");
}

/* ==========================================================================
   3. MINIJUEGO DE TALLA: GESTOR DE FASES Y MODAL
   ========================================================================== */

function openLapidaryMinigame(charId, stoneId){
  var c = (state.characters || []).find(function(ch){ return ch.id === charId; });
  if(!c) return;
  var stone = (c.stones || []).find(function(st){ return st.id === stoneId; });
  if(!stone) return;

  lapidaryMinigameState.active = true;
  lapidaryMinigameState.charId = charId;
  lapidaryMinigameState.stoneId = stoneId;
  lapidaryMinigameState.phase = 1;

  // Reset Fase 1 (Geoda 3D)
  lapidaryMinigameState.geodeFaces = getInitial3DGeodeFaces();
  lapidaryMinigameState.crustPlates = getInitialCrustPlates();
  lapidaryMinigameState.selectedTool = 'hammer';
  lapidaryMinigameState.geodeRotX = 0.35;
  lapidaryMinigameState.geodeRotY = 0.50;
  lapidaryMinigameState.cleanPct = 0;
  lapidaryMinigameState.fragileHits = 0;
  lapidaryMinigameState.phase1Score = 40;
  lapidaryMinigameState.isDraggingGeode = false;

  // Reset Fase 2 (Sierra Diamantada de Alta Habilidad)
  lapidaryMinigameState.slidePass = 1;
  lapidaryMinigameState.slideScores = [];
  lapidaryMinigameState.currentSlideActive = false;
  lapidaryMinigameState.slideSamples = 0;
  lapidaryMinigameState.slideDeviations = 0;
  lapidaryMinigameState.slideProgress = 0;
  lapidaryMinigameState.slidePrecision = 100;
  lapidaryMinigameState.traveledPoints = [];
  lapidaryMinigameState.pathProgressIdx = 0;
  lapidaryMinigameState.sawSpeed = 0;
  lapidaryMinigameState.lastSawPos = null;
  lapidaryMinigameState.lastSawTime = 0;
  lapidaryMinigameState.frictionHeat = 0;
  lapidaryMinigameState.clearedInclusions = [];
  lapidaryMinigameState.phase2Score = 0;

  // Reset Fase 3
  lapidaryMinigameState.timingPass = 1;
  lapidaryMinigameState.timingHits = 0;
  lapidaryMinigameState.passResults = [];
  lapidaryMinigameState.cursorPos = 0.5;
  lapidaryMinigameState.cursorDir = 1;
  lapidaryMinigameState.cursorSpeed = 0.024;
  lapidaryMinigameState.phase3Score = 0;

  // Reset Fase 4
  lapidaryMinigameState.totalArtisanScore = 0;
  lapidaryMinigameState.breakRisk = 10;
  lapidaryMinigameState.rollBonus = 0;

  var overlay = document.getElementById("lapidaryModalOverlay");
  var modal = document.getElementById("lapidaryModal");
  if(!overlay || !modal) return;

  renderLapidaryModalContent();
  overlay.classList.remove("hidden");

  requestAnimationFrame(function(){
    initLapidary3DGeodeStage();
  });
}

function closeLapidaryMinigame(){
  lapidaryMinigameState.active = false;
  if(lapidaryMinigameState.animId){
    cancelAnimationFrame(lapidaryMinigameState.animId);
    lapidaryMinigameState.animId = null;
  }
  if(lapidaryMinigameState.geodeAnimId){
    cancelAnimationFrame(lapidaryMinigameState.geodeAnimId);
    lapidaryMinigameState.geodeAnimId = null;
  }
  var modal = document.getElementById("lapidaryModal");
  if(modal) modal.classList.remove("phase-2-fullscreen");
  var overlay = document.getElementById("lapidaryModalOverlay");
  if(overlay) overlay.classList.add("hidden");
}

function renderLapidaryModalContent(){
  var modal = document.getElementById("lapidaryModal");
  if(!modal) return;

  if(lapidaryMinigameState.phase === 2 && lapidaryMinigameState.slidePass <= lapidaryMinigameState.maxSlidePasses){
    modal.classList.add("phase-2-fullscreen");
  } else {
    modal.classList.remove("phase-2-fullscreen");
  }

  var c = (state.characters || []).find(function(ch){ return ch.id === lapidaryMinigameState.charId; });
  var stone = c ? (c.stones || []).find(function(st){ return st.id === lapidaryMinigameState.stoneId; }) : null;
  if(!c || !stone){ closeLapidaryMinigame(); return; }

  var family = getStoneFamily(stone.color);
  var tier = getLapidaryTier(c.lapidaryTier);

  var html = '<div class="lapidary-modal-header">' +
    '<div class="lapidary-modal-title">' +
      '<span class="lapidary-gem-icon" style="color:' + family.hex + ';filter:drop-shadow(0 0 10px ' + family.glow + ');">' + family.icon + '</span>' +
      '<div>' +
        '<h2>Talla de Lapidario: ' + esc(family.gema) + '</h2>' +
        '<div class="lapidary-gem-subtitle">Familia: ' + esc(family.name) + ' (' + esc(family.familia) + ') &bull; Origen: ' + esc(stone.origen) + '</div>' +
      '</div>' +
    '</div>' +
    '<button type="button" class="lapidary-close-btn" data-action="close-lapidary-minigame" aria-label="Cerrar">&times;</button>' +
  '</div>';

  // Barra de progreso de fases (4 Fases)
  html += '<div class="lapidary-phase-stepper">' +
    '<div class="lapidary-step ' + (lapidaryMinigameState.phase === 1 ? 'current' : (lapidaryMinigameState.phase > 1 ? 'completed' : '')) + '">' +
      '<div class="lapidary-step-num">1</div>' +
      '<div class="lapidary-step-label">Limpieza</div>' +
    '</div>' +
    '<div class="lapidary-step-line ' + (lapidaryMinigameState.phase > 1 ? 'active' : '') + '"></div>' +
    '<div class="lapidary-step ' + (lapidaryMinigameState.phase === 2 ? 'current' : (lapidaryMinigameState.phase > 2 ? 'completed' : '')) + '">' +
      '<div class="lapidary-step-num">2</div>' +
      '<div class="lapidary-step-label">Cortes Guiados</div>' +
    '</div>' +
    '<div class="lapidary-step-line ' + (lapidaryMinigameState.phase > 2 ? 'active' : '') + '"></div>' +
    '<div class="lapidary-step ' + (lapidaryMinigameState.phase === 3 ? 'current' : (lapidaryMinigameState.phase > 3 ? 'completed' : '')) + '">' +
      '<div class="lapidary-step-num">3</div>' +
      '<div class="lapidary-step-label">Sweet Spot</div>' +
    '</div>' +
    '<div class="lapidary-step-line ' + (lapidaryMinigameState.phase > 3 ? 'active' : '') + '"></div>' +
    '<div class="lapidary-step ' + (lapidaryMinigameState.phase === 4 ? 'current' : '') + '">' +
      '<div class="lapidary-step-num">4</div>' +
      '<div class="lapidary-step-label">Riesgo & Tirada</div>' +
    '</div>' +
  '</div>';

  // ==========================================
  // FASE 1: GEODA 3D BUSCAMINAS (INSPECCIÓN 360° Y DEDUCCIÓN LÓGICA)
  // ==========================================
  if(lapidaryMinigameState.phase === 1){
    var integrity = Math.max(0, 100 - (lapidaryMinigameState.fragileHits * 25));
    var geodeFaces = lapidaryMinigameState.geodeFaces || [];
    var gangueFaces = geodeFaces.filter(function(f){ return f.type === 'gangue'; });
    var totalGangue = gangueFaces.length; // 16
    var safeCleared = gangueFaces.filter(function(f){ return f.cleared; }).length;
    var targetClears = 12; // 75%
    var cleanPct = Math.min(100, Math.round((safeCleared / targetClears) * 100));

    var flaggedCount = geodeFaces.filter(function(f){ return f.flagged; }).length;
    var correctlyFlagged = geodeFaces.filter(function(f){ return f.flagged && f.type === 'fissure'; }).length;
    var minesweeperBonus = (correctlyFlagged === 4 && flaggedCount === 4) ? 15 : 0;

    var p1Score = Math.max(0, Math.min(100, Math.round((cleanPct * 0.6) + (integrity * 0.4)) + minesweeperBonus));
    lapidaryMinigameState.cleanPct = cleanPct;
    lapidaryMinigameState.phase1Score = p1Score;

    html += '<div class="lapidary-phase-body">' +
      '<div class="lapidary-instructions">' +
        '<b>Fase 1: Geoda Buscaminas 3D (Inspección y Deducción)</b><br>' +
        'Gira la geoda 360° en 3D. Cada faceta revelada indica cuántas de sus 3 vecinas ocultan fisuras críticas.<br>' +
        '<span style="color:#34D399;font-weight:600;">0 = Seguro (¡cascada!)</span> &bull; <span style="color:#FBBF24;font-weight:600;">1 = Falla leve</span> &bull; <span style="color:#F87171;font-weight:600;">2 = Peligro cercano</span>.<br>' +
        'Usa la <b>🚩 Bandera</b> para proteger fallas y evitar dañarlas.' +
      '</div>' +

      // Live HUD con puntos, porcentajes y banderas
      '<div class="lapidary-live-hud">' +
        '<div class="lapidary-hud-badge">' +
          '<span class="hud-label">COSTRA 3D RETIRADA</span>' +
          '<b class="hud-val ' + (cleanPct >= 75 ? 'safe' : 'warning') + '" id="lapidaryHudClean">' + safeCleared + ' / ' + targetClears + ' (' + cleanPct + '%)</b>' +
        '</div>' +
        '<div class="lapidary-hud-badge">' +
          '<span class="hud-label">INTEGRIDAD</span>' +
          '<b class="hud-val ' + (integrity < 50 ? 'danger' : (integrity < 75 ? 'warning' : 'safe')) + '" id="lapidaryHudIntegrity">' + integrity + '% (' + integrity + ' pts)</b>' +
        '</div>' +
        '<div class="lapidary-hud-badge">' +
          '<span class="hud-label">🚩 BANDERAS</span>' +
          '<b class="hud-val" id="lapidaryHudFlags" style="color:#FCA5A5;">' + flaggedCount + ' / 4' + (minesweeperBonus > 0 ? ' ✨' : '') + '</b>' +
        '</div>' +
        '<div class="lapidary-hud-badge">' +
          '<span class="hud-label">PUNTUACIÓN FASE 1</span>' +
          '<b class="hud-val" id="lapidaryHudPhase1Score">' + p1Score + ' pts</b>' +
        '</div>' +
      '</div>' +

      // Selector de Herramienta Geológica
      '<div class="lapidary-geode-toolbar">' +
        '<button type="button" class="lapidary-tool-btn ' + (lapidaryMinigameState.selectedTool === 'chisel' ? 'active' : '') + '" data-action="select-lapidary-tool" data-tool="chisel">⛏️ Cincel (Revelar Faceta)</button>' +
        '<button type="button" class="lapidary-tool-btn ' + (lapidaryMinigameState.selectedTool === 'flag' ? 'active' : '') + '" data-action="select-lapidary-tool" data-tool="flag">🚩 Bandera (Marcar Fisura)</button>' +
        '<button type="button" class="lapidary-tool-btn ' + (lapidaryMinigameState.selectedTool === 'hammer' ? 'active' : '') + '" data-action="select-lapidary-tool" data-tool="hammer">🔨 Sonar (Ecos de Falla)</button>' +
      '</div>' +

      // Escenario 3D
      '<div class="lapidary-3d-stage" id="lapidary3DStage">' +
        '<canvas id="lapidary3DCanvas" width="300" height="300" class="lapidary-3d-canvas"></canvas>' +
        '<div class="lapidary-3d-hint-badge">🔄 Arrastra para girar en 3D 360° &bull; Toca para interactuar</div>' +
        '<div class="lapidary-particles-container" id="lapidaryParticles"></div>' +
      '</div>' +

      '<div class="lapidary-meters-row">' +
        '<div class="lapidary-meter-box">' +
          '<span class="lapidary-meter-label">Desbaste Geoda: ' + cleanPct + '% / 75% (' + Math.round(cleanPct) + ' pts)</span>' +
          '<div class="lapidary-meter-track"><div class="lapidary-meter-fill clean" id="lapidaryCleanBar" style="width:' + cleanPct + '%;"></div></div>' +
        '</div>' +
        '<div class="lapidary-meter-box">' +
          '<span class="lapidary-meter-label">Integridad: <b id="lapidaryIntegrityText">' + integrity + '% (' + integrity + ' pts)</b></span>' +
          '<div class="lapidary-meter-track"><div class="lapidary-meter-fill integrity ' + (integrity < 50 ? 'danger' : (integrity < 75 ? 'warning' : '')) + '" id="lapidaryIntegrityBar" style="width:' + integrity + '%;"></div></div>' +
        '</div>' +
      '</div>' +

      '<div class="lapidary-action-footer">' +
        '<button type="button" class="btn-solid-gold lapidary-btn-advance ' + (cleanPct >= 75 ? 'pulse-glow' : '') + '" id="lapidaryBtnPhase2" data-action="advance-to-slide-cuts" ' + (cleanPct >= 75 ? '' : 'disabled') + '>' +
          (cleanPct >= 75 ? '✨ Geoda Desbastada (' + p1Score + ' pts) Avanzar a Sierra de Cortes ➡️' : 'Gira en 3D y descubre facetas seguras (' + safeCleared + '/' + targetClears + ')...') +
        '</button>' +
      '</div>' +
    '</div>';
  }

  // ==========================================
  // FASE 2: SIERRA DIAMANTADA DE ALTA HABILIDAD (Velocidad, Pulso y Nódulos)
  // ==========================================
  else if(lapidaryMinigameState.phase === 2){
    var curSlide = lapidaryMinigameState.slidePoints[lapidaryMinigameState.slidePass - 1] || lapidaryMinigameState.slidePoints[0];
    var livePrecision = lapidaryMinigameState.slidePrecision || 100;
    var liveProgress = Math.round((lapidaryMinigameState.slideProgress || 0) * 100);

    html += '<div class="lapidary-phase-body">' +
      '<div class="lapidary-instructions">' +
        '<b>Fase 2: Sierra Diamantada de Alta Habilidad (Velocidad, Pulso y Nódulos)</b><br>' +
        'Conduce el disco diamantado manteniendo la velocidad en la <b>Zona Óptima (40-110 px/s)</b>. No te detengas (sobrecalienta la gema) ni aceleres en exceso. En los <b>nódulos duros (◆)</b>, reduce la marcha para no rebotar.' +
      '</div>' +

      '<div class="lapidary-mobile-touch-hint">📱 <b>Modo Táctil Cómodo:</b> El disco de corte diamantado se sitúa por encima de tu dedo para que nunca tapes la línea ni los nódulos.</div>' +

      // Tacómetro de Velocidad y Medidor de Calor por Fricción
      '<div class="lapidary-tachometer-wrap">' +
        '<div class="lapidary-tachometer-header">' +
          '<span>VELOCÍMETRO DEL DISCO</span>' +
          '<b id="lapidaryTachoVal">0 px/s [PARADO]</b>' +
        '</div>' +
        '<div class="lapidary-tachometer-track">' +
          '<div class="lapidary-tacho-zone slow" title="Lento (Fricción / Sobrecalentamiento)"></div>' +
          '<div class="lapidary-tacho-zone optimal" title="Zona Óptima de Corte"></div>' +
          '<div class="lapidary-tacho-zone fast" title="Exceso de Velocidad"></div>' +
          '<div class="lapidary-tacho-cursor" id="lapidaryTachoCursor" style="left:0%;"></div>' +
        '</div>' +
        '<div class="lapidary-heat-row">' +
          '<span>🔥 CALOR DE FRICCIÓN:</span>' +
          '<div class="lapidary-heat-track">' +
            '<div class="lapidary-heat-fill" id="lapidaryHeatFill" style="width:0%;"></div>' +
          '</div>' +
          '<span id="lapidaryHeatVal">0%</span>' +
        '</div>' +
      '</div>' +

      // Live HUD con precisión, progreso y puntos en tiempo real
      '<div class="lapidary-live-hud">' +
        '<div class="lapidary-hud-badge precision">' +
          '<span class="hud-label">PRECISIÓN DE CORTE</span>' +
          '<b class="hud-val ' + (livePrecision < 65 ? 'danger' : (livePrecision < 85 ? 'warning' : 'safe')) + '" id="lapidaryLivePrecision">' + livePrecision + '%</b>' +
        '</div>' +
        '<div class="lapidary-hud-badge progress">' +
          '<span class="hud-label">AVANCE DEL CORTE</span>' +
          '<b class="hud-val" id="lapidaryLiveProgress">' + liveProgress + '%</b>' +
        '</div>' +
        '<div class="lapidary-hud-badge points">' +
          '<span class="hud-label">PUNTOS DE CORTE</span>' +
          '<b class="hud-val" id="lapidaryLivePoints">+' + livePrecision + ' pts</b>' +
        '</div>' +
      '</div>' +

      '<div class="lapidary-slide-stage" id="lapidarySlideStage">' +
        '<div class="lapidary-gem-underlay">' +
          '<div class="lapidary-gem-silhouette" style="background:radial-gradient(circle at 40% 40%, ' + family.hex + ' 10%, ' + family.glow + ' 60%, rgba(0,0,0,0.8) 100%);box-shadow:0 0 35px ' + family.glow + ';opacity:0.4;"></div>' +
        '</div>' +
        '<canvas id="lapidarySlideCanvas" width="300" height="300" class="lapidary-slide-canvas"></canvas>' +
        '<div class="lapidary-particles-container" id="lapidarySlideParticles"></div>' +
        '<div class="lapidary-slide-banner hidden" id="lapidarySlideBanner"></div>' +
      '</div>' +

      '<div class="lapidary-slide-header-bar">' +
        '<div class="lapidary-pass-tag">' + esc(curSlide.name) + ' (' + lapidaryMinigameState.slidePass + ' / ' + lapidaryMinigameState.maxSlidePasses + ')</div>' +
        '<div class="lapidary-slide-desc-hint">' + esc(curSlide.desc) + '</div>' +
      '</div>' +

      '<div class="lapidary-hits-summary" style="margin-top:10px;">' +
        '<div class="lapidary-hit-slot ' + (lapidaryMinigameState.slideScores[0] ? 'hit' : '') + '">Corte 1: ' + (lapidaryMinigameState.slideScores[0] ? lapidaryMinigameState.slideScores[0] + '% (' + lapidaryMinigameState.slideScores[0] + ' pts)' : '—') + '</div>' +
        '<div class="lapidary-hit-slot ' + (lapidaryMinigameState.slideScores[1] ? 'hit' : '') + '">Corte 2: ' + (lapidaryMinigameState.slideScores[1] ? lapidaryMinigameState.slideScores[1] + '% (' + lapidaryMinigameState.slideScores[1] + ' pts)' : '—') + '</div>' +
        '<div class="lapidary-hit-slot ' + (lapidaryMinigameState.slideScores[2] ? 'hit' : '') + '">Corte 3: ' + (lapidaryMinigameState.slideScores[2] ? lapidaryMinigameState.slideScores[2] + '% (' + lapidaryMinigameState.slideScores[2] + ' pts)' : '—') + '</div>' +
      '</div>' +

      '<div class="lapidary-action-footer" style="margin-top:14px;">' +
        (lapidaryMinigameState.slidePass > lapidaryMinigameState.maxSlidePasses ?
          '<button type="button" class="btn-solid-gold lapidary-btn-advance pulse-glow" data-action="advance-to-facetting">💎 ¡3 Cortes Concluidos! (' + lapidaryMinigameState.phase2Score + ' pts) Avanzar a Sweet Spot ➡️</button>' :
          '<button type="button" class="btn-compact" disabled style="width:100%;padding:9px;">Conduce la sierra diamantada con pulso y velocidad...</button>'
        ) +
      '</div>' +
    '</div>';
  }

  // ==========================================
  // FASE 3: SWEET SPOT TIMING (Facetado Fino)
  // ==========================================
  else if(lapidaryMinigameState.phase === 3){
    var passTitles = [
      "Paso 1: Desbastado de Cintura y Culet",
      "Paso 2: Facetado de Corona y Aristas",
      "Paso 3: Pulido Fino de la Tabla Superior"
    ];
    var curPassTitle = passTitles[lapidaryMinigameState.timingPass - 1] || "Facetado";

    html += '<div class="lapidary-phase-body">' +
      '<div class="lapidary-instructions">' +
        '<b>Fase 3: Presión y Ritmo en el Sweet Spot</b><br>' +
        'Presiona el gatillo de corte cuando el cursor oscilante cruce la <b>Zona Dorada Central</b>.' +
      '</div>' +

      '<div class="lapidary-timing-stage">' +
        '<div class="lapidary-pass-indicator">' +
          '<span class="lapidary-pass-tag">' + curPassTitle + '</span>' +
          '<span class="lapidary-pass-badge">Paso ' + lapidaryMinigameState.timingPass + ' de ' + lapidaryMinigameState.maxPasses + '</span>' +
        '</div>' +

        '<div class="lapidary-gauge-track" id="lapidaryGaugeTrack">' +
          '<div class="lapidary-sweet-spot" style="left:' + (lapidaryMinigameState.sweetSpotStart * 100) + '%;width:' + ((lapidaryMinigameState.sweetSpotEnd - lapidaryMinigameState.sweetSpotStart) * 100) + '%;">' +
            '<span class="lapidary-sweet-label">SWEET SPOT</span>' +
          '</div>' +
          '<div class="lapidary-gauge-cursor" id="lapidaryGaugeCursor" style="left:' + (lapidaryMinigameState.cursorPos * 100) + '%;"></div>' +
        '</div>' +

        '<div class="lapidary-timing-feedback" id="lapidaryTimingFeedback">Apunta con ritmo...</div>' +

        '<div class="lapidary-hits-summary">' +
          '<div class="lapidary-hit-slot ' + (lapidaryMinigameState.passResults[0] === true ? 'hit' : (lapidaryMinigameState.passResults[0] === false ? 'miss' : '')) + '">Paso 1</div>' +
          '<div class="lapidary-hit-slot ' + (lapidaryMinigameState.passResults[1] === true ? 'hit' : (lapidaryMinigameState.passResults[1] === false ? 'miss' : '')) + '">Paso 2</div>' +
          '<div class="lapidary-hit-slot ' + (lapidaryMinigameState.passResults[2] === true ? 'hit' : (lapidaryMinigameState.passResults[2] === false ? 'miss' : '')) + '">Paso 3</div>' +
        '</div>' +
      '</div>' +

      '<div class="lapidary-action-footer">' +
        (lapidaryMinigameState.timingPass <= lapidaryMinigameState.maxPasses ?
          '<button type="button" class="btn-solid-gold lapidary-btn-cut" data-action="lapidary-trigger-cut">⚡ CORTAR FACETA (' + lapidaryMinigameState.timingPass + '/' + lapidaryMinigameState.maxPasses + ')</button>' :
          '<button type="button" class="btn-solid-gold lapidary-btn-advance pulse-glow" data-action="advance-to-verdict">⚖️ Evaluar Riesgo y Balance de Rotura (Fase 4) ➡️</button>'
        ) +
      '</div>' +
    '</div>';
  }

  // ==========================================
  // FASE 4: RESUMEN, PROBABILIDAD DE ROTURA Y TIRADA
  // ==========================================
  else if(lapidaryMinigameState.phase === 4){
    computeArtisanMasteryAndRisk(c);

    var riskClass = (lapidaryMinigameState.breakRisk <= 10) ? 'safe' : ((lapidaryMinigameState.breakRisk <= 25) ? 'moderate' : 'high-danger');
    var riskLabel = (lapidaryMinigameState.breakRisk <= 10) ? 'Bajo Riesgo (Estructura Estable)' : ((lapidaryMinigameState.breakRisk <= 25) ? 'Riesgo Moderado' : '¡Alto Peligro de Fractura!');

    html += '<div class="lapidary-phase-body">' +
      '<div class="lapidary-instructions">' +
        '<b>Fase 4: Evaluación de Talla y Riesgo de Fractura</b><br>' +
        'Tus 3 fases de artesanía determinan la calidad del facetado y el riesgo de que la gema se rompa.' +
      '</div>' +

      // Grid de Puntuación de las 3 fases
      '<div class="lapidary-score-breakdown-grid">' +
        '<div class="lapidary-score-card">' +
          '<div class="lapidary-score-header"><span>🧹 Desbaste Ganga</span><b>' + lapidaryMinigameState.phase1Score + '% (' + lapidaryMinigameState.phase1Score + ' pts)</b></div>' +
          '<div class="lapidary-mini-meter"><div class="lapidary-mini-meter-fill" style="width:' + lapidaryMinigameState.phase1Score + '%;"></div></div>' +
          '<div class="lapidary-score-sub">Aporte al Balance: +' + Math.round(lapidaryMinigameState.phase1Score * 0.35) + ' pts &bull; ' + (lapidaryMinigameState.fragileHits > 0 ? lapidaryMinigameState.fragileHits + ' fisuras tocadas' : '0 fisuras') + '</div>' +
        '</div>' +

        '<div class="lapidary-score-card">' +
          '<div class="lapidary-score-header"><span>〰️ Cortes de Pulso</span><b>' + lapidaryMinigameState.phase2Score + '% (' + lapidaryMinigameState.phase2Score + ' pts)</b></div>' +
          '<div class="lapidary-mini-meter"><div class="lapidary-mini-meter-fill" style="width:' + lapidaryMinigameState.phase2Score + '%;"></div></div>' +
          '<div class="lapidary-score-sub">Aporte al Balance: +' + Math.round(lapidaryMinigameState.phase2Score * 0.35) + ' pts &bull; Media 3 curvas</div>' +
        '</div>' +

        '<div class="lapidary-score-card">' +
          '<div class="lapidary-score-header"><span>⏱️ Sweet Spot</span><b>' + lapidaryMinigameState.phase3Score + '% (' + lapidaryMinigameState.phase3Score + ' pts)</b></div>' +
          '<div class="lapidary-mini-meter"><div class="lapidary-mini-meter-fill" style="width:' + lapidaryMinigameState.phase3Score + '%;"></div></div>' +
          '<div class="lapidary-score-sub">Aporte al Balance: +' + Math.round(lapidaryMinigameState.phase3Score * 0.30) + ' pts &bull; ' + lapidaryMinigameState.timingHits + ' de 3 aciertos</div>' +
        '</div>' +
      '</div>' +

      // Tarjeta de Riesgo de Rotura (Punto 3 del usuario)
      '<div class="lapidary-risk-card ' + riskClass + '">' +
        '<div class="lapidary-risk-header">' +
          '<span class="lapidary-risk-title">💥 PROBABILIDAD DE ROTURA DE LA GEMA:</span>' +
          '<span class="lapidary-risk-val">' + lapidaryMinigameState.breakRisk + '%</span>' +
        '</div>' +
        '<div class="lapidary-risk-track">' +
          '<div class="lapidary-risk-fill" style="width:' + lapidaryMinigameState.breakRisk + '%;"></div>' +
        '</div>' +
        '<div class="lapidary-risk-desc">' +
          '<b>' + riskLabel + '</b> &bull; Herramienta: ' + esc(tier.name) + ' &bull; Puntuación Total: <b>' + lapidaryMinigameState.totalArtisanScore + ' / 100 pts</b>' +
        '</div>' +
      '</div>' +

      '<div class="lapidary-roll-bonus-badge">' +
        '✨ Bono de Maestría a la Tirada: <b>+' + lapidaryMinigameState.rollBonus + '</b>' +
      '</div>' +

      '<div class="lapidary-action-footer" style="margin-top:14px;">' +
        '<button type="button" class="btn-solid-gold lapidary-btn-roll pulse-glow" data-action="lapidary-launch-roll">' +
          '🎲 Realizar Tirada Final (1d100 Riesgo: ' + lapidaryMinigameState.breakRisk + '% &bull; Tirada D10: +' + (num(c.attrs.inteligencia,1) + (c.skillBonus && c.skillBonus["Piedras mágicas"] ? num(c.skillBonus["Piedras mágicas"],0) : 0) + (tier.bonusRoll || 0) + lapidaryMinigameState.rollBonus) + ')' +
        '</button>' +
      '</div>' +
    '</div>';
  }

  modal.innerHTML = html;
}

/* ==========================================================================
   4. CONTROL DE CANVAS 3D: FASE 1 (GEODA 3D DE INSPECCIÓN Y CINCELADO SELECTIVO)
   ========================================================================== */

function pointInTriangle(px, py, p0, p1, p2){
  var dX = px - p2.px;
  var dY = py - p2.py;
  var dX21 = p2.px - p1.px;
  var dY12 = p1.py - p2.py;
  var D = dY12 * (p0.px - p2.px) + dX21 * (p0.py - p2.py);
  var s = dY12 * dX + dX21 * dY;
  var t = (p2.py - p0.py) * dX + (p0.px - p2.px) * dY;
  if(D < 0) return s <= 0 && t <= 0 && s + t >= D;
  return s >= 0 && t >= 0 && s + t <= D;
}

function draw3DGeode(ctx, w, h, familyHex, familyGlow){
  ctx.clearRect(0, 0, w, h);

  // Fondo sutil de cámara oscura
  var bgGrad = ctx.createRadialGradient(w/2, h/2, 20, w/2, h/2, w/2);
  bgGrad.addColorStop(0, "rgba(28, 22, 16, 0.95)");
  bgGrad.addColorStop(1, "rgba(10, 8, 6, 0.98)");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  var verts = get3DGeodeVertices();
  var cosX = Math.cos(lapidaryMinigameState.geodeRotX);
  var sinX = Math.sin(lapidaryMinigameState.geodeRotX);
  var cosY = Math.cos(lapidaryMinigameState.geodeRotY);
  var sinY = Math.sin(lapidaryMinigameState.geodeRotY);
  var fov = 340;
  var camDist = 330;
  var cx = w / 2;
  var cy = h / 2;

  // Rotar y proyectar los 12 vértices
  var rotVerts = verts.map(function(v){
    // Rotación eje X (pitch)
    var y1 = v.y * cosX - v.z * sinX;
    var z1 = v.y * sinX + v.z * cosX;
    // Rotación eje Y (yaw)
    var x2 = v.x * cosY + z1 * sinY;
    var z2 = -v.x * sinY + z1 * cosY;
    var scale = fov / (camDist - z2);
    return {
      x: x2, y: y1, z: z2,
      px: cx + x2 * scale,
      py: cy + y1 * scale,
      scale: scale
    };
  });

  // Vector de luz direccional (arriba-derecha-frontal)
  var lx = 0.42, ly = -0.65, lz = 0.63;
  var lLen = Math.hypot(lx, ly, lz);
  lx /= lLen; ly /= lLen; lz /= lLen;

  var faces = lapidaryMinigameState.geodeFaces || [];
  var visibleFaces = [];

  for(var i = 0; i < faces.length; i++){
    var face = faces[i];
    var v0 = rotVerts[face.indices[0]];
    var v1 = rotVerts[face.indices[1]];
    var v2 = rotVerts[face.indices[2]];

    // Centroide de la cara en 3D
    var faceCx = (v0.x + v1.x + v2.x) / 3;
    var faceCy = (v0.y + v1.y + v2.y) / 3;
    var faceCz = (v0.z + v1.z + v2.z) / 3;

    // Normal en 3D: (v1 - v0) x (v2 - v0)
    var ax = v1.x - v0.x, ay = v1.y - v0.y, az = v1.z - v0.z;
    var bx = v2.x - v0.x, by = v2.y - v0.y, bz = v2.z - v0.z;
    var nx = ay * bz - az * by;
    var ny = az * bx - ax * bz;
    var nz = ax * by - ay * bx;

    // Alinear vector normal para que apunte hacia el exterior de la geoda
    var dotC = nx * faceCx + ny * faceCy + nz * faceCz;
    if(dotC < 0){ nx = -nx; ny = -ny; nz = -nz; }
    var nLen = Math.hypot(nx, ny, nz) || 1;
    nx /= nLen; ny /= nLen; nz /= nLen;

    // Backface culling: solo caras orientadas hacia la cámara (nz > 0)
    if(nz > 0.05){
      var dotL = nx * lx + ny * ly + nz * lz;
      var light = Math.max(0.18, Math.min(1.0, 0.32 + 0.68 * dotL));
      visibleFaces.push({
        face: face,
        v0: v0, v1: v1, v2: v2,
        avgZ: faceCz,
        light: light,
        normZ: nz,
        screenCx: (v0.px + v1.px + v2.px) / 3,
        screenCy: (v0.py + v1.py + v2.py) / 3
      });
    }
  }

  // Ordenar de fondo a frente (Painter's algorithm)
  visibleFaces.sort(function(a, b){ return a.avgZ - b.avgZ; });

  // Guardar caras visibles proyectadas para raycasting de clics
  lapidaryMinigameState._visibleFaces2D = visibleFaces;

  // Dibujar cada cara poligonal
  for(var f = 0; f < visibleFaces.length; f++){
    var vf = visibleFaces[f];
    var fData = vf.face;
    var p0 = vf.v0, p1 = vf.v1, p2 = vf.v2;

    ctx.beginPath();
    ctx.moveTo(p0.px, p0.py);
    ctx.lineTo(p1.px, p1.py);
    ctx.lineTo(p2.px, p2.py);
    ctx.closePath();

    if(fData.cleared){
      // Faceta de cristal mágica expuesta (Luminosa y facetada)
      var fGrad = ctx.createRadialGradient(vf.screenCx - 6, vf.screenCy - 6, 2, vf.screenCx, vf.screenCy, 40);
      fGrad.addColorStop(0, "#FFFFFF");
      fGrad.addColorStop(0.3, familyHex || "#DEC392");
      fGrad.addColorStop(1, "rgba(18, 14, 10, 0.95)");
      ctx.fillStyle = fGrad;
      ctx.fill();

      // Bisel reflectante dorado/cristalino
      ctx.strokeStyle = familyHex || "#FDE047";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Brillo interno en arista
      ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p0.px, p0.py);
      ctx.lineTo(p1.px, p1.py);
      ctx.stroke();

      // Placa central con indicador numérico Buscaminas (Peligro de 0 a 2)
      var dCount = fData.dangerCount || 0;
      ctx.beginPath();
      ctx.arc(vf.screenCx, vf.screenCy, 9, 0, Math.PI * 2);
      if(dCount === 0){
        ctx.fillStyle = "rgba(16, 185, 129, 0.9)";
        ctx.strokeStyle = "#A7F3D0";
      } else if(dCount === 1){
        ctx.fillStyle = "rgba(245, 158, 11, 0.92)";
        ctx.strokeStyle = "#FEF08A";
      } else {
        ctx.fillStyle = "rgba(239, 68, 68, 0.95)";
        ctx.strokeStyle = "#FECACA";
      }
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(dCount === 0 ? "·" : dCount, vf.screenCx, vf.screenCy);
    } else {
      if(fData.flagged){
        // Faceta protegida con bandera 🚩
        var l = vf.light;
        var r = Math.round(55 * l + 20);
        var g = Math.round(45 * l + 15);
        var b = Math.round(40 * l + 12);
        ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
        ctx.fill();

        ctx.strokeStyle = "#EF4444";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Placa roja carmesí con bandera
        ctx.beginPath();
        ctx.arc(vf.screenCx, vf.screenCy, 12, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(185, 28, 28, 0.92)";
        ctx.strokeStyle = "#FCA5A5";
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🚩", vf.screenCx, vf.screenCy);
      } else if(fData.struck){
        // Fisura fracturada revelada tras el golpe erróneo
        var fissGrad = ctx.createRadialGradient(vf.screenCx, vf.screenCy, 4, vf.screenCx, vf.screenCy, 36);
        fissGrad.addColorStop(0, "rgba(239, 68, 68, 0.95)");
        fissGrad.addColorStop(0.6, "rgba(185, 28, 28, 0.85)");
        fissGrad.addColorStop(1, "#280A0A");
        ctx.fillStyle = fissGrad;
        ctx.fill();

        ctx.strokeStyle = "#FCA5A5";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.strokeStyle = "#FEE2E2";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(vf.screenCx - 14, vf.screenCy - 8);
        ctx.lineTo(vf.screenCx - 2, vf.screenCy + 4);
        ctx.lineTo(vf.screenCx + 12, vf.screenCy - 6);
        ctx.lineTo(vf.screenCx + 16, vf.screenCy + 10);
        ctx.stroke();

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("⚠️ ROTURA", vf.screenCx, vf.screenCy);
      } else {
        // Ganga basáltica rugosa con sombreado de luz 3D
        var l = vf.light;
        var r = Math.round(74 * l + 22);
        var g = Math.round(62 * l + 18);
        var b = Math.round(50 * l + 14);
        ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
        ctx.fill();

        // Aristas de roca con relieve
        ctx.strokeStyle = "rgba(18, 13, 9, 0.85)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Relieve e incisión mineral
        ctx.strokeStyle = "rgba(176, 141, 87, " + (0.35 * vf.normZ).toFixed(2) + ")";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p0.px, p0.py);
        ctx.lineTo(vf.screenCx, vf.screenCy);
        ctx.stroke();

        // Icono interactivo según herramienta geológica activa
        var tool = lapidaryMinigameState.selectedTool || 'chisel';
        var toolIcon = (tool === 'flag') ? "🚩" : ((tool === 'hammer') ? "🔨" : "⛏️");
        var toolColor = (tool === 'flag') ? "rgba(239, 68, 68, 0.6)" : ((tool === 'hammer') ? "rgba(147, 197, 253, 0.7)" : "rgba(222, 195, 146, 0.7)");
        ctx.fillStyle = toolColor;
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(toolIcon, vf.screenCx, vf.screenCy);
      }
    }
  }

  // Resplandor central de energía mágica interna si hay caras despejadas
  var safeCleared = (lapidaryMinigameState.geodeFaces || []).filter(function(f){ return f.cleared; }).length;
  if(safeCleared > 0){
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    var aura = ctx.createRadialGradient(cx, cy, 10, cx, cy, 95);
    aura.addColorStop(0, familyGlow || "rgba(222, 195, 146, 0.4)");
    aura.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(cx, cy, 95, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function handle3DGeodeClick(clientX, clientY){
  var canvas = document.getElementById("lapidary3DCanvas");
  if(!canvas) return;
  var rect = canvas.getBoundingClientRect();
  var scaleX = canvas.width / rect.width;
  var scaleY = canvas.height / rect.height;
  var px = (clientX - rect.left) * scaleX;
  var py = (clientY - rect.top) * scaleY;
  var stageX = clientX - rect.left;
  var stageY = clientY - rect.top;

  var visibleFaces = lapidaryMinigameState._visibleFaces2D || [];
  // Raycast de adelante hacia atrás (últimos dibujados son los más cercanos)
  var hitFace = null;
  for(var i = visibleFaces.length - 1; i >= 0; i--){
    var vf = visibleFaces[i];
    if(pointInTriangle(px, py, vf.v0, vf.v1, vf.v2)){
      hitFace = vf;
      break;
    }
  }

  if(!hitFace) return;

  var face = hitFace.face;
  var tool = lapidaryMinigameState.selectedTool || 'chisel';

  // 1. HERRAMIENTA: 🚩 BANDERA (Proteger o desproteger faceta)
  if(tool === 'flag'){
    if(face.cleared){
      showToast("Esta faceta ya ha sido tallada y pulida.", "info");
      return;
    }
    face.flagged = !face.flagged;
    if(face.flagged){
      playGemFractureTick();
      if(typeof triggerBg3Haptic === "function") triggerBg3Haptic("light");
      spawnFloatingScore(stageX, stageY, "🚩 MARCADA", false);
    } else {
      spawnFloatingScore(stageX, stageY, "🏳️ DESMARCADA", false);
    }
    update3DGeodeHUD();
    return;
  }

  // 2. HERRAMIENTA: 🔨 SONAR ACÚSTICO (Auscultación sin riesgo de rotura)
  if(tool === 'hammer'){
    if(face.cleared){
      showToast("Faceta limpia. No hay ganga para auscultar.", "info");
      return;
    }
    playLapidaryHeavyHammer();
    if(typeof triggerBg3Haptic === "function") triggerBg3Haptic("light");
    spawnRockDustParticles(stageX, stageY);

    if(face.type === 'fissure'){
      spawnDangerParticles(stageX, stageY);
      spawnFloatingScore(stageX, stageY, "🚨 ¡ECO DISONANTE! (FALLA)", true);
      showToast("🔨 Sonar: ¡Vibración fracturaria aguda! Falla crítica oculta bajo este basalto.", "warning");
    } else if(face.dangerCount === 0){
      spawnFloatingScore(stageX, stageY, "🎶 RESONANCIA PURA (0 FALLAS)", false);
      showToast("🔨 Sonar: Tono armónico puro y cristalino. La roca circundante es 100% segura.", "info");
    } else if(face.dangerCount === 1){
      spawnFloatingScore(stageX, stageY, "⚠️ ECO OPACO (1 FALLA)", true);
      showToast("🔨 Sonar: Tono seco y apagado. Hay 1 fisura vecina oculta en el sector.", "warning");
    } else {
      spawnFloatingScore(stageX, stageY, "🚨 ECO HUECO (2 FALLAS)", true);
      showToast("🔨 Sonar: Resonancia hueca y vibrante. ¡Zona peligrosa con 2 fisuras vecinas!", "danger");
    }
    return;
  }

  // 3. HERRAMIENTA: ⛏️ CINCEL (Revelar Faceta / Desbastar)
  if(face.flagged){
    showToast("🚫 Faceta protegida con bandera 🚩. Desmárcala si deseas cincelarla.", "warning");
    spawnFloatingScore(stageX, stageY, "PROTEGIDA 🚩", false);
    return;
  }
  if(face.cleared) return;

  if(face.type === 'fissure'){
    // Golpe accidental en fisura crítica
    var now = Date.now();
    if(now - (lapidaryMinigameState.lastFissureHit || 0) > 280){
      lapidaryMinigameState.lastFissureHit = now;
      lapidaryMinigameState.fragileHits++;
      face.struck = true;
      playGemFractureTick();
      if(typeof triggerBg3Haptic === "function") triggerBg3Haptic("fumble");
      spawnDangerParticles(stageX, stageY);
      spawnFloatingScore(stageX, stageY, "-25% INTEGRIDAD", true);

      var stageEl = document.getElementById("lapidary3DStage");
      if(stageEl){
        stageEl.classList.add("danger-flash");
        setTimeout(function(){ if(stageEl) stageEl.classList.remove("danger-flash"); }, 240);
      }
      update3DGeodeHUD();
    }
    return;
  }

  // Ganga basáltica sana
  playLapidaryChiselStrike();
  if(typeof triggerBg3Haptic === "function") triggerBg3Haptic("light");
  spawnRockDustParticles(stageX, stageY);
  spawnFlyingRockDebris(stageX, stageY);

  if(face.dangerCount === 0){
    // Cascada de despeje seguro (Minesweeper cascade)
    cascadeClearSafeFaces(face.id - 1);
    playGemSweetSpotHit();
    spawnFloatingScore(stageX, stageY, "✨ ¡CASCADA CRISTALINA!", false);
  } else {
    face.cleared = true;
    spawnFloatingScore(stageX, stageY, "+10 pts [Peligro: " + face.dangerCount + "]", false);
  }

  update3DGeodeHUD();
}

function update3DGeodeHUD(){
  var faces = lapidaryMinigameState.geodeFaces || [];
  var gangueFaces = faces.filter(function(f){ return f.type === 'gangue'; });
  var safeCleared = gangueFaces.filter(function(f){ return f.cleared; }).length;
  var targetClears = 12; // 75%
  var cleanPct = Math.min(100, Math.round((safeCleared / targetClears) * 100));
  var integrity = Math.max(0, 100 - (lapidaryMinigameState.fragileHits * 25));

  var flaggedCount = faces.filter(function(f){ return f.flagged; }).length;
  var correctlyFlagged = faces.filter(function(f){ return f.flagged && f.type === 'fissure'; }).length;
  var minesweeperBonus = (correctlyFlagged === 4 && flaggedCount === 4) ? 15 : 0;

  var p1Score = Math.max(0, Math.min(100, Math.round((cleanPct * 0.6) + (integrity * 0.4)) + minesweeperBonus));

  lapidaryMinigameState.cleanPct = cleanPct;
  lapidaryMinigameState.phase1Score = p1Score;

  var hudClean = document.getElementById("lapidaryHudClean");
  var hudIntegrity = document.getElementById("lapidaryHudIntegrity");
  var hudFlags = document.getElementById("lapidaryHudFlags");
  var hudPhase1Score = document.getElementById("lapidaryHudPhase1Score");
  var cleanBar = document.getElementById("lapidaryCleanBar");
  var integBar = document.getElementById("lapidaryIntegrityBar");
  var integTxt = document.getElementById("lapidaryIntegrityText");
  var btn = document.getElementById("lapidaryBtnPhase2");

  if(hudClean){
    hudClean.textContent = safeCleared + " / " + targetClears + " (" + cleanPct + "%)";
    hudClean.className = "hud-val " + (cleanPct >= 75 ? "safe" : "warning");
  }
  if(hudIntegrity){
    hudIntegrity.textContent = integrity + "% (" + integrity + " pts)";
    hudIntegrity.className = "hud-val " + (integrity < 50 ? "danger" : (integrity < 75 ? "warning" : "safe"));
  }
  if(hudFlags){
    hudFlags.textContent = flaggedCount + " / 4" + (minesweeperBonus > 0 ? " ✨ (+15)" : "");
    hudFlags.style.color = (minesweeperBonus > 0) ? "#34D399" : "#FCA5A5";
  }
  if(hudPhase1Score){
    hudPhase1Score.textContent = p1Score + " pts";
  }
  if(cleanBar){
    cleanBar.style.width = cleanPct + "%";
  }
  if(integBar){
    integBar.style.width = integrity + "%";
    integBar.className = "lapidary-meter-fill integrity " + (integrity < 50 ? "danger" : (integrity < 75 ? "warning" : ""));
  }
  if(integTxt){
    integTxt.innerHTML = integrity + "% (" + integrity + " pts)";
  }

  if(cleanPct >= 75 && btn && btn.disabled){
    btn.disabled = false;
    btn.textContent = "✨ Geoda Desbastada (" + p1Score + " pts" + (minesweeperBonus > 0 ? " +15 Bono Lógico" : "") + ") Avanzar a Sierra de Cortes ➡️";
    btn.classList.add("pulse-glow");
    playGemSweetSpotHit();
    if(typeof triggerBg3Haptic === "function") triggerBg3Haptic("crit");
  }
}

function initLapidary3DGeodeStage(){
  var canvas = document.getElementById("lapidary3DCanvas");
  if(!canvas) return;
  var ctx = canvas.getContext("2d");
  if(!ctx) return;

  var c = (state.characters || []).find(function(ch){ return ch.id === lapidaryMinigameState.charId; });
  var stone = c ? (c.stones || []).find(function(st){ return st.id === lapidaryMinigameState.stoneId; }) : null;
  var family = getStoneFamily(stone ? stone.color : "blanca");

  var isPointerDown = false;
  var startX = 0, startY = 0;
  var lastX = 0, lastY = 0;
  var totalDragDist = 0;

  function renderLoop(){
    if(!lapidaryMinigameState.active || lapidaryMinigameState.phase !== 1){
      return;
    }

    // Auto-rotación sutil cuando el usuario no está arrastrando activamente
    if(!isPointerDown){
      lapidaryMinigameState.geodeRotY += 0.0035;
    }

    draw3DGeode(ctx, canvas.width, canvas.height, family.hex, family.glow);
    lapidaryMinigameState.geodeAnimId = requestAnimationFrame(renderLoop);
  }

  if(lapidaryMinigameState.geodeAnimId){
    cancelAnimationFrame(lapidaryMinigameState.geodeAnimId);
  }
  lapidaryMinigameState.geodeAnimId = requestAnimationFrame(renderLoop);
  update3DGeodeHUD();

  // Gestión de Arrastre 3D vs Clic / Toque
  canvas.onmousedown = function(e){
    isPointerDown = true;
    startX = e.clientX; startY = e.clientY;
    lastX = e.clientX;  lastY = e.clientY;
    totalDragDist = 0;
  };

  window.onmousemove = function(e){
    if(!isPointerDown || !lapidaryMinigameState.active || lapidaryMinigameState.phase !== 1) return;
    var dx = e.clientX - lastX;
    var dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    totalDragDist += Math.hypot(dx, dy);

    // Órbita 3D suave
    lapidaryMinigameState.geodeRotY += dx * 0.013;
    lapidaryMinigameState.geodeRotX += dy * 0.013;
  };

  window.onmouseup = function(e){
    if(!isPointerDown) return;
    isPointerDown = false;
    // Si el movimiento total fue mínimo (< 7px), se trata de un clic intencional de fractura
    if(totalDragDist < 7 && e){
      handle3DGeodeClick(e.clientX, e.clientY);
    }
  };

  // Soporte táctil móvil (Touch)
  canvas.ontouchstart = function(e){
    if(e.touches && e.touches[0]){
      isPointerDown = true;
      startX = e.touches[0].clientX; startY = e.touches[0].clientY;
      lastX = e.touches[0].clientX;  lastY = e.touches[0].clientY;
      totalDragDist = 0;
    }
    e.preventDefault();
  };

  canvas.ontouchmove = function(e){
    if(!isPointerDown || !e.touches || !e.touches[0]) return;
    var dx = e.touches[0].clientX - lastX;
    var dy = e.touches[0].clientY - lastY;
    lastX = e.touches[0].clientX;
    lastY = e.touches[0].clientY;
    totalDragDist += Math.hypot(dx, dy);

    lapidaryMinigameState.geodeRotY += dx * 0.013;
    lapidaryMinigameState.geodeRotX += dy * 0.013;
    e.preventDefault();
  };

  canvas.ontouchend = function(){
    if(!isPointerDown) return;
    isPointerDown = false;
    if(totalDragDist < 7){
      handle3DGeodeClick(lastX, lastY);
    }
  };
}

function spawnFloatingScore(x, y, text, isDanger){
  var stage = document.getElementById("lapidary3DStage") || document.getElementById("lapidarySlideStage");
  if(!stage) return;

  var el = document.createElement("div");
  el.className = "lapidary-float-score " + (isDanger ? "danger" : "bonus");
  el.textContent = text;
  el.style.left = Math.max(10, Math.min(240, x - 35)) + "px";
  el.style.top = Math.max(10, Math.min(240, y - 25)) + "px";
  stage.appendChild(el);

  setTimeout(function(){
    if(el.parentNode) el.parentNode.removeChild(el);
  }, 780);
}

function spawnFlyingRockDebris(x, y){
  var container = document.getElementById("lapidaryParticles") || document.getElementById("lapidary3DStage");
  if(!container) return;

  for(var i = 0; i < 7; i++){
    var chunk = document.createElement("div");
    chunk.className = "lapidary-rock-chunk";
    var size = 6 + Math.floor(Math.random() * 8);
    chunk.style.width = size + "px";
    chunk.style.height = size + "px";
    chunk.style.left = x + "px";
    chunk.style.top = y + "px";

    var angle = Math.random() * Math.PI * 2;
    var dist = 25 + Math.random() * 55;
    var tx = Math.cos(angle) * dist;
    var ty = Math.sin(angle) * dist - 15;
    var rot = (Math.random() - 0.5) * 540;

    chunk.style.setProperty("--tx", tx + "px");
    chunk.style.setProperty("--ty", ty + "px");
    chunk.style.setProperty("--rot", rot + "deg");

    container.appendChild(chunk);

    setTimeout((function(el){
      return function(){ if(el.parentNode) el.parentNode.removeChild(el); };
    })(chunk), 650);
  }
}

function spawnDangerParticles(x, y){
  var container = document.getElementById("lapidaryParticles") || document.getElementById("lapidary3DStage");
  if(!container) return;

  for(var i = 0; i < 6; i++){
    var p = document.createElement("div");
    p.className = "lapidary-danger-particle";
    p.style.left = (x + (Math.random() - 0.5) * 24) + "px";
    p.style.top = (y + (Math.random() - 0.5) * 24) + "px";
    container.appendChild(p);

    setTimeout((function(el){
      return function(){ if(el.parentNode) el.parentNode.removeChild(el); };
    })(p), 450);
  }
}

function spawnRockDustParticles(x, y){
  var container = document.getElementById("lapidaryParticles");
  if(!container) return;

  for(var i = 0; i < 3; i++){
    var p = document.createElement("div");
    p.className = "lapidary-dust-particle";
    p.style.left = (x + (Math.random() - 0.5) * 20) + "px";
    p.style.top = (y + (Math.random() - 0.5) * 20) + "px";
    var size = 2 + Math.random() * 4;
    p.style.width = size + "px";
    p.style.height = size + "px";
    container.appendChild(p);

    setTimeout((function(el){
      return function(){ if(el.parentNode) el.parentNode.removeChild(el); };
    })(p), 450);
  }
}

/* ==========================================================================
   5. CONTROL DE SLIDES: FASE 2 (SIERRA DIAMANTADA DE ALTA HABILIDAD)
   ========================================================================== */

function drawSlideGuide(ctx, slide, userPt){
  var w = ctx.canvas.width;
  var h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);

  var wps = slide.waypoints || [
    { x: slide.x1, y: slide.y1 },
    { x: slide.x2, y: slide.y2 }
  ];
  if(wps.length < 2) return;

  var corridorWidth = (slide.tolerance || 8) * 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Resplandor exterior del canal de corte
  ctx.strokeStyle = "rgba(176, 141, 87, 0.15)";
  ctx.lineWidth = corridorWidth + 8;
  ctx.beginPath();
  ctx.moveTo(wps[0].x, wps[0].y);
  for(var i = 1; i < wps.length; i++) ctx.lineTo(wps[i].x, wps[i].y);
  ctx.stroke();

  // Tubo del canal con ranura guía estrecha (Tolerancia crítica de 8px)
  ctx.strokeStyle = "rgba(176, 141, 87, 0.35)";
  ctx.lineWidth = corridorWidth;
  ctx.beginPath();
  ctx.moveTo(wps[0].x, wps[0].y);
  for(var j = 1; j < wps.length; j++) ctx.lineTo(wps[j].x, wps[j].y);
  ctx.stroke();

  // Línea central de corte diamantado
  ctx.strokeStyle = "rgba(253, 224, 71, 0.65)";
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(wps[0].x, wps[0].y);
  for(var k = 1; k < wps.length; k++) ctx.lineTo(wps[k].x, wps[k].y);
  ctx.stroke();
  ctx.setLineDash([]);

  // Trazo recorrido por el usuario (Verde óptimo / Rojo desvío / Azul lento)
  var userTrail = lapidaryMinigameState.traveledPoints || [];
  if(userTrail.length > 1){
    ctx.lineWidth = 3.5;
    for(var u = 1; u < userTrail.length; u++){
      var pA = userTrail[u - 1];
      var pB = userTrail[u];
      ctx.strokeStyle = pB.isDeviating ? "#EF4444" : (pB.isSlow ? "#60A5FA" : "#10B981");
      ctx.beginPath();
      ctx.moveTo(pA.x, pA.y);
      ctx.lineTo(pB.x, pB.y);
      ctx.stroke();
    }
  }

  // Nódulos de dureza mineral (◆) a lo largo de la curva
  var inclusions = slide.inclusions || [];
  var totalSegments = wps.length - 1;
  for(var incIdx = 0; incIdx < inclusions.length; incIdx++){
    var incT = inclusions[incIdx]; // e.g. 0.35
    var segFloat = incT * totalSegments;
    var segIdx = Math.min(totalSegments - 1, Math.floor(segFloat));
    var segFraction = segFloat - segIdx;
    var pStart = wps[segIdx];
    var pEnd = wps[segIdx + 1];
    var incX = pStart.x + (pEnd.x - pStart.x) * segFraction;
    var incY = pStart.y + (pEnd.y - pStart.y) * segFraction;

    var isCleared = (lapidaryMinigameState.clearedInclusions || []).indexOf(incIdx) !== -1;

    ctx.save();
    ctx.translate(incX, incY);
    ctx.rotate(Math.PI / 4);

    if(isCleared){
      // Nódulo pulverizado exitosamente
      ctx.fillStyle = "rgba(16, 185, 129, 0.3)";
      ctx.strokeStyle = "#10B981";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-6, -6, 12, 12);
      ctx.fillRect(-6, -6, 12, 12);
    } else {
      // Nódulo activo que requiere desacelerar
      ctx.fillStyle = "#F59E0B";
      ctx.shadowColor = "#F59E0B";
      ctx.shadowBlur = 10;
      ctx.fillRect(-7, -7, 14, 14);
      ctx.strokeStyle = "#FEF3C7";
      ctx.lineWidth = 2;
      ctx.strokeRect(-7, -7, 14, 14);
    }
    ctx.restore();

    // Etiqueta del nódulo
    ctx.fillStyle = isCleared ? "#10B981" : "#FDE047";
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "center";
    ctx.fillText(isCleared ? "✓ CORTADO" : "◆ NÓDULO (LENTO)", incX, incY - 14);
  }

  // Nodo Inicio (Esmeralda)
  var start = wps[0];
  ctx.fillStyle = "#10B981";
  ctx.beginPath();
  ctx.arc(start.x, start.y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#A7F3D0";
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 9px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("INICIO", start.x, start.y);

  // Nodo Meta (Ámbar)
  var finish = wps[wps.length - 1];
  ctx.fillStyle = "#F59E0B";
  ctx.beginPath();
  ctx.arc(finish.x, finish.y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#FEF08A";
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = "#120D0A";
  ctx.fillText("META", finish.x, finish.y);

  // Retícula y disco de sierra diamantada en la punta del cursor
  if(userPt && lapidaryMinigameState.currentSlideActive){
    // Modo táctil: dibujar rayo guía y halo indicador para que el dedo nunca tape el corte
    if(lapidaryMinigameState.isTouchCutting && lapidaryMinigameState.touchFingerPt){
      var finger = lapidaryMinigameState.touchFingerPt;
      ctx.save();
      // 1. Halo táctil donde apoya la yema del dedo
      ctx.strokeStyle = "rgba(110, 231, 183, 0.45)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(finger.x, finger.y, 22, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Haz láser conector que asciende 42px hacia la cuchilla diamantada
      ctx.strokeStyle = "rgba(110, 231, 183, 0.85)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(finger.x, finger.y - 10);
      ctx.lineTo(userPt.x, userPt.y + 11);
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. Indicador central táctil
      ctx.fillStyle = "#6EE7B7";
      ctx.beginPath();
      ctx.arc(finger.x, finger.y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(110, 231, 183, 0.9)";
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "center";
      ctx.fillText("👆 DEDO", finger.x, finger.y + 15);
      ctx.restore();
    }

    var isDev = (lapidaryMinigameState.lastDeviated === true);
    var spd = lapidaryMinigameState.sawSpeed || 0;
    var sawColor = isDev ? "#EF4444" : (spd < 35 ? "#60A5FA" : (spd <= 115 ? "#10B981" : "#EF4444"));

    // Disco giratorio de sierra
    ctx.save();
    ctx.translate(userPt.x, userPt.y);
    var bladeAngle = (Date.now() / 40) % (Math.PI * 2);
    ctx.rotate(bladeAngle);

    ctx.strokeStyle = sawColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.stroke();

    // Dientes del disco diamantado
    for(var t = 0; t < 6; t++){
      var a = (t / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 7, Math.sin(a) * 7);
      ctx.lineTo(Math.cos(a) * 11, Math.sin(a) * 11);
      ctx.stroke();
    }
    ctx.restore();

    // Retícula central
    ctx.strokeStyle = sawColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(userPt.x - 14, userPt.y); ctx.lineTo(userPt.x + 14, userPt.y);
    ctx.moveTo(userPt.x, userPt.y - 14); ctx.lineTo(userPt.x, userPt.y + 14);
    ctx.stroke();
  }
}

function updateLiveSlideHUD(precision, progress, sawSpeed, frictionHeat){
  var precEl = document.getElementById("lapidaryLivePrecision");
  var progEl = document.getElementById("lapidaryLiveProgress");
  var ptsEl = document.getElementById("lapidaryLivePoints");
  var tachoCursor = document.getElementById("lapidaryTachoCursor");
  var tachoVal = document.getElementById("lapidaryTachoVal");
  var heatFill = document.getElementById("lapidaryHeatFill");
  var heatVal = document.getElementById("lapidaryHeatVal");

  var progPct = Math.round(progress * 100);

  if(precEl){
    precEl.textContent = precision + "%";
    precEl.className = "hud-val " + (precision < 65 ? "danger" : (precision < 85 ? "warning" : "safe"));
  }
  if(progEl){
    progEl.textContent = progPct + "%";
  }
  if(ptsEl){
    ptsEl.textContent = "+" + precision + " pts";
  }

  // Tacómetro (0 a 180 px/s mapeado al track)
  var curSpeed = Math.round(sawSpeed || 0);
  if(tachoCursor){
    var tachoPct = Math.max(0, Math.min(100, (curSpeed / 160) * 100));
    tachoCursor.style.left = tachoPct + "%";
  }
  if(tachoVal){
    if(curSpeed < 15){
      tachoVal.textContent = curSpeed + " px/s [PARADO]";
      tachoVal.style.color = "#9CA3AF";
    } else if(curSpeed < 40){
      tachoVal.textContent = curSpeed + " px/s [LENTO - FRICCIÓN]";
      tachoVal.style.color = "#60A5FA";
    } else if(curSpeed <= 110){
      tachoVal.textContent = curSpeed + " px/s [ÓPTIMO ✨]";
      tachoVal.style.color = "#10B981";
    } else {
      tachoVal.textContent = curSpeed + " px/s [¡EXCESO DE VELOCIDAD!]";
      tachoVal.style.color = "#EF4444";
    }
  }

  // Calor de Fricción
  var curHeat = Math.round(frictionHeat || 0);
  if(heatFill){
    heatFill.style.width = curHeat + "%";
    if(curHeat > 75){
      heatFill.classList.add("critical");
    } else {
      heatFill.classList.remove("critical");
    }
  }
  if(heatVal){
    heatVal.textContent = curHeat + "%";
    heatVal.style.color = curHeat > 75 ? "#EF4444" : "#DEC392";
  }
}

function initLapidarySlideStage(){
  // Detener cualquier animación 3D previa
  if(lapidaryMinigameState.geodeAnimId){
    cancelAnimationFrame(lapidaryMinigameState.geodeAnimId);
    lapidaryMinigameState.geodeAnimId = null;
  }

  var canvas = document.getElementById("lapidarySlideCanvas");
  if(!canvas) return;
  var ctx = canvas.getContext("2d");
  if(!ctx) return;

  var curSlide = lapidaryMinigameState.slidePoints[lapidaryMinigameState.slidePass - 1] || lapidaryMinigameState.slidePoints[0];
  lapidaryMinigameState.currentSlideActive = false;
  lapidaryMinigameState.slideSamples = 0;
  lapidaryMinigameState.slideDeviations = 0;
  lapidaryMinigameState.slideProgress = 0;
  lapidaryMinigameState.slidePrecision = 100;
  lapidaryMinigameState.traveledPoints = [];
  lapidaryMinigameState.pathProgressIdx = 0;
  lapidaryMinigameState.lastSawPos = null;
  lapidaryMinigameState.lastSawTime = 0;
  lapidaryMinigameState.sawSpeed = 0;
  lapidaryMinigameState.frictionHeat = 0;
  lapidaryMinigameState.clearedInclusions = [];
  lapidaryMinigameState.lastDeviated = false;

  var banner = document.getElementById("lapidarySlideBanner");
  if(banner) banner.classList.add("hidden");

  drawSlideGuide(ctx, curSlide, null);
  updateLiveSlideHUD(100, 0, 0, 0);

  function getCanvasCoords(clientX, clientY, isTouch){
    var rect = canvas.getBoundingClientRect();
    var x = (clientX - rect.left) * (canvas.width / rect.width);
    var rawY = (clientY - rect.top) * (canvas.height / rect.height);
    var y = rawY;
    if(isTouch){
      // Elevar la cuchilla diamantada 42px por encima del dedo para visión total
      y = rawY - 42;
      lapidaryMinigameState.isTouchCutting = true;
      lapidaryMinigameState.touchFingerPt = { x: x, y: rawY };
    } else {
      lapidaryMinigameState.isTouchCutting = false;
      lapidaryMinigameState.touchFingerPt = null;
    }
    return { x: x, y: y };
  }

  function handleSlideStart(clientX, clientY, isTouch){
    var pt = getCanvasCoords(clientX, clientY, isTouch);
    var wps = curSlide.waypoints || [{ x: curSlide.x1, y: curSlide.y1 }, { x: curSlide.x2, y: curSlide.y2 }];
    var start = wps[0];
    var dStart = Math.hypot(pt.x - start.x, pt.y - start.y);
    var snapRadius = isTouch ? 42 : 30;

    if(dStart <= snapRadius){
      lapidaryMinigameState.currentSlideActive = true;
      lapidaryMinigameState.slideSamples = 0;
      lapidaryMinigameState.slideDeviations = 0;
      lapidaryMinigameState.slideProgress = 0;
      lapidaryMinigameState.slidePrecision = 100;
      lapidaryMinigameState.traveledPoints = [{ x: start.x, y: start.y, isDeviating: false, isSlow: false }];
      lapidaryMinigameState.pathProgressIdx = 0;
      lapidaryMinigameState.lastSawPos = pt;
      lapidaryMinigameState.lastSawTime = performance.now();
      lapidaryMinigameState.sawSpeed = 45;
      lapidaryMinigameState.frictionHeat = 0;
      lapidaryMinigameState.clearedInclusions = [];
      lapidaryMinigameState.lastDeviated = false;

      playSlideCutWhir();
      drawSlideGuide(ctx, curSlide, pt);
      updateLiveSlideHUD(100, 0, 45, 0);
    }
  }

  function handleSlideMove(clientX, clientY, isTouch){
    if(!lapidaryMinigameState.currentSlideActive) return;
    var pt = getCanvasCoords(clientX, clientY, isTouch);
    var wps = curSlide.waypoints || [{ x: curSlide.x1, y: curSlide.y1 }, { x: curSlide.x2, y: curSlide.y2 }];
    var totalSegments = wps.length - 1;

    // 1. Cálculo de velocidad instantánea (px/s)
    var now = performance.now();
    var dt = (now - (lapidaryMinigameState.lastSawTime || now)) / 1000;
    if(dt > 0.012 && lapidaryMinigameState.lastSawPos){
      var dDist = Math.hypot(pt.x - lapidaryMinigameState.lastSawPos.x, pt.y - lapidaryMinigameState.lastSawPos.y);
      var instantSpeed = dDist / dt;
      lapidaryMinigameState.sawSpeed = (lapidaryMinigameState.sawSpeed * 0.6) + (instantSpeed * 0.4);
    }
    lapidaryMinigameState.lastSawPos = pt;
    lapidaryMinigameState.lastSawTime = now;
    var spd = lapidaryMinigameState.sawSpeed;

    // 2. Modulación de calor por fricción
    if(spd < 30){
      lapidaryMinigameState.frictionHeat = Math.min(100, lapidaryMinigameState.frictionHeat + 2.2);
    } else if(spd >= 40 && spd <= 110){
      lapidaryMinigameState.frictionHeat = Math.max(0, lapidaryMinigameState.frictionHeat - 2.8);
    }

    // Sobrecalentamiento crítico
    if(lapidaryMinigameState.frictionHeat >= 100){
      lapidaryMinigameState.slideDeviations += 2;
      playLapidaryThermalSizzle();
      spawnSlideDeviationParticle(pt.x, pt.y);
      spawnFloatingScore(pt.x, pt.y, "🔥 ¡SOBRECALENTAMIENTO!", true);
      lapidaryMinigameState.frictionHeat = 60; // Enfriamiento tras micro-fisura
    }

    // 3. Proyección de punto sobre el camino (Polyline)
    var bestDist = Infinity;
    var bestSeg = lapidaryMinigameState.pathProgressIdx;
    var bestT = 0;

    var minSeg = Math.max(0, lapidaryMinigameState.pathProgressIdx - 1);
    var maxSeg = Math.min(totalSegments - 1, lapidaryMinigameState.pathProgressIdx + 1);

    for(var s = minSeg; s <= maxSeg; s++){
      var A = wps[s];
      var B = wps[s + 1];
      var dx = B.x - A.x;
      var dy = B.y - A.y;
      var lenSq = dx * dx + dy * dy;
      var t = ((pt.x - A.x) * dx + (pt.y - A.y) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
      var projX = A.x + t * dx;
      var projY = A.y + t * dy;
      var dist = Math.hypot(pt.x - projX, pt.y - projY);

      if(dist < bestDist){
        bestDist = dist;
        bestSeg = s;
        bestT = t;
      }
    }

    if(bestSeg > lapidaryMinigameState.pathProgressIdx || (bestSeg === lapidaryMinigameState.pathProgressIdx && bestT > 0.85)){
      lapidaryMinigameState.pathProgressIdx = Math.max(lapidaryMinigameState.pathProgressIdx, bestSeg);
    }

    var progressPct = Math.min(1, (lapidaryMinigameState.pathProgressIdx + bestT) / totalSegments);
    lapidaryMinigameState.slideProgress = progressPct;
    lapidaryMinigameState.slideSamples++;

    // 4. Verificación de nódulos de dureza mineral (◆)
    var inclusions = curSlide.inclusions || [];
    for(var incIdx = 0; incIdx < inclusions.length; incIdx++){
      var incT = inclusions[incIdx];
      var incSegFloat = incT * totalSegments;
      var incSeg = Math.min(totalSegments - 1, Math.floor(incSegFloat));
      var incFract = incSegFloat - incSeg;
      var nA = wps[incSeg], nB = wps[incSeg + 1];
      var nX = nA.x + (nB.x - nA.x) * incFract;
      var nY = nA.y + (nB.y - nA.y) * incFract;

      var dNodule = Math.hypot(pt.x - nX, pt.y - nY);
      if(dNodule < 16 && lapidaryMinigameState.clearedInclusions.indexOf(incIdx) === -1){
        if(spd > 60){
          // Demasiado rápido: la sierra rebota violentamente
          lapidaryMinigameState.slideDeviations += 2;
          playPulsoWarning();
          spawnSlideDeviationParticle(pt.x, pt.y);
          spawnFloatingScore(pt.x, pt.y, "💥 ¡REBOTE EN NÓDULO! (-12%)", true);
        } else {
          // Velocidad controlada: perforación limpia
          lapidaryMinigameState.clearedInclusions.push(incIdx);
          playGemSweetSpotHit();
          spawnSlideSparkParticle(pt.x, pt.y);
          spawnFloatingScore(pt.x, pt.y, "✨ NÓDULO TRITURADO (+10 pts)", false);
        }
      }
    }

    // 5. Tolerancia y desvío
    var tolerance = curSlide.tolerance || 8;
    var isDeviating = (bestDist > tolerance) || (spd > 125);
    lapidaryMinigameState.lastDeviated = isDeviating;

    if(isDeviating){
      lapidaryMinigameState.slideDeviations++;
      spawnSlideDeviationParticle(pt.x, pt.y);
      if(lapidaryMinigameState.slideSamples % 4 === 0){
        playPulsoWarning();
      }
    } else {
      spawnSlideSparkParticle(pt.x, pt.y);
      if(lapidaryMinigameState.slideSamples % 6 === 0){
        playSlideCutWhir();
      }
    }

    // Precisión calculada en tiempo real
    var devRate = lapidaryMinigameState.slideDeviations / Math.max(1, lapidaryMinigameState.slideSamples);
    var precision = Math.max(25, Math.min(100, Math.round(100 - (devRate * 185))));
    lapidaryMinigameState.slidePrecision = precision;

    lapidaryMinigameState.traveledPoints.push({
      x: pt.x, y: pt.y,
      isDeviating: isDeviating,
      isSlow: (spd < 35)
    });
    if(lapidaryMinigameState.traveledPoints.length > 280){
      lapidaryMinigameState.traveledPoints.shift();
    }

    drawSlideGuide(ctx, curSlide, pt);
    updateLiveSlideHUD(precision, progressPct, spd, lapidaryMinigameState.frictionHeat);

    // Meta final alcanzada (progressPct >= 0.95)
    if(progressPct >= 0.95){
      finishCurrentSlide(ctx, curSlide);
    }
  }

  function handleSlideEnd(){
    lapidaryMinigameState.isTouchCutting = false;
    lapidaryMinigameState.touchFingerPt = null;
    if(!lapidaryMinigameState.currentSlideActive) return;
    lapidaryMinigameState.currentSlideActive = false;
    if(lapidaryMinigameState.slideProgress < 0.92){
      showToast("¡Pulso interrumpido! Vuelve a trazar desde el INICIO verde.", "warning");
      drawSlideGuide(ctx, curSlide, null);
      updateLiveSlideHUD(lapidaryMinigameState.slidePrecision, 0, 0, lapidaryMinigameState.frictionHeat);
    }
  }

  canvas.onmousedown = function(e){ handleSlideStart(e.clientX, e.clientY, false); };
  window.onmousemove = function(e){
    if(lapidaryMinigameState.active && lapidaryMinigameState.phase === 2){
      handleSlideMove(e.clientX, e.clientY, false);
    }
  };
  window.onmouseup = function(){ handleSlideEnd(); };

  canvas.ontouchstart = function(e){
    if(e.touches && e.touches[0]){
      handleSlideStart(e.touches[0].clientX, e.touches[0].clientY, true);
    }
    e.preventDefault();
  };
  canvas.ontouchmove = function(e){
    if(lapidaryMinigameState.currentSlideActive && e.touches && e.touches[0]){
      handleSlideMove(e.touches[0].clientX, e.touches[0].clientY, true);
    }
    e.preventDefault();
  };
  canvas.ontouchend = function(){ handleSlideEnd(); };
}

function spawnSlideSparkParticle(x, y){
  var container = document.getElementById("lapidarySlideParticles");
  if(!container) return;
  var p = document.createElement("div");
  p.className = "lapidary-spark-particle";
  p.style.left = x + "px";
  p.style.top = y + "px";
  container.appendChild(p);
  setTimeout(function(){ if(p.parentNode) p.parentNode.removeChild(p); }, 350);
}

function spawnSlideDeviationParticle(x, y){
  var container = document.getElementById("lapidarySlideParticles");
  if(!container) return;
  var p = document.createElement("div");
  p.className = "lapidary-danger-particle";
  p.style.left = x + "px";
  p.style.top = y + "px";
  container.appendChild(p);
  setTimeout(function(){ if(p.parentNode) p.parentNode.removeChild(p); }, 350);
}

function finishCurrentSlide(ctx, slide){
  lapidaryMinigameState.currentSlideActive = false;
  lapidaryMinigameState.isTouchCutting = false;
  lapidaryMinigameState.touchFingerPt = null;

  var precision = lapidaryMinigameState.slidePrecision || 85;
  lapidaryMinigameState.slideScores.push(precision);

  playSlideSuccess();
  if(typeof triggerBg3Haptic === "function") triggerBg3Haptic("crit");

  var banner = document.getElementById("lapidarySlideBanner");
  if(banner){
    banner.innerHTML = '<span class="banner-title">✨ ¡CORTE COMPLETADO!</span>' +
      '<span class="banner-sub">Precisión de pulso: <b>' + precision + '%</b> (+' + precision + ' pts)</span>';
    banner.classList.remove("hidden");
  }

  lapidaryMinigameState.slidePass++;

  setTimeout(function(){
    if(banner) banner.classList.add("hidden");

    if(lapidaryMinigameState.slidePass <= lapidaryMinigameState.maxSlidePasses){
      renderLapidaryModalContent();
      requestAnimationFrame(function(){ initLapidarySlideStage(); });
    } else {
      // Retornar de inmediato a pantalla normal al concluir el minijuego de cortes
      var modal = document.getElementById("lapidaryModal");
      if(modal) modal.classList.remove("phase-2-fullscreen");

      // Media de los 3 cortes
      var sum = lapidaryMinigameState.slideScores.reduce(function(a, b){ return a + b; }, 0);
      lapidaryMinigameState.phase2Score = Math.round(sum / lapidaryMinigameState.slideScores.length);
      renderLapidaryModalContent();
    }
  }, 950);
}


/* ==========================================================================
   6. CONTROL DE TIMING: FASE 3 (SWEET SPOT OSCILANTE)
   ========================================================================== */

function startLapidaryTimingLoop(){
  if(lapidaryMinigameState.animId){
    cancelAnimationFrame(lapidaryMinigameState.animId);
  }

  function loop(){
    if(!lapidaryMinigameState.active || lapidaryMinigameState.phase !== 3){
      return;
    }

    lapidaryMinigameState.cursorPos += lapidaryMinigameState.cursorSpeed * lapidaryMinigameState.cursorDir;
    if(lapidaryMinigameState.cursorPos >= 0.98){
      lapidaryMinigameState.cursorPos = 0.98;
      lapidaryMinigameState.cursorDir = -1;
    } else if(lapidaryMinigameState.cursorPos <= 0.02){
      lapidaryMinigameState.cursorPos = 0.02;
      lapidaryMinigameState.cursorDir = 1;
    }

    var cursorEl = document.getElementById("lapidaryGaugeCursor");
    if(cursorEl){
      cursorEl.style.left = (lapidaryMinigameState.cursorPos * 100) + "%";
    }

    lapidaryMinigameState.animId = requestAnimationFrame(loop);
  }

  lapidaryMinigameState.animId = requestAnimationFrame(loop);
}

function handleLapidaryCutTrigger(){
  if(lapidaryMinigameState.phase !== 3) return;
  if(lapidaryMinigameState.timingPass > lapidaryMinigameState.maxPasses) return;

  var pos = lapidaryMinigameState.cursorPos;
  var isHit = (pos >= lapidaryMinigameState.sweetSpotStart && pos <= lapidaryMinigameState.sweetSpotEnd);

  var feedback = document.getElementById("lapidaryTimingFeedback");

  if(isHit){
    lapidaryMinigameState.timingHits++;
    lapidaryMinigameState.passResults.push(true);
    playGemSweetSpotHit();
    if(typeof triggerBg3Haptic === "function") triggerBg3Haptic("crit");
    if(feedback){
      feedback.textContent = "¡Corte Impecable! (+1 Acierto de Facetado)";
      feedback.className = "lapidary-timing-feedback success";
    }
  } else {
    lapidaryMinigameState.passResults.push(false);
    playGemSweetSpotMiss();
    if(typeof triggerBg3Haptic === "function") triggerBg3Haptic("fumble");
    if(feedback){
      feedback.textContent = "Corte Desviado (+0)";
      feedback.className = "lapidary-timing-feedback miss";
    }
  }

  lapidaryMinigameState.timingPass++;
  lapidaryMinigameState.cursorSpeed = 0.024 + (lapidaryMinigameState.timingPass * 0.007);

  renderLapidaryModalContent();
  if(lapidaryMinigameState.timingPass <= lapidaryMinigameState.maxPasses){
    startLapidaryTimingLoop();
  } else {
    lapidaryMinigameState.phase3Score = Math.round((lapidaryMinigameState.timingHits / 3) * 100);
    playLapidaryGrind();
    var fbFinal = document.getElementById("lapidaryTimingFeedback");
    if(fbFinal){
      fbFinal.textContent = "¡Facetado Completado! " + lapidaryMinigameState.timingHits + " / 3 Aciertos (" + lapidaryMinigameState.phase3Score + "%)";
      fbFinal.className = "lapidary-timing-feedback success";
    }
  }
}

/* ==========================================================================
   7. FASE 4: BALANCE, RIESGO DE ROTURA Y TIRADA FINAL (Requisito 3)
   ========================================================================== */

function computeArtisanMasteryAndRisk(c){
  var p1 = lapidaryMinigameState.phase1Score || 70;
  var p2 = lapidaryMinigameState.phase2Score || 70;
  var p3 = lapidaryMinigameState.phase3Score || 60;

  var total = Math.round((p1 * 0.35) + (p2 * 0.35) + (p3 * 0.30));
  lapidaryMinigameState.totalArtisanScore = total;

  var tier = getLapidaryTier(c.lapidaryTier);

  // Modificador de Tier sobre el riesgo de rotura
  var tierRiskMod = 0;
  if(tier.id === "hierro") tierRiskMod = 10;
  else if(tier.id === "bronce") tierRiskMod = 6;
  else if(tier.id === "plata") tierRiskMod = 2;
  else if(tier.id === "oro") tierRiskMod = -3;
  else if(tier.id === "platino") tierRiskMod = -6;
  else if(tier.id === "diamante") tierRiskMod = -10;

  // Modificador de Inteligencia
  var intVal = num(c.attrs.inteligencia, 1);
  var intRiskReduction = (intVal > 4) ? (intVal - 4) * 1.5 : 0;

  // Riesgo base inversamente proporcional a la puntuación
  var baseRisk = 20;
  if(total >= 90) baseRisk = 5;
  else if(total >= 75) baseRisk = 12;
  else if(total >= 60) baseRisk = 22;
  else if(total >= 45) baseRisk = 38;
  else baseRisk = 55;

  var finalRisk = Math.max(3, Math.min(75, Math.round(baseRisk + tierRiskMod - intRiskReduction)));
  lapidaryMinigameState.breakRisk = finalRisk;

  // Bono a la tirada final según maestría artesanal
  var bonus = 0;
  if(total >= 85) bonus = 3;
  else if(total >= 65) bonus = 2;
  else if(total >= 45) bonus = 1;
  lapidaryMinigameState.rollBonus = bonus;
}

function launchLapidaryRollModal(){
  var c = (state.characters || []).find(function(ch){ return ch.id === lapidaryMinigameState.charId; });
  var stone = c ? (c.stones || []).find(function(st){ return st.id === lapidaryMinigameState.stoneId; }) : null;
  if(!c || !stone) return;

  var family = getStoneFamily(stone.color);
  var tier = getLapidaryTier(c.lapidaryTier);

  var intVal = num(c.attrs.inteligencia, 1);
  var skillBonus = (c.skillBonus && c.skillBonus["Piedras mágicas"]) ? num(c.skillBonus["Piedras mágicas"], 0) : 0;
  var tierBonus = tier.bonusRoll || 0;
  var timingHits = lapidaryMinigameState.rollBonus || 0;

  // Comprobar prueba de rotura con el riesgo acumulado de los minijuegos (Requisito 3)
  var rollD100 = Math.floor(Math.random() * 100) + 1;
  var didBreak = (rollD100 <= lapidaryMinigameState.breakRisk);

  // Desglose explícito de modificadores requeridos en Punto 6
  var modifiers = [
    { label: "Inteligencia", val: intVal, icon: "inteligencia", type: "attr" }
  ];

  if(skillBonus !== 0){
    modifiers.push({ label: "Habilidad Piedras Mágicas", val: skillBonus, icon: "rune", type: "skill" });
  }

  if(tierBonus !== 0){
    modifiers.push({ label: tier.name, val: tierBonus, icon: "gem", type: "tier" });
  }

  if(timingHits !== 0){
    modifiers.push({ label: "Maestría en Minijuegos (" + lapidaryMinigameState.totalArtisanScore + "/100)", val: timingHits, icon: "sparkle", type: "timing" });
  }

  closeLapidaryMinigame();

  if(typeof openBg3RollModal === "function"){
    openBg3RollModal({
      title: "Talla de Lapidario",
      subtitle: "Corte de " + family.gema + " (Riesgo: " + lapidaryMinigameState.breakRisk + "%)",
      sides: 10,
      qty: 1,
      charName: c.name,
      modifiers: modifiers,
      onResolve: function(rollState){
        resolveLapidaryCraft(c, stone, rollState, didBreak, rollD100);
      }
    });
  } else {
    var d10 = Math.floor(Math.random() * 10) + 1;
    var total = d10 + intVal + skillBonus + tierBonus + timingHits;
    resolveLapidaryCraft(c, stone, { total: total, r1: d10 }, didBreak, rollD100);
  }
}

function resolveLapidaryCraft(c, stone, rollState, didBreak, rollD100){
  var grandTotal = rollState.total;

  stone.estado = "pulida";

  if(didBreak){
    // La gema se rompe debido al riesgo acumulado de los minijuegos
    stone.calidad = "arruinada";
    playGemFracture();
    stone.notasInvestigacion = (stone.notasInvestigacion ? stone.notasInvestigacion + " " : "") + "[FRACTURADA: Falló prueba de rotura (" + rollD100 + "% vs Riesgo " + lapidaryMinigameState.breakRisk + "%)].";
    showToast("💥 ¡FRACTURA! La gema se ha roto durante el corte (Rotura: " + rollD100 + "% vs Riesgo " + lapidaryMinigameState.breakRisk + "%). Calidad: Arruinada.", "error");
  } else {
    var quality = getStoneQualityByRoll(grandTotal);
    stone.calidad = quality.id;
    if(quality.id === "arruinada"){
      playGemFracture();
      showToast("⚠️ Corte irregular. Calidad: Arruinada (Tirada: " + grandTotal + ").", "warning");
    } else {
      playGemChime(quality.id);
      showToast("💎 ¡Talla completada sin fractura! Calidad: " + quality.label + " (Total: " + grandTotal + ").", "success");
    }
  }

  saveState(false);
  if(typeof manageListItemRPC === "function"){
    manageListItemRPC(c, 'stones', 'update_item', stone, stone.id);
  }
  if(typeof pushCharacterPatch === "function"){
    pushCharacterPatch(c.id, { stones: c.stones });
  }

  renderTab();
}

/* ==========================================================================
   8. ADQUISICIÓN DE PIEDRAS EN BRUTO (MODAL)
   ========================================================================== */

function openAddRoughStoneModal(charId){
  var modal = document.getElementById("addStoneModal");
  var overlay = document.getElementById("addStoneModalOverlay");
  if(!modal || !overlay) return;

  var colorPills = (typeof MAGIC_STONE_FAMILIES !== "undefined" ? MAGIC_STONE_FAMILIES : []).map(function(fam, idx){
    return '<button type="button" class="f-pill add-stone-color-pill ' + (idx === 0 ? 'active' : '') + '" data-action="select-add-stone-color" data-color="' + fam.id + '" style="--pill-border:' + fam.hex + ';--pill-bg:' + fam.hex + '33;--pill-glow:' + fam.hex + '88;border-color:' + (idx === 0 ? fam.hex : 'rgba(255,255,255,0.18)') + ';">' +
      fam.icon + ' ' + fam.name + ' (' + fam.gema + ')' +
    '</button>';
  }).join('');

  var origins = ["Minas / Cuevas", "Comercio / Compra"];
  var originPills = origins.map(function(org, idx){
    return '<button type="button" class="f-pill add-stone-origin-pill ' + (idx === 0 ? 'active' : '') + '" data-action="select-add-stone-origin" data-origin="' + org + '">' +
      (org.includes("Minas") ? "⛏️ " : "🪙 ") + org +
    '</button>';
  }).join('');

  var html = '<h2>➕ Nueva Piedra en Bruto<button type="button" data-action="close-add-stone-modal" aria-label="Cerrar">&times;</button></h2>' +
    '<div class="field">' +
      '<label>Familia / Color de la Gema</label>' +
      '<div class="filter-pills" id="addStoneColors" style="flex-wrap:wrap;gap:6px;margin-top:4px;">' + colorPills + '</div>' +
    '</div>' +
    '<div class="field" style="margin-top:12px;">' +
      '<label>Origen del Mineral</label>' +
      '<div class="filter-pills" id="addStoneOrigins" style="flex-wrap:wrap;gap:6px;margin-top:4px;">' + originPills + '</div>' +
    '</div>' +
    '<div class="field" style="margin-top:12px;">' +
      '<label>Efecto Concreto de la Gema (Solo visible al confirmar o revelar GM)</label>' +
      '<input type="text" id="addStoneEfectoConcreto" placeholder="Ej: Furia del Berserker: +2 al daño físico durante 3 turnos">' +
    '</div>' +
    '<div class="field" style="margin-top:10px;">' +
      '<label>Notas de Campo o Yacimiento</label>' +
      '<textarea id="addStoneNotas" placeholder="Detalles de dónde se halló o a quién se le compró..."></textarea>' +
    '</div>' +
    '<button type="button" class="btn-solid-gold" style="width:100%;margin-top:14px;padding:9px;" data-action="confirm-add-rough-stone" data-char-id="' + charId + '">Registrar Piedra en Bruto</button>';

  modal.innerHTML = html;

  // Delegación de clics directa en el modal para máxima compatibilidad táctil y móvil
  modal.onclick = function(e){
    var cBtn = e.target.closest(".add-stone-color-pill");
    if(cBtn){
      modal.querySelectorAll(".add-stone-color-pill").forEach(function(p){ p.classList.remove("active"); });
      cBtn.classList.add("active");
      return;
    }
    var oBtn = e.target.closest(".add-stone-origin-pill");
    if(oBtn){
      modal.querySelectorAll(".add-stone-origin-pill").forEach(function(p){ p.classList.remove("active"); });
      oBtn.classList.add("active");
      return;
    }
  };

  overlay.classList.remove("hidden");
}

function confirmAddRoughStone(charId){
  var c = (state.characters || []).find(function(ch){ return ch.id === charId; });
  if(!c) return;

  var activeColorBtn = document.querySelector("#addStoneColors .add-stone-color-pill.active");
  var activeOriginBtn = document.querySelector("#addStoneOrigins .add-stone-origin-pill.active");
  var color = activeColorBtn ? activeColorBtn.getAttribute("data-color") : "blanca";
  var origen = activeOriginBtn ? activeOriginBtn.getAttribute("data-origin") : "Minas / Cuevas";

  var efectoConcreto = (document.getElementById("addStoneEfectoConcreto") ? document.getElementById("addStoneEfectoConcreto").value.trim() : "");
  var notas = (document.getElementById("addStoneNotas") ? document.getElementById("addStoneNotas").value.trim() : "");

  var newStone = {
    id: "stn_" + uid(),
    estado: "en_bruto",
    color: color,
    origen: origen,
    calidad: null,
    progDescubrimiento: "sin_descubrir",
    efectoConcreto: efectoConcreto,
    notasInvestigacion: notas
  };

  c.stones = c.stones || [];
  c.stones.push(newStone);

  saveState(false);
  if(typeof manageListItemRPC === "function"){
    manageListItemRPC(c, 'stones', 'add', newStone);
  }
  if(typeof pushCharacterPatch === "function"){
    pushCharacterPatch(c.id, { stones: c.stones });
  }

  var overlay = document.getElementById("addStoneModalOverlay");
  if(overlay) overlay.classList.add("hidden");

  renderTab();
  showToast("Mineral en bruto añadido al taller.", "success");
}

/* ==========================================================================
   9. TIRADA DE INVESTIGACIÓN Y SECRETO GM (PUNTOS 3 Y 7)
   ========================================================================== */

function rollStoneInvestigation(charId, stoneId){
  var c = (state.characters || []).find(function(ch){ return ch.id === charId; });
  if(!c) return;
  var stone = (c.stones || []).find(function(st){ return st.id === stoneId; });
  if(!stone) return;

  var intVal = num(c.attrs.inteligencia, 1);
  var skillBonus = (c.skillBonus && c.skillBonus["Piedras mágicas"]) ? num(c.skillBonus["Piedras mágicas"], 0) : 0;

  var targetDC = (stone.progDescubrimiento === "sin_descubrir") ? 10 : 15;
  var targetLabel = (stone.progDescubrimiento === "sin_descubrir") ? "Teorizar Efecto (CD 10)" : "Confirmar Efecto (CD 15)";

  var modifiers = [
    { label: "Inteligencia", val: intVal, icon: "inteligencia", type: "attr" }
  ];
  if(skillBonus !== 0){
    modifiers.push({ label: "Habilidad Piedras Mágicas", val: skillBonus, icon: "rune", type: "skill" });
  }

  if(typeof openBg3RollModal === "function"){
    openBg3RollModal({
      title: "Investigación Arcana de Gema",
      subtitle: targetLabel + " (1d10 + Int + Skill)",
      sides: 10,
      qty: 1,
      charName: c.name,
      modifiers: modifiers,
      onResolve: function(rollState){
        var tot = rollState.total;
        if(tot >= targetDC){
          if(stone.progDescubrimiento === "sin_descubrir"){
            stone.progDescubrimiento = "teorizado";
            showToast("¡Éxito! (Tirada: " + tot + " vs CD " + targetDC + "). La gema ha sido Teorizada.", "success");
          } else if(stone.progDescubrimiento === "teorizado"){
            stone.progDescubrimiento = "confirmado";
            showToast("¡Éxito Maestro! (Tirada: " + tot + " vs CD " + targetDC + "). Efecto Confirmado plenamente.", "success");
          }
          saveState(false);
          if(typeof manageListItemRPC === "function"){
            manageListItemRPC(c, 'stones', 'update_item', stone, stone.id);
          }
          if(typeof pushCharacterPatch === "function"){
            pushCharacterPatch(c.id, { stones: c.stones });
          }
          renderTab();
        } else {
          showToast("La investigación no arrojó certezas (Tirada: " + tot + " vs CD " + targetDC + "). Vuelve a intentarlo tras experimentar.", "info");
        }
      }
    });
  }
}

function revealStoneSecretToPlayer(charId, stoneId){
  var c = (state.characters || []).find(function(ch){ return ch.id === charId; });
  if(!c) return;
  var stone = (c.stones || []).find(function(st){ return st.id === stoneId; });
  if(!stone) return;

  stone.progDescubrimiento = "confirmado";
  saveState(false);
  if(typeof manageListItemRPC === "function"){
    manageListItemRPC(c, 'stones', 'update_item', stone, stone.id);
  }
  if(typeof pushCharacterPatch === "function"){
    pushCharacterPatch(c.id, { stones: c.stones });
  }

  renderTab();
  showToast("👁️ Información secreta de la gema revelada al jugador.", "success");
}
