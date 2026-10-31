var ATTRS = ["fisico","destreza","inteligencia","percepcion","carisma"];
var ATTR_LABELS = {fisico:"Físico",destreza:"Destreza",inteligencia:"Inteligencia",percepcion:"Percepción",carisma:"Carisma"};

var SKILL_DEFS = [
  {id:"advertir",name:"Advertir / Notar",attr:"percepcion"},
  {id:"distancia",name:"Ataque a distancia",attr:"destreza"},
  {id:"melee",name:"Armas a melé",attr:"fisico"},
  {id:"atletismo",name:"Atletismo",attr:"fisico"},
  {id:"buscar",name:"Buscar",attr:"percepcion"},
  {id:"cabalgar",name:"Cabalgar",attr:"destreza"},
  {id:"callejeo",name:"Callejeo",attr:"inteligencia"},
  {id:"comercio",name:"Comercio",attr:"inteligencia"},
  {id:"disfraz",name:"Disfraz",attr:"carisma"},
  {id:"escalar",name:"Escalar",attr:"destreza"},
  {id:"esquivar",name:"Esquivar",attr:"destreza"},
  {id:"etiqueta",name:"Etiqueta",attr:"carisma"},
  {id:"fauna",name:"Fauna",attr:"inteligencia"},
  {id:"leyes",name:"Leyes",attr:"inteligencia"},
  {id:"musica",name:"Música",attr:"hybrid",hybridOptions:["destreza","carisma"]},
  {id:"navegar",name:"Navegar",attr:"inteligencia"},
  {id:"nadar",name:"Nadar",attr:"destreza"},
  {id:"rastrear",name:"Rastrear",attr:"percepcion"},
  {id:"reflejos",name:"Reflejos",attr:"percepcion"},
  {id:"religion",name:"Religión",attr:"inteligencia"},
  {id:"sigilo",name:"Sigilo",attr:"destreza"},
  {id:"rumores",name:"Rumores",attr:"hybrid",hybridOptions:["carisma","percepcion"]},
  {id:"bolsillos",name:"Robar bolsillos",attr:"destreza"},
  {id:"herboristeria",name:"Herboristería",attr:"inteligencia"},
  {id:"auxilios",name:"Primeros auxilios",attr:"inteligencia"},
  {id:"supervivencia",name:"Supervivencia",attr:"inteligencia"},
  {id:"tradicion",name:"Tradición / Historia",attr:"inteligencia"},
  {id:"manos",name:"Juego de manos",attr:"destreza"},
  {id:"carisma_sk",name:"Carisma",attr:"carisma"},
  {id:"piedras",name:"Piedras mágicas",attr:"inteligencia"}
];

var THEME_LIST = [
  {id:"default",label:"Carmesí"}, {id:"purple",label:"Morado"},
  {id:"blue",label:"Azul"}, {id:"pink",label:"Rosa"}, {id:"green",label:"Verde"},
  {id:"orange",label:"Naranja"}, {id:"teal",label:"Turquesa"}
];

var CONTINENTES = ["Todos", "Vetrys", "Tryssar", "Labrys", "Aslan", "Krysalis"];
var CONTINENTES_MODAL = ["Vetrys", "Tryssar", "Labrys", "Aslan", "Krysalis", "Todos"];
var TIPOS_OBJETO = ["Todos", "Veneno", "Poción", "Ungüento"];
var TIPOS_OBJETO_MODAL = ["Veneno", "Poción", "Ungüento"];
var TERRENOS = ["Todos", "Bosque", "Minas / Cuevas", "Pantano", "Manglar", "Praderas", "Desierto", "Montañas"];
var TERRENOS_MODAL = ["Bosque", "Minas / Cuevas", "Pantano", "Manglar", "Praderas", "Desierto", "Montañas"];
var RAREZAS_LIST = ["Común", "Rara", "Muy rara", "Legendaria"];

var MAGIC_STONE_FAMILIES = [
  { id: "blanca",   name: "Blanca",   hex: "#F8FAFC", glow: "rgba(248, 250, 252, 0.75)", gema: "Piedra Blanca",    familia: "Control de Elemento Natural",          desc: "Controla un elemento natural (Fuego, Agua, Tierra, Viento, Rayo, Hielo...)", icon: "🌪️" },
  { id: "rojo",     name: "Roja",     hex: "#E74C3C", glow: "rgba(231, 76, 60, 0.75)",   gema: "Piedra Roja",        familia: "Potencia Física",           desc: "Potencia física (Fuerza bruta, resistencia muscular, vigor o agilidad explosiva)", icon: "💪" },
  { id: "azul",     name: "Azul",     hex: "#3B82F6", glow: "rgba(59, 130, 246, 0.75)",  gema: "Piedra Azul",        familia: "Potenciación de Magia/Maná",desc: "Mejora magias o maná (NO energía). Reserva mística, catalizador de maná", icon: "✨" },
  { id: "amarilla", name: "Amarilla", hex: "#FACC15", glow: "rgba(250, 204, 21, 0.75)",  gema: "Piedra Amarilla",    familia: "Invocación / Control",     desc: "Invocación de criaturas o control y telequinesis sobre objetos inertes", icon: "🪙" },
  { id: "verde",    name: "Verde",    hex: "#10B981", glow: "rgba(16, 185, 129, 0.75)",  gema: "Piedra Verde",       familia: "Debuffo y Aflicción",       desc: "Debuffo y aflicciones orgánicas (Asfixia, debilidad muscular, letargo, pesadez)", icon: "🌿" },
  { id: "negra",    name: "Negra",    hex: "#334155", glow: "rgba(100, 116, 139, 0.75)",  gema: "Piedra Negra",       familia: "Misterio / Vacío",          desc: "Todo lo que no entra en las demás categorías (Sombras, vacío, distorsión sensorial)", icon: "🌑" },
  { id: "morado",   name: "Morada",   hex: "#A855F7", glow: "rgba(168, 85, 247, 0.75)",  gema: "Piedra Morada",      familia: "Dominación Mental",         desc: "Control de otra persona sin su consentimiento (Sugestión forzada, marioneta mental)", icon: "👁️" }
];

