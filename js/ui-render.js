function renderTopbar(){
  var c = activeChar();
  if(document.body) document.body.setAttribute("data-theme", c.theme||"default");
  var curPv = num(c.combat.pvActual, 0);
  var maxHp = getEffectiveMaxHp(c);
  var maxMana = getEffectiveMaxMana(c);
  var rawMaxHp = Math.max(1, num(c.combat.pvMax, 1));
  var isHpDebuffed = maxHp < rawMaxHp;
  var hpPct = curPv <= 0 ? 0 : clamp(Math.round((curPv/maxHp)*100), 0, 100);
  var manaPct = clamp(Math.round((num(c.combat.manaActual,0)/maxMana)*100), 0, 100);
  var crestStyle = c.portrait ? ' style="background-image:url(\''+c.portrait+'\')"' : '';
  var isNPC = !!c.isNPC;
  var crestClass = isNPC ? 'char-crest npc' : 'char-crest';
  var nameClass = isNPC ? 'char-name npc-name' : 'char-name';

  var hpNumsClass = curPv < 0 ? 'gauge-nums dying' : (curPv === 0 ? 'gauge-nums unconscious' : 'gauge-nums');
  var hpStatusBadge = curPv < 0 ? '<span class="status-pill dying">💀 Agonizando ('+curPv+')</span>' : (curPv === 0 ? '<span class="status-pill unconscious">💤 Inconsciente</span>' : '');
  var hpDebuffBadge = isHpDebuffed ? ' <small style="color:#E88178;font-weight:700;" title="Vida máxima reducida por debuff (Base: '+rawMaxHp+')">⚠️ Reducida de '+rawMaxHp+'</small>' : '';

  var crestContent = (c.portrait && c.portrait.trim())
    ? '<img src="' + esc(c.portrait) + '" alt="' + esc(c.name) + '" class="crest-img" onerror="this.style.display=\'none\';if(this.nextElementSibling)this.nextElementSibling.style.display=\'flex\';"><span class="crest-initial" style="display:none;">' + esc(c.name.charAt(0).toUpperCase()) + '</span>'
    : '<span class="crest-initial">' + esc(c.name.charAt(0).toUpperCase()) + '</span>';

  var canEdit = canEditChar(c);
  var roleBadgeHtml = '';
  if(isGM()){
    roleBadgeHtml = '<span class="role-badge gm">★ GM</span>';
    if(!isNPC){
      if(c.ownerEmail){
        roleBadgeHtml += '<span class="char-owner-topbar-tag" title="Asignado a ' + esc(c.ownerEmail) + '">👤 ' + esc(c.ownerEmail) + '</span>';
      } else {
        roleBadgeHtml += '<span class="char-owner-topbar-tag unassigned" title="Personaje sin jugador asignado">○ Libre</span>';
      }
    }
  } else if(currentUser){
    if(canEdit){
      roleBadgeHtml = '<span class="role-badge player" title="Tu personaje (Control total)">Jugador</span>';
    } else {
      roleBadgeHtml = '<span class="role-badge spectator" title="Modo Espectador: Solo lectura">👁️ Espectador</span>';
    }
  } else {
    roleBadgeHtml = '<span class="role-badge player">Local</span>';
  }

  var unreadTickets = 0;
  try {
    var myT = (typeof getPlayerTickets === "function") ? getPlayerTickets() : [];
    unreadTickets = myT.filter(function(t){ return t.adminReply && !t.readReply; }).length;
  } catch(eBad){}
  var feedbackBadgeHtml = unreadTickets > 0 ? ('<span class="nav-unread-badge">' + unreadTickets + '</span>') : '';
  var feedbackBtnClass = unreadTickets > 0 ? 'icon-btn has-badge' : 'icon-btn';
  var feedbackTitle = unreadTickets > 0 ? ('Reportes y Sugerencias (' + unreadTickets + ' respuesta nueva)') : 'Reportes y Sugerencias';

  document.getElementById("topbar").innerHTML =
    '<div class="topbar-row">'+
      '<button class="char-switch" data-action="open-char-modal" aria-label="Cambiar personaje">'+
        '<span class="'+crestClass+'"'+crestStyle+'>'+crestContent+'</span>'+
        '<span class="char-info-box">'+
          '<div class="'+nameClass+'">'+esc(c.name)+'</div>'+
          '<div class="char-sub">'+(isNPC?'NPC · ':'Nv. '+esc(c.nivel||"1")+' · ')+esc(c.trabajo||"Aventurero")+'</div>'+
        '</span>'+
      '</button>'+
      '<div class="topbar-actions">'+
        '<span id="syncBadge" class="sync-status">'+(currentUser?'● Nube':'○ Local')+'</span>'+
        roleBadgeHtml+
        '<button class="' + feedbackBtnClass + '" data-action="open-feedback-modal" title="' + feedbackTitle + '" aria-label="Reportes">📬' + feedbackBadgeHtml + '</button>'+
        '<button class="icon-btn" data-action="open-data-modal" title="Ajustes y Sesión" aria-label="Ajustes">&#9881;</button>'+
      '</div>'+
    '</div>'+
    '<div class="gauges">'+
      '<div class="gauge-wrap">'+
        '<div class="gauge-label"><span>Vida '+hpStatusBadge+hpDebuffBadge+'</span><span class="'+hpNumsClass+'">'+curPv+' / '+maxHp+'</span></div>'+
        '<div class="gauge"><div class="gauge-fill hp" style="width:'+hpPct+'%;'+(curPv<=0?'background:#8C252F;':'')+'"></div></div>'+
        (canEdit ? ('<div class="gauge-adjust">'+
          '<button data-action="hp-mod" data-delta="-5" aria-label="Restar 5 vida">-5</button><button data-action="hp-mod" data-delta="-1" aria-label="Restar 1 vida">-1</button>'+
          '<button data-action="hp-mod" data-delta="1" aria-label="Sumar 1 vida">+1</button><button data-action="hp-mod" data-delta="5" aria-label="Sumar 5 vida">+5</button>'+
        '</div>') : '')+
      '</div>'+
      '<div class="gauge-wrap">'+
        '<div class="gauge-label"><span style="color:var(--shield-light);" title="El Escudo y la Vida Falsa son equivalentes">🛡️ Escudo</span><span class="gauge-nums">'+num(c.combat.escudoActual,0)+'</span></div>'+
        '<div class="gauge"><div class="gauge-fill shield" style="width:'+clamp(num(c.combat.escudoActual,0)*10,0,100)+'%;"></div></div>'+
        (canEdit ? ('<div class="gauge-adjust">'+
          '<button data-action="shield-mod" data-delta="-3" aria-label="Restar 3 escudo">-3</button><button data-action="shield-mod" data-delta="-1" aria-label="Restar 1 escudo">-1</button>'+
          '<button data-action="shield-mod" data-delta="1" aria-label="Sumar 1 escudo">+1</button><button data-action="shield-mod" data-delta="3" aria-label="Sumar 3 escudo">+3</button>'+
        '</div>') : '')+
      '</div>'+
      '<div class="gauge-wrap">'+
        '<div class="gauge-label"><span>Maná</span><span class="gauge-nums">'+num(c.combat.manaActual,0)+' / '+maxMana+'</span></div>'+
        '<div class="gauge"><div class="gauge-fill mana" style="width:'+manaPct+'%;"></div></div>'+
        (canEdit ? ('<div class="gauge-adjust">'+
          '<button data-action="mana-mod" data-delta="-5" aria-label="Restar 5 maná">-5</button><button data-action="mana-mod" data-delta="-1" aria-label="Restar 1 maná">-1</button>'+
          '<button data-action="mana-mod" data-delta="1" aria-label="Sumar 1 maná">+1</button><button data-action="mana-mod" data-delta="5" aria-label="Sumar 5 maná">+5</button>'+
        '</div>') : '')+
      '</div>'+
    '</div>';
}

var PLAYER_TABS = [
  {id:"ficha",label:"Ficha"}, {id:"mision",label:"Misión"}, {id:"habilidades",label:"Habilidades"}, {id:"entrenamiento",label:"Entrenamiento"}, {id:"combate",label:"Combate"}, {id:"estados",label:"Estados"},
  {id:"inventario",label:"Inventario"}, {id:"magia",label:"Magia"}, {id:"alquimia",label:"Alquimia"},
  {id:"invocaciones",label:"Invocaciones"}, {id:"bestiario",label:"Bestiario"}, {id:"extra",label:"Extra"}, {id:"mundo",label:"Mundo"}
];

var GM_TABS = [
  {id:"ficha",label:"Ficha"}, {id:"mision",label:"Misión"}, {id:"habilidades",label:"Habilidades"}, {id:"entrenamiento",label:"Entrenamiento"}, {id:"combate",label:"Combate"}, {id:"estados",label:"Estados"},
  {id:"inventario",label:"Inventario"}, {id:"magia",label:"Magia"}, {id:"alquimia",label:"Alquimia"},
  {id:"invocaciones",label:"Invocaciones"}, {id:"bestiario",label:"Bestiario"},
  {id:"extra",label:"Extra"}, {id:"mundo",label:"Mundo"}
];

function renderTabbar(){
  var tabs = isGM() ? GM_TABS : PLAYER_TABS;
  document.getElementById("tabbar").innerHTML = tabs.map(function(t){
    var isActive = state.activeTab===t.id;
    return '<button class="tab-btn'+(isActive?' active':'')+'" data-action="switch-tab" data-tab="'+t.id+'" role="tab" aria-selected="'+(isActive)+'" aria-label="'+t.label+'"><span>'+t.label+'</span></button>';
  }).join('');
}

function renderTab(){
  var main = document.getElementById("main");
  var c = activeChar();
  
  if(state.activeTab==="ficha") main.innerHTML = tplFicha(c);
  else if(state.activeTab==="mision") main.innerHTML = tplMision(c, state);
  else if(state.activeTab==="habilidades") main.innerHTML = tplHabilidades(c);
  else if(state.activeTab==="entrenamiento") main.innerHTML = tplEntrenamiento(c);
  else if(state.activeTab==="combate") main.innerHTML = tplCombate(c);
  else if(state.activeTab==="estados") main.innerHTML = tplEstados(c);
  else if(state.activeTab==="inventario") main.innerHTML = tplInventario(c);
  else if(state.activeTab==="magia") main.innerHTML = tplMagia(c);
  else if(state.activeTab==="alquimia") main.innerHTML = tplAlquimia(c);
  else if(state.activeTab==="invocaciones") main.innerHTML = tplInvocaciones(c);
  else if(state.activeTab==="bestiario") main.innerHTML = tplBestiario(state);
  else if(state.activeTab==="extra") main.innerHTML = tplExtra(c);
  else if(state.activeTab==="mundo") main.innerHTML = tplMundo(state);

  if(typeof autoResizeAllTextareas === "function"){
    autoResizeAllTextareas();
  }
}

function tplFicha(c){
  var pStyle = c.portrait ? ' style="background-image:url(\''+c.portrait+'\')"' : '';
  var attrCards = ATTRS.map(function(a){
    if(c.isNPC){
      return '<div class="attr-card"><label>'+ATTR_LABELS[a]+'</label>'+
        '<div style="display:flex;align-items:center;justify-content:center;gap:4px;">'+
          '<button class="skill-bonus-ctrl" data-action="npc-attr-mod" data-attr="'+a+'" data-delta="-1" style="width:22px;height:22px;min-width:22px;min-height:22px;font-size:.6rem;">-</button>'+
          '<span style="font-family:var(--font-mono);font-size:1.1rem;font-weight:700;color:var(--gold-light);min-width:30px;text-align:center;">'+num(c.attrs[a],0)+'</span>'+
          '<button class="skill-bonus-ctrl" data-action="npc-attr-mod" data-attr="'+a+'" data-delta="1" style="width:22px;height:22px;min-width:22px;min-height:22px;font-size:.6rem;">+</button>'+
          '<button class="dice-btn" data-action="roll-attr" data-attr="'+a+'" style="width:22px;height:22px;font-size:0.75rem;margin-left:2px;" title="Tirar prueba de '+ATTR_LABELS[a]+'">🎲</button>'+
        '</div>'+
      '</div>';
    }
    return '<div class="attr-card rollable" data-action="roll-attr" data-attr="'+a+'" role="button" tabindex="0" title="Tirar prueba de '+ATTR_LABELS[a]+' (1d20)"><label>'+ATTR_LABELS[a]+'</label><div class="attr-val-box">'+num(c.attrs[a],0)+'</div><span class="attr-roll-hint">🎲 Tirar</span></div>';
  }).join('');

  var levelControl = '';
  if(isGM()){
    levelControl = '<button class="btn-solid-gold" data-action="grant-level">+ Nivel</button>';
  }

  var canEdit = canEditChar(c);
  var ro = !canEdit;

  return '<div class="section'+(c.isNPC?' gm-section':'')+'">'+
    '<div class="section-title"><span>'+(c.isNPC?'Ficha de NPC (Solo GM)':(canEdit ? 'Datos del Personaje' : 'Datos del Personaje (Solo Lectura)'))+'</span></div>'+
    (!canEdit && currentUser ?
      '<div class="tr-spectator-banner" style="margin-bottom:12px;">'+
        '<span style="font-size:1.15rem;flex:none;">👁️</span>'+
        '<div><strong>Modo Espectador:</strong> Consultando la ficha de <b>'+esc(c.name)+'</b> en modo solo lectura. No puedes modificar sus datos ni su equipo.</div>'+
      '</div>' : '')+
    '<div class="ficha-layout">'+
      '<div class="portrait-box">'+
        '<div class="portrait-img"'+pStyle+'>'+(c.portrait?'':'👤')+'</div>'+
        (canEdit ?
          '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;">'+
            '<button class="btn-compact" data-action="upload-portrait" title="Subir foto desde archivo">Foto</button>'+
            '<button class="btn-compact" data-action="url-portrait" title="Pegar enlace de GitHub o web">URL</button>'+
            (c.portrait ? '<button class="btn-compact" data-action="remove-portrait" title="Quitar foto">✕</button>' : '')+
          '</div>' : '')+
      '</div>'+
      '<div>'+
        '<div class="field-grid">'+
          field("Nombre", "name", c.name, "text", ro)+
          (isGM() && !c.isNPC ? '<div class="field"><label>👤 Jugador Asignado (Email)</label><input type="email" data-bind="ownerEmail" value="'+esc(c.ownerEmail||"")+'" placeholder="ej: jugador@gmail.com"></div>' : '')+
          '<div class="field"><label>'+(c.isNPC?'Nivel / CR':'Nivel')+'</label><div style="display:flex;gap:4px;"><input type="text" data-bind="nivel" value="'+esc(c.nivel||"1")+'" '+(c.isNPC && isGM() ? '' : 'readonly')+'>'+levelControl+'</div></div>'+
          field("Trabajo / Rol","trabajo",c.trabajo,"text", ro)+
          field("Lugar Nacimiento","lugarNacimiento",c.lugarNacimiento,"text", ro)+
          field("Altura","altura",c.altura,"text", ro)+
          field("Peso","peso",c.peso,"text", ro)+
          field("Edad","edad",c.edad,"text", ro)+
          field("Color de Ojos","ojos",c.ojos,"text", ro)+
          field("Color de Pelo","pelo",c.pelo,"text", ro)+
        '</div>'+
        '<div style="margin-top:10px;">'+
          fieldArea("Descripción Física y Notas","descripcion",c.descripcion, ro)+
        '</div>'+
      '</div>'+
    '</div>'+
  '</div>'+
  '<div class="section'+(c.isNPC?' gm-section':'')+'">'+
    '<div class="section-title"><span>Atributos'+(c.isNPC?' (Editables)':'')+'</span></div>'+
    '<div class="attr-grid">'+attrCards+'</div>'+
  '</div>';
}


