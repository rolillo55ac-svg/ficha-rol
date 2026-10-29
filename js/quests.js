function renderQuestCard(q, canEdit){
  var qType = (q.type || q.category || "principal") === "secundaria" ? "secundaria" : "principal";
  var isPrincipal = qType === "principal";
  var st = q.status || "activa";
  var badgeClass = st === "completada" ? "completada" : (st === "fallida" ? "fallida" : "activa");
  var badgeLabel = st === "completada" ? "Completada" : (st === "fallida" ? "Fallida" : "En curso");

  var tasks = q.tasks || [];
  var doneTasks = tasks.filter(function(t){
    var isTgt = typeof t.target === "number" && t.target > 1;
    return Boolean(t.done || (isTgt && (t.current || 0) >= t.target));
  }).length;
  var totalTasks = tasks.length;
  var taskProgressSum = tasks.reduce(function(acc, t){
    var tgt = Math.max(1, parseInt(t.target, 10) || 1);
    var cur = (t.current !== undefined && t.current !== null) ? Math.max(0, parseInt(t.current, 10) || 0) : (t.done ? tgt : 0);
    return acc + Math.min(1, cur / tgt);
  }, 0);
  var pct = totalTasks > 0 ? Math.round((taskProgressSum / totalTasks) * 100) : (st === "completada" ? 100 : 0);

  var cardClass = "quest-card " + qType + " " + (st === "completada" ? "completed" : (st === "fallida" ? "failed" : "active"));

  var html = '<div class="'+cardClass+'" id="quest-'+q.id+'" data-juice-card="q'+q.id+'">';

  // Header de la tarjeta: Tipo, Título, Estado y Controles GM
  html += '<div class="quest-card-header">'+
    '<div class="quest-card-title-col">'+
      '<div class="quest-card-badge-row">'+
        '<span class="quest-type-badge '+qType+'">'+(isPrincipal ? icono("mision", {tam:"s"}) + ' PRINCIPAL' : '◈ SECUNDARIA')+'</span>'+
        (q.house===true ? '<span class="quest-type-badge secundaria">' + icono("casa", {tam:"s"}) + ' CASA</span>' : '')+
        (canEdit ?
          '<select class="quest-status-select" data-action="set-quest-status" data-id="'+q.id+'">'+
            '<option value="activa" '+(st==="activa"?"selected":"")+'>En curso</option>'+
            '<option value="completada" '+(st==="completada"?"selected":"")+'>Completada</option>'+
            '<option value="fallida" '+(st==="fallida"?"selected":"")+'>Fallida</option>'+
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
        (!q.image ? '<button class="btn-compact" data-action="upload-quest-img" data-id="'+q.id+'" title="Subir foto de la misión">' + icono("camara", {tam:"s"}) + ' Foto</button>' : '')+
        (!q.image ? '<button class="btn-compact" data-action="url-quest-img" data-id="'+q.id+'" title="Pegar enlace de foto">URL</button>' : '')+
        '<select class="quest-type-select" data-action="set-quest-type" data-id="'+q.id+'" title="Cambiar categoría">'+
          '<option value="principal" '+(isPrincipal?'selected':'')+'>Principal</option>'+
          '<option value="secundaria" '+(!isPrincipal?'selected':'')+'>◈ Secundaria</option>'+
        '</select>'+
        '<button type="button" class="btn-compact quest-house-toggle'+(q.house===true?' highlight':'')+'" data-action="toggle-quest-house" data-id="'+q.id+'" title="Marcar como misión de la Casa">' + icono("casa", {tam:"s"}) + ' ' + (q.house===true ? 'Casa ' + iconoUI("hecho") : 'Casa') + '</button>'+
        '<button class="row-del" data-action="del-quest" data-id="'+q.id+'" title="Eliminar misión">' + iconoUI("cerrar") + '</button>'+
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
        '<span>' + icono("lugar", {tam:"s"}) + '</span>'+
        '<input type="text" data-scope="global" data-bind="quests.'+q.id+'.location" value="'+esc(q.location||"")+'" placeholder="Ubicación (ej: Ruinas de Valdor)">'+
      '</div>';
      html += '<div class="quest-meta-chip editable">'+
        '<span>' + icono("trofeo", {tam:"s"}) + '</span>'+
        '<input type="text" data-scope="global" data-bind="quests.'+q.id+'.reward" value="'+esc(q.reward||"")+'" placeholder="Recompensa (ej: 400 Oro, Gema)">'+
      '</div>';
    } else {
      if(hasLoc){
        html += '<div class="quest-meta-chip"><span>' + icono("lugar", {tam:"s"}) + '</span> ' + esc(q.location) + '</div>';
      }
      if(hasRew){
        html += '<div class="quest-meta-chip reward"><span>' + icono("trofeo", {tam:"s"}) + '</span> ' + esc(q.reward) + '</div>';
      }
    }
    html += '</div>';
  }

  // Ilustración de la misión (visor interactivo con marcadores y pines de mapa)
  if(q.image){
    var cardMarkers = q.markers || [];
    html += '<div class="quest-card-image-wrap map-viewer" data-action="quest-card-map-click" data-quest-id="'+q.id+'" style="position:relative;cursor:crosshair;min-height:150px;">'+
      '<img src="'+esc(q.image)+'" alt="'+esc(q.title)+'" class="quest-card-img" onerror="this.parentElement.style.display=\'none\';">'+
      cardMarkers.map(function(m){
        var tDef = (typeof getMarkerTypeDef === "function") ? getMarkerTypeDef(m.kind) : { id: "poi", name: "Punto de Interés", icon: "📍", color: "#2A9D8F" };
        var icon = m.icon || tDef.icon || "📍";
        var pinColor = safeColor(m.color || tDef.color, "#2A9D8F");
        return '<div class="map-pin pin-type-' + tDef.id + '" style="left:' + num(m.x) + '%;top:' + num(m.y) + '%;" data-action="edit-quest-card-pin" data-quest-id="' + q.id + '" data-id="' + m.id + '" title="' + esc(m.name) + ' (' + esc(tDef.name) + ')">' +
          '<div class="pin-balloon" style="background-color:' + pinColor + ';box-shadow:0 0 10px ' + pinColor + '88;">' +
            '<div class="pin-icon">' + iconoDeEmoji(icon, "mapa", {tam:"s"}) + '</div>' +
          '</div>' +
          '<div class="pin-tag">' + esc(m.name) + '</div>' +
        '</div>';
      }).join('')+
      '<div class="quest-card-img-actions" style="position:absolute;bottom:6px;right:6px;display:flex;gap:4px;z-index:15;">'+
        (cardMarkers.length ? '<span class="quest-markers-badge" style="background:rgba(0,0,0,0.8);color:var(--gold-light);padding:2px 7px;border-radius:4px;font-size:0.68rem;border:1px solid var(--line);align-self:center;backdrop-filter:blur(4px);">' + icono("lugar", {tam:"s"}) + ' ' + cardMarkers.length + '</span>' : '')+
        (canEdit ?
          '<button class="btn-compact" data-action="upload-quest-img" data-id="'+q.id+'" title="Cambiar foto de la misión">' + icono("camara", {tam:"s"}) + ' Cambiar</button>'+
          '<button class="btn-compact" data-action="url-quest-img" data-id="'+q.id+'" title="Cambiar por URL">URL</button>'+
          '<button class="row-del" data-action="remove-quest-img" data-id="'+q.id+'" title="Quitar foto">' + iconoUI("cerrar") + '</button>'
        : '')+
      '</div>'+
    '</div>'+
    '<div style="font-size:0.68rem;color:var(--ink-faint);margin:2px 0 6px;display:flex;justify-content:space-between;">'+
      '<span>' + icono("mapa", {tam:"s"}) + ' Haz clic en la imagen para fijar puntos, secretos o peligros en esta misión.</span>'+
      (cardMarkers.length ? '<span>'+cardMarkers.length+' marcado(s)</span>' : '')+
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
      var tgt = (tk.target !== undefined && tk.target !== null) ? Math.max(1, parseInt(tk.target, 10) || 1) : 1;
      var cur = (tk.current !== undefined && tk.current !== null) ? Math.max(0, parseInt(tk.current, 10) || 0) : (tk.done ? tgt : 0);
      var hasCounter = tgt > 1;
      var isDone = Boolean(tk.done || (hasCounter && cur >= tgt));
      var taskPct = hasCounter ? Math.min(100, Math.round((cur / tgt) * 100)) : (isDone ? 100 : 0);

      html += '<li class="quest-task-item'+(isDone?' done':'')+(hasCounter?' with-counter':'')+'" id="quest-task-'+tk.id+'">'+
        '<div class="quest-task-main-row">'+
          '<input type="checkbox" class="quest-task-cb k-check" data-action="toggle-quest-task" data-qid="'+q.id+'" data-tid="'+tk.id+'" '+(isDone?'checked':'')+(canEdit?'':' disabled title="Solo el Máster puede marcar objetivos"')+'>'+
          (canEdit ?
            '<span class="quest-task-text editable" data-action="edit-quest-task-text" data-qid="'+q.id+'" data-tid="'+tk.id+'" title="Clic para editar texto del objetivo">'+esc(tk.text)+'</span>' :
            '<span class="quest-task-text">'+esc(tk.text)+'</span>'
          )+
          (hasCounter ?
            (canEdit ?
              '<div class="quest-task-counter-wrap" title="Progreso del objetivo">'+
                '<button type="button" class="quest-step-btn dec" data-action="step-quest-task" data-qid="'+q.id+'" data-tid="'+tk.id+'" data-delta="-1" title="Restar 1 (Shift+clic: -5)">-</button>'+
                '<input type="number" class="quest-task-num-input current" min="0" data-action="set-quest-task-current" data-qid="'+q.id+'" data-tid="'+tk.id+'" value="'+cur+'" title="Completado actual" inputmode="numeric">'+
                '<span class="quest-task-num-sep">/</span>'+
                '<input type="number" class="quest-task-num-input target" min="1" data-action="set-quest-task-target" data-qid="'+q.id+'" data-tid="'+tk.id+'" value="'+tgt+'" title="Meta total (Pon 1 para objetivo simple)" inputmode="numeric">'+
                '<button type="button" class="quest-step-btn inc" data-action="step-quest-task" data-qid="'+q.id+'" data-tid="'+tk.id+'" data-delta="1" title="Sumar 1 (Shift+clic: +5)">+</button>'+
              '</div>' :
              '<div class="quest-task-counter-pill '+(isDone?'completed':'')+'" title="Progreso: '+cur+' de '+tgt+' ('+taskPct+'%)">'+
                '<span class="quest-task-pill-cur">'+cur+'</span> / <span class="quest-task-pill-tgt">'+tgt+'</span>'+
              '</div>'
            ) :
            (canEdit ?
              '<button type="button" class="quest-task-btn-meta" data-action="prompt-quest-task-target" data-qid="'+q.id+'" data-tid="'+tk.id+'" title="Añadir meta numérica o contador (ej: 5 flores, 400 vidas)">' + icono("diana", {tam:"s"}) + ' +Meta</button>' : ''
            )
          )+
          (canEdit ?
            '<button class="row-del" data-action="del-quest-task" data-qid="'+q.id+'" data-tid="'+tk.id+'" title="Eliminar objetivo">' + iconoUI("cerrar") + '</button>' : ''
          )+
        '</div>'+
        (hasCounter ?
          '<div class="quest-task-mini-track" title="'+taskPct+'% completado">'+
            '<div class="quest-task-mini-fill '+(isDone?'completed':'')+'" style="width:'+taskPct+'%;"></div>'+
          '</div>' : ''
        )+
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

  // Asegurar estructura válida sin forzar reaparición de misiones o pistas borradas
  if(!Array.isArray(s.quests)){
    s.quests = (typeof getSeedQuests === "function") ? getSeedQuests() : [];
  }
  if(!Array.isArray(s.questClues)){
    s.questClues = (typeof getSeedQuestClues === "function") ? getSeedQuestClues() : [];
  }
  if(!s.questMap || typeof s.questMap !== "object"){
    s.questMap = (typeof getSeedQuestMap === "function") ? getSeedQuestMap() : { name: "Mapa de la Misión", image: null, notes: "", markers: [] };
  }
  if(s.sessionSummary === undefined || s.sessionSummary === null){
    s.sessionSummary = (typeof getSeedSessionSummary === "function") ? getSeedSessionSummary() : "";
  }

  // Si la misión o pista semilla fue marcada como eliminada, filtrar para que no aparezca
  if(Array.isArray(s._deletedSeedQuests) && s._deletedSeedQuests.indexOf("quest_trysar_infil") !== -1){
    s.quests = s.quests.filter(function(q){
      return q.id !== "quest_trysar_infil" && !((q.title||"").toLowerCase().includes("trysar") && (q.title||"").toLowerCase().includes("infiltraci"));
    });
  }
  if(Array.isArray(s._deletedSeedClues) && s._deletedSeedClues.indexOf("clue_sello_purpura") !== -1){
    s.questClues = s.questClues.filter(function(cl){ return cl.id !== "clue_sello_purpura"; });
  }

  var quests = s.quests;
  var clues = s.questClues;
  var qMap = s.questMap;

  var html = '<div class="section'+(canEdit?' gm-section':'')+'">'+
    '<div class="section-title">'+
      '<span>' + icono("brujula", {tam:"s"}) + ' Diario de Misión y Campaña'+(canEdit?' (GM)':'')+'</span>'+
      (canEdit ? '<button class="btn-compact highlight" data-action="toggle-new-quest-form">'+(state._showNewQuestForm ? iconoUI("cerrar") + ' Cerrar Creador' : '+ Nueva Misión')+'</button>' : '')+
    '</div>';

  // 1. Resumen de la aventura / sesión
  html += '<div class="quest-banner">'+
    '<div class="quest-header-title">' + icono("pergamino", {tam:"s"}) + ' Resumen de la Aventura</div>'+
    (canEdit ? 
      '<textarea class="field" style="width:100%;min-height:55px;resize:vertical;background:rgba(0,0,0,0.25);border:1px solid var(--line);border-radius:var(--radius-sm);padding:8px;font-size:0.85rem;color:var(--ink);" data-scope="global" data-bind="sessionSummary" placeholder="Escribe aquí el resumen de los acontecimientos recientes...">'+esc(s.sessionSummary||"")+'</textarea>' :
      '<p style="font-size:0.86rem;color:var(--ink-dim);line-height:1.5;margin:4px 0 0;">'+(s.sessionSummary ? esc(s.sessionSummary) : '<em>El Master aún no ha añadido un resumen de la sesión.</em>')+'</p>'
    )+
  '</div>';

  // 2. Mapa táctico del encuentro / misión actual (con marcadores interactivos)
  var qMarkers = qMap.markers || [];
  var qmFilter = state.questMapFilter || { hideAll: false, hiddenTypes: {} };

  // Agrupar conteos por tipo para la barra de filtros
  var qmCounts = {};
  qMarkers.forEach(function(p){
    var td = (typeof getMarkerTypeDef === "function") ? getMarkerTypeDef(p.kind) : { id: "poi" };
    qmCounts[td.id] = (qmCounts[td.id] || 0) + 1;
  });

  var qmTypePillsHtml = Object.keys(qmCounts).map(function(tid){
    var tDef = (typeof MAP_MARKER_TYPES !== "undefined") ? (MAP_MARKER_TYPES.find(function(x){return x.id===tid;}) || {id:tid, name:tid, icon:"📍", color:"#2A9D8F"}) : {id:tid, name:tid, icon:"📍", color:"#2A9D8F"};
    var isMuted = qmFilter.hiddenTypes && qmFilter.hiddenTypes[tid];
    return '<button type="button" class="map-filter-pill' + (isMuted ? ' is-muted' : ' is-active') + '" data-action="toggle-quest-map-pin-filter" data-type-id="' + tid + '" style="--pill-col:' + tDef.color + ';" title="' + (isMuted ? 'Mostrar ' : 'Ocultar ') + esc(tDef.name) + '">' +
      '<span class="mfp-icon">' + iconoDeEmoji(tDef.icon, "mapa", {tam:"s"}) + '</span>' +
      '<span class="mfp-name">' + esc(tDef.name) + '</span>' +
      '<span class="mfp-count">' + qmCounts[tid] + '</span>' +
    '</button>';
  }).join('');

  html += '<div class="quest-map-box">'+
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px;">'+
      '<div style="font-family:var(--font-display);color:var(--gold-light);font-size:0.92rem;display:flex;align-items:center;gap:6px;">'+
        icono("mapa", {tam:"s"}) + ' ' + (canEdit ? '<input type="text" style="background:transparent;border:none;border-bottom:1px solid var(--line);color:var(--gold-light);font-size:0.92rem;padding:2px;" data-scope="global" data-bind="questMap.name" value="'+esc(qMap.name||"Mapa del Encuentro")+'">' : esc(qMap.name||"Mapa del Encuentro"))+
      '</div>'+
      (canEdit ? '<div style="display:flex;gap:5px;flex-wrap:wrap;">'+
        '<button class="btn-compact" data-action="upload-quest-map" title="Subir imagen de mapa para esta misión">Subir Foto</button>'+
        '<button class="btn-compact" data-action="url-quest-map" title="Pegar enlace de GitHub o web">Pegar URL</button>'+
        (qMap.image ? '<button class="btn-compact" data-action="remove-quest-map" title="Quitar imagen del mapa">' + iconoUI("cerrar") + '</button>' : '')+
      '</div>' : '')+
    '</div>';

  if(qMap.image){
    if(qMarkers.length > 0){
      html += '<div class="map-filter-bar quest-map-filter-bar" style="margin-top:6px;margin-bottom:8px;">' +
        '<div class="map-filter-header">' +
          '<span style="font-size:0.75rem;font-weight:700;color:var(--gold-light);">' + icono("lugar", {tam:"s"}) + ' Marcadores del Encuentro (' + qMarkers.length + '):</span>' +
          '<div style="display:flex;gap:5px;align-items:center;">' +
            '<button type="button" class="btn-compact map-filter-toggle-all' + (qmFilter.hideAll ? ' is-off' : '') + '" data-action="toggle-quest-map-pins-all" style="padding:3px 8px;font-size:0.68rem;">' +
              (qmFilter.hideAll ? iconoUI("ver") + ' Mostrar todos' : iconoUI("ocultar") + ' Ocultar todos') +
            '</button>' +
            ((Object.keys(qmFilter.hiddenTypes||{}).length > 0 || qmFilter.hideAll) ?
              '<button type="button" class="btn-compact" data-action="reset-quest-map-pin-filter" style="padding:3px 8px;font-size:0.68rem;" title="Restablecer visibilidad">' + iconoUI("recargar") + ' Restablecer</button>' : '') +
          '</div>' +
        '</div>' +
        '<div class="map-filter-shelf">' + qmTypePillsHtml + '</div>' +
      '</div>';
    }

    html += '<div class="map-viewer quest-map-viewer" data-action="quest-map-click">'+
      '<img src="'+esc(safeUrl(qMap.image))+'" alt="Mapa de Misión">'+
      qMarkers.map(function(m){
        var tDef = (typeof getMarkerTypeDef === "function") ? getMarkerTypeDef(m.kind) : { id: "poi", name: "Punto de Interés", icon: "📍", color: "#2A9D8F" };
        var icon = m.icon || tDef.icon || "📍";
        var pinColor = safeColor(m.color || tDef.color, "#2A9D8F");
        var isHidden = qmFilter.hideAll || (qmFilter.hiddenTypes && qmFilter.hiddenTypes[tDef.id]);
        if(isHidden) return '';

        return '<div class="map-pin pin-type-' + tDef.id + '" style="left:' + num(m.x) + '%;top:' + num(m.y) + '%;" data-action="edit-quest-map-pin" data-id="' + m.id + '" title="' + esc(m.name) + ' (' + esc(tDef.name) + ')">' +
          '<div class="pin-balloon" style="background-color:' + pinColor + ';box-shadow:0 0 10px ' + pinColor + '88;">' +
            '<div class="pin-icon">' + iconoDeEmoji(icon, "mapa", {tam:"s"}) + '</div>' +
          '</div>' +
          '<div class="pin-tag">' + esc(m.name) + '</div>' +
        '</div>';
      }).join('')+
    '</div>';

    html += '<div style="font-size:0.7rem;color:var(--ink-faint);margin-top:4px;display:flex;justify-content:space-between;">'+
      '<span>' + icono("mapa", {tam:"s"}) + ' Haz clic en cualquier parte del plano para fijar puntos clave, emboscadas, rutas o secretos.</span>'+
      '<span>'+qMarkers.length+' marcador(es)</span>'+
    '</div>';
  } else {
    html += '<div style="padding:20px 10px;text-align:center;color:var(--ink-faint);font-size:0.8rem;border:1px dashed var(--line);border-radius:var(--radius-sm);">No hay plano fijado para esta misión actualmente.</div>';
  }
  html += '</div>';

  // Formulario elegante para crear misión (GM)
  if(canEdit && state._showNewQuestForm){
    html += '<div class="new-quest-form-card" id="newQuestFormCard">'+
      '<div class="new-quest-form-title">'+
        '<span>' + icono("puno", {tam:"s"}) + ' Registrar Nueva Misión</span>'+
        '<button class="row-del" data-action="toggle-new-quest-form" title="Cerrar">' + iconoUI("cerrar") + '</button>'+
      '</div>'+
      '<div class="new-quest-form-body">'+
        '<div class="new-quest-type-selector">'+
          '<label class="quest-type-radio-label">'+
            '<input type="radio" name="newQuestType" value="principal" checked>'+
            '<span class="radio-pill principal">' + icono("mision", {tam:"s"}) + ' Misión Principal</span>'+
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
            '<label style="font-size:0.75rem;color:var(--ink-dim);">' + icono("lugar", {tam:"s"}) + ' Ubicación / Zona</label>'+
            '<input type="text" id="newQuestLocation" class="field" style="width:100%;font-size:0.82rem;" placeholder="Ej: Catacumbas Subterráneas">'+
          '</div>'+
          '<div class="form-group">'+
            '<label style="font-size:0.75rem;color:var(--ink-dim);">' + icono("trofeo", {tam:"s"}) + ' Recompensa Prevista</label>'+
            '<input type="text" id="newQuestReward" class="field" style="width:100%;font-size:0.82rem;" placeholder="Ej: 500 Oro, Espada Rúnica">'+
          '</div>'+
        '</div>'+
        '<div class="form-group" style="margin-top:8px;">'+
          '<label style="font-size:0.75rem;color:var(--ink-dim);">Descripción / Contexto / Pistas</label>'+
          '<textarea id="newQuestDesc" class="field" style="width:100%;min-height:55px;resize:vertical;font-size:0.82rem;" placeholder="Detalles conocidos, contactos, secretos o peligros..."></textarea>'+
        '</div>'+
        '<div class="form-group" style="margin-top:8px;">'+
          '<label style="font-size:0.75rem;color:var(--ink-dim);">' + icono("cuadro", {tam:"s"}) + ' Ilustración / Imagen (URL opcional o súbela tras crearla)</label>'+
          '<input type="text" id="newQuestImage" class="field" style="width:100%;font-size:0.82rem;" placeholder="https://... (o déjalo vacío y súbela con el botón Foto tras crearla)">'+
        '</div>'+
        '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px;">'+
          '<button class="btn-compact" data-action="toggle-new-quest-form">Cancelar</button>'+
          '<button class="btn-compact highlight" data-action="submit-new-quest" style="background:var(--gold);color:#120D0A;font-weight:700;">' + icono("puno", {tam:"s"}) + ' Guardar Misión</button>'+
        '</div>'+
      '</div>'+
    '</div>';
  }

  html += renderQuestBrowser(quests, canEdit);

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
            '<div class="clue-title">' + icono("pergamino", {tam:"s"}) + ' ' + esc(cl.title) + '</div>'
          )+
          (canEdit ? '<button class="row-del" data-action="del-clue" data-id="'+cl.id+'" title="Eliminar pista">' + iconoUI("cerrar") + '</button>' : '')+
        '</div>'+
        (canEdit ?
          '<textarea style="width:100%;min-height:45px;background:rgba(0,0,0,0.15);border:1px solid var(--line);border-radius:4px;padding:4px;font-size:0.8rem;color:var(--ink-dim);resize:vertical;" data-scope="global" data-bind="questClues.'+cl.id+'.text">'+esc(cl.text||"")+'</textarea>' :
          '<p style="font-size:0.82rem;color:var(--ink-dim);line-height:1.4;margin:2px 0;">'+esc(cl.text||"")+'</p>'
        );
      if(cl.image){
        html += '<img src="'+esc(safeUrl(cl.image))+'" alt="Pista" class="clue-img">';
      }
      if(canEdit){
        html += '<div style="display:flex;gap:4px;margin-top:4px;">'+
          '<button class="btn-compact" data-action="upload-clue-img" data-id="'+cl.id+'" style="font-size:0.68rem;">' + icono("camara", {tam:"s"}) + ' Foto</button>'+
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


// ===== Lista de misiones: filtros de estado y tipo, buscador y filas plegables =====
function questNorm(t){
  return String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function questView(){
  if(!state.questStatusFilter){
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem("krysalisQuestView") || "null"); } catch(e){}
    state.questStatusFilter = (saved && saved.st) || "activa";
    if(saved && saved.tp) state.questTypeFilter = saved.tp;
  }
  return { st: state.questStatusFilter, tp: state.questTypeFilter || "all" };
}

