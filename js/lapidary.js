// Taller de Lapidario y Piedras Mágicas — Krysalis
// Web Audio procedimental + Minijuego de 4 Fases (Desbaste, Cortes, Pulido, Veredicto)

/* ============================================================
   FASE 1: DESBASTE DE LA GEODA — Buscaminas cuadrado con silueta de gema
   ============================================================ */

// Tabla de dificultad del desbaste (kit 0 = hierro … 5 = diamante; experiencia 1 … 10)
var GEODE_DIFFICULTY_TABLE = {
  densityBase: 0.21,
  densityPerExp: 0.006,
  densityPerKit: 0.005,
  densityMin: 0.12,
  densityMax: 0.20,
  hearts: 3,
  heartsBonusFromKit: 3,   // con kit de oro o superior, +1 corazón
  probesByKit: [0, 1, 1, 2, 2, 3],
  veins: 2,
  veinsBonusFromExp: 6     // con experiencia 6 o más, +1 veta
};

// Tabla de dificultad de los cortes (paso 2). Medidas en anchos de lienzo; un kit mejor y más experiencia siempre ayudan
var CUT_DIFFICULTY_TABLE = {
  bandMin: 0.028,          // mitad del ancho de la franja: novato con hierro
  bandMax: 0.042,          // … experto con diamante
  hardSpeedMin: 0.25,      // velocidad máxima en tramos duros ◆ (anchos por segundo)
  hardSpeedMax: 0.35,
  driftMax: 0.10,          // fuerza de la deriva de la veta (anchos por segundo)
  driftMin: 0.05,
  heatRateMax: 0.55,       // calentamiento por segundo yendo muy despacio (kit de hierro)
  heatRateMin: 0.30,       // … (kit de diamante)
  coolRate: 0.35,          // enfriamiento por segundo a ritmo normal
  idleCoolRate: 0.50,      // enfriamiento por segundo con el dedo levantado
  slowSpeed: 0.06,         // por debajo de esta velocidad la sierra se calienta
  visionMinExp: 7,         // visión limitada desde esta experiencia (no hay dato de rareza de piedra)
  visionAhead: 0.30        // fracción del recorrido restante que se ve con claridad
};

var GEODE_COLS = 7;
var GEODE_ROWS = 9;
var GEODE_ROW_WIDTHS = [3, 5, 7, 7, 7, 7, 7, 5, 3];
var GEODE_HOLD_MS = 350;
var GEODE_TUTORIAL_KEY = "krysalisGeodeTutorialSeen";

// Índice del kit de talla del personaje (0 = hierro … 5 = diamante)
function getLapidaryKitIndex(c){
  var idx = (typeof LAPIDARY_TIERS !== "undefined") ? LAPIDARY_TIERS.findIndex(function(t){ return t.id === (c && c.lapidaryTier); }) : -1;
  return Math.max(0, idx);
}

// Experiencia de talla: nivel + habilidad "Piedras mágicas", entre 1 y 10
function getLapidaryExperience(c){
  var lvl = parseInt(c && c.nivel, 10) || 1;
  var skill = (c && c.skillBonus) ? (parseInt(c.skillBonus["Piedras mágicas"], 10) || 0) : 0;
  return Math.max(1, Math.min(10, lvl + skill));
}

function getGeodeDifficulty(c){
  var T = GEODE_DIFFICULTY_TABLE;
  var kit = getLapidaryKitIndex(c);
  var exp = getLapidaryExperience(c);
  var cellCount = GEODE_ROW_WIDTHS.reduce(function(a, b){ return a + b; }, 0);
  var density = Math.max(T.densityMin, Math.min(T.densityMax, T.densityBase - exp * T.densityPerExp - kit * T.densityPerKit));
  return {
    kit: kit,
    exp: exp,
    fissures: Math.round(cellCount * density),
    hearts: T.hearts + (kit >= T.heartsBonusFromKit ? 1 : 0),
    probes: T.probesByKit[kit] || 0,
    veins: T.veins + (exp >= T.veinsBonusFromExp ? 1 : 0)
  };
}

