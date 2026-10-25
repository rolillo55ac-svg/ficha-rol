// El máster pide tiradas (tabla roll_requests, migración 036). Las respuestas son tiradas de dice_rolls con su request_id.
// Aviso al momento por broadcast 'roll_request'; al entrar (o volver a la web) se leen de la base.
// Si la tabla aún no existe, la pestaña "Pedir tirada" no aparece y no se avisa a nadie.
var rollRequestsTableMissing = false;
var rollRequestsLoaded = false;
var rollRequestsList = [];        // máster: las últimas; jugador: las abiertas dirigidas a sus fichas
var rollRequestAnswers = {};      // requestId -> { charId: { total, success, charName } }
var rollRequestSecretDc = {};     // requestId -> CD oculta (solo el máster)
var rollRequestsShown = {};       // peticiones que ya se le abrieron solas a este jugador en esta sesión
var rollRequestDraft = { key: "skill:advertir", dc: "", dcVisible: true, mode: "normal", note: "", targets: null };

function isRollRequestTableMissingError(err){
  if(!err) return false;
  var msg = String(err.message || "");
  return err.code === "42P01" || err.code === "PGRST205" || /roll_request/.test(msg) && /(does not exist|schema cache|not find)/i.test(msg);
}

function rollRequestsAvailable(){
  return rollRequestsLoaded && !rollRequestsTableMissing && !!supabaseClient && !!currentUser;
}

// Fichas de jugadores a las que se puede pedir tirada (con dueño y que no sean del propio máster)
function rollRequestTargetChars(){
  return (state.characters || []).filter(function(c){
    return c && c.db_id && c.owner_id && !c.isNPC && (!currentUser || c.owner_id !== currentUser.id);
  });
}

function myRollRequestChars(){
  if(!currentUser) return [];
  return (state.characters || []).filter(function(c){ return c && c.db_id && c.owner_id === currentUser.id; });
}

function rollRequestLabelFor(type, key){
  if(type === "attr") return "Prueba de " + (ATTR_LABELS[key] || key);
  var sdef = SKILL_DEFS.find(function(s){ return s.id === key; });
  return sdef ? sdef.name : key;
}

var rollRequestsRetries = 0;

async function loadRollRequests(){
  if(rollRequestsTableMissing || !supabaseClient || !currentUser) return;
  // El jugador necesita sus fichas cargadas para saber qué le toca; si aún no están, se reintenta
  if(!isGM() && !myRollRequestChars().length && rollRequestsRetries < 5){
    rollRequestsRetries++;
    setTimeout(loadRollRequests, 2500);
  }
  try {
    var q = supabaseClient.from("roll_requests").select("*").order("created_at", { ascending: false });
    q = isGM() ? q.limit(15) : q.eq("status", "open").limit(30);
    var res = await q;
    if(res.error){
      if(isRollRequestTableMissingError(res.error)){ rollRequestsTableMissing = true; return; }
      throw res.error;
    }
    rollRequestsLoaded = true;
    rollRequestsList = res.data || [];
    var ids = rollRequestsList.map(function(r){ return r.id; });
    rollRequestAnswers = {};
    if(ids.length){
      var ans = await supabaseClient.from("dice_rolls").select("request_id,character_id,char_name,total,success").in("request_id", ids);
      (ans.data || []).forEach(addRollRequestAnswerRow);
      if(isGM()){
        var withSecret = rollRequestsList.filter(function(r){ return r.has_secret_dc; }).map(function(r){ return r.id; });
        if(withSecret.length){
          var sec = await supabaseClient.from("roll_request_secrets").select("request_id,dc").in("request_id", withSecret);
          (sec.data || []).forEach(function(s){ rollRequestSecretDc[s.request_id] = s.dc; });
        }
      }
    }
    refreshRollRequestViews();
    if(!isGM()) autoOpenPendingRollRequest();
  } catch(e){
    console.warn("No se pudieron leer las tiradas pedidas:", e);
  }
}

function addRollRequestAnswerRow(r){
  if(!r || !r.request_id || !r.character_id) return;
  rollRequestAnswers[r.request_id] = rollRequestAnswers[r.request_id] || {};
  rollRequestAnswers[r.request_id][r.character_id] = { total: r.total, success: r.success, charName: r.char_name };
}

