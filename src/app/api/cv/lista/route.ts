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

    const cvs = await db.collection('CV_perfiles')
      .find({ usuario_id: new ObjectId(userId) })
      .project({ _id: 1, nombre_cv: 1, rol_aplicado: 1, template_id: 1, updatedAt: 1, html_content: 1 })
      .sort({ updatedAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, data: cvs }, { status: 200 });
  } catch (error: any) {
    console.error('Error en GET /api/cv/lista:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
