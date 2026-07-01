import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { SignJWT } from 'jose';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (error) {
    console.error('Error de Google OAuth:', error);
    return NextResponse.redirect(new URL(`/signin?error=${encodeURIComponent('Error al autenticar con Google')}`, appUrl));
  }

  if (!code) {
    return NextResponse.redirect(new URL(`/signin?error=${encodeURIComponent('Código de autorización faltante')}`, appUrl));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret || clientId === 'TU_GOOGLE_CLIENT_ID') {
    console.error('Credenciales de Google no configuradas');
    return NextResponse.redirect(new URL(`/signin?error=${encodeURIComponent('Google OAuth no está configurado en el servidor')}`, appUrl));
  }

  try {
    const redirectUri = `${appUrl}/api/auth/callback/google`;

    // Intercambiar código por tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenRes.ok) {
      const tokenError = await tokenRes.text();
      console.error('Error al intercambiar token:', tokenError);
      return NextResponse.redirect(new URL(`/signin?error=${encodeURIComponent('Error al obtener tokens de acceso')}`, appUrl));
    }

    const tokens = await tokenRes.json();

    // Obtener información del usuario
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    if (!userRes.ok) {
      console.error('Error al obtener información de usuario desde Google');
      return NextResponse.redirect(new URL(`/signin?error=${encodeURIComponent('Error al obtener perfil de usuario')}`, appUrl));
    }

    const userInfo = await userRes.json();
    const email = userInfo.email;

    if (!email) {
      return NextResponse.redirect(new URL(`/signin?error=${encodeURIComponent('No se pudo obtener el correo de Google')}`, appUrl));
    }

    const client = await clientPromise;
    const db = client.db('innovacv_db');

    // Buscar si ya existe el usuario
    let user = await db.collection('usuarios').findOne({ email });

    if (!user) {
      // Registrar usuario nuevo vía Google
      const insertResult = await db.collection('usuarios').insertOne({
        email,
        provider: 'google',
        createdAt: new Date()
      });

      const userId = insertResult.insertedId;

      // Crear perfil por defecto para el usuario
      await db.collection('perfiles').insertOne({
        usuario_id: userId,
        email_registro: email,
        datos_personales: {
          nombre: userInfo.name || '',
          email: email,
          telefono: '',
          ubicacion: {
            ciudad: '',
            provincia: ''
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      user = { _id: userId, email };
    } else {
      // Si el usuario existe y no tiene el campo "provider", o queremos registrar que usa Google, podemos actualizarlo
      if (!user.provider) {
        await db.collection('usuarios').updateOne(
          { _id: user._id },
          { $set: { provider: 'google' } }
        );
      }
    }

    // Generar Token JWT
    const secretString = process.env.JWT_SECRET || 'secret_de_desarrollo_inseguro';
    const secret = new TextEncoder().encode(secretString);

    const token = await new SignJWT({ userId: user._id.toString(), email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);

    // Redirigir al perfil o chat
    const response = NextResponse.redirect(new URL('/chat', appUrl));

    // Configurar la Cookie HTTP-Only
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7 // 7 días
    });

    return response;
  } catch (error: any) {
    console.error('Error en /api/auth/callback/google:', error);
    return NextResponse.redirect(new URL(`/signin?error=${encodeURIComponent('Error interno del servidor en OAuth')}`, appUrl));
  }
}
