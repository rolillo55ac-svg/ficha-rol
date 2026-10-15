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


// Usuario cuyo rol se leyó de profiles (evita usar el rol de otra cuenta que entró antes en este navegador)
var currentRoleUserId = null;

function isGM(){
  // En modo local/offline sin usuario logueado en Supabase, quien usa la app tiene control de máster por defecto
  if(!currentUser) return true;
  // Con sesión: solo vale el rol leído de profiles para ESTE usuario al iniciar sesión
  if(currentRoleUserId !== currentUser.id) return false;
  var r = (currentRole || '').toLowerCase();
  return r === 'gm' || r === 'master';
}

// Borra cualquier rol o pertenencia heredada de otra sesión (state se guarda entero en localStorage)
function resetSessionRole(){
  currentRole = 'player';
  currentRoleUserId = null;
  if(state){
    delete state.campaignRole;
    delete state.campaignMembers;
  }
  if(typeof ALCHEMY_CATALOG !== "undefined") ALCHEMY_CATALOG.forEach(function(s){ delete s.efectoEnemigo; delete s.efectoCherk; });
  try {
    localStorage.removeItem("krysalis_role");
    localStorage.removeItem("krysalis_local_role");
  } catch(e){}
}

function isCharOwner(c, user){
  if(!c || !user) return false;
  if(c.ownerEmail && c.ownerEmail.trim()){
    if(user.email && c.ownerEmail.trim().toLowerCase() === user.email.trim().toLowerCase()) return true;
    return false;
  }
  if(c.owner_id && c.owner_id === user.id) return true;
  if(state && Array.isArray(state.campaignMembers)){
    var isMember = state.campaignMembers.some(function(m){
      return m.user_id === user.id && (m.character_id === c.id || m.character_id === c.db_id);
    });
    if(isMember) return true;
  }
  return false;
}

function canEditChar(c){
  if(!c) return false;
  if(!currentUser) return true;
  if(isGM()) return true;
  if(c.isNPC) return false;
  return isCharOwner(c, currentUser);
}

function getUserCharacters(){
  if(isGM()) return state.characters || [];
  return (state.characters || []).filter(function(c){ return !c.isNPC; });
}

function activeChar(){
  var chars = getUserCharacters();
  var savedActiveId = (typeof state !== 'undefined' && state.activeId) ? state.activeId : localStorage.getItem(pkey("krysalis_active_id"));
  var savedActiveDbId = localStorage.getItem(pkey("krysalis_active_db_id"));
  var savedActiveName = localStorage.getItem(pkey("krysalis_active_name"));

  var found = null;
  if(savedActiveId){
    found = chars.find(function(x){ return x.id === savedActiveId || x.db_id === savedActiveId; });
  }
  if(!found && savedActiveDbId){
    found = chars.find(function(x){ return x.db_id === savedActiveDbId || x.id === savedActiveDbId; });
  }
  if(!found && savedActiveName){
    found = chars.find(function(x){ return x.name && x.name.trim().toLowerCase() === savedActiveName.trim().toLowerCase(); });
  }
  if(!found){
    found = chars[0] || (state.characters && state.characters[0]) || blankCharacter("Sin Personaje");
  }
  return ensureCharDefaults(found);
}


async function fetchUserProfile(){
  if(!supabaseClient || !currentUser) return;
  try{
    var userId = currentUser.id;
    // Solo al cambiar de cuenta: al renovar la sesión del mismo usuario se conserva el rol ya leído
    if(currentRoleUserId !== userId) resetSessionRole();

    // El rol solo se lee de profiles (lo cambia el máster en Supabase; los jugadores no pueden escribirlo)
    var res = await supabaseClient.from('profiles').select('role').eq('id', userId).maybeSingle();
    if(!currentUser || currentUser.id !== userId) return;
    currentRole = (res.data && res.data.role) ? res.data.role : 'player';
    currentRoleUserId = userId;

    pullAllFromSupabase();
    pullMapFromSupabase();
    pullSharedDataFromSupabase();
    if(typeof loadGameClock === "function") loadGameClock();
    if(typeof loadRollHistory === "function") loadRollHistory();
    if(typeof loadRollRequests === "function") setTimeout(loadRollRequests, 1200);
    if(typeof loadAlchemySecrets === "function") loadAlchemySecrets();
    // Si este dispositivo tiene una Casa guardada y la nube no, se ofrece subirla (solo el máster)
    if(typeof maybeOfferHouseImport === "function") setTimeout(maybeOfferHouseImport, 1500);
    // Copia semanal en la nube cuando ya se conoce el rol y han llegado los datos
    if(typeof checkWeeklyBackup === "function") setTimeout(checkWeeklyBackup, 5000);
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
  currentUser=null; resetSessionRole();
  if(typeof lockApp === "function" && appLocked === false) lockApp();
}

// Pantalla de entrada (sin sesión no se ve nada más)
function handleLoginGateSubmit(e){
  var signup = e.type === "click" && e.target.closest && e.target.closest("[data-gate=signup]");
  if(e.type === "click" && !signup) return;
  e.preventDefault();
  var em = (document.getElementById("gateEmail").value || "").trim();
  var pw = document.getElementById("gatePass").value || "";
  if(!em || !pw){ showToast("Escribe tu email y tu contraseña", "warning"); return; }
  if(!supabaseClient){ showToast("Sin conexión: no se puede entrar ahora", "error"); return; }
  if(signup) supabaseSignup(em, pw); else supabaseLogin(em, pw);
}
