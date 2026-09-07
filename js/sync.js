var STORAGE_KEY = "krysalisFichasV311";
var SUPABASE_URL = "https://nwjbdevshaucnjrwebtb.supabase.co";
var SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53amJkZXZzaGF1Y25qcndlYnRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMzA4OTIsImV4cCI6MjEwMzYwNjg5Mn0.WUISbOthy-5hTZ69p5lydHxHP4ZfAM4nLFa13lKPoeY";


var syncDebounceTimer = null;
var dirtyCharIds = new Set();
var isGlobalDirty = false;

function markCharDirty(charId){
  if(!charId) return;
  dirtyCharIds.add(charId);
  var target = (state.characters||[]).find(function(x){ return x.id === charId; });
  if(target){
    target._isDirty = true;
    target._lastLocalEdit = Date.now();
  }
}

function flushPendingSync(){
  if(syncDebounceTimer){
    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = null;
  }
  if(!supabaseClient || isRemoteSyncing) return;

  var toPush = new Set(dirtyCharIds);
  (state.characters || []).forEach(function(c){
    if(c && c._isDirty && c.id) toPush.add(c.id);
  });

  toPush.forEach(function(cid){
    pushCharacterById(cid);
  });
  dirtyCharIds.clear();

  if(isGlobalDirty || state._isSharedDirty){
    isGlobalDirty = false;
    state._isSharedDirty = false;
    if(isGM() || !currentUser) pushSharedData();
  }
}

function saveState(skipRemote){
  var ac = activeChar();
  if(ac && ac.id){
    ac._lastLocalEdit = Date.now();
    if(!skipRemote){
      ac._isDirty = true;
      markCharDirty(ac.id);
    }
  }
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if(state.activeId) localStorage.setItem("krysalis_active_id", state.activeId);
    if(state.activeTab) localStorage.setItem("krysalis_active_tab", state.activeTab);
  }catch(e){
    console.error("Error al guardar en localStorage:", e);
  }
  if(!skipRemote && supabaseClient){
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
