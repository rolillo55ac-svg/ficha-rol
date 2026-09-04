(function(){
"use strict";

var STORAGE_KEY = "krysalisFichasV311";
var SUPABASE_URL = "https://nwjbdevshaucnjrwebtb.supabase.co";
var SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53amJkZXZzaGF1Y25qcndlYnRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMzA4OTIsImV4cCI6MjEwMzYwNjg5Mn0.WUISbOthy-5hTZ69p5lydHxHP4ZfAM4nLFa13lKPoeY";

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

var state = null;
var supabaseClient = null;
var currentUser = null;
var currentRole = 'player';
var isRemoteSyncing = false;
var realtimeChannel = null;

var bestiaryContinentFilter = "Todos";
var bestiaryRarityFilter = "Todos";
var bestiaryMountFilter = "Todos";
var loreContinentFilter = "Todos";
var loreTypeFilter = "Todos";
var loreTerrainFilter = "Todos";
var currentLoreSubtab = "objetos";
var currentBuffTab = "all";

function updateLoadingProgress(pct, msg){
  var fill = document.getElementById("loadingBarFill");
  var txt = document.getElementById("loadingStatusText");
  if(fill) fill.style.width = Math.min(100, Math.max(5, pct)) + "%";
  if(txt && msg) txt.textContent = msg;
}

function hideLoadingScreen(){
  var ls = document.getElementById("loadingScreen");
  if(!ls) return;
  updateLoadingProgress(100, "¡Bienvenido a Krysalis!");
  setTimeout(function(){
    ls.classList.add("fade-out");
    setTimeout(function(){
      ls.style.display = "none";
    }, 700);
  }, 500);
}

// === CIBERSEGURIDAD: PROTECCIÓN ANTI FUERZA BRUTA ===
var MAX_LOGIN_ATTEMPTS = 5;
var LOCKOUT_DURATION_MS = 15 * 60 * 1000;

function getAuthAttempts(){
  try{
    return JSON.parse(localStorage.getItem("krysalis_auth_attempts") || '{"count":0,"lockoutUntil":0}');
  }catch(e){ return {count:0, lockoutUntil:0}; }
}

function recordFailedLoginAttempt(){
  var att = getAuthAttempts();
  att.count = (att.count || 0) + 1;
  att.lastAttempt = Date.now();
  if(att.count >= MAX_LOGIN_ATTEMPTS){
    att.lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
  }
  localStorage.setItem("krysalis_auth_attempts", JSON.stringify(att));
  return att;
}

function clearAuthAttempts(){
  localStorage.removeItem("krysalis_auth_attempts");
}

function getSeedWeaponsCatalog(){
  return [
    {id:"wp_espada_larga", name:"Espada Larga", dano:"1d8+2", alcance:"Melé", critico:"Doble daño en dados y sangrado leve.", desc:"Espada equilibrada de hoja recta.", visible:true},
    {id:"wp_arco_largo", name:"Arco Largo", dano:"1d8", alcance:"150m", critico:"Ignora 2 puntos de absorción de armadura.", desc:"Arco de gran tensión para combate a distancia.", visible:true},
    {id:"wp_daga_mordaz", name:"Daga Mordaz", dano:"1d4+1", alcance:"Melé / Arrojadiza", critico:"Envenena automáticamente al objetivo.", desc:"Arma ligera con filo envenenado.", visible:true},
    {id:"wp_arpon_cuerda", name:"Arpón con cuerda", dano:"1d6+2", alcance:"8m", critico:"Atrapa al objetivo con la cuerda.", desc:"Arpón de pescador con cuerda resistente.", visible:true},
    {id:"wp_cerbatana", name:"Cerbatana", dano:"1d4+Veneno", alcance:"15m", critico:"Efecto de veneno potenciado.", desc:"Tubo para disparar dardos envenenados.", visible:true},
    {id:"wp_daga", name:"Daga", dano:"1d4+2 / 1d4", alcance:"10m", critico:"1d4 de daño crítico adicional.", desc:"Daga de combate o lanzamiento.", visible:true},
    {id:"wp_guadana_2m", name:"Guadaña dos manos", dano:"2d6", alcance:"Melé", critico:"Corte masivo que ignora 1 armadura.", desc:"Gran guadaña de combate a dos manos.", visible:true},
    {id:"wp_arco", name:"Arco", dano:"1d6+3", alcance:"Distancia", critico:"Tiro certero.", desc:"Arco compuesto de precisión.", visible:true},
    {id:"wp_kusarigama", name:"Kusarigama", dano:"1d6+2", alcance:"+2m", critico:"Desarme o derribo del rival.", desc:"Hoz con cadena y contrapeso.", visible:true},
    {id:"wp_latigo", name:"Látigo", dano:"1d6+3", alcance:"+1m", critico:"Inmovilización o tropiezo.", desc:"Látigo flexible de cuero noble.", visible:true},
    {id:"wp_guja", name:"Guja", dano:"1d6+3", alcance:"+1m", critico:"Tajo extendido.", desc:"Arma de asta cortante con gran alcance.", visible:true},
    {id:"wp_mordisco_vamp", name:"Mordisco Vampírico", dano:"1d6+3", alcance:"Melé", critico:"Absorbe la mitad del daño causado en salud.", desc:"Ataque vampírico que drena sangre y vitalidad.", visible:true},
    {id:"wp_sable_bonito", name:"Sable bonito", dano:"1D6+3", alcance:"Melé", critico:"Corte rápido y elegante.", desc:"Sable fino y ligero de empuñadura noble.", visible:true},
    {id:"wp_garras_lobezno", name:"Garras lobezno", dano:"1d4+2 / 1d4", alcance:"Melé", critico:"Desgarro salvaje múltiple.", desc:"Garras afiladas de depredador.", visible:true},
    {id:"wp_martillo_2m", name:"Martillo a dos manos", dano:"2d6", alcance:"Melé", critico:"Impacto demoledor con derribo.", desc:"Pesado martillo contundente para dos manos.", visible:true}
  ];
}

function getSeedBuffCatalog(){
  return [
    {id:uid(), name:"Sangre Vampírica", type:"buff", attr:"melee", bonus:"+1", duration:"permanent", durationTurns:0, desc:"+1 a ataques melé", visible:true},
    {id:uid(), name:"Sangre Distancia", type:"buff", attr:"distancia", bonus:"+1", duration:"permanent", durationTurns:0, desc:"+1 a ataques a distancia", visible:true},
    {id:uid(), name:"Sangre Percepción", type:"buff", attr:"percepcion", bonus:"+2", duration:"permanent", durationTurns:0, desc:"+2 a percepción", visible:true},
    {id:uid(), name:"Sol Abrasador", type:"debuff", attr:"vida", bonus:"-50%", duration:"permanent", durationTurns:0, desc:"Reduce vida a la mitad", visible:true},
    {id:uid(), name:"Plata Ardiente", type:"debuff", attr:"daño", bonus:"1d6", duration:"permanent", durationTurns:0, desc:"1d6 de daño por contacto", visible:true},
    {id:uid(), name:"Drogado", type:"buff", attr:"destreza", bonus:"+1", duration:"turns", durationTurns:3, desc:"+1 a destreza por 3 turnos", visible:true},
    {id:uid(), name:"El Mono", type:"debuff", attr:"todo", bonus:"-1", duration:"turns", durationTurns:2, desc:"-1 a todo por 2 turnos", visible:true},
    {id:uid(), name:"Inmune al Veneno", type:"buff", attr:"veneno", bonus:"Inmune", duration:"permanent", durationTurns:0, desc:"Inmune a venenos", visible:true}
  ];
}

function blankCharacter(name, isNPC){
  return {
    id:uid(), name:name||"Nuevo Personaje", theme:"default", portrait:null,
    isNPC:!!isNPC,
    owner_id:null,
    ownerEmail:"",
    nivel:"1", lugarNacimiento:"", altura:"", peso:"", edad:"", ojos:"", pelo:"", trabajo:"", descripcion:"",
    attrs:{fisico:1,destreza:1,inteligencia:1,percepcion:1,carisma:1},
    skillBonus:{}, skillProgress:{}, skillPointsUnlocked:false,
    skillHybrid:{}, customSkills:[],
    combat:{iniciativa:0,movilidad:0,defensa:10,defensaMagica:0,pvActual:10,pvMax:10,escudoActual:0,manaActual:10,manaMax:10},
    weapons:[], armors:[], inventory:[], money:{oro:0,plata:0},
    magiaTipo:"", spells:[], stones:[], passivesNeg:[], passivesPos:[], goddessCurses:[], goddessBlessings:[], goddessTable:[],
    summons:[], buffs:{}, customBuffs:[], poisons:[], skillPoints:0,
    activeBuffs: [],
    personalNotes: ""
  };
}

function getOfficialCharacters(){
  return [
    // 1. CHERK
    {
      id: "char_cherk",
      db_id: "a8039428-8ee7-4e31-baba-c6a1d8b6d8f3",
      name: "Cherk",
      theme: "teal",
      portrait: null,
      isNPC: false,
      owner_id: "a8039428-8ee7-4e31-baba-c6a1d8b6d8f3",
      ownerEmail: "lolorey92@gmail.com",
      nivel: "1",
      lugarNacimiento: "Trysar",
      altura: "1,52",
      peso: "50",
      edad: "57",
      trabajo: "Pescador",
      ojos: "marrones",
      pelo: "largo, pobre y gris",
      descripcion: "",
      attrs: { fisico: 4, destreza: 8, inteligencia: 8, percepcion: 6, carisma: 4 },
      skillBonus: {
        advertir: 4, distancia: 2, melee: 1, atletismo: 1, buscar: 2,
        cabalgar: 0, callejeo: 0, comercio: 5, disfraz: 0, escalar: 0,
        esquivar: 2, etiqueta: 0, fauna: 4, leyes: 0, musica: 0,
        navegar: 4, nadar: 1, rastrear: 3, reflejos: 0, religion: 3,
        sigilo: 2, rumores: 2, bolsillos: 1, herboristeria: 6, auxilios: 1,
        supervivencia: 3, tradicion: 1, manos: 3, carisma_sk: 2, piedras: 1
      },
      skillProgress: {},
      skillPointsUnlocked: false,
      skillHybrid: { musica: "destreza", rumores: "percepcion" },
      customSkills: [
        { id: "csk_cherk_pesca", name: "Pesca", attr: "destreza", bonus: 5 }
      ],
      combat: {
        iniciativa: 6,
        movilidad: 8,
        defensa: 15,
        defensaMagica: 0,
        pvActual: 16,
        pvMax: 16,
        escudoActual: 0,
        manaActual: 40,
        manaMax: 40
      },
      weapons: [
        { id: "wp_inst_cherk_1", name: "Arpón con cuerda", dano: "1D6+2", alcance: "8m", critico: "", desc: "" },
        { id: "wp_inst_cherk_2", name: "Cerbatana", dano: "1D4+Veneno", alcance: "15m", critico: "", desc: "" },
        { id: "wp_inst_cherk_3", name: "Daga", dano: "1d4+2 / 1d4", alcance: "10m", critico: "", desc: "" }
      ],
      armors: [
        { id: "arm_cherk_cuero", name: "Cuero", absorcion: "2", estorbo: "0" }
      ],
      inventory: [
        { id: uid(), name: "Mochila", qty: 1 },
        { id: uid(), name: "Cuerda", qty: 1 },
        { id: uid(), name: "Caña de pescar", qty: 1 },
        { id: uid(), name: "Cebo", qty: 20 },
        { id: uid(), name: "Raciones de comida", qty: 10 },
        { id: uid(), name: "Tienda de campaña", qty: 1 },
        { id: uid(), name: "Dardos", qty: 25 },
        { id: uid(), name: "Muda", qty: 1 },
        { id: uid(), name: "Kit de yonki", qty: 1 },
        { id: uid(), name: "Kit de herboristería", qty: 1 },
        { id: uid(), name: "Pedernal", qty: 1 },
        { id: uid(), name: "Bases de venenos", qty: 30 },
        { id: uid(), name: "Vial: Seta del sueño", qty: 3 },
        { id: uid(), name: "Vial: Seta terrosa", qty: 2 },
        { id: uid(), name: "Vial: Nenúfar de Pantano", qty: 3 },
        { id: uid(), name: "Vial: Nenúfar de Manglar", qty: 4 },
        { id: uid(), name: "Vial: Flor de sombra", qty: 1 },
        { id: uid(), name: "Vial: Cactus", qty: 2 },
        { id: uid(), name: "Vial: Pez globo", qty: 1 }
      ],
      money: { oro: 25, plata: 0 },
      magiaTipo: "Toxicómano",
      spells: [
        { id: uid(), name: "Seta del sueño", coste: 3, rango: "3", efecto: "1 - No necesitas dormir (Máximo 1 noche)", statAttr: "", statMod: "", active: false },
        { id: uid(), name: "Seta terrosa", coste: 3, rango: "2", efecto: "1 - + Mitad de movilidad (4 Turnos)", statAttr: "movilidad", statMod: "+4", active: false },
        { id: uid(), name: "Nenúfar de Pantano", coste: 4, rango: "3", efecto: "1 - +2 a Percepción (20 min)", statAttr: "percepcion", statMod: "+2", active: false },
        { id: uid(), name: "Nenúfar de Manglar", coste: 4, rango: "4", efecto: "1 - +3 de vida falsa (hasta perderla)", statAttr: "Escudo / Vida Falsa", statMod: "+3", active: false },
        { id: uid(), name: "Flor de sombra", coste: 4, rango: "1", efecto: "1 - Visión en la oscuridad (20 min)", statAttr: "", statMod: "", active: false },
        { id: uid(), name: "Cactus", coste: 5, rango: "2", efecto: "1 - +1 a las acciones (3 Turnos)", statAttr: "", statMod: "+1", active: false },
        { id: uid(), name: "Pez globo", coste: 5, rango: "1", efecto: "1 - Respiración acuática (20 min)", statAttr: "", statMod: "", active: false },
        { id: uid(), name: "Amplificación del éxtasis", coste: 15, rango: "", efecto: "Reactiva el efecto del veneno", statAttr: "", statMod: "", active: false }
      ],
      stones: [],
      passivesNeg: [
        { id: uid(), text: "El mono: necesita pincharse un veneno mínimo cada 12h (máximo 2 veces seguidas el mismo). Si no se inyecta, -1 a todas las tiradas hasta que se chute y estaría muy ansioso." }
      ],
      passivesPos: [
        { id: uid(), text: "Inmune al veneno y si esta drogado con algún veneno, +1 a Destreza. (Un 0 en la columna de la izquierda sigue siendo un 0)." }
      ],
      goddessCurses: [],
      goddessBlessings: [],
      goddessTable: [],
      summons: [],
      buffs: {},
      customBuffs: [],
      poisons: [
        { id: uid(), name: "Seta del sueño", dosis: 3, efectoEnemigo: "Sueño / Paralización", efectoCherk: "No necesitas dormir (Máximo 1 noche)", estado: "descubierto" },
        { id: uid(), name: "Seta terrosa", dosis: 2, efectoEnemigo: "Entumecer", efectoCherk: "+ Mitad de movilidad (4 Turnos)", estado: "descubierto" },
        { id: uid(), name: "Nenúfar de Pantano", dosis: 3, efectoEnemigo: "Reduce Percepción rival", efectoCherk: "+2 a Percepción (20 min)", estado: "descubierto" },
        { id: uid(), name: "Nenúfar de Manglar", dosis: 4, efectoEnemigo: "Daño continuo", efectoCherk: "+3 de vida falsa (hasta perderla)", estado: "descubierto" },
        { id: uid(), name: "Flor de sombra", dosis: 1, efectoEnemigo: "", efectoCherk: "Visión en la oscuridad (20 min)", estado: "descubierto" },
        { id: uid(), name: "Cactus", dosis: 2, efectoEnemigo: "", efectoCherk: "+1 a las acciones (3 Turnos)", estado: "descubierto" },
        { id: uid(), name: "Pez globo", dosis: 1, efectoEnemigo: "", efectoCherk: "Respiración acuática (20 min)", estado: "descubierto" }
      ],
      skillPoints: 0,
      activeBuffs: [],
      personalNotes: ""
    },

    // 2. INK
    {
      id: "char_ink",
      db_id: "ece1cdb6-f8c6-4010-b3e8-045887dc92a3",
      name: "Ink",
      theme: "purple",
      portrait: null,
      isNPC: false,
      owner_id: "ece1cdb6-f8c6-4010-b3e8-045887dc92a3",
      ownerEmail: "martu@gmail.com",
      nivel: "1",
      lugarNacimiento: "Krysalis",
      altura: "1,60",
      peso: "X",
      edad: "240",
      trabajo: "Adiestradora",
      ojos: "Amarillos",
      pelo: "Blanco con coleta",
      descripcion: "",
      attrs: { fisico: 8, destreza: 8, inteligencia: 4, percepcion: 6, carisma: 4 },
      skillBonus: {
        advertir: 5, distancia: 1, melee: 4, atletismo: 3, buscar: 2,
        cabalgar: 2, callejeo: 2, comercio: 0, disfraz: 2, escalar: 2,
        esquivar: 5, etiqueta: 1, fauna: 6, leyes: 1, musica: 1,
        navegar: 1, nadar: 1, rastrear: 1, reflejos: 1, religion: 3,
        sigilo: 3, rumores: 0, bolsillos: 0, herboristeria: 0, auxilios: 3,
        supervivencia: 4, tradicion: 0, manos: 4, carisma_sk: 0, piedras: 0
      },
      skillProgress: {},
      skillPointsUnlocked: false,
      skillHybrid: { musica: "destreza", rumores: "percepcion" },
      customSkills: [
        { id: "csk_ink_adiestrar", name: "Adiestrar / Doma", attr: "destreza", bonus: 3 }
      ],
      combat: {
        iniciativa: 7,
        movilidad: 8,
        defensa: 18,
        defensaMagica: 0,
        pvActual: 32,
        pvMax: 32,
        escudoActual: 0,
        manaActual: 40,
        manaMax: 40
      },
      weapons: [
        { id: "wp_inst_ink_1", name: "Guadaña", dano: "2D6", alcance: "Melé", critico: "", desc: "" },
        { id: "wp_inst_ink_2", name: "Arco", dano: "1D6+3", alcance: "Distancia", critico: "", desc: "" },
        { id: "wp_inst_ink_3", name: "Mordisco Vampírico", dano: "1D6+3", alcance: "Melé", critico: "", desc: "" }
      ],
      armors: [
        { id: "arm_ink_cuero", name: "Cuero", absorcion: "2", estorbo: "0" }
      ],
      inventory: [
        { id: uid(), name: "Mochila", qty: 1 },
        { id: uid(), name: "Cuerda", qty: 1 },
        { id: uid(), name: "Raciones de comida", qty: 10 },
        { id: uid(), name: "Tienda de campaña", qty: 1 },
        { id: uid(), name: "Karcaj con 20 flechas", qty: 1 },
        { id: uid(), name: "Muda", qty: 1 },
        { id: uid(), name: "Pedernal", qty: 1 },
        { id: uid(), name: "Queso", qty: 10 },
        { id: uid(), name: "Candil con poción luminosa", qty: 1 },
        { id: uid(), name: "Baratijas", qty: 11 },
        { id: uid(), name: "Peluche de Ratita", qty: 1 }
      ],
      money: { oro: 140, plata: 0 },
      magiaTipo: "Vampiresa Animal",
      spells: [
        { id: uid(), name: "Ratita favorita", coste: 2, rango: "5m", efecto: "24h invocada, más inteligente", statAttr: "", statMod: "", active: false },
        { id: uid(), name: "Animales pequeños", coste: 4, rango: "5m", efecto: "(Máximo tamaño Rata)", statAttr: "", statMod: "", active: false },
        { id: uid(), name: "Animales medianos", coste: 8, rango: "5m", efecto: "(Máximo tamaño Lobo)", statAttr: "", statMod: "", active: false },
        { id: uid(), name: "Forma murciélago", coste: 6, rango: "", efecto: "(Maximo 2 veces dia / 30 min)", statAttr: "", statMod: "", active: false },
        { id: uid(), name: "Mordisco vampírico", coste: 8, rango: "", efecto: "(Te sanas la mitad del daño causado)", statAttr: "", statMod: "", active: false },
        { id: uid(), name: "Intimidación animal / Sumisión de criaturas", coste: 12, rango: "15m", efecto: "Sumisión de criaturas", statAttr: "", statMod: "", active: false }
      ],
      stones: [],
      passivesNeg: [
        { id: uid(), text: "Repetir sangre: Tienes que beber sangres distintas cada 2 mordiscos." },
        { id: uid(), text: "Sol: Reduce la vida máxima a la mitad y -1 a las acciones." },
        { id: uid(), text: "Plata: Recibe daño del contacto de la plata, sufres 1d6 de daño directo." },
        { id: uid(), text: "Fuego: Impide sanar cualquier daño causado por el fuego." }
      ],
      passivesPos: [
        { id: uid(), text: "Inmunidad al Sol." },
        { id: uid(), text: "1 más en ataque a mele o ataque a distancias." },
        { id: uid(), text: "2 más Percepción y ventaja en Advertir / Notar si hay sangre involucrada." }
      ],
      goddessCurses: [],
      goddessBlessings: [],
      goddessTable: [],
      summons: [
        {
          id: "summon_ink_rata",
          name: "Rata",
          vida: "4",
          defensa: "12",
          absorcion: "1",
          dano: "1d4+1",
          movilidad: "6 (T) / 3 (N)",
          inteligencia: "2",
          habilidades: "Melé 8+1d10, Atletismo 2+1d10, Inteligencia 2+1d10, Percepción 7+1d10, Sigilo 12+1d10, Supervivencia 10+1d10, Esquivar 7+1d10. Obtienen un +1 a acertar los ataques cuando otra rata o Ink están al lado del enemigo (+4 Máximo)."
        },
        {
          id: "summon_ink_murcielago",
          name: "Murciélago",
          vida: "5",
          defensa: "12",
          absorcion: "1",
          dano: "1d4+1",
          movilidad: "3 (T) / 7 (V)",
          inteligencia: "2",
          habilidades: "Melé 8+1d10, Atletismo 2+1d10, Inteligencia 2+1d10, Percepción 7+1d10, Sigilo 12+1d10, Supervivencia 8+1d10, Esquivar 8+1d10. Tiene ventaja en las tiradas de Percepción que se basen en sonido. Ruidos fuertes y estar ensordecido le impiden localizar."
        },
        {
          id: "summon_ink_cuervo",
          name: "Cuervo",
          vida: "8",
          defensa: "14",
          absorcion: "1",
          dano: "1d4+2",
          movilidad: "3 (T) / 9 (V)",
          inteligencia: "3",
          habilidades: "Melé 9+1d10, Atletismo 3+1d10, Inteligencia 3+1d10, Percepción 9+1d10, Sigilo 12+1d10, Supervivencia 12+1d10, Esquivar 9+1d10. Obtienen +1 a atacar si Ink u otro cuervo están cerca (+2 máximo). Percepción +2 para buscar objetos brillantes."
        }
      ],
      buffs: {},
      customBuffs: [],
      poisons: [],
      skillPoints: 0,
      activeBuffs: [],
      personalNotes: ""
    },

    // 3. BUCKY
    {
      id: "char_baky",
      db_id: "4d8dd9b1-b5aa-430e-ae19-79c35b6c3c5e",
      name: "Bucky",
      theme: "blue",
      portrait: null,
      isNPC: false,
      owner_id: "bcfb51f6-4916-4650-b842-0eaf7f8335f4",
      ownerEmail: "piki@gmail.com",
      nivel: "1",
      lugarNacimiento: "Asland",
      altura: "1,70",
      peso: "70",
      edad: "18",
      trabajo: "Emisario (Lameculos)",
      ojos: "azul",
      pelo: "marrón corto",
      descripcion: "",
      attrs: { fisico: 5, destreza: 7, inteligencia: 8, percepcion: 6, carisma: 4 },
      skillBonus: {
        advertir: 4, distancia: 5, melee: 4, atletismo: 5, buscar: 3,
        cabalgar: 1, callejeo: 1, comercio: 0, disfraz: 0, escalar: 3,
        esquivar: 6, etiqueta: 1, fauna: 2, leyes: 0, musica: 0,
        navegar: 2, nadar: 3, rastrear: 1, reflejos: 2, religion: 3,
        sigilo: 4, rumores: 2, bolsillos: 0, herboristeria: 0, auxilios: 2,
        supervivencia: 2, tradicion: 0, manos: 2, carisma_sk: 1, piedras: 0
      },
      skillProgress: {},
      skillPointsUnlocked: false,
      skillHybrid: { musica: "destreza", rumores: "carisma" },
      customSkills: [],
      combat: {
        iniciativa: 8,
        movilidad: 7,
        defensa: 18,
        defensaMagica: 0,
        pvActual: 20,
        pvMax: 20,
        escudoActual: 0,
        manaActual: 35,
        manaMax: 35
      },
      weapons: [
        { id: "wp_inst_baky_1", name: "Kusarigama", dano: "1D6+2", alcance: "2m", critico: "", desc: "" },
        { id: "wp_inst_baky_2", name: "Daga", dano: "1d4+2 / 1d4", alcance: "10m", critico: "", desc: "" },
        { id: "wp_inst_baky_3", name: "Arco", dano: "1D6+3", alcance: "Distancia", critico: "", desc: "" }
      ],
      armors: [
        { id: "arm_baky_cuero", name: "Cuero", absorcion: "2", estorbo: "0" }
      ],
      inventory: [
        { id: uid(), name: "Mochila", qty: 1 },
        { id: uid(), name: "Cuerda", qty: 1 },
        { id: uid(), name: "Raciones de comida", qty: 10 },
        { id: uid(), name: "Tienda de campaña", qty: 1 },
        { id: uid(), name: "Karcaj con 20 flechas", qty: 1 },
        { id: uid(), name: "Muda", qty: 1 },
        { id: uid(), name: "Pedernal", qty: 1 },
        { id: uid(), name: "Candil", qty: 1 },
        { id: uid(), name: "Aceite de candil", qty: 10 },
        { id: uid(), name: "Tés y set de tés", qty: 1 }
      ],
      money: { oro: 25, plata: 0 },
      magiaTipo: "Marionetista",
      spells: [
        { id: uid(), name: "Marioneta humanoide normal", coste: 5, rango: "15m", efecto: "Tirada enfrentada: Inteligencia+nivel+dado (Combate 1 turno, fuera de combate 1min)", statAttr: "", statMod: "", active: false },
        { id: uid(), name: "Marioneta humanoide con magia", coste: 8, rango: "15m", efecto: "Marioneta humanoide con magia", statAttr: "", statMod: "", active: false },
        { id: uid(), name: "Marioneta discreta", coste: 6, rango: "15m", efecto: "Marioneta discreta", statAttr: "", statMod: "", active: false },
        { id: uid(), name: "Marioneta animal (pequeño)", coste: 4, rango: "15m", efecto: "Marioneta animal pequeño", statAttr: "", statMod: "", active: false },
        { id: uid(), name: "Re-atadura", coste: 10, rango: "15m", efecto: "Re-atadura de marioneta", statAttr: "", statMod: "", active: false }
      ],
      stones: [],
      passivesNeg: [],
      passivesPos: [],
      goddessCurses: [],
      goddessBlessings: [],
      goddessTable: [],
      summons: [],
      buffs: {},
      customBuffs: [],
      poisons: [],
      skillPoints: 0,
      activeBuffs: [],
      personalNotes: ""
    },

    // 4. SCARLETH / WINTER
    {
      id: "char_scarleth",
      db_id: "5e9c545e-176a-4e99-a3e7-299f89fa0779",
      name: "Scarleth",
      theme: "default",
      portrait: null,
      isNPC: false,
      owner_id: "5e9c545e-176a-4e99-a3e7-299f89fa0779",
      ownerEmail: "saray@gmail.com",
      nivel: "1",
      lugarNacimiento: "Krysalis",
      altura: "1,72",
      peso: "x",
      edad: "192",
      trabajo: "Noble",
      ojos: "verdes",
      pelo: "pelirrojo y liso",
      descripcion: "",
      attrs: { fisico: 6, destreza: 8, inteligencia: 4, percepcion: 5, carisma: 7 },
      skillBonus: {
        advertir: 6, distancia: 3, melee: 5, atletismo: 4, buscar: 1,
        cabalgar: 2, callejeo: 1, comercio: 1, disfraz: 0, escalar: 2,
        esquivar: 4, etiqueta: 1, fauna: 0, leyes: 1, musica: 1,
        navegar: 0, nadar: 2, rastrear: 1, reflejos: 3, religion: 3,
        sigilo: 4, rumores: 3, bolsillos: 0, herboristeria: 0, auxilios: 3,
        supervivencia: 0, tradicion: 2, manos: 2, carisma_sk: 3, piedras: 1
      },
      skillProgress: {},
      skillPointsUnlocked: false,
      skillHybrid: { musica: "destreza", rumores: "carisma" },
      customSkills: [
        { id: "csk_scarleth_bailar", name: "Bailar", attr: "destreza", bonus: 1 }
      ],
      combat: {
        iniciativa: 8,
        movilidad: 8,
        defensa: 17,
        defensaMagica: 0,
        pvActual: 24,
        pvMax: 24,
        escudoActual: 0,
        manaActual: 40,
        manaMax: 40
      },
      weapons: [
        { id: "wp_inst_scar_1", name: "Látigo", dano: "1D6+3", alcance: "1m", critico: "", desc: "" },
        { id: "wp_inst_scar_2", name: "Guja", dano: "1D6+3", alcance: "1m", critico: "", desc: "" },
        { id: "wp_inst_scar_3", name: "Arco", dano: "1D6+3", alcance: "Distancia", critico: "", desc: "" },
        { id: "wp_inst_scar_4", name: "Mordisco Vampírico", dano: "1D6+3", alcance: "Melé", critico: "", desc: "" }
      ],
      armors: [
        { id: "arm_scar_cuero", name: "Cuero", absorcion: "2", estorbo: "0" }
      ],
      inventory: [
        { id: uid(), name: "Mochila", qty: 1 },
        { id: uid(), name: "Cuerda", qty: 1 },
        { id: uid(), name: "Viales de sangre", qty: 10 },
        { id: uid(), name: "Karcaj con 20 flechas", qty: 1 },
        { id: uid(), name: "Mudas", qty: 2 },
        { id: uid(), name: "Candil con poción luminosa", qty: 1 },
        { id: uid(), name: "Daga bonita cara", qty: 1 },
        { id: uid(), name: "Joyas", qty: 4 },
        { id: uid(), name: "Sombrilla", qty: 1 },
        { id: uid(), name: "Capa de terciopelo", qty: 1 },
        { id: uid(), name: "Peine bueno", qty: 1 },
        { id: uid(), name: "Perfume", qty: 1 },
        { id: uid(), name: "Espejo útil", qty: 1 },
        { id: uid(), name: "Kit médico", qty: 1 },
        { id: uid(), name: "Pamela", qty: 1 },
        { id: uid(), name: "Broche para capa", qty: 1 },
        { id: uid(), name: "Viales vacíos", qty: 5 },
        { id: uid(), name: "Pañuelos de seda", qty: 1 },
        { id: uid(), name: "Maquillaje", qty: 1 },
        { id: uid(), name: "Cáliz de oro", qty: 1 },
        { id: uid(), name: "Guantes", qty: 1 },
        { id: uid(), name: "Mantita Astarion", qty: 1 }
      ],
      money: { oro: 200, plata: 0 },
      magiaTipo: "Vampiresa",
      spells: [
        { id: uid(), name: "Control mental", coste: 5, rango: "15 metros", efecto: "(1 turno combate / 1 min fuera). Tirada enfrentada: Carisma+nivel+dado", statAttr: "", statMod: "", active: false },
        { id: uid(), name: "Leer pensamientos", coste: 7, rango: "15 metros", efecto: "(Instante de uso)", statAttr: "", statMod: "", active: false },
        { id: uid(), name: "Crear con sangre", coste: 6, rango: "5 metros", efecto: "(objetos pequeños, máx una daga) (24h)", statAttr: "", statMod: "", active: false },
        { id: uid(), name: "Forma murciélago", coste: 6, rango: "", efecto: "(Maximo 2 veces dia / 30 min)", statAttr: "", statMod: "", active: false },
        { id: uid(), name: "Mordisco vampírico (sanar)", coste: 8, rango: "", efecto: "Sanar la mitad del daño causado", statAttr: "", statMod: "", active: false },
        { id: uid(), name: "Hablar con los vástagos", coste: 2, rango: "50 metros", efecto: "Comunicación con los Vástagos", statAttr: "", statMod: "", active: false },
        { id: uid(), name: "Mordisco vampírico (crear vástago)", coste: 6, rango: "", efecto: "1d4 - Comer y crear vástago (Coste 0 ó 6)", statAttr: "", statMod: "", active: false }
      ],
      stones: [
        { id: uid(), color: "Roja", efecto: "Piedra mágica roja" },
        { id: uid(), color: "Arcoíris", efecto: "Piedra mágica multicolor" }
      ],
      passivesNeg: [
        { id: uid(), text: "Repetir sangre: Tienes que beber sangres distintas cada 2 mordiscos." },
        { id: uid(), text: "Sol: Reduce la vida máxima a la mitad y -1 a las acciones." },
        { id: uid(), text: "Plata: Recibe daño del contacto de la plata, sufres 1d6 de daño directo." },
        { id: uid(), text: "Fuego: Impide sanar cualquier daño causado por el fuego." }
      ],
      passivesPos: [
        { id: uid(), text: "Inmunidad al Sol." },
        { id: uid(), text: "1 más en ataque a mele o ataque a distancias." },
        { id: uid(), text: "2 más Percepción y ventaja en Advertir / Notar si hay sangre involucrada." }
      ],
      goddessCurses: [],
      goddessBlessings: [],
      goddessTable: [
        { id: uid(), name: "Luna", gustos: "Noche", disgustos: "" }
      ],
      summons: [],
      buffs: {},
      customBuffs: [],
      poisons: [],
      skillPoints: 0,
      activeBuffs: [],
      personalNotes: ""
    },

    // 5. DEREK (Personaje jugable de Scarleth)
    {
      id: "char_derek",
      db_id: "d9dee50e-051d-4058-b4a5-d46c809fbb25",
      name: "Derek",
      theme: "purple",
      portrait: null,
      isNPC: false,
      owner_id: "5e9c545e-176a-4e99-a3e7-299f89fa0779",
      ownerEmail: "saray@gmail.com",
      nivel: "1 Vástago",
      lugarNacimiento: "Krysalis",
      altura: "1,69",
      peso: "65",
      edad: "20+76",
      trabajo: "Vástago",
      ojos: "heterocromía (azul y rojo)",
      pelo: "Bicolor negro blanco",
      descripcion: "Vástago de Krysalis",
      attrs: { fisico: 8, destreza: 6, inteligencia: 8, percepcion: 8, carisma: 5 },
      skillBonus: {
        advertir: 3, distancia: 4, melee: 5, atletismo: 3, buscar: 1,
        cabalgar: 2, callejeo: 0, comercio: 1, disfraz: 0, escalar: 3,
        esquivar: 6, etiqueta: 0, fauna: 0, leyes: 1, musica: 0,
        navegar: 0, nadar: 2, rastrear: 0, reflejos: 0, religion: 3,
        sigilo: 4, rumores: 0, bolsillos: 0, herboristeria: 0, auxilios: 1,
        supervivencia: 1, tradicion: 0, manos: 2, carisma_sk: 1, piedras: 0
      },
      skillProgress: {},
      skillPointsUnlocked: false,
      skillHybrid: { musica: "destreza", rumores: "percepcion" },
      customSkills: [],
      combat: {
        iniciativa: 8,
        movilidad: 6,
        defensa: 17,
        defensaMagica: 0,
        pvActual: 32,
        pvMax: 32,
        escudoActual: 0,
        manaActual: 30,
        manaMax: 30
      },
      weapons: [
        { id: "wp_inst_derek_1", name: "Sable bonito", dano: "1D6+3", alcance: "Melé", critico: "", desc: "" },
        { id: "wp_inst_derek_2", name: "Garras lobezno", dano: "1d4+2 / 1d4", alcance: "Melé", critico: "", desc: "" },
        { id: "wp_inst_derek_3", name: "Martillo a dos manos", dano: "2d6", alcance: "Melé", critico: "", desc: "" },
        { id: "wp_inst_derek_4", name: "Arco", dano: "1D6+3", alcance: "Distancia", critico: "", desc: "" },
        { id: "wp_inst_derek_5", name: "Mordisco Vampírico", dano: "1D6+3", alcance: "Melé", critico: "", desc: "" }
      ],
      armors: [
        { id: "arm_derek_cuero", name: "Cuero", absorcion: "2", estorbo: "0" }
      ],
      inventory: [
        { id: uid(), name: "Mochila", qty: 1 },
        { id: uid(), name: "Cuerda", qty: 1 },
        { id: uid(), name: "Raciones de comida", qty: 10 },
        { id: uid(), name: "Tienda de campaña", qty: 1 },
        { id: uid(), name: "Karcaj con 20 flechas", qty: 1 },
        { id: uid(), name: "Muda", qty: 1 },
        { id: uid(), name: "Pedernal", qty: 1 }
      ],
      money: { oro: 0, plata: 0 },
      magiaTipo: "Vástago",
      spells: [
        { id: uid(), name: "Mordisco Vampírico", coste: 8, rango: "Melé", efecto: "Sanas la mitad del daño causado", statAttr: "", statMod: "", active: false }
      ],
      stones: [],
      passivesNeg: [
        { id: uid(), text: "Repetir sangre: Tienes que beber sangres distintas cada 2 mordiscos." },
        { id: uid(), text: "Sol: Reduce la vida máxima a la mitad y -1 a las acciones." },
        { id: uid(), text: "Plata: Recibe daño del contacto de la plata, sufres 1d6 de daño directo." },
        { id: uid(), text: "Fuego: Impide sanar cualquier daño causado por el fuego." }
      ],
      passivesPos: [
        { id: uid(), text: "El Sol solo le reduce 1/5 de su vida maxima." },
        { id: uid(), text: "1 más en ataque a mele o ataque a distancias." },
        { id: uid(), text: "1 en advertir notar." }
      ],
      goddessCurses: [],
      goddessBlessings: [],
      goddessTable: [],
      summons: [],
      buffs: {},
      customBuffs: [],
      poisons: [],
      skillPoints: 0,
      activeBuffs: [],
      personalNotes: ""
    }
  ];
}

function resetCharactersToOfficial(keepPortraits){
  var officials = getOfficialCharacters();
  state.characters = state.characters || [];

  var scarlethChar = state.characters.find(function(c){
    var n = (c.name || "").toLowerCase();
    return n === "scarleth" || n.includes("scarleth") || n.includes("winter");
  });
  var scarlethOwner = scarlethChar ? scarlethChar.owner_id : null;
  var scarlethEmail = scarlethChar ? scarlethChar.ownerEmail : "";

  officials.forEach(function(off){
    var existing = state.characters.find(function(c){
      var cName = (c.name || "").trim().toLowerCase();
      var oName = off.name.trim().toLowerCase();
      if(oName === "derek") return cName === "derek";
      if(oName === "scarleth") return cName === "scarleth" || cName.includes("scarleth") || cName.includes("winter");
      if(oName === "bucky") return cName === "bucky" || cName === "baky" || cName.includes("bucky") || cName.includes("baky");
      if(oName === "cherk") return cName === "cherk" || cName.includes("cherk");
      if(oName === "ink") return cName === "ink" || cName.includes("ink");
      return cName === oName;
    });
    if(existing){
      var savedPortrait = (keepPortraits !== false) ? (existing.portrait || off.portrait) : off.portrait;
      var savedOwner = existing.owner_id || (off.name === "Derek" && scarlethOwner ? scarlethOwner : off.owner_id);
      var savedTheme = existing.theme || off.theme;
      var savedDbId = existing.db_id;
      var savedEmail = existing.ownerEmail || (off.name === "Derek" && scarlethEmail ? scarlethEmail : off.ownerEmail);
      var savedId = existing.id;
      Object.assign(existing, JSON.parse(JSON.stringify(off)));
      existing.id = savedId;
      if(savedDbId) existing.db_id = savedDbId;
      existing.portrait = savedPortrait;
      existing.owner_id = savedOwner;
      existing.ownerEmail = savedEmail;
      existing.theme = savedTheme;
      existing.officialDataVersion = 4;
    } else {
      var nOff = JSON.parse(JSON.stringify(off));
      if(nOff.name === "Derek" && scarlethOwner){
        nOff.owner_id = scarlethOwner;
        nOff.ownerEmail = scarlethEmail;
      }
      nOff.officialDataVersion = 4;
      state.characters.push(nOff);
    }
  });

  state.characters = state.characters.filter(function(c){
    var n = (c.name || "").trim().toLowerCase();
    return n !== "sin personaje" && n !== "nuevo personaje" && n !== "kaelen mago";
  });

  if(!state.characters.some(function(c){ return c.id === state.activeId; })){
    state.activeId = state.characters[0] ? state.characters[0].id : "";
  }
}

function getSeedBestiary(){
  return [
    {id:uid(),nombre:"Kimera",continente:"Vetrys",vida:"70",defensa:"15",absorcion:"3",dano:"1d6+3",movilidad:"10 (T/V)",casillasMovimiento:"10",doma:"5",montable:true,rarity:"Muy rara",habilidades:"Doma: 5. Cabalgar: 1/1. Terreno: T/V. Nada a mitad de mov.",visible:true},
    {id:uid(),nombre:"Anaconda G.",continente:"Tryssar",vida:"60",defensa:"16",absorcion:"4",dano:"1d6+2",movilidad:"8 (T)",casillasMovimiento:"8",doma:"5",montable:true,rarity:"Rara",habilidades:"Doma: 5. Cabalgar: 5. Carga pesada. Nada.",visible:true},
    {id:uid(),nombre:"Infernal",continente:"Labrys",vida:"70",defensa:"16",absorcion:"4",dano:"2d6",movilidad:"12 (T)",casillasMovimiento:"12",doma:"5",montable:true,rarity:"Muy rara",habilidades:"Doma: 5. Cabalgar: 1. Carga pesada. No puede nadar.",visible:true},
    {id:uid(),nombre:"Pegaso",continente:"Labrys",vida:"60",defensa:"15",absorcion:"3",dano:"1d6+2",movilidad:"10/12 (T/V)",casillasMovimiento:"12",doma:"5",montable:true,rarity:"Legendaria",habilidades:"Doma: 5. Cabalgar: 2. Montura voladora. Nada a mitad de mov.",visible:true},
    {id:uid(),nombre:"Hypocampo",continente:"Labrys",vida:"60",defensa:"15",absorcion:"3",dano:"1d6+2",movilidad:"12 (A)",casillasMovimiento:"12",doma:"5",montable:true,rarity:"Rara",habilidades:"Doma: 5. Cabalgar: 1. Carga pesada. Acuático.",visible:true},
    {id:uid(),nombre:"Lagarto",continente:"Aslan",vida:"60",defensa:"16",absorcion:"3",dano:"1d6+2",movilidad:"10 (T/A)",casillasMovimiento:"10",doma:"5",montable:true,rarity:"Rara",habilidades:"Doma: 5. Cabalgar: 2. Carga normal. Nada a mitad de mov.",visible:true},
    {id:uid(),nombre:"Oso Perro",continente:"Krysalis",vida:"80",defensa:"17",absorcion:"3",dano:"1d6+3",movilidad:"8 (T)",casillasMovimiento:"8",doma:"5",montable:true,rarity:"Rara",habilidades:"Doma: 5. Cabalgar: 1. Carga pesada. Nada a mitad de mov.",visible:true},
    {id:uid(),nombre:"Burro",continente:"Todos",vida:"20",defensa:"12",absorcion:"2",dano:"1d4",movilidad:"8 (T)",casillasMovimiento:"8",doma:"3",montable:true,rarity:"Común",habilidades:"Doma: 3. Cabalgar: 1. Carga normal. Nada a mitad de mov.",visible:true},
    {id:uid(),nombre:"Caballo",continente:"Todos",vida:"30",defensa:"12",absorcion:"2",dano:"1d6",movilidad:"8 (T)",casillasMovimiento:"8",doma:"3",montable:true,rarity:"Común",habilidades:"Doma: 3. Cabalgar: 2. Carga normal. Nada a mitad de mov.",visible:true},
    {id:uid(),nombre:"Caballo XL",continente:"Todos",vida:"40",defensa:"12",absorcion:"2",dano:"1d6+1",movilidad:"8 (T)",casillasMovimiento:"8",doma:"4",montable:true,rarity:"Común",habilidades:"Doma: 4. Cabalgar: 2. Carga pesada. Nada a mitad de mov.",visible:true},
    {id:uid(),nombre:"Camello",continente:"Aslan",vida:"30",defensa:"12",absorcion:"2",dano:"1d6",movilidad:"8 (T)",casillasMovimiento:"8",doma:"3",montable:true,rarity:"Común",habilidades:"Doma: 3. Cabalgar: 2. Carga normal. Nada a mitad de mov.",visible:true},
    {id:uid(),nombre:"Elefante",continente:"Tryssar",vida:"60",defensa:"15",absorcion:"3",dano:"2d6",movilidad:"7 (T)",casillasMovimiento:"7",doma:"4",montable:true,rarity:"Rara",habilidades:"Doma: 4. Cabalgar: 4. Carga pesada. Nada a mitad de mov.",visible:true},
    {id:uid(),nombre:"Osos",continente:"Todos",vida:"50",defensa:"13",absorcion:"3",dano:"1d6+2",movilidad:"7 (T)",casillasMovimiento:"7",doma:"4",montable:true,rarity:"Común",habilidades:"Doma: 4. Cabalgar: 2. Carga pesada. Nada a mitad de mov.",visible:true},
    {id:uid(),nombre:"Buey / Toro",continente:"Todos",vida:"40",defensa:"13",absorcion:"2",dano:"1d6+1",movilidad:"8 (T)",casillasMovimiento:"8",doma:"3",montable:true,rarity:"Común",habilidades:"Doma: 3. Carga pesada. Nada a mitad de mov.",visible:true},
    {id:uid(),nombre:"Lobo XL",continente:"Todos",vida:"40",defensa:"13",absorcion:"2",dano:"1d6+2",movilidad:"9 (T)",casillasMovimiento:"9",doma:"4",montable:true,rarity:"Común",habilidades:"Doma: 4. Cabalgar: 1. Carga normal. Nada a mitad de mov.",visible:true},
    {id:uid(),nombre:"Avestruz",continente:"Aslan",vida:"20",defensa:"10",absorcion:"0",dano:"1d4+1",movilidad:"9 (T)",casillasMovimiento:"9",doma:"3",montable:true,rarity:"Común",habilidades:"Doma: 3. Cabalgar: 1. Nada a mitad de mov.",visible:true},
    {id:uid(),nombre:"Lobo Cría",continente:"Todos",vida:"10",defensa:"13",absorcion:"2",dano:"1d4+2",movilidad:"8 (T)",casillasMovimiento:"8",doma:"3",montable:false,rarity:"Común",habilidades:"Doma: 3. Inteligencia: 2. Nada a mitad de mov.",visible:true},
    {id:uid(),nombre:"Lobo",continente:"Todos",vida:"40",defensa:"13",absorcion:"2",dano:"1d6+2/+3",movilidad:"8 (T)",casillasMovimiento:"8",doma:"3",montable:false,rarity:"Común",habilidades:"Doma: 3. Inteligencia: 3. Nada a mitad de mov.",visible:true},
    {id:uid(),nombre:"Lobo Ártico",continente:"Aslan",vida:"40",defensa:"13",absorcion:"2",dano:"1d6+2/+3",movilidad:"8 (T)",casillasMovimiento:"8",doma:"3",montable:false,rarity:"Común",habilidades:"Doma: 3. Inteligencia: 3. Resistencia al frío ambiente. Nada a mitad de mov.",visible:true},
    {id:uid(),nombre:"Lobo Entrenado",continente:"Todos",vida:"60",defensa:"16",absorcion:"2",dano:"1d6+2/+3",movilidad:"9 (T)",casillasMovimiento:"9",doma:"5",montable:false,rarity:"Rara",habilidades:"Doma: 5. Inteligencia: 4. Ataque entrenado. Nada a mitad de mov.",visible:true},
    {id:uid(),nombre:"Lobo Ártico Entrenado",continente:"Aslan",vida:"60",defensa:"16",absorcion:"2",dano:"1d6+2/+3",movilidad:"9 (T)",casillasMovimiento:"9",doma:"5",montable:false,rarity:"Rara",habilidades:"Doma: 5. Inteligencia: 4. Resistencia al frío ambiente. Nada a mitad de mov.",visible:true}
  ];
}

function migrateBestiaryData(bestiary){
  if(!Array.isArray(bestiary)) return;
  bestiary.forEach(function(b){
    if(b.notas && !b.habilidades) b.habilidades = b.notas;
    if(b.habilidades === undefined) b.habilidades = "";
    if(b.visible === undefined) b.visible = true;
    if(b.rarity === undefined || !b.rarity) b.rarity = "Común";
    var text = (b.habilidades || "") + " " + (b.notas || "");
    if(b.montable === undefined){
      b.montable = /cabalgar|montura/i.test(text);
    }
    if(b.doma === undefined || b.doma === "" || b.doma === null){
      var m = text.match(/doma\s*:\s*(\d+)/i);
      b.doma = m ? m[1] : "3";
    }
    if(b.casillasMovimiento === undefined || b.casillasMovimiento === "" || b.casillasMovimiento === null){
      var mov = (b.movilidad || "");
      var mDigits = mov.match(/(\d+)/);
      b.casillasMovimiento = mDigits ? mDigits[1] : "8";
    }
  });
}

function getSeedLore(){
  return {
    pistas:[
      {id:uid(),title:"Santuario de las Diosas",text:"Lugar de comunión con Luna y los Elementos.",continent:"Krysalis",rarity:"Muy rara",type:"Lugar",visible:true}
    ],
    npcs:[
      {id:uid(),title:"Emisario de Asland",text:"Representante diplomático del reino.",continent:"Aslan",rarity:"Común",type:"Aliado",visible:true}
    ],
    objetos:[
      // Venenos Oficiales (Págs. 10 y 11)
      {id:uid(),title:"Veneno: Amanita (Base)",text:"Efecto: Base de venenos (Muy común)",terrain:"Bosque",rarity:"Común",continent:"Todos",type:"Veneno",visible:true},
      {id:uid(),title:"Veneno: Seta del sueño",text:"Efecto: Sueño / Paralización (Común)",terrain:"Bosque",rarity:"Común",continent:"Todos",type:"Veneno",visible:true},
      {id:uid(),title:"Veneno: Seta terrosa",text:"Efecto: Entumecer (+ Mitad Movilidad para Cherk)",terrain:"Minas / Cuevas",rarity:"Común",continent:"Todos",type:"Veneno",visible:true},
      {id:uid(),title:"Veneno: Nenúfar P",text:"Efecto: Reduce Percepción rival (+2 Percepción Cherk)",terrain:"Pantano",rarity:"Común",continent:"Todos",type:"Veneno",visible:true},
      {id:uid(),title:"Veneno: Nenúfar M",text:"Efecto: Daño continuo (+3 vida falsa Cherk)",terrain:"Manglar",rarity:"Común",continent:"Todos",type:"Veneno",visible:true},
      {id:uid(),title:"Veneno: Flor del Caído",text:"Efecto: Mortal",terrain:"Jungla",rarity:"Muy rara",continent:"Todos",type:"Veneno",visible:true},
      {id:uid(),title:"Veneno: Flor de Sombra",text:"Efecto: Ceguera (Visión en la oscuridad para Cherk)",terrain:"Bosques",rarity:"Rara",continent:"Todos",type:"Veneno",visible:true},
      {id:uid(),title:"Veneno: Cactus",text:"Efecto: Urticante (+1 a las acciones Cherk)",terrain:"Desierto",rarity:"Común",continent:"Todos",type:"Veneno",visible:true},
      {id:uid(),title:"Veneno: Corteza Congelada",text:"Efecto: Congela al rival",terrain:"Árboles congelados",rarity:"Rara",continent:"Todos",type:"Veneno",visible:true},
      {id:uid(),title:"Veneno: Seta Secante",text:"Efecto: Deshidrata",terrain:"Arslan",rarity:"Común",continent:"Aslan",type:"Veneno",visible:true},
      {id:uid(),title:"Veneno: Flor de volcán",text:"Efecto: Azufre corrosivo",terrain:"Montañas",rarity:"Rara",continent:"Todos",type:"Veneno",visible:true},
      {id:uid(),title:"Veneno: Baya V de arbusto",text:"Efecto: Visión en blanco y negro",terrain:"Bosque",rarity:"Común",continent:"Todos",type:"Veneno",visible:true},
      {id:uid(),title:"Veneno: Baya N de arbusto",text:"Efecto: Duerme la lengua",terrain:"Bosque",rarity:"Común",continent:"Todos",type:"Veneno",visible:true},
      {id:uid(),title:"Veneno: Quimera",text:"Efecto: Paraliza",terrain:"Minas / Cuevas",rarity:"Muy rara",continent:"Vetrys",type:"Veneno",visible:true},
      {id:uid(),title:"Veneno: Escorpión de cobre",text:"Efecto: Quemadura de sol",terrain:"Desierto",rarity:"Rara",continent:"Aslan",type:"Veneno",visible:true},
      {id:uid(),title:"Veneno: Flor N de oasis",text:"Efecto: Ceguera",terrain:"Oasis",rarity:"Rara",continent:"Aslan",type:"Veneno",visible:true},
      {id:uid(),title:"Veneno: Escorpión negro",text:"Efecto: Dolor fatal",terrain:"Desierto",rarity:"Muy rara",continent:"Aslan",type:"Veneno",visible:true},
      {id:uid(),title:"Veneno: Sudor de pájaro",text:"Efecto: Corrosivo",terrain:"Jungla",rarity:"Rara",continent:"Todos",type:"Veneno",visible:true},
      {id:uid(),title:"Veneno: Melocotón pinch",text:"Efecto: Adicción severa",terrain:"Praderas",rarity:"Común",continent:"Todos",type:"Veneno",visible:true},
      {id:uid(),title:"Veneno: Calamar gigante",text:"Efecto: Indigestión masiva",terrain:"Aguas profundas",rarity:"Rara",continent:"Todos",type:"Veneno",visible:true},
      {id:uid(),title:"Veneno: V. de serpiente",text:"Efecto: Pesadilla",terrain:"Pantano",rarity:"Rara",continent:"Tryssar",type:"Veneno",visible:true},

      // Pociones Oficiales (Págs. 10 y 11)
      {id:uid(),title:"Poción: Alga playa (Base)",text:"Efecto: Base de pociones (Muy común)",terrain:"Playa",rarity:"Común",continent:"Todos",type:"Poción",visible:true},
      {id:uid(),title:"Poción: Musgo V",text:"Efecto: Emite Luz Verde",terrain:"Minas / Cuevas",rarity:"Común",continent:"Todos",type:"Poción",visible:true},
      {id:uid(),title:"Poción: Flor del Rey",text:"Efecto: +Defensa mágica temporal",terrain:"Bosque",rarity:"Muy rara",continent:"Todos",type:"Poción",visible:true},
      {id:uid(),title:"Poción: Flor de Lirio P",text:"Efecto: Cura venenos y toxinas",terrain:"Pantano",rarity:"Muy rara",continent:"Todos",type:"Poción",visible:true},
      {id:uid(),title:"Poción: Raíz Manglar",text:"Efecto: Crecimiento de Plantas acelerado",terrain:"Manglar",rarity:"Común",continent:"Todos",type:"Poción",visible:true},
      {id:uid(),title:"Poción: Flor del día",text:"Efecto: +Vitalidad temporal",terrain:"Jungla",rarity:"Muy rara",continent:"Todos",type:"Poción",visible:true},
      {id:uid(),title:"Poción: Crisantemo",text:"Efecto: +Percepción",terrain:"Praderas",rarity:"Común",continent:"Todos",type:"Poción",visible:true},
      {id:uid(),title:"Poción: Flor de Oasis",text:"Efecto: Regeneración de Maná / Energía",terrain:"Oasis",rarity:"Muy rara",continent:"Aslan",type:"Poción",visible:true},
      {id:uid(),title:"Poción: Musgo A",text:"Efecto: Emite Luz Azul",terrain:"Minas / Cuevas",rarity:"Común",continent:"Todos",type:"Poción",visible:true},
      {id:uid(),title:"Poción: Flor de cristal",text:"Efecto: Regeneración celular avanzada",terrain:"Montañas Nevadas",rarity:"Muy rara",continent:"Todos",type:"Poción",visible:true},
      {id:uid(),title:"Poción: Seta del sueño",text:"Efecto: Melatonina concentrada",terrain:"Bosque",rarity:"Común",continent:"Todos",type:"Poción",visible:true},
      {id:uid(),title:"Poción: Flor melosa",text:"Efecto: Dulce sedante",terrain:"Praderas",rarity:"Común",continent:"Todos",type:"Poción",visible:true},
      {id:uid(),title:"Poción: Baya V arbusto",text:"Efecto: Otorga Visión nocturna",terrain:"Bosque",rarity:"Rara",continent:"Todos",type:"Poción",visible:true},

      // Ungüentos Oficiales (Págs. 10 y 11)
      {id:uid(),title:"Ungüento: Musgo de río (Base)",text:"Efecto: Base de ungüentos (Muy común)",terrain:"Ríos",rarity:"Común",continent:"Todos",type:"Ungüento",visible:true},
      {id:uid(),title:"Ungüento: Flor de Aire",text:"Efecto: Mejorador de ungüentos",terrain:"Montañas",rarity:"Rara",continent:"Todos",type:"Ungüento",visible:true},
      {id:uid(),title:"Ungüento: Margarita",text:"Efecto: Curación básica de heridas",terrain:"Praderas",rarity:"Común",continent:"Todos",type:"Ungüento",visible:true},
      {id:uid(),title:"Ungüento: Margarita x2",text:"Efecto: Curación animal",terrain:"Praderas",rarity:"Común",continent:"Todos",type:"Ungüento",visible:true},
      {id:uid(),title:"Ungüento: Musgo Olor",text:"Efecto: Rastreo de feromonas y pistas",terrain:"Pantano",rarity:"Común",continent:"Todos",type:"Ungüento",visible:true},
      {id:uid(),title:"Ungüento: Flor de agua",text:"Efecto: Apnea prolongada bajo el agua",terrain:"Aguas profundas",rarity:"Rara",continent:"Todos",type:"Ungüento",visible:true},
      {id:uid(),title:"Ungüento: Seta Leñosa",text:"Efecto: Cicatrización rápida de cortes",terrain:"Jungla",rarity:"Común",continent:"Todos",type:"Ungüento",visible:true},
      {id:uid(),title:"Ungüento: Musgo Estanque",text:"Efecto: Camuflaje con el entorno",terrain:"Lagos",rarity:"Común",continent:"Todos",type:"Ungüento",visible:true},
      {id:uid(),title:"Ungüento: Flor de Hestia",text:"Efecto: Resistencia al frío extremo",terrain:"Desierto de cobre",rarity:"Rara",continent:"Aslan",type:"Ungüento",visible:true},
      {id:uid(),title:"Ungüento: Flor de Terra",text:"Efecto: Energía y rendimiento de Atleta",terrain:"Sabana",rarity:"Rara",continent:"Todos",type:"Ungüento",visible:true},
      {id:uid(),title:"Ungüento: Flor Escarcha",text:"Efecto: Resistencia al calor extremo",terrain:"Zonas Nevadas",rarity:"Rara",continent:"Todos",type:"Ungüento",visible:true},
      {id:uid(),title:"Ungüento: Bayas Glue",text:"Efecto: Pegamento adhesivo instantáneo",terrain:"Bosque",rarity:"Común",continent:"Todos",type:"Ungüento",visible:true},
      {id:uid(),title:"Ungüento: Hestia + Escarcha",text:"Efecto: Adaptación climática universal",terrain:"Especial",rarity:"Muy rara",continent:"Todos",type:"Ungüento",visible:true}
    ]
  };
}

function defaultState(){
  var officialChars = getOfficialCharacters();
  return {
    activeId: officialChars[0] ? officialChars[0].id : "",
    activeTab: "ficha",
    rollLog: [],
    characters: officialChars,
    officialDataVersion: 4,
    weaponsCatalog: getSeedWeaponsCatalog(),
    buffCatalog: getSeedBuffCatalog(),
    lore: getSeedLore(),
    bestiary: getSeedBestiary(),
    maps: [{ id: "world_main", name: "Mapa de Campaña", image: null, markers: [] }],
    activeMapId: "world_main",
    quests: [
      {
        id: uid(),
        title: "La Infiltración en Trysar",
        category: "principal",
        desc: "Investigar las actividades sospechosas de los contrabandistas en los puertos de Trysar.",
        tasks: [
          { id: uid(), text: "Contactar con el informante en la taberna del puerto", done: false },
          { id: uid(), text: "Inspeccionar el almacén de venenos y suministros", done: false }
        ],
        completed: false
      }
    ],
    questClues: [
      { id: uid(), title: "Sello de cera púrpura", desc: "Encontrado en una carta interceptada con la marca de Krysalis." }
    ],
    questMap: { name: "Mapa de la Misión", image: null, notes: "Puntos de reunión y rutas de escape marcadas." },
    sessionSummary: "Los aventureros se preparan para su incursión. Recuerden comprobar provisiones y preparar antídotos."
  };
}

function migrateState(s){
  if(!s) return defaultState();
  if(!s.activeTab) s.activeTab="ficha";
  if(!s.rollLog) s.rollLog=[];
  if(!s.weaponsCatalog || !s.weaponsCatalog.length) s.weaponsCatalog=getSeedWeaponsCatalog();
  if(!s.buffCatalog || !s.buffCatalog.length) s.buffCatalog=getSeedBuffCatalog();
  else {
    s.buffCatalog.forEach(function(b){
      if(b.duration===undefined) b.duration="permanent";
      if(b.durationTurns===undefined) b.durationTurns=0;
    });
  }
  if(!s.lore || !s.lore.objetos) s.lore=getSeedLore();
  if(!s.bestiary || !s.bestiary.length) s.bestiary=getSeedBestiary();
  else {
    migrateBestiaryData(s.bestiary);
  }
  if(!s.maps || !s.maps.length){
    s.maps = [{ id:"world_main", name:"Mapa de Campaña", image:null, markers:[] }];
    s.activeMapId = "world_main";
  }
  if(!s.quests) s.quests = [];
  if(!s.questClues) s.questClues = [];
  if(!s.questMap) s.questMap = { name:"Mapa de la Misión", image:null, notes:"" };
  if(s.sessionSummary === undefined) s.sessionSummary = "";

  if(!s.officialDataVersion || s.officialDataVersion < 4){
    var officials = getOfficialCharacters();
    s.characters = s.characters || [];

    officials.forEach(function(off){
      var existing = s.characters.find(function(c){
        var cName = (c.name || "").trim().toLowerCase();
        var oName = off.name.trim().toLowerCase();
        if(oName === "derek") return cName === "derek";
        if(oName === "scarleth") return cName === "scarleth" || cName.includes("scarleth") || cName.includes("winter");
        if(oName === "bucky") return cName === "bucky" || cName === "baky" || cName.includes("bucky") || cName.includes("baky");
        if(oName === "cherk") return cName === "cherk" || cName.includes("cherk");
        if(oName === "ink") return cName === "ink" || cName.includes("ink");
        return cName === oName;
      });
      if(existing){
        if(!existing.db_id && off.db_id) existing.db_id = off.db_id;
        if(!existing.portrait && off.portrait) existing.portrait = off.portrait;
        if(!existing.theme && off.theme) existing.theme = off.theme;
        if(!existing.owner_id && off.owner_id) existing.owner_id = off.owner_id;
        if(!existing.ownerEmail && off.ownerEmail) existing.ownerEmail = off.ownerEmail;
        if(!existing.combat) existing.combat = JSON.parse(JSON.stringify(off.combat||{}));
        if(!existing.inventory) existing.inventory = JSON.parse(JSON.stringify(off.inventory||[]));
        if(!existing.weapons) existing.weapons = JSON.parse(JSON.stringify(off.weapons||[]));
        if(!existing.armors) existing.armors = JSON.parse(JSON.stringify(off.armors||[]));
        if(!existing.spells) existing.spells = JSON.parse(JSON.stringify(off.spells||[]));
        existing.officialDataVersion = 4;
      } else {
        var nOff = JSON.parse(JSON.stringify(off));
        nOff.officialDataVersion = 4;
        s.characters.push(nOff);
      }
    });
    s.characters = s.characters.filter(function(c){
      var n = (c.name || "").trim().toLowerCase();
      return n !== "sin personaje" && n !== "nuevo personaje" && n !== "kaelen mago";
    });
    s.officialDataVersion = 4;
    if(!s.characters.some(function(c){ return c.id === s.activeId; })){
      s.activeId = s.characters[0] ? s.characters[0].id : "";
    }
  }

  (s.weaponsCatalog||[]).forEach(function(w){ if(w.visible===undefined) w.visible=true; });
  ["pistas","npcs","objetos"].forEach(function(cat){
    if(s.lore && s.lore[cat]){
      s.lore[cat].forEach(function(item){ if(item.visible===undefined) item.visible=true; });
    }
  });
  (s.characters||[]).forEach(function(c){
    if(!c.combat) c.combat={iniciativa:0,movilidad:0,defensa:10,defensaMagica:0,pvActual:10,pvMax:10,escudoActual:0,manaActual:10,manaMax:10};
    if(c.combat.escudoActual===undefined) c.combat.escudoActual=0;
    if(!c.customSkills) c.customSkills=[];
    if(c.skillPoints===undefined) c.skillPoints=0;
    if(!c.poisons) c.poisons=[];
    if(!c.skillProgress) c.skillProgress={};
    if(c.skillPointsUnlocked===undefined) c.skillPointsUnlocked=false;
    if(c.owner_id===undefined) c.owner_id=null;
    if(c.ownerEmail===undefined) c.ownerEmail="";
    if(!c.activeBuffs) c.activeBuffs=[];
    if(c.personalNotes===undefined) c.personalNotes="";
    if(!c.spells) c.spells=[];
    c.spells.forEach(function(sp){
      if(sp.coste===undefined) sp.coste=1;
      if(sp.rango===undefined) sp.rango="Melé";
      if(sp.statAttr===undefined) sp.statAttr="";
      if(sp.statMod===undefined) sp.statMod="";
      if(sp.active===undefined) sp.active=false;
      if(sp.efecto===undefined) sp.efecto="";
    });
    (c.summons||[]).forEach(function(su){
      if(su.notas && !su.habilidades) su.habilidades = su.notas;
      if(su.habilidades===undefined) su.habilidades="";
    });
  });
  (s.bestiary||[]).forEach(function(b){
    if(b.image===undefined) b.image=null;
  });
  return s;
}

function loadState(){
  try{
    var raw = localStorage.getItem(STORAGE_KEY);
    var parsed = raw ? JSON.parse(raw) : null;
    var loaded = parsed ? migrateState(parsed) : defaultState();
    var savedActiveId = localStorage.getItem("krysalis_active_id");
    if(savedActiveId && loaded.characters && loaded.characters.some(function(x){return x.id===savedActiveId;})){
      loaded.activeId = savedActiveId;
    }
    var savedTab = localStorage.getItem("krysalis_active_tab");
    if(savedTab){
      loaded.activeTab = savedTab;
    }
    return loaded;
  }catch(e){ return defaultState(); }
}

var syncDebounceTimer = null;
var dirtyCharIds = new Set();
var isGlobalDirty = false;

function markCharDirty(charId){
  if(!charId) return;
  dirtyCharIds.add(charId);
  var target = (state.characters||[]).find(function(x){ return x.id === charId; });
  if(target){
    target._isDirty = true;
    target._lastLocalEdit = Date.now();
  }
}

function flushPendingSync(){
  if(syncDebounceTimer){
    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = null;
  }
  if(!supabaseClient || isRemoteSyncing) return;

  var toPush = new Set(dirtyCharIds);
  (state.characters || []).forEach(function(c){
    if(c && c._isDirty && c.id) toPush.add(c.id);
  });

  toPush.forEach(function(cid){
    pushCharacterById(cid);
  });
  dirtyCharIds.clear();

  if(isGlobalDirty || state._isSharedDirty){
    isGlobalDirty = false;
    state._isSharedDirty = false;
    if(isGM() || !currentUser) pushSharedData();
  }
}

function saveState(skipRemote){
  var ac = activeChar();
  if(ac && ac.id){
    ac._lastLocalEdit = Date.now();
    if(!skipRemote){
      ac._isDirty = true;
      markCharDirty(ac.id);
    }
  }
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if(state.activeId) localStorage.setItem("krysalis_active_id", state.activeId);
    if(state.activeTab) localStorage.setItem("krysalis_active_tab", state.activeTab);
  }catch(e){
    console.error("Error al guardar en localStorage:", e);
  }
  if(!skipRemote && supabaseClient && !isRemoteSyncing){
    updateSyncBadge("saving");
    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = setTimeout(function(){
      flushPendingSync();
    }, 300);
  }
}

function updateSyncBadge(st){
  var el = document.getElementById("syncBadge");
  if(!el) return;
  if(st==="synced"){ el.className="sync-status synced"; el.textContent="● En la nube"; }
  else if(st==="saving"){ el.className="sync-status saving"; el.textContent="⏳ Guardando..."; }
  else { el.className="sync-status"; el.textContent="○ Local"; }
}

function isGM(){
  return currentRole==='gm' ||
    (currentUser && (currentUser.email === 'rolillo55ac@gmail.com' || currentUser.email === 'lolorey92@gmail.com'));
}

function isCharOwner(c, user){
  if(!c || !user) return false;
  if(c.owner_id && c.owner_id === user.id) return true;
  if(c.ownerEmail && user.email && c.ownerEmail.trim().toLowerCase() === user.email.trim().toLowerCase()) return true;
  return false;
}

function canEditChar(c){
  if(!c) return false;
  return true; // Todos los jugadores y el máster pueden editar y guardar su ficha
}

function getUserCharacters(){
  if(isGM()) return state.characters;
  return (state.characters || []).filter(function(c){ return !c.isNPC; });
}

function activeChar(){
  var chars = getUserCharacters();
  return chars.find(function(x){return x.id===state.activeId;}) || chars[0] || blankCharacter("Sin Personaje");
}

function getEffectiveAttr(aKey, c){
  var base = num(c.attrs[aKey],0);
  if(aKey==="percepcion" && c.buffs && c.buffs.sangre_perc) base += 2;
  if(aKey==="destreza" && c.buffs && c.buffs.drogado_dex) base += 1;
  if(c.buffs && c.buffs.mono) base -= 1;
  
  if(c.activeBuffs){
    c.activeBuffs.forEach(function(ab){
      if(ab.attr === aKey && ab.bonus){
        var bonusNum = parseFloat(ab.bonus);
        if(!isNaN(bonusNum)) base += bonusNum;
      }
      if(ab.attr === "todo" && ab.bonus){
        var allBonus = parseFloat(ab.bonus);
        if(!isNaN(allBonus)) base += allBonus;
      }
    });
  }

  if(c.spells){
    c.spells.forEach(function(sp){
      if(sp.active && sp.statAttr && sp.statMod){
        var stacks = Math.max(1, num(sp.activeStacks, 1));
        if(sp.statAttr === aKey){
          var spNum = parseFloat(sp.statMod);
          if(!isNaN(spNum)) base += spNum * stacks;
        }
        if(sp.statAttr === "todo"){
          var spAll = parseFloat(sp.statMod);
          if(!isNaN(spAll)) base += spAll * stacks;
        }
      }
    });
  }
  return base;
}

function skillBase(skill, c){
  var attrKey = skill.attr!=="hybrid" ? skill.attr : (c.skillHybrid[skill.id] || skill.hybridOptions[0]);
  return getEffectiveAttr(attrKey, c);
}

function skillTotal(skill, c){ 
  var total = skillBase(skill, c) + num(c.skillBonus[skill.id],0);
  if(c.activeBuffs){
    c.activeBuffs.forEach(function(ab){
      if(ab.attr === skill.id && ab.bonus){
        var bonusNum = parseFloat(ab.bonus);
        if(!isNaN(bonusNum)) total += bonusNum;
      }
      var skillAttr = skill.attr !== "hybrid" ? skill.attr : (c.skillHybrid[skill.id] || skill.hybridOptions[0]);
      if(ab.attr === skillAttr && ab.bonus){
        var attrBonus = parseFloat(ab.bonus);
        if(!isNaN(attrBonus)) total += attrBonus;
      }
    });
  }
  if(c.spells){
    c.spells.forEach(function(sp){
      if(sp.active && sp.statAttr && sp.statMod){
        var stacks = Math.max(1, num(sp.activeStacks, 1));
        if(sp.statAttr === skill.id){
          var spNum = parseFloat(sp.statMod);
          if(!isNaN(spNum)) total += spNum * stacks;
        }
      }
    });
  }
  return total;
}

function isShieldAttr(attr, name){
  if(attr){
    var a = String(attr).toLowerCase().trim();
    if(a === "escudo" || a === "escudos" || a === "escudoactual" || a === "vida_falsa" || a === "vida falsa" || a.includes("escudo") || a.includes("vida falsa")){
      return true;
    }
  }
  if(name){
    var n = String(name).toLowerCase().trim();
    if(n.includes("escudo") || n.includes("vida falsa")){
      return true;
    }
  }
  return false;
}

function parseShieldBonus(modStr){
  if(!modStr) return 0;
  var str = String(modStr).trim();
  var diceMatch = str.match(/^(\d+)d(\d+)([\+\-]\d+)?$/i);
  if(diceMatch){
    var qty = parseInt(diceMatch[1], 10) || 1;
    var sides = parseInt(diceMatch[2], 10) || 6;
    var mod = parseInt(diceMatch[3], 10) || 0;
    var sum = 0;
    for(var i = 0; i < qty; i++){ sum += rollDie(sides); }
    return Math.max(1, sum + mod);
  }
  var clean = str.replace(/[^0-9\-]/g, '');
  return parseInt(clean, 10) || 0;
}

function getEffectiveCombatStat(statKey, c){
  var isShield = isShieldAttr(statKey);
  var base = isShield ? num(c.combat ? c.combat.escudoActual : 0, 0) : num(c.combat ? c.combat[statKey] : 0, 0);
  if(c.activeBuffs){
    c.activeBuffs.forEach(function(ab){
      if((ab.attr === statKey || (isShield && isShieldAttr(ab.attr, ab.name))) && ab.bonus){
        var b = parseFloat(ab.bonus);
        if(!isNaN(b)) base += b;
      }
      if(ab.attr === "todo" && ab.bonus){
        var bAll = parseFloat(ab.bonus);
        if(!isNaN(bAll)) base += bAll;
      }
    });
  }
  if(c.spells){
    c.spells.forEach(function(sp){
      if(sp.active && sp.statAttr && sp.statMod){
        var stacks = Math.max(1, num(sp.activeStacks, 1));
        if(sp.statAttr === statKey || (isShield && isShieldAttr(sp.statAttr, sp.name))){
          var spNum = parseFloat(sp.statMod);
          if(!isNaN(spNum)) base += spNum * stacks;
        }
        if(sp.statAttr === "todo"){
          var spAll = parseFloat(sp.statMod);
          if(!isNaN(spAll)) base += spAll * stacks;
        }
      }
    });
  }
  return base;
}

function customSkillTotal(cs, c){ return getEffectiveAttr(cs.attr, c) + num(cs.bonus,0); }

var audioCtx = null;
function getAudioCtx(){
  if(!audioCtx){ try{ audioCtx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} }
  if(audioCtx && audioCtx.state==='suspended') audioCtx.resume();
  return audioCtx;
}

function playCupRattleAudio(){
  var ctx = getAudioCtx(); if(!ctx) return;
  var now = ctx.currentTime;
  var taps = [0, 0.06, 0.12, 0.19, 0.26, 0.33, 0.40, 0.47];
  taps.forEach(function(delay, i){
    var t = now + delay;
    var osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = i % 2 === 0 ? "triangle" : "square";
    osc.frequency.setValueAtTime(200 + (i * 30) + Math.random() * 80, t);
    osc.frequency.exponentialRampToValueAtTime(130 + Math.random() * 30, t + 0.04);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.06);
  });
}

