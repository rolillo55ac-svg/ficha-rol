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
var loreContinentFilter = "Todos";
var loreTypeFilter = "Todos";
var loreTerrainFilter = "Todos";
var currentLoreSubtab = "objetos";
var currentBuffTab = "all";

function getSeedWeaponsCatalog(){
  return [
    {id:uid(), name:"Espada Larga", dano:"1d8+2", alcance:"Melé", critico:"Doble daño en dados y sangrado leve.", desc:"Espada equilibrada de hoja recta.", visible:true},
    {id:uid(), name:"Arco Largo", dano:"1d8", alcance:"150m", critico:"Ignora 2 puntos de absorción de armadura.", desc:"Arco de gran tensión para combate a distancia.", visible:true},
    {id:uid(), name:"Daga Mordaz", dano:"1d4+1", alcance:"Melé / Arrojadiza", critico:"Envenena automáticamente al objetivo.", desc:"Arma ligera con filo envenenado.", visible:true}
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
    activeBuffs: []
  };
}

function getSeedBestiary(){
  return [
    {id:uid(),nombre:"Kimera",continente:"Vetrys",vida:"70",defensa:"15",absorcion:"3",dano:"1d6+3",movilidad:"10 (T/V)",habilidades:"Doma: 5. Nada a mitad de mov.",visible:true},
    {id:uid(),nombre:"Anaconda Gigante",continente:"Tryssar",vida:"60",defensa:"16",absorcion:"4",dano:"1d6+2",movilidad:"8 (T)",habilidades:"Doma: 5. Carga pesada.",visible:true},
    {id:uid(),nombre:"Infernal",continente:"Labrys",vida:"70",defensa:"16",absorcion:"4",dano:"2d6",movilidad:"12 (T)",habilidades:"Doma: 5. No puede nadar.",visible:true},
    {id:uid(),nombre:"Pegaso",continente:"Labrys",vida:"60",defensa:"15",absorcion:"3",dano:"1d6+2",habilidades:"Doma: 5. Montura voladora.",visible:true},
    {id:uid(),nombre:"Hypocampo",continente:"Labrys",vida:"60",defensa:"15",absorcion:"3",dano:"1d6+2",movilidad:"12 (A)",habilidades:"Doma: 5. Acuático.",visible:true},
    {id:uid(),nombre:"Oso Perro",continente:"Krysalis",vida:"80",defensa:"17",absorcion:"3",dano:"2d6",movilidad:"8 (T)",habilidades:"Doma: 5. Alta resistencia.",visible:true},
    {id:uid(),nombre:"Lobo Ártico",continente:"Aslan",vida:"40",defensa:"13",absorcion:"2",dano:"1d6+2/+3",movilidad:"8 (T)",habilidades:"Resistencia al frío.",visible:true}
  ];
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
      {id:uid(),title:"Veneno: Seta del sueño",text:"Efecto: Sueño / Paralización",terrain:"Bosque",rarity:"Común",continent:"Todos",type:"Veneno",visible:true},
      {id:uid(),title:"Veneno: Seta terrosa",text:"Efecto: Entumecer (+ Mitad Movilidad para Cherk)",terrain:"Minas / Cuevas",rarity:"Común",continent:"Todos",type:"Veneno",visible:true},
      {id:uid(),title:"Veneno: Nenúfar de Pantano",text:"Efecto: Reduce Percepción rival (+2 Percepción Cherk)",terrain:"Pantano",rarity:"Común",continent:"Todos",type:"Veneno",visible:true},
      {id:uid(),title:"Veneno: Nenúfar de Manglar",text:"Efecto: Daño continuo (+3 vida falsa Cherk)",terrain:"Manglar",rarity:"Común",continent:"Todos",type:"Veneno",visible:true},
      {id:uid(),title:"Poción: Flor de Lirio P",text:"Efecto: Cura venenos y toxinas",terrain:"Pantano",rarity:"Muy rara",continent:"Todos",type:"Poción",visible:true},
      {id:uid(),title:"Poción: Flor del Rey",text:"Efecto: +Defensa mágica temporal",terrain:"Bosque",rarity:"Muy rara",continent:"Todos",type:"Poción",visible:true},
      {id:uid(),title:"Ungüento: Margarita",text:"Efecto: Curación básica de heridas",terrain:"Praderas",rarity:"Común",continent:"Todos",type:"Ungüento",visible:true},
      {id:uid(),title:"Ungüento: Flor de Hestia",text:"Efecto: Resistencia al frío extremo",terrain:"Desierto",rarity:"Rara",continent:"Aslan",type:"Ungüento",visible:true}
    ]
  };
}

function defaultState(){
  return {
    activeId:"", activeTab:"ficha", rollLog:[], characters:[],
    weaponsCatalog: getSeedWeaponsCatalog(),
    buffCatalog: getSeedBuffCatalog(),
    lore:getSeedLore(), bestiary:getSeedBestiary(),
    maps:[{ id:"world_main", name:"Mapa de Campaña", image:null, markers:[] }],
    activeMapId:"world_main"
  };
}

function migrateState(s){
  if(!s.rollLog) s.rollLog=[];
  if(!s.weaponsCatalog || !s.weaponsCatalog.length) s.weaponsCatalog = getSeedWeaponsCatalog();
  if(!s.buffCatalog || !s.buffCatalog.length) s.buffCatalog = getSeedBuffCatalog();
  else {
    s.buffCatalog.forEach(function(b){ 
      if(b.visible===undefined) b.visible=true;
      if(b.duration===undefined) b.duration="permanent";
      if(b.durationTurns===undefined) b.durationTurns=0;
    });
  }
  if(!s.lore || !s.lore.objetos) s.lore=getSeedLore();
  if(!s.bestiary || !s.bestiary.length) s.bestiary=getSeedBestiary();
  else {
    s.bestiary.forEach(function(b){
      if(b.notas && !b.habilidades) b.habilidades = b.notas;
      if(b.habilidades===undefined) b.habilidades="";
      if(b.visible===undefined) b.visible=true;
    });
  }
  if(!s.maps || !s.maps.length){
    s.maps = [{ id:"world_main", name:"Mapa de Campaña", image:null, markers:[] }];
    s.activeMapId = "world_main";
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
    (c.summons||[]).forEach(function(su){
      if(su.notas && !su.habilidades) su.habilidades = su.notas;
      if(su.habilidades===undefined) su.habilidades="";
    });
  });
  return s;
}

function loadState(){
  try{
    var raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return defaultState();
    var parsed = JSON.parse(raw);
    return parsed ? migrateState(parsed) : defaultState();
  }catch(e){ return defaultState(); }
}

var syncDebounceTimer = null;
function saveState(skipRemote){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){}
  if(!skipRemote && supabaseClient && currentUser && !isRemoteSyncing){
    updateSyncBadge("saving");
    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = setTimeout(function(){
      pushActiveChar();
      pushSharedData();
    }, 400);
  }
}

function updateSyncBadge(st){
  var el = document.getElementById("syncBadge");
  if(!el) return;
  if(st==="synced"){ el.className="sync-status synced"; el.textContent="● En la nube"; }
  else if(st==="saving"){ el.className="sync-status saving"; el.textContent="⏳ Guardando..."; }
  else { el.className="sync-status"; el.textContent="○ Local"; }
}

