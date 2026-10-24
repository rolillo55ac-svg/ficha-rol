// Modo mantenimiento: si el admin lo activa, los demás ven una pantalla de aviso y no pueden usar la web.
// La protección real está en la base (056): mientras está activo, solo el admin puede escribir.
var mantenimientoEstado = { activo: false, mensaje: "" };
var mantenimientoChannel = null;

async function loadMantenimiento(){
  if(!supabaseClient || !currentUser) return;
  try {
    var res = await supabaseClient.from("mantenimiento").select("activo, mensaje").eq("id", 1).maybeSingle();
    // Sin la 056 la tabla no existe: la web sigue como siempre
    if(res.error || !res.data) return;
    setMantenimiento(res.data);
  } catch(e){
    console.warn("No se pudo leer el modo mantenimiento:", e);
    return;
  }
  subscribeMantenimiento();
}

function subscribeMantenimiento(){
  if(!supabaseClient || mantenimientoChannel) return;
  try {
    mantenimientoChannel = supabaseClient.channel("realtime_mantenimiento", { config: { private: true } })
      .on("postgres_changes", { event: "*", schema: "public", table: "mantenimiento" }, function(payload){
        if(payload && payload.new && payload.new.activo !== undefined) setMantenimiento(payload.new);
      })
      .subscribe();
  } catch(e){
    console.warn("Error suscribiendo al modo mantenimiento:", e);
  }
}

function setMantenimiento(row){
  mantenimientoEstado = { activo: !!row.activo, mensaje: row.mensaje || "" };
  pintarMantenimiento();
}

function pintarMantenimiento(){
  var activo = mantenimientoEstado.activo && !!currentUser;
  var admin = typeof esAdminReal === "function" && esAdminReal();
  var gate = document.getElementById("mantenimientoGate");
  var franja = document.getElementById("mantenimientoFranja");
  if(activo && !admin){
    if(!gate){
      gate = document.createElement("div");
      gate.id = "mantenimientoGate";
      gate.className = "login-gate mant-gate";
      gate.innerHTML = '<div class="login-gate-card">'+
        '<h1 class="login-gate-brand">🔧 Mantenimiento</h1>'+
        '<div class="login-gate-sub mant-gate-msg"></div>'+
        '<button type="button" class="login-gate-signup" data-mant="salir">Salir</button>'+
      '</div>';
      gate.querySelector('[data-mant="salir"]').addEventListener("click", function(){
        if(typeof supabaseLogout === "function") supabaseLogout();
      });
      document.body.appendChild(gate);
    }
    gate.querySelector(".mant-gate-msg").textContent = mantenimientoEstado.mensaje ||
      "Estamos arreglando un fallo para que no se pierdan datos. Vuelve en un rato.";
    gate.hidden = false;
    document.body.classList.add("mant-locked");
  } else {
    if(gate) gate.hidden = true;
    document.body.classList.remove("mant-locked");
  }
  if(activo && admin){
    if(!franja){
      franja = document.createElement("div");
      franja.id = "mantenimientoFranja";
      franja.className = "mant-franja";
      franja.textContent = "🔧 Mantenimiento activo · solo tú puedes usar la web";
      document.body.appendChild(franja);
    }
    franja.hidden = false;
  } else if(franja){
    franja.hidden = true;
  }
}

// Ajustes › Admin › Mantenimiento
function mantenimientoScreenHtml(){
  var m = mantenimientoEstado;
  return '<div class="settings-list">'+
      '<div class="settings-note">Con el mantenimiento activo, solo tú puedes entrar y guardar. Los demás ven el aviso y la base no acepta sus cambios, aunque tengan la web vieja.</div>'+
      '<label class="settings-note" for="mantMensaje">Mensaje para los jugadores</label>'+
      '<textarea id="mantMensaje" class="mant-mensaje" rows="3" maxlength="500" placeholder="Estamos arreglando un fallo para que no se pierdan datos. Vuelve en un rato.">'+esc(m.mensaje)+'</textarea>'+
    '</div>'+
    '<button type="button" class="'+(m.activo ? 'btn-compact' : 'btn-solid-gold')+' settings-btn" data-action="mant-cambiar" data-activo="'+(m.activo ? '0' : '1')+'">'+
      (m.activo ? 'Quitar el mantenimiento' : 'Activar el mantenimiento')+'</button>'+
    '<div class="settings-note" id="mantEstado">Ahora: '+(m.activo ? '<b>activo</b>' : 'apagado')+'</div>';
}

async function cambiarMantenimiento(btn){
  var activo = btn.getAttribute("data-activo") === "1";
  var txt = document.getElementById("mantMensaje");
  btn.disabled = true;
  try {
    var res = await supabaseClient.rpc("set_mantenimiento", { p_activo: activo, p_mensaje: txt ? txt.value.trim() : "" });
    if(res.error) throw res.error;
    setMantenimiento(res.data || { activo: activo, mensaje: txt ? txt.value.trim() : "" });
    showToast(activo ? "Mantenimiento activado" : "Mantenimiento quitado", "success");
    openDataModal("mantenimiento");
  } catch(e){
    btn.disabled = false;
    showToast("No se pudo cambiar el mantenimiento: " + (e.message || e), "error");
  }
}

// Al volver a la pestaña se comprueba otra vez por si el aviso en directo se perdió
document.addEventListener("visibilitychange", function(){
  if(document.visibilityState === "visible" && currentUser) loadMantenimiento();
});
