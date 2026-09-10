function tplMundoMapas(s){
  var curMap = (s.maps||[]).find(function(m){return m.id===s.activeMapId;}) || s.maps[0];
  if(!curMap){ curMap={id:"world_main",name:"Mapa de Campaña",image:null,markers:[]}; s.maps=[curMap]; s.activeMapId=curMap.id; }

  var mapTabs = (s.maps||[]).map(function(m){
    return '<button class="f-pill '+(s.activeMapId===m.id?'active':'')+'" data-action="switch-map" data-id="'+m.id+'">'+esc(m.name)+'</button>';
  }).join('');

  var canEditMap = isGM() || !currentUser;
  var html = '<div class="section'+(canEditMap?' gm-section':'')+'"><div class="section-title">'+
    '<span>'+(canEditMap?'Cartografía y Mapas (GM)':'Cartografía y Mapas')+'</span>'+
    '<button class="btn-compact" data-action="sync-map-now" title="Forzar descarga y sincronización">🔄 Sincronizar</button>'+
  '</div>'+
  (canEditMap ? '<div class="map-toolbar">'+
    '<button class="btn-compact" data-action="add-new-map-url" title="Crear un mapa nuevo independiente mediante enlace / URL">+ Nuevo Mapa (URL)</button>'+
    '<button class="btn-compact" data-action="add-new-map-file" title="Crear un mapa nuevo independiente subiendo archivo">+ Nuevo Mapa (Archivo)</button>'+
  '</div>' : '')+
  '<div class="filter-pills" style="margin-bottom:10px;">'+mapTabs+'</div>';

  // Barra de filtrado de marcadores (Estilo videojuego)
  var filterState = state._mapPinFilter || { hiddenTypes: {}, hideAll: false };
  var allPins = curMap.markers || [];
  
  if(allPins.length > 0){
    var typeCounts = {};
    allPins.forEach(function(p){
      var tDef = (typeof getMarkerTypeDef === "function") ? getMarkerTypeDef(p.kind) : { id: "poi", name: "Punto de Interés", icon: "📍", color: "#2A9D8F" };
      typeCounts[tDef.id] = (typeCounts[tDef.id] || 0) + 1;
    });

    var typePillsHtml = Object.keys(typeCounts).map(function(tid){
      var tDef = (typeof getMarkerTypeDef === "function") ? getMarkerTypeDef(tid) : { id: tid, name: tid, icon: "📍", color: "#2A9D8F" };
      var isMuted = !!(filterState.hiddenTypes && filterState.hiddenTypes[tid]);
      return '<button type="button" class="map-filter-pill' + (isMuted ? ' is-muted' : ' is-active') + '" data-action="toggle-map-pin-filter" data-type-id="' + tid + '" style="--pill-col:' + tDef.color + ';" title="' + (isMuted ? 'Mostrar ' : 'Ocultar ') + esc(tDef.name) + '">' +
        '<span class="mfp-icon">' + (tDef.icon || '📍') + '</span>' +
        '<span class="mfp-label">' + esc(tDef.name) + '</span>' +
        '<span class="mfp-count">' + typeCounts[tid] + '</span>' +
      '</button>';
    }).join('');

    html += '<div class="map-filter-bar">' +
      '<div class="map-filter-header">' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<span style="font-size:0.75rem;font-weight:700;color:var(--gold-light);">🗺️ Filtro de Marcadores:</span>' +
          '<span style="font-size:0.7rem;color:var(--ink-faint);">(' + allPins.length + ' puntos)</span>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:4px;">' +
          '<button type="button" class="btn-compact map-filter-toggle-all' + (filterState.hideAll ? ' is-off' : '') + '" data-action="toggle-map-pins-all" style="padding:3px 8px;font-size:0.68rem;">' +
            (filterState.hideAll ? '👁️ Mostrar Todos' : '🙈 Ocultar Todos') +
          '</button>' +
          ((Object.keys(filterState.hiddenTypes||{}).length > 0 || filterState.hideAll) ?
            '<button type="button" class="btn-compact" data-action="reset-map-pin-filter" style="padding:3px 8px;font-size:0.68rem;" title="Restablecer visibilidad de todos los tipos">↺ Restablecer</button>' : '') +
        '</div>' +
      '</div>' +
      '<div class="map-filter-shelf">' + typePillsHtml + '</div>' +
    '</div>';
  }

  if(curMap.image){
    html += '<div class="map-viewer" data-action="map-click">'+
      '<img src="'+curMap.image+'" alt="Mapa">'+
      (curMap.markers||[]).map(function(m){
        var tDef = (typeof getMarkerTypeDef === "function") ? getMarkerTypeDef(m.kind) : { id: "poi", name: "Punto de Interés", icon: "📍", color: "#2A9D8F" };
        var icon = m.icon || tDef.icon || "📍";
        var pinColor = m.color || tDef.color || "#2A9D8F";
        var isHidden = filterState.hideAll || (filterState.hiddenTypes && filterState.hiddenTypes[tDef.id]);
        if(isHidden) return '';

        return '<div class="map-pin pin-type-' + tDef.id + '" style="left:' + m.x + '%;top:' + m.y + '%;" data-action="edit-pin" data-id="' + m.id + '" title="' + esc(m.name) + ' (' + esc(tDef.name) + ')">' +
          '<div class="pin-balloon" style="background-color:' + pinColor + ';box-shadow:0 0 10px ' + pinColor + '88;">' +
            '<div class="pin-icon">' + icon + '</div>' +
          '</div>' +
          '<div class="pin-tag">' + esc(m.name) + '</div>' +
        '</div>';
      }).join('')+
    '</div>';
  } else {
    html += '<div class="map-viewer" style="display:flex;align-items:center;justify-content:center;color:var(--ink-faint);font-size:.82rem;padding:40px 10px;">Sin imagen cargada en '+esc(curMap.name)+'.</div>';
  }
  
  if(canEditMap){
    html += '<div class="map-toolbar" style="margin-top:8px;">'+
      '<span style="font-size:0.75rem;color:var(--ink-dim);margin-right:2px;width:100%;">Foto de este mapa ('+esc(curMap.name)+'):</span>'+
      '<button class="btn-compact" data-action="upload-map" title="Cambiar la imagen de este mapa subiendo un archivo">Subir Foto</button>'+
      '<button class="btn-compact" data-action="url-map" title="Cambiar la imagen de este mapa pegando un enlace URL">Pegar URL</button>'+
      (curMap.image?'<button class="btn-compact" data-action="remove-map" title="Quitar la foto pero conservar el mapa y sus marcadores">Quitar Foto</button>':'')+
      (s.maps.length>1?'<button class="btn-compact" style="margin-left:auto;color:var(--danger);" data-action="delete-map" title="Eliminar este mapa completo">✕ Borrar este Mapa</button>':'')+
    '</div>';
  }
  html += '</div>';
  return html;
}

