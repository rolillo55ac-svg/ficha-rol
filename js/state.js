var APP_VERSION = "1.3.9.9";
var APP_BUILD = "2026.09.23.02";

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
  if(!c.id) c.id = c.db_id || uid();
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
  c.poisons.forEach(function(p){
    if(!p.id) p.id = uid();
    if(p.dosis === undefined) p.dosis = 1;
    if(p.materiaPrimaQty === undefined) p.materiaPrimaQty = 0;
    if(!p.type) p.type = "Veneno";
    if(!p.rarity) p.rarity = "Común";
    if(!p.progEnemigo){
      p.progEnemigo = (p.estado === "investigando") ? "extraido" : ((p.efectoEnemigo && p.efectoEnemigo.trim()) ? "confirmado" : "desconocido");
    }
    if(!p.progCherk){
      p.progCherk = (p.estado === "investigando") ? "extraido" : ((p.efectoCherk && p.efectoCherk.trim()) ? "confirmado" : "desconocido");
    }
    if(p.efectoEnemigo === undefined) p.efectoEnemigo = "";
    if(p.efectoCherk === undefined) p.efectoCherk = "";
    if(p.notasInvestigacion === undefined) p.notasInvestigacion = "";
    if(!p.catalogId && typeof ALCHEMY_CATALOG !== "undefined"){
      var matchCat = ALCHEMY_CATALOG.find(function(cat){
        return (cat.name||'').trim().toLowerCase() === (p.name||'').trim().toLowerCase() ||
               (cat.loreRefTitle||'').trim().toLowerCase() === (p.name||'').trim().toLowerCase();
      });
      if(matchCat){
        p.catalogId = matchCat.id;
        if(!p.type) p.type = matchCat.type;
        if(!p.rarity) p.rarity = matchCat.rarity;
      }
    }
  });
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

