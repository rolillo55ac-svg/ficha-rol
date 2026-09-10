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

    var ownerHtml = '';
    if(!isNPC){
      if(isGM()){
        ownerHtml = '<div class="char-owner-assign-box">' +
          '<div class="char-owner-info">' +
            '<span class="char-owner-label">👤 Jugador:</span> ' +
            (c.ownerEmail ? '<span class="char-owner-email">● ' + esc(c.ownerEmail) + '</span>' : '<span class="char-owner-empty">○ Sin asignar</span>') +
          '</div>' +
          '<div class="char-owner-actions">' +
            '<button type="button" class="btn-compact" data-action="assign-char-owner" data-id="' + c.id + '" style="font-size:0.7rem;padding:3px 7px;">' +
              (c.ownerEmail ? '✏️ Cambiar' : '➕ Asignar') +
            '</button>' +
            (c.ownerEmail ? '<button type="button" class="btn-compact" data-action="clear-char-owner" data-id="' + c.id + '" title="Desvincular jugador" style="font-size:0.7rem;padding:3px 6px;color:var(--crimson-light);">✕</button>' : '') +
          '</div>' +
        '</div>';
      } else if(currentUser) {
        var isMine = isCharOwner(c, currentUser);
        ownerHtml = '<div style="margin-top:6px;font-size:0.72rem;display:flex;align-items:center;gap:4px;">' +
          (isMine
            ? '<span class="char-owner-badge mine">⭐ Tu Personaje (Control total)</span>'
            : (c.ownerEmail
                ? '<span class="char-owner-badge other">👁️ De: ' + esc(c.ownerEmail) + ' (Espectador)</span>'
                : '<span class="char-owner-badge unassigned">○ Sin asignar (Solo lectura)</span>'
              )
          ) +
        '</div>';
      }
    }

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
      ownerHtml +
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

  // === MONITOR DE ALMACENAMIENTO (LOCAL Y SUPABASE) ===
  var local = typeof getLocalStorageUsage === "function" ? getLocalStorageUsage() : { pct: 0, usedStr: "0 B", totalStr: "5.0 MB", freeStr: "5.0 MB" };
  var localPillClass = local.pct > 90 ? "critical" : (local.pct > 70 ? "warning" : "optimal");

  html += '<div class="storage-monitor-box">'+
    '<div class="storage-monitor-header">'+
      '<div class="storage-monitor-title">📊 Espacio de Almacenamiento</div>'+
      '<button class="btn-compact storage-refresh-btn" data-action="refresh-storage-stats" title="Calcular espacio actual">'+
        '<span class="storage-refresh-icon">🔄</span> Actualizar'+
      '</button>'+
    '</div>'+
    '<div class="storage-cards-grid">'+
      // Tarjeta Local
      '<div class="storage-card local">'+
        '<div class="storage-card-head">'+
          '<div class="storage-card-name"><span class="storage-card-icon">💾</span> Local (Navegador)</div>'+
          '<span class="storage-pill '+localPillClass+'" id="localPill">'+local.pct+'%</span>'+
        '</div>'+
        '<div class="storage-bar-track">'+
          '<div class="storage-bar-fill local '+localPillClass+'" id="localBarFill" style="width:'+Math.max(2, local.pct)+'%;"></div>'+
        '</div>'+
        '<div class="storage-card-stats">'+
          '<span class="storage-stat-used" id="localUsedText"><b>'+local.usedStr+'</b> ocupados de '+local.totalStr+'</span>'+
          '<span class="storage-stat-free" id="localFreeText"><b>'+local.freeStr+'</b> libres</span>'+
        '</div>'+
        '<div class="storage-card-note">Caché del personaje y configuración en este dispositivo</div>'+
        '<div id="localActionContainer">'+
          (local.base64Count > 0 ?
            '<div style="margin-top:4px;padding:6px 8px;background:rgba(241,196,15,0.12);border:1px solid rgba(241,196,15,0.3);border-radius:4px;display:flex;flex-direction:column;gap:5px;">'+
              '<div style="font-size:0.7rem;color:#FDE047;line-height:1.3;">⚠️ Tienes <b>'+local.base64Count+' foto(s)</b> en local ('+local.base64BytesStr+').</div>'+
              '<button class="btn-compact highlight" data-action="migrate-local-images" style="font-size:0.7rem;background:var(--gold);color:#120D0A;font-weight:700;padding:5px 8px;">🚀 Migrar fotos a Supabase (Liberar espacio)</button>'+
            '</div>' :
            '<div style="display:flex;justify-content:flex-end;margin-top:2px;">'+
              '<button class="btn-compact" data-action="clean-orphan-storage" style="font-size:0.65rem;padding:2px 7px;color:var(--ink-dim);" title="Elimina rastros de versiones anteriores">🧹 Limpiar caché residual</button>'+
            '</div>'
          )+
        '</div>'+
      '</div>'+
      // Tarjeta Supabase Cloud
      '<div class="storage-card cloud">'+
        '<div class="storage-card-head">'+
          '<div class="storage-card-name"><span class="storage-card-icon">☁️</span> Supabase (Nube)</div>'+
          '<span class="storage-pill optimal" id="cloudPill">Consultando...</span>'+
        '</div>'+
        '<div class="storage-bar-track">'+
          '<div class="storage-bar-fill cloud" id="cloudBarFill" style="width:0%;"></div>'+
        '</div>'+
        '<div class="storage-card-stats">'+
          '<span class="storage-stat-used" id="cloudUsedText"><b>Calculando...</b> de 1.00 GB</span>'+
          '<span class="storage-stat-free" id="cloudFreeText"><b>...</b> libres</span>'+
        '</div>'+
        '<div class="storage-card-note" id="cloudDetailText">Imágenes de personajes, mapas, misiones y pistas</div>'+
      '</div>'+
    '</div>'+
  '</div>';

  html += '<div style="margin-top:16px;border-top:1px solid var(--line);padding-top:14px;">'+
    '<div style="font-size:0.82rem;font-weight:700;color:var(--gold-light);margin-bottom:8px;">💾 Guardar y restaurar partida</div>'+
    '<div style="display:flex;gap:8px;">'+
      '<button class="btn-compact" style="flex:1;padding:8px;" data-action="download-full-backup" title="Descargar un archivo JSON con todos los datos">Descargar copia (.json)</button>'+
      '<button class="btn-compact" style="flex:1;padding:8px;" data-action="import-data" title="Cargar un archivo de copia anterior">Cargar copia</button>'+
    '</div>'+
    (isGM() ? '<button class="btn-compact btn-solid-gold" style="width:100%;margin-top:8px;padding:8px;" data-action="cloud-backup-now">☁️ Guardar copia en la nube ahora</button>' : '')+
    '<button class="btn-compact highlight" style="width:100%;margin-top:8px;padding:8px;background:rgba(176,141,87,0.18);border:1px solid var(--gold);color:var(--gold-light);font-weight:700;" data-action="repair-compendium-data" title="Verifica y recupera todas las misiones oficiales, criaturas del bestiario, armas y lore sin borrar tus datos">🛡️ Reparar y asegurar compendio oficial (Misiones y Bestiario)</button>'+
    '<button class="btn-compact" style="width:100%;margin-top:10px;padding:9px;border-color:rgba(212,175,55,0.4);display:flex;align-items:center;justify-content:center;gap:6px;" data-action="open-feedback-modal"><span>📬</span> <span>Buzón de Reportes y Sugerencias</span></button>'+
    '<div style="font-size:0.72rem;color:var(--ink-faint);margin-top:10px;line-height:1.4;">'+
      '💡 <i>Descárgate una copia de vez en cuando para tenerla guardada en tu Drive o en el móvil. Si pasa algo raro con la web, pásale el archivo al Administrador (rolillo55ac@gmail.com).</i>'+
    '</div>'+
    '<button class="btn-solid-gold" style="width:100%;margin-top:12px;padding:9px;" data-action="reset-all-characters">↻ Restablecer personajes oficiales (PDF)</button>'+
  '</div>';

  document.getElementById("dataModal").innerHTML = html;
  document.getElementById("dataModalOverlay").classList.remove("hidden");

  setTimeout(function(){
    updateStorageStatsUI(false);
  }, 50);
}

