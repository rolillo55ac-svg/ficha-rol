var MAP_MARKER_TYPES = [
  { id: "ciudad", name: "Ciudad / Pueblo", icon: "🏙️", color: "#C84B57", baseKind: "Ciudad" },
  { id: "capital", name: "Capital / Reino", icon: "👑", color: "#E5B869", baseKind: "Capital" },
  { id: "mazmorra", name: "Mazmorra / Cueva", icon: "🗝️", color: "#A855F7", baseKind: "Punto de Interés" },
  { id: "ruinas", name: "Ruinas / Misterio", icon: "🏛️", color: "#38BDF8", baseKind: "Punto de Interés" },
  { id: "campamento", name: "Campamento", icon: "⛺", color: "#4ADE80", baseKind: "Punto de Interés" },
  { id: "torre", name: "Torre / Atalaya", icon: "🗼", color: "#FB923C", baseKind: "Punto de Interés" },
  { id: "templo", name: "Santuario / Templo", icon: "⛪", color: "#FACC15", baseKind: "Punto de Interés" },
  { id: "puerto", name: "Puerto / Muelle", icon: "⚓", color: "#2DD4BF", baseKind: "Ciudad" },
  { id: "tienda", name: "Mercado / Tienda", icon: "🛒", color: "#F472B6", baseKind: "Ciudad" },
  { id: "peligro", name: "Peligro / Trampa", icon: "⚠️", color: "#EF4444", baseKind: "Peligro" },
  { id: "jefe", name: "Jefe / Monstruo", icon: "🐉", color: "#DC2626", baseKind: "Peligro" },
  { id: "tesoro", name: "Tesoro / Botín", icon: "💎", color: "#60A5FA", baseKind: "Punto de Interés" },
  { id: "mision", name: "Misión / Evento", icon: "❗", color: "#F59E0B", baseKind: "Punto de Interés" },
  { id: "poi", name: "Punto de Interés", icon: "📍", color: "#2A9D8F", baseKind: "Punto de Interés" }
];

var MAP_PIN_ICONS = [
  '📍','👑','🏙️','🗝️','🏛️','⛺','🗼','⛪','⚓','🛒','⚠️','🐉','💎','❗',
  '💀','⚔️','🛡️','🏹','🧙','🌲','🌋','🌊','🧭','📜','🍺','⭐','🚩','🔥','❄️','⚡','🐴','🏠'
];

var MAP_PIN_COLORS = [
  { name: "Oro Imperial", hex: "#E5B869" },
  { name: "Rojo Carmesí", hex: "#EF4444" },
  { name: "Rojo Oscuro", hex: "#DC2626" },
  { name: "Naranja Fuego", hex: "#F97316" },
  { name: "Ámbar", hex: "#F59E0B" },
  { name: "Amarillo Sol", hex: "#FACC15" },
  { name: "Verde Bosque", hex: "#22C55E" },
  { name: "Esmeralda", hex: "#10B981" },
  { name: "Turquesa", hex: "#14B8A6" },
  { name: "Cian Arcano", hex: "#06B6D4" },
  { name: "Azul Cielo", hex: "#38BDF8" },
  { name: "Azul Real", hex: "#3B82F6" },
  { name: "Índigo", hex: "#6366F1" },
  { name: "Púrpura Místico", hex: "#A855F7" },
  { name: "Rosa Mágico", hex: "#F472B6" },
  { name: "Magenta", hex: "#EC4899" },
  { name: "Blanco Puro", hex: "#FFFFFF" },
  { name: "Gris Acero", hex: "#94A3B8" },
  { name: "Sombra Oscura", hex: "#1E293B" }
];

function getMarkerTypeDef(kind){
  if(!kind) return MAP_MARKER_TYPES[MAP_MARKER_TYPES.length - 1]; // poi
  var kLower = String(kind).toLowerCase().trim();
  var found = MAP_MARKER_TYPES.find(function(t){
    return t.id === kLower || t.name.toLowerCase() === kLower || t.name.toLowerCase().includes(kLower) || kLower.includes(t.id);
  });
  if(found) return found;
  if(kLower.includes("capital")) return MAP_MARKER_TYPES[1];
  if(kLower.includes("ciudad")) return MAP_MARKER_TYPES[0];
  if(kLower.includes("peligro")) return MAP_MARKER_TYPES[9];
  return MAP_MARKER_TYPES[MAP_MARKER_TYPES.length - 1]; // poi
}

