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
  for(var k = 0; k < G.d.hearts; k++) hearts += (k < G.hearts ? "♥" : '<span class="off">♥</span>');
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
        row("Integridad (" + Math.max(0, G.hearts) + " de " + G.d.hearts + " ♥)", s.integ + " / 25") +
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
        '<button type="button" id="lapidaryGeodeModeDig" data-action="geode-mode" data-mode="dig" aria-pressed="true">⛏ Picar</button>' +
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
      '<div class="lapidary-step-label">Desbaste</div>' +
    '</div>' +
    '<div class="lapidary-step-line ' + (lapidaryMinigameState.phase > 1 ? 'active' : '') + '"></div>' +
    '<div class="lapidary-step ' + (lapidaryMinigameState.phase === 2 ? 'current' : (lapidaryMinigameState.phase > 2 ? 'completed' : '')) + '">' +
      '<div class="lapidary-step-num">2</div>' +
      '<div class="lapidary-step-label">Cortes Guiados</div>' +
    '</div>' +
    '<div class="lapidary-step-line ' + (lapidaryMinigameState.phase > 2 ? 'active' : '') + '"></div>' +
    '<div class="lapidary-step ' + (lapidaryMinigameState.phase === 3 ? 'current' : (lapidaryMinigameState.phase > 3 ? 'completed' : '')) + '">' +
      '<div class="lapidary-step-num">3</div>' +
      '<div class="lapidary-step-label">Pulido</div>' +
    '</div>' +
    '<div class="lapidary-step-line ' + (lapidaryMinigameState.phase > 3 ? 'active' : '') + '"></div>' +
    '<div class="lapidary-step ' + (lapidaryMinigameState.phase === 4 ? 'current' : '') + '">' +
      '<div class="lapidary-step-num">4</div>' +
      '<div class="lapidary-step-label">Riesgo & Tirada</div>' +
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
          '<button type="button" class="btn-solid-gold lapidary-btn-advance pulse-glow" data-action="advance-to-facetting">💎 ¡3 Cortes Concluidos! (' + lapidaryMinigameState.phase2Score + ' pts) Avanzar al Pulido ➡️</button>' :
          '<button type="button" class="btn-compact" disabled style="width:100%;padding:9px;">Conduce la sierra diamantada con pulso y velocidad...</button>'
        ) +
      '</div>' +
    '</div>';
  }

  // ==========================================
  // FASE 3: PULIDO DE FACETAS
  // ==========================================
  else if(lapidaryMinigameState.phase === 3){
    html += renderPolishPhaseHTML(family);
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
          '<div class="lapidary-score-header"><span>✨ Pulido</span><b>' + lapidaryMinigameState.phase3Score + '% (' + lapidaryMinigameState.phase3Score + ' pts)</b></div>' +
          '<div class="lapidary-mini-meter"><div class="lapidary-mini-meter-fill" style="width:' + lapidaryMinigameState.phase3Score + '%;"></div></div>' +
          '<div class="lapidary-score-sub">Aporte al Balance: +' + Math.round(lapidaryMinigameState.phase3Score * 0.30) + ' pts &bull; ' + lapidaryMinigameState.timingHits + ' de ' + lapidaryMinigameState.maxPasses + ' perfectas</div>' +
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
      fam.icon + ' Piedra ' + fam.name +
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
  showToast("👁️ Información secreta de la gema revelada al jugador.", "success");
}