// Mezcla dos colores hex (t = 0 → a, t = 1 → b)
function mixLapidaryHex(a, b, t){
  function parse(h){ h = String(h || "#000").replace("#", ""); if(h.length === 3) h = h.replace(/(.)/g, "$1$1"); var n = parseInt(h, 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  var x = parse(a), y = parse(b);
  return "rgb(" + x.map(function(v, i){ return Math.round(v + (y[i] - v) * t); }).join(",") + ")";
}

// Temporizadores del minijuego: se cancelan todos al cerrar el modal
function lapidaryTimeout(fn, ms){
  var id = setTimeout(fn, ms);
  lapidaryMinigameState.timers.push(id);
  return id;
}

function clearLapidaryTimers(){
  (lapidaryMinigameState.timers || []).forEach(function(id){ clearTimeout(id); });
  lapidaryMinigameState.timers = [];
}

function createGeodeGame(c){
  var d = getGeodeDifficulty(c);
  var cells = [];
  for(var r = 0; r < GEODE_ROWS; r++){
    var w = GEODE_ROW_WIDTHS[r], start = (GEODE_COLS - w) / 2;
    for(var col = 0; col < GEODE_COLS; col++){
      cells.push({ r: r, c: col, exists: col >= start && col < start + w, mine: false, vein: false, n: 0, open: false, flag: false, cracked: false, showMine: false, wrong: false });
    }
  }
  return { d: d, cells: cells, started: false, over: null, mode: "dig", probeArmed: false, hearts: d.hearts, probes: d.probes, streak: 0, maxStreak: 0, veinsFound: 0, fissuresHit: 0, fresh: {}, hintLockUntil: 0 };
}

function geodeNeighbors(G, i){
  var cell = G.cells[i], out = [];
  for(var dr = -1; dr <= 1; dr++){
    for(var dc = -1; dc <= 1; dc++){
      if(!dr && !dc) continue;
      var rr = cell.r + dr, cc = cell.c + dc;
      if(rr >= 0 && rr < GEODE_ROWS && cc >= 0 && cc < GEODE_COLS){
        var j = rr * GEODE_COLS + cc;
        if(G.cells[j].exists) out.push(j);
      }
    }
  }
  return out;
}

function shuffleLapidary(a){
  for(var i = a.length - 1; i > 0; i--){
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

// Coloca fisuras y vetas tras el primer toque: esa casilla y sus 8 vecinas son siempre seguras
function seedGeodeGame(G, safeIdx){
  var safe = {};
  safe[safeIdx] = true;
  geodeNeighbors(G, safeIdx).forEach(function(j){ safe[j] = true; });
  var pool = [];
  G.cells.forEach(function(x, i){ if(x.exists && !safe[i]) pool.push(i); });
  shuffleLapidary(pool);
  pool.slice(0, G.d.fissures).forEach(function(i){ G.cells[i].mine = true; });
  var rest = pool.slice(G.d.fissures);
  shuffleLapidary(rest);
  rest.slice(0, G.d.veins).forEach(function(i){ G.cells[i].vein = true; });
  G.cells.forEach(function(x, i){
    if(x.exists) x.n = geodeNeighbors(G, i).filter(function(j){ return G.cells[j].mine; }).length;
  });
  G.started = true;
}

// Abre casillas en cascada; guarda la distancia para animar en orden
function floodGeode(G, start, base){
  var q = [[start, base || 0]], opened = 0;
  while(q.length){
    var item = q.shift(), i = item[0], dist = item[1], x = G.cells[i];
    if(x.open || x.flag || x.mine) continue;
    x.open = true; opened++;
    G.fresh[i] = dist * 22;
    if(x.vein){
      G.veinsFound++;
      geodeFloatAt(i, "+ veta", false);
      playGemSweetSpotHit();
    }
    if(x.n === 0) geodeNeighbors(G, i).forEach(function(j){ q.push([j, dist + 1]); });
  }
  return opened;
}

function geodeState(){ return lapidaryMinigameState.geode; }

function geodeHitFissure(i){
  var G = geodeState(), x = G.cells[i];
  x.cracked = true; x.open = true;
  G.hearts--; G.streak = 0; G.fissuresHit++;
  lapidaryMinigameState.fragileHits = G.fissuresHit;
  playGemFractureTick();
  if(typeof triggerBg3Haptic === "function") triggerBg3Haptic("fumble");
  geodeFloatAt(i, "−1 ♥", true);
  var pos = geodeCellCenter(i);
  if(pos && typeof spawnFlyingRockDebris === "function") spawnFlyingRockDebris(pos.x, pos.y);
  var b = document.getElementById("lapidaryGeodeBoard");
  if(b){ b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake"); }
  geodeHintOnce("<b>¡Fisura!</b> Pierdes un corazón. Fíjate en los números de alrededor.");
  if(G.hearts <= 0) endGeodeGame("broken");
}

function geodeBumpStreak(){
  var G = geodeState();
  G.streak++;
  G.maxStreak = Math.max(G.maxStreak, G.streak);
  if(G.streak === 5 || G.streak === 10){
    var ch = document.getElementById("lapidaryGeodeStreakChip");
    if(ch){ ch.classList.remove("bump"); void ch.offsetWidth; ch.classList.add("bump"); }
    playGemSweetSpotHit();
    if(typeof triggerBg3Haptic === "function") triggerBg3Haptic("crit");
  }
}

function geodeDig(i){
  var G = geodeState(), x = G.cells[i];
  if(!G.started) seedGeodeGame(G, i);
  if(x.flag) return;
  if(x.open){ geodeChord(i); return; }
  if(x.mine){
    geodeHitFissure(i);
  } else {
    floodGeode(G, i);
    geodeBumpStreak();
    playLapidaryChiselStrike();
    if(typeof triggerBg3Haptic === "function") triggerBg3Haptic("aim-tick");
    var pos = geodeCellCenter(i);
    if(pos && typeof spawnRockDustParticles === "function") spawnRockDustParticles(pos.x, pos.y);
  }
  geodeAfterMove();
}

// Tocar un número con todas sus banderas abre sus vecinas
function geodeChord(i){
  var G = geodeState(), x = G.cells[i];
  if(!x.n || x.cracked) return;
  var ns = geodeNeighbors(G, i);
  var flags = ns.filter(function(j){ return G.cells[j].flag || G.cells[j].cracked; }).length;
  var closed = ns.filter(function(j){ return !G.cells[j].open && !G.cells[j].flag; });
  if(flags !== x.n || !closed.length){
    if(closed.length){
      geodePeek(i, 900);
      geodeHintOnce("Para abrir alrededor de este <b>" + x.n + "</b>, primero marca sus " + x.n + " fisura" + (x.n > 1 ? "s" : "") + " con la bandera.");
    }
    return;
  }
  var hit = false;
  closed.forEach(function(j){
    if(G.over) return;
    if(G.cells[j].mine){ hit = true; geodeHitFissure(j); }
    else floodGeode(G, j);
  });
  if(!hit){
    geodeBumpStreak();
    playLapidaryChiselStrike();
    if(typeof triggerBg3Haptic === "function") triggerBg3Haptic("aim-tick");
  }
  geodeAfterMove();
}

function geodeToggleFlag(i){
  var G = geodeState(), x = G.cells[i];
  if(x.open || G.over) return;
  x.flag = !x.flag;
  playLapidaryScrape();
  if(typeof triggerBg3Haptic === "function") triggerBg3Haptic("shake");
  renderGeodeBoard();
}

// Sonda: revela una zona de 3×3 sin riesgo y marca sola sus fisuras
function geodeProbe(i){
  var G = geodeState();
  if(!G.started) seedGeodeGame(G, i);
  var zone = [i].concat(geodeNeighbors(G, i));
  zone.forEach(function(j){ var y = G.cells[j]; if(!y.open && y.mine) y.flag = true; });
  zone.forEach(function(j){ var y = G.cells[j]; if(!y.mine && !y.open){ y.flag = false; floodGeode(G, j, 1); } });
  G.probes--; G.probeArmed = false;
  playGemSweetSpotHit();
  if(typeof triggerBg3Haptic === "function") triggerBg3Haptic("land");
  geodeHintOnce("La sonda ha despejado la zona y ha marcado sus fisuras.");
  geodeAfterMove();
}

function geodeAfterMove(){
  var G = geodeState();
  if(!G.over){
    var safeLeft = G.cells.some(function(x){ return x.exists && !x.mine && !x.open; });
    if(!safeLeft){ endGeodeGame("perfect"); return; }
  }
  renderGeodeBoard();
}

// Nota del desbaste (0-100): un único sitio
function computeGeodeScore(G){
  var safe = G.cells.filter(function(x){ return x.exists && !x.mine; });
  var opened = safe.filter(function(x){ return x.open; }).length;
  var crust = Math.round(opened / Math.max(1, safe.length) * 60);
  var integ = Math.round(Math.max(0, G.hearts) / G.d.hearts * 25);
  var veins = Math.round(G.veinsFound / Math.max(1, G.d.veins) * 10);
  var streak = G.maxStreak >= 10 ? 5 : (G.maxStreak >= 5 ? 3 : (G.maxStreak >= 3 ? 1 : 0));
  var total = crust + integ + veins + streak;
  var broken = G.hearts <= 0;
  if(broken) total = Math.round(total * 0.6);
  return { crust: crust, integ: integ, veins: veins, streak: streak, broken: broken, total: Math.min(100, total), opened: opened, safeN: safe.length };
}

function endGeodeGame(kind){
  var G = geodeState();
  if(G.over) return;
  G.over = kind;
  G.probeArmed = false;
  G.cells.forEach(function(x){
    if(x.mine && !x.cracked && !x.flag) x.showMine = true;
    if(x.flag && !x.mine) x.wrong = true;
  });
  var s = computeGeodeScore(G);
  lapidaryMinigameState.phase1Score = s.total;
  lapidaryMinigameState.cleanPct = Math.round(s.opened / Math.max(1, s.safeN) * 100);
  renderGeodeBoard();
  if(kind === "broken") playGemFracture(); else playSlideSuccess();
  if(typeof triggerBg3Haptic === "function") triggerBg3Haptic(kind === "broken" ? "fumble" : "crit");
  lapidaryTimeout(function(){ openGeodeSheet("end"); }, kind === "broken" ? 650 : 350);
}

function geodeCellCenter(i){
  var wrap = document.getElementById("lapidaryGeodeWrap");
  var el = wrap ? wrap.querySelector('[data-i="' + i + '"]') : null;
  if(!el) return null;
  var a = el.getBoundingClientRect(), w = wrap.getBoundingClientRect();
  return { x: a.left - w.left + a.width / 2, y: a.top - w.top + a.height / 2 };
}

function geodeFloatAt(i, txt, bad){
  var wrap = document.getElementById("lapidaryGeodeWrap");
  var pos = geodeCellCenter(i);
  if(!wrap || !pos) return;
  var f = document.createElement("div");
  f.className = "lapidary-geode-floater" + (bad ? " bad" : "");
  f.textContent = txt;
  f.style.left = (pos.x - 24) + "px";
  f.style.top = (pos.y - 18) + "px";
  wrap.appendChild(f);
  lapidaryTimeout(function(){ if(f.parentNode) f.parentNode.removeChild(f); }, 950);
}

var GEODE_SVG_CRACK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 L10 8 L14 11 L9 16 L12 22" stroke="#F07A84" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 11 L19 9 M10 8 L5 6 M9 16 L4 18" stroke="#F07A84" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';
var GEODE_SVG_MINE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 L11 9 L14 12 L10 17 L12 21" stroke="#C84B57" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/></svg>';
var GEODE_SVG_GEM = '<svg class="lapidary-geode-gemmark" viewBox="0 0 40 40" aria-hidden="true"><polygon points="10,6 30,6 38,16 20,36 2,16" fill="#fff" opacity=".9"/><polygon points="2,16 38,16 20,36" fill="currentColor" opacity=".55"/></svg>';

function geodeCellsHTML(G){
  var h = "";
  G.cells.forEach(function(x, i){
    if(!x.exists){ h += '<div class="lapidary-geode-void"></div>'; return; }
    var cls = "lapidary-geode-cell", inner = "", label;
    if(x.cracked){ cls += " cracked"; inner = GEODE_SVG_CRACK; label = "Fisura golpeada"; }
    else if(x.open){
      cls += " open";
      if(x.vein){ cls += " vein"; inner = GEODE_SVG_GEM; label = "Veta preciosa"; }
      else if(x.n){
        cls += " n" + Math.min(4, x.n); inner = x.n; label = x.n + " fisuras alrededor";
        var ns = geodeNeighbors(G, i);
        if(ns.filter(function(j){ return G.cells[j].flag || G.cells[j].cracked; }).length === x.n && ns.some(function(j){ return !G.cells[j].open && !G.cells[j].flag; })) cls += " chordable";
      }
      else label = "Limpia";
    }
    else if(x.showMine){ cls += " mine"; inner = GEODE_SVG_MINE; label = "Fisura"; }
    else if(x.flag){ inner = '<span class="lapidary-geode-flag">⚑</span>'; label = "Marcada"; if(x.wrong) cls += " wrong"; }
    else label = "Costra";
    var st = "";
    if(G.fresh[i] !== undefined){ cls += " new"; st = ' style="--d:' + G.fresh[i] + 'ms"'; }
    h += '<button type="button" class="' + cls + '" data-i="' + i + '"' + st + ' aria-label="' + label + '">' + inner + '</button>';
  });
  G.fresh = {};
  return h;
}

// Repinta solo el tablero y los marcadores (sin rehacer el modal ni perder los eventos)
function renderGeodeBoard(){
  var G = geodeState();
  var board = document.getElementById("lapidaryGeodeBoard");
  if(!G || !board) return;
  board.innerHTML = geodeCellsHTML(G);

  var flags = G.cells.filter(function(x){ return x.flag || x.cracked; }).length;
  var hearts = "";
  for(var k = 0; k < G.d.hearts; k++) hearts += (k < G.hearts ? icono("corazon") : '<span class="off">' + icono("corazon") + '</span>');
  var setHTML = function(id, v){ var el = document.getElementById(id); if(el) el.innerHTML = v; };
  setHTML("lapidaryGeodeHearts", hearts);
  setHTML("lapidaryGeodeFissures", String(Math.max(0, G.d.fissures - flags)));
  setHTML("lapidaryGeodeProbes", String(G.probes));
  setHTML("lapidaryGeodeProbeCount", String(G.probes));
  setHTML("lapidaryGeodeStreak", G.streak >= 10 ? "×2" : (G.streak >= 5 ? "×1,5" : "×1"));

  var s = G.started ? computeGeodeScore(G) : { opened: 0, safeN: 1, total: 0 };
  var pct = Math.round(s.opened / s.safeN * 100);
  setHTML("lapidaryGeodePct", pct + "%");
  var bar = document.getElementById("lapidaryGeodeBar");
  if(bar) bar.style.width = pct + "%";

  var canFinish = pct >= 70 && !G.over;
  var fin = document.getElementById("lapidaryGeodeFinish");
  if(fin){
    fin.disabled = !canFinish && !G.over;
    fin.classList.toggle("ready", canFinish || !!G.over);
    fin.textContent = G.over ? "Ver resultado" : (canFinish ? "Terminar desbaste (" + s.total + " pts)" : "Terminar desbaste (desde el 70%)");
  }
  var probeBtn = document.getElementById("lapidaryGeodeProbeBtn");
  if(probeBtn){
    probeBtn.disabled = G.probes <= 0 || !!G.over;
    probeBtn.setAttribute("aria-pressed", G.probeArmed ? "true" : "false");
  }
  var dig = document.getElementById("lapidaryGeodeModeDig");
  var flag = document.getElementById("lapidaryGeodeModeFlag");
  if(dig) dig.setAttribute("aria-pressed", G.mode === "dig" ? "true" : "false");
  if(flag) flag.setAttribute("aria-pressed", G.mode === "flag" ? "true" : "false");
  var wrap = document.getElementById("lapidaryGeodeWrap");
  if(wrap) wrap.classList.toggle("probe", G.probeArmed);
  if(Date.now() >= G.hintLockUntil) setGeodeHint(pct);
}

function geodeHintOnce(t){
  var G = geodeState();
  var el = document.getElementById("lapidaryGeodeHint");
  if(el) el.innerHTML = t;
  G.hintLockUntil = Date.now() + 2400;
  lapidaryTimeout(function(){
    var g = geodeState();
    if(g && Date.now() >= g.hintLockUntil && lapidaryMinigameState.phase === 1) renderGeodeBoard();
  }, 2500);
}

function setGeodeHint(pct){
  var G = geodeState(), t;
  if(G.over) t = "Desbaste terminado. Pulsa <b>Ver resultado</b> para seguir.";
  else if(G.probeArmed) t = "<b>Sonda lista:</b> toca una casilla para examinar su zona de 3×3.";
  else if(!G.started) t = "Toca cualquier casilla para empezar. <b>El primer golpe es seguro.</b>";
  else if(G.mode === "flag") t = "<b>Modo marcar:</b> toca para poner o quitar una bandera.";
  else if(pct >= 70) t = "Ya puedes <b>terminar</b>, o seguir para subir la nota.";
  else t = "El número indica las fisuras de alrededor. <b>Mantén pulsado</b> para marcar.";
  var el = document.getElementById("lapidaryGeodeHint");
  if(el) el.innerHTML = t;
}

// Ilumina las 8 vecinas de un número
function geodePeek(i, ms){
  var G = geodeState();
  var board = document.getElementById("lapidaryGeodeBoard");
  if(!board) return;
  geodeUnpeek();
  board.classList.add("peeking");
  var src = board.querySelector('[data-i="' + i + '"]');
  if(src) src.classList.add("peek-src");
  geodeNeighbors(G, i).forEach(function(j){
    var el = board.querySelector('[data-i="' + j + '"]');
    if(el) el.classList.add("peek");
  });
  var x = G.cells[i], ns = geodeNeighbors(G, i);
  var fl = ns.filter(function(j){ return G.cells[j].flag || G.cells[j].cracked; }).length;
  var cov = ns.filter(function(j){ return !G.cells[j].open && !G.cells[j].flag; }).length;
  geodeHintOnce("Este <b>" + x.n + "</b> cuenta las casillas iluminadas: hay <b>" + x.n + " fisura" + (x.n > 1 ? "s" : "") + "</b> entre ellas. Marcadas: " + fl + " · Tapadas sin marcar: " + cov + ".");
  if(ms) lapidaryTimeout(geodeUnpeek, ms);
}

function geodeUnpeek(){
  var board = document.getElementById("lapidaryGeodeBoard");
  if(!board) return;
  board.classList.remove("peeking");
  board.querySelectorAll(".peek,.peek-src").forEach(function(el){ el.classList.remove("peek", "peek-src"); });
}

// Toque, pulsación larga (bandera) y mantener sobre un número (ver vecinas)
function initGeodeBoard(){
  var board = document.getElementById("lapidaryGeodeBoard");
  if(!board || board._geodeBound) return;
  board._geodeBound = true;
  var press = null;

  function cancelPress(){
    if(!press) return;
    clearTimeout(press.t);
    press.el.classList.remove("holding");
    if(press.fired) geodeUnpeek();
    press = null;
  }

  board.addEventListener("contextmenu", function(e){ e.preventDefault(); });
  board.addEventListener("pointerdown", function(e){
    var G = geodeState();
    var el = e.target.closest(".lapidary-geode-cell");
    if(!el || !G || G.over) return;
    var i = +el.getAttribute("data-i");
    press = { i: i, x: e.clientX, y: e.clientY, fired: false, el: el };
    var x = G.cells[i];
    if(!x.open && !G.probeArmed){
      el.classList.add("holding");
      press.t = setTimeout(function(){
        if(!press) return;
        press.fired = true;
        el.classList.remove("holding");
        geodeToggleFlag(i);
      }, GEODE_HOLD_MS);
    } else if(x.open && x.n && !x.cracked){
      press.t = setTimeout(function(){
        if(!press) return;
        press.fired = true;
        geodePeek(i);
        if(typeof triggerBg3Haptic === "function") triggerBg3Haptic("aim-tick");
      }, 220);
    }
  });
  board.addEventListener("pointermove", function(e){
    if(press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 12) cancelPress();
  });
  board.addEventListener("pointercancel", cancelPress);
  board.addEventListener("pointerleave", cancelPress);
  board.addEventListener("pointerup", function(){
    if(!press) return;
    var p = press;
    cancelPress();
    var G = geodeState();
    if(p.fired || !G || G.over) return;
    var x = G.cells[p.i];
    if(G.probeArmed){ if(!x.open) geodeProbe(p.i); return; }
    if(G.mode === "flag" && !x.open) geodeToggleFlag(p.i);
    else geodeDig(p.i);
  });
}

/* ---------- Hojas: ayuda, partida guiada y resultado ---------- */

function openGeodeSheet(kind){
  var host = document.getElementById("lapidaryGeodeSheet");
  if(!host) return;
  var G = geodeState();
  var html = '<div class="lapidary-sheet-bg" data-action="geode-sheet-bg"><div class="lapidary-sheet" role="dialog" aria-modal="true">';

  if(kind === "help"){
    html += '<span class="lapidary-sheet-tag">Cómo se juega</span>' +
      '<h3 class="lapidary-sheet-title">Quita la costra sin romper la piedra</h3>' +
      '<div class="lapidary-help-cards">' +
        '<div class="lapidary-help-card"><div class="ill n2">2</div><div><h4>Pica la costra</h4><p>Toca una casilla. El número dice cuántas <b>fisuras</b> hay en las 8 casillas de alrededor. El primer golpe siempre es seguro.</p></div></div>' +
        '<div class="lapidary-help-card"><div class="ill flag">⚑</div><div><h4>Marca las fisuras</h4><p><b>Mantén pulsado</b> o usa el modo Marcar. Si tocas un número que ya tiene todas sus banderas, se abren las demás casillas de alrededor.</p></div></div>' +
        '<div class="lapidary-help-card"><div class="ill probe">◎</div><div><h4>Ayudas y premios</h4><p>La <b>sonda</b> examina una zona de 3×3 sin riesgo. Las <b>vetas doradas</b> y la <b>racha</b> suben la nota. Cada fisura que picas cuesta un corazón.</p></div></div>' +
      '</div>' +
      '<div class="lapidary-sheet-actions">' +
        '<button type="button" class="lapidary-ghost-btn" data-action="geode-open-tutorial">Partida guiada</button>' +
        '<button type="button" class="lapidary-cta-btn" data-action="geode-close-sheet">Entendido</button>' +
      '</div>';
  } else if(kind === "end"){
    var s = computeGeodeScore(G);
    var title = G.over === "perfect" ? "Desbaste perfecto" : (G.over === "broken" ? "La piedra no aguanta más" : "Desbaste terminado");
    var row = function(a, b, pen){ return '<div' + (pen ? ' class="pen"' : '') + '><span>' + a + '</span><span>' + b + '</span></div>'; };
    html += '<span class="lapidary-sheet-tag">Resultado del desbaste</span>' +
      '<h3 class="lapidary-sheet-title">' + title + '</h3>' +
      '<div class="lapidary-sheet-score"><b>' + s.total + '</b><span>/ 100</span></div>' +
      '<div class="lapidary-sheet-rows">' +
        row("Costra retirada (" + s.opened + "/" + s.safeN + ")", s.crust + " / 60") +
        row("Integridad (" + Math.max(0, G.hearts) + " de " + G.d.hearts + " " + icono("corazon", {tam:"s"}) + ")", s.integ + " / 25") +
        row("Vetas encontradas (" + G.veinsFound + " de " + G.d.veins + ")", s.veins + " / 10") +
        row("Mejor racha (" + G.maxStreak + ")", s.streak + " / 5") +
        (s.broken ? row("Sin corazones", "×0,6", true) : "") +
      '</div>' +
      '<div class="lapidary-sheet-actions">' +
        '<button type="button" class="lapidary-ghost-btn" data-action="geode-close-sheet">Ver la piedra</button>' +
        '<button type="button" class="lapidary-cta-btn" data-action="advance-to-slide-cuts">Pasar a los cortes</button>' +
      '</div>';
  }
  html += '</div></div>';
  host.innerHTML = html;
}

function closeGeodeSheet(){
  var host = document.getElementById("lapidaryGeodeSheet");
  if(host) host.innerHTML = "";
  lapidaryMinigameState.geodeTutorial = null;
}

// Partida guiada: tablero fijo de 5×5
var GEODE_TUT_COLS = 5;
var GEODE_TUT_MINES = [0, 12, 23];
var GEODE_TUT_OPEN = [1, 2, 3, 4, 6, 7, 8, 9, 13, 14, 18, 19];
var GEODE_TUT_STEPS = [
  { peek: 8, text: "Cada número cuenta las <b>8 casillas</b> que lo rodean. Este <b>1</b> dice: entre las casillas iluminadas hay <b>1 fisura</b>." },
  { peek: 8, target: 12, act: "flag", text: "De todas ellas, solo queda <b>una tapada</b>. La fisura tiene que estar ahí. <b>Mantén el dedo</b> sobre ella hasta que salga la bandera." },
  { peek: 7, target: 11, act: "dig", text: "Este otro <b>1</b> también toca esa fisura, y ya está marcada. Así que su otra casilla tapada es <b>segura</b>: tócala." },
  { peek: 11, target: 11, act: "chord", text: "Ha salido otro <b>1</b>, y su fisura ya tiene bandera. <b>Toca el número</b> y se abren de golpe todas las casillas seguras de alrededor." },
  { text: "<b>¡Así se juega!</b> Mira los números, deduce dónde están las fisuras y márcalas. Si dudas, mantén pulsado un número para ver qué casillas cuenta." }
];

function geodeTutNeighbors(i){
  var r = Math.floor(i / GEODE_TUT_COLS), c = i % GEODE_TUT_COLS, o = [];
  for(var a = -1; a <= 1; a++){
    for(var b = -1; b <= 1; b++){
      if(!a && !b) continue;
      var rr = r + a, cc = c + b;
      if(rr >= 0 && rr < GEODE_TUT_COLS && cc >= 0 && cc < GEODE_TUT_COLS) o.push(rr * GEODE_TUT_COLS + cc);
    }
  }
  return o;
}

function openGeodeTutorial(){
  var cells = [];
  for(var i = 0; i < GEODE_TUT_COLS * GEODE_TUT_COLS; i++){
    cells.push({ mine: GEODE_TUT_MINES.indexOf(i) !== -1, open: GEODE_TUT_OPEN.indexOf(i) !== -1, flag: false, n: 0 });
  }
  cells.forEach(function(x, i){ x.n = geodeTutNeighbors(i).filter(function(j){ return cells[j].mine; }).length; });
  lapidaryMinigameState.geodeTutorial = { cells: cells, step: 0, fresh: {} };

  var host = document.getElementById("lapidaryGeodeSheet");
  if(!host) return;
  host.innerHTML = '<div class="lapidary-sheet-bg"><div class="lapidary-sheet" role="dialog" aria-modal="true">' +
    '<span class="lapidary-sheet-tag">Partida guiada · <span id="lapidaryTutStep">1</span> de 5</span>' +
    '<h3 class="lapidary-sheet-title">Aprende a leer la piedra</h3>' +
    '<div class="lapidary-geode-tboard" id="lapidaryTutBoard"></div>' +
    '<div class="lapidary-tut-text" id="lapidaryTutText" aria-live="polite"></div>' +
    '<div class="lapidary-tut-dots" id="lapidaryTutDots"></div>' +
    '<div class="lapidary-sheet-actions">' +
      '<button type="button" class="lapidary-link-btn" id="lapidaryTutSkip" data-action="geode-tutorial-skip">Saltar</button>' +
      '<button type="button" class="lapidary-cta-btn" id="lapidaryTutNext" data-action="geode-tutorial-next">Siguiente</button>' +
    '</div>' +
  '</div></div>';
  initGeodeTutorialBoard();
  renderGeodeTutorial();
}

function geodeTutFlood(i, d){
  var T = lapidaryMinigameState.geodeTutorial;
  var q = [[i, d || 0]];
  while(q.length){
    var it = q.shift(), k = it[0], dd = it[1], x = T.cells[k];
    if(x.open || x.mine || x.flag) continue;
    x.open = true; T.fresh[k] = dd * 40;
    if(!x.n) geodeTutNeighbors(k).forEach(function(j){ q.push([j, dd + 1]); });
  }
}

function renderGeodeTutorial(){
  var T = lapidaryMinigameState.geodeTutorial;
  if(!T) return;
  var s = GEODE_TUT_STEPS[T.step], h = "";
  T.cells.forEach(function(x, i){
    var cls = "lapidary-geode-cell", inner = "";
    if(x.open){ cls += " open"; if(x.n){ cls += " n" + Math.min(4, x.n); inner = x.n; } }
    else if(x.flag) inner = '<span class="lapidary-geode-flag">⚑</span>';
    if(s.peek === i) cls += " peek-src";
    else if(s.peek != null && geodeTutNeighbors(s.peek).indexOf(i) !== -1) cls += " peek";
    if(s.target === i) cls += " target";
    var st = "";
    if(T.fresh[i] !== undefined){ cls += " new"; st = ' style="--d:' + T.fresh[i] + 'ms"'; }
    h += '<button type="button" class="' + cls + '" data-t="' + i + '"' + st + ' aria-label="' + (x.open ? (x.n ? x.n + " fisuras alrededor" : "Limpia") : (x.flag ? "Marcada" : "Costra")) + '">' + inner + '</button>';
  });
  T.fresh = {};
  var tb = document.getElementById("lapidaryTutBoard");
  if(!tb) return;
  tb.innerHTML = h;
  tb.classList.toggle("focus", s.peek != null || s.target != null);
  document.getElementById("lapidaryTutText").innerHTML = s.text;
  document.getElementById("lapidaryTutStep").textContent = T.step + 1;
  document.getElementById("lapidaryTutDots").innerHTML = GEODE_TUT_STEPS.map(function(_, k){ return '<i class="' + (k <= T.step ? "on" : "") + '"></i>'; }).join("");
  var last = T.step === GEODE_TUT_STEPS.length - 1;
  var next = document.getElementById("lapidaryTutNext");
  next.hidden = s.target != null;
  next.textContent = last ? "Empezar con la piedra" : "Siguiente";
  document.getElementById("lapidaryTutSkip").hidden = last;
}

function initGeodeTutorialBoard(){
  var tb = document.getElementById("lapidaryTutBoard");
  if(!tb) return;
  var tpress = null;
  function tCancel(){ if(tpress){ clearTimeout(tpress.t); tpress.el.classList.remove("holding"); tpress = null; } }
  tb.addEventListener("contextmenu", function(e){ e.preventDefault(); });
  tb.addEventListener("pointerdown", function(e){
    var T = lapidaryMinigameState.geodeTutorial;
    var el = e.target.closest(".lapidary-geode-cell");
    if(!el || !T) return;
    var i = +el.getAttribute("data-t"), s = GEODE_TUT_STEPS[T.step];
    tpress = { i: i, el: el, x: e.clientX, y: e.clientY, fired: false };
    if(s.act === "flag" && s.target === i){
      el.classList.add("holding");
      tpress.t = setTimeout(function(){
        if(!tpress) return;
        tpress.fired = true;
        el.classList.remove("holding");
        T.cells[i].flag = true;
        playLapidaryScrape();
        if(typeof triggerBg3Haptic === "function") triggerBg3Haptic("shake");
        renderGeodeTutorial();
        T.step++;
        lapidaryTimeout(renderGeodeTutorial, 250);
      }, GEODE_HOLD_MS);
    }
  });
  tb.addEventListener("pointermove", function(e){ if(tpress && Math.hypot(e.clientX - tpress.x, e.clientY - tpress.y) > 12) tCancel(); });
  tb.addEventListener("pointercancel", tCancel);
  tb.addEventListener("pointerleave", tCancel);
  tb.addEventListener("pointerup", function(){
    if(!tpress) return;
    var p = tpress;
    tCancel();
    if(p.fired) return;
    var T = lapidaryMinigameState.geodeTutorial;
    if(!T) return;
    var s = GEODE_TUT_STEPS[T.step], txt = document.getElementById("lapidaryTutText");
    if(s.target !== p.i){
      if(s.target != null && txt) txt.innerHTML = s.text + '<br><span class="lapidary-tut-nudge">Toca la casilla que parpadea.</span>';
      return;
    }
    if(s.act === "flag"){
      if(txt) txt.innerHTML = s.text + '<br><span class="lapidary-tut-nudge">Mantén el dedo apoyado un momento, no lo levantes enseguida.</span>';
      return;
    }
    if(s.act === "dig"){
      geodeTutFlood(p.i);
      playLapidaryChiselStrike();
      if(typeof triggerBg3Haptic === "function") triggerBg3Haptic("aim-tick");
      T.step++; renderGeodeTutorial(); return;
    }
    if(s.act === "chord"){
      geodeTutNeighbors(p.i).forEach(function(j){ geodeTutFlood(j, 1); });
      playGemSweetSpotHit();
      if(typeof triggerBg3Haptic === "function") triggerBg3Haptic("land");
      T.step++; renderGeodeTutorial(); return;
    }
  });
}

function finishGeodeTutorial(){
  try { localStorage.setItem(GEODE_TUTORIAL_KEY, "1"); } catch(e){}
  closeGeodeSheet();
}

// Acciones propias del desbaste (botones del pulgar y de las hojas)
document.addEventListener("click", function(e){
  var btn = e.target.closest("[data-action]");
  if(!btn || !lapidaryMinigameState.active) return;
  var act = btn.getAttribute("data-action");
  var G = geodeState();

  if(act === "geode-sheet-bg"){
    if(e.target === btn) closeGeodeSheet();
  } else if(act === "geode-mode"){
    if(!G || G.over) return;
    G.mode = btn.getAttribute("data-mode") === "flag" ? "flag" : "dig";
    G.probeArmed = false;
    renderGeodeBoard();
  } else if(act === "geode-probe"){
    if(!G || G.over || G.probes <= 0) return;
    G.probeArmed = !G.probeArmed;
    renderGeodeBoard();
  } else if(act === "geode-finish"){
    if(!G) return;
    if(G.over){ openGeodeSheet("end"); return; }
    var s = G.started ? computeGeodeScore(G) : null;
    if(s && s.opened / s.safeN >= 0.7) endGeodeGame("done");
  } else if(act === "geode-help"){
    openGeodeSheet("help");
  } else if(act === "geode-close-sheet"){
    try { localStorage.setItem(GEODE_TUTORIAL_KEY, "1"); } catch(err){}
    closeGeodeSheet();
  } else if(act === "geode-open-tutorial"){
    openGeodeTutorial();
  } else if(act === "geode-tutorial-next"){
    var T = lapidaryMinigameState.geodeTutorial;
    if(!T) return;
    if(T.step === GEODE_TUT_STEPS.length - 1){ finishGeodeTutorial(); return; }
    T.step++;
    renderGeodeTutorial();
  } else if(act === "geode-tutorial-skip"){
    finishGeodeTutorial();
  }
});

function renderGeodePhaseHTML(family){
  var G = geodeState();
  var famA = mixLapidaryHex("#6b5442", family.hex, 0.30);
  var famB = mixLapidaryHex("#33251b", family.hex, 0.18);
  var famGlow = mixLapidaryHex("#1A120D", family.hex, 0.14);
  var famVein = mixLapidaryHex(family.hex, "#ffffff", 0.2);
  var styleVars = '--geode-a:' + famA + ';--geode-b:' + famB + ';--geode-glow:' + famGlow + ';--geode-fam:' + family.hex + ';--geode-vein:' + famVein + ';';

  return '<div class="lapidary-phase-body lapidary-geode" style="' + styleVars + '">' +
    '<div class="lapidary-geode-titlebar">' +
      '<div><h3>Desbaste de la Geoda</h3><span>Quita la costra sin golpear las fisuras</span></div>' +
      '<button type="button" class="lapidary-icon-btn" data-action="geode-help" aria-label="Cómo se juega">?</button>' +
    '</div>' +
    '<div class="lapidary-geode-hud">' +
      '<div class="lapidary-geode-chip"><span class="lbl">Integridad</span><span class="val hearts" id="lapidaryGeodeHearts"></span></div>' +
      '<div class="lapidary-geode-chip"><span class="lbl">Fisuras</span><span class="val" id="lapidaryGeodeFissures">' + G.d.fissures + '</span></div>' +
      '<div class="lapidary-geode-chip"><span class="lbl">Sonda</span><span class="val" id="lapidaryGeodeProbes">' + G.probes + '</span></div>' +
      '<div class="lapidary-geode-chip streak" id="lapidaryGeodeStreakChip"><span class="lbl">Racha</span><span class="val" id="lapidaryGeodeStreak">×1</span></div>' +
    '</div>' +
    '<div class="lapidary-geode-prog">' +
      '<div class="lapidary-geode-prog-row"><span>Costra retirada <b id="lapidaryGeodePct">0%</b></span><span>Puedes terminar al 70%</span></div>' +
      '<div class="lapidary-geode-bar"><div class="lapidary-geode-bar-fill" id="lapidaryGeodeBar"></div><div class="lapidary-geode-bar-goal"></div></div>' +
    '</div>' +
    '<div class="lapidary-geode-wrap" id="lapidaryGeodeWrap">' +
      '<div class="lapidary-geode-board" id="lapidaryGeodeBoard" role="grid" aria-label="Piedra en bruto"></div>' +
      '<div class="lapidary-particles-container" id="lapidaryParticles"></div>' +
    '</div>' +
    '<div class="lapidary-geode-hint" id="lapidaryGeodeHint"></div>' +
    '<div class="lapidary-geode-thumb">' +
      '<div class="lapidary-geode-seg" role="group" aria-label="Acción al tocar">' +
        '<button type="button" id="lapidaryGeodeModeDig" data-action="geode-mode" data-mode="dig" aria-pressed="true">' + icono("pico",{tam:"s"}) + ' Picar</button>' +
        '<button type="button" id="lapidaryGeodeModeFlag" data-action="geode-mode" data-mode="flag" aria-pressed="false">⚑ Marcar</button>' +
      '</div>' +
      '<button type="button" class="lapidary-geode-tool" id="lapidaryGeodeProbeBtn" data-action="geode-probe" aria-pressed="false">◎ Sonda <span class="count" id="lapidaryGeodeProbeCount">' + G.probes + '</span></button>' +
      '<button type="button" class="lapidary-geode-finish" id="lapidaryGeodeFinish" data-action="geode-finish" disabled>Terminar desbaste (desde el 70%)</button>' +
    '</div>' +
    '<div id="lapidaryGeodeSheet"></div>' +
  '</div>';
}

// Arranca el tablero tras pintar el modal (y la partida guiada la primera vez)
function startGeodePhase(){
  initGeodeBoard();
  renderGeodeBoard();
  var seen = false;
  try { seen = localStorage.getItem(GEODE_TUTORIAL_KEY) === "1"; } catch(e){}
  if(!seen) openGeodeTutorial();
}


var lapidaryMinigameState = {
  active: false,
  charId: null,
  stoneId: null,
  phase: 1, // 1: Desbaste de la geoda, 2: Sierra diamantada, 3: Sweet spot timing, 4: Resumen y rotura
  timers: [],          // setTimeout activos del minijuego (se cancelan al cerrar)

  // Fase 1: Desbaste de la Geoda (buscaminas con silueta de gema)
  geode: null,         // Partida en curso (ver createGeodeGame)
  geodeTutorial: null, // Partida guiada abierta
  cleanPct: 0,
  fragileHits: 0,
  phase1Score: 0,

  // Fase 2: Cortes (calcar la silueta con la sierra; ver createCutGame)
  cut: null,
  phase2Score: 0,

  // Fase 3: Pulido (barra con zona dorada que cambia de sitio en cada pasada)
  timingPass: 1,
  maxPasses: 5,
  timingHits: 0,       // pasadas con nota Perfecto
  cursorPos: 0,
  cursorDir: 1,
  polishCenter: 0.5,   // centro de la zona de la pasada actual
  polishLock: false,   // pausa de 750 ms tras cada pulsación
  polishLastT: 0,
  animId: null,
  passResults: [],     // "p" (Perfecto) | "g" (Bien) | "f" (Fallo)
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
    gema: "Piedra Mágica",
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

  // Reset Fase 1 (Desbaste de la Geoda)
  clearLapidaryTimers();
  lapidaryMinigameState.geode = createGeodeGame(c);
  lapidaryMinigameState.geodeTutorial = null;
  lapidaryMinigameState.cleanPct = 0;
  lapidaryMinigameState.fragileHits = 0;
  lapidaryMinigameState.phase1Score = 0;

  // Reset Fase 2 (Cortes)
  lapidaryMinigameState.cut = null;
  lapidaryMinigameState.phase2Score = 0;

  // Reset Fase 3
  lapidaryMinigameState.timingPass = 1;
  lapidaryMinigameState.timingHits = 0;
  lapidaryMinigameState.passResults = [];
  lapidaryMinigameState.cursorPos = 0;
  lapidaryMinigameState.cursorDir = 1;
  lapidaryMinigameState.polishCenter = 0.5;
  lapidaryMinigameState.polishLock = false;
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
    startGeodePhase();
  });
}

function closeLapidaryMinigame(){
  lapidaryMinigameState.active = false;
  clearLapidaryTimers();
  lapidaryMinigameState.geodeTutorial = null;
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
      '<span class="lapidary-gem-icon" style="color:' + family.hex + ';filter:drop-shadow(0 0 10px ' + family.glow + ');">' + icono(STONE_ICONO[family.id] || "piedras", {tam:"l"}) + '</span>' +
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
      '<div class="lapidary-step-label">Desbaste</div>' +
    '</div>' +
    '<div class="lapidary-step-line ' + (lapidaryMinigameState.phase > 1 ? 'active' : '') + '"></div>' +
    '<div class="lapidary-step ' + (lapidaryMinigameState.phase === 2 ? 'current' : (lapidaryMinigameState.phase > 2 ? 'completed' : '')) + '">' +
      '<div class="lapidary-step-num">2</div>' +
      '<div class="lapidary-step-label">Cortes</div>' +
    '</div>' +
    '<div class="lapidary-step-line ' + (lapidaryMinigameState.phase > 2 ? 'active' : '') + '"></div>' +
    '<div class="lapidary-step ' + (lapidaryMinigameState.phase === 3 ? 'current' : (lapidaryMinigameState.phase > 3 ? 'completed' : '')) + '">' +
      '<div class="lapidary-step-num">3</div>' +
      '<div class="lapidary-step-label">Pulido</div>' +
    '</div>' +
    '<div class="lapidary-step-line ' + (lapidaryMinigameState.phase > 3 ? 'active' : '') + '"></div>' +
    '<div class="lapidary-step ' + (lapidaryMinigameState.phase === 4 ? 'current' : '') + '">' +
      '<div class="lapidary-step-num">4</div>' +
      '<div class="lapidary-step-label">Veredicto</div>' +
    '</div>' +
  '</div>';

  // ==========================================
  // FASE 1: DESBASTE DE LA GEODA
  // ==========================================
  if(lapidaryMinigameState.phase === 1){
    if(!lapidaryMinigameState.geode) lapidaryMinigameState.geode = createGeodeGame(c);
    html += renderGeodePhaseHTML(family);
  }


  // ==========================================
  // FASE 2: CORTES
  // ==========================================
  else if(lapidaryMinigameState.phase === 2){
    html += renderCutsPhaseHTML(family);
  }

  // ==========================================
  // FASE 3: PULIDO DE FACETAS
  // ==========================================
  else if(lapidaryMinigameState.phase === 3){
    html += renderPolishPhaseHTML(family);
  }

  // ==========================================
  // FASE 4: VEREDICTO (nota, riesgo y tirada de calidad; el máster decide la rotura)
  // ==========================================
  else if(lapidaryMinigameState.phase === 4){
    html += renderVerdictPhaseHTML(c);
  }

  modal.innerHTML = html;
}

/* ==========================================================================
   4. PARTÍCULAS Y TEXTOS FLOTANTES
   ========================================================================== */

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
   5. FASE 2: CORTES — calcar la silueta de la gema con la sierra
   ========================================================================== */

// Contorno de la gema (fracciones del lienzo: x del ancho, y del alto)
var CUT_GL = [0.08, 0.40], CUT_CL = [0.27, 0.17], CUT_CR = [0.73, 0.17], CUT_GR = [0.92, 0.40], CUT_CU = [0.50, 0.92];

// Tres cortes; cada uno añade un desafío nuevo (f = fracción del recorrido)
var LAPIDARY_CUTS = [
  {
    name: "La corona",
    pts: [CUT_GL, CUT_CL, CUT_CR, CUT_GR],
    hard: [[0.30, 0.42], [0.62, 0.72]],
    drift: [],
    inclusions: [],
    hint: "Sigue el borde de arriba, de izquierda a derecha."
  },
  {
    name: "Pabellón izquierdo",
    pts: [CUT_GL, [0.28, 0.66], CUT_CU],
    hard: [[0.15, 0.27], [0.64, 0.76]],
    drift: [{ f0: 0.34, f1: 0.56, dir: 1 }],
    inclusions: [],
    hint: "Baja por el lado izquierdo hasta la punta."
  },
  {
    name: "Pabellón derecho",
    pts: [CUT_GR, [0.72, 0.66], CUT_CU],
    hard: [[0.10, 0.20], [0.46, 0.55], [0.86, 0.95]],
    drift: [{ f0: 0.22, f1: 0.40, dir: -1 }],
    inclusions: [{ f: 0.30, side: 1, pair: false }, { f: 0.68, side: 1, pair: true }, { f: 0.68, side: -1, pair: true }],
    hint: "Baja por el lado derecho hasta la punta."
  }
];

var CUT_TOUCH_OFFSET = 46;   // px: la sierra se dibuja por encima del dedo
var CUT_START_RADIUS = 44;   // px: radio para empezar o seguir tocando la sierra
var CUT_MAX_GEMS = 3;

// Joystick único y flotante: aparece donde pones el pulgar y mueve la sierra en cualquier dirección
var CUT_JOY = {
  maxSpeed: 0.32,      // anchos de lienzo por segundo con el joystick a tope
  keySpeed: 0.6,       // teclado: fracción del tope (con Mayúsculas, a tope)
  accel: 9,            // inercia suave: cuánto tarda en llegar a la velocidad pedida
  travel: 50,          // px que se mueve el mando desde el centro
  size: 140,           // px del círculo del joystick
  awayFactor: 0.6,     // ayuda de puntería: lo que aleja de la línea se frena un 40 %…
  forwardFactor: 1.2,  // … lo que avanza a lo largo de la línea se ayuda…
  pull: 2.5,           // … y la sierra tiende hacia la línea (por segundo, mientras empujas)
  band: 1.25,          // con joystick, algo más de margen…
  hardSpeed: 1.15,     // … más velocidad permitida en los tramos ◆
  drift: 0.7,          // … menos deriva
  heat: 0.8            // … y se calienta algo más despacio
};
var CUT_CONTROL_KEY = "krysalis_lapidary_cut_control";

function getCutControlMode(){
  try {
    var v = localStorage.getItem(CUT_CONTROL_KEY);
    if(v === "joy" || v === "dedo") return v;
  } catch(e){}
  return (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ? "joy" : "dedo";
}

function setCutControlMode(m){
  try { localStorage.setItem(CUT_CONTROL_KEY, m); } catch(e){}
}

function cutDiffForMode(base, mode){
  if(mode !== "joy") return base;
  var d = Object.assign({}, base);
  d.band = base.band * CUT_JOY.band;
  d.hardMaxSpeed = base.hardMaxSpeed * CUT_JOY.hardSpeed;
  d.drift = base.drift * CUT_JOY.drift;
  d.heatRate = base.heatRate * CUT_JOY.heat;
  return d;
}

function getCutDifficulty(c){
  var T = CUT_DIFFICULTY_TABLE;
  var kit = getLapidaryKitIndex(c);
  var exp = getLapidaryExperience(c);
  var kitF = kit / 5, expF = (exp - 1) / 9;
  var skill = (kitF + expF) / 2;
  return {
    kit: kit,
    exp: exp,
    band: T.bandMin + (T.bandMax - T.bandMin) * skill,
    hardMaxSpeed: T.hardSpeedMin + (T.hardSpeedMax - T.hardSpeedMin) * skill,
    drift: T.driftMax - (T.driftMax - T.driftMin) * (kitF * 0.6 + expF * 0.4),
    heatRate: T.heatRateMax - (T.heatRateMax - T.heatRateMin) * (kitF * 0.8 + expF * 0.2),
    limitedVision: exp >= T.visionMinExp
  };
}

function cutState(){ return lapidaryMinigameState.cut; }

function createCutGame(c){
  var base = getCutDifficulty(c), mode = getCutControlMode();
  return { baseDiff: base, mode: mode, diff: cutDiffForMode(base, mode), joy: { x: 0, y: 0 }, keys: {}, vel: [0, 0], idx: 0, results: [null, null, null], failed: [false, false, false], retries: [false, false, false], introsSeen: {}, S: null, W: 0, H: 0, DPR: 1, stoneTex: null, sheetOpen: false, lastHint: "", lastWhir: 0, lastWarn: 0 };
}

function resetCurrentCut(){
  var CG = cutState();
  var cut = LAPIDARY_CUTS[CG.idx];
  var lens = [0];
  for(var i = 1; i < cut.pts.length; i++){
    var a = cut.pts[i - 1], b = cut.pts[i];
    lens.push(lens[i - 1] + Math.hypot(b[0] - a[0], (b[1] - a[1]) * 0.86));
  }
  CG.S = {
    lens: lens, total: lens[lens.length - 1], prog: 0, trail: [], samples: 0, qsum: 0, sparks: 0,
    gems: CUT_MAX_GEMS, heat: 0, active: false, started: false, done: false, failed: false,
    saw: null, finger: null, state: "ok", lastT: 0, lastP: null, lastMoveT: 0, speed: 0, rot: 0,
    lastSpark: 0, lastOutSample: 0, pauseStart: 0, pauseTotal: 0, driftVec: [0, 0], driftActive: null,
    incHit: cut.inclusions.map(function(){ return false; }), shakeUntil: 0, joyDrive: false, ctrl: null
  };
  CG.vel = [0, 0];
}

// Punto del recorrido a distancia d (en anchos de lienzo) → fracciones [x, y]
function cutPointAt(d){
  var CG = cutState(), cut = LAPIDARY_CUTS[CG.idx], lens = CG.S.lens, pts = cut.pts;
  for(var i = 1; i < pts.length; i++){
    if(d <= lens[i] || i === pts.length - 1){
      var t = Math.max(0, Math.min(1, (d - lens[i - 1]) / Math.max(1e-6, lens[i] - lens[i - 1])));
      return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t];
    }
  }
  return pts[pts.length - 1];
}

// Normal (en píxeles, unitaria) del tramo del recorrido en la distancia d
function cutNormalAt(d){
  var CG = cutState(), cut = LAPIDARY_CUTS[CG.idx], lens = CG.S.lens, pts = cut.pts;
  var i = 1;
  while(i < pts.length - 1 && d > lens[i]) i++;
  var dx = (pts[i][0] - pts[i - 1][0]) * CG.W, dy = (pts[i][1] - pts[i - 1][1]) * CG.H;
  var L = Math.hypot(dx, dy) || 1;
  return [-dy / L, dx / L];
}

function cutPx(p){ var CG = cutState(); return [p[0] * CG.W, p[1] * CG.H]; }

// Proyecta un punto (px) sobre el recorrido, solo cerca del avance actual
function cutProject(px, py){
  var CG = cutState(), cut = LAPIDARY_CUTS[CG.idx], S = CG.S, best = null;
  for(var i = 1; i < cut.pts.length; i++){
    var a = cutPx(cut.pts[i - 1]), b = cutPx(cut.pts[i]);
    var dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy;
    var t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / L2));
    var qx = a[0] + dx * t, qy = a[1] + dy * t;
    var dist = Math.hypot(px - qx, py - qy) / CG.W;
    var d = S.lens[i - 1] + (S.lens[i] - S.lens[i - 1]) * t;
    if(Math.abs(d - S.prog) > 0.12) continue;
    if(!best || dist < best.dist) best = { dist: dist, d: d };
  }
  return best;
}

function cutFractionIn(list, d){
  var S = cutState().S, f = d / S.total;
  return list.some(function(h){ return f >= h[0] && f <= h[1]; });
}

function cutDriftAt(d){
  var CG = cutState(), S = CG.S, f = d / S.total;
  return LAPIDARY_CUTS[CG.idx].drift.find(function(z){ return f >= z.f0 && f <= z.f1; }) || null;
}

// Medidas de las inclusiones (en anchos de lienzo)
function cutInclusionGeometry(){
  var CG = cutState(), D = CG.diff;
  var sawR = 0.032, incR = 0.012;
  return { sawR: sawR, incR: incR, single: sawR + incR + D.band * 0.85, pair: sawR + incR + D.band * 0.5 };
}

function cutInclusionPos(inc){
  var CG = cutState(), S = CG.S, g = cutInclusionGeometry();
  var d = inc.f * S.total, p = cutPx(cutPointAt(d)), n = cutNormalAt(d);
  var off = (inc.pair ? g.pair : g.single) * CG.W * inc.side;
  return [p[0] + n[0] * off, p[1] + n[1] * off];
}

// Nota del corte (0-100): un único sitio
function computeCutScore(S){
  if(!S || !S.samples) return 0;
  var precision = (S.qsum / S.samples) * 55;
  var integrity = (Math.max(0, S.gems) / CUT_MAX_GEMS) * 25;
  var rhythm = Math.max(0, 20 - S.sparks * 4 - Math.min(10, (S.pauseTotal / 1000) * 0.5));
  var total = Math.round(Math.max(0, Math.min(100, precision + integrity + rhythm)));
  return S.failed ? Math.min(30, total) : total;
}

function cutStarsFor(v){ return v >= 90 ? 3 : (v >= 75 ? 2 : (v >= 50 ? 1 : 0)); }

function cutStarsHTML(n){
  var s = "";
  for(var k = 0; k < 3; k++) s += k < n ? icono("estrella") : '<span class="off">' + icono("estrella") + '</span>';
  return s;
}

function cutGemsHTML(n){
  var s = "";
  for(var k = 0; k < CUT_MAX_GEMS; k++) s += k < n ? icono("gema",{tam:"s"}) : '<span class="off">' + icono("gema",{tam:"s"}) + '</span>';
  return s;
}

function renderCutsPhaseHTML(family){
  return '<div class="lapidary-phase-body lapidary-cuts">' +
    '<div class="lapidary-cuts-head">' +
      '<div><span class="lapidary-sheet-tag" id="lapidaryCutTag"></span><h3 id="lapidaryCutName"></h3></div>' +
      '<div class="lapidary-cuts-status"><span class="lapidary-cuts-gems" id="lapidaryCutGems"></span><span class="lapidary-cuts-stars" id="lapidaryCutLiveStars"></span></div>' +
    '</div>' +
    '<div class="lapidary-cut-stage" id="lapidaryCutStage"><canvas id="lapidaryCutCanvas" aria-label="Piedra para cortar"></canvas></div>' +
    '<div class="lapidary-cut-joys" id="lapidaryCutJoys">' +
      '<div class="lapidary-joy-pad" id="lapidaryJoyPad" role="application" aria-label="Joystick: pon el pulgar y empuja hacia donde quieras llevar la sierra">' +
        '<div class="lapidary-joy" id="lapidaryJoy"><i class="lapidary-joy-knob"></i></div>' +
        '<span class="lapidary-joy-tip">Pon el pulgar aquí</span>' +
      '</div>' +
      '<button type="button" class="lapidary-joy-mode" id="lapidaryCutMode" data-action="cut-mode"></button>' +
    '</div>' +
    '<div class="lapidary-geode-hint" id="lapidaryCutHint"></div>' +
    '<div class="lapidary-polish-legend"><span><i class="perf"></i>Sierra bien</span><span><i class="warn"></i>Rozando el borde</span><span><i class="bad"></i>Fuera o muy rápido</span></div>' +
    '<div class="lapidary-cut-slots" id="lapidaryCutSlots"></div>' +
    '<div class="lapidary-sheet-actions">' +
      '<button type="button" class="lapidary-ghost-btn" id="lapidaryCutRetry" data-action="cut-retry">Repetir corte</button>' +
      '<button type="button" class="lapidary-cta-btn" id="lapidaryCutNext" data-action="cut-next" disabled>Siguiente corte</button>' +
    '</div>' +
    '<div id="lapidaryCutSheet"></div>' +
  '</div>';
}

function updateCutPanel(){
  var CG = cutState(), S = CG.S;
  if(!S) return;
  var cut = LAPIDARY_CUTS[CG.idx];
  var setHTML = function(id, v){ var el = document.getElementById(id); if(el) el.innerHTML = v; };
  setHTML("lapidaryCutTag", "Corte " + (CG.idx + 1) + " de 3");
  setHTML("lapidaryCutName", esc(cut.name));
  setHTML("lapidaryCutGems", cutGemsHTML(S.gems));
  setHTML("lapidaryCutLiveStars", S.samples ? cutStarsHTML(cutStarsFor(computeCutScore(S))) : "");
  setHTML("lapidaryCutSlots", LAPIDARY_CUTS.map(function(cc, i){
    var r = CG.results[i];
    return '<div class="lapidary-cut-slot' + (i === CG.idx ? " now" : "") + (CG.failed[i] ? " failed" : "") + '">' + esc(cc.name) +
      '<span class="lapidary-cuts-stars">' + (r == null ? '<span class="off">' + icono("estrella") + icono("estrella") + icono("estrella") + '</span>' : cutStarsHTML(cutStarsFor(r))) + '</span></div>';
  }).join(""));
  var retry = document.getElementById("lapidaryCutRetry");
  if(retry){
    retry.disabled = CG.retries[CG.idx] || !S.started;
    retry.textContent = CG.retries[CG.idx] ? "Ya repetido" : "Repetir corte";
  }
  var next = document.getElementById("lapidaryCutNext");
  if(next){
    next.disabled = !S.done;
    next.textContent = CG.idx < 2 ? "Siguiente corte" : "Pasar al pulido";
  }
}

function setCutHint(html){
  var CG = cutState();
  if(CG.lastHint === html) return;
  CG.lastHint = html;
  var el = document.getElementById("lapidaryCutHint");
  // Dentro de un span: la caja es flex y cada <b> suelto sería una columna aparte
  if(el) el.innerHTML = "<span>" + html + "</span>";
}

function defaultCutHint(){
  var CG = cutState(), S = CG.S, cut = LAPIDARY_CUTS[CG.idx];
  if(S.done){
    return S.failed ? '<span class="bad">El corte se ha agrietado.</span> Puedes repetirlo o seguir.' :
      "Corte terminado: <b class=\"lapidary-cuts-stars\">" + cutStarsHTML(cutStarsFor(CG.results[CG.idx])) + "</b>. Puedes repetirlo o seguir.";
  }
  if(CG.mode === "joy"){
    if(!S.started) return cut.hint + " Pon el <b>pulgar abajo</b> y empuja hacia donde quieras: cuanto más empujas, más rápido. En los <b>◆</b> ve despacio, pero sin pararte.";
    if(!S.active) return "Pausa. Vuelve a empujar el joystick para seguir.";
    return "";
  }
  if(!S.started) return cut.hint + " <b>Pon el dedo en la sierra</b> y arrastra. En los tramos <b>◆</b> ve despacio, pero sin pararte.";
  if(!S.active) return "Pausa. Vuelve a poner el dedo sobre la sierra para seguir.";
  return "";
}

// Lienzo: ancho disponible, alto = 0,86 × ancho, nítido con devicePixelRatio
function sizeCutCanvas(){
  var CG = cutState();
  var cv = document.getElementById("lapidaryCutCanvas");
  if(!cv || !cv.parentElement) return false;
  var w = cv.parentElement.clientWidth;
  if(!w) return false;
  CG.DPR = Math.min(2, window.devicePixelRatio || 1);
  CG.W = w; CG.H = Math.round(w * 0.86);
  cv.width = Math.round(CG.W * CG.DPR); cv.height = Math.round(CG.H * CG.DPR);
  cv.style.height = CG.H + "px";
  cv.getContext("2d").setTransform(CG.DPR, 0, 0, CG.DPR, 0, 0);
  buildCutStoneTexture();
  return true;
}

function cutGemPath(ctx){
  ctx.beginPath();
  [CUT_GL, CUT_CL, CUT_CR, CUT_GR, CUT_CU].forEach(function(p, i){ var q = cutPx(p); if(i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); });
  ctx.closePath();
}

function buildCutStoneTexture(){
  var CG = cutState(), W = CG.W, H = CG.H;
  var family = getPolishFamily();
  var off = document.createElement("canvas");
  off.width = Math.round(W * CG.DPR); off.height = Math.round(H * CG.DPR);
  var o = off.getContext("2d");
  o.scale(CG.DPR, CG.DPR);
  // Piedra en bruto irregular alrededor de la gema
  var cx = W * 0.5, cy = H * 0.5, n = 22;
  o.beginPath();
  for(var k = 0; k <= n; k++){
    var a = k / n * Math.PI * 2;
    var r = (0.47 + 0.04 * Math.sin(a * 3) + 0.03 * Math.cos(a * 5)) * W;
    var x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.92;
    if(k) o.lineTo(x, y); else o.moveTo(x, y);
  }
  o.closePath();
  var g = o.createRadialGradient(cx, cy * 0.85, W * 0.05, cx, cy, W * 0.55);
  g.addColorStop(0, mixLapidaryHex("#7a4a40", family.hex, 0.15));
  g.addColorStop(1, "#3a2620");
  o.fillStyle = g; o.fill();
  o.save(); o.clip();
  var seed = 11;
  for(var s = 0; s < 700; s++){
    seed = (seed * 9301 + 49297) % 233280; var rx = seed / 233280;
    seed = (seed * 9301 + 49297) % 233280; var ry = seed / 233280;
    o.fillStyle = s % 2 ? "rgba(255,230,210,.07)" : "rgba(0,0,0,.18)";
    o.fillRect(rx * W, ry * H, 1.6, 1.6);
  }
  o.restore();
  // La gema dentro, apagada
  cutGemPath(o);
  o.fillStyle = mixLapidaryHex("#2a1a16", family.hex, 0.35);
  o.globalAlpha = 0.55; o.fill(); o.globalAlpha = 1;
  CG.stoneTex = off;
}

function cutStrokePath(ctx, pts, color, width, dash){
  ctx.beginPath();
  pts.forEach(function(p, i){ var q = cutPx(p); if(i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); });
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]);
}