function field(label,bind,val,type,readonly){
  return '<div class="field"><label>'+esc(label)+'</label><input type="'+type+'" data-bind="'+bind+'" value="'+esc(val)+'" aria-label="'+esc(label)+'"'+(readonly?' readonly':'')+'></div>';
}
function fieldArea(label,bind,val,readonly){
  return '<div class="field"><label>'+esc(label)+'</label><textarea data-bind="'+bind+'" aria-label="'+esc(label)+'"'+(readonly?' readonly':'')+'>'+esc(val)+'</textarea></div>';
}

function tplHabilidades(c){
  var canEdit = canEditChar(c);
  var groups = {}; ATTRS.forEach(function(a){groups[a]=[];});
  var hybrids = [];
  SKILL_DEFS.forEach(function(s){ if(s.attr==="hybrid") hybrids.push(s); else groups[s.attr].push(s); });

  var unlocked = c.skillPointsUnlocked || false;
  if(!canEdit){
    unlocked = false;
  } else if(c.isNPC){
    unlocked = true;
  }
  
  var banner = '';
  if(!canEdit && currentUser){
    banner = '<div class="spectator-banner">'+
      '<span>👁️ Modo Espectador: Solo lectura. No puedes modificar ni asignar puntos de habilidad en esta ficha.</span>'+
    '</div>';
  } else if(isGM() && !c.isNPC){
    banner = '<div class="skill-pool-banner">'+
      '<span>Puntos de mejora disponibles: <b>'+num(c.skillPoints,0)+'</b></span>'+
      '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">'+
        '<button class="btn-solid-gold" data-action="gm-add-skill-point" title="Dar 1 punto de habilidad al personaje">+1 Pto (GM)</button>'+
        '<button class="btn-solid-gold" data-action="toggle-skill-lock">'+(unlocked?'🔒 Bloquear Asignación (GM)':'🔓 Permitir Asignación (GM)')+'</button>'+
      '</div>'+
    '</div>';
  } else if(c.isNPC && isGM()){
    banner = '<div class="skill-pool-banner">'+
      '<span>NPC - Puntos disponibles: <b>'+num(c.skillPoints,0)+'</b>. Habilidades editables.</span>'+
      '<button class="btn-solid-gold" data-action="gm-add-skill-point">+1 Pto (GM)</button>'+
    '</div>';
  }

  var viewMode = (state && state.skillsView) || (function(){
    try { return localStorage.getItem("krysalis_skills_view"); } catch(e){ return null; }
  })() || "attr";

  var switcherHtml = '<div class="skills-view-switcher" role="group" aria-label="Modo de vista de habilidades">'+
    '<button type="button" class="skills-view-btn '+(viewMode==="attr"?"active":"")+'" data-action="set-skills-view" data-val="attr" title="Organizar habilidades agrupadas por atributo">'+
      '<span>🏷️</span> Por Atributo'+
    '</button>'+
    '<button type="button" class="skills-view-btn '+(viewMode==="excel"?"active":"")+'" data-action="set-skills-view" data-val="excel" title="Lista continua según la estructura y orden de la ficha original de Excel">'+
      '<span>📋</span> Ficha Original (Excel)'+
    '</button>'+
  '</div>';

  var html = '<div class="section'+(c.isNPC?' gm-section':'')+'">'+
    '<div class="skills-tab-header">'+
      '<div class="section-title" style="margin-bottom:0;"><span>Habilidades</span></div>'+
      switcherHtml+
    '</div>'+
    banner;

  if(viewMode === "attr"){
    ATTRS.forEach(function(a){
      html += '<div class="attr-group"><div class="attr-group-title">'+ATTR_LABELS[a]+'</div>';
      html += '<div class="skill-col-headers"><span>Habilidad</span><span>Base</span><span>Bono (Prog)</span><span>Total</span><span></span></div>';
      groups[a].forEach(function(s){ html += skillRowHtml(s, c, unlocked, canEdit); });
      html += '</div>';
    });
    html += '<div class="attr-group"><div class="attr-group-title">Híbridas</div>';
    html += '<div class="skill-col-headers"><span>Habilidad</span><span>Base</span><span>Bono (Prog)</span><span>Total</span><span></span></div>';
    hybrids.forEach(function(s){ html += skillRowHtml(s, c, unlocked, canEdit); });
    html += '</div>';

    if(c.customSkills && c.customSkills.length){
      html += '<div class="attr-group"><div class="attr-group-title">Personalizadas</div>';
      html += '<div class="skill-col-headers"><span>Habilidad</span><span>Base</span><span>Bono (Prog)</span><span>Total</span><span></span></div>';
      c.customSkills.forEach(function(cs){
        var bonusVal = num(cs.bonus, 0);
        if(!c.skillProgress) c.skillProgress = {};
        var prog = num(c.skillProgress[cs.id], 0);
        var costNeeded = bonusVal + 1;
        var canSub = canEdit && prog > 0;
        var canAdd = false;
        if(canEdit && bonusVal > 0 && bonusVal < 8){
          if(c.isNPC){
            canAdd = num(c.skillPoints,0) >= 1;
          } else {
            canAdd = unlocked && num(c.skillPoints,0) >= 1;
          }
        }

        var gmCustomTools = '';
        if(isGM()){
          gmCustomTools = '<span class="gm-skill-tools" title="Ajuste directo del Máster por Lore">'+
            '<button class="gm-skill-btn" data-action="gm-custom-skill-sub" data-id="'+cs.id+'" title="Restar 1 nivel (GM)">-</button>'+
            '<span class="gm-skill-lvl">'+bonusVal+'</span>'+
            '<button class="gm-skill-btn" data-action="gm-custom-skill-add" data-id="'+cs.id+'" title="Otorgar +1 nivel directamente (GM)">+ GM</button>'+
          '</span>';
        }
        
        var attrLbl = ATTR_LABELS[cs.attr] ? ATTR_LABELS[cs.attr].slice(0,3) : "Gen";
        html += '<div class="skill-row"><span>'+esc(cs.name)+' <small style="color:var(--ink-faint);">('+attrLbl+')</small></span>'+
          '<span class="skill-base">'+getEffectiveAttr(cs.attr,c)+'</span>'+
          '<span class="skill-bonus-ctrl">'+
            (isGM() ? gmCustomTools : (
              '<button data-action="skill-sub-custom" data-id="'+cs.id+'" '+(canSub?'':'disabled')+' aria-label="Restar progreso">-</button>'+
              '<span>'+bonusVal+' ('+prog+'/'+costNeeded+')</span>'+
              '<button data-action="skill-add-custom" data-id="'+cs.id+'" '+(canAdd?'':'disabled')+' aria-label="Añadir progreso">+</button>'
            ))+
          '</span>'+
          '<span class="skill-total">'+customSkillTotal(cs,c)+'</span><button class="dice-btn" data-action="roll-custom-skill" data-id="'+cs.id+'" aria-label="Tirar '+esc(cs.name)+'">&#127922;</button></div>';
      });
      html += '</div>';
    }
    if(isGM()){
      html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-custom-skill">+ Añadir habilidad personalizada</button>';
    }
  } else {
    html += '<div class="skills-excel-wrapper">'+
      '<div class="skills-excel-table">'+
        '<div class="skills-excel-headers">'+
          '<span>Habilidad</span>'+
          '<span style="text-align:center;">Atrib</span>'+
          '<span style="text-align:center;">Base</span>'+
          '<span style="text-align:center;">Bono (Prog)</span>'+
          '<span style="text-align:center;">Total</span>'+
          '<span></span>'+
        '</div>';

    SKILL_DEFS.forEach(function(s, idx){
      html += skillRowExcelHtml(s, c, unlocked, canEdit, idx + 1);
    });

    if(c.customSkills && c.customSkills.length){
      c.customSkills.forEach(function(cs, cidx){
        html += customSkillRowExcelHtml(cs, c, unlocked, canEdit, SKILL_DEFS.length + cidx + 1);
      });
    }

    html += '</div></div>';

    if(isGM()){
      html += '<button class="btn-compact" style="width:100%;margin-top:10px;" data-action="add-custom-skill">+ Añadir habilidad personalizada</button>';
    }
  }

  html += '</div>';
  html += rollLogHtml();
  return html;
}

function skillRowHtml(s, c, unlocked, canEdit){
  var base = skillBase(s,c);
  var total = skillTotal(s,c);
  var bonusVal = num(c.skillBonus ? c.skillBonus[s.id] : 0, 0);
  if(!c.skillProgress) c.skillProgress = {};
  var prog = num(c.skillProgress[s.id],0);
  var costNeeded = bonusVal + 1;

  var hybridSel = "";
  if(s.attr==="hybrid"){
    var chosen = (c.skillHybrid && c.skillHybrid[s.id]) || s.hybridOptions[0];
    hybridSel = '<div><select class="skill-hybrid-select" data-bind="skillHybrid.'+s.id+'" aria-label="Atributo para '+esc(s.name)+'" '+(canEdit?'':'disabled')+'>'+
      s.hybridOptions.map(function(o){return '<option value="'+o+'"'+(o===chosen?' selected':'')+'>'+(ATTR_LABELS[o]?ATTR_LABELS[o].slice(0,3):o)+'</option>';}).join('')+
      '</select></div>';
  }

  var canSub = canEdit && prog > 0;
  var canAdd = false;
  if(canEdit && bonusVal > 0 && bonusVal < 8){
    if(c.isNPC){
      canAdd = num(c.skillPoints,0) >= 1;
    } else {
      canAdd = unlocked && num(c.skillPoints,0) >= 1;
    }
  }

  var gmControls = '';
  if(isGM()){
    gmControls = '<span class="gm-skill-tools" title="Ajuste directo del Máster por Lore">'+
      '<button class="gm-skill-btn" data-action="gm-skill-sub" data-id="'+s.id+'" title="Restar 1 nivel base (GM)">-</button>'+
      '<span class="gm-skill-lvl">'+bonusVal+'</span>'+
      '<button class="gm-skill-btn" data-action="gm-skill-add" data-id="'+s.id+'" title="Otorgar +1 nivel base directamente (GM)">+ GM</button>'+
    '</span>';
  }

  return '<div class="skill-row">'+
    '<span class="skill-name">'+esc(s.name)+hybridSel+'</span>'+
    '<span class="skill-base">'+base+'</span>'+
    '<span class="skill-bonus-ctrl">'+
      (isGM() ? gmControls : (
        '<button data-action="skill-sub" data-id="'+s.id+'" '+(canSub?'':'disabled')+' aria-label="Restar progreso a '+esc(s.name)+'">-</button>'+
        '<span>'+bonusVal+' ('+prog+'/'+costNeeded+')</span>'+
        '<button data-action="skill-add" data-id="'+s.id+'" '+(canAdd?'':'disabled')+' aria-label="Añadir progreso a '+esc(s.name)+'">+</button>'
      ))+
    '</span>'+
    '<span class="skill-total">'+total+'</span>'+
    '<button class="dice-btn" data-action="roll-skill" data-id="'+s.id+'" aria-label="Tirar '+esc(s.name)+'">&#127922;</button>'+
  '</div>';
}

