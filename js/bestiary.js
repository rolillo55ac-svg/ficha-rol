// ============================================================================
// KRYSALIS RPG - MÓDULO: BESTIARY
// Bestiario y criaturas del mundo
// ============================================================================

function creatureField(label,bind,val){
  return '<div class="creature-field"><label>'+esc(label)+'</label><input type="text" data-bind="'+bind+'" value="'+esc(val)+'"></div>';
}

function tplBestiario(s){
  var canEdit = isGM() || !currentUser;
  var pills = CONTINENTES.map(function(ct){
    return '<button class="f-pill '+(bestiaryContinentFilter===ct?'active':'')+'" data-action="set-bestiary-continent" data-continent="'+ct+'">'+ct+'</button>';
  }).join('');

  var rarityList = ["Todos"].concat(RAREZAS_LIST);
  var rarityPills = rarityList.map(function(r){
    var col = r==="Legendaria"?"#FDE047":r==="Muy rara"?"#C084FC":r==="Rara"?"#60A5FA":r==="Común"?"#C2B196":"var(--ink-dim)";
    var isAct = bestiaryRarityFilter === r;
    return '<button class="f-pill '+(isAct?'active':'')+'" data-action="set-bestiary-rarity" data-val="'+r+'" style="border-color:'+col+';'+(isAct?'background:'+col+';color:#120D0A;font-weight:700;':'color:'+col+';')+'">'+r+'</button>';
  }).join('');

  var mountPills = [
    {id:"Todos", label:"Todas"},
    {id:"monturas", label:"🐎 Solo Monturas"},
    {id:"no_monturas", label:"🚶 No montables"}
  ].map(function(m){
    return '<button class="f-pill '+(bestiaryMountFilter===m.id?'active':'')+'" data-action="set-bestiary-mount" data-val="'+m.id+'">'+m.label+'</button>';
  }).join('');

  var visibleBestiary = (s.bestiary||[]).filter(function(b){
    var matchCont = bestiaryContinentFilter==="Todos" || (b.continente||"Todos")===bestiaryContinentFilter;
    var matchRar = bestiaryRarityFilter==="Todos" || (b.rarity||"Común")===bestiaryRarityFilter;
    var matchMount = bestiaryMountFilter==="Todos" || (bestiaryMountFilter==="monturas" ? !!b.montable : !b.montable);
    if(canEdit) return matchCont && matchRar && matchMount;
    return b.visible !== false && matchCont && matchRar && matchMount;
  });

  var html = '<div class="section'+(canEdit?' gm-section':'')+'">'+
    '<div class="section-title"><span>'+(canEdit?'Bestiario y Monturas (GM)':'Bestiario y Monturas')+'</span></div>'+
    '<div class="filter-section"><div class="filter-label">Continente</div><div class="filter-pills">'+pills+'</div></div>'+
    '<div class="filter-section"><div class="filter-label">Rareza</div><div class="filter-pills">'+rarityPills+'</div></div>'+
    '<div class="filter-section"><div class="filter-label">Tipo</div><div class="filter-pills">'+mountPills+'</div></div>';

  visibleBestiary.forEach(function(b){
    var imgStyle = b.image ? ' style="background-image:url(\''+b.image+'\')"' : '';
    var rName = b.rarity || "Común";
    var rClass = "rarity-" + rName.toLowerCase().replace(/\s+/g,"");
    var bClass = "badge-" + rName.toLowerCase().replace(/\s+/g,"");

    html += '<div class="creature-card '+rClass+'">'+
      '<div class="creature-card-header">'+
        '<div style="display:flex;align-items:center;gap:6px;flex:1;min-width:0;flex-wrap:wrap;">'+
          (canEdit ? '<input type="text" class="creature-name-input" data-scope="global" placeholder="Nombre de criatura" data-bind="bestiary.'+b.id+'.nombre" value="'+esc(b.nombre)+'">' : '<div style="font-family:var(--font-display);color:var(--gold-light);font-size:1.05rem;font-weight:700;">'+esc(b.nombre)+'</div>')+
          '<span class="item-badge '+bClass+'">'+rName+'</span>'+
          '<span class="mount-pill '+(b.montable?'is-mount':'no-mount')+'">'+(b.montable?'🐎 Montura':'🚶 No montable')+'</span>'+
        '</div>'+
        '<div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap;">'+
          (canEdit ? '<select style="font-size:.72rem;background:var(--bg-card);padding:2px 4px;border:1px solid var(--line);" data-scope="global" data-bind="bestiary.'+b.id+'.rarity" title="Rareza">'+
            RAREZAS_LIST.map(function(r){return '<option value="'+r+'" '+((b.rarity||"Común")===r?'selected':'')+'>'+r+'</option>';}).join('')+
          '</select>' : '')+
          (canEdit ? '<select style="font-size:.72rem;background:var(--bg-card);padding:2px 4px;border:1px solid var(--line);" data-scope="global" data-bind="bestiary.'+b.id+'.continente" title="Continente">'+
            CONTINENTES.map(function(ct){return '<option value="'+ct+'" '+((b.continente||"Todos")===ct?'selected':'')+'>'+ct+'</option>';}).join('')+
          '</select>' : '<span style="font-size:.7rem;color:var(--ink-dim);">'+esc(b.continente||"Todos")+'</span>')+
          (canEdit ? '<button class="btn-compact '+(b.montable?'btn-solid-gold':'')+'" data-action="toggle-bestiary-mountable" data-id="'+b.id+'" title="Alternar si es montura">'+(b.montable?'🐎 Montable':'🚶 No montable')+'</button>' : '')+
          (canEdit ? '<button class="btn-compact" data-action="toggle-bestiary-visibility" data-id="'+b.id+'" title="Mostrar/Ocultar para jugadores">'+(b.visible!==false?'👁️':'🙈')+'</button>' : '')+
          (canEdit ? '<button class="row-del" data-action="del-bestiary" data-id="'+b.id+'" aria-label="Eliminar criatura">✕</button>' : '')+
        '</div>'+
      '</div>'+
      '<div class="creature-layout">'+
        '<div class="creature-profile-box">'+
          '<div class="creature-avatar-img"'+imgStyle+' title="'+esc(b.nombre)+'">'+(b.image ? '' : '🐉')+'</div>'+
          (canEdit ? '<div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:center;margin-top:2px;">'+
            '<button class="btn-compact" data-action="upload-bestiary-img" data-id="'+b.id+'" title="Subir foto desde archivo">Foto</button>'+
            '<button class="btn-compact" data-action="url-bestiary-img" data-id="'+b.id+'" title="Pegar URL de foto">URL</button>'+
            (b.image ? '<button class="btn-compact" data-action="remove-bestiary-img" data-id="'+b.id+'" title="Quitar foto">✕</button>' : '')+
          '</div>' : '')+
        '</div>'+
        '<div style="flex:1;min-width:0;">'+
          '<div class="creature-grid">'+
            (canEdit ? creatureFieldGlobal("Vida","bestiary."+b.id+".vida",b.vida) : '<div class="creature-field"><label>Vida</label><span style="font-size:.8rem;color:var(--ink-dim);">'+esc(b.vida||"-")+'</span></div>')+
            (canEdit ? creatureFieldGlobal("Defensa","bestiary."+b.id+".defensa",b.defensa) : '<div class="creature-field"><label>Defensa</label><span style="font-size:.8rem;color:var(--ink-dim);">'+esc(b.defensa||"-")+'</span></div>')+
            (canEdit ? creatureFieldGlobal("Absorción","bestiary."+b.id+".absorcion",b.absorcion) : '<div class="creature-field"><label>Absorción</label><span style="font-size:.8rem;color:var(--ink-dim);">'+esc(b.absorcion||"-")+'</span></div>')+
            (canEdit ? creatureFieldGlobal("Daño","bestiary."+b.id+".dano",b.dano) : '<div class="creature-field"><label>Daño</label><span style="font-size:.8rem;color:var(--ink-dim);">'+esc(b.dano||"-")+'</span></div>')+
            '<div class="creature-field beast-mobility-cell">'+
              '<label>Movilidad (Casillas)</label>'+
              '<button type="button" class="beast-mov-btn" data-action="pick-beast-mov" data-id="'+b.id+'" title="Haz clic para seleccionar o consultar las casillas de movimiento">'+
                '<span class="beast-mov-label">🏃 <strong>'+esc(b.casillasMovimiento || (b.movilidad ? (b.movilidad.match(/\d+/)?b.movilidad.match(/\d+/)[0]:'8') : '8'))+'</strong> casillas</span>'+
                (b.movilidad && b.movilidad.includes('(') ? ' <span class="beast-terrain-pill">'+esc(b.movilidad.slice(b.movilidad.indexOf('(')))+'</span>' : '')+
                '<span class="beast-mov-chevron">▾</span>'+
              '</button>'+
            '</div>'+
            (canEdit ? creatureFieldGlobal("Doma (Dif.)","bestiary."+b.id+".doma",b.doma||"3") : '<div class="creature-field"><label>Doma (Dif.)</label><span style="font-size:.8rem;color:var(--gold-light);font-weight:700;">🎯 Dif. '+(b.doma||"-")+'</span></div>')+
          '</div>'+
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;gap:6px;flex-wrap:wrap;">'+
            '<button class="tame-btn" data-action="roll-tame" data-name="'+esc(b.nombre)+'" data-diff="'+(b.doma||"3")+'" title="Realizar tirada de doma con d10">🎲 Tirada de Doma (Dif. '+(b.doma||"3")+')</button>'+
          '</div>'+
          '<div class="creature-field" style="margin-top:6px;"><label>Habilidades y Rasgos</label>'+
            (canEdit ? '<textarea class="creature-notes" data-scope="global" data-bind="bestiary.'+b.id+'.habilidades">'+esc(b.habilidades||b.notas||"")+'</textarea>' : (b.habilidades||b.notas?'<p style="font-size:.78rem;color:var(--ink-dim);margin-top:4px;">'+esc(b.habilidades||b.notas)+'</p>':''))+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>';
  });
  
  if(canEdit){
    html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-bestiary">+ Añadir criatura</button>';
  }
  html += '</div>';
  return html;
}


