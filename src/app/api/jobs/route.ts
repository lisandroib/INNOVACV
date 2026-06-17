import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CACHE_FILE_PATH = path.join(process.cwd(), '.jobs_cache.json');

// Interface para la estructura del Caché
interface CacheData {
  [key: string]: {
    timestamp: number;
    results: any[];
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const location = searchParams.get('location');

    if (!query) {
      return NextResponse.json({ error: 'Falta el parámetro de búsqueda (q)' }, { status: 400 });
    }

    const pageToken = searchParams.get('pageToken') || '';

    const apiKey = process.env.SERPAPI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Clave de SerpApi no configurada en .env.local (SERPAPI_API_KEY)' },
        { status: 500 }
      );
    }

    // Identificador único para el caché
    const cacheKey = `${query.toLowerCase().trim()}|${(location || '').toLowerCase().trim()}|token=${pageToken || 'first'}`;

    // 1. Leer caché local
    let cacheData: CacheData = {};
    if (fs.existsSync(CACHE_FILE_PATH)) {
      try {
        const fileContent = fs.readFileSync(CACHE_FILE_PATH, 'utf-8');
        cacheData = JSON.parse(fileContent);
      } catch (err) {
        console.error('Error leyendo caché:', err);
      }
    }

    // 2. Comprobar si existe un caché válido (ej. menos de 24 horas)
    const cachedEntry = cacheData[cacheKey];
    if (cachedEntry) {
      const isFresh = (Date.now() - cachedEntry.timestamp) < 24 * 60 * 60 * 1000; // 24 horas
      if (isFresh) {
        console.log(`[Caché HIT] Retornando empleos cacheados para: ${cacheKey}`);
        return NextResponse.json({ 
          jobs: cachedEntry.results, 
          cached: true,
          nextPageToken: cachedEntry.nextPageToken 
        });
      }
    }

    // 3. Llamada a SerpApi
    console.log(`[Caché MISS] Consultando a SerpApi para: ${cacheKey}`);
    const serpApiUrl = new URL('https://serpapi.com/search.json');
    serpApiUrl.searchParams.append('engine', 'google_jobs');
    serpApiUrl.searchParams.append('q', query);
    if (location) {
      serpApiUrl.searchParams.append('location', location);
    }
    
    if (pageToken) {
      serpApiUrl.searchParams.append('next_page_token', pageToken);
    }
    
    serpApiUrl.searchParams.append('hl', 'es'); // Resultados en español si están disponibles
    serpApiUrl.searchParams.append('api_key', apiKey);

    const response = await fetch(serpApiUrl.toString());
    const data = await response.json();

    if (data.error) {
      throw new Error(`Error de SerpApi: ${data.error}`);
    }

    // 4. Formatear resultados
    const rawJobs = data.jobs_results || [];
    const limitedJobs = rawJobs.map((job: any, index: number) => {
      // Generar un ID único simple
      const uniqueId = job.job_id || `api-job-${Date.now()}-${pageToken || 'first'}-${index}`;
      
      // Intentar extraer el salario si existe, si no, texto predeterminado
      let salaryInfo = '$ - No Especificado';
      const highlightSalary = job.job_highlights?.find((h: any) => h.title?.toLowerCase().includes('salary') || h.title?.toLowerCase().includes('pay'));
      if (highlightSalary && highlightSalary.items && highlightSalary.items.length > 0) {
        salaryInfo = highlightSalary.items[0];
      } else if (job.salary) {
         salaryInfo = job.salary;
      }

      // Compatibilidad y colores aleatorios o predefinidos para la presentación
      const emblems = ['#0070F3', '#FF5A5F', '#6147FF', '#7928CA', '#22c55e', '#f59e0b'];
      const randomColor = emblems[index % emblems.length];

      // Enlace de aplicación primario (si existe en apply_options) o enlace genérico
      const applyUrl = (job.apply_options && job.apply_options.length > 0) 
        ? job.apply_options[0].link 
        : (job.share_link || `https://www.google.com/search?q=${encodeURIComponent((job.title || '') + ' ' + (job.company_name || '') + ' jobs')}`);

      return {
        id: uniqueId,
        title: job.title || 'Puesto no especificado',
        company: job.company_name || 'Empresa confidencial',
        emblem: job.company_name ? job.company_name.substring(0, 2).toUpperCase() : 'JB',
        emblemBg: `linear-gradient(135deg, ${randomColor} 0%, ${randomColor}cc 100%)`,
        timePosted: job.detected_extensions?.posted_at || 'Reciente',
        type: job.detected_extensions?.schedule_type || 'Full-time',
        salary: salaryInfo,
        location: job.location || location || 'Ubicación no especificada',
        compatibility: Math.floor(Math.random() * 20) + 75, // Algoritmo ficticio 75% - 95%
        saved: false,
        description: job.description || 'Descripción no provista por la plataforma.',
        applyUrl: applyUrl,
      };
    });

    // 5. Guardar en Caché Local
    const nextPageToken = data.serpapi_pagination?.next_page_token || null;
    
    cacheData[cacheKey] = {
      timestamp: Date.now(),
      results: limitedJobs,
      nextPageToken
    };

    try {
      fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(cacheData, null, 2), 'utf-8');
      console.log(`[Caché GUARDADO] Resultados cacheados para: ${cacheKey}`);
    } catch (err) {
      console.error('Error guardando en caché:', err);
    }

    return NextResponse.json({ jobs: limitedJobs, cached: false, nextPageToken });

  } catch (error: any) {
    console.error('Error in Jobs API Route:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor al buscar empleos.' },
      { status: 500 }
    );
  }
}
