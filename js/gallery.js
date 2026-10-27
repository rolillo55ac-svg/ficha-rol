// Galería de Mundo (tabla gallery) e Historia del personaje (tabla character_story), tarea 56.
// La historia NO va en el JSON de la ficha ni en localStorage: solo en memoria y en su tabla con RLS.
var GALLERY_CAMPAIGN_ID = "c0000000-0000-0000-0000-000000000001";
var GALLERY_MAX = 300;
var galleryItems = null;      // null = sin cargar
var galleryLoading = false;
var galleryUploading = false;
var galleryFilter = "todas";  // "todas" | "mias"
var galleryChannel = null;
var galleryViewIndex = -1;    // foto ampliada (índice en la lista filtrada)

var storyCache = {};          // db_id -> { texto, visible, loaded }
var storyEditing = {};        // db_id -> true mientras se edita
var storyBusy = {};

function galleryMyId(){ return (typeof currentUser !== "undefined" && currentUser) ? currentUser.id : null; }

function galleryCanDelete(it){
  return !!it && (isGM() || it.uploaded_by === galleryMyId());
}

function galleryVisibleItems(){
  var list = galleryItems || [];
  if(galleryFilter === "mias"){
    var me = galleryMyId();
    list = list.filter(function(it){ return it.uploaded_by === me; });
  }
  return list;
}

async function loadGallery(){
  if(galleryLoading || typeof supabaseClient === "undefined" || !supabaseClient) return;
  galleryLoading = true;
  try {
    var res = await supabaseClient.from("gallery").select("*")
      .eq("campaign_id", GALLERY_CAMPAIGN_ID).order("created_at", { ascending: false }).limit(GALLERY_MAX);
    if(res.error){ console.warn("No se pudo leer la galería:", res.error.message); galleryItems = galleryItems || []; }
    else galleryItems = res.data || [];
  } catch(e){
    console.warn("No se pudo leer la galería:", e);
    galleryItems = galleryItems || [];
  }
  galleryLoading = false;
  subscribeGallery();
  galleryRefresh();
}

function subscribeGallery(){
  if(!supabaseClient || galleryChannel) return;
  try {
    galleryChannel = supabaseClient.channel("realtime_gallery", { config: { private: true } })
      .on("postgres_changes", { event: "*", schema: "public", table: "gallery" }, function(payload){
        if(!payload || !galleryItems) return;
        if(payload.eventType === "INSERT" && payload.new && payload.new.campaign_id === GALLERY_CAMPAIGN_ID){
          if(!galleryItems.some(function(it){ return it.id === payload.new.id; })) galleryItems.unshift(payload.new);
        } else if(payload.eventType === "DELETE" && payload.old){
          galleryItems = galleryItems.filter(function(it){ return it.id !== payload.old.id; });
        } else return;
        galleryRefresh();
      })
      .subscribe();
  } catch(e){
    console.warn("Error suscribiendo a la galería:", e);
  }
}

// Repinta solo si se está viendo la galería (o la foto ampliada)
function galleryRefresh(){
  if(galleryViewIndex >= 0) renderGalleryViewer();
  if(typeof houseState !== "undefined" && houseState && houseState.active) return;
  if(state.activeTab === "mundo" && currentWorldSubtab === "galeria" && typeof renderTab === "function") renderTab();
}

async function galleryMyName(){
  var c = (typeof activeChar === "function") ? activeChar() : null;
  try {
    var res = await supabaseClient.from("profiles").select("display_name").eq("id", galleryMyId()).maybeSingle();
    if(res.data && res.data.display_name) return String(res.data.display_name).slice(0, 80);
  } catch(e){}
  if(c && c.name && canEditChar(c) && !isGM()) return String(c.name).slice(0, 80);
  var em = (currentUser && currentUser.email) ? currentUser.email.split("@")[0] : "";
  return em.slice(0, 80) || null;
}

