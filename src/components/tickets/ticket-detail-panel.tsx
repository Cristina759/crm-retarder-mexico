'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Wrench, User, CalendarDays, DollarSign, FileText, ArrowRight, Clock, Ticket, Loader2, AlertCircle, Upload, Image as ImageIcon, FileCheck, Eye as EyeIcon, Trash2, Camera, Save, ClipboardList } from 'lucide-react';
import { cn, formatMXN, formatDate } from '@/lib/utils';
import {
    type DemoOrden,
    ORDEN_ESTADO_LABELS,
    ORDEN_ESTADO_COLORS,
    ORDEN_ESTADOS,
    ORDEN_PHASES,
    PRIORIDAD_COLORS,
    PRIORIDAD_LABELS,
    TIPO_SERVICIO_LABELS,
    getPhaseForEstado,
} from '@/lib/utils/constants';
import { createClient } from '@/lib/supabase/client';
import { InventoryService } from '@/lib/services/inventory-service';
import { StorageService } from '@/lib/services/storage-service';
import { SurveyService } from '@/lib/services/survey-service';
import type { Evidencia } from '@/types/database';
import { useRole } from '@/hooks/useRole';


interface OrdenDetailPanelProps {
    orden: DemoOrden | null;
    onClose: () => void;
    onUpdate?: () => void;
}

