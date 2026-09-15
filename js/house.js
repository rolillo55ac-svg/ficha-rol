// ============================================================================
// SISTEMA EXPERIMENTAL "LA CASA" (PROTOTIPO BETA)
// Módulo 100% aislado: js/house.js
// ============================================================================

var CONFIG_ENABLE_HOUSE = true;

var houseState = {
  active: false,
  previousTab: "ficha",
  selectedRoomId: null,
  loading: false,
  house: null,
  rooms: [],
  upgrades: [],
  events: []
};

// Semilla local por defecto para modo local / sin conexión o tablas no migradas
function getSeedHouseData(){
  var houseId = "h0000000-0000-0000-0000-000000000001";
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
      {
        id: "r0000000-0000-0000-0000-000000000001",
        house_id: houseId,
        room_type: "salon",
        name: "Salón del Hogar Caliente",
        owner_character_id: null,
        level: 1,
        description: "Espaciosa sala central con chimenea encantada, sillones de terciopelo gastado y un atril donde reposa el Libro Guía.",
        pos_x: 0, pos_y: 0, width: 3, height: 2, floor: 1
      },
      {
        id: cocinaId,
        house_id: houseId,
        room_type: "cocina",
        name: "Cocina del Caldero Errante",
        owner_character_id: null,
        level: 1,
        description: "Cocina rústica donde el fuego nunca se apaga. Huele a especias raras y caldo caliente.",
        pos_x: 3, pos_y: 0, width: 3, height: 2, floor: 1
      },
      {
        id: cherkRoomId,
        house_id: houseId,
        room_type: "habitacion_personal",
        name: "Rincón Botánico de Cherk",
        owner_character_id: "a8039428-8ee7-4e31-baba-c6a1d8b6d8f3",
        level: 1,
        description: "Habitación húmeda y sombría repleta de frascos con musgos, nenúfares y brotes venenosos.",
        pos_x: 0, pos_y: 2, width: 2, height: 2, floor: 1
      },
      {
        id: "r0000000-0000-0000-0000-000000000004",
        house_id: houseId,
        room_type: "habitacion_personal",
        name: "Aposentos de Scarleth",
        owner_character_id: "5e9c545e-176a-4e99-a3e7-299f89fa0779",
        level: 1,
        description: "Estancia silenciosa con estanterías de pergaminos, velas violetas y un escritorio ordenado.",
        pos_x: 2, pos_y: 2, width: 2, height: 2, floor: 1
      },
      {
        id: "r0000000-0000-0000-0000-000000000005",
        house_id: houseId,
        room_type: "habitacion_personal",
        name: "Cuarto de Derek",
        owner_character_id: "d9dee50e-051d-4058-b4a5-d46c809fbb25",
        level: 1,
        description: "Habitación robusta con armero de madera pulida, afiladores de espadas y correajes.",
        pos_x: 4, pos_y: 2, width: 2, height: 2, floor: 1
      },
      {
        id: "r0000000-0000-0000-0000-000000000006",
        house_id: houseId,
        room_type: "habitacion_personal",
        name: "Taller de Bucky",
        owner_character_id: "4d8dd9b1-b5aa-430e-ae19-79c35b6c3c5e",
        level: 1,
        description: "Espacio lleno de herramientas curiosas, engranajes y pieles de animales curtidas.",
        pos_x: 0, pos_y: 4, width: 2, height: 2, floor: 1
      },
      {
        id: "r0000000-0000-0000-0000-000000000007",
        house_id: houseId,
        room_type: "habitacion_personal",
        name: "Estudio de Ink",
        owner_character_id: "ece1cdb6-f8c6-4010-b3e8-045887dc92a3",
        level: 1,
        description: "Estancia con bocetos en las paredes, tinta aromática y cojines para el descanso.",
        pos_x: 2, pos_y: 4, width: 2, height: 2, floor: 1
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
        effect_type: "narrativo",
        required_house_level: 1
      },
      {
        id: "u0000000-0000-0000-0000-000000000002",
        house_id: houseId,
        room_id: cherkRoomId,
        name: "Invernadero de Hongos y Venenos",
        description: "Permite cultivar especies vegetales tóxicas con mayor efectividad en cada descanso.",
        unlocked: false,
        effect_type: "narrativo",
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

// Inicialización de datos
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
        return;
      }
    }
  } catch(e){
    console.warn("Aviso cargando datos locales de La Casa:", e);
  }

  // Fallback a semilla inicial
  var seed = getSeedHouseData();
  houseState.house = seed.house;
  houseState.rooms = seed.rooms;
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
      events: houseState.events
    };
    localStorage.setItem("krysalis_house_beta_v1", JSON.stringify(payload));
  } catch(e){
    console.warn("No se pudo guardar localmente La Casa:", e);
  }
}