async function pullMapFromSupabase(){
  if(!supabaseClient) return;
  try{
    try{
      var mapsRes = await supabaseClient.from('maps').select('*').order('order_index');
      if(mapsRes.data && mapsRes.data.length){
        var markersRes = await supabaseClient.from('map_markers').select('*');
        var allMarkers = (markersRes.data || []);
        state.maps = mapsRes.data.map(function(m){
          return {
            id: m.id,
            name: m.name,
            image: m.image_url,
            markers: allMarkers.filter(function(p){ return p.map_id === m.id; }).map(function(p){
              var parsed = (typeof parsePinNotesAndMeta === "function") ? parsePinNotesAndMeta(p.notes, p.kind, p.icon, p.color) : { kind: p.kind, icon: p.icon, color: p.color, notes: p.notes };
              return {
                id: p.id,
                x: Number(p.x),
                y: Number(p.y),
                name: p.name,
                kind: parsed.kind || p.kind || 'Punto de Interés',
                icon: parsed.icon || p.icon || null,
                color: parsed.color || p.color || null,
                notes: parsed.notes || '',
                created_by: p.created_by
              };
            })
          };
        });
        if(!state.activeMapId && state.maps.length) state.activeMapId = state.maps[0].id;
        saveState(true);
        if(state.activeTab==="mundo") renderTab();
        return;
      }
    }catch(errGranular){}

    var res = await supabaseClient.from('campaign_map').select('*').eq('id', 'main_map').maybeSingle();
    if(res.error) { console.error('Supabase error:', res.error); return; }
    if(res.data && (res.data.data || res.data.markers)){
      var remoteMaps = res.data.data || res.data.markers;
      if(Array.isArray(remoteMaps) && remoteMaps.length){
        state.maps = remoteMaps.map(function(m){
          return {
            id: m.id,
            name: m.name,
            image: m.image || m.image_url,
            markers: (m.markers || []).map(function(p){
              var parsed = (typeof parsePinNotesAndMeta === "function") ? parsePinNotesAndMeta(p.notes, p.kind, p.icon, p.color) : { kind: p.kind, icon: p.icon, color: p.color, notes: p.notes };
              return {
                id: p.id,
                x: Number(p.x),
                y: Number(p.y),
                name: p.name,
                kind: parsed.kind || p.kind || 'Punto de Interés',
                icon: parsed.icon || p.icon || null,
                color: parsed.color || p.color || null,
                notes: parsed.notes || '',
                created_by: p.created_by
              };
            })
          };
        });
        if(!state.activeMapId && state.maps.length) state.activeMapId = state.maps[0].id;
        saveState(true);
        if(state.activeTab==="mundo") renderTab();
      }
    }
  }catch(e){ console.error('Supabase error:', e); }
}

function pushMapsData(forceAllow){
  if(!supabaseClient) return;
  if(currentUser && !isGM() && !forceAllow) return;
  var mapData = (state.maps && state.maps.length) ? state.maps : [{ id:"world_main", name:"Mapa de Campaña", image:null, markers:[] }];
  supabaseClient.rpc('update_campaign_map', {
    map_id: 'main_map',
    patch: mapData
  }).then(function(res){
    if(res.error) {
      console.warn('RPC update_campaign_map (main_map) aviso, ejecutando upsert de seguridad:', res.error);
      supabaseClient.from('campaign_map').upsert({
        id: 'main_map',
        data: mapData,
        updated_at: new Date().toISOString()
      }).then(function(upRes){
        if(upRes.error) console.error('Error en upsert campaign_map (main_map):', upRes.error);
        else updateSyncBadge("synced");
      }).catch(function(e){ console.error('Error en upsert main_map:', e); });
      return;
    }
    updateSyncBadge("synced");
  }).catch(function(e){ console.error('Supabase error:', e); });
}
