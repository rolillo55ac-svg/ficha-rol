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

  if(curMap.image){
    html += '<div class="map-viewer" data-action="map-click">'+
      '<img src="'+curMap.image+'" alt="Mapa">'+
      (curMap.markers||[]).map(function(m){
        var kindClass = m.kind==="Capital"?"pin-capital":m.kind==="Punto de Interés"?"pin-poi":m.kind==="Peligro"?"pin-peligro":"pin-ciudad";
        return '<div class="map-pin '+kindClass+'" style="left:'+m.x+'%;top:'+m.y+'%;" data-action="edit-pin" data-id="'+m.id+'">'+
          '<div class="pin-glyph"></div><div class="pin-tag">'+esc(m.name)+'</div>'+
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
              return {
                id: p.id,
                x: Number(p.x),
                y: Number(p.y),
                name: p.name,
                kind: p.kind,
                notes: p.notes || '',
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
        state.maps = remoteMaps;
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
  supabaseClient.rpc('update_campaign_map', {
    map_id: 'main_map',
    patch: state.maps || []
  }).then(function(res){
    if(res.error) {
      console.error('Error en update_campaign_map (main_map):', res.error);
      return;
    }
    updateSyncBadge("synced");
  }).catch(function(e){ console.error('Supabase error:', e); });
}
