import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret_de_desarrollo_inseguro');
    let userId = null;
    
    try {
      const { payload } = await jwtVerify(token, secret);
      userId = payload.userId as string;
    } catch (err) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('innovacv_db');

    // Buscar el perfil asociado al usuario
    const perfil = await db.collection('perfiles').findOne({ usuario_id: new ObjectId(userId) });

    if (!perfil) {
      return NextResponse.json({ message: 'No se encontró un perfil para este usuario', data: null }, { status: 200 });
    }

    return NextResponse.json({ success: true, data: perfil }, { status: 200 });

  } catch (error: any) {
    console.error('Error en GET /api/perfil:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret_de_desarrollo_inseguro');
    let userId = null;
    
    try {
      const { payload } = await jwtVerify(token, secret);
      userId = payload.userId as string;
    } catch (err) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const data = await req.json();

    const client = await clientPromise;
    const db = client.db('innovacv_db');

    // Actualizar el perfil del usuario mediante $set para no destruir otros campos
    const result = await db.collection('perfiles').updateOne(
      { usuario_id: new ObjectId(userId) },
      { 
        $set: {
          ...data,
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true, result }, { status: 200 });

  } catch (error: any) {
    console.error('Error en POST /api/perfil:', error);
    return NextResponse.json({ error: 'Error interno del servidor al guardar el perfil' }, { status: 500 });
  }
}