function saveQuestView(){
  try { localStorage.setItem("krysalisQuestView", JSON.stringify({ st: state.questStatusFilter, tp: state.questTypeFilter || "all" })); } catch(e){}
}

function questStatusOf(q){
  return q.status === "completada" ? "completada" : (q.status === "fallida" ? "fallida" : "activa");
}

function questTypeOf(q){
  return (q.type || q.category || "principal") === "secundaria" ? "secundaria" : "principal";
}

function questProgress(q){
  var tasks = q.tasks || [];
  var done = tasks.filter(function(t){
    var isTgt = typeof t.target === "number" && t.target > 1;
    return Boolean(t.done || (isTgt && (t.current || 0) >= t.target));
  }).length;
  var sum = tasks.reduce(function(acc, t){
    var tgt = Math.max(1, parseInt(t.target, 10) || 1);
    var cur = (t.current !== undefined && t.current !== null) ? Math.max(0, parseInt(t.current, 10) || 0) : (t.done ? tgt : 0);
    return acc + Math.min(1, cur / tgt);
  }, 0);
  return { done: done, total: tasks.length, pct: tasks.length ? Math.round(sum / tasks.length * 100) : (questStatusOf(q) === "completada" ? 100 : 0) };
}

function questMatchesSearch(q, needle){
  if(!needle) return true;
  var hay = [q.title, q.desc].concat((q.tasks || []).map(function(t){ return t.text; })).join(" ");
  return questNorm(hay).indexOf(needle) !== -1;
}

