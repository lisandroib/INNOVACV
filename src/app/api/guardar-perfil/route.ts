import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb';

export async function POST(req: Request) {
  try {
    // 1. Obtener los datos enviados por Typebot
    const data = await req.json();

    // 2. Verificar la autenticación del usuario a través de la Cookie JWT
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    let userId = null;
    let userEmail = null;

    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret_de_desarrollo_inseguro');
        const { payload } = await jwtVerify(token, secret);
        userId = payload.userId as string;
        userEmail = payload.email as string;
      } catch (err) {
        console.error('Token inválido o expirado en el webhook de guardar-perfil', err);
      }
    }

    // 3. Conectar a MongoDB
    const client = await clientPromise;
    const db = client.db('innovacv_db');

    // 4. Preparar el documento
    const documentoPerfil = {
      ...data,
      usuario_id: userId ? new ObjectId(userId) : null,
      email_registro: userEmail,
      updatedAt: new Date(),
      origen: 'typebot'
    };

    let result;
    // Si sabemos quién es el usuario, actualizamos su perfil único o lo creamos si no existe (upsert)
    if (userId) {
      result = await db.collection('perfiles').updateOne(
        { usuario_id: new ObjectId(userId) },
        { 
          $set: documentoPerfil,
          $setOnInsert: { createdAt: new Date() } 
        },
        { upsert: true }
      );
    } else {
      // Si por alguna razón el webhook no tiene sesión, lo guardamos como un perfil huérfano (para no perder datos)
      documentoPerfil.createdAt = new Date();
      result = await db.collection('perfiles').insertOne(documentoPerfil);
    }

    return NextResponse.json({ success: true, message: 'Perfil guardado exitosamente', result }, { status: 200 });

  } catch (error: any) {
    console.error('Error en /api/guardar-perfil:', error);
    return NextResponse.json({ error: 'Error interno del servidor al procesar el webhook' }, { status: 500 });
  }
}
