import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages, currentSection, resumeContext, targetJob } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Si no hay API Key, respondemos con un mensaje instructivo interactivo amigable
      const fallbackResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: `### ¡Hola! Soy tu asistente de CV. 
              
Para darte recomendaciones reales con Inteligencia Artificial, necesitas configurar tu clave API de Gemini. 
Sigue estos sencillos pasos:

1. Obtén una API Key gratuita en [Google AI Studio](https://aistudio.google.com/).
2. Agrégala a tu archivo \`.env.local\` en la raíz de tu proyecto:
   \`\`\`env
   GEMINI_API_KEY=tu_clave_aqui
   \`\`\`
3. Reinicia tu servidor local (\`npm run dev\`).

*Mientras tanto, veo que estás editando la sección de **${currentSection || 'General'}** para el puesto de **${targetJob || '[Puesto no definido]'}**. ¡Configura tu clave y te ayudaré a mejorarla de inmediato!*`
            }
          }
        ]
      };
      return NextResponse.json(fallbackResponse);
    }

    // Preparar el System Prompt contextualizado
    let systemPrompt = `Eres un redactor profesional de currículums y asesor de carrera de alto nivel. Tu tarea es ayudar al usuario a pulir su currículum.`;
    
    if (targetJob) {
      systemPrompt += `\nEl usuario está apuntando al puesto de: "${targetJob}". Asegúrate de que todas tus recomendaciones estén enfocadas en resaltar las habilidades, logros y palabras clave críticas para este rol.`;
    }

    if (currentSection) {
      systemPrompt += `\nActualmente el usuario tiene su cursor o está editando la sección de: "${currentSection}".`;
    }

    if (resumeContext) {
      systemPrompt += `\n\nAquí tienes el fragmento de texto o el contenido actual de esa sección o currículum para tu contexto:\n"""\n${resumeContext}\n"""\nPor favor, responde de forma concisa y amigable. Si el usuario te pregunta algo genérico o sobre cómo mejorar, enfócate preferentemente en la sección activa ("${currentSection}") y dale sugerencias directas que pueda copiar e insertar.`;
    }

    // Gemini requiere que el historial comience siempre con un mensaje del usuario ('user').
    // Por tanto, descartamos los mensajes del asistente previos al primer mensaje del usuario.
    let chatHistory = [...messages];
    const firstUserIdx = chatHistory.findIndex(m => m.role === 'user');
    if (firstUserIdx > 0) {
      chatHistory = chatHistory.slice(firstUserIdx);
    } else if (firstUserIdx === -1) {
      chatHistory = [{ role: 'user', content: 'Hola' }];
    }

    // Gemini no permite mensajes consecutivos del mismo rol. Los agrupamos si los hay.
    const contents: any[] = [];
    for (const m of chatHistory) {
      const role = m.role === 'assistant' ? 'model' : 'user';
      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts[0].text += '\n' + m.content;
      } else {
        contents.push({
          role,
          parts: [{ text: m.content || '' }]
        });
      }
    }

    const payload = {
      contents,
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        temperature: 0.7,
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
    const assistantText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No pude generar una respuesta.';

    // Adaptamos al formato que espera el frontend (OpenAI-compatible)
    return NextResponse.json({
      choices: [
        {
          message: {
            role: 'assistant',
            content: assistantText
          }
        }
      ]
    });

  } catch (error: any) {
    console.error('Error in API Route:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