function isGM(){ return currentRole==='gm'; }
function getUserCharacters(){
  if(isGM()) return state.characters;
  if(!currentUser) return state.characters.filter(function(c){ return !c.isNPC; });
  return state.characters.filter(function(c){ 
    return c.owner_id === currentUser.id || (!c.owner_id && !c.isNPC);
  });
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
  return total;
}

function customSkillTotal(cs, c){ return getEffectiveAttr(cs.attr, c) + num(cs.bonus,0); }

var audioCtx = null;
function getAudioCtx(){
  if(!audioCtx){ try{ audioCtx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} }
  if(audioCtx && audioCtx.state==='suspended') audioCtx.resume();
  return audioCtx;
}
function playDiceAudio(type){
  var ctx = getAudioCtx(); if(!ctx) return;
  var now = ctx.currentTime;
  if(type==="roll"){
    for(var i=0;i<6;i++){
      var t = now + i*0.05;
      var osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = "triangle"; osc.frequency.setValueAtTime(240+Math.random()*300, t);
      gain.gain.setValueAtTime(0.001, t); gain.gain.exponentialRampToValueAtTime(0.15, t+0.01); gain.gain.exponentialRampToValueAtTime(0.001, t+0.04);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(t); osc.stop(t+0.05);
    }
  }else if(type==="crit"){
    [523.25, 659.25, 783.99, 1046.50].forEach(function(f, idx){
      var osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = "triangle"; osc.frequency.setValueAtTime(f, now + idx*0.04);
      gain.gain.setValueAtTime(0.001, now + idx*0.04); gain.gain.exponentialRampToValueAtTime(0.2, now + idx*0.04 + 0.02); gain.gain.exponentialRampToValueAtTime(0.0001, now + idx*0.04 + 0.4);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now + idx*0.04); osc.stop(now + idx*0.04 + 0.45);
    });
  }else if(type==="fumble"){
    [311.13, 277.18, 220].forEach(function(f, idx){
      var osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = "sawtooth"; osc.frequency.setValueAtTime(f, now + idx*0.06);
      gain.gain.setValueAtTime(0.001, now + idx*0.06); gain.gain.exponentialRampToValueAtTime(0.15, now + idx*0.06 + 0.02); gain.gain.exponentialRampToValueAtTime(0.0001, now + idx*0.06 + 0.3);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now + idx*0.06); osc.stop(now + idx*0.06 + 0.35);
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

function openRollModal(label, scoreText, detailHtml, sides, isCrit, isFumble, advCardsHtml){
  document.getElementById("rollLabel").textContent = label;
  document.getElementById("rollDieGraphic").innerHTML = getDieSvg(sides);
  document.getElementById("rollAdvVisual").innerHTML = advCardsHtml || "";
  var scoreEl = document.getElementById("rollScore");
  scoreEl.textContent = scoreText;
  scoreEl.className = "roll-score" + (isCrit?" crit":isFumble?" fumble":"");
  document.getElementById("rollVerdict").textContent = isCrit ? "¡Éxito Crítico!" : (isFumble ? "¡Pifia Crítica!" : "");
  document.getElementById("rollVerdict").style.color = isCrit ? "var(--gold-light)" : (isFumble ? "var(--danger)" : "transparent");
  document.getElementById("rollDetail").innerHTML = detailHtml;
  document.getElementById("rollOverlay").classList.remove("hidden");
  playDiceAudio("roll");
  if(isCrit) setTimeout(function(){ playDiceAudio("crit"); }, 400);
  else if(isFumble) setTimeout(function(){ playDiceAudio("fumble"); }, 400);
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
  var d = rollDie(10);
  var total = d + num(mod,0) + extra;
  var formula = "1d10 (" + d + ") + Mod (" + (num(mod,0)+extra) + ")";
  state.rollLog.unshift({id:uid(), charName:charName, label:label, total:total, formulaText:formula, ts:Date.now()});
  if(state.rollLog.length>20) state.rollLog.length=20;
  saveState();
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
  var detail = qty + "d" + sides + " [" + rolls.join(", ") + "]" + (mod ? (mod>0?" + "+mod:" - "+Math.abs(mod)) : "");
  openRollModal("Daño — "+weaponName, total, detail, sides, rolls.every(function(x){return x===sides;}), rolls.every(function(x){return x===1;}));
}

function renderTopbar(){
  var c = activeChar();
  document.body.setAttribute("data-theme", c.theme||"default");
  var maxHp = Math.max(1, num(c.combat.pvMax, 1));
  var maxMana = Math.max(1, num(c.combat.manaMax, 1));
  var hpPct = clamp(Math.round((num(c.combat.pvActual,0)/maxHp)*100), 0, 100);
  var manaPct = clamp(Math.round((num(c.combat.manaActual,0)/maxMana)*100), 0, 100);
  var crestStyle = c.portrait ? ' style="background-image:url(\''+c.portrait+'\')"' : '';
  var isNPC = !!c.isNPC;
  var crestClass = isNPC ? 'char-crest npc' : 'char-crest';
  var nameClass = isNPC ? 'char-name npc-name' : 'char-name';

  document.getElementById("topbar").innerHTML =
    '<div class="topbar-row">'+
      '<button class="char-switch" data-action="open-char-modal" aria-label="Cambiar personaje">'+
        '<span class="'+crestClass+'"'+crestStyle+'>'+(c.portrait?'':esc(c.name.charAt(0).toUpperCase()))+'</span>'+
        '<span class="char-info-box">'+
          '<div class="'+nameClass+'">'+esc(c.name)+'<span class="version-tag">v3.11</span></div>'+
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
        '<div class="gauge-label"><span>Vida</span><span class="gauge-nums">'+num(c.combat.pvActual,0)+' / '+maxHp+'</span></div>'+
        '<div class="gauge"><div class="gauge-fill hp" style="width:'+hpPct+'%;"></div></div>'+
        '<div class="gauge-adjust">'+
          '<button data-action="hp-mod" data-delta="-5" aria-label="Restar 5 vida">-5</button><button data-action="hp-mod" data-delta="-1" aria-label="Restar 1 vida">-1</button>'+
          '<button data-action="hp-mod" data-delta="1" aria-label="Sumar 1 vida">+1</button><button data-action="hp-mod" data-delta="5" aria-label="Sumar 5 vida">+5</button>'+
        '</div>'+
      '</div>'+
      '<div class="gauge-wrap">'+
        '<div class="gauge-label"><span style="color:var(--shield-light);">🛡️ Escudo</span><span class="gauge-nums">'+num(c.combat.escudoActual,0)+'</span></div>'+
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
  {id:"ficha",label:"Ficha"}, {id:"habilidades",label:"Habilidades"}, {id:"combate",label:"Combate"},
  {id:"inventario",label:"Inventario"}, {id:"magia",label:"Magia"}, {id:"alquimia",label:"Alquimia"},
  {id:"invocaciones",label:"Invocaciones"}, {id:"bestiario",label:"Bestiario"}, {id:"mundo",label:"Mundo"}
];

var GM_TABS = [
  {id:"ficha",label:"Ficha"}, {id:"habilidades",label:"Habilidades"}, {id:"combate",label:"Combate"},
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
          '<button class="btn-compact" data-action="upload-portrait">Foto</button>'+
          (c.portrait ? '<button class="btn-compact" data-action="remove-portrait">✕</button>' : '')+
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
      '<button class="btn-solid-gold" data-action="toggle-skill-lock">'+(unlocked?'🔒 Bloquear Asignación (GM)':'🔓 Permitir Asignación (GM)')+'</button>'+
    '</div>';
  }
  
  if(c.isNPC && isGM()){
    banner = '<div class="skill-pool-banner">'+
      '<span>NPC - Puntos disponibles: <b>'+num(c.skillPoints,0)+'</b>. Habilidades editables.</span>'+
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
      var bonusVal = num(c.skillBonus[cs.id],0);
      if(!c.skillProgress) c.skillProgress = {};
      var prog = num(c.skillProgress[cs.id],0);
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
      
      html += '<div class="skill-row"><span>'+esc(cs.name)+' <small style="color:var(--ink-faint);">('+ATTR_LABELS[cs.attr].slice(0,3)+')</small></span>'+
        '<span class="skill-base">'+getEffectiveAttr(cs.attr,c)+'</span>'+
        '<span class="skill-bonus-ctrl">'+
          '<button data-action="skill-sub-custom" data-id="'+cs.id+'" '+(canSub?'':'disabled')+' aria-label="Restar progreso">-</button>'+
          '<span>'+bonusVal+' ('+prog+'/'+costNeeded+')</span>'+
          '<button data-action="skill-add-custom" data-id="'+cs.id+'" '+(canAdd?'':'disabled')+' aria-label="Añadir progreso">+</button>'+
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

  return '<div class="skill-row">'+
    '<span class="skill-name">'+esc(s.name)+hybridSel+'</span>'+
    '<span class="skill-base">'+base+'</span>'+
    '<span class="skill-bonus-ctrl">'+
      '<button data-action="skill-sub" data-id="'+s.id+'" '+(canSub?'':'disabled')+' aria-label="Restar progreso a '+esc(s.name)+'">-</button>'+
      '<span>'+bonusVal+' ('+prog+'/'+costNeeded+')</span>'+
      '<button data-action="skill-add" data-id="'+s.id+'" '+(canAdd?'':'disabled')+' aria-label="Añadir progreso a '+esc(s.name)+'">+</button>'+
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

  var html = '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Buffs y Debuffs</span></div>'+buffsHtml;

  if(c.customBuffs && c.customBuffs.length){
    c.customBuffs.forEach(function(cbuff){
      html += '<div class="list-row text-row">'+
        '<input type="text" placeholder="Efecto de estado" data-bind="customBuffs.'+cbuff.id+'.name" value="'+esc(cbuff.name)+'">'+
        '<button class="row-del" data-action="del-custom-buff" data-id="'+cbuff.id+'" aria-label="Eliminar buff">✕</button>'+
      '</div>';
    });
  }
  if(isGM()){
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
    '</div>'+
  '</div>';

  html += '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Armas del Personaje</span></div>';
  var catalog = (state.weaponsCatalog||[]).filter(function(w){ return isGM() || w.visible !== false; });
  (c.weapons||[]).forEach(function(w){
    var selectedCatItem = catalog.find(function(catItem){ return catItem.name === w.name || catItem.id === w.catalogId; });
    var infoText = selectedCatItem ? ('Daño: ' + selectedCatItem.dano + ' | Alcance: ' + selectedCatItem.alcance) : 'Selecciona un arma del compendio';

    html += '<div class="list-row weapons-row" style="grid-template-columns:1fr 36px 36px;">'+
      '<select data-action="select-weapon-catalog" data-id="'+w.id+'" aria-label="Seleccionar arma">'+
        '<option value="">-- Seleccionar Arma del Compendio --</option>'+
        catalog.map(function(catItem){
          return '<option value="'+catItem.id+'" '+(selectedCatItem && selectedCatItem.id===catItem.id?'selected':'')+'>'+esc(catItem.name)+' ('+esc(catItem.dano)+')</option>';
        }).join('')+
      '</select>'+
      '<button class="dice-btn" data-action="roll-weapon" data-id="'+w.id+'" title="Tirar Daño" aria-label="Tirar daño">&#127922;</button>'+
      '<button class="row-del" data-action="del-weapon" data-id="'+w.id+'" aria-label="Eliminar arma">✕</button>'+
    '</div>'+
    '<div style="font-size:0.7rem;color:var(--gold-light);margin-bottom:6px;padding-left:2px;">'+infoText+(selectedCatItem && selectedCatItem.critico?' | <b>Crítico:</b> '+esc(selectedCatItem.critico):'')+'</div>';
  });
  if(isGM()){
    html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-weapon">+ Añadir arma al equipo</button>';
  }
  html += '</div>';

  html += '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Armaduras</span></div>';
  (c.armors||[]).forEach(function(a){
    html += '<div class="list-row armor-row">'+
      '<input type="text" placeholder="Armadura" data-bind="armors.'+a.id+'.name" value="'+esc(a.name)+'" aria-label="Nombre de armadura">'+
      '<input type="text" placeholder="Absorción" data-bind="armors.'+a.id+'.absorcion" value="'+esc(a.absorcion)+'" aria-label="Absorción">'+
      '<input type="text" placeholder="Estorbo" data-bind="armors.'+a.id+'.estorbo" value="'+esc(a.estorbo)+'" aria-label="Estorbo">'+
      '<button class="row-del" data-action="del-armor" data-id="'+a.id+'" aria-label="Eliminar armadura">✕</button>'+
    '</div>';
  });
  if(isGM()){
    html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-armor">+ Añadir armadura</button>';
  }
  html += '</div>';

  html += rollLogHtml();
  return html;
}

function combatStat(label,bind,val,rollable){
  return '<div class="combat-stat"><label>'+esc(label)+'</label>'+
    '<input type="number" data-bind="combat.'+bind+'" value="'+num(val,0)+'" aria-label="'+esc(label)+'">'+
    (rollable?'<button class="mini-roll" data-action="roll-init" aria-label="Tirar iniciativa">&#127922;</button>':'')+
  '</div>';
}

function tplMagia(c){
  var html = '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Grimorio y Artes Mágicas</span></div>'+
    '<div class="field" style="margin-bottom:10px;"><label>Tipo de Magia</label><input type="text" data-bind="magiaTipo" value="'+esc(c.magiaTipo)+'"></div>'+
    '<div style="display:grid;grid-template-columns:1fr 75px 85px 28px;gap:6px;font-size:0.62rem;color:var(--ink-faint);text-transform:uppercase;margin-bottom:4px;padding-bottom:2px;border-bottom:1px solid var(--line);">'+
      '<span>Hechizo / Habilidad</span><span>Coste (Maná)</span><span>Rango</span><span></span>'+
    '</div>';
  (c.spells||[]).forEach(function(s){
    html += '<div class="list-row spell-row">'+
      '<input type="text" placeholder="Nombre" data-bind="spells.'+s.id+'.name" value="'+esc(s.name)+'">'+
      '<input type="text" placeholder="Coste" data-bind="spells.'+s.id+'.coste" value="'+esc(s.coste)+'">'+
      '<input type="text" placeholder="Rango" data-bind="spells.'+s.id+'.rango" value="'+esc(s.rango)+'">'+
      '<button class="row-del" data-action="del-spell" data-id="'+s.id+'" aria-label="Eliminar hechizo">✕</button>'+
    '</div>';
  });
  if(isGM()){
    html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-spell">+ Añadir hechizo</button>';
  }
  html += '</div>';

  html += '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Piedras Mágicas</span></div>';
  (c.stones||[]).forEach(function(s){
    html += '<div class="list-row stone-row">'+
      '<input type="text" placeholder="Color" data-bind="stones.'+s.id+'.color" value="'+esc(s.color)+'">'+
      '<input type="text" placeholder="Efecto" data-bind="stones.'+s.id+'.efecto" value="'+esc(s.efecto)+'">'+
      '<button class="row-del" data-action="del-stone" data-id="'+s.id+'" aria-label="Eliminar piedra">✕</button>'+
    '</div>';
  });
  if(isGM()){
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
          '<button class="row-del" data-action="del-poison" data-id="'+p.id+'" aria-label="Eliminar veneno">✕</button>'+
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
  if(isGM()){
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
      '<button class="row-del" data-action="del-inventory" data-id="'+it.id+'" aria-label="Eliminar objeto">✕</button>'+
    '</div>';
  });
  if(isGM()){
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
        '<button class="row-del" data-action="del-summon" data-id="' + s.id + '" aria-label="Eliminar invocación">✕</button>' +
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
  if(isGM()){
    html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-summon">+ Añadir invocación</button>';
  }
  html += '</div>';
  return html;
}
function creatureField(label,bind,val){
  return '<div class="creature-field"><label>'+esc(label)+'</label><input type="text" data-bind="'+bind+'" value="'+esc(val)+'"></div>';
}

function tplBestiario(s){
  var pills = CONTINENTES.map(function(ct){
    return '<button class="f-pill '+(bestiaryContinentFilter===ct?'active':'')+'" data-action="set-bestiary-continent" data-continent="'+ct+'">'+ct+'</button>';
  }).join('');

  var visibleBestiary = (s.bestiary||[]).filter(function(b){
    if(isGM()) return bestiaryContinentFilter==="Todos" || (b.continente||"Todos")===bestiaryContinentFilter;
    return b.visible !== false && (bestiaryContinentFilter==="Todos" || (b.continente||"Todos")===bestiaryContinentFilter);
  });

  var html = '<div class="section'+(isGM()?' gm-section':'')+'">'+
    '<div class="section-title"><span>'+(isGM()?'Bestiario y Monturas (GM)':'Bestiario y Monturas')+'</span></div>'+
    '<div class="filter-section"><div class="filter-label">Continente</div><div class="filter-pills">'+pills+'</div></div>';

  visibleBestiary.forEach(function(b){
    var canEdit = isGM();
    html += '<div class="creature-card">'+
      '<div class="creature-card-header">'+
        (canEdit ? '<input type="text" class="creature-name-input" data-scope="global" placeholder="Nombre" data-bind="bestiary.'+b.id+'.nombre" value="'+esc(b.nombre)+'">' : '<div style="font-family:var(--font-display);color:var(--gold-light);font-size:1.02rem;">'+esc(b.nombre)+'</div>')+
        '<div style="display:flex;gap:4px;align-items:center;">'+
          (canEdit ? '<select style="font-size:.72rem;background:var(--bg-card);padding:2px 4px;" data-scope="global" data-bind="bestiary.'+b.id+'.continente">'+
            CONTINENTES.map(function(ct){return '<option value="'+ct+'" '+((b.continente||"Todos")===ct?'selected':'')+'>'+ct+'</option>';}).join('')+
          '</select>' : '<span style="font-size:.7rem;color:var(--ink-dim);">'+esc(b.continente||"Todos")+'</span>')+
          (canEdit ? '<button class="btn-compact" data-action="toggle-bestiary-visibility" data-id="'+b.id+'" title="Mostrar/Ocultar para jugadores">'+(b.visible!==false?'👁️':'🙈')+'</button>' : '')+
          (canEdit ? '<button class="row-del" data-action="del-bestiary" data-id="'+b.id+'" aria-label="Eliminar criatura">✕</button>' : '')+
        '</div>'+
      '</div>'+
      '<div class="creature-grid">'+
        (canEdit ? creatureFieldGlobal("Vida","bestiary."+b.id+".vida",b.vida) : '<div class="creature-field"><label>Vida</label><span style="font-size:.8rem;color:var(--ink-dim);">'+esc(b.vida||"-")+'</span></div>')+
        (canEdit ? creatureFieldGlobal("Defensa","bestiary."+b.id+".defensa",b.defensa) : '<div class="creature-field"><label>Defensa</label><span style="font-size:.8rem;color:var(--ink-dim);">'+esc(b.defensa||"-")+'</span></div>')+
        (canEdit ? creatureFieldGlobal("Absorción","bestiary."+b.id+".absorcion",b.absorcion) : '<div class="creature-field"><label>Absorción</label><span style="font-size:.8rem;color:var(--ink-dim);">'+esc(b.absorcion||"-")+'</span></div>')+
        (canEdit ? creatureFieldGlobal("Daño","bestiary."+b.id+".dano",b.dano) : '<div class="creature-field"><label>Daño</label><span style="font-size:.8rem;color:var(--ink-dim);">'+esc(b.dano||"-")+'</span></div>')+
        (canEdit ? creatureFieldGlobal("Movilidad","bestiary."+b.id+".movilidad",b.movilidad) : '<div class="creature-field"><label>Movilidad</label><span style="font-size:.8rem;color:var(--ink-dim);">'+esc(b.movilidad||"-")+'</span></div>')+
      '</div>'+
      '<div class="creature-field" style="margin-top:6px;"><label>Habilidades y Rasgos</label>'+
      (canEdit ? '<textarea class="creature-notes" data-scope="global" data-bind="bestiary.'+b.id+'.habilidades">'+esc(b.habilidades||b.notas)+'</textarea>' : (b.habilidades||b.notas?'<p style="font-size:.78rem;color:var(--ink-dim);margin-top:4px;">'+esc(b.habilidades||b.notas)+'</p>':''))+
      '</div>'+
    '</div>';
  });
  
  if(isGM()){
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

  var canEdit = isGM();
  var html = '<div class="section'+(canEdit?' gm-section':'')+'"><div class="section-title">'+
    '<span>'+(canEdit?'Cartografía y Mapas (GM)':'Cartografía y Mapas')+'</span>'+
    (canEdit?'<div style="display:flex;gap:6px;">'+
      '<button class="btn-compact" data-action="sync-map-now" title="Forzar descarga">🔄 Sincronizar Mapa</button>'+
      '<button class="btn-compact" data-action="add-new-map">+ Nuevo Mapa</button>'+
    '</div>':'')+
  '</div>'+
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
    html += '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">'+
      '<button class="btn-compact" data-action="upload-map">Subir / Cambiar Imagen</button>'+
      (curMap.image?'<button class="btn-compact" data-action="remove-map">Quitar Imagen</button>':'')+
      (s.maps.length>1?'<button class="btn-compact" style="margin-left:auto;color:var(--danger);" data-action="delete-map">Borrar Mapa</button>':'')+
    '</div>';
  }
  html += '</div>';
  return html;
}

function tplMundoArmas(s){
  var catalog = (s.weaponsCatalog||[]).filter(function(w){ return isGM() || w.visible !== false; });
  var canEdit = isGM();
  var html = '<div class="section'+(canEdit?' gm-section':'')+'"><div class="section-title"><span>'+(canEdit?'Catálogo de Armas (GM)':'Catálogo de Armas')+'</span></div>';
  
  catalog.forEach(function(w){
    html += '<div class="creature-card">'+
      '<div class="creature-card-header">'+
        (canEdit ? '<input type="text" class="creature-name-input" data-scope="global" data-bind="weaponsCatalog.'+w.id+'.name" value="'+esc(w.name)+'" placeholder="Nombre del arma">' : '<div style="font-family:var(--font-display);color:var(--gold-light);font-size:1.02rem;">'+esc(w.name)+'</div>')+
        (canEdit ? '<div style="display:flex;gap:4px;align-items:center;">'+
          '<button class="btn-compact" data-action="toggle-weapon-visibility" data-id="'+w.id+'" title="Mostrar/Ocultar para jugadores">'+(w.visible!==false?'👁️':'🙈')+'</button>'+
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
    saveState(true); pushSharedData(); closeModals(); renderTab();
    showToast("Marcador guardado", "success");
    return;
  }
  if(action==="del-pin" && curM){
    curM.markers = (curM.markers||[]).filter(function(p){return p.id!==btn.getAttribute("data-id");});
    saveState(true); pushSharedData(); closeModals(); renderTab();
    showToast("Marcador eliminado", "info");
    return;
  }
}

function openCharModal(){
  var chars = getUserCharacters();
  var html = '<h2>Selección de Personaje<button data-action="close-modal" aria-label="Cerrar">&times;</button></h2>';
  chars.forEach(function(c){
    var swatches = THEME_LIST.map(function(t){
      return '<button class="swatch swatch-'+t.id+((c.theme||"default")===t.id?' active':'')+'" data-action="set-theme" data-id="'+c.id+'" data-theme="'+t.id+'" aria-label="Tema '+t.label+'"></button>';
    }).join('');
    var crestStyle = c.portrait ? ' style="background-image:url(\''+c.portrait+'\')"' : '';
    var isNPC = !!c.isNPC;

    html += '<div class="char-list-item'+(c.id===state.activeId?' active':'')+(isNPC?' npc-item':'')+'" data-action="pick-char" data-id="'+c.id+'" role="button" tabindex="0">'+
      '<div class="char-list-avatar'+(isNPC?' npc-avatar':'')+'"'+crestStyle+'>'+(c.portrait?'':esc(c.name.charAt(0).toUpperCase()))+'</div>'+
      '<div class="cli-info">'+
        '<div class="cli-name'+(isNPC?' npc-name':'')+'">'+esc(c.name)+'</div>'+
        '<div class="cli-sub">'+(isNPC?'NPC · ':'Nv. '+esc(c.nivel||"1")+' · ')+esc(c.trabajo||"Aventurero")+'</div>'+
        '<div class="theme-swatches" onclick="event.stopPropagation()">'+swatches+'</div>'+
      '</div>'+
      (isGM()?'<button class="row-del" data-action="del-char" data-id="'+c.id+'" onclick="event.stopPropagation()" aria-label="Eliminar personaje">✕</button>':'')+
    '</div>';
  });
  if(isGM()){
    html += '<button class="btn-compact" style="width:100%;margin-top:10px;padding:8px;" data-action="add-char">+ Crear Nuevo Personaje</button>'+
            '<button class="btn-gm" style="width:100%;margin-top:8px;padding:8px;" data-action="add-npc">+ Crear Nuevo NPC</button>';
  }
  document.getElementById("charModal").innerHTML = html;
  document.getElementById("charModalOverlay").classList.remove("hidden");
}

function openDataModal(){
  var html = '<h2>Ajustes y Sesión<button data-action="close-modal" aria-label="Cerrar">&times;</button></h2>';
  if(currentUser){
    html += '<div style="font-size:0.85rem;color:var(--ink-dim);margin-bottom:12px;">Sesión activa: <b>'+esc(currentUser.email)+'</b> ('+currentRole.toUpperCase()+')</div>'+
      '<button class="btn-solid-gold" style="width:100%;" data-action="auth-logout">Cerrar Sesión</button>';
  } else {
    html += '<div class="field"><label>Correo Electrónico</label><input type="email" id="authEmail" placeholder="usuario@gmail.com"></div>'+
      '<div class="field" style="margin-top:8px;"><label>Contraseña</label><input type="password" id="authPass"></div>'+
      '<div style="display:flex;gap:6px;margin-top:12px;">'+
        '<button class="btn-solid-gold" style="flex:1;" data-action="auth-login">Entrar</button>'+
        '<button class="btn-compact" style="flex:1;" data-action="auth-signup">Registrarse</button>'+
      '</div>';
  }
  html += '<div style="margin-top:16px;border-top:1px solid var(--line);padding-top:12px;">'+
    '<div style="display:flex;gap:6px;">'+
      '<button class="btn-compact" style="flex:1;" data-action="export-data">Exportar Backup</button>'+
      '<button class="btn-compact" style="flex:1;" data-action="import-data">Importar Backup</button>'+
    '</div>'+
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
    '<h2>Lanzador de Dados<button data-action="close-modal" aria-label="Cerrar">&times;</button></h2>'+
    '<div class="field"><label>Modalidad de Tirada</label><select id="diceMode">'+
      '<option value="normal" '+(diceConfig.mode==='normal'?'selected':'')+'>Tirada Estándar</option>'+
      '<option value="adv" '+(diceConfig.mode==='adv'?'selected':'')+'>Ventaja (2 dados, mayor)</option>'+
      '<option value="disadv" '+(diceConfig.mode==='disadv'?'selected':'')+'>Desventaja (2 dados, menor)</option>'+
    '</select></div>'+
    '<div class="dtype-grid">'+diceCards+'</div>'+
    (diceConfig.sides===100?'':'<div class="field" style="margin-top:6px;"><label>Número de dados</label><input type="number" min="1" id="diceQty" value="'+diceConfig.qty+'"></div>')+
    '<div class="field" style="margin-top:6px;"><label>Modificador (+ / -)</label><input type="number" id="diceMod" value="'+diceConfig.mod+'"></div>'+
    '<button class="btn-solid-gold" style="width:100%;margin-top:12px;padding:8px;" data-action="roll-dice-btn">Lanzar Dados</button>';
  document.getElementById("diceModalOverlay").classList.remove("hidden");
}

function diceModalClick(e){
  var btn = e.target.closest("[data-action]"); if(!btn) return;
  var action = btn.getAttribute("data-action");
  if(action==="close-modal"){ closeModals(); return; }
  if(action==="pick-die"){ diceConfig.sides = parseInt(btn.getAttribute("data-sides"),10); openDiceModal(); return; }
  if(action==="roll-dice-btn"){
    diceConfig.mod = parseInt(document.getElementById("diceMod").value,10)||0;
    diceConfig.mode = document.getElementById("diceMode").value;
    document.getElementById("diceModalOverlay").classList.add("hidden");

    if(diceConfig.sides===100){
      var dTens = (rollDie(10)-1)*10, dUnits = rollDie(10)-1;
      var pct = dTens + dUnits === 0 ? 100 : dTens + dUnits;
      var tot = pct + diceConfig.mod;
      openRollModal("d% Percentil", tot, "Decenas: " + dTens + " | Unidades: " + dUnits, 100, pct===100, pct===1);
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
      openRollModal(lblAdv, totalAdv, "Modificador: " + (diceConfig.mod>=0?"+"+diceConfig.mod:diceConfig.mod), diceConfig.sides, chosen===diceConfig.sides, chosen===1, advHtml);
      return;
    }

    diceConfig.qty = Math.max(1, parseInt((document.getElementById("diceQty")||{}).value,10)||1);
    var rolls=[], sum=0;
    for(var i=0;i<diceConfig.qty;i++){ var r=rollDie(diceConfig.sides); rolls.push(r); sum+=r; }
    var grandTotal = sum + diceConfig.mod;
    openRollModal(diceConfig.qty+"d"+diceConfig.sides, grandTotal, "Dados: [" + rolls.join(", ") + "]" + (diceConfig.mod ? (diceConfig.mod>0?" + "+diceConfig.mod:" - "+Math.abs(diceConfig.mod)) : ""), diceConfig.sides, rolls.every(function(x){return x===diceConfig.sides;}), rolls.every(function(x){return x===1;}));
    return;
  }
}

function modalClick(e){
  var btn = e.target.closest("[data-action]"); if(!btn) return;
  var action = btn.getAttribute("data-action");
  if(action==="close-modal"){ closeModals(); return; }
  if(action==="pick-char"){ state.activeId = btn.getAttribute("data-id"); saveState(); closeModals(); renderTopbar(); renderTab(); return; }
  if(action==="add-char"){
    if(!isGM()) return;
    var nName = prompt("Nombre del nuevo personaje:");
    if(nName){
      var nc = blankCharacter(nName);
      state.characters.push(nc); state.activeId = nc.id;
      saveState(); closeModals(); renderTopbar(); renderTab();
      showToast("Personaje creado: " + nName, "success");
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
    if(!isGM()) return;
    if(confirm("¿Eliminar este personaje?")){
      state.characters = state.characters.filter(function(x){return x.id!==btn.getAttribute("data-id");});
      state.activeId = state.characters[0]?state.characters[0].id:"";
      saveState(); closeModals(); renderTopbar(); renderTab();
      showToast("Personaje eliminado", "info");
    }
    return;
  }
  if(action==="set-theme"){
    var thC = state.characters.find(function(x){return x.id===btn.getAttribute("data-id");});
    if(thC){ thC.theme = btn.getAttribute("data-theme"); saveState(); renderTopbar(); renderTab(); }
    return;
  }
  if(action==="auth-login"){ supabaseLogin(document.getElementById("authEmail").value.trim(), document.getElementById("authPass").value); return; }
  if(action==="auth-signup"){ supabaseSignup(document.getElementById("authEmail").value.trim(), document.getElementById("authPass").value); return; }
  if(action==="auth-logout"){ supabaseLogout(); return; }
  if(action==="export-data"){ exportData(); return; }
  if(action==="import-data"){ document.getElementById("importFileInput").click(); return; }
}

function closeModals(){
  ["charModalOverlay","diceModalOverlay","dataModalOverlay","pinModalOverlay","loreModalOverlay"].forEach(function(id){
    document.getElementById(id).classList.add("hidden");
  });
}

function exportData(){
  var blob = new Blob([JSON.stringify(state,null,2)], {type:"application/json"});
  var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "krysalis-backup.json"; a.click();
  showToast("Backup exportado", "success");
}
function importData(file){
  var r = new FileReader();
  r.onload = function(){
    try{
      state = migrateState(JSON.parse(r.result));
      state.activeId = state.characters[0]?state.characters[0].id:"";
      saveState(); closeModals(); renderTopbar(); renderTabbar(); renderTab();
      showToast("Backup importado correctamente", "success");
    }catch(e){ showToast("Archivo no válido.", "error"); }
  };
  r.readAsText(file);
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
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
    
    if(!realtimeChannel){
      realtimeChannel = supabaseClient.channel('realtime_all_changes')
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
                saveState(true);
                renderTab();
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

    supabaseClient.auth.getSession().then(function(res){
      if(res.data && res.data.session){ currentUser = res.data.session.user; fetchUserProfile(); }
    }).catch(function(e){ console.error('Supabase error:', e); });

    supabaseClient.auth.onAuthStateChange(function(e, session){
      currentUser = session ? session.user : null;
      if(currentUser){ fetchUserProfile(); } else { currentRole='player'; updateSyncBadge("local"); renderTopbar(); renderTab(); }
    });
  }catch(e){ console.error('Supabase error:', e); }
}

function handleRemoteCharacterChange(payload){
  if(!payload || !payload.eventType) return;
  if(payload.eventType === 'DELETE'){
    var delId = payload.old ? payload.old.id : null;
    if(delId){
      state.characters = (state.characters||[]).filter(function(x){ return x.db_id !== delId && x.id !== delId; });
      if(!state.characters.length) state.characters.push(blankCharacter("Sin Personaje"));
      if(!state.characters.some(function(x){return x.id===state.activeId;})){
        state.activeId = state.characters[0].id;
      }
      saveState(true); renderTopbar(); renderTabbar(); renderTab();
    }
  } else {
    var row = payload.new;
    if(row && row.data){
      var c = row.data;
      c.db_id = row.id;
      if(row.owner_id) c.owner_id = row.owner_id;
      var idx = state.characters.findIndex(function(x){ return x.db_id === row.id || x.id === c.id; });
      if(idx !== -1){
        state.characters[idx] = c;
      } else {
        state.characters.push(c);
      }
      if(!state.activeId) state.activeId = c.id;
      saveState(true); renderTopbar(); renderTabbar(); renderTab();
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
  saveState(true);
  renderTab();
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
  var res = await supabaseClient.auth.signInWithPassword({email:em, password:pw});
  if(res.error) showToast(res.error.message, "error"); else closeModals();
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
  if(!supabaseClient || !currentUser) return;
  isRemoteSyncing = true;
  try{
    var charRes = await supabaseClient.from('characters').select('*');
    if(charRes.data && charRes.data.length){
      state.characters = charRes.data.map(function(r){ 
        var c = r.data; 
        c.db_id = r.id;
        if(r.owner_id) c.owner_id = r.owner_id;
        return c; 
      });
      if(!state.activeId && state.characters.length) state.activeId = state.characters[0].id;
      updateSyncBadge("synced");
    }
    saveState(true); renderTopbar(); renderTabbar(); renderTab();
  }catch(e){ console.error('Supabase error:', e); }
  isRemoteSyncing = false;
}
function pushActiveChar(){
  if(!supabaseClient || !currentUser) return;
  var c = activeChar(); if(!c || !c.name || c.id==="empty") return;
  var payload = {name:c.name, data:c, updated_at:new Date().toISOString()};
  if(c.owner_id) payload.owner_id = c.owner_id;
  if(c.db_id) payload.id = c.db_id;
  supabaseClient.from('characters').upsert(payload).select().then(function(res){
    if(res.error) { console.error('Supabase error:', res.error); return; }
    if(res.data && res.data[0]) c.db_id = res.data[0].id;
    updateSyncBadge("synced");
  }).catch(function(e){ console.error('Supabase error:', e); });
}
function pushCharacterById(charId){
  if(!supabaseClient || !currentUser) return;
  var c = state.characters.find(function(x){ return x.id === charId; });
  if(!c) return;
  var payload = {name:c.name, data:c, updated_at:new Date().toISOString()};
  if(c.owner_id) payload.owner_id = c.owner_id;
  if(c.db_id) payload.id = c.db_id;
  supabaseClient.from('characters').upsert(payload).select().then(function(res){
    if(res.error) { console.error('Supabase error:', res.error); return; }
    if(res.data && res.data[0]) c.db_id = res.data[0].id;
    updateSyncBadge("synced");
  }).catch(function(e){ console.error('Supabase error:', e); });
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
      saveState(true);
      renderTab();
    }
  }catch(e){ console.error('Supabase error:', e); }
}

function pushSharedData(){
  if(!supabaseClient) return;
  supabaseClient.from('campaign_map').upsert({
    id: 'world_compendium',
    data: {
      weaponsCatalog: state.weaponsCatalog || [],
      bestiary: state.bestiary || [],
      lore: state.lore || getSeedLore(),
      buffCatalog: state.buffCatalog || getSeedBuffCatalog()
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
  var listFields = ["weapons","armors","inventory","spells","stones","passivesNeg","passivesPos","goddessCurses","goddessBlessings","goddessTable","customBuffs","summons","bestiary","poisons","activeBuffs"];
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
  var target = isGlobal ? state : activeChar();
  setBind(target, el.getAttribute("data-bind"), el.value, el.type);
  saveState(true);
  if(isGlobal){
    pushSharedData();
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

  if(action==="switch-tab"){ state.activeTab = btn.getAttribute("data-tab"); saveState(); renderTabbar(); renderTab(); return; }
  if(action==="hp-mod"){
    var d1 = parseInt(btn.getAttribute("data-delta"),10);
    c.combat.pvActual = clamp(num(c.combat.pvActual,0)+d1, 0, num(c.combat.pvMax,0)||999);
    saveState(); renderTopbar(); return;
  }
  if(action==="shield-mod"){
    var ds = parseInt(btn.getAttribute("data-delta"),10);
    c.combat.escudoActual = Math.max(0, num(c.combat.escudoActual,0)+ds);
    saveState(); renderTopbar(); return;
  }
  if(action==="mana-mod"){
    var d2 = parseInt(btn.getAttribute("data-delta"),10);
    c.combat.manaActual = clamp(num(c.combat.manaActual,0)+d2, 0, num(c.combat.manaMax,0)||999);
    saveState(); renderTopbar(); return;
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
      c.activeBuffs.splice(idx, 1);
    } else {
      var buffToAdd = (state.buffCatalog||[]).find(function(b){ return b.id === bid; });
      if(buffToAdd){
        c.activeBuffs.push({id: buffToAdd.id, name: buffToAdd.name, type: buffToAdd.type, bonus: buffToAdd.bonus, attr: buffToAdd.attr});
      }
    }
    saveState();
    renderTab();
    return;
  }
  if(action==="remove-active-buff"){
    var buffId = btn.getAttribute("data-id");
    if(c.activeBuffs){
      c.activeBuffs = c.activeBuffs.filter(function(ab){ return ab.id !== buffId; });
      saveState();
      renderTab();
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
    if(!isGM()) return;
    var nm = prompt("Nombre de la habilidad:");
    if(!nm) return;
    var attrChoice = prompt("Atributo base (fisico / destreza / inteligencia / percepcion / carisma):","destreza");
    if(ATTRS.indexOf(attrChoice)===-1) attrChoice="destreza";
    if(!c.customSkills) c.customSkills=[];
    c.customSkills.push({id:uid(),name:nm,attr:attrChoice,bonus:1});
    saveState(); renderTab();
    showToast("Habilidad personalizada añadida", "success");
    return;
  }
  if(action==="add-custom-buff"){
    if(!isGM()) return;
    if(!c.customBuffs) c.customBuffs=[];
    c.customBuffs.push({id:uid(),name:""});
    saveState(); renderTab(); return;
  }
  if(action==="del-custom-buff"){
    if(!isGM()) return;
    c.customBuffs = (c.customBuffs||[]).filter(function(b){return b.id!==btn.getAttribute("data-id");});
    saveState(); renderTab(); return;
  }
  if(action==="roll-init"){ performD10Roll(c.name, "Iniciativa", c.combat.iniciativa); return; }
  if(action==="roll-weapon"){
    var wid = btn.getAttribute("data-id");
    var wpn = (c.weapons||[]).find(function(w){return w.id===wid;});
    if(wpn){
      var catItem = (state.weaponsCatalog||[]).find(function(ci){ return ci.name === wpn.name || ci.id === wpn.catalogId; });
      var formula = catItem ? catItem.dano : "1d6";
      performWeaponRoll(c.name, wpn.name||"Arma", formula);
    }
    return;
  }
  if(action==="select-weapon-catalog"){
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
      saveState(); renderTab();
      showToast("Arma equipada: " + catItem.name, "success");
    }
    return;
  }
  if(action==="toggle-weapon-visibility"){
    if(!isGM()) return;
    var wid2 = btn.getAttribute("data-id");
    var w = (state.weaponsCatalog||[]).find(function(x){return x.id===wid2;});
    if(w){ w.visible = w.visible===false ? true : false; saveState(true); pushSharedData(); renderTab(); }
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
  if(action==="add-weapon"){ if(!isGM()) return; c.weapons.push({id:uid(),name:"",dano:"",alcance:"",catalogId:""}); saveState(); renderTab(); return; }
  if(action==="del-weapon"){ if(!isGM()) return; c.weapons = c.weapons.filter(function(w){return w.id!==btn.getAttribute("data-id");}); saveState(); renderTab(); return; }
  if(action==="add-armor"){ if(!isGM()) return; c.armors.push({id:uid(),name:"",absorcion:"",estorbo:""}); saveState(); renderTab(); return; }
  if(action==="del-armor"){ if(!isGM()) return; c.armors = c.armors.filter(function(a){return a.id!==btn.getAttribute("data-id");}); saveState(); renderTab(); return; }
  if(action==="add-inventory"){ if(!isGM()) return; c.inventory.push({id:uid(),name:"",qty:1}); saveState(); renderTab(); return; }
  if(action==="del-inventory"){ if(!isGM()) return; c.inventory = c.inventory.filter(function(i){return i.id!==btn.getAttribute("data-id");}); saveState(); renderTab(); return; }
  if(action==="add-spell"){ if(!isGM()) return; c.spells.push({id:uid(),name:"",coste:"",rango:""}); saveState(); renderTab(); return; }
  if(action==="del-spell"){ if(!isGM()) return; c.spells = c.spells.filter(function(s){return s.id!==btn.getAttribute("data-id");}); saveState(); renderTab(); return; }
  if(action==="add-stone"){ if(!isGM()) return; c.stones.push({id:uid(),color:"",efecto:""}); saveState(); renderTab(); return; }
  if(action==="del-stone"){ if(!isGM()) return; c.stones = c.stones.filter(function(s){return s.id!==btn.getAttribute("data-id");}); saveState(); renderTab(); return; }
  if(action==="add-summon"){ if(!isGM()) return; c.summons.push({id:uid(),name:"",vida:"",defensa:"",absorcion:"",dano:"",movilidad:"",inteligencia:"",habilidades:""}); saveState(); renderTab(); return; }
  if(action==="del-summon"){ if(!isGM()) return; c.summons = c.summons.filter(function(s){return s.id!==btn.getAttribute("data-id");}); saveState(); renderTab(); return; }
  if(action==="add-poison"){ if(!isGM()) return; if(!c.poisons)c.poisons=[]; c.poisons.push({id:uid(),name:"",dosis:1,efectoEnemigo:"",efectoCherk:"",estado:"descubierto"}); saveState(); renderTab(); return; }
  if(action==="del-poison"){ if(!isGM()) return; c.poisons = c.poisons.filter(function(p){return p.id!==btn.getAttribute("data-id");}); saveState(); renderTab(); return; }
  if(action==="add-passiveNeg"){ if(!isGM()) return; c.passivesNeg.push({id:uid(),text:""}); saveState(); renderTab(); return; }
  if(action==="del-passiveNeg"){ if(!isGM()) return; c.passivesNeg = c.passivesNeg.filter(function(p){return p.id!==btn.getAttribute("data-id");}); saveState(); renderTab(); return; }
  if(action==="add-passivePos"){ if(!isGM()) return; c.passivesPos.push({id:uid(),text:""}); saveState(); renderTab(); return; }
  if(action==="del-passivePos"){ if(!isGM()) return; c.passivesPos = c.passivesPos.filter(function(p){return p.id!==btn.getAttribute("data-id");}); saveState(); renderTab(); return; }
  if(action==="add-goddess"){ if(!isGM()) return; c.goddessTable.push({id:uid(),nombre:"",gustos:"",disgustos:""}); saveState(); renderTab(); return; }
  if(action==="del-goddess"){ if(!isGM()) return; c.goddessTable = c.goddessTable.filter(function(g){return g.id!==btn.getAttribute("data-id");}); saveState(); renderTab(); return; }
  if(action==="toggle-bestiary-visibility"){
    if(!isGM()) return;
    var bid = btn.getAttribute("data-id");
    var b = (state.bestiary||[]).find(function(x){return x.id===bid;});
    if(b){ b.visible = b.visible===false ? true : false; saveState(true); pushSharedData(); renderTab(); }
    return;
  }
  if(action==="add-bestiary"){ if(!isGM()) return; state.bestiary.push({id:uid(),nombre:"Nueva Criatura",continente:"Todos",vida:"",defensa:"",absorcion:"",dano:"",movilidad:"",habilidades:"",visible:true}); saveState(true); pushSharedData(); renderTab(); return; }
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

  if(action==="sync-map-now"){ pullMapFromSupabase(); showToast("Mapa sincronizado con la nube", "success"); return; }
  if(action==="switch-map"){ state.activeMapId = btn.getAttribute("data-id"); renderTab(); return; }
  if(action==="add-new-map"){
    if(!isGM()) return;
    var mn = prompt("Nombre del mapa (ej: Mazmorra, Ciudad Capital):");
    if(mn){
      var nMap = {id:uid(), name:mn, image:null, markers:[]};
      state.maps.push(nMap); state.activeMapId = nMap.id;
      saveState(true); pushSharedData(); renderTab();
      showToast("Mapa creado: " + mn, "success");
    }
    return;
  }
  if(action==="delete-map"){
    if(!isGM()) return;
    if(confirm("¿Eliminar este mapa y sus pines?")){
      state.maps = state.maps.filter(function(m){return m.id!==state.activeMapId;});
      state.activeMapId = state.maps[0]?state.maps[0].id:"";
      saveState(true); pushSharedData(); renderTab();
      showToast("Mapa eliminado", "info");
    }
    return;
  }
  if(action==="upload-map"){ if(!isGM()) return; document.getElementById("mapFileInput").click(); return; }
  if(action==="remove-map"){
    if(!isGM()) return;
    var curM = (state.maps||[]).find(function(m){return m.id===state.activeMapId;});
    if(curM){ curM.image = null; curM.markers = []; saveState(true); pushSharedData(); renderTab(); }
    return;
  }
  if(action==="map-click"){
    if(!isGM()) return;
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
    if(!isGM()) return;
    var curM3 = (state.maps||[]).find(function(m){return m.id===state.activeMapId;});
    if(curM3) openPinModal(curM3, null, null, btn.getAttribute("data-id"));
    return;
  }

  if(action==="open-char-modal"){ openCharModal(); return; }
  if(action==="open-data-modal"){ openDataModal(); return; }
  if(action==="open-free-dice"){ openDiceModal(); return; }
  if(action==="upload-portrait"){ document.getElementById("portraitFileInput").click(); return; }
  if(action==="remove-portrait"){ c.portrait=null; saveState(); renderTopbar(); renderTab(); return; }
  if(action==="close-roll-modal"){ document.getElementById("rollOverlay").classList.add("hidden"); return; }
}

function init(){
  state = loadState();
  renderTopbar();
  renderTabbar();
  renderTab();

  document.getElementById("main").addEventListener("click", handleClick);
  document.getElementById("main").addEventListener("change", handleChange);
  document.getElementById("main").addEventListener("input", function(e){
    var el = e.target.closest("[data-bind]"); if(!el) return;
    var isGlobal = el.getAttribute("data-scope")==="global";
    var target = isGlobal ? state : activeChar();
    setBind(target, el.getAttribute("data-bind"), el.value, el.type);
    saveState(true);
    if(isGlobal){
      pushSharedData();
    }
  });
  
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
    if(e.target===this || e.target.closest("[data-action='close-roll-modal']")) this.classList.add("hidden");
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
        var curM = (state.maps||[]).find(function(m){return m.id===state.activeMapId;});
        if(curM){ curM.image = url; saveState(true); pushSharedData(); renderTab(); }
      });
    }
    e.target.value="";
  });
  document.getElementById("importFileInput").addEventListener("change", function(e){
    if(e.target.files && e.target.files[0]) importData(e.target.files[0]);
    e.target.value="";
  });

  initSupabase();
}

if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
