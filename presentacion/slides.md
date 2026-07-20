---
theme: default
class: text-center
highlighter: shiki
transition: slide-left
title: InnovaCV - Presentación de Tesis
fonts:
  sans: Poppins
---

<div class="mb-8">
  <SparklesText :sparklesCount="16">
    <div class="logo-title-cover">INNOVA<span class="logo-cv-cover">CV</span></div>
  </SparklesText>
</div>

### Plataforma Inteligente para la Optimización de Currículums y Análisis de Empleabilidad mediante IA Generativa

<div class="mt-8 text-sm opacity-80 space-y-1">
  <p><strong>Autores:</strong> Prado Ruiz Agustina, Ibarra Mena Lisandro</p>
  <p><strong>Tutor:</strong> Ing. Rico, Ernesto</p>
  <p><strong>Institución:</strong> Facultad de Ingeniería, Ingeniería en Informática (2026)</p>
</div>

<!--
"Buenos días al tribunal. Hoy presentamos InnovaCV, una plataforma web que utiliza Inteligencia Artificial Generativa para asistir en la creación de currículums optimizados para sistemas ATS y potenciar la inserción laboral."
-->

---
layout: default
---

# Contexto y Problemática

El acceso al mercado laboral profesional se ve condicionado por barreras tecnológicas invisibles:

<br>
<br>

* 🤖 **Filtros Automatizados (ATS)**: Las empresas utilizan masivamente Sistemas de Seguimiento de Candidatos (ATS) para pre-clasificar y filtrar CVs.
* ❌ **Descarte de Talento**: Candidatos altamente capacitados son descartados simplemente porque sus CVs están mal estructurados o son incompatibles con los algoritmos.
* ✍️ **Bloqueo del Escritor**: Dificultad técnica del candidato para redactar y articular sus logros profesionales e identificar palabras clave críticas.
* 🔄 **Falta de Feedback**: Ausencia de una retroalimentación inmediata sobre la calidad formal y técnica del documento frente a una oferta específica.

<!--
"Fusionamos el problema y el contexto: el talento sobra, pero los sistemas automatizados (ATS) actúan como una barrera técnica. Los candidatos envían documentos genéricos que los algoritmos no pueden leer, y ahí es donde nuestra plataforma interviene para democratizar el proceso de selección."
-->

---
layout: default
---

# Objetivos del Proyecto

### Objetivo General
Desarrollar **InnovaCV**, una plataforma web que integra Inteligencia Artificial Generativa para asistir de manera activa en la creación, optimización y análisis de currículums.

<br>

### Objetivos Específicos
* 🎨 **Interfaz de Usuario**: Diseñar una experiencia intuitiva, fluida y moderna basada en React y Next.js.
* 💬 **Recolección Dinámica**: Integrar un motor conversacional (Typebot) para capturar la experiencia profesional de forma guiada.
* 🧠 **Procesamiento de IA**: Implementar modelos de lenguaje avanzados (Google Gemini) para la optimización semántica y sugerencia de habilidades.
* ✍️ **Edición Colaborativa**: Construir un editor de texto enriquecido con guardado asíncrono y persistencia segura en base de datos.

<!--
"Nuestro meta fue construir una solución integral. No solo un editor visual, sino un ecosistema que capture datos conversacionalmente, los procese semánticamente con IA y los ensamble en un documento técnicamente impecable."
-->

---
layout: center
---

# Solución Propuesta: Flujo General

<br>
<br>
<br>

```mermaid
graph LR
    %% Nodos
    U((Usuario))
    T[Typebot <br> Recolección]
    BD[(MongoDB <br> Persistencia)]
    E[Editor Tiptap <br> Ensamblado]
    G{IA Gemini <br> Copiloto}
    P((PDF Vectorial <br> ATS Friendly))

    %% Relaciones
    U -->|Onboarding Conversacional| T
    T -->|Webhook JSON| BD
    BD -.->|Hidratación de Datos| E
    U -->|Edición Manual| E
    E <-->|Contexto ↔ Sugerencias| G
    E -->|Motor de Impresión| P

    %% Estilos
    style U fill:#eff6ff,stroke:#2563eb,stroke-width:2px
    style T fill:#fef3c7,stroke:#d97706,stroke-width:2px
    style BD fill:#dcfce7,stroke:#16a34a,stroke-width:2px
    style E fill:#f3e8ff,stroke:#9333ea,stroke-width:2px
    style G fill:#fce7f3,stroke:#db2777,stroke-width:2px
    style P fill:#fee2e2,stroke:#dc2626,stroke-width:2px
```