export function OrdenDetailPanel({ orden, onClose, onUpdate }: OrdenDetailPanelProps) {
    const supabase = createClient();
    const [isAdvancing, setIsAdvancing] = useState(false);
    const [isUpdatingTecnico, setIsUpdatingTecnico] = useState(false);
    const [localTecnico, setLocalTecnico] = useState(orden?.tecnico || '');
    const [error, setError] = useState<string | null>(null);
    const { isTecnico, isAdmin } = useRole();
    const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
    const [isLoadingEvidencias, setIsLoadingEvidencias] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [survey, setSurvey] = useState<any>(null);
    const [isLoadingSurvey, setIsLoadingSurvey] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [numeroOrdenFisica, setNumeroOrdenFisica] = useState(orden?.numero_orden_fisica || '');
    const [isSavingNumero, setIsSavingNumero] = useState(false);
    const [numeroSaved, setNumeroSaved] = useState(false);

    // Sync local state when orden changes
    useEffect(() => {
        if (orden) {
            setLocalTecnico(orden.tecnico || '');
            setNumeroOrdenFisica(orden.numero_orden_fisica || '');
            setNumeroSaved(false);
            fetchEvidencias();
            fetchSurvey();
        }
    }, [orden]);

    const fetchSurvey = async () => {
        if (!orden) return;
        setIsLoadingSurvey(true);
        const { data, error: surveyError } = await SurveyService.getOrCreateSurvey(orden.id);
        if (!surveyError) setSurvey(data);
        setIsLoadingSurvey(false);
    };

    const copySurveyLink = () => {
        if (!survey) return;
        const link = `${window.location.origin}/encuesta/${survey.token_acceso}`;
        navigator.clipboard.writeText(link);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const fetchEvidencias = async () => {
        if (!orden) return;
        setIsLoadingEvidencias(true);
        const { data, error: fetchError } = await StorageService.getEvidences(orden.id);
        if (!fetchError) {
            setEvidencias(data || []);
        }
        setIsLoadingEvidencias(false);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, tipo: 'documento' | 'foto_antes' | 'foto_despues') => {
        const file = event.target.files?.[0];
        if (!orden || !file) return;

        setIsUploading(true);
        setError(null);

        try {
            const bucket = tipo === 'documento' ? 'documentos' : 'evidencias';
            const fileName = `${orden.id}/${tipo}_${Date.now()}_${file.name}`;

            const { url, error: uploadError } = await StorageService.uploadFile(file, bucket, fileName);
            if (uploadError) throw uploadError;

            const { error: regError } = await StorageService.registerEvidence({
                orden_id: orden.id,
                tipo: tipo as any,
                archivo_url: url,
                descripcion: tipo === 'documento' ? 'Orden de Compra' : tipo === 'foto_antes' ? 'Evidencia Antes' : 'Evidencia Después',
            });

            if (regError) throw regError;

            await fetchEvidencias();
        } catch (err: any) {
            console.error('Error uploading file:', err);
            setError(`Error al subir archivo: ${err.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const TECNICOS = ['Nahum Garcia', 'Carlos Abraham Espinosa'];

    const handleUpdateTecnico = async (newTecnico: string) => {
        if (!orden || !newTecnico) return;

        // Update local state immediately for snappy feel
        setLocalTecnico(newTecnico);

        console.log('Intentando asignar técnico:', newTecnico, 'a la orden:', orden.id);
        setIsUpdatingTecnico(true);
        setError(null);
        try {
            const { data, error: updateError } = await supabase
                .from('ordenes_servicio')
                .update({ tecnico: newTecnico })
                .eq('id', orden.id)
                .select();

            if (updateError) {
                // Revert on error
                setLocalTecnico(orden.tecnico || '');
                console.error('Error de Supabase:', updateError);
                throw updateError;
            }

            console.log('Técnico actualizado con éxito:', data);
            if (onUpdate) onUpdate();
        } catch (err: any) {
            console.error('Error updating tecnico:', err);
            setError(`Error: ${err.message || 'No se pudo asignar el técnico.'}`);
        } finally {
            setIsUpdatingTecnico(false);
        }
    };

    const handleAdvanceState = async () => {
        if (!orden) return;

        const currentIndex = ORDEN_ESTADOS.indexOf(orden.estado);
        if (currentIndex === ORDEN_ESTADOS.length - 1) return; // Already at last state

        const nextState = ORDEN_ESTADOS[currentIndex + 1];
        setError(null);
        setIsAdvancing(true);

        try {
            // --- Business Validations ---

            // 1. Cotización Aceptada requires OC PDF - COMMMENTED OUT AS PER USER REQUEST
            /*
            if (nextState === 'cotizacion_aceptada') {
                const hasOC = evidencias.some(e => e.tipo === 'documento');
                if (!hasOC) {
                    throw new Error('Se requiere adjuntar el PDF de la Orden de Compra para aceptar la cotización.');
                }
            }
            */

            // 2. Para avanzar a fase operativa o más allá: requiere técnico + Nº OS física + foto
            const operativeStates = ['asignacion_tecnico', 'servicio_programado', 'documentacion_enviada', 'tecnico_en_contacto', 'servicio_en_proceso', 'autorizacion_adicional'];
            if (operativeStates.includes(nextState)) {
                if (!localTecnico) {
                    throw new Error('Se requiere asignar un técnico antes de avanzar.');
                }
                if (!numeroOrdenFisica.trim()) {
                    throw new Error('Se requiere capturar el Nº de Orden de Servicio Física (papel) antes de avanzar.');
                }
                const hasFotoOrden = evidencias.some(e => e.tipo === 'foto_antes');
                if (!hasFotoOrden) {
                    throw new Error('Se requiere subir la foto de la Orden de Servicio Física (papel) antes de avanzar.');
                }
            }

            // 3. Evidencia Cargada requires photos
            if (nextState === 'evidencia_cargada') {
                const photosCount = evidencias.filter(e => e.tipo === 'foto_antes' || e.tipo === 'foto_despues').length;
                if (photosCount < 2) {
                    throw new Error('Se requiere cargar fotos de "Antes" y "Después" para avanzar.');
                }
            }

            // --- Inventory Triggers ---

            if (nextState === 'servicio_en_proceso') {
                await InventoryService.reserveForOrder(orden.id);
            }

            if (nextState === 'encuesta_enviada') {
                await SurveyService.getOrCreateSurvey(orden.id);
            }

            if (nextState === 'servicio_concluido') {
                await InventoryService.deductForOrder(orden.id);
            }

            // --- DB Update ---
            const { error: updateError } = await supabase
                .from('ordenes_servicio')
                .update({ estado: nextState })
                .eq('id', orden.id);

            if (updateError) throw updateError;

            if (onUpdate) onUpdate();
            onClose(); // Close panel after successful advance

        } catch (err: any) {
            console.error('Error advancing state:', err);
            setError(err.message || 'Ocurrió un error al avanzar el estado.');
        } finally {
            setIsAdvancing(false);
        }
    };

    const handleDeleteOrden = async () => {
        if (!orden) return;
        if (!confirm('¿Estás seguro de que deseas eliminar esta orden de servicio? Esta acción no se puede deshacer.')) return;

        setIsAdvancing(true);
        setError(null);
        try {
            const { error: deleteError } = await supabase
                .from('ordenes_servicio')
                .delete()
                .eq('id', orden.id);

            if (deleteError) throw deleteError;

            if (onUpdate) onUpdate();
            onClose();
        } catch (err: any) {
            console.error('Error deleting orden:', err);
            setError(`Error al eliminar: ${err.message}`);
        } finally {
            setIsAdvancing(false);
        }
    };

    // Filter phases: Technical role doesn't see 'comercial' nor 'administrativa' phases
    const visiblePhases = useMemo(() => {
        if (isTecnico && !isAdmin) {
            return ORDEN_PHASES.filter(p => p.id !== 'comercial' && p.id !== 'administrativa');
        }
        return ORDEN_PHASES;
    }, [isTecnico, isAdmin]);

    return (
        <AnimatePresence>
            {orden && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-retarder-gray-200">
                            <div className="flex items-center gap-3">
                                <span className="font-mono text-lg font-bold text-retarder-red">
                                    {orden.numero}
                                </span>
                                <span className={cn(
                                    'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase',
                                    PRIORIDAD_COLORS[orden.prioridad],
                                )}>
                                    {PRIORIDAD_LABELS[orden.prioridad]}
                                </span>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-retarder-gray-100 transition-colors"
                            >
                                <X size={18} className="text-retarder-gray-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                            {/* Current Status */}
                            <div>
                                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-2">
                                    Estado Actual
                                </h3>
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        'w-3 h-3 rounded-full',
                                        ORDEN_ESTADO_COLORS[orden.estado],
                                    )} />
                                    <span className="text-sm font-bold text-retarder-gray-800">
                                        {ORDEN_ESTADO_LABELS[orden.estado]}
                                    </span>
                                    <span className={cn(
                                        'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                                        getPhaseForEstado(orden.estado).bgLight,
                                        getPhaseForEstado(orden.estado).textColor,
                                    )}>
                                        {getPhaseForEstado(orden.estado).label}
                                    </span>
                                </div>
                            </div>

                            {/* Info Fields */}
                            <div className="grid grid-cols-2 gap-4">
                                <InfoField
                                    icon={<Building2 size={14} />}
                                    label="Empresa"
                                    value={orden.empresa}
                                />
                                <InfoField
                                    icon={<Wrench size={14} />}
                                    label="Tipo de Servicio"
                                    value={TIPO_SERVICIO_LABELS[orden.tipo]}
                                />
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-retarder-gray-400">
                                        <User size={14} />
                                        <span className="text-[10px] font-semibold uppercase tracking-wide">Técnico</span>
                                    </div>
                                    {(orden.estado === 'asignacion_tecnico' || !localTecnico || orden.estado === 'cotizacion_aceptada') ? (
                                        <div className="relative pl-5">
                                            <select
                                                value={localTecnico}
                                                onChange={(e) => handleUpdateTecnico(e.target.value)}
                                                disabled={isUpdatingTecnico}
                                                className={cn(
                                                    "w-full bg-retarder-gray-50 border rounded-lg px-2 py-1.5 text-xs font-medium text-retarder-gray-800 focus:border-retarder-red outline-none appearance-none cursor-pointer",
                                                    !localTecnico ? "border-retarder-red/50 bg-red-50/50 animate-pulse" : "border-retarder-gray-200"
                                                )}
                                            >
                                                <option value="">⚠️ Seleccionar técnico...</option>
                                                {TECNICOS.map(t => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </select>
                                            {isUpdatingTecnico && (
                                                <div className="absolute right-2 top-1.5">
                                                    <Loader2 size={12} className="animate-spin text-retarder-red" />
                                                </div>
                                            )}
                                            {(!localTecnico && (orden.estado === 'cotizacion_aceptada' || getPhaseForEstado(orden.estado).id !== 'comercial')) && (
                                                <p className="text-[9px] text-retarder-red font-bold mt-1">Requerido para avanzar al servicio</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 pl-5">
                                            <p className="text-sm font-medium text-retarder-gray-800">{localTecnico}</p>
                                            {isAdmin && (
                                                <button
                                                    onClick={() => setLocalTecnico('')}
                                                    className="text-[9px] text-retarder-red font-bold hover:underline"
                                                >
                                                    Cambiar
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <InfoField
                                    icon={<User size={14} />}
                                    label="Vendedor"
                                    value={orden.vendedor}
                                />
                                <InfoField
                                    icon={<CalendarDays size={14} />}
                                    label="Fecha Creación"
                                    value={formatDate(orden.fecha_creado)}
                                />
                                <InfoField
                                    icon={<DollarSign size={14} />}
                                    label="Monto"
                                    value={orden.monto ? formatMXN(orden.monto) : 'Pendiente'}
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-2">
                                    Descripción
                                </h3>
                                <div className="bg-retarder-gray-50 rounded-xl p-4">
                                    <p className="text-sm text-retarder-gray-700 leading-relaxed">
                                        {orden.descripcion}
                                    </p>
                                </div>
                            </div>

                            {/* Linked Quotation */}
                            {orden.cotizacion_numero && (
                                <div>
                                    <h3 className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-2">
                                        Cotización Vinculada
                                    </h3>
                                    <Link
                                        href="/cotizaciones"
                                        className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl group/link hover:bg-blue-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                                                <FileText size={16} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-blue-900 leading-tight">
                                                    {orden.cotizacion_numero}
                                                </p>
                                                <p className="text-[10px] text-blue-600">
                                                    Ver detalles de cotización
                                                </p>
                                            </div>
                                        </div>
                                        <ArrowRight size={14} className="text-blue-400 group-hover/link:translate-x-0.5 transition-transform" />
                                    </Link>
                                </div>
                            )}

                            {/* Orden de Servicio Física (Técnico) */}
                            <div>
                                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-2">
                                    <ClipboardList size={12} className="inline mr-1" />
                                    Orden de Servicio Física
                                </h3>
                                <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-4 space-y-3">
                                    <p className="text-[10px] text-amber-700 font-medium">
                                        El técnico captura el número de la orden impresa y sube la foto del documento.
                                    </p>

                                    {/* Número de orden física */}
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-1 block">Nº Orden Física (Papel)</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Ej: OS-PAPEL-0042"
                                                value={numeroOrdenFisica}
                                                onChange={(e) => { setNumeroOrdenFisica(e.target.value); setNumeroSaved(false); }}
                                                className="flex-1 bg-white border border-amber-200 rounded-lg px-3 py-2 text-sm font-mono font-bold text-retarder-gray-800 focus:border-retarder-red focus:ring-2 focus:ring-retarder-red/10 outline-none placeholder:text-retarder-gray-300"
                                            />
                                            <button
                                                onClick={async () => {
                                                    if (!orden || !numeroOrdenFisica.trim()) return;
                                                    setIsSavingNumero(true);
                                                    try {
                                                        const { error: saveErr } = await supabase
                                                            .from('ordenes_servicio')
                                                            .update({ numero_orden_fisica: numeroOrdenFisica.trim() })
                                                            .eq('id', orden.id);
                                                        if (saveErr) throw saveErr;
                                                        setNumeroSaved(true);
                                                        if (onUpdate) onUpdate();
                                                    } catch (err: any) {
                                                        setError(`Error al guardar número: ${err.message}`);
                                                    } finally {
                                                        setIsSavingNumero(false);
                                                    }
                                                }}
                                                disabled={isSavingNumero || !numeroOrdenFisica.trim()}
                                                className={cn(
                                                    "px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 shrink-0",
                                                    numeroSaved ? "bg-emerald-500 text-white" :
                                                        "bg-amber-600 text-white hover:bg-amber-700 shadow-md"
                                                )}
                                            >
                                                {isSavingNumero ? <Loader2 size={12} className="animate-spin" /> :
                                                    numeroSaved ? <FileCheck size={12} /> : <Save size={12} />}
                                                {numeroSaved ? 'Guardado' : 'Guardar'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Upload foto de orden física */}
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-1 block">Foto de la Orden Impresa</label>
                                        <label className={cn(
                                            "flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-amber-300 bg-white hover:border-retarder-red hover:bg-retarder-red/5 transition-all cursor-pointer",
                                            isUploading && "opacity-50 cursor-not-allowed"
                                        )}>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                capture="environment"
                                                onChange={(e) => handleFileUpload(e, 'foto_antes')}
                                                disabled={isUploading}
                                            />
                                            <Camera size={18} className="text-amber-600" />
                                            <span className="text-xs font-bold text-amber-700">Tomar / Subir Foto de Orden</span>
                                        </label>
                                    </div>

                                    {/* Show uploaded order photos */}
                                    {evidencias.filter(e => e.descripcion?.includes('Antes') || e.tipo === 'foto_antes').length > 0 && (
                                        <div className="space-y-1.5">
                                            <p className="text-[9px] font-bold text-amber-800 uppercase">Fotos cargadas:</p>
                                            {evidencias.filter(e => e.tipo === 'foto_antes').map(e => (
                                                <a key={e.id} href={e.archivo_url} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center gap-2 p-2 bg-white rounded-lg border border-amber-100 hover:shadow-sm transition-shadow text-xs text-amber-900 font-medium">
                                                    <ImageIcon size={14} className="text-amber-500" />
                                                    <span className="truncate flex-1">{e.descripcion || 'Foto de orden'}</span>
                                                    <EyeIcon size={14} className="text-retarder-gray-400" />
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Attachments Section */}
                            <div>
                                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-2">
                                    Documentos y Fotos
                                </h3>
                                <div className="space-y-3">
                                    {/* Upload Buttons */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <label className={cn(
                                            "flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 border-dashed border-retarder-gray-200 hover:border-retarder-red hover:bg-retarder-red/5 transition-all cursor-pointer",
                                            isUploading && "opacity-50 cursor-not-allowed"
                                        )}>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept=".pdf,image/*"
                                                onChange={(e) => handleFileUpload(e, 'documento')}
                                                disabled={isUploading}
                                            />
                                            <Upload size={14} className="text-retarder-gray-400" />
                                            <span className="text-[10px] font-bold text-retarder-gray-600 uppercase">Añadir OC</span>
                                        </label>
                                        <label className={cn(
                                            "flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 border-dashed border-retarder-gray-200 hover:border-retarder-red hover:bg-retarder-red/5 transition-all cursor-pointer",
                                            isUploading && "opacity-50 cursor-not-allowed"
                                        )}>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                multiple
                                                onChange={(e) => handleFileUpload(e, 'foto_antes')}
                                                disabled={isUploading}
                                            />
                                            <ImageIcon size={14} className="text-retarder-gray-400" />
                                            <span className="text-[10px] font-bold text-retarder-gray-600 uppercase">Cargar Foto</span>
                                        </label>
                                    </div>

                                    {/* List of Attachments */}
                                    <div className="space-y-2">
                                        {isLoadingEvidencias ? (
                                            <div className="flex items-center justify-center py-4">
                                                <Loader2 size={20} className="animate-spin text-retarder-red" />
                                            </div>
                                        ) : evidencias.length === 0 ? (
                                            <div className="text-center py-4 bg-retarder-gray-50 rounded-xl">
                                                <p className="text-[10px] font-medium text-retarder-gray-400">Sin archivos adjuntos</p>
                                            </div>
                                        ) : (
                                            evidencias.map((e) => (
                                                <div key={e.id} className="flex items-center justify-between p-3 bg-white border border-retarder-gray-100 rounded-xl hover:shadow-sm transition-shadow">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-lg flex items-center justify-center",
                                                            e.tipo === 'documento' ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"
                                                        )}>
                                                            {e.tipo === 'documento' ? <FileText size={16} /> : <ImageIcon size={16} />}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-retarder-gray-800 line-clamp-1">{e.descripcion || 'Archivo'}</p>
                                                            <p className="text-[10px] text-retarder-gray-400 uppercase font-mono">{new Date(e.created_at).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <a
                                                        href={e.archivo_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 rounded-lg hover:bg-retarder-gray-100 text-retarder-gray-400 hover:text-retarder-red transition-colors"
                                                    >
                                                        <EyeIcon size={16} />
                                                    </a>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Satisfaction Survey Section */}
                            <div>
                                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-2">
                                    Satisfacción del Cliente
                                </h3>
                                <div className="bg-white border border-retarder-gray-200 rounded-xl p-4 space-y-3">
                                    {isLoadingSurvey ? (
                                        <div className="flex justify-center py-2">
                                            <Loader2 size={16} className="animate-spin text-retarder-red" />
                                        </div>
                                    ) : survey?.respondida ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-2 rounded-lg">
                                                <FileCheck size={16} />
                                                <span className="text-[10px] font-bold uppercase">Encuesta Respondida</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="text-center p-2 bg-retarder-gray-50 rounded-lg">
                                                    <p className="text-[8px] text-retarder-gray-400 uppercase">General</p>
                                                    <p className="font-bold text-retarder-black">{survey.calificacion_general}/10</p>
                                                </div>
                                                <div className="text-center p-2 bg-retarder-gray-50 rounded-lg">
                                                    <p className="text-[8px] text-retarder-gray-400 uppercase">Técnico</p>
                                                    <p className="font-bold text-retarder-black">{survey.calificacion_tecnico}/5</p>
                                                </div>
                                                <div className="text-center p-2 bg-retarder-gray-50 rounded-lg">
                                                    <p className="text-[8px] text-retarder-gray-400 uppercase">Tiempo</p>
                                                    <p className="font-bold text-retarder-black">{survey.calificacion_tiempo}/5</p>
                                                </div>
                                            </div>
                                            {survey.comentarios && (
                                                <p className="text-xs text-retarder-gray-600 italic">"{survey.comentarios}"</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <p className="text-xs text-retarder-gray-500">Genera y comparte este link con el cliente para que evalúe el servicio.</p>
                                            <div className="flex gap-2">
                                                <div className="flex-1 bg-retarder-gray-50 border border-retarder-gray-200 rounded-lg px-3 py-2 text-[10px] font-mono text-retarder-gray-400 truncate">
                                                    {survey ? `${window.location.origin}/encuesta/${survey.token_acceso}` : 'Generando...'}
                                                </div>
                                                <button
                                                    onClick={copySurveyLink}
                                                    disabled={!survey}
                                                    className={cn(
                                                        "px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all",
                                                        isCopied ? "bg-emerald-500 text-white" : "bg-retarder-black text-white hover:bg-retarder-gray-800"
                                                    )}
                                                >
                                                    {isCopied ? 'Copiado!' : 'Copiar'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Pipeline Timeline */}
                            <div>
                                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-3">
                                    Pipeline de Servicio
                                </h3>
                                <div className="space-y-0">
                                    {visiblePhases.map((phase) => (
                                        <div key={phase.id} className="relative">
                                            {/* Phase label */}
                                            <div className={cn(
                                                'text-[9px] font-bold uppercase tracking-wider pl-8 py-1',
                                                phase.textColor,
                                            )}>
                                                {phase.emoji} {phase.label}
                                            </div>

                                            {phase.estados.map((estado, idx) => {
                                                const currentIdx = ORDEN_ESTADOS.indexOf(orden.estado);
                                                const stepIdx = ORDEN_ESTADOS.indexOf(estado);
                                                const isCompleted = stepIdx < currentIdx;
                                                const isCurrent = estado === orden.estado;
                                                const isFuture = stepIdx > currentIdx;

                                                return (
                                                    <div key={estado} className="flex items-center gap-3 py-1.5 pl-2">
                                                        {/* Dot */}
                                                        <div className="relative flex items-center justify-center w-5">
                                                            {/* Connector line */}
                                                            {!(phase.id === 'comercial' && idx === 0) && (
                                                                <div className={cn(
                                                                    'absolute -top-3 w-0.5 h-3',
                                                                    isCompleted || isCurrent ? phase.dotColor : 'bg-retarder-gray-200',
                                                                )} />
                                                            )}
                                                            <div className={cn(
                                                                'w-3 h-3 rounded-full border-2 z-10',
                                                                isCurrent && `${phase.dotColor} border-white ring-2 ring-offset-1 ${phase.borderColor}`,
                                                                isCompleted && `${phase.dotColor} border-transparent`,
                                                                isFuture && 'bg-white border-retarder-gray-300',
                                                            )} />
                                                        </div>
                                                        <span className={cn(
                                                            'text-xs',
                                                            isCurrent && 'font-bold text-retarder-gray-800',
                                                            isCompleted && 'text-retarder-gray-500 line-through',
                                                            isFuture && 'text-retarder-gray-400',
                                                        )}>
                                                            {ORDEN_ESTADO_LABELS[estado]}
                                                        </span>
                                                        {isCurrent && (
                                                            <ArrowRight size={12} className={phase.textColor} />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-retarder-gray-200 px-6 py-4 bg-retarder-gray-50">
                            {error && (
                                <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-red-600 text-xs animate-pulse">
                                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                    <p className="font-bold">{error}</p>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <button
                                    onClick={handleAdvanceState}
                                    disabled={isAdvancing || ORDEN_ESTADOS.indexOf(orden.estado) === ORDEN_ESTADOS.length - 1}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md",
                                        isAdvancing ? "bg-retarder-gray-200 text-retarder-gray-500 cursor-not-allowed" :
                                            ORDEN_ESTADOS.indexOf(orden.estado) === ORDEN_ESTADOS.length - 1 ? "bg-retarder-gray-100 text-retarder-gray-400 cursor-not-allowed" :
                                                "bg-retarder-red text-white hover:bg-retarder-red-700 shadow-retarder-red/20"
                                    )}
                                >
                                    {isAdvancing ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <ArrowRight size={16} />
                                    )}
                                    {isAdvancing ? "Actualizando..." : ORDEN_ESTADOS.indexOf(orden.estado) === ORDEN_ESTADOS.length - 1 ? "Pipeline Completado" : "Avanzar Estado"}
                                </button>
                                <button className="px-4 py-2.5 border border-retarder-gray-200 rounded-xl text-sm font-medium text-retarder-gray-600 hover:bg-white transition-colors">
                                    <FileText size={16} />
                                </button>
                                {isAdmin && (
                                    <button
                                        onClick={handleDeleteOrden}
                                        disabled={isAdvancing}
                                        className="px-4 py-2.5 border border-retarder-gray-200 rounded-xl text-sm font-medium text-retarder-gray-400 hover:text-retarder-red hover:bg-retarder-red/5 transition-all"
                                        title="Eliminar Orden"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function InfoField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-retarder-gray-400">
                {icon}
                <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-sm font-medium text-retarder-gray-800 pl-5">{value}</p>
        </div>
    );
}
