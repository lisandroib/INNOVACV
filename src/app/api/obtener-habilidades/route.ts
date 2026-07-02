import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

// Inicializa el SDK con la clave que ya tienen configurada en Vercel/archivo .env
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { rol } = await req.json();

    if (!rol) {
      return NextResponse.json({ error: 'El rol objetivo es requerido' }, { status: 400 });
    }

    // Le pedimos a Gemini que actúe como un scraper y nos dé una estructura JSON estricta
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `Actúa como un experto en reclutamiento IT y mercado laboral. Analiza el puesto de "${rol}". 
      Devuelve una lista con las 6 habilidades blandas y competencias técnicas más buscadas actualmente para este perfil en internet.
      Debes responder ÚNICAMENTE con un array de strings en formato JSON válido, sin textos introductorios, sin saludos y sin bloques de código Markdown (no uses \`\`\`json).
      Ejemplo de formato de respuesta exacta: ["Habilidad 1", "Habilidad 2", "Habilidad 3"]`,
    });

    const textoRespuesta = response.text?.trim() || '[]';
    
    // Parseamos la respuesta para asegurar que viaja como un Array limpio hacia Typebot
    const habilidadesArray = JSON.parse(textoRespuesta);

    return NextResponse.json(habilidadesArray, { status: 200 });

  } catch (error) {
    console.error('Error en Gemini Habilidades:', error);
    // Lista de contingencia por si llega a fallar la conexión o el parseo
    const fallback = ["Trabajo en equipo", "Resolución de problemas", "Comunicación asertiva", "Adaptabilidad"];
    return NextResponse.json(fallback, { status: 200 });
  }
}
