import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED = [
  "/dashboard", "/build", "/wallet", "/admin", "/os",
  "/spatial", "/tools", "/onboarding",
];
const AUTH_ONLY = ["/auth/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect removed pages
  if (pathname.startsWith("/marketplace")) {
    return NextResponse.redirect(new URL("/explore", request.url));
  }
  if (pathname.startsWith("/partners")) {
    return NextResponse.redirect(new URL("/pricing", request.url));
  }
  if (pathname.startsWith("/os") || pathname.startsWith("/spatial")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const needsAuth  = PROTECTED.some(p => pathname.startsWith(p));
  const isAuthPage = AUTH_ONLY.some(p => pathname.startsWith(p));
  if (!needsAuth && !isAuthPage) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (needsAuth && !session) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
