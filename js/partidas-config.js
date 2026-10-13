// Partidas: cada una es un proyecto de Supabase aparte. Solo claves públicas (anon).
var PARTIDAS = [
  {
    id: "krysalis",
    nombre: "Krysalis",
    url: "https://nwjbdevshaucnjrwebtb.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53amJkZXZzaGF1Y25qcndlYnRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMzA4OTIsImV4cCI6MjEwMzYwNjg5Mn0.WUISbOthy-5hTZ69p5lydHxHP4ZfAM4nLFa13lKPoeY"
  },
  {
    id: "partida2",
    nombre: "Partida 2",
    url: "https://teyxwlezzpongijlslty.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRleXh3bGV6enBvbmdpamxzbHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5MTg4NDMsImV4cCI6MjEwNzQ5NDg0M30.BslXL77ijWeuOTlAtvLr7_m-16mzz2Vr-Te5FPGIQq8"
  }
];

var PARTIDA_STORAGE_KEY = "krysalis_partida";

var PARTIDA_ACTUAL = (function(){
  var id = null;
  try { id = localStorage.getItem(PARTIDA_STORAGE_KEY); } catch(e){}
  return PARTIDAS.find(function(p){ return p.id === id; }) || PARTIDAS[0];
})();

// Claves de datos de partida en localStorage: Krysalis conserva las de siempre;
// las demás llevan prefijo (empieza por "krysalis_" para que la limpieza no las borre)
function pkey(k){
  return PARTIDA_ACTUAL.id === "krysalis" ? k : "krysalis_p_" + PARTIDA_ACTUAL.id + "__" + k;
}

function cambiarPartida(id){
  if(!PARTIDAS.some(function(p){ return p.id === id; }) || id === PARTIDA_ACTUAL.id) return;
  try { localStorage.setItem(PARTIDA_STORAGE_KEY, id); } catch(e){}
  var recargar = function(){ location.reload(); };
  if(typeof supabaseClient !== "undefined" && supabaseClient){
    supabaseClient.auth.signOut({ scope: "local" }).then(recargar, recargar);
  } else {
    recargar();
  }
}
