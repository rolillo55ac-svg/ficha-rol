// ============================================================================
// SISTEMA EXPERIMENTAL "LA CASA" (PROTOTIPO BETA)
// Módulo 100% aislado: js/house.js
// Rediseño UX: Plano por Plantas, Muebles con Almacenamiento, Buffs Evolutivos
// y Controles Rápidos de Posicionamiento para el Director de Juego.
// ============================================================================

var CONFIG_ENABLE_HOUSE = true;

var houseState = {
  active: false,
  previousTab: "ficha",
  selectedRoomId: null,
  activeFloor: 1,
  inspectorTab: "estancia", // "estancia" | "muebles" | "buffs"
  loading: false,
  house: null,
  rooms: [],
  upgrades: [],
  events: [],
  editMode: false
};

// ============================================================================
// 1. SEMILLA LOCAL Y PERSISTENCIA
// ============================================================================
function getSeedHouseData(){
  var houseId = "h0000000-0000-0000-0000-000000000001";
  var salonId = "r0000000-0000-0000-0000-000000000001";
  var cocinaId = "r0000000-0000-0000-0000-000000000002";
  var cherkRoomId = "r0000000-0000-0000-0000-000000000003";

  return {
    house: {
      id: houseId,
      campaign_id: "c0000000-0000-0000-0000-000000000001",
      name: "La Casa Andante",
      description: "Un antiguo hogar nómada encantado que viaja entre tierras guiado por un libro sapiente.",
      level: 1,
      progress_current: 0,
      progress_max: 100,
      confort: 1,
      confort_progress: 0,
      confort_max: 10,
      arcana: 1,
      arcana_progress: 0,
      arcana_max: 10,
      provisiones: 1,
      provisiones_progress: 0,
      provisiones_max: 10,
      custodia: 1,
      custodia_progress: 0,
      custodia_max: 10,
      vinculo: 1,
      vinculo_progress: 0,
      vinculo_max: 10
    },
    rooms: [
      // PLANTA 1: Estancias Comunes y Aposentos Principales
      {
        id: salonId,
        house_id: houseId,
        room_type: "salon",
        name: "Salón del Hogar Caliente",
        owner_character_id: null,
        level: 1,
        description: "Espaciosa sala central con chimenea encantada, sillones de terciopelo gastado y un atril donde reposa el Libro Guía.",
        pos_x: 0, pos_y: 0, width: 3, height: 2, floor: 1,
        furniture: [
          {
            id: "fur_salon_1",
            name: "Librería y Atril del Libro Viviente",
            type: "libreria",
            items: [
              { name: "Crónicas de Krysalis (Tomo I)", qty: 1, notes: "Relatos de las primeras leyendas." }
            ]
          }
        ]
      },
      {
        id: cocinaId,
        house_id: houseId,
        room_type: "cocina",
        name: "Cocina del Caldero Errante",
        owner_character_id: null,
        level: 1,
        description: "Cocina rústica donde el fuego nunca se apaga. Huele a especias raras y caldo caliente.",
        pos_x: 3, pos_y: 0, width: 3, height: 2, floor: 1,
        furniture: [
          {
            id: "fur_cocina_1",
            name: "Alacena de Roble Encantado",
            type: "alacena",
            items: [
              { name: "Especias del Bosque Negro", qty: 3, notes: "Realza el sabor y valor nutritivo." },
              { name: "Ración de viaje curada", qty: 6, notes: "Alimento imperecedero." }
            ]
          }
        ]
      },
      {
        id: cherkRoomId,
        house_id: houseId,
        room_type: "habitacion_personal",
        name: "Rincón Botánico de Cherk",
        owner_character_id: "a8039428-8ee7-4e31-baba-c6a1d8b6d8f3",
        level: 1,
        description: "Habitación húmeda y sombría repleta de frascos con musgos, nenúfares y brotes venenosos.",
        pos_x: 0, pos_y: 2, width: 3, height: 2, floor: 1,
        furniture: [
          {
            id: "fur_cherk_1",
            name: "Estantería de Frascos y Musgos",
            type: "estanteria",
            items: [
              { name: "Seta terrosa recolectada", qty: 2, notes: "Para ungüentos botánicos." },
              { name: "Frasco de savia espesa", qty: 1, notes: "Cosechada cerca del río." }
            ]
          },
          {
            id: "fur_cherk_2",
            name: "Baúl de Viaje",
            type: "baul",
            items: [
              { name: "Cuerda de cáñamo resistente", qty: 1, notes: "10 metros con nudos." }
            ]
          }
        ]
      },
      {
        id: "r0000000-0000-0000-0000-000000000004",
        house_id: houseId,
        room_type: "habitacion_personal",
        name: "Aposentos de Scarleth",
        owner_character_id: "5e9c545e-176a-4e99-a3e7-299f89fa0779",
        level: 1,
        description: "Estancia silenciosa con estanterías de pergaminos, velas violetas y un escritorio ordenado.",
        pos_x: 3, pos_y: 2, width: 3, height: 2, floor: 1,
        furniture: [
          {
            id: "fur_scarleth_1",
            name: "Escritorio de Pergaminos Arcanos",
            type: "escritorio",
            items: [
              { name: "Tinta violeta encantada", qty: 2, notes: "Brilla suavemente en la oscuridad." }
            ]
          }
        ]
      },

      // PLANTA 2: Planta Alta / Habitaciones Superiores
      {
        id: "r0000000-0000-0000-0000-000000000005",
        house_id: houseId,
        room_type: "habitacion_personal",
        name: "Cuarto de Derek",
        owner_character_id: "d9dee50e-051d-4058-b4a5-d46c809fbb25",
        level: 1,
        description: "Habitación robusta con armero de madera pulida, afiladores de espadas y correajes.",
        pos_x: 0, pos_y: 0, width: 3, height: 2, floor: 2,
        furniture: [
          {
            id: "fur_derek_1",
            name: "Armero de Madera Reforzada",
            type: "armero",
            items: [
              { name: "Piedra de afilar de grano fino", qty: 1, notes: "Mantiene los filos impecables." }
            ]
          }
        ]
      },
      {
        id: "r0000000-0000-0000-0000-000000000006",
        house_id: houseId,
        room_type: "habitacion_personal",
        name: "Taller de Bucky",
        owner_character_id: "4d8dd9b1-b5aa-430e-ae19-79c35b6c3c5e",
        level: 1,
        description: "Espacio lleno de herramientas curiosas, engranajes y pieles de animales curtidas.",
        pos_x: 3, pos_y: 0, width: 3, height: 2, floor: 2,
        furniture: [
          {
            id: "fur_bucky_1",
            name: "Banco de Trabajo y Herramientas",
            type: "banco",
            items: [
              { name: "Caja de clavos y engranajes", qty: 1, notes: "Piezas de repuesto." }
            ]
          }
        ]
      },
      {
        id: "r0000000-0000-0000-0000-000000000007",
        house_id: houseId,
        room_type: "habitacion_personal",
        name: "Estudio de Ink",
        owner_character_id: "ece1cdb6-f8c6-4010-b3e8-045887dc92a3",
        level: 1,
        description: "Estancia con bocetos en las paredes, tinta aromática y cojines para el descanso.",
        pos_x: 0, pos_y: 2, width: 3, height: 2, floor: 2,
        furniture: [
          {
            id: "fur_ink_1",
            name: "Cofre de Bocetos y Lienzos",
            type: "baul",
            items: [
              { name: "Pliego de papel satinado", qty: 5, notes: "Para mapas y retratos." }
            ]
          }
        ]
      }
    ],
    upgrades: [
      {
        id: "u0000000-0000-0000-0000-000000000001",
        house_id: houseId,
        room_id: cocinaId,
        name: "Horno Encantado",
        description: "Mantiene la comida caliente de forma mágica y realza las propiedades nutritivas.",
        unlocked: false,
        level: 1,
        bonus_value: "+1",
        effect_type: "buff",
        buff_id: "buff_comida_reconfortante",
        required_house_level: 1
      },
      {
        id: "u0000000-0000-0000-0000-000000000002",
        house_id: houseId,
        room_id: cherkRoomId,
        name: "Invernadero de Hongos y Venenos",
        description: "Permite cultivar especies vegetales tóxicas con mayor efectividad en cada descanso.",
        unlocked: false,
        level: 1,
        bonus_value: "Cosecha Nv.1",
        effect_type: "narrativo",
        buff_id: null,
        required_house_level: 1
      }
    ],
    events: [
      {
        id: "e0000000-0000-0000-0000-000000000001",
        house_id: houseId,
        event_type: "level_up",
        payload: { message: "La Casa Andante ha despertado a su nivel inicial 1." },
        created_at: new Date().toISOString()
      }
    ]
  };
}

function loadHouseLocalData(){
  try {
    var raw = localStorage.getItem("krysalis_house_beta_v1");
    if(raw){
      var parsed = JSON.parse(raw);
      if(parsed && parsed.house && Array.isArray(parsed.rooms)){
        houseState.house = parsed.house;
        houseState.rooms = parsed.rooms;
        houseState.upgrades = parsed.upgrades || [];
        houseState.events = parsed.events || [];
        ensureSeedBuffsRegistered();
        return;
      }
    }
  } catch(e){
    console.warn("Aviso cargando datos locales de La Casa:", e);
  }

  var seed = getSeedHouseData();
  houseState.house = seed.house;
  houseState.rooms = seed.rooms;
  houseState.upgrades = seed.upgrades;
  houseState.events = seed.events;
  ensureSeedBuffsRegistered();
  saveHouseLocalData();
}

function saveHouseLocalData(){
  try {
    var payload = {
      house: houseState.house,
      rooms: houseState.rooms,
      upgrades: houseState.upgrades,
      events: houseState.events
    };
    localStorage.setItem("krysalis_house_beta_v1", JSON.stringify(payload));
  } catch(e){
    console.warn("No se pudo guardar localmente La Casa:", e);
  }
}

function ensureSeedBuffsRegistered(){
  if(typeof state === "undefined" || !state) return;
  if(!Array.isArray(state.buffCatalog)) state.buffCatalog = [];

  var defaultHouseBuffs = [
    {
      id: "buff_comida_reconfortante",
      name: "Comida Reconfortante (La Casa)",
      type: "buff",
      attr: "todo",
      bonus: "+1",
      duration: "permanent",
      durationTurns: 0,
      desc: "Beneficio de comer en la Cocina con Horno Encantado de La Casa. +1 a todas las tiradas.",
      visible: true,
      source: "house"
    }
  ];

  var addedAny = false;
  defaultHouseBuffs.forEach(function(hb){
    var exists = state.buffCatalog.some(function(b){ return b.id === hb.id; });
    if(!exists){
      state.buffCatalog.push(hb);
      addedAny = true;
    }
  });

  if(addedAny && typeof saveState === "function"){
    saveState(true);
  }
}

async function fetchHouseRemoteData(){
  if(typeof supabaseClient === "undefined" || !supabaseClient || !navigator.onLine){
    loadHouseLocalData();
    return;
  }

  try {
    houseState.loading = true;
    var campaignId = "c0000000-0000-0000-0000-000000000001";

    var houseRes = await supabaseClient.from("house").select("*").eq("campaign_id", campaignId).maybeSingle();
    if(houseRes.error || !houseRes.data){
      loadHouseLocalData();
      houseState.loading = false;
      return;
    }
    houseState.house = houseRes.data;

    var roomsRes = await supabaseClient.from("house_rooms").select("*").eq("house_id", houseState.house.id).order("created_at", { ascending: true });
    if(!roomsRes.error && roomsRes.data && roomsRes.data.length > 0){
      houseState.rooms = roomsRes.data;
    }

    var upgRes = await supabaseClient.from("house_upgrades").select("*").eq("house_id", houseState.house.id);
    if(!upgRes.error && upgRes.data){
      houseState.upgrades = upgRes.data;
    }

    var evRes = await supabaseClient.from("house_events").select("*").eq("house_id", houseState.house.id).order("created_at", { ascending: false }).limit(25);
    if(!evRes.error && evRes.data){
      houseState.events = evRes.data;
    }

    ensureSeedBuffsRegistered();
    saveHouseLocalData();
  } catch(err){
    console.warn("Error cargando La Casa desde Supabase, usando local:", err);
    loadHouseLocalData();
  } finally {
    houseState.loading = false;
  }
}

// ============================================================================
// 2. AUXILIARES Y PERMISOS
// ============================================================================
function getRoomOwnerInfo(ownerCharId){
  if(!ownerCharId) return null;
  var chars = (typeof state !== "undefined" && state.characters) ? state.characters : [];
  var target = chars.find(function(c){
    return c.id === ownerCharId || c.db_id === ownerCharId;
  });
  if(target) return target;

  if(ownerCharId.includes("cherk") || ownerCharId.includes("a803")) return { name: "Cherk", portrait: "https://raw.githubusercontent.com/rolillo55ac-svg/ficha-rol/main/images/personajes/cherk.jpg" };
  if(ownerCharId.includes("scarleth") || ownerCharId.includes("5e9c")) return { name: "Scarleth", portrait: null };
  if(ownerCharId.includes("derek") || ownerCharId.includes("d9de")) return { name: "Derek", portrait: null };
  if(ownerCharId.includes("bucky") || ownerCharId.includes("4d8d")) return { name: "Bucky", portrait: null };
  if(ownerCharId.includes("ink") || ownerCharId.includes("ece1")) return { name: "Ink", portrait: null };

  return { name: "Personaje (" + ownerCharId.slice(0, 8) + ")", portrait: null };
}

function canUserEditRoom(room){
  if(typeof isGM === "function" && isGM()) return true;
  if(!room || !room.owner_character_id) return false;

  var curChar = (typeof activeChar === "function") ? activeChar() : null;
  if(curChar){
    if(curChar.id === room.owner_character_id || curChar.db_id === room.owner_character_id){
      return true;
    }
    var cName = (curChar.name || "").toLowerCase();
    var rOwnerInfo = getRoomOwnerInfo(room.owner_character_id);
    if(rOwnerInfo && rOwnerInfo.name && cName.includes(rOwnerInfo.name.toLowerCase())){
      return true;
    }
  }
  return false;
}

function getRoomTypeIcon(type){
  switch(type){
    case "cocina": return "🍲";
    case "salon": return "🔥";
    case "habitacion_personal": return "🛏️";
    case "habitacion_comun": return "🏛️";
    case "pasillo": return "🬸";
    case "bodega": return "🍷";
    case "taller": return "⚙️";
    case "biblioteca": return "📚";
    default: return "🚪";
  }
}

function getRoomTypeLabel(type){
  switch(type){
    case "cocina": return "Cocina";
    case "salon": return "Salón";
    case "habitacion_personal": return "Personal";
    case "habitacion_comun": return "Común";
    case "pasillo": return "Pasillo";
    case "bodega": return "Bodega";
    case "taller": return "Taller";
    case "biblioteca": return "Biblioteca";
    default: return "Especial";
  }
}

function getFurnitureIcon(type){
  switch(type){
    case "libreria": return "📚";
    case "alacena": return "🍯";
    case "estanteria": return "🧪";
    case "baul": return "🧰";
    case "escritorio": return "📜";
    case "armero": return "⚔️";
    case "banco": return "🔨";
    case "cama": return "🛏️";
    case "mesa": return "🪵";
    case "sillon": return "🛋️";
    case "cofre": return "📦";
    default: return "📦";
  }
}

var HOUSE_DECOR_CATALOG = [
  { type: "alfombra", icon: "🧶", label: "Alfombra tejida" },
  { type: "planta", icon: "🌿", label: "Planta silvestre" },
  { type: "vela", icon: "🕯️", label: "Vela encantada" },
  { type: "cuadro", icon: "🖼️", label: "Tapiz del mapa" },
  { type: "cofre", icon: "📦", label: "Cofre ornamental" },
  { type: "telarana", icon: "🕸️", label: "Telaraña misteriosa" },
  { type: "antorcha", icon: "🔥", label: "Antorcha de pared" },
  { type: "trofeo", icon: "💀", label: "Trofeo de caza" }
];

