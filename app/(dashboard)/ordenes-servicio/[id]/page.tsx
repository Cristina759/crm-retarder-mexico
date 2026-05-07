'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import {
  Loader2, AlertCircle, ChevronLeft, ChevronRight,
  Camera, Trash2, Check, X, Pen, Lock, Unlock, ShoppingCart, Receipt, Eye
} from 'lucide-react';

import SignaturePad from 'signature_pad';
import {
  obtenerOrdenPorId,
  avanzarEstadoOS,
  asignarTecnicoOS,
  actualizarNotasOS,
  guardarFotosOS,
  guardarFirmaOS,
  actualizarDescripcionOS,
  guardarDatosOS,
  guardarOrdenCompra,
  eliminarOrdenServicio
} from '@/app/actions/ordenes';
import { obtenerCotizacionPorId } from '@/app/actions/cotizaciones';
import { obtenerUsuarios } from '@/app/actions/usuarios';
import type { OSRow, UsuarioRow, CotizacionRow } from '@/app/actions/types';

const OS_ESTADOS = [
  'tecnico_asignado',
  'servicio_programado',
  'documentacion_enviada',
  'tecnico_en_contacto',
  'servicio_en_proceso',
  'autorizacion_adicional',
  'servicio_concluido',
  'evidencia_cargada',
  'documentacion_entregada',
  'encuesta_enviada',
  'facturado',
  'pagado',
] as const;

// ── Metadata de estados ───────────────────────────────────────────────────────
const ESTADO_META: Record<string, { label: string; fase: number }> = {
  tecnico_asignado:        { label: 'Asignación de Técnico',  fase: 1 },
  servicio_programado:     { label: 'Servicio Programado',    fase: 1 },
  documentacion_enviada:   { label: 'Documentación Enviada',  fase: 1 },
  tecnico_en_contacto:     { label: 'Técnico en Contacto',    fase: 1 },
  servicio_en_proceso:     { label: 'Servicio en Proceso',    fase: 1 },
  autorizacion_adicional:  { label: 'Autorización Adicional', fase: 2 },
  servicio_concluido:      { label: 'Servicio Concluido',     fase: 2 },
  evidencia_cargada:       { label: 'Evidencia Cargada',      fase: 2 },
  documentacion_entregada: { label: 'Docs Entregada',         fase: 3 },
  encuesta_enviada:        { label: 'Encuesta Enviada',       fase: 3 },
  facturado:               { label: 'Facturado',              fase: 3 },
  pagado:                  { label: 'Pagado',                 fase: 3 },
};