function getSeedAlchemyCatalog(){
  return [
    // --- VENENOS OFICIALES ---
    {
      id: "subst_amanita",
      name: "Amanita (Base)",
      type: "Veneno",
      rarity: "Común",
      terrain: "Bosque",
      continent: "Todos",
      rawMaterial: "Seta Amanita silvestre",
      loreRefTitle: "Veneno: Amanita (Base)",
      bestiaryRefName: null,
      dificultadExtraccion: 8,
      baseRequerida: "Base de veneno",
      efectoEnemigo: "Base de venenos (Muy común). Entorpece las funciones motoras.",
      efectoCherk: "Neutralizante digestivo / Estimulante base.",
      desc: "Hongo común de bosque húmedo. Su savia filtrada sirve como base de fijación para toxinas complejas."
    },
    {
      id: "subst_seta_sueno",
      name: "Seta del sueño",
      type: "Veneno",
      rarity: "Común",
      terrain: "Bosque",
      continent: "Todos",
      rawMaterial: "Esporas de seta somnífera",
      loreRefTitle: "Veneno: Seta del sueño",
      bestiaryRefName: null,
      dificultadExtraccion: 10,
      baseRequerida: "Base de veneno",
      efectoEnemigo: "Sueño profundo / Paralización motora progresiva.",
      efectoCherk: "No necesitas dormir (Máximo 1 noche sin penalización).",
      desc: "Libera finas esporas azucaradas. Induce un sopor narcótico en adversarios, mientras que Cherk metaboliza el principio activo como lucidez continuada."
    },
    {
      id: "subst_seta_terrosa",
      name: "Seta terrosa",
      type: "Veneno",
      rarity: "Común",
      terrain: "Minas / Cuevas",
      continent: "Todos",
      rawMaterial: "Hongo petrificado de caverna",
      loreRefTitle: "Veneno: Seta terrosa",
      bestiaryRefName: null,
      dificultadExtraccion: 10,
      baseRequerida: "Base de veneno",
      efectoEnemigo: "Entumecer músculos y articulaciones.",
      efectoCherk: "+ Mitad de movilidad (4 Turnos).",
      desc: "Crece adherida a vetas minerales en penumbra. Agota los reflejos del rival pero activa la circulación periférica en Cherk."
    },
    {
      id: "subst_nenufar_p",
      name: "Nenúfar de Pantano",
      type: "Veneno",
      rarity: "Común",
      terrain: "Pantano",
      continent: "Todos",
      rawMaterial: "Pétalos de nenúfar violáceo",
      loreRefTitle: "Veneno: Nenúfar P",
      bestiaryRefName: null,
      dificultadExtraccion: 10,
      baseRequerida: "Base de veneno",
      efectoEnemigo: "Reduce la Percepción rival (-2 a tiradas de Advertir y Buscar).",
      efectoCherk: "+2 a Percepción (20 min).",
      desc: "Planta flotante de aguas turbias. Su extracto obnubila la vista y el oído enemigo, pero afina los sentidos sensoriales de Cherk."
    },
    {
      id: "subst_nenufar_m",
      name: "Nenúfar de Manglar",
      type: "Veneno",
      rarity: "Común",
      terrain: "Manglar",
      continent: "Todos",
      rawMaterial: "Raíz fibrosa de nenúfar cenagoso",
      loreRefTitle: "Veneno: Nenúfar M",
      bestiaryRefName: null,
      dificultadExtraccion: 11,
      baseRequerida: "Base de veneno",
      efectoEnemigo: "Daño continuo por toxina corrosiva (1d4 por turno).",
      efectoCherk: "+3 de vida falsa / escudo orgánico (hasta perderla).",
      desc: "Vegetal viscoso de manglar salobre. Al inyectarse, su reacción orgánica genera una coraza celular protectora en Cherk."
    },
    {
      id: "subst_flor_caido",
      name: "Flor del Caído",
      type: "Veneno",
      rarity: "Muy rara",
      terrain: "Jungla",
      continent: "Todos",
      rawMaterial: "Corola negra de flor del Caído",
      loreRefTitle: "Veneno: Flor del Caído",
      bestiaryRefName: null,
      dificultadExtraccion: 16,
      baseRequerida: "Base de veneno",
      efectoEnemigo: "Veneno mortal. Colapso biológico fulminante.",
      efectoCherk: "Trance agónico: Inmune a caer inconsciente durante 3 turnos.",
      desc: "Planta legendaria de la jungla profunda que florece donde cayeron héroes antiguos. Letal para el organismo común."
    },
    {
      id: "subst_flor_sombra",
      name: "Flor de Sombra",
      type: "Veneno",
      rarity: "Rara",
      terrain: "Bosque",
      continent: "Todos",
      rawMaterial: "Pétalos nocturnos umbríos",
      loreRefTitle: "Veneno: Flor de Sombra",
      bestiaryRefName: null,
      dificultadExtraccion: 13,
      baseRequerida: "Base de veneno",
      efectoEnemigo: "Ceguera temporal e hipersensibilidad a la luz.",
      efectoCherk: "Visión en la oscuridad completa (20 min).",
      desc: "Flor que solo abre sus cálices bajo la noche sin luna. Su resina ciega a quien la recibe en los ojos pero dilata la pupila de Cherk."
    },
    {
      id: "subst_cactus",
      name: "Cactus",
      type: "Veneno",
      rarity: "Común",
      terrain: "Desierto",
      continent: "Todos",
      rawMaterial: "Espinas urticantes desérticas",
      loreRefTitle: "Veneno: Cactus",
      bestiaryRefName: null,
      dificultadExtraccion: 9,
      baseRequerida: "Base de veneno",
      efectoEnemigo: "Urticante lacerante, ardor constante que distrae en combate.",
      efectoCherk: "+1 a las acciones (3 Turnos).",
      desc: "Planta crasa de las arenas. Su jugo irritante genera un estallido adrenérgico que duplica el ímpetu de Cherk."
    },
    {
      id: "subst_corteza_congelada",
      name: "Corteza Congelada",
      type: "Veneno",
      rarity: "Rara",
      terrain: "Montañas",
      continent: "Todos",
      rawMaterial: "Resina criogénica de árboles helados",
      loreRefTitle: "Veneno: Corteza Congelada",
      bestiaryRefName: null,
      dificultadExtraccion: 13,
      baseRequerida: "Base de veneno",
      efectoEnemigo: "Congela al rival (-4 a Movilidad / entumecimiento glacial).",
      efectoCherk: "Resistencia térmica absoluta al calor y fuego (15 min).",
      desc: "Resina recolectada en tundras de alta montaña que mantiene el frío perenne."
    },
    {
      id: "subst_seta_secante",
      name: "Seta Secante",
      type: "Veneno",
      rarity: "Común",
      terrain: "Desierto",
      continent: "Aslan",
      rawMaterial: "Sombrero desecado de hongo de duna",
      loreRefTitle: "Veneno: Seta Secante",
      bestiaryRefName: null,
      dificultadExtraccion: 9,
      baseRequerida: "Base de veneno",
      efectoEnemigo: "Deshidrata con extrema rapidez, causando jadeo y sed dolorosa.",
      efectoCherk: "Absorbe y drena toxinas estomacales ajenas.",
      desc: "Fungo de las tierras de Aslan capaz de chupar la humedad de cualquier tejido circundante."
    },
    {
      id: "subst_flor_volcan",
      name: "Flor de volcán",
      type: "Veneno",
      rarity: "Rara",
      terrain: "Montañas",
      continent: "Todos",
      rawMaterial: "Néctar sulfuroso magmático",
      loreRefTitle: "Veneno: Flor de volcán",
      bestiaryRefName: null,
      dificultadExtraccion: 13,
      baseRequerida: "Base de veneno",
      efectoEnemigo: "Azufre corrosivo. Quema piel y corroe armaduras leves.",
      efectoCherk: "Calor interno que otorga inmunidad al congelamiento ambiental.",
      desc: "Vegetal termófilo que florece cerca de chimeneas de basalto incandescente."
    },
    {
      id: "subst_baya_v",
      name: "Baya V de arbusto",
      type: "Veneno",
      rarity: "Común",
      terrain: "Bosque",
      continent: "Todos",
      rawMaterial: "Racimo de bayas verduzcas",
      loreRefTitle: "Veneno: Baya V de arbusto",
      bestiaryRefName: null,
      dificultadExtraccion: 9,
      baseRequerida: "Base de veneno",
      efectoEnemigo: "Visión monocromática en blanco y negro (anula contrastes).",
      efectoCherk: "Visión térmica: Detecta siluetas calientes en la penumbra.",
      desc: "Arbusto común de claros boscosos. Afecta los conos retinianos del adversario."
    },
    {
      id: "subst_baya_n",
      name: "Baya N de arbusto",
      type: "Veneno",
      rarity: "Común",
      terrain: "Bosque",
      continent: "Todos",
      rawMaterial: "Bayas negras de espino",
      loreRefTitle: "Veneno: Baya N de arbusto",
      bestiaryRefName: null,
      dificultadExtraccion: 9,
      baseRequerida: "Base de veneno",
      efectoEnemigo: "Duerme la lengua y cuerdas vocales (impide articular conjuros).",
      efectoCherk: "Anestesia local: Ignora penalizadores por dolor.",
      desc: "Frutos negros de espino venenoso con fuerte efecto paralizante en mucosas orales."
    },
    {
      id: "subst_quimera",
      name: "Quimera",
      type: "Veneno",
      rarity: "Muy rara",
      terrain: "Minas / Cuevas",
      continent: "Vetrys",
      rawMaterial: "Veneno de aguijón de Kimera",
      loreRefTitle: "Veneno: Quimera",
      bestiaryRefName: "Kimera",
      dificultadExtraccion: 16,
      baseRequerida: "Base de veneno",
      efectoEnemigo: "Paraliza por completo el sistema nervioso motor.",
      efectoCherk: "Hiperreflejos felinos: +3 a Reflejos y Esquivar (3 turnos).",
      desc: "Toxina pura recolectada de bestias de Kimera en las grutas profundas de Vetrys."
    },
    {
      id: "subst_escorpion_cobre",
      name: "Escorpión de cobre",
      type: "Veneno",
      rarity: "Rara",
      terrain: "Desierto",
      continent: "Aslan",
      rawMaterial: "Glándula venenosa de escorpión de cobre",
      loreRefTitle: "Veneno: Escorpión de cobre",
      bestiaryRefName: null,
      dificultadExtraccion: 12,
      baseRequerida: "Base de veneno",
      efectoEnemigo: "Quemadura de sol abrasadora interna.",
      efectoCherk: "Piel bronceada endurecida: +2 a la Absorción física.",
      desc: "Arácnido metálico que mora bajo las arenas cobrizas de Aslan."
    },
    {
      id: "subst_flor_n_oasis",
      name: "Flor N de oasis",
      type: "Veneno",
      rarity: "Rara",
      terrain: "Desierto",
      continent: "Aslan",
      rawMaterial: "Pétalos nocturnos de oasis",
      loreRefTitle: "Veneno: Flor N de oasis",
      bestiaryRefName: null,
      dificultadExtraccion: 12,
      baseRequerida: "Base de veneno",
      efectoEnemigo: "Ceguera por fotofobia aguda y lagrimeo constante.",
      efectoCherk: "Clarividencia: Ojos descansados bajo la noche estelar.",
      desc: "Brote floral que crece en las orillas de manantiales escondidos en el desierto."
    },
    {
      id: "subst_escorpion_negro",
      name: "Escorpión negro",
      type: "Veneno",
      rarity: "Muy rara",
      terrain: "Desierto",
      continent: "Aslan",
      rawMaterial: "Extracto de aguijón de escorpión negro gigante",
      loreRefTitle: "Veneno: Escorpión negro",
      bestiaryRefName: null,
      dificultadExtraccion: 15,
      baseRequerida: "Base de veneno",
      efectoEnemigo: "Dolor fatal e insuficiencia nerviosa dolorosa.",
      efectoCherk: "Furia adrenalínica: +1d6 al daño del próximo ataque físico.",
      desc: "Criatura de pesadilla de las dunas profundas. Su veneno es legendario en los bazares."
    },
    {
      id: "subst_sudor_pajaro",
      name: "Sudor de pájaro",
      type: "Veneno",
      rarity: "Rara",
      terrain: "Jungla",
      continent: "Todos",
      rawMaterial: "Secreción cutánea de ave de presa selvática",
      loreRefTitle: "Veneno: Sudor de pájaro",
      bestiaryRefName: null,
      dificultadExtraccion: 12,
      baseRequerida: "Base de veneno",
      efectoEnemigo: "Corrosivo dérmico y escozor agudo al contacto.",
      efectoCherk: "Ligereza corporal y reducción de penalización de armadura.",
      desc: "Exudado aceitoso de aves exóticas que ayuda a disolver impurezas."
    },
    {
      id: "subst_melocoton_pinch",
      name: "Melocotón pinch",
      type: "Veneno",
      rarity: "Común",
      terrain: "Praderas",
      continent: "Todos",
      rawMaterial: "Pulpa de melocotón espinoso",
      loreRefTitle: "Veneno: Melocotón pinch",
      bestiaryRefName: null,
      dificultadExtraccion: 9,
      baseRequerida: "Base de veneno",
      efectoEnemigo: "Adicción severa, náusea e inestabilidad al disiparse.",
      efectoCherk: "Éxtasis embriagador: Inmune a efectos de miedo o cobardía.",
      desc: "Fruta silvestre de aroma dulzón engañoso. Muy codiciada por contrabandistas."
    },
    {
      id: "subst_calamar_gigante",
      name: "Calamar gigante",
      type: "Veneno",
      rarity: "Rara",
      terrain: "Aguas profundas",
      continent: "Todos",
      rawMaterial: "Tinta negra concentrada de calamar abisal",
      loreRefTitle: "Veneno: Calamar gigante",
      bestiaryRefName: null,
      dificultadExtraccion: 13,
      baseRequerida: "Base de veneno",
      efectoEnemigo: "Indigestión masiva y mareo de mar en tierra.",
      efectoCherk: "Elasticidad tentacular: +2 a maniobras de presa o escape.",
      desc: "Sustancia viscosa extraída de moluscos de alta mar con alto contenido de álcalis tóxicos."
    },
    {
      id: "subst_v_serpiente",
      name: "V. de serpiente",
      type: "Veneno",
      rarity: "Rara",
      terrain: "Pantano",
      continent: "Tryssar",
      rawMaterial: "Veneno de víbora o anaconda pantanosa",
      loreRefTitle: "Veneno: V. de serpiente",
      bestiaryRefName: "Anaconda G.",
      dificultadExtraccion: 12,
      baseRequerida: "Base de veneno",
      efectoEnemigo: "Pesadillas alucinógenas y pánico visceral.",
      efectoCherk: "Termorrecepción ofídica: Capacidad de percibir criaturas a 15m.",
      desc: "Extraído de reptiles de Tryssar. Afecta los centros cerebrales del miedo."
    },
    {
      id: "subst_pez_globo",
      name: "Pez globo",
      type: "Veneno",
      rarity: "Rara",
      terrain: "Aguas profundas",
      continent: "Tryssar",
      rawMaterial: "Hígado con tetrodotoxina de pez globo",
      loreRefTitle: "Pez globo",
      bestiaryRefName: null,
      dificultadExtraccion: 13,
      baseRequerida: "Base de veneno",
      efectoEnemigo: "Parálisis respiratoria y sofoco asfixiante.",
      efectoCherk: "Respiración acuática completa (20 min).",
      desc: "Toxina marina de Tryssar que paradójicamente desbloquea las branquias latentes de Cherk."
    },

    // --- POCIONES OFICIALES ---
    {
      id: "subst_alga_playa",
      name: "Alga playa (Base)",
      type: "Poción",
      rarity: "Común",
      terrain: "Playa",
      continent: "Todos",
      rawMaterial: "Algas pardas de costa",
      loreRefTitle: "Poción: Alga playa (Base)",
      bestiaryRefName: null,
      dificultadExtraccion: 8,
      baseRequerida: "Agua de manantial",
      efectoEnemigo: "Sabor salobre vomitivo que interrumpe acciones.",
      efectoCherk: "Base de pociones (Muy común). Facilita decocciones curativas.",
      desc: "Alga marina de fácil recolección en rompientes. Diluida conforma el sustrato de elixires."
    },
    {
      id: "subst_musgo_v",
      name: "Musgo V",
      type: "Poción",
      rarity: "Común",
      terrain: "Minas / Cuevas",
      continent: "Todos",
      rawMaterial: "Musgo fosforescente verde",
      loreRefTitle: "Poción: Musgo V",
      bestiaryRefName: null,
      dificultadExtraccion: 8,
      baseRequerida: "Alga playa (Base)",
      efectoEnemigo: "Fosforescencia delatora: Ilumina al enemigo e impide ocultarse.",
      efectoCherk: "Emite Luz Verde suave iluminando 10m sin necesidad de antorcha.",
      desc: "Briófito de minas profundas que almacena luz química y la devuelve lentamente."
    },
    {
      id: "subst_flor_rey",
      name: "Flor del Rey",
      type: "Poción",
      rarity: "Muy rara",
      terrain: "Bosque",
      continent: "Todos",
      rawMaterial: "Corola áurea de Flor del Rey",
      loreRefTitle: "Poción: Flor del Rey",
      bestiaryRefName: null,
      dificultadExtraccion: 15,
      baseRequerida: "Alga playa (Base)",
      efectoEnemigo: "Inestabilidad de éter: Penaliza el lanzamiento de hechizos.",
      efectoCherk: "+Defensa mágica temporal (+4 contra magia durante 1 hora).",
      desc: "Hierba real de fragancia solemne. Escudo vegetal contra las fuerzas del tejido místico."
    },
    {
      id: "subst_flor_lirio_p",
      name: "Flor de Lirio P",
      type: "Poción",
      rarity: "Muy rara",
      terrain: "Pantano",
      continent: "Todos",
      rawMaterial: "Lirio púrpura de ciénaga",
      loreRefTitle: "Poción: Flor de Lirio P",
      bestiaryRefName: null,
      dificultadExtraccion: 14,
      baseRequerida: "Alga playa (Base)",
      efectoEnemigo: "Purga gástrica incontrolable.",
      efectoCherk: "Cura venenos, toxinas y ponzoñas activas de inmediato.",
      desc: "Antídoto supremo de los pantanos. Destruye cualquier compuesto ponzoñoso en sangre."
    },
    {
      id: "subst_raiz_manglar",
      name: "Raíz Manglar",
      type: "Poción",
      rarity: "Común",
      terrain: "Manglar",
      continent: "Todos",
      rawMaterial: "Extracto leñoso de raíz zancuda",
      loreRefTitle: "Poción: Raíz Manglar",
      bestiaryRefName: null,
      dificultadExtraccion: 9,
      baseRequerida: "Alga playa (Base)",
      efectoEnemigo: "Enraizamiento vegetal molesto a sus pies.",
      efectoCherk: "Crecimiento de Plantas acelerado en la tierra circundante.",
      desc: "Rica en auxinas botánicas concentradas capaces de germinar semillas al instante."
    },
    {
      id: "subst_flor_dia",
      name: "Flor del día",
      type: "Poción",
      rarity: "Muy rara",
      terrain: "Jungla",
      continent: "Todos",
      rawMaterial: "Pétalos solares de mediodía",
      loreRefTitle: "Poción: Flor del día",
      bestiaryRefName: null,
      dificultadExtraccion: 15,
      baseRequerida: "Alga playa (Base)",
      efectoEnemigo: "Deslumbramiento por energía solar desbordada.",
      efectoCherk: "+Vitalidad temporal (+10 PV máximos por 2 horas).",
      desc: "Florece solo cuando el sol alcanza su cénit en el dosel de la jungla."
    },
    {
      id: "subst_crisantemo",
      name: "Crisantemo",
      type: "Poción",
      rarity: "Común",
      terrain: "Praderas",
      continent: "Todos",
      rawMaterial: "Flor silvestre dorada de prado",
      loreRefTitle: "Poción: Crisantemo",
      bestiaryRefName: null,
      dificultadExtraccion: 9,
      baseRequerida: "Alga playa (Base)",
      efectoEnemigo: "Sobrecarga de estímulos sensoriales.",
      efectoCherk: "+Percepción aguda (+2 a tiradas de Advertir/Buscar).",
      desc: "Infusión clásica de boticario para aclarar la vista y despejar la niebla mental."
    },
    {
      id: "subst_flor_oasis",
      name: "Flor de Oasis",
      type: "Poción",
      rarity: "Muy rara",
      terrain: "Desierto",
      continent: "Aslan",
      rawMaterial: "Néctar cristalino de oasis",
      loreRefTitle: "Poción: Flor de Oasis",
      bestiaryRefName: null,
      dificultadExtraccion: 16,
      baseRequerida: "Alga playa (Base)",
      efectoEnemigo: "Fuga de maná por sobre-ionización.",
      efectoCherk: "Regeneración de Maná / Energía rápida (+10 Maná al instante).",
      desc: "El elixir místico más codiciado por hechiceros y místicos de las dunas."
    },
    {
      id: "subst_musgo_a",
      name: "Musgo A",
      type: "Poción",
      rarity: "Común",
      terrain: "Minas / Cuevas",
      continent: "Todos",
      rawMaterial: "Musgo bioluminiscente azul",
      loreRefTitle: "Poción: Musgo A",
      bestiaryRefName: null,
      dificultadExtraccion: 8,
      baseRequerida: "Alga playa (Base)",
      efectoEnemigo: "Resplandor azulado que revela puntos débiles.",
      efectoCherk: "Emite Luz Azul fría y serena útil para explorar sin ruido.",
      desc: "Variedad cavernaria que tiñe los frascos de un azul eléctrico brillante."
    },
    {
      id: "subst_flor_cristal",
      name: "Flor de cristal",
      type: "Poción",
      rarity: "Muy rara",
      terrain: "Montañas",
      continent: "Todos",
      rawMaterial: "Cálices cristalizados de alta cumbre",
      loreRefTitle: "Poción: Flor de cristal",
      bestiaryRefName: null,
      dificultadExtraccion: 16,
      baseRequerida: "Alga playa (Base)",
      efectoEnemigo: "Petrificación celular transitoria y dolor articular.",
      efectoCherk: "Regeneración celular avanzada: Recupera 3 PV por turno (3 turnos).",
      desc: "Rarísima flor mineralizada que regenera cartílagos y tejidos de inmediato."
    },
    {
      id: "subst_flor_melosa",
      name: "Flor melosa",
      type: "Poción",
      rarity: "Común",
      terrain: "Praderas",
      continent: "Todos",
      rawMaterial: "Polen dulce de pradera",
      loreRefTitle: "Poción: Flor melosa",
      bestiaryRefName: null,
      dificultadExtraccion: 9,
      baseRequerida: "Alga playa (Base)",
      efectoEnemigo: "Sopor placentero que reduce la agresividad.",
      efectoCherk: "Dulce sedante: Disipa crisis nerviosas o penalizadores de pánico.",
      desc: "Jarabe de sabor amielado que reconforta el espíritu de aventureros exhaustos."
    },

    // --- UNGÜENTOS OFICIALES ---
    {
      id: "subst_musgo_rio",
      name: "Musgo de río (Base)",
      type: "Ungüento",
      rarity: "Común",
      terrain: "Ríos",
      continent: "Todos",
      rawMaterial: "Musgo fluvial fresco de cantos rodados",
      loreRefTitle: "Ungüento: Musgo de río (Base)",
      bestiaryRefName: null,
      dificultadExtraccion: 8,
      baseRequerida: "Grasa animal o bálsamo",
      efectoEnemigo: "Emplasto resbaladizo inofensivo.",
      efectoCherk: "Base de ungüentos (Muy común). Facilita bálsamos tópicos.",
      desc: "Emplasto rico en minerales que humecta y fija cataplasmas en la piel."
    },
    {
      id: "subst_flor_aire",
      name: "Flor de Aire",
      type: "Ungüento",
      rarity: "Rara",
      terrain: "Montañas",
      continent: "Todos",
      rawMaterial: "Pétalos etéreos de cresta montañosa",
      loreRefTitle: "Ungüento: Flor de Aire",
      bestiaryRefName: null,
      dificultadExtraccion: 12,
      baseRequerida: "Musgo de río (Base)",
      efectoEnemigo: "Evaporación acelerada de defensas dérmicas.",
      efectoCherk: "Mejorador de ungüentos: Duplica la duración de otros bálsamos.",
      desc: "Flor mecida por vientos huracanados que impregna ligereza en las mezclas."
    },
    {
      id: "subst_margarita",
      name: "Margarita",
      type: "Ungüento",
      rarity: "Común",
      terrain: "Praderas",
      continent: "Todos",
      rawMaterial: "Flores blancas de prado",
      loreRefTitle: "Ungüento: Margarita",
      bestiaryRefName: null,
      dificultadExtraccion: 8,
      baseRequerida: "Musgo de río (Base)",
      efectoEnemigo: "Cicatrización superficial mínima.",
      efectoCherk: "Curación básica de heridas: Restaura 1d6+2 PV al aplicarse.",
      desc: "Bálsamo clásico de campaña indispensable en el botiquín de cualquier explorador."
    },
    {
      id: "subst_margarita_x2",
      name: "Margarita x2",
      type: "Ungüento",
      rarity: "Común",
      terrain: "Praderas",
      continent: "Todos",
      rawMaterial: "Concentrado denso de margaritas",
      loreRefTitle: "Ungüento: Margarita x2",
      bestiaryRefName: null,
      dificultadExtraccion: 9,
      baseRequerida: "Musgo de río (Base)",
      efectoEnemigo: "Inocuo en humanoides.",
      efectoCherk: "Curación animal: Restaura 2d6 PV a monturas, bestias o familiares.",
      desc: "Formulación veterinaria tradicional para sanar corceles y sabuesos heridos."
    },
    {
      id: "subst_musgo_olor",
      name: "Musgo Olor",
      type: "Ungüento",
      rarity: "Común",
      terrain: "Pantano",
      continent: "Todos",
      rawMaterial: "Musgo almizclado aromático",
      loreRefTitle: "Ungüento: Musgo Olor",
      bestiaryRefName: null,
      dificultadExtraccion: 9,
      baseRequerida: "Musgo de río (Base)",
      efectoEnemigo: "Olor penetrante que delata al enemigo a larga distancia.",
      efectoCherk: "Rastreo de feromonas y pistas: +3 a tiradas de Rastrear.",
      desc: "Desprende un almizcle acre que orienta el olfato del rastreador avezado."
    },
    {
      id: "subst_flor_agua",
      name: "Flor de agua",
      type: "Ungüento",
      rarity: "Rara",
      terrain: "Aguas profundas",
      continent: "Todos",
      rawMaterial: "Cutícula impermeable de lirio acuático",
      loreRefTitle: "Ungüento: Flor de agua",
      bestiaryRefName: null,
      dificultadExtraccion: 12,
      baseRequerida: "Musgo de río (Base)",
      efectoEnemigo: "Obstrucción de poros y sensación de ahogo.",
      efectoCherk: "Apnea prolongada bajo el agua (hasta 15 min sin consumir aire).",
      desc: "Ungüento que se unta en el pecho y cuello para sellar el consumo de oxígeno."
    },
    {
      id: "subst_seta_lenosa",
      name: "Seta Leñosa",
      type: "Ungüento",
      rarity: "Común",
      terrain: "Jungla",
      continent: "Todos",
      rawMaterial: "Hongo leñoso de corteza de árbol",
      loreRefTitle: "Ungüento: Seta Leñosa",
      bestiaryRefName: null,
      dificultadExtraccion: 9,
      baseRequerida: "Musgo de río (Base)",
      efectoEnemigo: "Coagulación desordenada en cortes externos.",
      efectoCherk: "Cicatrización rápida de cortes profundos y cese de sangrados.",
      desc: "Excelente hemostático vegetal que coagula heridas abiertas en segundos."
    },
    {
      id: "subst_musgo_estanque",
      name: "Musgo Estanque",
      type: "Ungüento",
      rarity: "Común",
      terrain: "Lagos",
      continent: "Todos",
      rawMaterial: "Manto verde de superficie de remansos",
      loreRefTitle: "Ungüento: Musgo Estanque",
      bestiaryRefName: null,
      dificultadExtraccion: 9,
      baseRequerida: "Musgo de río (Base)",
      efectoEnemigo: "Tinte verdoso que ensucia armaduras.",
      efectoCherk: "Camuflaje con el entorno: +2 a tiradas de Sigilo entre vegetación.",
      desc: "Arcilla con pigmentos miméticos que rompen la silueta corporal en la maleza."
    },
    {
      id: "subst_flor_hestia",
      name: "Flor de Hestia",
      type: "Ungüento",
      rarity: "Rara",
      terrain: "Desierto",
      continent: "Aslan",
      rawMaterial: "Pétalos ígneos del desierto de cobre",
      loreRefTitle: "Ungüento: Flor de Hestia",
      bestiaryRefName: null,
      dificultadExtraccion: 12,
      baseRequerida: "Musgo de río (Base)",
      efectoEnemigo: "Calor sofocante cutáneo.",
      efectoCherk: "Resistencia al frío extremo e inmunidad a hipotermia ambiental.",
      desc: "Manteca cálida que protege el cuerpo de ventiscas heladas durante horas."
    },
    {
      id: "subst_flor_terra",
      name: "Flor de Terra",
      type: "Ungüento",
      rarity: "Rara",
      terrain: "Sabana",
      continent: "Todos",
      rawMaterial: "Semillas trituradas de flor de tierra",
      loreRefTitle: "Ungüento: Flor de Terra",
      bestiaryRefName: null,
      dificultadExtraccion: 12,
      baseRequerida: "Musgo de río (Base)",
      efectoEnemigo: "Espasmo muscular menor en extremidades.",
      efectoCherk: "Energía y rendimiento de Atleta: +2 en Atletismo y +2 Movilidad.",
      desc: "Fortalece tendones y ligamentos permitiendo carreras y zancadas mayores."
    },
    {
      id: "subst_flor_escarcha",
      name: "Flor Escarcha",
      type: "Ungüento",
      rarity: "Rara",
      terrain: "Montañas",
      continent: "Todos",
      rawMaterial: "Pétalos gélidos de nieves perpetuas",
      loreRefTitle: "Ungüento: Flor Escarcha",
      bestiaryRefName: null,
      dificultadExtraccion: 12,
      baseRequerida: "Musgo de río (Base)",
      efectoEnemigo: "Escalofríos paralizantes.",
      efectoCherk: "Resistencia al calor extremo y quemaduras por sol o brasas.",
      desc: "Ungüento refrescante que baja la temperatura corporal en páramos calcinantes."
    },
    {
      id: "subst_bayas_glue",
      name: "Bayas Glue",
      type: "Ungüento",
      rarity: "Común",
      terrain: "Bosque",
      continent: "Todos",
      rawMaterial: "Resina pegajosa de bayas glue",
      loreRefTitle: "Ungüento: Bayas Glue",
      bestiaryRefName: null,
      dificultadExtraccion: 8,
      baseRequerida: "Musgo de río (Base)",
      efectoEnemigo: "Adherencia molesta en manos y mangos de armas.",
      efectoCherk: "Pegamento adhesivo instantáneo de gran tenacidad mecánica.",
      desc: "Cola vegetal de fraguado inmediato capaz de unir cuerdas, armas o trampas."
    },
    {
      id: "subst_hestia_escarcha",
      name: "Hestia + Escarcha",
      type: "Ungüento",
      rarity: "Muy rara",
      terrain: "Especial",
      continent: "Todos",
      rawMaterial: "Mezcla simbiótica de Flor de Hestia y Flor Escarcha",
      loreRefTitle: "Ungüento: Hestia + Escarcha",
      bestiaryRefName: null,
      dificultadExtraccion: 16,
      baseRequerida: "Musgo de río (Base)",
      efectoEnemigo: "Choque térmico alternante desestabilizador.",
      efectoCherk: "Adaptación climática universal: Inmune tanto al frío como al calor extremos.",
      desc: "Cúspide de la ungüentística elemental: el equilibrio perfecto entre hielo y fuego."
    }
  ];
}

