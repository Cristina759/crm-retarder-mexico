import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { MaintenanceConfig } from "./maintenance-config";

// Rutas que SIEMPRE deben estar disponibles, incluso en mantenimiento
const isPublicFile = createRouteMatcher([
  "/maintenance(.*)",
  "/favicon.ico",
  "/manifest.json",
  "/logo(.*)", // Asumiendo que hay logos
  "/_next/(.*)",
  "/api/public/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // 1. Verificar si el modo mantenimiento está activo
  if (MaintenanceConfig.enabled) {
    // Si no es una ruta pública o el archivo de mantenimiento, redireccionar
    if (!isPublicFile(req)) {
      const url = req.nextUrl.clone();
      url.pathname = "/maintenance";
      return NextResponse.redirect(url);
    }
  }

  // Si no hay mantenimiento, dejar que Clerk maneje la autenticación normal
  // (Aquí podrías agregar protección de rutas si fuera necesario, 
  // pero por ahora solo nos enfocamos en el bloqueo de mantenimiento)
});

export const config = {
  matcher: [
    // Ignorar archivos estáticos y rutas internas de Next.js
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
