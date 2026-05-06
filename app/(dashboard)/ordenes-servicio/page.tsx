'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { 
  DndContext, 
  DragOverlay, 
  PointerSensor, 
  TouchSensor, 
  closestCenter, 
  useSensor, 
  useSensors,
  type DragStartEvent,
  type DragEndEvent
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Loader2, AlertCircle, ClipboardList, Lock, History, GripVertical } from 'lucide-react';
import { obtenerOrdenes, obtenerOrdenesArchivadas, actualizarEstadoOS } from '@/app/actions/ordenes';
import type { OSRow, OSEstado } from '@/app/actions/types';

// ── Configuración del pipeline ────────────────────────────────────────────────
const FASES = [
  {
    id: 1, label: 'Fase Operativa', color: 'bg-blue-500', text: 'text-blue-700',
    bg: 'bg-blue-50', border: 'border-blue-300', headerBg: 'bg-blue-100',
  },
  {
    id: 2, label: 'Fase Cierre', color: 'bg-green-500', text: 'text-green-700',
    bg: 'bg-green-50', border: 'border-green-300', headerBg: 'bg-green-100',
  },
  {
    id: 3, label: 'Fase Administrativa', color: 'bg-orange-500', text: 'text-orange-700',
    bg: 'bg-orange-50', border: 'border-orange-300', headerBg: 'bg-orange-100',
  },
];

const COLUMNAS: { id: OSEstado; label: string; fase: number; dot: string }[] = [
  { id: 'solicitud_recibida',      label: 'Solicitud Recibida',     fase: 1, dot: 'bg-slate-400'  },
  { id: 'tecnico_asignado',        label: 'Asignación de Técnico',  fase: 1, dot: 'bg-blue-400'   },
  { id: 'servicio_programado',     label: 'Servicio Programado',    fase: 1, dot: 'bg-blue-500'   },
  { id: 'documentacion_enviada',   label: 'Documentación Enviada',  fase: 1, dot: 'bg-blue-500'   },
  { id: 'tecnico_en_contacto',     label: 'Técnico en Contacto',    fase: 1, dot: 'bg-blue-600'   },
  { id: 'servicio_en_proceso',     label: 'Servicio en Proceso',    fase: 1, dot: 'bg-blue-700'   },
  { id: 'autorizacion_adicional',  label: 'Autorización Adicional', fase: 2, dot: 'bg-green-400'  },
  { id: 'servicio_concluido',      label: 'Servicio Concluido',     fase: 2, dot: 'bg-green-500'  },
  { id: 'evidencia_cargada',       label: 'Evidencia Cargada',      fase: 2, dot: 'bg-green-600'  },
  { id: 'documentacion_entregada', label: 'Docs Entregada',         fase: 3, dot: 'bg-orange-400' },
  { id: 'encuesta_enviada',        label: 'Encuesta Enviada',       fase: 3, dot: 'bg-orange-500' },
  { id: 'facturado',               label: 'Facturado',              fase: 3, dot: 'bg-orange-600' },
  { id: 'pagado',                  label: 'Pagado',                 fase: 3, dot: 'bg-green-500'  },
];

const TOTAL = COLUMNAS.length;

function candadosCompletos(os: OSRow): boolean {
  return !!(os.tecnico_id && os.numero_os_manual && os.foto_os);
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
}

