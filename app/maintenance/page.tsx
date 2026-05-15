import React from 'react';
import { Hammer, Clock, ShieldAlert } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-[#0f2d55] flex items-center justify-center p-4 font-sans text-white">
      <div className="max-w-2xl w-full text-center space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-2xl relative">
              <Hammer className="w-16 h-16 text-blue-400 animate-bounce" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            Mantenimiento <span className="text-blue-400 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Programado</span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100/80 font-medium max-w-lg mx-auto leading-relaxed">
            Estamos realizando mejoras en el CRM para brindarte una mejor experiencia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
          <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:border-blue-400/30 transition-all group">
            <Clock className="w-8 h-8 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-lg">Tiempo Estimado</h3>
            <p className="text-sm text-blue-100/60 italic">~ 1 - 2 horas</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:border-blue-400/30 transition-all group">
            <ShieldAlert className="w-8 h-8 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-lg">Acceso Restringido</h3>
            <p className="text-sm text-blue-100/60">Seguridad activa</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:border-blue-400/30 transition-all group">
            <div className="w-8 h-8 flex items-center justify-center mb-3">
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-ping"></div>
            </div>
            <h3 className="font-bold text-lg">Estado</h3>
            <p className="text-sm text-blue-100/60">Actualizando módulos</p>
          </div>
        </div>

        <div className="pt-12">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span>CRM Retarder México v2.0</span>
          </div>
        </div>

        <footer className="pt-8 text-blue-100/40 text-sm">
          &copy; {new Date().getFullYear()} Retarder México. Todos los derechos reservados.
        </footer>
      </div>
    </div>
  );
}