function skillRowExcelHtml(s, c, unlocked, canEdit, index){
  var base = skillBase(s,c);
  var total = skillTotal(s,c);
  var bonusVal = num(c.skillBonus ? c.skillBonus[s.id] : 0, 0);
  if(!c.skillProgress) c.skillProgress = {};
  var prog = num(c.skillProgress[s.id],0);
  var costNeeded = bonusVal + 1;

  var attrBadge = "";
  if(s.attr==="hybrid"){
    var chosen = (c.skillHybrid && c.skillHybrid[s.id]) || s.hybridOptions[0];
    attrBadge = '<select class="skill-hybrid-select skill-excel-hybrid-select" data-bind="skillHybrid.'+s.id+'" aria-label="Atributo para '+esc(s.name)+'" '+(canEdit?'':'disabled')+'>'+
      s.hybridOptions.map(function(o){return '<option value="'+o+'"'+(o===chosen?' selected':'')+'>'+(ATTR_LABELS[o]?ATTR_LABELS[o].slice(0,3).toUpperCase():o)+'</option>';}).join('')+
      '</select>';
  } else {
    var shortA = ATTR_LABELS[s.attr] ? ATTR_LABELS[s.attr].slice(0,3).toUpperCase() : s.attr.slice(0,3).toUpperCase();
    attrBadge = '<span class="skill-attr-badge attr-'+s.attr+'" title="'+(ATTR_LABELS[s.attr]||s.attr)+'">'+shortA+'</span>';
  }

  var canSub = canEdit && prog > 0;
  var canAdd = false;
  if(canEdit && bonusVal > 0 && bonusVal < 8){
    if(c.isNPC){
      canAdd = num(c.skillPoints,0) >= 1;
    } else {
      canAdd = unlocked && num(c.skillPoints,0) >= 1;
    }
  }

  var gmControls = '';
  if(isGM()){
    gmControls = '<span class="gm-skill-tools" title="Ajuste directo del Máster por Lore">'+
      '<button class="gm-skill-btn" data-action="gm-skill-sub" data-id="'+s.id+'" title="Restar 1 nivel base (GM)">-</button>'+
      '<span class="gm-skill-lvl">'+bonusVal+'</span>'+
      '<button class="gm-skill-btn" data-action="gm-skill-add" data-id="'+s.id+'" title="Otorgar +1 nivel base directamente (GM)">+ GM</button>'+
    '</span>';
  }

  var idxStr = index ? '<span class="skill-excel-idx">'+(index < 10 ? '0' + index : index)+'</span>' : '';

  return '<div class="skill-excel-row" data-skill-id="'+s.id+'">'+
    '<div class="skill-excel-name">'+idxStr+'<span class="skill-excel-text" title="'+esc(s.name)+'">'+esc(s.name)+'</span></div>'+
    '<div class="skill-excel-attr">'+attrBadge+'</div>'+
    '<div class="skill-excel-base">'+base+'</div>'+
    '<div class="skill-bonus-ctrl">'+
      (isGM() ? gmControls : (
        '<button data-action="skill-sub" data-id="'+s.id+'" '+(canSub?'':'disabled')+' aria-label="Restar progreso a '+esc(s.name)+'">-</button>'+
        '<span>'+bonusVal+' ('+prog+'/'+costNeeded+')</span>'+
        '<button data-action="skill-add" data-id="'+s.id+'" '+(canAdd?'':'disabled')+' aria-label="Añadir progreso a '+esc(s.name)+'">+</button>'
      ))+
    '</div>'+
    '<div class="skill-excel-total">'+total+'</div>'+
    '<div class="skill-excel-action"><button class="dice-btn" data-action="roll-skill" data-id="'+s.id+'" aria-label="Tirar '+esc(s.name)+'">&#127922;</button></div>'+
  '</div>';
}

function customSkillRowExcelHtml(cs, c, unlocked, canEdit, index){
  var bonusVal = num(cs.bonus, 0);
  if(!c.skillProgress) c.skillProgress = {};
  var prog = num(c.skillProgress[cs.id], 0);
  var costNeeded = bonusVal + 1;

  var canSub = canEdit && prog > 0;
  var canAdd = false;
  if(canEdit && bonusVal > 0 && bonusVal < 8){
    if(c.isNPC){
      canAdd = num(c.skillPoints,0) >= 1;
    } else {
      canAdd = unlocked && num(c.skillPoints,0) >= 1;
    }
  }

  var gmCustomTools = '';
  if(isGM()){
    gmCustomTools = '<span class="gm-skill-tools" title="Ajuste directo del Máster por Lore">'+
      '<button class="gm-skill-btn" data-action="gm-custom-skill-sub" data-id="'+cs.id+'" title="Restar 1 nivel (GM)">-</button>'+
      '<span class="gm-skill-lvl">'+bonusVal+'</span>'+
      '<button class="gm-skill-btn" data-action="gm-custom-skill-add" data-id="'+cs.id+'" title="Otorgar +1 nivel directamente (GM)">+ GM</button>'+
    '</span>';
  }

  var shortA = ATTR_LABELS[cs.attr] ? ATTR_LABELS[cs.attr].slice(0,3).toUpperCase() : (cs.attr ? cs.attr.slice(0,3).toUpperCase() : "GEN");
  var attrBadge = '<span class="skill-attr-badge attr-'+(cs.attr||'custom')+'" title="'+(ATTR_LABELS[cs.attr]||cs.attr)+'">'+shortA+'</span>';
  var idxStr = index ? '<span class="skill-excel-idx">'+(index < 10 ? '0' + index : index)+'</span>' : '';

  return '<div class="skill-excel-row skill-excel-custom-row" data-skill-id="'+cs.id+'">'+
    '<div class="skill-excel-name">'+idxStr+
      '<span class="skill-excel-text" title="'+esc(cs.name)+'">'+esc(cs.name)+
        '<span class="skill-excel-custom-tag">Personalizada</span>'+
      '</span>'+
    '</div>'+
    '<div class="skill-excel-attr">'+attrBadge+'</div>'+
    '<div class="skill-excel-base">'+getEffectiveAttr(cs.attr,c)+'</div>'+
    '<div class="skill-bonus-ctrl">'+
      (isGM() ? gmCustomTools : (
        '<button data-action="skill-sub-custom" data-id="'+cs.id+'" '+(canSub?'':'disabled')+' aria-label="Restar progreso">-</button>'+
        '<span>'+bonusVal+' ('+prog+'/'+costNeeded+')</span>'+
        '<button data-action="skill-add-custom" data-id="'+cs.id+'" '+(canAdd?'':'disabled')+' aria-label="Añadir progreso">+</button>'
      ))+
    '</div>'+
    '<div class="skill-excel-total">'+customSkillTotal(cs,c)+'</div>'+
    '<div class="skill-excel-action"><button class="dice-btn" data-action="roll-custom-skill" data-id="'+cs.id+'" aria-label="Tirar '+esc(cs.name)+'">&#127922;</button></div>'+
  '</div>';
}

var TRAINING_CATS = [
  { id: "skill", icon: "🎯", label: "Habilidad", die: "d10", sides: 10, type: "existing" },
  { id: "unlock", icon: "🔮", label: "Desbloqueo", die: "d20", sides: 20, type: "new" },
  { id: "combat", icon: "⚔️", label: "Combate", die: "d10", sides: 10, type: "existing" },
  { id: "spell_summon", icon: "✨", label: "Hechizo", die: "d10", sides: 10, type: "existing" },
  { id: "narrative", icon: "📜", label: "Lore", die: "d20", sides: 20, type: "new" }
];