function playDiceDropAudio(){
  var ctx = getAudioCtx(); if(!ctx) return;
  var now = ctx.currentTime;
  var thud = ctx.createOscillator(), thudGain = ctx.createGain();
  thud.type = "sine";
  thud.frequency.setValueAtTime(150, now);
  thud.frequency.exponentialRampToValueAtTime(45, now + 0.13);
  thudGain.gain.setValueAtTime(0.001, now);
  thudGain.gain.linearRampToValueAtTime(0.35, now + 0.015);
  thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  thud.connect(thudGain); thudGain.connect(ctx.destination);
  thud.start(now); thud.stop(now + 0.16);

  [0.02, 0.07, 0.14].forEach(function(d, idx){
    var t = now + d;
    var osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(360 + Math.random() * 140, t);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.16 / (idx + 1), t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.045);
  });
}

function playDiceAudio(type){
  var ctx = getAudioCtx(); if(!ctx) return;
  var now = ctx.currentTime;
  if(type==="roll"){
    playCupRattleAudio();
    setTimeout(playDiceDropAudio, 350);
  }else if(type==="crit"){
    [523.25, 659.25, 783.99, 1046.50].forEach(function(f, idx){
      var osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = "triangle"; osc.frequency.setValueAtTime(f, now + idx*0.04);
      gain.gain.setValueAtTime(0.001, now + idx*0.04); gain.gain.exponentialRampToValueAtTime(0.22, now + idx*0.04 + 0.02); gain.gain.exponentialRampToValueAtTime(0.0001, now + idx*0.04 + 0.45);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now + idx*0.04); osc.stop(now + idx*0.04 + 0.5);
    });
  }else if(type==="fumble"){
    [311.13, 277.18, 220, 164.81].forEach(function(f, idx){
      var osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = "sawtooth"; osc.frequency.setValueAtTime(f, now + idx*0.06);
      gain.gain.setValueAtTime(0.001, now + idx*0.06); gain.gain.exponentialRampToValueAtTime(0.18, now + idx*0.06 + 0.02); gain.gain.exponentialRampToValueAtTime(0.0001, now + idx*0.06 + 0.35);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now + idx*0.06); osc.stop(now + idx*0.06 + 0.4);
    });
  }
}

