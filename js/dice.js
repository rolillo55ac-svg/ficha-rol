// Dados y tiradas 3D

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

/* --- MOTOR HÁPTICO SUTIL Y RETROALIMENTACIÓN FÍSICA --- */

function triggerBg3Haptic(type){
  if(typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    switch(type){
      case 'shake':
        navigator.vibrate(14);
        break;
      case 'aim-tick':
        navigator.vibrate(10);
        break;
      case 'roll-start':
        navigator.vibrate([15, 45, 12]);
        break;
      case 'tumble-pulse':
        navigator.vibrate(12);
        break;
      case 'land':
        navigator.vibrate(28);
        break;
      case 'crit':
        navigator.vibrate([30, 40, 25, 30, 45]);
        break;
      case 'fumble':
        navigator.vibrate([40, 55, 40]);
        break;
      default:
        navigator.vibrate(14);
    }
  } catch(e){}
}

/* --- MOTOR DE AUDIO PROCEDURAL D&D (MÁS LARGO Y MULTI-DADO) --- */

function playBg3DiceRoll(intensity){
  var ctx = getAudioCtx(); if(!ctx) return;
  var now = ctx.currentTime;
  var mult = (intensity === "intense") ? 1.25 : 1.0;
  var dur = (intensity === "intense") ? 1.55 : 1.35;

  // Ruido de fricción continua del cubilete y dados girando en cuero/fieltro
  try {
    var bufferSize = Math.floor(ctx.sampleRate * dur);
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for(var i = 0; i < bufferSize; i++){
      var t = i / ctx.sampleRate;
      var env = Math.exp(-t * 2.2) * (0.8 + 0.2 * Math.sin(t * 16));
      data[i] = (Math.random() * 2 - 1) * env;
    }
    var noise = ctx.createBufferSource();
    noise.buffer = buffer;
    var filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(360, now);
    filter.frequency.exponentialRampToValueAtTime(160, now + dur);
    filter.Q.setValueAtTime(2.2, now);
    var nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.001, now);
    nGain.gain.linearRampToValueAtTime(0.14 * mult, now + 0.05);
    nGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    noise.connect(filter); filter.connect(nGain); nGain.connect(ctx.destination);
    noise.start(now); noise.stop(now + dur);
  } catch(e){}

  // Clater de múltiples dados chocando entre sí con desaceleración progresiva
  // Se alternan dos secuencias de tonos simulando varios dados que pierden velocidad
  var taps = [
    { dt: 0.03, freq: 330, vol: 0.13 },
    { dt: 0.07, freq: 490, vol: 0.11 },
    { dt: 0.13, freq: 280, vol: 0.12 },
    { dt: 0.21, freq: 520, vol: 0.10 },
    { dt: 0.30, freq: 350, vol: 0.11 },
    { dt: 0.41, freq: 460, vol: 0.09 },
    { dt: 0.54, freq: 310, vol: 0.09 },
    { dt: 0.69, freq: 430, vol: 0.08 },
    { dt: 0.86, freq: 290, vol: 0.07 },
    { dt: 1.05, freq: 380, vol: 0.06 },
    { dt: 1.24, freq: 330, vol: 0.05 }
  ];

  taps.forEach(function(tap, idx){
    var t = now + tap.dt;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = (idx % 2 === 0) ? "triangle" : "sine";
    var baseFreq = tap.freq + (Math.random() * 40 - 20);
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.68, t + 0.04);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(tap.vol * mult, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.05);
  });
}

function playBg3DiceLand(){
  var ctx = getAudioCtx(); if(!ctx) return;
  var now = ctx.currentTime;

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

  triggerBg3Haptic('land');
}

function playBg3DiceRattle(){
  var ctx = getAudioCtx(); if(!ctx) return;
  var now = ctx.currentTime;
  try {
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = (Math.random() > 0.5) ? "triangle" : "sine";
    var freq = 290 + Math.random() * 140;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.65, now + 0.038);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.045);
  } catch(e){}
}

