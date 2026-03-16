'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { GripVertical, Clock, Wrench, AlertTriangle, Trash2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    type DemoOrden,
    PRIORIDAD_COLORS,
    TIPO_SERVICIO_LABELS,
    getPhaseForEstado,
} from '@/lib/utils/constants';
import { formatMXN } from '@/lib/utils';

interface KanbanCardProps {
    orden: DemoOrden;
    onClick: (orden: DemoOrden) => void;
    onDelete?: (id: string) => void;
    isDragOverlay?: boolean;
    confirmDeleteId?: string | null;
    isDeleting?: boolean;
}

export function KanbanCard({ orden, onClick, onDelete, isDragOverlay, confirmDeleteId, isDeleting }: KanbanCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: orden.id,
        data: { type: 'orden', orden },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const phase = getPhaseForEstado(orden.estado);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'group relative bg-white rounded-xl border border-retarder-gray-200 p-3.5 cursor-pointer transition-all duration-200',
                isDragging && 'opacity-40 scale-95',
                isDragOverlay && 'shadow-2xl shadow-black/20 rotate-2 scale-105 border-2',
                isDragOverlay && phase.borderColor,
                !isDragging && !isDragOverlay && 'hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5',
            )}
            onClick={() => !isDragging && onClick(orden)}
        >
            {/* Drag handle */}
            <div
                {...attributes}
                {...listeners}
                className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing hover:bg-retarder-gray-100"
            >
                <GripVertical size={14} className="text-retarder-gray-400" />
            </div>

            {/* Delete button (Admin only) */}
            {!isDragOverlay && onDelete && (
                <div className="absolute top-1.5 right-8 z-20 flex gap-1">
                    {confirmDeleteId === orden.id ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(orden.id);
                            }}
                            disabled={isDeleting}
                            className="flex items-center gap-1 px-1.5 py-0.5 bg-retarder-red text-white text-[9px] font-bold rounded shadow-md animate-pulse hover:bg-red-700 transition-colors"
                        >
                            <Trash2 size={10} />
                            {isDeleting ? '...' : '?'}
                        </button>
                    ) : (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(orden.id);
                            }}
                            className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-retarder-gray-400 hover:text-retarder-red hover:bg-retarder-red/5 bg-white shadow-sm"
                            title="Eliminar Orden"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            )}

            {/* Folio (Cotización) + Priority */}
            <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] font-bold text-retarder-gray-500 tracking-tight flex items-center gap-1">
                    <FileText size={10} className="text-retarder-red" />
                    {orden.cotizacion_numero || 'S/F'}
                </span>
                <span
                    className={cn(
                        'text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide',
                        PRIORIDAD_COLORS[orden.prioridad],
                    )}
                >
                    {orden.prioridad === 'urgente' && (
                        <AlertTriangle size={8} className="inline mr-0.5 -mt-px" />
                    )}
                    {orden.prioridad}
                </span>
            </div>

            {/* Service Order Number (Manual) */}
            {orden.numero && (
                <p className="text-[10px] font-bold text-retarder-red mb-1">
                    OS: {orden.numero}
                </p>
            )}

            {/* Company name */}
            <p className="text-sm font-semibold text-retarder-gray-800 truncate leading-tight">
                {orden.empresa}
            </p>

            {/* Tech */}
            <div className="flex items-center gap-1.5 mt-2">
                <div className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold',
                    phase.dotColor,
                )}>
                    {orden.tecnico ? orden.tecnico.charAt(0) : '?'}
                </div>
                <span className="text-[10px] text-retarder-gray-500 truncate">{orden.tecnico || 'Sin técnico'}</span>
            </div>

            {/* Amount + Date */}
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-retarder-gray-100">
                <div className="flex items-center gap-1">
                    <Clock size={10} className="text-retarder-gray-300" />
                    <span className="text-[9px] text-retarder-gray-400">
                        {orden.fecha_creado}
                    </span>
                </div>
                {orden.monto && (
                    <span className="text-[10px] font-bold text-retarder-black">
                        {formatMXN(orden.monto)}
                    </span>
                )}
            </div>
        </div>
    );
}

/** Minimal version used in the DragOverlay */
export function KanbanCardOverlay({ orden }: { orden: DemoOrden }) {
    const phase = getPhaseForEstado(orden.estado);

    return (
        <motion.div
            initial={{ scale: 1, rotate: 0 }}
            animate={{ scale: 1.05, rotate: 2 }}
            className={cn(
                'w-60 bg-white rounded-xl border-2 p-3.5 shadow-2xl shadow-black/25 pointer-events-none',
                phase.borderColor,
            )}
        >
            <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-retarder-red">{orden.numero}</span>
                <span className={cn(
                    'text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase',
                    PRIORIDAD_COLORS[orden.prioridad],
                )}>
                    {orden.prioridad}
                </span>
            </div>
            <p className="text-sm font-semibold text-retarder-gray-800 truncate">{orden.empresa}</p>
            <p className="text-[11px] text-retarder-gray-500 truncate mt-1">{orden.descripcion}</p>
        </motion.div>
    );
}
