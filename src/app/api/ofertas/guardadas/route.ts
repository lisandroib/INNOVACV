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

    const ofertasGuardadas = await db.collection('ofertas')
      .find({ usuario_id: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();

    // Remove the _id from the db and use job.id as intended by the frontend
    const mappedJobs = ofertasGuardadas.map(oferta => {
      const { _id, usuario_id, createdAt, ...jobData } = oferta;
      return { ...jobData, saved: true };
    });

    return NextResponse.json({ success: true, data: mappedJobs }, { status: 200 });
  } catch (error: any) {
    console.error('Error en GET /api/ofertas/guardadas:', error);
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

    const { job } = await req.json();

    if (!job || !job.id) {
      return NextResponse.json({ error: 'Datos de empleo inválidos' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('innovacv_db');
    const collection = db.collection('ofertas');

    // Check if it already exists
    const existingJob = await collection.findOne({
      id: job.id,
      usuario_id: new ObjectId(userId)
    });

    if (existingJob) {
      // Remove it if it exists (Toggle off)
      await collection.deleteOne({ _id: existingJob._id });
      return NextResponse.json({ success: true, saved: false, message: 'Empleo eliminado de guardados' }, { status: 200 });
    } else {
      // Insert it if it doesn't exist (Toggle on)
      const newJob = {
        ...job,
        titulo: job.title || 'Puesto no especificado',
        empresa: job.company || 'Empresa confidencial',
        habilidades_requeridas: ['No especificadas'],
        estado: 'Activa',
        saved: true,
        usuario_id: new ObjectId(userId),
        createdAt: new Date()
      };
      await collection.insertOne(newJob);
      return NextResponse.json({ success: true, saved: true, message: 'Empleo guardado' }, { status: 200 });
    }

  } catch (error: any) {
    console.error('Error en POST /api/ofertas/guardadas:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
