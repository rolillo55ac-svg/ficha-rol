// Historial de tiradas guardado en la base (tabla dice_rolls, migración 035).
// El broadcast 'dice_roll' sigue siendo el aviso al momento; la fuente de verdad es la tabla.
// Si la tabla aún no existe en el proyecto, todo sigue como antes (solo el rollLog local).
var rollHistoryCache = null;      // últimas tiradas leídas de la base (null = sin leer)
var rollHistoryTableMissing = false;
var ROLL_HISTORY_PAGE = 50;
var rollHistoryView = { items: [], charName: "", onlyRequested: false, loading: false, more: false, offset: 0 };

function newRollUuid(){
  if(window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(ch){
    var r = Math.random() * 16 | 0;
    return (ch === "x" ? r : (r & 3 | 8)).toString(16);
  });
}

function isRollTableMissingError(err){
  if(!err) return false;
  var msg = String(err.message || "");
  return err.code === "42P01" || err.code === "PGRST205" || /dice_rolls/.test(msg) && /(does not exist|schema cache|not find)/i.test(msg);
}

function rollRowToItem(r){
  return {
    id: r.id,
    charName: r.char_name || "Aventurero",
    label: r.label || "Tirada",
    total: r.total,
    formulaText: r.formula_text || "",
    isCrit: !!r.is_crit,
    isFumble: !!r.is_fumble,
    mode: r.mode || "normal",
    dc: (r.dc === null || r.dc === undefined) ? null : r.dc,
    success: (r.success === null || r.success === undefined) ? null : r.success,
    gameHours: (r.game_hours === null || r.game_hours === undefined) ? null : r.game_hours,
    requestId: r.request_id || null,
    hidden: !!r.hidden,
    ts: r.created_at ? Date.parse(r.created_at) : Date.now()
  };
}

// Ficha con la que se tira: solo se apunta si es del usuario (o si es el máster); si no, la base la rechazaría
function rollCharacterIdFor(charId){
  if(!charId || !currentUser) return null;
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(charId)) return null;
  if(isGM()) return charId;
  var c = (state.characters || []).find(function(x){ return x.db_id === charId; });
  return (c && c.owner_id === currentUser.id) ? charId : null;
}

async function saveDiceRollToDb(rollObj){
  if(!rollObj || rollHistoryTableMissing || !supabaseClient || !currentUser) return;
  var row = {
    id: rollObj.dbId || newRollUuid(),
    user_id: currentUser.id,
    character_id: rollCharacterIdFor(rollObj.charId),
    char_name: rollObj.charName || "Aventurero",
    label: rollObj.label || "Tirada",
    kind: rollObj.kind || null,
    sides: rollObj.sides || null,
    qty: rollObj.qty || null,
    dice: Array.isArray(rollObj.dice) ? rollObj.dice : null,
    modifier: (typeof rollObj.modifier === "number") ? rollObj.modifier : null,
    total: (typeof rollObj.total === "number") ? rollObj.total : (parseInt(rollObj.total, 10) || 0),
    mode: rollObj.mode || "normal",
    dc: (typeof rollObj.dc === "number") ? rollObj.dc : null,
    success: (typeof rollObj.success === "boolean") ? rollObj.success : null,
    is_crit: !!rollObj.isCrit,
    is_fumble: !!rollObj.isFumble,
    formula_text: rollObj.formulaText || "",
    game_hours: (typeof getGameClockHours === "function" && getGameClockHours() !== null) ? getGameClockHours() : null,
    request_id: rollObj.requestId || null
  };
  addRollToHistoryCache(rollRowToItem(Object.assign({}, row, { created_at: new Date(rollObj.ts || Date.now()).toISOString() })));
  try {
    var res = await supabaseClient.from("dice_rolls").insert(row);
    if(res.error){
      if(isRollTableMissingError(res.error)) rollHistoryTableMissing = true;
      else console.warn("No se pudo guardar la tirada en el historial:", res.error);
    }
  } catch(e){
    console.warn("No se pudo guardar la tirada en el historial:", e);
  }
}

function addRollToHistoryCache(item){
  if(!rollHistoryCache || !item) return;
  if(rollHistoryCache.some(function(x){ return x.id === item.id; })) return;
  rollHistoryCache.unshift(item);
  if(rollHistoryCache.length > 20) rollHistoryCache.length = 20;
}

// Tirada que llega por tiempo real de otro usuario
function addRemoteRollToHistory(rollObj){
  if(!rollObj) return;
  addRollToHistoryCache({
    id: rollObj.dbId || rollObj.id || uid(),
    charName: rollObj.charName || "Aventurero",
    label: rollObj.label || "Tirada",
    total: rollObj.total,
    formulaText: rollObj.formulaText || "",
    isCrit: !!rollObj.isCrit,
    isFumble: !!rollObj.isFumble,
    mode: rollObj.mode || "normal",
    dc: (typeof rollObj.dc === "number") ? rollObj.dc : null,
    success: (typeof rollObj.success === "boolean") ? rollObj.success : null,
    gameHours: (typeof getGameClockHours === "function") ? getGameClockHours() : null,
    requestId: rollObj.requestId || null,
    ts: rollObj.ts || Date.now()
  });
}

