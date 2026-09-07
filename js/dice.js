var audioCtx = null;
function getAudioCtx(){
  if(!audioCtx){ try{ audioCtx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} }
  if(audioCtx && audioCtx.state==='suspended') audioCtx.resume();
  return audioCtx;
}

function playCupRattleAudio(){
  var ctx = getAudioCtx(); if(!ctx) return;
  var now = ctx.currentTime;
  var taps = [0, 0.06, 0.12, 0.19, 0.26, 0.33, 0.40, 0.47];
  taps.forEach(function(delay, i){
    var t = now + delay;
    var osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = i % 2 === 0 ? "triangle" : "square";
    osc.frequency.setValueAtTime(200 + (i * 30) + Math.random() * 80, t);
    osc.frequency.exponentialRampToValueAtTime(130 + Math.random() * 30, t + 0.04);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.06);
  });
}

function playDiceDropAudio(){
  var ctx = getAudioCtx(); if(!ctx) return;
  var now = ctx.currentTime;
  var thud = ctx.createOscillator(), thudGain = ctx.createGain();
  thud.type = "sine";
  thud.frequency.setValueAtTime(150, now);
  thud.frequency.exponentialRampToValueAtTime(45, now + 0.13);
  thudGain.gain.setValueAtTime(0.001, now);
  thudGain.gain.linearRampToValueAtTime(0.35, now + 0.015);
  thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  thud.connect(thudGain); thudGain.connect(ctx.destination);
  thud.start(now); thud.stop(now + 0.16);

  [0.02, 0.07, 0.14].forEach(function(d, idx){
    var t = now + d;
    var osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(360 + Math.random() * 140, t);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.16 / (idx + 1), t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.045);
  });
}

function playDiceAudio(type){
  var ctx = getAudioCtx(); if(!ctx) return;
  var now = ctx.currentTime;
  if(type==="roll"){
    playCupRattleAudio();
    setTimeout(playDiceDropAudio, 350);
  }else if(type==="crit"){
    [523.25, 659.25, 783.99, 1046.50].forEach(function(f, idx){
      var osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = "triangle"; osc.frequency.setValueAtTime(f, now + idx*0.04);
      gain.gain.setValueAtTime(0.001, now + idx*0.04); gain.gain.exponentialRampToValueAtTime(0.22, now + idx*0.04 + 0.02); gain.gain.exponentialRampToValueAtTime(0.0001, now + idx*0.04 + 0.45);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now + idx*0.04); osc.stop(now + idx*0.04 + 0.5);
    });
  }else if(type==="fumble"){
    [311.13, 277.18, 220, 164.81].forEach(function(f, idx){
      var osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = "sawtooth"; osc.frequency.setValueAtTime(f, now + idx*0.06);
      gain.gain.setValueAtTime(0.001, now + idx*0.06); gain.gain.exponentialRampToValueAtTime(0.18, now + idx*0.06 + 0.02); gain.gain.exponentialRampToValueAtTime(0.0001, now + idx*0.06 + 0.35);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now + idx*0.06); osc.stop(now + idx*0.06 + 0.4);
    });
  }
}

