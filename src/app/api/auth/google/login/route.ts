import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const clientId = process.env.GOOGLE_CLIENT_ID || "";
    if (!clientId) {
        return NextResponse.json({ error: "GOOGLE_CLIENT_ID no configurado" }, { status: 500 });
    }

    const origin = new URL(request.url).origin;
    const redirectUri = `${origin}/api/auth/callback/google`;

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        prompt: "select_account",
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    return NextResponse.redirect(authUrl);
}