<!--
"La plataforma acompaña al usuario desde el 'bloqueo de la página en blanco'. Primero recolectamos su historia como si fuera una entrevista, luego la IA la optimiza y finalmente nuestro editor ensambla un documento listo para superar los filtros."
-->

---
layout: default
---

# Estado del Arte

Análisis comparativo de soluciones existentes frente al enfoque de InnovaCV:

| Criterio | Canva | Jobscan | Kickresume | InnovaCV |
| :--- | :---: | :---: | :---: | :---: |
| **Calidad de Diseño** | 🟢 Alto | 🔴 Nulo | 🟡 Medio | 🟢 Alto |
| **Compatibilidad ATS** | 🔴 Baja (Rasterizado/Tablas) | 🟢 Alta (Solo Análisis) | 🟡 Media | 🟢 Alta (Texto Vectorial) |
| **Asistencia con IA** | 🟡 Limitada (Texto Simple) | 🔴 No posee | 🟡 Básica | 🟢 Avanzada (Gemini + RAG) |
| **Foco del Sistema** | Estética visual general | Validación de palabras clave | Editor con plantillas básicas | Optimización semántica y ATS |

<!--
"Al analizar el mercado, vimos que herramientas como Canva priorizan la estética pero fallan en la compatibilidad ATS, mientras que los analizadores como Jobscan no asisten en la creación. InnovaCV unifica estética, generación de contenido con IA y excelencia técnica del documento final."
-->

---
layout: two-cols
---

# Arquitectura y Stack Tecnológico

Estructura modular desacoplada para garantizar escalabilidad, velocidad y seguridad:

* **Frontend / Backend**: Next.js 15 (App Router) y React 19.
* **Estilos**: TailwindCSS 4 para una interfaz responsive y ágil.
* **Persistencia**: MongoDB para un modelado flexible de documentos.
* **Seguridad**: Autenticación JWT stateless cifrada con `bcryptjs`.
* **Servicios Externos**: Google Gemini API y Typebot.
::right::

<div class="pl-6">
  <h3 class="font-bold text-lg mb-2 text-gray-800 dark:text-white">Flujo de Datos Seguro</h3>
  
```mermaid
graph TD
  C[Cliente - React 19] <-->|Server Actions / Cifrado| N[Next.js Serverless Proxy]
  N <-->|Conexión Segura| M[(MongoDB Atlas)]
  N <-->|SSL API Keys| G((Gemini API))
  style C fill:#eff6ff,stroke:#6147FF,stroke-width:1px
  style N fill:#f1f3f9,stroke:#4f46e5,stroke-width:2px
```
</div>

<!--
"Adoptamos un patrón Cliente-Servidor desacoplado dentro de Next.js. El servidor de Next.js actúa como un proxy inverso seguro mediante funciones Serverless, lo que nos permite ocultar las API Keys de Gemini y conectarnos asíncronamente con MongoDB sin exponer lógica crítica al cliente."
-->

---
layout: two-cols
---

# Recolección de Datos (Typebot)

El punto de partida del usuario es una conversación fluida en lugar de un formulario rígido:

* **Entrevista Guiada**: El bot realiza preguntas secuenciales de manera interactiva sobre educación, experiencia laboral y metas.
* **Baja Fricción**: Disminuye la tasa de abandono típica en la creación de currículums.
* **Estructuración Semántica**: El diálogo del cliente se serializa dinámicamente.
* **Formato Tipado**: Los datos recogidos se transforman nativamente en un objeto JSON limpio y tipado para su envío seguro al servidor.

::right::

<div class="pl-6 pt-4">
  <h3 class="font-bold text-sm mb-2 text-gray-800 dark:text-white">Estructura JSON Generada</h3>