function setQuestStatus(q, st){
  q.status = st;
  if(st === "completada"){
    if(!q.completedAt) q.completedAt = Date.now();
  } else {
    delete q.completedAt;
  }
}

function questDateLabel(ts){
  if(!ts) return "";
  try { return new Date(ts).toLocaleDateString("es-ES", { day: "numeric", month: "short" }); } catch(e){ return ""; }
}

function renderQuestRow(q, canEdit){
  var qType = questTypeOf(q);
  var st = questStatusOf(q);
  var pr = questProgress(q);
  var open = state.questOpenId === q.id;
  var meta = st === "completada" ? iconoUI('hecho') + ' Completada' + (q.completedAt ? ' · ' + questDateLabel(q.completedAt) : '')
    : (st === "fallida" ? iconoUI('cerrar') + ' Fallida' : pr.done + '/' + pr.total + ' objetivos');
  var html = '<div class="quest-row ' + qType + ' ' + st + (open ? ' is-open' : '') + '" id="questrow-'+q.id+'">'+
    '<div class="quest-row-head" role="button" tabindex="0" aria-expanded="'+(open?'true':'false')+'" data-action="toggle-quest-open" data-id="'+q.id+'">'+
      (q.image ? '<img class="quest-row-thumb" src="'+esc(q.image)+'" alt="" loading="lazy">' : '<span class="quest-row-icon">'+(q.house===true ? icono('casa',{tam:'s'}) : (qType === "principal" ? icono('estrella',{tam:'s'}) : '◈'))+'</span>')+
      '<div class="quest-row-main">'+
        '<div class="quest-row-title">'+esc(q.title || "Misión sin título")+'</div>'+
        '<div class="quest-row-bar"><div class="quest-row-fill" style="width:'+pr.pct+'%;"></div></div>'+
        '<div class="quest-row-meta">'+meta+'</div>'+
      '</div>'+
      '<span class="quest-row-chevron">'+(open ? '▾' : '▸')+'</span>'+
    '</div>';
  if(open){
    html += '<div class="quest-row-body">'+renderQuestCard(q, canEdit);
    if(canEdit){
      html += st === "activa"
        ? '<button type="button" class="btn-solid-gold quest-done-btn" data-action="quest-complete" data-id="'+q.id+'">'+iconoUI('hecho')+' Marcar como completada</button>'
        : '<button type="button" class="btn-compact quest-done-btn" data-action="quest-reopen" data-id="'+q.id+'">↺ Reabrir</button>';
    }
    html += '</div>';
  }
  return html + '</div>';
}

