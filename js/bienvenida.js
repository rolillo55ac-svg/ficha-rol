// Bienvenida: tutorial corto que sale una sola vez por cuenta (se apunta en este móvil y en la cuenta).
var BIENVENIDA_PASOS = [
  { tit: function(n, p){ return "Bienvenido a " + p + (n ? ", " + n : ""); },
    txt: "Esta web es tu ficha de rol. Lo que cambies lo ven todos en directo.", ico: "pergamino" },
  { tit: function(){ return "Tu personaje"; },
    txt: "Arriba tienes siempre la vida, el escudo y el maná. Tócalos para ajustarlos.", ico: "vida", marco: ["Vida", "Escudo", "Maná"] },
  { tit: function(){ return "La barra de abajo"; },
    txt: "Cada pestaña es una parte de tu ficha: Ficha, Tiradas, Inventario, Combate… Desliza la barra para ver más.",
    icos: ["pergamino", "d20", "mochila", "puno"] },
  { tit: function(){ return "El dado"; },
    txt: "El botón redondo de abajo a la derecha tira dados libres. Las tiradas les llegan a todos.", ico: "d10", dado: true },
  { tit: function(){ return "Ayuda"; },
    txt: "En Ajustes (el engranaje) está «Cómo funciona», con las reglas explicadas. Y en el buzón puedes enviar sugerencias o fallos.", ico: "buzon" }
];

var bienvenidaPaso = 0;

function bienvenidaClave(){
  return "bienvenida-vista-" + (currentUser && currentUser.id ? currentUser.id : "");
}

function bienvenidaVista(){
  try { return localStorage.getItem(bienvenidaClave()) === "1"; } catch(e){ return true; }
}

function bienvenidaMarcar(){
  try { localStorage.setItem(bienvenidaClave(), "1"); } catch(e){}
  try { if(supabaseClient) supabaseClient.rpc("marcar_bienvenida_vista").then(function(){}, function(){}); } catch(e){}
}

function bienvenidaIcono(n){
  var d = typeof ICONOS !== "undefined" ? ICONOS[n] : null;
  if(!d) return "";
  return '<img class="bienv-ico" src="images/iconos/' + d.img + '.webp" alt="" width="56" height="56" decoding="async">';
}

function bienvenidaHtml(){
  var p = BIENVENIDA_PASOS[bienvenidaPaso];
  var ultimo = bienvenidaPaso === BIENVENIDA_PASOS.length - 1;
  var c = null;
  try { c = typeof activeChar === "function" ? activeChar() : null; } catch(e){}
  var nombre = (c && c.name) || (currentUser && currentUser.email ? currentUser.email.split("@")[0] : "");
  var html = '<div class="bienv-card"><i class="bg3-corner tl"></i><i class="bg3-corner tr"></i><i class="bg3-corner bl"></i><i class="bg3-corner br"></i>' +
    '<button type="button" class="bienv-saltar" data-bienv="saltar">Saltar</button>' +
    '<div class="bienv-cuerpo" id="bienvCuerpo">';
  if(p.icos) html += '<div class="bienv-fila">' + p.icos.map(bienvenidaIcono).join("") + '</div>';
  else html += bienvenidaIcono(p.ico);
  html += '<h2 class="bienv-tit">' + esc(p.tit(nombre, PARTIDA_ACTUAL.nombre)) + '</h2>';
  if(p.marco) html += '<div class="bienv-marco">' + p.marco.map(function(m){ return '<span>' + esc(m) + '</span>'; }).join("") + '</div>';
  html += '<p class="bienv-txt">' + esc(p.txt) + '</p>';
  if(ultimo && typeof isGM === "function" && isGM()){
    html += '<p class="bienv-txt bienv-gm">Como máster, tus herramientas están en el reloj y en el Panel secreto.</p>';
  }
  html += '</div><div class="bienv-pie"><div class="bienv-puntos" aria-hidden="true">' +
    BIENVENIDA_PASOS.map(function(_, i){ return '<i class="' + (i === bienvenidaPaso ? 'on' : '') + '"></i>'; }).join("") +
    '</div><button type="button" class="bienv-sig" data-bienv="' + (ultimo ? 'fin' : 'sig') + '">' + (ultimo ? 'Empezar' : 'Siguiente') + '</button></div></div>';
  return html;
}

function bienvenidaPintar(){
  var ov = document.getElementById("bienvenidaOverlay");
  if(ov) ov.innerHTML = bienvenidaHtml();
}

function bienvenidaAbrir(){
  if(document.getElementById("bienvenidaOverlay")) return;
  bienvenidaPaso = 0;
  var ov = document.createElement("div");
  ov.id = "bienvenidaOverlay";
  ov.className = "bienv-overlay";
  ov.setAttribute("role", "dialog");
  ov.setAttribute("aria-modal", "true");
  ov.setAttribute("aria-label", "Bienvenida");
  document.body.appendChild(ov);
  bienvenidaPintar();
}

function bienvenidaCerrar(){
  bienvenidaMarcar();
  var ov = document.getElementById("bienvenidaOverlay");
  if(ov) ov.remove();
}

function bienvenidaMover(d){
  var n = bienvenidaPaso + d;
  if(n < 0 || n >= BIENVENIDA_PASOS.length) return;
  bienvenidaPaso = n;
  bienvenidaPintar();
}

// La primera vez que entra una cuenta (no con el mantenimiento activo)
function bienvenidaInicio(){
  setTimeout(function(){
    if(!currentUser || bienvenidaVista()) return;
    var gate = document.getElementById("mantenimientoGate");
    if(gate && !gate.hidden) return;
    // Vista ya desde otro móvil: se apunta aquí y no sale
    if(!supabaseClient){ bienvenidaAbrir(); return; }
    var uid = currentUser.id;
    supabaseClient.from("profiles").select("bienvenida_vista").eq("id", uid).maybeSingle().then(function(r){
      if(!currentUser || currentUser.id !== uid) return;
      if(r && !r.error && r.data && r.data.bienvenida_vista){
        try { localStorage.setItem(bienvenidaClave(), "1"); } catch(e){}
        return;
      }
      bienvenidaAbrir();
    }, function(){ bienvenidaAbrir(); });
  }, 1500);
}

if(typeof document !== "undefined"){
  document.addEventListener("click", function(e){
    var t = e.target && e.target.closest ? e.target.closest("[data-bienv]") : null;
    if(!t) return;
    var a = t.getAttribute("data-bienv");
    if(a === "sig") bienvenidaMover(1);
    else if(a === "saltar" || a === "fin") bienvenidaCerrar();
    else if(a === "ver"){
      if(typeof closeModals === "function") closeModals();
      bienvenidaAbrir();
    }
  });
  var bienvX = null;
  document.addEventListener("touchstart", function(e){
    bienvX = e.target.closest && e.target.closest("#bienvenidaOverlay") && e.touches[0] ? e.touches[0].clientX : null;
  }, { passive: true });
  document.addEventListener("touchend", function(e){
    if(bienvX === null || !e.changedTouches[0]) return;
    var dx = e.changedTouches[0].clientX - bienvX;
    bienvX = null;
    if(Math.abs(dx) > 50) bienvenidaMover(dx < 0 ? 1 : -1);
  }, { passive: true });
}
