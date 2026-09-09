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

function parsePinNotesAndMeta(notesStr, kind, icon){
  var str = String(notesStr || "");
  var m = str.match(/^<!--pinMeta:(.*?)-->\s*/);
  var extractedKind = kind;
  var extractedIcon = icon;
  var cleanNotes = str;
  if(m){
    try {
      var meta = JSON.parse(m[1]);
      if(meta.kind) extractedKind = meta.kind;
      if(meta.icon) extractedIcon = meta.icon;
      cleanNotes = str.replace(m[0], "");
    } catch(e){}
  }
  return {
    kind: extractedKind,
    icon: extractedIcon,
    notes: cleanNotes
  };
}

function encodePinNotesWithMeta(notesStr, kind, icon){
  var clean = String(notesStr || "").replace(/^<!--pinMeta:(.*?)-->\s*/, "");
  var metaObj = { kind: kind, icon: icon };
  return '<!--pinMeta:' + JSON.stringify(metaObj) + '-->\n' + clean;
}

function updatePinModalPreview(){
  var name = (document.getElementById("pinInputName") ? document.getElementById("pinInputName").value.trim() : "") || "Punto en el Mapa";
  var kind = document.getElementById("pinInputKind") ? document.getElementById("pinInputKind").value : "Punto de Interés";
  var icon = document.getElementById("pinInputIcon") ? document.getElementById("pinInputIcon").value : "📍";
  var tDef = getMarkerTypeDef(kind);

  var balloonEl = document.getElementById("pinPreviewBalloon");
  var iconEl = document.getElementById("pinPreviewIcon");
  var tagEl = document.getElementById("pinPreviewTag");
  var subtitleEl = document.getElementById("pinPreviewSub");

  if(balloonEl){
    balloonEl.style.backgroundColor = tDef.color;
    balloonEl.style.boxShadow = "0 0 14px " + tDef.color + "88";
  }
  if(iconEl){
    iconEl.textContent = icon || tDef.icon || "📍";
  }
  if(tagEl){
    tagEl.textContent = name;
  }
  if(subtitleEl){
    subtitleEl.textContent = tDef.name;
    subtitleEl.style.color = tDef.color;
  }
}

function openPinModal(mapObj, x, y, pinId){
  var pin = pinId ? (mapObj.markers||[]).find(function(p){return p.id===pinId;}) : {id:uid(), x:x, y:y, name:"", kind:"Punto de Interés", notes:""};
  var parsed = parsePinNotesAndMeta(pin.notes, pin.kind, pin.icon);
  var curKind = parsed.kind || pin.kind || "Punto de Interés";
  var curTypeDef = getMarkerTypeDef(curKind);
  var curIcon = parsed.icon || pin.icon || curTypeDef.icon || "📍";
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

  document.getElementById("pinModal").innerHTML =
    '<h2>' + (pinId ? 'Editar Marcador' : 'Nuevo Punto en ' + esc(mapObj.name)) + '<button data-action="close-modal" aria-label="Cerrar">&times;</button></h2>' +
    
    // Live Pin Preview
    '<div class="pin-preview-wrap">' +
      '<div class="pin-preview-stage">' +
        '<div class="map-pin pin-type-' + curTypeDef.id + ' is-preview">' +
          '<div class="pin-balloon" id="pinPreviewBalloon" style="background-color:' + curTypeDef.color + ';box-shadow:0 0 14px ' + curTypeDef.color + '88;">' +
            '<div class="pin-icon" id="pinPreviewIcon">' + curIcon + '</div>' +
          '</div>' +
          '<div class="pin-tag" id="pinPreviewTag">' + esc(pin.name || 'Nuevo Punto') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="pin-preview-meta">' +
        '<span style="font-size:.68rem;color:var(--ink-faint);text-transform:uppercase;">Vista previa del marcador</span>' +
        '<strong id="pinPreviewSub" style="font-size:.8rem;color:' + curTypeDef.color + ';">' + esc(curTypeDef.name) + '</strong>' +
      '</div>' +
    '</div>' +

    // Hidden inputs
    '<input type="hidden" id="pinInputKind" value="' + esc(curTypeDef.name) + '">' +
    '<input type="hidden" id="pinInputIcon" value="' + esc(curIcon) + '">' +

    // Name field
    '<div class="field" style="margin-top:10px;"><label>Nombre del Lugar</label>' +
      '<input type="text" id="pinInputName" value="' + esc(pin.name) + '" placeholder="Ej: Ruinas Antiguas, Mazmorra Sombría, Posada del Jabalí..." oninput="updatePinModalPreview()">' +
    '</div>' +

    // Type selector buttons
    '<div class="field" style="margin-top:10px;"><label>Tipo de Marcador (Selecciona una categoría)</label>' +
      '<div class="pin-types-grid">' + typeButtonsHtml + '</div>' +
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
    '<div class="field" style="margin-top:10px;"><label>Notas / Secretos / Descripción</label>' +
      '<textarea id="pinInputNotes" placeholder="Detalles sobre este lugar, peligros, rumores, accesos...">' + esc(cleanNotes) + '</textarea>' +
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
    var encodedNotes = encodePinNotesWithMeta(marker.notes, marker.kind, marker.icon || typeDef.icon);

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
  var curM = (state.maps||[]).find(function(m){return m.id===state.activeMapId;});

  if(action==="close-modal"){ closeModals(); return; }

  if(action==="select-pin-type"){
    var typeName = btn.getAttribute("data-type-name") || "Punto de Interés";
    var typeIcon = btn.getAttribute("data-type-icon") || "📍";
    document.querySelectorAll(".pin-type-opt").forEach(function(el){ el.classList.remove("active"); });
    btn.classList.add("active");

    var kindInput = document.getElementById("pinInputKind");
    if(kindInput) kindInput.value = typeName;

    // Actualizar icono sugerido si no se cambió explícitamente a otro
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

  if(action==="save-pin" && curM){
    var pid = btn.getAttribute("data-id") || ("pin_" + uid());
    var existing = (curM.markers||[]).find(function(p){return p.id===pid;});
    var pData = existing || {id:pid, x:parseFloat(btn.getAttribute("data-x"))||50, y:parseFloat(btn.getAttribute("data-y"))||50};
    
    pData.name = document.getElementById("pinInputName").value.trim()||"Punto de Interés";
    pData.kind = document.getElementById("pinInputKind") ? document.getElementById("pinInputKind").value : (pData.kind || "Punto de Interés");
    pData.icon = document.getElementById("pinInputIcon") ? document.getElementById("pinInputIcon").value : (pData.icon || "📍");
    pData.notes = document.getElementById("pinInputNotes").value;
    pData.created_by = currentUser ? currentUser.id : (pData.created_by || null);

    if(!existing){
      if(!curM.markers) curM.markers=[];
      curM.markers.push(pData);
    }
    saveState(true);
    closeModals();
    renderTab();
    showToast("Marcador guardado", "success");
    pushSingleMarker(pData, curM.id);
    return;
  }

  if(action==="del-pin" && curM){
    var delPid = btn.getAttribute("data-id");
    curM.markers = (curM.markers||[]).filter(function(p){return p.id!==delPid;});
    saveState(true);
    closeModals();
    renderTab();
    showToast("Marcador eliminado", "info");
    deleteSingleMarker(delPid, curM.id);
    return;
  }
}