function galleryUpload(file, title){
  if(!file || galleryUploading) return;
  if(!/^image\//.test(file.type || "")){ showToast("Solo se pueden subir imágenes.", "error"); return; }
  if((galleryItems || []).length >= GALLERY_MAX){ showToast("La galería ya tiene " + GALLERY_MAX + " fotos. Quita alguna antes de subir más.", "error"); return; }
  galleryUploading = true;
  galleryRefresh();
  optimizeImageForUpload(file, 1600, 0.85, async function(blob){
    var path = "galeria/" + GALLERY_CAMPAIGN_ID + "/" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8) + ".jpg";
    try {
      var up = await supabaseClient.storage.from("images").upload(path, blob, { contentType: "image/jpeg", cacheControl: "3600", upsert: false });
      if(up.error) throw up.error;
      var pub = supabaseClient.storage.from("images").getPublicUrl(path);
      var url = pub && pub.data ? pub.data.publicUrl : null;
      if(!url) throw new Error("sin enlace");
      var row = { campaign_id: GALLERY_CAMPAIGN_ID, url: url, path: path, title: (title || "").trim().slice(0, 80) || null,
                  uploaded_by: galleryMyId(), uploader_name: await galleryMyName() };
      var ins = await supabaseClient.from("gallery").insert(row).select("*").single();
      if(ins.error) throw ins.error;
      if(galleryItems && !galleryItems.some(function(it){ return it.id === ins.data.id; })) galleryItems.unshift(ins.data);
      showToast("Foto añadida a la galería.", "success");
    } catch(e){
      console.warn("No se pudo subir la foto:", e);
      showToast(/300/.test(e && e.message || "") ? "La galería ya tiene " + GALLERY_MAX + " fotos." : "No se pudo subir la foto. Inténtalo de nuevo.", "error");
    }
    galleryUploading = false;
    galleryRefresh();
  });
}

async function galleryDelete(id){
  var it = (galleryItems || []).find(function(x){ return x.id === id; });
  if(!galleryCanDelete(it)) return;
  if(!(await confirmarQuitar(it.title || "esta foto", "Se quita de la galería para todos."))) return;
  var res = await supabaseClient.from("gallery").delete().eq("id", id).select("id");
  if(res.error || !res.data || !res.data.length){ showToast("No se pudo quitar la foto.", "error"); return; }
  // El archivo solo lo puede borrar quien lo subió; si no, se queda en el almacén
  if(it.path && it.uploaded_by === galleryMyId()){
    try { await supabaseClient.storage.from("images").remove([it.path]); } catch(e){}
  }
  galleryItems = galleryItems.filter(function(x){ return x.id !== id; });
  var vis = galleryVisibleItems();
  if(galleryViewIndex >= vis.length) galleryViewIndex = vis.length - 1;
  if(!vis.length) closeGalleryViewer();
  showToast("Foto quitada.", "success");
  galleryRefresh();
}

function openGalleryViewer(index){
  galleryViewIndex = index;
  renderGalleryViewer();
}

function closeGalleryViewer(){
  galleryViewIndex = -1;
  var ov = document.getElementById("galleryViewer");
  if(ov && ov.parentNode) ov.parentNode.removeChild(ov);
}

function galleryStep(delta){
  var n = galleryVisibleItems().length;
  if(!n) return;
  galleryViewIndex = (galleryViewIndex + delta + n) % n;
  renderGalleryViewer();
}

// ---------- Historia ----------

function storyKey(c){ return c && c.db_id ? String(c.db_id) : null; }

async function loadStory(c){
  var k = storyKey(c);
  if(!k || storyBusy[k] || typeof supabaseClient === "undefined" || !supabaseClient) return;
  storyBusy[k] = true;
  try {
    var res = await supabaseClient.from("character_story").select("texto, visible_para_jugadores").eq("character_id", k).maybeSingle();
    if(res.error) console.warn("No se pudo leer la historia:", res.error.message);
    // Sin fila puede ser que no exista o que sea privada: no se distingue a propósito
    storyCache[k] = { texto: res.data ? (res.data.texto || "") : "", visible: !!(res.data && res.data.visible_para_jugadores), loaded: true, hidden: !res.data };
  } catch(e){
    console.warn("No se pudo leer la historia:", e);
    storyCache[k] = { texto: "", visible: false, loaded: true, hidden: true };
  }
  storyBusy[k] = false;
  storyRefresh();
}

// Solo se repinta la sección de Historia: repintar la pestaña entera rompería La Casa u otra vista abierta
function storyRefresh(){
  var el = document.getElementById("storySection");
  if(!el || typeof activeChar !== "function") return;
  var html = tplHistoria(activeChar());
  if(html) el.outerHTML = html;
}