function tplEntrenamiento(c){
  c.trainings = c.trainings || [];
  var canEdit = canEditChar(c);

  var html = '<div class="section' + (c.isNPC ? ' gm-section' : '') + '">';
  
  html += '<div class="section-title" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
    '<span>🥋 Entrenamiento y Progresión</span>' +
    (canEdit ? '<button class="btn-compact" data-action="add-training">+ Nuevo Entrenamiento</button>' : '') +
  '</div>';

  if(!canEdit && currentUser){
    html += '<div class="tr-spectator-banner">' +
      '<span style="font-size:1.15rem;flex:none;">👁️</span>' +
      '<div>' +
        '<strong>Modo Espectador (Solo lectura):</strong> ' +
        (c.ownerEmail
          ? 'Esta ficha pertenece a <b>' + esc(c.ownerEmail) + '</b>.'
          : 'Este personaje no tiene jugador asignado.') +
        ' Solo el propietario de la ficha o el Máster pueden crear o registrar tiradas de entrenamiento.' +
      '</div>' +
    '</div>';
  }

  if(c.trainings.length === 0){
    html += '<div class="tr-empty-state" style="text-align:center;padding:24px 12px;background:var(--bg-elev);border:1px dashed var(--line);border-radius:var(--radius-sm);margin-bottom:12px;">' +
      '<p style="color:var(--ink-dim);font-size:0.85rem;margin-bottom:10px;">No hay entrenamientos activos registrados.</p>' +
      (canEdit ? '<button class="btn-compact" data-action="add-training">+ Añadir Primer Entrenamiento</button>' : '') +
    '</div>';
  } else {
    c.trainings.forEach(function(t){
      var catId = t.category || "skill";
      var sides = t.sides || (catId === "unlock" || catId === "narrative" ? 20 : 10);
      var points = num(t.points, 0);
      var rolls = t.rolls || [];
      var isQuantifiable = (catId === "combat" || catId === "skill" || catId === "spell_summon");
      var targetGoal = num(t.targetGoal, 100);
      var isCompleted = targetGoal > 0 && points >= targetGoal;
      var progressPct = targetGoal > 0 ? clamp(Math.round((Math.max(0, points) / targetGoal) * 100), 0, 100) : 0;

      // Hito exclusivo del Máster (Puntos meta ocultos para jugadores)
      var gmMilestoneHtml = '';
      if(isGM()){
        gmMilestoneHtml = '<div class="tr-gm-milestone-box">' +
          '<div style="display:flex;align-items:center;gap:6px;font-size:0.75rem;">' +
            '<span style="color:var(--gold-light);font-weight:700;">👑 Hito del Máster (Puntos Meta):</span>' +
            '<input type="number" min="1" step="5" data-action="set-training-goal" data-id="' + t.id + '" value="' + targetGoal + '" title="Puntos para completar este hito (Invisible para jugadores)" style="width:60px;background:var(--bg-card);border:1px solid var(--line);border-radius:4px;padding:3px 6px;color:var(--gold-light);font-family:var(--font-mono);font-weight:700;font-size:0.82rem;text-align:center;">' +
            '<span style="color:var(--ink-faint);font-size:0.7rem;">pts meta (Oculto a jugadores)</span>' +
          '</div>' +
          '<div style="font-size:0.72rem;display:flex;align-items:center;gap:6px;">' +
            (isCompleted
              ? '<span style="color:#4ADE80;font-weight:700;background:rgba(46,139,87,0.25);border:1px solid rgba(74,222,128,0.4);padding:2px 8px;border-radius:4px;">🏆 ¡Hito alcanzado! (' + points + ' / ' + targetGoal + ' pts)</span>'
              : '<span style="color:var(--gold-light);font-family:var(--font-mono);font-weight:600;">Progreso real: ' + points + ' / ' + targetGoal + ' pts (' + progressPct + '%)</span>'
            ) +
          '</div>' +
        '</div>';
      }

      // Selector Secundario según categoría
      var secondaryHtml = '';
      if(catId === "spell_summon"){
        secondaryHtml = '<div class="creature-field" style="flex:1;min-width:140px;">' +
          '<label>Elemento a Mejorar</label>' +
          '<select class="tr-cat-select" data-action="set-training-linked" data-id="' + t.id + '" ' + (canEdit ? '' : 'disabled') + ' style="background:var(--bg-card);border:1px solid var(--line);border-radius:5px;padding:7px 6px;font-size:.8rem;color:var(--ink);width:100%;">' +
            '<option value="">-- Seleccionar Hechizo o Invocación --</option>' +
            '<optgroup label="✨ Hechizos">' +
              (c.spells || []).map(function(sp){
                return '<option value="spell:' + sp.id + '" ' + (t.linkedId === sp.id ? 'selected' : '') + '>✨ ' + esc(sp.name || "Hechizo") + '</option>';
              }).join('') +
            '</optgroup>' +
            '<optgroup label="🐾 Invocaciones">' +
              (c.summons || []).map(function(sm){
                return '<option value="summon:' + sm.id + '" ' + (t.linkedId === sm.id ? 'selected' : '') + '>🐾 ' + esc(sm.name || "Invocación") + '</option>';
              }).join('') +
            '</optgroup>' +
          '</select>' +
        '</div>';
      } else if(catId === "combat"){
        var curTargetStat = t.targetStat || "+10 PV";
        secondaryHtml = '<div class="creature-field" style="flex:1;min-width:140px;">' +
          '<label>Atributo o Estadística</label>' +
          '<select class="tr-cat-select" data-action="set-training-linked" data-id="' + t.id + '" ' + (canEdit ? '' : 'disabled') + ' style="background:var(--bg-card);border:1px solid var(--line);border-radius:5px;padding:7px 6px;font-size:.8rem;color:var(--ink);width:100%;">' +
            '<option value="stat:pv" ' + (curTargetStat === "+10 PV" || t.linkedId === "stat:pv" ? 'selected' : '') + '>❤️ Vida (+10 PV)</option>' +
            '<option value="stat:mana" ' + (curTargetStat === "+5 Maná" || t.linkedId === "stat:mana" ? 'selected' : '') + '>🔷 Maná (+5 Maná)</option>' +
            '<option value="stat:defensa" ' + (curTargetStat === "+1 Defensa" || t.linkedId === "stat:defensa" ? 'selected' : '') + '>🛡️ Defensa (+1)</option>' +
            '<option value="stat:iniciativa" ' + (curTargetStat === "+1 Iniciativa" || t.linkedId === "stat:iniciativa" ? 'selected' : '') + '>⚡ Iniciativa (+1)</option>' +
            '<option value="stat:fisico" ' + (curTargetStat === "+1 Físico" || t.linkedId === "stat:fisico" ? 'selected' : '') + '>💪 Físico (+1)</option>' +
            '<option value="stat:destreza" ' + (curTargetStat === "+1 Destreza" || t.linkedId === "stat:destreza" ? 'selected' : '') + '>🏃 Destreza (+1)</option>' +
            '<option value="stat:inteligencia" ' + (curTargetStat === "+1 Inteligencia" || t.linkedId === "stat:inteligencia" ? 'selected' : '') + '>🧠 Inteligencia (+1)</option>' +
            '<option value="stat:percepcion" ' + (curTargetStat === "+1 Percepción" || t.linkedId === "stat:percepcion" ? 'selected' : '') + '>👁️ Percepción (+1)</option>' +
            '<option value="stat:carisma" ' + (curTargetStat === "+1 Carisma" || t.linkedId === "stat:carisma" ? 'selected' : '') + '>🎭 Carisma (+1)</option>' +
          '</select>' +
        '</div>';
      } else if(catId === "skill"){
        secondaryHtml = '<div class="creature-field" style="flex:1;min-width:140px;">' +
          '<label>Habilidad a Desarrollar</label>' +
          '<select class="tr-cat-select" data-action="set-training-linked" data-id="' + t.id + '" ' + (canEdit ? '' : 'disabled') + ' style="background:var(--bg-card);border:1px solid var(--line);border-radius:5px;padding:7px 6px;font-size:.8rem;color:var(--ink);width:100%;">' +
            '<option value="">-- Seleccionar Habilidad --</option>' +
            (typeof SKILL_DEFS !== "undefined" ? SKILL_DEFS : []).map(function(sdef){
              return '<option value="skill:' + sdef.id + '" ' + (t.linkedId === sdef.id || t.linkedId === "skill:" + sdef.id ? 'selected' : '') + '>🎯 ' + esc(sdef.name) + '</option>';
            }).join('') +
          '</select>' +
        '</div>';
      }

      // Barra de progreso visual (secreta para jugadores, completa para Máster)
      var progressHtml = '';
      if(isQuantifiable){
        if(isGM()){
          progressHtml = '<div class="tr-progress-container" style="margin:6px 0 8px;">' +
            '<div class="tr-progress-track" style="background:var(--bg-card);border:1px solid var(--line);border-radius:6px;height:8px;overflow:hidden;position:relative;" title="Progreso hacia la meta del Máster">' +
              '<div class="tr-progress-fill" style="background:linear-gradient(90deg, var(--gold), var(--teal-light));height:100%;border-radius:5px;width:' + progressPct + '%;"></div>' +
            '</div>' +
            '<div class="tr-progress-caption" style="display:flex;justify-content:space-between;align-items:center;font-size:0.68rem;color:var(--ink-dim);margin-top:3px;">' +
              '<span>' + (isCompleted ? '🏆 ¡Hito completado! Listo para otorgar recompensa.' : 'Progreso hacia el hito del Máster...') + '</span>' +
              '<span style="color:var(--gold-light);font-weight:600;"><b>' + points + ' / ' + targetGoal + ' pts</b> (' + progressPct + '%)</span>' +
            '</div>' +
          '</div>';
        } else {
          if(isCompleted){
            progressHtml = '<div class="tr-player-complete-box">' +
              '<div style="display:flex;align-items:center;gap:6px;font-size:0.78rem;color:#4ADE80;font-weight:700;">' +
                '<span>✨ ¡Hito de Entrenamiento Completado!</span>' +
                '<span style="font-weight:400;color:var(--ink-dim);font-size:0.72rem;">Has alcanzado suficiente dominio. Habla con el Máster para recibir tu mejora.</span>' +
              '</div>' +
              '<span style="font-size:0.78rem;color:var(--gold-light);font-weight:700;font-family:var(--font-mono);flex:none;">' + points + ' pts acumulados</span>' +
            '</div>';
          } else {
            progressHtml = '<div class="tr-progress-container" style="margin:6px 0 8px;">' +
              '<div class="tr-progress-track" style="background:var(--bg-card);border:1px solid var(--line);border-radius:6px;height:7px;overflow:hidden;position:relative;" title="Entrenamiento en progreso">' +
                '<div class="tr-progress-fill" style="background:linear-gradient(90deg, var(--gold), var(--teal-light));height:100%;border-radius:5px;width:' + Math.min(100, Math.max(8, points * 2)) + '%;opacity:0.85;"></div>' +
              '</div>' +
              '<div class="tr-progress-caption" style="display:flex;justify-content:space-between;align-items:center;font-size:0.68rem;color:var(--ink-dim);margin-top:3px;">' +
                '<span>⏳ Entrenamiento en progreso... (Acumulando puntos de esfuerzo)</span>' +
                '<span style="color:var(--gold-light);font-weight:600;"><b>' + (points > 0 ? '+' + points : points) + ' pts</b> acumulados</span>' +
              '</div>' +
            '</div>';
          }
        }
      }

      // Historial chips
      var historyChipsHtml = '';
      if(rolls.length > 0){
        historyChipsHtml = '<div class="tr-chips-shelf" style="display:flex;align-items:center;gap:4px;overflow-x:auto;max-width:280px;padding:2px 0;">' +
          rolls.slice().reverse().slice(0, 8).map(function(r){
            var chipClass = "normal";
            if(r.roll === 1 && catId !== "narrative") chipClass = "fumble";
            else if(r.roll === r.sides) chipClass = "crit";
            else if(r.roll >= 11 && r.roll <= 19) chipClass = "great";
            var sign = r.pts > 0 ? "+" : "";
            return '<div class="tr-mini-chip ' + chipClass + '" title="Tirada: ' + r.roll + ' (d' + r.sides + ')">' +
              '<span class="chip-val">' + r.roll + '</span>' +
              '<span class="chip-delta">' + sign + r.pts + '</span>' +
              (canEdit ? '<button type="button" class="tr-chip-del" data-action="undo-training-roll" data-training-id="' + t.id + '" data-roll-id="' + r.id + '" title="Deshacer tirada">✕</button>' : '') +
            '</div>';
          }).join('') +
        '</div>';
      }

      // Tarjeta limpia estilo Invocaciones (.creature-card)
      html += '<div class="creature-card training-card" data-id="' + t.id + '" style="background:linear-gradient(160deg, var(--bg-elev), var(--bg-card));border:1px solid var(--line);border-radius:var(--radius-sm);padding:12px;margin-bottom:11px;box-shadow:0 4px 14px -6px rgba(0,0,0,0.7);">' +
        // Fila 1: Encabezado (Nombre + PTS Badge + Del)
        '<div class="creature-card-header" style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">' +
          '<input type="text" class="creature-name-input" data-bind="trainings.' + t.id + '.name" value="' + esc(t.name) + '" placeholder="Nombre del entrenamiento (ej: Veneno de Seta)..." ' + (canEdit ? '' : 'readonly') + ' style="font-family:var(--font-display);font-size:1.02rem;color:var(--gold-light);background:none;border:none;border-bottom:1px solid var(--line-strong);padding:2px 4px;flex:1;min-width:0;">' +
          '<div style="display:flex;align-items:center;gap:6px;flex:none;">' +
            '<div class="tr-points-badge" title="Puntos acumulados de esfuerzo" style="background:rgba(176,141,87,0.18);border:1px solid var(--line);border-radius:4px;padding:2px 6px;display:flex;align-items:center;gap:3px;">' +
              '<span class="tr-points-val" style="font-family:var(--font-mono);font-weight:700;font-size:.85rem;color:var(--gold-light);">' + (points > 0 ? '+' + points : points) + '</span>' +
              '<span class="tr-points-label" style="font-size:.6rem;color:var(--ink-faint);text-transform:uppercase;">PTS</span>' +
            '</div>' +
            (canEdit ? '<button class="row-del" data-action="del-training" data-id="' + t.id + '" title="Eliminar entrenamiento" aria-label="Eliminar" style="width:28px;height:28px;min-width:28px;min-height:28px;">✕</button>' : '') +
          '</div>' +
        '</div>' +

        // Fila 2: Cuadrícula de inputs estructurados
        '<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;flex-wrap:wrap;">' +
          '<div class="creature-field" style="flex:1;min-width:130px;">' +
            '<label>Categoría</label>' +
            '<select class="tr-cat-select" data-action="set-training-category" data-id="' + t.id + '" ' + (canEdit ? '' : 'disabled') + ' style="background:var(--bg-card);border:1px solid var(--line);border-radius:5px;padding:7px 6px;font-size:.8rem;color:var(--ink);width:100%;">' +
              '<option value="skill" ' + (catId === 'skill' ? 'selected' : '') + '>🎯 Habilidad</option>' +
              '<option value="spell_summon" ' + (catId === 'spell_summon' ? 'selected' : '') + '>✨ Magia / Hechizo</option>' +
              '<option value="combat" ' + (catId === 'combat' ? 'selected' : '') + '>⚔️ Atributo / Combate</option>' +
              '<option value="narrative" ' + (catId === 'narrative' ? 'selected' : '') + '>📜 Lore / Narrativa</option>' +
            '</select>' +
          '</div>' +
          secondaryHtml +
          '<div class="creature-field" style="width:90px;flex:none;">' +
            '<label>Dado</label>' +
            '<div class="tr-die-toggle" style="display:flex;gap:3px;">' +
              '<button type="button" class="btn-compact tr-die-btn' + (sides === 10 ? ' active' : '') + '" data-action="set-training-type" data-id="' + t.id + '" data-type="existing" ' + (canEdit ? '' : 'disabled') + ' style="flex:1;padding:5px 2px;font-size:.75rem;font-weight:700;' + (sides === 10 ? 'background:rgba(176,141,87,0.3);border-color:var(--gold);color:var(--gold-light);' : '') + '">d10</button>' +
              '<button type="button" class="btn-compact tr-die-btn' + (sides === 20 ? ' active' : '') + '" data-action="set-training-type" data-id="' + t.id + '" data-type="new" ' + (canEdit ? '' : 'disabled') + ' style="flex:1;padding:5px 2px;font-size:.75rem;font-weight:700;' + (sides === 20 ? 'background:rgba(176,141,87,0.3);border-color:var(--gold);color:var(--gold-light);' : '') + '">d20</button>' +
            '</div>' +
          '</div>' +
        '</div>' +

        // Fila 2.5: Hito Secreto del Máster (Solo visible y configurable por el GM)
        gmMilestoneHtml +

        // Fila 3: Barra de progreso sutil (si cuantificable)
        progressHtml +

        // Fila 4: Notas breves
        '<div class="creature-field" style="margin-bottom:8px;">' +
          '<input type="text" data-bind="trainings.' + t.id + '.notes" placeholder="Notas, efecto o descripción breve..." value="' + esc(t.notes || t.desc || '') + '" ' + (canEdit ? '' : 'readonly') + ' style="background:var(--bg-card);border:1px solid var(--line);border-radius:5px;padding:6px 8px;font-size:.78rem;color:var(--ink);width:100%;">' +
        '</div>' +

        // Fila 5: Barra inferior compacta de tirada y chips
        '<div class="tr-controls-row" style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding-top:6px;border-top:1px solid var(--line);flex-wrap:wrap;">' +
          (canEdit ? (
            '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
              '<button type="button" class="btn-compact tr-roll-btn" data-action="roll-training" data-id="' + t.id + '" style="padding:5px 9px;font-size:.78rem;font-weight:700;">' +
                '🎲 Tirar Automático (d' + sides + ')' +
              '</button>' +
              '<div class="tr-manual-group" style="display:inline-flex;align-items:center;gap:3px;background:var(--bg-card);border:1px solid var(--line);border-radius:4px;padding:2px 4px;">' +
                '<input type="number" min="1" max="' + sides + '" class="tr-manual-input" data-manual-for="' + t.id + '" placeholder="1-' + sides + '" title="Tirada de dado físico" style="width:44px;background:none;border:none;color:var(--ink);font-family:var(--font-mono);font-size:.8rem;text-align:center;">' +
                '<button type="button" class="btn-compact tr-manual-btn" data-action="add-manual-training-roll" data-id="' + t.id + '" title="Registrar tirada física" style="padding:3px 6px;font-size:.7rem;">+ Manual</button>' +
              '</div>' +
            '</div>'
          ) : '') +
          historyChipsHtml +
        '</div>' +
      '</div>';
    });
  }

  html += '</div>';
  return html;
}

