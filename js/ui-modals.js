// ============================================================================
// KRYSALIS RPG - MÓDULO: UI MODALS
// Modales de selección de ficha, lore, y gestión de ventanas emergentes
// ============================================================================

function openLoreModal(cat){
  var titleLabel = cat === "objetos" ? "Recurso / Objeto" : (cat === "pistas" ? "Pista" : "NPC");
  
  var rarityBtns = RAREZAS_LIST.map(function(r){
    var col = r==="Legendaria"?"#FDE047":r==="Muy rara"?"#C084FC":r==="Rara"?"#60A5FA":"#C2B196";
    return '<button type="button" class="f-pill lore-rarity-btn" data-val="'+r+'" style="border-color:'+col+';color:'+col+';"><span>'+r+'</span></button>';
  }).join('');

  var typeSection = '';
  if(cat === "objetos"){
    var typeBtns = TIPOS_OBJETO_MODAL.map(function(t){
      return '<button type="button" class="f-pill lore-type-btn" data-val="'+t+'"><span>'+t+'</span></button>';
    }).join('');
    var terrainBtns = TERRENOS_MODAL.map(function(tr){
      return '<button type="button" class="f-pill lore-terrain-btn" data-val="'+tr+'"><span>'+tr+'</span></button>';
    }).join('');
    
    typeSection = '<div class="field" style="margin-top:10px;"><label>Tipo de Objeto</label><div class="filter-pills" id="loreModalTypes" style="flex-wrap:wrap;gap:4px;">'+typeBtns+'</div></div>'+
                  '<div class="field" style="margin-top:10px;"><label>Terreno</label><div class="filter-pills" id="loreModalTerrains" style="flex-wrap:wrap;gap:4px;">'+terrainBtns+'</div></div>';
  } else if(cat === "pistas" || cat === "npcs"){
    typeSection = '<div class="field" style="margin-top:10px;"><label>Tipo / Categoría</label><input type="text" id="loreModalCustomType" placeholder="Ej: Aliado, Lugar, Misterio..."></div>';
  }

  var continentBtns = CONTINENTES_MODAL.map(function(cnt){
    return '<button type="button" class="f-pill lore-cont-btn" data-val="'+cnt+'"><span>'+cnt+'</span></button>';
  }).join('');

  var html = '<h2>Nuevo '+titleLabel+'<button data-action="close-lore-modal" aria-label="Cerrar">&times;</button></h2>'+
    '<div class="field"><label>Nombre</label><input type="text" id="loreModalTitle" placeholder="Ej: Flor de Lirio"></div>'+
    '<div class="field" style="margin-top:8px;"><label>Rareza</label><div class="filter-pills" id="loreModalRarities" style="flex-wrap:wrap;gap:4px;">'+rarityBtns+'</div></div>'+
    typeSection+
    '<div class="field" style="margin-top:10px;"><label>Continente</label><div class="filter-pills" id="loreModalContinents" style="flex-wrap:wrap;gap:4px;">'+continentBtns+'</div></div>'+
    '<div class="field" style="margin-top:8px;"><label>Descripción / Efecto</label><textarea id="loreModalText" placeholder="Detalles o efectos..."></textarea></div>'+
    '<button class="btn-solid-gold" style="width:100%;margin-top:14px;padding:8px;" data-action="save-new-lore" data-cat="'+cat+'">Crear y Guardar</button>';

  document.getElementById("loreModal").innerHTML = html;
  
  var rSel = document.querySelectorAll("#loreModalRarities .lore-rarity-btn");
  if(rSel.length){ rSel[0].classList.add("active"); rSel[0].dataset.selected="true"; }
  
  if(cat === "objetos"){
    var tSel = document.querySelectorAll("#loreModalTypes .lore-type-btn");
    if(tSel.length){ tSel[0].classList.add("active"); tSel[0].dataset.selected="true"; }
    var trSel = document.querySelectorAll("#loreModalTerrains .lore-terrain-btn");
    if(trSel.length){ trSel[0].classList.add("active"); trSel[0].dataset.selected="true"; }
  }
  
  var cSel = document.querySelectorAll("#loreModalContinents .lore-cont-btn");
  if(cSel.length){ cSel[0].classList.add("active"); cSel[0].dataset.selected="true"; }

  document.getElementById("loreModalOverlay").classList.remove("hidden");
}

