// Reloj de la partida: "Día N, HH:00". Lo ven todos; solo el máster lo cambia (tabla game_clock + RPC).
var GAME_CLOCK_CAMPAIGN_ID = "c0000000-0000-0000-0000-000000000001";
var gameClockTotal = null; // horas de juego desde Día 1, 00:00 (null = sin leer de la nube)
var gameClockChannel = null;
var gameClockBusy = false;
// Horas de juego que tarda un destilado según la rareza; el máster las cambia (game_clock.distill_hours)
var DISTILL_HOURS_DEFAULT = { "Común": 2, "Rara": 4, "Muy rara": 8, "Legendaria": 24 };
var gameDistillHours = null;

function gameClockParts(total){
  var t = Math.max(0, Math.floor(Number(total) || 0));
  return { day: Math.floor(t / 24) + 1, hour: t % 24 };
}

function formatGameClock(total){
  var p = gameClockParts(total);
  return "Día " + p.day + ", " + (p.hour < 10 ? "0" : "") + p.hour + ":00";
}

// Horas de juego actuales (para destilados y otros temporizadores); null si no se conoce
function getGameClockHours(){
  return gameClockTotal;
}

function getDistillHours(rarity){
  var src = gameDistillHours || {};
  var h = Number(src[rarity]);
  if(!isFinite(h) || h < 0) h = DISTILL_HOURS_DEFAULT[rarity];
  return isFinite(h) ? Math.floor(h) : 2;
}

function setGameDistillHours(obj){
  gameDistillHours = (obj && typeof obj === "object") ? obj : null;
  try { document.dispatchEvent(new CustomEvent("gameclockchange", { detail: { total: gameClockTotal } })); } catch(e){}
}

// Solo el máster: guarda las horas por rareza en la fila del reloj
async function saveDistillHours(obj){
  if(!supabaseClient || !currentUser || !isGM()) return false;
  try {
    var res = await supabaseClient.from("game_clock").update({ distill_hours: obj }).eq("campaign_id", GAME_CLOCK_CAMPAIGN_ID).select("distill_hours");
    if(res.error) throw res.error;
    if(!res.data || !res.data.length) throw new Error("no se guardó");
    setGameDistillHours(res.data[0].distill_hours);
    return true;
  } catch(e){
    console.error("No se pudieron guardar las horas de destilado:", e);
    showToast("⚠️ No se pudieron guardar las horas: " + ((e && e.message) || "error"), "error");
    return false;
  }
}

function gameClockPillHtml(){
  if(gameClockTotal === null || !currentUser) return "";
  return '<button type="button" class="game-clock-pill" id="gameClockPill" data-action="open-game-clock" title="Reloj de la partida" aria-label="Reloj de la partida: ' + formatGameClock(gameClockTotal) + '">🕰️ <span>' + formatGameClock(gameClockTotal) + '</span></button>';
}

function setGameClockTotal(total){
  var n = Number(total);
  if(!isFinite(n)) return;
  var changed = gameClockTotal !== n;
  gameClockTotal = n;
  if(!changed) return;
  var pill = document.getElementById("gameClockPill");
  if(pill){
    pill.querySelector("span").textContent = formatGameClock(n);
    pill.setAttribute("aria-label", "Reloj de la partida: " + formatGameClock(n));
  } else if(typeof renderTopbar === "function"){
    renderTopbar();
  }
  var overlay = document.getElementById("clockModalOverlay");
  if(overlay && !overlay.classList.contains("hidden")) renderGameClockModal();
  try { document.dispatchEvent(new CustomEvent("gameclockchange", { detail: { total: n } })); } catch(e){}
}

async function loadGameClock(){
  if(!supabaseClient || !currentUser) return;
  try {
    var res = await supabaseClient.from("game_clock").select("total_hours, distill_hours").eq("campaign_id", GAME_CLOCK_CAMPAIGN_ID).maybeSingle();
    if(res.error){ console.warn("No se pudo leer el reloj de la partida:", res.error.message); return; }
    if(res.data){
      gameDistillHours = res.data.distill_hours || null;
      setGameClockTotal(res.data.total_hours);
    }
  } catch(e){
    console.warn("No se pudo leer el reloj de la partida:", e);
    return;
  }
  subscribeGameClock();
}

function subscribeGameClock(){
  if(!supabaseClient || gameClockChannel) return;
  try {
    gameClockChannel = supabaseClient.channel("realtime_game_clock", { config: { private: true } })
      .on("postgres_changes", { event: "*", schema: "public", table: "game_clock", filter: "campaign_id=eq." + GAME_CLOCK_CAMPAIGN_ID }, function(payload){
        if(!payload || !payload.new) return;
        if(payload.new.distill_hours !== undefined && JSON.stringify(payload.new.distill_hours) !== JSON.stringify(gameDistillHours)) setGameDistillHours(payload.new.distill_hours);
        if(payload.new.total_hours !== undefined) setGameClockTotal(payload.new.total_hours);
      })
      .subscribe();
  } catch(e){
    console.warn("Error suscribiendo al reloj de la partida:", e);
  }
}