async function updateStorageStatsUI(showToastFeedback){
  var btn = document.querySelector('[data-action="refresh-storage-stats"]');
  if(btn) btn.classList.add("loading");

  try {
    // 1. Recalcular Local
    if(typeof getLocalStorageUsage === "function"){
      var local = getLocalStorageUsage();
      var localPillClass = local.pct > 90 ? "critical" : (local.pct > 70 ? "warning" : "optimal");
      var localPill = document.getElementById("localPill");
      var localBarFill = document.getElementById("localBarFill");
      var localUsedText = document.getElementById("localUsedText");
      var localFreeText = document.getElementById("localFreeText");
      var localAction = document.getElementById("localActionContainer");

      if(localPill){
        localPill.className = "storage-pill " + localPillClass;
        localPill.textContent = local.pct + "%";
      }
      if(localBarFill){
        localBarFill.className = "storage-bar-fill local " + localPillClass;
        localBarFill.style.width = Math.max(2, local.pct) + "%";
      }
      if(localUsedText) localUsedText.innerHTML = "<b>" + local.usedStr + "</b> ocupados de " + local.totalStr;
      if(localFreeText) localFreeText.innerHTML = "<b>" + local.freeStr + "</b> libres";

      if(localAction){
        localAction.innerHTML = (local.base64Count > 0 ?
          '<div style="margin-top:4px;padding:6px 8px;background:rgba(241,196,15,0.12);border:1px solid rgba(241,196,15,0.3);border-radius:4px;display:flex;flex-direction:column;gap:5px;">'+
            '<div style="font-size:0.7rem;color:#FDE047;line-height:1.3;">⚠️ Tienes <b>'+local.base64Count+' foto(s)</b> en local ('+local.base64BytesStr+').</div>'+
            '<button class="btn-compact highlight" data-action="migrate-local-images" style="font-size:0.7rem;background:var(--gold);color:#120D0A;font-weight:700;padding:5px 8px;">🚀 Migrar fotos a Supabase (Liberar espacio)</button>'+
          '</div>' :
          '<div style="display:flex;justify-content:flex-end;margin-top:2px;">'+
            '<button class="btn-compact" data-action="clean-orphan-storage" style="font-size:0.65rem;padding:2px 7px;color:var(--ink-dim);" title="Elimina rastros de versiones anteriores">🧹 Limpiar caché residual</button>'+
          '</div>'
        );
      }
    }

    // 2. Recalcular Supabase
    if(typeof getSupabaseStorageUsage === "function"){
      var cloud = await getSupabaseStorageUsage();
      var cloudPillClass = cloud.pct > 90 ? "critical" : (cloud.pct > 70 ? "warning" : "optimal");
      var cloudPill = document.getElementById("cloudPill");
      var cloudBarFill = document.getElementById("cloudBarFill");
      var cloudUsedText = document.getElementById("cloudUsedText");
      var cloudFreeText = document.getElementById("cloudFreeText");
      var cloudDetail = document.getElementById("cloudDetailText");

      if(cloudPill){
        cloudPill.className = "storage-pill " + cloudPillClass;
        cloudPill.textContent = (cloud.error ? "Offline" : cloud.displayPct);
      }
      if(cloudBarFill){
        cloudBarFill.className = "storage-bar-fill cloud " + cloudPillClass;
        cloudBarFill.style.width = Math.max(cloud.usedBytes > 0 ? 2 : 0, cloud.pct) + "%";
      }
      if(cloudUsedText){
        cloudUsedText.innerHTML = "<b>" + cloud.usedStr + "</b> ocupados de " + cloud.totalStr;
      }
      if(cloudFreeText){
        cloudFreeText.innerHTML = "<b>" + cloud.freeStr + "</b> libres";
      }
      if(cloudDetail){
        if(cloud.fileCount > 0){
          cloudDetail.textContent = cloud.fileCount + " imagen" + (cloud.fileCount > 1 ? "es" : "") + " en la nube (personajes, mapas, misiones...)";
        } else if(cloud.error){
          cloudDetail.textContent = "Sin acceso a Supabase Storage (" + cloud.error + ")";
        } else {
          cloudDetail.textContent = "Bucket de imágenes disponible (0 subidas aún)";
        }
      }
    }

    if(showToastFeedback){
      showToast("Almacenamiento actualizado", "info");
    }
  } catch(e){
    console.warn("Error en updateStorageStatsUI:", e);
  } finally {
    if(btn) btn.classList.remove("loading");
  }
}

var diceConfig = {qty:1, sides:10, mod:0, mode:"normal"};