// ============================================================================
// 3. PROGRESIÓN ATÓMICA
// ============================================================================
async function addHouseProgress(amount, statName){
  var gmMode = (typeof isGM === "function" && isGM());
  if(!gmMode && currentUser){
    if(typeof showToast === "function") showToast("Solo el Director de Juego puede otorgar progreso a la casa.", "warning");
    return;
  }

  var h = houseState.house;
  if(!h) return;

  var actorId = (typeof currentUser !== "undefined" && currentUser) ? currentUser.id : null;
  var isRemote = (typeof supabaseClient !== "undefined" && supabaseClient && h.id && navigator.onLine);

  if(isRemote){
    try {
      var rpcRes = await supabaseClient.rpc("add_house_progress", {
        p_house_id: h.id,
        p_amount: amount,
        p_stat_name: (statName === "general" ? null : statName),
        p_actor_id: actorId
      });

      if(rpcRes && !rpcRes.error && rpcRes.data && rpcRes.data.house){
        houseState.house = rpcRes.data.house;
        var evRes = await supabaseClient.from("house_events").select("*").eq("house_id", h.id).order("created_at", { ascending: false }).limit(25);
        if(!evRes.error && evRes.data) houseState.events = evRes.data;

        saveHouseLocalData();
        renderHouseView();
        if(typeof showToast === "function") showToast("Progreso sincronizado en la nube.", "success");
        return;
      }
    } catch(errRpc){
      console.warn("Fallo RPC add_house_progress, aplicando cálculo local:", errRpc);
    }
  }

  // Fallback local
  var didLevelUp = false;
  var didStatUp = false;

  if(!statName || statName === "general"){
    var newProg = Math.max(0, (h.progress_current || 0) + amount);
    var newMax = Math.max(10, h.progress_max || 100);
    var newLvl = h.level || 1;

    while(newProg >= newMax){
      newLvl++;
      newProg -= newMax;
      newMax += 50;
      didLevelUp = true;
      houseState.events.unshift({
        id: "e_" + Date.now() + "_" + Math.random(),
        house_id: h.id,
        event_type: "level_up",
        payload: { message: "¡La Casa Andante ha alcanzado el Nivel " + newLvl + "!", level: newLvl },
        created_at: new Date().toISOString()
      });
    }

    if(!didLevelUp && amount !== 0){
      houseState.events.unshift({
        id: "e_" + Date.now() + "_" + Math.random(),
        house_id: h.id,
        event_type: "progress_gain",
        payload: { message: "Progreso general incrementado en " + amount + " pts." },
        created_at: new Date().toISOString()
      });
    }

    h.level = newLvl;
    h.progress_current = newProg;
    h.progress_max = newMax;

    if(didLevelUp && typeof showToast === "function"){
      showToast("¡La Casa Andante ha subido al Nivel " + newLvl + "! 🎉", "success");
    } else if(typeof showToast === "function"){
      showToast("Progreso general: " + (amount > 0 ? "+" : "") + amount + " pts.", "info");
    }
  } else {
    var pKey = statName + "_progress";
    var mKey = statName + "_max";
    var sProg = Math.max(0, (h[pKey] || 0) + amount);
    var sMax = Math.max(5, h[mKey] || 10);
    var sVal = h[statName] || 1;

    while(sProg >= sMax){
      sVal++;
      sProg -= sMax;
      sMax += 5;
      didStatUp = true;
      houseState.events.unshift({
        id: "e_" + Date.now() + "_" + Math.random(),
        house_id: h.id,
        event_type: "stat_gain",
        payload: { message: "¡" + statName.toUpperCase() + " ha subido a Nivel " + sVal + "!" },
        created_at: new Date().toISOString()
      });
    }

    h[statName] = sVal;
    h[pKey] = sProg;
    h[mKey] = sMax;

    if(didStatUp && typeof showToast === "function"){
      showToast("¡" + statName.toUpperCase() + " mejoró a Nivel " + sVal + "! ⭐", "success");
    } else if(typeof showToast === "function"){
      showToast(statName.toUpperCase() + ": +" + amount + " pts de progreso.", "info");
    }
  }

  saveHouseLocalData();
  renderHouseView();
}

// Subir nivel directo a una habitación
async function grantRoomLevel(roomId){
  var r = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!r) return;

  r.level = (r.level || 1) + 1;
  saveHouseLocalData();
  renderHouseView();

  if(typeof showToast === "function") showToast("¡" + r.name + " subió a Nivel " + r.level + "! 🌟", "success");

  if(typeof supabaseClient !== "undefined" && supabaseClient && r.id){
    try {
      await supabaseClient.from("house_rooms").update({ level: r.level, updated_at: new Date().toISOString() }).eq("id", r.id);
    } catch(e){}
  }
}

// ============================================================================
// 4. MEJORAS Y BUFFS EVOLUTIVOS
// ============================================================================
async function toggleHouseUpgrade(upgradeId, newStatus){
  var gmMode = (typeof isGM === "function" && isGM());
  if(!gmMode && currentUser){
    if(typeof showToast === "function") showToast("Solo el Director de Juego puede desbloquear mejoras.", "warning");
    return;
  }

  var upg = (houseState.upgrades || []).find(function(x){ return x.id === upgradeId; });
  if(!upg) return;

  upg.unlocked = !!newStatus;
  var actorId = (typeof currentUser !== "undefined" && currentUser) ? currentUser.id : null;

  houseState.events.unshift({
    id: "e_" + Date.now(),
    house_id: houseState.house ? houseState.house.id : null,
    event_type: upg.unlocked ? "unlock_upgrade" : "lock_upgrade",
    payload: { message: (upg.unlocked ? "Mejora desbloqueada: " : "Mejora bloqueada: ") + upg.name },
    created_at: new Date().toISOString()
  });

  saveHouseLocalData();
  renderHouseView();

  if(typeof showToast === "function"){
    showToast(upg.unlocked ? "Mejora '" + upg.name + "' desbloqueada." : "Mejora bloqueada.", upg.unlocked ? "success" : "info");
  }

  if(typeof supabaseClient !== "undefined" && supabaseClient && navigator.onLine){
    try {
      await supabaseClient.rpc("toggle_house_upgrade", {
        p_upgrade_id: upgradeId,
        p_unlocked: upg.unlocked,
        p_actor_id: actorId
      });
    } catch(e){
      try {
        await supabaseClient.from("house_upgrades").update({ unlocked: upg.unlocked, updated_at: new Date().toISOString() }).eq("id", upgradeId);
      } catch(e2){}
    }
  }
}

// Subir nivel de un buff/mejora (Buff Evolutivo)
async function levelUpHouseUpgrade(upgradeId){
  var gmMode = (typeof isGM === "function" && isGM());
  if(!gmMode && currentUser){
    if(typeof showToast === "function") showToast("Solo el Director de Juego puede levelear mejoras.", "warning");
    return;
  }

  var upg = (houseState.upgrades || []).find(function(x){ return x.id === upgradeId; });
  if(!upg) return;

  upg.level = (upg.level || 1) + 1;

  // Si tiene un buff asociado, evolucionar el bonus en el catálogo
  if(upg.buff_id && typeof state !== "undefined" && state.buffCatalog){
    var buffItem = state.buffCatalog.find(function(b){ return b.id === upg.buff_id; });
    if(buffItem){
      var curNum = parseInt(buffItem.bonus.replace(/[^0-9]/g, ""), 10) || 1;
      buffItem.bonus = "+" + (curNum + 1);
      upg.bonus_value = buffItem.bonus;
      if(typeof saveState === "function") saveState(true);
    }
  } else {
    upg.bonus_value = "Nv. " + upg.level;
  }

  houseState.events.unshift({
    id: "e_" + Date.now(),
    house_id: houseState.house ? houseState.house.id : null,
    event_type: "upgrade_level_up",
    payload: { message: "Mejora '" + upg.name + "' evolucionó a Nivel " + upg.level + " (" + (upg.bonus_value || "") + ")" },
    created_at: new Date().toISOString()
  });

  saveHouseLocalData();
  renderHouseView();

  if(typeof showToast === "function"){
    showToast("¡Mejora '" + upg.name + "' subió a Nivel " + upg.level + "! ✨ (" + (upg.bonus_value || "") + ")", "success");
  }

  if(typeof supabaseClient !== "undefined" && supabaseClient && upg.id){
    try {
      await supabaseClient.from("house_upgrades").update({
        level: upg.level,
        bonus_value: upg.bonus_value,
        updated_at: new Date().toISOString()
      }).eq("id", upg.id);
    } catch(e){}
  }
}

// Aplicar buff de una mejora de la casa al personaje activo
function applyHouseBuffToActiveChar(buffId){
  if(typeof activeChar !== "function"){
    if(typeof showToast === "function") showToast("No hay personaje activo seleccionado.", "error");
    return;
  }

  var c = activeChar();
  if(!c){
    if(typeof showToast === "function") showToast("Selecciona un personaje para recibir el buff.", "error");
    return;
  }

  var bCatalog = (typeof state !== "undefined" && state.buffCatalog) ? state.buffCatalog : [];
  var bDef = bCatalog.find(function(b){ return b.id === buffId; });

  if(!bDef){
    if(typeof showToast === "function") showToast("Buff no encontrado en el catálogo.", "error");
    return;
  }

  if(!c.activeBuffs) c.activeBuffs = [];
  var alreadyHas = c.activeBuffs.some(function(ab){ return ab.id === buffId; });

  if(alreadyHas){
    if(typeof showToast === "function") showToast(c.name + " ya tiene activo el buff '" + bDef.name + "'.", "info");
    return;
  }

  var newBuff = {
    id: bDef.id,
    name: bDef.name,
    type: bDef.type || "buff",
    bonus: bDef.bonus || "+1",
    attr: bDef.attr || "todo",
    active: true,
    shieldGranted: 0
  };

  c.activeBuffs.push(newBuff);
  if(typeof manageListItemRPC === "function") manageListItemRPC(c, "activeBuffs", "add", newBuff);
  if(typeof saveState === "function") saveState(true);

  if(typeof showToast === "function"){
    showToast("¡Buff '" + bDef.name + "' otorgado y activado en " + c.name + "! ✨", "success");
  }

  renderHouseView();
}

// ============================================================================
// 5. MOVIMIENTO RÁPIDO, REDIMENSIONADO Y DRAG & DROP PARA GM
// ============================================================================
var HOUSE_GRID_COLS = 6;
var HOUSE_GRID_ROW_HEIGHT = 105;
var HOUSE_GRID_GAP = 12;

// Comprobación de colisiones AABB 2D y límites de la planta
function checkRoomCollision(floor, excludeRoomId, targetX, targetY, targetW, targetH){
  // 1. Límites horizontales y verticales
  if(targetX < 0 || (targetX + targetW) > HOUSE_GRID_COLS || targetY < 0){
    return true; // Fuera de límites
  }
  if(targetW < 1 || targetH < 1){
    return true;
  }

  // 2. Colisión con otras estancias de la misma planta
  var sameFloorRooms = (houseState.rooms || []).filter(function(r){
    return (r.floor || 1) === floor && r.id !== excludeRoomId;
  });

  for(var i = 0; i < sameFloorRooms.length; i++){
    var o = sameFloorRooms[i];
    var ox = o.pos_x || 0;
    var oy = o.pos_y || 0;
    var ow = o.width || 2;
    var oh = o.height || 2;

    var overlapX = (targetX < ox + ow) && (targetX + targetW > ox);
    var overlapY = (targetY < oy + oh) && (targetY + targetH > oy);

    if(overlapX && overlapY){
      return true; // Colisión detectada
    }
  }

  return false;
}

// Previsualización fantasma en la cuadrícula durante el arrastre/redimensionado
function updateGhostPreview(roomId, targetX, targetY, targetW, targetH, isValid){
  var canvas = document.getElementById("houseGridCanvas");
  if(!canvas) return;

  var ghost = document.getElementById("houseGridGhost");
  if(!ghost){
    ghost = document.createElement("div");
    ghost.id = "houseGridGhost";
    ghost.className = "house-grid-ghost";
    canvas.appendChild(ghost);
  }

  var colStart = Math.max(1, targetX + 1);
  var colSpan = Math.max(1, targetW);
  var rowStart = Math.max(1, targetY + 1);
  var rowSpan = Math.max(1, targetH);

  ghost.style.gridColumn = colStart + " / span " + colSpan;
  ghost.style.gridRow = rowStart + " / span " + rowSpan;

  if(!isValid){
    ghost.classList.add("collision");
    ghost.innerHTML = "<span>⚠️ Ocupado (" + targetW + "x" + targetH + ")</span>";
  } else {
    ghost.classList.remove("collision");
    ghost.innerHTML = "<span>(" + targetX + ", " + targetY + " · " + targetW + "x" + targetH + ")</span>";
  }
}

function removeGhostPreview(){
  var ghost = document.getElementById("houseGridGhost");
  if(ghost && ghost.parentNode){
    ghost.parentNode.removeChild(ghost);
  }
}

// FASE 5: Guías de alineación visual (Snapping Visual Figma-like)
function updateAlignmentGuides(currentX, currentY, width, height, floor, excludeRoomId){
  var canvas = document.getElementById("houseGridCanvas");
  if(!canvas) return;

  removeAlignmentGuides();

  var floorRooms = (houseState.rooms || []).filter(function(r){
    return (r.floor || 1) === floor && r.id !== excludeRoomId;
  });

  var alignX = false;
  var alignY = false;

  for(var i = 0; i < floorRooms.length; i++){
    var o = floorRooms[i];
    var ox = o.pos_x || 0;
    var oy = o.pos_y || 0;
    var ow = o.width || 2;
    var oh = o.height || 2;

    if(currentX === ox || (currentX + width) === (ox + ow) || currentX === (ox + ow) || (currentX + width) === ox){
      alignX = true;
    }
    if(currentY === oy || (currentY + height) === (oy + oh) || currentY === (oy + oh) || (currentY + height) === oy){
      alignY = true;
    }
  }

  if(alignX){
    var gY = document.createElement("div");
    gY.className = "house-align-guide-y";
    var effectiveCanvasWidth = canvas.clientWidth - 12;
    if(effectiveCanvasWidth <= 0) effectiveCanvasWidth = canvas.scrollWidth - 12;
    var stepX = (effectiveCanvasWidth + HOUSE_GRID_GAP) / HOUSE_GRID_COLS;
    gY.style.left = (currentX * stepX + 6) + "px";
    canvas.appendChild(gY);
  }
  if(alignY){
    var gX = document.createElement("div");
    gX.className = "house-align-guide-x";
    var stepY = HOUSE_GRID_ROW_HEIGHT + HOUSE_GRID_GAP;
    gX.style.top = (currentY * stepY + 6) + "px";
    canvas.appendChild(gX);
  }
}

function removeAlignmentGuides(){
  var guides = document.querySelectorAll(".house-align-guide-x, .house-align-guide-y");
  for(var i = 0; i < guides.length; i++){
    if(guides[i].parentNode) guides[i].parentNode.removeChild(guides[i]);
  }
}

