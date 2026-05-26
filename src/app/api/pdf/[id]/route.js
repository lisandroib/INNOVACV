import { MongoClient, ObjectId } from 'mongodb';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Private-Network": "true"
};

export async function OPTIONS() {
  return Response.json({}, { headers: corsHeaders });
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id || !ObjectId.isValid(id)) {
      return new Response(JSON.stringify({ error: "ID inválido o no proporcionado" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Conexión a MongoDB
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    const db = client.db('innovacv_db');
    const collection = db.collection('archivos_pdf');

    // Buscamos el archivo por su ID
    const fileDoc = await collection.findOne({ _id: new ObjectId(id) });
    await client.close();

    if (!fileDoc || !fileDoc.data) {
      return new Response(JSON.stringify({ error: "Archivo no encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Recuperamos los bytes del BSON Binary
    const buffer = fileDoc.data.buffer;

    // Retornamos el archivo PDF con su Content-Type correspondiente
    return new Response(buffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": fileDoc.contentType || "application/pdf",
        "Content-Disposition": `inline; filename="${fileDoc.filename || 'documento.pdf'}"`
      }
    });

  } catch (error) {
    console.error("Error al recuperar archivo de MongoDB:", error);
    return new Response(JSON.stringify({ error: "Hubo un problema al recuperar el archivo" }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
