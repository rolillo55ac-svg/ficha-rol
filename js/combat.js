async function applyDamageRPC(char, amount){
  if(!char) return;
  renderTopbar();
  if(typeof pushCharacterPatch === 'function'){
    await pushCharacterPatch(char.id, { combat: char.combat });
  }
}

async function applyHealRPC(char, amount){
  if(!char) return;
  renderTopbar();
  if(typeof pushCharacterPatch === 'function'){
    await pushCharacterPatch(char.id, { combat: char.combat });
  }
}

async function changeManaRPC(char, amount){
  if(!char || amount === 0) return;
  renderTopbar();
  if(typeof pushCharacterPatch === 'function'){
    await pushCharacterPatch(char.id, { combat: char.combat });
  }
}

async function changeShieldRPC(char, amount){
  if(!char || amount === 0) return;
  renderTopbar();
  if(typeof pushCharacterPatch === 'function'){
    await pushCharacterPatch(char.id, { combat: char.combat });
  }
}

// El dinero se cambia con la función change_character_money: suma o resta en la nube
// (sin pisar otros cambios) y deja apuntado quién lo hizo. Los envíos de una ficha van en fila.
var moneyQueue = {};
var moneyPending = {};
var moneyLogCache = {};

function changeMoneyRPC(char, deltaOro, deltaPlata){
  if(!char) return Promise.resolve();
  deltaOro = parseInt(deltaOro, 10) || 0;
  deltaPlata = parseInt(deltaPlata, 10) || 0;
  if(deltaOro === 0 && deltaPlata === 0) return Promise.resolve();
  // Lo que ya se ve en pantalla no debe salir otra vez en el guardado por diferencias
  if(!char._lastSyncedData) char._lastSyncedData = {};
  char._lastSyncedData.money = JSON.parse(JSON.stringify(char.money || { oro: 0, plata: 0 }));
  saveState(true);
  var key = char.id;
  moneyPending[key] = (moneyPending[key] || 0) + 1;
  var prev = moneyQueue[key] || Promise.resolve();
  var next = prev.then(function(){ return sendMoneyChange(char, deltaOro, deltaPlata); }).catch(function(){}).then(function(){ moneyPending[key] = Math.max(0, (moneyPending[key] || 1) - 1); });
  moneyQueue[key] = next;
  return next;
}

async function sendMoneyChange(char, deltaOro, deltaPlata){
  var cur = function(){ return (state.characters||[]).find(function(x){ return x.id === char.id; }) || char; };
  if(char.db_id && typeof supabaseClient !== 'undefined' && supabaseClient && currentUser){
    try {
      var res = await supabaseClient.rpc('change_character_money', { p_char_id: char.db_id, p_delta_oro: deltaOro, p_delta_plata: deltaPlata });
      if(!res.error && res.data){
        var c = cur();
        c.money = c.money || { oro: 0, plata: 0 };
        // Solo el último envío de la fila pone el valor de la nube (los anteriores ya están sumados en pantalla)
        if((moneyPending[char.id] || 0) <= 1){
          c.money.oro = num(res.data.oro, 0);
          c.money.plata = num(res.data.plata, 0);
          if(!c._lastSyncedData) c._lastSyncedData = {};
          c._lastSyncedData.money = { oro: c.money.oro, plata: c.money.plata };
          saveState(true);
          refreshMoneyView(c);
        }
        loadMoneyLog(c, true);
        return;
      }
      console.warn('change_character_money:', (res && res.error && (res.error.message || res.error)) || 'sin datos');
      if(res && res.error && /permiso|sesión/i.test(res.error.message || '')){
        if(typeof showToast === 'function') showToast('No se pudo cambiar el dinero: ' + res.error.message, 'error');
        return;
      }
    } catch(e){
      console.warn('change_character_money:', e);
    }
  }
  // Sin la función en la nube (o sin conexión): se guarda como antes
  if(typeof pushCharacterPatch === 'function'){
    await pushCharacterPatch(char.id, { money: cur().money });
  }
}

function refreshMoneyView(c){
  if(state.activeTab !== 'inventario' || !c || (typeof activeChar === 'function' && activeChar() !== c)) return;
  ['oro','plata'].forEach(function(part){
    var el = document.querySelector('input[data-bind="money.' + part + '"]');
    if(el && document.activeElement !== el){
      el.value = num(c.money[part], 0);
      el.setAttribute('data-last-val', num(c.money[part], 0));
    }
  });
}

function getMoneyLog(c){
  if(!c || !c.db_id) return [];
  var entry = moneyLogCache[c.db_id];
  if(!entry || Date.now() - entry.ts > 60000) loadMoneyLog(c);
  return entry ? entry.rows : [];
}

async function loadMoneyLog(c, force){
  if(!c || !c.db_id || typeof supabaseClient === 'undefined' || !supabaseClient || !currentUser) return;
  var entry = moneyLogCache[c.db_id];
  if(entry && entry.loading) return;
  if(!force && entry && Date.now() - entry.ts < 60000) return;
  moneyLogCache[c.db_id] = { rows: entry ? entry.rows : [], ts: Date.now(), loading: true };
  try {
    var res = await supabaseClient.from('money_log').select('delta_oro,delta_plata,actor_name,created_at').eq('character_id', c.db_id).order('created_at', { ascending: false }).limit(5);
    var rows = (!res.error && Array.isArray(res.data)) ? res.data : (entry ? entry.rows : []);
    moneyLogCache[c.db_id] = { rows: rows, ts: Date.now() };
    var box = document.querySelector('[data-money-log="' + c.db_id + '"]');
    if(box && typeof tplMoneyLogRows === 'function') box.innerHTML = tplMoneyLogRows(rows);
  } catch(e){
    moneyLogCache[c.db_id] = { rows: entry ? entry.rows : [], ts: Date.now() };
  }
}

async function changeGoldRPC(char, amount){
  return changeMoneyRPC(char, amount, 0);
}

async function manageListItemRPC(char, listName, action, itemData, itemId, delta){
  if(!char || !listName) return;
  var patch = {};
  patch[listName] = char[listName];
  if(typeof pushCharacterPatch === 'function'){
    await pushCharacterPatch(char.id, patch);
  }
}

function calculateTotalArmor(char){
  if(!char || !Array.isArray(char.armors)) return { totalAbsorcion: 0, totalEstorbo: 0 };
  var totAbs = 0;
  var totEst = 0;
  char.armors.forEach(function(a){
    totAbs += num(a.absorcion, 0);
    totEst += num(a.estorbo, 0);
  });
  return { totalAbsorcion: totAbs, totalEstorbo: totEst };
}