function getDieSvg(sides){
  var stroke = "var(--gold)", fill = "var(--bg-card)", txt = "var(--gold-light)";
  if(sides===4) return '<svg viewBox="0 0 100 100"><polygon points="50,15 90,82 10,82" fill="'+fill+'" stroke="'+stroke+'" stroke-width="3.5"/><text x="50" y="65" font-family="var(--font-mono)" font-size="20" font-weight="700" fill="'+txt+'" text-anchor="middle">d4</text></svg>';
  if(sides===8) return '<svg viewBox="0 0 100 100"><polygon points="50,12 88,50 50,88 12,50" fill="'+fill+'" stroke="'+stroke+'" stroke-width="3.5"/><text x="50" y="57" font-family="var(--font-mono)" font-size="20" font-weight="700" fill="'+txt+'" text-anchor="middle">d8</text></svg>';
  if(sides===10) return '<svg viewBox="0 0 100 100"><polygon points="50,10 88,38 74,88 26,88 12,38" fill="'+fill+'" stroke="'+stroke+'" stroke-width="3.5"/><text x="50" y="58" font-family="var(--font-mono)" font-size="22" font-weight="700" fill="'+txt+'" text-anchor="middle">d10</text></svg>';
  if(sides===12) return '<svg viewBox="0 0 100 100"><polygon points="50,12 85,24 95,60 68,90 32,90 5,60 15,24" fill="'+fill+'" stroke="'+stroke+'" stroke-width="3.5"/><text x="50" y="59" font-family="var(--font-mono)" font-size="18" font-weight="700" fill="'+txt+'" text-anchor="middle">d12</text></svg>';
  if(sides===20) return '<svg viewBox="0 0 100 100"><polygon points="50,10 90,32 90,75 50,94 10,75 10,32" fill="'+fill+'" stroke="'+stroke+'" stroke-width="3.5"/><text x="50" y="60" font-family="var(--font-mono)" font-size="18" font-weight="700" fill="'+txt+'" text-anchor="middle">d20</text></svg>';
  if(sides===100) return '<div style="display:flex;gap:4px;"><svg viewBox="0 0 100 100" style="width:36px;height:36px;"><polygon points="50,10 88,38 74,88 26,88 12,38" fill="'+fill+'" stroke="'+stroke+'" stroke-width="3"/><text x="50" y="56" font-family="var(--font-mono)" font-size="16" font-weight="700" fill="'+txt+'" text-anchor="middle">00</text></svg><svg viewBox="0 0 100 100" style="width:36px;height:36px;"><polygon points="50,10 88,38 74,88 26,88 12,38" fill="'+fill+'" stroke="'+stroke+'" stroke-width="3"/><text x="50" y="56" font-family="var(--font-mono)" font-size="16" font-weight="700" fill="'+txt+'" text-anchor="middle">0</text></svg></div>';
  return '<svg viewBox="0 0 100 100"><rect x="15" y="15" width="70" height="70" rx="10" fill="'+fill+'" stroke="'+stroke+'" stroke-width="3.5"/><text x="50" y="60" font-family="var(--font-mono)" font-size="24" font-weight="700" fill="'+txt+'" text-anchor="middle">d6</text></svg>';
}