var ALCHEMY_CATALOG = getSeedAlchemyCatalog();

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


function getSeedQuests(){
  return [
    {
      id: "quest_trysar_infil",
      title: "La Infiltración en Trysar",
      type: "principal",
      category: "principal",
      status: "activa",
      location: "Puertos de Trysar",
      reward: "Oro, contactos en los muelles",
      desc: "Investigar las actividades sospechosas de los contrabandistas en los puertos de Trysar.",
      image: null,
      markers: [],
      tasks: [
        { id: "task_trysar_1", text: "Contactar con el informante en la taberna del puerto", done: false },
        { id: "task_trysar_2", text: "Inspeccionar el almacén de venenos y suministros", done: false }
      ],
      completed: false
    }
  ];
}

function getSeedQuestClues(){
  return [
    { id: "clue_sello_purpura", title: "Sello de cera púrpura", desc: "Encontrado en una carta interceptada con la marca de Krysalis.", image: null }
  ];
}

function getSeedQuestMap(){
  return { name: "Mapa de la Misión", image: null, notes: "Puntos de reunión y rutas de escape marcadas.", markers: [] };
}

function getSeedSessionSummary(){
  return "Los aventureros se preparan para su incursión. Recuerden comprobar provisiones y preparar antídotos.";
}

function defaultState(){
  var officialChars = getOfficialCharacters();
  return {
    activeId: officialChars[0] ? officialChars[0].id : "",
    activeTab: "ficha",
    rollLog: [],
    characters: officialChars,
    officialDataVersion: 6,
    weaponsCatalog: getSeedWeaponsCatalog(),
    buffCatalog: getSeedBuffCatalog(),
    lore: getSeedLore(),
    bestiary: getSeedBestiary(),
    maps: [{ id: "world_main", name: "Mapa de Campaña", image: null, markers: [] }],
    activeMapId: "world_main",
    quests: getSeedQuests(),
    questClues: getSeedQuestClues(),
    _deletedSeedQuests: [],
    _deletedSeedClues: [],
    questMap: getSeedQuestMap(),
    sessionSummary: getSeedSessionSummary(),
    skillsView: "attr",
    invView: "grid",
    invGroupFilter: "all"
  };
}