function tplCombate(c){
  var cb = c.combat||{};
  var canEdit = canEditChar(c);
  var assignedBuffs = c.activeBuffs || [];
  var activeBuffsList = assignedBuffs.filter(function(ab){ return ab.active !== false && ab.type !== "debuff"; });
  var activeDebuffsList = assignedBuffs.filter(function(ab){ return ab.active !== false && ab.type === "debuff"; });
  var activeSpells = (c.spells||[]).filter(function(sp){ return sp.active; });

  var html = '';

  // 1. Subnavegación rápida entre Combate y Estados
  html += '<div class="combat-subnav-pills">'+
    '<button type="button" class="subnav-pill active" data-action="switch-tab" data-tab="combate">⚔️ Combate y Armas</button>'+
    '<button type="button" class="subnav-pill" data-action="switch-tab" data-tab="estados">💫 Estados y Buffs ('+assignedBuffs.length+')</button>'+
  '</div>';

  if(!canEdit && currentUser){
    html += '<div class="spectator-banner">'+
      '<span>👁️ Modo Espectador: Solo lectura. No puedes modificar combate, armas ni armaduras en esta ficha.</span>'+
    '</div>';
  }

  // 2. Tira informativa rápida de estados activos
  if(activeBuffsList.length > 0 || activeDebuffsList.length > 0 || activeSpells.length > 0){
    html += '<div class="combat-status-strip" data-action="switch-tab" data-tab="estados" role="button" title="Haz clic para ver y gestionar estados en detalle">'+
      '<div class="css-left">'+
        (activeBuffsList.length > 0 ? '<span class="css-badge-buff">✨ '+activeBuffsList.length+' Buff'+(activeBuffsList.length>1?'s':'')+'</span>' : '')+
        (activeDebuffsList.length > 0 ? '<span class="css-badge-debuff">⚠️ '+activeDebuffsList.length+' Debuff'+(activeDebuffsList.length>1?'s':'')+'</span>' : '')+
        (activeSpells.length > 0 ? '<span class="css-badge-spell">🪄 '+activeSpells.length+' Magia'+(activeSpells.length>1?'s':'')+'</span>' : '')+
      '</div>'+
      '<div class="css-right">Gestionar Estados ➔</div>'+
    '</div>';
  }

  // 3. Tiradas de Combate (1d10)
  var quickBtns = ["melee","distancia","esquivar","atletismo"].map(function(sid){
    var sdef = SKILL_DEFS.find(function(s){return s.id===sid;});
    var total = skillTotal(sdef, c);
    return '<button class="combat-quick-btn" data-action="roll-skill" data-id="' + sid + '" title="Tirar ' + esc(sdef.name) + ' (1d10 + ' + total + ')"><span class="cq-label">' + esc(sdef.name) + '</span><span class="cq-total">' + total + '</span></button>';
  }).join('');

  html += '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Tiradas de Combate (1d10)</span></div><div class="combat-quick-grid">'+quickBtns+'</div></div>';

  // 4. Estadísticas de Combate
  html += '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Estadísticas de Combate</span></div>'+
    '<div class="combat-grid">'+
      combatStat("Iniciativa","iniciativa",cb.iniciativa,true)+
      combatStat("Movilidad","movilidad",cb.movilidad,false)+
      combatStat("Defensa","defensa",cb.defensa,false)+
      combatStat("Def. Mágica","defensaMagica",cb.defensaMagica,false)+
      combatStat("Escudo","escudoActual",cb.escudoActual,false)+
    '</div>'+
  '</div>';

  // 5. Armas del Personaje
  html += '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Armas del Personaje</span></div>';
  var catalog = state.weaponsCatalog || [];
  (c.weapons||[]).forEach(function(w){
    var selectedCatItem = catalog.find(function(catItem){ return catItem.name === w.name || catItem.id === w.catalogId; });
    var isBlocked = selectedCatItem ? (selectedCatItem.visible === false) : false;
    var infoText = selectedCatItem ? ('Daño: ' + selectedCatItem.dano + ' | Alcance: ' + selectedCatItem.alcance) : 'Selecciona un arma del compendio';
    if(isBlocked){
      infoText += ' | <span style="color:#F87171;font-weight:700;">[🔒 Bloqueada por el Máster - No usable]</span>';
    }

    var gridCols = canEdit ? '1fr 36px 36px' : '1fr 36px';
    html += '<div class="list-row weapons-row'+(isBlocked?' weapon-row-blocked':'')+'" style="grid-template-columns:'+gridCols+';">'+
      '<select data-action="select-weapon-catalog" data-id="'+w.id+'" aria-label="Seleccionar arma" '+(canEdit?'':'disabled')+'>'+
        '<option value="">-- Seleccionar Arma del Compendio --</option>'+
        catalog.map(function(catItem){
          var isLockedOpt = catItem.visible === false;
          return '<option value="'+catItem.id+'" '+(selectedCatItem && selectedCatItem.id===catItem.id?'selected':'')+'>'+(isLockedOpt ? '🔒 ' : '')+esc(catItem.name)+' ('+esc(catItem.dano)+')'+(isLockedOpt ? ' [Bloqueada]' : '')+'</option>';
        }).join('')+
      '</select>'+
      (isBlocked && !isGM()
        ? '<button class="dice-btn disabled" disabled title="Esta arma está bloqueada por el Máster y no se puede usar en combate" aria-label="Arma bloqueada" style="opacity:0.38;cursor:not-allowed;filter:grayscale(1);">🔒</button>'
        : '<button class="dice-btn" data-action="roll-weapon" data-id="'+w.id+'" title="Tirar Daño ('+esc(selectedCatItem ? selectedCatItem.dano : "1d6")+')" aria-label="Tirar daño">&#127922;</button>'
      )+
      (canEdit ? '<button class="row-del" data-action="del-weapon" data-id="'+w.id+'" aria-label="Eliminar arma">✕</button>' : '')+
    '</div>'+
    '<div style="font-size:0.7rem;color:var(--gold-light);margin-bottom:6px;padding-left:2px;">'+infoText+(selectedCatItem && selectedCatItem.critico?' | <b>Crítico:</b> '+esc(selectedCatItem.critico):'')+'</div>';
  });
  if(canEdit){
    html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-weapon">+ Añadir arma al equipo</button>';
  }
  html += '</div>';

  // 6. Armaduras
  html += '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Armaduras</span></div>';
  (c.armors||[]).forEach(function(a){
    html += '<div class="list-row armor-row">'+
      '<input type="text" placeholder="Armadura" data-bind="armors.'+a.id+'.name" value="'+esc(a.name)+'" aria-label="Nombre de armadura" '+(canEdit?'':'readonly')+'>'+
      '<input type="text" placeholder="Absorción" data-bind="armors.'+a.id+'.absorcion" value="'+esc(a.absorcion)+'" aria-label="Absorción" '+(canEdit?'':'readonly')+'>'+
      '<input type="text" placeholder="Estorbo" data-bind="armors.'+a.id+'.estorbo" value="'+esc(a.estorbo)+'" aria-label="Estorbo" '+(canEdit?'':'readonly')+'>'+
      (canEdit ? '<button class="row-del" data-action="del-armor" data-id="'+a.id+'" aria-label="Eliminar armadura">✕</button>' : '')+
    '</div>';
  });
  if(canEdit){
    html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-armor">+ Añadir armadura</button>';
  }
  html += '</div>';

  html += rollLogHtml();
  return html;
}

function tplEstados(c){
  var assignedBuffs = c.activeBuffs || [];
  var catalogBuffs = (state.buffCatalog || []).filter(function(b){ return isGM() || b.visible !== false; });
  var canEdit = canEditChar(c);

  var html = '';

  // 1. Subnavegación rápida entre Combate y Estados
  html += '<div class="combat-subnav-pills">'+
    '<button type="button" class="subnav-pill" data-action="switch-tab" data-tab="combate">⚔️ Combate y Armas</button>'+
    '<button type="button" class="subnav-pill active" data-action="switch-tab" data-tab="estados">💫 Estados y Buffs ('+assignedBuffs.length+')</button>'+
  '</div>';

  if(!canEdit && currentUser){
    html += '<div class="spectator-banner">'+
      '<span>👁️ Modo Espectador: Solo lectura. No puedes modificar los estados de este personaje.</span>'+
    '</div>';
  }

  // 2. Sección Buffs y Debuffs Asignados con tarjetas legibles
  html += '<div class="section'+(c.isNPC?' gm-section':'')+'">'+
    '<div class="section-title"><span>Buffs y Debuffs Asignados</span></div>';

  if(assignedBuffs.length === 0){
    html += '<div class="empty-state-box" style="font-size:.78rem;color:var(--ink-dim);font-style:italic;padding:12px;background:var(--bg-elev);border:1px dashed var(--line);border-radius:8px;margin-bottom:12px;text-align:center;">'+
      'No hay buffs ni debuffs asignados a este personaje.<br>Puedes asignar uno desde el catálogo rápido inferior.</div>';
  } else {
    html += '<div class="assigned-buffs-cards-list" style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px;">';
    assignedBuffs.forEach(function(ab){
      var isActive = ab.active !== false;
      var isDebuff = ab.type === "debuff";
      var statusClass = isActive ? (isDebuff ? 'buff-status-debuff-active' : 'buff-status-active') : 'buff-status-inactive';
      var statusLabel = isActive ? 'ACTIVO ✓' : 'DESACTIVADO ⏸';
      var statusTitle = isActive ? (isDebuff ? 'Debuff activo y aplicando penalizaciones. Clic para desactivar.' : 'Buff activo y aplicando efectos. Clic para desactivar.') : 'Estado asignado pero desactivado. Clic para activar.';
      var cardClass = 'assigned-buff-card ' + (isActive ? (isDebuff ? 'is-debuff' : 'is-buff') : 'is-inactive');

      html += '<div class="'+cardClass+'">'+
        '<div class="abc-header">'+
          '<div class="abc-tags">'+
            '<span class="abc-type-tag '+(isDebuff?'debuff':'buff')+'">'+(isDebuff?'⚠️ DEBUFF':'✨ BUFF')+'</span>'+
            (ab.duration ? '<span class="abc-duration-tag" style="font-size:.68rem;color:var(--gold-light);background:rgba(176,141,87,0.15);padding:2px 6px;border-radius:4px;">⏱️ '+esc(ab.duration)+'</span>' : '')+
          '</div>'+
          '<div class="abc-actions">'+
            (canEdit ? 
              '<button type="button" class="buff-toggle-btn '+statusClass+'" data-action="toggle-global-buff" data-id="'+ab.id+'" title="'+statusTitle+'" style="font-size:.7rem;padding:4px 8px;border-radius:4px;cursor:pointer;font-weight:700;min-height:28px;">'+statusLabel+'</button>'+
              '<button type="button" class="buff-unassign-btn" data-action="remove-active-buff" data-id="'+ab.id+'" title="Desanclar este estado del personaje" style="background:none;border:1px solid var(--line);border-radius:4px;color:var(--danger);font-size:.75rem;padding:4px 8px;cursor:pointer;min-height:28px;">✕</button>'
            : '<span class="buff-toggle-btn '+statusClass+'" style="font-size:.7rem;padding:4px 8px;border-radius:4px;font-weight:700;">'+statusLabel+'</span>')+
          '</div>'+
        '</div>'+
        '<div class="abc-title-row" style="margin-top:3px;">'+
          '<h4 class="abc-title'+(isActive?'':' inactive')+'" style="margin:0;font-size:.92rem;font-weight:700;color:'+(isActive?(isDebuff?'#E88178':'var(--ink)'):'var(--ink-dim)')+';line-height:1.35;word-break:break-word;">'+esc(ab.name)+'</h4>'+
        '</div>'+
        (ab.bonus ? 
          '<div class="abc-effect-row" style="margin-top:4px;">'+
            '<span class="abc-bonus-badge '+(isDebuff?'debuff':'buff')+'" style="display:inline-flex;align-items:center;gap:4px;font-size:.75rem;padding:2px 7px;border-radius:4px;font-weight:600;background:'+(isDebuff?'rgba(192,57,43,0.18)':'rgba(61,110,96,0.2)')+';color:'+(isDebuff?'#E88178':'var(--teal-light)')+';border:1px dashed '+(isDebuff?'rgba(232,129,120,0.5)':'rgba(61,110,96,0.5)')+';">'+
              '🎯 Efecto: <b>'+esc(ab.bonus)+'</b>'+(ab.attr ? ' ('+esc(ab.attr)+')' : '')+
            '</span>'+
          '</div>' : '')+
        (ab.desc ? '<div class="abc-desc" style="font-size:.72rem;color:var(--ink-dim);font-style:italic;line-height:1.3;margin-top:3px;">'+esc(ab.desc)+'</div>' : '')+
      '</div>';
    });
    html += '</div>';
  }

  // Selector del Catálogo Global
  var unassignedBuffs = catalogBuffs.filter(function(b){
    return !assignedBuffs.some(function(ab){ return ab.id === b.id; });
  });

  if(canEdit){
    html += '<div class="catalog-assign-row" style="display:flex;flex-direction:column;gap:6px;margin-top:12px;border-top:1px solid var(--line);padding-top:10px;">'+
      '<label style="font-size:.68rem;color:var(--ink-faint);text-transform:uppercase;font-weight:700;">+ Asignar Estado desde el Catálogo Global:</label>'+
      '<select data-action="assign-buff-from-catalog" class="buff-quick-assign-select" style="font-size:.82rem;padding:7px 10px;background:var(--bg-card);border:1px solid var(--line);border-radius:6px;color:var(--ink);width:100%;">'+
        '<option value="">-- Seleccionar buff o debuff para asignar --</option>'+
        unassignedBuffs.map(function(ub){
          return '<option value="'+ub.id+'">'+(ub.type==='debuff'?'⚠️ [Debuff] ':'✨ [Buff] ')+esc(ub.name)+(ub.bonus?' ('+esc(ub.bonus)+')':'')+'</option>';
        }).join('')+
      '</select>'+
    '</div>';
  }

  // Panel desplegable con los 3 estados claros para cada buff/debuff del catálogo
  html += '<details class="buff-catalog-details" style="background:var(--bg-card);border:1px solid var(--line);border-radius:6px;padding:8px 10px;margin-top:10px;">'+
    '<summary style="font-size:.75rem;color:var(--gold-light);cursor:pointer;user-select:none;font-weight:600;">📋 Ver todos los buffs y debuffs del catálogo ('+catalogBuffs.length+' totales) y sus 3 estados</summary>'+
    '<div style="display:flex;flex-direction:column;gap:6px;margin-top:10px;">';

  catalogBuffs.forEach(function(cbuff){
    var assigned = assignedBuffs.find(function(ab){ return ab.id === cbuff.id; });
    var stateBadge = '';
    var actionBtns = '';

    if(!assigned){
      stateBadge = '<span class="buff-state-pill unassigned" style="font-size:.65rem;padding:2px 6px;border-radius:4px;background:rgba(255,255,255,0.06);color:var(--ink-dim);border:1px solid var(--line);font-weight:600;">○ No asignado</span>';
      if(canEdit){
        actionBtns = '<button type="button" class="btn-compact" data-action="assign-buff-from-catalog" data-id="'+cbuff.id+'" style="font-size:.68rem;padding:4px 8px;">+ Asignar</button>';
      }
    } else if(assigned.active === false){
      stateBadge = '<span class="buff-state-pill assigned-inactive" style="font-size:.65rem;padding:2px 6px;border-radius:4px;background:rgba(180,130,40,0.18);color:#E5B869;border:1px solid rgba(180,130,40,0.35);font-weight:600;">⏸ Inactivo</span>';
      if(canEdit){
        actionBtns = '<button type="button" class="btn-compact" data-action="toggle-global-buff" data-id="'+cbuff.id+'" style="font-size:.68rem;padding:4px 8px;">Activar</button>'+
          '<button type="button" class="row-del" data-action="remove-active-buff" data-id="'+cbuff.id+'" title="Desanclar del personaje" style="min-width:26px;min-height:26px;width:26px;height:26px;font-size:.7rem;">✕</button>';
      }
    } else {
      stateBadge = '<span class="buff-state-pill assigned-active" style="font-size:.65rem;padding:2px 6px;border-radius:4px;background:rgba(61,110,96,0.25);color:var(--teal-light);border:1px solid var(--teal-light);font-weight:600;">✓ Activo</span>';
      if(canEdit){
        actionBtns = '<button type="button" class="btn-compact" data-action="toggle-global-buff" data-id="'+cbuff.id+'" style="font-size:.68rem;padding:4px 8px;">Desactivar</button>'+
          '<button type="button" class="row-del" data-action="remove-active-buff" data-id="'+cbuff.id+'" title="Desanclar del personaje" style="min-width:26px;min-height:26px;width:26px;height:26px;font-size:.7rem;">✕</button>';
      }
    }

    html += '<div class="catalog-buff-row" style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 8px;background:var(--bg-elev);border:1px solid var(--line);border-radius:5px;flex-wrap:wrap;">'+
      '<div style="display:flex;align-items:center;gap:6px;min-width:0;flex:1 1 200px;">'+
        '<span style="font-size:.82rem;">'+(cbuff.type==='debuff'?'⚠️':'✨')+'</span>'+
        '<span style="font-size:.78rem;font-weight:600;color:var(--ink);">'+esc(cbuff.name)+(cbuff.bonus?' ('+esc(cbuff.bonus)+')':'')+'</span>'+
        stateBadge+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:4px;flex:none;">'+
        actionBtns+
      '</div>'+
    '</div>';
  });

  html += '</div></details>';
  html += '</div>';

  // 3. Magias y Hechizos Activos
  var activeSpells = (c.spells||[]).filter(function(sp){ return sp.active; });
  if(activeSpells.length > 0){
    html += '<div class="section'+(c.isNPC?' gm-section':'')+'">'+
      '<div class="section-title"><span>Magias y Hechizos Activos</span></div>'+
      '<div style="font-size:.72rem;color:var(--teal-light);margin-bottom:8px;">Hechizos actualmente concentrados o activos que otorgan bonificadores:</div>'+
      '<div style="display:flex;flex-direction:column;gap:6px;">';
    activeSpells.forEach(function(asp){
      var stacks = asp.activeStacks || 1;
      var statNote = (asp.statAttr && asp.statMod) ? ' ('+asp.statMod+' a '+asp.statAttr+(stacks>1?' x'+stacks:'')+')' : (stacks>1?' (x'+stacks+')':'');
      html += '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;background:rgba(61,110,96,0.15);border:1px solid var(--teal-light);border-radius:6px;">'+
        '<span style="font-size:.8rem;color:var(--teal-light);font-weight:600;">✨ '+esc(asp.name || "Hechizo")+(stacks>1?' <b>(Cargas: '+stacks+')</b>':'')+statNote+'</span>'+
        (canEdit ? '<button class="row-del" data-action="toggle-spell-active" data-id="'+asp.id+'" aria-label="Quitar carga de magia" style="min-width:28px;min-height:28px;width:28px;height:28px;" title="Quitar 1 carga">✕</button>' : '')+
      '</div>';
    });
    html += '</div></div>';
  }

  // 4. Anotaciones y Estados Temporales
  html += '<div class="section'+(c.isNPC?' gm-section':'')+'">'+
    '<div class="section-title"><span>Anotaciones y Estados Temporales</span></div>';
  if(c.customBuffs && c.customBuffs.length){
    c.customBuffs.forEach(function(cbuff){
      html += '<div class="list-row text-row">'+
        '<input type="text" placeholder="Efecto de estado temporal" data-bind="customBuffs.'+cbuff.id+'.name" value="'+esc(cbuff.name)+'" '+(canEdit?'':'readonly')+'>'+
        (canEdit ? '<button class="row-del" data-action="del-custom-buff" data-id="'+cbuff.id+'" aria-label="Eliminar buff">✕</button>' : '')+
      '</div>';
    });
  }
  if(canEdit){
    html += '<button class="btn-compact" style="margin-top:6px;width:100%;" data-action="add-custom-buff">+ Añadir estado temporal</button>';
  }
  html += '</div>';

  html += rollLogHtml();
  return html;
}