function getDieSvg(sides){
  var stroke = "var(--gold)", fill = "var(--bg-card)", txt = "var(--gold-light)";
  if(sides===4) return '<svg viewBox="0 0 100 100"><polygon points="50,15 90,82 10,82" fill="'+fill+'" stroke="'+stroke+'" stroke-width="3.5"/><text x="50" y="65" font-family="var(--font-mono)" font-size="20" font-weight="700" fill="'+txt+'" text-anchor="middle">d4</text></svg>';
  if(sides===8) return '<svg viewBox="0 0 100 100"><polygon points="50,12 88,50 50,88 12,50" fill="'+fill+'" stroke="'+stroke+'" stroke-width="3.5"/><text x="50" y="57" font-family="var(--font-mono)" font-size="20" font-weight="700" fill="'+txt+'" text-anchor="middle">d8</text></svg>';
  if(sides===10) return '<svg viewBox="0 0 100 100"><polygon points="50,10 88,38 74,88 26,88 12,38" fill="'+fill+'" stroke="'+stroke+'" stroke-width="3.5"/><text x="50" y="58" font-family="var(--font-mono)" font-size="22" font-weight="700" fill="'+txt+'" text-anchor="middle">d10</text></svg>';
  if(sides===12) return '<svg viewBox="0 0 100 100"><polygon points="50,12 85,24 95,60 68,90 32,90 5,60 15,24" fill="'+fill+'" stroke="'+stroke+'" stroke-width="3.5"/><text x="50" y="59" font-family="var(--font-mono)" font-size="18" font-weight="700" fill="'+txt+'" text-anchor="middle">d12</text></svg>';
  if(sides===20) return '<svg viewBox="0 0 100 100"><polygon points="50,10 90,32 90,75 50,94 10,75 10,32" fill="'+fill+'" stroke="'+stroke+'" stroke-width="3.5"/><text x="50" y="60" font-family="var(--font-mono)" font-size="18" font-weight="700" fill="'+txt+'" text-anchor="middle">d20</text></svg>';
  if(sides===100) return '<div style="display:flex;gap:4px;"><svg viewBox="0 0 100 100" style="width:36px;height:36px;"><polygon points="50,10 88,38 74,88 26,88 12,38" fill="'+fill+'" stroke="'+stroke+'" stroke-width="3"/><text x="50" y="56" font-family="var(--font-mono)" font-size="16" font-weight="700" fill="'+txt+'" text-anchor="middle">00</text></svg><svg viewBox="0 0 100 100" style="width:36px;height:36px;"><polygon points="50,10 88,38 74,88 26,88 12,38" fill="'+fill+'" stroke="'+stroke+'" stroke-width="3"/><text x="50" y="56" font-family="var(--font-mono)" font-size="16" font-weight="700" fill="'+txt+'" text-anchor="middle">0</text></svg></div>';
  return '<svg viewBox="0 0 100 100"><rect x="15" y="15" width="70" height="70" rx="10" fill="'+fill+'" stroke="'+stroke+'" stroke-width="3.5"/><text x="50" y="60" font-family="var(--font-mono)" font-size="24" font-weight="700" fill="'+txt+'" text-anchor="middle">d6</text></svg>';
}

function getOrnateCupSvg(){
  return '<svg class="ornate-cup-svg" viewBox="0 0 160 200" width="115" height="145" xmlns="http://www.w3.org/2000/svg">'+
    '<defs>'+
      '<linearGradient id="cupLeatherGrad" x1="0%" y1="0%" x2="100%" y2="0%">'+
        '<stop offset="0%" stop-color="#180e07"/>'+
        '<stop offset="30%" stop-color="#3d2514"/>'+
        '<stop offset="50%" stop-color="#54331c"/>'+
        '<stop offset="70%" stop-color="#3d2514"/>'+
        '<stop offset="100%" stop-color="#120904"/>'+
      '</linearGradient>'+
      '<linearGradient id="cupGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">'+
        '<stop offset="0%" stop-color="#FFF275"/>'+
        '<stop offset="40%" stop-color="#D4AF37"/>'+
        '<stop offset="80%" stop-color="#996515"/>'+
        '<stop offset="100%" stop-color="#4A3415"/>'+
      '</linearGradient>'+
      '<linearGradient id="cupVelvetGrad" x1="0%" y1="0%" x2="0%" y2="100%">'+
        '<stop offset="0%" stop-color="#3e0910"/>'+
        '<stop offset="100%" stop-color="#120204"/>'+
      '</linearGradient>'+
    '</defs>'+
    '<ellipse cx="80" cy="186" rx="42" ry="9" fill="rgba(0,0,0,0.55)"/>'+
    '<polygon points="35,45 125,45 110,175 50,175" fill="url(#cupLeatherGrad)" stroke="#100703" stroke-width="2.5"/>'+
    '<line x1="72" y1="46" x2="76" y2="174" stroke="#A0783E" stroke-width="1.6" stroke-dasharray="3,3"/>'+
    '<line x1="88" y1="46" x2="84" y2="174" stroke="#A0783E" stroke-width="1.6" stroke-dasharray="3,3"/>'+
    '<polygon points="40,102 120,102 116,125 44,125" fill="url(#cupGoldGrad)" stroke="#3A280F" stroke-width="1.8"/>'+
    '<text x="80" y="119" font-family="monospace" font-size="12" font-weight="900" fill="#1C1109" text-anchor="middle" letter-spacing="3.5">ᚠ ᚱ ᛊ ᛏ</text>'+
    '<circle cx="48" cy="113" r="3.2" fill="#FFF275" stroke="#4A3415" stroke-width="1"/>'+
    '<circle cx="112" cy="113" r="3.2" fill="#FFF275" stroke="#4A3415" stroke-width="1"/>'+
    '<polygon points="48,166 112,166 110,178 50,178" fill="url(#cupGoldGrad)" stroke="#3A280F" stroke-width="1.6"/>'+
    '<ellipse cx="80" cy="177" rx="30" ry="7" fill="#1A1009" stroke="url(#cupGoldGrad)" stroke-width="1.8"/>'+
    '<ellipse cx="80" cy="45" rx="45" ry="14" fill="url(#cupVelvetGrad)" stroke="url(#cupGoldGrad)" stroke-width="3.6"/>'+
    '<ellipse cx="80" cy="45" rx="38" ry="9" fill="#1D0306" stroke="#FFF275" stroke-width="1.2" opacity="0.8"/>'+
    '<path d="M54,64 Q80,78 106,64" fill="none" stroke="url(#cupGoldGrad)" stroke-width="2" opacity="0.85"/>'+
    '<path d="M57,146 Q80,158 103,146" fill="none" stroke="url(#cupGoldGrad)" stroke-width="1.8" opacity="0.85"/>'+
  '</svg>';
}

var lastRollFn = null;

function openRollModal(label, scoreText, detailHtml, sides, isCrit, isFumble, advCardsHtml, rerollFn){
  if(rerollFn) lastRollFn = rerollFn;

  var overlay = document.getElementById("rollOverlay");
  var cupStage = document.getElementById("cupStage");
  var resultStage = document.getElementById("rollResultStage");

  document.getElementById("rollLabel").textContent = label;
  document.getElementById("rollDieGraphic").innerHTML = getDieSvg(sides);
  document.getElementById("rollAdvVisual").innerHTML = advCardsHtml || "";
  var scoreEl = document.getElementById("rollScore");
  scoreEl.textContent = scoreText;
  scoreEl.className = "roll-score" + (isCrit ? " crit" : isFumble ? " fumble" : "");
  document.getElementById("rollVerdict").textContent = isCrit ? "¡Éxito Crítico!" : (isFumble ? "¡Pifia Crítica!" : "");
  document.getElementById("rollVerdict").style.color = isCrit ? "var(--gold-light)" : (isFumble ? "var(--danger)" : "transparent");
  document.getElementById("rollDetail").innerHTML = detailHtml;

  var rerollBtn = document.querySelector("[data-action='reroll-last-dice']");
  if(rerollBtn){
    rerollBtn.style.display = lastRollFn ? "block" : "none";
  }

  overlay.classList.remove("hidden");

  if(cupStage && resultStage){
    cupStage.style.display = "flex";
    cupStage.innerHTML = '<div class="ornate-cup-wrapper shaking">' + getOrnateCupSvg() + '<div class="cup-sparks"></div></div>';
    resultStage.style.display = "none";
    resultStage.classList.remove("revealed");

    playCupRattleAudio();

    setTimeout(function(){
      var cupWrap = cupStage.querySelector(".ornate-cup-wrapper");
      if(cupWrap){
        cupWrap.classList.remove("shaking");
        cupWrap.classList.add("pouring");
      }
      playDiceDropAudio();
    }, 450);

    setTimeout(function(){
      if(cupStage) cupStage.style.display = "none";
      if(resultStage){
        resultStage.style.display = "block";
        resultStage.classList.add("revealed");
      }
      if(isCrit) setTimeout(function(){ playDiceAudio("crit"); }, 150);
      else if(isFumble) setTimeout(function(){ playDiceAudio("fumble"); }, 150);
    }, 850);
  } else {
    playDiceAudio("roll");
    if(isCrit) setTimeout(function(){ playDiceAudio("crit"); }, 400);
    else if(isFumble) setTimeout(function(){ playDiceAudio("fumble"); }, 400);
  }
}

function broadcastDiceRoll(rollObj){
  if(realtimeChannel && typeof realtimeChannel.send === 'function'){
    try {
      realtimeChannel.send({
        type: 'broadcast',
        event: 'dice_roll',
        payload: rollObj
      });
    } catch(e){
      console.warn("Could not broadcast dice roll:", e);
    }
  }
}

function handleRemoteDiceRoll(rollObj){
  if(!rollObj) return;
  state.rollLog.unshift({
    id: rollObj.id || uid(),
    charName: rollObj.charName || "Aventurero",
    label: rollObj.label || "Tirada",
    total: rollObj.total,
    formulaText: rollObj.formulaText,
    ts: rollObj.ts || Date.now()
  });
  if(state.rollLog.length > 20) state.rollLog.length = 20;
  saveState(true);
  
  var critText = rollObj.isCrit ? " ¡Éxito Crítico!" : (rollObj.isFumble ? " ¡Pifia Crítica!" : "");
  var toastType = rollObj.isCrit ? "success" : (rollObj.isFumble ? "error" : "info");
  showToast("🎲 " + rollObj.charName + " tiró " + rollObj.label + ": " + rollObj.total + critText, toastType);
  
  if(rollObj.isCrit) playDiceAudio("crit");
  else if(rollObj.isFumble) playDiceAudio("fumble");
  else playDiceAudio("roll");
  
  if(state.activeTab === "habilidades" || state.activeTab === "combate") {
    renderTab();
  }
}

function performD10Roll(charName, label, mod){
  var c = activeChar();
  var extra = 0;
  if(c.buffs){
    if(c.buffs.sangre_ataque_melee && label.includes("melé")) extra += 1;
    if(c.buffs.sangre_ataque_dist && label.includes("distancia")) extra += 1;
    if(c.buffs.mono) extra -= 1;
  }
  if(c.activeBuffs){
    c.activeBuffs.forEach(function(ab){
      if(label.toLowerCase().includes("melé") && (ab.attr === "melee" || ab.attr === "melé")){
        var b1 = parseFloat(ab.bonus);
        if(!isNaN(b1)) extra += b1;
      }
      if(label.toLowerCase().includes("distancia") && ab.attr === "distancia"){
        var b2 = parseFloat(ab.bonus);
        if(!isNaN(b2)) extra += b2;
      }
      if(ab.attr === "todo"){
        var b3 = parseFloat(ab.bonus);
        if(!isNaN(b3)) extra += b3;
      }
    });
  }
  if(c.spells){
    c.spells.forEach(function(sp){
      if(sp.active && sp.statAttr && sp.statMod){
        if(label.toLowerCase().includes("melé") && (sp.statAttr === "melee" || sp.statAttr === "melé")){
          var b1 = parseFloat(sp.statMod);
          if(!isNaN(b1)) extra += b1;
        }
        if(label.toLowerCase().includes("distancia") && sp.statAttr === "distancia"){
          var b2 = parseFloat(sp.statMod);
          if(!isNaN(b2)) extra += b2;
        }
        if(sp.statAttr === "todo"){
          var b3 = parseFloat(sp.statMod);
          if(!isNaN(b3)) extra += b3;
        }
      }
    });
  }
  var d = rollDie(10);
  var total = d + num(mod,0) + extra;
  var formula = "1d10 (" + d + ") + Mod (" + (num(mod,0)+extra) + ")";
  var rollItem = {id:uid(), charName:charName, label:label, total:total, formulaText:formula, isCrit:d===10, isFumble:d===1, ts:Date.now()};
  state.rollLog.unshift(rollItem);
  if(state.rollLog.length>20) state.rollLog.length=20;
  saveState();
  broadcastDiceRoll(rollItem);
  openRollModal(label, total, formula, 10, d===10, d===1);
  renderTab();
}

function performWeaponRoll(charName, weaponName, formulaRaw){
  var reg = new RegExp('(\\d+)\\s*[dD]\\s*(\\d+)');
  var m = String(formulaRaw||"").match(reg);
  if(!m){ showToast("Fórmula de daño no válida (ej: 1D6+3)", "error"); return; }
  var qty = parseInt(m[1],10), sides = parseInt(m[2],10);
  var rest = String(formulaRaw).slice(m.index + m[0].length);
  var modM = rest.match(new RegExp('^\\s*([+-]\\s*\\d+)'));
  var mod = modM ? parseInt(modM[1].replace(/\s+/g,""),10) : 0;
  var rolls=[], sum=0;
  for(var i=0;i<qty;i++){ var r=rollDie(sides); rolls.push(r); sum+=r; }
  var total = sum + mod;
  var isCrit = rolls.every(function(x){return x===sides;});
  var isFumble = rolls.every(function(x){return x===1;});
  var detail = qty + "d" + sides + " [" + rolls.join(", ") + "]" + (mod ? (mod>0?" + "+mod:" - "+Math.abs(mod)) : "");
  var rollItem = {id:uid(), charName:charName, label:"Daño ("+weaponName+")", total:total, formulaText:detail, isCrit:isCrit, isFumble:isFumble, ts:Date.now()};
  state.rollLog.unshift(rollItem);
  if(state.rollLog.length>20) state.rollLog.length=20;
  saveState();
  broadcastDiceRoll(rollItem);
  openRollModal("Daño — "+weaponName, total, detail, sides, isCrit, isFumble);
  renderTab();
}

function renderTopbar(){
  var c = activeChar();
  document.body.setAttribute("data-theme", c.theme||"default");
  var curPv = num(c.combat.pvActual, 0);
  var maxHp = Math.max(1, num(c.combat.pvMax, 1));
  var maxMana = Math.max(1, num(c.combat.manaMax, 1));
  var hpPct = curPv <= 0 ? 0 : clamp(Math.round((curPv/maxHp)*100), 0, 100);
  var manaPct = clamp(Math.round((num(c.combat.manaActual,0)/maxMana)*100), 0, 100);
  var crestStyle = c.portrait ? ' style="background-image:url(\''+c.portrait+'\')"' : '';
  var isNPC = !!c.isNPC;
  var crestClass = isNPC ? 'char-crest npc' : 'char-crest';
  var nameClass = isNPC ? 'char-name npc-name' : 'char-name';

  var hpNumsClass = curPv < 0 ? 'gauge-nums dying' : (curPv === 0 ? 'gauge-nums unconscious' : 'gauge-nums');
  var hpStatusBadge = curPv < 0 ? '<span class="status-pill dying">💀 Agonizando ('+curPv+')</span>' : (curPv === 0 ? '<span class="status-pill unconscious">💤 Inconsciente</span>' : '');

  var crestContent = (c.portrait && c.portrait.trim())
    ? '<img src="' + esc(c.portrait) + '" alt="' + esc(c.name) + '" class="crest-img" onerror="this.style.display=\'none\';if(this.nextElementSibling)this.nextElementSibling.style.display=\'flex\';"><span class="crest-initial" style="display:none;">' + esc(c.name.charAt(0).toUpperCase()) + '</span>'
    : '<span class="crest-initial">' + esc(c.name.charAt(0).toUpperCase()) + '</span>';

  document.getElementById("topbar").innerHTML =
    '<div class="topbar-row">'+
      '<button class="char-switch" data-action="open-char-modal" aria-label="Cambiar personaje">'+
        '<span class="'+crestClass+'"'+crestStyle+'>'+crestContent+'</span>'+
        '<span class="char-info-box">'+
          '<div class="'+nameClass+'">'+esc(c.name)+'<span class="version-tag">v0.9.2</span></div>'+
          '<div class="char-sub">'+(isNPC?'NPC · ':'Nv. '+esc(c.nivel||"1")+' · ')+esc(c.trabajo||"Aventurero")+'</div>'+
        '</span>'+
      '</button>'+
      '<div style="display:flex;align-items:center;gap:4px;">'+
        '<span id="syncBadge" class="sync-status">'+(currentUser?'● Nube':'○ Local')+'</span>'+
        (isGM() ? '<span class="role-badge gm">★ GM</span>' : '<span class="role-badge player">Jugador</span>')+
        '<button class="icon-btn" data-action="open-data-modal" title="Ajustes y Sesión" aria-label="Ajustes">&#9881;</button>'+
      '</div>'+
    '</div>'+
    '<div class="gauges">'+
      '<div class="gauge-wrap">'+
        '<div class="gauge-label"><span>Vida '+hpStatusBadge+'</span><span class="'+hpNumsClass+'">'+curPv+' / '+maxHp+'</span></div>'+
        '<div class="gauge"><div class="gauge-fill hp" style="width:'+hpPct+'%;'+(curPv<=0?'background:#8C252F;':'')+'"></div></div>'+
        '<div class="gauge-adjust">'+
          '<button data-action="hp-mod" data-delta="-5" aria-label="Restar 5 vida">-5</button><button data-action="hp-mod" data-delta="-1" aria-label="Restar 1 vida">-1</button>'+
          '<button data-action="hp-mod" data-delta="1" aria-label="Sumar 1 vida">+1</button><button data-action="hp-mod" data-delta="5" aria-label="Sumar 5 vida">+5</button>'+
        '</div>'+
      '</div>'+
      '<div class="gauge-wrap">'+
        '<div class="gauge-label"><span style="color:var(--shield-light);" title="El Escudo y la Vida Falsa son equivalentes">🛡️ Escudo / Vida Falsa</span><span class="gauge-nums">'+num(c.combat.escudoActual,0)+'</span></div>'+
        '<div class="gauge"><div class="gauge-fill shield" style="width:'+clamp(num(c.combat.escudoActual,0)*10,0,100)+'%;"></div></div>'+
        '<div class="gauge-adjust">'+
          '<button data-action="shield-mod" data-delta="-3" aria-label="Restar 3 escudo">-3</button><button data-action="shield-mod" data-delta="-1" aria-label="Restar 1 escudo">-1</button>'+
          '<button data-action="shield-mod" data-delta="1" aria-label="Sumar 1 escudo">+1</button><button data-action="shield-mod" data-delta="3" aria-label="Sumar 3 escudo">+3</button>'+
        '</div>'+
      '</div>'+
      '<div class="gauge-wrap">'+
        '<div class="gauge-label"><span>Maná</span><span class="gauge-nums">'+num(c.combat.manaActual,0)+' / '+maxMana+'</span></div>'+
        '<div class="gauge"><div class="gauge-fill mana" style="width:'+manaPct+'%;"></div></div>'+
        '<div class="gauge-adjust">'+
          '<button data-action="mana-mod" data-delta="-5" aria-label="Restar 5 maná">-5</button><button data-action="mana-mod" data-delta="-1" aria-label="Restar 1 maná">-1</button>'+
          '<button data-action="mana-mod" data-delta="1" aria-label="Sumar 1 maná">+1</button><button data-action="mana-mod" data-delta="5" aria-label="Sumar 5 maná">+5</button>'+
        '</div>'+
      '</div>'+
    '</div>';
}

var PLAYER_TABS = [
  {id:"ficha",label:"Ficha"}, {id:"mision",label:"Misión"}, {id:"habilidades",label:"Habilidades"}, {id:"combate",label:"Combate"},
  {id:"inventario",label:"Inventario"}, {id:"magia",label:"Magia"}, {id:"alquimia",label:"Alquimia"},
  {id:"invocaciones",label:"Invocaciones"}, {id:"bestiario",label:"Bestiario"}, {id:"mundo",label:"Mundo"}
];

var GM_TABS = [
  {id:"ficha",label:"Ficha"}, {id:"mision",label:"Misión"}, {id:"habilidades",label:"Habilidades"}, {id:"combate",label:"Combate"},
  {id:"inventario",label:"Inventario"}, {id:"magia",label:"Magia"}, {id:"alquimia",label:"Alquimia"},
  {id:"invocaciones",label:"Invocaciones"}, {id:"bestiario",label:"Bestiario"},
  {id:"extra",label:"Extra"}, {id:"mundo",label:"Mundo"}
];

function renderTabbar(){
  var tabs = isGM() ? GM_TABS : PLAYER_TABS;
  document.getElementById("tabbar").innerHTML = tabs.map(function(t){
    var isActive = state.activeTab===t.id;
    return '<button class="tab-btn'+(isActive?' active':'')+'" data-action="switch-tab" data-tab="'+t.id+'" role="tab" aria-selected="'+(isActive)+'" aria-label="'+t.label+'"><span>'+t.label+'</span></button>';
  }).join('');
}

function renderTab(){
  var main = document.getElementById("main");
  var c = activeChar();
  
  if(state.activeTab==="ficha") main.innerHTML = tplFicha(c);
  else if(state.activeTab==="mision") main.innerHTML = tplMision(c, state);
  else if(state.activeTab==="habilidades") main.innerHTML = tplHabilidades(c);
  else if(state.activeTab==="combate") main.innerHTML = tplCombate(c);
  else if(state.activeTab==="inventario") main.innerHTML = tplInventario(c);
  else if(state.activeTab==="magia") main.innerHTML = tplMagia(c);
  else if(state.activeTab==="alquimia") main.innerHTML = tplAlquimia(c);
  else if(state.activeTab==="invocaciones") main.innerHTML = tplInvocaciones(c);
  else if(state.activeTab==="bestiario") main.innerHTML = tplBestiario(state);
  else if(state.activeTab==="extra" && isGM()) main.innerHTML = tplExtra(c);
  else if(state.activeTab==="mundo") main.innerHTML = tplMundo(state);
}

function tplFicha(c){
  var pStyle = c.portrait ? ' style="background-image:url(\''+c.portrait+'\')"' : '';
  var attrCards = ATTRS.map(function(a){
    if(c.isNPC){
      return '<div class="attr-card"><label>'+ATTR_LABELS[a]+'</label>'+
        '<div style="display:flex;align-items:center;justify-content:center;gap:4px;">'+
          '<button class="skill-bonus-ctrl" data-action="npc-attr-mod" data-attr="'+a+'" data-delta="-1" style="width:22px;height:22px;min-width:22px;min-height:22px;font-size:.6rem;">-</button>'+
          '<span style="font-family:var(--font-mono);font-size:1.1rem;font-weight:700;color:var(--gold-light);min-width:30px;text-align:center;">'+num(c.attrs[a],0)+'</span>'+
          '<button class="skill-bonus-ctrl" data-action="npc-attr-mod" data-attr="'+a+'" data-delta="1" style="width:22px;height:22px;min-width:22px;min-height:22px;font-size:.6rem;">+</button>'+
        '</div>'+
      '</div>';
    }
    return '<div class="attr-card"><label>'+ATTR_LABELS[a]+'</label><div class="attr-val-box">'+num(c.attrs[a],0)+'</div></div>';
  }).join('');

  var levelControl = '';
  if(isGM()){
    levelControl = '<button class="btn-solid-gold" data-action="grant-level">+ Nivel</button>';
  }

  return '<div class="section'+(c.isNPC?' gm-section':'')+'">'+
    '<div class="section-title"><span>'+(c.isNPC?'Ficha de NPC (Solo GM)':'Datos del Personaje')+'</span></div>'+
    '<div class="ficha-layout">'+
      '<div class="portrait-box">'+
        '<div class="portrait-img"'+pStyle+'>'+(c.portrait?'':'👤')+'</div>'+
        '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;">'+
          '<button class="btn-compact" data-action="upload-portrait" title="Subir foto desde archivo">Foto</button>'+
          '<button class="btn-compact" data-action="url-portrait" title="Pegar enlace de GitHub o web">URL</button>'+
          (c.portrait ? '<button class="btn-compact" data-action="remove-portrait" title="Quitar foto">✕</button>' : '')+
        '</div>'+
      '</div>'+
      '<div>'+
        '<div class="field-grid">'+
          field("Nombre", "name", c.name, "text")+
          '<div class="field"><label>'+(c.isNPC?'Nivel / CR':'Nivel')+'</label><div style="display:flex;gap:4px;"><input type="text" data-bind="nivel" value="'+esc(c.nivel||"1")+'" '+(c.isNPC?'':'readonly')+'>'+levelControl+'</div></div>'+
          field("Trabajo / Rol","trabajo",c.trabajo,"text")+
          field("Lugar Nacimiento","lugarNacimiento",c.lugarNacimiento,"text")+
          field("Altura","altura",c.altura,"text")+
          field("Peso","peso",c.peso,"text")+
          field("Edad","edad",c.edad,"text")+
          field("Color de Ojos","ojos",c.ojos,"text")+
          field("Color de Pelo","pelo",c.pelo,"text")+
        '</div>'+
        '<div style="margin-top:10px;">'+
          fieldArea("Descripción Física y Notas","descripcion",c.descripcion)+
        '</div>'+
      '</div>'+
    '</div>'+
  '</div>'+
  '<div class="section'+(c.isNPC?' gm-section':'')+'">'+
    '<div class="section-title"><span>Atributos'+(c.isNPC?' (Editables)':'')+'</span></div>'+
    '<div class="attr-grid">'+attrCards+'</div>'+
  '</div>';
}

