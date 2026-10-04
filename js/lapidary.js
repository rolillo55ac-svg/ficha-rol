// Taller de Lapidario y Piedras Mágicas — Krysalis
// Web Audio procedimental + Minijuego interactivo de 2 fases + Integración de tiradas

var lapidaryMinigameState = {
  active: false,
  charId: null,
  stoneId: null,
  phase: 1, // 1: raspado/desbaste, 2: facetado/timing, 3: tirada/resultado
  cleanPct: 0,
  isScratching: false,
  lastScrapeSound: 0,
  timingPass: 1,
  maxPasses: 3,
  timingHits: 0,
  cursorPos: 0.5,
  cursorDir: 1,
  cursorSpeed: 0.022,
  sweetSpotStart: 0.38,
  sweetSpotEnd: 0.62,
  animId: null,
  passResults: []
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

// Raspado / cepillado arenoso de la costra de roca
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
    bpf.frequency.setValueAtTime(1600 + Math.random() * 600, ctx.currentTime);
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

// Fricción / desbaste giratorio del disco de corte
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

// Fallo en Sweet Spot: Golpe sordo / impacto seco
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
    // C6, E6, G6, B6, C7
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
    osc2.frequency.setValueAtTime(338, now); // Batimiento disonante

    osc1.frequency.exponentialRampToValueAtTime(70, now + 0.45);
    osc2.frequency.exponentialRampToValueAtTime(65, now + 0.45);

    gain.gain.setValueAtTime(0.25, now);
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
   3. MINIJUEGO DE PULIDO DE GEMAS (2 FASES)
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
  lapidaryMinigameState.cleanPct = 0;
  lapidaryMinigameState.isScratching = false;
  lapidaryMinigameState.timingPass = 1;
  lapidaryMinigameState.timingHits = 0;
  lapidaryMinigameState.passResults = [];
  lapidaryMinigameState.cursorPos = 0.5;
  lapidaryMinigameState.cursorDir = 1;
  lapidaryMinigameState.cursorSpeed = 0.024;

  var overlay = document.getElementById("lapidaryModalOverlay");
  var modal = document.getElementById("lapidaryModal");
  if(!overlay || !modal) return;

  renderLapidaryModalContent();
  overlay.classList.remove("hidden");

  // Iniciar fase 1 en el siguiente frame para que el canvas tenga dimensiones reales
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
  var intVal = num(c.attrs.inteligencia, 1);
  var skillBonus = (c.skillBonus && c.skillBonus["Piedras mágicas"]) ? num(c.skillBonus["Piedras mágicas"], 0) : 0;

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

  // Barra de progreso de fases
  html += '<div class="lapidary-phase-stepper">' +
    '<div class="lapidary-step ' + (lapidaryMinigameState.phase === 1 ? 'current' : (lapidaryMinigameState.phase > 1 ? 'completed' : '')) + '">' +
      '<div class="lapidary-step-num">1</div>' +
      '<div class="lapidary-step-label">Limpieza y Desbaste</div>' +
    '</div>' +
    '<div class="lapidary-step-line ' + (lapidaryMinigameState.phase > 1 ? 'active' : '') + '"></div>' +
    '<div class="lapidary-step ' + (lapidaryMinigameState.phase === 2 ? 'current' : (lapidaryMinigameState.phase > 2 ? 'completed' : '')) + '">' +
      '<div class="lapidary-step-num">2</div>' +
      '<div class="lapidary-step-label">Facetado y Simetría</div>' +
    '</div>' +
    '<div class="lapidary-step-line ' + (lapidaryMinigameState.phase > 2 ? 'active' : '') + '"></div>' +
    '<div class="lapidary-step ' + (lapidaryMinigameState.phase === 3 ? 'current' : '') + '">' +
      '<div class="lapidary-step-num">3</div>' +
      '<div class="lapidary-step-label">Resolución y Calidad</div>' +
    '</div>' +
  '</div>';

  // Contenido según la fase activa
  if(lapidaryMinigameState.phase === 1){
    html += '<div class="lapidary-phase-body">' +
      '<div class="lapidary-instructions">' +
        '<b>Fase 1: Desbaste y Raspado de Costra</b><br>' +
        'Arrastra el ratón o el dedo sobre la roca para eliminar la ganga rocosa y despejar el núcleo cristalino (Objetivo: 70%+).' +
      '</div>' +

      '<div class="lapidary-scratch-stage">' +
        '<div class="lapidary-gem-underlay" id="lapidaryGemUnderlay">' +
          '<div class="lapidary-gem-silhouette" style="background:radial-gradient(circle at 40% 40%, ' + family.hex + ' 10%, ' + family.glow + ' 60%, rgba(0,0,0,0.8) 100%);box-shadow:0 0 35px ' + family.glow + ';">' +
            '<div class="lapidary-gem-shimmer"></div>' +
            '<span class="lapidary-gem-big-icon">' + family.icon + '</span>' +
          '</div>' +
        '</div>' +
        '<canvas id="lapidaryScratchCanvas" width="300" height="300" class="lapidary-scratch-canvas"></canvas>' +
        '<div class="lapidary-particles-container" id="lapidaryParticles"></div>' +
      '</div>' +

      '<div class="lapidary-progress-bar-wrap">' +
        '<div class="lapidary-progress-bar-fill" id="lapidaryCleanBar" style="width:' + lapidaryMinigameState.cleanPct + '%;"></div>' +
        '<div class="lapidary-progress-text" id="lapidaryCleanText">Limpieza: ' + lapidaryMinigameState.cleanPct + '% / 70%</div>' +
      '</div>' +

      '<div class="lapidary-action-footer">' +
        '<button type="button" class="btn-solid-gold lapidary-btn-advance" id="lapidaryBtnPhase2" data-action="advance-to-facetting" ' + (lapidaryMinigameState.cleanPct >= 70 ? '' : 'disabled') + '>' +
          (lapidaryMinigameState.cleanPct >= 70 ? '✨ ¡Núcleo Expuesto! Avanzar al Facetado ➡️' : 'Limpia la superficie para continuar...') +
        '</button>' +
      '</div>' +
    '</div>';
  } else if(lapidaryMinigameState.phase === 2){
    var passTitles = [
      "Paso 1: Desbastado de Cintura y Culet",
      "Paso 2: Facetado de Corona y Aristas",
      "Paso 3: Pulido Fino de la Tabla Superior"
    ];
    var curPassTitle = passTitles[lapidaryMinigameState.timingPass - 1] || "Facetado";

    html += '<div class="lapidary-phase-body">' +
      '<div class="lapidary-instructions">' +
        '<b>Fase 2: Corte de Facetas y Sweet Spot</b><br>' +
        'Presiona el gatillo de corte cuando el puntero oscilante cruce la <b>Zona Dorada Central</b> para obtener bonificadores de maestría (+1 por acierto).' +
      '</div>' +

      '<div class="lapidary-timing-stage">' +
        '<div class="lapidary-pass-indicator">' +
          '<span class="lapidary-pass-tag">' + curPassTitle + '</span>' +
          '<span class="lapidary-pass-badge">Corte ' + lapidaryMinigameState.timingPass + ' de ' + lapidaryMinigameState.maxPasses + '</span>' +
        '</div>' +

        '<div class="lapidary-gauge-track" id="lapidaryGaugeTrack">' +
          '<div class="lapidary-sweet-spot" style="left:' + (lapidaryMinigameState.sweetSpotStart * 100) + '%;width:' + ((lapidaryMinigameState.sweetSpotEnd - lapidaryMinigameState.sweetSpotStart) * 100) + '%;">' +
            '<span class="lapidary-sweet-label">SWEET SPOT</span>' +
          '</div>' +
          '<div class="lapidary-gauge-cursor" id="lapidaryGaugeCursor" style="left:' + (lapidaryMinigameState.cursorPos * 100) + '%;"></div>' +
        '</div>' +

        '<div class="lapidary-timing-feedback" id="lapidaryTimingFeedback">Apunta con precisión...</div>' +

        '<div class="lapidary-hits-summary">' +
          '<div class="lapidary-hit-slot ' + (lapidaryMinigameState.passResults[0] === true ? 'hit' : (lapidaryMinigameState.passResults[0] === false ? 'miss' : '')) + '">Paso 1</div>' +
          '<div class="lapidary-hit-slot ' + (lapidaryMinigameState.passResults[1] === true ? 'hit' : (lapidaryMinigameState.passResults[1] === false ? 'miss' : '')) + '">Paso 2</div>' +
          '<div class="lapidary-hit-slot ' + (lapidaryMinigameState.passResults[2] === true ? 'hit' : (lapidaryMinigameState.passResults[2] === false ? 'miss' : '')) + '">Paso 3</div>' +
        '</div>' +
      '</div>' +

      '<div class="lapidary-action-footer">' +
        (lapidaryMinigameState.timingPass <= lapidaryMinigameState.maxPasses ?
          '<button type="button" class="btn-solid-gold lapidary-btn-cut" data-action="lapidary-trigger-cut">⚡ CORTAR FACETA (' + lapidaryMinigameState.timingPass + '/' + lapidaryMinigameState.maxPasses + ')</button>' :
          '<button type="button" class="btn-solid-gold lapidary-btn-roll" data-action="lapidary-launch-roll">🎲 Realizar Tirada de Talla (Bono Timing: +' + lapidaryMinigameState.timingHits + ')</button>'
        ) +
      '</div>' +
    '</div>';
  }

  modal.innerHTML = html;
}