function loreModalClick(e){
  var pill = e.target.closest(".f-pill");
  if(pill){
    var parent = pill.parentElement;
    parent.querySelectorAll(".f-pill").forEach(function(b){ b.classList.remove("active"); delete b.dataset.selected; });
    pill.classList.add("active");
    pill.dataset.selected = "true";
    return;
  }

  var btn = e.target.closest("[data-action]"); if(!btn) return;
  var action = btn.getAttribute("data-action");
  if(action==="close-lore-modal"){ document.getElementById("loreModalOverlay").classList.add("hidden"); return; }
  if(action==="save-new-lore"){
    var cat = btn.getAttribute("data-cat");
    var titleVal = (document.getElementById("loreModalTitle")||{}).value || "";
    var textVal = (document.getElementById("loreModalText")||{}).value || "";
    
    var rBtn = document.querySelector("#loreModalRarities [data-selected='true']");
    var rarityVal = rBtn ? rBtn.getAttribute("data-val") : "Común";

    var typeVal = "";
    if(cat === "objetos"){
      var tBtn = document.querySelector("#loreModalTypes [data-selected='true']");
      typeVal = tBtn ? tBtn.getAttribute("data-val") : "Veneno";
    } else {
      typeVal = (document.getElementById("loreModalCustomType")||{}).value || "";
    }

    var trBtn = document.querySelector("#loreModalTerrains [data-selected='true']");
    var terrainVal = trBtn ? trBtn.getAttribute("data-val") : "";

    var cBtn = document.querySelector("#loreModalContinents [data-selected='true']");
    var contVal = cBtn ? cBtn.getAttribute("data-val") : "Todos";

    if(!titleVal.trim()){ showToast("Introduce un nombre.", "error"); return; }

    state.lore[cat].push({
      id: uid(),
      title: titleVal.trim(),
      text: textVal.trim(),
      rarity: rarityVal,
      type: typeVal,
      terrain: terrainVal,
      continent: contVal,
      visible: true
    });

    saveState(true);
    pushSharedData();
    document.getElementById("loreModalOverlay").classList.add("hidden");
    renderTab();
    showToast("Entrada creada con éxito", "success");
    return;
  }
}