// Carga remota desde Supabase
async function fetchHouseRemoteData(){
  if(typeof supabaseClient === "undefined" || !supabaseClient || !navigator.onLine){
    loadHouseLocalData();
    return;
  }

  try {
    houseState.loading = true;
    var campaignId = "c0000000-0000-0000-0000-000000000001";

    // 1. House
    var houseRes = await supabaseClient.from("house").select("*").eq("campaign_id", campaignId).maybeSingle();
    if(houseRes.error || !houseRes.data){
      // Si la tabla no existe o no hay datos remotos, recurrimos a local
      loadHouseLocalData();
      houseState.loading = false;
      return;
    }
    houseState.house = houseRes.data;

    // 2. Rooms
    var roomsRes = await supabaseClient.from("house_rooms").select("*").eq("house_id", houseState.house.id).order("created_at", { ascending: true });
    if(!roomsRes.error && roomsRes.data && roomsRes.data.length > 0){
      houseState.rooms = roomsRes.data;
    }

    // 3. Upgrades
    var upgRes = await supabaseClient.from("house_upgrades").select("*").eq("house_id", houseState.house.id);
    if(!upgRes.error && upgRes.data){
      houseState.upgrades = upgRes.data;
    }

    // 4. Events
    var evRes = await supabaseClient.from("house_events").select("*").eq("house_id", houseState.house.id).order("created_at", { ascending: false }).limit(20);
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

// Auxiliar para obtener datos del personaje asignado a una habitación
function getRoomOwnerInfo(ownerCharId){
  if(!ownerCharId) return null;
  var chars = (typeof state !== "undefined" && state.characters) ? state.characters : [];
  var target = chars.find(function(c){
    return c.id === ownerCharId || c.db_id === ownerCharId;
  });
  if(target) return target;

  // Si no se encuentra en state.characters, buscar en los oficiales por nombre o ID común
  if(ownerCharId.includes("cherk")) return { name: "Cherk", portrait: "https://raw.githubusercontent.com/rolillo55ac-svg/ficha-rol/main/images/personajes/cherk.jpg" };
  if(ownerCharId.includes("scarleth") || ownerCharId.includes("5e9c")) return { name: "Scarleth", portrait: null };
  if(ownerCharId.includes("derek") || ownerCharId.includes("d9de")) return { name: "Derek", portrait: null };
  if(ownerCharId.includes("bucky") || ownerCharId.includes("4d8d")) return { name: "Bucky", portrait: null };
  if(ownerCharId.includes("ink") || ownerCharId.includes("ece1")) return { name: "Ink", portrait: null };

  return { name: "Personaje (" + ownerCharId.slice(0, 8) + ")", portrait: null };
}

// Permisos: ¿Puede el usuario actual editar la habitación?
function canUserEditRoom(room){
  if(typeof isGM === "function" && isGM()) return true;
  if(!room || !room.owner_character_id) return false;

  // Comprobar si el personaje activo del jugador es el dueño
  var curChar = (typeof activeChar === "function") ? activeChar() : null;
  if(curChar){
    if(curChar.id === room.owner_character_id || curChar.db_id === room.owner_character_id){
      return true;
    }
    // Comparar por nombre seguro
    var cName = (curChar.name || "").toLowerCase();
    var rOwnerInfo = getRoomOwnerInfo(room.owner_character_id);
    if(rOwnerInfo && rOwnerInfo.name && cName.includes(rOwnerInfo.name.toLowerCase())){
      return true;
    }
  }
  return false;
}

// Icono según tipo de habitación
function getRoomTypeIcon(type){
  switch(type){
    case "cocina": return "🍲";
    case "salon": return "🔥";
    case "habitacion_personal": return "🛏️";
    case "habitacion_comun": return "🏛️";
    default: return "🚪";
  }
}

// Etiqueta según tipo de habitación
function getRoomTypeLabel(type){
  switch(type){
    case "cocina": return "Cocina";
    case "salon": return "Salón";
    case "habitacion_personal": return "Personal";
    case "habitacion_comun": return "Común";
    default: return "Especial";
  }
}

// ============================================================================
// RENDERIZADO DE LA VISTA COMPLETA DE LA CASA
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
  var lvlPct = Math.min(100, Math.round((h.progress_current / Math.max(1, h.progress_max)) * 100));

  var html = '<div class="house-container">';

  // 1. Cabecera y Volver
  html += '<div class="house-header">';
  html += '  <div class="house-header-top">';
  html += '    <div class="house-title-group">';
  html += '      <h1 class="house-title"><span>🏠</span> ' + esc(h.name || "La Casa Andante") + '</h1>';
  html += '      <span class="house-beta-badge">🧪 BETA / EN PRUEBAS</span>';
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
  html += '  </div>';
  html += '</div>';

  // 2. Estadísticas Propias de la Casa
  html += '<div class="house-stats-grid">';
  html += renderHouseStatCard("🛋️ Confort", h.confort || 1, h.confort_progress || 0, h.confort_max || 10, "Calidad del reposo. Aumenta la recuperación de PV y Maná.");
  html += renderHouseStatCard("📖 Arcana (Libro)", h.arcana || 1, h.arcana_progress || 0, h.arcana_max || 10, "Poder mágico y guía sapiente. Límite y potencia de mejoras.");
  html += renderHouseStatCard("🍲 Provisiones", h.provisiones || 1, h.provisiones_progress || 0, h.provisiones_max || 10, "Calidad culinaria. Determina los buffs de la comida.");
  html += renderHouseStatCard("🛡️ Custodia", h.custodia || 1, h.custodia_progress || 0, h.custodia_max || 10, "Sigilo y defensa del hogar durante los descansos.");
  html += renderHouseStatCard("🔮 Vínculo", h.vinculo || 1, h.vinculo_progress || 0, h.vinculo_max || 10, "Conexión anímica con los moradores de la casa.");
  html += '</div>';

  // 3. Plano Funcional Interactivo (Cuadrícula)
  html += '<div class="house-blueprint-section">';
  html += '  <div class="house-blueprint-toolbar">';
  html += '    <h2 class="house-blueprint-title"><span>📐</span> Plano Mágico Interactivo</h2>';
  html += '    <div class="house-blueprint-actions">';
  if(gmMode){
    html += '      <button class="btn-solid-gold" data-action="open-create-room-modal" style="font-size:0.78rem;padding:5px 10px;">➕ Añadir Habitación</button>';
  }
  html += '    </div>';
  html += '  </div>';

  html += '  <div class="house-grid-viewport">';
  html += '    <div class="house-grid-canvas" id="houseGridCanvas">';
  html += renderHouseGridRooms();
  html += '    </div>';
  html += '  </div>';

  // 4. Panel Inspector de Habitación (si hay una seleccionada)
  if(houseState.selectedRoomId){
    html += renderRoomInspector(houseState.selectedRoomId);
  } else {
    html += '<div style="font-size:0.8rem;color:var(--ink-faint);text-align:center;padding:10px;font-style:italic;">💡 Haz clic en cualquier habitación del plano para inspeccionarla, ver sus detalles o decorarla.</div>';
  }

  html += '</div>'; // fin blueprint section
  html += '</div>'; // fin house-container

  main.innerHTML = html;
}

// Renderizado de cada tarjeta de estadística
function renderHouseStatCard(name, val, prog, max, desc){
  var pct = Math.min(100, Math.round((prog / Math.max(1, max)) * 100));
  return '<div class="house-stat-card">' +
    '  <div class="house-stat-header">' +
    '    <span class="house-stat-name">' + name + '</span>' +
    '    <span class="house-stat-val">Nv. ' + val + '</span>' +
    '  </div>' +
    '  <div class="house-stat-desc">' + desc + '</div>' +
    '  <div class="house-stat-track">' +
    '    <div class="house-stat-fill" style="width:' + pct + '%;"></div>' +
    '  </div>' +
    '</div>';
}

// Renderizado de las habitaciones en la cuadrícula
function renderHouseGridRooms(){
  var rooms = houseState.rooms || [];
  if(rooms.length === 0){
    return '<div style="grid-column:1/-1;text-align:center;color:var(--ink-dim);padding:30px;">No hay habitaciones registradas en el plano.</div>';
  }

  return rooms.map(function(r){
    var isSelected = houseState.selectedRoomId === r.id;
    var owner = getRoomOwnerInfo(r.owner_character_id);
    var upgradesCount = (houseState.upgrades || []).filter(function(u){ return u.room_id === r.id; }).length;

    // Coordenadas CSS Grid (1-indexed)
    var colStart = Math.max(1, (r.pos_x || 0) + 1);
    var colSpan = Math.max(1, r.width || 2);
    var rowStart = Math.max(1, (r.pos_y || 0) + 1);
    var rowSpan = Math.max(1, r.height || 2);

    var gridStyle = 'grid-column:' + colStart + ' / span ' + colSpan + '; grid-row:' + rowStart + ' / span ' + rowSpan + ';';

    var ownerTag = '';
    if(owner){
      ownerTag = '<span class="house-room-owner-tag" title="Habitación de ' + esc(owner.name) + '">👤 ' + esc(owner.name) + '</span>';
    }

    var upgradesTag = upgradesCount > 0 
      ? '<span class="house-room-upgrades-count" title="' + upgradesCount + ' mejora(s)">✨ ' + upgradesCount + '</span>' 
      : '';

    return '<div class="house-room-tile' + (isSelected ? ' active' : '') + '" style="' + gridStyle + '" data-action="select-house-room" data-room-id="' + r.id + '" role="button" tabindex="0">' +
      '  <div class="house-room-tile-head">' +
      '    <span class="house-room-type-tag ' + (r.room_type || 'otro') + '">' + getRoomTypeIcon(r.room_type) + ' ' + getRoomTypeLabel(r.room_type) + '</span>' +
      '    <span class="house-room-level-pill">Nv. ' + (r.level || 1) + '</span>' +
      '  </div>' +
      '  <div class="house-room-name">' + esc(r.name) + '</div>' +
      '  <div class="house-room-tile-foot">' +
      '    ' + ownerTag +
      '    ' + upgradesTag +
      '  </div>' +
      '</div>';
  }).join('');
}

// Renderizado del Inspector de Habitación
function renderRoomInspector(roomId){
  var r = (houseState.rooms || []).find(function(x){ return x.id === roomId; });
  if(!r) return '';

  var owner = getRoomOwnerInfo(r.owner_character_id);
  var canEdit = canUserEditRoom(r);
  var isGm = (typeof isGM === "function" && isGM());
  var roomUpgrades = (houseState.upgrades || []).filter(function(u){ return u.room_id === r.id; });

  var html = '<div class="house-inspector-box" id="houseRoomInspector">';
  html += '  <div class="house-inspector-header">';
  html += '    <div>';
  html += '      <h3 class="house-inspector-title">' + getRoomTypeIcon(r.room_type) + ' ' + esc(r.name) + '</h3>';
  html += '      <div class="house-inspector-meta">';
  html += '        <span class="house-room-type-tag ' + (r.room_type || 'otro') + '">' + getRoomTypeLabel(r.room_type) + '</span>';
  html += '        <span class="house-room-level-pill">Nivel ' + (r.level || 1) + '</span>';
  if(owner){
    html += '        <span class="house-room-owner-tag">Dueño: <b>' + esc(owner.name) + '</b></span>';
  }
  html += '      </div>';
  html += '    </div>';
  html += '    <button class="btn-compact" data-action="close-room-inspector" style="padding:2px 8px;" title="Cerrar inspector">&times;</button>';
  html += '  </div>';

  html += '  <div class="house-inspector-desc">' + (r.description ? esc(r.description) : '<i>Sin descripción ni detalles decorativos.</i>') + '</div>';

  // Mejoras
  html += '  <div>';
  html += '    <div style="font-size:0.8rem;font-weight:700;color:var(--gold-light);margin-bottom:6px;">✨ Mejoras de esta habitación:</div>';
  if(roomUpgrades.length === 0){
    html += '    <div style="font-size:0.75rem;color:var(--ink-dim);font-style:italic;">Aún no se han instalado mejoras en esta estancia.</div>';
  } else {
    html += '    <div class="house-inspector-upgrades-list">';
    roomUpgrades.forEach(function(u){
      html += '    <div class="house-upgrade-item' + (u.unlocked ? ' unlocked' : '') + '">';
      html += '      <div class="house-upgrade-info">';
      html += '        <div class="house-upgrade-title">' + (u.unlocked ? '✅ ' : '🔒 ') + esc(u.name) + '</div>';
      html += '        <div class="house-upgrade-desc">' + esc(u.description || '') + '</div>';
      html += '      </div>';
      html += '      <span style="font-size:0.7rem;font-weight:700;color:' + (u.unlocked ? '#2ECC71' : 'var(--ink-dim)') + ';">' + (u.unlocked ? 'Desbloqueada' : 'Requiere Nv.' + u.required_house_level) + '</span>';
      html += '    </div>';
    });
    html += '    </div>';
  }
  html += '  </div>';

  // Acciones disponibles
  html += '  <div class="house-inspector-actions">';
  if(canEdit){
    html += '    <button class="btn-solid-gold" data-action="open-edit-room-modal" data-room-id="' + r.id + '">✏️ ' + (isGm ? 'Modificar Habitación' : 'Decorar / Editar mi habitación') + '</button>';
  }
  if(isGm){
    html += '    <button class="btn-compact" data-action="delete-house-room" data-room-id="' + r.id + '" style="color:#E74C3C;border-color:rgba(231,76,60,0.4);" title="Eliminar habitación del plano">🗑️ Eliminar</button>';
  }
  html += '  </div>';

  html += '</div>';
  return html;
}

// ============================================================================
// MODALES DE EDICIÓN Y CREACIÓN
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
    '  <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-top:8px;">' +
    '    <div class="field"><label>Pos X</label><input type="number" id="newRoomPosX" min="0" max="10" value="0"></div>' +
    '    <div class="field"><label>Pos Y</label><input type="number" id="newRoomPosY" min="0" max="10" value="0"></div>' +
    '    <div class="field"><label>Ancho</label><input type="number" id="newRoomWidth" min="1" max="6" value="2"></div>' +
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

function closeHouseModal(){
  var o1 = document.getElementById("houseDescModalOverlay");
  if(o1) o1.remove();
  var o2 = document.getElementById("houseRoomModalOverlay");
  if(o2) o2.remove();
}

// Guardar descripción de la casa
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
      if(typeof showToast === "function") showToast("Descripción de la casa actualizada en la nube.", "success");
    } catch(e){
      console.warn("Error actualizando casa en Supabase:", e);
    }
  }
}

