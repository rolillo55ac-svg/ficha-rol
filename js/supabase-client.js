var activeCharChannel = null;
var campaignMapChannel = null;

function subscribeToActiveCharacter(charDbId){
  if(!supabaseClient) return;
  if(!charDbId){
    var c = (typeof activeChar === 'function') ? activeChar() : null;
    charDbId = c ? (c.db_id || (c.id && c.id.includes('-') ? c.id : null)) : null;
  }
  if(!charDbId) return;

  var topicName = 'character_' + charDbId;
  if(activeCharChannel && activeCharChannel.topic === 'realtime:' + topicName){
    return;
  }

  if(activeCharChannel){
    try { supabaseClient.removeChannel(activeCharChannel); } catch(e){}
    activeCharChannel = null;
  }

  try {
    activeCharChannel = supabaseClient.channel(topicName)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'characters',
        filter: 'id=eq.' + charDbId
      }, function(payload){
        handleRemoteCharacterChange(payload);
      })
      .subscribe(function(status){
        if(status === 'SUBSCRIBED'){
          console.log('Realtime activo para personaje:', charDbId);
        }
      });
  } catch(e){
    console.error('Error suscribiendo a Realtime de personaje:', e);
  }
}

function subscribeToCampaignMap(){
  if(!supabaseClient || campaignMapChannel) return;
  try {
    campaignMapChannel = supabaseClient.channel('realtime_campaign_map')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'campaign_map'
      }, function(payload){
        handleRemoteCampaignMapChange(payload);
      })
      .subscribe(function(status){
        if(status === 'SUBSCRIBED'){
          console.log('Realtime activo para campaign_map');
        }
      });
  } catch(e){
    console.error('Error suscribiendo a Realtime de campaign_map:', e);
  }
}

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
      realtimeChannel = supabaseClient.channel('realtime_broadcasts', {
        config: { broadcast: { self: false } }
      })
        .on('broadcast', { event: 'dice_roll' }, function(payload){
          if(payload && payload.payload) handleRemoteDiceRoll(payload.payload);
        })
        .on('broadcast', { event: 'char_stat_update' }, function(payload){
          if(payload && payload.payload) handleRemoteCharStatUpdate(payload.payload);
        })
        .on('broadcast', { event: 'campaign_compendium_update' }, function(payload){
          if(payload && payload.payload) handleRemoteCompendiumBroadcast(payload.payload);
        })
        .on('broadcast', { event: 'ticket_reply' }, function(payload){
          if(payload && payload.payload && typeof handleRemoteTicketReply === 'function') handleRemoteTicketReply(payload.payload);
        })
        .on('broadcast', { event: 'new_ticket_report' }, function(payload){
          if(payload && payload.payload && typeof handleRemoteNewTicket === 'function') handleRemoteNewTicket(payload.payload);
        })
        .on('broadcast', { event: 'app_version_update' }, function(payload){
          if(payload && payload.payload && typeof handleRemoteVersionUpdate === 'function') handleRemoteVersionUpdate(payload.payload);
        })
        .on('postgres_changes', {event:'*', schema:'public', table:'map_markers'}, function(payload){
          handleRemoteMarkerChange(payload);
        })
        .on('postgres_changes', {event:'*', schema:'public', table:'maps'}, function(payload){
          pullMapFromSupabase();
        })
        .subscribe();
    }

    subscribeToCampaignMap();

    var cur = (typeof activeChar === 'function') ? activeChar() : null;
    if(cur && cur.db_id) subscribeToActiveCharacter(cur.db_id);

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
  var target = (state.characters||[]).find(function(x){ return x.id === data.charId || x.db_id === data.charId; });
  if(target){
    if(canEditChar(target) && target._lastLocalEdit && Date.now() - target._lastLocalEdit < 1500) return;
    if(data.combat) target.combat = Object.assign(target.combat||{}, data.combat);
    target._isDirty = false;
    dirtyCharIds.delete(target.id);
    saveState(true);
    if(state.activeId === data.charId || state.activeId === target.id){
      renderTopbar();
      if((state.activeTab==="combate" || state.activeTab==="magia") && (!document.activeElement || !document.activeElement.matches("input, textarea"))){
        renderTab();
      }
    }
  }
}

