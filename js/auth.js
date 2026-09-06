// ============================================================================
// KRYSALIS RPG - MÓDULO: AUTH & PERMISOS
// Gestión de sesión, roles dinámicos (GM/Player) y ownership relacional
// ============================================================================

var MAX_LOGIN_ATTEMPTS = 5;
var LOCKOUT_DURATION_MS = 15 * 60 * 1000;

function getAuthAttempts(){
  try{
    return JSON.parse(localStorage.getItem("krysalis_auth_attempts") || '{"count":0,"lockoutUntil":0}');
  }catch(e){ return {count:0, lockoutUntil:0}; }
}

function recordFailedLoginAttempt(){
  var att = getAuthAttempts();
  att.count = (att.count || 0) + 1;
  att.lastAttempt = Date.now();
  if(att.count >= MAX_LOGIN_ATTEMPTS){
    att.lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
  }
  localStorage.setItem("krysalis_auth_attempts", JSON.stringify(att));
  return att;
}

function clearAuthAttempts(){
  localStorage.removeItem("krysalis_auth_attempts");
}


function isGM(){
  if(currentRole === 'gm' || currentRole === 'GM') return true;
  if(state && (state.campaignRole === 'GM' || state.campaignRole === 'gm')) return true;
  if(currentUser && currentUser.user_metadata && (currentUser.user_metadata.role === 'gm' || currentUser.user_metadata.role === 'GM')) return true;
  return false;
}

function isCharOwner(c, user){
  if(!c || !user) return false;
  if(c.owner_id && c.owner_id === user.id) return true;
  if(c.ownerEmail && user.email && c.ownerEmail.trim().toLowerCase() === user.email.trim().toLowerCase()) return true;
  if(state && Array.isArray(state.campaignMembers)){
    var isMember = state.campaignMembers.some(function(m){
      return m.user_id === user.id && (m.character_id === c.id || m.character_id === c.db_id);
    });
    if(isMember) return true;
  }
  return false;
}

function canEditChar(c){
  return !!c;
}

function getUserCharacters(){
  if(isGM()) return state.characters || [];
  return (state.characters || []).filter(function(c){ return !c.isNPC; });
}

function activeChar(){
  var chars = getUserCharacters();
  var found = chars.find(function(x){return x.id===state.activeId;}) || chars[0] || (state.characters && state.characters[0]) || blankCharacter("Sin Personaje");
  return ensureCharDefaults(found);
}


async function fetchUserProfile(){
  if(!supabaseClient || !currentUser) return;
  try{
    var res = await supabaseClient.from('profiles').select('role').eq('id', currentUser.id).maybeSingle();
    if(res.data && res.data.role) currentRole = res.data.role;

    try{
      var memRes = await supabaseClient.from('campaign_members').select('*').eq('user_id', currentUser.id);
      if(memRes.data && memRes.data.length){
        state.campaignMembers = memRes.data;
        var gmMem = memRes.data.find(function(m){ return m.role === 'GM'; });
        if(gmMem) { currentRole = 'gm'; state.campaignRole = 'GM'; }
      }
    }catch(errMem){}

    pullAllFromSupabase();
    pullMapFromSupabase();
    pullSharedDataFromSupabase();
  }catch(e){ console.error('Supabase error:', e); }
  renderTopbar();
  renderTabbar();
  renderTab();
}

async function supabaseLogin(em, pw){
  var att = getAuthAttempts();
  var now = Date.now();
  if(att.lockoutUntil && att.lockoutUntil > now){
    var remainingMins = Math.ceil((att.lockoutUntil - now) / 60000);
    showToast("Demasiados intentos seguidos. Espera " + remainingMins + " min para volver a probar.", "warning");
    return;
  }
  var res = await supabaseClient.auth.signInWithPassword({email:em, password:pw});
  if(res.error){
    var updated = recordFailedLoginAttempt();
    var remainingAttempts = MAX_LOGIN_ATTEMPTS - (updated.count || 0);
    if(remainingAttempts <= 0){
      showToast("Has fallado 5 veces seguidas. Espera 15 minutos para volver a probar.", "error");
    } else {
      var msg = res.error.message.includes("Invalid login") ? "Contraseña o email incorrectos" : res.error.message;
      showToast(msg + " (te quedan " + remainingAttempts + " intentos)", "error");
    }
  } else {
    clearAuthAttempts();
    closeModals();
    showToast("¡Sesión iniciada!", "success");
  }
}
async function supabaseSignup(em, pw){
  var res = await supabaseClient.auth.signUp({email:em, password:pw});
  if(res.error) showToast(res.error.message, "error"); else showToast("Registro completado. Ya puedes entrar.", "success");
}
async function supabaseLogout(){
  try {
    await supabaseClient.auth.signOut();
  } catch(e) {
    console.error('Supabase error:', e);
  }
  currentUser=null; currentRole='player'; closeModals(); updateSyncBadge("local"); renderTopbar(); renderTabbar(); renderTab();
  showToast("Sesión cerrada", "info");
}