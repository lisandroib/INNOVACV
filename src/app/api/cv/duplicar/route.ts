import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb';

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
    const id = data.id;

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('innovacv_db');

    const cv = await db.collection('CV_perfiles').findOne({
      _id: new ObjectId(id),
      usuario_id: new ObjectId(userId)
    });

    if (!cv) {
      return NextResponse.json({ error: 'CV no encontrado o sin permisos' }, { status: 404 });
    }

    const baseName = cv.nombre_cv || 'CV';
    // Comprobar cuántas copias existen para nombrarlo adecuadamente
    const regexPattern = `^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\(Copia`;
    const copies = await db.collection('CV_perfiles').countDocuments({
      usuario_id: new ObjectId(userId),
      nombre_cv: { $regex: regexPattern }
    });

    const newName = copies === 0 ? `${baseName} (Copia)` : `${baseName} (Copia ${copies + 1})`;

    const newCV = {
      ...cv,
      _id: undefined, // remove existing ID to create a new one
      nombre_cv: newName,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    delete newCV._id;

    const result = await db.collection('CV_perfiles').insertOne(newCV);

    return NextResponse.json({ success: true, result }, { status: 200 });
  } catch (error: any) {
    console.error('Error en POST /api/cv/duplicar:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
