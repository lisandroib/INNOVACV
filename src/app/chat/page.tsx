import React from 'react';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { redirect } from 'next/navigation';

export default async function ChatPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  let userId = '';
  let hasProfile = false;
  
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret_de_desarrollo_inseguro');
      const { payload } = await jwtVerify(token, secret);
      userId = payload.userId as string;

      if (userId) {
        const client = await clientPromise;
        const db = client.db('innovacv_db');
        const profile = await db.collection('perfiles').findOne({ usuario_id: new ObjectId(userId) });
        // Solo redirigir al perfil si ya fue completado a través del chatbot
        if (profile && profile.origen === 'typebot') {
          hasProfile = true;
        }
      }
    } catch (e) {
      console.error('Error verificando token o perfil en ChatPage', e);
    }
  }

  if (hasProfile) {
    redirect('/profile');
  }

  const iframeSrc = `https://typebot.io/my-typebot-mfyjgsb${userId ? `?usuario_id=${userId}` : ''}`;

  return (
    <div style={{ width: "100%", height: "100vh", backgroundColor: "#f8fafc" }}>
      <iframe
        src={iframeSrc}
        style={{ width: "100%", height: "100%", border: "none" }}
        title="Typebot Preview"
      />
    </div>
  );
}
