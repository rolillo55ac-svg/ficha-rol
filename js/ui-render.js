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
  var crestStyle = safeUrl(c.portrait) ? ' style="background-image:url(\''+esc(safeUrl(c.portrait))+'\')"' : '';
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
    roleBadgeHtml = (typeof isAdmin === 'function' && isAdmin()) ? '<span class="role-badge admin role-badge-vista" data-action="toggle-vista-jugador" role="button" tabindex="0" title="Tocar para ver la web como un jugador">' + icono("admin", {tam:"s"}) + ' ADMIN</span>' : '<span class="role-badge gm">' + icono("master", {tam:"s"}) + ' GM</span>';
    if(!isNPC){
      if(c.ownerEmail){
        roleBadgeHtml += '<span class="char-owner-topbar-tag" title="Asignado a ' + esc(c.ownerEmail) + '">' + icono("jugador", {tam:"s"}) + ' ' + esc(c.ownerEmail) + '</span>';
      } else {
        roleBadgeHtml += '<span class="char-owner-topbar-tag unassigned" title="Personaje sin jugador asignado">○ Libre</span>';
      }
    }
  } else if(typeof vistaComoJugador === 'function' && vistaComoJugador()){
    roleBadgeHtml = '<span class="role-badge vista-jugador role-badge-vista" data-action="toggle-vista-jugador" role="button" tabindex="0" title="Estás viendo la web como un jugador. Toca para volver a admin">' + icono("jugador", {tam:"s"}) + ' VISTA JUGADOR</span>';
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
          '<div class="char-sub">'+(isNPC?'NPC · ':'Nv. '+esc(c.nivel||"1")+' · '+(c.titulo?esc(c.titulo)+' · ':''))+esc(c.trabajo||"Aventurero")+'</div>'+
        '</span>'+
      '</button>'+
      '<div class="topbar-actions">'+
        (typeof gameClockPillHtml === "function" ? gameClockPillHtml() : '')+
        '<span id="syncBadge" class="sync-status">'+(currentUser?'● Nube':'○ Local')+'</span>'+
        roleBadgeHtml+
        '<button class="' + feedbackBtnClass + '" data-action="open-feedback-modal" title="' + feedbackTitle + '" aria-label="Reportes">' + icono("buzon", {tam:"m", focus: unreadTickets > 0}) + feedbackBadgeHtml + '</button>'+
        '<button class="icon-btn" data-action="open-data-modal" title="Ajustes y Sesión" aria-label="Ajustes">' + icono("ajustes", {tam:"m"}) + '</button>'+
      '</div>'+
    '</div>'+
    '<div class="gauges">'+
      gaugeWrapHtml(canEdit, 'hp', 'Vida',
        '<div class="gauge-label"><span>Vida '+hpStatusBadge+hpDebuffBadge+'</span><span class="'+hpNumsClass+'">'+curPv+' / '+maxHp+'</span></div>'+
        '<div class="gauge"><div class="gauge-fill hp" style="width:'+hpPct+'%;'+(curPv<=0?'background:#8C252F;':'')+'"></div></div>')+
      gaugeWrapHtml(canEdit, 'shield', 'Escudo',
        '<div class="gauge-label"><span style="color:var(--shield-light);" title="El Escudo y la Vida Falsa son equivalentes">' + icono("escudo", {tam:"s"}) + ' Escudo</span><span class="gauge-nums">'+num(c.combat.escudoActual,0)+'</span></div>'+
        '<div class="gauge"><div class="gauge-fill shield" style="width:'+clamp(num(c.combat.escudoActual,0)*10,0,100)+'%;"></div></div>')+
      gaugeWrapHtml(canEdit, 'mana', 'Maná',
        '<div class="gauge-label"><span>Maná</span><span class="gauge-nums">'+num(c.combat.manaActual,0)+' / '+maxMana+'</span></div>'+
        '<div class="gauge"><div class="gauge-fill mana" style="width:'+manaPct+'%;"></div></div>')+
      (canEdit ? gaugeTrayHtml(gaugeTrayOpen, gaugeTrayOpen==='hp' ? curPv+' / '+maxHp : (gaugeTrayOpen==='shield' ? num(c.combat.escudoActual,0) : num(c.combat.manaActual,0)+' / '+maxMana)) : '')+
    '</div>';
  if(!canEdit) gaugeTrayClose(false);
  if(typeof levelUpCheckSeen === 'function') levelUpCheckSeen(c);
}

// Tira de botones que se despliega al tocar una barra (solo una abierta; se cierra sola a los 5 s)
var gaugeTrayOpen = null;
var gaugeTrayTimer = null;
var GAUGE_TRAY_STEPS = {
  hp: {action:"hp-mod", name:"vida", steps:[-5,-1,1,5]},
  shield: {action:"shield-mod", name:"escudo", steps:[-3,-1,1,3]},
  mana: {action:"mana-mod", name:"maná", steps:[-5,-1,1,5]}
};

function gaugeWrapHtml(canEdit, key, label, inner){
  if(!canEdit) return '<div class="gauge-wrap">'+inner+'</div>';
  var open = gaugeTrayOpen === key;
  return '<div class="gauge-wrap"><button type="button" class="gauge-toggle" data-action="gauge-toggle" data-gauge="'+key+'" aria-expanded="'+open+'" aria-label="'+label+': ajustar">'+inner+'</button></div>';
}

function gaugeTrayHtml(key, current){
  var cfg = GAUGE_TRAY_STEPS[key];
  if(!cfg) return '';
  var btnHtml = function(d){
    return '<button type="button" class="gauge-tray-btn" data-action="'+cfg.action+'" data-delta="'+d+'" aria-label="'+(d<0?'Restar ':'Sumar ')+Math.abs(d)+' '+cfg.name+'">'+(d>0?'+':'')+d+'</button>';
  };
  return '<div class="gauge-tray gauge-tray-'+key+'" role="group" aria-label="Ajustar '+cfg.name+'">'+
    btnHtml(cfg.steps[0])+btnHtml(cfg.steps[1])+
    '<span class="gauge-tray-value">'+current+'</span>'+
    btnHtml(cfg.steps[2])+btnHtml(cfg.steps[3])+
  '</div>';
}

function gaugeTrayArm(){
  if(gaugeTrayTimer) clearTimeout(gaugeTrayTimer);
  gaugeTrayTimer = setTimeout(function(){ gaugeTrayClose(true); }, 5000);
}

function gaugeTrayClose(rerender){
  if(gaugeTrayTimer){ clearTimeout(gaugeTrayTimer); gaugeTrayTimer = null; }
  if(gaugeTrayOpen === null) return;
  gaugeTrayOpen = null;
  if(rerender) renderTopbar();
}

var PLAYER_TABS = [
  {id:"ficha",label:"Ficha"}, {id:"tiradas",label:"Tiradas"}, {id:"mision",label:"Misión"}, {id:"casa",label:"Casa"}, {id:"habilidades",label:"Habilidades"}, {id:"entrenamiento",label:"Entrenar"}, {id:"combate",label:"Combate"}, {id:"estados",label:"Estados"},
  {id:"inventario",label:"Inventario"}, {id:"magia",label:"Magia"}, {id:"alquimia",label:"Alquimia"},
  {id:"lapidario",label:"Piedras"},
  {id:"invocaciones",label:"Invocaciones"}, {id:"bestiario",label:"Bestiario"}, {id:"extra",label:"Extra"}, {id:"mundo",label:"Mundo"}
];

var GM_TABS = [
  {id:"ficha",label:"Ficha"}, {id:"tiradas",label:"Tiradas"}, {id:"mision",label:"Misión"}, {id:"casa",label:"Casa"}, {id:"habilidades",label:"Habilidades"}, {id:"entrenamiento",label:"Entrenar"}, {id:"combate",label:"Combate"}, {id:"estados",label:"Estados"},
  {id:"inventario",label:"Inventario"}, {id:"magia",label:"Magia"}, {id:"alquimia",label:"Alquimia"},
  {id:"lapidario",label:"Piedras"},
  {id:"invocaciones",label:"Invocaciones"}, {id:"bestiario",label:"Bestiario"},
  {id:"extra",label:"Extra"}, {id:"mundo",label:"Mundo"}
];

var TAB_ICONOS = {ficha:"pergamino", tiradas:"d20", mision:"brujula", casa:"casa", habilidades:"cerebro", entrenamiento:"espantapajaros", combate:"puno", estados:"destellos", inventario:"mochila", comercio:"balanza", magia:"bola-cristal", alquimia:"pocion", lapidario:"piedras", invocaciones:"dragon", bestiario:"huellas", extra:"estrella", mundo:"mapa"};

function renderTabbar(){
  var tabs = isGM() ? GM_TABS : PLAYER_TABS;
  if(typeof CONFIG_ENABLE_HOUSE !== "undefined" && !CONFIG_ENABLE_HOUSE){
    tabs = tabs.filter(function(t){ return t.id !== "casa"; });
  }
  document.getElementById("tabbar").innerHTML = tabs.map(function(t){
    var isActive = state.activeTab===t.id;
    // Contador de veredictos de talla pendientes para el máster
    var count = (t.id === "lapidario" && isGM() && typeof getPendingLapidaryVerdicts === "function") ? getPendingLapidaryVerdicts().length : 0;
    return '<button class="tab-btn'+(isActive?' active':'')+'" data-action="switch-tab" data-tab="'+t.id+'" role="tab" aria-selected="'+(isActive)+'" aria-label="'+t.label+(count ? ' ('+count+' pendientes)' : '')+'">'+(TAB_ICONOS[t.id] ? '<span class="tab-ico-wrap"><img class="tab-ico-img" src="images/iconos/barra/'+TAB_ICONOS[t.id]+'.webp" alt="" width="28" height="28" decoding="async"><img class="tab-ico-focus" src="images/iconos/barra/'+TAB_ICONOS[t.id]+'-focus.webp" alt="" width="28" height="28" decoding="async"></span>' : '')+'<span>'+t.label+'</span>'+(count ? '<span class="tab-count">'+count+'</span>' : '')+'</button>';
  }).join('');
}

function renderTab(){
  if(state.activeTab==="casa"){
    if(typeof renderHouseView === "function") renderHouseView();
    return;
  }
  if(typeof houseState !== "undefined" && houseState && houseState.active){
    if(typeof renderHouseView === "function") renderHouseView();
    return;
  }
  var main = document.getElementById("main");
  var c = activeChar();
  
  if(state.activeTab==="ficha") main.innerHTML = tplFicha(c);
  else if(state.activeTab==="tiradas") renderTiradasPage();
  else if(state.activeTab==="mision") main.innerHTML = tplMision(c, state);
  else if(state.activeTab==="habilidades") main.innerHTML = tplHabilidades(c);
  else if(state.activeTab==="entrenamiento") main.innerHTML = tplEntrenamiento(c);
  else if(state.activeTab==="combate") main.innerHTML = tplCombate(c);
  else if(state.activeTab==="estados") main.innerHTML = tplEstados(c);
  else if(state.activeTab==="inventario") main.innerHTML = tplInventario(c);
  else if(state.activeTab==="magia") main.innerHTML = tplMagia(c);
  else if(state.activeTab==="alquimia") main.innerHTML = tplAlquimia(c);
  else if(state.activeTab==="lapidario") main.innerHTML = tplLapidario(c);
  else if(state.activeTab==="invocaciones") main.innerHTML = tplInvocaciones(c);
  else if(state.activeTab==="bestiario") main.innerHTML = tplBestiario(state);
  else if(state.activeTab==="extra") main.innerHTML = tplExtra(c);
  else if(state.activeTab==="mundo") main.innerHTML = tplMundo(state);
  else if(state.activeTab==="casa") {
    if(typeof renderHouseView === "function") renderHouseView();
  }

  if(typeof autoResizeAllTextareas === "function"){
    autoResizeAllTextareas();
  }
}

function tplLapidario(c){
  var canEdit = canEditChar(c);
  var html = '';
  if(!canEdit && currentUser){
    html += '<div class="spectator-banner">'+
      '<span>'+iconoUI("ver")+' Modo Espectador: Solo lectura. No puedes tallar ni modificar las piedras en esta ficha.</span>'+
    '</div>';
  }
  if(typeof renderLapidaryWorkshop === 'function'){
    html += renderLapidaryWorkshop(c, canEdit);
  } else {
    html += '<div style="padding:32px;text-align:center;color:var(--ink-faint);">Taller de Lapidario cargando...</div>';
  }
  return html;
}

