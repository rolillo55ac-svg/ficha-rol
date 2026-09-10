/* ==========================================================================
   KRYSALIS - MOTOR DE DADOS 3D REAL (THREE.JS) ESTILO BALDUR'S GATE 3
   ========================================================================== */

var audioCtx = null;
function getAudioCtx(){
  if(!audioCtx){
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e){}
  }
  if(audioCtx && audioCtx.state === 'suspended'){
    audioCtx.resume();
  }
  return audioCtx;
}

/* --- MOTOR DE AUDIO PROCEDURAL D&D --- */

function playBg3DiceRoll(){
  var ctx = getAudioCtx(); if(!ctx) return;
  var now = ctx.currentTime;

  try {
    var bufferSize = Math.floor(ctx.sampleRate * 0.45);
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for(var i = 0; i < bufferSize; i++){
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.28));
    }
    var noise = ctx.createBufferSource();
    noise.buffer = buffer;
    var filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(340, now);
    filter.frequency.exponentialRampToValueAtTime(190, now + 0.42);
    filter.Q.setValueAtTime(2.8, now);
    var nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.001, now);
    nGain.gain.linearRampToValueAtTime(0.13, now + 0.04);
    nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    noise.connect(filter); filter.connect(nGain); nGain.connect(ctx.destination);
    noise.start(now); noise.stop(now + 0.45);
  } catch(e){}

  var taps = [0.02, 0.08, 0.15, 0.23, 0.31, 0.39];
  taps.forEach(function(dt, idx){
    var t = now + dt;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = (idx % 2 === 0) ? "triangle" : "sine";
    var baseFreq = 270 + (idx * 22) + Math.random() * 70;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.65, t + 0.035);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.12 / (1 + idx * 0.14), t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.038);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.042);
  });
}

function playBg3DiceLand(){
  var ctx = getAudioCtx(); if(!ctx) return;
  var now = ctx.currentTime;

  var thud = ctx.createOscillator();
  var tGain = ctx.createGain();
  thud.type = "sine";
  thud.frequency.setValueAtTime(115, now);
  thud.frequency.exponentialRampToValueAtTime(42, now + 0.16);
  tGain.gain.setValueAtTime(0.001, now);
  tGain.gain.linearRampToValueAtTime(0.26, now + 0.012);
  tGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
  thud.connect(tGain); tGain.connect(ctx.destination);
  thud.start(now); thud.stop(now + 0.2);

  var click = ctx.createOscillator();
  var cGain = ctx.createGain();
  click.type = "triangle";
  click.frequency.setValueAtTime(520, now);
  click.frequency.exponentialRampToValueAtTime(190, now + 0.03);
  cGain.gain.setValueAtTime(0.001, now);
  cGain.gain.linearRampToValueAtTime(0.16, now + 0.003);
  cGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.038);
  click.connect(cGain); cGain.connect(ctx.destination);
  click.start(now); click.stop(now + 0.042);
}

function playBg3ModifierAdd(){
  var ctx = getAudioCtx(); if(!ctx) return;
  var now = ctx.currentTime;
  [880, 1320].forEach(function(f, idx){
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(f, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08 / (idx + 1), now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.3);
  });
}

function playBg3Crit(){
  var ctx = getAudioCtx(); if(!ctx) return;
  var now = ctx.currentTime;
  var notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
  notes.forEach(function(freq, i){
    var t = now + i * 0.045;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = (i === 4) ? "sine" : "triangle";
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.14, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.7);
  });
}

function playBg3Fumble(){
  var ctx = getAudioCtx(); if(!ctx) return;
  var now = ctx.currentTime;
  var osc = ctx.createOscillator();
  var gain = ctx.createGain();
  osc.type = "sawtooth";
  var filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(220, now);
  filter.frequency.exponentialRampToValueAtTime(70, now + 0.45);
  osc.frequency.setValueAtTime(110, now);
  osc.frequency.exponentialRampToValueAtTime(55, now + 0.45);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.15, now + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
  osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
  osc.start(now); osc.stop(now + 0.55);
}

function playBg3Click(){
  var ctx = getAudioCtx(); if(!ctx) return;
  var now = ctx.currentTime;
  var osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(110, now + 0.025);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.08, now + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.028);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(now); osc.stop(now + 0.032);
}

function playBg3Parchment(){
  var ctx = getAudioCtx(); if(!ctx) return;
  var now = ctx.currentTime;
  try {
    var bufferSize = Math.floor(ctx.sampleRate * 0.12);
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for(var i = 0; i < bufferSize; i++){
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.04));
    }
    var noise = ctx.createBufferSource();
    noise.buffer = buffer;
    var filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(650, now);
    filter.Q.setValueAtTime(2.0, now);
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
    noise.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    noise.start(now); noise.stop(now + 0.12);
  } catch(e){}
}

