/* ==========================================================================
   KRYSALIS - SISTEMA DE DADOS 3D ESTILO BALDUR'S GATE 3 Y AUDIO D&D
   ========================================================================== */

var audioCtx = null;
function getAudioCtx(){
  if(!audioCtx){
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e){}
  }
  if(audioCtx && audioCtx.state === 'suspended'){
    audioCtx.resume();
  }
  return audioCtx;
}

/* --- MOTOR DE AUDIO PROCEDURAL D&D (SUAVE, ORGÁNICO, NO ESTRIDENTE) --- */

function playBg3DiceRoll(){
  var ctx = getAudioCtx(); if(!ctx) return;
  var now = ctx.currentTime;

  // 1. Fricción suave de rodadura en fieltro/cuero
  try {
    var bufferSize = Math.floor(ctx.sampleRate * 0.45);
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for(var i = 0; i < bufferSize; i++){
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.28));
    }
    var noise = ctx.createBufferSource();
    noise.buffer = buffer;
    var filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(340, now);
    filter.frequency.exponentialRampToValueAtTime(190, now + 0.42);
    filter.Q.setValueAtTime(2.8, now);
    var nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.001, now);
    nGain.gain.linearRampToValueAtTime(0.13, now + 0.04);
    nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    noise.connect(filter); filter.connect(nGain); nGain.connect(ctx.destination);
    noise.start(now); noise.stop(now + 0.45);
  } catch(e){}

  // 2. Traqueteo escalonado de caras de resina densa
  var taps = [0.02, 0.08, 0.15, 0.23, 0.31, 0.39];
  taps.forEach(function(dt, idx){
    var t = now + dt;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = (idx % 2 === 0) ? "triangle" : "sine";
    var baseFreq = 270 + (idx * 22) + Math.random() * 70;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.65, t + 0.035);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.12 / (1 + idx * 0.14), t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.038);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.042);
  });
}

function playBg3DiceLand(){
  var ctx = getAudioCtx(); if(!ctx) return;
  var now = ctx.currentTime;

  // Impacto grave sordo en bandeja de madera/cuero
  var thud = ctx.createOscillator();
  var tGain = ctx.createGain();
  thud.type = "sine";
  thud.frequency.setValueAtTime(115, now);
  thud.frequency.exponentialRampToValueAtTime(42, now + 0.16);
  tGain.gain.setValueAtTime(0.001, now);
  tGain.gain.linearRampToValueAtTime(0.26, now + 0.012);
  tGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
  thud.connect(tGain); tGain.connect(ctx.destination);
  thud.start(now); thud.stop(now + 0.2);

  // Chasquido de contacto final
  var click = ctx.createOscillator();
  var cGain = ctx.createGain();
  click.type = "triangle";
  click.frequency.setValueAtTime(520, now);
  click.frequency.exponentialRampToValueAtTime(190, now + 0.03);
  cGain.gain.setValueAtTime(0.001, now);
  cGain.gain.linearRampToValueAtTime(0.16, now + 0.003);
  cGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.038);
  click.connect(cGain); cGain.connect(ctx.destination);
  click.start(now); click.stop(now + 0.042);
}

function playBg3ModifierAdd(){
  var ctx = getAudioCtx(); if(!ctx) return;
  var now = ctx.currentTime;
  // Campana cristalina etérea suave para la suma de bonificadores
  [880, 1320].forEach(function(f, idx){
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(f, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08 / (idx + 1), now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.3);
  });
}

function playBg3Crit(){
  var ctx = getAudioCtx(); if(!ctx) return;
  var now = ctx.currentTime;
  // Fanfarria armónica celestial dorada (Acorde heroico pentatónico mayor)
  var notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
  notes.forEach(function(freq, i){
    var t = now + i * 0.045;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = (i === 4) ? "sine" : "triangle";
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.14, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.7);
  });
}

function playBg3Fumble(){
  var ctx = getAudioCtx(); if(!ctx) return;
  var now = ctx.currentTime;
  // Campana de advertencia y resonancia oscura en piedra fría
  var osc = ctx.createOscillator();
  var gain = ctx.createGain();
  osc.type = "sawtooth";
  var filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(220, now);
  filter.frequency.exponentialRampToValueAtTime(70, now + 0.45);
  osc.frequency.setValueAtTime(110, now);
  osc.frequency.exponentialRampToValueAtTime(55, now + 0.45);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.15, now + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
  osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
  osc.start(now); osc.stop(now + 0.55);
}

function playBg3Click(){
  var ctx = getAudioCtx(); if(!ctx) return;
  var now = ctx.currentTime;
  var osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(110, now + 0.025);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.08, now + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.028);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(now); osc.stop(now + 0.032);
}

function playBg3Parchment(){
  var ctx = getAudioCtx(); if(!ctx) return;
  var now = ctx.currentTime;
  try {
    var bufferSize = Math.floor(ctx.sampleRate * 0.12);
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for(var i = 0; i < bufferSize; i++){
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.04));
    }
    var noise = ctx.createBufferSource();
    noise.buffer = buffer;
    var filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(650, now);
    filter.Q.setValueAtTime(2.0, now);
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
    noise.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    noise.start(now); noise.stop(now + 0.12);
  } catch(e){}
}

