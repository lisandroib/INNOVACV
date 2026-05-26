import { MongoClient, Binary } from 'mongodb';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Private-Network": "true"
};

export async function OPTIONS() {
  return Response.json({}, { headers: corsHeaders });
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return new Response(JSON.stringify({ error: "No se proporcionó ningún archivo" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Convertimos el archivo a un Buffer de Node.js
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Conexión a MongoDB
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    const db = client.db('innovacv_db');
    const collection = db.collection('archivos_pdf');

    // Guardamos el archivo y metadatos
    const doc = {
      filename: file.name,
      contentType: file.type || 'application/pdf',
      size: file.size,
      data: new Binary(buffer),
      uploadedAt: new Date()
    };

    const result = await collection.insertOne(doc);
    await client.close();

    return new Response(JSON.stringify({
      mensaje: "Archivo PDF subido con éxito",
      id: result.insertedId
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error al subir archivo a MongoDB:", error);
    return new Response(JSON.stringify({ error: "Hubo un problema al subir el archivo" }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
