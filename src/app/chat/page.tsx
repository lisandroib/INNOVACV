import React from 'react';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export default async function ChatPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  let userId = '';
  
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret_de_desarrollo_inseguro');
      const { payload } = await jwtVerify(token, secret);
      userId = payload.userId as string;
    } catch (e) {
      console.error('Error verificando token en ChatPage', e);
    }
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
