// Subida de nivel: momento épico para quien sube y aviso breve para los demás

// Envía a la partida que un personaje ha subido (lo llama el máster al dar el nivel)
function broadcastLevelUp(info){
  try {
    if(typeof supabaseClient !== 'undefined' && supabaseClient && typeof realtimeChannel !== 'undefined' && realtimeChannel){
      realtimeChannel.send({ type: 'broadcast', event: 'level_up', payload: info });
    }
  } catch(e){}
}

function levelUpFindChar(info){
  var list = (typeof state !== 'undefined' && state && state.characters) || [];
  return list.find(function(x){ return (info.charId && (x.id === info.charId || x.db_id === info.charId)) || (info.charDbId && (x.db_id === info.charDbId || x.id === info.charDbId)); }) || null;
}

function levelUpIsMine(c){
  return !!(c && !c.isNPC && typeof currentUser !== 'undefined' && currentUser && typeof isCharOwner === 'function' && isCharOwner(c, currentUser));
}

function levelUpSeenKey(c){ return "krysalis_nivel_visto_" + (c.db_id || c.id); }

function levelUpMarkSeen(c, nivel){
  try { localStorage.setItem(levelUpSeenKey(c), String(nivel)); } catch(e){}
}

function handleRemoteLevelUp(info){
  if(!info || !info.nivel) return;
  var c = levelUpFindChar(info);
  if(levelUpIsMine(c) && !isGM()){
    levelUpMarkSeen(c, info.nivel);
    levelUpShow(info);
  } else {
    showToast("✨ " + (info.charName || "Un personaje") + " ha subido a nivel " + info.nivel, "success");
  }
}

// Si el jugador no estaba conectado cuando subió, lo ve al entrar (sin el detalle de lo ganado)
function levelUpCheckSeen(c){
  if(!levelUpIsMine(c) || isGM()) return;
  var nv = num(c.nivel, 1);
  var seen = null;
  try { seen = localStorage.getItem(levelUpSeenKey(c)); } catch(e){ return; }
  if(seen === null || num(seen, nv) > nv){ levelUpMarkSeen(c, nv); return; }
  if(nv <= num(seen, nv)) return;
  // Margen para que llegue antes el aviso en directo, que trae lo ganado
  setTimeout(function(){
    var s2 = null;
    try { s2 = localStorage.getItem(levelUpSeenKey(c)); } catch(e){}
    if(num(s2, 0) >= num(c.nivel, 1)) return;
    levelUpMarkSeen(c, c.nivel);
    levelUpShow({ charId: c.id, charName: c.name, titulo: c.titulo || "", nivel: num(c.nivel, 1), puntosTotal: num(c.skillPoints, 0) });
  }, 1500);
}

