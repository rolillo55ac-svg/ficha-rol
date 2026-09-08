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

var INVENTORY_CATEGORIES = [
  "Armas",
  "Armadura y vestimenta",
  "Accesorios",
  "Consumibles",
  "Supervivencia",
  "Objetos de misión",
  "Materiales/Ingredientes",
  "Objetos especiales/únicos",
  "Miscelánea"
];

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
    personalNotes: "",
    trainings: []
  };
}

function ensureCharDefaults(c){
  if(!c || typeof c !== "object") return c;
  if(!c.id) c.id = uid();
  if(!c.name) c.name = "Sin Nombre";
  if(!c.attrs || typeof c.attrs !== "object") c.attrs = { fisico: 1, destreza: 1, inteligencia: 1, percepcion: 1, carisma: 1 };
  ATTRS.forEach(function(a){ if(c.attrs[a] === undefined) c.attrs[a] = 1; });
  
  if(!c.combat || typeof c.combat !== "object") c.combat = { iniciativa: 0, movilidad: 0, defensa: 10, defensaMagica: 0, pvActual: 10, pvMax: 10, escudoActual: 0, manaActual: 10, manaMax: 10 };
  if(c.combat.pvActual === undefined) c.combat.pvActual = c.combat.pvMax || 10;
  if(c.combat.pvMax === undefined) c.combat.pvMax = 10;
  if(c.combat.manaActual === undefined) c.combat.manaActual = c.combat.manaMax || 10;
  if(c.combat.manaMax === undefined) c.combat.manaMax = 10;
  if(c.combat.escudoActual === undefined) c.combat.escudoActual = 0;
  if(c.combat.defensa === undefined) c.combat.defensa = 10;
  if(c.combat.defensaMagica === undefined) c.combat.defensaMagica = 0;
  if(c.combat.iniciativa === undefined) c.combat.iniciativa = 0;
  if(c.combat.movilidad === undefined) c.combat.movilidad = 0;

  if(!c.money || typeof c.money !== "object") c.money = { oro: 0, plata: 0 };
  if(c.money.oro === undefined) c.money.oro = 0;
  if(c.money.plata === undefined) c.money.plata = 0;

  if(!c.skillBonus || typeof c.skillBonus !== "object") c.skillBonus = {};
  if(!c.skillProgress || typeof c.skillProgress !== "object") c.skillProgress = {};
  if(c.skillPointsUnlocked === undefined) c.skillPointsUnlocked = false;
  if(!c.skillHybrid || typeof c.skillHybrid !== "object") c.skillHybrid = {};
  if(!Array.isArray(c.customSkills)) c.customSkills = [];
  if(c.skillPoints === undefined) c.skillPoints = 0;

  if(!Array.isArray(c.weapons)) c.weapons = [];
  if(!Array.isArray(c.armors)) c.armors = [];
  if(!Array.isArray(c.inventory)) c.inventory = [];
  c.inventory.forEach(function(it){
    if(!it.category) it.category = "Miscelánea";
  });
  if(!Array.isArray(c.spells)) c.spells = [];
  if(!Array.isArray(c.stones)) c.stones = [];
  if(!Array.isArray(c.passivesNeg)) c.passivesNeg = [];
  if(!Array.isArray(c.passivesPos)) c.passivesPos = [];
  if(!Array.isArray(c.goddessCurses)) c.goddessCurses = [];
  if(!Array.isArray(c.goddessBlessings)) c.goddessBlessings = [];
  if(!Array.isArray(c.goddessTable)) c.goddessTable = [];
  if(!Array.isArray(c.summons)) c.summons = [];
  if(!c.buffs || typeof c.buffs !== "object") c.buffs = {};
  if(!Array.isArray(c.customBuffs)) c.customBuffs = [];
  if(!Array.isArray(c.poisons)) c.poisons = [];
  if(!Array.isArray(c.activeBuffs)) c.activeBuffs = [];
  c.activeBuffs.forEach(function(ab){
    if(ab.active === undefined) ab.active = true;
  });
  if(c.personalNotes === undefined) c.personalNotes = "";
  if(!Array.isArray(c.trainings)) c.trainings = [];
  c.trainings.forEach(function(tr){
    if(!tr.id) tr.id = uid();
    if(!tr.name) tr.name = "Nuevo Entrenamiento";
    if(!tr.category){
      tr.category = tr.type === "new" ? "unlock" : "skill";
    }
    if(tr.category === "General" || tr.category === "existing") tr.category = "skill";
    if(tr.category === "new") tr.category = "unlock";

    if(!tr.type) tr.type = (tr.category === "unlock") ? "new" : "existing";
    if(tr.sides === undefined) tr.sides = (tr.category === "unlock") ? 20 : 10;

    if(tr.targetGoal === undefined) tr.targetGoal = 20;
    if(tr.targetStat === undefined) tr.targetStat = "+10 PV";

    if(tr.linkedType === undefined) tr.linkedType = "";
    if(tr.linkedId === undefined) tr.linkedId = "";

    if(tr.narrativePercentage === undefined) tr.narrativePercentage = 0;
    if(tr.narrativeNotes === undefined) tr.narrativeNotes = "";
    if(!Array.isArray(tr.milestones)) tr.milestones = [];
    if(tr.notes === undefined) tr.notes = tr.desc || "";

    if(!Array.isArray(tr.rolls)) tr.rolls = [];
    if(tr.points === undefined){
      tr.points = tr.rolls.reduce(function(sum, r){ return sum + (r.pts || 0); }, 0);
    }
  });

  return c;
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

  if(!s.officialDataVersion || s.officialDataVersion < 5){
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
        if(off.portrait && (!existing.portrait || !existing.portrait.startsWith("http") || existing.portrait.includes("images/personajes"))){
          existing.portrait = off.portrait;
        }
        if(!existing.theme && off.theme) existing.theme = off.theme;
        if(!existing.owner_id && off.owner_id) existing.owner_id = off.owner_id;
        if(!existing.ownerEmail && off.ownerEmail) existing.ownerEmail = off.ownerEmail;
        if(!existing.combat) existing.combat = JSON.parse(JSON.stringify(off.combat||{}));
        if(!existing.inventory) existing.inventory = JSON.parse(JSON.stringify(off.inventory||[]));
        if(!existing.weapons) existing.weapons = JSON.parse(JSON.stringify(off.weapons||[]));
        if(!existing.armors) existing.armors = JSON.parse(JSON.stringify(off.armors||[]));
        if(!existing.spells) existing.spells = JSON.parse(JSON.stringify(off.spells||[]));
        existing.officialDataVersion = 5;
      } else {
        var nOff = JSON.parse(JSON.stringify(off));
        nOff.officialDataVersion = 5;
        s.characters.push(nOff);
      }
    });
    s.characters = s.characters.filter(function(c){
      var n = (c.name || "").trim().toLowerCase();
      return n !== "sin personaje" && n !== "nuevo personaje" && n !== "kaelen mago";
    });
    s.officialDataVersion = 5;
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
    ensureCharDefaults(c);
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
    if(loaded && Array.isArray(loaded.characters)){
      loaded.characters.forEach(function(c){
        c._isDirty = false;
        delete c._lastLocalEdit;
      });
    }
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


