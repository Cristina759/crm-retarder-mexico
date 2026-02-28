'use client';

import { motion } from 'framer-motion';
import { Building2, MapPin, Phone, Mail, Globe, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useRef } from 'react';

export default function EmpresaConfigPage() {
    const [isSaving, setIsSaving] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 1000);
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerLogoUpload = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-retarder-black">Configuración de Empresa</h1>
                    <p className="text-sm text-retarder-gray-500">Administra la información general de Retarder México</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-retarder-red text-white rounded-xl text-sm font-semibold hover:bg-retarder-red-700 transition-all shadow-md shadow-retarder-red/20 disabled:opacity-50"
                >
                    {isSaving ? 'Guardando...' : <><Save size={18} /> Guardar Cambios</>}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Logo & Identity */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="md:col-span-1 space-y-6"
                >
                    <div className="bg-white rounded-2xl border border-retarder-gray-200 p-6 shadow-sm overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-retarder-red" />
                        <label className="text-[10px] font-bold uppercase tracking-widest text-retarder-gray-400 block mb-4">Logo Corporativo</label>
                        <div className="flex flex-col items-center gap-4">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleLogoChange}
                                accept="image/*"
                                className="hidden"
                            />
                            <div className="w-32 h-32 rounded-2xl bg-retarder-gray-50 border-2 border-dashed border-retarder-gray-200 flex items-center justify-center p-4 overflow-hidden">
                                <img
                                    src={logoPreview || "/logo-retarder.png"}
                                    alt="Logo"
                                    className="max-w-full max-h-full object-contain drop-shadow-sm"
                                />
                            </div>
                            <button
                                onClick={triggerLogoUpload}
                                className="text-xs font-semibold text-retarder-red hover:underline"
                            >
                                Cambiar Logo
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-retarder-gray-200 p-6 shadow-sm">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-retarder-gray-400 block mb-4">Colores de Marca</label>
                        <div className="flex gap-3">
                            <div className="flex-1 space-y-2">
                                <div className="h-10 rounded-lg bg-retarder-red shadow-inner" />
                                <p className="text-[9px] text-center font-mono text-retarder-gray-500">#E21F26</p>
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="h-10 rounded-lg bg-retarder-black shadow-inner" />
                                <p className="text-[9px] text-center font-mono text-retarder-gray-500">#1A1A1A</p>
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="h-10 rounded-lg bg-[#FFB800] shadow-inner" />
                                <p className="text-[9px] text-center font-mono text-retarder-gray-500">#FFB800</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Form Data */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="md:col-span-2 space-y-6"
                >
                    <div className="bg-white rounded-2xl border border-retarder-gray-200 p-6 shadow-sm divide-y divide-retarder-gray-100">
                        <div className="pb-6">
                            <h3 className="text-sm font-bold text-retarder-black mb-4">Información General</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase text-retarder-gray-400 ml-1">Razón Social</label>
                                    <div className="flex items-center gap-2 px-3 py-2.5 bg-retarder-gray-50 border border-retarder-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-retarder-red/10 focus-within:border-retarder-red transition-all">
                                        <Building2 size={16} className="text-retarder-gray-400" />
                                        <input type="text" defaultValue="Retarder México S.A. de C.V." className="bg-transparent border-none outline-none text-sm w-full font-medium" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase text-retarder-gray-400 ml-1">RFC</label>
                                    <div className="flex items-center gap-2 px-3 py-2.5 bg-retarder-gray-50 border border-retarder-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-retarder-red/10 focus-within:border-retarder-red transition-all">
                                        <input type="text" defaultValue="RME123456789" className="bg-transparent border-none outline-none text-sm w-full font-mono font-medium" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="py-6">
                            <h3 className="text-sm font-bold text-retarder-black mb-4">Contacto y Ubicación</h3>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase text-retarder-gray-400 ml-1">Dirección Matriz</label>
                                    <div className="flex items-start gap-2 px-3 py-2.5 bg-retarder-gray-50 border border-retarder-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-retarder-red/10 focus-within:border-retarder-red transition-all">
                                        <MapPin size={16} className="text-retarder-gray-400 mt-0.5" />
                                        <textarea rows={2} defaultValue="Calle Principal 123, Zona Industrial, Ciudad de México, CP 01234" className="bg-transparent border-none outline-none text-sm w-full font-medium resize-none" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase text-retarder-gray-400 ml-1">Teléfono Principal</label>
                                        <div className="flex items-center gap-2 px-3 py-2.5 bg-retarder-gray-50 border border-retarder-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-retarder-red/10 focus-within:border-retarder-red transition-all">
                                            <Phone size={16} className="text-retarder-gray-400" />
                                            <input type="text" defaultValue="55-1234-5678" className="bg-transparent border-none outline-none text-sm w-full font-medium" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase text-retarder-gray-400 ml-1">Email Corporativo</label>
                                        <div className="flex items-center gap-2 px-3 py-2.5 bg-retarder-gray-50 border border-retarder-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-retarder-red/10 focus-within:border-retarder-red transition-all">
                                            <Mail size={16} className="text-retarder-gray-400" />
                                            <input type="email" defaultValue="contacto@retardermexico.com" className="bg-transparent border-none outline-none text-sm w-full font-medium" />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase text-retarder-gray-400 ml-1">Sitio Web</label>
                                    <div className="flex items-center gap-2 px-3 py-2.5 bg-retarder-gray-50 border border-retarder-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-retarder-red/10 focus-within:border-retarder-red transition-all">
                                        <Globe size={16} className="text-retarder-gray-400" />
                                        <input type="text" defaultValue="www.retardermexico.com" className="bg-transparent border-none outline-none text-sm w-full font-medium" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6">
                            <h3 className="text-sm font-bold text-retarder-black mb-4">Configuración de Divisa</h3>
                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
                                <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
                                    <Globe size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-amber-900">Tipo de Cambio Automatizado</p>
                                    <p className="text-xs text-amber-700 mt-1">El sistema utiliza el tipo de cambio oficial del día para las cotizaciones en USD. Puedes ajustar el margen de protección aquí.</p>
                                    <div className="flex items-center gap-4 mt-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-amber-900">Margen:</span>
                                            <input type="number" defaultValue="2.5" className="w-16 px-2 py-1 rounded bg-white border border-amber-200 text-sm font-bold text-amber-900" />
                                            <span className="text-xs font-bold text-amber-900">%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
