function renderQuestCard(q, canEdit){
  var qType = (q.type || q.category || "principal") === "secundaria" ? "secundaria" : "principal";
  var isPrincipal = qType === "principal";
  var st = q.status || "activa";
  var badgeClass = st === "completada" ? "completada" : (st === "fallida" ? "fallida" : "activa");
  var badgeLabel = st === "completada" ? "Completada" : (st === "fallida" ? "Fallida" : "En curso");

  var tasks = q.tasks || [];
  var doneTasks = tasks.filter(function(t){ return t.done; }).length;
  var totalTasks = tasks.length;
  var pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : (st === "completada" ? 100 : 0);

  var cardClass = "quest-card " + qType + " " + (st === "completada" ? "completed" : (st === "fallida" ? "failed" : "active"));

  var html = '<div class="'+cardClass+'" id="quest-'+q.id+'">';

  // Header de la tarjeta: Tipo, Título, Estado y Controles GM
  html += '<div class="quest-card-header">'+
    '<div class="quest-card-title-col">'+
      '<div class="quest-card-badge-row">'+
        '<span class="quest-type-badge '+qType+'">'+(isPrincipal ? '⭐ PRINCIPAL' : '◈ SECUNDARIA')+'</span>'+
        (canEdit ?
          '<select class="quest-status-select" data-action="set-quest-status" data-id="'+q.id+'">'+
            '<option value="activa" '+(st==="activa"?"selected":"")+'>🟡 En curso</option>'+
            '<option value="completada" '+(st==="completada"?"selected":"")+'>🟢 Completada</option>'+
            '<option value="fallida" '+(st==="fallida"?"selected":"")+'>🔴 Fallida</option>'+
          '</select>' :
          '<span class="quest-status-badge '+badgeClass+'">'+badgeLabel+'</span>'
        )+
      '</div>'+
      (canEdit ?
        '<input type="text" class="quest-title-input" data-scope="global" data-bind="quests.'+q.id+'.title" value="'+esc(q.title)+'" placeholder="Título de la misión...">' :
        '<h3 class="quest-card-title">'+esc(q.title)+'</h3>'
      )+
    '</div>'+
    (canEdit ?
      '<div class="quest-card-gm-actions">'+
        (!q.image ? '<button class="btn-compact" data-action="upload-quest-img" data-id="'+q.id+'" title="Subir foto de la misión">📷 Foto</button>' : '')+
        (!q.image ? '<button class="btn-compact" data-action="url-quest-img" data-id="'+q.id+'" title="Pegar enlace de foto">URL</button>' : '')+
        '<select class="quest-type-select" data-action="set-quest-type" data-id="'+q.id+'" title="Cambiar categoría">'+
          '<option value="principal" '+(isPrincipal?'selected':'')+'>⭐ Principal</option>'+
          '<option value="secundaria" '+(!isPrincipal?'selected':'')+'>◈ Secundaria</option>'+
        '</select>'+
        '<button class="row-del" data-action="del-quest" data-id="'+q.id+'" title="Eliminar misión">✕</button>'+
      '</div>' : ''
    )+
  '</div>';

  // Chips de metadatos (Ubicación y Recompensa)
  var hasLoc = q.location && q.location.trim();
  var hasRew = q.reward && q.reward.trim();
  if(canEdit || hasLoc || hasRew){
    html += '<div class="quest-meta-chips">';
    if(canEdit){
      html += '<div class="quest-meta-chip editable">'+
        '<span>📍</span>'+
        '<input type="text" data-scope="global" data-bind="quests.'+q.id+'.location" value="'+esc(q.location||"")+'" placeholder="Ubicación (ej: Ruinas de Valdor)">'+
      '</div>';
      html += '<div class="quest-meta-chip editable">'+
        '<span>🏆</span>'+
        '<input type="text" data-scope="global" data-bind="quests.'+q.id+'.reward" value="'+esc(q.reward||"")+'" placeholder="Recompensa (ej: 400 Oro, Gema)">'+
      '</div>';
    } else {
      if(hasLoc){
        html += '<div class="quest-meta-chip"><span>📍</span> '+esc(q.location)+'</div>';
      }
      if(hasRew){
        html += '<div class="quest-meta-chip reward"><span>🏆</span> '+esc(q.reward)+'</div>';
      }
    }
    html += '</div>';
  }

  // Ilustración de la misión (banner visual proporcionado y responsive)
  if(q.image){
    html += '<div class="quest-card-image-wrap">'+
      '<img src="'+esc(q.image)+'" alt="'+esc(q.title)+'" class="quest-card-img" onerror="this.parentElement.style.display=\'none\';">'+
      (canEdit ?
        '<div class="quest-card-img-actions">'+
          '<button class="btn-compact" data-action="upload-quest-img" data-id="'+q.id+'" title="Cambiar foto de la misión">📷 Cambiar</button>'+
          '<button class="btn-compact" data-action="url-quest-img" data-id="'+q.id+'" title="Cambiar por URL">URL</button>'+
          '<button class="row-del" data-action="remove-quest-img" data-id="'+q.id+'" title="Quitar foto">✕</button>'+
        '</div>' : ''
      )+
    '</div>';
  }

  // Descripción de la misión
  if(canEdit){
    html += '<textarea class="quest-desc-textarea" data-scope="global" data-bind="quests.'+q.id+'.desc" placeholder="Detalles, informante o trasfondo de la misión...">'+esc(q.desc||"")+'</textarea>';
  } else if(q.desc && q.desc.trim()){
    html += '<div class="quest-desc-text">'+esc(q.desc)+'</div>';
  }

  // Sección de Objetivos y Barra de Progreso
  html += '<div class="quest-progress-section">'+
    '<div class="quest-progress-info">'+
      '<span class="quest-progress-label">Objetivos: <b>'+doneTasks+'</b> / '+totalTasks+' ('+pct+'%)</span>'+
      (pct === 100 ? '<span class="quest-all-done-badge">¡Completados!</span>' : '')+
    '</div>'+
    '<div class="quest-progress-track">'+
      '<div class="quest-progress-fill '+(isPrincipal?'principal':'secundaria')+(pct===100?' completed':'')+'" style="width:'+pct+'%;"></div>'+
    '</div>'+
  '</div>';

  // Lista de tareas / objetivos
  html += '<ul class="quest-task-list">';
  if(!tasks.length){
    html += '<li class="quest-empty-tasks">Sin objetivos específicos registrados.</li>';
  } else {
    tasks.forEach(function(tk){
      html += '<li class="quest-task-item'+(tk.done?' done':'')+'">'+
        '<input type="checkbox" class="quest-task-cb" data-action="toggle-quest-task" data-qid="'+q.id+'" data-tid="'+tk.id+'" '+(tk.done?'checked':'')+(canEdit?'':' disabled title="Solo el Máster puede marcar objetivos"')+'>'+
        '<span class="quest-task-text" style="flex:1;">'+esc(tk.text)+'</span>'+
        (canEdit ? '<button class="row-del" data-action="del-quest-task" data-qid="'+q.id+'" data-tid="'+tk.id+'" title="Eliminar objetivo">✕</button>' : '')+
      '</li>';
    });
  }
  html += '</ul>';

  if(canEdit){
    html += '<div class="quest-add-task-row" style="margin-top:8px;">'+
      '<button class="btn-compact" data-action="add-quest-task" data-id="'+q.id+'" style="font-size:0.72rem;">+ Añadir Objetivo</button>'+
    '</div>';
  }

  html += '</div>';
  return html;
}