function playBg3RuneActivate(){
  var ctx = getAudioCtx(); if(!ctx) return;
  var now = ctx.currentTime;
  var osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(440, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(now); osc.stop(now + 0.16);
}

function playCupRattleAudio(){ playBg3DiceRoll(); }
function playDiceDropAudio(){ playBg3DiceLand(); }
function playDiceAudio(type){
  if(type === "crit") playBg3Crit();
  else if(type === "fumble") playBg3Fumble();
  else { playBg3DiceRoll(); setTimeout(playBg3DiceLand, 380); }
}

/* --- GEOMETRÍAS POLIÉDRICAS 3D --- */

function createD10Geometry(radius){
  if(typeof THREE === 'undefined') return null;
  var H = radius * 1.35;
  var h = radius * 0.32;
  var R = radius * 0.95;
  var north = new THREE.Vector3(0, H, 0);
  var south = new THREE.Vector3(0, -H, 0);
  var upper = [], lower = [];
  for(var i = 0; i < 5; i++){
    var aU = (i * 72) * Math.PI / 180;
    upper.push(new THREE.Vector3(R * Math.cos(aU), h, R * Math.sin(aU)));
    var aL = ((i * 72) + 36) * Math.PI / 180;
    lower.push(new THREE.Vector3(R * Math.cos(aL), -h, R * Math.sin(aL)));
  }
  var positions = [];
  for(var j = 0; j < 5; j++){
    var uCurr = upper[j], uNext = upper[(j + 1) % 5], lCurr = lower[j];
    positions.push(north.x, north.y, north.z, uCurr.x, uCurr.y, uCurr.z, lCurr.x, lCurr.y, lCurr.z);
    positions.push(north.x, north.y, north.z, lCurr.x, lCurr.y, lCurr.z, uNext.x, uNext.y, uNext.z);
  }
  for(var k = 0; k < 5; k++){
    var lC = lower[k], lN = lower[(k + 1) % 5], uN = upper[(k + 1) % 5];
    positions.push(south.x, south.y, south.z, lC.x, lC.y, lC.z, uN.x, uN.y, uN.z);
    positions.push(south.x, south.y, south.z, uN.x, uN.y, uN.z, lN.x, lN.y, lN.z);
  }
  var geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  geom.computeVertexNormals();
  return geom;
}

function getPolyhedralGeometry(sides){
  if(typeof THREE === 'undefined') return null;
  if(sides === 4) return new THREE.TetrahedronGeometry(1.65, 0);
  if(sides === 6) return new THREE.BoxGeometry(1.85, 1.85, 1.85);
  if(sides === 8) return new THREE.OctahedronGeometry(1.7, 0);
  if(sides === 10) return createD10Geometry(1.55);
  if(sides === 12) return new THREE.DodecahedronGeometry(1.55, 0);
  return new THREE.IcosahedronGeometry(1.6, 0);
}

function extractDistinctFaces(geom){
  if(typeof THREE === 'undefined') return [];
  var pos = geom.attributes.position.array;
  var faces = [];
  var triangleCount = pos.length / 9;

  for(var i = 0; i < triangleCount; i++){
    var vA = new THREE.Vector3(pos[i*9], pos[i*9+1], pos[i*9+2]);
    var vB = new THREE.Vector3(pos[i*9+3], pos[i*9+4], pos[i*9+5]);
    var vC = new THREE.Vector3(pos[i*9+6], pos[i*9+7], pos[i*9+8]);

    var center = new THREE.Vector3().add(vA).add(vB).add(vC).divideScalar(3);
    var cb = new THREE.Vector3().subVectors(vC, vB);
    var ab = new THREE.Vector3().subVectors(vA, vB);
    var normal = new THREE.Vector3().crossVectors(cb, ab).normalize();

    var existing = faces.find(function(f){ return f.normal.distanceTo(normal) < 0.08; });
    if(!existing){
      faces.push({ id: faces.length + 1, center: center, normal: normal });
    } else {
      existing.center.add(center).multiplyScalar(0.5);
    }
  }
  return faces;
}

function createFaceNumeralTexture(labelStr, isTriangle){
  if(typeof document === 'undefined') return null;
  var c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  var ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 128, 128);

  ctx.strokeStyle = 'rgba(222, 195, 146, 0.42)';
  ctx.lineWidth = 2.4;
  if(isTriangle){
    ctx.beginPath();
    ctx.moveTo(64, 20);
    ctx.lineTo(112, 108);
    ctx.lineTo(16, 108);
    ctx.closePath();
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(64, 64, 46, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = '#FFF5DC';
  var fontSize = (labelStr.length > 2) ? 36 : (labelStr.length > 1 ? 42 : 50);
  ctx.font = 'bold ' + fontSize + "px 'Cinzel', serif, Georgia";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(labelStr, 64, isTriangle ? 72 : 64);

  var tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function create3DDieObject(sides, isTens){
  if(typeof THREE === 'undefined') return null;
  var geom = getPolyhedralGeometry(sides);
  if(!geom) return null;

  var faces = extractDistinctFaces(geom);
  var dieGroup = new THREE.Group();

  var baseMat = new THREE.MeshStandardMaterial({
    color: 0x1f142b,
    roughness: 0.18,
    metalness: 0.22,
    transparent: true,
    opacity: 1
  });
  var baseMesh = new THREE.Mesh(geom, baseMat);
  dieGroup.add(baseMesh);

  var edgeGeom = new THREE.EdgesGeometry(geom);
  var edgeMat = new THREE.LineBasicMaterial({ color: 0xdec392, linewidth: 2 });
  var edges = new THREE.LineSegments(edgeGeom, edgeMat);
  dieGroup.add(edges);

  var isTri = (sides === 4 || sides === 8 || sides === 20);
  var decalScale = (sides === 4) ? 0.95 : (sides === 6 ? 1.3 : (sides === 8 ? 1.05 : (sides === 10 ? 0.85 : 0.9)));
  var decals = [];

  faces.forEach(function(f, idx){
    var valNum = idx + 1;
    var labelStr = String(valNum);
    if(isTens){
      var tVal = (idx * 10);
      labelStr = (tVal < 10 ? "0" : "") + tVal;
    }
    var tex = createFaceNumeralTexture(labelStr, isTri);
    var planeGeom = new THREE.PlaneGeometry(decalScale, decalScale);
    var planeMat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1
    });
    var decal = new THREE.Mesh(planeGeom, planeMat);
    decal.position.copy(f.center).add(f.normal.clone().multiplyScalar(0.018));
    decal.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), f.normal);
    decal.userData = { faceIndex: idx, value: valNum, label: labelStr };
    dieGroup.add(decal);
    decals.push(decal);
  });

  return {
    group: dieGroup,
    baseMesh: baseMesh,
    edges: edges,
    decals: decals,
    faces: faces,
    sides: sides,
    isTens: isTens
  };
}

/* --- ESCENA THREE.JS (CANVAS 3D EN EL SANTUARIO BG3) --- */

var bg3ThreeScene = null;
var bg3ThreeCamera = null;
var bg3ThreeRenderer = null;
var bg3ThreeAnimId = null;
var bg3Die1Obj = null;
var bg3Die2Obj = null;

var bg3PhysicsState = {
  rolling: false,
  startTime: 0,
  duration: 850,
  targetQ1: null,
  targetQ2: null,
  spinV1: { x: 0, y: 0, z: 0 },
  spinV2: { x: 0, y: 0, z: 0 },
  onComplete: null
};

