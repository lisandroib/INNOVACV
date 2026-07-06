import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb';

export async function POST(req: Request) {
  try {
    const { email, newPassword, action } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Por favor, ingresa tu correo electrónico' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('innovacv_db');

    // 1. Acción: Verificar si el correo existe
    if (action === 'check') {
      const user = await db.collection('usuarios').findOne({ email });
      if (!user) {
        return NextResponse.json({ error: 'El correo electrónico no está registrado' }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'Usuario encontrado' });
    }

    // 2. Acción: Restablecer contraseña
    if (action === 'reset') {
      if (!newPassword) {
        return NextResponse.json({ error: 'Por favor, ingresa la nueva contraseña' }, { status: 400 });
      }

      // Validar fuerza de la nueva contraseña
      const hasMinLength = newPassword.length >= 8;
      const hasUppercase = /[A-Z]/.test(newPassword);
      const hasLowercase = /[a-z]/.test(newPassword);
      const hasSpecialChar = /[^A-Za-z0-9]/.test(newPassword);

      if (!hasMinLength || !hasUppercase || !hasLowercase || !hasSpecialChar) {
        return NextResponse.json({ 
          error: 'La contraseña nueva debe tener al menos 8 caracteres, incluir al menos una letra mayúscula, una letra minúscula y un carácter especial' 
        }, { status: 400 });
      }

      // Buscar si el usuario existe
      const user = await db.collection('usuarios').findOne({ email });
      if (!user) {
        return NextResponse.json({ error: 'El usuario no existe' }, { status: 404 });
      }

      // Encriptar la nueva contraseña (rounds = 10)
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Actualizar la contraseña en la base de datos
      await db.collection('usuarios').updateOne(
        { email },
        { $set: { password: hashedPassword } }
      );

      return NextResponse.json({ success: true, message: 'Contraseña restablecida correctamente' });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error: any) {
    console.error('Error en /api/auth/recover:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
