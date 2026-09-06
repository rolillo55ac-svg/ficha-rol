// ============================================================================
// KRYSALIS RPG - MÓDULO: QUESTS
// Misiones, pistas y mapa de misiones
// ============================================================================

function tplMision(c, s){
  var canEdit = isGM() || !currentUser;
  var quests = s.quests || [];
  var clues = s.questClues || [];
  var qMap = s.questMap || { name: "Mapa de la Misión", image: null, notes: "" };

  var html = '<div class="section'+(canEdit?' gm-section':'')+'">'+
    '<div class="section-title">'+
      '<span>🧭 Diario de Misión y Campaña'+(canEdit?' (GM)':'')+'</span>'+
      (canEdit ? '<button class="btn-compact" data-action="add-quest">+ Nueva Misión</button>' : '')+
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
    html += '<div style="padding:24px 10px;text-align:center;color:var(--ink-faint);font-size:0.8rem;border:1px dashed var(--line);border-radius:var(--radius-sm);">No hay plano fijado para esta misión actualmente.</div>';
  }
  html += '</div>';

  // 3. Misiones y Objetivos
  html += '<div class="section-title" style="margin-top:14px;">'+
    '<span>Objetivos y Misiones ('+quests.length+')</span>'+
  '</div>';

  if(!quests.length){
    html += '<p style="font-size:0.82rem;color:var(--ink-faint);margin-bottom:12px;">Sin misiones registradas.</p>';
  } else {
    quests.forEach(function(q){
      var st = q.status || "activa";
      var badgeClass = st === "completada" ? "completada" : (st === "fallida" ? "fallida" : "activa");
      var badgeLabel = st === "completada" ? "Completada" : (st === "fallida" ? "Fallida" : "Activa");

      html += '<div class="quest-card '+(st==="completada"?"completed":(st==="fallida"?"failed":"active"))+'">'+
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap;">'+
          '<div style="flex:1;min-width:0;">'+
            (canEdit ?
              '<input type="text" style="font-family:var(--font-display);font-size:1rem;color:var(--gold-light);background:transparent;border:none;border-bottom:1px solid var(--line);width:100%;margin-bottom:4px;" data-scope="global" data-bind="quests.'+q.id+'.title" value="'+esc(q.title)+'">' :
              '<div style="font-family:var(--font-display);font-size:1rem;color:var(--gold-light);margin-bottom:4px;">'+esc(q.title)+'</div>'
            )+
            (canEdit ?
              '<textarea style="width:100%;min-height:38px;background:rgba(0,0,0,0.14);border:1px solid var(--line);border-radius:4px;padding:4px 6px;font-size:0.8rem;color:var(--ink-dim);resize:vertical;" data-scope="global" data-bind="quests.'+q.id+'.desc">'+esc(q.desc||"")+'</textarea>' :
              (q.desc ? '<div style="font-size:0.8rem;color:var(--ink-dim);line-height:1.4;">'+esc(q.desc)+'</div>' : '')
            )+
          '</div>'+
          '<div style="display:flex;gap:6px;align-items:center;">'+
            (canEdit ?
              '<select style="font-size:0.7rem;background:var(--bg-card);padding:2px 6px;" data-scope="global" data-bind="quests.'+q.id+'.status">'+
                '<option value="activa" '+(st==="activa"?"selected":"")+'>🟡 Activa</option>'+
                '<option value="completada" '+(st==="completada"?"selected":"")+'>🟢 Completada</option>'+
                '<option value="fallida" '+(st==="fallida"?"selected":"")+'>🔴 Fallida</option>'+
              '</select>' :
              '<span class="quest-status-badge '+badgeClass+'">'+badgeLabel+'</span>'
            )+
            (canEdit ? '<button class="row-del" data-action="del-quest" data-id="'+q.id+'" title="Eliminar misión">✕</button>' : '')+
          '</div>'+
        '</div>';

      // Tareas de la misión
      var tasks = q.tasks || [];
      html += '<ul class="quest-task-list">';
      tasks.forEach(function(tk){
        html += '<li class="quest-task-item'+(tk.done?' done':'')+'">'+
          '<input type="checkbox" class="quest-task-cb" data-action="toggle-quest-task" data-qid="'+q.id+'" data-tid="'+tk.id+'" '+(tk.done?'checked':'')+'>'+
          '<span style="flex:1;">'+esc(tk.text)+'</span>'+
          (canEdit ? '<button class="row-del" data-action="del-quest-task" data-qid="'+q.id+'" data-tid="'+tk.id+'" style="width:20px;height:20px;font-size:0.7rem;">✕</button>' : '')+
        '</li>';
      });
      html += '</ul>';

      if(canEdit){
        html += '<button class="btn-compact" style="margin-top:8px;font-size:0.7rem;" data-action="add-quest-task" data-id="'+q.id+'">+ Añadir Tarea</button>';
      }
      html += '</div>';
    });
  }

  // 4. Pistas y Descubrimientos de la Sesión
  html += '<div class="section-title" style="margin-top:16px;">'+
    '<span>Pistas y Hallazgos Clave</span>'+
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
          '<button class="btn-compact" data-action="url-clue-img" data-id="'+cl.id+'" style="font-size:0.68rem;">'+(cl.image?'Cambiar URL':'Pegar URL')+'</button>'+
          (cl.image ? '<button class="btn-compact" data-action="remove-clue-img" data-id="'+cl.id+'" style="font-size:0.68rem;">Quitar Foto</button>' : '')+
        '</div>';
      }
      html += '</div>';
    });
    html += '</div>';
  }

  // 5. Cuaderno personal del aventurero (Notas privadas del jugador)
  html += '<div class="section-title" style="margin-top:18px;">'+
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