/* ==========================================================================
   4. CONTROL DE CANVAS: FASE 1 (RASPADO)
   ========================================================================== */

function initLapidaryScratchCanvas(){
  var canvas = document.getElementById("lapidaryScratchCanvas");
  if(!canvas) return;
  var ctx = canvas.getContext("2d");
  if(!ctx) return;

  var w = canvas.width;
  var h = canvas.height;

  // Pintar capa de costra rocosa / ganga mineral
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#2D261E";
  ctx.fillRect(0, 0, w, h);

  // Textura rocosa con ruido procedural
  for(var i = 0; i < 450; i++){
    var rx = Math.random() * w;
    var ry = Math.random() * h;
    var rRad = 2 + Math.random() * 8;
    ctx.fillStyle = (Math.random() > 0.5) ? "#1E1812" : "#3D342A";
    ctx.beginPath();
    ctx.arc(rx, ry, rRad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Grietas de corteza
  ctx.strokeStyle = "#16120D";
  ctx.lineWidth = 2.5;
  for(var g = 0; g < 6; g++){
    ctx.beginPath();
    var cx = Math.random() * w;
    var cy = Math.random() * h;
    ctx.moveTo(cx, cy);
    for(var s = 0; s < 4; s++){
      cx += (Math.random() - 0.5) * 50;
      cy += (Math.random() - 0.5) * 50;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  // Borde rugoso
  ctx.strokeStyle = "#4A3E31";
  ctx.lineWidth = 1;
  ctx.strokeRect(4, 4, w - 8, h - 8);

  function scratchAt(clientX, clientY){
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;
    var x = (clientX - rect.left) * scaleX;
    var y = (clientY - rect.top) * scaleY;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 24, 0, Math.PI * 2);
    ctx.fill();

    // Spawn partículas de polvo de roca
    spawnRockDustParticles(clientX - rect.left, clientY - rect.top);

    // Sonido de raspado
    var now = Date.now();
    if(now - lapidaryMinigameState.lastScrapeSound > 85){
      playLapidaryScrape();
      lapidaryMinigameState.lastScrapeSound = now;
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

  // Eventos táctiles (móvil y tablet)
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
  // Muestreo por rejilla 10x10 para máximo rendimiento
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

  var bar = document.getElementById("lapidaryCleanBar");
  var txt = document.getElementById("lapidaryCleanText");
  var btn = document.getElementById("lapidaryBtnPhase2");

  if(bar) bar.style.width = pct + "%";
  if(txt) txt.textContent = "Limpieza: " + pct + "% / 70%";

  if(pct >= 70 && btn && btn.disabled){
    btn.disabled = false;
    btn.textContent = "✨ ¡Núcleo Expuesto! Avanzar al Facetado ➡️";
    btn.classList.add("pulse-glow");
    playGemSweetSpotHit();
    if(typeof triggerBg3Haptic === "function") triggerBg3Haptic("crit");
  }
}

/* ==========================================================================
   5. CONTROL DE TIMING: FASE 2 (SWEET SPOT OSCILANTE)
   ========================================================================== */

function startLapidaryTimingLoop(){
  if(lapidaryMinigameState.animId){
    cancelAnimationFrame(lapidaryMinigameState.animId);
  }

  function loop(){
    if(!lapidaryMinigameState.active || lapidaryMinigameState.phase !== 2){
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
  if(lapidaryMinigameState.phase !== 2) return;
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
      feedback.textContent = "¡Corte Impecable! (+1 Bono de Facetado)";
      feedback.className = "lapidary-timing-feedback success";
    }
  } else {
    lapidaryMinigameState.passResults.push(false);
    playGemSweetSpotMiss();
    if(typeof triggerBg3Haptic === "function") triggerBg3Haptic("fumble");
    if(feedback){
      feedback.textContent = "Corte Desviado (+0 Bono)";
      feedback.className = "lapidary-timing-feedback miss";
    }
  }

  lapidaryMinigameState.timingPass++;

  // Aumentar ligeramente la velocidad para el siguiente corte (tensión rítmica)
  lapidaryMinigameState.cursorSpeed = 0.024 + (lapidaryMinigameState.timingPass * 0.007);

  // Redibujar modal para actualizar slots e indicadores
  renderLapidaryModalContent();
  if(lapidaryMinigameState.timingPass <= lapidaryMinigameState.maxPasses){
    startLapidaryTimingLoop();
  } else {
    // Todos los cortes completados
    playLapidaryGrind();
    var fbFinal = document.getElementById("lapidaryTimingFeedback");
    if(fbFinal){
      fbFinal.textContent = "¡Facetado Completado! Aciertos: " + lapidaryMinigameState.timingHits + " / 3 (+ " + lapidaryMinigameState.timingHits + " a la tirada)";
      fbFinal.className = "lapidary-timing-feedback success";
    }
  }
}

/* ==========================================================================
   6. FASE 3: INTEGRACIÓN DE TIRADA D10 CON DESGLOSE DETALLADO DE MODIFICADORES
   ========================================================================== */

function launchLapidaryRollModal(){
  var c = (state.characters || []).find(function(ch){ return ch.id === lapidaryMinigameState.charId; });
  var stone = c ? (c.stones || []).find(function(st){ return st.id === lapidaryMinigameState.stoneId; }) : null;
  if(!c || !stone) return;

  var family = getStoneFamily(stone.color);
  var tier = getLapidaryTier(c.lapidaryTier);

  var intVal = num(c.attrs.inteligencia, 1);
  var skillBonus = (c.skillBonus && c.skillBonus["Piedras mágicas"]) ? num(c.skillBonus["Piedras mágicas"], 0) : 0;
  var tierBonus = tier.bonusRoll || 0;
  var timingHits = lapidaryMinigameState.timingHits || 0;

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
    modifiers.push({ label: "Aciertos de Facetado (Sweet Spot)", val: timingHits, icon: "sparkle", type: "timing" });
  }

  // Cerrar overlay del minijuego para dar paso al modal 3D de tirada
  closeLapidaryMinigame();

  if(typeof openBg3RollModal === "function"){
    openBg3RollModal({
      title: "Talla de Lapidario",
      subtitle: "Corte de " + family.gema + " (1d10 + Mods)",
      sides: 10,
      qty: 1,
      charName: c.name,
      modifiers: modifiers,
      onResolve: function(rollState){
        resolveLapidaryCraft(c, stone, rollState);
      }
    });
  } else {
    // Fallback de tirada si no está disponible la cámara 3D
    var d10 = Math.floor(Math.random() * 10) + 1;
    var total = d10 + intVal + skillBonus + tierBonus + timingHits;
    resolveLapidaryCraft(c, stone, { total: total, r1: d10 });
  }
}

function resolveLapidaryCraft(c, stone, rollState){
  var grandTotal = rollState.total;
  var quality = getStoneQualityByRoll(grandTotal);

  stone.estado = "pulida";
  stone.calidad = quality.id;

  if(quality.id === "arruinada"){
    playGemFracture();
    stone.notasInvestigacion = (stone.notasInvestigacion ? stone.notasInvestigacion + " " : "") + "[Gema fracturada durante la talla (Tirada: " + grandTotal + ")].";
    showToast("⚠️ La gema se ha fracturado durante el corte. Calidad: Arruinada (Total: " + grandTotal + ").", "warning");
  } else {
    playGemChime(quality.id);
    showToast("💎 ¡Talla completada con éxito! Calidad: " + quality.label + " (Total: " + grandTotal + ").", "success");
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
   7. ADQUISICIÓN DE PIEDRAS EN BRUTO (MODAL)
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
      '<label>Efecto Concreto de la Gema (Solo editable por GM o al confirmar)</label>' +
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
   8. TIRADA DE INVESTIGACIÓN Y SECRETO GM (PUNTOS 3 Y 7)
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