// Guardar datos de habitación editada
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
    var posXEl = document.getElementById("editRoomPosX");
    var posYEl = document.getElementById("editRoomPosY");
    var widthEl = document.getElementById("editRoomWidth");
    var heightEl = document.getElementById("editRoomHeight");
    var lvlEl = document.getElementById("editRoomLevel");

    if(typeEl) r.room_type = typeEl.value;
    if(ownerEl) r.owner_character_id = ownerEl.value || null;
    if(posXEl) r.pos_x = Math.max(0, parseInt(posXEl.value, 10) || 0);
    if(posYEl) r.pos_y = Math.max(0, parseInt(posYEl.value, 10) || 0);
    if(widthEl) r.width = Math.max(1, parseInt(widthEl.value, 10) || 2);
    if(heightEl) r.height = Math.max(1, parseInt(heightEl.value, 10) || 2);
    if(lvlEl) r.level = Math.max(1, parseInt(lvlEl.value, 10) || 1);

    remoteUpdatePayload.room_type = r.room_type;
    remoteUpdatePayload.owner_character_id = r.owner_character_id;
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
      if(typeof showToast === "function") showToast("Habitación guardada con éxito.", "success");
    } catch(e){
      console.warn("Error guardando habitación en Supabase:", e);
    }
  }
}

