function renderTopbar(){
  var c = activeChar();
  if(document.body) document.body.setAttribute("data-theme", c.theme||"default");
  var curPv = num(c.combat.pvActual, 0);
  var maxHp = Math.max(1, num(c.combat.pvMax, 1));
  var maxMana = Math.max(1, num(c.combat.manaMax, 1));
  var hpPct = curPv <= 0 ? 0 : clamp(Math.round((curPv/maxHp)*100), 0, 100);
  var manaPct = clamp(Math.round((num(c.combat.manaActual,0)/maxMana)*100), 0, 100);
  var crestStyle = c.portrait ? ' style="background-image:url(\''+c.portrait+'\')"' : '';
  var isNPC = !!c.isNPC;
  var crestClass = isNPC ? 'char-crest npc' : 'char-crest';
  var nameClass = isNPC ? 'char-name npc-name' : 'char-name';

  var hpNumsClass = curPv < 0 ? 'gauge-nums dying' : (curPv === 0 ? 'gauge-nums unconscious' : 'gauge-nums');
  var hpStatusBadge = curPv < 0 ? '<span class="status-pill dying">💀 Agonizando ('+curPv+')</span>' : (curPv === 0 ? '<span class="status-pill unconscious">💤 Inconsciente</span>' : '');

  var crestContent = (c.portrait && c.portrait.trim())
    ? '<img src="' + esc(c.portrait) + '" alt="' + esc(c.name) + '" class="crest-img" onerror="this.style.display=\'none\';if(this.nextElementSibling)this.nextElementSibling.style.display=\'flex\';"><span class="crest-initial" style="display:none;">' + esc(c.name.charAt(0).toUpperCase()) + '</span>'
    : '<span class="crest-initial">' + esc(c.name.charAt(0).toUpperCase()) + '</span>';

  document.getElementById("topbar").innerHTML =
    '<div class="topbar-row">'+
      '<button class="char-switch" data-action="open-char-modal" aria-label="Cambiar personaje">'+
        '<span class="'+crestClass+'"'+crestStyle+'>'+crestContent+'</span>'+
        '<span class="char-info-box">'+
          '<div class="'+nameClass+'">'+esc(c.name)+'<span class="version-tag">v0.9.6</span></div>'+
          '<div class="char-sub">'+(isNPC?'NPC · ':'Nv. '+esc(c.nivel||"1")+' · ')+esc(c.trabajo||"Aventurero")+'</div>'+
        '</span>'+
      '</button>'+
      '<div style="display:flex;align-items:center;gap:4px;">'+
        '<span id="syncBadge" class="sync-status">'+(currentUser?'● Nube':'○ Local')+'</span>'+
        (isGM() ? '<span class="role-badge gm">★ GM</span>' : '<span class="role-badge player">Jugador</span>')+
        '<button class="icon-btn" data-action="open-data-modal" title="Ajustes y Sesión" aria-label="Ajustes">&#9881;</button>'+
      '</div>'+
    '</div>'+
    '<div class="gauges">'+
      '<div class="gauge-wrap">'+
        '<div class="gauge-label"><span>Vida '+hpStatusBadge+'</span><span class="'+hpNumsClass+'">'+curPv+' / '+maxHp+'</span></div>'+
        '<div class="gauge"><div class="gauge-fill hp" style="width:'+hpPct+'%;'+(curPv<=0?'background:#8C252F;':'')+'"></div></div>'+
        '<div class="gauge-adjust">'+
          '<button data-action="hp-mod" data-delta="-5" aria-label="Restar 5 vida">-5</button><button data-action="hp-mod" data-delta="-1" aria-label="Restar 1 vida">-1</button>'+
          '<button data-action="hp-mod" data-delta="1" aria-label="Sumar 1 vida">+1</button><button data-action="hp-mod" data-delta="5" aria-label="Sumar 5 vida">+5</button>'+
        '</div>'+
      '</div>'+
      '<div class="gauge-wrap">'+
        '<div class="gauge-label"><span style="color:var(--shield-light);" title="El Escudo y la Vida Falsa son equivalentes">🛡️ Escudo / Vida Falsa</span><span class="gauge-nums">'+num(c.combat.escudoActual,0)+'</span></div>'+
        '<div class="gauge"><div class="gauge-fill shield" style="width:'+clamp(num(c.combat.escudoActual,0)*10,0,100)+'%;"></div></div>'+
        '<div class="gauge-adjust">'+
          '<button data-action="shield-mod" data-delta="-3" aria-label="Restar 3 escudo">-3</button><button data-action="shield-mod" data-delta="-1" aria-label="Restar 1 escudo">-1</button>'+
          '<button data-action="shield-mod" data-delta="1" aria-label="Sumar 1 escudo">+1</button><button data-action="shield-mod" data-delta="3" aria-label="Sumar 3 escudo">+3</button>'+
        '</div>'+
      '</div>'+
      '<div class="gauge-wrap">'+
        '<div class="gauge-label"><span>Maná</span><span class="gauge-nums">'+num(c.combat.manaActual,0)+' / '+maxMana+'</span></div>'+
        '<div class="gauge"><div class="gauge-fill mana" style="width:'+manaPct+'%;"></div></div>'+
        '<div class="gauge-adjust">'+
          '<button data-action="mana-mod" data-delta="-5" aria-label="Restar 5 maná">-5</button><button data-action="mana-mod" data-delta="-1" aria-label="Restar 1 maná">-1</button>'+
          '<button data-action="mana-mod" data-delta="1" aria-label="Sumar 1 maná">+1</button><button data-action="mana-mod" data-delta="5" aria-label="Sumar 5 maná">+5</button>'+
        '</div>'+
      '</div>'+
    '</div>';
}