async function fetchDiceRolls(opts){
  opts = opts || {};
  var q = supabaseClient.from("dice_rolls").select("*").order("created_at", { ascending: false })
    .range(opts.offset || 0, (opts.offset || 0) + (opts.limit || ROLL_HISTORY_PAGE) - 1);
  if(opts.charName) q = q.eq("char_name", opts.charName);
  if(opts.onlyRequested) q = q.not("request_id", "is", null);
  var res = await q;
  if(res.error){
    if(isRollTableMissingError(res.error)) rollHistoryTableMissing = true;
    throw res.error;
  }
  return (res.data || []).map(rollRowToItem);
}

// Al abrir la web (y al volver a ella): últimas tiradas desde la base
async function loadRollHistory(){
  if(rollHistoryTableMissing || !supabaseClient || !currentUser) return;
  try {
    var items = await fetchDiceRolls({ limit: 20 });
    var pending = (rollHistoryCache || []).filter(function(x){
      return !items.some(function(y){ return y.id === x.id; }) && x.ts > (items[0] ? items[0].ts : 0);
    });
    rollHistoryCache = pending.concat(items).slice(0, 20);
    if(typeof renderTab === "function" && state && (state.activeTab === "habilidades" || state.activeTab === "combate" || state.activeTab === "estados")) renderTab();
  } catch(e){
    if(!rollHistoryTableMissing) console.warn("No se pudo leer el historial de tiradas:", e);
  }
}

// Lista corta de las pestañas: de la base si ya se leyó; si no, el rollLog local
function recentRollsForLog(){
  if(rollHistoryCache) return rollHistoryCache;
  return (state && state.rollLog) || [];
}

function rollModeText(mode){
  if(mode === "adv") return "Ventaja";
  if(mode === "disadv") return "Desventaja";
  return "";
}

function rollHistoryItemHtml(r){
  var when = new Date(r.ts || Date.now());
  var meta = [when.toLocaleDateString("es-ES", { day: "numeric", month: "short" }) + " " + when.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })];
  if(r.gameHours !== null && r.gameHours !== undefined && typeof formatGameClock === "function") meta.push("🕰️ " + formatGameClock(r.gameHours));
  var modeTxt = rollModeText(r.mode);
  if(modeTxt) meta.push(modeTxt);
  if(r.requestId) meta.push("📣 Pedida por el máster");
  if(r.hidden) meta.push("🙈 Oculta");
  var dcTxt = "";
  if(r.dc !== null && r.dc !== undefined){
    dcTxt = '<div class="rl-formula">CD ' + esc(r.dc) + (r.success === true ? " · ✅ Superada" : (r.success === false ? " · ❌ Fallada" : "")) + '</div>';
  }
  var critTxt = r.isCrit ? " · ¡Crítico!" : (r.isFumble ? " · ¡Pifia!" : "");
  var delBtn = (isGM() && !rollHistoryTableMissing && /^[0-9a-f-]{36}$/i.test(String(r.id))) ?
    '<button type="button" class="game-clock-btn roll-history-del" data-action="roll-history-delete" data-roll-id="' + esc(r.id) + '" aria-label="Borrar tirada">🗑</button>' : '';
  return '<div class="roll-log-item roll-history-item">' +
      '<div class="rl-info"><span class="rl-char">' + esc(r.charName) + '</span> — <span class="rl-label">' + esc(r.label) + '</span>' +
        '<div class="rl-formula">' + esc(r.formulaText) + esc(critTxt) + '</div>' + dcTxt +
        '<div class="rl-formula">' + esc(meta.join(" · ")) + '</div>' +
      '</div>' +
      '<div class="rl-result-badge" title="Resultado">' + esc(r.total) + '</div>' + delBtn +
    '</div>';
}

function ensureRollHistoryModal(){
  var overlay = document.getElementById("rollHistoryOverlay");
  if(overlay) return overlay;
  overlay = document.createElement("div");
  overlay.className = "modal-overlay hidden";
  overlay.id = "rollHistoryOverlay";
  overlay.innerHTML = '<div class="modal roll-history-modal" id="rollHistoryModal"></div>';
  overlay.addEventListener("click", function(e){ if(e.target === overlay) closeRollHistoryModal(); });
  overlay.addEventListener("change", function(e){
    if(e.target && e.target.id === "rollHistoryChar"){ rollHistoryView.charName = e.target.value; reloadRollHistoryView(); }
    if(e.target && e.target.id === "rollHistoryRequested"){ rollHistoryView.onlyRequested = !!e.target.checked; reloadRollHistoryView(); }
  });
  document.body.appendChild(overlay);
  return overlay;
}