function tplMision(c, s){
  var canEdit = isGM() || !currentUser;
  var quests = s.quests || [];
  var clues = s.questClues || [];
  var qMap = s.questMap || { name: "Mapa de la Misión", image: null, notes: "" };

  var html = '<div class="section'+(canEdit?' gm-section':'')+'">'+
    '<div class="section-title">'+
      '<span>🧭 Diario de Misión y Campaña'+(canEdit?' (GM)':'')+'</span>'+
      (canEdit ? '<button class="btn-compact" data-action="add-quest">+ Nueva Misión</button>' : '')+
    '</div>';

  // 1. Resumen de la aventura / sesión
  html += '<div class="quest-banner">'+
    '<div class="quest-header-title">📜 Resumen de la Aventura</div>'+
    (canEdit ? 
      '<textarea class="field" style="width:100%;min-height:55px;resize:vertical;background:rgba(0,0,0,0.25);border:1px solid var(--line);border-radius:var(--radius-sm);padding:8px;font-size:0.85rem;color:var(--ink);" data-scope="global" data-bind="sessionSummary" placeholder="Escribe aquí el resumen de los acontecimientos recientes...">'+esc(s.sessionSummary||"")+'</textarea>' :
      '<p style="font-size:0.86rem;color:var(--ink-dim);line-height:1.5;margin:4px 0 0;">'+(s.sessionSummary ? esc(s.sessionSummary) : '<em>El Master aún no ha añadido un resumen de la sesión.</em>')+'</p>'
    )+
  '</div>';

  // 2. Mapa táctico del encuentro / misión actual
  html += '<div class="quest-map-box">'+
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px;">'+
      '<div style="font-family:var(--font-display);color:var(--gold-light);font-size:0.92rem;display:flex;align-items:center;gap:6px;">'+
        '🗺️ ' + (canEdit ? '<input type="text" style="background:transparent;border:none;border-bottom:1px solid var(--line);color:var(--gold-light);font-size:0.92rem;padding:2px;" data-scope="global" data-bind="questMap.name" value="'+esc(qMap.name||"Mapa del Encuentro")+'">' : esc(qMap.name||"Mapa del Encuentro"))+
      '</div>'+
      (canEdit ? '<div style="display:flex;gap:5px;flex-wrap:wrap;">'+
        '<button class="btn-compact" data-action="upload-quest-map" title="Subir imagen de mapa para esta misión">Subir Foto</button>'+
        '<button class="btn-compact" data-action="url-quest-map" title="Pegar enlace de GitHub o web">Pegar URL</button>'+
        (qMap.image ? '<button class="btn-compact" data-action="remove-quest-map" title="Quitar imagen del mapa">✕</button>' : '')+
      '</div>' : '')+
    '</div>';

  if(qMap.image){
    html += '<img src="'+qMap.image+'" alt="Mapa de Misión" class="quest-map-img">';
  } else {
    html += '<div style="padding:24px 10px;text-align:center;color:var(--ink-faint);font-size:0.8rem;border:1px dashed var(--line);border-radius:var(--radius-sm);">No hay plano fijado para esta misión actualmente.</div>';
  }
  html += '</div>';

  // 3. Misiones y Objetivos
  html += '<div class="section-title" style="margin-top:14px;">'+
    '<span>Objetivos y Misiones ('+quests.length+')</span>'+
  '</div>';

  if(!quests.length){
    html += '<p style="font-size:0.82rem;color:var(--ink-faint);margin-bottom:12px;">Sin misiones registradas.</p>';
  } else {
    quests.forEach(function(q){
      var st = q.status || "activa";
      var badgeClass = st === "completada" ? "completada" : (st === "fallida" ? "fallida" : "activa");
      var badgeLabel = st === "completada" ? "Completada" : (st === "fallida" ? "Fallida" : "Activa");

      html += '<div class="quest-card '+(st==="completada"?"completed":(st==="fallida"?"failed":"active"))+'">'+
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap;">'+
          '<div style="flex:1;min-width:0;">'+
            (canEdit ?
              '<input type="text" style="font-family:var(--font-display);font-size:1rem;color:var(--gold-light);background:transparent;border:none;border-bottom:1px solid var(--line);width:100%;margin-bottom:4px;" data-scope="global" data-bind="quests.'+q.id+'.title" value="'+esc(q.title)+'">' :
              '<div style="font-family:var(--font-display);font-size:1rem;color:var(--gold-light);margin-bottom:4px;">'+esc(q.title)+'</div>'
            )+
            (canEdit ?
              '<textarea style="width:100%;min-height:38px;background:rgba(0,0,0,0.14);border:1px solid var(--line);border-radius:4px;padding:4px 6px;font-size:0.8rem;color:var(--ink-dim);resize:vertical;" data-scope="global" data-bind="quests.'+q.id+'.desc">'+esc(q.desc||"")+'</textarea>' :
              (q.desc ? '<div style="font-size:0.8rem;color:var(--ink-dim);line-height:1.4;">'+esc(q.desc)+'</div>' : '')
            )+
          '</div>'+
          '<div style="display:flex;gap:6px;align-items:center;">'+
            (canEdit ?
              '<select style="font-size:0.7rem;background:var(--bg-card);padding:2px 6px;" data-scope="global" data-bind="quests.'+q.id+'.status">'+
                '<option value="activa" '+(st==="activa"?"selected":"")+'>🟡 Activa</option>'+
                '<option value="completada" '+(st==="completada"?"selected":"")+'>🟢 Completada</option>'+
                '<option value="fallida" '+(st==="fallida"?"selected":"")+'>🔴 Fallida</option>'+
              '</select>' :
              '<span class="quest-status-badge '+badgeClass+'">'+badgeLabel+'</span>'
            )+
            (canEdit ? '<button class="row-del" data-action="del-quest" data-id="'+q.id+'" title="Eliminar misión">✕</button>' : '')+
          '</div>'+
        '</div>';

      // Tareas de la misión
      var tasks = q.tasks || [];
      html += '<ul class="quest-task-list">';
      tasks.forEach(function(tk){
        html += '<li class="quest-task-item'+(tk.done?' done':'')+'">'+
          '<input type="checkbox" class="quest-task-cb" data-action="toggle-quest-task" data-qid="'+q.id+'" data-tid="'+tk.id+'" '+(tk.done?'checked':'')+'>'+
          '<span style="flex:1;">'+esc(tk.text)+'</span>'+
          (canEdit ? '<button class="row-del" data-action="del-quest-task" data-qid="'+q.id+'" data-tid="'+tk.id+'" style="width:20px;height:20px;font-size:0.7rem;">✕</button>' : '')+
        '</li>';
      });
      html += '</ul>';

      if(canEdit){
        html += '<button class="btn-compact" style="margin-top:8px;font-size:0.7rem;" data-action="add-quest-task" data-id="'+q.id+'">+ Añadir Tarea</button>';
      }
      html += '</div>';
    });
  }

  // 4. Pistas y Descubrimientos de la Sesión
  html += '<div class="section-title" style="margin-top:16px;">'+
    '<span>Pistas y Hallazgos Clave</span>'+
    (canEdit ? '<button class="btn-compact" data-action="add-clue">+ Añadir Pista</button>' : '')+
  '</div>';

  if(!clues.length){
    html += '<p style="font-size:0.82rem;color:var(--ink-faint);margin-bottom:12px;">Sin pistas registradas aún.</p>';
  } else {
    html += '<div class="clues-grid">';
    clues.forEach(function(cl){
      html += '<div class="clue-card">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;">'+
          (canEdit ?
            '<input type="text" style="font-family:var(--font-display);font-size:0.9rem;color:var(--gold-light);background:transparent;border:none;border-bottom:1px solid var(--line);flex:1;" data-scope="global" data-bind="questClues.'+cl.id+'.title" value="'+esc(cl.title)+'">' :
            '<div class="clue-title">📜 '+esc(cl.title)+'</div>'
          )+
          (canEdit ? '<button class="row-del" data-action="del-clue" data-id="'+cl.id+'" title="Eliminar pista">✕</button>' : '')+
        '</div>'+
        (canEdit ?
          '<textarea style="width:100%;min-height:45px;background:rgba(0,0,0,0.15);border:1px solid var(--line);border-radius:4px;padding:4px;font-size:0.8rem;color:var(--ink-dim);resize:vertical;" data-scope="global" data-bind="questClues.'+cl.id+'.text">'+esc(cl.text||"")+'</textarea>' :
          '<p style="font-size:0.82rem;color:var(--ink-dim);line-height:1.4;margin:2px 0;">'+esc(cl.text||"")+'</p>'
        );
      if(cl.image){
        html += '<img src="'+cl.image+'" alt="Pista" class="clue-img">';
      }
      if(canEdit){
        html += '<div style="display:flex;gap:4px;margin-top:4px;">'+
          '<button class="btn-compact" data-action="url-clue-img" data-id="'+cl.id+'" style="font-size:0.68rem;">'+(cl.image?'Cambiar URL':'Pegar URL')+'</button>'+
          (cl.image ? '<button class="btn-compact" data-action="remove-clue-img" data-id="'+cl.id+'" style="font-size:0.68rem;">Quitar Foto</button>' : '')+
        '</div>';
      }
      html += '</div>';
    });
    html += '</div>';
  }

  // 5. Cuaderno personal del aventurero (Notas privadas del jugador)
  html += '<div class="section-title" style="margin-top:18px;">'+
    '<span>Diario del Aventurero ('+esc(c.name)+')</span>'+
    '<span style="font-size:0.68rem;color:var(--ink-faint);text-transform:none;">Solo visible en tu ficha</span>'+
  '</div>'+
  '<div class="journal-box">'+
    '<textarea class="journal-textarea" data-bind="personalNotes" placeholder="Escribe aquí tus notas personales de la partida, sospechas, nombres de NPCs, deudas, planes o recordatorios secretos...">'+esc(c.personalNotes||"")+'</textarea>'+
    '<div style="font-size:0.68rem;color:var(--ink-faint);text-align:right;margin-top:4px;">Se guarda automáticamente al escribir</div>'+
  '</div>'+
  '</div>';

  return html;
}

function field(label,bind,val,type){
  return '<div class="field"><label>'+esc(label)+'</label><input type="'+type+'" data-bind="'+bind+'" value="'+esc(val)+'" aria-label="'+esc(label)+'"></div>';
}
function fieldArea(label,bind,val){
  return '<div class="field"><label>'+esc(label)+'</label><textarea data-bind="'+bind+'" aria-label="'+esc(label)+'">'+esc(val)+'</textarea></div>';
}

function tplHabilidades(c){
  var groups = {}; ATTRS.forEach(function(a){groups[a]=[];});
  var hybrids = [];
  SKILL_DEFS.forEach(function(s){ if(s.attr==="hybrid") hybrids.push(s); else groups[s.attr].push(s); });

  var unlocked = c.skillPointsUnlocked || false;
  if(c.isNPC){
    unlocked = true;
  }
  
  var banner = '';
  if(isGM() && !c.isNPC){
    banner = '<div class="skill-pool-banner">'+
      '<span>Puntos de mejora disponibles: <b>'+num(c.skillPoints,0)+'</b></span>'+
      '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">'+
        '<button class="btn-solid-gold" data-action="gm-add-skill-point" title="Dar 1 punto de habilidad al personaje">+1 Pto (GM)</button>'+
        '<button class="btn-solid-gold" data-action="toggle-skill-lock">'+(unlocked?'🔒 Bloquear Asignación (GM)':'🔓 Permitir Asignación (GM)')+'</button>'+
      '</div>'+
    '</div>';
  }
  
  if(c.isNPC && isGM()){
    banner = '<div class="skill-pool-banner">'+
      '<span>NPC - Puntos disponibles: <b>'+num(c.skillPoints,0)+'</b>. Habilidades editables.</span>'+
      '<button class="btn-solid-gold" data-action="gm-add-skill-point">+1 Pto (GM)</button>'+
    '</div>';
  }

  var html = '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Habilidades Generales</span></div>'+banner;
  ATTRS.forEach(function(a){
    html += '<div class="attr-group"><div class="attr-group-title">'+ATTR_LABELS[a]+'</div>';
    html += '<div class="skill-col-headers"><span>Habilidad</span><span>Base</span><span>Bono (Prog)</span><span>Total</span><span></span></div>';
    groups[a].forEach(function(s){ html += skillRowHtml(s, c, unlocked); });
    html += '</div>';
  });
  html += '<div class="attr-group"><div class="attr-group-title">Híbridas</div>';
  html += '<div class="skill-col-headers"><span>Habilidad</span><span>Base</span><span>Bono (Prog)</span><span>Total</span><span></span></div>';
  hybrids.forEach(function(s){ html += skillRowHtml(s, c, unlocked); });
  html += '</div>';

  if(c.customSkills && c.customSkills.length){
    html += '<div class="attr-group"><div class="attr-group-title">Personalizadas</div>';
    html += '<div class="skill-col-headers"><span>Habilidad</span><span>Base</span><span>Bono (Prog)</span><span>Total</span><span></span></div>';
    c.customSkills.forEach(function(cs){
      var bonusVal = num(cs.bonus, 0);
      if(!c.skillProgress) c.skillProgress = {};
      var prog = num(c.skillProgress[cs.id], 0);
      var costNeeded = bonusVal + 1;
      var canSub = prog > 0;
      var canAdd = false;
      if(bonusVal > 0 && bonusVal < 8){
        if(c.isNPC){
          canAdd = num(c.skillPoints,0) >= 1;
        } else {
          canAdd = unlocked && num(c.skillPoints,0) >= 1;
        }
      }

      var gmCustomTools = '';
      if(isGM()){
        gmCustomTools = '<span class="gm-skill-tools" title="Ajuste directo del Máster por Lore">'+
          '<button class="gm-skill-btn" data-action="gm-custom-skill-sub" data-id="'+cs.id+'" title="Restar 1 nivel (GM)">-</button>'+
          '<span class="gm-skill-lvl">'+bonusVal+'</span>'+
          '<button class="gm-skill-btn" data-action="gm-custom-skill-add" data-id="'+cs.id+'" title="Otorgar +1 nivel directamente (GM)">+ GM</button>'+
        '</span>';
      }
      
      html += '<div class="skill-row"><span>'+esc(cs.name)+' <small style="color:var(--ink-faint);">('+ATTR_LABELS[cs.attr].slice(0,3)+')</small></span>'+
        '<span class="skill-base">'+getEffectiveAttr(cs.attr,c)+'</span>'+
        '<span class="skill-bonus-ctrl">'+
          (isGM() ? gmCustomTools : (
            '<button data-action="skill-sub-custom" data-id="'+cs.id+'" '+(canSub?'':'disabled')+' aria-label="Restar progreso">-</button>'+
            '<span>'+bonusVal+' ('+prog+'/'+costNeeded+')</span>'+
            '<button data-action="skill-add-custom" data-id="'+cs.id+'" '+(canAdd?'':'disabled')+' aria-label="Añadir progreso">+</button>'
          ))+
        '</span>'+
        '<span class="skill-total">'+customSkillTotal(cs,c)+'</span><button class="dice-btn" data-action="roll-custom-skill" data-id="'+cs.id+'" aria-label="Tirar '+esc(cs.name)+'">&#127922;</button></div>';
    });
    html += '</div>';
  }
  if(isGM()){
    html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-custom-skill">+ Añadir habilidad personalizada</button>';
  }
  html += '</div>';
  html += rollLogHtml();
  return html;
}

function skillRowHtml(s, c, unlocked){
  var base = skillBase(s,c);
  var total = skillTotal(s,c);
  var bonusVal = num(c.skillBonus[s.id],0);
  if(!c.skillProgress) c.skillProgress = {};
  var prog = num(c.skillProgress[s.id],0);
  var costNeeded = bonusVal + 1;

  var hybridSel = "";
  if(s.attr==="hybrid"){
    var chosen = c.skillHybrid[s.id] || s.hybridOptions[0];
    hybridSel = '<div><select class="skill-hybrid-select" data-bind="skillHybrid.'+s.id+'" aria-label="Atributo para '+esc(s.name)+'">'+
      s.hybridOptions.map(function(o){return '<option value="'+o+'"'+(o===chosen?' selected':'')+'>'+ATTR_LABELS[o].slice(0,3)+'</option>';}).join('')+
      '</select></div>';
  }

  var canSub = prog > 0;
  var canAdd = false;
  if(bonusVal > 0 && bonusVal < 8){
    if(c.isNPC){
      canAdd = num(c.skillPoints,0) >= 1;
    } else {
      canAdd = unlocked && num(c.skillPoints,0) >= 1;
    }
  }

  var gmControls = '';
  if(isGM()){
    gmControls = '<span class="gm-skill-tools" title="Ajuste directo del Máster por Lore">'+
      '<button class="gm-skill-btn" data-action="gm-skill-sub" data-id="'+s.id+'" title="Restar 1 nivel base (GM)">-</button>'+
      '<span class="gm-skill-lvl">'+bonusVal+'</span>'+
      '<button class="gm-skill-btn" data-action="gm-skill-add" data-id="'+s.id+'" title="Otorgar +1 nivel base directamente (GM)">+ GM</button>'+
    '</span>';
  }

  return '<div class="skill-row">'+
    '<span class="skill-name">'+esc(s.name)+hybridSel+'</span>'+
    '<span class="skill-base">'+base+'</span>'+
    '<span class="skill-bonus-ctrl">'+
      (isGM() ? gmControls : (
        '<button data-action="skill-sub" data-id="'+s.id+'" '+(canSub?'':'disabled')+' aria-label="Restar progreso a '+esc(s.name)+'">-</button>'+
        '<span>'+bonusVal+' ('+prog+'/'+costNeeded+')</span>'+
        '<button data-action="skill-add" data-id="'+s.id+'" '+(canAdd?'':'disabled')+' aria-label="Añadir progreso a '+esc(s.name)+'">+</button>'
      ))+
    '</span>'+
    '<span class="skill-total">'+total+'</span>'+
    '<button class="dice-btn" data-action="roll-skill" data-id="'+s.id+'" aria-label="Tirar '+esc(s.name)+'">&#127922;</button>'+
  '</div>';
}

function tplCombate(c){
  var cb = c.combat||{};
  
  var activeBuffs = (c.activeBuffs||[]);
  var availableBuffs = (state.buffCatalog||[]).filter(function(b){ return isGM() || b.visible !== false; });
  
  var buffsHtml = '<div class="buffs-container">';
  availableBuffs.forEach(function(b){
    var isActive = activeBuffs.some(function(ab){ return ab.id === b.id; });
    var isDebuff = b.type === "debuff";
    buffsHtml += '<div class="buff-pill'+(isDebuff?' debuff':'')+(isActive?' active':'')+'" data-action="toggle-global-buff" data-id="'+b.id+'" role="button" tabindex="0">'+
      (isDebuff?'⚠️':'✨')+' '+esc(b.name)+(b.bonus?' ('+esc(b.bonus)+')':'')+
      (isActive?' ✓':'')+
    '</div>';
  });
  buffsHtml += '</div>';

  if(activeBuffs.length > 0){
    buffsHtml += '<div style="margin-top:10px;border-top:1px solid var(--line);padding-top:8px;">'+
      '<div style="font-size:.65rem;color:var(--ink-faint);text-transform:uppercase;margin-bottom:5px;">Buffos activos en este personaje (toca ✕ para eliminar):</div>';
    activeBuffs.forEach(function(ab){
      buffsHtml += '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 8px;background:var(--bg-elev);border:1px solid '+(ab.type==='debuff'?'var(--danger)':'var(--line)')+';border-radius:5px;margin-bottom:4px;">'+
        '<span style="font-size:.75rem;color:'+(ab.type==='debuff'?'#E88178':'var(--ink)')+';">'+(ab.type==='debuff'?'⚠️':'✨')+' '+esc(ab.name)+(ab.bonus?' ('+esc(ab.bonus)+')':'')+'</span>'+
        '<button class="row-del" data-action="remove-active-buff" data-id="'+ab.id+'" aria-label="Eliminar buff del personaje" style="min-width:28px;min-height:28px;width:28px;height:28px;">✕</button>'+
      '</div>';
    });
    buffsHtml += '</div>';
  }

  var activeSpells = (c.spells||[]).filter(function(sp){ return sp.active; });
  if(activeSpells.length > 0){
    buffsHtml += '<div style="margin-top:10px;border-top:1px dashed var(--line);padding-top:8px;">'+
      '<div style="font-size:.65rem;color:var(--teal-light);text-transform:uppercase;margin-bottom:5px;font-weight:700;">✨ Magias y Hechizos Activos (toca ✕ para retirar carga):</div>';
    activeSpells.forEach(function(asp){
      var stacks = asp.activeStacks || 1;
      var statNote = (asp.statAttr && asp.statMod) ? ' ('+asp.statMod+' a '+asp.statAttr+(stacks>1?' x'+stacks:'')+')' : (stacks>1?' (x'+stacks+')':'');
      buffsHtml += '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 8px;background:rgba(61,110,96,0.15);border:1px solid var(--teal-light);border-radius:5px;margin-bottom:4px;">'+
        '<span style="font-size:.75rem;color:var(--teal-light);">✨ '+esc(asp.name || "Hechizo")+(stacks>1?' <b>(Cargas: '+stacks+')</b>':'')+statNote+'</span>'+
        '<button class="row-del" data-action="toggle-spell-active" data-id="'+asp.id+'" aria-label="Quitar carga de magia" style="min-width:28px;min-height:28px;width:28px;height:28px;" title="Quitar 1 carga">✕</button>'+
      '</div>';
    });
    buffsHtml += '</div>';
  }

  var html = '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Buffs y Debuffs</span></div>'+buffsHtml;

  if(c.customBuffs && c.customBuffs.length){
    c.customBuffs.forEach(function(cbuff){
      html += '<div class="list-row text-row">'+
        '<input type="text" placeholder="Efecto de estado" data-bind="customBuffs.'+cbuff.id+'.name" value="'+esc(cbuff.name)+'">'+
        (canEditChar(c) ? '<button class="row-del" data-action="del-custom-buff" data-id="'+cbuff.id+'" aria-label="Eliminar buff">✕</button>' : '')+
      '</div>';
    });
  }
  if(canEditChar(c)){
    html += '<button class="btn-compact" style="margin-top:6px;" data-action="add-custom-buff">+ Añadir buff temporal</button>';
  }
  html += '</div>';

  var quickBtns = ["melee","distancia","esquivar","atletismo"].map(function(sid){
    var sdef = SKILL_DEFS.find(function(s){return s.id===sid;});
    return '<button class="combat-quick-btn" data-action="roll-skill" data-id="' + sid + '"><span class="cq-label">' + sdef.name + '</span><span class="cq-total">' + skillTotal(sdef, c) + '</span></button>';
  }).join('');

  html += '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Tiradas de Combate</span></div><div class="combat-quick-grid">'+quickBtns+'</div></div>';
  html += '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Estadísticas de Combate</span></div>'+
    '<div class="combat-grid">'+
      combatStat("Iniciativa","iniciativa",cb.iniciativa,true)+
      combatStat("Movilidad","movilidad",cb.movilidad,false)+
      combatStat("Defensa","defensa",cb.defensa,false)+
      combatStat("Def. Mágica","defensaMagica",cb.defensaMagica,false)+
      combatStat("Escudo / Vida Falsa","escudoActual",cb.escudoActual,false)+
    '</div>'+
  '</div>';

  html += '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Armas del Personaje</span></div>';
  var catalog = state.weaponsCatalog || [];
  (c.weapons||[]).forEach(function(w){
    var selectedCatItem = catalog.find(function(catItem){ return catItem.name === w.name || catItem.id === w.catalogId; });
    var isBlocked = selectedCatItem ? (selectedCatItem.visible === false) : false;
    var infoText = selectedCatItem ? ('Daño: ' + selectedCatItem.dano + ' | Alcance: ' + selectedCatItem.alcance) : 'Selecciona un arma del compendio';
    if(isBlocked){
      infoText += ' | <span style="color:#F87171;font-weight:700;">[🔒 Bloqueada por el Máster - No usable]</span>';
    }

    html += '<div class="list-row weapons-row'+(isBlocked?' weapon-row-blocked':'')+'" style="grid-template-columns:1fr 36px 36px;">'+
      '<select data-action="select-weapon-catalog" data-id="'+w.id+'" aria-label="Seleccionar arma">'+
        '<option value="">-- Seleccionar Arma del Compendio --</option>'+
        catalog.map(function(catItem){
          var isLockedOpt = catItem.visible === false;
          return '<option value="'+catItem.id+'" '+(selectedCatItem && selectedCatItem.id===catItem.id?'selected':'')+'>'+(isLockedOpt ? '🔒 ' : '')+esc(catItem.name)+' ('+esc(catItem.dano)+')'+(isLockedOpt ? ' [Bloqueada]' : '')+'</option>';
        }).join('')+
      '</select>'+
      (isBlocked && !isGM()
        ? '<button class="dice-btn disabled" disabled title="Esta arma está bloqueada por el Máster y no se puede usar en combate" aria-label="Arma bloqueada" style="opacity:0.38;cursor:not-allowed;filter:grayscale(1);">🔒</button>'
        : '<button class="dice-btn" data-action="roll-weapon" data-id="'+w.id+'" title="Tirar Daño" aria-label="Tirar daño">&#127922;</button>'
      )+
      (canEditChar(c) ? '<button class="row-del" data-action="del-weapon" data-id="'+w.id+'" aria-label="Eliminar arma">✕</button>' : '')+
    '</div>'+
    '<div style="font-size:0.7rem;color:var(--gold-light);margin-bottom:6px;padding-left:2px;">'+infoText+(selectedCatItem && selectedCatItem.critico?' | <b>Crítico:</b> '+esc(selectedCatItem.critico):'')+'</div>';
  });
  if(canEditChar(c)){
    html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-weapon">+ Añadir arma al equipo</button>';
  }
  html += '</div>';

  html += '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Armaduras</span></div>';
  (c.armors||[]).forEach(function(a){
    html += '<div class="list-row armor-row">'+
      '<input type="text" placeholder="Armadura" data-bind="armors.'+a.id+'.name" value="'+esc(a.name)+'" aria-label="Nombre de armadura">'+
      '<input type="text" placeholder="Absorción" data-bind="armors.'+a.id+'.absorcion" value="'+esc(a.absorcion)+'" aria-label="Absorción">'+
      '<input type="text" placeholder="Estorbo" data-bind="armors.'+a.id+'.estorbo" value="'+esc(a.estorbo)+'" aria-label="Estorbo">'+
      (canEditChar(c) ? '<button class="row-del" data-action="del-armor" data-id="'+a.id+'" aria-label="Eliminar armadura">✕</button>' : '')+
    '</div>';
  });
  if(canEditChar(c)){
    html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-armor">+ Añadir armadura</button>';
  }
  html += '</div>';

  html += rollLogHtml();
  return html;
}

function combatStat(label,bind,val,rollable){
  var c = activeChar();
  var eff = getEffectiveCombatStat(bind, c);
  var diff = eff - num(val, 0);
  var diffBadge = diff !== 0 ? '<span class="stat-eff-tag '+(diff>0?'pos':'neg')+'" title="Valor efectivo">'+(diff>0?'+'+diff:diff)+' (Total: '+eff+')</span>' : '';
  return '<div class="combat-stat"><label>'+esc(label)+diffBadge+'</label>'+
    '<input type="number" data-bind="combat.'+bind+'" value="'+num(val,0)+'" aria-label="'+esc(label)+'">'+
    (rollable?'<button class="mini-roll" data-action="roll-init" aria-label="Tirar iniciativa">&#127922;</button>':'')+
  '</div>';
}

function renderSpellStatOptions(curVal){
  return '<option value="">-- Sin efecto en stats --</option>'+
    '<optgroup label="Combate y Vida">'+
      '<option value="escudo" '+((curVal==='escudo'||curVal==='vida_falsa'||curVal==='escudoActual'||curVal==='vida falsa')?'selected':'')+'>🛡️ Escudo / Vida Falsa</option>'+
      '<option value="defensa" '+(curVal==='defensa'?'selected':'')+'>Defensa</option>'+
      '<option value="defensaMagica" '+(curVal==='defensaMagica'?'selected':'')+'>Defensa Mágica</option>'+
      '<option value="movilidad" '+(curVal==='movilidad'?'selected':'')+'>Movilidad</option>'+
      '<option value="iniciativa" '+(curVal==='iniciativa'?'selected':'')+'>Iniciativa</option>'+
    '</optgroup>'+
    '<optgroup label="Habilidades clave">'+
      '<option value="melee" '+(curVal==='melee'?'selected':'')+'>Armas a melé</option>'+
      '<option value="distancia" '+(curVal==='distancia'?'selected':'')+'>Ataque a distancia</option>'+
      '<option value="esquivar" '+(curVal==='esquivar'?'selected':'')+'>Esquivar</option>'+
      '<option value="sigilo" '+(curVal==='sigilo'?'selected':'')+'>Sigilo</option>'+
      '<option value="percepcion" '+(curVal==='percepcion'?'selected':'')+'>Percepción</option>'+
      '<option value="todo" '+(curVal==='todo'?'selected':'')+'>Todo (+ a todo)</option>'+
    '</optgroup>';
}

function tplMagia(c){
  var html = '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Grimorio y Artes Mágicas</span></div>'+
    '<div class="field" style="margin-bottom:12px;"><label>Tipo de Magia</label><input type="text" data-bind="magiaTipo" value="'+esc(c.magiaTipo)+'" placeholder="Ej: Piroclástica, Nigromancia, Sanación..."></div>';

  if(!c.spells || !c.spells.length){
    html += '<div style="font-size:.82rem;color:var(--ink-faint);font-style:italic;padding:8px 2px;">Sin hechizos conocidos en el grimorio.</div>';
  } else {
    c.spells.forEach(function(s){
      var isActive = !!s.active;
      var stacks = s.activeStacks || (isActive ? 1 : 0);
      var hasStatMod = s.statAttr && s.statMod;
      var statBadge = hasStatMod ? '<span class="spell-badge effect">✨ '+esc(s.statMod)+' '+esc(s.statAttr)+(stacks>1?' (x'+stacks+')':'')+'</span>' : '';
      var activeBadge = isActive ? '<span class="spell-badge active">ACTIVO'+(stacks>1?' x'+stacks:'')+'</span>' : '';

      html += '<div class="spell-card'+(isActive?' active-spell':'')+'">'+
        '<div class="spell-card-header">'+
          '<input type="text" class="spell-name-input" placeholder="Nombre del Hechizo" data-bind="spells.'+s.id+'.name" value="'+esc(s.name)+'">'+
          '<div class="spell-badges">'+
            activeBadge+
            statBadge+
            (isActive ?
              '<button class="spell-btn-act cast" data-action="cast-spell" data-id="'+s.id+'" title="Lanzar de nuevo y superponer">+ Superponer (-'+num(s.coste, 1)+' Maná)</button>'+
              '<button class="spell-btn-act cancel" data-action="toggle-spell-active" data-id="'+s.id+'" title="Quitar una carga o desactivar">✕ Quitar Carga ('+stacks+')</button>' :
              '<button class="spell-btn-act cast" data-action="cast-spell" data-id="'+s.id+'">⚡ Activar (-'+num(s.coste, 1)+' Maná)</button>'
            )+
            (canEditChar(c) ? '<button class="row-del" data-action="del-spell" data-id="'+s.id+'" aria-label="Eliminar hechizo" style="min-width:28px;min-height:28px;width:28px;height:28px;">✕</button>' : '')+
          '</div>'+
        '</div>'+
        '<div class="spell-grid">'+
          '<div class="creature-field"><label>Coste (Maná)</label><input type="number" min="0" data-bind="spells.'+s.id+'.coste" value="'+num(s.coste, 1)+'"></div>'+
          '<div class="creature-field"><label>Alcance / Rango</label><input type="text" placeholder="Melé, 30m, Personal..." data-bind="spells.'+s.id+'.rango" value="'+esc(s.rango)+'"></div>'+
        '</div>'+
        '<div class="spell-grid" style="margin-top:6px;">'+
          '<div class="creature-field"><label>Stat que Afecta (Opcional)</label>'+
            '<select style="font-size:.74rem;background:var(--bg-card);padding:3px 6px;border:1px solid var(--line);border-radius:var(--radius-sm);color:var(--ink);" data-bind="spells.'+s.id+'.statAttr">'+
              renderSpellStatOptions(s.statAttr)+
            '</select>'+
          '</div>'+
          '<div class="creature-field"><label>Modificador de Stat</label><input type="text" placeholder="+2, -1, +1d4..." data-bind="spells.'+s.id+'.statMod" value="'+esc(s.statMod)+'"></div>'+
        '</div>'+
        '<div class="creature-field" style="margin-top:6px;"><label>Efecto y Descripción Narrativa</label>'+
          '<textarea class="spell-notes" placeholder="Efectos mágicos, reglas específicas o descripción..." data-bind="spells.'+s.id+'.efecto">'+esc(s.efecto)+'</textarea>'+
        '</div>'+
      '</div>';
    });
  }

  if(canEditChar(c)){
    html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-spell">+ Añadir Hechizo al Grimorio</button>';
  }
  html += '</div>';

  html += '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Piedras Mágicas</span></div>';
  (c.stones||[]).forEach(function(s){
    html += '<div class="list-row stone-row">'+
      '<input type="text" placeholder="Color" data-bind="stones.'+s.id+'.color" value="'+esc(s.color)+'">'+
      '<input type="text" placeholder="Efecto" data-bind="stones.'+s.id+'.efecto" value="'+esc(s.efecto)+'">'+
      (canEditChar(c) ? '<button class="row-del" data-action="del-stone" data-id="'+s.id+'" aria-label="Eliminar piedra">✕</button>' : '')+
    '</div>';
  });
  if(canEditChar(c)){
    html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-stone">+ Añadir piedra</button>';
  }
  html += '</div>';
  return html;
}

function tplAlquimia(c){
  var html = '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Laboratorio Alquímico y Venenos</span></div>';
  (c.poisons||[]).forEach(function(p){
    html += '<div class="creature-card">'+
      '<div class="creature-card-header">'+
        '<input type="text" class="creature-name-input" data-bind="poisons.'+p.id+'.name" value="'+esc(p.name)+'" placeholder="Nombre del veneno">'+
        '<div style="display:flex;align-items:center;gap:6px;">'+
          '<span style="font-size:.65rem;color:var(--ink-faint);">Dosis:</span>'+
          '<input type="number" style="width:40px;text-align:center;background:var(--bg-card);padding:2px;" data-bind="poisons.'+p.id+'.dosis" value="'+num(p.dosis,0)+'">'+
          (canEditChar(c) ? '<button class="row-del" data-action="del-poison" data-id="'+p.id+'" aria-label="Eliminar veneno">✕</button>' : '')+
        '</div>'+
      '</div>'+
      '<div class="creature-grid" style="grid-template-columns:1fr 1fr;margin-top:6px;">'+
        '<div class="creature-field"><label style="color:#E74C3C;">Efecto en Enemigos</label><textarea class="creature-notes" data-bind="poisons.'+p.id+'.efectoEnemigo">'+esc(p.efectoEnemigo)+'</textarea></div>'+
        '<div class="creature-field"><label style="color:var(--teal-light);">Efecto Propio (Buff)</label><textarea class="creature-notes" data-bind="poisons.'+p.id+'.efectoCherk">'+esc(p.efectoCherk)+'</textarea></div>'+
      '</div>'+
      '<div style="margin-top:6px;">'+
        '<select style="font-size:.72rem;background:var(--bg-card);padding:2px 6px;" data-bind="poisons.'+p.id+'.estado">'+
          '<option value="descubierto" '+(p.estado==='descubierto'?'selected':'')+'>Descubierto</option>'+
          '<option value="investigando" '+(p.estado==='investigando'?'selected':'')+'>Investigando...</option>'+
        '</select>'+
      '</div>'+
    '</div>';
  });
  if(canEditChar(c)){
    html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-poison">+ Añadir veneno / fórmula</button>';
  }
  html += '</div>';
  return html;
}

function tplInventario(c){
  var html = '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Dinero</span></div>'+
    '<div class="money-row">'+
      '<div class="money-field"><label>Oro</label><input type="number" data-bind="money.oro" value="'+num(c.money.oro,0)+'"></div>'+
      '<div class="money-field"><label>Plata</label><input type="number" data-bind="money.plata" value="'+num(c.money.plata,0)+'"></div>'+
    '</div></div>';

  html += '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Equipo e Inventario</span></div>';
  (c.inventory||[]).forEach(function(it){
    html += '<div class="list-row inv-row">'+
      '<input type="text" placeholder="Objeto" data-bind="inventory.'+it.id+'.name" value="'+esc(it.name)+'">'+
      '<input type="number" placeholder="Cant." data-bind="inventory.'+it.id+'.qty" value="'+num(it.qty,1)+'">'+
      (canEditChar(c) ? '<button class="row-del" data-action="del-inventory" data-id="'+it.id+'" aria-label="Eliminar objeto">✕</button>' : '')+
    '</div>';
  });
  if(canEditChar(c)){
    html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-inventory">+ Añadir objeto</button>';
  }
  html += '</div>';
  return html;
}

