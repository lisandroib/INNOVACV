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

    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

    if (!hasMinLength || !hasUppercase || !hasLowercase || !hasSpecialChar) {
      return NextResponse.json({ 
        error: 'La contraseña debe tener al menos 8 caracteres, incluir al menos una letra mayúscula, una letra minúscula y un carácter especial' 
      }, { status: 400 });
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

    // Intentar obtener la ubicación por IP del cliente
    let location = { ciudad: '', provincia: '' };
    try {
      let ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
      if (ip) {
        ip = ip.split(',')[0].trim();
      }
      
      const isLocal = !ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.');
      const geoUrl = isLocal ? 'https://ipapi.co/json/' : `https://ipapi.co/${ip}/json/`;
      
      const geoRes = await fetch(geoUrl, { signal: AbortSignal.timeout(3000) }).catch(() => null);
      if (geoRes && geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData && geoData.city && geoData.country_name) {
          location = {
            ciudad: geoData.city,
            provincia: geoData.country_name
          };
        }
      }
    } catch (geoErr) {
      console.error('Error al detectar ubicación por IP en registro:', geoErr);
    }

    // Guardar el usuario
    const result = await db.collection('usuarios').insertOne({
      email,
      password: hashedPassword,
      createdAt: new Date()
    });

    // Crear el perfil inicial con la ubicación precargada por IP
    await db.collection('perfiles').insertOne({
      usuario_id: result.insertedId,
      email_registro: email,
      datos_personales: {
        nombre: '',
        email: email,
        telefono: '',
        ubicacion: {
          ciudad: location.ciudad,
          provincia: location.provincia
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
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
