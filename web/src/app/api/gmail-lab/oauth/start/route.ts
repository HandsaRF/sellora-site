import { NextRequest, NextResponse } from "next/server";

import {
  buildGoogleOAuthUrl,
  createGmailLabOAuthState,
  GMAIL_LAB_OAUTH_STATE_COOKIE,
  getGmailLabConnectionState,
} from "@/lib/gmail-lab-connection";

export async function GET(request: NextRequest) {
  const connection = await getGmailLabConnectionState();
  const returnUrl = new URL("/gmail-lab", request.nextUrl.origin);

  if (!connection.is_configured) {
    returnUrl.searchParams.set("oauth", "missing-config");
    return NextResponse.redirect(returnUrl);
  }

  const state = createGmailLabOAuthState();
  const response = NextResponse.redirect(buildGoogleOAuthUrl(request.nextUrl.origin, state));

  response.cookies.set(GMAIL_LAB_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    maxAge: 10 * 60,
    path: "/",
  });

  return response;
}