function tplInvocaciones(c){
  var html = '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Invocaciones y Familiares</span></div>';
  (c.summons||[]).forEach(function(s){
    html += '<div class="creature-card">' +
      '<div class="creature-card-header">' +
        '<input type="text" class="creature-name-input" placeholder="Nombre" data-bind="summons.' + s.id + '.name" value="' + esc(s.name) + '">' +
        (canEditChar(c) ? '<button class="row-del" data-action="del-summon" data-id="' + s.id + '" aria-label="Eliminar invocación">✕</button>' : '') +
      '</div>' +
      '<div class="creature-grid">' +
        creatureField("Vida", "summons." + s.id + ".vida", s.vida) +
        creatureField("Defensa", "summons." + s.id + ".defensa", s.defensa) +
        creatureField("Absorción", "summons." + s.id + ".absorcion", s.absorcion) +
        creatureField("Daño", "summons." + s.id + ".dano", s.dano) +
        creatureField("Movilidad", "summons." + s.id + ".movilidad", s.movilidad) +
        creatureField("Inteligencia", "summons." + s.id + ".inteligencia", s.inteligencia) +
      '</div>' +
      '<div class="creature-field" style="margin-top:6px;"><label>Habilidades, Tiradas y Rasgos</label><textarea class="creature-notes" placeholder="Ej: Melé 8+1d10, Rasgo..." data-bind="summons.' + s.id + '.habilidades">' + esc(s.habilidades||s.notas) + '</textarea></div>' +
    '</div>';
  });
  if(canEditChar(c)){
    html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-summon">+ Añadir invocación</button>';
  }
  html += '</div>';
  return html;
}
function creatureField(label,bind,val){
  return '<div class="creature-field"><label>'+esc(label)+'</label><input type="text" data-bind="'+bind+'" value="'+esc(val)+'"></div>';
}

function tplBestiario(s){
  var canEdit = isGM() || !currentUser;
  var pills = CONTINENTES.map(function(ct){
    return '<button class="f-pill '+(bestiaryContinentFilter===ct?'active':'')+'" data-action="set-bestiary-continent" data-continent="'+ct+'">'+ct+'</button>';
  }).join('');

  var rarityList = ["Todos"].concat(RAREZAS_LIST);
  var rarityPills = rarityList.map(function(r){
    var col = r==="Legendaria"?"#FDE047":r==="Muy rara"?"#C084FC":r==="Rara"?"#60A5FA":r==="Común"?"#C2B196":"var(--ink-dim)";
    var isAct = bestiaryRarityFilter === r;
    return '<button class="f-pill '+(isAct?'active':'')+'" data-action="set-bestiary-rarity" data-val="'+r+'" style="border-color:'+col+';'+(isAct?'background:'+col+';color:#120D0A;font-weight:700;':'color:'+col+';')+'">'+r+'</button>';
  }).join('');

  var mountPills = [
    {id:"Todos", label:"Todas"},
    {id:"monturas", label:"🐎 Solo Monturas"},
    {id:"no_monturas", label:"🚶 No montables"}
  ].map(function(m){
    return '<button class="f-pill '+(bestiaryMountFilter===m.id?'active':'')+'" data-action="set-bestiary-mount" data-val="'+m.id+'">'+m.label+'</button>';
  }).join('');

  var visibleBestiary = (s.bestiary||[]).filter(function(b){
    var matchCont = bestiaryContinentFilter==="Todos" || (b.continente||"Todos")===bestiaryContinentFilter;
    var matchRar = bestiaryRarityFilter==="Todos" || (b.rarity||"Común")===bestiaryRarityFilter;
    var matchMount = bestiaryMountFilter==="Todos" || (bestiaryMountFilter==="monturas" ? !!b.montable : !b.montable);
    if(canEdit) return matchCont && matchRar && matchMount;
    return b.visible !== false && matchCont && matchRar && matchMount;
  });

  var html = '<div class="section'+(canEdit?' gm-section':'')+'">'+
    '<div class="section-title"><span>'+(canEdit?'Bestiario y Monturas (GM)':'Bestiario y Monturas')+'</span></div>'+
    '<div class="filter-section"><div class="filter-label">Continente</div><div class="filter-pills">'+pills+'</div></div>'+
    '<div class="filter-section"><div class="filter-label">Rareza</div><div class="filter-pills">'+rarityPills+'</div></div>'+
    '<div class="filter-section"><div class="filter-label">Tipo</div><div class="filter-pills">'+mountPills+'</div></div>';

  visibleBestiary.forEach(function(b){
    var imgStyle = b.image ? ' style="background-image:url(\''+b.image+'\')"' : '';
    var rName = b.rarity || "Común";
    var rClass = "rarity-" + rName.toLowerCase().replace(/\s+/g,"");
    var bClass = "badge-" + rName.toLowerCase().replace(/\s+/g,"");

    html += '<div class="creature-card '+rClass+'">'+
      '<div class="creature-card-header">'+
        '<div style="display:flex;align-items:center;gap:6px;flex:1;min-width:0;flex-wrap:wrap;">'+
          (canEdit ? '<input type="text" class="creature-name-input" data-scope="global" placeholder="Nombre de criatura" data-bind="bestiary.'+b.id+'.nombre" value="'+esc(b.nombre)+'">' : '<div style="font-family:var(--font-display);color:var(--gold-light);font-size:1.05rem;font-weight:700;">'+esc(b.nombre)+'</div>')+
          '<span class="item-badge '+bClass+'">'+rName+'</span>'+
          '<span class="mount-pill '+(b.montable?'is-mount':'no-mount')+'">'+(b.montable?'🐎 Montura':'🚶 No montable')+'</span>'+
        '</div>'+
        '<div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap;">'+
          (canEdit ? '<select style="font-size:.72rem;background:var(--bg-card);padding:2px 4px;border:1px solid var(--line);" data-scope="global" data-bind="bestiary.'+b.id+'.rarity" title="Rareza">'+
            RAREZAS_LIST.map(function(r){return '<option value="'+r+'" '+((b.rarity||"Común")===r?'selected':'')+'>'+r+'</option>';}).join('')+
          '</select>' : '')+
          (canEdit ? '<select style="font-size:.72rem;background:var(--bg-card);padding:2px 4px;border:1px solid var(--line);" data-scope="global" data-bind="bestiary.'+b.id+'.continente" title="Continente">'+
            CONTINENTES.map(function(ct){return '<option value="'+ct+'" '+((b.continente||"Todos")===ct?'selected':'')+'>'+ct+'</option>';}).join('')+
          '</select>' : '<span style="font-size:.7rem;color:var(--ink-dim);">'+esc(b.continente||"Todos")+'</span>')+
          (canEdit ? '<button class="btn-compact '+(b.montable?'btn-solid-gold':'')+'" data-action="toggle-bestiary-mountable" data-id="'+b.id+'" title="Alternar si es montura">'+(b.montable?'🐎 Montable':'🚶 No montable')+'</button>' : '')+
          (canEdit ? '<button class="btn-compact" data-action="toggle-bestiary-visibility" data-id="'+b.id+'" title="Mostrar/Ocultar para jugadores">'+(b.visible!==false?'👁️':'🙈')+'</button>' : '')+
          (canEdit ? '<button class="row-del" data-action="del-bestiary" data-id="'+b.id+'" aria-label="Eliminar criatura">✕</button>' : '')+
        '</div>'+
      '</div>'+
      '<div class="creature-layout">'+
        '<div class="creature-profile-box">'+
          '<div class="creature-avatar-img"'+imgStyle+' title="'+esc(b.nombre)+'">'+(b.image ? '' : '🐉')+'</div>'+
          (canEdit ? '<div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:center;margin-top:2px;">'+
            '<button class="btn-compact" data-action="upload-bestiary-img" data-id="'+b.id+'" title="Subir foto desde archivo">Foto</button>'+
            '<button class="btn-compact" data-action="url-bestiary-img" data-id="'+b.id+'" title="Pegar URL de foto">URL</button>'+
            (b.image ? '<button class="btn-compact" data-action="remove-bestiary-img" data-id="'+b.id+'" title="Quitar foto">✕</button>' : '')+
          '</div>' : '')+
        '</div>'+
        '<div style="flex:1;min-width:0;">'+
          '<div class="creature-grid">'+
            (canEdit ? creatureFieldGlobal("Vida","bestiary."+b.id+".vida",b.vida) : '<div class="creature-field"><label>Vida</label><span style="font-size:.8rem;color:var(--ink-dim);">'+esc(b.vida||"-")+'</span></div>')+
            (canEdit ? creatureFieldGlobal("Defensa","bestiary."+b.id+".defensa",b.defensa) : '<div class="creature-field"><label>Defensa</label><span style="font-size:.8rem;color:var(--ink-dim);">'+esc(b.defensa||"-")+'</span></div>')+
            (canEdit ? creatureFieldGlobal("Absorción","bestiary."+b.id+".absorcion",b.absorcion) : '<div class="creature-field"><label>Absorción</label><span style="font-size:.8rem;color:var(--ink-dim);">'+esc(b.absorcion||"-")+'</span></div>')+
            (canEdit ? creatureFieldGlobal("Daño","bestiary."+b.id+".dano",b.dano) : '<div class="creature-field"><label>Daño</label><span style="font-size:.8rem;color:var(--ink-dim);">'+esc(b.dano||"-")+'</span></div>')+
            (canEdit ? creatureFieldGlobal("Movilidad","bestiary."+b.id+".movilidad",b.movilidad) : '<div class="creature-field"><label>Movilidad</label><span style="font-size:.8rem;color:var(--ink-dim);">'+esc(b.movilidad||"-")+'</span></div>')+
            (canEdit ? creatureFieldGlobal("Casillas Mov.","bestiary."+b.id+".casillasMovimiento",b.casillasMovimiento||"8") : '<div class="creature-field"><label>Casillas Mov.</label><span style="font-size:.8rem;color:var(--ink);font-weight:700;">🏃 '+(b.casillasMovimiento||"-")+' casillas</span></div>')+
            (canEdit ? creatureFieldGlobal("Doma (Dif.)","bestiary."+b.id+".doma",b.doma||"3") : '<div class="creature-field"><label>Doma (Dif.)</label><span style="font-size:.8rem;color:var(--gold-light);font-weight:700;">🎯 Dif. '+(b.doma||"-")+'</span></div>')+
          '</div>'+
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;gap:6px;flex-wrap:wrap;">'+
            '<button class="tame-btn" data-action="roll-tame" data-name="'+esc(b.nombre)+'" data-diff="'+(b.doma||"3")+'" title="Realizar tirada de doma con d10">🎲 Tirada de Doma (Dif. '+(b.doma||"3")+')</button>'+
          '</div>'+
          '<div class="creature-field" style="margin-top:6px;"><label>Habilidades y Rasgos</label>'+
            (canEdit ? '<textarea class="creature-notes" data-scope="global" data-bind="bestiary.'+b.id+'.habilidades">'+esc(b.habilidades||b.notas||"")+'</textarea>' : (b.habilidades||b.notas?'<p style="font-size:.78rem;color:var(--ink-dim);margin-top:4px;">'+esc(b.habilidades||b.notas)+'</p>':''))+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>';
  });
  
  if(canEdit){
    html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-bestiary">+ Añadir criatura</button>';
  }
  html += '</div>';
  return html;
}

function tplExtra(c){
  var html = '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Pasivas Negativas</span></div>';
  (c.passivesNeg||[]).forEach(function(p){
    html += '<div class="list-row text-row"><input type="text" data-bind="passivesNeg.'+p.id+'.text" value="'+esc(p.text)+'"><button class="row-del" data-action="del-passiveNeg" data-id="'+p.id+'" aria-label="Eliminar pasiva">✕</button></div>';
  });
  if(isGM()){
    html += '<button class="btn-compact" style="margin-top:6px;" data-action="add-passiveNeg">+ Añadir pasiva negativa</button>';
  }
  html += '</div>';

  html += '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Pasivas Positivas</span></div>';
  (c.passivesPos||[]).forEach(function(p){
    html += '<div class="list-row text-row"><input type="text" data-bind="passivesPos.'+p.id+'.text" value="'+esc(p.text)+'"><button class="row-del" data-action="del-passivePos" data-id="'+p.id+'" aria-label="Eliminar pasiva">✕</button></div>';
  });
  if(isGM()){
    html += '<button class="btn-compact" style="margin-top:6px;" data-action="add-passivePos">+ Añadir pasiva positiva</button>';
  }
  html += '</div>';

  html += '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Tabla de Diosas</span></div>';
  (c.goddessTable||[]).forEach(function(g){
    html += '<div class="list-row god-row">'+
      '<input type="text" placeholder="Nombre" data-bind="goddessTable.'+g.id+'.nombre" value="'+esc(g.nombre)+'">'+
      '<input type="text" placeholder="Gustos" data-bind="goddessTable.'+g.id+'.gustos" value="'+esc(g.gustos)+'">'+
      '<input type="text" placeholder="Disgustos" data-bind="goddessTable.'+g.id+'.disgustos" value="'+esc(g.disgustos)+'">'+
      '<button class="row-del" data-action="del-goddess" data-id="'+g.id+'" aria-label="Eliminar diosa">✕</button>'+
    '</div>';
  });
  if(isGM()){
    html += '<button class="btn-compact" style="margin-top:6px;" data-action="add-goddess">+ Añadir diosa</button>';
  }
  html += '</div>';
  return html;
}

var currentWorldSubtab = "mapas";

function tplMundo(s){
  var subtab = currentWorldSubtab || "mapas";
  var html = '<div class="section" style="margin-bottom:10px;">'+
    '<div class="filter-pills">'+
      '<button class="f-pill '+(subtab==='mapas'?'active':'')+'" data-action="set-world-subtab" data-val="mapas">🗺️ Mapas</button>'+
      '<button class="f-pill '+(subtab==='armas'?'active':'')+'" data-action="set-world-subtab" data-val="armas">⚔️ Catálogo de Armas</button>'+
      '<button class="f-pill '+(subtab==='buffs'?'active':'')+'" data-action="set-world-subtab" data-val="buffs">✨ Buffos</button>'+
      '<button class="f-pill '+(subtab==='lore'?'active':'')+'" data-action="set-world-subtab" data-val="lore">📜 Lore y Flora</button>'+
    '</div>'+
  '</div>';

  if(subtab === "mapas"){
    html += tplMundoMapas(s);
  } else if(subtab === "armas"){
    html += tplMundoArmas(s);
  } else if(subtab === "buffs"){
    html += tplMundoBuffs(s);
  } else {
    html += tplMundoLore(s);
  }
  return html;
}

function tplMundoMapas(s){
  var curMap = (s.maps||[]).find(function(m){return m.id===s.activeMapId;}) || s.maps[0];
  if(!curMap){ curMap={id:"world_main",name:"Mapa de Campaña",image:null,markers:[]}; s.maps=[curMap]; s.activeMapId=curMap.id; }

  var mapTabs = (s.maps||[]).map(function(m){
    return '<button class="f-pill '+(s.activeMapId===m.id?'active':'')+'" data-action="switch-map" data-id="'+m.id+'">'+esc(m.name)+'</button>';
  }).join('');

  var canEdit = isGM() || !currentUser;
  var html = '<div class="section'+(canEdit?' gm-section':'')+'"><div class="section-title">'+
    '<span>'+(canEdit?'Cartografía y Mapas (GM)':'Cartografía y Mapas')+'</span>'+
    '<button class="btn-compact" data-action="sync-map-now" title="Forzar descarga y sincronización">🔄 Sincronizar</button>'+
  '</div>'+
  (canEdit ? '<div class="map-toolbar">'+
    '<button class="btn-compact" data-action="add-new-map-url" title="Crear un mapa nuevo independiente mediante enlace / URL">+ Nuevo Mapa (URL)</button>'+
    '<button class="btn-compact" data-action="add-new-map-file" title="Crear un mapa nuevo independiente subiendo archivo">+ Nuevo Mapa (Archivo)</button>'+
  '</div>' : '')+
  '<div class="filter-pills" style="margin-bottom:10px;">'+mapTabs+'</div>';

  if(curMap.image){
    html += '<div class="map-viewer" data-action="'+(canEdit?'map-click':'')+'">'+
      '<img src="'+curMap.image+'" alt="Mapa">'+
      (curMap.markers||[]).map(function(m){
        var kindClass = m.kind==="Capital"?"pin-capital":m.kind==="Punto de Interés"?"pin-poi":m.kind==="Peligro"?"pin-peligro":"pin-ciudad";
        return '<div class="map-pin '+kindClass+'" style="left:'+m.x+'%;top:'+m.y+'%;" data-action="'+(canEdit?'edit-pin':'')+'" data-id="'+m.id+'">'+
          '<div class="pin-glyph"></div><div class="pin-tag">'+esc(m.name)+'</div>'+
        '</div>';
      }).join('')+
    '</div>';
  } else {
    html += '<div class="map-viewer" style="display:flex;align-items:center;justify-content:center;color:var(--ink-faint);font-size:.82rem;padding:40px 10px;">Sin imagen cargada en '+esc(curMap.name)+'.</div>';
  }
  
  if(canEdit){
    html += '<div class="map-toolbar" style="margin-top:8px;">'+
      '<span style="font-size:0.75rem;color:var(--ink-dim);margin-right:2px;width:100%;">Foto de este mapa ('+esc(curMap.name)+'):</span>'+
      '<button class="btn-compact" data-action="upload-map" title="Cambiar la imagen de este mapa subiendo un archivo">Subir Foto</button>'+
      '<button class="btn-compact" data-action="url-map" title="Cambiar la imagen de este mapa pegando un enlace URL">Pegar URL</button>'+
      (curMap.image?'<button class="btn-compact" data-action="remove-map" title="Quitar la foto pero conservar el mapa y sus marcadores">Quitar Foto</button>':'')+
      (s.maps.length>1?'<button class="btn-compact" style="margin-left:auto;color:var(--danger);" data-action="delete-map" title="Eliminar este mapa completo">✕ Borrar este Mapa</button>':'')+
    '</div>';
  }
  html += '</div>';
  return html;
}

function tplMundoArmas(s){
  var catalog = s.weaponsCatalog || [];
  var canEdit = isGM();
  var html = '<div class="section'+(canEdit?' gm-section':'')+'"><div class="section-title"><span>'+(canEdit?'Catálogo de Armas (GM)':'Catálogo de Armas')+'</span></div>';
  
  catalog.forEach(function(w){
    var isLocked = (w.visible === false);
    html += '<div class="creature-card weapon-card'+(isLocked?' is-locked':'')+'">'+
      '<div class="creature-card-header">'+
        '<div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0;flex-wrap:wrap;">'+
          (canEdit ? '<input type="text" class="creature-name-input" data-scope="global" data-bind="weaponsCatalog.'+w.id+'.name" value="'+esc(w.name)+'" placeholder="Nombre del arma">' : '<div style="font-family:var(--font-display);color:var(--gold-light);font-size:1.02rem;font-weight:700;">'+esc(w.name)+'</div>')+
          (isLocked ? '<span class="weapon-status-badge locked" title="Arma bloqueada por el Máster">🔒 Bloqueada</span>' : '<span class="weapon-status-badge visible" title="Arma visible y usable para todos">👁️ Visible</span>')+
        '</div>'+
        (canEdit ? '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">'+
          '<button class="btn-compact btn-lock-weapon '+(isLocked?'locked':'')+'" data-action="toggle-weapon-visibility" data-id="'+w.id+'" title="'+(isLocked?'Desbloquear arma para jugadores':'Bloquear arma para jugadores')+'">'+(isLocked?'🔓 Desbloquear':'🔒 Bloquear')+'</button>'+
          '<button class="row-del" data-action="del-global-weapon" data-id="'+w.id+'" aria-label="Eliminar arma">✕</button>'+
        '</div>' : '')+
      '</div>'+
      '<div class="creature-grid" style="grid-template-columns:1fr 1fr;">'+
        (canEdit ? '<div class="creature-field"><label>Daño Base</label><input type="text" data-scope="global" data-bind="weaponsCatalog.'+w.id+'.dano" value="'+esc(w.dano)+'"></div>' : '<div class="creature-field"><label>Daño</label><span style="font-size:.8rem;color:var(--ink-dim);">'+esc(w.dano||"-")+'</span></div>')+
        (canEdit ? '<div class="creature-field"><label>Alcance</label><input type="text" data-scope="global" data-bind="weaponsCatalog.'+w.id+'.alcance" value="'+esc(w.alcance)+'"></div>' : '<div class="creature-field"><label>Alcance</label><span style="font-size:.8rem;color:var(--ink-dim);">'+esc(w.alcance||"-")+'</span></div>')+
      '</div>'+
      (canEdit ? '<div class="creature-field" style="margin-bottom:6px;"><label style="color:#FDE047;">Efecto en Crítico</label><input type="text" data-scope="global" data-bind="weaponsCatalog.'+w.id+'.critico" value="'+esc(w.critico)+'" placeholder="Ej: Doble daño / Sangrado"></div>' : (w.critico?'<p style="font-size:.75rem;color:#FDE047;margin-bottom:6px;"><b>Crítico:</b> '+esc(w.critico)+'</p>':''))+
      (canEdit ? '<div class="creature-field"><label>Descripción / Lore</label><textarea class="creature-notes" data-scope="global" data-bind="weaponsCatalog.'+w.id+'.desc">'+esc(w.desc)+'</textarea></div>' : (w.desc?'<p style="font-size:.78rem;color:var(--ink-dim);">'+esc(w.desc)+'</p>':''))+
    '</div>';
  });
  
  if(canEdit){
    html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-global-weapon">+ Añadir nueva arma al compendio global</button>';
  }
  html += '</div>';
  return html;
}

function tplMundoBuffs(s){
  var canEdit = isGM();
  var html = '<div class="section'+(canEdit?' gm-section':'')+'"><div class="section-title"><span>'+(canEdit?'Catálogo de Buffos y Debuffos (GM)':'Buffos y Debuffos')+'</span></div>';
  
  var visibleBuffs = (s.buffCatalog||[]).filter(function(b){
    if(canEdit) return true;
    return b.visible !== false;
  });

  html += '<div class="filter-pills" style="margin-bottom:10px;">'+
    '<button class="f-pill '+(currentBuffTab==='buffs'?'active':'')+'" data-action="set-buff-tab" data-val="buffs">Buffs</button>'+
    '<button class="f-pill '+(currentBuffTab==='debuffs'?'active':'')+'" data-action="set-buff-tab" data-val="debuffs">Debuffs</button>'+
    '<button class="f-pill '+(currentBuffTab==='all'?'active':'')+'" data-action="set-buff-tab" data-val="all">Todos</button>'+
  '</div>';

  visibleBuffs.forEach(function(b){
    var showType = currentBuffTab==="all" || (currentBuffTab==="buffs" && b.type==="buff") || (currentBuffTab==="debuffs" && b.type==="debuff");
    if(!showType) return;

    var attrOptions = '<option value="">-- Seleccionar --</option>'+
      '<optgroup label="Atributos">'+
        ATTRS.map(function(a){
          return '<option value="'+a+'" '+((b.attr||'')===a?'selected':'')+'>'+ATTR_LABELS[a]+'</option>';
        }).join('')+
      '</optgroup>'+
      '<optgroup label="Habilidades">'+
        SKILL_DEFS.map(function(sk){
          return '<option value="'+sk.id+'" '+((b.attr||'')===sk.id?'selected':'')+'>'+esc(sk.name)+'</option>';
        }).join('')+
      '</optgroup>'+
      '<optgroup label="Otros">'+
        '<option value="todo" '+((b.attr||'')==='todo'?'selected':'')+'>Todo</option>'+
        '<option value="vida" '+((b.attr||'')==='vida'?'selected':'')+'>Vida</option>'+
        '<option value="daño" '+((b.attr||'')==='daño'?'selected':'')+'>Daño</option>'+
        '<option value="veneno" '+((b.attr||'')==='veneno'?'selected':'')+'>Veneno</option>'+
        '<option value="iniciativa" '+((b.attr||'')==='iniciativa'?'selected':'')+'>Iniciativa</option>'+
        '<option value="movilidad" '+((b.attr||'')==='movilidad'?'selected':'')+'>Movilidad</option>'+
        '<option value="defensa" '+((b.attr||'')==='defensa'?'selected':'')+'>Defensa</option>'+
        '<option value="defensaMagica" '+((b.attr||'')==='defensaMagica'?'selected':'')+'>Defensa Mágica</option>'+
      '</optgroup>';

    html += '<div class="creature-card">'+
      '<div class="creature-card-header">'+
        (canEdit ? '<input type="text" class="creature-name-input" data-scope="global" data-bind="buffCatalog.'+b.id+'.name" value="'+esc(b.name)+'" placeholder="Nombre del buffo">' : '<div style="font-family:var(--font-display);color:var(--gold-light);font-size:1.02rem;">'+esc(b.name)+'</div>')+
        (canEdit ? '<div style="display:flex;gap:4px;align-items:center;">'+
          '<select style="font-size:.72rem;background:var(--bg-card);padding:2px 4px;border:1px solid var(--line);border-radius:5px;color:var(--ink);" data-scope="global" data-bind="buffCatalog.'+b.id+'.type">'+
            '<option value="buff" '+((b.type||'buff')==='buff'?'selected':'')+'>Buff</option>'+
            '<option value="debuff" '+((b.type||'buff')==='debuff'?'selected':'')+'>Debuff</option>'+
          '</select>'+
          '<button class="btn-compact" data-action="toggle-buff-visibility" data-id="'+b.id+'" title="Mostrar/Ocultar">'+(b.visible!==false?'👁️':'🙈')+'</button>'+
          '<button class="row-del" data-action="del-global-buff" data-id="'+b.id+'" aria-label="Eliminar">✕</button>'+
        '</div>' : '<span style="font-size:.7rem;color:'+(b.type==='debuff'?'var(--danger)':'var(--teal-light)')+';">'+(b.type==='debuff'?'Debuff':'Buff')+'</span>')+
      '</div>'+
      '<div class="creature-grid" style="grid-template-columns:1fr 1fr 1fr 1fr;">'+
        (canEdit ? '<div class="creature-field"><label>Atributo/Afecta</label>'+
          '<select style="font-size:.72rem;background:var(--bg-card);padding:2px 4px;border:1px solid var(--line);border-radius:5px;color:var(--ink);" data-scope="global" data-bind="buffCatalog.'+b.id+'.attr">'+
            attrOptions+
          '</select></div>' : '<div class="creature-field"><label>Afecta</label><span style="font-size:.8rem;color:var(--ink-dim);">'+esc(b.attr||"-")+'</span></div>')+
        (canEdit ? '<div class="creature-field"><label>Bonus</label><input type="text" data-scope="global" data-bind="buffCatalog.'+b.id+'.bonus" value="'+esc(b.bonus)+'" placeholder="+1, -2, 1d6..."></div>' : '<div class="creature-field"><label>Bonus</label><span style="font-size:.8rem;color:var(--ink-dim);">'+esc(b.bonus||"-")+'</span></div>')+
        (canEdit ? '<div class="creature-field"><label>Duración</label>'+
          '<select style="font-size:.72rem;background:var(--bg-card);padding:2px 4px;border:1px solid var(--line);border-radius:5px;color:var(--ink);" data-scope="global" data-bind="buffCatalog.'+b.id+'.duration">'+
            '<option value="permanent" '+((b.duration||'permanent')==='permanent'?'selected':'')+'>Permanente</option>'+
            '<option value="turns" '+((b.duration||'permanent')==='turns'?'selected':'')+'>Por turnos</option>'+
          '</select></div>' : '<div class="creature-field"><label>Duración</label><span style="font-size:.8rem;color:var(--ink-dim);">'+esc(b.duration==='turns'?(b.durationTurns||0)+' turnos':'Permanente')+'</span></div>')+
        (canEdit && b.duration==='turns' ? '<div class="creature-field"><label>Nº Turnos</label><input type="number" min="1" data-scope="global" data-bind="buffCatalog.'+b.id+'.durationTurns" value="'+(b.durationTurns||1)+'"></div>' : '')+
      '</div>'+
      (canEdit ? '<div class="creature-field"><label>Descripción</label><textarea class="creature-notes" data-scope="global" data-bind="buffCatalog.'+b.id+'.desc">'+esc(b.desc)+'</textarea></div>' : (b.desc?'<p style="font-size:.78rem;color:var(--ink-dim);margin-top:4px;">'+esc(b.desc)+'</p>':''))+
    '</div>';
  });

  if(canEdit){
    html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-global-buff">+ Añadir nuevo buff/debuff</button>';
  }
  html += '</div>';
  return html;
}

function tplMundoLore(s){
  var contPills = CONTINENTES.map(function(c){return '<button class="f-pill '+(loreContinentFilter===c?'active':'')+'" data-action="set-lore-continent" data-val="'+c+'">'+c+'</button>';}).join('');
  var typePills = TIPOS_OBJETO.map(function(t){return '<button class="f-pill '+(loreTypeFilter===t?'active':'')+'" data-action="set-lore-type" data-val="'+t+'">'+t+'</button>';}).join('');
  var terrPills = TERRENOS.map(function(tr){return '<button class="f-pill '+(loreTerrainFilter===tr?'active':'')+'" data-action="set-lore-terrain" data-val="'+tr+'">'+tr+'</button>';}).join('');

  var canEdit = isGM();
  var html = '<div class="section'+(canEdit?' gm-section':'')+'"><div class="section-title"><span>'+(canEdit?'Compendio de Lore, Fauna y Flora (GM)':'Compendio de Lore, Fauna y Flora')+'</span></div>'+
    '<div class="filter-section"><div class="filter-label">Continente</div><div class="filter-pills">'+contPills+'</div></div>'+
    (currentLoreSubtab==="objetos"?
      '<div class="filter-section"><div class="filter-label">Tipo</div><div class="filter-pills">'+typePills+'</div></div>'+
      '<div class="filter-section"><div class="filter-label">Terreno</div><div class="filter-pills">'+terrPills+'</div></div>':'')+
    '<div class="filter-pills" style="margin:10px 0;border-bottom:1px solid var(--line);padding-bottom:6px;">'+
      '<button class="f-pill '+(currentLoreSubtab==='objetos'?'active':'')+'" data-action="set-lore-subtab" data-val="objetos">🌿 Recursos / Objetos</button>'+
      '<button class="f-pill '+(currentLoreSubtab==='pistas'?'active':'')+'" data-action="set-lore-subtab" data-val="pistas">📜 Pistas</button>'+
      '<button class="f-pill '+(currentLoreSubtab==='npcs'?'active':'')+'" data-action="set-lore-subtab" data-val="npcs">👤 NPCs</button>'+
    '</div>';

  var cat = currentLoreSubtab;
  var items = (s.lore[cat]||[]).filter(function(it){
    if(!canEdit && it.visible===false) return false;
    var matchC = (loreContinentFilter==="Todos" || (it.continent||"Todos")===loreContinentFilter || (it.continent||"Todos")==="Todos");
    var matchT = (loreTypeFilter==="Todos" || (it.type||"")===loreTypeFilter);
    var matchTr = (loreTerrainFilter==="Todos" || (it.terrain||"").includes(loreTerrainFilter));
    return matchC && (cat!=="objetos" || (matchT && matchTr));
  });

  items.forEach(function(it){
    var rName = it.rarity || "Común";
    var rClass = "rarity-" + rName.toLowerCase().replace(/\s+/g,"");
    var bClass = "badge-" + rName.toLowerCase().replace(/\s+/g,"");

    html += '<div class="item-card '+rClass+'">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">'+
        '<div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap;">'+
          '<span class="item-badge '+bClass+'">'+rName+'</span>'+
          (it.type ? '<span style="font-size:.62rem;color:var(--teal-light);font-weight:700;">['+esc(it.type)+']</span>' : '')+
          (it.terrain ? '<span style="font-size:.62rem;color:var(--ink-faint);">📍 '+esc(it.terrain)+'</span>' : '')+
        '</div>'+
        '<div style="display:flex;gap:4px;">'+
          (canEdit ? '<button class="btn-compact" data-action="toggle-lore-visibility" data-cat="' + cat + '" data-id="' + it.id + '" title="Mostrar/Ocultar para jugadores">'+(it.visible!==false?'👁️':'🙈')+'</button>' : '')+
          (canEdit ? '<button class="row-del" data-action="del-lore" data-cat="' + cat + '" data-id="' + it.id + '" aria-label="Eliminar entrada">✕</button>' : '')+
        '</div>'+
      '</div>'+
      (canEdit ? '<input type="text" style="width:100%;font-family:var(--font-display);color:var(--gold-light);font-size:.95rem;margin-bottom:4px;" data-scope="global" data-bind="lore.'+cat+'.'+it.id+'.title" value="'+esc(it.title)+'" placeholder="Nombre">' : '<div style="font-family:var(--font-display);color:var(--gold-light);font-size:.95rem;margin-bottom:4px;">'+esc(it.title)+'</div>')+
      (canEdit ? '<textarea style="width:100%;font-size:.82rem;min-height:45px;" data-scope="global" data-bind="lore.'+cat+'.'+it.id+'.text" placeholder="Descripción...">'+esc(it.text)+'</textarea>' : '<p style="font-size:.82rem;color:var(--ink-dim);">'+esc(it.text)+'</p>')+
    '</div>';
  });

  if(canEdit){
    html += '<button class="btn-compact" data-action="open-lore-modal" data-cat="'+cat+'" style="margin-top:6px;">+ Añadir a '+cat+'</button>';
  }
  html += '</div>';
  return html;
}