const FASE_LABELS = ['', 'Operativa', 'Cierre', 'Administrativa'];
const OS_TOTAL = OS_ESTADOS.length;

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Timeline ──────────────────────────────────────────────────────────────────
function Timeline({ estado }: { estado: string }) {
  const estados = Object.keys(ESTADO_META);
  const currentIdx = estados.indexOf(estado);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-4">Progreso</p>

      {/* Fases */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[1, 2, 3, 4].map(fase => {
          const faseEstados = estados.filter(e => ESTADO_META[e]?.fase === fase);
          const faseIdx     = faseEstados.map(e => estados.indexOf(e));
          const completada  = faseIdx.every(i => i <= currentIdx);
          const activa      = faseIdx.some(i => i === currentIdx);

          return (
            <div key={fase} className={`rounded-xl px-2 py-1.5 text-center ${
              completada ? 'bg-yellow-400' : activa ? 'bg-yellow-100 ring-2 ring-yellow-400' : 'bg-gray-100'
            }`}>
              <p className={`text-[9px] font-bold uppercase tracking-wide ${completada ? 'text-yellow-900' : 'text-gray-500'}`}>
                Fase {fase}
              </p>
              <p className={`text-[10px] font-medium mt-0.5 ${completada ? 'text-yellow-900' : 'text-gray-500'}`}>
                {FASE_LABELS[fase]}
              </p>
            </div>
          );
        })}
      </div>

      {/* Pasos */}
      <div className="space-y-1">
        {estados.map((e, i) => {
          const done    = i < currentIdx;
          const current = i === currentIdx;
          const future  = i > currentIdx;

          return (
            <div key={e} className={`flex items-center gap-2.5 py-1 px-2 rounded-xl transition-colors ${
              current ? 'bg-yellow-50 border border-yellow-200' : ''
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                done    ? 'bg-green-500'
                : current ? 'bg-yellow-400'
                : 'bg-gray-200'
              }`}>
                {done    && <Check size={11} className="text-white" strokeWidth={3} />}
                {current && <div className="w-2 h-2 bg-yellow-900 rounded-full" />}
                {future  && <span className="text-[9px] text-gray-400 font-bold">{i + 1}</span>}
              </div>
              <span className={`text-xs ${
                done    ? 'text-gray-400 line-through'
                : current ? 'text-yellow-800 font-bold'
                : 'text-gray-400'
              }`}>
                {ESTADO_META[e]?.label ?? e}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Sección de fotos ──────────────────────────────────────────────────────────
function SeccionFotos({
  osId,
  titulo,
  campo,
  fotos: fotosInit,
  canEdit,
}: {
  osId: string;
  titulo: string;
  campo: 'fotos_antes' | 'fotos_despues';
  fotos: string[];
  canEdit: boolean;
}) {
  const [fotos,    setFotos]    = useState<string[]>(fotosInit);
  const [guardando, setGuardando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const agregarFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setGuardando(true);
    const nuevas = await Promise.all(files.map(fileToBase64));
    const todas  = [...fotos, ...nuevas];
    setFotos(todas);
    await guardarFotosOS(osId, campo, todas);
    setGuardando(false);
    e.target.value = '';
  };

  const eliminarFoto = async (idx: number) => {
    const nuevas = fotos.filter((_, i) => i !== idx);
    setFotos(nuevas);
    await guardarFotosOS(osId, campo, nuevas);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{titulo}</p>
        {canEdit && (
          <>
            <button
              onClick={() => inputRef.current?.click()}
              disabled={guardando}
              className="flex items-center gap-1.5 text-xs font-bold text-yellow-700 bg-yellow-100 hover:bg-yellow-200 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {guardando ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
              Agregar foto
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={agregarFoto}
            />
          </>
        )}
      </div>

      {fotos.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">Sin fotos cargadas</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {fotos.map((src, i) => (
            <div key={i} className="relative group aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={src} 
                alt={`foto-${i}`} 
                className="w-full h-full object-cover rounded-xl cursor-pointer hover:brightness-75 transition-all" 
                onClick={() => {
                  const win = window.open();
                  if (win) win.document.write(`<img src="${src}" style="max-width:100%; height:auto;" />`);
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                <div className="bg-white/90 p-2 rounded-full shadow-lg text-[#0f2d55]">
                  <Eye size={16} />
                </div>
              </div>
              {canEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); eliminarFoto(i); }}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <X size={11} strokeWidth={3} />
                </button>
              )}
            </div>
          ))}

        </div>
      )}
    </div>
  );
}

