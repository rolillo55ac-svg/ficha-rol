var STORAGE_KEY = "krysalisFichasV311";
var SUPABASE_URL = "https://nwjbdevshaucnjrwebtb.supabase.co";
var SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53amJkZXZzaGF1Y25qcndlYnRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMzA4OTIsImV4cCI6MjEwMzYwNjg5Mn0.WUISbOthy-5hTZ69p5lydHxHP4ZfAM4nLFa13lKPoeY";


var syncDebounceTimer = null;
var dirtyCharIds = new Set();
var dirtyCharPatches = new Map();
var isGlobalDirty = false;

var CHAR_DATA_KEYS = [
  "name", "theme", "portrait", "isNPC", "owner_id", "ownerEmail",
  "nivel", "lugarNacimiento", "altura", "peso", "edad", "ojos", "pelo", "trabajo", "descripcion",
  "attrs", "skillBonus", "skillProgress", "skillPointsUnlocked", "skillHybrid", "customSkills",
  "combat", "weapons", "armors", "inventory", "money",
  "magiaTipo", "spells", "stones", "passivesNeg", "passivesPos",
  "goddessCurses", "goddessBlessings", "goddessTable",
  "summons", "buffs", "customBuffs", "poisons", "skillPoints",
  "activeBuffs", "personalNotes", "trainings"
];

function getCharacterDiffPatch(c){
  if(!c) return {};
  var patch = {};
  if(!c._lastSyncedData){
    return patch;
  }
  CHAR_DATA_KEYS.forEach(function(k){
    if(c[k] !== undefined){
      try {
        var curJson = JSON.stringify(c[k]);
        var lastJson = JSON.stringify(c._lastSyncedData[k]);
        if(curJson !== lastJson){
          patch[k] = JSON.parse(curJson);
        }
      } catch(e){}
    }
  });
  return patch;
}

function snapshotCharacterSynced(c){
  if(!c) return;
  c._lastSyncedData = {};
  CHAR_DATA_KEYS.forEach(function(k){
    if(c[k] !== undefined){
      try {
        c._lastSyncedData[k] = JSON.parse(JSON.stringify(c[k]));
      } catch(e){
        c._lastSyncedData[k] = c[k];
      }
    }
  });
}

function markCharDirty(charId, patchOrKey){
  if(!charId) return;
  var target = (state.characters||[]).find(function(x){ return x.id === charId || x.db_id === charId; });
  if(target){
    if(!canEditChar(target)){
      console.warn("markCharDirty ignorado: sin permiso para editar", target.name);
      return;
    }
    target._isDirty = true;
    target._lastLocalEdit = Date.now();
    dirtyCharIds.add(target.id);
    if(target.db_id) dirtyCharIds.add(target.db_id);

    if(!dirtyCharPatches.has(target.id)){
      dirtyCharPatches.set(target.id, {});
    }
    var p = dirtyCharPatches.get(target.id);

    if(patchOrKey && typeof patchOrKey === 'object'){
      Object.assign(p, patchOrKey);
    } else if(typeof patchOrKey === 'string'){
      var rootKey = patchOrKey.split(".")[0];
      if(target[rootKey] !== undefined){
        try {
          p[rootKey] = JSON.parse(JSON.stringify(target[rootKey]));
        } catch(e){
          p[rootKey] = target[rootKey];
        }
      }
    }
  }
}

function flushPendingSync(){
  if(syncDebounceTimer){
    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = null;
  }
  if(!supabaseClient || isRemoteSyncing) return;

  var toPush = new Set();
  dirtyCharIds.forEach(function(cid){
    var c = (state.characters || []).find(function(x){ return x.id === cid || x.db_id === cid; });
    if(c && canEditChar(c)) toPush.add(c.id);
    else {
      dirtyCharIds.delete(cid);
      dirtyCharPatches.delete(cid);
    }
  });

  (state.characters || []).forEach(function(c){
    if(c && (c._isDirty || dirtyCharPatches.has(c.id)) && c.id){
      if(canEditChar(c)) toPush.add(c.id);
      else {
        c._isDirty = false;
        dirtyCharIds.delete(c.id);
        dirtyCharPatches.delete(c.id);
      }
    }
  });

  dirtyCharIds.clear();
  toPush.forEach(function(cid){
    pushCharacterById(cid);
  });

  if(isGlobalDirty || state._isSharedDirty){
    isGlobalDirty = false;
    state._isSharedDirty = false;
    if(isGM() || !currentUser) pushSharedData();
  }
}