function getOrnateCupSvg(){
  return '<svg class="ornate-cup-svg" viewBox="0 0 160 200" width="115" height="145" xmlns="http://www.w3.org/2000/svg">'+
    '<defs>'+
      '<linearGradient id="cupLeatherGrad" x1="0%" y1="0%" x2="100%" y2="0%">'+
        '<stop offset="0%" stop-color="#180e07"/>'+
        '<stop offset="30%" stop-color="#3d2514"/>'+
        '<stop offset="50%" stop-color="#54331c"/>'+
        '<stop offset="70%" stop-color="#3d2514"/>'+
        '<stop offset="100%" stop-color="#120904"/>'+
      '</linearGradient>'+
      '<linearGradient id="cupGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">'+
        '<stop offset="0%" stop-color="#FFF275"/>'+
        '<stop offset="40%" stop-color="#D4AF37"/>'+
        '<stop offset="80%" stop-color="#996515"/>'+
        '<stop offset="100%" stop-color="#4A3415"/>'+
      '</linearGradient>'+
      '<linearGradient id="cupVelvetGrad" x1="0%" y1="0%" x2="0%" y2="100%">'+
        '<stop offset="0%" stop-color="#3e0910"/>'+
        '<stop offset="100%" stop-color="#120204"/>'+
      '</linearGradient>'+
    '</defs>'+
    '<ellipse cx="80" cy="186" rx="42" ry="9" fill="rgba(0,0,0,0.55)"/>'+
    '<polygon points="35,45 125,45 110,175 50,175" fill="url(#cupLeatherGrad)" stroke="#100703" stroke-width="2.5"/>'+
    '<line x1="72" y1="46" x2="76" y2="174" stroke="#A0783E" stroke-width="1.6" stroke-dasharray="3,3"/>'+
    '<line x1="88" y1="46" x2="84" y2="174" stroke="#A0783E" stroke-width="1.6" stroke-dasharray="3,3"/>'+
    '<polygon points="40,102 120,102 116,125 44,125" fill="url(#cupGoldGrad)" stroke="#3A280F" stroke-width="1.8"/>'+
    '<text x="80" y="119" font-family="monospace" font-size="12" font-weight="900" fill="#1C1109" text-anchor="middle" letter-spacing="3.5">ᚠ ᚱ ᛊ ᛏ</text>'+
    '<circle cx="48" cy="113" r="3.2" fill="#FFF275" stroke="#4A3415" stroke-width="1"/>'+
    '<circle cx="112" cy="113" r="3.2" fill="#FFF275" stroke="#4A3415" stroke-width="1"/>'+
    '<polygon points="48,166 112,166 110,178 50,178" fill="url(#cupGoldGrad)" stroke="#3A280F" stroke-width="1.6"/>'+
    '<ellipse cx="80" cy="177" rx="30" ry="7" fill="#1A1009" stroke="url(#cupGoldGrad)" stroke-width="1.8"/>'+
    '<ellipse cx="80" cy="45" rx="45" ry="14" fill="url(#cupVelvetGrad)" stroke="url(#cupGoldGrad)" stroke-width="3.6"/>'+
    '<ellipse cx="80" cy="45" rx="38" ry="9" fill="#1D0306" stroke="#FFF275" stroke-width="1.2" opacity="0.8"/>'+
    '<path d="M54,64 Q80,78 106,64" fill="none" stroke="url(#cupGoldGrad)" stroke-width="2" opacity="0.85"/>'+
    '<path d="M57,146 Q80,158 103,146" fill="none" stroke="url(#cupGoldGrad)" stroke-width="1.8" opacity="0.85"/>'+
  '</svg>';
}

var lastRollFn = null;

function openRollModal(label, scoreText, detailHtml, sides, isCrit, isFumble, advCardsHtml, rerollFn){
  if(rerollFn) lastRollFn = rerollFn;

  var overlay = document.getElementById("rollOverlay");
  var cupStage = document.getElementById("cupStage");
  var resultStage = document.getElementById("rollResultStage");

  document.getElementById("rollLabel").textContent = label;
  document.getElementById("rollDieGraphic").innerHTML = getDieSvg(sides);
  document.getElementById("rollAdvVisual").innerHTML = advCardsHtml || "";
  var scoreEl = document.getElementById("rollScore");
  scoreEl.textContent = scoreText;
  scoreEl.className = "roll-score" + (isCrit ? " crit" : isFumble ? " fumble" : "");
  document.getElementById("rollVerdict").textContent = isCrit ? "¡Éxito Crítico!" : (isFumble ? "¡Pifia Crítica!" : "");
  document.getElementById("rollVerdict").style.color = isCrit ? "var(--gold-light)" : (isFumble ? "var(--danger)" : "transparent");
  document.getElementById("rollDetail").innerHTML = detailHtml;

  var rerollBtn = document.querySelector("[data-action='reroll-last-dice']");
  if(rerollBtn){
    rerollBtn.style.display = lastRollFn ? "block" : "none";
  }

  overlay.classList.remove("hidden");

  if(cupStage && resultStage){
    cupStage.style.display = "flex";
    cupStage.innerHTML = '<div class="ornate-cup-wrapper shaking">' + getOrnateCupSvg() + '<div class="cup-sparks"></div></div>';
    resultStage.style.display = "none";
    resultStage.classList.remove("revealed");

    playCupRattleAudio();

    setTimeout(function(){
      var cupWrap = cupStage.querySelector(".ornate-cup-wrapper");
      if(cupWrap){
        cupWrap.classList.remove("shaking");
        cupWrap.classList.add("pouring");
      }
      playDiceDropAudio();
    }, 450);

    setTimeout(function(){
      if(cupStage) cupStage.style.display = "none";
      if(resultStage){
        resultStage.style.display = "block";
        resultStage.classList.add("revealed");
      }
      if(isCrit) setTimeout(function(){ playDiceAudio("crit"); }, 150);
      else if(isFumble) setTimeout(function(){ playDiceAudio("fumble"); }, 150);
    }, 850);
  } else {
    playDiceAudio("roll");
    if(isCrit) setTimeout(function(){ playDiceAudio("crit"); }, 400);
    else if(isFumble) setTimeout(function(){ playDiceAudio("fumble"); }, 400);
  }
}