function levelUpReducedMotion(){
  try {
    if(window.UIJuice && !window.UIJuice.animOn()) return true;
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch(e){ return false; }
}

// Fanfarria corta hecha con el propio navegador (respeta el interruptor de Sonidos)
function levelUpFanfare(){
  var ctx = (typeof getAudioCtx === 'function') ? getAudioCtx() : null;
  if(!ctx) return;
  try {
    var t0 = ctx.currentTime + 0.05;
    var notas = [[523.25, 0, 0.14], [659.25, 0.14, 0.14], [783.99, 0.28, 0.14], [1046.5, 0.42, 0.55]];
    notas.forEach(function(n){
      ['triangle', 'sine'].forEach(function(tipo, i){
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = tipo;
        o.frequency.value = n[0] * (i ? 2 : 1);
        var ini = t0 + n[1], dur = n[2];
        g.gain.setValueAtTime(0.0001, ini);
        g.gain.exponentialRampToValueAtTime(i ? 0.05 : 0.18, ini + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ini + dur);
        o.connect(g); g.connect(ctx.destination);
        o.start(ini); o.stop(ini + dur + 0.05);
      });
    });
  } catch(e){}
}

function levelUpGainLines(info){
  var lines = [];
  if(info.puntos) lines.push("+" + info.puntos + " puntos de habilidad");
  if(info.vida) lines.push("+" + info.vida + " de vida máxima" + (info.vidaMax ? " (ahora " + info.vidaMax + ")" : ""));
  if(info.mana) lines.push("+" + info.mana + " de maná máximo" + (info.manaMax ? " (ahora " + info.manaMax + ")" : ""));
  if(!info.puntos && num(info.puntosTotal, 0) > 0) lines.push(info.puntosTotal + " puntos por repartir");
  return lines;
}

function levelUpShow(info){
  var prev = document.getElementById("levelUpOverlay");
  if(prev && prev.parentNode) prev.parentNode.removeChild(prev);
  var quieto = levelUpReducedMotion();
  var c = levelUpFindChar(info);
  // El aviso en directo puede llegar antes que los datos nuevos de la ficha
  var puntos = Math.max(c ? num(c.skillPoints, 0) : 0, num(info.puntosTotal, 0));
  var titulo = info.titulo || (c && c.titulo) || "";
  var lines = levelUpGainLines(info);

  var sparks = '';
  if(!quieto){
    for(var i = 0; i < 18; i++){
      var ang = (i / 18) * Math.PI * 2 + Math.random() * 0.3;
      var dist = 90 + Math.random() * 90;
      sparks += '<span class="lvlup-spark" style="--dx:' + Math.round(Math.cos(ang) * dist) + 'px;--dy:' + Math.round(Math.sin(ang) * dist) + 'px;animation-delay:' + (0.25 + Math.random() * 0.25).toFixed(2) + 's"></span>';
    }
  }

  var ov = document.createElement("div");
  ov.id = "levelUpOverlay";
  ov.className = "lvlup-overlay" + (quieto ? " lvlup-quieto" : "");
  ov.setAttribute("role", "dialog");
  ov.setAttribute("aria-modal", "true");
  ov.setAttribute("aria-label", "Subida de nivel");
  ov.innerHTML =
    '<div class="lvlup-burst" aria-hidden="true"></div>' +
    '<div class="lvlup-card">' +
      '<div class="lvlup-sparks" aria-hidden="true">' + sparks + '</div>' +
      '<div class="lvlup-num" aria-hidden="true">' + esc(String(info.nivel)) + '</div>' +
      '<div class="lvlup-title">¡Nivel ' + esc(String(info.nivel)) + '!</div>' +
      '<div class="lvlup-name">' + esc(info.charName || (c && c.name) || "") + (titulo ? ' · ' + esc(titulo) : '') + '</div>' +
      (lines.length ? '<ul class="lvlup-gains">' + lines.map(function(l, i){ return '<li style="animation-delay:' + (1.1 + i * 0.35).toFixed(2) + 's">' + esc(l) + '</li>'; }).join('') + '</ul>' : '') +
      '<div class="lvlup-btns">' +
        (puntos > 0 ? '<button type="button" class="btn-solid-gold lvlup-btn" data-lvlup="repartir">Repartir puntos</button>' : '') +
        '<button type="button" class="btn-compact lvlup-btn" data-lvlup="cerrar">¡Genial!</button>' +
      '</div>' +
    '</div>';

  function cerrar(){ if(ov.parentNode) ov.parentNode.removeChild(ov); }
  ov.addEventListener("click", function(e){
    var b = e.target.closest ? e.target.closest("[data-lvlup]") : null;
    if(!b) return;
    cerrar();
    if(b.getAttribute("data-lvlup") === "repartir" && typeof state !== 'undefined'){
      state.activeTab = "habilidades";
      if(typeof saveState === 'function') saveState(true);
      if(typeof renderTabbar === 'function') renderTabbar();
      if(typeof renderTab === 'function') renderTab();
    }
  });
  document.body.appendChild(ov);

  if(window.UIJuice) window.UIJuice.vibrar([60, 40, 120, 40, 220]);
  levelUpFanfare();
}

window.handleRemoteLevelUp = handleRemoteLevelUp;