function openCharModal(){
  var chars = getUserCharacters();
  var html = '<h2>Selección de Personaje<button data-action="close-modal" aria-label="Cerrar">&times;</button></h2>';
  chars.forEach(function(c){
    var cTheme = c.theme || "default";
    var swatches = THEME_LIST.map(function(t){
      var isAct = cTheme === t.id;
      return '<button type="button" class="swatch swatch-'+t.id+(isAct?' active':'')+'" data-action="set-theme" data-id="'+c.id+'" data-theme="'+t.id+'" title="Color '+t.label+'" aria-label="Color '+t.label+'"></button>';
    }).join('');
    var crestStyle = c.portrait ? ' style="background-image:url(\''+c.portrait+'\')"' : '';
    var isNPC = !!c.isNPC;
    var canDelete = isGM() || (!currentUser && !c.isNPC);

    var avatarContent = (c.portrait && c.portrait.trim())
      ? '<img src="' + esc(c.portrait) + '" alt="' + esc(c.name) + '" class="cli-avatar-img" onerror="this.style.display=\'none\';if(this.nextElementSibling)this.nextElementSibling.style.display=\'flex\';"><span class="cli-initial" style="display:none;">' + esc(c.name.charAt(0).toUpperCase()) + '</span>'
      : '<span class="cli-initial">' + esc(c.name.charAt(0).toUpperCase()) + '</span>';

    html += '<div class="char-list-item'+(c.id===state.activeId?' active':'')+(isNPC?' npc-item':'')+'" data-theme="'+cTheme+'">'+
      '<div style="display:flex;align-items:center;gap:12px;width:100%;">'+
        '<div class="cli-main-select" data-action="pick-char" data-id="'+c.id+'" style="display:flex;align-items:center;gap:12px;flex:1;min-width:0;cursor:pointer;">'+
          '<div class="char-list-avatar'+(isNPC?' npc-avatar':'')+'" data-theme="'+cTheme+'"'+crestStyle+'>'+avatarContent+'</div>'+
          '<div class="cli-info">'+
            '<div class="cli-name'+(isNPC?' npc-name':'')+'">'+esc(c.name)+(c.id===state.activeId?' <span style="font-size:0.68rem;color:var(--gold-light);font-weight:700;padding:2px 6px;border-radius:4px;background:rgba(176,141,87,0.22);margin-left:4px;border:1px solid rgba(176,141,87,0.4);">Activo</span>':'')+'</div>'+
            '<div class="cli-sub">'+(isNPC?'NPC · ':'Nv. '+esc(c.nivel||"1")+' · ')+esc(c.trabajo||"Aventurero")+'</div>'+
          '</div>'+
        '</div>'+
        (canDelete?'<button type="button" class="row-del" data-action="del-char" data-id="'+c.id+'" aria-label="Eliminar personaje" title="Eliminar personaje" style="min-width:32px;min-height:32px;width:32px;height:32px;font-size:1.1rem;cursor:pointer;">✕</button>':'')+
      '</div>'+
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:10px;padding-top:8px;border-top:1px solid rgba(176,141,87,0.15);width:100%;flex-wrap:wrap;">'+
        '<span style="font-size:0.72rem;color:var(--ink-dim);letter-spacing:0.02em;">🎨 Color de acento:</span>'+
        '<div class="theme-swatches">'+swatches+'</div>'+
      '</div>'+
    '</div>';
  });
  if(isGM() || !currentUser){
    html += '<button class="btn-compact" style="width:100%;margin-top:10px;padding:8px;" data-action="add-char">+ Crear Nuevo Personaje</button>';
  }
  if(isGM()){
    html += '<button class="btn-gm" style="width:100%;margin-top:8px;padding:8px;" data-action="add-npc">+ Crear Nuevo NPC</button>';
  }
  document.getElementById("charModal").innerHTML = html;
  document.getElementById("charModalOverlay").classList.remove("hidden");
}