function openLoreModal(cat){
  var titleLabel = cat === "objetos" ? "Recurso / Objeto" : (cat === "pistas" ? "Pista" : "NPC");
  
  var rarityBtns = RAREZAS_LIST.map(function(r){
    var col = r==="Legendaria"?"#FDE047":r==="Muy rara"?"#C084FC":r==="Rara"?"#60A5FA":"#C2B196";
    return '<button type="button" class="f-pill lore-rarity-btn" data-val="'+r+'" style="border-color:'+col+';color:'+col+';"><span>'+r+'</span></button>';
  }).join('');

  var typeSection = '';
  if(cat === "objetos"){
    var typeBtns = TIPOS_OBJETO_MODAL.map(function(t){
      return '<button type="button" class="f-pill lore-type-btn" data-val="'+t+'"><span>'+t+'</span></button>';
    }).join('');
    var terrainBtns = TERRENOS_MODAL.map(function(tr){
      return '<button type="button" class="f-pill lore-terrain-btn" data-val="'+tr+'"><span>'+tr+'</span></button>';
    }).join('');
    
    typeSection = '<div class="field" style="margin-top:10px;"><label>Tipo de Objeto</label><div class="filter-pills" id="loreModalTypes" style="flex-wrap:wrap;gap:4px;">'+typeBtns+'</div></div>'+
                  '<div class="field" style="margin-top:10px;"><label>Terreno</label><div class="filter-pills" id="loreModalTerrains" style="flex-wrap:wrap;gap:4px;">'+terrainBtns+'</div></div>';
  } else if(cat === "pistas" || cat === "npcs"){
    typeSection = '<div class="field" style="margin-top:10px;"><label>Tipo / Categoría</label><input type="text" id="loreModalCustomType" placeholder="Ej: Aliado, Lugar, Misterio..."></div>';
  }

  var continentBtns = CONTINENTES_MODAL.map(function(cnt){
    return '<button type="button" class="f-pill lore-cont-btn" data-val="'+cnt+'"><span>'+cnt+'</span></button>';
  }).join('');

  var html = '<h2>Nuevo '+titleLabel+'<button data-action="close-lore-modal" aria-label="Cerrar">&times;</button></h2>'+
    '<div class="field"><label>Nombre</label><input type="text" id="loreModalTitle" placeholder="Ej: Flor de Lirio"></div>'+
    '<div class="field" style="margin-top:8px;"><label>Rareza</label><div class="filter-pills" id="loreModalRarities" style="flex-wrap:wrap;gap:4px;">'+rarityBtns+'</div></div>'+
    typeSection+
    '<div class="field" style="margin-top:10px;"><label>Continente</label><div class="filter-pills" id="loreModalContinents" style="flex-wrap:wrap;gap:4px;">'+continentBtns+'</div></div>'+
    '<div class="field" style="margin-top:8px;"><label>Descripción / Efecto</label><textarea id="loreModalText" placeholder="Detalles o efectos..."></textarea></div>'+
    '<button class="btn-solid-gold" style="width:100%;margin-top:14px;padding:8px;" data-action="save-new-lore" data-cat="'+cat+'">Crear y Guardar</button>';

  document.getElementById("loreModal").innerHTML = html;
  
  var rSel = document.querySelectorAll("#loreModalRarities .lore-rarity-btn");
  if(rSel.length){ rSel[0].classList.add("active"); rSel[0].dataset.selected="true"; }
  
  if(cat === "objetos"){
    var tSel = document.querySelectorAll("#loreModalTypes .lore-type-btn");
    if(tSel.length){ tSel[0].classList.add("active"); tSel[0].dataset.selected="true"; }
    var trSel = document.querySelectorAll("#loreModalTerrains .lore-terrain-btn");
    if(trSel.length){ trSel[0].classList.add("active"); trSel[0].dataset.selected="true"; }
  }
  
  var cSel = document.querySelectorAll("#loreModalContinents .lore-cont-btn");
  if(cSel.length){ cSel[0].classList.add("active"); cSel[0].dataset.selected="true"; }

  document.getElementById("loreModalOverlay").classList.remove("hidden");
}

function loreModalClick(e){
  var pill = e.target.closest(".f-pill");
  if(pill){
    var parent = pill.parentElement;
    parent.querySelectorAll(".f-pill").forEach(function(b){ b.classList.remove("active"); delete b.dataset.selected; });
    pill.classList.add("active");
    pill.dataset.selected = "true";
    return;
  }

  var btn = e.target.closest("[data-action]"); if(!btn) return;
  var action = btn.getAttribute("data-action");
  if(action==="close-lore-modal"){ document.getElementById("loreModalOverlay").classList.add("hidden"); return; }
  if(action==="save-new-lore"){
    var cat = btn.getAttribute("data-cat");
    var titleVal = (document.getElementById("loreModalTitle")||{}).value || "";
    var textVal = (document.getElementById("loreModalText")||{}).value || "";
    
    var rBtn = document.querySelector("#loreModalRarities [data-selected='true']");
    var rarityVal = rBtn ? rBtn.getAttribute("data-val") : "Común";

    var typeVal = "";
    if(cat === "objetos"){
      var tBtn = document.querySelector("#loreModalTypes [data-selected='true']");
      typeVal = tBtn ? tBtn.getAttribute("data-val") : "Veneno";
    } else {
      typeVal = (document.getElementById("loreModalCustomType")||{}).value || "";
    }

    var trBtn = document.querySelector("#loreModalTerrains [data-selected='true']");
    var terrainVal = trBtn ? trBtn.getAttribute("data-val") : "";

    var cBtn = document.querySelector("#loreModalContinents [data-selected='true']");
    var contVal = cBtn ? cBtn.getAttribute("data-val") : "Todos";

    if(!titleVal.trim()){ showToast("Introduce un nombre.", "error"); return; }

    state.lore[cat].push({
      id: uid(),
      title: titleVal.trim(),
      text: textVal.trim(),
      rarity: rarityVal,
      type: typeVal,
      terrain: terrainVal,
      continent: contVal,
      visible: true
    });

    saveState(true);
    pushSharedData();
    document.getElementById("loreModalOverlay").classList.add("hidden");
    renderTab();
    showToast("Entrada creada con éxito", "success");
    return;
  }
}

function openPinModal(mapObj, x, y, pinId){
  var pin = pinId ? (mapObj.markers||[]).find(function(p){return p.id===pinId;}) : {id:uid(), x:x, y:y, name:"", kind:"Ciudad", notes:""};
  document.getElementById("pinModal").innerHTML =
    '<h2>'+(pinId?'Editar Marcador':'Nuevo Punto en '+esc(mapObj.name))+'<button data-action="close-modal" aria-label="Cerrar">&times;</button></h2>'+
    '<div class="field"><label>Nombre del Lugar</label><input type="text" id="pinInputName" value="'+esc(pin.name)+'" placeholder="Ej: Ruinas Antiguas"></div>'+
    '<div class="field" style="margin-top:8px;"><label>Tipo de Marcador</label><select id="pinInputKind">'+
      ['Ciudad','Capital','Punto de Interés','Peligro'].map(function(k){return '<option value="'+k+'" '+(pin.kind===k?'selected':'')+'>'+k+'</option>';}).join('')+
    '</select></div>'+
    '<div class="field" style="margin-top:8px;"><label>Notas / Secretos</label><textarea id="pinInputNotes">'+esc(pin.notes)+'</textarea></div>'+
    '<div style="display:flex;gap:6px;margin-top:12px;">'+
      '<button class="btn-solid-gold" style="flex:1;" data-action="save-pin" data-id="'+pin.id+'" data-x="'+pin.x+'" data-y="'+pin.y+'">Guardar</button>'+
      (pinId?'<button class="btn-compact" style="color:var(--danger);" data-action="del-pin" data-id="'+pin.id+'">Borrar</button>':'')+
    '</div>';
  document.getElementById("pinModalOverlay").classList.remove("hidden");
}

function pinModalClick(e){
  var btn = e.target.closest("[data-action]"); if(!btn) return;
  var action = btn.getAttribute("data-action");
  var curM = (state.maps||[]).find(function(m){return m.id===state.activeMapId;});
  if(action==="close-modal"){ closeModals(); return; }
  if(action==="save-pin" && curM){
    var pid = btn.getAttribute("data-id");
    var existing = (curM.markers||[]).find(function(p){return p.id===pid;});
    var pData = existing || {id:pid, x:btn.getAttribute("data-x"), y:btn.getAttribute("data-y")};
    pData.name = document.getElementById("pinInputName").value.trim()||"Punto de Interés";
    pData.kind = document.getElementById("pinInputKind").value;
    pData.notes = document.getElementById("pinInputNotes").value;
    if(!existing){ if(!curM.markers) curM.markers=[]; curM.markers.push(pData); }
    saveState(true); pushMapsData(); closeModals(); renderTab();
    showToast("Marcador guardado", "success");
    return;
  }
  if(action==="del-pin" && curM){
    curM.markers = (curM.markers||[]).filter(function(p){return p.id!==btn.getAttribute("data-id");});
    saveState(true); pushMapsData(); closeModals(); renderTab();
    showToast("Marcador eliminado", "info");
    return;
  }
}

function openCharModal(){
  var chars = getUserCharacters();
  var html = '<h2>Selección de Personaje<button data-action="close-modal" aria-label="Cerrar">&times;</button></h2>';
  chars.forEach(function(c){
    var cTheme = c.theme || "default";
    var swatches = THEME_LIST.map(function(t){
      var isAct = cTheme === t.id;
      return '<button type="button" class="swatch swatch-'+t.id+(isAct?' active':'')+'" data-action="set-theme" data-id="'+c.id+'" data-theme="'+t.id+'" title="Color '+t.label+'" aria-label="Color '+t.label+'"></button>';
    }).join('');
    var crestStyle = c.portrait ? ' style="background-image:url(\''+c.portrait+'\')"' : '';
    var isNPC = !!c.isNPC;
    var canDelete = isGM() || !currentUser || (currentUser && c.owner_id === currentUser.id);

    var avatarContent = (c.portrait && c.portrait.trim())
      ? '<img src="' + esc(c.portrait) + '" alt="' + esc(c.name) + '" class="cli-avatar-img" onerror="this.style.display=\'none\';if(this.nextElementSibling)this.nextElementSibling.style.display=\'flex\';"><span class="cli-initial" style="display:none;">' + esc(c.name.charAt(0).toUpperCase()) + '</span>'
      : '<span class="cli-initial">' + esc(c.name.charAt(0).toUpperCase()) + '</span>';

    html += '<div class="char-list-item'+(c.id===state.activeId?' active':'')+(isNPC?' npc-item':'')+'" data-theme="'+cTheme+'">'+
      '<div style="display:flex;align-items:center;gap:12px;width:100%;">'+
        '<div class="cli-main-select" data-action="pick-char" data-id="'+c.id+'" style="display:flex;align-items:center;gap:12px;flex:1;min-width:0;cursor:pointer;">'+
          '<div class="char-list-avatar'+(isNPC?' npc-avatar':'')+'" data-theme="'+cTheme+'"'+crestStyle+'>'+avatarContent+'</div>'+
          '<div class="cli-info">'+
            '<div class="cli-name'+(isNPC?' npc-name':'')+'">'+esc(c.name)+(c.id===state.activeId?' <span style="font-size:0.68rem;color:var(--gold-light);font-weight:700;padding:2px 6px;border-radius:4px;background:rgba(176,141,87,0.22);margin-left:4px;border:1px solid rgba(176,141,87,0.4);">Activo</span>':'')+'</div>'+
            '<div class="cli-sub">'+(isNPC?'NPC · ':'Nv. '+esc(c.nivel||"1")+' · ')+esc(c.trabajo||"Aventurero")+'</div>'+
          '</div>'+
        '</div>'+
        (canDelete?'<button type="button" class="row-del" data-action="del-char" data-id="'+c.id+'" aria-label="Eliminar personaje" title="Eliminar personaje" style="min-width:32px;min-height:32px;width:32px;height:32px;font-size:1.1rem;cursor:pointer;">✕</button>':'')+
      '</div>'+
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:10px;padding-top:8px;border-top:1px solid rgba(176,141,87,0.15);width:100%;flex-wrap:wrap;">'+
        '<span style="font-size:0.72rem;color:var(--ink-dim);letter-spacing:0.02em;">🎨 Color de acento:</span>'+
        '<div class="theme-swatches">'+swatches+'</div>'+
      '</div>'+
    '</div>';
  });
  html += '<button class="btn-compact" style="width:100%;margin-top:10px;padding:8px;" data-action="add-char">+ Crear Nuevo Personaje</button>';
  if(isGM() || !currentUser){
    html += '<button class="btn-gm" style="width:100%;margin-top:8px;padding:8px;" data-action="add-npc">+ Crear Nuevo NPC</button>';
  }
  document.getElementById("charModal").innerHTML = html;
  document.getElementById("charModalOverlay").classList.remove("hidden");
}

function openDataModal(){
  var html = '<h2>Ajustes y Cuenta<button data-action="close-modal" aria-label="Cerrar">&times;</button></h2>';
  if(currentUser){
    html += '<div style="font-size:0.85rem;color:var(--ink-dim);margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;background:rgba(0,0,0,0.3);padding:10px 12px;border-radius:8px;border:1px solid var(--line);">'+
      '<div>'+
        '<div style="font-size:0.7rem;color:var(--ink-faint);text-transform:uppercase;letter-spacing:0.04em;">Conectado como</div>'+
        '<div style="color:var(--gold-light);font-weight:700;font-size:0.95rem;">'+esc(currentUser.email)+' <span style="font-size:0.72rem;color:var(--gold);font-weight:400;">('+ (currentRole === 'gm' ? 'Máster' : 'Jugador') +')</span></div>'+
      '</div>'+
      '<button class="btn-compact" data-action="auth-logout" style="padding:6px 12px;">Cerrar sesión</button>'+
    '</div>';
  } else {
    html += '<div style="font-size:0.8rem;color:var(--ink-dim);margin-bottom:10px;">Inicia sesión con tu cuenta para guardar y sincronizar tu personaje:</div>'+
      '<div class="field"><label>Email</label><input type="email" id="authEmail" placeholder="tu-correo@gmail.com"></div>'+
      '<div class="field" style="margin-top:8px;"><label>Contraseña</label><input type="password" id="authPass" placeholder="••••••••"></div>'+
      '<div style="display:flex;gap:8px;margin-top:12px;">'+
        '<button class="btn-solid-gold" style="flex:1;padding:8px;" data-action="auth-login">Entrar</button>'+
        '<button class="btn-compact" style="flex:1;padding:8px;" data-action="auth-signup">Crear cuenta</button>'+
      '</div>';
  }

  html += '<div style="margin-top:16px;border-top:1px solid var(--line);padding-top:14px;">'+
    '<div style="font-size:0.82rem;font-weight:700;color:var(--gold-light);margin-bottom:8px;">💾 Guardar y restaurar partida</div>'+
    '<div style="display:flex;gap:8px;">'+
      '<button class="btn-compact" style="flex:1;padding:8px;" data-action="download-full-backup" title="Descargar un archivo JSON con todos los datos">Descargar copia (.json)</button>'+
      '<button class="btn-compact" style="flex:1;padding:8px;" data-action="import-data" title="Cargar un archivo de copia anterior">Cargar copia</button>'+
    '</div>'+
    (isGM() ? '<button class="btn-compact btn-solid-gold" style="width:100%;margin-top:8px;padding:8px;" data-action="cloud-backup-now">☁️ Guardar copia en la nube ahora</button>' : '')+
    '<div style="font-size:0.72rem;color:var(--ink-faint);margin-top:10px;line-height:1.4;">'+
      '💡 <i>Descárgate una copia de vez en cuando para tenerla guardada en tu Drive o en el móvil. Si pasa algo raro con la web, pásale el archivo a Lolo (rolillo55ac@gmail.com).</i>'+
    '</div>'+
    '<button class="btn-solid-gold" style="width:100%;margin-top:12px;padding:9px;" data-action="reset-all-characters">↻ Restablecer personajes oficiales (PDF)</button>'+
  '</div>';

  document.getElementById("dataModal").innerHTML = html;
  document.getElementById("dataModalOverlay").classList.remove("hidden");
}

var diceConfig = {qty:1, sides:10, mod:0, mode:"normal"};
function openDiceModal(){
  var sidesList = [4, 6, 8, 10, 12, 20, 100];
  var diceCards = sidesList.map(function(s){
    return '<div class="dtype-card '+(diceConfig.sides===s?'active':'')+'" data-action="pick-die" data-sides="'+s+'" role="button" tabindex="0">'+
      getDieSvg(s)+
      '<span>'+(s===100?'d%':'d'+s)+'</span>'+
    '</div>';
  }).join('');

  document.getElementById("diceModal").innerHTML =
    '<div class="cup-modal-header">'+
      '<div class="cup-modal-icon">'+getOrnateCupSvg()+'</div>'+
      '<div class="cup-modal-title">'+
        '<h3>Cubilete de Aventurero</h3>'+
        '<div class="cup-modal-sub">Selecciona dados, modalidad y lanza tu destino</div>'+
      '</div>'+
      '<button class="row-del" data-action="close-modal" aria-label="Cerrar" style="min-width:30px;min-height:30px;font-size:1rem;">✕</button>'+
    '</div>'+
    '<div class="dice-mode-pills">'+
      '<button class="dmode-pill '+(diceConfig.mode==='normal'?'active':'')+'" data-action="set-dice-mode" data-mode="normal">⚔️ Normal</button>'+
      '<button class="dmode-pill '+(diceConfig.mode==='adv'?'active':'')+'" data-action="set-dice-mode" data-mode="adv">🍀 Ventaja</button>'+
      '<button class="dmode-pill '+(diceConfig.mode==='disadv'?'active':'')+'" data-action="set-dice-mode" data-mode="disadv">💀 Desventaja</button>'+
    '</div>'+
    '<div class="cup-tray-label">Dados Poliédricos</div>'+
    '<div class="dtype-grid">'+diceCards+'</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px;">'+
      (diceConfig.sides===100?'<div></div>':'<div class="field"><label>Cantidad</label>'+
        '<div class="qty-control-row">'+
          '<button class="qty-btn" data-action="dec-dice-qty">-</button>'+
          '<input type="number" min="1" max="20" id="diceQty" value="'+diceConfig.qty+'" style="width:48px;text-align:center;">'+
          '<button class="qty-btn" data-action="inc-dice-qty">+</button>'+
        '</div>'+
        '<div class="quick-qty-chips" style="margin-top:4px;">'+
          [1,2,3,4].map(function(q){
            return '<button class="qty-chip '+(diceConfig.qty===q?'active':'')+'" data-action="set-dice-qty" data-qty="'+q+'">x'+q+'</button>';
          }).join('')+
        '</div>'+
      '</div>')+
      '<div class="field"><label>Modificador</label>'+
        '<div class="mod-control-row">'+
          '<input type="number" id="diceMod" value="'+diceConfig.mod+'" style="width:60px;text-align:center;">'+
          '<div class="quick-mod-chips">'+
            [-2,0,1,2,5].map(function(m){
              return '<button class="mod-chip '+(diceConfig.mod===m?'active':'')+'" data-action="set-dice-mod" data-mod="'+m+'">'+(m>0?'+'+m:m)+'</button>';
            }).join('')+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<button class="btn-solid-gold btn-roll-cup" data-action="roll-dice-btn">🎲 ¡Agitar Cubilete y Lanzar!</button>';
  document.getElementById("diceModalOverlay").classList.remove("hidden");
}

function diceModalClick(e){
  var btn = e.target.closest("[data-action]"); if(!btn) return;
  var action = btn.getAttribute("data-action");
  if(action==="close-modal"){ closeModals(); return; }
  if(action==="set-dice-mode"){ diceConfig.mode = btn.getAttribute("data-mode"); openDiceModal(); return; }
  if(action==="inc-dice-qty"){ diceConfig.qty = Math.min(20, (diceConfig.qty||1)+1); openDiceModal(); return; }
  if(action==="dec-dice-qty"){ diceConfig.qty = Math.max(1, (diceConfig.qty||1)-1); openDiceModal(); return; }
  if(action==="set-dice-qty"){ diceConfig.qty = parseInt(btn.getAttribute("data-qty"),10)||1; openDiceModal(); return; }
  if(action==="set-dice-mod"){ diceConfig.mod = parseInt(btn.getAttribute("data-mod"),10)||0; openDiceModal(); return; }
  if(action==="pick-die"){ diceConfig.sides = parseInt(btn.getAttribute("data-sides"),10); openDiceModal(); return; }
  if(action==="roll-dice-btn"){
    var modInput = document.getElementById("diceMod");
    if(modInput) diceConfig.mod = parseInt(modInput.value,10)||0;
    var qtyInput = document.getElementById("diceQty");
    if(qtyInput) diceConfig.qty = Math.max(1, parseInt(qtyInput.value,10)||1);
    document.getElementById("diceModalOverlay").classList.add("hidden");
    var cName = activeChar().name || "Aventurero";

    var doRoll = function(){
      if(diceConfig.sides===100){
        var dTens = (rollDie(10)-1)*10, dUnits = rollDie(10)-1;
        var pct = dTens + dUnits === 0 ? 100 : dTens + dUnits;
        var tot = pct + diceConfig.mod;
        var fText = "Decenas: " + dTens + " | Unidades: " + dUnits + (diceConfig.mod ? (diceConfig.mod>0?" + "+diceConfig.mod:" - "+Math.abs(diceConfig.mod)) : "");
        var rItem1 = {id:uid(), charName:cName, label:"d% Percentil", total:tot, formulaText:fText, isCrit:pct===100, isFumble:pct===1, ts:Date.now()};
        state.rollLog.unshift(rItem1);
        if(state.rollLog.length>20) state.rollLog.length=20;
        saveState();
        broadcastDiceRoll(rItem1);
        openRollModal("d% Percentil", tot, fText, 100, pct===100, pct===1, null, doRoll);
        renderTab();
        return;
      }

      if(diceConfig.mode==="adv" || diceConfig.mode==="disadv"){
        var r1 = rollDie(diceConfig.sides), r2 = rollDie(diceConfig.sides);
        var chosen = diceConfig.mode==="adv" ? Math.max(r1, r2) : Math.min(r1, r2);
        var totalAdv = chosen + diceConfig.mod;
        var advHtml = '<div class="adv-dice-wrap">'+
          '<div class="adv-die-card '+(r1===chosen?'chosen':'discarded')+'">'+r1+'</div>'+
          '<div class="adv-die-card '+(r2===chosen && (r1!==r2||diceConfig.mode==="adv")?'chosen':(r1===r2?'chosen':'discarded'))+'">'+r2+'</div>'+
        '</div>';
        var lblAdv = "d"+diceConfig.sides + (diceConfig.mode==="adv"?" (Ventaja)":" (Desventaja)");
        var modStr = (diceConfig.mod>=0?"+"+diceConfig.mod:diceConfig.mod);
        var rItem2 = {id:uid(), charName:cName, label:lblAdv, total:totalAdv, formulaText:"["+r1+", "+r2+"] -> " + chosen + " (Mod: " + modStr + ")", isCrit:chosen===diceConfig.sides, isFumble:chosen===1, ts:Date.now()};
        state.rollLog.unshift(rItem2);
        if(state.rollLog.length>20) state.rollLog.length=20;
        saveState();
        broadcastDiceRoll(rItem2);
        openRollModal(lblAdv, totalAdv, "Modificador: " + modStr, diceConfig.sides, chosen===diceConfig.sides, chosen===1, advHtml, doRoll);
        renderTab();
        return;
      }

      var rolls=[], sum=0;
      for(var i=0;i<diceConfig.qty;i++){ var r=rollDie(diceConfig.sides); rolls.push(r); sum+=r; }
      var grandTotal = sum + diceConfig.mod;
      var isAllCrit = rolls.every(function(x){return x===diceConfig.sides;});
      var isAllFumble = rolls.every(function(x){return x===1;});
      var fDetail = diceConfig.qty + "d" + diceConfig.sides + " [" + rolls.join(", ") + "]" + (diceConfig.mod ? (diceConfig.mod>0?" + "+diceConfig.mod:" - "+Math.abs(diceConfig.mod)) : "");
      var rItem3 = {id:uid(), charName:cName, label:diceConfig.qty+"d"+diceConfig.sides, total:grandTotal, formulaText:fDetail, isCrit:isAllCrit, isFumble:isAllFumble, ts:Date.now()};
      state.rollLog.unshift(rItem3);
      if(state.rollLog.length>20) state.rollLog.length=20;
      saveState();
      broadcastDiceRoll(rItem3);
      openRollModal(diceConfig.qty+"d"+diceConfig.sides, grandTotal, fDetail, diceConfig.sides, isAllCrit, isAllFumble, null, doRoll);
      renderTab();
    };

    doRoll();
    return;
  }
}

function modalClick(e){
  var btn = e.target.closest("[data-action]"); if(!btn) return;
  var action = btn.getAttribute("data-action");
  if(action==="close-modal"){ closeModals(); return; }
  if(action==="pick-char"){
    if(document.activeElement && document.activeElement.matches("input, textarea, select")){
      try { document.activeElement.blur(); } catch(e){}
    }
    flushPendingSync();
    state.activeId = btn.getAttribute("data-id");
    saveState();
    closeModals();
    renderTopbar();
    renderTab();
    return;
  }
  if(action==="add-char"){
    var nName = prompt("Nombre del nuevo personaje:");
    if(nName && nName.trim()){
      var nc = blankCharacter(nName.trim());
      if(currentUser && currentUser.id) nc.owner_id = currentUser.id;
      nc._isDirty = true;
      nc._lastLocalEdit = Date.now();
      state.characters.push(nc);
      state.activeId = nc.id;
      markCharDirty(nc.id);
      saveState(false);
      pushCharacterById(nc.id);
      closeModals();
      renderTopbar();
      renderTab();
      showToast("Personaje creado: " + nName.trim(), "success");
    }
    return;
  }
  if(action==="add-npc"){
    if(!isGM()) return;
    var nName = prompt("Nombre del NPC:");
    if(nName){
      var nn = blankCharacter(nName, true);
      nn.trabajo = "Neutral";
      state.characters.push(nn);
      state.activeId = nn.id;
      saveState(); closeModals(); renderTopbar(); renderTab();
      showToast("NPC creado: " + nName, "success");
    }
    return;
  }
  if(action==="del-char"){
    var targetId = btn.getAttribute("data-id");
    var targetChar = (state.characters||[]).find(function(x){return x.id===targetId;});
    var canDelete = isGM() || !currentUser || (targetChar && currentUser && targetChar.owner_id === currentUser.id);
    if(!canDelete){
      showToast("No tienes permiso para eliminar este personaje.", "warning");
      return;
    }
    var charName = targetChar ? targetChar.name : "este personaje";
    if(confirm("¿Eliminar definitivamente a \"" + charName + "\"?")){
      if(targetChar && targetChar.db_id && supabaseClient){
        supabaseClient.from('characters').delete().eq('id', targetChar.db_id).then(function(res){
          if(res.error) console.error("Error al borrar en Supabase:", res.error);
        }).catch(function(e){ console.error("Error al borrar en Supabase:", e); });
      }
      state.characters = (state.characters||[]).filter(function(x){return x.id!==targetId;});
      if(!state.characters.length) state.characters.push(blankCharacter("Sin Personaje"));
      if(state.activeId === targetId){
        state.activeId = state.characters[0]?state.characters[0].id:"";
      }
      saveState();
      openCharModal();
      renderTopbar();
      renderTab();
      showToast("Personaje eliminado", "info");
    }
    return;
  }
  if(action==="set-theme"){
    var targetId = btn.getAttribute("data-id");
    var targetTheme = btn.getAttribute("data-theme");
    var thC = state.characters.find(function(x){return x.id===targetId;});
    if(thC){
      thC.theme = targetTheme;
      saveState(true);
      if(supabaseClient && currentUser){
        pushCharacterById(thC.id);
      }
      if(state.activeId === thC.id){
        document.body.setAttribute("data-theme", targetTheme || "default");
        renderTopbar();
        renderTab();
      }
      openCharModal();
      var tObj = THEME_LIST.find(function(t){ return t.id === targetTheme; });
      showToast("Color de " + thC.name + ": " + (tObj ? tObj.label : targetTheme), "info");
    }
    return;
  }
  if(action==="auth-login"){ supabaseLogin(document.getElementById("authEmail").value.trim(), document.getElementById("authPass").value); return; }
  if(action==="auth-signup"){ supabaseSignup(document.getElementById("authEmail").value.trim(), document.getElementById("authPass").value); return; }
  if(action==="auth-logout"){ supabaseLogout(); return; }
  if(action==="export-data" || action==="download-full-backup"){ exportFullBackup(); return; }
  if(action==="cloud-backup-now"){ performCloudBackup(false); return; }
  if(action==="import-data"){ document.getElementById("importFileInput").click(); return; }
  if(action==="reset-all-characters"){
    if(confirm("¿Deseas resetear los atributos, habilidades, combate, magias y equipo de los 5 personajes oficiales (Cherk, Ink, Bucky, Scarleth, Derek) a los valores exactos de sus fichas oficiales en PDF? Se conservarán las fotos de perfil.")){
      resetCharactersToOfficial(true);
      saveState(true);
      if(supabaseClient && currentUser){
        state.characters.forEach(function(c){ pushCharacterById(c.id); });
      }
      renderTopbar();
      renderTab();
      closeModals();
      showToast("¡Personajes oficiales (incluyendo Derek y Scarleth) reseteados con éxito!", "success");
    }
    return;
  }
}

function closeModals(){
  ["charModalOverlay","diceModalOverlay","dataModalOverlay","pinModalOverlay","loreModalOverlay"].forEach(function(id){
    document.getElementById(id).classList.add("hidden");
  });
}

function exportFullBackup(){
  var dateStr = new Date().toISOString().slice(0, 10);
  var backupData = {
    krysalis_system: "Krysalis RPG",
    version: "v0.9.1",
    backup_type: "full_disaster_recovery",
    timestamp: new Date().toISOString(),
    support_contact: "rolillo55ac@gmail.com",
    state: state
  };
  var blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "krysalis_backup_completo_" + dateStr + ".json";
  a.click();
  showToast("Copia de seguridad completa descargada con éxito", "success");
}

function exportData(){
  exportFullBackup();
}

function importData(file){
  var r = new FileReader();
  r.onload = function(){
    try{
      var raw = JSON.parse(r.result);
      var importedData = (raw && raw.state) ? raw.state : raw;
      state = migrateState(importedData);
      if(!state.activeId || !state.characters.some(function(x){ return x.id === state.activeId; })){
        var validChars = getUserCharacters();
        state.activeId = validChars[0] ? validChars[0].id : (state.characters[0] ? state.characters[0].id : "");
      }
      saveState(true);
      if(isGM()){
        pushSharedData();
        pushMapsData();
        state.characters.forEach(function(c){ pushCharacterById(c.id); });
      }
      closeModals(); renderTopbar(); renderTabbar(); renderTab();
      showToast("Copia de seguridad restaurada correctamente", "success");
    }catch(e){
      console.error("Error importando backup:", e);
      showToast("Archivo de copia no válido.", "error");
    }
  };
  r.readAsText(file);
}

function checkWeeklyBackup(){
  try{
    var lastBackupStr = localStorage.getItem("krysalis_last_weekly_backup");
    var now = Date.now();
    var ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    if(!lastBackupStr || (now - new Date(lastBackupStr).getTime() > ONE_WEEK_MS)){
      if(isGM()){
        performCloudBackup(true);
      }
    }
  }catch(e){
    console.warn("Could not check weekly backup:", e);
  }
}

