// Cuentas: cambiar mi contraseña (todos) y Ajustes › Admin › Jugadores (solo el admin).
// Listar y cambiar rol van por RPC (admin_listar_cuentas, admin_cambiar_rol); crear, contraseñas,
// desactivar y cerrar sesiones por la función del servidor admin-usuarios. La base y la función
// comprueban que es el admin: aquí solo se pinta.

var CUENTA_PASS_MIN = 10;
var CUENTA_PALABRAS = ["lobo","vela","cobre","roble","niebla","faro","cuervo","ambar","sal","trigo","luna","hierro",
  "zorro","brasa","pino","rio","nube","piedra","grifo","ancla","pluma","cedro","halcon","jade","menta","oso",
  "lince","torre","musgo","plata","bruma","coral","sauce","trueno","higo","cometa","canela","nieve","ascua","olmo"];
var cuentasCache = [];
var cuentasEstado = null;

// Tres palabras + número (lobo-vela-cobre-42), con números aleatorios seguros
function proponerPassword(){
  var r = new Uint32Array(4);
  crypto.getRandomValues(r);
  var w = [0,1,2].map(function(i){ return CUENTA_PALABRAS[r[i] % CUENTA_PALABRAS.length]; });
  return w.join("-") + "-" + (10 + (r[3] % 90));
}

// Campo de contraseña con propuesta editable, otra propuesta, ver y copiar
function cuentaPassField(id, label){
  return '<div class="field cuenta-field"><label for="'+id+'">'+label+'</label>'+
    '<div class="cuenta-pass-row">'+
      '<input type="password" id="'+id+'" value="'+esc(proponerPassword())+'" autocomplete="new-password" autocapitalize="none" spellcheck="false">'+
      '<button type="button" class="btn-compact cuenta-pass-btn" data-action="cuenta-pass-otra" data-for="'+id+'" aria-label="Otra propuesta">🔄</button>'+
      '<button type="button" class="btn-compact cuenta-pass-btn" data-action="cuenta-pass-ver" data-for="'+id+'" aria-label="Ver contraseña">👁</button>'+
      '<button type="button" class="btn-compact cuenta-pass-btn" data-action="cuenta-pass-copiar" data-for="'+id+'">Copiar</button>'+
    '</div></div>';
}

function cuentaTextField(id, label, type, extra){
  return '<div class="field cuenta-field"><label for="'+id+'">'+label+'</label>'+
    '<input type="'+type+'" id="'+id+'" '+(extra || '')+'></div>';
}

function cuentasScreenHtml(screen){
  if(screen === "password"){
    return '<div class="settings-panel">'+
      '<div class="settings-note">Mínimo '+CUENTA_PASS_MIN+' caracteres. Si no recuerdas la actual, pídesela al admin.</div>'+
      cuentaTextField("cuentaPassActual", "Contraseña actual", "password", 'autocomplete="current-password"')+
      cuentaTextField("cuentaPassNueva", "Contraseña nueva", "password", 'autocomplete="new-password"')+
      cuentaTextField("cuentaPassRepite", "Repite la nueva", "password", 'autocomplete="new-password"')+
      '<button type="button" class="btn-solid-gold settings-btn" data-action="cuenta-mi-password">Cambiar contraseña</button>'+
    '</div>';
  }
  if(screen === "jugadores"){
    return '<button type="button" class="btn-solid-gold settings-btn cuenta-nueva-btn" data-action="settings-go" data-screen="cuenta-nueva">+ Nueva cuenta</button>'+
      '<div id="cuentasLista"><div class="settings-note">Cargando cuentas…</div></div>';
  }
  if(screen === "cuenta-nueva"){
    var fichas = (state.characters || []).filter(function(c){ return !c.isNPC && (c.db_id || c.id); });
    return '<div class="settings-panel" id="cuentaNuevaPanel">'+
      '<div class="settings-note">El jugador entra con su usuario y esta contraseña. Puede cambiarla luego en Ajustes.</div>'+
      cuentaTextField("cuentaUsuario", "Usuario", "text", 'autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="30" placeholder="p. ej. martu"')+
      cuentaPassField("cuentaPass", "Contraseña")+
      '<div class="field cuenta-field"><label for="cuentaRol">Rol</label><select id="cuentaRol">'+
        '<option value="player">Jugador</option><option value="gm">Máster</option></select></div>'+
      '<div class="field cuenta-field"><label for="cuentaFicha">Ficha (opcional)</label><select id="cuentaFicha">'+
        '<option value="">Sin ficha por ahora</option>'+
        fichas.map(function(c){ return '<option value="'+esc(c.db_id || c.id)+'">'+esc(c.name || "Sin nombre")+(c.ownerEmail ? ' (ya es de '+esc(nombreDeCuenta(c.ownerEmail))+')' : '')+'</option>'; }).join("")+
      '</select></div>'+
      '<button type="button" class="btn-solid-gold settings-btn" data-action="cuenta-crear">Crear cuenta</button>'+
    '</div>';
  }
  return "";
}

