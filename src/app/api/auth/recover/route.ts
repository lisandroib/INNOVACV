import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, newPassword, code, action } = body;

    if (!email) {
      return NextResponse.json({ error: 'Por favor, ingresa tu correo electrónico' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('innovacv_db');

    // 1. Acción: Verificar si el correo existe y enviar el código por email
    if (action === 'check') {
      const user = await db.collection('usuarios').findOne({ email });
      if (!user) {
        return NextResponse.json({ error: 'El correo electrónico no está registrado' }, { status: 400 });
      }

      // Generar código aleatorio de 6 dígitos
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 15 * 60 * 1000); // Expiración en 15 minutos

      // Guardar el código en la base de datos para ese usuario
      await db.collection('usuarios').updateOne(
        { email },
        { 
          $set: { 
            recoveryCode: generatedCode,
            recoveryCodeExpires: expires
          } 
        }
      );

      // Enviar el correo usando la API de Resend
      const resendApiKey = process.env.RESEND_API_KEY;
      if (!resendApiKey) {
        console.error('RESEND_API_KEY no configurado');
        return NextResponse.json({ error: 'Servicio de correos no configurado en las variables de entorno' }, { status: 500 });
      }

      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`
          },
          body: JSON.stringify({
            from: 'INNOVACV <onboarding@resend.dev>',
            to: [email],
            subject: 'Código de recuperación de contraseña - INNOVACV',
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; color: #1a202c; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                <h2 style="color: #6A36FF; text-align: center; margin-bottom: 20px;">Restablecer Contraseña</h2>
                <p>Hola,</p>
                <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>INNOVACV</strong>.</p>
                <p>Usa el siguiente código de verificación de 6 dígitos para continuar con el proceso:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #6A36FF; background-color: #f7fafc; padding: 10px 30px; border-radius: 8px; border: 1px dashed #6A36FF; display: inline-block;">
                    ${generatedCode}
                  </span>
                </div>
                <p style="color: #718096; font-size: 13px; text-align: center;">Este código es válido por 15 minutos. Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                <p style="font-size: 12px; color: #a0aec0; text-align: center;">INNOVACV &copy; 2026 - Tesis Universitaria</p>
              </div>
            `
          })
        });

        if (!emailResponse.ok) {
          const emailError = await emailResponse.json().catch(() => ({}));
          console.error('Error de API Resend:', emailError);
          throw new Error(emailError.message || 'Error al enviar correo con Resend');
        }

        console.log(`[Resend] Código de recuperación enviado a ${email}`);
      } catch (emailErr: any) {
        console.error('Error enviando correo:', emailErr);
        return NextResponse.json({ error: 'No se pudo enviar el correo de recuperación. Revisa que la clave de Resend esté activa y bien configurada.' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Código de recuperación enviado' });
    }

    // 2. Acción: Verificar el código ingresado por el usuario
    if (action === 'verify') {
      if (!code) {
        return NextResponse.json({ error: 'Por favor, ingresa el código de verificación' }, { status: 400 });
      }

      const user = await db.collection('usuarios').findOne({ email });
      if (!user) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
      }

      // Validar si el código coincide
      if (!user.recoveryCode || user.recoveryCode !== code.trim()) {
        return NextResponse.json({ error: 'El código de verificación no es correcto' }, { status: 400 });
      }

      // Validar si el código ha expirado
      if (new Date() > new Date(user.recoveryCodeExpires)) {
        return NextResponse.json({ error: 'El código de verificación ha expirado' }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: 'Código verificado correctamente' });
    }

    // 3. Acción: Restablecer contraseña
    if (action === 'reset') {
      if (!newPassword) {
        return NextResponse.json({ error: 'Por favor, ingresa la nueva contraseña' }, { status: 400 });
      }
      if (!code) {
        return NextResponse.json({ error: 'Falta el código de verificación' }, { status: 400 });
      }

      const user = await db.collection('usuarios').findOne({ email });
      if (!user) {
        return NextResponse.json({ error: 'El usuario no existe' }, { status: 404 });
      }

      // Validar si el código coincide y no ha expirado
      if (!user.recoveryCode || user.recoveryCode !== code.trim()) {
        return NextResponse.json({ error: 'Código de verificación inválido' }, { status: 400 });
      }
      if (new Date() > new Date(user.recoveryCodeExpires)) {
        return NextResponse.json({ error: 'El código de verificación ha expirado' }, { status: 400 });
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

      // Encriptar la nueva contraseña (rounds = 10)
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Actualizar la contraseña y limpiar el código de recuperación
      await db.collection('usuarios').updateOne(
        { email },
        { 
          $set: { password: hashedPassword },
          $unset: { recoveryCode: "", recoveryCodeExpires: "" }
        }
      );

      return NextResponse.json({ success: true, message: 'Contraseña restablecida correctamente' });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error: any) {
    console.error('Error en /api/auth/recover:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
