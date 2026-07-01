import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.FACEBOOK_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!clientId || clientId === 'TU_FACEBOOK_CLIENT_ID') {
    return NextResponse.json(
      { error: 'Facebook Client ID no está configurado en .env.local. Por favor configúralo para iniciar la autenticación.' },
      { status: 400 }
    );
  }

  const redirectUri = `${appUrl}/api/auth/callback/facebook`;
  const scope = 'email,public_profile';

  const facebookAuthUrl = 
    `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scope)}`;

  return NextResponse.redirect(facebookAuthUrl);
}