function renderQuestList(quests, canEdit){
  var v = questView();
  var needle = questNorm((state.questSearch || "").trim());
  var list = quests.filter(function(q){
    if(questStatusOf(q) !== v.st) return false;
    if(v.tp === "principal" || v.tp === "secundaria"){ if(questTypeOf(q) !== v.tp) return false; }
    if(v.tp === "casa" && q.house !== true) return false;
    return questMatchesSearch(q, needle);
  });
  if(!list.length){
    return '<div class="quest-empty-cat">'+(needle ? 'Ninguna misión coincide con la búsqueda.' : 'No hay misiones en esta vista.')+'</div>';
  }
  if(v.st === "completada"){
    list.sort(function(a, b){ return (b.completedAt || 0) - (a.completedAt || 0); });
  } else {
    list.sort(function(a, b){ return (questTypeOf(a) === "principal" ? 0 : 1) - (questTypeOf(b) === "principal" ? 0 : 1); });
  }
  var html = "";
  var group = v.tp === "all" && v.st !== "completada" && list.length > 4;
  var lastType = null;
  list.forEach(function(q){
    if(group && questTypeOf(q) !== lastType){
      lastType = questTypeOf(q);
      var n = list.filter(function(x){ return questTypeOf(x) === lastType; }).length;
      html += '<div class="quest-section-header '+lastType+'"><span>'+(lastType === "principal" ? icono('estrella',{tam:'s'})+' Principales' : '◈ Secundarias')+' · '+n+'</span></div>';
    }
    html += renderQuestRow(q, canEdit);
  });
  return html;
}