function modalClick(e){
  var btn = e.target.closest("[data-action]"); if(!btn) return;
  var action = btn.getAttribute("data-action");
  if(action==="close-modal"){ closeModals(); return; }
  if(action==="open-feedback-modal"){ openFeedbackModal(); return; }
  if(action==="refresh-storage-stats"){ updateStorageStatsUI(true); return; }
  if(action==="migrate-local-images"){ migrateLocalImagesToSupabase(); return; }
  if(action==="clean-orphan-storage"){ cleanOrphanStorage(); return; }
  if(action==="pick-char"){
    if(document.activeElement && document.activeElement.matches("input, textarea, select")){
      try { document.activeElement.blur(); } catch(e){}
    }
    flushPendingSync();
    var pickedId = btn.getAttribute("data-id");
    state.activeId = pickedId;
    var pickedChar = (state.characters||[]).find(function(x){ return x.id === pickedId || x.db_id === pickedId; });
    if(pickedChar){
      state.activeId = pickedChar.id;
      try{
        localStorage.setItem("krysalis_active_id", pickedChar.id);
        if(pickedChar.db_id) localStorage.setItem("krysalis_active_db_id", pickedChar.db_id);
        if(pickedChar.name) localStorage.setItem("krysalis_active_name", pickedChar.name);
      }catch(errStorage){}
    }
    saveState(true);
    if(pickedChar && pickedChar.db_id && typeof subscribeToActiveCharacter === 'function'){
      subscribeToActiveCharacter(pickedChar.db_id);
    }
    closeModals();
    renderTopbar();
    renderTab();
    return;
  }
  if(action==="add-char"){
    if(!currentUser || !currentUser.id){
      showToast("Debes iniciar sesión para crear un personaje.", "warning");
      openDataModal();
      return;
    }
    if(!isGM()){
      showToast("Solo el Máster puede crear nuevos personajes.", "warning");
      return;
    }
    var nName = prompt("Nombre del nuevo personaje:");
    if(nName && nName.trim()){
      var nc = blankCharacter(nName.trim());
      nc.owner_id = currentUser.id;
      nc.ownerEmail = currentUser.email || "";
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
    if(!currentUser || !currentUser.id){
      showToast("Debes iniciar sesión con cuenta de Máster para crear un NPC.", "warning");
      openDataModal();
      return;
    }
    if(!isGM()) return;
    var nName = prompt("Nombre del NPC:");
    if(nName && nName.trim()){
      var nn = blankCharacter(nName.trim(), true);
      nn.trabajo = "Neutral";
      nn.owner_id = currentUser.id;
      nn.ownerEmail = currentUser.email || "";
      nn._isDirty = true;
      nn._lastLocalEdit = Date.now();
      state.characters.push(nn);
      state.activeId = nn.id;
      markCharDirty(nn.id);
      saveState(false);
      pushCharacterById(nn.id);
      closeModals(); renderTopbar(); renderTab();
      showToast("NPC creado: " + nName.trim(), "success");
    }
    return;
  }
  if(action==="del-char"){
    if(!isGM() && currentUser){
      showToast("Solo el Máster puede eliminar personajes.", "warning");
      return;
    }
    var targetId = btn.getAttribute("data-id");
    var targetChar = (state.characters||[]).find(function(x){return x.id===targetId || x.db_id===targetId;});
    var canDelete = isGM() || (!currentUser && targetChar && !targetChar.isNPC);
    if(!canDelete){
      showToast("No tienes permiso para eliminar este personaje.", "warning");
      return;
    }
    var charName = targetChar ? targetChar.name : "este personaje";
    if(confirm("¿Eliminar definitivamente a \"" + charName + "\"?")){
      var dbId = targetChar ? (targetChar.db_id || targetChar.id) : targetId;
      if(supabaseClient){
        if(dbId){
          supabaseClient.from('characters').delete().eq('id', dbId).then(function(res){
            if(res.error) console.error("Error al borrar en Supabase:", res.error);
          }).catch(function(e){ console.error("Error al borrar en Supabase:", e); });
        }
        if(targetChar && targetChar.name){
          supabaseClient.from('characters').delete().eq('name', targetChar.name).catch(function(){});
        }
      }
      dirtyCharIds.delete(targetId);
      if(dbId) dirtyCharIds.delete(dbId);
      if(targetChar && targetChar.id) dirtyCharIds.delete(targetChar.id);

      state.characters = (state.characters||[]).filter(function(x){
        return x.id!==targetId && x.db_id!==targetId && (!dbId || (x.id!==dbId && x.db_id!==dbId));
      });
      if(!state.characters.length) state.characters.push(blankCharacter("Sin Personaje"));
      if(state.activeId === targetId || state.activeId === dbId){
        var validChars = getUserCharacters();
        state.activeId = validChars[0]?validChars[0].id:state.characters[0].id;
      }
      saveState(true);
      openCharModal();
      renderTopbar();
      renderTab();
      showToast("Personaje eliminado", "info");
    }
    return;
  }
  if(action==="assign-char-owner"){
    if(!isGM()){
      showToast("Solo el Máster puede asignar personajes a jugadores.", "warning");
      return;
    }
    var targetId = btn.getAttribute("data-id");
    var targetChar = (state.characters||[]).find(function(x){ return x.id===targetId || x.db_id===targetId; });
    if(!targetChar) return;

    var curEmail = targetChar.ownerEmail || "";
    var newEmail = prompt("Introduce el email de la cuenta del jugador para " + targetChar.name + ":", curEmail);
    if(newEmail === null) return;

    newEmail = newEmail.trim().toLowerCase();
    targetChar.ownerEmail = newEmail;
    targetChar.owner_id = null;
    targetChar._lastLocalEdit = Date.now();
    markCharDirty(targetChar.id, "ownerEmail");
    saveState(false);
    pushCharacterById(targetChar.id);

    openCharModal();
    renderTopbar();
    renderTab();
    if(newEmail){
      showToast("Personaje " + targetChar.name + " asignado a " + newEmail, "success");
    } else {
      showToast("Personaje " + targetChar.name + " liberado (sin asignar)", "info");
    }
    return;
  }
  if(action==="clear-char-owner"){
    if(!isGM()){
      showToast("Solo el Máster puede desvincular personajes.", "warning");
      return;
    }
    var targetId = btn.getAttribute("data-id");
    var targetChar = (state.characters||[]).find(function(x){ return x.id===targetId || x.db_id===targetId; });
    if(!targetChar) return;

    if(confirm("¿Desvincular a \"" + (targetChar.ownerEmail || "este jugador") + "\" de " + targetChar.name + "? El personaje quedará libre.")){
      targetChar.ownerEmail = "";
      targetChar.owner_id = null;
      targetChar._lastLocalEdit = Date.now();
      markCharDirty(targetChar.id, "ownerEmail");
      saveState(false);
      pushCharacterById(targetChar.id);

      openCharModal();
      renderTopbar();
      renderTab();
      showToast("Personaje " + targetChar.name + " desvinculado (libre)", "info");
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
  if(action==="set-beast-mov-num"){
    var bid = btn.getAttribute("data-id");
    var val = parseInt(btn.getAttribute("data-val"), 10);
    var isSummon = btn.getAttribute("data-summon") === "true";
    setBeastMobility(bid, val, isSummon);
    return;
  }
  if(action==="step-beast-mov"){
    var bid = btn.getAttribute("data-id");
    var delta = parseInt(btn.getAttribute("data-delta"), 10);
    var isSummon = btn.getAttribute("data-summon") === "true";
    stepBeastMobility(bid, delta, isSummon);
    return;
  }
  if(action==="repair-compendium-data"){
    state = migrateState(state);
    saveState(true);
    if(isGM()){
      pushSharedData();
      pushMapsData();
    }
    renderTopbar();
    renderTab();
    closeModals();
    showToast("¡Compendio verificado! Misiones, Bestiario, Lore y Armas protegidos con éxito.", "success");
    return;
  }
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

function openBeastMobilityModal(beastId, isSummon){
  var b = null;
  if(isSummon){
    var c = activeChar();
    b = (c && c.summons ? c.summons : []).find(function(x){ return x.id === beastId; });
  } else {
    b = (state.bestiary || []).find(function(x){ return x.id === beastId; });
  }
  if(!b) return;
  var curNum = parseInt(b.casillasMovimiento || (b.movilidad ? (b.movilidad.match(/\d+/)?b.movilidad.match(/\d+/)[0]:'6') : '6'), 10) || 6;
  var meters = (curNum * 1.5).toFixed(1).replace('.0','');
  var runCasillas = curNum * 2;
  var runMeters = (runCasillas * 1.5).toFixed(1).replace('.0','');
  var slowCasillas = Math.floor(curNum / 2);
  var slowMeters = (slowCasillas * 1.5).toFixed(1).replace('.0','');

  var numberOptions = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 24];
  var summonAttr = isSummon ? ' data-summon="true"' : '';

  var numButtonsHtml = numberOptions.map(function(n){
    var isSelected = (n === curNum);
    return '<button type="button" class="btn-compact beast-num-pill '+(isSelected ? 'active' : '')+'" data-action="set-beast-mov-num" data-id="'+b.id+'" data-val="'+n+'"'+summonAttr+'>'+n+'</button>';
  }).join('');

  var terrainInfo = (b.movilidad && b.movilidad.includes('(')) ? b.movilidad.slice(b.movilidad.indexOf('(')) : '';
  var creatureName = b.nombre || b.name || "Criatura";

  var html = '<h2>🏃 Movilidad: '+esc(creatureName)+'<button data-action="close-modal" aria-label="Cerrar">&times;</button></h2>'+
    '<div class="beast-mov-modal-hero">'+
      '<div class="beast-mov-hero-label">Casillas de movimiento en tablero:</div>'+
      '<div class="beast-mov-stepper">'+
        '<button type="button" class="beast-step-btn" data-action="step-beast-mov" data-id="'+b.id+'" data-delta="-1"'+summonAttr+' title="Restar casilla">-</button>'+
        '<div class="beast-mov-hero-value">'+curNum+'<span class="beast-mov-hero-unit">casillas</span></div>'+
        '<button type="button" class="beast-step-btn" data-action="step-beast-mov" data-id="'+b.id+'" data-delta="1"'+summonAttr+' title="Sumar casilla">+</button>'+
      '</div>'+
      '<div class="beast-mov-hero-equiv">Equivale a aprox. <strong>'+meters+' metros</strong> por turno '+esc(terrainInfo)+'</div>'+
    '</div>'+

    '<div class="field" style="margin-top:14px;">'+
      '<label style="color:var(--gold-light);font-size:0.8rem;text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:8px;">Seleccionar número de casillas:</label>'+
      '<div class="beast-numbers-grid">'+numButtonsHtml+'</div>'+
    '</div>'+

    '<div class="beast-tactical-box">'+
      '<div class="beast-tactical-title">⚡ Desplazamiento táctico en combate:</div>'+
      '<div class="beast-tactical-row"><span>🚶 <strong>Paso Normal:</strong></span> <span><strong>'+curNum+'</strong> casillas ('+meters+' m)</span></div>'+
      '<div class="beast-tactical-row"><span>🐎 <strong>A la Carrera / Galope:</strong></span> <span><strong>'+runCasillas+'</strong> casillas ('+runMeters+' m)</span></div>'+
      '<div class="beast-tactical-row"><span>🌊 <strong>Terreno Difícil / Nadar:</strong></span> <span><strong>'+slowCasillas+'</strong> casillas ('+slowMeters+' m)</span></div>'+
    '</div>'+

    '<div style="display:flex;gap:8px;margin-top:14px;">'+
      '<button type="button" class="btn-solid-gold" style="flex:1;padding:9px;" data-action="close-modal">Listo / Cerrar</button>'+
    '</div>';

  document.getElementById("dataModal").innerHTML = html;
  document.getElementById("dataModalOverlay").classList.remove("hidden");
}

var activeConflictData = null;

function showConflictModal(localChar, remoteData, remoteTs){
  activeConflictData = {
    localChar: localChar,
    remoteData: remoteData,
    remoteTs: remoteTs
  };

  var charName = localChar ? localChar.name : "este personaje";
  var timeStr = remoteTs ? new Date(remoteTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "hace un instante";

  var html = '<div style="padding:6px 2px;">'+
    '<h2 style="display:flex;align-items:center;gap:8px;color:#FBBF24;margin-top:0;font-size:1.1rem;">'+
      '<span>⚠️</span> <span>Conflicto de Edición Simultánea</span>'+
    '</h2>'+
    '<p style="font-size:0.88rem;color:var(--ink);line-height:1.5;margin-bottom:12px;">'+
      'Otro jugador o dispositivo ha guardado cambios en <strong>'+esc(charName)+'</strong> ('+timeStr+') mientras realizabas modificaciones locales.'+
    '</p>'+
    '<div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:6px;padding:10px;margin-bottom:14px;font-size:0.8rem;color:var(--ink-dim);line-height:1.4;">'+
      '🔒 <strong>Tus cambios locales están protegidos:</strong> Se ha guardado una copia de seguridad en tu navegador para que nunca pierdas datos.'+
    '</div>'+
    '<div style="display:flex;flex-direction:column;gap:10px;">'+
      '<button type="button" class="btn-solid-gold" style="width:100%;padding:11px 12px;font-size:0.85rem;" data-action="resolve-conflict-server">'+
        '📥 Cargar versión del servidor (Recomendado)'+
      '</button>'+
      '<button type="button" class="btn-compact" style="width:100%;padding:10px 12px;font-size:0.82rem;border-color:rgba(239,68,68,0.5);color:#F87171;" data-action="resolve-conflict-local">'+
        '⚠️ Forzar y sobrescribir con mis cambios locales'+
      '</button>'+
    '</div>'+
  '</div>';

  var modalEl = document.getElementById("conflictModal");
  if(modalEl) modalEl.innerHTML = html;
  var overlay = document.getElementById("conflictModalOverlay");
  if(overlay) overlay.classList.remove("hidden");
}

function closeModals(){
  ["charModalOverlay","diceModalOverlay","dataModalOverlay","pinModalOverlay","loreModalOverlay","conflictModalOverlay","feedbackModalOverlay"].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.classList.add("hidden");
  });
}

// ==============================================================================
// SISTEMA AUTOMATIZADO DE REPORTES CON TRIAGE IA Y ALERTAS EN DISCORD
// ==============================================================================
var DEFAULT_DISCORD_WEBHOOK = "";
var currentFeedbackCategory = "bug";
var lastGeneratedReport = null;

function getMasterDiscordWebhook(){
  try {
    return localStorage.getItem("krysalis_discord_webhook") || DEFAULT_DISCORD_WEBHOOK || "";
  } catch(e){
    return DEFAULT_DISCORD_WEBHOOK || "";
  }
}

function setMasterDiscordWebhook(url){
  try {
    localStorage.setItem("krysalis_discord_webhook", (url || "").trim());
  } catch(e){}
}

function openFeedbackModal(prefilledCategory, prefilledTitle){
  currentFeedbackCategory = prefilledCategory || "bug";
  var c = (typeof activeChar === "function") ? activeChar() : null;
  var userEmail = (typeof currentUser !== "undefined" && currentUser && currentUser.email) ? currentUser.email : "";
  var defaultContact = c ? (c.name + (userEmail ? " (" + userEmail + ")" : "")) : userEmail;

  var catOptions = [
    { id: "bug", label: "🐛 Error / Bug", desc: "Algo no funciona o se rompió" },
    { id: "sugerencia", label: "💡 Sugerencia", desc: "Idea o propuesta de mejora" },
    { id: "balance", label: "⚖️ Reglas / Balance", desc: "Cálculo, daño o habilidad" },
    { id: "otro", label: "💬 Consulta / Otro", desc: "Duda general del juego" }
  ];

  var catPills = catOptions.map(function(cat){
    var active = (cat.id === currentFeedbackCategory) ? "active" : "";
    return '<button type="button" class="f-pill feedback-cat-pill ' + active + '" data-val="' + cat.id + '" title="' + cat.desc + '">' +
      '<span>' + cat.label + '</span>' +
    '</button>';
  }).join('');

  var gmPanelBtn = isGM() ? 
    '<button type="button" class="btn-compact" style="width:100%;margin-bottom:12px;padding:8px;border-color:rgba(88,101,242,0.5);color:#8EA1E1;font-size:0.8rem;background:rgba(88,101,242,0.12);" data-action="open-feedback-admin">' +
      '🎮 Panel de Administración: Ver reportes recibidos y configurar Discord' +
    '</button>' : '';

  var html = '<h2>📬 Buzón de Reportes y Sugerencias<button data-action="close-feedback-modal" aria-label="Cerrar">&times;</button></h2>' +
    gmPanelBtn +
    '<p class="feedback-subtitle">Envía cualquier problema, duda o sugerencia. Nuestro sistema lo procesará junto al contexto de tu partida y notificará directamente al Administrador.</p>' +

    '<div class="field" style="margin-top:8px;">' +
      '<label style="display:block;margin-bottom:6px;">Tipo de Incidencia</label>' +
      '<div class="filter-pills feedback-cat-grid" id="feedbackCategoryPills">' + catPills + '</div>' +
    '</div>' +

    '<div class="field" style="margin-top:10px;">' +
      '<label for="fbTitle">Título o Asunto breve *</label>' +
      '<input type="text" id="fbTitle" placeholder="Ej: No se aplica el crítico de mi espada, duda de sigilo..." value="' + (prefilledTitle ? esc(prefilledTitle) : "") + '" required>' +
    '</div>' +

    '<div class="field" style="margin-top:10px;">' +
      '<label for="fbDesc">Descripción detallada *</label>' +
      '<textarea id="fbDesc" rows="4" placeholder="Explica con detalle qué ocurrió o qué te gustaría mejorar..." required></textarea>' +
    '</div>' +

    '<div class="field" style="margin-top:10px;">' +
      '<label for="fbContact">Tu Nombre / Personaje (Opcional)</label>' +
      '<input type="text" id="fbContact" placeholder="Tu nombre o personaje..." value="' + esc(defaultContact) + '">' +
    '</div>' +

    '<div class="feedback-privacy-note">' +
      '🔒 <b>100% Privado y Directo:</b> Tu reporte se procesará de forma segura y se enviará directamente al Administrador sin intermediarios.' +
    '</div>' +

    '<div class="feedback-actions" style="margin-top:14px;display:flex;flex-direction:column;gap:8px;">' +
      '<button type="button" class="btn-solid-gold" id="btnSubmitFeedback" style="width:100%;padding:12px 14px;font-size:0.95rem;font-weight:700;" data-action="submit-feedback-report">' +
        '🚀 Enviar Reporte al Administrador' +
      '</button>' +
      '<button type="button" class="btn-compact" style="width:100%;padding:8px;font-size:0.8rem;" data-action="close-feedback-modal">' +
        'Cancelar' +
      '</button>' +
    '</div>';

  var modal = document.getElementById("feedbackModal");
  if(modal) modal.innerHTML = html;
  var overlay = document.getElementById("feedbackModalOverlay");
  if(overlay) overlay.classList.remove("hidden");
}

function buildFeedbackDiagnostic(cat, title, desc, contact){
  var c = (typeof activeChar === "function") ? activeChar() : null;
  var ua = navigator.userAgent;
  var browser = "Navegador";
  if(/chrome|crios/i.test(ua)) browser = "Chrome";
  else if(/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if(/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
  else if(/edg/i.test(ua)) browser = "Edge";

  var os = "Desconocido";
  if(/android/i.test(ua)) os = "Android";
  else if(/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if(/windows/i.test(ua)) os = "Windows";
  else if(/mac/i.test(ua)) os = "macOS";
  else if(/linux/i.test(ua)) os = "Linux";

  var catIcons = {
    bug: "🐛 Error / Bug",
    sugerencia: "💡 Sugerencia",
    balance: "⚖️ Balance / Reglas",
    otro: "💬 Consulta"
  };

  var recentRolls = [];
  try {
    if(state && state.rollLog && Array.isArray(state.rollLog)){
      recentRolls = state.rollLog.slice(-3).map(function(r){
        return (r.label || "Tirada") + ": " + (r.formula || "") + " = " + (r.total || r.result || "?");
      });
    }
  } catch(e){}

  var charStats = null;
  if(c){
    charStats = {
      id: c.id,
      name: c.name,
      level: c.nivel || c.level || 1,
      job: c.trabajo || "Aventurero",
      pvActual: (c.combat && c.combat.pvActual) || 0,
      pvMax: (c.combat && c.combat.pvMax) || 0,
      manaActual: (c.combat && c.combat.manaActual) || 0,
      manaMax: (c.combat && c.combat.manaMax) || 0,
      escudo: (c.combat && c.combat.escudoActual) || 0,
      attrs: c.attrs || {}
    };
  }

  var now = new Date();
  return {
    id: (typeof uid === "function") ? uid() : ("fb_" + Date.now()),
    timestamp: now.toISOString(),
    displayDate: now.toLocaleString(),
    category: cat,
    categoryLabel: catIcons[cat] || cat,
    title: title.trim(),
    description: desc.trim(),
    contact: contact.trim() || (c ? c.name : "Anónimo"),
    character: charStats,
    recentRolls: recentRolls,
    system: {
      appVersion: "v1.0.6",
      screen: window.innerWidth + "x" + window.innerHeight,
      browser: browser,
      os: os,
      isPWA: window.matchMedia("(display-mode: standalone)").matches || !!navigator.standalone,
      network: navigator.onLine ? "Online" : "Offline",
      syncStatus: (typeof currentUser !== "undefined" && currentUser) ? "Nube (Supabase)" : "Local"
    }
  };
}

function generateAiTriageAnalysis(report){
  var lowerDesc = (report.description + " " + report.title).toLowerCase();
  var cat = report.category;
  var c = report.character;

  var classification = "Consulta / Balance General";
  var diagnostic = "";
  var suggestedReply = "";
  var technicalAction = "Revisar en sesión con el jugador o en código.";
  var isSecuritySafe = true;

  if(/<script|select\s+\*|union\s+select|eval\(|drop\s+table/i.test(lowerDesc)){
    classification = "⚠️ Alerta de Seguridad / Inyección de Código";
    diagnostic = "Se detectaron patrones sospechosos de inyección de código en el texto del reporte. El sistema sanitizó el contenido.";
    suggestedReply = "Hola, tu reporte contiene caracteres no permitidos. Por favor, describe tu incidencia en texto plano.";
    technicalAction = "Descartar reporte. Las consultas están parametrizadas con RLS.";
    isSecuritySafe = false;
  } else if(cat === "bug" || /error|falla|bug|no suma|no resta|desaparece|roto/i.test(lowerDesc)){
    if(/tirada|dado|daño|critico|fuerza|destreza/i.test(lowerDesc)){
      classification = "Fallo de Usuario / Confusión de Tirador";
      var rollContext = report.recentRolls.length ? report.recentRolls.join(" | ") : "Sin tiradas recientes";
      diagnostic = "El jugador indica problemas con el cálculo de una tirada. Últimas tiradas registradas: [" + rollContext + "]. Suele ocurrir si se tira desde el tirador rápido libre en lugar del botón de arma/habilidad específica.";
      suggestedReply = "¡Hola " + report.contact + "! Hemos revisado tu reporte. Ten en cuenta que si usas el tirador rápido de dados, la tirada es neutra. Para que se apliquen tus atributos y daño automáticamente, debes pulsar directamente sobre el arma o habilidad en tu pestaña de Combate.";
      technicalAction = "Verificar si el jugador usó el arma correspondiente en js/ui-events.js.";
    } else if(/vida|mana|maná|pv|curar|muerto|agonizando/i.test(lowerDesc)){
      classification = "Revisión de Estado de Combate";
      var hpContext = c ? (c.pvActual + "/" + c.pvMax + " PV, " + c.manaActual + "/" + c.manaMax + " MP") : "Desconocido";
      diagnostic = "Incidencia sobre valores de vitalidad/recursos (Estado actual: " + hpContext + ").";
      suggestedReply = "¡Hola " + report.contact + "! Hemos verificado el estado de tus recursos (" + hpContext + "). Recuerda que los efectos de debuff o descanso modifican los valores máximos según las reglas de Krysalis.";
      technicalAction = "Revisar sincronización RPC de vida/maná en js/sync.js.";
    } else {
      classification = "Posible Bug Técnico de Interfaz";
      diagnostic = "Reporte sobre comportamiento inesperado en la interfaz. Dispositivo: " + report.system.os + " (" + report.system.browser + ", " + report.system.screen + ").";
      suggestedReply = "¡Hola " + report.contact + "! Gracias por avisarnos del error '" + report.title + "'. El equipo de Administración ya tiene el aviso y lo revisaremos en la próxima actualización de la aplicación.";
      technicalAction = "Inspeccionar componente reportado según la versión v1.0.6.";
    }
  } else if(cat === "sugerencia" || /mejorar|añadir|podria|seria bueno|propuesta/i.test(lowerDesc)){
    classification = "Sugerencia de Jugador / Mejora de Experiencia";
    diagnostic = "Propuesta de nueva funcionalidad o ajuste de interfaz. No altera la integridad del juego ni compromete datos.";
    suggestedReply = "¡Hola " + report.contact + "! Muchas gracias por tu sugerencia sobre '" + report.title + "'. Nos parece una idea genial y la hemos anotado para evaluar su incorporación en el juego.";
    technicalAction = "Evaluar con el Administrador si procede programarlo.";
  } else {
    classification = "Consulta de Reglas / Duda General";
    diagnostic = "Duda de reglas o funcionamiento del personaje (" + (c ? (c.name + " Nv." + c.level) : "Sin PJ") + ").";
    suggestedReply = "¡Hola " + report.contact + "! El Administrador ha recibido tu consulta sobre '" + report.title + "' y te responderá en la próxima sesión de juego.";
    technicalAction = "Aclarar regla directamente con el jugador.";
  }

  return {
    classification: classification,
    diagnostic: diagnostic,
    suggestedReply: suggestedReply,
    technicalAction: technicalAction,
    isSecuritySafe: isSecuritySafe
  };
}

async function sendDiscordWebhookReport(report){
  var webhookUrl = getMasterDiscordWebhook();
  if(!webhookUrl){
    console.log("Discord Webhook no configurado. El reporte se conserva en el panel del Máster.");
    return { success: false, reason: "no_webhook" };
  }

  var triage = report.aiTriage || {};
  var c = report.character;

  // Colores Discord Embed
  var colorMap = {
    bug: 0xEF4444,        // Rojo
    sugerencia: 0xFBBF24, // Dorado
    balance: 0x3B82F6,    // Azul
    otro: 0xA855F7        // Púrpura
  };
  var embedColor = colorMap[report.category] || 0xB08D57;

  var charLine = c ? 
    ("• **" + esc(c.name) + "** (Nv." + c.level + " " + esc(c.job) + ")\n• **PV:** " + c.pvActual + "/" + c.pvMax + " | **MP:** " + c.manaActual + "/" + c.manaMax + (c.escudo > 0 ? " | **Escudo:** " + c.escudo : "")) :
    "Sin personaje activo";

  var rollsLine = (report.recentRolls && report.recentRolls.length) ? 
    report.recentRolls.join("\n") : 
    "Sin tiradas registradas";

  var payload = {
    username: "Krysalis • Triage IA",
    avatar_url: "https://rolillo55ac-svg.github.io/ficha-rol/images/icon-192.png",
    embeds: [
      {
        title: report.categoryLabel + ": " + report.title,
        description: "**Mensaje del Jugador:**\n> " + report.description.split("\n").join("\n> "),
        color: embedColor,
        fields: [
          {
            name: "👤 Remitente / Personaje",
            value: "**" + report.contact + "**\n" + charLine,
            inline: true
          },
          {
            name: "📱 Entorno & Dispositivo",
            value: "• **SO:** " + report.system.os + "\n• **Nav:** " + report.system.browser + "\n• **App:** " + report.system.appVersion + (report.system.isPWA ? " (PWA)" : ""),
            inline: true
          },
          {
            name: "🎲 Tiradas Recientes",
            value: rollsLine,
            inline: false
          },
          {
            name: "🧠 Diagnóstico de la IA",
            value: "**Clasificación:** *" + triage.classification + "*\n" + triage.diagnostic,
            inline: false
          },
          {
            name: "🛡️ Ciberseguridad",
            value: triage.isSecuritySafe ? "✅ Verificada (Sin riesgos de inyección)" : "⚠️ Alerta de sanitización",
            inline: true
          },
          {
            name: "🛠️ Acción Recomendada",
            value: triage.technicalAction || "Ninguna acción de código requerida.",
            inline: true
          },
          {
            name: "💬 Respuesta sugerida para el jugador (Copiar y Enviar)",
            value: "```\n" + (triage.suggestedReply || "Sin respuesta generada.") + "\n```",
            inline: false
          }
        ],
        footer: {
          text: "Krysalis Rol • " + report.displayDate
        }
      }
    ]
  };

  try {
    var res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if(res.ok || res.status === 204){
      return { success: true };
    } else {
      var errText = await res.text();
      console.warn("Error en Discord Webhook:", res.status, errText);
      return { success: false, error: errText };
    }
  } catch(err){
    console.error("Fallo al conectar con Discord Webhook:", err);
    return { success: false, error: err.message };
  }
}

async function submitFeedbackReport(){
  var btn = document.getElementById("btnSubmitFeedback");
  var titleEl = document.getElementById("fbTitle");
  var descEl = document.getElementById("fbDesc");
  var contactEl = document.getElementById("fbContact");

  var title = titleEl ? titleEl.value.trim() : "";
  var desc = descEl ? descEl.value.trim() : "";
  var contact = contactEl ? contactEl.value.trim() : "";

  if(!title){
    showToast("Por favor, introduce un título o asunto.", "warning");
    if(titleEl) titleEl.focus();
    return;
  }
  if(!desc){
    showToast("Por favor, describe con detalle qué ocurrió o tu propuesta.", "warning");
    if(descEl) descEl.focus();
    return;
  }

  if(btn){
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> Procesando con IA y enviando a Discord...';
  }

  var report = buildFeedbackDiagnostic(currentFeedbackCategory, title, desc, contact);
  var aiTriage = generateAiTriageAnalysis(report);
  report.aiTriage = aiTriage;
  lastGeneratedReport = report;

  state.feedbackReports = state.feedbackReports || [];
  state.feedbackReports.unshift(report);
  if(state.feedbackReports.length > 50) state.feedbackReports.pop();
  saveState(false);

  if(typeof supabaseClient !== "undefined" && supabaseClient && navigator.onLine){
    try {
      supabaseClient.from("app_feedback").insert([{
        id: report.id,
        category: report.category,
        title: report.title,
        description: report.description,
        contact: report.contact,
        character_name: report.character ? report.character.name : null,
        system_metadata: report.system,
        ai_triage: report.aiTriage,
        created_at: report.timestamp
      }]).then(function(res){
        if(res && res.error) console.warn("Supabase feedback insert:", res.error.message);
      }).catch(function(){});
    } catch(e){}
  }

  sendDiscordWebhookReport(report);
  showPlayerSuccessScreen(report);
}

function showPlayerSuccessScreen(report){
  var html = '<h2>🎉 ¡Reporte Enviado!<button data-action="close-feedback-modal" aria-label="Cerrar">&times;</button></h2>' +
    '<div class="feedback-success-card">' +
      '<div class="success-icon-badge">✅</div>' +
      '<div class="success-title">Recibido y Procesado con Éxito</div>' +
      '<p class="success-text">Tu reporte ha sido registrado en el sistema y remitido directamente al Administrador con el análisis de tu partida para revisarlo cuanto antes.</p>' +
    '</div>' +

    '<div style="background:rgba(0,0,0,0.35);border:1px solid var(--line);border-radius:8px;padding:12px;margin-bottom:14px;font-size:0.8rem;color:var(--ink-dim);line-height:1.45;">' +
      '<div>📌 <b>Asunto:</b> ' + esc(report.title) + '</div>' +
      '<div style="margin-top:4px;">🏷️ <b>Categoría:</b> ' + esc(report.categoryLabel) + '</div>' +
      '<div style="margin-top:4px;color:var(--gold-light);">🤖 <b>Estado:</b> Procesado por Asistencia IA y notificado al Administrador</div>' +
    '</div>' +

    '<div style="display:flex;flex-direction:column;gap:8px;">' +
      '<button type="button" class="btn-solid-gold" style="width:100%;padding:10px 14px;font-size:0.9rem;" data-action="close-feedback-modal">' +
        'Entendido / Cerrar' +
      '</button>' +
    '</div>';

  var modal = document.getElementById("feedbackModal");
  if(modal) modal.innerHTML = html;
  showToast("¡Reporte enviado al Administrador con éxito!", "success");
}

function openFeedbackAdminModal(){
  var webhookUrl = getMasterDiscordWebhook();
  var reports = state.feedbackReports || [];

  var statusBadge = webhookUrl ? 
    '<span class="storage-pill optimal">🟢 Discord Conectado</span>' : 
    '<span class="storage-pill warning">⚠️ Discord Sin Configurar</span>';

  var reportsListHtml = '';
  if(!reports.length){
    reportsListHtml = '<div style="font-size:0.8rem;color:var(--ink-faint);font-style:italic;padding:12px;text-align:center;">No hay reportes registrados aún.</div>';
  } else {
    reportsListHtml = reports.map(function(r, idx){
      var triage = r.aiTriage || {};
      var diagSnippet = triage.diagnostic || "Reporte técnico pendiente de revisión.";
      var replySnippet = triage.suggestedReply || "";

      return '<div class="admin-report-item" style="background:rgba(0,0,0,0.4);border:1px solid var(--line);border-radius:8px;padding:10px;margin-bottom:10px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">' +
          '<div>' +
            '<span style="font-size:0.7rem;color:var(--gold);font-weight:700;text-transform:uppercase;">' + esc(r.categoryLabel || r.category) + '</span>' +
            '<div style="font-weight:700;font-size:0.9rem;color:var(--ink);">' + esc(r.title) + '</div>' +
            '<div style="font-size:0.75rem;color:var(--ink-faint);">Por ' + esc(r.contact || "Anónimo") + ' · ' + esc(r.displayDate || "") + '</div>' +
          '</div>' +
          '<span class="storage-pill ' + (triage.isSecuritySafe === false ? 'critical' : 'optimal') + '" style="font-size:0.65rem;">' + esc(triage.classification || "Tratado") + '</span>' +
        '</div>' +

        '<div style="background:rgba(255,255,255,0.03);border-radius:6px;padding:8px;margin-top:8px;font-size:0.78rem;color:var(--ink-dim);line-height:1.4;">' +
          '<b>Mensaje:</b> "' + esc(r.description) + '"' +
        '</div>' +

        '<div style="background:rgba(212,175,55,0.08);border-left:3px solid var(--gold);padding:8px;margin-top:8px;font-size:0.76rem;color:var(--gold-light);line-height:1.4;">' +
          '🧠 <b>Análisis IA:</b> ' + esc(diagSnippet) +
        '</div>' +

        (replySnippet ? 
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;gap:6px;">' +
            '<button type="button" class="btn-compact" style="flex:1;padding:6px 8px;font-size:0.72rem;" data-action="copy-admin-reply" data-idx="' + idx + '">' +
              '📋 Copiar respuesta para el jugador' +
            '</button>' +
            '<button type="button" class="btn-compact" style="padding:6px 8px;font-size:0.72rem;border-color:rgba(88,101,242,0.5);color:#8EA1E1;" data-action="resend-admin-discord" data-idx="' + idx + '" title="Reenviar a Discord">' +
              '📡 Enviar a Discord' +
            '</button>' +
          '</div>' : ''
        ) +
      '</div>';
    }).join('');
  }

  var html = '<h2>🛡️ Buzón de Administración y Discord Webhook<button data-action="close-feedback-modal" aria-label="Cerrar">&times;</button></h2>' +
    '<div class="storage-monitor-box" style="margin-top:0;">' +
      '<div class="storage-monitor-header">' +
        '<div class="storage-monitor-title">🎮 Notificaciones a tu Discord</div>' +
        statusBadge +
      '</div>' +
      '<p style="font-size:0.78rem;color:var(--ink-dim);margin:0 0 8px;line-height:1.4;">' +
        'Recibe las alertas tratadas por la IA directamente en un canal de tu servidor de Discord:' +
      '</p>' +
      '<div style="font-size:0.72rem;color:var(--ink-faint);margin-bottom:10px;line-height:1.4;background:rgba(0,0,0,0.3);padding:8px;border-radius:6px;border:1px solid var(--line);">' +
        '1. En Discord, ve a <b>Ajustes del canal</b> (ej: #reportes-rol) ➔ <b>Integraciones</b> ➔ <b>Webhooks</b>.<br>' +
        '2. Crea un <b>Nuevo Webhook</b> y pulsa <b>Copiar URL de Webhook</b>.<br>' +
        '3. Pega el enlace aquí abajo y pulsa <b>Guardar</b>.' +
      '</div>' +
      '<div style="display:flex;gap:6px;">' +
        '<input type="url" id="inputDiscordWebhook" placeholder="https://discord.com/api/webhooks/..." value="' + esc(webhookUrl) + '" style="font-size:0.78rem;padding:6px 8px;flex:1;">' +
        '<button type="button" class="btn-solid-gold" style="padding:6px 12px;font-size:0.78rem;" data-action="save-discord-webhook">Guardar</button>' +
      '</div>' +
      '<div style="margin-top:8px;display:flex;gap:6px;">' +
        '<button type="button" class="btn-compact" style="flex:1;font-size:0.74rem;padding:6px;border-color:rgba(88,101,242,0.5);color:#8EA1E1;" data-action="test-discord-ping">' +
          '🧪 Enviar mensaje de prueba a mi Discord' +
        '</button>' +
      '</div>' +
    '</div>' +

    '<div style="display:flex;justify-content:space-between;align-items:center;margin:12px 0 8px;">' +
      '<div style="font-weight:700;font-size:0.85rem;color:var(--gold-light);">📋 Reportes recibidos (' + reports.length + ')</div>' +
      '<button type="button" class="btn-compact" style="font-size:0.7rem;padding:3px 8px;" data-action="clear-all-feedback" title="Borrar historial local">Limpiar</button>' +
    '</div>' +

    '<div style="max-height:260px;overflow-y:auto;padding-right:4px;">' +
      reportsListHtml +
    '</div>' +

    '<div style="margin-top:12px;display:flex;gap:8px;">' +
      '<button type="button" class="btn-compact" style="flex:1;padding:8px;" data-action="open-feedback-modal">' +
        'Volver al Buzón' +
      '</button>' +
      '<button type="button" class="btn-solid-gold" style="flex:1;padding:8px;" data-action="close-feedback-modal">' +
        'Cerrar' +
      '</button>' +
    '</div>';

  var modal = document.getElementById("feedbackModal");
  if(modal) modal.innerHTML = html;
  var overlay = document.getElementById("feedbackModalOverlay");
  if(overlay) overlay.classList.remove("hidden");
}

function feedbackModalClick(e){
  var pill = e.target.closest(".feedback-cat-pill");
  if(pill){
    var parent = pill.parentElement;
    parent.querySelectorAll(".feedback-cat-pill").forEach(function(b){ b.classList.remove("active"); });
    pill.classList.add("active");
    currentFeedbackCategory = pill.getAttribute("data-val") || "bug";
    return;
  }

  var btn = e.target.closest("[data-action]");
  if(!btn) return;
  var action = btn.getAttribute("data-action");

  if(action === "close-feedback-modal"){ closeModals(); return; }
  if(action === "open-feedback-modal"){ openFeedbackModal(); return; }
  if(action === "open-feedback-admin"){ openFeedbackAdminModal(); return; }
  if(action === "submit-feedback-report"){ submitFeedbackReport(); return; }

  if(action === "save-discord-webhook"){
    var urlInput = document.getElementById("inputDiscordWebhook");
    var urlVal = urlInput ? urlInput.value.trim() : "";
    setMasterDiscordWebhook(urlVal);
    showToast(urlVal ? "Webhook de Discord guardado con éxito 🎮" : "Webhook borrado.", "success");
    openFeedbackAdminModal();
    return;
  }

  if(action === "test-discord-ping"){
    var c = (typeof activeChar === "function") ? activeChar() : null;
    var testReport = buildFeedbackDiagnostic(
      "sugerencia",
      "Prueba de Alertas de Triage IA",
      "¡Hola! Este es un mensaje de prueba para verificar que recibes los reportes de tus jugadores directamente en tu servidor de Discord con el formato embebido y el análisis de la IA.",
      c ? c.name : "Sistema Krysalis"
    );
    testReport.aiTriage = generateAiTriageAnalysis(testReport);

    var webhook = getMasterDiscordWebhook();
    if(!webhook){
      showToast("Pega primero la URL de tu Webhook de Discord arriba.", "warning");
      return;
    }

    sendDiscordWebhookReport(testReport).then(function(res){
      if(res.success){
        showToast("¡Mensaje de prueba enviado a tu Discord! 🎮", "success");
      } else {
        showToast("Error al enviar a Discord. Comprueba la URL.", "error");
      }
    });
    return;
  }

  if(action === "copy-admin-reply"){
    var idx = parseInt(btn.getAttribute("data-idx"), 10);
    var r = (state.feedbackReports || [])[idx];
    if(r && r.aiTriage && r.aiTriage.suggestedReply){
      fallbackCopyText(r.aiTriage.suggestedReply);
    }
    return;
  }

  if(action === "resend-admin-discord"){
    var rIdx = parseInt(btn.getAttribute("data-idx"), 10);
    var targetR = (state.feedbackReports || [])[rIdx];
    if(targetR){
      sendDiscordWebhookReport(targetR).then(function(res){
        if(res.success){
          showToast("Enviado a Discord 🎮", "success");
        } else {
          showToast("Pega tu Webhook de Discord arriba para activarlo.", "warning");
        }
      });
    }
    return;
  }

  if(action === "clear-all-feedback"){
    if(confirm("¿Seguro que quieres vaciar la lista local de reportes?")){
      state.feedbackReports = [];
      saveState(false);
      openFeedbackAdminModal();
      showToast("Historial local vaciado.", "info");
    }
    return;
  }
}

function fallbackCopyText(text){
  try {
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){
        showToast("Copiado al portapapeles 📋", "success");
      }).catch(function(){
        execCommandCopy(text);
      });
    } else {
      execCommandCopy(text);
    }
  } catch(err){
    execCommandCopy(text);
  }
}

function execCommandCopy(text){
  try {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    showToast("Copiado al portapapeles 📋", "success");
  } catch(e){
    showToast("No se pudo copiar automáticamente.", "warning");
  }
}



