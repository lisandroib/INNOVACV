import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb';
import { SignJWT } from 'jose';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Por favor, ingresa correo y contraseña' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('innovacv_db');

    // Buscar al usuario
    const user = await db.collection('usuarios').findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // Si el usuario no tiene contraseña, es porque se registró mediante OAuth (Google/Facebook)
    if (!user.password) {
      const providerName = user.provider ? (user.provider.charAt(0).toUpperCase() + user.provider.slice(1)) : 'un proveedor social';
      return NextResponse.json(
        { error: `Esta cuenta está registrada a través de ${providerName}. Por favor, inicia sesión usando el botón correspondiente.` },
        { status: 400 }
      );
    }

    // Verificar la contraseña contra el hash en base de datos
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // Generar Token JWT
    const secretString = process.env.JWT_SECRET || 'secret_de_desarrollo_inseguro';
    const secret = new TextEncoder().encode(secretString);
    
    const token = await new SignJWT({ userId: user._id.toString(), email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d') // Sesión válida por 7 días
      .sign(secret);

    const response = NextResponse.json({ success: true, message: 'Inicio de sesión exitoso' });
    
    // Configurar la Cookie HTTP-Only
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7 // 7 días en segundos
    });

    return response;
  } catch (error: any) {
    console.error('Error en /api/auth/login:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
