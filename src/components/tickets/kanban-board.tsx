'use client';

import { useState, useCallback, useMemo } from 'react';
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
import { arrayMove } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import {
    ORDEN_ESTADOS,
    ORDEN_PHASES,
    type OrdenEstado,
    type DemoOrden,
    getPhaseForEstado,
} from '@/lib/utils/constants';
import { KanbanColumn } from './kanban-column';
import { KanbanCardOverlay } from './kanban-card';
import { useRole } from '@/hooks/useRole';

interface KanbanBoardProps {
    ordenes: DemoOrden[];
    onOrdenesChange: (ordenes: DemoOrden[]) => void;
    onOrdenClick: (orden: DemoOrden) => void;
    onDelete: (id: string) => void;
}

export function KanbanBoard({ ordenes, onOrdenesChange, onOrdenClick, onDelete }: KanbanBoardProps) {
    const [activeOrden, setActiveOrden] = useState<DemoOrden | null>(null);
    const { isTecnico, isAdmin } = useRole();

    // Filter phases: Technical role doesn't see 'comercial' nor 'administrativa' phases
    const visiblePhases = useMemo(() => {
        if (isTecnico && !isAdmin) {
            return ORDEN_PHASES.filter(p => p.id !== 'comercial' && p.id !== 'administrativa');
        }
        return ORDEN_PHASES;
    }, [isTecnico, isAdmin]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
    );

    const getOrdenesForEstado = useCallback(
        (estado: OrdenEstado) => ordenes.filter(o => o.estado === estado),
        [ordenes],
    );

    const handleDragStart = useCallback((event: DragStartEvent) => {
        const { active } = event;
        const orden = ordenes.find(o => o.id === active.id);
        if (orden) setActiveOrden(orden);
    }, [ordenes]);

    const handleDragOver = useCallback((event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        const activeOrden = ordenes.find(o => o.id === activeId);
        if (!activeOrden) return;

        // Check if dropping over a column
        const isOverColumn = ORDEN_ESTADOS.includes(overId as OrdenEstado);
        // Check if dropping over another orden
        const overOrden = ordenes.find(o => o.id === overId);

        let newEstado: OrdenEstado | null = null;

        if (isOverColumn) {
            newEstado = overId as OrdenEstado;
        } else if (overOrden) {
            newEstado = overOrden.estado;
        }

        if (newEstado && newEstado !== activeOrden.estado) {
            const updated = ordenes.map(o =>
                o.id === activeId ? { ...o, estado: newEstado! } : o
            );
            onOrdenesChange(updated);
        }
    }, [ordenes, onOrdenesChange]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        setActiveOrden(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Same item — reorder within column
        if (activeId !== overId) {
            const activeOrden = ordenes.find(o => o.id === activeId);
            const overOrden = ordenes.find(o => o.id === overId);

            if (activeOrden && overOrden && activeOrden.estado === overOrden.estado) {
                const columnOrdenes = ordenes.filter(o => o.estado === activeOrden.estado);
                const oldIndex = columnOrdenes.findIndex(o => o.id === activeId);
                const newIndex = columnOrdenes.findIndex(o => o.id === overId);

                if (oldIndex !== -1 && newIndex !== -1) {
                    const reordered = arrayMove(columnOrdenes, oldIndex, newIndex);
                    const otherOrdenes = ordenes.filter(o => o.estado !== activeOrden.estado);
                    onOrdenesChange([...otherOrdenes, ...reordered]);
                }
            }
        }
    }, [ordenes, onOrdenesChange]);

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
                    {visiblePhases.map((phase) => (
                        <div key={phase.id} className="flex flex-col">
                            {/* Phase header */}
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
                                    {phase.estados.reduce((acc, e) => acc + getOrdenesForEstado(e).length, 0)}
                                </span>
                            </div>

                            {/* Columns for this phase */}
                            <div className="flex gap-2 px-1">
                                {phase.estados.map((estado, idx) => (
                                    <KanbanColumn
                                        key={estado}
                                        estado={estado}
                                        ordenes={getOrdenesForEstado(estado)}
                                        phase={phase}
                                        index={ORDEN_ESTADOS.indexOf(estado)}
                                        onOrdenClick={onOrdenClick}
                                        onDelete={onDelete}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Drag Overlay */}
            <DragOverlay dropAnimation={{
                duration: 200,
                easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            }}>
                {activeOrden ? <KanbanCardOverlay orden={activeOrden} /> : null}
            </DragOverlay>
        </DndContext>
    );
}
