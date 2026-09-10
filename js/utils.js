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

function uid(){ return "id" + Math.random().toString(36).slice(2,8) + Date.now().toString(36).slice(-4); }
function esc(s){ return s===undefined||s===null?"":String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function num(v,d){ var n=parseFloat(v); return isNaN(n)?(d||0):n; }
function rollDie(sides){ return Math.floor(Math.random()*sides)+1; }
function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }

function showToast(message, type){
  type = type || "info";
  var container = document.getElementById("toastContainer");
  var toast = document.createElement("div");
  toast.className = "toast " + type;
  toast.setAttribute("role", "alert");
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(function(){ if(toast.parentNode) toast.parentNode.removeChild(toast); }, 3300);
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
  var knownPrefixes = [STORAGE_KEY, "krysalis_active_", "krysalis_auth_", "krysalis_last_", "sb-", "supabase.auth."];
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
  var knownPrefixes = [STORAGE_KEY, "krysalis_active_", "krysalis_auth_", "krysalis_last_", "sb-", "supabase.auth."];
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
  var knownFolders = ['personajes', 'mapas', 'misiones', 'bestiario', 'pistas'];

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
    var foldersToScan = new Set(knownFolders);
    var rootRes = await supabaseClient.storage.from('images').list('', { limit: 100 });
    if(rootRes && rootRes.data){
      rootRes.data.forEach(function(item){
        if(item.id && item.metadata && item.metadata.size){
          totalBytes += item.metadata.size;
          fileCount++;
        } else if(item.name && !item.id){
          foldersToScan.add(item.name);
        }
      });
    }

    for(var folder of foldersToScan){
      var res = await supabaseClient.storage.from('images').list(folder, { limit: 100 });
      if(res && res.data){
        res.data.forEach(function(item){
          if(item.id && item.metadata && item.metadata.size){
            totalBytes += item.metadata.size;
            fileCount++;
          }
        });
      }
    }

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
    showToast("🚀 Limpiando caché y forzando última versión...", "info");
  }

  try {
    // 1. Purgar todas las caches del CacheStorage del navegador
    if(typeof caches !== "undefined" && caches.keys){
      var cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(function(cName){
        return caches.delete(cName);
      }));
    }

    // 2. Forzar actualización de todos los Service Workers registrados
    if(typeof navigator !== "undefined" && "serviceWorker" in navigator){
      var registrations = await navigator.serviceWorker.getRegistrations();
      for(var reg of registrations){
        await reg.update().catch(function(){});
      }
    }
  } catch(errCache){
    console.warn("Aviso limpiando cachés:", errCache);
  }

  // 3. Recarga limpia con parámetro de rotura de caché
  setTimeout(function(){
    var url = new URL(window.location.href);
    url.searchParams.set("_v", Date.now());
    window.location.href = url.toString();
  }, 400);
}
window.executeUnifiedAppUpdate = executeUnifiedAppUpdate;

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
      if(badgeEl){
        badgeEl.textContent = "v" + currentVer + " → v" + data.version;
        badgeEl.className = "storage-pill warning";
      }
      if(statusEl){
        statusEl.innerHTML = '<span style="color:#FDE047;font-weight:700;">⚠️ Nueva versión v' + esc(data.version) + ' detectada.</span>';
      }

      showToast("✨ ¡Nueva versión detectada (v" + data.version + ")! Actualizando app...", "info");
      setTimeout(function(){
        executeUnifiedAppUpdate(false);
      }, 1400);
    } else {
      if(badgeEl){
        badgeEl.textContent = "v" + currentVer;
        badgeEl.className = "storage-pill optimal";
      }
      if(statusEl){
        statusEl.innerHTML = '<span style="color:#10B981;">✓ Tienes la última versión oficial (v' + esc(currentVer) + ')</span>';
      }
      if(isManual){
        showToast("✓ Ya tienes la versión más reciente (v" + currentVer + ").", "success");
      }
    }
  } catch(e){
    if(isManual){
      // Si el usuario pulsó manualmente, forzar la purga y recarga limpia de todos modos
      executeUnifiedAppUpdate(true);
    }
  } finally {
    isCheckingAppVersion = false;
  }
}
window.checkForAppUpdates = checkForAppUpdates;

async function broadcastForceAppUpdate(){
  if(typeof isGM === "function" && !isGM()){
    showToast("Solo el Administrador puede forzar la actualización a los jugadores.", "warning");
    return;
  }
  if(!confirm("¿Deseas enviar una orden inmediata a todos los jugadores conectados para que actualicen su versión y limpien caché?")){
    return;
  }
  if(typeof realtimeChannel !== "undefined" && realtimeChannel && typeof realtimeChannel.send === "function"){
    try {
      await realtimeChannel.send({
        type: "broadcast",
        event: "app_version_update",
        payload: {
          version: (typeof APP_VERSION !== "undefined" ? APP_VERSION : "1.2.2"),
          build: (typeof APP_BUILD !== "undefined" ? APP_BUILD : ""),
          timestamp: new Date().toISOString()
        }
      });
      showToast("📢 Orden de actualización enviada a todos los jugadores conectados.", "success");
    } catch(err){
      showToast("Error al emitir orden: " + err.message, "warning");
    }
  } else {
    showToast("Canal en tiempo real no conectado.", "warning");
  }
}
window.broadcastForceAppUpdate = broadcastForceAppUpdate;