function openDataModal(){
  var html = '<h2>Ajustes y Cuenta<button data-action="close-modal" aria-label="Cerrar">&times;</button></h2>';
  if(currentUser){
    html += '<div style="font-size:0.85rem;color:var(--ink-dim);margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;background:rgba(0,0,0,0.3);padding:10px 12px;border-radius:8px;border:1px solid var(--line);">'+
      '<div>'+
        '<div style="font-size:0.7rem;color:var(--ink-faint);text-transform:uppercase;letter-spacing:0.04em;">Conectado como</div>'+
        '<div style="color:var(--gold-light);font-weight:700;font-size:0.95rem;">'+esc(currentUser.email)+' <span style="font-size:0.72rem;color:var(--gold);font-weight:400;">('+ (currentRole === 'gm' ? 'Máster' : 'Jugador') +')</span></div>'+
      '</div>'+
      '<button class="btn-compact" data-action="auth-logout" style="padding:6px 12px;">Cerrar sesión</button>'+
    '</div>';
  } else {
    html += '<div style="font-size:0.8rem;color:var(--ink-dim);margin-bottom:10px;">Inicia sesión con tu cuenta para guardar y sincronizar tu personaje:</div>'+
      '<div class="field"><label>Email</label><input type="email" id="authEmail" placeholder="tu-correo@gmail.com"></div>'+
      '<div class="field" style="margin-top:8px;"><label>Contraseña</label><input type="password" id="authPass" placeholder="••••••••"></div>'+
      '<div style="display:flex;gap:8px;margin-top:12px;">'+
        '<button class="btn-solid-gold" style="flex:1;padding:8px;" data-action="auth-login">Entrar</button>'+
        '<button class="btn-compact" style="flex:1;padding:8px;" data-action="auth-signup">Crear cuenta</button>'+
      '</div>';
  }

  html += '<div style="margin-top:16px;border-top:1px solid var(--line);padding-top:14px;">'+
    '<div style="font-size:0.82rem;font-weight:700;color:var(--gold-light);margin-bottom:8px;">💾 Guardar y restaurar partida</div>'+
    '<div style="display:flex;gap:8px;">'+
      '<button class="btn-compact" style="flex:1;padding:8px;" data-action="download-full-backup" title="Descargar un archivo JSON con todos los datos">Descargar copia (.json)</button>'+
      '<button class="btn-compact" style="flex:1;padding:8px;" data-action="import-data" title="Cargar un archivo de copia anterior">Cargar copia</button>'+
    '</div>'+
    (isGM() ? '<button class="btn-compact btn-solid-gold" style="width:100%;margin-top:8px;padding:8px;" data-action="cloud-backup-now">☁️ Guardar copia en la nube ahora</button>' : '')+
    '<div style="font-size:0.72rem;color:var(--ink-faint);margin-top:10px;line-height:1.4;">'+
      '💡 <i>Descárgate una copia de vez en cuando para tenerla guardada en tu Drive o en el móvil. Si pasa algo raro con la web, pásale el archivo a Lolo (rolillo55ac@gmail.com).</i>'+
    '</div>'+
    '<button class="btn-solid-gold" style="width:100%;margin-top:12px;padding:9px;" data-action="reset-all-characters">↻ Restablecer personajes oficiales (PDF)</button>'+
  '</div>';

  document.getElementById("dataModal").innerHTML = html;
  document.getElementById("dataModalOverlay").classList.remove("hidden");
}

var diceConfig = {qty:1, sides:10, mod:0, mode:"normal"};

