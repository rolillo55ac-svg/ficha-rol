// Registro de errores de los móviles: los errores de JavaScript se apuntan en la base (058)
// para que el admin los vea en Ajustes › Admin › Errores. Solo el admin los lee.
var erroresEnviados = {};
var erroresGrupos = [];

function registrarErrorCliente(mensaje, archivo, linea){
  mensaje = String(mensaje || "").trim();
  if(!mensaje || typeof supabaseClient === "undefined" || !supabaseClient || typeof currentUser === "undefined" || !currentUser) return;
  // Ruido que no da información: errores de otros dominios y de extensiones del navegador
  if(/^Script error\.?$/i.test(mensaje) || /ResizeObserver loop/i.test(mensaje)) return;
  if(/^(chrome|moz|safari)-extension:/i.test(String(archivo || ""))) return;
  // El mismo error una sola vez por sesión, y como mucho 10 distintos
  var clave = mensaje + "|" + (archivo || "") + "|" + (linea || "");
  if(erroresEnviados[clave] || Object.keys(erroresEnviados).length >= 10) return;
  erroresEnviados[clave] = true;
  try {
    supabaseClient.rpc("registrar_error", {
      p_mensaje: mensaje.slice(0, 500),
      p_archivo: String(archivo || "").replace(location.origin, "").slice(0, 200),
      p_linea: parseInt(linea, 10) || null,
      p_version: typeof APP_VERSION !== "undefined" ? APP_VERSION : "",
      p_pestana: (typeof state !== "undefined" && state && state.activeTab) || "",
      p_dispositivo: String(navigator.userAgent || "").slice(0, 200)
    }).then(function(){}, function(){});
  } catch(e){}
}

window.addEventListener("error", function(ev){
  // Los fallos al cargar una imagen o un sonido no son errores de JavaScript
  if(!ev || ev.target !== window && ev.target && ev.target.tagName) return;
  var msg = ev.message || (ev.error && ev.error.message) || "";
  registrarErrorCliente(msg, ev.filename, ev.lineno);
}, true);

window.addEventListener("unhandledrejection", function(ev){
  var r = ev ? ev.reason : null;
  var msg = r ? (r.message || (typeof r === "string" ? r : "")) : "";
  if(!msg && r){ try { msg = JSON.stringify(r).slice(0, 500); } catch(e){ msg = String(r); } }
  if(msg) registrarErrorCliente("(promesa) " + msg, "", null);
});

// Ajustes › Admin › Errores
function erroresScreenHtml(){
  return '<div class="settings-note">Errores que han visto los jugadores en los últimos 30 días, agrupados por mensaje. «Revisado» no los borra: solo los aparta.</div>' +
    '<div id="erroresLista"><div class="settings-note">Cargando errores…</div></div>';
}

async function cargarErrores(){
  var box = document.getElementById("erroresLista");
  if(!box) return;
  var desde = new Date(Date.now() - 30 * 86400000).toISOString();
  var res = await supabaseClient.from("client_errors")
    .select("usuario, mensaje, archivo, linea, version, pestana, dispositivo, revisado, creado")
    .gte("creado", desde).order("creado", { ascending: false }).limit(1000);
  if(res.error){
    var raw = String((res.error && res.error.message) || res.error || "");
    var msg = /client_errors|does not exist|Could not find/i.test(raw) ? "Falta la migración 058 en esta partida" : (raw || "Error");
    box.innerHTML = '<div class="settings-note">No se pudieron leer los errores: ' + esc(msg) + '</div>';
    return;
  }
  var porMensaje = {};
  erroresGrupos = [];
  (res.data || []).forEach(function(f){
    var g = porMensaje[f.mensaje];
    if(!g){
      g = porMensaje[f.mensaje] = { mensaje: f.mensaje, veces: 0, usuarios: {}, versiones: {}, pestanas: {}, dispositivos: {}, ultima: f.creado, donde: "", pendientes: 0 };
      erroresGrupos.push(g);
    }
    g.veces++;
    if(!f.revisado) g.pendientes++;
    if(f.usuario) g.usuarios[actCorto(f.usuario)] = true;
    if(f.version) g.versiones[f.version] = true;
    if(f.pestana) g.pestanas[f.pestana] = true;
    var disp = actTipoDispositivo(f.dispositivo);
    if(disp) g.dispositivos[disp] = true;
    if(!g.donde && f.archivo) g.donde = f.archivo + (f.linea ? ":" + f.linea : "");
  });
  pintarErrores();
}

