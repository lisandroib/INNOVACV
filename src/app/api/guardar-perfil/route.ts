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

// Función auxiliar para normalizar y parsear cursos/certificaciones de forma robusta
function parsearCursos(entrada: any): any[] {
  if (!entrada) return [];
  
  if (Array.isArray(entrada)) {
    return entrada.map((item, index) => {
      if (item && typeof item === 'object') {
        return {
          id: item.id || `c_${Date.now()}_${index}`,
          titulo: item.titulo || item.title || 'Curso / Certificación',
          institucion: item.institucion || item.institution || 'No especificada',
          anio: String(item.anio || item.year || '')
        };
      }
      if (typeof item === 'string') {
        return parsearUnicoCurso(item, index);
      }
      return null;
    }).filter(Boolean);
  }
  
  if (typeof entrada === 'string') {
    const trimmed = entrada.trim();
    if (!trimmed) return [];
    
    // Si parece un array JSON stringificado
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        return parsearCursos(parsed);
      } catch (e) {
        // Fallback al parseo como string regular por comas
      }
    }
    
    // Dividir por comas o saltos de línea
    const items = trimmed.split(/,|\n/).map(s => s.trim()).filter(Boolean);
    return items.map((item, index) => parsearUnicoCurso(item, index));
  }
  
  return [];
}

