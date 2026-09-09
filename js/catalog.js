function tplMundoArmas(s){
  var catalog = s.weaponsCatalog || [];
  var canEdit = isGM();
  var html = '<div class="section'+(canEdit?' gm-section':'')+'"><div class="section-title"><span>'+(canEdit?'Catálogo de Armas (GM)':'Catálogo de Armas')+'</span></div>';
  
  catalog.forEach(function(w){
    var isLocked = (w.visible === false);
    html += '<div class="creature-card weapon-card'+(isLocked?' is-locked':'')+'">'+
      '<div class="creature-card-header">'+
        '<div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0;flex-wrap:wrap;">'+
          (canEdit ? '<input type="text" class="creature-name-input" data-scope="global" data-bind="weaponsCatalog.'+w.id+'.name" value="'+esc(w.name)+'" placeholder="Nombre del arma">' : '<div style="font-family:var(--font-display);color:var(--gold-light);font-size:1.02rem;font-weight:700;">'+esc(w.name)+'</div>')+
          (isLocked ? '<span class="weapon-status-badge locked" title="Arma bloqueada por el Máster">🔒 Bloqueada</span>' : '<span class="weapon-status-badge visible" title="Arma visible y usable para todos">👁️ Visible</span>')+
        '</div>'+
        (canEdit ? '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">'+
          '<button class="btn-compact btn-lock-weapon '+(isLocked?'locked':'')+'" data-action="toggle-weapon-visibility" data-id="'+w.id+'" title="'+(isLocked?'Desbloquear arma para jugadores':'Bloquear arma para jugadores')+'">'+(isLocked?'🔓 Desbloquear':'🔒 Bloquear')+'</button>'+
          '<button class="row-del" data-action="del-global-weapon" data-id="'+w.id+'" aria-label="Eliminar arma">✕</button>'+
        '</div>' : '')+
      '</div>'+
      '<div class="creature-grid" style="grid-template-columns:1fr 1fr;">'+
        (canEdit ? '<div class="creature-field"><label>Daño Base</label><input type="text" data-scope="global" data-bind="weaponsCatalog.'+w.id+'.dano" value="'+esc(w.dano)+'"></div>' : '<div class="creature-field"><label>Daño</label><span style="font-size:.8rem;color:var(--ink-dim);">'+esc(w.dano||"-")+'</span></div>')+
        (canEdit ? '<div class="creature-field"><label>Alcance</label><input type="text" data-scope="global" data-bind="weaponsCatalog.'+w.id+'.alcance" value="'+esc(w.alcance)+'"></div>' : '<div class="creature-field"><label>Alcance</label><span style="font-size:.8rem;color:var(--ink-dim);">'+esc(w.alcance||"-")+'</span></div>')+
      '</div>'+
      (canEdit ? '<div class="creature-field" style="margin-bottom:6px;"><label style="color:#FDE047;">Efecto en Crítico</label><input type="text" data-scope="global" data-bind="weaponsCatalog.'+w.id+'.critico" value="'+esc(w.critico)+'" placeholder="Ej: Doble daño / Sangrado"></div>' : (w.critico?'<p style="font-size:.75rem;color:#FDE047;margin-bottom:6px;"><b>Crítico:</b> '+esc(w.critico)+'</p>':''))+
      (canEdit ? '<div class="creature-field"><label>Descripción / Lore</label><textarea class="creature-notes" data-scope="global" data-bind="weaponsCatalog.'+w.id+'.desc">'+esc(w.desc)+'</textarea></div>' : (w.desc?'<p style="font-size:.78rem;color:var(--ink-dim);">'+esc(w.desc)+'</p>':''))+
    '</div>';
  });
  
  if(canEdit){
    html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-global-weapon">+ Añadir nueva arma al compendio global</button>';
  }
  html += '</div>';
  return html;
}

