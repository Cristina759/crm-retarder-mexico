'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    type OrdenEstado,
    type DemoOrden,
    type PhaseConfig,
    ORDEN_ESTADO_LABELS,
    ORDEN_ESTADO_COLORS,
} from '@/lib/utils/constants';
import { KanbanCard } from './kanban-card';

interface KanbanColumnProps {
    estado: OrdenEstado;
    ordenes: DemoOrden[];
    phase: PhaseConfig;
    index: number;
    onOrdenClick: (orden: DemoOrden) => void;
    onDelete: (id: string) => void;
}

export function KanbanColumn({ estado, ordenes, phase, index, onOrdenClick, onDelete }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: estado,
        data: { type: 'column', estado },
    });

    const ordenIds = ordenes.map(o => o.id);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.3 }}
            className="w-[260px] flex-shrink-0 flex flex-col"
        >
            {/* Column header */}
            <div className={cn(
                'rounded-t-xl px-3 py-2.5 border-t-[3px]',
                phase.borderColor,
            )}>
                <div className="flex items-center gap-2">
                    <div className={cn('w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm', ORDEN_ESTADO_COLORS[estado])} />
                    <h4 className="text-[11px] font-bold text-retarder-gray-700 truncate uppercase tracking-wide">
                        {ORDEN_ESTADO_LABELS[estado]}
                    </h4>
                    <span className={cn(
                        'ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center',
                        ordenes.length > 0
                            ? `${phase.bgColor} text-white`
                            : 'bg-retarder-gray-100 text-retarder-gray-400',
                    )}>
                        {ordenes.length}
                    </span>
                </div>
            </div>

            {/* Droppable zone */}
            <div
                ref={setNodeRef}
                className={cn(
                    'flex-1 rounded-b-xl px-2 py-2 space-y-2 min-h-[120px] transition-all duration-300 border border-t-0',
                    isOver
                        ? `${phase.bgLight} border-dashed ${phase.borderColor} shadow-inner`
                        : 'bg-retarder-gray-50/50 border-retarder-gray-100',
                )}
            >
                <SortableContext items={ordenIds} strategy={verticalListSortingStrategy}>
                    {ordenes.map(orden => (
                        <KanbanCard
                            key={orden.id}
                            orden={orden}
                            onClick={onOrdenClick}
                            onDelete={onDelete}
                        />
                    ))}
                </SortableContext>

                {/* Empty state */}
                {ordenes.length === 0 && (
                    <div className={cn(
                        'flex items-center justify-center h-20 rounded-lg border-2 border-dashed transition-colors',
                        isOver
                            ? `${phase.borderColor} ${phase.bgLight}`
                            : 'border-retarder-gray-200',
                    )}>
                        <p className="text-[10px] text-retarder-gray-400 font-medium">
                            {isOver ? 'Soltar aquí' : 'Sin órdenes'}
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
