'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Search, Edit2, Shield, MoreVertical, Mail, Upload, FileText, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROL_LABELS, Rol } from '@/lib/utils/constants';

const DEMO_USERS = [
    { id: '1', nombre: 'Ing. Juan Carlos', email: 'direccion@retardermexico.com', role: 'admin' as Rol, active: true },
    { id: '2', nombre: 'Cristina Velasco', email: 'ventas@retardermexico.com', role: 'vendedor' as Rol, active: true },
    { id: '3', nombre: 'Nahum Garcia', email: 'nahum@retardermexico.com', role: 'tecnico' as Rol, active: true },
    { id: '4', nombre: 'Carlos Abraham Espinosa', email: 'espinosa@retardermexico.com', role: 'tecnico' as Rol, active: true },
];

export default function UsuariosPage() {
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedDocs, setUploadedDocs] = useState<Record<string, string[]>>({
        '1': ['INE', 'Comprobante de Domicilio'],
        '3': ['Licencia de Conducir', 'Certificado Médico']
    });

    const handleUploadClick = (user: any) => {
        setSelectedUser(user);
    };

    const handleSimulateUpload = () => {
        if (!selectedUser) return;
        setIsUploading(true);
        setTimeout(() => {
            const currentDocs = uploadedDocs[selectedUser.id] || [];
            setUploadedDocs({
                ...uploadedDocs,
                [selectedUser.id]: [...currentDocs, `Documento_Nuevo_${new Date().getTime()}.pdf`]
            });
            setIsUploading(false);
        }, 1500);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-retarder-black">Gestión de Usuarios</h1>
                    <p className="text-sm text-retarder-gray-500">Administra accesos y expedientes de colaboradores</p>
                </div>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-retarder-red text-white rounded-xl text-sm font-semibold hover:bg-retarder-red-700 transition-all shadow-md shadow-retarder-red/20">
                    <UserPlus size={18} /> Invitar Usuario
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-retarder-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-retarder-gray-100 flex items-center justify-between bg-retarder-gray-50/50">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-retarder-gray-200 rounded-lg max-w-sm w-full focus-within:ring-2 focus-within:ring-retarder-red/10 focus-within:border-retarder-red transition-all">
                        <Search size={14} className="text-retarder-gray-400" />
                        <input type="text" placeholder="Buscar por nombre o email..." className="bg-transparent border-none outline-none text-xs w-full" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-retarder-gray-50/50">
                            <tr className="border-b border-retarder-gray-100">
                                <th className="text-left py-4 px-6 text-[10px] font-bold text-retarder-gray-400 uppercase tracking-widest min-w-[250px]">Colaborador</th>
                                <th className="text-left py-4 px-6 text-[10px] font-bold text-retarder-gray-400 uppercase tracking-widest">Rol</th>
                                <th className="text-left py-4 px-6 text-[10px] font-bold text-retarder-gray-400 uppercase tracking-widest hidden md:table-cell">Estado</th>
                                <th className="text-center py-4 px-6 text-[10px] font-bold text-retarder-gray-400 uppercase tracking-widest">Expediente</th>
                                <th className="text-right py-4 px-6 text-[10px] font-bold text-retarder-gray-400 uppercase tracking-widest">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-retarder-gray-50">
                            {DEMO_USERS.map((user, i) => {
                                const userDocs = uploadedDocs[user.id] || [];
                                return (
                                    <motion.tr
                                        key={user.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="hover:bg-retarder-gray-50/50 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-retarder-gray-100 flex items-center justify-center text-retarder-gray-400 shrink-0">
                                                    <Users size={16} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-retarder-black text-xs">{user.nombre}</p>
                                                    <div className="flex items-center gap-1 text-[10px] text-retarder-gray-400 mt-0.5">
                                                        <Mail size={10} />
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-retarder-gray-600">
                                                <Shield size={12} className={user.role === 'admin' ? "text-purple-600" : "text-retarder-red"} />
                                                {ROL_LABELS[user.role]}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 hidden md:table-cell">
                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                Activo
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <button
                                                onClick={() => handleUploadClick(user)}
                                                className={cn(
                                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors",
                                                    userDocs.length > 0
                                                        ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                                        : "bg-white text-retarder-gray-500 border-retarder-gray-200 hover:bg-retarder-gray-50"
                                                )}
                                            >
                                                <FileText size={12} />
                                                {userDocs.length > 0 ? `${userDocs.length} Docs` : 'Sin Docs'}
                                            </button>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleUploadClick(user)}
                                                    className="p-2 text-retarder-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Subir documentos"
                                                >
                                                    <Upload size={14} />
                                                </button>
                                                <button className="p-2 text-retarder-gray-400 hover:text-retarder-black hover:bg-retarder-gray-100 rounded-lg transition-all">
                                                    <Edit2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 bg-retarder-gray-50 border-t border-retarder-gray-100 flex items-center justify-between">
                    <p className="text-[10px] text-retarder-gray-400 font-medium">Mostrando {DEMO_USERS.length} usuarios registrados</p>
                    <div className="p-2 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-2 hidden sm:flex">
                        <Shield size={12} className="text-blue-600" />
                        <p className="text-[10px] text-blue-700 font-semibold">Usa el panel para actualizar documentos de colaboradores.</p>
                    </div>
                </div>
            </div>

            {/* Document Upload Modal */}
            <AnimatePresence>
                {selectedUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedUser(null)}
                            className="absolute inset-0 bg-retarder-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="px-6 py-5 border-b border-retarder-gray-100 bg-retarder-gray-50 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-retarder-black">Expediente de Colaborador</h3>
                                    <p className="text-xs text-retarder-gray-500 font-medium">{selectedUser.nombre}</p>
                                </div>
                                <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-retarder-gray-200 rounded-lg transition-colors">
                                    <X size={18} className="text-retarder-gray-500" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-retarder-gray-400 mb-3">Documentos Subidos</h4>
                                    <div className="space-y-2">
                                        {(uploadedDocs[selectedUser.id] || []).length === 0 ? (
                                            <div className="p-4 text-center border-2 border-dashed border-retarder-gray-200 rounded-xl bg-retarder-gray-50 text-retarder-gray-400 text-xs font-semibold">
                                                No hay documentos almacenados para este colaborador.
                                            </div>
                                        ) : (
                                            (uploadedDocs[selectedUser.id] || []).map((doc, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 border border-retarder-gray-200 rounded-xl bg-white hover:border-blue-300 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                            <FileText size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-retarder-gray-800">{doc}</p>
                                                            <p className="text-[10px] text-retarder-gray-400 uppercase">Documento Seguro</p>
                                                        </div>
                                                    </div>
                                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="border-t border-retarder-gray-100 pt-6">
                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-retarder-gray-400 mb-3">Agregar Documento</h4>
                                    <label className={cn(
                                        "flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                                        isUploading ? "border-blue-300 bg-blue-50 opacity-70" : "border-retarder-gray-300 hover:border-retarder-red hover:bg-retarder-red/5 bg-white"
                                    )}>
                                        <input type="file" className="hidden" disabled={isUploading} onChange={handleSimulateUpload} />
                                        <div className={cn("p-4 rounded-full", isUploading ? "bg-blue-100 text-blue-600 animate-pulse" : "bg-retarder-gray-100 text-retarder-gray-400")}>
                                            <Upload size={24} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-bold text-retarder-gray-800">{isUploading ? 'Subiendo documento...' : 'Haz clic para seleccionar'}</p>
                                            <p className="text-[10px] text-retarder-gray-400 font-medium">Soporta PDF, JPG, PNG (Max. 10MB)</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