// ── Modal de firma fullscreen ─────────────────────────────────────────────────
function ModalFirma({
  titulo,
  onGuardar,
  onCerrar,
}: {
  titulo: string;
  onGuardar: (dataUrl: string) => Promise<void>;
  onCerrar: () => void;
}) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const padRef     = useRef<SignaturePad | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [vacio,     setVacio]     = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const ratio  = Math.max(window.devicePixelRatio || 1, 1);
      const data   = padRef.current?.toData();
      canvas.width  = canvas.offsetWidth  * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(ratio, ratio);
      padRef.current = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255,255,255)',
        penColor: '#1e3a5f',
        minWidth: 1.5,
        maxWidth: 3,
      });
      padRef.current.addEventListener('endStroke', () => setVacio(padRef.current?.isEmpty() ?? true));
      if (data) padRef.current.fromData(data);
    };

    resize();
    window.addEventListener('resize', resize);
    return () => { padRef.current?.off(); window.removeEventListener('resize', resize); };
  }, []);

  const limpiar = () => { padRef.current?.clear(); setVacio(true); };

  const guardar = async () => {
    if (!padRef.current || padRef.current.isEmpty()) return;
    setGuardando(true);
    await onGuardar(padRef.current.toDataURL('image/png'));
    setGuardando(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col" style={{ touchAction: 'none' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0">
        <p className="text-sm font-bold text-[#0f2d55]">{titulo}</p>
        <button onClick={onCerrar} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <X size={18} className="text-gray-500" />
        </button>
      </div>

      {/* Instrucción */}
      <p className="text-center text-xs text-gray-400 py-2 flex-shrink-0">Firma en el área de abajo</p>

      {/* Canvas area */}
      <div className="flex-1 relative mx-4 mb-4 rounded-2xl border-2 border-dashed border-gray-300 overflow-hidden bg-gray-50">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
          style={{ touchAction: 'none' }}
        />
        {vacio && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-300 text-sm font-medium">✏ Firma aquí</p>
          </div>
        )}
      </div>

      {/* Botones */}
      <div className="flex gap-3 px-4 pb-6 flex-shrink-0">
        <button
          onClick={limpiar}
          className="flex-1 h-12 border-2 border-gray-200 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 size={15} /> Limpiar
        </button>
        <button
          onClick={guardar}
          disabled={guardando || vacio}
          className="flex-2 flex-grow-[2] h-12 bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 rounded-2xl text-sm font-bold text-yellow-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {guardando ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
          Guardar firma
        </button>
      </div>
    </div>
  );
}