function cutSamplePath(d0, d1, step){
  var out = [];
  for(var d = d0; d <= d1 + 1e-6; d += step) out.push(cutPointAt(Math.min(d, d1)));
  return out;
}

function drawCutStage(now){
  var CG = cutState(), S = CG.S;
  var cv = document.getElementById("lapidaryCutCanvas");
  if(!cv || !S || !CG.W) return;
  var ctx = cv.getContext("2d"), W = CG.W, H = CG.H, D = CG.diff, cut = LAPIDARY_CUTS[CG.idx];
  var family = getPolishFamily();
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  if(now < S.shakeUntil){ ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6); }
  if(CG.stoneTex) ctx.drawImage(CG.stoneTex, 0, 0, W, H);

  // Cortes ya hechos (dorados) o agrietados
  for(var i = 0; i < LAPIDARY_CUTS.length; i++){
    if(CG.results[i] == null || i === CG.idx) continue;
    if(CG.failed[i]) cutStrokePath(ctx, LAPIDARY_CUTS[i].pts, "#F07A84", 2.5, [3, 4]);
    else cutStrokePath(ctx, LAPIDARY_CUTS[i].pts, "#DEC392", 3, []);
  }
  var allDone = CG.results.every(function(r){ return r != null; });
  if(allDone){
    cutGemPath(ctx);
    var gg = ctx.createLinearGradient(0, H * 0.15, 0, H * 0.9);
    gg.addColorStop(0, mixLapidaryHex(family.hex, "#ffffff", 0.4));
    gg.addColorStop(0.5, family.hex);
    gg.addColorStop(1, mixLapidaryHex(family.hex, "#000000", 0.55));
    ctx.fillStyle = gg; ctx.shadowColor = family.glow; ctx.shadowBlur = 24; ctx.fill(); ctx.shadowBlur = 0;
  }

  var band = D.band * W;
  // Visión limitada: la guía solo se ve clara cerca de la sierra
  var visEnd = S.total;
  if(D.limitedVision && !S.done) visEnd = Math.min(S.total, S.prog + Math.max(0.12, (S.total - S.prog) * CUT_DIFFICULTY_TABLE.visionAhead));
  var clearPts = cutSamplePath(0, visEnd, 0.01), farPts = visEnd < S.total ? cutSamplePath(visEnd, S.total, 0.01) : [];

  // Margen del corte
  cutStrokePath(ctx, clearPts, "rgba(222,195,146,.14)", band * 2, []);
  if(farPts.length) cutStrokePath(ctx, farPts, "rgba(222,195,146,.04)", band * 2, []);
  // Tramos duros ◆
  cut.hard.forEach(function(h){
    var d0 = h[0] * S.total, d1 = h[1] * S.total;
    var vis = d0 <= visEnd;
    cutStrokePath(ctx, cutSamplePath(d0, d1, 0.01), vis ? "rgba(232,184,90,.38)" : "rgba(232,184,90,.08)", band * 2, []);
    if(vis){
      var m = cutPx(cutPointAt((d0 + d1) / 2)), n = cutNormalAt((d0 + d1) / 2);
      ctx.fillStyle = "#E8B85A"; ctx.font = "bold 15px Georgia, serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("◆", m[0] - n[0] * (band + 10), m[1] - n[1] * (band + 10));
    }
  });
  // Línea guía
  cutStrokePath(ctx, clearPts, "rgba(243,234,219,.8)", 1.6, [6, 6]);
  if(farPts.length) cutStrokePath(ctx, farPts, "rgba(243,234,219,.12)", 1.2, [6, 6]);

  // Aviso de deriva: flechas finas justo antes y durante el tramo
  cut.drift.forEach(function(z){
    var d0 = z.f0 * S.total, d1 = z.f1 * S.total;
    var warnFrom = d0 - 0.08;
    if(S.done || S.prog < warnFrom || S.prog > d1) return;
    for(var dd = d0; dd <= d1; dd += 0.05){
      var p = cutPx(cutPointAt(dd)), nn = cutNormalAt(dd);
      var sx = p[0] - nn[0] * z.dir * band * 0.9, sy = p[1] - nn[1] * z.dir * band * 0.9;
      var ex = p[0] + nn[0] * z.dir * band * 1.6, ey = p[1] + nn[1] * z.dir * band * 1.6;
      ctx.strokeStyle = "rgba(118,172,157,.75)"; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      var ang = Math.atan2(ey - sy, ex - sx);
      ctx.beginPath(); ctx.moveTo(ex, ey);
      ctx.lineTo(ex - Math.cos(ang - 0.5) * 6, ey - Math.sin(ang - 0.5) * 6);
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - Math.cos(ang + 0.5) * 6, ey - Math.sin(ang + 0.5) * 6);
      ctx.stroke();
    }
  });

  // Inclusiones
  var g = cutInclusionGeometry();
  cut.inclusions.forEach(function(inc, k){
    var ip = cutInclusionPos(inc);
    ctx.beginPath(); ctx.arc(ip[0], ip[1], g.incR * W, 0, Math.PI * 2);
    ctx.fillStyle = S.incHit[k] ? "#5a1c22" : "#140c0a"; ctx.fill();
    ctx.strokeStyle = S.incHit[k] ? "#F07A84" : "rgba(0,0,0,.6)"; ctx.lineWidth = 1.5; ctx.stroke();
  });

  // Estela
  ctx.lineCap = "round";
  for(var t = 1; t < S.trail.length; t++){
    var a = S.trail[t - 1], b = S.trail[t];
    ctx.beginPath(); ctx.moveTo(a.x * W, a.y * H); ctx.lineTo(b.x * W, b.y * H);
    ctx.strokeStyle = b.q >= 0.9 && !b.spark ? "#DEC392" : (b.q >= 0.5 && !b.spark ? "#E8B85A" : "#F07A84");
    ctx.lineWidth = 4; ctx.stroke();
  }
  // Corte agrietado
  if(S.failed){
    var cp = cutSamplePath(0, S.total, 0.025);
    ctx.beginPath();
    cp.forEach(function(p, i){ var q = cutPx(p), z = (i % 2 ? 4 : -4); if(i) ctx.lineTo(q[0] + z, q[1] - z); else ctx.moveTo(q[0], q[1]); });
    ctx.strokeStyle = "#F07A84"; ctx.lineWidth = 2; ctx.stroke();
  }
  // Fin del corte
  var e = cutPx(cutPointAt(S.total));
  ctx.beginPath(); ctx.arc(e[0], e[1], 9, 0, Math.PI * 2); ctx.strokeStyle = "rgba(222,195,146,.8)"; ctx.lineWidth = 2; ctx.stroke();

  // Sierra con anillo de calor
  if(!S.done){
    var sp = S.saw || cutPx(cutPointAt(S.prog));
    var R = g.sawR * W;
    if(S.finger){
      ctx.beginPath(); ctx.arc(S.finger[0], S.finger[1], 16, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fill();
      ctx.beginPath(); ctx.moveTo(S.finger[0], S.finger[1] - 16); ctx.lineTo(sp[0], sp[1] + R); ctx.strokeStyle = "rgba(255,255,255,.2)"; ctx.lineWidth = 1; ctx.stroke();
    }
    // Anillo de calor: se llena al ir muy despacio o pararse
    ctx.beginPath(); ctx.arc(sp[0], sp[1], R + 7, 0, Math.PI * 2); ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.lineWidth = 4; ctx.stroke();
    if(S.heat > 0.01){
      var hc = S.heat < 0.5 ? "#E8B85A" : (S.heat < 0.8 ? "#F0904A" : "#F05A4A");
      ctx.beginPath(); ctx.arc(sp[0], sp[1], R + 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, S.heat));
      ctx.strokeStyle = hc; ctx.lineWidth = 4; ctx.shadowColor = hc; ctx.shadowBlur = S.heat > 0.8 ? 12 : 0; ctx.stroke(); ctx.shadowBlur = 0;
    }
    var col = S.state === "ok" ? "#7CC4A4" : (S.state === "edge" ? "#E8B85A" : "#F07A84");
    ctx.save(); ctx.translate(sp[0], sp[1]); ctx.rotate(S.rot);
    ctx.beginPath();
    for(var k2 = 0; k2 < 16; k2++){ var an = k2 / 16 * Math.PI * 2, rr = k2 % 2 ? R * 0.78 : R; ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); }
    ctx.closePath();
    ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(0, 0, R * 0.3, 0, Math.PI * 2); ctx.fillStyle = "#1a120d"; ctx.fill();
    ctx.restore();
    if(!S.active){
      var pulse = now / 400;
      ctx.beginPath(); ctx.arc(sp[0], sp[1], R + 12 + Math.sin(pulse) * 4, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(124,196,164,.55)"; ctx.lineWidth = 2; ctx.stroke();
    }
  }
  ctx.restore();
}

