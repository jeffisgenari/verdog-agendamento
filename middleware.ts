import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Protege /admin: exige sessão do NextAuth com tipo === "ADMIN".
export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token || token.tipo !== "ADMIN") {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