async function performCloudBackup(isAuto){
  if(!supabaseClient) return;
  try{
    var dateStr = new Date().toISOString().slice(0, 10);
    var backupKey = 'backup_weekly_' + dateStr;
    var res = await supabaseClient.from('campaign_map').upsert({
      id: backupKey,
      data: {
        timestamp: new Date().toISOString(),
        backupType: isAuto ? 'automatic_weekly' : 'manual_master',
        state: state
      },
      markers: [],
      updated_at: new Date().toISOString()
    });
    if(!res.error){
      localStorage.setItem("krysalis_last_weekly_backup", new Date().toISOString());
      if(!isAuto) showToast("Copia de seguridad guardada en la nube con éxito", "success");
    } else {
      if(!isAuto) showToast("Error al guardar copia en la nube", "error");
    }
  }catch(e){
    console.error("Cloud backup error:", e);
    if(!isAuto) showToast("Error al procesar copia en la nube", "error");
  }
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

function initSupabase(){
  if(!window.supabase) return;
  try{
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    
    if(!realtimeChannel){
      realtimeChannel = supabaseClient.channel('realtime_all_changes', {
        config: { broadcast: { self: false } }
      })
        .on('broadcast', { event: 'dice_roll' }, function(payload){
          if(payload && payload.payload) handleRemoteDiceRoll(payload.payload);
        })
        .on('broadcast', { event: 'char_stat_update' }, function(payload){
          if(payload && payload.payload) handleRemoteCharStatUpdate(payload.payload);
        })
        .on('postgres_changes', {event:'*', schema:'public', table:'campaign_map'}, function(payload){
          if(payload && payload.new){
            var row = payload.new;
            if(row.id === 'main_map'){
              var remoteMaps = row.data || row.markers;
              if(Array.isArray(remoteMaps) && remoteMaps.length){
                state.maps = remoteMaps;
                if(!state.activeMapId && state.maps.length) state.activeMapId = state.maps[0].id;
                saveState(true);
                if(state.activeTab==="mundo") renderTab();
              }
            } else if(row.id === 'world_compendium'){
              var comp = row.data;
              if(comp){
                if(comp.weaponsCatalog) state.weaponsCatalog = comp.weaponsCatalog;
                if(comp.bestiary) state.bestiary = comp.bestiary;
                if(comp.lore) state.lore = comp.lore;
                if(comp.buffCatalog) state.buffCatalog = comp.buffCatalog;
                if(comp.quests) state.quests = comp.quests;
                if(comp.questClues) state.questClues = comp.questClues;
                if(comp.questMap) state.questMap = comp.questMap;
                if(comp.sessionSummary !== undefined) state.sessionSummary = comp.sessionSummary;
                saveState(true);
                if(["mundo","bestiario","mision"].indexOf(state.activeTab)!==-1){
                  if(!document.activeElement || !document.activeElement.matches("input, textarea")) renderTab();
                }
              }
            }
          }
        })
        .on('postgres_changes', {event:'*', schema:'public', table:'characters'}, function(payload){
          handleRemoteCharacterChange(payload);
        })
        .subscribe();
    }

    pullMapFromSupabase();
    pullSharedDataFromSupabase();
    pullAllFromSupabase();

    supabaseClient.auth.getSession().then(function(res){
      if(res.data && res.data.session){ currentUser = res.data.session.user; fetchUserProfile(); }
      else { updateSyncBadge("synced"); }
    }).catch(function(e){ console.error('Supabase error:', e); });

    supabaseClient.auth.onAuthStateChange(function(e, session){
      currentUser = session ? session.user : null;
      if(currentUser){ fetchUserProfile(); } else { currentRole='player'; updateSyncBadge("synced"); renderTopbar(); renderTab(); }
    });
  }catch(e){ console.error('Supabase error:', e); }
}

function broadcastCharStatUpdate(charId, combatObj){
  if(supabaseClient && realtimeChannel){
    try{
      realtimeChannel.send({
        type: 'broadcast',
        event: 'char_stat_update',
        payload: { charId: charId, combat: combatObj, ts: Date.now() }
      });
    }catch(e){ console.warn("Could not broadcast char stat update:", e); }
  }
}

function handleRemoteCharStatUpdate(data){
  if(!data || !data.charId) return;
  var target = (state.characters||[]).find(function(x){ return x.id === data.charId; });
  if(target){
    if(target._isDirty || dirtyCharIds.has(target.id) || (target._lastLocalEdit && Date.now() - target._lastLocalEdit < 3500)) return;
    if(data.combat) target.combat = Object.assign(target.combat||{}, data.combat);
    saveState(true);
    if(state.activeId === data.charId){
      renderTopbar();
      if((state.activeTab==="combate" || state.activeTab==="magia") && (!document.activeElement || !document.activeElement.matches("input, textarea"))){
        renderTab();
      }
    }
  }
}

function handleRemoteCharacterChange(payload){
  if(!payload || !payload.eventType) return;
  if(payload.eventType === 'DELETE'){
    var delId = payload.old ? payload.old.id : null;
    if(delId){
      state.characters = (state.characters||[]).filter(function(x){ return x.db_id !== delId && x.id !== delId; });
      if(!state.characters.length) state.characters.push(blankCharacter("Sin Personaje"));
      if(!state.characters.some(function(x){return x.id===state.activeId;})){
        var validChars = getUserCharacters();
        state.activeId = validChars[0] ? validChars[0].id : state.characters[0].id;
      }
      saveState(true); renderTopbar(); renderTabbar();
      if(!document.activeElement || !document.activeElement.matches("input, textarea")) renderTab();
    }
  } else {
    var row = payload.new;
    if(row && row.data){
      var c = row.data;
      c.db_id = row.id;
      if(row.owner_id) c.owner_id = row.owner_id;
      var idx = state.characters.findIndex(function(x){ return x.db_id === row.id || x.id === c.id || (x.name && c.name && x.name.trim().toLowerCase() === c.name.trim().toLowerCase()); });
      if(idx !== -1){
        var localChar = state.characters[idx];
        if(localChar._isDirty || dirtyCharIds.has(localChar.id) || (localChar._lastLocalEdit && Date.now() - localChar._lastLocalEdit < 3500)){
          return;
        }
        if(localChar.id === state.activeId && document.activeElement && document.activeElement.getAttribute("data-bind") === "personalNotes"){
          c.personalNotes = localChar.personalNotes;
        }
        state.characters[idx] = c;
      } else {
        state.characters.push(c);
      }
      if(!state.activeId) state.activeId = c.id;
      saveState(true); renderTopbar(); renderTabbar();
      if(!document.activeElement || !document.activeElement.matches("input, textarea")){
        renderTab();
      }
    }
  }
}

function handleRemoteSharedDataChange(payload){
  if(!payload || !payload.new || !payload.new.data) return;
  var sharedData = payload.new.data;
  if(sharedData.weaponsCatalog) state.weaponsCatalog = sharedData.weaponsCatalog;
  if(sharedData.bestiary) state.bestiary = sharedData.bestiary;
  if(sharedData.lore) state.lore = sharedData.lore;
  if(sharedData.buffCatalog) state.buffCatalog = sharedData.buffCatalog;
  if(sharedData.quests) state.quests = sharedData.quests;
  if(sharedData.questClues) state.questClues = sharedData.questClues;
  if(sharedData.questMap) state.questMap = sharedData.questMap;
  if(sharedData.sessionSummary !== undefined) state.sessionSummary = sharedData.sessionSummary;
  saveState(true);
  if(["mundo","bestiario","mision"].indexOf(state.activeTab)!==-1){
    if(!document.activeElement || !document.activeElement.matches("input, textarea")){
      renderTab();
    }
  }
}

async function fetchUserProfile(){
  if(!supabaseClient || !currentUser) return;
  try{
    var res = await supabaseClient.from('profiles').select('role').eq('id', currentUser.id).maybeSingle();
    if(res.data && res.data.role) currentRole = res.data.role;
    pullAllFromSupabase();
    pullMapFromSupabase();
    pullSharedDataFromSupabase();
  }catch(e){ console.error('Supabase error:', e); }
  renderTopbar();
  renderTabbar();
  renderTab();
}

async function supabaseLogin(em, pw){
  var att = getAuthAttempts();
  var now = Date.now();
  if(att.lockoutUntil && att.lockoutUntil > now){
    var remainingMins = Math.ceil((att.lockoutUntil - now) / 60000);
    showToast("Demasiados intentos seguidos. Espera " + remainingMins + " min para volver a probar.", "warning");
    return;
  }
  var res = await supabaseClient.auth.signInWithPassword({email:em, password:pw});
  if(res.error){
    var updated = recordFailedLoginAttempt();
    var remainingAttempts = MAX_LOGIN_ATTEMPTS - (updated.count || 0);
    if(remainingAttempts <= 0){
      showToast("Has fallado 5 veces seguidas. Espera 15 minutos para volver a probar.", "error");
    } else {
      var msg = res.error.message.includes("Invalid login") ? "Contraseña o email incorrectos" : res.error.message;
      showToast(msg + " (te quedan " + remainingAttempts + " intentos)", "error");
    }
  } else {
    clearAuthAttempts();
    closeModals();
    showToast("¡Sesión iniciada!", "success");
  }
}
async function supabaseSignup(em, pw){
  var res = await supabaseClient.auth.signUp({email:em, password:pw});
  if(res.error) showToast(res.error.message, "error"); else showToast("Registro completado. Ya puedes entrar.", "success");
}
async function supabaseLogout(){
  try {
    await supabaseClient.auth.signOut();
  } catch(e) {
    console.error('Supabase error:', e);
  }
  currentUser=null; currentRole='player'; closeModals(); updateSyncBadge("local"); renderTopbar(); renderTabbar(); renderTab();
  showToast("Sesión cerrada", "info");
}
async function pullAllFromSupabase(){
  if(!supabaseClient) return;
  isRemoteSyncing = true;
  try{
    var charRes = await supabaseClient.from('characters').select('*');
    if(charRes.data && charRes.data.length){
      var pulledChars = charRes.data.map(function(r){ 
        var c = r.data || {}; 
        c.db_id = r.id;
        if(r.owner_id) c.owner_id = r.owner_id;
        c._serverUpdatedAt = r.updated_at ? new Date(r.updated_at).getTime() : 0;
        return c; 
      });

      pulledChars = pulledChars.filter(function(c){
        var n = (c.name || "").trim().toLowerCase();
        return n && n !== "sin personaje" && n !== "nuevo personaje" && n !== "kaelen mago";
      });

      // Ensure all official characters exist in the database (never overwrite existing player modifications)
      var officials = getOfficialCharacters();
      officials.forEach(function(off){
        var exists = pulledChars.some(function(c){
          var cName = (c.name || "").trim().toLowerCase();
          var oName = off.name.trim().toLowerCase();
          if(oName === "derek") return cName === "derek";
          if(oName === "scarleth") return cName === "scarleth" || cName.includes("scarleth") || cName.includes("winter");
          if(oName === "bucky") return cName === "bucky" || cName === "baky" || cName.includes("bucky") || cName.includes("baky");
          if(oName === "cherk") return cName === "cherk" || cName.includes("cherk");
          if(oName === "ink") return cName === "ink" || cName.includes("ink");
          return cName === oName;
        });
        if(!exists){
          var nOff = JSON.parse(JSON.stringify(off));
          nOff.officialDataVersion = 4;
          pulledChars.push(nOff);
          if(isGM()){
            pushCharacterById(nOff.id);
          }
        }
      });

      // Match owner_id with user if email matches
      if(currentUser && currentUser.email){
        var userEmail = currentUser.email.trim().toLowerCase();
        pulledChars.forEach(function(c){
          if(c.ownerEmail && c.ownerEmail.trim().toLowerCase() === userEmail){
            c.owner_id = currentUser.id;
          }
        });
      }

      // Merge: never overwrite newer local modifications
      var mergedChars = pulledChars.map(function(remoteC){
        var localC = (state.characters || []).find(function(lc){ 
          return lc.id === remoteC.id || (lc.db_id && lc.db_id === remoteC.db_id) || (lc.name && remoteC.name && lc.name.trim().toLowerCase() === remoteC.name.trim().toLowerCase()); 
        });
        if(localC){
          if(!localC.db_id && remoteC.db_id) localC.db_id = remoteC.db_id;
          if(!remoteC.db_id && localC.db_id) remoteC.db_id = localC.db_id;

          if(localC._isDirty || (localC._lastLocalEdit && (!remoteC._serverUpdatedAt || localC._lastLocalEdit >= remoteC._serverUpdatedAt))){
            localC._isDirty = true;
            markCharDirty(localC.id);
            return localC;
          }
        }
        return remoteC;
      });

      (state.characters || []).forEach(function(localC){
        if(!mergedChars.some(function(mc){ 
          return mc.id === localC.id || (mc.db_id && mc.db_id === localC.db_id) || (mc.name && localC.name && mc.name.trim().toLowerCase() === localC.name.trim().toLowerCase()); 
        })){
          mergedChars.push(localC);
          markCharDirty(localC.id);
        }
      });

      state.characters = mergedChars;

      var savedActiveId = localStorage.getItem("krysalis_active_id");
      if(savedActiveId && state.characters.some(function(x){ return x.id === savedActiveId; })){
        state.activeId = savedActiveId;
      } else if(!state.activeId || !state.characters.some(function(x){ return x.id === state.activeId; })){
        var validChars = getUserCharacters();
        state.activeId = validChars[0] ? validChars[0].id : (state.characters[0] ? state.characters[0].id : "");
      }
      updateSyncBadge("synced");
    } else if(charRes.data && charRes.data.length === 0){
      var seedOfficials = getOfficialCharacters();
      state.characters = seedOfficials;
      if(isGM()){
        state.characters.forEach(function(c){ pushCharacterById(c.id); });
      }
      updateSyncBadge("synced");
    }
    saveState(true); renderTopbar(); renderTabbar();
    if(!document.activeElement || !document.activeElement.matches("input, textarea")) renderTab();
  }catch(e){ console.error('Supabase error:', e); }
  isRemoteSyncing = false;
  if(dirtyCharIds.size > 0 || (state.characters||[]).some(function(c){ return c._isDirty; })){
    flushPendingSync();
  }
}

function sendKeepalivePush(c){
  if(!c || !c.name || c.id==="empty") return;
  try{
    var n = (c.name||"").trim().toLowerCase();
    var dbId = c.db_id;
    if(!dbId){
      if(n === "derek") dbId = "d9dee50e-051d-4058-b4a5-d46c809fbb25";
      else if(n.includes("scarleth") || n.includes("winter")) dbId = "5e9c545e-176a-4e99-a3e7-299f89fa0779";
      else if(n.includes("bucky") || n.includes("baky")) dbId = "4d8dd9b1-b5aa-430e-ae19-79c35b6c3c5e";
      else if(n.includes("cherk")) dbId = "a8039428-8ee7-4e31-baba-c6a1d8b6d8f3";
      else if(n.includes("ink")) dbId = "ece1cdb6-f8c6-4010-b3e8-045887dc92a3";
    }
    var payload = { name: c.name, data: c, updated_at: new Date().toISOString() };
    if(dbId) payload.id = dbId;
    if(c.owner_id) payload.owner_id = c.owner_id;
    
    var url = SUPABASE_URL + "/rest/v1/characters";
    fetch(url, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_ANON,
        "Authorization": "Bearer " + SUPABASE_ANON,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(function(){});
  }catch(e){}
}

function pushCharacterById(charId){
  if(!supabaseClient) return;
  var c = (state.characters||[]).find(function(x){ return x.id === charId; });
  if(!c || !c.name || c.id==="empty") return;

  if(!c.db_id){
    var n = (c.name||"").trim().toLowerCase();
    if(n === "derek") c.db_id = "d9dee50e-051d-4058-b4a5-d46c809fbb25";
    else if(n.includes("scarleth") || n.includes("winter")) c.db_id = "5e9c545e-176a-4e99-a3e7-299f89fa0779";
    else if(n.includes("bucky") || n.includes("baky")) c.db_id = "4d8dd9b1-b5aa-430e-ae19-79c35b6c3c5e";
    else if(n.includes("cherk")) c.db_id = "a8039428-8ee7-4e31-baba-c6a1d8b6d8f3";
    else if(n.includes("ink")) c.db_id = "ece1cdb6-f8c6-4010-b3e8-045887dc92a3";
  }

  if(!c.owner_id && currentUser && !c.isNPC){
    c.owner_id = currentUser.id;
    if(currentUser.email) c.ownerEmail = currentUser.email;
  } else if(currentUser && isCharOwner(c, currentUser)){
    c.owner_id = currentUser.id;
  }

  var payload = {name:c.name, data:c, updated_at:new Date().toISOString()};
  if(c.owner_id) payload.owner_id = c.owner_id;
  if(c.db_id) payload.id = c.db_id;
  supabaseClient.from('characters').upsert(payload).select().then(function(res){
    if(res.error) { console.error('Supabase error:', res.error); return; }
    if(res.data && res.data[0]){
      c.db_id = res.data[0].id;
      c._serverUpdatedAt = res.data[0].updated_at ? new Date(res.data[0].updated_at).getTime() : Date.now();
    }
    c._isDirty = false;
    dirtyCharIds.delete(c.id);
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }catch(e){}
    updateSyncBadge("synced");
  }).catch(function(e){ console.error('Supabase error:', e); });
}

function pushActiveChar(){
  var c = activeChar();
  if(c && c.id) pushCharacterById(c.id);
}
async function pullMapFromSupabase(){
  if(!supabaseClient) return;
  try{
    var res = await supabaseClient.from('campaign_map').select('*').eq('id', 'main_map').maybeSingle();
    if(res.error) { console.error('Supabase error:', res.error); return; }
    if(res.data && (res.data.data || res.data.markers)){
      var remoteMaps = res.data.data || res.data.markers;
      if(Array.isArray(remoteMaps) && remoteMaps.length){
        state.maps = remoteMaps;
        if(!state.activeMapId && state.maps.length) state.activeMapId = state.maps[0].id;
        saveState(true);
        if(state.activeTab==="mundo") renderTab();
      }
    }
  }catch(e){ console.error('Supabase error:', e); }
}
function pushMapsData(){
  if(!supabaseClient) return;
  if(currentUser && !isGM()) return;
  supabaseClient.from('campaign_map').upsert({
    id: 'main_map',
    data: state.maps || [],
    markers: state.maps || [],
    updated_at: new Date().toISOString()
  }).select().then(function(res){
    if(res.error) { console.error('Supabase error:', res.error); return; }
    updateSyncBadge("synced");
  }).catch(function(e){ console.error('Supabase error:', e); });
}

async function pullSharedDataFromSupabase(){
  if(!supabaseClient) return;
  try{
    var res = await supabaseClient.from('campaign_map').select('*').eq('id', 'world_compendium').maybeSingle();
    if(res.error) { console.error('Supabase error:', res.error); return; }
    if(res.data && res.data.data){
      var comp = res.data.data;
      if(comp.weaponsCatalog) state.weaponsCatalog = comp.weaponsCatalog;
      if(comp.bestiary) state.bestiary = comp.bestiary;
      if(comp.lore) state.lore = comp.lore;
      if(comp.buffCatalog) state.buffCatalog = comp.buffCatalog;
      if(comp.quests) state.quests = comp.quests;
      if(comp.questClues) state.questClues = comp.questClues;
      if(comp.questMap) state.questMap = comp.questMap;
      if(comp.sessionSummary !== undefined) state.sessionSummary = comp.sessionSummary;
      saveState(true);
      if(["mundo","bestiario","mision"].indexOf(state.activeTab)!==-1){
        if(!document.activeElement || !document.activeElement.matches("input, textarea")) renderTab();
      }
    }
  }catch(e){ console.error('Supabase error:', e); }
}

function pushSharedData(){
  if(!supabaseClient) return;
  if(currentUser && !isGM()) return;
  supabaseClient.from('campaign_map').upsert({
    id: 'world_compendium',
    data: {
      weaponsCatalog: state.weaponsCatalog || [],
      bestiary: state.bestiary || [],
      lore: state.lore || getSeedLore(),
      buffCatalog: state.buffCatalog || getSeedBuffCatalog(),
      quests: state.quests || [],
      questClues: state.questClues || [],
      questMap: state.questMap || { name: "Mapa de la Misión", image: null, notes: "" },
      sessionSummary: state.sessionSummary || ""
    },
    markers: [],
    updated_at: new Date().toISOString()
  }).select().then(function(res){
    if(res.error) { console.error('Supabase error:', res.error); return; }
    updateSyncBadge("synced");
  }).catch(function(e){ console.error('Supabase error:', e); });
}

var touchStartX = null;
var touchStartY = null;
var swipeIndicatorTimeout = null;

function handleTouchStart(e){
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}

function handleTouchEnd(e){
  if(touchStartX === null || touchStartY === null) return;
  
  var touchEndX = e.changedTouches[0].clientX;
  var touchEndY = e.changedTouches[0].clientY;
  var dx = touchEndX - touchStartX;
  var dy = touchEndY - touchStartY;
  
  var tabs = isGM() ? GM_TABS : PLAYER_TABS;
  
  if(Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 80){
    var currentTabIndex = tabs.findIndex(function(t){ return t.id === state.activeTab; });
    var newIndex = currentTabIndex;
    
    if(dx < 0 && currentTabIndex < tabs.length - 1){
      newIndex = currentTabIndex + 1;
    } else if(dx > 0 && currentTabIndex > 0){
      newIndex = currentTabIndex - 1;
    }
    
    if(newIndex !== currentTabIndex){
      state.activeTab = tabs[newIndex].id;
      saveState();
      renderTabbar();
      renderTab();
      
      showToast(tabs[newIndex].label, "info");
    }
  }
  
  touchStartX = null;
  touchStartY = null;
}

function showSwipeIndicator(){
  var indicator = document.getElementById("swipeIndicator");
  indicator.classList.add("visible");
  clearTimeout(swipeIndicatorTimeout);
  swipeIndicatorTimeout = setTimeout(function(){
    indicator.classList.remove("visible");
  }, 2000);
}

function creatureFieldGlobal(label,bind,val){
  return '<div class="creature-field"><label>'+esc(label)+'</label><input type="text" data-scope="global" data-bind="'+bind+'" value="'+esc(val)+'"></div>';
}

function rollLogHtml(){
  var logs = state.rollLog.slice(0,5);
  var html = '<div class="section"><div class="section-title"><span>Historial de Tiradas</span></div>';
  if(!logs.length){ html += '<div class="roll-empty">Sin tiradas recientes.</div>'; }
  else {
    html += '<div class="roll-log">'+logs.map(function(r){
      return '<div class="roll-log-item"><span>'+esc(r.charName)+' — '+esc(r.label)+'<br><span class="rl-formula">'+esc(r.formulaText)+'</span></span><span class="rl-result">'+r.total+'</span></div>';
    }).join('')+'</div>';
  }
  html += '</div>';
  return html;
}

function setBind(target, path, rawValue, inputType){
  var parts = path.split(".");
  var value = inputType==="number" ? num(rawValue,0) : rawValue;
  if(parts.length===1){ target[parts[0]] = value; return; }
  if(parts[0]==="attrs"){ target.attrs[parts[1]] = value; return; }
  if(parts[0]==="combat"){ target.combat[parts[1]] = value; return; }
  if(parts[0]==="money"){ target.money[parts[1]] = value; return; }
  if(parts[0]==="skillBonus"){ target.skillBonus[parts[1]] = value; return; }
  if(parts[0]==="skillHybrid"){ target.skillHybrid[parts[1]] = value; return; }
  if(parts[0]==="customSkills"){
    var cs = target.customSkills.find(function(x){return x.id===parts[1];});
    if(cs) cs[parts[2]] = value;
    return;
  }
  if(parts[0]==="weaponsCatalog"){
    var wItem = (target.weaponsCatalog||[]).find(function(x){return x.id===parts[1];});
    if(wItem) wItem[parts[2]] = value;
    return;
  }
  if(parts[0]==="buffCatalog"){
    var bItem = (target.buffCatalog||[]).find(function(x){return x.id===parts[1];});
    if(bItem) bItem[parts[2]] = value;
    return;
  }
  if(parts[0]==="questMap"){
    if(!target.questMap) target.questMap = { name: "Mapa de la Misión", image: null, notes: "" };
    target.questMap[parts[1]] = value;
    return;
  }
  var listFields = ["weapons","armors","inventory","spells","stones","passivesNeg","passivesPos","goddessCurses","goddessBlessings","goddessTable","customBuffs","summons","bestiary","poisons","activeBuffs","quests","questClues"];
  if(listFields.indexOf(parts[0])!==-1){
    var arr = target[parts[0]];
    var item = arr && arr.find(function(x){return x.id===parts[1];});
    if(item) item[parts[2]] = value;
    return;
  }
  if(parts[0]==="lore"){
    var loreArr = target.lore[parts[1]];
    var lItem = loreArr && loreArr.find(function(x){return x.id===parts[2];});
    if(lItem) lItem[parts[3]] = value;
    return;
  }
  target[path] = value;
}

function handleChange(e){
  var el = e.target.closest("[data-bind]"); if(!el) return;
  var isGlobal = el.getAttribute("data-scope")==="global";
  if(isGlobal && currentUser && !isGM()){
    showToast("Solo el Máster puede editar datos del compendio o del mundo.", "warning");
    return;
  }
  var target = isGlobal ? state : activeChar();
  if(!isGlobal && !canEditChar(target)){
    showToast("Esa ficha es de otro jugador.", "warning");
    return;
  }
  var bind = el.getAttribute("data-bind");
  setBind(target, bind, el.value, el.type);
  if(!isGlobal && target && target.id){
    target._lastLocalEdit = Date.now();
    markCharDirty(target.id);
    if(currentUser && !target.owner_id && !target.isNPC){
      target.owner_id = currentUser.id;
      if(currentUser.email) target.ownerEmail = currentUser.email;
    }
  }
  if(bind && bind.startsWith("combat.") && target && target.id){
    broadcastCharStatUpdate(target.id, target.combat);
    renderTopbar();
  }
  if(isGlobal){
    isGlobalDirty = true;
    saveState(true);
    pushSharedData();
  } else {
    saveState(false);
  }
}

function handleClick(e){
  getAudioCtx();
  var btn = e.target.closest("[data-action]"); if(!btn) return;
  var action = btn.getAttribute("data-action");
  var c = activeChar();

  if(action==="set-world-subtab"){ currentWorldSubtab = btn.getAttribute("data-val"); renderTab(); return; }
  if(action==="set-bestiary-continent"){ bestiaryContinentFilter = btn.getAttribute("data-continent"); renderTab(); return; }
  if(action==="set-lore-continent"){ loreContinentFilter = btn.getAttribute("data-val"); renderTab(); return; }
  if(action==="set-lore-type"){ loreTypeFilter = btn.getAttribute("data-val"); renderTab(); return; }
  if(action==="set-lore-terrain"){ loreTerrainFilter = btn.getAttribute("data-val"); renderTab(); return; }
  if(action==="set-lore-subtab"){ currentLoreSubtab = btn.getAttribute("data-val"); renderTab(); return; }
  if(action==="set-buff-tab"){ currentBuffTab = btn.getAttribute("data-val"); renderTab(); return; }

  if(action==="switch-tab"){
    if(document.activeElement && document.activeElement.matches("input, textarea, select")){
      try { document.activeElement.blur(); } catch(e){}
    }
    flushPendingSync();
    state.activeTab = btn.getAttribute("data-tab");
    saveState(true);
    renderTabbar();
    renderTab();
    return;
  }
  if(action==="hp-mod"){
    var d1 = parseInt(btn.getAttribute("data-delta"),10);
    var maxHp = num(c.combat.pvMax,0) || 999;
    c.combat.pvActual = clamp(num(c.combat.pvActual,0)+d1, -999, maxHp);
    c._lastLocalEdit = Date.now();
    markCharDirty(c.id);
    saveState(); renderTopbar();
    broadcastCharStatUpdate(c.id, c.combat);
    return;
  }
  if(action==="shield-mod"){
    var ds = parseInt(btn.getAttribute("data-delta"),10);
    c.combat.escudoActual = Math.max(0, num(c.combat.escudoActual,0)+ds);
    c._lastLocalEdit = Date.now();
    markCharDirty(c.id);
    saveState(); renderTopbar();
    broadcastCharStatUpdate(c.id, c.combat);
    return;
  }
  if(action==="mana-mod"){
    var d2 = parseInt(btn.getAttribute("data-delta"),10);
    c.combat.manaActual = clamp(num(c.combat.manaActual,0)+d2, 0, num(c.combat.manaMax,0)||999);
    c._lastLocalEdit = Date.now();
    markCharDirty(c.id);
    saveState(); renderTopbar();
    broadcastCharStatUpdate(c.id, c.combat);
    return;
  }

  if(action==="gm-add-skill-point"){
    if(!isGM()) return;
    c.skillPoints = num(c.skillPoints, 0) + 1;
    saveState(); renderTab();
    showToast("+1 punto de habilidad concedido por el GM", "gm");
    return;
  }
  if(action==="gm-skill-add"){
    if(!isGM()) return;
    var sid = btn.getAttribute("data-id");
    if(!c.skillBonus) c.skillBonus = {};
    c.skillBonus[sid] = num(c.skillBonus[sid], 0) + 1;
    saveState(); renderTab();
    var sdef = SKILL_DEFS.find(function(x){ return x.id === sid; });
    showToast("GM otorgó nivel " + c.skillBonus[sid] + " a " + (sdef ? sdef.name : sid), "gm");
    return;
  }
  if(action==="gm-skill-sub"){
    if(!isGM()) return;
    var sid2 = btn.getAttribute("data-id");
    if(!c.skillBonus) c.skillBonus = {};
    if(num(c.skillBonus[sid2], 0) > 0){
      c.skillBonus[sid2] = num(c.skillBonus[sid2], 0) - 1;
      saveState(); renderTab();
    }
    return;
  }
  if(action==="gm-custom-skill-add"){
    if(!isGM()) return;
    var csId = btn.getAttribute("data-id");
    var csk = (c.customSkills||[]).find(function(x){return x.id===csId;});
    if(csk){
      csk.bonus = num(csk.bonus, 0) + 1;
      saveState(); renderTab();
      showToast("GM otorgó nivel " + csk.bonus + " a " + csk.name, "gm");
    }
    return;
  }
  if(action==="gm-custom-skill-sub"){
    if(!isGM()) return;
    var csId2 = btn.getAttribute("data-id");
    var csk2 = (c.customSkills||[]).find(function(x){return x.id===csId2;});
    if(csk2 && num(csk2.bonus, 0) > 0){
      csk2.bonus = num(csk2.bonus, 0) - 1;
      saveState(); renderTab();
    }
    return;
  }

  if(action==="grant-level"){
    if(!isGM()) return;
    var curNv = num(c.nivel, 1);
    var nextNv = curNv + 1;
    c.nivel = String(nextNv);
    
    var ptsToAdd = 4;
    if(nextNv > 20) ptsToAdd = 8;
    else if(nextNv > 10) ptsToAdd = 6;
    c.skillPoints = num(c.skillPoints, 0) + ptsToAdd;

    var fisicoVal = num(c.attrs.fisico, 0);
    var hpGain = Math.ceil(fisicoVal / 2);
    if(hpGain < 1) hpGain = 1;
    c.combat.pvMax = num(c.combat.pvMax, 10) + hpGain;
    c.combat.pvActual = num(c.combat.pvMax, 10);

    if(nextNv % 4 === 0){
      c.combat.manaMax = num(c.combat.manaMax, 10) + 5;
    }
    
    if(c.isNPC){
      c.skillPointsUnlocked = true;
    }

    saveState(); renderTopbar(); renderTab();
    showToast("¡Nivel " + nextNv + " alcanzado! +" + ptsToAdd + " puntos de habilidad", "success");
    return;
  }

  if(action==="toggle-skill-lock"){
    if(!isGM()) return;
    c.skillPointsUnlocked = !c.skillPointsUnlocked;
    saveState(); renderTab();
    showToast(c.skillPointsUnlocked ? "Asignación de habilidades desbloqueada" : "Asignación de habilidades bloqueada", "info");
    return;
  }
    if(action==="skill-add"){
    if(!c.skillPointsUnlocked && !c.isNPC) return;
    var sId = btn.getAttribute("data-id");
    var curBonus = num(c.skillBonus[sId], 0);
    if(curBonus === 0 && !c.isNPC) { showToast("No se puede subir una habilidad en nivel 0.", "error"); return; }
    if(curBonus >= 8) { showToast("La habilidad ha alcanzado el nivel máximo (8).", "warning"); return; }
    if(!c.isNPC && num(c.skillPoints, 0) < 1) { showToast("No tienes puntos disponibles.", "error"); return; }
    if(c.isNPC && num(c.skillPoints, 0) < 1) { showToast("El NPC no tiene puntos. Sube su nivel primero.", "error"); return; }

    if(!c.skillProgress) c.skillProgress = {};
    var prog = num(c.skillProgress[sId], 0);
    var targetLevel = curBonus + 1;
    var costNeeded = targetLevel;

    c.skillPoints--;
    prog++;

    if(prog >= costNeeded){
      prog = 0;
      c.skillBonus[sId] = targetLevel;
      showToast("¡Habilidad subida a nivel " + targetLevel + "!", "success");
    }
    c.skillProgress[sId] = prog;
    saveState(); renderTab(); return;
  }
  if(action==="skill-sub"){
    if(!c.skillPointsUnlocked && !c.isNPC) return;
    var sId2 = btn.getAttribute("data-id");
    if(!c.skillProgress) c.skillProgress = {};
    var prog2 = num(c.skillProgress[sId2], 0);

    if(prog2 > 0){
      prog2--;
      c.skillProgress[sId2] = prog2;
      c.skillPoints++;
      saveState(); renderTab();
    } else {
      if(c.isNPC){
        var curBonus2 = num(c.skillBonus[sId2], 0);
        if(curBonus2 > 0){
          c.skillBonus[sId2] = curBonus2 - 1;
          c.skillProgress[sId2] = 0;
          c.skillPoints++;
          saveState(); renderTab();
        } else {
          showToast("La habilidad ya está en nivel 0.", "warning");
        }
      } else {
        showToast("No se puede restar un nivel ya consolidado.", "warning");
      }
    }
    return;
  }
  if(action==="skill-add-custom"){
    if(!c.skillPointsUnlocked && !c.isNPC) return;
    var csId = btn.getAttribute("data-id");
    var csk = (c.customSkills||[]).find(function(x){return x.id===csId;});
    if(csk){
      var curBonus = num(csk.bonus, 0);
      if(curBonus === 0 && !c.isNPC) { showToast("No se puede subir una habilidad en nivel 0.", "error"); return; }
      if(curBonus >= 8) { showToast("Máximo nivel 8.", "warning"); return; }
      if(!c.isNPC && num(c.skillPoints, 0) < 1) { showToast("Puntos insuficientes.", "error"); return; }
      if(c.isNPC && num(c.skillPoints, 0) < 1) { showToast("El NPC no tiene puntos. Sube su nivel primero.", "error"); return; }

      if(!c.skillProgress) c.skillProgress = {};
      var prog = num(c.skillProgress[csId], 0);
      var targetLevel = curBonus + 1;
      var costNeeded = targetLevel;

      c.skillPoints--;
      prog++;
      if(prog >= costNeeded){
        prog = 0;
        csk.bonus = targetLevel;
        showToast("¡Habilidad subida a nivel " + targetLevel + "!", "success");
      }
      c.skillProgress[csId] = prog;
      saveState(); renderTab();
    }
    return;
  }
  if(action==="skill-sub-custom"){
    if(!c.skillPointsUnlocked && !c.isNPC) return;
    var csId2 = btn.getAttribute("data-id");
    var csk2 = (c.customSkills||[]).find(function(x){return x.id===csId2;});
    if(csk2){
      if(!c.skillProgress) c.skillProgress = {};
      var prog2 = num(c.skillProgress[csId2], 0);
      if(prog2 > 0){
        prog2--;
        c.skillProgress[csId2] = prog2;
        c.skillPoints++;
        saveState(); renderTab();
      } else {
        if(c.isNPC){
          var curBonus2 = num(csk2.bonus, 0);
          if(curBonus2 > 0){
            csk2.bonus = curBonus2 - 1;
            c.skillProgress[csId2] = 0;
            c.skillPoints++;
            saveState(); renderTab();
          } else {
            showToast("La habilidad ya está en nivel 0.", "warning");
          }
        } else {
          showToast("No se puede restar un nivel ya consolidado.", "warning");
        }
      }
    }
    return;
  }
  if(action==="confirm-skills"){
    c.skillPoints = 0;
    saveState(); renderTab();
    showToast("Puntos de habilidad confirmados", "success");
    return;
  }

  if(action==="toggle-global-buff"){
    var bid = btn.getAttribute("data-id");
    if(!c.activeBuffs) c.activeBuffs = [];
    var idx = c.activeBuffs.findIndex(function(ab){ return ab.id === bid; });
    if(idx !== -1){
      var remBuff = c.activeBuffs[idx];
      if(remBuff && remBuff.shieldGranted){
        c.combat.escudoActual = Math.max(0, num(c.combat.escudoActual, 0) - remBuff.shieldGranted);
      }
      c.activeBuffs.splice(idx, 1);
    } else {
      var buffToAdd = (state.buffCatalog||[]).find(function(b){ return b.id === bid; });
      if(buffToAdd){
        var buffObj = {id: buffToAdd.id, name: buffToAdd.name, type: buffToAdd.type, bonus: buffToAdd.bonus, attr: buffToAdd.attr};
        if(isShieldAttr(buffToAdd.attr, buffToAdd.name)){
          var sBonus = parseShieldBonus(buffToAdd.bonus);
          if(sBonus > 0){
            c.combat.escudoActual = num(c.combat.escudoActual, 0) + sBonus;
            buffObj.shieldGranted = sBonus;
          }
        }
        c.activeBuffs.push(buffObj);
      }
    }
    saveState();
    renderTopbar();
    renderTab();
    broadcastCharStatUpdate(c.id, c.combat);
    return;
  }
  if(action==="remove-active-buff"){
    var buffId = btn.getAttribute("data-id");
    if(c.activeBuffs){
      var remBuff2 = c.activeBuffs.find(function(ab){ return ab.id === buffId; });
      if(remBuff2 && remBuff2.shieldGranted){
        c.combat.escudoActual = Math.max(0, num(c.combat.escudoActual, 0) - remBuff2.shieldGranted);
      }
      c.activeBuffs = c.activeBuffs.filter(function(ab){ return ab.id !== buffId; });
      saveState();
      renderTopbar();
      renderTab();
      broadcastCharStatUpdate(c.id, c.combat);
      showToast("Buff eliminado del personaje", "info");
    }
    return;
  }
  if(action==="npc-attr-mod"){
    if(!isGM() || !c.isNPC) return;
    var attrKey = btn.getAttribute("data-attr");
    var delta = parseInt(btn.getAttribute("data-delta"),10);
    if(attrKey && c.attrs[attrKey] !== undefined){
      c.attrs[attrKey] = Math.max(0, num(c.attrs[attrKey],0) + delta);
      saveState();
      renderTab();
    }
    return;
  }
  if(action==="toggle-buff"){
    var bName = btn.getAttribute("data-buff");
    if(!c.buffs) c.buffs={};
    c.buffs[bName] = !c.buffs[bName];
    saveState(); renderTab(); return;
  }
  if(action==="roll-skill"){
    var sid = btn.getAttribute("data-id");
    var sdef = SKILL_DEFS.find(function(s){return s.id===sid;});
    performD10Roll(c.name, sdef.name, skillTotal(sdef,c));
    return;
  }
  if(action==="roll-custom-skill"){
    var csid = btn.getAttribute("data-id");
    var cs = (c.customSkills||[]).find(function(x){return x.id===csid;});
    if(cs) performD10Roll(c.name, cs.name, customSkillTotal(cs,c));
    return;
  }
  if(action==="add-custom-skill"){
    if(!canEditChar(c)) return;
    var nm = prompt("Nombre de la habilidad:");
    if(!nm) return;
    var attrChoice = prompt("Atributo base (fisico / destreza / inteligencia / percepcion / carisma):","destreza");
    if(ATTRS.indexOf(attrChoice)===-1) attrChoice="destreza";
    if(!c.customSkills) c.customSkills=[];
    c.customSkills.push({id:uid(),name:nm,attr:attrChoice,bonus:1});
    c._lastLocalEdit = Date.now(); markCharDirty(c.id);
    saveState(); renderTab();
    showToast("Habilidad personalizada añadida", "success");
    return;
  }
  if(action==="add-custom-buff"){
    if(!canEditChar(c)) return;
    if(!c.customBuffs) c.customBuffs=[];
    c.customBuffs.push({id:uid(),name:""});
    c._lastLocalEdit = Date.now(); markCharDirty(c.id);
    saveState(); renderTab(); return;
  }
  if(action==="del-custom-buff"){
    if(!canEditChar(c)) return;
    c.customBuffs = (c.customBuffs||[]).filter(function(b){return b.id!==btn.getAttribute("data-id");});
    c._lastLocalEdit = Date.now(); markCharDirty(c.id);
    saveState(); renderTab(); return;
  }
  if(action==="roll-init"){ performD10Roll(c.name, "Iniciativa", c.combat.iniciativa); return; }
  if(action==="roll-weapon"){
    var wid = btn.getAttribute("data-id");
    var wpn = (c.weapons||[]).find(function(w){return w.id===wid;});
    if(wpn){
      var catItem = (state.weaponsCatalog||[]).find(function(ci){ return ci.name === wpn.name || ci.id === wpn.catalogId; });
      if(catItem && catItem.visible === false && !isGM()){
        showToast("Esta arma ha sido bloqueada por el Máster y no se puede usar.", "warning");
        return;
      }
      var formula = catItem ? catItem.dano : "1d6";
      performWeaponRoll(c.name, wpn.name||"Arma", formula);
    }
    return;
  }
  if(action==="select-weapon-catalog"){
    if(!canEditChar(c)) return;
    var selEl = e.target;
    var wid = btn.getAttribute("data-id");
    var catId = selEl.value;
    var catItem = (state.weaponsCatalog||[]).find(function(ci){ return ci.id === catId; });
    var wpnObj = (c.weapons||[]).find(function(w){ return w.id === wid; });
    if(wpnObj && catItem){
      wpnObj.name = catItem.name;
      wpnObj.dano = catItem.dano;
      wpnObj.alcance = catItem.alcance;
      wpnObj.catalogId = catItem.id;
      c._lastLocalEdit = Date.now(); markCharDirty(c.id);
      saveState(); renderTab();
      showToast("Arma equipada: " + catItem.name, "success");
    }
    return;
  }
  if(action==="toggle-weapon-visibility"){
    if(!isGM()) return;
    var wid2 = btn.getAttribute("data-id");
    var w = (state.weaponsCatalog||[]).find(function(x){return x.id===wid2;});
    if(w){
      w.visible = (w.visible===false) ? true : false;
      saveState(true);
      pushSharedData();
      renderTab();
      showToast(w.name + (w.visible ? " ahora es visible y usable para todos" : " ha sido bloqueada por el Máster"), "info");
    }
    return;
  }
  if(action==="add-global-weapon"){
    if(!isGM()) return;
    if(!state.weaponsCatalog) state.weaponsCatalog = [];
    state.weaponsCatalog.push({id:uid(), name:"Nueva Arma", dano:"1d6", alcance:"Melé", critico:"Efecto crítico", desc:"Descripción", visible:true});
    saveState(true); pushSharedData(); renderTab();
    showToast("Arma añadida al catálogo", "success");
    return;
  }
  if(action==="del-global-weapon"){
    if(!isGM()) return;
    state.weaponsCatalog = (state.weaponsCatalog||[]).filter(function(w){ return w.id !== btn.getAttribute("data-id"); });
    saveState(true); pushSharedData(); renderTab();
    showToast("Arma eliminada del catálogo", "info");
    return;
  }
  if(action==="toggle-buff-visibility"){
    if(!isGM()) return;
    var b = (state.buffCatalog||[]).find(function(x){return x.id===btn.getAttribute("data-id");});
    if(b){ b.visible = b.visible===false ? true : false; saveState(true); pushSharedData(); renderTab(); }
    return;
  }
  if(action==="add-global-buff"){
    if(!isGM()) return;
    if(!state.buffCatalog) state.buffCatalog = [];
    state.buffCatalog.push({id:uid(), name:"Nuevo Buff", type:"buff", attr:"", bonus:"", duration:"permanent", durationTurns:0, desc:"", visible:true});
    saveState(true); pushSharedData(); renderTab();
    showToast("Buff añadido al catálogo", "success");
    return;
  }
  if(action==="del-global-buff"){
    if(!isGM()) return;
    state.buffCatalog = (state.buffCatalog||[]).filter(function(b){ return b.id !== btn.getAttribute("data-id"); });
    saveState(true); pushSharedData(); renderTab();
    showToast("Buff eliminado", "info");
    return;
  }
  if(action==="add-weapon"){ if(!canEditChar(c)) return; c.weapons.push({id:uid(),name:"",dano:"",alcance:"",catalogId:""}); c._lastLocalEdit = Date.now(); markCharDirty(c.id); saveState(); renderTab(); return; }
  if(action==="del-weapon"){ if(!canEditChar(c)) return; c.weapons = c.weapons.filter(function(w){return w.id!==btn.getAttribute("data-id");}); c._lastLocalEdit = Date.now(); markCharDirty(c.id); saveState(); renderTab(); return; }
  if(action==="add-armor"){ if(!canEditChar(c)) return; c.armors.push({id:uid(),name:"",absorcion:"",estorbo:""}); c._lastLocalEdit = Date.now(); markCharDirty(c.id); saveState(); renderTab(); return; }
  if(action==="del-armor"){ if(!canEditChar(c)) return; c.armors = c.armors.filter(function(a){return a.id!==btn.getAttribute("data-id");}); c._lastLocalEdit = Date.now(); markCharDirty(c.id); saveState(); renderTab(); return; }
  if(action==="add-inventory"){ if(!canEditChar(c)) return; c.inventory = c.inventory || []; c.inventory.push({id:uid(),name:"",qty:1}); c._lastLocalEdit = Date.now(); markCharDirty(c.id); saveState(); renderTab(); return; }
  if(action==="del-inventory"){ if(!canEditChar(c)) return; c.inventory = (c.inventory || []).filter(function(i){return i.id!==btn.getAttribute("data-id");}); c._lastLocalEdit = Date.now(); markCharDirty(c.id); saveState(); renderTab(); return; }
  if(action==="add-spell"){
    if(!canEditChar(c)) return;
    if(!c.spells) c.spells = [];
    c.spells.push({id:uid(), name:"", coste:1, rango:"Melé", statAttr:"", statMod:"", efecto:"", active:false});
    c._lastLocalEdit = Date.now(); markCharDirty(c.id);
    saveState(); renderTab(); return;
  }
  if(action==="del-spell"){
    if(!canEditChar(c)) return;
    c.spells = (c.spells||[]).filter(function(s){return s.id!==btn.getAttribute("data-id");});
    c._lastLocalEdit = Date.now(); markCharDirty(c.id);
    saveState(); renderTab(); return;
  }
  if(action==="cast-spell"){
    var spId = btn.getAttribute("data-id");
    var sp = (c.spells||[]).find(function(s){ return s.id === spId; });
    if(!sp) return;
    var cost = Math.max(0, num(sp.coste, 0));
    var curMana = num(c.combat.manaActual, 0);
    if(curMana < cost){
      showToast("¡Maná insuficiente! (" + curMana + " / " + cost + ")", "warning");
      return;
    }
    c.combat.manaActual = Math.max(0, curMana - cost);
    sp.active = true;
    sp.activeStacks = (sp.activeStacks || 0) + 1;

    var statNotice = "";
    if(isShieldAttr(sp.statAttr, sp.name)){
      var shieldGain = parseShieldBonus(sp.statMod);
      if(shieldGain > 0){
        c.combat.escudoActual = num(c.combat.escudoActual, 0) + shieldGain;
        sp.shieldStacks = sp.shieldStacks || [];
        sp.shieldStacks.push(shieldGain);
        sp.shieldGranted = (sp.shieldGranted || 0) + shieldGain;
        statNotice = " [🛡️ +" + shieldGain + " Escudo/Vida Falsa (Carga " + sp.activeStacks + ")]";
      }
    } else if(sp.statAttr && sp.statMod){
      statNotice = " [Carga " + sp.activeStacks + ": " + sp.statMod + " a " + sp.statAttr + "]";
    }

    saveState();
    renderTopbar();
    renderTab();
    broadcastCharStatUpdate(c.id, c.combat);
    showToast("¡" + (sp.name || "Hechizo") + " lanzado! (" + sp.activeStacks + "ª carga) -" + cost + " maná" + statNotice, "success");
    playDiceAudio("crit");
    return;
  }
  if(action==="toggle-spell-active"){
    var spId2 = btn.getAttribute("data-id");
    var sp2 = (c.spells||[]).find(function(s){ return s.id === spId2; });
    if(sp2){
      var shieldNotice = "";
      if(sp2.shieldStacks && sp2.shieldStacks.length > 0){
        var rem = sp2.shieldStacks.pop();
        c.combat.escudoActual = Math.max(0, num(c.combat.escudoActual, 0) - rem);
        sp2.shieldGranted = Math.max(0, (sp2.shieldGranted || 0) - rem);
        shieldNotice = " (-" + rem + " Escudo/Vida Falsa)";
      } else if(sp2.shieldGranted && sp2.shieldGranted > 0){
        var rem2 = sp2.shieldGranted;
        c.combat.escudoActual = Math.max(0, num(c.combat.escudoActual, 0) - rem2);
        sp2.shieldGranted = 0;
        shieldNotice = " (-" + rem2 + " Escudo/Vida Falsa)";
      }

      sp2.activeStacks = Math.max(0, (sp2.activeStacks || 1) - 1);
      if(sp2.activeStacks <= 0){
        sp2.active = false;
        sp2.activeStacks = 0;
        sp2.shieldGranted = 0;
        sp2.shieldStacks = [];
        showToast("Efecto de " + (sp2.name || "Hechizo") + " desactivado por completo" + shieldNotice + ".", "info");
      } else {
        showToast("Retirada 1 carga de " + (sp2.name || "Hechizo") + " (" + sp2.activeStacks + " restantes)" + shieldNotice + ".", "info");
      }

      saveState();
      renderTopbar();
      renderTab();
      broadcastCharStatUpdate(c.id, c.combat);
    }
    return;
  }
  if(action==="add-stone"){ if(!canEditChar(c)) return; c.stones.push({id:uid(),color:"",efecto:""}); c._lastLocalEdit = Date.now(); markCharDirty(c.id); saveState(); renderTab(); return; }
  if(action==="del-stone"){ if(!canEditChar(c)) return; c.stones = c.stones.filter(function(s){return s.id!==btn.getAttribute("data-id");}); c._lastLocalEdit = Date.now(); markCharDirty(c.id); saveState(); renderTab(); return; }
  if(action==="add-summon"){ if(!canEditChar(c)) return; c.summons.push({id:uid(),name:"",vida:"",defensa:"",absorcion:"",dano:"",movilidad:"",inteligencia:"",habilidades:""}); c._lastLocalEdit = Date.now(); markCharDirty(c.id); saveState(); renderTab(); return; }
  if(action==="del-summon"){ if(!canEditChar(c)) return; c.summons = c.summons.filter(function(s){return s.id!==btn.getAttribute("data-id");}); c._lastLocalEdit = Date.now(); markCharDirty(c.id); saveState(); renderTab(); return; }
  if(action==="add-poison"){ if(!canEditChar(c)) return; if(!c.poisons)c.poisons=[]; c.poisons.push({id:uid(),name:"",dosis:1,efectoEnemigo:"",efectoCherk:"",estado:"descubierto"}); c._lastLocalEdit = Date.now(); markCharDirty(c.id); saveState(); renderTab(); return; }
  if(action==="del-poison"){ if(!canEditChar(c)) return; c.poisons = c.poisons.filter(function(p){return p.id!==btn.getAttribute("data-id");}); c._lastLocalEdit = Date.now(); markCharDirty(c.id); saveState(); renderTab(); return; }
  if(action==="add-passiveNeg"){ if(!isGM()) return; c.passivesNeg.push({id:uid(),text:""}); c._lastLocalEdit = Date.now(); markCharDirty(c.id); saveState(); renderTab(); return; }
  if(action==="del-passiveNeg"){ if(!isGM()) return; c.passivesNeg = c.passivesNeg.filter(function(p){return p.id!==btn.getAttribute("data-id");}); c._lastLocalEdit = Date.now(); markCharDirty(c.id); saveState(); renderTab(); return; }
  if(action==="add-passivePos"){ if(!isGM()) return; c.passivesPos.push({id:uid(),text:""}); c._lastLocalEdit = Date.now(); markCharDirty(c.id); saveState(); renderTab(); return; }
  if(action==="del-passivePos"){ if(!isGM()) return; c.passivesPos = c.passivesPos.filter(function(p){return p.id!==btn.getAttribute("data-id");}); c._lastLocalEdit = Date.now(); markCharDirty(c.id); saveState(); renderTab(); return; }
  if(action==="add-goddess"){ if(!isGM()) return; c.goddessTable.push({id:uid(),nombre:"",gustos:"",disgustos:""}); c._lastLocalEdit = Date.now(); markCharDirty(c.id); saveState(); renderTab(); return; }
  if(action==="del-goddess"){ if(!isGM()) return; c.goddessTable = c.goddessTable.filter(function(g){return g.id!==btn.getAttribute("data-id");}); c._lastLocalEdit = Date.now(); markCharDirty(c.id); saveState(); renderTab(); return; }
  if(action==="toggle-bestiary-visibility"){
    if(!isGM()) return;
    var bid = btn.getAttribute("data-id");
    var b = (state.bestiary||[]).find(function(x){return x.id===bid;});
    if(b){ b.visible = b.visible===false ? true : false; saveState(true); pushSharedData(); renderTab(); }
    return;
  }
  if(action==="toggle-bestiary-mountable"){
    if(!isGM()) return;
    var bid = btn.getAttribute("data-id");
    var b = (state.bestiary||[]).find(function(x){return x.id===bid;});
    if(b){
      b.montable = !b.montable;
      saveState(true);
      pushSharedData();
      renderTab();
      showToast(b.nombre + (b.montable ? " marcada como montura" : " marcada como no montable"), "info");
    }
    return;
  }
  if(action==="set-bestiary-rarity"){
    bestiaryRarityFilter = btn.getAttribute("data-val") || "Todos";
    renderTab();
    return;
  }
  if(action==="set-bestiary-mount"){
    bestiaryMountFilter = btn.getAttribute("data-val") || "Todos";
    renderTab();
    return;
  }
  if(action==="roll-tame"){
    var creatureName = btn.getAttribute("data-name") || "Criatura";
    var diff = parseInt(btn.getAttribute("data-diff"), 10) || 3;
    var faunaDef = SKILL_DEFS.find(function(s){ return s.id === "fauna"; });
    var cabalgarDef = SKILL_DEFS.find(function(s){ return s.id === "cabalgar"; });
    var faunaTotal = faunaDef ? skillTotal(faunaDef, c) : 0;
    var cabalgarTotal = cabalgarDef ? skillTotal(cabalgarDef, c) : 0;
    var carismaVal = (c.attrs && c.attrs.carisma) ? num(c.attrs.carisma, 0) : 0;
    var bestBonus = Math.max(faunaTotal, cabalgarTotal, carismaVal);
    var chosenStat = bestBonus === faunaTotal ? "Fauna" : (bestBonus === cabalgarTotal ? "Cabalgar" : "Carisma");

    var d = rollDie(10);
    var total = d + bestBonus;
    var isSuccess = total >= diff;
    var formula = "1d10 (" + d + ") + " + chosenStat + " (" + bestBonus + ") vs Dif. " + diff;
    var rollItem = {
      id: uid(),
      charName: c.name,
      label: "Doma (" + creatureName + ")" + (isSuccess ? " ✅ ÉXITO" : " ❌ FALLO"),
      total: total,
      formulaText: formula,
      isCrit: d === 10,
      isFumble: d === 1,
      ts: Date.now()
    };
    state.rollLog.unshift(rollItem);
    if(state.rollLog.length > 20) state.rollLog.length = 20;
    saveState();
    broadcastDiceRoll(rollItem);
    showToast((isSuccess ? "¡Éxito domando a " : "Fallo al domar a ") + creatureName + " (Total: " + total + " vs Dif " + diff + ")", isSuccess ? "success" : "warning");
    if(state.activeTab === "bestiario" || state.activeTab === "combate") renderTab();
    return;
  }
  if(action==="add-bestiary"){
    if(!isGM()) return;
    state.bestiary.push({
      id: uid(),
      nombre: "Nueva Criatura",
      continente: "Todos",
      rarity: "Común",
      montable: false,
      casillasMovimiento: "8",
      doma: "3",
      vida: "",
      defensa: "",
      absorcion: "",
      dano: "",
      movilidad: "",
      habilidades: "",
      visible: true
    });
    saveState(true);
    pushSharedData();
    renderTab();
    return;
  }
  if(action==="del-bestiary"){ if(!isGM()) return; state.bestiary = state.bestiary.filter(function(b){return b.id!==btn.getAttribute("data-id");}); saveState(true); pushSharedData(); renderTab(); return; }
  if(action==="toggle-lore-visibility"){
    if(!isGM()) return;
    var lcat = btn.getAttribute("data-cat");
    var lid = btn.getAttribute("data-id");
    var li = (state.lore[lcat]||[]).find(function(x){return x.id===lid;});
    if(li){ li.visible = li.visible===false ? true : false; saveState(true); pushSharedData(); renderTab(); }
    return;
  }
  if(action==="open-lore-modal"){
    if(!isGM()) return;
    openLoreModal(btn.getAttribute("data-cat"));
    return;
  }
  if(action==="del-lore"){
    if(!isGM()) return;
    var cat2 = btn.getAttribute("data-cat");
    state.lore[cat2] = state.lore[cat2].filter(function(x){return x.id!==btn.getAttribute("data-id");});
    saveState(true); pushSharedData(); renderTab();
    showToast("Entrada eliminada", "info");
    return;
  }

  if(action==="sync-map-now"){ pullMapFromSupabase(); showToast("Mapas sincronizados con la nube", "success"); return; }
  if(action==="switch-map"){ state.activeMapId = btn.getAttribute("data-id"); renderTab(); return; }
  if(action==="add-new-map-url"){
    if(!isGM() && currentUser) return;
    var mn = prompt("Nombre del nuevo mapa (ej: Mazmorra, Ciudad, Continente):");
    if(!mn) return;
    var mUrl = prompt("Enlace o URL de la imagen (de GitHub, Imgur, web, etc.):");
    if(mUrl !== null){
      var nMap = { id: uid(), name: mn.trim(), image: mUrl.trim() || null, markers: [] };
      state.maps = state.maps || [];
      state.maps.push(nMap);
      state.activeMapId = nMap.id;
      saveState(true);
      pushMapsData();
      renderTab();
      showToast("Nuevo mapa creado: " + nMap.name, "success");
    }
    return;
  }
  if(action==="add-new-map-file"){
    if(!isGM() && currentUser) return;
    var mn2 = prompt("Nombre del nuevo mapa (ej: Mazmorra, Ciudad, Continente):");
    if(!mn2) return;
    pendingNewMapName = mn2.trim();
    document.getElementById("mapFileInput").click();
    return;
  }
  if(action==="delete-map"){
    if(!isGM() && currentUser) return;
    var targetMap = (state.maps||[]).find(function(m){return m.id===state.activeMapId;});
    if(!targetMap) return;
    var mName = targetMap.name || "este mapa";
    var mCount = (targetMap.markers||[]).length;
    var confirmMsg = "¿Eliminar definitivamente el mapa \"" + mName + "\"" + (mCount > 0 ? " con sus " + mCount + " marcador(es)?" : "?");
    if(confirm(confirmMsg)){
      state.maps = (state.maps||[]).filter(function(m){return m.id!==targetMap.id;});
      if(!state.maps.length){
        var defaultM = { id:"world_main", name:"Mapa de Campaña", image:null, markers:[] };
        state.maps.push(defaultM);
      }
      state.activeMapId = state.maps[0].id;
      saveState(true);
      pushMapsData();
      renderTab();
      showToast("Mapa \"" + mName + "\" eliminado", "info");
    }
    return;
  }
  if(action==="upload-map"){
    if(!isGM() && currentUser) return;
    pendingNewMapName = null;
    document.getElementById("mapFileInput").click();
    return;
  }
  if(action==="url-map"){
    if(!isGM() && currentUser) return;
    var curMUrl = (state.maps||[]).find(function(m){return m.id===state.activeMapId;});
    if(curMUrl){
      var prevMapImg = curMUrl.image || "";
      var mLink = prompt("Introduce el enlace de la imagen para \"" + curMUrl.name + "\":", prevMapImg.startsWith("data:")?"":prevMapImg);
      if(mLink !== null){
        curMUrl.image = mLink.trim() || null;
        saveState(true);
        pushMapsData();
        renderTab();
        showToast("Foto del mapa actualizada", "info");
      }
    }
    return;
  }
  if(action==="remove-map"){
    if(!isGM() && currentUser) return;
    var curM = (state.maps||[]).find(function(m){return m.id===state.activeMapId;});
    if(curM){
      curM.image = null;
      saveState(true);
      pushMapsData();
      renderTab();
      showToast("Foto quitada del mapa", "info");
    }
    return;
  }
  if(action==="map-click"){
    if(!isGM() && currentUser) return;
    var curM2 = (state.maps||[]).find(function(m){return m.id===state.activeMapId;});
    var imgEl = btn.querySelector("img");
    if(curM2 && imgEl){
      var r = imgEl.getBoundingClientRect();
      var px = ((e.clientX - r.left)/r.width*100).toFixed(2);
      var py = ((e.clientY - r.top)/r.height*100).toFixed(2);
      openPinModal(curM2, px, py);
    }
    return;
  }
  if(action==="edit-pin"){
    if(!isGM() && currentUser) return;
    var curM3 = (state.maps||[]).find(function(m){return m.id===state.activeMapId;});
    if(curM3) openPinModal(curM3, null, null, btn.getAttribute("data-id"));
    return;
  }

  if(action==="upload-bestiary-img"){
    if(!isGM() && currentUser) return;
    pendingBestiaryId = btn.getAttribute("data-id");
    var bFileEl = document.getElementById("bestiaryFileInput");
    if(bFileEl) bFileEl.click();
    return;
  }
  if(action==="url-bestiary-img"){
    if(!isGM() && currentUser) return;
    var bid = btn.getAttribute("data-id");
    var beast = (state.bestiary||[]).find(function(x){return x.id===bid;});
    if(beast){
      var prevBImg = beast.image || "";
      var bLink = prompt("Introduce el enlace de la criatura (de GitHub, Imgur, web, etc.):", prevBImg.startsWith("data:")?"":prevBImg);
      if(bLink !== null){
        beast.image = bLink.trim() || null;
        saveState(true); pushSharedData(); renderTab();
        showToast(beast.image ? "Imagen de criatura asignada" : "Imagen quitada", "info");
      }
    }
    return;
  }
  if(action==="remove-bestiary-img"){
    if(!isGM() && currentUser) return;
    var bid2 = btn.getAttribute("data-id");
    var beast2 = (state.bestiary||[]).find(function(x){return x.id===bid2;});
    if(beast2){
      beast2.image = null;
      saveState(true); pushSharedData(); renderTab();
      showToast("Imagen de criatura eliminada", "info");
    }
    return;
  }

  // === ACCIONES DE LA PESTAÑA MISIÓN (ESTILO BALDUR'S GATE 3 / D&D) ===
  if(action==="add-quest"){
    if(!isGM() && currentUser) return;
    var qTitle = prompt("Título de la nueva misión:");
    if(qTitle && qTitle.trim()){
      state.quests = state.quests || [];
      state.quests.push({
        id: uid(),
        title: qTitle.trim(),
        desc: "",
        status: "activa",
        tasks: []
      });
      saveState(true); pushSharedData(); renderTab();
      showToast("Misión añadida: " + qTitle, "success");
    }
    return;
  }
  if(action==="del-quest"){
    if(!isGM() && currentUser) return;
    var qid = btn.getAttribute("data-id");
    if(confirm("¿Eliminar esta misión y todas sus tareas asociadas?")){
      state.quests = (state.quests||[]).filter(function(q){ return q.id !== qid; });
      saveState(true); pushSharedData(); renderTab();
      showToast("Misión eliminada", "info");
    }
    return;
  }
  if(action==="add-quest-task"){
    if(!isGM() && currentUser) return;
    var qid2 = btn.getAttribute("data-id");
    var qObj = (state.quests||[]).find(function(q){ return q.id === qid2; });
    if(qObj){
      var tText = prompt("Nuevo objetivo o paso para esta misión:");
      if(tText && tText.trim()){
        qObj.tasks = qObj.tasks || [];
        qObj.tasks.push({ id: uid(), text: tText.trim(), done: false });
        saveState(true); pushSharedData(); renderTab();
        showToast("Objetivo añadido", "success");
      }
    }
    return;
  }
  if(action==="del-quest-task"){
    if(!isGM() && currentUser) return;
    var qid3 = btn.getAttribute("data-qid");
    var tid = btn.getAttribute("data-tid");
    var qObj2 = (state.quests||[]).find(function(q){ return q.id === qid3; });
    if(qObj2 && qObj2.tasks){
      qObj2.tasks = qObj2.tasks.filter(function(t){ return t.id !== tid; });
      saveState(true); pushSharedData(); renderTab();
    }
    return;
  }
  if(action==="toggle-quest-task"){
    var qid4 = btn.getAttribute("data-qid");
    var tid2 = btn.getAttribute("data-tid");
    var qObj3 = (state.quests||[]).find(function(q){ return q.id === qid4; });
    if(qObj3 && qObj3.tasks){
      var task = qObj3.tasks.find(function(t){ return t.id === tid2; });
      if(task){
        task.done = !task.done;
        saveState(true); pushSharedData(); renderTab();
      }
    }
    return;
  }
  if(action==="add-clue"){
    if(!isGM() && currentUser) return;
    var clTitle = prompt("Título del descubrimiento o pista:");
    if(clTitle && clTitle.trim()){
      state.questClues = state.questClues || [];
      state.questClues.push({ id: uid(), title: clTitle.trim(), text: "", image: null, visible: true });
      saveState(true); pushSharedData(); renderTab();
      showToast("Pista añadida", "success");
    }
    return;
  }
  if(action==="del-clue"){
    if(!isGM() && currentUser) return;
    var clId = btn.getAttribute("data-id");
    if(confirm("¿Eliminar esta pista?")){
      state.questClues = (state.questClues||[]).filter(function(c){ return c.id !== clId; });
      saveState(true); pushSharedData(); renderTab();
      showToast("Pista eliminada", "info");
    }
    return;
  }
  if(action==="url-clue-img"){
    if(!isGM() && currentUser) return;
    var clId2 = btn.getAttribute("data-id");
    var clObj = (state.questClues||[]).find(function(c){ return c.id === clId2; });
    if(clObj){
      var clUrl = prompt("Enlace de la imagen para esta pista (de GitHub, web, etc.):", clObj.image||"");
      if(clUrl !== null){
        clObj.image = clUrl.trim() || null;
        saveState(true); pushSharedData(); renderTab();
        showToast(clObj.image ? "Imagen de pista asignada" : "Imagen quitada", "info");
      }
    }
    return;
  }
  if(action==="remove-clue-img"){
    if(!isGM() && currentUser) return;
    var clId3 = btn.getAttribute("data-id");
    var clObj2 = (state.questClues||[]).find(function(c){ return c.id === clId3; });
    if(clObj2){
      clObj2.image = null;
      saveState(true); pushSharedData(); renderTab();
      showToast("Imagen de pista eliminada", "info");
    }
    return;
  }
  if(action==="upload-quest-map"){
    if(!isGM() && currentUser) return;
    var qFileInput = document.getElementById("questFileInput");
    if(qFileInput) qFileInput.click();
    return;
  }
  if(action==="url-quest-map"){
    if(!isGM() && currentUser) return;
    state.questMap = state.questMap || { name: "Mapa del Encuentro", image: null, notes: "" };
    var qmUrl = prompt("Introduce el enlace o URL de la imagen para el plano de misión:", state.questMap.image||"");
    if(qmUrl !== null){
      state.questMap.image = qmUrl.trim() || null;
      saveState(true); pushSharedData(); renderTab();
      showToast(state.questMap.image ? "Mapa de misión fijado" : "Mapa de misión quitado", "info");
    }
    return;
  }
  if(action==="remove-quest-map"){
    if(!isGM() && currentUser) return;
    if(state.questMap){
      state.questMap.image = null;
      saveState(true); pushSharedData(); renderTab();
      showToast("Mapa de misión quitado", "info");
    }
    return;
  }

  if(action==="open-char-modal"){ openCharModal(); return; }
  if(action==="open-data-modal"){ openDataModal(); return; }
  if(action==="open-free-dice"){ openDiceModal(); return; }
  if(action==="upload-portrait"){ document.getElementById("portraitFileInput").click(); return; }
  if(action==="url-portrait"){
    var curP = c.portrait || "";
    var uLink = prompt("Introduce el enlace de la foto (de GitHub, Imgur, web, etc.):", curP.startsWith("data:")?"":curP);
    if(uLink !== null){
      c.portrait = uLink.trim() || null;
      saveState(); renderTopbar(); renderTab();
      showToast(c.portrait ? "Foto actualizada desde enlace" : "Foto quitada", "info");
    }
    return;
  }
  if(action==="remove-portrait"){ c.portrait=null; saveState(); renderTopbar(); renderTab(); return; }
  if(action==="close-roll-modal"){ document.getElementById("rollOverlay").classList.add("hidden"); return; }
  if(action==="reroll-last-dice"){ if(typeof lastRollFn==="function") lastRollFn(); return; }
}

var pendingBestiaryId = null;
var pendingNewMapName = null;

function init(){
  updateLoadingProgress(25, "Cargando fichas...");
  state = loadState();
  updateLoadingProgress(60, "Preparando compendio...");
  renderTopbar();
  renderTabbar();
  renderTab();

  document.getElementById("main").addEventListener("click", handleClick);
  document.getElementById("main").addEventListener("change", handleChange);
  document.getElementById("main").addEventListener("input", handleChange);
  
  document.addEventListener("touchstart", handleTouchStart, {passive: true});
  document.addEventListener("touchend", handleTouchEnd, {passive: true});
  
  if(window.innerWidth < 768){
    setTimeout(showSwipeIndicator, 1000);
  }
  
  document.getElementById("topbar").addEventListener("click", handleClick);
  document.getElementById("tabbar").addEventListener("click", handleClick);
  document.getElementById("charModal").addEventListener("click", modalClick);
  document.getElementById("dataModal").addEventListener("click", modalClick);
  document.getElementById("diceModal").addEventListener("click", diceModalClick);
  document.getElementById("pinModal").addEventListener("click", pinModalClick);
  document.getElementById("loreModal").addEventListener("click", loreModalClick);
  
  document.getElementById("charModalOverlay").addEventListener("click", function(e){ if(e.target===this) closeModals(); });
  document.getElementById("dataModalOverlay").addEventListener("click", function(e){ if(e.target===this) closeModals(); });
  document.getElementById("diceModalOverlay").addEventListener("click", function(e){ if(e.target===this) closeModals(); });
  document.getElementById("pinModalOverlay").addEventListener("click", function(e){ if(e.target===this) closeModals(); });
  document.getElementById("loreModalOverlay").addEventListener("click", function(e){ if(e.target===this) closeModals(); });
  
  document.getElementById("rollOverlay").addEventListener("click", function(e){
    if(e.target===this || e.target.closest("[data-action='close-roll-modal']")){
      this.classList.add("hidden");
    } else if(e.target.closest("[data-action='reroll-last-dice']")){
      if(typeof lastRollFn === "function") lastRollFn();
    }
  });

  document.getElementById("fabDice").addEventListener("click", openDiceModal);

  document.getElementById("portraitFileInput").addEventListener("change", function(e){
    if(e.target.files && e.target.files[0]){
      resizeImageFile(e.target.files[0], 400, 0.85, function(url){ activeChar().portrait = url; saveState(); renderTopbar(); renderTab(); });
    }
    e.target.value="";
  });
  document.getElementById("mapFileInput").addEventListener("change", function(e){
    if(e.target.files && e.target.files[0]){
      resizeImageFile(e.target.files[0], 900, 0.65, function(url){
        if(pendingNewMapName){
          var newM = { id: uid(), name: pendingNewMapName, image: url, markers: [] };
          state.maps = state.maps || [];
          state.maps.push(newM);
          state.activeMapId = newM.id;
          pendingNewMapName = null;
          saveState(true);
          pushMapsData();
          renderTab();
          showToast("Nuevo mapa creado: " + newM.name, "success");
        } else {
          var curM = (state.maps||[]).find(function(m){return m.id===state.activeMapId;});
          if(curM){
            curM.image = url;
            saveState(true);
            pushMapsData();
            renderTab();
            showToast("Foto del mapa actualizada", "info");
          }
        }
      });
    }
    e.target.value="";
  });
  var bFileInput = document.getElementById("bestiaryFileInput");
  if(bFileInput){
    bFileInput.addEventListener("change", function(e){
      if(e.target.files && e.target.files[0] && pendingBestiaryId){
        resizeImageFile(e.target.files[0], 600, 0.7, function(url){
          var beast = (state.bestiary||[]).find(function(x){return x.id===pendingBestiaryId;});
          if(beast){
            beast.image = url;
            saveState(true); pushSharedData(); renderTab();
          }
          pendingBestiaryId = null;
        });
      }
      e.target.value="";
    });
  }
  var qFileInput = document.getElementById("questFileInput");
  if(qFileInput){
    qFileInput.addEventListener("change", function(e){
      if(e.target.files && e.target.files[0]){
        resizeImageFile(e.target.files[0], 900, 0.7, function(url){
          state.questMap = state.questMap || { name: "Mapa del Encuentro", image: null, notes: "" };
          state.questMap.image = url;
          saveState(true); pushSharedData(); renderTab();
          showToast("Mapa de misión actualizado", "success");
        });
      }
      e.target.value = "";
    });
  }
  document.getElementById("importFileInput").addEventListener("change", function(e){
    if(e.target.files && e.target.files[0]) importData(e.target.files[0]);
    e.target.value="";
  });

  window.addEventListener("beforeunload", function(){
    if(document.activeElement && document.activeElement.matches("input, textarea, select")){
      try { document.activeElement.blur(); } catch(e){}
    }
    flushPendingSync();
    (state.characters || []).forEach(function(c){
      if(c && c._isDirty) sendKeepalivePush(c);
    });
  });
  window.addEventListener("pagehide", function(){
    flushPendingSync();
    (state.characters || []).forEach(function(c){
      if(c && c._isDirty) sendKeepalivePush(c);
    });
  });
  document.addEventListener("visibilitychange", function(){
    if(document.visibilityState === "hidden"){
      flushPendingSync();
      (state.characters || []).forEach(function(c){
        if(c && c._isDirty) sendKeepalivePush(c);
      });
    }
  });

  updateLoadingProgress(85, "Conectando con la partida...");
  initSupabase();
  checkWeeklyBackup();
  updateLoadingProgress(100, "¡Listo!");
  setTimeout(hideLoadingScreen, 700);
  setTimeout(hideLoadingScreen, 3500);
}

if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