function tplMundoBuffs(s){
  var canEdit = isGM();
  var html = '<div class="section'+(canEdit?' gm-section':'')+'"><div class="section-title"><span>'+(canEdit?'Catálogo de Buffos y Debuffos (GM)':'Buffos y Debuffos')+'</span></div>';
  
  var visibleBuffs = (s.buffCatalog||[]).filter(function(b){
    if(canEdit) return true;
    return b.visible !== false;
  });

  html += '<div class="filter-pills" style="margin-bottom:10px;">'+
    '<button class="f-pill '+(currentBuffTab==='buffs'?'active':'')+'" data-action="set-buff-tab" data-val="buffs">Buffs</button>'+
    '<button class="f-pill '+(currentBuffTab==='debuffs'?'active':'')+'" data-action="set-buff-tab" data-val="debuffs">Debuffs</button>'+
    '<button class="f-pill '+(currentBuffTab==='all'?'active':'')+'" data-action="set-buff-tab" data-val="all">Todos</button>'+
  '</div>';

  visibleBuffs.forEach(function(b){
    var showType = currentBuffTab==="all" || (currentBuffTab==="buffs" && b.type==="buff") || (currentBuffTab==="debuffs" && b.type==="debuff");
    if(!showType) return;

    var attrOptions = '<option value="">-- Seleccionar --</option>'+
      '<optgroup label="Atributos">'+
        ATTRS.map(function(a){
          return '<option value="'+a+'" '+((b.attr||'')===a?'selected':'')+'>'+ATTR_LABELS[a]+'</option>';
        }).join('')+
      '</optgroup>'+
      '<optgroup label="Habilidades">'+
        SKILL_DEFS.map(function(sk){
          return '<option value="'+sk.id+'" '+((b.attr||'')===sk.id?'selected':'')+'>'+esc(sk.name)+'</option>';
        }).join('')+
      '</optgroup>'+
      '<optgroup label="Otros">'+
        '<option value="todo" '+((b.attr||'')==='todo'?'selected':'')+'>Todo</option>'+
        '<option value="vida" '+((b.attr||'')==='vida'?'selected':'')+'>Vida</option>'+
        '<option value="daño" '+((b.attr||'')==='daño'?'selected':'')+'>Daño</option>'+
        '<option value="veneno" '+((b.attr||'')==='veneno'?'selected':'')+'>Veneno</option>'+
        '<option value="iniciativa" '+((b.attr||'')==='iniciativa'?'selected':'')+'>Iniciativa</option>'+
        '<option value="movilidad" '+((b.attr||'')==='movilidad'?'selected':'')+'>Movilidad</option>'+
        '<option value="defensa" '+((b.attr||'')==='defensa'?'selected':'')+'>Defensa</option>'+
        '<option value="defensaMagica" '+((b.attr||'')==='defensaMagica'?'selected':'')+'>Defensa Mágica</option>'+
      '</optgroup>';

    html += '<div class="creature-card">'+
      '<div class="creature-card-header">'+
        (canEdit ? '<input type="text" class="creature-name-input" data-scope="global" data-bind="buffCatalog.'+b.id+'.name" value="'+esc(b.name)+'" placeholder="Nombre del buffo">' : '<div style="font-family:var(--font-display);color:var(--gold-light);font-size:1.02rem;">'+esc(b.name)+'</div>')+
        (canEdit ? '<div style="display:flex;gap:4px;align-items:center;">'+
          '<select style="font-size:.72rem;background:var(--bg-card);padding:2px 4px;border:1px solid var(--line);border-radius:5px;color:var(--ink);" data-scope="global" data-bind="buffCatalog.'+b.id+'.type">'+
            '<option value="buff" '+((b.type||'buff')==='buff'?'selected':'')+'>Buff</option>'+
            '<option value="debuff" '+((b.type||'buff')==='debuff'?'selected':'')+'>Debuff</option>'+
          '</select>'+
          '<button class="btn-compact" data-action="toggle-buff-visibility" data-id="'+b.id+'" title="Mostrar/Ocultar">'+(b.visible!==false?'👁️':'🙈')+'</button>'+
          '<button class="row-del" data-action="del-global-buff" data-id="'+b.id+'" aria-label="Eliminar">✕</button>'+
        '</div>' : '<span style="font-size:.7rem;color:'+(b.type==='debuff'?'var(--danger)':'var(--teal-light)')+';">'+(b.type==='debuff'?'Debuff':'Buff')+'</span>')+
      '</div>'+
      '<div class="creature-grid" style="grid-template-columns:1fr 1fr 1fr 1fr;">'+
        (canEdit ? '<div class="creature-field"><label>Atributo/Afecta</label>'+
          '<select style="font-size:.72rem;background:var(--bg-card);padding:2px 4px;border:1px solid var(--line);border-radius:5px;color:var(--ink);" data-scope="global" data-bind="buffCatalog.'+b.id+'.attr">'+
            attrOptions+
          '</select></div>' : '<div class="creature-field"><label>Afecta</label><span style="font-size:.8rem;color:var(--ink-dim);">'+esc(b.attr||"-")+'</span></div>')+
        (canEdit ? '<div class="creature-field"><label>Bonus</label><input type="text" data-scope="global" data-bind="buffCatalog.'+b.id+'.bonus" value="'+esc(b.bonus)+'" placeholder="+1, -2, 1d6..."></div>' : '<div class="creature-field"><label>Bonus</label><span style="font-size:.8rem;color:var(--ink-dim);">'+esc(b.bonus||"-")+'</span></div>')+
        (canEdit ? '<div class="creature-field"><label>Duración</label>'+
          '<select style="font-size:.72rem;background:var(--bg-card);padding:2px 4px;border:1px solid var(--line);border-radius:5px;color:var(--ink);" data-scope="global" data-bind="buffCatalog.'+b.id+'.duration">'+
            '<option value="permanent" '+((b.duration||'permanent')==='permanent'?'selected':'')+'>Permanente</option>'+
            '<option value="turns" '+((b.duration||'permanent')==='turns'?'selected':'')+'>Por turnos</option>'+
          '</select></div>' : '<div class="creature-field"><label>Duración</label><span style="font-size:.8rem;color:var(--ink-dim);">'+esc(b.duration==='turns'?(b.durationTurns||0)+' turnos':'Permanente')+'</span></div>')+
        (canEdit && b.duration==='turns' ? '<div class="creature-field"><label>Nº Turnos</label><input type="number" min="1" data-scope="global" data-bind="buffCatalog.'+b.id+'.durationTurns" value="'+(b.durationTurns||1)+'"></div>' : '')+
      '</div>'+
      (canEdit ? '<div class="creature-field"><label>Descripción</label><textarea class="creature-notes" data-scope="global" data-bind="buffCatalog.'+b.id+'.desc">'+esc(b.desc)+'</textarea></div>' : (b.desc?'<p style="font-size:.78rem;color:var(--ink-dim);margin-top:4px;">'+esc(b.desc)+'</p>':''))+
    '</div>';
  });

  if(canEdit){
    html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-global-buff">+ Añadir nuevo buff/debuff</button>';
  }
  html += '</div>';
  return html;
}


