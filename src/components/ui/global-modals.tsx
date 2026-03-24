'use client';

import { useModalStore } from '@/lib/modals';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function GlobalModals() {
    // Only render on client to avoid hydration mismatch
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const { toasts, removeToast, confirmState, closeConfirm, promptState, closePrompt, setPromptValue } = useModalStore();

    if (!mounted) return null;

    return (
        <>
            {/* Toasts Container */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, x: 50, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className={cn(
                                'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg shadow-black/5 pointer-events-auto max-w-sm w-full',
                                toast.type === 'success' && 'bg-emerald-50 text-emerald-800 border-l-4 border-emerald-500',
                                toast.type === 'error' && 'bg-red-50 text-red-800 border-l-4 border-red-500',
                                toast.type === 'info' && 'bg-blue-50 text-blue-800 border-l-4 border-blue-500',
                            )}
                        >
                            <div className="flex-shrink-0">
                                {toast.type === 'success' && <CheckCircle2 size={18} className="text-emerald-500" />}
                                {toast.type === 'error' && <XCircle size={18} className="text-red-500" />}
                                {toast.type === 'info' && <Info size={18} className="text-blue-500" />}
                            </div>
                            <p className="text-sm font-medium flex-1 mr-2">{toast.message}</p>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="p-1 rounded-md hover:bg-black/5 transition-colors -mr-1"
                            >
                                <X size={14} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Confirm Modal */}
            <AnimatePresence>
                {confirmState.isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
                        />
                        <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden"
                            >
                                <div className="p-6">
                                    <h3 className="text-lg font-bold text-retarder-black mb-2">Confirmar Acción</h3>
                                    <p className="text-sm text-retarder-gray-600 leading-relaxed">
                                        {confirmState.message}
                                    </p>
                                </div>
                                <div className="px-6 py-4 bg-retarder-gray-50 flex justify-end gap-3 border-t border-retarder-gray-100">
                                    <button
                                        onClick={() => closeConfirm(false)}
                                        className="px-4 py-2 text-sm font-semibold text-retarder-gray-600 bg-white border border-retarder-gray-200 rounded-lg hover:bg-retarder-gray-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={() => closeConfirm(true)}
                                        className="px-4 py-2 text-sm font-semibold text-white bg-retarder-red rounded-lg hover:bg-retarder-red-700 transition-colors shadow-md shadow-retarder-red/20"
                                    >
                                        Confirmar
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>

            {/* Prompt Modal */}
            <AnimatePresence>
                {promptState.isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
                        />
                        <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden"
                            >
                                <div className="p-6">
                                    <h3 className="text-lg font-bold text-retarder-black mb-2">Ingresar Datos</h3>
                                    <p className="text-sm text-retarder-gray-600 leading-relaxed mb-4">
                                        {promptState.message}
                                    </p>
                                    <input
                                        type="text"
                                        autoFocus
                                        value={promptState.value}
                                        onChange={(e) => setPromptValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') closePrompt(promptState.value);
                                            if (e.key === 'Escape') closePrompt(null);
                                        }}
                                        className="w-full px-3 py-2 border border-retarder-gray-200 rounded-lg outline-none focus:border-retarder-red focus:ring-1 focus:ring-retarder-red text-sm"
                                    />
                                </div>
                                <div className="px-6 py-4 bg-retarder-gray-50 flex justify-end gap-3 border-t border-retarder-gray-100">
                                    <button
                                        onClick={() => closePrompt(null)}
                                        className="px-4 py-2 text-sm font-semibold text-retarder-gray-600 bg-white border border-retarder-gray-200 rounded-lg hover:bg-retarder-gray-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={() => closePrompt(promptState.value)}
                                        className="px-4 py-2 text-sm font-semibold text-white bg-retarder-red rounded-lg hover:bg-retarder-red-700 transition-colors shadow-md shadow-retarder-red/20"
                                    >
                                        Aceptar
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
