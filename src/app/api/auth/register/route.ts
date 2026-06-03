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

    // Verificar si el correo ya existe
    const existingUser = await db.collection('usuarios').findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'El correo electrónico ya está registrado' }, { status: 400 });
    }

    // Encriptar la contraseña (salting rounds = 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Guardar el usuario
    const result = await db.collection('usuarios').insertOne({
      email,
      password: hashedPassword,
      createdAt: new Date()
    });

    // Generar Token JWT para auto-login
    const secretString = process.env.JWT_SECRET || 'secret_de_desarrollo_inseguro';
    const secret = new TextEncoder().encode(secretString);
    
    const token = await new SignJWT({ userId: result.insertedId.toString(), email })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d') // Sesión válida por 7 días
      .sign(secret);

    const response = NextResponse.json({ success: true, message: 'Cuenta creada y sesión iniciada' }, { status: 201 });

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
    console.error('Error en /api/auth/register:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
