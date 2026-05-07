'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { Trash2, GripVertical, LayoutList, Columns3, Loader2 } from 'lucide-react';
import {
  obtenerOportunidades,
  actualizarEstadoOportunidad,
  eliminarOportunidad,
} from '@/app/actions/oportunidades';
import type { OportunidadRow, OportunidadEstado } from '@/app/actions/types';
import { crearOrdenServicio } from '@/app/actions/ordenes';

// ── Configuración de estados ──────────────────────────────────────────────────
const ESTADOS: {
  id: OportunidadEstado;
  label: string;
  color: string;
  bg: string;
  border: string;
  text: string;
  prob: number;
}[] = [
  { id: 'lead',               label: 'Lead',               color: 'bg-gray-400',   bg: 'bg-gray-50',    border: 'border-gray-200',  text: 'text-gray-700',   prob: 10 },
  { id: 'calificacion',       label: 'Calificación',       color: 'bg-blue-500',   bg: 'bg-blue-50',    border: 'border-blue-200',  text: 'text-blue-700',   prob: 25 },
  { id: 'cotizacion_enviada', label: 'Cotización Enviada', color: 'bg-purple-500', bg: 'bg-purple-50',  border: 'border-purple-200',text: 'text-purple-700', prob: 40 },
  { id: 'seguimiento_activo', label: 'Seguimiento',        color: 'bg-orange-500', bg: 'bg-orange-50',  border: 'border-orange-200',text: 'text-orange-700', prob: 60 },
  { id: 'negociacion_cierre', label: 'Negociación',        color: 'bg-yellow-500', bg: 'bg-yellow-50',  border: 'border-yellow-200',text: 'text-yellow-800', prob: 80 },
  { id: 'ganado',             label: 'Ganado',             color: 'bg-green-500',  bg: 'bg-green-50',   border: 'border-green-200', text: 'text-green-700',  prob: 100 },
  { id: 'perdido',            label: 'Perdido',            color: 'bg-red-500',    bg: 'bg-red-50',     border: 'border-red-200',   text: 'text-red-700',    prob: 0 },
];

function formatMXN(n: number | null | undefined) {
  const value = n ?? 0;
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(value);
}

// ── Barra de progreso ─────────────────────────────────────────────────────────
function ProgressBar({ oportunidades }: { oportunidades: OportunidadRow[] }) {
  const total = oportunidades.filter(o => o.estado !== 'perdido').length || 1;
  return (
    <div className="flex rounded-full overflow-hidden h-2.5 w-full bg-gray-200">
      {ESTADOS.filter(e => e.id !== 'perdido').map(e => {
        const count = oportunidades.filter(o => o.estado === e.id).length;
        const pct = (count / total) * 100;
        return pct > 0 ? (
          <div key={e.id} title={`${e.label}: ${count}`}
            className={`${e.color} transition-all`}
            style={{ width: `${pct}%` }} />
        ) : null;
      })}
    </div>
  );
}

// ── Tarjeta draggable ─────────────────────────────────────────────────────────
function OppCard({
  opp,
  onDelete,
  deleting,
  overlay = false,
}: {
  opp: OportunidadRow;
  onDelete: (id: string) => void;
  deleting: boolean;
  overlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: opp.id });
  const estadoInfo = ESTADOS.find(e => e.id === opp.estado);

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      {...(overlay ? {} : { ...attributes, ...listeners })}
      className={`bg-white border border-gray-200 rounded-2xl p-3 shadow-sm select-none
        ${isDragging && !overlay ? 'opacity-30' : ''}
        ${overlay ? 'shadow-xl rotate-1 scale-105' : 'hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing'}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <GripVertical size={14} className="text-gray-300 flex-shrink-0" />
          <p className="font-semibold text-sm text-gray-900 truncate">{opp.empresas?.nombre_comercial ?? '—'}</p>
        </div>
        <button
          onClick={() => onDelete(opp.id)}
          disabled={deleting}
          className="p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
        >
          {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-1 pl-5 truncate">{opp.titulo}</p>

      <div className="flex items-center justify-between mt-2 pl-5">
        <span className="text-sm font-bold text-gray-800">{formatMXN(opp.monto_estimado)}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400">{opp.vendedor?.nombre ?? '—'}</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ${estadoInfo?.color}`}>
            {opp.probabilidad}%
          </span>
        </div>
      </div>

    </div>
  );
}

