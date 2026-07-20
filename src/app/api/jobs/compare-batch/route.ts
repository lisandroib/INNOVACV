import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Configurar el SDK de Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cv_id, jobs } = body;

    if (!cv_id) {
      return NextResponse.json({ error: 'Falta el cv_id' }, { status: 400 });
    }

    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json({ error: 'Falta la lista de empleos a comparar' }, { status: 400 });
    }

    // 1. Obtener el CV de la base de datos
    const client = await clientPromise;
    const db = client.db('innovacv_db');
    const cv = await db.collection('CV_perfiles').findOne({ _id: new ObjectId(cv_id) });

    if (!cv || !cv.html_content) {
      return NextResponse.json({ error: 'CV no encontrado o sin contenido' }, { status: 404 });
    }

    // Limpiar el HTML básico para ahorrar tokens (Gemini igual entiende HTML, pero es mejor limpiar un poco)
    const cvText = cv.html_content
      .replace(/<style[^>]*>.*<\/style>/gm, '') // Remover estilos
      .replace(/<[^>]*>?/gm, ' ') // Remover etiquetas HTML
      .replace(/\s+/g, ' ') // Normalizar espacios
      .trim();

    // 2. Construir el prompt estructurado para los empleos usando IDs cortos
    // Esto evita que Gemini alucine caracteres al copiar los IDs largos en Base64
    const idMap = new Map();
    
    const jobsPrompt = jobs.map((job: any, index: number) => {
      const shortId = `job_${index}`;
      idMap.set(shortId, job.id);
      return `Empleo ${index + 1}:
ID: ${shortId}
Título: ${job.title}
Empresa: ${job.company}
Descripción: ${job.description}
---`;
    }).join('\n\n');



    const prompt = `Actúa como un experto reclutador ATS (Applicant Tracking System).
A continuación te proporciono el texto del Currículum Vitae de un candidato y una lista de ofertas de empleo.
Tu tarea es evaluar la compatibilidad del CV con cada oferta de empleo, calculando un porcentaje de 0 a 100.

CURRÍCULUM DEL CANDIDATO:
"""
${cvText}
"""

OFERTAS DE EMPLEO A EVALUAR:
"""
${jobsPrompt}
"""

INSTRUCCIONES DE SALIDA:
Debes devolver ÚNICAMENTE un array JSON válido con los resultados, sin bloques de código Markdown ni texto adicional. 
El formato exacto debe ser:
[
  { "id": "id_del_empleo", "compatibility": numero_entero_del_0_al_100, "reasoning": "Breve justificación de 1 o 2 oraciones del por qué de esa puntuación" },
  ...
]`;

    // 3. Llamar a Gemini mediante fetch directo (consistente con el resto de la app)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY no configurada");
    }

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.2, // Subimos levemente la temperatura para permitir razonamiento
        responseMimeType: 'application/json'
      }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const fetchResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text();
      console.error('Error de Gemini:', fetchResponse.status, errorText);
      throw new Error(`Gemini API falló: ${fetchResponse.status}`);
    }

    const data = await fetchResponse.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
    if (!responseText) {
      throw new Error("Respuesta vacía de Gemini");
    }

    // 4. Parsear el resultado
    let parsedResults = [];
    try {
      parsedResults = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Error parseando respuesta de Gemini:", responseText);
      // Intentar limpiar bloques markdown si Gemini ignoró la instrucción
      const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResults = JSON.parse(cleanedText);
    }

    // Mapear los IDs cortos de vuelta a los IDs reales
    const finalResults = parsedResults.map((r: any) => {
      const originalId = idMap.get(r.id) || r.id;

      return {
        id: originalId,
        compatibility: r.compatibility,
        reasoning: r.reasoning
      };
    });
    


    return NextResponse.json({ success: true, results: finalResults }, { status: 200 });

  } catch (error: any) {
    console.error('Error en POST /api/jobs/compare-batch:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