// Mensaje claro si la función del servidor aún no está publicada
async function cuentaFuncion(body){
  try {
    var r = await supabaseClient.functions.invoke("admin-usuarios", { body: body });
    if(r.error){
      var msg = "";
      try { var j = await r.error.context.json(); msg = j && j.error; } catch(e){}
      if(!msg && /Failed to send|404|not found/i.test(String(r.error.message))) msg = "La función de cuentas aún no está activada en Supabase";
      return { error: msg || r.error.message || "Error" };
    }
    return r.data || {};
  } catch(e){
    return { error: "La función de cuentas aún no está activada en Supabase" };
  }
}

function cuentaFecha(iso){
  if(!iso) return "Nunca";
  var d = new Date(iso);
  if(isNaN(d.getTime())) return "Nunca";
  return d.toLocaleDateString("es-ES", {day:"numeric", month:"short"}) + " " + d.toLocaleTimeString("es-ES", {hour:"2-digit", minute:"2-digit"});
}

async function cargarCuentas(){
  var box = document.getElementById("cuentasLista");
  if(!box) return;
  var res = await supabaseClient.rpc("admin_listar_cuentas");
  if(res.error){ box.innerHTML = '<div class="settings-note">No se pudieron leer las cuentas: '+esc(res.error.message)+'</div>'; return; }
  cuentasCache = res.data || [];
  pintarCuentas();
  var est = await cuentaFuncion({ accion: "estado" });
  cuentasEstado = est.error ? null : (est.estado || {});
  if(est.error) cuentasEstado = { _error: est.error };
  pintarCuentas();
}

function pintarCuentas(){
  var box = document.getElementById("cuentasLista");
  if(!box) return;
  var aviso = (cuentasEstado && cuentasEstado._error) ?
    '<div class="settings-note cuenta-aviso">'+esc(cuentasEstado._error)+'. Puedes cambiar roles; crear cuentas, contraseñas y desactivar estarán cuando se active.</div>' : '';
  box.innerHTML = aviso + cuentasCache.map(function(c){
    var yo = currentUser && c.id === currentUser.id;
    var st = (cuentasEstado && cuentasEstado[c.id]) || null;
    var off = !!(st && st.desactivada);
    var gm = c.role === "gm";
    return '<div class="settings-panel cuenta-card'+(off ? ' cuenta-off' : '')+'" data-cuenta="'+esc(c.id)+'">'+
      '<div class="cuenta-head"><span class="cuenta-nombre">'+esc(c.display_name || nombreDeCuenta(c.email))+'</span>'+
        (c.is_admin ? '<span class="settings-chip">Admin</span>' : '<span class="settings-chip'+(gm ? ' gm' : '')+'">'+(gm ? 'Máster' : 'Jugador')+'</span>')+
        (off ? '<span class="settings-chip cuenta-chip-off">Desactivada</span>' : '')+
      '</div>'+
      '<div class="settings-note">'+esc(nombreDeCuenta(c.email))+
        (c.fichas ? ' · Ficha: '+esc(c.fichas) : '')+
        (st ? ' · Última entrada: '+esc(cuentaFecha(st.ultima_entrada)) : '')+'</div>'+
      (yo ? '<div class="settings-note">Es tu cuenta: tu contraseña se cambia en Ajustes › Mi contraseña.</div>' :
      c.is_admin ? '<div class="settings-note">Cuenta de admin: no se cambia desde aquí.</div>' :
      '<div class="cuenta-acciones">'+
        '<button type="button" class="btn-compact cuenta-btn" data-action="cuenta-abrir-pass">Contraseña</button>'+
        ('<button type="button" class="btn-compact cuenta-btn" data-action="cuenta-rol" data-rol="'+(gm ? 'player' : 'gm')+'">'+(gm ? 'Hacer jugador' : 'Hacer máster')+'</button>')+
        '<button type="button" class="btn-compact cuenta-btn" data-action="cuenta-sesiones">Cerrar sesiones</button>'+
        '<button type="button" class="btn-compact cuenta-btn'+(off ? '' : ' cuenta-btn-peligro')+'" data-action="'+(off ? 'cuenta-reactivar' : 'cuenta-desactivar')+'">'+(off ? 'Reactivar' : 'Desactivar')+'</button>'+
      '</div>'+
      '<div class="cuenta-pass-box hidden"></div>')+
    '</div>';
  }).join("");
}