function combatStat(label,bind,val,rollable){
  var c = activeChar();
  var canEdit = canEditChar(c);
  var eff = getEffectiveCombatStat(bind, c);
  var diff = eff - num(val, 0);
  var diffBadge = diff !== 0 ? '<span class="stat-eff-tag '+(diff>0?'pos':'neg')+'" title="Valor efectivo">'+(diff>0?'+'+diff:diff)+' (Total: '+eff+')</span>' : '';
  return '<div class="combat-stat"><label>'+esc(label)+diffBadge+'</label>'+
    '<input type="number" data-bind="combat.'+bind+'" value="'+num(val,0)+'" aria-label="'+esc(label)+'" '+(canEdit?'':'readonly')+'>'+
    (rollable?'<button class="mini-roll" data-action="roll-init" aria-label="Tirar iniciativa" title="Tirar Iniciativa (1d10 + '+eff+')">&#127922;</button>':'')+
  '</div>';
}

function renderSpellStatOptions(curVal){
  return '<option value="">-- Sin efecto en stats --</option>'+
    '<optgroup label="Combate y Vida">'+
      '<option value="escudo" '+((curVal==='escudo'||curVal==='vida_falsa'||curVal==='escudoActual'||curVal==='vida falsa')?'selected':'')+'>🛡️ Escudo / Vida Falsa</option>'+
      '<option value="defensa" '+(curVal==='defensa'?'selected':'')+'>Defensa</option>'+
      '<option value="defensaMagica" '+(curVal==='defensaMagica'?'selected':'')+'>Defensa Mágica</option>'+
      '<option value="movilidad" '+(curVal==='movilidad'?'selected':'')+'>Movilidad</option>'+
      '<option value="iniciativa" '+(curVal==='iniciativa'?'selected':'')+'>Iniciativa</option>'+
    '</optgroup>'+
    '<optgroup label="Habilidades clave">'+
      '<option value="melee" '+(curVal==='melee'?'selected':'')+'>Armas a melé</option>'+
      '<option value="distancia" '+(curVal==='distancia'?'selected':'')+'>Ataque a distancia</option>'+
      '<option value="esquivar" '+(curVal==='esquivar'?'selected':'')+'>Esquivar</option>'+
      '<option value="sigilo" '+(curVal==='sigilo'?'selected':'')+'>Sigilo</option>'+
      '<option value="percepcion" '+(curVal==='percepcion'?'selected':'')+'>Percepción</option>'+
      '<option value="todo" '+(curVal==='todo'?'selected':'')+'>Todo (+ a todo)</option>'+
    '</optgroup>';
}

function tplMagia(c){
  var canEdit = canEditChar(c);
  var html = '';
  if(!canEdit && currentUser){
    html += '<div class="spectator-banner">'+
      '<span>👁️ Modo Espectador: Solo lectura. No puedes lanzar hechizos, gastar maná ni modificar el grimorio en esta ficha.</span>'+
    '</div>';
  }
  html += '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Grimorio y Artes Mágicas</span></div>'+
    '<div class="field" style="margin-bottom:12px;"><label>Tipo de Magia</label><input type="text" data-bind="magiaTipo" value="'+esc(c.magiaTipo)+'" placeholder="Ej: Piroclástica, Nigromancia, Sanación..." '+(canEdit?'':'readonly')+'></div>';

  if(!c.spells || !c.spells.length){
    html += '<div style="font-size:.82rem;color:var(--ink-faint);font-style:italic;padding:8px 2px;">Sin hechizos conocidos en el grimorio.</div>';
  } else {
    c.spells.forEach(function(s){
      var isActive = !!s.active;
      var stacks = s.activeStacks || (isActive ? 1 : 0);
      var hasStatMod = s.statAttr && s.statMod;
      var statBadge = hasStatMod ? '<span class="spell-badge effect">✨ '+esc(s.statMod)+' '+esc(s.statAttr)+(stacks>1?' (x'+stacks+')':'')+'</span>' : '';
      var activeBadge = isActive ? '<span class="spell-badge active">ACTIVO'+(stacks>1?' x'+stacks:'')+'</span>' : '';

      html += '<div class="spell-card'+(isActive?' active-spell':'')+'">'+
        '<div class="spell-card-header">'+
          '<input type="text" class="spell-name-input" placeholder="Nombre del Hechizo" data-bind="spells.'+s.id+'.name" value="'+esc(s.name)+'" '+(canEdit?'':'readonly')+'>'+
          '<div class="spell-badges">'+
            activeBadge+
            statBadge+
            (canEdit ? (isActive ?
              '<button class="spell-btn-act cast" data-action="cast-spell" data-id="'+s.id+'" title="Lanzar de nuevo y superponer">+ Superponer (-'+num(s.coste, 1)+' Maná)</button>'+
              '<button class="spell-btn-act cancel" data-action="toggle-spell-active" data-id="'+s.id+'" title="Quitar una carga o desactivar">✕ Quitar Carga ('+stacks+')</button>' :
              '<button class="spell-btn-act cast" data-action="cast-spell" data-id="'+s.id+'">⚡ Activar (-'+num(s.coste, 1)+' Maná)</button>'
            ) : '')+
            (canEdit ? '<button class="row-del" data-action="del-spell" data-id="'+s.id+'" aria-label="Eliminar hechizo" style="min-width:28px;min-height:28px;width:28px;height:28px;">✕</button>' : '')+
          '</div>'+
        '</div>'+
        '<div class="spell-grid">'+
          '<div class="creature-field"><label>Coste (Maná)</label><input type="number" min="0" data-bind="spells.'+s.id+'.coste" value="'+num(s.coste, 1)+'" '+(canEdit?'':'readonly')+'></div>'+
          '<div class="creature-field"><label>Alcance / Rango</label><input type="text" placeholder="Melé, 30m, Personal..." data-bind="spells.'+s.id+'.rango" value="'+esc(s.rango)+'" '+(canEdit?'':'readonly')+'></div>'+
        '</div>'+
        '<div class="spell-grid" style="margin-top:6px;">'+
          '<div class="creature-field"><label>Stat que Afecta (Opcional)</label>'+
            '<select style="font-size:.74rem;background:var(--bg-card);padding:3px 6px;border:1px solid var(--line);border-radius:var(--radius-sm);color:var(--ink);" data-bind="spells.'+s.id+'.statAttr" '+(canEdit?'':'disabled')+'>'+
              renderSpellStatOptions(s.statAttr)+
            '</select>'+
          '</div>'+
          '<div class="creature-field"><label>Modificador de Stat</label><input type="text" placeholder="+2, -1, +1d4..." data-bind="spells.'+s.id+'.statMod" value="'+esc(s.statMod)+'" '+(canEdit?'':'readonly')+'></div>'+
        '</div>'+
        '<div class="creature-field" style="margin-top:6px;"><label>Efecto y Descripción Narrativa</label>'+
          '<textarea class="spell-notes" placeholder="Efectos mágicos, reglas específicas o descripción..." data-bind="spells.'+s.id+'.efecto" '+(canEdit?'':'readonly')+'>'+esc(s.efecto)+'</textarea>'+
        '</div>'+
      '</div>';
    });
  }

  if(canEdit){
    html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-spell">+ Añadir Hechizo al Grimorio</button>';
  }
  html += '</div>';

  html += '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Piedras Mágicas</span></div>';
  (c.stones||[]).forEach(function(s){
    html += '<div class="list-row stone-row">'+
      '<input type="text" placeholder="Color" data-bind="stones.'+s.id+'.color" value="'+esc(s.color)+'" '+(canEdit?'':'readonly')+'>'+
      '<input type="text" placeholder="Efecto" data-bind="stones.'+s.id+'.efecto" value="'+esc(s.efecto)+'" '+(canEdit?'':'readonly')+'>'+
      (canEdit ? '<button class="row-del" data-action="del-stone" data-id="'+s.id+'" aria-label="Eliminar piedra">✕</button>' : '')+
    '</div>';
  });
  if(canEdit){
    html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-stone">+ Añadir piedra</button>';
  }
  html += '</div>';
  return html;
}

function tplAlquimia(c){
  var canEdit = canEditChar(c);
  var html = '';
  if(!canEdit && currentUser){
    html += '<div class="spectator-banner">'+
      '<span>👁️ Modo Espectador: Solo lectura. No puedes modificar fórmulas ni venenos en esta ficha.</span>'+
    '</div>';
  }
  html += '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Laboratorio Alquímico y Venenos</span></div>';
  (c.poisons||[]).forEach(function(p){
    html += '<div class="creature-card">'+
      '<div class="creature-card-header">'+
        '<input type="text" class="creature-name-input" data-bind="poisons.'+p.id+'.name" value="'+esc(p.name)+'" placeholder="Nombre del veneno" '+(canEdit?'':'readonly')+'>'+
        '<div style="display:flex;align-items:center;gap:6px;">'+
          '<span style="font-size:.65rem;color:var(--ink-faint);">Dosis:</span>'+
          '<input type="number" style="width:40px;text-align:center;background:var(--bg-card);padding:2px;" data-bind="poisons.'+p.id+'.dosis" value="'+num(p.dosis,0)+'" '+(canEdit?'':'readonly')+'>'+
          (canEdit ? '<button class="row-del" data-action="del-poison" data-id="'+p.id+'" aria-label="Eliminar veneno">✕</button>' : '')+
        '</div>'+
      '</div>'+
      '<div class="creature-grid" style="grid-template-columns:1fr 1fr;margin-top:6px;">'+
        '<div class="creature-field"><label style="color:#E74C3C;">Efecto en Enemigos</label><textarea class="creature-notes" data-bind="poisons.'+p.id+'.efectoEnemigo" '+(canEdit?'':'readonly')+'>'+esc(p.efectoEnemigo)+'</textarea></div>'+
        '<div class="creature-field"><label style="color:var(--teal-light);">Efecto Propio (Buff)</label><textarea class="creature-notes" data-bind="poisons.'+p.id+'.efectoCherk" '+(canEdit?'':'readonly')+'>'+esc(p.efectoCherk)+'</textarea></div>'+
      '</div>'+
      '<div style="margin-top:6px;">'+
        '<select style="font-size:.72rem;background:var(--bg-card);padding:2px 6px;" data-bind="poisons.'+p.id+'.estado" '+(canEdit?'':'disabled')+'>'+
          '<option value="descubierto" '+(p.estado==='descubierto'?'selected':'')+'>Descubierto</option>'+
          '<option value="investigando" '+(p.estado==='investigando'?'selected':'')+'>Investigando...</option>'+
        '</select>'+
      '</div>'+
      '</div>';
  });
  if(canEdit){
    html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-poison">+ Añadir veneno / fórmula</button>';
  }
  html += '</div>';
  return html;
}

