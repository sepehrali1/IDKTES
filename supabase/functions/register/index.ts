import { createClient } from "npm:@supabase/supabase-js@2";
import postgres from "npm:postgres@3.4.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;
const encoder = new TextEncoder();

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Request body must be valid JSON" }, 400);
  }

  const input = (typeof payload === "object" && payload !== null ? payload : {}) as Record<string, unknown>;
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const username = typeof input.username === "string" ? input.username.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";

  const fields: Record<string, string> = {};
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    fields.email = "Enter a valid email address.";
  }
  if (!USERNAME_PATTERN.test(username)) {
    fields.username = "Username must be 3-20 characters: letters, numbers, or underscores.";
  }
  if (password.length < 8) {
    fields.password = "Password must be at least 8 characters.";
  } else if (encoder.encode(password).length > 72) {
    fields.password = "Password must be at most 72 bytes.";
  }
  if (Object.keys(fields).length > 0) {
    return json({ error: "Please correct the highlighted fields.", fields }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const dbUrl = Deno.env.get("SUPABASE_DB_URL");
  if (!supabaseUrl || !serviceRoleKey || !dbUrl) {
    console.error("Missing Supabase environment configuration");
    return json({ error: "Account creation is temporarily unavailable." }, 500);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const sql = postgres(dbUrl, { max: 1, prepare: false });

  try {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError || !created?.user) {
      if (createError?.code === "email_exists") {
        return json({ error: "An account with this email already exists.", fields: { email: "This email is already registered." } }, 409);
      }
      console.error("Auth account creation failed", createError?.code);
      return json({ error: "Could not create account. Please try again." }, 500);
    }

    const userId = created.user.id;

    let outcome: "owner" | "member" | "taken" | "error";
    try {
      outcome = await sql.begin(async (tx) => {
        await tx`SELECT pg_advisory_xact_lock(hashtext('register_profile'))`;

        const usernameRows = await tx`SELECT 1 FROM public.profiles WHERE username = ${username}`;
        if (usernameRows.length > 0) return "taken" as const;

        const ownerRows = await tx`SELECT 1 FROM public.profiles WHERE role = 'owner' LIMIT 1`;
        const role = ownerRows.length === 0 ? ("owner" as const) : ("member" as const);

        await tx`INSERT INTO public.profiles (id, username, role) VALUES (${userId}, ${username}, ${role})`;
        return role;
      });
    } catch (err) {
      console.error("Profile creation failed", err);
      outcome = "error";
    }

    if (outcome === "owner" || outcome === "member") {
      return json({ user: { id: userId, email, username, role: outcome } }, 201);
    }

    const { error: cleanupError } = await admin.auth.admin.deleteUser(userId);
    if (cleanupError) {
      console.error("Could not remove auth account after failed registration", userId, cleanupError.code);
    }

    if (outcome === "taken") {
      return json({ error: "That username is already taken.", fields: { username: "This username is already taken." } }, 409);
    }
    return json({ error: "Could not create account. Please try again." }, 500);
  } catch (err) {
    console.error("Registration failed", err);
    return json({ error: "Could not create account. Please try again." }, 500);
  } finally {
    await sql.end();
  }
});
