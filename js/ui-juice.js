// Efectos visuales y de vibración (UI Juice)
(function () {
  'use strict';

  try {
    // ----------------------------------------------------
    // 1. Preferencias en localStorage y estado
    // ----------------------------------------------------
    function animOn() {
      try {
        return localStorage.getItem('juice_anim') !== '0';
      } catch (_) {
        return true;
      }
    }

    function vibOn() {
      try {
        return localStorage.getItem('juice_vib') !== '0';
      } catch (_) {
        return true;
      }
    }

    function setAnim(bool) {
      try {
        localStorage.setItem('juice_anim', bool ? '1' : '0');
        if (!bool) {
          document.documentElement.classList.add('juice-off');
        } else {
          document.documentElement.classList.remove('juice-off');
        }
      } catch (_) {}
    }

    function setVib(bool) {
      try {
        localStorage.setItem('juice_vib', bool ? '1' : '0');
      } catch (_) {}
    }

    // Aplicar clase al cargar según preferencia
    if (!animOn()) {
      document.documentElement.classList.add('juice-off');
    }

    // ----------------------------------------------------
    // 2. Vibración táctil
    // ----------------------------------------------------
    function vibrar(patron) {
      try {
        if (!vibOn()) return;
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
          navigator.vibrate(patron);
        }
      } catch (_) {}
    }

    // ----------------------------------------------------
    // 3. Regla de exclusión: La Casa, Lapidario y Joystick
    // ----------------------------------------------------
    function isExcluded(el) {
      try {
        if (!el || !(el instanceof Element)) return true;
        if (el.closest('[class*="house"] canvas, canvas, .konvajs-content, [class*="lapid"], [class*="lap-"], [class*="joystick"]')) {
          return true;
        }
        if (el.closest('[class*="house"]') && el.closest('.konvajs-content, canvas, .house-canvas-stage, .house-viewport')) {
          return true;
        }
        return false;
      } catch (_) {
        return true;
      }
    }

    // ----------------------------------------------------
    // 4. Pulso de magia y alquimia
    // ----------------------------------------------------
    function pulso(el, tipo) {
      try {
        if (!animOn()) return;
        if (!el || !(el instanceof Element) || isExcluded(el)) return;
        const cls = tipo === 'arcane' ? 'juice-pulse-arcane' : (tipo === 'alchemy' ? 'juice-pulse-alchemy' : '');
        if (!cls) return;

        el.classList.remove('juice-pulse-arcane', 'juice-pulse-alchemy');
        void el.offsetWidth;
        el.classList.add(cls);

        setTimeout(function () {
          try {
            el.classList.remove(cls);
          } catch (_) {}
        }, 600);
      } catch (_) {}
    }

    // ----------------------------------------------------
    // 5. Subida de nivel (Level Up)
    // ----------------------------------------------------
    function levelUp(el) {
      try {
        if (!animOn()) return;
        if (!el || !(el instanceof Element) || isExcluded(el)) return;
        if (el.classList.contains('juice-levelup') || el._juiceLevelUpActive) return;

        el._juiceLevelUpActive = true;
        el.classList.add('juice-levelup');

        const sparks = [];
        for (let i = 0; i < 10; i++) {
          const spark = document.createElement('span');
          spark.className = 'juice-spark';

          const angle = Math.random() * Math.PI * 2;
          const dist = 30 + Math.random() * 55;
          const dx = Math.round(Math.cos(angle) * dist) + 'px';
          const dy = Math.round(Math.sin(angle) * dist) + 'px';

          spark.style.setProperty('--dx', dx);
          spark.style.setProperty('--dy', dy);

          el.appendChild(spark);
          sparks.push(spark);
        }

        setTimeout(function () {
          try {
            el.classList.remove('juice-levelup');
            el._juiceLevelUpActive = false;
            for (let i = 0; i < sparks.length; i++) {
              if (sparks[i].parentNode) {
                sparks[i].parentNode.removeChild(sparks[i]);
              }
            }
          } catch (_) {}
        }, 1300);
      } catch (_) {}
    }

    // ----------------------------------------------------
    // 6. Toque pasivo (pointerdown) para Ripple y Vibración
    // ----------------------------------------------------
    const midVibeRe = /^(add|new|create|confirm|save|submit|del|delete|remove|grant|apply|equip|craft)-|-(add|new|create|save|delete|confirm|complete|equip)$|^(set-quest-status|toggle-quest-task|alchemy-finish-distill|geode-finish)$/;
    const longVibeActions = [
      'roll-request-send',
      'roll-skill', 'roll-custom-skill', 'roll-attr', 'roll-init',
      'roll-weapon-attack', 'roll-weapon', 'roll-training', 'roll-summon-action',
      'roll-tame', 'open-free-dice', 'cast-spell', 'grant-level'
    ];

    document.addEventListener('pointerdown', function (e) {
      try {
        if (!e.target || !(e.target instanceof Element)) return;
        const host = e.target.closest('.btn-compact, .btn-solid-gold, .btn, .tab-btn, .k-seg button, .fab-dice, [data-action]');
        if (!host) return;

        if (host.disabled || host.hasAttribute('disabled') || host.classList.contains('disabled')) return;
        if (host.getAttribute('aria-disabled') === 'true') return;
        if (isExcluded(host)) return;

        // Vibración
        const actionEl = host.hasAttribute('data-action') ? host : host.closest('[data-action]');
        const action = actionEl ? actionEl.getAttribute('data-action') : '';

        // Una sola vibración por toque: la del nivel más alto
        if (host.classList.contains('fab-dice') || (action && longVibeActions.indexOf(action) !== -1)) {
          vibrar([20, 40, 40]);
        } else if (action && midVibeRe.test(action)) {
          vibrar(15);
        } else if (action || host.matches('.tab-btn, .k-seg button, .k-seg-btn, .dmode-pill, .skills-view-btn, .backpack-tab-btn')) {
          vibrar(7);
        }

        // Ripple visual (solo si animOn())
        if (animOn()) {
          const quitaPos = getComputedStyle(host).position === 'static';
          if (quitaPos) host.style.position = 'relative';
          host.classList.add('juice-host');
          const rect = host.getBoundingClientRect();
          const span = document.createElement('span');
          span.className = 'juice-ripple';

          const size = Math.max(rect.width, rect.height, 40);
          span.style.width = size + 'px';
          span.style.height = size + 'px';

          const x = (e.clientX !== undefined && rect.width) ? (e.clientX - rect.left) : (rect.width / 2);
          const y = (e.clientY !== undefined && rect.height) ? (e.clientY - rect.top) : (rect.height / 2);

          span.style.left = x + 'px';
          span.style.top = y + 'px';

          host.appendChild(span);

          setTimeout(function () {
            try {
              if (span.parentNode) span.parentNode.removeChild(span);
              if (!host.querySelector('.juice-ripple')) {
                host.classList.remove('juice-host');
                if (quitaPos) host.style.position = '';
              }
            } catch (_) {}
          }, 450);
        }
      } catch (_) {}
    }, { passive: true });

    // ----------------------------------------------------
    // 7. Click listener para pulsos (arcane / alchemy)
    // ----------------------------------------------------
    document.addEventListener('click', function (e) {
      try {
        if (!e.target || !(e.target instanceof Element)) return;
        if (isExcluded(e.target)) return;
        const btn = e.target.closest('[data-action]');
        if (!btn || isExcluded(btn)) return;

        const action = btn.getAttribute('data-action') || '';
        if (action === 'cast-spell') {
          setTimeout(function () {
            try {
              const card = btn.closest('.spell-card, .section, .summon-card');
              if (card) pulso(card, 'arcane');
            } catch (_) {}
          }, 0);
        } else if (action.indexOf('alchemy-craft') === 0 || action.indexOf('alchemy-consume') === 0) {
          setTimeout(function () {
            try {
              const card = btn.closest('.alchemy-card, .section, [class*="alchemy"]') || btn;
              if (card) pulso(card, 'alchemy');
            } catch (_) {}
          }, 0);
        }
      } catch (_) {}
    }, { passive: true });

    // ----------------------------------------------------
    // 8. MutationObserver: Números, Pestañas y Tarjetas
    // ----------------------------------------------------
    const ultimos = new Map();
    const vistas = new Set();
    let lastCharName = null;
    let lastActiveTab = null;
    let rafPending = false;
    let pendingMutations = [];

    function animateNum(el, cls) {
      try {
        if (!animOn()) return;
        el.classList.remove('juice-up', 'juice-down', 'juice-gold');
        void el.offsetWidth;
        el.classList.add('juice-num', cls);
        const barra = el.closest('.gauge-wrap');
        const gauge = barra ? barra.querySelector('.gauge') : null;
        if (gauge) {
          gauge.classList.remove('juice-gauge-glow');
          void gauge.offsetWidth;
          gauge.classList.add('juice-gauge-glow');
          setTimeout(function () {
            try { gauge.classList.remove('juice-gauge-glow'); } catch (_) {}
          }, 650);
        }

        let done = false;
        const clean = function () {
          if (done) return;
          done = true;
          el.classList.remove('juice-num', 'juice-up', 'juice-down', 'juice-gold');
          el.removeEventListener('animationend', clean);
        };
        el.addEventListener('animationend', clean, { once: true });
        setTimeout(clean, 400);
      } catch (_) {}
    }

    function checkNumberChange(el, key) {
      try {
        const currentText = (el.textContent || '').trim();
        if (!ultimos.has(key)) {
          ultimos.set(key, currentText);
          return;
        }
        const prevText = ultimos.get(key);
        if (prevText === currentText) return;
        ultimos.set(key, currentText);

        const prevMatch = prevText.match(/-?\d+(\.\d+)?/);
        const curMatch = currentText.match(/-?\d+(\.\d+)?/);
        if (!prevMatch || !curMatch) return;

        const prevNum = parseFloat(prevMatch[0]);
        const curNum = parseFloat(curMatch[0]);
        if (isNaN(prevNum) || isNaN(curNum) || prevNum === curNum) return;

        if (curNum > prevNum) {
          animateNum(el, 'juice-up');
        } else if (curNum < prevNum) {
          animateNum(el, 'juice-down');
        }
      } catch (_) {}
    }

    function processMutations() {
      rafPending = false;
      const mutations = pendingMutations;
      pendingMutations = [];

      try {
        let rearmar = false;
        // 8.1. Verificar cambio de personaje activo
        const charNameEl = document.querySelector('.char-name');
        const currentCharName = charNameEl ? charNameEl.textContent.trim() : '';
        if (lastCharName === null) {
          lastCharName = currentCharName;
        } else if (currentCharName && currentCharName !== lastCharName) {
          lastCharName = currentCharName;
          ultimos.clear();
          vistas.clear();
          rearmar = true;
        }

        // 8.2. Cambio de pestaña activa
        const currentTab = (typeof state !== 'undefined' && state && state.activeTab) ? state.activeTab : null;
        if (lastActiveTab === null) {
          lastActiveTab = currentTab;
        } else if (currentTab && currentTab !== lastActiveTab) {
          lastActiveTab = currentTab;
          rearmar = true;
          if (animOn()) {
            const mainEl = document.querySelector('#main');
            if (mainEl && !isExcluded(mainEl)) {
              mainEl.classList.add('juice-view-in');
              setTimeout(function () {
                try {
                  mainEl.classList.remove('juice-view-in');
                } catch (_) {}
              }, 200);
            }
          }
        }

        // 8.3. Tarjetas nuevas añadidas en este lote
        const newCards = [];
        const cardSelector = '[data-juice-card]';
        for (let m = 0; m < mutations.length; m++) {
          const mut = mutations[m];
          if (!mut.addedNodes || !mut.addedNodes.length) continue;
          for (let n = 0; n < mut.addedNodes.length; n++) {
            const node = mut.addedNodes[n];
            if (node.nodeType !== 1) continue;
            if (isExcluded(node)) continue;

            const targets = [];
            if (node.matches && node.matches(cardSelector)) {
              targets.push(node);
            }
            if (node.querySelectorAll) {
              const sub = node.querySelectorAll(cardSelector);
              for (let s = 0; s < sub.length; s++) {
                targets.push(sub[s]);
              }
            }

            for (let t = 0; t < targets.length; t++) {
              const card = targets[t];
              if (isExcluded(card)) continue;
              const id = card.getAttribute('data-juice-card');
              if (id && !vistas.has(id)) {
                vistas.add(id);
                newCards.push(card);
              }
            }
          }
        }

        // Al abrir otra pestaña o ficha todo se repinta: se anotan las tarjetas sin animarlas
        if (rearmar) {
          document.querySelectorAll('[data-juice-card]').forEach(function (el) {
            const id = el.getAttribute('data-juice-card');
            if (id) vistas.add(id);
          });
          newCards.length = 0;
        }

        // Primer pintado de una lista de tiradas: no es una tirada nueva
        if (newCards.length > 1) {
          for (let c = newCards.length - 1; c >= 0; c--) {
            const par = newCards[c].parentNode;
            if ((newCards[c].getAttribute('data-juice-card') || '').charAt(0) === 'r' && par && par.querySelectorAll('[data-juice-card]').length === newCards.length) {
              newCards.splice(c, 1);
            }
          }
        }

        if (newCards.length > 0 && newCards.length <= 6 && animOn()) {
          for (let c = 0; c < newCards.length; c++) {
            const card = newCards[c];
            card.classList.add('juice-card-new');
            setTimeout(function () {
              try {
                card.classList.remove('juice-card-new');
              } catch (_) {}
            }, 600);
          }
        }

        // 8.4. Vigilar .gauge-nums y [data-juice-key]
        const gaugeElements = document.querySelectorAll('.gauge-nums');
        for (let g = 0; g < gaugeElements.length; g++) {
          const el = gaugeElements[g];
          if (!isExcluded(el)) {
            checkNumberChange(el, g + 'g');
          }
        }

        const subEl = document.querySelector('.char-sub');
        const nvMatch = subEl ? (subEl.textContent || '').match(/Nv\.\s*(\d+)/) : null;
        if (nvMatch) {
          const nv = parseInt(nvMatch[1], 10);
          if (ultimos.has('nivel') && nv > ultimos.get('nivel')) {
            levelUp(subEl);
            vibrar([20, 40, 40]);
          }
          ultimos.set('nivel', nv);
        } else {
          ultimos.delete('nivel');
        }

        const customKeyElements = document.querySelectorAll('[data-juice-key]');
        for (let k = 0; k < customKeyElements.length; k++) {
          const el = customKeyElements[k];
          if (!isExcluded(el)) {
            const key = el.getAttribute('data-juice-key');
            if (key) checkNumberChange(el, key);
          }
        }
      } catch (_) {}
    }

    function onMutations(mutations) {
      try {
        for (let i = 0; i < mutations.length; i++) {
          pendingMutations.push(mutations[i]);
        }
        if (!rafPending) {
          rafPending = true;
          requestAnimationFrame(processMutations);
        }
      } catch (_) {}
    }

    function initObserver() {
      try {
        const mainEl = document.querySelector('#main');
        const headerEl = document.querySelector('#topbar');

        // Registrar tarjetas iniciales en vistas para evitar animaciones masivas al abrir la app
        const cardSelector = '[data-juice-card]';
        document.querySelectorAll(cardSelector).forEach(function (el) {
          const id = el.getAttribute('data-juice-card');
          if (id) vistas.add(id);
        });

        // Registrar números y gauges iniciales
        document.querySelectorAll('.gauge-nums').forEach(function (el, idx) {
          ultimos.set(idx + 'g', (el.textContent || '').trim());
        });
        document.querySelectorAll('[data-juice-key]').forEach(function (el) {
          const k = el.getAttribute('data-juice-key');
          if (k) ultimos.set(k, (el.textContent || '').trim());
        });

        // Registrar personaje activo inicial
        const charNameEl = document.querySelector('.char-name');
        if (charNameEl) {
          lastCharName = charNameEl.textContent.trim();
        }

        // Registrar pestaña activa inicial
        if (typeof state !== 'undefined' && state && state.activeTab) {
          lastActiveTab = state.activeTab;
        }

        const observer = new MutationObserver(onMutations);
        const config = { characterData: true, childList: true, subtree: true };

        if (mainEl) observer.observe(mainEl, config);
        if (headerEl) observer.observe(headerEl, config);
      } catch (_) {}
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initObserver);
    } else {
      initObserver();
    }

    // ----------------------------------------------------
    // 8b. Ventanas que crecen desde su botón y se encogen hacia él
    // ----------------------------------------------------
    var ORIGEN = { x: 0, y: 0, t: 0, ok: false };
    var cerrando = [];
    var OVERLAYS = ['charModalOverlay', 'charSoundModalOverlay', 'diceModalOverlay', 'dataModalOverlay', 'pinModalOverlay', 'loreModalOverlay', 'conflictModalOverlay', 'feedbackModalOverlay', 'lapidaryModalOverlay', 'addStoneModalOverlay'];

    function sinMovimiento() {
      try {
        return !animOn() || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      } catch (_) {
        return !animOn();
      }
    }

    function fijarOrigen(overlay) {
      var box = overlay.firstElementChild;
      if (!box) return;
      var r = box.getBoundingClientRect();
      var ox = r.width / 2, oy = r.height / 2;
      if (ORIGEN.ok && Date.now() - ORIGEN.t < 2500 && r.width > 0) {
        ox = Math.max(0, Math.min(r.width, ORIGEN.x - r.left));
        oy = Math.max(0, Math.min(r.height, ORIGEN.y - r.top));
      }
      box.style.transformOrigin = ox + 'px ' + oy + 'px';
    }

    function terminarCierre(item) {
      var i = cerrando.indexOf(item);
      if (i < 0) return;
      cerrando.splice(i, 1);
      clearTimeout(item.timer);
      item.overlay.classList.remove('juice-menu-out');
      item.overlay.classList.add('hidden');
      item.overlay._juiceOculto = true;
    }

    function onOverlayClass(overlay, oculto) {
      if (sinMovimiento()) return;
      if (!oculto) {
        // se acaba de abrir
        for (var k = cerrando.length - 1; k >= 0; k--) if (cerrando[k].overlay === overlay) terminarCierre(cerrando[k]);
        overlay.classList.remove('juice-menu-out');
        fijarOrigen(overlay);
        overlay.classList.add('juice-menu-in');
        setTimeout(function () { overlay.classList.remove('juice-menu-in'); }, 320);
      } else {
        // se acaba de ocultar: se devuelve a la vista el tiempo de la animación de cierre
        overlay.classList.remove('hidden');
        overlay._juiceOculto = false;
        overlay.classList.remove('juice-menu-in');
        fijarOrigen(overlay);
        overlay.classList.add('juice-menu-out');
        var item = { overlay: overlay, timer: 0 };
        cerrando.push(item);
        var fin = function () { terminarCierre(item); };
        var box = overlay.firstElementChild;
        if (box) box.addEventListener('animationend', function f(e) { if (e.target !== box) return; box.removeEventListener('animationend', f); fin(); });
        item.timer = setTimeout(fin, 300);
      }
    }

    function initMenus() {
      try {
        document.addEventListener('pointerdown', function (e) {
          // un toque nuevo termina al instante cualquier cierre a medias, para que no se coma el siguiente abrir
          cerrando.slice().forEach(terminarCierre);
          var t = e.target && e.target.closest ? e.target.closest('button, [data-action]') : null;
          if (t) {
            var r = t.getBoundingClientRect();
            ORIGEN = { x: r.left + r.width / 2, y: r.top + r.height / 2, t: Date.now(), ok: true };
          }
        }, true);
        OVERLAYS.forEach(function (id) {
          var ov = document.getElementById(id);
          if (!ov) return;
          ov._juiceOculto = ov.classList.contains('hidden');
          new MutationObserver(function () {
            var ahora = ov.classList.contains('hidden');
            if (ahora === ov._juiceOculto) return;
            ov._juiceOculto = ahora;
            onOverlayClass(ov, ahora);
          }).observe(ov, { attributes: true, attributeFilter: ['class'] });
        });
      } catch (_) {}
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initMenus);
    } else {
      initMenus();
    }

    // ----------------------------------------------------
    // 9. Exportación pública en window.UIJuice
    // ----------------------------------------------------
    window.UIJuice = {
      vibrar: vibrar,
      pulso: pulso,
      levelUp: levelUp,
      setAnim: setAnim,
      setVib: setVib,
      animOn: animOn,
      vibOn: vibOn
    };
  } catch (_) {}
})();