function tplInventario(c){
  c.money = c.money || { oro: 0, plata: 0 };
  c.inventory = c.inventory || [];
  c.inventory.forEach(function(it){
    if(!it.category) it.category = "Miscelánea";
  });
  var canEdit = canEditChar(c);

  var html = '';
  if(!canEdit && currentUser){
    html += '<div class="spectator-banner">'+
      '<span>👁️ Modo Espectador: Solo lectura. No puedes modificar el dinero ni los objetos del inventario en esta ficha.</span>'+
    '</div>';
  }
  html += '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Dinero</span></div>'+
    '<div class="money-row">'+
      '<div class="money-field"><label>Oro</label><input type="number" data-bind="money.oro" data-last-val="'+num(c.money.oro,0)+'" value="'+num(c.money.oro,0)+'" '+(canEdit?'':'readonly')+'></div>'+
      '<div class="money-field"><label>Plata</label><input type="number" data-bind="money.plata" data-last-val="'+num(c.money.plata,0)+'" value="'+num(c.money.plata,0)+'" '+(canEdit?'':'readonly')+'></div>'+
    '</div></div>';

  var currentCat = state.invCategoryFilter || "all";
  var categories = typeof INVENTORY_CATEGORIES !== "undefined" ? INVENTORY_CATEGORIES : [
    "Armas",
    "Armadura y vestimenta",
    "Accesorios",
    "Consumibles",
    "Supervivencia",
    "Objetos de misión",
    "Materiales/Ingredientes",
    "Objetos especiales/únicos",
    "Miscelánea"
  ];

  var catCounts = {};
  categories.forEach(function(cat){ catCounts[cat] = 0; });
  c.inventory.forEach(function(it){
    var cat = it.category || "Miscelánea";
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  });

  html += '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Equipo e Inventario</span></div>';

  html += '<div class="inv-filter-bar" style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px;background:var(--bg-elev);padding:8px 10px;border-radius:6px;border:1px solid var(--line);flex-wrap:wrap;">'+
    '<div style="font-size:.72rem;color:var(--gold-light);font-weight:700;text-transform:uppercase;letter-spacing:.03em;">📂 Filtrar Categoría:</div>'+
    '<select class="inv-category-filter" data-action="filter-inventory-category" style="background:var(--bg-card);border:1px solid var(--line);border-radius:5px;padding:6px 8px;font-size:.82rem;color:var(--ink);flex:1;min-width:180px;max-width:320px;">'+
      '<option value="all" '+(currentCat==="all"?'selected':'')+'>Todas las categorías ('+c.inventory.length+')</option>'+
      categories.map(function(cat){
        return '<option value="'+cat+'" '+(currentCat===cat?'selected':'')+'>'+cat+' ('+(catCounts[cat]||0)+')</option>';
      }).join('')+
    '</select>'+
  '</div>';

  var filteredItems = c.inventory.filter(function(it){
    if(currentCat === "all") return true;
    return (it.category || "Miscelánea") === currentCat;
  });

  if(filteredItems.length === 0){
    html += '<div style="font-size:.78rem;color:var(--ink-dim);font-style:italic;padding:14px;text-align:center;background:var(--bg-elev);border:1px dashed var(--line);border-radius:6px;margin-bottom:10px;">'+
      (currentCat === "all" ? 'El inventario está vacío.' : 'No hay objetos registrados en la categoría "'+currentCat+'".')+
    '</div>';
  } else {
    filteredItems.forEach(function(it){
      var itCat = it.category || "Miscelánea";
      html += '<div class="list-row inv-row">'+
        '<input type="text" placeholder="Nombre del objeto" data-bind="inventory.'+it.id+'.name" value="'+esc(it.name)+'" '+(canEdit?'':'readonly')+'>'+
        '<select class="inv-cat-select" data-bind="inventory.'+it.id+'.category" aria-label="Categoría" '+(canEdit?'':'disabled')+'>'+
          categories.map(function(cat){
            return '<option value="'+cat+'" '+(itCat===cat?'selected':'')+'>'+cat+'</option>';
          }).join('')+
        '</select>'+
        '<input type="number" placeholder="Cant." data-bind="inventory.'+it.id+'.qty" value="'+num(it.qty,1)+'" '+(canEdit?'':'readonly')+'>'+
        (canEdit ? '<button class="row-del" data-action="del-inventory" data-id="'+it.id+'" aria-label="Eliminar objeto">✕</button>' : '')+
      '</div>';
    });
  }

  if(canEdit){
    var addBtnLabel = (currentCat !== "all") ? ('+ Añadir objeto a ' + currentCat) : '+ Añadir objeto';
    html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-inventory">'+addBtnLabel+'</button>';
  }
  html += '</div>';
  return html;
}

function splitSummonHabilidades(s){
  var tiradas = (s.tiradas !== undefined && s.tiradas !== null) ? s.tiradas : "";
  var rasgos = (s.rasgos !== undefined && s.rasgos !== null) ? s.rasgos : "";
  if(!tiradas && !rasgos && (s.habilidades || s.notas)){
    var raw = String(s.habilidades || s.notas).trim();
    var dotIdx = raw.indexOf('.');
    if(dotIdx !== -1){
      var firstPart = raw.slice(0, dotIdx).trim();
      var secondPart = raw.slice(dotIdx + 1).trim();
      if(/(\d+d\d+|\d+\+\d+d\d+|d\d+|\+\d+)/i.test(firstPart)){
        tiradas = firstPart;
        rasgos = secondPart;
      } else {
        rasgos = raw;
      }
    } else {
      if(/(\d+d\d+|\d+\+\d+d\d+|d\d+|\+\d+)/i.test(raw)){
        tiradas = raw;
      } else {
        rasgos = raw;
      }
    }
  }
  return { tiradas: tiradas, rasgos: rasgos };
}

function parseSummonRollItem(itemStr){
  var s = String(itemStr || "").trim();
  if(!s) return null;
  var m = s.match(/^(.*?)(?:[:\s]+)?(\d+\s*\+\s*\d*d\d+|\d*d\d+\s*[+-]\s*\d+|\d*d\d+|\+\d+)$/i);
  var label = s;
  var formula = "";
  if(m){
    label = m[1].trim() || "Tirada";
    formula = m[2].trim();
  } else {
    var m2 = s.match(/(.*?)(?:[:\s]+)?(\d*d\d+.*)/i);
    if(m2){
      label = m2[1].trim() || "Tirada";
      formula = m2[2].trim();
    }
  }
  var icon = "🎲";
  var lLower = label.toLowerCase();
  if(lLower.includes("melé") || lLower.includes("mele") || lLower.includes("ataque") || lLower.includes("mordisco") || lLower.includes("garra") || lLower.includes("picotazo")) icon = "⚔️";
  else if(lLower.includes("atletismo") || lLower.includes("fuerza") || lLower.includes("carrera")) icon = "🏃";
  else if(lLower.includes("inteligencia") || lLower.includes("conocimiento") || lLower.includes("arcana")) icon = "🧠";
  else if(lLower.includes("percepción") || lLower.includes("percepcion") || lLower.includes("vista") || lLower.includes("oído") || lLower.includes("oido")) icon = "👁️";
  else if(lLower.includes("sigilo") || lLower.includes("ocultar") || lLower.includes("esconder")) icon = "🥷";
  else if(lLower.includes("supervivencia") || lLower.includes("rastreo") || lLower.includes("naturaleza")) icon = "🌿";
  else if(lLower.includes("esquivar") || lLower.includes("evasión") || lLower.includes("evasion") || lLower.includes("agilidad")) icon = "💨";
  else if(lLower.includes("daño") || lLower.includes("dano")) icon = "🩸";

  return { raw: s, label: label, formula: formula, icon: icon };
}

function getSummonRollList(tiradasStr){
  var items = [];
  if(tiradasStr){
    tiradasStr.split(/[\n,]+/).forEach(function(part){
      var parsed = parseSummonRollItem(part);
      if(parsed) items.push(parsed);
    });
  }
  return items;
}

function serializeSummonRolls(items){
  return (items || []).map(function(it){
    return it.label + (it.formula ? " " + it.formula : "");
  }).join(", ");
}

function tplInvocaciones(c){
  c.summons = c.summons || [];
  var canEdit = canEditChar(c);
  var html = '';
  if(!canEdit && currentUser){
    html += '<div class="spectator-banner">'+
      '<span>👁️ Modo Espectador: Solo lectura. No puedes modificar ni gestionar invocaciones en esta ficha.</span>'+
    '</div>';
  }
  html += '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Invocaciones y Familiares</span></div>';

  if((c.summons||[]).length === 0){
    html += '<div style="font-size:0.82rem;color:var(--ink-faint);text-align:center;padding:16px 8px;font-style:italic;">No hay invocaciones ni familiares registrados.</div>';
  }

  (c.summons||[]).forEach(function(s){
    var split = splitSummonHabilidades(s);
    var tiradasVal = split.tiradas;
    var rasgosVal = split.rasgos;
    var imgStyle = s.image ? (' style="background-image:url(\'' + esc(s.image) + '\');"') : '';
    var isEditingSkills = !!(state._summonEditingSkills && state._summonEditingSkills[s.id]);

    var rollPills = getSummonRollList(tiradasVal);
    if(s.dano && /(\d*d\d+)/i.test(s.dano)){
      var hasDano = rollPills.some(function(it){ return it.label.toLowerCase().includes("daño") || it.label.toLowerCase().includes("dano"); });
      if(!hasDano){
        rollPills.push({
          raw: "Daño " + s.dano,
          label: "Daño",
          formula: s.dano,
          icon: "🩸"
        });
      }
    }

    var skillsContentHtml = '';
    if(isEditingSkills && canEdit){
      skillsContentHtml = '<div class="summon-skills-editor-table">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid rgba(176,141,87,0.2);">' +
          '<span style="font-size:0.72rem;color:var(--gold-light);font-weight:700;">Edita el nombre o bono de cada tirada:</span>' +
          '<button type="button" class="btn-compact" data-action="toggle-summon-skills-edit" data-id="' + s.id + '" style="padding:2px 8px;font-size:0.68rem;">✕ Cerrar</button>' +
        '</div>' +
        (rollPills.length > 0 ? rollPills.map(function(rp, idx){
          return '<div class="summon-skill-edit-row">' +
            '<span class="summon-skill-row-icon">' + rp.icon + '</span>' +
            '<input type="text" class="summon-skill-input-name" placeholder="Nombre (ej: Melé)" value="' + esc(rp.label) + '" data-action="change-summon-skill-name" data-summon-id="' + s.id + '" data-index="' + idx + '">' +
            '<input type="text" class="summon-skill-input-formula" placeholder="Fórmula (ej: 8+1d10)" value="' + esc(rp.formula) + '" data-action="change-summon-skill-formula" data-summon-id="' + s.id + '" data-index="' + idx + '">' +
            '<button type="button" class="row-del" data-action="del-summon-skill" data-summon-id="' + s.id + '" data-index="' + idx + '" title="Eliminar ' + esc(rp.label) + '">✕</button>' +
          '</div>';
        }).join('') : '<div style="font-size:0.75rem;color:var(--ink-faint);padding:6px 0;font-style:italic;">No hay tiradas todavía. Pulsa "+ Añadir tirada" para crear una.</div>') +
        '<div class="summon-skills-editor-actions" style="display:flex;gap:6px;align-items:center;margin-top:8px;flex-wrap:wrap;">' +
          '<button type="button" class="btn-compact" data-action="add-summon-skill" data-id="' + s.id + '">+ Añadir tirada</button>' +
          '<button type="button" class="btn-solid-gold" data-action="toggle-summon-skills-edit" data-id="' + s.id + '" style="padding:6px 14px;font-size:0.75rem;">✓ Guardar y Ver Botones</button>' +
        '</div>' +
      '</div>';
    } else {
      var pillsHtml = '';
      if(rollPills.length > 0){
        pillsHtml = rollPills.map(function(rp, idx){
          var actName = rp.label;
          var fStr = rp.formula || rp.raw;
          return '<div class="summon-roll-pill" title="' + esc(actName) + ' (' + esc(fStr) + ')">' +
            '<button type="button" class="pill-roll-act" data-action="roll-summon-action" data-summon-name="' + esc(s.name || 'Invocación') + '" data-action-name="' + esc(actName) + '" data-formula="' + esc(fStr) + '">' +
              '<span class="pill-icon">' + rp.icon + '</span>' +
              '<span class="pill-label">' + esc(actName) + '</span>' +
              (rp.formula ? ('<span class="pill-formula">' + esc(rp.formula) + '</span>') : '') +
            '</button>' +
            (canEdit ? ('<button type="button" class="pill-edit-act" data-action="edit-summon-roll" data-summon-id="' + s.id + '" data-action-name="' + esc(actName) + '" data-formula="' + esc(rp.formula || fStr) + '" data-index="' + idx + '" title="Modificar bono de ' + esc(actName) + '">✏️</button>') : '') +
          '</div>';
        }).join('');
      } else {
        pillsHtml = '<span style="font-size:0.75rem;color:var(--ink-faint);font-style:italic;">' + (canEdit ? 'Sin tiradas configuradas. Pulsa [+ Añadir] para crearlas.' : 'Sin tiradas registradas.') + '</span>';
      }
      skillsContentHtml = '<div class="summon-pills-wrap">' + pillsHtml + '</div>';
    }

    html += '<div class="creature-card summon-card">' +
      '<div class="summon-card-top">' +
        '<div class="summon-profile-box">' +
          '<div class="summon-avatar-img"' + imgStyle + ' title="' + esc(s.name || 'Invocación') + '">' + (s.image ? '' : '🐾') + '</div>' +
          (canEdit ? ('<div class="summon-img-actions">' +
            '<button class="btn-compact" data-action="upload-summon-img" data-id="' + s.id + '" title="Subir foto desde archivo">Foto</button>' +
            '<button class="btn-compact" data-action="url-summon-img" data-id="' + s.id + '" title="Pegar URL de foto">URL</button>' +
            (s.image ? ('<button class="btn-compact" data-action="remove-summon-img" data-id="' + s.id + '" title="Quitar foto">✕</button>') : '') +
          '</div>') : '') +
        '</div>' +
        '<div class="summon-stats-col">' +
          '<div class="creature-card-header" style="margin-bottom:6px;">' +
            '<input type="text" class="creature-name-input" placeholder="Nombre de la Invocación / Familiar" data-bind="summons.' + s.id + '.name" value="' + esc(s.name) + '"' + (!canEdit ? ' readonly' : '') + '>' +
            (canEdit ? ('<button class="row-del" data-action="del-summon" data-id="' + s.id + '" aria-label="Eliminar invocación">✕</button>') : '') +
          '</div>' +
          '<div class="creature-grid summon-stats-grid">' +
            creatureField("Vida", "summons." + s.id + ".vida", s.vida, !canEdit) +
            creatureField("Defensa", "summons." + s.id + ".defensa", s.defensa, !canEdit) +
            creatureField("Absorción", "summons." + s.id + ".absorcion", s.absorcion, !canEdit) +
            creatureField("Daño", "summons." + s.id + ".dano", s.dano, !canEdit) +
            '<div class="creature-field beast-mobility-cell">' +
              '<label>Movilidad (Casillas)</label>' +
              '<button type="button" class="beast-mov-btn" ' + (canEdit ? 'data-action="pick-summon-mov" data-id="' + s.id + '"' : 'disabled style="cursor:default;"') + ' title="Casillas de movimiento">' +
                '<span class="beast-mov-label">🏃 <strong>' + esc(s.casillasMovimiento || (s.movilidad ? (s.movilidad.match(/\d+/)?s.movilidad.match(/\d+/)[0]:'6') : '6')) + '</strong> casillas</span>' +
                (s.movilidad && s.movilidad.includes('(') ? (' <span class="beast-terrain-pill">' + esc(s.movilidad.slice(s.movilidad.indexOf('('))) + '</span>') : '') +
                (canEdit ? '<span class="beast-mov-chevron">▾</span>' : '') +
              '</button>' +
            '</div>' +
            creatureField("Inteligencia", "summons." + s.id + ".inteligencia", s.inteligencia, !canEdit) +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="summon-modules-container">' +
        '<div class="summon-block summon-rolls-block">' +
          '<div class="summon-block-header">' +
            '<div class="summon-block-title-wrap">' +
              '<span class="summon-block-title">⚔️ Tiradas y Habilidades</span>' +
              '<span class="summon-block-sub">Toca para tirar</span>' +
            '</div>' +
            (canEdit ? ('<div class="summon-block-actions">' +
              '<button type="button" class="btn-compact summon-action-btn' + (isEditingSkills ? ' btn-solid-gold' : '') + '" data-action="toggle-summon-skills-edit" data-id="' + s.id + '" title="Editar lista de habilidades">' +
                (isEditingSkills ? '✓ Ver Botones' : '✏️ Editar Habilidades') +
              '</button>' +
              '<button type="button" class="btn-compact summon-action-btn" data-action="add-summon-skill" data-id="' + s.id + '" title="Añadir nueva tirada">+ Añadir</button>' +
            '</div>') : '') +
          '</div>' +
          skillsContentHtml +
        '</div>' +

        '<div class="summon-block summon-traits-block">' +
          '<div class="summon-block-header">' +
            '<span class="summon-block-title">✨ Rasgos Especiales y Pasivas</span>' +
            '<span class="summon-block-sub">Efectos</span>' +
          '</div>' +
          '<div class="summon-traits-box">' +
            (canEdit ? ('<textarea class="summon-traits-textarea" placeholder="Rasgos pasivos y efectos de la criatura (ej: Obtienen un +1 a acertar los ataques cuando otra rata o Ink están al lado...)" data-bind="summons.' + s.id + '.rasgos">' + esc(rasgosVal) + '</textarea>') :
              (rasgosVal ? ('<div class="summon-traits-text">' + esc(rasgosVal) + '</div>') : '<div style="font-size:0.75rem;color:var(--ink-faint);font-style:italic;">Sin rasgos especiales registrados.</div>')) +
          '</div>' +
        '</div>' +

        ((canEdit || s.notas) ? ('<div class="summon-block summon-notes-block">' +
          '<div class="summon-block-header">' +
            '<span class="summon-block-title">📝 Notas Tácticas / Comportamiento</span>' +
            '<span class="summon-block-sub">Táctica</span>' +
          '</div>' +
          '<div class="summon-notes-box">' +
            (canEdit ? ('<textarea class="summon-notes-textarea" placeholder="Notas sobre el estado, táctica o invocador..." data-bind="summons.' + s.id + '.notas">' + esc(s.notas || '') + '</textarea>') :
              ('<div class="summon-notes-text">' + esc(s.notas || '') + '</div>')) +
          '</div>' +
        '</div>') : '') +
      '</div>' +
    '</div>';
  });

  if(canEdit){
    html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-summon">+ Añadir invocación</button>';
  }
  html += '</div>';
  return html;
}