// FASE 2: Detección Dinámica de Muros Exteriores y Paredes Interiores
function getRoomWallClasses(r, floorRooms){
  var x = r.pos_x || 0;
  var y = r.pos_y || 0;
  var w = r.width || 2;
  var h = r.height || 2;

  var hasTop = false;
  var hasRight = false;
  var hasBottom = false;
  var hasLeft = false;

  for(var i = 0; i < floorRooms.length; i++){
    var o = floorRooms[i];
    if(o.id === r.id) continue;
    var ox = o.pos_x || 0;
    var oy = o.pos_y || 0;
    var ow = o.width || 2;
    var oh = o.height || 2;

    var overlapX = (x < ox + ow) && (x + w > ox);
    var overlapY = (y < oy + oh) && (y + h > oy);

    if(overlapX && (oy + oh === y)) hasTop = true;
    if(overlapX && (y + h === oy)) hasBottom = true;
    if(overlapY && (ox + ow === x)) hasLeft = true;
    if(overlapY && (x + w === ox)) hasRight = true;
  }

  var classes = [];
  classes.push(hasTop ? "wall-shared-top" : "wall-outer-top");
  classes.push(hasRight ? "wall-shared-right" : "wall-outer-right");
  classes.push(hasBottom ? "wall-shared-bottom" : "wall-outer-bottom");
  classes.push(hasLeft ? "wall-shared-left" : "wall-outer-left");

  return classes.join(" ");
}

// FASE 2: Creación Rápida de Pasillo
function createHouseCorridorAction(){
  if(!(typeof isGM === "function" && isGM())) return;

  var curFloor = houseState.activeFloor || 1;
  var targetX = 0;
  var targetY = 0;
  var found = false;

  for(var y = 0; y < 10; y++){
    for(var x = 0; x < HOUSE_GRID_COLS; x++){
      if(!checkRoomCollision(curFloor, null, x, y, 1, 1)){
        targetX = x;
        targetY = y;
        found = true;
        break;
      }
    }
    if(found) break;
  }

  var newCorridor = {
    id: "r_corr_" + Date.now(),
    house_id: houseState.house ? houseState.house.id : "h0000000-0000-0000-0000-000000000001",
    room_type: "pasillo",
    name: "Pasillo",
    owner_character_id: null,
    level: 1,
    description: "Zona de paso y conexión entre estancias.",
    pos_x: targetX,
    pos_y: targetY,
    width: 1,
    height: 1,
    floor: curFloor,
    furniture: [],
    decor: []
  };

  houseState.rooms = houseState.rooms || [];
  houseState.rooms.push(newCorridor);
  houseState.selectedRoomId = newCorridor.id;

  saveHouseLocalData();
  renderHouseView();

  if(typeof showToast === "function") showToast("🬸 Pasillo añadido a la Planta " + curFloor + ".", "success");

  if(typeof supabaseClient !== "undefined" && supabaseClient){
    supabaseClient.from("house_rooms").insert([newCorridor]).then(function(){});
  }
}

// FASE 3: Rotación de Muebles en Sub-rejilla
function rotateRoomFurniture(roomId, furnitureId){
  var room = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!room || !Array.isArray(room.furniture)) return;
  var fur = room.furniture.find(function(f){ return f.id === furnitureId; });
  if(!fur) return;

  fur.rotation = ((fur.rotation || 0) + 90) % 360;

  saveHouseLocalData();
  renderHouseView();

  if(typeof supabaseClient !== "undefined" && supabaseClient && room.id){
    supabaseClient.from("house_rooms")
      .update({ furniture: room.furniture, updated_at: new Date().toISOString() })
      .eq("id", room.id)
      .then(function(){});
  }
}

// FASE 4: Capa de Decoración Rápida
function rotateRoomDecor(roomId, decorId){
  var room = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!room || !Array.isArray(room.decor)) return;
  var dec = room.decor.find(function(d){ return d.id === decorId; });
  if(!dec) return;

  dec.rotation = ((dec.rotation || 0) + 90) % 360;

  saveHouseLocalData();
  renderHouseView();

  if(typeof supabaseClient !== "undefined" && supabaseClient && room.id){
    supabaseClient.from("house_rooms")
      .update({ decor: room.decor, updated_at: new Date().toISOString() })
      .eq("id", room.id)
      .then(function(){});
  }
}

function addRoomDecor(roomId, decorType){
  var room = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!room) return;
  room.decor = room.decor || [];

  var cat = HOUSE_DECOR_CATALOG.find(function(c){ return c.type === decorType; });
  if(!cat) return;

  // Buscar celda libre en sub-rejilla 6x4
  var occupied = {};
  (room.furniture || []).forEach(function(f){ occupied[(f.pos_x || 0) + "_" + (f.pos_y || 0)] = true; });
  room.decor.forEach(function(d){ occupied[(d.pos_x || 0) + "_" + (d.pos_y || 0)] = true; });

  var targetX = 0;
  var targetY = 0;
  var found = false;
  for(var y = 0; y < 4; y++){
    for(var x = 0; x < 6; x++){
      if(!occupied[x + "_" + y]){
        targetX = x;
        targetY = y;
        found = true;
        break;
      }
    }
    if(found) break;
  }

  var newDec = {
    id: "dec_" + Date.now(),
    type: cat.type,
    icon: cat.icon,
    label: cat.label,
    pos_x: targetX,
    pos_y: targetY,
    rotation: 0
  };

  room.decor.push(newDec);
  saveHouseLocalData();
  renderHouseView();

  if(typeof showToast === "function") showToast(cat.icon + " " + cat.label + " añadida a la estancia.", "info");

  if(typeof supabaseClient !== "undefined" && supabaseClient && room.id){
    supabaseClient.from("house_rooms")
      .update({ decor: room.decor, updated_at: new Date().toISOString() })
      .eq("id", room.id)
      .then(function(){});
  }
}

function deleteRoomDecor(roomId, decorId){
  var room = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!room || !Array.isArray(room.decor)) return;

  room.decor = room.decor.filter(function(d){ return d.id !== decorId; });
  saveHouseLocalData();
  renderHouseView();

  if(typeof showToast === "function") showToast("Elemento decorativo retirado.", "info");

  if(typeof supabaseClient !== "undefined" && supabaseClient && room.id){
    supabaseClient.from("house_rooms")
      .update({ decor: room.decor, updated_at: new Date().toISOString() })
      .eq("id", room.id)
      .then(function(){});
  }
}

// Estado del arrastre activo
var houseActiveDrag = null;
var houseSuppressNextClick = false;

function handleHousePointerDown(e){
  // Solo en modo edición y si el usuario es GM
  if(!houseState.editMode || !(typeof isGM === "function" && isGM())) return;
  // Solo botón principal
  if(e.button !== undefined && e.button !== 0) return;

  var handle = e.target.closest(".house-room-resize-handle");
  var tile = e.target.closest(".house-room-tile");
  if(!handle && !tile) return;

  var canvas = document.getElementById("houseGridCanvas");
  if(!canvas) return;

  var roomId = handle ? handle.getAttribute("data-room-id") : tile.getAttribute("data-room-id");
  if(!roomId) return;

  var room = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!room) return;

  var targetTile = tile || canvas.querySelector('.house-room-tile[data-room-id="' + roomId + '"]');
  if(!targetTile) return;

  var isResize = !!handle;

  // Medir paso horizontal y vertical de la cuadrícula dinámicamente
  var effectiveCanvasWidth = canvas.clientWidth - 12; // 6px padding por lado
  if(effectiveCanvasWidth <= 0) effectiveCanvasWidth = canvas.scrollWidth - 12;
  var stepX = (effectiveCanvasWidth + HOUSE_GRID_GAP) / HOUSE_GRID_COLS;
  var stepY = HOUSE_GRID_ROW_HEIGHT + HOUSE_GRID_GAP;

  houseActiveDrag = {
    pointerId: e.pointerId,
    roomId: roomId,
    isResize: isResize,
    tileEl: targetTile,
    handleEl: handle,
    startX: e.clientX,
    startY: e.clientY,
    origPosX: room.pos_x || 0,
    origPosY: room.pos_y || 0,
    origWidth: room.width || 2,
    origHeight: room.height || 2,
    currentPosX: room.pos_x || 0,
    currentPosY: room.pos_y || 0,
    currentWidth: room.width || 2,
    currentHeight: room.height || 2,
    stepX: stepX,
    stepY: stepY,
    hasMoved: false,
    isValid: true
  };

  try {
    (handle || targetTile).setPointerCapture(e.pointerId);
  } catch(err){}
}

function handleHousePointerMove(e){
  if(!houseActiveDrag || houseActiveDrag.pointerId !== e.pointerId) return;

  var dx = e.clientX - houseActiveDrag.startX;
  var dy = e.clientY - houseActiveDrag.startY;

  // Distinguir tap de arrastre sostenido
  if(!houseActiveDrag.hasMoved && (Math.abs(dx) > 6 || Math.abs(dy) > 6)){
    houseActiveDrag.hasMoved = true;
    houseActiveDrag.tileEl.classList.add("is-dragging");
    if(houseActiveDrag.isResize){
      houseActiveDrag.tileEl.classList.add("is-resizing");
    }
  }

  if(!houseActiveDrag.hasMoved) return;

  e.preventDefault();

  var deltaCols = Math.round(dx / houseActiveDrag.stepX);
  var deltaRows = Math.round(dy / houseActiveDrag.stepY);

  if(!houseActiveDrag.isResize){
    // Arrastre de posición
    var newX = Math.max(0, Math.min(HOUSE_GRID_COLS - houseActiveDrag.origWidth, houseActiveDrag.origPosX + deltaCols));
    var newY = Math.max(0, houseActiveDrag.origPosY + deltaRows);

    houseActiveDrag.currentPosX = newX;
    houseActiveDrag.currentPosY = newY;

    // Transformación fluida a 60fps sin re-renderizar todo el DOM
    houseActiveDrag.tileEl.style.transform = "translate3d(" + dx + "px, " + dy + "px, 0)";

    // Comprobación de colisión
    var collides = checkRoomCollision(
      houseState.activeFloor || 1,
      houseActiveDrag.roomId,
      newX,
      newY,
      houseActiveDrag.origWidth,
      houseActiveDrag.origHeight
    );

    houseActiveDrag.isValid = !collides;
    if(collides){
      houseActiveDrag.tileEl.classList.add("is-collision");
      houseActiveDrag.tileEl.classList.remove("is-valid-snap");
    } else {
      houseActiveDrag.tileEl.classList.remove("is-collision");
      houseActiveDrag.tileEl.classList.add("is-valid-snap");
    }

    updateGhostPreview(houseActiveDrag.roomId, newX, newY, houseActiveDrag.origWidth, houseActiveDrag.origHeight, !collides);
    updateAlignmentGuides(newX, newY, houseActiveDrag.origWidth, houseActiveDrag.origHeight, houseState.activeFloor || 1, houseActiveDrag.roomId);
  } else {
    // Redimensionamiento por asa
    var maxW = HOUSE_GRID_COLS - houseActiveDrag.origPosX;
    var newW = Math.max(1, Math.min(maxW, houseActiveDrag.origWidth + deltaCols));
    var newH = Math.max(1, Math.min(10, houseActiveDrag.origHeight + deltaRows));

    houseActiveDrag.currentWidth = newW;
    houseActiveDrag.currentHeight = newH;

    var collidesResize = checkRoomCollision(
      houseState.activeFloor || 1,
      houseActiveDrag.roomId,
      houseActiveDrag.origPosX,
      houseActiveDrag.origPosY,
      newW,
      newH
    );

    houseActiveDrag.isValid = !collidesResize;
    if(collidesResize){
      houseActiveDrag.tileEl.classList.add("is-collision");
      houseActiveDrag.tileEl.classList.remove("is-valid-snap");
    } else {
      houseActiveDrag.tileEl.classList.remove("is-collision");
      houseActiveDrag.tileEl.classList.add("is-valid-snap");
    }

    updateGhostPreview(houseActiveDrag.roomId, houseActiveDrag.origPosX, houseActiveDrag.origPosY, newW, newH, !collidesResize);
    updateAlignmentGuides(houseActiveDrag.origPosX, houseActiveDrag.origPosY, newW, newH, houseState.activeFloor || 1, houseActiveDrag.roomId);
  }
}

function handleHousePointerUp(e){
  if(!houseActiveDrag || houseActiveDrag.pointerId !== e.pointerId) return;

  var drag = houseActiveDrag;
  houseActiveDrag = null;

  // Limpiar estilos y clases
  drag.tileEl.classList.remove("is-dragging", "is-resizing", "is-collision", "is-valid-snap");
  drag.tileEl.style.transform = "";
  removeGhostPreview();
  removeAlignmentGuides();

  try {
    if(drag.handleEl) drag.handleEl.releasePointerCapture(e.pointerId);
    drag.tileEl.releasePointerCapture(e.pointerId);
  } catch(err){}

  // Si fue un click/tap simple sin desplazamiento
  if(!drag.hasMoved){
    if(drag.isResize) return;
    return;
  }

  // Suprimir el click subsiguiente disparado por el navegador tras el arrastre
  houseSuppressNextClick = true;
  setTimeout(function(){ houseSuppressNextClick = false; }, 200);

  var room = (houseState.rooms || []).find(function(x){ return x.id === drag.roomId; });
  if(!room) return;

  if(!drag.isValid){
    if(typeof showToast === "function"){
      showToast("⚠️ Posición ocupada o no permitida. Movimiento cancelado.", "warning");
    }
    renderHouseView();
    return;
  }

  if(!drag.isResize){
    var changedPos = (room.pos_x !== drag.currentPosX || room.pos_y !== drag.currentPosY);
    if(changedPos){
      room.pos_x = drag.currentPosX;
      room.pos_y = drag.currentPosY;
      saveHouseLocalData();
      renderHouseView();

      if(typeof showToast === "function"){
        showToast("Estancia reubicada en (" + room.pos_x + ", " + room.pos_y + ")", "info");
      }

      // Guardado atómico en Supabase: solo pos_x y pos_y
      if(typeof supabaseClient !== "undefined" && supabaseClient && room.id){
        supabaseClient.from("house_rooms")
          .update({ pos_x: room.pos_x, pos_y: room.pos_y, updated_at: new Date().toISOString() })
          .eq("id", room.id)
          .then(function(){});
      }
    } else {
      renderHouseView();
    }
  } else {
    var changedDim = (room.width !== drag.currentWidth || room.height !== drag.currentHeight);
    if(changedDim){
      room.width = drag.currentWidth;
      room.height = drag.currentHeight;
      saveHouseLocalData();
      renderHouseView();

      if(typeof showToast === "function"){
        showToast("Dimensiones actualizadas a " + room.width + "x" + room.height, "info");
      }

      // Guardado atómico en Supabase: solo width y height
      if(typeof supabaseClient !== "undefined" && supabaseClient && room.id){
        supabaseClient.from("house_rooms")
          .update({ width: room.width, height: room.height, updated_at: new Date().toISOString() })
          .eq("id", room.id)
          .then(function(){});
      }
    } else {
      renderHouseView();
    }
  }
}

function handleHousePointerCancel(e){
  if(houseActiveDrag && houseActiveDrag.pointerId === e.pointerId){
    houseActiveDrag.tileEl.classList.remove("is-dragging", "is-resizing", "is-collision", "is-valid-snap");
    houseActiveDrag.tileEl.style.transform = "";
    removeGhostPreview();
    removeAlignmentGuides();
    houseActiveDrag = null;
    renderHouseView();
  }
}

// Inicializar listeners de puntero a nivel documento con soporte táctil
document.addEventListener("pointerdown", handleHousePointerDown, { passive: false });
document.addEventListener("pointermove", handleHousePointerMove, { passive: false });
document.addEventListener("pointerup", handleHousePointerUp, { passive: false });
document.addEventListener("pointercancel", handleHousePointerCancel, { passive: false });