function handleRemoteCompendiumBroadcast(comp){
  if(!comp) return;
  if(Array.isArray(comp.weaponsCatalog)) state.weaponsCatalog = comp.weaponsCatalog;
  if(Array.isArray(comp.bestiary)) state.bestiary = comp.bestiary;
  if(comp.lore && comp.lore.objetos) state.lore = comp.lore;
  if(Array.isArray(comp.buffCatalog)) state.buffCatalog = comp.buffCatalog;
  if(Array.isArray(comp.quests)) state.quests = comp.quests;
  if(Array.isArray(comp.questClues)) state.questClues = comp.questClues;
  if(Array.isArray(comp._deletedSeedQuests)) state._deletedSeedQuests = comp._deletedSeedQuests;
  if(Array.isArray(comp._deletedSeedClues)) state._deletedSeedClues = comp._deletedSeedClues;
  if(comp.questMap && comp.questMap.name) state.questMap = comp.questMap;
  if(typeof comp.sessionSummary === "string") state.sessionSummary = comp.sessionSummary;
  state = migrateState(state);
  saveState(true);
  if(["mundo","bestiario","mision"].indexOf(state.activeTab) !== -1){
    if(!document.activeElement || !document.activeElement.matches("input, textarea")) renderTab();
  }
}

function handleRemoteCampaignMapChange(payload){
  if(!payload || !payload.new) return;
  var row = payload.new;
  if(row.id === 'main_map'){
    var remoteMaps = row.data || row.markers;
    if(Array.isArray(remoteMaps) && remoteMaps.length){
      state.maps = remoteMaps;
      if(!state.activeMapId && state.maps.length) state.activeMapId = state.maps[0].id;
      saveState(true);
      if(state.activeTab === "mundo") renderTab();
    }
  } else if(row.id === 'world_compendium'){
    var comp = row.data;
    if(comp){
      handleRemoteCompendiumBroadcast(comp);
    }
  }
}

function handleRemoteCharacterChange(payload){
  if(!payload || !payload.eventType) return;
  if(payload.eventType === 'DELETE'){
    var delId = payload.old ? payload.old.id : null;
    if(delId){
      dirtyCharIds.delete(delId);
      if(typeof dirtyCharPatches !== 'undefined') dirtyCharPatches.delete(delId);
      var removed = (state.characters||[]).filter(function(x){ return x.db_id === delId || x.id === delId; });
      removed.forEach(function(r){
        dirtyCharIds.delete(r.id);
        if(r.db_id) dirtyCharIds.delete(r.db_id);
        if(typeof dirtyCharPatches !== 'undefined') dirtyCharPatches.delete(r.id);
      });
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
      c._isDirty = false;
      c._serverUpdatedAt = row.updated_at ? new Date(row.updated_at).getTime() : Date.now();
      if(row.owner_id) c.owner_id = row.owner_id;

      var idx = state.characters.findIndex(function(x){
        return x.db_id === row.id || x.id === c.id || (x.name && c.name && x.name.trim().toLowerCase() === c.name.trim().toLowerCase());
      });

      if(idx !== -1){
        var localChar = state.characters[idx];
        var activeEl = document.activeElement;
        var activeBind = (activeEl && activeEl.matches("input, textarea")) ? activeEl.getAttribute("data-bind") : null;
        var activeVal = activeBind ? activeEl.value : null;

        var updated = ensureCharDefaults(c);
        if(typeof snapshotCharacterSynced === 'function') snapshotCharacterSynced(updated);

        if(localChar.id === state.activeId && activeBind && activeVal !== null){
          setBind(updated, activeBind, activeVal, activeEl.type);
        }

        dirtyCharIds.delete(localChar.id);
        if(localChar.db_id) dirtyCharIds.delete(localChar.db_id);
        if(typeof dirtyCharPatches !== 'undefined') dirtyCharPatches.delete(localChar.id);
        state.characters[idx] = updated;
      } else {
        dirtyCharIds.delete(c.id);
        if(c.db_id) dirtyCharIds.delete(c.db_id);
        if(typeof dirtyCharPatches !== 'undefined') dirtyCharPatches.delete(c.id);
        var newChar = ensureCharDefaults(c);
        if(typeof snapshotCharacterSynced === 'function') snapshotCharacterSynced(newChar);
        state.characters.push(newChar);
      }

      if(!state.activeId) state.activeId = c.id;
      saveState(true);
      renderTopbar();
      renderTabbar();

      if(!document.activeElement || !document.activeElement.matches("input, textarea")){
        renderTab();
      }
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

function handleRemoteVersionUpdate(payload){
  if(!payload) return;
  var targetVer = payload.version ? ("v" + payload.version) : "la última versión";
  showToast("📢 El Administrador ha emitido una actualización (" + targetVer + "). Actualizando...", "info");
  setTimeout(function(){
    if(typeof executeUnifiedAppUpdate === "function"){
      executeUnifiedAppUpdate(false);
    } else {
      window.location.reload();
    }
  }, 1200);
}
window.handleRemoteVersionUpdate = handleRemoteVersionUpdate;
