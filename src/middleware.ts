import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  // Rutas que requieren autenticación
  const protectedRoutes = ['/chat', '/jobs', '/editor', '/profile'];
  const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  // Rutas de autenticación
  const authRoutes = ['/signin', '/signup'];
  const isAuthRoute = authRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  // Verificar si intenta acceder a ruta protegida
  if (isProtectedRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }
    
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret_de_desarrollo_inseguro');
      await jwtVerify(token, secret);
    } catch (e) {
      // Token inválido o expirado
      const response = NextResponse.redirect(new URL('/signin', request.url));
      response.cookies.delete('auth_token'); // Limpiar cookie corrupta/expirada
      return response;
    }
  }

  // Si ya está logueado y va a login/registro, redirigir adentro
  if (isAuthRoute && token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret_de_desarrollo_inseguro');
      await jwtVerify(token, secret);
      return NextResponse.redirect(new URL('/profile', request.url));
    } catch (e) {
      // Token inválido, que siga a login
      const response = NextResponse.next();
      response.cookies.delete('auth_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.css).*)',
  ],
};