function parsePinNotesAndMeta(notesStr, kind, icon, color){
  var str = String(notesStr || "");
  var m = str.match(/^<!--pinMeta:(.*?)-->\s*/);
  var extractedKind = kind;
  var extractedIcon = icon;
  var extractedColor = color;
  var cleanNotes = str;
  if(m){
    try {
      var meta = JSON.parse(m[1]);
      if(meta.kind) extractedKind = meta.kind;
      if(meta.icon) extractedIcon = meta.icon;
      if(meta.color) extractedColor = meta.color;
      cleanNotes = str.replace(m[0], "");
    } catch(e){}
  }
  return {
    kind: extractedKind,
    icon: extractedIcon,
    color: extractedColor,
    notes: cleanNotes
  };
}

function encodePinNotesWithMeta(notesStr, kind, icon, color){
  var clean = String(notesStr || "").replace(/^<!--pinMeta:(.*?)-->\s*/, "");
  var metaObj = { kind: kind, icon: icon, color: color };
  return '<!--pinMeta:' + JSON.stringify(metaObj) + '-->\n' + clean;
}

function updatePinModalPreview(){
  var name = (document.getElementById("pinInputName") ? document.getElementById("pinInputName").value.trim() : "") || "Punto en el Mapa";
  var kind = document.getElementById("pinInputKind") ? document.getElementById("pinInputKind").value : "Punto de Interés";
  var icon = document.getElementById("pinInputIcon") ? document.getElementById("pinInputIcon").value : "📍";
  var tDef = getMarkerTypeDef(kind);
  var color = (document.getElementById("pinInputColor") ? document.getElementById("pinInputColor").value : null) || tDef.color || "#2A9D8F";

  var balloonEl = document.getElementById("pinPreviewBalloon");
  var iconEl = document.getElementById("pinPreviewIcon");
  var tagEl = document.getElementById("pinPreviewTag");
  var subtitleEl = document.getElementById("pinPreviewSub");

  if(balloonEl){
    balloonEl.style.backgroundColor = color;
    balloonEl.style.boxShadow = "0 0 14px " + color + "88";
  }
  if(iconEl){
    iconEl.textContent = icon || tDef.icon || "📍";
  }
  if(tagEl){
    tagEl.textContent = name;
  }
  if(subtitleEl){
    subtitleEl.textContent = tDef.name;
    subtitleEl.style.color = color;
  }
}

window.onCustomPinColorChange = function(hexVal){
  if(!hexVal) return;
  var colInput = document.getElementById("pinInputColor");
  if(colInput) colInput.value = hexVal;
  document.querySelectorAll(".pin-color-opt").forEach(function(el){
    var isThis = (el.getAttribute("data-color")||"").toLowerCase() === hexVal.toLowerCase();
    el.classList.toggle("active", isThis);
    el.innerHTML = isThis ? '<span class="pco-check">✓</span>' : '';
  });
  updatePinModalPreview();
};

