var touchStartX = null;
var touchStartY = null;
var swipeIndicatorTimeout = null;

function handleTouchStart(e){
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}

function handleTouchEnd(e){
  if(touchStartX === null || touchStartY === null) return;
  
  var touchEndX = e.changedTouches[0].clientX;
  var touchEndY = e.changedTouches[0].clientY;
  var dx = touchEndX - touchStartX;
  var dy = touchEndY - touchStartY;
  
  var tabs = isGM() ? GM_TABS : PLAYER_TABS;
  
  if(Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 80){
    var currentTabIndex = tabs.findIndex(function(t){ return t.id === state.activeTab; });
    var newIndex = currentTabIndex;
    
    if(dx < 0 && currentTabIndex < tabs.length - 1){
      newIndex = currentTabIndex + 1;
    } else if(dx > 0 && currentTabIndex > 0){
      newIndex = currentTabIndex - 1;
    }
    
    if(newIndex !== currentTabIndex){
      state.activeTab = tabs[newIndex].id;
      saveState();
      renderTabbar();
      renderTab();
      
      showToast(tabs[newIndex].label, "info");
    }
  }
  
  touchStartX = null;
  touchStartY = null;
}

function showSwipeIndicator(){
  var indicator = document.getElementById("swipeIndicator");
  indicator.classList.add("visible");
  clearTimeout(swipeIndicatorTimeout);
  swipeIndicatorTimeout = setTimeout(function(){
    indicator.classList.remove("visible");
  }, 2000);
}


function setBind(target, path, rawValue, inputType){
  var parts = path.split(".");
  var value = inputType==="number" ? num(rawValue,0) : rawValue;
  if(parts.length===1){ target[parts[0]] = value; return; }
  if(parts[0]==="attrs"){ target.attrs = target.attrs || {}; target.attrs[parts[1]] = value; return; }
  if(parts[0]==="combat"){ target.combat = target.combat || {}; target.combat[parts[1]] = value; return; }
  if(parts[0]==="money"){ target.money = target.money || { oro: 0, plata: 0 }; target.money[parts[1]] = value; return; }
  if(parts[0]==="skillBonus"){ target.skillBonus = target.skillBonus || {}; target.skillBonus[parts[1]] = value; return; }
  if(parts[0]==="skillHybrid"){ target.skillHybrid = target.skillHybrid || {}; target.skillHybrid[parts[1]] = value; return; }
  if(parts[0]==="customSkills"){
    var cs = target.customSkills.find(function(x){return x.id===parts[1];});
    if(cs) cs[parts[2]] = value;
    return;
  }
  if(parts[0]==="weaponsCatalog"){
    var wItem = (target.weaponsCatalog||[]).find(function(x){return x.id===parts[1];});
    if(wItem) wItem[parts[2]] = value;
    return;
  }
  if(parts[0]==="buffCatalog"){
    var bItem = (target.buffCatalog||[]).find(function(x){return x.id===parts[1];});
    if(bItem) bItem[parts[2]] = value;
    return;
  }
  if(parts[0]==="questMap"){
    if(!target.questMap) target.questMap = { name: "Mapa de la Misión", image: null, notes: "" };
    target.questMap[parts[1]] = value;
    return;
  }
  if(parts[0]==="trainings" && parts[2]==="milestones"){
    var trObj = (target.trainings||[]).find(function(x){return x.id===parts[1];});
    if(trObj && trObj.milestones){
      var mItem = trObj.milestones.find(function(x){return x.id===parts[3];});
      if(mItem) mItem[parts[4]] = value;
    }
    return;
  }
  var listFields = ["weapons","armors","inventory","spells","stones","passivesNeg","passivesPos","goddessCurses","goddessBlessings","goddessTable","customBuffs","summons","bestiary","poisons","activeBuffs","quests","questClues","trainings"];
  if(listFields.indexOf(parts[0])!==-1){
    var arr = target[parts[0]];
    var item = arr && arr.find(function(x){return x.id===parts[1];});
    if(item){
      if(parts[0]==="trainings" && (parts[2]==="targetGoal" || parts[2]==="narrativePercentage")){
        item[parts[2]] = num(rawValue, parts[2]==="targetGoal"?20:0);
      } else {
        item[parts[2]] = value;
      }
    }
    return;
  }
  if(parts[0]==="lore"){
    var loreArr = target.lore[parts[1]];
    var lItem = loreArr && loreArr.find(function(x){return x.id===parts[2];});
    if(lItem) lItem[parts[3]] = value;
    return;
  }
  target[path] = value;
}

function handleChange(e){
  var actEl = e.target.closest("[data-action]");
  if(actEl){
    var actName = actEl.getAttribute("data-action");
    if(actName === "set-training-category" || actName === "set-training-linked"){
      handleClick(e);
      return;
    }
  }
  var el = e.target.closest("[data-bind]"); if(!el) return;
  var isGlobal = el.getAttribute("data-scope")==="global";
  if(isGlobal && currentUser && !isGM()){
    showToast("Solo el Máster puede editar datos del compendio o del mundo.", "warning");
    return;
  }
  var target = isGlobal ? state : activeChar();
  if(!isGlobal && !canEditChar(target)){
    showToast("No tienes permiso para editar este personaje.", "warning");
    return;
  }
  var bind = el.getAttribute("data-bind");
  setBind(target, bind, el.value, el.type);
  if(!isGlobal && target && target.id){
    target._lastLocalEdit = Date.now();
    markCharDirty(target.id);
    if(currentUser && !target.owner_id && !target.isNPC){
      target.owner_id = currentUser.id;
      if(currentUser.email) target.ownerEmail = currentUser.email;
    }
  }
  if(bind && bind.startsWith("combat.") && target && target.id){
    broadcastCharStatUpdate(target.id, target.combat);
    renderTopbar();
  }
  if(e.type === "change" && bind && bind.startsWith("trainings.") && (bind.includes(".targetGoal") || bind.includes(".targetStat"))){
    renderTab();
    return;
  }
  if(isGlobal){
    isGlobalDirty = true;
    saveState(true);
    pushSharedData();
  } else {
    saveState(false);
  }
}