function confirmarCuenta(titulo, detalle, boton){
  return new Promise(function(resolve){
    var ov = document.createElement("div");
    ov.className = "modal-overlay";
    ov.style.zIndex = "10002";
    ov.innerHTML = '<div class="modal confirm-quitar" role="alertdialog" aria-modal="true">'+
      '<h2><span>'+esc(titulo)+'</span></h2>'+
      (detalle ? '<p class="confirm-quitar-txt">'+esc(detalle)+'</p>' : '')+
      '<div class="confirm-quitar-btns">'+
        '<button type="button" class="btn-solid-gold confirm-quitar-btn" data-r="0">Cancelar</button>'+
        '<button type="button" class="btn-compact confirm-quitar-btn confirm-quitar-del" data-r="1">'+esc(boton)+'</button>'+
      '</div></div>';
    function fin(v){ if(ov.parentNode) ov.parentNode.removeChild(ov); resolve(v); }
    ov.addEventListener("click", function(e){
      if(e.target === ov){ fin(false); return; }
      var b = e.target.closest ? e.target.closest("[data-r]") : null;
      if(b) fin(b.getAttribute("data-r") === "1");
    });
    document.body.appendChild(ov);
    var def = ov.querySelector('[data-r="0"]');
    if(def) def.focus();
  });
}

function copiarTexto(txt){
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(function(){ showToast("Copiado", "success"); }, function(){ showToast("No se pudo copiar", "error"); });
  } else showToast("Este navegador no deja copiar", "warning");
}

async function cambiarMiPassword(btn){
  var act = document.getElementById("cuentaPassActual").value || "";
  var nueva = document.getElementById("cuentaPassNueva").value || "";
  var rep = document.getElementById("cuentaPassRepite").value || "";
  if(!act){ showToast("Escribe tu contraseña actual", "warning"); return; }
  if(nueva.length < CUENTA_PASS_MIN){ showToast("La nueva necesita al menos "+CUENTA_PASS_MIN+" caracteres", "warning"); return; }
  if(nueva !== rep){ showToast("Las dos contraseñas nuevas no coinciden", "warning"); return; }
  if(nueva === act){ showToast("La nueva es igual que la actual", "warning"); return; }
  btn.disabled = true;
  try {
    // Se comprueba la actual entrando otra vez con ella
    var ok = await supabaseClient.auth.signInWithPassword({ email: currentUser.email, password: act });
    if(ok.error){ showToast("La contraseña actual no es correcta", "error"); return; }
    var r = await supabaseClient.auth.updateUser({ password: nueva });
    if(r.error){ showToast("No se pudo cambiar: "+r.error.message, "error"); return; }
    // Fuera de los demás dispositivos, por si alguien más la sabía
    try { await supabaseClient.auth.signOut({ scope: "others" }); } catch(e){}
    showToast("Contraseña cambiada", "success");
    openDataModal("main");
  } finally { btn.disabled = false; }
}

async function crearCuenta(btn){
  var usuario = (document.getElementById("cuentaUsuario").value || "").trim().toLowerCase();
  var pass = document.getElementById("cuentaPass").value || "";
  if(!/^[a-z0-9][a-z0-9._-]{2,29}$/.test(usuario)){ showToast("Usuario: de 3 a 30 letras sin tildes, números, punto o guion", "warning"); return; }
  if(pass.length < CUENTA_PASS_MIN){ showToast("La contraseña necesita al menos "+CUENTA_PASS_MIN+" caracteres", "warning"); return; }
  btn.disabled = true;
  var r = await cuentaFuncion({ accion: "crear", usuario: usuario, password: pass,
    rol: document.getElementById("cuentaRol").value, character_id: document.getElementById("cuentaFicha").value });
  btn.disabled = false;
  if(r.error){ showToast(r.error, "error"); return; }
  var panel = document.getElementById("cuentaNuevaPanel");
  if(panel) panel.innerHTML = '<div class="settings-panel-title">Cuenta creada</div>'+
    '<div class="settings-note">Pásale estos datos al jugador por privado:</div>'+
    '<div class="cuenta-resumen">Usuario: <b>'+esc(usuario)+'</b><br>Contraseña: <b>'+esc(pass)+'</b></div>'+
    '<button type="button" class="btn-solid-gold settings-btn" data-action="cuenta-copiar-datos" data-txt="'+esc("Usuario: "+usuario+"\nContraseña: "+pass)+'">Copiar usuario y contraseña</button>'+
    '<button type="button" class="btn-compact settings-btn" data-action="settings-go" data-screen="jugadores">Volver a Jugadores</button>';
}

