// ============================================================================
// KRYSALIS RPG - MÓDULO: SUPABASE CLIENT & REALTIME
// Conexión a base de datos y suscripciones Realtime granulares
// ============================================================================


function initSupabase(){
  if(!window.supabase) return;
  try{
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    
    if(!realtimeChannel){
      realtimeChannel = supabaseClient.channel('realtime_all_changes', {
        config: { broadcast: { self: false } }
      })
        .on('broadcast', { event: 'dice_roll' }, function(payload){
          if(payload && payload.payload) handleRemoteDiceRoll(payload.payload);
        })
        .on('broadcast', { event: 'char_stat_update' }, function(payload){
          if(payload && payload.payload) handleRemoteCharStatUpdate(payload.payload);
        })
        .on('postgres_changes', {event:'*', schema:'public', table:'campaign_map'}, function(payload){
          if(payload && payload.new){
            var row = payload.new;
            if(row.id === 'main_map'){
              var remoteMaps = row.data || row.markers;
              if(Array.isArray(remoteMaps) && remoteMaps.length){
                state.maps = remoteMaps;
                if(!state.activeMapId && state.maps.length) state.activeMapId = state.maps[0].id;
                saveState(true);
                if(state.activeTab==="mundo") renderTab();
              }
            } else if(row.id === 'world_compendium'){
              var comp = row.data;
              if(comp){
                if(comp.weaponsCatalog) state.weaponsCatalog = comp.weaponsCatalog;
                if(comp.bestiary) state.bestiary = comp.bestiary;
                if(comp.lore) state.lore = comp.lore;
                if(comp.buffCatalog) state.buffCatalog = comp.buffCatalog;
                if(comp.quests) state.quests = comp.quests;
                if(comp.questClues) state.questClues = comp.questClues;
                if(comp.questMap) state.questMap = comp.questMap;
                if(comp.sessionSummary !== undefined) state.sessionSummary = comp.sessionSummary;
                saveState(true);
                if(["mundo","bestiario","mision"].indexOf(state.activeTab)!==-1){
                  if(!document.activeElement || !document.activeElement.matches("input, textarea")) renderTab();
                }
              }
            }
          }
        })
        .on('postgres_changes', {event:'*', schema:'public', table:'characters'}, function(payload){
          handleRemoteCharacterChange(payload);
        })
        .on('postgres_changes', {event:'*', schema:'public', table:'map_markers'}, function(payload){
          handleRemoteMarkerChange(payload);
        })
        .on('postgres_changes', {event:'*', schema:'public', table:'maps'}, function(payload){
          pullMapFromSupabase();
        })
        .subscribe();
    }

    pullMapFromSupabase();
    pullSharedDataFromSupabase();
    pullAllFromSupabase();

    supabaseClient.auth.getSession().then(function(res){
      if(res.data && res.data.session){ currentUser = res.data.session.user; fetchUserProfile(); }
      else { updateSyncBadge("synced"); }
    }).catch(function(e){ console.error('Supabase error:', e); });

    supabaseClient.auth.onAuthStateChange(function(e, session){
      currentUser = session ? session.user : null;
      if(currentUser){ fetchUserProfile(); } else { currentRole='player'; updateSyncBadge("synced"); renderTopbar(); renderTab(); }
    });
  }catch(e){ console.error('Supabase error:', e); }
}


function broadcastCharStatUpdate(charId, combatObj){
  if(supabaseClient && realtimeChannel){
    try{
      realtimeChannel.send({
        type: 'broadcast',
        event: 'char_stat_update',
        payload: { charId: charId, combat: combatObj, ts: Date.now() }
      });
    }catch(e){ console.warn("Could not broadcast char stat update:", e); }
  }
}

function handleRemoteCharStatUpdate(data){
  if(!data || !data.charId) return;
  var target = (state.characters||[]).find(function(x){ return x.id === data.charId; });
  if(target){
    if(target._isDirty || dirtyCharIds.has(target.id) || (target._lastLocalEdit && Date.now() - target._lastLocalEdit < 3500)) return;
    if(data.combat) target.combat = Object.assign(target.combat||{}, data.combat);
    saveState(true);
    if(state.activeId === data.charId){
      renderTopbar();
      if((state.activeTab==="combate" || state.activeTab==="magia") && (!document.activeElement || !document.activeElement.matches("input, textarea"))){
        renderTab();
      }
    }
  }
}