function ensureGameClockModal(){
  var overlay = document.getElementById("clockModalOverlay");
  if(overlay) return overlay;
  overlay = document.createElement("div");
  overlay.className = "modal-overlay hidden";
  overlay.id = "clockModalOverlay";
  overlay.innerHTML = '<div class="modal game-clock-modal" id="clockModal"></div>';
  overlay.addEventListener("click", function(e){ if(e.target === overlay) overlay.classList.add("hidden"); });
  document.body.appendChild(overlay);
  return overlay;
}

function renderGameClockModal(){
  var modal = document.getElementById("clockModal");
  if(!modal) return;
  var p = gameClockParts(gameClockTotal || 0);
  var html = '<h2>🕰️ Reloj de la partida<button type="button" data-action="close-game-clock" aria-label="Cerrar">&times;</button></h2>' +
    '<div class="game-clock-now" id="gameClockNow">' + (gameClockTotal === null ? "Sin hora" : formatGameClock(gameClockTotal)) + '</div>';
  if(isGM()){
    var hourOpts = "";
    for(var h = 0; h < 24; h++) hourOpts += '<option value="' + h + '"' + (h === p.hour ? " selected" : "") + '>' + (h < 10 ? "0" : "") + h + ':00</option>';
    html += '<div class="game-clock-steps">' +
        '<button type="button" class="game-clock-btn" data-action="clock-add" data-hours="-1"' + (gameClockBusy ? " disabled" : "") + '>−1 h</button>' +
        '<button type="button" class="game-clock-btn" data-action="clock-add" data-hours="1"' + (gameClockBusy ? " disabled" : "") + '>+1 h</button>' +
        '<button type="button" class="game-clock-btn" data-action="clock-add" data-hours="4"' + (gameClockBusy ? " disabled" : "") + '>+4 h</button>' +
        '<button type="button" class="game-clock-btn" data-action="clock-add" data-hours="24"' + (gameClockBusy ? " disabled" : "") + '>+1 día</button>' +
      '</div>' +
      '<div class="game-clock-set">' +
        '<label for="gameClockDay">Día</label>' +
        '<input type="number" id="gameClockDay" class="game-clock-input" min="1" max="100000" inputmode="numeric" value="' + p.day + '">' +
        '<label for="gameClockHour">Hora</label>' +
        '<select id="gameClockHour" class="game-clock-input">' + hourOpts + '</select>' +
        '<button type="button" class="game-clock-btn primary" data-action="clock-set"' + (gameClockBusy ? " disabled" : "") + '>Poner</button>' +
      '</div>' +
      '<button type="button" class="game-clock-btn game-clock-rest" data-action="clock-long-rest">🌙 Descanso largo…</button>';
  } else {
    html += '<p class="game-clock-note">Solo el máster puede cambiar la hora.</p>';
  }
  modal.innerHTML = html;
}

function openGameClockModal(){
  var overlay = ensureGameClockModal();
  renderGameClockModal();
  overlay.classList.remove("hidden");
}

function closeGameClockModal(){
  var overlay = document.getElementById("clockModalOverlay");
  if(overlay) overlay.classList.add("hidden");
}

async function changeGameClock(rpcName, args){
  if(!supabaseClient || !currentUser || !isGM() || gameClockBusy) return;
  gameClockBusy = true;
  renderGameClockModal();
  try {
    var res = await supabaseClient.rpc(rpcName, Object.assign({ p_campaign_id: GAME_CLOCK_CAMPAIGN_ID }, args));
    if(res.error) throw res.error;
    gameClockBusy = false;
    setGameClockTotal(res.data);
    showToast("🕰️ " + formatGameClock(res.data), "success");
  } catch(e){
    console.error("No se pudo cambiar el reloj:", e);
    showToast("⚠️ No se pudo cambiar el reloj: " + ((e && e.message) || "error"), "error");
  }
  gameClockBusy = false;
  renderGameClockModal();
}

document.addEventListener("click", function(e){
  var btn = e.target.closest ? e.target.closest("[data-action]") : null;
  if(!btn) return;
  var action = btn.getAttribute("data-action");
  if(action === "open-game-clock"){ openGameClockModal(); return; }
  if(action === "close-game-clock"){ closeGameClockModal(); return; }
  if(action === "clock-long-rest"){ closeGameClockModal(); openLongRestModal(); return; }
  if(action === "clock-add"){
    changeGameClock("game_clock_add", { p_hours: parseInt(btn.getAttribute("data-hours"), 10) || 0 });
    return;
  }
  if(action === "clock-set"){
    var day = parseInt((document.getElementById("gameClockDay") || {}).value, 10);
    var hour = parseInt((document.getElementById("gameClockHour") || {}).value, 10);
    if(!(day >= 1) || !(hour >= 0 && hour <= 23)){ showToast("Día u hora no válidos", "error"); return; }
    changeGameClock("game_clock_set", { p_total: (day - 1) * 24 + hour });
  }
});

document.addEventListener("keydown", function(e){
  if(e.key === "Escape") closeGameClockModal();
});