function initBg3ThreeScene(sides, mode){
  var canvas = document.getElementById("bg3DiceCanvas");
  if(!canvas || typeof THREE === 'undefined') return false;

  stopBg3ThreeLoop();

  var width = canvas.clientWidth || 380;
  var height = canvas.clientHeight || 210;

  if(!bg3ThreeRenderer){
    try {
      bg3ThreeRenderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
      bg3ThreeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    } catch(e){
      console.warn("WebGL not supported:", e);
      return false;
    }
  }
  bg3ThreeRenderer.setSize(width, height, false);

  bg3ThreeScene = new THREE.Scene();
  bg3ThreeCamera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  bg3ThreeCamera.position.set(0, 0, 8.2);

  var amb = new THREE.AmbientLight(0x351d45, 1.4);
  bg3ThreeScene.add(amb);

  var keyLight = new THREE.DirectionalLight(0xfff5dc, 2.2);
  keyLight.position.set(4, 6, 7);
  bg3ThreeScene.add(keyLight);

  var rimLight = new THREE.DirectionalLight(0x7c4da0, 1.6);
  rimLight.position.set(-5, -3, 4);
  bg3ThreeScene.add(rimLight);

  var isAdv = (mode === "adv" || mode === "disadv");
  var isPercentile = (sides === 100);

  if(isPercentile){
    bg3Die1Obj = create3DDieObject(10, true);
    bg3Die2Obj = create3DDieObject(10, false);
    bg3Die1Obj.group.position.set(-1.65, 0, 0);
    bg3Die2Obj.group.position.set(1.65, 0, 0);
    bg3ThreeScene.add(bg3Die1Obj.group);
    bg3ThreeScene.add(bg3Die2Obj.group);
  } else if(isAdv){
    bg3Die1Obj = create3DDieObject(sides, false);
    bg3Die2Obj = create3DDieObject(sides, false);
    bg3Die1Obj.group.position.set(-1.65, 0, 0);
    bg3Die2Obj.group.position.set(1.65, 0, 0);
    bg3ThreeScene.add(bg3Die1Obj.group);
    bg3ThreeScene.add(bg3Die2Obj.group);
  } else {
    bg3Die1Obj = create3DDieObject(sides, false);
    bg3Die2Obj = null;
    bg3Die1Obj.group.position.set(0, 0, 0);
    bg3ThreeScene.add(bg3Die1Obj.group);
  }

  startBg3ThreeLoop();
  return true;
}

function startBg3ThreeLoop(){
  if(bg3ThreeAnimId) cancelAnimationFrame(bg3ThreeAnimId);

  function animate(time){
    bg3ThreeAnimId = requestAnimationFrame(animate);

    if(!bg3PhysicsState.rolling){
      // Rotación suave e hipnótica en estado inactivo
      var t = time * 0.0012;
      if(bg3Die1Obj && bg3Die1Obj.group){
        bg3Die1Obj.group.rotation.x = Math.sin(t) * 0.25;
        bg3Die1Obj.group.rotation.y = t * 0.5;
        bg3Die1Obj.group.position.y = Math.sin(t * 1.5) * 0.08;
      }
      if(bg3Die2Obj && bg3Die2Obj.group){
        bg3Die2Obj.group.rotation.x = Math.cos(t * 0.9) * 0.25;
        bg3Die2Obj.group.rotation.y = -t * 0.45;
        bg3Die2Obj.group.position.y = Math.cos(t * 1.5) * 0.08;
      }
    } else {
      // Lanzamiento físico y rodadura 3D
      var elapsed = performance.now() - bg3PhysicsState.startTime;
      var p = Math.min(1, elapsed / bg3PhysicsState.duration);
      var easeOut = 1 - Math.pow(1 - p, 3);

      if(p < 0.65){
        var dt = 0.016;
        var spinDecay = 1 - (p / 0.65) * 0.4;
        if(bg3Die1Obj && bg3Die1Obj.group){
          bg3Die1Obj.group.rotation.x += bg3PhysicsState.spinV1.x * dt * spinDecay;
          bg3Die1Obj.group.rotation.y += bg3PhysicsState.spinV1.y * dt * spinDecay;
          bg3Die1Obj.group.rotation.z += bg3PhysicsState.spinV1.z * dt * spinDecay;
          // Salto en el aire
          bg3Die1Obj.group.position.y = Math.sin(p * Math.PI) * 1.1;
        }
        if(bg3Die2Obj && bg3Die2Obj.group){
          bg3Die2Obj.group.rotation.x += bg3PhysicsState.spinV2.x * dt * spinDecay;
          bg3Die2Obj.group.rotation.y += bg3PhysicsState.spinV2.y * dt * spinDecay;
          bg3Die2Obj.group.rotation.z += bg3PhysicsState.spinV2.z * dt * spinDecay;
          bg3Die2Obj.group.position.y = Math.sin(p * Math.PI) * 1.1;
        }
      } else {
        // Asentamiento progresivo y slerp final hacia la cara resultante
        var slerpP = (p - 0.65) / 0.35;
        var slerpEase = 1 - Math.pow(1 - slerpP, 2);
        if(bg3Die1Obj && bg3Die1Obj.group && bg3PhysicsState.targetQ1){
          bg3Die1Obj.group.quaternion.slerp(bg3PhysicsState.targetQ1, slerpEase);
          // Rebote al caer
          var bTime = (p - 0.65) * 6;
          bg3Die1Obj.group.position.y = Math.max(0, Math.sin(bTime * Math.PI) * Math.exp(-bTime * 2) * 0.35);
        }
        if(bg3Die2Obj && bg3Die2Obj.group && bg3PhysicsState.targetQ2){
          bg3Die2Obj.group.quaternion.slerp(bg3PhysicsState.targetQ2, slerpEase);
          var bTime2 = (p - 0.65) * 6;
          bg3Die2Obj.group.position.y = Math.max(0, Math.sin(bTime2 * Math.PI) * Math.exp(-bTime2 * 2) * 0.35);
        }
      }

      if(p >= 1){
        bg3PhysicsState.rolling = false;
        if(bg3Die1Obj && bg3Die1Obj.group && bg3PhysicsState.targetQ1){
          bg3Die1Obj.group.quaternion.copy(bg3PhysicsState.targetQ1);
          bg3Die1Obj.group.position.y = 0;
        }
        if(bg3Die2Obj && bg3Die2Obj.group && bg3PhysicsState.targetQ2){
          bg3Die2Obj.group.quaternion.copy(bg3PhysicsState.targetQ2);
          bg3Die2Obj.group.position.y = 0;
        }
        if(typeof bg3PhysicsState.onComplete === 'function'){
          bg3PhysicsState.onComplete();
          bg3PhysicsState.onComplete = null;
        }
      }
    }

    if(bg3ThreeRenderer && bg3ThreeScene && bg3ThreeCamera){
      bg3ThreeRenderer.render(bg3ThreeScene, bg3ThreeCamera);
    }
  }
  bg3ThreeAnimId = requestAnimationFrame(animate);
}

function stopBg3ThreeLoop(){
  if(bg3ThreeAnimId){
    cancelAnimationFrame(bg3ThreeAnimId);
    bg3ThreeAnimId = null;
  }
}

function computeTargetQuaternion(dieObj, targetValue){
  if(!dieObj || !dieObj.faces || !dieObj.faces.length) return new THREE.Quaternion();
  var idx = (targetValue - 1) % dieObj.faces.length;
  if(idx < 0) idx = 0;
  var face = dieObj.faces[idx];
  var q = new THREE.Quaternion();
  q.setFromUnitVectors(face.normal, new THREE.Vector3(0, 0, 1));
  return q;
}

