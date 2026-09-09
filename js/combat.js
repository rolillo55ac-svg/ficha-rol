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

async function changeMoneyRPC(char, deltaOro, deltaPlata){
  if(!char) return;
  deltaOro = parseInt(deltaOro, 10) || 0;
  deltaPlata = parseInt(deltaPlata, 10) || 0;
  if(deltaOro === 0 && deltaPlata === 0) return;

  if(typeof pushCharacterPatch === 'function'){
    await pushCharacterPatch(char.id, { money: char.money });
  }
  if(state.activeTab === 'inventario') renderTab();
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
