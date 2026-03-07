import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { esES } from '@clerk/localizations';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'CRM RETARDER MÉXICO — Sistema de Gestión de Servicios',
  description: 'CRM operativo para gestión de servicios técnicos, frenos retarder, refacciones y mantenimiento industrial. Distribuidor Autorizado Pentar Kloft.',
  keywords: 'CRM, retarder, frenos, servicios técnicos, camiones, carga, Pentar Kloft',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CRM Retarder',
  },
};

export const viewport: Viewport = {
  themeColor: '#E63946',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={esES}>
      <html lang="es">
        <body className={`${inter.variable} antialiased`}>
          {children}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').then(
                      function(reg) { console.log('SW setup successful', reg.scope); },
                      function(err) { console.log('SW setup failed', err); }
                    );
                  });
                }
              `
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