function startBg3ThreePhysicsTumble(r1, r2, onComplete){
  if(typeof THREE === 'undefined' || !bg3Die1Obj){
    if(typeof onComplete === 'function') onComplete();
    return;
  }

  bg3PhysicsState.rolling = true;
  bg3PhysicsState.startTime = performance.now();
  bg3PhysicsState.duration = 850;
  bg3PhysicsState.onComplete = onComplete;

  bg3PhysicsState.spinV1 = {
    x: 18 + Math.random() * 10,
    y: 22 + Math.random() * 12,
    z: 14 + Math.random() * 8
  };
  bg3PhysicsState.targetQ1 = computeTargetQuaternion(bg3Die1Obj, r1);

  if(bg3Die2Obj){
    bg3PhysicsState.spinV2 = {
      x: 16 + Math.random() * 10,
      y: -20 - Math.random() * 12,
      z: 12 + Math.random() * 8
    };
    bg3PhysicsState.targetQ2 = computeTargetQuaternion(bg3Die2Obj, r2 || 1);
  }
}

function disposeBg3ThreeScene(){
  stopBg3ThreeLoop();
  if(bg3ThreeScene){
    while(bg3ThreeScene.children.length > 0){
      var obj = bg3ThreeScene.children[0];
      bg3ThreeScene.remove(obj);
      if(obj.geometry) obj.geometry.dispose();
      if(obj.material){
        if(Array.isArray(obj.material)) obj.material.forEach(function(m){ m.dispose(); });
        else obj.material.dispose();
      }
    }
  }
  bg3Die1Obj = null;
  bg3Die2Obj = null;
}

/* --- COMPATIBILIDAD CON SVG PLANO SI WEBGL NO ESTÁ DISPONIBLE --- */

function getBg3DieSvg(sides, value){
  var val = (value !== undefined && value !== null) ? value : sides;
  return '<svg class="bg3-die-svg" viewBox="0 0 160 160"><circle cx="80" cy="80" r="65" fill="#20142b" stroke="#dec392" stroke-width="3"/><text x="80" y="94" font-size="36" fill="#fff5dc" text-anchor="middle" font-weight="bold">'+val+'</text></svg>';
}

function getDieSvg(sides){
  return getBg3DieSvg(sides, sides);
}

function getOrnateCupSvg(){
  return getBg3DieSvg(20, 20);
}

/* --- CONTROLADOR DE LA CÁMARA BALDUR'S GATE 3 --- */

var bg3RollState = {
  active: false,
  title: "Tirada de Destino",
  subtitle: "Prueba General (1d20)",
  sides: 20,
  qty: 1,
  dc: 10,
  dcActive: true,
  mode: "normal", // 'normal' | 'adv' | 'disadv'
  modifiers: [],
  charName: "Aventurero",
  rolling: false,
  resolved: false,
  r1: null,
  r2: null,
  chosen: null,
  total: 0,
  isCrit: false,
  isFumble: false,
  isSuccess: false,
  onResolve: null,
  rerollFn: null
};

function getBg3ModIconSvg(type, iconHint){
  var h = (iconHint || type || "").toLowerCase();
  if(h.includes("int") || h.includes("saber") || h.includes("magia") || h.includes("book")) return '<span>📖</span>';
  if(h.includes("fis") || h.includes("fuerza") || h.includes("melee") || h.includes("espada")) return '<span>⚔️</span>';
  if(h.includes("des") || h.includes("agil") || h.includes("distancia") || h.includes("arco")) return '<span>🏹</span>';
  if(h.includes("per") || h.includes("ojo") || h.includes("advertir") || h.includes("buscar")) return '<span>👁️</span>';
  if(h.includes("car") || h.includes("voz") || h.includes("lira") || h.includes("mask")) return '<span>🎭</span>';
  if(h.includes("skill") || h.includes("entren") || h.includes("rango")) return '<span>🏅</span>';
  if(h.includes("veneno") || h.includes("mono") || h.includes("maldicion")) return '<span>💀</span>';
  return '<span>✨</span>';
}

function openBg3RollModal(cfg){
  cfg = cfg || {};
  bg3RollState.active = true;
  bg3RollState.title = cfg.title || "Prueba";
  bg3RollState.subtitle = cfg.subtitle || ("Tirada (1d" + (cfg.sides || 20) + ")");
  bg3RollState.sides = cfg.sides || 20;
  bg3RollState.qty = cfg.qty || 1;
  bg3RollState.dc = (cfg.dc !== undefined && cfg.dc !== null) ? parseInt(cfg.dc, 10) : 10;
  bg3RollState.dcActive = cfg.dcActive !== undefined ? Boolean(cfg.dcActive) : true;
  bg3RollState.mode = cfg.mode || "normal";
  bg3RollState.charName = cfg.charName || ((typeof activeChar === "function" && activeChar() && activeChar().name) ? activeChar().name : "Aventurero");
  bg3RollState.modifiers = Array.isArray(cfg.modifiers) ? cfg.modifiers.slice() : [];
  bg3RollState.onResolve = cfg.onResolve || null;
  bg3RollState.rerollFn = cfg.rerollFn || null;
  bg3RollState.rolling = false;
  bg3RollState.resolved = false;
  bg3RollState.r1 = null;
  bg3RollState.r2 = null;
  bg3RollState.chosen = null;
  bg3RollState.total = 0;

  var titleEl = document.getElementById("bg3RollTitle");
  if(titleEl) titleEl.textContent = bg3RollState.title;
  var subEl = document.getElementById("bg3RollSubtitle");
  if(subEl) subEl.textContent = bg3RollState.subtitle;

  var dcValEl = document.getElementById("bg3DcValue");
  if(dcValEl) dcValEl.textContent = bg3RollState.dc;
  var dcStatusEl = document.getElementById("bg3DcStatus");
  if(dcStatusEl) dcStatusEl.textContent = bg3RollState.dcActive ? "Objetivo activo" : "Sin CD (Libre)";
  var dcPlate = document.getElementById("bg3DcPlate");
  if(dcPlate) dcPlate.style.opacity = bg3RollState.dcActive ? "1" : "0.45";

  updateBg3ModePills();

  var verdictBanner = document.getElementById("bg3VerdictBanner");
  if(verdictBanner) verdictBanner.className = "bg3-verdict-plate hidden";
  var promptBanner = document.getElementById("bg3PromptBanner");
  if(promptBanner) promptBanner.style.display = "inline-flex";
  var postActions = document.getElementById("bg3PostActions");
  if(postActions) postActions.classList.add("hidden");
  var addModBtn = document.getElementById("bg3BtnAddMod");
  if(addModBtn) addModBtn.style.display = "inline-flex";
  var popover = document.getElementById("bg3AddModPopover");
  if(popover) popover.classList.add("hidden");

  renderBg3ModCards();

  var overlay = document.getElementById("rollOverlay");
  if(overlay) overlay.classList.remove("hidden");

  // Iniciar escena 3D en el Canvas
  setTimeout(function(){
    initBg3ThreeScene(bg3RollState.sides, bg3RollState.mode);
  }, 30);

  playBg3RuneActivate();
}

