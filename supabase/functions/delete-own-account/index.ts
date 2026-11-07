// delete-own-account — en indlogget bruger sletter sin egen konto (App Store 5.1.1(v), Google Play).
// Ejere af en aktiv virksomhed skal først opsige/slette virksomheden, så abonnement og data afsluttes korrekt.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) return json({ ok: false, error: "Du er ikke logget ind." }, 401);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: me } = await admin.auth.getUser(token);
    const user = me?.user;
    if (!user) return json({ ok: false, error: "Du er ikke logget ind." }, 401);

    const { data: owned } = await admin.from("businesses").select("id, deleted_at").eq("owner_id", user.id);
    if ((owned ?? []).some((b: { deleted_at: string | null }) => !b.deleted_at)) {
      return json({ ok: false, error: "Du ejer en virksomhed. Opsig eller slet først virksomheden under Indstillinger › Opsig eller slet virksomheden." });
    }

    // Medarbejderrækker bevares som virksomhedens arbejdshistorik; uden login kan de ikke længere bruges.
    await admin.from("user_roles").delete().eq("user_id", user.id);
    await admin.from("profiles").delete().eq("user_id", user.id);
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) { console.error("deleteUser", error.message); return json({ ok: false, error: "Kontoen kunne ikke slettes lige nu." }, 500); }
    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ ok: false, error: "Kontoen kunne ikke slettes lige nu." }, 500);
  }
});
