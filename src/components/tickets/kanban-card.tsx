'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { GripVertical, Clock, Wrench, AlertTriangle, Trash2 } from 'lucide-react';
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
}

export function KanbanCard({ orden, onClick, onDelete, isDragOverlay }: KanbanCardProps) {
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
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(orden.id);
                    }}
                    className="absolute top-2 right-8 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-retarder-gray-400 hover:text-retarder-red hover:bg-retarder-red/5"
                    title="Eliminar Orden"
                >
                    <Trash2 size={14} />
                </button>
            )}

            {/* Orden number + Priority */}
            <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-retarder-red tracking-tight">
                    {orden.numero}
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

            {/* Company name */}
            <p className="text-sm font-semibold text-retarder-gray-800 truncate leading-tight">
                {orden.empresa}
            </p>

            {/* Description */}
            <p className="text-[11px] text-retarder-gray-500 truncate mt-1 leading-tight">
                {orden.descripcion}
            </p>

            {/* Meta row */}
            <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-retarder-gray-100">
                {/* Service type */}
                <div className="flex items-center gap-1">
                    <Wrench size={10} className="text-retarder-gray-400" />
                    <span className="text-[10px] text-retarder-gray-500">
                        {TIPO_SERVICIO_LABELS[orden.tipo]}
                    </span>
                </div>

                {/* Amount */}
                {orden.monto && (
                    <span className="text-[10px] font-semibold text-retarder-gray-600 ml-auto">
                        {formatMXN(orden.monto)}
                    </span>
                )}
            </div>

            {/* Tech + Seller */}
            {orden.tecnico && (
                <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1.5">
                        <div className={cn(
                            'w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold',
                            phase.dotColor,
                        )}>
                            {orden.tecnico.charAt(0)}
                        </div>
                        <span className="text-[10px] text-retarder-gray-500">{orden.tecnico}</span>
                    </div>
                </div>
            )}

            {/* Days indicator */}
            <div className="flex items-center gap-1 mt-1.5">
                <Clock size={9} className="text-retarder-gray-300" />
                <span className="text-[9px] text-retarder-gray-400">
                    {orden.fecha_creado}
                </span>
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
