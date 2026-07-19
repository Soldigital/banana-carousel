import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabaseEnv } from "./env";

const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/generate"];

// Refreshes the Supabase auth session cookie on every request and (best-effort)
// bounces unauthenticated users away from protected routes. Real authorization
// is still enforced server-side in each page/route handler.
export async function updateSession(request: NextRequest) {
  // Before Supabase is configured, do nothing so the site keeps working.
  if (!hasSupabaseEnv()) return NextResponse.next({ request });

  // Resilience: a Supabase auth code that lands on the site root (e.g. when the
  // Site URL fallback is hit) is routed to our callback so sign-in completes.
  const code = request.nextUrl.searchParams.get("code");
  if (code && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    if (!url.searchParams.get("redirect")) {
      url.searchParams.set("redirect", "/dashboard");
    }
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  if (!user && PROTECTED_PREFIXES.some((p) => path.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  return response;
}
