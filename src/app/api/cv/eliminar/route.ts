import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb';

export async function DELETE(req: Request) {
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

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('innovacv_db');

    const result = await db.collection('CV_perfiles').deleteOne({
      _id: new ObjectId(id),
      usuario_id: new ObjectId(userId)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'CV no encontrado o sin permisos' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Eliminado correctamente' }, { status: 200 });
  } catch (error: any) {
    console.error('Error en DELETE /api/cv/eliminar:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