function modalClick(e){
  var btn = e.target.closest("[data-action]"); if(!btn) return;
  var action = btn.getAttribute("data-action");
  if(action==="close-modal"){ closeModals(); return; }
  if(action==="pick-char"){
    if(document.activeElement && document.activeElement.matches("input, textarea, select")){
      try { document.activeElement.blur(); } catch(e){}
    }
    flushPendingSync();
    state.activeId = btn.getAttribute("data-id");
    saveState(true);
    closeModals();
    renderTopbar();
    renderTab();
    return;
  }
  if(action==="add-char"){
    if(!isGM() && currentUser){
      showToast("Solo el Máster puede crear nuevos personajes.", "warning");
      return;
    }
    var nName = prompt("Nombre del nuevo personaje:");
    if(nName && nName.trim()){
      var nc = blankCharacter(nName.trim());
      if(currentUser && currentUser.id) nc.owner_id = currentUser.id;
      nc._isDirty = true;
      nc._lastLocalEdit = Date.now();
      state.characters.push(nc);
      state.activeId = nc.id;
      markCharDirty(nc.id);
      saveState(false);
      pushCharacterById(nc.id);
      closeModals();
      renderTopbar();
      renderTab();
      showToast("Personaje creado: " + nName.trim(), "success");
    }
    return;
  }
  if(action==="add-npc"){
    if(!isGM()) return;
    var nName = prompt("Nombre del NPC:");
    if(nName){
      var nn = blankCharacter(nName, true);
      nn.trabajo = "Neutral";
      state.characters.push(nn);
      state.activeId = nn.id;
      saveState(); closeModals(); renderTopbar(); renderTab();
      showToast("NPC creado: " + nName, "success");
    }
    return;
  }
  if(action==="del-char"){
    if(!isGM() && currentUser){
      showToast("Solo el Máster puede eliminar personajes.", "warning");
      return;
    }
    var targetId = btn.getAttribute("data-id");
    var targetChar = (state.characters||[]).find(function(x){return x.id===targetId;});
    var canDelete = isGM() || (!currentUser && targetChar && !targetChar.isNPC);
    if(!canDelete){
      showToast("No tienes permiso para eliminar este personaje.", "warning");
      return;
    }
    var charName = targetChar ? targetChar.name : "este personaje";
    if(confirm("¿Eliminar definitivamente a \"" + charName + "\"?")){
      if(targetChar && targetChar.db_id && supabaseClient){
        supabaseClient.from('characters').delete().eq('id', targetChar.db_id).then(function(res){
          if(res.error) console.error("Error al borrar en Supabase:", res.error);
        }).catch(function(e){ console.error("Error al borrar en Supabase:", e); });
      }
      state.characters = (state.characters||[]).filter(function(x){return x.id!==targetId;});
      if(!state.characters.length) state.characters.push(blankCharacter("Sin Personaje"));
      if(state.activeId === targetId){
        state.activeId = state.characters[0]?state.characters[0].id:"";
      }
      saveState();
      openCharModal();
      renderTopbar();
      renderTab();
      showToast("Personaje eliminado", "info");
    }
    return;
  }
  if(action==="set-theme"){
    var targetId = btn.getAttribute("data-id");
    var targetTheme = btn.getAttribute("data-theme");
    var thC = state.characters.find(function(x){return x.id===targetId;});
    if(thC){
      thC.theme = targetTheme;
      saveState(true);
      if(supabaseClient && currentUser){
        pushCharacterById(thC.id);
      }
      if(state.activeId === thC.id){
        document.body.setAttribute("data-theme", targetTheme || "default");
        renderTopbar();
        renderTab();
      }
      openCharModal();
      var tObj = THEME_LIST.find(function(t){ return t.id === targetTheme; });
      showToast("Color de " + thC.name + ": " + (tObj ? tObj.label : targetTheme), "info");
    }
    return;
  }
  if(action==="auth-login"){ supabaseLogin(document.getElementById("authEmail").value.trim(), document.getElementById("authPass").value); return; }
  if(action==="auth-signup"){ supabaseSignup(document.getElementById("authEmail").value.trim(), document.getElementById("authPass").value); return; }
  if(action==="auth-logout"){ supabaseLogout(); return; }
  if(action==="export-data" || action==="download-full-backup"){ exportFullBackup(); return; }
  if(action==="cloud-backup-now"){ performCloudBackup(false); return; }
  if(action==="import-data"){ document.getElementById("importFileInput").click(); return; }
  if(action==="reset-all-characters"){
    if(confirm("¿Deseas resetear los atributos, habilidades, combate, magias y equipo de los 5 personajes oficiales (Cherk, Ink, Bucky, Scarleth, Derek) a los valores exactos de sus fichas oficiales en PDF? Se conservarán las fotos de perfil.")){
      resetCharactersToOfficial(true);
      saveState(true);
      if(supabaseClient && currentUser){
        state.characters.forEach(function(c){ pushCharacterById(c.id); });
      }
      renderTopbar();
      renderTab();
      closeModals();
      showToast("¡Personajes oficiales (incluyendo Derek y Scarleth) reseteados con éxito!", "success");
    }
    return;
  }
}

function closeModals(){
  ["charModalOverlay","diceModalOverlay","dataModalOverlay","pinModalOverlay","loreModalOverlay"].forEach(function(id){
    document.getElementById(id).classList.add("hidden");
  });
}
