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
  try {
    for(var key in localStorage){
      if(localStorage.hasOwnProperty(key)){
        var val = localStorage.getItem(key) || "";
        totalBytes += (key.length + val.length) * 2;
        count++;
      }
    }
  } catch(e){}
  var maxBytes = 5 * 1024 * 1024; // 5.0 MB estimado típico de navegador
  var freeBytes = Math.max(0, maxBytes - totalBytes);
  var pct = Math.min(100, Math.round((totalBytes / maxBytes) * 1000) / 10);
  return {
    usedBytes: totalBytes,
    totalBytes: maxBytes,
    freeBytes: freeBytes,
    pct: pct,
    usedStr: formatBytes(totalBytes),
    totalStr: "5.0 MB",
    freeStr: formatBytes(freeBytes),
    count: count
  };
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