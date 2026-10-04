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

var lapidaryMinigameState = {
  active: false,
  charId: null,
  stoneId: null,
  phase: 1, // 1: Cincelado y desbaste, 2: Cortes guiados sinuosos (pulso), 3: Sweet spot timing, 4: Resumen y rotura

  // Fase 1: Cincelado y Desbaste de Ganga
  cleanPct: 0,
  fragileHits: 0,
  maxFragileHits: 4,
  phase1Score: 100,
  crustPlates: getInitialCrustPlates(),
  fragileVeins: [
    { x: 115, y: 145, r: 26, label: "Fisura A" },
    { x: 185, y: 145, r: 26, label: "Fisura B" },
    { x: 150, y: 220, r: 26, label: "Fisura C" }
  ],
  isChiseling: false,
  lastChiselTime: 0,

  // Fase 2: Cortes Guiados Sinuosos (Prueba de Pulso y Dificultad)
  slidePass: 1,
  maxSlidePasses: 3,
  slideScores: [],
  currentSlideActive: false,
  slideSamples: 0,
  slideDeviations: 0,
  slideProgress: 0, // 0 a 1
  slidePrecision: 100, // 0 a 100 pts
  traveledPoints: [],
  pathProgressIdx: 0,
  slidePoints: [
    {
      id: 1,
      name: "Corte 1: Onda Sinuosa de Cintura",
      type: "sinusoidal",
      desc: "Onda de faceta: sigue las curvas ascendentes y descendentes con pulso firme y continuo.",
      tolerance: 10,
      x1: 45, y1: 150, x2: 255, y2: 150, // Compatibilidad con coordenadas inicio/fin
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
      desc: "Facetado angular: mantén la mano firme en los quiebres y cambios bruscos de arista.",
      tolerance: 10,
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
      desc: "Arco de alta tensión: canal estrecho en la cúspide; desliza con pulso lento y controlado.",
      tolerance: 9,
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

  // Reset Fase 1
  lapidaryMinigameState.crustPlates = getInitialCrustPlates();
  lapidaryMinigameState.cleanPct = 0;
  lapidaryMinigameState.fragileHits = 0;
  lapidaryMinigameState.phase1Score = 40;
  lapidaryMinigameState.isChiseling = false;

  // Reset Fase 2
  lapidaryMinigameState.slidePass = 1;
  lapidaryMinigameState.slideScores = [];
  lapidaryMinigameState.currentSlideActive = false;
  lapidaryMinigameState.slideSamples = 0;
  lapidaryMinigameState.slideDeviations = 0;
  lapidaryMinigameState.slideProgress = 0;
  lapidaryMinigameState.slidePrecision = 100;
  lapidaryMinigameState.traveledPoints = [];
  lapidaryMinigameState.pathProgressIdx = 0;
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
    initLapidaryScratchCanvas();
  });
}

function closeLapidaryMinigame(){
  lapidaryMinigameState.active = false;
  if(lapidaryMinigameState.animId){
    cancelAnimationFrame(lapidaryMinigameState.animId);
    lapidaryMinigameState.animId = null;
  }
  var overlay = document.getElementById("lapidaryModalOverlay");
  if(overlay) overlay.classList.add("hidden");
}