// Tirada propia o ajena que responde a una petición (desde dice.js)
function noteRollRequestAnswer(rollObj){
  if(!rollObj || !rollObj.requestId || !rollObj.charId) return;
  addRollRequestAnswerRow({ request_id: rollObj.requestId, character_id: rollObj.charId, char_name: rollObj.charName, total: rollObj.total, success: (typeof rollObj.success === "boolean") ? rollObj.success : null });
  refreshRollRequestViews();
}

function pendingRollRequestsForMe(){
  var mine = myRollRequestChars();
  var out = [];
  rollRequestsList.forEach(function(rq){
    if(rq.status !== "open") return;
    mine.forEach(function(c){
      if((rq.target_char_ids || []).indexOf(c.db_id) < 0) return;
      if(rollRequestAnswers[rq.id] && rollRequestAnswers[rq.id][c.db_id]) return;
      out.push({ req: rq, char: c });
    });
  });
  return out;
}

// Abre la ventana de tirar ya preparada con la ficha del jugador
function answerRollRequest(reqId, charId){
  var rq = rollRequestsList.find(function(r){ return r.id === reqId; });
  var c = (state.characters || []).find(function(x){ return x.db_id === charId; });
  if(!rq || !c) return;
  rollRequestsShown[rq.id + ":" + charId] = true;
  var extra = {
    requestId: rq.id,
    requestDc: (typeof rq.dc === "number") ? rq.dc : null,
    charId: c.db_id,
    mode: rq.mode || "normal"
  };
  var sub = "Te la pide el máster" + (typeof rq.dc === "number" ? " · CD " + rq.dc : "") + (rq.note ? " · " + rq.note : "");
  extra.subtitle = sub;
  if(rq.roll_type === "attr") openBg3AttrRoll(c, rq.roll_key, extra);
  else {
    var sdef = SKILL_DEFS.find(function(s){ return s.id === rq.roll_key; });
    if(sdef) openBg3SkillRoll(c, sdef, extra);
  }
}

function autoOpenPendingRollRequest(){
  if(typeof bg3RollState !== "undefined" && bg3RollState.active) return;
  var p = pendingRollRequestsForMe().find(function(x){ return !rollRequestsShown[x.req.id + ":" + x.char.db_id]; });
  if(p) answerRollRequest(p.req.id, p.char.db_id);
}

async function createRollRequest(){
  if(!isGM() || !rollRequestsAvailable()) return;
  var d = rollRequestDraft;
  var parts = String(d.key || "").split(":");
  var type = parts[0] === "attr" ? "attr" : "skill";
  var key = parts[1] || "";
  var targets = (d.targets || rollRequestTargetChars().map(function(c){ return c.db_id; })).slice();
  if(!key){ showToast("Elige qué tirada pides", "error"); return; }
  if(!targets.length){ showToast("Marca al menos un jugador", "error"); return; }
  var dcNum = parseInt(d.dc, 10);
  var hasDc = !isNaN(dcNum);
  var row = {
    id: newRollUuid(),
    created_by: currentUser.id,
    roll_type: type,
    roll_key: key,
    label: rollRequestLabelFor(type, key),
    dc: (hasDc && d.dcVisible) ? dcNum : null,
    has_secret_dc: hasDc && !d.dcVisible,
    mode: d.mode || "normal",
    note: String(d.note || "").trim().slice(0, 120) || null,
    target_char_ids: targets,
    status: "open"
  };
  var res = await supabaseClient.from("roll_requests").insert(row);
  if(res.error){ showToast("⚠️ No se pudo pedir la tirada", "error"); console.warn(res.error); return; }
  if(row.has_secret_dc){
    var sres = await supabaseClient.from("roll_request_secrets").insert({ request_id: row.id, dc: dcNum });
    if(!sres.error) rollRequestSecretDc[row.id] = dcNum;
  }
  row.created_at = new Date().toISOString();
  rollRequestsList.unshift(row);
  rollRequestDraft.note = "";
  sendRollRequestBroadcast(row.id);
  showToast("📣 Tirada pedida: " + row.label, "success");
  refreshRollRequestViews();
}

async function cancelRollRequest(id){
  if(!isGM() || !id) return;
  if(!(await confirmarAccion({ titulo: "¿Cancelar esta petición de tirada?", boton: "Cancelar petición", peligro: true }))) return;
  var res = await supabaseClient.from("roll_requests").update({ status: "cancelled" }).eq("id", id);
  if(res.error){ showToast("⚠️ No se pudo cancelar", "error"); return; }
  var rq = rollRequestsList.find(function(r){ return r.id === id; });
  if(rq) rq.status = "cancelled";
  sendRollRequestBroadcast(id);
  refreshRollRequestViews();
}