function openPinModal(targetObj, x, y, pinId, contextType, contextId){
  targetObj = targetObj || {};
  contextType = contextType || "map"; // "map" | "questMap" | "questCard"
  contextId = contextId || targetObj.id || "";

  var markersList = targetObj.markers || [];
  var pin = pinId ? markersList.find(function(p){ return p.id === pinId; }) : { id: uid(), x: x, y: y, name: "", kind: "Punto de Interés", notes: "" };
  if(!pin) pin = { id: pinId || uid(), x: x || 50, y: y || 50, name: "", kind: "Punto de Interés", notes: "" };

  var parsed = parsePinNotesAndMeta(pin.notes, pin.kind, pin.icon, pin.color);
  var curKind = parsed.kind || pin.kind || "Punto de Interés";
  var curTypeDef = getMarkerTypeDef(curKind);
  var curIcon = parsed.icon || pin.icon || curTypeDef.icon || "📍";
  var curColor = parsed.color || pin.color || curTypeDef.color || "#2A9D8F";
  var cleanNotes = parsed.notes;

  var typeButtonsHtml = MAP_MARKER_TYPES.map(function(t){
    var isSel = (t.id === curTypeDef.id);
    return '<button type="button" class="pin-type-opt' + (isSel ? ' active' : '') + '" data-action="select-pin-type" data-type-id="' + t.id + '" data-type-name="' + esc(t.name) + '" data-type-icon="' + t.icon + '" data-type-color="' + t.color + '" style="--type-col:' + t.color + ';">' +
      '<span class="pto-icon">' + t.icon + '</span>' +
      '<span class="pto-name">' + esc(t.name) + '</span>' +
    '</button>';
  }).join('');

  var iconButtonsHtml = MAP_PIN_ICONS.map(function(ic){
    var isSel = (ic === curIcon);
    return '<button type="button" class="pin-icon-opt' + (isSel ? ' active' : '') + '" data-action="select-pin-icon" data-icon="' + ic + '">' + ic + '</button>';
  }).join('');

  var colorButtonsHtml = MAP_PIN_COLORS.map(function(c){
    var isSel = (c.hex.toLowerCase() === curColor.toLowerCase());
    return '<button type="button" class="pin-color-opt' + (isSel ? ' active' : '') + '" data-action="select-pin-color" data-color="' + c.hex + '" title="' + esc(c.name) + '" style="--col:' + c.hex + ';background-color:' + c.hex + ';">' +
      (isSel ? '<span class="pco-check">✓</span>' : '') +
    '</button>';
  }).join('');

  var modalTitle = 'Nuevo Marcador';
  if(contextType === "questMap"){
    modalTitle = pinId ? 'Editar Marcador (Plano de Misión)' : 'Nuevo Marcador en Plano de Misión';
  } else if(contextType === "questCard"){
    modalTitle = pinId ? 'Editar Marcador de Misión' : 'Nuevo Marcador en ' + esc(targetObj.title || 'Misión');
  } else {
    modalTitle = pinId ? 'Editar Marcador' : 'Nuevo Punto en ' + esc(targetObj.name || 'el Mapa');
  }

  document.getElementById("pinModal").innerHTML =
    '<h2>' + modalTitle + '<button data-action="close-modal" aria-label="Cerrar">&times;</button></h2>' +
    
    // Live Pin Preview
    '<div class="pin-preview-wrap">' +
      '<div class="pin-preview-stage">' +
        '<div class="map-pin pin-type-' + curTypeDef.id + ' is-preview">' +
          '<div class="pin-balloon" id="pinPreviewBalloon" style="background-color:' + curColor + ';box-shadow:0 0 14px ' + curColor + '88;">' +
            '<div class="pin-icon" id="pinPreviewIcon">' + curIcon + '</div>' +
          '</div>' +
          '<div class="pin-tag" id="pinPreviewTag">' + esc(pin.name || 'Nuevo Punto') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="pin-preview-meta">' +
        '<span style="font-size:.68rem;color:var(--ink-faint);text-transform:uppercase;">Vista previa del marcador</span>' +
        '<strong id="pinPreviewSub" style="font-size:.82rem;color:' + curColor + ';">' + esc(curTypeDef.name) + '</strong>' +
        '<span style="font-size:.68rem;color:var(--ink-dim);">' + (contextType === "questMap" ? '🗺️ Plano Táctico' : (contextType === "questCard" ? '⚔️ Imagen de Misión' : '🌍 Mapa de Campaña')) + '</span>' +
      '</div>' +
    '</div>' +

    // Hidden inputs for context & state
    '<input type="hidden" id="pinInputContextType" value="' + esc(contextType) + '">' +
    '<input type="hidden" id="pinInputContextId" value="' + esc(contextId) + '">' +
    '<input type="hidden" id="pinInputKind" value="' + esc(curTypeDef.name) + '">' +
    '<input type="hidden" id="pinInputIcon" value="' + esc(curIcon) + '">' +
    '<input type="hidden" id="pinInputColor" value="' + esc(curColor) + '">' +

    // Name field
    '<div class="field" style="margin-top:10px;"><label>Nombre del Lugar o Punto Clave</label>' +
      '<input type="text" id="pinInputName" value="' + esc(pin.name) + '" placeholder="Ej: Entrada secreta, Trampa rúnica, Sala del jefe, Campamento..." oninput="updatePinModalPreview()">' +
    '</div>' +

    // Type selector buttons
    '<div class="field" style="margin-top:10px;"><label>Tipo / Categoría de Marcador</label>' +
      '<div class="pin-types-grid">' + typeButtonsHtml + '</div>' +
    '</div>' +

    // Color selector shelf + custom picker
    '<div class="field" style="margin-top:10px;"><label>Color del Globo / Pin (Escoge libremente)</label>' +
      '<div class="pin-colors-shelf">' + colorButtonsHtml + '</div>' +
      '<div class="pin-custom-color-row">' +
        '<label for="pinInputCustomColor" style="font-size:.74rem;color:var(--ink-dim);cursor:pointer;">🎨 Color personalizado o exacto:</label>' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<input type="color" id="pinInputCustomColor" value="' + curColor + '" oninput="if(window.onCustomPinColorChange) window.onCustomPinColorChange(this.value);" title="Abre el selector de color del sistema">' +
          '<span style="font-family:var(--font-mono);font-size:.72rem;color:var(--gold-light);" id="pinColorHexDisplay">' + curColor.toUpperCase() + '</span>' +
        '</div>' +
      '</div>' +
    '</div>' +

    // Icon palette
    '<div class="field" style="margin-top:10px;"><label>Icono del Globo (Estilo Videojuego)</label>' +
      '<div class="pin-icons-shelf">' + iconButtonsHtml + '</div>' +
      '<div style="display:flex;align-items:center;gap:6px;margin-top:6px;">' +
        '<span style="font-size:.72rem;color:var(--ink-dim);">O escribe un emoji personalizado:</span>' +
        '<input type="text" id="pinInputCustomIcon" value="' + esc(curIcon) + '" maxlength="4" style="width:50px;text-align:center;background:var(--bg-card);border:1px solid var(--line);border-radius:4px;padding:3px;font-size:.9rem;" oninput="if(this.value){document.getElementById(\'pinInputIcon\').value=this.value;updatePinModalPreview();}">' +
      '</div>' +
    '</div>' +

    // Notes field
    '<div class="field" style="margin-top:10px;"><label>Notas / Secretos / Descripción del punto</label>' +
      '<textarea id="pinInputNotes" placeholder="Detalles sobre este punto táctico, peligros, tesoros, pistas o accesos...">' + esc(cleanNotes) + '</textarea>' +
    '</div>' +

    // Buttons
    '<div style="display:flex;gap:8px;margin-top:14px;">' +
      '<button class="btn-solid-gold" style="flex:1;" data-action="save-pin" data-id="' + pin.id + '" data-x="' + pin.x + '" data-y="' + pin.y + '">✓ Guardar Marcador</button>' +
      (pinId ? '<button class="btn-compact" style="color:var(--danger);" data-action="del-pin" data-id="' + pin.id + '">Borrar</button>' : '') +
    '</div>';

  document.getElementById("pinModalOverlay").classList.remove("hidden");
}