function cutLocalPoint(e){
  var cv = document.getElementById("lapidaryCutCanvas");
  var r = cv.getBoundingClientRect();
  var x = e.clientX - r.left, y = e.clientY - r.top;
  var touch = e.pointerType !== "mouse";
  return { x: x, y: touch ? y - CUT_TOUCH_OFFSET : y, fx: x, fy: y, touch: touch };
}

function cutLoseGem(reason){
  var CG = cutState(), S = CG.S;
  S.gems = Math.max(0, S.gems - 1);
  S.shakeUntil = performance.now() + 320;
  playGemFractureTick();
  if(typeof triggerBg3Haptic === "function") triggerBg3Haptic("fumble");
  setCutHint('<span class="bad">' + reason + '</span> −1 ' + icono("gema"));
  updateCutPanel();
  if(S.gems <= 0) finishCurrentCut(true);
}

function finishCurrentCut(failed){
  var CG = cutState(), S = CG.S;
  if(S.done) return;
  S.done = true; S.active = false; S.joyDrive = false; S.failed = !!failed; S.finger = null; S.saw = null;
  if(!S.samples){ S.samples = 1; S.qsum = 0; }
  CG.results[CG.idx] = computeCutScore(S);
  CG.failed[CG.idx] = !!failed;
  if(failed){
    playGemFracture();
    if(typeof triggerBg3Haptic === "function") triggerBg3Haptic("fumble");
  } else {
    playSlideSuccess();
    if(typeof triggerBg3Haptic === "function") triggerBg3Haptic("crit");
  }
  if(CG.results.every(function(r){ return r != null; })){
    lapidaryMinigameState.phase2Score = Math.round(CG.results.reduce(function(a, b){ return a + b; }, 0) / 3);
  }
  CG.lastHint = "";
  setCutHint(defaultCutHint());
  updateCutPanel();
}

