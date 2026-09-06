// ============================================================================
// KRYSALIS RPG - MÓDULO: APP
// Arranque de la aplicación, pantalla de carga y watchdog de inicialización
// ============================================================================

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

    document.getElementById("main").addEventListener("click", handleClick);
    document.getElementById("main").addEventListener("change", handleChange);
    document.getElementById("main").addEventListener("input", handleChange);
    
    document.addEventListener("touchstart", handleTouchStart, {passive: true});
    document.addEventListener("touchend", handleTouchEnd, {passive: true});
    
    if(window.innerWidth < 768){
      setTimeout(showSwipeIndicator, 1000);
    }
    
    document.getElementById("topbar").addEventListener("click", handleClick);
    document.getElementById("tabbar").addEventListener("click", handleClick);
    document.getElementById("charModal").addEventListener("click", modalClick);
    document.getElementById("dataModal").addEventListener("click", modalClick);
    document.getElementById("diceModal").addEventListener("click", diceModalClick);
    document.getElementById("pinModal").addEventListener("click", pinModalClick);
    document.getElementById("loreModal").addEventListener("click", loreModalClick);
    
    document.getElementById("charModalOverlay").addEventListener("click", function(e){ if(e.target===this) closeModals(); });
    document.getElementById("dataModalOverlay").addEventListener("click", function(e){ if(e.target===this) closeModals(); });
    document.getElementById("diceModalOverlay").addEventListener("click", function(e){ if(e.target===this) closeModals(); });
    document.getElementById("pinModalOverlay").addEventListener("click", function(e){ if(e.target===this) closeModals(); });
    document.getElementById("loreModalOverlay").addEventListener("click", function(e){ if(e.target===this) closeModals(); });
    
    document.getElementById("rollOverlay").addEventListener("click", function(e){
      if(e.target===this || e.target.closest("[data-action='close-roll-modal']")){
        this.classList.add("hidden");
      } else if(e.target.closest("[data-action='reroll-last-dice']")){
        if(typeof lastRollFn === "function") lastRollFn();
      }
    });

    document.getElementById("fabDice").addEventListener("click", openDiceModal);

    document.getElementById("portraitFileInput").addEventListener("change", function(e){
      if(e.target.files && e.target.files[0]){
        resizeImageFile(e.target.files[0], 400, 0.85, function(url){ activeChar().portrait = url; saveState(); renderTopbar(); renderTab(); });
      }
      e.target.value="";
    });
    document.getElementById("mapFileInput").addEventListener("change", function(e){
      if(e.target.files && e.target.files[0]){
        resizeImageFile(e.target.files[0], 900, 0.65, function(url){
          if(pendingNewMapName){
            var newM = { id: uid(), name: pendingNewMapName, image: url, markers: [] };
            state.maps = state.maps || [];
            state.maps.push(newM);
            state.activeMapId = newM.id;
            pendingNewMapName = null;
            saveState(true);
            pushMapsData();
            renderTab();
            showToast("Nuevo mapa creado: " + newM.name, "success");
          } else {
            var curM = (state.maps||[]).find(function(m){return m.id===state.activeMapId;});
            if(curM){
              curM.image = url;
              saveState(true);
              pushMapsData();
              renderTab();
              showToast("Foto del mapa actualizada", "info");
            }
          }
        });
      }
      e.target.value="";
    });
    var bFileInput = document.getElementById("bestiaryFileInput");
    if(bFileInput){
      bFileInput.addEventListener("change", function(e){
        if(e.target.files && e.target.files[0] && pendingBestiaryId){
          resizeImageFile(e.target.files[0], 600, 0.7, function(url){
            var beast = (state.bestiary||[]).find(function(x){return x.id===pendingBestiaryId;});
            if(beast){
              beast.image = url;
              saveState(true); pushSharedData(); renderTab();
            }
            pendingBestiaryId = null;
          });
        }
        e.target.value="";
      });
    }
    var qFileInput = document.getElementById("questFileInput");
    if(qFileInput){
      qFileInput.addEventListener("change", function(e){
        if(e.target.files && e.target.files[0]){
          resizeImageFile(e.target.files[0], 900, 0.7, function(url){
            state.questMap = state.questMap || { name: "Mapa del Encuentro", image: null, notes: "" };
            state.questMap.image = url;
            saveState(true); pushSharedData(); renderTab();
            showToast("Mapa de misión actualizado", "success");
          });
        }
        e.target.value = "";
      });
    }
    document.getElementById("importFileInput").addEventListener("change", function(e){
      if(e.target.files && e.target.files[0]) importData(e.target.files[0]);
      e.target.value="";
    });

    window.addEventListener("beforeunload", function(){
      if(document.activeElement && document.activeElement.matches("input, textarea, select")){
        try { document.activeElement.blur(); } catch(e){}
      }
      flushPendingSync();
      (state.characters || []).forEach(function(c){
        if(c && c._isDirty) sendKeepalivePush(c);
      });
    });
    window.addEventListener("pagehide", function(){
      flushPendingSync();
      (state.characters || []).forEach(function(c){
        if(c && c._isDirty) sendKeepalivePush(c);
      });
    });
    document.addEventListener("visibilitychange", function(){
      if(document.visibilityState === "hidden"){
        flushPendingSync();
        (state.characters || []).forEach(function(c){
          if(c && c._isDirty) sendKeepalivePush(c);
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