async function pushSingleMarker(marker, mapId){
  if(!supabaseClient) return;
  try{
    var isValidUUID = function(s){ return typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s); };
    var creator = (currentUser && isValidUUID(currentUser.id)) ? currentUser.id : (isValidUUID(marker.created_by) ? marker.created_by : null);
    
    var typeDef = getMarkerTypeDef(marker.kind);
    var baseKind = typeDef ? typeDef.baseKind : "Punto de Interés";
    var pinColor = marker.color || typeDef.color || "#2A9D8F";
    var encodedNotes = encodePinNotesWithMeta(marker.notes, marker.kind, marker.icon || typeDef.icon, pinColor);

    var payload = {
      id: marker.id,
      map_id: mapId,
      campaign_id: 'c0000000-0000-0000-0000-000000000001',
      x: Number(marker.x),
      y: Number(marker.y),
      name: marker.name,
      kind: baseKind,
      notes: encodedNotes,
      created_by: creator,
      updated_at: new Date().toISOString()
    };
    var res = await supabaseClient.from('map_markers').upsert(payload);
    if(res.error){
      console.warn("Granular map_markers fallback:", res.error);
      pushMapsData(true);
    } else {
      updateSyncBadge("synced");
    }
  }catch(e){
    console.warn("Granular pushSingleMarker fallback:", e);
    pushMapsData(true);
  }
}

async function deleteSingleMarker(markerId, mapId){
  if(!supabaseClient) return;
  try{
    var res = await supabaseClient.from('map_markers').delete().eq('id', markerId);
    if(res.error){
      console.warn("Granular map_markers delete fallback:", res.error);
      pushMapsData(true);
    } else {
      updateSyncBadge("synced");
    }
  }catch(e){
    console.warn("Granular deleteSingleMarker fallback:", e);
    pushMapsData(true);
  }
}