// Crear nueva habitación
async function confirmCreateRoomAction(){
  var nameEl = document.getElementById("newRoomName");
  var typeEl = document.getElementById("newRoomType");
  var ownerEl = document.getElementById("newRoomOwner");
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
    pos_x: posXEl ? Math.max(0, parseInt(posXEl.value, 10) || 0) : 0,
    pos_y: posYEl ? Math.max(0, parseInt(posYEl.value, 10) || 0) : 0,
    width: widthEl ? Math.max(1, parseInt(widthEl.value, 10) || 2) : 2,
    height: heightEl ? Math.max(1, parseInt(heightEl.value, 10) || 2) : 2,
    floor: 1,
    created_at: new Date().toISOString()
  };

  houseState.rooms.push(newRoom);
  houseState.selectedRoomId = newRoom.id;
  saveHouseLocalData();
  closeHouseModal();
  renderHouseView();

  if(typeof supabaseClient !== "undefined" && supabaseClient && houseState.house && houseState.house.id){
    try {
      var remotePayload = Object.assign({}, newRoom);
      // Si la BD usa UUID, omitimos id para que autogenere si no es UUID
      if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(remotePayload.id)){
        delete remotePayload.id;
      }
      var res = await supabaseClient.from("house_rooms").insert(remotePayload).select().maybeSingle();
      if(res && res.data && res.data.id){
        newRoom.id = res.data.id;
        saveHouseLocalData();
      }
      if(typeof showToast === "function") showToast("Habitación creada en el plano.", "success");
    } catch(e){
      console.warn("Error creando habitación en Supabase:", e);
    }
  }
}