function broadcastDiceRoll(rollObj){
  if(realtimeChannel && typeof realtimeChannel.send === 'function'){
    try {
      realtimeChannel.send({
        type: 'broadcast',
        event: 'dice_roll',
        payload: rollObj
      });
    } catch(e){
      console.warn("Could not broadcast dice roll:", e);
    }
  }
}

function handleRemoteDiceRoll(rollObj){
  if(!rollObj) return;
  state.rollLog.unshift({
    id: rollObj.id || uid(),
    charName: rollObj.charName || "Aventurero",
    label: rollObj.label || "Tirada",
    total: rollObj.total,
    formulaText: rollObj.formulaText,
    ts: rollObj.ts || Date.now()
  });
  if(state.rollLog.length > 20) state.rollLog.length = 20;
  saveState(true);
  
  var critText = rollObj.isCrit ? " ¡Éxito Crítico!" : (rollObj.isFumble ? " ¡Pifia Crítica!" : "");
  var toastType = rollObj.isCrit ? "success" : (rollObj.isFumble ? "error" : "info");
  showToast("🎲 " + rollObj.charName + " tiró " + rollObj.label + ": " + rollObj.total + critText, toastType);
  
  if(rollObj.isCrit) playDiceAudio("crit");
  else if(rollObj.isFumble) playDiceAudio("fumble");
  else playDiceAudio("roll");
  
  if(state.activeTab === "habilidades" || state.activeTab === "combate") {
    renderTab();
  }
}

function performD10Roll(charName, label, mod){
  var c = activeChar();
  var extra = 0;
  if(c.buffs){
    if(c.buffs.sangre_ataque_melee && label.includes("melé")) extra += 1;
    if(c.buffs.sangre_ataque_dist && label.includes("distancia")) extra += 1;
    if(c.buffs.mono) extra -= 1;
  }
  if(c.activeBuffs){
    c.activeBuffs.forEach(function(ab){
      if(label.toLowerCase().includes("melé") && (ab.attr === "melee" || ab.attr === "melé")){
        var b1 = parseFloat(ab.bonus);
        if(!isNaN(b1)) extra += b1;
      }
      if(label.toLowerCase().includes("distancia") && ab.attr === "distancia"){
        var b2 = parseFloat(ab.bonus);
        if(!isNaN(b2)) extra += b2;
      }
      if(ab.attr === "todo"){
        var b3 = parseFloat(ab.bonus);
        if(!isNaN(b3)) extra += b3;
      }
    });
  }
  if(c.spells){
    c.spells.forEach(function(sp){
      if(sp.active && sp.statAttr && sp.statMod){
        if(label.toLowerCase().includes("melé") && (sp.statAttr === "melee" || sp.statAttr === "melé")){
          var b1 = parseFloat(sp.statMod);
          if(!isNaN(b1)) extra += b1;
        }
        if(label.toLowerCase().includes("distancia") && sp.statAttr === "distancia"){
          var b2 = parseFloat(sp.statMod);
          if(!isNaN(b2)) extra += b2;
        }
        if(sp.statAttr === "todo"){
          var b3 = parseFloat(sp.statMod);
          if(!isNaN(b3)) extra += b3;
        }
      }
    });
  }
  var d = rollDie(10);
  var total = d + num(mod,0) + extra;
  var formula = "1d10 (" + d + ") + Mod (" + (num(mod,0)+extra) + ")";
  var rollItem = {id:uid(), charName:charName, label:label, total:total, formulaText:formula, isCrit:d===10, isFumble:d===1, ts:Date.now()};
  state.rollLog.unshift(rollItem);
  if(state.rollLog.length>20) state.rollLog.length=20;
  saveState();
  broadcastDiceRoll(rollItem);
  openRollModal(label, total, formula, 10, d===10, d===1);
  renderTab();
}