// ── Columna droppable ─────────────────────────────────────────────────────────
function KanbanColumn({
  estado,
  oportunidades,
  onDelete,
  deletingId,
}: {
  estado: typeof ESTADOS[number];
  oportunidades: OportunidadRow[];
  onDelete: (id: string) => void;
  deletingId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: estado.id });
  const monto = oportunidades.reduce((s, o) => s + (o.monto_estimado ?? 0), 0);

  return (
    <div className={`flex-shrink-0 w-60 flex flex-col rounded-2xl border ${estado.border} ${estado.bg} overflow-hidden`}>
      {/* Header */}
      <div className="px-3 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${estado.color}`} />
          <span className="text-xs font-bold text-gray-700">{estado.label}</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ${estado.color}`}>
            {oportunidades.length}
          </span>
        </div>
        <span className="text-[10px] font-semibold text-gray-500">{formatMXN(monto)}</span>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className={`flex-1 p-2 space-y-2 min-h-[120px] transition-colors ${isOver ? 'bg-white/60' : ''}`}
      >
        {oportunidades.map(opp => (
          <OppCard
            key={opp.id}
            opp={opp}
            onDelete={onDelete}
            deleting={deletingId === opp.id}
          />
        ))}
        {oportunidades.length === 0 && (
          <div className={`flex items-center justify-center h-16 rounded-xl border-2 border-dashed ${estado.border}`}>
            <p className="text-[11px] text-gray-300">Vacío</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Vista tabla ───────────────────────────────────────────────────────────────
function TablaView({
  oportunidades,
  onDelete,
  deletingId,
}: {
  oportunidades: OportunidadRow[];
  onDelete: (id: string) => void;
  deletingId: string | null;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
            <th className="px-4 py-3 text-left font-semibold">Empresa</th>
            <th className="px-4 py-3 text-left font-semibold">Título</th>
            <th className="px-4 py-3 text-left font-semibold">Estado</th>
            <th className="px-4 py-3 text-right font-semibold">Monto</th>
            <th className="px-4 py-3 text-right font-semibold">Prob.</th>
            <th className="px-4 py-3 text-left font-semibold">Vendedor</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {oportunidades.map(opp => {
            const e = ESTADOS.find(s => s.id === opp.estado);
            return (
              <tr key={opp.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{opp.empresas?.nombre_comercial ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{opp.titulo}</td>
                <td className="px-4 py-3">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full text-white ${e?.color}`}>
                    {e?.label ?? opp.estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatMXN(opp.monto_estimado)}</td>
                <td className="px-4 py-3 text-right text-gray-500">{opp.probabilidad}%</td>
                <td className="px-4 py-3 text-gray-500">{opp.vendedor?.nombre ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => onDelete(opp.id)} disabled={deletingId === opp.id}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors">
                    {deletingId === opp.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {oportunidades.length === 0 && (
        <div className="py-12 text-center text-gray-400 text-sm">Sin oportunidades</div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function OportunidadesPage() {
  const [oportunidades, setOportunidades] = useState<OportunidadRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeId,   setActiveId]   = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [view,       setView]       = useState<'kanban' | 'tabla'>('kanban');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const cargar = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Tiempo de espera agotado (30s)')), 30000)
      );
      
      const { data, error } = await Promise.race([
        obtenerOportunidades(),
        timeoutPromise as Promise<{ data: OportunidadRow[], error: string | null }>
      ]);

      if (error) {
        setFetchError(error);
      } else {
        setOportunidades(data || []);
      }
    } catch (err: any) {
      setFetchError(err.message || 'Error desconocido al cargar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const activeOpp = useMemo(
    () => oportunidades.find(o => o.id === activeId) ?? null,
    [activeId, oportunidades]
  );

  const totalMonto = useMemo(
    () => oportunidades.filter(o => o.estado !== 'perdido').reduce((s, o) => s + (o.monto_estimado ?? 0), 0),
    [oportunidades]
  );

  // ── Drag handlers ──
  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const opp = oportunidades.find(o => o.id === active.id);
    // over.id puede ser un estado (columna) o el id de otra tarjeta
    const nuevoEstado = ESTADOS.find(s => s.id === over.id)?.id
      ?? oportunidades.find(o => o.id === over.id)?.estado;

    if (!opp || !nuevoEstado || opp.estado === nuevoEstado) return;

    const estadoInfo  = ESTADOS.find(s => s.id === nuevoEstado)!;

    // Optimistic update
    setOportunidades(prev =>
      prev.map(o => o.id === opp.id
        ? { ...o, estado: nuevoEstado, probabilidad: estadoInfo.prob }
        : o
      )
    );

    const { error } = await actualizarEstadoOportunidad(opp.id, nuevoEstado, estadoInfo.prob);
    if (error) {
      console.error('[DragEnd] error:', error);
      // revertir
      setOportunidades(prev =>
        prev.map(o => o.id === opp.id ? { ...o, estado: opp.estado, probabilidad: opp.probabilidad } : o)
      );
      return;
    }

    // Si se movió a ganado → crear OS automáticamente
    if (nuevoEstado === 'ganado') {
      const { error: osError } = await crearOrdenServicio({
        numero:        `OPP-${opp.id.substring(0,8)}`,
        empresa_id:    opp.empresa_id,
        oportunidad_id: opp.id,
      });
      if (osError) console.error('[DragEnd] crear OS:', osError);
    }
  };

  // ── Eliminar ──
  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta oportunidad? Esta acción no se puede deshacer.')) return;
    setDeletingId(id);
    const { error } = await eliminarOportunidad(id);
    setDeletingId(null);
    if (error) { alert('Error: ' + error); return; }
    setOportunidades(prev => prev.filter(o => o.id !== id));
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-red-500" />
    </div>
  );

  if (fetchError) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <p className="text-red-600 font-semibold">Error al cargar oportunidades</p>
      <p className="text-sm text-gray-500 font-mono bg-gray-100 px-4 py-2 rounded-xl max-w-lg text-center">{fetchError}</p>
      <button onClick={cargar} className="mt-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold">
        Reintentar
      </button>
    </div>
  );

  return (
    <div className="space-y-4 pb-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline Comercial</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {oportunidades.length} oportunidades · {formatMXN(totalMonto)} en juego
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setView('kanban')}
            className={`p-2 rounded-xl transition-colors ${view === 'kanban' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            title="Vista kanban"
          >
            <Columns3 size={16} />
          </button>
          <button
            onClick={() => setView('tabla')}
            className={`p-2 rounded-xl transition-colors ${view === 'tabla' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            title="Vista tabla"
          >
            <LayoutList size={16} />
          </button>
        </div>
      </div>

      {/* ── Barra de progreso ── */}
      <ProgressBar oportunidades={oportunidades} />

      {/* ── Resumen por estado ── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {ESTADOS.map(e => {
          const count = oportunidades.filter(o => o.estado === e.id).length;
          return (
            <div key={e.id} className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${e.bg} ${e.text} border ${e.border}`}>
              <span className={`w-2 h-2 rounded-full ${e.color}`} />
              {e.label} {count > 0 && <span className="font-bold">{count}</span>}
            </div>
          );
        })}
      </div>

      {/* ── Kanban / Tabla ── */}
      {view === 'tabla' ? (
        <TablaView
          oportunidades={oportunidades}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActiveId(null)}>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-3 min-w-max">
              {ESTADOS.map(estado => (
                <KanbanColumn
                  key={estado.id}
                  estado={estado}
                  oportunidades={oportunidades.filter(o => o.estado === estado.id)}
                  onDelete={handleDelete}
                  deletingId={deletingId}
                />
              ))}
            </div>
          </div>

          <DragOverlay>
            {activeOpp && (
              <OppCard
                opp={activeOpp}
                onDelete={() => {}}
                deleting={false}
                overlay
              />
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