function updateBg3ModePills(){
  var pills = document.querySelectorAll(".bg3-mode-pill");
  pills.forEach(function(p){
    var m = p.getAttribute("data-mode");
    if(m === bg3RollState.mode) p.classList.add("active");
    else p.classList.remove("active");
  });
  if(bg3ThreeScene && bg3RollState.active){
    initBg3ThreeScene(bg3RollState.sides, bg3RollState.mode);
  }
}

function renderBg3ModCards(){
  var container = document.getElementById("bg3ModCards");
  if(!container) return;
  var sum = 0;
  var html = "";

  bg3RollState.modifiers.forEach(function(m, idx){
    var v = parseFloat(m.val) || 0;
    sum += v;
    var sign = v >= 0 ? "+" : "";
    var icon = getBg3ModIconSvg(m.type, m.icon || m.label);
    html += '<div class="bg3-card" data-idx="'+idx+'">'+
      '<span class="bg3-card-val '+(v<0?'neg':'')+'">'+sign+v+'</span>'+
      '<div class="bg3-card-icon">'+icon+'</div>'+
      '<span class="bg3-card-lbl" title="'+esc(m.label)+'">'+esc(m.label)+'</span>'+
      (m.custom ? '<button class="bg3-card-del" data-action="bg3-del-mod" data-idx="'+idx+'" title="Eliminar">✕</button>' : '')+
    '</div>';
  });

  if(!bg3RollState.modifiers.length){
    html = '<div style="font-size:0.75rem;color:var(--ink-faint);font-style:italic;padding:12px 0;">Sin modificadores activos</div>';
  }

  container.innerHTML = html;
  var totalValEl = document.getElementById("bg3TotalModVal");
  if(totalValEl){
    totalValEl.textContent = (sum >= 0 ? "+" : "") + sum;
  }
}

function triggerBg3Roll(){
  if(bg3RollState.rolling) return;
  bg3RollState.rolling = true;
  bg3RollState.resolved = false;

  var promptBanner = document.getElementById("bg3PromptBanner");
  if(promptBanner) promptBanner.style.display = "none";
  var addModBtn = document.getElementById("bg3BtnAddMod");
  if(addModBtn) addModBtn.style.display = "none";

  playBg3DiceRoll();

  var r1 = rollDie(bg3RollState.sides);
  var r2 = (bg3RollState.mode !== "normal") ? rollDie(bg3RollState.sides) : null;
  var chosen = r1;
  if(bg3RollState.mode === "adv") chosen = Math.max(r1, r2);
  else if(bg3RollState.mode === "disadv") chosen = Math.min(r1, r2);

  bg3RollState.r1 = r1;
  bg3RollState.r2 = r2;
  bg3RollState.chosen = chosen;

  startBg3ThreePhysicsTumble(r1, r2, function(){
    playBg3DiceLand();

    // Efecto visual de bonificadores sumándose
    var modSum = 0;
    var cards = document.querySelectorAll(".bg3-card");
    cards.forEach(function(c, idx){
      setTimeout(function(){
        c.classList.add("pulse");
        playBg3ModifierAdd();
      }, idx * 140);
    });

    bg3RollState.modifiers.forEach(function(m){
      modSum += (parseFloat(m.val) || 0);
    });

    var grandTotal = chosen + modSum;
    bg3RollState.total = grandTotal;

    var isCrit = false;
    var isFumble = false;
    if(bg3RollState.sides === 20){
      isCrit = (chosen === 20);
      isFumble = (chosen === 1);
    } else if(bg3RollState.sides === 10){
      isCrit = (chosen === 10);
      isFumble = (chosen === 1);
    } else {
      isCrit = (chosen === bg3RollState.sides);
      isFumble = (chosen === 1);
    }
    bg3RollState.isCrit = isCrit;
    bg3RollState.isFumble = isFumble;

    var isSuccess = true;
    if(bg3RollState.dcActive){
      if(isCrit) isSuccess = true;
      else if(isFumble) isSuccess = false;
      else isSuccess = (grandTotal >= bg3RollState.dc);
    } else {
      isSuccess = !isFumble;
    }
    bg3RollState.isSuccess = isSuccess;

    // Destacar dado ganador en 3D
    if(bg3RollState.mode === "adv" && bg3Die1Obj && bg3Die2Obj){
      if(r1 >= r2){
        bg3Die1Obj.baseMesh.material.color.setHex(0x352010);
        bg3Die1Obj.edges.material.color.setHex(0xfff5dc);
        bg3Die2Obj.baseMesh.material.opacity = 0.35;
      } else {
        bg3Die2Obj.baseMesh.material.color.setHex(0x352010);
        bg3Die2Obj.edges.material.color.setHex(0xfff5dc);
        bg3Die1Obj.baseMesh.material.opacity = 0.35;
      }
    } else if(bg3RollState.mode === "disadv" && bg3Die1Obj && bg3Die2Obj){
      if(r1 <= r2){
        bg3Die1Obj.baseMesh.material.color.setHex(0x331015);
        bg3Die2Obj.baseMesh.material.opacity = 0.35;
      } else {
        bg3Die2Obj.baseMesh.material.color.setHex(0x331015);
        bg3Die1Obj.baseMesh.material.opacity = 0.35;
      }
    }

    var delayVerdict = Math.max(300, cards.length * 140 + 100);
    setTimeout(function(){
      var vPlate = document.getElementById("bg3VerdictBanner");
      var vTitle = document.getElementById("bg3VerdictText");
      var vMath = document.getElementById("bg3VerdictBreakdown");

      if(vPlate && vTitle && vMath){
        vPlate.classList.remove("hidden", "success", "failure", "crit", "fumble");

        if(isCrit){
          vPlate.classList.add("crit");
          vTitle.textContent = "¡ÉXITO CRÍTICO!";
          playBg3Crit();
        } else if(isFumble){
          vPlate.classList.add("fumble");
          vTitle.textContent = "¡PIFIA CRÍTICA!";
          playBg3Fumble();
        } else if(bg3RollState.dcActive){
          if(isSuccess){
            vPlate.classList.add("success");
            vTitle.textContent = "¡ÉXITO!";
            playBg3Crit();
          } else {
            vPlate.classList.add("failure");
            vTitle.textContent = "FALLO";
            playBg3Fumble();
          }
        } else {
          vPlate.classList.add("success");
          vTitle.textContent = "RESULTADO: " + grandTotal;
        }

        var mathText = "[" + chosen + "] Dado";
        if(modSum !== 0){
          mathText += " + [" + (modSum > 0 ? "+" + modSum : modSum) + "] Bonos = " + grandTotal;
        }
        if(bg3RollState.dcActive){
          mathText += " (vs CD " + bg3RollState.dc + ")";
        }
        vMath.textContent = mathText;
      }

      var rollItem = {
        id: uid(),
        charName: bg3RollState.charName,
        label: bg3RollState.title,
        total: grandTotal,
        formulaText: "1d" + bg3RollState.sides + " [" + chosen + "]" + (modSum !== 0 ? (modSum > 0 ? " +" + modSum : " " + modSum) : "") + " = " + grandTotal,
        isCrit: isCrit,
        isFumble: isFumble,
        ts: Date.now()
      };
      state.rollLog.unshift(rollItem);
      if(state.rollLog.length > 20) state.rollLog.length = 20;
      saveState();
      broadcastDiceRoll(rollItem);

      var postActs = document.getElementById("bg3PostActions");
      if(postActs) postActs.classList.remove("hidden");

      bg3RollState.rolling = false;
      bg3RollState.resolved = true;
    }, delayVerdict);
  });
}

