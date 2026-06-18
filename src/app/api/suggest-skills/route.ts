import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rolObjetivo = body.rol_objetivo || body.Rol_Objetivo || body.rolObjetivo || body.role || body.Role || 'Profesional General';

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Fallback amigable con una lista de competencias genéricas si no hay API Key configurada
      console.warn('GEMINI_API_KEY no está configurada. Usando fallback de competencias genéricas.');
      return NextResponse.json({
        skills: [
          'Resolución de problemas',
          'Trabajo en equipo',
          'Comunicación efectiva',
          'Gestión del tiempo',
          'Adaptabilidad al cambio',
          'Pensamiento crítico',
          'Iniciativa y proactividad',
          'Orientación al detalle'
        ],
        fallback: true
      });
    }

    const systemPrompt = `Eres un experto en reclutamiento, selección de talento y redacción de currículums de alto impacto. 
Tu tarea es analizar el puesto de trabajo objetivo provisto por el usuario y recomendar una lista limpia y concisa de habilidades esenciales para incluir en el CV.
Debes sugerir entre 8 y 12 competencias en total, combinando tanto habilidades duras (específicas del puesto/técnicas) como habilidades blandas cruciales.
Asegúrate de que cada habilidad sea corta y directa (máximo 4 palabras por habilidad, ej. "React.js", "Gestión de proyectos", "Trabajo en equipo").`;

    const userPrompt = `Genera la lista de competencias y habilidades clave para el puesto: "${rolObjetivo}".`;

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }]
        }
      ],
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            skills: {
              type: 'ARRAY',
              description: 'Lista de habilidades sugeridas para el CV',
              items: {
                type: 'STRING'
              }
            }
          },
          required: ['skills']
        }
      }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const assistantText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!assistantText) {
      throw new Error('La respuesta de Gemini está vacía');
    }

    const parsedData = JSON.parse(assistantText);

    return NextResponse.json({
      skills: parsedData.skills || []
    });

  } catch (error: any) {
    console.error('Error en /api/suggest-skills:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Error interno del servidor',
        skills: [
          'Resolución de problemas',
          'Trabajo en equipo',
          'Comunicación efectiva',
          'Gestión del tiempo',
          'Adaptabilidad'
        ]
      },
      { status: 500 }
    );
  }
}