function saveState(skipRemote){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if(state.activeId){
      localStorage.setItem("krysalis_active_id", state.activeId);
      var curC = (state.characters||[]).find(function(x){ return x.id === state.activeId || x.db_id === state.activeId; });
      if(curC){
        if(curC.db_id) localStorage.setItem("krysalis_active_db_id", curC.db_id);
        if(curC.name) localStorage.setItem("krysalis_active_name", curC.name);
      }
    }
    if(state.activeTab) localStorage.setItem("krysalis_active_tab", state.activeTab);
  }catch(e){
    console.error("Error al guardar en localStorage:", e);
  }
  if(!skipRemote && supabaseClient && (dirtyCharIds.size > 0 || dirtyCharPatches.size > 0 || isGlobalDirty || state._isSharedDirty)){
    updateSyncBadge("saving");
    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = setTimeout(function(){
      flushPendingSync();
    }, 250);
  }
}

function updateSyncBadge(st){
  var el = document.getElementById("syncBadge");
  if(!el) return;
  if(st==="synced"){ el.className="sync-status synced"; el.textContent="● En la nube"; }
  else if(st==="saving"){ el.className="sync-status saving"; el.textContent="⏳ Guardando..."; }
  else { el.className="sync-status"; el.textContent="○ Local"; }
}


function exportFullBackup(){
  var dateStr = new Date().toISOString().slice(0, 10);
  var backupData = {
    krysalis_system: "Krysalis RPG",
    version: "v0.9.1",
    backup_type: "full_disaster_recovery",
    timestamp: new Date().toISOString(),
    support_contact: "rolillo55ac@gmail.com",
    state: state
  };
  var blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "krysalis_backup_completo_" + dateStr + ".json";
  a.click();
  showToast("Copia de seguridad completa descargada con éxito", "success");
}

function exportData(){
  exportFullBackup();
}

function importData(file){
  var r = new FileReader();
  r.onload = function(){
    try{
      var raw = JSON.parse(r.result);
      var importedData = (raw && raw.state) ? raw.state : raw;
      state = migrateState(importedData);
      if(!state.activeId || !state.characters.some(function(x){ return x.id === state.activeId; })){
        var validChars = getUserCharacters();
        state.activeId = validChars[0] ? validChars[0].id : (state.characters[0] ? state.characters[0].id : "");
      }
      saveState(true);
      if(isGM()){
        pushSharedData();
        pushMapsData();
        state.characters.forEach(function(c){ pushCharacterById(c.id); });
      }
      closeModals(); renderTopbar(); renderTabbar(); renderTab();
      showToast("Copia de seguridad restaurada correctamente", "success");
    }catch(e){
      console.error("Error importando backup:", e);
      showToast("Archivo de copia no válido.", "error");
    }
  };
  r.readAsText(file);
}

function checkWeeklyBackup(){
  try{
    var lastBackupStr = localStorage.getItem("krysalis_last_weekly_backup");
    var now = Date.now();
    var ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    if(!lastBackupStr || (now - new Date(lastBackupStr).getTime() > ONE_WEEK_MS)){
      if(isGM()){
        performCloudBackup(true);
      }
    }
  }catch(e){
    console.warn("Could not check weekly backup:", e);
  }
}

async function performCloudBackup(isAuto){
  if(!supabaseClient) return;
  try{
    var dateStr = new Date().toISOString().slice(0, 10);
    var backupKey = 'backup_weekly_' + dateStr;
    var res = await supabaseClient.from('campaign_map').upsert({
      id: backupKey,
      data: {
        timestamp: new Date().toISOString(),
        backupType: isAuto ? 'automatic_weekly' : 'manual_master',
        state: state
      },
      markers: [],
      updated_at: new Date().toISOString()
    });
    if(!res.error){
      localStorage.setItem("krysalis_last_weekly_backup", new Date().toISOString());
      if(!isAuto) showToast("Copia de seguridad guardada en la nube con éxito", "success");
    } else {
      if(!isAuto) showToast("Error al guardar copia en la nube", "error");
    }
  }catch(e){
    console.error("Cloud backup error:", e);
    if(!isAuto) showToast("Error al procesar copia en la nube", "error");
  }
}
