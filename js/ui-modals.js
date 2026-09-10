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
    '<button class="btn-compact" style="width:100%;margin-top:10px;padding:9px;border-color:rgba(212,175,55,0.4);display:flex;align-items:center;justify-content:center;gap:6px;" data-action="open-feedback-modal"><span>📬</span> <span>Buzón de Reportes y Sugerencias (WhatsApp)</span></button>'+
    '<div style="font-size:0.72rem;color:var(--ink-faint);margin-top:10px;line-height:1.4;">'+
      '💡 <i>Descárgate una copia de vez en cuando para tenerla guardada en tu Drive o en el móvil. Si pasa algo raro con la web, pásale el archivo a Lolo (rolillo55ac@gmail.com).</i>'+
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
// SISTEMA INTELIGENTE DE REPORTES, SUGERENCIAS Y WHATSAPP (+34 663632738)
// ==============================================================================
var FEEDBACK_WHATSAPP_PHONE = "34663632738";
var currentFeedbackCategory = "bug";
var lastGeneratedReport = null;

function openFeedbackModal(prefilledCategory, prefilledTitle){
  currentFeedbackCategory = prefilledCategory || "bug";
  var c = (typeof activeChar === "function") ? activeChar() : null;
  var userEmail = (typeof currentUser !== "undefined" && currentUser && currentUser.email) ? currentUser.email : "";
  var defaultContact = c ? (c.name + (userEmail ? " (" + userEmail + ")" : "")) : userEmail;
  var appVer = "v1.0.6";

  var catOptions = [
    { id: "bug", label: "🐛 Error / Bug", desc: "Algo falló o no responde" },
    { id: "sugerencia", label: "💡 Sugerencia", desc: "Idea o mejora" },
    { id: "balance", label: "⚖️ Reglas / Balance", desc: "Cálculo o habilidad" },
    { id: "otro", label: "💬 Consulta / Otro", desc: "Pregunta general" }
  ];

  var catPills = catOptions.map(function(cat){
    var active = (cat.id === currentFeedbackCategory) ? "active" : "";
    return '<button type="button" class="f-pill feedback-cat-pill ' + active + '" data-val="' + cat.id + '" title="' + cat.desc + '">' +
      '<span>' + cat.label + '</span>' +
    '</button>';
  }).join('');

  var netStatus = (navigator.onLine ? "En línea (Online)" : "Desconectado (Offline)");
  var charInfo = c ? (c.name + " (Nv. " + (c.level || 1) + ")") : "Sin personaje activo";
  var screenInfo = (window.innerWidth + "x" + window.innerHeight);

  var html = '<h2>📬 Buzón de Reportes y Sugerencias<button data-action="close-feedback-modal" aria-label="Cerrar">&times;</button></h2>' +
    '<p class="feedback-subtitle">Tu opinión ayuda a mejorar la app. Los reportes se procesan automáticamente con diagnóstico técnico para el desarrollador.</p>' +

    '<div class="field" style="margin-top:10px;">' +
      '<label style="display:block;margin-bottom:6px;">Tipo de Incidencia</label>' +
      '<div class="filter-pills feedback-cat-grid" id="feedbackCategoryPills">' + catPills + '</div>' +
    '</div>' +

    '<div class="field" style="margin-top:10px;">' +
      '<label for="fbTitle">Título o Asunto breve *</label>' +
      '<input type="text" id="fbTitle" placeholder="Ej: Error al tirar daño de arma, sugerencia de mapa..." value="' + (prefilledTitle ? esc(prefilledTitle) : "") + '" required>' +
    '</div>' +

    '<div class="field" style="margin-top:10px;">' +
      '<label for="fbDesc">Descripción detallada *</label>' +
      '<textarea id="fbDesc" rows="4" placeholder="Explica qué ocurrió, qué esperabas ver o cuál es tu sugerencia con el mayor detalle posible..." required></textarea>' +
    '</div>' +

    '<div class="field" style="margin-top:10px;">' +
      '<label for="fbContact">Tu Nombre / Personaje / Contacto (Opcional)</label>' +
      '<input type="text" id="fbContact" placeholder="Tu nombre, personaje o correo..." value="' + esc(defaultContact) + '">' +
    '</div>' +

    '<div class="feedback-diag-box">' +
      '<div class="feedback-diag-head">⚙️ Diagnóstico técnico adjunto (automático):</div>' +
      '<div class="feedback-diag-tags">' +
        '<span class="diag-tag">📦 App: ' + appVer + '</span>' +
        '<span class="diag-tag">📱 Pantalla: ' + screenInfo + '</span>' +
        '<span class="diag-tag">👤 PJ: ' + esc(charInfo) + '</span>' +
        '<span class="diag-tag">🌐 Red: ' + netStatus + '</span>' +
      '</div>' +
    '</div>' +

    '<div class="feedback-actions" style="margin-top:14px;display:flex;flex-direction:column;gap:8px;">' +
      '<button type="button" class="btn-solid-gold" style="width:100%;padding:11px 14px;font-size:0.92rem;font-weight:700;" data-action="submit-feedback-report">' +
        '🚀 Generar y Enviar Reporte' +
      '</button>' +
      '<div style="display:flex;gap:8px;">' +
        '<button type="button" class="btn-compact" style="flex:1;padding:8px;font-size:0.78rem;" data-action="test-feedback-whatsapp">' +
          '🧪 Probar WhatsApp (+34 663632738)' +
        '</button>' +
        '<button type="button" class="btn-compact" style="flex:1;padding:8px;font-size:0.78rem;" data-action="close-feedback-modal">' +
          'Cancelar' +
        '</button>' +
      '</div>' +
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

  var now = new Date();
  var report = {
    id: (typeof uid === "function") ? uid() : ("fb_" + Date.now()),
    timestamp: now.toISOString(),
    displayDate: now.toLocaleString(),
    category: cat,
    categoryLabel: catIcons[cat] || cat,
    title: title.trim(),
    description: desc.trim(),
    contact: contact.trim() || "Anónimo",
    character: c ? { id: c.id, name: c.name, level: c.level || 1 } : null,
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

  var waMessage = 
    "📬 *REPORTE DE FICHA ROL*\n" +
    "─────────────────────\n" +
    "🏷️ *Tipo:* " + report.categoryLabel + "\n" +
    "📌 *Asunto:* " + report.title + "\n" +
    "👤 *Remitente:* " + report.contact + "\n\n" +
    "📝 *Descripción:*\n" + report.description + "\n\n" +
    "⚙️ *Diagnóstico Técnico:*\n" +
    "• App: " + report.system.appVersion + (report.system.isPWA ? " (PWA)" : " (Web)") + "\n" +
    "• Dispositivo: " + report.system.os + " | " + report.system.browser + " (" + report.system.screen + ")\n" +
    "• Personaje: " + (report.character ? report.character.name + " (Nv. " + (report.character.level || 1) + ")" : "Ninguno") + "\n" +
    "• Conexión: " + report.system.network + " (" + report.system.syncStatus + ")\n" +
    "• Fecha: " + report.displayDate + "\n" +
    "─────────────────────\n" +
    "🤖 *[TRIAGE ANTIGRAVITY]*\n" +
    "Analiza este reporte: evalúa veracidad, ciberseguridad, respuesta al usuario y código a implementar.";

  report.formattedMessage = waMessage;
  report.whatsappUrl = "https://wa.me/" + FEEDBACK_WHATSAPP_PHONE + "?text=" + encodeURIComponent(waMessage);

  return report;
}

function submitFeedbackReport(){
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
    showToast("Por favor, describe el problema o sugerencia.", "warning");
    if(descEl) descEl.focus();
    return;
  }

  var report = buildFeedbackDiagnostic(currentFeedbackCategory, title, desc, contact);
  lastGeneratedReport = report;

  // 1. Guardar en estado local
  state.feedbackReports = state.feedbackReports || [];
  state.feedbackReports.unshift(report);
  if(state.feedbackReports.length > 50) state.feedbackReports.pop();
  saveState(false);

  // 2. Intentar guardar en Supabase si hay cliente
  if(typeof supabaseClient !== "undefined" && supabaseClient && navigator.onLine){
    try {
      supabaseClient.from("app_feedback").insert([{
        id: report.id,
        category: report.category,
        title: report.title,
        description: report.description,
        contact: report.contact,
        metadata: report.system,
        character_name: report.character ? report.character.name : null,
        created_at: report.timestamp
      }]).then(function(res){
        if(res && res.error){
          console.warn("Tabla app_feedback no activa en Supabase:", res.error.message);
        } else {
          console.log("Reporte persistido en Supabase con éxito.");
        }
      }).catch(function(err){
        console.warn("Error enviando reporte a Supabase:", err);
      });
    } catch(e){}
  }

  // 3. Mostrar pantalla de éxito con botón WhatsApp
  showFeedbackSuccessScreen(report);
}

