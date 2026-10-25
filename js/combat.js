async function applyDamageRPC(char, amount){
  if(!char) return;
  renderTopbar();
  if(typeof pushCharacterPatch === 'function'){
    await pushCharacterPatch(char.id, { combat: char.combat });
  }
}

async function applyHealRPC(char, amount){
  if(!char) return;
  renderTopbar();
  if(typeof pushCharacterPatch === 'function'){
    await pushCharacterPatch(char.id, { combat: char.combat });
  }
}

async function changeManaRPC(char, amount){
  if(!char || amount === 0) return;
  renderTopbar();
  if(typeof pushCharacterPatch === 'function'){
    await pushCharacterPatch(char.id, { combat: char.combat });
  }
}

async function changeShieldRPC(char, amount){
  if(!char || amount === 0) return;
  renderTopbar();
  if(typeof pushCharacterPatch === 'function'){
    await pushCharacterPatch(char.id, { combat: char.combat });
  }
}

// El dinero solo lo cambia la función mover_dinero de la nube: suma o resta sin pisar otros cambios,
// deja apuntado quién lo hizo y no repite un envío con la misma clave. El guardado de la ficha nunca lo lleva.
// Los envíos de una ficha van en fila; si uno falla, se deshace en pantalla y se avisa.
var moneyQueue = {};
var moneyPending = {};
var moneyLogCache = {};
var moneyRpcMissing = false;

// Oro, plata y gremio son enteros: "1.567" escrito con punto de miles es 1567
function moneyInt(v){
  var n = Number(v);
  if(!isFinite(n) || n <= 0) return 0;
  if(Math.floor(n) === n) return n;
  if(/^\d{1,3}\.\d{3}$/.test(String(v))) return Math.round(n * 1000);
  return Math.floor(n);
}