function pinModalClick(e){
  var btn = e.target.closest("[data-action]"); if(!btn) return;
  var action = btn.getAttribute("data-action");

  if(action==="close-modal"){ closeModals(); return; }

  if(action==="select-pin-type"){
    var typeName = btn.getAttribute("data-type-name") || "Punto de Interés";
    var typeIcon = btn.getAttribute("data-type-icon") || "📍";
    var typeColor = btn.getAttribute("data-type-color") || "#2A9D8F";
    document.querySelectorAll(".pin-type-opt").forEach(function(el){ el.classList.remove("active"); });
    btn.classList.add("active");

    var kindInput = document.getElementById("pinInputKind");
    if(kindInput) kindInput.value = typeName;

    // Actualizar icono sugerido
    var iconInput = document.getElementById("pinInputIcon");
    if(iconInput){
      iconInput.value = typeIcon;
      var customInput = document.getElementById("pinInputCustomIcon");
      if(customInput) customInput.value = typeIcon;
      document.querySelectorAll(".pin-icon-opt").forEach(function(el){
        if(el.getAttribute("data-icon") === typeIcon) el.classList.add("active");
        else el.classList.remove("active");
      });
    }

    // Actualizar color sugerido según la categoría
    var colInput = document.getElementById("pinInputColor");
    if(colInput) colInput.value = typeColor;
    var customColInput = document.getElementById("pinInputCustomColor");
    if(customColInput) customColInput.value = typeColor;
    var hexDisp = document.getElementById("pinColorHexDisplay");
    if(hexDisp) hexDisp.textContent = typeColor.toUpperCase();

    document.querySelectorAll(".pin-color-opt").forEach(function(el){
      var isThis = (el.getAttribute("data-color")||"").toLowerCase() === typeColor.toLowerCase();
      el.classList.toggle("active", isThis);
      el.innerHTML = isThis ? '<span class="pco-check">✓</span>' : '';
    });

    updatePinModalPreview();
    return;
  }

  if(action==="select-pin-color"){
    var colorVal = btn.getAttribute("data-color") || "#2A9D8F";
    var colInput2 = document.getElementById("pinInputColor");
    if(colInput2) colInput2.value = colorVal;
    var customColInput2 = document.getElementById("pinInputCustomColor");
    if(customColInput2) customColInput2.value = colorVal;
    var hexDisp2 = document.getElementById("pinColorHexDisplay");
    if(hexDisp2) hexDisp2.textContent = colorVal.toUpperCase();

    document.querySelectorAll(".pin-color-opt").forEach(function(el){
      var isThis = (el.getAttribute("data-color")||"").toLowerCase() === colorVal.toLowerCase();
      el.classList.toggle("active", isThis);
      el.innerHTML = isThis ? '<span class="pco-check">✓</span>' : '';
    });

    updatePinModalPreview();
    return;
  }

  if(action==="select-pin-icon"){
    var iconVal = btn.getAttribute("data-icon") || "📍";
    document.querySelectorAll(".pin-icon-opt").forEach(function(el){ el.classList.remove("active"); });
    btn.classList.add("active");

    var iconInput2 = document.getElementById("pinInputIcon");
    if(iconInput2) iconInput2.value = iconVal;
    var customInput2 = document.getElementById("pinInputCustomIcon");
    if(customInput2) customInput2.value = iconVal;

    updatePinModalPreview();
    return;
  }

  if(action==="save-pin"){
    var ctxType = document.getElementById("pinInputContextType") ? document.getElementById("pinInputContextType").value : "map";
    var ctxId = document.getElementById("pinInputContextId") ? document.getElementById("pinInputContextId").value : "";
    var pid = btn.getAttribute("data-id") || ("pin_" + uid());
    var chosenColor = document.getElementById("pinInputColor") ? document.getElementById("pinInputColor").value : null;

    if(ctxType === "questMap"){
      state.questMap = state.questMap || { name: "Mapa de la Misión", image: null, notes: "" };
      state.questMap.markers = state.questMap.markers || [];
      var existingQM = state.questMap.markers.find(function(p){ return p.id === pid; });
      var pDataQM = existingQM || { id: pid, x: parseFloat(btn.getAttribute("data-x"))||50, y: parseFloat(btn.getAttribute("data-y"))||50 };

      pDataQM.name = document.getElementById("pinInputName").value.trim() || "Punto de Interés";
      pDataQM.kind = document.getElementById("pinInputKind") ? document.getElementById("pinInputKind").value : (pDataQM.kind || "Punto de Interés");
      pDataQM.icon = document.getElementById("pinInputIcon") ? document.getElementById("pinInputIcon").value : (pDataQM.icon || "📍");
      pDataQM.color = chosenColor || pDataQM.color || getMarkerTypeDef(pDataQM.kind).color;
      pDataQM.notes = document.getElementById("pinInputNotes").value;
      pDataQM.created_by = currentUser ? currentUser.id : (pDataQM.created_by || null);

      if(!existingQM) state.questMap.markers.push(pDataQM);

      saveState(true);
      pushSharedData({ questMap: state.questMap });
      closeModals();
      renderTab();
      showToast("Marcador guardado en el mapa de misión", "success");
      return;
    }

    if(ctxType === "questCard"){
      var quest = (state.quests || []).find(function(q){ return q.id === ctxId; });
      if(quest){
        quest.markers = quest.markers || [];
        var existingQC = quest.markers.find(function(p){ return p.id === pid; });
        var pDataQC = existingQC || { id: pid, x: parseFloat(btn.getAttribute("data-x"))||50, y: parseFloat(btn.getAttribute("data-y"))||50 };

        pDataQC.name = document.getElementById("pinInputName").value.trim() || "Punto de Interés";
        pDataQC.kind = document.getElementById("pinInputKind") ? document.getElementById("pinInputKind").value : (pDataQC.kind || "Punto de Interés");
        pDataQC.icon = document.getElementById("pinInputIcon") ? document.getElementById("pinInputIcon").value : (pDataQC.icon || "📍");
        pDataQC.color = chosenColor || pDataQC.color || getMarkerTypeDef(pDataQC.kind).color;
        pDataQC.notes = document.getElementById("pinInputNotes").value;
        pDataQC.created_by = currentUser ? currentUser.id : (pDataQC.created_by || null);

        if(!existingQC) quest.markers.push(pDataQC);

        saveState(true);
        pushSharedData({ quests: state.quests });
        closeModals();
        renderTab();
        showToast("Marcador guardado en la misión", "success");
      }
      return;
    }

    // Contexto por defecto: Mapa de campaña
    var curM = (state.maps || []).find(function(m){ return m.id === ctxId || m.id === state.activeMapId; });
    if(curM){
      var existing = (curM.markers||[]).find(function(p){ return p.id === pid; });
      var pData = existing || { id: pid, x: parseFloat(btn.getAttribute("data-x"))||50, y: parseFloat(btn.getAttribute("data-y"))||50 };
      
      pData.name = document.getElementById("pinInputName").value.trim() || "Punto de Interés";
      pData.kind = document.getElementById("pinInputKind") ? document.getElementById("pinInputKind").value : (pData.kind || "Punto de Interés");
      pData.icon = document.getElementById("pinInputIcon") ? document.getElementById("pinInputIcon").value : (pData.icon || "📍");
      pData.color = chosenColor || pData.color || getMarkerTypeDef(pData.kind).color;
      pData.notes = document.getElementById("pinInputNotes").value;
      pData.created_by = currentUser ? currentUser.id : (pData.created_by || null);

      if(!existing){
        if(!curM.markers) curM.markers = [];
        curM.markers.push(pData);
      }
      saveState(true);
      closeModals();
      renderTab();
      showToast("Marcador guardado", "success");
      pushSingleMarker(pData, curM.id);
      pushMapsData(true);
      return;
    }
  }

  if(action==="del-pin"){
    var delPid = btn.getAttribute("data-id");
    var ctxTypeD = document.getElementById("pinInputContextType") ? document.getElementById("pinInputContextType").value : "map";
    var ctxIdD = document.getElementById("pinInputContextId") ? document.getElementById("pinInputContextId").value : "";

    if(ctxTypeD === "questMap" && state.questMap){
      state.questMap.markers = (state.questMap.markers || []).filter(function(p){ return p.id !== delPid; });
      saveState(true);
      pushSharedData({ questMap: state.questMap });
      closeModals();
      renderTab();
      showToast("Marcador eliminado del mapa de misión", "info");
      return;
    }

    if(ctxTypeD === "questCard"){
      var questD = (state.quests || []).find(function(q){ return q.id === ctxIdD; });
      if(questD){
        questD.markers = (questD.markers || []).filter(function(p){ return p.id !== delPid; });
        saveState(true);
        pushSharedData({ quests: state.quests });
        closeModals();
        renderTab();
        showToast("Marcador eliminado de la misión", "info");
      }
      return;
    }

    var curMD = (state.maps || []).find(function(m){ return m.id === ctxIdD || m.id === state.activeMapId; });
    if(curMD){
      curMD.markers = (curMD.markers||[]).filter(function(p){ return p.id !== delPid; });
      saveState(true);
      closeModals();
      renderTab();
      showToast("Marcador eliminado", "info");
      deleteSingleMarker(delPid, curMD.id);
      pushMapsData(true);
      return;
    }
  }
}