// ── Tarjeta Draggable ──────────────────────────────────────────────────────────
function OSCard({ os, onClick, esAdmin, overlay = false }: { os: OSRow; onClick: () => void; esAdmin: boolean; overlay?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: os.id });
  
  const idx    = COLUMNAS.findIndex(c => c.id === os.estado);
  const pct    = Math.round(((idx + 1) / TOTAL) * 100);
  const listo  = candadosCompletos(os);
  const col    = COLUMNAS.find(c => c.id === os.estado);

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      {...(overlay ? {} : { ...attributes, ...listeners })}
      onClick={onClick}
      className={`w-full text-left bg-white rounded-2xl border p-3.5 shadow-sm transition-all group select-none relative
        ${isDragging && !overlay ? 'opacity-20 grayscale' : 'hover:shadow-xl hover:border-blue-200 hover:-translate-y-0.5'}
        ${overlay ? 'shadow-2xl rotate-2 scale-105 border-blue-400 z-50 ring-4 ring-blue-50' : 'cursor-grab active:cursor-grabbing border-gray-100'}
      `}
    >
      {/* Indicador de Candado / Alerta (Solo para no-admin) */}
      {!esAdmin && !listo && os.estado === 'tecnico_asignado' && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg animate-bounce duration-1000 z-10 border-2 border-white">
          <Lock size={10} strokeWidth={3} />
        </div>
      )}

      {/* Header Tarjeta */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[9px] font-black tracking-tighter text-gray-400 uppercase bg-gray-50 px-1.5 py-0.5 rounded-lg border border-gray-100 font-mono">
          {os.numero}
        </span>
        <span className="text-[9px] font-bold text-gray-300">{fmtFecha(os.created_at)}</span>
      </div>

      {/* Cliente */}
      <h3 className="text-xs font-black text-[#0f2d55] leading-tight mb-1 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[2.5em]">
        {os.empresas?.nombre_comercial ?? 'Sin Cliente'}
      </h3>

      {/* Info Extra */}
      <div className="flex flex-col gap-1 mb-3">
        {os.numero_os_manual ? (
          <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
            <ClipboardList size={10} className="text-gray-300" />
            <span className="truncate">{os.numero_os_manual}</span>
          </div>
        ) : (
          <span className="text-[9px] text-red-400 font-bold uppercase italic">Falta O.S. Física</span>
        )}
      </div>

      {/* Footer con Progreso */}
      <div className="space-y-2 pt-2 border-t border-gray-50">
        <div className="flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-[#0f2d55] font-black text-[8px]">
              {os.tecnico?.nombre?.charAt(0) || '?'}
            </div>
            <span className="text-gray-500 font-semibold truncate max-w-[80px]">
              {os.tecnico?.nombre?.split(' ')[0] || <span className="text-red-300 italic">Sin técnico</span>}
            </span>
          </div>
          <span className={`font-black ${pct === 100 ? 'text-green-500' : 'text-blue-500'}`}>{pct}%</span>
        </div>
        
        {/* Progress Bar Mini */}
        <div className="h-1 rounded-full bg-gray-50 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-green-500' : col?.dot.replace('bg-', 'bg-') || 'bg-blue-400'}`} 
            style={{ width: `${pct}%` }} 
          />
        </div>
      </div>
    </div>
  );
}