function showFeedbackSuccessScreen(report){
  var html = '<h2>🎉 ¡Reporte Preparado!<button data-action="close-feedback-modal" aria-label="Cerrar">&times;</button></h2>' +
    '<div class="feedback-success-card">' +
      '<div class="success-icon-badge">✅</div>' +
      '<div class="success-title">Listo para enviar por WhatsApp</div>' +
      '<p class="success-text">Hemos recopilado la información y el diagnóstico del dispositivo. Pulsa el botón verde para abrir WhatsApp y enviárselo directamente a Lolo (+34 663632738).</p>' +
    '</div>' +

    '<div class="feedback-preview-box">' +
      '<div class="preview-header">Vista previa del mensaje:</div>' +
      '<pre class="preview-text">' + esc(report.formattedMessage) + '</pre>' +
    '</div>' +

    '<div class="feedback-success-actions" style="display:flex;flex-direction:column;gap:8px;">' +
      '<a href="' + esc(report.whatsappUrl) + '" target="_blank" rel="noopener noreferrer" class="btn-whatsapp-primary" id="btnOpenWhatsApp" style="text-decoration:none;display:flex;align-items:center;justify-content:center;gap:8px;">' +
        '<span style="font-size:1.2rem;">📱</span> <span>Abrir y Enviar por WhatsApp</span>' +
      '</a>' +
      '<div style="display:flex;gap:8px;">' +
        '<button type="button" class="btn-compact" style="flex:1;padding:9px;" data-action="copy-feedback-msg">' +
          '📋 Copiar texto' +
        '</button>' +
        '<button type="button" class="btn-compact" style="flex:1;padding:9px;" data-action="new-feedback-form">' +
          '✍️ Nuevo reporte' +
        '</button>' +
      '</div>' +
      '<button type="button" class="btn-solid-gold" style="width:100%;margin-top:4px;padding:9px;" data-action="close-feedback-modal">' +
        'Listo / Cerrar' +
      '</button>' +
    '</div>';

  var modal = document.getElementById("feedbackModal");
  if(modal) modal.innerHTML = html;
  showToast("Reporte generado. Pulsa 'Abrir WhatsApp' para enviarlo.", "success");
}