// Avance del corte con cada movimiento del dedo
function handleCutMove(p, now){
  var CG = cutState(), S = CG.S, D = CG.diff;
  var dt = (now - S.lastT) / 1000;

  // Deriva de la veta: empuja la sierra hacia un lado mientras avanzas
  var dz = cutDriftAt(S.prog);
  S.driftActive = dz;
  var sawRaw = [p.x, p.y];
  if(dt > 0){
    var movedPx = S.lastP ? Math.hypot(p.x - S.lastP[0], p.y - S.lastP[1]) : 0;
    if(dt > 0.008){
      var v = movedPx / CG.W / dt;
      S.speed = S.speed * 0.6 + v * 0.4;
      S.lastT = now; S.lastP = [p.x, p.y];
    }
  }
  var sx = sawRaw[0] + S.driftVec[0], sy = sawRaw[1] + S.driftVec[1];
  S.saw = [sx, sy];
  S.finger = p.touch ? [p.fx, p.fy] : null;
  S.lastMoveT = now;
  S.rot += 0.5;

  // Inclusiones: tocarlas con el borde de la sierra cuesta 💎
  var g = cutInclusionGeometry(), cut = LAPIDARY_CUTS[CG.idx];
  cut.inclusions.forEach(function(inc, k){
    if(S.incHit[k] || S.done) return;
    var ip = cutInclusionPos(inc);
    if(Math.hypot(sx - ip[0], sy - ip[1]) < (g.sawR + g.incR) * CG.W){
      S.incHit[k] = true;
      cutLoseGem("¡Crack! Has tocado una inclusión.");
    }
  });
  if(S.done) return;

  var pr = cutProject(sx, sy);
  if(!pr){
    S.state = "bad";
    if(now - S.lastOutSample > 60){ S.samples++; S.lastOutSample = now; }
    setCutHint('<span class="bad">Te has salido.</span> Vuelve a la línea.');
    return;
  }
  var rel = pr.dist / D.band;
  var q = rel <= 0.55 ? 1 : (rel <= 1 ? 0.6 : 0);
  var hard = cutFractionIn(cut.hard, pr.d);
  var tooFast = hard && S.speed > D.hardMaxSpeed;
  S.state = (q === 0 || tooFast) ? "bad" : (q < 1 ? "edge" : "ok");

  if(tooFast && now - S.lastSpark > 300){
    S.sparks++; S.lastSpark = now;
    playGemFractureTick();
    if(typeof triggerBg3Haptic === "function") triggerBg3Haptic("shake");
    if(typeof spawnSlideSparkParticle === "function") spawnSlideSparkParticle(sx, sy);
    setCutHint('<span class="bad">¡Chispas! Muy rápido en el tramo duro.</span> Frena en los ◆.');
  } else if(q === 0){
    setCutHint('<span class="bad">Te has salido del margen.</span> Vuelve a la línea.');
  } else if(S.heat > 0.7){
    setCutHint('<span class="bad">¡Se calienta!</span> Muévete.');
  } else if(dz){
    var nn = cutNormalAt(pr.d), px = nn[0] * dz.dir, py = nn[1] * dz.dir;
    var dirTxt = Math.abs(px) >= Math.abs(py) ? (px > 0 ? "→ corrige hacia la izquierda" : "← corrige hacia la derecha") : (py > 0 ? "↓ corrige hacia arriba" : "↑ corrige hacia abajo");
    setCutHint("La veta empuja " + dirTxt);
  } else if(cut.inclusions.some(function(inc){ return inc.pair && Math.abs(inc.f * S.total - pr.d) < 0.08; })){
    setCutHint("Paso estrecho entre inclusiones: <b>al centro</b>.");
  } else if(hard){
    setCutHint("Tramo duro <b>◆</b>: despacio…");
  } else {
    setCutHint("&nbsp;");
  }

  if(pr.d > S.prog && q > 0){
    // Deriva: mientras avanzas por su tramo, la veta empuja la sierra hacia un lado (con tope)
    if(dz && dt > 0){
      var dn = cutNormalAt(pr.d);
      var push = D.drift * CG.W * Math.min(0.1, dt) * dz.dir;
      var maxDrift = D.band * 3 * CG.W;
      var nx = S.driftVec[0] + dn[0] * push, ny = S.driftVec[1] + dn[1] * push;
      var mag = Math.hypot(nx, ny);
      if(mag > maxDrift){ nx *= maxDrift / mag; ny *= maxDrift / mag; }
      S.driftVec = [nx, ny];
    }
    S.prog = pr.d; S.samples++; S.qsum += q;
    S.trail.push({ x: sx / CG.W, y: sy / CG.H, q: q, spark: tooFast });
  } else if(q === 0 && now - S.lastOutSample > 60){
    S.samples++; S.lastOutSample = now;
  }
  if(S.prog >= S.total - 0.012) finishCurrentCut(false);
}

// Empuje pedido (vector de longitud 0..1): joystick o teclado (flechas / WASD)
function cutJoyInput(){
  var CG = cutState(), k = CG.keys;
  var kx = (k.right ? 1 : 0) - (k.left ? 1 : 0), ky = (k.down ? 1 : 0) - (k.up ? 1 : 0);
  if(kx || ky){
    var ks = (k.fast ? 1 : CUT_JOY.keySpeed) / Math.hypot(kx, ky);
    return [kx * ks, ky * ks];
  }
  return [CG.joy.x, CG.joy.y];
}