function closeBg3Roll(){
  disposeBg3ThreeScene();
  var overlay = document.getElementById("rollOverlay");
  if(overlay) overlay.classList.add("hidden");
  playBg3Click();
  bg3RollState.active = false;
  if(typeof bg3RollState.onResolve === "function" && bg3RollState.resolved){
    try { bg3RollState.onResolve(bg3RollState); } catch(e){}
  }
}

/* --- LANZADORES ESPECÍFICOS --- */

function openBg3SkillRoll(c, sdef){
  if(!c || !sdef) return;
  var attrKey = sdef.attr !== "hybrid" ? sdef.attr : ((c.skillHybrid && c.skillHybrid[sdef.id]) || sdef.hybridOptions[0]);
  var attrVal = getEffectiveAttr(attrKey, c);
  var attrName = ATTR_LABELS[attrKey] || "Atributo";
  var trainBonus = num(c.skillBonus ? c.skillBonus[sdef.id] : 0, 0);

  var modifiers = [
    { label: attrName, val: attrVal, icon: attrKey, type: "attr" }
  ];

  if(trainBonus > 0){
    modifiers.push({ label: "Entrenamiento", val: trainBonus, icon: "medal", type: "skill" });
  }

  if(c.activeBuffs){
    c.activeBuffs.forEach(function(ab){
      if(ab.active === false) return;
      var bVal = parseFloat(ab.bonus);
      if(isNaN(bVal) || bVal === 0) return;
      if(ab.attr === sdef.id || ab.attr === attrKey || ab.attr === "todo"){
        modifiers.push({ label: ab.name || "Buff", val: bVal, icon: bVal > 0 ? "flame" : "poison", type: "buff" });
      }
    });
  }

  if(c.buffs && c.buffs.mono){
    modifiers.push({ label: "Mono / Abstinencia", val: -1, icon: "poison", type: "buff" });
  }

  openBg3RollModal({
    title: sdef.name,
    subtitle: "Prueba de " + attrName + " (1d20)",
    sides: 20,
    dc: 10,
    dcActive: true,
    mode: "normal",
    charName: c.name,
    modifiers: modifiers
  });
}

function openBg3CustomSkillRoll(c, cs){
  if(!c || !cs) return;
  var attrKey = cs.attr || "destreza";
  var attrVal = getEffectiveAttr(attrKey, c);
  var attrName = ATTR_LABELS[attrKey] || "Atributo";
  var bonusVal = num(cs.bonus, 0);

  var modifiers = [
    { label: attrName, val: attrVal, icon: attrKey, type: "attr" }
  ];
  if(bonusVal > 0){
    modifiers.push({ label: "Rango", val: bonusVal, icon: "medal", type: "skill" });
  }

  if(c.activeBuffs){
    c.activeBuffs.forEach(function(ab){
      if(ab.active === false) return;
      var bVal = parseFloat(ab.bonus);
      if(isNaN(bVal) || bVal === 0) return;
      if(ab.attr === cs.id || ab.attr === attrKey || ab.attr === "todo"){
        modifiers.push({ label: ab.name || "Buff", val: bVal, icon: bVal > 0 ? "flame" : "poison", type: "buff" });
      }
    });
  }

  openBg3RollModal({
    title: cs.name,
    subtitle: "Prueba de " + attrName + " (1d20)",
    sides: 20,
    dc: 10,
    dcActive: true,
    mode: "normal",
    charName: c.name,
    modifiers: modifiers
  });
}

function openBg3AttrRoll(c, attrKey){
  if(!c || !attrKey) return;
  var attrVal = getEffectiveAttr(attrKey, c);
  var attrName = ATTR_LABELS[attrKey] || "Atributo";

  var modifiers = [
    { label: attrName, val: attrVal, icon: attrKey, type: "attr" }
  ];

  if(c.activeBuffs){
    c.activeBuffs.forEach(function(ab){
      if(ab.active === false) return;
      var bVal = parseFloat(ab.bonus);
      if(isNaN(bVal) || bVal === 0) return;
      if(ab.attr === attrKey || ab.attr === "todo"){
        modifiers.push({ label: ab.name || "Buff", val: bVal, icon: bVal > 0 ? "flame" : "poison", type: "buff" });
      }
    });
  }

  openBg3RollModal({
    title: "Prueba de " + attrName,
    subtitle: "Tirada de Atributo (1d20)",
    sides: 20,
    dc: 10,
    dcActive: true,
    mode: "normal",
    charName: c.name,
    modifiers: modifiers
  });
}