function creatureFieldGlobal(label,bind,val){
  return '<div class="creature-field"><label>'+esc(label)+'</label><input type="text" data-scope="global" data-bind="'+bind+'" value="'+esc(val)+'"></div>';
}

function setBeastMobility(beastId, numVal){
  var beast = (state.bestiary || []).find(function(x){ return x.id === beastId; });
  if(!beast) return;
  var clamped = Math.max(1, Math.min(60, numVal));
  beast.casillasMovimiento = String(clamped);
  if(beast.movilidad && beast.movilidad.includes('(')){
    var parenPart = beast.movilidad.slice(beast.movilidad.indexOf('('));
    beast.movilidad = clamped + ' ' + parenPart;
  } else {
    beast.movilidad = String(clamped);
  }
  saveState(true);
  if(isGM() || !currentUser){
    pushSharedData();
  }
  if(typeof openBeastMobilityModal === 'function') openBeastMobilityModal(beastId);
  renderTab();
}

function stepBeastMobility(beastId, delta){
  var beast = (state.bestiary || []).find(function(x){ return x.id === beastId; });
  if(!beast) return;
  var cur = parseInt(beast.casillasMovimiento || (beast.movilidad ? (beast.movilidad.match(/\d+/)?beast.movilidad.match(/\d+/)[0]:'8') : '8'), 10) || 8;
  setBeastMobility(beastId, cur + delta);
}
