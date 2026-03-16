'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
    type DragStartEvent,
    type DragEndEvent,
    type DragOverEvent,
} from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import {
    ORDEN_ESTADOS,
    ORDEN_PHASES,
    type OrdenEstado,
    type DemoOrden,
} from '@/lib/utils/constants';
import { KanbanColumn } from './kanban-column';
import { KanbanCardOverlay } from './kanban-card';

interface KanbanBoardProps {
    ordenes: DemoOrden[];
    onOrdenesChange: (ordenes: DemoOrden[]) => void;
    onOrdenClick: (orden: DemoOrden) => void;
    onDelete: (id: string) => void;
    confirmDeleteId?: string | null;
    isDeleting?: boolean;
    onRefresh: () => void;
    userRole?: string;
}

const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export function KanbanBoard({
    ordenes,
    onOrdenClick,
    onDelete,
    confirmDeleteId,
    isDeleting,
    onRefresh,
    userRole
}: KanbanBoardProps) {
    const supabase = createClient();
    const [activeOrden, setActiveOrden] = useState<DemoOrden | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    // Permisos de drag: solo director y administradora
    const canDrag = userRole === 'director' || userRole === 'administradora';

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
    );

    // Track del cambio pendiente durante el drag
    const pendingEstadoChange = useRef<{ id: string; estado: OrdenEstado } | null>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const getOrdenesForEstado = useCallback(
        (estado: OrdenEstado) => ordenes.filter(o => o.estado === estado),
        [ordenes],
    );

    const handleDragStart = useCallback((event: DragStartEvent) => {
        if (!canDrag) return;
        const { active } = event;
        const orden = ordenes.find(o => o.id === active.id);
        if (orden) setActiveOrden(orden);
        pendingEstadoChange.current = null;
    }, [ordenes, canDrag]);

    const handleDragOver = useCallback((event: DragOverEvent) => {
        if (!canDrag) return;
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        const activeOrden = ordenes.find(o => o.id === activeId);
        if (!activeOrden) return;

        const isOverColumn = ORDEN_ESTADOS.includes(overId as OrdenEstado);
        const overOrden = ordenes.find(o => o.id === overId);

        let newEstado: OrdenEstado | null = null;
        if (isOverColumn) {
            newEstado = overId as OrdenEstado;
        } else if (overOrden) {
            newEstado = overOrden.estado;
        }

        if (newEstado && newEstado !== activeOrden.estado) {
            pendingEstadoChange.current = { id: activeId, estado: newEstado };
        }
    }, [ordenes, canDrag]);

    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        if (!canDrag) return;
        setActiveOrden(null);

        if (pendingEstadoChange.current) {
            const { id, estado } = pendingEstadoChange.current;
            pendingEstadoChange.current = null;

            if (isValidUUID(id)) {
                const { error } = await supabase
                    .from('ordenes_servicio')
                    .update({ estado })
                    .eq('id', id);

                if (error) {
                    console.error('Error al actualizar estado:', error);
                    alert('Error al guardar el cambio: ' + error.message);
                }
                
                // Siempre refrescamos desde Supabase para mantener la sincronía
                onRefresh();
            }
        }
    }, [supabase, onRefresh, canDrag]);

    if (!isMounted) return null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="overflow-x-auto pb-4 kanban-scroll">
                <div className="flex gap-0 min-w-max">
                    {ORDEN_PHASES.map((phase) => (
                        <div key={phase.id} className="flex flex-col">
                            {/* Encabezado de Fase */}
                            <div className={cn(
                                'flex items-center gap-2 px-3 py-2 mb-2 rounded-lg mx-1',
                                phase.bgLight,
                            )}>
                                <span className="text-sm">{phase.emoji}</span>
                                <span className={cn('text-[11px] font-bold uppercase tracking-wider', phase.textColor)}>
                                    {phase.label}
                                </span>
                                <span className={cn(
                                    'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                                    phase.bgColor, 'text-white',
                                )}>
                                    {phase.estados.reduce((acc, e) => acc + getOrdenesForEstado(e as OrdenEstado).length, 0)}
                                </span>
                            </div>

                            {/* Columnas de la Fase */}
                            <div className="flex gap-2 px-1">
                                {phase.estados.map((estado) => (
                                    <KanbanColumn
                                        key={estado}
                                        estado={estado as OrdenEstado}
                                        ordenes={getOrdenesForEstado(estado as OrdenEstado)}
                                        phase={phase}
                                        index={ORDEN_ESTADOS.indexOf(estado as OrdenEstado)}
                                        onOrdenClick={onOrdenClick}
                                        onDelete={onDelete}
                                        confirmDeleteId={confirmDeleteId}
                                        isDeleting={isDeleting}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <DragOverlay>
                {activeOrden ? <KanbanCardOverlay orden={activeOrden} /> : null}
            </DragOverlay>
        </DndContext>
    );
}