// ── Columna Droppable ──────────────────────────────────────────────────────────
function Columna({ col, ordenes, onClick, esAdmin }: { col: any; ordenes: OSRow[]; onClick: (id: string) => void; esAdmin: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });

  return (
    <div className="flex-shrink-0 w-52 flex flex-col group/col">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${col.dot} shadow-sm`} />
        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-tight truncate">
          {col.label}
        </h4>
        <div className="ml-auto flex items-center justify-center bg-white border border-gray-100 text-[9px] font-black text-gray-400 w-5 h-5 rounded-lg shadow-sm">
          {ordenes.length}
        </div>
      </div>
      <div 
        ref={setNodeRef}
        className={`flex-1 space-y-3 min-h-[500px] rounded-2xl p-2.5 transition-all duration-300 border-2 border-transparent ${
          isOver ? 'bg-blue-50/60 border-blue-200 shadow-inner' : 'bg-gray-50/40 hover:bg-gray-50/80'
        }`}
      >
        {ordenes.map(os => (
          <OSCard key={os.id} os={os} esAdmin={esAdmin} onClick={() => onClick(os.id)} />
        ))}
        {ordenes.length === 0 && (
          <div className="h-24 rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center gap-2 grayscale opacity-40">
            <ClipboardList size={20} className="text-gray-300" />
            <span className="text-[9px] font-black uppercase tracking-tighter text-gray-400">Vacíó</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function OrdenesServicioPage() {
  const router = useRouter();
  const { user } = useUser();
  const rol = (user?.publicMetadata?.role as string) ?? '';
  const esAdmin = rol === 'admin';
  const [ordenes,    setOrdenes]    = useState<OSRow[]>([]);
  const [archivadas, setArchivadas] = useState<OSRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [vistaHistorial, setVistaHistorial] = useState(false);
  const [faseFilter, setFaseFilter] = useState<number | null>(null);
  const [activeId,   setActiveId]   = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const cargar = async () => {
    try {
      setError(null);
      const act = await obtenerOrdenes();
      if (act.error) setError(act.error);
      else setOrdenes(act.data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const cargarHistorial = async () => {
    if (archivadas.length > 0) return; // Ya cargado
    try {
      const arch = await obtenerOrdenesArchivadas();
      if (!arch.error) setArchivadas(arch.data);
    } catch (e) {
      console.error('Error al cargar historial:', e);
    }
  };

  useEffect(() => { cargar(); }, []);

  const columnasFiltradas = useMemo(() =>
    faseFilter ? COLUMNAS.filter(c => c.fase === faseFilter) : COLUMNAS,
    [faseFilter]
  );

  const countByFase = useMemo(() =>
    FASES.map(f => ({ ...f, count: ordenes.filter(o => COLUMNAS.find(c => c.id === o.estado)?.fase === f.id).length })),
    [ordenes]
  );

  const ir = (id: string) => router.push(`/ordenes-servicio/${id}`);

  const activeOS = useMemo(() => ordenes.find(o => o.id === activeId), [activeId, ordenes]);

  // ── Handlers de Drag ──
  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const os = ordenes.find(o => o.id === active.id);
    const nuevoEstado = COLUMNAS.find(c => c.id === over.id)?.id;

    if (!os || !nuevoEstado || os.estado === nuevoEstado) return;

    // ── CANDADO DE SEGURIDAD (Bypass para Admin) ──
    if (!esAdmin && os.estado === 'tecnico_asignado' && nuevoEstado !== 'tecnico_asignado') {
      const faltaTecnico = !os.tecnico_id;
      const faltaFoto    = !os.foto_os;
      const faltaManual  = !os.numero_os_manual;

      if (faltaTecnico || faltaFoto || faltaManual) {
        let msj = '🔒 CANDADO ACTIVO:\nPara avanzar esta orden, primero debes completar los siguientes requisitos:\n';
        if (faltaTecnico) msj += '\n• Asignar un técnico';
        if (faltaManual)  msj += '\n• Ingresar el número de O.S. manual';
        if (faltaFoto)    msj += '\n• Subir la foto de la orden de servicio';
        
        msj += '\n\nPor favor, haz clic en la tarjeta para completar estos datos.';
        alert(msj);
        return;
      }
    }


    // Actualización optimista
    setOrdenes(prev => prev.map(o => o.id === os.id ? { ...o, estado: nuevoEstado } : o));

    const { error: err } = await actualizarEstadoOS(os.id, nuevoEstado);
    if (err) {
      console.error('[DragEnd] Error:', err);
      // Revertir en caso de error
      setOrdenes(prev => prev.map(o => o.id === os.id ? { ...o, estado: os.estado } : o));
      alert('Error al mover la orden: ' + err);
      return;
    }

    // Si se movió a "pagado", recargamos para que desaparezca del pipeline activo
    if (nuevoEstado === 'pagado') {
      cargar();
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-red-500" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <AlertCircle className="w-8 h-8 text-red-500" />
      <p className="text-red-600 font-semibold">{error}</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full space-y-4 pb-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0f2d55] flex items-center justify-center">
            <ClipboardList size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[#0f2d55]">Pipeline de Órdenes de Servicio</h1>
            <p className="text-[11px] text-gray-400">
              {ordenes.length} orden{ordenes.length !== 1 ? 'es' : ''} en el pipeline · {COLUMNAS.length} estados · {FASES.length} fases
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            if (!vistaHistorial) cargarHistorial();
            setVistaHistorial(v => !v);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
            vistaHistorial
              ? 'bg-gray-800 text-white border-gray-800'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <History size={13} /> Historial {archivadas.length > 0 && `(${archivadas.length})`}
        </button>
      </div>

      {/* ── Filtros por fase ── */}
      {!vistaHistorial && (
        <div className="flex gap-2 flex-wrap flex-shrink-0">
          <button
            onClick={() => setFaseFilter(null)}
            className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-colors ${
              faseFilter === null ? 'bg-[#0f2d55] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            Todo ({ordenes.length})
          </button>
          {countByFase.map(f => (
            <button
              key={f.id}
              onClick={() => setFaseFilter(faseFilter === f.id ? null : f.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold border transition-colors ${
                faseFilter === f.id
                  ? `${f.color} text-white border-transparent`
                  : `${f.bg} ${f.text} ${f.border}`
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${faseFilter === f.id ? 'bg-white' : f.color}`} />
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      )}

      {/* ── Pipeline Kanban ── */}
      {!vistaHistorial ? (
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragStart={handleDragStart} 
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div className="overflow-x-auto flex-1 -mx-4 px-4">
            <div className="flex gap-0 min-w-max">
              {FASES.filter(f => !faseFilter || f.id === faseFilter).map((fase, fi) => {
                const cols = columnasFiltradas.filter(c => c.fase === fase.id);
                if (cols.length === 0) return null;
                return (
                  <div key={fase.id} className={`flex flex-col mr-4 last:mr-0`}>
                    {/* Header de fase */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-t-xl mb-3 ${fase.headerBg} border ${fase.border}`}>
                      <span className={`w-2 h-2 rounded-full ${fase.color}`} />
                      <span className={`text-[10px] font-black uppercase tracking-wider ${fase.text}`}>{fase.label}</span>
                      <span className={`ml-1 text-[10px] font-bold px-1.5 rounded-full text-white ${fase.color}`}>
                        {ordenes.filter(o => COLUMNAS.find(c => c.id === o.estado)?.fase === fase.id).length}
                      </span>
                    </div>
                    {/* Columnas de esta fase */}
                    <div className="flex gap-3">
                      {cols.map(col => (
                        <Columna
                          key={col.id}
                          col={col}
                          esAdmin={esAdmin}
                          ordenes={ordenes.filter(o => o.estado === col.id)}
                          onClick={ir}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DragOverlay>
            {activeOS && (
              <OSCard os={activeOS} esAdmin={esAdmin} overlay onClick={() => {}} />
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        /* ── Historial ── */
        <div className="flex-1 overflow-y-auto">
          {archivadas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <History size={40} className="opacity-30" />
              <p className="text-sm">No hay órdenes archivadas</p>
              <p className="text-xs">Las órdenes marcadas como <strong>Pagado</strong> aparecen aquí.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {archivadas.map(os => (
                <button
                  key={os.id}
                  onClick={() => ir(os.id)}
                  className="text-left bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all"
                >
                  <p className="font-mono text-xs font-bold text-gray-500">{os.numero}</p>
                  <p className="font-semibold text-sm text-gray-800 mt-0.5">{os.empresas?.nombre_comercial ?? '—'}</p>
                  {os.numero_os_manual && <p className="text-xs text-gray-400 mt-0.5">OS: {os.numero_os_manual}</p>}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50 text-xs text-gray-400">
                    <span>{os.tecnico?.nombre ?? '—'}</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold text-[10px]">Pagado</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
