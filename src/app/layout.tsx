import type { Metadata } from 'next';
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
        </body>
      </html>
    </ClerkProvider>
  );
}