function renderRollHistoryModal(){
  var modal = document.getElementById("rollHistoryModal");
  if(!modal) return;
  var v = rollHistoryView;
  var names = [];
  (state.characters || []).forEach(function(c){ if(c && c.name && names.indexOf(c.name) < 0) names.push(c.name); });
  v.items.forEach(function(r){ if(r.charName && names.indexOf(r.charName) < 0) names.push(r.charName); });
  if(v.charName && names.indexOf(v.charName) < 0) names.push(v.charName);
  var html = '<h2>📜 Historial de tiradas<button type="button" data-action="close-roll-history" aria-label="Cerrar">&times;</button></h2>';
  if(rollHistoryTableMissing){
    html += '<p class="game-clock-note">El historial de la partida aún no está activado; se muestran las tiradas de este dispositivo.</p>';
  } else {
    html += '<div class="roll-history-filters">' +
        '<select id="rollHistoryChar" class="game-clock-input" aria-label="Filtrar por personaje"><option value="">Todos los personajes</option>' +
          names.map(function(n){ return '<option value="' + esc(n) + '"' + (n === v.charName ? " selected" : "") + '>' + esc(n) + '</option>'; }).join("") +
        '</select>' +
        '<label class="roll-history-check"><input type="checkbox" id="rollHistoryRequested"' + (v.onlyRequested ? " checked" : "") + '> Solo las pedidas por el máster</label>' +
      '</div>';
  }
  html += '<div class="roll-log roll-history-list">';
  if(v.loading && !v.items.length) html += '<div class="roll-empty">Cargando…</div>';
  else if(!v.items.length) html += '<div class="roll-empty">Sin tiradas.</div>';
  else html += v.items.map(rollHistoryItemHtml).join("");
  html += '</div>';
  if(v.more) html += '<button type="button" class="game-clock-btn roll-history-more" data-action="roll-history-more"' + (v.loading ? " disabled" : "") + '>Ver más</button>';
  modal.innerHTML = html;
}

async function loadRollHistoryPage(){
  var v = rollHistoryView;
  if(v.loading) return;
  v.loading = true;
  renderRollHistoryModal();
  try {
    var items = await fetchDiceRolls({ offset: v.offset, limit: ROLL_HISTORY_PAGE, charName: v.charName, onlyRequested: v.onlyRequested });
    items = items.filter(function(x){ return !v.items.some(function(y){ return y.id === x.id; }); });
    v.items = v.items.concat(items);
    v.offset += ROLL_HISTORY_PAGE;
    v.more = items.length === ROLL_HISTORY_PAGE;
  } catch(e){
    if(rollHistoryTableMissing) v.items = ((state && state.rollLog) || []).slice();
    else showToast("⚠️ No se pudo leer el historial de tiradas", "error");
    v.more = false;
  }
  v.loading = false;
  renderRollHistoryModal();
}

function reloadRollHistoryView(){
  rollHistoryView.items = [];
  rollHistoryView.offset = 0;
  rollHistoryView.more = false;
  if(rollHistoryTableMissing || !supabaseClient || !currentUser){
    rollHistoryView.items = ((state && state.rollLog) || []).slice();
    renderRollHistoryModal();
    return;
  }
  loadRollHistoryPage();
}

function openRollHistoryModal(){
  var overlay = ensureRollHistoryModal();
  var dm = document.getElementById("diceModalOverlay");
  if(dm) dm.classList.add("hidden");
  overlay.classList.remove("hidden");
  reloadRollHistoryView();
}

function closeRollHistoryModal(){
  var overlay = document.getElementById("rollHistoryOverlay");
  if(overlay) overlay.classList.add("hidden");
}

async function deleteRollFromHistory(id){
  if(!id || !isGM() || !supabaseClient) return;
  if(!confirm("¿Borrar esta tirada del historial?")) return;
  var res = await supabaseClient.from("dice_rolls").delete().eq("id", id);
  if(res.error){ showToast("⚠️ No se pudo borrar la tirada", "error"); return; }
  rollHistoryView.items = rollHistoryView.items.filter(function(x){ return x.id !== id; });
  if(rollHistoryCache) rollHistoryCache = rollHistoryCache.filter(function(x){ return x.id !== id; });
  renderRollHistoryModal();
}

document.addEventListener("click", function(e){
  var btn = e.target.closest ? e.target.closest("[data-action]") : null;
  if(!btn) return;
  var action = btn.getAttribute("data-action");
  if(action === "open-roll-history"){ openRollHistoryModal(); return; }
  if(action === "close-roll-history"){ closeRollHistoryModal(); return; }
  if(action === "roll-history-more"){ loadRollHistoryPage(); return; }
  if(action === "roll-history-delete"){ deleteRollFromHistory(btn.getAttribute("data-roll-id")); }
});

document.addEventListener("keydown", function(e){
  if(e.key === "Escape") closeRollHistoryModal();
});
