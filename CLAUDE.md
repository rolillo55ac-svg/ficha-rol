# ficha-rol (Rol Krysalis)

Web para jugar online con amigos a un juego de rol de mesa. Los cambios (dados, estadísticas, La Casa...) los ven todos en directo. Casi todos los jugadores usan el MÓVIL; el admin usa PC. Soy el único desarrollador.

## Cómo trabajar conmigo
- Responde en español, en lenguaje simple. Soy sysadmin y hago webs y scripts, pero me cuesta explicar lo que quiero en diseño/UX: si mi petición es vaga, hazme preguntas ANTES de tocar nada.
- Antes de modificar más de un archivo, el estado compartido o la base de datos, dame un plan corto y espera mi OK.
- Cambios mínimos. Nada de refactors, renombrados ni reformateos que no haya pedido. No propongas migrar de framework ni reescribir.
- Proyecto en JS puro: no añadas dependencias, bundlers ni paso de compilación sin preguntarme.
- Trabaja en una rama por tarea (`feat/...`, `fix/...`) con commits pequeños. No hagas push a `main` ni force push sin que lo pida. Mensajes de commit en español, estilo del repo: `fix(lapidario): ...`, `feat(house): ...`.
- Todo debe funcionar con el DEDO en móvil: objetivos táctiles de al menos 44 px, sin depender de hover ni de ratón.
- No hay tests automáticos. Al terminar un cambio, dime qué comprobaciones manuales hacer (lista al final).
- Ahorra uso: busca con grep antes de abrir un archivo y lee por rangos. NUNCA abras `js/konva.min.js` (librería minificada). Son muy grandes: `style.css`, `house.css`, `js/house.js`, `js/ui-events.js`, `js/ui-modals.js`, `js/dice.js`, `js/lapidary.js`, `js/ui-render.js`.

## Stack
- HTML + CSS + JavaScript puro, sin framework ni build. PWA instalable (`manifest.json`, `sw.js`). Versión actual 1.4.1.0.
- Supabase (Postgres con RLS, RPC, Storage y tiempo real) cargado por CDN (`@supabase/supabase-js@2`).
- Konva para el plano de La Casa: `js/konva.min.js` local, con respaldo por CDN en `index.html`.
- Estructura: `index.html`, `style.css`, `house.css`, `js/` (módulos), `migrations/` (SQL), `images/`, `sounds/`, `assets/`, `sw.js`, `version.json`.

## Scripts clásicos: reglas
- Los archivos de `js/` son scripts clásicos con variables y funciones GLOBALES. No hay módulos ES: NO uses `import`/`export`.
- `index.html` los carga en este orden y los archivos dependen entre sí: utils, state, supabase-client, auth, sync, characters, combat, catalog, bestiary, maps, markers, quests, konva.min, house, dice, lapidary, ui-modals, ui-render, ui-events, app.
- Un archivo nuevo en `js/` hay que añadirlo a `index.html` (en su sitio del orden, con `?v=`) Y a `PRECACHE_ASSETS` de `sw.js`.
- Antes de cambiar o renombrar una función o variable global, busca con grep todos sus usos en `js/` e `index.html`.

## Mapa de módulos (deducido de nombres y cabeceras; corrígeme si algo no cuadra)
- `state.js`: estado global (`state`), `APP_VERSION` y datos por defecto (venenos, pociones, ungüentos...).
- `supabase-client.js`: cliente Supabase y tiempo real. `auth.js`: login, roles (`isGM()`, `currentUser`).
- `sync.js`: guardado local (localStorage `krysalisFichasV311`) y en Supabase, con parches por diferencias (`dirtyCharIds`, `CHAR_DATA_KEYS`).
- `characters.js` fichas · `combat.js` combate · `dice.js` dados 3D, audio, háptica y envío de tiradas · `bestiary.js` bestiario · `catalog.js` catálogos.
- `maps.js` y `markers.js` mapas y marcadores · `quests.js` misiones.
- `house.js` La Casa (módulo aislado, marcado como prototipo beta) + `house.css`.
- `lapidary.js` minijuego del Taller de Lapidario y Piedras Mágicas.
- `ui-render.js` pintado de vistas · `ui-events.js` eventos · `ui-modals.js` ventanas modales y monitor de versión/almacenamiento.
- `utils.js` utilidades, subida de imágenes (bucket `images`) y comprobación de versión · `app.js` arranque.