function performWeaponRoll(charName, weaponName, formulaRaw){
  var reg = new RegExp('(\\d+)\\s*[dD]\\s*(\\d+)');
  var m = String(formulaRaw||"").match(reg);
  if(!m){ showToast("Fórmula de daño no válida (ej: 1D6+3)", "error"); return; }
  var qty = parseInt(m[1],10), sides = parseInt(m[2],10);
  var rest = String(formulaRaw).slice(m.index + m[0].length);
  var modM = rest.match(new RegExp('^\\s*([+-]\\s*\\d+)'));
  var mod = modM ? parseInt(modM[1].replace(/\s+/g,""),10) : 0;
  var rolls=[], sum=0;
  for(var i=0;i<qty;i++){ var r=rollDie(sides); rolls.push(r); sum+=r; }
  var total = sum + mod;
  var isCrit = rolls.every(function(x){return x===sides;});
  var isFumble = rolls.every(function(x){return x===1;});
  var detail = qty + "d" + sides + " [" + rolls.join(", ") + "]" + (mod ? (mod>0?" + "+mod:" - "+Math.abs(mod)) : "");
  var rollItem = {id:uid(), charName:charName, label:"Daño ("+weaponName+")", total:total, formulaText:detail, isCrit:isCrit, isFumble:isFumble, ts:Date.now()};
  state.rollLog.unshift(rollItem);
  if(state.rollLog.length>20) state.rollLog.length=20;
  saveState();
  broadcastDiceRoll(rollItem);
  openRollModal("Daño — "+weaponName, total, detail, sides, isCrit, isFumble);
  renderTab();
}


function openDiceModal(){
  var sidesList = [4, 6, 8, 10, 12, 20, 100];
  var diceCards = sidesList.map(function(s){
    return '<div class="dtype-card '+(diceConfig.sides===s?'active':'')+'" data-action="pick-die" data-sides="'+s+'" role="button" tabindex="0">'+
      getDieSvg(s)+
      '<span>'+(s===100?'d%':'d'+s)+'</span>'+
    '</div>';
  }).join('');

  document.getElementById("diceModal").innerHTML =
    '<div class="cup-modal-header">'+
      '<div class="cup-modal-icon">'+getOrnateCupSvg()+'</div>'+
      '<div class="cup-modal-title">'+
        '<h3>Cubilete de Aventurero</h3>'+
        '<div class="cup-modal-sub">Selecciona dados, modalidad y lanza tu destino</div>'+
      '</div>'+
      '<button class="row-del" data-action="close-modal" aria-label="Cerrar" style="min-width:30px;min-height:30px;font-size:1rem;">✕</button>'+
    '</div>'+
    '<div class="dice-mode-pills">'+
      '<button class="dmode-pill '+(diceConfig.mode==='normal'?'active':'')+'" data-action="set-dice-mode" data-mode="normal">⚔️ Normal</button>'+
      '<button class="dmode-pill '+(diceConfig.mode==='adv'?'active':'')+'" data-action="set-dice-mode" data-mode="adv">🍀 Ventaja</button>'+
      '<button class="dmode-pill '+(diceConfig.mode==='disadv'?'active':'')+'" data-action="set-dice-mode" data-mode="disadv">💀 Desventaja</button>'+
    '</div>'+
    '<div class="cup-tray-label">Dados Poliédricos</div>'+
    '<div class="dtype-grid">'+diceCards+'</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px;">'+
      (diceConfig.sides===100?'<div></div>':'<div class="field"><label>Cantidad</label>'+
        '<div class="qty-control-row">'+
          '<button class="qty-btn" data-action="dec-dice-qty">-</button>'+
          '<input type="number" min="1" max="20" id="diceQty" value="'+diceConfig.qty+'" style="width:48px;text-align:center;">'+
          '<button class="qty-btn" data-action="inc-dice-qty">+</button>'+
        '</div>'+
        '<div class="quick-qty-chips" style="margin-top:4px;">'+
          [1,2,3,4].map(function(q){
            return '<button class="qty-chip '+(diceConfig.qty===q?'active':'')+'" data-action="set-dice-qty" data-qty="'+q+'">x'+q+'</button>';
          }).join('')+
        '</div>'+
      '</div>')+
      '<div class="field"><label>Modificador</label>'+
        '<div class="mod-control-row">'+
          '<input type="number" id="diceMod" value="'+diceConfig.mod+'" style="width:60px;text-align:center;">'+
          '<div class="quick-mod-chips">'+
            [-2,0,1,2,5].map(function(m){
              return '<button class="mod-chip '+(diceConfig.mod===m?'active':'')+'" data-action="set-dice-mod" data-mod="'+m+'">'+(m>0?'+'+m:m)+'</button>';
            }).join('')+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<button class="btn-solid-gold btn-roll-cup" data-action="roll-dice-btn">🎲 ¡Agitar Cubilete y Lanzar!</button>';
  document.getElementById("diceModalOverlay").classList.remove("hidden");
}

