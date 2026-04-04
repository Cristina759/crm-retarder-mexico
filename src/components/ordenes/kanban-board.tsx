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
    ORDEN_ESTADO_LABELS,
    type OrdenEstado,
    type DemoOrden,
} from '@/lib/utils/constants';
import { KanbanColumn } from './kanban-column';
import { KanbanCardOverlay } from './kanban-card';
import { toast, confirmModal, promptModal } from '@/lib/modals';

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

    const scrollRef = useRef<HTMLDivElement>(null);
    const topScrollRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const [innerWidth, setInnerWidth] = useState(0);
    const isSyncingRef = useRef(false);

    // Permisos de drag: administradores, directores, administración y vendedores
    const canDrag = ['admin', 'direccion', 'administracion', 'vendedor'].includes(userRole || '');

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

    // Medir ancho del contenido para el scrollbar superior
    useEffect(() => {
        if (!isMounted) return;
        const inner = innerRef.current;
        if (!inner) return;
        const ro = new ResizeObserver(() => setInnerWidth(inner.scrollWidth));
        ro.observe(inner);
        setInnerWidth(inner.scrollWidth);
        return () => ro.disconnect();
    }, [isMounted]);

    // Sincronizar scrollbar superior ↔ scrollbar inferior
    useEffect(() => {
        if (!isMounted) return;
        const main = scrollRef.current;
        const top = topScrollRef.current;
        if (!main || !top) return;
        const syncTop = () => { if (isSyncingRef.current) return; isSyncingRef.current = true; top.scrollLeft = main.scrollLeft; isSyncingRef.current = false; };
        const syncMain = () => { if (isSyncingRef.current) return; isSyncingRef.current = true; main.scrollLeft = top.scrollLeft; isSyncingRef.current = false; };
        main.addEventListener('scroll', syncTop, { passive: true });
        top.addEventListener('scroll', syncMain, { passive: true });
        return () => { main.removeEventListener('scroll', syncTop); top.removeEventListener('scroll', syncMain); };
    }, [isMounted]);

    // Wheel vertical → scroll horizontal (con preventDefault real, no-passive)
    useEffect(() => {
        if (!isMounted) return;
        const el = scrollRef.current;
        if (!el) return;

        const handleWheel = (e: WheelEvent) => {
            // Solo interceptar si el scroll es predominantemente vertical
            if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
            e.preventDefault();
            el.scrollLeft += e.deltaY;
        };

        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
    }, [isMounted]);

    const getOrdenesForEstado = useCallback(
        (estado: OrdenEstado) => ordenes
            .filter(o => o.estado === estado)
            .sort((a, b) => {
                // Ordenar por updated_at desc: la tarjeta recién movida queda arriba
                const dateA = (a as any).updated_at ? new Date((a as any).updated_at).getTime() : new Date(a.fecha_creado).getTime();
                const dateB = (b as any).updated_at ? new Date((b as any).updated_at).getTime() : new Date(b.fecha_creado).getTime();
                return dateB - dateA;
            }),
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
                const isPagado = estado === 'pagado';
                const updatePayload: Record<string, any> = {
                    estado,
                    updated_at: new Date().toISOString(),
                };
                if (isPagado) updatePayload.archivada = true;

                const { error } = await supabase
                    .from('ordenes_servicio')
                    .update(updatePayload)
                    .eq('id', id);

                if (error) {
                    toast.error('Error al guardar el cambio: ' + error.message);
                } else if (isPagado) {
                    toast.success('Orden marcada como Pagada y archivada del pipeline.');
                } else {
                    toast.success(`Estado actualizado: ${ORDEN_ESTADO_LABELS[estado]}`);
                }

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
            {/* Scrollbar superior sticky */}
            <div
                ref={topScrollRef}
                className="overflow-x-auto sticky top-0 z-20 bg-retarder-gray-50/90 backdrop-blur-sm border-b border-retarder-gray-200 mb-2"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db #f9fafb' }}
            >
                <div style={{ width: innerWidth || '100%', height: 10 }} />
            </div>

            {/* Kanban scrollable principal — scrollbar nativo oculto */}
            <div
                ref={scrollRef}
                className="overflow-x-auto pb-0 kanban-scroll"
                style={{ scrollbarWidth: 'none' }}
            >
                <div ref={innerRef} className="flex gap-0 min-w-max">
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