async function saveStory(c, patch){
  var k = storyKey(c);
  if(!k || !canEditChar(c)) return false;
  // Solo se mandan los campos que cambian: si la lectura falló, cambiar el interruptor no vacía el texto guardado
  var row = { character_id: k, updated_by: galleryMyId(), actualizado: new Date().toISOString() };
  if(patch.texto !== undefined) row.texto = String(patch.texto).slice(0, 20000);
  if(patch.visible !== undefined) row.visible_para_jugadores = !!patch.visible;
  var res = await supabaseClient.from("character_story").upsert(row, { onConflict: "character_id" }).select("texto, visible_para_jugadores").single();
  if(res.error){ console.warn("No se pudo guardar la historia:", res.error.message); showToast("No se pudo guardar la historia.", "error"); return false; }
  storyCache[k] = { texto: res.data.texto || "", visible: !!res.data.visible_para_jugadores, loaded: true, hidden: false };
  return true;
}

// La caché de historias es de la cuenta con la que se leyó: al cambiar de cuenta se vacía
var storyCacheUser = null;
function storyEnsureUser(){
  var me = galleryMyId();
  if(storyCacheUser !== me){ storyCache = {}; storyEditing = {}; storyCacheUser = me; }
}

// ---------- Tarea 56: Plantillas y Eventos de Galería e Historia ----------

function tplMundoGaleria(s){
  if(galleryItems === null) loadGallery();

  var total = galleryItems ? galleryItems.length : 0;
  var items = galleryVisibleItems();
  var isFull = total >= GALLERY_MAX;

  var html = '<div class="section">' +
    '<div class="section-title">' +
      '<span>' + icono("cuadro", {tam:"s"}) + ' Galería</span>' +
      '<span class="gallery-counter">' + total + ' / ' + GALLERY_MAX + '</span>' +
    '</div>' +
    '<div class="gallery-toolbar">' +
      '<div class="filter-pills">' +
        '<button type="button" class="f-pill' + (galleryFilter === "todas" ? " active" : "") + '" data-action="gal-filter" data-val="todas">Todas</button>' +
        '<button type="button" class="f-pill' + (galleryFilter === "mias" ? " active" : "") + '" data-action="gal-filter" data-val="mias">Mías</button>' +
      '</div>' +
      '<div class="gallery-upload-area">';

  if(isFull){
    html += '<div class="gallery-max-warn">Galería completa (' + GALLERY_MAX + ' / ' + GALLERY_MAX + '). Quita alguna foto antes de subir más.</div>';
  } else {
    html += '<input type="text" class="gallery-title-input k-input" maxlength="80" placeholder="Título (opcional)">';
    if(galleryUploading){
      html += '<span class="btn-solid-gold gallery-upload-btn gallery-uploading" aria-disabled="true">Subiendo…</span>';
    } else {
      html += '<label class="btn-solid-gold gallery-upload-btn">' + icono("camara", {tam:"s"}) + ' Subir foto<input type="file" accept="image/*" class="gallery-file" hidden></label>';
    }
  }

  html += '</div></div>';

  if(galleryLoading && (!galleryItems || galleryItems.length === 0)){
    html += '<div class="gallery-loading">Cargando…</div>';
  } else if(!items.length){
    html += '<div class="gallery-empty">Todavía no hay fotos. ¡Sube la primera!</div>';
  } else {
    html += '<div class="gallery-grid">';
    items.forEach(function(it, i){
      html += '<button type="button" class="gallery-thumb" data-action="gal-open" data-idx="' + i + '">' +
        '<img src="' + esc(safeUrl(it.url)) + '" alt="' + esc(it.title || '') + '" loading="lazy" class="gallery-thumb-img">' +
        (it.title ? '<span class="gallery-thumb-title">' + esc(it.title) + '</span>' : '') +
      '</button>';
    });
    html += '</div>';
  }

  html += '</div>';
  return html;
}

