'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Search, Edit2, Shield, Mail, Upload, FileText, CheckCircle2, X, Eye, Download, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROL_LABELS, Rol } from '@/lib/utils/constants';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

const STORAGE_BUCKET = 'documentos';

const DEMO_USERS = [
    { id: '1', nombre: 'Ing. Juan Carlos (Admin)', email: 'direccion@retardermexico.com', role: 'admin' as Rol, active: true },
    { id: '2', nombre: 'Cristina Velasco (Admin)', email: 'ventas@retardermexico.com', role: 'admin' as Rol, active: true },
    { id: '3', nombre: 'Nahum Garcia (Técnico)', email: 'nahum@retardermexico.com', role: 'tecnico' as Rol, active: true },
    { id: '4', nombre: 'Carlos Abraham Espinosa (Técnico)', email: 'espinosa@retardermexico.com', role: 'tecnico' as Rol, active: true },
];

interface StoredDoc {
    name: string;
    fullPath: string;
    createdAt: string;
    size: number;
}

const LS_USERS_KEY = 'crmCustomUsers';

function loadCustomUsers(): typeof DEMO_USERS {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(LS_USERS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function saveCustomUsers(users: typeof DEMO_USERS) {
    try { localStorage.setItem(LS_USERS_KEY, JSON.stringify(users)); } catch { /* ignore */ }
}

export default function UsuariosPage() {
    const [customUsers, setCustomUsers] = useState<typeof DEMO_USERS>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [userDocs, setUserDocs] = useState<StoredDoc[]>([]);
    const [isLoadingDocs, setIsLoadingDocs] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [deletingDoc, setDeletingDoc] = useState<string | null>(null);
    const [confirmDeleteDoc, setConfirmDeleteDoc] = useState<string | null>(null);
    const [docCounts, setDocCounts] = useState<Record<string, number>>({});

    // Add user form state
    const [showAddForm, setShowAddForm] = useState(false);
    const [formNombre, setFormNombre] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formRole, setFormRole] = useState<Rol>('tecnico');

    // Load custom users from localStorage on mount
    useEffect(() => {
        setCustomUsers(loadCustomUsers());
    }, []);

    // All users = demo + custom
    const allUsers = [...DEMO_USERS, ...customUsers];

    // Add new user
    const handleAddUser = () => {
        if (!formNombre.trim() || !formEmail.trim()) return;

        const newUser = {
            id: `custom-${Date.now()}`,
            nombre: formNombre.trim(),
            email: formEmail.trim().toLowerCase(),
            role: formRole,
            active: true,
        };

        const updated = [...customUsers, newUser];
        setCustomUsers(updated);
        saveCustomUsers(updated);

        // Reset form
        setFormNombre('');
        setFormEmail('');
        setFormRole('tecnico');
        setShowAddForm(false);
    };

    // Delete custom user
    const handleDeleteUser = (userId: string) => {
        if (!userId.startsWith('custom-')) return; // Can't delete demo users
        if (!confirm('¿Estás seguro de eliminar este colaborador?')) return;
        const updated = customUsers.filter(u => u.id !== userId);
        setCustomUsers(updated);
        saveCustomUsers(updated);
    };

    // Fetch doc counts for all users on mount
    const fetchAllDocCounts = useCallback(async () => {
        const counts: Record<string, number> = {};
        for (const user of allUsers) {
            try {
                const { data, error } = await supabase.storage
                    .from(STORAGE_BUCKET)
                    .list(`expedientes/${user.id}`, { limit: 100 });
                if (!error && data) {
                    // Filter out .emptyFolderPlaceholder
                    counts[user.id] = data.filter(f => f.name !== '.emptyFolderPlaceholder').length;
                } else {
                    counts[user.id] = 0;
                }
            } catch {
                counts[user.id] = 0;
            }
        }
        setDocCounts(counts);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allUsers.length]);

    useEffect(() => {
        fetchAllDocCounts();
    }, [fetchAllDocCounts]);

    // Fetch docs for selected user
    const fetchUserDocs = useCallback(async (userId: string) => {
        setIsLoadingDocs(true);
        setUploadError(null);
        try {
            const { data, error } = await supabase.storage
                .from(STORAGE_BUCKET)
                .list(`expedientes/${userId}`, {
                    limit: 100,
                    sortBy: { column: 'created_at', order: 'desc' },
                });

            if (error) throw error;

            const docs: StoredDoc[] = (data || [])
                .filter(f => f.name !== '.emptyFolderPlaceholder')
                .map(f => ({
                    name: f.name,
                    fullPath: `expedientes/${userId}/${f.name}`,
                    createdAt: f.created_at || '',
                    size: f.metadata?.size || 0,
                }));

            setUserDocs(docs);
        } catch (err: any) {
            console.error('Error listing docs:', err);
            setUserDocs([]);
            // Don't show error if bucket just doesn't have the folder yet
        } finally {
            setIsLoadingDocs(false);
        }
    }, []);

    // When selecting a user, fetch their docs
    const handleUploadClick = (user: any) => {
        setSelectedUser(user);
        setUploadError(null);
        fetchUserDocs(user.id);
    };

    // Upload file to Supabase Storage
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedUser || !e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            setUploadError('El archivo es demasiado grande. Máximo 10MB.');
            return;
        }

        // Validate file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            setUploadError('Tipo de archivo no soportado. Solo PDF, JPG, PNG.');
            return;
        }

        setIsUploading(true);
        setUploadError(null);

        try {
            // Sanitize filename: replace spaces and special chars
            const timestamp = Date.now();
            const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
            const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
            const safeName = `${baseName}_${timestamp}.${ext}`;
            const filePath = `expedientes/${selectedUser.id}/${safeName}`;

            const { error } = await supabase.storage
                .from(STORAGE_BUCKET)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (error) throw error;

            // Refresh the docs list
            await fetchUserDocs(selectedUser.id);
            // Update counts
            setDocCounts(prev => ({
                ...prev,
                [selectedUser.id]: (prev[selectedUser.id] || 0) + 1,
            }));
        } catch (err: any) {
            console.error('Error uploading file:', err);
            setUploadError(err.message || 'Error al subir el archivo.');
        } finally {
            setIsUploading(false);
            // Reset file input
            e.target.value = '';
        }
    };

    // Get public URL for viewing
    const getDocUrl = (fullPath: string): string => {
        const { data } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(fullPath);
        return data.publicUrl;
    };

    // Download file
    const handleDownload = async (doc: StoredDoc) => {
        try {
            const { data, error } = await supabase.storage
                .from(STORAGE_BUCKET)
                .download(doc.fullPath);

            if (error) throw error;
            if (!data) return;

            // Create download link
            const url = URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = doc.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err: any) {
            console.error('Error downloading file:', err);
            setUploadError(`Error al descargar: ${err.message}`);
        }
    };

    // View file in new tab
    const handleView = (doc: StoredDoc) => {
        const url = getDocUrl(doc.fullPath);
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    // Delete file — two-step: first click sets confirmation, second executes
    const confirmTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleDeleteStep1 = (doc: StoredDoc) => {
        // Clear any existing timeout
        if (confirmTimeoutRef.current) {
            clearTimeout(confirmTimeoutRef.current);
            confirmTimeoutRef.current = null;
        }
        setConfirmDeleteDoc(doc.name);
        // Auto-cancel after 4 seconds
        confirmTimeoutRef.current = setTimeout(() => {
            setConfirmDeleteDoc(prev => prev === doc.name ? null : prev);
            confirmTimeoutRef.current = null;
        }, 4000);
    };

    const handleDeleteConfirm = async (doc: StoredDoc) => {
        // Clear timeout
        if (confirmTimeoutRef.current) {
            clearTimeout(confirmTimeoutRef.current);
            confirmTimeoutRef.current = null;
        }
        setConfirmDeleteDoc(null);
        setDeletingDoc(doc.name);
        setUploadError(null);
        console.log('[DELETE] Deleting file via API:', doc.fullPath);
        try {
            // Use server API route with admin privileges to bypass RLS
            const response = await fetch('/api/storage/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath: doc.fullPath }),
            });

            const result = await response.json();
            console.log('[DELETE] API response:', result);

            if (!response.ok) {
                throw new Error(result.error || 'Error al eliminar el archivo');
            }

            // Optimistically remove from local state immediately
            setUserDocs(prev => prev.filter(d => d.name !== doc.name));

            // Update count
            if (selectedUser) {
                setDocCounts(prev => ({
                    ...prev,
                    [selectedUser.id]: Math.max(0, (prev[selectedUser.id] || 0) - 1),
                }));

                // Re-fetch to confirm deletion persisted
                setTimeout(() => {
                    if (selectedUser) fetchUserDocs(selectedUser.id);
                }, 800);
            }
        } catch (err: any) {
            console.error('[DELETE] Error:', err);
            setUploadError(`Error al eliminar: ${err.message}`);
            if (selectedUser) {
                await fetchUserDocs(selectedUser.id);
            }
        } finally {
            setDeletingDoc(null);
        }
    };

    // Format file size
    const formatSize = (bytes: number): string => {
        if (bytes === 0) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Get file icon color based on extension
    const getFileColor = (name: string): string => {
        const ext = name.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') return 'text-red-600 bg-red-50';
        if (['jpg', 'jpeg', 'png'].includes(ext || '')) return 'text-emerald-600 bg-emerald-50';
        return 'text-blue-600 bg-blue-50';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-retarder-black">Gestión de Usuarios</h1>
                    <p className="text-sm text-retarder-gray-500">Administra accesos y expedientes de colaboradores</p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-retarder-red text-white rounded-xl text-sm font-semibold hover:bg-retarder-red-700 transition-all shadow-md shadow-retarder-red/20"
                >
                    <UserPlus size={18} /> Nuevo Colaborador
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
                            {allUsers.map((user, i) => {
                                const count = docCounts[user.id] || 0;
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
                                                    count > 0
                                                        ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                                        : "bg-white text-retarder-gray-500 border-retarder-gray-200 hover:bg-retarder-gray-50"
                                                )}
                                            >
                                                <FileText size={12} />
                                                {count > 0 ? `${count} Docs` : 'Sin Docs'}
                                            </button>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleUploadClick(user)}
                                                    className="p-2 text-retarder-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Ver expediente"
                                                >
                                                    <Upload size={14} />
                                                </button>
                                                {user.id.startsWith('custom-') && (
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="p-2 text-retarder-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Eliminar colaborador"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 bg-retarder-gray-50 border-t border-retarder-gray-100 flex items-center justify-between">
                    <p className="text-[10px] text-retarder-gray-400 font-medium">Mostrando {allUsers.length} colaboradores registrados</p>
                    <div className="p-2 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-2 hidden sm:flex">
                        <Shield size={12} className="text-blue-600" />
                        <p className="text-[10px] text-blue-700 font-semibold">Usa el panel para actualizar documentos de colaboradores.</p>
                    </div>
                </div>
            </div>

            {/* Document Upload & View Modal */}
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
                            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="px-6 py-5 border-b border-retarder-gray-100 bg-retarder-gray-50 flex items-center justify-between shrink-0">
                                <div>
                                    <h3 className="text-lg font-bold text-retarder-black">Expediente de Colaborador</h3>
                                    <p className="text-xs text-retarder-gray-500 font-medium">{selectedUser.nombre}</p>
                                </div>
                                <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-retarder-gray-200 rounded-lg transition-colors">
                                    <X size={18} className="text-retarder-gray-500" />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="p-6 space-y-6 overflow-y-auto flex-1">

                                {/* Error Message */}
                                {uploadError && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2"
                                    >
                                        <X size={14} />
                                        {uploadError}
                                        <button onClick={() => setUploadError(null)} className="ml-auto text-red-400 hover:text-red-600">
                                            <X size={12} />
                                        </button>
                                    </motion.div>
                                )}

                                {/* Documents List */}
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-retarder-gray-400 mb-3">
                                        Documentos Subidos {!isLoadingDocs && `(${userDocs.length})`}
                                    </h4>
                                    <div className="space-y-2">
                                        {isLoadingDocs ? (
                                            <div className="p-6 text-center border-2 border-dashed border-retarder-gray-200 rounded-xl bg-retarder-gray-50">
                                                <Loader2 size={24} className="animate-spin text-retarder-gray-400 mx-auto mb-2" />
                                                <p className="text-xs text-retarder-gray-400 font-semibold">Cargando documentos...</p>
                                            </div>
                                        ) : userDocs.length === 0 ? (
                                            <div className="p-6 text-center border-2 border-dashed border-retarder-gray-200 rounded-xl bg-retarder-gray-50 text-retarder-gray-400 text-xs font-semibold">
                                                No hay documentos almacenados para este colaborador.
                                            </div>
                                        ) : (
                                            userDocs.map((doc, idx) => (
                                                <motion.div
                                                    key={doc.name}
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="flex items-center justify-between p-3 border border-retarder-gray-200 rounded-xl bg-white hover:border-blue-300 hover:shadow-sm transition-all group"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                                        <div className={cn("p-2 rounded-lg shrink-0", getFileColor(doc.name))}>
                                                            <FileText size={16} />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs font-bold text-retarder-gray-800 truncate" title={doc.name}>
                                                                {doc.name}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[10px] text-retarder-gray-400 uppercase">Documento Seguro</span>
                                                                {doc.size > 0 && (
                                                                    <span className="text-[10px] text-retarder-gray-300">• {formatSize(doc.size)}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Action buttons */}
                                                    <div className="flex items-center gap-1 ml-2 shrink-0">
                                                        <button
                                                            onClick={() => handleView(doc)}
                                                            className="p-1.5 text-retarder-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                            title="Ver documento"
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDownload(doc)}
                                                            className="p-1.5 text-retarder-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                            title="Descargar documento"
                                                        >
                                                            <Download size={14} />
                                                        </button>
                                                        {confirmDeleteDoc === doc.name ? (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteConfirm(doc);
                                                                }}
                                                                disabled={deletingDoc === doc.name}
                                                                className="p-1.5 rounded-lg transition-all disabled:opacity-50 text-white bg-red-500 hover:bg-red-600"
                                                                title="Clic para confirmar eliminación"
                                                            >
                                                                {deletingDoc === doc.name ? (
                                                                    <Loader2 size={14} className="animate-spin" />
                                                                ) : (
                                                                    <span className="text-[10px] font-bold px-1">¿Sí?</span>
                                                                )}
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteStep1(doc);
                                                                }}
                                                                disabled={deletingDoc === doc.name}
                                                                className="p-1.5 rounded-lg transition-all disabled:opacity-50 text-retarder-gray-400 hover:text-red-600 hover:bg-red-50"
                                                                title="Eliminar documento"
                                                            >
                                                                {deletingDoc === doc.name ? (
                                                                    <Loader2 size={14} className="animate-spin" />
                                                                ) : (
                                                                    <Trash2 size={14} />
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Upload Area */}
                                <div className="border-t border-retarder-gray-100 pt-6">
                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-retarder-gray-400 mb-3">Agregar Documento</h4>
                                    <label className={cn(
                                        "flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                                        isUploading ? "border-blue-300 bg-blue-50 opacity-70 cursor-wait" : "border-retarder-gray-300 hover:border-retarder-red hover:bg-retarder-red/5 bg-white"
                                    )}>
                                        <input
                                            type="file"
                                            className="hidden"
                                            disabled={isUploading}
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={handleFileUpload}
                                        />
                                        <div className={cn("p-4 rounded-full", isUploading ? "bg-blue-100 text-blue-600 animate-pulse" : "bg-retarder-gray-100 text-retarder-gray-400")}>
                                            {isUploading ? <Loader2 size={24} className="animate-spin" /> : <Upload size={24} />}
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-bold text-retarder-gray-800">{isUploading ? 'Subiendo documento a la nube...' : 'Haz clic para seleccionar'}</p>
                                            <p className="text-[10px] text-retarder-gray-400 font-medium">Soporta PDF, JPG, PNG (Max. 10MB)</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add User Modal */}
            <AnimatePresence>
                {showAddForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAddForm(false)}
                            className="absolute inset-0 bg-retarder-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="px-6 py-5 border-b border-retarder-gray-100 bg-gradient-to-r from-retarder-red to-red-700 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                                        <UserPlus size={18} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Nuevo Colaborador</h3>
                                        <p className="text-[10px] text-white/70">Registra un nuevo miembro del equipo</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowAddForm(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                    <X size={18} className="text-white" />
                                </button>
                            </div>

                            {/* Form */}
                            <div className="p-6 space-y-4">
                                {/* Nombre */}
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-retarder-gray-400 mb-1.5 block">Nombre Completo *</label>
                                    <input
                                        type="text"
                                        value={formNombre}
                                        onChange={e => setFormNombre(e.target.value)}
                                        placeholder="Ej: Carolina López García"
                                        className="w-full border border-retarder-gray-200 rounded-xl px-4 py-3 text-sm focus:border-retarder-red focus:ring-2 focus:ring-retarder-red/10 outline-none"
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-retarder-gray-400 mb-1.5 block">Email *</label>
                                    <input
                                        type="email"
                                        value={formEmail}
                                        onChange={e => setFormEmail(e.target.value)}
                                        placeholder="Ej: carolina@retardermexico.com"
                                        className="w-full border border-retarder-gray-200 rounded-xl px-4 py-3 text-sm focus:border-retarder-red focus:ring-2 focus:ring-retarder-red/10 outline-none"
                                    />
                                </div>

                                {/* Rol */}
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-retarder-gray-400 mb-1.5 block">Rol</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(Object.entries(ROL_LABELS) as [Rol, string][]).filter(([key]) => key !== 'direccion').map(([key, label]) => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setFormRole(key)}
                                                className={cn(
                                                    'px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border text-center',
                                                    formRole === key
                                                        ? 'bg-retarder-red text-white border-retarder-red shadow-md shadow-retarder-red/20'
                                                        : 'bg-white border-retarder-gray-200 text-retarder-gray-600 hover:bg-retarder-gray-50'
                                                )}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="px-6 py-4 border-t border-retarder-gray-200 bg-retarder-gray-50 flex gap-2">
                                <button
                                    onClick={() => setShowAddForm(false)}
                                    className="flex-1 px-4 py-2.5 border border-retarder-gray-200 rounded-xl text-sm font-medium text-retarder-gray-600 hover:bg-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAddUser}
                                    disabled={!formNombre.trim() || !formEmail.trim()}
                                    className={cn(
                                        'flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md',
                                        formNombre.trim() && formEmail.trim()
                                            ? 'bg-retarder-red text-white hover:bg-retarder-red-700 shadow-retarder-red/20'
                                            : 'bg-retarder-gray-200 text-retarder-gray-400 cursor-not-allowed shadow-none'
                                    )}
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        <UserPlus size={16} />
                                        Registrar Colaborador
                                    </span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