function nudgeSelectedRoom(dx, dy){
  var rId = houseState.selectedRoomId;
  if(!rId) return;
  var r = (houseState.rooms || []).find(function(x){ return x.id === rId; });
  if(!r) return;

  var targetX = Math.max(0, Math.min(HOUSE_GRID_COLS - (r.width || 2), (r.pos_x || 0) + dx));
  var targetY = Math.max(0, Math.min(12, (r.pos_y || 0) + dy));

  if(checkRoomCollision(r.floor || 1, r.id, targetX, targetY, r.width || 2, r.height || 2)){
    if(typeof showToast === "function") showToast("⚠️ Posición ocupada por otra habitación.", "warning");
    return;
  }

  r.pos_x = targetX;
  r.pos_y = targetY;

  saveHouseLocalData();
  renderHouseView();

  if(typeof supabaseClient !== "undefined" && supabaseClient && r.id){
    supabaseClient.from("house_rooms").update({ pos_x: r.pos_x, pos_y: r.pos_y, updated_at: new Date().toISOString() }).eq("id", r.id).then(function(){});
  }
}

function resizeSelectedRoom(dw, dh){
  var rId = houseState.selectedRoomId;
  if(!rId) return;
  var r = (houseState.rooms || []).find(function(x){ return x.id === rId; });
  if(!r) return;

  var targetW = Math.max(1, Math.min(HOUSE_GRID_COLS - (r.pos_x || 0), (r.width || 2) + dw));
  var targetH = Math.max(1, Math.min(6, (r.height || 2) + dh));

  if(checkRoomCollision(r.floor || 1, r.id, r.pos_x || 0, r.pos_y || 0, targetW, targetH)){
    if(typeof showToast === "function") showToast("⚠️ Tamaño no permitido (colisiona con otra estancia).", "warning");
    return;
  }

  r.width = targetW;
  r.height = targetH;

  saveHouseLocalData();
  renderHouseView();

  if(typeof supabaseClient !== "undefined" && supabaseClient && r.id){
    supabaseClient.from("house_rooms").update({ width: r.width, height: r.height, updated_at: new Date().toISOString() }).eq("id", r.id).then(function(){});
  }
}

function setRoomFloor(roomId, newFloor){
  var r = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!r) return;

  r.floor = parseInt(newFloor, 10) || 1;
  saveHouseLocalData();
  renderHouseView();

  if(typeof showToast === "function") showToast("Habitación trasladada a Planta " + r.floor + ".", "info");

  if(typeof supabaseClient !== "undefined" && supabaseClient && r.id){
    supabaseClient.from("house_rooms").update({ floor: r.floor, updated_at: new Date().toISOString() }).eq("id", r.id).then(function(){});
  }
}

// ============================================================================
// 6. RENDERIZADO DEL PLANO ARQUITECTÓNICO
// ============================================================================
function renderHouseView(){
  if(!CONFIG_ENABLE_HOUSE) return;
  var main = document.getElementById("main");
  if(!main) return;

  var h = houseState.house;
  if(!h){
    loadHouseLocalData();
    h = houseState.house;
  }

  var gmMode = (typeof isGM === "function" && isGM());
  var lvlPct = Math.min(100, Math.round(((h.progress_current || 0) / Math.max(1, h.progress_max || 100)) * 100));
  var curFloor = houseState.activeFloor || 1;

  var html = '<div class="house-container">';

  // 1. Cabecera Principal
  html += '<div class="house-header">';
  html += '  <div class="house-header-top">';
  html += '    <div class="house-title-group">';
  html += '      <h1 class="house-title"><span>🏠</span> ' + esc(h.name || "La Casa Andante") + '</h1>';
  html += '      <span class="house-beta-badge">🧪 BETA</span>';
  html += '    </div>';
  html += '    <button class="house-back-btn" data-action="back-from-house-view" title="Volver a la ficha de personaje">';
  html += '      <span>← Volver a la Ficha</span>';
  html += '    </button>';
  html += '  </div>';

  html += '  <div class="house-desc" id="houseDescDisplay">' + esc(h.description || "Un antiguo hogar nómada encantado con voluntad propia, guiado por un libro sapiente.") + '</div>';
  if(gmMode){
    html += '  <div style="margin-top:6px;"><button class="btn-compact" data-action="open-edit-house-desc" style="font-size:0.7rem;padding:2px 8px;">✏️ Editar descripción (GM)</button></div>';
  }

  // Barra de Nivel
  html += '  <div class="house-level-bar-wrap">';
  html += '    <div class="house-level-info">';
  html += '      <span class="house-level-tag">Nivel de la Casa: <b>' + (h.level || 1) + '</b></span>';
  html += '      <span style="font-family:var(--font-mono);font-size:0.8rem;color:var(--ink-light);">' + (h.progress_current || 0) + ' / ' + (h.progress_max || 100) + ' (' + lvlPct + '%)</span>';
  html += '    </div>';
  html += '    <div class="house-level-track">';
  html += '      <div class="house-level-fill" style="width:' + lvlPct + '%;"></div>';
  html += '    </div>';

  if(gmMode){
    html += '    <div class="house-progress-controls">';
    html += '      <span style="font-size:0.7rem;color:var(--ink-faint);font-weight:700;">Progreso de Misión (GM):</span>';
    html += '      <button class="house-prog-btn" data-action="add-house-progress" data-amount="10" data-stat="general">+10 pts</button>';
    html += '      <button class="house-prog-btn" data-action="add-house-progress" data-amount="25" data-stat="general">+25 pts</button>';
    html += '      <button class="house-prog-btn" data-action="add-house-progress" data-amount="50" data-stat="general">+50 pts</button>';
    html += '      <button class="house-prog-btn" data-action="prompt-house-progress" data-stat="general">🎯 Cantidad...</button>';
    html += '    </div>';
  }

  html += '  </div>';
  html += '</div>';

  // 2. Estadísticas de la Casa
  html += '<div class="house-stats-grid">';
  html += renderHouseStatCard("🛋️ Confort", "confort", h.confort || 1, h.confort_progress || 0, h.confort_max || 10, "Calidad del reposo. Recuperación de PV y Maná.", gmMode);
  html += renderHouseStatCard("📖 Arcana (Libro)", "arcana", h.arcana || 1, h.arcana_progress || 0, h.arcana_max || 10, "Poder mágico y guía sapiente. Potencia de mejoras.", gmMode);
  html += renderHouseStatCard("🍲 Provisiones", "provisiones", h.provisiones || 1, h.provisiones_progress || 0, h.provisiones_max || 10, "Calidad culinaria. Determina los buffs de comida.", gmMode);
  html += renderHouseStatCard("🛡️ Custodia", "custodia", h.custodia || 1, h.custodia_progress || 0, h.custodia_max || 10, "Defensa y camuflaje en acampada.", gmMode);
  html += renderHouseStatCard("🔮 Vínculo", "vinculo", h.vinculo || 1, h.vinculo_progress || 0, h.vinculo_max || 10, "Conexión anímica con los moradores.", gmMode);
  html += '</div>';

  // 3. Sección del Plano Arquitectónico
  html += '<div class="house-blueprint-section">';
  html += '  <div class="house-blueprint-toolbar">';
  html += '    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">';
  html += '      <h2 class="house-blueprint-title"><span>📐</span> Plano Arquitectónico</h2>';

  // Selector de Plantas
  html += '      <div class="house-floor-tabs">';
  html += '        <button class="house-floor-tab' + (curFloor === 1 ? ' active' : '') + '" data-action="switch-house-floor" data-floor="1">🏢 Planta 1 (Principal)</button>';
  html += '        <button class="house-floor-tab' + (curFloor === 2 ? ' active' : '') + '" data-action="switch-house-floor" data-floor="2">🌲 Planta 2 (Aposentos)</button>';
  html += '        <button class="house-floor-tab' + (curFloor === 3 ? ' active' : '') + '" data-action="switch-house-floor" data-floor="3">🕯️ Sótano / Bodega</button>';
  html += '      </div>';

  // FASE 5: Controles de Zoom del Plano
  var curZoom = houseState.zoom || 1.0;
  html += '      <div class="house-zoom-controls">';
  html += '        <button class="house-zoom-btn" data-action="zoom-house-out" title="Alejar plano (Zoom -)">−</button>';
  html += '        <button class="house-zoom-btn house-zoom-reset" data-action="zoom-house-reset" title="Restablecer zoom (100%)">' + Math.round(curZoom * 100) + '%</button>';
  html += '        <button class="house-zoom-btn" data-action="zoom-house-in" title="Acercar plano (Zoom +)">+</button>';
  html += '      </div>';
  html += '    </div>';

  if(gmMode){
    html += '    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">';
    html += '      <button class="house-edit-mode-btn' + (houseState.editMode ? ' active' : '') + '" data-action="toggle-house-edit-mode" title="Alternar Modo Edición para arrastrar y redimensionar estancias">';
    html += '        <span>' + (houseState.editMode ? '✏️ Modo Edición: ACTIVO' : '👁️ Modo Edición: OFF') + '</span>';
    html += '      </button>';
    if(houseState.editMode){
      html += '      <button class="btn-compact highlight" data-action="create-house-corridor" style="font-size:0.78rem;padding:5px 10px;background:rgba(180,150,90,0.22);border-color:var(--gold);color:var(--gold-light);" title="Pintar o añadir un pasillo entre estancias">🬸 Añadir Pasillo</button>';
    }
    html += '      <button class="btn-solid-gold" data-action="open-create-room-modal" style="font-size:0.78rem;padding:5px 10px;">➕ Añadir Habitación</button>';
    html += '    </div>';
  }
  html += '  </div>';

  // Banner informativo en Modo Edición
  if(gmMode && houseState.editMode){
    html += '<div class="house-edit-mode-banner">';
    html += '  <span>🛠️ <b>Modo Edición Activo:</b> Arrastra cualquier estancia directamente con el dedo o ratón. Snapping automático y prevención de solapes. Selecciona una estancia y arrastra la esquina <b>↘</b> para redimensionar.</span>';
    html += '</div>';
  }

  // Barra para la habitación seleccionada en Modo Edición o D-Pad clásico de respaldo
  if(gmMode && houseState.selectedRoomId){
    var selRoom = (houseState.rooms || []).find(function(x){ return x.id === houseState.selectedRoomId; });
    if(selRoom){
      if(houseState.editMode){
        html += '<div class="house-edit-selected-bar">';
        html += '  <div class="house-edit-sel-info">';
        html += '    <span>🎯 Habitación seleccionada: <b>' + esc(selRoom.name) + '</b></span>';
        html += '    <span class="house-edit-coords">(' + (selRoom.pos_x || 0) + ', ' + (selRoom.pos_y || 0) + ') · ' + (selRoom.width || 2) + 'x' + (selRoom.height || 2) + '</span>';
        html += '  </div>';
        html += '  <div class="house-edit-sel-actions">';
        html += '    <div class="house-floor-mini-group">';
        html += '      <span style="font-size:0.7rem;color:var(--ink-faint);font-weight:700;">Planta:</span>';
        html += '      <button class="house-dpad-btn' + ((selRoom.floor||1)===1?' active':'') + '" data-action="set-room-floor" data-room-id="' + selRoom.id + '" data-floor="1">P.1</button>';
        html += '      <button class="house-dpad-btn' + ((selRoom.floor||1)===2?' active':'') + '" data-action="set-room-floor" data-room-id="' + selRoom.id + '" data-floor="2">P.2</button>';
        html += '      <button class="house-dpad-btn' + ((selRoom.floor||1)===3?' active':'') + '" data-action="set-room-floor" data-room-id="' + selRoom.id + '" data-floor="3">Sót.</button>';
        html += '    </div>';
        html += '    <button class="btn-compact" data-action="open-edit-room-modal" data-room-id="' + selRoom.id + '" style="font-size:0.72rem;padding:3px 8px;">✏️ Ajustar Coordenadas / Datos</button>';
        html += '  </div>';
        html += '</div>';
      } else {
        html += '<div class="house-dpad-bar">';
        html += '  <div class="house-dpad-title">🎮 Mover <b>' + esc(selRoom.name) + '</b>:</div>';
        html += '  <div class="house-dpad-group">';
        html += '    <span class="house-dpad-label">Posición:</span>';
        html += '    <button class="house-dpad-btn" data-action="nudge-room" data-dx="-1" data-dy="0" title="Mover Izquierda">⬅️</button>';
        html += '    <button class="house-dpad-btn" data-action="nudge-room" data-dx="1" data-dy="0" title="Mover Derecha">➡️</button>';
        html += '    <button class="house-dpad-btn" data-action="nudge-room" data-dx="0" data-dy="-1" title="Mover Arriba">⬆️</button>';
        html += '    <button class="house-dpad-btn" data-action="nudge-room" data-dx="0" data-dy="1" title="Mover Abajo">⬇️</button>';
        html += '  </div>';
        html += '  <div class="house-dpad-group">';
        html += '    <span class="house-dpad-label">Tamaño:</span>';
        html += '    <button class="house-dpad-btn" data-action="resize-room" data-dw="-1" data-dh="0" title="Reducir Ancho">Ancho -</button>';
        html += '    <button class="house-dpad-btn" data-action="resize-room" data-dw="1" data-dh="0" title="Aumentar Ancho">Ancho +</button>';
        html += '    <button class="house-dpad-btn" data-action="resize-room" data-dw="0" data-dh="-1" title="Reducir Alto">Alto -</button>';
        html += '    <button class="house-dpad-btn" data-action="resize-room" data-dw="0" data-dh="1" title="Aumentar Alto">Alto +</button>';
        html += '  </div>';
        html += '  <div class="house-dpad-group">';
        html += '    <span class="house-dpad-label">Planta:</span>';
        html += '    <button class="house-dpad-btn' + ((selRoom.floor||1)===1?' active':'') + '" data-action="set-room-floor" data-room-id="' + selRoom.id + '" data-floor="1">P.1</button>';
        html += '    <button class="house-dpad-btn' + ((selRoom.floor||1)===2?' active':'') + '" data-action="set-room-floor" data-room-id="' + selRoom.id + '" data-floor="2">P.2</button>';
        html += '    <button class="house-dpad-btn' + ((selRoom.floor||1)===3?' active':'') + '" data-action="set-room-floor" data-room-id="' + selRoom.id + '" data-floor="3">Sót.</button>';
        html += '  </div>';
        html += '</div>';
      }
    }
  }

  // Lienzo de cuadrícula de la planta activa con soporte de Zoom
  var canvasEditClass = (gmMode && houseState.editMode) ? ' edit-mode' : '';
  var zoomStyle = (curZoom !== 1.0) ? 'style="transform:scale(' + curZoom + ');transform-origin:top left;"' : '';
  html += '  <div class="house-grid-viewport">';
  html += '    <div class="house-grid-canvas' + canvasEditClass + '" id="houseGridCanvas" ' + zoomStyle + '>';
  html += renderHouseGridRooms(curFloor);
  html += '    </div>';
  html += '  </div>';

  // Inspector de la Habitación seleccionada
  if(houseState.selectedRoomId){
    html += renderRoomInspector(houseState.selectedRoomId);
  } else {
    html += '<div style="font-size:0.82rem;color:var(--ink-faint);text-align:center;padding:12px;font-style:italic;">💡 Toca cualquier habitación del plano para ver sus detalles, muebles o activar sus buffs.</div>';
  }

  html += '</div>'; // Fin blueprint

  // Historial de eventos
  html += renderHouseEventsSection();

  html += '</div>'; // Fin house-container
  main.innerHTML = html;
}

