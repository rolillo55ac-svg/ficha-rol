var activeCharChannel = null;
// Hora de servidor del último cambio de ficha aplicado (por id): los avisos que llegan desordenados y son más viejos se ignoran
var lastRemoteCharTs = {};
var campaignMapChannel = null;
var appLocked = true;
var appStarted = false;

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
    activeCharChannel = supabaseClient.channel(topicName, { config: { private: true } })
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
  // La copia local puede ser vieja (otro la cambió sin estar suscritos): se trae la de la nube
  refreshCharFromServer(charDbId);
}

async function refreshCharFromServer(charDbId){
  if(!supabaseClient || !charDbId) return;
  try {
    var res = await supabaseClient.from('characters').select('*').eq('id', charDbId).maybeSingle();
    var row = res && res.data;
    if(!row || !row.data) return;
    var local = (state.characters||[]).find(function(x){ return x.db_id === row.id; });
    var ts = row.updated_at ? new Date(row.updated_at).getTime() : 0;
    if(local && local._serverUpdatedAt && ts && ts <= local._serverUpdatedAt) return;
    handleRemoteCharacterChange({ eventType: 'UPDATE', new: row });
  } catch(e){
    console.warn('No se pudo refrescar la ficha:', e);
  }
}

function subscribeToCampaignMap(){
  if(!supabaseClient || campaignMapChannel) return;
  try {
    campaignMapChannel = supabaseClient.channel('realtime_campaign_map', { config: { private: true } })
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
  if(!window.supabase){ checkSessionGate(); return; }
  try{
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    
    checkSessionGate();

    supabaseClient.auth.onAuthStateChange(function(e, session){
      var prevUserId = currentUser ? currentUser.id : null;
      currentUser = session ? session.user : null;
      // Otra cuenta o sin sesión: fuera cualquier rol heredado hasta leer el perfil
      if(!currentUser || currentUser.id !== prevUserId) resetSessionRole();
      if(currentUser){
        if(appLocked) enterApp(); else fetchUserProfile();
      } else if(e === 'SIGNED_OUT' && !appLocked){
        lockApp();
      }
    });
  }catch(e){
    console.error('Supabase error:', e);
    checkSessionGate();
  }
}

// Sin sesión no se pinta ni se pide nada: solo la pantalla de entrada.
// Sin red pero con sesión guardada, se entra con lo que hay en caché.
function checkSessionGate(){
  if(!supabaseClient){
    if(hasStoredSession()) enterApp(); else showLoginGate();
    return;
  }
  supabaseClient.auth.getSession().then(function(res){
    var session = res && res.data && res.data.session;
    if(!appLocked) return;
    if(session){
      currentUser = session.user;
      enterApp();
    } else if(isOffline(res && res.error) && hasStoredSession()){
      enterApp();
    } else {
      showLoginGate();
    }
  }).catch(function(e){
    console.error('Supabase error:', e);
    if(isOffline(e) && hasStoredSession()) enterApp(); else showLoginGate();
  });
}

function isOffline(err){
  if(typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  return !!(err && (err.name === 'AuthRetryableFetchError' || /fetch|network/i.test(err.message || '')));
}

function hasStoredSession(){
  try {
    // Solo la sesión del proyecto de la partida elegida
    var ref = SUPABASE_URL.replace(/^https?:\/\//, '').split('.')[0];
    for(var i = 0; i < localStorage.length; i++){
      var k = localStorage.key(i);
      if(k === 'sb-' + ref + '-auth-token'){
        var v = JSON.parse(localStorage.getItem(k) || 'null');
        if(v && (v.refresh_token || (v.currentSession && v.currentSession.refresh_token))) return true;
      }
    }
  } catch(e){}
  return false;
}

function showLoginGate(){
  appLocked = true;
  document.body.classList.add('auth-locked');
  var gate = document.getElementById('loginGate');
  if(gate) gate.hidden = false;
  var wrap = document.getElementById('gatePartidaWrap');
  var sel = document.getElementById('gatePartida');
  if(wrap && sel && PARTIDAS.length > 1){
    sel.innerHTML = PARTIDAS.map(function(p){
      return '<option value="' + esc(p.id) + '"' + (p.id === PARTIDA_ACTUAL.id ? ' selected' : '') + '>' + esc(p.nombre) + '</option>';
    }).join('');
    sel.onchange = function(){ cambiarPartida(sel.value); };
    wrap.hidden = false;
  }
  if(typeof hideLoadingScreen === 'function') hideLoadingScreen();
}

function enterApp(){
  var firstTime = !appStarted;
  appLocked = false;
  appStarted = true;
  document.body.classList.remove('auth-locked');
  var gate = document.getElementById('loginGate');
  if(gate) gate.hidden = true;
  renderTopbar();
  renderTabbar();
  renderTab();
  if(firstTime) startRealtime();
  if(currentUser) fetchUserProfile();
  if(firstTime && typeof bienvenidaInicio === 'function') bienvenidaInicio();
  if(firstTime){
    setTimeout(function(){
      if(typeof syncPlayerTicketsWithSupabase === 'function') syncPlayerTicketsWithSupabase();
      if(typeof syncAdminTicketsWithSupabase === 'function' && typeof isGM === 'function' && isGM()) syncAdminTicketsWithSupabase();
    }, 1500);
  }
}

// Al cerrar sesión se vacía la pantalla al momento y se recarga para no dejar datos ni canales en memoria
function lockApp(){
  if(typeof closeModals === 'function') try { closeModals(); } catch(e){}
  ['topbar', 'tabbar', 'main'].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.innerHTML = '';
  });
  showLoginGate();
  setTimeout(function(){ location.reload(); }, 400);
}

function startRealtime(){
  if(!supabaseClient) return;
  try {
    if(!realtimeChannel){
      realtimeChannel = supabaseClient.channel('realtime_broadcasts', {
        config: { broadcast: { self: false }, private: true }
      })
        .on('broadcast', { event: 'dice_roll' }, function(payload){
          if(payload && payload.payload) handleRemoteDiceRoll(payload.payload);
        })
        .on('broadcast', { event: 'roll_request' }, function(payload){
          if(typeof handleRemoteRollRequest === 'function') handleRemoteRollRequest(payload && payload.payload);
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
        .on('broadcast', { event: 'level_up' }, function(payload){
          if(payload && payload.payload && typeof handleRemoteLevelUp === 'function') handleRemoteLevelUp(payload.payload);
        })
        .on('broadcast', { event: 'long_rest' }, function(payload){
          if(payload && payload.payload && typeof handleRemoteLongRest === 'function') handleRemoteLongRest(payload.payload);
        })
        .on('broadcast', { event: 'char_sound' }, function(payload){
          if(payload && payload.payload && typeof handleRemoteCharSound === 'function') handleRemoteCharSound(payload.payload);
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
  }catch(e){ console.error('Supabase error:', e); }
}

// Aviso pequeño arriba: no se ve nada si todo va bien
function setConnectionStatus(st){
  var el = document.getElementById('connStatus');
  if(st === 'ok'){ if(el) el.remove(); return; }
  if(!el){
    el = document.createElement('div');
    el.id = 'connStatus';
    el.className = 'conn-status-pill';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = st === 'offline' ? 'Sin conexión' : 'Reconectando…';
  el.classList.toggle('is-offline', st === 'offline');
}

// Canales caídos (móvil bloqueado, red cortada): se quitan y se vuelven a crear
function reviveRealtimeChannels(){
  if(!supabaseClient) return;
  var rt = supabaseClient.realtime;
  if(rt && typeof rt.isConnected === 'function' && !rt.isConnected()){
    try { rt.connect(); } catch(e){}
  }
  var chans = typeof supabaseClient.getChannels === 'function' ? supabaseClient.getChannels().slice() : [];
  // Un canal cerrado sale de la lista del cliente, pero puede seguir guardado en su variable
  [realtimeChannel, activeCharChannel, campaignMapChannel, typeof gameClockChannel !== 'undefined' ? gameClockChannel : null].forEach(function(ch){
    if(ch && chans.indexOf(ch) === -1) chans.push(ch);
  });
  var broadcastDown = false;
  chans.forEach(function(ch){
    if(ch.state === 'joined' || ch.state === 'joining') return;
    try { supabaseClient.removeChannel(ch); } catch(e){}
    if(ch === realtimeChannel){ realtimeChannel = null; broadcastDown = true; }
    if(ch === activeCharChannel) activeCharChannel = null;
    if(ch === campaignMapChannel) campaignMapChannel = null;
    if(typeof gameClockChannel !== 'undefined' && ch === gameClockChannel) gameClockChannel = null;
    if(ch.topic === 'realtime:realtime_house_rooms' && typeof houseState !== 'undefined') houseState._subscribedRealtime = false;
  });
  if(!realtimeChannel || !campaignMapChannel || !activeCharChannel) startRealtime();
  if(typeof gameClockChannel !== 'undefined' && !gameClockChannel && typeof subscribeGameClock === 'function') subscribeGameClock();
  if(typeof houseState !== 'undefined' && (broadcastDown || !houseState._subscribedRealtime) && typeof initHouseRealtimeSync === 'function'){
    if(broadcastDown) houseState._settingsListener = false;
    try { initHouseRealtimeSync(); } catch(e){}
  }
}

// Al volver de segundo plano o de estar sin red: reconectar y volver a leer lo que se ve
var catchUpRunning = false;
async function catchUpWithServer(opts){
  opts = opts || {};
  if(!supabaseClient || !currentUser || appLocked) return false;
  if(typeof navigator !== 'undefined' && navigator.onLine === false){
    setConnectionStatus('offline');
    return false;
  }
  if(catchUpRunning) return false;
  catchUpRunning = true;
  setConnectionStatus('reconnecting');
  var ok = true;
  try {
    if(typeof flushPendingSync === 'function') flushPendingSync();
    reviveRealtimeChannels();
    var jobs = [pullAllFromSupabase()];
    // Con guardados compartidos aún en camino no se pisa el compendio ni el mapa con la copia de la nube
    if(!(typeof hasPendingSaves === 'function' && hasPendingSaves())){
      jobs.push(pullSharedDataFromSupabase(), pullMapFromSupabase());
    }
    if(typeof loadGameClock === 'function') jobs.push(loadGameClock());
    if(typeof loadRollHistory === 'function') jobs.push(loadRollHistory());
    if(typeof loadRollRequests === 'function') jobs.push(loadRollRequests());
    if(!opts.skipHouse && typeof houseState !== 'undefined' && houseState.active && typeof fetchHouseRemoteData === 'function'){
      jobs.push(fetchHouseRemoteData().then(function(){ if(houseState.active) renderHouseView(); }));
    }
    await Promise.all(jobs.map(function(p){ return Promise.resolve(p).catch(function(){ ok = false; }); }));
  } catch(e){
    ok = false;
    console.warn('No se pudo poner al día:', e);
  }
  catchUpRunning = false;
  if(typeof navigator !== 'undefined' && navigator.onLine === false){ setConnectionStatus('offline'); return false; }
  setConnectionStatus('ok');
  return ok;
}

// Puesta al día pedida a mano (deslizar arriba del todo o botón de Ajustes)
async function syncDataNow(){
  if(catchUpRunning) return false;
  if(typeof navigator !== 'undefined' && navigator.onLine === false){
    setConnectionStatus('offline');
    showToast('Sin conexión: no se puede sincronizar', 'error');
    return false;
  }
  var ok = await catchUpWithServer();
  showToast(ok ? 'Datos al día' : 'No se pudo sincronizar del todo', ok ? 'success' : 'error');
  return ok;
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
    // Vida/maná pendientes de guardar aquí: no pisarlos con los de otro
    if(canEditChar(target) && Array.isArray(target._pendingKeys) && target._pendingKeys.indexOf("combat") !== -1) return;
    if(data.combat){
      target.combat = Object.assign(target.combat||{}, data.combat);
      if(target._lastSyncedData){
        try { target._lastSyncedData.combat = JSON.parse(JSON.stringify(target.combat)); } catch(e){}
      }
    }
    if(!Array.isArray(target._pendingKeys) || !target._pendingKeys.length){
      target._isDirty = false;
      dirtyCharIds.delete(target.id);
    }
    saveState(true);
    if(state.activeId === data.charId || state.activeId === target.id){
      renderTopbar();
      if((state.activeTab==="combate" || state.activeTab==="magia" || state.activeTab==="estados") && (!document.activeElement || !document.activeElement.matches("input, textarea"))){
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
      delete lastRemoteCharTs[delId];
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
      var rowTs = row.updated_at ? new Date(row.updated_at).getTime() : 0;
      if(rowTs && lastRemoteCharTs[row.id] && rowTs < lastRemoteCharTs[row.id]) return;
      // Aviso que llega tarde y es más viejo que nuestro último guardado: traería datos de antes y los pisaría
      var ownSaved = (state.characters||[]).find(function(x){ return x.db_id === row.id; });
      if(rowTs && ownSaved && ownSaved._serverUpdatedAt && rowTs < ownSaved._serverUpdatedAt) return;
      if(rowTs) lastRemoteCharTs[row.id] = rowTs;
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
        // Cambios locales aún sin confirmar (p. ej. varios toques rápidos): se mantienen y se reenvían
        var keptPending = carryCharPending(localChar, updated);
        state.characters[idx] = updated;
        if(keptPending){
          saveState(false);
        }
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
  if(typeof startForcedAppUpdate === "function"){
    startForcedAppUpdate(payload.version);
  } else if(typeof executeUnifiedAppUpdate === "function"){
    executeUnifiedAppUpdate(false);
  }
}
window.handleRemoteVersionUpdate = handleRemoteVersionUpdate;