```json
{
  "datosPersonales": {
    "nombre": "Agustina Prado Ruiz",
    "titulo": "Ingeniera en Informática"
  },
  "experiencia": [
    {
      "empresa": "Tech Solutions",
      "puesto": "Desarrolladora Frontend",
      "periodo": "2024 - Presente"
    }
  ],
  "habilidades": ["React", "Next.js", "TS"]
}
```
</div>

<!--
"Typebot no es solo una interfaz amigable que reduce el abandono; arquitectónicamente actúa como un motor de serialización. A medida que el usuario chatea, los datos se estructuran en formato JSON y se envían limpios y tipados a nuestros endpoints de Next.js para su almacenamiento en MongoDB."
-->

---
layout: default
---

# Inteligencia Artificial (Google Gemini API)

La optimización de currículums depende de un procesamiento semántico avanzado de lenguaje natural:

* **Modelo Seleccionado**: `gemini-2.5-flash` debido a su baja latencia de inferencia y su extensa ventana de contexto (ideal para inyectar perfiles completos).
* **Ingeniería de Prompts**: Se envían las descripciones laborales del candidato junto con reglas estrictas de redacción orientadas a ATS (verbos de acción, impacto cuantificable).
* **Respuestas Estructuradas**: Forzado mediante **JSON Schema** para asegurar que el modelo retorne un objeto tipado predecible, evitando alucinaciones de formato Markdown en las habilidades sugeridas.

```typescript
// Forzado de esquema JSON en la configuración del modelo de Gemini
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Optimiza la experiencia laboral...',
  config: { responseMimeType: 'application/json', responseSchema: schema }
});
```

<!--
"Elegimos Gemini por su gran ventana de contexto, vital para inyectar historiales laborales completos. Además, forzamos a la IA a responder usando JSON Schema estrictos, garantizando que el sistema consuma arreglos de datos predecibles en lugar de texto libre."
-->

---
layout: two-cols
---

# Modelo de Datos NoSQL (MongoDB)

Implementamos una base de datos orientada a documentos para manejar perfiles con estructuras altamente variables:

* **Esquemas Dinámicos**: Permite modelar currículums que tienen diferentes secciones y profundidades académicas o laborales.
* **Colecciones Core**: `usuarios`, `perfiles`, `cv_perfiles` y `ofertas`.
* **Optimización de Renderizado**: Se almacena el estado visual/HTML directamente en `cv_perfiles`.
* **Eficiencia**: Evita procesos costosos de compilación en caliente en el backend, reduciendo la latencia de renderizado.

::right::

<div class="pl-6 pt-4">
  <h3 class="font-bold text-sm mb-2 text-gray-800 dark:text-white">Documento de Persistencia</h3>

```json
{
  "_id": "ObjectId('65d...14')",
  "userId": "ObjectId('65d...02')",
  "cv_data": {
    "nombre_cv": "Versión IT - Backend",
    "htmlContent": "<div class='cv'>...</div>"
  },
  "updatedAt": "2026-07-10T19:46:00Z"
}
```
</div>

<!--
"Implementamos una base de datos orientada a documentos por la variabilidad estructural de los currículums. Una optimización crítica fue evitar compilar PDFs en la nube; en su lugar, guardamos el estado de edición en HTML plano dentro de la colección cv_perfiles, reduciendo drásticamente la latencia y los costos de almacenamiento."
-->

---
layout: default
---

# Seguridad y Autenticación

Protección de datos personales y sensibles mediante arquitectura de seguridad moderna:

<br>
<br>

* 🛡️ **Tokens de Acceso**: Autenticación *stateless* utilizando JSON Web Tokens (JWT) generados y firmados mediante la librería de criptografía nativa `jose`.
* 🍪 **Protección XSS**: Almacenamiento de tokens en cookies del navegador utilizando la bandera `HTTP-Only`, lo que impide que scripts Javascript maliciosos de terceros accedan a las credenciales del usuario.
* 🔐 **Seguridad Adicional**: Cookies con directiva `Secure` (solo HTTPS) y `SameSite: Strict` para mitigar ataques CSRF.
* 🔑 **Cifrado de Credenciales**: Hash y encriptación irreversible de contraseñas de usuarios utilizando la librería `bcryptjs`.

