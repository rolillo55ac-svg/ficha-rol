// Ajustes › Cómo funciona: guía de reglas para jugadores. Los números de los ejemplos salen de js/reglas.js
var GUIA_TEMAS = [
  { id: "tiradas", ico: "🎲", titulo: "Tiradas",
    texto: [
      "Cuando haces una tirada, el resultado total se calcula sumando el valor de tu dado natural y tus modificadores.",
      "El crítico y la pifia dependen siempre de lo que marque el dado natural, nunca del total con modificadores. En una tirada normal, sacar el número máximo del dado es un crítico, mientras que sacar un 1 es una pifia.",
      "Si estás tirando daño, únicamente cuenta el resultado del primer dado lanzado para determinar si hay crítico o pifia."
    ],
    ejemplo: function(R){
      var c = R.reglasCritPifia(20, 20, false, 20), p = R.reglasCritPifia(20, 1, false, 1);
      return "Sacas un " + 20 + " natural en un d20: " + (c.isCrit ? "es crítico" : "no es crítico") + ". Sacas un 1: " + (p.isFumble ? "es pifia" : "no es pifia") + ".";
    } },
  { id: "entrenamiento", ico: "🎯", titulo: "Entrenamiento",
    texto: [
      "Cada tirada de entrenamiento te otorga puntos de progreso en función de lo que marque tu dado natural.",
      "En una tirada estándar, si sacas el máximo del dado consigues un crítico (+5 puntos), de 11 a 19 obtienes +3 puntos, de 2 a 10 recibes +1 punto, y un 1 es una pifia que te resta 5 puntos.",
      "En los entrenamientos narrativos las reglas cambian un poco: sacar un 1 no te resta puntos (te da 0), y cualquier otro resultado que no sea crítico ni esté entre 11 y 19 te dará +1 punto."
    ],
    ejemplo: function(R){
      var a = R.reglasEntrenamiento(false, 15, 20), b = R.reglasEntrenamiento(false, 5, 20), c = R.reglasEntrenamiento(false, 1, 20), d = R.reglasEntrenamiento(false, 20, 20);
      return "Dado 15: " + a.ptsText + ". Dado 5: " + b.ptsText + ". Dado 20 (crítico): " + d.ptsText + ". Dado 1 (pifia): " + c.ptsText + ".";
    } },
  { id: "defensa", ico: "🛡️", titulo: "Defensa",
    texto: [
      "Tu valor de Defensa se calcula sumando tu puntuación de Destreza más tu habilidad de Esquivar más 5.",
      "Esta cifra representa tu defensa base fija, por lo que ningún buffo ni estado la alterará."
    ],
    ejemplo: function(R){
      return "Con Destreza 3 y Esquivar 2, tu Defensa es " + R.reglasDefensaBase(3, 2) + " (3 + 2 + 5).";
    } },
  { id: "descanso", ico: "🌙", titulo: "Descanso largo",
    texto: [
      "El descanso largo es una acción realizada por el máster, quien se encarga de seleccionar qué personajes descansan.",
      "Al completarse, tu vida y tu maná se restauran al valor máximo, y cualquier escudo que tuvieras pasa a ser 0.",
      "Asimismo, este descanso elimina de tu ficha todos los buffos que estén marcados para resetearse al descansar largo."
    ],
    ejemplo: function(R){
      var quedan = R.reglasBuffosTrasDescanso([{ id: "a" }, { id: "b" }, { id: "c" }], ["b"]).length;
      return "Tienes 3 buffos y uno está marcado para reiniciarse al descansar: tras el descanso te quedan " + quedan + ".";
    } },
  { id: "buffos", ico: "✨", titulo: "Buffos y debuffos",
    texto: [
      "Los buffos y debuffos son efectos temporales o permanentes que se aplican directamente sobre tu ficha.",
      "Pueden durar un número determinado de turnos o permanecer de forma indefinida, y algunos de ellos se reinician cuando realizas un descanso largo."
    ] },
  { id: "dinero", ico: "💰", titulo: "Dinero",
    texto: [
      "Tu personaje puede manejar tres tipos de moneda: oro, plata y moneda de gremio. Tu saldo no puede ser inferior a 0.",
      "Cuentas con botones que te permiten sumar o restar cantidades fijas de 1, 5, 10 o 25 directamente a tus fondos.",
      "Si reduces una gran cantidad de golpe se te pedirá confirmación, y siempre dispondrás durante unos segundos de la opción de deshacer. Además, todos los movimientos quedan debidamente apuntados."
    ] }
];

function guiaLista(R, filtro){
  var q = (filtro || "").toLowerCase().trim();
  var html = "", n = 0;
  GUIA_TEMAS.forEach(function(t){
    var ej = t.ejemplo ? t.ejemplo(R) : "";
    var plano = (t.titulo + " " + t.texto.join(" ") + " " + ej).toLowerCase();
    if(q && plano.indexOf(q) === -1) return;
    n++;
    html += '<details class="guia-tema settings-panel"' + (q ? ' open' : '') + '>' +
      '<summary class="guia-tema-head"><span class="settings-row-ico">' + t.ico + '</span><span class="settings-row-title">' + esc(t.titulo) + '</span><span class="settings-row-chev">›</span></summary>' +
      t.texto.map(function(p){ return '<p class="guia-p">' + esc(p) + '</p>'; }).join("") +
      (ej ? '<div class="settings-note guia-ejemplo"><b>Ejemplo:</b> ' + esc(ej) + '</div>' : '') +
    '</details>';
  });
  if(!n) html = '<div class="settings-note">No hay nada con esa palabra.</div>';
  return html;
}

function guiaHtml(R){
  return '<input type="search" class="guia-buscar" id="guiaBuscar" placeholder="Buscar en la guía…" aria-label="Buscar en la guía" autocomplete="off">' +
    '<div id="guiaLista">' + guiaLista(R, "") + '</div>';
}

if(typeof document !== "undefined"){
  document.addEventListener("input", function(e){
    if(!e.target || e.target.id !== "guiaBuscar") return;
    var l = document.getElementById("guiaLista");
    if(l) l.innerHTML = guiaLista(window, e.target.value);
  });
}

if(typeof module !== "undefined" && module.exports){
  module.exports = { GUIA_TEMAS: GUIA_TEMAS, guiaLista: guiaLista };
}