function sendRollRequestBroadcast(id){
  if(typeof realtimeChannel !== "undefined" && realtimeChannel && typeof realtimeChannel.send === "function"){
    try { realtimeChannel.send({ type: "broadcast", event: "roll_request", payload: { id: id } }); } catch(e){}
  }
}

// Llega por tiempo real: se vuelve a leer de la base (allí manda la RLS)
function handleRemoteRollRequest(){
  loadRollRequests();
}

function refreshRollRequestViews(){
  renderRollRequestNotice();
  if(typeof diceMenuTab !== "undefined" && diceMenuTab === "pedir" && document.getElementById("tiradasPage")) renderRollRequestTab();
}

/* --- Interfaz --- */

// Aviso fijo del jugador mientras tenga tiradas pendientes
function renderRollRequestNotice(){
  var el = document.getElementById("rollRequestNotice");
  var pend = isGM() ? [] : pendingRollRequestsForMe();
  if(!pend.length){ if(el) el.remove(); return; }
  if(!el){
    el = document.createElement("button");
    el.type = "button";
    el.id = "rollRequestNotice";
    el.className = "roll-request-notice";
    el.setAttribute("data-action", "roll-request-answer");
    document.body.appendChild(el);
  }
  var first = pend[0];
  el.setAttribute("data-req-id", first.req.id);
  el.setAttribute("data-char-id", first.char.db_id);
  el.textContent = "📣 El máster te pide: " + first.req.label + (pend.length > 1 ? " (+" + (pend.length - 1) + ")" : "");
}

function rollRequestStatusHtml(rq){
  var answers = rollRequestAnswers[rq.id] || {};
  var dc = (typeof rq.dc === "number") ? rq.dc : rollRequestSecretDc[rq.id];
  var rows = (rq.target_char_ids || []).map(function(cid){
    var c = (state.characters || []).find(function(x){ return x.db_id === cid; });
    var a = answers[cid];
    var name = (c && c.name) || (a && a.charName) || "Ficha";
    var res = "⏳ Pendiente";
    if(a){
      var ok = (typeof dc === "number") ? (a.total >= dc) : null;
      res = "✓ " + a.total + (ok === true ? " ✅" : (ok === false ? " ❌" : ""));
    } else if(rq.status !== "open") res = "—";
    return '<div class="roll-request-row"><span>' + esc(name) + '</span><b>' + esc(res) + '</b></div>';
  }).join("");
  var meta = [];
  if(typeof dc === "number") meta.push("CD " + dc + (rq.dc === null || rq.dc === undefined ? " (oculta)" : ""));
  var modeTxt = (typeof rollModeText === "function") ? rollModeText(rq.mode) : "";
  if(modeTxt) meta.push(modeTxt);
  if(rq.note) meta.push(rq.note);
  if(rq.status !== "open") meta.push("Cancelada");
  return '<div class="roll-request-card' + (rq.status !== "open" ? " is-closed" : "") + '">' +
      '<div class="roll-request-head"><b>' + esc(rq.label) + '</b>' +
        (rq.status === "open" ? '<button type="button" class="btn-compact roll-request-cancel" data-action="roll-request-cancel" data-req-id="' + esc(rq.id) + '">Cancelar</button>' : '') +
      '</div>' +
      (meta.length ? '<div class="rl-formula">' + esc(meta.join(" · ")) + '</div>' : '') +
      rows +
    '</div>';
}