function pintarErrores(){
  var box = document.getElementById("erroresLista");
  if(!box) return;
  if(!erroresGrupos.length){
    box.innerHTML = '<div class="settings-note">Sin errores en estos 30 días.</div>';
    return;
  }
  function lista(o){ return Object.keys(o).join(", "); }
  function grupoHtml(g){
    var i = erroresGrupos.indexOf(g);
    var quien = lista(g.usuarios);
    return '<details class="act-persona">' +
      '<summary class="act-fila">' +
        '<span class="act-quien"><span class="act-nombre">' + esc(g.mensaje.length > 120 ? g.mensaje.slice(0, 120) + "…" : g.mensaje) + '</span>' +
          '<span class="act-usuario">' + g.veces + (g.veces === 1 ? ' vez' : ' veces') + (quien ? ' · ' + esc(quien) : '') + '</span></span>' +
        '<span class="act-cuando"><span>' + esc(actHace(g.ultima)) + '</span></span>' +
      '</summary>' +
      '<div class="act-detalle">' +
        (g.mensaje.length > 120 ? '<div class="act-ses">' + esc(g.mensaje) + '</div>' : '') +
        (g.donde ? '<div class="act-ses">Dónde: ' + esc(g.donde) + '</div>' : '') +
        '<div class="act-ses">Última vez: ' + esc(cuentaFecha(g.ultima)) + '</div>' +
        (lista(g.versiones) ? '<div class="act-ses">Versión: ' + esc(lista(g.versiones)) + '</div>' : '') +
        (lista(g.pestanas) ? '<div class="act-ses">Pestaña: ' + esc(lista(g.pestanas)) + '</div>' : '') +
        (lista(g.dispositivos) ? '<div class="act-ses">' + esc(lista(g.dispositivos)) + '</div>' : '') +
        (g.pendientes ? '<button type="button" class="btn-compact cuenta-btn" data-action="errores-revisar" data-i="' + i + '">Marcar como revisado</button>' : '') +
      '</div>' +
    '</details>';
  }
  var nuevos = erroresGrupos.filter(function(g){ return g.pendientes > 0; });
  var revisados = erroresGrupos.filter(function(g){ return g.pendientes === 0; });
  var html = '<div class="settings-panel cuenta-card act-card"><div class="settings-panel-title">Sin revisar (' + nuevos.length + ')</div>' +
    (nuevos.length ? nuevos.map(grupoHtml).join("") : '<div class="settings-note">Nada nuevo.</div>') + '</div>';
  if(revisados.length){
    html += '<div class="settings-panel cuenta-card act-card"><div class="settings-panel-title">Revisados (' + revisados.length + ')</div>' +
      revisados.map(grupoHtml).join("") + '</div>';
  }
  box.innerHTML = html;
}

async function revisarError(btn){
  var g = erroresGrupos[parseInt(btn.getAttribute("data-i"), 10)];
  if(!g) return;
  btn.disabled = true;
  var res = await supabaseClient.rpc("marcar_errores_revisados", { p_mensaje: g.mensaje });
  if(res.error){
    btn.disabled = false;
    showToast("No se pudo marcar: " + (res.error.message || res.error), "error");
    return;
  }
  g.pendientes = 0;
  pintarErrores();
  showToast("Marcado como revisado", "success");
}