## Versionado y caché (PWA)
Los móviles guardan la web en caché. Al terminar un cambio de cliente que se vaya a publicar, PROPÓN subir la versión y pregúntame antes de hacerlo. Hay que cambiarla a la vez en:
1. `APP_VERSION` en `js/state.js`
2. `CACHE_NAME` en `sw.js`
3. `version.json` (`version`, `build`, `updatedAt`, `changelog`)
4. los `?v=` de los `<script>` en `index.html`
`sw.js` no cachea `supabase.co` ni `version.json`.

## Supabase
- Tablas que usa el cliente: campaigns, campaign_members, characters, profiles, maps, map_markers, campaign_map, weapons_catalog, bestiary, buff_catalog, app_feedback, house, house_rooms, house_upgrades, house_events. RLS activado.
- Guardados críticos por RPC atómicas: `update_character_data`, `update_campaign_map`, `toggle_house_upgrade`, `add_house_progress`. Mantén ese patrón.
- Tiempo real: `broadcast` (tiradas, estadísticas, sonidos, La Casa) y `postgres_changes` (`house_rooms`).
- Roles: `campaign_members.role` es `GM` o `PLAYER`, además del admin.
- SEGURIDAD: `isGM()` decide en el cliente (lee localStorage y, sin usuario, devuelve true). Sirve para la interfaz, NO es seguridad. La protección real debe estar en RLS y RPC. Nunca pongas claves `service_role` ni secretos en el repo (solo la clave `anon`, que es pública).
- Cambios de esquema: nunca edites migraciones ya aplicadas. Crea una nueva en `migrations/` (siguiente número, p. ej. `018_...sql`) y dame el SQL para ejecutarlo yo en Supabase. No tienes acceso a la base de datos.
- Si añades un campo nuevo a un personaje, revisa `CHAR_DATA_KEYS` en `js/sync.js`: es la lista de campos que se sincronizan y probablemente deba incluirlo.

## Trabajo en curso: rediseño de La Casa
- Casa mágica con vida: sube de nivel, da buffos, cada jugador tiene su habitación; hay baúl/inventario por estancia.
- Solo admin y máster modifican el plano. Los jugadores lo ven en el móvil.
- Problemas actuales: habitaciones que se solapan, nombres cortados, poco contraste y edición con el dedo muy difícil.
- Dirección elegida: oscuro pero limpio (fondo casi negro, acentos dorados, letra grande), datos importantes a la vista, sin mostrar el tipo de suelo en la vista principal.
- Interacción: modo Ver / Editar separados, rejilla con imán, botones +/− para tamaños, panel inferior al tocar una estancia (baúl, buffos, quién está dentro) y deshacer/rehacer.
- Pendiente de decidir: qué pueden hacer los jugadores en La Casa.
- Pendiente de revisar: la política RLS que deja a cualquier miembro actualizar `house_rooms`; habría que separar baúl de posición y tamaño.

## Comprobaciones manuales tras un cambio
1. La web abre sin errores en la consola (F12).
2. Entrar con dos usuarios a la vez (máster y jugador).
3. Tirar un dado: le llega al otro usuario.
4. Cambiar vida o maná de una ficha: se actualiza en el otro.
5. Guardar un personaje en combate y recargar: los datos siguen.
6. Abrir La Casa en móvil y en PC.
7. Si se subió la versión: la PWA se actualiza sola.

## Pendiente de completar (rellena tú)
- Cómo se publica la web (¿GitHub Pages u otro?): ...
- Cómo la pruebo en local: ...
- Esquema SQL completo (o enlace): ...