function tplMision(c, s){
  var canEdit = isGM() || !currentUser;
  var quests = s.quests || [];
  var clues = s.questClues || [];
  var qMap = s.questMap || { name: "Mapa de la Misión", image: null, notes: "" };

  // Filtrado y estadísticas
  var filter = state.questTypeFilter || "all";
  
  var mainQuests = quests.filter(function(q){
    var qt = (q.type || q.category || "principal");
    return qt !== "secundaria";
  });
  var sideQuests = quests.filter(function(q){
    var qt = (q.type || q.category || "principal");
    return qt === "secundaria";
  });

  var totalCount = quests.length;
  var mainCount = mainQuests.length;
  var sideCount = sideQuests.length;
  var completedCount = quests.filter(function(q){ return q.status === "completada"; }).length;
  var activeMain = mainQuests.filter(function(q){ return q.status === "activa" || !q.status; }).length;
  var activeSide = sideQuests.filter(function(q){ return q.status === "activa" || !q.status; }).length;

  var html = '<div class="section'+(canEdit?' gm-section':'')+'">'+
    '<div class="section-title">'+
      '<span>🧭 Diario de Misión y Campaña'+(canEdit?' (GM)':'')+'</span>'+
      (canEdit ? '<button class="btn-compact highlight" data-action="toggle-new-quest-form">'+(state._showNewQuestForm ? '✕ Cerrar Creador' : '+ Nueva Misión')+'</button>' : '')+
    '</div>';

  // 1. Resumen de la aventura / sesión
  html += '<div class="quest-banner">'+
    '<div class="quest-header-title">📜 Resumen de la Aventura</div>'+
    (canEdit ? 
      '<textarea class="field" style="width:100%;min-height:55px;resize:vertical;background:rgba(0,0,0,0.25);border:1px solid var(--line);border-radius:var(--radius-sm);padding:8px;font-size:0.85rem;color:var(--ink);" data-scope="global" data-bind="sessionSummary" placeholder="Escribe aquí el resumen de los acontecimientos recientes...">'+esc(s.sessionSummary||"")+'</textarea>' :
      '<p style="font-size:0.86rem;color:var(--ink-dim);line-height:1.5;margin:4px 0 0;">'+(s.sessionSummary ? esc(s.sessionSummary) : '<em>El Master aún no ha añadido un resumen de la sesión.</em>')+'</p>'
    )+
  '</div>';

  // 2. Mapa táctico del encuentro / misión actual
  html += '<div class="quest-map-box">'+
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px;">'+
      '<div style="font-family:var(--font-display);color:var(--gold-light);font-size:0.92rem;display:flex;align-items:center;gap:6px;">'+
        '🗺️ ' + (canEdit ? '<input type="text" style="background:transparent;border:none;border-bottom:1px solid var(--line);color:var(--gold-light);font-size:0.92rem;padding:2px;" data-scope="global" data-bind="questMap.name" value="'+esc(qMap.name||"Mapa del Encuentro")+'">' : esc(qMap.name||"Mapa del Encuentro"))+
      '</div>'+
      (canEdit ? '<div style="display:flex;gap:5px;flex-wrap:wrap;">'+
        '<button class="btn-compact" data-action="upload-quest-map" title="Subir imagen de mapa para esta misión">Subir Foto</button>'+
        '<button class="btn-compact" data-action="url-quest-map" title="Pegar enlace de GitHub o web">Pegar URL</button>'+
        (qMap.image ? '<button class="btn-compact" data-action="remove-quest-map" title="Quitar imagen del mapa">✕</button>' : '')+
      '</div>' : '')+
    '</div>';

  if(qMap.image){
    html += '<img src="'+qMap.image+'" alt="Mapa de Misión" class="quest-map-img">';
  } else {
    html += '<div style="padding:20px 10px;text-align:center;color:var(--ink-faint);font-size:0.8rem;border:1px dashed var(--line);border-radius:var(--radius-sm);">No hay plano fijado para esta misión actualmente.</div>';
  }
  html += '</div>';

  // Formulario elegante para crear misión (GM)
  if(canEdit && state._showNewQuestForm){
    html += '<div class="new-quest-form-card" id="newQuestFormCard">'+
      '<div class="new-quest-form-title">'+
        '<span>⚔️ Registrar Nueva Misión</span>'+
        '<button class="row-del" data-action="toggle-new-quest-form" title="Cerrar">✕</button>'+
      '</div>'+
      '<div class="new-quest-form-body">'+
        '<div class="new-quest-type-selector">'+
          '<label class="quest-type-radio-label">'+
            '<input type="radio" name="newQuestType" value="principal" checked>'+
            '<span class="radio-pill principal">⭐ Misión Principal</span>'+
          '</label>'+
          '<label class="quest-type-radio-label">'+
            '<input type="radio" name="newQuestType" value="secundaria">'+
            '<span class="radio-pill secundaria">◈ Misión Secundaria</span>'+
          '</label>'+
        '</div>'+
        '<div class="form-group" style="margin-bottom:8px;">'+
          '<label style="font-size:0.75rem;color:var(--gold-light);font-weight:700;">Título de la Misión *</label>'+
          '<input type="text" id="newQuestTitle" class="field" style="width:100%;font-family:var(--font-display);font-size:0.95rem;" placeholder="Ej: La Sombra del Nigromante de Krysalis">'+
        '</div>'+
        '<div class="form-row-2col">'+
          '<div class="form-group">'+
            '<label style="font-size:0.75rem;color:var(--ink-dim);">📍 Ubicación / Zona</label>'+
            '<input type="text" id="newQuestLocation" class="field" style="width:100%;font-size:0.82rem;" placeholder="Ej: Catacumbas Subterráneas">'+
          '</div>'+
          '<div class="form-group">'+
            '<label style="font-size:0.75rem;color:var(--ink-dim);">🏆 Recompensa Prevista</label>'+
            '<input type="text" id="newQuestReward" class="field" style="width:100%;font-size:0.82rem;" placeholder="Ej: 500 Oro, Espada Rúnica">'+
          '</div>'+
        '</div>'+
        '<div class="form-group" style="margin-top:8px;">'+
          '<label style="font-size:0.75rem;color:var(--ink-dim);">Descripción / Contexto / Pistas</label>'+
          '<textarea id="newQuestDesc" class="field" style="width:100%;min-height:55px;resize:vertical;font-size:0.82rem;" placeholder="Detalles conocidos, contactos, secretos o peligros..."></textarea>'+
        '</div>'+
        '<div class="form-group" style="margin-top:8px;">'+
          '<label style="font-size:0.75rem;color:var(--ink-dim);">🖼️ Ilustración / Imagen (URL opcional o súbela tras crearla)</label>'+
          '<input type="text" id="newQuestImage" class="field" style="width:100%;font-size:0.82rem;" placeholder="https://... (o déjalo vacío y súbela con 📷 Foto tras crearla)">'+
        '</div>'+
        '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px;">'+
          '<button class="btn-compact" data-action="toggle-new-quest-form">Cancelar</button>'+
          '<button class="btn-compact highlight" data-action="submit-new-quest" style="background:var(--gold);color:#120D0A;font-weight:700;">⚔️ Guardar Misión</button>'+
        '</div>'+
      '</div>'+
    '</div>';
  }

  // Barra de pestañas / filtros de misión
  html += '<div class="quest-filter-bar">'+
    '<button class="quest-filter-btn '+(filter==="all"?"active":"")+'" data-action="filter-quest-type" data-filter="all">'+
      'Todas <span class="badge-count">'+totalCount+'</span>'+
    '</button>'+
    '<button class="quest-filter-btn principal '+(filter==="principal"?"active":"")+'" data-action="filter-quest-type" data-filter="principal">'+
      '⭐ Principales <span class="badge-count">'+mainCount+'</span>'+
    '</button>'+
    '<button class="quest-filter-btn secundaria '+(filter==="secundaria"?"active":"")+'" data-action="filter-quest-type" data-filter="secundaria">'+
      '◈ Secundarias <span class="badge-count">'+sideCount+'</span>'+
    '</button>'+
    '<button class="quest-filter-btn completed '+(filter==="completada"?"active":"")+'" data-action="filter-quest-type" data-filter="completada">'+
      '🟢 Completadas <span class="badge-count">'+completedCount+'</span>'+
    '</button>'+
  '</div>';

  // 3. Renderizado de misiones según filtro
  if(!quests.length){
    html += '<div class="quest-empty-box">'+
      '<div style="font-size:1.8rem;margin-bottom:6px;">🧭</div>'+
      '<div style="font-family:var(--font-display);font-size:1rem;color:var(--gold-light);">Sin misiones registradas</div>'+
      '<p style="font-size:0.82rem;color:var(--ink-faint);margin:4px 0 0;">El Máster aún no ha asignado objetivos de campaña a los aventureros.</p>'+
    '</div>';
  } else {
    if(filter === "all"){
      // Vista agrupada: Misiones Principales + Misiones Secundarias
      html += '<div class="quest-section-header principal">'+
        '<span>⭐ Misiones Principales ('+activeMain+' activas / '+mainCount+' total)</span>'+
      '</div>';
      if(!mainQuests.length){
        html += '<div class="quest-empty-cat">No hay misiones principales en curso.</div>';
      } else {
        mainQuests.forEach(function(q){
          html += renderQuestCard(q, canEdit);
        });
      }

      html += '<div class="quest-section-header secundaria" style="margin-top:18px;">'+
        '<span>◈ Misiones Secundarias ('+activeSide+' activas / '+sideCount+' total)</span>'+
      '</div>';
      if(!sideQuests.length){
        html += '<div class="quest-empty-cat">No hay misiones secundarias registradas.</div>';
      } else {
        sideQuests.forEach(function(q){
          html += renderQuestCard(q, canEdit);
        });
      }

    } else if(filter === "principal"){
      html += '<div class="quest-section-header principal">'+
        '<span>⭐ Misiones Principales ('+mainCount+')</span>'+
      '</div>';
      if(!mainQuests.length){
        html += '<div class="quest-empty-cat">No hay misiones principales.</div>';
      } else {
        mainQuests.forEach(function(q){
          html += renderQuestCard(q, canEdit);
        });
      }

    } else if(filter === "secundaria"){
      html += '<div class="quest-section-header secundaria">'+
        '<span>◈ Misiones Secundarias ('+sideCount+')</span>'+
      '</div>';
      if(!sideQuests.length){
        html += '<div class="quest-empty-cat">No hay misiones secundarias.</div>';
      } else {
        sideQuests.forEach(function(q){
          html += renderQuestCard(q, canEdit);
        });
      }

    } else if(filter === "completada"){
      var compQuests = quests.filter(function(q){ return q.status === "completada"; });
      html += '<div class="quest-section-header completed">'+
        '<span>🟢 Misiones Completadas ('+compQuests.length+')</span>'+
      '</div>';
      if(!compQuests.length){
        html += '<div class="quest-empty-cat">Aún no hay misiones marcadas como completadas.</div>';
      } else {
        compQuests.forEach(function(q){
          html += renderQuestCard(q, canEdit);
        });
      }
    }
  }

  // 4. Pistas y Descubrimientos de la Sesión
  html += '<div class="section-title" style="margin-top:20px;">'+
    '<span>Pistas y Hallazgos Clave ('+clues.length+')</span>'+
    (canEdit ? '<button class="btn-compact" data-action="add-clue">+ Añadir Pista</button>' : '')+
  '</div>';

  if(!clues.length){
    html += '<p style="font-size:0.82rem;color:var(--ink-faint);margin-bottom:12px;">Sin pistas registradas aún.</p>';
  } else {
    html += '<div class="clues-grid">';
    clues.forEach(function(cl){
      html += '<div class="clue-card">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;">'+
          (canEdit ?
            '<input type="text" style="font-family:var(--font-display);font-size:0.9rem;color:var(--gold-light);background:transparent;border:none;border-bottom:1px solid var(--line);flex:1;" data-scope="global" data-bind="questClues.'+cl.id+'.title" value="'+esc(cl.title)+'">' :
            '<div class="clue-title">📜 '+esc(cl.title)+'</div>'
          )+
          (canEdit ? '<button class="row-del" data-action="del-clue" data-id="'+cl.id+'" title="Eliminar pista">✕</button>' : '')+
        '</div>'+
        (canEdit ?
          '<textarea style="width:100%;min-height:45px;background:rgba(0,0,0,0.15);border:1px solid var(--line);border-radius:4px;padding:4px;font-size:0.8rem;color:var(--ink-dim);resize:vertical;" data-scope="global" data-bind="questClues.'+cl.id+'.text">'+esc(cl.text||"")+'</textarea>' :
          '<p style="font-size:0.82rem;color:var(--ink-dim);line-height:1.4;margin:2px 0;">'+esc(cl.text||"")+'</p>'
        );
      if(cl.image){
        html += '<img src="'+cl.image+'" alt="Pista" class="clue-img">';
      }
      if(canEdit){
        html += '<div style="display:flex;gap:4px;margin-top:4px;">'+
          '<button class="btn-compact" data-action="upload-clue-img" data-id="'+cl.id+'" style="font-size:0.68rem;">📷 Foto</button>'+
          '<button class="btn-compact" data-action="url-clue-img" data-id="'+cl.id+'" style="font-size:0.68rem;">'+(cl.image?'Cambiar URL':'Pegar URL')+'</button>'+
          (cl.image ? '<button class="btn-compact" data-action="remove-clue-img" data-id="'+cl.id+'" style="font-size:0.68rem;">Quitar Foto</button>' : '')+
        '</div>';
      }
      html += '</div>';
    });
    html += '</div>';
  }

  // 5. Cuaderno personal del aventurero (Notas privadas del jugador)
  html += '<div class="section-title" style="margin-top:20px;">'+
    '<span>Diario del Aventurero ('+esc(c.name)+')</span>'+
    '<span style="font-size:0.68rem;color:var(--ink-faint);text-transform:none;">Solo visible en tu ficha</span>'+
  '</div>'+
  '<div class="journal-box">'+
    '<textarea class="journal-textarea" data-bind="personalNotes" placeholder="Escribe aquí tus notas personales de la partida, sospechas, nombres de NPCs, deudas, planes o recordatorios secretos...">'+esc(c.personalNotes||"")+'</textarea>'+
    '<div style="font-size:0.68rem;color:var(--ink-faint);text-align:right;margin-top:4px;">Se guarda automáticamente al escribir</div>'+
  '</div>'+
  '</div>';

  return html;
}