function openBg3WeaponRoll(c, wpn, formulaRaw){
  var reg = new RegExp('(\\d+)\\s*[dD]\\s*(\\d+)');
  var m = String(formulaRaw || "1d6").match(reg);
  var sides = m ? parseInt(m[2], 10) : 6;
  var rest = String(formulaRaw || "").slice(m ? (m.index + m[0].length) : 0);
  var modM = rest.match(new RegExp('^\\s*([+-]\\s*\\d+)'));
  var baseMod = modM ? parseInt(modM[1].replace(/\s+/g, ""), 10) : 0;

  var modifiers = [];
  if(baseMod !== 0){
    modifiers.push({ label: "Modificador Arma", val: baseMod, icon: "sword", type: "weapon" });
  }

  var wpnName = (wpn && wpn.name) ? wpn.name : "Arma";
  var isMelee = !wpnName.toLowerCase().includes("distancia") && !wpnName.toLowerCase().includes("arco");

  if(c && c.buffs){
    if(isMelee && c.buffs.sangre_ataque_melee) modifiers.push({ label: "Sangre Melé", val: 1, icon: "flame", type: "buff" });
    if(!isMelee && c.buffs.sangre_ataque_dist) modifiers.push({ label: "Sangre Distancia", val: 1, icon: "flame", type: "buff" });
    if(c.buffs.mono) modifiers.push({ label: "Mono", val: -1, icon: "poison", type: "buff" });
  }

  if(c && c.activeBuffs){
    c.activeBuffs.forEach(function(ab){
      if(ab.active === false) return;
      var bVal = parseFloat(ab.bonus);
      if(isNaN(bVal) || bVal === 0) return;
      if(isMelee && (ab.attr === "melee" || ab.attr === "melé")){
        modifiers.push({ label: ab.name || "Furia Melé", val: bVal, icon: "flame", type: "buff" });
      }
      if(!isMelee && ab.attr === "distancia"){
        modifiers.push({ label: ab.name || "Ojo Halcón", val: bVal, icon: "bow", type: "buff" });
      }
    });
  }

  openBg3RollModal({
    title: "Daño — " + wpnName,
    subtitle: "Tirada de Daño (1d" + sides + (baseMod ? (baseMod > 0 ? "+" + baseMod : baseMod) : "") + ")",
    sides: sides,
    dc: 10,
    dcActive: false,
    mode: "normal",
    charName: c ? c.name : "Aventurero",
    modifiers: modifiers
  });
}

function openBg3InitRoll(c){
  if(!c) return;
  var initVal = (c.combat && c.combat.iniciativa !== undefined) ? num(c.combat.iniciativa, 0) : 0;
  openBg3RollModal({
    title: "Iniciativa",
    subtitle: "Tirada de Combate (1d20)",
    sides: 20,
    dc: 10,
    dcActive: false,
    mode: "normal",
    charName: c.name,
    modifiers: [
      { label: "Iniciativa", val: initVal, icon: "destreza", type: "attr" }
    ]
  });
}

function openBg3FreeRoll(sides, qty, mod, mode){
  var s = parseInt(sides, 10) || 20;
  var m = parseInt(mod, 10) || 0;
  var curC = (typeof activeChar === "function") ? activeChar() : null;
  var cName = (curC && curC.name) ? curC.name : "Aventurero";

  var modifiers = [];
  if(m !== 0){
    modifiers.push({ label: "Modificador", val: m, icon: "rune", type: "custom", custom: false });
  }

  openBg3RollModal({
    title: (s === 100 ? "d% Percentil" : "Tirada 1d" + s),
    subtitle: "Tirada Libre (" + (s === 100 ? "1d100" : "1d" + s) + ")",
    sides: s,
    dc: 10,
    dcActive: false,
    mode: mode || "normal",
    charName: cName,
    modifiers: modifiers
  });
}

/* --- ADAPTADORES DE LLAMADAS HEREDADAS --- */

function openRollModal(label, scoreText, detailHtml, sides, isCrit, isFumble, advCardsHtml, rerollFn){
  openBg3RollModal({
    title: label || "Tirada",
    subtitle: detailHtml || ("Tirada 1d" + (sides || 20)),
    sides: sides || 20,
    dc: 10,
    dcActive: false,
    mode: "normal",
    modifiers: [],
    rerollFn: rerollFn
  });
}

function performD10Roll(charName, label, mod){
  var curC = (typeof activeChar === "function") ? activeChar() : null;
  openBg3SkillRoll(curC, { name: label, attr: "percepcion", id: "gen" });
}

function performWeaponRoll(charName, weaponName, formulaRaw){
  var curC = (typeof activeChar === "function") ? activeChar() : null;
  openBg3WeaponRoll(curC, { name: weaponName }, formulaRaw);
}

function parseSummonFormula(raw){
  var str = String(raw || "").trim();
  var mRev = str.match(/^(\d+)\s*\+\s*(\d*)d(\d+)$/i);
  if(mRev){
    return { qty: mRev[2] ? parseInt(mRev[2], 10) : 1, sides: parseInt(mRev[3], 10), mod: parseInt(mRev[1], 10) };
  }
  var mNorm = str.match(/^(\d*)d(\d+)(?:\s*([+-])\s*(\d+))?$/i);
  if(mNorm){
    var mod = (mNorm[3] && mNorm[4]) ? parseInt(mNorm[4], 10) * (mNorm[3] === '-' ? -1 : 1) : 0;
    return { qty: mNorm[1] ? parseInt(mNorm[1], 10) : 1, sides: parseInt(mNorm[2], 10), mod: mod };
  }
  var mNum = str.match(/^([+-]?\d+)$/);
  if(mNum) return { qty: 1, sides: 10, mod: parseInt(mNum[1], 10) };
  return { qty: 1, sides: 10, mod: 0 };
}

function performSummonRoll(charName, summonName, actionName, formulaRaw){
  var parsed = parseSummonFormula(formulaRaw);
  openBg3FreeRoll(parsed.sides, parsed.qty, parsed.mod, "normal");
}

function broadcastDiceRoll(rollObj){
  if(realtimeChannel && typeof realtimeChannel.send === 'function'){
    try {
      realtimeChannel.send({
        type: 'broadcast',
        event: 'dice_roll',
        payload: rollObj
      });
    } catch(e){
      console.warn("Could not broadcast dice roll:", e);
    }
  }
}

