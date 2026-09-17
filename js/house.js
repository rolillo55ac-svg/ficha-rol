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
  editMode: false,
  zoom: 1.0,
  studioRoomId: null,
  studioCategory: "todas",
  studioSearch: "",
  selectedItemId: null
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
      // PLANTA 1: Estancias Comunes y Aposentos Principales (16 Columnas)
      {
        id: salonId,
        house_id: houseId,
        room_type: "salon",
        name: "Salón del Hogar Caliente",
        owner_character_id: null,
        level: 1,
        description: "Espaciosa sala central con chimenea encantada, sillones de terciopelo gastado y un atril donde reposa el Libro Guía.",
        pos_x: 0, pos_y: 0, width: 7, height: 4, floor: 1,
        furniture: [
          {
            id: "fur_salon_1",
            name: "Librería y Atril del Libro Viviente",
            type: "libreria",
            pos_x: 1, pos_y: 0, rotation: 0, w: 2, h: 1,
            items: [
              { name: "Crónicas de Krysalis (Tomo I)", qty: 1, notes: "Relatos de las primeras leyendas." }
            ]
          },
          {
            id: "fur_salon_chimenea",
            name: "Chimenea de Piedra y Leña",
            type: "chimenea",
            pos_x: 3, pos_y: 0, rotation: 0, w: 2, h: 2,
            items: []
          }
        ],
        decor: [
          { id: "dec_salon_alf", type: "alfombra", label: "Alfombra tejida", icon: "🧶", pos_x: 2, pos_y: 1, rotation: 0, w: 3, h: 2 }
        ]
      },
      {
        id: "r_stairs_p1",
        house_id: houseId,
        room_type: "escaleras",
        name: "Escaleras Principales",
        owner_character_id: null,
        level: 1,
        description: "Peldaños de roble que ascienden con un suave crujido hacia la Planta Alta.",
        pos_x: 7, pos_y: 0, width: 2, height: 2, floor: 1,
        furniture: [],
        decor: []
      },
      {
        id: "r_corr_central",
        house_id: houseId,
        room_type: "pasillo",
        name: "Galería Central",
        owner_character_id: null,
        level: 1,
        description: "Galería enlosada que conecta todas las alas de la casa.",
        pos_x: 7, pos_y: 2, width: 2, height: 6, floor: 1,
        furniture: [],
        decor: []
      },
      {
        id: cocinaId,
        house_id: houseId,
        room_type: "cocina",
        name: "Cocina del Caldero Errante",
        owner_character_id: null,
        level: 1,
        description: "Cocina rústica donde el fuego nunca se apaga. Huele a especias raras y caldo caliente.",
        pos_x: 9, pos_y: 0, width: 7, height: 4, floor: 1,
        furniture: [
          {
            id: "fur_cocina_1",
            name: "Alacena de Roble Encantado",
            type: "alacena",
            pos_x: 1, pos_y: 0, rotation: 0, w: 2, h: 1,
            items: [
              { name: "Especias del Bosque Negro", qty: 3, notes: "Realza el sabor y valor nutritivo." },
              { name: "Ración de viaje curada", qty: 6, notes: "Alimento imperecedero." }
            ]
          },
          {
            id: "fur_cocina_fogon",
            name: "Fogón y Caldero",
            type: "cocina",
            pos_x: 4, pos_y: 0, rotation: 0, w: 2, h: 2,
            items: []
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
        pos_x: 0, pos_y: 4, width: 7, height: 4, floor: 1,
        furniture: [
          {
            id: "fur_cherk_cama",
            name: "Cama Individual",
            type: "cama",
            pos_x: 1, pos_y: 1, rotation: 0, w: 2, h: 2,
            items: []
          },
          {
            id: "fur_cherk_1",
            name: "Estantería de Frascos y Musgos",
            type: "estanteria",
            pos_x: 4, pos_y: 0, rotation: 0, w: 2, h: 1,
            items: [
              { name: "Seta terrosa recolectada", qty: 2, notes: "Para ungüentos botánicos." },
              { name: "Frasco de savia espesa", qty: 1, notes: "Cosechada cerca del río." }
            ]
          },
          {
            id: "fur_cherk_2",
            name: "Baúl de Viaje",
            type: "baul",
            pos_x: 4, pos_y: 2, rotation: 0, w: 1, h: 1,
            items: [
              { name: "Cuerda de cáñamo resistente", qty: 1, notes: "10 metros con nudos." }
            ]
          }
        ],
        decor: [
          { id: "dec_cherk_planta", type: "planta", label: "Planta silvestre", icon: "🌿", pos_x: 0, pos_y: 0, rotation: 0, w: 1, h: 1 }
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
        pos_x: 9, pos_y: 4, width: 7, height: 4, floor: 1,
        furniture: [
          {
            id: "fur_scarleth_cama",
            name: "Cama Individual",
            type: "cama",
            pos_x: 4, pos_y: 1, rotation: 0, w: 2, h: 2,
            items: []
          },
          {
            id: "fur_scarleth_1",
            name: "Escritorio de Pergaminos Arcanos",
            type: "escritorio",
            pos_x: 1, pos_y: 1, rotation: 0, w: 2, h: 1,
            items: [
              { name: "Tinta violeta encantada", qty: 2, notes: "Brilla suavemente en la oscuridad." }
            ]
          }
        ]
      },
      {
        id: "r_entrada_main",
        house_id: houseId,
        room_type: "entrada",
        name: "Entrada Principal",
        owner_character_id: null,
        level: 1,
        description: "Umbral exterior de madera reforzada y porche de bienvenida.",
        pos_x: 7, pos_y: 8, width: 2, height: 2, floor: 1,
        furniture: [],
        decor: []
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
        pos_x: 0, pos_y: 0, width: 7, height: 4, floor: 2,
        furniture: [
          {
            id: "fur_derek_1",
            name: "Armero de Madera Reforzada",
            type: "armero",
            pos_x: 1, pos_y: 0, rotation: 0, w: 2, h: 1,
            items: [
              { name: "Piedra de afilar de grano fino", qty: 1, notes: "Mantiene los filos impecables." }
            ]
          }
        ]
      },
      {
        id: "r_stairs_p2",
        house_id: houseId,
        room_type: "escaleras",
        name: "Escaleras Superiores",
        owner_character_id: null,
        level: 1,
        description: "Desembarco de peldaños que descienden a la Planta Baja.",
        pos_x: 7, pos_y: 0, width: 2, height: 2, floor: 2,
        furniture: [],
        decor: []
      },
      {
        id: "r_corr_p2",
        house_id: houseId,
        room_type: "pasillo",
        name: "Galería Alta",
        owner_character_id: null,
        level: 1,
        description: "Pasillo superior que comunica las habitaciones del piso alto.",
        pos_x: 7, pos_y: 2, width: 2, height: 6, floor: 2,
        furniture: [],
        decor: []
      },
      {
        id: "r0000000-0000-0000-0000-000000000006",
        house_id: houseId,
        room_type: "habitacion_personal",
        name: "Taller de Bucky",
        owner_character_id: "4d8dd9b1-b5aa-430e-ae19-79c35b6c3c5e",
        level: 1,
        description: "Espacio lleno de herramientas curiosas, engranajes y pieles de animales curtidas.",
        pos_x: 9, pos_y: 0, width: 7, height: 4, floor: 2,
        furniture: [
          {
            id: "fur_bucky_1",
            name: "Banco de Trabajo y Herramientas",
            type: "banco",
            pos_x: 1, pos_y: 0, rotation: 0, w: 2, h: 1,
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
        pos_x: 0, pos_y: 4, width: 7, height: 4, floor: 2,
        furniture: [
          {
            id: "fur_ink_1",
            name: "Cofre de Bocetos y Lienzos",
            type: "baul",
            pos_x: 1, pos_y: 0, rotation: 0, w: 1, h: 1,
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

// Migrador a 16 columnas para partidas y memorias locales previas
function migrateRoomsTo16Cols(rooms){
  if(!Array.isArray(rooms) || rooms.length === 0) return rooms;
  var maxX = 0;
  for(var i = 0; i < rooms.length; i++){
    var r = rooms[i];
    if(((r.pos_x || 0) + (r.width || 2)) > maxX) maxX = (r.pos_x || 0) + (r.width || 2);
  }

  var seed = getSeedHouseData();
  var seedMap = {};
  seed.rooms.forEach(function(sr){
    seedMap[sr.id] = sr;
    seedMap[sr.name] = sr;
  });

  if(maxX <= 6){
    rooms.forEach(function(r){
      var match = seedMap[r.id] || seedMap[r.name];
      if(match){
        r.pos_x = match.pos_x;
        r.pos_y = match.pos_y;
        r.width = match.width;
        r.height = match.height;
        r.floor = match.floor;
      } else {
        r.pos_x = Math.round((r.pos_x || 0) * 2.3);
        r.width = Math.max(3, Math.round((r.width || 2) * 2.3));
      }
    });
  }

  // Garantizar existencia de Entrada Principal
  var hasEntrada = rooms.some(function(r){ return r.room_type === "entrada" || r.id === "r_entrada_main"; });
  if(!hasEntrada){
    var entradaSeed = seed.rooms.find(function(sr){ return sr.room_type === "entrada"; });
    if(entradaSeed) rooms.push(entradaSeed);
  }

  // Garantizar existencia de Escaleras en Planta 1 y Planta 2
  var hasStairsP1 = rooms.some(function(r){ return r.room_type === "escaleras" && (r.floor || 1) === 1; });
  if(!hasStairsP1){
    var sP1 = seed.rooms.find(function(sr){ return sr.id === "r_stairs_p1"; });
    if(sP1) rooms.push(sP1);
  }
  var hasStairsP2 = rooms.some(function(r){ return r.room_type === "escaleras" && (r.floor || 1) === 2; });
  if(!hasStairsP2){
    var sP2 = seed.rooms.find(function(sr){ return sr.id === "r_stairs_p2"; });
    if(sP2) rooms.push(sP2);
  }

  return rooms;
}

function loadHouseLocalData(){
  try {
    var raw = localStorage.getItem("krysalis_house_beta_v1");
    if(raw){
      var parsed = JSON.parse(raw);
      if(parsed && parsed.house && Array.isArray(parsed.rooms)){
        houseState.house = parsed.house;
        houseState.rooms = migrateRoomsTo16Cols(parsed.rooms);
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
// 1.5. SINCRONIZACIÓN EN TIEMPO REAL Y COLORES DE ESTANCIAS
// ============================================================================
var HOUSE_COLOR_PALETTES = [
  { id: "default", name: "Por Defecto", hex: "", desc: "Fondo arquitectónico original del tipo de sala" },
  { id: "wood", name: "Madera Noble", hex: "#2a1e16", desc: "Suelo de roble y madera cálida" },
  { id: "stone", name: "Piedra y Granito", hex: "#1c2127", desc: "Cantería robusta y losas templadas" },
  { id: "corridor_gold", name: "Galería Ámbar", hex: "#262015", desc: "Tono dorado para pasillos y circulación" },
  { id: "velvet_wine", name: "Terciopelo Burdeos", hex: "#2c1117", desc: "Elegancia imperial y calidez" },
  { id: "emerald_moss", name: "Musgo Esmeralda", hex: "#12251a", desc: "Toque natural y botánico" },
  { id: "arcane_indigo", name: "Índigo Arcano", hex: "#14172e", desc: "Misterio y magia nocturna" },
  { id: "amethyst", name: "Amatista Mística", hex: "#22132d", desc: "Ambiente encantado y ritos" },
  { id: "terracotta", name: "Terracota Cálido", hex: "#321b12", desc: "Horno, barro cocido y fogón" },
  { id: "obsidian", name: "Obsidiana Carbón", hex: "#131416", desc: "Profundidad sobria y minimalista" },
  { id: "parchment", name: "Pergamino Antiguo", hex: "#292620", desc: "Estudio, libros y cartografía" }
];

function getRoomCustomBackground(hex){
  if(!hex) return "";
  return "linear-gradient(135deg, " + hex + "FA, " + hex + "D8)";
}

function renderColorPaletteBar(roomId, currentColor){
  var html = '<div class="house-color-palette-bar">';
  HOUSE_COLOR_PALETTES.forEach(function(p){
    var isSel = (currentColor === p.hex || (!currentColor && !p.hex));
    html += '<button class="house-color-chip' + (isSel ? ' is-active' : '') + '" style="background:' + (p.hex || '#1a1816') + ';" data-action="set-room-color" data-room-id="' + roomId + '" data-color="' + p.hex + '" title="' + p.name + ' - ' + p.desc + '"></button>';
  });
  html += '<input type="color" class="house-custom-color-input" value="' + (currentColor || '#2a1e16') + '" data-action="canva-custom-color-input" data-room-id="' + roomId + '" title="Color personalizado">';
  html += '</div>';
  return html;
}

function saveRoomChangesToRemoteAndBroadcast(room, fieldName){
  if(!room) return;

  // 1. Persistencia local inmediata en este dispositivo
  saveHouseLocalData();

  // 2. Broadcast en tiempo real para todos los clientes (móvil, PC, tablets)
  if(typeof realtimeChannel !== "undefined" && realtimeChannel && typeof realtimeChannel.send === "function"){
    try {
      realtimeChannel.send({
        type: "broadcast",
        event: "house_room_update",
        payload: {
          roomId: room.id,
          furniture: room.furniture || [],
          decor: room.decor || [],
          color: room.color || null,
          name: room.name,
          room_type: room.room_type,
          pos_x: room.pos_x,
          pos_y: room.pos_y,
          width: room.width,
          height: room.height,
          floor: room.floor,
          level: room.level,
          description: room.description,
          updated_at: new Date().toISOString()
        }
      }).catch(function(err){
        console.warn("Aviso enviando broadcast de estancia:", err);
      });
    } catch(e){}
  }

  // 3. Persistencia atómica en Supabase con UPSERT (Garantiza inserción o actualización)
  if(typeof supabaseClient !== "undefined" && supabaseClient && room.id && navigator.onLine){
    var payload = {
      id: room.id,
      house_id: room.house_id || (houseState.house ? houseState.house.id : "h0000000-0000-0000-0000-000000000001"),
      room_type: room.room_type || "otro",
      name: room.name,
      owner_character_id: room.owner_character_id || null,
      level: room.level || 1,
      description: room.description || "",
      pos_x: (typeof room.pos_x === "number") ? room.pos_x : 0,
      pos_y: (typeof room.pos_y === "number") ? room.pos_y : 0,
      width: Math.max(1, room.width || 2),
      height: Math.max(1, room.height || 2),
      floor: room.floor || 1,
      furniture: Array.isArray(room.furniture) ? room.furniture : [],
      decor: Array.isArray(room.decor) ? room.decor : [],
      color: room.color || null,
      updated_at: new Date().toISOString()
    };

    supabaseClient.from("house_rooms")
      .upsert(payload, { onConflict: "id" })
      .select()
      .then(function(res){
        if(res.error){
          console.warn("Aviso al guardar habitacion en Supabase:", res.error.message || res.error);
          supabaseClient.from("house_rooms")
            .update(payload)
            .eq("id", room.id)
            .then(function(){});
        }
      })
      .catch(function(err){
        console.warn("Error de conexión al persistir estancia:", err);
      });
  }
}

function handleRemoteHouseRoomUpdate(payload){
  if(!payload) return;
  var rId = payload.id || payload.roomId;
  if(!rId) return;

  var room = (houseState.rooms || []).find(function(x){ return x.id === rId; });
  if(!room) return;

  if(payload.furniture !== undefined) room.furniture = payload.furniture;
  if(payload.decor !== undefined) room.decor = payload.decor;
  if(payload.color !== undefined) room.color = payload.color;
  if(payload.name !== undefined) room.name = payload.name;
  if(payload.pos_x !== undefined) room.pos_x = payload.pos_x;
  if(payload.pos_y !== undefined) room.pos_y = payload.pos_y;
  if(payload.width !== undefined) room.width = payload.width;
  if(payload.height !== undefined) room.height = payload.height;
  if(payload.floor !== undefined) room.floor = payload.floor;
  if(payload.level !== undefined) room.level = payload.level;
  if(payload.room_type !== undefined) room.room_type = payload.room_type;

  saveHouseLocalData();
  if(houseState.active){
    renderHouseView();
  }
}

function initHouseRealtimeSync(){
  if(typeof realtimeChannel !== "undefined" && realtimeChannel){
    try {
      realtimeChannel.on("broadcast", { event: "house_room_update" }, function(msg){
        if(msg && msg.payload){
          handleRemoteHouseRoomUpdate(msg.payload);
        }
      });
      realtimeChannel.on("broadcast", { event: "house_general_update" }, function(msg){
        fetchHouseRemoteData().then(function(){
          if(houseState.active) renderHouseView();
        });
      });
    } catch(err){
      console.warn("Error vinculando broadcast de La Casa:", err);
    }
  }

  // Suscripción directa de Postgres Realtime para house_rooms si Supabase está activo
  if(typeof supabaseClient !== "undefined" && supabaseClient && !houseState._subscribedRealtime){
    try {
      houseState._subscribedRealtime = true;
      supabaseClient.channel("realtime_house_rooms")
        .on("postgres_changes", { event: "*", schema: "public", table: "house_rooms" }, function(payload){
          if(payload && payload.new && payload.new.id){
            handleRemoteHouseRoomUpdate(payload.new);
          }
        })
        .subscribe();
    } catch(err){
      console.warn("Error suscribiendo a postgres_changes de house_rooms:", err);
    }
  }
}

function setRoomColor(roomId, colorHex){
  var room = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!room) return;
  room.color = colorHex || null;
  saveRoomChangesToRemoteAndBroadcast(room, "color");
  renderHouseView();
  if(typeof showToast === "function") showToast("Color de estancia actualizado.", "info");
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
    case "pasillo": return "✦";
    case "entrada": return "🚪";
    case "escaleras": return "🪜";
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
    case "entrada": return "Entrada Principal";
    case "escaleras": return "Escaleras";
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

// ============================================================================
// BIBLIOTECA DE ELEMENTOS ARQUITECTÓNICOS TIPO CANVA (SVGs 2D Cenitales)
// ============================================================================
var CANVA_ASSET_LIBRARY = [
  // 1. PUERTAS Y ACCESOS
  { id: "puerta_batiente", name: "Puerta Batiente con Arco", category: "puertas", icon: "🚪", isDoor: true, defaultType: "puerta", desc: "Puerta clásica con arco de giro de 90° (blueprint)" },
  { id: "arco_paso", name: "Arco de Paso Abierto", category: "puertas", icon: "⛩️", isDoor: true, defaultType: "arco", desc: "Vano libre de mampostería para comunicar estancias" },
  { id: "puerta_doble", name: "Puerta Doble Señorial", category: "puertas", icon: "🚪🚪", isDoor: true, defaultType: "puerta", desc: "Doble hoja batiente para grandes salones" },
  { id: "ventana", name: "Ventana con Vano de Luz", category: "puertas", icon: "🪟", isDoor: true, defaultType: "ventana", desc: "Apertura exterior con marco de madera" },
  { id: "escaleras_subir", name: "Escaleras (Subir Piso)", category: "puertas", icon: "🪜", isDoor: true, defaultType: "escaleras", desc: "Peldaños de madera que ascienden al piso superior" },
  { id: "escaleras_bajar", name: "Escaleras (Bajar Piso)", category: "puertas", icon: "🪜", isDoor: true, defaultType: "escaleras", desc: "Peldaños que descienden a la planta inferior" },
  { id: "entrada_porche", name: "Puerta Principal de Entrada", category: "puertas", icon: "🚪", isDoor: true, defaultType: "puerta", desc: "Umbral exterior de madera noble y herrajes" },

  // 2. DESCANSO Y HABITACIÓN
  { id: "cama_individual", name: "Cama Individual", category: "descanso", icon: "🛏️", isFurniture: true, defaultType: "cama", desc: "Cama de roble con sábana doblada y almohada" },
  { id: "cama_matrimonio", name: "Cama de Matrimonio / Dosel", category: "descanso", icon: "🛌", isFurniture: true, defaultType: "cama", desc: "Cama noble espaciosa con almohadas dobles" },
  { id: "sillon_lectura", name: "Sillón Orejero de Reposo", category: "descanso", icon: "🛋️", isFurniture: true, defaultType: "sillon", desc: "Sillón mullido tapizado para descanso" },

  // 3. MESAS Y ASIENTOS
  { id: "mesa_comedor", name: "Mesa de Roble con 4 Sillas", category: "mesas", icon: "🪵", isFurniture: true, defaultType: "mesa", desc: "Mesa central para banquetes y reuniones" },
  { id: "escritorio", name: "Escritorio de Estudio y Pergaminos", category: "mesas", icon: "📜", isFurniture: true, defaultType: "escritorio", desc: "Mesa de trabajo con tintero, pluma y silla" },
  { id: "mesa_alquimia", name: "Mesa de Alquimia y Matraces", category: "mesas", icon: "🧪", isFurniture: true, defaultType: "mesa", desc: "Superficie de laboratorio con matraces y alambiques" },

  // 4. ALMACENAJE (CON INVENTARIO)
  { id: "baul", name: "Baúl Reforzado de Viaje", category: "almacen", icon: "🧰", isFurniture: true, isStorage: true, defaultType: "baul", desc: "Cofre con herrajes metálicos para guardar pertenencias" },
  { id: "alacena", name: "Alacena Despensa de Víveres", category: "almacen", icon: "🗄️", isFurniture: true, isStorage: true, defaultType: "alacena", desc: "Mueble de dos hojas para provisiones e ingredientes" },
  { id: "armero", name: "Armero de Guardia y Panoplia", category: "almacen", icon: "⚔️", isFurniture: true, isStorage: true, defaultType: "armero", desc: "Soporte de armas, espadas y correajes" },
  { id: "libreria", name: "Librería de Grimorios Sapientes", category: "almacen", icon: "📚", isFurniture: true, isStorage: true, defaultType: "libreria", desc: "Estantes repletos de tomos vivientes y crónicas" },

  // 5. COCINA Y FUEGO
  { id: "fogon_caldero", name: "Fogón con Caldero Errante", category: "cocina", icon: "🍳", isFurniture: true, defaultType: "cocina", desc: "Hogar de cocción con caldero de hierro y fuego vivo" },
  { id: "chimenea", name: "Chimenea de Piedra con Leña", category: "cocina", icon: "🔥", isFurniture: true, defaultType: "chimenea", desc: "Chimenea cálida con tiro de piedra y ascuas" },
  { id: "banco_trabajo", name: "Banco de Trabajo y Forja", category: "cocina", icon: "🔨", isFurniture: true, defaultType: "banco", desc: "Mesa pesada con herramientas de artesanía" },

  // 6. DECORACIÓN Y ALFOMBRAS
  { id: "alfombra_persa", name: "Alfombra Persa Ornamental", category: "decoracion", icon: "🧶", isDecor: true, defaultType: "alfombra", desc: "Tapete tejido con cenefas y flecos decorativos" },
  { id: "planta_maceta", name: "Planta Frondosa en Maceta", category: "decoracion", icon: "🌿", isDecor: true, defaultType: "planta", desc: "Follaje verde en maceta de barro cocido" },
  { id: "tapiz_pared", name: "Tapiz Bordado del Mapa", category: "decoracion", icon: "🖼️", isDecor: true, defaultType: "cuadro", desc: "Tapiz heráldico con la historia de Krysalis" },
  { id: "trofeo_caza", name: "Trofeo de Caza y Cornamenta", category: "decoracion", icon: "💀", isDecor: true, defaultType: "trofeo", desc: "Cráneo grabado de bestia mítica" },
  { id: "telarana", name: "Telaraña Ancestral", category: "decoracion", icon: "🕸️", isDecor: true, defaultType: "telarana", desc: "Sutil filamento de araña en esquina" },

  // 7. ILUMINACIÓN
  { id: "candelabro", name: "Candelabro de Pie con Velas", category: "luces", icon: "🕯️", isDecor: true, defaultType: "vela", desc: "Lámpara de forja con 4 velas aromáticas" },
  { id: "farol_pared", name: "Farol de Aceite de Pared", category: "luces", icon: "🏮", isDecor: true, defaultType: "antorcha", desc: "Candil con cristal protector y luz tenue" },
  { id: "brasero", name: "Brasero de Ascuas Arcanas", category: "luces", icon: "✨", isDecor: true, defaultType: "vela", desc: "Recipiente con ascuas mágicas de resplandor violeta" }
];

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

function getCanvaSvg(typeOrId, rotation){
  var rot = (typeof rotation === "number") ? rotation : 0;
  var key = (typeOrId || "").toLowerCase();

  var inner = '';

  if(key.includes("escaleras") || key.includes("stair")){
    var isDown = key.includes("bajar");
    var arrow = isDown ? '▼' : '▲';
    var label = isDown ? 'BAJAR' : 'SUBIR';
    inner = '<rect x="4" y="4" width="32" height="32" rx="2" fill="#292524" stroke="#EAB308" stroke-width="1.5"/>' +
      '<line x1="4" y1="9" x2="36" y2="9" stroke="#78716C" stroke-width="1.5"/>' +
      '<line x1="4" y1="14" x2="36" y2="14" stroke="#78716C" stroke-width="1.5"/>' +
      '<line x1="4" y1="19" x2="36" y2="19" stroke="#78716C" stroke-width="1.5"/>' +
      '<line x1="4" y1="24" x2="36" y2="24" stroke="#78716C" stroke-width="1.5"/>' +
      '<line x1="4" y1="29" x2="36" y2="29" stroke="#78716C" stroke-width="1.5"/>' +
      '<rect x="10" y="8" width="20" height="24" rx="3" fill="#1C1917" stroke="#FACC15" stroke-width="1"/>' +
      '<text x="20" y="22" text-anchor="middle" font-size="10" font-weight="bold" fill="#FACC15">' + arrow + '</text>' +
      '<text x="20" y="29" text-anchor="middle" font-size="5.5" font-weight="bold" fill="#E7E5E4">' + label + '</text>';
  } else if(key.includes("entrada") || key.includes("porche")){
    inner = '<rect x="4" y="6" width="32" height="28" rx="2" fill="#14532D" stroke="#22C55E" stroke-width="1.5"/>' +
      '<rect x="8" y="10" width="24" height="20" rx="1" fill="#15803D" stroke="#4ADE80" stroke-width="1"/>' +
      '<line x1="20" y1="10" x2="20" y2="30" stroke="#86EFAC" stroke-width="1.5"/>' +
      '<circle cx="17" cy="20" r="1.5" fill="#FACC15"/>' +
      '<circle cx="23" cy="20" r="1.5" fill="#FACC15"/>' +
      '<rect x="12" y="31" width="16" height="5" rx="1" fill="#78350F" stroke="#D97706" stroke-width="1"/>' +
      '<text x="20" y="34.5" text-anchor="middle" font-size="3.8" font-weight="bold" fill="#FEF3C7">ENTRADA</text>';
  } else if(key.includes("puerta_doble")){
    inner = '<rect x="2" y="2" width="6" height="6" rx="1" fill="#4B5563" stroke="#9CA3AF" stroke-width="1"/>' +
      '<rect x="32" y="2" width="6" height="6" rx="1" fill="#4B5563" stroke="#9CA3AF" stroke-width="1"/>' +
      '<path d="M 8 5 A 12 12 0 0 1 20 17" fill="none" stroke="#D97706" stroke-width="1.2" stroke-dasharray="2,2"/>' +
      '<path d="M 32 5 A 12 12 0 0 0 20 17" fill="none" stroke="#D97706" stroke-width="1.2" stroke-dasharray="2,2"/>' +
      '<line x1="8" y1="5" x2="8" y2="17" stroke="#B45309" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="32" y1="5" x2="32" y2="17" stroke="#B45309" stroke-width="2.5" stroke-linecap="round"/>';
  } else if(key.includes("puerta") || key === "door"){
    inner = '<rect x="2" y="2" width="6" height="6" rx="1" fill="#4B5563" stroke="#9CA3AF" stroke-width="1"/>' +
      '<rect x="32" y="2" width="6" height="6" rx="1" fill="#4B5563" stroke="#9CA3AF" stroke-width="1"/>' +
      '<path d="M 8 5 A 27 27 0 0 1 35 32" fill="none" stroke="#D97706" stroke-width="1.5" stroke-dasharray="3,3"/>' +
      '<line x1="8" y1="5" x2="8" y2="32" stroke="#B45309" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="9" cy="22" r="1.5" fill="#FCD34D"/>';
  } else if(key.includes("arco")){
    inner = '<rect x="2" y="10" width="8" height="20" rx="1" fill="#374151" stroke="#9CA3AF" stroke-width="1.5"/>' +
      '<rect x="30" y="10" width="8" height="20" rx="1" fill="#374151" stroke="#9CA3AF" stroke-width="1.5"/>' +
      '<line x1="10" y1="12" x2="30" y2="12" stroke="#60A5FA" stroke-width="1.5" stroke-dasharray="2,2"/>' +
      '<line x1="10" y1="28" x2="30" y2="28" stroke="#60A5FA" stroke-width="1.5" stroke-dasharray="2,2"/>' +
      '<path d="M 16 16 L 24 20 L 16 24" fill="none" stroke="#93C5FD" stroke-width="1.5" stroke-linecap="round"/>';
  } else if(key.includes("ventana")){
    inner = '<rect x="2" y="14" width="36" height="12" rx="1" fill="#1E293B" stroke="#60A5FA" stroke-width="1.5"/>' +
      '<line x1="20" y1="14" x2="20" y2="26" stroke="#93C5FD" stroke-width="1.5"/>' +
      '<line x1="2" y1="20" x2="38" y2="20" stroke="#93C5FD" stroke-width="1.5"/>' +
      '<polygon points="6,26 14,36 26,36 34,26" fill="rgba(96,165,250,0.15)"/>';
  } else if(key.includes("cama_matrimonio") || key.includes("dosel")){
    inner = '<rect x="4" y="3" width="32" height="34" rx="3" fill="#1E293B" stroke="#C5A059" stroke-width="1.5"/>' +
      '<rect x="4" y="3" width="32" height="5" rx="1" fill="#92400E"/>' +
      '<rect x="7" y="9" width="11" height="7" rx="2" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1"/>' +
      '<rect x="22" y="9" width="11" height="7" rx="2" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1"/>' +
      '<path d="M 6 18 L 34 18 L 34 35 L 6 35 Z" fill="#7C2D12" rx="2"/>' +
      '<line x1="6" y1="18" x2="34" y2="18" stroke="#FDE68A" stroke-width="2"/>' +
      '<circle cx="20" cy="27" r="3" fill="#B45309"/>';
  } else if(key.includes("cama")){
    inner = '<rect x="6" y="3" width="28" height="34" rx="3" fill="#1E293B" stroke="#94A3B8" stroke-width="1.5"/>' +
      '<rect x="6" y="3" width="28" height="4" rx="1" fill="#78350F"/>' +
      '<rect x="10" y="9" width="20" height="7" rx="2" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1"/>' +
      '<path d="M 8 18 L 32 18 L 32 35 L 8 35 Z" fill="#2563EB" rx="2"/>' +
      '<line x1="8" y1="18" x2="32" y2="18" stroke="#DBEAFE" stroke-width="2"/>';
  } else if(key.includes("sillon")){
    inner = '<rect x="8" y="8" width="24" height="24" rx="4" fill="#3B0764" stroke="#A855F7" stroke-width="1.5"/>' +
      '<rect x="4" y="12" width="6" height="18" rx="2" fill="#581C87"/>' +
      '<rect x="30" y="12" width="6" height="18" rx="2" fill="#581C87"/>' +
      '<rect x="8" y="26" width="24" height="8" rx="2" fill="#2E1065"/>' +
      '<circle cx="20" cy="18" r="3" fill="#C084FC"/>';
  } else if(key.includes("mesa_comedor") || key.includes("mesa")){
    inner = '<rect x="13" y="2" width="14" height="5" rx="1.5" fill="#475569" stroke="#94A3B8" stroke-width="1"/>' +
      '<rect x="13" y="33" width="14" height="5" rx="1.5" fill="#475569" stroke="#94A3B8" stroke-width="1"/>' +
      '<rect x="2" y="13" width="5" height="14" rx="1.5" fill="#475569" stroke="#94A3B8" stroke-width="1"/>' +
      '<rect x="33" y="13" width="5" height="14" rx="1.5" fill="#475569" stroke="#94A3B8" stroke-width="1"/>' +
      '<rect x="9" y="9" width="22" height="22" rx="3" fill="#78350F" stroke="#D97706" stroke-width="1.5"/>' +
      '<circle cx="20" cy="20" r="3" fill="#B45309"/>';
  } else if(key.includes("escritorio")){
    inner = '<rect x="5" y="6" width="30" height="18" rx="2" fill="#451A03" stroke="#B45309" stroke-width="1.5"/>' +
      '<rect x="13" y="27" width="14" height="8" rx="2" fill="#334155" stroke="#94A3B8" stroke-width="1"/>' +
      '<rect x="9" y="9" width="10" height="12" rx="1" fill="#FEF3C7"/>' +
      '<circle cx="28" cy="14" r="2.5" fill="#1E293B"/>' +
      '<line x1="28" y1="14" x2="32" y2="9" stroke="#E2E8F0" stroke-width="1.5"/>';
  } else if(key.includes("baul") || key.includes("cofre")){
    inner = '<rect x="5" y="9" width="30" height="22" rx="3" fill="#78350F" stroke="#F59E0B" stroke-width="1.5"/>' +
      '<line x1="5" y1="16" x2="35" y2="16" stroke="#F59E0B" stroke-width="2"/>' +
      '<line x1="13" y1="9" x2="13" y2="31" stroke="#94A3B8" stroke-width="2.5"/>' +
      '<line x1="27" y1="9" x2="27" y2="31" stroke="#94A3B8" stroke-width="2.5"/>' +
      '<rect x="18" y="15" width="4" height="6" rx="1" fill="#FCD34D" stroke="#B45309" stroke-width="1"/>';
  } else if(key.includes("alacena")){
    inner = '<rect x="4" y="6" width="32" height="28" rx="2" fill="#3E2723" stroke="#A1887F" stroke-width="1.5"/>' +
      '<line x1="20" y1="6" x2="20" y2="34" stroke="#D7CCC8" stroke-width="1.5"/>' +
      '<line x1="4" y1="20" x2="36" y2="20" stroke="#8D6E63" stroke-width="1" stroke-dasharray="2,2"/>' +
      '<circle cx="16" cy="20" r="1.8" fill="#F59E0B"/>' +
      '<circle cx="24" cy="20" r="1.8" fill="#F59E0B"/>';
  } else if(key.includes("libreria") || key.includes("estanteria")){
    inner = '<rect x="4" y="6" width="32" height="28" rx="2" fill="#1E293B" stroke="#64748B" stroke-width="1.5"/>' +
      '<rect x="7" y="8" width="4" height="10" fill="#DC2626" rx="1"/>' +
      '<rect x="12" y="7" width="5" height="11" fill="#2563EB" rx="1"/>' +
      '<rect x="18" y="8" width="4" height="10" fill="#D97706" rx="1"/>' +
      '<rect x="23" y="7" width="6" height="11" fill="#16A34A" rx="1"/>' +
      '<rect x="30" y="8" width="3" height="10" fill="#9333EA" rx="1"/>' +
      '<line x1="4" y1="20" x2="36" y2="20" stroke="#475569" stroke-width="2"/>' +
      '<rect x="7" y="22" width="6" height="10" fill="#0284C7" rx="1"/>' +
      '<rect x="14" y="23" width="5" height="9" fill="#EA580C" rx="1"/>' +
      '<rect x="20" y="22" width="7" height="10" fill="#4B5563" rx="1"/>';
  } else if(key.includes("fogon") || key.includes("cocina")){
    inner = '<rect x="5" y="5" width="30" height="30" rx="3" fill="#18181B" stroke="#71717A" stroke-width="1.5"/>' +
      '<circle cx="13" cy="13" r="5" fill="#27272A" stroke="#EF4444" stroke-width="1.5"/>' +
      '<circle cx="27" cy="13" r="4" fill="#27272A" stroke="#F97316" stroke-width="1.5"/>' +
      '<circle cx="20" cy="26" r="7" fill="#09090B" stroke="#F59E0B" stroke-width="1.5"/>' +
      '<circle cx="20" cy="26" r="4" fill="#B45309"/>' +
      '<circle cx="18" cy="24" r="1.5" fill="#FEF3C7"/>';
  } else if(key.includes("chimenea")){
    inner = '<path d="M 4 8 L 36 8 L 36 32 L 28 32 L 28 16 L 12 16 L 12 32 L 4 32 Z" fill="#334155" stroke="#94A3B8" stroke-width="1.5"/>' +
      '<ellipse cx="20" cy="24" rx="7" ry="5" fill="#EA580C"/>' +
      '<polygon points="20,18 16,26 24,26" fill="#FACC15"/>' +
      '<line x1="14" y1="26" x2="26" y2="26" stroke="#451A03" stroke-width="2"/>';
  } else if(key.includes("armero")){
    inner = '<rect x="4" y="8" width="32" height="24" rx="2" fill="#262626" stroke="#A3A3A3" stroke-width="1.5"/>' +
      '<line x1="10" y1="10" x2="10" y2="30" stroke="#E5E5E5" stroke-width="2"/>' +
      '<line x1="20" y1="10" x2="20" y2="30" stroke="#E5E5E5" stroke-width="2"/>' +
      '<line x1="30" y1="10" x2="30" y2="30" stroke="#E5E5E5" stroke-width="2"/>' +
      '<circle cx="10" cy="12" r="2" fill="#F59E0B"/>' +
      '<circle cx="20" cy="12" r="2" fill="#F59E0B"/>' +
      '<circle cx="30" cy="12" r="2" fill="#F59E0B"/>';
  } else if(key.includes("alfombra")){
    inner = '<rect x="4" y="5" width="32" height="30" rx="2" fill="#831843" stroke="#F59E0B" stroke-width="1.5"/>' +
      '<rect x="8" y="9" width="24" height="22" rx="1" fill="none" stroke="#FDE68A" stroke-width="1" stroke-dasharray="2,2"/>' +
      '<polygon points="20,14 26,20 20,26 14,20" fill="#9D174D" stroke="#F59E0B" stroke-width="1"/>' +
      '<line x1="2" y1="7" x2="2" y2="33" stroke="#FEF3C7" stroke-width="1.5" stroke-dasharray="2,1"/>' +
      '<line x1="38" y1="7" x2="38" y2="33" stroke="#FEF3C7" stroke-width="1.5" stroke-dasharray="2,1"/>';
  } else if(key.includes("planta")){
    inner = '<circle cx="20" cy="20" r="8" fill="#78350F" stroke="#B45309" stroke-width="1.5"/>' +
      '<ellipse cx="20" cy="11" rx="4.5" ry="8" fill="#15803D"/>' +
      '<ellipse cx="20" cy="29" rx="4.5" ry="8" fill="#16A34A"/>' +
      '<ellipse cx="11" cy="20" rx="8" ry="4.5" fill="#22C55E"/>' +
      '<ellipse cx="29" cy="20" rx="8" ry="4.5" fill="#4ADE80"/>' +
      '<circle cx="20" cy="20" r="3.5" fill="#14532D"/>';
  } else if(key.includes("candelabro") || key.includes("vela")){
    inner = '<circle cx="20" cy="20" r="14" fill="none" stroke="#F59E0B" stroke-width="1" stroke-opacity="0.3" stroke-dasharray="3,3"/>' +
      '<circle cx="20" cy="20" r="5" fill="#D97706" stroke="#FDE68A" stroke-width="1.5"/>' +
      '<line x1="20" y1="7" x2="20" y2="33" stroke="#B45309" stroke-width="2"/>' +
      '<line x1="7" y1="20" x2="33" y2="20" stroke="#B45309" stroke-width="2"/>' +
      '<circle cx="20" cy="7" r="3" fill="#FEF08A"/>' +
      '<circle cx="20" cy="33" r="3" fill="#FEF08A"/>' +
      '<circle cx="7" cy="20" r="3" fill="#FEF08A"/>' +
      '<circle cx="33" cy="20" r="3" fill="#FEF08A"/>';
  } else {
    // Genérico / Caja de almacenamiento
    inner = '<rect x="6" y="6" width="28" height="28" rx="3" fill="#374151" stroke="#9CA3AF" stroke-width="1.5"/>' +
      '<circle cx="20" cy="20" r="6" fill="#4B5563"/>' +
      '<text x="20" y="24" text-anchor="middle" font-size="12" fill="#E5E7EB">' + (getFurnitureIcon(key) || '📦') + '</text>';
  }

  return '<svg viewBox="0 0 40 40" class="canva-svg canva-svg-' + esc(key) + '" xmlns="http://www.w3.org/2000/svg">' +
    '<g transform="rotate(' + rot + ' 20 20)">' + inner + '</g>' +
    '</svg>';
}

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
  saveRoomChangesToRemoteAndBroadcast(r, "level");
  renderHouseView();

  if(typeof showToast === "function") showToast("¡" + r.name + " subió a Nivel " + r.level + "! 🌟", "success");
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
var HOUSE_GRID_COLS = 16;
var HOUSE_GRID_ROW_HEIGHT = 65;
var HOUSE_GRID_GAP = 8;

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

// Guías magnéticas de alineación visual arquitectónica (Canva style)
function updateAlignmentGuides(currentX, currentY, width, height, floor, excludeRoomId){
  var canvas = document.getElementById("houseGridCanvas");
  if(!canvas) return;
  removeAlignmentGuides();

  var sameFloorRooms = (houseState.rooms || []).filter(function(r){
    return (r.floor || 1) === floor && r.id !== excludeRoomId;
  });

  var alignX = false;
  var alignY = false;

  for(var i = 0; i < sameFloorRooms.length; i++){
    var o = sameFloorRooms[i];
    var ox = o.pos_x || 0;
    var oy = o.pos_y || 0;
    var ow = o.width || 2;
    var oh = o.height || 2;

    if(currentX === ox || (currentX + width) === (ox + ow)){
      alignX = true;
    }
    if(currentY === oy || (currentY + height) === (oy + oh)){
      alignY = true;
    }
  }

  var effectiveCanvasWidth = canvas.clientWidth - 12;
  if(effectiveCanvasWidth <= 0) effectiveCanvasWidth = canvas.scrollWidth - 12;
  var stepX = (effectiveCanvasWidth + HOUSE_GRID_GAP) / HOUSE_GRID_COLS;

  if(alignX){
    var gY = document.createElement("div");
    gY.className = "house-align-guide-y";
    gY.style.left = (currentX * stepX + 6) + "px";
    canvas.appendChild(gY);
  }

  var stepY = HOUSE_GRID_ROW_HEIGHT + HOUSE_GRID_GAP;
  if(alignY){
    var gX = document.createElement("div");
    gX.className = "house-align-guide-x";
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

// Detección Dinámica de Muros Exteriores, Paredes Interiores y Fusión de Pasillos
function getRoomWallClasses(r, floorRooms){
  var x = r.pos_x || 0;
  var y = r.pos_y || 0;
  var w = r.width || 2;
  var h = r.height || 2;

  var hasTop = false, mergedTop = false;
  var hasRight = false, mergedRight = false;
  var hasBottom = false, mergedBottom = false;
  var hasLeft = false, mergedLeft = false;

  var isCorridor = (r.room_type === "pasillo" || r.room_type === "entrada" || r.room_type === "escaleras");

  for(var i = 0; i < floorRooms.length; i++){
    var o = floorRooms[i];
    if(o.id === r.id) continue;
    var ox = o.pos_x || 0;
    var oy = o.pos_y || 0;
    var ow = o.width || 2;
    var oh = o.height || 2;
    var oIsCorridor = (o.room_type === "pasillo" || o.room_type === "entrada" || o.room_type === "escaleras");

    var overlapX = (x < ox + ow) && (x + w > ox);
    var overlapY = (y < oy + oh) && (y + h > oy);

    if(overlapX && (oy + oh === y)) {
      hasTop = true;
      if(isCorridor && oIsCorridor) mergedTop = true;
    }
    if(overlapX && (y + h === oy)) {
      hasBottom = true;
      if(isCorridor && oIsCorridor) mergedBottom = true;
    }
    if(overlapY && (ox + ow === x)) {
      hasLeft = true;
      if(isCorridor && oIsCorridor) mergedLeft = true;
    }
    if(overlapY && (x + w === ox)) {
      hasRight = true;
      if(isCorridor && oIsCorridor) mergedRight = true;
    }
  }

  var classes = [];
  if(mergedTop) classes.push("wall-merged-top");
  else classes.push(hasTop ? "wall-shared-top" : "wall-outer-top");

  if(mergedRight) classes.push("wall-merged-right");
  else classes.push(hasRight ? "wall-shared-right" : "wall-outer-right");

  if(mergedBottom) classes.push("wall-merged-bottom");
  else classes.push(hasBottom ? "wall-shared-bottom" : "wall-outer-bottom");

  if(mergedLeft) classes.push("wall-merged-left");
  else classes.push(hasLeft ? "wall-shared-left" : "wall-outer-left");

  return classes.join(" ");
}

// Detección de aperturas de puertas y conexiones arquitectónicas (Canva style)
function getRoomDoorCutouts(r, floorRooms){
  var x = r.pos_x || 0;
  var y = r.pos_y || 0;
  var w = r.width || 2;
  var h = r.height || 2;

  var cutouts = { top: false, right: false, bottom: false, left: false };

  for(var i = 0; i < floorRooms.length; i++){
    var o = floorRooms[i];
    if(o.id === r.id) continue;
    var ox = o.pos_x || 0;
    var oy = o.pos_y || 0;
    var ow = o.width || 2;
    var oh = o.height || 2;

    var overlapX = (x < ox + ow) && (x + w > ox);
    var overlapY = (y < oy + oh) && (y + h > oy);

    if(overlapX && (oy + oh === y)) cutouts.top = { isCorridor: (o.room_type === "pasillo"), other: o };
    if(overlapX && (y + h === oy)) cutouts.bottom = { isCorridor: (o.room_type === "pasillo"), other: o };
    if(overlapY && (ox + ow === x)) cutouts.left = { isCorridor: (o.room_type === "pasillo"), other: o };
    if(overlapY && (x + w === ox)) cutouts.right = { isCorridor: (o.room_type === "pasillo"), other: o };
  }

  return cutouts;
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

  if(typeof showToast === "function") showToast("✦ Pasillo añadido a la Planta " + curFloor + ".", "success");

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
  saveRoomChangesToRemoteAndBroadcast(room, "furniture");
  renderHouseView();
}

// FASE 4: Capa de Decoración Rápida
function rotateRoomDecor(roomId, decorId){
  var room = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!room || !Array.isArray(room.decor)) return;
  var dec = room.decor.find(function(d){ return d.id === decorId; });
  if(!dec) return;

  dec.rotation = ((dec.rotation || 0) + 90) % 360;
  saveRoomChangesToRemoteAndBroadcast(room, "decor");
  renderHouseView();
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
  saveRoomChangesToRemoteAndBroadcast(room, "decor");
  renderHouseView();

  if(typeof showToast === "function") showToast(cat.icon + " " + cat.label + " añadida a la estancia.", "info");
}

function deleteRoomDecor(roomId, decorId){
  var room = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!room || !Array.isArray(room.decor)) return;

  room.decor = room.decor.filter(function(d){ return d.id !== decorId; });
  saveRoomChangesToRemoteAndBroadcast(room, "decor");
  renderHouseView();

  if(typeof showToast === "function") showToast("Elemento decorativo retirado.", "info");
}

// ============================================================================
// FUNCIONES DEL ESTUDIO CANVA (Diseño y Decoración Visual)
// ============================================================================
function renderRoomMiniLayout(r){
  var fur = Array.isArray(r.furniture) ? r.furniture : [];
  var dec = Array.isArray(r.decor) ? r.decor : [];
  if(fur.length === 0 && dec.length === 0) return '';

  var colW = 100 / 6; // ~16.666% por celda horizontal
  var rowH = 100 / 4; // 25% por celda vertical

  var items = [];
  fur.forEach(function(f, idx){
    var fx = (typeof f.pos_x === "number") ? f.pos_x : (idx % 6);
    var fy = (typeof f.pos_y === "number") ? f.pos_y : Math.floor(idx / 6);
    var fw = Math.max(1, Math.min(6, f.w || 1));
    var fh = Math.max(1, Math.min(4, f.h || 1));

    // Clamp para asegurar que el elemento esté 100% contenido en la habitación
    fx = Math.max(0, Math.min(6 - fw, fx));
    fy = Math.max(0, Math.min(4 - fh, fy));

    var leftPct = (fx * colW).toFixed(2);
    var topPct = (fy * rowH).toFixed(2);
    var widthPct = (fw * colW).toFixed(2);
    var heightPct = (fh * rowH).toFixed(2);

    items.push(
      '<div class="house-mini-item item-furniture" style="left:' + leftPct + '%;top:' + topPct + '%;width:' + widthPct + '%;height:' + heightPct + '%;" title="' + esc(f.name) + '">' +
        getCanvaSvg(f.type || f.id, f.rotation || 0) +
      '</div>'
    );
  });

  dec.forEach(function(d){
    var dx = (typeof d.pos_x === "number") ? d.pos_x : 0;
    var dy = (typeof d.pos_y === "number") ? d.pos_y : 0;
    var dw = Math.max(1, Math.min(6, d.w || 1));
    var dh = Math.max(1, Math.min(4, d.h || 1));

    dx = Math.max(0, Math.min(6 - dw, dx));
    dy = Math.max(0, Math.min(4 - dh, dy));

    var leftPct = (dx * colW).toFixed(2);
    var topPct = (dy * rowH).toFixed(2);
    var widthPct = (dw * colW).toFixed(2);
    var heightPct = (dh * rowH).toFixed(2);

    items.push(
      '<div class="house-mini-item item-decor" style="left:' + leftPct + '%;top:' + topPct + '%;width:' + widthPct + '%;height:' + heightPct + '%;" title="' + esc(d.label || d.type) + '">' +
        getCanvaSvg(d.type || d.id, d.rotation || 0) +
      '</div>'
    );
  });

  return items.join('');
}

function canvaInsertAsset(roomId, assetId){
  var room = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!room) return;

  var asset = CANVA_ASSET_LIBRARY.find(function(a){ return a.id === assetId; });
  if(!asset) return;

  room.furniture = room.furniture || [];
  room.decor = room.decor || [];

  // Buscar celda libre en la cuadrícula 6x4
  var occupied = {};
  room.furniture.forEach(function(f){ occupied[(f.pos_x || 0) + "_" + (f.pos_y || 0)] = true; });
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

  var isStorage = !!asset.isStorage;
  var isFurn = !!asset.isFurniture;
  var newItem = null;

  if(isStorage || isFurn){
    newItem = {
      id: "fur_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      name: asset.name,
      type: asset.defaultType || asset.id,
      icon: asset.icon,
      pos_x: targetX,
      pos_y: targetY,
      rotation: 0,
      items: []
    };
    room.furniture.push(newItem);
    saveRoomChangesToRemoteAndBroadcast(room, "furniture");
  } else {
    newItem = {
      id: "dec_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      type: asset.defaultType || asset.id,
      label: asset.name,
      icon: asset.icon,
      pos_x: targetX,
      pos_y: targetY,
      rotation: 0
    };
    room.decor.push(newItem);
    saveRoomChangesToRemoteAndBroadcast(room, "decor");
  }

  houseState.selectedItemId = newItem.id;
  renderHouseView();

  if(typeof showToast === "function"){
    showToast(asset.icon + " " + asset.name + " colocado en la estancia.", "success");
  }
}

function canvaRotateItem(roomId, itemId){
  var room = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!room) return;

  var f = (room.furniture || []).find(function(x){ return x.id === itemId; });
  if(f){
    f.rotation = ((f.rotation || 0) + 90) % 360;
    saveRoomChangesToRemoteAndBroadcast(room, "furniture");
    renderHouseView();
    return;
  }

  var d = (room.decor || []).find(function(x){ return x.id === itemId; });
  if(d){
    d.rotation = ((d.rotation || 0) + 90) % 360;
    saveRoomChangesToRemoteAndBroadcast(room, "decor");
    renderHouseView();
  }
}

function canvaDuplicateItem(roomId, itemId){
  var room = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!room) return;

  var occupied = {};
  (room.furniture || []).forEach(function(x){ occupied[(x.pos_x || 0) + "_" + (x.pos_y || 0)] = true; });
  (room.decor || []).forEach(function(x){ occupied[(x.pos_x || 0) + "_" + (x.pos_y || 0)] = true; });

  var targetX = 0;
  var targetY = 0;
  var found = false;
  for(var y = 0; y < 4; y++){
    for(var x = 0; x < 6; x++){
      if(!occupied[x + "_" + y]){
        targetX = x; targetY = y; found = true; break;
      }
    }
    if(found) break;
  }

  var f = (room.furniture || []).find(function(x){ return x.id === itemId; });
  if(f){
    var cloneF = JSON.parse(JSON.stringify(f));
    cloneF.id = "fur_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    cloneF.pos_x = targetX;
    cloneF.pos_y = targetY;
    cloneF.items = []; // Duplicados empiezan vacíos
    room.furniture.push(cloneF);
    houseState.selectedItemId = cloneF.id;

    saveRoomChangesToRemoteAndBroadcast(room, "furniture");
    renderHouseView();
    if(typeof showToast === "function") showToast("Mueble duplicado.", "info");
    return;
  }

  var d = (room.decor || []).find(function(x){ return x.id === itemId; });
  if(d){
    var cloneD = JSON.parse(JSON.stringify(d));
    cloneD.id = "dec_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    cloneD.pos_x = targetX;
    cloneD.pos_y = targetY;
    room.decor.push(cloneD);
    houseState.selectedItemId = cloneD.id;

    saveRoomChangesToRemoteAndBroadcast(room, "decor");
    renderHouseView();
    if(typeof showToast === "function") showToast("Adorno duplicado.", "info");
  }
}

function canvaDeleteItem(roomId, itemId){
  var room = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!room) return;

  var initFurLen = (room.furniture || []).length;
  room.furniture = (room.furniture || []).filter(function(x){ return x.id !== itemId; });
  if(room.furniture.length !== initFurLen){
    houseState.selectedItemId = null;
    saveRoomChangesToRemoteAndBroadcast(room, "furniture");
    renderHouseView();
    if(typeof showToast === "function") showToast("Mueble retirado.", "info");
    return;
  }

  var initDecLen = (room.decor || []).length;
  room.decor = (room.decor || []).filter(function(x){ return x.id !== itemId; });
  if(room.decor.length !== initDecLen){
    houseState.selectedItemId = null;
    saveRoomChangesToRemoteAndBroadcast(room, "decor");
    renderHouseView();
    if(typeof showToast === "function") showToast("Elemento decorativo retirado.", "info");
  }
}

function canvaResizeItem(roomId, itemId, dw, dh){
  var room = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!room) return;

  var f = (room.furniture || []).find(function(x){ return x.id === itemId; });
  if(f){
    var curW = Math.max(1, f.w || 1);
    var curH = Math.max(1, f.h || 1);
    if(dw !== 0) f.w = Math.max(1, Math.min(6 - (f.pos_x || 0), curW + dw));
    if(dh !== 0) f.h = Math.max(1, Math.min(4 - (f.pos_y || 0), curH + dh));
    saveRoomChangesToRemoteAndBroadcast(room, "furniture");
    renderHouseView();
    return;
  }

  var d = (room.decor || []).find(function(x){ return x.id === itemId; });
  if(d){
    var curDW = Math.max(1, d.w || 1);
    var curDH = Math.max(1, d.h || 1);
    if(dw !== 0) d.w = Math.max(1, Math.min(6 - (d.pos_x || 0), curDW + dw));
    if(dh !== 0) d.h = Math.max(1, Math.min(4 - (d.pos_y || 0), curDH + dh));
    saveRoomChangesToRemoteAndBroadcast(room, "decor");
    renderHouseView();
  }
}

function canvaNudgeItem(roomId, itemId, dx, dy){
  var room = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!room) return;

  var f = (room.furniture || []).find(function(x){ return x.id === itemId; });
  if(f){
    var curW = Math.max(1, f.w || 1);
    var curH = Math.max(1, f.h || 1);
    f.pos_x = Math.max(0, Math.min(6 - curW, (f.pos_x || 0) + dx));
    f.pos_y = Math.max(0, Math.min(4 - curH, (f.pos_y || 0) + dy));
    saveRoomChangesToRemoteAndBroadcast(room, "furniture");
    renderHouseView();
    return;
  }

  var d = (room.decor || []).find(function(x){ return x.id === itemId; });
  if(d){
    var curDW = Math.max(1, d.w || 1);
    var curDH = Math.max(1, d.h || 1);
    d.pos_x = Math.max(0, Math.min(6 - curDW, (d.pos_x || 0) + dx));
    d.pos_y = Math.max(0, Math.min(4 - curDH, (d.pos_y || 0) + dy));
    saveRoomChangesToRemoteAndBroadcast(room, "decor");
    renderHouseView();
  }
}

function renderCanvaStudio(roomId){
  var r = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!r){
    houseState.studioRoomId = null;
    return '<div class="alert warning">Habitación no encontrada. <button class="btn-compact" data-action="close-canva-studio">Volver al Plano</button></div>';
  }

  var isGm = (typeof isGM === "function" && isGM());
  var canEdit = canUserEditRoom(r);
  var curCategory = houseState.studioCategory || "todas";
  var search = (houseState.studioSearch || "").toLowerCase().trim();
  var owner = getRoomOwnerInfo(r.owner_character_id);

  var furnitureList = Array.isArray(r.furniture) ? r.furniture : [];
  var decorList = Array.isArray(r.decor) ? r.decor : [];

  var filteredAssets = CANVA_ASSET_LIBRARY.filter(function(a){
    if(curCategory !== "todas" && a.category !== curCategory) return false;
    if(search){
      var matchName = a.name.toLowerCase().includes(search);
      var matchDesc = a.desc && a.desc.toLowerCase().includes(search);
      return matchName || matchDesc;
    }
    return true;
  });

  var categories = [
    { id: "todas", label: "✨ Todo" },
    { id: "puertas", label: "🚪 Puertas" },
    { id: "descanso", label: "🛏️ Camas" },
    { id: "mesas", label: "🪑 Mesas" },
    { id: "almacen", label: "📦 Almacén" },
    { id: "cocina", label: "🍳 Cocina" },
    { id: "decoracion", label: "🌿 Adornos" },
    { id: "luces", label: "🕯️ Luces" }
  ];

  var html = '<div class="canva-studio-container">';

  // 1. Barra Superior del Estudio Canva
  html += '<div class="canva-studio-topbar">';
  html += '  <div class="canva-studio-topbar-left">';
  html += '    <button class="house-back-btn" data-action="close-canva-studio" title="Volver al plano principal de la casa">';
  html += '      <span>← Volver al Plano General</span>';
  html += '    </button>';
  html += '    <div class="canva-studio-title-group">';
  html += '      <h2 class="canva-studio-title"><span>🎨 Estudio Canva:</span> ' + esc(r.name) + '</h2>';
  html += '      <span class="house-room-type-tag ' + (r.room_type || 'salon') + '">' + getRoomTypeIcon(r.room_type) + ' ' + getRoomTypeLabel(r.room_type) + '</span>';
  html += '      <span class="house-room-level-pill">Nv. ' + (r.level || 1) + '</span>';
  if(owner) html += '      <span class="house-room-owner-tag">👤 ' + esc(owner.name) + '</span>';
  html += '    </div>';
  html += '  </div>';

  html += '  <div class="canva-studio-topbar-right">';
  html += '    <span class="canva-studio-dim-tag">📐 ' + (r.width || 2) + 'x' + (r.height || 2) + ' (P.' + (r.floor || 1) + ')</span>';
  if(canEdit && isGm){
    html += '    <button class="btn-compact" data-action="open-edit-room-modal" data-room-id="' + r.id + '">✏️ Datos de Sala</button>';
  }
  html += '  </div>';
  html += '</div>';

  // Banner informativo estilo Canva
  html += '<div class="canva-studio-hint-banner">';
  html += '  <span>💡 <b>Diseño Visual:</b> Toca cualquier elemento de la biblioteca para colocarlo en la habitación. Pulsa cualquier mueble para ver su <b>caja de control morada</b>: rótalo (🔄), abre su inventario (📦) o duplícalo (📋).</span>';
  html += '</div>';

  // 2. Layout Principal de Dos Columnas
  html += '<div class="canva-studio-layout">';

  // Columna Izquierda: Biblioteca de Elementos Canva
  html += '<div class="canva-library-sidebar">';
  html += '  <div class="canva-library-header">';
  html += '    <div class="canva-library-title">📦 Elementos y Mobiliario</div>';
  html += '    <input type="text" class="canva-search-input" id="canvaSearchInput" placeholder="🔍 Buscar camas, mesas, puertas..." value="' + esc(houseState.studioSearch || '') + '">';
  html += '  </div>';

  // Pestañas de categorías
  html += '  <div class="canva-category-pills">';
  categories.forEach(function(cat){
    var isActive = (curCategory === cat.id);
    html += '<button class="canva-category-pill' + (isActive ? ' active' : '') + '" data-action="canva-select-category" data-category="' + cat.id + '">' + cat.label + '</button>';
  });
  html += '  </div>';

  // Grid de tarjetas de elementos
  html += '  <div class="canva-assets-grid">';
  if(filteredAssets.length === 0){
    html += '<div style="font-size:0.78rem;color:var(--ink-faint);text-align:center;padding:24px;">No se encontraron elementos para esa búsqueda.</div>';
  } else {
    filteredAssets.forEach(function(asset){
      var badge = asset.isStorage ? '📦 Inventario' : (asset.isDoor ? '🚪 Acceso' : (asset.isDecor ? '🌿 Adorno' : '🪑 Mueble'));
      html += '<div class="canva-asset-card" data-action="canva-insert-asset" data-room-id="' + r.id + '" data-asset-id="' + asset.id + '" title="' + esc(asset.desc) + ' (Toca para colocar en la habitación)">';
      html += '  <div class="canva-asset-card-preview">' + getCanvaSvg(asset.id, 0) + '</div>';
      html += '  <div class="canva-asset-card-info">';
      html += '    <div class="canva-asset-card-name">' + esc(asset.name) + '</div>';
      html += '    <span class="canva-asset-card-badge">' + badge + '</span>';
      html += '  </div>';
      html += '  <div class="canva-asset-card-add">➕</div>';
      html += '</div>';
    });
  }
  html += '  </div>'; // fin canva-assets-grid
  html += '</div>'; // fin canva-library-sidebar

  // Columna Central: Lienzo de la Habitación (Stage)
  html += '<div class="canva-stage-wrap">';
  html += '  <div class="canva-stage-toolbar">';
  html += '    <div class="canva-stage-toolbar-title">Lienzo Arquitectónico Cenital (6x4 Celdas)</div>';
  html += '    <div class="canva-stage-color-bar" title="Cambiar color o suelo de la estancia">';
  html += '      <span class="canva-stage-color-lbl">🎨 Suelo:</span>';
  HOUSE_COLOR_PALETTES.forEach(function(p){
    var isSel = (r.color === p.hex || (!r.color && !p.hex));
    html += '<button class="canva-color-chip' + (isSel ? ' is-active' : '') + '" style="background:' + (p.hex || '#1a1816') + ';" data-action="set-room-color" data-room-id="' + r.id + '" data-color="' + p.hex + '" title="' + p.name + ' - ' + p.desc + '"></button>';
  });
  html += '      <input type="color" class="canva-custom-color-input" value="' + (r.color || '#2a1e16') + '" data-action="canva-custom-color-input" data-room-id="' + r.id + '" title="Color personalizado">';
  html += '    </div>';
  html += '    <div class="canva-stage-toolbar-stats">' + (furnitureList.length + decorList.length) + ' elementos</div>';
  html += '  </div>';

  var texClass = "tex-" + (r.room_type || "salon");
  var stageCustomBg = r.color ? ('background: ' + getRoomCustomBackground(r.color) + ' !important;') : '';
  html += '  <div class="canva-room-stage ' + texClass + '" id="canvaRoomStage" style="' + stageCustomBg + '">';

  // Celdas de guía de fondo
  html += '    <div class="canva-stage-grid-lines">';
  for(var cellIdx = 0; cellIdx < 24; cellIdx++){
    html += '<div class="canva-stage-grid-cell"></div>';
  }
  html += '    </div>';

  // Renderizar muebles con soporte de selección morada Canva
  furnitureList.forEach(function(f){
    var isSel = (houseState.selectedItemId === f.id);
    var itemW = Math.max(1, f.w || 1);
    var itemH = Math.max(1, f.h || 1);
    var colStart = (f.pos_x || 0) + 1;
    var rowStart = (f.pos_y || 0) + 1;
    var rot = f.rotation || 0;
    var itemCount = Array.isArray(f.items) ? f.items.length : 0;
    var gridSpan = 'grid-column:' + colStart + ' / span ' + itemW + ';grid-row:' + rowStart + ' / span ' + itemH + ';';

    html += '<div class="canva-stage-item item-furniture' + (isSel ? ' canva-selected' : '') + '" style="' + gridSpan + '" data-action="canva-select-item" data-item-id="' + f.id + '" data-room-id="' + r.id + '">';

    if(isSel && canEdit && isGm){
      html += '<div class="canva-floating-toolbar">';
      html += '  <button class="canva-float-btn" data-action="canva-rotate-item" data-room-id="' + r.id + '" data-item-id="' + f.id + '" title="Girar 90°">🔄 90°</button>';
      html += '  <button class="canva-float-btn highlight" data-action="open-add-item-modal" data-room-id="' + r.id + '" data-furniture-id="' + f.id + '" title="Abrir inventario de este mueble">📦 Inv (' + itemCount + ')</button>';
      html += '  <div class="canva-size-bar" title="Ajustar ancho">';
      html += '    <span class="canva-size-lbl">W:</span>';
      html += '    <button class="canva-size-btn" data-action="canva-change-w" data-room-id="' + r.id + '" data-item-id="' + f.id + '" data-delta="-1" title="Menos ancho">➖</button>';
      html += '    <span class="canva-size-val">' + itemW + '</span>';
      html += '    <button class="canva-size-btn" data-action="canva-change-w" data-room-id="' + r.id + '" data-item-id="' + f.id + '" data-delta="1" title="Más ancho">➕</button>';
      html += '  </div>';
      html += '  <div class="canva-size-bar" title="Ajustar alto">';
      html += '    <span class="canva-size-lbl">H:</span>';
      html += '    <button class="canva-size-btn" data-action="canva-change-h" data-room-id="' + r.id + '" data-item-id="' + f.id + '" data-delta="-1" title="Menos alto">➖</button>';
      html += '    <span class="canva-size-val">' + itemH + '</span>';
      html += '    <button class="canva-size-btn" data-action="canva-change-h" data-room-id="' + r.id + '" data-item-id="' + f.id + '" data-delta="1" title="Más alto">➕</button>';
      html += '  </div>';
      html += '  <div class="canva-nudge-bar" title="Mover celda">';
      html += '    <button class="canva-nudge-btn" data-action="canva-nudge-item" data-room-id="' + r.id + '" data-item-id="' + f.id + '" data-dx="-1" data-dy="0" title="Izquierda">◀</button>';
      html += '    <button class="canva-nudge-btn" data-action="canva-nudge-item" data-room-id="' + r.id + '" data-item-id="' + f.id + '" data-dx="0" data-dy="-1" title="Arriba">▲</button>';
      html += '    <button class="canva-nudge-btn" data-action="canva-nudge-item" data-room-id="' + r.id + '" data-item-id="' + f.id + '" data-dx="0" data-dy="1" title="Abajo">▼</button>';
      html += '    <button class="canva-nudge-btn" data-action="canva-nudge-item" data-room-id="' + r.id + '" data-item-id="' + f.id + '" data-dx="1" data-dy="0" title="Derecha">▶</button>';
      html += '  </div>';
      html += '  <button class="canva-float-btn" data-action="canva-duplicate-item" data-room-id="' + r.id + '" data-item-id="' + f.id + '" title="Duplicar elemento">📋 Copiar</button>';
      html += '  <button class="canva-float-btn danger" data-action="canva-delete-item" data-room-id="' + r.id + '" data-item-id="' + f.id + '" title="Eliminar mueble">&times; Borrar</button>';
      html += '</div>';
      html += '<div class="canva-item-nametag">' + esc(f.name) + ' (' + itemW + 'x' + itemH + ')</div>';
    } else if(!isSel && itemCount > 0){
      html += '<div class="canva-item-mini-badge">📦 ' + itemCount + '</div>';
    }

    html += '  <div class="canva-stage-item-svg">' + getCanvaSvg(f.type || f.id, rot) + '</div>';
    html += '</div>';
  });

  // Renderizar decoración con soporte de selección morada Canva
  decorList.forEach(function(d){
    var isSel = (houseState.selectedItemId === d.id);
    var itemW = Math.max(1, d.w || 1);
    var itemH = Math.max(1, d.h || 1);
    var colStart = (d.pos_x || 0) + 1;
    var rowStart = (d.pos_y || 0) + 1;
    var rot = d.rotation || 0;
    var gridSpan = 'grid-column:' + colStart + ' / span ' + itemW + ';grid-row:' + rowStart + ' / span ' + itemH + ';';

    html += '<div class="canva-stage-item item-decor' + (isSel ? ' canva-selected' : '') + '" style="' + gridSpan + '" data-action="canva-select-item" data-item-id="' + d.id + '" data-room-id="' + r.id + '">';

    if(isSel && canEdit && isGm){
      html += '<div class="canva-floating-toolbar">';
      html += '  <button class="canva-float-btn" data-action="canva-rotate-item" data-room-id="' + r.id + '" data-item-id="' + d.id + '" title="Girar 90°">🔄 90°</button>';
      html += '  <div class="canva-size-bar" title="Ajustar ancho">';
      html += '    <span class="canva-size-lbl">W:</span>';
      html += '    <button class="canva-size-btn" data-action="canva-change-w" data-room-id="' + r.id + '" data-item-id="' + d.id + '" data-delta="-1" title="Menos ancho">➖</button>';
      html += '    <span class="canva-size-val">' + itemW + '</span>';
      html += '    <button class="canva-size-btn" data-action="canva-change-w" data-room-id="' + r.id + '" data-item-id="' + d.id + '" data-delta="1" title="Más ancho">➕</button>';
      html += '  </div>';
      html += '  <div class="canva-size-bar" title="Ajustar alto">';
      html += '    <span class="canva-size-lbl">H:</span>';
      html += '    <button class="canva-size-btn" data-action="canva-change-h" data-room-id="' + r.id + '" data-item-id="' + d.id + '" data-delta="-1" title="Menos alto">➖</button>';
      html += '    <span class="canva-size-val">' + itemH + '</span>';
      html += '    <button class="canva-size-btn" data-action="canva-change-h" data-room-id="' + r.id + '" data-item-id="' + d.id + '" data-delta="1" title="Más alto">➕</button>';
      html += '  </div>';
      html += '  <div class="canva-nudge-bar" title="Mover celda">';
      html += '    <button class="canva-nudge-btn" data-action="canva-nudge-item" data-room-id="' + r.id + '" data-item-id="' + d.id + '" data-dx="-1" data-dy="0" title="Izquierda">◀</button>';
      html += '    <button class="canva-nudge-btn" data-action="canva-nudge-item" data-room-id="' + r.id + '" data-item-id="' + d.id + '" data-dx="0" data-dy="-1" title="Arriba">▲</button>';
      html += '    <button class="canva-nudge-btn" data-action="canva-nudge-item" data-room-id="' + r.id + '" data-item-id="' + d.id + '" data-dx="0" data-dy="1" title="Abajo">▼</button>';
      html += '    <button class="canva-nudge-btn" data-action="canva-nudge-item" data-room-id="' + r.id + '" data-item-id="' + d.id + '" data-dx="1" data-dy="0" title="Derecha">▶</button>';
      html += '  </div>';
      html += '  <button class="canva-float-btn" data-action="canva-duplicate-item" data-room-id="' + r.id + '" data-item-id="' + d.id + '" title="Duplicar adorno">📋 Copiar</button>';
      html += '  <button class="canva-float-btn danger" data-action="canva-delete-item" data-room-id="' + r.id + '" data-item-id="' + d.id + '" title="Quitar adorno">&times; Borrar</button>';
      html += '</div>';
      html += '<div class="canva-item-nametag">' + esc(d.label || d.type) + ' (' + itemW + 'x' + itemH + ')</div>';
    }

    html += '  <div class="canva-stage-item-svg">' + getCanvaSvg(d.type || d.id, rot) + '</div>';
    html += '</div>';
  });

  html += '  </div>'; // fin canva-room-stage

  // Panel de control táctil de elemento seleccionado (Dock interactivo para móviles y ratón)
  if(houseState.selectedItemId && canEdit && isGm){
    var selFurn = furnitureList.find(function(f){ return f.id === houseState.selectedItemId; });
    var selDec = decorList.find(function(d){ return d.id === houseState.selectedItemId; });
    var selItem = selFurn || selDec;
    var isFurn = !!selFurn;

    if(selItem){
      var sW = Math.max(1, selItem.w || 1);
      var sH = Math.max(1, selItem.h || 1);
      var sX = selItem.pos_x || 0;
      var sY = selItem.pos_y || 0;
      var sName = isFurn ? selItem.name : (selItem.label || selItem.type);
      var sItemCount = (isFurn && Array.isArray(selItem.items)) ? selItem.items.length : 0;

      html += '<div class="canva-selected-dock" id="canvaSelectedDock">';
      html += '  <div class="canva-dock-header">';
      html += '    <div class="canva-dock-item-info">';
      html += '      <span class="canva-dock-icon">' + (isFurn ? '🪑' : '🌿') + '</span>';
      html += '      <strong class="canva-dock-name">' + esc(sName) + '</strong>';
      html += '      <span class="canva-dock-coords">[' + sW + 'x' + sH + ' en celda (' + sX + ', ' + sY + ')]</span>';
      html += '    </div>';
      html += '    <button class="canva-dock-close-btn" data-action="canva-deselect-item" title="Cerrar selección">&times;</button>';
      html += '  </div>';
      html += '  <div class="canva-dock-body">';
      html += '    <div class="canva-dock-actions-row">';
      html += '      <button class="canva-dock-btn" data-action="canva-rotate-item" data-room-id="' + r.id + '" data-item-id="' + selItem.id + '" title="Rotar 90 grados">🔄 Girar</button>';
      if(isFurn){
        html += '      <button class="canva-dock-btn highlight" data-action="open-add-item-modal" data-room-id="' + r.id + '" data-furniture-id="' + selItem.id + '" title="Abrir inventario">📦 Almacén (' + sItemCount + ')</button>';
      }
      html += '      <button class="canva-dock-btn" data-action="canva-duplicate-item" data-room-id="' + r.id + '" data-item-id="' + selItem.id + '" title="Duplicar">📋 Copiar</button>';
      html += '      <button class="canva-dock-btn danger" data-action="canva-delete-item" data-room-id="' + r.id + '" data-item-id="' + selItem.id + '" title="Eliminar elemento">🗑️ Quitar</button>';
      html += '    </div>';
      html += '    <div class="canva-dock-adjust-row">';
      html += '      <div class="canva-dock-size-pill">';
      html += '        <span class="canva-dock-lbl">Ancho:</span>';
      html += '        <button class="canva-dock-adj-btn" data-action="canva-change-w" data-room-id="' + r.id + '" data-item-id="' + selItem.id + '" data-delta="-1" title="Menos ancho">➖</button>';
      html += '        <span class="canva-dock-val">' + sW + '</span>';
      html += '        <button class="canva-dock-adj-btn" data-action="canva-change-w" data-room-id="' + r.id + '" data-item-id="' + selItem.id + '" data-delta="1" title="Más ancho">➕</button>';
      html += '      </div>';
      html += '      <div class="canva-dock-size-pill">';
      html += '        <span class="canva-dock-lbl">Alto:</span>';
      html += '        <button class="canva-dock-adj-btn" data-action="canva-change-h" data-room-id="' + r.id + '" data-item-id="' + selItem.id + '" data-delta="-1" title="Menos alto">➖</button>';
      html += '        <span class="canva-dock-val">' + sH + '</span>';
      html += '        <button class="canva-dock-adj-btn" data-action="canva-change-h" data-room-id="' + r.id + '" data-item-id="' + selItem.id + '" data-delta="1" title="Más alto">➕</button>';
      html += '      </div>';
      html += '      <div class="canva-dock-dpad">';
      html += '        <span class="canva-dock-lbl">Mover:</span>';
      html += '        <button class="canva-dock-dpad-btn" data-action="canva-nudge-item" data-room-id="' + r.id + '" data-item-id="' + selItem.id + '" data-dx="-1" data-dy="0" title="Izquierda">◀</button>';
      html += '        <button class="canva-dock-dpad-btn" data-action="canva-nudge-item" data-room-id="' + r.id + '" data-item-id="' + selItem.id + '" data-dx="0" data-dy="-1" title="Arriba">▲</button>';
      html += '        <button class="canva-dock-dpad-btn" data-action="canva-nudge-item" data-room-id="' + r.id + '" data-item-id="' + selItem.id + '" data-dx="0" data-dy="1" title="Abajo">▼</button>';
      html += '        <button class="canva-dock-dpad-btn" data-action="canva-nudge-item" data-room-id="' + r.id + '" data-item-id="' + selItem.id + '" data-dx="1" data-dy="0" title="Derecha">▶</button>';
      html += '      </div>';
      html += '    </div>';
      html += '  </div>';
      html += '</div>';
    }
  }

  html += '</div>'; // fin canva-stage-wrap

  html += '</div>'; // fin canva-studio-layout
  html += '</div>'; // fin canva-studio-container
  return html;
}

// Arrastre directo de elementos en el Estudio Canva
var canvaActiveDrag = null;

function handleCanvaStagePointerDown(e){
  if(!houseState.studioRoomId) return;
  if(e.button !== undefined && e.button !== 0) return;
  if(e.target.closest(".canva-floating-toolbar") || e.target.closest("button")) return;

  var itemEl = e.target.closest(".canva-stage-item");
  var stageEl = document.getElementById("canvaRoomStage");
  if(!itemEl || !stageEl) return;

  var itemId = itemEl.getAttribute("data-item-id");
  var roomId = itemEl.getAttribute("data-room-id") || houseState.studioRoomId;
  if(!itemId || !roomId) return;

  var room = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!room) return;

  var isFurn = true;
  var targetItem = (room.furniture || []).find(function(x){ return x.id === itemId; });
  if(!targetItem){
    targetItem = (room.decor || []).find(function(x){ return x.id === itemId; });
    isFurn = false;
  }
  if(!targetItem) return;

  var stageRect = stageEl.getBoundingClientRect();
  var cellW = stageRect.width / 6;
  var cellH = stageRect.height / 4;

  canvaActiveDrag = {
    pointerId: e.pointerId,
    roomId: roomId,
    itemId: itemId,
    isFurn: isFurn,
    itemEl: itemEl,
    stageEl: stageEl,
    startX: e.clientX,
    startY: e.clientY,
    origPosX: targetItem.pos_x || 0,
    origPosY: targetItem.pos_y || 0,
    w: Math.max(1, targetItem.w || 1),
    h: Math.max(1, targetItem.h || 1),
    cellW: cellW,
    cellH: cellH,
    hasMoved: false,
    currentPosX: targetItem.pos_x || 0,
    currentPosY: targetItem.pos_y || 0
  };

  try {
    itemEl.setPointerCapture(e.pointerId);
  } catch(err){}
}

function handleCanvaStagePointerMove(e){
  if(!canvaActiveDrag || canvaActiveDrag.pointerId !== e.pointerId) return;

  var dx = e.clientX - canvaActiveDrag.startX;
  var dy = e.clientY - canvaActiveDrag.startY;

  if(!canvaActiveDrag.hasMoved && (Math.abs(dx) > 6 || Math.abs(dy) > 6)){
    canvaActiveDrag.hasMoved = true;
    canvaActiveDrag.itemEl.classList.add("canva-dragging");
  }

  if(!canvaActiveDrag.hasMoved) return;

  e.preventDefault();

  var deltaCols = Math.round(dx / canvaActiveDrag.cellW);
  var deltaRows = Math.round(dy / canvaActiveDrag.cellH);

  var newX = Math.max(0, Math.min(6 - canvaActiveDrag.w, canvaActiveDrag.origPosX + deltaCols));
  var newY = Math.max(0, Math.min(4 - canvaActiveDrag.h, canvaActiveDrag.origPosY + deltaRows));

  canvaActiveDrag.currentPosX = newX;
  canvaActiveDrag.currentPosY = newY;

  canvaActiveDrag.itemEl.style.transform = "translate3d(" + dx + "px, " + dy + "px, 0)";
}

function handleCanvaStagePointerUp(e){
  if(!canvaActiveDrag || canvaActiveDrag.pointerId !== e.pointerId) return;

  var drag = canvaActiveDrag;
  canvaActiveDrag = null;

  try {
    drag.itemEl.releasePointerCapture(e.pointerId);
  } catch(err){}

  drag.itemEl.classList.remove("canva-dragging");
  drag.itemEl.style.transform = "";

  if(!drag.hasMoved){
    houseState.selectedItemId = (houseState.selectedItemId === drag.itemId) ? null : drag.itemId;
    renderHouseView();
    return;
  }

  var room = (houseState.rooms || []).find(function(x){ return x.id === drag.roomId; });
  if(!room) return;

  var targetItem = drag.isFurn
    ? (room.furniture || []).find(function(x){ return x.id === drag.itemId; })
    : (room.decor || []).find(function(x){ return x.id === drag.itemId; });

  if(!targetItem) return;

  var changed = (targetItem.pos_x !== drag.currentPosX || targetItem.pos_y !== drag.currentPosY);
  if(changed){
    targetItem.pos_x = drag.currentPosX;
    targetItem.pos_y = drag.currentPosY;
    houseState.selectedItemId = drag.itemId;
    saveRoomChangesToRemoteAndBroadcast(room, drag.isFurn ? "furniture" : "decor");
    renderHouseView();
  } else {
    renderHouseView();
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
      saveRoomChangesToRemoteAndBroadcast(room, "pos");
      renderHouseView();

      if(typeof showToast === "function"){
        showToast("Estancia reubicada en (" + room.pos_x + ", " + room.pos_y + ")", "info");
      }
    } else {
      renderHouseView();
    }
  } else {
    var changedDim = (room.width !== drag.currentWidth || room.height !== drag.currentHeight);
    if(changedDim){
      room.width = drag.currentWidth;
      room.height = drag.currentHeight;
      saveRoomChangesToRemoteAndBroadcast(room, "dimensions");
      renderHouseView();

      if(typeof showToast === "function"){
        showToast("Dimensiones actualizadas a " + room.width + "x" + room.height, "info");
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
document.addEventListener("pointerdown", function(e){
  handleCanvaStagePointerDown(e);
  handleHousePointerDown(e);
}, { passive: false });

document.addEventListener("pointermove", function(e){
  handleCanvaStagePointerMove(e);
  handleHousePointerMove(e);
}, { passive: false });

document.addEventListener("pointerup", function(e){
  handleCanvaStagePointerUp(e);
  handleHousePointerUp(e);
}, { passive: false });

document.addEventListener("pointercancel", function(e){
  handleCanvaStagePointerUp(e);
  handleHousePointerCancel(e);
}, { passive: false });

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

  saveRoomChangesToRemoteAndBroadcast(r, "pos");
  renderHouseView();
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

  saveRoomChangesToRemoteAndBroadcast(r, "dimensions");
  renderHouseView();
}

function setRoomFloor(roomId, newFloor){
  var r = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!r) return;

  r.floor = parseInt(newFloor, 10) || 1;
  saveRoomChangesToRemoteAndBroadcast(r, "floor");
  renderHouseView();

  if(typeof showToast === "function") showToast("Habitación trasladada a Planta " + r.floor + ".", "info");
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

  // FASE 5: Controles de Zoom del Plano (Con ajuste rápido a móvil)
  var curZoom = houseState.zoom || 1.0;
  html += '      <div class="house-zoom-controls">';
  html += '        <button class="house-zoom-btn" data-action="zoom-house-out" title="Alejar plano (Zoom -)">−</button>';
  html += '        <button class="house-zoom-btn house-zoom-fit" data-action="zoom-house-fit" title="Ajustar al móvil o pantalla completa">📱 Ajustar</button>';
  html += '        <button class="house-zoom-btn house-zoom-reset" data-action="zoom-house-reset" title="Restablecer zoom (100%)">🔍 ' + Math.round(curZoom * 100) + '%</button>';
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

  // Si el usuario está dentro del Estudio Canva de una habitación, renderizar el estudio enfocado
  if(houseState.studioRoomId){
    html += renderCanvaStudio(houseState.studioRoomId);
  } else {
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
    return '<div style="grid-column:1/-1;text-align:center;color:var(--ink-dim);padding:40px;font-style:italic;">Esta planta no tiene estancias construidas todavía. (Usa "+ Añadir Habitación" como GM para construir aquí).</div>';
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
    var customBgStyle = r.color ? ('background: ' + getRoomCustomBackground(r.color) + ' !important;') : '';

    var resizeHandleHtml = '';
    if(isEditMode && isSelected){
      resizeHandleHtml = '<div class="house-room-resize-handle" data-room-id="' + r.id + '" title="Arrastra para redimensionar"></div>';
    }

    var doorCutouts = getRoomDoorCutouts(r, rooms);

    // 1. ENTRADA PRINCIPAL: Umbral arquitectónico exterior destacado
    if(r.room_type === "entrada" || r.id === "r_entrada_main"){
      var entradaDimsFoot = isEditMode
        ? '<div class="house-room-tile-foot"><span class="house-room-dims">' + (r.width || 2) + 'x' + (r.height || 2) + '</span></div>'
        : '';

      return '<div class="house-room-tile type-entrada ' + wallClasses + ' tex-entrada' + (isSelected ? ' active' : '') + (isEditMode ? ' edit-draggable' : '') + '" style="' + gridStyle + ' ' + customBgStyle + '" data-action="select-house-room" data-room-id="' + r.id + '" data-pos-x="' + (r.pos_x || 0) + '" data-pos-y="' + (r.pos_y || 0) + '" data-width="' + (r.width || 2) + '" data-height="' + (r.height || 2) + '" role="button" tabindex="0" title="Entrada Principal de La Casa Andante">' +
        '  <div class="entrada-threshold-wrap">' +
        '    <div class="entrada-doormat"><span>🚪 ENTRADA PRINCIPAL</span></div>' +
        '    <div class="entrada-sub">Umbral Exterior</div>' +
        '  </div>' +
        entradaDimsFoot +
        resizeHandleHtml +
        '</div>';
    }

    // 2. ESCALERAS: Comunicación vertical interactiva con salto de piso
    if(r.room_type === "escaleras" || r.id.includes("stairs")){
      var targetFloor = (floorNumber === 1) ? 2 : 1;
      var dirLabel = (floorNumber === 1) ? "Subir a Planta 2 ▲" : "Bajar a Planta 1 ▼";
      var stairsDimsFoot = isEditMode
        ? '<div class="house-room-tile-foot"><span class="house-room-dims">' + (r.width || 2) + 'x' + (r.height || 2) + '</span></div>'
        : '';

      return '<div class="house-room-tile type-escaleras ' + wallClasses + ' tex-escaleras' + (isSelected ? ' active' : '') + (isEditMode ? ' edit-draggable' : '') + '" style="' + gridStyle + ' ' + customBgStyle + '" data-action="select-house-room" data-room-id="' + r.id + '" data-pos-x="' + (r.pos_x || 0) + '" data-pos-y="' + (r.pos_y || 0) + '" data-width="' + (r.width || 2) + '" data-height="' + (r.height || 2) + '" role="button" tabindex="0" title="Escaleras conectores de plantas">' +
        '  <div class="house-stairs-visual">' +
        '    <div class="stairs-treads"></div>' +
        '    <button class="house-stairs-action-btn" data-action="switch-house-floor" data-floor="' + targetFloor + '" title="Ir a la Planta ' + targetFloor + '">🪜 ' + dirLabel + '</button>' +
        '  </div>' +
        stairsDimsFoot +
        resizeHandleHtml +
        '</div>';
    }

    // 3. PASILLOS Y GALERÍAS: Flujo visual continuo sin divisiones interiores
    if(r.room_type === "pasillo"){
      var archHtml = '<div class="corridor-floor-runner"></div>';
      if(doorCutouts.left) archHtml += '<div class="corridor-door-arch arch-left" title="Paso abierto hacia estancia"></div>';
      if(doorCutouts.right) archHtml += '<div class="corridor-door-arch arch-right" title="Paso abierto hacia estancia"></div>';
      if(doorCutouts.top) archHtml += '<div class="corridor-door-arch arch-top" title="Paso abierto hacia estancia"></div>';
      if(doorCutouts.bottom) archHtml += '<div class="corridor-door-arch arch-bottom" title="Paso abierto hacia estancia"></div>';

      var dimsFoot = isEditMode
        ? '<div class="house-room-tile-foot"><span class="house-room-dims">' + (r.width || 1) + 'x' + (r.height || 1) + '</span></div>'
        : '';

      return '<div class="house-room-tile type-pasillo ' + wallClasses + ' ' + textureClass + (isSelected ? ' active' : '') + (isEditMode ? ' edit-draggable' : '') + '" style="' + gridStyle + ' ' + customBgStyle + '" data-action="select-house-room" data-room-id="' + r.id + '" data-pos-x="' + (r.pos_x || 0) + '" data-pos-y="' + (r.pos_y || 0) + '" data-width="' + (r.width || 1) + '" data-height="' + (r.height || 1) + '" role="button" tabindex="0" title="Pasillo (Galería conectora)">' +
        archHtml +
        '  <div class="corridor-title-plaque" title="' + esc(r.name || "Galería") + '">' +
        '    <span class="corridor-glyph">✦</span>' +
        '    <span class="corridor-text house-room-name corridor-title">' + esc(r.name || "Galería") + '</span>' +
        '    <span class="corridor-glyph">✦</span>' +
        '  </div>' +
        dimsFoot +
        resizeHandleHtml +
        '</div>';
    }

    // 4. ESTANCIAS (Salón, Cocina, Dormitorios, etc.): Plano limpio, puertas y mini-layout
    var doorHtml = '';
    if(doorCutouts.left) doorHtml += '<div class="room-door-swing swing-left" title="Puerta de acceso">' + getCanvaSvg('puerta_batiente', 270) + '</div>';
    if(doorCutouts.right) doorHtml += '<div class="room-door-swing swing-right" title="Puerta de acceso">' + getCanvaSvg('puerta_batiente', 90) + '</div>';
    if(doorCutouts.top) doorHtml += '<div class="room-door-swing swing-top" title="Puerta de acceso">' + getCanvaSvg('puerta_batiente', 0) + '</div>';
    if(doorCutouts.bottom) doorHtml += '<div class="room-door-swing swing-bottom" title="Puerta de acceso">' + getCanvaSvg('puerta_batiente', 180) + '</div>';

    var miniLayoutHtml = '<div class="house-room-mini-layout">' + renderRoomMiniLayout(r) + '</div>';
    var studioBtnHtml = isEditMode
      ? '<button class="btn-canva-studio-mini" data-action="open-canva-studio" data-room-id="' + r.id + '" title="Diseñar y decorar en Estudio Canva">🎨</button>'
      : '';
    var levelPillHtml = isEditMode
      ? '<span class="house-room-level-pill">Nv. ' + (r.level || 1) + '</span>'
      : '';
    var dimsHtml = isEditMode
      ? '<span class="house-room-dims">' + (r.width || 2) + 'x' + (r.height || 2) + '</span>'
      : '';

    return '<div class="house-room-tile ' + wallClasses + ' ' + textureClass + (isSelected ? ' active' : '') + (isMyRoom ? ' my-room' : '') + (isEditMode ? ' edit-draggable' : '') + '" style="' + gridStyle + ' ' + customBgStyle + '" data-action="select-house-room" data-room-id="' + r.id + '" data-pos-x="' + (r.pos_x || 0) + '" data-pos-y="' + (r.pos_y || 0) + '" data-width="' + (r.width || 2) + '" data-height="' + (r.height || 2) + '" role="button" tabindex="0">' +
      doorHtml +
      miniLayoutHtml +
      '  <div class="house-room-title-plaque" title="' + esc(r.name) + ' (' + getRoomTypeLabel(r.room_type) + ')">' +
      '    <span class="house-room-plaque-icon">' + getRoomTypeIcon(r.room_type) + '</span>' +
      '    <span class="house-room-plaque-name house-room-name">' + esc(r.name) + '</span>' +
      (isEditMode ? ('    <div class="house-room-plaque-actions">' + studioBtnHtml + levelPillHtml + '</div>') : '') +
      '  </div>' +
      '  <div class="house-room-tile-foot">' +
      '    ' + ownerTag +
      '    <div style="display:flex;gap:4px;align-items:center;">' +
      '      ' + furnitureTag +
      dimsHtml +
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
    pHtml += '      <h3 class="house-inspector-title">✦ ' + esc(r.name || "Galería") + '</h3>';
    pHtml += '      <div class="house-inspector-meta">';
    pHtml += '        <span class="house-room-type-tag pasillo">Galería / Pasillo</span>';
    pHtml += '        <span style="font-size:0.72rem;color:var(--ink-faint);">Planta ' + (r.floor || 1) + ' (' + (r.width||1) + 'x' + (r.height||1) + ')</span>';
    pHtml += '      </div>';
    pHtml += '    </div>';
    pHtml += '    <button class="btn-compact" data-action="close-room-inspector" style="padding:2px 8px;" title="Cerrar">&times;</button>';
    pHtml += '  </div>';
    pHtml += '  <div style="padding:14px;display:flex;flex-direction:column;gap:12px;">';
    pHtml += '    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">';
    pHtml += '      <span style="font-size:0.8rem;color:var(--ink-dim);">Los pasillos comunican estancias. Puedes cambiar su nombre, tono arquitectónico o redimensionarlo.</span>';
    pHtml += '      <div style="display:flex;gap:6px;">';
    pHtml += '        <button class="btn-compact" data-action="open-edit-room-modal" data-room-id="' + r.id + '">✏️ Editar</button>';
    if(isGm){
      pHtml += '        <button class="btn-compact" data-action="delete-house-room" data-room-id="' + r.id + '" style="color:#E74C3C;border-color:rgba(231,76,60,0.4);">🗑️ Eliminar</button>';
    }
    pHtml += '      </div>';
    pHtml += '    </div>';
    pHtml += '    <div class="house-inspector-color-row">';
    pHtml += '      <span style="font-size:0.75rem;color:var(--gold-light);font-weight:600;">🎨 Suelo / Tono de la Galería:</span>';
    pHtml += '      ' + renderColorPaletteBar(r.id, r.color);
    pHtml += '    </div>';
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

    html += '  <div class="house-inspector-color-row" style="margin-top:10px;">';
    html += '    <span style="font-size:0.75rem;color:var(--gold-light);font-weight:600;">🎨 Suelo / Color de la Estancia:</span>';
    html += '    ' + renderColorPaletteBar(r.id, r.color);
    html += '  </div>';

    html += '  <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-top:12px;">';
    html += '    <button class="btn-solid-gold" data-action="open-canva-studio" data-room-id="' + r.id + '" style="font-size:0.8rem;padding:5px 12px;background:linear-gradient(135deg,#7c3aed,#4f46e5);border-color:#a78bfa;box-shadow:0 2px 10px rgba(139,92,246,0.35);">🎨 Diseñar en Estudio Canva</button>';
    if(canEdit){
      html += '    <button class="btn-compact" data-action="open-edit-room-modal" data-room-id="' + r.id + '">✏️ ' + (isGm ? 'Modificar Estancia' : 'Decorar mi habitación') + '</button>';
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
  saveRoomChangesToRemoteAndBroadcast(r, "furniture");
  closeHouseModal();
  renderHouseView();

  if(typeof showToast === "function") showToast("Mueble '" + newFur.name + "' instalado.", "success");
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

  saveRoomChangesToRemoteAndBroadcast(r, "furniture");
  closeHouseModal();
  renderHouseView();

  if(typeof showToast === "function") showToast("Objeto guardado en " + fur.name + ".", "success");
}

function deleteFurnitureAction(roomId, furnitureId){
  var r = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!r || !Array.isArray(r.furniture)) return;

  if(!confirm("¿Quitar este mueble y su contenido de la habitación?")) return;

  r.furniture = r.furniture.filter(function(f){ return f.id !== furnitureId; });
  saveRoomChangesToRemoteAndBroadcast(r, "furniture");
  renderHouseView();
}

function deleteFurnitureItemAction(roomId, furnitureId, itemIdx){
  var r = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!r || !Array.isArray(r.furniture)) return;

  var fur = r.furniture.find(function(f){ return f.id === furnitureId; });
  if(!fur || !Array.isArray(fur.items)) return;

  fur.items.splice(itemIdx, 1);
  saveRoomChangesToRemoteAndBroadcast(r, "furniture");
  renderHouseView();
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
      '      <option value="salon"' + (r.room_type === "salon" ? " selected" : "") + '>Salón y Hogar</option>' +
      '      <option value="cocina"' + (r.room_type === "cocina" ? " selected" : "") + '>Cocina y Horno</option>' +
      '      <option value="habitacion_personal"' + (r.room_type === "habitacion_personal" ? " selected" : "") + '>Habitación Personal</option>' +
      '      <option value="habitacion_comun"' + (r.room_type === "habitacion_comun" ? " selected" : "") + '>Habitación Común</option>' +
      '      <option value="pasillo"' + (r.room_type === "pasillo" ? " selected" : "") + '>Pasillo / Galería</option>' +
      '      <option value="entrada"' + (r.room_type === "entrada" ? " selected" : "") + '>Entrada Principal</option>' +
      '      <option value="escaleras"' + (r.room_type === "escaleras" ? " selected" : "") + '>Escaleras</option>' +
      '      <option value="bodega"' + (r.room_type === "bodega" ? " selected" : "") + '>Bodega / Despensa</option>' +
      '      <option value="taller"' + (r.room_type === "taller" ? " selected" : "") + '>Taller / Forja</option>' +
      '      <option value="biblioteca"' + (r.room_type === "biblioteca" ? " selected" : "") + '>Biblioteca / Estudio</option>' +
      '      <option value="invernadero"' + (r.room_type === "invernadero" ? " selected" : "") + '>Invernadero</option>' +
      '      <option value="banos"' + (r.room_type === "banos" ? " selected" : "") + '>Baños</option>' +
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
      '    <div class="field"><label>Pos X</label><input type="number" id="editRoomPosX" min="0" max="15" value="' + (r.pos_x || 0) + '"></div>' +
      '    <div class="field"><label>Pos Y</label><input type="number" id="editRoomPosY" min="0" max="12" value="' + (r.pos_y || 0) + '"></div>' +
      '    <div class="field"><label>Ancho</label><input type="number" id="editRoomWidth" min="1" max="16" value="' + (r.width || 2) + '"></div>' +
      '    <div class="field"><label>Alto</label><input type="number" id="editRoomHeight" min="1" max="6" value="' + (r.height || 2) + '"></div>' +
      '  </div>' +
      '  <div class="field" style="margin-top:8px;">' +
      '    <label>Nivel de la Habitación</label>' +
      '    <input type="number" id="editRoomLevel" min="1" max="20" value="' + (r.level || 1) + '">' +
      '  </div>';
  }

  // Selector de Color y Suelo de la Estancia
  html += '  <div class="field" style="margin-top:8px;">' +
    '    <label>🎨 Fondo y Suelo de la Estancia / Pasillo</label>' +
    '    <div class="house-color-palette-bar" style="margin-top:4px;">';
  HOUSE_COLOR_PALETTES.forEach(function(p){
    var isSel = (r.color === p.hex || (!r.color && !p.hex));
    html += '<button type="button" class="house-color-chip' + (isSel ? ' is-active' : '') + '" style="background:' + (p.hex || '#1a1816') + ';" data-action="modal-select-color" data-color="' + p.hex + '" title="' + p.name + ' - ' + p.desc + '"></button>';
  });
  html += '      <input type="color" id="editRoomCustomColor" value="' + (r.color || '#2a1e16') + '" data-action="modal-custom-color" title="Color personalizado">';
  html += '    </div>' +
    '    <input type="hidden" id="editRoomColorValue" value="' + esc(r.color || '') + '">' +
    '  </div>';

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
    '      <option value="salon">Salón y Hogar</option>' +
    '      <option value="cocina">Cocina y Horno</option>' +
    '      <option value="habitacion_personal">Habitación Personal</option>' +
    '      <option value="habitacion_comun" selected>Habitación Común</option>' +
    '      <option value="pasillo">Pasillo / Galería</option>' +
    '      <option value="entrada">Entrada Principal</option>' +
    '      <option value="escaleras">Escaleras</option>' +
    '      <option value="bodega">Bodega / Despensa</option>' +
    '      <option value="taller">Taller / Forja</option>' +
    '      <option value="biblioteca">Biblioteca / Estudio</option>' +
    '      <option value="invernadero">Invernadero</option>' +
    '      <option value="banos">Baños</option>' +
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
    '    <div class="field"><label>Pos X</label><input type="number" id="newRoomPosX" min="0" max="15" value="0"></div>' +
    '    <div class="field"><label>Pos Y</label><input type="number" id="newRoomPosY" min="0" max="12" value="0"></div>' +
    '    <div class="field"><label>Ancho</label><input type="number" id="newRoomWidth" min="1" max="16" value="3"></div>' +
    '    <div class="field"><label>Alto</label><input type="number" id="newRoomHeight" min="1" max="6" value="2"></div>' +
    '  </div>' +
    '  <div class="field" style="margin-top:8px;">' +
    '    <label>🎨 Fondo y Suelo de la Estancia</label>' +
    '    <div class="house-color-palette-bar" style="margin-top:4px;">';
  HOUSE_COLOR_PALETTES.forEach(function(p){
    html += '<button type="button" class="house-color-chip' + (p.id === "default" ? ' is-active' : '') + '" style="background:' + (p.hex || '#1a1816') + ';" data-action="modal-select-color" data-color="' + p.hex + '" title="' + p.name + ' - ' + p.desc + '"></button>';
  });
  html += '      <input type="color" id="newRoomCustomColor" value="#2a1e16" data-action="modal-custom-color" title="Color personalizado">';
  html += '    </div>' +
    '    <input type="hidden" id="editRoomColorValue" value="">' +
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

  var colorEl = document.getElementById("editRoomColorValue");
  if(colorEl){
    r.color = colorEl.value || null;
  }

  saveRoomChangesToRemoteAndBroadcast(r, "general");
  closeHouseModal();
  renderHouseView();

  if(typeof showToast === "function") showToast("Habitación guardada.", "success");
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

  var colorEl = document.getElementById("editRoomColorValue");
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
    decor: [],
    color: (colorEl && colorEl.value) ? colorEl.value : null,
    created_at: new Date().toISOString()
  };

  houseState.rooms.push(newRoom);
  houseState.selectedRoomId = newRoom.id;
  houseState.activeFloor = newRoom.floor;
  saveRoomChangesToRemoteAndBroadcast(newRoom, "create");
  closeHouseModal();
  renderHouseView();

  if(typeof showToast === "function") showToast("Habitación creada en el plano.", "success");
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
  initHouseRealtimeSync();
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
    houseState.zoom = Math.min(1.8, Math.round(((houseState.zoom || 1.0) + 0.15) * 100) / 100);
    renderHouseView();
  } else if(act === "zoom-house-out"){
    houseState.zoom = Math.max(0.35, Math.round(((houseState.zoom || 1.0) - 0.15) * 100) / 100);
    renderHouseView();
  } else if(act === "zoom-house-reset"){
    houseState.zoom = 1.0;
    renderHouseView();
  } else if(act === "zoom-house-fit"){
    var isMobile = (window.innerWidth <= 768);
    var targetW = isMobile ? 680 : 980;
    var vp = document.querySelector(".house-grid-viewport");
    var vpW = vp ? vp.clientWidth : window.innerWidth;
    var fitZoom = Math.max(0.35, Math.min(1.0, Math.round(((vpW - 16) / targetW) * 100) / 100));
    if(Math.abs((houseState.zoom || 1.0) - fitZoom) < 0.04){
      houseState.zoom = 1.0;
    } else {
      houseState.zoom = fitZoom;
    }
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
  } else if(act === "open-canva-studio"){
    var csRoomId = btn.getAttribute("data-room-id") || houseState.selectedRoomId;
    if(csRoomId){
      houseState.studioRoomId = csRoomId;
      houseState.selectedItemId = null;
      renderHouseView();
    }
  } else if(act === "close-canva-studio"){
    houseState.studioRoomId = null;
    houseState.selectedItemId = null;
    renderHouseView();
  } else if(act === "canva-select-category"){
    houseState.studioCategory = btn.getAttribute("data-category") || "todas";
    renderHouseView();
  } else if(act === "canva-insert-asset"){
    var insRoomId = btn.getAttribute("data-room-id") || houseState.studioRoomId;
    var insAssetId = btn.getAttribute("data-asset-id");
    canvaInsertAsset(insRoomId, insAssetId);
  } else if(act === "canva-select-item"){
    e.stopPropagation();
    var itmId = btn.getAttribute("data-item-id");
    houseState.selectedItemId = (houseState.selectedItemId === itmId) ? null : itmId;
    renderHouseView();
  } else if(act === "canva-deselect-item"){
    e.stopPropagation();
    houseState.selectedItemId = null;
    renderHouseView();
  } else if(act === "canva-rotate-item"){
    e.stopPropagation();
    var rotRoomId = btn.getAttribute("data-room-id") || houseState.studioRoomId;
    var rotItemId = btn.getAttribute("data-item-id") || houseState.selectedItemId;
    canvaRotateItem(rotRoomId, rotItemId);
  } else if(act === "canva-duplicate-item"){
    e.stopPropagation();
    var dupRoomId = btn.getAttribute("data-room-id") || houseState.studioRoomId;
    var dupItemId = btn.getAttribute("data-item-id") || houseState.selectedItemId;
    canvaDuplicateItem(dupRoomId, dupItemId);
  } else if(act === "canva-delete-item"){
    e.stopPropagation();
    var delRoomId = btn.getAttribute("data-room-id") || houseState.studioRoomId;
    var delItemId = btn.getAttribute("data-item-id") || houseState.selectedItemId;
    canvaDeleteItem(delRoomId, delItemId);
  } else if(act === "canva-change-w"){
    e.stopPropagation();
    var wRoomId = btn.getAttribute("data-room-id") || houseState.studioRoomId;
    var wItemId = btn.getAttribute("data-item-id") || houseState.selectedItemId;
    var wDelta = parseInt(btn.getAttribute("data-delta"), 10) || 0;
    canvaResizeItem(wRoomId, wItemId, wDelta, 0);
  } else if(act === "canva-change-h"){
    e.stopPropagation();
    var hRoomId = btn.getAttribute("data-room-id") || houseState.studioRoomId;
    var hItemId = btn.getAttribute("data-item-id") || houseState.selectedItemId;
    var hDelta = parseInt(btn.getAttribute("data-delta"), 10) || 0;
    canvaResizeItem(hRoomId, hItemId, 0, hDelta);
  } else if(act === "canva-nudge-item"){
    e.stopPropagation();
    var nRoomId = btn.getAttribute("data-room-id") || houseState.studioRoomId;
    var nItemId = btn.getAttribute("data-item-id") || houseState.selectedItemId;
    var nDx = parseInt(btn.getAttribute("data-dx"), 10) || 0;
    var nDy = parseInt(btn.getAttribute("data-dy"), 10) || 0;
    canvaNudgeItem(nRoomId, nItemId, nDx, nDy);
  } else if(act === "set-room-color"){
    var scrRId = btn.getAttribute("data-room-id");
    var scrCol = btn.getAttribute("data-color");
    setRoomColor(scrRId, scrCol);
  } else if(act === "modal-select-color"){
    e.preventDefault();
    var mColor = btn.getAttribute("data-color");
    var hiddenInp = document.getElementById("editRoomColorValue");
    if(hiddenInp) hiddenInp.value = mColor || "";
    var bar = btn.closest(".house-color-palette-bar");
    if(bar){
      bar.querySelectorAll(".house-color-chip").forEach(function(c){ c.classList.remove("is-active"); });
      btn.classList.add("is-active");
    }
  }
});

// Listener de eventos input (búsqueda Canva y selector de color personalizado)
document.addEventListener("input", function(e){
  if(e.target && e.target.getAttribute("data-action") === "canva-custom-color-input"){
    var cciRId = e.target.getAttribute("data-room-id");
    setRoomColor(cciRId, e.target.value);
  } else if(e.target && e.target.getAttribute("data-action") === "modal-custom-color"){
    var hiddenInp2 = document.getElementById("editRoomColorValue");
    if(hiddenInp2) hiddenInp2.value = e.target.value;
    var bar2 = e.target.closest(".house-color-palette-bar");
    if(bar2){
      bar2.querySelectorAll(".house-color-chip").forEach(function(c){ c.classList.remove("is-active"); });
    }
  }

  if(e.target && e.target.id === "canvaSearchInput"){
    houseState.studioSearch = e.target.value || "";
    var assetsGrid = document.querySelector(".canva-assets-grid");
    if(assetsGrid && houseState.studioRoomId){
      var r = (houseState.rooms || []).find(function(x){ return x.id === houseState.studioRoomId; });
      if(r){
        var curCategory = houseState.studioCategory || "todas";
        var search = houseState.studioSearch.toLowerCase().trim();
        var filtered = CANVA_ASSET_LIBRARY.filter(function(a){
          if(curCategory !== "todas" && a.category !== curCategory) return false;
          if(search){
            return a.name.toLowerCase().includes(search) || (a.desc && a.desc.toLowerCase().includes(search));
          }
          return true;
        });
        var gHtml = '';
        if(filtered.length === 0){
          gHtml = '<div style="font-size:0.78rem;color:var(--ink-faint);text-align:center;padding:24px;">No se encontraron elementos para esa búsqueda.</div>';
        } else {
          filtered.forEach(function(asset){
            var badge = asset.isStorage ? '📦 Inventario' : (asset.isDoor ? '🚪 Acceso' : (asset.isDecor ? '🌿 Adorno' : '🪑 Mueble'));
            gHtml += '<div class="canva-asset-card" data-action="canva-insert-asset" data-room-id="' + r.id + '" data-asset-id="' + asset.id + '" title="' + esc(asset.desc) + '">';
            gHtml += '  <div class="canva-asset-card-preview">' + getCanvaSvg(asset.id, 0) + '</div>';
            gHtml += '  <div class="canva-asset-card-info">';
            gHtml += '    <div class="canva-asset-card-name">' + esc(asset.name) + '</div>';
            gHtml += '    <span class="canva-asset-card-badge">' + badge + '</span>';
            gHtml += '  </div>';
            gHtml += '  <div class="canva-asset-card-add">➕</div>';
            gHtml += '</div>';
          });
        }
        assetsGrid.innerHTML = gHtml;
      }
    }
  }
});

// Sincronización automática entre dispositivos cuando la ventana recupera foco o visibilidad
if(typeof document !== "undefined" && typeof document.addEventListener === "function"){
  document.addEventListener("visibilitychange", function(){
    if(document.visibilityState === "visible" && houseState.active){
      fetchHouseRemoteData().then(function(){ renderHouseView(); });
    }
  });
}

if(typeof window !== "undefined" && typeof window.addEventListener === "function"){
  window.addEventListener("focus", function(){
    if(houseState.active){
      fetchHouseRemoteData().then(function(){ renderHouseView(); });
    }
  });
}

// Inicializar listener de tiempo real al arrancar el cliente
try {
  initHouseRealtimeSync();
} catch(e){}