function tplExtra(c){
  var canEdit = canEditChar(c);
  var html = '';
  if(!canEdit && currentUser){
    html += '<div class="spectator-banner">'+
      '<span>👁️ Modo Espectador: Solo lectura. No puedes modificar pasivas ni la tabla de diosas en esta ficha.</span>'+
    '</div>';
  }
  c.passivesNeg = c.passivesNeg || [];
  c.passivesPos = c.passivesPos || [];
  c.goddessTable = c.goddessTable || [];
  html += '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Pasivas Negativas</span></div>';
  (c.passivesNeg||[]).forEach(function(p){
    html += '<div class="list-row text-row"><input type="text" data-bind="passivesNeg.'+p.id+'.text" value="'+esc(p.text)+'" '+(canEdit?'':'readonly')+'>'+(canEdit?'<button class="row-del" data-action="del-passiveNeg" data-id="'+p.id+'" aria-label="Eliminar pasiva">✕</button>':'')+'</div>';
  });
  if(canEdit){
    html += '<button class="btn-compact" style="margin-top:6px;" data-action="add-passiveNeg">+ Añadir pasiva negativa</button>';
  }
  html += '</div>';

  html += '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Pasivas Positivas</span></div>';
  (c.passivesPos||[]).forEach(function(p){
    html += '<div class="list-row text-row"><input type="text" data-bind="passivesPos.'+p.id+'.text" value="'+esc(p.text)+'" '+(canEdit?'':'readonly')+'>'+(canEdit?'<button class="row-del" data-action="del-passivePos" data-id="'+p.id+'" aria-label="Eliminar pasiva">✕</button>':'')+'</div>';
  });
  if(canEdit){
    html += '<button class="btn-compact" style="margin-top:6px;" data-action="add-passivePos">+ Añadir pasiva positiva</button>';
  }
  html += '</div>';

  html += '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Tabla de Diosas</span></div>';
  (c.goddessTable||[]).forEach(function(g){
    html += '<div class="list-row god-row">'+
      '<input type="text" placeholder="Nombre" data-bind="goddessTable.'+g.id+'.nombre" value="'+esc(g.nombre)+'" '+(canEdit?'':'readonly')+'>'+
      '<input type="text" placeholder="Gustos" data-bind="goddessTable.'+g.id+'.gustos" value="'+esc(g.gustos)+'" '+(canEdit?'':'readonly')+'>'+
      '<input type="text" placeholder="Disgustos" data-bind="goddessTable.'+g.id+'.disgustos" value="'+esc(g.disgustos)+'" '+(canEdit?'':'readonly')+'>'+
      (canEdit?'<button class="row-del" data-action="del-goddess" data-id="'+g.id+'" aria-label="Eliminar diosa">✕</button>':'')+
    '</div>';
  });
  if(canEdit){
    html += '<button class="btn-compact" style="margin-top:6px;" data-action="add-goddess">+ Añadir diosa</button>';
  }
  html += '</div>';
  return html;
}

var currentWorldSubtab = "mapas";

function tplMundo(s){
  var subtab = currentWorldSubtab || "mapas";
  var html = '<div class="section" style="margin-bottom:10px;">'+
    '<div class="filter-pills">'+
      '<button class="f-pill '+(subtab==='mapas'?'active':'')+'" data-action="set-world-subtab" data-val="mapas">🗺️ Mapas</button>'+
      '<button class="f-pill '+(subtab==='armas'?'active':'')+'" data-action="set-world-subtab" data-val="armas">⚔️ Catálogo de Armas</button>'+
      '<button class="f-pill '+(subtab==='buffs'?'active':'')+'" data-action="set-world-subtab" data-val="buffs">✨ Buffos</button>'+
      '<button class="f-pill '+(subtab==='lore'?'active':'')+'" data-action="set-world-subtab" data-val="lore">📜 Lore y Flora</button>'+
    '</div>'+
  '</div>';

  if(subtab === "mapas"){
    html += tplMundoMapas(s);
  } else if(subtab === "armas"){
    html += tplMundoArmas(s);
  } else if(subtab === "buffs"){
    html += tplMundoBuffs(s);
  } else {
    html += tplMundoLore(s);
  }
  return html;
}


function tplMundoLore(s){
  var contPills = CONTINENTES.map(function(c){return '<button class="f-pill '+(loreContinentFilter===c?'active':'')+'" data-action="set-lore-continent" data-val="'+c+'">'+c+'</button>';}).join('');
  var typePills = TIPOS_OBJETO.map(function(t){return '<button class="f-pill '+(loreTypeFilter===t?'active':'')+'" data-action="set-lore-type" data-val="'+t+'">'+t+'</button>';}).join('');
  var terrPills = TERRENOS.map(function(tr){return '<button class="f-pill '+(loreTerrainFilter===tr?'active':'')+'" data-action="set-lore-terrain" data-val="'+tr+'">'+tr+'</button>';}).join('');

  var canEdit = isGM();
  var html = '<div class="section'+(canEdit?' gm-section':'')+'"><div class="section-title"><span>'+(canEdit?'Compendio de Lore, Fauna y Flora (GM)':'Compendio de Lore, Fauna y Flora')+'</span></div>'+
    '<div class="filter-section"><div class="filter-label">Continente</div><div class="filter-pills">'+contPills+'</div></div>'+
    (currentLoreSubtab==="objetos"?
      '<div class="filter-section"><div class="filter-label">Tipo</div><div class="filter-pills">'+typePills+'</div></div>'+
      '<div class="filter-section"><div class="filter-label">Terreno</div><div class="filter-pills">'+terrPills+'</div></div>':'')+
    '<div class="filter-pills" style="margin:10px 0;border-bottom:1px solid var(--line);padding-bottom:6px;">'+
      '<button class="f-pill '+(currentLoreSubtab==='objetos'?'active':'')+'" data-action="set-lore-subtab" data-val="objetos">🌿 Recursos / Objetos</button>'+
      '<button class="f-pill '+(currentLoreSubtab==='pistas'?'active':'')+'" data-action="set-lore-subtab" data-val="pistas">📜 Pistas</button>'+
      '<button class="f-pill '+(currentLoreSubtab==='npcs'?'active':'')+'" data-action="set-lore-subtab" data-val="npcs">👤 NPCs</button>'+
    '</div>';

  var cat = currentLoreSubtab;
  var items = (s.lore[cat]||[]).filter(function(it){
    if(!canEdit && it.visible===false) return false;
    var matchC = (loreContinentFilter==="Todos" || (it.continent||"Todos")===loreContinentFilter || (it.continent||"Todos")==="Todos");
    var matchT = (loreTypeFilter==="Todos" || (it.type||"")===loreTypeFilter);
    var matchTr = (loreTerrainFilter==="Todos" || (it.terrain||"").includes(loreTerrainFilter));
    return matchC && (cat!=="objetos" || (matchT && matchTr));
  });

  items.forEach(function(it){
    var rName = it.rarity || "Común";
    var rClass = "rarity-" + rName.toLowerCase().replace(/\s+/g,"");
    var bClass = "badge-" + rName.toLowerCase().replace(/\s+/g,"");

    html += '<div class="item-card '+rClass+'">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">'+
        '<div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap;">'+
          '<span class="item-badge '+bClass+'">'+rName+'</span>'+
          (it.type ? '<span style="font-size:.62rem;color:var(--teal-light);font-weight:700;">['+esc(it.type)+']</span>' : '')+
          (it.terrain ? '<span style="font-size:.62rem;color:var(--ink-faint);">📍 '+esc(it.terrain)+'</span>' : '')+
        '</div>'+
        '<div style="display:flex;gap:4px;">'+
          (canEdit ? '<button class="btn-compact" data-action="toggle-lore-visibility" data-cat="' + cat + '" data-id="' + it.id + '" title="Mostrar/Ocultar para jugadores">'+(it.visible!==false?'👁️':'🙈')+'</button>' : '')+
          (canEdit ? '<button class="row-del" data-action="del-lore" data-cat="' + cat + '" data-id="' + it.id + '" aria-label="Eliminar entrada">✕</button>' : '')+
        '</div>'+
      '</div>'+
      (canEdit ? '<input type="text" style="width:100%;font-family:var(--font-display);color:var(--gold-light);font-size:.95rem;margin-bottom:4px;" data-scope="global" data-bind="lore.'+cat+'.'+it.id+'.title" value="'+esc(it.title)+'" placeholder="Nombre">' : '<div style="font-family:var(--font-display);color:var(--gold-light);font-size:.95rem;margin-bottom:4px;">'+esc(it.title)+'</div>')+
      (canEdit ? '<textarea style="width:100%;font-size:.82rem;min-height:45px;" data-scope="global" data-bind="lore.'+cat+'.'+it.id+'.text" placeholder="Descripción...">'+esc(it.text)+'</textarea>' : '<p style="font-size:.82rem;color:var(--ink-dim);">'+esc(it.text)+'</p>')+
    '</div>';
  });

  if(canEdit){
    html += '<button class="btn-compact" data-action="open-lore-modal" data-cat="'+cat+'" style="margin-top:6px;">+ Añadir a '+cat+'</button>';
  }
  html += '</div>';
  return html;
}
