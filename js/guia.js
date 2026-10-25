// Ajustes › Cómo funciona: guía de reglas para jugadores. Los números de los ejemplos salen de js/reglas.js
var GUIA_TEMAS = [
  { id: "tiradas", ico: "🎲", titulo: "Tiradas",
    texto: ["TODO"],
    ejemplo: function(R){
      var c = R.reglasCritPifia(20, 20, false, 20), p = R.reglasCritPifia(20, 1, false, 1);
      return "Sacas un " + 20 + " natural en un d20: " + (c.isCrit ? "es crítico" : "no es crítico") + ". Sacas un 1: " + (p.isFumble ? "es pifia" : "no es pifia") + ".";
    } },
  { id: "entrenamiento", ico: "🎯", titulo: "Entrenamiento",
    texto: ["TODO"],
    ejemplo: function(R){
      var a = R.reglasEntrenamiento(false, 15, 20), b = R.reglasEntrenamiento(false, 5, 20), c = R.reglasEntrenamiento(false, 1, 20), d = R.reglasEntrenamiento(false, 20, 20);
      return "Dado 15: " + a.ptsText + ". Dado 5: " + b.ptsText + ". Dado 20 (crítico): " + d.ptsText + ". Dado 1 (pifia): " + c.ptsText + ".";
    } },
  { id: "defensa", ico: "🛡️", titulo: "Defensa",
    texto: ["TODO"],
    ejemplo: function(R){
      return "Con Destreza 3 y Esquivar 2, tu Defensa es " + R.reglasDefensaBase(3, 2) + " (3 + 2 + 5).";
    } },
  { id: "descanso", ico: "🌙", titulo: "Descanso largo",
    texto: ["TODO"],
    ejemplo: function(R){
      var quedan = R.reglasBuffosTrasDescanso([{ id: "a" }, { id: "b" }, { id: "c" }], ["b"]).length;
      return "Tienes 3 buffos y uno está marcado para reiniciarse al descansar: tras el descanso te quedan " + quedan + ".";
    } },
  { id: "buffos", ico: "✨", titulo: "Buffos y debuffos",
    texto: ["TODO"] },
  { id: "dinero", ico: "💰", titulo: "Dinero",
    texto: ["TODO"] }
];

function guiaHtml(R, filtro){
  var q = (filtro || "").toLowerCase();
  var html = '<div class="settings-panel"><input type="search" class="guia-buscar" id="guiaBuscar" placeholder="Buscar en la guía…" aria-label="Buscar en la guía" value="' + esc(filtro || "") + '"></div>';
  var n = 0;
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
  if(!n) html += '<div class="settings-note">No hay nada con esa palabra.</div>';
  return html;
}

if(typeof module !== "undefined" && module.exports){
  module.exports = { GUIA_TEMAS: GUIA_TEMAS };
}