<!--
"Para evitar vulnerabilidades de Cross-Site Scripting (XSS), implementamos una autenticación stateless. Generamos tokens JWT y los inyectamos en cookies con la bandera HTTP-Only, haciendo imposible que scripts maliciosos de terceros accedan a las sesiones desde el navegador."
-->

---
layout: two-cols
---

# Interfaz y Funcionalidades Core

Ecosistema integrado y de alta reactividad para el perfeccionamiento del documento:

* **Editor TipTap**: Editor WYSIWYG enriquecido de alto rendimiento y libre de dependencias pesadas.
* **ChatAssistant**: Barra lateral interactiva que permite chatear directamente con el currículum abierto.
* **Inserción Un-Click**: Las viñetas y descripciones mejoradas generadas por el asistente de IA se inyectan dinámicamente en la selección actual del editor.
* **Selector de Plantillas**: Cambio en caliente de diseños CSS sin alterar el contenido guardado en base de datos.

::right::

<div class="pl-6 pt-6">
  <div class="mockup-card-slides">
    <img src="./demostracion_landing.png" alt="InnovaCV Editor Mockup" />
  </div>
</div>

<!--
"Desarrollamos una interfaz de edición basada en Tiptap. El usuario interactúa con nuestro ChatAssistant; cuando la IA genera una sugerencia de viñeta laboral, el usuario simplemente la selecciona y el sistema inyecta el contenido directamente en el lienzo, eliminando la fricción de copiar y pegar."
-->

---
layout: default
---

# Procesamiento Batch de Compatibilidad Laboral

Análisis masivo y veloz para comparar un perfil contra múltiples ofertas de empleo:

* **API Batch**: Endpoint `/api/jobs/compare-batch` diseñado para enviar el currículum del usuario junto con un bloque de 10 ofertas de trabajo en una sola llamada de API.
* **Mitigación de Latencia**: Reduce drásticamente las llamadas de red y optimiza el consumo de tokens del modelo.
* **Rendimiento UI**: Implementación de carga diferida (lazy loading) en el frontend mediante la API `IntersectionObserver`.
* **Resultados Fluidos**: El cálculo de la puntuación de compatibilidad (%) para cada oferta laboral se procesa y muestra silenciosamente en segundo plano a medida que el usuario hace scroll.

<!--
"Uno de los mayores logros analíticos fue el comparador de empleos. Para evitar saturar la red con peticiones individuales, empaquetamos el CV y 10 ofertas en una sola petición Batch. Usamos la API IntersectionObserver en el frontend para ejecutar estas llamadas silenciosamente en segundo plano mientras el usuario hace scroll, manteniendo la UI fluida."
-->

---
layout: default
---

# Exportación Vectorial (ATS Friendly)

La legibilidad del documento por parte del software de contratación es la prioridad técnica absoluta:

* 📄 **Evitar Canvas y Rasterizado**: Los parsers de ATS no pueden indexar ni leer texto incrustado en imágenes o canvas.
* 🌐 **Impresión Nativa**: Uso de la librería `react-to-print` para interactuar directamente con el motor de impresión CSS nativo del navegador web.
* ✏️ **Vectores de Texto Puro**: Genera archivos PDF compuestos por caracteres vectoriales y enlaces interactivos estructurados.
* 🔍 **Legibilidad del 100%**: Asegura que las palabras clave de los candidatos sean indexadas de manera impecable por los parsers de recursos humanos (ATS).

<!--
"Esta es la culminación técnica del sistema. A diferencia de competidores que transforman el documento en una imagen inerte, nosotros invocamos el motor nativo del navegador. Esto asegura un PDF con vectores de texto puro, garantizando que el documento sea indexable y 100% legible por los parsers de Recursos Humanos."
-->

---
layout: default
---

# Pruebas y Rendimiento

La plataforma se sometió a rigurosas mediciones de tiempo de carga y consumo de red:

