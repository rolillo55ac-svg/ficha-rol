// admin-usuarios: cuentas de jugadores creadas por el admin (tarea 55, B). Solo responde si quien llama
// tiene sesión y is_admin en profiles (comprobado aquí, nunca fiándose del navegador).
// Acciones: estado, crear, password, desactivar, reactivar, cerrar_sesiones. No borra cuentas ni datos.
// SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY ya los da Supabase.
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
// Igual que USUARIO_DOMINIO en js/auth.js: "martu" entra como martu@jugadores.krysalis.invalid
const USUARIO_DOMINIO = "jugadores.krysalis.invalid";
const USUARIO_RE = /^[a-z0-9][a-z0-9._-]{2,29}$/;
const PASS_MIN = 10;
const PASS_MAX = 72;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { error: "Solo POST" });

  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const auth = req.headers.get("Authorization") || "";
  const quien = createClient(url, anonKey, { global: { headers: { Authorization: auth } } });
  const { data: u } = await quien.auth.getUser();
  if (!u || !u.user) return json(401, { error: "Sin sesión" });

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data: perfil } = await admin.from("profiles").select("is_admin").eq("id", u.user.id).maybeSingle();
  if (!perfil || perfil.is_admin !== true) return json(403, { error: "Solo el admin" });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json(400, { error: "JSON no válido" }); }
  const accion = String(body.accion || "");
  const userId = typeof body.user_id === "string" ? body.user_id : "";
  const password = typeof body.password === "string" ? body.password : "";

  // Cierra todas las sesiones de una cuenta sin tocar el esquema auth: se abre una sesión suya con un
  // enlace de un solo uso (no se envía nada) y se cierra con alcance global.
  async function cerrarSesiones(id: string) {
    const { data: cu, error: e1 } = await admin.auth.admin.getUserById(id);
    if (e1 || !cu.user || !cu.user.email) return e1 ? e1.message : "Cuenta sin correo";
    const { data: link, error: e2 } = await admin.auth.admin.generateLink({ type: "magiclink", email: cu.user.email });
    if (e2 || !link.properties) return e2 ? e2.message : "Sin enlace";
    const temp = createClient(url, anonKey, { auth: { persistSession: false } });
    const { data: ses, error: e3 } = await temp.auth.verifyOtp({ token_hash: link.properties.hashed_token, type: "magiclink" });
    if (e3 || !ses.session) return e3 ? e3.message : "Sin sesión";
    const { error: e4 } = await admin.auth.admin.signOut(ses.session.access_token, "global");
    return e4 ? e4.message : "";
  }

  // Registro de accesos (044): lo que hace el admin con las cuentas. Si la tabla aún no existe, no pasa nada.
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim().slice(0, 45) || null;
  const ua = (req.headers.get("user-agent") || "").slice(0, 120) || null;
  async function apuntar(evento: string, id: string, usuario: string) {
    try {
      await admin.from("access_log").insert({ user_id: id, usuario: usuario.slice(0, 80), evento, user_agent: ua, ip });
    } catch { /* sin registro */ }
  }
  async function usuarioDe(id: string) {
    const { data } = await admin.from("profiles").select("display_name, email").eq("id", id).maybeSingle();
    return data ? String(data.display_name || data.email || "") : "";
  }

  function passValida(p: string) {
    return p.length >= PASS_MIN && p.length <= PASS_MAX;
  }

  if (accion === "estado") {
    const estado: Record<string, { desactivada: boolean; ultima_entrada: string | null }> = {};
    for (let page = 1; page <= 10; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) return json(500, { error: error.message });
      data.users.forEach((x) => {
        const ban = (x as { banned_until?: string }).banned_until;
        estado[x.id] = { desactivada: !!ban && new Date(ban).getTime() > Date.now(), ultima_entrada: x.last_sign_in_at || null };
      });
      if (data.users.length < 200) break;
    }
    return json(200, { ok: true, estado });
  }

  if (accion === "crear") {
    const usuario = String(body.usuario || "").trim().toLowerCase();
    if (!USUARIO_RE.test(usuario)) return json(400, { error: "Usuario: de 3 a 30 letras sin tildes, números, punto, guion o guion bajo" });
    if (!passValida(password)) return json(400, { error: "La contraseña necesita al menos " + PASS_MIN + " caracteres" });
    const rol = body.rol === "gm" ? "gm" : "player";
    const { data: nueva, error } = await admin.auth.admin.createUser({
      email: usuario + "@" + USUARIO_DOMINIO, password, email_confirm: true,
      user_metadata: { usuario },
    });
    if (error || !nueva.user) {
      const msg = error && /already|registered|exists/i.test(error.message) ? "Ese usuario ya existe" : (error ? error.message : "No se pudo crear");
      return json(400, { error: msg });
    }
    const id = nueva.user.id;
    // El perfil lo crea el disparador de siempre; aquí solo se le pone nombre y rol
    await admin.from("profiles").update({ display_name: usuario, role: rol }).eq("id", id);
    const fichaId = typeof body.character_id === "string" ? body.character_id : "";
    if (fichaId) {
      const { data: ficha } = await admin.from("characters").select("data").eq("id", fichaId).maybeSingle();
      if (ficha) {
        const datos = { ...(ficha.data || {}), ownerEmail: usuario + "@" + USUARIO_DOMINIO };
        await admin.from("characters").update({ owner_id: id, data: datos }).eq("id", fichaId);
      }
    }
    await apuntar("cuenta_creada", id, usuario);
    return json(200, { ok: true, user_id: id });
  }

  if (!userId) return json(400, { error: "Falta la cuenta" });
  if (userId === u.user.id && accion !== "password") return json(400, { error: "No puedes hacerte eso a ti mismo" });
  // Las cuentas de admin no se tocan desde el panel (ni otro admin)
  if (userId !== u.user.id) {
    const { data: otro } = await admin.from("profiles").select("is_admin").eq("id", userId).maybeSingle();
    if (otro && otro.is_admin === true) return json(403, { error: "Las cuentas de admin no se cambian desde aquí" });
  }

  if (accion === "password") {
    if (!passValida(password)) return json(400, { error: "La contraseña necesita al menos " + PASS_MIN + " caracteres" });
    const { error } = await admin.auth.admin.updateUserById(userId, { password });
    if (error) return json(400, { error: error.message });
    // Con contraseña nueva, fuera de los demás dispositivos (salvo que sea la propia del admin)
    if (userId !== u.user.id) await cerrarSesiones(userId);
    await apuntar("password_cambiada", userId, await usuarioDe(userId));
    return json(200, { ok: true });
  }

  if (accion === "desactivar") {
    // Primero se cierran sus sesiones (con la cuenta ya bloqueada no se puede)
    await cerrarSesiones(userId);
    const { error } = await admin.auth.admin.updateUserById(userId, { ban_duration: "876000h" });
    if (error) return json(400, { error: error.message });
    await apuntar("cuenta_desactivada", userId, await usuarioDe(userId));
    return json(200, { ok: true });
  }

  if (accion === "reactivar") {
    const { error } = await admin.auth.admin.updateUserById(userId, { ban_duration: "none" });
    if (error) return json(400, { error: error.message });
    await apuntar("cuenta_reactivada", userId, await usuarioDe(userId));
    return json(200, { ok: true });
  }

  if (accion === "cerrar_sesiones") {
    const err = await cerrarSesiones(userId);
    if (err) return json(400, { error: err });
    return json(200, { ok: true });
  }

  return json(400, { error: "Acción desconocida" });
});