var PLAYER_TABS = [
  {id:"ficha",label:"Ficha"}, {id:"mision",label:"Misión"}, {id:"habilidades",label:"Habilidades"}, {id:"entrenamiento",label:"Entrenamiento"}, {id:"combate",label:"Combate"},
  {id:"inventario",label:"Inventario"}, {id:"magia",label:"Magia"}, {id:"alquimia",label:"Alquimia"},
  {id:"invocaciones",label:"Invocaciones"}, {id:"bestiario",label:"Bestiario"}, {id:"extra",label:"Extra"}, {id:"mundo",label:"Mundo"}
];

var GM_TABS = [
  {id:"ficha",label:"Ficha"}, {id:"mision",label:"Misión"}, {id:"habilidades",label:"Habilidades"}, {id:"entrenamiento",label:"Entrenamiento"}, {id:"combate",label:"Combate"},
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
  else if(state.activeTab==="inventario") main.innerHTML = tplInventario(c);
  else if(state.activeTab==="magia") main.innerHTML = tplMagia(c);
  else if(state.activeTab==="alquimia") main.innerHTML = tplAlquimia(c);
  else if(state.activeTab==="invocaciones") main.innerHTML = tplInvocaciones(c);
  else if(state.activeTab==="bestiario") main.innerHTML = tplBestiario(state);
  else if(state.activeTab==="extra") main.innerHTML = tplExtra(c);
  else if(state.activeTab==="mundo") main.innerHTML = tplMundo(state);
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
        '</div>'+
      '</div>';
    }
    return '<div class="attr-card"><label>'+ATTR_LABELS[a]+'</label><div class="attr-val-box">'+num(c.attrs[a],0)+'</div></div>';
  }).join('');

  var levelControl = '';
  if(isGM()){
    levelControl = '<button class="btn-solid-gold" data-action="grant-level">+ Nivel</button>';
  }

  return '<div class="section'+(c.isNPC?' gm-section':'')+'">'+
    '<div class="section-title"><span>'+(c.isNPC?'Ficha de NPC (Solo GM)':'Datos del Personaje')+'</span></div>'+
    '<div class="ficha-layout">'+
      '<div class="portrait-box">'+
        '<div class="portrait-img"'+pStyle+'>'+(c.portrait?'':'👤')+'</div>'+
        '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;">'+
          '<button class="btn-compact" data-action="upload-portrait" title="Subir foto desde archivo">Foto</button>'+
          '<button class="btn-compact" data-action="url-portrait" title="Pegar enlace de GitHub o web">URL</button>'+
          (c.portrait ? '<button class="btn-compact" data-action="remove-portrait" title="Quitar foto">✕</button>' : '')+
        '</div>'+
      '</div>'+
      '<div>'+
        '<div class="field-grid">'+
          field("Nombre", "name", c.name, "text")+
          '<div class="field"><label>'+(c.isNPC?'Nivel / CR':'Nivel')+'</label><div style="display:flex;gap:4px;"><input type="text" data-bind="nivel" value="'+esc(c.nivel||"1")+'" '+(c.isNPC?'':'readonly')+'>'+levelControl+'</div></div>'+
          field("Trabajo / Rol","trabajo",c.trabajo,"text")+
          field("Lugar Nacimiento","lugarNacimiento",c.lugarNacimiento,"text")+
          field("Altura","altura",c.altura,"text")+
          field("Peso","peso",c.peso,"text")+
          field("Edad","edad",c.edad,"text")+
          field("Color de Ojos","ojos",c.ojos,"text")+
          field("Color de Pelo","pelo",c.pelo,"text")+
        '</div>'+
        '<div style="margin-top:10px;">'+
          fieldArea("Descripción Física y Notas","descripcion",c.descripcion)+
        '</div>'+
      '</div>'+
    '</div>'+
  '</div>'+
  '<div class="section'+(c.isNPC?' gm-section':'')+'">'+
    '<div class="section-title"><span>Atributos'+(c.isNPC?' (Editables)':'')+'</span></div>'+
    '<div class="attr-grid">'+attrCards+'</div>'+
  '</div>';
}


function field(label,bind,val,type){
  return '<div class="field"><label>'+esc(label)+'</label><input type="'+type+'" data-bind="'+bind+'" value="'+esc(val)+'" aria-label="'+esc(label)+'"></div>';
}
function fieldArea(label,bind,val){
  return '<div class="field"><label>'+esc(label)+'</label><textarea data-bind="'+bind+'" aria-label="'+esc(label)+'">'+esc(val)+'</textarea></div>';
}