function diceModalClick(e){
  var btn = e.target.closest("[data-action]"); if(!btn) return;
  var action = btn.getAttribute("data-action");
  if(action==="close-modal"){ closeModals(); return; }
  if(action==="set-dice-mode"){ diceConfig.mode = btn.getAttribute("data-mode"); openDiceModal(); return; }
  if(action==="inc-dice-qty"){ diceConfig.qty = Math.min(20, (diceConfig.qty||1)+1); openDiceModal(); return; }
  if(action==="dec-dice-qty"){ diceConfig.qty = Math.max(1, (diceConfig.qty||1)-1); openDiceModal(); return; }
  if(action==="set-dice-qty"){ diceConfig.qty = parseInt(btn.getAttribute("data-qty"),10)||1; openDiceModal(); return; }
  if(action==="set-dice-mod"){ diceConfig.mod = parseInt(btn.getAttribute("data-mod"),10)||0; openDiceModal(); return; }
  if(action==="pick-die"){ diceConfig.sides = parseInt(btn.getAttribute("data-sides"),10); openDiceModal(); return; }
  if(action==="roll-dice-btn"){
    var modInput = document.getElementById("diceMod");
    if(modInput) diceConfig.mod = parseInt(modInput.value,10)||0;
    var qtyInput = document.getElementById("diceQty");
    if(qtyInput) diceConfig.qty = Math.max(1, parseInt(qtyInput.value,10)||1);
    document.getElementById("diceModalOverlay").classList.add("hidden");
    var cName = activeChar().name || "Aventurero";

    var doRoll = function(){
      if(diceConfig.sides===100){
        var dTens = (rollDie(10)-1)*10, dUnits = rollDie(10)-1;
        var pct = dTens + dUnits === 0 ? 100 : dTens + dUnits;
        var tot = pct + diceConfig.mod;
        var fText = "Decenas: " + dTens + " | Unidades: " + dUnits + (diceConfig.mod ? (diceConfig.mod>0?" + "+diceConfig.mod:" - "+Math.abs(diceConfig.mod)) : "");
        var rItem1 = {id:uid(), charName:cName, label:"d% Percentil", total:tot, formulaText:fText, isCrit:pct===100, isFumble:pct===1, ts:Date.now()};
        state.rollLog.unshift(rItem1);
        if(state.rollLog.length>20) state.rollLog.length=20;
        saveState();
        broadcastDiceRoll(rItem1);
        openRollModal("d% Percentil", tot, fText, 100, pct===100, pct===1, null, doRoll);
        renderTab();
        return;
      }

      if(diceConfig.mode==="adv" || diceConfig.mode==="disadv"){
        var r1 = rollDie(diceConfig.sides), r2 = rollDie(diceConfig.sides);
        var chosen = diceConfig.mode==="adv" ? Math.max(r1, r2) : Math.min(r1, r2);
        var totalAdv = chosen + diceConfig.mod;
        var advHtml = '<div class="adv-dice-wrap">'+
          '<div class="adv-die-card '+(r1===chosen?'chosen':'discarded')+'">'+r1+'</div>'+
          '<div class="adv-die-card '+(r2===chosen && (r1!==r2||diceConfig.mode==="adv")?'chosen':(r1===r2?'chosen':'discarded'))+'">'+r2+'</div>'+
        '</div>';
        var lblAdv = "d"+diceConfig.sides + (diceConfig.mode==="adv"?" (Ventaja)":" (Desventaja)");
        var modStr = (diceConfig.mod>=0?"+"+diceConfig.mod:diceConfig.mod);
        var rItem2 = {id:uid(), charName:cName, label:lblAdv, total:totalAdv, formulaText:"["+r1+", "+r2+"] -> " + chosen + " (Mod: " + modStr + ")", isCrit:chosen===diceConfig.sides, isFumble:chosen===1, ts:Date.now()};
        state.rollLog.unshift(rItem2);
        if(state.rollLog.length>20) state.rollLog.length=20;
        saveState();
        broadcastDiceRoll(rItem2);
        openRollModal(lblAdv, totalAdv, "Modificador: " + modStr, diceConfig.sides, chosen===diceConfig.sides, chosen===1, advHtml, doRoll);
        renderTab();
        return;
      }

      var rolls=[], sum=0;
      for(var i=0;i<diceConfig.qty;i++){ var r=rollDie(diceConfig.sides); rolls.push(r); sum+=r; }
      var grandTotal = sum + diceConfig.mod;
      var isAllCrit = rolls.every(function(x){return x===diceConfig.sides;});
      var isAllFumble = rolls.every(function(x){return x===1;});
      var fDetail = diceConfig.qty + "d" + diceConfig.sides + " [" + rolls.join(", ") + "]" + (diceConfig.mod ? (diceConfig.mod>0?" + "+diceConfig.mod:" - "+Math.abs(diceConfig.mod)) : "");
      var rItem3 = {id:uid(), charName:cName, label:diceConfig.qty+"d"+diceConfig.sides, total:grandTotal, formulaText:fDetail, isCrit:isAllCrit, isFumble:isAllFumble, ts:Date.now()};
      state.rollLog.unshift(rItem3);
      if(state.rollLog.length>20) state.rollLog.length=20;
      saveState();
      broadcastDiceRoll(rItem3);
      openRollModal(diceConfig.qty+"d"+diceConfig.sides, grandTotal, fDetail, diceConfig.sides, isAllCrit, isAllFumble, null, doRoll);
      renderTab();
    };

    doRoll();
    return;
  }
}


function rollLogHtml(){
  if(!state) return '';
  state.rollLog = state.rollLog || [];
  var logs = state.rollLog.slice(0,5);
  var html = '<div class="section"><div class="section-title"><span>Historial de Tiradas</span></div>';
  if(!logs.length){ html += '<div class="roll-empty">Sin tiradas recientes.</div>'; }
  else {
    html += '<div class="roll-log">'+logs.map(function(r){
      return '<div class="roll-log-item"><span>'+esc(r.charName)+' — '+esc(r.label)+'<br><span class="rl-formula">'+esc(r.formulaText)+'</span></span><span class="rl-result">'+r.total+'</span></div>';
    }).join('')+'</div>';
  }
  html += '</div>';
  return html;
}