// Auxiliar para extraer título, institución y año de un string que describe un curso
function parsearUnicoCurso(texto: string, index: number): any {
  let titulo = texto;
  let institucion = 'No especificada';
  let anio = '';
  
  // Extraer año de 4 dígitos entre 1980 y 2030
  const anioMatch = texto.match(/\b(19\d\d|20\d\d)\b/);
  if (anioMatch) {
    anio = anioMatch[0];
    titulo = titulo.replace(new RegExp(`\\(?\\b${anio}\\b\\)?`, 'g'), '');
  }
  
  // Buscar separadores comunes como " - ", " en ", " de "
  const separadores = [' - ', ' en ', ' de '];
  for (const sep of separadores) {
    if (titulo.includes(sep)) {
      const parts = titulo.split(sep);
      const posibleTitulo = parts[0].trim();
      const posibleInst = parts.slice(1).join(sep).trim();
      
      if (posibleTitulo && posibleInst) {
        titulo = posibleTitulo;
        institucion = posibleInst;
        break;
      }
    }
  }
  
  // Limpiar caracteres sobrantes (paréntesis vacíos, comas, etc.)
  titulo = titulo.replace(/[(),\-–]/g, ' ').replace(/\s+/g, ' ').trim();
  institucion = institucion.replace(/[(),\-–]/g, ' ').replace(/\s+/g, ' ').trim();
  
  return {
    id: `c_${Date.now()}_${index}`,
    titulo: titulo || 'Curso / Certificación',
    institucion: institucion || 'No especificada',
    anio: anio
  };
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

    // Convertir fechas de experiencia laboral a mayúsculas
    if (documentoPerfil.experiencia_laboral) {
      if (documentoPerfil.experiencia_laboral.trabajo_actual) {
        if (documentoPerfil.experiencia_laboral.trabajo_actual.fecha_inicio) {
          documentoPerfil.experiencia_laboral.trabajo_actual.fecha_inicio = String(documentoPerfil.experiencia_laboral.trabajo_actual.fecha_inicio).toUpperCase();
        }
        if (documentoPerfil.experiencia_laboral.trabajo_actual.fecha_fin) {
          documentoPerfil.experiencia_laboral.trabajo_actual.fecha_fin = String(documentoPerfil.experiencia_laboral.trabajo_actual.fecha_fin).toUpperCase();
        }
      }
      if (Array.isArray(documentoPerfil.experiencia_laboral.historial)) {
        documentoPerfil.experiencia_laboral.historial.forEach((h: any) => {
          if (h.fecha_inicio) h.fecha_inicio = String(h.fecha_inicio).toUpperCase();
          if (h.fecha_fin) h.fecha_fin = String(h.fecha_fin).toUpperCase();
        });
      }
    }

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

    // Procesar cursos si vienen desde Typebot (lista o único curso)
    const cursosInput = data.cursos || (data.educacion && data.educacion.cursos);
    let cursosIniciales = [];
    if (cursosInput) {
      cursosIniciales = parsearCursos(cursosInput);
    }

    const nuevoCursoInput = data.curso || (data.educacion && data.educacion.curso);
    if (nuevoCursoInput && nuevoCursoInput.titulo && nuevoCursoInput.institucion) {
      const tituloValido = nuevoCursoInput.titulo && !nuevoCursoInput.titulo.includes('{{') && nuevoCursoInput.titulo.trim() !== '';
      const instValida = nuevoCursoInput.institucion && !nuevoCursoInput.institucion.includes('{{') && nuevoCursoInput.institucion.trim() !== '';
      if (tituloValido && instValida) {
        cursosIniciales.push({
          id: `c_bot_${Date.now()}`,
          titulo: nuevoCursoInput.titulo.trim(),
          institucion: nuevoCursoInput.institucion.trim(),
          anio: nuevoCursoInput.ano && !nuevoCursoInput.ano.includes('{{') && nuevoCursoInput.ano.trim() !== ''
            ? nuevoCursoInput.ano.trim() 
            : new Date().getFullYear().toString()
        });
      }
    }

    if (cursosIniciales.length > 0) {
      documentoPerfil.cursos = cursosIniciales;
      if (!documentoPerfil.educacion) {
        documentoPerfil.educacion = {};
      }
      documentoPerfil.educacion.cursos = cursosIniciales;
    }

    let result;
    // Si sabemos quién es el usuario, actualizamos su perfil único o lo creamos si no existe (upsert)
    if (finalUserId) {
      // Mezclamos con el perfil existente para no borrar datos anidados como ubicación o teléfono
      const perfilExistente = await db.collection('perfiles').findOne({ usuario_id: new ObjectId(finalUserId) });
      
      // Preservar de forma robusta los datos personales existentes (como ubicación o email)
      if (perfilExistente) {
        // 1. Preservar email_registro si el nuevo viene nulo o vacío
        if (!documentoPerfil.email_registro && perfilExistente.email_registro) {
          documentoPerfil.email_registro = perfilExistente.email_registro;
        }

        // 2. Fusionar datos_personales (especialmente ubicación)
        if (perfilExistente.datos_personales) {
          documentoPerfil.datos_personales = {
            ...perfilExistente.datos_personales,
            ...(documentoPerfil.datos_personales || {})
          };
          
          // Preservar ubicación si la nueva no viene o es vacía
          const nuevaUbicacion = documentoPerfil.datos_personales?.ubicacion;
          const ubicacionVacia = !nuevaUbicacion?.ciudad || 
                                 nuevaUbicacion.ciudad === '{{typebotUserCity}}' || 
                                 nuevaUbicacion.ciudad.trim() === '';
                               
          if (ubicacionVacia) {
            documentoPerfil.datos_personales.ubicacion = perfilExistente.datos_personales.ubicacion;
          }
          
          // Preservar otros campos personales si el webhook no los envió pero ya existían en la DB
          const camposPersonales = ['telefono', 'linkedin', 'nombre_completo', 'fecha_nacimiento'];
          for (const campo of camposPersonales) {
            if (!documentoPerfil.datos_personales[campo] && perfilExistente.datos_personales[campo]) {
              documentoPerfil.datos_personales[campo] = perfilExistente.datos_personales[campo];
            }
          }
        }
      }

      // Preservar y fusionar cursos existentes en el perfil de la DB
      let cursosExistentes = [];
      if (perfilExistente) {
        if (Array.isArray(perfilExistente.cursos)) {
          cursosExistentes = perfilExistente.cursos;
        } else if (perfilExistente.educacion && Array.isArray(perfilExistente.educacion.cursos)) {
          cursosExistentes = perfilExistente.educacion.cursos;
        }
      }

      // Si tenemos cursos en la DB o nos llegan nuevos cursos, los fusionamos
      if (cursosExistentes.length > 0 || (documentoPerfil.cursos && documentoPerfil.cursos.length > 0)) {
        const cursosNuevos = documentoPerfil.cursos || [];
        const cursosFusionados = [...cursosExistentes];

        for (const c of cursosNuevos) {
          const yaExiste = cursosFusionados.some(
            (x: any) => x.titulo?.toLowerCase().trim() === c.titulo?.toLowerCase().trim() &&
                       x.institucion?.toLowerCase().trim() === c.institucion?.toLowerCase().trim()
          );
          if (!yaExiste) {
            cursosFusionados.push(c);
          }
        }

        documentoPerfil.cursos = cursosFusionados;
        if (!documentoPerfil.educacion) {
          documentoPerfil.educacion = {};
        }
        documentoPerfil.educacion.cursos = cursosFusionados;
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