var STONE_ICONO = { blanca:"piedra-blanca", rojo:"piedra-roja", azul:"piedra-azul", amarilla:"piedras", verde:"piedra-verde", negra:"piedra-negra", morado:"piedra-morada" };

var LAPIDARY_TIERS = [
  { id: "hierro",   name: "Puntas de Hierro",   tier: 1, bonusRoll: 0, icon: "⛏️", desc: "Herramienta rudimentaria. Sin bonificador a la tirada." },
  { id: "bronce",   name: "Puntas de Bronce",   tier: 2, bonusRoll: 1, icon: "🔨", desc: "Corte básico pulido. Bono +1 a la tirada." },
  { id: "plata",    name: "Puntas de Plata",    tier: 3, bonusRoll: 2, icon: "🪙", desc: "Afilado de orfebre. Bono +2 a la tirada." },
  { id: "oro",      name: "Puntas de Oro",      tier: 4, bonusRoll: 3, icon: "⚜️", desc: "Herramienta alquímica fina. Bono +3 a la tirada." },
  { id: "platino",  name: "Puntas de Platino",  tier: 5, bonusRoll: 4, icon: "🛡️", desc: "Aleación mística de alta precisión. Bono +4 a la tirada." },
  { id: "diamante", name: "Puntas de Diamante", tier: 6, bonusRoll: 5, icon: "💎", desc: "Filo supremo de diamante tallador. Bono +5 a la tirada." }
];

var STONE_QUALITIES = [
  { id: "arruinada", label: "Arruinada", minRoll: 0, maxRoll: 7, color: "#64748B", badgeClass: "quality-arruinada", desc: "Fracturada durante el corte. Su magia se ha disipado o es caótica e inservible." },
  { id: "imperfecta", label: "Imperfecta", minRoll: 8, maxRoll: 13, color: "#60A5FA", badgeClass: "quality-imperfecta", desc: "Presenta impurezas y fisuras menores. Canaliza magia pero de potencia atenuada." },
  { id: "buena", label: "Buena", minRoll: 14, maxRoll: 17, color: "#A855F7", badgeClass: "quality-buena", desc: "Facetado limpio y regular. Canaliza el efecto místico con plena eficacia." },
  { id: "perfecta", label: "Perfecta", minRoll: 18, maxRoll: 99, color: "#FDE047", badgeClass: "quality-perfecta", desc: "Gema maestra sin imperfecciones. Brillo deslumbrante y máxima potencia mágica." }
];

