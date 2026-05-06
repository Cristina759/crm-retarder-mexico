'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, ClipboardList, Lock, History } from 'lucide-react';
import { obtenerOrdenes, obtenerOrdenesArchivadas } from '@/app/actions/ordenes';
import type { OSRow } from '@/app/actions/types';

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

const COLUMNAS = [
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

// ── Tarjeta ───────────────────────────────────────────────────────────────────
function OSCard({ os, onClick }: { os: OSRow; onClick: () => void }) {
  const idx    = COLUMNAS.findIndex(c => c.id === os.estado);
  const pct    = Math.round(((idx + 1) / TOTAL) * 100);
  const listo  = candadosCompletos(os);
  const col    = COLUMNAS.find(c => c.id === os.estado);

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl border border-gray-200 p-3 shadow-sm hover:shadow-md hover:border-gray-300 transition-all group text-[11px]"
    >
      <div className="flex items-start justify-between gap-1 mb-1.5">
        <span className="font-mono font-bold text-[#0f2d55] text-[10px]">{os.numero}</span>
        {!listo && os.estado === 'tecnico_asignado' && (
          <Lock size={10} className="text-amber-500 flex-shrink-0 mt-0.5" />
        )}
      </div>
      <p className="font-semibold text-gray-800 leading-tight truncate mb-1">
        {os.empresas?.nombre_comercial ?? '—'}
      </p>
      {os.numero_os_manual && (
        <p className="text-[10px] text-gray-400 truncate mb-1">OS: {os.numero_os_manual}</p>
      )}
      <div className="h-1 rounded-full bg-gray-100 overflow-hidden mb-1.5">
        <div className={`h-full rounded-full ${col?.dot ?? 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center justify-between text-[10px] text-gray-400">
        <span className="truncate max-w-[80px]">{os.tecnico?.nombre ?? <span className="italic">Sin técnico</span>}</span>
        <span>{fmtFecha(os.created_at)}</span>
      </div>
    </button>
  );
}

// ── Columna ───────────────────────────────────────────────────────────────────
function Columna({ col, ordenes, onClick }: {
  col: typeof COLUMNAS[number];
  ordenes: OSRow[];
  onClick: (id: string) => void;
}) {
  return (
    <div className="flex-shrink-0 w-44 flex flex-col">
      <div className="flex items-center gap-1.5 mb-2 px-0.5">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${col.dot}`} />
        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide leading-tight">{col.label}</span>
        <span className="ml-auto text-[10px] font-bold text-gray-400 bg-gray-100 rounded-full px-1.5">{ordenes.length}</span>
      </div>
      <div className="flex-1 space-y-2 min-h-[80px]">
        {ordenes.map(os => (
          <OSCard key={os.id} os={os} onClick={() => onClick(os.id)} />
        ))}
        {ordenes.length === 0 && (
          <div className="h-12 rounded-xl border-2 border-dashed border-gray-150 flex items-center justify-center">
            <span className="text-[10px] text-gray-300">Sin órdenes</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function OrdenesServicioPage() {
  const router = useRouter();
  const [ordenes,    setOrdenes]    = useState<OSRow[]>([]);
  const [archivadas, setArchivadas] = useState<OSRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [vistaHistorial, setVistaHistorial] = useState(false);
  const [faseFilter, setFaseFilter] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([obtenerOrdenes(), obtenerOrdenesArchivadas()])
      .then(([act, arch]) => {
        if (act.error) setError(act.error);
        else { setOrdenes(act.data); setArchivadas(arch.data); }
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const columnasFiltradas = useMemo(() =>
    faseFilter ? COLUMNAS.filter(c => c.fase === faseFilter) : COLUMNAS,
    [faseFilter]
  );

  const countByFase = useMemo(() =>
    FASES.map(f => ({ ...f, count: ordenes.filter(o => COLUMNAS.find(c => c.id === o.estado)?.fase === f.id).length })),
    [ordenes]
  );

  const ir = (id: string) => router.push(`/ordenes-servicio/${id}`);

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
          onClick={() => setVistaHistorial(v => !v)}
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
                        ordenes={ordenes.filter(o => o.estado === col.id)}
                        onClick={ir}
                      />
                    ))}
                  </div>
                  {/* Separador vertical entre fases */}
                  {fi < FASES.filter(f => !faseFilter || f.id === faseFilter).length - 1 && (
                    <div className="absolute" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
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