function testFeedbackWhatsApp(){
  var c = (typeof activeChar === "function") ? activeChar() : null;
  var testReport = buildFeedbackDiagnostic(
    "sugerencia",
    "Prueba de automatización de reportes",
    "¡Hola! Este es un mensaje de prueba para verificar que el sistema de reportes por WhatsApp al número (+34 663632738) funciona correctamente.",
    c ? c.name : "Desarrollador / Tester"
  );
  lastGeneratedReport = testReport;
  showFeedbackSuccessScreen(testReport);
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
  if(action === "submit-feedback-report"){ submitFeedbackReport(); return; }
  if(action === "test-feedback-whatsapp"){ testFeedbackWhatsApp(); return; }
  if(action === "new-feedback-form"){ openFeedbackModal(); return; }
  if(action === "copy-feedback-msg"){
    if(lastGeneratedReport && lastGeneratedReport.formattedMessage){
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(lastGeneratedReport.formattedMessage).then(function(){
          showToast("Mensaje copiado al portapapeles 📋", "success");
        }).catch(function(){
          fallbackCopyText(lastGeneratedReport.formattedMessage);
        });
      } else {
        fallbackCopyText(lastGeneratedReport.formattedMessage);
      }
    }
    return;
  }
}

function fallbackCopyText(text){
  try {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    showToast("Mensaje copiado al portapapeles 📋", "success");
  } catch(err){
    showToast("No se pudo copiar automáticamente. Puedes seleccionarlo manualmente.", "warning");
  }
}

