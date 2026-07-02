import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const appUrl = `${protocol}://${host}`;

  if (!clientId || clientId === 'TU_GOOGLE_CLIENT_ID') {
    return NextResponse.json(
      { error: 'Google Client ID no está configurado en .env.local. Por favor configúralo para iniciar la autenticación.' },
      { status: 400 }
    );
  }

  const redirectUri = `${appUrl}/api/auth/callback/google`;
  const scope = 'openid email profile';

  const googleAuthUrl = 
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scope)}` +
    `&prompt=select_account`;

  return NextResponse.redirect(googleAuthUrl);
}
