import { NextRequest, NextResponse } from "next/server";

import {
  exchangeAuthorizationCode,
  GMAIL_LAB_OAUTH_STATE_COOKIE,
} from "@/lib/gmail-lab-connection";

export async function GET(request: NextRequest) {
  const returnUrl = new URL("/gmail-lab", request.nextUrl.origin);
  const state = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");
  const storedState = request.cookies.get(GMAIL_LAB_OAUTH_STATE_COOKIE)?.value;

  if (error) {
    returnUrl.searchParams.set("oauth", error);
    const response = NextResponse.redirect(returnUrl);
    response.cookies.delete(GMAIL_LAB_OAUTH_STATE_COOKIE);
    return response;
  }

  if (!state || !storedState || state !== storedState) {
    returnUrl.searchParams.set("oauth", "state-mismatch");
    const response = NextResponse.redirect(returnUrl);
    response.cookies.delete(GMAIL_LAB_OAUTH_STATE_COOKIE);
    return response;
  }

  if (!code) {
    returnUrl.searchParams.set("oauth", "missing-code");
    const response = NextResponse.redirect(returnUrl);
    response.cookies.delete(GMAIL_LAB_OAUTH_STATE_COOKIE);
    return response;
  }

  try {
    await exchangeAuthorizationCode(request.nextUrl.origin, code);
    returnUrl.searchParams.set("oauth", "connected");
  } catch (error) {
    returnUrl.searchParams.set("oauth", "connect-failed");
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Google OAuth did not finish cleanly.";
    returnUrl.searchParams.set("detail", message);
  }

  const response = NextResponse.redirect(returnUrl);
  response.cookies.delete(GMAIL_LAB_OAUTH_STATE_COOKIE);
  return response;
}