function renderHouseStatCard(label, statKey, val, prog, max, desc, gmMode){
  var pct = Math.min(100, Math.round((prog / Math.max(1, max)) * 100));
  var html = '<div class="house-stat-card">' +
    '  <div class="house-stat-header">' +
    '    <span class="house-stat-name">' + label + '</span>' +
    '    <span class="house-stat-val">Nv. ' + val + '</span>' +
    '  </div>' +
    '  <div class="house-stat-desc">' + desc + '</div>' +
    '  <div class="house-stat-track">' +
    '    <div class="house-stat-fill" style="width:' + pct + '%;"></div>' +
    '  </div>';

  if(gmMode){
    html += '  <div class="house-stat-mod-row">' +
      '    <button class="house-stat-mod-btn" data-action="add-house-progress" data-amount="5" data-stat="' + statKey + '">+5 prog</button>' +
      '    <button class="house-stat-mod-btn" data-action="add-house-progress" data-amount="10" data-stat="' + statKey + '">+10 prog</button>' +
      '  </div>';
  }

  html += '</div>';
  return html;
}

function renderHouseGridRooms(floorNumber){
  var allRooms = houseState.rooms || [];
  var rooms = allRooms.filter(function(r){ return (r.floor || 1) === floorNumber; });

  if(rooms.length === 0){
    return '<div style="grid-column:1/-1;text-align:center;color:var(--ink-dim);padding:40px;font-style:italic;">Esta planta no tiene habitaciones construidas todavía. (Usa "+ Añadir Habitación" como GM para construir aquí).</div>';
  }

  var curChar = (typeof activeChar === "function") ? activeChar() : null;
  var isEditMode = (typeof isGM === "function" && isGM() && houseState.editMode);

  return rooms.map(function(r){
    var isSelected = houseState.selectedRoomId === r.id;
    var owner = getRoomOwnerInfo(r.owner_character_id);
    var isMyRoom = false;

    if(curChar && r.owner_character_id){
      if(curChar.id === r.owner_character_id || curChar.db_id === r.owner_character_id){
        isMyRoom = true;
      } else if(owner && owner.name && curChar.name && curChar.name.toLowerCase().includes(owner.name.toLowerCase())){
        isMyRoom = true;
      }
    }

    var colStart = Math.max(1, (r.pos_x || 0) + 1);
    var colSpan = Math.max(1, r.width || 2);
    var rowStart = Math.max(1, (r.pos_y || 0) + 1);
    var rowSpan = Math.max(1, r.height || 2);

    var gridStyle = 'grid-column:' + colStart + ' / span ' + colSpan + '; grid-row:' + rowStart + ' / span ' + rowSpan + ';';

    var ownerTag = '';
    if(owner){
      ownerTag = '<span class="house-room-owner-tag" title="Habitación de ' + esc(owner.name) + '">👤 ' + esc(owner.name) + '</span>';
    }

    var furnitureCount = Array.isArray(r.furniture) ? r.furniture.length : 0;
    var furnitureTag = furnitureCount > 0
      ? '<span style="font-size:0.68rem;background:rgba(52,152,219,0.2);color:#85C1E9;padding:1px 5px;border-radius:3px;" title="' + furnitureCount + ' muebles instalados">📦 ' + furnitureCount + '</span>'
      : '';

    var wallClasses = getRoomWallClasses(r, rooms);
    var textureClass = "tex-" + (r.room_type || "salon");

    var resizeHandleHtml = '';
    if(isEditMode && isSelected){
      resizeHandleHtml = '<div class="house-room-resize-handle" data-room-id="' + r.id + '" title="Arrastra para redimensionar"></div>';
    }

    // FASE 2: Renderizado específico para Pasillos
    if(r.room_type === "pasillo"){
      return '<div class="house-room-tile type-pasillo ' + wallClasses + ' ' + textureClass + (isSelected ? ' active' : '') + (isEditMode ? ' edit-draggable' : '') + '" style="' + gridStyle + '" data-action="select-house-room" data-room-id="' + r.id + '" data-pos-x="' + (r.pos_x || 0) + '" data-pos-y="' + (r.pos_y || 0) + '" data-width="' + (r.width || 1) + '" data-height="' + (r.height || 1) + '" role="button" tabindex="0" title="Pasillo (Zona de paso)">' +
        '  <div class="house-room-name">🬸 ' + esc(r.name || "Pasillo") + '</div>' +
        '  <div class="house-room-tile-foot"><span class="house-room-dims">' + (r.width || 1) + 'x' + (r.height || 1) + '</span></div>' +
        resizeHandleHtml +
        '</div>';
    }

    // Renderizado para Estancias normales
    return '<div class="house-room-tile ' + wallClasses + ' ' + textureClass + (isSelected ? ' active' : '') + (isMyRoom ? ' my-room' : '') + (isEditMode ? ' edit-draggable' : '') + '" style="' + gridStyle + '" data-action="select-house-room" data-room-id="' + r.id + '" data-pos-x="' + (r.pos_x || 0) + '" data-pos-y="' + (r.pos_y || 0) + '" data-width="' + (r.width || 2) + '" data-height="' + (r.height || 2) + '" role="button" tabindex="0">' +
      '  <div class="house-room-tile-head">' +
      '    <span class="house-room-type-tag ' + (r.room_type || 'otro') + '">' + getRoomTypeIcon(r.room_type) + ' ' + getRoomTypeLabel(r.room_type) + '</span>' +
      '    <span class="house-room-level-pill">Nv. ' + (r.level || 1) + '</span>' +
      '  </div>' +
      '  <div class="house-room-name">' + esc(r.name) + '</div>' +
      '  <div class="house-room-tile-foot">' +
      '    ' + ownerTag +
      '    <div style="display:flex;gap:4px;align-items:center;">' +
      '      ' + furnitureTag +
      '      <span class="house-room-dims">' + (r.width || 2) + 'x' + (r.height || 2) + '</span>' +
      '    </div>' +
      '  </div>' +
      resizeHandleHtml +
      '</div>';
  }).join('');
}

// ============================================================================
// FASE 3 & 4: SUB-REJILLA CENITAL DE HABITACIÓN (Muebles y Decoración)
// ============================================================================
function renderRoomSubgrid(r, canEdit, isGm, isEditMode){
  var furnitureList = Array.isArray(r.furniture) ? r.furniture : [];
  var decorList = Array.isArray(r.decor) ? r.decor : [];

  var occupied = {};
  furnitureList.forEach(function(f, idx){
    if(typeof f.pos_x !== "number") f.pos_x = idx % 6;
    if(typeof f.pos_y !== "number") f.pos_y = Math.min(3, Math.floor(idx / 6));
    if(typeof f.rotation !== "number") f.rotation = 0;
    occupied[f.pos_x + "_" + f.pos_y] = true;
  });

  decorList.forEach(function(d){
    if(typeof d.pos_x !== "number"){
      for(var y = 3; y >= 0; y--){
        for(var x = 5; x >= 0; x--){
          if(!occupied[x + "_" + y]){
            d.pos_x = x;
            d.pos_y = y;
            occupied[x + "_" + y] = true;
            break;
          }
        }
        if(d.pos_x !== undefined) break;
      }
      if(d.pos_x === undefined){ d.pos_x = 0; d.pos_y = 0; }
    }
    if(typeof d.rotation !== "number") d.rotation = 0;
    occupied[d.pos_x + "_" + d.pos_y] = true;
  });

  var html = '<div class="house-room-subgrid-wrap">';
  html += '  <div class="house-room-subgrid-toolbar">';
  html += '    <div class="house-room-subgrid-title"><span>📐</span> Mini-Plano Cenital de la Estancia</div>';
  if(canEdit && isEditMode){
    html += '    <div style="display:flex;gap:6px;">';
    html += '      <button class="btn-compact highlight" data-action="open-add-furniture-modal" data-room-id="' + r.id + '" style="font-size:0.7rem;padding:3px 8px;">➕ Mueble</button>';
    html += '      <button class="btn-compact highlight" data-action="toggle-decor-palette" data-room-id="' + r.id + '" style="font-size:0.7rem;padding:3px 8px;background:rgba(46,204,113,0.2);border-color:#2ECC71;color:#A9DFBF;">🌿 + Decoración</button>';
    html += '    </div>';
  }
  html += '  </div>';

  html += '  <div class="house-room-subgrid tex-' + (r.room_type || 'salon') + '" id="houseRoomSubgrid">';

  // Renderizar muebles posicionados
  furnitureList.forEach(function(f){
    var colStart = (f.pos_x || 0) + 1;
    var rowStart = (f.pos_y || 0) + 1;
    var style = 'grid-column:' + colStart + '; grid-row:' + rowStart + ';';
    var icon = f.icon || getFurnitureIcon(f.type);
    var rot = f.rotation || 0;

    html += '<div class="house-subtile-item house-subtile-furniture" style="' + style + '" data-action="open-add-item-modal" data-room-id="' + r.id + '" data-furniture-id="' + f.id + '" title="' + esc(f.name) + ' (Toca para ver inventario)">';
    if(canEdit && isEditMode){
      html += '  <div class="house-subtile-controls">';
      html += '    <button class="house-subtile-btn" data-action="rotate-room-furniture" data-room-id="' + r.id + '" data-furniture-id="' + f.id + '" title="Girar 90°">⟳</button>';
      html += '    <button class="house-subtile-btn" data-action="delete-furniture" data-room-id="' + r.id + '" data-furniture-id="' + f.id + '" title="Eliminar">&times;</button>';
      html += '  </div>';
    }
    html += '  <span class="house-subtile-icon" style="transform:rotate(' + rot + 'deg);">' + icon + '</span>';
    html += '  <span class="house-subtile-name">' + esc(f.name) + '</span>';
    html += '</div>';
  });

  // Renderizar elementos decorativos (sin inventario)
  decorList.forEach(function(d){
    var colStart = (d.pos_x || 0) + 1;
    var rowStart = (d.pos_y || 0) + 1;
    var style = 'grid-column:' + colStart + '; grid-row:' + rowStart + ';';
    var rot = d.rotation || 0;

    html += '<div class="house-subtile-item house-subtile-decor" style="' + style + '" title="' + esc(d.label || 'Decoración') + '">';
    if(canEdit && isEditMode){
      html += '  <div class="house-subtile-controls">';
      html += '    <button class="house-subtile-btn" data-action="rotate-room-decor" data-room-id="' + r.id + '" data-decor-id="' + d.id + '" title="Girar 90°">⟳</button>';
      html += '    <button class="house-subtile-btn" data-action="delete-room-decor" data-room-id="' + r.id + '" data-decor-id="' + d.id + '" title="Quitar">&times;</button>';
      html += '  </div>';
    }
    html += '  <span class="house-subtile-icon" style="transform:rotate(' + rot + 'deg);">' + (d.icon || '🌿') + '</span>';
    html += '  <span class="house-subtile-name">' + esc(d.label || d.type) + '</span>';
    html += '</div>';
  });

  html += '  </div>'; // fin house-room-subgrid

  // Paleta de Decoración Rápida
  if(canEdit && isEditMode){
    html += '<div id="houseDecorPalette" style="display:none;margin-top:10px;padding-top:10px;border-top:1px dashed rgba(212,175,55,0.25);">';
    html += '  <div style="font-size:0.75rem;color:var(--gold-light);font-weight:700;margin-bottom:6px;">Toca un elemento decorativo para añadirlo a la estancia:</div>';
    html += '  <div class="house-decor-palette">';
    HOUSE_DECOR_CATALOG.forEach(function(dec){
      html += '    <div class="house-decor-card" data-action="add-room-decor" data-room-id="' + r.id + '" data-decor-type="' + dec.type + '">';
      html += '      <div class="house-decor-card-icon">' + dec.icon + '</div>';
      html += '      <div class="house-decor-card-label">' + esc(dec.label) + '</div>';
      html += '    </div>';
    });
    html += '  </div>';
    html += '</div>';
  }

  html += '</div>';
  return html;
}

