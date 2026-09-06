// ============================================================================
// KRYSALIS RPG - MÓDULO: MARKERS
// Marcadores colaborativos en tiempo real (crear, editar, borrar por cualquier jugador)
// ============================================================================

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

async function pushSingleMarker(marker, mapId){
  if(!supabaseClient) return;
  try{
    var payload = {
      id: marker.id,
      map_id: mapId,
      campaign_id: 'c0000000-0000-0000-0000-000000000001',
      x: Number(marker.x),
      y: Number(marker.y),
      name: marker.name,
      kind: marker.kind || 'Punto de Interés',
      notes: marker.notes || '',
      created_by: marker.created_by || (currentUser ? currentUser.id : null),
      updated_at: new Date().toISOString()
    };
    var res = await supabaseClient.from('map_markers').upsert(payload);
    if(res.error){
      console.warn("Granular map_markers fallback:", res.error);
      pushMapsData();
    } else {
      updateSyncBadge("synced");
    }
  }catch(e){
    console.warn("Granular pushSingleMarker fallback:", e);
    pushMapsData();
  }
}

async function deleteSingleMarker(markerId, mapId){
  if(!supabaseClient) return;
  try{
    var res = await supabaseClient.from('map_markers').delete().eq('id', markerId);
    if(res.error){
      console.warn("Granular map_markers delete fallback:", res.error);
      pushMapsData();
    } else {
      updateSyncBadge("synced");
    }
  }catch(e){
    console.warn("Granular deleteSingleMarker fallback:", e);
    pushMapsData();
  }
}

function pinModalClick(e){
  var btn = e.target.closest("[data-action]"); if(!btn) return;
  var action = btn.getAttribute("data-action");
  var curM = (state.maps||[]).find(function(m){return m.id===state.activeMapId;});
  if(action==="close-modal"){ closeModals(); return; }
  if(action==="save-pin" && curM){
    var pid = btn.getAttribute("data-id") || ("pin_" + uid());
    var existing = (curM.markers||[]).find(function(p){return p.id===pid;});
    var pData = existing || {id:pid, x:parseFloat(btn.getAttribute("data-x"))||50, y:parseFloat(btn.getAttribute("data-y"))||50};
    pData.name = document.getElementById("pinInputName").value.trim()||"Punto de Interés";
    pData.kind = document.getElementById("pinInputKind").value;
    pData.notes = document.getElementById("pinInputNotes").value;
    pData.created_by = currentUser ? currentUser.id : (pData.created_by || null);
    if(!existing){ if(!curM.markers) curM.markers=[]; curM.markers.push(pData); }
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
