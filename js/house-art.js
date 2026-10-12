// ============================================================================
// DIBUJOS DE MUEBLES DE LA CASA (vista cenital, estilo mapa de rol pintado)
// drawHouseItemSVG(tipo, ancho, alto, opciones) devuelve un SVG que se rehace con el
// tamaño (en casillas, admite medias casillas) en lugar de estirarse. Luz desde arriba a la izquierda.
// opciones: { rotation, cellPx, ownerColor, simple, seed, label }
// ============================================================================
var HART_U = 40; // unidades SVG por casilla

var HART = {
  out: "#2A1A10",
  woodL: "#C08A55", wood: "#8F5E36", woodD: "#5E3B20",
  goldL: "#DEC392", gold: "#B08D57", goldD: "#7A5F35",
  ironL: "#8C8B90", iron: "#5B5A60", ironD: "#35343A",
  redL: "#B4434D", red: "#8C252F", redD: "#5E1820",
  tealL: "#62998A", teal: "#3D6E60", tealD: "#274A40",
  stoneL: "#A29C90", stone: "#7A756C", stoneD: "#4F4B45",
  paper: "#E9DAB4", paperD: "#C4AE82",
  cloth: "#ECE4D2", clothD: "#BFB39B",
  leafL: "#86AD5E", leaf: "#557F3C", leafD: "#30502A",
  fireL: "#F7CF6A", fire: "#E58A2E", fireD: "#A9441D",
  clayL: "#C9805A", clay: "#A15E3D", clayD: "#6E3B26",
  furL: "#9A7350", fur: "#6F4E33", furD: "#45301F"
};
var HART_WOOD = [HART.woodL, HART.wood, HART.woodD];
var HART_WOOD_DARK = ["#9A6A40", "#6B4527", "#432A16"];
var HART_IRON = [HART.ironL, HART.iron, HART.ironD];
var HART_STONE = [HART.stoneL, HART.stone, HART.stoneD];
var HART_BOOKS = ["#8C252F", "#3D6E60", "#7A5F35", "#4A5A78", "#6B3A2A", "#B08D57", "#5E1820", "#2F5148", "#8A6A3C"];

function hartN(n){ return Math.round(n * 10) / 10; }

function hartAttrs(o){
  var s = "";
  for(var k in o){
    if(o[k] === undefined || o[k] === null) continue;
    s += " " + k + '="' + (typeof o[k] === "number" ? hartN(o[k]) : o[k]) + '"';
  }
  return s;
}

function hartRect(x, y, w, h, fill, o){
  o = o || {};
  return '<rect' + hartAttrs({ x: x, y: y, width: Math.max(0, w), height: Math.max(0, h), rx: o.rx, fill: fill, stroke: o.stroke, "stroke-width": o.sw, opacity: o.op }) + '/>';
}

function hartCircle(cx, cy, r, fill, o){
  o = o || {};
  return '<circle' + hartAttrs({ cx: cx, cy: cy, r: Math.max(0, r), fill: fill, stroke: o.stroke, "stroke-width": o.sw, opacity: o.op }) + '/>';
}

function hartEllipse(cx, cy, rx, ry, fill, o){
  o = o || {};
  return '<ellipse' + hartAttrs({ cx: cx, cy: cy, rx: Math.max(0, rx), ry: Math.max(0, ry), fill: fill, stroke: o.stroke, "stroke-width": o.sw, opacity: o.op }) + '/>';
}

function hartLine(x1, y1, x2, y2, stroke, sw, o){
  o = o || {};
  return '<line' + hartAttrs({ x1: x1, y1: y1, x2: x2, y2: y2, stroke: stroke, "stroke-width": sw || 1, "stroke-linecap": o.cap || "round", opacity: o.op, "stroke-dasharray": o.dash }) + '/>';
}

function hartPath(d, fill, o){
  o = o || {};
  return '<path' + hartAttrs({ d: d, fill: fill || "none", stroke: o.stroke, "stroke-width": o.sw, "stroke-linecap": o.cap, "stroke-linejoin": o.join, opacity: o.op, "stroke-dasharray": o.dash }) + '/>';
}

// Pieza con volumen: sombra abajo a la derecha, borde claro arriba a la izquierda, contorno oscuro
function hartBlock(x, y, w, h, c, rx){
  rx = rx || 2;
  var s = hartRect(x + 1.8, y + 2.2, w, h, "rgba(0,0,0,0.32)", { rx: rx });
  s += hartRect(x, y, w, h, c[1], { rx: rx, stroke: HART.out, sw: 1.2 });
  if(w > 6 && h > 6){
    s += hartPath("M" + hartN(x + 1.6) + " " + hartN(y + h - 2.5) + "V" + hartN(y + 1.6) + "H" + hartN(x + w - 2.5), "none", { stroke: c[0], sw: 1.4, op: 0.75, cap: "round" });
    s += hartPath("M" + hartN(x + 2.5) + " " + hartN(y + h - 1.6) + "H" + hartN(x + w - 1.6) + "V" + hartN(y + 2.5), "none", { stroke: c[2], sw: 1.4, op: 0.8, cap: "round" });
  }
  return s;
}

function hartRoundBlock(cx, cy, r, c){
  var s = hartCircle(cx + 1.6, cy + 2, r, "rgba(0,0,0,0.32)");
  s += hartCircle(cx, cy, r, c[1], { stroke: HART.out, sw: 1.2 });
  if(r > 4){
    s += hartPath("M" + hartN(cx - r * 0.75) + " " + hartN(cy + r * 0.2) + "A" + hartN(r * 0.78) + " " + hartN(r * 0.78) + " 0 0 1 " + hartN(cx + r * 0.2) + " " + hartN(cy - r * 0.75), "none", { stroke: c[0], sw: 1.4, op: 0.7, cap: "round" });
  }
  return s;
}

// Vetas de madera a lo largo del lado largo, con semilla fija
function hartGrain(x, y, w, h, rnd, color){
  var s = "";
  var horiz = w >= h;
  var len = horiz ? w : h;
  var across = horiz ? h : w;
  var n = Math.max(1, Math.floor(across / 7));
  for(var i = 0; i < n; i++){
    var off = (i + 0.5 + (rnd() - 0.5) * 0.5) * across / n;
    var a = 3 + rnd() * len * 0.25;
    var b = len - 3 - rnd() * len * 0.25;
    if(b - a < 4) continue;
    s += horiz
      ? hartLine(x + a, y + off, x + b, y + off, color || HART.woodD, 0.7, { op: 0.45 })
      : hartLine(x + off, y + a, x + off, y + b, color || HART.woodD, 0.7, { op: 0.45 });
  }
  return s;
}

// Tablones separados por juntas
function hartPlanks(x, y, w, h, count, horiz, color){
  var s = "";
  for(var i = 1; i < count; i++){
    s += horiz
      ? hartLine(x + 1, y + i * h / count, x + w - 1, y + i * h / count, color || HART.woodD, 0.9, { op: 0.7 })
      : hartLine(x + i * w / count, y + 1, x + i * w / count, y + h - 1, color || HART.woodD, 0.9, { op: 0.7 });
  }
  return s;
}

function hartRivets(x, y, w, h, inset, r){
  return hartCircle(x + inset, y + inset, r, HART.goldL, { stroke: HART.goldD, sw: 0.6 }) +
    hartCircle(x + w - inset, y + inset, r, HART.goldL, { stroke: HART.goldD, sw: 0.6 }) +
    hartCircle(x + inset, y + h - inset, r, HART.goldL, { stroke: HART.goldD, sw: 0.6 }) +
    hartCircle(x + w - inset, y + h - inset, r, HART.goldL, { stroke: HART.goldD, sw: 0.6 });
}

// Escuadras de hierro en las esquinas
function hartCorners(x, y, w, h, len, color){
  var c = color || HART.ironD;
  var o = { stroke: c, sw: 2.2, cap: "square", join: "miter" };
  return hartPath("M" + hartN(x + 1.5) + " " + hartN(y + len) + "V" + hartN(y + 1.5) + "H" + hartN(x + len), "none", o) +
    hartPath("M" + hartN(x + w - len) + " " + hartN(y + 1.5) + "H" + hartN(x + w - 1.5) + "V" + hartN(y + len), "none", o) +
    hartPath("M" + hartN(x + 1.5) + " " + hartN(y + h - len) + "V" + hartN(y + h - 1.5) + "H" + hartN(x + len), "none", o) +
    hartPath("M" + hartN(x + w - len) + " " + hartN(y + h - 1.5) + "H" + hartN(x + w - 1.5) + "V" + hartN(y + h - len), "none", o);
}

// Llama con brillo suave (animado por CSS en .hart-glow)
function hartFlame(cx, cy, r, colors){
  var c = colors || [HART.fireL, HART.fire, HART.fireD];
  return '<g class="hart-glow">' +
    hartCircle(cx, cy, r * 2.4, c[1], { op: 0.16 }) +
    hartCircle(cx, cy, r * 1.5, c[1], { op: 0.24 }) +
    '</g>' +
    hartPath("M" + hartN(cx) + " " + hartN(cy - r * 1.3) + "Q" + hartN(cx + r) + " " + hartN(cy) + " " + hartN(cx) + " " + hartN(cy + r) + "Q" + hartN(cx - r) + " " + hartN(cy) + " " + hartN(cx) + " " + hartN(cy - r * 1.3) + "Z", c[1], { stroke: c[2], sw: 0.6 }) +
    hartCircle(cx, cy + r * 0.15, r * 0.45, c[0]);
}