function playBg3RuneActivate(){
  var ctx = getAudioCtx(); if(!ctx) return;
  var now = ctx.currentTime;
  var osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(440, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(now); osc.stop(now + 0.16);
}

/* Compatibilidad con código anterior */
function playCupRattleAudio(){ playBg3DiceRoll(); }
function playDiceDropAudio(){ playBg3DiceLand(); }
function playDiceAudio(type){
  if(type === "crit") playBg3Crit();
  else if(type === "fumble") playBg3Fumble();
  else { playBg3DiceRoll(); setTimeout(playBg3DiceLand, 380); }
}

/* --- GENERADOR DE DADOS 3D POLIÉDRICOS (ESTILO BALDUR'S GATE 3) --- */

function getBg3DieSvg(sides, value){
  var val = (value !== undefined && value !== null) ? value : sides;
  var valStr = String(val);

  // Gradientes e iluminación de cristal amatista / obsidiana con filigrana dorada
  var defs = '<defs>'+
    '<radialGradient id="dieGlowGrad" cx="50%" cy="40%" r="60%">'+
      '<stop offset="0%" stop-color="#4e3365" stop-opacity="0.9"/>'+
      '<stop offset="60%" stop-color="#241732" stop-opacity="0.95"/>'+
      '<stop offset="100%" stop-color="#110919" stop-opacity="1"/>'+
    '</radialGradient>'+
    '<linearGradient id="dieFacetLight" x1="0%" y1="0%" x2="100%" y2="100%">'+
      '<stop offset="0%" stop-color="#654483"/>'+
      '<stop offset="50%" stop-color="#342247"/>'+
      '<stop offset="100%" stop-color="#190e24"/>'+
    '</linearGradient>'+
    '<linearGradient id="dieFacetDark" x1="0%" y1="100%" x2="100%" y2="0%">'+
      '<stop offset="0%" stop-color="#0e0614"/>'+
      '<stop offset="50%" stop-color="#1d1226"/>'+
      '<stop offset="100%" stop-color="#301d40"/>'+
    '</linearGradient>'+
    '<linearGradient id="goldEdge" x1="0%" y1="0%" x2="100%" y2="100%">'+
      '<stop offset="0%" stop-color="#FFF5DC"/>'+
      '<stop offset="35%" stop-color="#DEC392"/>'+
      '<stop offset="75%" stop-color="#B08D57"/>'+
      '<stop offset="100%" stop-color="#6E4F23"/>'+
    '</linearGradient>'+
    '<filter id="runeGlow" x="-20%" y="-20%" width="140%" height="140%">'+
      '<feGaussianBlur stdDeviation="1.5" result="blur"/>'+
      '<feComposite in="SourceGraphic" in2="blur" operator="over"/>'+
    '</filter>'+
  '</defs>';

  // D20: Icosaedro auténtico estilo Baldur's Gate 3 con facetas en perspectiva
  if(sides === 20){
    return '<svg class="bg3-die-svg" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">'+
      defs+
      '<g filter="drop-shadow(0 8px 14px rgba(0,0,0,0.85))">'+
        // Silueta exterior
        '<polygon points="80,10 138,42 138,118 80,150 22,118 22,42" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="2"/>'+
        // Facetas superiores laterales
        '<polygon points="80,10 138,42 110,60" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="1.2" opacity="0.85"/>'+
        '<polygon points="80,10 22,42 50,60" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="1.2" opacity="0.85"/>'+
        // Facetas laterales
        '<polygon points="22,42 50,60 38,102 22,118" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="1.2" opacity="0.9"/>'+
        '<polygon points="138,42 110,60 122,102 138,118" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="1.2" opacity="0.9"/>'+
        // Faceta triangular adyacente superior
        '<polygon points="50,60 110,60 80,30" fill="url(#dieFacetLight)" stroke="url(#goldEdge)" stroke-width="1.5"/>'+
        '<text x="80" y="48" font-family="var(--font-display)" font-size="11" font-weight="700" fill="#DEC392" text-anchor="middle" opacity="0.65">18</text>'+
        // Faceta triangular adyacente izquierda
        '<polygon points="50,60 80,115 38,102" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="1.5"/>'+
        '<text x="56" y="94" font-family="var(--font-display)" font-size="11" font-weight="700" fill="#DEC392" text-anchor="middle" opacity="0.65">2</text>'+
        // Faceta triangular adyacente derecha
        '<polygon points="110,60 80,115 122,102" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="1.5"/>'+
        '<text x="104" y="94" font-family="var(--font-display)" font-size="11" font-weight="700" fill="#DEC392" text-anchor="middle" opacity="0.65">8</text>'+
        // Facetas inferiores
        '<polygon points="38,102 80,115 80,150 22,118" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="1.2" opacity="0.8"/>'+
        '<polygon points="122,102 80,115 80,150 138,118" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="1.2" opacity="0.8"/>'+
        '<text x="80" y="136" font-family="var(--font-display)" font-size="10" font-weight="700" fill="#DEC392" text-anchor="middle" opacity="0.5">14</text>'+
        // Gran Faceta Frontal Central (Donde aterriza el resultado)
        '<polygon points="50,60 110,60 80,115" fill="url(#dieGlowGrad)" stroke="url(#goldEdge)" stroke-width="2.6"/>'+
        // Destello místico y número resultante
        '<polygon points="55,64 105,64 80,110" fill="none" stroke="#FFF5DC" stroke-width="0.8" opacity="0.45"/>'+
        '<text x="80" y="95" font-family="var(--font-display)" font-size="'+(valStr.length > 1 ? "28" : "32")+'" font-weight="800" fill="#FFF5DC" text-anchor="middle" filter="url(#runeGlow)" letter-spacing="1">'+valStr+'</text>'+
      '</g>'+
    '</svg>';
  }

  // D12: Dodecaedro con pentágono frontal
  if(sides === 12){
    return '<svg class="bg3-die-svg" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">'+
      defs+
      '<g filter="drop-shadow(0 8px 14px rgba(0,0,0,0.85))">'+
        '<polygon points="80,12 138,32 150,92 102,146 58,146 10,92 22,32" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="2"/>'+
        // Facetas periféricas
        '<polygon points="80,12 138,32 116,56 80,44" fill="url(#dieFacetLight)" stroke="url(#goldEdge)" stroke-width="1.2" opacity="0.8"/>'+
        '<polygon points="138,32 150,92 124,96 116,56" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="1.2" opacity="0.75"/>'+
        '<polygon points="150,92 102,146 88,118 124,96" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="1.2" opacity="0.8"/>'+
        '<polygon points="58,146 10,92 36,96 72,118" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="1.2" opacity="0.8"/>'+
        '<polygon points="10,92 22,32 44,56 36,96" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="1.2" opacity="0.75"/>'+
        '<polygon points="22,32 80,12 80,44 44,56" fill="url(#dieFacetLight)" stroke="url(#goldEdge)" stroke-width="1.2" opacity="0.8"/>'+
        // Pentágono Central Frontal
        '<polygon points="80,44 116,56 124,96 80,120 36,96 44,56" fill="url(#dieGlowGrad)" stroke="url(#goldEdge)" stroke-width="2.5"/>'+
        '<text x="80" y="93" font-family="var(--font-display)" font-size="'+(valStr.length > 1 ? "28" : "32")+'" font-weight="800" fill="#FFF5DC" text-anchor="middle" filter="url(#runeGlow)">'+valStr+'</text>'+
      '</g>'+
    '</svg>';
  }

  // D10: Trapezoedro pentagonal
  if(sides === 10){
    return '<svg class="bg3-die-svg" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">'+
      defs+
      '<g filter="drop-shadow(0 8px 14px rgba(0,0,0,0.85))">'+
        '<polygon points="80,10 144,50 120,135 80,152 40,135 16,50" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="2"/>'+
        // Facetas superiores
        '<polygon points="80,10 144,50 80,82" fill="url(#dieFacetLight)" stroke="url(#goldEdge)" stroke-width="1.4"/>'+
        '<polygon points="80,10 16,50 80,82" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="1.4"/>'+
        // Facetas frontales donde se exhibe el número
        '<polygon points="80,82 144,50 120,135 80,152" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="1.5" opacity="0.85"/>'+
        '<polygon points="80,82 16,50 40,135 80,152" fill="url(#dieGlowGrad)" stroke="url(#goldEdge)" stroke-width="2.4"/>'+
        '<polygon points="80,10 120,70 80,140 40,70" fill="url(#dieGlowGrad)" stroke="url(#goldEdge)" stroke-width="2.5"/>'+
        '<text x="80" y="88" font-family="var(--font-display)" font-size="'+(valStr.length > 1 ? "28" : "32")+'" font-weight="800" fill="#FFF5DC" text-anchor="middle" filter="url(#runeGlow)">'+valStr+'</text>'+
      '</g>'+
    '</svg>';
  }

  // D8: Octaedro en perspectiva de diamante
  if(sides === 8){
    return '<svg class="bg3-die-svg" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">'+
      defs+
      '<g filter="drop-shadow(0 8px 14px rgba(0,0,0,0.85))">'+
        '<polygon points="80,12 142,80 80,148 18,80" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="2"/>'+
        '<polygon points="80,12 142,80 80,80" fill="url(#dieFacetLight)" stroke="url(#goldEdge)" stroke-width="1.4"/>'+
        '<polygon points="80,12 18,80 80,80" fill="url(#dieGlowGrad)" stroke="url(#goldEdge)" stroke-width="1.6"/>'+
        '<polygon points="80,148 142,80 80,80" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="1.4"/>'+
        '<polygon points="80,148 18,80 80,80" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="1.4"/>'+
        '<polygon points="80,32 120,80 80,128 40,80" fill="url(#dieGlowGrad)" stroke="url(#goldEdge)" stroke-width="2.4"/>'+
        '<text x="80" y="90" font-family="var(--font-display)" font-size="30" font-weight="800" fill="#FFF5DC" text-anchor="middle" filter="url(#runeGlow)">'+valStr+'</text>'+
      '</g>'+
    '</svg>';
  }

  // D6: Cubo en perspectiva isométrica elegante
  if(sides === 6){
    return '<svg class="bg3-die-svg" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">'+
      defs+
      '<g filter="drop-shadow(0 8px 14px rgba(0,0,0,0.85))">'+
        // Silueta exterior
        '<polygon points="80,16 142,48 142,116 80,148 18,116 18,48" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="2"/>'+
        // Cara Superior
        '<polygon points="80,16 142,48 80,80 18,48" fill="url(#dieFacetLight)" stroke="url(#goldEdge)" stroke-width="1.6"/>'+
        // Cara Derecha
        '<polygon points="80,80 142,48 142,116 80,148" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="1.6"/>'+
        // Cara Izquierda Frontal
        '<polygon points="80,80 18,48 18,116 80,148" fill="url(#dieGlowGrad)" stroke="url(#goldEdge)" stroke-width="2.4"/>'+
        '<text x="80" y="94" font-family="var(--font-display)" font-size="34" font-weight="800" fill="#FFF5DC" text-anchor="middle" filter="url(#runeGlow)">'+valStr+'</text>'+
      '</g>'+
    '</svg>';
  }

  // D4: Pirámide / Tetraedro
  if(sides === 4){
    return '<svg class="bg3-die-svg" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">'+
      defs+
      '<g filter="drop-shadow(0 8px 14px rgba(0,0,0,0.85))">'+
        '<polygon points="80,15 146,135 14,135" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="2"/>'+
        '<polygon points="80,15 146,135 80,95" fill="url(#dieFacetLight)" stroke="url(#goldEdge)" stroke-width="1.4"/>'+
        '<polygon points="80,15 14,135 80,95" fill="url(#dieGlowGrad)" stroke="url(#goldEdge)" stroke-width="2.2"/>'+
        '<polygon points="14,135 146,135 80,95" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="1.4"/>'+
        '<text x="80" y="105" font-family="var(--font-display)" font-size="30" font-weight="800" fill="#FFF5DC" text-anchor="middle" filter="url(#runeGlow)">'+valStr+'</text>'+
      '</g>'+
    '</svg>';
  }

  // D100: Percentil (Par de dados)
  if(sides === 100){
    var tensVal = Math.floor(val / 10) * 10;
    if(tensVal === 100) tensVal = 0;
    var tensStr = (tensVal < 10 ? "0" : "") + tensVal;
    var unitsVal = val % 10;
    var unitsStr = String(unitsVal);
    return '<div style="display:flex;align-items:center;justify-content:center;gap:6px;width:100%;">'+
      '<svg class="bg3-die-svg" style="width:72px;height:72px;" viewBox="0 0 160 160">'+
        defs+
        '<polygon points="80,10 144,50 120,135 80,152 40,135 16,50" fill="url(#dieGlowGrad)" stroke="url(#goldEdge)" stroke-width="2.4"/>'+
        '<text x="80" y="92" font-family="var(--font-display)" font-size="28" font-weight="800" fill="#FFF5DC" text-anchor="middle" filter="url(#runeGlow)">'+tensStr+'</text>'+
      '</svg>'+
      '<svg class="bg3-die-svg" style="width:72px;height:72px;" viewBox="0 0 160 160">'+
        defs+
        '<polygon points="80,10 144,50 120,135 80,152 40,135 16,50" fill="url(#dieGlowGrad)" stroke="url(#goldEdge)" stroke-width="2.4"/>'+
        '<text x="80" y="92" font-family="var(--font-display)" font-size="32" font-weight="800" fill="#FFF5DC" text-anchor="middle" filter="url(#runeGlow)">'+unitsStr+'</text>'+
      '</svg>'+
    '</div>';
  }

  // Fallback estándar
  return '<svg class="bg3-die-svg" viewBox="0 0 160 160">'+defs+'<circle cx="80" cy="80" r="60" fill="url(#dieGlowGrad)" stroke="url(#goldEdge)" stroke-width="2.5"/><text x="80" y="92" font-family="var(--font-display)" font-size="32" font-weight="800" fill="#FFF5DC" text-anchor="middle">'+valStr+'</text></svg>';
}

/* Iconos SVG temáticos para las tarjetas de bonificador de BG3 */
function getBg3ModIconSvg(type, iconHint){
  var h = (iconHint || type || "").toLowerCase();
  if(h.includes("int") || h.includes("saber") || h.includes("magia") || h.includes("book")) {
    return '<span title="Inteligencia / Conocimiento">📖</span>';
  }
  if(h.includes("fis") || h.includes("fuerza") || h.includes("melee") || h.includes("espada") || h.includes("sword")) {
    return '<span title="Físico / Melé">⚔️</span>';
  }
  if(h.includes("des") || h.includes("agil") || h.includes("distancia") || h.includes("arco") || h.includes("bow")) {
    return '<span title="Destreza / Agilidad">🏹</span>';
  }
  if(h.includes("per") || h.includes("ojo") || h.includes("advertir") || h.includes("buscar") || h.includes("eye")) {
    return '<span title="Percepción">👁️</span>';
  }
  if(h.includes("car") || h.includes("voz") || h.includes("lira") || h.includes("mask")) {
    return '<span title="Carisma">🎭</span>';
  }
  if(h.includes("skill") || h.includes("entren") || h.includes("rango")) {
    return '<span title="Entrenamiento">🏅</span>';
  }
  if(h.includes("veneno") || h.includes("poison") || h.includes("mono") || h.includes("maldicion")) {
    return '<span title="Debuff">💀</span>';
  }
  return '<span title="Bonificador">✨</span>';
}

/* --- CONTROLADOR PRINCIPAL DE LA CÁMARA BALDUR'S GATE 3 --- */

var bg3RollState = {
  active: false,
  title: "Tirada de Destino",
  subtitle: "Prueba General (1d20)",
  sides: 20,
  qty: 1,
  dc: 10,
  dcActive: true,
  mode: "normal", // 'normal' | 'adv' | 'disadv'
  modifiers: [], // [{ id, label, val, icon, type, custom }]
  charName: "Aventurero",
  rolling: false,
  resolved: false,
  r1: null,
  r2: null,
  chosen: null,
  total: 0,
  isCrit: false,
  isFumble: false,
  isSuccess: false,
  onResolve: null,
  rerollFn: null
};

function renderBg3DieInSlot(slotEl, sides, value){
  if(!slotEl) return;
  slotEl.innerHTML = '<div class="bg3-die-3d">' + getBg3DieSvg(sides, value) + '</div><div class="bg3-die-shadow"></div>';
}

function openBg3RollModal(cfg){
  cfg = cfg || {};
  bg3RollState.active = true;
  bg3RollState.title = cfg.title || "Prueba";
  bg3RollState.subtitle = cfg.subtitle || ("Tirada (1d" + (cfg.sides || 20) + ")");
  bg3RollState.sides = cfg.sides || 20;
  bg3RollState.qty = cfg.qty || 1;
  bg3RollState.dc = (cfg.dc !== undefined && cfg.dc !== null) ? parseInt(cfg.dc, 10) : 10;
  bg3RollState.dcActive = cfg.dcActive !== undefined ? Boolean(cfg.dcActive) : true;
  bg3RollState.mode = cfg.mode || "normal";
  bg3RollState.charName = cfg.charName || ((typeof activeChar === "function" && activeChar() && activeChar().name) ? activeChar().name : "Aventurero");
  bg3RollState.modifiers = Array.isArray(cfg.modifiers) ? cfg.modifiers.slice() : [];
  bg3RollState.onResolve = cfg.onResolve || null;
  bg3RollState.rerollFn = cfg.rerollFn || null;
  bg3RollState.rolling = false;
  bg3RollState.resolved = false;
  bg3RollState.r1 = null;
  bg3RollState.r2 = null;
  bg3RollState.chosen = null;
  bg3RollState.total = 0;

  // Llenar datos de interfaz
  var titleEl = document.getElementById("bg3RollTitle");
  if(titleEl) titleEl.textContent = bg3RollState.title;
  var subEl = document.getElementById("bg3RollSubtitle");
  if(subEl) subEl.textContent = bg3RollState.subtitle;

  // Placa de CD
  var dcValEl = document.getElementById("bg3DcValue");
  if(dcValEl) dcValEl.textContent = bg3RollState.dc;
  var dcStatusEl = document.getElementById("bg3DcStatus");
  if(dcStatusEl) dcStatusEl.textContent = bg3RollState.dcActive ? "Objetivo activo" : "Sin CD (Libre)";
  var dcPlate = document.getElementById("bg3DcPlate");
  if(dcPlate){
    if(bg3RollState.dcActive) dcPlate.style.opacity = "1";
    else dcPlate.style.opacity = "0.45";
  }

  // Modos: Normal / Ventaja / Desventaja
  updateBg3ModePills();

  // Escenario de dados
  var slot1 = document.getElementById("bg3DieSlotPrimary");
  var slot2 = document.getElementById("bg3DieSlotSecondary");
  if(slot1){
    slot1.className = "bg3-die-slot";
    renderBg3DieInSlot(slot1, bg3RollState.sides, bg3RollState.sides);
  }
  if(slot2){
    slot2.className = "bg3-die-slot" + (bg3RollState.mode === "normal" ? " hidden" : "");
    if(bg3RollState.mode !== "normal"){
      renderBg3DieInSlot(slot2, bg3RollState.sides, bg3RollState.sides);
    }
  }

  // Veredicto y acciones
  var verdictBanner = document.getElementById("bg3VerdictBanner");
  if(verdictBanner) verdictBanner.className = "bg3-verdict-plate hidden";
  var promptBanner = document.getElementById("bg3PromptBanner");
  if(promptBanner) promptBanner.style.display = "inline-flex";
  var postActions = document.getElementById("bg3PostActions");
  if(postActions) postActions.classList.add("hidden");
  var addModBtn = document.getElementById("bg3BtnAddMod");
  if(addModBtn) addModBtn.style.display = "inline-flex";
  var popover = document.getElementById("bg3AddModPopover");
  if(popover) popover.classList.add("hidden");

  // Renderizar tarjetas de bonificador
  renderBg3ModCards();

  // Mostrar modal
  var overlay = document.getElementById("rollOverlay");
  if(overlay) overlay.classList.remove("hidden");

  // Sonido suave de apertura mística
  playBg3RuneActivate();
}

function updateBg3ModePills(){
  var pills = document.querySelectorAll(".bg3-mode-pill");
  pills.forEach(function(p){
    var m = p.getAttribute("data-mode");
    if(m === bg3RollState.mode) p.classList.add("active");
    else p.classList.remove("active");
  });
  var slot2 = document.getElementById("bg3DieSlotSecondary");
  if(slot2){
    if(bg3RollState.mode === "normal") slot2.classList.add("hidden");
    else {
      slot2.classList.remove("hidden");
      renderBg3DieInSlot(slot2, bg3RollState.sides, bg3RollState.sides);
    }
  }
}

function renderBg3ModCards(){
  var container = document.getElementById("bg3ModCards");
  if(!container) return;
  var sum = 0;
  var html = "";

  bg3RollState.modifiers.forEach(function(m, idx){
    var v = parseFloat(m.val) || 0;
    sum += v;
    var sign = v >= 0 ? "+" : "";
    var icon = getBg3ModIconSvg(m.type, m.icon || m.label);
    html += '<div class="bg3-card" data-idx="'+idx+'">'+
      '<span class="bg3-card-val '+(v<0?'neg':'')+'">'+sign+v+'</span>'+
      '<div class="bg3-card-icon">'+icon+'</div>'+
      '<span class="bg3-card-lbl" title="'+esc(m.label)+'">'+esc(m.label)+'</span>'+
      (m.custom ? '<button class="bg3-card-del" data-action="bg3-del-mod" data-idx="'+idx+'" title="Eliminar">✕</button>' : '')+
    '</div>';
  });

  if(!bg3RollState.modifiers.length){
    html = '<div style="font-size:0.75rem;color:var(--ink-faint);font-style:italic;padding:12px 0;">Sin modificadores activos</div>';
  }

  container.innerHTML = html;
  var totalValEl = document.getElementById("bg3TotalModVal");
  if(totalValEl){
    totalValEl.textContent = (sum >= 0 ? "+" : "") + sum;
  }
}

function triggerBg3Roll(){
  if(bg3RollState.rolling) return;
  bg3RollState.rolling = true;
  bg3RollState.resolved = false;

  var promptBanner = document.getElementById("bg3PromptBanner");
  if(promptBanner) promptBanner.style.display = "none";
  var addModBtn = document.getElementById("bg3BtnAddMod");
  if(addModBtn) addModBtn.style.display = "none";

  // Efecto de sonido de lanzamiento
  playBg3DiceRoll();

  // Iniciar animación de rodar en 3D
  var slot1 = document.getElementById("bg3DieSlotPrimary");
  var slot2 = document.getElementById("bg3DieSlotSecondary");
  var die1 = slot1 ? slot1.querySelector(".bg3-die-3d") : null;
  var die2 = slot2 ? slot2.querySelector(".bg3-die-3d") : null;

  if(die1){ die1.classList.remove("settling"); die1.classList.add("rolling"); }
  if(die2){ die2.classList.remove("settling"); die2.classList.add("rolling"); }

  // Calcular resultados numéricos
  var r1 = rollDie(bg3RollState.sides);
  var r2 = (bg3RollState.mode !== "normal") ? rollDie(bg3RollState.sides) : null;
  var chosen = r1;
  if(bg3RollState.mode === "adv") chosen = Math.max(r1, r2);
  else if(bg3RollState.mode === "disadv") chosen = Math.min(r1, r2);

  bg3RollState.r1 = r1;
  bg3RollState.r2 = r2;
  bg3RollState.chosen = chosen;

  // Tiempo de tumbling 3D
  setTimeout(function(){
    playBg3DiceLand();

    // Detener rodar y asentar
    if(slot1){
      slot1.innerHTML = '<div class="bg3-die-3d settling">' + getBg3DieSvg(bg3RollState.sides, r1) + '</div><div class="bg3-die-shadow"></div>';
    }
    if(slot2 && bg3RollState.mode !== "normal"){
      slot2.innerHTML = '<div class="bg3-die-3d settling">' + getBg3DieSvg(bg3RollState.sides, r2) + '</div><div class="bg3-die-shadow"></div>';
    }

    // Gestionar halos y etiquetas de Ventaja / Desventaja
    if(bg3RollState.mode === "adv"){
      if(r1 >= r2){
        if(slot1) { slot1.classList.add("winner"); slot1.innerHTML += '<div class="bg3-die-tag win">✓ ELEGIDO ('+r1+')</div>'; }
        if(slot2) { slot2.classList.add("discarded"); slot2.innerHTML += '<div class="bg3-die-tag disc">DESCARTADO ('+r2+')</div>'; }
      } else {
        if(slot2) { slot2.classList.add("winner"); slot2.innerHTML += '<div class="bg3-die-tag win">✓ ELEGIDO ('+r2+')</div>'; }
        if(slot1) { slot1.classList.add("discarded"); slot1.innerHTML += '<div class="bg3-die-tag disc">DESCARTADO ('+r1+')</div>'; }
      }
    } else if(bg3RollState.mode === "disadv"){
      if(r1 <= r2){
        if(slot1) { slot1.classList.add("winner-disadv"); slot1.innerHTML += '<div class="bg3-die-tag win">ELEGIDO ('+r1+')</div>'; }
        if(slot2) { slot2.classList.add("discarded"); slot2.innerHTML += '<div class="bg3-die-tag disc">DESCARTADO ('+r2+')</div>'; }
      } else {
        if(slot2) { slot2.classList.add("winner-disadv"); slot2.innerHTML += '<div class="bg3-die-tag win">ELEGIDO ('+r2+')</div>'; }
        if(slot1) { slot1.classList.add("discarded"); slot1.innerHTML += '<div class="bg3-die-tag disc">DESCARTADO ('+r1+')</div>'; }
      }
    }

    // Animación de bonificadores sumándose
    var modSum = 0;
    var cards = document.querySelectorAll(".bg3-card");
    cards.forEach(function(c, idx){
      setTimeout(function(){
        c.classList.add("pulse");
        playBg3ModifierAdd();
      }, idx * 140);
    });

    bg3RollState.modifiers.forEach(function(m){
      modSum += (parseFloat(m.val) || 0);
    });

    var grandTotal = chosen + modSum;
    bg3RollState.total = grandTotal;

    // Evaluación de Críticos, Pifias y Dificultad
    var isCrit = false;
    var isFumble = false;
    if(bg3RollState.sides === 20){
      isCrit = (chosen === 20);
      isFumble = (chosen === 1);
    } else if(bg3RollState.sides === 10){
      isCrit = (chosen === 10);
      isFumble = (chosen === 1);
    } else {
      isCrit = (chosen === bg3RollState.sides);
      isFumble = (chosen === 1);
    }
    bg3RollState.isCrit = isCrit;
    bg3RollState.isFumble = isFumble;

    var isSuccess = true;
    if(bg3RollState.dcActive){
      if(isCrit) isSuccess = true;
      else if(isFumble) isSuccess = false;
      else isSuccess = (grandTotal >= bg3RollState.dc);
    } else {
      isSuccess = !isFumble;
    }
    bg3RollState.isSuccess = isSuccess;

    // Mostrar veredicto tras la suma de bonificadores
    var delayVerdict = Math.max(300, cards.length * 140 + 100);
    setTimeout(function(){
      var vPlate = document.getElementById("bg3VerdictBanner");
      var vTitle = document.getElementById("bg3VerdictText");
      var vMath = document.getElementById("bg3VerdictBreakdown");

      if(vPlate && vTitle && vMath){
        vPlate.classList.remove("hidden", "success", "failure", "crit", "fumble");

        if(isCrit){
          vPlate.classList.add("crit");
          vTitle.textContent = "¡ÉXITO CRÍTICO!";
          playBg3Crit();
        } else if(isFumble){
          vPlate.classList.add("fumble");
          vTitle.textContent = "¡PIFIA CRÍTICA!";
          playBg3Fumble();
        } else if(bg3RollState.dcActive){
          if(isSuccess){
            vPlate.classList.add("success");
            vTitle.textContent = "¡ÉXITO!";
            playBg3Crit();
          } else {
            vPlate.classList.add("failure");
            vTitle.textContent = "FALLO";
            playBg3Fumble();
          }
        } else {
          vPlate.classList.add("success");
          vTitle.textContent = "RESULTADO: " + grandTotal;
        }

        var mathText = "[" + chosen + "] Dado";
        if(modSum !== 0){
          mathText += " + [" + (modSum > 0 ? "+" + modSum : modSum) + "] Bonos = " + grandTotal;
        }
        if(bg3RollState.dcActive){
          mathText += " (vs CD " + bg3RollState.dc + ")";
        }
        vMath.textContent = mathText;
      }

      // Registro en el historial y sincronización
      var rollItem = {
        id: uid(),
        charName: bg3RollState.charName,
        label: bg3RollState.title,
        total: grandTotal,
        formulaText: "1d" + bg3RollState.sides + " [" + chosen + "]" + (modSum !== 0 ? (modSum > 0 ? " +" + modSum : " " + modSum) : "") + " = " + grandTotal,
        isCrit: isCrit,
        isFumble: isFumble,
        ts: Date.now()
      };
      state.rollLog.unshift(rollItem);
      if(state.rollLog.length > 20) state.rollLog.length = 20;
      saveState();
      broadcastDiceRoll(rollItem);

      // Mostrar botones de confirmación / reroll
      var postActs = document.getElementById("bg3PostActions");
      if(postActs) postActs.classList.remove("hidden");

      bg3RollState.rolling = false;
      bg3RollState.resolved = true;
    }, delayVerdict);

  }, 850);
}

function closeBg3Roll(){
  var overlay = document.getElementById("rollOverlay");
  if(overlay) overlay.classList.add("hidden");
  playBg3Click();
  bg3RollState.active = false;
  if(typeof bg3RollState.onResolve === "function" && bg3RollState.resolved){
    try { bg3RollState.onResolve(bg3RollState); } catch(e){}
  }
}

/* --- LANZADORES ESPECÍFICOS INTEGRADOS CON FICHA Y COMBATE --- */

function openBg3SkillRoll(c, sdef){
  if(!c || !sdef) return;
  var attrKey = sdef.attr !== "hybrid" ? sdef.attr : ((c.skillHybrid && c.skillHybrid[sdef.id]) || sdef.hybridOptions[0]);
  var attrVal = getEffectiveAttr(attrKey, c);
  var attrName = ATTR_LABELS[attrKey] || "Atributo";
  var trainBonus = num(c.skillBonus ? c.skillBonus[sdef.id] : 0, 0);

  var modifiers = [
    { label: attrName, val: attrVal, icon: attrKey, type: "attr" }
  ];

  if(trainBonus > 0){
    modifiers.push({ label: "Entrenamiento", val: trainBonus, icon: "medal", type: "skill" });
  }

  // Buffs activos que impactan esta habilidad o atributo
  if(c.activeBuffs){
    c.activeBuffs.forEach(function(ab){
      if(ab.active === false) return;
      var bVal = parseFloat(ab.bonus);
      if(isNaN(bVal) || bVal === 0) return;
      if(ab.attr === sdef.id || ab.attr === attrKey || ab.attr === "todo"){
        modifiers.push({ label: ab.name || "Buff", val: bVal, icon: bVal > 0 ? "flame" : "poison", type: "buff" });
      }
    });
  }

  if(c.buffs){
    if(c.buffs.mono) modifiers.push({ label: "Mono / Abstinencia", val: -1, icon: "poison", type: "buff" });
  }

  openBg3RollModal({
    title: sdef.name,
    subtitle: "Prueba de " + attrName + " (1d20)",
    sides: 20,
    dc: 10,
    dcActive: true,
    mode: "normal",
    charName: c.name,
    modifiers: modifiers
  });
}

function openBg3CustomSkillRoll(c, cs){
  if(!c || !cs) return;
  var attrKey = cs.attr || "destreza";
  var attrVal = getEffectiveAttr(attrKey, c);
  var attrName = ATTR_LABELS[attrKey] || "Atributo";
  var bonusVal = num(cs.bonus, 0);

  var modifiers = [
    { label: attrName, val: attrVal, icon: attrKey, type: "attr" }
  ];
  if(bonusVal > 0){
    modifiers.push({ label: "Rango", val: bonusVal, icon: "medal", type: "skill" });
  }

  if(c.activeBuffs){
    c.activeBuffs.forEach(function(ab){
      if(ab.active === false) return;
      var bVal = parseFloat(ab.bonus);
      if(isNaN(bVal) || bVal === 0) return;
      if(ab.attr === cs.id || ab.attr === attrKey || ab.attr === "todo"){
        modifiers.push({ label: ab.name || "Buff", val: bVal, icon: bVal > 0 ? "flame" : "poison", type: "buff" });
      }
    });
  }

  openBg3RollModal({
    title: cs.name,
    subtitle: "Prueba de " + attrName + " (1d20)",
    sides: 20,
    dc: 10,
    dcActive: true,
    mode: "normal",
    charName: c.name,
    modifiers: modifiers
  });
}

function openBg3AttrRoll(c, attrKey){
  if(!c || !attrKey) return;
  var attrVal = getEffectiveAttr(attrKey, c);
  var attrName = ATTR_LABELS[attrKey] || "Atributo";

  var modifiers = [
    { label: attrName, val: attrVal, icon: attrKey, type: "attr" }
  ];

  if(c.activeBuffs){
    c.activeBuffs.forEach(function(ab){
      if(ab.active === false) return;
      var bVal = parseFloat(ab.bonus);
      if(isNaN(bVal) || bVal === 0) return;
      if(ab.attr === attrKey || ab.attr === "todo"){
        modifiers.push({ label: ab.name || "Buff", val: bVal, icon: bVal > 0 ? "flame" : "poison", type: "buff" });
      }
    });
  }

  openBg3RollModal({
    title: "Prueba de " + attrName,
    subtitle: "Tirada de Atributo (1d20)",
    sides: 20,
    dc: 10,
    dcActive: true,
    mode: "normal",
    charName: c.name,
    modifiers: modifiers
  });
}

function openBg3WeaponRoll(c, wpn, formulaRaw){
  var reg = new RegExp('(\\d+)\\s*[dD]\\s*(\\d+)');
  var m = String(formulaRaw || "1d6").match(reg);
  var sides = m ? parseInt(m[2], 10) : 6;
  var rest = String(formulaRaw || "").slice(m ? (m.index + m[0].length) : 0);
  var modM = rest.match(new RegExp('^\\s*([+-]\\s*\\d+)'));
  var baseMod = modM ? parseInt(modM[1].replace(/\s+/g, ""), 10) : 0;

  var modifiers = [];
  if(baseMod !== 0){
    modifiers.push({ label: "Modificador Arma", val: baseMod, icon: "sword", type: "weapon" });
  }

  var wpnName = (wpn && wpn.name) ? wpn.name : "Arma";
  var isMelee = !wpnName.toLowerCase().includes("distancia") && !wpnName.toLowerCase().includes("arco");

  if(c && c.buffs){
    if(isMelee && c.buffs.sangre_ataque_melee) modifiers.push({ label: "Sangre Melé", val: 1, icon: "flame", type: "buff" });
    if(!isMelee && c.buffs.sangre_ataque_dist) modifiers.push({ label: "Sangre Distancia", val: 1, icon: "flame", type: "buff" });
    if(c.buffs.mono) modifiers.push({ label: "Mono", val: -1, icon: "poison", type: "buff" });
  }

  if(c && c.activeBuffs){
    c.activeBuffs.forEach(function(ab){
      if(ab.active === false) return;
      var bVal = parseFloat(ab.bonus);
      if(isNaN(bVal) || bVal === 0) return;
      if(isMelee && (ab.attr === "melee" || ab.attr === "melé")){
        modifiers.push({ label: ab.name || "Furia Melé", val: bVal, icon: "flame", type: "buff" });
      }
      if(!isMelee && ab.attr === "distancia"){
        modifiers.push({ label: ab.name || "Ojo Halcón", val: bVal, icon: "bow", type: "buff" });
      }
    });
  }

  openBg3RollModal({
    title: "Daño — " + wpnName,
    subtitle: "Tirada de Daño (1d" + sides + (baseMod ? (baseMod > 0 ? "+" + baseMod : baseMod) : "") + ")",
    sides: sides,
    dc: 10,
    dcActive: false, // Por defecto el daño no tiene CD
    mode: "normal",
    charName: c ? c.name : "Aventurero",
    modifiers: modifiers
  });
}

function openBg3InitRoll(c){
  if(!c) return;
  var initVal = (c.combat && c.combat.iniciativa !== undefined) ? num(c.combat.iniciativa, 0) : 0;
  openBg3RollModal({
    title: "Iniciativa",
    subtitle: "Tirada de Combate (1d20)",
    sides: 20,
    dc: 10,
    dcActive: false,
    mode: "normal",
    charName: c.name,
    modifiers: [
      { label: "Iniciativa", val: initVal, icon: "destreza", type: "attr" }
    ]
  });
}

function openBg3FreeRoll(sides, qty, mod, mode){
  var s = parseInt(sides, 10) || 20;
  var m = parseInt(mod, 10) || 0;
  var curC = (typeof activeChar === "function") ? activeChar() : null;
  var cName = (curC && curC.name) ? curC.name : "Aventurero";

  var modifiers = [];
  if(m !== 0){
    modifiers.push({ label: "Modificador", val: m, icon: "rune", type: "custom", custom: false });
  }

  openBg3RollModal({
    title: (s === 100 ? "d% Percentil" : "Tirada 1d" + s),
    subtitle: "Tirada Libre (" + (s === 100 ? "1d100" : "1d" + s) + ")",
    sides: s,
    dc: 10,
    dcActive: false,
    mode: mode || "normal",
    charName: cName,
    modifiers: modifiers
  });
}

/* --- ADAPTADORES DE LLAMADAS HEREDADAS --- */

function openRollModal(label, scoreText, detailHtml, sides, isCrit, isFumble, advCardsHtml, rerollFn){
  openBg3RollModal({
    title: label || "Tirada",
    subtitle: detailHtml || ("Tirada 1d" + (sides || 20)),
    sides: sides || 20,
    dc: 10,
    dcActive: false,
    mode: "normal",
    modifiers: [],
    rerollFn: rerollFn
  });
}

function performD10Roll(charName, label, mod){
  var curC = (typeof activeChar === "function") ? activeChar() : null;
  openBg3SkillRoll(curC, { name: label, attr: "percepcion", id: "gen" });
}

function performWeaponRoll(charName, weaponName, formulaRaw){
  var curC = (typeof activeChar === "function") ? activeChar() : null;
  openBg3WeaponRoll(curC, { name: weaponName }, formulaRaw);
}

function parseSummonFormula(raw){
  var str = String(raw || "").trim();
  var mRev = str.match(/^(\d+)\s*\+\s*(\d*)d(\d+)$/i);
  if(mRev){
    return { qty: mRev[2] ? parseInt(mRev[2], 10) : 1, sides: parseInt(mRev[3], 10), mod: parseInt(mRev[1], 10) };
  }
  var mNorm = str.match(/^(\d*)d(\d+)(?:\s*([+-])\s*(\d+))?$/i);
  if(mNorm){
    var mod = (mNorm[3] && mNorm[4]) ? parseInt(mNorm[4], 10) * (mNorm[3] === '-' ? -1 : 1) : 0;
    return { qty: mNorm[1] ? parseInt(mNorm[1], 10) : 1, sides: parseInt(mNorm[2], 10), mod: mod };
  }
  var mNum = str.match(/^([+-]?\d+)$/);
  if(mNum) return { qty: 1, sides: 10, mod: parseInt(mNum[1], 10) };
  return { qty: 1, sides: 10, mod: 0 };
}

function performSummonRoll(charName, summonName, actionName, formulaRaw){
  var parsed = parseSummonFormula(formulaRaw);
  openBg3FreeRoll(parsed.sides, parsed.qty, parsed.mod, "normal");
}

/* --- SINCRONIZACIÓN Y BROADCAST EN TIEMPO REAL --- */

function broadcastDiceRoll(rollObj){
  if(realtimeChannel && typeof realtimeChannel.send === 'function'){
    try {
      realtimeChannel.send({
        type: 'broadcast',
        event: 'dice_roll',
        payload: rollObj
      });
    } catch(e){
      console.warn("Could not broadcast dice roll:", e);
    }
  }
}

function handleRemoteDiceRoll(rollObj){
  if(!rollObj) return;
  state.rollLog.unshift({
    id: rollObj.id || uid(),
    charName: rollObj.charName || "Aventurero",
    label: rollObj.label || "Tirada",
    total: rollObj.total,
    formulaText: rollObj.formulaText,
    ts: rollObj.ts || Date.now()
  });
  if(state.rollLog.length > 20) state.rollLog.length = 20;
  saveState(true);

  var critText = rollObj.isCrit ? " ¡Éxito Crítico!" : (rollObj.isFumble ? " ¡Pifia Crítica!" : "");
  var toastType = rollObj.isCrit ? "success" : (rollObj.isFumble ? "error" : "info");
  showToast("🎲 " + rollObj.charName + " tiró " + rollObj.label + ": " + rollObj.total + critText, toastType);

  if(rollObj.isCrit) playBg3Crit();
  else if(rollObj.isFumble) playBg3Fumble();
  else { playBg3DiceRoll(); setTimeout(playBg3DiceLand, 300); }

  if(state.activeTab === "habilidades" || state.activeTab === "combate") {
    renderTab();
  }
}

/* --- MODAL SELECTOR DE DADOS (CUBILETE Y ELECCIÓN) --- */

var diceConfig = {
  sides: 20,
  qty: 1,
  mod: 0,
  mode: "normal"
};

function getDieSvg(sides){
  return getBg3DieSvg(sides, sides);
}

function getOrnateCupSvg(){
  return getBg3DieSvg(20, 20);
}

function openDiceModal(){
  var sidesList = [4, 6, 8, 10, 12, 20, 100];
  var diceCards = sidesList.map(function(s){
    return '<div class="dtype-card '+(diceConfig.sides===s?'active':'')+'" data-action="pick-die" data-sides="'+s+'" role="button" tabindex="0">'+
      getBg3DieSvg(s, s)+
      '<span>'+(s===100?'d%':'d'+s)+'</span>'+
    '</div>';
  }).join('');

  document.getElementById("diceModal").innerHTML =
    '<div class="cup-modal-header">'+
      '<div class="cup-modal-icon" style="width:40px;height:40px;">'+getBg3DieSvg(diceConfig.sides, diceConfig.sides)+'</div>'+
      '<div class="cup-modal-title">'+
        '<h3>Lanzador de Dados</h3>'+
        '<div class="cup-modal-sub">Elige tu dado, modalidad y lanza en la Cámara 3D</div>'+
      '</div>'+
      '<button class="row-del" data-action="close-modal" aria-label="Cerrar" style="min-width:30px;min-height:30px;font-size:1rem;">✕</button>'+
    '</div>'+
    '<div class="dice-mode-pills">'+
      '<button class="dmode-pill '+(diceConfig.mode==='normal'?'active':'')+'" data-action="set-dice-mode" data-mode="normal">⚔️ Normal</button>'+
      '<button class="dmode-pill '+(diceConfig.mode==='adv'?'active':'')+'" data-action="set-dice-mode" data-mode="adv">🍀 Ventaja</button>'+
      '<button class="dmode-pill '+(diceConfig.mode==='disadv'?'active':'')+'" data-action="set-dice-mode" data-mode="disadv">💀 Desventaja</button>'+
    '</div>'+
    '<div class="cup-tray-label">Dados Poliédricos</div>'+
    '<div class="dtype-grid">'+diceCards+'</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px;">'+
      (diceConfig.sides===100?'<div></div>':'<div class="field"><label>Cantidad</label>'+
        '<div class="qty-control-row">'+
          '<button class="qty-btn" data-action="dec-dice-qty">-</button>'+
          '<input type="number" min="1" max="20" id="diceQty" value="'+diceConfig.qty+'" style="width:48px;text-align:center;">'+
          '<button class="qty-btn" data-action="inc-dice-qty">+</button>'+
        '</div>'+
        '<div class="quick-qty-chips" style="margin-top:4px;">'+
          [1,2,3,4].map(function(q){
            return '<button class="qty-chip '+(diceConfig.qty===q?'active':'')+'" data-action="set-dice-qty" data-qty="'+q+'">x'+q+'</button>';
          }).join('')+
        '</div>'+
      '</div>')+
      '<div class="field"><label>Modificador</label>'+
        '<div class="mod-control-row">'+
          '<input type="number" id="diceMod" value="'+diceConfig.mod+'" style="width:60px;text-align:center;">'+
          '<div class="quick-mod-chips">'+
            [-2,0,1,2,5].map(function(m){
              return '<button class="mod-chip '+(diceConfig.mod===m?'active':'')+'" data-action="set-dice-mod" data-mod="'+m+'">'+(m>0?'+'+m:m)+'</button>';
            }).join('')+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<button class="btn-solid-gold btn-roll-cup" data-action="roll-dice-btn">🎲 ¡Lanzar en la Cámara 3D!</button>';
  document.getElementById("diceModalOverlay").classList.remove("hidden");
}

function diceModalClick(e){
  var btn = e.target.closest("[data-action]"); if(!btn) return;
  var action = btn.getAttribute("data-action");
  if(action==="close-modal"){ closeModals(); return; }
  if(action==="set-dice-mode"){ diceConfig.mode = btn.getAttribute("data-mode"); openDiceModal(); return; }
  if(action==="inc-dice-qty"){ diceConfig.qty = Math.min(20, (diceConfig.qty||1)+1); openDiceModal(); return; }
  if(action==="dec-dice-qty"){ diceConfig.qty = Math.max(1, (diceConfig.qty||1)-1); openDiceModal(); return; }
  if(action==="set-dice-qty"){ diceConfig.qty = parseInt(btn.getAttribute("data-qty"),10)||1; openDiceModal(); return; }
  if(action==="set-dice-mod"){ diceConfig.mod = parseInt(btn.getAttribute("data-mod"),10)||0; openDiceModal(); return; }
  if(action==="pick-die"){ diceConfig.sides = parseInt(btn.getAttribute("data-sides"),10); openDiceModal(); return; }
  if(action==="roll-dice-btn"){
    var modInput = document.getElementById("diceMod");
    if(modInput) diceConfig.mod = parseInt(modInput.value,10)||0;
    var qtyInput = document.getElementById("diceQty");
    if(qtyInput) diceConfig.qty = Math.max(1, parseInt(qtyInput.value,10)||1);
    document.getElementById("diceModalOverlay").classList.add("hidden");

    openBg3FreeRoll(diceConfig.sides, diceConfig.qty, diceConfig.mod, diceConfig.mode);
    return;
  }
}

function rollLogHtml(){
  if(!state) return '';
  state.rollLog = state.rollLog || [];
  var logs = state.rollLog.slice(0,5);
  var html = '<div class="section"><div class="section-title"><span>Historial de Tiradas</span></div>';
  if(!logs.length){ html += '<div class="roll-empty">Sin tiradas recientes.</div>'; }
  else {
    html += '<div class="roll-log">'+logs.map(function(r){
      return '<div class="roll-log-item"><span>'+esc(r.charName)+' — '+esc(r.label)+'<br><span class="rl-formula">'+esc(r.formulaText)+'</span></span><span class="rl-result">'+r.total+'</span></div>';
    }).join('')+'</div>';
  }
  html += '</div>';
  return html;
}
