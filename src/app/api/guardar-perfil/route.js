import { MongoClient } from 'mongodb';

// Configuramos los permisos de seguridad (CORS)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Permite que cualquier web le envíe datos
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Private-Network": "true" // Esto soluciona tu error de 'loopback'
};

// 1. El navegador hace una pregunta de seguridad primero (Preflight)
export async function OPTIONS() {
  return Response.json({}, { headers: corsHeaders });
}

// 2. Si la seguridad está bien, recibe los datos reales
export async function POST(request) {
  try {
    const body = await request.json();

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    const db = client.db('innovacv_db');
    const collection = db.collection('perfiles');

    const result = await collection.insertOne(body);
    await client.close();

    // Devolvemos el mensaje de éxito INCLUYENDO los permisos de CORS
    return new Response(JSON.stringify({ 
      mensaje: "¡Perfil guardado con éxito!", 
      id_mongo: result.insertedId 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error al guardar en MongoDB:", error);
    return new Response(JSON.stringify({ error: "Hubo un problema al guardar el perfil" }), { 
      status: 500,
      headers: corsHeaders
    });
  }
}