function renderQuestBrowser(quests, canEdit){
  var v = questView();
  var cnt = { activa: 0, completada: 0, fallida: 0 };
  quests.forEach(function(q){ cnt[questStatusOf(q)]++; });
  var typeBtn = function(id, label){
    return '<button type="button" class="quest-filter-btn'+(v.tp===id?' active':'')+'" data-action="filter-quest-type" data-filter="'+id+'">'+label+'</button>';
  };
  var html = '<div class="quest-filters">'+
    '<div class="k-seg">'+
      '<button type="button" class="k-seg-btn'+(v.st==="activa"?' active':'')+'" data-action="filter-quest-status" data-filter="activa">En curso ('+cnt.activa+')</button>'+
      '<button type="button" class="k-seg-btn'+(v.st==="completada"?' active':'')+'" data-action="filter-quest-status" data-filter="completada">Completadas ('+cnt.completada+')</button>'+
      (cnt.fallida || v.st === "fallida" ? '<button type="button" class="k-seg-btn'+(v.st==="fallida"?' active':'')+'" data-action="filter-quest-status" data-filter="fallida">Fallidas ('+cnt.fallida+')</button>' : '')+
    '</div>'+
    '<div class="quest-type-chips">'+
      typeBtn("all", "Todas")+typeBtn("principal", icono('estrella',{tam:'s'})+" Principal")+typeBtn("secundaria", "◈ Secundaria")+typeBtn("casa", icono('casa',{tam:'s'})+" Casa")+
    '</div>'+
    '<div class="quest-search-wrap">'+
      '<input type="text" class="quest-search-input k-input" id="questSearchInput" value="'+esc(state.questSearch || "")+'" placeholder="Buscar misión" autocomplete="off">'+
      '<button type="button" class="quest-search-clear" data-action="clear-quest-search" title="Borrar búsqueda"'+((state.questSearch || "") ? '' : ' hidden')+'>'+iconoUI('cerrar')+'</button>'+
    '</div>'+
  '</div>';
  if(!quests.length){
    return html + '<div class="quest-empty-box">'+
      '<div style="font-size:1.8rem;margin-bottom:6px;">'+icono('brujula',{tam:'m'})+'</div>'+
      '<div style="font-family:var(--font-display);font-size:1rem;color:var(--gold-light);">Sin misiones registradas</div>'+
      '<p style="font-size:0.82rem;color:var(--ink-faint);margin:4px 0 0;">El Máster aún no ha asignado objetivos de campaña a los aventureros.</p>'+
    '</div>';
  }
  return html + '<div id="questListBox">'+renderQuestList(quests, canEdit)+'</div>';
}