async function cuentaAccion(action, btn){
  if(action === "cuenta-mi-password"){ cambiarMiPassword(btn); return; }
  if(action === "cuenta-crear"){ crearCuenta(btn); return; }
  if(action === "cuenta-copiar-datos"){ copiarTexto(btn.getAttribute("data-txt") || ""); return; }
  var forId = btn.getAttribute("data-for");
  var inp = forId ? document.getElementById(forId) : null;
  if(action === "cuenta-pass-otra" && inp){ inp.value = proponerPassword(); return; }
  if(action === "cuenta-pass-ver" && inp){ inp.type = inp.type === "password" ? "text" : "password"; return; }
  if(action === "cuenta-pass-copiar" && inp){ copiarTexto(inp.value); return; }

  var card = btn.closest("[data-cuenta]");
  if(!card) return;
  var id = card.getAttribute("data-cuenta");
  var c = cuentasCache.find(function(x){ return x.id === id; }) || {};
  var nombre = c.display_name || nombreDeCuenta(c.email);
  var r;

  if(action === "cuenta-abrir-pass"){
    var box = card.querySelector(".cuenta-pass-box");
    if(!box) return;
    if(!box.classList.contains("hidden")){ box.classList.add("hidden"); box.innerHTML = ""; return; }
    var pid = "cuentaPass_" + id.replace(/[^a-z0-9]/gi, "");
    box.innerHTML = cuentaPassField(pid, "Contraseña nueva")+
      '<div class="settings-note">Se cerrará su sesión en todos sus dispositivos.</div>'+
      '<button type="button" class="btn-solid-gold settings-btn" data-action="cuenta-guardar-pass" data-for="'+pid+'">Guardar contraseña</button>';
    box.classList.remove("hidden");
    return;
  }
  if(action === "cuenta-guardar-pass"){
    var p = inp ? inp.value : "";
    if(p.length < CUENTA_PASS_MIN){ showToast("La contraseña necesita al menos "+CUENTA_PASS_MIN+" caracteres", "warning"); return; }
    btn.disabled = true;
    r = await cuentaFuncion({ accion: "password", user_id: id, password: p });
    btn.disabled = false;
    if(r.error){ showToast(r.error, "error"); return; }
    showToast("Contraseña de "+nombre+" cambiada", "success");
    var pb = card.querySelector(".cuenta-pass-box");
    if(pb){ pb.classList.add("hidden"); pb.innerHTML = ""; }
    return;
  }
  if(action === "cuenta-rol"){
    var rol = btn.getAttribute("data-rol");
    if(!await confirmarCuenta(rol === "gm" ? "¿Hacer máster a «"+nombre+"»?" : "¿Pasar «"+nombre+"» a jugador?",
      rol === "gm" ? "Podrá editar fichas, misiones y La Casa de todos." : "Dejará de poder editar lo del máster.", "Sí, cambiar")) return;
    r = await supabaseClient.rpc("admin_cambiar_rol", { p_user: id, p_rol: rol });
    if(r.error){ showToast("No se pudo cambiar el rol: "+r.error.message, "error"); return; }
    showToast("Rol cambiado. Lo verá al volver a entrar.", "success");
    cargarCuentas();
    return;
  }
  if(action === "cuenta-sesiones" || action === "cuenta-desactivar" || action === "cuenta-reactivar"){
    var txt = {
      "cuenta-sesiones": ["¿Cerrar las sesiones de «"+nombre+"»?", "Tendrá que volver a entrar con su usuario y contraseña.", "Cerrar sesiones"],
      "cuenta-desactivar": ["¿Desactivar «"+nombre+"»?", "No podrá entrar hasta que la reactives. No se borra nada.", "Desactivar"],
      "cuenta-reactivar": ["¿Reactivar «"+nombre+"»?", "Podrá volver a entrar con su contraseña.", "Reactivar"]
    }[action];
    if(!await confirmarCuenta(txt[0], txt[1], txt[2])) return;
    r = await cuentaFuncion({ accion: action.replace("cuenta-", "").replace("sesiones", "cerrar_sesiones"), user_id: id });
    if(r.error){ showToast(r.error, "error"); return; }
    showToast("Hecho", "success");
    cargarCuentas();
  }
}
