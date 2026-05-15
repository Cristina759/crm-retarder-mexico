'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Verificar si ya está instalada
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: any) => {
      // Prevenir que el navegador muestre el prompt automáticamente
      e.preventDefault();
      // Guardar el evento para dispararlo más tarde
      setDeferredPrompt(e);
      setShowButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowButton(false);
      setDeferredPrompt(null);
      console.log('PWA instalada correctamente');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Mostrar el prompt de instalación
    deferredPrompt.prompt();

    // Esperar a la respuesta del usuario
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Usuario eligió: ${outcome}`);

    // Ya no necesitamos el prompt
    setDeferredPrompt(null);
    setShowButton(false);
  };

  if (isInstalled || !showButton) {
    return null;
  }

  return (
    <button
      onClick={handleInstallClick}
      className="flex w-full items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold bg-yellow-400 text-[#0f2d55] hover:bg-yellow-500 transition-all shadow-lg animate-bounce"
    >
      <Download size={16} />
      <span>Instalar App CRM</span>
    </button>
  );
}