function renderGalleryViewer(){
  var list = galleryVisibleItems();
  if(galleryViewIndex < 0 || galleryViewIndex >= list.length){
    closeGalleryViewer();
    return;
  }
  var it = list[galleryViewIndex];
  if(!it){
    closeGalleryViewer();
    return;
  }

  galleryEnsureViewerListeners();

  var v = document.getElementById("galleryViewer");
  if(!v){
    v = document.createElement("div");
    v.id = "galleryViewer";
    v.className = "gallery-viewer";
    document.body.appendChild(v);
  }

  var uploader = it.uploader_name ? esc(it.uploader_name) : "Anónimo";
  var dateStr = it.created_at ? new Date(it.created_at).toLocaleDateString("es-ES") : "";
  var metaStr = "Subida por " + uploader + (dateStr ? " · " + dateStr : "");
  var canDel = galleryCanDelete(it);

  var html = '<button type="button" class="gallery-viewer-close" data-action="gal-close" aria-label="Cerrar">' + iconoUI("cerrar") + '</button>';
  if(list.length > 1){
    html += '<button type="button" class="gallery-viewer-nav gallery-viewer-prev" data-action="gal-prev" aria-label="Anterior">' + iconoUI("chevron-izquierda") + '</button>' +
      '<button type="button" class="gallery-viewer-nav gallery-viewer-next" data-action="gal-next" aria-label="Siguiente">' + iconoUI("chevron-derecha") + '</button>';
  }

  html += '<div class="gallery-viewer-body">' +
    '<img class="gallery-viewer-img" src="' + esc(safeUrl(it.url)) + '" alt="' + esc(it.title || '') + '">' +
    '<div class="gallery-viewer-info">' +
      (it.title ? '<div class="gallery-viewer-title">' + esc(it.title) + '</div>' : '') +
      '<div class="gallery-viewer-meta">' + metaStr + '</div>' +
      '<div class="gallery-viewer-counter">' + (galleryViewIndex + 1) + ' / ' + list.length + '</div>' +
      (canDel ? '<button type="button" class="btn-compact gallery-viewer-del" data-action="gal-del" data-id="' + esc(it.id) + '">Quitar</button>' : '') +
    '</div>' +
  '</div>';

  v.innerHTML = html;
}

var galleryViewerListenersAttached = false;
function galleryEnsureViewerListeners(){
  if(galleryViewerListenersAttached) return;
  galleryViewerListenersAttached = true;

  var touchStartX = 0;
  var touchStartY = 0;

  document.addEventListener("touchstart", function(e){
    if(galleryViewIndex < 0 || !e.changedTouches || !e.changedTouches.length) return;
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
  }, { passive: true });

  document.addEventListener("touchend", function(e){
    if(galleryViewIndex < 0 || !e.changedTouches || !e.changedTouches.length) return;
    var touchEndX = e.changedTouches[0].clientX;
    var touchEndY = e.changedTouches[0].clientY;
    var dx = touchEndX - touchStartX;
    var dy = touchEndY - touchStartY;
    if(Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy)){
      if(dx < 0) galleryStep(1);
      else galleryStep(-1);
    }
  }, { passive: true });

  document.addEventListener("keydown", function(e){
    if(galleryViewIndex < 0) return;
    if(e.key === "Escape"){
      e.preventDefault();
      closeGalleryViewer();
    } else if(e.key === "ArrowLeft"){
      e.preventDefault();
      galleryStep(-1);
    } else if(e.key === "ArrowRight"){
      e.preventDefault();
      galleryStep(1);
    }
  });
}

function tplHistoria(c){
  if(!c || !c.db_id) return "";

  storyEnsureUser();
  var k = storyKey(c);
  var st = storyCache[k];

  if(!st){
    loadStory(c);
    return '<div class="section" id="storySection">' +
      '<div class="section-title"><span>' + icono("guia", {tam:"s"}) + ' Historia</span></div>' +
      '<div class="story-loading">Cargando…</div>' +
    '</div>';
  }

  var canEdit = canEditChar(c);
  var isEditing = canEdit && !!storyEditing[k];

  var html = '<div class="section" id="storySection">' +
    '<div class="section-title">' +
      '<span>' + icono("guia", {tam:"s"}) + ' Historia</span>' +
      (canEdit && !isEditing ? '<button type="button" class="btn-compact story-btn" data-action="story-edit">' + iconoUI("editar") + ' Editar</button>' : '') +
    '</div>';

  if(isEditing){
    html += '<textarea class="k-input story-textarea" id="storyText" maxlength="20000">' + esc(st.texto || '') + '</textarea>' +
      '<div class="story-actions">' +
        '<button type="button" class="btn-solid-gold story-btn" data-action="story-save">Guardar</button>' +
        '<button type="button" class="btn-compact story-btn" data-action="story-cancel">Cancelar</button>' +
      '</div>';
  } else {
    var hasText = !!(st.texto && st.texto.trim());
    var textMsg = "";
    if(hasText){
      textMsg = esc(st.texto);
    } else if(canEdit){
      textMsg = "Sin historia todavía.";
    } else {
      textMsg = "Su historia es privada o aún no está escrita.";
    }
    html += '<div class="story-read' + (!hasText ? ' story-empty' : '') + '">' + textMsg + '</div>';
  }

  if(canEdit){
    html += '<div class="story-visible-wrap">' +
      '<label class="story-visible">' +
        '<input type="checkbox" class="k-check" data-action="story-visible"' + (st.visible ? ' checked' : '') + '> ' +
        '<span>Otros jugadores pueden leer mi historia</span>' +
      '</label>' +
      '<div class="story-visible-hint">El máster siempre puede leerla.</div>' +
    '</div>';
  }

  html += '</div>';
  return html;
}

