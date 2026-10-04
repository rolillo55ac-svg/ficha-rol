// Taller de Lapidario y Piedras Mágicas — Krysalis
// Web Audio procedimental + Minijuego interactivo de 3 Fases (Limpieza con Vetas, Slides de Corte, Sweet Spot) + Cálculo de Probabilidad de Rotura

var lapidaryMinigameState = {
  active: false,
  charId: null,
  stoneId: null,
  phase: 1, // 1: Limpieza selectiva, 2: Slides de corte lineal, 3: Sweet spot timing, 4: Resumen y rotura

  // Fase 1: Limpieza Selectiva (Zonas permitidas vs Vetas Frágiles)
  cleanPct: 0,
  fragileHits: 0,
  maxFragileHits: 5,
  phase1Score: 100,
  fragileVeins: [
    { x: 90,  y: 110, r: 24, label: "Fisura A" },
    { x: 210, y: 130, r: 24, label: "Fisura B" },
    { x: 150, y: 220, r: 26, label: "Fisura C" }
  ],
  isScratching: false,
  lastScrapeSound: 0,

  // Fase 2: Slides de Corte Guiado (Deslizamiento continuo)
  slidePass: 1,
  maxSlidePasses: 3,
  slideScores: [],
  currentSlideActive: false,
  slideSamples: 0,
  slideDeviations: 0,
  slideProgress: 0, // 0 a 1
  slidePoints: [
    { id: 1, name: "Corte Longitudinal de Cintura", x1: 50,  y1: 150, x2: 250, y2: 150, desc: "Desliza de izquierda a derecha por la cintura central." },
    { id: 2, name: "Biselado de Corona Superior",  x1: 65,  y1: 225, x2: 235, y2: 75,  desc: "Corte diagonal ascendente de faceta superior." },
    { id: 3, name: "Facetado de Pabellón Inferior",x1: 65,  y1: 75,  x2: 235, y2: 225, desc: "Corte diagonal descendente de pabellón." }
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
  lapidaryMinigameState.cleanPct = 0;
  lapidaryMinigameState.fragileHits = 0;
  lapidaryMinigameState.phase1Score = 100;
  lapidaryMinigameState.isScratching = false;

  // Reset Fase 2
  lapidaryMinigameState.slidePass = 1;
  lapidaryMinigameState.slideScores = [];
  lapidaryMinigameState.currentSlideActive = false;
  lapidaryMinigameState.slideSamples = 0;
  lapidaryMinigameState.slideDeviations = 0;
  lapidaryMinigameState.slideProgress = 0;
  lapidaryMinigameState.lastSlidePos = null;
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
  // FASE 1: LIMPIEZA SELECTIVA (Vetas Frágiles)
  // ==========================================
  if(lapidaryMinigameState.phase === 1){
    var integrity = Math.max(0, 100 - (lapidaryMinigameState.fragileHits * 14));
    html += '<div class="lapidary-phase-body">' +
      '<div class="lapidary-instructions">' +
        '<b>Fase 1: Desbaste y Limpieza Selectiva</b><br>' +
        'Raspa la costra rocosa para exponer el cristal (Objetivo: 65%+).<br>' +
        '<span style="color:#F87171;font-weight:600;">⚠️ ¡Cuidado! Evita raspar sobre las fisuras rojas; dañan la integridad estructural.</span>' +
      '</div>' +

      '<div class="lapidary-scratch-stage" id="lapidaryScratchStage">' +
        '<div class="lapidary-gem-underlay" id="lapidaryGemUnderlay">' +
          '<div class="lapidary-gem-silhouette" style="background:radial-gradient(circle at 40% 40%, ' + family.hex + ' 10%, ' + family.glow + ' 60%, rgba(0,0,0,0.8) 100%);box-shadow:0 0 35px ' + family.glow + ';">' +
            '<div class="lapidary-gem-shimmer"></div>' +
            '<span class="lapidary-gem-big-icon">' + family.icon + '</span>' +
          '</div>' +
        '</div>' +
        '<canvas id="lapidaryScratchCanvas" width="300" height="300" class="lapidary-scratch-canvas"></canvas>' +
        '<div class="lapidary-particles-container" id="lapidaryParticles"></div>' +
      '</div>' +

      '<div class="lapidary-meters-row">' +
        '<div class="lapidary-meter-box">' +
          '<span class="lapidary-meter-label">Limpieza Ganga: ' + lapidaryMinigameState.cleanPct + '% / 65%</span>' +
          '<div class="lapidary-meter-track"><div class="lapidary-meter-fill clean" id="lapidaryCleanBar" style="width:' + lapidaryMinigameState.cleanPct + '%;"></div></div>' +
        '</div>' +
        '<div class="lapidary-meter-box">' +
          '<span class="lapidary-meter-label">Integridad: <b id="lapidaryIntegrityText">' + integrity + '%</b></span>' +
          '<div class="lapidary-meter-track"><div class="lapidary-meter-fill integrity ' + (integrity < 50 ? 'danger' : (integrity < 75 ? 'warning' : '')) + '" id="lapidaryIntegrityBar" style="width:' + integrity + '%;"></div></div>' +
        '</div>' +
      '</div>' +

      '<div class="lapidary-action-footer">' +
        '<button type="button" class="btn-solid-gold lapidary-btn-advance" id="lapidaryBtnPhase2" data-action="advance-to-slide-cuts" ' + (lapidaryMinigameState.cleanPct >= 65 ? '' : 'disabled') + '>' +
          (lapidaryMinigameState.cleanPct >= 65 ? '✨ Ganga Removida (Score: ' + lapidaryMinigameState.phase1Score + '%) Avanzar a Cortes ➡️' : 'Despeja la superficie sin tocar las fisuras...') +
        '</button>' +
      '</div>' +
    '</div>';
  }

  // ==========================================
  // FASE 2: CORTES GUIADOS POR DESLIZAMIENTO (Slides)
  // ==========================================
  else if(lapidaryMinigameState.phase === 2){
    var curSlide = lapidaryMinigameState.slidePoints[lapidaryMinigameState.slidePass - 1] || lapidaryMinigameState.slidePoints[0];
    html += '<div class="lapidary-phase-body">' +
      '<div class="lapidary-instructions">' +
        '<b>Fase 2: Trazado y Cortes Guiados a lo Largo</b><br>' +
        'Presiona sobre el <b>Punto Verde (Inicio)</b> y <u>desliza el dedo o ratón sin salirte de la línea</u> hasta la <b>Meta Dorada</b>.' +
      '</div>' +

      '<div class="lapidary-slide-stage" id="lapidarySlideStage">' +
        '<div class="lapidary-gem-underlay">' +
          '<div class="lapidary-gem-silhouette" style="background:radial-gradient(circle at 40% 40%, ' + family.hex + ' 10%, ' + family.glow + ' 60%, rgba(0,0,0,0.8) 100%);box-shadow:0 0 35px ' + family.glow + ';opacity:0.4;"></div>' +
        '</div>' +
        '<canvas id="lapidarySlideCanvas" width="300" height="300" class="lapidary-slide-canvas"></canvas>' +
        '<div class="lapidary-particles-container" id="lapidarySlideParticles"></div>' +
      '</div>' +

      '<div class="lapidary-slide-header-bar">' +
        '<div class="lapidary-pass-tag">' + esc(curSlide.name) + ' (' + lapidaryMinigameState.slidePass + ' / ' + lapidaryMinigameState.maxSlidePasses + ')</div>' +
        '<div class="lapidary-slide-desc-hint">' + esc(curSlide.desc) + '</div>' +
      '</div>' +

      '<div class="lapidary-hits-summary" style="margin-top:10px;">' +
        '<div class="lapidary-hit-slot ' + (lapidaryMinigameState.slideScores[0] ? 'hit' : '') + '">Corte 1: ' + (lapidaryMinigameState.slideScores[0] ? lapidaryMinigameState.slideScores[0] + '%' : '—') + '</div>' +
        '<div class="lapidary-hit-slot ' + (lapidaryMinigameState.slideScores[1] ? 'hit' : '') + '">Corte 2: ' + (lapidaryMinigameState.slideScores[1] ? lapidaryMinigameState.slideScores[1] + '%' : '—') + '</div>' +
        '<div class="lapidary-hit-slot ' + (lapidaryMinigameState.slideScores[2] ? 'hit' : '') + '">Corte 3: ' + (lapidaryMinigameState.slideScores[2] ? lapidaryMinigameState.slideScores[2] + '%' : '—') + '</div>' +
      '</div>' +

      '<div class="lapidary-action-footer" style="margin-top:14px;">' +
        (lapidaryMinigameState.slidePass > lapidaryMinigameState.maxSlidePasses ?
          '<button type="button" class="btn-solid-gold lapidary-btn-advance pulse-glow" data-action="advance-to-facetting">💎 ¡Cortes Listos! (Precisión: ' + lapidaryMinigameState.phase2Score + '%) Avanzar a Sweet Spot ➡️</button>' :
          '<button type="button" class="btn-compact" disabled style="width:100%;padding:9px;">Desliza el dedo o ratón siguiendo la línea...</button>'
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
          '<div class="lapidary-score-header"><span>🧹 Limpieza Selectiva</span><b>' + lapidaryMinigameState.phase1Score + '%</b></div>' +
          '<div class="lapidary-mini-meter"><div class="lapidary-mini-meter-fill" style="width:' + lapidaryMinigameState.phase1Score + '%;"></div></div>' +
          '<div class="lapidary-score-sub">' + (lapidaryMinigameState.fragileHits > 0 ? lapidaryMinigameState.fragileHits + ' fisuras tocadas' : 'Cero fisuras') + '</div>' +
        '</div>' +

        '<div class="lapidary-score-card">' +
          '<div class="lapidary-score-header"><span>✂️ Precisión de Slides</span><b>' + lapidaryMinigameState.phase2Score + '%</b></div>' +
          '<div class="lapidary-mini-meter"><div class="lapidary-mini-meter-fill" style="width:' + lapidaryMinigameState.phase2Score + '%;"></div></div>' +
          '<div class="lapidary-score-sub">Media de 3 trazos</div>' +
        '</div>' +

        '<div class="lapidary-score-card">' +
          '<div class="lapidary-score-header"><span>⏱️ Sweet Spot Timing</span><b>' + lapidaryMinigameState.phase3Score + '%</b></div>' +
          '<div class="lapidary-mini-meter"><div class="lapidary-mini-meter-fill" style="width:' + lapidaryMinigameState.phase3Score + '%;"></div></div>' +
          '<div class="lapidary-score-sub">' + lapidaryMinigameState.timingHits + ' de 3 aciertos</div>' +
        '</div>' +
      '</div>' +

      // Tarjeta de Riesgo de Rotura (Punto 3 del usuario)
      '<div class="lapidary-risk-card ' + riskClass + '">' +
        '<div class="lapidary-risk-header">' +
          '<span class="lapidary-risk-title">💥 Probabilidad de Rotura / Fractura:</span>' +
          '<span class="lapidary-risk-val">' + lapidaryMinigameState.breakRisk + '%</span>' +
        '</div>' +
        '<div class="lapidary-risk-track">' +
          '<div class="lapidary-risk-fill" style="width:' + lapidaryMinigameState.breakRisk + '%;"></div>' +
        '</div>' +
        '<div class="lapidary-risk-desc">' +
          '<b>' + riskLabel + '</b> &bull; Herramienta: ' + esc(tier.name) + ' &bull; Puntuación Global: <b>' + lapidaryMinigameState.totalArtisanScore + '/100</b>' +
        '</div>' +
      '</div>' +

      '<div class="lapidary-roll-bonus-badge">' +
        '✨ Bono de Maestría a la Tirada: <b>+' + lapidaryMinigameState.rollBonus + '</b>' +
      '</div>' +

      '<div class="lapidary-action-footer" style="margin-top:14px;">' +
        '<button type="button" class="btn-solid-gold lapidary-btn-roll pulse-glow" data-action="lapidary-launch-roll">' +
          '🎲 Realizar Tirada Final (Riesgo: ' + lapidaryMinigameState.breakRisk + '%)' +
        '</button>' +
      '</div>' +
    '</div>';
  }

  modal.innerHTML = html;
}

/* ==========================================================================
   4. CONTROL DE CANVAS: FASE 1 (LIMPIEZA SELECTIVA Y VETAS FRÁGILES)
   ========================================================================== */

function initLapidaryScratchCanvas(){
  var canvas = document.getElementById("lapidaryScratchCanvas");
  if(!canvas) return;
  var ctx = canvas.getContext("2d");
  if(!ctx) return;

  var w = canvas.width;
  var h = canvas.height;

  // Pintar costra rocosa de ganga mineral
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#2B241C";
  ctx.fillRect(0, 0, w, h);

  // Textura arenosa
  for(var i = 0; i < 400; i++){
    var rx = Math.random() * w;
    var ry = Math.random() * h;
    var rRad = 2 + Math.random() * 7;
    ctx.fillStyle = (Math.random() > 0.5) ? "#1A140F" : "#3C3227";
    ctx.beginPath();
    ctx.arc(rx, ry, rRad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dibujar Vetas Frágiles Peligrosas (Zonas prohibidas - Punto 1)
  lapidaryMinigameState.fragileVeins.forEach(function(vein){
    // Halo rojizo de advertencia
    var grad = ctx.createRadialGradient(vein.x, vein.y, 4, vein.x, vein.y, vein.r + 6);
    grad.addColorStop(0, "rgba(239, 68, 68, 0.85)");
    grad.addColorStop(0.6, "rgba(220, 38, 38, 0.45)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(vein.x, vein.y, vein.r + 6, 0, Math.PI * 2);
    ctx.fill();

    // Fisuras dentadas
    ctx.strokeStyle = "#FCA5A5";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(vein.x - 14, vein.y - 12);
    ctx.lineTo(vein.x - 3, vein.y);
    ctx.lineTo(vein.x + 12, vein.y - 10);
    ctx.lineTo(vein.x + 15, vein.y + 14);
    ctx.stroke();

    // Símbolo de advertencia
    ctx.fillStyle = "#FEE2E2";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.fillText("⚠️ FISURA", vein.x, vein.y + 16);
  });

  function scratchAt(clientX, clientY){
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;
    var x = (clientX - rect.left) * scaleX;
    var y = (clientY - rect.top) * scaleY;

    // Comprobar colisión con vetas frágiles (Zonas Prohibidas - Requisito 1)
    var hitFragile = false;
    for(var v = 0; v < lapidaryMinigameState.fragileVeins.length; v++){
      var vein = lapidaryMinigameState.fragileVeins[v];
      var d = Math.hypot(x - vein.x, y - vein.y);
      if(d <= vein.r + 10){
        hitFragile = true;
        break;
      }
    }

    if(hitFragile){
      lapidaryMinigameState.fragileHits++;
      playGemFractureTick();
      if(typeof triggerBg3Haptic === "function") triggerBg3Haptic("fumble");
      spawnDangerParticles(clientX - rect.left, clientY - rect.top);

      var stageEl = document.getElementById("lapidaryScratchStage");
      if(stageEl){
        stageEl.classList.add("danger-flash");
        setTimeout(function(){ if(stageEl) stageEl.classList.remove("danger-flash"); }, 200);
      }
    } else {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fill();

      spawnRockDustParticles(clientX - rect.left, clientY - rect.top);

      var now = Date.now();
      if(now - lapidaryMinigameState.lastScrapeSound > 85){
        playLapidaryScrape();
        lapidaryMinigameState.lastScrapeSound = now;
      }
    }

    calculateScratchProgress(ctx, w, h);
  }

  // Eventos de ratón
  canvas.onmousedown = function(e){
    lapidaryMinigameState.isScratching = true;
    scratchAt(e.clientX, e.clientY);
  };
  window.onmousemove = function(e){
    if(lapidaryMinigameState.isScratching && lapidaryMinigameState.active && lapidaryMinigameState.phase === 1){
      scratchAt(e.clientX, e.clientY);
    }
  };
  window.onmouseup = function(){
    lapidaryMinigameState.isScratching = false;
  };

  // Eventos táctiles
  canvas.ontouchstart = function(e){
    if(e.touches && e.touches[0]){
      lapidaryMinigameState.isScratching = true;
      scratchAt(e.touches[0].clientX, e.touches[0].clientY);
    }
    e.preventDefault();
  };
  canvas.ontouchmove = function(e){
    if(lapidaryMinigameState.isScratching && e.touches && e.touches[0]){
      scratchAt(e.touches[0].clientX, e.touches[0].clientY);
    }
    e.preventDefault();
  };
  canvas.ontouchend = function(e){
    lapidaryMinigameState.isScratching = false;
  };
}

function spawnDangerParticles(x, y){
  var container = document.getElementById("lapidaryParticles");
  if(!container) return;

  for(var i = 0; i < 4; i++){
    var p = document.createElement("div");
    p.className = "lapidary-danger-particle";
    p.style.left = (x + (Math.random() - 0.5) * 20) + "px";
    p.style.top = (y + (Math.random() - 0.5) * 20) + "px";
    container.appendChild(p);

    setTimeout((function(el){
      return function(){ if(el.parentNode) el.parentNode.removeChild(el); };
    })(p), 400);
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

function calculateScratchProgress(ctx, w, h){
  var sampleStep = 30;
  var total = 0;
  var cleared = 0;
  var imgData = ctx.getImageData(0, 0, w, h).data;

  for(var y = 20; y < h - 20; y += sampleStep){
    for(var x = 20; x < w - 20; x += sampleStep){
      total++;
      var alphaIdx = (y * w + x) * 4 + 3;
      if(imgData[alphaIdx] < 60){
        cleared++;
      }
    }
  }

  var pct = Math.min(100, Math.round((cleared / total) * 100));
  lapidaryMinigameState.cleanPct = pct;

  var integrity = Math.max(0, 100 - (lapidaryMinigameState.fragileHits * 14));
  var score = Math.max(0, Math.min(100, Math.round((pct * 0.6) + (integrity * 0.4))));
  lapidaryMinigameState.phase1Score = score;

  var bar = document.getElementById("lapidaryCleanBar");
  var integBar = document.getElementById("lapidaryIntegrityBar");
  var integTxt = document.getElementById("lapidaryIntegrityText");
  var btn = document.getElementById("lapidaryBtnPhase2");

  if(bar) bar.style.width = pct + "%";
  if(integBar) {
    integBar.style.width = integrity + "%";
    integBar.className = "lapidary-meter-fill integrity " + (integrity < 50 ? 'danger' : (integrity < 75 ? 'warning' : ''));
  }
  if(integTxt) integTxt.textContent = integrity + "%";

  if(pct >= 65 && btn && btn.disabled){
    btn.disabled = false;
    btn.textContent = "✨ Ganga Removida (Score: " + score + "%) Avanzar a Cortes ➡️";
    btn.classList.add("pulse-glow");
    playGemSweetSpotHit();
    if(typeof triggerBg3Haptic === "function") triggerBg3Haptic("crit");
  }
}

/* ==========================================================================
   5. CONTROL DE SLIDES: FASE 2 (CORTES GUIADOS POR DESLIZAMIENTO - Requisito 2)
   ========================================================================== */

function initLapidarySlideStage(){
  var canvas = document.getElementById("lapidarySlideCanvas");
  if(!canvas) return;
  var ctx = canvas.getContext("2d");
  if(!ctx) return;

  var curSlide = lapidaryMinigameState.slidePoints[lapidaryMinigameState.slidePass - 1] || lapidaryMinigameState.slidePoints[0];
  drawSlideGuide(ctx, curSlide, null);

  lapidaryMinigameState.currentSlideActive = false;
  lapidaryMinigameState.slideSamples = 0;
  lapidaryMinigameState.slideDeviations = 0;
  lapidaryMinigameState.slideProgress = 0;
  lapidaryMinigameState.lastSlidePos = null;

  function getCanvasCoords(clientX, clientY){
    var rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function handleSlideStart(clientX, clientY){
    var pt = getCanvasCoords(clientX, clientY);
    var dStart = Math.hypot(pt.x - curSlide.x1, pt.y - curSlide.y1);
    if(dStart <= 35){
      lapidaryMinigameState.currentSlideActive = true;
      lapidaryMinigameState.slideSamples = 0;
      lapidaryMinigameState.slideDeviations = 0;
      lapidaryMinigameState.lastSlidePos = pt;
      playSlideCutWhir();
      drawSlideGuide(ctx, curSlide, pt);
    }
  }

  function handleSlideMove(clientX, clientY){
    if(!lapidaryMinigameState.currentSlideActive) return;
    var pt = getCanvasCoords(clientX, clientY);

    // Calcular proyección perpendicular sobre el segmento (x1, y1) -> (x2, y2)
    var dx = curSlide.x2 - curSlide.x1;
    var dy = curSlide.y2 - curSlide.y1;
    var lenSq = dx * dx + dy * dy;
    var t = ((pt.x - curSlide.x1) * dx + (pt.y - curSlide.y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));

    var projX = curSlide.x1 + t * dx;
    var projY = curSlide.y1 + t * dy;
    var dist = Math.hypot(pt.x - projX, pt.y - projY);

    lapidaryMinigameState.slideSamples++;
    lapidaryMinigameState.slideProgress = t;

    // Margen de tolerancia de corte: 14px
    if(dist > 14){
      lapidaryMinigameState.slideDeviations++;
      spawnSlideDeviationParticle(pt.x, pt.y);
      if(lapidaryMinigameState.slideSamples % 4 === 0) playGemSweetSpotMiss();
    } else {
      spawnSlideSparkParticle(pt.x, pt.y);
      if(lapidaryMinigameState.slideSamples % 5 === 0) playSlideCutWhir();
    }

    drawSlideGuide(ctx, curSlide, pt);

    // Si llega a la meta final (t >= 0.94)
    if(t >= 0.94){
      finishCurrentSlide(ctx, curSlide);
    }
  }

  function handleSlideEnd(){
    if(!lapidaryMinigameState.currentSlideActive) return;
    lapidaryMinigameState.currentSlideActive = false;
    // Si soltó antes del final
    if(lapidaryMinigameState.slideProgress < 0.92){
      showToast("¡Corte incompleto! Vuelve a deslizar desde el punto verde hasta el final.", "warning");
      drawSlideGuide(ctx, curSlide, null);
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
    if(e.touches && e.touches[0]){
      handleSlideMove(e.touches[0].clientX, e.touches[0].clientY);
    }
    e.preventDefault();
  };
  canvas.ontouchend = function(e){ handleSlideEnd(); };
}

function drawSlideGuide(ctx, slide, userPt){
  var w = ctx.canvas.width;
  var h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);

  // 1. Canal de corte guía (ancho 28px)
  ctx.strokeStyle = "rgba(176, 141, 87, 0.25)";
  ctx.lineWidth = 28;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(slide.x1, slide.y1);
  ctx.lineTo(slide.x2, slide.y2);
  ctx.stroke();

  // 2. Línea central dorada punteada
  ctx.strokeStyle = "rgba(253, 224, 71, 0.75)";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(slide.x1, slide.y1);
  ctx.lineTo(slide.x2, slide.y2);
  ctx.stroke();
  ctx.setLineDash([]);

  // 3. Trazo cortado por el usuario
  if(userPt && lapidaryMinigameState.currentSlideActive){
    ctx.strokeStyle = "#FDE047";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(slide.x1, slide.y1);
    ctx.lineTo(userPt.x, userPt.y);
    ctx.stroke();
  }

  // 4. Nodo Inicio (Verde)
  ctx.fillStyle = "#10B981";
  ctx.beginPath();
  ctx.arc(slide.x1, slide.y1, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#A7F3D0";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 9px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("INICIO", slide.x1, slide.y1);

  // 5. Nodo Fin (Meta Dorada)
  ctx.fillStyle = "#F59E0B";
  ctx.beginPath();
  ctx.arc(slide.x2, slide.y2, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#FEF08A";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#120D0A";
  ctx.fillText("META", slide.x2, slide.y2);
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

  var total = Math.max(1, lapidaryMinigameState.slideSamples);
  var dev = lapidaryMinigameState.slideDeviations;
  var precision = Math.max(30, Math.min(100, Math.round(100 - (dev / total * 130))));

  lapidaryMinigameState.slideScores.push(precision);
  playSlideSuccess();
  if(typeof triggerBg3Haptic === "function") triggerBg3Haptic("crit");

  lapidaryMinigameState.slidePass++;

  if(lapidaryMinigameState.slidePass <= lapidaryMinigameState.maxSlidePasses){
    renderLapidaryModalContent();
    requestAnimationFrame(function(){ initLapidarySlideStage(); });
  } else {
    // Media de los 3 cortes
    var sum = lapidaryMinigameState.slideScores.reduce(function(a, b){ return a + b; }, 0);
    lapidaryMinigameState.phase2Score = Math.round(sum / lapidaryMinigameState.slideScores.length);
    renderLapidaryModalContent();
  }
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