function renderLapidaryModalContent(){
  var modal = document.getElementById("lapidaryModal");
  if(!modal) return;

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
  // FASE 1: DESBASTE Y CINCELADO DE GANGA MINERAL
  // ==========================================
  if(lapidaryMinigameState.phase === 1){
    var integrity = Math.max(0, 100 - (lapidaryMinigameState.fragileHits * 25));
    var safeCleared = (lapidaryMinigameState.crustPlates || []).filter(function(p){ return p.type === 'gangue' && p.cleared; }).length;
    var totalSafe = 8;
    var cleanPct = Math.round((safeCleared / totalSafe) * 100);
    var p1Score = Math.max(0, Math.min(100, Math.round((cleanPct * 0.6) + (integrity * 0.4))));
    lapidaryMinigameState.cleanPct = cleanPct;
    lapidaryMinigameState.phase1Score = p1Score;

    html += '<div class="lapidary-phase-body">' +
      '<div class="lapidary-instructions">' +
        '<b>Fase 1: Desbaste y Cincelado de Ganga Mineral</b><br>' +
        'Haz clic o arrastra el cincel sobre las <b>placas de roca oscura</b> para fracturarlas y despejar el cristal (Objetivo: 75%+).<br>' +
        '<span style="color:#F87171;font-weight:600;">⚠️ ¡Peligro! No golpees las vetas carmesí (Fisuras frágiles); dañan la integridad estructural.</span>' +
      '</div>' +

      // Live HUD con puntos y porcentajes
      '<div class="lapidary-live-hud">' +
        '<div class="lapidary-hud-badge">' +
          '<span class="hud-label">GANGA RETIRADA</span>' +
          '<b class="hud-val ' + (cleanPct >= 75 ? 'safe' : 'warning') + '" id="lapidaryHudClean">' + safeCleared + ' / ' + totalSafe + ' (' + cleanPct + '%)</b>' +
        '</div>' +
        '<div class="lapidary-hud-badge">' +
          '<span class="hud-label">INTEGRIDAD</span>' +
          '<b class="hud-val ' + (integrity < 50 ? 'danger' : (integrity < 75 ? 'warning' : 'safe')) + '" id="lapidaryHudIntegrity">' + integrity + '% (' + integrity + ' pts)</b>' +
        '</div>' +
        '<div class="lapidary-hud-badge">' +
          '<span class="hud-label">PUNTUACIÓN FASE 1</span>' +
          '<b class="hud-val" id="lapidaryHudPhase1Score">' + p1Score + ' pts</b>' +
        '</div>' +
      '</div>' +

      '<div class="lapidary-scratch-stage chisel-mode" id="lapidaryScratchStage">' +
        '<div class="lapidary-gem-underlay" id="lapidaryGemUnderlay">' +
          '<div class="lapidary-gem-silhouette" style="background:radial-gradient(circle at 40% 40%, ' + family.hex + ' 10%, ' + family.glow + ' 60%, rgba(0,0,0,0.8) 100%);box-shadow:0 0 35px ' + family.glow + ';">' +
            '<div class="lapidary-gem-shimmer"></div>' +
            '<span class="lapidary-gem-big-icon">' + family.icon + '</span>' +
          '</div>' +
        '</div>' +
        '<canvas id="lapidaryScratchCanvas" width="300" height="300" class="lapidary-scratch-canvas chisel-canvas"></canvas>' +
        '<div class="lapidary-particles-container" id="lapidaryParticles"></div>' +
      '</div>' +

      '<div class="lapidary-meters-row">' +
        '<div class="lapidary-meter-box">' +
          '<span class="lapidary-meter-label">Limpieza Ganga: ' + cleanPct + '% / 75% (' + Math.round(cleanPct) + ' pts)</span>' +
          '<div class="lapidary-meter-track"><div class="lapidary-meter-fill clean" id="lapidaryCleanBar" style="width:' + cleanPct + '%;"></div></div>' +
        '</div>' +
        '<div class="lapidary-meter-box">' +
          '<span class="lapidary-meter-label">Integridad: <b id="lapidaryIntegrityText">' + integrity + '% (' + integrity + ' pts)</b></span>' +
          '<div class="lapidary-meter-track"><div class="lapidary-meter-fill integrity ' + (integrity < 50 ? 'danger' : (integrity < 75 ? 'warning' : '')) + '" id="lapidaryIntegrityBar" style="width:' + integrity + '%;"></div></div>' +
        '</div>' +
      '</div>' +

      '<div class="lapidary-action-footer">' +
        '<button type="button" class="btn-solid-gold lapidary-btn-advance ' + (cleanPct >= 75 ? 'pulse-glow' : '') + '" id="lapidaryBtnPhase2" data-action="advance-to-slide-cuts" ' + (cleanPct >= 75 ? '' : 'disabled') + '>' +
          (cleanPct >= 75 ? '✨ Ganga Removida (' + p1Score + ' pts) Avanzar a Cortes ➡️' : 'Fractura las placas de ganga (' + safeCleared + '/8)...') +
        '</button>' +
      '</div>' +
    '</div>';
  }

  // ==========================================
  // FASE 2: CORTES GUIADOS SINUOSOS (Prueba de Pulso)
  // ==========================================
  else if(lapidaryMinigameState.phase === 2){
    var curSlide = lapidaryMinigameState.slidePoints[lapidaryMinigameState.slidePass - 1] || lapidaryMinigameState.slidePoints[0];
    var livePrecision = lapidaryMinigameState.slidePrecision || 100;
    var liveProgress = Math.round((lapidaryMinigameState.slideProgress || 0) * 100);

    html += '<div class="lapidary-phase-body">' +
      '<div class="lapidary-instructions">' +
        '<b>Fase 2: Cortes Guiados Sinuosos (Prueba de Pulso)</b><br>' +
        'Presiona el <b>Punto Verde (Inicio)</b> y <u>conduce con pulso firme el trazo por la curva sin salirte del canal</u> hasta la <b>Meta Dorada</b>.' +
      '</div>' +

      // Live HUD con precisión, progreso y puntos en tiempo real
      '<div class="lapidary-live-hud">' +
        '<div class="lapidary-hud-badge precision">' +
          '<span class="hud-label">PRECISIÓN DE PULSO</span>' +
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
          '<button type="button" class="btn-compact" disabled style="width:100%;padding:9px;">Conduce el pulso a lo largo de la curva...</button>'
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
   4. CONTROL DE CANVAS: FASE 1 (MESA DE CINCELADO Y DESPRENDIMIENTO DE GANGA)
   ========================================================================== */

function drawChiselWorkbench(ctx, w, h){
  ctx.clearRect(0, 0, w, h);

  // Fondo de costra basáltica oscura
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#1E1813";
  ctx.fillRect(0, 0, w, h);

  // Textura mineral rugosa
  ctx.fillStyle = "#2D241C";
  for(var i = 0; i < 280; i++){
    var rx = (i * 37) % w;
    var ry = (i * 73) % h;
    var rad = 3 + ((i * 13) % 7);
    ctx.beginPath();
    ctx.arc(rx, ry, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // 1. Despejar áreas de placas ya fracturadas (destination-out para revelar el cristal debajo)
  (lapidaryMinigameState.crustPlates || []).forEach(function(plate){
    if(plate.cleared && plate.type === 'gangue'){
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      // Forma irregular con hendiduras de cincel
      var pts = 10;
      for(var p = 0; p < pts; p++){
        var angle = (p / pts) * Math.PI * 2;
        var rVar = plate.r + ((p % 2 === 0) ? 6 : -4);
        var px = plate.cx + Math.cos(angle) * rVar;
        var py = plate.cy + Math.sin(angle) * rVar;
        if(p === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }
  });

  ctx.globalCompositeOperation = "source-over";

  // 2. Dibujar placas de ganga rocosa pendientes de fracturar
  (lapidaryMinigameState.crustPlates || []).forEach(function(plate){
    if(plate.type === 'gangue' && !plate.cleared){
      // Sombra y volumen de la placa
      var grad = ctx.createRadialGradient(plate.cx - 6, plate.cy - 6, 4, plate.cx, plate.cy, plate.r + 4);
      grad.addColorStop(0, "#4A3E31");
      grad.addColorStop(0.7, "#2E241A");
      grad.addColorStop(1, "#18120D");
      ctx.fillStyle = grad;

      ctx.beginPath();
      var pts = 8;
      for(var p = 0; p < pts; p++){
        var angle = (p / pts) * Math.PI * 2;
        var rVar = plate.r + ((p % 2 === 0) ? 3 : -3);
        var px = plate.cx + Math.cos(angle) * rVar;
        var py = plate.cy + Math.sin(angle) * rVar;
        if(p === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // Borde y bisel de la placa
      ctx.strokeStyle = "rgba(176, 141, 87, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Grietas internas en la roca
      ctx.strokeStyle = "rgba(15, 10, 8, 0.65)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plate.cx - 10, plate.cy - 8);
      ctx.lineTo(plate.cx + 2, plate.cy);
      ctx.lineTo(plate.cx + 12, plate.cy + 10);
      ctx.stroke();

      // Marcador de cincel
      ctx.fillStyle = "rgba(222, 195, 146, 0.8)";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("⛏️", plate.cx, plate.cy);
    }
  });

  // 3. Dibujar Vetas Críticas Frágiles (Zonas Prohibidas con pulso de advertencia)
  (lapidaryMinigameState.crustPlates || []).forEach(function(plate){
    if(plate.type === 'fissure'){
      // Resplandor carmesí de peligro
      var grad = ctx.createRadialGradient(plate.cx, plate.cy, 3, plate.cx, plate.cy, plate.r + 6);
      grad.addColorStop(0, "rgba(239, 68, 68, 0.95)");
      grad.addColorStop(0.5, "rgba(220, 38, 38, 0.5)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(plate.cx, plate.cy, plate.r + 6, 0, Math.PI * 2);
      ctx.fill();

      // Fisuras dentadas
      ctx.strokeStyle = "#FCA5A5";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(plate.cx - 15, plate.cy - 12);
      ctx.lineTo(plate.cx - 4, plate.cy);
      ctx.lineTo(plate.cx + 12, plate.cy - 10);
      ctx.lineTo(plate.cx + 16, plate.cy + 14);
      ctx.stroke();

      // Etiqueta de advertencia
      ctx.fillStyle = "#FEE2E2";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("⚠️ FISURA", plate.cx, plate.cy + 18);
    }
  });
}

function strikeChiselAt(clientX, clientY){
  var canvas = document.getElementById("lapidaryScratchCanvas");
  if(!canvas) return;
  var ctx = canvas.getContext("2d");
  if(!ctx) return;

  var rect = canvas.getBoundingClientRect();
  var scaleX = canvas.width / rect.width;
  var scaleY = canvas.height / rect.height;
  var x = (clientX - rect.left) * scaleX;
  var y = (clientY - rect.top) * scaleY;
  var stageX = clientX - rect.left;
  var stageY = clientY - rect.top;

  // 1. Comprobar si golpea una FISURA FRÁGIL (Peligro: reduce integridad)
  var hitFissure = false;
  var plates = lapidaryMinigameState.crustPlates || [];
  for(var i = 0; i < plates.length; i++){
    var p = plates[i];
    if(p.type === 'fissure'){
      var dF = Math.hypot(x - p.cx, y - p.cy);
      if(dF <= p.r + 8){
        hitFissure = true;
        break;
      }
    }
  }

  if(hitFissure){
    var now = Date.now();
    if(now - (lapidaryMinigameState.lastFissureHit || 0) > 280){
      lapidaryMinigameState.lastFissureHit = now;
      lapidaryMinigameState.fragileHits++;
      playGemFractureTick();
      if(typeof triggerBg3Haptic === "function") triggerBg3Haptic("fumble");
      spawnDangerParticles(stageX, stageY);
      spawnFloatingScore(stageX, stageY, "-25% INTEGRIDAD", true);

      var stageEl = document.getElementById("lapidaryScratchStage");
      if(stageEl){
        stageEl.classList.add("danger-flash");
        setTimeout(function(){ if(stageEl) stageEl.classList.remove("danger-flash"); }, 240);
      }
      updateChiselWorkbenchHUD();
    }
    return;
  }

  // 2. Comprobar si golpea una PLACA DE GANGA sana
  var hitGangue = null;
  for(var j = 0; j < plates.length; j++){
    var pl = plates[j];
    if(pl.type === 'gangue' && !pl.cleared){
      var dG = Math.hypot(x - pl.cx, y - pl.cy);
      if(dG <= pl.r + 6){
        hitGangue = pl;
        break;
      }
    }
  }

  if(hitGangue){
    hitGangue.cleared = true;
    playLapidaryChiselStrike();
    if(typeof triggerBg3Haptic === "function") triggerBg3Haptic("light");
    spawnFlyingRockDebris(stageX, stageY);
    spawnFloatingScore(stageX, stageY, "+12.5% (+12 pts)", false);

    drawChiselWorkbench(ctx, canvas.width, canvas.height);
    updateChiselWorkbenchHUD();
  }
}

function updateChiselWorkbenchHUD(){
  var plates = lapidaryMinigameState.crustPlates || [];
  var safeCleared = plates.filter(function(p){ return p.type === 'gangue' && p.cleared; }).length;
  var totalSafe = 8;
  var cleanPct = Math.min(100, Math.round((safeCleared / totalSafe) * 100));
  var integrity = Math.max(0, 100 - (lapidaryMinigameState.fragileHits * 25));
  var p1Score = Math.max(0, Math.min(100, Math.round((cleanPct * 0.6) + (integrity * 0.4))));

  lapidaryMinigameState.cleanPct = cleanPct;
  lapidaryMinigameState.phase1Score = p1Score;

  var hudClean = document.getElementById("lapidaryHudClean");
  var hudIntegrity = document.getElementById("lapidaryHudIntegrity");
  var hudPhase1Score = document.getElementById("lapidaryHudPhase1Score");
  var cleanBar = document.getElementById("lapidaryCleanBar");
  var integBar = document.getElementById("lapidaryIntegrityBar");
  var integTxt = document.getElementById("lapidaryIntegrityText");
  var btn = document.getElementById("lapidaryBtnPhase2");

  if(hudClean){
    hudClean.textContent = safeCleared + " / " + totalSafe + " (" + cleanPct + "%)";
    hudClean.className = "hud-val " + (cleanPct >= 75 ? "safe" : "warning");
  }
  if(hudIntegrity){
    hudIntegrity.textContent = integrity + "% (" + integrity + " pts)";
    hudIntegrity.className = "hud-val " + (integrity < 50 ? "danger" : (integrity < 75 ? "warning" : "safe"));
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
    btn.textContent = "✨ Ganga Removida (" + p1Score + " pts) Avanzar a Cortes ➡️";
    btn.classList.add("pulse-glow");
    playGemSweetSpotHit();
    if(typeof triggerBg3Haptic === "function") triggerBg3Haptic("crit");
  }
}

function initLapidaryScratchCanvas(){
  var canvas = document.getElementById("lapidaryScratchCanvas");
  if(!canvas) return;
  var ctx = canvas.getContext("2d");
  if(!ctx) return;

  var w = canvas.width;
  var h = canvas.height;

  drawChiselWorkbench(ctx, w, h);
  updateChiselWorkbenchHUD();

  canvas.onmousedown = function(e){
    lapidaryMinigameState.isChiseling = true;
    strikeChiselAt(e.clientX, e.clientY);
  };
  window.onmousemove = function(e){
    if(lapidaryMinigameState.isChiseling && lapidaryMinigameState.active && lapidaryMinigameState.phase === 1){
      strikeChiselAt(e.clientX, e.clientY);
    }
  };
  window.onmouseup = function(){
    lapidaryMinigameState.isChiseling = false;
  };

  canvas.ontouchstart = function(e){
    if(e.touches && e.touches[0]){
      lapidaryMinigameState.isChiseling = true;
      strikeChiselAt(e.touches[0].clientX, e.touches[0].clientY);
    }
    e.preventDefault();
  };
  canvas.ontouchmove = function(e){
    if(lapidaryMinigameState.isChiseling && e.touches && e.touches[0]){
      strikeChiselAt(e.touches[0].clientX, e.touches[0].clientY);
    }
    e.preventDefault();
  };
  canvas.ontouchend = function(){
    lapidaryMinigameState.isChiseling = false;
  };
}

function spawnFloatingScore(x, y, text, isDanger){
  var stage = document.getElementById("lapidaryScratchStage") || document.getElementById("lapidarySlideStage");
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
  var container = document.getElementById("lapidaryParticles") || document.getElementById("lapidaryScratchStage");
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
  var container = document.getElementById("lapidaryParticles") || document.getElementById("lapidaryScratchStage");
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
   5. CONTROL DE SLIDES: FASE 2 (CORTES GUIADOS SINUOSOS - PRUEBA DE PULSO)
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

  // 1. Canal de corte guía (Tolerancia: slide.tolerance * 2)
  var corridorWidth = (slide.tolerance || 10) * 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Resplandor exterior del canal
  ctx.strokeStyle = "rgba(176, 141, 87, 0.15)";
  ctx.lineWidth = corridorWidth + 10;
  ctx.beginPath();
  ctx.moveTo(wps[0].x, wps[0].y);
  for(var i = 1; i < wps.length; i++) ctx.lineTo(wps[i].x, wps[i].y);
  ctx.stroke();

  // Tubo del canal con bordes visibles
  ctx.strokeStyle = "rgba(176, 141, 87, 0.32)";
  ctx.lineWidth = corridorWidth;
  ctx.beginPath();
  ctx.moveTo(wps[0].x, wps[0].y);
  for(var j = 1; j < wps.length; j++) ctx.lineTo(wps[j].x, wps[j].y);
  ctx.stroke();

  // 2. Línea central punteada dorada (Trayectoria ideal)
  ctx.strokeStyle = "rgba(253, 224, 71, 0.65)";
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(wps[0].x, wps[0].y);
  for(var k = 1; k < wps.length; k++) ctx.lineTo(wps[k].x, wps[k].y);
  ctx.stroke();
  ctx.setLineDash([]);

  // 3. Vértices de waypoints (pequeños nodos guía)
  for(var m = 1; m < wps.length - 1; m++){
    ctx.fillStyle = "rgba(253, 224, 71, 0.5)";
    ctx.beginPath();
    ctx.arc(wps[m].x, wps[m].y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Trazo recorrido por el usuario (Color según pulso)
  var userTrail = lapidaryMinigameState.traveledPoints || [];
  if(userTrail.length > 1){
    ctx.lineWidth = 3.5;
    for(var u = 1; u < userTrail.length; u++){
      var pA = userTrail[u - 1];
      var pB = userTrail[u];
      ctx.strokeStyle = pB.isDeviating ? "#EF4444" : "#FDE047";
      ctx.beginPath();
      ctx.moveTo(pA.x, pA.y);
      ctx.lineTo(pB.x, pB.y);
      ctx.stroke();
    }
  }

  // 5. Nodo Inicio (Verde Esmeralda)
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

  // 6. Nodo Meta (Ámbar Dorado)
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

  // 7. Retícula en la punta de corte del usuario
  if(userPt && lapidaryMinigameState.currentSlideActive){
    var isDev = (lapidaryMinigameState.lastDeviated === true);
    ctx.strokeStyle = isDev ? "#EF4444" : "#FDE047";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(userPt.x, userPt.y, 9, 0, Math.PI * 2);
    ctx.stroke();

    // Cruz de pulso
    ctx.beginPath();
    ctx.moveTo(userPt.x - 12, userPt.y); ctx.lineTo(userPt.x + 12, userPt.y);
    ctx.moveTo(userPt.x, userPt.y - 12); ctx.lineTo(userPt.x, userPt.y + 12);
    ctx.stroke();
  }
}

function updateLiveSlideHUD(precision, progress){
  var precEl = document.getElementById("lapidaryLivePrecision");
  var progEl = document.getElementById("lapidaryLiveProgress");
  var ptsEl = document.getElementById("lapidaryLivePoints");

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
}

function initLapidarySlideStage(){
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
  lapidaryMinigameState.lastSlidePos = null;
  lapidaryMinigameState.lastDeviated = false;

  var banner = document.getElementById("lapidarySlideBanner");
  if(banner) banner.classList.add("hidden");

  drawSlideGuide(ctx, curSlide, null);

  function getCanvasCoords(clientX, clientY){
    var rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function handleSlideStart(clientX, clientY){
    var pt = getCanvasCoords(clientX, clientY);
    var wps = curSlide.waypoints || [{ x: curSlide.x1, y: curSlide.y1 }, { x: curSlide.x2, y: curSlide.y2 }];
    var start = wps[0];
    var dStart = Math.hypot(pt.x - start.x, pt.y - start.y);

    if(dStart <= 35){
      lapidaryMinigameState.currentSlideActive = true;
      lapidaryMinigameState.slideSamples = 0;
      lapidaryMinigameState.slideDeviations = 0;
      lapidaryMinigameState.slideProgress = 0;
      lapidaryMinigameState.slidePrecision = 100;
      lapidaryMinigameState.traveledPoints = [{ x: start.x, y: start.y, isDeviating: false }];
      lapidaryMinigameState.pathProgressIdx = 0;
      lapidaryMinigameState.lastSlidePos = pt;
      lapidaryMinigameState.lastDeviated = false;

      playSlideCutWhir();
      drawSlideGuide(ctx, curSlide, pt);
      updateLiveSlideHUD(100, 0);
    }
  }

  function handleSlideMove(clientX, clientY){
    if(!lapidaryMinigameState.currentSlideActive) return;
    var pt = getCanvasCoords(clientX, clientY);
    var wps = curSlide.waypoints || [{ x: curSlide.x1, y: curSlide.y1 }, { x: curSlide.x2, y: curSlide.y2 }];
    var totalSegments = wps.length - 1;

    // Proyección sobre el polyline
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

    var tolerance = curSlide.tolerance || 10;
    var isDeviating = (bestDist > tolerance);
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

    // Precisión de pulso calculada dinámicamente
    var devRate = lapidaryMinigameState.slideDeviations / Math.max(1, lapidaryMinigameState.slideSamples);
    var precision = Math.max(25, Math.min(100, Math.round(100 - (devRate * 175))));
    lapidaryMinigameState.slidePrecision = precision;

    lapidaryMinigameState.traveledPoints.push({ x: pt.x, y: pt.y, isDeviating: isDeviating });
    if(lapidaryMinigameState.traveledPoints.length > 250){
      lapidaryMinigameState.traveledPoints.shift();
    }

    drawSlideGuide(ctx, curSlide, pt);
    updateLiveSlideHUD(precision, progressPct);

    // Meta final alcanzada (progressPct >= 0.95)
    if(progressPct >= 0.95){
      finishCurrentSlide(ctx, curSlide);
    }
  }

  function handleSlideEnd(){
    if(!lapidaryMinigameState.currentSlideActive) return;
    lapidaryMinigameState.currentSlideActive = false;
    if(lapidaryMinigameState.slideProgress < 0.92){
      showToast("¡Pulso interrumpido! Vuelve a trazar desde el INICIO verde.", "warning");
      drawSlideGuide(ctx, curSlide, null);
      updateLiveSlideHUD(lapidaryMinigameState.slidePrecision, 0);
    }
  }

  canvas.onmousedown = function(e){ handleSlideStart(e.clientX, e.clientY); };
  window.onmousemove = function(e){
    if(lapidaryMinigameState.active && lapidaryMinigameState.phase === 2){
      handleSlideMove(e.clientX, e.clientY);
    }
  };
  window.onmouseup = function(){ handleSlideEnd(); };

  canvas.ontouchstart = function(e){
    if(e.touches && e.touches[0]){
      handleSlideStart(e.touches[0].clientX, e.touches[0].clientY);
    }
    e.preventDefault();
  };
  canvas.ontouchmove = function(e){
    if(lapidaryMinigameState.isScratching || lapidaryMinigameState.currentSlideActive){
      if(e.touches && e.touches[0]){
        handleSlideMove(e.touches[0].clientX, e.touches[0].clientY);
      }
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

  var precision = lapidaryMinigameState.slidePrecision || 85;
  lapidaryMinigameState.slideScores.push(precision);

  playSlideSuccess();
  if(typeof triggerBg3Haptic === "function") triggerBg3Haptic("crit");

  // Banner de Celebración con puntos y porcentajes
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
    return '<button type="button" class="f-pill add-stone-color-pill ' + (idx === 0 ? 'active' : '') + '" data-color="' + fam.id + '" style="border-color:' + fam.hex + ';">' +
      fam.icon + ' ' + fam.name + ' (' + fam.gema + ')' +
    '</button>';
  }).join('');

  var origins = ["Minas / Cuevas", "Comercio / Compra"];
  var originPills = origins.map(function(org, idx){
    return '<button type="button" class="f-pill add-stone-origin-pill ' + (idx === 0 ? 'active' : '') + '" data-origin="' + org + '">' +
      (org.includes("Minas") ? "⛏️ " : "🪙 ") + org +
    '</button>';
  }).join('');

  var html = '<h2>➕ Nueva Piedra en Bruto<button type="button" data-action="close-add-stone-modal" aria-label="Cerrar">&times;</button></h2>' +
    '<div class="field">' +
      '<label>Familia / Color de la Gema</label>' +
      '<div class="filter-pills" id="addStoneColors" style="flex-wrap:wrap;gap:5px;margin-top:4px;">' + colorPills + '</div>' +
    '</div>' +
    '<div class="field" style="margin-top:12px;">' +
      '<label>Origen del Mineral</label>' +
      '<div class="filter-pills" id="addStoneOrigins" style="flex-wrap:wrap;gap:5px;margin-top:4px;">' + originPills + '</div>' +
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