function handleRemoteCharacterChange(payload){
  if(!payload || !payload.eventType) return;
  if(payload.eventType === 'DELETE'){
    var delId = payload.old ? payload.old.id : null;
    if(delId){
      state.characters = (state.characters||[]).filter(function(x){ return x.db_id !== delId && x.id !== delId; });
      if(!state.characters.length) state.characters.push(blankCharacter("Sin Personaje"));
      if(!state.characters.some(function(x){return x.id===state.activeId;})){
        var validChars = getUserCharacters();
        state.activeId = validChars[0] ? validChars[0].id : state.characters[0].id;
      }
      saveState(true); renderTopbar(); renderTabbar();
      if(!document.activeElement || !document.activeElement.matches("input, textarea")) renderTab();
    }
  } else {
    var row = payload.new;
    if(row && row.data){
      var c = row.data;
      c.db_id = row.id;
      if(row.owner_id) c.owner_id = row.owner_id;
      var idx = state.characters.findIndex(function(x){ return x.db_id === row.id || x.id === c.id || (x.name && c.name && x.name.trim().toLowerCase() === c.name.trim().toLowerCase()); });
      if(idx !== -1){
        var localChar = state.characters[idx];
        if(localChar._isDirty || dirtyCharIds.has(localChar.id) || (localChar._lastLocalEdit && Date.now() - localChar._lastLocalEdit < 1200)){
          return;
        }
        if(localChar.id === state.activeId && document.activeElement && document.activeElement.getAttribute("data-bind") === "personalNotes"){
          c.personalNotes = localChar.personalNotes;
        }
        state.characters[idx] = ensureCharDefaults(c);
      } else {
        state.characters.push(ensureCharDefaults(c));
      }
      if(!state.activeId) state.activeId = c.id;
      saveState(true); renderTopbar(); renderTabbar();
      if(!document.activeElement || !document.activeElement.matches("input, textarea")){
        renderTab();
      }
    }
  }
}

function handleRemoteSharedDataChange(payload){
  if(!payload || !payload.new || !payload.new.data) return;
  var sharedData = payload.new.data;
  if(sharedData.weaponsCatalog) state.weaponsCatalog = sharedData.weaponsCatalog;
  if(sharedData.bestiary) state.bestiary = sharedData.bestiary;
  if(sharedData.lore) state.lore = sharedData.lore;
  if(sharedData.buffCatalog) state.buffCatalog = sharedData.buffCatalog;
  if(sharedData.quests) state.quests = sharedData.quests;
  if(sharedData.questClues) state.questClues = sharedData.questClues;
  if(sharedData.questMap) state.questMap = sharedData.questMap;
  if(sharedData.sessionSummary !== undefined) state.sessionSummary = sharedData.sessionSummary;
  saveState(true);
  if(["mundo","bestiario","mision"].indexOf(state.activeTab)!==-1){
    if(!document.activeElement || !document.activeElement.matches("input, textarea")){
      renderTab();
    }
  }
}

function handleRemoteMarkerChange(payload){
  if(!payload) return;
  if(payload.eventType === 'DELETE' || (payload.old && !payload.new)){
    var delId = (payload.old && payload.old.id) ? payload.old.id : payload.id;
    var changed = false;
    (state.maps||[]).forEach(function(m){
      if(m.markers){
        var beforeLen = m.markers.length;
        m.markers = m.markers.filter(function(p){ return p.id !== delId; });
        if(m.markers.length !== beforeLen) changed = true;
      }
    });
    if(changed){
      saveState(true);
      if(state.activeTab === "mundo") renderTab();
    }
  } else if(payload.new){
    var row = payload.new;
    var targetMap = (state.maps||[]).find(function(m){ return m.id === row.map_id; }) || (state.maps && state.maps[0]);
    if(targetMap){
      if(!targetMap.markers) targetMap.markers = [];
      var existingPin = targetMap.markers.find(function(p){ return p.id === row.id; });
      var pinData = {
        id: row.id,
        x: Number(row.x),
        y: Number(row.y),
        name: row.name,
        kind: row.kind,
        notes: row.notes || '',
        created_by: row.created_by
      };
      if(existingPin){
        Object.assign(existingPin, pinData);
      } else {
        targetMap.markers.push(pinData);
      }
      saveState(true);
      if(state.activeTab === "mundo") renderTab();
    }
  }
}