function playBg3ModifierAdd(){
  var ctx = getAudioCtx(); if(!ctx) return;
  var now = ctx.currentTime;
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
  triggerBg3Haptic('crit');
  var ctx = getAudioCtx(); if(!ctx) return;
  var now = ctx.currentTime;
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
  triggerBg3Haptic('fumble');
  var ctx = getAudioCtx(); if(!ctx) return;
  var now = ctx.currentTime;
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

// === MAPEO CENTRALIZADO DE ARCHIVOS DE AUDIO PARA LA TOPBAR / MENÚ ===
var TOPBAR_AUDIO_MAP = {
  ficha: 'sounds/ficha_pergamino.mp3',
  mision: 'sounds/mision_brujula.mp3',
  habilidades: 'sounds/habilidades_click.mp3',
  entrenamiento: 'sounds/entrenamiento_tela.mp3',
  combate: 'sounds/combate_espada.mp3',
  estados: 'sounds/estados_magia.mp3',
  inventario: 'sounds/backpack_open.mp3',
  magia: 'sounds/magia_destello.mp3',
  alquimia: 'sounds/alquimia_poción.mp3',
  invocaciones: 'sounds/invocaciones_eco.mp3',
  bestiario: 'sounds/bestiario_paginas.mp3',
  extra: 'sounds/extra_dados.mp3',
  mundo: 'sounds/mundo_viento.mp3'
};

var topbarAudioInstances = {};

function playTopbarTabSound(tabId){
  if(!tabId) return;
  try {
    var fileSrc = TOPBAR_AUDIO_MAP[tabId];
    if(!fileSrc) return;

    if(!topbarAudioInstances[tabId]){
      topbarAudioInstances[tabId] = new Audio(fileSrc);
      topbarAudioInstances[tabId].volume = 0.35;
      topbarAudioInstances[tabId].addEventListener('error', function(){
        if(tabId === 'alquimia' && topbarAudioInstances[tabId].src.indexOf('alquimia_pocion') === -1){
          topbarAudioInstances[tabId].src = 'sounds/alquimia_pocion.mp3';
        }
      });
    }

    var audio = topbarAudioInstances[tabId];
    // Reinicio rápido al reproducir: respuesta instantánea al cambiar rápidamente de menú
    audio.currentTime = 0;
    var playPromise = audio.play();
    if(playPromise !== undefined){
      playPromise.catch(function(){
        playProceduralTabFallback(tabId);
      });
    }
  } catch(e){
    playProceduralTabFallback(tabId);
  }
}

function playProceduralTabFallback(tabId){
  try {
    var ctx = getAudioCtx(); if(!ctx) return;
    if(tabId === "ficha" || tabId === "bestiario") playBg3Parchment();
    else if(tabId === "mision" || tabId === "habilidades") playBg3Click();
    else if(tabId === "magia" || tabId === "estados" || tabId === "invocaciones") playBg3RuneActivate();
    else if(tabId === "extra") playBg3DiceRoll(0.5);
    else playBg3Click();
  } catch(err){}
}

function playBackpackOpenSound(){
  playTopbarTabSound('inventario');
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

  var defs = '<defs>'+
    '<radialGradient id="dieGlowGrad" cx="50%" cy="40%" r="60%">'+
      '<stop offset="0%" stop-color="#9358c2" stop-opacity="0.95"/>'+
      '<stop offset="60%" stop-color="#542978" stop-opacity="0.98"/>'+
      '<stop offset="100%" stop-color="#2a0f40" stop-opacity="1"/>'+
    '</radialGradient>'+
    '<linearGradient id="dieFacetLight" x1="0%" y1="0%" x2="100%" y2="100%">'+
      '<stop offset="0%" stop-color="#a46cd4"/>'+
      '<stop offset="50%" stop-color="#693796"/>'+
      '<stop offset="100%" stop-color="#3b1757"/>'+
    '</linearGradient>'+
    '<linearGradient id="dieFacetDark" x1="0%" y1="100%" x2="100%" y2="0%">'+
      '<stop offset="0%" stop-color="#260f38"/>'+
      '<stop offset="50%" stop-color="#4a226b"/>'+
      '<stop offset="100%" stop-color="#6e379c"/>'+
    '</linearGradient>'+
    '<linearGradient id="goldEdge" x1="0%" y1="0%" x2="100%" y2="100%">'+
      '<stop offset="0%" stop-color="#FFF8E7"/>'+
      '<stop offset="35%" stop-color="#F2D8A7"/>'+
      '<stop offset="75%" stop-color="#CFA363"/>'+
      '<stop offset="100%" stop-color="#8C5E28"/>'+
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
        '<polygon points="80,10 138,42 138,118 80,150 22,118 22,42" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="2"/>'+
        '<polygon points="80,10 138,42 110,60" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="1.2" opacity="0.85"/>'+
        '<polygon points="80,10 22,42 50,60" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="1.2" opacity="0.85"/>'+
        '<polygon points="22,42 50,60 38,102 22,118" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="1.2" opacity="0.9"/>'+
        '<polygon points="138,42 110,60 122,102 138,118" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="1.2" opacity="0.9"/>'+
        '<polygon points="50,60 110,60 80,30" fill="url(#dieFacetLight)" stroke="url(#goldEdge)" stroke-width="1.5"/>'+
        '<text x="80" y="48" font-family="var(--font-display)" font-size="11" font-weight="700" fill="#DEC392" text-anchor="middle" opacity="0.65">18</text>'+
        '<polygon points="50,60 80,115 38,102" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="1.5"/>'+
        '<text x="56" y="94" font-family="var(--font-display)" font-size="11" font-weight="700" fill="#DEC392" text-anchor="middle" opacity="0.65">2</text>'+
        '<polygon points="110,60 80,115 122,102" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="1.5"/>'+
        '<text x="104" y="94" font-family="var(--font-display)" font-size="11" font-weight="700" fill="#DEC392" text-anchor="middle" opacity="0.65">8</text>'+
        '<polygon points="38,102 80,115 80,150 22,118" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="1.2" opacity="0.8"/>'+
        '<polygon points="122,102 80,115 80,150 138,118" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="1.2" opacity="0.8"/>'+
        '<text x="80" y="136" font-family="var(--font-display)" font-size="10" font-weight="700" fill="#DEC392" text-anchor="middle" opacity="0.5">14</text>'+
        '<polygon points="50,60 110,60 80,115" fill="url(#dieGlowGrad)" stroke="url(#goldEdge)" stroke-width="2.6"/>'+
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
        '<polygon points="80,12 138,32 116,56 80,44" fill="url(#dieFacetLight)" stroke="url(#goldEdge)" stroke-width="1.2" opacity="0.8"/>'+
        '<polygon points="138,32 150,92 124,96 116,56" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="1.2" opacity="0.75"/>'+
        '<polygon points="150,92 102,146 88,118 124,96" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="1.2" opacity="0.8"/>'+
        '<polygon points="58,146 10,92 36,96 72,118" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="1.2" opacity="0.8"/>'+
        '<polygon points="10,92 22,32 44,56 36,96" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="1.2" opacity="0.75"/>'+
        '<polygon points="22,32 80,12 80,44 44,56" fill="url(#dieFacetLight)" stroke="url(#goldEdge)" stroke-width="1.2" opacity="0.8"/>'+
        '<polygon points="80,44 116,56 124,96 80,120 36,96 44,56" fill="url(#dieGlowGrad)" stroke="url(#goldEdge)" stroke-width="2.5"/>'+
        '<text x="80" y="93" font-family="var(--font-display)" font-size="'+(valStr.length > 1 ? "28" : "32")+'" font-weight="800" fill="#FFF5DC" text-anchor="middle" filter="url(#runeGlow)">'+valStr+'</text>'+
      '</g>'+
    '</svg>';
  }

  // D10: Trapezoedro pentagonal elegante
  if(sides === 10){
    return '<svg class="bg3-die-svg" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">'+
      defs+
      '<g filter="drop-shadow(0 8px 14px rgba(0,0,0,0.85))">'+
        '<polygon points="80,18 140,50 118,68" fill="url(#dieFacetLight)" stroke="url(#goldEdge)" stroke-width="1.4"/>'+
        '<polygon points="80,18 20,50 42,68" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="1.4"/>'+
        '<polygon points="118,68 140,50 126,122 80,138" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="1.4" opacity="0.9"/>'+
        '<polygon points="42,68 80,138 34,122 20,50" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="1.4" opacity="0.9"/>'+
        '<polygon points="80,138 126,122 80,150" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="1.2" opacity="0.75"/>'+
        '<polygon points="80,138 80,150 34,122" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="1.2" opacity="0.75"/>'+
        '<polygon points="80,18 118,68 80,138 42,68" fill="url(#dieGlowGrad)" stroke="url(#goldEdge)" stroke-width="2.6"/>'+
        '<polygon points="80,30 110,68 80,126 50,68" fill="none" stroke="url(#goldEdge)" stroke-width="0.9" opacity="0.55"/>'+
        '<text x="80" y="86" font-family="var(--font-display)" font-size="'+(valStr.length > 1 ? "26" : "32")+'" font-weight="800" fill="#FFF5DC" text-anchor="middle" filter="url(#runeGlow)">'+valStr+'</text>'+
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
        '<polygon points="80,16 142,48 142,116 80,148 18,116 18,48" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="2"/>'+
        '<polygon points="80,16 142,48 80,80 18,48" fill="url(#dieFacetLight)" stroke="url(#goldEdge)" stroke-width="1.6"/>'+
        '<polygon points="80,80 142,48 142,116 80,148" fill="url(#dieFacetDark)" stroke="url(#goldEdge)" stroke-width="1.6"/>'+
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

  // D100: Porcentual (Par de dados)
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

function getDieSvg(sides){
  return getBg3DieSvg(sides, sides);
}

function getOrnateCupSvg(){
  return getBg3DieSvg(20, 20);
}

/* Iconos SVG temáticos para las tarjetas de bonificador de BG3 */
function getBg3ModIconSvg(type, iconHint){
  var h = (iconHint || type || "").toLowerCase();
  if(h.includes("int") || h.includes("saber") || h.includes("magia") || h.includes("book")) return '<span>📖</span>';
  if(h.includes("fis") || h.includes("fuerza") || h.includes("melee") || h.includes("espada")) return '<span>⚔️</span>';
  if(h.includes("des") || h.includes("agil") || h.includes("distancia") || h.includes("arco")) return '<span>🏹</span>';
  if(h.includes("per") || h.includes("ojo") || h.includes("advertir") || h.includes("buscar")) return '<span>👁️</span>';
  if(h.includes("car") || h.includes("voz") || h.includes("lira") || h.includes("mask")) return '<span>🎭</span>';
  if(h.includes("skill") || h.includes("entren") || h.includes("rango")) return '<span>🏅</span>';
  if(h.includes("veneno") || h.includes("mono") || h.includes("maldicion")) return '<span>💀</span>';
  return '<span>✨</span>';
}

// Motor de dados 3D canvas

var phi = (1 + Math.sqrt(5)) / 2;
var invPhi = 1 / phi;

function mat3Identity(){ return [1,0,0, 0,1,0, 0,0,1]; }
function mat3Mul(a, b){
  var r = new Array(9);
  r[0] = a[0]*b[0] + a[1]*b[3] + a[2]*b[6];
  r[1] = a[0]*b[1] + a[1]*b[4] + a[2]*b[7];
  r[2] = a[0]*b[2] + a[1]*b[5] + a[2]*b[8];

  r[3] = a[3]*b[0] + a[4]*b[3] + a[5]*b[6];
  r[4] = a[3]*b[1] + a[4]*b[4] + a[5]*b[7];
  r[5] = a[3]*b[2] + a[4]*b[5] + a[5]*b[8];

  r[6] = a[6]*b[0] + a[7]*b[3] + a[8]*b[6];
  r[7] = a[6]*b[1] + a[7]*b[4] + a[8]*b[7];
  r[8] = a[6]*b[2] + a[7]*b[5] + a[8]*b[8];
  return r;
}
function mat3FromAxisAngle(x, y, z, angle){
  var len = Math.hypot(x, y, z);
  if(len < 1e-6) return mat3Identity();
  x /= len; y /= len; z /= len;
  var c = Math.cos(angle), s = Math.sin(angle), t = 1 - c;
  return [
    t*x*x + c,    t*x*y - s*z,  t*x*z + s*y,
    t*x*y + s*z,  t*y*y + c,    t*y*z - s*x,
    t*x*z - s*y,  t*y*z + s*x,  t*z*z + c
  ];
}
function mat3VecMul(m, v){
  return [
    m[0]*v[0] + m[1]*v[1] + m[2]*v[2],
    m[3]*v[0] + m[4]*v[1] + m[5]*v[2],
    m[6]*v[0] + m[7]*v[1] + m[8]*v[2]
  ];
}
function orthonormalize(m){
  var c0 = [m[0], m[3], m[6]];
  var c1 = [m[1], m[4], m[7]];
  var l0 = Math.hypot(c0[0], c0[1], c0[2]) || 1;
  c0 = [c0[0]/l0, c0[1]/l0, c0[2]/l0];
  var dot = c1[0]*c0[0] + c1[1]*c0[1] + c1[2]*c0[2];
  c1 = [c1[0] - dot*c0[0], c1[1] - dot*c0[1], c1[2] - dot*c0[2]];
  var l1 = Math.hypot(c1[0], c1[1], c1[2]) || 1;
  c1 = [c1[0]/l1, c1[1]/l1, c1[2]/l1];
  var c2 = [
    c0[1]*c1[2] - c0[2]*c1[1],
    c0[2]*c1[0] - c0[0]*c1[2],
    c0[0]*c1[1] - c0[1]*c1[0]
  ];
  return [
    c0[0], c1[0], c2[0],
    c0[1], c1[1], c2[1],
    c0[2], c1[2], c2[2]
  ];
}
function getRotationForFaceNormal(normal){
  var nx = normal[0], ny = normal[1], nz = normal[2];
  var ay = -Math.atan2(nx, nz);
  var cy = Math.cos(ay), sy = Math.sin(ay);
  var p1z = -nx * sy + nz * cy;
  var p1y = ny;
  var ax = Math.atan2(p1y, p1z);
  var mx = mat3FromAxisAngle(1, 0, 0, ax);
  var my = mat3FromAxisAngle(0, 1, 0, ay);
  return mat3Mul(mx, my);
}

function getRotationForFace(face){
  if(!face) return mat3Identity();
  var r = face.right;
  var u = face.up;
  var n = face.normal;
  if(!r || !u || !n){
    var norm = face.normal || face;
    return getRotationForFaceNormal(norm);
  }
  // Matriz ortonormal que alinea la cara frontalmente y con su ápice hacia arriba
  var mBase = [
    r[0], r[1], r[2],
    u[0], u[1], u[2],
    n[0], n[1], n[2]
  ];
  // Inclinación cinematográfica Baldur's Gate 3 (-14° en X) para revelar volumen y biselado
  var tiltM = mat3FromAxisAngle(1, 0, 0, -0.24);
  return mat3Mul(tiltM, mBase);
}

function computeMeshInfo(vertices, rawFaces, sides, isPercentileTens){
  var faces = rawFaces.map(function(f, idx){
    var v0 = vertices[f[0]], v1 = vertices[f[1]], v2 = vertices[f[2]];
    var ax = v1[0] - v0[0], ay = v1[1] - v0[1], az = v1[2] - v0[2];
    var bx = v2[0] - v0[0], by = v2[1] - v0[1], bz = v2[2] - v0[2];
    var nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
    var len = Math.hypot(nx, ny, nz) || 1;
    nx /= len; ny /= len; nz /= len;
    var cx = 0, cy = 0, cz = 0;
    f.forEach(function(vi){ cx += vertices[vi][0]; cy += vertices[vi][1]; cz += vertices[vi][2]; });
    cx /= f.length; cy /= f.length; cz /= f.length;
    var dot = cx * nx + cy * ny + cz * nz;
    if (dot < 0){ nx = -nx; ny = -ny; nz = -nz; }

    // Vector Up intrínseco de la cara:
    // Para cubos (d6, 4 vértices), orientar hacia el punto medio del borde superior
    // Para todas las demás facetas (triángulos, deltoides, pentágonos), orientar hacia el vértice ápice v0
    var ux, uy, uz;
    if(f.length === 4 && sides === 6){
      var vTop0 = vertices[f[0]], vTop1 = vertices[f[1]];
      var midX = (vTop0[0] + vTop1[0]) * 0.5;
      var midY = (vTop0[1] + vTop1[1]) * 0.5;
      var midZ = (vTop0[2] + vTop1[2]) * 0.5;
      ux = midX - cx; uy = midY - cy; uz = midZ - cz;
    } else {
      var apex = vertices[f[0]];
      ux = apex[0] - cx; uy = apex[1] - cy; uz = apex[2] - cz;
    }
    var uLen = Math.hypot(ux, uy, uz) || 1;
    ux /= uLen; uy /= uLen; uz /= uLen;

    // Ortogonalizar Up respecto a Normal (Gram-Schmidt)
    var uDotN = ux * nx + uy * ny + uz * nz;
    ux -= uDotN * nx; uy -= uDotN * ny; uz -= uDotN * nz;
    uLen = Math.hypot(ux, uy, uz) || 1;
    ux /= uLen; uy /= uLen; uz /= uLen;

    // Vector Right = Up x Normal
    var rx = uy * nz - uz * ny;
    var ry = uz * nx - ux * nz;
    var rz = ux * ny - uy * nx;
    var rLen = Math.hypot(rx, ry, rz) || 1;
    rx /= rLen; ry /= rLen; rz /= rLen;

    var faceVal = idx + 1;
    if(sides === 10){
      if(isPercentileTens){
        // Pares opuestos d% decenas: (10,0), (30,80), (50,60), (70,40), (90,20)
        var tensMap = [10, 30, 50, 70, 90, 40, 20, 0, 80, 60];
        faceVal = tensMap[idx];
      } else {
        // Pares opuestos estandar d10 (suman 11): (1,10), (3,8), (5,6), (7,4), (9,2)
        var d10Map = [1, 3, 5, 7, 9, 4, 2, 10, 8, 6];
        faceVal = d10Map[idx];
      }
    } else if(isPercentileTens){
      faceVal = (idx === 9) ? 0 : (idx * 10);
    }
    return {
      indices: f,
      normal: [nx, ny, nz],
      up: [ux, uy, uz],
      right: [rx, ry, rz],
      center: [cx, cy, cz],
      value: faceVal
    };
  });
  return { vertices: vertices, faces: faces, sides: sides };
}

function buildD20Mesh(){
  var rawV = [
    [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
    [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
    [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
  ];
  var vertices = rawV.map(function(v){
    var len = Math.hypot(v[0], v[1], v[2]);
    return [v[0]/len, v[1]/len, v[2]/len];
  });
  var rawFaces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
  ];
  return computeMeshInfo(vertices, rawFaces, 20);
}

function buildD12Mesh(){
  var rawV = [
    [-1,-1,-1], [1,-1,-1], [1,1,-1], [-1,1,-1],
    [-1,-1,1], [1,-1,1], [1,1,1], [-1,1,1],
    [0, -invPhi, -phi], [0, invPhi, -phi], [0, -invPhi, phi], [0, invPhi, phi],
    [-invPhi, -phi, 0], [invPhi, -phi, 0], [-invPhi, phi, 0], [invPhi, phi, 0],
    [-phi, 0, -invPhi], [phi, 0, -invPhi], [-phi, 0, invPhi], [phi, 0, invPhi]
  ];
  var vertices = rawV.map(function(v){
    var len = Math.hypot(v[0], v[1], v[2]);
    return [v[0]/len, v[1]/len, v[2]/len];
  });
  var rawFaces = [
    [4, 10, 11, 7, 18], [11, 10, 5, 19, 6], [10, 4, 12, 13, 5],
    [11, 6, 15, 14, 7], [6, 19, 17, 2, 15], [5, 13, 1, 17, 19],
    [7, 14, 3, 16, 18], [4, 18, 16, 0, 12], [14, 15, 2, 9, 3],
    [12, 0, 8, 1, 13], [16, 3, 9, 8, 0], [17, 1, 8, 9, 2]
  ];
  return computeMeshInfo(vertices, rawFaces, 12);
}

function buildD10Mesh(isPercentileTens){
  // Trapezoedro pentagonal matematicamente exacto:
  // Para que cada una de las 10 facetas sea un deltoide (cometa) estrictamente PLANO,
  // la relacion entre la altura polar H y la semi-altura ecuatorial h debe satisfacer:
  // H = h * (1 + cos(36°)) / (1 - cos(36°)) ≈ 9.472136 * h.
  var cos36 = Math.cos(Math.PI / 5);
  var ratio = (1 + cos36) / (1 - cos36);
  var h = 0.11;
  var H = h * ratio; // ≈ 1.041935
  var R = 1.0;

  var vertices = [
    [0, 0, H],   // V0: apice polar superior
    [0, 0, -H]   // V1: apice polar inferior
  ];

  // Corona ecuatorial superior (z = +h)
  for(var i = 0; i < 5; i++){
    var a = (i * 2 * Math.PI) / 5;
    vertices.push([R * Math.cos(a), R * Math.sin(a), h]);
  }

  // Corona ecuatorial inferior desfasada 36° (z = -h)
  for(var j = 0; j < 5; j++){
    var a2 = ((j + 0.5) * 2 * Math.PI) / 5;
    vertices.push([R * Math.cos(a2), R * Math.sin(a2), -h]);
  }

  // Las 10 facetas en cometa (deltoides) 100% coplanares sin deformacion:
  var rawFaces = [];
  // 5 facetas superiores (conectando apice superior 0)
  for(var k = 0; k < 5; k++){
    rawFaces.push([0, 2 + k, 7 + k, 2 + ((k + 1) % 5)]);
  }
  // 5 facetas inferiores (conectando apice inferior 1)
  for(var m = 0; m < 5; m++){
    rawFaces.push([1, 7 + ((m + 1) % 5), 2 + ((m + 1) % 5), 7 + m]);
  }

  return computeMeshInfo(vertices, rawFaces, 10, isPercentileTens);
}

function buildD8Mesh(){
  var rawV = [
    [1,0,0], [-1,0,0], [0,1,0], [0,-1,0], [0,0,1], [0,0,-1]
  ];
  var rawFaces = [
    [0,2,4], [2,1,4], [1,3,4], [3,0,4],
    [2,0,5], [1,2,5], [3,1,5], [0,3,5]
  ];
  return computeMeshInfo(rawV, rawFaces, 8);
}

function buildD6Mesh(){
  var rawV = [
    [-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
    [-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]
  ].map(function(v){
    var len = Math.hypot(v[0], v[1], v[2]);
    return [v[0]/len, v[1]/len, v[2]/len];
  });
  var rawFaces = [
    [4,5,6,7], [1,0,3,2], [7,6,2,3], [0,1,5,4], [5,1,2,6], [0,4,7,3]
  ];
  return computeMeshInfo(rawV, rawFaces, 6);
}

function buildD4Mesh(){
  var rawV = [
    [1,1,1], [-1,-1,1], [-1,1,-1], [1,-1,-1]
  ].map(function(v){
    var len = Math.hypot(v[0], v[1], v[2]);
    return [v[0]/len, v[1]/len, v[2]/len];
  });
  var rawFaces = [
    [0,1,2], [0,3,1], [0,2,3], [1,3,2]
  ];
  return computeMeshInfo(rawV, rawFaces, 4);
}

function getPolyhedralMesh(sides, isPercentileTens){
  if(sides === 4) return buildD4Mesh();
  if(sides === 6) return buildD6Mesh();
  if(sides === 8) return buildD8Mesh();
  if(sides === 10) return buildD10Mesh(isPercentileTens);
  if(sides === 12) return buildD12Mesh();
  return buildD20Mesh();
}

function getMeshScale(sides){
  if(sides === 4) return 86;
  if(sides === 6) return 74;
  if(sides === 8) return 84;
  if(sides === 10) return 82;
  if(sides === 12) return 80;
  return 84;
}

var bg3LightDir = [-0.36, -0.58, 0.73];
var lLen = Math.hypot(bg3LightDir[0], bg3LightDir[1], bg3LightDir[2]);
bg3LightDir = [bg3LightDir[0]/lLen, bg3LightDir[1]/lLen, bg3LightDir[2]/lLen];

var bg3SimPrimary = {
  canvas: null,
  ctx: null,
  mesh: null,
  sides: 20,
  matrix: mat3Identity(),
  targetMatrix: mat3Identity(),
  angularVel: [0, 0, 0],
  isRolling: false,
  rollStartTime: 0,
  rollDuration: 1500,
  targetValue: 20,
  scale: 84,
  idleOffset: 0,
  dragOffsetX: 0,
  dragOffsetY: 0,
  shakeOffset: { x: 0, y: 0, r: 0 },
  landTime: 0,
  active: true,
  isPercentileTens: false
};

var bg3SimSecondary = {
  canvas: null,
  ctx: null,
  mesh: null,
  sides: 20,
  matrix: mat3Identity(),
  targetMatrix: mat3Identity(),
  angularVel: [0, 0, 0],
  isRolling: false,
  rollStartTime: 0,
  rollDuration: 1500,
  targetValue: 20,
  scale: 84,
  idleOffset: 1.8,
  dragOffsetX: 0,
  dragOffsetY: 0,
  shakeOffset: { x: 0, y: 0, r: 0 },
  landTime: 0,
  active: false,
  isPercentileTens: false
};

var bg3CanvasLoopId = null;

function initBg3Simulation(sim, canvasId, sides, initialVal, isPercentileTens){
  sim.canvas = document.getElementById(canvasId);
  if(!sim.canvas) return;
  sim.ctx = sim.canvas.getContext("2d");
  sim.sides = sides;
  sim.isPercentileTens = Boolean(isPercentileTens);
  sim.mesh = getPolyhedralMesh(sides, sim.isPercentileTens);
  sim.scale = getMeshScale(sides);
  sim.isRolling = false;
  sim.landTime = 0;
  sim.targetValue = initialVal || sides;

  var targetFace = sim.mesh.faces.find(function(f){ return f.value === sim.targetValue; }) || sim.mesh.faces[0];
  sim.targetMatrix = getRotationForFace(targetFace);
  sim.matrix = sim.targetMatrix.slice();
}

function startBg3SimRoll(sim, sides, targetVal, isIntense, duration){
  if(!sim || !sim.canvas) return;
  sim.sides = sides;
  sim.targetValue = targetVal;
  sim.isRolling = true;
  sim.rollStartTime = performance.now();
  sim.rollDuration = duration || (isIntense ? 1680 : 1450);

  var speedMult = isIntense ? 1.35 : 1.0;
  sim.angularVel = [
    ((Math.random() - 0.5) * 44 + (Math.random() > 0.5 ? 28 : -28)) * speedMult,
    ((Math.random() - 0.5) * 44 + (Math.random() > 0.5 ? 28 : -28)) * speedMult,
    ((Math.random() - 0.5) * 28) * speedMult
  ];

  var targetFace = sim.mesh.faces.find(function(f){ return f.value === targetVal; }) || sim.mesh.faces[0];
  sim.targetMatrix = getRotationForFace(targetFace);
}

function drawBg3DieSimulation(sim, time){
  if(!sim.ctx || !sim.canvas || !sim.mesh) return;
  var ctx = sim.ctx;
  var w = sim.canvas.width;
  var h = sim.canvas.height;
  var cx = w / 2;
  var cy = h / 2;

  ctx.clearRect(0, 0, w, h);

  var bounceScale = 1.0;
  var bounceY = 0;

  if(sim.isRolling){
    var elapsed = time - sim.rollStartTime;
    var progress = Math.min(1, elapsed / sim.rollDuration);

    if(progress < 0.60){
      var decay = 1.0 - (progress / 0.60) * 0.35;
      var dt = 0.016;
      var rotM = mat3FromAxisAngle(sim.angularVel[0], sim.angularVel[1], sim.angularVel[2], dt * decay * 22);
      sim.matrix = mat3Mul(rotM, sim.matrix);
    } else if(progress < 0.86){
      var subP = (progress - 0.60) / 0.26;
      var decay = 0.65 * (1 - subP) + 0.16 * subP;
      var dt = 0.016;
      var rotM = mat3FromAxisAngle(sim.angularVel[0], sim.angularVel[1], sim.angularVel[2], dt * decay * 22);
      sim.matrix = mat3Mul(rotM, sim.matrix);
    } else if(progress < 1.0){
      var tAlign = (progress - 0.86) / 0.14;
      var ease = tAlign * tAlign * (3 - 2 * tAlign);
      for(var i = 0; i < 9; i++){
        sim.matrix[i] = sim.matrix[i] * (1 - ease * 0.18) + sim.targetMatrix[i] * (ease * 0.18);
      }
      sim.matrix = orthonormalize(sim.matrix);
    } else {
      sim.matrix = sim.targetMatrix.slice();
      sim.isRolling = false;
      sim.landTime = time;
    }
  } else {
    if(sim.landTime && (time - sim.landTime < 420)){
      var dt = (time - sim.landTime) * 0.001;
      bounceScale = 1.0 + Math.sin(dt * 22) * 0.08 * Math.exp(-dt * 9);
      bounceY = -Math.sin(dt * 20) * 6 * Math.exp(-dt * 8);
    } else {
      var t = time * 0.0015 + sim.idleOffset;
      var idlePitch = Math.sin(t) * 0.045;
      var idleYaw = Math.cos(t * 0.85) * 0.055;
      var idleM = mat3Mul(mat3FromAxisAngle(1, 0, 0, idlePitch), mat3FromAxisAngle(0, 1, 0, idleYaw));
      sim.matrix = mat3Mul(idleM, sim.targetMatrix);
    }
  }

  var renderMatrix = sim.matrix.slice();
  var jx = 0, jy = 0;
  if(sim.dragOffsetX || sim.dragOffsetY){
    var dragM = mat3Mul(mat3FromAxisAngle(1, 0, 0, -sim.dragOffsetY * 0.016), mat3FromAxisAngle(0, 1, 0, sim.dragOffsetX * 0.016));
    renderMatrix = mat3Mul(dragM, renderMatrix);
    jx += sim.dragOffsetX * 0.35;
    jy += sim.dragOffsetY * 0.35;
  }
  if(sim.shakeOffset && (sim.shakeOffset.x || sim.shakeOffset.y)){
    var shakeM = mat3Mul(mat3FromAxisAngle(0, 0, 1, sim.shakeOffset.r), mat3FromAxisAngle(1, 0, 0, sim.shakeOffset.y * 0.02));
    renderMatrix = mat3Mul(shakeM, renderMatrix);
    jx += sim.shakeOffset.x;
    jy += sim.shakeOffset.y;
  }

  var mesh = sim.mesh;
  var transformedV = mesh.vertices.map(function(v){
    return mat3VecMul(renderMatrix, v);
  });

  var visibleFaces = [];
  mesh.faces.forEach(function(face){
    var norm = mat3VecMul(renderMatrix, face.normal);
    if(norm[2] > -0.005){
      var avgZ = 0;
      face.indices.forEach(function(vi){ avgZ += transformedV[vi][2]; });
      avgZ /= face.indices.length;
      visibleFaces.push({
        face: face,
        normal: norm,
        avgZ: avgZ
      });
    }
  });

  visibleFaces.sort(function(a, b){ return a.avgZ - b.avgZ; });

  var camDist = 5.2;
  var dieScale = sim.scale * bounceScale;

  // Sombra base
  var groundY = cy + dieScale * 0.94 + jy + bounceY * 0.2;
  var shadowR = dieScale * 0.82;
  var shadowGrad = ctx.createRadialGradient(cx + jx, groundY, 4, cx + jx, groundY, shadowR);
  shadowGrad.addColorStop(0, "rgba(0, 0, 0, 0.55)");
  shadowGrad.addColorStop(0.5, "rgba(0, 0, 0, 0.22)");
  shadowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.beginPath();
  ctx.ellipse(cx + jx, groundY, shadowR, shadowR * 0.26, 0, 0, Math.PI * 2);
  ctx.fillStyle = shadowGrad;
  ctx.fill();

  visibleFaces.forEach(function(vf){
    var f = vf.face;
    var n = vf.normal;

    var faceCenter = mat3VecMul(renderMatrix, f.center);
    var cPersp = camDist / (camDist - faceCenter[2] * 0.38);
    var fx = cx + faceCenter[0] * dieScale * cPersp + jx;
    var fy = cy - faceCenter[1] * dieScale * cPersp + jy + bounceY;

    var pts = f.indices.map(function(vi){
      var v = transformedV[vi];
      var persp = camDist / (camDist - v[2] * 0.38);
      return [
        cx + v[0] * dieScale * persp + jx,
        cy - v[1] * dieScale * persp + jy + bounceY
      ];
    });

    var dot = n[0]*bg3LightDir[0] + n[1]*bg3LightDir[1] + n[2]*bg3LightDir[2];
    var diffuse = Math.max(0, dot);
    var spec = Math.pow(Math.max(0, n[2]), 3.2) * 0.45;

    var r = Math.min(255, Math.floor(42 + diffuse * 85 + spec * 95));
    var g = Math.min(255, Math.floor(18 + diffuse * 48 + spec * 65));
    var b = Math.min(255, Math.floor(76 + diffuse * 130 + spec * 120));

    // Polígono exterior de la faceta
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for(var i = 1; i < pts.length; i++){
      ctx.lineTo(pts[i][0], pts[i][1]);
    }
    ctx.closePath();

    // Relleno con profundidad de gema tallada (degradado radial con highlight esférico)
    try {
      var radGrad = ctx.createRadialGradient(fx - dieScale * 0.12, fy - dieScale * 0.12, 2, fx, fy, dieScale * 0.7);
      radGrad.addColorStop(0, 'rgb(' + Math.min(255, r + 40) + ',' + Math.min(255, g + 28) + ',' + Math.min(255, b + 50) + ')');
      radGrad.addColorStop(0.65, 'rgb(' + r + ',' + g + ',' + b + ')');
      radGrad.addColorStop(1, 'rgb(' + Math.max(10, r - 26) + ',' + Math.max(6, g - 16) + ',' + Math.max(16, b - 24) + ')');
      ctx.fillStyle = radGrad;
    } catch(err){
      ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
    }
    ctx.fill();

    var goldAlpha = Math.max(0.55, Math.min(1.0, 0.72 + diffuse * 0.28));

    // 1. Bordes
    ctx.strokeStyle = 'rgba(76, 46, 16, ' + Math.min(1.0, goldAlpha + 0.2) + ')';
    ctx.lineWidth = 2.8;
    ctx.stroke();

    // 2. Filo
    ctx.strokeStyle = 'rgba(255, 238, 175, ' + goldAlpha + ')';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 3. Bisel interior
    if(n[2] > 0.45){
      var insetFactor = (sim.mesh.sides === 10 ? 0.84 : 0.80);
      var insetPts = pts.map(function(p){
        return [
          p[0] * insetFactor + fx * (1 - insetFactor),
          p[1] * insetFactor + fy * (1 - insetFactor)
        ];
      });

      ctx.beginPath();
      ctx.moveTo(insetPts[0][0], insetPts[0][1]);
      for(var k = 1; k < insetPts.length; k++){
        ctx.lineTo(insetPts[k][0], insetPts[k][1]);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(248, 222, 155, ' + (goldAlpha * 0.52) + ')';
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }

    // 4. Anillo decorativo frontal (omitido en d10 para no romper la estetica de rombo/deltoide)
    if(n[2] > 0.82 && sim.mesh.sides !== 10){
      var ringR = (sim.mesh.sides > 12 ? 15 : (sim.mesh.sides > 6 ? 18 : 22)) * cPersp;
      ctx.beginPath();
      ctx.arc(fx, fy, ringR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(253, 224, 71, ' + Math.min(0.55, n[2] * 0.5) + ')';
      ctx.lineWidth = 0.85;
      if(ctx.setLineDash){
        ctx.setLineDash([3, 2]);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        ctx.stroke();
      }
    }

    // 5. Numeracion
    var numThreshold = (sim.mesh.sides === 10 ? 0.68 : 0.52);
    if(n[2] > numThreshold){
      var isHero = (n[2] > 0.82);
      var baseSz = (sim.mesh.sides > 12 ? 24 : (sim.mesh.sides > 6 ? 28 : (sim.mesh.sides === 6 ? 32 : 30)));
      var label = String(f.value);
      if(sim.isPercentileTens){
        label = (f.value === 0) ? "00" : String(f.value);
      }
      if(sim.mesh.sides === 10 && label.length > 1){
        baseSz = 24;
      }
      var fontSz = Math.floor(baseSz * cPersp * bounceScale * (isHero ? 1.0 : 0.82));
      ctx.save();
      ctx.font = "800 " + fontSz + "px 'Cinzel Decorative', Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      var alpha = isHero ? 1.0 : Math.min(0.5, Math.pow((n[2] - numThreshold) / (1 - numThreshold), 1.2) * 0.5);

      // Sombra profunda tallada
      ctx.fillStyle = "rgba(10, 4, 14, " + (alpha * 0.9) + ")";
      ctx.fillText(label, fx + 1.2, fy + 1.4);

      // Texto con resplandor dorado si es cara principal
      if(isHero){
        ctx.shadowColor = "rgba(253, 224, 71, 0.65)";
        ctx.shadowBlur = 6;
        ctx.fillStyle = "#fff8e7";
      } else {
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(235, 215, 185, " + alpha + ")";
      }
      ctx.fillText(label, fx, fy);
      ctx.restore();

      if(!sim.isRolling && isHero && f.value === sim.targetValue && (sim.sides === 20 || sim.sides === 10)){
        if(f.value === sim.sides){
          ctx.strokeStyle = "rgba(253, 224, 71, 0.85)";
          ctx.lineWidth = 2.8;
          ctx.stroke();
        } else if(f.value === 1){
          ctx.strokeStyle = "rgba(239, 68, 68, 0.85)";
          ctx.lineWidth = 2.8;
          ctx.stroke();
        }
      }
    }
  });
}

function bg3CanvasRenderLoop(time){
  if(!bg3RollState.active){
    bg3CanvasLoopId = null;
    return;
  }
  bg3CanvasLoopId = requestAnimationFrame(bg3CanvasRenderLoop);
  if(bg3SimPrimary && bg3SimPrimary.active){
    drawBg3DieSimulation(bg3SimPrimary, time);
  }
  if(bg3SimSecondary && bg3SimSecondary.active){
    drawBg3DieSimulation(bg3SimSecondary, time);
  }
}

function startBg3CanvasLoop(){
  if(!bg3CanvasLoopId){
    bg3CanvasLoopId = requestAnimationFrame(bg3CanvasRenderLoop);
  }
}

function stopBg3CanvasLoop(){
  if(bg3CanvasLoopId){
    cancelAnimationFrame(bg3CanvasLoopId);
    bg3CanvasLoopId = null;
  }
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
  isDamage: false,
  mode: "normal", // 'normal' | 'adv' | 'disadv'
  modifiers: [],
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

/* --- ESTADO DE INTERACCIÓN (AGITAR Y ARRASTRAR) --- */

var bg3InteractionState = {
  isShaking: false,
  shakeEnergy: 0,
  shakeSamples: 0,
  lastShakeTime: 0,
  lastAccel: { x: null, y: null, z: null },
  lastRattleTime: 0,
  isDragging: false,
  hasDragged: false,
  dragStartX: 0,
  dragStartY: 0
};

function requestMotionPermissionIfNeeded(){
  if(typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function'){
    try {
      DeviceMotionEvent.requestPermission().catch(function(){});
    } catch(err){}
  }
}

function handleDeviceMotion(event){
  if(!bg3RollState.active || bg3RollState.rolling || bg3RollState.resolved) return;
  var acc = event.acceleration || event.accelerationIncludingGravity;
  if(!acc) return;
  var x = acc.x || 0, y = acc.y || 0, z = acc.z || 0;
  if(bg3InteractionState.lastAccel.x !== null){
    var dx = x - bg3InteractionState.lastAccel.x;
    var dy = y - bg3InteractionState.lastAccel.y;
    var dz = z - bg3InteractionState.lastAccel.z;
    var delta = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    // Umbral de detección de sacudida
    if(delta > 10.5){
      var now = performance.now();
      bg3InteractionState.isShaking = true;
      bg3InteractionState.shakeEnergy = Math.min(30, bg3InteractionState.shakeEnergy + delta * 0.5);
      bg3InteractionState.shakeSamples++;
      bg3InteractionState.lastShakeTime = now;

      // Vibración háptica sutil de agitación
      triggerBg3Haptic('shake');

      // Vibración física 3D en la simulación del dado
      if(bg3SimPrimary){
        bg3SimPrimary.shakeOffset = {
          x: (Math.random() - 0.5) * 16,
          y: (Math.random() - 0.5) * 16,
          r: (Math.random() - 0.5) * 0.25
        };
      }
      if(bg3SimSecondary && bg3SimSecondary.active){
        bg3SimSecondary.shakeOffset = {
          x: (Math.random() - 0.5) * 16,
          y: (Math.random() - 0.5) * 16,
          r: (Math.random() - 0.5) * 0.25
        };
      }

      // Sonido de dado agitándose dentro de cubilete
      if(now - bg3InteractionState.lastRattleTime > 110){
        playBg3DiceRattle();
        bg3InteractionState.lastRattleTime = now;
      }
    }
  }
  bg3InteractionState.lastAccel = { x: x, y: y, z: z };

  // Si el usuario estaba agitando y se detiene (al menos 3 muestras registradas)
  var curTime = performance.now();
  if(bg3InteractionState.isShaking && (curTime - bg3InteractionState.lastShakeTime > 280) && bg3InteractionState.shakeSamples >= 3){
    var energy = bg3InteractionState.shakeEnergy;
    bg3InteractionState.isShaking = false;
    bg3InteractionState.shakeSamples = 0;
    bg3InteractionState.shakeEnergy = 0;
    if(bg3SimPrimary) bg3SimPrimary.shakeOffset = { x: 0, y: 0, r: 0 };
    if(bg3SimSecondary) bg3SimSecondary.shakeOffset = { x: 0, y: 0, r: 0 };

    var launchIntensity = (energy > 16) ? "intense" : "normal";
    triggerBg3Roll(launchIntensity);
  }
}

if(typeof window !== 'undefined'){
  window.addEventListener('devicemotion', handleDeviceMotion, { passive: true });
}

function setupDiceInteractions(stage){
  if(!stage || stage._hasBg3Interactions) return;
  stage._hasBg3Interactions = true;

  var lastDragDist = 0;

  stage.addEventListener('pointerdown', function(e){
    requestMotionPermissionIfNeeded();
    if(!bg3RollState.active || bg3RollState.rolling || bg3RollState.resolved) return;
    bg3InteractionState.isDragging = true;
    bg3InteractionState.hasDragged = false;
    bg3InteractionState.dragStartX = e.clientX;
    bg3InteractionState.dragStartY = e.clientY;
    lastDragDist = 0;

    var sct = document.getElementById("bg3Sanctuary");
    if(sct) sct.classList.add("aiming");
    var canvasEls = document.querySelectorAll(".bg3-die-canvas");
    canvasEls.forEach(function(el){ el.classList.add("aiming"); });

    try { stage.setPointerCapture(e.pointerId); } catch(err){}
  });

  stage.addEventListener('pointermove', function(e){
    if(!bg3InteractionState.isDragging || !bg3RollState.active || bg3RollState.rolling || bg3RollState.resolved) return;
    var dx = e.clientX - bg3InteractionState.dragStartX;
    var dy = e.clientY - bg3InteractionState.dragStartY;
    var dist = Math.hypot(dx, dy);

    if(dist > 3){
      bg3InteractionState.hasDragged = true;

      // Dinámica de apuntado estilo tirachinas / arrastre con resistencia elástica
      var maxPull = 75;
      var pullDist = Math.min(maxPull, dist * 0.55);
      var angle = Math.atan2(dy, dx);
      var pullX = Math.cos(angle) * pullDist;
      var pullY = Math.sin(angle) * pullDist;

      if(bg3SimPrimary){
        bg3SimPrimary.dragOffsetX = pullX;
        bg3SimPrimary.dragOffsetY = pullY;
      }
      if(bg3SimSecondary && bg3SimSecondary.active){
        bg3SimSecondary.dragOffsetX = pullX * 0.85;
        bg3SimSecondary.dragOffsetY = pullY * 0.85;
      }

      var now = performance.now();
      if(dist > 12 && Math.abs(dist - lastDragDist) > 16 && (now - bg3InteractionState.lastRattleTime > 95)){
        triggerBg3Haptic('aim-tick');
        playBg3DiceRattle();
        bg3InteractionState.lastRattleTime = now;
        lastDragDist = dist;
      }
    }
  });

  var onPointerEnd = function(e){
    if(!bg3InteractionState.isDragging) return;
    bg3InteractionState.isDragging = false;
    try { stage.releasePointerCapture(e.pointerId); } catch(err){}

    var sct = document.getElementById("bg3Sanctuary");
    if(sct) sct.classList.remove("aiming");

    var canvasEls = document.querySelectorAll(".bg3-die-canvas");
    canvasEls.forEach(function(el){ el.classList.remove("aiming"); });

    if(bg3SimPrimary){
      bg3SimPrimary.dragOffsetX = 0;
      bg3SimPrimary.dragOffsetY = 0;
    }
    if(bg3SimSecondary){
      bg3SimSecondary.dragOffsetX = 0;
      bg3SimSecondary.dragOffsetY = 0;
    }

    if(!bg3RollState.active || bg3RollState.rolling || bg3RollState.resolved) return;

    var dx = e.clientX - bg3InteractionState.dragStartX;
    var dy = e.clientY - bg3InteractionState.dragStartY;
    var releaseDist = Math.hypot(dx, dy);

    // Calcular la fuerza del lanzamiento según el arrastre
    var launchIntensity = (releaseDist > 52) ? "intense" : "normal";

    // Disparar lanzamiento al soltar o hacer clic
    triggerBg3Roll(launchIntensity);
  };

  stage.addEventListener('pointerup', onPointerEnd);
  stage.addEventListener('pointercancel', onPointerEnd);
}

/* --- RENDERIZADO DEL ESCENARIO DE DADOS --- */

function renderBg3DiceSlots(){
  var slot1 = document.getElementById("bg3DieSlotPrimary");
  var slot2 = document.getElementById("bg3DieSlotSecondary");
  if(!slot1) return;

  var isD100 = (bg3RollState.sides === 100);
  var showSecond = isD100 || (bg3RollState.mode === "adv" || bg3RollState.mode === "disadv" || (bg3RollState.qty && bg3RollState.qty > 1));

  slot1.className = "bg3-die-slot";
  slot1.style.display = "flex";
  slot1.style.opacity = "1";
  slot1.style.filter = "none";
  slot1.innerHTML = '<div class="bg3-die-wrap" id="bg3DieWrapPrimary">' +
    '<canvas id="bg3DieCanvasPrimary" class="bg3-die-canvas" width="240" height="240"></canvas>' +
    '<div class="bg3-die-shadow"></div>' +
  '</div>';

  var effSides1 = isD100 ? 10 : bg3RollState.sides;
  initBg3Simulation(bg3SimPrimary, "bg3DieCanvasPrimary", effSides1, effSides1, isD100);
  bg3SimPrimary.active = true;

  if(slot2){
    if(showSecond){
      slot2.className = "bg3-die-slot";
      slot2.classList.remove("hidden");
      slot2.style.display = "flex";
      slot2.style.opacity = "1";
      slot2.style.filter = "none";
      slot2.innerHTML = '<div class="bg3-die-wrap" id="bg3DieWrapSecondary">' +
        '<canvas id="bg3DieCanvasSecondary" class="bg3-die-canvas" width="240" height="240"></canvas>' +
        '<div class="bg3-die-shadow"></div>' +
      '</div>';
      var effSides2 = isD100 ? 10 : bg3RollState.sides;
      initBg3Simulation(bg3SimSecondary, "bg3DieCanvasSecondary", effSides2, effSides2, false);
      bg3SimSecondary.active = true;
    } else {
      slot2.classList.add("hidden");
      slot2.style.display = "none";
      slot2.innerHTML = "";
      bg3SimSecondary.active = false;
    }
  }

  var stage = document.getElementById("bg3DiceStage");
  if(stage) setupDiceInteractions(stage);

  startBg3CanvasLoop();
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
  bg3RollState.isDamage = cfg.isDamage !== undefined ? Boolean(cfg.isDamage) : false;
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

  // Resetear estado de interacción
  bg3InteractionState.isShaking = false;
  bg3InteractionState.shakeEnergy = 0;
  bg3InteractionState.shakeSamples = 0;
  bg3InteractionState.isDragging = false;
  bg3InteractionState.hasDragged = false;
  bg3InteractionState.lastRattleTime = 0;

  var titleEl = document.getElementById("bg3RollTitle");
  if(titleEl) titleEl.textContent = bg3RollState.title;
  var subEl = document.getElementById("bg3RollSubtitle");
  if(subEl) subEl.textContent = bg3RollState.subtitle;

  var dcValEl = document.getElementById("bg3DcValue");
  if(dcValEl) dcValEl.textContent = bg3RollState.dc;
  var dcStatusEl = document.getElementById("bg3DcStatus");
  if(dcStatusEl) dcStatusEl.textContent = bg3RollState.dcActive ? "Objetivo activo" : (bg3RollState.isDamage ? "Tirada de daño" : "Sin CD (Libre)");
  var dcPlate = document.getElementById("bg3DcPlate");
  if(dcPlate) dcPlate.style.opacity = bg3RollState.dcActive ? "1" : "0.45";

  var promptTextEl = document.getElementById("bg3PromptText");
  if(promptTextEl){
    var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 720);
    promptTextEl.textContent = isTouch
      ? "📱 Agita el teléfono o toca el dado para lanzar"
      : "🎲 Arrastra para girar o haz clic para lanzar";
  }

  updateBg3ModePills();

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

  renderBg3ModCards();
  renderBg3DiceSlots();

  var overlay = document.getElementById("rollOverlay");
  if(overlay) overlay.classList.remove("hidden");

  playBg3RuneActivate();
}

function updateBg3ModePills(){
  var pills = document.querySelectorAll(".bg3-mode-pill");
  pills.forEach(function(p){
    var m = p.getAttribute("data-mode");
    if(m === bg3RollState.mode) p.classList.add("active");
    else p.classList.remove("active");
  });
  if(bg3RollState.active && !bg3RollState.rolling && !bg3RollState.resolved){
    renderBg3DiceSlots();
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

function triggerBg3Roll(launchIntensity){
  if(bg3RollState.rolling) return;
  bg3RollState.rolling = true;
  bg3RollState.resolved = false;
  bg3InteractionState.isShaking = false;
  bg3InteractionState.shakeEnergy = 0;
  bg3InteractionState.shakeSamples = 0;
  bg3InteractionState.isDragging = false;

  var promptBanner = document.getElementById("bg3PromptBanner");
  if(promptBanner) promptBanner.style.display = "none";
  var addModBtn = document.getElementById("bg3BtnAddMod");
  if(addModBtn) addModBtn.style.display = "none";

  var isIntense = (launchIntensity === "intense");
  var totalDuration = isIntense ? 1680 : 1450;

  triggerBg3Haptic('roll-start');
  playBg3DiceRoll(launchIntensity);

  var isD100 = (bg3RollState.sides === 100);
  var isMultiDice = (bg3RollState.qty && bg3RollState.qty > 1 && bg3RollState.mode === "normal");
  var showSecond = isD100 || (bg3RollState.mode !== "normal" || isMultiDice);

  var r1, r2, chosen;
  var extraSum = 0;

  if(isD100){
    var tens = Math.floor(Math.random() * 10) * 10;
    var units = Math.floor(Math.random() * 10);
    r1 = tens;
    r2 = units;
    chosen = (tens + units === 0) ? 100 : (tens + units);
  } else {
    r1 = rollDie(bg3RollState.sides);
    r2 = showSecond ? rollDie(bg3RollState.sides) : null;
    if(isMultiDice && bg3RollState.qty > 2){
      for(var q = 2; q < bg3RollState.qty; q++){
        extraSum += rollDie(bg3RollState.sides);
      }
    }
    chosen = r1;
    if(bg3RollState.mode === "adv") chosen = Math.max(r1, r2);
    else if(bg3RollState.mode === "disadv") chosen = Math.min(r1, r2);
    else if(isMultiDice) chosen = r1 + (r2 || 0) + extraSum;
  }

  bg3RollState.r1 = r1;
  bg3RollState.r2 = r2;
  bg3RollState.chosen = chosen;

  var wrap1 = document.getElementById("bg3DieWrapPrimary");
  var wrap2 = document.getElementById("bg3DieWrapSecondary");
  if(wrap1) wrap1.classList.add("rolling");
  if(wrap2) wrap2.classList.add("rolling");

  // Iniciar lanzamiento físico 3D en el Canvas Engine
  startBg3SimRoll(bg3SimPrimary, (isD100 ? 10 : bg3RollState.sides), r1, isIntense, totalDuration);

  if(showSecond && bg3SimSecondary.active){
    startBg3SimRoll(bg3SimSecondary, (isD100 ? 10 : bg3RollState.sides), r2, isIntense, totalDuration);
  }

  // Suspense con desaceleración y vibración háptica
  var startTime = performance.now();
  var lastPulseTime = 0;

  var tumbleTimer = setInterval(function(){
    if(!bg3RollState.rolling){
      clearInterval(tumbleTimer);
      return;
    }
    var now = performance.now();
    var elapsed = now - startTime;
    var progress = Math.min(1, elapsed / totalDuration);

    if(now - lastPulseTime > 135 && progress < 0.86){
      triggerBg3Haptic('tumble-pulse');
      lastPulseTime = now;
    }

    if(progress >= 1){
      clearInterval(tumbleTimer);
      finalizeLanding();
    }
  }, 32);

  function finalizeLanding(){
    if(wrap1){
      wrap1.classList.remove("rolling");
      wrap1.classList.add("settling");
    }
    if(wrap2){
      wrap2.classList.remove("rolling");
      wrap2.classList.add("settling");
    }

    playBg3DiceLand();

    // Resaltar dados ganadores en Ventaja, Desventaja o Multi-dados
    var slot1 = document.getElementById("bg3DieSlotPrimary");
    var slot2 = document.getElementById("bg3DieSlotSecondary");
    if(slot1 && slot2){
      if(bg3RollState.mode === "adv"){
        if(r1 >= r2){
          slot1.classList.add("winner");
          slot2.classList.add("discarded");
        } else {
          slot2.classList.add("winner");
          slot1.classList.add("discarded");
        }
      } else if(bg3RollState.mode === "disadv"){
        if(r1 <= r2){
          slot1.classList.add("winner-disadv");
          slot2.classList.add("discarded");
        } else {
          slot2.classList.add("winner-disadv");
          slot1.classList.add("discarded");
        }
      } else if(isMultiDice || isD100){
        slot1.classList.add("winner");
        slot2.classList.add("winner");
      }
    }

    // Efecto visual de bonificadores sumándose con sonido
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

    var isCrit = false;
    var isFumble = false;
    if(bg3RollState.isDamage){
      isCrit = (r1 === bg3RollState.sides);
      isFumble = (r1 === 1);
    } else if(bg3RollState.sides === 20){
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

    var delayVerdict = Math.max(300, cards.length * 140 + 100);
    setTimeout(function(){
      var vPlate = document.getElementById("bg3VerdictBanner");
      var vTitle = document.getElementById("bg3VerdictText");
      var vMath = document.getElementById("bg3VerdictBreakdown");

      if(vPlate && vTitle && vMath){
        vPlate.classList.remove("hidden", "success", "failure", "crit", "fumble");

        if(bg3RollState.isDamage){
          vPlate.classList.add("success");
          var isMax = (chosen === bg3RollState.sides * (bg3RollState.qty || 1));
          if(isMax){
            vTitle.textContent = grandTotal + " DAÑO (¡MÁXIMO EN DADOS!)";
            playBg3Crit();
          } else {
            vTitle.textContent = grandTotal + " PUNTOS DE DAÑO";
            playBg3DiceLand();
          }
        } else if(isCrit){
          vPlate.classList.add("crit");
          vTitle.textContent = "¡ÉXITO CRÍTICO!";
          playBg3Crit();
        } else if(isFumble){
          vPlate.classList.add("fumble");
          vTitle.textContent = "¡PIFIA!";
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

        var mathText = "[" + r1 + (r2 !== null ? " + " + r2 : "") + (extraSum > 0 ? " + " + extraSum : "") + "] " + (bg3RollState.isDamage ? "Arma (" + (bg3RollState.qty || 1) + "d" + bg3RollState.sides + ")" : "Dado");
        if(modSum !== 0){
          mathText += " + [" + (modSum > 0 ? "+" + modSum : modSum) + "] Bonos = " + grandTotal + (bg3RollState.isDamage ? " Daño" : "");
        }
        if(bg3RollState.dcActive){
          mathText += " (vs CD " + bg3RollState.dc + ")";
        }
        vMath.textContent = mathText;
      }

      var formulaStr = (bg3RollState.isDamage ? "Daño: " : "") + (bg3RollState.qty && bg3RollState.qty > 1 ? bg3RollState.qty : "1") + "d" + bg3RollState.sides + " [" + r1 + (r2 !== null ? ", " + r2 : "") + (extraSum > 0 ? ", +" + extraSum : "") + "]" + (modSum !== 0 ? (modSum > 0 ? " +" + modSum : " " + modSum) : "") + " = " + grandTotal;
      var rollItem = {
        id: uid(),
        charName: bg3RollState.charName,
        label: bg3RollState.title,
        total: grandTotal,
        formulaText: formulaStr,
        isCrit: isCrit,
        isFumble: isFumble,
        ts: Date.now()
      };
      state.rollLog.unshift(rollItem);
      if(state.rollLog.length > 20) state.rollLog.length = 20;
      saveState();
      broadcastDiceRoll(rollItem);

      var postActs = document.getElementById("bg3PostActions");
      if(postActs) postActs.classList.remove("hidden");

      bg3RollState.rolling = false;
      bg3RollState.resolved = true;
    }, delayVerdict);
  }
}

function closeBg3Roll(){
  var overlay = document.getElementById("rollOverlay");
  if(overlay) overlay.classList.add("hidden");
  playBg3Click();
  bg3RollState.active = false;
  stopBg3CanvasLoop();
  if(typeof bg3RollState.onResolve === "function" && bg3RollState.resolved){
    try { bg3RollState.onResolve(bg3RollState); } catch(e){}
  }
}

/* --- LANZADORES ESPECÍFICOS --- */

function openBg3SkillRoll(c, sdef){
  if(!c || !sdef) return;
  var attrKey = sdef.attr !== "hybrid" ? sdef.attr : ((c.skillHybrid && c.skillHybrid[sdef.id]) || sdef.hybridOptions[0]);
  var baseAttrVal = num(c.attrs ? c.attrs[attrKey] : 0, 0);
  var attrName = ATTR_LABELS[attrKey] || "Atributo";
  var trainBonus = num(c.skillBonus ? c.skillBonus[sdef.id] : 0, 0);

  var modifiers = [
    { label: attrName + " (Base)", val: baseAttrVal, icon: attrKey, type: "attr" }
  ];

  if(trainBonus > 0){
    modifiers.push({ label: "Entrenamiento (" + sdef.name + ")", val: trainBonus, icon: "medal", type: "skill" });
  }

  // Buffs/debuffs integrados en ficha
  if(attrKey === "percepcion" && c.buffs && c.buffs.sangre_perc){
    modifiers.push({ label: "Sangre (Percepción)", val: 2, icon: "flame", type: "buff" });
  }
  if(attrKey === "destreza" && c.buffs && c.buffs.drogado_dex){
    modifiers.push({ label: "Drogado (Destreza)", val: 1, icon: "poison", type: "buff" });
  }
  if(sdef.id === "melee" && c.buffs && c.buffs.sangre_ataque_melee){
    modifiers.push({ label: "Sangre Melé", val: 1, icon: "flame", type: "buff" });
  }
  if(sdef.id === "distancia" && c.buffs && c.buffs.sangre_ataque_dist){
    modifiers.push({ label: "Sangre Distancia", val: 1, icon: "flame", type: "buff" });
  }
  if(c.buffs && c.buffs.mono){
    modifiers.push({ label: "Mono / Abstinencia", val: -1, icon: "poison", type: "buff" });
  }

  // Buffs activos asignados del catálogo
  if(c.activeBuffs){
    c.activeBuffs.forEach(function(ab){
      if(ab.active === false) return;
      var bVal = parseFloat(ab.bonus);
      if(isNaN(bVal) || bVal === 0) return;
      if(ab.attr === sdef.id || ab.attr === attrKey || ab.attr === "todo" ||
         (sdef.id === "melee" && (ab.attr === "melé" || ab.attr === "melee" || ab.attr === "ataque")) ||
         (sdef.id === "distancia" && (ab.attr === "distancia" || ab.attr === "ataque"))){
        modifiers.push({ label: ab.name || "Buff", val: bVal, icon: bVal > 0 ? "flame" : "poison", type: "buff" });
      }
    });
  }

  // Hechizos y magias activas
  if(c.spells){
    c.spells.forEach(function(sp){
      if(sp.active && sp.statAttr && sp.statMod){
        var stacks = Math.max(1, num(sp.activeStacks, 1));
        if(sp.statAttr === sdef.id || sp.statAttr === attrKey || sp.statAttr === "todo" ||
           (sdef.id === "melee" && (sp.statAttr === "melé" || sp.statAttr === "melee" || sp.statAttr === "ataque")) ||
           (sdef.id === "distancia" && (sp.statAttr === "distancia" || sp.statAttr === "ataque"))){
          var spNum = parseFloat(sp.statMod);
          if(!isNaN(spNum) && spNum !== 0){
            modifiers.push({
              label: (sp.name || "Hechizo") + (stacks > 1 ? " (x" + stacks + ")" : ""),
              val: spNum * stacks,
              icon: spNum > 0 ? "flame" : "poison",
              type: "buff"
            });
          }
        }
      }
    });
  }

  openBg3RollModal({
    title: sdef.name,
    subtitle: "Tirada de " + sdef.name + " (1d10)",
    sides: 10,
    dc: 10,
    dcActive: true,
    isDamage: false,
    mode: "normal",
    charName: c.name,
    modifiers: modifiers
  });
}

function openBg3CustomSkillRoll(c, cs){
  if(!c || !cs) return;
  var attrKey = cs.attr || "destreza";
  var baseAttrVal = num(c.attrs ? c.attrs[attrKey] : 0, 0);
  var attrName = ATTR_LABELS[attrKey] || "Atributo";
  var bonusVal = num(cs.bonus, 0);

  var modifiers = [
    { label: attrName + " (Base)", val: baseAttrVal, icon: attrKey, type: "attr" }
  ];
  if(bonusVal > 0){
    modifiers.push({ label: "Rango", val: bonusVal, icon: "medal", type: "skill" });
  }

  if(attrKey === "percepcion" && c.buffs && c.buffs.sangre_perc){
    modifiers.push({ label: "Sangre (Percepción)", val: 2, icon: "flame", type: "buff" });
  }
  if(attrKey === "destreza" && c.buffs && c.buffs.drogado_dex){
    modifiers.push({ label: "Drogado (Destreza)", val: 1, icon: "poison", type: "buff" });
  }
  if(c.buffs && c.buffs.mono){
    modifiers.push({ label: "Mono / Abstinencia", val: -1, icon: "poison", type: "buff" });
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

  if(c.spells){
    c.spells.forEach(function(sp){
      if(sp.active && sp.statAttr && sp.statMod){
        var stacks = Math.max(1, num(sp.activeStacks, 1));
        if(sp.statAttr === cs.id || sp.statAttr === attrKey || sp.statAttr === "todo"){
          var spNum = parseFloat(sp.statMod);
          if(!isNaN(spNum) && spNum !== 0){
            modifiers.push({
              label: (sp.name || "Hechizo") + (stacks > 1 ? " (x" + stacks + ")" : ""),
              val: spNum * stacks,
              icon: spNum > 0 ? "flame" : "poison",
              type: "buff"
            });
          }
        }
      }
    });
  }

  openBg3RollModal({
    title: cs.name,
    subtitle: "Tirada de " + cs.name + " (1d10)",
    sides: 10,
    dc: 10,
    dcActive: true,
    isDamage: false,
    mode: "normal",
    charName: c.name,
    modifiers: modifiers
  });
}

function openBg3AttrRoll(c, attrKey){
  if(!c || !attrKey) return;
  var baseAttrVal = num(c.attrs ? c.attrs[attrKey] : 0, 0);
  var attrName = ATTR_LABELS[attrKey] || "Atributo";

  var modifiers = [
    { label: attrName + " (Base)", val: baseAttrVal, icon: attrKey, type: "attr" }
  ];

  if(attrKey === "percepcion" && c.buffs && c.buffs.sangre_perc){
    modifiers.push({ label: "Sangre (Percepción)", val: 2, icon: "flame", type: "buff" });
  }
  if(attrKey === "destreza" && c.buffs && c.buffs.drogado_dex){
    modifiers.push({ label: "Drogado (Destreza)", val: 1, icon: "poison", type: "buff" });
  }
  if(c.buffs && c.buffs.mono){
    modifiers.push({ label: "Mono / Abstinencia", val: -1, icon: "poison", type: "buff" });
  }

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

  if(c.spells){
    c.spells.forEach(function(sp){
      if(sp.active && sp.statAttr && sp.statMod){
        var stacks = Math.max(1, num(sp.activeStacks, 1));
        if(sp.statAttr === attrKey || sp.statAttr === "todo"){
          var spNum = parseFloat(sp.statMod);
          if(!isNaN(spNum) && spNum !== 0){
            modifiers.push({
              label: (sp.name || "Hechizo") + (stacks > 1 ? " (x" + stacks + ")" : ""),
              val: spNum * stacks,
              icon: spNum > 0 ? "flame" : "poison",
              type: "buff"
            });
          }
        }
      }
    });
  }

  openBg3RollModal({
    title: "Prueba de " + attrName,
    subtitle: "Tirada de Atributo (1d20)",
    sides: 20,
    dc: 10,
    dcActive: true,
    isDamage: false,
    mode: "normal",
    charName: c.name,
    modifiers: modifiers
  });
}

function openBg3WeaponAttackRoll(c, wpn){
  if(!c || !wpn) return;
  var catalog = (state && state.weaponsCatalog) ? state.weaponsCatalog : [];
  var catItem = catalog.find(function(ci){ return ci.name === wpn.name || ci.id === wpn.catalogId; });
  var wpnName = (wpn && wpn.name) ? wpn.name : "Arma";
  var wpnLower = wpnName.toLowerCase();
  var alcance = (catItem && catItem.alcance) ? catItem.alcance.toLowerCase() : ((wpn && wpn.alcance) ? String(wpn.alcance).toLowerCase() : "");

  var isRanged = alcance.includes("distancia") || alcance.includes("disparo") ||
                 wpnLower.includes("arco") || wpnLower.includes("ballesta") || wpnLower.includes("cerbatana") ||
                 wpnLower.includes("pistola") || wpnLower.includes("fusil") || wpnLower.includes("honda") ||
                 wpnLower.includes("arpon") || wpnLower.includes("arpón") ||
                 (alcance.includes("m") && !alcance.includes("+") && !alcance.includes("melé") && !alcance.includes("melee") && parseInt(alcance, 10) >= 5);
  var isMelee = !isRanged;

  var skillId = isMelee ? "melee" : "distancia";
  var sdef = (typeof SKILL_DEFS !== 'undefined') ? SKILL_DEFS.find(function(s){ return s.id === skillId; }) : null;
  var attrKey = sdef ? sdef.attr : (isMelee ? "fisico" : "destreza");
  var baseAttrVal = num(c.attrs ? c.attrs[attrKey] : 0, 0);
  var attrName = (typeof ATTR_LABELS !== 'undefined' && ATTR_LABELS[attrKey]) ? ATTR_LABELS[attrKey] : (isMelee ? "Físico" : "Destreza");
  var trainBonus = num(c.skillBonus ? c.skillBonus[skillId] : 0, 0);

  var modifiers = [
    { label: attrName + " (Base)", val: baseAttrVal, icon: attrKey, type: "attr" }
  ];

  if(trainBonus > 0){
    modifiers.push({ label: "Entrenamiento (" + (sdef ? sdef.name : (isMelee ? "Melé" : "Distancia")) + ")", val: trainBonus, icon: "medal", type: "skill" });
  }

  if(c.buffs){
    if(attrKey === "destreza" && c.buffs.drogado_dex) modifiers.push({ label: "Drogado (Destreza)", val: 1, icon: "poison", type: "buff" });
    if(isMelee && c.buffs.sangre_ataque_melee) modifiers.push({ label: "Sangre Melé", val: 1, icon: "flame", type: "buff" });
    if(!isMelee && c.buffs.sangre_ataque_dist) modifiers.push({ label: "Sangre Distancia", val: 1, icon: "flame", type: "buff" });
    if(c.buffs.mono) modifiers.push({ label: "Mono / Abstinencia", val: -1, icon: "poison", type: "buff" });
  }

  if(c.activeBuffs){
    c.activeBuffs.forEach(function(ab){
      if(ab.active === false) return;
      var bVal = parseFloat(ab.bonus);
      if(isNaN(bVal) || bVal === 0) return;
      if(ab.attr === skillId || ab.attr === attrKey || ab.attr === "todo" || ab.attr === "ataque" ||
         (isMelee && (ab.attr === "melé" || ab.attr === "melee")) ||
         (!isMelee && ab.attr === "distancia")){
        modifiers.push({ label: ab.name || "Buff Ataque", val: bVal, icon: bVal > 0 ? "flame" : "poison", type: "buff" });
      }
    });
  }

  if(c.spells){
    c.spells.forEach(function(sp){
      if(sp.active && sp.statAttr && sp.statMod){
        var stacks = Math.max(1, num(sp.activeStacks, 1));
        if(sp.statAttr === skillId || sp.statAttr === attrKey || sp.statAttr === "todo" || sp.statAttr === "ataque" ||
           (isMelee && (sp.statAttr === "melé" || sp.statAttr === "melee")) ||
           (!isMelee && sp.statAttr === "distancia")){
          var spNum = parseFloat(sp.statMod);
          if(!isNaN(spNum) && spNum !== 0){
            modifiers.push({
              label: (sp.name || "Hechizo") + (stacks > 1 ? " (x" + stacks + ")" : ""),
              val: spNum * stacks,
              icon: spNum > 0 ? "flame" : "poison",
              type: "buff"
            });
          }
        }
      }
    });
  }

  openBg3RollModal({
    title: wpnName + " (Ataque)",
    subtitle: "Tirada de Ataque a " + (isMelee ? "Melé" : "Distancia") + " (1d10)",
    sides: 10,
    dc: 10,
    dcActive: true,
    isDamage: false,
    mode: "normal",
    charName: c ? c.name : "Aventurero",
    modifiers: modifiers
  });
}

function openBg3WeaponRoll(c, wpn, formulaRaw){
  var reg = new RegExp('(\\d+)\\s*[dD]\\s*(\\d+)');
  var m = String(formulaRaw || "1d6").match(reg);
  var qty = m ? parseInt(m[1], 10) : 1;
  var sides = m ? parseInt(m[2], 10) : 6;
  var rest = String(formulaRaw || "").slice(m ? (m.index + m[0].length) : 0);
  var modM = rest.match(new RegExp('^\\s*([+-]\\s*\\d+)'));
  var baseMod = modM ? parseInt(modM[1].replace(/\s+/g, ""), 10) : 0;

  var modifiers = [];
  if(baseMod !== 0){
    modifiers.push({ label: "Modificador Arma", val: baseMod, icon: "sword", type: "weapon" });
  }

  var wpnName = (wpn && wpn.name) ? wpn.name : "Arma";

  // Al daño de las armas NO se le suman buffs ni debuffs de combate/habilidades
  openBg3RollModal({
    title: "Daño — " + wpnName,
    subtitle: "Tirada de Daño (" + (formulaRaw || (qty + "d" + sides)) + ")",
    sides: sides,
    qty: qty,
    dc: 10,
    dcActive: false,
    isDamage: true,
    mode: "normal",
    charName: c ? c.name : "Aventurero",
    modifiers: modifiers
  });
}

function openBg3InitRoll(c){
  if(!c) return;
  var baseInit = (c.combat && c.combat.iniciativa !== undefined) ? num(c.combat.iniciativa, 0) : 0;
  var modifiers = [
    { label: "Iniciativa (Base)", val: baseInit, icon: "destreza", type: "attr" }
  ];

  if(c.buffs && c.buffs.mono){
    modifiers.push({ label: "Mono / Abstinencia", val: -1, icon: "poison", type: "buff" });
  }

  if(c.activeBuffs){
    c.activeBuffs.forEach(function(ab){
      if(ab.active === false) return;
      var bVal = parseFloat(ab.bonus);
      if(!isNaN(bVal) && bVal !== 0 && (ab.attr === "iniciativa" || ab.attr === "todo")){
        modifiers.push({ label: ab.name || "Buff Iniciativa", val: bVal, icon: bVal > 0 ? "flame" : "poison", type: "buff" });
      }
    });
  }

  if(c.spells){
    c.spells.forEach(function(sp){
      if(sp.active && sp.statAttr && sp.statMod){
        var stacks = Math.max(1, num(sp.activeStacks, 1));
        if(sp.statAttr === "iniciativa" || sp.statAttr === "todo"){
          var spNum = parseFloat(sp.statMod);
          if(!isNaN(spNum) && spNum !== 0){
            modifiers.push({
              label: (sp.name || "Hechizo") + (stacks > 1 ? " (x" + stacks + ")" : ""),
              val: spNum * stacks,
              icon: spNum > 0 ? "flame" : "poison",
              type: "buff"
            });
          }
        }
      }
    });
  }

  openBg3RollModal({
    title: "Iniciativa",
    subtitle: "Tirada de Iniciativa (1d10)",
    sides: 10,
    dc: 10,
    dcActive: false,
    isDamage: false,
    mode: "normal",
    charName: c.name,
    modifiers: modifiers
  });
}

function openBg3FreeRoll(sides, qty, mod, mode){
  var s = parseInt(sides, 10) || 20;
  var q = parseInt(qty, 10) || 1;
  var m = parseInt(mod, 10) || 0;
  var curC = (typeof activeChar === "function") ? activeChar() : null;
  var cName = (curC && curC.name) ? curC.name : "Aventurero";

  var modifiers = [];
  if(m !== 0){
    modifiers.push({ label: "Modificador", val: m, icon: "rune", type: "custom", custom: false });
  }

  openBg3RollModal({
    title: (s === 100 ? "d% Porcentual" : (q > 1 ? q + "d" + s : "1d" + s)),
    subtitle: "Tirada Libre (" + (s === 100 ? "1d100" : q + "d" + s) + ")",
    sides: s,
    qty: q,
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
  var curC = (typeof activeChar === "function") ? activeChar() : null;
  var cName = charName || ((curC && curC.name) ? curC.name : "Aventurero");
  var sName = summonName || "Invocación";
  var aName = actionName || "Tirada";

  var modifiers = [];
  if(parsed.mod !== 0){
    modifiers.push({ label: "Bono " + aName, val: parsed.mod, icon: "sword", type: "attr" });
  }

  var isDmg = aName.toLowerCase().includes("daño") || aName.toLowerCase().includes("dano");
  var formulaDisplay = (parsed.qty > 1 ? parsed.qty : "1") + "d" + parsed.sides + (parsed.mod ? (parsed.mod > 0 ? "+" + parsed.mod : parsed.mod) : "");

  openBg3RollModal({
    title: sName + " — " + aName,
    subtitle: "Tirada de " + aName + " (" + formulaDisplay + ")",
    sides: parsed.sides,
    qty: parsed.qty,
    dc: 10,
    dcActive: false,
    isDamage: isDmg,
    mode: "normal",
    charName: sName + " (" + cName + ")",
    modifiers: modifiers
  });
}

function broadcastDiceRoll(rollObj){
  if(typeof realtimeChannel !== 'undefined' && realtimeChannel && typeof realtimeChannel.send === 'function'){
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

  var critText = rollObj.isCrit ? " ¡Éxito Crítico!" : (rollObj.isFumble ? " ¡Pifia!" : "");
  var toastType = rollObj.isCrit ? "success" : (rollObj.isFumble ? "error" : "info");
  showToast("🎲 " + rollObj.charName + " tiró " + rollObj.label + ": " + rollObj.total + critText, toastType);

  if(rollObj.isCrit) playBg3Crit();
  else if(rollObj.isFumble) playBg3Fumble();
  else { playBg3DiceRoll(); setTimeout(playBg3DiceLand, 300); }

  if(state.activeTab === "habilidades" || state.activeTab === "combate" || state.activeTab === "estados") {
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

function openDiceModal(){
  var sidesList = [
    { sides: 4, name: "d4", geom: "Tetraedro" },
    { sides: 6, name: "d6", geom: "Cubo" },
    { sides: 8, name: "d8", geom: "Octaedro" },
    { sides: 10, name: "d10", geom: "Decaedro" },
    { sides: 12, name: "d12", geom: "Dodecaedro" },
    { sides: 20, name: "d20", geom: "Icosaedro" },
    { sides: 100, name: "d%", geom: "Porcentual" }
  ];
  var diceCards = sidesList.map(function(item){
    return '<div class="dtype-card '+(diceConfig.sides===item.sides?'active':'')+'" data-action="pick-die" data-sides="'+item.sides+'" role="button" tabindex="0" title="'+item.name+' ('+item.geom+')">'+
      '<div class="die-icon-box">' + getDieSvg(item.sides) + '</div>'+
      '<span class="die-code">'+item.name+'</span>'+
      '<span class="die-geom-label">'+item.geom+'</span>'+
    '</div>';
  }).join('');

  var formulaText = (diceConfig.sides === 100) ? '1d%' : (diceConfig.qty + 'd' + diceConfig.sides);
  var modText = diceConfig.mod ? (diceConfig.mod > 0 ? (' +' + diceConfig.mod) : (' ' + diceConfig.mod)) : '';
  var modeSuffix = '';
  if(diceConfig.mode === 'adv') modeSuffix = ' (Ventaja)';
  else if(diceConfig.mode === 'disadv') modeSuffix = ' (Desventaja)';

  var fullFormula = formulaText + modText + modeSuffix;

  document.getElementById("diceModal").innerHTML =
    '<div class="cup-modal-header">'+
      '<div class="cup-modal-icon">'+getDieSvg(diceConfig.sides)+'</div>'+
      '<div class="cup-modal-title">'+
        '<h3>Lanzador de Dados</h3>'+
        '<div class="cup-modal-sub">Elige tu dado, modalidad y lanza</div>'+
      '</div>'+
      '<button class="row-del" data-action="close-modal" aria-label="Cerrar" style="min-width:30px;min-height:30px;font-size:1rem;">✕</button>'+
    '</div>'+
    '<div class="dice-mode-pills">'+
      '<button type="button" class="dmode-pill '+(diceConfig.mode==='normal'?'active':'')+'" data-action="set-dice-mode" data-mode="normal">⚔️ Normal</button>'+
      '<button type="button" class="dmode-pill '+(diceConfig.mode==='adv'?'active':'')+'" data-action="set-dice-mode" data-mode="adv">🍀 Ventaja</button>'+
      '<button type="button" class="dmode-pill '+(diceConfig.mode==='disadv'?'active':'')+'" data-action="set-dice-mode" data-mode="disadv">💀 Desventaja</button>'+
    '</div>'+
    '<div class="cup-tray-label">Dados Poliédricos</div>'+
    '<div class="dtype-grid">'+diceCards+'</div>'+
    '<div class="dice-controls-grid">'+
      (diceConfig.sides===100 ? '' :
        '<div class="dice-ctrl-col">'+
          '<div class="dice-ctrl-label"><span>Cantidad de Dados</span><span class="dice-ctrl-val" id="qtyDisplay">'+diceConfig.qty+'d'+diceConfig.sides+'</span></div>'+
          '<div class="qty-control-row">'+
            '<button type="button" class="qty-btn" data-action="dec-dice-qty" aria-label="Menos">-</button>'+
            '<input type="number" min="1" max="20" id="diceQty" value="'+diceConfig.qty+'" class="dice-num-input">'+
            '<button type="button" class="qty-btn" data-action="inc-dice-qty" aria-label="Más">+</button>'+
            '<div class="quick-qty-chips">'+
              [1,2,3,4,6].map(function(q){
                return '<button type="button" class="qty-chip '+(diceConfig.qty===q?'active':'')+'" data-action="set-dice-qty" data-qty="'+q+'">x'+q+'</button>';
              }).join('')+
            '</div>'+
          '</div>'+
        '</div>'
      )+
      '<div class="dice-ctrl-col '+(diceConfig.sides===100?'full-width':'')+'">'+
        '<div class="dice-ctrl-label"><span>Modificador</span><span class="dice-ctrl-val" id="modDisplay">'+(diceConfig.mod>=0?('+'+diceConfig.mod):diceConfig.mod)+'</span></div>'+
        '<div class="mod-control-row">'+
          '<input type="number" id="diceMod" value="'+diceConfig.mod+'" class="dice-num-input mod-input">'+
          '<div class="quick-mod-chips">'+
            [-2,0,1,2,3,5].map(function(m){
              return '<button type="button" class="mod-chip '+(diceConfig.mod===m?'active':'')+'" data-action="set-dice-mod" data-mod="'+m+'">'+(m>0?'+'+m:m)+'</button>';
            }).join('')+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<button type="button" class="btn-solid-gold btn-roll-cup" data-action="roll-dice-btn">🎲 Lanzar ' + esc(fullFormula) + '</button>';

  document.getElementById("diceModalOverlay").classList.remove("hidden");
}

function diceModalClick(e){
  var btn = e.target.closest("[data-action]"); if(!btn) return;
  var action = btn.getAttribute("data-action");

  // Preservar valores si se escribieron a mano en los inputs antes del click
  var currentQtyInput = document.getElementById("diceQty");
  if(currentQtyInput) {
    var val = parseInt(currentQtyInput.value, 10);
    if(!isNaN(val) && val >= 1) diceConfig.qty = Math.min(20, val);
  }
  var currentModInput = document.getElementById("diceMod");
  if(currentModInput) {
    var mval = parseInt(currentModInput.value, 10);
    if(!isNaN(mval)) diceConfig.mod = mval;
  }

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
