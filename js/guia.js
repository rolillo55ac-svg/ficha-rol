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
  { id: "nivel", ico: "⬆️", titulo: "Subir de nivel",
    texto: [
      "Quien te sube de nivel es el máster, con su botón de +Nivel. Tú no puedes subirte solo.",
      "Cada nivel te da puntos de habilidad para repartir: 4 puntos hasta el nivel 10, 6 del nivel 11 al 20 y 8 a partir del 21.",
      "Tu vida máxima sube la mitad de tu Físico (redondeando hacia arriba, y como mínimo 1), y tu vida se rellena del todo. Cada cuatro niveles (4, 8, 12...) tu maná máximo sube 5.",
      "Los puntos por repartir los gastas en tu pestaña de Habilidades. Si el máster baja un nivel, se te quita lo que habías ganado con él, y para hacerlo tiene que confirmarlo."
    ],
    ejemplo: function(R){
      var a = R.reglasSubidaNivel(5, 4), b = R.reglasSubidaNivel(8, 4);
      return "Con Físico 4, al llegar al nivel 5 ganas " + a.puntos + " puntos y +" + a.vida + " de vida máxima. Al llegar al nivel 8 ganas además +" + b.mana + " de maná máximo.";
    } },
  { id: "dinero", ico: "💰", titulo: "Dinero",
    texto: [
      "Tu personaje maneja tres monedas: oro, plata y moneda de gremio. Diez de plata equivalen a uno de oro. La moneda de gremio es aparte: no se cambia por oro ni por plata.",
      "El cambio entre oro y plata se hará en Comercio, que todavía no está disponible.",
      "El dinero lo pueden mover el dueño de la ficha y el máster. Con los botones sumas o restas 1, 5, 10 o 25. Tu saldo nunca baja de 0.",
      "Si restas una cantidad grande se te pedirá confirmación y siempre tendrás unos segundos para deshacer. Todos los movimientos quedan apuntados en \"Últimos movimientos\"."
    ],
    ejemplo: function(R){
      var c = R.reglasCambioPlata(25);
      return "25 de plata equivalen a " + c.oro + " de oro y " + c.sobra + " de plata.";
    } },
  { id: "extras", ico: "🧭", titulo: "Iniciativa, Movilidad y Defensa mágica",
    texto: [
      "Estos tres valores los pone el máster en tu ficha. De momento no se calculan solos.",
      "Lo que sí se calcula solo es tu Defensa: Esquivar base más 5, sin contar buffos."
    ] },
  { id: "casa", ico: "🏠", titulo: "La Casa",
    texto: [
      "La Casa es una casa mágica que cambia con la partida: sube de nivel y da buffos.",
      "El plano (estancias, tamaños y muebles) solo lo cambian el máster y el admin. Los jugadores la veis y podéis usar el baúl de cada estancia.",
      "Cada jugador tiene su propia habitación. El máster puede darte permiso para editar la casa, jugador a jugador, y es quien gestiona los buffos de La Casa."
    ] },
  { id: "lapidario", ico: "💎", titulo: "Lapidario",
    texto: [
      "Tallar una piedra en bruto es un minijuego de cuatro pasos.",
      "1. Desbaste: quitas la costra de la geoda sin golpear las fisuras. Cuantas menos fisuras toques, mejor nota.",
      "2. Cortes: mueves la sierra por la piedra manteniéndote dentro de la línea; rozar el borde o ir fuera baja la nota.",
      "3. Pulido: en cada pasada pulsas Pulir cuando la línea blanca pasa por la zona dorada, y cada pasada va más rápido.",
      "4. Veredicto: ves la nota de cada paso, el riesgo de rotura y se hace una tirada de calidad (1d10 más bonos). La piedra queda esperando al máster, que decide si aguanta o se rompe; tú lo ves en cuanto lo decide."
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