function hartRng(seed){
  var h = 2166136261;
  var s = String(seed || "x");
  for(var i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return function(){
    h = (h + 0x6D2B79F5) | 0;
    var t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hartHexToRgb(hex){
  var m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if(!m) return null;
  var n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Mezcla un color con blanco (t > 0) o con negro (t < 0)
function hartShade(hex, t){
  var c = hartHexToRgb(hex);
  if(!c) return hex;
  var target = t > 0 ? 255 : 0;
  var a = Math.abs(t);
  return "#" + c.map(function(v){
    var n = Math.round(v + (target - v) * a);
    return ("0" + n.toString(16)).slice(-2);
  }).join("");
}

function hartEscText(s){
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// Tipo de dibujo a partir del id del catálogo o del tipo guardado (también los antiguos)
// ---------------------------------------------------------------------------
var HART_KIND_RULES = [
  ["escaleras", ["escaleras", "stair"]],
  ["entrada", ["entrada", "porche"]],
  ["puerta_doble", ["puerta_doble"]],
  ["puerta", ["puerta", "door"]],
  ["arco", ["arco"]],
  ["ventana", ["ventana"]],
  ["mapas", ["mapa"]],
  ["alquimia", ["alquimia"]],
  ["pociones", ["pocion"]],
  ["cama", ["cama", "dosel"]],
  ["sillon", ["sillon"]],
  ["escritorio", ["escritorio"]],
  ["banco", ["banco"]],
  ["mesa", ["mesa"]],
  ["baul", ["baul", "cofre"]],
  ["alacena", ["alacena"]],
  ["armero", ["armero"]],
  ["estanteria", ["estanteria", "estante"]],
  ["libreria", ["libreria"]],
  ["fogon", ["fogon", "cocina"]],
  ["chimenea", ["chimenea"]],
  ["alfombra_runica", ["runic"]],
  ["piel_oso", ["oso"]],
  ["alfombra", ["alfombra"]],
  ["tapiz", ["tapiz", "cuadro"]],
  ["trofeo", ["trofeo"]],
  ["diana", ["diana"]],
  ["barriles", ["barril"]],
  ["bonsai", ["bonsai"]],
  ["planta", ["planta"]],
  ["setas", ["seta"]],
  ["reliquia", ["reliquia", "gema"]],
  ["telarana", ["telara"]],
  ["candelabro", ["candelabro"]],
  ["vela", ["vela"]],
  ["farol", ["farol", "antorcha"]],
  ["brasero", ["brasero"]]
];

function getHouseArtKind(typeOrId){
  var key = String(typeOrId || "").toLowerCase();
  for(var i = 0; i < HART_KIND_RULES.length; i++){
    var words = HART_KIND_RULES[i][1];
    for(var j = 0; j < words.length; j++){
      if(key.indexOf(words[j]) !== -1) return HART_KIND_RULES[i][0];
    }
  }
  return "generico";
}

// Versión simplificada para casillas muy pequeñas: [forma, relleno, acento]
var HART_SIMPLE = {
  cama: ["rect", HART.wood, HART.red], sillon: ["rect", HART.red, HART.redD], mesa: ["rect", HART.wood, HART.woodD],
  escritorio: ["rect", HART.woodD, HART.paper], banco: ["rect", HART.woodD, HART.iron], alquimia: ["rect", HART.woodD, HART.teal],
  baul: ["rect", HART.wood, HART.gold], alacena: ["rect", HART.woodD, HART.gold], armero: ["rect", HART.woodD, HART.ironL],
  libreria: ["rect", HART.woodD, HART.red], estanteria: ["rect", HART.woodD, HART.teal], fogon: ["circle", HART.stone, HART.fire],
  chimenea: ["rect", HART.stone, HART.fire], alfombra: ["rug", HART.red, HART.gold], alfombra_runica: ["rug", HART.tealD, HART.goldL],
  piel_oso: ["rug", HART.fur, HART.furL], tapiz: ["rect", HART.red, HART.gold], trofeo: ["circle", HART.cloth, HART.woodD],
  diana: ["circle", HART.paper, HART.red], barriles: ["circle", HART.wood, HART.iron], planta: ["circle", HART.leaf, HART.clay],
  bonsai: ["circle", HART.leaf, HART.clay], setas: ["circle", HART.teal, HART.tealL], pociones: ["rect", HART.woodD, HART.teal],
  mapas: ["rect", HART.wood, HART.paper], reliquia: ["circle", HART.stone, HART.tealL], telarana: ["web", HART.clothD, HART.clothD],
  candelabro: ["circle", HART.ironD, HART.fireL], vela: ["circle", HART.goldD, HART.fireL], farol: ["circle", HART.ironD, HART.fireL],
  brasero: ["circle", HART.ironD, HART.tealL], escaleras: ["rect", HART.wood, HART.woodL], puerta: ["rect", HART.wood, HART.gold],
  puerta_doble: ["rect", HART.wood, HART.gold], entrada: ["rect", HART.wood, HART.gold], arco: ["rect", HART.stone, HART.stoneL],
  ventana: ["rect", HART.tealD, HART.tealL], generico: ["rect", HART.wood, HART.woodD]
};

function hartDrawSimple(kind, W, H){
  var d = HART_SIMPLE[kind] || HART_SIMPLE.generico;
  var p = 4;
  if(d[0] === "circle"){
    var r = Math.min(W, H) / 2 - p;
    return hartCircle(W / 2, H / 2, r, d[1], { stroke: HART.out, sw: 2 }) + hartCircle(W / 2, H / 2, r * 0.45, d[2]);
  }
  if(d[0] === "web") return hartPath("M3 3L" + (W * 0.6) + " 3M3 3L3 " + (H * 0.6) + "M3 3L" + (W * 0.45) + " " + (H * 0.45), "none", { stroke: d[1], sw: 2.5, op: 0.7 });
  if(d[0] === "rug") return hartRect(p, p, W - 2 * p, H - 2 * p, d[1], { rx: 2, stroke: d[2], sw: 3 });
  return hartRect(p, p, W - 2 * p, H - 2 * p, d[1], { rx: 3, stroke: HART.out, sw: 2 }) + hartRect(W * 0.3, H * 0.3, W * 0.4, H * 0.4, d[2], { rx: 2 });
}

// ---------------------------------------------------------------------------
// Dibujos detallados. Cada uno recibe L = { w, h, cw, ch, rnd, key, owner, label }
// con el mueble sin girar: el fondo (pared) arriba y el frente abajo.
// ---------------------------------------------------------------------------
var HART_DRAW = {};

HART_DRAW.cama = function(L){
  var p = 3, w = L.w, h = L.h;
  var big = L.cw >= 2 || L.key.indexOf("matrimonio") !== -1 || L.key.indexOf("dosel") !== -1;
  var base = L.owner || HART.red;
  var blanket = [hartShade(base, 0.25), base, hartShade(base, -0.35)];
  var s = hartBlock(p, p, w - 2 * p, h - 2 * p, HART_WOOD, 3);
  // Cabecero
  s += hartBlock(p, p, w - 2 * p, 7, HART_WOOD_DARK, 2);
  // Almohadas: una por cama estrecha, dos si es ancha
  var pillows = big ? 2 : 1;
  var pw = (w - 2 * p - 8 - (pillows - 1) * 4) / pillows;
  for(var i = 0; i < pillows; i++){
    var px = p + 4 + i * (pw + 4);
    s += hartRect(px + 1, 13, pw, 11, "rgba(0,0,0,0.25)", { rx: 4 });
    s += hartRect(px, 12, pw, 11, HART.cloth, { rx: 4, stroke: HART.clothD, sw: 0.9 });
    s += hartLine(px + 3, 17.5, px + pw - 3, 17.5, HART.clothD, 0.7, { op: 0.6 });
  }
  // Sábana doblada y manta hasta los pies
  var top = 27;
  s += hartRect(p + 2, top, w - 2 * p - 4, 6, HART.cloth, { rx: 1.5, stroke: HART.clothD, sw: 0.7 });
  s += hartBlock(p + 2, top + 5, w - 2 * p - 4, h - top - 5 - p - 2, blanket, 2);
  s += hartRect(p + 5, top + 8, w - 2 * p - 10, h - top - 11 - p - 2, "none", { rx: 1.5, stroke: HART.goldL, sw: 0.7, op: 0.55 });
  var folds = Math.max(1, Math.floor((h - top) / 26));
  for(var f = 1; f <= folds; f++){
    var fy = top + 5 + f * (h - top - 5 - p - 2) / (folds + 1);
    s += hartPath("M" + hartN(p + 6) + " " + hartN(fy) + "Q" + hartN(w / 2) + " " + hartN(fy + 3) + " " + hartN(w - p - 6) + " " + hartN(fy - 1), "none", { stroke: blanket[2], sw: 0.9, op: 0.6 });
  }
  if(big){
    // Postes del dosel
    s += hartRoundBlock(p + 2.5, p + 2.5, 3, HART_WOOD_DARK) + hartRoundBlock(w - p - 2.5, p + 2.5, 3, HART_WOOD_DARK);
    s += hartRoundBlock(p + 2.5, h - p - 2.5, 3, HART_WOOD_DARK) + hartRoundBlock(w - p - 2.5, h - p - 2.5, 3, HART_WOOD_DARK);
  }
  return s;
};

function hartChair(cx, cy, side){
  // side: hacia dónde queda el respaldo (top, bottom, left, right)
  var s = 10, d = 9;
  var horiz = side === "top" || side === "bottom";
  var w = horiz ? s : d, h = horiz ? d : s;
  var x = cx - w / 2, y = cy - h / 2;
  var out = hartBlock(x, y, w, h, HART_WOOD_DARK, 1.5);
  if(side === "top") out += hartRect(x, y, w, 2.6, HART.woodD, { rx: 1 });
  if(side === "bottom") out += hartRect(x, y + h - 2.6, w, 2.6, HART.woodD, { rx: 1 });
  if(side === "left") out += hartRect(x, y, 2.6, h, HART.woodD, { rx: 1 });
  if(side === "right") out += hartRect(x + w - 2.6, y, 2.6, h, HART.woodD, { rx: 1 });
  return out;
}

HART_DRAW.mesa = function(L){
  var w = L.w, h = L.h, cs = 10;
  var tx = cs, ty = cs, tw = w - 2 * cs, th = h - 2 * cs;
  var horizLong = L.cw >= L.ch;
  var s = "";
  // Sillas según el perímetro: lados largos una por casilla; extremos, una menos
  var nTop = horizLong ? L.cw : Math.max(0, L.cw - 1);
  var nSide = horizLong ? Math.max(0, L.ch - 1) : L.ch;
  var i;
  for(i = 0; i < nTop; i++){
    var cx = tx + (i + 0.5) * tw / nTop;
    s += hartChair(cx, cs / 2 + 0.5, "top") + hartChair(cx, h - cs / 2 - 0.5, "bottom");
  }
  for(i = 0; i < nSide; i++){
    var cy = ty + (i + 0.5) * th / nSide;
    s += hartChair(cs / 2 + 0.5, cy, "left") + hartChair(w - cs / 2 - 0.5, cy, "right");
  }
  s += hartBlock(tx, ty, tw, th, HART_WOOD, 3);
  s += hartPlanks(tx, ty, tw, th, Math.max(2, Math.round((horizLong ? th : tw) / 9)), horizLong, HART.woodD);
  s += hartGrain(tx + 1, ty + 1, tw - 2, th - 2, L.rnd);
  // Camino de mesa y vela en el centro
  if(Math.max(L.cw, L.ch) >= 2){
    if(horizLong) s += hartRect(tx + 6, h / 2 - 4, tw - 12, 8, HART.red, { rx: 1, stroke: HART.goldD, sw: 0.7, op: 0.92 });
    else s += hartRect(w / 2 - 4, ty + 6, 8, th - 12, HART.red, { rx: 1, stroke: HART.goldD, sw: 0.7, op: 0.92 });
  }
  s += hartCircle(w / 2, h / 2, 3.2, HART.gold, { stroke: HART.goldD, sw: 0.7 }) + hartFlame(w / 2, h / 2, 1.6);
  return s;
};

HART_DRAW.alquimia = function(L){
  var w = L.w, h = L.h, p = 3;
  var s = hartBlock(p, p, w - 2 * p, h - 2 * p, HART_WOOD_DARK, 2);
  s += hartGrain(p + 1, p + 1, w - 2 * p - 2, h - 2 * p - 2, L.rnd, "#2E1D10");
  var colors = [HART.tealL, HART.redL, HART.goldL, "#7FA0B8", HART.leafL];
  var n = Math.max(2, Math.round((w - 2 * p) / 13));
  for(var i = 0; i < n; i++){
    var cx = p + (i + 0.5) * (w - 2 * p) / n;
    var cy = p + 9 + L.rnd() * Math.max(0, h - 2 * p - 18);
    var r = 3 + L.rnd() * 2.5;
    var c = colors[Math.floor(L.rnd() * colors.length)];
    s += hartCircle(cx + 0.8, cy + 1, r, "rgba(0,0,0,0.3)");
    s += hartCircle(cx, cy, r, c, { stroke: HART.out, sw: 0.8, op: 0.9 });
    s += hartCircle(cx - r * 0.35, cy - r * 0.35, r * 0.3, "#FFFFFF", { op: 0.55 });
  }
  // Mortero y alambique
  s += hartCircle(w - p - 8, h - p - 8, 5, HART.stone, { stroke: HART.out, sw: 0.8 }) + hartCircle(w - p - 8, h - p - 8, 2.6, HART.stoneD);
  s += hartLine(p + 6, h - p - 6, p + 16, h - p - 10, HART.goldL, 1.4);
  return s;
};

HART_DRAW.escritorio = function(L){
  var w = L.w, h = L.h, p = 3;
  var deskH = Math.max(18, h - 16);
  var s = hartChair(w / 2, h - 7, "bottom");
  s += hartBlock(p, p, w - 2 * p, deskH - p, HART_WOOD_DARK, 2);
  s += hartGrain(p + 1, p + 1, w - 2 * p - 2, deskH - p - 2, L.rnd, "#2E1D10");
  // Pergaminos repartidos según el ancho
  var n = Math.max(1, Math.round((w - 2 * p) / 30));
  for(var i = 0; i < n; i++){
    var px = p + 5 + i * (w - 2 * p - 10) / n;
    var pw = Math.min(14, (w - 2 * p - 10) / n - 6);
    var ang = (L.rnd() - 0.5) * 14;
    s += '<g transform="rotate(' + hartN(ang) + ' ' + hartN(px + pw / 2) + ' ' + hartN(p + deskH / 2) + ')">' +
      hartRect(px, p + 4, pw, Math.max(8, deskH - 12), HART.paper, { rx: 1, stroke: HART.paperD, sw: 0.7 }) +
      hartLine(px + 2, p + 8, px + pw - 2, p + 8, HART.paperD, 0.6) +
      hartLine(px + 2, p + 11, px + pw - 4, p + 11, HART.paperD, 0.6) + '</g>';
  }
  // Tintero y pluma
  s += hartCircle(w - p - 7, p + 7, 3, "#1B1714", { stroke: HART.goldD, sw: 0.8 });
  s += hartLine(w - p - 7, p + 7, w - p - 14, p + deskH - 6, HART.cloth, 1.2);
  return s;
};

HART_DRAW.banco = function(L){
  var w = L.w, h = L.h, p = 3;
  var s = hartBlock(p, p, w - 2 * p, h - 2 * p, HART_WOOD_DARK, 2);
  s += hartPlanks(p, p, w - 2 * p, h - 2 * p, Math.max(2, Math.round((h - 2 * p) / 8)), true, "#2E1D10");
  // Yunque si cabe, y herramientas
  if(w >= 60){
    var ax = w - p - 24, ay = h / 2 - 7;
    s += hartPath("M" + hartN(ax) + " " + hartN(ay) + "H" + hartN(ax + 18) + "L" + hartN(ax + 21) + " " + hartN(ay + 4) + "H" + hartN(ax + 18) + "V" + hartN(ay + 14) + "H" + hartN(ax) + "Z", HART.iron, { stroke: HART.out, sw: 1 });
    s += hartLine(ax + 2, ay + 2, ax + 16, ay + 2, HART.ironL, 1, { op: 0.8 });
  }
  var tools = Math.max(1, Math.floor((w - 2 * p - (w >= 60 ? 28 : 0)) / 14));
  for(var i = 0; i < tools; i++){
    var tx = p + 8 + i * 13;
    if(i % 2 === 0){
      s += hartLine(tx, h / 2 + 6, tx, h / 2 - 6, HART.woodL, 2) + hartRect(tx - 4, h / 2 - 9, 8, 4, HART.iron, { rx: 0.8, stroke: HART.out, sw: 0.6 });
    } else {
      s += hartPath("M" + hartN(tx - 2) + " " + hartN(h / 2 + 7) + "L" + hartN(tx + 1) + " " + hartN(h / 2 - 7) + "M" + hartN(tx + 3) + " " + hartN(h / 2 + 7) + "L" + hartN(tx) + " " + hartN(h / 2 - 7), "none", { stroke: HART.ironL, sw: 1.3, cap: "round" });
    }
  }
  return s;
};

HART_DRAW.sillon = function(L){
  var w = L.w, h = L.h, p = 3;
  var c = [HART.redL, HART.red, HART.redD];
  var s = hartBlock(p, p, w - 2 * p, h - 2 * p, c, 5);
  // Respaldo arriba y brazos a los lados
  s += hartBlock(p, p, w - 2 * p, 9, [HART.redL, HART.redD, "#3E0F15"], 4);
  s += hartBlock(p, p + 6, 7, h - 2 * p - 6, [HART.redL, HART.redD, "#3E0F15"], 3);
  s += hartBlock(w - p - 7, p + 6, 7, h - 2 * p - 6, [HART.redL, HART.redD, "#3E0F15"], 3);
  // Cojines: uno por casilla de ancho
  var n = Math.max(1, L.cw);
  var cw = (w - 2 * p - 16) / n;
  for(var i = 0; i < n; i++){
    var cx = p + 8 + i * cw;
    s += hartRect(cx + 1, p + 12, cw - 2, h - 2 * p - 15, c[0], { rx: 3, stroke: c[2], sw: 0.8, op: 0.9 });
    s += hartCircle(cx + cw / 2, p + 12 + (h - 2 * p - 15) / 2, 1.2, HART.goldL);
  }
  return s;
};

HART_DRAW.baul = function(L){
  var w = L.w, h = L.h, p = 5;
  var s = hartBlock(p, p, w - 2 * p, h - 2 * p, HART_WOOD, 3);
  // Tablones de la tapa según el ancho
  s += hartPlanks(p, p, w - 2 * p, h - 2 * p, Math.max(2, Math.round((w - 2 * p) / 11)), false, HART.woodD);
  s += hartGrain(p + 1, p + 1, w - 2 * p - 2, h - 2 * p - 2, L.rnd);
  // Flejes de hierro
  s += hartRect(p, p + (h - 2 * p) * 0.22, w - 2 * p, 3, HART.ironD, { op: 0.9 });
  s += hartRect(p, p + (h - 2 * p) * 0.72, w - 2 * p, 3, HART.ironD, { op: 0.9 });
  s += hartCorners(p, p, w - 2 * p, h - 2 * p, 6);
  s += hartRivets(p, p, w - 2 * p, h - 2 * p, 3, 1.1);
  // Cerradura dorada en el frente
  s += hartRect(w / 2 - 3.5, h - p - 8, 7, 7, HART.gold, { rx: 1, stroke: HART.goldD, sw: 0.8 }) + hartCircle(w / 2, h - p - 4.6, 1, "#1B1714");
  return s;
};

HART_DRAW.alacena = function(L){
  var w = L.w, h = L.h, p = 3;
  var s = hartBlock(p, p, w - 2 * p, h - 2 * p, HART_WOOD_DARK, 2);
  s += hartGrain(p + 1, p + 1, w - 2 * p - 2, h - 2 * p - 2, L.rnd, "#2E1D10");
  // Frente con puertas: una por casilla de ancho
  var n = Math.max(1, L.cw);
  var dw = (w - 2 * p) / n;
  for(var i = 0; i < n; i++){
    if(i > 0) s += hartLine(p + i * dw, h - p - 8, p + i * dw, h - p, HART.out, 1);
    s += hartCircle(p + (i + 0.5) * dw, h - p - 4, 1.4, HART.gold, { stroke: HART.goldD, sw: 0.5 });
  }
  s += hartLine(p + 1, h - p - 8, w - p - 1, h - p - 8, HART.out, 0.8, { op: 0.8 });
  // Tarros y sacos encima
  var jars = Math.max(2, Math.round((w - 2 * p) / 11));
  var jarColors = [HART.clay, HART.clayL, HART.paperD, HART.stone];
  for(var j = 0; j < jars; j++){
    var cx = p + (j + 0.5) * (w - 2 * p) / jars;
    var cy = p + 6 + L.rnd() * Math.max(0, h - 2 * p - 20);
    var r = 2.6 + L.rnd() * 1.8;
    s += hartRoundBlock(cx, cy, r, [HART.clayL, jarColors[j % jarColors.length], HART.clayD]);
  }
  s += hartCorners(p, p, w - 2 * p, h - 2 * p, 5, HART.ironD);
  return s;
};

HART_DRAW.armero = function(L){
  var w = L.w, h = L.h, p = 3;
  var s = hartBlock(p, p, w - 2 * p, h - 2 * p, HART_WOOD_DARK, 2);
  s += hartRect(p + 2, p + 2, w - 2 * p - 4, 5, HART.woodD, { rx: 1 });
  var n = Math.max(2, Math.round((w - 2 * p) / 12));
  for(var i = 0; i < n; i++){
    var cx = p + (i + 0.5) * (w - 2 * p) / n;
    var kind = Math.floor(L.rnd() * 3);
    if(kind === 0){
      // Espada
      s += hartLine(cx, p + 6, cx, h - p - 5, HART.ironL, 2.2) + hartLine(cx - 4, p + 10, cx + 4, p + 10, HART.gold, 1.6) + hartCircle(cx, p + 6, 1.4, HART.goldL);
    } else if(kind === 1){
      // Lanza
      s += hartLine(cx, p + 7, cx, h - p - 4, HART.woodL, 1.6) + hartPath("M" + hartN(cx) + " " + hartN(h - p - 2) + "L" + hartN(cx - 2.4) + " " + hartN(h - p - 8) + "L" + hartN(cx + 2.4) + " " + hartN(h - p - 8) + "Z", HART.ironL, { stroke: HART.out, sw: 0.5 });
    } else {
      // Escudo
      var r = Math.min(5.5, (w - 2 * p) / n / 2 - 0.5, (h - 2 * p) / 2 - 2);
      s += hartRoundBlock(cx, h / 2 + 1, r, [HART.redL, HART.red, HART.redD]) + hartCircle(cx, h / 2 + 1, r * 0.35, HART.gold);
    }
  }
  return s;
};

HART_DRAW.libreria = function(L, withJars){
  var w = L.w, h = L.h, p = 3;
  var s = hartBlock(p, p, w - 2 * p, h - 2 * p, HART_WOOD_DARK, 2);
  var ix = p + 3, iy = p + 3, iw = w - 2 * p - 6, ih = h - 2 * p - 6;
  s += hartRect(ix, iy, iw, ih, "#22160D", { rx: 1 });
  // Baldas: una por casilla de fondo
  var rows = Math.max(1, L.ch);
  var rh = ih / rows;
  for(var r = 0; r < rows; r++){
    var y0 = iy + r * rh;
    if(r > 0) s += hartRect(ix, y0 - 1, iw, 2, HART.woodD);
    var x = ix + 0.5;
    while(x < ix + iw - 2){
      var roll = L.rnd();
      if(withJars && roll < 0.25){
        var jr = Math.min(3.4, (ix + iw - x) / 2 - 0.3, rh / 2 - 1);
        if(jr < 1.5) break;
        s += hartCircle(x + jr, y0 + rh / 2, jr, HART_BOOKS[Math.floor(L.rnd() * 3) * 3 % HART_BOOKS.length], { stroke: HART.out, sw: 0.6 }) + hartCircle(x + jr * 0.6, y0 + rh / 2 - jr * 0.4, jr * 0.3, "#FFFFFF", { op: 0.5 });
        x += jr * 2 + 1;
        continue;
      }
      var bw = Math.min(2.2 + L.rnd() * 3, ix + iw - x - 0.5);
      if(bw < 1.5) break;
      var depth = rh * (0.6 + L.rnd() * 0.35);
      var col = HART_BOOKS[Math.floor(L.rnd() * HART_BOOKS.length)];
      s += hartRect(x, y0 + rh - depth - 0.5, bw, depth, col, { stroke: "#1B1109", sw: 0.4 });
      if(bw > 3) s += hartLine(x + bw / 2, y0 + rh - depth + 1, x + bw / 2, y0 + rh - 1.5, HART.goldL, 0.4, { op: 0.6 });
      x += bw + (L.rnd() < 0.15 ? 2 : 0.25);
    }
  }
  return s;
};

HART_DRAW.estanteria = function(L){ return HART_DRAW.libreria(L, true); };

HART_DRAW.pociones = function(L){
  var w = L.w, h = L.h, p = 3;
  var s = hartBlock(p, p, w - 2 * p, h - 2 * p, HART_WOOD_DARK, 2);
  var colors = [HART.tealL, HART.redL, HART.goldL, "#7FA0B8", HART.leafL, HART.clayL];
  var rows = Math.max(1, L.ch);
  for(var r = 0; r < rows; r++){
    var cy = p + (r + 0.5) * (h - 2 * p) / rows;
    var n = Math.max(2, Math.round((w - 2 * p) / 9));
    for(var i = 0; i < n; i++){
      var cx = p + (i + 0.5) * (w - 2 * p) / n + (L.rnd() - 0.5) * 2;
      var rr = 2.4 + L.rnd() * 1.6;
      var c = colors[Math.floor(L.rnd() * colors.length)];
      s += hartCircle(cx, cy, rr, c, { stroke: HART.out, sw: 0.7, op: 0.92 }) + hartCircle(cx, cy, rr * 0.4, "#1B1109", { op: 0.35 }) + hartCircle(cx - rr * 0.4, cy - rr * 0.4, rr * 0.28, "#FFFFFF", { op: 0.55 });
    }
  }
  return s;
};

HART_DRAW.fogon = function(L){
  var w = L.w, h = L.h, cx = w / 2, cy = h / 2;
  var R = Math.min(w, h) / 2 - 3;
  var s = "";
  // Anillo de piedras: más grande = más piedras
  var sr0 = Math.min(5, R * 0.17);
  var n = Math.max(8, Math.round(2 * Math.PI * (R - sr0) / (sr0 * 2.1)));
  for(var i = 0; i < n; i++){
    var a = i / n * Math.PI * 2;
    var sr = sr0 + L.rnd() * 0.8;
    s += hartRoundBlock(cx + Math.cos(a) * (R - sr0), cy + Math.sin(a) * (R - sr0), sr, HART_STONE);
  }
  s += hartCircle(cx, cy, R - sr0 * 2, "#2A1810");
  var ir = R - sr0 * 2;
  s += '<g class="hart-glow">' + hartCircle(cx, cy, ir, HART.fire, { op: 0.35 }) + '</g>';
  // Caldero
  var kr = Math.min(ir * 0.8, 13);
  s += hartRoundBlock(cx, cy, kr, HART_IRON);
  s += hartCircle(cx, cy, kr * 0.76, "#4E5A2E") + hartCircle(cx - kr * 0.22, cy - kr * 0.18, kr * 0.16, "#8BA05A", { op: 0.8 }) + hartCircle(cx + kr * 0.26, cy + kr * 0.22, kr * 0.1, "#8BA05A", { op: 0.8 });
  return s;
};

HART_DRAW.chimenea = function(L){
  var w = L.w, h = L.h, p = 2;
  var s = hartBlock(p, p, w - 2 * p, h - 2 * p, HART_STONE, 2);
  // Sillares: filas y columnas según el tamaño
  var rows = Math.max(2, Math.round((h - 2 * p) / 8));
  var rh = (h - 2 * p) / rows;
  for(var r = 1; r < rows; r++) s += hartLine(p + 1, p + r * rh, w - p - 1, p + r * rh, HART.stoneD, 0.8, { op: 0.8 });
  for(r = 0; r < rows; r++){
    var cols = Math.max(2, Math.round((w - 2 * p) / 12));
    var cwid = (w - 2 * p) / cols;
    for(var c = 1; c < cols; c++){
      var x = p + c * cwid + (r % 2 ? cwid / 2 : 0);
      if(x < w - p - 2) s += hartLine(x, p + r * rh + 0.5, x, p + (r + 1) * rh - 0.5, HART.stoneD, 0.8, { op: 0.8 });
    }
  }
  // Hogar abierto hacia el frente con leña y llamas
  var fw = Math.max(14, (w - 2 * p) * 0.6), fh = Math.max(10, (h - 2 * p) * 0.55);
  var fx = w / 2 - fw / 2, fy = h - p - fh;
  s += hartRect(fx, fy, fw, fh, "#1E120B", { rx: 2, stroke: HART.out, sw: 1 });
  s += '<g class="hart-glow">' + hartRect(fx + 1, fy + 1, fw - 2, fh - 2, HART.fire, { rx: 2, op: 0.3 }) + '</g>';
  var logs = Math.max(2, Math.round(fw / 10));
  for(var i = 0; i < logs; i++){
    var lx = fx + 3 + i * (fw - 6) / logs;
    s += hartRect(lx, fy + fh * 0.45, (fw - 6) / logs - 1.5, 3.4, HART.woodD, { rx: 1.5, stroke: HART.out, sw: 0.5 });
  }
  var flames = Math.max(1, Math.round(fw / 20));
  for(var f = 0; f < flames; f++) s += hartFlame(fx + (f + 0.5) * fw / flames, fy + fh * 0.45, Math.min(5.5, fh * 0.26, fw / flames * 0.3));
  return s;
};

HART_DRAW.brasero = function(L){
  var w = L.w, h = L.h, cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 4;
  var s = hartRoundBlock(cx, cy, R, HART_IRON);
  s += hartCircle(cx, cy, R * 0.72, "#1E1A18");
  for(var i = 0; i < 5; i++){
    var a = L.rnd() * Math.PI * 2, d = L.rnd() * R * 0.4;
    s += hartCircle(cx + Math.cos(a) * d, cy + Math.sin(a) * d, R * 0.16, HART.tealD);
  }
  s += hartFlame(cx, cy, R * 0.32, ["#B9E2D6", HART.tealL, HART.tealD]);
  // Patas
  for(var j = 0; j < 3; j++){
    var b = j / 3 * Math.PI * 2 + 0.5;
    s += hartCircle(cx + Math.cos(b) * R, cy + Math.sin(b) * R, 1.8, HART.ironD);
  }
  return s;
};

HART_DRAW.vela = function(L){
  var cx = L.w / 2, cy = L.h / 2, R = Math.min(L.w, L.h) / 2 - 8;
  return hartRoundBlock(cx, cy, R, [HART.goldL, HART.gold, HART.goldD]) +
    hartCircle(cx, cy, R * 0.55, HART.cloth, { stroke: HART.clothD, sw: 0.7 }) + hartFlame(cx, cy, R * 0.28);
};

HART_DRAW.candelabro = function(L){
  var cx = L.w / 2, cy = L.h / 2, R = Math.min(L.w, L.h) / 2 - 6;
  var s = hartCircle(cx, cy, R, "none", { stroke: HART.ironD, sw: 2.2 });
  s += hartLine(cx - R, cy, cx + R, cy, HART.ironD, 1.6) + hartLine(cx, cy - R, cx, cy + R, HART.ironD, 1.6);
  s += hartRoundBlock(cx, cy, R * 0.3, HART_IRON);
  [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(function(d){
    var x = cx + d[0] * R, y = cy + d[1] * R;
    s += hartCircle(x, y, 3.4, HART.cloth, { stroke: HART.out, sw: 0.7 }) + hartFlame(x, y, 1.7);
  });
  return s;
};

HART_DRAW.farol = function(L){
  var cx = L.w / 2, cy = L.h / 2, S = Math.min(L.w, L.h) - 18;
  var s = '<g class="hart-glow">' + hartCircle(cx, cy, S * 0.95, HART.fire, { op: 0.13 }) + '</g>';
  s += hartBlock(cx - S / 2, cy - S / 2, S, S, HART_IRON, 2);
  s += hartRect(cx - S / 2 + 3, cy - S / 2 + 3, S - 6, S - 6, "#F2D58A", { rx: 1, op: 0.55 });
  s += hartLine(cx, cy - S / 2, cx, cy + S / 2, HART.ironD, 1.2) + hartLine(cx - S / 2, cy, cx + S / 2, cy, HART.ironD, 1.2);
  s += hartFlame(cx, cy, S * 0.12);
  return s;
};

HART_DRAW.alfombra = function(L){
  var w = L.w, h = L.h, p = 3;
  var persa = L.key.indexOf("persa") !== -1;
  var field = persa ? HART.red : HART.teal, fieldD = persa ? HART.redD : HART.tealD, accent = persa ? HART.goldL : HART.paper;
  var horiz = w >= h;
  var s = "";
  // Flecos en los lados cortos
  var fr = 3;
  var n = Math.max(4, Math.round((horiz ? h : w) / 4));
  for(var i = 0; i < n; i++){
    var t = p + 2 + (i + 0.5) * ((horiz ? h : w) - 2 * p - 4) / n;
    s += horiz
      ? hartLine(p - 1, t, p + fr, t, HART.cloth, 0.9, { op: 0.8 }) + hartLine(w - p - fr, t, w - p + 1, t, HART.cloth, 0.9, { op: 0.8 })
      : hartLine(t, p - 1, t, p + fr, HART.cloth, 0.9, { op: 0.8 }) + hartLine(t, h - p - fr, t, h - p + 1, HART.cloth, 0.9, { op: 0.8 });
  }
  var x = p + (horiz ? fr : 0), y = p + (horiz ? 0 : fr), rw = w - 2 * p - (horiz ? 2 * fr : 0), rh = h - 2 * p - (horiz ? 0 : 2 * fr);
  s += hartRect(x, y, rw, rh, fieldD, { rx: 1.5, stroke: HART.out, sw: 1 });
  // Cenefa con rombos repartidos por los lados
  var b = Math.min(6, Math.min(rw, rh) * 0.16);
  s += hartRect(x + b, y + b, rw - 2 * b, rh - 2 * b, field, { stroke: accent, sw: 0.9 });
  var dn = Math.max(2, Math.round(rw / 10)), dm = Math.max(2, Math.round(rh / 10));
  var dr = b * 0.32;
  for(i = 0; i < dn; i++){
    var dx = x + b + (i + 0.5) * (rw - 2 * b) / dn;
    s += hartPath("M" + hartN(dx) + " " + hartN(y + b / 2 - dr) + "l" + hartN(dr) + " " + hartN(dr) + "l" + hartN(-dr) + " " + hartN(dr) + "l" + hartN(-dr) + " " + hartN(-dr) + "Z", accent, { op: 0.85 });
    s += hartPath("M" + hartN(dx) + " " + hartN(y + rh - b / 2 - dr) + "l" + hartN(dr) + " " + hartN(dr) + "l" + hartN(-dr) + " " + hartN(dr) + "l" + hartN(-dr) + " " + hartN(-dr) + "Z", accent, { op: 0.85 });
  }
  for(i = 0; i < dm; i++){
    var dy = y + b + (i + 0.5) * (rh - 2 * b) / dm;
    s += hartPath("M" + hartN(x + b / 2) + " " + hartN(dy - dr) + "l" + hartN(dr) + " " + hartN(dr) + "l" + hartN(-dr) + " " + hartN(dr) + "l" + hartN(-dr) + " " + hartN(-dr) + "Z", accent, { op: 0.85 });
    s += hartPath("M" + hartN(x + rw - b / 2) + " " + hartN(dy - dr) + "l" + hartN(dr) + " " + hartN(dr) + "l" + hartN(-dr) + " " + hartN(dr) + "l" + hartN(-dr) + " " + hartN(-dr) + "Z", accent, { op: 0.85 });
  }
  // Medallón: se repite a lo largo si la alfombra es grande
  var ix = x + b * 1.6, iy = y + b * 1.6, iw = rw - 3.2 * b, ih = rh - 3.2 * b;
  var reps = Math.max(1, Math.floor((horiz ? L.cw / Math.max(1, L.ch) : L.ch / Math.max(1, L.cw)) + 0.25));
  if(Math.max(L.cw, L.ch) < 3) reps = 1;
  var cellLen = (horiz ? iw : ih) / reps;
  for(var m = 0; m < reps; m++){
    var mx = horiz ? ix + (m + 0.5) * cellLen : ix + iw / 2;
    var my = horiz ? iy + ih / 2 : iy + (m + 0.5) * cellLen;
    var mw = (horiz ? cellLen : iw) * 0.42, mh = (horiz ? ih : cellLen) * 0.42;
    s += hartPath("M" + hartN(mx) + " " + hartN(my - mh) + "L" + hartN(mx + mw) + " " + hartN(my) + "L" + hartN(mx) + " " + hartN(my + mh) + "L" + hartN(mx - mw) + " " + hartN(my) + "Z", fieldD, { stroke: accent, sw: 0.9 });
    s += hartEllipse(mx, my, mw * 0.45, mh * 0.45, field, { stroke: accent, sw: 0.7 });
    s += hartCircle(mx, my, Math.min(mw, mh) * 0.14, accent);
  }
  return s;
};

HART_DRAW.alfombra_runica = function(L){
  var w = L.w, h = L.h, p = 3;
  var s = hartRect(p, p, w - 2 * p, h - 2 * p, "#1D2B33", { rx: 3, stroke: HART.out, sw: 1 });
  s += hartRect(p + 2.5, p + 2.5, w - 2 * p - 5, h - 2 * p - 5, "none", { rx: 2, stroke: HART.gold, sw: 0.8, op: 0.8 });
  // Círculos de invocación: uno por cada tramo cuadrado
  var horiz = w >= h;
  var short = Math.min(w, h) - 2 * p - 8;
  var reps = Math.max(1, Math.floor((horiz ? w : h) / (short + 8)));
  var R = short / 2;
  for(var m = 0; m < reps; m++){
    var cx = horiz ? (m + 0.5) * w / reps : w / 2;
    var cy = horiz ? h / 2 : (m + 0.5) * h / reps;
    s += hartCircle(cx, cy, R, HART.tealD, { stroke: HART.goldL, sw: 1, op: 0.95 });
    s += hartCircle(cx, cy, R * 0.78, "none", { stroke: HART.tealL, sw: 0.7, op: 0.8 });
    var runes = Math.max(6, Math.round(R * 0.6));
    for(var i = 0; i < runes; i++){
      var a = i / runes * Math.PI * 2;
      var rx = cx + Math.cos(a) * R * 0.89, ry = cy + Math.sin(a) * R * 0.89;
      s += hartLine(rx - 1, ry - 1.2, rx + 1, ry + 1.2, HART.goldL, 0.7, { op: 0.9 });
    }
    var pts = [];
    for(var k = 0; k < 3; k++){
      var b = -Math.PI / 2 + k * Math.PI * 2 / 3;
      pts.push(hartN(cx + Math.cos(b) * R * 0.7) + " " + hartN(cy + Math.sin(b) * R * 0.7));
    }
    s += hartPath("M" + pts.join("L") + "Z", "none", { stroke: HART.goldL, sw: 0.8 });
    s += '<g class="hart-glow">' + hartCircle(cx, cy, R * 0.18, HART.tealL, { op: 0.7 }) + '</g>';
  }
  return s;
};

HART_DRAW.piel_oso = function(L){
  var w = L.w, h = L.h;
  var horiz = w >= h;
  var len = horiz ? w : h, wid = horiz ? h : w;
  // Se dibuja a lo largo del eje horizontal y se gira si hace falta
  var bx = len * 0.27, bw = len * 0.6, by = wid * 0.18, bh = wid * 0.64;
  var c = wid / 2;
  var d = "M" + hartN(bx) + " " + hartN(c) +
    "Q" + hartN(bx) + " " + hartN(by) + " " + hartN(bx + bw * 0.25) + " " + hartN(by + 2) +
    "L" + hartN(bx + bw * 0.18) + " " + hartN(3) + "L" + hartN(bx + bw * 0.38) + " " + hartN(by) +
    "L" + hartN(bx + bw * 0.62) + " " + hartN(by) + "L" + hartN(bx + bw * 0.8) + " " + hartN(3) +
    "L" + hartN(bx + bw * 0.78) + " " + hartN(by + 2) + "Q" + hartN(bx + bw) + " " + hartN(by) + " " + hartN(bx + bw) + " " + hartN(c) +
    "Q" + hartN(bx + bw) + " " + hartN(by + bh) + " " + hartN(bx + bw * 0.78) + " " + hartN(by + bh - 2) +
    "L" + hartN(bx + bw * 0.8) + " " + hartN(wid - 3) + "L" + hartN(bx + bw * 0.62) + " " + hartN(by + bh) +
    "L" + hartN(bx + bw * 0.38) + " " + hartN(by + bh) + "L" + hartN(bx + bw * 0.18) + " " + hartN(wid - 3) +
    "L" + hartN(bx + bw * 0.25) + " " + hartN(by + bh - 2) + "Q" + hartN(bx) + " " + hartN(by + bh) + " " + hartN(bx) + " " + hartN(c) + "Z";
  var s = hartPath(d, HART.fur, { stroke: HART.furD, sw: 1.2, join: "round" });
  s += hartEllipse(bx + bw / 2, c, bw * 0.34, bh * 0.28, HART.furL, { op: 0.35 });
  // Pelo
  var n = Math.max(6, Math.round(bw / 5));
  for(var i = 0; i < n; i++){
    var fx = bx + bw * 0.12 + L.rnd() * bw * 0.76, fy = by + 4 + L.rnd() * (bh - 8);
    s += hartLine(fx, fy, fx + 2.5, fy + (L.rnd() - 0.5) * 2, HART.furD, 0.6, { op: 0.6 });
  }
  // Cabeza y cola
  var hr = Math.min(wid * 0.2, len * 0.11);
  s += hartCircle(bx - hr * 0.6, c, hr, HART.fur, { stroke: HART.furD, sw: 1.2 });
  s += hartCircle(bx - hr * 1.1, c - hr * 0.8, hr * 0.32, HART.furD) + hartCircle(bx - hr * 1.1, c + hr * 0.8, hr * 0.32, HART.furD);
  s += hartEllipse(bx - hr * 1.45, c, hr * 0.42, hr * 0.32, HART.furL, { stroke: HART.furD, sw: 0.6 }) + hartCircle(bx - hr * 1.75, c, hr * 0.12, "#1B1109");
  s += hartEllipse(bx + bw + 2, c, 3, 2, HART.furD);
  if(!horiz) s = '<g transform="translate(' + hartN(w) + ' 0) rotate(90)">' + s + '</g>';
  return s;
};

HART_DRAW.tapiz = function(L){
  var w = L.w, h = L.h, p = 3;
  var s = hartRect(p + 1.5, p + 2, w - 2 * p, h - 2 * p, "rgba(0,0,0,0.3)", { rx: 1 });
  s += hartRect(p, p + 3, w - 2 * p, h - 2 * p - 3, HART.red, { stroke: HART.out, sw: 1 });
  s += hartRect(p + 3, p + 6, w - 2 * p - 6, h - 2 * p - 9, HART.paper, { stroke: HART.goldD, sw: 0.8 });
  // Tierras del mapa
  var n = Math.max(1, L.cw);
  for(var i = 0; i < n; i++){
    var cx = p + 3 + (i + 0.5) * (w - 2 * p - 6) / n, cy = h / 2 + 1.5;
    var rx = (w - 2 * p - 6) / n * 0.32, ry = (h - 2 * p - 9) * 0.3;
    s += hartPath("M" + hartN(cx - rx) + " " + hartN(cy) + "Q" + hartN(cx - rx * 0.6) + " " + hartN(cy - ry) + " " + hartN(cx) + " " + hartN(cy - ry * 0.8) + "Q" + hartN(cx + rx) + " " + hartN(cy - ry * 0.6) + " " + hartN(cx + rx * 0.8) + " " + hartN(cy + ry * 0.3) + "Q" + hartN(cx) + " " + hartN(cy + ry) + " " + hartN(cx - rx) + " " + hartN(cy) + "Z", HART.leafL, { stroke: HART.leafD, sw: 0.6, op: 0.7 });
  }
  s += hartLine(p + 6, h / 2 + 4, w - p - 6, h / 2 - 2, HART.red, 0.7, { dash: "2,2" });
  // Barra dorada de la que cuelga
  s += hartRect(p - 1, p, w - 2 * p + 2, 3.2, HART.gold, { rx: 1.6, stroke: HART.goldD, sw: 0.6 });
  return s;
};

HART_DRAW.trofeo = function(L){
  var cx = L.w / 2, cy = L.h / 2, S = Math.min(L.w, L.h);
  var s = hartPath("M" + hartN(cx - S * 0.28) + " " + hartN(cy - S * 0.28) + "H" + hartN(cx + S * 0.28) + "V" + hartN(cy + S * 0.05) + "L" + hartN(cx) + " " + hartN(cy + S * 0.36) + "L" + hartN(cx - S * 0.28) + " " + hartN(cy + S * 0.05) + "Z", HART.woodD, { stroke: HART.out, sw: 1.1 });
  // Cuernos
  s += hartPath("M" + hartN(cx - S * 0.12) + " " + hartN(cy - S * 0.1) + "Q" + hartN(cx - S * 0.42) + " " + hartN(cy - S * 0.2) + " " + hartN(cx - S * 0.4) + " " + hartN(cy - S * 0.42), "none", { stroke: HART.cloth, sw: 2.6, cap: "round" });
  s += hartPath("M" + hartN(cx + S * 0.12) + " " + hartN(cy - S * 0.1) + "Q" + hartN(cx + S * 0.42) + " " + hartN(cy - S * 0.2) + " " + hartN(cx + S * 0.4) + " " + hartN(cy - S * 0.42), "none", { stroke: HART.cloth, sw: 2.6, cap: "round" });
  // Cráneo
  s += hartEllipse(cx, cy - S * 0.02, S * 0.15, S * 0.18, HART.cloth, { stroke: HART.out, sw: 0.9 });
  s += hartCircle(cx - S * 0.06, cy - S * 0.05, S * 0.04, "#1B1109") + hartCircle(cx + S * 0.06, cy - S * 0.05, S * 0.04, "#1B1109");
  s += hartLine(cx - S * 0.05, cy + S * 0.1, cx + S * 0.05, cy + S * 0.1, HART.clothD, 0.8);
  return s;
};

HART_DRAW.diana = function(L){
  var cx = L.w / 2, cy = L.h / 2, R = Math.min(L.w, L.h) / 2 - 4;
  var s = hartRoundBlock(cx, cy, R, ["#E3CD94", "#C9AE6E", "#8E7442"]);
  s += hartCircle(cx, cy, R * 0.72, HART.red, { stroke: HART.out, sw: 0.6 });
  s += hartCircle(cx, cy, R * 0.48, HART.paper);
  s += hartCircle(cx, cy, R * 0.22, HART.red);
  // Flechas clavadas
  [[0.15, -0.1, -0.7], [-0.3, 0.25, 2.2], [0.35, 0.3, 0.9]].forEach(function(a){
    var x = cx + a[0] * R, y = cy + a[1] * R;
    s += hartLine(x, y, x + Math.cos(a[2]) * R * 0.5, y + Math.sin(a[2]) * R * 0.5, HART.woodD, 1.2);
    s += hartCircle(x + Math.cos(a[2]) * R * 0.5, y + Math.sin(a[2]) * R * 0.5, 1.4, HART.cloth);
  });
  return s;
};

HART_DRAW.barriles = function(L){
  // Un barril por casilla, con pequeños desplazamientos fijos
  var s = "";
  var n = Math.max(1, L.cw * L.ch);
  var R = Math.min(L.w / L.cw, L.h / L.ch) / 2 - 5;
  for(var j = 0; j < L.ch; j++){
    for(var i = 0; i < L.cw; i++){
      var cx = (i + 0.5) * L.w / L.cw + (L.rnd() - 0.5) * 3, cy = (j + 0.5) * L.h / L.ch + (L.rnd() - 0.5) * 3;
      s += hartRoundBlock(cx, cy, R, HART_WOOD);
      s += hartCircle(cx, cy, R - 1.6, "none", { stroke: HART.ironD, sw: 1.8 });
      s += hartCircle(cx, cy, R * 0.55, "none", { stroke: HART.woodD, sw: 0.8, op: 0.7 });
      s += hartLine(cx - R * 0.6, cy, cx + R * 0.6, cy, HART.woodD, 0.7, { op: 0.6 });
      if(i === 0 && j === 0 && n > 0) s += hartCircle(cx + R * 0.3, cy + R * 0.3, 1.8, HART.gold, { stroke: HART.goldD, sw: 0.5 });
    }
  }
  return s;
};

HART_DRAW.planta = function(L){
  var cx = L.w / 2, cy = L.h / 2, R = Math.min(L.w, L.h) / 2 - 3;
  var s = hartRoundBlock(cx, cy, R * 0.55, [HART.clayL, HART.clay, HART.clayD]);
  s += hartCircle(cx, cy, R * 0.42, "#3A2618");
  // Hojas: más grande = más hojas
  var n = Math.max(7, Math.round(R * 0.45));
  var tones = [HART.leafD, HART.leaf, HART.leafL];
  for(var i = 0; i < n; i++){
    var a = i / n * Math.PI * 2 + L.rnd() * 0.4;
    var len = R * (0.7 + L.rnd() * 0.3), wid = R * 0.18;
    var tx = cx + Math.cos(a) * len, ty = cy + Math.sin(a) * len;
    var nx = -Math.sin(a) * wid, ny = Math.cos(a) * wid;
    var mx = cx + Math.cos(a) * len * 0.5, my = cy + Math.sin(a) * len * 0.5;
    s += hartPath("M" + hartN(cx) + " " + hartN(cy) + "Q" + hartN(mx + nx) + " " + hartN(my + ny) + " " + hartN(tx) + " " + hartN(ty) + "Q" + hartN(mx - nx) + " " + hartN(my - ny) + " " + hartN(cx) + " " + hartN(cy) + "Z", tones[i % 3], { stroke: HART.leafD, sw: 0.5 });
  }
  s += hartCircle(cx, cy, R * 0.15, HART.leafD);
  return s;
};

HART_DRAW.bonsai = function(L){
  var w = L.w, h = L.h, cx = w / 2, cy = h / 2, S = Math.min(w, h);
  var s = hartBlock(cx - S * 0.36, cy - S * 0.26, S * 0.72, S * 0.52, [HART.tealL, HART.teal, HART.tealD], 3);
  s += hartRect(cx - S * 0.3, cy - S * 0.2, S * 0.6, S * 0.4, "#3A2618", { rx: 2 });
  [[-0.14, -0.06, 0.16], [0.12, -0.1, 0.13], [0.04, 0.1, 0.14], [-0.04, -0.16, 0.1]].forEach(function(b, i){
    s += hartCircle(cx + b[0] * S, cy + b[1] * S, b[2] * S, i % 2 ? HART.leafL : HART.leaf, { stroke: HART.leafD, sw: 0.6 });
  });
  s += '<g class="hart-glow">' + hartCircle(cx, cy - S * 0.02, S * 0.05, HART.tealL, { op: 0.8 }) + '</g>';
  return s;
};

HART_DRAW.setas = function(L){
  var s = "";
  var n = Math.max(3, Math.round(L.cw * L.ch * 3));
  for(var i = 0; i < n; i++){
    var cx = 6 + L.rnd() * (L.w - 12), cy = 6 + L.rnd() * (L.h - 12);
    var r = 3 + L.rnd() * 4;
    s += '<g class="hart-glow">' + hartCircle(cx, cy, r * 1.8, HART.tealL, { op: 0.16 }) + '</g>';
    s += hartCircle(cx + 0.8, cy + 1, r, "rgba(0,0,0,0.3)");
    s += hartCircle(cx, cy, r, HART.teal, { stroke: HART.tealD, sw: 0.7 });
    s += hartCircle(cx - r * 0.3, cy - r * 0.3, r * 0.22, "#CDEFE4", { op: 0.85 }) + hartCircle(cx + r * 0.35, cy + r * 0.1, r * 0.15, "#CDEFE4", { op: 0.85 });
  }
  return s;
};

HART_DRAW.mapas = function(L){
  var w = L.w, h = L.h, p = 3;
  var s = hartBlock(p, p, w - 2 * p, h - 2 * p, HART_WOOD, 2);
  s += hartGrain(p + 1, p + 1, w - 2 * p - 2, h - 2 * p - 2, L.rnd);
  var mx = p + 5, my = p + 5, mw = w - 2 * p - 10, mh = h - 2 * p - 10;
  s += hartRect(mx + 1, my + 1.2, mw, mh, "rgba(0,0,0,0.25)");
  s += hartRect(mx, my, mw, mh, HART.paper, { stroke: HART.paperD, sw: 0.8 });
  s += hartPath("M" + hartN(mx + mw * 0.1) + " " + hartN(my + mh * 0.6) + "Q" + hartN(mx + mw * 0.3) + " " + hartN(my + mh * 0.2) + " " + hartN(mx + mw * 0.55) + " " + hartN(my + mh * 0.45) + "T" + hartN(mx + mw * 0.9) + " " + hartN(my + mh * 0.35), "none", { stroke: HART.teal, sw: 0.9, op: 0.8 });
  s += hartLine(mx + mw * 0.2, my + mh * 0.75, mx + mw * 0.7, my + mh * 0.3, HART.red, 0.8, { dash: "2,1.5" });
  s += hartCircle(mx + mw * 0.7, my + mh * 0.3, 1.6, HART.red);
  // Compás y catalejo
  s += hartCircle(mx + mw * 0.2, my + mh * 0.3, 3, "none", { stroke: HART.goldD, sw: 0.8 });
  s += hartLine(w - p - 4, h - p - 3, w - p - 18, h - p - 9, HART.gold, 2.4);
  return s;
};

HART_DRAW.reliquia = function(L){
  var cx = L.w / 2, cy = L.h / 2, R = Math.min(L.w, L.h) / 2 - 4;
  var pts = [];
  for(var i = 0; i < 8; i++){
    var a = (i + 0.5) / 8 * Math.PI * 2;
    pts.push(hartN(cx + Math.cos(a) * R) + " " + hartN(cy + Math.sin(a) * R));
  }
  var s = hartPath("M" + pts.join("L") + "Z", HART.stone, { stroke: HART.out, sw: 1.1 });
  s += hartCircle(cx, cy, R * 0.68, HART.stoneL, { op: 0.5 });
  s += '<g class="hart-glow">' + hartCircle(cx, cy, R * 0.6, HART.tealL, { op: 0.28 }) + '</g>';
  s += hartPath("M" + hartN(cx) + " " + hartN(cy - R * 0.45) + "L" + hartN(cx + R * 0.3) + " " + hartN(cy) + "L" + hartN(cx) + " " + hartN(cy + R * 0.45) + "L" + hartN(cx - R * 0.3) + " " + hartN(cy) + "Z", HART.tealL, { stroke: HART.tealD, sw: 0.9 });
  s += hartPath("M" + hartN(cx) + " " + hartN(cy - R * 0.45) + "L" + hartN(cx) + " " + hartN(cy + R * 0.45) + "M" + hartN(cx - R * 0.3) + " " + hartN(cy) + "H" + hartN(cx + R * 0.3), "none", { stroke: "#CDEFE4", sw: 0.6, op: 0.7 });
  return s;
};

HART_DRAW.telarana = function(L){
  // En la esquina de arriba a la izquierda
  var R = Math.min(L.w, L.h) - 4;
  var s = "";
  var spokes = 5;
  for(var i = 0; i < spokes; i++){
    var a = i / (spokes - 1) * Math.PI / 2;
    s += hartLine(2, 2, 2 + Math.cos(a) * R, 2 + Math.sin(a) * R, HART.cloth, 0.6, { op: 0.6 });
  }
  for(var k = 1; k <= 4; k++){
    var r = R * k / 4.4, d = "";
    for(i = 0; i < spokes; i++){
      var b = i / (spokes - 1) * Math.PI / 2;
      d += (i ? "L" : "M") + hartN(2 + Math.cos(b) * r) + " " + hartN(2 + Math.sin(b) * r);
    }
    s += hartPath(d, "none", { stroke: HART.cloth, sw: 0.5, op: 0.5 });
  }
  s += hartCircle(2 + R * 0.42, 2 + R * 0.3, 1.8, "#1B1109");
  return s;
};

HART_DRAW.escaleras = function(L){
  var w = L.w, h = L.h, p = 3;
  var down = L.key.indexOf("bajar") !== -1;
  var s = hartBlock(p, p, w - 2 * p, h - 2 * p, HART_WOOD, 2);
  var steps = Math.max(4, Math.round((h - 2 * p) / 8));
  for(var i = 1; i < steps; i++){
    var y = p + i * (h - 2 * p) / steps;
    s += hartLine(p + 1, y, w - p - 1, y, HART.woodD, 1.2) + hartLine(p + 2, y + 1.2, w - p - 2, y + 1.2, HART.woodL, 0.6, { op: 0.6 });
  }
  // Barandillas y flecha
  s += hartRect(p, p, 3, h - 2 * p, HART.woodD) + hartRect(w - p - 3, p, 3, h - 2 * p, HART.woodD);
  var cx = w / 2, a = Math.min(8, w * 0.18);
  s += down
    ? hartPath("M" + hartN(cx - a) + " " + hartN(h / 2 - a / 2) + "L" + hartN(cx) + " " + hartN(h / 2 + a / 2) + "L" + hartN(cx + a) + " " + hartN(h / 2 - a / 2), "none", { stroke: HART.goldL, sw: 2.2, cap: "round", join: "round" })
    : hartPath("M" + hartN(cx - a) + " " + hartN(h / 2 + a / 2) + "L" + hartN(cx) + " " + hartN(h / 2 - a / 2) + "L" + hartN(cx + a) + " " + hartN(h / 2 + a / 2), "none", { stroke: HART.goldL, sw: 2.2, cap: "round", join: "round" });
  return s;
};

HART_DRAW.puerta = function(L){
  var w = L.w, h = L.h;
  var s = hartRect(1, 1, 7, 7, HART.stone, { rx: 1, stroke: HART.out, sw: 0.8 }) + hartRect(w - 8, 1, 7, 7, HART.stone, { rx: 1, stroke: HART.out, sw: 0.8 });
  s += hartPath("M8 4.5A" + hartN(w - 13) + " " + hartN(h - 9) + " 0 0 1 " + hartN(w - 5) + " " + hartN(h - 4), "none", { stroke: HART.gold, sw: 1.2, dash: "3,2.5", op: 0.85 });
  s += hartRect(6.5, 4.5, 3.5, h - 9, HART.wood, { rx: 1, stroke: HART.out, sw: 0.8 });
  s += hartCircle(8.2, h * 0.55, 1.3, HART.goldL);
  return s;
};

HART_DRAW.puerta_doble = function(L){
  var w = L.w, h = L.h, m = w / 2;
  var s = hartRect(1, 1, 7, 7, HART.stone, { rx: 1, stroke: HART.out, sw: 0.8 }) + hartRect(w - 8, 1, 7, 7, HART.stone, { rx: 1, stroke: HART.out, sw: 0.8 });
  s += hartPath("M8 4.5A" + hartN(m - 8) + " " + hartN(m - 8) + " 0 0 1 " + hartN(m) + " " + hartN(m - 3.5), "none", { stroke: HART.gold, sw: 1.1, dash: "2.5,2", op: 0.85 });
  s += hartPath("M" + hartN(w - 8) + " 4.5A" + hartN(m - 8) + " " + hartN(m - 8) + " 0 0 0 " + hartN(m) + " " + hartN(m - 3.5), "none", { stroke: HART.gold, sw: 1.1, dash: "2.5,2", op: 0.85 });
  s += hartRect(6.5, 4.5, 3.2, Math.min(h - 9, m - 8), HART.wood, { rx: 1, stroke: HART.out, sw: 0.7 });
  s += hartRect(w - 9.7, 4.5, 3.2, Math.min(h - 9, m - 8), HART.wood, { rx: 1, stroke: HART.out, sw: 0.7 });
  return s;
};

HART_DRAW.entrada = function(L){
  var w = L.w, h = L.h;
  var s = hartBlock(4, 5, w - 8, h - 12, HART_WOOD_DARK, 2);
  s += hartLine(w / 2, 7, w / 2, h - 9, HART.out, 1);
  s += hartCircle(w / 2 - 3, h / 2, 1.5, HART.goldL) + hartCircle(w / 2 + 3, h / 2, 1.5, HART.goldL);
  s += hartCorners(4, 5, w - 8, h - 12, 5, HART.gold);
  s += hartRect(w * 0.3, h - 7, w * 0.4, 5, HART.stone, { rx: 1, stroke: HART.out, sw: 0.7 });
  return s;
};

HART_DRAW.arco = function(L){
  var w = L.w, h = L.h;
  var s = hartBlock(2, 9, 8, h - 18, HART_STONE, 1) + hartBlock(w - 10, 9, 8, h - 18, HART_STONE, 1);
  s += hartLine(10, 11, w - 10, 11, HART.goldL, 1, { dash: "2,2", op: 0.7 }) + hartLine(10, h - 11, w - 10, h - 11, HART.goldL, 1, { dash: "2,2", op: 0.7 });
  return s;
};

HART_DRAW.ventana = function(L){
  var w = L.w, h = L.h;
  var s = hartPath("M" + hartN(w * 0.15) + " " + hartN(h * 0.62) + "L" + hartN(w * 0.85) + " " + hartN(h * 0.62) + "L" + hartN(w) + " " + hartN(h) + "L0 " + hartN(h) + "Z", HART.fireL, { op: 0.12 });
  s += hartBlock(2, h * 0.36, w - 4, h * 0.26, HART_WOOD, 1);
  s += hartRect(5, h * 0.42, w - 10, h * 0.14, "#9CC3C9", { op: 0.75 });
  s += hartLine(w / 2, h * 0.36, w / 2, h * 0.62, HART.woodD, 1.2);
  return s;
};

HART_DRAW.generico = function(L){
  // Caja de madera con su nombre
  var w = L.w, h = L.h, p = 4;
  var s = hartBlock(p, p, w - 2 * p, h - 2 * p, HART_WOOD, 2);
  s += hartPlanks(p, p, w - 2 * p, h - 2 * p, Math.max(2, Math.round((h - 2 * p) / 9)), true, HART.woodD);
  s += hartLine(p + 2, p + 2, w - p - 2, h - p - 2, HART.woodD, 1.6, { op: 0.8 }) + hartLine(w - p - 2, p + 2, p + 2, h - p - 2, HART.woodD, 1.6, { op: 0.8 });
  s += hartCorners(p, p, w - 2 * p, h - 2 * p, 5);
  if(L.label){
    var maxChars = Math.max(4, Math.floor((w - 2 * p) / 5));
    var txt = L.label.length > maxChars ? L.label.slice(0, maxChars - 1) + "…" : L.label;
    s += hartRect(w / 2 - Math.min(w - 2 * p - 4, txt.length * 4.6 + 4) / 2, h / 2 - 5, Math.min(w - 2 * p - 4, txt.length * 4.6 + 4), 10, HART.paper, { rx: 1.5, stroke: HART.paperD, sw: 0.6 });
    s += '<text x="' + hartN(w / 2) + '" y="' + hartN(h / 2 + 2.6) + '" text-anchor="middle" font-size="7.5" font-family="Georgia, serif" fill="#3A2618">' + hartEscText(txt) + '</text>';
  }
  return s;
};

// ---------------------------------------------------------------------------
// Función principal
// ---------------------------------------------------------------------------
function drawHouseItemSVG(type, w, h, opts){
  opts = opts || {};
  var cw = Math.max(0.5, Math.round((w || 1) * 2) / 2);
  var ch = Math.max(0.5, Math.round((h || 1) * 2) / 2);
  var key = String(type || "").toLowerCase();
  var kind = getHouseArtKind(key);
  // La caja genérica lleva su nombre escrito: no se gira para que se pueda leer
  var rot = kind === "generico" ? 0 : ((Math.round((opts.rotation || 0) / 90) * 90) % 360 + 360) % 360;
  var W = cw * HART_U, H = ch * HART_U;
  // El dibujo se hace sin girar (ancho y alto se cambian si el giro es de 90° o 270°) y luego se gira
  var odd = rot === 90 || rot === 270;
  var lcw = odd ? ch : cw, lch = odd ? cw : ch;
  var Lw = lcw * HART_U, Lh = lch * HART_U;
  var simple = opts.simple === true || (typeof opts.cellPx === "number" && opts.cellPx < 14);
  var inner;
  if(simple){
    inner = hartDrawSimple(kind, Lw, Lh);
  } else {
    var L = {
      w: Lw, h: Lh, cw: Math.max(1, Math.round(lcw)), ch: Math.max(1, Math.round(lch)), key: key,
      rnd: hartRng((opts.seed || key) + ":" + lcw + "x" + lch),
      owner: hartHexToRgb(opts.ownerColor) ? opts.ownerColor : null,
      label: opts.label || ""
    };
    inner = (HART_DRAW[kind] || HART_DRAW.generico)(L);
  }
  var tr = rot ? 'translate(' + hartN(W / 2) + ' ' + hartN(H / 2) + ') rotate(' + rot + ') translate(' + hartN(-Lw / 2) + ' ' + hartN(-Lh / 2) + ')' : '';
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="canva-svg hart hart-' + kind + '" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' +
    (tr ? '<g transform="' + tr + '">' + inner + '</g>' : inner) +
    '</svg>';
}
