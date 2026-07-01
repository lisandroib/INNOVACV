import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb';

// GET: Recuperar el último borrador del CV
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

    // Buscar los CVs del usuario, ordenados por fecha de actualización (el más reciente primero)
    const cv = await db.collection('CV_perfiles').findOne(
      { usuario_id: new ObjectId(userId) },
      { sort: { updatedAt: -1 } }
    );

    if (!cv) {
      return NextResponse.json({ message: 'No se encontraron currículums guardados', data: null }, { status: 200 });
    }

    return NextResponse.json({ success: true, data: cv }, { status: 200 });

  } catch (error: any) {
    console.error('Error en GET /api/cv/guardar:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST: Guardar o actualizar un CV
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
    
    if (!data.html_content) {
      return NextResponse.json({ error: 'Falta el contenido del currículum' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('innovacv_db');

    // Aquí podríamos decidir si siempre insertamos uno nuevo o actualizamos si ya tiene un nombre igual.
    // Por simplicidad de la arquitectura actual, y para mantener el estado de edición sincronizado, 
    // actualizamos el CV existente o insertamos si no existe.
    // Podría buscarse por nombre_cv si queremos permitir múltiples CVs.
    
    let query: any = { usuario_id: new ObjectId(userId) };
    if (data.cv_id) {
      query._id = new ObjectId(data.cv_id);
    } else if (data.nombre_cv) {
      query.nombre_cv = data.nombre_cv;
    } else {
       // Si no envían nombre ni id, actualizamos el último editado (fallback de seguridad)
       const lastCV = await db.collection('CV_perfiles').findOne({ usuario_id: new ObjectId(userId) }, { sort: { updatedAt: -1 } });
       if (lastCV) {
         query._id = lastCV._id;
       }
    }

    const updateDoc = {
      $set: {
        usuario_id: new ObjectId(userId),
        nombre_cv: data.nombre_cv || 'CV_SinNombre',
        rol_aplicado: data.rol_aplicado || '',
        html_content: data.html_content,
        template_id: data.template_id || 'harvard',
        updatedAt: new Date()
      },
      $setOnInsert: {
        createdAt: new Date()
      }
    };

    const result = await db.collection('CV_perfiles').updateOne(
      query,
      updateDoc,
      { upsert: true }
    );

    // Devolver el ID (ya sea existente o recién creado) para que el frontend lo rastree
    const savedId = result.upsertedId || query._id;

    return NextResponse.json({ success: true, cv_id: savedId, result }, { status: 200 });

  } catch (error: any) {
    console.error('Error en POST /api/cv/guardar:', error);
    return NextResponse.json({ error: 'Error interno del servidor al guardar el currículum' }, { status: 500 });
  }
}