// ── Sección de firma ──────────────────────────────────────────────────────────
function SeccionFirma({
  osId,
  titulo,
  campo,
  firmaInit,
  canEdit,
}: {
  osId: string;
  titulo: string;
  campo: 'firma_tecnico' | 'firma_cliente';
  firmaInit: string | null;
  canEdit: boolean;
}) {
  const [firma,    setFirma]    = useState<string | null>(firmaInit);
  const [abierto,  setAbierto]  = useState(false);

  const handleGuardar = async (dataUrl: string) => {
    await guardarFirmaOS(osId, campo, dataUrl);
    setFirma(dataUrl);
    setAbierto(false);
  };

  return (
    <>
      {abierto && (
        <ModalFirma
          titulo={titulo}
          onGuardar={handleGuardar}
          onCerrar={() => setAbierto(false)}
        />
      )}
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{titulo}</p>
        {canEdit && (
          <button
            onClick={() => setAbierto(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-yellow-700 bg-yellow-100 hover:bg-yellow-200 px-3 py-1.5 rounded-xl transition-colors"
          >
            <Pen size={12} /> {firma ? 'Actualizar' : 'Firmar'}
          </button>
        )}
      </div>

      {firma ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={firma} alt="firma" className="w-full max-h-32 object-contain rounded-xl border border-gray-100 bg-gray-50" />
      ) : (
        <p className="text-sm text-gray-400 text-center py-6">Sin firma</p>
      )}
    </div>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function OSDetallePage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const { user } = useUser();
  const rol      = (user?.publicMetadata?.role as string) ?? '';
  const esAdmin  = rol === 'admin';
  const canEdit  = esAdmin || rol === 'tecnico';

  const [os,          setOs]          = useState<OSRow | null>(null);
  const [cargando,    setCargando]    = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [avanzando,   setAvanzando]   = useState(false);
  const [errAvanzar,  setErrAvanzar]  = useState<string | null>(null);
  const [usuarios,    setUsuarios]    = useState<UsuarioRow[]>([]);
  const [notas,       setNotas]       = useState('');
  const [desc,        setDesc]        = useState('');
  const [numOS,       setNumOS]       = useState('');
  const [numOC,       setNumOC]       = useState('');
  const [numFact,     setNumFact]     = useState('');
  const [montoFact,   setMontoFact]   = useState('');
  const [vencFact,    setVencFact]    = useState('');
  const [cotizacion,  setCotizacion]  = useState<CotizacionRow | null>(null);
  const notasTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const descTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fotoOSRef   = useRef<HTMLInputElement>(null);
  const fotoOCRef   = useRef<HTMLInputElement>(null);

  // Cargar OS y usuarios
  useEffect(() => {
    Promise.all([obtenerOrdenPorId(id), obtenerUsuarios()])
      .then(([{ data, error }, { data: uData }]) => {
        setOs(data);
        setError(error);
        setNotas(data?.notas ?? '');
        setDesc(data?.descripcion_trabajo ?? '');
        setNumOS(data?.numero_os_manual ?? '');
        setNumOC(data?.numero_orden_compra ?? '');
        setNumFact(data?.numero_factura ?? '');
        setMontoFact(data?.monto_factura ? String(data.monto_factura) : '');
        setVencFact(data?.fecha_vencimiento?.slice(0, 10) ?? '');
        const exclude = ['Ing. Cristina Velasco', 'Ing. Juan Carlos Espinosa', 'Teresa Gutiérrez'];
        setUsuarios(uData.filter(u => !exclude.includes(u.nombre)));
        setCargando(false);
        // Cargar cotización vinculada si existe
        if (data?.cotizacion_id) {
          obtenerCotizacionPorId(data.cotizacion_id).then(({ data: cot }) => {
            if (cot) setCotizacion(cot);
          });
        }
      });
  }, [id]);

  // Avanzar estado
  const handleAvanzar = async () => {
    if (!os) return;
    setErrAvanzar(null);
    setAvanzando(true);
    const { error } = await avanzarEstadoOS(os.id);
    if (error) {
      setErrAvanzar(error.replace('CANDADO: ', ''));
    } else {
      const estados = Object.keys(ESTADO_META);
      const idx = estados.indexOf(os.estado);
      const nuevoEstado = estados[idx + 1];
      setOs(prev => prev ? { ...prev, estado: nuevoEstado } : prev);
    }
    setAvanzando(false);
  };

  // Guardar número OS manual
  const handleNumOS = useCallback((val: string) => {
    setNumOS(val);
    if (!os) return;
    clearTimeout((handleNumOS as unknown as { _t?: ReturnType<typeof setTimeout> })._t);
    (handleNumOS as unknown as { _t?: ReturnType<typeof setTimeout> })._t = setTimeout(() => {
      guardarDatosOS(os.id, { numero_os_manual: val })
        .then(() => setOs(prev => prev ? { ...prev, numero_os_manual: val } : prev));
    }, 800);
  }, [os]);

  // Guardar foto OS
  const handleFotoOS = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !os) return;
    const base64 = await fileToBase64(file);
    await guardarDatosOS(os.id, { foto_os: base64 });
    setOs(prev => prev ? { ...prev, foto_os: base64 } : prev);
  };

  // Guardar número OC
  const handleNumOC = useCallback((val: string) => {
    setNumOC(val);
    if (!os) return;
    clearTimeout((handleNumOC as unknown as { _t?: ReturnType<typeof setTimeout> })._t);
    (handleNumOC as unknown as { _t?: ReturnType<typeof setTimeout> })._t = setTimeout(() => {
      guardarOrdenCompra(os.id, { numero_orden_compra: val })
        .then(() => setOs(prev => prev ? { ...prev, numero_orden_compra: val } : prev));
    }, 800);
  }, [os]);

  // Guardar foto OC
  const handleFotoOC = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !os) return;
    const base64 = await fileToBase64(file);
    await guardarOrdenCompra(os.id, { foto_orden_compra: base64 });
    setOs(prev => prev ? { ...prev, foto_orden_compra: base64 } : prev);
  };

  // Cambio de técnico
  const handleTecnico = async (tecnico_id: string) => {
    if (!os) return;
    await asignarTecnicoOS(os.id, tecnico_id);
    const tecnico = usuarios.find(u => u.id === tecnico_id) ?? null;
    setOs(prev => prev ? {
      ...prev,
      tecnico_id,
      tecnico: tecnico ? { nombre: tecnico.nombre } : null,
    } : prev);
  };

  // Eliminar orden
  const handleEliminar = async () => {
    if (!os) return;
    if (!confirm(`¿Estás seguro de que deseas eliminar la orden ${os.numero}? Esta acción no se puede deshacer.`)) return;
    
    const { error } = await eliminarOrdenServicio(os.id);
    if (error) alert('Error al eliminar: ' + error);
    else router.push('/ordenes-servicio');
  };

  // Notas con debounce
  const handleNotas = useCallback((val: string) => {
    setNotas(val);
    if (notasTimer.current) clearTimeout(notasTimer.current);
    notasTimer.current = setTimeout(() => {
      if (os) actualizarNotasOS(os.id, val);
    }, 1200);
  }, [os]);

  // Descripción con debounce
  const handleDesc = useCallback((val: string) => {
    setDesc(val);
    if (descTimer.current) clearTimeout(descTimer.current);
    descTimer.current = setTimeout(() => {
      if (os) actualizarDescripcionOS(os.id, val);
    }, 1200);
  }, [os]);

  // ── Loading / Error ───────────────────────────────────────────────────────
  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
        <Loader2 size={22} className="animate-spin" />
        <span className="text-sm">Cargando orden...</span>
      </div>
    );
  }

  if (error || !os) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-red-600">
        <AlertCircle size={32} />
        <p className="text-sm">{error ?? 'Orden no encontrada'}</p>
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:underline mt-2">
          ← Volver
        </button>
      </div>
    );
  }

  const estados   = Object.keys(ESTADO_META);
  const idx       = estados.indexOf(os.estado);
  const esUltimo  = idx === estados.length - 1;
  const pct       = Math.round(((idx + 1) / OS_TOTAL) * 100);
  const proxLabel = !esUltimo ? ESTADO_META[estados[idx + 1]]?.label : null;

  return (
    <div className="space-y-5 pb-16">
      {/* Nav */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/ordenes-servicio')}
          className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft size={18} className="text-gray-600" />
        </button>
        <button
          onClick={handleEliminar}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
          title="Eliminar Orden"
        >
          <Trash2 size={14} /> Eliminar
        </button>
      </div>

      {/* Header + Avanzar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-mono">{os.numero}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {os.empresas?.nombre_comercial ?? '—'} · Creada {fmtFecha(os.created_at)}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-40 bg-gray-100 rounded-full h-2">
                <div className={`h-2 rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-yellow-400'}`} style={{ width: `${pct}%` }} />
              </div>
              <span className={`text-xs font-bold ${pct === 100 ? 'text-green-600' : 'text-gray-600'}`}>{pct}%</span>
            </div>
          </div>
          {!esUltimo && canEdit ? (
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={handleAvanzar}
                disabled={avanzando}
                className={`flex items-center gap-2 font-bold text-sm px-4 py-2.5 rounded-2xl transition-all shadow-lg ${
                  avanzando 
                    ? 'bg-gray-100 text-gray-400' 
                    : (!esAdmin && os.estado === 'tecnico_asignado' && (!os.tecnico_id || !os.numero_os_manual || !os.foto_os))
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-70'
                      : 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900 shadow-yellow-100'
                }`}
              >
                {avanzando ? <Loader2 size={15} className="animate-spin" /> : <ChevronRight size={15} />}
                {proxLabel ? `→ ${proxLabel}` : 'Avanzar'}
              </button>
              {!esAdmin && os.estado === 'tecnico_asignado' && (!os.tecnico_id || !os.numero_os_manual || !os.foto_os) && (
                <span className="text-[10px] text-red-500 font-bold animate-pulse">Completa los campos obligatorios (*)</span>
              )}
            </div>
          ) : (
            <span className="flex items-center gap-1.5 bg-green-100 text-green-700 font-bold text-sm px-4 py-2.5 rounded-2xl flex-shrink-0">
              <Check size={15} /> Completada
            </span>
          )}
        </div>

        {/* Error de candado (Solo no-admin) */}
        {!esAdmin && errAvanzar && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
            <Lock size={14} className="text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-800 font-medium">{errAvanzar}</p>
          </div>
        )}

        {/* Candados (solo en primer estado y solo para no-admin) */}
        {!esAdmin && os.estado === 'tecnico_asignado' && (
          <div className="flex flex-wrap gap-2 pt-1">
            {[
              { ok: !!os.tecnico_id,          label: 'Técnico asignado'  },
              { ok: !!os.numero_os_manual,     label: 'Número OS manual'  },
              { ok: !!os.foto_os,             label: 'Foto OS subida'    },
            ].map(c => (
              <span key={c.label} className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                c.ok ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {c.ok ? <Unlock size={10} /> : <Lock size={10} />} {c.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Grid 2 columnas en desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Columna izquierda: Timeline */}
        <div className="lg:col-span-1">
          <Timeline estado={os.estado} />
        </div>

        {/* Columna derecha: Detalles */}
        <div className="lg:col-span-2 space-y-5">
          {/* ── Técnico (candado 1) ── */}
          <div className={`bg-white rounded-2xl border p-5 transition-all ${!os.tecnico_id ? 'border-red-200 bg-red-50/30' : 'border-gray-200 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {os.tecnico_id ? <Check size={13} className="text-green-500" /> : <Lock size={13} className="text-red-500" />}
                <p className={`text-[10px] font-bold uppercase tracking-wider ${!os.tecnico_id ? 'text-red-500' : 'text-gray-400'}`}>Técnico asignado *</p>
              </div>
              {!os.tecnico_id && <span className="text-[9px] font-black text-red-600 bg-red-100 px-1.5 py-0.5 rounded uppercase">Obligatorio</span>}
            </div>
            <select
              value={os.tecnico_id ?? ''}
              onChange={e => handleTecnico(e.target.value)}
              disabled={!canEdit}
              className={`w-full border rounded-xl px-3 h-10 text-sm outline-none transition-all bg-white ${!os.tecnico_id ? 'border-red-300 ring-4 ring-red-50' : 'border-gray-200 focus:border-yellow-400'}`}
            >
              <option value="">— Seleccionar técnico —</option>
              {usuarios.map(u => (
                <option key={u.id} value={u.id}>{u.nombre}</option>
              ))}
            </select>
          </div>

          {/* ── Número OS manual + foto (candados 2 y 3) ── */}
          <div className={`bg-white rounded-2xl border p-5 space-y-4 ${(!os.numero_os_manual || !os.foto_os) ? 'border-amber-300' : 'border-gray-200'}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              {os.numero_os_manual && os.foto_os ? <Unlock size={13} className="text-green-500" /> : <Lock size={13} className="text-amber-500" />}
              Orden de Servicio Física *
            </p>
            {/* Número manual */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className={`text-[10px] font-bold block ${!numOS ? 'text-red-500' : 'text-gray-500'}`}>Número de OS *</label>
                {!numOS && <span className="text-[9px] font-black text-red-600 uppercase">Falta dato</span>}
              </div>
              <input
                type="text"
                value={numOS}
                onChange={e => handleNumOS(e.target.value)}
                placeholder="Ej. OS-2024-001"
                readOnly={!canEdit}
                className={`w-full border rounded-xl px-3 h-10 text-sm outline-none transition-all ${!canEdit ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : numOS ? 'border-green-300 focus:border-green-400 bg-green-50/20' : 'border-red-300 ring-4 ring-red-50'}`}
              />
            </div>
            {/* Foto OS */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className={`text-[10px] font-bold block ${!os.foto_os ? 'text-red-500' : 'text-gray-500'}`}>Foto de la OS *</label>
                {!os.foto_os && <span className="text-[9px] font-black text-red-600 uppercase">Falta foto</span>}
              </div>
              {os.foto_os ? (
                <div className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={os.foto_os} 
                    alt="OS" 
                    className="w-full max-h-48 object-contain rounded-xl border border-green-200 bg-green-50/10 shadow-sm cursor-pointer hover:brightness-95 transition-all" 
                    onClick={() => {
                      const win = window.open();
                      if (win && os.foto_os) win.document.write(`<img src="${os.foto_os}" style="max-width:100%; height:auto;" />`);
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                    <div className="bg-white/90 p-2 rounded-full shadow-lg text-green-600">
                      <Eye size={20} />
                    </div>
                  </div>
                  <button
                    onClick={() => { guardarDatosOS(os.id, { foto_os: '' }); setOs(prev => prev ? { ...prev, foto_os: null } : prev); }}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

              ) : canEdit ? (
                <button
                  onClick={() => fotoOSRef.current?.click()}
                  className="w-full h-24 border-2 border-dashed border-red-200 bg-red-50/20 rounded-xl flex flex-col items-center justify-center gap-1 text-red-500 hover:bg-red-50 transition-all hover:border-red-300 group"
                >
                  <Camera size={24} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-tight">Tomar Foto de la O.S. Física</span>
                </button>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">Sin foto</p>
              )}
              {canEdit && <input ref={fotoOSRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFotoOS} />}
            </div>
          </div>

          {/* ── Orden de Compra (opcional) ── */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <ShoppingCart size={13} className="text-gray-400" />
              Orden de Compra <span className="font-normal text-gray-300">(opcional)</span>
            </p>
            <div>
              <label className="text-[10px] font-bold text-gray-500 block mb-1">Número de OC</label>
              <input
                type="text"
                value={numOC}
                onChange={e => handleNumOC(e.target.value)}
                placeholder="Número de orden de compra..."
                readOnly={!canEdit}
                className={`w-full border border-gray-200 rounded-xl px-3 h-10 text-sm outline-none focus:border-yellow-400 transition-colors ${!canEdit ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 block mb-1">Foto de la OC</label>
              {os.foto_orden_compra ? (
                <div className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={os.foto_orden_compra} 
                    alt="OC" 
                    className="w-full max-h-48 object-contain rounded-xl border border-gray-200 bg-gray-50 cursor-pointer hover:brightness-95 transition-all" 
                    onClick={() => {
                      const win = window.open();
                      if (win && os.foto_orden_compra) win.document.write(`<img src="${os.foto_orden_compra}" style="max-width:100%; height:auto;" />`);
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                    <div className="bg-white/90 p-2 rounded-full shadow-lg text-blue-600">
                      <Eye size={20} />
                    </div>
                  </div>
                  <button
                    onClick={() => { guardarOrdenCompra(os.id, { foto_orden_compra: '' }); setOs(prev => prev ? { ...prev, foto_orden_compra: null } : prev); }}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

              ) : canEdit ? (
                <button
                  onClick={() => fotoOCRef.current?.click()}
                  className="w-full h-16 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-400 hover:bg-gray-50 transition-colors"
                >
                  <Camera size={18} />
                  <span className="text-xs">Subir foto de la OC</span>
                </button>
              ) : (
                <p className="text-sm text-gray-400 text-center py-3">Sin foto</p>
              )}
              {canEdit && <input ref={fotoOCRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFotoOC} />}
            </div>
          </div>

          {/* ── Datos de Facturación (Manual) ── */}
          <div className="bg-white rounded-2xl border border-blue-100 p-5 space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <Receipt size={13} /> Datos de Facturación
            </p>
            <div className="max-w-xs">
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Número de Factura</label>
              <input
                value={numFact}
                onChange={e => setNumFact(e.target.value)}
                onBlur={() => {
                  const datos: any = { numero_factura: numFact };
                  // Si hay cotización vinculada, ligamos el monto automáticamente
                  if (numFact && cotizacion?.total_mxn) {
                    datos.monto_factura = cotizacion.total_mxn;
                  }
                  guardarDatosOS(os.id, datos);
                }}
                placeholder="Ej. B-1234"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
              />

            </div>
            {numFact && (
              <p className="text-[10px] text-blue-500 bg-blue-50 rounded-lg px-3 py-2 flex items-center gap-2 font-medium">
                <Check size={12} /> Factura registrada en el sistema.
              </p>
            )}
          </div>



          {/* Descripción del trabajo */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Descripción del trabajo</p>
            <textarea
              value={desc}
              onChange={e => handleDesc(e.target.value)}
              placeholder="Describir el trabajo a realizar..."
              rows={3}
              readOnly={!canEdit}
              className={`w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-yellow-400 transition-colors resize-none ${!canEdit ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
            />
          </div>

          {/* Notas */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Notas internas</p>
            <textarea
              value={notas}
              onChange={e => handleNotas(e.target.value)}
              placeholder="Agregar notas..."
              rows={3}
              readOnly={!canEdit}
              className={`w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-yellow-400 transition-colors resize-none ${!canEdit ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
            />
          </div>

          {/* Fotos antes */}
          <SeccionFotos
            osId={os.id}
            titulo="Fotos antes del servicio"
            campo="fotos_antes"
            fotos={os.fotos_antes ?? []}
            canEdit={canEdit}
          />

          {/* Fotos después */}
          <SeccionFotos
            osId={os.id}
            titulo="Fotos después del servicio"
            campo="fotos_despues"
            fotos={os.fotos_despues ?? []}
            canEdit={canEdit}
          />

          {/* Cotización vinculada */}
          {cotizacion && (
            <div className="bg-white rounded-2xl border border-indigo-100 p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-3 flex items-center gap-1.5">
                <ShoppingCart size={13} /> Cotización vinculada
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-indigo-50 rounded-xl p-3">
                  <p className="text-[10px] text-indigo-400 font-bold uppercase">Folio</p>
                  <p className="text-sm font-black text-indigo-800 mt-0.5">{cotizacion.folio ?? '—'}</p>
                </div>
                <div className="bg-indigo-50 rounded-xl p-3">
                  <p className="text-[10px] text-indigo-400 font-bold uppercase">Total MXN</p>
                  <p className="text-sm font-black text-indigo-800 mt-0.5">
                    {cotizacion.total_mxn != null
                      ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(cotizacion.total_mxn)
                      : '—'}
                  </p>
                </div>
                <div className="bg-indigo-50 rounded-xl p-3">
                  <p className="text-[10px] text-indigo-400 font-bold uppercase">Tipo</p>
                  <p className="text-sm font-black text-indigo-800 mt-0.5">{cotizacion.tipo ?? '—'}</p>
                </div>
                <div className="bg-indigo-50 rounded-xl p-3">
                  <p className="text-[10px] text-indigo-400 font-bold uppercase">Estado</p>
                  <p className="text-sm font-black text-indigo-800 mt-0.5 capitalize">{cotizacion.estado ?? '—'}</p>
                </div>
              </div>
              {cotizacion.notas && (
                <p className="text-xs text-gray-500 mt-3 bg-gray-50 rounded-xl px-3 py-2">{cotizacion.notas}</p>
              )}
            </div>
          )}

          {/* Firmas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <SeccionFirma
              osId={os.id}
              titulo="Firma del técnico"
              campo="firma_tecnico"
              firmaInit={os.firma_tecnico}
              canEdit={canEdit}
            />
            <SeccionFirma
              osId={os.id}
              titulo="Firma del cliente"
              campo="firma_cliente"
              firmaInit={os.firma_cliente}
              canEdit={canEdit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
