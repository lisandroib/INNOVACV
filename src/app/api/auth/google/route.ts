import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');

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