// ============================================================================
// 7. INSPECTOR DE HABITACIÓN SEGMENTADO
// ============================================================================
function renderRoomInspector(roomId){
  var r = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!r) return '';

  var owner = getRoomOwnerInfo(r.owner_character_id);
  var canEdit = canUserEditRoom(r);
  var isGm = (typeof isGM === "function" && isGM());
  var isEditMode = (isGm && houseState.editMode);
  var roomUpgrades = (houseState.upgrades || []).filter(function(u){ return u.room_id === r.id; });
  var curChar = (typeof activeChar === "function") ? activeChar() : null;
  var currentTab = houseState.inspectorTab || "estancia";

  // FASE 2: Inspector Ligero para Pasillos
  if(r.room_type === "pasillo"){
    var pHtml = '<div class="house-inspector-box" id="houseRoomInspector">';
    pHtml += '  <div class="house-inspector-header">';
    pHtml += '    <div>';
    pHtml += '      <h3 class="house-inspector-title">🬸 ' + esc(r.name || "Pasillo") + '</h3>';
    pHtml += '      <div class="house-inspector-meta">';
    pHtml += '        <span class="house-room-type-tag pasillo">Zona de paso</span>';
    pHtml += '        <span style="font-size:0.72rem;color:var(--ink-faint);">Planta ' + (r.floor || 1) + ' (' + (r.width||1) + 'x' + (r.height||1) + ')</span>';
    pHtml += '      </div>';
    pHtml += '    </div>';
    pHtml += '    <button class="btn-compact" data-action="close-room-inspector" style="padding:2px 8px;" title="Cerrar">&times;</button>';
    pHtml += '  </div>';
    pHtml += '  <div style="padding:14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">';
    pHtml += '    <span style="font-size:0.8rem;color:var(--ink-dim);">Los pasillos comunican estancias. En Modo Edición puedes arrastrarlo libremente o redimensionarlo con su tirador <b>↘</b>.</span>';
    if(isGm){
      pHtml += '    <button class="btn-compact" data-action="delete-house-room" data-room-id="' + r.id + '" style="color:#E74C3C;border-color:rgba(231,76,60,0.4);">🗑️ Eliminar Pasillo</button>';
    }
    pHtml += '  </div>';
    pHtml += '</div>';
    return pHtml;
  }

  var html = '<div class="house-inspector-box" id="houseRoomInspector">';

  // Cabecera del Inspector
  html += '  <div class="house-inspector-header">';
  html += '    <div>';
  html += '      <h3 class="house-inspector-title">' + getRoomTypeIcon(r.room_type) + ' ' + esc(r.name) + '</h3>';
  html += '      <div class="house-inspector-meta">';
  html += '        <span class="house-room-type-tag ' + (r.room_type || 'otro') + '">' + getRoomTypeLabel(r.room_type) + '</span>';
  html += '        <span class="house-room-level-pill">Nivel ' + (r.level || 1) + '</span>';
  html += '        <span style="font-size:0.72rem;color:var(--ink-faint);">Planta ' + (r.floor || 1) + ' (' + (r.width||2) + 'x' + (r.height||2) + ')</span>';
  if(owner){
    html += '        <span class="house-room-owner-tag">Dueño: <b>' + esc(owner.name) + '</b></span>';
  }
  html += '      </div>';
  html += '    </div>';
  html += '    <button class="btn-compact" data-action="close-room-inspector" style="padding:2px 8px;" title="Cerrar inspector">&times;</button>';
  html += '  </div>';

  // Pestañas de Navegación dentro del Inspector
  html += '  <div class="house-inspector-nav">';
  html += '    <button class="house-inspector-tab-btn' + (currentTab === "estancia" ? ' active' : '') + '" data-action="switch-inspector-tab" data-tab="estancia">📜 Estancia</button>';
  html += '    <button class="house-inspector-tab-btn' + (currentTab === "muebles" ? ' active' : '') + '" data-action="switch-inspector-tab" data-tab="muebles">📦 Muebles y Almacén (' + (r.furniture ? r.furniture.length : 0) + ')</button>';
  html += '    <button class="house-inspector-tab-btn' + (currentTab === "buffs" ? ' active' : '') + '" data-action="switch-inspector-tab" data-tab="buffs">✨ Mejoras y Buffs (' + roomUpgrades.length + ')</button>';
  html += '  </div>';

  // CONTENIDO PESTAÑA 1: ESTANCIA
  if(currentTab === "estancia"){
    html += '  <div class="house-inspector-desc">' + (r.description ? esc(r.description) : '<i>Sin descripción ni detalles decorativos.</i>') + '</div>';

    html += '  <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-top:4px;">';
    if(canEdit){
      html += '    <button class="btn-solid-gold" data-action="open-edit-room-modal" data-room-id="' + r.id + '">✏️ ' + (isGm ? 'Modificar Estancia' : 'Decorar mi habitación') + '</button>';
    }
    if(isGm){
      html += '    <button class="btn-compact" data-action="grant-room-level" data-room-id="' + r.id + '" style="color:#F1C40F;border-color:rgba(241,196,15,0.4);" title="Subir nivel de esta sala">+ 1 Nivel de Sala</button>';
      html += '    <button class="btn-compact" data-action="delete-house-room" data-room-id="' + r.id + '" style="color:#E74C3C;border-color:rgba(231,76,60,0.4);" title="Eliminar habitación del plano">🗑️ Eliminar</button>';
    }
    html += '  </div>';
  }

  // CONTENIDO PESTAÑA 2: MUEBLES Y ALMACENAMIENTO (con Sub-rejilla Cenital)
  else if(currentTab === "muebles"){
    // Sub-rejilla cenital visual
    html += renderRoomSubgrid(r, canEdit, isGm, isEditMode);

    var furnitureList = Array.isArray(r.furniture) ? r.furniture : [];

    html += '  <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;">';
    html += '    <div style="font-size:0.82rem;font-weight:700;color:var(--gold-light);">Inventario de Almacenamiento:</div>';
    if(canEdit){
      html += '    <button class="btn-compact highlight" data-action="open-add-furniture-modal" data-room-id="' + r.id + '" style="font-size:0.72rem;padding:3px 8px;">➕ Añadir Mueble</button>';
    }
    html += '  </div>';

    if(furnitureList.length === 0){
      html += '  <div style="font-size:0.76rem;color:var(--ink-dim);font-style:italic;padding:10px;text-align:center;background:rgba(0,0,0,0.2);border-radius:6px;">No hay muebles en esta estancia. Añade un baúl, armero o estantería para guardar objetos.</div>';
    } else {
      html += '  <div class="house-furniture-list">';
      furnitureList.forEach(function(fur){
        var items = Array.isArray(fur.items) ? fur.items : [];
        var icon = (fur.type === "armero" ? "🗡️" : (fur.type === "alacena" ? "🍲" : (fur.type === "estanteria" ? "🧪" : "🧰")));

        html += '    <div class="house-furniture-card">';
        html += '      <div class="house-furniture-card-head">';
        html += '        <span class="house-furniture-card-title">' + icon + ' ' + esc(fur.name) + '</span>';
        html += '        <div style="display:flex;gap:6px;align-items:center;">';
        if(canEdit){
          html += '          <button class="btn-compact" data-action="open-add-item-modal" data-room-id="' + r.id + '" data-furniture-id="' + fur.id + '" style="font-size:0.68rem;padding:2px 6px;">➕ Guardar Objeto</button>';
          html += '          <button class="btn-compact" data-action="delete-furniture" data-room-id="' + r.id + '" data-furniture-id="' + fur.id + '" style="font-size:0.68rem;color:#E74C3C;" title="Quitar mueble">&times;</button>';
        }
        html += '        </div>';
        html += '      </div>';

        if(items.length === 0){
          html += '      <div style="font-size:0.72rem;color:var(--ink-faint);font-style:italic;">(Vacío)</div>';
        } else {
          html += '      <div class="house-furniture-items-wrap">';
          items.forEach(function(it, itIdx){
            html += '        <div class="house-furniture-item-row">';
            html += '          <div>';
            html += '            <span class="house-furniture-item-qty">x' + (it.qty || 1) + '</span>';
            html += '            <span class="house-furniture-item-name">' + esc(it.name) + '</span>';
            if(it.notes) html += ' <small style="color:var(--ink-dim);">(' + esc(it.notes) + ')</small>';
            html += '          </div>';
            if(canEdit){
              html += '          <button class="btn-compact" data-action="delete-furniture-item" data-room-id="' + r.id + '" data-furniture-id="' + fur.id + '" data-item-idx="' + itIdx + '" style="font-size:0.65rem;padding:1px 5px;color:#E74C3C;" title="Sacar objeto">&times;</button>';
            }
            html += '        </div>';
          });
          html += '      </div>';
        }

        html += '    </div>';
      });
      html += '  </div>';
    }
  }

  // CONTENIDO PESTAÑA 3: MEJORAS Y BUFFS EVOLUTIVOS
  else if(currentTab === "buffs"){
    html += '  <div style="display:flex;justify-content:space-between;align-items:center;">';
    html += '    <div style="font-size:0.82rem;font-weight:700;color:var(--gold-light);">Mejoras y Buffs de la Estancia:</div>';
    if(isGm){
      html += '    <button class="btn-compact highlight" data-action="open-add-upgrade-modal" data-room-id="' + r.id + '" style="font-size:0.72rem;padding:3px 8px;">➕ Nueva Mejora</button>';
    }
    html += '  </div>';

    if(roomUpgrades.length === 0){
      html += '  <div style="font-size:0.76rem;color:var(--ink-dim);font-style:italic;padding:10px;text-align:center;background:rgba(0,0,0,0.2);border-radius:6px;">Aún no se han instalado mejoras en esta estancia.</div>';
    } else {
      html += '  <div class="house-inspector-upgrades-list">';
      roomUpgrades.forEach(function(u){
        var isUnlocked = !!u.unlocked;
        var hasBuff = u.effect_type === "buff" && u.buff_id;
        var buffItem = hasBuff && (typeof state !== "undefined" && state.buffCatalog)
          ? state.buffCatalog.find(function(b){ return b.id === u.buff_id; })
          : null;

        html += '    <div class="house-upgrade-item' + (isUnlocked ? ' unlocked' : '') + '">';
        html += '      <div class="house-upgrade-info">';
        html += '        <div class="house-upgrade-title">';
        html += '          <span>' + (isUnlocked ? '✅ ' : '🔒 ') + esc(u.name) + '</span>';
        html += '          <span style="font-size:0.7rem;font-family:var(--font-mono);background:rgba(212,175,55,0.2);color:var(--gold-light);padding:1px 5px;border-radius:3px;">Nv. ' + (u.level || 1) + '</span>';
        html += '        </div>';
        html += '        <div class="house-upgrade-desc">' + esc(u.description || '') + '</div>';

        if(buffItem){
          html += '        <div class="house-buff-tag">🎁 Otorga buff: <b>' + esc(buffItem.name) + '</b> (' + esc(buffItem.bonus || "+1") + ' a ' + esc(buffItem.attr || "todo") + ')</div>';
        }
        html += '      </div>';

        html += '      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;">';
        if(isGm){
          html += '        <div style="display:flex;gap:4px;">';
          html += '          <button class="btn-compact" data-action="level-up-house-upgrade" data-upgrade-id="' + u.id + '" style="font-size:0.68rem;padding:2px 6px;color:#F1C40F;" title="Subir nivel y potenciar buff">⬆️ Mejorar Buff</button>';
          html += '          <button class="btn-compact" data-action="toggle-house-upgrade" data-upgrade-id="' + u.id + '" style="font-size:0.68rem;padding:2px 6px;">' + (isUnlocked ? '🔒 Bloquear' : '🔓 Desbloquear') + '</button>';
          html += '        </div>';
        } else {
          html += '        <span style="font-size:0.7rem;font-weight:700;color:' + (isUnlocked ? '#2ECC71' : 'var(--ink-dim)') + ';">' + (isUnlocked ? 'Desbloqueada' : 'Requiere Nv.' + u.required_house_level) + '</span>';
        }

        if(isUnlocked && buffItem && curChar){
          var alreadyApplied = (curChar.activeBuffs || []).some(function(ab){ return ab.id === buffItem.id; });
          if(alreadyApplied){
            html += '        <span style="font-size:0.68rem;color:#2ECC71;font-weight:700;">✓ Activo en ' + esc(curChar.name) + '</span>';
          } else {
            html += '        <button class="house-apply-buff-btn" data-action="apply-house-buff" data-buff-id="' + buffItem.id + '" title="Aplicar este buff a tu personaje activo">✨ Aplicar a ' + esc(curChar.name) + '</button>';
          }
        }

        html += '      </div>';
        html += '    </div>';
      });
      html += '  </div>';
    }
  }

  html += '</div>';
  return html;
}

function renderHouseEventsSection(){
  var events = houseState.events || [];
  var html = '<div class="house-events-section">';
  html += '  <h3 class="house-events-title"><span>📜</span> Crónicas del Hogar Viviente (Historial)</h3>';

  if(events.length === 0){
    html += '  <div style="font-size:0.75rem;color:var(--ink-dim);font-style:italic;">No hay eventos registrados todavía.</div>';
  } else {
    html += '  <div class="house-events-list">';
    events.slice(0, 15).forEach(function(ev){
      var evClass = ev.event_type || "default";
      var msg = (ev.payload && ev.payload.message) ? ev.payload.message : "Evento registrado";
      var timeStr = "";
      try {
        var d = new Date(ev.created_at);
        timeStr = d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch(e){}

      html += '  <div class="house-event-item ' + evClass + '">';
      html += '    <span class="house-event-text">' + esc(msg) + '</span>';
      if(timeStr) html += '    <span class="house-event-time">' + timeStr + '</span>';
      html += '  </div>';
    });
    html += '  </div>';
  }

  html += '</div>';
  return html;
}

// ============================================================================
// 8. MODALES Y GESTIÓN DE MUEBLES / OBJETOS
// ============================================================================
function openAddFurnitureModal(roomId){
  var r = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!r) return;

  var overlay = document.createElement("div");
  overlay.className = "house-modal-overlay";
  overlay.id = "houseFurnitureModalOverlay";

  var html = '<div class="house-modal-box">' +
    '  <div class="house-modal-header">' +
    '    <h3 class="house-modal-title">🧰 Añadir Mueble a ' + esc(r.name) + '</h3>' +
    '    <button class="btn-compact" data-action="close-house-modal">&times;</button>' +
    '  </div>' +
    '  <input type="hidden" id="newFurRoomId" value="' + r.id + '">' +
    '  <div class="field">' +
    '    <label>Nombre del Mueble</label>' +
    '    <input type="text" id="newFurName" placeholder="Ej: Baúl de Roble Tallado, Armero de Hierro...">' +
    '  </div>' +
    '  <div class="field" style="margin-top:8px;">' +
    '    <label>Tipo de Mueble</label>' +
    '    <select id="newFurType">' +
    '      <option value="baul">Baúl / Cofre</option>' +
    '      <option value="armero">Armero / Armería</option>' +
    '      <option value="alacena">Alacena / Despensa</option>' +
    '      <option value="estanteria">Estantería de Pociones</option>' +
    '      <option value="escritorio">Escritorio / Biblioteca</option>' +
    '    </select>' +
    '  </div>' +
    '  <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px;">' +
    '    <button class="btn-compact" data-action="close-house-modal">Cancelar</button>' +
    '    <button class="btn-solid-gold" data-action="confirm-add-furniture">Instalar Mueble</button>' +
    '  </div>' +
    '</div>';

  overlay.innerHTML = html;
  document.body.appendChild(overlay);
}

function openAddItemModal(roomId, furnitureId){
  var r = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!r || !Array.isArray(r.furniture)) return;
  var fur = r.furniture.find(function(f){ return f.id === furnitureId; });
  if(!fur) return;

  var overlay = document.createElement("div");
  overlay.className = "house-modal-overlay";
  overlay.id = "houseItemModalOverlay";

  var html = '<div class="house-modal-box">' +
    '  <div class="house-modal-header">' +
    '    <h3 class="house-modal-title">Guardar en ' + esc(fur.name) + '</h3>' +
    '    <button class="btn-compact" data-action="close-house-modal">&times;</button>' +
    '  </div>' +
    '  <input type="hidden" id="itemRoomId" value="' + r.id + '">' +
    '  <input type="hidden" id="itemFurId" value="' + fur.id + '">' +
    '  <div class="field">' +
    '    <label>Nombre del Objeto</label>' +
    '    <input type="text" id="newItName" placeholder="Ej: Poción de Salud, Daga ceremonial...">' +
    '  </div>' +
    '  <div class="field" style="margin-top:8px;">' +
    '    <label>Cantidad</label>' +
    '    <input type="number" id="newItQty" min="1" max="999" value="1">' +
    '  </div>' +
    '  <div class="field" style="margin-top:8px;">' +
    '    <label>Notas / Descripción</label>' +
    '    <input type="text" id="newItNotes" placeholder="Ej: Obtenido en la misión del bosque...">' +
    '  </div>' +
    '  <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px;">' +
    '    <button class="btn-compact" data-action="close-house-modal">Cancelar</button>' +
    '    <button class="btn-solid-gold" data-action="confirm-add-furniture-item">Guardar Objeto</button>' +
    '  </div>' +
    '</div>';

  overlay.innerHTML = html;
  document.body.appendChild(overlay);
}

function confirmAddFurnitureAction(){
  var rIdEl = document.getElementById("newFurRoomId");
  var nameEl = document.getElementById("newFurName");
  var typeEl = document.getElementById("newFurType");
  if(!rIdEl || !nameEl || !nameEl.value.trim()) return;

  var r = (houseState.rooms || []).find(function(x){ return x.id === rIdEl.value; });
  if(!r) return;

  if(!Array.isArray(r.furniture)) r.furniture = [];

  var newFur = {
    id: "fur_" + Date.now(),
    name: nameEl.value.trim(),
    type: typeEl ? typeEl.value : "baul",
    items: []
  };

  r.furniture.push(newFur);
  saveHouseLocalData();
  closeHouseModal();
  renderHouseView();

  if(typeof showToast === "function") showToast("Mueble '" + newFur.name + "' instalado.", "success");

  if(typeof supabaseClient !== "undefined" && supabaseClient && r.id){
    supabaseClient.from("house_rooms").update({ furniture: r.furniture, updated_at: new Date().toISOString() }).eq("id", r.id).then(function(){});
  }
}

function confirmAddFurnitureItemAction(){
  var rIdEl = document.getElementById("itemRoomId");
  var furIdEl = document.getElementById("itemFurId");
  var nameEl = document.getElementById("newItName");
  var qtyEl = document.getElementById("newItQty");
  var notesEl = document.getElementById("newItNotes");

  if(!rIdEl || !furIdEl || !nameEl || !nameEl.value.trim()) return;

  var r = (houseState.rooms || []).find(function(x){ return x.id === rIdEl.value; });
  if(!r || !Array.isArray(r.furniture)) return;

  var fur = r.furniture.find(function(f){ return f.id === furIdEl.value; });
  if(!fur) return;

  if(!Array.isArray(fur.items)) fur.items = [];

  var itName = nameEl.value.trim();
  var itQty = Math.max(1, parseInt(qtyEl.value, 10) || 1);
  var itNotes = notesEl ? notesEl.value.trim() : "";

  fur.items.push({ name: itName, qty: itQty, notes: itNotes });

  saveHouseLocalData();
  closeHouseModal();
  renderHouseView();

  if(typeof showToast === "function") showToast("Objeto guardado en " + fur.name + ".", "success");

  if(typeof supabaseClient !== "undefined" && supabaseClient && r.id){
    supabaseClient.from("house_rooms").update({ furniture: r.furniture, updated_at: new Date().toISOString() }).eq("id", r.id).then(function(){});
  }
}

