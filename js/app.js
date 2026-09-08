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

// === CIBERSEGURIDAD: PROTECCIÓN ANTI FUERZA BRUTA ===

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
    
    safeListen("charModalOverlay", "click", function(e){ if(e.target===this) closeModals(); });
    safeListen("dataModalOverlay", "click", function(e){ if(e.target===this) closeModals(); });
    safeListen("diceModalOverlay", "click", function(e){ if(e.target===this) closeModals(); });
    safeListen("pinModalOverlay", "click", function(e){ if(e.target===this) closeModals(); });
    safeListen("loreModalOverlay", "click", function(e){ if(e.target===this) closeModals(); });
    
    safeListen("rollOverlay", "click", function(e){
      if(e.target===this || e.target.closest("[data-action='close-roll-modal']")){
        this.classList.add("hidden");
      } else if(e.target.closest("[data-action='reroll-last-dice']")){
        if(typeof lastRollFn === "function") lastRollFn();
      }
    });

    safeListen("fabDice", "click", openDiceModal);

    safeListen("portraitFileInput", "change", function(e){
      if(e.target.files && e.target.files[0]){
        resizeImageFile(e.target.files[0], 400, 0.85, function(url){ activeChar().portrait = url; saveState(); renderTopbar(); renderTab(); });
      }
      e.target.value="";
    });
    safeListen("mapFileInput", "change", function(e){
      if(e.target.files && e.target.files[0]){
        resizeImageFile(e.target.files[0], 1920, 0.85, function(url){
          var curM = (state.maps||[]).find(function(m){return m.id===state.activeMapId;});
          if(curM){
            curM.image = url;
            saveState(true);
            pushMapsData();
            renderTab();
            showToast("Foto subida al mapa con éxito", "success");
          }
        });
      }
      e.target.value="";
    });
    safeListen("bestiaryFileInput", "change", function(e){
      if(e.target.files && e.target.files[0] && pendingBestiaryId){
        var bid = pendingBestiaryId;
        resizeImageFile(e.target.files[0], 600, 0.85, function(url){
          var b = (state.bestiary||[]).find(function(x){return x.id===bid;});
          if(b){
            b.image = url;
            saveState(true);
            pushSharedData();
            renderTab();
            showToast("Foto asignada a la criatura", "success");
          }
        });
      }
      e.target.value="";
      pendingBestiaryId = null;
    });
    safeListen("questFileInput", "change", function(e){
      if(e.target.files && e.target.files[0]){
        resizeImageFile(e.target.files[0], 1920, 0.85, function(url){
          if(!state.questMap) state.questMap = { name: "Mapa del Encuentro", image: null };
          state.questMap.image = url;
          saveState(true);
          pushSharedData();
          renderTab();
          showToast("Foto del mapa de misión actualizada", "success");
        });
      }
      e.target.value="";
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
  } catch(err) {
    console.error("Critical error in init():", err);
  } finally {
    updateLoadingProgress(100, "¡Listo!");
    setTimeout(hideLoadingScreen, 350);
    setTimeout(hideLoadingScreen, 1200);
  }
}

if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", init); else init();