function tplFicha(c){
  var pStyle = safeUrl(c.portrait) ? ' style="background-image:url(\''+esc(safeUrl(c.portrait))+'\')"' : '';
  var attrCards = ATTRS.map(function(a){
    if(c.isNPC){
      return '<div class="attr-card"><label>'+ATTR_LABELS[a]+'</label>'+
        '<div style="display:flex;align-items:center;justify-content:center;gap:4px;">'+
          '<button class="skill-bonus-ctrl" data-action="npc-attr-mod" data-attr="'+a+'" data-delta="-1" style="width:22px;height:22px;min-width:22px;min-height:22px;font-size:.6rem;">-</button>'+
          '<span style="font-family:var(--font-mono);font-size:1.1rem;font-weight:700;color:var(--gold-light);min-width:30px;text-align:center;">'+num(c.attrs[a],0)+'</span>'+
          '<button class="skill-bonus-ctrl" data-action="npc-attr-mod" data-attr="'+a+'" data-delta="1" style="width:22px;height:22px;min-width:22px;min-height:22px;font-size:.6rem;">+</button>'+
          '<button class="dice-btn" data-action="roll-attr" data-attr="'+a+'" style="width:22px;height:22px;font-size:0.75rem;margin-left:2px;" title="Tirar prueba de '+ATTR_LABELS[a]+' (1d10)">'+icono("d10",{tam:"s"})+'</button>'+
        '</div>'+
      '</div>';
    }
    return '<div class="attr-card rollable" data-action="roll-attr" data-attr="'+a+'" role="button" tabindex="0" title="Tirar prueba de '+ATTR_LABELS[a]+' (1d10)"><label>'+ATTR_LABELS[a]+'</label><div class="attr-val-box">'+num(c.attrs[a],0)+'</div><span class="attr-roll-hint">🎲 Tirar</span></div>';
  }).join('');

  var levelControl = '';
  if(isGM()){
    levelControl = '<button type="button" class="btn-compact" data-action="revoke-level" title="Bajar 1 nivel (GM)" style="padding:4px 8px;font-weight:700;">-</button>' +
                   '<button type="button" class="btn-solid-gold" data-action="grant-level" title="Subir 1 nivel (GM)">+ Nivel</button>';
  }

  var canEdit = canEditChar(c);
  var ro = !canEdit;

  // Puntos de habilidad sin gastar, siempre a la vista junto al nivel
  var levelPointsPill = '';
  var ptsLibres = num(c.skillPoints, 0);
  if(!c.isNPC && ptsLibres > 0){
    levelPointsPill = '<button type="button" class="lvl-points-pill" data-action="switch-tab" data-tab="habilidades" title="Ir a Habilidades">✨ '+ptsLibres+' '+(ptsLibres === 1 ? 'punto' : 'puntos')+' por repartir'+((c.skillPointsUnlocked || isGM()) ? '' : ' <small>(el máster abrirá el reparto)</small>')+'</button>';
  }

  // Aviso de gemas talladas que esperan el veredicto del máster
  var pendingStones = (c.stones || []).filter(function(st){ return st.pendienteMaster; });
  var stoneNotice = pendingStones.length ? '<div class="lapidary-verdict-status wait" style="margin-bottom:12px;"><span class="ic">'+icono("actividad",{tam:"s"})+'</span><span><b>' + (pendingStones.length === 1 ? 'Una gema tallada espera' : pendingStones.length + ' gemas talladas esperan') + ' al máster</b>: decidirá si aguanta' + (pendingStones.length === 1 ? '' : 'n') + '. Lo verás en la pestaña Piedras.</span></div>' : '';

  var sound = c.charSound;
  if(!sound && (c.id === "char_ink" || (c.name && c.name.toLowerCase().includes("ink")))){
    sound = { name: "Ruido murciélago", type: "bat", icon: "🦇", url: "sounds/ruido_murcielago.wav" };
    c.charSound = sound;
  }
  var hasSound = !!(sound && sound.name && sound.name.trim());
  var soundHtml = '';

  if(hasSound){
    var sIcon = esc(sound.icon || "🦇");
    var sName = sound.name || "Sonido";
    soundHtml = '<div class="char-sound-widget" title="Efecto de sonido característico">'+
      '<button class="char-sound-play-btn" data-action="play-char-sound" data-id="' + esc(c.id) + '" aria-label="Reproducir ' + esc(sName) + '" title="Reproducir: ' + esc(sName) + '">'+
        '<span class="char-sound-icon">' + sIcon + '</span>'+
        '<span class="char-sound-name">' + esc(sName) + '</span>'+
        '<span class="char-sound-waves"><span></span><span></span><span></span></span>'+
      '</button>'+
      (canEdit ? '<button class="char-sound-cfg-btn" data-action="edit-char-sound" data-id="' + esc(c.id) + '" title="Configurar sonido del personaje">⚙️</button>' : '')+
    '</div>';
  } else if(canEdit){
    soundHtml = '<div class="char-sound-widget empty">'+
      '<button class="char-sound-add-btn" data-action="edit-char-sound" data-id="' + esc(c.id) + '" title="Asignar un sonido característico">'+
        '<span class="char-sound-icon">🎵</span>'+
        '<span class="char-sound-name">+ Añadir sonido</span>'+
      '</button>'+
    '</div>';
  }

  return '<div class="section'+(c.isNPC?' gm-section':'')+'">'+
    '<div class="section-title">'+
      '<span>'+(c.isNPC?'Ficha de NPC (Solo GM)':(canEdit ? 'Datos del Personaje' : 'Datos del Personaje (Solo Lectura)'))+'</span>'+
      soundHtml+
    '</div>'+
    stoneNotice+
    (!canEdit && currentUser ?
      '<div class="tr-spectator-banner" style="margin-bottom:12px;">'+
        '<span style="font-size:1.15rem;flex:none;">'+iconoUI("ver")+'</span>'+
        '<div><strong>Modo Espectador:</strong> Consultando la ficha de <b>'+esc(c.name)+'</b> en modo solo lectura. No puedes modificar sus datos ni su equipo.</div>'+
      '</div>' : '')+
    '<div class="ficha-layout">'+
      '<div class="portrait-box">'+
        '<div class="portrait-img"'+pStyle+'>'+(c.portrait?'':icono("jugador"))+'</div>'+
        (canEdit ?
          '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;">'+
            '<button class="btn-compact" data-action="upload-portrait" title="Subir foto desde archivo">Foto</button>'+
            '<button class="btn-compact" data-action="url-portrait" title="Pegar enlace de GitHub o web">URL</button>'+
            (c.portrait ? '<button class="btn-compact" data-action="remove-portrait" title="Quitar foto">'+iconoUI("cerrar")+'</button>' : '')+
          '</div>' : '')+
      '</div>'+
      '<div>'+
        '<div class="field-grid">'+
          field("Nombre", "name", c.name, "text", ro)+
          (isGM() && !c.isNPC ? '<div class="field"><label>👤 Jugador Asignado (Email)</label><input type="email" data-bind="ownerEmail" value="'+esc(c.ownerEmail||"")+'" placeholder="ej: jugador@gmail.com"></div>' : '')+
          '<div class="field"><label>'+(c.isNPC?'Nivel / CR':'Nivel')+'</label><div style="display:flex;gap:4px;"><input type="text" data-bind="nivel" value="'+esc(c.nivel||"1")+'" '+(isGM() ? '' : 'readonly')+'>'+levelControl+'</div>'+levelPointsPill+'</div>'+
          '<div class="field"><label>Título</label><input type="text" data-bind="titulo" value="'+esc(c.titulo||"")+'" placeholder="ej: Vástago" '+(isGM() ? '' : 'readonly')+'></div>'+
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
  '</div>'+
  (typeof tplHistoria === "function" ? tplHistoria(c) : '');
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
        '<button class="btn-solid-gold" data-action="gm-sub-skill-point" title="Quitar 1 punto de habilidad al personaje">-1 Pto (GM)</button>'+
        '<button class="btn-solid-gold" data-action="gm-add-skill-point" title="Dar 1 punto de habilidad al personaje">+1 Pto (GM)</button>'+
        '<button class="btn-solid-gold" data-action="toggle-skill-lock">'+(unlocked?'🔒 Bloquear Asignación (GM)':'🔓 Permitir Asignación (GM)')+'</button>'+
      '</div>'+
    '</div>';
  } else if(c.isNPC && isGM()){
    banner = '<div class="skill-pool-banner">'+
      '<span>NPC - Puntos disponibles: <b>'+num(c.skillPoints,0)+'</b>. Habilidades editables.</span>'+
      '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">'+
        '<button class="btn-solid-gold" data-action="gm-sub-skill-point" title="Quitar 1 punto de habilidad">-1 Pto (GM)</button>'+
        '<button class="btn-solid-gold" data-action="gm-add-skill-point" title="Dar 1 punto de habilidad">+1 Pto (GM)</button>'+
      '</div>'+
    '</div>';
  }

  var viewMode = (state && state.skillsView) || (function(){
    try { return localStorage.getItem("krysalis_skills_view"); } catch(e){ return null; }
  })() || "attr";

  var switcherHtml = '<div class="skills-view-switcher" role="group" aria-label="Vista de habilidades">'+
    '<button type="button" class="skills-view-btn '+(viewMode==="attr"?"active":"")+'" data-action="set-skills-view" data-val="attr" title="Vista agrupada por atributos">'+
      '<span class="view-btn-icon">❖</span> Por Atributo'+
    '</button>'+
    '<button type="button" class="skills-view-btn '+(viewMode==="excel"?"active":"")+'" data-action="set-skills-view" data-val="excel" title="Vista continua completa de la ficha original">'+
      '<span class="view-btn-icon">☰</span> Ficha Original'+
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
        if(canEdit && (bonusVal > 0 || isGM()) && bonusVal < 8){
          if(c.isNPC){
            canAdd = num(c.skillPoints,0) >= 1;
          } else {
            canAdd = (unlocked || isGM()) && num(c.skillPoints,0) >= 1;
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
    // === VISTA FICHA ORIGINAL (3 COLUMNAS / RESPONSIVA) ===
    html += '<div class="skills-original-container">';

    // 1. Cabecera horizontal de atributos principales adaptativa a móviles
    html += '<div class="skills-orig-attr-bar">';
    ATTRS.forEach(function(a){
      var effVal = getEffectiveAttr(a, c);
      html += '<div class="skills-orig-attr-card rollable" data-action="roll-attr" data-attr="'+a+'" role="button" tabindex="0" title="Lanzar tirada de '+ATTR_LABELS[a]+' (1d10)">'+
        '<label>'+ATTR_LABELS[a]+'</label>'+
        '<div class="skills-orig-attr-val">'+effVal+'</div>'+
        '<span class="attr-roll-hint">Tirar 🎲</span>'+
      '</div>';
    });
    html += '</div>';

    // 2. Grilla de 3 columnas (en escritorio) y 1 columna fluida (en móviles)
    var col1Skills = SKILL_DEFS.slice(0, 10);
    var col2Skills = SKILL_DEFS.slice(10, 20);
    var col3Skills = SKILL_DEFS.slice(20, 30);

    html += '<div class="skills-original-grid">';

    // Columna 1
    html += '<div class="skills-orig-col">'+
      '<div class="skills-orig-col-header"><span>Columna I (1 - 10)</span><span>Habilidades</span></div>';
    col1Skills.forEach(function(s){
      html += skillRowExcelHtml(s, c, unlocked, canEdit);
    });
    html += '</div>';

    // Columna 2
    html += '<div class="skills-orig-col">'+
      '<div class="skills-orig-col-header"><span>Columna II (11 - 20)</span><span>Habilidades</span></div>';
    col2Skills.forEach(function(s){
      html += skillRowExcelHtml(s, c, unlocked, canEdit);
    });
    html += '</div>';

    // Columna 3
    html += '<div class="skills-orig-col">'+
      '<div class="skills-orig-col-header"><span>Columna III (21 - 30)</span><span>Habilidades'+(c.customSkills&&c.customSkills.length?' + Pers.':'')+'</span></div>';
    col3Skills.forEach(function(s){
      html += skillRowExcelHtml(s, c, unlocked, canEdit);
    });
    if(c.customSkills && c.customSkills.length){
      c.customSkills.forEach(function(cs){
        html += customSkillRowExcelHtml(cs, c, unlocked, canEdit);
      });
    }
    html += '</div>';

    html += '</div>'; // Cierre skills-original-grid
    html += '</div>'; // Cierre skills-original-container

    if(isGM()){
      html += '<button class="btn-compact" style="width:100%;margin-top:10px;" data-action="add-custom-skill">+ Añadir habilidad personalizada</button>';
    }
  }

  html += '</div>';
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
  if(canEdit && (bonusVal > 0 || isGM()) && bonusVal < 8){
    if(c.isNPC){
      canAdd = num(c.skillPoints,0) >= 1;
    } else {
      canAdd = (unlocked || isGM()) && num(c.skillPoints,0) >= 1;
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

function skillRowExcelHtml(s, c, unlocked, canEdit){
  var base = skillBase(s,c);
  var total = skillTotal(s,c);
  var bonusVal = num(c.skillBonus ? c.skillBonus[s.id] : 0, 0);
  if(!c.skillProgress) c.skillProgress = {};
  var prog = num(c.skillProgress[s.id],0);
  var costNeeded = bonusVal + 1;

  var attrCol = "";
  if(s.attr==="hybrid"){
    var chosen = (c.skillHybrid && c.skillHybrid[s.id]) || s.hybridOptions[0];
    attrCol = '<select class="skill-excel-hybrid-select" data-bind="skillHybrid.'+s.id+'" aria-label="Atributo para '+esc(s.name)+'" '+(canEdit?'':'disabled')+'>'+
      s.hybridOptions.map(function(o){return '<option value="'+o+'"'+(o===chosen?' selected':'')+'>'+(ATTR_LABELS[o]?ATTR_LABELS[o].slice(0,3).toUpperCase():o)+'</option>';}).join('')+
      '</select>';
  } else {
    var shortA = ATTR_LABELS[s.attr] ? ATTR_LABELS[s.attr].slice(0,3).toUpperCase() : s.attr.slice(0,3).toUpperCase();
    attrCol = '<span class="skill-attr-tag attr-'+s.attr+'" title="'+(ATTR_LABELS[s.attr]||s.attr)+'">'+shortA+'</span>';
  }

  var canSub = canEdit && prog > 0;
  var canAdd = false;
  if(canEdit && (bonusVal > 0 || isGM()) && bonusVal < 8){
    if(c.isNPC){
      canAdd = num(c.skillPoints,0) >= 1;
    } else {
      canAdd = (unlocked || isGM()) && num(c.skillPoints,0) >= 1;
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

  return '<div class="skills-orig-row skills-excel-row" data-skill-id="'+s.id+'">'+
    '<div class="skills-orig-info">'+
      '<span class="skills-orig-name" title="'+esc(s.name)+'">'+esc(s.name)+'</span>'+
      '<div class="skills-orig-attr-badge">'+attrCol+'</div>'+
    '</div>'+
    '<div class="skills-orig-data">'+
      '<div class="skills-orig-stat-item"><span class="skills-orig-stat-lbl">Base</span><span class="skills-orig-base" title="Base: '+base+'">'+base+'</span></div>'+
      '<div class="skills-orig-stat-item bonus-item"><span class="skills-orig-stat-lbl">Bono</span>'+
        '<span class="skill-bonus-ctrl">'+
          (isGM() ? gmControls : (
            '<button data-action="skill-sub" data-id="'+s.id+'" '+(canSub?'':'disabled')+' aria-label="Restar progreso a '+esc(s.name)+'">-</button>'+
            '<span>'+bonusVal+' ('+prog+'/'+costNeeded+')</span>'+
            '<button data-action="skill-add" data-id="'+s.id+'" '+(canAdd?'':'disabled')+' aria-label="Añadir progreso a '+esc(s.name)+'">+</button>'
          ))+
        '</span>'+
      '</div>'+
      '<div class="skills-orig-stat-item total-item"><span class="skills-orig-stat-lbl">Total</span><span class="skills-orig-total" title="Total: '+total+'">'+total+'</span></div>'+
      '<button class="dice-btn" data-action="roll-skill" data-id="'+s.id+'" aria-label="Tirar '+esc(s.name)+'">&#127922;</button>'+
    '</div>'+
  '</div>';
}

function customSkillRowExcelHtml(cs, c, unlocked, canEdit){
  var bonusVal = num(cs.bonus, 0);
  if(!c.skillProgress) c.skillProgress = {};
  var prog = num(c.skillProgress[cs.id], 0);
  var costNeeded = bonusVal + 1;

  var canSub = canEdit && prog > 0;
  var canAdd = false;
  if(canEdit && (bonusVal > 0 || isGM()) && bonusVal < 8){
    if(c.isNPC){
      canAdd = num(c.skillPoints,0) >= 1;
    } else {
      canAdd = (unlocked || isGM()) && num(c.skillPoints,0) >= 1;
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
  var attrCol = '<span class="skill-attr-tag attr-'+(cs.attr||'custom')+'" title="'+(ATTR_LABELS[cs.attr]||cs.attr)+'">'+shortA+'</span>';
  var baseVal = (c && c.attrs) ? getEffectiveAttr(cs.attr, c) : 0;

  return '<div class="skills-orig-row skills-excel-row" data-skill-id="'+cs.id+'">'+
    '<div class="skills-orig-info">'+
      '<span class="skills-orig-name" title="'+esc(cs.name)+'">'+esc(cs.name)+'<small class="custom-skill-badge">Pers.</small></span>'+
      '<div class="skills-orig-attr-badge">'+attrCol+'</div>'+
    '</div>'+
    '<div class="skills-orig-data">'+
      '<div class="skills-orig-stat-item"><span class="skills-orig-stat-lbl">Base</span><span class="skills-orig-base" title="Base: '+baseVal+'">'+baseVal+'</span></div>'+
      '<div class="skills-orig-stat-item bonus-item"><span class="skills-orig-stat-lbl">Bono</span>'+
        '<span class="skill-bonus-ctrl">'+
          (isGM() ? gmCustomTools : (
            '<button data-action="skill-sub-custom" data-id="'+cs.id+'" '+(canSub?'':'disabled')+' aria-label="Restar progreso">-</button>'+
            '<span>'+bonusVal+' ('+prog+'/'+costNeeded+')</span>'+
            '<button data-action="skill-add-custom" data-id="'+cs.id+'" '+(canAdd?'':'disabled')+' aria-label="Añadir progreso">+</button>'
          ))+
        '</span>'+
      '</div>'+
      '<div class="skills-orig-stat-item total-item"><span class="skills-orig-stat-lbl">Total</span><span class="skills-orig-total" title="Total: '+customSkillTotal(cs,c)+'">'+customSkillTotal(cs,c)+'</span></div>'+
      '<button class="dice-btn" data-action="roll-custom-skill" data-id="'+cs.id+'" aria-label="Tirar '+esc(cs.name)+'">&#127922;</button>'+
    '</div>'+
  '</div>';
}

var TRAINING_CATS = [
  { id: "skill", icon: "🎯", label: "Habilidad", die: "d10", sides: 10, type: "existing" },
  { id: "unlock", icon: "🔮", label: "Desbloqueo", die: "d20", sides: 20, type: "new" },
  { id: "combat", icon: "⚔️", label: "Combate", die: "d10", sides: 10, type: "existing" },
  { id: "spell_summon", icon: "✨", label: "Hechizo", die: "d10", sides: 10, type: "existing" },
  { id: "narrative", icon: "📜", label: "Lore", die: "d20", sides: 20, type: "new" }
];

// Entrenamientos de atributos (Físico, Destreza...) de antes: ya no cuentan
function isLegacyAttrTraining(t){
  if(!t || (t.category || "skill") !== "combat") return false;
  var keys = ["fisico","destreza","inteligencia","percepcion","carisma"];
  var stats = ["+1 Físico","+1 Destreza","+1 Inteligencia","+1 Percepción","+1 Carisma"];
  if(t.linkedId) return keys.indexOf(String(t.linkedId).replace("stat:", "")) !== -1;
  return stats.indexOf(t.targetStat) !== -1;
}

function tplEntrenamiento(c){
  c.trainings = c.trainings || [];
  var canEdit = canEditChar(c);

  var html = '<div class="section' + (c.isNPC ? ' gm-section' : '') + '">';
  
  html += '<div class="section-title" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
    '<span>' + icono("espantapajaros") + ' Entrenamiento y Progresión</span>' +
  '</div>' +
  (canEdit ? '<button class="btn-solid-gold btn-add-training" data-action="add-training">+ Nuevo Entrenamiento</button>' : '');

  if(!canEdit && currentUser){
    html += '<div class="tr-spectator-banner">' +
      '<span style="font-size:1.15rem;flex:none;">' + icono("percepcion") + '</span>' +
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
      // Los atributos no se entrenan: los antiguos se quedan visibles pero no suman
      var isLegacyAttr = isLegacyAttrTraining(t);
      var canRoll = canEdit && !isLegacyAttr;
      var isQuantifiable = !isLegacyAttr && (catId === "combat" || catId === "skill" || catId === "spell_summon");
      var targetGoal = num(t.targetGoal, 100);
      var isCompleted = targetGoal > 0 && points >= targetGoal;
      var progressPct = targetGoal > 0 ? clamp(Math.round((Math.max(0, points) / targetGoal) * 100), 0, 100) : 0;

      // Hito exclusivo del Máster (Puntos meta ocultos para jugadores)
      var gmMilestoneHtml = '';
      if(isGM()){
        gmMilestoneHtml = '<div class="tr-gm-milestone-box">' +
          '<div style="display:flex;align-items:center;gap:6px;font-size:0.75rem;">' +
            '<span style="color:var(--gold-light);font-weight:700;">' + icono("master") + ' Hito del Máster (Puntos Meta):</span>' +
            '<input type="number" min="1" step="5" data-action="set-training-goal" data-id="' + t.id + '" value="' + targetGoal + '" title="Puntos para completar este hito (Invisible para jugadores)" style="width:60px;background:var(--bg-card);border:1px solid var(--line);border-radius:4px;padding:3px 6px;color:var(--gold-light);font-family:var(--font-mono);font-weight:700;font-size:0.82rem;text-align:center;">' +
            '<span style="color:var(--ink-faint);font-size:0.7rem;">pts meta (Oculto a jugadores)</span>' +
          '</div>' +
          '<div style="font-size:0.72rem;display:flex;align-items:center;gap:6px;">' +
            (isCompleted
              ? '<span style="color:#4ADE80;font-weight:700;background:rgba(46,139,87,0.25);border:1px solid rgba(74,222,128,0.4);padding:2px 8px;border-radius:4px;">' + icono("trofeo") + ' ¡Hito alcanzado! (' + points + ' / ' + targetGoal + ' pts)</span>'
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
          '<select class="tr-cat-select k-input" data-action="set-training-linked" data-id="' + t.id + '" ' + (canEdit ? '' : 'disabled') + ' style="background:var(--bg-card);border:1px solid var(--line);border-radius:5px;padding:7px 6px;font-size:.8rem;color:var(--ink);width:100%;">' +
            '<option value="">-- Seleccionar Hechizo o Invocación --</option>' +
            '<optgroup label="Hechizos">' +
              (c.spells || []).map(function(sp){
                return '<option value="spell:' + sp.id + '" ' + (t.linkedId === sp.id ? 'selected' : '') + '>' + esc(sp.name || "Hechizo") + '</option>';
              }).join('') +
            '</optgroup>' +
            '<optgroup label="Invocaciones">' +
              (c.summons || []).map(function(sm){
                return '<option value="summon:' + sm.id + '" ' + (t.linkedId === sm.id ? 'selected' : '') + '>' + esc(sm.name || "Invocación") + '</option>';
              }).join('') +
            '</optgroup>' +
          '</select>' +
        '</div>';
      } else if(catId === "combat"){
        var curTargetStat = t.targetStat || "+10 PV";
        secondaryHtml = '<div class="creature-field" style="flex:1;min-width:140px;">' +
          '<label>Atributo o Estadística</label>' +
          '<select class="tr-cat-select k-input" data-action="set-training-linked" data-id="' + t.id + '" ' + (canEdit ? '' : 'disabled') + ' style="background:var(--bg-card);border:1px solid var(--line);border-radius:5px;padding:7px 6px;font-size:.8rem;color:var(--ink);width:100%;">' +
            '<option value="stat:pv" ' + (curTargetStat === "+10 PV" || t.linkedId === "stat:pv" ? 'selected' : '') + '>Vida (+10 PV)</option>' +
            '<option value="stat:mana" ' + (curTargetStat === "+5 Maná" || t.linkedId === "stat:mana" ? 'selected' : '') + '>Maná (+5 Maná)</option>' +
            '<option value="stat:defensa" ' + (curTargetStat === "+1 Defensa" || t.linkedId === "stat:defensa" ? 'selected' : '') + '>Defensa (+1)</option>' +
            '<option value="stat:iniciativa" ' + (curTargetStat === "+1 Iniciativa" || t.linkedId === "stat:iniciativa" ? 'selected' : '') + '>Iniciativa (+1)</option>' +
            (isLegacyAttr && (curTargetStat === "+1 Físico" || t.linkedId === "stat:fisico") ? '<option value="stat:fisico" selected>Físico (+1) · antiguo</option>' : '') +
            (isLegacyAttr && (curTargetStat === "+1 Destreza" || t.linkedId === "stat:destreza") ? '<option value="stat:destreza" selected>Destreza (+1) · antiguo</option>' : '') +
            (isLegacyAttr && (curTargetStat === "+1 Inteligencia" || t.linkedId === "stat:inteligencia") ? '<option value="stat:inteligencia" selected>Inteligencia (+1) · antiguo</option>' : '') +
            (isLegacyAttr && (curTargetStat === "+1 Percepción" || t.linkedId === "stat:percepcion") ? '<option value="stat:percepcion" selected>Percepción (+1) · antiguo</option>' : '') +
            (isLegacyAttr && (curTargetStat === "+1 Carisma" || t.linkedId === "stat:carisma") ? '<option value="stat:carisma" selected>Carisma (+1) · antiguo</option>' : '') +
          '</select>' +
        '</div>';
      } else if(catId === "skill"){
        secondaryHtml = '<div class="creature-field" style="flex:1;min-width:140px;">' +
          '<label>Habilidad a Desarrollar</label>' +
          '<select class="tr-cat-select k-input" data-action="set-training-linked" data-id="' + t.id + '" ' + (canEdit ? '' : 'disabled') + ' style="background:var(--bg-card);border:1px solid var(--line);border-radius:5px;padding:7px 6px;font-size:.8rem;color:var(--ink);width:100%;">' +
            '<option value="">-- Seleccionar Habilidad --</option>' +
            (typeof SKILL_DEFS !== "undefined" ? SKILL_DEFS : []).map(function(sdef){
              return '<option value="skill:' + sdef.id + '" ' + (t.linkedId === sdef.id || t.linkedId === "skill:" + sdef.id ? 'selected' : '') + '>' + esc(sdef.name) + '</option>';
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
            '<div class="tr-progress-caption" style="display:flex;justify-content:space-between;align-items:center;font-size:0.68rem;color:var(--ink-dim);margin-top:3px;flex-wrap:wrap;gap:4px;">' +
              '<div style="display:flex;align-items:center;gap:6px;">' +
                (isCompleted ? '<button type="button" class="btn-solid-gold btn-compact" data-action="grant-training-reward" data-id="' + t.id + '" title="Otorgar +1 a la habilidad entrenada (GM)" style="padding:2px 7px;font-size:0.68rem;cursor:pointer;">' + icono("trofeo") + ' Otorgar Recompensa (+1)</button>' : '') +
                '<span>' + (isCompleted ? '¡Hito completado!' : 'Progreso hacia el hito del Máster...') + '</span>' +
              '</div>' +
              '<span style="color:var(--gold-light);font-weight:600;"><b>' + points + ' / ' + targetGoal + ' pts</b> (' + progressPct + '%)</span>' +
            '</div>' +
          '</div>';
        } else {
          if(isCompleted){
            progressHtml = '<div class="tr-player-complete-box">' +
              '<div style="display:flex;align-items:center;gap:6px;font-size:0.78rem;color:#4ADE80;font-weight:700;">' +
                '<span>' + icono("destellos") + ' ¡Hito de Entrenamiento Completado!</span>' +
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
                '<span>' + icono("actividad") + ' Entrenamiento en progreso... (Acumulando puntos de esfuerzo)</span>' +
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
              (canEdit ? '<button type="button" class="tr-chip-del" data-action="undo-training-roll" data-training-id="' + t.id + '" data-roll-id="' + r.id + '" title="Deshacer tirada">&times;</button>' : '') +
            '</div>';
          }).join('') +
        '</div>';
      }

      // Tarjeta limpia estilo Invocaciones (.creature-card)
      html += '<div class="creature-card training-card' + (isLegacyAttr ? ' training-legacy' : '') + '" data-id="' + t.id + '" data-juice-card="t' + t.id + '" style="' + (isLegacyAttr ? 'opacity:.55;filter:grayscale(1);' : '') + 'background:linear-gradient(160deg, var(--bg-elev), var(--bg-card));border:1px solid var(--line);border-radius:var(--radius-sm);padding:12px;margin-bottom:11px;box-shadow:0 4px 14px -6px rgba(0,0,0,0.7);">' +
        // Fila 1: Encabezado (Nombre + PTS Badge + Del)
        '<div class="creature-card-header" style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">' +
          '<input type="text" class="creature-name-input" data-bind="trainings.' + t.id + '.name" value="' + esc(t.name) + '" placeholder="Nombre del entrenamiento (ej: Veneno de Seta)..." ' + (canEdit ? '' : 'readonly') + ' style="font-family:var(--font-display);font-size:1.02rem;color:var(--gold-light);background:none;border:none;border-bottom:1px solid var(--line-strong);padding:2px 4px;flex:1;min-width:0;">' +
          '<div style="display:flex;align-items:center;gap:6px;flex:none;">' +
            '<div class="tr-points-badge" title="Puntos acumulados de esfuerzo" style="background:rgba(176,141,87,0.18);border:1px solid var(--line);border-radius:4px;padding:2px 6px;display:flex;align-items:center;gap:3px;">' +
              '<span class="tr-points-val" style="font-family:var(--font-mono);font-weight:700;font-size:.85rem;color:var(--gold-light);">' + (points > 0 ? '+' + points : points) + '</span>' +
              '<span class="tr-points-label" style="font-size:.6rem;color:var(--ink-faint);text-transform:uppercase;">PTS</span>' +
            '</div>' +
            (canEdit ? '<button class="row-del" data-action="del-training" data-id="' + t.id + '" title="Eliminar entrenamiento" aria-label="Eliminar" style="width:28px;height:28px;min-width:28px;min-height:28px;">&times;</button>' : '') +
          '</div>' +
        '</div>' +

        // Fila 2: Cuadrícula de inputs estructurados
        '<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;flex-wrap:wrap;">' +
          '<div class="creature-field" style="flex:1;min-width:130px;">' +
            '<label>Categoría</label>' +
            '<select class="tr-cat-select k-input" data-action="set-training-category" data-id="' + t.id + '" ' + (canEdit ? '' : 'disabled') + ' style="background:var(--bg-card);border:1px solid var(--line);border-radius:5px;padding:7px 6px;font-size:.8rem;color:var(--ink);width:100%;">' +
              '<option value="skill" ' + (catId === 'skill' ? 'selected' : '') + '>Habilidad</option>' +
              '<option value="spell_summon" ' + (catId === 'spell_summon' ? 'selected' : '') + '>Magia / Hechizo</option>' +
              '<option value="combat" ' + (catId === 'combat' ? 'selected' : '') + '>Combate</option>' +
              '<option value="narrative" ' + (catId === 'narrative' ? 'selected' : '') + '>Lore / Narrativa</option>' +
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
          (isLegacyAttr ? '<span class="tr-legacy-note" style="font-size:.75rem;color:var(--ink-faint);">Antiguo · no cuenta: los atributos solo suben con nivel, mejoras o piedras.</span>' : '') +
          (canRoll ? (
            '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
              '<button type="button" class="btn-compact tr-roll-btn" data-action="roll-training" data-id="' + t.id + '" style="padding:5px 9px;font-size:.78rem;font-weight:700;">' +
                icono("dado") + ' Tirar Automático (d' + sides + ')' +
              '</button>' +
              '<div class="tr-manual-group" style="display:inline-flex;align-items:center;gap:3px;background:var(--bg-card);border:1px solid var(--line);border-radius:4px;padding:2px 4px;">' +
                '<input type="number" min="1" max="' + sides + '" class="tr-manual-input k-input" data-manual-for="' + t.id + '" placeholder="1-' + sides + '" title="Tirada de dado físico" style="width:44px;background:none;border:none;color:var(--ink);font-family:var(--font-mono);font-size:.8rem;text-align:center;">' +
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
  html += '<div class="combat-subnav-pills k-seg">'+
    '<button type="button" class="k-seg-btn subnav-pill active" data-action="switch-tab" data-tab="combate">' + icono("puno") + ' Combate y Armas</button>'+
    '<button type="button" class="k-seg-btn subnav-pill" data-action="switch-tab" data-tab="estados">' + icono("aturdido", {tam:"s"}) + ' Estados y Buffs ('+assignedBuffs.length+')</button>'+
  '</div>';

  if(!canEdit && currentUser){
    html += '<div class="spectator-banner">'+
      '<span>' + icono("percepcion") + ' Modo Espectador: Solo lectura. No puedes modificar combate, armas ni armaduras en esta ficha.</span>'+
    '</div>';
  }

  // 2. Tira informativa rápida de estados activos
  if(activeBuffsList.length > 0 || activeDebuffsList.length > 0 || activeSpells.length > 0){
    html += '<div class="combat-status-strip" data-action="switch-tab" data-tab="estados" role="button" title="Haz clic para ver y gestionar estados en detalle">'+
      '<div class="css-left">'+
        (activeBuffsList.length > 0 ? '<span class="css-badge-buff">'+icono("destellos")+' '+activeBuffsList.length+' Buff'+(activeBuffsList.length>1?'s':'')+'</span>' : '')+
        (activeDebuffsList.length > 0 ? '<span class="css-badge-debuff">'+icono("peligro")+' '+activeDebuffsList.length+' Debuff'+(activeDebuffsList.length>1?'s':'')+'</span>' : '')+
        (activeSpells.length > 0 ? '<span class="css-badge-spell">'+icono("varita")+' '+activeSpells.length+' Magia'+(activeSpells.length>1?'s':'')+'</span>' : '')+
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
    '<div class="combat-grid k-stat-grid">'+
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
    var infoText = selectedCatItem ? ('Daño: ' + esc(selectedCatItem.dano) + ' | Alcance: ' + esc(selectedCatItem.alcance)) : 'Selecciona un arma del compendio';
    if(isBlocked){
      infoText += ' | <span style="color:#F87171;font-weight:700;">[' + iconoUI("candado") + ' Bloqueada por el Máster - No usable]</span>';
    }

    var gridCols = canEdit ? '1fr 36px 36px' : '1fr 36px';
    html += '<div class="list-row weapons-row'+(isBlocked?' weapon-row-blocked':'')+'" style="grid-template-columns:'+gridCols+';">'+
      '<div class="kpick-wrap">'+kPickerBtnHtml('Seleccionar arma del compendio', selectedCatItem ? (selectedCatItem.visible===false?'🔒 ':'')+selectedCatItem.name+' ('+selectedCatItem.dano+')' : '', !canEdit).replace('data-kpick="1"','data-kpick="1" data-kp-title="Elegir arma"')+
      '<select class="kpick-native" data-action="select-weapon-catalog" data-id="'+w.id+'" aria-label="Seleccionar arma" '+(canEdit?'':'disabled')+'>'+
        '<option value="">-- Seleccionar Arma del Compendio --</option>'+
        catalog.map(function(catItem){
          var isLockedOpt = catItem.visible === false;
          return '<option value="'+catItem.id+'" data-sub="'+esc(catItem.dano)+'" '+(selectedCatItem && selectedCatItem.id===catItem.id?'selected':'')+'>'+(isLockedOpt ? '🔒 ' : '')+esc(catItem.name)+(isLockedOpt ? ' [Bloqueada]' : '')+'</option>';
        }).join('')+
      '</select></div>'+
      (isBlocked && !isGM()
        ? '<button class="dice-btn disabled" disabled title="Esta arma está bloqueada por el Máster y no se puede usar en combate" aria-label="Arma bloqueada" style="opacity:0.38;cursor:not-allowed;filter:grayscale(1);">' + iconoUI("candado") + '</button>'
        : '<button class="dice-btn" data-action="roll-weapon" data-id="'+w.id+'" title="Tirar Daño ('+esc(selectedCatItem ? selectedCatItem.dano : "1d6")+')" aria-label="Tirar daño">&#127922;</button>'
      )+
      (canEdit ? '<button class="row-del" data-action="del-weapon" data-id="'+w.id+'" aria-label="Eliminar arma">' + iconoUI("cerrar") + '</button>' : '')+
    '</div>'+
    '<div style="font-size:0.7rem;color:var(--gold-light);margin-bottom:6px;padding-left:2px;">'+infoText+(selectedCatItem && selectedCatItem.critico?' | <b>Crítico:</b> '+esc(selectedCatItem.critico):'')+'</div>';
  });
  if(canEdit){
    html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-weapon">+ Añadir arma al equipo</button>';
  }
  html += '</div>';
  html += tplPoisonLoadout(c, canEdit);

  // 6. Armaduras
  html += '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Armaduras</span></div>';
  (c.armors||[]).forEach(function(a){
    html += '<div class="list-row armor-row">'+
      '<input type="text" placeholder="Armadura" data-bind="armors.'+a.id+'.name" value="'+esc(a.name)+'" aria-label="Nombre de armadura" '+(canEdit?'':'readonly')+'>'+
      '<input type="text" placeholder="Absorción" data-bind="armors.'+a.id+'.absorcion" value="'+esc(a.absorcion)+'" aria-label="Absorción" '+(canEdit?'':'readonly')+'>'+
      '<input type="text" placeholder="Estorbo" data-bind="armors.'+a.id+'.estorbo" value="'+esc(a.estorbo)+'" aria-label="Estorbo" '+(canEdit?'':'readonly')+'>'+
      (canEdit ? '<button class="row-del" data-action="del-armor" data-id="'+a.id+'" aria-label="Eliminar armadura">' + iconoUI("cerrar") + '</button>' : '')+
    '</div>';
  });
  if(canEdit){
    html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-armor">+ Añadir armadura</button>';
  }
  html += '</div>';

  return html;
}

function tplEstados(c){
  var assignedBuffs = c.activeBuffs || [];
  var catalogBuffs = (state.buffCatalog || []).filter(function(b){ return isGM() || b.visible !== false; });
  var canEdit = canEditChar(c);

  var html = '';

  // 1. Subnavegación rápida entre Combate y Estados
  html += '<div class="combat-subnav-pills k-seg">'+
    '<button type="button" class="k-seg-btn subnav-pill" data-action="switch-tab" data-tab="combate">' + icono("puno") + ' Combate y Armas</button>'+
    '<button type="button" class="k-seg-btn subnav-pill active" data-action="switch-tab" data-tab="estados">' + icono("aturdido", {tam:"s"}) + ' Estados y Buffs ('+assignedBuffs.length+')</button>'+
  '</div>';

  if(!canEdit && currentUser){
    html += '<div class="spectator-banner">'+
      '<span>' + icono("percepcion") + ' Modo Espectador: Solo lectura. No puedes modificar los estados de este personaje.</span>'+
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
            '<span class="abc-type-tag '+(isDebuff?'debuff':'buff')+'">'+(isDebuff?icono("peligro")+' DEBUFF':icono("destellos")+' BUFF')+'</span>'+
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
              ''+icono("diana",{tam:"s"})+' Efecto: <b>'+esc(ab.bonus)+'</b>'+(ab.attr ? ' ('+esc(ab.attr)+')' : '')+
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
      '<div class="kpick-wrap">'+kPickerBtnHtml('Seleccionar buff o debuff para asignar', '', false).replace('data-kpick="1"','data-kpick="1" data-kp-title="Asignar estado"')+
      '<select data-action="assign-buff-from-catalog" class="kpick-native buff-quick-assign-select">'+
        '<option value="">-- Seleccionar buff o debuff para asignar --</option>'+
        unassignedBuffs.map(function(ub){
          return '<option value="'+ub.id+'">'+(ub.type==='debuff'?'[Debuff] ':'[Buff] ')+esc(ub.name)+(ub.bonus?' ('+esc(ub.bonus)+')':'')+'</option>';
        }).join('')+
      '</select></div>'+
    '</div>';
  }

  // Panel desplegable con los 3 estados claros para cada buff/debuff del catálogo
  html += '<details class="buff-catalog-details" style="background:var(--bg-card);border:1px solid var(--line);border-radius:6px;padding:8px 10px;margin-top:10px;">'+
    '<summary style="font-size:.75rem;color:var(--gold-light);cursor:pointer;user-select:none;font-weight:600;">'+iconoUI("menu")+' Ver todos los buffs y debuffs del catálogo ('+catalogBuffs.length+' totales) y sus 3 estados</summary>'+
    '<div style="display:flex;flex-direction:column;gap:6px;margin-top:10px;">';

  catalogBuffs.forEach(function(cbuff){
    var assigned = assignedBuffs.find(function(ab){ return ab.id === cbuff.id; });
    var stateBadge = '';
    var actionBtns = '';

    if(!assigned){
      stateBadge = '<span class="buff-state-pill unassigned" style="font-size:.65rem;padding:2px 6px;border-radius:4px;background:rgba(255,255,255,0.06);color:var(--ink-dim);border:1px solid var(--line);font-weight:600;"><span class="dot"></span> No asignado</span>';
      if(canEdit){
        actionBtns = '<button type="button" class="btn-compact" data-action="assign-buff-from-catalog" data-id="'+cbuff.id+'" style="font-size:.68rem;padding:4px 8px;">+ Asignar</button>';
      }
    } else if(assigned.active === false){
      stateBadge = '<span class="buff-state-pill assigned-inactive" style="font-size:.65rem;padding:2px 6px;border-radius:4px;background:rgba(180,130,40,0.18);color:#E5B869;border:1px solid rgba(180,130,40,0.35);font-weight:600;">'+iconoUI("pausa")+' Inactivo</span>';
      if(canEdit){
        actionBtns = '<button type="button" class="btn-compact" data-action="toggle-global-buff" data-id="'+cbuff.id+'" style="font-size:.68rem;padding:4px 8px;">Activar</button>'+
          '<button type="button" class="row-del" data-action="remove-active-buff" data-id="'+cbuff.id+'" title="Desanclar del personaje" style="min-width:26px;min-height:26px;width:26px;height:26px;font-size:.7rem;">'+iconoUI("cerrar")+'</button>';
      }
    } else {
      stateBadge = '<span class="buff-state-pill assigned-active" style="font-size:.65rem;padding:2px 6px;border-radius:4px;background:rgba(61,110,96,0.25);color:var(--teal-light);border:1px solid var(--teal-light);font-weight:600;">'+iconoUI("hecho")+' Activo</span>';
      if(canEdit){
        actionBtns = '<button type="button" class="btn-compact" data-action="toggle-global-buff" data-id="'+cbuff.id+'" style="font-size:.68rem;padding:4px 8px;">Desactivar</button>'+
          '<button type="button" class="row-del" data-action="remove-active-buff" data-id="'+cbuff.id+'" title="Desanclar del personaje" style="min-width:26px;min-height:26px;width:26px;height:26px;font-size:.7rem;">'+iconoUI("cerrar")+'</button>';
      }
    }

    html += '<div class="catalog-buff-row" style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 8px;background:var(--bg-elev);border:1px solid var(--line);border-radius:5px;flex-wrap:wrap;">'+
      '<div style="display:flex;align-items:center;gap:6px;min-width:0;flex:1 1 200px;">'+
        '<span style="font-size:.82rem;">'+(cbuff.type==='debuff'?icono("debuff",{tam:"s"}):icono("buff",{tam:"s"}))+'</span>'+
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
        '<span style="font-size:.8rem;color:var(--teal-light);font-weight:600;">'+icono("destellos",{tam:"s"})+' '+esc(asp.name || "Hechizo")+(stacks>1?' <b>(Cargas: '+stacks+')</b>':'')+statNote+'</span>'+
        (canEdit ? '<button class="row-del" data-action="toggle-spell-active" data-id="'+asp.id+'" aria-label="Quitar carga de magia" style="min-width:28px;min-height:28px;width:28px;height:28px;" title="Quitar 1 carga">'+iconoUI("cerrar")+'</button>' : '')+
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
        (canEdit ? '<button class="row-del" data-action="del-custom-buff" data-id="'+cbuff.id+'" aria-label="Eliminar buff">'+iconoUI("cerrar")+'</button>' : '')+
      '</div>';
    });
  }
  if(canEdit){
    html += '<button class="btn-compact" style="margin-top:6px;width:100%;" data-action="add-custom-buff">+ Añadir estado temporal</button>';
  }
  html += '</div>';

  return html;
}

function combatStat(label,bind,val,rollable){
  var c = activeChar();
  // Nadie escribe estos valores a mano: la Defensa sale de Destreza + Esquivar + 5 y el resto son valores de la ficha
  var isDef = bind === "defensa";
  if(isDef) val = defensaBase(c);
  var eff = getEffectiveCombatStat(bind, c);
  var diff = eff - num(val, 0);
  var diffBadge = diff !== 0 ? '<span class="stat-eff-tag '+(diff>0?'pos':'neg')+'" title="Valor efectivo">'+(diff>0?'+'+diff:diff)+' (Total: '+eff+')</span>' : '';
  var info;
  if(isDef){
    info = 'Defensa '+num(val,0)+' = Destreza '+num(c.attrs ? c.attrs.destreza : 0, 0)+' + Esquivar '+num(c.skillBonus ? c.skillBonus.esquivar : 0, 0)+' + 5. Los estados no la cambian.';
  } else if(bind === "escudoActual"){
    info = 'Escudo actual: '+num(val,0)+'. Sube y baja con los botones de la barra de escudo y con los estados activos.';
  } else {
    info = label+' '+num(val,0)+': valor propio del personaje.'+(diff !== 0 ? ' Con estados y magias activos: '+eff+'.' : ' Cambia con estados y magias activos.');
  }
  return '<div class="combat-stat k-stat"><label class="k-stat-label">'+esc(label)+diffBadge+'</label>'+
    '<span class="k-stat-value" data-stat="combat.'+bind+'" aria-label="'+esc(label)+'">'+num(val,0)+'</span>'+
    '<button type="button" class="stat-info-btn" data-action="toggle-stat-info" aria-label="De dónde sale '+esc(label)+'">&#9432;</button>'+
    '<div class="stat-info-text" hidden>'+esc(info)+'</div>'+
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
      '<span>👁️ Modo Espectador: Solo lectura. No puedes lanzar hechizos ni gastar maná en esta ficha.</span>'+
    '</div>';
  }
  html += renderSpellsGrimoire(c, canEdit);
  return html;
}

function renderSpellsGrimoire(c, canEdit){
  var html = '<div class="section' + (c.isNPC ? ' gm-section' : '') + '"><div class="section-title"><span>Grimorio y Artes Mágicas</span></div>' +
    '<div class="field" style="margin-bottom:12px;"><label>Tipo de Magia</label><input type="text" data-bind="magiaTipo" value="' + esc(c.magiaTipo) + '" placeholder="Ej: Piroclástica, Nigromancia, Sanación..." ' + (canEdit ? '' : 'readonly') + '></div>';

  if(!c.spells || !c.spells.length){
    html += '<div style="font-size:.82rem;color:var(--ink-faint);font-style:italic;padding:8px 2px;">Sin hechizos conocidos en el grimorio.</div>';
  } else {
    c.spells.forEach(function(s){
      var isActive = !!s.active;
      var stacks = s.activeStacks || (isActive ? 1 : 0);
      var hasStatMod = s.statAttr && s.statMod;
      var statBadge = hasStatMod ? '<span class="spell-badge effect">✨ ' + esc(s.statMod) + ' ' + esc(s.statAttr) + (stacks > 1 ? ' (x' + stacks + ')' : '') + '</span>' : '';
      var activeBadge = isActive ? '<span class="spell-badge active">ACTIVO' + (stacks > 1 ? ' x' + stacks : '') + '</span>' : '';

      if(canEdit && state._spellEdit && state._spellEdit[s.id]){
      html += '<div class="spell-card' + (isActive ? ' active-spell' : '') + '">' +
        '<div class="spell-card-header">' +
          '<input type="text" class="spell-name-input" placeholder="Nombre del Hechizo" data-bind="spells.' + s.id + '.name" value="' + esc(s.name) + '" ' + (canEdit ? '' : 'readonly') + '>' +
          '<div class="spell-badges">' +
            activeBadge +
            statBadge +
            (canEdit ? (isActive ?
              '<button class="spell-btn-act cast" data-action="cast-spell" data-id="' + s.id + '" title="Lanzar de nuevo y superponer">+ Superponer (-' + num(s.coste, 1) + ' Maná)</button>' +
              '<button class="spell-btn-act cancel" data-action="toggle-spell-active" data-id="' + s.id + '" title="Quitar una carga o desactivar">✕ Quitar Carga (' + stacks + ')</button>' :
              '<button class="spell-btn-act cast" data-action="cast-spell" data-id="' + s.id + '">⚡ Activar (-' + num(s.coste, 1) + ' Maná)</button>'
            ) : '') +
            '<button type="button" class="btn-compact" data-action="toggle-spell-edit" data-id="' + s.id + '">✓ Listo</button>' +
            (canEdit ? '<button class="row-del" data-action="del-spell" data-id="' + s.id + '" aria-label="Eliminar hechizo" style="min-width:28px;min-height:28px;width:28px;height:28px;">✕</button>' : '') +
          '</div>' +
        '</div>' +
        '<div class="spell-grid">' +
          '<div class="creature-field"><label>Coste (Maná)</label><input type="number" min="0" data-bind="spells.' + s.id + '.coste" value="' + num(s.coste, 1) + '" ' + (canEdit ? '' : 'readonly') + '></div>' +
          '<div class="creature-field"><label>Alcance / Rango</label><input type="text" placeholder="Melé, 30m, Personal..." data-bind="spells.' + s.id + '.rango" value="' + esc(s.rango) + '" ' + (canEdit ? '' : 'readonly') + '></div>' +
        '</div>' +
        '<div class="spell-grid" style="margin-top:6px;">' +
          '<div class="creature-field"><label>Stat que Afecta (Opcional)</label>' +
            '<select style="font-size:.74rem;background:var(--bg-card);padding:3px 6px;border:1px solid var(--line);border-radius:var(--radius-sm);color:var(--ink);" data-bind="spells.' + s.id + '.statAttr" ' + (canEdit ? '' : 'disabled') + '>' +
              renderSpellStatOptions(s.statAttr) +
            '</select>' +
          '</div>' +
          '<div class="creature-field"><label>Modificador de Stat</label><input type="text" placeholder="+2, -1, +1d4..." data-bind="spells.' + s.id + '.statMod" value="' + esc(s.statMod) + '" ' + (canEdit ? '' : 'readonly') + '></div>' +
        '</div>' +
        '<div class="creature-field" style="margin-top:6px;"><label>Efecto y Descripción Narrativa</label>' +
          '<textarea class="spell-notes k-input" placeholder="Efectos mágicos, reglas específicas o descripción..." data-bind="spells.' + s.id + '.efecto" ' + (canEdit ? '' : 'readonly') + '>' + esc(s.efecto) + '</textarea>' +
        '</div>' +
      '</div>';
      } else {
        var spOpen = !!(state._spellOpen && state._spellOpen[s.id]);
        html += '<div class="spell-card' + (isActive ? ' active-spell' : '') + '">' +
          '<div class="spell-name-read">' + (esc(s.name) || 'Hechizo sin nombre') + '</div>' +
          '<div class="summon-pills-wrap spell-pills-read">' + activeBadge +
            '<span class="spell-pill">' + icono("mana", {tam:"s"}) + ' ' + num(s.coste, 1) + ' maná</span>' +
            (s.rango ? '<span class="spell-pill">🎯 ' + esc(s.rango) + '</span>' : '') +
            statBadge +
          '</div>' +
          '<div class="spell-efecto-read' + (spOpen ? '' : ' spell-efecto-clamp') + '" data-action="toggle-spell-open" data-id="' + s.id + '">' + (s.efecto ? esc(s.efecto) : '<i>Sin descripción.</i>') + '</div>' +
          (canEdit ? '<div class="spell-act-row">' + (canEdit ? (isActive ?
              '<button class="spell-btn-act cast" data-action="cast-spell" data-id="' + s.id + '" title="Lanzar de nuevo y superponer">+ Superponer (-' + num(s.coste, 1) + ' Maná)</button>' +
              '<button class="spell-btn-act cancel" data-action="toggle-spell-active" data-id="' + s.id + '" title="Quitar una carga o desactivar">✕ Quitar Carga (' + stacks + ')</button>' :
              '<button class="spell-btn-act cast" data-action="cast-spell" data-id="' + s.id + '">⚡ Activar (-' + num(s.coste, 1) + ' Maná)</button>'
            ) : '') +
            '<button type="button" class="btn-compact" data-action="toggle-spell-edit" data-id="' + s.id + '">✏️ Editar</button>' +
          '</div>' : '') +
        '</div>';
      }
    });
  }

  if(canEdit){
    html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-spell">+ Añadir Hechizo al Grimorio</button>';
  }
  html += '</div>';
  return html;
}

function renderLapidaryWorkshop(c, canEdit){
  var isMaster = (typeof isGM === "function") ? isGM() : false;
  var stones = c.stones || [];
  var roughStones = stones.filter(function(st){ return st.estado === "en_bruto"; });
  var polishedStones = stones.filter(function(st){ return st.estado !== "en_bruto"; });
  var perfectStones = polishedStones.filter(function(st){ return st.calidad === "perfecta"; });

  var curTier = (typeof getLapidaryTier === "function") ? getLapidaryTier(c.lapidaryTier) : { id: "hierro", name: "Puntas de Hierro", bonusRoll: 0, icon: "⛏️" };
  var intVal = num(c.attrs.inteligencia, 1);
  var skillBonus = (c.skillBonus && c.skillBonus["Piedras mágicas"]) ? num(c.skillBonus["Piedras mágicas"], 0) : 0;

  var html = '';

  // 0. Veredictos de talla pendientes (solo el máster)
  if(typeof renderLapidaryVerdictPanel === "function") html += renderLapidaryVerdictPanel();

  // 1. Panel Superior: Banco de Trabajo, Herramientas y Resumen
  html += '<div class="section' + (c.isNPC ? ' gm-section' : '') + ' lapidary-bench-section">' +
    '<div class="section-title"><span>💎 Taller de Lapidario y Talla Arcana</span></div>' +
    '<div class="lapidary-bench-top">' +
      '<div class="lapidary-tool-card">' +
        '<div class="lapidary-tool-icon">' + curTier.icon + '</div>' +
        '<div class="lapidary-tool-info">' +
          '<div class="lapidary-tool-name">' + esc(curTier.name) + ' <span class="lapidary-tool-bonus">+' + curTier.bonusRoll + ' a la Talla</span></div>' +
          '<div class="lapidary-tool-desc">' + esc(curTier.desc || "Herramientas de corte y facetado de gemas.") + '</div>' +
        '</div>' +
        (canEdit ? 
          '<div class="lapidary-tier-select-wrap">' +
            '<label>Mejorar Puntas:</label>' +
            '<select class="lapidary-tier-select" data-action="change-lapidary-tier" data-char-id="' + c.id + '">' +
              (typeof LAPIDARY_TIERS !== "undefined" ? LAPIDARY_TIERS : []).map(function(t){
                return '<option value="' + t.id + '" ' + (t.id === curTier.id ? 'selected' : '') + '>' + t.icon + ' ' + t.name + ' (+' + t.bonusRoll + ')</option>';
              }).join('') +
            '</select>' +
          '</div>' : '') +
      '</div>' +

      '<div class="lapidary-stat-chips">' +
        '<div class="lapidary-stat-chip" title="Atributo Inteligencia">' +
          '<span class="lapidary-stat-label">🧠 Inteligencia</span>' +
          '<span class="lapidary-stat-val">+' + intVal + '</span>' +
        '</div>' +
        '<div class="lapidary-stat-chip" title="Bono de habilidad Piedras Mágicas">' +
          '<span class="lapidary-stat-label">✨ Habilidad Piedras</span>' +
          '<span class="lapidary-stat-val">+' + skillBonus + '</span>' +
        '</div>' +
        '<div class="lapidary-stat-chip" title="Total de gemas pulidas">' +
          '<span class="lapidary-stat-label">💎 Pulidas</span>' +
          '<span class="lapidary-stat-val">' + polishedStones.length + '</span>' +
        '</div>' +
        '<div class="lapidary-stat-chip gold" title="Gemas de calidad Perfecta">' +
          '<span class="lapidary-stat-label">★ Perfectas</span>' +
          '<span class="lapidary-stat-val">' + perfectStones.length + '</span>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>';

  // 2. Bandeja de Minerales en Bruto (Listas para el Minijuego de Talla)
  html += '<div class="section' + (c.isNPC ? ' gm-section' : '') + '">' +
    '<div class="section-title">' +
      '<span>⛏️ Minerales y Gemas en Bruto (' + roughStones.length + ')</span>' +
      (canEdit ? '<button type="button" class="btn-compact" data-action="open-add-stone-modal" data-char-id="' + c.id + '" style="font-size:.68rem;">+ Añadir en Bruto</button>' : '') +
    '</div>';

  if(!roughStones.length){
    html += '<div style="font-size:.82rem;color:var(--ink-faint);font-style:italic;padding:12px 4px;text-align:center;background:rgba(0,0,0,0.15);border-radius:var(--radius-sm);border:1px dashed var(--line);">' +
      'No tienes minerales en bruto en el taller. Extrae piedras en vetas de cuevas/minas o cómpralas a mercaderes en las ciudades.' +
    '</div>';
  } else {
    html += '<div class="lapidary-rough-grid">';
    roughStones.forEach(function(st){
      var fam = (typeof getStoneFamily === "function") ? getStoneFamily(st.color) : { name: st.color, icon: "💎", hex: "#DEC392", gema: "Piedra Mágica en Bruto" };
      html += '<div class="lapidary-rough-card">' +
        '<div class="lapidary-rough-header">' +
          '<div class="lapidary-rough-title">' +
            '<span class="lapidary-gem-dot" style="background:' + fam.hex + ';box-shadow:0 0 8px ' + (fam.glow || fam.hex) + ';"></span>' +
            '<b>Piedra ' + esc(fam.name) + ' en Bruto</b>' +
          '</div>' +
          '<span class="lapidary-origin-pill">' + (st.origen.includes("Minas") ? "⛏️ " : "🪙 ") + esc(st.origen) + '</span>' +
        '</div>' +
        '<div class="lapidary-rough-desc">Familia: Piedra ' + esc(fam.name) + ' &bull; Potencial: <i>' + esc(fam.familia) + '</i></div>' +
        (st.notasInvestigacion ? '<div class="lapidary-rough-notes">' + esc(st.notasInvestigacion) + '</div>' : '') +
        '<div class="lapidary-rough-actions">' +
          (canEdit ? '<button type="button" class="btn-solid-gold lapidary-btn-polish" data-action="open-lapidary-minigame" data-id="' + st.id + '" data-char-id="' + c.id + '">✨ Pulir en Taller</button>' : '') +
          (canEdit ? '<button type="button" class="row-del" data-action="del-stone" data-id="' + st.id + '" aria-label="Descartar piedra">✕</button>' : '') +
        '</div>' +
      '</div>';
    });
    html += '</div>';
  }
  html += '</div>';

  // 3. Colección de Piedras Pulidas (Joyel Mágico — Reutiliza .item-card y bordes de calidad, Punto 4)
  html += '<div class="section' + (c.isNPC ? ' gm-section' : '') + '">' +
    '<div class="section-title"><span>✨ Colección de Piedras Pulidas (' + polishedStones.length + ')</span></div>';

  if(!polishedStones.length){
    html += '<div style="font-size:.82rem;color:var(--ink-faint);font-style:italic;padding:12px 4px;text-align:center;background:rgba(0,0,0,0.15);border-radius:var(--radius-sm);border:1px dashed var(--line);">' +
      'Aún no has pulido ninguna gema. Utiliza el banco de lapidario arriba para tallar tus piedras en bruto.' +
    '</div>';
  } else {
    polishedStones.forEach(function(st){
      var fam = (typeof getStoneFamily === "function") ? getStoneFamily(st.color) : { name: st.color, icon: "💎", hex: "#DEC392", gema: "Piedra Mágica Pulida" };
      var qId = String(st.calidad || "buena").toLowerCase().replace(/[^a-z0-9áéíóúüñ_-]/g, "");
      var qInfo = (typeof getStoneQuality === "function") ? getStoneQuality(qId) : { label: qId.toUpperCase(), color: "#60A5FA" };

      // Progresión de descubrimiento (1: sin_descubrir, 2: teorizado, 3: confirmado)
      var prog = st.progDescubrimiento || ((st.efectoConcreto || st.efecto) ? "confirmado" : "sin_descubrir");
      var pStep = (prog === "confirmado") ? 3 : (prog === "teorizado" ? 2 : 1);

      var isConfirmed = (prog === "confirmado");
      var concreteEffect = st.efectoConcreto || st.efecto || "";

      // Reutiliza clase .item-card con bordes y glows adaptados a tonos preciosos (Punto 4)
      html += '<div class="item-card quality-' + qId + ' lapidary-gem-card" id="stone-card-' + st.id + '">' +
        '<div class="lapidary-card-top">' +
          '<div class="lapidary-card-title-row">' +
            '<span class="lapidary-card-icon" style="color:' + fam.hex + ';filter:drop-shadow(0 0 6px ' + (fam.glow || fam.hex) + ');">' + fam.icon + '</span>' +
            '<div class="lapidary-card-main-title">' +
              '<h3>Piedra ' + esc(fam.name) + ' Pulida</h3>' +
              '<div class="lapidary-card-subtitle">Efecto Base: ' + esc(fam.familia) + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="lapidary-card-badges">' +
            '<span class="item-badge badge-' + qId + '" title="' + esc(qInfo.desc) + '">Calidad: ' + esc(qInfo.label) + '</span>' +
            '<span class="lapidary-origin-pill">' + (st.origen.includes("Minas") ? "⛏️ " : "🪙 ") + esc(st.origen) + '</span>' +
            (canEdit ? '<button type="button" class="row-del" data-action="del-stone" data-id="' + st.id + '" aria-label="Eliminar gema">✕</button>' : '') +
          '</div>' +
        '</div>' +
        (typeof renderLapidaryStoneStatus === "function" ? renderLapidaryStoneStatus(st) : '') +

        // Stepper de Progresión de Descubrimiento (Mismo patrón de 3 pasos)
        '<div class="lapidary-discovery-box">' +
          '<div class="lapidary-discovery-header">' +
            '<span class="lapidary-discovery-title">🔍 Descubrimiento Arcana de Propiedades:</span>' +
            (canEdit && !isConfirmed ? '<button type="button" class="btn-compact lapidary-btn-investigate" data-action="investigate-stone" data-id="' + st.id + '" data-char-id="' + c.id + '" title="Tirada de Inteligencia + Habilidad">🔬 Investigar Gema (1d10)</button>' : '') +
          '</div>' +
          '<div class="lapidary-stepper-track">' +
            '<div class="lapidary-stepper-step ' + (pStep >= 1 ? 'active' : '') + ' ' + (pStep === 1 ? 'current' : '') + '">' +
              '<span class="lapidary-step-bullet">1</span>' +
              '<span class="lapidary-step-name">Sin Descubrir</span>' +
            '</div>' +
            '<div class="lapidary-stepper-line ' + (pStep >= 2 ? 'active' : '') + '"></div>' +
            '<div class="lapidary-stepper-step ' + (pStep >= 2 ? 'active' : '') + ' ' + (pStep === 2 ? 'current' : '') + '">' +
              '<span class="lapidary-step-bullet">2</span>' +
              '<span class="lapidary-step-name">Teorizado</span>' +
            '</div>' +
            '<div class="lapidary-stepper-line ' + (pStep >= 3 ? 'active' : '') + '"></div>' +
            '<div class="lapidary-stepper-step ' + (pStep >= 3 ? 'active' : '') + ' ' + (pStep === 3 ? 'current' : '') + '">' +
              '<span class="lapidary-step-bullet">3</span>' +
              '<span class="lapidary-step-name">Confirmado</span>' +
            '</div>' +
          '</div>' +
        '</div>' +

        // Área de Efecto Concreto: Patrón de Secreto GM idéntico a Venenos (Punto 3)
        '<div class="lapidary-effect-section">' +
          '<label class="lapidary-field-label">Efecto Mágico Concreto:</label>' +
          (isConfirmed ? 
            '<textarea class="lapidary-effect-input" data-bind="stones.' + st.id + '.efectoConcreto" placeholder="Efecto activo o pasivo verificado en acción..." ' + (canEdit ? '' : 'readonly') + '>' + esc(concreteEffect) + '</textarea>' :
            '<div class="alchemy-mystery-fog"><span>🔒 Efecto concreto desconocido. Permanece oculto hasta ser confirmado o revelado por el GM.</span></div>'
          ) +

          // Tarjeta Confidencial Máster si no está confirmado y el usuario es GM
          (!isConfirmed && isMaster ?
            '<div class="alchemy-gm-confidential-card" style="margin-top:8px;">' +
              '<div class="alchemy-gm-confidential-header">' +
                '<span class="alchemy-gm-badge">🔒 INFO SECRETA MÁSTER</span>' +
                '<button type="button" class="alchemy-btn-reveal" data-action="stone-gm-reveal" data-id="' + st.id + '" data-char-id="' + c.id + '">👁️ Revelar a Jugador</button>' +
              '</div>' +
              '<div class="alchemy-gm-confidential-body"><b>Efecto Real Configurado:</b> ' + (concreteEffect ? esc(concreteEffect) : '<i>Sin efecto concreto redactado aún. Puedes escribirlo pulsando Revelar o editándolo como GM.</i>') + '</div>' +
            '</div>' : ''
          ) +
        '</div>' +

        // Notas de Investigación y Yacimiento
        '<div class="lapidary-notes-section">' +
          '<label class="lapidary-field-label">Notas de Investigación y Talla:</label>' +
          '<textarea class="lapidary-notes-input" data-bind="stones.' + st.id + '.notasInvestigacion" placeholder="Detalles de facetas, observaciones de resonancia, hipótesis..." ' + (canEdit ? '' : 'readonly') + '>' + esc(st.notasInvestigacion || '') + '</textarea>' +
        '</div>' +
      '</div>';
    });
  }
  html += '</div>';

  // 4. Códice de Piedras y Familias (Consulta y Lore de Krysalis)
  html += '<div class="section' + (c.isNPC ? ' gm-section' : '') + '">' +
    '<div class="section-title"><span>📜 Códice de Piedras Mágicas y Familias Arcanas</span></div>' +
    '<div class="lapidary-codex-grid">' +
      (typeof MAGIC_STONE_FAMILIES !== "undefined" ? MAGIC_STONE_FAMILIES : []).map(function(f){
        return '<div class="lapidary-codex-card">' +
          '<div class="lapidary-codex-header">' +
            '<span class="lapidary-codex-icon" style="color:' + f.hex + ';filter:drop-shadow(0 0 6px ' + f.glow + ');">' + f.icon + '</span>' +
            '<div>' +
              '<b style="color:' + f.hex + ';">Piedra ' + esc(f.name) + '</b>' +
              '<div class="lapidary-codex-family">' + esc(f.familia) + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="lapidary-codex-desc">' + esc(f.desc) + '</div>' +
        '</div>';
      }).join('') +
    '</div>' +
  '</div>';

  return html;
}

var alchemyView = "recetario";
var alchemySearch = "";
var invSearch = "";
var alchemyFilterType = "Todos";
var alchemyFilterProg = "todos";
var alchemyFilterTerrain = "Todos";
var alchemyCardTab = "usar";

var ALCHEMY_STAGES = [
  { id: "identificado", label: "Muestra", num: 1, icon: "🌿", desc: "Materia prima identificada" },
  { id: "extraido", label: "Extraído", num: 2, icon: "🧪", desc: "Sustancia refinada en frasco" },
  { id: "probado", label: "Probado", num: 3, icon: "🎯", desc: "Efecto experimentado en campo" },
  { id: "confirmado", label: "Catalogado", num: 4, icon: "📜", desc: "Efecto oficial verificado" }
];

function getAlchemyStageIndex(stageId){
  if(stageId === "confirmado" || stageId === "catalogado") return 4;
  if(stageId === "probado") return 3;
  if(stageId === "extraido") return 2;
  if(stageId === "identificado" || stageId === "muestra") return 1;
  return 0; // desconocido
}

function getAlchemyStageLabel(stageId){
  if(stageId === "confirmado" || stageId === "catalogado") return "Catalogado Oficial";
  if(stageId === "probado") return "Probado (En prueba)";
  if(stageId === "extraido") return "Extraído (Efecto incierto)";
  if(stageId === "identificado" || stageId === "muestra") return "Muestra Identificada";
  return "Sin descubrir";
}

var alchemyFiltersOpen = false;

function alchemyStageText(idx){
  return idx >= 4 ? "Conocido" : (idx >= 3 ? "Probado" : "Sin probar");
}

// Fase común (Muestra → Extraído): la más alta de los dos ejes, sin pasar de Extraído
function getAlchemyBaseIndex(p){
  return Math.min(2, Math.max(getAlchemyStageIndex(p.progEnemigo), getAlchemyStageIndex(p.progCherk)));
}

function isCherkChar(c){
  if(!c) return false;
  var n = (c.name || "").toLowerCase();
  return c.id === "char_cherk" || n.indexOf("cherk") !== -1;
}

// La rama "En Cherk" es su pasiva: solo la ven Cherk (su dueño) y el máster, y solo en su ficha
function alchemyShowsCherk(c){
  return isCherkChar(c) && canEditChar(c);
}

function findAlchemyCatalogItem(p){
  return typeof ALCHEMY_CATALOG !== "undefined" ? ALCHEMY_CATALOG.find(function(x){
    return (p.catalogId && x.id === p.catalogId) || (x.name.trim().toLowerCase() === (p.name||'').trim().toLowerCase());
  }) : null;
}

var alchemyHoursOpen = false;

// Destilado en curso: distillUntil/distillFrom son horas del reloj de la partida
function alchemyDistillState(p){
  if(p.distillUntil === undefined || p.distillUntil === null || p.distillUntil === "") return null;
  var until = num(p.distillUntil, 0);
  var from = num(p.distillFrom, until);
  var now = typeof getGameClockHours === "function" ? getGameClockHours() : null;
  var ready = now === null || now >= until;
  var total = Math.max(1, until - from);
  var done = now === null ? total : Math.max(0, Math.min(total, now - from));
  return { until: until, ready: ready, left: ready ? 0 : until - now, pct: Math.max(4, Math.round(done / total * 100)) };
}

var alchemyPrepareId = null;
var POISON_AMMO_RE = /dardo|flecha|virote|aguja|bala/i;

// Usos por dosis: cada dosis preparada da N cargas de arma o N proyectiles (4 si el máster no lo cambia)
function poisonUsesPerDose(p){
  var n = Math.round(num(p && p.usosPorDosis, 4));
  return Math.max(1, Math.min(20, n || 4));
}

// Lo preparado con veneno: cargas en armas (weapon.venenos) y munición del inventario (poisonId)
function getPoisonLoadout(c, poisonId){
  var out = [];
  (c.weapons || []).forEach(function(w){
    (Array.isArray(w.venenos) ? w.venenos : []).forEach(function(v){
      if(poisonId && v.poisonId !== poisonId) return;
      out.push({ kind: "weapon", id: w.id, poisonId: v.poisonId, label: w.name || "Arma sin nombre", poison: v.name || "", n: Math.max(0, num(v.cargas, 0)) });
    });
  });
  (c.inventory || []).forEach(function(it){
    if(!it.poisonId || (poisonId && it.poisonId !== poisonId)) return;
    out.push({ kind: "ammo", id: it.id, poisonId: it.poisonId, label: it.name || "", poison: it.poisonName || "", n: Math.max(0, num(it.qty, 0)) });
  });
  return out;
}

function poisonLoadoutUnits(x){
  if(x.kind === "weapon") return x.n === 1 ? "1 carga" : x.n + " cargas";
  return "×" + x.n;
}

// Mismo bloque en Combate e Inventario: gastar un uso, y el máster puede deshacerlo
function tplPoisonLoadout(c, canEdit){
  var list = getPoisonLoadout(c);
  if(!list.length) return '';
  var gm = isGM();
  var rows = list.map(function(x){
    var data = ' data-kind="' + x.kind + '" data-id="' + x.id + '" data-poison="' + esc(x.poisonId) + '"';
    return '<div class="psn-row' + (x.n < 1 ? ' empty' : '') + '">' +
      '<span class="psn-ico">' + (x.kind === "weapon" ? '⚔️' : '🏹') + '</span>' +
      '<span class="psn-txt"><b>' + esc(x.label) + '</b><small>' + (x.kind === "weapon" ? '🧪 ' + esc(x.poison) + ' · ' : '') +
        (x.n > 0 ? poisonLoadoutUnits(x) : 'Agotado') + '</small></span>' +
      (canEdit && x.n > 0 ? '<button type="button" class="psn-btn"' + data + ' data-action="poison-spend">Gastar 1</button>' : '') +
      (canEdit && x.n < 1 ? '<button type="button" class="psn-btn"' + data + ' data-action="poison-clear">Quitar</button>' : '') +
      (gm ? '<button type="button" class="psn-btn gm"' + data + ' data-action="poison-undo" aria-label="Deshacer un uso">↩ +1</button>' : '') +
    '</div>';
  }).join('');
  return '<div class="section psn-section' + (c.isNPC ? ' gm-section' : '') + '"><div class="section-title"><span>🧪 Preparado con veneno</span></div>' +
    '<div class="psn-list">' + rows + '</div></div>';
}

function poisonAmmoBaseName(name){
  var n = String(name || "").trim();
  return /[aeiou]s$/i.test(n) && n.length > 4 ? n.slice(0, -1) : n;
}

function tplAlquimiaPreparar(c, p){
  var uses = poisonUsesPerDose(p);
  var weapons = (c.weapons || []).filter(function(w){ return w.name; });
  var wBtns = weapons.map(function(w){
    var has = (Array.isArray(w.venenos) ? w.venenos : []).find(function(v){ return v.poisonId === p.id; });
    return '<button type="button" class="alq-btn psn-pick" data-action="alchemy-prepare-weapon" data-id="' + p.id + '" data-wid="' + w.id + '">⚔️ ' + esc(w.name) +
      '<small>+' + uses + ' cargas' + (has && num(has.cargas, 0) > 0 ? ' (ya tiene ' + num(has.cargas, 0) + ')' : '') + '</small></button>';
  }).join('');
  var srcs = (c.inventory || []).filter(function(it){ return !it.poisonId && POISON_AMMO_RE.test(it.name || "") && num(it.qty, 0) > 0; });
  var aBtns = srcs.map(function(it){
    var n = Math.min(uses, num(it.qty, 0));
    return '<button type="button" class="alq-btn psn-pick" data-action="alchemy-prepare-ammo" data-id="' + p.id + '" data-src="' + it.id + '">🏹 ' + esc(poisonAmmoBaseName(it.name)) + ' con ' + esc(p.name) + ' ×' + n +
      '<small>Gasta ' + n + ' de "' + esc(it.name) + '" (tienes ' + num(it.qty, 0) + ')</small></button>';
  }).join('');
  if(!aBtns){
    aBtns = '<button type="button" class="alq-btn psn-pick" data-action="alchemy-prepare-ammo" data-id="' + p.id + '" data-src="">🏹 Dardo con ' + esc(p.name) + ' ×' + uses +
      '<small>No hay dardos ni flechas en el inventario</small></button>';
  }
  return '<div class="alq-sheet-bg" data-action="alchemy-close-prepare">' +
    '<div class="alq-sheet" role="dialog" aria-label="Preparar veneno">' +
      '<div class="alq-sheet-head"><h3>Preparar: ' + esc(p.name) + '</h3><button type="button" class="alq-sheet-x" data-action="alchemy-close-prepare" aria-label="Cerrar">✕</button></div>' +
      '<p class="alq-note">Gastas 1 dosis (tienes ' + num(p.dosis, 0) + ') y da <b>' + uses + ' usos</b>.</p>' +
      '<div class="alq-sheet-lbl">Impregnar un arma</div>' +
      (wBtns ? '<div class="psn-picks">' + wBtns + '</div>' : '<p class="alq-note">No hay armas en la pestaña Combate.</p>') +
      '<div class="alq-sheet-lbl">Crear munición</div>' +
      '<div class="psn-picks">' + aBtns + '</div>' +
    '</div>' +
  '</div>';
}

function alchemyRarityOf(p){
  var cat = findAlchemyCatalogItem(p);
  return p.rarity || (cat ? cat.rarity : 'Común');
}

// Al mover el reloj (o cambiar las horas), repinta Alquimia salvo si se está escribiendo
document.addEventListener("gameclockchange", function(){
  if(!state || state.activeTab !== "alquimia") return;
  var ae = document.activeElement;
  if(ae && (ae.tagName === "TEXTAREA" || ae.tagName === "INPUT" || ae.tagName === "SELECT")) return;
  renderTab();
});

function tplAlquimiaHoras(){
  var rows = Object.keys(DISTILL_HOURS_DEFAULT).map(function(r, i){
    return '<label class="alq-note" for="alq-hours-' + i + '">' + esc(r) + '</label>' +
      '<input type="number" class="alq-hours-input k-input" id="alq-hours-' + i + '" data-rarity="' + esc(r) + '" min="0" max="999" inputmode="numeric" value="' + getDistillHours(r) + '">';
  }).join('');
  return '<div class="alq-sheet-bg" data-action="alchemy-close-hours">' +
    '<div class="alq-sheet" role="dialog" aria-label="Horas de destilado">' +
      '<div class="alq-sheet-head"><h3>Horas de destilado</h3><button type="button" class="alq-sheet-x" data-action="alchemy-close-hours" aria-label="Cerrar">✕</button></div>' +
      '<p class="alq-note">Horas de juego que tarda una dosis según la rareza. Avanzan cuando mueves el reloj de la partida.</p>' +
      '<div class="alq-hours">' + rows + '</div>' +
      '<div class="alq-btnrow"><button type="button" class="alq-btn gold" data-action="alchemy-save-hours">Guardar</button></div>' +
    '</div>' +
  '</div>';
}

function alchemyActiveFilterCount(){
  return (alchemyFilterType !== "Todos" ? 1 : 0) + (alchemyFilterProg !== "todos" ? 1 : 0) + (alchemyFilterTerrain !== "Todos" ? 1 : 0);
}

function tplAlquimia(c){
  var canEdit = canEditChar(c);
  var html = '';
  if(!canEdit && currentUser){
    html += '<div class="spectator-banner">'+
      '<span>👁️ Modo Espectador: Solo lectura. No puedes modificar fórmulas ni venenos en esta ficha.</span>'+
    '</div>';
  }

  html += '<div class="section' + (c.isNPC ? ' gm-section' : '') + '">';
  html += '<div class="section-title"><span>Alquimia</span></div>';

  html += '<div class="filter-pills alq-views k-seg">' +
    '<button class="f-pill k-seg-btn ' + (alchemyView === 'recetario' ? 'active' : '') + '" data-action="set-alchemy-view" data-val="recetario">' + icono("pocion", {tam:"s"}) + ' Sustancias</button>' +
    '<button class="f-pill k-seg-btn ' + (alchemyView === 'taller' ? 'active' : '') + '" data-action="set-alchemy-view" data-val="taller">' + icono("alambique", {tam:"s"}) + ' Mesa de elaboración</button>' +
  '</div>';

  if(alchemyView === "taller"){
    html += tplAlquimiaTaller(c, canEdit);
  } else {
    html += tplAlquimiaRecetario(c, canEdit);
  }

  html += '</div>';
  return html;
}

function tplAlquimiaFiltros(){
  var pills = function(list, cur, action){
    return '<div class="alq-pills">' + list.map(function(o){
      return '<button type="button" class="alq-pill' + (cur === o.v ? ' active' : '') + '" data-action="' + action + '" data-val="' + esc(o.v) + '">' + esc(o.l) + '</button>';
    }).join('') + '</div>';
  };
  var opt = function(arr){ return arr.map(function(x){ return { v: x, l: x }; }); };
  return '<div class="alq-sheet-bg" data-action="alchemy-close-filters">' +
    '<div class="alq-sheet" role="dialog" aria-label="Filtros de alquimia">' +
      '<div class="alq-sheet-head"><h3>Filtros</h3><button type="button" class="alq-sheet-x" data-action="alchemy-close-filters" aria-label="Cerrar">✕</button></div>' +
      '<div class="alq-sheet-lbl">Tipo</div>' +
      pills(opt(['Todos', 'Veneno', 'Poción', 'Ungüento']), alchemyFilterType, "set-alchemy-type-filter") +
      '<div class="alq-sheet-lbl">Estado</div>' +
      pills([{ v: "todos", l: "Todos" }, { v: "sin_probar", l: "Sin probar" }, { v: "investigando", l: "Sin conocer del todo" }, { v: "confirmado", l: "Conocidos" }], alchemyFilterProg, "set-alchemy-prog-filter") +
      '<div class="alq-sheet-lbl">Terreno</div>' +
      pills(opt(['Todos', 'Bosque', 'Pantano', 'Minas / Cuevas', 'Desierto', 'Montañas', 'Praderas', 'Jungla', 'Aguas profundas']), alchemyFilterTerrain, "set-alchemy-terrain-filter") +
      '<div class="alq-btnrow">' +
        '<button type="button" class="alq-btn" data-action="alchemy-clear-filters">Quitar filtros</button>' +
        '<button type="button" class="alq-btn gold" data-action="alchemy-close-filters">Ver resultados</button>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function tplAlquimiaRecetario(c, canEdit){
  var html = '';
  var isMaster = isGM();
  var showCherk = alchemyShowsCherk(c);
  if(typeof window.alchemyExpandedCards === 'undefined') window.alchemyExpandedCards = {};

  var nF = alchemyActiveFilterCount();
  html += '<div class="alq-search">' +
    '<input type="text" class="alchemy-search-input k-input" id="alchemySearchInput" value="' + esc(alchemySearch) + '" placeholder="Buscar sustancia, efecto o terreno" data-action="search-alchemy">' +
    '<button type="button" class="alq-btn alq-filter-btn' + (nF ? ' on' : '') + '" data-action="alchemy-open-filters">Filtros' + (nF ? ' (' + nF + ')' : '') + '</button>' +
  '</div>';
  if(canEdit){
    html += '<div class="alq-btnrow alq-top-actions">' +
      '<button type="button" class="alq-btn gold" data-action="open-alchemy-catalog-modal">+ Del catálogo</button>' +
      '<button type="button" class="alq-btn" data-action="add-poison">+ Fórmula propia</button>' +
    '</div>' +
    '<div class="alq-btnrow alq-top-actions">' +
      (isMaster && typeof getGameClockHours === "function" && getGameClockHours() !== null ? '<button type="button" class="alq-btn gm" data-action="alchemy-open-hours">' + icono("actividad", {tam:"s"}) + ' Horas de destilado</button>' : '') +
    '</div>';
  }
  if(alchemyFiltersOpen) html += tplAlquimiaFiltros();
  if(alchemyHoursOpen && isMaster) html += tplAlquimiaHoras();
  if(alchemyPrepareId && canEdit){
    var prepP = (c.poisons || []).find(function(x){ return x.id === alchemyPrepareId; });
    if(prepP && num(prepP.dosis, 0) > 0) html += tplAlquimiaPreparar(c, prepP);
  }

  var sText = alchemySearch.trim().toLowerCase();
  var filtered = (c.poisons || []).filter(function(p){
    if(alchemyFilterType !== "Todos" && (p.type || "Veneno") !== alchemyFilterType) return false;
    var catItem = findAlchemyCatalogItem(p);
    var terrain = (catItem && catItem.terrain) || p.terrain || "Desconocido";
    if(alchemyFilterTerrain !== "Todos" && terrain !== alchemyFilterTerrain) return false;

    // Sin la rama de Cherk, el estado solo mira "En enemigos"
    var eIdx = getAlchemyStageIndex(p.progEnemigo);
    var cIdx = showCherk ? getAlchemyStageIndex(p.progCherk) : eIdx;
    if(alchemyFilterProg === "confirmado" && (eIdx < 4 || cIdx < 4)) return false;
    if(alchemyFilterProg === "investigando" && (eIdx === 4 && cIdx === 4)) return false;
    if(alchemyFilterProg === "sin_probar" && (eIdx >= 3 && cIdx >= 3)) return false;

    if(sText){
      var hay = (p.name || '') + ' ' + (p.efectoEnemigo || '') + ' ' + (showCherk ? (p.efectoCherk || '') : '') + ' ' +
        ((catItem && catItem.rawMaterial) || '') + ' ' + terrain;
      if(hay.toLowerCase().indexOf(sText) === -1) return false;
    }
    return true;
  });

  if(!filtered.length){
    html += '<div class="alq-empty">' +
      '<p>🌿 ' + ((c.poisons || []).length ? 'Ninguna sustancia con esta búsqueda o filtros.' : 'Aún no hay sustancias en esta ficha.') + '</p>' +
      (nF ? '<button type="button" class="alq-btn" data-action="alchemy-clear-filters">Quitar filtros</button>' : '') +
    '</div>';
    return html;
  }

  html += '<div class="alq-list">';
  filtered.forEach(function(p){
    html += tplAlquimiaCard(c, p, canEdit, isMaster, showCherk);
  });
  html += '</div>';
  return html;
}

// Resumen corto de lo que el jugador ha anotado (nunca el efecto secreto del máster)
function alqNoteSummary(p, showCherk){
  var txt = '';
  if(getAlchemyStageIndex(p.progEnemigo) >= 3 && p.efectoEnemigo) txt = '⚔️ ' + p.efectoEnemigo;
  else if(showCherk && getAlchemyStageIndex(p.progCherk) >= 3 && p.efectoCherk) txt = '🧪 ' + p.efectoCherk;
  txt = String(txt).replace(/\s+/g, ' ').trim();
  if(!txt) return '';
  if(txt.length > 70) txt = txt.slice(0, 68) + '…';
  return '<span class="alq-note-sum">' + esc(txt) + '</span>';
}

function tplAlquimiaCard(c, p, canEdit, isMaster, showCherk){
  var cat = findAlchemyCatalogItem(p);
  var typeIcon = p.type === 'Poción' ? icono("destellos", {tam:"s"}) : (p.type === 'Ungüento' ? icono("hierbas", {tam:"s"}) : icono("pocion", {tam:"s"}));
  var rarity = p.rarity || (cat ? cat.rarity : 'Común');
  var rClass = 'alq-r-' + String(rarity).toLowerCase().replace(/[^a-z0-9áéíóúüñ_-]/g, '');
  var terrain = (cat ? cat.terrain : (p.terrain || 'Bosque'));
  var rawMat = (cat ? cat.rawMaterial : (p.rawMaterial || ''));
  var loreTitle = cat ? cat.loreRefTitle : null;
  var eIdx = getAlchemyStageIndex(p.progEnemigo);
  var cIdx = getAlchemyStageIndex(p.progCherk);
  var base = getAlchemyBaseIndex(p);
  var dosis = num(p.dosis, 0);
  var open = !!window.alchemyExpandedCards[p.id];

  var tags = '<span class="alq-tag e">' + icono("fisico", {tam:"s"}) + ' En enemigos: ' + alchemyStageText(eIdx) + '</span>';
  if(showCherk) tags += '<span class="alq-tag s">' + icono("escudo", {tam:"s"}) + ' En ' + esc(c.name || 'Cherk') + ': ' + alchemyStageText(cIdx) + '</span>';
  if(base < 2) tags += '<span class="alq-tag">' + icono("hierbas", {tam:"s"}) + ' ' + (base === 1 ? 'Solo muestra' : 'Sin muestra') + '</span>';
  var dist = alchemyDistillState(p);
  if(dist) tags += dist.ready ? '<span class="alq-tag ready">✓ Lista</span>' : '<span class="alq-tag wait">' + icono("actividad", {tam:"s"}) + ' faltan ' + dist.left + ' h</span>';

  var html = '<div class="alq-card ' + rClass + (open ? ' open' : '') + '" id="alchemy-card-' + p.id + '">' +
    '<button type="button" class="alq-row" data-action="toggle-alchemy-card" data-id="' + p.id + '" aria-expanded="' + open + '">' +
      '<span class="alq-ico">' + typeIcon + '</span>' +
      '<span class="alq-mid"><span class="alq-nm">' + esc(p.name) + '</span><span class="alq-sub">' + esc(p.type || 'Veneno') + ' · ' + esc(terrain) + '</span><span class="alq-tags">' + tags + '</span></span>' +
      '<span class="alq-dose">×' + dosis + '<small>dosis</small></span>' +
      '<span class="alq-chev">▶</span>' +
    '</button>';
  if(!open) return html + '</div>';

  var tab = alchemyCardTab;
  if(tab === "ajustes" && !canEdit && !isMaster) tab = "usar";
  var tabBtn = function(v, l){
    return '<button type="button" class="f-pill k-seg-btn' + (tab === v ? ' active' : '') + '" data-action="set-alchemy-card-tab" data-val="' + v + '">' + l + '</button>';
  };
  html += '<div class="alq-body">' +
    '<div class="filter-pills alq-card-tabs k-seg">' + tabBtn("usar", "Usar") + tabBtn("proceso", "Proceso") +
      (canEdit || isMaster ? tabBtn("ajustes", "Ajustes") : '') + '</div>';

  if(tab === "proceso"){
    html += '<div class="alq-meta"><span>' + esc(p.type || 'Veneno') + '</span><span>· ' + esc(rarity) + '</span><span>· ' + esc(terrain) + '</span>' +
        (loreTitle ? '<button type="button" class="alq-link" data-action="alchemy-jump-lore" data-lore-title="' + esc(loreTitle) + '">Ver en Lore ↗</button>' : '') +
      '</div>' +
      '<div class="alq-path">' +
        tplAlquimiaStep(p, 1, base, "identificado", "Muestra", rawMat ? "Materia prima: " + rawMat + "." : "Materia prima recogida.", canEdit) +
        tplAlquimiaStep(p, 2, base, "extraido", "Extraído", "Destilada en un frasco. Tarda según la rareza.", canEdit) +
      '</div>';
    return html + '</div></div>';
  }

  if(tab === "ajustes"){
    if(canEdit){
      html += '<div class="alq-namefield"><label class="alq-note" for="alq-name-' + p.id + '">Nombre</label>' +
          '<input type="text" id="alq-name-' + p.id + '" data-bind="poisons.' + p.id + '.name" value="' + esc(p.name) + '" placeholder="Nombre de la sustancia">' +
        '</div>';
    }
    if(isMaster && (p.type || "Veneno") === "Veneno") html += tplAlquimiaUses(p);
    if(canEdit) html += '<button type="button" class="alq-btn alq-del" data-action="del-poison" data-id="' + p.id + '">🗑 Quitar de la ficha</button>';
    return html + '</div></div>';
  }

  if(canEdit){
    html += '<div class="alq-dosebar"><span class="alq-note">Dosis en la bolsa</span><div class="alq-stepper">' +
        '<button type="button" data-action="alchemy-mod-dosis" data-id="' + p.id + '" data-delta="-1" aria-label="Quitar dosis">−</button>' +
        '<b>' + dosis + '</b>' +
        '<button type="button" data-action="alchemy-mod-dosis" data-id="' + p.id + '" data-delta="1" aria-label="Añadir dosis">+</button>' +
      '</div></div>';
  }
  html += tplAlquimiaNext(c, p, canEdit, showCherk, cat, rawMat, base, eIdx, cIdx, dosis, isMaster, rarity, dist) +
    tplAlquimiaPrepared(c, p) +
    '<div class="alq-split">' +
      tplAlquimiaBranch(p, "progEnemigo", "efectoEnemigo", "⚔️ En enemigos", "e", eIdx, canEdit, isMaster, cat && cat.efectoEnemigo) +
      (showCherk ? tplAlquimiaBranch(p, "progCherk", "efectoCherk", "🛡️ En " + esc(c.name || "Cherk") + " (su pasiva)", "s", cIdx, canEdit, isMaster, cat && cat.efectoCherk) : '') +
    '</div>';
  return html + '</div></div>';
}

function tplAlquimiaPrepared(c, p){
  if((p.type || "Veneno") !== "Veneno") return '';
  var list = getPoisonLoadout(c, p.id).filter(function(x){ return x.n > 0; });
  if(!list.length) return '';
  return '<p class="alq-note psn-ready">Preparado: ' + list.map(function(x){
    return '<b>' + esc(x.label) + '</b> ' + poisonLoadoutUnits(x);
  }).join(' · ') + '</p>';
}

function tplAlquimiaUses(p){
  var uses = poisonUsesPerDose(p);
  return '<div class="alq-dosebar"><span class="alq-note">Usos por dosis (máster)</span><div class="alq-stepper">' +
      '<button type="button" data-action="alchemy-mod-uses" data-id="' + p.id + '" data-delta="-1" aria-label="Menos usos por dosis">−</button>' +
      '<b>' + uses + '</b>' +
      '<button type="button" data-action="alchemy-mod-uses" data-id="' + p.id + '" data-delta="1" aria-label="Más usos por dosis">+</button>' +
    '</div></div>';
}

function tplAlquimiaStep(p, n, base, stageId, title, sub, canEdit){
  var done = base >= n;
  var now = base === n && n < 2;
  var cls = 'alq-step' + (done && !now ? ' done' : '') + (now ? ' now' : '');
  var dot = '<span class="alq-dot">' + (done && !now ? '✓' : n) + '</span>';
  var txt = '<span class="alq-step-txt"><b>' + title + '</b><span>' + esc(sub) + '</span></span>';
  if(!canEdit) return '<div class="' + cls + '">' + dot + txt + '</div>';
  return '<button type="button" class="' + cls + '" data-action="alchemy-set-base" data-id="' + p.id + '" data-stage="' + stageId + '" aria-pressed="' + done + '">' + dot + txt + '</button>';
}

function tplAlquimiaBranch(p, axis, field, label, cls, idx, canEdit, isMaster, secret){
  var mini = function(v, t, sub, on){
    return '<button type="button" class="alq-mini" data-action="alchemy-set-branch" data-id="' + p.id + '" data-axis="' + axis + '" data-stage="' + v + '" aria-pressed="' + on + '"' + (canEdit ? '' : ' disabled') + '>' + t + '<small>' + sub + '</small></button>';
  };
  var html = '<div class="alq-branch ' + cls + '"><h4>' + label + '</h4>' +
    '<div class="alq-minis">' + mini("probado", "Probado", "ya lo habéis visto", idx === 3) + mini("confirmado", "Conocido", "efecto confirmado", idx >= 4) + '</div>';
  if(idx >= 3 || isMaster){
    html += '<textarea data-bind="poisons.' + p.id + '.' + field + '" placeholder="¿Qué pasó? Anótalo aquí"' + (canEdit ? '' : ' readonly') + '>' + esc(p[field]) + '</textarea>';
  } else {
    html += '<div class="alq-fog">Aún no sabéis qué hace. ' + (cls === "e" ? "Úsala en un enemigo." : "Tómatela para descubrirlo.") + '</div>';
  }
  if(isMaster && secret){
    html += '<details class="alq-secret"><summary>🔒 Solo máster: efecto real</summary><p>' + esc(secret) + '</p>' +
      '<button type="button" class="alq-btn gm" data-action="alchemy-gm-reveal" data-id="' + p.id + '" data-axis="' + axis + '" data-text="' + esc(secret) + '">Revelar y marcar como conocido</button></details>';
  }
  return html + '</div>';
}

function tplAlquimiaNext(c, p, canEdit, showCherk, cat, rawMat, base, eIdx, cIdx, dosis, isMaster, rarity, dist){
  var k = 'Siguiente paso', txt = '', btns = '', bar = '';
  var cd = cat ? cat.dificultadExtraccion : 10;
  var timed = typeof getGameClockHours === "function" && getGameClockHours() !== null;
  var hrs = timed ? getDistillHours(rarity) : 0;
  var distill = '<button type="button" class="alq-btn gold" data-action="alchemy-craft-single" data-id="' + p.id + '">' +
      (timed && hrs > 0 ? '⚗️ Empezar a destilar (' + hrs + ' h)' : '⚗️ Destilar (+1 dosis)') + '</button>' +
    '<button type="button" class="alq-btn" data-action="alchemy-roll-herbalism" data-id="' + p.id + '" data-cd="' + cd + '">🎲 Herboristería (CD ' + cd + ')</button>';
  var lasts = timed && hrs > 0 ? ' Tarda <b>' + hrs + ' h de juego</b> (' + esc(rarity) + ').' : '';
  if(dist && !dist.ready){
    k = 'Destilando';
    txt = 'Estará lista a las <b>' + formatGameClock(dist.until) + '</b> (faltan ' + dist.left + ' h de juego).';
    bar = '<div class="alq-bar"><div style="width:' + dist.pct + '%"></div></div>';
    if(isMaster) btns = '<button type="button" class="alq-btn gm" data-action="alchemy-finish-distill" data-id="' + p.id + '">Terminar ya</button>';
  } else if(dist){
    k = 'Destilado listo';
    txt = 'Ya tienes una dosis nueva en el frasco.';
    btns = '<button type="button" class="alq-btn gold" data-action="alchemy-collect-distill" data-id="' + p.id + '">Guardar dosis (+1)</button>';
  } else if(base < 1){
    txt = 'Aún no tenéis la muestra' + (rawMat ? ' (' + esc(rawMat) + ')' : '') + '. Cuando la recojáis, márcala.';
    btns = '<button type="button" class="alq-btn gold" data-action="alchemy-set-base" data-id="' + p.id + '" data-stage="identificado">🌿 Ya tengo la muestra</button>';
  } else if(base < 2){
    txt = 'Tienes la <b>muestra</b>' + (rawMat ? ' (' + esc(rawMat) + ')' : '') + '. Destílala para poder usarla.' + lasts;
    btns = distill;
  } else if(dosis < 1){
    txt = 'No te quedan dosis. Destila otra.' + lasts;
    btns = distill;
  } else if((p.type || "Veneno") === "Poción"){
    txt = 'Bébela (o dásela a alguien) cuando la necesites.';
    btns = '<button type="button" class="alq-btn s" data-action="alchemy-consume-dose" data-id="' + p.id + '">🧪 Beberla (−1)</button>';
  } else if(p.type === "Ungüento"){
    txt = 'Aplícalo cuando lo necesites.';
    btns = '<button type="button" class="alq-btn s" data-action="alchemy-consume-dose" data-id="' + p.id + '">' + icono("cuentagotas", {tam:"s"}) + ' Aplicarlo (−1)</button>';
  } else {
    txt = (eIdx < 3 ? 'Pruébala en un enemigo para descubrir qué hace.' : 'Ya sabéis lo que hace en enemigos.') +
      ' Prepárala en un arma o en munición: cada dosis da ' + poisonUsesPerDose(p) + ' usos.' +
      (showCherk && cIdx < 3 ? ' O tómatela tú para ver su efecto en ti.' : '');
    btns = '<button type="button" class="alq-btn e" data-action="alchemy-open-prepare" data-id="' + p.id + '">' + icono("pocion", {tam:"s"}) + ' Preparar (−1 dosis)</button>' +
      (showCherk ? '<button type="button" class="alq-btn s" data-action="alchemy-consume-dose" data-id="' + p.id + '">' + icono("escudo", {tam:"s"}) + ' Tomarla (−1)</button>' : '');
  }
  return '<div class="alq-next"><span class="alq-k">' + k + '</span><p>' + txt + '</p>' + bar +
    (canEdit && btns ? '<div class="alq-btnrow">' + btns + '</div>' : '') + '</div>';
}

function tplAlquimiaTaller(c, canEdit){
  var html = '<div class="alchemy-controls-card" style="margin-bottom:14px;">' +
    '<h3 style="font-family:var(--font-display);color:var(--gold-light);font-size:1.05rem;margin-bottom:4px;">⚗️ Mesa de Destilación y Extracción Alquímica</h3>' +
    '<p style="font-size:0.78rem;color:var(--ink-dim);line-height:1.4;">' +
      'Procesa materias primas recolectadas en el mundo combinándolas con bases solventes. Las tiradas de extracción utilizan tu habilidad de <b>Herboristería</b>.' +
    '</p>' +
  '</div>';

  var poisonsList = c.poisons || [];
  if(!poisonsList.length){
    html += '<p style="text-align:center;padding:24px;color:var(--ink-faint);">No posees fórmulas en tu grimorio para elaborar.</p>';
    return html;
  }

  // Comprobar bases en inventario
  var basesVeneno = 0;
  (c.inventory || []).forEach(function(it){
    var n = (it.name || '').toLowerCase();
    if(n.includes('base de veneno') || n.includes('bases de veneno')){
      basesVeneno += num(it.qty, 1);
    }
  });

  html += '<div style="margin-bottom:12px;display:flex;align-items:center;gap:10px;background:rgba(0,0,0,0.3);padding:8px 12px;border-radius:var(--radius-sm);border:1px solid var(--line);">' +
    '<span>🎒 <b>Suministros en Mochila:</b></span>' +
    '<span style="color:' + (basesVeneno > 0 ? 'var(--teal-light)' : 'var(--blood-light)') + ';">Bases de veneno: <b>' + basesVeneno + '</b></span>' +
  '</div>';

  html += '<div class="alchemy-workshop-grid">';
  poisonsList.forEach(function(p){
    var cat = typeof ALCHEMY_CATALOG !== "undefined" ? ALCHEMY_CATALOG.find(function(x){
      return (p.catalogId && x.id === p.catalogId) || (x.name.trim().toLowerCase() === (p.name||'').trim().toLowerCase());
    }) : null;

    var cd = cat ? cat.dificultadExtraccion : 10;
    var baseName = cat ? cat.baseRequerida : "Base de veneno";
    var rawName = cat ? cat.rawMaterial : (p.name + " silvestre");

    html += '<div class="alchemy-craft-card">' +
      '<div class="alchemy-craft-header">' +
        '<span style="font-family:var(--font-display);font-weight:700;color:var(--gold-light);font-size:0.95rem;">' + esc(p.name) + '</span>' +
        '<span class="alchemy-stage-badge" style="border-color:var(--gold);color:var(--gold-light);">' + esc(p.type || 'Veneno') + '</span>' +
      '</div>' +

      '<div class="alchemy-craft-ingredients">' +
        '<div class="alchemy-ing-item has-item">' +
          '<span>🌱 Muestra: ' + esc(rawName) + '</span>' +
          '<span>Disponible</span>' +
        '</div>' +
        '<div class="alchemy-ing-item ' + (basesVeneno > 0 ? 'has-item' : 'lacks-item') + '">' +
          '<span>🧪 Solvente: ' + esc(baseName) + '</span>' +
          '<span>' + (basesVeneno > 0 ? 'Listo (' + basesVeneno + ')' : 'Agotado') + '</span>' +
        '</div>' +
        '<div style="margin-top:6px;font-size:0.7rem;color:var(--gold);">' +
          'Dificultad de extracción: <b>CD ' + cd + '</b> (Herboristería)' +
        '</div>' +
      '</div>' +

      '<div style="display:flex;gap:6px;margin-top:auto;">' +
        '<button type="button" class="btn-compact" style="flex:1;" data-action="alchemy-roll-herbalism" data-id="' + p.id + '" data-cd="' + cd + '">🎲 Tirar Extracción</button>' +
        '<button type="button" class="btn-compact btn-solid-gold" style="flex:1;" data-action="alchemy-craft-single" data-id="' + p.id + '" ' + (canEdit ? '' : 'disabled') + '>⚗️ Destilar Vial</button>' +
      '</div>' +
    '</div>';
  });
  html += '</div>';

  return html;
}

function getItemIcon(it){
  if(!it) return "📦";
  if(it.icon) return esc(it.icon);
  var name = (it.name || "").toLowerCase().trim();
  var cat = (it.category || "").toLowerCase().trim();

  // Detección contextual por nombre
  if(/poci[oó]n|vial|frasco|elixir|brebaje|ant[ií]doto|t[oó]nico/i.test(name)) return "🧪";
  if(/espada|daga|cuchillo|hoja|lanza|arma|hacha|guadaña|guja|martillo|kusarigama|sable|mangual|garrote|maza/i.test(name)) return "⚔️";
  if(/arco|cerbatana|flecha|dardo|arp[oó]n|munici[oó]n|ballesta/i.test(name)) return "🏹";
  if(/escudo|rodela|broquel/i.test(name)) return "🛡️";
  if(/cuero|armadura|cota|yelmo|peto|vestimenta|t[uú]nica|muda|botas|guantes|grebas|sombrero|capa/i.test(name)) return "🧥";
  if(/anillo|amuleto|collar|gema|rub[ií]|diamante|zafiro|joya|colgante|pulsera/i.test(name)) return "💍";
  if(/comida|raci[oó]n|raciones|pan|queso|carne|manzana|fruta|cebo|pescado|carne seca/i.test(name)) return "🍖";
  if(/cuerda|antorcha|tienda|pedernal|kit|saco|mochila|cantimplora|caña|gancho|farol/i.test(name)) return "⛺";
  if(/veneno|seta|flor|nen[uú]far|cactus|hierba|ra[ií]z|planta|hongo|ingrediente|hojas/i.test(name)) return "🌿";
  if(/pergamino|mapa|libro|nota|carta|pista|contrato|diario|tomo/i.test(name)) return "📜";
  if(/llave|ganz[uú]a|candado/i.test(name)) return "🗝️";
  if(/piedra|mineral|lingote|hierro|metal|carb[oó]n|plata|oro/i.test(name)) return "🪨";
  if(/moneda|bolsa de monedas|tesoro|cofre/i.test(name)) return "🪙";

  // Detección por categoría
  if(cat.includes("arma")) return "⚔️";
  if(cat.includes("armadura") || cat.includes("vestimenta")) return "🛡️";
  if(cat.includes("accesorio")) return "💍";
  if(cat.includes("consumible") || cat.includes("poción") || cat.includes("veneno")) return "🧪";
  if(cat.includes("supervivencia")) return "⛺";
  if(cat.includes("misi[oó]n") || cat.includes("mision")) return "📜";
  if(cat.includes("material") || cat.includes("ingrediente")) return "🌿";
  if(cat.includes("especial") || cat.includes("único") || cat.includes("unico")) return "⭐";
  return "📦";
}

function matchesInvGroup(it, group){
  if(!group || group === "all") return true;
  var cat = (it.category || "Miscelánea").toLowerCase();
  if(group === "combate"){
    return cat.includes("arma") || cat.includes("vestimenta") || cat.includes("accesorio");
  }
  if(group === "consumibles"){
    return cat.includes("consumible") || cat.includes("poción") || cat.includes("pocion") || cat.includes("veneno") || cat.includes("ungüento");
  }
  if(group === "aventura"){
    return cat.includes("supervivencia") || cat.includes("misión") || cat.includes("mision") || cat.includes("material") || cat.includes("ingrediente");
  }
  if(group === "botin"){
    return cat.includes("miscelánea") || cat.includes("miscelanea") || cat.includes("especial") || cat.includes("único") || cat.includes("unico") ||
      (!matchesInvGroup(it, "combate") && !matchesInvGroup(it, "consumibles") && !matchesInvGroup(it, "aventura"));
  }
  return true;
}

function tplCoinImg(part, cls){
  var c = cls ? ' class="' + cls + '"' : '';
  return '<picture><source srcset="images/monedas/moneda-' + part + '-96.webp" type="image/webp"><img src="images/monedas/moneda-' + part + '-96.png" alt=""' + c + ' loading="lazy" width="96" height="96"></picture>';
}

// Dinero: un selector de cantidad arriba y, por moneda, solo un botón de restar y otro de sumar
var moneyStepSel = 1;
function tplMoneyAmounts(){
  return '<div class="k-seg money-amounts" role="group" aria-label="Cantidad a mover"><span class="money-amounts-lbl">De</span>'+
    [1, 5, 10, 25].map(function(n){ return '<button type="button" class="k-seg-btn'+(n === moneyStepSel ? ' active' : '')+'" data-action="money-amount" data-val="'+n+'" aria-pressed="'+(n === moneyStepSel)+'">'+n+'</button>'; }).join('')+
  '</div>';
}

function tplMoneySteps(part, cur){
  var name = part === "oro" ? "oro" : (part === "gremio" ? "gremio" : "plata");
  var n = moneyStepSel;
  return '<button type="button" class="money-btn minus" data-action="money-step" data-part="'+part+'" data-delta="-'+n+'" aria-label="Quitar de '+name+'"'+(moneyInt(cur) <= 0 ? ' disabled' : '')+'>−'+n+'</button>'+
    '<button type="button" class="money-btn plus" data-action="money-step" data-part="'+part+'" data-delta="'+n+'" aria-label="Añadir de '+name+'">+'+n+'</button>';
}

// Últimos movimientos de dinero (los lee el dueño de la ficha y el máster)
function tplMoneyLog(c){
  if(!c || !c.db_id || typeof getMoneyLog !== "function") return '';
  var rows = getMoneyLog(c);
  if(!rows || !rows.length) return '<div class="money-log" data-money-log="'+c.db_id+'"></div>';
  return '<div class="money-log" data-money-log="'+c.db_id+'">'+tplMoneyLogRows(rows)+'</div>';
}

function tplMoneyLogRows(rows){
  if(!rows || !rows.length) return '';
  return '<details class="money-details"><summary class="money-log-title">Últimos movimientos</summary>'+
    rows.slice(0, 5).map(function(r){
      var parts = [];
      if(r.delta_oro) parts.push(tplCoinImg("oro", "money-log-coin") + ' ' + (r.delta_oro > 0 ? '+' : '−') + esc(Math.abs(r.delta_oro)));
      if(r.delta_plata) parts.push(tplCoinImg("plata", "money-log-coin") + ' ' + (r.delta_plata > 0 ? '+' : '−') + esc(Math.abs(r.delta_plata)));
      if(r.delta_gremio) parts.push(tplCoinImg("gremio", "money-log-coin") + ' ' + (r.delta_gremio > 0 ? '+' : '−') + esc(Math.abs(r.delta_gremio)));
      var d = r.created_at ? new Date(r.created_at) : null;
      var when = d ? d.toLocaleDateString("es-ES", { day:"2-digit", month:"2-digit" }) + ' ' + d.toLocaleTimeString("es-ES", { hour:"2-digit", minute:"2-digit" }) : '';
      var who = String(r.actor_name || '').split('@')[0];
      var totalDelta = (r.delta_oro || 0) + (r.delta_plata || 0) + (r.delta_gremio || 0);
      return '<div class="money-log-row"><span class="money-log-delta'+(totalDelta < 0 ? ' neg' : '')+'">'+parts.join(' · ')+'</span>'+
        '<span class="money-log-meta">'+esc(who)+(who && when ? ' · ' : '')+esc(when)+'</span></div>';
    }).join('')+'</details>';
}

function tplInventario(c){
  c.money = c.money || { oro: 0, plata: 0, gremio: 0 };
  c.inventory = c.inventory || [];
  c.inventory.forEach(function(it){
    if(!it.category) it.category = "Miscelánea";
  });
  var canEdit = canEditChar(c);

  var viewMode = (state && state.invView) || (function(){
    try { return localStorage.getItem("krysalis_inv_view"); } catch(e){ return null; }
  })() || "grid";

  var html = '';
  if(!canEdit && currentUser){
    html += '<div class="spectator-banner">'+
      '<span>👁️ Modo Espectador: Solo lectura. No puedes modificar el dinero ni los objetos del inventario en esta ficha.</span>'+
    '</div>';
  }

  // Sección de Dinero (si la partida aún no tiene la función del dinero, solo se mira)
  var mEdit = canEdit && !moneyRpcMissing;
  function moneyRowHtml(part, label){
    return '<div class="money-row-c '+part+'">'+tplCoinImg(part, "money-coin")+
      '<div class="money-info"><span class="money-name">'+label+'</span><input type="number" class="money-val" data-bind="money.'+part+'" data-last-val="'+moneyInt(c.money[part])+'" value="'+moneyInt(c.money[part])+'" '+(mEdit?'':'readonly')+'></div>'+
      (mEdit ? tplMoneySteps(part, c.money[part]) : '')+'</div>';
  }
  html += '<div class="section'+(c.isNPC?' gm-section':'')+'"><div class="section-title"><span>Dinero</span></div>'+
    (mEdit ? tplMoneyAmounts() : '')+
    '<div class="money-coins">'+moneyRowHtml("oro", "Oro")+moneyRowHtml("plata", "Plata")+moneyRowHtml("gremio", "Gremio")+'</div>'+
    (canEdit && moneyRpcMissing ? '<p class="settings-note">El dinero no se puede cambiar hasta que se actualice la partida.</p>' : '')+tplMoneyLog(c)+'</div>';
  html += tplPoisonLoadout(c, canEdit);

  var categories = typeof INVENTORY_CATEGORIES !== "undefined" ? INVENTORY_CATEGORIES : [
    "Armas", "Armadura y vestimenta", "Accesorios", "Consumibles", "Supervivencia", "Objetos de misión", "Materiales/Ingredientes", "Objetos especiales/únicos", "Miscelánea"
  ];

  var invQ = String(invSearch || "").trim().toLowerCase();
  function invMatchesSearch(it){
    if(!invQ) return true;
    return ((it.name || "") + " " + (it.desc || it.notes || "") + " " + (it.category || "")).toLowerCase().indexOf(invQ) !== -1;
  }
  var invSearchHtml = '<div class="inv-search-row"><input type="text" class="inv-search-input" id="invSearchInput" value="'+esc(invSearch)+'" placeholder="Buscar objeto" data-action="search-inventory"></div>';

  // Cabecera con selector de vista (Mochila Grid Beta vs Lista Clásica)
  var viewSwitcherHtml = '<div class="skills-view-switcher" role="group" aria-label="Modo de vista de inventario">'+
    '<button type="button" class="skills-view-btn '+(viewMode==="grid"?"active":"")+'" data-action="set-inv-view" data-val="grid" title="Cuadrícula visual inmersiva de mochila">'+
      '<span class="view-btn-icon">🎒</span> Mochila Grid'+
    '</button>'+
    '<button type="button" class="skills-view-btn '+(viewMode==="list"?"active":"")+'" data-action="set-inv-view" data-val="list" title="Vista tradicional en lista">'+
      '<span class="view-btn-icon">📋</span> Lista Clásica'+
    '</button>'+
  '</div>';

  html += '<div class="section'+(c.isNPC?' gm-section':'')+'">'+
    '<div class="skills-tab-header">'+
      '<div class="section-title" style="margin-bottom:0;"><span>Equipo e Inventario</span></div>'+
      viewSwitcherHtml+
    '</div>';

  if(viewMode === "grid"){
    // === VISTA MOCHILA CUADRÍCULA (GRID SYSTEM) ===
    var currentGroup = (state && state.invGroupFilter) || "all";

    var groupCounts = { all: c.inventory.length, combate: 0, consumibles: 0, aventura: 0, botin: 0 };
    c.inventory.forEach(function(it){
      if(matchesInvGroup(it, "combate")) groupCounts.combate++;
      if(matchesInvGroup(it, "consumibles")) groupCounts.consumibles++;
      if(matchesInvGroup(it, "aventura")) groupCounts.aventura++;
      if(matchesInvGroup(it, "botin")) groupCounts.botin++;
    });

    var groupsDef = [
      { id: "all", label: "Todo", icon: "🎒", count: groupCounts.all },
      { id: "combate", label: "Combate", icon: "⚔️", count: groupCounts.combate },
      { id: "consumibles", label: "Consumibles", icon: "🧪", count: groupCounts.consumibles },
      { id: "aventura", label: "Aventura", icon: "⛺", count: groupCounts.aventura },
      { id: "botin", label: "Botín / Varios", icon: "💎", count: groupCounts.botin }
    ];

    var filteredItems = c.inventory.filter(function(it){
      return matchesInvGroup(it, currentGroup) && invMatchesSearch(it);
    });

    html += '<div class="backpack-container">'+
      '<div class="backpack-header-bar">'+
        '<div class="backpack-capacity-tag">🎒 <span>Objetos guardados: <b>'+c.inventory.length+'</b></span></div>'+
        (canEdit ? '<button class="btn-solid-gold" data-action="add-inventory-slot" style="padding:4px 12px;font-size:0.75rem;">+ Añadir Objeto</button>' : '')+
      '</div>'+
      invSearchHtml+
      '<div class="backpack-tabs-bar k-seg k-seg-scroll">';

    groupsDef.forEach(function(g){
      var isActive = (currentGroup === g.id);
      html += '<button type="button" class="backpack-tab-btn k-seg-btn '+(isActive?'active':'')+'" data-action="set-inv-group" data-val="'+g.id+'">'+
        '<span>'+g.icon+'</span> <span>'+g.label+'</span> <span class="backpack-tab-count">'+g.count+'</span>'+
      '</button>';
    });

    html += '</div>';

    // Grid de ranuras (slots)
    html += '<div class="backpack-grid">';

    if(filteredItems.length === 0){
      html += '<div class="backpack-empty-state">'+
        '<div class="backpack-empty-icon">🎒</div>'+
        '<div class="backpack-empty-msg">'+(invQ ? 'Ningún objeto coincide con la búsqueda.' : currentGroup === "all" ? 'La mochila está vacía.' : 'No hay objetos en esta categoría.')+'</div>'+
        (canEdit ? '<button type="button" class="btn-solid-gold" data-action="add-inventory-slot" style="margin-top:6px;font-size:0.76rem;padding:6px 14px;">+ Añadir Primer Objeto</button>' : '')+
      '</div>';
    } else {
      // Renderizado de objetos ocupados
      filteredItems.forEach(function(it){
        var icon = getItemIcon(it);
        var itCat = it.category || "Miscelánea";
        var qty = num(it.qty, 1);
        var qtyBadge = qty > 1 ? '<span class="slot-qty-badge">x'+qty+'</span>' : '';
        var descText = it.desc || it.notes || '';

        html += '<div class="backpack-slot occupied" data-action="inspect-inv-item" data-id="'+it.id+'" data-juice-card="i'+it.id+'" role="button" tabindex="0" title="'+esc(it.name)+'">'+
          '<div class="slot-icon">'+iconoDeEmoji(icon, "objetos", {tam:"m"})+'</div>'+
          '<div class="slot-name-label">'+esc(it.name || 'Objeto')+'</div>'+
          qtyBadge+
          '<div class="slot-tooltip">'+
            '<div class="tooltip-header">'+
              '<span class="tooltip-icon">'+icon+'</span>'+
              '<span class="tooltip-name">'+esc(it.name || 'Objeto sin nombre')+'</span>'+
            '</div>'+
            '<div class="tooltip-meta">'+
              '<span class="tooltip-cat-pill">'+esc(itCat)+'</span>'+
              '<span>Cant: '+qty+'</span>'+
            '</div>'+
            (descText ? '<div class="tooltip-desc">'+esc(descText)+'</div>' : '<div class="tooltip-desc" style="opacity:0.6;">Sin descripción</div>')+
            (canEdit ? '<div class="tooltip-hint">Toca o haz clic para editar / gestionar</div>' : '')+
          '</div>'+
        '</div>';
      });

      // Ranura única para añadir nuevo objeto si el usuario puede editar
      if(canEdit){
        html += '<div class="backpack-slot add-slot" data-action="add-inventory-slot" role="button" tabindex="0" title="Añadir nuevo objeto">'+
          '<span class="add-slot-plus">+</span>'+
          '<span class="add-slot-label">Añadir</span>'+
        '</div>';
      }
    }

    html += '</div></div>'; // Cierre .backpack-grid y .backpack-container

  } else {
    // === VISTA LISTA CLÁSICA ===
    var currentCat = state.invCategoryFilter || "all";

    var catCounts = {};
    categories.forEach(function(cat){ catCounts[cat] = 0; });
    c.inventory.forEach(function(it){
      var cat = it.category || "Miscelánea";
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    });

    html += invSearchHtml+'<div class="inv-cat-chips" role="group" aria-label="Filtrar por categoría">'+
      '<button type="button" class="inv-cat-chip'+(currentCat==="all"?' active':'')+'" data-action="filter-inventory-category" data-val="all">Todo<span class="inv-cat-count">'+c.inventory.length+'</span></button>'+
      categories.filter(function(cat){ return catCounts[cat] > 0 || currentCat === cat; }).map(function(cat){
        return '<button type="button" class="inv-cat-chip'+(currentCat===cat?' active':'')+'" data-action="filter-inventory-category" data-val="'+esc(cat)+'">'+esc(cat)+'<span class="inv-cat-count">'+(catCounts[cat]||0)+'</span></button>';
      }).join('')+
    '</div>';

    var filteredListItems = c.inventory.filter(function(it){
      if(!invMatchesSearch(it)) return false;
      if(currentCat === "all") return true;
      return (it.category || "Miscelánea") === currentCat;
    });

    if(filteredListItems.length === 0){
      html += '<div style="font-size:.78rem;color:var(--ink-dim);font-style:italic;padding:14px;text-align:center;background:var(--bg-elev);border:1px dashed var(--line);border-radius:6px;margin-bottom:10px;">'+
        (invQ ? 'Ningún objeto coincide con la búsqueda.' : currentCat === "all" ? 'El inventario está vacío.' : 'No hay objetos registrados en la categoría "'+currentCat+'".')+
      '</div>';
    } else {
      filteredListItems.forEach(function(it){
        var itCat = it.category || "Miscelánea";
        var icon = getItemIcon(it);
        html += '<div class="list-row inv-row" data-juice-card="i'+it.id+'">'+
          '<button type="button" class="inv-row-icon-btn" data-action="inspect-inv-item" data-id="'+it.id+'" title="Ver / editar detalle e icono de '+esc(it.name)+'">'+iconoDeEmoji(icon, "objetos", {tam:"m"})+'</button>'+
          '<input type="text" placeholder="Nombre del objeto" data-bind="inventory.'+it.id+'.name" value="'+esc(it.name)+'" '+(canEdit?'':'readonly')+'>'+
          '<select class="inv-cat-select" data-bind="inventory.'+it.id+'.category" aria-label="Categoría" '+(canEdit?'':'disabled')+'>'+
            categories.map(function(cat){
              return '<option value="'+cat+'" '+(itCat===cat?'selected':'')+'>'+cat+'</option>';
            }).join('')+
          '</select>'+
          '<input type="number" placeholder="Cant." data-bind="inventory.'+it.id+'.qty" value="'+num(it.qty,1)+'" '+(canEdit?'':'readonly')+'>'+
          (canEdit ? '<button class="row-del" data-action="del-inventory" data-id="'+it.id+'" aria-label="Eliminar objeto">✕</button>' : '<div></div>')+
        '</div>';
      });
    }

    if(canEdit){
      var addBtnLabel = (currentCat !== "all") ? ('+ Añadir objeto a ' + currentCat) : '+ Añadir objeto';
      html += '<button class="btn-compact" style="width:100%;margin-top:8px;" data-action="add-inventory">'+addBtnLabel+'</button>';
    }
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

// Rasgos como lista: si aún no hay rasgosList, se sacan del texto viejo (una línea por rasgo), que se conserva tal cual
function getSummonTraitList(s){
  if(Array.isArray(s.rasgosList)) return s.rasgosList.slice();
  var txt = splitSummonHabilidades(s).rasgos || "";
  return String(txt).split(/\n+/).map(function(l){ return l.replace(/^\s*[-•*·]+\s*/, "").trim(); }).filter(Boolean);
}

// Vida: "vida" es el máximo; "vidaActual" la que le queda (si no existe, está entera)
function getSummonHp(s){
  var max = num(s.vida, 0);
  var cur = (s.vidaActual === undefined || s.vidaActual === null || s.vidaActual === "") ? max : num(s.vidaActual, max);
  return { cur: Math.max(0, Math.min(max, cur)), max: max };
}

function isSummonCombatRoll(label){
  var l = String(label || "").toLowerCase();
  return /mel[eé]|ataque|mordisco|garra|picotazo|esquiv|evasi|da[ñn]o|defens|bloque|embest|zarpazo|disparo|punter/.test(l);
}

// Entrenamientos de la pestaña Entrenamiento enlazados a este familiar
function getSummonTrainings(c, s){
  return (c.trainings || []).filter(function(t){ return t.linkedId === s.id || t.linkedId === "summon:" + s.id; });
}

function getActiveSummon(c){
  var list = c.summons || [];
  var map = state._summonActive || {};
  return list.find(function(x){ return x.id === map[c.id]; }) || list[0] || null;
}

function tplInvocaciones(c){
  c.summons = c.summons || [];
  var canEdit = canEditChar(c);
  var editing = !!(state._summonEdit && canEdit);
  var active = getActiveSummon(c);
  var html = '';

  if(!canEdit && currentUser){
    html += '<div class="spectator-banner">' +
      '<span>👁️ Modo Espectador: Solo lectura. No puedes modificar ni gestionar invocaciones en esta ficha.</span>' +
    '</div>';
  }

  html += '<div class="section' + (c.isNPC ? ' gm-section' : '') + '">';
  html += '<div class="section-title">';
  html += '<span>Invocaciones y familiares</span>';
  if(canEdit && c.summons.length > 0){
    html += '<button type="button" class="btn-compact" data-action="toggle-summon-edit">' + (editing ? '✓ Listo' : '✎ Editar') + '</button>';
  }
  html += '</div>';

  if(c.summons.length === 0){
    html += '<div class="summon-empty">No hay invocaciones ni familiares registrados.</div>';
    if(canEdit){
      html += '<button type="button" class="btn-compact summon-btn-add-initial" data-action="add-summon">+ Nuevo</button>';
    }
    html += '</div>';
    return html;
  }

  html += '<div class="summon-tabs" role="tablist">';
  c.summons.forEach(function(s){
    var isAct = active && (s.id === active.id);
    var miniStyle = s.image ? (' style="background-image:url(\'' + esc(safeUrl(s.image)) + '\');"') : '';
    html += '<button type="button" class="summon-tab" role="tab" aria-selected="' + (isAct ? 'true' : 'false') + '" data-action="select-summon" data-id="' + s.id + '">';
    html += '<span class="summon-tab-mini"' + miniStyle + '>' + (s.image ? '' : '🐾') + '</span>';
    html += '<span class="summon-tab-name">' + esc(s.name || 'Sin nombre') + '</span>';
    html += '</button>';
  });
  if(canEdit){
    html += '<button type="button" class="summon-tab summon-tab-add" data-action="add-summon">+ Nuevo</button>';
  }
  html += '</div>';

  if(!active){
    html += '</div>';
    return html;
  }

  var s = active;
  var imgStyle = s.image ? (' style="background-image:url(\'' + esc(safeUrl(s.image)) + '\');"') : '';

  html += '<div class="creature-card summon-card" data-juice-card="s' + s.id + '">';

  // 1. Cabecera
  html += '<div class="summon-header">';
  if(canEdit){
    html += '<button type="button" class="summon-avatar-btn"' + imgStyle + ' data-action="summon-photo-menu" data-id="' + s.id + '" aria-label="Cambiar foto">' +
      (s.image ? '' : '🐾') +
      '<span class="summon-cam-badge">📷</span>' +
    '</button>';
  } else {
    html += '<div class="summon-avatar-img"' + imgStyle + '>' +
      (s.image ? '' : '🐾') +
    '</div>';
  }

  html += '<div class="summon-header-info">';
  if(editing){
    html += '<input type="text" class="summon-name-input" data-bind="summons.' + s.id + '.name" value="' + esc(s.name || '') + '" placeholder="Nombre">' +
      '<input type="text" class="summon-kind-input" data-bind="summons.' + s.id + '.tipo" value="' + esc(s.tipo || '') + '" placeholder="Tipo (ej: Hurón)">';
  } else {
    var tipoText = s.tipo || ('Familiar de ' + (c.name || ''));
    html += '<h2 class="summon-name-title">' + esc(s.name || 'Sin nombre') + '</h2>' +
      '<div class="summon-kind-title">' + esc(tipoText) + '</div>';
  }
  html += '</div>';
  html += '</div>';

  // 2. Vida
  var hp = getSummonHp(s);
  var hpPct = hp.max > 0 ? Math.min(100, Math.max(0, Math.round((hp.cur / hp.max) * 100))) : 0;
  html += '<div class="summon-hp-wrap">' +
    '<div class="summon-hp-header">' +
      '<span class="summon-hp-label">Vida</span>' +
      '<span class="summon-hp-values">' + hp.cur + ' / ' + hp.max + '</span>' +
    '</div>' +
    '<div class="summon-hp-bar"><i style="width:' + hpPct + '%;"></i></div>';
  if(canEdit){
    html += '<div class="summon-hp-grid">' +
      '<button type="button" class="btn-compact summon-hp-btn" data-action="summon-hp" data-id="' + s.id + '" data-delta="-5">−5</button>' +
      '<button type="button" class="btn-compact summon-hp-btn" data-action="summon-hp" data-id="' + s.id + '" data-delta="-1">−1</button>' +
      '<button type="button" class="btn-compact summon-hp-btn" data-action="summon-hp" data-id="' + s.id + '" data-delta="1">+1</button>' +
      '<button type="button" class="btn-compact summon-hp-btn" data-action="summon-hp" data-id="' + s.id + '" data-delta="5">+5</button>' +
    '</div>';
  }
  html += '</div>';

  // 3. Estadísticas
  var movN = s.casillasMovimiento || (s.movilidad ? (s.movilidad.match(/\d+/)?s.movilidad.match(/\d+/)[0]:'6') : '6');
  if(editing){
    html += '<div class="creature-grid summon-edit-grid">' +
      creatureField("Vida máx.", "summons." + s.id + ".vida", s.vida, false) +
      creatureField("Defensa", "summons." + s.id + ".defensa", s.defensa, false) +
      creatureField("Absorción", "summons." + s.id + ".absorcion", s.absorcion, false) +
      creatureField("Daño", "summons." + s.id + ".dano", s.dano, false) +
      creatureField("Inteligencia", "summons." + s.id + ".inteligencia", s.inteligencia, false) +
      '<div class="creature-field beast-mobility-cell">' +
        '<label>Movilidad (Casillas)</label>' +
        '<button type="button" class="beast-mov-btn" data-action="pick-summon-mov" data-id="' + s.id + '" title="Casillas de movimiento">' +
          '<span class="beast-mov-label">🏃 <strong>' + esc(movN) + '</strong> casillas</span>' +
          (s.movilidad && s.movilidad.includes('(') ? (' <span class="beast-terrain-pill">' + esc(s.movilidad.slice(s.movilidad.indexOf('('))) + '</span>') : '') +
          '<span class="beast-mov-chevron">▾</span>' +
        '</button>' +
      '</div>' +
    '</div>';
  } else {
    html += '<div class="summon-chips-row">';
    if(s.defensa !== "" && s.defensa !== undefined && s.defensa !== null){
      html += '<span class="summon-chip">🛡️ Def <b>' + esc(s.defensa) + '</b></span>';
    }
    if(s.absorcion !== "" && s.absorcion !== undefined && s.absorcion !== null){
      html += '<span class="summon-chip">🧱 Abs <b>' + esc(s.absorcion) + '</b></span>';
    }
    if(s.dano !== "" && s.dano !== undefined && s.dano !== null){
      html += '<span class="summon-chip">🗡️ <b>' + esc(s.dano) + '</b></span>';
    }
    if(canEdit){
      html += '<button type="button" class="summon-chip summon-chip-btn" data-action="pick-summon-mov" data-id="' + s.id + '" title="Casillas de movimiento">🏃 <b>' + esc(movN) + '</b> <small>casillas</small></button>';
    } else {
      html += '<span class="summon-chip">🏃 <b>' + esc(movN) + '</b> <small>casillas</small></span>';
    }
    if(s.inteligencia !== "" && s.inteligencia !== undefined && s.inteligencia !== null){
      html += '<span class="summon-chip">🧠 Int <b>' + esc(s.inteligencia) + '</b></span>';
    }
    html += '</div>';
  }

  // 4. Bloque Tiradas
  var split = splitSummonHabilidades(s);
  var rollList = getSummonRollList(split.tiradas);
  var combatRolls = [];
  var skillRolls = [];

  rollList.forEach(function(rp, idx){
    var entry = { item: rp, originalIndex: idx };
    if(isSummonCombatRoll(rp.label)){
      combatRolls.push(entry);
    } else {
      skillRolls.push(entry);
    }
  });

  if(!editing && s.dano && /(\d*d\d+)/i.test(s.dano)){
    var hasDano = rollList.some(function(rp){
      var lbl = rp.label.toLowerCase();
      return lbl.indexOf("daño") !== -1 || lbl.indexOf("dano") !== -1;
    });
    if(!hasDano){
      combatRolls.push({
        item: { raw: "Daño " + s.dano, label: "Daño", formula: s.dano, icon: "🩸" },
        originalIndex: -1
      });
    }
  }

  html += '<div class="summon-block summon-rolls-block">' +
    '<div class="summon-block-header">' +
      '<span class="summon-block-title">⚔️ Tiradas</span>' +
      (editing ? '<button type="button" class="btn-compact" data-action="add-summon-skill" data-id="' + s.id + '">+ Añadir</button>' : '') +
    '</div>';

  if(combatRolls.length === 0 && skillRolls.length === 0){
    html += '<div class="summon-empty-text">Sin tiradas registradas.</div>';
  } else {
    if(combatRolls.length > 0){
      html += '<div class="summon-group-label">Combate</div>';
      html += '<div class="summon-rolls-grid">';
      combatRolls.forEach(function(r){
        var it = r.item;
        if(editing){
          html += '<div class="summon-roll-box-edit">' +
            '<input type="text" class="summon-skill-input-name" data-action="change-summon-skill-name" data-summon-id="' + s.id + '" data-index="' + r.originalIndex + '" value="' + esc(it.label) + '" placeholder="Nombre">' +
            '<input type="text" class="summon-skill-input-formula" data-action="change-summon-skill-formula" data-summon-id="' + s.id + '" data-index="' + r.originalIndex + '" value="' + esc(it.formula) + '" placeholder="Fórmula">' +
            '<button type="button" class="row-del summon-roll-del" data-action="del-summon-skill" data-summon-id="' + s.id + '" data-index="' + r.originalIndex + '" aria-label="Quitar">✕</button>' +
          '</div>';
        } else {
          var fStr = it.formula || it.raw;
          html += '<button type="button" class="summon-roll-btn" data-action="roll-summon-action" data-summon-name="' + esc(s.name || 'Invocación') + '" data-action-name="' + esc(it.label) + '" data-formula="' + esc(fStr) + '">' +
            '<span class="summon-roll-name">' + esc(it.label) + '</span>' +
            (it.formula ? ('<span class="pill-formula">' + esc(it.formula) + '</span>') : '') +
          '</button>';
        }
      });
      html += '</div>';
    }

    if(skillRolls.length > 0){
      html += '<div class="summon-group-label">Habilidades</div>';
      html += '<div class="summon-rolls-grid">';
      skillRolls.forEach(function(r){
        var it = r.item;
        if(editing){
          html += '<div class="summon-roll-box-edit">' +
            '<input type="text" class="summon-skill-input-name" data-action="change-summon-skill-name" data-summon-id="' + s.id + '" data-index="' + r.originalIndex + '" value="' + esc(it.label) + '" placeholder="Nombre">' +
            '<input type="text" class="summon-skill-input-formula" data-action="change-summon-skill-formula" data-summon-id="' + s.id + '" data-index="' + r.originalIndex + '" value="' + esc(it.formula) + '" placeholder="Fórmula">' +
            '<button type="button" class="row-del summon-roll-del" data-action="del-summon-skill" data-summon-id="' + s.id + '" data-index="' + r.originalIndex + '" aria-label="Quitar">✕</button>' +
          '</div>';
        } else {
          var fStr = it.formula || it.raw;
          html += '<button type="button" class="summon-roll-btn" data-action="roll-summon-action" data-summon-name="' + esc(s.name || 'Invocación') + '" data-action-name="' + esc(it.label) + '" data-formula="' + esc(fStr) + '">' +
            '<span class="summon-roll-name">' + esc(it.label) + '</span>' +
            (it.formula ? ('<span class="pill-formula">' + esc(it.formula) + '</span>') : '') +
          '</button>';
        }
      });
      html += '</div>';
    }
  }
  html += '</div>';

  // 5. Bloque Rasgos y pasivas
  var traits = getSummonTraitList(s);
  html += '<div class="summon-block summon-traits-block">' +
    '<div class="summon-block-header">' +
      '<span class="summon-block-title">Rasgos y pasivas</span>' +
    '</div>';

  if(traits.length === 0){
    html += '<div class="summon-empty-text">Sin rasgos registrados.</div>';
  } else {
    html += '<ul class="summon-list">';
    traits.forEach(function(t, tIdx){
      html += '<li>' +
        '<span class="summon-list-text">' + esc(t) + '</span>' +
        (editing ? ('<button type="button" class="row-del" data-action="del-summon-trait" data-id="' + s.id + '" data-index="' + tIdx + '" aria-label="Quitar">✕</button>') : '') +
      '</li>';
    });
    html += '</ul>';
  }

  if(editing){
    html += '<div class="summon-add-row">' +
      '<input type="text" id="summonNewTrait-' + s.id + '" placeholder="Nuevo rasgo">' +
      '<button type="button" class="btn-compact" data-action="add-summon-trait" data-id="' + s.id + '">Añadir</button>' +
    '</div>';
  }
  html += '</div>';

  // 6. Bloque Aprendizaje
  var learnedList = Array.isArray(s.aprendido) ? s.aprendido : [];
  var learningList = Array.isArray(s.learning) ? s.learning : [];

  html += '<div class="summon-block summon-learned-block">' +
    '<div class="summon-block-header">' +
      '<span class="summon-block-title">Aprendizaje</span>' +
      (canEdit ? ('<button type="button" class="btn-compact" data-action="toggle-summon-teach" data-id="' + s.id + '">📖 Enseñar</button>') : '') +
    '</div>';

  if(canEdit && state._summonTeachOpen === s.id){
    html += '<div class="summon-add-row">' +
      '<input type="text" id="summonTeachText-' + s.id + '" maxlength="80" placeholder="¿Qué le enseñas?">' +
    '</div>' +
    '<div class="summon-add-row">' +
      '<input type="text" id="summonTeachNote-' + s.id + '" maxlength="200" placeholder="Nota (opcional)">' +
    '</div>' +
    '<div class="summon-add-row">' +
      '<button type="button" class="btn-solid-gold" data-action="save-summon-teach" data-id="' + s.id + '">Guardar</button>' +
      '<button type="button" class="btn-compact" data-action="toggle-summon-teach" data-id="' + s.id + '">Cancelar</button>' +
    '</div>';
  }

  if(learningList.length > 0){
    html += '<div class="summon-group-label">Aprendiendo</div>' +
      '<ul class="summon-list">';
    learningList.forEach(function(item, idx){
      var itemId = (item && item.id) ? item.id : idx;
      var itemTxt = (item && item.texto) ? item.texto : String(item || '');
      var itemNota = (item && item.nota) ? item.nota : '';
      var itemDia = (item && item.dia !== undefined && item.dia !== null && item.dia !== '') ? item.dia : null;
      var itemPor = (item && item.por) ? item.por : '';
      var diaText = '';
      if(itemDia !== null && itemDia !== undefined && itemDia !== ''){
        diaText = String(itemDia).toLowerCase().indexOf('d') === 0 ? String(itemDia) : ('Día ' + itemDia);
      }

      html += '<li>' +
        '<div class="summon-list-body">' +
          '<div class="summon-list-text">' + esc(itemTxt) + '</div>' +
          (itemPor ? ('<div class="summon-list-by">le enseña ' + esc(itemPor) + '</div>') : '') +
          (itemNota ? ('<div class="summon-list-by">' + esc(itemNota) + '</div>') : '') +
          // Día y botones en otra fila para que el texto no se estreche en móvil
          ((diaText || canEdit) ? ('<div class="summon-add-row">' +
            (diaText ? ('<span class="summon-list-dia">' + esc(diaText) + '</span>') : '') +
            (canEdit ? (
              '<button type="button" class="btn-compact" data-action="learned-summon-teach" data-id="' + s.id + '" data-lid="' + esc(itemId) + '">✓ Ya lo sabe</button>' +
              '<button type="button" class="row-del" data-action="del-summon-teach" data-id="' + s.id + '" data-lid="' + esc(itemId) + '" aria-label="Quitar">✕</button>'
            ) : '') +
          '</div>') : '') +
        '</div>' +
      '</li>';
    });
    html += '</ul>';
  }

  html += '<div class="summon-group-label">Aprendido</div>';

  if(learnedList.length === 0){
    html += '<div class="summon-empty-text">Todavía no ha aprendido nada.</div>';
  } else {
    html += '<ul class="summon-list">';
    learnedList.forEach(function(l, lIdx){
      var lId = (l && l.id) ? l.id : lIdx;
      var lTxt = (l && l.texto) ? l.texto : (Array.isArray(l) ? l[0] : String(l || ''));
      var lDia = (l && l.dia !== undefined && l.dia !== null && l.dia !== '') ? l.dia : (Array.isArray(l) ? l[1] : null);
      var lPor = (l && l.por) ? l.por : (Array.isArray(l) ? l[2] : '');
      var diaText = '';
      if(lDia !== null && lDia !== undefined && lDia !== ''){
        diaText = String(lDia).toLowerCase().indexOf('d') === 0 ? String(lDia) : ('Día ' + lDia);
      }

      html += '<li>' +
        '<div class="summon-list-body">' +
          '<div class="summon-list-text">' + esc(lTxt) + '</div>' +
          (lPor ? ('<div class="summon-list-by">apuntado por ' + esc(lPor) + '</div>') : '') +
        '</div>' +
        (diaText ? ('<span class="summon-list-dia">' + esc(diaText) + '</span>') : '') +
        (canEdit ? ('<button type="button" class="row-del" data-action="del-summon-learned" data-id="' + s.id + '" data-lid="' + esc(lId) + '" aria-label="Quitar">✕</button>') : '') +
      '</li>';
    });
    html += '</ul>';
  }

  if(canEdit){
    html += '<div class="summon-add-row">' +
      '<input type="text" id="summonNewLearn-' + s.id + '" placeholder="Qué ha aprendido…">' +
      '<button type="button" class="btn-solid-gold" data-action="add-summon-learned" data-id="' + s.id + '">Apuntar</button>' +
    '</div>';
  }
  html += '</div>';

  // 7. Notas
  if(editing){
    html += '<div class="summon-block summon-notes-block">' +
      '<div class="summon-block-header">' +
        '<span class="summon-block-title">Notas</span>' +
      '</div>' +
      '<div class="summon-notes-box">' +
        '<textarea class="summon-notes-textarea" placeholder="Notas sobre el familiar..." data-bind="summons.' + s.id + '.notas">' + esc(s.notas || '') + '</textarea>' +
      '</div>' +
    '</div>';
  } else if(s.notas && s.notas.trim()){
    html += '<div class="summon-block summon-notes-block">' +
      '<div class="summon-block-header">' +
        '<span class="summon-block-title">Notas</span>' +
      '</div>' +
      '<div class="summon-notes-box">' +
        '<div class="summon-notes-text">' + esc(s.notas) + '</div>' +
      '</div>' +
    '</div>';
  }

  // 8. Borrar familiar (solo en modo Editar)
  if(editing){
    var delName = s.name || 'este familiar';
    if(state._summonConfirmDel === s.id){
      html += '<div class="summon-confirm-del-box">' +
        '<div class="summon-confirm-del-text">¿Borrar a ' + esc(delName) + '? No se puede deshacer.</div>' +
        '<div class="summon-confirm-del-actions">' +
          '<button type="button" class="btn-compact summon-btn-danger" data-action="del-summon" data-id="' + s.id + '">Sí, borrar</button>' +
          '<button type="button" class="btn-compact" data-action="cancel-del-summon">Cancelar</button>' +
        '</div>' +
      '</div>';
    } else {
      html += '<button type="button" class="btn-compact summon-btn-danger" data-action="ask-del-summon" data-id="' + s.id + '">Borrar a ' + esc(delName) + '</button>';
    }
  }

  html += '</div>';
  html += '</div>';

  // 9. Menú de foto (modal inferior fijo)
  if(canEdit && state._summonPhotoMenu === s.id){
    html += '<div class="summon-photo-backdrop" data-action="close-summon-photo-menu"></div>' +
      '<div class="summon-photo-sheet" role="dialog" aria-label="Foto">' +
        '<button type="button" class="btn-compact summon-sheet-btn" data-action="upload-summon-img" data-id="' + s.id + '">📷 Cambiar foto</button>' +
        '<button type="button" class="btn-compact summon-sheet-btn" data-action="url-summon-img" data-id="' + s.id + '">🔗 Pegar URL</button>' +
        (s.image ? ('<button type="button" class="btn-compact summon-sheet-btn summon-sheet-btn-danger" data-action="remove-summon-img" data-id="' + s.id + '">Quitar foto</button>') : '') +
        '<button type="button" class="btn-compact summon-sheet-btn" data-action="close-summon-photo-menu">Cancelar</button>' +
      '</div>';
  }

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
      '<button class="f-pill '+(subtab==='galeria'?'active':'')+'" data-action="set-world-subtab" data-val="galeria">🖼️ Galería</button>'+
    '</div>'+
  '</div>';

  if(subtab === "mapas"){
    html += tplMundoMapas(s);
  } else if(subtab === "armas"){
    html += tplMundoArmas(s);
  } else if(subtab === "buffs"){
    html += tplMundoBuffs(s);
  } else if(subtab === "galeria" && typeof tplMundoGaleria === "function"){
    html += tplMundoGaleria(s);
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
  var html = '<div class="section'+(canEdit?' gm-section':'')+'"><div class="section-title lore-title-bar"><span>'+(canEdit?'Compendio de Lore, Fauna y Flora (GM)':'Compendio de Lore, Fauna y Flora')+'</span></div>'+
    '<div class="filter-section"><div class="filter-label">Continente</div><div class="filter-pills lore-pills">'+contPills+'</div></div>'+
    (currentLoreSubtab==="objetos"?
      '<div class="filter-section"><div class="filter-label">Tipo</div><div class="filter-pills lore-pills">'+typePills+'</div></div>'+
      '<div class="filter-section"><div class="filter-label">Terreno</div><div class="filter-pills lore-pills">'+terrPills+'</div></div>':'')+
    '<div class="filter-pills lore-pills" style="margin:10px 0;border-bottom:1px solid var(--line);padding-bottom:6px;">'+
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
    var rName = esc(it.rarity || "Común");
    var rClass = "rarity-" + String(it.rarity || "Común").toLowerCase().replace(/[^a-z0-9áéíóúüñ_-]/g,"");
    var bClass = "badge-" + String(it.rarity || "Común").toLowerCase().replace(/[^a-z0-9áéíóúüñ_-]/g,"");
    var editing = canEdit && !!(state._loreEdit && state._loreEdit[it.id]);

    html += '<div class="item-card '+rClass+'">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">'+
        '<div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap;">'+
          '<span class="item-badge '+bClass+'">'+rName+'</span>'+
          (it.type ? '<span style="font-size:.62rem;color:var(--teal-light);font-weight:700;">['+esc(it.type)+']</span>' : '')+
          (it.terrain ? '<span style="font-size:.62rem;color:var(--ink-faint);">📍 '+esc(it.terrain)+'</span>' : '')+
        '</div>'+
        '<div style="display:flex;gap:4px;">'+
          (canEdit ? '<button class="btn-compact lore-btn" data-action="toggle-lore-visibility" data-cat="' + cat + '" data-id="' + it.id + '" title="Mostrar/Ocultar para jugadores">'+(it.visible!==false?'👁️':'🙈')+'</button>' : '')+
          (canEdit ? '<button class="btn-compact lore-btn" data-action="toggle-lore-edit" data-id="' + it.id + '" title="'+(editing?'Terminar de editar':'Editar')+'" aria-label="'+(editing?'Terminar de editar':'Editar')+'">'+(editing?'✔️':'✏️')+'</button>' : '')+
          (canEdit ? '<button class="btn-compact lore-btn" data-action="del-lore" data-cat="' + cat + '" data-id="' + it.id + '" aria-label="Eliminar entrada">✕</button>' : '')+
        '</div>'+
      '</div>'+
      (canEdit && editing ? '<div class="creature-field lore-field"><label>Nombre</label><input type="text" class="k-input" data-scope="global" data-bind="lore.'+cat+'.'+it.id+'.title" value="'+esc(it.title)+'" placeholder="Nombre"></div>' : '<div class="lore-title">'+esc(it.title)+'</div>')+
      (canEdit && editing ? '<div class="creature-field lore-field"><label>Descripción</label><textarea class="k-input" data-scope="global" data-bind="lore.'+cat+'.'+it.id+'.text" placeholder="Descripción...">'+esc(it.text)+'</textarea></div>' : '<p class="lore-text">'+esc(it.text)+'</p>')+
    '</div>';
  });

  if(canEdit){
    html += '<button class="btn-compact" data-action="open-lore-modal" data-cat="'+cat+'" style="margin-top:6px;">+ Añadir a '+cat+'</button>';
  }
  html += '</div>';
  return html;
}