<div class="grid grid-cols-3 gap-6 mt-8">
  <div class="benefit-card-slides text-center">
    <div class="text-3xl mb-2">⚡</div>
    <div class="font-bold text-lg mb-1 text-gray-800 dark:text-white">Persistencia CRUD</div>
    <div class="text-xl font-semibold text-indigo-600 mt-2">70 - 180 ms</div>
    <p class="text-sm text-gray-500 mt-2">Latencia de lectura/escritura asíncrona en MongoDB.</p>
  </div>
  <div class="benefit-card-slides text-center">
    <div class="text-3xl mb-2">🧠</div>
    <div class="font-bold text-lg mb-1 text-gray-800 dark:text-white">Generación de IA</div>
    <div class="text-xl font-semibold text-indigo-600 mt-2">1.5 - 3.0 s</div>
    <p class="text-sm text-gray-500 mt-2">Tiempo medio de respuesta estructurada con Gemini.</p>
  </div>
  <div class="benefit-card-slides text-center">
    <div class="text-3xl mb-2">🚀</div>
    <div class="font-bold text-lg mb-1 text-gray-800 dark:text-white">Carga de UI (FCP)</div>
    <div class="text-xl font-semibold text-indigo-600 mt-2">&lt; 0.8 s</div>
    <p class="text-sm text-gray-500 mt-2">Primer despliegue visual de la interfaz gracias a Next.js SSR.</p>
  </div>
</div>

<!--
"Sometimos la plataforma a pruebas de latencia. La segregación de responsabilidades permitió operaciones de lectura/escritura ultra rápidas, por debajo de los 180 milisegundos, ofreciendo una experiencia casi instantánea a nivel de datos y tiempos muy razonables en las inferencias del modelo LLM."
-->

---
layout: default
---

# Viabilidad Económica (OPEX)

El diseño arquitectónico serverless permite costos operativos mínimos y viabilidad comercial inmediata:

| Criterio / Servicio | Proveedor | Tipo de Servicio | Costo Mensual |
| :--- | :--- | :--- | :---: |
| **Infraestructura Web** | Vercel Pro | Hosting de funciones Serverless | $20.00 USD |
| **Persistencia** | MongoDB Atlas | Base de datos Serverless (escalable) | ~$9.00 USD |
| **Consumo de Modelos** | Google Gemini API | Inferencia por token (`gemini-2.5-flash`) | ~$5.00 USD |
| **Recolección** | Typebot | Plataforma de automatización de chat | $39.00 USD |
| **Gasto Operativo Total** | | **Para 1,000 usuarios activos mensuales** | **~$73.00 USD** |

<!--
"El proyecto no solo es técnicamente sólido, sino económicamente viable. Proyectando una etapa de comercialización con un volumen de mil usuarios activos, la arquitectura serverless optimizada requiere un gasto operativo mensual de apenas 73 dólares."
-->

---
layout: default
---

# Conclusiones

* 💡 **Mitigación de Bloqueos**: La recolección de datos guiada por chat reduce exitosamente la barrera psicológica de la página en blanco para redactar el CV.
* ⚙️ **Optimización Semántica**: Se logró integrar inferencia en tiempo real de IA de baja latencia sin perjudicar el rendimiento percibido del sistema.
* 📝 **Salida ATS Friendly**: La renderización por vectores nativa garantiza documentos indexables y legibles al 100% por los sistemas ATS.
* ⚖️ **Sustentabilidad Técnica**: La arquitectura serverless implementada demuestra una viabilidad económica excelente con un OPEX sumamente reducido.

<!--
"Concluimos que la sinergia entre tecnologías web modernas (Next.js) e IA Generativa (Gemini) nivela el campo de juego para los profesionales, transformando la creación de un currículum de una tarea estresante a un proceso estratégico y asistido."
-->

---
layout: center
class: text-center
---

# Trabajo Futuro

¿Qué depara el mañana para **InnovaCV**?

* 🔗 **Integración con LinkedIn**: Autocompletado del perfil en un clic mediante autenticación OAuth nativa.
* 🎤 **Simulador de Entrevistas**: Generación de simulaciones de entrevistas dinámicas basadas en la IA de Gemini con la información ya almacenada del candidato.
* 🌐 **i18n y Adaptación Local**: Traducción y adecuación automática del CV a normas y formatos internacionales.

<div class="pt-8">
  <a href="#1" class="btn-gradient">Volver al Inicio</a>
</div>

<!--
"Para el futuro, vislumbramos expandir la plataforma con extracciones nativas de LinkedIn vía OAuth y aprovechar el contexto ya guardado para generar simulaciones de entrevistas de trabajo en tiempo real. Muchas gracias por su atención."
-->
