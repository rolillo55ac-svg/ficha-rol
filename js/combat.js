async function applyDamageRPC(char, amount){
  if(!char || !amount) return;
  var charDbId = char.db_id || char.id;
  var cmdId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : uid();
  
  if(!supabaseClient || !charDbId) return;
  try{
    var res = await supabaseClient.rpc('apply_damage', {
      p_character_id: charDbId,
      p_amount: Math.abs(amount),
      p_command_id: cmdId
    });
    if(res.data && res.data.pvActual !== undefined){
      char.combat.pvActual = res.data.pvActual;
      if(res.data.escudoActual !== undefined) char.combat.escudoActual = res.data.escudoActual;
      char._serverUpdatedAt = res.data.updated_at ? new Date(res.data.updated_at).getTime() : Date.now();
      char._isDirty = false;
      dirtyCharIds.delete(char.id);
      renderTopbar();
    }
  }catch(e){
    console.warn('RPC apply_damage fallback:', e);
  }
}

async function applyHealRPC(char, amount){
  if(!char || !amount) return;
  var charDbId = char.db_id || char.id;
  var cmdId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : uid();
  
  if(!supabaseClient || !charDbId) return;
  try{
    var res = await supabaseClient.rpc('apply_heal', {
      p_character_id: charDbId,
      p_amount: Math.abs(amount),
      p_command_id: cmdId
    });
    if(res.data && res.data.pvActual !== undefined){
      char.combat.pvActual = res.data.pvActual;
      char._serverUpdatedAt = res.data.updated_at ? new Date(res.data.updated_at).getTime() : Date.now();
      char._isDirty = false;
      dirtyCharIds.delete(char.id);
      renderTopbar();
    }
  }catch(e){
    console.warn('RPC apply_heal fallback:', e);
  }
}

async function changeManaRPC(char, amount){
  if(!char || amount === 0) return;
  var charDbId = char.db_id || char.id;
  var cmdId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : uid();
  
  if(!supabaseClient || !charDbId) return;
  try{
    var res = await supabaseClient.rpc('change_mana', {
      p_character_id: charDbId,
      p_amount: amount,
      p_command_id: cmdId
    });
    if(res.data && res.data.manaActual !== undefined){
      char.combat.manaActual = res.data.manaActual;
      char._serverUpdatedAt = res.data.updated_at ? new Date(res.data.updated_at).getTime() : Date.now();
      char._isDirty = false;
      dirtyCharIds.delete(char.id);
      renderTopbar();
    }
  }catch(e){
    console.warn('RPC change_mana fallback:', e);
  }
}

async function changeGoldRPC(char, amount){
  if(!char || amount === 0) return;
  var charDbId = char.db_id || char.id;
  var cmdId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : uid();
  
  if(!supabaseClient || !charDbId) return;
  try{
    var res = await supabaseClient.rpc('change_gold', {
      p_character_id: charDbId,
      p_amount: amount,
      p_command_id: cmdId
    });
    if(res.data && res.data.dinero !== undefined){
      char.dinero = res.data.dinero;
      char._serverUpdatedAt = res.data.updated_at ? new Date(res.data.updated_at).getTime() : Date.now();
      char._isDirty = false;
      dirtyCharIds.delete(char.id);
      if(state.activeTab === 'inventario') renderTab();
    }
  }catch(e){
    console.warn('RPC change_gold fallback:', e);
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