// Ayuda de puntería: frena lo que aleja de la línea, ayuda a avanzar por ella y tira suavemente hacia ella
function cutAimAssist(tx, ty){
  var CG = cutState(), S = CG.S;
  var n = cutNormalAt(S.prog), t = [n[1], -n[0]];
  var line = cutPx(cutPointAt(S.prog)), saw = S.saw || line;
  var err = (line[0] - saw[0]) * n[0] + (line[1] - saw[1]) * n[1];
  var along = tx * t[0] + ty * t[1], perp = tx * n[0] + ty * n[1];
  if(along > 0) along *= CUT_JOY.forwardFactor;
  if(perp * err <= 0) perp *= CUT_JOY.awayFactor;
  perp += err * CUT_JOY.pull;
  return [t[0] * along + n[0] * perp, t[1] * along + n[1] * perp];
}

// Cada fotograma la sierra avanza según el joystick, con un pelín de inercia
function stepCutJoystick(now, dt){
  var CG = cutState(), S = CG.S;
  if(!S || S.done || CG.sheetOpen || !CG.W) return;
  if(S.active && !S.joyDrive) return;
  var inp = cutJoyInput();
  var pushing = inp[0] !== 0 || inp[1] !== 0;
  if(!S.joyDrive){
    if(!pushing) return;
    if(S.pauseStart){ S.pauseTotal += now - S.pauseStart; S.pauseStart = 0; }
    var base = S.saw || cutPx(cutPointAt(S.prog));
    S.ctrl = [base[0] - S.driftVec[0], base[1] - S.driftVec[1]];
    S.joyDrive = true; S.active = true; S.started = true; S.finger = null;
    S.lastT = now; S.lastMoveT = now; S.lastP = S.ctrl.slice(); S.speed = 0.1;
    CG.vel = [0, 0];
    setCutHint("&nbsp;");
    updateCutPanel();
  }
  // Curva suave: cerca del centro, más precisión
  var mag = Math.min(1, Math.hypot(inp[0], inp[1])), tx = 0, ty = 0;
  if(mag > 0){
    var sp = Math.pow(mag, 1.5) * CUT_JOY.maxSpeed * CG.W / mag;
    var aim = cutAimAssist(inp[0] * sp, inp[1] * sp);
    tx = aim[0]; ty = aim[1];
  }
  var a = Math.min(1, dt * CUT_JOY.accel);
  CG.vel = [CG.vel[0] + (tx - CG.vel[0]) * a, CG.vel[1] + (ty - CG.vel[1]) * a];
  // Soltando el joystick la sierra se para: pausa, como al levantar el dedo
  if(!pushing && Math.hypot(CG.vel[0], CG.vel[1]) < CG.W * 0.004){
    S.active = false; S.joyDrive = false; S.state = "ok"; S.pauseStart = now;
    CG.vel = [0, 0];
    CG.lastHint = "";
    setCutHint(defaultCutHint());
    return;
  }
  S.ctrl = [Math.max(0, Math.min(CG.W, S.ctrl[0] + CG.vel[0] * dt)), Math.max(0, Math.min(CG.H, S.ctrl[1] + CG.vel[1] * dt))];
  handleCutMove({ x: S.ctrl[0], y: S.ctrl[1], touch: false }, now);
  if(!S.done) updateCutLiveStars();
}

function applyCutModeUI(){
  var CG = cutState(), box = document.getElementById("lapidaryCutJoys");
  if(!CG || !box) return;
  box.classList.toggle("is-dedo", CG.mode !== "joy");
  var b = document.getElementById("lapidaryCutMode");
  if(b) b.innerHTML = CG.mode === "joy" ? icono("mano",{tam:"s"}) + '<span>Modo dedo</span>' : icono("joystick",{tam:"s"}) + '<span>Joystick</span>';
}

function bindCutJoysticks(){
  var pad = document.getElementById("lapidaryJoyPad");
  if(!pad || pad._joyBound) return;
  pad._joyBound = true;
  var base = document.getElementById("lapidaryJoy"), knob = base.querySelector(".lapidary-joy-knob");
  var pid = null, cx = 0, cy = 0, atEdge = false;
  function set(x, y){
    var CG = cutState();
    if(CG) CG.joy = { x: x, y: y };
    knob.style.transform = "translate(" + (x * CUT_JOY.travel) + "px, " + (y * CUT_JOY.travel) + "px)";
  }
  function read(e){
    var dx = (e.clientX - cx) / CUT_JOY.travel, dy = (e.clientY - cy) / CUT_JOY.travel;
    var m = Math.hypot(dx, dy);
    if(m > 1){ dx /= m; dy /= m; }
    if(m < 0.08){ dx = 0; dy = 0; }
    // Vibración suave al llegar al tope
    var edge = m >= 1;
    if(edge && !atEdge){ try { if(navigator.vibrate) navigator.vibrate(8); } catch(err){} }
    atEdge = edge;
    set(dx, dy);
  }
  function release(e){
    if(e.pointerId !== pid) return;
    pid = null; atEdge = false;
    pad.classList.remove("is-held");
    base.style.left = ""; base.style.top = "";
    set(0, 0);
  }
  pad.addEventListener("pointerdown", function(e){
    if(pid !== null) return;
    e.preventDefault();
    pid = e.pointerId;
    try { pad.setPointerCapture(pid); } catch(err){}
    // El joystick aparece donde pones el pulgar (sin salirse de la zona)
    var r = pad.getBoundingClientRect(), h = CUT_JOY.size / 2;
    var lx = Math.max(h, Math.min(r.width - h, e.clientX - r.left));
    var hy = Math.min(h, r.height / 2);
    var ly = Math.max(hy, Math.min(r.height - hy, e.clientY - r.top));
    base.style.left = lx + "px"; base.style.top = ly + "px";
    cx = r.left + lx; cy = r.top + ly;
    pad.classList.add("is-held");
    read(e);
  });
  pad.addEventListener("pointermove", function(e){
    if(e.pointerId !== pid) return;
    e.preventDefault();
    read(e);
  });
  pad.addEventListener("pointerup", release);
  pad.addEventListener("pointercancel", release);
  pad.addEventListener("lostpointercapture", release);
  pad.addEventListener("contextmenu", function(e){ e.preventDefault(); });
}

