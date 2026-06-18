import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    console.log('=== SUGGEST SKILLS API CALL ===');
    console.log('Body recibido:', JSON.stringify(body));
    const rolObjetivo = body.rol_objetivo || body.Rol_Objetivo || body.rolObjetivo || body.role || body.Role || 'Profesional General';
    console.log('Rol objetivo detectado:', rolObjetivo);

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Fallback amigable con listas separadas si no hay API Key configurada
      console.warn('GEMINI_API_KEY no está configurada. Usando fallback de competencias genéricas.');
      const hardSkills = ['Desarrollo Frontend', 'Desarrollo Backend', 'Bases de Datos SQL', 'Control de Versiones Git', 'Desarrollo Web/Móvil', 'APIs RESTful'];
      const softSkills = ['Resolución de problemas', 'Trabajo en equipo', 'Comunicación efectiva', 'Gestión del tiempo', 'Adaptabilidad al cambio'];
      
      const hardSkillsWithManual = [...hardSkills, "Quiero agregar otras manualmente..."];
      const softSkillsWithManual = [...softSkills, "Quiero agregar otras manualmente..."];

      return NextResponse.json({
        skills: [...hardSkills, ...softSkills, "Quiero agregar otras manualmente..."],
        hard_skills: hardSkillsWithManual,
        soft_skills: softSkillsWithManual,
        fallback: true
      });
    }

    const systemPrompt = `Eres un experto en reclutamiento, selección de talento y redacción de currículums de alto impacto. 
Tu tarea es analizar el puesto de trabajo objetivo provisto por el usuario y recomendar habilidades esenciales para incluir en el CV.
Debes sugerir habilidades separadas en dos categorías:
1. "hard_skills": De 6 a 8 habilidades duras o conocimientos técnicos específicos del rol (ej. "React.js", "Bases de Datos SQL", "Figma", "Redacción técnica").
2. "soft_skills": De 4 a 6 habilidades blandas o metacompetencias personales cruciales para el rol (ej. "Trabajo en equipo", "Resolución de problemas", "Comunicación efectiva").
Asegúrate de que cada habilidad sea corta y directa (máximo 4 palabras por habilidad).`;

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
            hard_skills: {
              type: 'ARRAY',
              description: 'Habilidades duras y técnicas del puesto',
              items: {
                type: 'STRING'
              }
            },
            soft_skills: {
              type: 'ARRAY',
              description: 'Habilidades blandas y humanas del puesto',
              items: {
                type: 'STRING'
              }
            }
          },
          required: ['hard_skills', 'soft_skills']
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
    const hardSkills = parsedData.hard_skills || [];
    const softSkills = parsedData.soft_skills || [];

    const hardSkillsWithManual = [...hardSkills, "Quiero agregar otras manualmente..."];
    const softSkillsWithManual = [...softSkills, "Quiero agregar otras manualmente..."];

    console.log('=== HABILIDADES GENERADAS ===');
    console.log('Duras (Hard):', JSON.stringify(hardSkillsWithManual));
    console.log('Blandas (Soft):', JSON.stringify(softSkillsWithManual));

    return NextResponse.json({
      skills: [...hardSkills, ...softSkills, "Quiero agregar otras manualmente..."],
      hard_skills: hardSkillsWithManual,
      soft_skills: softSkillsWithManual
    });

  } catch (error: any) {
    console.error('Error en /api/suggest-skills:', error);
    const hardSkills = ['Desarrollo Frontend', 'Desarrollo Backend', 'Bases de Datos SQL', 'Control de Versiones Git', 'APIs RESTful'];
    const softSkills = ['Resolución de problemas', 'Trabajo en equipo', 'Comunicación efectiva', 'Gestión del tiempo', 'Adaptabilidad'];
    
    const hardSkillsWithManual = [...hardSkills, "Quiero agregar otras manualmente..."];
    const softSkillsWithManual = [...softSkills, "Quiero agregar otras manualmente..."];

    return NextResponse.json(
      { 
        error: error.message || 'Error interno del servidor',
        skills: [...hardSkills, ...softSkills, "Quiero agregar otras manualmente..."],
        hard_skills: hardSkillsWithManual,
        soft_skills: softSkillsWithManual,
        fallback: true
      },
      { status: 200 }
    );
  }
}