function newMoneyKey(){
  try { if(window.crypto && crypto.randomUUID) return crypto.randomUUID(); } catch(e){}
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

function changeMoneyRPC(char, deltaOro, deltaPlata, deltaGremio, motivo){
  if(!char) return Promise.resolve();
  deltaOro = parseInt(deltaOro, 10) || 0;
  deltaPlata = parseInt(deltaPlata, 10) || 0;
  deltaGremio = parseInt(deltaGremio, 10) || 0;
  if(deltaOro === 0 && deltaPlata === 0 && deltaGremio === 0) return Promise.resolve();
  // Lo que ya se ve en pantalla no debe salir otra vez en el guardado por diferencias
  if(!char._lastSyncedData) char._lastSyncedData = {};
  char._lastSyncedData.money = JSON.parse(JSON.stringify(char.money || { oro: 0, plata: 0 }));
  saveState(true);
  var key = char.id;
  var clave = newMoneyKey();
  moneyPending[key] = (moneyPending[key] || 0) + 1;
  var prev = moneyQueue[key] || Promise.resolve();
  var next = prev.then(function(){ return sendMoneyChange(char, deltaOro, deltaPlata, deltaGremio, clave, motivo); }).catch(function(){}).then(function(){ moneyPending[key] = Math.max(0, (moneyPending[key] || 1) - 1); });
  moneyQueue[key] = next;
  return next;
}

function isMoneyNetError(err){
  if(!err) return false;
  if(typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  return !err.code && /fetch|network|load failed|timeout/i.test(err.message || String(err));
}

async function sendMoneyChange(char, deltaOro, deltaPlata, deltaGremio, clave, motivo){
  var cur = function(){ return (state.characters||[]).find(function(x){ return x.id === char.id; }) || char; };
  var errMsg = 'No se pudo guardar el dinero, inténtalo otra vez';
  if(char.db_id && typeof supabaseClient !== 'undefined' && supabaseClient && currentUser && !moneyRpcMissing){
    var args = { p_char_id: char.db_id, p_oro: deltaOro, p_plata: deltaPlata, p_gremio: deltaGremio, p_motivo: motivo || 'botones', p_clave: clave };
    // Con mala conexión se reintenta con la misma clave: la nube no lo suma dos veces
    for(var intento = 0; intento < 3; intento++){
      var res = null, err = null;
      try { res = await supabaseClient.rpc('mover_dinero', args); err = res.error; }
      catch(e){ err = e; }
      if(!err && res && res.data){
        var c = cur();
        c.money = c.money || { oro: 0, plata: 0 };
        // Solo el último envío de la fila pone el valor de la nube (los anteriores ya están sumados en pantalla)
        if((moneyPending[char.id] || 0) <= 1){
          c.money.oro = num(res.data.oro, 0);
          c.money.plata = num(res.data.plata, 0);
          if(res.data.gremio !== undefined) c.money.gremio = num(res.data.gremio, 0);
          if(!c._lastSyncedData) c._lastSyncedData = {};
          c._lastSyncedData.money = JSON.parse(JSON.stringify(c.money));
          saveState(true);
          refreshMoneyView(c);
        }
        loadMoneyLog(c, true);
        return;
      }
      console.warn('mover_dinero:', (err && (err.message || err)) || 'sin datos');
      if(err && (err.code === 'PGRST202' || err.code === '42883')){
        moneyRpcMissing = true;
        errMsg = 'El dinero no se puede cambiar hasta que se actualice la partida';
        break;
      }
      if(err && err.message && !isMoneyNetError(err)){
        errMsg = /MANTENIMIENTO/.test(err.message) ? 'La web está en mantenimiento: no se guardan cambios' : ('No se pudo cambiar el dinero: ' + err.message);
        break;
      }
      await new Promise(function(r){ setTimeout(r, 800 * (intento + 1)); });
    }
  }
  // No se guardó: se deshace lo que se había sumado en pantalla
  var cc = cur();
  cc.money = cc.money || { oro: 0, plata: 0 };
  cc.money.oro = Math.max(0, moneyInt(cc.money.oro) - deltaOro);
  cc.money.plata = Math.max(0, moneyInt(cc.money.plata) - deltaPlata);
  if(deltaGremio || cc.money.gremio !== undefined) cc.money.gremio = Math.max(0, moneyInt(cc.money.gremio) - deltaGremio);
  if(!cc._lastSyncedData) cc._lastSyncedData = {};
  cc._lastSyncedData.money = JSON.parse(JSON.stringify(cc.money));
  saveState(true);
  if(moneyRpcMissing && state.activeTab === 'inventario' && typeof renderTab === 'function') renderTab();
  else refreshMoneyView(cc);
  if(typeof showToast === 'function') showToast(errMsg, 'error');
}

function refreshMoneyView(c){
  if(state.activeTab !== 'inventario' || !c || (typeof activeChar === 'function' && activeChar() !== c)) return;
  ['oro','plata','gremio'].forEach(function(part){
    var el = document.querySelector('input[data-bind="money.' + part + '"]');
    if(el && document.activeElement !== el){
      el.value = moneyInt(c.money[part]);
      el.setAttribute('data-last-val', moneyInt(c.money[part]));
    }
    var menos = document.querySelector('.money-btn.minus[data-part="' + part + '"]');
    if(menos) menos.disabled = moneyInt(c.money[part]) <= 0;
  });
}

function getMoneyLog(c){
  if(!c || !c.db_id) return [];
  var entry = moneyLogCache[c.db_id];
  if(!entry || Date.now() - entry.ts > 60000) loadMoneyLog(c);
  return entry ? entry.rows : [];
}

async function loadMoneyLog(c, force){
  if(!c || !c.db_id || typeof supabaseClient === 'undefined' || !supabaseClient || !currentUser) return;
  var entry = moneyLogCache[c.db_id];
  if(entry && entry.loading) return;
  if(!force && entry && Date.now() - entry.ts < 60000) return;
  moneyLogCache[c.db_id] = { rows: entry ? entry.rows : [], ts: Date.now(), loading: true };
  try {
    var res = await supabaseClient.from('money_log').select('*').eq('character_id', c.db_id).order('created_at', { ascending: false }).limit(5);
    var rows = (!res.error && Array.isArray(res.data)) ? res.data : (entry ? entry.rows : []);
    moneyLogCache[c.db_id] = { rows: rows, ts: Date.now() };
    var box = document.querySelector('[data-money-log="' + c.db_id + '"]');
    if(box && typeof tplMoneyLogRows === 'function') box.innerHTML = tplMoneyLogRows(rows);
  } catch(e){
    moneyLogCache[c.db_id] = { rows: entry ? entry.rows : [], ts: Date.now() };
  }
}

async function changeGoldRPC(char, amount){
  return changeMoneyRPC(char, amount, 0);
}

async function manageListItemRPC(char, listName, action, itemData, itemId, delta){
  if(!char || !listName) return;
  var patch = {};
  patch[listName] = char[listName];
  if(typeof pushCharacterPatch === 'function'){
    await pushCharacterPatch(char.id, patch);
  }
}

function calculateTotalArmor(char){
  if(!char || !Array.isArray(char.armors)) return { totalAbsorcion: 0, totalEstorbo: 0 };
  var totAbs = 0;
  var totEst = 0;
  char.armors.forEach(function(a){
    totAbs += num(a.absorcion, 0);
    totEst += num(a.estorbo, 0);
  });
  return { totalAbsorcion: totAbs, totalEstorbo: totEst };
}

// Descanso largo (migración 054): el máster elige quién descansa; vida y maná al máximo, escudo a 0
// y fuera los buffos del catálogo marcados "Se resetea al descansar largo"
function longRestBuffIds(){
  return (state.buffCatalog || []).filter(function(b){ return b && b.longRestReset === true; }).map(function(b){ return b.id; });
}

function openLongRestModal(){
  if(!isGM()) return;
  var chars = (state.characters || []).filter(function(c){ return !c.isNPC && c.db_id; });
  var resetIds = longRestBuffIds();
  var html = '<h2>🌙 Descanso largo<button data-action="close-modal" aria-label="Cerrar">&times;</button></h2>';
  html += '<p class="lr-help">Vida y maná al máximo, escudo a 0 y se quitan los buffos marcados "Se resetea al descansar largo".</p>';
  if(!chars.length){
    html += '<p class="lr-help">No hay personajes guardados en la nube.</p>';
  } else {
    html += '<div class="lr-top"><span class="lr-count" id="lrCount"></span>'+
      '<span class="lr-all"><button type="button" class="lr-link" data-action="long-rest-all">Marcar todos</button> · <button type="button" class="lr-link" data-action="long-rest-none">Ninguno</button></span></div>';
  }
  html += '<div class="lr-list">';
  chars.forEach(function(c){
    var copia = Object.assign({}, c, { activeBuffs: reglasBuffosTrasDescanso(c.activeBuffs, resetIds) });
    var maxPv = getEffectiveMaxHp(copia), maxMp = getEffectiveMaxMana(copia);
    var pv = num(c.combat && c.combat.pvActual, 0), mp = num(c.combat && c.combat.manaActual, 0);
    var quita = (c.activeBuffs || []).filter(function(ab){ return resetIds.indexOf(ab.id) !== -1; }).map(function(ab){ return ab.name; }).filter(Boolean);
    var face = safeUrl(c.portrait)
      ? '<span class="lr-face" style="background-image:url(\''+esc(safeUrl(c.portrait))+'\')"></span>'
      : '<span class="lr-face">'+esc((c.name || "?").charAt(0).toUpperCase())+'</span>';
    html += '<label class="lr-row">'+
      '<input type="checkbox" class="k-check long-rest-check" value="'+esc(c.id)+'" checked>'+
      face+
      '<span class="lr-main"><span class="lr-name">'+esc(c.name)+' <span class="lr-lv">NV. '+esc(c.nivel||"1")+'</span></span>'+
        '<span class="lr-off">No descansa</span>'+
        (quita.length ? '<span class="lr-quita">Se quita: '+esc(quita.join(", "))+'</span>' : '')+
      '</span>'+
      '<span class="lr-stats">'+lrStat(icono("vida", {tam:"s"}), pv, maxPv, "")+lrStat(icono("mana", {tam:"s"}), mp, maxMp, " mana")+'</span>'+
    '</label>';
  });
  html += '</div>';
  if(chars.length){
    html += '<div class="lr-foot"><button type="button" class="btn-compact" data-action="close-modal">Cancelar</button>'+
      '<button type="button" class="btn-compact btn-solid-gold" id="lrGo" data-action="do-long-rest">🌙 Descansar</button></div>';
  }
  document.getElementById("charModal").innerHTML = html;
  document.getElementById("charModalOverlay").classList.remove("hidden");
  updateLongRestUi();
}

function lrStat(icon, cur, max, cls){
  var pct = max > 0 ? Math.max(0, Math.min(100, Math.round(cur / max * 100))) : 0;
  return '<span class="lr-stat">'+icon+' <span class="lr-bar'+cls+'"><i style="width:'+pct+'%"></i></span>'+
    '<span class="lr-num">'+cur+'/'+max+(cur < max ? ' <b>→ máx.</b>' : '')+'</span></span>';
}

// Contador y botón según las casillas marcadas
function updateLongRestUi(){
  var all = document.querySelectorAll("#charModal .long-rest-check");
  if(!all.length) return;
  var n = 0;
  Array.prototype.forEach.call(all, function(el){
    if(el.checked) n++;
    var row = el.closest(".lr-row");
    if(row) row.classList.toggle("lr-skip", !el.checked);
  });
  var cnt = document.getElementById("lrCount");
  if(cnt) cnt.textContent = n + " de " + all.length + " descansan";
  var go = document.getElementById("lrGo");
  if(go){ go.textContent = "🌙 Descansar (" + n + ")"; go.disabled = n === 0; }
}

function setLongRestAll(on){
  Array.prototype.forEach.call(document.querySelectorAll("#charModal .long-rest-check"), function(el){ el.checked = on; });
  updateLongRestUi();
}

document.addEventListener("change", function(e){
  if(e.target && e.target.classList && e.target.classList.contains("long-rest-check")) updateLongRestUi();
});

// Luna que sube con fundido nocturno; sin movimiento si las animaciones están apagadas
function playLongRestFx(){
  var h = document.documentElement;
  if(h.classList.contains("juice-off") || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
  var fx = document.createElement("div");
  fx.className = "lr-fx";
  fx.innerHTML = '<span>🌙</span>';
  document.body.appendChild(fx);
  setTimeout(function(){ if(fx.parentNode) fx.parentNode.removeChild(fx); }, 700);
}

async function doLongRest(btn){
  if(!isGM()) return;
  if(!supabaseClient || !currentUser){ showToast("Hay que iniciar sesión para el descanso largo.", "warning"); return; }
  var ids = Array.prototype.map.call(document.querySelectorAll("#charModal .long-rest-check:checked"), function(el){ return el.value; });
  if(!ids.length){ showToast("No hay nadie marcado para descansar.", "warning"); return; }
  var resetIds = longRestBuffIds();
  var items = [];
  ids.forEach(function(id){
    var c = (state.characters || []).find(function(x){ return x.id === id; });
    if(!c || !c.db_id) return;
    // Los máximos se calculan sin los buffos que se van a quitar
    var copia = Object.assign({}, c, { activeBuffs: reglasBuffosTrasDescanso(c.activeBuffs, resetIds) });
    items.push({ id: c.db_id, pv: getEffectiveMaxHp(copia), mana: getEffectiveMaxMana(copia), remove: resetIds });
  });
  if(!items.length) return;
  if(btn) btn.disabled = true;
  var res;
  try {
    res = await supabaseClient.rpc('long_rest', { p_items: items });
  } catch(e){ res = { error: e }; }
  if(res.error || !res.data){
    if(btn) btn.disabled = false;
    console.warn("Descanso largo:", res.error);
    showToast("No se ha podido hacer el descanso largo" + (res.error && res.error.message ? ": " + res.error.message : "."), "error");
    return;
  }
  var done = applyLongRestItems(res.data.items || []);
  try {
    if(realtimeChannel) realtimeChannel.send({ type: 'broadcast', event: 'long_rest', payload: { items: res.data.items || [], ts: Date.now() } });
  } catch(e){}
  if(typeof loadRollHistory === "function") loadRollHistory();
  closeModals();
  playLongRestFx();
  renderTopbar();
  renderTab();
  showToast("🌙 Descanso largo: " + done + (done === 1 ? " personaje descansado" : " personajes descansados"), "success");
}

// Pone en la copia local lo que devolvió la base y lo marca como ya guardado
function applyLongRestItems(items){
  var n = 0;
  (items || []).forEach(function(it){
    var c = (state.characters || []).find(function(x){ return x.db_id === it.id || x.id === it.id; });
    if(!c) return;
    c.combat = Object.assign(c.combat || {}, it.combat || {});
    if(Array.isArray(it.activeBuffs)) c.activeBuffs = it.activeBuffs;
    if(!c._lastSyncedData) c._lastSyncedData = {};
    try {
      c._lastSyncedData.combat = JSON.parse(JSON.stringify(c.combat));
      c._lastSyncedData.activeBuffs = JSON.parse(JSON.stringify(c.activeBuffs || []));
    } catch(e){}
    n++;
  });
  saveState(true);
  return n;
}

function handleRemoteLongRest(data){
  if(!data || !Array.isArray(data.items)) return;
  applyLongRestItems(data.items);
  var mine = data.items.some(function(it){
    var c = (state.characters || []).find(function(x){ return x.db_id === it.id || x.id === it.id; });
    return c && !c.isNPC && currentUser && isCharOwner(c, currentUser);
  });
  if(typeof loadRollHistory === "function") loadRollHistory();
  renderTopbar();
  if(!document.activeElement || !document.activeElement.matches("input, textarea")) renderTab();
  if(mine) showToast("🌙 Has descansado: vida y maná al máximo", "success");
}
