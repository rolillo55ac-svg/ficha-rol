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
    html += '<div class="data-modal-user-box">'+
      '<div class="data-modal-user-info">'+
        '<div class="data-modal-user-label">Conectado como</div>'+
        '<div class="data-modal-user-email">'+esc(currentUser.email)+' <span class="data-modal-user-role">('+ (currentRole === 'gm' ? 'Máster' : 'Jugador') +')</span></div>'+
      '</div>'+
      '<button class="btn-compact data-modal-logout-btn" data-action="auth-logout">Cerrar sesión</button>'+
    '</div>';
  } else {
    html += '<div style="font-size:0.8rem;color:var(--ink-dim);margin-bottom:10px;">Inicia sesión con tu cuenta para guardar y sincronizar tu personaje:</div>'+
      '<div class="field"><label>Email</label><input type="email" id="authEmail" placeholder="tu-correo@gmail.com"></div>'+
      '<div class="field" style="margin-top:8px;"><label>Contraseña</label><input type="password" id="authPass" placeholder="••••••••"></div>'+
      '<div class="data-modal-auth-actions">'+
        '<button class="btn-solid-gold data-modal-btn" data-action="auth-login">Entrar</button>'+
        '<button class="btn-compact data-modal-btn" data-action="auth-signup">Crear cuenta</button>'+
      '</div>';
  }

  // === MONITOR DE ALMACENAMIENTO Y VERSIÓN UNIFICADO ===
  var local = typeof getLocalStorageUsage === "function" ? getLocalStorageUsage() : { pct: 0, usedStr: "0 B", totalStr: "5.0 MB", freeStr: "5.0 MB" };
  var localPillClass = local.pct > 90 ? "critical" : (local.pct > 70 ? "warning" : "optimal");
  var curVerStr = (typeof APP_VERSION !== "undefined" ? APP_VERSION : "1.2.7");

  html += '<div class="storage-monitor-box">'+
    '<div class="storage-monitor-header">'+
      '<div class="storage-monitor-title"><span>📊</span> <span>Espacio y Versión</span></div>'+
      '<span class="storage-pill optimal" id="appVersionBadge">v' + curVerStr + '</span>'+
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
              '<button class="btn-compact highlight data-modal-btn" data-action="migrate-local-images" style="font-size:0.72rem;background:var(--gold);color:#120D0A;font-weight:700;padding:6px 8px;width:100%;">🚀 Migrar fotos a Supabase (Liberar espacio)</button>'+
            '</div>' : ''
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
    // Control Unificado de Actualización y Limpieza de Caché
    '<div style="margin-top:12px;border-top:1px dashed var(--line);padding-top:10px;">'+
      '<button class="btn-solid-gold data-modal-btn" style="width:100%;padding:9px 12px;font-size:0.82rem;font-weight:700;" data-action="unified-app-update-cache" title="Comprueba si hay una nueva versión, purga cachés de navegadores/PWA y recarga limpiamente">'+
        '<span>🚀 Actualizar y Limpiar Caché</span>'+
      '</button>'+
      '<div id="versionCheckResult" style="font-size:0.7rem;color:var(--ink-faint);margin-top:5px;text-align:center;word-break:break-word;">'+
        '✓ Versión v' + curVerStr + ' sincronizada · Pulsa para forzar recarga limpia'+
      '</div>'+
      (isGM() ? 
        '<button class="btn-compact data-modal-btn" style="width:100%;margin-top:8px;padding:8px;border-color:rgba(88,101,242,0.5);color:#8EA1E1;font-size:0.75rem;background:rgba(88,101,242,0.12);" data-action="broadcast-force-update" title="Envía una señal en tiempo real a todos los jugadores conectados para forzarles a actualizar su versión y limpiar caché">'+
          '<span>📢 Forzar actualización a jugadores</span>'+
        '</button>' : '')+
    '</div>'+
  '</div>';

  html += '<div style="margin-top:16px;border-top:1px solid var(--line);padding-top:14px;">'+
    '<div style="font-size:0.82rem;font-weight:700;color:var(--gold-light);margin-bottom:8px;">💾 Guardar y restaurar partida</div>'+
    '<div class="data-modal-backup-grid">'+
      '<button class="btn-compact data-modal-btn" data-action="download-full-backup" title="Descargar un archivo JSON con todos los datos">Descargar copia (.json)</button>'+
      '<button class="btn-compact data-modal-btn" data-action="import-data" title="Cargar un archivo de copia anterior">Cargar copia</button>'+
    '</div>'+
    (isGM() ? '<button class="btn-compact btn-solid-gold data-modal-btn" style="width:100%;margin-top:8px;" data-action="cloud-backup-now">☁️ Guardar copia en la nube ahora</button>' : '')+
    '<button class="btn-compact highlight data-modal-btn" style="width:100%;margin-top:8px;background:rgba(176,141,87,0.18);border:1px solid var(--gold);color:var(--gold-light);font-weight:700;" data-action="repair-compendium-data" title="Verifica y recupera todas las misiones oficiales, criaturas del bestiario, armas y lore sin borrar tus datos">🛡️ Reparar compendio oficial (Misiones y Bestiario)</button>'+
    '<button class="btn-compact data-modal-btn" style="width:100%;margin-top:8px;border-color:rgba(212,175,55,0.4);" data-action="open-feedback-modal"><span>📬</span> <span>Buzón de Reportes y Sugerencias</span></button>'+
    '<div style="font-size:0.72rem;color:var(--ink-faint);margin-top:10px;line-height:1.4;">'+
      '💡 <i>Descárgate una copia de vez en cuando para tenerla guardada en tu Drive o en el móvil. Si pasa algo raro con la web, pásale el archivo al Administrador (rolillo55ac@gmail.com).</i>'+
    '</div>'+
    '<button class="btn-solid-gold data-modal-btn" style="width:100%;margin-top:12px;" data-action="reset-all-characters">↻ Restablecer personajes oficiales (PDF)</button>'+
  '</div>';

  document.getElementById("dataModal").innerHTML = html;
  document.getElementById("dataModalOverlay").classList.remove("hidden");

  setTimeout(function(){
    updateStorageStatsUI(false);
    if(typeof checkForAppUpdates === "function") checkForAppUpdates(false);
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
  if(action==="unified-app-update-cache"){ executeUnifiedAppUpdate(true); return; }
  if(action==="broadcast-force-update"){ broadcastForceAppUpdate(); return; }
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

// Sistema de reportes y tickets
var DEFAULT_DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1547672027035472003/8soKhpr6HxuSSvJDOhwsDxrhn5Sqgn8rRRPEpyxfQQDSYMnklfLOam6vO7sop4qMHcIM";
var currentFeedbackCategory = "bug";
var currentFeedbackTab = "new"; // "new" | "my_tickets"
var adminFeedbackFilter = "all"; // "all" | "pending" | "in_progress" | "resolved"
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

function generateTicketCode(){
  var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  var code = "";
  for(var i=0; i<4; i++){
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return "TK-" + code;
}

function getCategoryLabel(cat){
  var catIcons = {
    bug: "🐛 Error / Bug",
    sugerencia: "💡 Sugerencia",
    balance: "⚖️ Reglas / Balance",
    otro: "💬 Consulta / Otro"
  };
  return catIcons[cat] || cat || "Incidencia";
}

function getPlayerTickets(){
  try {
    return JSON.parse(localStorage.getItem("krysalis_player_tickets") || "[]");
  } catch(e){
    return [];
  }
}

function savePlayerTickets(tickets){
  try {
    localStorage.setItem("krysalis_player_tickets", JSON.stringify(tickets.slice(0, 50)));
  } catch(e){}
}

function handleRemoteTicketReply(data){
  if(!data || (!data.id && !data.ticketCode)) return;
  var myTickets = getPlayerTickets();
  var changed = false;
  myTickets.forEach(function(t){
    if(t.id === data.id || (data.ticketCode && t.ticketCode === data.ticketCode)){
      t.status = data.status || "resolved";
      var incomingReply = (data.adminReply !== undefined && data.adminReply !== null) ? String(data.adminReply).trim() : "";
      if(incomingReply && incomingReply !== (t.adminReply || "").trim()){
        t.adminReply = data.adminReply;
        t.readReply = false;
        changed = true;
      }
      var newResolved = data.resolvedAt || new Date().toISOString();
      if(newResolved !== t.resolvedAt){
        t.resolvedAt = newResolved;
        changed = true;
      }
    }
  });
  if(changed){
    savePlayerTickets(myTickets);
    if(typeof renderTopbar === "function") renderTopbar();
    showToast("📬 ¡El Administrador ha respondido a tu reporte #" + (data.ticketCode || "") + "!", "success");
    var modal = document.getElementById("feedbackModal");
    var overlay = document.getElementById("feedbackModalOverlay");
    if(overlay && !overlay.classList.contains("hidden") && modal && modal.getAttribute("data-mode") === "player" && currentFeedbackTab === "my_tickets"){
      openFeedbackModal("my_tickets", null, null, true);
    }
  }
}
window.handleRemoteTicketReply = handleRemoteTicketReply;

function handleRemoteNewTicket(data){
  if(!data || !data.id) return;
  state.feedbackReports = state.feedbackReports || [];
  if(!state.feedbackReports.some(function(x){ return x.id === data.id; })){
    state.feedbackReports.unshift(data);
    if(state.feedbackReports.length > 50) state.feedbackReports.pop();
    saveState(false);
    if(isGM()){
      showToast("🔔 Nuevo ticket recibido: #" + (data.ticketCode || data.title), "info");
      var modal = document.getElementById("feedbackModal");
      var overlay = document.getElementById("feedbackModalOverlay");
      if(overlay && !overlay.classList.contains("hidden") && modal && modal.getAttribute("data-mode") === "admin"){
        openFeedbackAdminModal(adminFeedbackFilter);
      }
    }
  }
}
window.handleRemoteNewTicket = handleRemoteNewTicket;

var isSyncingPlayerTickets = false;

async function syncPlayerTicketsWithSupabase(skipModalRefresh){
  if(isSyncingPlayerTickets) return getPlayerTickets();
  var tickets = getPlayerTickets();
  if(!tickets.length) return tickets;
  if(typeof supabaseClient === "undefined" || !supabaseClient || !navigator.onLine) return tickets;

  isSyncingPlayerTickets = true;
  var changed = false;
  var hadNewReply = false;

  try {
    // Canal 1: campaign_map ('app_feedback_sync') - Accesible con lectura 100% pública para todos los jugadores
    try {
      var cmRes = await supabaseClient.from("campaign_map").select("data").eq("id", "app_feedback_sync").maybeSingle();
      if(cmRes && cmRes.data && cmRes.data.data && cmRes.data.data.tickets){
        var syncTickets = cmRes.data.data.tickets;
        tickets.forEach(function(t){
          var match = syncTickets[t.id] || Object.values(syncTickets).find(function(x){
            return x.ticketCode && x.ticketCode === t.ticketCode;
          });
          if(match){
            var curStatus = t.status || "pending";
            var inStatus = match.status || curStatus;
            if(inStatus !== curStatus){ t.status = inStatus; changed = true; }

            var curReply = (t.adminReply || "").trim();
            var inReply = (match.adminReply || "").trim();
            if(inReply !== curReply){
              t.adminReply = match.adminReply || "";
              changed = true;
              if(inReply.length > 0 && inReply !== curReply){
                t.readReply = false;
                hadNewReply = true;
              }
            }

            var curResolved = t.resolvedAt || null;
            var inResolved = match.resolvedAt || null;
            if(inResolved && inResolved !== curResolved){
              t.resolvedAt = inResolved;
              changed = true;
            }
          }
        });
      }
    } catch(e1){}

    // Canal 2: Tabla dedicada app_feedback (cuando se ejecuta la migración 011 en Supabase)
    try {
      var ids = tickets.map(function(t){ return t.id; }).filter(Boolean);
      if(ids.length){
        var res = await supabaseClient.from("app_feedback").select("id, status, admin_reply, resolved_at").in("id", ids);
        if(res && res.data && res.data.length){
          var map = {};
          res.data.forEach(function(row){ map[row.id] = row; });
          tickets.forEach(function(t){
            if(map[t.id]){
              var row = map[t.id];
              var curStatus = t.status || "pending";
              var inStatus = row.status || curStatus;
              if(inStatus !== curStatus){ t.status = inStatus; changed = true; }

              var curReply = (t.adminReply || "").trim();
              var inReply = (row.admin_reply || "").trim();
              if(inReply !== curReply){
                t.adminReply = row.admin_reply || "";
                changed = true;
                if(inReply.length > 0 && inReply !== curReply){
                  t.readReply = false;
                  hadNewReply = true;
                }
              }

              var curResolved = t.resolvedAt || null;
              var inResolved = row.resolved_at || null;
              if(inResolved && inResolved !== curResolved){
                t.resolvedAt = inResolved;
                changed = true;
              }
            }
          });
        }
      }
    } catch(e2){}

    if(changed){
      savePlayerTickets(tickets);
      if(typeof renderTopbar === "function") renderTopbar();
      if(hadNewReply){
        showToast("📬 Tienes una nueva respuesta del Administrador en tus reportes", "info");
      }
      if(!skipModalRefresh){
        var modal = document.getElementById("feedbackModal");
        var overlay = document.getElementById("feedbackModalOverlay");
        if(overlay && !overlay.classList.contains("hidden") && modal && modal.getAttribute("data-mode") === "player" && currentFeedbackTab === "my_tickets"){
          openFeedbackModal("my_tickets", null, null, true);
        }
      }
    }
  } finally {
    isSyncingPlayerTickets = false;
  }
  return tickets;
}

var isSyncingAdminTickets = false;

async function syncAdminTicketsWithSupabase(){
  if(isSyncingAdminTickets) return state.feedbackReports || [];
  if(typeof supabaseClient === "undefined" || !supabaseClient || !navigator.onLine) return state.feedbackReports || [];
  isSyncingAdminTickets = true;
  try {
    // 1. Cargar respuestas y estados desde campaign_map ('app_feedback_sync')
    var cmRes = await supabaseClient.from("campaign_map").select("data").eq("id", "app_feedback_sync").maybeSingle();
    if(cmRes && cmRes.data && cmRes.data.data && cmRes.data.data.tickets){
      var syncTickets = cmRes.data.data.tickets;
      state.feedbackReports = state.feedbackReports || [];
      var changed = false;
      Object.keys(syncTickets).forEach(function(k){
        var st = syncTickets[k];
        var local = state.feedbackReports.find(function(x){ return x.id === st.id || (st.ticketCode && x.ticketCode === st.ticketCode); });
        if(local){
          if(st.status && st.status !== local.status){ local.status = st.status; changed = true; }
          if(st.adminReply && st.adminReply !== local.adminReply){ local.adminReply = st.adminReply; changed = true; }
          if(st.resolvedAt && st.resolvedAt !== local.resolvedAt){ local.resolvedAt = st.resolvedAt; changed = true; }
        }
      });
      if(changed) saveState(false);
    }

    // 2. Cargar reportes de la tabla app_feedback si existe
    var res = await supabaseClient.from("app_feedback").select("*").order("created_at", { ascending: false }).limit(50);
    if(res && res.data && res.data.length){
      var cloudReports = res.data.map(function(row){
        return {
          id: row.id,
          ticketCode: row.ticket_code || ("TK-" + row.id.slice(-4).toUpperCase()),
          category: row.category,
          categoryLabel: getCategoryLabel(row.category),
          title: row.title,
          description: row.description,
          contact: row.contact,
          character: row.character_name ? { name: row.character_name } : null,
          system: row.system_metadata || {},
          aiTriage: row.ai_triage || {},
          status: row.status || "pending",
          adminReply: row.admin_reply || "",
          resolvedAt: row.resolved_at || null,
          timestamp: row.created_at,
          displayDate: new Date(row.created_at).toLocaleString()
        };
      });

      var map = {};
      cloudReports.forEach(function(cr){ map[cr.id] = cr; });
      (state.feedbackReports || []).forEach(function(lr){
        if(!map[lr.id]) cloudReports.push(lr);
      });

      var prevSig = (state.feedbackReports || []).map(function(x){ return x.id + ':' + x.status + ':' + (x.adminReply || '') + ':' + (x.resolvedAt || ''); }).join('|');
      var nextSig = cloudReports.map(function(x){ return x.id + ':' + x.status + ':' + (x.adminReply || '') + ':' + (x.resolvedAt || ''); }).join('|');

      if(prevSig !== nextSig){
        state.feedbackReports = cloudReports;
        saveState(false);

        var modal = document.getElementById("feedbackModal");
        var overlay = document.getElementById("feedbackModalOverlay");
        if(overlay && !overlay.classList.contains("hidden") && modal && modal.getAttribute("data-mode") === "admin"){
          openFeedbackAdminModal(adminFeedbackFilter);
        }
      }
    }
  } catch(e){
  } finally {
    isSyncingAdminTickets = false;
  }
  return state.feedbackReports || [];
}

function openFeedbackModal(activeTab, prefilledCategory, prefilledTitle, skipSync){
  var myTickets = getPlayerTickets();
  var hasUnreadReply = myTickets.some(function(t){ return t.adminReply && !t.readReply; });

  if(!activeTab){
    if(hasUnreadReply || (myTickets.length > 0 && currentFeedbackTab === "my_tickets")){
      currentFeedbackTab = "my_tickets";
    } else {
      currentFeedbackTab = currentFeedbackTab || "new";
    }
  } else {
    currentFeedbackTab = activeTab;
  }
  if(prefilledCategory) currentFeedbackCategory = prefilledCategory;

  // Si se abre la pestaña de Mis Reportes, marcar respuestas como leídas para limpiar el indicador
  if(currentFeedbackTab === "my_tickets"){
    var markedAny = false;
    myTickets.forEach(function(t){
      if(t.adminReply && !t.readReply){
        t.readReply = true;
        markedAny = true;
      }
    });
    if(markedAny){
      savePlayerTickets(myTickets);
      if(typeof renderTopbar === "function") renderTopbar();
    }
  }

  var c = (typeof activeChar === "function") ? activeChar() : null;
  var userEmail = (typeof currentUser !== "undefined" && currentUser && currentUser.email) ? currentUser.email : "";
  var defaultContact = c ? (c.name + (userEmail ? " (" + userEmail + ")" : "")) : userEmail;

  var hasNewReply = myTickets.some(function(t){ return t.adminReply && t.status === "resolved"; });

  var gmPanelBtn = isGM() ? 
    '<button type="button" class="btn-compact feedback-gm-panel-btn" data-action="open-feedback-admin">' +
      '🎮 Panel de Administración: Gestionar tickets' +
    '</button>' : '';

  var tabsHeader = '<div class="feedback-nav-tabs">' +
    '<button type="button" class="feedback-nav-tab ' + (currentFeedbackTab === "new" ? "active" : "") + '" data-action="switch-feedback-tab" data-tab="new">' +
      '<span>📝 Nuevo Reporte</span>' +
    '</button>' +
    '<button type="button" class="feedback-nav-tab ' + (currentFeedbackTab === "my_tickets" ? "active" : "") + '" data-action="switch-feedback-tab" data-tab="my_tickets">' +
      '<span>📬 Mis Reportes ' + (hasNewReply ? '<span class="feedback-badge-dot" title="Tienes respuestas nuevas"></span>' : '') + ' (' + myTickets.length + ')</span>' +
    '</button>' +
  '</div>';

  var contentHtml = '';

  if(currentFeedbackTab === "new"){
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

    contentHtml = '<p class="feedback-subtitle">Envía cualquier incidencia o sugerencia para que el Administrador pueda revisarla.</p>' +
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
        '🔒 <b>100% Privado y Directo:</b> Tu reporte generará un ticket con código único. El Administrador te responderá directamente en la pestaña <b>"Mis Reportes"</b>.' +
      '</div>' +

      '<div class="feedback-actions" style="margin-top:14px;display:flex;flex-direction:column;gap:8px;">' +
        '<button type="button" class="btn-solid-gold feedback-submit-btn" id="btnSubmitFeedback" data-action="submit-feedback-report">' +
          '🚀 Enviar Reporte al Administrador' +
        '</button>' +
        '<button type="button" class="btn-compact" style="width:100%;padding:8px;font-size:0.8rem;" data-action="close-feedback-modal">' +
          'Cancelar' +
        '</button>' +
      '</div>';
  } else {
    // Vista "Mis Reportes y Respuestas"
    if(!myTickets.length){
      contentHtml = '<div style="text-align:center;padding:30px 16px;color:var(--ink-faint);line-height:1.5;">' +
        '<div style="font-size:2.2rem;margin-bottom:8px;">📭</div>' +
        '<div style="font-weight:700;font-size:0.95rem;color:var(--ink);margin-bottom:6px;">No tienes reportes enviados aún</div>' +
        '<p style="font-size:0.82rem;margin:0 0 16px;">Cualquier duda, error o sugerencia que envíes aparecerá aquí junto a la respuesta oficial del Administrador.</p>' +
        '<button type="button" class="btn-solid-gold" style="padding:8px 16px;font-size:0.85rem;" data-action="switch-feedback-tab" data-tab="new">' +
          '📝 Enviar mi primer reporte' +
        '</button>' +
      '</div>';
    } else {
      var ticketCards = myTickets.map(function(t){
        var st = t.status || "pending";
        var statusBadge = '';
        if(st === "resolved"){
          statusBadge = '<span class="ticket-badge resolved">🟢 Resuelto</span>';
        } else if(st === "in_progress"){
          statusBadge = '<span class="ticket-badge in_progress">🔵 En proceso</span>';
        } else {
          statusBadge = '<span class="ticket-badge pending">🟡 En revisión</span>';
        }

        var replyBlock = '';
        if(t.adminReply){
          replyBlock = '<div class="player-reply-box">' +
            '<div class="player-reply-header">🛡️ Respuesta Oficial del Administrador:</div>' +
            '<div class="player-reply-body">' + esc(t.adminReply) + '</div>' +
            (t.resolvedAt ? '<div style="font-size:0.68rem;color:var(--ink-faint);margin-top:6px;text-align:right;">Respondido el ' + esc(new Date(t.resolvedAt).toLocaleString()) + '</div>' : '') +
          '</div>';
        } else {
          replyBlock = '<div style="margin-top:8px;font-size:0.75rem;color:var(--ink-faint);background:rgba(0,0,0,0.25);border-radius:4px;padding:6px 8px;border-left:2px solid var(--line);">' +
            (st === "in_progress" ? '🔵 El Administrador está trabajando en solucionar esta incidencia.' : '⏳ En cola de revisión. El Administrador te responderá aquí tan pronto lo evalúe.') +
          '</div>';
        }

        return '<div class="player-ticket-card">' +
          '<div class="player-ticket-header-row">' +
            '<div style="min-width:0;flex:1 1 auto;">' +
              '<span class="ticket-code-tag">#' + esc(t.ticketCode || "TK-0000") + '</span> ' +
              '<span style="font-size:0.7rem;color:var(--ink-faint);margin-left:4px;">' + esc(t.displayDate || (t.timestamp ? new Date(t.timestamp).toLocaleDateString() : "")) + '</span>' +
              '<div style="font-weight:700;font-size:0.88rem;color:var(--ink);margin-top:4px;word-break:break-word;">' + esc(t.title) + '</div>' +
            '</div>' +
            statusBadge +
          '</div>' +
          '<div style="font-size:0.76rem;color:var(--ink-dim);line-height:1.4;background:rgba(255,255,255,0.02);padding:6px 8px;border-radius:4px;word-break:break-word;">' +
            esc(t.description) +
          '</div>' +
          replyBlock +
        '</div>';
      }).join('');

      contentHtml = '<div style="max-height:360px;overflow-y:auto;padding-right:4px;">' + ticketCards + '</div>' +
        '<div style="margin-top:12px;display:flex;gap:8px;">' +
          '<button type="button" class="btn-solid-gold" style="flex:1;padding:8px;" data-action="switch-feedback-tab" data-tab="new">+ Nuevo Reporte</button>' +
          '<button type="button" class="btn-compact" style="flex:1;padding:8px;" data-action="close-feedback-modal">Cerrar</button>' +
        '</div>';
    }
  }

  var html = '<h2>📬 Buzón de Reportes y Sugerencias<button data-action="close-feedback-modal" aria-label="Cerrar">&times;</button></h2>' +
    gmPanelBtn +
    tabsHeader +
    contentHtml;

  var modal = document.getElementById("feedbackModal");
  if(modal){
    modal.setAttribute("data-mode", "player");
    modal.innerHTML = html;
  }
  var overlay = document.getElementById("feedbackModalOverlay");
  if(overlay) overlay.classList.remove("hidden");

  if(!skipSync){
    syncPlayerTicketsWithSupabase(true);
  }
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
  var ticketCode = generateTicketCode();

  return {
    id: (typeof uid === "function") ? uid() : ("fb_" + Date.now()),
    ticketCode: ticketCode,
    timestamp: now.toISOString(),
    displayDate: now.toLocaleString(),
    category: cat,
    categoryLabel: getCategoryLabel(cat),
    title: title.trim(),
    description: desc.trim(),
    contact: contact.trim() || (c ? c.name : "Anónimo"),
    character: charStats,
    recentRolls: recentRolls,
    status: "pending",
    adminReply: "",
    resolvedAt: null,
    system: {
      appVersion: "v" + (typeof APP_VERSION !== "undefined" ? APP_VERSION : "1.2.2") + " (" + (typeof APP_BUILD !== "undefined" ? APP_BUILD : "Build") + ")",
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
      classification = "Posible Incidencia de Interfaz";
      diagnostic = "Reporte sobre comportamiento inesperado en la interfaz. Dispositivo: " + report.system.os + " (" + report.system.browser + ", " + report.system.screen + ").";
      suggestedReply = "¡Hola " + report.contact + "! Gracias por avisarnos de '" + report.title + "'. Ya tenemos el aviso y lo revisaremos en la próxima actualización.";
      technicalAction = "Revisar componente reportado en 1.0v.";
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
    console.log("Discord Webhook no configurado.");
    return { success: false, reason: "no_webhook" };
  }

  var triage = report.aiTriage || {};
  var c = report.character;

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

  var ticketTag = report.ticketCode ? ("#" + report.ticketCode) : "TICKET";

  var payload = {
    username: "Rol Krysalis • Soporte",
    avatar_url: "https://rolillo55ac-svg.github.io/ficha-rol/images/icon-192.png",
    embeds: [
      {
        title: "[" + ticketTag + "] " + report.categoryLabel + ": " + report.title,
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
            name: "🔬 Análisis del Sistema",
            value: "**Clasificación:** *" + triage.classification + "*\n" + triage.diagnostic,
            inline: false
          },
          {
            name: "🛡️ Seguridad",
            value: triage.isSecuritySafe ? "✅ Verificada (Sin riesgos)" : "⚠️ Alerta de sanitización",
            inline: true
          },
          {
            name: "🛠️ Acción Recomendada",
            value: triage.technicalAction || "Ninguna acción de código requerida.",
            inline: true
          },
          {
            name: "📋 Referencia",
            value: "`" + ticketTag + ": " + report.title + "`",
            inline: false
          },
          {
            name: "💬 Plantilla de respuesta",
            value: "```\n" + (triage.suggestedReply || "Sin respuesta sugerida.") + "\n```",
            inline: false
          }
        ],
        footer: {
          text: "Krysalis Rol • " + ticketTag + " • Estado: 🟡 Pendiente • " + report.displayDate
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

async function sendDiscordWebhookReply(ticket, replyText){
  var webhookUrl = getMasterDiscordWebhook();
  if(!webhookUrl) return;
  var ticketTag = ticket.ticketCode ? ("#" + ticket.ticketCode) : ("#" + (ticket.id ? ticket.id.slice(-4).toUpperCase() : "TK"));
  var payload = {
    username: "Krysalis • Panel de Administración",
    avatar_url: "https://rolillo55ac-svg.github.io/ficha-rol/images/icon-192.png",
    embeds: [{
      title: "🛡️ Respuesta Enviada al Jugador [" + ticketTag + "]",
      description: "**Asunto:** " + (ticket.title || "Incidencia") + "\n\n**💬 Respuesta Oficial del Administrador:**\n> " + String(replyText).split("\n").join("\n> "),
      color: 0x10B981,
      fields: [
        { name: "👤 Destinatario", value: String(ticket.contact || (ticket.character && ticket.character.name) || "Jugador"), inline: true },
        { name: "📊 Estado", value: "🟢 Resuelto / Respondido", inline: true }
      ],
      footer: { text: "Krysalis Rol • " + ticketTag + " • " + new Date().toLocaleString() }
    }]
  };
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch(e){}
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
    btn.innerHTML = '<span>⏳</span> Enviando reporte...';
  }

  var report = buildFeedbackDiagnostic(currentFeedbackCategory, title, desc, contact);
  var aiTriage = generateAiTriageAnalysis(report);
  report.aiTriage = aiTriage;
  lastGeneratedReport = report;

  var playerTickets = getPlayerTickets();
  playerTickets.unshift(report);
  savePlayerTickets(playerTickets);

  state.feedbackReports = state.feedbackReports || [];
  state.feedbackReports.unshift(report);
  if(state.feedbackReports.length > 50) state.feedbackReports.pop();
  saveState(false);

  // Broadcast WebSockets inmediato para que el Admin lo reciba si está en la app
  if(typeof realtimeChannel !== "undefined" && realtimeChannel && typeof realtimeChannel.send === "function"){
    try {
      realtimeChannel.send({
        type: "broadcast",
        event: "new_ticket_report",
        payload: report
      });
    } catch(eBc){}
  }

  if(typeof supabaseClient !== "undefined" && supabaseClient && navigator.onLine){
    try {
      supabaseClient.from("app_feedback").insert([{
        id: report.id,
        ticket_code: report.ticketCode,
        category: report.category,
        title: report.title,
        description: report.description,
        contact: report.contact,
        character_name: report.character ? report.character.name : null,
        system_metadata: report.system,
        ai_triage: report.aiTriage,
        status: "pending",
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
      '<div class="success-title">Ticket Registrado con Éxito</div>' +
      '<p class="success-text">Tu reporte ha sido remitido al Administrador con los detalles de tu partida.</p>' +
    '</div>' +

    '<div style="background:rgba(0,0,0,0.35);border:1px solid var(--line);border-radius:8px;padding:12px;margin-bottom:14px;font-size:0.8rem;color:var(--ink-dim);line-height:1.45;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
        '<span>🎫 <b>Ticket:</b></span>' +
        '<span class="ticket-code-tag">#' + esc(report.ticketCode) + '</span>' +
      '</div>' +
      '<div>📌 <b>Asunto:</b> ' + esc(report.title) + '</div>' +
      '<div style="margin-top:4px;">🏷️ <b>Categoría:</b> ' + esc(report.categoryLabel) + '</div>' +
      '<div style="margin-top:4px;color:var(--gold-light);">📌 <b>Estado:</b> <span class="ticket-badge pending">🟡 En revisión</span></div>' +
      '<div style="margin-top:8px;font-size:0.73rem;color:var(--ink-faint);border-top:1px dashed var(--line);padding-top:6px;">' +
        'El Administrador revisará tu reporte y te responderá directamente en la pestaña <b>"Mis Reportes y Respuestas"</b>.' +
      '</div>' +
    '</div>' +

    '<div style="display:flex;flex-direction:column;gap:8px;">' +
      '<button type="button" class="btn-solid-gold" style="width:100%;padding:10px 14px;font-size:0.9rem;" data-action="switch-feedback-tab" data-tab="my_tickets">' +
        '📬 Ver Mis Reportes y Respuestas' +
      '</button>' +
      '<button type="button" class="btn-compact" style="width:100%;padding:8px;font-size:0.8rem;" data-action="close-feedback-modal">' +
        'Cerrar' +
      '</button>' +
    '</div>';

  var modal = document.getElementById("feedbackModal");
  if(modal) modal.innerHTML = html;
  showToast("¡Ticket #" + report.ticketCode + " creado con éxito!", "success");
}

function openFeedbackAdminModal(filter){
  adminFeedbackFilter = filter || adminFeedbackFilter || "all";
  var reports = state.feedbackReports || [];

  var pendingCount = 0, inProgressCount = 0, resolvedCount = 0;
  reports.forEach(function(r){
    var st = r.status || "pending";
    if(st === "pending") pendingCount++;
    else if(st === "in_progress") inProgressCount++;
    else if(st === "resolved") resolvedCount++;
  });
  var allCount = reports.length;

  var filteredReports = reports.filter(function(r){
    var st = r.status || "pending";
    if(adminFeedbackFilter === "pending") return st === "pending";
    if(adminFeedbackFilter === "in_progress") return st === "in_progress";
    if(adminFeedbackFilter === "resolved") return st === "resolved";
    return true;
  });

  var filterPillsHtml = '<div class="admin-filter-bar">' +
    '<button type="button" class="admin-filter-pill ' + (adminFeedbackFilter === "all" ? "active" : "") + '" data-action="filter-admin-tickets" data-filter="all">Todos (' + allCount + ')</button>' +
    '<button type="button" class="admin-filter-pill ' + (adminFeedbackFilter === "pending" ? "active" : "") + '" data-action="filter-admin-tickets" data-filter="pending">🟡 Pendientes (' + pendingCount + ')</button>' +
    '<button type="button" class="admin-filter-pill ' + (adminFeedbackFilter === "in_progress" ? "active" : "") + '" data-action="filter-admin-tickets" data-filter="in_progress">🔵 En Proceso (' + inProgressCount + ')</button>' +
    '<button type="button" class="admin-filter-pill ' + (adminFeedbackFilter === "resolved" ? "active" : "") + '" data-action="filter-admin-tickets" data-filter="resolved">🟢 Resueltos (' + resolvedCount + ')</button>' +
  '</div>';

  var reportsListHtml = '';
  if(!filteredReports.length){
    reportsListHtml = '<div class="admin-empty-state">' +
      '<div style="font-size:2rem;margin-bottom:6px;">📭</div>' +
      '<div style="font-weight:600;color:var(--ink);">No hay tickets en esta categoría</div>' +
      '<div style="font-size:0.75rem;color:var(--ink-faint);margin-top:4px;">Los reportes enviados por los jugadores aparecerán aquí directamente.</div>' +
    '</div>';
  } else {
    reportsListHtml = filteredReports.map(function(r){
      var triage = r.aiTriage || {};
      var ticketTag = r.ticketCode ? ("#" + r.ticketCode) : ("#" + (r.id ? r.id.slice(-4).toUpperCase() : "TK"));
      var st = r.status || "pending";
      var contactName = r.contact || (r.character ? r.character.name : "Jugador");

      return '<div class="admin-ticket-card ' + (st === 'resolved' ? 'is-resolved' : '') + '">' +
        // Fila 1: Encabezado con Código, Categoría y Selector Segmentado de Estado
        '<div class="admin-ticket-header">' +
          '<div class="admin-ticket-meta">' +
            '<span class="ticket-code-tag">' + esc(ticketTag) + '</span>' +
            '<span class="ticket-cat-badge ' + esc(r.category || "otro") + '">' + esc(r.categoryLabel || r.category || "Reporte") + '</span>' +
            (triage.classification ? ('<span class="ticket-triage-badge">' + esc(triage.classification) + '</span>') : '') +
          '</div>' +
          '<div class="status-segmented-control">' +
            '<button type="button" class="seg-btn ' + (st === 'pending' ? 'active pending' : '') + '" data-action="set-ticket-status" data-id="' + esc(r.id) + '" data-status="pending" title="Marcar como Pendiente">🟡 Pendiente</button>' +
            '<button type="button" class="seg-btn ' + (st === 'in_progress' ? 'active in_progress' : '') + '" data-action="set-ticket-status" data-id="' + esc(r.id) + '" data-status="in_progress" title="Marcar En Proceso">🔵 En Proceso</button>' +
            '<button type="button" class="seg-btn ' + (st === 'resolved' ? 'active resolved' : '') + '" data-action="set-ticket-status" data-id="' + esc(r.id) + '" data-status="resolved" title="Marcar como Resuelto">🟢 Resuelto</button>' +
          '</div>' +
        '</div>' +

        // Fila 2: Título y Remitente
        '<div class="admin-ticket-title-row">' +
          '<h3 class="admin-ticket-title">' + esc(r.title) + '</h3>' +
          '<div class="admin-ticket-sender">Por <b>' + esc(contactName) + '</b> · ' + esc(r.displayDate || "") + '</div>' +
        '</div>' +

        // Fila 3: Mensaje del Jugador
        '<div class="admin-ticket-quote">' +
          '<span class="quote-icon">💬</span>' +
          '<div class="quote-text">' + esc(r.description) + '</div>' +
        '</div>' +

        // Fila 4: Detalles tecnicos
        '<details class="admin-ticket-accordion">' +
          '<summary class="admin-ticket-accordion-summary">' +
            '<span>🔬 Información Técnica</span>' +
            '<span class="accordion-hint">Detalles ▾</span>' +
          '</summary>' +
          '<div class="admin-ticket-accordion-body">' +
            '<div style="font-size:0.75rem;color:var(--ink-dim);line-height:1.4;margin-bottom:8px;">' +
              '<b>Detalle:</b> ' + esc(triage.diagnostic || "Sin análisis técnico.") +
            '</div>' +
            '<div class="admin-ticket-diag-row">' +
              '<span class="admin-ticket-diag-text">🛠️ ' + esc(triage.technicalAction || "Revisar componente reportado.") + '</span>' +
              '<button type="button" class="btn-compact" style="padding:4px 8px;font-size:0.68rem;border-color:rgba(88,101,242,0.5);color:#A5B4FC;white-space:nowrap;" data-action="copy-ticket-info" data-id="' + esc(r.id) + '">' +
                '📋 Copiar Resumen' +
              '</button>' +
            '</div>' +
          '</div>' +
        '</details>' +

        // Fila 5: Área de Respuesta al Jugador
        '<div class="admin-ticket-reply-section">' +
          '<div class="reply-section-header">' +
            '<span style="font-size:0.75rem;font-weight:700;color:var(--gold-light);">💬 Responder a ' + esc(contactName) + ':</span>' +
            (triage.suggestedReply ? '<button type="button" class="btn-text-gold" data-action="autofill-ai-reply" data-id="' + esc(r.id) + '">🪄 Cargar plantilla</button>' : '') +
          '</div>' +
          '<textarea id="admin_reply_text_' + esc(r.id) + '" rows="2" class="admin-reply-textarea" placeholder="Escribe la respuesta que verá el jugador en su app...">' + esc(r.adminReply || "") + '</textarea>' +
          '<div class="reply-section-actions">' +
            '<span style="font-size:0.7rem;color:var(--ink-faint);">' + 
              (r.resolvedAt ? ('✓ Respondido el ' + esc(new Date(r.resolvedAt).toLocaleDateString())) : 'Esperando respuesta') + 
            '</span>' +
            '<button type="button" class="btn-solid-gold" style="padding:7px 14px;font-size:0.78rem;font-weight:700;" data-action="save-admin-reply" data-id="' + esc(r.id) + '">' +
              '🚀 Guardar y Enviar' +
            '</button>' +
          '</div>' +
        '</div>' +

        // Fila 6: Botón discreto de eliminar
        '<div class="admin-ticket-footer">' +
          '<button type="button" class="btn-delete-subtle" data-action="delete-admin-ticket" data-id="' + esc(r.id) + '">' +
            '🗑️ Eliminar ticket' +
          '</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  var html = '<h2>🛡️ Gestión de Tickets de Administración<button data-action="close-feedback-modal" aria-label="Cerrar">&times;</button></h2>' +
    filterPillsHtml +
    '<div class="admin-tickets-container">' +
      reportsListHtml +
    '</div>' +
    '<div class="admin-modal-footer">' +
      '<button type="button" class="btn-compact" style="padding:8px 16px;" data-action="open-feedback-modal">Buzón de Jugador</button>' +
      '<button type="button" class="btn-solid-gold" style="padding:8px 20px;" data-action="close-feedback-modal">Cerrar</button>' +
    '</div>';

  var modal = document.getElementById("feedbackModal");
  if(modal){
    modal.setAttribute("data-mode", "admin");
    modal.innerHTML = html;
  }
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
  if(action === "open-feedback-admin"){ openFeedbackAdminModal(); syncAdminTicketsWithSupabase(); return; }
  if(action === "submit-feedback-report"){ submitFeedbackReport(); return; }

  if(action === "autofill-ai-reply"){
    var idAi = btn.getAttribute("data-id");
    var reportAi = (state.feedbackReports || []).find(function(x){ return x.id === idAi; });
    if(reportAi && reportAi.aiTriage && reportAi.aiTriage.suggestedReply){
      var txtEl = document.getElementById("admin_reply_text_" + idAi);
      if(txtEl){
        txtEl.value = reportAi.aiTriage.suggestedReply;
        txtEl.focus();
        showToast("Sugerencia de IA cargada en el campo 🪄", "info");
      }
    }
    return;
  }

  if(action === "switch-feedback-tab"){
    var tab = btn.getAttribute("data-tab") || "new";
    openFeedbackModal(tab);
    return;
  }

  if(action === "filter-admin-tickets"){
    var filter = btn.getAttribute("data-filter") || "all";
    openFeedbackAdminModal(filter);
    return;
  }

  if(action === "set-ticket-status"){
    var id = btn.getAttribute("data-id");
    var newStatus = btn.getAttribute("data-status") || "pending";
    var target = (state.feedbackReports || []).find(function(x){ return x.id === id; });
    if(target){
      target.status = newStatus;
      if(newStatus === "resolved" && !target.resolvedAt){
        target.resolvedAt = new Date().toISOString();
      }
      saveState(false);

      // 1. Broadcast WebSockets inmediato en tiempo real
      if(typeof realtimeChannel !== "undefined" && realtimeChannel && typeof realtimeChannel.send === "function"){
        try {
          realtimeChannel.send({
            type: "broadcast",
            event: "ticket_reply",
            payload: {
              id: id,
              ticketCode: target.ticketCode,
              adminReply: target.adminReply || "",
              status: newStatus,
              resolvedAt: target.resolvedAt
            }
          });
        } catch(eBc){}
      }

      // 2. Guardar en campaign_map ('app_feedback_sync') accesible por cualquier jugador sin login
      if(typeof supabaseClient !== "undefined" && supabaseClient && navigator.onLine){
        try {
          supabaseClient.from("campaign_map").select("data").eq("id", "app_feedback_sync").maybeSingle().then(function(cmRes){
            var existingTickets = (cmRes && cmRes.data && cmRes.data.data && cmRes.data.data.tickets) ? cmRes.data.data.tickets : {};
            existingTickets[id] = Object.assign(existingTickets[id] || {}, {
              id: id,
              ticketCode: target.ticketCode,
              status: newStatus,
              resolvedAt: target.resolvedAt
            });
            supabaseClient.from("campaign_map").upsert({
              id: "app_feedback_sync",
              data: { tickets: existingTickets, updated_at: new Date().toISOString() },
              markers: [],
              updated_at: new Date().toISOString()
            }).catch(function(){});
          }).catch(function(){});
        } catch(eCm){}

        // 3. Actualizar tabla dedicada app_feedback si existe
        supabaseClient.from("app_feedback").update({
          status: newStatus,
          resolved_at: target.resolvedAt
        }).eq("id", id).then(function(){}).catch(function(){});
      }

      var playerTickets = getPlayerTickets();
      playerTickets.forEach(function(pt){
        if(pt.id === id || (target.ticketCode && pt.ticketCode === target.ticketCode)){
          pt.status = newStatus;
          pt.resolvedAt = target.resolvedAt;
        }
      });
      savePlayerTickets(playerTickets);

      openFeedbackAdminModal();
      showToast("Estado actualizado a: " + newStatus, "info");
    }
    return;
  }

  if(action === "copy-ticket-info" || action === "copy-ai-prompt"){
    var idPrompt = btn.getAttribute("data-id");
    var targetP = (state.feedbackReports || []).find(function(x){ return x.id === idPrompt; });
    if(targetP){
      var triageP = targetP.aiTriage || {};
      var tagP = targetP.ticketCode ? ("#" + targetP.ticketCode) : ("#" + targetP.id);
      var promptText = "Incidencia " + tagP + ":\n" +
        "• Título: " + targetP.title + "\n" +
        "• Categoría: " + (targetP.categoryLabel || targetP.category) + "\n" +
        "• Remitente: " + (targetP.contact || "Jugador") + "\n" +
        "• Descripción: " + targetP.description + "\n" +
        "• Detalle técnico: " + (triageP.diagnostic || "Sin diagnóstico") + "\n" +
        "• Acción sugerida: " + (triageP.technicalAction || "Inspeccionar componente") + "\n" +
        "• Entorno: " + ((targetP.system && targetP.system.os) ? (targetP.system.os + " - " + targetP.system.browser) : "Navegador Web");
      fallbackCopyText(promptText);
      showToast("Información del ticket copiada 📋", "success");
    }
    return;
  }

  if(action === "autofill-ai-reply"){
    var idReply = btn.getAttribute("data-id");
    var targetR = (state.feedbackReports || []).find(function(x){ return x.id === idReply; });
    var textarea = document.getElementById("admin_reply_text_" + idReply);
    if(targetR && targetR.aiTriage && targetR.aiTriage.suggestedReply && textarea){
      textarea.value = targetR.aiTriage.suggestedReply;
      textarea.focus();
      showToast("Plantilla de respuesta cargada", "info");
    }
    return;
  }

  if(action === "save-admin-reply"){
    var idSave = btn.getAttribute("data-id");
    var textEl = document.getElementById("admin_reply_text_" + idSave);
    var replyText = textEl ? textEl.value.trim() : "";
    if(!replyText){
      showToast("Escribe una respuesta para el jugador antes de guardar.", "warning");
      if(textEl) textEl.focus();
      return;
    }

    var targetSave = (state.feedbackReports || []).find(function(x){ return x.id === idSave; });
    if(targetSave){
      var nowIso = new Date().toISOString();
      targetSave.adminReply = replyText;
      targetSave.status = "resolved";
      targetSave.resolvedAt = nowIso;
      saveState(false);

      // 1. Broadcast WebSockets inmediato en tiempo real
      if(typeof realtimeChannel !== "undefined" && realtimeChannel && typeof realtimeChannel.send === "function"){
        try {
          realtimeChannel.send({
            type: "broadcast",
            event: "ticket_reply",
            payload: {
              id: idSave,
              ticketCode: targetSave.ticketCode,
              adminReply: replyText,
              status: "resolved",
              resolvedAt: nowIso
            }
          });
        } catch(eBc){}
      }

      // 2. Guardar en campaign_map ('app_feedback_sync') accesible por TODOS los jugadores sin login
      if(typeof supabaseClient !== "undefined" && supabaseClient && navigator.onLine){
        try {
          supabaseClient.from("campaign_map").select("data").eq("id", "app_feedback_sync").maybeSingle().then(function(cmRes){
            var existingTickets = (cmRes && cmRes.data && cmRes.data.data && cmRes.data.data.tickets) ? cmRes.data.data.tickets : {};
            existingTickets[idSave] = {
              id: idSave,
              ticketCode: targetSave.ticketCode,
              adminReply: replyText,
              status: "resolved",
              resolvedAt: nowIso
            };
            supabaseClient.from("campaign_map").upsert({
              id: "app_feedback_sync",
              data: { tickets: existingTickets, updated_at: nowIso },
              markers: [],
              updated_at: nowIso
            }).catch(function(eUpsert){ console.warn("Aviso sync campaign_map feedback:", eUpsert); });
          }).catch(function(){});
        } catch(eCm){}

        // 3. Actualizar tabla dedicada app_feedback (si existe en Supabase)
        try {
          supabaseClient.from("app_feedback").update({
            admin_reply: replyText,
            status: "resolved",
            resolved_at: nowIso
          }).eq("id", idSave).then(function(res){
            if(res && res.error) console.warn("Supabase update app_feedback:", res.error.message);
          }).catch(function(){});
        } catch(eTb){}
      }

      var myTickets = getPlayerTickets();
      myTickets.forEach(function(pt){
        if(pt.id === idSave || (targetSave.ticketCode && pt.ticketCode === targetSave.ticketCode)){
          pt.adminReply = replyText;
          pt.status = "resolved";
          pt.resolvedAt = nowIso;
        }
      });
      savePlayerTickets(myTickets);
      sendDiscordWebhookReply(targetSave, replyText);

      openFeedbackAdminModal();
      showToast("¡Respuesta enviada al jugador y notificada 🟢!", "success");
    }
    return;
  }

  if(action === "copy-sql-migration"){
    var sqlMigrationText = "CREATE TABLE IF NOT EXISTS public.app_feedback (\n" +
      "    id TEXT PRIMARY KEY,\n" +
      "    ticket_code TEXT,\n" +
      "    category TEXT NOT NULL,\n" +
      "    title TEXT NOT NULL,\n" +
      "    description TEXT NOT NULL,\n" +
      "    contact TEXT,\n" +
      "    character_name TEXT,\n" +
      "    system_metadata JSONB,\n" +
      "    ai_triage JSONB,\n" +
      "    status TEXT DEFAULT 'pending',\n" +
      "    admin_reply TEXT,\n" +
      "    resolved_at TIMESTAMPTZ,\n" +
      "    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL\n" +
      ");\n\n" +
      "ALTER TABLE public.app_feedback ENABLE ROW LEVEL SECURITY;\n\n" +
      "DROP POLICY IF EXISTS \"Allow public insert to app_feedback\" ON public.app_feedback;\n" +
      "CREATE POLICY \"Allow public insert to app_feedback\" ON public.app_feedback FOR INSERT WITH CHECK (true);\n\n" +
      "DROP POLICY IF EXISTS \"Allow read app_feedback\" ON public.app_feedback;\n" +
      "CREATE POLICY \"Allow read app_feedback\" ON public.app_feedback FOR SELECT USING (true);\n\n" +
      "DROP POLICY IF EXISTS \"Allow update app_feedback\" ON public.app_feedback;\n" +
      "CREATE POLICY \"Allow update app_feedback\" ON public.app_feedback FOR UPDATE USING (true);";
    fallbackCopyText(sqlMigrationText);
    showToast("¡SQL de migración copiado! Pégalo en el SQL Editor de Supabase 📋", "success");
    return;
  }

  if(action === "delete-admin-ticket"){
    var idDel = btn.getAttribute("data-id");
    if(confirm("¿Seguro que deseas eliminar este ticket?")){
      state.feedbackReports = (state.feedbackReports || []).filter(function(x){ return x.id !== idDel; });
      saveState(false);

      if(typeof supabaseClient !== "undefined" && supabaseClient && navigator.onLine){
        supabaseClient.from("app_feedback").delete().eq("id", idDel).then(function(){}).catch(function(){});
      }

      openFeedbackAdminModal();
      showToast("Ticket eliminado.", "info");
    }
    return;
  }

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
      "Prueba de Notificaciones",
      "¡Hola! Este es un mensaje de prueba para verificar que recibes los reportes de tus jugadores directamente en tu servidor de Discord.",
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

  if(action === "resend-admin-discord"){
    var targetIdResend = btn.getAttribute("data-id");
    var targetR = (state.feedbackReports || []).find(function(x){ return x.id === targetIdResend; });
    if(targetR){
      sendDiscordWebhookReport(targetR).then(function(res){
        if(res.success){
          showToast("Enviado a Discord 🎮", "success");
        } else {
          showToast("Comprueba el Webhook de Discord arriba.", "warning");
        }
      });
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