// Eliminar habitación
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
    } catch(e){
      console.warn("Error eliminando habitación en Supabase:", e);
    }
  }
}

// Transición a la vista de la casa
function openHouseView(){
  if(!CONFIG_ENABLE_HOUSE) return;
  houseState.active = true;
  houseState.previousTab = (typeof state !== "undefined" && state.activeTab) ? state.activeTab : "ficha";

  // Cerrar cualquier modal abierto
  if(typeof closeModals === "function") closeModals();

  renderHouseView();
  fetchHouseRemoteData().then(function(){
    if(houseState.active) renderHouseView();
  });
}

// Volver a la ficha de personaje
function backFromHouseView(){
  houseState.active = false;
  houseState.selectedRoomId = null;
  if(typeof renderTabbar === "function") renderTabbar();
  if(typeof renderTab === "function") renderTab();
}

// ============================================================================
// GESTOR DE EVENTOS DELEGADOS PARA LA CASA
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
  } else if(act === "select-house-room"){
    var rId = btn.getAttribute("data-room-id");
    houseState.selectedRoomId = (houseState.selectedRoomId === rId) ? null : rId;
    renderHouseView();
  } else if(act === "close-room-inspector"){
    houseState.selectedRoomId = null;
    renderHouseView();
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
  }
});