function uid(){ return "id" + Math.random().toString(36).slice(2,8) + Date.now().toString(36).slice(-4); }
function esc(s){ return s===undefined||s===null?"":String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }
// Enlaces de imagen o sonido escritos por usuarios: solo https/http, data:image, blob: o rutas de la web.
// Comillas, paréntesis y espacios se codifican para que tampoco rompan un url('...') de CSS.
function safeUrl(u){
  if(u===undefined||u===null) return "";
  u = String(u).trim();
  if(!u) return "";
  if(!/^(https?:\/\/|data:image\/|blob:)/i.test(u) && (/^[a-z][a-z0-9+.\-]*:/i.test(u) || /^\/\//.test(u))) return "";
  return u.replace(/[\s"'()<>\\]/g, function(c){ return "%" + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0"); });
}
// Colores guardados: solo #rgb/#rrggbb(aa) o rgb()/rgba() con números
function safeColor(c, def){
  c = String(c===undefined||c===null ? "" : c).trim();
  return (/^#[0-9a-f]{3,8}$/i.test(c) || /^rgba?\([\d\s.,%]+\)$/i.test(c)) ? c : (def || "");
}
function num(v,d){ var n=parseFloat(v); return isNaN(n)?(d||0):n; }
function rollDie(sides){ return Math.floor(Math.random()*sides)+1; }
function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }

function showToast(message, type, opts){
  type = type || "info";
  var container = document.getElementById("toastContainer");
  var toast = document.createElement("div");
  toast.className = "toast " + type;
  toast.setAttribute("role", "alert");
  if(opts && opts.icono && typeof icono === "function"){ toast.innerHTML = icono(opts.icono,{tam:"s"}) + " "; toast.appendChild(document.createTextNode(message)); }
  else toast.textContent = message;
  container.appendChild(toast);
  setTimeout(function(){ if(toast.parentNode) toast.parentNode.removeChild(toast); }, 3300);
}

// Lo recién creado: lleva la vista hasta el elemento, lo resalta, abre su edición y avisa
// ref: elemento o id del objeto creado (se busca por data-id tras el repintado)
function enfocarNuevo(ref, texto){
  var intentos = 0;
  function buscar(){
    var el = ref;
    if(typeof ref === "string"){
      var sel = '[data-id="'+ref.replace(/"/g, '\\"')+'"],[data-tid="'+ref.replace(/"/g, '\\"')+'"],[id="'+ref.replace(/"/g, '\\"')+'"]';
      var hit = document.querySelector(sel);
      el = hit ? (hit.closest('[class*="card"],[class*="entry"],[class*="item"],[class*="row"],.section,li') || hit) : null;
    }
    if(!el || !document.body.contains(el)){
      if(++intentos < 6) setTimeout(buscar, 80);
      return;
    }
    var det = el.closest ? el.closest("details") : null;
    if(det) det.open = true;
    var animar = !(window.UIJuice && UIJuice.animOn && !UIJuice.animOn()) &&
      !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
    try { el.scrollIntoView({behavior: animar ? "smooth" : "auto", block: "center"}); } catch(_){ el.scrollIntoView(); }
    el.classList.remove("nuevo-destacado", "nuevo-destacado-fijo");
    void el.offsetWidth;
    el.classList.add(animar ? "nuevo-destacado" : "nuevo-destacado-fijo");
    setTimeout(function(){ el.classList.remove("nuevo-destacado", "nuevo-destacado-fijo"); }, animar ? 1400 : 2000);
    var campo = el.querySelector('input[type="text"]:not([disabled]),input:not([type]):not([disabled]),textarea:not([disabled])');
    if(campo){ try { campo.focus({preventScroll: true}); if(campo.select) campo.select(); } catch(_){} }
    if(texto) showToast(texto, "success", {icono:"mision"});
    if(window.UIJuice && UIJuice.vibrar) UIJuice.vibrar(20);
  }
  setTimeout(buscar, 60);
}

// Ventana propia para confirmar lo que resta, quita o borra: Cancelar va primero y es el botón por defecto
function confirmarAccion(o){
  o = o || {};
  return new Promise(function(resolve){
    var ov = document.createElement("div");
    ov.className = "modal-overlay";
    ov.style.zIndex = "10002";
    ov.innerHTML = '<div class="modal confirm-quitar" role="alertdialog" aria-modal="true">'+
      '<h2><span>'+esc(o.titulo || "¿Seguro?")+'</span></h2>'+
      (o.texto ? '<p class="confirm-quitar-txt">'+esc(o.texto)+'</p>' : '')+
      '<div class="confirm-quitar-btns">'+
        '<button type="button" class="btn-solid-gold confirm-quitar-btn" data-r="0">Cancelar</button>'+
        '<button type="button" class="btn-compact confirm-quitar-btn'+(o.peligro === false ? '' : ' confirm-quitar-del')+'" data-r="1">'+esc(o.boton || "Quitar")+'</button>'+
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

function confirmarQuitar(nombre, detalle){
  return confirmarAccion({ titulo: "¿Quitar «" + (nombre || "esto") + "»?", texto: detalle, boton: "Quitar", peligro: true });
}

// Botones de quitar que no preguntaban: se confirma aquí antes de que llegue el clic a su sitio de siempre.
// Si se acepta, el clic se repite con btn._confirmado puesto (los que ya usaban confirm() lo miran).
var CONFIRMAR_ACCIONES = {
  "del-custom-buff": ["este buffo"],
  "del-stone": ["esta piedra", "Se pierden su progreso y sus notas de investigación."],
  "del-summon-trait": ["este rasgo"],
  "del-summon-learned": ["esto que ha aprendido"],
  "del-summon-teach": ["esta enseñanza"],
  "del-summon-skill": ["esta tirada de la invocación"],
  "remove-summon-img": ["la foto de la invocación"],
  "poison-clear": ["el veneno", "Se quita el veneno con las cargas que le queden."],
  "del-poison": ["esta fórmula", "Se quita del grimorio de la ficha."],
  "del-passiveNeg": ["esta pasiva"],
  "del-passivePos": ["esta pasiva"],
  "del-goddess": ["esta fila"],
  "del-milestone": ["este hito"],
  "del-quest-task": ["esta tarea"],
  "remove-map": ["la imagen del mapa"],
  "remove-bestiary-img": ["la imagen de la criatura"],
  "remove-quest-img": ["la imagen de la misión"],
  "remove-clue-img": ["la imagen de la pista"],
  "remove-quest-map": ["el mapa de la misión"],
  "remove-portrait": ["el retrato"],
  "remove-char-sound": ["el sonido"],
  "del-pin": ["este marcador", "Se quita del mapa para todos."],
  "delete-room-decor": ["esta decoración"],
  "canva-delete-item": ["este mueble"],
  "delete-furniture-item": ["este objeto del baúl"],
  "del-char": function(btn){
    var id = btn.getAttribute("data-id");
    var ch = (state.characters || []).find(function(x){ return x.id === id || x.db_id === id; });
    return { titulo: "¿Eliminar definitivamente a «" + (ch && ch.name || "este personaje") + "»?", texto: "Se borra la ficha entera. No se puede deshacer.", boton: "Eliminar" };
  },
  "clear-char-owner": function(btn){
    var id = btn.getAttribute("data-id");
    var ch = (state.characters || []).find(function(x){ return x.id === id || x.db_id === id; });
    return { titulo: "¿Desvincular a «" + nombreDeCuenta(ch && ch.ownerEmail || "este jugador") + "»?", texto: "El personaje quedará libre.", boton: "Desvincular" };
  },
  "delete-map": function(){
    var m = (state.maps || []).find(function(x){ return x.id === state.activeMapId; });
    var n = m ? (m.markers || []).length : 0;
    return { titulo: "¿Eliminar definitivamente el mapa «" + (m && m.name || "este mapa") + "»?", texto: n > 0 ? "Se borran también sus " + n + " marcador(es)." : "", boton: "Eliminar" };
  }
};

if(typeof document !== "undefined") document.addEventListener("click", function(e){
  var btn = e.target && e.target.closest ? e.target.closest("[data-action]") : null;
  if(!btn || btn._confirmado) return;
  var q = CONFIRMAR_ACCIONES[btn.getAttribute("data-action")];
  if(!q) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  var o = typeof q === "function" ? q(btn) : { titulo: "¿Quitar " + q[0] + "?", texto: q[1] || "", boton: "Quitar" };
  if(!o) return;
  o.peligro = true;
  confirmarAccion(o).then(function(ok){
    if(!ok) return;
    // Si mientras tanto se volvió a pintar la pantalla, se repite el clic con una copia del botón
    var b = btn;
    if(!b.isConnected){ b = btn.cloneNode(true); b.style.display = "none"; document.body.appendChild(b); }
    b._confirmado = true;
    try { b.click(); } finally { b._confirmado = false; if(b !== btn && b.parentNode) b.parentNode.removeChild(b); }
  });
}, true);

function avisoDeshacer(texto, onUndo){
  var old = document.getElementById("undoBar");
  if(old && old.parentNode) old.parentNode.removeChild(old);
  var bar = document.createElement("div");
  bar.id = "undoBar";
  bar.className = "undo-bar";
  bar.setAttribute("role", "status");
  bar.innerHTML = '<span class="undo-bar-txt">'+esc(texto)+'</span>'+
    '<button type="button" class="btn-compact undo-bar-btn">Deshacer</button>';
  function quitar(){ clearTimeout(t); if(bar.parentNode) bar.parentNode.removeChild(bar); }
  var t = setTimeout(quitar, 6000);
  bar.querySelector("button").addEventListener("click", function(){ quitar(); onUndo(); });
  document.body.appendChild(bar);
  return bar;
}

// Para botones que se pulsan muchas veces seguidas (−1 vida, −5 oro): un solo Deshacer que suma todo lo bajado
var deshacerSuma = null;
function avisoDeshacerSuma(clave, cambio, texto, onUndo){
  var bar = document.getElementById("undoBar");
  var total = cambio;
  if(deshacerSuma && deshacerSuma.clave === clave && bar && deshacerSuma.bar === bar) total += deshacerSuma.total;
  else if(cambio >= 0) return;
  if(total >= 0){ if(bar && bar.parentNode) bar.parentNode.removeChild(bar); deshacerSuma = null; return; }
  var yo = { clave: clave, total: total };
  yo.bar = avisoDeshacer(texto(total), function(){ if(deshacerSuma === yo) deshacerSuma = null; onUndo(total); });
  deshacerSuma = yo;
}

// Bajar más de 5 de golpe o llegar a 0 pide confirmar antes
function bajadaPideConfirmar(antes, despues){
  return despues < antes && (antes - despues > 5 || (antes > 0 && despues <= 0));
}

function resizeImageFile(file, maxDim, quality, callback){
  var reader = new FileReader();
  reader.onload = function(ev){
    var img = new Image();
    img.onload = function(){
      var scale = Math.min(1, maxDim/Math.max(img.width,img.height));
      var canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width*scale); canvas.height = Math.round(img.height*scale);
      canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
      callback(canvas.toDataURL("image/jpeg", quality||0.65));
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function autoResizeTextarea(el){
  if(!el || el.tagName !== "TEXTAREA") return;
  el.style.height = "auto";
  var scrollH = el.scrollHeight;
  if(scrollH > 0){
    el.style.height = (scrollH + 4) + "px";
  }
}

function autoResizeAllTextareas(){
  if(typeof window === "undefined" || typeof document === "undefined") return;
  requestAnimationFrame(function(){
    var textareas = document.querySelectorAll("textarea");
    textareas.forEach(function(ta){
      if(ta.offsetParent !== null){
        ta.style.height = "auto";
        var scrollH = ta.scrollHeight;
        if(scrollH > 0){
          ta.style.height = (scrollH + 4) + "px";
        }
      }
    });
  });
}

function optimizeImageForUpload(file, maxDim, quality, callback){
  var reader = new FileReader();
  reader.onload = function(ev){
    var img = new Image();
    img.onload = function(){
      var scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      var canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      var ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      var dataUrl = canvas.toDataURL("image/jpeg", quality || 0.85);
      if(canvas.toBlob){
        canvas.toBlob(function(blob){
          callback(blob || file, dataUrl);
        }, "image/jpeg", quality || 0.85);
      } else {
        callback(file, dataUrl);
      }
    };
    img.onerror = function(){ callback(file, null); };
    img.src = ev.target.result;
  };
  reader.onerror = function(){ callback(file, null); };
  reader.readAsDataURL(file);
}

async function uploadImageToSupabase(file, folder, rawFileName, callback){
  if(!file){
    if(typeof callback === "function") callback(null);
    return;
  }

  var maxDim = (folder === "mapas") ? 1920 : 1000;
  optimizeImageForUpload(file, maxDim, 0.85, async function(uploadBlob, base64Fallback){
    // 1. Intentar subir al bucket 'images' de Supabase Storage
    if(typeof supabaseClient !== "undefined" && supabaseClient && supabaseClient.storage){
      showToast("Subiendo imagen a la nube...", "info");
      try{
        var cleanFolder = (folder || "general").replace(/[^a-zA-Z0-9_\-]/g, "");
        var safeName = (rawFileName || "img").toLowerCase().replace(/[^a-zA-Z0-9_\-]/g, "_").slice(0, 30);
        var filePath = cleanFolder + "/" + safeName + "_" + Date.now().toString(36) + ".jpg";

        var res = await supabaseClient.storage
          .from('images')
          .upload(filePath, uploadBlob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: true
          });

        if(res.error){
          console.warn("Supabase Storage no disponible (" + res.error.message + "), usando almacenamiento local.");
          showToast("Storage: usando imagen local optimizada.", "info");
          if(typeof callback === "function") callback(base64Fallback);
          return;
        }

        var pubRes = supabaseClient.storage.from('images').getPublicUrl(filePath);
        var publicUrl = (pubRes && pubRes.data && pubRes.data.publicUrl) ? pubRes.data.publicUrl : null;
        if(publicUrl){
          showToast("¡Imagen guardada en la nube con éxito!", "success");
          if(typeof callback === "function") callback(publicUrl);
          return;
        }
      }catch(err){
        console.warn("Error inesperado en storage:", err);
      }
    }

    // 2. Respaldo local base64
    if(typeof callback === "function") callback(base64Fallback);
  });
}

async function uploadAudioToSupabase(file, rawFileName, callback){
  if(!file){
    if(typeof callback === "function") callback(null);
    return;
  }

  // Límite de tamaño: 15 MB para clips de rol
  if(file.size > 15 * 1024 * 1024){
    showToast("El archivo de audio es demasiado grande (máximo 15 MB).", "warning");
    if(typeof callback === "function") callback(null);
    return;
  }

  var ext = (file.name && file.name.split('.').pop() || 'mp3').toLowerCase();
  var allowedExts = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'weba'];
  if(allowedExts.indexOf(ext) === -1){
    ext = 'mp3';
  }
  var mime = file.type || ('audio/' + (ext === 'mp3' ? 'mpeg' : ext));

  // 1. Intentar subir al bucket 'images' (carpeta sonidos) de Supabase Storage
  if(typeof supabaseClient !== "undefined" && supabaseClient && supabaseClient.storage){
    showToast("Subiendo pista de audio a la nube...", "info");
    try {
      var safeName = (rawFileName || "audio").toLowerCase().replace(/[^a-zA-Z0-9_\-]/g, "_").slice(0, 32);
      var filePath = "sonidos/" + safeName + "_" + Date.now().toString(36) + "." + ext;

      var res = await supabaseClient.storage
        .from('images')
        .upload(filePath, file, {
          contentType: mime,
          cacheControl: '86400',
          upsert: true
        });

      if(res.error){
        console.warn("Error subiendo audio a Supabase Storage:", res.error.message);
        showToast("Storage: no se pudo guardar en la nube (" + res.error.message + ")", "warning");
      } else {
        var pubRes = supabaseClient.storage.from('images').getPublicUrl(filePath);
        var publicUrl = (pubRes && pubRes.data && pubRes.data.publicUrl) ? pubRes.data.publicUrl : null;
        if(publicUrl){
          showToast("¡Pista de audio subida con éxito!", "success");
          if(typeof callback === "function") callback(publicUrl, file.name);
          return;
        }
      }
    } catch(err){
      console.warn("Excepción al subir audio:", err);
    }
  }

  // 2. Respaldo local base64 si el archivo es menor a 1 MB
  if(file.size <= 1024 * 1024){
    var reader = new FileReader();
    reader.onload = function(e){
      showToast("Audio guardado en almacenamiento local", "info");
      if(typeof callback === "function") callback(e.target.result, file.name);
    };
    reader.onerror = function(){
      showToast("Error leyendo archivo de audio local.", "error");
      if(typeof callback === "function") callback(null);
    };
    reader.readAsDataURL(file);
  } else {
    showToast("No se pudo subir a la nube y el archivo es muy pesado para almacenamiento local.", "error");
    if(typeof callback === "function") callback(null);
  }
}
window.uploadAudioToSupabase = uploadAudioToSupabase;

function formatBytes(bytes, decimals){
  if(!bytes || bytes <= 0) return '0 B';
  var k = 1024;
  var dm = decimals !== undefined ? decimals : 1;
  var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  var i = Math.floor(Math.log(bytes) / Math.log(k));
  if(i < 0) i = 0;
  if(i >= sizes.length) i = sizes.length - 1;
  if(sizes[i] === 'GB') dm = 2;
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function getLocalStorageUsage(){
  var totalBytes = 0;
  var count = 0;
  var base64Count = 0;
  var base64Bytes = 0;

  try {
    for(var key in localStorage){
      if(localStorage.hasOwnProperty(key)){
        var val = localStorage.getItem(key) || "";
        totalBytes += (key.length + val.length) * 2;
        count++;
      }
    }

    if(typeof state !== "undefined" && state){
      (state.characters||[]).forEach(function(c){
        if(c.portrait && c.portrait.startsWith("data:")){ base64Count++; base64Bytes += c.portrait.length * 2; }
      });
      (state.maps||[]).forEach(function(m){
        if(m.image && m.image.startsWith("data:")){ base64Count++; base64Bytes += m.image.length * 2; }
      });
      if(state.questMap && state.questMap.image && state.questMap.image.startsWith("data:")){
        base64Count++; base64Bytes += state.questMap.image.length * 2;
      }
      (state.bestiary||[]).forEach(function(b){
        if(b.image && b.image.startsWith("data:")){ base64Count++; base64Bytes += b.image.length * 2; }
      });
      (state.quests||[]).forEach(function(q){
        if(q.image && q.image.startsWith("data:")){ base64Count++; base64Bytes += q.image.length * 2; }
      });
      (state.questClues||[]).forEach(function(cl){
        if(cl.image && cl.image.startsWith("data:")){ base64Count++; base64Bytes += cl.image.length * 2; }
      });
    }
  } catch(e){}

  // Límite estándar del navegador en UTF-16 (10 MB)
  var maxBytes = 10 * 1024 * 1024;
  if(totalBytes > maxBytes) maxBytes = totalBytes;
  var freeBytes = Math.max(0, maxBytes - totalBytes);
  var pct = Math.min(100, Math.round((totalBytes / maxBytes) * 1000) / 10);

  return {
    usedBytes: totalBytes,
    totalBytes: maxBytes,
    freeBytes: freeBytes,
    pct: pct,
    usedStr: formatBytes(totalBytes),
    totalStr: formatBytes(maxBytes),
    freeStr: formatBytes(freeBytes),
    count: count,
    base64Count: base64Count,
    base64Bytes: base64Bytes,
    base64BytesStr: formatBytes(base64Bytes)
  };
}

function dataURItoBlob(dataURI){
  try {
    var parts = dataURI.split(',');
    var byteString = atob(parts[1]);
    var mimeString = parts[0].split(':')[1].split(';')[0];
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for(var i = 0; i < byteString.length; i++){
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  } catch(e){
    console.error("Error convirtiendo dataURI a blob:", e);
    return null;
  }
}

async function migrateLocalImagesToSupabase(){
  if(typeof supabaseClient === "undefined" || !supabaseClient || !supabaseClient.storage){
    showToast("No hay conexión activa con Supabase Storage", "warning");
    return;
  }

  var targets = [];
  if(typeof state !== "undefined" && state){
    (state.characters || []).forEach(function(c){
      if(c.portrait && c.portrait.startsWith("data:image")){
        targets.push({ type: "character", id: c.id, obj: c, field: "portrait", folder: "personajes", name: c.name || "personaje" });
      }
    });
    (state.maps || []).forEach(function(m){
      if(m.image && m.image.startsWith("data:image")){
        targets.push({ type: "map", obj: m, field: "image", folder: "mapas", name: m.name || "mapa" });
      }
    });
    if(state.questMap && state.questMap.image && state.questMap.image.startsWith("data:image")){
      targets.push({ type: "questMap", obj: state.questMap, field: "image", folder: "mapas", name: state.questMap.name || "mapa_mision" });
    }
    (state.bestiary || []).forEach(function(b){
      if(b.image && b.image.startsWith("data:image")){
        targets.push({ type: "bestiary", obj: b, field: "image", folder: "bestiario", name: b.name || "criatura" });
      }
    });
    (state.quests || []).forEach(function(q){
      if(q.image && q.image.startsWith("data:image")){
        targets.push({ type: "quest", obj: q, field: "image", folder: "misiones", name: q.title || "mision" });
      }
    });
    (state.questClues || []).forEach(function(cl){
      if(cl.image && cl.image.startsWith("data:image")){
        targets.push({ type: "clue", obj: cl, field: "image", folder: "pistas", name: cl.title || "pista" });
      }
    });
  }

  // Limpiar también claves residuales de versiones viejas en localStorage
  var cleanedKeys = 0;
  var knownPrefixes = [STORAGE_KEY, "krysalis_", "krysalisGeode", "sb-", "supabase.auth."];
  try {
    for(var k in localStorage){
      if(localStorage.hasOwnProperty(k)){
        var isKnown = knownPrefixes.some(function(p){ return k.startsWith(p); });
        if(!isKnown){
          localStorage.removeItem(k);
          cleanedKeys++;
        }
      }
    }
  } catch(errKey){}

  if(targets.length === 0){
    if(cleanedKeys > 0){
      showToast("Se limpiaron " + cleanedKeys + " registros residuales. Memoria liberada.", "success");
      saveState(false);
      if(typeof updateStorageStatsUI === "function") updateStorageStatsUI(true);
    } else {
      showToast("No hay fotos pesadas en local pendientes de migrar.", "info");
      if(typeof updateStorageStatsUI === "function") updateStorageStatsUI(true);
    }
    return;
  }

  showToast("Migrando " + targets.length + " imagen(es) a Supabase...", "info");

  var migratedCount = 0;
  for(var item of targets){
    try {
      var base64Data = item.obj[item.field];
      var blob = dataURItoBlob(base64Data);
      if(!blob) continue;

      var cleanFolder = (item.folder || "general").replace(/[^a-zA-Z0-9_\-]/g, "");
      var safeName = (item.name || "img").toLowerCase().replace(/[^a-zA-Z0-9_\-]/g, "_").slice(0, 30);
      var filePath = cleanFolder + "/" + safeName + "_" + Date.now().toString(36) + ".jpg";

      var res = await supabaseClient.storage.from('images').upload(filePath, blob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true
      });

      if(!res.error){
        var pubRes = supabaseClient.storage.from('images').getPublicUrl(filePath);
        if(pubRes && pubRes.data && pubRes.data.publicUrl){
          item.obj[item.field] = pubRes.data.publicUrl;
          if(item.type === "character" && item.id){
            markCharDirty(item.id, { portrait: pubRes.data.publicUrl });
            if(typeof pushCharacterPatch === "function") pushCharacterPatch(item.id, { portrait: pubRes.data.publicUrl });
          }
          migratedCount++;
        }
      }
    } catch(errItem){
      console.warn("Error migrando imagen individual:", errItem);
    }
  }

  saveState(true);
  if(typeof pushSharedData === "function") pushSharedData();
  if(typeof pushMapsData === "function") pushMapsData();
  if(typeof renderTopbar === "function") renderTopbar();
  if(typeof renderTab === "function") renderTab();

  showToast("¡" + migratedCount + " imagen(es) migradas a Supabase! Espacio local liberado.", "success");
  if(typeof updateStorageStatsUI === "function") updateStorageStatsUI(true);
}

function cleanOrphanStorage(silent){
  var cleaned = 0;
  var knownPrefixes = [STORAGE_KEY, "krysalis_", "krysalisGeode", "sb-", "supabase.auth."];
  try {
    for(var k in localStorage){
      if(localStorage.hasOwnProperty(k)){
        var isKnown = knownPrefixes.some(function(p){ return k.startsWith(p); });
        if(!isKnown){
          localStorage.removeItem(k);
          cleaned++;
        }
      }
    }
  } catch(e){}

  if(!silent){
    if(cleaned > 0){
      showToast("Se eliminaron " + cleaned + " registros de versiones anteriores.", "success");
      saveState(false);
    } else {
      showToast("No hay registros obsoletos en la memoria.", "info");
    }
    if(typeof updateStorageStatsUI === "function") updateStorageStatsUI(true);
  } else if(cleaned > 0) {
    saveState(false);
  }
}

async function getSupabaseStorageUsage(){
  var totalBytes = 0;
  var fileCount = 0;
  var maxBytes = 1024 * 1024 * 1024; // 1.00 GB Límite Free Tier de Supabase

  if(typeof supabaseClient === "undefined" || !supabaseClient || !supabaseClient.storage){
    return {
      usedBytes: 0,
      totalBytes: maxBytes,
      freeBytes: maxBytes,
      pct: 0,
      displayPct: "0%",
      usedStr: "0 B",
      totalStr: "1.00 GB",
      freeStr: "1.00 GB",
      fileCount: 0,
      error: "Sin conexión"
    };
  }

  try {
    // Recorre carpetas y subcarpetas (la galería va en galeria/<partida>/), de 100 en 100
    async function scan(prefix, depth){
      for(var off = 0; off < 5000; off += 100){
        var res = await supabaseClient.storage.from('images').list(prefix, { limit: 100, offset: off });
        if(!res || !res.data || !res.data.length) return;
        for(var k = 0; k < res.data.length; k++){
          var item = res.data[k];
          if(item.id && item.metadata && item.metadata.size){
            totalBytes += item.metadata.size;
            fileCount++;
          } else if(item.name && !item.id && depth < 3){
            await scan(prefix ? prefix + '/' + item.name : item.name, depth + 1);
          }
        }
        if(res.data.length < 100) return;
      }
    }
    await scan('', 0);

    var freeBytes = Math.max(0, maxBytes - totalBytes);
    var rawPct = (totalBytes / maxBytes) * 100;
    var pct = Math.min(100, Math.round(rawPct * 10) / 10);
    var displayPct = pct === 0 && totalBytes > 0 ? rawPct.toFixed(2) + "%" : pct + "%";

    return {
      usedBytes: totalBytes,
      totalBytes: maxBytes,
      freeBytes: freeBytes,
      pct: pct,
      displayPct: displayPct,
      usedStr: formatBytes(totalBytes),
      totalStr: "1.00 GB",
      freeStr: formatBytes(freeBytes),
      fileCount: fileCount,
      error: null
    };
  } catch(err){
    console.warn("Error consultando Supabase Storage:", err);
    return {
      usedBytes: 0,
      totalBytes: maxBytes,
      freeBytes: maxBytes,
      pct: 0,
      displayPct: "0%",
      usedStr: "0 B",
      totalStr: "1.00 GB",
      freeStr: "1.00 GB",
      fileCount: 0,
      error: err.message
    };
  }
}

// === SISTEMA UNIFICADO DE ACTUALIZACIÓN Y PURGA DE CACHÉ ===
var isCheckingAppVersion = false;

async function executeUnifiedAppUpdate(isManual){
  if(typeof flushPendingSync === "function") flushPendingSync();
  if(typeof cleanOrphanStorage === "function") cleanOrphanStorage(true);

  if(isManual){
    showToast("Limpiando caché y forzando última versión...", "info", {icono:"version"});
  }

  try {
    // 1. Purgar todas las caches del CacheStorage del navegador
    if(typeof caches !== "undefined" && caches.keys){
      var cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(function(cName){
        return caches.delete(cName);
      }));
    }

    // 2. Desregistrar y limpiar todos los Service Workers para que la recarga descargue código limpio
    if(typeof navigator !== "undefined" && "serviceWorker" in navigator){
      var registrations = await navigator.serviceWorker.getRegistrations();
      for(var reg of registrations){
        await reg.unregister().catch(function(){});
      }
    }
  } catch(errCache){
    console.warn("Aviso limpiando cachés:", errCache);
  }

  // 3. Recarga limpia con parámetro de rotura de caché, sin cortar un guardado a medias
  await waitForPendingSaves(8000);
  setTimeout(function(){
    var url = new URL(window.location.href);
    url.searchParams.set("_v", Date.now());
    window.location.href = url.toString();
  }, 400);
}
window.executeUnifiedAppUpdate = executeUnifiedAppUpdate;

var hasNotifiedUpdateAvailable = false;
// Solo la primera comprobación (al abrir la app) recarga sola; después se avisa con la barra
var appUpdateFirstCheckDone = false;

function waitForPendingSaves(maxMs){
  return new Promise(function(resolve){
    var start = Date.now();
    (function check(){
      if(typeof hasPendingSaves !== "function" || !hasPendingSaves() || Date.now() - start >= maxMs) return resolve();
      if(typeof flushPendingSync === "function") flushPendingSync();
      setTimeout(check, 500);
    })();
  });
}

function isAnyModalOpen(){
  return !!document.querySelector('[id$="ModalOverlay"]:not(.hidden)');
}

function getAppUpdateBar(){
  var bar = document.getElementById("appUpdateBar");
  if(!bar){
    bar = document.createElement("div");
    bar.id = "appUpdateBar";
    bar.className = "app-update-bar";
    bar.setAttribute("role", "status");
    bar.innerHTML = '<span class="app-update-bar__text"></span>' +
      '<button type="button" class="app-update-bar__btn"></button>' +
      '<button type="button" class="app-update-bar__close" aria-label="Cerrar">' + iconoUI("cerrar") + '</button>';
    document.body.appendChild(bar);
    bar.querySelector(".app-update-bar__close").addEventListener("click", function(){
      if(appForcedUpdateTimer) return;
      bar.classList.add("hidden");
    });
  }
  bar.classList.remove("hidden");
  return bar;
}

// Barra discreta "Hay una versión nueva · Actualizar" (no recarga hasta que se pulsa)
function showAppUpdateBar(version){
  var bar = getAppUpdateBar();
  if(appForcedUpdateTimer) return;
  bar.querySelector(".app-update-bar__text").textContent = "Hay una versión nueva" + (version ? " (v" + version + ")" : "");
  var btn = bar.querySelector(".app-update-bar__btn");
  btn.textContent = "Actualizar";
  btn.onclick = function(){ btn.disabled = true; executeUnifiedAppUpdate(true); };
  bar.querySelector(".app-update-bar__close").classList.remove("hidden");
}
window.showAppUpdateBar = showAppUpdateBar;

// Aviso único «Instálala como app» (solo en navegador, no en la app instalada)
function showInstallHintOnce(){
  var KEY = "krysalisInstallHintV1";
  try{
    if(localStorage.getItem(KEY)) return;
    if(window.matchMedia("(display-mode: standalone)").matches || navigator.standalone) return;
  }catch(e){ return; }
  var bar = document.createElement("div");
  bar.id = "installHintBar";
  bar.className = "app-update-bar";
  bar.setAttribute("role", "status");
  var ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  bar.innerHTML = '<span class="app-update-bar__text"><b>Instálala como app</b>: va más fluida y no se recarga sin querer. ' +
    (ios ? 'En iPhone: Compartir › «Añadir a pantalla de inicio».' : 'En Android: menú ⋮ › «Instalar aplicación» o «Añadir a pantalla de inicio».') +
    '</span><button type="button" class="app-update-bar__close" aria-label="Cerrar">' + iconoUI("cerrar") + '</button>';
  bar.querySelector(".app-update-bar__close").addEventListener("click", function(){
    try{ localStorage.setItem(KEY, "1"); }catch(e){}
    bar.remove();
  });
  document.body.appendChild(bar);
  setTimeout(function(){ try{ localStorage.setItem(KEY, "1"); }catch(e){} bar.remove(); }, 15000);
}
window.showInstallHintOnce = showInstallHintOnce;

// Orden del máster: cuenta atrás de 10 s; espera a que no haya guardados ni ventanas abiertas
var appForcedUpdateTimer = null;
function startForcedAppUpdate(version){
  if(appForcedUpdateTimer) return;
  var bar = getAppUpdateBar();
  var textEl = bar.querySelector(".app-update-bar__text");
  var btn = bar.querySelector(".app-update-bar__btn");
  bar.querySelector(".app-update-bar__close").classList.add("hidden");
  var left = 10;
  var waited = 0;
  var go = function(){
    clearInterval(appForcedUpdateTimer);
    textEl.textContent = "Actualizando…";
    btn.disabled = true;
    executeUnifiedAppUpdate(false);
  };
  btn.textContent = "Ahora";
  btn.disabled = false;
  btn.onclick = go;
  var tick = function(){
    if(left > 0){
      textEl.textContent = "El máster ha publicado una versión nueva. Se actualiza en " + left + " s";
      left--;
      return;
    }
    var busy = (typeof hasPendingSaves === "function" && hasPendingSaves()) || isAnyModalOpen();
    if(busy && waited < 120){
      waited++;
      textEl.textContent = "Versión nueva: se actualizará al cerrar la ventana abierta";
      return;
    }
    go();
  };
  tick();
  appForcedUpdateTimer = setInterval(tick, 1000);
}
window.startForcedAppUpdate = startForcedAppUpdate;

async function checkForAppUpdates(isManual){
  if(isCheckingAppVersion) return;
  isCheckingAppVersion = true;
  var badgeEl = document.getElementById("appVersionBadge");
  var statusEl = document.getElementById("versionCheckResult");

  try {
    var res = await fetch("./version.json?t=" + Date.now(), {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" }
    });
    if(!res.ok) throw new Error("HTTP " + res.status);
    var data = await res.json();
    if(!data || !data.version) throw new Error("Datos de versión no válidos");

    var currentVer = (typeof APP_VERSION !== "undefined") ? APP_VERSION : "1.0";
    var currentBuild = (typeof APP_BUILD !== "undefined") ? APP_BUILD : "";
    var isOutdated = (data.version !== currentVer) || (data.build && currentBuild && data.build !== currentBuild);

    if(isOutdated){
      var reloadAttemptKey = "krysalis_update_attempt_" + data.version + "_" + (data.build || "");
      var alreadyAttempted = false;
      try {
        alreadyAttempted = !!sessionStorage.getItem(reloadAttemptKey);
      } catch(e){}

      if(badgeEl){
        badgeEl.textContent = "v" + currentVer + " → v" + data.version;
        badgeEl.className = "storage-pill warning";
      }
      if(statusEl){
        statusEl.innerHTML = '<span style="color:#FDE047;font-weight:700;">' + iconoUI("aviso") + ' Nueva versión v' + esc(data.version) + ' disponible. ' + (alreadyAttempted ? 'Pulsa "Actualizar" para forzar recarga limpia.' : 'Actualizando automáticamente...') + '</span>';
      }

      if(isManual){
        showToast("Aplicando actualización a v" + data.version + "...", "info", {icono:"version"});
        executeUnifiedAppUpdate(true);
      } else if(appUpdateFirstCheckDone){
        showAppUpdateBar(data.version);
      } else if(!alreadyAttempted){
        try {
          sessionStorage.setItem(reloadAttemptKey, "true");
        } catch(e){}
        showToast("¡Nueva versión detectada (v" + data.version + ")! Actualizando app...", "info", {icono:"destellos"});
        setTimeout(function(){
          executeUnifiedAppUpdate(false);
        }, 1000);
      } else {
        if(!hasNotifiedUpdateAvailable){
          hasNotifiedUpdateAvailable = true;
          showToast("Versión v" + data.version + " disponible. Pulsa Actualizar en Ajustes si no se aplicó.", "warning", {icono:"peligro"});
        }
      }
    } else {
      try {
        sessionStorage.removeItem("krysalis_update_attempt_" + currentVer + "_" + (currentBuild || ""));
      } catch(e){}
      if(badgeEl){
        badgeEl.textContent = "v" + currentVer;
        badgeEl.className = "storage-pill optimal";
      }
      if(statusEl){
        statusEl.innerHTML = '<span style="color:#10B981;">Tienes la última versión oficial (v' + esc(currentVer) + ')</span>';
      }
      if(isManual){
        showToast("Ya tienes la versión más reciente (v" + currentVer + ").", "success", {icono:"version"});
      }
    }
  } catch(e){
    if(isManual){
      executeUnifiedAppUpdate(true);
    }
  } finally {
    isCheckingAppVersion = false;
    appUpdateFirstCheckDone = true;
  }
}
window.checkForAppUpdates = checkForAppUpdates;

async function broadcastForceAppUpdate(){
  if(typeof isGM === "function" && !isGM()){
    showToast("Solo el Administrador puede forzar la actualización a los jugadores.", "warning");
    return;
  }
  if(typeof realtimeChannel !== "undefined" && realtimeChannel && typeof realtimeChannel.send === "function"){
    try {
      await realtimeChannel.send({
        type: "broadcast",
        event: "app_version_update",
        payload: {
          version: (typeof APP_VERSION !== "undefined" ? APP_VERSION : "1.3.9.8"),
          build: (typeof APP_BUILD !== "undefined" ? APP_BUILD : ""),
          timestamp: new Date().toISOString()
        }
      });
      showToast("Orden de actualización enviada a todos los jugadores conectados.", "success", {icono:"cuerno"});
    } catch(err){
      showToast("Error al emitir orden: " + err.message, "warning");
    }
  } else {
    showToast("Canal en tiempo real no conectado.", "warning");
  }
}
window.broadcastForceAppUpdate = broadcastForceAppUpdate;

function soundEnabled(){
  try { return localStorage.getItem("krysalis_sound_off") !== "1"; } catch(e){ return true; }
}
function setSoundEnabled(on){
  try { if(on) localStorage.removeItem("krysalis_sound_off"); else localStorage.setItem("krysalis_sound_off", "1"); } catch(e){}
}