function renderRollRequestTab(){
  var body = document.getElementById("diceMenuBody");
  if(!body) return;
  var d = rollRequestDraft;
  var chars = rollRequestTargetChars();
  var targets = d.targets || chars.map(function(c){ return c.db_id; });
  var opts = '<optgroup label="Características">' + ATTRS.map(function(a){
      var v = "attr:" + a;
      return '<option value="' + v + '"' + (d.key === v ? " selected" : "") + '>' + esc(ATTR_LABELS[a]) + '</option>';
    }).join("") + '</optgroup><optgroup label="Habilidades">' + SKILL_DEFS.map(function(s){
      var v = "skill:" + s.id;
      return '<option value="' + v + '"' + (d.key === v ? " selected" : "") + '>' + esc(s.name) + '</option>';
    }).join("") + '</optgroup>';
  var html = '<div class="roll-request-form">' +
      '<div class="field"><label for="rollReqKey">Tirada</label>' +
      '<select id="rollReqKey" class="game-clock-input">' + opts + '</select></div>' +
      '<div class="roll-request-dc">' +
        '<div class="field"><label for="rollReqDc">CD · dificultad (opcional)</label>' +
          '<input type="number" id="rollReqDc" class="game-clock-input" inputmode="numeric" value="' + esc(d.dc) + '">' +
          '<span class="roll-request-hint">Número que hay que igualar o superar</span></div>' +
        '<label class="roll-history-check"><input type="checkbox" id="rollReqDcVisible" class="k-check"' + (d.dcVisible ? " checked" : "") + '> CD visible</label>' +
      '</div>' +
      '<div class="dice-mode-pills">' +
        '<button type="button" class="dmode-pill ' + (d.mode === "normal" ? "active" : "") + '" data-action="roll-request-mode" data-mode="normal">⚔️ Normal</button>' +
        '<button type="button" class="dmode-pill ' + (d.mode === "adv" ? "active" : "") + '" data-action="roll-request-mode" data-mode="adv">🍀 Ventaja</button>' +
        '<button type="button" class="dmode-pill ' + (d.mode === "disadv" ? "active" : "") + '" data-action="roll-request-mode" data-mode="disadv">💀 Desventaja</button>' +
      '</div>' +
      '<div class="field"><label for="rollReqNote">Texto corto (opcional)</label>' +
      '<input type="text" id="rollReqNote" class="game-clock-input" maxlength="120" value="' + esc(d.note) + '"></div>' +
      '<div class="dice-ctrl-label"><span>¿A quién?</span><button type="button" class="btn-compact roll-request-all" data-action="roll-request-all">Todos</button></div>' +
      (chars.length ? chars.map(function(c){
        return '<label class="roll-history-check"><input type="checkbox" class="roll-req-target k-check" value="' + esc(c.db_id) + '"' + (targets.indexOf(c.db_id) >= 0 ? " checked" : "") + '> ' + esc(c.name || "Ficha") + '</label>';
      }).join("") : '<div class="roll-empty">No hay fichas de jugadores.</div>') +
      '<button type="button" class="btn-solid-gold btn-roll-cup" data-action="roll-request-send">📣 Pedir tirada</button>' +
    '</div>';
  var list = rollRequestsList.slice(0, 10);
  html += '<div class="cup-tray-label">Peticiones</div>';
  html += list.length ? list.map(rollRequestStatusHtml).join("") : '<div class="roll-empty">Aún no has pedido tiradas.</div>';
  body.innerHTML = html;
}

function readRollRequestForm(){
  var k = document.getElementById("rollReqKey"); if(k) rollRequestDraft.key = k.value;
  var dc = document.getElementById("rollReqDc"); if(dc) rollRequestDraft.dc = dc.value;
  var vis = document.getElementById("rollReqDcVisible"); if(vis) rollRequestDraft.dcVisible = !!vis.checked;
  var note = document.getElementById("rollReqNote"); if(note) rollRequestDraft.note = note.value;
  var boxes = document.querySelectorAll(".roll-req-target");
  if(boxes.length){
    var t = [];
    boxes.forEach(function(b){ if(b.checked) t.push(b.value); });
    rollRequestDraft.targets = t;
  }
}

document.addEventListener("input", function(e){
  if(e.target && e.target.closest && e.target.closest(".roll-request-form")) readRollRequestForm();
});
document.addEventListener("change", function(e){
  if(e.target && e.target.closest && e.target.closest(".roll-request-form")) readRollRequestForm();
});

document.addEventListener("click", function(e){
  var btn = e.target.closest ? e.target.closest("[data-action]") : null;
  if(!btn) return;
  var action = btn.getAttribute("data-action");
  if(action === "roll-request-answer"){ answerRollRequest(btn.getAttribute("data-req-id"), btn.getAttribute("data-char-id")); return; }
  if(action === "roll-request-send"){ readRollRequestForm(); createRollRequest(); return; }
  if(action === "roll-request-cancel"){ cancelRollRequest(btn.getAttribute("data-req-id")); return; }
  if(action === "roll-request-mode"){ readRollRequestForm(); rollRequestDraft.mode = btn.getAttribute("data-mode") || "normal"; renderRollRequestTab(); return; }
  if(action === "roll-request-all"){
    readRollRequestForm();
    var all = rollRequestTargetChars().map(function(c){ return c.db_id; });
    rollRequestDraft.targets = (rollRequestDraft.targets && rollRequestDraft.targets.length === all.length) ? [] : all;
    renderRollRequestTab();
  }
});