function tplHabilidades(c){
  var groups = {}; ATTRS.forEach(function(a){groups[a]=[];});
  var hybrids = [];
  SKILL_DEFS.forEach(function(s){ if(s.attr==="hybrid") hybrids.push(s); else groups[s.attr].push(s); });

  var unlocked = c.skillPointsUnlocked || false;
  if(c.isNPC){
    unlocked = true;
  }
  
  var banner = '';
  if(isGM() && !c.isNPC){
    banner = '<div class="skill-pool-banner">'+
      '<span>Puntos de mejora disponibles: <b>'+num(c.skillPoints,0)+'</b></span>'+
      '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">'+
        '<button class="btn-solid-gold" data-action="gm-add-skill-point" title="Dar 1 punto de habilidad al personaje">+1 Pto (GM)</button>'+
        '<button class="btn-solid-gold" data-action="toggle-skill-lock">'+(unlocked?'🔒 Bloquear Asignación (GM)':'🔓 Permitir Asignación (GM)')+'</button>'+
      '</div>'+
    '</div>';
  }
  
  if(c.isNPC && isGM()){
    banner = '<div class="skill-pool-banner">'+
      '<span>NPC - Puntos disponibles: <b>'+num(c.skillPoints,0)+'</b>. Habilidades editables.</span>'+
      '<button class="btn-solid-gold" data-action="gm-add-skill-point">+1 Pto (GM)</button>'+
    '</div>';
  }

  var html = '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Habilidades Generales</span></div>'+banner;
  ATTRS.forEach(function(a){
    html += '<div class="attr-group"><div class="attr-group-title">'+ATTR_LABELS[a]+'</div>';
    html += '<div class="skill-col-headers"><span>Habilidad</span><span>Base</span><span>Bono (Prog)</span><span>Total</span><span></span></div>';
    groups[a].forEach(function(s){ html += skillRowHtml(s, c, unlocked); });
    html += '</div>';
  });
  html += '<div class="attr-group"><div class="attr-group-title">Híbridas</div>';
  html += '<div class="skill-col-headers"><span>Habilidad</span><span>Base</span><span>Bono (Prog)</span><span>Total</span><span></span></div>';
  hybrids.forEach(function(s){ html += skillRowHtml(s, c, unlocked); });
  html += '</div>';

  if(c.customSkills && c.customSkills.length){
    html += '<div class="attr-group"><div class="attr-group-title">Personalizadas</div>';
    html += '<div class="skill-col-headers"><span>Habilidad</span><span>Base</span><span>Bono (Prog)</span><span>Total</span><span></span></div>';
    c.customSkills.forEach(function(cs){
      var bonusVal = num(cs.bonus, 0);
      if(!c.skillProgress) c.skillProgress = {};
      var prog = num(c.skillProgress[cs.id], 0);
      var costNeeded = bonusVal + 1;
      var canSub = prog > 0;
      var canAdd = false;
      if(bonusVal > 0 && bonusVal < 8){
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
  html += '</div>';
  html += rollLogHtml();
  return html;
}

function skillRowHtml(s, c, unlocked){
  var base = skillBase(s,c);
  var total = skillTotal(s,c);
  var bonusVal = num(c.skillBonus ? c.skillBonus[s.id] : 0, 0);
  if(!c.skillProgress) c.skillProgress = {};
  var prog = num(c.skillProgress[s.id],0);
  var costNeeded = bonusVal + 1;

  var hybridSel = "";
  if(s.attr==="hybrid"){
    var chosen = (c.skillHybrid && c.skillHybrid[s.id]) || s.hybridOptions[0];
    hybridSel = '<div><select class="skill-hybrid-select" data-bind="skillHybrid.'+s.id+'" aria-label="Atributo para '+esc(s.name)+'">'+
      s.hybridOptions.map(function(o){return '<option value="'+o+'"'+(o===chosen?' selected':'')+'>'+(ATTR_LABELS[o]?ATTR_LABELS[o].slice(0,3):o)+'</option>';}).join('')+
      '</select></div>';
  }

  var canSub = prog > 0;
  var canAdd = false;
  if(bonusVal > 0 && bonusVal < 8){
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
  
  html += '<div class="section-title" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
    '<span>🥋 Entrenamiento y Progresión</span>' +
    (canEdit ? '<button class="btn-compact" data-action="add-training">+ Nuevo Entrenamiento</button>' : '') +
  '</div>';

  html += '<div class="tr-rules-hint">' +
    '<span>💡 <b>Reglas:</b> 1 = -5 pts · 2-10 = +1 pt · 11-19 = +3 pts · Máx (10/20) = +5 pts <i>(en Lore el 1 no resta)</i>.</span>' +
  '</div>';

  if(c.trainings.length === 0){
    html += '<div class="tr-empty-state">' +
      '<p style="color:var(--ink-dim);font-size:0.85rem;margin-bottom:8px;">No hay entrenamientos activos.</p>' +
      (canEdit ? '<button class="btn-compact" data-action="add-training">+ Añadir Entrenamiento</button>' : '') +
    '</div>';
  } else {
    c.trainings.forEach(function(t){
      var catId = t.category || "skill";
      var sides = t.sides || (catId === "unlock" ? 20 : 10);
      var points = num(t.points, 0);
      var rolls = t.rolls || [];

      html += '<div class="tr-compact-card" data-id="' + t.id + '">' +
        '<div class="tr-header-row">' +
          '<select class="tr-cat-select" data-action="set-training-category" data-id="' + t.id + '" ' + (canEdit ? '' : 'disabled') + '>' +
            TRAINING_CATS.map(function(k){
              return '<option value="' + k.id + '"' + (k.id === catId ? ' selected' : '') + '>' + k.icon + ' ' + k.label + '</option>';
            }).join('') +
          '</select>' +
          '<input type="text" class="tr-name-input" data-bind="trainings.' + t.id + '.name" value="' + esc(t.name) + '" placeholder="Nombre (ej: Veneno de Seta)..." ' + (canEdit ? '' : 'readonly') + '>' +
          '<div class="tr-die-toggle" title="Tipo de dado de la tirada">' +
            '<button type="button" class="tr-die-btn' + (sides === 10 ? ' active' : '') + '" data-action="set-training-type" data-id="' + t.id + '" data-type="existing" ' + (canEdit ? '' : 'disabled') + '>d10</button>' +
            '<button type="button" class="tr-die-btn' + (sides === 20 ? ' active' : '') + '" data-action="set-training-type" data-id="' + t.id + '" data-type="new" ' + (canEdit ? '' : 'disabled') + '>d20</button>' +
          '</div>' +
          '<div class="tr-points-badge" title="Puntos acumulados de esfuerzo">' +
            '<span class="tr-points-val">' + (points > 0 ? '+' + points : points) + '</span>' +
            '<span class="tr-points-label">PTS</span>' +
          '</div>' +
          (canEdit ? '<button class="row-del tr-del-btn" data-action="del-training" data-id="' + t.id + '" title="Eliminar entrenamiento" aria-label="Eliminar">✕</button>' : '') +
        '</div>' +

        '<div class="tr-notes-row">' +
          '<textarea class="tr-notes-input" data-bind="trainings.' + t.id + '.notes" placeholder="Notas, descripción o efecto del entrenamiento..." rows="1" ' + (canEdit ? '' : 'readonly') + '>' + esc(t.notes || t.desc || '') + '</textarea>' +
        '</div>' +

        (canEdit ? (
          '<div class="tr-controls-row">' +
            '<button type="button" class="btn-compact tr-roll-btn" data-action="roll-training" data-id="' + t.id + '">' +
              '🎲 Tirar (d' + sides + ')' +
            '</button>' +
            '<div class="tr-manual-group">' +
              '<input type="number" min="1" max="' + sides + '" class="tr-manual-input" data-manual-for="' + t.id + '" placeholder="1-' + sides + '" title="Resultado de dado físico (1 a ' + sides + ')">' +
              '<button type="button" class="btn-compact tr-manual-btn" data-action="add-manual-training-roll" data-id="' + t.id + '" title="Añadir resultado de mesa física">+ Añadir</button>' +
            '</div>' +
          '</div>'
        ) : '') +

        '<div class="tr-history-row">' +
          (rolls.length === 0 ?
            '<span class="tr-history-empty">Sin tiradas aún</span>' :
            '<div class="tr-chips-shelf">' +
              rolls.slice().reverse().map(function(r){
                var chipClass = "normal";
                if(r.roll === 1 && catId !== "narrative") chipClass = "fumble";
                else if(r.roll === r.sides) chipClass = "crit";
                else if(r.roll >= 11 && r.roll <= 19) chipClass = "great";

                var sign = r.pts > 0 ? "+" : "";
                var timeStr = r.ts ? new Date(r.ts).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : "";
                return '<div class="tr-mini-chip ' + chipClass + '" title="Tirada: ' + r.roll + ' en d' + r.sides + (r.manual ? ' (Mesa Física)' : '') + (timeStr ? ' [' + timeStr + ']' : '') + '">' +
                  '<span class="chip-val">' + r.roll + '</span>' +
                  '<span class="chip-delta">' + sign + r.pts + '</span>' +
                  (canEdit ? '<button type="button" class="tr-chip-del" data-action="undo-training-roll" data-training-id="' + t.id + '" data-roll-id="' + r.id + '" title="Borrar tirada">✕</button>' : '') +
                '</div>';
              }).join('') +
            '</div>'
          ) +
        '</div>' +
      '</div>';
    });
  }

  html += '</div>';
  return html;
}

function tplCombate(c){
  var cb = c.combat||{};
  
  var activeBuffs = (c.activeBuffs||[]);
  var availableBuffs = (state.buffCatalog||[]).filter(function(b){ return isGM() || b.visible !== false; });
  
  var buffsHtml = '<div class="buffs-container">';
  availableBuffs.forEach(function(b){
    var isActive = activeBuffs.some(function(ab){ return ab.id === b.id; });
    var isDebuff = b.type === "debuff";
    buffsHtml += '<div class="buff-pill'+(isDebuff?' debuff':'')+(isActive?' active':'')+'" data-action="toggle-global-buff" data-id="'+b.id+'" role="button" tabindex="0">'+
      (isDebuff?'⚠️':'✨')+' '+esc(b.name)+(b.bonus?' ('+esc(b.bonus)+')':'')+
      (isActive?' ✓':'')+
    '</div>';
  });
  buffsHtml += '</div>';

  if(activeBuffs.length > 0){
    buffsHtml += '<div style="margin-top:10px;border-top:1px solid var(--line);padding-top:8px;">'+
      '<div style="font-size:.65rem;color:var(--ink-faint);text-transform:uppercase;margin-bottom:5px;">Buffos activos en este personaje (toca ✕ para eliminar):</div>';
    activeBuffs.forEach(function(ab){
      buffsHtml += '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 8px;background:var(--bg-elev);border:1px solid '+(ab.type==='debuff'?'var(--danger)':'var(--line)')+';border-radius:5px;margin-bottom:4px;">'+
        '<span style="font-size:.75rem;color:'+(ab.type==='debuff'?'#E88178':'var(--ink)')+';">'+(ab.type==='debuff'?'⚠️':'✨')+' '+esc(ab.name)+(ab.bonus?' ('+esc(ab.bonus)+')':'')+'</span>'+
        '<button class="row-del" data-action="remove-active-buff" data-id="'+ab.id+'" aria-label="Eliminar buff del personaje" style="min-width:28px;min-height:28px;width:28px;height:28px;">✕</button>'+
      '</div>';
    });
    buffsHtml += '</div>';
  }

  var activeSpells = (c.spells||[]).filter(function(sp){ return sp.active; });
  if(activeSpells.length > 0){
    buffsHtml += '<div style="margin-top:10px;border-top:1px dashed var(--line);padding-top:8px;">'+
      '<div style="font-size:.65rem;color:var(--teal-light);text-transform:uppercase;margin-bottom:5px;font-weight:700;">✨ Magias y Hechizos Activos (toca ✕ para retirar carga):</div>';
    activeSpells.forEach(function(asp){
      var stacks = asp.activeStacks || 1;
      var statNote = (asp.statAttr && asp.statMod) ? ' ('+asp.statMod+' a '+asp.statAttr+(stacks>1?' x'+stacks:'')+')' : (stacks>1?' (x'+stacks+')':'');
      buffsHtml += '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 8px;background:rgba(61,110,96,0.15);border:1px solid var(--teal-light);border-radius:5px;margin-bottom:4px;">'+
        '<span style="font-size:.75rem;color:var(--teal-light);">✨ '+esc(asp.name || "Hechizo")+(stacks>1?' <b>(Cargas: '+stacks+')</b>':'')+statNote+'</span>'+
        '<button class="row-del" data-action="toggle-spell-active" data-id="'+asp.id+'" aria-label="Quitar carga de magia" style="min-width:28px;min-height:28px;width:28px;height:28px;" title="Quitar 1 carga">✕</button>'+
      '</div>';
    });
    buffsHtml += '</div>';
  }

  var html = '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Buffs y Debuffs</span></div>'+buffsHtml;

  if(c.customBuffs && c.customBuffs.length){
    c.customBuffs.forEach(function(cbuff){
      html += '<div class="list-row text-row">'+
        '<input type="text" placeholder="Efecto de estado" data-bind="customBuffs.'+cbuff.id+'.name" value="'+esc(cbuff.name)+'">'+
        (canEditChar(c) ? '<button class="row-del" data-action="del-custom-buff" data-id="'+cbuff.id+'" aria-label="Eliminar buff">✕</button>' : '')+
      '</div>';
    });
  }
  if(canEditChar(c)){
    html += '<button class="btn-compact" style="margin-top:6px;" data-action="add-custom-buff">+ Añadir buff temporal</button>';
  }
  html += '</div>';

  var quickBtns = ["melee","distancia","esquivar","atletismo"].map(function(sid){
    var sdef = SKILL_DEFS.find(function(s){return s.id===sid;});
    return '<button class="combat-quick-btn" data-action="roll-skill" data-id="' + sid + '"><span class="cq-label">' + sdef.name + '</span><span class="cq-total">' + skillTotal(sdef, c) + '</span></button>';
  }).join('');

  html += '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Tiradas de Combate</span></div><div class="combat-quick-grid">'+quickBtns+'</div></div>';
  html += '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Estadísticas de Combate</span></div>'+
    '<div class="combat-grid">'+
      combatStat("Iniciativa","iniciativa",cb.iniciativa,true)+
      combatStat("Movilidad","movilidad",cb.movilidad,false)+
      combatStat("Defensa","defensa",cb.defensa,false)+
      combatStat("Def. Mágica","defensaMagica",cb.defensaMagica,false)+
      combatStat("Escudo / Vida Falsa","escudoActual",cb.escudoActual,false)+
    '</div>'+
  '</div>';

  html += '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Armas del Personaje</span></div>';
  var catalog = state.weaponsCatalog || [];
  (c.weapons||[]).forEach(function(w){
    var selectedCatItem = catalog.find(function(catItem){ return catItem.name === w.name || catItem.id === w.catalogId; });
    var isBlocked = selectedCatItem ? (selectedCatItem.visible === false) : false;
    var infoText = selectedCatItem ? ('Daño: ' + selectedCatItem.dano + ' | Alcance: ' + selectedCatItem.alcance) : 'Selecciona un arma del compendio';
    if(isBlocked){
      infoText += ' | <span style="color:#F87171;font-weight:700;">[🔒 Bloqueada por el Máster - No usable]</span>';
    }

    html += '<div class="list-row weapons-row'+(isBlocked?' weapon-row-blocked':'')+'" style="grid-template-columns:1fr 36px 36px;">'+
      '<select data-action="select-weapon-catalog" data-id="'+w.id+'" aria-label="Seleccionar arma">'+
        '<option value="">-- Seleccionar Arma del Compendio --</option>'+
        catalog.map(function(catItem){
          var isLockedOpt = catItem.visible === false;
          return '<option value="'+catItem.id+'" '+(selectedCatItem && selectedCatItem.id===catItem.id?'selected':'')+'>'+(isLockedOpt ? '🔒 ' : '')+esc(catItem.name)+' ('+esc(catItem.dano)+')'+(isLockedOpt ? ' [Bloqueada]' : '')+'</option>';
        }).join('')+
      '</select>'+
      (isBlocked && !isGM()
        ? '<button class="dice-btn disabled" disabled title="Esta arma está bloqueada por el Máster y no se puede usar en combate" aria-label="Arma bloqueada" style="opacity:0.38;cursor:not-allowed;filter:grayscale(1);">🔒</button>'
        : '<button class="dice-btn" data-action="roll-weapon" data-id="'+w.id+'" title="Tirar Daño" aria-label="Tirar daño">&#127922;</button>'
      )+
      (canEditChar(c) ? '<button class="row-del" data-action="del-weapon" data-id="'+w.id+'" aria-label="Eliminar arma">✕</button>' : '')+
    '</div>'+
    '<div style="font-size:0.7rem;color:var(--gold-light);margin-bottom:6px;padding-left:2px;">'+infoText+(selectedCatItem && selectedCatItem.critico?' | <b>Crítico:</b> '+esc(selectedCatItem.critico):'')+'</div>';
  });
  if(canEditChar(c)){
    html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-weapon">+ Añadir arma al equipo</button>';
  }
  html += '</div>';

  html += '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Armaduras</span></div>';
  (c.armors||[]).forEach(function(a){
    html += '<div class="list-row armor-row">'+
      '<input type="text" placeholder="Armadura" data-bind="armors.'+a.id+'.name" value="'+esc(a.name)+'" aria-label="Nombre de armadura">'+
      '<input type="text" placeholder="Absorción" data-bind="armors.'+a.id+'.absorcion" value="'+esc(a.absorcion)+'" aria-label="Absorción">'+
      '<input type="text" placeholder="Estorbo" data-bind="armors.'+a.id+'.estorbo" value="'+esc(a.estorbo)+'" aria-label="Estorbo">'+
      (canEditChar(c) ? '<button class="row-del" data-action="del-armor" data-id="'+a.id+'" aria-label="Eliminar armadura">✕</button>' : '')+
    '</div>';
  });
  if(canEditChar(c)){
    html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-armor">+ Añadir armadura</button>';
  }
  html += '</div>';

  html += rollLogHtml();
  return html;
}

function combatStat(label,bind,val,rollable){
  var c = activeChar();
  var eff = getEffectiveCombatStat(bind, c);
  var diff = eff - num(val, 0);
  var diffBadge = diff !== 0 ? '<span class="stat-eff-tag '+(diff>0?'pos':'neg')+'" title="Valor efectivo">'+(diff>0?'+'+diff:diff)+' (Total: '+eff+')</span>' : '';
  return '<div class="combat-stat"><label>'+esc(label)+diffBadge+'</label>'+
    '<input type="number" data-bind="combat.'+bind+'" value="'+num(val,0)+'" aria-label="'+esc(label)+'">'+
    (rollable?'<button class="mini-roll" data-action="roll-init" aria-label="Tirar iniciativa">&#127922;</button>':'')+
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
  var html = '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Grimorio y Artes Mágicas</span></div>'+
    '<div class="field" style="margin-bottom:12px;"><label>Tipo de Magia</label><input type="text" data-bind="magiaTipo" value="'+esc(c.magiaTipo)+'" placeholder="Ej: Piroclástica, Nigromancia, Sanación..."></div>';

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
          '<input type="text" class="spell-name-input" placeholder="Nombre del Hechizo" data-bind="spells.'+s.id+'.name" value="'+esc(s.name)+'">'+
          '<div class="spell-badges">'+
            activeBadge+
            statBadge+
            (isActive ?
              '<button class="spell-btn-act cast" data-action="cast-spell" data-id="'+s.id+'" title="Lanzar de nuevo y superponer">+ Superponer (-'+num(s.coste, 1)+' Maná)</button>'+
              '<button class="spell-btn-act cancel" data-action="toggle-spell-active" data-id="'+s.id+'" title="Quitar una carga o desactivar">✕ Quitar Carga ('+stacks+')</button>' :
              '<button class="spell-btn-act cast" data-action="cast-spell" data-id="'+s.id+'">⚡ Activar (-'+num(s.coste, 1)+' Maná)</button>'
            )+
            (canEditChar(c) ? '<button class="row-del" data-action="del-spell" data-id="'+s.id+'" aria-label="Eliminar hechizo" style="min-width:28px;min-height:28px;width:28px;height:28px;">✕</button>' : '')+
          '</div>'+
        '</div>'+
        '<div class="spell-grid">'+
          '<div class="creature-field"><label>Coste (Maná)</label><input type="number" min="0" data-bind="spells.'+s.id+'.coste" value="'+num(s.coste, 1)+'"></div>'+
          '<div class="creature-field"><label>Alcance / Rango</label><input type="text" placeholder="Melé, 30m, Personal..." data-bind="spells.'+s.id+'.rango" value="'+esc(s.rango)+'"></div>'+
        '</div>'+
        '<div class="spell-grid" style="margin-top:6px;">'+
          '<div class="creature-field"><label>Stat que Afecta (Opcional)</label>'+
            '<select style="font-size:.74rem;background:var(--bg-card);padding:3px 6px;border:1px solid var(--line);border-radius:var(--radius-sm);color:var(--ink);" data-bind="spells.'+s.id+'.statAttr">'+
              renderSpellStatOptions(s.statAttr)+
            '</select>'+
          '</div>'+
          '<div class="creature-field"><label>Modificador de Stat</label><input type="text" placeholder="+2, -1, +1d4..." data-bind="spells.'+s.id+'.statMod" value="'+esc(s.statMod)+'"></div>'+
        '</div>'+
        '<div class="creature-field" style="margin-top:6px;"><label>Efecto y Descripción Narrativa</label>'+
          '<textarea class="spell-notes" placeholder="Efectos mágicos, reglas específicas o descripción..." data-bind="spells.'+s.id+'.efecto">'+esc(s.efecto)+'</textarea>'+
        '</div>'+
      '</div>';
    });
  }

  if(canEditChar(c)){
    html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-spell">+ Añadir Hechizo al Grimorio</button>';
  }
  html += '</div>';

  html += '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Piedras Mágicas</span></div>';
  (c.stones||[]).forEach(function(s){
    html += '<div class="list-row stone-row">'+
      '<input type="text" placeholder="Color" data-bind="stones.'+s.id+'.color" value="'+esc(s.color)+'">'+
      '<input type="text" placeholder="Efecto" data-bind="stones.'+s.id+'.efecto" value="'+esc(s.efecto)+'">'+
      (canEditChar(c) ? '<button class="row-del" data-action="del-stone" data-id="'+s.id+'" aria-label="Eliminar piedra">✕</button>' : '')+
    '</div>';
  });
  if(canEditChar(c)){
    html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-stone">+ Añadir piedra</button>';
  }
  html += '</div>';
  return html;
}

function tplAlquimia(c){
  var html = '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Laboratorio Alquímico y Venenos</span></div>';
  (c.poisons||[]).forEach(function(p){
    html += '<div class="creature-card">'+
      '<div class="creature-card-header">'+
        '<input type="text" class="creature-name-input" data-bind="poisons.'+p.id+'.name" value="'+esc(p.name)+'" placeholder="Nombre del veneno">'+
        '<div style="display:flex;align-items:center;gap:6px;">'+
          '<span style="font-size:.65rem;color:var(--ink-faint);">Dosis:</span>'+
          '<input type="number" style="width:40px;text-align:center;background:var(--bg-card);padding:2px;" data-bind="poisons.'+p.id+'.dosis" value="'+num(p.dosis,0)+'">'+
          (canEditChar(c) ? '<button class="row-del" data-action="del-poison" data-id="'+p.id+'" aria-label="Eliminar veneno">✕</button>' : '')+
        '</div>'+
      '</div>'+
      '<div class="creature-grid" style="grid-template-columns:1fr 1fr;margin-top:6px;">'+
        '<div class="creature-field"><label style="color:#E74C3C;">Efecto en Enemigos</label><textarea class="creature-notes" data-bind="poisons.'+p.id+'.efectoEnemigo">'+esc(p.efectoEnemigo)+'</textarea></div>'+
        '<div class="creature-field"><label style="color:var(--teal-light);">Efecto Propio (Buff)</label><textarea class="creature-notes" data-bind="poisons.'+p.id+'.efectoCherk">'+esc(p.efectoCherk)+'</textarea></div>'+
      '</div>'+
      '<div style="margin-top:6px;">'+
        '<select style="font-size:.72rem;background:var(--bg-card);padding:2px 6px;" data-bind="poisons.'+p.id+'.estado">'+
          '<option value="descubierto" '+(p.estado==='descubierto'?'selected':'')+'>Descubierto</option>'+
          '<option value="investigando" '+(p.estado==='investigando'?'selected':'')+'>Investigando...</option>'+
        '</select>'+
      '</div>'+
      '</div>';
  });
  if(canEditChar(c)){
    html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-poison">+ Añadir veneno / fórmula</button>';
  }
  html += '</div>';
  return html;
}

function tplInventario(c){
  c.money = c.money || { oro: 0, plata: 0 };
  c.inventory = c.inventory || [];
  var html = '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Dinero</span></div>'+
    '<div class="money-row">'+
      '<div class="money-field"><label>Oro</label><input type="number" data-bind="money.oro" data-last-val="'+num(c.money.oro,0)+'" value="'+num(c.money.oro,0)+'"></div>'+
      '<div class="money-field"><label>Plata</label><input type="number" data-bind="money.plata" data-last-val="'+num(c.money.plata,0)+'" value="'+num(c.money.plata,0)+'"></div>'+
    '</div></div>';

  html += '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Equipo e Inventario</span></div>';
  (c.inventory||[]).forEach(function(it){
    html += '<div class="list-row inv-row">'+
      '<input type="text" placeholder="Objeto" data-bind="inventory.'+it.id+'.name" value="'+esc(it.name)+'">'+
      '<input type="number" placeholder="Cant." data-bind="inventory.'+it.id+'.qty" value="'+num(it.qty,1)+'">'+
      (canEditChar(c) ? '<button class="row-del" data-action="del-inventory" data-id="'+it.id+'" aria-label="Eliminar objeto">✕</button>' : '')+
    '</div>';
  });
  if(canEditChar(c)){
    html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-inventory">+ Añadir objeto</button>';
  }
  html += '</div>';
  return html;
}

function tplInvocaciones(c){
  c.summons = c.summons || [];
  var html = '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Invocaciones y Familiares</span></div>';
  (c.summons||[]).forEach(function(s){
    html += '<div class="creature-card">' +
      '<div class="creature-card-header">' +
        '<input type="text" class="creature-name-input" placeholder="Nombre" data-bind="summons.' + s.id + '.name" value="' + esc(s.name) + '">' +
        (canEditChar(c) ? '<button class="row-del" data-action="del-summon" data-id="' + s.id + '" aria-label="Eliminar invocación">✕</button>' : '') +
      '</div>' +
      '<div class="creature-grid">' +
        creatureField("Vida", "summons." + s.id + ".vida", s.vida) +
        creatureField("Defensa", "summons." + s.id + ".defensa", s.defensa) +
        creatureField("Absorción", "summons." + s.id + ".absorcion", s.absorcion) +
        creatureField("Daño", "summons." + s.id + ".dano", s.dano) +
        creatureField("Movilidad", "summons." + s.id + ".movilidad", s.movilidad) +
        creatureField("Inteligencia", "summons." + s.id + ".inteligencia", s.inteligencia) +
      '</div>' +
      '<div class="creature-field" style="margin-top:6px;"><label>Habilidades, Tiradas y Rasgos</label><textarea class="creature-notes" placeholder="Ej: Melé 8+1d10, Rasgo..." data-bind="summons.' + s.id + '.habilidades">' + esc(s.habilidades||s.notas) + '</textarea></div>' +
    '</div>';
  });
  if(canEditChar(c)){
    html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-summon">+ Añadir invocación</button>';
  }
  html += '</div>';
  return html;
}

function tplExtra(c){
  c.passivesNeg = c.passivesNeg || [];
  c.passivesPos = c.passivesPos || [];
  c.goddessTable = c.goddessTable || [];
  var html = '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Pasivas Negativas</span></div>';
  (c.passivesNeg||[]).forEach(function(p){
    html += '<div class="list-row text-row"><input type="text" data-bind="passivesNeg.'+p.id+'.text" value="'+esc(p.text)+'">'+(canEditChar(c)?'<button class="row-del" data-action="del-passiveNeg" data-id="'+p.id+'" aria-label="Eliminar pasiva">✕</button>':'')+'</div>';
  });
  if(canEditChar(c)){
    html += '<button class="btn-compact" style="margin-top:6px;" data-action="add-passiveNeg">+ Añadir pasiva negativa</button>';
  }
  html += '</div>';

  html += '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Pasivas Positivas</span></div>';
  (c.passivesPos||[]).forEach(function(p){
    html += '<div class="list-row text-row"><input type="text" data-bind="passivesPos.'+p.id+'.text" value="'+esc(p.text)+'">'+(canEditChar(c)?'<button class="row-del" data-action="del-passivePos" data-id="'+p.id+'" aria-label="Eliminar pasiva">✕</button>':'')+'</div>';
  });
  if(canEditChar(c)){
    html += '<button class="btn-compact" style="margin-top:6px;" data-action="add-passivePos">+ Añadir pasiva positiva</button>';
  }
  html += '</div>';

  html += '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Tabla de Diosas</span></div>';
  (c.goddessTable||[]).forEach(function(g){
    html += '<div class="list-row god-row">'+
      '<input type="text" placeholder="Nombre" data-bind="goddessTable.'+g.id+'.nombre" value="'+esc(g.nombre)+'">'+
      '<input type="text" placeholder="Gustos" data-bind="goddessTable.'+g.id+'.gustos" value="'+esc(g.gustos)+'">'+
      '<input type="text" placeholder="Disgustos" data-bind="goddessTable.'+g.id+'.disgustos" value="'+esc(g.disgustos)+'">'+
      (canEditChar(c)?'<button class="row-del" data-action="del-goddess" data-id="'+g.id+'" aria-label="Eliminar diosa">✕</button>':'')+
    '</div>';
  });
  if(canEditChar(c)){
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