async function pullSharedDataFromSupabase(){
  if(!supabaseClient) return;
  try{
    var res = await supabaseClient.from('campaign_map').select('*').eq('id', 'world_compendium').maybeSingle();
    if(res.data && res.data.data){
      var comp = res.data.data;
      if(comp.weaponsCatalog) state.weaponsCatalog = comp.weaponsCatalog;
      if(comp.bestiary) state.bestiary = comp.bestiary;
      if(comp.buffCatalog) state.buffCatalog = comp.buffCatalog;
      if(comp.lore) state.lore = comp.lore;
      if(comp.quests) state.quests = comp.quests;
      if(comp.questClues) state.questClues = comp.questClues;
      if(comp.questMap) state.questMap = comp.questMap;
      if(comp.sessionSummary !== undefined) state.sessionSummary = comp.sessionSummary;
    } else {
      // Fallback secundario si aún no existe el documento world_compendium
      try{
        var wRes = await supabaseClient.from('weapons_catalog').select('*');
        var bRes = await supabaseClient.from('bestiary').select('*');
        var bufRes = await supabaseClient.from('buff_catalog').select('*');
        if(wRes.data && wRes.data.length) state.weaponsCatalog = wRes.data;
        if(bRes.data && bRes.data.length){
          state.bestiary = bRes.data.map(function(b){
            return {
              id: b.id,
              nombre: b.nombre,
              tipo: b.tipo,
              continente: b.continente,
              rareza: b.rareza,
              montable: b.montable,
              absorcion: b.absorcion,
              defensa: b.defensa,
              movilidad: b.movilidad,
              notas: b.notas,
              habilidades: b.habilidades,
              visible: b.visible,
              image: b.image_url
            };
          });
        }
        if(bufRes.data && bufRes.data.length) state.buffCatalog = bufRes.data;
      }catch(errNorm){}
    }
    saveState(true);
    if(["mundo","bestiario","mision"].indexOf(state.activeTab)!==-1){
      if(!document.activeElement || !document.activeElement.matches("input, textarea")) renderTab();
    }
  }catch(e){ console.error('Supabase error:', e); }
}

function pushSharedData(patch){
  if(!supabaseClient) return;
  if(currentUser && !isGM()) return;
  var dataPatch = patch || {
    weaponsCatalog: state.weaponsCatalog || [],
    bestiary: state.bestiary || [],
    lore: state.lore || getSeedLore(),
    buffCatalog: state.buffCatalog || getSeedBuffCatalog(),
    quests: state.quests || [],
    questClues: state.questClues || [],
    questMap: state.questMap || { name: "Mapa de la Misión", image: null, notes: "" },
    sessionSummary: state.sessionSummary || ""
  };
  supabaseClient.rpc('update_campaign_map', {
    map_id: 'world_compendium',
    patch: dataPatch
  }).then(function(res){
    if(res.error) { console.error('Error en update_campaign_map (world_compendium):', res.error); return; }
    updateSyncBadge("synced");
  }).catch(function(e){ console.error('Supabase error:', e); });
}