function getEffectiveAttr(aKey, c){
  var base = num(c.attrs[aKey],0);
  if(aKey==="percepcion" && c.buffs && c.buffs.sangre_perc) base += 2;
  if(aKey==="destreza" && c.buffs && c.buffs.drogado_dex) base += 1;
  if(c.buffs && c.buffs.mono) base -= 1;
  
  if(c.activeBuffs){
    c.activeBuffs.forEach(function(ab){
      if(ab.active === false) return;
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
      if(ab.active === false) return;
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
      if(ab.active === false) return;
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

function getEffectiveMaxHp(c){
  if(!c || !c.combat) return 10;
  var base = Math.max(1, num(c.combat.pvMax, 10));
  var pctMod = 0;
  var flatMod = 0;

  if(c.activeBuffs){
    c.activeBuffs.forEach(function(ab){
      if(ab.active === false) return;
      var attr = String(ab.attr || "").toLowerCase().trim();
      if(attr === "vida" || attr === "pvmax" || attr === "pv" || attr === "vida_max" || attr === "salud"){
        var bonusStr = String(ab.bonus || "").trim();
        if(bonusStr.includes("%")){
          var p = parseFloat(bonusStr);
          if(!isNaN(p)) pctMod += p;
        } else {
          var f = parseFloat(bonusStr);
          if(!isNaN(f)) flatMod += f;
        }
      }
    });
  }

  if(c.spells){
    c.spells.forEach(function(sp){
      if(sp.active && sp.statAttr && sp.statMod){
        var attr = String(sp.statAttr).toLowerCase().trim();
        if(attr === "vida" || attr === "pvmax" || attr === "pv" || attr === "vida_max"){
          var stacks = Math.max(1, num(sp.activeStacks, 1));
          var bonusStr = String(sp.statMod).trim();
          if(bonusStr.includes("%")){
            var p = parseFloat(bonusStr);
            if(!isNaN(p)) pctMod += p * stacks;
          } else {
            var f = parseFloat(bonusStr);
            if(!isNaN(f)) flatMod += f * stacks;
          }
        }
      }
    });
  }

  var eff = (base + flatMod) * (1 + pctMod / 100);
  return Math.max(1, Math.round(eff));
}

function getEffectiveMaxMana(c){
  if(!c || !c.combat) return 10;
  var base = Math.max(1, num(c.combat.manaMax, 10));
  var pctMod = 0;
  var flatMod = 0;

  if(c.activeBuffs){
    c.activeBuffs.forEach(function(ab){
      if(ab.active === false) return;
      var attr = String(ab.attr || "").toLowerCase().trim();
      if(attr === "mana" || attr === "manamax" || attr === "maná"){
        var bonusStr = String(ab.bonus || "").trim();
        if(bonusStr.includes("%")){
          var p = parseFloat(bonusStr);
          if(!isNaN(p)) pctMod += p;
        } else {
          var f = parseFloat(bonusStr);
          if(!isNaN(f)) flatMod += f;
        }
      }
    });
  }

  var eff = (base + flatMod) * (1 + pctMod / 100);
  return Math.max(1, Math.round(eff));
}

