// ============================================================================
// SISTEMA EXPERIMENTAL "LA CASA" (PROTOTIPO BETA)
// Módulo 100% aislado: js/house.js
// Rediseño UX: Plano por Plantas, Muebles con Almacenamiento, Buffs Evolutivos
// y Controles Rápidos de Posicionamiento para el Director de Juego.
// ============================================================================

var CONFIG_ENABLE_HOUSE = true;

// Campaña de La Casa en Supabase (las pruebas automáticas la cambian por una "prueba-…")
var HOUSE_CAMPAIGN_ID = "c0000000-0000-0000-0000-000000000001";

var houseState = {
  active: false,
  previousTab: "ficha",
  tab: (function(){
    try {
      var t = localStorage.getItem("krysalisHouseTab");
      if(t === "plano" || t === "mejoras" || t === "misiones") return t;
    } catch(e){}
    return "plano";
  })(),
  selectedRoomId: null,
  activeFloor: 1,
  inspectorTab: "estancia", // "estancia" | "muebles" | "buffs"
  loading: false,
  remote: false, // true si La Casa se ha cargado de Supabase
  house: null,
  rooms: [],
  upgrades: [],
  perks: null, // mejoras de la casa (house_perks); null = aún sin tabla, se usan las de HOUSE_REAL_UPGRADES
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
// La casa de ejemplo es de Krysalis: una partida nueva empieza sin estancias
function getSeedHouseData(){
  var d = getSeedHouseDataBase();
  if(PARTIDA_ACTUAL.id !== "krysalis") d.rooms = [];
  return d;
}

function getSeedHouseDataBase(){
  var houseId = "h0000000-0000-0000-0000-000000000001";
  var salonId = "r0000000-0000-0000-0000-000000000001";
  var cocinaId = "r0000000-0000-0000-0000-000000000002";
  var cherkRoomId = "r0000000-0000-0000-0000-000000000003";

  return {
    house: {
      id: houseId,
      campaign_id: "c0000000-0000-0000-0000-000000000001",
      name: "La Casa Andante",
      description: "",
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
            name: "Cama",
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
            name: "Cama",
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
    upgrades: [],
    events: []
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
  houseState.remote = false;
  try {
    var raw = localStorage.getItem(pkey("krysalis_house_beta_v1"));
    if(raw){
      var parsed = JSON.parse(raw);
      if(parsed && parsed.house && Array.isArray(parsed.rooms)){
        houseState.house = parsed.house;
        houseState.rooms = migrateRoomsTo16Cols(parsed.rooms);
        normalizeAllRoomLayouts();
        houseState.upgrades = parsed.upgrades || [];
        houseState.perks = Array.isArray(parsed.perks) ? parsed.perks : null;
        houseState.events = parsed.events || [];
        return;
      }
    }
  } catch(e){
    console.warn("Aviso cargando datos locales de La Casa:", e);
  }

  var seed = getSeedHouseData();
  houseState.house = seed.house;
  houseState.rooms = seed.rooms;
  normalizeAllRoomLayouts();
  houseState.upgrades = seed.upgrades;
  houseState.events = seed.events;
  saveHouseLocalData();
}

function saveHouseLocalData(){
  try {
    var payload = {
      house: houseState.house,
      rooms: houseState.rooms,
      upgrades: houseState.upgrades,
      perks: houseState.perks,
      events: houseState.events
    };
    localStorage.setItem(pkey("krysalis_house_beta_v1"), JSON.stringify(payload));
  } catch(e){
    console.warn("No se pudo guardar localmente La Casa:", e);
  }
}

async function fetchHouseRemoteData(){
  if(typeof supabaseClient === "undefined" || !supabaseClient || !navigator.onLine){
    loadHouseLocalData();
    return;
  }

  try {
    houseState.loading = true;
    var campaignId = HOUSE_CAMPAIGN_ID;

    var houseRes = await supabaseClient.from("house").select("*").eq("campaign_id", campaignId).maybeSingle();
    if(houseRes.error || !houseRes.data){
      loadHouseLocalData();
      houseState.loading = false;
      return;
    }
    houseState.house = houseRes.data;
    houseState.remote = true;

    var roomsRes = await supabaseClient.from("house_rooms").select("*").eq("house_id", houseState.house.id).order("created_at", { ascending: true });
    if(!roomsRes.error && roomsRes.data && roomsRes.data.length > 0){
      var pendingRoom = canvaPendingSaveRoomId ? (houseState.rooms || []).find(function(x){ return x.id === canvaPendingSaveRoomId; }) : null;
      houseState.rooms = roomsRes.data;
      if(pendingRoom){
        var freshRoom = houseState.rooms.find(function(x){ return x.id === pendingRoom.id; });
        if(freshRoom){
          freshRoom.furniture = pendingRoom.furniture;
          freshRoom.decor = pendingRoom.decor;
        }
      }
    }
    normalizeAllRoomLayouts();
    await fetchHouseItemsRemote();

    var upgRes = await supabaseClient.from("house_upgrades").select("*").eq("house_id", houseState.house.id);
    if(!upgRes.error && upgRes.data){
      houseState.upgrades = upgRes.data;
    }

    var perkRes = await supabaseClient.from("house_perks").select("*").eq("house_id", houseState.house.id).order("sort_order", { ascending: true });
    houseState.perks = (!perkRes.error && perkRes.data) ? perkRes.data : null;
    await fetchHouseSecrets();

    var evRes = await supabaseClient.from("house_events").select("*").eq("house_id", houseState.house.id).order("created_at", { ascending: false }).limit(25);
    if(!evRes.error && evRes.data){
      houseState.events = evRes.data;
    }

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
  hex = safeColor(hex);
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

// ============================================================================
// 1.6. MOTOR 2D KONVA: TEXTURAS PROCEDURALES DE SUELO Y CONFIGURACIÓN VISUAL
// ============================================================================
var HOUSE_COLOR_MAP = {
  blood: "#C84B57",
  gold: "#DEC392",
  teal: "#76AC9D",
  gm: "#D2691E",
  purple: "#A569BD",
  blue: "#5DADE2",
  emerald: "#52BE80"
};

function resolveRoomColor(color){
  if(!color) return "#DEC392";
  if(HOUSE_COLOR_MAP[color]) return HOUSE_COLOR_MAP[color];
  return color;
}

var HOUSE_TEXTURES = [
  { id: "madera", name: "Madera / Parquet", icon: "🪵", desc: "Tablones de roble cálido con veta" },
  { id: "ladrillo", name: "Ladrillo", icon: "🧱", desc: "Ladrillo cocido, cálido y hogareño" },
  { id: "piedra", name: "Piedra / Losas", icon: "🪨", desc: "Losas de cantería y granito ancestral" },
  { id: "baldosas", name: "Baldosas", icon: "🟩", desc: "Suelo cerámico ajedrezado artesanal" },
  { id: "musgo", name: "Musgo / Tierra", icon: "🌿", desc: "Tierra fértil con brotes y líquenes" },
  { id: "alfombra", name: "Alfombra / Tapiz", icon: "🧶", desc: "Tejido aterciopelado con hilado noble" },
  { id: "arcano", name: "Arcano / Runas", icon: "🔮", desc: "Grabados místicos y círculos encantados" },
  { id: "liso", name: "Liso / Pizarra", icon: "⬛", desc: "Acabado liso sobrio y minimalista" }
];

var HOUSE_ICONS = ["🔥","🍲","🌿","🩸","🔮","🌙","🧪","🛡️","🗡️","🚪","🪜","🛋️","📚","🗝️","🪑","🍺","🎨","🏹","💤","🪙","🧭","🕯️","🪵","🦴","⚓","💍","📜","💎","⏳","⛺","🏰","💀"];

var HOUSE_PRESETS = [
  { name: "Salón", icon: "🔥", color: "blood", texture: "madera", w: 280, h: 200, type: "salon" },
  { name: "Cocina", icon: "🍲", color: "gold", texture: "baldosas", w: 280, h: 200, type: "cocina" },
  { name: "Rincón botánico", icon: "🌿", color: "teal", texture: "musgo", w: 280, h: 220, type: "habitacion_personal" },
  { name: "Dormitorio", icon: "🛏️", color: "blood", texture: "alfombra", w: 260, h: 200, type: "habitacion_personal" },
  { name: "Biblioteca", icon: "🔮", color: "gold", texture: "arcano", w: 300, h: 200, type: "biblioteca" },
  { name: "Bodega", icon: "🧪", color: "gm", texture: "piedra", w: 320, h: 220, type: "bodega" },
  { name: "Taller", icon: "⚙️", color: "gm", texture: "piedra", w: 280, h: 200, type: "taller" },
  { name: "Escaleras", icon: "🪜", color: "gold", texture: "piedra", w: 140, h: 140, type: "escaleras" },
  { name: "Pasillo", icon: "✦", color: "gold", texture: "madera", w: 240, h: 80, type: "pasillo" },
  { name: "Habitación vacía", icon: "🚪", color: "teal", texture: "madera", w: 220, h: 160, type: "otro" }
];

var _houseTextureCache = {};

function getRoomTexturePattern(texId, colorKey){
  texId = texId || "madera";
  var key = texId + "_v2";
  if(_houseTextureCache[key]) return _houseTextureCache[key];

  var cv = document.createElement("canvas");
  var ctx = cv.getContext("2d");
  // Aleatorio con semilla fija: la textura sale igual en todos los dispositivos
  var seed = 7;
  function rnd(){ seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }

  if(texId === "madera"){
    cv.width = 128; cv.height = 64;
    var woods = ["#7A4A27", "#6E4223", "#83522E", "#744727"];
    for(var row = 0; row < 4; row++){
      var py = row * 16;
      var joint = (row % 2) ? 40 : 88;
      [[0, joint], [joint, 128 - joint]].forEach(function(seg, k){
        ctx.fillStyle = woods[(row + k) % woods.length];
        ctx.fillRect(seg[0], py, seg[1], 16);
      });
      ctx.strokeStyle = "rgba(40,22,10,0.35)"; ctx.lineWidth = 1;
      for(var g = 0; g < 3; g++){
        var gy = py + 4 + g * 4 + rnd() * 2;
        ctx.beginPath(); ctx.moveTo(0, gy);
        ctx.bezierCurveTo(40, gy + rnd() * 3 - 1.5, 80, gy + rnd() * 3 - 1.5, 128, gy);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(25,12,5,0.75)";
      ctx.fillRect(0, py + 15, 128, 1.5);
      ctx.fillRect(joint, py, 1.5, 16);
      ctx.fillStyle = "rgba(255,220,170,0.08)";
      ctx.fillRect(0, py, 128, 1);
    }

  } else if(texId === "ladrillo"){
    cv.width = 64; cv.height = 32;
    ctx.fillStyle = "#3A2620"; ctx.fillRect(0, 0, 64, 32);
    var bricks = ["#8C3B2A", "#7C3324", "#97452F", "#843828"];
    for(var br = 0; br < 2; br++){
      var off = br ? 16 : 0;
      for(var bx = -32; bx < 64; bx += 32){
        var x0 = bx + off;
        ctx.fillStyle = bricks[(br * 3 + (bx + 32) / 32) % bricks.length];
        ctx.fillRect(x0 + 1, br * 16 + 1, 30, 14);
        ctx.fillStyle = "rgba(255,200,160,0.10)";
        ctx.fillRect(x0 + 1, br * 16 + 1, 30, 2);
        ctx.fillStyle = "rgba(0,0,0,0.18)";
        ctx.fillRect(x0 + 1, br * 16 + 13, 30, 2);
      }
    }

  } else if(texId === "baldosas"){
    cv.width = 48; cv.height = 48;
    ctx.fillStyle = "#D6CFC0"; ctx.fillRect(0, 0, 48, 48);
    ctx.fillStyle = "#8E897F";
    ctx.fillRect(0, 0, 24, 24); ctx.fillRect(24, 24, 24, 24);
    ctx.strokeStyle = "rgba(40,30,20,0.35)"; ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, 23, 23); ctx.strokeRect(24.5, 0.5, 23, 23);
    ctx.strokeRect(0.5, 24.5, 23, 23); ctx.strokeRect(24.5, 24.5, 23, 23);

  } else if(texId === "musgo"){
    cv.width = 64; cv.height = 64;
    ctx.fillStyle = "#2E5A2B"; ctx.fillRect(0, 0, 64, 64);
    var greens = ["#3C6E35", "#264A23", "#4A7F3F", "#1F3D1D", "#35652F"];
    for(var m = 0; m < 70; m++){
      ctx.fillStyle = greens[m % greens.length];
      ctx.beginPath();
      ctx.arc(rnd() * 64, rnd() * 64, 1.5 + rnd() * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(190,230,140,0.25)";
    for(var d = 0; d < 25; d++) ctx.fillRect(rnd() * 64, rnd() * 64, 1.5, 1.5);

  } else if(texId === "alfombra"){
    cv.width = 48; cv.height = 48;
    ctx.fillStyle = "#8A3A46"; ctx.fillRect(0, 0, 48, 48);
    ctx.strokeStyle = "rgba(255,215,170,0.16)"; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(24, 0); ctx.lineTo(48, 24); ctx.lineTo(24, 48); ctx.lineTo(0, 24); ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = "rgba(255,215,170,0.14)";
    ctx.beginPath(); ctx.arc(24, 24, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.06)";
    for(var f = 0; f < 48; f += 3) ctx.fillRect(0, f, 48, 1);

  } else if(texId === "piedra"){
    cv.width = 64; cv.height = 64;
    ctx.fillStyle = "#2E2E2E"; ctx.fillRect(0, 0, 64, 64);
    var stones = ["#6A6A68", "#5E5E5C", "#737270", "#646361"];
    for(var sr = 0; sr < 2; sr++){
      for(var sx = -32; sx < 64; sx += 32){
        var x1 = sx + (sr ? 16 : 0);
        ctx.fillStyle = stones[(sr + (sx + 32) / 32) % stones.length];
        ctx.fillRect(x1 + 1.5, sr * 32 + 1.5, 29, 29);
      }
    }
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    for(var sp = 0; sp < 40; sp++) ctx.fillRect(rnd() * 64, rnd() * 64, 1.5, 1.5);

  } else if(texId === "arcano"){
    cv.width = 64; cv.height = 64;
    ctx.fillStyle = "#29224C"; ctx.fillRect(0, 0, 64, 64);
    ctx.strokeStyle = "rgba(190,170,255,0.25)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(32, 32, 24, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(32, 32, 14, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(32, 4); ctx.lineTo(32, 60); ctx.moveTo(4, 32); ctx.lineTo(60, 32); ctx.stroke();

  } else {
    cv.width = 32; cv.height = 32;
    ctx.fillStyle = "#3A2E26"; ctx.fillRect(0, 0, 32, 32);
  }

  _houseTextureCache[key] = cv;
  return cv;
}

function inferRoomTexture(r){
  if(!r) return "madera";
  if(r.texture) return r.texture;
  var name = (r.name || "").toLowerCase();
  var type = (r.room_type || "").toLowerCase();

  if(type === "cocina" || name.includes("cocina") || name.includes("fogón") || name.includes("caldero")) return "baldosas";
  if(type === "biblioteca" || name.includes("biblioteca") || name.includes("arcana") || name.includes("mágic")) return "arcano";
  if(name.includes("botánic") || name.includes("cherk") || name.includes("musgo") || name.includes("invernadero")) return "musgo";
  if(type === "bodega" || name.includes("bodega") || name.includes("veneno") || name.includes("sótano") || type === "taller" || name.includes("armería")) return "piedra";
  if(name.includes("scarleth") || name.includes("derek") || type === "habitacion_personal" || name.includes("aposentos")) return "alfombra";
  if(type === "escaleras") return "piedra";
  if(type === "salon" || name.includes("salón") || name.includes("hogar")) return "ladrillo";
  return "madera";
}

function getRoomItemCount(r){
  if(!r) return 0;
  var count = 0;
  if(Array.isArray(r.furniture)){
    r.furniture.forEach(function(f){
      if(Array.isArray(f.items)) count += f.items.length;
    });
  }
  if(typeof r.items === "number") count = Math.max(count, r.items);
  return count;
}

function getHouseFloors(){
  if(Array.isArray(houseState.floors) && houseState.floors.length > 0){
    return houseState.floors;
  }
  // Plantas guardadas en la casa (nombre y sitio extra de cada una); vacío = las de siempre
  if(houseState.house && Array.isArray(houseState.house.floors) && houseState.house.floors.length > 0){
    return houseState.house.floors;
  }
  return [
    { id: 1, name: "Planta 1", sub: "Principal" },
    { id: 2, name: "Planta 2", sub: "Aposentos" },
    { id: 3, name: "Sótano", sub: "Bodega" }
  ];
}

function isRoomOnFloor(room, targetFloor){
  var rf = room ? room.floor : 1;
  if(rf === targetFloor) return true;
  if((targetFloor === 1 || targetFloor === "1" || targetFloor === "p1") && (rf === 1 || rf === "1" || rf === "p1")) return true;
  if((targetFloor === 2 || targetFloor === "2" || targetFloor === "p2") && (rf === 2 || rf === "2" || rf === "p2")) return true;
  if((targetFloor === 3 || targetFloor === "3" || targetFloor === "sotano") && (rf === 3 || rf === "3" || rf === "sotano")) return true;
  return String(rf) === String(targetFloor);
}

function addHouseFloor(name){
  if(!houseState.floors || houseState.floors.length === 0){
    houseState.floors = getHouseFloors();
  }
  var nextId = houseState.floors.length + 1;
  houseState.floors.push({ id: nextId, name: name, sub: "Ampliación" });
  houseState.activeFloor = nextId;
  saveHouseFloors(houseState.floors);
  renderHouseView();
  if(typeof showToast === "function") showToast("Planta '" + name + "' añadida a la casa.", "success");
}

// Guarda la lista de plantas (con su sitio extra) en la casa: solo el máster puede escribirla
function saveHouseFloors(floors){
  houseState.floors = null;
  if(!houseState.house) houseState.house = {};
  houseState.house.floors = floors;
  saveHouseLocalData();
  if(typeof supabaseClient === "undefined" || !supabaseClient || !houseState.house.id || !navigator.onLine) return;
  supabaseClient.from("house").update({ floors: floors, updated_at: new Date().toISOString() })
    .eq("id", houseState.house.id)
    .then(function(res){
      if(res && res.error) console.warn("Aviso guardando las plantas de La Casa:", res.error.message || res.error);
    });
  if(typeof realtimeChannel !== "undefined" && realtimeChannel){
    try {
      realtimeChannel.send({
        type: "broadcast",
        event: "house_settings_update",
        payload: { room_editors: houseRoomEditors(), floors: floors }
      }).catch(function(){});
    } catch(e){}
  }
}

// Casillas que ocupan las estancias de una planta (más su sitio extra en modo Editar)
function getHouseFloorCellExtent(floorId, withArea){
  var e = null;
  (houseState.rooms || []).forEach(function(r){
    if(!isRoomOnFloor(r, floorId)) return;
    var x0 = r.pos_x || 0, y0 = r.pos_y || 0;
    var x1 = x0 + Math.max(1, r.width || 2), y1 = y0 + Math.max(1, r.height || 2);
    if(!e) e = { x0: x0, y0: y0, x1: x1, y1: y1 };
    else { e.x0 = Math.min(e.x0, x0); e.y0 = Math.min(e.y0, y0); e.x1 = Math.max(e.x1, x1); e.y1 = Math.max(e.y1, y1); }
  });
  if(withArea){
    var fl = getHouseFloors().find(function(f){ return isRoomOnFloor({ floor: floorId }, f.id); });
    var a = fl && fl.area;
    if(a && typeof a.x0 === "number"){
      if(!e) e = { x0: a.x0, y0: a.y0, x1: a.x1, y1: a.y1 };
      else { e.x0 = Math.min(e.x0, a.x0); e.y0 = Math.min(e.y0, a.y0); e.x1 = Math.max(e.x1, a.x1); e.y1 = Math.max(e.y1, a.y1); }
    }
  }
  return e;
}

// "Ampliar planta": una fila o columna más por el lado elegido; "fit" quita el sitio vacío
function expandHouseFloor(side){
  if(!canUserEditPlan() || !(typeof isGM === "function" && isGM())) return;
  var curFloor = houseState.activeFloor || 1;
  var e = getHouseFloorCellExtent(curFloor, true) || { x0: 0, y0: 0, x1: 4, y1: 4 };
  if(side === "left") e.x0 -= 1;
  else if(side === "right") e.x1 += 1;
  else if(side === "up") e.y0 -= 1;
  else if(side === "down") e.y1 += 1;
  var floors = JSON.parse(JSON.stringify(getHouseFloors()));
  var fl = floors.find(function(f){ return isRoomOnFloor({ floor: curFloor }, f.id); });
  if(!fl) return;
  if(side === "fit") delete fl.area;
  else fl.area = e;
  saveHouseFloors(floors);
  initOrRenderHouseKonvaStage();
  if(side === "fit" && typeof showToast === "function") showToast("Planta ajustada a sus estancias.", "success");
}

// Primer hueco libre de la planta para una estancia nueva; si no cabe, a la derecha de todo
function findFreeHouseRoomSpot(floorId, w, h){
  var e = getHouseFloorCellExtent(floorId, true);
  if(!e) return { x: 0, y: 0 };
  var rooms = (houseState.rooms || []).filter(function(r){ return isRoomOnFloor(r, floorId); });
  function free(x, y){
    return !rooms.some(function(o){
      var ox = o.pos_x || 0, oy = o.pos_y || 0;
      return x < ox + Math.max(1, o.width || 2) && x + w > ox && y < oy + Math.max(1, o.height || 2) && y + h > oy;
    });
  }
  for(var y = e.y0; y + h <= e.y1; y++){
    for(var x = e.x0; x + w <= e.x1; x++){
      if(free(x, y)) return { x: x, y: y };
    }
  }
  return { x: e.x1, y: e.y0 };
}

/* ---- CONTROLADOR DEL ESCENARIO KONVA ---- */
var houseKonvaStage = null;
var houseKonvaLayer = null;
var houseKonvaTransformer = null;
var houseKonvaGridSnap = 40;
var houseKonvaZoom = 1.0;
var houseKonvaSelectedGroup = null;
var houseKonvaPanning = false;
var houseKonvaPanStart = { x: 0, y: 0 };
var houseKonvaStageStart = { x: 0, y: 0 };

var HOUSE_CELL_PX = 40;

// Posición y tamaño en píxeles calculados SIEMPRE desde las casillas guardadas (pos_x, pos_y, width, height),
// para que todos los dispositivos vean el mismo plano y no haya solapes por tamaños mínimos.
function syncRoomPixelRect(r){
  r.x = (r.pos_x || 0) * HOUSE_CELL_PX + HOUSE_CELL_PX;
  r.y = (r.pos_y || 0) * HOUSE_CELL_PX + HOUSE_CELL_PX;
  r.w = Math.max(1, r.width || 2) * HOUSE_CELL_PX;
  r.h = Math.max(1, r.height || 2) * HOUSE_CELL_PX;
}

function getHouseFloorBounds(){
  var curFloor = houseState.activeFloor || 1;
  var isEdit = !!houseState.editMode && canUserEditPlan();
  var e = getHouseFloorCellExtent(curFloor, isEdit);
  if(!e) return null;
  // En modo Editar, una casilla de margen alrededor: soltar una estancia ahí amplía la planta
  if(isEdit){ e.x0 -= 1; e.y0 -= 1; e.x1 += 1; e.y1 += 1; }
  var C = HOUSE_CELL_PX;
  return { minX: (e.x0 + 1) * C, minY: (e.y0 + 1) * C, maxX: (e.x1 + 1) * C, maxY: (e.y1 + 1) * C };
}

// Alto del lienzo según la forma de la casa, para que en el móvil no quede hueco vacío
function getHouseIdealStageHeight(width){
  var b = getHouseFloorBounds();
  if(!b) return 320;
  var pad = 48;
  var ratio = (b.maxY - b.minY + pad) / (b.maxX - b.minX + pad);
  var minH = houseState.editMode ? 460 : 260;
  return Math.round(Math.max(minH, Math.min(640, width * ratio)));
}

function initOrRenderHouseKonvaStage(){
  if(typeof Konva === "undefined"){
    console.warn("Konva.js aún no está disponible. Reintentando...");
    setTimeout(function(){
      if(typeof Konva !== "undefined"){
        initOrRenderHouseKonvaStage();
      }
    }, 200);
    return;
  }
  var wrap = document.getElementById("canvasWrap");
  var container = document.getElementById("stage-container");
  if(!wrap || !container) return;

  var containerWidth = wrap.clientWidth || 1000;
  var containerHeight = getHouseIdealStageHeight(containerWidth);
  container.style.height = containerHeight + "px";

  // Si el escenario ya existe y sigue vivo en el DOM
  if(houseKonvaStage && houseKonvaStage.container() && document.body.contains(houseKonvaStage.container())){
    houseKonvaStage.width(containerWidth);
    houseKonvaStage.height(containerHeight);
    zoomFitHouse();
    renderKonvaRooms();
    return;
  }

  if(houseKonvaStage){
    try { houseKonvaStage.destroy(); } catch(e){}
    houseKonvaStage = null;
  }

  container.innerHTML = "";
  houseKonvaStage = new Konva.Stage({
    container: "stage-container",
    width: containerWidth,
    height: containerHeight,
    draggable: false
  });

  houseKonvaLayer = new Konva.Layer();
  houseKonvaStage.add(houseKonvaLayer);

  houseKonvaTransformer = new Konva.Transformer({
    rotateEnabled: false,
    enabledAnchors: ["top-left", "top-right", "bottom-left", "bottom-right", "top-center", "bottom-center", "middle-left", "middle-right"],
    boundBoxFunc: function(oldBox, newBox) {
      if (Math.abs(newBox.width) < 40 || Math.abs(newBox.height) < 40) {
        return oldBox;
      }
      return newBox;
    },
    anchorStroke: "#E5C07B",
    anchorFill: "#1F1610",
    anchorSize: 12,
    anchorCornerRadius: 3,
    borderStroke: "#DEC392",
    borderDash: [4, 4]
  });
  houseKonvaLayer.add(houseKonvaTransformer);

  // Observador de redimensionado responsivo
  if(window.ResizeObserver && !wrap._hasKonvaResizeObserver){
    wrap._hasKonvaResizeObserver = true;
    wrap._lastKonvaWidth = containerWidth;
    new ResizeObserver(function(){
      // En el siguiente fotograma: cambiar el alto dentro del observador provoca avisos de bucle
      requestAnimationFrame(function(){
      if(houseKonvaStage && wrap){
        var w = wrap.clientWidth;
        // Solo al cambiar el ancho (girar el móvil, redimensionar ventana)
        if(w > 0 && w !== wrap._lastKonvaWidth){
          wrap._lastKonvaWidth = w;
          var h = getHouseIdealStageHeight(w);
          container.style.height = h + "px";
          houseKonvaStage.width(w);
          houseKonvaStage.height(h);
          zoomFitHouse();
          renderKonvaRooms();
        }
      }
      });
    }).observe(wrap);
  }

  // Paneo (pan) arrastrando el fondo
  houseKonvaStage.on("mousedown touchstart", function(e){
    if(e.target === houseKonvaStage || (e.target && !e.target.listening())){
      if(!houseState.editMode) return;
      houseKonvaPanning = true;
      var pos = houseKonvaStage.getPointerPosition();
      if(pos){
        houseKonvaPanStart = { x: pos.x, y: pos.y };
        houseKonvaStageStart = { x: houseKonvaStage.x(), y: houseKonvaStage.y() };
      }
      deselectKonvaRoom();
    }
  });

  houseKonvaStage.on("mousemove touchmove", function(){
    if(!houseKonvaPanning) return;
    var pos = houseKonvaStage.getPointerPosition();
    if(!pos) return;
    var dx = pos.x - houseKonvaPanStart.x;
    var dy = pos.y - houseKonvaPanStart.y;
    houseKonvaStage.position({ x: houseKonvaStageStart.x + dx, y: houseKonvaStageStart.y + dy });
    houseKonvaStage.batchDraw();
  });

  houseKonvaStage.on("mouseup touchend", function(){
    houseKonvaPanning = false;
  });

  // Distinguir un toque de un deslizamiento del dedo (para no seleccionar al desplazar la página)
  houseKonvaStage.on("touchstart", function(e){
    var t = e.evt && e.evt.touches && e.evt.touches[0];
    houseKonvaTapStart = t ? { x: t.clientX, y: t.clientY } : null;
  });

  // En modo Ver, tocar fuera de las estancias cierra el panel
  houseKonvaStage.on("click tap", function(e){
    if(houseState.editMode || e.target !== houseKonvaStage || houseKonvaTapMoved(e)) return;
    deselectKonvaRoom();
  });

  // Zoom con rueda del ratón
  houseKonvaStage.on("wheel", function(e){
    e.evt.preventDefault();
    var scaleBy = 1.08;
    var oldScale = houseKonvaStage.scaleX();
    var ptr = houseKonvaStage.getPointerPosition();
    var newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    applyHouseKonvaZoom(newScale, ptr);
  });

  zoomFitHouse();
  renderKonvaRooms();
}

var houseKonvaDoorsGroup = null;
var houseKonvaTapStart = null;

function houseKonvaTapMoved(e){
  if(!e || e.type !== "tap" || !houseKonvaTapStart) return false;
  var t = e.evt && e.evt.changedTouches && e.evt.changedTouches[0];
  if(!t) return false;
  return Math.abs(t.clientX - houseKonvaTapStart.x) > 10 || Math.abs(t.clientY - houseKonvaTapStart.y) > 10;
}
var HOUSE_TOKEN_COLORS = ["#4FB3A9", "#E8879B", "#8E7CC3", "#E9C46A", "#6FA8DC", "#E07A5F", "#81B29A"];
var HOUSE_PASSAGE_TYPES = ["pasillo", "escaleras", "entrada"];

function getHouseTokenColor(name){
  var hsh = 0;
  for(var i = 0; i < name.length; i++) hsh = (hsh * 31 + name.charCodeAt(i)) >>> 0;
  return HOUSE_TOKEN_COLORS[hsh % HOUSE_TOKEN_COLORS.length];
}

function setKonvaNoPreventDefault(node){
  node.preventDefault(false);
  if(node.getChildren) node.getChildren().forEach(setKonvaNoPreventDefault);
}

// Puertas de madera donde una estancia comparte pared con un pasillo, escalera o entrada.
// La entrada tiene además una puerta al exterior en una pared libre.
function drawHouseDoors(rooms){
  var doors = new Konva.Group({ listening: false });
  var C = HOUSE_CELL_PX;
  function cell(r){
    return { x: r.pos_x || 0, y: r.pos_y || 0, w: Math.max(1, r.width || 2), h: Math.max(1, r.height || 2) };
  }
  function addDoor(cx, cy, horizontal){
    var len = C * 0.7, thick = 9;
    doors.add(new Konva.Rect({
      x: (cx + 1) * C - (horizontal ? len / 2 : thick / 2),
      y: (cy + 1) * C - (horizontal ? thick / 2 : len / 2),
      width: horizontal ? len : thick,
      height: horizontal ? thick : len,
      cornerRadius: 2,
      fill: "#C09257",
      stroke: "#4A2E14",
      strokeWidth: 1.5
    }));
  }
  for(var i = 0; i < rooms.length; i++){
    for(var j = i + 1; j < rooms.length; j++){
      var A = rooms[i], B = rooms[j];
      if(HOUSE_PASSAGE_TYPES.indexOf(A.room_type) === -1 && HOUSE_PASSAGE_TYPES.indexOf(B.room_type) === -1) continue;
      var a = cell(A), b = cell(B);
      var y0 = Math.max(a.y, b.y), y1 = Math.min(a.y + a.h, b.y + b.h);
      var x0 = Math.max(a.x, b.x), x1 = Math.min(a.x + a.w, b.x + b.w);
      if((a.x + a.w === b.x || b.x + b.w === a.x) && y1 - y0 >= 1){
        addDoor(a.x + a.w === b.x ? b.x : a.x, (y0 + y1) / 2, false);
      } else if((a.y + a.h === b.y || b.y + b.h === a.y) && x1 - x0 >= 1){
        addDoor((x0 + x1) / 2, a.y + a.h === b.y ? b.y : a.y, true);
      }
    }
  }
  rooms.forEach(function(R){
    if(R.room_type !== "entrada") return;
    var e = cell(R);
    function touches(side){
      return rooms.some(function(O){
        if(O === R) return false;
        var o = cell(O);
        if(side === "bottom") return o.y === e.y + e.h && o.x < e.x + e.w && o.x + o.w > e.x;
        if(side === "top") return o.y + o.h === e.y && o.x < e.x + e.w && o.x + o.w > e.x;
        if(side === "left") return o.x + o.w === e.x && o.y < e.y + e.h && o.y + o.h > e.y;
        return o.x === e.x + e.w && o.y < e.y + e.h && o.y + o.h > e.y;
      });
    }
    if(!touches("bottom")) addDoor(e.x + e.w / 2, e.y + e.h, true);
    else if(!touches("left")) addDoor(e.x, e.y + e.h / 2, false);
    else if(!touches("right")) addDoor(e.x + e.w, e.y + e.h / 2, false);
    else if(!touches("top")) addDoor(e.x + e.w / 2, e.y, true);
  });
  return doors;
}

function renderKonvaRooms(){
  if(!houseKonvaLayer || !houseKonvaStage || !document.getElementById("canvasWrap")) return;

  // Sacar el transformador antes de vaciar la capa: si se destruye pierde sus tiradores de tamaño
  houseKonvaTransformer.remove();
  houseKonvaLayer.destroyChildren();
  houseKonvaLayer.add(houseKonvaTransformer);

  var allRooms = houseState.rooms || [];
  var curFloor = houseState.activeFloor || 1;
  var rooms = allRooms.filter(function(r){ return isRoomOnFloor(r, curFloor); });
  var isEdit = !!houseState.editMode && canUserEditPlan();

  // En modo Editar: solar de la planta con su rejilla (incluye el sitio extra y una casilla de margen)
  var bounds = getHouseFloorBounds();
  if(bounds && isEdit){
    var solar = new Konva.Group({ listening: false });
    solar.add(new Konva.Rect({
      x: bounds.minX, y: bounds.minY,
      width: bounds.maxX - bounds.minX, height: bounds.maxY - bounds.minY,
      fill: "rgba(212,175,55,0.04)",
      stroke: "rgba(212,175,55,0.45)", strokeWidth: 2, dash: [8, 6]
    }));
    for(var gx = bounds.minX + HOUSE_CELL_PX; gx < bounds.maxX; gx += HOUSE_CELL_PX){
      solar.add(new Konva.Line({ points: [gx, bounds.minY, gx, bounds.maxY], stroke: "rgba(212,175,55,0.12)", strokeWidth: 1 }));
    }
    for(var gy = bounds.minY + HOUSE_CELL_PX; gy < bounds.maxY; gy += HOUSE_CELL_PX){
      solar.add(new Konva.Line({ points: [bounds.minX, gy, bounds.maxX, gy], stroke: "rgba(212,175,55,0.12)", strokeWidth: 1 }));
    }
    houseKonvaLayer.add(solar);
  }

  // Muro exterior con la forma de las estancias (unión de rectángulos): primero el borde y la sombra,
  // después el relleno un poco más pequeño, que tapa los bordes que quedan por dentro
  if(rooms.length > 0){
    var outline = new Konva.Group({ listening: false });
    var fillPass = new Konva.Group({ listening: false });
    rooms.forEach(function(r){
      syncRoomPixelRect(r);
      outline.add(new Konva.Rect({
        x: r.x - 14, y: r.y - 14, width: r.w + 28, height: r.h + 28,
        cornerRadius: 8,
        fill: "#3B342E",
        stroke: "#1A120D", strokeWidth: 6,
        shadowColor: "black", shadowBlur: 24, shadowOpacity: 0.6, shadowOffsetY: 8
      }));
      fillPass.add(new Konva.Rect({
        x: r.x - 11, y: r.y - 11, width: r.w + 22, height: r.h + 22,
        cornerRadius: 6,
        fill: "#3B342E"
      }));
    });
    houseKonvaLayer.add(outline, fillPass);
  }

  rooms.forEach(function(r){
    syncRoomPixelRect(r);
    var canGeom = isEdit && canUserEditRoomGeometry(r);

    var group = new Konva.Group({
      x: r.x,
      y: r.y,
      draggable: canGeom
    });

    var texCanvas = getRoomTexturePattern(r.texture || inferRoomTexture(r), r.color);
    var isSel = (houseState.selectedRoomId === r.id);
    // u = 1 píxel de pantalla en unidades del plano: textos y fichas mantienen tamaño legible con cualquier zoom
    var u = 1 / (houseKonvaStage.scaleX() || 1);
    var inset = 7 * u;

    // 1. Suelo con textura y paredes gruesas
    var bgRect = new Konva.Rect({
      width: r.w,
      height: r.h,
      fillPatternImage: texCanvas,
      fillPatternRepeat: "repeat",
      stroke: "#17110D",
      strokeWidth: 6
    });

    // Sombra interior suave junto a las paredes
    var innerShade = new Konva.Rect({
      x: 3, y: 3,
      width: Math.max(0, r.w - 6), height: Math.max(0, r.h - 6),
      stroke: "rgba(0,0,0,0.28)",
      strokeWidth: 4,
      listening: false
    });

    group.add(bgRect, innerShade);

    // 2. Mobiliario: solo en modo Editar (en Ver se deja el suelo limpio)
    if(isEdit){
      var allItems = (r.furniture || []).concat(r.decor || []);
      // Alfombras primero, para que queden debajo de los muebles
      allItems = allItems.filter(function(it){ return getHouseItemLayer(it) === "suelo"; })
        .concat(allItems.filter(function(it){ return getHouseItemLayer(it) !== "suelo"; }));
      var konvaGrid = getRoomFurnitureGrid(r);
      var roomCols = konvaGrid.cols;
      var roomRows = konvaGrid.rows;
      var cellW = r.w / roomCols;
      var cellH = Math.max(7, (r.h - 36) / roomRows);

      allItems.forEach(function(item){
        var iw = Math.max(1, item.w || 1);
        var ih = Math.max(1, item.h || 1);
        var px = Math.min(r.w - 18, (item.pos_x || 0) * cellW + 2);
        var py = Math.min(r.h - 18, 22 + (item.pos_y || 0) * cellH);
        var pw = Math.max(12, Math.min(r.w - px - 3, iw * cellW - 3));
        var ph = Math.max(10, Math.min(r.h - py - 18, ih * cellH - 2));

        var itemBox = new Konva.Rect({
          x: px, y: py,
          width: pw, height: ph,
          cornerRadius: 3,
          fill: item.items ? "rgba(42, 30, 20, 0.72)" : "rgba(22, 28, 36, 0.65)",
          stroke: item.items ? "rgba(212, 175, 55, 0.55)" : "rgba(148, 163, 184, 0.4)",
          strokeWidth: 1
        });

        // El dibujo encaja en la caja sin deformarse
        var artScale = Math.min(pw / iw, ph / ih);
        var aw = iw * artScale, ah = ih * artScale;
        var itemArt = new Konva.Image({
          x: px + (pw - aw) / 2, y: py + (ph - ah) / 2,
          width: aw, height: ah,
          image: getHouseItemArtImage(r, item, iw, ih, Math.min(cellW, cellH)),
          listening: false
        });

        group.add(itemBox, itemArt);
      });
    }

    // 3. Nombre en pastilla oscura semitransparente (legible sobre cualquier textura)
    var icon = r.icon || getRoomTypeIcon(r.room_type);
    var fs = 15 * u;
    var innerW = r.w - inset * 2;
    var innerH = r.h - inset * 2;
    var fullText = (icon ? icon + " " : "") + (r.name || "Estancia");
    var probe = new Konva.Text({ text: fullText, fontFamily: "Georgia, serif", fontStyle: "bold", fontSize: fs, padding: 6 * u });
    // Estancias estrechas y alargadas (pasillos): nombre en vertical
    var vertical = (r.h >= r.w * 1.8) && probe.width() > innerW;
    var maxW = vertical ? innerH : innerW;
    var maxH = vertical ? innerW : innerH * 0.62;
    var iconOnly = maxW < fs * 3.2 || maxH < fs * 1.6;
    if(iconOnly) vertical = false;

    var label = new Konva.Label({ x: inset, y: vertical ? r.h - inset : inset, rotation: vertical ? -90 : 0, listening: false });
    label.add(new Konva.Tag({
      fill: "rgba(16,11,8,0.82)",
      stroke: "rgba(222,195,146,0.45)",
      strokeWidth: 1 * u,
      cornerRadius: 7 * u
    }));
    var nameText = new Konva.Text({
      text: iconOnly ? (icon || "•") : fullText,
      fontFamily: "Georgia, serif",
      fontStyle: "bold",
      fontSize: vertical ? fs * 0.86 : fs,
      lineHeight: 1.15,
      fill: "#F3EADB",
      padding: 6 * u
    });
    if(!iconOnly && nameText.width() > maxW){
      nameText.width(maxW);
      nameText.wrap("word");
    }
    // Antes de cortar con "…", se reduce un poco la letra (mínimo 75 %)
    var minFs = nameText.fontSize() * 0.75;
    while(!iconOnly && nameText.height() > maxH && nameText.fontSize() > minFs){
      nameText.fontSize(nameText.fontSize() - 0.5 * u);
      nameText.height("auto");
    }
    if(!iconOnly && nameText.height() > maxH){
      nameText.height(maxH);
      nameText.ellipsis(true);
    }
    label.add(nameText);
    if(iconOnly){
      label.position({ x: (r.w - nameText.width()) / 2, y: (r.h - nameText.height()) / 2 });
    }
    group.add(label);

    // 4. Objetos del baúl (abajo a la izquierda)
    var itemCount = getRoomItemCount(r);
    var bfs = 12 * u;
    var labelBottom = vertical ? 0 : inset + nameText.height();
    if(itemCount > 0 && !vertical && !iconOnly && (r.h - labelBottom) > bfs * 2.6 + inset){
      var badge = new Konva.Label({ x: inset, listening: false });
      badge.add(new Konva.Tag({ fill: "rgba(16,11,8,0.82)", cornerRadius: 6 * u }));
      var badgeText = new Konva.Text({ text: "📦 " + itemCount, fontFamily: "Georgia, serif", fontStyle: "bold", fontSize: bfs, fill: "#DEC392", padding: 5 * u });
      badge.add(badgeText);
      badge.y(r.h - inset - badgeText.height());
      group.add(badge);
    }

    // 5. Ficha redonda del dueño (abajo a la derecha)
    var owner = getRoomOwnerInfo(r.owner_character_id);
    if(owner && owner.name){
      var tokR = Math.min(13 * u, r.w / 4, r.h / 4);
      var tokColor = getHouseTokenColor(owner.name);
      var tok = new Konva.Group({ x: r.w - inset - tokR, y: r.h - inset - tokR, listening: false });
      tok.add(new Konva.Circle({
        radius: tokR,
        fill: tokColor,
        stroke: "#F3EADB",
        strokeWidth: 2 * u,
        shadowColor: "black", shadowBlur: 6 * u, shadowOpacity: 0.6
      }));
      tok.add(new Konva.Text({
        text: owner.name.charAt(0).toUpperCase(),
        x: -tokR, y: -tokR,
        width: tokR * 2, height: tokR * 2,
        align: "center", verticalAlign: "middle",
        fontFamily: "Georgia, serif", fontStyle: "bold",
        fontSize: tokR * 1.15,
        fill: "#14100C"
      }));
      group.add(tok);
    }

    // 6. Borde dorado con brillo de la estancia seleccionada
    var halo = new Konva.Rect({
      name: "selHalo",
      width: r.w, height: r.h,
      stroke: "#E2B65A",
      strokeWidth: 5,
      shadowColor: "#E2B65A",
      shadowBlur: 22,
      shadowOpacity: 0.9,
      visible: isSel,
      listening: false
    });

    // 7. Tirador de redimensionado visible en modo edición
    var resizeHint = new Konva.Rect({
      x: r.w - 16,
      y: r.h - 16,
      width: 12, height: 12,
      cornerRadius: 2,
      stroke: "rgba(176,141,87,0.65)",
      strokeWidth: 1.5,
      visible: canGeom
    });

    group.add(halo, resizeHint);

    // En modo Ver, tocar el plano no bloquea el desplazamiento de la página
    if(!canGeom) setKonvaNoPreventDefault(group);

    // Eventos de arrastre
    group.on("dragmove", function(){
      if(houseKonvaGridSnap > 0){
        group.x(Math.round(group.x() / houseKonvaGridSnap) * houseKonvaGridSnap);
        group.y(Math.round(group.y() / houseKonvaGridSnap) * houseKonvaGridSnap);
      }
    });

    group.on("dragend", function(){
      r.x = group.x();
      r.y = group.y();
      r.pos_x = Math.round((r.x - 40) / 40);
      r.pos_y = Math.round((r.y - 40) / 40);
      saveRoomChangesToRemoteAndBroadcast(r, "geometry");
      updateQuickRoomBar(r);
      // Si se ha soltado en el margen, el solar de la planta crece con ella
      renderKonvaRooms();
    });

    // Clic / Tap
    group.on("click tap", function(e){
      e.cancelBubble = true;
      if(houseKonvaTapMoved(e)) return;
      selectKonvaRoom(group, r);
    });

    // Doble clic / toque para renombrar
    group.on("dblclick dbltap", function(e){
      e.cancelBubble = true;
      if(canGeom) startKonvaRename(group, r);
    });

    // Transformación de tamaño libre y fluido con Transformer
    group.on("transformend", function(){
      var rawW = Math.abs(bgRect.width() * group.scaleX());
      var rawH = Math.abs(bgRect.height() * group.scaleY());
      var newW = houseKonvaGridSnap > 0 ? Math.max(40, Math.round(rawW / houseKonvaGridSnap) * houseKonvaGridSnap) : Math.max(40, Math.round(rawW));
      var newH = houseKonvaGridSnap > 0 ? Math.max(40, Math.round(rawH / houseKonvaGridSnap) * houseKonvaGridSnap) : Math.max(40, Math.round(rawH));
      var newX = houseKonvaGridSnap > 0 ? Math.round(group.x() / houseKonvaGridSnap) * houseKonvaGridSnap : Math.round(group.x());
      var newY = houseKonvaGridSnap > 0 ? Math.round(group.y() / houseKonvaGridSnap) * houseKonvaGridSnap : Math.round(group.y());

      group.scaleX(1); group.scaleY(1);
      group.x(newX); group.y(newY);

      r.w = newW; r.h = newH; r.x = newX; r.y = newY;
      r.width = Math.max(1, Math.round(newW / 40));
      r.height = Math.max(1, Math.round(newH / 40));
      r.pos_x = Math.round((r.x - 40) / 40);
      r.pos_y = Math.round((r.y - 40) / 40);

      saveRoomChangesToRemoteAndBroadcast(r, "geometry");
      updateQuickRoomBar(r);
      renderKonvaRooms();
    });

    houseKonvaLayer.add(group);
  });

  houseKonvaDoorsGroup = drawHouseDoors(rooms);
  houseKonvaLayer.add(houseKonvaDoorsGroup);
  houseKonvaTransformer.moveToTop();

  // Re-adjuntar transformador si había selección
  if(houseState.selectedRoomId){
    var selR = allRooms.find(function(x){ return x.id === houseState.selectedRoomId; });
    if(selR && isRoomOnFloor(selR, curFloor)){
      var groups = houseKonvaLayer.getChildren().filter(function(n){ return n.getClassName() === "Group"; });
      var found = groups.find(function(g){ return g.x() === selR.x && g.y() === selR.y; });
      if(found) selectKonvaRoom(found, selR);
      else deselectKonvaRoom();
    } else {
      deselectKonvaRoom();
    }
  } else {
    deselectKonvaRoom();
  }

  houseKonvaLayer.draw();
}

function setKonvaSelectionHalo(group){
  if(!houseKonvaLayer) return;
  houseKonvaLayer.find(".selHalo").forEach(function(h){ h.visible(false); });
  if(group){
    var halo = group.findOne(".selHalo");
    if(halo) halo.visible(true);
    group.moveToTop();
    if(houseKonvaDoorsGroup) houseKonvaDoorsGroup.moveToTop();
    if(houseKonvaTransformer) houseKonvaTransformer.moveToTop();
  }
}

function selectKonvaRoom(group, r){
  houseKonvaSelectedGroup = group;
  houseState.selectedRoomId = r.id;
  setKonvaSelectionHalo(group);
  var canGeom = !!houseState.editMode && canUserEditRoomGeometry(r);
  if(houseKonvaTransformer) houseKonvaTransformer.nodes(canGeom ? [group] : []);

  var delBtn = document.getElementById("delRoomBtn");
  if(delBtn) delBtn.disabled = false;

  if(canGeom){
    updateQuickRoomBar(r);
  } else {
    var qBar = document.getElementById("roomQuickBar");
    if(qBar) qBar.classList.remove("visible");
  }

  houseState.showRoomDetail = false;
  var insp = document.getElementById("houseInspectorContainer");
  if(insp){
    insp.innerHTML = renderRoomPanel(r.id);
    if(!houseState.editMode && insp.scrollIntoView){
      setTimeout(function(){ insp.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, 30);
    }
  }

  if(houseKonvaLayer && document.getElementById("canvasWrap")) houseKonvaLayer.draw();
}

function deselectKonvaRoom(){
  houseKonvaSelectedGroup = null;
  houseState.selectedRoomId = null;
  setKonvaSelectionHalo(null);
  if(houseKonvaTransformer) houseKonvaTransformer.nodes([]);

  var delBtn = document.getElementById("delRoomBtn");
  if(delBtn) delBtn.disabled = true;

  var bar = document.getElementById("roomQuickBar");
  if(bar) bar.classList.remove("visible");

  closeAllHousePopovers();

  var insp = document.getElementById("houseInspectorContainer");
  if(insp){
    insp.innerHTML = '<div style="font-size:0.9rem;color:var(--ink-faint);text-align:center;padding:14px;font-style:italic;">💡 Toca una estancia del plano para ver su baúl y de quién es.</div>';
  }

  if(houseKonvaLayer && document.getElementById("canvasWrap")) houseKonvaLayer.draw();
}

function updateQuickRoomBar(r){
  var bar = document.getElementById("roomQuickBar");
  if(!bar) return;
  bar.classList.add("visible");
  var nameEl = document.getElementById("rqRoomName");
  if(nameEl) nameEl.textContent = (r.icon ? r.icon + " " : "") + r.name;
  var texObj = HOUSE_TEXTURES.find(function(t){ return t.id === (r.texture || inferRoomTexture(r)); });
  var texLbl = document.getElementById("rqTexLabel");
  if(texLbl) texLbl.textContent = texObj ? texObj.name : "Madera";
  var wLbl = document.getElementById("rqWidthLabel");
  if(wLbl) wLbl.textContent = Math.max(1, r.width || Math.round((r.w || 160) / 40));
  var hLbl = document.getElementById("rqHeightLabel");
  if(hLbl) hLbl.textContent = Math.max(1, r.height || Math.round((r.h || 120) / 40));
}

function quickStepRoomSize(axis, delta){
  var r = (houseState.rooms || []).find(function(x){ return x.id === houseState.selectedRoomId; });
  if(!r) return;

  if(axis === "w"){
    var curW = r.w || (r.width ? r.width * 40 : 160);
    var newW = Math.max(40, curW + delta);
    r.w = newW;
    r.width = Math.max(1, Math.round(newW / 40));
  } else if(axis === "h"){
    var curH = r.h || (r.height ? r.height * 40 : 120);
    var newH = Math.max(40, curH + delta);
    r.h = newH;
    r.height = Math.max(1, Math.round(newH / 40));
  }

  saveRoomChangesToRemoteAndBroadcast(r, "geometry");
  renderKonvaRooms();
  updateQuickRoomBar(r);
}

function startKonvaRename(group, r){
  if(!houseKonvaStage) return;
  var stageBox = houseKonvaStage.container().getBoundingClientRect();
  var scale = houseKonvaStage.scaleX();
  var stageX = houseKonvaStage.x();
  var stageY = houseKonvaStage.y();

  var input = document.createElement("input");
  input.className = "room-rename-input";
  input.value = r.name;

  var left = stageBox.left + stageX + (group.x() + 10) * scale;
  var top = stageBox.top + stageY + (group.y() + 8) * scale;
  var width = Math.max(140, ((r.w || 220) - 20) * scale);

  input.style.left = left + "px";
  input.style.top = top + "px";
  input.style.width = width + "px";

  document.body.appendChild(input);
  input.focus(); input.select();

  function commit(){
    var val = input.value.trim();
    if(val && val !== r.name){
      r.name = val;
      saveRoomChangesToRemoteAndBroadcast(r, "name");
    }
    if(document.body.contains(input)) document.body.removeChild(input);
    renderKonvaRooms();
    updateQuickRoomBar(r);
  }

  input.addEventListener("blur", commit);
  input.addEventListener("keydown", function(e){
    if(e.key === "Enter") input.blur();
    if(e.key === "Escape"){
      if(document.body.contains(input)) document.body.removeChild(input);
    }
  });
}

function zoomFitHouse(){
  if(!houseKonvaStage || !document.getElementById("canvasWrap")) return;
  var b = getHouseFloorBounds();
  if(!b){
    houseKonvaStage.position({ x: 0, y: 0 });
    applyHouseKonvaZoom(1.0);
    return;
  }

  var minX = b.minX, minY = b.minY, maxX = b.maxX, maxY = b.maxY;

  var boundW = maxX - minX + 48;
  var boundH = maxY - minY + 48;
  var stageW = houseKonvaStage.width();
  var stageH = houseKonvaStage.height();

  var fitZoom = Math.min(1.5, Math.min(stageW / boundW, stageH / boundH));
  fitZoom = Math.max(0.15, fitZoom);

  var centerX = (minX + maxX) / 2;
  var centerY = (minY + maxY) / 2;

  houseKonvaStage.scale({ x: fitZoom, y: fitZoom });
  houseKonvaStage.position({
    x: stageW / 2 - centerX * fitZoom,
    y: stageH / 2 - centerY * fitZoom
  });
  houseKonvaZoom = fitZoom;
  var zLbl = document.getElementById("zoomLabel");
  if(zLbl) zLbl.textContent = Math.round(houseKonvaZoom * 100) + "%";
  houseKonvaStage.batchDraw();
}

function applyHouseKonvaZoom(newZoom, centerPos){
  if(!houseKonvaStage || !document.getElementById("canvasWrap")) return;
  newZoom = Math.max(0.15, Math.min(2.5, newZoom));
  var oldZoom = houseKonvaStage.scaleX();

  var mousePos = centerPos || { x: houseKonvaStage.width() / 2, y: houseKonvaStage.height() / 2 };
  var worldPos = {
    x: (mousePos.x - houseKonvaStage.x()) / oldZoom,
    y: (mousePos.y - houseKonvaStage.y()) / oldZoom
  };

  houseKonvaStage.scale({ x: newZoom, y: newZoom });
  var newStageX = mousePos.x - worldPos.x * newZoom;
  var newStageY = mousePos.y - worldPos.y * newZoom;
  houseKonvaStage.position({ x: newStageX, y: newStageY });

  houseKonvaZoom = newZoom;
  var zLbl = document.getElementById("zoomLabel");
  if(zLbl) zLbl.textContent = Math.round(houseKonvaZoom * 100) + "%";
  houseKonvaStage.batchDraw();
}

function quickAddRoomPreset(preset){
  var allRooms = houseState.rooms || [];
  var curFloor = houseState.activeFloor || 1;
  var rooms = allRooms.filter(function(r){ return isRoomOnFloor(r, curFloor); });

  var nextX = 60, nextY = 60;
  if(rooms.length > 0){
    // Primer hueco libre de la planta (con su sitio extra); si no hay, al lado de la casa
    var spot = findFreeHouseRoomSpot(curFloor, Math.round((preset.w || 220) / 40), Math.round((preset.h || 160) / 40));
    nextX = (spot.x + 1) * 40;
    nextY = (spot.y + 1) * 40;
  }

  var newRoom = {
    id: "r" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36),
    house_id: houseState.house ? houseState.house.id : "h0000000-0000-0000-0000-000000000001",
    name: preset.name || "Nueva Estancia",
    room_type: preset.type || "otro",
    icon: preset.icon || "🚪",
    color: preset.color || "teal",
    texture: preset.texture || "madera",
    floor: curFloor,
    level: 1,
    description: "",
    x: nextX,
    y: nextY,
    w: preset.w || 220,
    h: preset.h || 160,
    pos_x: Math.round((nextX - 40) / 40),
    pos_y: Math.round((nextY - 40) / 40),
    width: Math.round((preset.w || 220) / 40),
    height: Math.round((preset.h || 160) / 40),
    furniture: [],
    decor: []
  };

  houseState.rooms = houseState.rooms || [];
  houseState.rooms.push(newRoom);
  saveRoomChangesToRemoteAndBroadcast(newRoom, "create");
  renderKonvaRooms();

  var groups = houseKonvaLayer.getChildren().filter(function(n){ return n.getClassName() === "Group"; });
  var lastGroup = groups[groups.length - 1];
  if(lastGroup) selectKonvaRoom(lastGroup, newRoom);

  if(typeof showToast === "function") showToast("Estancia '" + newRoom.name + "' creada.", "success");
}

async function quickDeleteSelectedRoom(){
  if(!houseState.selectedRoomId) return;
  var r = (houseState.rooms || []).find(function(x){ return x.id === houseState.selectedRoomId; });
  if(!r) return;

  if(!(await deleteHouseRoomAction(r.id))) return;
  deselectKonvaRoom();
  renderKonvaRooms();
}

function quickDuplicateSelectedRoom(){
  if(!houseState.selectedRoomId) return;
  var r = (houseState.rooms || []).find(function(x){ return x.id === houseState.selectedRoomId; });
  if(!r) return;

  var copy = JSON.parse(JSON.stringify(r));
  copy.id = "r" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
  copy.name = copy.name + " (Copia)";
  copy.x = (r.x || 40) + 30;
  copy.y = (r.y || 40) + 30;
  copy.pos_x = Math.round((copy.x - 40) / 40);
  copy.pos_y = Math.round((copy.y - 40) / 40);

  houseState.rooms.push(copy);
  saveRoomChangesToRemoteAndBroadcast(copy, "create");
  renderKonvaRooms();

  var groups = houseKonvaLayer.getChildren().filter(function(n){ return n.getClassName() === "Group"; });
  var lastGroup = groups[groups.length - 1];
  if(lastGroup) selectKonvaRoom(lastGroup, copy);

  if(typeof showToast === "function") showToast("Estancia duplicada.", "success");
}

function toggleKonvaGridSnap(){
  houseKonvaGridSnap = (houseKonvaGridSnap > 0) ? 0 : 40;
  var btn = document.getElementById("gridSnapBtn");
  if(btn){
    btn.innerHTML = (houseKonvaGridSnap > 0) ? "🧲 Rejilla: casilla" : "🖐️ Rejilla: Libre";
    btn.classList.toggle("active", houseKonvaGridSnap > 0);
  }
  if(typeof showToast === "function"){
    showToast(houseKonvaGridSnap > 0 ? "Rejilla magnética activada (20px)" : "Movimiento libre activado", "info");
  }
}

function toggleTexturePopover(btn){
  var pop = document.getElementById("popoverTexture");
  if(!pop) return;
  var isVis = pop.classList.contains("visible");
  closeAllHousePopovers();
  if(!isVis && houseState.selectedRoomId){
    var selR = (houseState.rooms || []).find(function(x){ return x.id === houseState.selectedRoomId; });
    var curTex = selR ? (selR.texture || inferRoomTexture(selR)) : "madera";
    var grid = document.getElementById("textureGrid");
    if(grid){
      grid.innerHTML = "";
      HOUSE_TEXTURES.forEach(function(t){
        var b = document.createElement("button");
        b.className = "house-texture-chip" + (curTex === t.id ? " active" : "");
        b.innerHTML = '<span style="font-size:1.3rem;">' + ((typeof icono === "function" && typeof CASA_ICONOS !== "undefined" && CASA_ICONOS.suelos[t.id]) ? icono(CASA_ICONOS.suelos[t.id], { tam: "m", emoji: t.icon }) : t.icon) + '</span><span style="font-weight:600;">' + t.name + '</span>';
        b.addEventListener("click", function(){
          if(selR){
            selR.texture = t.id;
            saveRoomChangesToRemoteAndBroadcast(selR, "texture");
            renderKonvaRooms();
            updateQuickRoomBar(selR);
            if(typeof showToast === "function") showToast("Suelo cambiado a " + t.name, "info");
          }
          closeAllHousePopovers();
        });
        grid.appendChild(b);
      });
    }
    positionHousePopover(pop, btn);
  }
}

function toggleColorPopover(btn){
  var pop = document.getElementById("popoverColor");
  if(!pop) return;
  var isVis = pop.classList.contains("visible");
  closeAllHousePopovers();
  if(!isVis && houseState.selectedRoomId){
    var selR = (houseState.rooms || []).find(function(x){ return x.id === houseState.selectedRoomId; });
    var grid = document.getElementById("colorGrid");
    if(grid){
      grid.innerHTML = "";
      Object.keys(HOUSE_COLOR_MAP).forEach(function(ckey){
        var dot = document.createElement("div");
        dot.className = "color-circle" + ((selR && selR.color === ckey) ? " active" : "");
        dot.style.background = HOUSE_COLOR_MAP[ckey];
        dot.style.width = "28px"; dot.style.height = "28px"; dot.style.borderRadius = "50%";
        dot.style.border = "2px solid rgba(255,255,255,0.2)"; dot.style.cursor = "pointer";
        dot.addEventListener("click", function(){
          if(selR){
            selR.color = ckey;
            saveRoomChangesToRemoteAndBroadcast(selR, "color");
            renderKonvaRooms();
          }
          closeAllHousePopovers();
        });
        grid.appendChild(dot);
      });
    }
    positionHousePopover(pop, btn);
  }
}

function toggleIconPopover(btn){
  var pop = document.getElementById("popoverIcon");
  if(!pop) return;
  var isVis = pop.classList.contains("visible");
  closeAllHousePopovers();
  if(!isVis && houseState.selectedRoomId){
    var selR = (houseState.rooms || []).find(function(x){ return x.id === houseState.selectedRoomId; });
    var grid = document.getElementById("iconGrid");
    if(grid){
      grid.innerHTML = "";
      HOUSE_ICONS.forEach(function(ic){
        var chip = document.createElement("button");
        chip.className = "icon-chip";
        chip.style.width = "34px"; chip.style.height = "34px"; chip.style.fontSize = "1.1rem";
        chip.style.background = "var(--bg-card)"; chip.style.border = "1px solid var(--line)";
        chip.style.borderRadius = "6px"; chip.style.cursor = "pointer";
        chip.innerHTML = (typeof iconoDeEmoji === "function") ? iconoDeEmoji(ic, "casa", { tam: "m" }) : ic;
        chip.addEventListener("click", function(){
          if(selR){
            selR.icon = ic;
            saveRoomChangesToRemoteAndBroadcast(selR, "icon");
            renderKonvaRooms();
            updateQuickRoomBar(selR);
          }
          closeAllHousePopovers();
        });
        grid.appendChild(chip);
      });
    }
    positionHousePopover(pop, btn);
  }
}

function toggleFloorPopover(btn){
  var pop = document.getElementById("popoverFloor");
  if(!pop) return;
  var isVis = pop.classList.contains("visible");
  closeAllHousePopovers();
  if(!isVis && houseState.selectedRoomId){
    var selR = (houseState.rooms || []).find(function(x){ return x.id === houseState.selectedRoomId; });
    var list = document.getElementById("floorMoveList");
    if(list && selR){
      list.innerHTML = "";
      var floors = getHouseFloors();
      floors.forEach(function(fl){
        if(isRoomOnFloor(selR, fl.id)) return;
        var b = document.createElement("button");
        b.className = "house-tool-btn";
        b.style.width = "100%";
        b.style.justifyContent = "flex-start";
        b.innerHTML = "🏢 <b>" + esc(fl.name) + "</b> (" + esc(fl.sub || "") + ")";
        b.addEventListener("click", function(){
          selR.floor = fl.id;
          saveRoomChangesToRemoteAndBroadcast(selR, "floor");
          houseState.activeFloor = fl.id;
          renderHouseView();
          closeAllHousePopovers();
          if(typeof showToast === "function") showToast("Estancia trasladada a " + fl.name, "info");
        });
        list.appendChild(b);
      });
    }
    positionHousePopover(pop, btn);
  }
}

function positionHousePopover(pop, btn){
  if(!pop || !btn) return;
  var rect = btn.getBoundingClientRect();
  pop.style.display = "flex";
  pop.classList.add("visible");
  // Medidas reales del menú (en el móvil es más alto por los botones de 44 px)
  var popW = Math.min(pop.offsetWidth || 280, window.innerWidth - 24);
  var popH = pop.offsetHeight || 280;
  var left = Math.min(window.innerWidth - popW - 12, Math.max(12, rect.left));
  var top = rect.bottom + 8;
  if(top + popH > window.innerHeight - 10){
    top = (rect.top - popH - 8 >= 10) ? rect.top - popH - 8 : Math.max(10, window.innerHeight - popH - 10);
  }
  pop.style.top = top + "px";
  pop.style.left = left + "px";
}

function closeAllHousePopovers(){
  document.querySelectorAll(".popover-menu, .house-popover-menu").forEach(function(m){
    m.classList.remove("visible");
    m.style.display = "none";
  });
}

function openHousePresetModal(){
  var modalId = "housePresetModalBackdrop";
  var existing = document.getElementById(modalId);
  if(existing) existing.remove();

  var modal = document.createElement("div");
  modal.id = modalId;
  modal.className = "house-modal-overlay";
  modal.addEventListener("click", function(ev){ if(ev.target === modal) modal.remove(); });

  var gridHtml = '';
  HOUSE_PRESETS.forEach(function(pr, idx){
    gridHtml += '<div class="house-preset-card" data-action="select-preset-room" data-preset-idx="' + idx + '">' +
      '<div class="house-preset-icon">' + houseIconoPreset(pr) + '</div>' +
      '<div>' +
      '  <div class="house-preset-name">' + esc(pr.name) + '</div>' +
      '  <div class="house-preset-sub">' + pr.w + ' x ' + pr.h + '</div>' +
      '</div>' +
      '</div>';
  });

  modal.innerHTML = '<div class="house-modal-box">' +
    '  <div class="house-modal-header">' +
    '    <h3 class="house-modal-title">Elige una estancia para añadir</h3>' +
    '    <button class="house-perk-close" data-action="close-preset-room-modal" aria-label="Cerrar">&times;</button>' +
    '  </div>' +
    '  <div class="house-preset-list">' + gridHtml + '</div>' +
    '</div>';

  document.body.appendChild(modal);
}

// keepItemsCopy: guarda tal cual la copia de objetos que llevan los muebles (la de la importación)
function saveRoomChangesToRemoteAndBroadcast(room, fieldName, keepItemsCopy){
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
      furniture: keepItemsCopy ? (room.furniture || []) : stripFurnitureItems(room.furniture),
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
          return supabaseClient.from("house_rooms")
            .update(payload)
            .eq("id", room.id)
            .select()
            .then(function(res2){
              if(res2.error || !res2.data || !res2.data.length) notifyHouseSaveFailed();
            });
        }
      })
      .catch(function(err){
        console.warn("Error de conexión al persistir estancia:", err);
        notifyHouseSaveFailed();
      });
  }
}

// Baúles: en Supabase los objetos van en la tabla house_items (por estancia y mueble), no dentro
// de los muebles, para que mover o cambiar muebles no pise lo guardado.
// Si la nube rechaza un guardado de La Casa, el cambio solo queda en este dispositivo: avisar
var lastHouseSaveFailToast = 0;
function notifyHouseSaveFailed(){
  if(!houseState.remote) return;
  var el = document.getElementById("canvaSaveState");
  if(el){
    el.className = "cs-save is-error";
    el.textContent = "✕ Sin guardar";
  }
  if(Date.now() - lastHouseSaveFailToast < 5000) return;
  lastHouseSaveFailToast = Date.now();
  if(typeof showToast === "function") showToast("La Casa: el cambio no se ha guardado en la nube, solo en este dispositivo.", "error");
}

function isHouseRemote(){
  return !!(houseState.remote && typeof supabaseClient !== "undefined" && supabaseClient && navigator.onLine);
}

function stripFurnitureItems(list){
  return (Array.isArray(list) ? list : []).map(function(f){
    var copy = Object.assign({}, f);
    delete copy.items;
    return copy;
  });
}

// Los muebles que llegan sin objetos (de la base o de otro dispositivo) conservan los que ya había
function keepFurnitureItems(oldList, newList){
  if(!Array.isArray(newList)) return newList;
  var prev = {};
  (oldList || []).forEach(function(f){ if(f && f.id) prev[f.id] = f.items; });
  return newList.map(function(f){
    if(f && !Array.isArray(f.items) && Array.isArray(prev[f.id])) return Object.assign({}, f, { items: prev[f.id] });
    return f;
  });
}

function houseItemFromRow(row){
  return { id: row.id, name: row.name, qty: row.qty || 1, notes: row.notes || "" };
}

function findHouseFurniture(roomId, furnitureId){
  var r = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!r || !Array.isArray(r.furniture)) return null;
  return r.furniture.find(function(f){ return f.id === furnitureId; }) || null;
}

async function fetchHouseItemsRemote(){
  var res = await supabaseClient.from("house_items").select("*")
    .order("sort", { ascending: true }).order("created_at", { ascending: true });
  if(res.error || !res.data) return;
  var byKey = {};
  res.data.forEach(function(row){
    var k = row.room_id + "|" + row.furniture_id;
    (byKey[k] = byKey[k] || []).push(houseItemFromRow(row));
  });
  (houseState.rooms || []).forEach(function(r){
    (r.furniture || []).forEach(function(f){
      f.items = byKey[r.id + "|" + f.id] || [];
    });
  });
}

function handleRemoteHouseItemChange(payload){
  if(!payload) return;
  var row = (payload.eventType !== "DELETE" && payload.new && payload.new.id) ? payload.new : null;
  var itemId = row ? row.id : (payload.old && payload.old.id);
  if(!itemId) return;

  var oldFur = null, oldIdx = -1;
  (houseState.rooms || []).forEach(function(r){
    (r.furniture || []).forEach(function(f){
      if(oldFur || !Array.isArray(f.items)) return;
      var idx = f.items.findIndex(function(it){ return it.id === itemId; });
      if(idx >= 0){ oldFur = f; oldIdx = idx; }
    });
  });
  if(oldFur) oldFur.items.splice(oldIdx, 1);

  if(row){
    var fur = findHouseFurniture(row.room_id, row.furniture_id);
    if(fur){
      if(!Array.isArray(fur.items)) fur.items = [];
      if(fur === oldFur) fur.items.splice(oldIdx, 0, houseItemFromRow(row));
      else fur.items.push(houseItemFromRow(row));
    }
  }

  saveHouseLocalData();
  if(houseState.active) renderHouseView();
}

// Subir a la nube la Casa guardada en este dispositivo: solo para el máster, solo si la nube no
// tiene Casa en la campaña y solo se pregunta una vez por dispositivo (si dice que no, no vuelve a preguntar).
var HOUSE_IMPORT_FLAG = pkey("krysalis_house_import_asked");
var houseImportRunning = false;

function buildHouseImportPayload(parsed){
  // Dueños guardados con el id local de la ficha: se traducen al id de la base, que es el que mira RLS
  var dbIds = {};
  ((typeof state !== "undefined" && state && state.characters) || []).forEach(function(c){
    if(c && c.id && c.db_id) dbIds[c.id] = c.db_id;
  });
  var rooms = migrateRoomsTo16Cols(parsed.rooms).map(function(r){
    var copy = Object.assign({}, r);
    if(copy.owner_character_id && dbIds[copy.owner_character_id]) copy.owner_character_id = dbIds[copy.owner_character_id];
    return copy;
  });
  var house = Object.assign({}, parsed.house);
  if(!Array.isArray(house.floors) && Array.isArray(houseState.floors)) house.floors = houseState.floors;
  return { house: house, rooms: rooms, upgrades: parsed.upgrades || [], events: parsed.events || [] };
}

function downloadHouseBackup(raw, stamp){
  try {
    var blob = new Blob([raw], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "krysalis_casa_" + stamp + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch(e){
    console.warn("No se pudo descargar la copia de La Casa:", e);
  }
}

async function maybeOfferHouseImport(){
  if(houseImportRunning) return;
  if(typeof isGM !== "function" || !isGM()) return;
  if(typeof currentUser === "undefined" || !currentUser) return;
  if(typeof supabaseClient === "undefined" || !supabaseClient || !navigator.onLine) return;

  var raw = null;
  try {
    if(localStorage.getItem(HOUSE_IMPORT_FLAG)) return;
    raw = localStorage.getItem(pkey("krysalis_house_beta_v1"));
  } catch(e){ return; }
  if(!raw) return;
  var parsed = null;
  try { parsed = JSON.parse(raw); } catch(e){ return; }
  if(!parsed || !parsed.house || !Array.isArray(parsed.rooms)) return;

  houseImportRunning = true;
  try {
    var existing = await supabaseClient.from("house").select("id").eq("campaign_id", HOUSE_CAMPAIGN_ID).maybeSingle();
    // Si falla la consulta no se pregunta ahora; si ya hay Casa en la nube, nunca se toca
    if(existing.error || existing.data) return;
    if(!isGM() || !currentUser) return;

    var nItems = 0;
    parsed.rooms.forEach(function(r){
      (Array.isArray(r.furniture) ? r.furniture : []).forEach(function(f){
        if(Array.isArray(f.items)) nItems += f.items.length;
      });
    });
    // Se marca antes de preguntar: así no se repite aunque la página se recargue con el aviso abierto
    try { localStorage.setItem(HOUSE_IMPORT_FLAG, "no"); } catch(e){}
    var ok = confirm("Tienes una Casa guardada en este dispositivo (" + parsed.rooms.length + " estancias, " + nItems + " objetos en baúles). ¿Subirla a la nube para todos?");
    if(!ok) return;

    // Copia por si acaso: en este dispositivo y descargada en un .json
    var stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 13).replace("T", "_");
    try { localStorage.setItem(pkey("krysalis_house_backup_" + stamp), raw); } catch(e){}
    downloadHouseBackup(raw, stamp);

    var res = await supabaseClient.rpc("import_house", { p_data: buildHouseImportPayload(parsed), p_campaign_id: HOUSE_CAMPAIGN_ID });
    if(res.error || !res.data || !res.data.success){
      console.warn("Error subiendo La Casa:", res.error);
      if(typeof showToast === "function") showToast("No se ha podido subir La Casa: " + ((res.error && res.error.message) || "error desconocido"), "warning");
      try { localStorage.removeItem(HOUSE_IMPORT_FLAG); } catch(e){}
      return;
    }
    try { localStorage.setItem(HOUSE_IMPORT_FLAG, "done"); } catch(e){}
    if(typeof showToast === "function") showToast("La Casa ya está en la nube (" + res.data.rooms + " estancias, " + res.data.items + " objetos).", "success");

    if(typeof realtimeChannel !== "undefined" && realtimeChannel && typeof realtimeChannel.send === "function"){
      try { realtimeChannel.send({ type: "broadcast", event: "house_general_update", payload: {} }).catch(function(){}); } catch(e){}
    }
    await fetchHouseRemoteData();
    if(houseState.active) renderHouseView();
  } catch(err){
    console.warn("Error preparando la subida de La Casa:", err);
  } finally {
    houseImportRunning = false;
  }
}

function handleRemoteHouseRoomUpdate(payload){
  if(!payload) return;
  var rId = payload.id || payload.roomId;
  if(!rId) return;

  var room = (houseState.rooms || []).find(function(x){ return x.id === rId; });
  if(!room) return;

  // Si en este dispositivo hay muebles sin guardar en esa estancia, se quedan los de aquí (se guardan enseguida)
  var keepLocalLayout = (canvaPendingSaveRoomId === rId);
  if(payload.furniture !== undefined && !keepLocalLayout) room.furniture = keepFurnitureItems(room.furniture, payload.furniture);
  if(payload.decor !== undefined && !keepLocalLayout) room.decor = payload.decor;
  if(payload.color !== undefined) room.color = payload.color;
  if(payload.name !== undefined) room.name = payload.name;
  if(payload.pos_x !== undefined) room.pos_x = payload.pos_x;
  if(payload.pos_y !== undefined) room.pos_y = payload.pos_y;
  if(payload.width !== undefined) room.width = payload.width;
  if(payload.height !== undefined) room.height = payload.height;
  if(payload.floor !== undefined) room.floor = payload.floor;
  if(payload.level !== undefined) room.level = payload.level;
  if(payload.room_type !== undefined) room.room_type = payload.room_type;
  normalizeRoomLayout(room);

  saveHouseLocalData();
  if(houseState.active){
    // Con el editor abierto se repinta solo el editor, y nunca a mitad de un arrastre (al soltar se repinta)
    if(houseState.studioRoomId && document.getElementById("canvaStudioInner")){
      if(!canvaActiveDrag) refreshCanvaStudio();
    } else {
      renderHouseView();
    }
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
      if(!houseState._settingsListener){
        houseState._settingsListener = true;
        realtimeChannel.on("broadcast", { event: "house_settings_update" }, function(msg){
          if(!msg || !msg.payload || !houseState.house) return;
          if(Array.isArray(msg.payload.room_editors)) houseState.house.room_editors = msg.payload.room_editors;
          if(Array.isArray(msg.payload.floors)){
            houseState.floors = null;
            houseState.house.floors = msg.payload.floors;
          }
          if(!canUserEditPlan()) houseState.editMode = false;
          saveHouseLocalData();
          if(houseState.active) renderHouseView();
        });
      }
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
      supabaseClient.channel("realtime_house_rooms", { config: { private: true } })
        .on("postgres_changes", { event: "*", schema: "public", table: "house_rooms" }, function(payload){
          if(payload && payload.new && payload.new.id){
            handleRemoteHouseRoomUpdate(payload.new);
          }
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "house_items" }, function(payload){
          handleRemoteHouseItemChange(payload);
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

// Baúles: el máster todos; en estancias sin dueño, cualquiera; en habitaciones con dueño, solo su dueño.
// Igual que la política RLS de house_items (la protección real).
function canUserUseChest(room){
  if(!room) return false;
  if(!room.owner_character_id) return true;
  if(typeof isGM === "function" && isGM()) return true;
  if(typeof currentUser !== "undefined" && currentUser){
    // Con sesión manda el dueño real de la ficha (owner_id), no la ficha que se tenga abierta
    return ((state && state.characters) || []).some(function(c){
      return (c.id === room.owner_character_id || c.db_id === room.owner_character_id) && c.owner_id === currentUser.id;
    });
  }
  return canUserEditRoom(room);
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

// Permisos del plano: el máster siempre puede editar; un jugador solo mueve y cambia el tamaño de SU
// habitación, y solo si el máster le ha dado permiso (house.room_editors, ids de ficha). Nombre, muebles,
// color y decoración solo el máster. Es control de interfaz: la protección real va en RLS y el trigger de la 047.
function houseRoomEditors(){
  return (houseState.house && Array.isArray(houseState.house.room_editors)) ? houseState.house.room_editors : [];
}

function canUserEditPlan(){
  if(typeof isGM === "function" && isGM()) return true;
  return (houseState.rooms || []).some(function(r){ return canUserEditRoomGeometry(r); });
}

function canUserEditRoomGeometry(room){
  if(typeof isGM === "function" && isGM()) return true;
  return !!room && !!room.owner_character_id && houseRoomEditors().indexOf(room.owner_character_id) !== -1 && canUserUseChest(room);
}

function canUserDecorateRoom(room){
  return !!room && (typeof isGM === "function" && isGM());
}

function setHouseRoomEditor(charId, val){
  if(!houseState.house || !charId) return;
  var list = houseRoomEditors().filter(function(id){ return id !== charId; });
  if(val) list.push(charId);
  houseState.house.room_editors = list;
  saveHouseLocalData();

  if(typeof realtimeChannel !== "undefined" && realtimeChannel && typeof realtimeChannel.send === "function"){
    try {
      realtimeChannel.send({
        type: "broadcast",
        event: "house_settings_update",
        payload: { room_editors: list }
      }).catch(function(){});
    } catch(e){}
  }

  if(typeof supabaseClient !== "undefined" && supabaseClient && houseState.house.id && navigator.onLine){
    supabaseClient.from("house")
      .update({ room_editors: list })
      .eq("id", houseState.house.id)
      .then(function(res){
        if(res && res.error){
          console.warn("Aviso guardando permiso de edición de La Casa:", res.error.message || res.error);
          if(typeof showToast === "function") showToast("Permiso aplicado en directo, pero no se ha guardado (falta la migración 047).", "warning");
        }
      });
  }
  renderHouseView();
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

// Dibujo de la estancia por tipo; sin dibujo, el emoji de siempre
function houseIconoTipo(type, tam){
  if(typeof icono !== "function" || typeof CASA_ICONOS === "undefined") return getRoomTypeIcon(type);
  return icono(CASA_ICONOS.estancias[type] || CASA_ICONOS.estancias.vacia, { tam: tam || "s", emoji: getRoomTypeIcon(type) });
}

// Icono guardado en la estancia (emoji en la base, no se toca); sin icono propio, el del tipo
function houseIconoEstancia(icon, type, tam){
  if(icon && typeof iconoDeEmoji === "function") return iconoDeEmoji(icon, "casa", { tam: tam || "s" });
  if(icon) return esc(icon);
  return houseIconoTipo(type, tam);
}

function houseIconoPreset(pr){
  if(typeof iconoDeEmoji !== "function") return pr.icon;
  var d = iconoDeEmoji(pr.icon, "casa", { tam: "m" });
  return d.indexOf("<img") === 0 ? d : houseIconoTipo(pr.type, "m");
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
  { id: "puerta_batiente", name: "Puerta", oldName: "Puerta Batiente con Arco", category: "puertas", icon: "🚪", defaultW: 2, defaultH: 2, minW: 2, minH: 2, maxW: 4, maxH: 4, isDoor: true, defaultType: "puerta", desc: "Puerta de una hoja" },
  { id: "arco_paso", name: "Arco", oldName: "Arco de Paso Abierto", category: "puertas", icon: "⛩️", defaultW: 2, defaultH: 2, minW: 2, minH: 2, maxW: 4, maxH: 4, isDoor: true, defaultType: "arco", desc: "Paso abierto entre estancias" },
  { id: "puerta_doble", name: "Puerta doble", oldName: "Puerta Doble Señorial", category: "puertas", icon: "🚪🚪", defaultW: 4, defaultH: 2, minW: 2, minH: 2, maxW: 4, maxH: 4, isDoor: true, defaultType: "puerta", desc: "Puerta de dos hojas" },
  { id: "ventana", name: "Ventana", oldName: "Ventana con Vano de Luz", category: "puertas", icon: "🪟", defaultW: 2, defaultH: 2, minW: 2, minH: 2, maxW: 4, maxH: 2, isDoor: true, defaultType: "ventana", desc: "Ventana con marco de madera" },
  { id: "escaleras_subir", name: "Escalera de subida", oldName: "Escaleras (Subir Piso)", category: "puertas", icon: "🪜", defaultW: 2, defaultH: 4, minW: 2, minH: 2, maxW: 4, maxH: 6, isDoor: true, defaultType: "escaleras", desc: "Sube al piso de arriba" },
  { id: "escaleras_bajar", name: "Escalera de bajada", oldName: "Escaleras (Bajar Piso)", category: "puertas", icon: "🪜", defaultW: 2, defaultH: 4, minW: 2, minH: 2, maxW: 4, maxH: 6, isDoor: true, defaultType: "escaleras", desc: "Baja al piso de abajo" },
  { id: "entrada_porche", name: "Puerta principal", oldName: "Puerta Principal de Entrada", category: "puertas", icon: "🚪", defaultW: 2, defaultH: 2, minW: 2, minH: 2, maxW: 4, maxH: 4, isDoor: true, defaultType: "puerta", desc: "Entrada de la casa" },

  // 2. DESCANSO Y HABITACIÓN
  { id: "cama_individual", name: "Cama", oldName: "Cama Individual", category: "descanso", icon: "🛏️", defaultW: 2, defaultH: 4, minW: 2, minH: 4, maxW: 4, maxH: 6, isFurniture: true, defaultType: "cama", desc: "Cama de una plaza" },
  { id: "cama_matrimonio", name: "Cama doble", oldName: "Cama de Matrimonio / Dosel", category: "descanso", icon: "🛌", defaultW: 4, defaultH: 4, minW: 4, minH: 4, maxW: 6, maxH: 6, isFurniture: true, defaultType: "cama", desc: "Cama de dos plazas" },
  { id: "sillon_lectura", name: "Sillón", oldName: "Sillón Orejero de Reposo", category: "descanso", icon: "🛋️", defaultW: 2, defaultH: 2, minW: 2, minH: 2, maxW: 4, maxH: 4, isFurniture: true, defaultType: "sillon", desc: "Sillón tapizado" },

  // 3. MESAS Y ASIENTOS
  { id: "mesa_comedor", name: "Mesa", oldName: "Mesa de Roble con 4 Sillas", category: "mesas", icon: "🪵", defaultW: 4, defaultH: 4, minW: 2, minH: 2, maxW: 8, maxH: 6, isFurniture: true, defaultType: "mesa", desc: "Mesa con cuatro sillas" },
  { id: "escritorio", name: "Escritorio", oldName: "Escritorio de Estudio y Pergaminos", category: "mesas", icon: "📜", defaultW: 4, defaultH: 2, minW: 2, minH: 2, maxW: 6, maxH: 4, isFurniture: true, defaultType: "escritorio", desc: "Mesa de trabajo con silla" },
  { id: "mesa_alquimia", name: "Mesa de alquimia", oldName: "Mesa de Alquimia y Matraces", category: "mesas", icon: "🧪", defaultW: 4, defaultH: 2, minW: 2, minH: 2, maxW: 6, maxH: 4, isFurniture: true, defaultType: "mesa", desc: "Mesa con matraces" },

  // 4. ALMACENAJE (CON INVENTARIO)
  { id: "baul", name: "Baúl", oldName: "Baúl Reforzado de Viaje", category: "almacen", icon: "🧰", defaultW: 2, defaultH: 2, minW: 2, minH: 2, maxW: 4, maxH: 2, isFurniture: true, isStorage: true, defaultType: "baul", desc: "Para guardar cosas" },
  { id: "alacena", name: "Despensa", oldName: "Alacena Despensa de Víveres", category: "almacen", icon: "🗄️", defaultW: 4, defaultH: 2, minW: 2, minH: 2, maxW: 6, maxH: 4, isFurniture: true, isStorage: true, defaultType: "alacena", desc: "Para guardar comida" },
  { id: "armero", name: "Armero", oldName: "Armero de Guardia y Panoplia", category: "almacen", icon: "⚔️", defaultW: 4, defaultH: 2, minW: 2, minH: 2, maxW: 6, maxH: 2, isFurniture: true, isStorage: true, defaultType: "armero", desc: "Para guardar armas" },
  { id: "libreria", name: "Librería", oldName: "Librería de Grimorios Sapientes", category: "almacen", icon: "📚", defaultW: 4, defaultH: 2, minW: 2, minH: 2, maxW: 8, maxH: 2, isFurniture: true, isStorage: true, defaultType: "libreria", desc: "Estantes con libros" },

  // 5. COCINA Y FUEGO
  { id: "fogon_caldero", name: "Fogón", oldName: "Fogón con Caldero Errante", category: "cocina", icon: "🍳", defaultW: 2, defaultH: 2, minW: 2, minH: 2, maxW: 4, maxH: 4, isFurniture: true, defaultType: "cocina", desc: "Fogón con caldero" },
  { id: "chimenea", name: "Chimenea", oldName: "Chimenea de Piedra con Leña", category: "cocina", icon: "🔥", defaultW: 4, defaultH: 2, minW: 2, minH: 2, maxW: 6, maxH: 4, isFurniture: true, defaultType: "chimenea", desc: "Chimenea de piedra" },
  { id: "banco_trabajo", name: "Banco de trabajo", oldName: "Banco de Trabajo y Forja", category: "cocina", icon: "🔨", defaultW: 4, defaultH: 2, minW: 2, minH: 2, maxW: 6, maxH: 4, isFurniture: true, defaultType: "banco", desc: "Mesa con herramientas" },

  // 6. DECORACIÓN Y ALFOMBRAS
  { id: "alfombra_persa", name: "Alfombra", oldName: "Alfombra Persa Granate", category: "decoracion", icon: "🧶", defaultW: 4, defaultH: 4, minW: 2, minH: 2, maxW: 99, maxH: 99, isDecor: true, defaultType: "alfombra_persa", desc: "Alfombra con flecos" },
  { id: "alfombra_runica", name: "Alfombra rúnica", oldName: "Alfombra Rúnica Celestial", category: "decoracion", icon: "🔮", defaultW: 4, defaultH: 4, minW: 2, minH: 2, maxW: 99, maxH: 99, isDecor: true, defaultType: "alfombra_runica", desc: "Alfombra con runas" },
  { id: "piel_oso", name: "Piel de oso", oldName: "Piel de Oso Nórdico", category: "decoracion", icon: "🐻", defaultW: 4, defaultH: 2, minW: 2, minH: 2, maxW: 6, maxH: 4, isDecor: true, defaultType: "piel_oso", desc: "Alfombra de piel" },
  { id: "tapiz_pared", name: "Tapiz", oldName: "Tapiz Bordado del Mapa", category: "decoracion", icon: "🖼️", defaultW: 4, defaultH: 2, minW: 2, minH: 2, maxW: 6, maxH: 2, isDecor: true, defaultType: "cuadro", desc: "Tapiz de pared" },
  { id: "trofeo_caza", name: "Trofeo", oldName: "Trofeo de Cráneo de Bestia", category: "decoracion", icon: "💀", defaultW: 2, defaultH: 2, minW: 2, minH: 2, maxW: 2, maxH: 2, isDecor: true, defaultType: "trofeo", desc: "Cráneo de pared" },
  { id: "diana_tiro", name: "Diana", oldName: "Diana con Flechas", category: "decoracion", icon: "🎯", defaultW: 2, defaultH: 2, minW: 2, minH: 2, maxW: 2, maxH: 2, isDecor: true, defaultType: "diana", desc: "Diana con flechas" },
  { id: "barriles_reserva", name: "Barriles", oldName: "Barriles de Hidromiel Enana", category: "decoracion", icon: "🍺", defaultW: 4, defaultH: 2, minW: 2, minH: 2, maxW: 6, maxH: 4, isDecor: true, defaultType: "barriles", desc: "Barriles de madera" },
  { id: "planta_maceta", name: "Planta", oldName: "Planta Frondosa en Maceta", category: "decoracion", icon: "🌿", defaultW: 2, defaultH: 2, minW: 2, minH: 2, maxW: 4, maxH: 4, isDecor: true, defaultType: "planta", desc: "Planta en maceta" },
  { id: "setas_luminosas", name: "Setas", oldName: "Setas Bioluminiscentes", category: "decoracion", icon: "🍄", defaultW: 2, defaultH: 2, minW: 2, minH: 2, maxW: 4, maxH: 4, isDecor: true, defaultType: "setas", desc: "Setas que brillan" },
  { id: "bonsai_mistico", name: "Bonsái", oldName: "Bonsái Arcano Viviente", category: "decoracion", icon: "🪴", defaultW: 2, defaultH: 2, minW: 2, minH: 2, maxW: 2, maxH: 2, isDecor: true, defaultType: "bonsai", desc: "Árbol pequeño en maceta" },
  { id: "estante_pociones", name: "Estante de pociones", oldName: "Anaquel de Pociones y Viales", category: "decoracion", icon: "🧪", defaultW: 4, defaultH: 2, minW: 2, minH: 2, maxW: 6, maxH: 2, isDecor: true, defaultType: "pociones", desc: "Estante con frascos" },
  { id: "mesa_mapas", name: "Mesa de mapas", oldName: "Mesa Táctica de Cartografía", category: "decoracion", icon: "🗺️", defaultW: 4, defaultH: 2, minW: 2, minH: 2, maxW: 6, maxH: 4, isDecor: true, defaultType: "mapas", desc: "Mesa con planos" },
  { id: "reliquia_arcana", name: "Pedestal con gema", oldName: "Pedestal de Gema Radiante", category: "decoracion", icon: "💎", defaultW: 2, defaultH: 2, minW: 2, minH: 2, maxW: 2, maxH: 2, isDecor: true, defaultType: "reliquia", desc: "Columna con un cristal" },
  { id: "telarana", name: "Telaraña", oldName: "Telaraña Ancestral de Rincón", category: "decoracion", icon: "🕸️", defaultW: 2, defaultH: 2, minW: 2, minH: 2, maxW: 2, maxH: 2, isDecor: true, defaultType: "telarana", desc: "Telaraña de rincón" },

  // 7. ILUMINACIÓN
  { id: "candelabro", name: "Candelabro", oldName: "Candelabro Alto de Forja", category: "luces", icon: "🕯️", defaultW: 2, defaultH: 2, minW: 2, minH: 2, maxW: 2, maxH: 2, isDecor: true, defaultType: "candelabro", desc: "Candelabro de velas" },
  { id: "farol_pared", name: "Farol", oldName: "Farol de Aceite de Pared", category: "luces", icon: "🏮", defaultW: 2, defaultH: 2, minW: 2, minH: 2, maxW: 2, maxH: 2, isDecor: true, defaultType: "antorcha", desc: "Farol de pared" },
  { id: "brasero", name: "Brasero", oldName: "Brasero de Fuego Violeta", category: "luces", icon: "✨", defaultW: 2, defaultH: 2, minW: 2, minH: 2, maxW: 2, maxH: 2, isDecor: true, defaultType: "brasero", desc: "Brasero con ascuas" },
  { id: "chimenea_decor", name: "Chimenea grande", oldName: "Gran Chimenea de Piedra", category: "luces", icon: "🪵", defaultW: 4, defaultH: 2, minW: 2, minH: 2, maxW: 6, maxH: 4, isDecor: true, defaultType: "chimenea", desc: "Chimenea de piedra grande" }
];

var HOUSE_DECOR_CATALOG = [
  { type: "alfombra", icon: "🧶", label: "Alfombra", defaultW: 4, defaultH: 4 },
  { type: "alfombra_persa", icon: "🧶", label: "Alfombra persa", defaultW: 4, defaultH: 4 },
  { type: "alfombra_runica", icon: "🔮", label: "Alfombra rúnica", defaultW: 4, defaultH: 4 },
  { type: "piel_oso", icon: "🐻", label: "Piel de oso", defaultW: 4, defaultH: 2 },
  { type: "planta", icon: "🌿", label: "Planta", defaultW: 2, defaultH: 2 },
  { type: "setas", icon: "🍄", label: "Setas", defaultW: 2, defaultH: 2 },
  { type: "bonsai", icon: "🪴", label: "Bonsái", defaultW: 2, defaultH: 2 },
  { type: "vela", icon: "🕯️", label: "Vela", defaultW: 2, defaultH: 2 },
  { type: "candelabro", icon: "🕯️", label: "Candelabro", defaultW: 2, defaultH: 2 },
  { type: "antorcha", icon: "🔥", label: "Antorcha", defaultW: 2, defaultH: 2 },
  { type: "brasero", icon: "✨", label: "Brasero", defaultW: 2, defaultH: 2 },
  { type: "chimenea", icon: "🪵", label: "Chimenea", defaultW: 4, defaultH: 2 },
  { type: "cuadro", icon: "🖼️", label: "Tapiz", defaultW: 4, defaultH: 2 },
  { type: "trofeo", icon: "💀", label: "Trofeo", defaultW: 2, defaultH: 2 },
  { type: "diana", icon: "🎯", label: "Diana", defaultW: 2, defaultH: 2 },
  { type: "barriles", icon: "🍺", label: "Barriles", defaultW: 4, defaultH: 2 },
  { type: "pociones", icon: "🧪", label: "Estante de pociones", defaultW: 4, defaultH: 2 },
  { type: "mapas", icon: "🗺️", label: "Mesa de mapas", defaultW: 4, defaultH: 2 },
  { type: "reliquia", icon: "💎", label: "Pedestal con gema", defaultW: 2, defaultH: 2 },
  { type: "telarana", icon: "🕸️", label: "Telaraña", defaultW: 2, defaultH: 2 },
  { type: "cofre", icon: "📦", label: "Cofre", defaultW: 2, defaultH: 2 }
];

// Dibujo del mueble como imagen para el plano (Konva). Se guarda en caché por tipo, tamaño y giro.
var houseItemArtImageCache = {};
function getHouseItemArtImage(room, it, w, h, cellPx){
  var svg = drawHouseItemArt(room, it, w, h, it.rotation || 0, cellPx);
  var key = svg.length + ":" + getHouseItemArtType(it) + ":" + w + "x" + h + ":" + (it.rotation || 0) + ":" + (cellPx < 14 ? "s" : "d") + ":" + (it.id || "");
  var img = houseItemArtImageCache[key];
  if(!img){
    img = new Image();
    img.onload = function(){ if(houseKonvaStage) houseKonvaStage.batchDraw(); };
    // Con ancho y alto propios para que el navegador lo pinte nítido
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg.replace("<svg ", '<svg width="' + (w * 20) + '" height="' + (h * 20) + '" '));
    houseItemArtImageCache[key] = img;
  }
  return img;
}

// Envoltorio antiguo: dibujo de 1×1 casilla (lo usan las puertas del plano)
function getCanvaSvg(typeOrId, rotation){
  return drawHouseItemSVG(typeOrId, 1, 1, { rotation: rotation });
}

// Tipo para el dibujo: el id del catálogo distingue, p. ej., la mesa de alquimia de la mesa normal
function getHouseItemArtType(it){
  return (it && (it.asset_id || it.type || it.id)) || "";
}

// Color de la manta de las camas según el dueño de la habitación (fijo para cada dueño)
var HOUSE_OWNER_ART_COLORS = ["#3D6E60", "#8C252F", "#4A5A78", "#7A5F35", "#6B3A2A", "#2F5148", "#5E1820"];
function getRoomOwnerArtColor(room){
  var id = room && room.owner_character_id;
  if(!id) return null;
  var h = 0;
  for(var i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return HOUSE_OWNER_ART_COLORS[Math.abs(h) % HOUSE_OWNER_ART_COLORS.length];
}

// w y h llegan en subcasillas; el dibujo trabaja en casillas del plano
function drawHouseItemArt(room, it, w, h, rotation, cellPx){
  return drawHouseItemSVG(getHouseItemArtType(it), w / HOUSE_SUBCELLS, h / HOUSE_SUBCELLS, {
    rotation: rotation,
    cellPx: (typeof cellPx === "number") ? cellPx * HOUSE_SUBCELLS : cellPx,
    ownerColor: getRoomOwnerArtColor(room),
    seed: it.id || getHouseItemArtType(it),
    label: it.name || it.label || ""
  });
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
      if(rpcRes && rpcRes.error) console.warn("Fallo RPC add_house_progress, aplicando cálculo local:", rpcRes.error.message || rpcRes.error);
    } catch(errRpc){
      console.warn("Fallo RPC add_house_progress, aplicando cálculo local:", errRpc);
    }
    notifyHouseSaveFailed();
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
    var toggleOk = false;
    try {
      var toggleRes = await supabaseClient.rpc("toggle_house_upgrade", {
        p_upgrade_id: upgradeId,
        p_unlocked: upg.unlocked,
        p_actor_id: actorId
      });
      toggleOk = !toggleRes.error;
    } catch(e){}
    if(!toggleOk){
      try {
        var updRes = await supabaseClient.from("house_upgrades").update({ unlocked: upg.unlocked, updated_at: new Date().toISOString() }).eq("id", upgradeId).select();
        toggleOk = !updRes.error && updRes.data && updRes.data.length > 0;
      } catch(e2){}
    }
    if(!toggleOk) notifyHouseSaveFailed();
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
      var buffChanged = true;
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
      var lvlRes = await supabaseClient.from("house_upgrades").update({
        level: upg.level,
        bonus_value: upg.bonus_value,
        updated_at: new Date().toISOString()
      }).eq("id", upg.id).select();
      if(lvlRes.error || !lvlRes.data || !lvlRes.data.length) notifyHouseSaveFailed();
      // El buffo del compendio sube a la vez en la nube; antes solo cambiaba en este móvil
      else if(buffChanged && typeof pushSharedData === "function") pushSharedData({ buffCatalog: state.buffCatalog });
    } catch(e){
      notifyHouseSaveFailed();
    }
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

  if(!rotateHouseItem(room, fur)){ houseLayoutWarn("No hay sitio para girarlo."); return; }
  saveRoomChangesToRemoteAndBroadcast(room, "furniture");
  renderHouseView();
}

// FASE 4: Capa de Decoración Rápida
function rotateRoomDecor(roomId, decorId){
  var room = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!room || !Array.isArray(room.decor)) return;
  var dec = room.decor.find(function(d){ return d.id === decorId; });
  if(!dec) return;

  if(!rotateHouseItem(room, dec)){ houseLayoutWarn("No hay sitio para girarlo."); return; }
  saveRoomChangesToRemoteAndBroadcast(room, "decor");
  renderHouseView();
}

function addRoomDecor(roomId, decorType){
  var room = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!room) return;
  room.decor = room.decor || [];

  var cat = HOUSE_DECOR_CATALOG.find(function(c){ return c.type === decorType; });
  if(!cat) return;

  var newDec = {
    id: "dec_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    type: cat.type,
    icon: cat.icon,
    label: cat.label,
    w: cat.defaultW || 2,
    h: cat.defaultH || 2,
    pos_x: 0,
    pos_y: 0,
    rotation: 0,
    g: HOUSE_SUBCELLS
  };

  if(!placeNewHouseItem(room, newDec)){ houseLayoutWarn("No queda hueco libre en la estancia."); return; }

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
// REJILLA DE MUEBLES: una sola para el Estudio, el inspector, el plano y el arrastre
// ============================================================================
// Rejilla fina: HOUSE_SUBCELLS subcasillas por cada casilla del plano
var HOUSE_SUBCELLS = 2;
function getRoomFurnitureGrid(room){
  room = room || {};
  return {
    cols: Math.max(1, room.width || Math.round((room.w || 240) / 40) || 6) * HOUSE_SUBCELLS,
    rows: Math.max(1, room.height || Math.round((room.h || 160) / 40) || 4) * HOUSE_SUBCELLS
  };
}

// Rejilla de antes de la rejilla fina, solo para convertir los muebles guardados sin la marca g: 2
function getOldRoomFurnitureGrid(room){
  room = room || {};
  return {
    cols: Math.max(4, room.width || Math.round((room.w || 240) / 40) || 6),
    rows: Math.max(3, room.height || Math.round((room.h || 160) / 40) || 4)
  };
}

// Capas: alfombras y pieles van en el suelo y pueden quedar debajo de los muebles
function getHouseItemLayer(item){
  var t = String((item && (item.type || item.id)) || "").toLowerCase();
  return (t.indexOf("alfombra") === 0 || t === "piel_oso") ? "suelo" : "muebles";
}

function getHouseItemSize(item){
  return { w: Math.max(1, (item && item.w) || 1), h: Math.max(1, (item && item.h) || 1) };
}

function findRoomLayoutItem(room, itemId){
  var f = (room.furniture || []).find(function(x){ return x.id === itemId; });
  if(f) return { item: f, field: "furniture" };
  var d = (room.decor || []).find(function(x){ return x.id === itemId; });
  if(d) return { item: d, field: "decor" };
  return null;
}

// Puertas de una estancia, las mismas que dibuja el plano (drawHouseDoors): lado y centro, en casillas del plano
function getRoomDoorSpots(room){
  var floor = room.floor || 1;
  var rooms = (houseState.rooms || []).filter(function(o){ return isRoomOnFloor(o, floor); });
  function cell(r){
    return { x: r.pos_x || 0, y: r.pos_y || 0, w: Math.max(1, r.width || 2), h: Math.max(1, r.height || 2) };
  }
  var a = cell(room);
  var spots = [];
  rooms.forEach(function(O){
    if(O === room || O.id === room.id) return;
    if(HOUSE_PASSAGE_TYPES.indexOf(room.room_type) === -1 && HOUSE_PASSAGE_TYPES.indexOf(O.room_type) === -1) return;
    var b = cell(O);
    var y0 = Math.max(a.y, b.y), y1 = Math.min(a.y + a.h, b.y + b.h);
    var x0 = Math.max(a.x, b.x), x1 = Math.min(a.x + a.w, b.x + b.w);
    if((a.x + a.w === b.x || b.x + b.w === a.x) && y1 - y0 >= 1){
      spots.push({ side: a.x + a.w === b.x ? "right" : "left", at: (y0 + y1) / 2 - a.y });
    } else if((a.y + a.h === b.y || b.y + b.h === a.y) && x1 - x0 >= 1){
      spots.push({ side: a.y + a.h === b.y ? "bottom" : "top", at: (x0 + x1) / 2 - a.x });
    }
  });
  if(room.room_type === "entrada"){
    var touches = function(side){
      return rooms.some(function(O){
        if(O === room || O.id === room.id) return false;
        var o = cell(O);
        if(side === "bottom") return o.y === a.y + a.h && o.x < a.x + a.w && o.x + o.w > a.x;
        if(side === "top") return o.y + o.h === a.y && o.x < a.x + a.w && o.x + o.w > a.x;
        if(side === "left") return o.x + o.w === a.x && o.y < a.y + a.h && o.y + o.h > a.y;
        return o.x === a.x + a.w && o.y < a.y + a.h && o.y + o.h > a.y;
      });
    };
    if(!touches("bottom")) spots.push({ side: "bottom", at: a.w / 2 });
    else if(!touches("left")) spots.push({ side: "left", at: a.h / 2 });
    else if(!touches("right")) spots.push({ side: "right", at: a.h / 2 });
    else if(!touches("top")) spots.push({ side: "top", at: a.w / 2 });
  }
  return spots;
}

// Zona de paso: una casilla del plano delante de cada puerta, donde no se ponen muebles (las alfombras sí)
function getRoomPassZones(room){
  var g = getRoomFurnitureGrid(room);
  var sx = g.cols / Math.max(1, room.width || g.cols);
  var sy = g.rows / Math.max(1, room.height || g.rows);
  return getRoomDoorSpots(room).map(function(d){
    var horiz = (d.side === "top" || d.side === "bottom");
    var scale = horiz ? sx : sy;
    var max = horiz ? g.cols : g.rows;
    var from = Math.max(0, Math.floor((d.at - 0.35) * scale));
    var to = Math.min(max, Math.max(from + 1, Math.ceil((d.at + 0.35) * scale)));
    var deep = Math.max(1, Math.min(HOUSE_SUBCELLS, horiz ? g.rows : g.cols));
    if(horiz) return { side: d.side, x: from, w: to - from, y: d.side === "top" ? 0 : g.rows - deep, h: deep };
    return { side: d.side, x: d.side === "left" ? 0 : g.cols - deep, w: deep, y: from, h: to - from };
  });
}

// Motivo por el que la huella (x, y, w, h) no vale, o null si cabe:
// dentro de la estancia, sin pisar otro elemento de su misma capa y sin tapar la zona de paso
function getItemPlacementProblem(room, item, x, y, w, h){
  var grid = getRoomFurnitureGrid(room);
  if(x < 0 || y < 0 || w < 1 || h < 1 || x + w > grid.cols || y + h > grid.rows) return "Se sale de la estancia";
  var layer = getHouseItemLayer(item);
  var itemId = item && item.id;
  var hit = null;
  (room.furniture || []).concat(room.decor || []).some(function(o){
    if(!o || o === item || (itemId && o.id === itemId)) return false;
    if(typeof o.pos_x !== "number" || typeof o.pos_y !== "number") return false;
    if(getHouseItemLayer(o) !== layer) return false;
    var s = getHouseItemSize(o);
    if(x < o.pos_x + s.w && o.pos_x < x + w && y < o.pos_y + s.h && o.pos_y < y + h){ hit = o; return true; }
    return false;
  });
  if(hit) return "Choca con " + canvaItemName(hit).toLowerCase();
  if(layer !== "suelo" && getRoomPassZones(room).some(function(z){
    return x < z.x + z.w && z.x < x + w && y < z.y + z.h && z.y < y + h;
  })) return "Deja libre la zona de paso de la puerta";
  return null;
}

function canPlaceItem(room, item, x, y, w, h){
  return !getItemPlacementProblem(room, item, x, y, w, h);
}

// Hueco libre más cercano a (nearX, nearY); sin referencia, el primero de arriba abajo
function findFreeItemSpot(room, item, w, h, nearX, nearY){
  var grid = getRoomFurnitureGrid(room);
  var useNear = (typeof nearX === "number" && typeof nearY === "number");
  var best = null;
  var bestD = Infinity;
  for(var y = 0; y + h <= grid.rows; y++){
    for(var x = 0; x + w <= grid.cols; x++){
      if(!canPlaceItem(room, item, x, y, w, h)) continue;
      if(!useNear) return { x: x, y: y };
      var d = (x - nearX) * (x - nearX) + (y - nearY) * (y - nearY);
      if(d < bestD){ bestD = d; best = { x: x, y: y }; }
    }
  }
  return best;
}

function findCanvaAssetForItem(item){
  if(!item) return null;
  var lib = CANVA_ASSET_LIBRARY;
  return (item.asset_id && lib.find(function(a){ return a.id === item.asset_id; }))
    || lib.find(function(a){ return a.name === (item.name || item.label) || a.oldName === (item.name || item.label); })
    || lib.find(function(a){ return a.defaultType === item.type; })
    || null;
}

// Límites de tamaño del catálogo; con el mueble girado 90° o 270° también se giran
function getHouseItemSizeLimits(item){
  var asset = findCanvaAssetForItem(item);
  var floor = getHouseItemLayer(item) === "suelo";
  var lim = {
    minW: (asset && asset.minW) || 2,
    minH: (asset && asset.minH) || 2,
    maxW: (asset && asset.maxW) || (floor ? 99 : 8),
    maxH: (asset && asset.maxH) || (floor ? 99 : 8)
  };
  if(Math.abs(Math.round((item.rotation || 0) / 90)) % 2 === 1){
    lim = { minW: lim.minH, minH: lim.minW, maxW: lim.maxH, maxH: lim.maxW };
  }
  return lim;
}

// Giro real: cambia ancho por alto sobre el centro; si no cabe, al hueco libre más cercano
function rotateHouseItem(room, item){
  var s = getHouseItemSize(item);
  var nw = s.h;
  var nh = s.w;
  var nx = (item.pos_x || 0) + Math.round((s.w - nw) / 2);
  var ny = (item.pos_y || 0) + Math.round((s.h - nh) / 2);
  var spot = canPlaceItem(room, item, nx, ny, nw, nh) ? { x: nx, y: ny } : findFreeItemSpot(room, item, nw, nh, nx, ny);
  if(!spot) return false;
  item.rotation = ((item.rotation || 0) + 90) % 360;
  item.w = nw;
  item.h = nh;
  item.pos_x = spot.x;
  item.pos_y = spot.y;
  return true;
}

// Coloca un elemento nuevo en el hueco libre más cercano al centro; si no cabe así, lo prueba girado
function placeNewHouseItem(room, item){
  var s = getHouseItemSize(item);
  var g = getRoomFurnitureGrid(room);
  // Centro alineado a las casillas del plano, para no dejar huecos de media casilla alrededor
  function mid(free){ return Math.floor(free / 2 / HOUSE_SUBCELLS) * HOUSE_SUBCELLS; }
  var spot = findFreeItemSpot(room, item, s.w, s.h, mid(g.cols - s.w), mid(g.rows - s.h));
  if(!spot && s.w !== s.h){
    spot = findFreeItemSpot(room, item, s.h, s.w, mid(g.cols - s.h), mid(g.rows - s.w));
    if(spot){
      item.w = s.h;
      item.h = s.w;
      item.rotation = ((item.rotation || 0) + 90) % 360;
    }
  }
  if(!spot) return false;
  item.pos_x = spot.x;
  item.pos_y = spot.y;
  return true;
}

// Pasa a la rejilla fina los elementos guardados sin la marca g: 2. Primero se meten en la rejilla
// antigua, luego se escalan (el doble si la estancia mide 4×3 o más) y llevan la marca para no
// convertirse dos veces. Si dos chocan, el segundo va al hueco libre más cercano; si no hay hueco,
// se queda donde cae (no se pierde nada). Devuelve true si ha convertido algo.
function convertRoomLayoutToFineGrid(room){
  var oldG = getOldRoomFurnitureGrid(room);
  var g = getRoomFurnitureGrid(room);
  var sx = g.cols / oldG.cols, sy = g.rows / oldG.rows;
  var changed = false;
  var placed = { furniture: [], decor: [] };
  ["furniture", "decor"].forEach(function(field){
    if(!Array.isArray(room[field])) return;
    room[field].forEach(function(it){
      if(!it) return;
      if(it.g === HOUSE_SUBCELLS){ placed[field].push(it); return; }
      changed = true;
      var w = Math.max(1, Math.min(oldG.cols, it.w || 1));
      var h = Math.max(1, Math.min(oldG.rows, it.h || 1));
      it.w = Math.max(Math.min(2, g.cols), Math.min(g.cols, Math.round(w * sx)));
      it.h = Math.max(Math.min(2, g.rows), Math.min(g.rows, Math.round(h * sy)));
      it.g = HOUSE_SUBCELLS;
      if(typeof it.pos_x !== "number" || typeof it.pos_y !== "number") return;
      var ox = Math.max(0, Math.min(oldG.cols - w, it.pos_x));
      var oy = Math.max(0, Math.min(oldG.rows - h, it.pos_y));
      it.pos_x = Math.max(0, Math.min(g.cols - it.w, Math.round(ox * sx)));
      it.pos_y = Math.max(0, Math.min(g.rows - it.h, Math.round(oy * sy)));
      // Solo cuenta lo ya colocado, para que el primero se quede en su sitio y se mueva el segundo
      var view = Object.assign({}, room, { furniture: placed.furniture, decor: placed.decor });
      if(!canPlaceItem(view, it, it.pos_x, it.pos_y, it.w, it.h)){
        var spot = findFreeItemSpot(view, it, it.w, it.h, it.pos_x, it.pos_y);
        if(spot){ it.pos_x = spot.x; it.pos_y = spot.y; }
      }
      placed[field].push(it);
    });
  });
  return changed;
}

// Coloca los elementos que llegan sin posición (datos antiguos). Se hace al cargar, nunca al pintar.
// Devuelve true si ha tenido que convertir algo a la rejilla fina.
function normalizeRoomLayout(room){
  if(!room) return false;
  var converted = convertRoomLayoutToFineGrid(room);
  ["furniture", "decor"].forEach(function(field){
    if(!Array.isArray(room[field])) return;
    room[field].forEach(function(it){
      if(!it) return;
      if(typeof it.rotation !== "number") it.rotation = 0;
      if(typeof it.pos_x === "number" && typeof it.pos_y === "number"){
        // Si la estancia se ha encogido, se mete dentro lo que quedaba fuera
        var g = getRoomFurnitureGrid(room);
        if((it.w || 1) > g.cols) it.w = g.cols;
        if((it.h || 1) > g.rows) it.h = g.rows;
        var sz = getHouseItemSize(it);
        if(it.pos_x < 0 || it.pos_x + sz.w > g.cols) it.pos_x = Math.max(0, Math.min(g.cols - sz.w, it.pos_x));
        if(it.pos_y < 0 || it.pos_y + sz.h > g.rows) it.pos_y = Math.max(0, Math.min(g.rows - sz.h, it.pos_y));
        return;
      }
      var s = getHouseItemSize(it);
      var spot = findFreeItemSpot(room, it, s.w, s.h);
      it.pos_x = spot ? spot.x : 0;
      it.pos_y = spot ? spot.y : 0;
    });
  });
  return converted;
}

// La conversión a la rejilla fina la guarda solo el máster, una vez; un jugador la ve sin guardarla
function normalizeAllRoomLayouts(){
  var converted = (houseState.rooms || []).filter(function(r){ return normalizeRoomLayout(r); });
  if(!converted.length) return;
  if(!houseState.remote){ saveHouseLocalData(); return; }
  if(typeof isGM === "function" && isGM()){
    converted.forEach(function(r){ saveRoomChangesToRemoteAndBroadcast(r, "furniture", true); });
  }
}

// Dentro del editor el aviso sale bajo la estancia; fuera, como aviso normal
function houseLayoutWarn(msg){
  if(houseState.studioRoomId && document.getElementById("canvaHint")) canvaFlash(msg);
  else if(typeof showToast === "function") showToast(msg, "warning");
}

// ============================================================================
// FUNCIONES DEL ESTUDIO CANVA (Diseño y Decoración Visual)
// ============================================================================
function renderRoomMiniLayout(r, cellPx){
  var fur = Array.isArray(r.furniture) ? r.furniture : [];
  var dec = Array.isArray(r.decor) ? r.decor : [];
  if(fur.length === 0 && dec.length === 0) return '';

  var grid = getRoomFurnitureGrid(r);
  var colW = 100 / grid.cols;
  var rowH = 100 / grid.rows;

  // Clamp para asegurar que el elemento esté 100% contenido en la habitación
  function miniSize(it){
    return { w: Math.min(grid.cols, Math.max(1, it.w || 1)), h: Math.min(grid.rows, Math.max(1, it.h || 1)) };
  }
  function miniBox(it){
    var sz = miniSize(it);
    var w = sz.w, h = sz.h;
    var x = Math.max(0, Math.min(grid.cols - w, it.pos_x || 0));
    var y = Math.max(0, Math.min(grid.rows - h, it.pos_y || 0));
    return 'left:' + (x * colW).toFixed(2) + '%;top:' + (y * rowH).toFixed(2) + '%;width:' + (w * colW).toFixed(2) + '%;height:' + (h * rowH).toFixed(2) + '%;';
  }
  function miniArt(it){
    var sz = miniSize(it);
    return drawHouseItemArt(r, it, sz.w, sz.h, it.rotation || 0, cellPx);
  }

  var items = [];
  fur.forEach(function(f){
    items.push(
      '<div class="house-mini-item item-furniture" style="' + miniBox(f) + '" title="' + esc(f.name) + '">' +
        miniArt(f) +
      '</div>'
    );
  });

  // Alfombras primero, para que queden debajo de los muebles
  dec.forEach(function(d){
    var html = '<div class="house-mini-item item-decor" style="' + miniBox(d) + '" title="' + esc(d.label || d.type) + '">' +
        miniArt(d) +
      '</div>';
    if(getHouseItemLayer(d) === "suelo") items.unshift(html);
    else items.push(html);
  });

  return items.join('');
}

// ============================================================================
// EDITOR DE MUEBLES (Estudio): la estancia a todo el ancho, un único panel inferior,
// catálogo en cajón, deshacer/rehacer y guardado agrupado.
// ============================================================================
var CANVA_STUDIO_CATEGORIES = [
  { id: "todas", label: "Todo" },
  { id: "descanso", label: "Camas" },
  { id: "mesas", label: "Mesas" },
  { id: "almacen", label: "Almacén" },
  { id: "cocina", label: "Cocina" },
  { id: "decoracion", label: "Adornos" },
  { id: "luces", label: "Luces" }
];
var CANVA_SAVE_DELAY_MS = 800;
var CANVA_UNDO_MAX = 50;
var canvaUndoStack = [];
var canvaRedoStack = [];
var canvaUndoRoomId = null;
var canvaSaveTimer = null;
var canvaPendingSaveRoomId = null;
var canvaHintMsg = "";
var canvaHintTimer = null;
var canvaToastTimer = null;
var canvaResizeTimer = null;

function canvaRoom(roomId){
  var id = roomId || houseState.studioRoomId;
  return (houseState.rooms || []).find(function(x){ return x.id === id; }) || null;
}

function canvaItemName(item){
  return (item && (item.name || item.label || item.type)) || "Elemento";
}

function canvaItemCount(item){
  return (item && Array.isArray(item.items)) ? item.items.length : 0;
}

// Guarda objetos: los muebles de almacén del catálogo y los antiguos que no están en él
function canvaItemIsStorage(found){
  if(!found || found.field !== "furniture") return false;
  var asset = findCanvaAssetForItem(found.item);
  return !asset || !!asset.isStorage || canvaItemCount(found.item) > 0;
}

function canvaIsEditing(room){
  return !!room && canUserDecorateRoom(room) && houseState.studioMode !== "view";
}

// Vista girada: se gira sola si así las casillas salen más grandes (móvil en vertical con estancia ancha)
function canvaIsRotated(room){
  var g = getRoomFurnitureGrid(room);
  if(g.cols === g.rows) return false;
  if(houseState.studioRotView === true || houseState.studioRotView === false) return houseState.studioRotView;
  return canvaCellSize(g.rows, g.cols) > canvaCellSize(g.cols, g.rows);
}

// Paso entre coordenadas del plano y de la pantalla (vista girada 90° a la derecha)
function canvaToView(box, grid, rot){
  return rot ? { x: grid.rows - (box.y + box.h), y: box.x, w: box.h, h: box.w } : { x: box.x, y: box.y, w: box.w, h: box.h };
}

function canvaFromView(v, grid, rot){
  return rot ? { x: v.y, y: grid.rows - (v.x + v.w), w: v.h, h: v.w } : { x: v.x, y: v.y, w: v.w, h: v.h };
}

function canvaViewDelta(dx, dy, rot){
  return rot ? { dx: dy, dy: -dx } : { dx: dx, dy: dy };
}

function canvaBoxStyle(v, cell){
  return "left:" + (v.x * cell) + "px;top:" + (v.y * cell) + "px;width:" + (v.w * cell) + "px;height:" + (v.h * cell) + "px;";
}

// Tamaño de casilla para que la estancia quepa entera con la cabecera y el panel inferior
function canvaCellSize(vCols, vRows){
  var wrap = document.querySelector("#canvaStudio .cs-stage-wrap");
  var main = document.getElementById("main");
  var availW = wrap ? wrap.clientWidth : ((main && main.clientWidth) || window.innerWidth) - 32;
  availW = Math.min(760, availW) - 20;
  // Alto libre: sin la cabecera fija de la ficha, el panel inferior (más alto en el móvil) ni la cabecera del editor
  var topbar = document.getElementById("topbar");
  var dockH = window.innerWidth < 560 ? 250 : 190;
  var availH = window.innerHeight - (topbar ? topbar.offsetHeight : 0) - dockH - 190;
  return Math.max(12, Math.min(32, Math.floor(availW / vCols), Math.floor(availH / vRows)));
}

// ---------- Deshacer y guardado ----------
function canvaSnapshot(room){
  return JSON.stringify({ furniture: room.furniture || [], decor: room.decor || [] });
}

// Deshacer solo cambia la colocación: los objetos de los baúles se quedan como están ahora
function canvaRestore(room, snap){
  var s = JSON.parse(snap);
  var cur = {};
  (room.furniture || []).forEach(function(f){ if(f && f.id) cur[f.id] = f.items; });
  (s.furniture || []).forEach(function(f){ if(f && cur[f.id] !== undefined) f.items = cur[f.id]; });
  room.furniture = s.furniture || [];
  room.decor = s.decor || [];
}

function canvaResetHistory(roomId){
  canvaUndoStack = [];
  canvaRedoStack = [];
  canvaUndoRoomId = roomId || null;
}

function canvaCommit(room, before){
  if(canvaUndoRoomId !== room.id) canvaResetHistory(room.id);
  canvaUndoStack.push(before);
  if(canvaUndoStack.length > CANVA_UNDO_MAX) canvaUndoStack.shift();
  canvaRedoStack = [];
  canvaScheduleSave(room);
  refreshCanvaStudio();
}

function canvaUndoRedo(isRedo){
  var room = canvaRoom();
  if(!room || canvaUndoRoomId !== room.id) return;
  var from = isRedo ? canvaRedoStack : canvaUndoStack;
  var to = isRedo ? canvaUndoStack : canvaRedoStack;
  if(!from.length) return;
  to.push(canvaSnapshot(room));
  canvaRestore(room, from.pop());
  if(houseState.selectedItemId && !findRoomLayoutItem(room, houseState.selectedItemId)) houseState.selectedItemId = null;
  canvaScheduleSave(room);
  refreshCanvaStudio();
}

// Los cambios se ven al momento y se guardan una sola vez cuando se deja de tocar
function canvaScheduleSave(room){
  if(canvaPendingSaveRoomId && canvaPendingSaveRoomId !== room.id) flushCanvaStudioSave();
  canvaPendingSaveRoomId = room.id;
  saveHouseLocalData();
  setCanvaSaveState(true);
  clearTimeout(canvaSaveTimer);
  canvaSaveTimer = setTimeout(flushCanvaStudioSave, CANVA_SAVE_DELAY_MS);
}

function flushCanvaStudioSave(){
  clearTimeout(canvaSaveTimer);
  canvaSaveTimer = null;
  var roomId = canvaPendingSaveRoomId;
  if(!roomId) return;
  canvaPendingSaveRoomId = null;
  var room = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(room) saveRoomChangesToRemoteAndBroadcast(room, "furniture");
  setCanvaSaveState(false);
}

function setCanvaSaveState(busy){
  var el = document.getElementById("canvaSaveState");
  if(!el) return;
  el.className = "cs-save" + (busy ? " is-busy" : "");
  el.textContent = busy ? "Guardando…" : "✓ Guardado";
}

// ---------- Avisos ----------
function canvaDefaultHint(){
  var room = canvaRoom();
  if(!canvaIsEditing(room)) return "Toca un baúl o una librería para ver lo que hay dentro.";
  if(houseState.selectedItemId) return "Arrástralo para moverlo, o tira del círculo dorado para cambiar su tamaño.";
  return "Toca un mueble para elegirlo, o arrástralo directamente.";
}

function canvaFlash(msg){
  canvaHintMsg = msg;
  var el = document.getElementById("canvaHint");
  if(el){
    el.textContent = msg;
    el.classList.add("is-warn");
  }
  clearTimeout(canvaHintTimer);
  canvaHintTimer = setTimeout(function(){
    canvaHintMsg = "";
    var e = document.getElementById("canvaHint");
    if(e){
      e.classList.remove("is-warn");
      e.textContent = canvaDefaultHint();
    }
  }, 2600);
}

function canvaShowToast(msg, withUndo){
  var host = document.getElementById("canvaToastHost");
  if(!host) return;
  host.innerHTML = '<div class="cs-toast" role="status"><span>' + esc(msg) + '</span>' +
    (withUndo ? '<button type="button" class="cs-toast-undo" data-action="canva-undo" data-room-id="' + esc(houseState.studioRoomId || "") + '">Deshacer</button>' : '') +
    '<button type="button" class="cs-toast-x" data-action="canva-toast-close" aria-label="Cerrar aviso">✕</button></div>';
  clearTimeout(canvaToastTimer);
  canvaToastTimer = setTimeout(function(){ host.innerHTML = ""; }, 4000);
}

function canvaHideToast(){
  var host = document.getElementById("canvaToastHost");
  if(host) host.innerHTML = "";
}

// ---------- Acciones (en coordenadas del plano) ----------
function canvaInsertAsset(roomId, assetId){
  var room = canvaRoom(roomId);
  if(!room) return;

  var asset = CANVA_ASSET_LIBRARY.find(function(a){ return a.id === assetId; });
  if(!asset) return;

  var isFurn = !!(asset.isStorage || asset.isFurniture);
  var newItem = {
    id: (isFurn ? "fur_" : "dec_") + Date.now() + "_" + Math.floor(Math.random() * 1000),
    type: asset.defaultType || asset.id,
    asset_id: asset.id,
    icon: asset.icon,
    w: asset.defaultW || 2,
    h: asset.defaultH || 2,
    pos_x: 0,
    pos_y: 0,
    rotation: 0,
    g: HOUSE_SUBCELLS
  };
  if(isFurn){
    newItem.name = asset.name;
    newItem.items = [];
  } else {
    newItem.label = asset.name;
  }

  houseState.studioCatalogOpen = false;
  if(!placeNewHouseItem(room, newItem)){
    refreshCanvaStudio();
    houseLayoutWarn("No queda hueco libre para " + asset.name + ". Quita algo o elige algo más pequeño.");
    return;
  }

  var before = canvaSnapshot(room);
  var field = isFurn ? "furniture" : "decor";
  room[field] = room[field] || [];
  room[field].push(newItem);
  houseState.selectedItemId = newItem.id;
  canvaCommit(room, before);
  canvaShowToast(asset.name + " colocado. Arrástralo a su sitio.", true);
}

// Nombre propio del mueble (máx. 30 letras); vacío = el nombre del catálogo
var CANVA_NAME_MAX = 30;
function canvaRenameItem(roomId, itemId, text){
  var room = canvaRoom(roomId);
  houseState.studioRenameId = null;
  if(!canvaIsEditing(room)){ refreshCanvaStudio(); return; }
  var found = findRoomLayoutItem(room, itemId);
  if(!found){ refreshCanvaStudio(); return; }
  var it = found.item;
  var key = (it.name || found.field === "furniture") ? "name" : "label";
  var asset = findCanvaAssetForItem(it);
  var name = String(text || "").replace(/\s+/g, " ").trim().slice(0, CANVA_NAME_MAX).trim();
  if(!name) name = asset ? asset.name : (it[key] || "");
  if(!name || name === it[key]){ refreshCanvaStudio(); return; }

  var before = canvaSnapshot(room);
  // Los muebles antiguos se reconocían por el nombre: se apunta su tipo para no perder el dibujo ni el baúl
  if(asset && !it.asset_id) it.asset_id = asset.id;
  it[key] = name;
  canvaCommit(room, before);
  canvaShowToast("Ahora se llama " + name + ".", true);
}

// Intro guarda el nombre y Escape lo deja como estaba
document.addEventListener("keydown", function(e){
  var t = e.target;
  if(!t || t.id !== "canvaRenameInput") return;
  if(e.key === "Enter"){
    e.preventDefault();
    canvaRenameItem(t.getAttribute("data-room-id"), t.getAttribute("data-item-id"), t.value);
  } else if(e.key === "Escape"){
    e.preventDefault();
    houseState.studioRenameId = null;
    refreshCanvaStudio();
  }
});

function canvaRotateItem(roomId, itemId){
  var room = canvaRoom(roomId);
  if(!room) return;
  var found = findRoomLayoutItem(room, itemId);
  if(!found) return;

  var before = canvaSnapshot(room);
  if(!rotateHouseItem(room, found.item)){ houseLayoutWarn("No hay sitio para girarlo aquí."); return; }
  canvaCommit(room, before);
}

function canvaDuplicateItem(roomId, itemId){
  var room = canvaRoom(roomId);
  if(!room) return;
  var found = findRoomLayoutItem(room, itemId);
  if(!found) return;
  var isFurn = (found.field === "furniture");

  var clone = JSON.parse(JSON.stringify(found.item));
  clone.id = (isFurn ? "fur_" : "dec_") + Date.now() + "_" + Math.floor(Math.random() * 1000);
  if(isFurn) clone.items = []; // Duplicados empiezan vacíos

  var s = getHouseItemSize(clone);
  var spot = findFreeItemSpot(room, clone, s.w, s.h, found.item.pos_x || 0, found.item.pos_y || 0);
  if(!spot){ houseLayoutWarn("No queda sitio para otro igual."); return; }
  clone.pos_x = spot.x;
  clone.pos_y = spot.y;

  var before = canvaSnapshot(room);
  room[found.field].push(clone);
  houseState.selectedItemId = clone.id;
  canvaCommit(room, before);
  canvaShowToast(canvaItemName(clone) + " duplicado" + (isFurn ? " (vacío por dentro)." : "."), true);
}

// Un mueble con objetos dentro no se puede quitar: así no se pierde nada
function canvaDeleteItem(roomId, itemId){
  var room = canvaRoom(roomId);
  if(!room) return;
  var found = findRoomLayoutItem(room, itemId);
  if(!found) return;

  var n = canvaItemCount(found.item);
  if(n > 0){
    houseLayoutWarn("Vacíalo antes de quitarlo: tiene " + n + (n === 1 ? " objeto" : " objetos") + " dentro.");
    return;
  }

  var before = canvaSnapshot(room);
  room[found.field] = room[found.field].filter(function(x){ return x.id !== itemId; });
  if(houseState.selectedItemId === itemId) houseState.selectedItemId = null;
  canvaCommit(room, before);
  canvaShowToast(canvaItemName(found.item) + " quitado.", true);
}

// keepBottom: el borde de abajo se queda fijo (lo usa la vista girada para que no se mueva el borde izquierdo de la pantalla)
function canvaResizeItem(roomId, itemId, dw, dh, keepBottom){
  var room = canvaRoom(roomId);
  if(!room) return;
  var found = findRoomLayoutItem(room, itemId);
  if(!found) return;
  var it = found.item;
  var s = getHouseItemSize(it);
  var lim = getHouseItemSizeLimits(it);
  var targetW = s.w + dw;
  var targetH = s.h + dh;

  if((dw < 0 && targetW < lim.minW) || (dh < 0 && targetH < lim.minH)){ houseLayoutWarn("Ya tiene el tamaño mínimo."); return; }
  if((dw > 0 && targetW > lim.maxW) || (dh > 0 && targetH > lim.maxH)){ houseLayoutWarn("Ya tiene el tamaño máximo."); return; }

  // Si crece contra la pared o contra otro mueble, se prueba creciendo hacia el otro lado
  var x = it.pos_x || 0;
  var y = it.pos_y || 0;
  var tries = keepBottom
    ? [{ x: x, y: y - dh }, { x: x - Math.max(0, dw), y: y }]
    : [{ x: x, y: y }, { x: x - Math.max(0, dw), y: y - Math.max(0, dh) }];
  var spot = tries.find(function(p){ return canPlaceItem(room, it, p.x, p.y, targetW, targetH); });
  if(!spot){
    houseLayoutWarn("No cabe más grande: " + getItemPlacementProblem(room, it, tries[0].x, tries[0].y, targetW, targetH).toLowerCase() + ".");
    return;
  }

  var before = canvaSnapshot(room);
  it.w = targetW;
  it.h = targetH;
  it.pos_x = spot.x;
  it.pos_y = spot.y;
  canvaCommit(room, before);
}

function canvaNudgeItem(roomId, itemId, dx, dy){
  var room = canvaRoom(roomId);
  if(!room) return;
  var found = findRoomLayoutItem(room, itemId);
  if(!found) return;
  var it = found.item;
  var s = getHouseItemSize(it);
  var nx = (it.pos_x || 0) + dx;
  var ny = (it.pos_y || 0) + dy;
  var problem = getItemPlacementProblem(room, it, nx, ny, s.w, s.h);
  if(problem){ houseLayoutWarn(problem + "."); return; }

  var before = canvaSnapshot(room);
  it.pos_x = nx;
  it.pos_y = ny;
  canvaCommit(room, before);
}

// Ancho y alto de la pantalla: en la vista girada son el alto y el ancho del plano
function canvaResizeItemView(roomId, itemId, axis, delta){
  var room = canvaRoom(roomId);
  if(!room) return;
  if(!canvaIsRotated(room)){
    canvaResizeItem(room.id, itemId, axis === "w" ? delta : 0, axis === "h" ? delta : 0);
  } else if(axis === "w"){
    canvaResizeItem(room.id, itemId, 0, delta, true);
  } else {
    canvaResizeItem(room.id, itemId, delta, 0);
  }
}

function canvaNudgeItemView(roomId, itemId, dx, dy){
  var room = canvaRoom(roomId);
  if(!room) return;
  var d = canvaViewDelta(dx, dy, canvaIsRotated(room));
  canvaNudgeItem(room.id, itemId, d.dx, d.dy);
}

// Recolocar: al hueco libre más cercano al centro de la estancia
function canvaRelocateItem(roomId, itemId){
  var room = canvaRoom(roomId);
  if(!room) return;
  var found = findRoomLayoutItem(room, itemId);
  if(!found) return;
  var it = found.item;
  var s = getHouseItemSize(it);
  var g = getRoomFurnitureGrid(room);
  var spot = findFreeItemSpot(room, it, s.w, s.h, (g.cols - s.w) / 2, (g.rows - s.h) / 2);
  if(!spot){ houseLayoutWarn("No hay otro hueco libre."); return; }
  if(spot.x === (it.pos_x || 0) && spot.y === (it.pos_y || 0)){ houseLayoutWarn("Ya está en el mejor hueco libre."); return; }

  var before = canvaSnapshot(room);
  it.pos_x = spot.x;
  it.pos_y = spot.y;
  canvaCommit(room, before);
}

function canvaOpenItemAsPlayer(room, itemId){
  var found = findRoomLayoutItem(room, itemId);
  if(!found) return;
  if(canvaItemIsStorage(found)) openAddItemModal(room.id, found.item.id);
  else canvaFlash(canvaItemName(found.item));
}

// ---------- Pintado ----------
function renderCanvaStudio(roomId){
  var r = canvaRoom(roomId);
  if(!r){
    houseState.studioRoomId = null;
    return '<div class="alert warning">Habitación no encontrada. <button class="btn-compact" data-action="close-canva-studio">Volver al plano</button></div>';
  }
  return '<div class="canva-studio-container cs-studio" id="canvaStudio">' +
    '<div id="canvaStudioInner">' + renderCanvaStudioInner(r) + '</div>' +
    '<div class="cs-toast-host" id="canvaToastHost"></div>' +
  '</div>';
}

// Repinta solo el editor (no toda la vista de La Casa)
function refreshCanvaStudio(){
  var inner = document.getElementById("canvaStudioInner");
  var room = canvaRoom();
  if(!inner || !room){
    renderHouseView();
    return;
  }
  inner.innerHTML = renderCanvaStudioInner(room);
  canvaAfterRender();
}

// Ajusta la casilla al ancho real y deja sitio debajo para el panel fijo
function canvaAfterRender(){
  var studio = document.getElementById("canvaStudio");
  if(!studio) return;
  var dock = document.getElementById("canvaDock");
  if(dock){
    studio.style.setProperty("--cs-dock-h", dock.offsetHeight + "px");
    studio.style.paddingBottom = (dock.offsetHeight + 16) + "px";
  }
  var stage = document.getElementById("canvaRoomStage");
  var room = canvaRoom();
  if(!stage || !room || studio._fitting) return;
  var g = getRoomFurnitureGrid(room);
  var rot = canvaIsRotated(room);
  var cell = canvaCellSize(rot ? g.rows : g.cols, rot ? g.cols : g.rows);
  if(cell !== parseFloat(stage.getAttribute("data-cell"))){
    studio._fitting = true;
    document.getElementById("canvaStudioInner").innerHTML = renderCanvaStudioInner(room);
    studio._fitting = false;
  }
}

function renderCanvaStudioInner(r){
  var canEdit = canUserDecorateRoom(r);
  var editing = canvaIsEditing(r);
  if(!editing) houseState.studioCatalogOpen = false;

  var grid = getRoomFurnitureGrid(r);
  var rot = canvaIsRotated(r);
  var vCols = rot ? grid.rows : grid.cols;
  var vRows = rot ? grid.cols : grid.rows;
  var cell = canvaCellSize(vCols, vRows);
  var sel = (editing && houseState.selectedItemId) ? findRoomLayoutItem(r, houseState.selectedItemId) : null;
  var furnitureList = Array.isArray(r.furniture) ? r.furniture : [];
  var decorList = Array.isArray(r.decor) ? r.decor : [];
  var rid = esc(r.id);
  var html = '';

  // Barra superior: volver, nombre, guardado, vista girada, deshacer y rehacer
  html += '<div class="cs-top">';
  html += '  <button type="button" class="cs-icon-btn" data-action="close-canva-studio" aria-label="Volver al plano" title="Volver al plano">←</button>';
  html += '  <div class="cs-title">';
  html += '    <h2>' + esc(r.name) + '</h2>';
  html += '    <div class="cs-sub">';
  html += '      <span>Estancia ' + (r.width || grid.cols) + '×' + (r.height || grid.rows) + '</span>';
  if(canEdit){
    var busy = (canvaPendingSaveRoomId === r.id);
    html += '      <span class="cs-save' + (busy ? ' is-busy' : '') + '" id="canvaSaveState">' + (busy ? 'Guardando…' : '✓ Guardado') + '</span>';
  }
  if(grid.cols !== grid.rows){
    html += '      <button type="button" class="cs-rotv" data-action="canva-toggle-rotview" aria-pressed="' + rot + '">⟲ Vista girada</button>';
  }
  html += '    </div>';
  html += '  </div>';
  if(editing){
    var canUndo = canvaUndoRoomId === r.id && canvaUndoStack.length > 0;
    var canRedo = canvaUndoRoomId === r.id && canvaRedoStack.length > 0;
    html += '  <button type="button" class="cs-icon-btn" data-action="canva-undo" data-room-id="' + rid + '" aria-label="Deshacer" title="Deshacer"' + (canUndo ? '' : ' disabled') + '>↶</button>';
    html += '  <button type="button" class="cs-icon-btn" data-action="canva-redo" data-room-id="' + rid + '" aria-label="Rehacer" title="Rehacer"' + (canRedo ? '' : ' disabled') + '>↷</button>';
  }
  html += '</div>';

  if(canEdit){
    html += '<div class="cs-mode" role="group" aria-label="Modo">';
    html += '  <button type="button" data-action="canva-set-mode" data-mode="edit" aria-pressed="' + editing + '">Editar muebles</button>';
    html += '  <button type="button" data-action="canva-set-mode" data-mode="view" aria-pressed="' + !editing + '">Ver como jugador</button>';
    html += '</div>';
  }

  // Estancia
  var bg = r.color ? 'background:' + getRoomCustomBackground(r.color) + ';' : '';
  html += '<div class="cs-stage-wrap">';
  html += '<div class="cs-wall tex-' + esc(r.room_type || 'salon') + '" style="' + bg + '">';
  html += '<div class="cs-room' + (editing ? ' is-edit' : '') + '" id="canvaRoomStage" data-room-id="' + rid + '" data-cell="' + cell + '" style="width:' + (vCols * cell) + 'px;height:' + (vRows * cell) + 'px;--cell:' + cell + 'px;">';

  var sideAfterRot = { top: "right", right: "bottom", bottom: "left", left: "top" };
  getRoomPassZones(r).forEach(function(z){
    var v = canvaToView(z, grid, rot);
    var side = rot ? sideAfterRot[z.side] : z.side;
    if(editing) html += '<div class="cs-pass" style="' + canvaBoxStyle(v, cell) + '"><span>Paso</span></div>';
    var doorPos = (side === "top" || side === "bottom")
      ? 'left:' + (v.x * cell) + 'px;width:' + (v.w * cell) + 'px;'
      : 'top:' + (v.y * cell) + 'px;height:' + (v.h * cell) + 'px;';
    html += '<div class="cs-door cs-door-' + side + '" style="' + doorPos + '"></div>';
  });

  // Alfombras primero, para que queden debajo de los muebles
  var all = [];
  furnitureList.forEach(function(f){ if(f) all.push({ item: f, field: "furniture" }); });
  decorList.forEach(function(d){ if(d) all.push({ item: d, field: "decor" }); });
  all.sort(function(a, b){
    return (getHouseItemLayer(a.item) === "suelo" ? 0 : 1) - (getHouseItemLayer(b.item) === "suelo" ? 0 : 1);
  });
  all.forEach(function(entry){
    var it = entry.item;
    var s = getHouseItemSize(it);
    var v = canvaToView({ x: it.pos_x || 0, y: it.pos_y || 0, w: s.w, h: s.h }, grid, rot);
    var isSel = !!sel && sel.item === it;
    var n = canvaItemCount(it);
    var cls = 'canva-stage-item cs-item' + (getHouseItemLayer(it) === "suelo" ? ' is-floor' : '') + (isSel ? ' is-sel' : '');
    html += '<div class="' + cls + '" data-item-id="' + esc(it.id) + '" data-room-id="' + rid + '" style="' + canvaBoxStyle(v, cell) + '" role="button" aria-label="' + esc(canvaItemName(it)) + '">';
    html += '  <div class="canva-stage-item-svg">' + drawHouseItemArt(r, it, v.w, v.h, ((it.rotation || 0) + (rot ? 90 : 0)) % 360, cell) + '</div>';
    if(n > 0 && canvaItemIsStorage(entry)) html += '  <span class="cs-badge">' + n + '</span>';
    if(isSel){
      html += '  <span class="cs-name">' + esc(canvaItemName(it)) + '</span>';
      html += '  <span class="cs-resize" aria-hidden="true"><i></i></span>';
    }
    html += '</div>';
  });

  html += '</div>'; // fin cs-room
  html += '</div>'; // fin cs-wall
  html += '</div>'; // fin cs-stage-wrap

  html += '<div class="cs-hint' + (canvaHintMsg ? ' is-warn' : '') + '" id="canvaHint" aria-live="polite">' + esc(canvaHintMsg || canvaDefaultHint()) + '</div>';
  if(editing){
    html += '<div class="cs-legend"><span><i class="is-ok"></i>Cabe aquí</span><span><i class="is-bad"></i>No cabe</span><span><i class="is-pass"></i>Zona de paso</span></div>';
  }

  html += renderCanvaStudioDock(r, editing, canEdit, sel, grid, rot, furnitureList.length + decorList.length);
  if(editing && houseState.studioCatalogOpen) html += renderCanvaCatalogSheet(r);
  return html;
}

// Panel inferior único: añadir, o las acciones del mueble elegido
function renderCanvaStudioDock(r, editing, canEdit, sel, grid, rot, total){
  var rid = esc(r.id);
  var html = '<div class="cs-dock" id="canvaDock"><div class="cs-dock-in">';

  if(!editing){
    html += '<div class="cs-tip">' + (canEdit
      ? 'Así lo ve un jugador: los muebles no se mueven. Toca un baúl para ver lo que hay dentro.'
      : 'Toca un baúl o una librería para ver lo que hay dentro.') + '</div>';
  } else if(!sel){
    html += '<button type="button" class="cs-add" data-action="canva-open-catalog" data-room-id="' + rid + '">＋ Añadir mueble o adorno</button>';
    html += '<div class="cs-tip">' + total + (total === 1 ? ' elemento' : ' elementos') + ' en la estancia</div>';
  } else {
    var it = sel.item;
    var iid = esc(it.id);
    var s = getHouseItemSize(it);
    var vs = rot ? { w: s.h, h: s.w } : s;
    var lim = getHouseItemSizeLimits(it);
    var vl = rot ? { minW: lim.minH, maxW: lim.maxH, minH: lim.minW, maxH: lim.maxW } : lim;
    var vMaxW = Math.min(vl.maxW, rot ? grid.rows : grid.cols);
    var vMaxH = Math.min(vl.maxH, rot ? grid.cols : grid.rows);
    var store = canvaItemIsStorage(sel);
    var n = canvaItemCount(it);
    var attrs = ' data-room-id="' + rid + '" data-item-id="' + iid + '"';

    if(houseState.studioRenameId === it.id){
      var asset = findCanvaAssetForItem(it);
      html += '<div class="cs-dock-head cs-rename">';
      html += '  <input type="text" id="canvaRenameInput" class="cs-rename-input" maxlength="' + CANVA_NAME_MAX + '" value="' + esc(canvaItemName(it)) + '"' +
        (asset ? ' placeholder="' + esc(asset.name) + '"' : '') + ' aria-label="Nuevo nombre"' + attrs + ' autocomplete="off" enterkeyhint="done">';
      html += '  <button type="button" class="cs-icon-btn is-ok" data-action="canva-rename-save"' + attrs + ' aria-label="Guardar nombre" title="Guardar nombre">✓</button>';
      html += '  <button type="button" class="cs-icon-btn" data-action="canva-rename-cancel" aria-label="Cancelar" title="Cancelar">✕</button>';
      html += '</div>';
      html += '<div class="cs-tip">Máximo ' + CANVA_NAME_MAX + ' letras.' + (asset ? ' Si lo dejas vacío vuelve a llamarse ' + esc(asset.name) + '.' : '') + '</div>';
    } else {
      html += '<div class="cs-dock-head">';
      html += '  <button type="button" class="cs-dock-name cs-rename-btn" data-action="canva-rename-start"' + attrs + ' aria-label="Renombrar ' + esc(canvaItemName(it)) + '" title="Renombrar"><span>' + esc(canvaItemName(it)) + '</span><span class="cs-pen" aria-hidden="true">✎</span></button>';
      html += '  <span class="cs-dock-size">' + vs.w + '×' + vs.h + ' casillas</span>';
      html += '  <button type="button" class="cs-icon-btn" data-action="canva-deselect-item" aria-label="Quitar selección" title="Quitar selección">✕</button>';
      html += '</div>';
    }

    html += '<div class="cs-acts">';
    html += '  <button type="button" class="cs-act" data-action="canva-rotate-item"' + attrs + '><span class="g">⟳</span>Girar</button>';
    if(store){
      html += '  <button type="button" class="cs-act is-store" data-action="open-add-item-modal" data-room-id="' + rid + '" data-furniture-id="' + iid + '"><span class="g">▣</span>Dentro (' + n + ')</button>';
      html += '  <button type="button" class="cs-act" data-action="canva-duplicate-item"' + attrs + '><span class="g">⧉</span>Duplicar</button>';
    } else {
      html += '  <button type="button" class="cs-act" data-action="canva-duplicate-item"' + attrs + '><span class="g">⧉</span>Duplicar</button>';
      html += '  <button type="button" class="cs-act" data-action="canva-relocate-item"' + attrs + '><span class="g">⌖</span>Recolocar</button>';
    }
    html += '  <button type="button" class="cs-act is-danger" data-action="canva-delete-item"' + attrs + '><span class="g">✕</span>Quitar</button>';
    html += '</div>';

    html += '<div class="cs-row">';
    html += '  <div class="cs-step">';
    html += '    <button type="button" data-action="canva-size-view" data-axis="w" data-delta="-1"' + attrs + ' aria-label="Menos ancho"' + (vs.w <= vl.minW ? ' disabled' : '') + '>−</button>';
    html += '    <span>Ancho <b>' + vs.w + '</b></span>';
    html += '    <button type="button" data-action="canva-size-view" data-axis="w" data-delta="1"' + attrs + ' aria-label="Más ancho"' + (vs.w >= vMaxW ? ' disabled' : '') + '>+</button>';
    html += '  </div>';
    html += '  <div class="cs-step">';
    html += '    <button type="button" data-action="canva-size-view" data-axis="h" data-delta="-1"' + attrs + ' aria-label="Menos alto"' + (vs.h <= vl.minH ? ' disabled' : '') + '>−</button>';
    html += '    <span>Alto <b>' + vs.h + '</b></span>';
    html += '    <button type="button" data-action="canva-size-view" data-axis="h" data-delta="1"' + attrs + ' aria-label="Más alto"' + (vs.h >= vMaxH ? ' disabled' : '') + '>+</button>';
    html += '  </div>';
    html += '  <div class="cs-nudge">';
    html += '    <button type="button" data-action="canva-nudge-view" data-dx="-1" data-dy="0"' + attrs + ' aria-label="Mover a la izquierda">◀</button>';
    html += '    <button type="button" data-action="canva-nudge-view" data-dx="0" data-dy="-1"' + attrs + ' aria-label="Mover arriba">▲</button>';
    html += '    <button type="button" data-action="canva-nudge-view" data-dx="0" data-dy="1"' + attrs + ' aria-label="Mover abajo">▼</button>';
    html += '    <button type="button" data-action="canva-nudge-view" data-dx="1" data-dy="0"' + attrs + ' aria-label="Mover a la derecha">▶</button>';
    html += '  </div>';
    html += '</div>';
  }

  html += '</div></div>';
  return html;
}

// Cajón del catálogo (sin puertas: las dibuja el plano)
function renderCanvaCatalogSheet(r){
  var rid = esc(r.id);
  var cur = houseState.studioCategory || "todas";
  if(!CANVA_STUDIO_CATEGORIES.some(function(c){ return c.id === cur; })) cur = "todas";
  var list = CANVA_ASSET_LIBRARY.filter(function(a){
    return !a.isDoor && (cur === "todas" || a.category === cur);
  });

  var html = '<div class="cs-sheet-bg" data-action="canva-close-catalog-bg">';
  html += '<div class="cs-sheet" role="dialog" aria-modal="true" aria-labelledby="canvaCatTitle">';
  html += '  <div class="cs-grab"></div>';
  html += '  <div class="cs-sheet-h"><h2 id="canvaCatTitle">Añadir a la estancia</h2><button type="button" class="cs-icon-btn" data-action="canva-close-catalog" aria-label="Cerrar">✕</button></div>';
  html += '  <div class="cs-chips">';
  CANVA_STUDIO_CATEGORIES.forEach(function(c){
    html += '<button type="button" data-action="canva-select-category" data-category="' + c.id + '" aria-pressed="' + (c.id === cur) + '">' + c.label + '</button>';
  });
  html += '  </div>';
  html += '  <div class="cs-cat">';
  list.forEach(function(a){
    var floor = getHouseItemLayer({ type: a.defaultType || a.id }) === "suelo";
    html += '<button type="button" class="cs-card" data-action="canva-insert-asset" data-room-id="' + rid + '" data-asset-id="' + a.id + '">';
    html += '  <span class="cs-card-pv">' + drawHouseItemSVG(a.id, (a.defaultW || 2) / HOUSE_SUBCELLS, (a.defaultH || 2) / HOUSE_SUBCELLS, { seed: a.id, label: a.name }) + '</span>';
    html += '  <span class="cs-card-tx"><b>' + esc(a.name) + '</b><small>' + (a.defaultW || 2) + '×' + (a.defaultH || 2) + ' casillas</small>';
    if(a.isStorage) html += '<small class="is-store">Guarda objetos</small>';
    if(floor) html += '<small>Va en el suelo</small>';
    html += '  </span>';
    html += '</button>';
  });
  html += '  </div>';
  html += '</div>';
  html += '</div>';
  return html;
}

// ---------- Arrastre: mover, o cambiar el tamaño desde el tirador dorado ----------
var canvaActiveDrag = null;

function handleCanvaStagePointerDown(e){
  if(!houseState.studioRoomId) return;
  if(e.button !== undefined && e.button !== 0) return;
  var stageEl = e.target.closest ? e.target.closest("#canvaRoomStage") : null;
  if(!stageEl) return;
  var room = canvaRoom();
  if(!room) return;

  var itemEl = e.target.closest(".canva-stage-item");
  if(!canvaIsEditing(room)){
    // Modo jugador: un toque abre el baúl (al soltar, para no confundirlo con desplazar la página)
    if(itemEl) canvaActiveDrag = { pointerId: e.pointerId, viewTap: true, roomId: room.id, itemId: itemEl.getAttribute("data-item-id"), startX: e.clientX, startY: e.clientY, moved: false, stageEl: stageEl };
    return;
  }
  if(!itemEl){
    // Tocar el suelo vacío quita la selección
    if(houseState.selectedItemId){
      houseState.selectedItemId = null;
      refreshCanvaStudio();
    }
    return;
  }

  var found = findRoomLayoutItem(room, itemEl.getAttribute("data-item-id"));
  if(!found) return;
  e.preventDefault();

  var grid = getRoomFurnitureGrid(room);
  var rot = canvaIsRotated(room);
  var s = getHouseItemSize(found.item);
  var box = { x: found.item.pos_x || 0, y: found.item.pos_y || 0, w: s.w, h: s.h };
  canvaActiveDrag = {
    pointerId: e.pointerId,
    roomId: room.id,
    itemId: found.item.id,
    itemEl: itemEl,
    stageEl: stageEl,
    startX: e.clientX,
    startY: e.clientY,
    grid: grid,
    rot: rot,
    cell: parseFloat(stageEl.getAttribute("data-cell")) || 40,
    box: box,
    view: canvaToView(box, grid, rot),
    resizing: !!e.target.closest(".cs-resize"),
    moved: false,
    ghost: null,
    target: null,
    problem: null
  };

  try {
    stageEl.setPointerCapture(e.pointerId);
  } catch(err){}
}

function handleCanvaStagePointerMove(e){
  var d = canvaActiveDrag;
  if(!d || d.pointerId !== e.pointerId) return;

  var dx = e.clientX - d.startX;
  var dy = e.clientY - d.startY;
  if(!d.moved && Math.abs(dx) <= 6 && Math.abs(dy) <= 6) return;
  if(d.viewTap){ d.moved = true; return; }
  e.preventDefault();

  var room = canvaRoom(d.roomId);
  var found = room ? findRoomLayoutItem(room, d.itemId) : null;
  if(!found) return;

  if(!d.moved){
    d.moved = true;
    d.itemEl.classList.add("cs-dragging");
    d.ghost = document.createElement("div");
    d.ghost.className = "cs-ghost";
    d.stageEl.appendChild(d.ghost);
  }

  var target, problem, label = "";
  if(d.resizing){
    // La esquina de arriba a la izquierda (en pantalla) se queda fija
    var vw = Math.max(1, Math.round(d.view.w + dx / d.cell));
    var vh = Math.max(1, Math.round(d.view.h + dy / d.cell));
    target = canvaFromView({ x: d.view.x, y: d.view.y, w: vw, h: vh }, d.grid, d.rot);
    var lim = getHouseItemSizeLimits(found.item);
    if(target.w < lim.minW || target.h < lim.minH) problem = "No puede ser más pequeño";
    else if(target.w > lim.maxW || target.h > lim.maxH) problem = "No puede ser más grande";
    else problem = getItemPlacementProblem(room, found.item, target.x, target.y, target.w, target.h);
    label = vw + "×" + vh;
  } else {
    d.itemEl.style.left = (d.view.x * d.cell + dx) + "px";
    d.itemEl.style.top = (d.view.y * d.cell + dy) + "px";
    var md = canvaViewDelta(dx / d.cell, dy / d.cell, d.rot);
    var nx = Math.max(0, Math.min(d.grid.cols - d.box.w, Math.round(d.box.x + md.dx)));
    var ny = Math.max(0, Math.min(d.grid.rows - d.box.h, Math.round(d.box.y + md.dy)));
    target = { x: nx, y: ny, w: d.box.w, h: d.box.h };
    problem = getItemPlacementProblem(room, found.item, nx, ny, d.box.w, d.box.h);
  }
  d.target = target;
  d.problem = problem;

  var gv = canvaToView(target, d.grid, d.rot);
  d.ghost.setAttribute("style", canvaBoxStyle(gv, d.cell));
  d.ghost.classList.toggle("is-bad", !!problem);
  d.ghost.textContent = label;

  var hint = document.getElementById("canvaHint");
  if(hint){
    hint.classList.toggle("is-warn", !!problem);
    hint.textContent = problem ? problem + "." : (d.resizing ? "Suelta para dejarlo de " + label + "." : "Suelta para colocarlo aquí.");
  }
}

function handleCanvaStagePointerUp(e){
  var d = canvaActiveDrag;
  if(!d || d.pointerId !== e.pointerId) return;
  canvaActiveDrag = null;

  try {
    d.stageEl.releasePointerCapture(e.pointerId);
  } catch(err){}

  var room = canvaRoom(d.roomId);
  if(!room) return;

  if(d.viewTap){
    if(!d.moved && e.type === "pointerup") canvaOpenItemAsPlayer(room, d.itemId);
    return;
  }

  houseState.selectedItemId = d.itemId;
  var found = findRoomLayoutItem(room, d.itemId);
  var t = d.target;
  var changed = !!(found && t && (t.x !== d.box.x || t.y !== d.box.y || t.w !== d.box.w || t.h !== d.box.h));
  if(d.moved && changed && !d.problem && e.type === "pointerup"){
    var before = canvaSnapshot(room);
    found.item.pos_x = t.x;
    found.item.pos_y = t.y;
    found.item.w = t.w;
    found.item.h = t.h;
    canvaCommit(room, before);
    return;
  }

  // No cabe o no ha cambiado: vuelve a su sitio
  refreshCanvaStudio();
  if(d.moved && d.problem) canvaFlash(d.problem + ". Vuelve a su sitio.");
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
  // La pestaña Casa no pasa por openHouseView: la primera vez se trae La Casa de la nube
  if(!houseState.remote && !houseState._remoteFetchStarted){
    houseState._remoteFetchStarted = true;
    fetchHouseRemoteData().then(function(){
      if(houseState.remote && (houseState.active || (typeof state !== "undefined" && state.activeTab === "casa"))) renderHouseView();
    });
  }

  // Si houseState.studioRoomId está activo se sigue pintando el estudio como ahora, y en ese caso no se pintan cabecera ni pestañas
  if(houseState.studioRoomId){
    var studioHtml = '<div class="house-container">';
    studioHtml += renderCanvaStudio(houseState.studioRoomId);
    studioHtml += '</div>';
    main.innerHTML = studioHtml;
    canvaAfterRender();
    return;
  }

  var gmMode = (typeof isGM === "function" && isGM());
  var canEditPlan = canUserEditPlan();
  if(!canEditPlan) houseState.editMode = false;
  var curFloor = houseState.activeFloor || 1;

  var tab = houseState.tab;
  if(tab !== "plano" && tab !== "mejoras" && tab !== "misiones"){
    try {
      tab = localStorage.getItem("krysalisHouseTab");
    } catch(e){}
    if(tab !== "plano" && tab !== "mejoras" && tab !== "misiones"){
      tab = "plano";
    }
    houseState.tab = tab;
  }

  var html = '<div class="house-container">';
  html += '<div class="section house-section">';

  // 1. Cabecera compacta
  html += '<div class="house-head">';
  html += '  <div class="section-title">';
  html += '    <span><img src="images/iconos/casa.svg" alt="" class="house-title-icon" width="20" height="20"> LA CASA</span>';
  if(canEditHousePerks()){
    html += '    <button class="btn-compact house-head-lock" data-action="open-house-secrets" title="Panel secreto">🔒</button>';
  }
  html += '  </div>';
  html += '  <div class="house-head-meta">';
  html += '    <span class="house-level-pill pill-formula">Nivel ' + getHouseLevel() + '</span>';
  var doneQuests = (typeof getHouseQuests === "function" ? getHouseQuests() : []).filter(function(q){
    return q && q.status === "completada";
  });
  var lastDoneQuest = doneQuests.length ? doneQuests[doneQuests.length - 1] : null;
  if(lastDoneQuest && lastDoneQuest.title){
    html += '    <span class="house-last-quest">Último hito: ' + esc(lastDoneQuest.title) + '</span>';
  }
  html += '  </div>';
  html += '</div>';

  // 2. Tres pestañas segmentadas
  html += '<div class="house-tabs k-seg" role="tablist">';
  html += '  <button class="house-tab-btn k-seg-btn' + (tab === "plano" ? ' active' : '') + '" data-action="set-house-tab" data-tab="plano">🗺 Plano</button>';
  html += '  <button class="house-tab-btn k-seg-btn' + (tab === "mejoras" ? ' active' : '') + '" data-action="set-house-tab" data-tab="mejoras">✨ Mejoras</button>';
  html += '  <button class="house-tab-btn k-seg-btn' + (tab === "misiones" ? ' active' : '') + '" data-action="set-house-tab" data-tab="misiones">📜 Misiones</button>';
  html += '</div>';

  // Solo se pinta el contenido de la pestaña activa (las otras NO se generan en el HTML)
  if(tab === "mejoras"){
    html += renderHouseUpgradesBox();
  } else if(tab === "misiones"){
    html += renderHouseQuestsBox();
  } else {
    // Pestaña "plano"
    html += '<div class="house-blueprint-section">';

    // Topbar del plano
    html += '<div class="house-topbar">';
    html += '  <div class="house-toolbar">';
    var floors = getHouseFloors();
    html += '    <div class="k-seg k-seg-grid3" style="flex:1 1 100%">';
    floors.forEach(function(fl){
      var isFlActive = isRoomOnFloor({ floor: houseState.activeFloor }, fl.id);
      html += '    <button class="house-floor-tab-btn k-seg-btn' + (isFlActive ? ' active' : '') + '" data-action="switch-house-floor" data-floor="' + fl.id + '">' + esc(fl.name) + '</button>';
    });
    html += '    </div>';
    if(gmMode && houseState.editMode){
      html += '    <button class="house-add-floor-btn" data-action="open-add-floor-modal" title="Crear nueva planta">+ Nueva Planta</button>';
    }
    if(canEditPlan){
      html += '    <button class="btn-compact house-mode-toggle-btn' + (houseState.editMode ? ' active' : '') + '" data-action="set-house-mode" data-mode="' + (houseState.editMode ? 'ver' : 'editar') + '">' + (houseState.editMode ? 'Salir de editar' : 'Editar') + '</button>';
    }
    html += '  </div>';

    // Fila de acciones principales (solo en modo Editar; crear y borrar estancias solo el máster)
    if(houseState.editMode){
      html += '  <div class="house-action-row">';
      if(gmMode){
        html += '    <button class="house-act-btn primary" data-action="open-preset-room-modal">' + iconoUI("mas") + ' Añadir habitación</button>';
        html += '    <button class="house-act-btn danger" id="delRoomBtn" data-action="quick-delete-selected-room"' + (houseState.selectedRoomId ? '' : ' disabled') + '>' + iconoUI("cerrar") + ' Eliminar seleccionada</button>';
      }
      html += '    <button class="house-act-btn" data-action="toggle-house-grid-snap" id="gridSnapBtn" title="Ajuste magnético a rejilla">' + (houseKonvaGridSnap > 0 ? '🧲 Rejilla: casilla' : '🖐️ Rejilla: Libre') + '</button>';
      html += '  </div>';
      // Ampliar la planta por cualquier lado para hacer sitio antes de colocar (solo el máster)
      if(gmMode){
        html += '  <div class="house-action-row house-expand-row">';
        html += '    <span class="house-expand-label">Ampliar planta:</span>';
        html += '    <button class="house-act-btn" data-action="expand-house-floor" data-side="left" title="Una columna más a la izquierda" aria-label="Ampliar planta a la izquierda">'+iconoUI("flecha-izquierda")+'</button>';
        html += '    <button class="house-act-btn" data-action="expand-house-floor" data-side="right" title="Una columna más a la derecha" aria-label="Ampliar planta a la derecha">'+iconoUI("flecha-derecha")+'</button>';
        html += '    <button class="house-act-btn" data-action="expand-house-floor" data-side="up" title="Una fila más arriba" aria-label="Ampliar planta por arriba">'+iconoUI("flecha-arriba")+'</button>';
        html += '    <button class="house-act-btn" data-action="expand-house-floor" data-side="down" title="Una fila más abajo" aria-label="Ampliar planta por abajo">'+iconoUI("flecha-abajo")+'</button>';
        html += '    <button class="house-act-btn" data-action="expand-house-floor" data-side="fit" title="Quitar el sitio vacío que sobra alrededor de las estancias">Quitar vacío</button>';
        html += '  </div>';
      }
    }

    // Barra de herramientas contextual de habitación seleccionada
    var selRoom = houseState.selectedRoomId ? (houseState.rooms || []).find(function(x){ return x.id === houseState.selectedRoomId; }) : null;
    var selBarVis = (selRoom && houseState.editMode && canUserEditRoomGeometry(selRoom)) ? ' visible' : '';
    var selTexName = selRoom ? (HOUSE_TEXTURES.find(function(t){ return t.id === (selRoom.texture || inferRoomTexture(selRoom)); })?.name || "Madera") : "Madera";
    var selIconName = selRoom ? ((selRoom.icon ? selRoom.icon + " " : "") + selRoom.name) : "Habitación";

    // La barra de herramientas de estancia solo existe en modo Editar
    if(houseState.editMode){
      html += '  <div class="house-quick-tools' + selBarVis + '" id="roomQuickBar">';
      html += '    <div class="house-quick-tools-title"><b id="rqRoomName">' + esc(selIconName) + '</b></div>';
      html += '    <div class="house-quick-tools-group">';
      if(gmMode) html += '      <button class="house-tool-btn" data-action="quick-rename-selected-room">'+iconoUI("editar")+' Renombrar</button>';
      html += '      <div class="house-tool-stepper" title="Ancho de la habitación">';
      html += '        <span></span>';
      html += '        <button class="house-tool-subbtn" data-action="quick-step-room-size" data-axis="w" data-delta="-40" title="Reducir ancho">'+iconoUI("menos")+'</button>';
      html += '        <span id="rqWidthLabel">' + (selRoom ? Math.max(1, selRoom.width || Math.round((selRoom.w || 160)/40)) : 4) + '</span>';
      html += '        <button class="house-tool-subbtn" data-action="quick-step-room-size" data-axis="w" data-delta="40" title="Aumentar ancho">'+iconoUI("mas")+'</button>';
      html += '      </div>';
      html += '      <div class="house-tool-stepper" title="Alto de la habitación">';
      html += '        <span></span>';
      html += '        <button class="house-tool-subbtn" data-action="quick-step-room-size" data-axis="h" data-delta="-40" title="Reducir alto">'+iconoUI("menos")+'</button>';
      html += '        <span id="rqHeightLabel">' + (selRoom ? Math.max(1, selRoom.height || Math.round((selRoom.h || 120)/40)) : 3) + '</span>';
      html += '        <button class="house-tool-subbtn" data-action="quick-step-room-size" data-axis="h" data-delta="40" title="Aumentar alto">'+iconoUI("mas")+'</button>';
      html += '      </div>';
      if(gmMode){
        html += '      <button class="house-tool-btn" data-action="quick-toggle-texture-menu">Suelo: <span id="rqTexLabel">' + selTexName + '</span></button>';
        html += '      <button class="house-tool-btn" data-action="quick-toggle-color-menu">Color</button>';
        html += '      <button class="house-tool-btn" data-action="quick-toggle-icon-menu">'+iconoUI("etiqueta")+' Icono</button>';
        html += '      <button class="house-tool-btn highlight" data-action="open-canva-studio" data-room-id="' + (selRoom ? selRoom.id : '') + '">Editar muebles</button>';
        html += '      <button class="house-tool-btn" data-action="quick-duplicate-selected-room">'+iconoUI("copiar")+' Duplicar</button>';
        html += '      <button class="house-tool-btn" data-action="quick-toggle-floor-menu">Planta</button>';
        html += '      <button class="house-tool-btn" data-action="quick-delete-selected-room" style="color:#E88178;">'+iconoUI("borrar")+'</button>';
      }
      html += '    </div>';
      html += '  </div>';
    }

    html += '</div>'; // Fin house-topbar

    // Barra de zoom propia y lienzo Konva 2D debajo
    html += '<div class="house-zoom-bar">';
    html += '  <div class="house-zoom-group">';
    html += '    <button data-action="zoom-house-out" title="Alejar plano">−</button>';
    html += '    <span class="zlabel" id="zoomLabel">' + Math.round((houseKonvaZoom || 1.0) * 100) + '%</span>';
    html += '    <button data-action="zoom-house-in" title="Acercar plano">+</button>';
    html += '    <button data-action="zoom-house-fit" title="Ajustar estancias a pantalla">📱 Ajustar</button>';
    html += '  </div>';
    html += '</div>';
    html += '<div class="canvas-wrap' + (houseState.editMode ? '' : ' is-view') + '" id="canvasWrap">';
    html += '  <div id="stage-container"></div>';
    html += '</div>';

    // Barra de consejos interactiva (solo en modo Editar)
    if(houseState.editMode){
      html += '<div class="house-hint-bar">';
      html += '  En <b>modo Editar</b>: arrastra una habitación para moverla (se ajusta a la casilla), tira de cualquiera de sus 8 esquinas y bordes o usa ➖/➕ en la barra superior para redimensionarla libremente, y haz <b>doble clic / doble toque</b> para renombrarla. Arrastra el fondo para paneo o usa la rueda/pellizco para zoom.';
      html += '</div>';
    }

    // Popovers de texturas, color, icono, plantas
    html += '<div class="popover-menu house-popover-menu" id="popoverTexture" style="display:none;">';
    html += '  <div class="pop-header">Textura de Suelo de la Habitación</div>';
    html += '  <div class="house-texture-grid" id="textureGrid"></div>';
    html += '</div>';

    html += '<div class="popover-menu house-popover-menu" id="popoverColor" style="display:none;">';
    html += '  <div class="pop-header">Color del Borde y Tema</div>';
    html += '  <div class="color-grid" id="colorGrid"></div>';
    html += '</div>';

    html += '<div class="popover-menu house-popover-menu" id="popoverIcon" style="display:none;">';
    html += '  <div class="pop-header">Icono Temático</div>';
    html += '  <div class="icon-grid" id="iconGrid"></div>';
    html += '</div>';

    html += '<div class="popover-menu house-popover-menu" id="popoverFloor" style="display:none;">';
    html += '  <div class="pop-header">Mover a Otra Planta</div>';
    html += '  <div id="floorMoveList" style="display:flex;flex-direction:column;gap:5px;"></div>';
    html += '</div>';

    // Inspector de Habitación
    html += '<div id="houseInspectorContainer">';
    if(houseState.selectedRoomId){
      html += renderRoomPanel(houseState.selectedRoomId);
    } else {
      html += '<div style="font-size:0.9rem;color:var(--ink-faint);text-align:center;padding:14px;font-style:italic;">💡 Toca una estancia del plano para ver su baúl y de quién es.</div>';
    }
    html += '</div>';

    html += '</div>'; // Fin house-blueprint-section
  }

  html += '</div>'; // Fin section house-section
  html += '</div>'; // Fin house-container
  main.innerHTML = html;

  if(tab === "plano"){
    setTimeout(function(){
      initOrRenderHouseKonvaStage();
    }, 10);
  }
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

// Mejoras que tiene de verdad la casa (solo si aún no existe la tabla house_perks)
var HOUSE_REAL_UPGRADES = [
  { icon: "🗡️", name: "Daga", desc: "Una daga que defiende la casa." },
  { icon: "🧭", name: "Buen camino", desc: "Al andar, la casa sabe por dónde ir para hacerse menos daño." }
];

// Datos secretos del máster (house_secrets). Solo en memoria: nunca en localStorage ni en el tiempo real.
var houseSecrets = {};

function getActiveHousePerks(){
  if(!Array.isArray(houseState.perks)){
    return HOUSE_REAL_UPGRADES.map(function(u){ return { icon: u.icon, name: u.name, description: u.desc }; });
  }
  return houseState.perks.filter(function(p){ return !p.archived; }).sort(function(a, b){ return (a.sort_order || 0) - (b.sort_order || 0); });
}

function canEditHousePerks(){
  return (typeof isGM === "function" && isGM()) && houseState.remote && Array.isArray(houseState.perks);
}

function renderHouseUpgradesBox(){
  var html = '<div class="house-info-box" id="housePerksBox">';
  var perks = getActiveHousePerks();
  var canEdit = canEditHousePerks();
  if(!perks.length){
    html += '  <div class="house-info-empty house-empty-state">';
    html += '    <img src="images/iconos/casa.svg" alt="" class="house-empty-icon" width="48" height="48">';
    html += '    <p class="house-empty-text">Aún no hay mejoras. Cuando la casa suba de nivel, aparecerán aquí.</p>';
    html += '  </div>';
  }
  perks.forEach(function(p){
    html += '  <div class="house-perk-card">';
    html += '    <span class="house-perk-icon">' + esc(p.icon || "✨") + '</span>';
    html += '    <div class="house-perk-text">';
    html += '      <div class="house-perk-name">' + esc(p.name || "") + '</div>';
    if(p.description) html += '      <div class="house-perk-desc">' + esc(p.description) + '</div>';
    html += '    </div>';
    if(canEdit){
      html += '    <button type="button" class="btn-compact house-perk-more" data-action="open-house-perks-editor" aria-label="Editar mejoras" title="Editar mejoras">⋯</button>';
    }
    html += '  </div>';
  });
  html += '</div>';
  return html;
}

async function fetchHouseSecrets(){
  houseSecrets = {};
  if(!(typeof isGM === "function" && isGM()) || !houseState.house) return;
  var res = await supabaseClient.from("house_secrets").select("id,data").eq("house_id", houseState.house.id);
  if(res.error || !res.data) return;
  res.data.forEach(function(row){ houseSecrets[row.id] = row.data || {}; });
}

function openHouseGmModal(title, bodyHtml){
  var old = document.getElementById("houseGmModalOverlay");
  var scroll = 0;
  if(old){
    var oldBox = old.querySelector(".house-modal-box");
    if(oldBox) scroll = oldBox.scrollTop;
    old.remove();
  }
  var overlay = document.createElement("div");
  overlay.className = "house-modal-overlay";
  overlay.id = "houseGmModalOverlay";
  overlay.innerHTML = '<div class="house-modal-box">' +
    '  <div class="house-modal-header">' +
    '    <h3 class="house-modal-title">' + title + '</h3>' +
    '    <button class="house-perk-close" data-action="close-house-modal" aria-label="Cerrar">&times;</button>' +
    '  </div>' + bodyHtml + '</div>';
  document.body.appendChild(overlay);
  overlay.querySelector(".house-modal-box").scrollTop = scroll;
}

function openHousePerksEditor(){
  var all = Array.isArray(houseState.perks) ? houseState.perks : [];
  var active = getActiveHousePerks();
  var archived = all.filter(function(p){ return p.archived; });
  var html = '';
  active.forEach(function(p, i){
    html += '<div class="house-perk-edit" data-perk-id="' + esc(p.id) + '">';
    html += '  <div class="house-perk-edit-top">';
    html += '    <input type="text" class="house-perk-in-icon" maxlength="4" value="' + esc(p.icon || "") + '" aria-label="Icono">';
    html += '    <input type="text" class="house-perk-in-name" maxlength="60" value="' + esc(p.name || "") + '" placeholder="Nombre" aria-label="Nombre">';
    html += '  </div>';
    html += '  <textarea class="house-perk-in-desc" rows="2" maxlength="300" placeholder="Descripción corta" aria-label="Descripción">' + esc(p.description || "") + '</textarea>';
    html += '  <div class="house-perk-edit-btns">';
    html += '    <button class="house-perk-mini" data-action="house-perk-move" data-perk-id="' + esc(p.id) + '" data-dir="-1"' + (i === 0 ? ' disabled' : '') + ' aria-label="Subir">▲</button>';
    html += '    <button class="house-perk-mini" data-action="house-perk-move" data-perk-id="' + esc(p.id) + '" data-dir="1"' + (i === active.length - 1 ? ' disabled' : '') + ' aria-label="Bajar">▼</button>';
    html += '    <button class="house-perk-mini" data-action="house-perk-archive" data-perk-id="' + esc(p.id) + '">Archivar</button>';
    html += '    <button class="house-perk-mini gold" data-action="house-perk-save" data-perk-id="' + esc(p.id) + '">Guardar</button>';
    html += '  </div>';
    html += '</div>';
  });
  html += '<div class="house-perk-edit house-perk-new">';
  html += '  <div class="house-info-sub">Nueva mejora</div>';
  html += '  <div class="house-perk-edit-top">';
  html += '    <input type="text" id="housePerkNewIcon" class="house-perk-in-icon" maxlength="4" value="✨" aria-label="Icono">';
  html += '    <input type="text" id="housePerkNewName" class="house-perk-in-name" maxlength="60" placeholder="Nombre" aria-label="Nombre">';
  html += '  </div>';
  html += '  <textarea id="housePerkNewDesc" class="house-perk-in-desc" rows="2" maxlength="300" placeholder="Descripción corta" aria-label="Descripción"></textarea>';
  html += '  <div class="house-perk-edit-btns"><button class="house-perk-mini gold" data-action="house-perk-add">➕ Añadir</button></div>';
  html += '</div>';
  if(archived.length){
    html += '<div class="house-info-sub">Archivadas</div>';
    archived.forEach(function(p){
      html += '<div class="house-perk-archived"><span>' + esc(p.icon || "") + ' ' + esc(p.name || "") + '</span>';
      html += '<button class="house-perk-mini" data-action="house-perk-restore" data-perk-id="' + esc(p.id) + '">Recuperar</button></div>';
    });
  }
  openHouseGmModal("✏️ Mejoras de la casa", html);
}

async function refreshHousePerksAfterChange(reopen){
  if(typeof realtimeChannel !== "undefined" && realtimeChannel && typeof realtimeChannel.send === "function"){
    try { realtimeChannel.send({ type: "broadcast", event: "house_general_update", payload: {} }).catch(function(){}); } catch(e){}
  }
  var res = await supabaseClient.from("house_perks").select("*").eq("house_id", houseState.house.id).order("sort_order", { ascending: true });
  if(!res.error && res.data) houseState.perks = res.data;
  saveHouseLocalData();
  if(houseState.active) renderHouseView();
  if(reopen) reopen();
}

async function updateHousePerk(id, fields){
  fields.updated_at = new Date().toISOString();
  var res = await supabaseClient.from("house_perks").update(fields).eq("id", id).select();
  if(res.error || !res.data || !res.data.length){
    if(typeof showToast === "function") showToast("No se ha podido guardar la mejora.", "warning");
    return false;
  }
  return true;
}

async function handleHousePerkAction(act, btn){
  if(!canEditHousePerks()) return;
  var perkId = btn.getAttribute("data-perk-id");
  if(act === "open-house-perks-editor"){
    openHousePerksEditor();
  } else if(act === "house-perk-save"){
    var box = btn.closest(".house-perk-edit");
    var name = box.querySelector(".house-perk-in-name").value.trim();
    if(!name){ if(typeof showToast === "function") showToast("Ponle un nombre a la mejora.", "warning"); return; }
    if(await updateHousePerk(perkId, {
      icon: box.querySelector(".house-perk-in-icon").value.trim() || "✨",
      name: name,
      description: box.querySelector(".house-perk-in-desc").value.trim()
    })){
      if(typeof showToast === "function") showToast("Mejora guardada.", "success");
      await refreshHousePerksAfterChange(openHousePerksEditor);
    }
  } else if(act === "house-perk-move"){
    var list = getActiveHousePerks().slice();
    var idx = list.findIndex(function(p){ return p.id === perkId; });
    var to = idx + parseInt(btn.getAttribute("data-dir"), 10);
    if(idx < 0 || to < 0 || to >= list.length) return;
    var moved = list.splice(idx, 1)[0];
    list.splice(to, 0, moved);
    for(var i = 0; i < list.length; i++){
      if(list[i].sort_order !== i + 1) await updateHousePerk(list[i].id, { sort_order: i + 1 });
    }
    await refreshHousePerksAfterChange(openHousePerksEditor);
  } else if(act === "house-perk-archive" || act === "house-perk-restore"){
    var restore = act === "house-perk-restore";
    var fields = { archived: !restore };
    if(restore) fields.sort_order = getActiveHousePerks().length + 1;
    if(await updateHousePerk(perkId, fields)) await refreshHousePerksAfterChange(openHousePerksEditor);
  } else if(act === "house-perk-add"){
    var newName = document.getElementById("housePerkNewName").value.trim();
    if(!newName){ if(typeof showToast === "function") showToast("Ponle un nombre a la mejora.", "warning"); return; }
    var maxOrder = (houseState.perks || []).reduce(function(m, p){ return Math.max(m, p.sort_order || 0); }, 0);
    var ins = await supabaseClient.from("house_perks").insert({
      house_id: houseState.house.id,
      icon: document.getElementById("housePerkNewIcon").value.trim() || "✨",
      name: newName,
      description: document.getElementById("housePerkNewDesc").value.trim(),
      sort_order: maxOrder + 1
    }).select();
    if(ins.error){
      if(typeof showToast === "function") showToast("No se ha podido añadir la mejora.", "warning");
      return;
    }
    await refreshHousePerksAfterChange(openHousePerksEditor);
  } else if(act === "open-house-secrets"){
    await fetchHouseSecrets();
    openHouseSecretsPanel();
  } else if(act === "house-secret-hp"){
    var cur = document.getElementById("houseSecretHp");
    var max = document.getElementById("houseSecretHpMax");
    var target = btn.getAttribute("data-field") === "max" ? max : cur;
    target.value = Math.max(0, (parseInt(target.value, 10) || 0) + parseInt(btn.getAttribute("data-delta"), 10));
    await saveHouseSecretRow("house:" + houseState.house.id, readHouseSecretHouseForm(), false);
  } else if(act === "house-secret-stat-add"){
    var rows = btn.closest(".house-secret-perk").querySelector(".house-secret-stats");
    rows.insertAdjacentHTML("beforeend", renderHouseSecretStatRow({ name: "", value: "" }));
    var inputs = rows.querySelectorAll(".house-secret-stat-name");
    if(inputs.length) inputs[inputs.length - 1].focus();
  } else if(act === "house-secret-stat-remove"){
    btn.closest(".house-secret-stat").remove();
  } else if(act === "house-secrets-save"){
    var ok = await saveHouseSecretRow("house:" + houseState.house.id, readHouseSecretHouseForm(), true);
    var perkBoxes = document.querySelectorAll("#houseGmModalOverlay .house-secret-perk[data-perk-id]");
    for(var k = 0; k < perkBoxes.length; k++){
      var stats = [];
      perkBoxes[k].querySelectorAll(".house-secret-stat").forEach(function(row){
        var n = row.querySelector(".house-secret-stat-name").value.trim();
        var v = row.querySelector(".house-secret-stat-value").value.trim();
        if(n || v) stats.push({ name: n, value: v });
      });
      var data = { stats: stats, notes: perkBoxes[k].querySelector(".house-secret-perk-notes").value };
      ok = (await saveHouseSecretRow("perk:" + perkBoxes[k].getAttribute("data-perk-id"), data, true)) && ok;
    }
    if(typeof showToast === "function") showToast(ok ? "Panel secreto guardado." : "No se ha podido guardar todo el panel secreto.", ok ? "success" : "warning");
    if(ok) openHouseSecretsPanel();
  }
}

function readHouseSecretHouseForm(){
  return {
    hp: parseInt(document.getElementById("houseSecretHp").value, 10) || 0,
    hp_max: parseInt(document.getElementById("houseSecretHpMax").value, 10) || 0,
    notes: document.getElementById("houseSecretNotes").value
  };
}

async function saveHouseSecretRow(id, data, quiet){
  var res = await supabaseClient.from("house_secrets").upsert({
    id: id,
    house_id: houseState.house.id,
    data: data,
    updated_at: new Date().toISOString()
  }).select();
  if(res.error || !res.data || !res.data.length){
    if(!quiet && typeof showToast === "function") showToast("No se ha podido guardar el panel secreto.", "warning");
    return false;
  }
  houseSecrets[id] = data;
  return true;
}

function renderHouseSecretStatRow(s){
  return '<div class="house-secret-stat">' +
    '<input type="text" class="house-secret-stat-name" maxlength="40" placeholder="Estadística" value="' + esc(s.name || "") + '" aria-label="Estadística">' +
    '<input type="text" class="house-secret-stat-value" maxlength="40" placeholder="Valor" value="' + esc(s.value || "") + '" aria-label="Valor">' +
    '<button class="house-perk-mini" data-action="house-secret-stat-remove" aria-label="Quitar">✕</button></div>';
}

function openHouseSecretsPanel(){
  var hs = houseSecrets["house:" + houseState.house.id] || {};
  var html = '<div class="house-secret-note">Solo lo ves tú. Los jugadores no reciben nada de esto.</div>';
  html += '<div class="house-secret-perk">';
  html += '  <div class="house-perk-name">🏠 La casa</div>';
  [["", "Vida", "houseSecretHp", hs.hp], ["max", "Vida máxima", "houseSecretHpMax", hs.hp_max]].forEach(function(f){
    html += '  <div class="house-secret-hp-row"><span class="house-secret-hp-label">' + f[1] + '</span>';
    html += '<button class="house-perk-mini" data-action="house-secret-hp" data-field="' + f[0] + '" data-delta="-1" aria-label="Restar">−</button>';
    html += '<input type="number" id="' + f[2] + '" class="house-secret-hp-in" min="0" value="' + (parseInt(f[3], 10) || 0) + '" aria-label="' + f[1] + '">';
    html += '<button class="house-perk-mini" data-action="house-secret-hp" data-field="' + f[0] + '" data-delta="1" aria-label="Sumar">+</button></div>';
  });
  html += '  <textarea id="houseSecretNotes" class="house-perk-in-desc" rows="3" placeholder="Notas del máster sobre la casa" aria-label="Notas de la casa">' + esc(hs.notes || "") + '</textarea>';
  html += '</div>';
  getActiveHousePerks().forEach(function(p){
    var ps = houseSecrets["perk:" + p.id] || {};
    html += '<div class="house-secret-perk" data-perk-id="' + esc(p.id) + '">';
    html += '  <div class="house-perk-name">' + esc(p.icon || "") + ' ' + esc(p.name || "") + '</div>';
    html += '  <div class="house-secret-stats">';
    (Array.isArray(ps.stats) ? ps.stats : []).forEach(function(s){ html += renderHouseSecretStatRow(s); });
    html += '  </div>';
    html += '  <button class="house-perk-mini" data-action="house-secret-stat-add">➕ Estadística</button>';
    html += '  <textarea class="house-perk-in-desc house-secret-perk-notes" rows="2" placeholder="Notas secretas" aria-label="Notas secretas">' + esc(ps.notes || "") + '</textarea>';
    html += '</div>';
  });
  html += renderHouseRoomEditorsList();
  html += '<button class="house-perk-gm-btn gold" data-action="house-secrets-save">Guardar panel secreto</button>';
  openHouseGmModal("🔒 Panel secreto", html);
}

// Interruptor por jugador: puede mover y cambiar el tamaño de su habitación (se guarda al tocarlo)
function renderHouseRoomEditorsList(){
  var editors = houseRoomEditors();
  var seen = {};
  var html = '<div class="house-secret-perk" id="houseRoomEditorsList">';
  html += '  <div class="house-perk-name">🛏️ Puede editar su habitación</div>';
  html += '  <div class="house-secret-note">Mover y cambiar el tamaño, solo de su habitación. Los demás solo usan el baúl.</div>';
  (houseState.rooms || []).forEach(function(r){
    var cid = r.owner_character_id;
    if(!cid || seen[cid]) return;
    seen[cid] = true;
    var on = editors.indexOf(cid) !== -1;
    var ch = ((typeof state !== "undefined" && state.characters) || []).find(function(c){ return c.id === cid || c.db_id === cid; });
    var name = (ch && ch.name) || getRoomOwnerInfo(cid).name;
    html += '  <div class="house-secret-hp-row"><span class="house-secret-hp-label">' + esc(name) + '</span>';
    html += '<button class="house-perk-mini" data-action="toggle-house-room-editor" data-char-id="' + esc(cid) + '" aria-pressed="' + on + '">' + (on ? '✅ Sí' : '🚫 No') + '</button></div>';
  });
  if(!Object.keys(seen).length) html += '  <div class="house-secret-note">Ninguna habitación tiene dueño todavía.</div>';
  html += '</div>';
  return html;
}

var HOUSE_PERK_ACTIONS = ["open-house-perks-editor", "house-perk-save", "house-perk-move", "house-perk-archive", "house-perk-restore", "house-perk-add",
  "open-house-secrets", "house-secret-hp", "house-secret-stat-add", "house-secret-stat-remove", "house-secrets-save"];

// Misiones que el máster ha marcado como Casa en el apartado Misiones
function getHouseQuests(){
  var list = (typeof state !== "undefined" && Array.isArray(state.quests)) ? state.quests : [];
  return list.filter(function(q){ return q && q.house === true; });
}

// Nivel de la casa calculado a partir de misiones cumplidas
function getHouseLevel(){
  var done = getHouseQuests().filter(function(q){ return q && q.status === "completada"; });
  if(!done.length) return 0;
  var maxLvl = -1;
  var regex = /nivel\s*(\d+)/i;
  done.forEach(function(q){
    var m1 = q.reward ? String(q.reward).match(regex) : null;
    var m2 = q.title ? String(q.title).match(regex) : null;
    if(m1){
      var n1 = parseInt(m1[1], 10);
      if(!isNaN(n1) && n1 > maxLvl) maxLvl = n1;
    }
    if(m2){
      var n2 = parseInt(m2[1], 10);
      if(!isNaN(n2) && n2 > maxLvl) maxLvl = n2;
    }
  });
  if(maxLvl >= 0) return maxLvl;
  return done.length;
}

function isHouseTaskDone(t){
  if(!t) return false;
  if(t.done) return true;
  var target = parseInt(t.target, 10) || 0;
  var cur = parseInt(t.current, 10) || 0;
  if(target > 1 && cur >= target) return true;
  return false;
}

function renderHouseQuestsBox(){
  var quests = getHouseQuests();
  var active = quests.filter(function(q){ return !q.status || q.status === "activa"; });
  var done = quests.filter(function(q){ return q.status === "completada"; });
  var html = '<div class="house-info-box" id="houseQuestsBox">';

  // Sección "En curso"
  html += '  <div class="house-info-sub">En curso</div>';
  if(!quests.length){
    html += '  <div class="house-info-empty house-empty-state">';
    html += '    <img src="images/iconos/casa.svg" alt="" class="house-empty-icon" width="48" height="48">';
    html += '    <p class="house-empty-text">El máster puede marcar misiones como Casa en Misiones.</p>';
    html += '  </div>';
  } else if(!active.length){
    html += '  <div class="house-info-empty house-empty-state">';
    html += '    <img src="images/iconos/casa.svg" alt="" class="house-empty-icon" width="48" height="48">';
    html += '    <p class="house-empty-text">Ninguna misión de la casa en curso.</p>';
    html += '  </div>';
  } else {
    active.forEach(function(q){
      var tasks = Array.isArray(q.tasks) ? q.tasks : [];
      var doneCount = 0;
      tasks.forEach(function(t){ if(isHouseTaskDone(t)) doneCount++; });
      var pct = tasks.length > 0 ? Math.min(100, Math.round((doneCount / tasks.length) * 100)) : 0;
      var progressText = doneCount + "/" + tasks.length + " tareas";

      html += '  <div class="house-quest-card">';
      html += '    <div class="house-quest-header">';
      html += '      <div class="house-quest-title">' + esc(q.title || "Misión") + '</div>';
      if(q.reward){
        html += '      <span class="house-reward-pill">' + esc(q.reward) + '</span>';
      }
      html += '    </div>';
      html += '    <div class="house-quest-tasks-info">' + progressText + '</div>';
      html += '    <div class="house-progress"><span style="width:' + pct + '%"></span></div>';
      html += '    <button class="house-quest-open-btn" data-action="open-house-quest" data-quest-id="' + esc(q.id || "") + '">Abrir en Misiones</button>';
      html += '  </div>';
    });
  }

  // Sección "Historial"
  if(done.length){
    html += '  <div class="house-info-sub" style="margin-top:10px;">Historial</div>';
    html += '  <div class="house-timeline">';
    var doneWithOrder = done.map(function(q, idx){
      return { quest: q, orderNum: idx + 1 };
    });
    var historyList = doneWithOrder.slice().reverse();
    var regex = /nivel\s*(\d+)/i;

    historyList.forEach(function(item){
      var q = item.quest;
      var orderNum = item.orderNum;
      var m1 = q.reward ? String(q.reward).match(regex) : null;
      var m2 = q.title ? String(q.title).match(regex) : null;
      var levelNum = m1 ? parseInt(m1[1], 10) : (m2 ? parseInt(m2[1], 10) : null);

      var pillText = "";
      if(q.reward && !/nivel/i.test(q.reward)){
        pillText = q.reward;
      } else if(levelNum !== null && !isNaN(levelNum)){
        pillText = "⬆ Nivel " + levelNum;
      } else {
        pillText = "⬆ Nivel " + orderNum;
      }

      var tasks = Array.isArray(q.tasks) ? q.tasks : [];
      var doneCount = 0;
      tasks.forEach(function(t){ if(isHouseTaskDone(t)) doneCount++; });
      var progressText = doneCount + "/" + tasks.length + " tareas";

      html += '  <details class="house-hist-item">';
      html += '    <summary>';
      html += '      <span class="house-reward-pill big">' + esc(pillText) + '</span>';
      html += '      <span class="house-hist-title">' + esc(q.title || "Misión") + '</span>';
      html += '      <span class="house-hist-tasks-badge">' + progressText + '</span>';
      html += '    </summary>';
      if(tasks.length){
        html += '    <ul class="house-hist-task-list">';
        tasks.forEach(function(t){
          var isDone = isHouseTaskDone(t);
          var taskName = t.text || t.title || t.name || "Tarea";
          html += '      <li class="house-hist-task' + (isDone ? ' is-done' : '') + '">' + (isDone ? '✓ ' : '○ ') + esc(taskName) + '</li>';
        });
        html += '    </ul>';
      }
      html += '  </details>';
    });
    html += '  </div>';
  }

  html += '</div>';
  return html;
}

// Lleva a la pestaña Misiones y enseña esa misión
function openHouseQuest(questId){
  flushCanvaStudioSave();
  houseState.active = false;
  houseState.selectedRoomId = null;
  state.activeTab = "mision";
  state.questTypeFilter = "all";
  var hq = (state.quests || []).find(function(x){ return x.id === questId; });
  if(hq){ state.questStatusFilter = questStatusOf(hq); state.questOpenId = hq.id; }
  if(typeof saveState === "function") saveState(true);
  if(typeof renderTabbar === "function") renderTabbar();
  if(typeof renderTab === "function") renderTab();
  var card = questId ? document.getElementById("quest-" + questId) : null;
  if(card && card.scrollIntoView) card.scrollIntoView({ block: "start" });
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
    var textureClass = "tex-" + esc(r.room_type || "salon");
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
      '    <span class="house-room-plaque-icon">' + houseIconoTipo(r.room_type, "s") + '</span>' +
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
// Pestaña "Muebles" del inspector: solo lectura. Los muebles se cambian en el editor (Estudio).
function renderRoomSubgrid(r, canEdit, isGm, isEditMode){
  var all = (Array.isArray(r.furniture) ? r.furniture : []).concat(Array.isArray(r.decor) ? r.decor : []);
  var grid = getRoomFurnitureGrid(r);

  var html = '<div class="house-room-subgrid-wrap cs-readonly">';
  html += '  <div class="cs-readonly-head">';
  html += '    <span>' + all.length + (all.length === 1 ? ' elemento' : ' elementos') + ' en ' + esc(r.name) + '</span>';
  html += '    <button type="button" class="cs-open-btn" data-action="open-canva-studio" data-room-id="' + esc(r.id) + '">' + (canUserDecorateRoom(r) ? 'Editar muebles' : 'Ver muebles') + '</button>';
  html += '  </div>';
  html += '  <div class="cs-mini tex-' + esc(r.room_type || 'salon') + '" style="aspect-ratio:' + grid.cols + ' / ' + grid.rows + ';' + (r.color ? 'background:' + getRoomCustomBackground(r.color) + ';' : '') + '">' + renderRoomMiniLayout(r) + '</div>';
  if(all.length){
    html += '  <ul class="cs-mini-list">';
    all.forEach(function(it){
      if(!it) return;
      var s = getHouseItemSize(it);
      html += '<li><span>' + esc(canvaItemName(it)) + '</span><span>' + s.w + '×' + s.h + '</span></li>';
    });
    html += '  </ul>';
  }
  html += '</div>';
  return html;
}

// ============================================================================
// 7. INSPECTOR DE HABITACIÓN SEGMENTADO
// ============================================================================
// Panel inferior del modo Ver: lo importante para jugar (baúl y dueño) y un botón grande.
// "Abrir baúl" abre el inspector completo en la pestaña de muebles.
function renderRoomPanel(roomId){
  if(houseState.editMode || houseState.showRoomDetail) return renderRoomInspector(roomId);
  var r = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!r) return '';

  var owner = getRoomOwnerInfo(r.owner_character_id);
  var itemCount = getRoomItemCount(r);
  var isPassage = (r.room_type === "pasillo");

  var html = '<div class="house-room-sheet" id="houseRoomInspector">';
  html += '  <div class="house-sheet-handle"></div>';
  html += '  <div class="house-sheet-head">';
  html += '    <span class="house-sheet-icon">' + houseIconoEstancia(r.icon, r.room_type, "m") + '</span>';
  html += '    <h3 class="house-sheet-title">' + esc(r.name || "Estancia") + '</h3>';
  html += '    <button class="house-sheet-close" data-action="close-room-inspector" title="Cerrar" aria-label="Cerrar">&times;</button>';
  html += '  </div>';

  html += '  <div class="house-sheet-chips">';
  if(!isPassage) html += '    <span class="house-sheet-chip">📦 Baúl · ' + itemCount + (itemCount === 1 ? ' objeto' : ' objetos') + '</span>';
  if(owner && owner.name) html += '    <span class="house-sheet-chip">Habitación de ' + esc(owner.name) + '</span>';
  html += '  </div>';

  if(r.description){
    html += '  <div class="house-sheet-desc">' + esc(r.description) + '</div>';
  }

  if(!isPassage){
    html += '  <div class="house-sheet-actions">';
    html += '    <button class="house-sheet-btn primary" data-action="open-room-detail" data-tab="muebles">Abrir baúl</button>';
    html += '  </div>';
  }
  html += '</div>';
  return html;
}

function renderRoomInspector(roomId){
  var r = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!r) return '';

  var owner = getRoomOwnerInfo(r.owner_character_id);
  var canEdit = canUserEditRoom(r);
  var canChest = canUserUseChest(r);
  var canDecor = canUserDecorateRoom(r);
  var isGm = (typeof isGM === "function" && isGM());
  var isEditMode = (isGm && houseState.editMode);
  var roomUpgrades = (houseState.upgrades || []).filter(function(u){ return u.room_id === r.id; });
  var curChar = (typeof activeChar === "function") ? activeChar() : null;
  var currentTab = houseState.inspectorTab || "estancia";
  // Las mejoras por estancia ya no se muestran (los datos se quedan en la base)
  if(currentTab === "buffs") currentTab = "estancia";

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
    if(canDecor){
      pHtml += '        <button class="btn-compact" data-action="open-edit-room-modal" data-room-id="' + r.id + '">✏️ Editar</button>';
    }
    if(isGm){
      pHtml += '        <button class="btn-compact" data-action="delete-house-room" data-room-id="' + r.id + '" style="color:#E74C3C;border-color:rgba(231,76,60,0.4);">🗑️ Eliminar</button>';
    }
    pHtml += '      </div>';
    pHtml += '    </div>';
    if(canDecor){
      pHtml += '    <div class="house-inspector-color-row">';
      pHtml += '      <span style="font-size:0.75rem;color:var(--gold-light);font-weight:600;">🎨 Suelo / Tono de la Galería:</span>';
      pHtml += '      ' + renderColorPaletteBar(r.id, r.color);
      pHtml += '    </div>';
    }
    pHtml += '  </div>';
    pHtml += '</div>';
    return pHtml;
  }

  var html = '<div class="house-inspector-box" id="houseRoomInspector">';

  // Cabecera del Inspector
  html += '  <div class="house-inspector-header">';
  html += '    <div>';
  html += '      <h3 class="house-inspector-title">' + houseIconoTipo(r.room_type, "s") + ' ' + esc(r.name) + '</h3>';
  html += '      <div class="house-inspector-meta">';
  html += '        <span class="house-room-type-tag ' + (r.room_type || 'otro') + '">' + getRoomTypeLabel(r.room_type) + '</span>';
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
  html += '  </div>';

  // CONTENIDO PESTAÑA 1: ESTANCIA
  if(currentTab === "estancia"){
    html += '  <div class="house-inspector-desc">' + (r.description ? esc(r.description) : '<i>Sin descripción ni detalles decorativos.</i>') + '</div>';

    if(canDecor){
      html += '  <div class="house-inspector-color-row" style="margin-top:10px;">';
      html += '    <span style="font-size:0.75rem;color:var(--gold-light);font-weight:600;">🎨 Suelo / Color de la Estancia:</span>';
      html += '    ' + renderColorPaletteBar(r.id, r.color);
      html += '  </div>';
    }

    html += '  <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-top:12px;">';
    html += '    <button class="btn-solid-gold" data-action="open-canva-studio" data-room-id="' + r.id + '" style="font-size:0.85rem;padding:8px 14px;min-height:44px;">' + (canDecor ? 'Editar muebles' : 'Ver muebles') + '</button>';
    if(canDecor){
      html += '    <button class="btn-compact" data-action="open-edit-room-modal" data-room-id="' + r.id + '">✏️ ' + (isGm ? 'Modificar Estancia' : 'Decorar mi habitación') + '</button>';
    }
    if(isGm){
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
        if(canChest){
          html += '          <button class="btn-compact" data-action="open-add-item-modal" data-room-id="' + r.id + '" data-furniture-id="' + fur.id + '" style="font-size:0.68rem;padding:2px 6px;">➕ Guardar Objeto</button>';
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
            if(canChest){
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
      var evClass = esc(ev.event_type || "default");
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
  if(!canUserUseChest(r)){
    if(typeof showToast === "function") showToast("Este baúl es de la habitación de otro personaje.", "warning");
    return;
  }

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
    w: 2,
    h: 2,
    pos_x: 0,
    pos_y: 0,
    rotation: 0,
    g: HOUSE_SUBCELLS,
    items: []
  };

  if(!placeNewHouseItem(r, newFur)){ houseLayoutWarn("No queda hueco libre en la estancia."); return; }

  r.furniture.push(newFur);
  saveRoomChangesToRemoteAndBroadcast(r, "furniture");
  closeHouseModal();
  renderHouseView();

  if(typeof showToast === "function") showToast("Mueble '" + newFur.name + "' instalado.", "success");
}

async function confirmAddFurnitureItemAction(){
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

  if(isHouseRemote()){
    closeHouseModal();
    var res = await supabaseClient.from("house_items").insert({
      room_id: r.id, furniture_id: fur.id, name: itName, qty: itQty, notes: itNotes, sort: fur.items.length
    }).select().maybeSingle();
    if(res.error || !res.data){
      console.warn("Aviso guardando objeto del baúl:", res.error && (res.error.message || res.error));
      if(typeof showToast === "function") showToast("No se ha podido guardar el objeto (sin permiso o sin conexión).", "warning");
      return;
    }
    if(!fur.items.some(function(it){ return it.id === res.data.id; })) fur.items.push(houseItemFromRow(res.data));
    saveHouseLocalData();
    renderHouseView();
    if(typeof showToast === "function") showToast("Objeto guardado en " + fur.name + ".", "success");
    return;
  }

  fur.items.push({ name: itName, qty: itQty, notes: itNotes });

  saveRoomChangesToRemoteAndBroadcast(r, "furniture");
  closeHouseModal();
  renderHouseView();

  if(typeof showToast === "function") showToast("Objeto guardado en " + fur.name + ".", "success");
}

async function deleteFurnitureAction(roomId, furnitureId){
  var r = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!r || !Array.isArray(r.furniture)) return;

  var fObj = r.furniture.find(function(f){ return f.id === furnitureId; });
  if(!(await confirmarQuitar(fObj && fObj.name ? fObj.name : "este mueble", "Se quita también su contenido."))) return;

  r.furniture = r.furniture.filter(function(f){ return f.id !== furnitureId; });
  saveRoomChangesToRemoteAndBroadcast(r, "furniture");
  renderHouseView();
}

async function deleteFurnitureItemAction(roomId, furnitureId, itemIdx){
  var r = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!r || !Array.isArray(r.furniture)) return;

  var fur = r.furniture.find(function(f){ return f.id === furnitureId; });
  if(!fur || !Array.isArray(fur.items)) return;

  var item = fur.items[itemIdx];
  if(item && item.id && isHouseRemote()){
    var res = await supabaseClient.from("house_items").delete().eq("id", item.id).select();
    if(res.error || !res.data || res.data.length === 0){
      if(typeof showToast === "function") showToast("No se ha podido sacar el objeto (sin permiso o sin conexión).", "warning");
      return;
    }
    fur.items = fur.items.filter(function(it){ return it.id !== item.id; });
    saveHouseLocalData();
    renderHouseView();
    return;
  }

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
  html += '      <input type="color" id="editRoomCustomColor" value="' + esc(safeColor(r.color, '#2a1e16')) + '" data-action="modal-custom-color" title="Color personalizado">';
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
  var o6 = document.getElementById("houseGmModalOverlay");
  if(o6) o6.remove();
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
  if(!roomId) return false;
  var rObj = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!(await confirmarQuitar(rObj && rObj.name ? rObj.name : "esta estancia", "Se quita del plano de la casa."))) return false;

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
  return true;
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
  flushCanvaStudioSave();
  houseState.active = false;
  houseState.selectedRoomId = null;
  if(typeof state !== "undefined"){
    state.activeTab = "ficha";
    if(typeof saveState === "function") saveState(true);
  }
  if(typeof renderTabbar === "function") renderTabbar();
  if(typeof renderTab === "function") renderTab();
}

var HOUSE_GM_ONLY_ACTIONS = ["open-house-perks-editor", "house-perk-save", "house-perk-move", "house-perk-archive", "house-perk-restore", "house-perk-add",
  "open-house-secrets", "house-secret-hp", "house-secret-stat-add", "house-secret-stat-remove", "house-secrets-save", "quick-delete-selected-room", "quick-duplicate-selected-room", "quick-toggle-floor-menu", "open-preset-room-modal", "open-add-floor-modal", "toggle-house-room-editor", "expand-house-floor"];
// Lo único que puede hacer un jugador con permiso en su habitación: moverla y cambiarle el tamaño
var HOUSE_ROOM_GEOM_ACTIONS = ["quick-step-room-size", "nudge-room", "resize-room"];
var HOUSE_ROOM_EDIT_ACTIONS = ["quick-rename-selected-room", "quick-step-room-size", "quick-toggle-texture-menu", "quick-toggle-color-menu", "quick-toggle-icon-menu", "nudge-room", "resize-room", "set-room-color", "open-edit-room-modal",
  "canva-insert-asset", "canva-rotate-item", "canva-duplicate-item", "canva-delete-item", "canva-change-w", "canva-change-h", "canva-nudge-item",
  "canva-size-view", "canva-nudge-view", "canva-relocate-item", "canva-undo", "canva-redo", "canva-open-catalog", "canva-rename-start", "canva-rename-save"];

// ============================================================================
// 11. GESTOR DE EVENTOS DELEGADOS PARA LA CASA
// ============================================================================
document.addEventListener("click", function(e){
  var btn = e.target.closest("[data-action]");
  if(!btn) return;

  var act = btn.getAttribute("data-action");

  // Permisos de edición del plano (ver canUserEditRoomGeometry)
  var houseIsGm = (typeof isGM === "function" && isGM());
  if(HOUSE_GM_ONLY_ACTIONS.indexOf(act) !== -1 && !houseIsGm) return;
  if(HOUSE_ROOM_EDIT_ACTIONS.indexOf(act) !== -1){
    var guardRoomId = btn.getAttribute("data-room-id") || houseState.selectedRoomId;
    var guardRoom = (houseState.rooms || []).find(function(x){ return x.id === guardRoomId; });
    if(!guardRoom || !canUserEditRoomGeometry(guardRoom)) return;
    if(!houseIsGm && HOUSE_ROOM_GEOM_ACTIONS.indexOf(act) === -1) return;
  }

  if(act === "set-house-tab"){
    var targetTab = btn.getAttribute("data-tab");
    if(targetTab === "plano" || targetTab === "mejoras" || targetTab === "misiones"){
      houseState.tab = targetTab;
      try {
        localStorage.setItem("krysalisHouseTab", targetTab);
      } catch(e){}
      renderHouseView();
    }
    return;
  } else if(act === "set-house-mode"){
    houseState.editMode = (btn.getAttribute("data-mode") === "editar") && canUserEditPlan();
    houseState.selectedRoomId = null;
    renderHouseView();
    return;
  } else if(act === "toggle-house-room-editor"){
    var reId = btn.getAttribute("data-char-id");
    setHouseRoomEditor(reId, houseRoomEditors().indexOf(reId) === -1);
    var reList = document.getElementById("houseRoomEditorsList");
    if(reList) reList.outerHTML = renderHouseRoomEditorsList();
    return;
  } else if(act === "open-room-detail"){
    houseState.inspectorTab = btn.getAttribute("data-tab") || "muebles";
    houseState.showRoomDetail = true;
    var detEl = document.getElementById("houseInspectorContainer");
    if(detEl && houseState.selectedRoomId) detEl.innerHTML = renderRoomInspector(houseState.selectedRoomId);
    return;
  }

  if(act === "open-house-quest"){
    e.preventDefault();
    openHouseQuest(btn.getAttribute("data-quest-id"));
    return;
  }

  if(HOUSE_PERK_ACTIONS.indexOf(act) !== -1){
    e.preventDefault();
    handleHousePerkAction(act, btn);
    return;
  }

  if(act === "open-house-view"){
    e.preventDefault();
    openHouseView();
  } else if(act === "back-from-house-view"){
    e.preventDefault();
    backFromHouseView();
  } else if(act === "switch-house-floor"){
    var fl = parseInt(btn.getAttribute("data-floor"), 10) || btn.getAttribute("data-floor") || 1;
    houseState.activeFloor = fl;
    deselectKonvaRoom();
    renderHouseView();
  } else if(act === "switch-inspector-tab"){
    var inspTab = btn.getAttribute("data-tab") || "estancia";
    houseState.inspectorTab = inspTab;
    var inspEl = document.getElementById("houseInspectorContainer");
    if(inspEl && houseState.selectedRoomId){
      inspEl.innerHTML = renderRoomInspector(houseState.selectedRoomId);
    } else {
      renderHouseView();
    }
  } else if(act === "toggle-house-edit-mode"){
    houseState.editMode = !houseState.editMode;
    renderHouseView();
  } else if(act === "open-preset-room-modal"){
    e.preventDefault();
    openHousePresetModal();
  } else if(act === "close-preset-room-modal"){
    var pm = document.getElementById("housePresetModalBackdrop");
    if(pm) pm.remove();
  } else if(act === "select-preset-room"){
    var pIdx = parseInt(btn.getAttribute("data-preset-idx"), 10);
    if(!isNaN(pIdx) && HOUSE_PRESETS[pIdx]){
      quickAddRoomPreset(HOUSE_PRESETS[pIdx]);
    }
    var pm2 = document.getElementById("housePresetModalBackdrop");
    if(pm2) pm2.remove();
  } else if(act === "quick-delete-selected-room"){
    e.preventDefault();
    quickDeleteSelectedRoom();
  } else if(act === "quick-rename-selected-room"){
    var qR = (houseState.rooms || []).find(function(x){ return x.id === houseState.selectedRoomId; });
    if(qR && houseKonvaSelectedGroup) startKonvaRename(houseKonvaSelectedGroup, qR);
  } else if(act === "quick-step-room-size"){
    e.stopPropagation();
    var qAxis = btn.getAttribute("data-axis");
    var qDelta = parseInt(btn.getAttribute("data-delta"), 10) || 0;
    quickStepRoomSize(qAxis, qDelta);
  } else if(act === "quick-toggle-texture-menu"){
    e.stopPropagation();
    toggleTexturePopover(btn);
  } else if(act === "quick-toggle-color-menu"){
    e.stopPropagation();
    toggleColorPopover(btn);
  } else if(act === "quick-toggle-icon-menu"){
    e.stopPropagation();
    toggleIconPopover(btn);
  } else if(act === "quick-toggle-floor-menu"){
    e.stopPropagation();
    toggleFloorPopover(btn);
  } else if(act === "quick-duplicate-selected-room"){
    quickDuplicateSelectedRoom();
  } else if(act === "toggle-house-grid-snap"){
    toggleKonvaGridSnap();
  } else if(act === "open-add-floor-modal"){
    var flName = prompt("Nombre de la nueva planta (ej: Buhardilla, Ático, Cripta, Torreón):", "Ático");
    if(flName) addHouseFloor(flName);
  } else if(act === "zoom-house-in"){
    applyHouseKonvaZoom(houseKonvaZoom + 0.15);
  } else if(act === "zoom-house-out"){
    applyHouseKonvaZoom(houseKonvaZoom - 0.15);
  } else if(act === "zoom-house-reset"){
    applyHouseKonvaZoom(1.0);
    if(houseKonvaStage){
      houseKonvaStage.position({ x: 0, y: 0 });
      houseKonvaStage.batchDraw();
    }
  } else if(act === "zoom-house-fit"){
    zoomFitHouse();
  } else if(act === "expand-house-floor"){
    expandHouseFloor(btn.getAttribute("data-side"));
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
  } else if(act === "subgrid-change-w"){
    e.stopPropagation();
    var sgRId = btn.getAttribute("data-room-id");
    var sgItmId = btn.getAttribute("data-item-id");
    var sgDelta = parseInt(btn.getAttribute("data-delta"), 10) || 0;
    canvaResizeItem(sgRId, sgItmId, sgDelta, 0);
  } else if(act === "subgrid-change-h"){
    e.stopPropagation();
    var sghRId = btn.getAttribute("data-room-id");
    var sghItmId = btn.getAttribute("data-item-id");
    var sghDelta = parseInt(btn.getAttribute("data-delta"), 10) || 0;
    canvaResizeItem(sghRId, sghItmId, 0, sghDelta);
  } else if(act === "open-canva-studio"){
    var csRoomId = btn.getAttribute("data-room-id") || houseState.selectedRoomId;
    if(csRoomId){
      flushCanvaStudioSave();
      houseState.studioRoomId = csRoomId;
      houseState.selectedItemId = null;
      houseState.studioCatalogOpen = false;
      canvaHintMsg = "";
      canvaResetHistory(csRoomId);
      renderHouseView();
      var csEl = document.getElementById("canvaStudio");
      var csTop = document.getElementById("topbar");
      if(csEl) window.scrollTo({ top: Math.max(0, csEl.getBoundingClientRect().top + window.scrollY - (csTop ? csTop.offsetHeight : 0) - 8), behavior: "instant" });
    }
  } else if(act === "close-canva-studio"){
    flushCanvaStudioSave();
    houseState.studioRoomId = null;
    houseState.selectedItemId = null;
    houseState.studioCatalogOpen = false;
    canvaResetHistory(null);
    renderHouseView();
  } else if(act === "canva-set-mode"){
    houseState.studioMode = (btn.getAttribute("data-mode") === "view") ? "view" : "edit";
    if(houseState.studioMode === "view") houseState.selectedItemId = null;
    canvaHintMsg = "";
    refreshCanvaStudio();
  } else if(act === "canva-toggle-rotview"){
    var rvRoom = canvaRoom();
    if(rvRoom){
      houseState.studioRotView = !canvaIsRotated(rvRoom);
      refreshCanvaStudio();
    }
  } else if(act === "canva-open-catalog"){
    houseState.studioCatalogOpen = true;
    refreshCanvaStudio();
  } else if(act === "canva-close-catalog" || (act === "canva-close-catalog-bg" && e.target === btn)){
    houseState.studioCatalogOpen = false;
    refreshCanvaStudio();
  } else if(act === "canva-select-category"){
    houseState.studioCategory = btn.getAttribute("data-category") || "todas";
    refreshCanvaStudio();
  } else if(act === "canva-insert-asset"){
    var insRoomId = btn.getAttribute("data-room-id") || houseState.studioRoomId;
    var insAssetId = btn.getAttribute("data-asset-id");
    canvaInsertAsset(insRoomId, insAssetId);
  } else if(act === "canva-deselect-item"){
    e.stopPropagation();
    houseState.selectedItemId = null;
    houseState.studioRenameId = null;
    refreshCanvaStudio();
  } else if(act === "canva-rename-start"){
    e.stopPropagation();
    houseState.studioRenameId = btn.getAttribute("data-item-id") || houseState.selectedItemId;
    refreshCanvaStudio();
    var renIn = document.getElementById("canvaRenameInput");
    if(renIn){ renIn.focus(); renIn.select(); }
  } else if(act === "canva-rename-save"){
    e.stopPropagation();
    var renSave = document.getElementById("canvaRenameInput");
    canvaRenameItem(btn.getAttribute("data-room-id") || houseState.studioRoomId, btn.getAttribute("data-item-id") || houseState.selectedItemId, renSave ? renSave.value : "");
  } else if(act === "canva-rename-cancel"){
    e.stopPropagation();
    houseState.studioRenameId = null;
    refreshCanvaStudio();
  } else if(act === "canva-undo" || act === "canva-redo"){
    canvaHideToast();
    canvaUndoRedo(act === "canva-redo");
  } else if(act === "canva-toast-close"){
    canvaHideToast();
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
  } else if(act === "canva-relocate-item"){
    e.stopPropagation();
    canvaRelocateItem(btn.getAttribute("data-room-id") || houseState.studioRoomId, btn.getAttribute("data-item-id") || houseState.selectedItemId);
  } else if(act === "canva-size-view"){
    e.stopPropagation();
    canvaResizeItemView(btn.getAttribute("data-room-id") || houseState.studioRoomId, btn.getAttribute("data-item-id") || houseState.selectedItemId,
      btn.getAttribute("data-axis"), parseInt(btn.getAttribute("data-delta"), 10) || 0);
  } else if(act === "canva-nudge-view"){
    e.stopPropagation();
    canvaNudgeItemView(btn.getAttribute("data-room-id") || houseState.studioRoomId, btn.getAttribute("data-item-id") || houseState.selectedItemId,
      parseInt(btn.getAttribute("data-dx"), 10) || 0, parseInt(btn.getAttribute("data-dy"), 10) || 0);
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

  // Cerrar popovers de la casa si se hace clic fuera
  if(!e.target.closest(".popover-menu") && !e.target.closest("[data-action^='quick-toggle-']")){
    closeAllHousePopovers();
  }
});

// Listener de eventos input (búsqueda Canva y selector de color personalizado)
document.addEventListener("input", function(e){
  if(e.target && e.target.getAttribute("data-action") === "canva-custom-color-input"){
    var cciRId = e.target.getAttribute("data-room-id");
    var cciRoom = (houseState.rooms || []).find(function(x){ return x.id === cciRId; });
    if(cciRoom && canUserDecorateRoom(cciRoom)) setRoomColor(cciRId, e.target.value);
  } else if(e.target && e.target.getAttribute("data-action") === "modal-custom-color"){
    var hiddenInp2 = document.getElementById("editRoomColorValue");
    if(hiddenInp2) hiddenInp2.value = e.target.value;
    var bar2 = e.target.closest(".house-color-palette-bar");
    if(bar2){
      bar2.querySelectorAll(".house-color-chip").forEach(function(c){ c.classList.remove("is-active"); });
    }
  }
});

// Sincronización automática entre dispositivos cuando la ventana recupera foco o visibilidad
if(typeof document !== "undefined" && typeof document.addEventListener === "function"){
  document.addEventListener("visibilitychange", function(){
    // Al salir de la app o cambiar de pestaña se guarda lo pendiente del editor de muebles
    if(document.visibilityState === "hidden") flushCanvaStudioSave();
    if(document.visibilityState === "visible" && houseState.active){
      fetchHouseRemoteData().then(function(){ renderHouseView(); });
    }
  });
}

if(typeof window !== "undefined" && typeof window.addEventListener === "function"){
  window.addEventListener("pagehide", flushCanvaStudioSave);
  // Al girar el móvil o cambiar el tamaño de la ventana, la estancia se vuelve a ajustar
  window.addEventListener("resize", function(){
    if(!houseState.studioRoomId) return;
    clearTimeout(canvaResizeTimer);
    canvaResizeTimer = setTimeout(function(){
      if(houseState.studioRoomId && document.getElementById("canvaStudioInner") && !canvaActiveDrag) refreshCanvaStudio();
    }, 150);
  });
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