// Delegación de eventos (Click y Change)
document.addEventListener("click", function(e){
  var actEl = e.target.closest("[data-action]");

  if(!actEl){
    if(galleryViewIndex >= 0){
      var v = document.getElementById("galleryViewer");
      if(v && v.contains(e.target)){
        if(!e.target.closest(".gallery-viewer-img") && !e.target.closest(".gallery-viewer-info")){
          closeGalleryViewer();
        }
      }
    }
    return;
  }

  var action = actEl.getAttribute("data-action") || "";
  if(!action.startsWith("gal-") && !action.startsWith("story-")) return;

  if(actEl.tagName === "BUTTON") e.preventDefault();

  if(action === "gal-filter"){
    var val = actEl.getAttribute("data-val") || "todas";
    galleryFilter = val;
    if(typeof renderTab === "function") renderTab();
  } else if(action === "gal-open"){
    var idx = parseInt(actEl.getAttribute("data-idx"), 10);
    if(!isNaN(idx)) openGalleryViewer(idx);
  } else if(action === "gal-close"){
    closeGalleryViewer();
  } else if(action === "gal-prev"){
    galleryStep(-1);
  } else if(action === "gal-next"){
    galleryStep(1);
  } else if(action === "gal-del"){
    var id = actEl.getAttribute("data-id");
    if(id) galleryDelete(id);
  } else if(action === "story-edit"){
    var c = (typeof activeChar === "function") ? activeChar() : null;
    var k = storyKey(c);
    if(k){
      storyEditing[k] = true;
      if(typeof renderTab === "function") renderTab();
    }
  } else if(action === "story-cancel"){
    var c = (typeof activeChar === "function") ? activeChar() : null;
    var k = storyKey(c);
    if(k){
      delete storyEditing[k];
      if(typeof renderTab === "function") renderTab();
    }
  } else if(action === "story-save"){
    var c = (typeof activeChar === "function") ? activeChar() : null;
    var k = storyKey(c);
    var ta = document.getElementById("storyText");
    var txt = ta ? ta.value : "";
    saveStory(c, { texto: txt }).then(function(ok){
      if(ok){
        if(k) delete storyEditing[k];
        if(typeof showToast === "function") showToast("Historia guardada.", "success");
        if(typeof renderTab === "function") renderTab();
      }
    });
  }
});

document.addEventListener("change", function(e){
  if(e.target && e.target.classList.contains("gallery-file")){
    var file = e.target.files && e.target.files[0];
    var titleInput = document.querySelector(".gallery-title-input");
    var titleVal = titleInput ? titleInput.value : "";
    if(file){
      galleryUpload(file, titleVal);
    }
    e.target.value = "";
    if(titleInput) titleInput.value = "";
    return;
  }

  var actEl = e.target.closest("[data-action]");
  if(!actEl) return;
  var action = actEl.getAttribute("data-action") || "";
  if(action === "story-visible"){
    var cb = actEl.matches('input[type="checkbox"]') ? actEl : actEl.querySelector('input[type="checkbox"]');
    var checked = cb ? cb.checked : false;
    var c = (typeof activeChar === "function") ? activeChar() : null;
    saveStory(c, { visible: checked }).then(function(){
      // Si se estaba escribiendo, el texto sin guardar se conserva al repintar
      var ta = document.getElementById("storyText");
      var borrador = ta ? ta.value : null;
      if(typeof renderTab === "function") renderTab();
      var ta2 = document.getElementById("storyText");
      if(ta2 && borrador !== null) ta2.value = borrador;
    });
  }
});

galleryEnsureViewerListeners();