function handleRemoteDiceRoll(rollObj){
  if(!rollObj) return;
  state.rollLog.unshift({
    id: rollObj.id || uid(),
    charName: rollObj.charName || "Aventurero",
    label: rollObj.label || "Tirada",
    total: rollObj.total,
    formulaText: rollObj.formulaText,
    ts: rollObj.ts || Date.now()
  });
  if(state.rollLog.length > 20) state.rollLog.length = 20;
  saveState(true);

  var critText = rollObj.isCrit ? " ¡Éxito Crítico!" : (rollObj.isFumble ? " ¡Pifia Crítica!" : "");
  var toastType = rollObj.isCrit ? "success" : (rollObj.isFumble ? "error" : "info");
  showToast("🎲 " + rollObj.charName + " tiró " + rollObj.label + ": " + rollObj.total + critText, toastType);

  if(rollObj.isCrit) playBg3Crit();
  else if(rollObj.isFumble) playBg3Fumble();
  else { playBg3DiceRoll(); setTimeout(playBg3DiceLand, 300); }

  if(state.activeTab === "habilidades" || state.activeTab === "combate") {
    renderTab();
  }
}

/* --- MODAL SELECTOR DE DADOS (CUBILETE Y ELECCIÓN) --- */

var diceConfig = {
  sides: 20,
  qty: 1,
  mod: 0,
  mode: "normal"
};

function openDiceModal(){
  var sidesList = [4, 6, 8, 10, 12, 20, 100];
  var diceCards = sidesList.map(function(s){
    return '<div class="dtype-card '+(diceConfig.sides===s?'active':'')+'" data-action="pick-die" data-sides="'+s+'" role="button" tabindex="0">'+
      getDieSvg(s)+
      '<span>'+(s===100?'d%':'d'+s)+'</span>'+
    '</div>';
  }).join('');

  document.getElementById("diceModal").innerHTML =
    '<div class="cup-modal-header">'+
      '<div class="cup-modal-icon" style="width:40px;height:40px;">'+getDieSvg(diceConfig.sides)+'</div>'+
      '<div class="cup-modal-title">'+
        '<h3>Lanzador de Dados 3D</h3>'+
        '<div class="cup-modal-sub">Elige tu dado, modalidad y lanza en la Cámara 3D</div>'+
      '</div>'+
      '<button class="row-del" data-action="close-modal" aria-label="Cerrar" style="min-width:30px;min-height:30px;font-size:1rem;">✕</button>'+
    '</div>'+
    '<div class="dice-mode-pills">'+
      '<button class="dmode-pill '+(diceConfig.mode==='normal'?'active':'')+'" data-action="set-dice-mode" data-mode="normal">⚔️ Normal</button>'+
      '<button class="dmode-pill '+(diceConfig.mode==='adv'?'active':'')+'" data-action="set-dice-mode" data-mode="adv">🍀 Ventaja</button>'+
      '<button class="dmode-pill '+(diceConfig.mode==='disadv'?'active':'')+'" data-action="set-dice-mode" data-mode="disadv">💀 Desventaja</button>'+
    '</div>'+
    '<div class="cup-tray-label">Dados Poliédricos</div>'+
    '<div class="dtype-grid">'+diceCards+'</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px;">'+
      (diceConfig.sides===100?'<div></div>':'<div class="field"><label>Cantidad</label>'+
        '<div class="qty-control-row">'+
          '<button class="qty-btn" data-action="dec-dice-qty">-</button>'+
          '<input type="number" min="1" max="20" id="diceQty" value="'+diceConfig.qty+'" style="width:48px;text-align:center;">'+
          '<button class="qty-btn" data-action="inc-dice-qty">+</button>'+
        '</div>'+
        '<div class="quick-qty-chips" style="margin-top:4px;">'+
          [1,2,3,4].map(function(q){
            return '<button class="qty-chip '+(diceConfig.qty===q?'active':'')+'" data-action="set-dice-qty" data-qty="'+q+'">x'+q+'</button>';
          }).join('')+
        '</div>'+
      '</div>')+
      '<div class="field"><label>Modificador</label>'+
        '<div class="mod-control-row">'+
          '<input type="number" id="diceMod" value="'+diceConfig.mod+'" style="width:60px;text-align:center;">'+
          '<div class="quick-mod-chips">'+
            [-2,0,1,2,5].map(function(m){
              return '<button class="mod-chip '+(diceConfig.mod===m?'active':'')+'" data-action="set-dice-mod" data-mod="'+m+'">'+(m>0?'+'+m:m)+'</button>';
            }).join('')+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<button class="btn-solid-gold btn-roll-cup" data-action="roll-dice-btn">🎲 ¡Lanzar en la Cámara 3D!</button>';
  document.getElementById("diceModalOverlay").classList.remove("hidden");
}

function diceModalClick(e){
  var btn = e.target.closest("[data-action]"); if(!btn) return;
  var action = btn.getAttribute("data-action");
  if(action==="close-modal"){ closeModals(); return; }
  if(action==="set-dice-mode"){ diceConfig.mode = btn.getAttribute("data-mode"); openDiceModal(); return; }
  if(action==="inc-dice-qty"){ diceConfig.qty = Math.min(20, (diceConfig.qty||1)+1); openDiceModal(); return; }
  if(action==="dec-dice-qty"){ diceConfig.qty = Math.max(1, (diceConfig.qty||1)-1); openDiceModal(); return; }
  if(action==="set-dice-qty"){ diceConfig.qty = parseInt(btn.getAttribute("data-qty"),10)||1; openDiceModal(); return; }
  if(action==="set-dice-mod"){ diceConfig.mod = parseInt(btn.getAttribute("data-mod"),10)||0; openDiceModal(); return; }
  if(action==="pick-die"){ diceConfig.sides = parseInt(btn.getAttribute("data-sides"),10); openDiceModal(); return; }
  if(action==="roll-dice-btn"){
    var modInput = document.getElementById("diceMod");
    if(modInput) diceConfig.mod = parseInt(modInput.value,10)||0;
    var qtyInput = document.getElementById("diceQty");
    if(qtyInput) diceConfig.qty = Math.max(1, parseInt(qtyInput.value,10)||1);
    document.getElementById("diceModalOverlay").classList.add("hidden");

    openBg3FreeRoll(diceConfig.sides, diceConfig.qty, diceConfig.mod, diceConfig.mode);
    return;
  }
}

function rollLogHtml(){
  if(!state) return '';
  state.rollLog = state.rollLog || [];
  var logs = state.rollLog.slice(0,5);
  var html = '<div class="section"><div class="section-title"><span>Historial de Tiradas</span></div>';
  if(!logs.length){ html += '<div class="roll-empty">Sin tiradas recientes.</div>'; }
  else {
    html += '<div class="roll-log">'+logs.map(function(r){
      return '<div class="roll-log-item"><span>'+esc(r.charName)+' — '+esc(r.label)+'<br><span class="rl-formula">'+esc(r.formulaText)+'</span></span><span class="rl-result">'+r.total+'</span></div>';
    }).join('')+'</div>';
  }
  html += '</div>';
  return html;
}
