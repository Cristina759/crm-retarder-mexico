'use client';

import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, CheckCircle2, Save, X, RotateCcw, PenTool } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignaturePadProps {
    onSave: (blob: Blob) => void;
    onClear?: () => void;
    isLoading?: boolean;
    defaultValue?: string; // URL of existing signature
}

export function SignaturePad({ onSave, onClear, isLoading, defaultValue }: SignaturePadProps) {
    const sigCanvas = useRef<SignatureCanvas>(null);
    const [isEmpty, setIsEmpty] = useState(true);

    const handleClear = () => {
        sigCanvas.current?.clear();
        setIsEmpty(true);
        if (onClear) onClear();
    };

    const handleSave = async () => {
        if (!sigCanvas.current || sigCanvas.current.isEmpty()) return;

        const dataURL = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
        const response = await fetch(dataURL);
        const blob = await response.blob();
        onSave(blob);
    };

    const handleBegin = () => {
        setIsEmpty(false);
    };

    return (
        <div className="w-full space-y-4">
            <div className="relative group">
                {/* Background Decor */}
                <div className="absolute -inset-1 bg-gradient-to-r from-retarder-red/20 to-retarder-black/5 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>

                <div className="relative bg-white border border-retarder-gray-100 rounded-[2rem] overflow-hidden shadow-xl ring-1 ring-retarder-black/5">
                    {/* Header Label */}
                    <div className="px-6 py-4 border-b border-retarder-gray-50 bg-retarder-gray-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-retarder-red/10 flex items-center justify-center text-retarder-red">
                                <PenTool size={16} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-retarder-gray-500">Área de Firma Digital</span>
                        </div>
                        {defaultValue && (
                            <span className="text-[8px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Ya firmada</span>
                        )}
                    </div>

                    {/* Canvas Area */}
                    <div className="relative h-48 md:h-64 bg-white cursor-crosshair">
                        {!defaultValue ? (
                            <SignatureCanvas
                                ref={sigCanvas}
                                onBegin={handleBegin}
                                penColor="#111827"
                                canvasProps={{
                                    className: 'sigCanvas w-full h-full touch-none',
                                    style: { width: '100%', height: '100%' }
                                }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-emerald-50/30">
                                <img src={defaultValue} alt="Firma existente" className="max-h-[80%] max-w-[80%] object-contain" />
                            </div>
                        )}

                        {/* Placeholder text when empty */}
                        {!defaultValue && isEmpty && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                                <div className="text-center">
                                    <PenTool size={48} className="mx-auto mb-2 text-retarder-gray-400" />
                                    <p className="text-xs font-bold text-retarder-gray-400 uppercase tracking-widest">Firme aquí</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Controls */}
                    {!defaultValue && (
                        <div className="px-6 py-4 bg-retarder-gray-50/80 border-t border-retarder-gray-100 flex items-center justify-between gap-3">
                            <button
                                onClick={handleClear}
                                disabled={isLoading || isEmpty}
                                className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-retarder-gray-400 hover:text-retarder-red hover:bg-retarder-red/5 rounded-xl transition-all disabled:opacity-30"
                            >
                                <RotateCcw size={14} />
                                Limpiar
                            </button>

                            <button
                                onClick={handleSave}
                                disabled={isLoading || isEmpty}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:grayscale disabled:opacity-50",
                                    isEmpty ? "bg-retarder-gray-200 text-retarder-gray-400" : "bg-retarder-black text-white hover:bg-retarder-red shadow-retarder-black/20"
                                )}
                            >
                                {isLoading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <CheckCircle2 size={14} />
                                )}
                                {isLoading ? 'Guardando...' : 'Confirmar Firma'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Instruction Tip */}
            {!defaultValue && (
                <p className="text-[10px] text-center text-retarder-gray-400 font-medium italic">
                    Utilice su dedo o puntero para firmar dentro del recuadro.
                </p>
            )}
        </div>
    );
}