function deleteFurnitureAction(roomId, furnitureId){
  var r = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!r || !Array.isArray(r.furniture)) return;

  if(!confirm("¿Quitar este mueble y su contenido de la habitación?")) return;

  r.furniture = r.furniture.filter(function(f){ return f.id !== furnitureId; });
  saveHouseLocalData();
  renderHouseView();

  if(typeof supabaseClient !== "undefined" && supabaseClient && r.id){
    supabaseClient.from("house_rooms").update({ furniture: r.furniture, updated_at: new Date().toISOString() }).eq("id", r.id).then(function(){});
  }
}

function deleteFurnitureItemAction(roomId, furnitureId, itemIdx){
  var r = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!r || !Array.isArray(r.furniture)) return;

  var fur = r.furniture.find(function(f){ return f.id === furnitureId; });
  if(!fur || !Array.isArray(fur.items)) return;

  fur.items.splice(itemIdx, 1);
  saveHouseLocalData();
  renderHouseView();

  if(typeof supabaseClient !== "undefined" && supabaseClient && r.id){
    supabaseClient.from("house_rooms").update({ furniture: r.furniture, updated_at: new Date().toISOString() }).eq("id", r.id).then(function(){});
  }
}

// ============================================================================
// 9. MODALES DE CREACIÓN Y EDICIÓN DE SALAS Y MEJORAS
// ============================================================================
function openEditHouseDescModal(){
  var h = houseState.house || {};
  var overlay = document.createElement("div");
  overlay.className = "house-modal-overlay";
  overlay.id = "houseDescModalOverlay";

  var html = '<div class="house-modal-box">' +
    '  <div class="house-modal-header">' +
    '    <h3 class="house-modal-title">Editar Descripción de la Casa</h3>' +
    '    <button class="btn-compact" data-action="close-house-modal">&times;</button>' +
    '  </div>' +
    '  <div class="field">' +
    '    <label>Nombre de la Casa</label>' +
    '    <input type="text" id="editHouseName" value="' + esc(h.name || "La Casa Andante") + '">' +
    '  </div>' +
    '  <div class="field" style="margin-top:8px;">' +
    '    <label>Historia / Descripción Narrativa</label>' +
    '    <textarea id="editHouseDesc" rows="4" style="width:100%;font-size:0.85rem;">' + esc(h.description || "") + '</textarea>' +
    '  </div>' +
    '  <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:10px;">' +
    '    <button class="btn-compact" data-action="close-house-modal">Cancelar</button>' +
    '    <button class="btn-solid-gold" data-action="save-house-desc">Guardar Cambios</button>' +
    '  </div>' +
    '</div>';

  overlay.innerHTML = html;
  document.body.appendChild(overlay);
}

function openEditRoomModal(roomId){
  var r = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!r) return;

  var isGm = (typeof isGM === "function" && isGM());
  var chars = (typeof state !== "undefined" && state.characters) ? state.characters : [];

  var overlay = document.createElement("div");
  overlay.className = "house-modal-overlay";
  overlay.id = "houseRoomModalOverlay";

  var charOptions = '<option value="">(Sin asignar / Zona Común)</option>';
  chars.forEach(function(c){
    var charDbId = c.db_id || c.id;
    var isSel = (r.owner_character_id === charDbId || r.owner_character_id === c.id);
    charOptions += '<option value="' + esc(charDbId) + '"' + (isSel ? ' selected' : '') + '>' + esc(c.name) + '</option>';
  });

  var html = '<div class="house-modal-box">' +
    '  <div class="house-modal-header">' +
    '    <h3 class="house-modal-title">' + (isGm ? 'Editar Habitación' : 'Personalizar Mi Habitación') + '</h3>' +
    '    <button class="btn-compact" data-action="close-house-modal">&times;</button>' +
    '  </div>' +
    '  <input type="hidden" id="editRoomId" value="' + r.id + '">' +
    '  <div class="field">' +
    '    <label>Nombre de la Estancia</label>' +
    '    <input type="text" id="editRoomName" value="' + esc(r.name) + '">' +
    '  </div>';

  if(isGm){
    html += '  <div class="field" style="margin-top:8px;">' +
      '    <label>Tipo de Habitación</label>' +
      '    <select id="editRoomType">' +
      '      <option value="habitacion_comun"' + (r.room_type === "habitacion_comun" ? " selected" : "") + '>Habitación Común</option>' +
      '      <option value="habitacion_personal"' + (r.room_type === "habitacion_personal" ? " selected" : "") + '>Habitación Personal</option>' +
      '      <option value="cocina"' + (r.room_type === "cocina" ? " selected" : "") + '>Cocina</option>' +
      '      <option value="salon"' + (r.room_type === "salon" ? " selected" : "") + '>Salón</option>' +
      '      <option value="otro"' + (r.room_type === "otro" ? " selected" : "") + '>Otro / Especial</option>' +
      '    </select>' +
      '  </div>' +
      '  <div class="field" style="margin-top:8px;">' +
      '    <label>Personaje Dueño</label>' +
      '    <select id="editRoomOwner">' + charOptions + '</select>' +
      '  </div>' +
      '  <div class="field" style="margin-top:8px;">' +
      '    <label>Planta / Piso</label>' +
      '    <select id="editRoomFloor">' +
      '      <option value="1"' + ((r.floor||1) === 1 ? " selected" : "") + '>Planta 1 (Principal)</option>' +
      '      <option value="2"' + ((r.floor||1) === 2 ? " selected" : "") + '>Planta 2 (Aposentos)</option>' +
      '      <option value="3"' + ((r.floor||1) === 3 ? " selected" : "") + '>Sótano / Bodega</option>' +
      '    </select>' +
      '  </div>' +
      '  <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-top:8px;">' +
      '    <div class="field"><label>Pos X</label><input type="number" id="editRoomPosX" min="0" max="10" value="' + (r.pos_x || 0) + '"></div>' +
      '    <div class="field"><label>Pos Y</label><input type="number" id="editRoomPosY" min="0" max="10" value="' + (r.pos_y || 0) + '"></div>' +
      '    <div class="field"><label>Ancho</label><input type="number" id="editRoomWidth" min="1" max="6" value="' + (r.width || 2) + '"></div>' +
      '    <div class="field"><label>Alto</label><input type="number" id="editRoomHeight" min="1" max="6" value="' + (r.height || 2) + '"></div>' +
      '  </div>' +
      '  <div class="field" style="margin-top:8px;">' +
      '    <label>Nivel de la Habitación</label>' +
      '    <input type="number" id="editRoomLevel" min="1" max="20" value="' + (r.level || 1) + '">' +
      '  </div>';
  }

  html += '  <div class="field" style="margin-top:8px;">' +
    '    <label>Descripción / Decoración Personal</label>' +
    '    <textarea id="editRoomDesc" rows="4" style="width:100%;font-size:0.85rem;" placeholder="Escribe aquí los detalles cosméticos, decoración y objetos personales...">' + esc(r.description || "") + '</textarea>' +
    '  </div>' +
    '  <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px;">' +
    '    <button class="btn-compact" data-action="close-house-modal">Cancelar</button>' +
    '    <button class="btn-solid-gold" data-action="save-room-data">Guardar Cambios</button>' +
    '  </div>' +
    '</div>';

  overlay.innerHTML = html;
  document.body.appendChild(overlay);
}

function openCreateRoomModal(){
  var isGm = (typeof isGM === "function" && isGM());
  if(!isGm){
    if(typeof showToast === "function") showToast("Solo el Director de Juego puede crear habitaciones.", "error");
    return;
  }

  var chars = (typeof state !== "undefined" && state.characters) ? state.characters : [];
  var charOptions = '<option value="">(Sin asignar / Zona Común)</option>';
  chars.forEach(function(c){
    var charDbId = c.db_id || c.id;
    charOptions += '<option value="' + esc(charDbId) + '">' + esc(c.name) + '</option>';
  });

  var curFloor = houseState.activeFloor || 1;
  var overlay = document.createElement("div");
  overlay.className = "house-modal-overlay";
  overlay.id = "houseRoomModalOverlay";

  var html = '<div class="house-modal-box">' +
    '  <div class="house-modal-header">' +
    '    <h3 class="house-modal-title">➕ Nueva Habitación en el Plano</h3>' +
    '    <button class="btn-compact" data-action="close-house-modal">&times;</button>' +
    '  </div>' +
    '  <div class="field">' +
    '    <label>Nombre de la Estancia</label>' +
    '    <input type="text" id="newRoomName" placeholder="Ej: Laboratorio Alquímico">' +
    '  </div>' +
    '  <div class="field" style="margin-top:8px;">' +
    '    <label>Tipo de Habitación</label>' +
    '    <select id="newRoomType">' +
    '      <option value="habitacion_comun">Habitación Común</option>' +
    '      <option value="habitacion_personal">Habitación Personal</option>' +
    '      <option value="cocina">Cocina</option>' +
    '      <option value="salon">Salón</option>' +
    '      <option value="otro">Otro / Especial</option>' +
    '    </select>' +
    '  </div>' +
    '  <div class="field" style="margin-top:8px;">' +
    '    <label>Personaje Dueño (si es personal)</label>' +
    '    <select id="newRoomOwner">' + charOptions + '</select>' +
    '  </div>' +
    '  <div class="field" style="margin-top:8px;">' +
    '    <label>Planta / Piso</label>' +
    '    <select id="newRoomFloor">' +
    '      <option value="1"' + (curFloor === 1 ? " selected" : "") + '>Planta 1 (Principal)</option>' +
    '      <option value="2"' + (curFloor === 2 ? " selected" : "") + '>Planta 2 (Aposentos)</option>' +
    '      <option value="3"' + (curFloor === 3 ? " selected" : "") + '>Sótano / Bodega</option>' +
    '    </select>' +
    '  </div>' +
    '  <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-top:8px;">' +
    '    <div class="field"><label>Pos X</label><input type="number" id="newRoomPosX" min="0" max="10" value="0"></div>' +
    '    <div class="field"><label>Pos Y</label><input type="number" id="newRoomPosY" min="0" max="10" value="0"></div>' +
    '    <div class="field"><label>Ancho</label><input type="number" id="newRoomWidth" min="1" max="6" value="3"></div>' +
    '    <div class="field"><label>Alto</label><input type="number" id="newRoomHeight" min="1" max="6" value="2"></div>' +
    '  </div>' +
    '  <div class="field" style="margin-top:8px;">' +
    '    <label>Descripción / Decoración</label>' +
    '    <textarea id="newRoomDesc" rows="3" style="width:100%;font-size:0.85rem;" placeholder="Detalles de la nueva habitación..."></textarea>' +
    '  </div>' +
    '  <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px;">' +
    '    <button class="btn-compact" data-action="close-house-modal">Cancelar</button>' +
    '    <button class="btn-solid-gold" data-action="confirm-create-room">Crear Habitación</button>' +
    '  </div>' +
    '</div>';

  overlay.innerHTML = html;
  document.body.appendChild(overlay);
}

function openAddUpgradeModal(roomId){
  var r = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!r) return;

  var bCatalog = (typeof state !== "undefined" && state.buffCatalog) ? state.buffCatalog : [];
  var buffOptions = '<option value="">(Seleccionar Buff Existente...)</option>';
  bCatalog.forEach(function(b){
    buffOptions += '<option value="' + esc(b.id) + '">' + esc(b.name) + ' (' + esc(b.bonus || "") + ' ' + esc(b.attr || "") + ')</option>';
  });

  var overlay = document.createElement("div");
  overlay.className = "house-modal-overlay";
  overlay.id = "houseUpgradeModalOverlay";

  var html = '<div class="house-modal-box">' +
    '  <div class="house-modal-header">' +
    '    <h3 class="house-modal-title">✨ Añadir Mejora a ' + esc(r.name) + '</h3>' +
    '    <button class="btn-compact" data-action="close-house-modal">&times;</button>' +
    '  </div>' +
    '  <input type="hidden" id="newUpgRoomId" value="' + r.id + '">' +
    '  <div class="field">' +
    '    <label>Nombre de la Mejora</label>' +
    '    <input type="text" id="newUpgName" placeholder="Ej: Horno Encantado, Alambique Mágico...">' +
    '  </div>' +
    '  <div class="field" style="margin-top:8px;">' +
    '    <label>Descripción / Efecto Narrativo</label>' +
    '    <textarea id="newUpgDesc" rows="3" style="width:100%;font-size:0.85rem;" placeholder="Qué hace esta mejora y cómo impacta en la partida..."></textarea>' +
    '  </div>' +
    '  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">' +
    '    <div class="field">' +
    '      <label>Nivel Mínimo de Casa</label>' +
    '      <input type="number" id="newUpgReqLvl" min="1" max="20" value="1">' +
    '    </div>' +
    '    <div class="field">' +
    '      <label>Tipo de Efecto</label>' +
    '      <select id="newUpgType">' +
    '        <option value="narrativo">Solo Narrativo / Estético</option>' +
    '        <option value="buff">Otorga Buff Mecánico</option>' +
    '      </select>' +
    '    </div>' +
    '  </div>' +
    '  <div id="newUpgBuffSelectorWrap" class="field" style="margin-top:8px;display:none;">' +
    '    <label>Vincular Buff del Catálogo</label>' +
    '    <select id="newUpgBuffId">' + buffOptions + '</select>' +
    '    <div style="font-size:0.7rem;color:var(--ink-dim);margin-top:4px;">Si la mejora otorga un buff mecánico, selecciónalo aquí para que esté disponible en combate.</div>' +
    '  </div>' +
    '  <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px;">' +
    '    <button class="btn-compact" data-action="close-house-modal">Cancelar</button>' +
    '    <button class="btn-solid-gold" data-action="confirm-create-upgrade">Instalar Mejora</button>' +
    '  </div>' +
    '</div>';

  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  var selectType = overlay.querySelector("#newUpgType");
  var buffWrap = overlay.querySelector("#newUpgBuffSelectorWrap");
  if(selectType && buffWrap){
    selectType.addEventListener("change", function(){
      buffWrap.style.display = (this.value === "buff") ? "block" : "none";
    });
  }
}

function closeHouseModal(){
  var o1 = document.getElementById("houseDescModalOverlay");
  if(o1) o1.remove();
  var o2 = document.getElementById("houseRoomModalOverlay");
  if(o2) o2.remove();
  var o3 = document.getElementById("houseUpgradeModalOverlay");
  if(o3) o3.remove();
  var o4 = document.getElementById("houseFurnitureModalOverlay");
  if(o4) o4.remove();
  var o5 = document.getElementById("houseItemModalOverlay");
  if(o5) o5.remove();
}

async function saveHouseDescAction(){
  var nameEl = document.getElementById("editHouseName");
  var descEl = document.getElementById("editHouseDesc");
  if(!nameEl || !descEl) return;

  var newName = nameEl.value.trim() || "La Casa Andante";
  var newDesc = descEl.value.trim();

  houseState.house.name = newName;
  houseState.house.description = newDesc;
  saveHouseLocalData();
  closeHouseModal();
  renderHouseView();

  if(typeof supabaseClient !== "undefined" && supabaseClient && houseState.house.id){
    try {
      await supabaseClient.from("house").update({
        name: newName,
        description: newDesc,
        updated_at: new Date().toISOString()
      }).eq("id", houseState.house.id);
      if(typeof showToast === "function") showToast("Descripción actualizada.", "success");
    } catch(e){}
  }
}

