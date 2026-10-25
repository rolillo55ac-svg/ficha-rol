// Reglas del juego en un solo sitio: funciones puras, sin pantalla ni base de datos

// Crítico y pifia por el dado natural (nunca por el total).
// En daño cuenta el primer dado; en las demás tiradas, el dado elegido.
function reglasCritPifia(sides, natural, esDano, primerDado){
  var d = esDano ? primerDado : natural;
  return { isCrit: d === sides, isFumble: d === 1 };
}

// Puntos de una tirada de entrenamiento según el dado natural (1 = pifia, máximo = crítico)
function reglasEntrenamiento(narrativo, roll, sides){
  var delta = 0, isCrit = false, isFumble = false;
  if(roll === 1){
    delta = narrativo ? 0 : -5;
    isFumble = !narrativo;
  } else if(roll === sides){
    delta = 5;
    isCrit = true;
  } else if(roll >= 11 && roll <= 19){
    delta = 3;
  } else if(narrativo || (roll >= 2 && roll <= 10)){
    delta = 1;
  }
  var ptsText = (delta >= 0 ? "+" + delta : delta) + " pto" + (Math.abs(delta) === 1 ? "" : "s");
  return { delta: delta, isCrit: isCrit, isFumble: isFumble, ptsText: ptsText };
}

// Defensa base: Destreza + Esquivar + 5 (los estados no la cambian)
function reglasDefensaBase(destreza, esquivar){
  return (parseFloat(destreza) || 0) + (parseFloat(esquivar) || 0) + 5;
}

// Buffos que quedan tras el descanso largo: se quitan los marcados para reiniciarse
function reglasBuffosTrasDescanso(buffos, idsQuitar){
  return (buffos || []).filter(function(b){ return (idsQuitar || []).indexOf(b.id) === -1; });
}

// Lo que gana un personaje al subir a nivelNuevo: puntos de habilidad, vida máxima y maná máximo
function reglasSubidaNivel(nivelNuevo, fisico){
  var puntos = nivelNuevo > 20 ? 8 : (nivelNuevo > 10 ? 6 : 4);
  var vida = Math.max(1, Math.ceil((parseFloat(fisico) || 0) / 2));
  return { puntos: puntos, vida: vida, mana: nivelNuevo % 4 === 0 ? 5 : 0 };
}

// Cambio de moneda: 10 de plata = 1 de oro
function reglasCambioPlata(plata){
  var p = Math.max(0, Math.floor(parseFloat(plata) || 0));
  return { oro: Math.floor(p / 10), sobra: p % 10 };
}

if(typeof module !== "undefined" && module.exports){
  module.exports = { reglasCritPifia: reglasCritPifia, reglasEntrenamiento: reglasEntrenamiento, reglasDefensaBase: reglasDefensaBase, reglasBuffosTrasDescanso: reglasBuffosTrasDescanso, reglasSubidaNivel: reglasSubidaNivel, reglasCambioPlata: reglasCambioPlata };
}
