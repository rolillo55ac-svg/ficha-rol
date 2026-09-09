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