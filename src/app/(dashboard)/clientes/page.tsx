'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, Building2, MapPin, Phone, Mail, X, FileText, User, MapPinned,
    Loader2, Edit2, Trash2, ExternalLink, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useRole } from '@/hooks/useRole';

interface Sucursal {
    id: string;
    nombre: string;
    direccion: string;
}

interface Contacto {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    es_contacto_principal: boolean;
}

interface Cliente {
    id: string;
    nombre_comercial: string;
    razon_social: string;
    rfc: string | null;
    email: string | null;
    email_2: string | null;
    telefono: string | null;
    telefono_2: string | null;
    telefono_3: string | null;
    nombre_titular: string | null;
    nombre_sucursal: string | null;
    direccion_fiscal: string | null;
    activo: boolean;
    contactos?: Contacto[];
    sucursales?: Sucursal[];
    persona_contacto?: string | null;
}

export default function ClientesPage() {
    const { isAdmin, isVendedor } = useRole();
    const supabase = createClient();
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        nombre_comercial: '',
        nombre_titular: '',
        nombre_sucursal: '',
        rfc: '',
        persona_contacto: '',
        telefono: '',
        telefono_2: '',
        telefono_3: '',
        email: '',
        email_2: '',
        direccion_fiscal: '',
    });

    useEffect(() => {
        fetchClientes();
    }, []);

    async function fetchClientes() {
        setLoading(true);
        setError(null);
        try {
            console.log('Fetching companies...');
            const { data: companies, error: companiesError } = await supabase
                .from('empresas')
                .select('*');

            if (companiesError) {
                console.error('Empresas Error:', companiesError);
                throw companiesError;
            }

            console.log('Fetched companies:', companies?.length);

            const { data: allContacts, error: contactsError } = await supabase
                .from('contactos')
                .select('*');

            if (contactsError) console.error('Contacts Error:', contactsError);

            const mapped: Cliente[] = (companies || []).map(emp => {
                const companyContacts = allContacts?.filter(c => c.empresa_id === emp.id) || [];
                const principal = companyContacts.find(c => c.es_contacto_principal) || companyContacts[0];
                return {
                    ...emp,
                    persona_contacto: principal ? `${principal.nombre} ${principal.apellido}`.trim() : (emp as any).persona_contacto || null,
                    contactos: companyContacts
                };
            });

            console.log('Mapped clients:', mapped.length);
            setClientes(mapped);
        } catch (err: any) {
            console.error('Full fetch error:', err);
            setError(`Error de base de datos: ${err.message || 'Desconocido'}`);
        } finally {
            setLoading(false);
        }
    }

    const handleCloseForm = () => {
        setShowForm(false);
        setIsEditMode(false);
        setFormData({
            nombre_comercial: '',
            nombre_titular: '',
            nombre_sucursal: '',
            rfc: '',
            persona_contacto: '',
            telefono: '',
            telefono_2: '',
            telefono_3: '',
            email: '',
            email_2: '',
            direccion_fiscal: '',
        });
    };

    const handleOpenEdit = (cliente: Cliente) => {
        setFormData({
            nombre_comercial: cliente.nombre_comercial || '',
            nombre_titular: cliente.nombre_titular || '',
            nombre_sucursal: cliente.nombre_sucursal || '',
            rfc: cliente.rfc || '',
            persona_contacto: cliente.persona_contacto || '',
            telefono: cliente.telefono || '',
            telefono_2: cliente.telefono_2 || '',
            telefono_3: cliente.telefono_3 || '',
            email: cliente.email || '',
            email_2: cliente.email_2 || '',
            direccion_fiscal: cliente.direccion_fiscal || '',
        });
        setIsEditMode(true);
        setShowForm(true);
    };

    async function handleDelete(id: string) {
        if (!confirm('¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.')) return;

        try {
            const { error } = await supabase
                .from('empresas')
                .delete()
                .eq('id', id);

            if (error) throw error;

            fetchClientes();
            setSelectedCliente(null);
        } catch (err: any) {
            console.error('Error deleting client:', err);
            alert(`Error al eliminar: ${err.message}`);
        }
    }

    const filtered = useMemo(() => {
        if (!searchQuery.trim()) return clientes;
        const q = searchQuery.toLowerCase();
        return clientes.filter(e =>
            (e.nombre_comercial?.toLowerCase() || '').includes(q) ||
            (e.rfc?.toLowerCase() || '').includes(q) ||
            (e.persona_contacto?.toLowerCase() || '').includes(q) ||
            (e.email?.toLowerCase() || '').includes(q)
        );
    }, [searchQuery, clientes]);

    const stats = {
        total: clientes.length,
        conRFC: clientes.filter(e => e.rfc).length,
        conContacto: clientes.filter(e => e.persona_contacto).length,
        conEmail: clientes.filter(e => e.email).length,
    };

    async function handleSave() {
        if (!formData.nombre_comercial) {
            alert('El nombre comercial es obligatorio');
            return;
        }

        // Diagnostic: Check if env vars are present (client-side check)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            alert('ERROR CRÍTICO: Las variables de entorno de Supabase no están configuradas en Vercel. Por favor contacta al administrador.');
            return;
        }

        setIsSaving(true);
        try {
            const sanitizedData = {
                nombre_comercial: formData.nombre_comercial,
                nombre_titular: formData.nombre_titular.trim() || null,
                nombre_sucursal: formData.nombre_sucursal.trim() || null,
                rfc: formData.rfc.trim() || null,
                telefono: formData.telefono.trim() || null,
                telefono_2: formData.telefono_2.trim() || null,
                telefono_3: formData.telefono_3.trim() || null,
                email: formData.email.trim() || null,
                email_2: formData.email_2.trim() || null,
                direccion_fiscal: formData.direccion_fiscal.trim() || null,
                activo: true
            };

            if (isEditMode && selectedCliente) {
                // UPDATE MODE
                console.log('Actualizando cliente:', selectedCliente.id, sanitizedData);

                const { error: updateError } = await supabase
                    .from('empresas')
                    .update(sanitizedData)
                    .eq('id', selectedCliente.id);

                if (updateError) throw updateError;

                // Update principal contact
                if (formData.persona_contacto) {
                    const principal = selectedCliente.contactos?.find(c => c.es_contacto_principal);
                    if (principal) {
                        await supabase
                            .from('contactos')
                            .update({
                                nombre: formData.persona_contacto,
                                email: sanitizedData.email,
                                telefono: sanitizedData.telefono,
                            })
                            .eq('id', principal.id);
                    } else {
                        await supabase.from('contactos').insert([{
                            empresa_id: selectedCliente.id,
                            nombre: formData.persona_contacto,
                            apellido: '',
                            email: sanitizedData.email,
                            telefono: sanitizedData.telefono,
                            es_contacto_principal: true,
                            activo: true
                        }]);
                    }
                }
            } else {
                // CREATE MODE
                console.log('Intentando guardar cliente v1.2:', sanitizedData);

                // 1. Create company record
                const { data: empresaData, error: empresaError } = await supabase
                    .from('empresas')
                    .insert([sanitizedData])
                    .select();

                if (empresaError) {
                    console.error('Detailed Empresa Error:', empresaError);
                    throw empresaError;
                }

                // 2. Create contact if name is provided
                if (formData.persona_contacto && empresaData && empresaData[0]) {
                    const { error: contactoError } = await supabase
                        .from('contactos')
                        .insert([{
                            empresa_id: empresaData[0].id,
                            nombre: formData.persona_contacto,
                            apellido: '', // Simple name
                            email: sanitizedData.email,
                            telefono: sanitizedData.telefono,
                            es_contacto_principal: true,
                            activo: true
                        }]);

                    if (contactoError) console.error('Error al crear contacto:', contactoError);
                }
            }

            fetchClientes();
            handleCloseForm();
            if (selectedCliente) {
                // Refresh detail if open
                const updated = clientes.find(c => c.id === selectedCliente.id);
                if (updated) setSelectedCliente(updated);
                else setSelectedCliente(null);
            }
        } catch (error: unknown) {
            console.error('Error saving cliente (Full Object):', error);

            const err = error as { code?: string; message?: string; details?: string; hint?: string };
            const code = err.code || 'SIN_CODIGO';
            const message = err.message || 'Sin mensaje de error';
            const details = err.details || 'Sin detalles adicionales';
            const hint = err.hint || 'Sin sugerencias';

            if (code === '23505') {
                alert('CONFLITO: Ya existe una empresa con ese RFC. Intenta con uno distinto o búscalo en la lista.');
            } else if (code === '42501') {
                alert('ERROR DE PERMISOS (RLS): No tienes permisos para insertar en la tabla empresas. Verifica las políticas en Supabase.');
            } else {
                alert(`Error al guardar cliente (v1.2):\n\nCódigo: ${code}\nMensaje: ${message}\nDetalles: ${details}\nSugerencia: ${hint}`);
            }
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <span className="text-[10px] font-black text-retarder-gray-400 bg-retarder-gray-100/50 px-2 py-1 rounded-md tracking-widest uppercase">
                    Build: v1.3-premium-stable
                </span>
            </div>
            {/* Header section with Stats */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-retarder-black">Clientes <span className="text-xs font-normal text-red-500 font-bold tracking-widest bg-red-50 px-2 py-1 rounded">V1.3.1-DIAG</span></h1>
                        <p className="text-sm text-retarder-gray-500 mt-1">Gestión integral de empresas y contactos (Total: {clientes.length})</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* View toggle removed to force card view */}
                        {(isAdmin || isVendedor) && (
                            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-6 py-2.5 bg-[#FACC15] text-black rounded-xl text-sm font-bold hover:bg-[#EAB308] transition-all shadow-lg shadow-yellow-500/25 active:scale-95">
                                <Plus size={18} />
                                <span>Nuevo Cliente</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Clientes', value: stats.total, color: 'from-blue-500 to-indigo-600', icon: <Building2 className="text-white/20" size={40} /> },
                        { label: 'Con Registro RFC', value: stats.conRFC, color: 'from-emerald-500 to-teal-600', icon: <FileText className="text-white/20" size={40} /> },
                        { label: 'Contactos Activos', value: stats.conContacto, color: 'from-orange-500 to-amber-600', icon: <User className="text-white/20" size={40} /> },
                        { label: 'Emails Registrados', value: stats.conEmail, color: 'from-purple-500 to-pink-600', icon: <Mail className="text-white/20" size={40} /> },
                    ].map((s, i) => (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={cn("relative overflow-hidden bg-gradient-to-br rounded-2xl p-5 shadow-lg", s.color)}
                        >
                            <div className="relative z-10 text-white">
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{s.label}</p>
                                <p className="text-3xl font-black mt-1 leading-tight">{s.value}</p>
                            </div>
                            <div className="absolute right-0 bottom-0 p-2 transform translate-x-1 translate-y-2">
                                {s.icon}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
            {/* Filter & Search */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-retarder-gray-200 shadow-sm">
                <div className="relative flex-1 group">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-retarder-gray-400 group-focus-within:text-retarder-red transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, RFC, contacto o email..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-retarder-gray-50 border-none rounded-lg pl-10 pr-10 py-3 text-sm focus:ring-2 focus:ring-retarder-red/20 outline-none transition-all"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-retarder-gray-200 rounded-full">
                            <X size={14} className="text-retarder-gray-400" />
                        </button>
                    )}
                </div>
                <div className="text-xs font-semibold text-retarder-gray-400 px-2 whitespace-nowrap">
                    {filtered.length} RESULTADOS
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangle size={20} />
                        <span className="text-sm font-bold">Error: {error}</span>
                    </div>
                    <button onClick={fetchClientes} className="text-xs font-black uppercase tracking-widest hover:underline">Reintentar</button>
                </div>
            )}

            {loading ? (
                <div className="py-20 text-center flex flex-col items-center">
                    <div className="relative">
                        <Loader2 size={48} className="text-retarder-red animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2 h-2 bg-retarder-red rounded-full" />
                        </div>
                    </div>
                    <p className="mt-4 text-retarder-gray-500 font-medium animate-pulse">Cargando base de clientes...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filtered.map((e, i) => (
                            <motion.div
                                key={e.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                transition={{
                                    delay: Math.min(i * 0.05, 0.4),
                                    type: "spring",
                                    stiffness: 260,
                                    damping: 20
                                }}
                                onClick={() => setSelectedCliente(e)}
                                className="group relative bg-white rounded-[2rem] border border-retarder-gray-100 hover:border-retarder-red/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:shadow-retarder-red/5 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col"
                            >
                                {/* Floating Badge for Status */}
                                <div className="absolute top-4 right-4 z-10">
                                    <div className={cn(
                                        "px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border flex items-center gap-1.5 backdrop-blur-sm transition-all duration-500",
                                        e.activo
                                            ? "bg-emerald-50/80 text-emerald-600 border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500"
                                            : "bg-retarder-gray-50/80 text-retarder-gray-400 border-retarder-gray-100 group-hover:bg-retarder-gray-400 group-hover:text-white"
                                    )}>
                                        <div className={cn(
                                            "w-1.5 h-1.5 rounded-full animate-pulse",
                                            e.activo ? "bg-emerald-500 group-hover:bg-white" : "bg-retarder-gray-300 group-hover:bg-white"
                                        )} />
                                        {e.activo ? 'ACTIVO' : 'INACTIVO'}
                                    </div>
                                </div>

                                <div className="p-7 flex-1 flex flex-col">
                                    {/* Icon & Name Section */}
                                    <div className="mb-6">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-retarder-gray-50 to-retarder-gray-100 border border-retarder-gray-100 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-retarder-red/5 group-hover:border-retarder-red/20 transition-all duration-500">
                                            <Building2 size={28} className="text-retarder-gray-400 group-hover:text-retarder-red transition-colors duration-500" />
                                        </div>
                                        <h3 className="font-black text-lg text-retarder-black leading-tight group-hover:text-retarder-red transition-colors duration-300 line-clamp-2 min-h-[3.5rem]">
                                            {e.nombre_comercial}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            <p className="text-[10px] font-mono font-bold text-retarder-gray-400 bg-retarder-gray-50 px-2 py-0.5 rounded group-hover:bg-retarder-red/5 group-hover:text-retarder-red transition-all duration-500">
                                                {e.rfc || 'SIN RFC'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Content Info */}
                                    <div className="space-y-3.5 mt-auto">
                                        <div className="flex items-center gap-3 group/item">
                                            <div className="w-8 h-8 rounded-xl bg-blue-50/50 flex items-center justify-center text-blue-600 group-hover/item:bg-blue-600 group-hover/item:text-white transition-all duration-300">
                                                <User size={14} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[9px] font-black text-retarder-gray-400 uppercase tracking-widest">Contacto</p>
                                                <p className="text-xs font-bold text-retarder-black truncate">{e.persona_contacto || 'No asignado'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 group/item">
                                            <div className="w-8 h-8 rounded-xl bg-emerald-50/50 flex items-center justify-center text-emerald-600 group-hover/item:bg-emerald-600 group-hover/item:text-white transition-all duration-300">
                                                <Phone size={14} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[9px] font-black text-retarder-gray-400 uppercase tracking-widest">Teléfono</p>
                                                <p className="text-xs font-bold text-retarder-black">{e.telefono || '—'}</p>
                                            </div>
                                        </div>

                                        {e.email && (
                                            <div className="flex items-center gap-3 group/item">
                                                <div className="w-8 h-8 rounded-xl bg-purple-50/50 flex items-center justify-center text-purple-600 group-hover/item:bg-purple-600 group-hover/item:text-white transition-all duration-300">
                                                    <Mail size={14} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[9px] font-black text-retarder-gray-400 uppercase tracking-widest">Email</p>
                                                    <p className="text-xs font-bold text-retarder-black truncate">{e.email}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Decorative Footer */}
                                <div className="px-7 py-4 bg-retarder-gray-50/50 border-t border-retarder-gray-100 flex items-center justify-between group-hover:bg-retarder-red/[0.02] transition-colors duration-500">
                                    <div className="flex -space-x-2">
                                        {e.sucursales && e.sucursales.length > 0 ? (
                                            e.sucursales.slice(0, 3).map((s: Sucursal, idx: number) => (
                                                <div key={idx} className="w-7 h-7 rounded-full bg-white border border-retarder-gray-200 flex items-center justify-center shadow-sm group-hover:border-retarder-red/30 transition-colors" title={s.nombre}>
                                                    <MapPinned size={12} className="text-retarder-red/60" />
                                                </div>
                                            ))
                                        ) : (
                                            <span className="text-[9px] text-retarder-gray-400 font-black uppercase tracking-widest">Métricas: 0</span>
                                        )}
                                        {e.sucursales && e.sucursales.length > 3 && (
                                            <div className="w-7 h-7 rounded-full bg-retarder-black border-2 border-white flex items-center justify-center text-[8px] font-black text-white">
                                                +{e.sucursales.length - 3}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-2 rounded-xl bg-white border border-retarder-gray-200 text-retarder-gray-400 group-hover:text-retarder-red group-hover:border-retarder-red/20 group-hover:rotate-45 transition-all duration-500">
                                        <ExternalLink size={14} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )
            }

            {
                !loading && filtered.length === 0 && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-24 text-center bg-white rounded-3xl border border-dashed border-retarder-gray-200 flex flex-col items-center">
                        <div className="w-20 h-20 bg-retarder-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Building2 size={40} className="text-retarder-gray-200" />
                        </div>
                        <h3 className="text-lg font-bold text-retarder-gray-900">No se encontraron clientes</h3>
                        <p className="text-sm text-retarder-gray-400 mt-1 max-w-xs mx-auto">Prueba ajustando los términos de búsqueda o agrega un nuevo cliente al sistema.</p>
                    </motion.div>
                )
            }

            {/* Client Detail Modal */}
            <AnimatePresence>
                {selectedCliente && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedCliente(null)} className="fixed inset-0 bg-retarder-black/60 backdrop-blur-md z-40" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] z-50 overflow-hidden"
                        >
                            <div className="relative px-8 py-10">
                                {/* Header with Badge */}
                                <div className="flex items-start justify-between mb-8">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 rounded-3xl bg-retarder-red flex items-center justify-center shadow-2xl shadow-retarder-red/30">
                                            <Building2 size={32} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-retarder-black tracking-tight">{selectedCliente.nombre_comercial}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-mono font-bold text-retarder-gray-400 uppercase tracking-tighter bg-retarder-gray-100 px-2 py-0.5 rounded-md">RFC: {selectedCliente.rfc || 'XAX000000XXX'}</span>
                                                <span className="w-1 h-1 bg-retarder-gray-300 rounded-full" />
                                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Empresa Activa</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedCliente(null)} className="p-3 rounded-2xl bg-retarder-gray-50 text-retarder-gray-400 hover:bg-retarder-red/10 hover:text-retarder-red transition-all"><X size={24} /></button>
                                </div>

                                {/* Body Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                                    <div className="space-y-6">
                                        <div className="group">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-retarder-gray-400 mb-2 block">Nombres de Registro</label>
                                            <div className="space-y-2">
                                                <div className="flex gap-3 text-sm text-retarder-gray-700 font-medium">
                                                    <Building2 className="text-retarder-red flex-shrink-0 mt-0.5" size={16} />
                                                    <p><strong>Titular:</strong> {selectedCliente.nombre_titular || '—'}</p>
                                                </div>
                                                <div className="flex gap-3 text-sm text-retarder-gray-700 font-medium">
                                                    <MapPinned className="text-retarder-red flex-shrink-0 mt-0.5" size={16} />
                                                    <p><strong>Sucursal:</strong> {selectedCliente.nombre_sucursal || '—'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="group">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-retarder-gray-400 mb-2 block">Dirección Fiscal</label>
                                            <div className="flex gap-3 text-sm text-retarder-gray-700 font-medium">
                                                <MapPin className="text-retarder-red flex-shrink-0 mt-0.5" size={16} />
                                                <p className="leading-relaxed">{selectedCliente.direccion_fiscal || 'Sin dirección registrada'}</p>
                                            </div>
                                        </div>

                                        <div className="group">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-retarder-gray-400 mb-2 block">Información de contacto</label>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3 text-sm text-retarder-gray-700 font-medium">
                                                    <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                                                        <User className="text-blue-600" size={12} />
                                                    </div>
                                                    <span>{selectedCliente.persona_contacto || 'Nombre no registrado'}</span>
                                                </div>
                                                <div className="flex flex-col gap-2 ml-9">
                                                    <div className="flex items-center gap-3 text-sm text-retarder-gray-700 font-medium">
                                                        <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center">
                                                            <Phone className="text-emerald-600" size={12} />
                                                        </div>
                                                        <span>{selectedCliente.telefono || 'Teléfono 1 no registrado'}</span>
                                                    </div>
                                                    {selectedCliente.telefono_2 && (
                                                        <div className="flex items-center gap-3 text-sm text-retarder-gray-700 font-medium">
                                                            <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center">
                                                                <Phone className="text-emerald-400" size={12} />
                                                            </div>
                                                            <span>{selectedCliente.telefono_2} (Tel 2)</span>
                                                        </div>
                                                    )}
                                                    {selectedCliente.telefono_3 && (
                                                        <div className="flex items-center gap-3 text-sm text-retarder-gray-700 font-medium">
                                                            <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center">
                                                                <Phone className="text-emerald-400" size={12} />
                                                            </div>
                                                            <span>{selectedCliente.telefono_3} (Tel 3)</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-2 ml-9">
                                                    <div className="flex items-center gap-3 text-sm text-retarder-gray-700 font-medium">
                                                        <div className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center">
                                                            <Mail className="text-purple-600" size={12} />
                                                        </div>
                                                        <span className="underline decoration-purple-200 underline-offset-2">{selectedCliente.email || 'Email 1 no registrado'}</span>
                                                    </div>
                                                    {selectedCliente.email_2 && (
                                                        <div className="flex items-center gap-3 text-sm text-retarder-gray-700 font-medium">
                                                            <div className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center">
                                                                <Mail className="text-purple-400" size={12} />
                                                            </div>
                                                            <span className="underline decoration-purple-200 underline-offset-2">{selectedCliente.email_2} (Email 2)</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-retarder-gray-50/50 rounded-3xl p-6 border border-retarder-gray-100">
                                        <h4 className="text-xs font-black uppercase tracking-[0.15em] text-retarder-black mb-4">Sucursales</h4>
                                        <div className="space-y-3">
                                            {selectedCliente.sucursales && selectedCliente.sucursales.length > 0 ? (
                                                selectedCliente.sucursales.map((s: Sucursal) => (
                                                    <div key={s.id} className="bg-white p-3 rounded-xl border border-retarder-gray-200 flex items-start gap-3 shadow-sm">
                                                        <MapPinned size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <p className="text-xs font-bold text-retarder-gray-800">{s.nombre}</p>
                                                            <p className="text-[10px] text-retarder-gray-400 mt-0.5 line-clamp-1">{s.direccion}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-6">
                                                    <MapPinned size={24} className="mx-auto text-retarder-gray-200 mb-2" />
                                                    <p className="text-[10px] text-retarder-gray-400 font-bold uppercase tracking-wider">No hay sucursales registradas</p>
                                                </div>
                                            )}
                                        </div>
                                        {(isAdmin || isVendedor) && (
                                            <button className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 bg-white border border-dashed border-retarder-gray-300 rounded-xl text-xs font-bold text-retarder-gray-500 hover:border-retarder-red hover:text-retarder-red transition-all">
                                                <Plus size={14} />
                                                <span>Añadir Sucursal</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="mt-12 flex items-center gap-4">
                                    {(isAdmin || isVendedor) && (
                                        <>
                                            <button
                                                onClick={() => handleOpenEdit(selectedCliente)}
                                                className="flex-1 flex items-center justify-center gap-2 py-4 bg-retarder-red text-white rounded-2xl font-bold shadow-xl shadow-retarder-red/25 hover:bg-retarder-red-700 transition-all active:scale-95"
                                            >
                                                <Edit2 size={18} />
                                                <span>Editar Cliente</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(selectedCliente.id)}
                                                className="flex items-center justify-center p-4 bg-white border border-retarder-gray-200 text-retarder-gray-400 hover:text-retarder-red hover:bg-retarder-red/5 rounded-2xl transition-all active:scale-95"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </>
                                    )}
                                    {!isAdmin && !isVendedor && (
                                        <button onClick={() => setSelectedCliente(null)} className="w-full py-4 bg-retarder-black text-white rounded-2xl font-bold shadow-xl transition-all active:scale-95">Cerrar Detalle</button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* New Client Modal */}
            <AnimatePresence>
                {showForm && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleCloseForm} className="fixed inset-0 bg-retarder-black/60 backdrop-blur-md z-40" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] z-50 overflow-hidden"
                        >
                            <div className="relative px-8 py-8 border-b border-retarder-gray-100 bg-gradient-to-r from-retarder-red to-retarder-red-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-2xl font-black text-white tracking-tight italic uppercase">
                                            {isEditMode ? 'EDITAR' : 'NUEVO'} <span className="text-white/70">CLIENTE</span>
                                        </h3>
                                        <p className="text-white/60 text-xs font-medium mt-1">
                                            {isEditMode ? 'Modifica los datos de la empresa.' : 'Ingresa los datos fiscales y de contacto de la nueva empresa.'}
                                        </p>
                                    </div>
                                    <button onClick={handleCloseForm} className="p-3 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all"><X size={20} /></button>
                                </div>
                            </div>

                            <div className="px-10 py-8 max-h-[70vh] overflow-y-auto space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Company Names */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-retarder-gray-400 px-1">Nombre Comercial de la Empresa</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-retarder-gray-400 group-focus-within:text-retarder-red transition-colors">
                                                <Building2 size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Nombre Comercial"
                                                className="w-full bg-retarder-gray-50 border-2 border-transparent focus:border-retarder-red/20 focus:bg-white rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-retarder-black transition-all outline-none"
                                                value={formData.nombre_comercial}
                                                onChange={e => setFormData({ ...formData, nombre_comercial: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-retarder-gray-400 px-1">RFC</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-retarder-gray-400 group-focus-within:text-retarder-red transition-colors">
                                                <FileText size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="RFC de 12 o 13 carác"
                                                maxLength={13}
                                                className="w-full bg-retarder-gray-50 border-2 border-transparent focus:border-retarder-red/20 focus:bg-white rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-retarder-black uppercase transition-all outline-none"
                                                value={formData.rfc}
                                                onChange={e => setFormData({ ...formData, rfc: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-retarder-gray-400 px-1">Nombre Titular (Dueño/Legal)</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-retarder-gray-400 group-focus-within:text-retarder-red transition-colors">
                                                <User size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Nombre del Titular"
                                                className="w-full bg-retarder-gray-50 border-2 border-transparent focus:border-retarder-red/20 focus:bg-white rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-retarder-black transition-all outline-none"
                                                value={formData.nombre_titular}
                                                onChange={e => setFormData({ ...formData, nombre_titular: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-retarder-gray-400 px-1">Nombre de Sucursal</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-retarder-gray-400 group-focus-within:text-retarder-red transition-colors">
                                                <MapPinned size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Ej: Sucursal Centro"
                                                className="w-full bg-retarder-gray-50 border-2 border-transparent focus:border-retarder-red/20 focus:bg-white rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-retarder-black transition-all outline-none"
                                                value={formData.nombre_sucursal}
                                                onChange={e => setFormData({ ...formData, nombre_sucursal: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Contact Person */}
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-retarder-gray-400 px-1">Persona de Contacto Principal</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-retarder-gray-400 group-focus-within:text-retarder-red transition-colors">
                                                <User size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Nombre del encargado principal"
                                                className="w-full bg-retarder-gray-50 border-2 border-transparent focus:border-retarder-red/20 focus:bg-white rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-retarder-black transition-all outline-none"
                                                value={formData.persona_contacto}
                                                onChange={e => setFormData({ ...formData, persona_contacto: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Phones */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-retarder-gray-400 px-1">Teléfono 1</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-retarder-gray-400 group-focus-within:text-retarder-red transition-colors">
                                                <Phone size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Principal"
                                                className="w-full bg-retarder-gray-50 border-2 border-transparent focus:border-retarder-red/20 focus:bg-white rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-retarder-black transition-all outline-none"
                                                value={formData.telefono}
                                                onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-retarder-gray-400 px-1">Teléfono 2</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-retarder-gray-400 group-focus-within:text-retarder-red transition-colors">
                                                <Phone size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Opcional"
                                                className="w-full bg-retarder-gray-50 border-2 border-transparent focus:border-retarder-red/20 focus:bg-white rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-retarder-black transition-all outline-none"
                                                value={formData.telefono_2}
                                                onChange={e => setFormData({ ...formData, telefono_2: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-retarder-gray-400 px-1">Teléfono 3</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-retarder-gray-400 group-focus-within:text-retarder-red transition-colors">
                                                <Phone size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Opcional"
                                                className="w-full bg-retarder-gray-50 border-2 border-transparent focus:border-retarder-red/20 focus:bg-white rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-retarder-black transition-all outline-none"
                                                value={formData.telefono_3}
                                                onChange={e => setFormData({ ...formData, telefono_3: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Emails */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-retarder-gray-400 px-1">Email 1</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-retarder-gray-400 group-focus-within:text-retarder-red transition-colors">
                                                <Mail size={18} />
                                            </div>
                                            <input
                                                type="email"
                                                placeholder="Principal"
                                                className="w-full bg-retarder-gray-50 border-2 border-transparent focus:border-retarder-red/20 focus:bg-white rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-retarder-black transition-all outline-none"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-retarder-gray-400 px-1">Email 2</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-retarder-gray-400 group-focus-within:text-retarder-red transition-colors">
                                                <Mail size={18} />
                                            </div>
                                            <input
                                                type="email"
                                                placeholder="Opcional"
                                                className="w-full bg-retarder-gray-50 border-2 border-transparent focus:border-retarder-red/20 focus:bg-white rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-retarder-black transition-all outline-none"
                                                value={formData.email_2}
                                                onChange={e => setFormData({ ...formData, email_2: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Tax Address */}
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-retarder-gray-400 px-1">Dirección Fiscal</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-4 text-retarder-gray-400 group-focus-within:text-retarder-red transition-colors">
                                                <MapPin size={18} />
                                            </div>
                                            <textarea
                                                placeholder="Calle, número, colonia, CP, Ciudad y Estado"
                                                className="w-full bg-retarder-gray-50 border-2 border-transparent focus:border-retarder-red/20 focus:bg-white rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-retarder-black min-h-[100px] transition-all outline-none resize-none"
                                                value={formData.direccion_fiscal}
                                                onChange={e => setFormData({ ...formData, direccion_fiscal: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="px-10 py-8 bg-retarder-gray-50 border-t border-retarder-gray-100 flex gap-4">
                                <button
                                    onClick={() => setShowForm(false)}
                                    disabled={isSaving}
                                    className="px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest text-retarder-gray-400 hover:text-retarder-red hover:bg-retarder-red/5 transition-all disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-retarder-red text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-retarder-red-700 shadow-xl shadow-retarder-red/25 transition-all disabled:opacity-50 active:scale-95"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            <span>PROCESANDO...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>GUARDAR CLIENTE</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div >
    );
}
