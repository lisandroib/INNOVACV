import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb';

// 1. Configurar los encabezados CORS reutilizables
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://typebot.io', // Permite solo a Typebot (más seguro)
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, bypass-tunnel-reminder',
  'Access-Control-Allow-Credentials': 'true', // OBLIGATORIO para leer el auth_token
};

// Función auxiliar para normalizar de forma robusta las habilidades enviadas por Typebot
function normalizarHabilidades(entrada: any): string[] {
  if (!entrada) return [];
  
  if (Array.isArray(entrada)) {
    return entrada.flatMap(item => normalizarHabilidades(item));
  }
  
  if (typeof entrada === 'string') {
    const stringLimpio = entrada.trim();
    if (!stringLimpio) return [];
    
    // Si parece un array serializado en JSON: e.g. ["A", "B"] o ["A"]
    if (stringLimpio.startsWith('[') && stringLimpio.endsWith(']')) {
      try {
        const parsed = JSON.parse(stringLimpio);
        return normalizarHabilidades(parsed);
      } catch (e) {
        // Fallback por si no es JSON válido pero tiene corchetes (ej. [React.js, Node.js])
        const sinCorchetes = stringLimpio.slice(1, -1);
        return sinCorchetes.split(',').map(s => s.replace(/['"]/g, '').trim()).filter(Boolean);
      }
    }
    
    // Si es una cadena normal, la dividimos por comas
    return stringLimpio.split(',').map(s => s.trim()).filter(Boolean);
  }
  
  return [String(entrada).trim()];
}

// 2. Manejar la consulta de seguridad (Preflight) que hace el navegador
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

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

    // 4. Preparar el documento (usar el userId de la cookie, o si falla, el que nos devuelve Typebot)
    const finalUserId = userId || data.usuario_id;
    
    const documentoPerfil = {
      ...data,
      usuario_id: finalUserId ? new ObjectId(finalUserId) : null,
      email_registro: userEmail || data.email, // Por si acaso también recolectas el email en Typebot
      updatedAt: new Date(),
      origen: 'typebot'
    };

    // Procesar y fusionar habilidades si vienen desde Typebot
    if (data.habilidades) {
      // 1. Habilidades Duras (Técnicas)
      const durasSeleccionadasRaw = data.habilidades.duras_seleccionadas;
      const durasSeleccionadas = normalizarHabilidades(durasSeleccionadasRaw)
        .filter((s: string) => s && s !== 'Quiero agregar otras manualmente...');
        
      const durasManualesRaw = data.habilidades.duras_manuales || '';
      const durasManuales = normalizarHabilidades(durasManualesRaw);
      
      const durasList = [...durasSeleccionadas, ...durasManuales];
      const durasFinal = Array.from(new Set(durasList)).join(', ');

      // 2. Habilidades Blandas (Interpersonales)
      const blandasSeleccionadasRaw = data.habilidades.blandas_seleccionadas;
      const blandasSeleccionadas = normalizarHabilidades(blandasSeleccionadasRaw)
        .filter((s: string) => s && s !== 'Quiero agregar otras manualmente...');
        
      const blandasManualesRaw = data.habilidades.blandas_manuales || '';
      const blandasManuales = normalizarHabilidades(blandasManualesRaw);
      
      const blandasList = [...blandasSeleccionadas, ...blandasManuales];
      const blandasFinal = Array.from(new Set(blandasList)).join(', ');

      documentoPerfil.habilidades = {
        duras: durasFinal || data.habilidades.duras || '',
        blandas: blandasFinal || data.habilidades.blandas || '',
        duras_seleccionadas: durasSeleccionadas,
        duras_manuales: Array.isArray(durasManualesRaw) ? durasManualesRaw : String(durasManualesRaw),
        blandas_seleccionadas: blandasSeleccionadas,
        blandas_manuales: Array.isArray(blandasManualesRaw) ? blandasManualesRaw : String(blandasManualesRaw)
      };
    }

    let result;
    // Si sabemos quién es el usuario, actualizamos su perfil único o lo creamos si no existe (upsert)
    if (finalUserId) {
      // Buscar si ya existe un perfil para este usuario
      const perfilExistente = await db.collection('perfiles').findOne({ usuario_id: new ObjectId(finalUserId) });
      
      // Si ya existe ubicación y la nueva no viene o viene vacía o con placeholders de Typebot, la preservamos
      if (perfilExistente && perfilExistente.datos_personales?.ubicacion) {
        const nuevaUbicacion = documentoPerfil.datos_personales?.ubicacion;
        const ciudadVacia = !nuevaUbicacion?.ciudad || 
                             nuevaUbicacion.ciudad === '{{typebotUserCity}}' || 
                             nuevaUbicacion.ciudad === '';
        
        if (ciudadVacia) {
          if (!documentoPerfil.datos_personales) {
            documentoPerfil.datos_personales = {};
          }
          documentoPerfil.datos_personales.ubicacion = perfilExistente.datos_personales.ubicacion;
        }
      }

      result = await db.collection('perfiles').updateOne(
        { usuario_id: new ObjectId(finalUserId) },
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

    return NextResponse.json(
      { success: true, message: 'Perfil guardado exitosamente', result }, 
      { status: 200, headers: corsHeaders }
    );

  } catch (error: any) {
    console.error('Error en /api/guardar-perfil:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al procesar el webhook' }, 
      { status: 500, headers: corsHeaders }
    );
  }
}