function migrateState(s){
  if(!s) return defaultState();
  if(!s.activeTab) s.activeTab="ficha";
  if(!s.rollLog) s.rollLog=[];
  if(!s.skillsView) {
    try { s.skillsView = localStorage.getItem("krysalis_skills_view") || "attr"; } catch(e){ s.skillsView = "attr"; }
  }
  if(!s.invView) {
    try { s.invView = localStorage.getItem("krysalis_inv_view") || "grid"; } catch(e){ s.invView = "grid"; }
  }
  if(!s.invGroupFilter) s.invGroupFilter = "all";

  // 1. Integridad de Armas y Armaduras
  if(!s.weaponsCatalog || !Array.isArray(s.weaponsCatalog) || !s.weaponsCatalog.length){
    s.weaponsCatalog = getSeedWeaponsCatalog();
  } else {
    var seedW = getSeedWeaponsCatalog();
    seedW.forEach(function(sw){
      var exists = s.weaponsCatalog.some(function(w){
        return (w.id && w.id === sw.id) || (w.name && w.name.trim().toLowerCase() === sw.name.trim().toLowerCase());
      });
      if(!exists) s.weaponsCatalog.push(JSON.parse(JSON.stringify(sw)));
    });
    s.weaponsCatalog.forEach(function(w){ if(w.visible === undefined) w.visible = true; });
  }

  // 2. Integridad de Catálogo de Buffs
  if(!s.buffCatalog || !Array.isArray(s.buffCatalog) || !s.buffCatalog.length){
    s.buffCatalog = getSeedBuffCatalog();
  } else {
    s.buffCatalog.forEach(function(b){
      if(b.duration === undefined) b.duration = "permanent";
      if(b.durationTurns === undefined) b.durationTurns = 0;
      if(b.visible === undefined) b.visible = true;
    });
  }

  // 3. Integridad de Lore Oficial (Venenos, Pociones, Ungüentos, Pistas, NPCs)
  if(!s.lore || typeof s.lore !== "object") s.lore = getSeedLore();
  var seedLore = getSeedLore();
  if(!Array.isArray(s.lore.pistas) || !s.lore.pistas.length) s.lore.pistas = seedLore.pistas;
  if(!Array.isArray(s.lore.npcs) || !s.lore.npcs.length) s.lore.npcs = seedLore.npcs;
  if(!Array.isArray(s.lore.objetos) || !s.lore.objetos.length){
    s.lore.objetos = seedLore.objetos;
  } else {
    seedLore.objetos.forEach(function(so){
      var exists = s.lore.objetos.some(function(o){
        return o.title && o.title.trim().toLowerCase() === so.title.trim().toLowerCase();
      });
      if(!exists) s.lore.objetos.push(JSON.parse(JSON.stringify(so)));
    });
  }
  ["pistas","npcs","objetos"].forEach(function(cat){
    if(s.lore && s.lore[cat]){
      s.lore[cat].forEach(function(item){ if(item.visible === undefined) item.visible = true; });
    }
  });

  // 4. Integridad de Bestiario Oficial
  if(!s.bestiary || !Array.isArray(s.bestiary) || !s.bestiary.length){
    s.bestiary = getSeedBestiary();
  } else {
    var seedB = getSeedBestiary();
    seedB.forEach(function(sb){
      var exists = s.bestiary.some(function(b){
        return b.nombre && b.nombre.trim().toLowerCase() === sb.nombre.trim().toLowerCase();
      });
      if(!exists) s.bestiary.push(JSON.parse(JSON.stringify(sb)));
    });
    migrateBestiaryData(s.bestiary);
  }

  // 5. Integridad de Mapas de Campaña
  if(!s.maps || !Array.isArray(s.maps) || !s.maps.length){
    s.maps = [{ id:"world_main", name:"Mapa de Campaña", image:null, markers:[] }];
    s.activeMapId = "world_main";
  } else {
    s.maps.forEach(function(m){
      if(!Array.isArray(m.markers)) m.markers = [];
    });
    if(!s.activeMapId || !s.maps.some(function(m){ return m.id === s.activeMapId; })){
      s.activeMapId = s.maps[0].id;
    }
  }

  if(!Array.isArray(s._deletedSeedQuests)) s._deletedSeedQuests = [];
  if(!Array.isArray(s._deletedSeedClues)) s._deletedSeedClues = [];

  // 6. Integridad de Misiones de Campaña
  if(!Array.isArray(s.quests)){
    s.quests = getSeedQuests();
  } else {
    // Si la misión semilla de Trysar fue explícitamente eliminada, garantizar que no reaparezca
    if(s._deletedSeedQuests.indexOf("quest_trysar_infil") !== -1){
      s.quests = s.quests.filter(function(q){
        var isTrysar = q.id === "quest_trysar_infil" || ((q.title||"").toLowerCase().includes("trysar") && (q.title||"").toLowerCase().includes("infiltraci"));
        return !isTrysar;
      });
    }
    s.quests.forEach(function(q){
      if(!q.type) q.type = q.category || "principal";
      if(!q.category) q.category = q.type;
      if(!q.status) q.status = q.completed ? "completada" : "activa";
      if(!Array.isArray(q.tasks)) q.tasks = [];
      q.tasks.forEach(function(t){
        t.target = (t.target !== undefined && t.target !== null) ? Math.max(1, parseInt(t.target, 10) || 1) : 1;
        t.current = (t.current !== undefined && t.current !== null) ? Math.max(0, parseInt(t.current, 10) || 0) : (t.done ? t.target : 0);
        if(t.target > 1){
          t.done = (t.current >= t.target);
        }
      });
      if(q.location === undefined) q.location = "";
      if(q.reward === undefined) q.reward = "";
      if(!Array.isArray(q.markers)) q.markers = [];
    });
  }

  // 7. Integridad de Pistas de Misión
  if(!Array.isArray(s.questClues)){
    s.questClues = getSeedQuestClues();
  } else {
    if(s._deletedSeedClues.indexOf("clue_sello_purpura") !== -1){
      s.questClues = s.questClues.filter(function(c){ return c.id !== "clue_sello_purpura"; });
    }
  }

  // 8. Integridad de Mapa de Misión
  if(!s.questMap || typeof s.questMap !== "object" || !s.questMap.name){
    s.questMap = getSeedQuestMap();
  }
  if(!Array.isArray(s.questMap.markers)) s.questMap.markers = [];

  // 9. Integridad de Resumen de Sesión
  if(s.sessionSummary === undefined || s.sessionSummary === null){
    s.sessionSummary = getSeedSessionSummary();
  }

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
        if(off.charSound && !existing.charSound) existing.charSound = JSON.parse(JSON.stringify(off.charSound));
        if((existing.id === "char_ink" || (existing.name && existing.name.toLowerCase().includes("ink"))) && !existing.charSound){
          existing.charSound = { name: "Ruido murciélago", type: "bat", icon: "🦇", url: "sounds/ruido_murcielago.wav" };
        }
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

  // 10. Migración v6: Tickets #TK-JHEC y #TK-BA7F (Cherk nivel 1 y +1 en Piedras Mágicas)
  if(!s.officialDataVersion || s.officialDataVersion < 6){
    (s.characters || []).forEach(function(c){
      var n = (c.name || "").trim().toLowerCase();
      if(n === "cherk" || n.includes("cherk") || c.id === "char_cherk" || c.db_id === "a8039428-8ee7-4e31-baba-c6a1d8b6d8f3"){
        c.nivel = "1";
        if(!c.skillBonus) c.skillBonus = {};
        c.skillBonus.piedras = Math.max(num(c.skillBonus.piedras, 0), 1);
        if(!c.combat) c.combat = {};
        c.combat.pvMax = 20;
        if(num(c.combat.pvActual, 20) > 20) c.combat.pvActual = 20;
        c.combat.manaMax = 10;
        if(num(c.combat.manaActual, 10) > 10) c.combat.manaActual = 10;
        c.officialDataVersion = 6;
      }
    });
    s.officialDataVersion = 6;
  }

  // 11. Migración v7: Rediseño Alquimia con doble eje independiente (Enemigo vs Cherk/Propio)
  if(!s.officialDataVersion || s.officialDataVersion < 7){
    (s.characters || []).forEach(function(c){
      if(Array.isArray(c.poisons)){
        c.poisons.forEach(function(p){
          if(!p.progEnemigo){
            p.progEnemigo = (p.estado === "investigando") ? "extraido" : ((p.efectoEnemigo && p.efectoEnemigo.trim()) ? "confirmado" : "desconocido");
          }
          if(!p.progCherk){
            p.progCherk = (p.estado === "investigando") ? "extraido" : ((p.efectoCherk && p.efectoCherk.trim()) ? "confirmado" : "desconocido");
          }
          if(!p.type) p.type = "Veneno";
          if(!p.rarity) p.rarity = "Común";
          if(p.materiaPrimaQty === undefined) p.materiaPrimaQty = 0;
          if(!p.catalogId && typeof ALCHEMY_CATALOG !== "undefined"){
            var mCat = ALCHEMY_CATALOG.find(function(cat){
              return (cat.name||'').trim().toLowerCase() === (p.name||'').trim().toLowerCase() ||
                     (cat.loreRefTitle||'').trim().toLowerCase() === (p.name||'').trim().toLowerCase();
            });
            if(mCat){
              p.catalogId = mCat.id;
              p.type = mCat.type;
              p.rarity = mCat.rarity;
            }
          }
        });
      }
    });
    s.officialDataVersion = 7;
  }

  // 12. Migración v8: Refresco de datos de prueba asimétricos para Alquimia (Cherk)
  if(!s.officialDataVersion || s.officialDataVersion < 8){
    (s.characters || []).forEach(function(c){
      if(c.id === "char_cherk" && Array.isArray(c.poisons)){
        var cactus = c.poisons.find(function(p){ return p.catalogId === "subst_cactus" || (p.name||'').toLowerCase() === "cactus"; });
        if(cactus){
          cactus.progEnemigo = "probado";
          cactus.progCherk = "identificado";
          cactus.efectoEnemigo = "Espasmos musculares intensos y -4 a movilidad del objetivo";
          cactus.efectoCherk = "";
          cactus.notasInvestigacion = "Efecto ofensivo verificado en combate. Cherk aún no se ha atrevido a ingerir una muestra.";
        }
        var flor = c.poisons.find(function(p){ return p.catalogId === "subst_flor_sombra" || (p.name||'').toLowerCase() === "flor de sombra"; });
        if(flor){
          flor.progEnemigo = "extraido";
          flor.progCherk = "confirmado";
          flor.efectoEnemigo = "";
          flor.efectoCherk = "Visión en la oscuridad (20 min)";
          flor.notasInvestigacion = "Asimilada con éxito en organismo Cherk. Pendiente probar toxina en rivales.";
        }
      }
    });
    s.officialDataVersion = 8;
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
    var savedActiveDbId = localStorage.getItem("krysalis_active_db_id");
    var savedActiveName = localStorage.getItem("krysalis_active_name");

    if(loaded && loaded.characters && loaded.characters.length){
      var matched = null;
      if(savedActiveId){
        matched = loaded.characters.find(function(x){ return x.id === savedActiveId || x.db_id === savedActiveId; });
      }
      if(!matched && savedActiveDbId){
        matched = loaded.characters.find(function(x){ return x.db_id === savedActiveDbId || x.id === savedActiveDbId; });
      }
      if(!matched && savedActiveName){
        matched = loaded.characters.find(function(x){ return x.name && x.name.trim().toLowerCase() === savedActiveName.trim().toLowerCase(); });
      }
      if(matched){
        loaded.activeId = matched.id;
      }
    }
    var urlParams = (typeof URLSearchParams !== "undefined" && typeof window !== "undefined" && window.location) ? new URLSearchParams(window.location.search) : null;
    var tabParam = urlParams ? urlParams.get("tab") : null;
    if(tabParam){
      loaded.activeTab = tabParam;
    } else {
      var savedTab = localStorage.getItem("krysalis_active_tab");
      if(savedTab){
        loaded.activeTab = savedTab;
      }
    }
    var charParam = urlParams ? (urlParams.get("char") || urlParams.get("character")) : null;
    if(charParam){
      var matchP = (loaded.characters || []).find(function(ch){
        return ch.id === charParam || (ch.name && ch.name.toLowerCase() === charParam.toLowerCase());
      });
      if(matchP) loaded.activeId = matchP.id;
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
  if(!skill || !c) return 0;
  var total = skillBase(skill, c) + num(c.skillBonus ? c.skillBonus[skill.id] : 0, 0);

  // Buffs específicos de combate en c.buffs
  if(c.buffs){
    if(skill.id === "melee" && c.buffs.sangre_ataque_melee) total += 1;
    if(skill.id === "distancia" && c.buffs.sangre_ataque_dist) total += 1;
  }

  // Buffs activos para la habilidad concreta o tags de combate (sin duplicar atributo ya sumado en getEffectiveAttr)
  if(c.activeBuffs){
    c.activeBuffs.forEach(function(ab){
      if(ab.active === false) return;
      var bonusNum = parseFloat(ab.bonus);
      if(isNaN(bonusNum) || bonusNum === 0) return;
      if(ab.attr === skill.id ||
         (skill.id === "melee" && (ab.attr === "melé" || ab.attr === "melee" || ab.attr === "ataque")) ||
         (skill.id === "distancia" && (ab.attr === "distancia" || ab.attr === "ataque"))){
        total += bonusNum;
      }
    });
  }

  // Hechizos activos para la habilidad concreta o tags de combate
  if(c.spells){
    c.spells.forEach(function(sp){
      if(sp.active && sp.statAttr && sp.statMod){
        var stacks = Math.max(1, num(sp.activeStacks, 1));
        var spNum = parseFloat(sp.statMod);
        if(!isNaN(spNum) && spNum !== 0){
          if(sp.statAttr === skill.id ||
             (skill.id === "melee" && (sp.statAttr === "melé" || sp.statAttr === "melee" || sp.statAttr === "ataque")) ||
             (skill.id === "distancia" && (sp.statAttr === "distancia" || sp.statAttr === "ataque"))){
            total += spNum * stacks;
          }
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
  if(c.buffs && c.buffs.mono && !isShield){
    base -= 1;
  }
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

function customSkillTotal(cs, c){
  if(!cs || !c) return 0;
  var total = getEffectiveAttr(cs.attr || "destreza", c) + num(cs.bonus, 0);
  if(c.activeBuffs){
    c.activeBuffs.forEach(function(ab){
      if(ab.active === false) return;
      var b = parseFloat(ab.bonus);
      if(!isNaN(b) && ab.attr === cs.id) total += b;
    });
  }
  if(c.spells){
    c.spells.forEach(function(sp){
      if(sp.active && sp.statAttr === cs.id && sp.statMod){
        var stacks = Math.max(1, num(sp.activeStacks, 1));
        var sm = parseFloat(sp.statMod);
        if(!isNaN(sm)) total += sm * stacks;
      }
    });
  }
  return total;
}

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

