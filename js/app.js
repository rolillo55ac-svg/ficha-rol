function updateLoadingProgress(pct, msg){
  var fill = document.getElementById("loadingBarFill");
  var txt = document.getElementById("loadingStatusText");
  if(fill) fill.style.width = Math.min(100, Math.max(5, pct)) + "%";
  if(txt && msg) txt.textContent = msg;
}

function hideLoadingScreen(){
  var ls = document.getElementById("loadingScreen");
  if(!ls) return;
  updateLoadingProgress(100, "¡Bienvenido a Krysalis!");
  setTimeout(function(){
    ls.classList.add("fade-out");
    setTimeout(function(){
      ls.style.display = "none";
      try { ls.remove(); } catch(e){}
    }, 500);
  }, 250);
}

// Watchdog de seguridad incondicional para evitar bloqueos en la pantalla de carga
setTimeout(function(){
  try {
    var ls = document.getElementById("loadingScreen");
    if(ls && ls.style.display !== "none"){
      console.warn("Watchdog: forzando ocultación de pantalla de carga.");
      hideLoadingScreen();
    }
  } catch(e){}
}, 2200);

window.addEventListener("error", function(err){
  console.warn("Global error listener:", err);
  setTimeout(hideLoadingScreen, 300);
});

function init(){
  try {
    updateLoadingProgress(25, "Cargando fichas...");
    state = loadState();
    updateLoadingProgress(60, "Preparando compendio...");
    renderTopbar();
    renderTabbar();
    renderTab();

    function safeListen(id, ev, fn, opt){
      var el = document.getElementById(id);
      if(el && typeof el.addEventListener === "function") el.addEventListener(ev, fn, opt);
    }

    safeListen("main", "click", handleClick);
    safeListen("main", "change", handleChange);
    safeListen("main", "input", handleChange);
    safeListen("main", "keydown", handleKeyDown);
    
    if(typeof document.addEventListener === "function"){
      document.addEventListener("touchstart", handleTouchStart, {passive: true});
      document.addEventListener("touchend", handleTouchEnd, {passive: true});
    }
    
    if(typeof window !== "undefined" && window.innerWidth < 768){
      setTimeout(showSwipeIndicator, 1000);
    }
    
    safeListen("topbar", "click", handleClick);
    safeListen("tabbar", "click", handleClick);
    safeListen("charModal", "click", modalClick);
    safeListen("dataModal", "click", modalClick);
    safeListen("diceModal", "click", diceModalClick);
    safeListen("pinModal", "click", pinModalClick);
    safeListen("loreModal", "click", loreModalClick);
    safeListen("conflictModal", "click", handleClick);
    safeListen("feedbackModal", "click", feedbackModalClick);
    
    safeListen("charModalOverlay", "click", function(e){ if(e.target===this) closeModals(); });
    safeListen("dataModalOverlay", "click", function(e){ if(e.target===this) closeModals(); });
    safeListen("diceModalOverlay", "click", function(e){ if(e.target===this) closeModals(); });
    safeListen("pinModalOverlay", "click", function(e){ if(e.target===this) closeModals(); });
    safeListen("loreModalOverlay", "click", function(e){ if(e.target===this) closeModals(); });
    safeListen("conflictModalOverlay", "click", function(e){ if(e.target===this) closeModals(); });
    safeListen("feedbackModalOverlay", "click", function(e){ if(e.target===this) closeModals(); });
    
    safeListen("rollOverlay", "click", function(e){
      if(e.target === this){
        closeBg3Roll();
        return;
      }
      handleClick(e);
    });

    safeListen("fabDice", "click", openDiceModal);

    safeListen("portraitFileInput", "change", function(e){
      if(e.target.files && e.target.files[0]){
        var c = activeChar();
        uploadImageToSupabase(e.target.files[0], "personajes", c ? c.name : "personaje", function(url){
          if(c && url){
            c.portrait = url;
            c._lastLocalEdit = Date.now();
            markCharDirty(c.id, { portrait: url });
            saveState(false);
            if(typeof pushCharacterPatch === "function") pushCharacterPatch(c.id, { portrait: url });
            renderTopbar();
            renderTab();
          }
        });
      }
      e.target.value="";
    });
    safeListen("mapFileInput", "change", function(e){
      if(e.target.files && e.target.files[0]){
        var curM = (state.maps||[]).find(function(m){return m.id===state.activeMapId;});
        var mapName = curM ? curM.name : "mapa";
        uploadImageToSupabase(e.target.files[0], "mapas", mapName, function(url){
          if(curM && url){
            curM.image = url;
            saveState(true);
            pushMapsData();
            renderTab();
          }
        });
      }
      e.target.value="";
    });
    safeListen("bestiaryFileInput", "change", function(e){
      if(e.target.files && e.target.files[0] && pendingBestiaryId){
        var bid = pendingBestiaryId;
        var b = (state.bestiary||[]).find(function(x){return x.id===bid;});
        var bName = b ? (b.nombre || b.name || "criatura") : "criatura";
        uploadImageToSupabase(e.target.files[0], "bestiario", bName, function(url){
          if(b && url){
            b.image = url;
            saveState(true);
            pushSharedData({ bestiary: state.bestiary });
            renderTab();
          }
        });
      }
      e.target.value="";
      pendingBestiaryId = null;
    });
    safeListen("questFileInput", "change", function(e){
      if(e.target.files && e.target.files[0]){
        if(!state.questMap) state.questMap = { name: "Mapa del Encuentro", image: null };
        var qmName = state.questMap.name || "mapa_mision";
        uploadImageToSupabase(e.target.files[0], "mapas", qmName, function(url){
          if(url){
            state.questMap.image = url;
            saveState(true);
            pushSharedData({ questMap: state.questMap });
            renderTab();
          }
        });
      }
      e.target.value="";
    });
    safeListen("questCardFileInput", "change", function(e){
      if(e.target.files && e.target.files[0] && pendingQuestCardId){
        var qid = pendingQuestCardId;
        var qObj = (state.quests||[]).find(function(q){ return q.id === qid; });
        var qName = qObj ? qObj.title : "mision";
        uploadImageToSupabase(e.target.files[0], "misiones", qName, function(url){
          if(qObj && url){
            qObj.image = url;
            saveState(true);
            pushSharedData({ quests: state.quests });
            renderTab();
          }
        });
      }
      e.target.value="";
      pendingQuestCardId = null;
    });
    safeListen("clueFileInput", "change", function(e){
      if(e.target.files && e.target.files[0] && pendingClueId){
        var cid = pendingClueId;
        var clObj = (state.questClues||[]).find(function(c){ return c.id === cid; });
        var clName = clObj ? clObj.title : "pista";
        uploadImageToSupabase(e.target.files[0], "pistas", clName, function(url){
          if(clObj && url){
            clObj.image = url;
            saveState(true);
            pushSharedData({ questClues: state.questClues });
            renderTab();
          }
        });
      }
      e.target.value="";
      pendingClueId = null;
    });
    safeListen("summonFileInput", "change", function(e){
      if(e.target.files && e.target.files[0] && pendingSummonId){
        var sid = pendingSummonId;
        var c = activeChar();
        var sm = (c && c.summons ? c.summons : []).find(function(x){ return x.id === sid; });
        var smName = sm ? sm.name : "invocacion";
        uploadImageToSupabase(e.target.files[0], "invocaciones", smName, function(url){
          if(sm && url){
            sm.image = url;
            saveState(true);
            pushSharedData();
            if(c && typeof manageListItemRPC === "function") manageListItemRPC(c, 'summons', 'update_item', { image: url }, sm.id);
            renderTab();
          }
        });
      }
      e.target.value="";
      pendingSummonId = null;
    });
    safeListen("importFileInput", "change", function(e){
      if(e.target.files && e.target.files[0]){
        importData(e.target.files[0]);
      }
      e.target.value="";
    });

    window.addEventListener("beforeunload", function(){
      if(document.activeElement && document.activeElement.matches("input, textarea, select")){
        try { document.activeElement.blur(); } catch(e){}
      }
      flushPendingSync();
      (state.characters || []).forEach(function(c){
        if(c && c._isDirty && canEditChar(c)) sendKeepalivePush(c);
      });
    });
    window.addEventListener("pagehide", function(){
      flushPendingSync();
      (state.characters || []).forEach(function(c){
        if(c && c._isDirty && canEditChar(c)) sendKeepalivePush(c);
      });
    });
    document.addEventListener("visibilitychange", function(){
      if(document.visibilityState === "hidden"){
        flushPendingSync();
        (state.characters || []).forEach(function(c){
          if(c && c._isDirty && canEditChar(c)) sendKeepalivePush(c);
        });
      }
    });

    updateLoadingProgress(85, "Conectando con la partida...");
    initSupabase();
    checkWeeklyBackup();
    setTimeout(function(){
      if(typeof syncPlayerTicketsWithSupabase === "function") syncPlayerTicketsWithSupabase();
      if(typeof syncAdminTicketsWithSupabase === "function" && typeof isGM === "function" && isGM()) syncAdminTicketsWithSupabase();
    }, 1200);

    if(typeof navigator !== "undefined" && "serviceWorker" in navigator && window.location.protocol.startsWith("http")){
      navigator.serviceWorker.register("./sw.js").catch(function(e){ console.warn("ServiceWorker aviso:", e); });
    }
  } catch(err) {
    console.error("Critical error in init():", err);
  } finally {
    updateLoadingProgress(100, "¡Listo!");
    setTimeout(hideLoadingScreen, 350);
    setTimeout(hideLoadingScreen, 1200);
  }
}

if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", init); else init();