function handleClick(e){
  getAudioCtx();
  var btn = e.target.closest("[data-action]"); if(!btn) return;
  var action = btn.getAttribute("data-action");
  var c = activeChar();

  if(action==="set-world-subtab"){ currentWorldSubtab = btn.getAttribute("data-val"); renderTab(); return; }
  if(action==="set-bestiary-continent"){ bestiaryContinentFilter = btn.getAttribute("data-continent"); renderTab(); return; }
  if(action==="set-lore-continent"){ loreContinentFilter = btn.getAttribute("data-val"); renderTab(); return; }
  if(action==="set-lore-type"){ loreTypeFilter = btn.getAttribute("data-val"); renderTab(); return; }
  if(action==="set-lore-terrain"){ loreTerrainFilter = btn.getAttribute("data-val"); renderTab(); return; }
  if(action==="set-lore-subtab"){ currentLoreSubtab = btn.getAttribute("data-val"); renderTab(); return; }
  if(action==="set-buff-tab"){ currentBuffTab = btn.getAttribute("data-val"); renderTab(); return; }

  if(action==="switch-tab"){
    if(document.activeElement && document.activeElement.matches("input, textarea, select")){
      try { document.activeElement.blur(); } catch(e){}
    }
    flushPendingSync();
    state.activeTab = btn.getAttribute("data-tab");
    saveState(true);
    renderTabbar();
    renderTab();
    return;
  }
  if(action==="hp-mod"){
    if(!canEditChar(c)) return;
    var d1 = parseInt(btn.getAttribute("data-delta"),10);
    var maxHp = num(c.combat.pvMax,0) || 999;
    c.combat.pvActual = clamp(num(c.combat.pvActual,0)+d1, -999, maxHp);
    c._lastLocalEdit = Date.now();
    saveState(true); renderTopbar();
    broadcastCharStatUpdate(c.id, c.combat);

    if(d1 < 0) applyDamageRPC(c, d1);
    else if(d1 > 0) applyHealRPC(c, d1);
    return;
  }
  if(action==="shield-mod"){
    if(!canEditChar(c)) return;
    var ds = parseInt(btn.getAttribute("data-delta"),10);
    c.combat.escudoActual = Math.max(0, num(c.combat.escudoActual,0)+ds);
    c._lastLocalEdit = Date.now();
    markCharDirty(c.id);
    saveState(false); renderTopbar();
    broadcastCharStatUpdate(c.id, c.combat);
    return;
  }
  if(action==="mana-mod"){
    if(!canEditChar(c)) return;
    var d2 = parseInt(btn.getAttribute("data-delta"),10);
    c.combat.manaActual = clamp(num(c.combat.manaActual,0)+d2, 0, num(c.combat.manaMax,0)||999);
    c._lastLocalEdit = Date.now();
    saveState(true); renderTopbar();
    broadcastCharStatUpdate(c.id, c.combat);

    changeManaRPC(c, d2);
    return;
  }

  if(action==="gm-add-skill-point"){
    if(!isGM()) return;
    c.skillPoints = num(c.skillPoints, 0) + 1;
    saveState(); renderTab();
    showToast("+1 punto de habilidad concedido por el GM", "gm");
    return;
  }
  if(action==="gm-skill-add"){
    if(!isGM()) return;
    var sid = btn.getAttribute("data-id");
    if(!c.skillBonus) c.skillBonus = {};
    c.skillBonus[sid] = num(c.skillBonus[sid], 0) + 1;
    saveState(); renderTab();
    var sdef = SKILL_DEFS.find(function(x){ return x.id === sid; });
    showToast("GM otorgó nivel " + c.skillBonus[sid] + " a " + (sdef ? sdef.name : sid), "gm");
    return;
  }
  if(action==="gm-skill-sub"){
    if(!isGM()) return;
    var sid2 = btn.getAttribute("data-id");
    if(!c.skillBonus) c.skillBonus = {};
    if(num(c.skillBonus[sid2], 0) > 0){
      c.skillBonus[sid2] = num(c.skillBonus[sid2], 0) - 1;
      saveState(); renderTab();
    }
    return;
  }
  if(action==="gm-custom-skill-add"){
    if(!isGM()) return;
    var csId = btn.getAttribute("data-id");
    var csk = (c.customSkills||[]).find(function(x){return x.id===csId;});
    if(csk){
      csk.bonus = num(csk.bonus, 0) + 1;
      saveState(); renderTab();
      showToast("GM otorgó nivel " + csk.bonus + " a " + csk.name, "gm");
    }
    return;
  }
  if(action==="gm-custom-skill-sub"){
    if(!isGM()) return;
    var csId2 = btn.getAttribute("data-id");
    var csk2 = (c.customSkills||[]).find(function(x){return x.id===csId2;});
    if(csk2 && num(csk2.bonus, 0) > 0){
      csk2.bonus = num(csk2.bonus, 0) - 1;
      saveState(); renderTab();
    }
    return;
  }

  if(action==="grant-level"){
    if(!isGM()) return;
    var curNv = num(c.nivel, 1);
    var nextNv = curNv + 1;
    c.nivel = String(nextNv);
    
    var ptsToAdd = 4;
    if(nextNv > 20) ptsToAdd = 8;
    else if(nextNv > 10) ptsToAdd = 6;
    c.skillPoints = num(c.skillPoints, 0) + ptsToAdd;

    var fisicoVal = num(c.attrs.fisico, 0);
    var hpGain = Math.ceil(fisicoVal / 2);
    if(hpGain < 1) hpGain = 1;
    c.combat.pvMax = num(c.combat.pvMax, 10) + hpGain;
    c.combat.pvActual = num(c.combat.pvMax, 10);

    if(nextNv % 4 === 0){
      c.combat.manaMax = num(c.combat.manaMax, 10) + 5;
    }
    
    if(c.isNPC){
      c.skillPointsUnlocked = true;
    }

    saveState(); renderTopbar(); renderTab();
    showToast("¡Nivel " + nextNv + " alcanzado! +" + ptsToAdd + " puntos de habilidad", "success");
    return;
  }

  if(action==="toggle-skill-lock"){
    if(!isGM()) return;
    c.skillPointsUnlocked = !c.skillPointsUnlocked;
    saveState(); renderTab();
    showToast(c.skillPointsUnlocked ? "Asignación de habilidades desbloqueada" : "Asignación de habilidades bloqueada", "info");
    return;
  }
    if(action==="skill-add"){
    if(!c.skillPointsUnlocked && !c.isNPC) return;
    var sId = btn.getAttribute("data-id");
    var curBonus = num(c.skillBonus[sId], 0);
    if(curBonus === 0 && !c.isNPC) { showToast("No se puede subir una habilidad en nivel 0.", "error"); return; }
    if(curBonus >= 8) { showToast("La habilidad ha alcanzado el nivel máximo (8).", "warning"); return; }
    if(!c.isNPC && num(c.skillPoints, 0) < 1) { showToast("No tienes puntos disponibles.", "error"); return; }
    if(c.isNPC && num(c.skillPoints, 0) < 1) { showToast("El NPC no tiene puntos. Sube su nivel primero.", "error"); return; }

    if(!c.skillProgress) c.skillProgress = {};
    var prog = num(c.skillProgress[sId], 0);
    var targetLevel = curBonus + 1;
    var costNeeded = targetLevel;

    c.skillPoints--;
    prog++;

    if(prog >= costNeeded){
      prog = 0;
      c.skillBonus[sId] = targetLevel;
      showToast("¡Habilidad subida a nivel " + targetLevel + "!", "success");
    }
    c.skillProgress[sId] = prog;
    saveState(); renderTab(); return;
  }
  if(action==="skill-sub"){
    if(!c.skillPointsUnlocked && !c.isNPC) return;
    var sId2 = btn.getAttribute("data-id");
    if(!c.skillProgress) c.skillProgress = {};
    var prog2 = num(c.skillProgress[sId2], 0);

    if(prog2 > 0){
      prog2--;
      c.skillProgress[sId2] = prog2;
      c.skillPoints++;
      saveState(); renderTab();
    } else {
      if(c.isNPC){
        var curBonus2 = num(c.skillBonus[sId2], 0);
        if(curBonus2 > 0){
          c.skillBonus[sId2] = curBonus2 - 1;
          c.skillProgress[sId2] = 0;
          c.skillPoints++;
          saveState(); renderTab();
        } else {
          showToast("La habilidad ya está en nivel 0.", "warning");
        }
      } else {
        showToast("No se puede restar un nivel ya consolidado.", "warning");
      }
    }
    return;
  }
  if(action==="skill-add-custom"){
    if(!c.skillPointsUnlocked && !c.isNPC) return;
    var csId = btn.getAttribute("data-id");
    var csk = (c.customSkills||[]).find(function(x){return x.id===csId;});
    if(csk){
      var curBonus = num(csk.bonus, 0);
      if(curBonus === 0 && !c.isNPC) { showToast("No se puede subir una habilidad en nivel 0.", "error"); return; }
      if(curBonus >= 8) { showToast("Máximo nivel 8.", "warning"); return; }
      if(!c.isNPC && num(c.skillPoints, 0) < 1) { showToast("Puntos insuficientes.", "error"); return; }
      if(c.isNPC && num(c.skillPoints, 0) < 1) { showToast("El NPC no tiene puntos. Sube su nivel primero.", "error"); return; }

      if(!c.skillProgress) c.skillProgress = {};
      var prog = num(c.skillProgress[csId], 0);
      var targetLevel = curBonus + 1;
      var costNeeded = targetLevel;

      c.skillPoints--;
      prog++;
      if(prog >= costNeeded){
        prog = 0;
        csk.bonus = targetLevel;
        showToast("¡Habilidad subida a nivel " + targetLevel + "!", "success");
      }
      c.skillProgress[csId] = prog;
      saveState(); renderTab();
    }
    return;
  }
  if(action==="skill-sub-custom"){
    if(!c.skillPointsUnlocked && !c.isNPC) return;
    var csId2 = btn.getAttribute("data-id");
    var csk2 = (c.customSkills||[]).find(function(x){return x.id===csId2;});
    if(csk2){
      if(!c.skillProgress) c.skillProgress = {};
      var prog2 = num(c.skillProgress[csId2], 0);
      if(prog2 > 0){
        prog2--;
        c.skillProgress[csId2] = prog2;
        c.skillPoints++;
        saveState(); renderTab();
      } else {
        if(c.isNPC){
          var curBonus2 = num(csk2.bonus, 0);
          if(curBonus2 > 0){
            csk2.bonus = curBonus2 - 1;
            c.skillProgress[csId2] = 0;
            c.skillPoints++;
            saveState(); renderTab();
          } else {
            showToast("La habilidad ya está en nivel 0.", "warning");
          }
        } else {
          showToast("No se puede restar un nivel ya consolidado.", "warning");
        }
      }
    }
    return;
  }
  if(action==="confirm-skills"){
    c.skillPoints = 0;
    saveState(); renderTab();
    showToast("Puntos de habilidad confirmados", "success");
    return;
  }

  if(action==="toggle-global-buff"){
    var bid = btn.getAttribute("data-id");
    if(!c.activeBuffs) c.activeBuffs = [];
    var idx = c.activeBuffs.findIndex(function(ab){ return ab.id === bid; });
    if(idx !== -1){
      var remBuff = c.activeBuffs[idx];
      if(remBuff && remBuff.shieldGranted){
        c.combat.escudoActual = Math.max(0, num(c.combat.escudoActual, 0) - remBuff.shieldGranted);
      }
      c.activeBuffs.splice(idx, 1);
    } else {
      var buffToAdd = (state.buffCatalog||[]).find(function(b){ return b.id === bid; });
      if(buffToAdd){
        var buffObj = {id: buffToAdd.id, name: buffToAdd.name, type: buffToAdd.type, bonus: buffToAdd.bonus, attr: buffToAdd.attr};
        if(isShieldAttr(buffToAdd.attr, buffToAdd.name)){
          var sBonus = parseShieldBonus(buffToAdd.bonus);
          if(sBonus > 0){
            c.combat.escudoActual = num(c.combat.escudoActual, 0) + sBonus;
            buffObj.shieldGranted = sBonus;
          }
        }
        c.activeBuffs.push(buffObj);
      }
    }
    saveState();
    renderTopbar();
    renderTab();
    broadcastCharStatUpdate(c.id, c.combat);
    return;
  }
  if(action==="remove-active-buff"){
    var buffId = btn.getAttribute("data-id");
    if(c.activeBuffs){
      var remBuff2 = c.activeBuffs.find(function(ab){ return ab.id === buffId; });
      if(remBuff2 && remBuff2.shieldGranted){
        c.combat.escudoActual = Math.max(0, num(c.combat.escudoActual, 0) - remBuff2.shieldGranted);
      }
      c.activeBuffs = c.activeBuffs.filter(function(ab){ return ab.id !== buffId; });
      saveState();
      renderTopbar();
      renderTab();
      broadcastCharStatUpdate(c.id, c.combat);
      showToast("Buff eliminado del personaje", "info");
    }
    return;
  }
  if(action==="npc-attr-mod"){
    if(!isGM() || !c.isNPC) return;
    var attrKey = btn.getAttribute("data-attr");
    var delta = parseInt(btn.getAttribute("data-delta"),10);
    if(attrKey && c.attrs[attrKey] !== undefined){
      c.attrs[attrKey] = Math.max(0, num(c.attrs[attrKey],0) + delta);
      saveState();
      renderTab();
    }
    return;
  }
  if(action==="toggle-buff"){
    var bName = btn.getAttribute("data-buff");
    if(!c.buffs) c.buffs={};
    c.buffs[bName] = !c.buffs[bName];
    saveState(); renderTab(); return;
  }
  if(action==="roll-skill"){
    var sid = btn.getAttribute("data-id");
    var sdef = SKILL_DEFS.find(function(s){return s.id===sid;});
    performD10Roll(c.name, sdef.name, skillTotal(sdef,c));
    return;
  }
  if(action==="roll-custom-skill"){
    var csid = btn.getAttribute("data-id");
    var cs = (c.customSkills||[]).find(function(x){return x.id===csid;});
    if(cs) performD10Roll(c.name, cs.name, customSkillTotal(cs,c));
    return;
  }
  if(action==="add-custom-skill"){
    if(!canEditChar(c)) return;
    var nm = prompt("Nombre de la habilidad:");
    if(!nm) return;
    var attrChoice = prompt("Atributo base (fisico / destreza / inteligencia / percepcion / carisma):","destreza");
    if(ATTRS.indexOf(attrChoice)===-1) attrChoice="destreza";
    if(!c.customSkills) c.customSkills=[];
    c.customSkills.push({id:uid(),name:nm,attr:attrChoice,bonus:1});
    c._lastLocalEdit = Date.now(); markCharDirty(c.id);
    saveState(); renderTab();
    showToast("Habilidad personalizada añadida", "success");
    return;
  }
  if(action==="add-custom-buff"){
    if(!canEditChar(c)) return;
    if(!c.customBuffs) c.customBuffs=[];
    c.customBuffs.push({id:uid(),name:""});
    c._lastLocalEdit = Date.now(); markCharDirty(c.id);
    saveState(); renderTab(); return;
  }
  if(action==="del-custom-buff"){
    if(!canEditChar(c)) return;
    c.customBuffs = (c.customBuffs||[]).filter(function(b){return b.id!==btn.getAttribute("data-id");});
    c._lastLocalEdit = Date.now(); markCharDirty(c.id);
    saveState(); renderTab(); return;
  }
  if(action==="roll-init"){ performD10Roll(c.name, "Iniciativa", c.combat.iniciativa); return; }
  if(action==="roll-weapon"){
    var wid = btn.getAttribute("data-id");
    var wpn = (c.weapons||[]).find(function(w){return w.id===wid;});
    if(wpn){
      var catItem = (state.weaponsCatalog||[]).find(function(ci){ return ci.name === wpn.name || ci.id === wpn.catalogId; });
      if(catItem && catItem.visible === false && !isGM()){
        showToast("Esta arma ha sido bloqueada por el Máster y no se puede usar.", "warning");
        return;
      }
      var formula = catItem ? catItem.dano : "1d6";
      performWeaponRoll(c.name, wpn.name||"Arma", formula);
    }
    return;
  }
  if(action==="select-weapon-catalog"){
    if(!canEditChar(c)) return;
    var selEl = e.target;
    var wid = btn.getAttribute("data-id");
    var catId = selEl.value;
    var catItem = (state.weaponsCatalog||[]).find(function(ci){ return ci.id === catId; });
    var wpnObj = (c.weapons||[]).find(function(w){ return w.id === wid; });
    if(wpnObj && catItem){
      wpnObj.name = catItem.name;
      wpnObj.dano = catItem.dano;
      wpnObj.alcance = catItem.alcance;
      wpnObj.catalogId = catItem.id;
      c._lastLocalEdit = Date.now(); markCharDirty(c.id);
      saveState(); renderTab();
      showToast("Arma equipada: " + catItem.name, "success");
    }
    return;
  }
  if(action==="toggle-weapon-visibility"){
    if(!isGM()) return;
    var wid2 = btn.getAttribute("data-id");
    var w = (state.weaponsCatalog||[]).find(function(x){return x.id===wid2;});
    if(w){
      w.visible = (w.visible===false) ? true : false;
      saveState(true);
      pushSharedData();
      renderTab();
      showToast(w.name + (w.visible ? " ahora es visible y usable para todos" : " ha sido bloqueada por el Máster"), "info");
    }
    return;
  }
  if(action==="add-global-weapon"){
    if(!isGM()) return;
    if(!state.weaponsCatalog) state.weaponsCatalog = [];
    state.weaponsCatalog.push({id:uid(), name:"Nueva Arma", dano:"1d6", alcance:"Melé", critico:"Efecto crítico", desc:"Descripción", visible:true});
    saveState(true); pushSharedData(); renderTab();
    showToast("Arma añadida al catálogo", "success");
    return;
  }
  if(action==="del-global-weapon"){
    if(!isGM()) return;
    state.weaponsCatalog = (state.weaponsCatalog||[]).filter(function(w){ return w.id !== btn.getAttribute("data-id"); });
    saveState(true); pushSharedData(); renderTab();
    showToast("Arma eliminada del catálogo", "info");
    return;
  }
  if(action==="toggle-buff-visibility"){
    if(!isGM()) return;
    var b = (state.buffCatalog||[]).find(function(x){return x.id===btn.getAttribute("data-id");});
    if(b){ b.visible = b.visible===false ? true : false; saveState(true); pushSharedData(); renderTab(); }
    return;
  }
  if(action==="add-global-buff"){
    if(!isGM()) return;
    if(!state.buffCatalog) state.buffCatalog = [];
    state.buffCatalog.push({id:uid(), name:"Nuevo Buff", type:"buff", attr:"", bonus:"", duration:"permanent", durationTurns:0, desc:"", visible:true});
    saveState(true); pushSharedData(); renderTab();
    showToast("Buff añadido al catálogo", "success");
    return;
  }
  if(action==="del-global-buff"){
    if(!isGM()) return;
    state.buffCatalog = (state.buffCatalog||[]).filter(function(b){ return b.id !== btn.getAttribute("data-id"); });
    saveState(true); pushSharedData(); renderTab();
    showToast("Buff eliminado", "info");
    return;
  }
  if(action==="add-weapon"){ if(!c || !canEditChar(c)) return; c.weapons = c.weapons || []; c.weapons.push({id:uid(),name:"",dano:"",alcance:"",catalogId:""}); c._lastLocalEdit = Date.now(); markCharDirty(c.id); saveState(false); renderTab(); return; }
  if(action==="del-weapon"){ if(!c || !canEditChar(c)) return; c.weapons = (c.weapons || []).filter(function(w){return w.id!==btn.getAttribute("data-id");}); c._lastLocalEdit = Date.now(); markCharDirty(c.id); saveState(false); renderTab(); return; }
  if(action==="add-armor"){ if(!c || !canEditChar(c)) return; c.armors = c.armors || []; c.armors.push({id:uid(),name:"",absorcion:"",estorbo:""}); c._lastLocalEdit = Date.now(); markCharDirty(c.id); saveState(false); renderTab(); return; }
  if(action==="del-armor"){ if(!c || !canEditChar(c)) return; c.armors = (c.armors || []).filter(function(a){return a.id!==btn.getAttribute("data-id");}); c._lastLocalEdit = Date.now(); markCharDirty(c.id); saveState(false); renderTab(); return; }
  if(action==="add-inventory"){ if(!c || !canEditChar(c)) return; c.inventory = c.inventory || []; c.inventory.push({id:uid(),name:"",qty:1}); c._lastLocalEdit = Date.now(); markCharDirty(c.id); saveState(false); renderTab(); return; }
  if(action==="del-inventory"){ if(!c || !canEditChar(c)) return; c.inventory = (c.inventory || []).filter(function(i){return i.id!==btn.getAttribute("data-id");}); c._lastLocalEdit = Date.now(); markCharDirty(c.id); saveState(false); renderTab(); return; }
  if(action==="add-spell"){
    if(!c || !canEditChar(c)) return;
    if(!c.spells) c.spells = [];
    c.spells.push({id:uid(), name:"", coste:1, rango:"Melé", statAttr:"", statMod:"", efecto:"", active:false});
    c._lastLocalEdit = Date.now(); markCharDirty(c.id);
    saveState(false); renderTab(); return;
  }
  if(action==="del-spell"){
    if(!c || !canEditChar(c)) return;
    c.spells = (c.spells||[]).filter(function(s){return s.id!==btn.getAttribute("data-id");});
    c._lastLocalEdit = Date.now(); markCharDirty(c.id);
    saveState(false); renderTab(); return;
  }
  if(action==="cast-spell"){
    var spId = btn.getAttribute("data-id");
    var sp = (c.spells||[]).find(function(s){ return s.id === spId; });
    if(!sp) return;
    var cost = Math.max(0, num(sp.coste, 0));
    var curMana = num(c.combat.manaActual, 0);
    if(curMana < cost){
      showToast("¡Maná insuficiente! (" + curMana + " / " + cost + ")", "warning");
      return;
    }
    c.combat.manaActual = Math.max(0, curMana - cost);
    sp.active = true;
    sp.activeStacks = (sp.activeStacks || 0) + 1;

    var statNotice = "";
    if(isShieldAttr(sp.statAttr, sp.name)){
      var shieldGain = parseShieldBonus(sp.statMod);
      if(shieldGain > 0){
        c.combat.escudoActual = num(c.combat.escudoActual, 0) + shieldGain;
        sp.shieldStacks = sp.shieldStacks || [];
        sp.shieldStacks.push(shieldGain);
        sp.shieldGranted = (sp.shieldGranted || 0) + shieldGain;
        statNotice = " [🛡️ +" + shieldGain + " Escudo/Vida Falsa (Carga " + sp.activeStacks + ")]";
      }
    } else if(sp.statAttr && sp.statMod){
      statNotice = " [Carga " + sp.activeStacks + ": " + sp.statMod + " a " + sp.statAttr + "]";
    }

    saveState();
    renderTopbar();
    renderTab();
    broadcastCharStatUpdate(c.id, c.combat);
    showToast("¡" + (sp.name || "Hechizo") + " lanzado! (" + sp.activeStacks + "ª carga) -" + cost + " maná" + statNotice, "success");
    playDiceAudio("crit");
    return;
  }
  if(action==="toggle-spell-active"){
    var spId2 = btn.getAttribute("data-id");
    var sp2 = (c.spells||[]).find(function(s){ return s.id === spId2; });
    if(sp2){
      var shieldNotice = "";
      if(sp2.shieldStacks && sp2.shieldStacks.length > 0){
        var rem = sp2.shieldStacks.pop();
        c.combat.escudoActual = Math.max(0, num(c.combat.escudoActual, 0) - rem);
        sp2.shieldGranted = Math.max(0, (sp2.shieldGranted || 0) - rem);
        shieldNotice = " (-" + rem + " Escudo/Vida Falsa)";
      } else if(sp2.shieldGranted && sp2.shieldGranted > 0){
        var rem2 = sp2.shieldGranted;
        c.combat.escudoActual = Math.max(0, num(c.combat.escudoActual, 0) - rem2);
        sp2.shieldGranted = 0;
        shieldNotice = " (-" + rem2 + " Escudo/Vida Falsa)";
      }

      sp2.activeStacks = Math.max(0, (sp2.activeStacks || 1) - 1);
      if(sp2.activeStacks <= 0){
        sp2.active = false;
        sp2.activeStacks = 0;
        sp2.shieldGranted = 0;
        sp2.shieldStacks = [];
        showToast("Efecto de " + (sp2.name || "Hechizo") + " desactivado por completo" + shieldNotice + ".", "info");
      } else {
        showToast("Retirada 1 carga de " + (sp2.name || "Hechizo") + " (" + sp2.activeStacks + " restantes)" + shieldNotice + ".", "info");
      }

      saveState();
      renderTopbar();
      renderTab();
      broadcastCharStatUpdate(c.id, c.combat);
    }
    return;
  }
  if(action==="add-stone"){ if(!c || !canEditChar(c)) return; c.stones = c.stones || []; c.stones.push({id:uid(),color:"",efecto:""}); c._lastLocalEdit = Date.now(); markCharDirty(c.id); saveState(false); renderTab(); return; }
  if(action==="del-stone"){ if(!c || !canEditChar(c)) return; c.stones = (c.stones || []).filter(function(s){return s.id!==btn.getAttribute("data-id");}); c._lastLocalEdit = Date.now(); markCharDirty(c.id); saveState(false); renderTab(); return; }
  if(action==="add-summon"){ if(!c || !canEditChar(c)) return; c.summons = c.summons || []; c.summons.push({id:uid(),name:"",vida:"",defensa:"",absorcion:"",dano:"",movilidad:"",inteligencia:"",habilidades:""}); c._lastLocalEdit = Date.now(); markCharDirty(c.id); saveState(false); renderTab(); return; }
  if(action==="del-summon"){ if(!c || !canEditChar(c)) return; c.summons = (c.summons || []).filter(function(s){return s.id!==btn.getAttribute("data-id");}); c._lastLocalEdit = Date.now(); markCharDirty(c.id); saveState(false); renderTab(); return; }
  if(action==="add-poison"){ if(!c || !canEditChar(c)) return; if(!c.poisons)c.poisons=[]; c.poisons.push({id:uid(),name:"",dosis:1,efectoEnemigo:"",efectoCherk:"",estado:"descubierto"}); c._lastLocalEdit = Date.now(); markCharDirty(c.id); saveState(false); renderTab(); return; }
  if(action==="del-poison"){ if(!c || !canEditChar(c)) return; c.poisons = (c.poisons || []).filter(function(p){return p.id!==btn.getAttribute("data-id");}); c._lastLocalEdit = Date.now(); markCharDirty(c.id); saveState(false); renderTab(); return; }
  if(action==="add-passiveNeg"){ if(!c || !canEditChar(c)) return; c.passivesNeg = c.passivesNeg || []; c.passivesNeg.push({id:uid(),text:""}); c._lastLocalEdit = Date.now(); markCharDirty(c.id); saveState(false); renderTab(); return; }
  if(action==="del-passiveNeg"){ if(!c || !canEditChar(c)) return; c.passivesNeg = (c.passivesNeg || []).filter(function(p){return p.id!==btn.getAttribute("data-id");}); c._lastLocalEdit = Date.now(); markCharDirty(c.id); saveState(false); renderTab(); return; }
  if(action==="add-passivePos"){ if(!c || !canEditChar(c)) return; c.passivesPos = c.passivesPos || []; c.passivesPos.push({id:uid(),text:""}); c._lastLocalEdit = Date.now(); markCharDirty(c.id); saveState(false); renderTab(); return; }
  if(action==="del-passivePos"){ if(!c || !canEditChar(c)) return; c.passivesPos = (c.passivesPos || []).filter(function(p){return p.id!==btn.getAttribute("data-id");}); c._lastLocalEdit = Date.now(); markCharDirty(c.id); saveState(false); renderTab(); return; }
  if(action==="add-goddess"){ if(!c || !canEditChar(c)) return; c.goddessTable = c.goddessTable || []; c.goddessTable.push({id:uid(),nombre:"",gustos:"",disgustos:""}); c._lastLocalEdit = Date.now(); markCharDirty(c.id); saveState(false); renderTab(); return; }
  if(action==="del-goddess"){ if(!c || !canEditChar(c)) return; c.goddessTable = (c.goddessTable || []).filter(function(g){return g.id!==btn.getAttribute("data-id");}); c._lastLocalEdit = Date.now(); markCharDirty(c.id); saveState(false); renderTab(); return; }
  if(action==="add-training"){
    if(!c || !canEditChar(c)) return;
    c.trainings = c.trainings || [];
    c.trainings.push({
      id: uid(),
      name: "Nuevo Entrenamiento",
      category: "skill",
      type: "existing",
      sides: 10,
      targetGoal: 20,
      targetStat: "+10 PV",
      linkedType: "",
      linkedId: "",
      narrativePercentage: 0,
      narrativeNotes: "",
      milestones: [],
      rolls: [],
      points: 0,
      createdAt: Date.now()
    });
    c._lastLocalEdit = Date.now();
    markCharDirty(c.id);
    saveState(false);
    renderTab();
    return;
  }
  if(action==="del-training"){
    if(!c || !canEditChar(c)) return;
    var trId = btn.getAttribute("data-id");
    var tr = (c.trainings || []).find(function(x){ return x.id === trId; });
    var name = tr ? tr.name : "este entrenamiento";
    if(confirm("¿Eliminar \"" + name + "\"? Se perderá su historial de tiradas y progreso acumulado.")){
      c.trainings = (c.trainings || []).filter(function(x){ return x.id !== trId; });
      c._lastLocalEdit = Date.now();
      markCharDirty(c.id);
      saveState(false);
      renderTab();
    }
    return;
  }
  if(action==="set-training-category"){
    if(!c || !canEditChar(c)) return;
    var trId = btn.getAttribute("data-id") || (btn.closest("[data-id]") && btn.closest("[data-id]").getAttribute("data-id"));
    var newCat = btn.value || btn.getAttribute("data-cat");
    var tr = (c.trainings || []).find(function(x){ return x.id === trId; });
    if(tr && newCat){
      tr.category = newCat;
      if(newCat === "unlock"){
        tr.sides = 20;
        tr.type = "new";
      } else if(newCat === "skill"){
        tr.sides = 10;
        tr.type = "existing";
      } else if(newCat === "combat"){
        tr.sides = 10;
        tr.type = "existing";
        if(!tr.targetGoal) tr.targetGoal = 20;
        if(!tr.targetStat) tr.targetStat = "+10 PV";
      } else if(newCat === "spell_summon"){
        tr.sides = 10;
        tr.type = "existing";
      } else if(newCat === "narrative"){
        tr.sides = 20;
        tr.type = "new";
      }
      c._lastLocalEdit = Date.now();
      markCharDirty(c.id);
      saveState(false);
      renderTab();
    }
    return;
  }
  if(action==="set-training-linked"){
    if(!c || !canEditChar(c)) return;
    var trId = btn.getAttribute("data-id") || (btn.closest("[data-id]") && btn.closest("[data-id]").getAttribute("data-id"));
    var val = btn.value;
    var tr = (c.trainings || []).find(function(x){ return x.id === trId; });
    if(tr){
      if(!val){
        tr.linkedType = "";
        tr.linkedId = "";
      } else if(val.startsWith("spell:")){
        tr.linkedType = "spell";
        tr.linkedId = val.replace("spell:", "");
        var foundSpell = (c.spells || []).find(function(s){ return s.id === tr.linkedId; });
        if(foundSpell && (!tr.name || tr.name === "Nuevo Entrenamiento")){
          tr.name = "Maestría: " + foundSpell.name;
        }
      } else if(val.startsWith("summon:")){
        tr.linkedType = "summon";
        tr.linkedId = val.replace("summon:", "");
        var foundSummon = (c.summons || []).find(function(s){ return s.id === tr.linkedId; });
        if(foundSummon && (!tr.name || tr.name === "Nuevo Entrenamiento")){
          tr.name = "Entrenar " + foundSummon.name;
        }
      } else if(val === "custom"){
        tr.linkedType = "custom";
        tr.linkedId = "";
      }
      c._lastLocalEdit = Date.now();
      markCharDirty(c.id);
      saveState(false);
      renderTab();
    }
    return;
  }
  if(action==="set-training-type"){
    if(!c || !canEditChar(c)) return;
    var trId = btn.getAttribute("data-id");
    var newType = btn.getAttribute("data-type");
    var tr = (c.trainings || []).find(function(x){ return x.id === trId; });
    if(tr && tr.type !== newType){
      tr.type = newType;
      tr.sides = newType === "new" ? 20 : 10;
      c._lastLocalEdit = Date.now();
      markCharDirty(c.id);
      saveState(false);
      renderTab();
    }
    return;
  }
  if(action==="add-milestone"){
    if(!c || !canEditChar(c)) return;
    var trId = btn.getAttribute("data-id");
    var tr = (c.trainings || []).find(function(x){ return x.id === trId; });
    if(tr){
      tr.milestones = tr.milestones || [];
      tr.milestones.push({ id: uid(), text: "Nueva etapa o descubrimiento...", done: false });
      var doneCount = tr.milestones.filter(function(x){ return x.done; }).length;
      tr.narrativePercentage = Math.round((doneCount / tr.milestones.length) * 100);
      c._lastLocalEdit = Date.now();
      markCharDirty(c.id);
      saveState(false);
      renderTab();
    }
    return;
  }
  if(action==="toggle-milestone"){
    if(!c || !canEditChar(c)) return;
    var trId = btn.getAttribute("data-training-id");
    var mId = btn.getAttribute("data-milestone-id");
    var tr = (c.trainings || []).find(function(x){ return x.id === trId; });
    if(tr && tr.milestones){
      var m = tr.milestones.find(function(x){ return x.id === mId; });
      if(m){
        m.done = !m.done;
        var doneCount = tr.milestones.filter(function(x){ return x.done; }).length;
        tr.narrativePercentage = Math.round((doneCount / tr.milestones.length) * 100);
        c._lastLocalEdit = Date.now();
        markCharDirty(c.id);
        saveState(false);
        renderTab();
      }
    }
    return;
  }
  if(action==="del-milestone"){
    if(!c || !canEditChar(c)) return;
    var trId = btn.getAttribute("data-training-id");
    var mId = btn.getAttribute("data-milestone-id");
    var tr = (c.trainings || []).find(function(x){ return x.id === trId; });
    if(tr && tr.milestones){
      tr.milestones = tr.milestones.filter(function(x){ return x.id !== mId; });
      var doneCount = tr.milestones.filter(function(x){ return x.done; }).length;
      tr.narrativePercentage = tr.milestones.length ? Math.round((doneCount / tr.milestones.length) * 100) : 0;
      c._lastLocalEdit = Date.now();
      markCharDirty(c.id);
      saveState(false);
      renderTab();
    }
    return;
  }
  if(action==="roll-training"){
    if(!c || !canEditChar(c)) return;
    var trId = btn.getAttribute("data-id");
    var tr = (c.trainings || []).find(function(x){ return x.id === trId; });
    if(!tr) return;

    var sides = tr.sides || (tr.type === "new" ? 20 : 10);
    tr.sides = sides;
    var roll = Math.floor(Math.random() * sides) + 1;

    var delta = 0;
    var isCrit = false;
    var isFumble = false;

    if(tr.category === "narrative"){
      if(roll === 1){
        delta = 0;
        isFumble = false;
      } else if(roll === sides){
        delta = 5;
        isCrit = true;
      } else if(roll >= 11 && roll <= 19){
        delta = 3;
      } else {
        delta = 1;
      }
    } else {
      if(roll === 1){
        delta = -5;
        isFumble = true;
      } else if(roll === sides){
        delta = 5;
        isCrit = true;
      } else if(roll >= 11 && roll <= 19){
        delta = 3;
      } else if(roll >= 2 && roll <= 10){
        delta = 1;
      }
    }

    tr.rolls = tr.rolls || [];
    var rollEntry = {
      id: uid(),
      roll: roll,
      sides: sides,
      pts: delta,
      ts: Date.now()
    };
    tr.rolls.push(rollEntry);
    tr.points = tr.rolls.reduce(function(sum, r){ return sum + (r.pts || 0); }, 0);

    c._lastLocalEdit = Date.now();
    markCharDirty(c.id);
    saveState(false);

    var ptsText = (delta >= 0 ? "+" + delta : delta) + " pto" + (Math.abs(delta) === 1 ? "" : "s");
    var detailHtml = '<div style="font-size:1.05rem;margin-top:4px;">' +
      'Tirada de Esfuerzo (d' + sides + '): <b>' + roll + '</b>' +
      '<div style="font-size:.92rem;margin-top:6px;color:' + (delta > 0 ? 'var(--gold-light)' : (delta < 0 ? 'var(--danger)' : 'var(--ink)')) + ';">' +
      'Efecto: <b>' + ptsText + '</b> al progreso' +
      '</div></div>';

    openRollModal("🥋 " + (tr.name || "Entrenamiento"), roll, detailHtml, sides, isCrit, isFumble, null, null);

    state.rollLog.unshift({
      id: uid(),
      charName: c.name || "Aventurero",
      label: "🥋 Entrenar: " + (tr.name || "Habilidad") + " (d" + sides + ")",
      total: roll,
      formulaText: "Esfuerzo: " + ptsText,
      ts: Date.now()
    });
    if(state.rollLog.length > 20) state.rollLog.length = 20;

    broadcastDiceRoll({
      id: uid(),
      charName: c.name || "Aventurero",
      label: "🥋 Entrenar: " + (tr.name || "Habilidad") + " (d" + sides + ")",
      total: roll,
      formulaText: "Esfuerzo: " + ptsText,
      isCrit: isCrit,
      isFumble: isFumble,
      ts: Date.now()
    });

    renderTab();
    return;
  }
  if(action==="add-manual-training-roll"){
    if(!c || !canEditChar(c)) return;
    var trId = btn.getAttribute("data-id");
    var tr = (c.trainings || []).find(function(x){ return x.id === trId; });
    if(!tr) return;

    var input = document.querySelector('input[data-manual-for="' + trId + '"]');
    if(!input) return;

    var val = parseInt(input.value, 10);
    var sides = tr.sides || (tr.type === "new" ? 20 : 10);
    tr.sides = sides;

    if(isNaN(val) || val < 1 || val > sides){
      showToast("Por favor, introduce un número válido entre 1 y " + sides + " (d" + sides + ")", "warning");
      input.focus();
      return;
    }

    var delta = 0;
    var isCrit = false;
    var isFumble = false;

    if(tr.category === "narrative"){
      if(val === 1){
        delta = 0;
        isFumble = false;
      } else if(val === sides){
        delta = 5;
        isCrit = true;
      } else if(val >= 11 && val <= 19){
        delta = 3;
      } else {
        delta = 1;
      }
    } else {
      if(val === 1){
        delta = -5;
        isFumble = true;
      } else if(val === sides){
        delta = 5;
        isCrit = true;
      } else if(val >= 11 && val <= 19){
        delta = 3;
      } else if(val >= 2 && val <= 10){
        delta = 1;
      }
    }

    tr.rolls = tr.rolls || [];
    var rollEntry = {
      id: uid(),
      roll: val,
      sides: sides,
      pts: delta,
      manual: true,
      ts: Date.now()
    };
    tr.rolls.push(rollEntry);
    tr.points = tr.rolls.reduce(function(sum, r){ return sum + (r.pts || 0); }, 0);

    c._lastLocalEdit = Date.now();
    markCharDirty(c.id);
    saveState(false);

    var ptsText = (delta >= 0 ? "+" + delta : delta) + " pto" + (Math.abs(delta) === 1 ? "" : "s");
    showToast("Tirada manual registrada: " + val + " en d" + sides + " (" + ptsText + ")", isCrit ? "success" : (isFumble ? "error" : "info"));

    if(isCrit) playDiceAudio("crit");
    else if(isFumble) playDiceAudio("fumble");
    else playDiceAudio("roll");

    state.rollLog.unshift({
      id: uid(),
      charName: c.name || "Aventurero",
      label: "🥋 Entrenar (Manual): " + (tr.name || "Habilidad") + " (d" + sides + ")",
      total: val,
      formulaText: "Esfuerzo: " + ptsText,
      ts: Date.now()
    });
    if(state.rollLog.length > 20) state.rollLog.length = 20;

    broadcastDiceRoll({
      id: uid(),
      charName: c.name || "Aventurero",
      label: "🥋 Entrenar (Manual): " + (tr.name || "Habilidad") + " (d" + sides + ")",
      total: val,
      formulaText: "Esfuerzo: " + ptsText,
      isCrit: isCrit,
      isFumble: isFumble,
      ts: Date.now()
    });

    renderTab();
    return;
  }
  if(action==="undo-training-roll"){
    if(!c || !canEditChar(c)) return;
    var trId = btn.getAttribute("data-training-id");
    var rollId = btn.getAttribute("data-roll-id");
    var tr = (c.trainings || []).find(function(x){ return x.id === trId; });
    if(tr && tr.rolls){
      tr.rolls = tr.rolls.filter(function(r){ return r.id !== rollId; });
      tr.points = tr.rolls.reduce(function(sum, r){ return sum + (r.pts || 0); }, 0);
      c._lastLocalEdit = Date.now();
      markCharDirty(c.id);
      saveState(false);
      renderTab();
      showToast("Tirada eliminada", "info");
    }
    return;
  }
  if(action==="toggle-bestiary-visibility"){
    if(!isGM()) return;
    var bid = btn.getAttribute("data-id");
    var b = (state.bestiary||[]).find(function(x){return x.id===bid;});
    if(b){ b.visible = b.visible===false ? true : false; saveState(true); pushSharedData(); renderTab(); }
    return;
  }
  if(action==="toggle-bestiary-mountable"){
    if(!isGM()) return;
    var bid = btn.getAttribute("data-id");
    var b = (state.bestiary||[]).find(function(x){return x.id===bid;});
    if(b){
      b.montable = !b.montable;
      saveState(true);
      pushSharedData();
      renderTab();
      showToast(b.nombre + (b.montable ? " marcada como montura" : " marcada como no montable"), "info");
    }
    return;
  }
  if(action==="set-bestiary-rarity"){
    bestiaryRarityFilter = btn.getAttribute("data-val") || "Todos";
    renderTab();
    return;
  }
  if(action==="set-bestiary-mount"){
    bestiaryMountFilter = btn.getAttribute("data-val") || "Todos";
    renderTab();
    return;
  }
  if(action==="roll-tame"){
    var creatureName = btn.getAttribute("data-name") || "Criatura";
    var diff = parseInt(btn.getAttribute("data-diff"), 10) || 3;
    var faunaDef = SKILL_DEFS.find(function(s){ return s.id === "fauna"; });
    var cabalgarDef = SKILL_DEFS.find(function(s){ return s.id === "cabalgar"; });
    var faunaTotal = faunaDef ? skillTotal(faunaDef, c) : 0;
    var cabalgarTotal = cabalgarDef ? skillTotal(cabalgarDef, c) : 0;
    var carismaVal = (c.attrs && c.attrs.carisma) ? num(c.attrs.carisma, 0) : 0;
    var bestBonus = Math.max(faunaTotal, cabalgarTotal, carismaVal);
    var chosenStat = bestBonus === faunaTotal ? "Fauna" : (bestBonus === cabalgarTotal ? "Cabalgar" : "Carisma");

    var d = rollDie(10);
    var total = d + bestBonus;
    var isSuccess = total >= diff;
    var formula = "1d10 (" + d + ") + " + chosenStat + " (" + bestBonus + ") vs Dif. " + diff;
    var rollItem = {
      id: uid(),
      charName: c.name,
      label: "Doma (" + creatureName + ")" + (isSuccess ? " ✅ ÉXITO" : " ❌ FALLO"),
      total: total,
      formulaText: formula,
      isCrit: d === 10,
      isFumble: d === 1,
      ts: Date.now()
    };
    state.rollLog.unshift(rollItem);
    if(state.rollLog.length > 20) state.rollLog.length = 20;
    saveState();
    broadcastDiceRoll(rollItem);
    showToast((isSuccess ? "¡Éxito domando a " : "Fallo al domar a ") + creatureName + " (Total: " + total + " vs Dif " + diff + ")", isSuccess ? "success" : "warning");
    if(state.activeTab === "bestiario" || state.activeTab === "combate") renderTab();
    return;
  }
  if(action==="pick-beast-mov"){
    var bid = btn.getAttribute("data-id");
    openBeastMobilityModal(bid);
    return;
  }
  if(action==="add-bestiary"){
    if(!isGM()) return;
    state.bestiary.push({
      id: uid(),
      nombre: "Nueva Criatura",
      continente: "Todos",
      rarity: "Común",
      montable: false,
      casillasMovimiento: "8",
      doma: "3",
      vida: "",
      defensa: "",
      absorcion: "",
      dano: "",
      movilidad: "",
      habilidades: "",
      visible: true
    });
    saveState(true);
    pushSharedData();
    renderTab();
    return;
  }
  if(action==="del-bestiary"){
    if(!isGM()) return;
    var bId = btn.getAttribute("data-id");
    state.bestiary = (state.bestiary||[]).filter(function(b){ return b.id !== bId; });
    saveState(true);
    pushSharedData();
    if(supabaseClient){
      supabaseClient.from('bestiary').delete().eq('id', bId).then(function(res){
        if(res.error) console.warn("Supabase bestiary delete:", res.error);
      }).catch(function(){});
    }
    renderTab();
    return;
  }
  if(action==="toggle-lore-visibility"){
    if(!isGM()) return;
    var lcat = btn.getAttribute("data-cat");
    var lid = btn.getAttribute("data-id");
    var li = (state.lore[lcat]||[]).find(function(x){return x.id===lid;});
    if(li){ li.visible = li.visible===false ? true : false; saveState(true); pushSharedData(); renderTab(); }
    return;
  }
  if(action==="open-lore-modal"){
    if(!isGM()) return;
    openLoreModal(btn.getAttribute("data-cat"));
    return;
  }
  if(action==="del-lore"){
    if(!isGM()) return;
    var cat2 = btn.getAttribute("data-cat");
    state.lore[cat2] = state.lore[cat2].filter(function(x){return x.id!==btn.getAttribute("data-id");});
    saveState(true); pushSharedData(); renderTab();
    showToast("Entrada eliminada", "info");
    return;
  }

  if(action==="sync-map-now"){ pullMapFromSupabase(); showToast("Mapas sincronizados con la nube", "success"); return; }
  if(action==="switch-map"){ state.activeMapId = btn.getAttribute("data-id"); renderTab(); return; }
  if(action==="add-new-map-url"){
    if(!isGM() && currentUser) return;
    var mn = prompt("Nombre del nuevo mapa (ej: Mazmorra, Ciudad, Continente):");
    if(!mn) return;
    var mUrl = prompt("Enlace o URL de la imagen (de GitHub, Imgur, web, etc.):");
    if(mUrl !== null){
      var nMap = { id: uid(), name: mn.trim(), image: mUrl.trim() || null, markers: [] };
      state.maps = state.maps || [];
      state.maps.push(nMap);
      state.activeMapId = nMap.id;
      saveState(true);
      pushMapsData();
      renderTab();
      showToast("Nuevo mapa creado: " + nMap.name, "success");
    }
    return;
  }
  if(action==="add-new-map-file"){
    if(!isGM() && currentUser) return;
    var mn2 = prompt("Nombre del nuevo mapa (ej: Mazmorra, Ciudad, Continente):");
    if(!mn2) return;
    pendingNewMapName = mn2.trim();
    document.getElementById("mapFileInput").click();
    return;
  }
  if(action==="delete-map"){
    if(!isGM() && currentUser) return;
    var targetMap = (state.maps||[]).find(function(m){return m.id===state.activeMapId;});
    if(!targetMap) return;
    var mName = targetMap.name || "este mapa";
    var mCount = (targetMap.markers||[]).length;
    var confirmMsg = "¿Eliminar definitivamente el mapa \"" + mName + "\"" + (mCount > 0 ? " con sus " + mCount + " marcador(es)?" : "?");
    if(confirm(confirmMsg)){
      state.maps = (state.maps||[]).filter(function(m){return m.id!==targetMap.id;});
      if(!state.maps.length){
        var defaultM = { id:"world_main", name:"Mapa de Campaña", image:null, markers:[] };
        state.maps.push(defaultM);
      }
      state.activeMapId = state.maps[0].id;
      saveState(true);
      pushMapsData();
      renderTab();
      showToast("Mapa \"" + mName + "\" eliminado", "info");
    }
    return;
  }
  if(action==="upload-map"){
    if(!isGM() && currentUser) return;
    pendingNewMapName = null;
    document.getElementById("mapFileInput").click();
    return;
  }
  if(action==="url-map"){
    if(!isGM() && currentUser) return;
    var curMUrl = (state.maps||[]).find(function(m){return m.id===state.activeMapId;});
    if(curMUrl){
      var prevMapImg = curMUrl.image || "";
      var mLink = prompt("Introduce el enlace de la imagen para \"" + curMUrl.name + "\":", prevMapImg.startsWith("data:")?"":prevMapImg);
      if(mLink !== null){
        curMUrl.image = mLink.trim() || null;
        saveState(true);
        pushMapsData();
        renderTab();
        showToast("Foto del mapa actualizada", "info");
      }
    }
    return;
  }
  if(action==="remove-map"){
    if(!isGM() && currentUser) return;
    var curM = (state.maps||[]).find(function(m){return m.id===state.activeMapId;});
    if(curM){
      curM.image = null;
      saveState(true);
      pushMapsData();
      renderTab();
      showToast("Foto quitada del mapa", "info");
    }
    return;
  }
  if(action==="map-click"){
    var curM2 = (state.maps||[]).find(function(m){return m.id===state.activeMapId;});
    var imgEl = btn.querySelector("img");
    if(curM2 && imgEl){
      var r = imgEl.getBoundingClientRect();
      var px = ((e.clientX - r.left)/r.width*100).toFixed(2);
      var py = ((e.clientY - r.top)/r.height*100).toFixed(2);
      openPinModal(curM2, px, py);
    }
    return;
  }
  if(action==="edit-pin"){
    var curM3 = (state.maps||[]).find(function(m){return m.id===state.activeMapId;});
    if(curM3) openPinModal(curM3, null, null, btn.getAttribute("data-id"));
    return;
  }

  if(action==="upload-bestiary-img"){
    if(!isGM() && currentUser) return;
    pendingBestiaryId = btn.getAttribute("data-id");
    var bFileEl = document.getElementById("bestiaryFileInput");
    if(bFileEl) bFileEl.click();
    return;
  }
  if(action==="url-bestiary-img"){
    if(!isGM() && currentUser) return;
    var bid = btn.getAttribute("data-id");
    var beast = (state.bestiary||[]).find(function(x){return x.id===bid;});
    if(beast){
      var prevBImg = beast.image || "";
      var bLink = prompt("Introduce el enlace de la criatura (de GitHub, Imgur, web, etc.):", prevBImg.startsWith("data:")?"":prevBImg);
      if(bLink !== null){
        beast.image = bLink.trim() || null;
        saveState(true); pushSharedData(); renderTab();
        showToast(beast.image ? "Imagen de criatura asignada" : "Imagen quitada", "info");
      }
    }
    return;
  }
  if(action==="remove-bestiary-img"){
    if(!isGM() && currentUser) return;
    var bid2 = btn.getAttribute("data-id");
    var beast2 = (state.bestiary||[]).find(function(x){return x.id===bid2;});
    if(beast2){
      beast2.image = null;
      saveState(true); pushSharedData(); renderTab();
      showToast("Imagen de criatura eliminada", "info");
    }
    return;
  }

  // === ACCIONES DE LA PESTAÑA MISIÓN (ESTILO BALDUR'S GATE 3 / D&D) ===
  if(action==="add-quest"){
    if(!isGM() && currentUser) return;
    var qTitle = prompt("Título de la nueva misión:");
    if(qTitle && qTitle.trim()){
      state.quests = state.quests || [];
      state.quests.push({
        id: uid(),
        title: qTitle.trim(),
        desc: "",
        status: "activa",
        tasks: []
      });
      saveState(true); pushSharedData(); renderTab();
      showToast("Misión añadida: " + qTitle, "success");
    }
    return;
  }
  if(action==="del-quest"){
    if(!isGM() && currentUser) return;
    var qid = btn.getAttribute("data-id");
    if(confirm("¿Eliminar esta misión y todas sus tareas asociadas?")){
      state.quests = (state.quests||[]).filter(function(q){ return q.id !== qid; });
      saveState(true); pushSharedData(); renderTab();
      showToast("Misión eliminada", "info");
    }
    return;
  }
  if(action==="add-quest-task"){
    if(!isGM() && currentUser) return;
    var qid2 = btn.getAttribute("data-id");
    var qObj = (state.quests||[]).find(function(q){ return q.id === qid2; });
    if(qObj){
      var tText = prompt("Nuevo objetivo o paso para esta misión:");
      if(tText && tText.trim()){
        qObj.tasks = qObj.tasks || [];
        qObj.tasks.push({ id: uid(), text: tText.trim(), done: false });
        saveState(true); pushSharedData(); renderTab();
        showToast("Objetivo añadido", "success");
      }
    }
    return;
  }
  if(action==="del-quest-task"){
    if(!isGM() && currentUser) return;
    var qid3 = btn.getAttribute("data-qid");
    var tid = btn.getAttribute("data-tid");
    var qObj2 = (state.quests||[]).find(function(q){ return q.id === qid3; });
    if(qObj2 && qObj2.tasks){
      qObj2.tasks = qObj2.tasks.filter(function(t){ return t.id !== tid; });
      saveState(true); pushSharedData(); renderTab();
    }
    return;
  }
  if(action==="toggle-quest-task"){
    var qid4 = btn.getAttribute("data-qid");
    var tid2 = btn.getAttribute("data-tid");
    var qObj3 = (state.quests||[]).find(function(q){ return q.id === qid4; });
    if(qObj3 && qObj3.tasks){
      var task = qObj3.tasks.find(function(t){ return t.id === tid2; });
      if(task){
        task.done = !task.done;
        saveState(true); pushSharedData(); renderTab();
      }
    }
    return;
  }
  if(action==="add-clue"){
    if(!isGM() && currentUser) return;
    var clTitle = prompt("Título del descubrimiento o pista:");
    if(clTitle && clTitle.trim()){
      state.questClues = state.questClues || [];
      state.questClues.push({ id: uid(), title: clTitle.trim(), text: "", image: null, visible: true });
      saveState(true); pushSharedData(); renderTab();
      showToast("Pista añadida", "success");
    }
    return;
  }
  if(action==="del-clue"){
    if(!isGM() && currentUser) return;
    var clId = btn.getAttribute("data-id");
    if(confirm("¿Eliminar esta pista?")){
      state.questClues = (state.questClues||[]).filter(function(c){ return c.id !== clId; });
      saveState(true); pushSharedData(); renderTab();
      showToast("Pista eliminada", "info");
    }
    return;
  }
  if(action==="url-clue-img"){
    if(!isGM() && currentUser) return;
    var clId2 = btn.getAttribute("data-id");
    var clObj = (state.questClues||[]).find(function(c){ return c.id === clId2; });
    if(clObj){
      var clUrl = prompt("Enlace de la imagen para esta pista (de GitHub, web, etc.):", clObj.image||"");
      if(clUrl !== null){
        clObj.image = clUrl.trim() || null;
        saveState(true); pushSharedData(); renderTab();
        showToast(clObj.image ? "Imagen de pista asignada" : "Imagen quitada", "info");
      }
    }
    return;
  }
  if(action==="remove-clue-img"){
    if(!isGM() && currentUser) return;
    var clId3 = btn.getAttribute("data-id");
    var clObj2 = (state.questClues||[]).find(function(c){ return c.id === clId3; });
    if(clObj2){
      clObj2.image = null;
      saveState(true); pushSharedData(); renderTab();
      showToast("Imagen de pista eliminada", "info");
    }
    return;
  }
  if(action==="upload-quest-map"){
    if(!isGM() && currentUser) return;
    var qFileInput = document.getElementById("questFileInput");
    if(qFileInput) qFileInput.click();
    return;
  }
  if(action==="url-quest-map"){
    if(!isGM() && currentUser) return;
    state.questMap = state.questMap || { name: "Mapa del Encuentro", image: null, notes: "" };
    var qmUrl = prompt("Introduce el enlace o URL de la imagen para el plano de misión:", state.questMap.image||"");
    if(qmUrl !== null){
      state.questMap.image = qmUrl.trim() || null;
      saveState(true); pushSharedData(); renderTab();
      showToast(state.questMap.image ? "Mapa de misión fijado" : "Mapa de misión quitado", "info");
    }
    return;
  }
  if(action==="remove-quest-map"){
    if(!isGM() && currentUser) return;
    if(state.questMap){
      state.questMap.image = null;
      saveState(true); pushSharedData(); renderTab();
      showToast("Mapa de misión quitado", "info");
    }
    return;
  }

  if(action==="open-char-modal"){ openCharModal(); return; }
  if(action==="open-data-modal"){ openDataModal(); return; }
  if(action==="open-free-dice"){ openDiceModal(); return; }
  if(action==="upload-portrait"){ document.getElementById("portraitFileInput").click(); return; }
  if(action==="url-portrait"){
    var curP = c.portrait || "";
    var uLink = prompt("Introduce el enlace de la foto (de GitHub, Imgur, web, etc.):", curP.startsWith("data:")?"":curP);
    if(uLink !== null){
      c.portrait = uLink.trim() || null;
      saveState(); renderTopbar(); renderTab();
      showToast(c.portrait ? "Foto actualizada desde enlace" : "Foto quitada", "info");
    }
    return;
  }
  if(action==="remove-portrait"){ c.portrait=null; saveState(); renderTopbar(); renderTab(); return; }
  if(action==="close-roll-modal"){ document.getElementById("rollOverlay").classList.add("hidden"); return; }
  if(action==="reroll-last-dice"){ if(typeof lastRollFn==="function") lastRollFn(); return; }
}

function handleKeyDown(e){
  if(e.key === "Enter" && e.target && e.target.matches("input[data-manual-for]")){
    e.preventDefault();
    var trId = e.target.getAttribute("data-manual-for");
    var btn = document.querySelector('button[data-action="add-manual-training-roll"][data-id="' + trId + '"]');
    if(btn) btn.click();
  }
}

var pendingBestiaryId = null;
var pendingNewMapName = null;
