// discord-notify: manda a Discord los avisos de la web (reportes y respuestas) sin que el webhook esté en el
// navegador ni en el repositorio. Solo usuarios con sesión; como mucho 5 avisos por minuto por usuario.
// Además, {"alertas_acceso": true} (sin sesión: se llama tras un login fallido) manda los avisos pendientes
// de access_alertas. El texto lo escribe la función, no el navegador, y cada aviso se manda una sola vez.
// Secretos de la función: DISCORD_WEBHOOK_URL (lo pone Chemo). SUPABASE_URL, SUPABASE_ANON_KEY y
// SUPABASE_SERVICE_ROLE_KEY ya los da Supabase.
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const MAX_POR_MINUTO = 5;
const MAX_BYTES = 8000;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { error: "Solo POST" });

  const webhook = Deno.env.get("DISCORD_WEBHOOK_URL");
  if (!webhook) return json(503, { error: "Falta el secreto DISCORD_WEBHOOK_URL" });

  const url = Deno.env.get("SUPABASE_URL")!;
  const raw = await req.text();
  if (raw.length > MAX_BYTES) return json(413, { error: "Aviso demasiado largo" });
  let body: { payload?: Record<string, unknown>; alertas_acceso?: boolean };
  try { body = JSON.parse(raw); } catch { return json(400, { error: "JSON no válido" }); }

  if (body && body.alertas_acceso === true) {
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: pend } = await admin.from("access_alertas").select("id, tipo, usuario, veces")
      .is("enviado_at", null).order("at").limit(10);
    if (!pend || !pend.length) return json(200, { ok: true, enviados: 0 });
    // Se marcan antes de mandar: si dos llamadas llegan a la vez, solo una se queda cada aviso
    const { data: mios } = await admin.from("access_alertas").update({ enviado_at: new Date().toISOString() })
      .in("id", pend.map((a) => a.id)).is("enviado_at", null).select("id, tipo, usuario, veces");
    if (!mios || !mios.length) return json(200, { ok: true, enviados: 0 });
    const lineas = mios.map((a) => {
      // Solo letras, números y . _ + - (sin saltos de línea, enlaces ni formato)
      const u = String(a.usuario).replace(/@/g, "(at)").replace(/[^a-z0-9()._+-]/gi, "").slice(0, 80);
      return a.tipo === "fallos_seguidos"
        ? "• **" + u + "**: " + a.veces + " contraseñas mal seguidas en 10 minutos"
        : "• Alguien intentó entrar con un usuario que no existe: **" + u + "**";
    });
    const r = await fetch(webhook, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "🔐 **Intentos de entrada raros**\n" + lineas.join("\n") +
        "\nMíralo en Ajustes › Admin › Actividad.", allowed_mentions: { parse: [] } }) });
    if (!r.ok) {
      // Si Discord falla, se quedan pendientes para la próxima vez
      await admin.from("access_alertas").update({ enviado_at: null }).in("id", mios.map((a) => a.id));
      return json(502, { error: "Discord respondió " + r.status });
    }
    return json(200, { ok: true, enviados: mios.length });
  }

  // Quién llama: se comprueba la sesión en el servidor
  const auth = req.headers.get("Authorization") || "";
  const usuario = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: u } = await usuario.auth.getUser();
  if (!u || !u.user) return json(401, { error: "Sin sesión" });

  const p = body && body.payload;
  if (!p || typeof p !== "object" || (!p.content && !Array.isArray(p.embeds))) return json(400, { error: "Aviso vacío" });

  // Límite por minuto, guardado en la base (solo la función lo lee y escribe)
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const hace1min = new Date(Date.now() - 60_000).toISOString();
  const { count } = await admin.from("discord_envios").select("*", { count: "exact", head: true })
    .eq("user_id", u.user.id).gte("at", hace1min);
  if ((count || 0) >= MAX_POR_MINUTO) return json(429, { error: "Demasiados avisos seguidos: espera un minuto" });
  await admin.from("discord_envios").insert({ user_id: u.user.id });

  // Nadie puede mencionar a @everyone ni a roles desde la web
  const envio = { ...p, allowed_mentions: { parse: [] } };
  const r = await fetch(webhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(envio) });
  if (!r.ok) return json(502, { error: "Discord respondió " + r.status });
  return json(200, { ok: true });
});