async function saveRoomDataAction(){
  var idEl = document.getElementById("editRoomId");
  var nameEl = document.getElementById("editRoomName");
  var descEl = document.getElementById("editRoomDesc");
  if(!idEl || !nameEl || !descEl) return;

  var rId = idEl.value;
  var r = (houseState.rooms || []).find(function(x){ return x.id === rId; });
  if(!r) return;

  var isGm = (typeof isGM === "function" && isGM());

  r.name = nameEl.value.trim() || r.name;
  r.description = descEl.value.trim();

  var remoteUpdatePayload = {
    name: r.name,
    description: r.description,
    updated_at: new Date().toISOString()
  };

  if(isGm){
    var typeEl = document.getElementById("editRoomType");
    var ownerEl = document.getElementById("editRoomOwner");
    var floorEl = document.getElementById("editRoomFloor");
    var posXEl = document.getElementById("editRoomPosX");
    var posYEl = document.getElementById("editRoomPosY");
    var widthEl = document.getElementById("editRoomWidth");
    var heightEl = document.getElementById("editRoomHeight");
    var lvlEl = document.getElementById("editRoomLevel");

    if(typeEl) r.room_type = typeEl.value;
    if(ownerEl) r.owner_character_id = ownerEl.value || null;
    if(floorEl) r.floor = parseInt(floorEl.value, 10) || 1;
    if(posXEl) r.pos_x = Math.max(0, parseInt(posXEl.value, 10) || 0);
    if(posYEl) r.pos_y = Math.max(0, parseInt(posYEl.value, 10) || 0);
    if(widthEl) r.width = Math.max(1, parseInt(widthEl.value, 10) || 2);
    if(heightEl) r.height = Math.max(1, parseInt(heightEl.value, 10) || 2);
    if(lvlEl) r.level = Math.max(1, parseInt(lvlEl.value, 10) || 1);

    remoteUpdatePayload.room_type = r.room_type;
    remoteUpdatePayload.owner_character_id = r.owner_character_id;
    remoteUpdatePayload.floor = r.floor;
    remoteUpdatePayload.pos_x = r.pos_x;
    remoteUpdatePayload.pos_y = r.pos_y;
    remoteUpdatePayload.width = r.width;
    remoteUpdatePayload.height = r.height;
    remoteUpdatePayload.level = r.level;
  }

  saveHouseLocalData();
  closeHouseModal();
  renderHouseView();

  if(typeof supabaseClient !== "undefined" && supabaseClient && r.id){
    try {
      await supabaseClient.from("house_rooms").update(remoteUpdatePayload).eq("id", r.id);
      if(typeof showToast === "function") showToast("Habitación guardada.", "success");
    } catch(e){}
  }
}

async function confirmCreateRoomAction(){
  var nameEl = document.getElementById("newRoomName");
  var typeEl = document.getElementById("newRoomType");
  var ownerEl = document.getElementById("newRoomOwner");
  var floorEl = document.getElementById("newRoomFloor");
  var posXEl = document.getElementById("newRoomPosX");
  var posYEl = document.getElementById("newRoomPosY");
  var widthEl = document.getElementById("newRoomWidth");
  var heightEl = document.getElementById("newRoomHeight");
  var descEl = document.getElementById("newRoomDesc");

  if(!nameEl || !nameEl.value.trim()){
    if(typeof showToast === "function") showToast("Indica un nombre para la habitación.", "warning");
    return;
  }

  var newId = "r_" + Date.now();
  var newRoom = {
    id: newId,
    house_id: houseState.house ? houseState.house.id : "h0000000-0000-0000-0000-000000000001",
    room_type: typeEl ? typeEl.value : "habitacion_comun",
    name: nameEl.value.trim(),
    owner_character_id: (ownerEl && ownerEl.value) ? ownerEl.value : null,
    level: 1,
    description: descEl ? descEl.value.trim() : "",
    floor: floorEl ? (parseInt(floorEl.value, 10) || 1) : 1,
    pos_x: posXEl ? Math.max(0, parseInt(posXEl.value, 10) || 0) : 0,
    pos_y: posYEl ? Math.max(0, parseInt(posYEl.value, 10) || 0) : 0,
    width: widthEl ? Math.max(1, parseInt(widthEl.value, 10) || 2) : 3,
    height: heightEl ? Math.max(1, parseInt(heightEl.value, 10) || 2) : 2,
    furniture: [],
    created_at: new Date().toISOString()
  };

  houseState.rooms.push(newRoom);
  houseState.selectedRoomId = newRoom.id;
  houseState.activeFloor = newRoom.floor;
  saveHouseLocalData();
  closeHouseModal();
  renderHouseView();

  if(typeof supabaseClient !== "undefined" && supabaseClient && houseState.house && houseState.house.id){
    try {
      var remotePayload = Object.assign({}, newRoom);
      if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(remotePayload.id)){
        delete remotePayload.id;
      }
      var res = await supabaseClient.from("house_rooms").insert(remotePayload).select().maybeSingle();
      if(res && res.data && res.data.id){
        newRoom.id = res.data.id;
        saveHouseLocalData();
      }
      if(typeof showToast === "function") showToast("Habitación creada en el plano.", "success");
    } catch(e){}
  }
}

async function confirmCreateUpgradeAction(){
  var rIdEl = document.getElementById("newUpgRoomId");
  var nameEl = document.getElementById("newUpgName");
  var descEl = document.getElementById("newUpgDesc");
  var reqLvlEl = document.getElementById("newUpgReqLvl");
  var typeEl = document.getElementById("newUpgType");
  var buffIdEl = document.getElementById("newUpgBuffId");

  if(!nameEl || !nameEl.value.trim()){
    if(typeof showToast === "function") showToast("Indica un nombre para la mejora.", "warning");
    return;
  }

  var effType = typeEl ? typeEl.value : "narrativo";
  var buffId = (effType === "buff" && buffIdEl) ? (buffIdEl.value || null) : null;

  var newUpg = {
    id: "u_" + Date.now(),
    house_id: houseState.house ? houseState.house.id : "h0000000-0000-0000-0000-000000000001",
    room_id: rIdEl ? rIdEl.value : null,
    name: nameEl.value.trim(),
    description: descEl ? descEl.value.trim() : "",
    unlocked: false,
    level: 1,
    bonus_value: "+1",
    effect_type: effType,
    buff_id: buffId,
    required_house_level: reqLvlEl ? Math.max(1, parseInt(reqLvlEl.value, 10) || 1) : 1,
    created_at: new Date().toISOString()
  };

  houseState.upgrades.push(newUpg);
  saveHouseLocalData();
  closeHouseModal();
  renderHouseView();

  if(typeof showToast === "function") showToast("Mejora registrada en la estancia.", "success");

  if(typeof supabaseClient !== "undefined" && supabaseClient && houseState.house && houseState.house.id){
    try {
      var remotePayload = Object.assign({}, newUpg);
      if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(remotePayload.id)){
        delete remotePayload.id;
      }
      var res = await supabaseClient.from("house_upgrades").insert(remotePayload).select().maybeSingle();
      if(res && res.data && res.data.id){
        newUpg.id = res.data.id;
        saveHouseLocalData();
      }
    } catch(e){}
  }
}

async function deleteHouseRoomAction(roomId){
  if(!roomId) return;
  if(!confirm("¿Seguro que deseas eliminar esta habitación del plano de la casa?")) return;

  houseState.rooms = houseState.rooms.filter(function(x){ return x.id !== roomId; });
  if(houseState.selectedRoomId === roomId){
    houseState.selectedRoomId = null;
  }
  saveHouseLocalData();
  renderHouseView();

  if(typeof supabaseClient !== "undefined" && supabaseClient){
    try {
      await supabaseClient.from("house_rooms").delete().eq("id", roomId);
      if(typeof showToast === "function") showToast("Habitación eliminada.", "info");
    } catch(e){}
  }
}

// ============================================================================
// 10. TRANSICIONES Y NAVEGACIÓN
// ============================================================================
function openHouseView(){
  if(!CONFIG_ENABLE_HOUSE) return;
  houseState.active = true;
  if(typeof state !== "undefined"){
    state.activeTab = "casa";
    if(typeof saveState === "function") saveState(true);
  }

  if(typeof closeModals === "function") closeModals();

  renderHouseView();
  fetchHouseRemoteData().then(function(){
    if(houseState.active || (typeof state !== "undefined" && state.activeTab === "casa")){
      renderHouseView();
    }
  });
}

function backFromHouseView(){
  houseState.active = false;
  houseState.selectedRoomId = null;
  if(typeof state !== "undefined"){
    state.activeTab = "ficha";
    if(typeof saveState === "function") saveState(true);
  }
  if(typeof renderTabbar === "function") renderTabbar();
  if(typeof renderTab === "function") renderTab();
}

// ============================================================================
// 11. GESTOR DE EVENTOS DELEGADOS PARA LA CASA
// ============================================================================
document.addEventListener("click", function(e){
  var btn = e.target.closest("[data-action]");
  if(!btn) return;

  var act = btn.getAttribute("data-action");

  if(act === "open-house-view"){
    e.preventDefault();
    openHouseView();
  } else if(act === "back-from-house-view"){
    e.preventDefault();
    backFromHouseView();
  } else if(act === "switch-house-floor"){
    var fl = parseInt(btn.getAttribute("data-floor"), 10) || 1;
    houseState.activeFloor = fl;
    renderHouseView();
  } else if(act === "switch-inspector-tab"){
    var inspTab = btn.getAttribute("data-tab") || "estancia";
    houseState.inspectorTab = inspTab;
    renderHouseView();
  } else if(act === "toggle-house-edit-mode"){
    if(typeof isGM === "function" && isGM()){
      houseState.editMode = !houseState.editMode;
      renderHouseView();
    }
  } else if(act === "select-house-room"){
    if(houseSuppressNextClick){
      e.preventDefault();
      return;
    }
    var rId = btn.getAttribute("data-room-id");
    houseState.selectedRoomId = (houseState.selectedRoomId === rId) ? null : rId;
    renderHouseView();
  } else if(act === "close-room-inspector"){
    houseState.selectedRoomId = null;
    renderHouseView();
  } else if(act === "nudge-room"){
    var ndx = parseInt(btn.getAttribute("data-dx"), 10) || 0;
    var ndy = parseInt(btn.getAttribute("data-dy"), 10) || 0;
    nudgeSelectedRoom(ndx, ndy);
  } else if(act === "resize-room"){
    var rdw = parseInt(btn.getAttribute("data-dw"), 10) || 0;
    var rdh = parseInt(btn.getAttribute("data-dh"), 10) || 0;
    resizeSelectedRoom(rdw, rdh);
  } else if(act === "set-room-floor"){
    var srfId = btn.getAttribute("data-room-id");
    var srfFl = parseInt(btn.getAttribute("data-floor"), 10) || 1;
    setRoomFloor(srfId, srfFl);
  } else if(act === "grant-room-level"){
    var grlId = btn.getAttribute("data-room-id") || houseState.selectedRoomId;
    grantRoomLevel(grlId);
  } else if(act === "open-edit-house-desc"){
    openEditHouseDescModal();
  } else if(act === "save-house-desc"){
    saveHouseDescAction();
  } else if(act === "open-edit-room-modal"){
    var editId = btn.getAttribute("data-room-id") || houseState.selectedRoomId;
    openEditRoomModal(editId);
  } else if(act === "save-room-data"){
    saveRoomDataAction();
  } else if(act === "open-create-room-modal"){
    openCreateRoomModal();
  } else if(act === "confirm-create-room"){
    confirmCreateRoomAction();
  } else if(act === "delete-house-room"){
    var delId = btn.getAttribute("data-room-id") || houseState.selectedRoomId;
    deleteHouseRoomAction(delId);
  } else if(act === "close-house-modal"){
    closeHouseModal();
  } else if(act === "add-house-progress"){
    var amt = parseInt(btn.getAttribute("data-amount"), 10) || 0;
    var stName = btn.getAttribute("data-stat") || "general";
    addHouseProgress(amt, stName);
  } else if(act === "prompt-house-progress"){
    var stPrompt = btn.getAttribute("data-stat") || "general";
    var customAmt = prompt("Indica la cantidad de progreso a otorgar (ej: 35):", "25");
    if(customAmt !== null){
      var parsedAmt = parseInt(customAmt, 10);
      if(!isNaN(parsedAmt) && parsedAmt !== 0){
        addHouseProgress(parsedAmt, stPrompt);
      }
    }
  } else if(act === "open-add-upgrade-modal"){
    var upgRoomId = btn.getAttribute("data-room-id") || houseState.selectedRoomId;
    openAddUpgradeModal(upgRoomId);
  } else if(act === "confirm-create-upgrade"){
    confirmCreateUpgradeAction();
  } else if(act === "toggle-house-upgrade"){
    var toggleUpgId = btn.getAttribute("data-upgrade-id");
    var upgToToggle = (houseState.upgrades || []).find(function(u){ return u.id === toggleUpgId; });
    if(upgToToggle){
      toggleHouseUpgrade(toggleUpgId, !upgToToggle.unlocked);
    }
  } else if(act === "level-up-house-upgrade"){
    var lvlUpgId = btn.getAttribute("data-upgrade-id");
    levelUpHouseUpgrade(lvlUpgId);
  } else if(act === "apply-house-buff"){
    var bToApplyId = btn.getAttribute("data-buff-id");
    if(bToApplyId){
      applyHouseBuffToActiveChar(bToApplyId);
    }
  } else if(act === "open-add-furniture-modal"){
    var furRId = btn.getAttribute("data-room-id") || houseState.selectedRoomId;
    openAddFurnitureModal(furRId);
  } else if(act === "confirm-add-furniture"){
    confirmAddFurnitureAction();
  } else if(act === "open-add-item-modal"){
    var itRId = btn.getAttribute("data-room-id");
    var itFId = btn.getAttribute("data-furniture-id");
    openAddItemModal(itRId, itFId);
  } else if(act === "confirm-add-furniture-item"){
    confirmAddFurnitureItemAction();
  } else if(act === "delete-furniture"){
    var dfRId = btn.getAttribute("data-room-id");
    var dfFId = btn.getAttribute("data-furniture-id");
    deleteFurnitureAction(dfRId, dfFId);
  } else if(act === "delete-furniture-item"){
    var dfiRId = btn.getAttribute("data-room-id");
    var dfiFId = btn.getAttribute("data-furniture-id");
    var dfiIdx = parseInt(btn.getAttribute("data-item-idx"), 10);
    deleteFurnitureItemAction(dfiRId, dfiFId, dfiIdx);
  } else if(act === "create-house-corridor"){
    createHouseCorridorAction();
  } else if(act === "zoom-house-in"){
    houseState.zoom = Math.min(1.7, (houseState.zoom || 1.0) + 0.15);
    renderHouseView();
  } else if(act === "zoom-house-out"){
    houseState.zoom = Math.max(0.65, (houseState.zoom || 1.0) - 0.15);
    renderHouseView();
  } else if(act === "zoom-house-reset"){
    houseState.zoom = 1.0;
    renderHouseView();
  } else if(act === "toggle-decor-palette"){
    var pal = document.getElementById("houseDecorPalette");
    if(pal){
      pal.style.display = (pal.style.display === "none") ? "block" : "none";
    }
  } else if(act === "add-room-decor"){
    var decRId = btn.getAttribute("data-room-id");
    var decType = btn.getAttribute("data-decor-type");
    addRoomDecor(decRId, decType);
  } else if(act === "rotate-room-furniture"){
    e.stopPropagation();
    var rfRId = btn.getAttribute("data-room-id");
    var rfFId = btn.getAttribute("data-furniture-id");
    rotateRoomFurniture(rfRId, rfFId);
  } else if(act === "rotate-room-decor"){
    e.stopPropagation();
    var rdRId = btn.getAttribute("data-room-id");
    var rdDId = btn.getAttribute("data-decor-id");
    rotateRoomDecor(rdRId, rdDId);
  } else if(act === "delete-room-decor"){
    e.stopPropagation();
    var ddRId = btn.getAttribute("data-room-id");
    var ddDId = btn.getAttribute("data-decor-id");
    deleteRoomDecor(ddRId, ddDId);
  }
});