// Teclado en el PC: flechas o WASD (Mayúsculas: a tope)
var CUT_KEY_MAP = { ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right", ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down" };
function handleCutKey(e, down){
  var CG = lapidaryMinigameState.cut;
  if(!CG || !lapidaryMinigameState.active || lapidaryMinigameState.phase !== 2) return;
  var t = e.target;
  if(t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
  CG.keys.fast = e.shiftKey;
  var k = CUT_KEY_MAP[e.code];
  if(!k) return;
  e.preventDefault();
  CG.keys[k] = down;
}
document.addEventListener("keydown", function(e){ handleCutKey(e, true); });
document.addEventListener("keyup", function(e){ handleCutKey(e, false); });
window.addEventListener("blur", function(){ if(lapidaryMinigameState.cut) lapidaryMinigameState.cut.keys = {}; });

// Bucle por fotograma: calor, sonido de la sierra y dibujo
function startCutLoop(){
  if(lapidaryMinigameState.animId) cancelAnimationFrame(lapidaryMinigameState.animId);
  var last = performance.now();
  function loop(now){
    var CG = cutState();
    if(!lapidaryMinigameState.active || lapidaryMinigameState.phase !== 2 || !CG){
      lapidaryMinigameState.animId = null;
      return;
    }
    var S = CG.S, D = CG.diff, T = CUT_DIFFICULTY_TABLE;
    var dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
    last = now;
    if(S && !S.done) stepCutJoystick(now, dt);
    if(S && !S.done){
      if(S.active){
        // Sin movimiento del dedo, la velocidad cae a cero
        if(now - S.lastMoveT > 120) S.speed *= Math.pow(0.02, dt);
        if(S.speed < T.slowSpeed) S.heat += D.heatRate * dt;
        else S.heat -= T.coolRate * dt;
        if(S.speed > 0.03 && now - CG.lastWhir > 110){ CG.lastWhir = now; playSlideCutWhir(); }
        if(S.heat > 0.75 && now - CG.lastWarn > 1200){ CG.lastWarn = now; playPulsoWarning(); }
        if(S.heat >= 1){
          S.heat = 0.5;
          cutLoseGem("¡Microfisura por calor!");
        }
      } else {
        S.heat -= T.idleCoolRate * dt;
      }
      S.heat = Math.max(0, Math.min(1, S.heat));
      // La deriva se recupera fuera de sus tramos
      if(!S.driftActive){ S.driftVec = [S.driftVec[0] * Math.pow(0.05, dt), S.driftVec[1] * Math.pow(0.05, dt)]; }
    }
    drawCutStage(now);
    lapidaryMinigameState.animId = requestAnimationFrame(loop);
  }
  lapidaryMinigameState.animId = requestAnimationFrame(loop);
}

function bindCutCanvas(){
  var cv = document.getElementById("lapidaryCutCanvas");
  if(!cv || cv._cutBound) return;
  cv._cutBound = true;
  cv.addEventListener("contextmenu", function(e){ e.preventDefault(); });
  cv.addEventListener("pointerdown", function(e){
    var CG = cutState(), S = CG && CG.S;
    if(!S || S.done || CG.sheetOpen || S.joyDrive) return;
    if(CG.mode === "joy"){ setCutHint("Usa el <b>joystick</b> de abajo (o pasa a <b>modo dedo</b>)."); return; }
    var p = cutLocalPoint(e);
    var sp = S.saw || cutPx(cutPointAt(S.prog));
    if(!S.started) sp = cutPx(cutPointAt(S.prog));
    var near = Math.hypot(p.x - sp[0], p.y - sp[1]) <= CUT_START_RADIUS || Math.hypot(p.fx - sp[0], p.fy - sp[1]) <= CUT_START_RADIUS;
    if(!near){ setCutHint("Empieza desde la <b>sierra</b> (el círculo verde que late)."); return; }
    e.preventDefault();
    try { cv.setPointerCapture(e.pointerId); } catch(err){}
    var now = performance.now();
    if(S.pauseStart){ S.pauseTotal += now - S.pauseStart; S.pauseStart = 0; }
    S.active = true; S.started = true;
    S.lastT = now; S.lastMoveT = now; S.lastP = [p.x, p.y]; S.speed = 0.1;
    // Se continúa desde donde estaba la sierra (la deriva acumulada se conserva)
    S.saw = [p.x + S.driftVec[0], p.y + S.driftVec[1]];
    S.finger = p.touch ? [p.fx, p.fy] : null;
    setCutHint("&nbsp;");
    updateCutPanel();
  });
  cv.addEventListener("pointermove", function(e){
    var CG = cutState(), S = CG && CG.S;
    if(!S || !S.active || S.done || S.joyDrive) return;
    e.preventDefault();
    handleCutMove(cutLocalPoint(e), performance.now());
    if(!S.done) updateCutLiveStars();
  });
  function endPress(){
    var CG = cutState(), S = CG && CG.S;
    if(!S || !S.active || S.joyDrive) return;
    S.active = false; S.finger = null; S.state = "ok";
    S.saw = cutPx(cutPointAt(S.prog));
    S.driftVec = [0, 0];
    S.pauseStart = performance.now();
    CG.lastHint = "";
    if(!S.done) setCutHint(defaultCutHint());
  }
  cv.addEventListener("pointerup", endPress);
  cv.addEventListener("pointercancel", endPress);
}

function updateCutLiveStars(){
  var S = cutState().S;
  var el = document.getElementById("lapidaryCutLiveStars");
  if(el) el.innerHTML = S.samples ? cutStarsHTML(cutStarsFor(computeCutScore(S))) : "";
}

// Tarjeta antes de los cortes que traen un desafío nuevo
function openCutIntroSheet(idx){
  var CG = cutState();
  var host = document.getElementById("lapidaryCutSheet");
  if(!host) return;
  var title, text, svg;
  if(idx === 1){
    title = "La veta empuja";
    text = "En algunos tramos la piedra <b>empuja la sierra hacia un lado</b>. Antes verás unas flechas finas: mueve el dedo hacia el lado contrario para seguir en la línea.";
    svg = '<svg viewBox="0 0 120 60" aria-hidden="true"><path d="M10 30 H110" stroke="#F3EADB" stroke-dasharray="5 5" stroke-width="1.6"/><g stroke="#76AC9D" stroke-width="1.6" fill="none"><path d="M40 36 V16 M35 21 L40 16 L45 21"/><path d="M60 36 V16 M55 21 L60 16 L65 21"/><path d="M80 36 V16 M75 21 L80 16 L85 21"/></g><circle cx="60" cy="44" r="7" fill="#7CC4A4"/><path d="M60 54 V58" stroke="#fff" stroke-opacity=".4"/></svg>';
  } else {
    title = "Inclusiones";
    text = "Los <b>puntos oscuros</b> junto a la línea son inclusiones: tocarlas con el borde de la sierra cuesta " + icono("gema") + ". Donde hay dos juntas, el paso es más estrecho: <b>pasa por el centro</b>.";
    svg = '<svg viewBox="0 0 120 60" aria-hidden="true"><path d="M10 30 H110" stroke="#F3EADB" stroke-dasharray="5 5" stroke-width="1.6"/><circle cx="62" cy="20" r="5" fill="#140c0a" stroke="#000"/><circle cx="62" cy="40" r="5" fill="#140c0a" stroke="#000"/><circle cx="30" cy="22" r="5" fill="#140c0a" stroke="#000"/><path d="M50 30 H74" stroke="#DEC392" stroke-width="3" stroke-linecap="round"/></svg>';
  }
  CG.sheetOpen = true;
  host.innerHTML = '<div class="lapidary-sheet-bg"><div class="lapidary-sheet" role="dialog" aria-modal="true">' +
    '<span class="lapidary-sheet-tag">Nuevo desafío · Corte ' + (idx + 1) + ' de 3</span>' +
    '<h3 class="lapidary-sheet-title">' + title + '</h3>' +
    '<div class="lapidary-cut-intro-ill">' + svg + '</div>' +
    '<p>' + text + '</p>' +
    '<button type="button" class="lapidary-cta-btn" data-action="cut-intro-ok">Entendido</button>' +
  '</div></div>';
}

function startCurrentCut(){
  var CG = cutState();
  resetCurrentCut();
  CG.lastHint = "";
  setCutHint(defaultCutHint());
  updateCutPanel();
  if(CG.idx > 0 && !CG.introsSeen[CG.idx]){
    CG.introsSeen[CG.idx] = true;
    openCutIntroSheet(CG.idx);
  }
}

// Punto de entrada del paso 2 (nombre heredado: lo llaman ui-events.js y el enlace ?phase=2 de state.js)
function initLapidarySlideStage(){
  var c = (state.characters || []).find(function(ch){ return ch.id === lapidaryMinigameState.charId; });
  if(!lapidaryMinigameState.cut) lapidaryMinigameState.cut = createCutGame(c);
  if(!sizeCutCanvas()) return;
  bindCutCanvas();
  if(!(document.getElementById("lapidaryJoyPad") || {})._joyBound) cutState().joy = { x: 0, y: 0 };
  bindCutJoysticks();
  applyCutModeUI();
  if(!cutState().S) startCurrentCut();
  else { updateCutPanel(); setCutHint(defaultCutHint()); }
  startCutLoop();
  var stage = document.getElementById("lapidaryCutStage");
  if(stage && window.ResizeObserver && !stage._cutObserved){
    stage._cutObserved = true;
    var lastW = cutState().W;
    new ResizeObserver(function(){
      requestAnimationFrame(function(){
        var st = document.getElementById("lapidaryCutStage");
        if(!st || !cutState() || st.clientWidth === lastW || !st.clientWidth) return;
        lastW = st.clientWidth;
        sizeCutCanvas();
      });
    }).observe(stage);
  }
}

// Botones del paso 2
document.addEventListener("click", function(e){
  var btn = e.target.closest("[data-action]");
  if(!btn || !lapidaryMinigameState.active || lapidaryMinigameState.phase !== 2) return;
  var act = btn.getAttribute("data-action");
  var CG = cutState();
  if(!CG) return;
  if(act === "cut-retry"){
    if(CG.retries[CG.idx] || !CG.S || !CG.S.started) return;
    CG.retries[CG.idx] = true;
    CG.results[CG.idx] = null;
    CG.failed[CG.idx] = false;
    lapidaryMinigameState.phase2Score = 0;
    startCurrentCut();
  } else if(act === "cut-next"){
    if(!CG.S || !CG.S.done) return;
    if(CG.idx < 2){
      CG.idx++;
      startCurrentCut();
    } else {
      lapidaryMinigameState.phase = 3;
      if(lapidaryMinigameState.animId){ cancelAnimationFrame(lapidaryMinigameState.animId); lapidaryMinigameState.animId = null; }
      renderLapidaryModalContent();
      startLapidaryTimingLoop();
    }
  } else if(act === "cut-mode"){
    if(CG.S && CG.S.active) return;
    CG.mode = CG.mode === "joy" ? "dedo" : "joy";
    setCutControlMode(CG.mode);
    CG.diff = cutDiffForMode(CG.baseDiff, CG.mode);
    CG.joy = { x: 0, y: 0 };
    applyCutModeUI();
    CG.lastHint = "";
    if(CG.S) setCutHint(defaultCutHint());
  } else if(act === "cut-intro-ok"){
    CG.sheetOpen = false;
    var host = document.getElementById("lapidaryCutSheet");
    if(host) host.innerHTML = "";
  }
});

/* ==========================================================================
   6. FASE 3: PULIDO DE FACETAS
   ========================================================================== */

// Cada pasada: velocidad del cursor (anchos de barra por segundo) y ancho de la zona "Perfecto"
var POLISH_PASSES = [
  { speed: 0.55, perf: 0.11 },
  { speed: 0.70, perf: 0.10 },
  { speed: 0.85, perf: 0.09 },
  { speed: 1.00, perf: 0.08 },
  { speed: 1.15, perf: 0.07 }
];
var POLISH_GOOD_FACTOR = 2.6;   // la zona "Bien" mide 2,6 veces la de "Perfecto"
var POLISH_GRADE_POINTS = { p: 100, g: 60, f: 0 };
var POLISH_FACETS = ["60,10 85,30 60,42 35,30", "35,30 60,42 30,62 12,40", "85,30 108,40 90,62 60,42", "30,62 60,42 60,110", "90,62 60,110 60,42"];

function computePolishScore(){
  var res = lapidaryMinigameState.passResults || [];
  if(!res.length) return 0;
  return Math.round(res.reduce(function(a, r){ return a + (POLISH_GRADE_POINTS[r] || 0); }, 0) / POLISH_PASSES.length);
}

function getPolishFamily(){
  var c = (state.characters || []).find(function(ch){ return ch.id === lapidaryMinigameState.charId; });
  var stone = c ? (c.stones || []).find(function(st){ return st.id === lapidaryMinigameState.stoneId; }) : null;
  return getStoneFamily(stone ? stone.color : null);
}

function polishGemSVG(family){
  var res = lapidaryMinigameState.passResults || [];
  var cur = lapidaryMinigameState.timingPass - 1;
  var lit = mixLapidaryHex(family.hex, "#ffffff", 0.35);
  var dim = mixLapidaryHex(family.hex, "#1a0e0e", 0.62);
  var s = '<defs><radialGradient id="lapPolishShine" cx="40%" cy="30%"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>';
  s += '<polygon points="12,40 35,30 60,10 85,30 108,40 60,110" fill="' + mixLapidaryHex(family.hex, "#120808", 0.78) + '" stroke="#5a3a33" stroke-width="1.5"/>';
  POLISH_FACETS.forEach(function(f, i){
    var r = res[i];
    var fill = r === "p" ? lit : (r === "g" ? family.hex : (r === "f" ? "#3a1c20" : dim));
    s += '<polygon class="lapidary-polish-facet" points="' + f + '" fill="' + fill + '" stroke="' + (r === "p" ? "#ffe3c4" : "#2a1214") + '" stroke-width="1"/>';
    if(r === "f") s += '<polyline points="' + f.split(" ").slice(0, 3).join(" ") + '" fill="none" stroke="#F07A84" stroke-width="1.4" opacity=".85"/>';
  });
  var perf = res.filter(function(r){ return r === "p"; }).length;
  if(perf) s += '<ellipse cx="50" cy="35" rx="' + (10 + perf * 4) + '" ry="' + (6 + perf * 2) + '" fill="url(#lapPolishShine)" opacity="' + (0.15 + perf * 0.13).toFixed(2) + '"/>';
  if(cur < POLISH_PASSES.length) s += '<polygon points="' + POLISH_FACETS[cur] + '" fill="none" stroke="#DEC392" stroke-width="2.2" stroke-dasharray="4 3"/>';
  return s;
}

function polishPassesHTML(){
  var res = lapidaryMinigameState.passResults || [];
  var cur = lapidaryMinigameState.timingPass - 1;
  return POLISH_PASSES.map(function(_, i){
    var r = res[i];
    var label = r === "p" ? "Perfecto" : (r === "g" ? "Bien" : (r === "f" ? "Fallo" : "Faceta " + (i + 1)));
    return '<div class="lapidary-polish-pass ' + (r || "") + (i === cur && !r ? " now" : "") + '">' + label + '</div>';
  }).join("");
}

function renderPolishPhaseHTML(family){
  var done = lapidaryMinigameState.timingPass > POLISH_PASSES.length;
  var score = computePolishScore();
  return '<div class="lapidary-phase-body lapidary-polish">' +
    '<div class="lapidary-polish-head">' +
      '<div><span class="lapidary-sheet-tag" id="lapidaryPolishTag">' + (done ? "Pulido terminado" : "Pasada " + lapidaryMinigameState.timingPass + " de " + POLISH_PASSES.length) + '</span>' +
      '<h3>Pulido de facetas</h3></div>' +
      '<span class="lapidary-polish-score" id="lapidaryPolishScore">' + (lapidaryMinigameState.passResults.length ? score + " / 100" : "") + '</span>' +
    '</div>' +
    '<div class="lapidary-polish-gem"><svg viewBox="0 0 120 120" id="lapidaryPolishGem" aria-hidden="true">' + polishGemSVG(family) + '</svg></div>' +
    '<div class="lapidary-polish-track" id="lapidaryPolishTrack">' +
      '<div class="lapidary-polish-zone-good" id="lapidaryPolishZoneGood"></div>' +
      '<div class="lapidary-polish-zone-perf" id="lapidaryPolishZonePerf"></div>' +
      '<div class="lapidary-polish-cursor" id="lapidaryGaugeCursor"></div>' +
      '<div class="lapidary-polish-grade" id="lapidaryPolishGrade"></div>' +
    '</div>' +
    '<div class="lapidary-polish-legend"><span><i class="perf"></i>Perfecto</span><span><i class="good"></i>Bien</span><span><i class="fail"></i>Fallo</span></div>' +
    '<div class="lapidary-polish-passes" id="lapidaryPolishPasses">' + polishPassesHTML() + '</div>' +
    '<div class="lapidary-geode-hint" id="lapidaryTimingFeedback">' + (done ? "Pulido terminado: <b>" + score + " / 100</b>." : "Pulsa <b>Pulir</b> cuando la línea blanca pase por la zona dorada. Cada pasada va más rápido.") + '</div>' +
    (done ?
      '<button type="button" class="lapidary-cta-btn lapidary-polish-btn" data-action="advance-to-verdict">Ver el veredicto</button>' :
      '<button type="button" class="lapidary-cta-btn lapidary-polish-btn" id="lapidaryPolishBtn" data-action="lapidary-trigger-cut">Pulir</button>') +
  '</div>';
}

// Coloca la zona de la pasada actual (centro al azar entre el 25 % y el 75 %)
function layoutPolishZone(){
  var pass = POLISH_PASSES[Math.min(lapidaryMinigameState.timingPass - 1, POLISH_PASSES.length - 1)];
  var good = pass.perf * POLISH_GOOD_FACTOR;
  lapidaryMinigameState.polishCenter = 0.25 + Math.random() * 0.5;
  var c = lapidaryMinigameState.polishCenter;
  var zg = document.getElementById("lapidaryPolishZoneGood");
  var zp = document.getElementById("lapidaryPolishZonePerf");
  if(zg){ zg.style.left = ((c - good / 2) * 100) + "%"; zg.style.width = (good * 100) + "%"; }
  if(zp){ zp.style.left = ((c - pass.perf / 2) * 100) + "%"; zp.style.width = (pass.perf * 100) + "%"; }
}

function startLapidaryTimingLoop(){
  if(lapidaryMinigameState.animId){
    cancelAnimationFrame(lapidaryMinigameState.animId);
    lapidaryMinigameState.animId = null;
  }
  if(lapidaryMinigameState.timingPass > POLISH_PASSES.length) return;

  // Tocar la propia barra también pule
  var track = document.getElementById("lapidaryPolishTrack");
  if(track && !track._polishBound){
    track._polishBound = true;
    track.addEventListener("pointerdown", function(e){ e.preventDefault(); handleLapidaryCutTrigger(); });
  }
  if(!lapidaryMinigameState.polishLock) layoutPolishZone();
  lapidaryMinigameState.polishLastT = performance.now();

  function loop(t){
    if(!lapidaryMinigameState.active || lapidaryMinigameState.phase !== 3){
      lapidaryMinigameState.animId = null;
      return;
    }
    // dt real entre fotogramas: la velocidad no depende de los fps del móvil
    var dt = Math.min(0.1, Math.max(0, (t - lapidaryMinigameState.polishLastT) / 1000));
    lapidaryMinigameState.polishLastT = t;
    var pass = POLISH_PASSES[lapidaryMinigameState.timingPass - 1];
    if(pass && !lapidaryMinigameState.polishLock){
      lapidaryMinigameState.cursorPos += lapidaryMinigameState.cursorDir * pass.speed * dt;
      if(lapidaryMinigameState.cursorPos >= 1){ lapidaryMinigameState.cursorPos = 1; lapidaryMinigameState.cursorDir = -1; }
      else if(lapidaryMinigameState.cursorPos <= 0){ lapidaryMinigameState.cursorPos = 0; lapidaryMinigameState.cursorDir = 1; }
      var cursorEl = document.getElementById("lapidaryGaugeCursor");
      if(cursorEl) cursorEl.style.left = (lapidaryMinigameState.cursorPos * 100) + "%";
    }
    lapidaryMinigameState.animId = requestAnimationFrame(loop);
  }
  lapidaryMinigameState.animId = requestAnimationFrame(loop);
}

function handleLapidaryCutTrigger(){
  if(lapidaryMinigameState.phase !== 3 || lapidaryMinigameState.polishLock) return;
  if(lapidaryMinigameState.timingPass > POLISH_PASSES.length) return;

  var pass = POLISH_PASSES[lapidaryMinigameState.timingPass - 1];
  var d = Math.abs(lapidaryMinigameState.cursorPos - lapidaryMinigameState.polishCenter);
  var grade = d <= pass.perf / 2 ? "p" : (d <= pass.perf * POLISH_GOOD_FACTOR / 2 ? "g" : "f");
  lapidaryMinigameState.passResults.push(grade);
  if(grade === "p") lapidaryMinigameState.timingHits++;
  lapidaryMinigameState.polishLock = true;

  if(grade === "p"){
    playGemSweetSpotHit();
    if(typeof triggerBg3Haptic === "function") triggerBg3Haptic("crit");
  } else if(grade === "g"){
    playLapidaryChiselStrike();
    if(typeof triggerBg3Haptic === "function") triggerBg3Haptic("land");
  } else {
    playGemSweetSpotMiss();
    if(typeof triggerBg3Haptic === "function") triggerBg3Haptic("fumble");
  }

  var gr = document.getElementById("lapidaryPolishGrade");
  if(gr){
    gr.textContent = grade === "p" ? "¡Perfecto!" : (grade === "g" ? "Bien" : "Fallo");
    gr.className = "lapidary-polish-grade " + grade;
    void gr.offsetWidth;
    gr.classList.add("pop");
  }

  lapidaryMinigameState.timingPass++;
  var family = getPolishFamily();
  var gem = document.getElementById("lapidaryPolishGem");
  if(gem) gem.innerHTML = polishGemSVG(family);
  var passes = document.getElementById("lapidaryPolishPasses");
  if(passes) passes.innerHTML = polishPassesHTML();
  var scoreEl = document.getElementById("lapidaryPolishScore");
  if(scoreEl) scoreEl.textContent = computePolishScore() + " / 100";

  lapidaryTimeout(function(){
    if(!lapidaryMinigameState.active || lapidaryMinigameState.phase !== 3) return;
    lapidaryMinigameState.polishLock = false;
    if(gr){ gr.textContent = ""; gr.className = "lapidary-polish-grade"; }
    var hint = document.getElementById("lapidaryTimingFeedback");
    if(lapidaryMinigameState.timingPass <= POLISH_PASSES.length){
      var tag = document.getElementById("lapidaryPolishTag");
      if(tag) tag.textContent = "Pasada " + lapidaryMinigameState.timingPass + " de " + POLISH_PASSES.length;
      layoutPolishZone();
      if(hint) hint.innerHTML = lapidaryMinigameState.timingPass === POLISH_PASSES.length ? "Última pasada: <b>la más rápida</b>." : "La zona cambia de sitio en cada pasada. Atento.";
    } else {
      lapidaryMinigameState.phase3Score = computePolishScore();
      if(lapidaryMinigameState.animId){ cancelAnimationFrame(lapidaryMinigameState.animId); lapidaryMinigameState.animId = null; }
      playLapidaryGrind();
      renderLapidaryModalContent();
    }
  }, 750);
}

/* ==========================================================================
   7. FASE 4: VEREDICTO — el jugador tira la calidad y el máster decide la rotura
   ========================================================================== */

function computeArtisanMasteryAndRisk(c){
  // Una nota de 0 también cuenta: solo se usa el valor por defecto si el paso no tiene nota
  var p1 = lapidaryMinigameState.phase1Score != null ? lapidaryMinigameState.phase1Score : 70;
  var p2 = lapidaryMinigameState.phase2Score != null ? lapidaryMinigameState.phase2Score : 70;
  var p3 = lapidaryMinigameState.phase3Score != null ? lapidaryMinigameState.phase3Score : 60;

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

function getLapidaryRiskLevel(risk){
  return risk <= 10 ? "low" : (risk <= 25 ? "mid" : "high");
}

// Bonos de la tirada de calidad (1d10 + bonos)
function getLapidaryRollModifiers(c){
  var tier = getLapidaryTier(c.lapidaryTier);
  var intVal = num(c.attrs.inteligencia, 1);
  var skillBonus = (c.skillBonus && c.skillBonus["Piedras mágicas"]) ? num(c.skillBonus["Piedras mágicas"], 0) : 0;
  var mods = [{ label: "Inteligencia", val: intVal, icon: "inteligencia", type: "attr" }];
  if(skillBonus !== 0) mods.push({ label: "Habilidad Piedras Mágicas", val: skillBonus, icon: "rune", type: "skill" });
  if(tier.bonusRoll) mods.push({ label: tier.name, val: tier.bonusRoll, icon: "gem", type: "tier" });
  if(lapidaryMinigameState.rollBonus) mods.push({ label: "Maestría " + lapidaryMinigameState.totalArtisanScore, val: lapidaryMinigameState.rollBonus, icon: "sparkle", type: "timing" });
  return mods;
}

function renderVerdictPhaseHTML(c){
  computeArtisanMasteryAndRisk(c);
  var S = lapidaryMinigameState;
  var risk = S.breakRisk, lvl = getLapidaryRiskLevel(risk);
  var riskWord = lvl === "low" ? "bajo" : (lvl === "mid" ? "moderado" : "alto");
  var mods = getLapidaryRollModifiers(c);
  var modSum = mods.reduce(function(a, m){ return a + m.val; }, 0);
  var row = function(label, v){
    return '<div class="lapidary-verdict-row"><span>' + label + '</span><div class="lapidary-verdict-meter"><div style="width:' + v + '%"></div></div><span>' + v + '</span></div>';
  };
  return '<div class="lapidary-phase-body lapidary-verdict">' +
    '<div class="lapidary-verdict-card">' +
      '<div class="lapidary-polish-head"><h3>Tu trabajo</h3><span class="lapidary-sheet-tag">Nota de cada paso</span></div>' +
      row("Desbaste", S.phase1Score) + row("Cortes", S.phase2Score) + row("Pulido", S.phase3Score) +
      '<div class="lapidary-verdict-total"><span>Maestría</span><b>' + S.totalArtisanScore + ' / 100</b></div>' +
    '</div>' +
    '<div class="lapidary-verdict-card">' +
      '<div class="lapidary-verdict-risk ' + lvl + '"><div class="num">' + risk + '%</div>' +
      '<div class="txt"><b>Riesgo de rotura ' + riskWord + '.</b> Lo resuelve el máster al final. Tu nota y tu kit lo bajan.</div></div>' +
    '</div>' +
    '<div class="lapidary-verdict-card">' +
      '<div class="lapidary-polish-head"><h3>Tirada de calidad</h3><span class="lapidary-sheet-tag">1d10 + bonos</span></div>' +
      '<div class="lapidary-verdict-mods">' + mods.map(function(m){ return '<span class="lapidary-verdict-mod">' + esc(m.label) + ' <b>' + (m.val >= 0 ? "+" : "") + m.val + '</b></span>'; }).join("") + '</div>' +
      '<button type="button" class="lapidary-cta-btn" data-action="lapidary-launch-roll">Tirar 1d10 + ' + modSum + '</button>' +
    '</div>' +
  '</div>';
}

function launchLapidaryRollModal(){
  var c = (state.characters || []).find(function(ch){ return ch.id === lapidaryMinigameState.charId; });
  var stone = c ? (c.stones || []).find(function(st){ return st.id === lapidaryMinigameState.stoneId; }) : null;
  if(!c || !stone) return;

  computeArtisanMasteryAndRisk(c);
  var family = getStoneFamily(stone.color);
  var modifiers = getLapidaryRollModifiers(c);
  var modSum = modifiers.reduce(function(a, m){ return a + m.val; }, 0);
  var verdict = { risk: lapidaryMinigameState.breakRisk, mastery: lapidaryMinigameState.totalArtisanScore };

  closeLapidaryMinigame();

  if(typeof openBg3RollModal === "function"){
    openBg3RollModal({
      title: "Talla de Lapidario",
      subtitle: "Calidad de la " + family.gema + " (el máster decidirá si aguanta)",
      sides: 10,
      qty: 1,
      charName: c.name,
      modifiers: modifiers,
      onResolve: function(rollState){
        resolveLapidaryCraft(c, stone, rollState, verdict);
      }
    });
  } else {
    var d10 = Math.floor(Math.random() * 10) + 1;
    resolveLapidaryCraft(c, stone, { total: d10 + modSum, r1: d10 }, verdict);
  }
}

// Guarda la calidad tirada y deja la piedra "Esperando al máster" (la rotura ya no se decide con un d100 oculto)
function resolveLapidaryCraft(c, stone, rollState, verdict){
  var grandTotal = parseInt(rollState && rollState.total, 10) || 0;
  var quality = getStoneQualityByRoll(grandTotal);
  verdict = verdict || { risk: lapidaryMinigameState.breakRisk, mastery: lapidaryMinigameState.totalArtisanScore };

  stone.estado = "pulida";
  stone.calidad = quality.id;
  stone.calidadTirada = quality.id;
  stone.totalTirada = grandTotal;
  stone.riesgoRotura = verdict.risk;
  stone.maestria = verdict.mastery;
  stone.talladoEn = new Date().toISOString();
  delete stone.veredictoMaster;

  if(quality.id === "arruinada"){
    // Una tirada arruinada no necesita veredicto: la gema ya no sirve
    stone.pendienteMaster = false;
    playGemFracture();
    showToast("Corte irregular. Calidad: Arruinada (Tirada: " + grandTotal + ").", "warning", {icono:"peligro"});
  } else {
    stone.pendienteMaster = true;
    playGemChime(quality.id);
    showToast("Talla terminada con calidad " + quality.label + " (" + grandTotal + "). Esperando al máster: decidirá si la piedra aguanta.", "success", {icono:"gema"});
  }

  saveState(false);
  if(typeof manageListItemRPC === "function"){
    manageListItemRPC(c, 'stones', 'update_item', stone, stone.id);
  } else if(typeof pushCharacterPatch === "function"){
    pushCharacterPatch(c.id, { stones: c.stones });
  }
  if(stone.pendienteMaster) broadcastLapidaryVerdict("lapidary_verdict_request", c, stone);

  if(typeof renderTabbar === "function") renderTabbar();
  renderTab();
}

/* ---------- Veredicto del máster: avisos en directo y decisión ---------- */

function getPendingLapidaryVerdicts(){
  var out = [];
  (state.characters || []).forEach(function(c){
    (c.stones || []).forEach(function(st){ if(st.pendienteMaster) out.push({ c: c, stone: st }); });
  });
  return out;
}

function broadcastLapidaryVerdict(event, c, stone){
  if(typeof realtimeChannel === "undefined" || !realtimeChannel || typeof realtimeChannel.send !== "function") return;
  try {
    realtimeChannel.send({
      type: "broadcast",
      event: event,
      payload: { charId: c.db_id || c.id, localId: c.id, charName: c.name, stone: stone, ts: Date.now() }
    }).catch(function(){});
  } catch(e){}
}

function findCharForLapidaryPayload(p){
  return (state.characters || []).find(function(x){ return x.id === p.localId || x.db_id === p.charId || x.id === p.charId; });
}

function handleRemoteLapidaryVerdict(event, p){
  if(!p || !p.stone) return;
  var c = findCharForLapidaryPayload(p);
  if(!c) return;
  var list = c.stones || (c.stones = []);
  var idx = list.findIndex(function(st){ return st.id === p.stone.id; });
  if(idx === -1) list.push(p.stone); else list[idx] = p.stone;
  if(typeof snapshotCharacterSynced === "function") snapshotCharacterSynced(c);
  if(typeof saveState === "function") saveState(true);

  var fam = getStoneFamily(p.stone.color);
  var q = getStoneQuality(p.stone.calidadTirada || p.stone.calidad);
  if(event === "lapidary_verdict_request" && typeof isGM === "function" && isGM()){
    showToast((p.charName || c.name) + " ha tallado una " + fam.gema + " · Calidad " + q.label + " (" + p.stone.totalTirada + ") · Riesgo " + p.stone.riesgoRotura + "%. Decide en la pestaña Piedras.", "info", {icono:"balanza"});
  } else if(event === "lapidary_verdict_resolved" && typeof canEditChar === "function" && canEditChar(c) && !(typeof isGM === "function" && isGM())){
    if(p.stone.veredictoMaster === "rota"){
      playGemFracture();
      showToast("El máster decide que tu " + fam.gema + " se rompe. Calidad: Arruinada.", "error", {icono:"golpe"});
    } else {
      playGemChime(p.stone.calidad);
      showToast("◆ ¡Tu " + fam.gema + " aguanta! Calidad " + q.label + ".", "success");
    }
  }
  if(typeof renderTabbar === "function") renderTabbar();
  if(typeof state !== "undefined" && (state.activeTab === "lapidario" || state.activeTab === "ficha") && typeof renderTab === "function") renderTab();
}

// Los oyentes se enganchan cuando existe el canal de tiempo real (y se vuelven a enganchar si se recrea)
var lapidaryVerdictChannel = null;
setInterval(function(){
  if(typeof realtimeChannel === "undefined" || !realtimeChannel || realtimeChannel === lapidaryVerdictChannel) return;
  lapidaryVerdictChannel = realtimeChannel;
  try {
    realtimeChannel.on("broadcast", { event: "lapidary_verdict_request" }, function(msg){ handleRemoteLapidaryVerdict("lapidary_verdict_request", msg && msg.payload); });
    realtimeChannel.on("broadcast", { event: "lapidary_verdict_resolved" }, function(msg){ handleRemoteLapidaryVerdict("lapidary_verdict_resolved", msg && msg.payload); });
  } catch(e){ console.warn("No se pudo escuchar el veredicto del lapidario:", e); }
}, 2000);

// El máster decide: lee la ficha fresca de la base de datos y cambia solo esa piedra (no pisa otros cambios del jugador)
async function resolveLapidaryVerdict(charId, stoneId, decision){
  if(typeof isGM !== "function" || !isGM()) return;
  var c = (state.characters || []).find(function(x){ return x.id === charId; });
  if(!c) return;
  var applyDecision = function(st){
    st.pendienteMaster = false;
    st.veredictoMaster = decision === "rota" ? "rota" : "aguanta";
    st.resueltoEn = new Date().toISOString();
    if(decision === "rota") st.calidad = "arruinada";
  };

  var resolvedStone = null;
  if(typeof supabaseClient !== "undefined" && supabaseClient && c.db_id){
    try {
      var res = await supabaseClient.from("characters").select("data").eq("id", c.db_id).single();
      if(res.error || !res.data) throw (res.error || new Error("Ficha no encontrada"));
      var freshStones = JSON.parse(JSON.stringify((res.data.data && res.data.data.stones) || []));
      var st = freshStones.find(function(x){ return x.id === stoneId; });
      if(!st){ showToast("Esa piedra ya no existe en la ficha.", "warning"); return; }
      if(!st.pendienteMaster){
        showToast("Esa piedra ya estaba resuelta.", "info");
        c.stones = freshStones;
        if(typeof snapshotCharacterSynced === "function") snapshotCharacterSynced(c);
        saveState(true); renderTabbar(); renderTab();
        return;
      }
      applyDecision(st);
      var rpc = await supabaseClient.rpc("update_character_data", { char_id: c.db_id, patch: { stones: freshStones } });
      if(rpc.error) throw rpc.error;
      c.stones = freshStones;
      if(typeof snapshotCharacterSynced === "function") snapshotCharacterSynced(c);
      saveState(true);
      resolvedStone = st;
    } catch(err){
      console.warn("No se pudo guardar el veredicto:", err);
      showToast("No se ha podido guardar el veredicto. La piedra sigue pendiente; inténtalo de nuevo.", "error");
      return;
    }
  } else {
    var local = (c.stones || []).find(function(x){ return x.id === stoneId; });
    if(!local || !local.pendienteMaster) return;
    applyDecision(local);
    saveState(false);
    resolvedStone = local;
  }

  delete lapidaryVerdictD100[stoneId];
  if(decision === "rota") playGemFracture(); else playGemChime(resolvedStone.calidad);
  showToast(decision === "rota" ? "Decidido: la piedra se rompe. El jugador ya lo ve." : "Decidido: la piedra aguanta. El jugador ya lo ve.", decision === "rota" ? "warning" : "success");
  broadcastLapidaryVerdict("lapidary_verdict_resolved", c, resolvedStone);
  renderTabbar();
  renderTab();
}

// Tirada de ayuda del máster: solo sugiere y no se guarda en ningún sitio que vea el jugador
var lapidaryVerdictD100 = {};

function renderLapidaryVerdictPanel(){
  if(typeof isGM !== "function" || !isGM()) return "";
  var pending = getPendingLapidaryVerdicts();
  if(!pending.length) return "";
  var html = '<div class="section lapidary-verdict-panel">' +
    '<div class="section-title"><span>' + icono("balanza") + ' Veredictos pendientes (' + pending.length + ')</span></div>';
  pending.forEach(function(it){
    var st = it.stone, fam = getStoneFamily(st.color), q = getStoneQuality(st.calidadTirada || st.calidad);
    var d = lapidaryVerdictD100[st.id];
    var dTxt = d ? 'd100: <b>' + d + '</b> contra riesgo ' + esc(st.riesgoRotura) + ' → sugiere que <b class="' + (d <= st.riesgoRotura ? "bad" : "ok") + '">' + (d <= st.riesgoRotura ? "se rompe" : "aguanta") + '</b>. Tú decides.' : "Decide tú, o tira un d100 de ayuda.";
    html += '<div class="lapidary-verdict-gmcard">' +
      '<span class="lapidary-verdict-gmtag">Aviso para el máster</span>' +
      '<h4>' + esc(it.c.name) + ' ha tallado una ' + esc(fam.gema) + '</h4>' +
      '<div class="lapidary-verdict-gminfo">Calidad <b style="color:' + q.color + '">' + esc(q.label) + '</b> (' + (st.totalTirada != null ? esc(st.totalTirada) : "?") + ') · Maestría ' + (st.maestria != null ? esc(st.maestria) : "?") + ' · <b>Riesgo ' + (st.riesgoRotura != null ? esc(st.riesgoRotura) : "?") + '%</b></div>' +
      '<div class="lapidary-verdict-d100">' + dTxt + '</div>' +
      '<div class="lapidary-verdict-gmgrid">' +
        '<button type="button" class="lapidary-ghost-btn full" data-action="lapidary-verdict-d100" data-stone-id="' + st.id + '">Tirar d100 de ayuda</button>' +
        '<button type="button" class="lapidary-verdict-ok" data-action="lapidary-verdict-decide" data-decision="aguanta" data-char-id="' + it.c.id + '" data-stone-id="' + st.id + '">Aguanta</button>' +
        '<button type="button" class="lapidary-verdict-brk" data-action="lapidary-verdict-decide" data-decision="rota" data-char-id="' + it.c.id + '" data-stone-id="' + st.id + '">Se rompe</button>' +
      '</div>' +
    '</div>';
  });
  html += '<p class="lapidary-verdict-note">El jugador ve "Esperando al máster" hasta que eliges. Tu decisión le llega al momento.</p></div>';
  return html;
}

// Aviso naranja en las tarjetas de piedra del jugador
function renderLapidaryStoneStatus(st){
  if(st.pendienteMaster){
    return '<div class="lapidary-verdict-status wait"><span class="ic">' + icono("actividad") + '</span><span>Calidad <b>' + esc(getStoneQuality(st.calidadTirada || st.calidad).label) + '</b>. <b>Esperando al máster</b>: decidirá si la piedra aguanta (riesgo ' + (st.riesgoRotura != null ? st.riesgoRotura : "?") + '%).</span></div>';
  }
  if(st.veredictoMaster === "rota") return '<div class="lapidary-verdict-status brk"><span class="ic">' + iconoUI("cerrar") + '</span><span>El máster decidió que la piedra <b>se rompió</b> al tallarla.</span></div>';
  if(st.veredictoMaster === "aguanta") return '<div class="lapidary-verdict-status okk"><span class="ic">◆</span><span>La piedra aguantó la talla.</span></div>';
  return "";
}

document.addEventListener("click", function(e){
  var btn = e.target.closest("[data-action]");
  if(!btn) return;
  var act = btn.getAttribute("data-action");
  if(act === "lapidary-verdict-d100"){
    if(typeof isGM !== "function" || !isGM()) return;
    lapidaryVerdictD100[btn.getAttribute("data-stone-id")] = 1 + Math.floor(Math.random() * 100);
    playGemFractureTick();
    renderTab();
  } else if(act === "lapidary-verdict-decide"){
    if(btn.disabled) return;
    btn.disabled = true;
    resolveLapidaryVerdict(btn.getAttribute("data-char-id"), btn.getAttribute("data-stone-id"), btn.getAttribute("data-decision"));
  }
});

/* ==========================================================================
   8. ADQUISICIÓN DE PIEDRAS EN BRUTO (MODAL)
   ========================================================================== */

function openAddRoughStoneModal(charId){
  var modal = document.getElementById("addStoneModal");
  var overlay = document.getElementById("addStoneModalOverlay");
  if(!modal || !overlay) return;

  var colorPills = (typeof MAGIC_STONE_FAMILIES !== "undefined" ? MAGIC_STONE_FAMILIES : []).map(function(fam, idx){
    return '<button type="button" class="f-pill add-stone-color-pill ' + (idx === 0 ? 'active' : '') + '" data-action="select-add-stone-color" data-color="' + fam.id + '" style="--pill-border:' + fam.hex + ';--pill-bg:' + fam.hex + '33;--pill-glow:' + fam.hex + '88;border-color:' + (idx === 0 ? fam.hex : 'rgba(255,255,255,0.18)') + ';">' +
      icono(STONE_ICONO[fam.id] || "piedras", {tam:"s"}) + ' Piedra ' + fam.name +
    '</button>';
  }).join('');

  var origins = ["Minas / Cuevas", "Comercio / Compra"];
  var originPills = origins.map(function(org, idx){
    return '<button type="button" class="f-pill add-stone-origin-pill ' + (idx === 0 ? 'active' : '') + '" data-action="select-add-stone-origin" data-origin="' + org + '">' +
      (org.includes("Minas") ? icono("pico",{tam:"s"}) : icono("moneda-oro",{tam:"s"})) + " " + org +
    '</button>';
  }).join('');

  var html = '<h2>' + iconoUI("mas") + ' Nueva Piedra en Bruto<button type="button" data-action="close-add-stone-modal" aria-label="Cerrar">&times;</button></h2>' +
    '<div class="field">' +
      '<label>Color de la Piedra Mágica</label>' +
      '<div class="filter-pills" id="addStoneColors" style="flex-wrap:wrap;gap:6px;margin-top:4px;">' + colorPills + '</div>' +
    '</div>' +
    '<div class="field" style="margin-top:12px;">' +
      '<label>Origen o Yacimiento</label>' +
      '<div class="filter-pills" id="addStoneOrigins" style="flex-wrap:wrap;gap:6px;margin-top:4px;">' + originPills + '</div>' +
    '</div>' +
    '<div class="field" style="margin-top:12px;">' +
      '<label>Efecto Concreto de la Piedra Mágica (Opcional, secreto del GM)</label>' +
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
  showToast("Información secreta de la gema revelada al jugador.", "success", {icono:"percepcion"});
}
