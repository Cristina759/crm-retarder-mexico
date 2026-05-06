'use client';

import { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import { Loader2, RefreshCw, Check, FileText, Printer, Mail } from 'lucide-react';
import { crearCotizacion } from '@/app/actions/cotizaciones';
import { obtenerUsuarios } from '@/app/actions/usuarios';
import type { UsuarioRow } from '@/app/actions/types';

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Componente {
  id: string;
  nombre: string;
  precio: number;   // USD
  obligatorio: boolean;
  activo: boolean;
}

interface MarcaOpcion {
  id: 'pentar' | 'frenelsa';
  label: string;
  nm: number;         // torque Nm
  componentes: Componente[];
}

interface ModeloFreno {
  id: string;
  nombre: string;
  tonelaje: string;
  marcas: MarcaOpcion[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function mkComp(
  base: number, cardanes: number, electrico: number, soporteria: number
): Componente[] {
  return [
    { id: 'base',       nombre: 'FRENO BASE',    precio: base,       obligatorio: true,  activo: true },
    { id: 'cardanes',   nombre: 'CARDANES',       precio: cardanes,   obligatorio: false, activo: true },
    { id: 'electrico',  nombre: 'MAT. ELÉCTRICO', precio: electrico,  obligatorio: false, activo: true },
    { id: 'soporteria', nombre: 'SOPORTERÍA',     precio: soporteria, obligatorio: false, activo: true },
  ];
}

// ── Data de modelos con marcas ────────────────────────────────────────────────
// Precios PENTAR: columna "VENTA RETARDER MEXICO" del CSV 2024
// Precios FRENELSA: columna "FRENELSA" del CSV 2024 (aprox. −8 a −12 % sobre PENTAR)
const MODELOS_BASE: ModeloFreno[] = [
  {
    id: 'PK1', nombre: 'PK1', tonelaje: 'Camiones 3 a 5 Ton',
    marcas: [
      { id: 'pentar',   label: 'PENTAR',   nm: 80,  componentes: mkComp(5423.41, 306.07,  779.03, 491.49) },
      { id: 'frenelsa', label: 'FRENELSA', nm: 80,  componentes: mkComp(4890.00, 290.00,  779.03, 491.49) },
    ],
  },
  {
    id: 'PK', nombre: 'PK', tonelaje: 'Camiones 4 a 8 Ton',
    marcas: [
      { id: 'pentar',   label: 'PENTAR',   nm: 140, componentes: mkComp(5458.18, 271.30,  779.03, 491.49) },
      { id: 'frenelsa', label: 'FRENELSA', nm: 140, componentes: mkComp(4920.00, 257.00,  779.03, 491.49) },
    ],
  },
  {
    id: 'P5-1', nombre: 'P5-1', tonelaje: 'Vehículos 6 a 10 Ton',
    marcas: [
      { id: 'pentar',   label: 'PENTAR',   nm: 200, componentes: mkComp(5193.62, 779.35,  779.03, 498.00) },
      { id: 'frenelsa', label: 'FRENELSA', nm: 200, componentes: mkComp(4674.00, 741.00,  779.03, 498.00) },
    ],
  },
  {
    id: 'P5', nombre: 'P5', tonelaje: 'Vehículos 10 a 15 Ton',
    marcas: [
      { id: 'pentar',   label: 'PENTAR',   nm: 250, componentes: mkComp(5537.10, 685.87,  779.03, 498.00) },
      { id: 'frenelsa', label: 'FRENELSA', nm: 250, componentes: mkComp(4983.00, 651.00,  779.03, 498.00) },
    ],
  },
  {
    id: 'P7-1', nombre: 'P7-1', tonelaje: 'Vehículos 15 a 20 Ton',
    marcas: [
      { id: 'pentar',   label: 'PENTAR',   nm: 280, componentes: mkComp(6132.59, 1018.53, 779.03, 569.85) },
      { id: 'frenelsa', label: 'FRENELSA', nm: 280, componentes: mkComp(5519.00,  967.00, 779.03, 569.85) },
    ],
  },
  {
    id: 'P7', nombre: 'P7', tonelaje: 'Vehículos 20 a 25 Ton',
    marcas: [
      { id: 'pentar',   label: 'PENTAR',   nm: 300, componentes: mkComp(7132.59, 1018.53, 779.03, 569.85) },
      { id: 'frenelsa', label: 'FRENELSA', nm: 300, componentes: mkComp(6419.00,  967.00, 779.03, 569.85) },
    ],
  },
  {
    id: 'P11-1', nombre: 'P11-1', tonelaje: 'Vehículos 25 a 32 Ton',
    marcas: [
      { id: 'pentar',   label: 'PENTAR',   nm: 350, componentes: mkComp(7928.96, 1018.53, 779.03, 533.48) },
      { id: 'frenelsa', label: 'FRENELSA', nm: 350, componentes: mkComp(7136.00,  967.00, 779.03, 533.48) },
    ],
  },
  {
    id: 'P11', nombre: 'P11', tonelaje: 'Vehículos 32 a 50 Ton',
    marcas: [
      { id: 'pentar',   label: 'PENTAR',   nm: 400, componentes: mkComp(6342.73, 844.76,  779.03, 533.48) },
      { id: 'frenelsa', label: 'FRENELSA', nm: 400, componentes: mkComp(5708.00,  802.00, 779.03, 533.48) },
    ],
  },
];

// ── Estado local de modelo (marcas + componentes editables) ───────────────────
interface ModeloState {
  id: string;
  marcaSelId: 'pentar' | 'frenelsa';
  marcas: MarcaOpcion[];
}

function initModelos(): ModeloState[] {
  return MODELOS_BASE.map(m => ({
    id: m.id,
    marcaSelId: 'pentar',
    marcas: m.marcas.map(ma => ({
      ...ma,
      componentes: ma.componentes.map(c => ({ ...c })),
    })),
  }));
}

// ── Folio auto ────────────────────────────────────────────────────────────────
function generarFolio() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const r = Math.floor(Math.random() * 900) + 100;
  return `COT-F-${y}${m}${d}-${r}`;
}

// ── Número a letras (español, USD) ────────────────────────────────────────────
function numeroALetras(nInput: number): string {
  const n = Math.round(nInput * 100) / 100;
  const unidades = ['','UNO','DOS','TRES','CUATRO','CINCO','SEIS','SIETE','OCHO','NUEVE',
    'DIEZ','ONCE','DOCE','TRECE','CATORCE','QUINCE','DIECISÉIS','DIECISIETE','DIECIOCHO','DIECINUEVE'];
  const decenas  = ['','DIEZ','VEINTE','TREINTA','CUARENTA','CINCUENTA','SESENTA','SETENTA','OCHENTA','NOVENTA'];
  const centenas = ['','CIENTO','DOSCIENTOS','TRESCIENTOS','CUATROCIENTOS','QUINIENTOS',
    'SEISCIENTOS','SETECIENTOS','OCHOCIENTOS','NOVECIENTOS'];
  function menor1000(x: number): string {
    if (x === 0) return '';
    if (x === 100) return 'CIEN';
    if (x < 20) return unidades[x];
    if (x < 100) {
      const d = Math.floor(x / 10), u = x % 10;
      return u === 0 ? decenas[d] : `${decenas[d]} Y ${unidades[u]}`;
    }
    const c = Math.floor(x / 100);
    const r = x % 100;
    return r === 0 ? centenas[c] : `${centenas[c]} ${menor1000(r)}`;
  }
  const entero  = Math.floor(n);
  const cents   = Math.round((n - entero) * 100);
  const miles   = Math.floor(entero / 1000);
  const resto   = entero % 1000;
  let letras = '';
  if (miles === 1) letras = 'MIL';
  else if (miles > 1) letras = `${menor1000(miles)} MIL`;
  if (resto > 0) letras += (letras ? ' ' : '') + menor1000(resto);
  if (!letras) letras = 'CERO';
  return `${letras} DÓLARES ${String(cents).padStart(2,'0')}/100 USD`;
}

// ── Formatters ────────────────────────────────────────────────────────────────
function fmt(n: number, dec = 2) {
  return n.toLocaleString('es-MX', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
function fmtMXN(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);
}
function totalUSD(comp: Componente[]) {
  return comp.filter(c => c.activo).reduce((s, c) => s + c.precio, 0);
}

// ── Card de modelo ─────────────────────────────────────────────────────────────
function ModeloCard({
  modelo,
  state,
  tc,
  seleccionado,
  onSelect,
  onChangeMarca,
  onChangeComp,
}: {
  modelo: ModeloFreno;
  state: ModeloState;
  tc: number;
  seleccionado: boolean;
  onSelect: () => void;
  onChangeMarca: (id: 'pentar' | 'frenelsa') => void;
  onChangeComp: (marcaId: 'pentar' | 'frenelsa', comp: Componente[]) => void;
}) {
  const marcaActual = state.marcas.find(m => m.id === state.marcaSelId)!;
  const total       = totalUSD(marcaActual.componentes);
  const totalMXN    = total * tc;

  const toggleComp = (id: string) => {
    onChangeComp(state.marcaSelId, marcaActual.componentes.map(c =>
      c.id === id && !c.obligatorio ? { ...c, activo: !c.activo } : c
    ));
  };

  const editPrecio = (id: string, val: string) => {
    onChangeComp(state.marcaSelId, marcaActual.componentes.map(c =>
      c.id === id ? { ...c, precio: parseFloat(val) || 0 } : c
    ));
  };

  return (
    <div
      onClick={onSelect}
      className={`rounded-2xl overflow-hidden cursor-pointer transition-all border-2 ${
        seleccionado
          ? 'border-[#c0392b] shadow-lg shadow-red-100'
          : 'border-gray-200 hover:border-[#c0392b]/40 hover:shadow-md'
      }`}
    >
      {/* Header oscuro */}
      <div className="bg-[#0f2d55] px-4 py-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {seleccionado && (
            <div className="w-5 h-5 rounded-full bg-[#c0392b] flex items-center justify-center flex-shrink-0">
              <Check size={11} className="text-white" strokeWidth={3} />
            </div>
          )}
          <div>
            <p className="font-bold text-white text-xl leading-tight">{modelo.nombre}</p>
            <p className="text-gray-300 text-xs mt-0.5">{modelo.tonelaje}</p>
          </div>
        </div>
      </div>

      {/* Cuerpo blanco */}
      <div className="bg-white px-4 pt-3 pb-4">
        {/* Componentes */}
        <div className="space-y-2" onClick={e => e.stopPropagation()}>
          {marcaActual.componentes.map(comp => (
            <div key={comp.id} className={`flex items-center gap-2 ${!comp.activo ? 'opacity-40' : ''}`}>
              {comp.obligatorio ? (
                <span className="text-[9px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded flex-shrink-0 uppercase tracking-wide">
                  Freno Base
                </span>
              ) : (
                <input
                  type="checkbox"
                  checked={comp.activo}
                  onChange={() => toggleComp(comp.id)}
                  className="w-3.5 h-3.5 accent-red-500 cursor-pointer flex-shrink-0"
                />
              )}
              <span className={`text-xs flex-1 uppercase tracking-wide ${comp.obligatorio ? 'font-bold text-gray-800' : 'text-gray-600'}`}>
                {comp.obligatorio ? modelo.nombre : comp.nombre}
              </span>
              <input
                type="number"
                value={comp.precio}
                onChange={e => editPrecio(comp.id, e.target.value)}
                onClick={e => e.stopPropagation()}
                className="w-20 text-right text-xs font-semibold text-gray-800 bg-transparent outline-none border-b border-transparent focus:border-gray-300 transition-colors"
                min="0"
                step="0.01"
              />
            </div>
          ))}
        </div>

        {/* Precio venta público */}
        <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between" onClick={e => e.stopPropagation()}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Precio Venta Público
          </span>
          <span className="text-sm font-bold text-gray-800">${fmt(total)}</span>
        </div>

        {/* Total instalado MXN */}
        <div className="mt-2 bg-red-50 rounded-xl px-3 py-2" onClick={e => e.stopPropagation()}>
          <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">
            Total Instalado MXN
          </p>
          <p className="text-base font-black text-red-600 leading-tight">{fmtMXN(totalMXN)}</p>
        </div>

        {/* Selector de marca */}
        <div className="mt-3 flex gap-1.5" onClick={e => e.stopPropagation()}>
          {modelo.marcas.map(ma => (
            <button
              key={ma.id}
              onClick={() => onChangeMarca(ma.id)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                state.marcaSelId === ma.id
                  ? 'bg-[#0f2d55] text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {ma.label} <span className="font-normal opacity-70">{ma.nm}Nm</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CotizadorFrenosPage() {
  const [tc,         setTc]         = useState<number>(0);
  const [tcFecha,    setTcFecha]    = useState('');
  const [cargandoTC, setCargandoTC] = useState(false);

  const [modelos,      setModelos]      = useState<ModeloState[]>(initModelos);
  const [modeloSelId,  setModeloSelId]  = useState<string | null>(null);

  const [unidades,     setUnidades]     = useState('1');
  const [traslado,     setTraslado]     = useState('');
  const [manoObra,     setManoObra]     = useState('');
  const [kitLed,       setKitLed]       = useState('');

  const [usuarios,     setUsuarios]     = useState<UsuarioRow[]>([]);

  const [folio,         setFolio]        = useState(() => generarFolio());
  const [atencionA,     setAtencionA]    = useState('');
  const [observaciones, setObservaciones] = useState(
`*NO INCLUYE MODIFICACIÓN DE CARDANES
*NO INCLUYE SOLDADURAS NI OTRAS MODIFICACIONES QUE INTERFIERAN CON LA INSTALACIÓN DEL FRENO
*SE REQUIERE EL PAGO TOTAL DEL EQUIPO POR ADELANTADO
*GASTOS DE ENVÍO DEL FRENO POR PARTE DEL CLIENTE
*UNA VEZ RECIBIDO EL PAGO, SE DA FECHA DE INSTALACIÓN`);
  const [notasCot,      setNotasCot]     = useState(
`*PRECIO SUJETO A CAMBIO SIN PREVIO AVISO
*COTIZACIÓN VÁLIDA POR 8 DÍAS
*EQUIPO NUEVO CON GARANTÍA DE UN AÑO`);

  const [guardando,    setGuardando]    = useState(false);
  const [guardadoOk,   setGuardadoOk]  = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

  const [qrDataUrl,    setQrDataUrl]   = useState('');

  const [empresa,      setEmpresa]      = useState('');
  const [rfc,          setRfc]          = useState('');
  const [direccion,    setDireccion]    = useState('');
  const [emailCliente, setEmailCliente] = useState('');

  void usuarios; // cargado para uso futuro (vendedores)

  // ── Fetch TC DOF — cascade: DOF → Banxico → paginasweb + caché localStorage ─
  const fetchTC = useCallback(async () => {
    setCargandoTC(true);

    try {
      const res = await fetch('/api/tipo-cambio-dof', { cache: 'no-store' });
      const json = await res.json();

      if (json?.tipoCambio && !isNaN(Number(json.tipoCambio))) {
        const valor = Number(json.tipoCambio);
        const fecha = json.fecha ?? '';

        setTc(valor);
        setTcFecha(fecha);

        // Guardar en localStorage como respaldo offline
        try {
          localStorage.setItem('tc_dof', JSON.stringify({ valor, fecha, fuente: json.fuente, ts: Date.now() }));
        } catch { /* modo privado sin storage */ }

        setCargandoTC(false);
        return;
      }
    } catch { /* red caída — intentar caché */ }

    // Fallback: último valor guardado en localStorage (máx. 48 h)
    try {
      const cached = localStorage.getItem('tc_dof');
      if (cached) {
        const { valor, fecha, ts } = JSON.parse(cached);
        const horas = (Date.now() - ts) / 36e5;
        if (valor && horas < 48) {
          setTc(valor);
          setTcFecha(`${fecha} (caché)`);
        }
      }
    } catch { /* sin localStorage */ }

    setCargandoTC(false);
  }, []);

  useEffect(() => {
    fetchTC();
    obtenerUsuarios().then(({ data }) => setUsuarios(data));
    QRCode.toDataURL('https://tgrpentarmexico.com/', { width: 140, margin: 1 }).then(setQrDataUrl);
  }, [fetchTC]);

  // ── Modelo seleccionado ─────────────────────────────────────────────────────
  const modeloBaseData = MODELOS_BASE.find(m => m.id === modeloSelId) ?? null;
  const modeloState    = modelos.find(m => m.id === modeloSelId) ?? null;
  const marcaActual    = modeloState
    ? modeloState.marcas.find(ma => ma.id === modeloState.marcaSelId)!
    : null;

  const updateMarca = (modeloId: string, marcaId: 'pentar' | 'frenelsa') => {
    setModelos(prev => prev.map(m =>
      m.id === modeloId ? { ...m, marcaSelId: marcaId } : m
    ));
  };

  const updateComp = (modeloId: string, marcaId: 'pentar' | 'frenelsa', comp: Componente[]) => {
    setModelos(prev => prev.map(m =>
      m.id === modeloId
        ? { ...m, marcas: m.marcas.map(ma => ma.id === marcaId ? { ...ma, componentes: comp } : ma) }
        : m
    ));
  };

  // ── Cálculos ────────────────────────────────────────────────────────────────
  const unidadesN    = Math.max(1, parseInt(unidades) || 1);
  const subtotalUSD  = marcaActual ? totalUSD(marcaActual.componentes) * unidadesN : 0;
  const subtotalMXN  = subtotalUSD * tc;
  const trasladoN    = parseFloat(traslado) || 0;
  const manoObraN    = parseFloat(manoObra) || 0;
  const kitLedN      = parseFloat(kitLed)   || 0;
  const extrasMXN    = (trasladoN + manoObraN + kitLedN) * unidadesN;
  const baseIVA      = subtotalMXN + extrasMXN;
  const iva          = Math.round(baseIVA * 0.16 * 100) / 100;
  const totalMXN     = baseIVA + iva;
  // USD equivalentes para el PDF
  const trasladoUSD  = tc > 0 ? trasladoN  / tc : 0;
  const manoObraUSD  = tc > 0 ? manoObraN  / tc : 0;
  const kitLedUSD    = tc > 0 ? kitLedN    / tc : 0;
  const totalPDFUSD  = subtotalUSD + trasladoUSD + manoObraUSD + kitLedUSD;
  const ivaUSD       = Math.round(totalPDFUSD * 0.16 * 100) / 100;
  const totalFinalUSD = Math.round(totalPDFUSD * 1.16 * 100) / 100;
  const fechaHoy     = new Date().toLocaleDateString('es-MX', { day:'2-digit', month:'long', year:'numeric' });

  // ── Guardar ─────────────────────────────────────────────────────────────────
  const handleGuardar = async () => {
    if (!marcaActual)    { setErrorGuardar('Selecciona un modelo de freno.'); return; }

    setGuardando(true);
    setErrorGuardar(null);
    setGuardadoOk(false);

    try {
      const { data, error } = await crearCotizacion({
        empresa_nombre: empresa.trim(),
        vendedor_id:    null,
        tipo:           `frenos-${modeloState!.id}-${modeloState!.marcaSelId}`,
        subtotal:       Math.round(baseIVA * 100) / 100,
        iva:            Math.round(iva * 100) / 100,
        total_mxn:      Math.round(totalMXN * 100) / 100,
        notas: [
          `Modelo: ${modeloBaseData!.nombre} — ${modeloBaseData!.tonelaje}`,
          `Marca: ${marcaActual.label} (${marcaActual.nm} Nm)`,
          `Unidades: ${unidadesN}`,
          `TC: $${fmt(tc)} MXN/USD`,
          marcaActual.componentes
            .filter(c => c.activo)
            .map(c => `  - ${c.nombre}: $${fmt(c.precio)} USD`)
            .join('\n'),
          trasladoN > 0 ? `Traslado: ${fmtMXN(trasladoN)}` : '',
          manoObraN > 0 ? `Mano de obra: ${fmtMXN(manoObraN)}` : '',
          kitLedN   > 0 ? `Kit LED: ${fmtMXN(kitLedN)}` : '',
        ].filter(Boolean).join('\n'),
      });

      if (error) {
        console.error('[handleGuardar] error de Supabase:', error);
        setErrorGuardar(`Error al guardar: ${error}`);
        return;
      }

      console.log('[handleGuardar] cotización creada:', data?.folio);
      setGuardadoOk(true);
      setTimeout(() => setGuardadoOk(false), 4000);

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[handleGuardar] excepción inesperada:', e);
      setErrorGuardar(`Error inesperado: ${msg}`);
    } finally {
      setGuardando(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-16">

      {/* Header: solo TC */}
      <div className="flex justify-end">
        <div className="w-full sm:w-64 bg-white rounded-2xl border border-gray-200 px-4 py-3 shadow-sm flex items-center gap-2">
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Tipo de cambio DOF</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-sm text-gray-400">$</span>
              <input
                type="number"
                value={tc}
                onChange={e => setTc(parseFloat(e.target.value) || 0)}
                className="w-20 text-sm font-bold text-gray-900 outline-none bg-transparent"
                step="0.01"
              />
              <span className="text-xs text-gray-400">MXN/USD</span>
            </div>
            {tcFecha
              ? <p className="text-[9px] text-gray-300 mt-0.5">DOF {tcFecha}</p>
              : <p className="text-[9px] text-gray-400 mt-0.5">{cargandoTC ? 'Obteniendo…' : 'Sin datos DOF'}</p>
            }
          </div>
          <button
            onClick={fetchTC}
            disabled={cargandoTC}
            className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"
          >
            {cargandoTC ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          </button>
        </div>
      </div>

      {/* Grid de modelos */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
          Selecciona el modelo de freno
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {MODELOS_BASE.map(m => {
            const st = modelos.find(s => s.id === m.id)!;
            return (
              <ModeloCard
                key={m.id}
                modelo={m}
                state={st}
                tc={tc}
                seleccionado={modeloSelId === m.id}
                onSelect={() => setModeloSelId(m.id === modeloSelId ? null : m.id)}
                onChangeMarca={marcaId => updateMarca(m.id, marcaId)}
                onChangeComp={(marcaId, comp) => updateComp(m.id, marcaId, comp)}
              />
            );
          })}
        </div>
      </div>

      {/* Extras */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">Extras y cantidades</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block mb-1">Unidades</label>
            <input
              type="number" min="1" value={unidades}
              onChange={e => setUnidades(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 h-10 text-sm text-gray-800 font-semibold outline-none focus:border-red-400 transition-colors"
            />
          </div>
          {[
            { label: 'Traslado',     value: traslado,  set: setTraslado  },
            { label: 'Mano de obra', value: manoObra,  set: setManoObra  },
            { label: 'Kit LED',      value: kitLed,    set: setKitLed    },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block mb-1">
                {label} <span className="normal-case font-normal text-gray-500">(MXN)</span>
              </label>
              <div className="flex items-center gap-1 border border-gray-300 rounded-xl px-3 h-10 focus-within:border-red-400 transition-colors">
                <span className="text-xs text-gray-600 font-semibold">$</span>
                <input
                  type="number" min="0" value={value}
                  onChange={e => set(e.target.value)}
                  placeholder="0"
                  className="flex-1 outline-none text-sm text-gray-800 font-semibold bg-transparent"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resumen */}
      {marcaActual && modeloBaseData && (
        <div className="bg-gray-900 rounded-2xl p-5 text-white space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Resumen de cotización</p>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-red-400">
                {modeloBaseData.nombre}
                <span className="ml-2 text-[11px] font-normal text-gray-400">
                  {marcaActual.label} · {marcaActual.nm} Nm
                </span>
              </span>
              <span className="text-xs text-gray-400">{unidadesN} u.</span>
            </div>
            {marcaActual.componentes.filter(c => c.activo).map(c => (
              <div key={c.id} className="flex items-center justify-between text-xs text-gray-300 pl-3">
                <span className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${c.obligatorio ? 'bg-red-400' : 'bg-gray-500'}`} />
                  {c.nombre}
                </span>
                <span>${fmt(c.precio)} USD</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-700 pt-3 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Subtotal USD ({unidadesN} u.)</span>
              <span className="font-semibold">${fmt(subtotalUSD)} USD</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">× TC ${fmt(tc)}</span>
              <span>{fmtMXN(subtotalMXN)}</span>
            </div>
            {trasladoN > 0 && (
              <div className="flex justify-between text-xs text-gray-400">
                <span>Traslado ×{unidadesN}</span>
                <span className="flex gap-3">
                  <span>{fmtMXN(trasladoN * unidadesN)}</span>
                  <span className="text-gray-500">${fmt(trasladoUSD * unidadesN)} USD</span>
                </span>
              </div>
            )}
            {manoObraN > 0 && (
              <div className="flex justify-between text-xs text-gray-400">
                <span>Mano de obra ×{unidadesN}</span>
                <span className="flex gap-3">
                  <span>{fmtMXN(manoObraN * unidadesN)}</span>
                  <span className="text-gray-500">${fmt(manoObraUSD * unidadesN)} USD</span>
                </span>
              </div>
            )}
            {kitLedN > 0 && (
              <div className="flex justify-between text-xs text-gray-400">
                <span>Kit LED ×{unidadesN}</span>
                <span className="flex gap-3">
                  <span>{fmtMXN(kitLedN * unidadesN)}</span>
                  <span className="text-gray-500">${fmt(kitLedUSD * unidadesN)} USD</span>
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-300">
              <span>IVA 16%</span>
              <span className="flex gap-3">
                <span>{fmtMXN(iva)}</span>
                <span className="text-gray-500">${fmt(ivaUSD)} USD</span>
              </span>
            </div>
          </div>

          <div className="border-t border-gray-600 pt-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-base text-white">Total MXN</span>
              <span className="text-3xl font-black text-yellow-400">{fmtMXN(totalMXN)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-gray-400">Total USD</span>
              <span className="text-lg font-black text-white">${fmt(totalFinalUSD)} USD</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Sección datos cotización ── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-700">Datos de la cotización</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Folio */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block mb-1">Folio</label>
            <div className="flex gap-2">
              <input
                type="text" value={folio} onChange={e => setFolio(e.target.value)}
                className="flex-1 border border-gray-300 rounded-xl px-3 h-10 text-sm font-semibold text-gray-800 outline-none focus:border-red-400 transition-colors"
              />
              <button
                onClick={() => setFolio(generarFolio())}
                className="px-3 h-10 rounded-xl border border-gray-300 text-xs text-gray-500 hover:bg-gray-100 transition-colors"
                title="Regenerar folio"
              >
                <RefreshCw size={13} />
              </button>
            </div>
          </div>
          {/* Atención a */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block mb-1">Atención a</label>
            <input
              type="text" value={atencionA} onChange={e => setAtencionA(e.target.value)}
              placeholder="Nombre del contacto..."
              className="w-full border border-gray-300 rounded-xl px-3 h-10 text-sm font-semibold text-gray-800 outline-none focus:border-red-400 transition-colors placeholder:text-gray-300"
            />
          </div>
        </div>

        {/* Datos adicionales del cliente */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block mb-1">Empresa / Razón social</label>
            <input
              type="text" value={empresa} onChange={e => setEmpresa(e.target.value)}
              placeholder="Nombre de la empresa..."
              className="w-full border border-gray-300 rounded-xl px-3 h-10 text-sm font-semibold text-gray-800 outline-none focus:border-red-400 transition-colors placeholder:text-gray-300"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block mb-1">Email</label>
            <input
              type="email" value={emailCliente} onChange={e => setEmailCliente(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="w-full border border-gray-300 rounded-xl px-3 h-10 text-sm font-semibold text-gray-800 outline-none focus:border-red-400 transition-colors placeholder:text-gray-300"
            />
          </div>
        </div>

        {/* Observaciones */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block mb-1">Observaciones técnicas</label>
          <textarea
            value={observaciones} onChange={e => setObservaciones(e.target.value)}
            rows={5}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-red-400 transition-colors resize-none font-mono"
          />
        </div>

        {/* Notas */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block mb-1">Notas</label>
          <textarea
            value={notasCot} onChange={e => setNotasCot(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-red-400 transition-colors resize-none font-mono"
          />
        </div>

        {/* Botones imprimir + enviar correo */}
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            disabled={!marcaActual}
            className="flex-1 h-12 bg-[#0f2d55] hover:bg-[#1a4a7a] text-white font-bold text-sm rounded-xl disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
          >
            <Printer size={16} /> Imprimir / PDF
          </button>
          <button
            onClick={() => alert('Próximamente: envío de cotización por correo electrónico')}
            disabled={!marcaActual}
            title={emailCliente ? `Enviar a ${emailCliente}` : 'Agrega un email de cliente'}
            className="flex-1 h-12 bg-white border-2 border-[#c0392b] text-[#c0392b] hover:bg-red-50 font-bold text-sm rounded-xl disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
          >
            <Mail size={16} />
            {emailCliente ? `Enviar a ${emailCliente.split('@')[0]}…` : 'Enviar por correo'}
          </button>
        </div>
      </div>

      {/* Botón guardar en Supabase */}
      <div className="space-y-2">
        {errorGuardar && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2 rounded-xl">{errorGuardar}</p>
        )}
        {guardadoOk && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-2 rounded-xl flex items-center gap-2">
            <Check size={14} strokeWidth={3} /> Cotización guardada exitosamente.
          </p>
        )}
        <button
          onClick={handleGuardar}
          disabled={guardando || !marcaActual || !empresa.trim()}
          className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-black text-base rounded-2xl disabled:opacity-40 transition-colors flex items-center justify-center gap-2 shadow-lg"
        >
          {guardando
            ? <><Loader2 size={20} className="animate-spin" /> Guardando...</>
            : <><FileText size={20} /> Generar Cotización</>
          }
        </button>
      </div>

      {/* ── Área de impresión (oculta en pantalla) ── */}
      {marcaActual && modeloBaseData && (
        <div id="print-area" style={{ display: 'none' }}>
          <div className="p-doc">

            {/* Header: logos izquierda + datos derecha */}
            <div className="p-header">
              <div className="p-logos-left">
                {/* Logo Retarder */}
                <div className="p-logo-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo-retarder.png"
                    alt="Retarder"
                    className="p-logo-img"
                    style={{ height: '80px', width: 'auto' }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fb = e.currentTarget.nextElementSibling as HTMLElement | null;
                      if (fb) fb.style.display = 'flex';
                    }}
                  />
                  <div className="p-logo-fallback" style={{ display: 'none' }}>
                    RETARDER<br />MÉXICO
                  </div>
                </div>
              </div>
              <div className="p-header-right">
                <div className="p-company">RETARDER MÉXICO</div>
                <div className="p-doc-title">Cotización de Frenos</div>
                <div className="p-fecha-line">Folio: {folio} &nbsp;|&nbsp; {fechaHoy}</div>
              </div>
            </div>

            <hr className="p-redline" />

            {/* Bloque cliente */}
            <div className="p-client-block">
              <div className="p-client-name">{empresa}</div>
              {rfc && <div className="p-client-row"><span className="p-client-lbl">RFC:</span> {rfc}</div>}
              {direccion && <div className="p-client-row"><span className="p-client-lbl">Dirección:</span> {direccion}</div>}
              {emailCliente && <div className="p-client-row"><span className="p-client-lbl">Email:</span> {emailCliente}</div>}
              {atencionA && <div className="p-client-row"><span className="p-client-lbl">Atención a:</span> {atencionA}</div>}
            </div>

            <hr className="p-hr" />

            {/* Dos columnas */}
            <div className="p-two-col">

              {/* Columna izquierda: trabajos */}
              <div className="p-col-works">
                <div className="p-section-title">Incluye los siguientes trabajos</div>
                <div className="p-work-item">
                  <span className="p-work-bullet">▸</span>
                  <span>Freno Retarder {modeloBaseData.nombre} — {marcaActual.label} ({marcaActual.nm} Nm)</span>
                </div>
                <div className="p-work-item">
                  <span className="p-work-bullet">·</span>
                  <span>{modeloBaseData.tonelaje}</span>
                </div>
                {marcaActual.componentes.filter(c => c.activo).map(c => (
                  <div key={c.id} className="p-work-item">
                    <span className="p-work-bullet">·</span>
                    <span>{c.nombre}</span>
                  </div>
                ))}
                {trasladoN > 0 && <div className="p-work-item"><span className="p-work-bullet">·</span><span>Traslado</span></div>}
                {manoObraN > 0 && <div className="p-work-item"><span className="p-work-bullet">·</span><span>Mano de obra (instalación)</span></div>}
                {kitLedN > 0 && <div className="p-work-item"><span className="p-work-bullet">·</span><span>Kit LED</span></div>}
                <div style={{ marginTop: '6px', fontSize: '7.5px', color: '#444' }}>
                  Unidades: <strong>{unidadesN}</strong>
                </div>
              </div>

              {/* Columna derecha: desglose económico */}
              <div className="p-col-pricing">
                <div className="p-section-title">Desglose económico</div>
                {marcaActual.componentes.filter(c => c.activo).map(c => (
                  <div key={c.id} className="p-price-item">
                    <span className="p-price-desc">{c.nombre}</span>
                    <span className="p-price-val">${fmt(c.precio * unidadesN)} USD</span>
                  </div>
                ))}
                {trasladoN > 0 && (
                  <div className="p-price-item">
                    <span className="p-price-desc">Traslado</span>
                    <span className="p-price-val">${fmt(trasladoUSD)} USD</span>
                  </div>
                )}
                {manoObraN > 0 && (
                  <div className="p-price-item">
                    <span className="p-price-desc">Mano de obra</span>
                    <span className="p-price-val">${fmt(manoObraUSD)} USD</span>
                  </div>
                )}
                {kitLedN > 0 && (
                  <div className="p-price-item">
                    <span className="p-price-desc">Kit LED</span>
                    <span className="p-price-val">${fmt(kitLedUSD)} USD</span>
                  </div>
                )}
                <div className="p-totals">
                  <div className="p-total-line"><span><strong>Subtotal</strong></span><span><strong>${fmt(totalPDFUSD)} USD</strong></span></div>
                  <div className="p-total-line iva"><span>IVA 16%</span><span>${fmt(ivaUSD)} USD</span></div>
                  <div className="p-total-final">
                    <span>TOTAL</span>
                    <span>${fmt(totalFinalUSD)} USD</span>
                  </div>
                  <div className="p-total-mxn">
                    <span>TOTAL MXN = ${fmt(totalFinalUSD)} × ${fmt(tc)}</span>
                    <span>{fmtMXN(totalMXN)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Importe en letras */}
            <div className="p-letras no-print">SON: {numeroALetras(totalPDFUSD)}</div>

            <hr className="p-hr" />

            {/* Observaciones técnicas / logísticas */}
            <div className="p-obs-two-col">
              <div>
                <div className="p-section-title">Observaciones técnicas</div>
                <pre className="p-obs-pre">{observaciones}</pre>
              </div>
              {notasCot && (
                <div>
                  <div className="p-section-title">Observaciones logísticas</div>
                  <pre className="p-obs-pre">{notasCot}</pre>
                </div>
              )}
            </div>

            <hr className="p-hr" />

            {/* Políticas y garantías */}
            <div className="p-policies">
              <div className="p-section-title" style={{ color: '#c0392b', borderColor: '#c0392b' }}>Políticas y Garantías</div>
              <div className="p-policy-line">*COTIZACIÓN VÁLIDA POR 15 DÍAS</div>
              <div className="p-policy-line">*GARANTÍA DE 30 DÍAS EN MANO DE OBRA</div>
            </div>

            <hr className="p-hr" />

            {/* Footer */}
            <div className="p-footer">
              {/* Logo Pentar — esquina inferior izquierda */}
              <div className="p-footer-logo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-pentar.png"
                  alt="Pentar Kloft"
                  style={{ height: '50px', width: 'auto', display: 'block' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fb = e.currentTarget.nextElementSibling as HTMLElement | null;
                    if (fb) fb.style.display = 'flex';
                  }}
                />
                <div style={{ display: 'none', fontSize: '8px', fontWeight: 900, color: '#0d2244' }}>
                  PENTAR<br />KLOFT
                </div>
              </div>
              <div className="p-footer-info">
                <div className="p-footer-name">Juan Carlos Espinosa</div>
                <div className="p-footer-detail">Área de Ventas &nbsp;|&nbsp; ventas@retardermexico.com &nbsp;|&nbsp; Tel: +52 55 7372 1633</div>
                <div className="p-footer-web">www.tgrpentarmexico.com</div>
              </div>
              <div className="p-footer-qr">
                {qrDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUrl}
                    alt="QR Retarder México"
                    style={{ width: '70px', height: '70px' }}
                    className="p-qr-img"
                  />
                )}
                <div className="p-qr-label">Escanea para más info</div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── CSS de impresión ── */}
      <style>{`
        @page { size: A4; margin: 10mm 12mm; }
        @media print {
          header, nav, footer { display: none !important; }
          body * { visibility: hidden !important; }
          #print-area, #print-area * { visibility: visible !important; }
          #print-area { display: block !important; position: fixed; top: 0; left: 0; width: 100%; }
          .p-total-mxn { display: none !important; }
        }
        /* ── Documento ── */
        .p-doc { font-family: Arial, sans-serif; font-size: 8.5px; color: #111; padding: 4px 8px; box-sizing: border-box; background: #fff; }
        /* ── Header ── */
        .p-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
        .p-logos-left { display: flex; align-items: center; gap: 8px; }
        .p-logo-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .p-logo-img { width: 48px; height: 48px; object-fit: contain; display: block; }
        .p-logo-fallback { font-size: 9px; font-weight: 900; color: #0d2244; text-align: center; line-height: 1.25; display: none; }
        .p-logo-divider { width: 1px; height: 40px; background: #ddd; margin: 0 2px; flex-shrink: 0; }
        .p-header-right { text-align: right; }
        .p-company { font-size: 14px; font-weight: 900; color: #0d2244; letter-spacing: 0.5px; }
        .p-doc-title { font-size: 9px; font-weight: 700; color: #0d2244; margin-top: 1px; }
        .p-fecha-line { font-size: 7.5px; color: #555; margin-top: 2px; }
        /* ── Separadores ── */
        .p-redline { border: none; border-top: 2.5px solid #c0392b; margin: 4px 0; }
        .p-hr { border: none; border-top: 1px solid #ddd; margin: 4px 0; }
        /* ── Cliente ── */
        .p-client-block { margin: 4px 0 6px 0; }
        .p-client-name { font-size: 11px; font-weight: 900; color: #c0392b; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.3px; }
        .p-client-row { font-size: 7.5px; color: #444; margin-bottom: 1px; line-height: 1.4; }
        .p-client-lbl { font-weight: 700; color: #222; }
        /* ── Dos columnas ── */
        .p-two-col { display: flex; gap: 14px; margin: 4px 0; }
        .p-col-works { flex: 1.3; }
        .p-col-pricing { flex: 1; }
        .p-section-title { font-size: 7.5px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; color: #0d2244; border-bottom: 1.5px solid #0d2244; padding-bottom: 2px; margin-bottom: 4px; }
        .p-work-item { display: flex; gap: 3px; font-size: 8px; margin-bottom: 2px; line-height: 1.4; }
        .p-work-bullet { color: #c0392b; font-weight: 900; flex-shrink: 0; }
        /* ── Precios ── */
        .p-price-item { display: flex; justify-content: space-between; font-size: 8px; margin-bottom: 2px; gap: 4px; }
        .p-price-desc { flex: 1; }
        .p-price-val { font-weight: 600; white-space: nowrap; }
        .p-totals { border-top: 1.5px solid #ddd; padding-top: 4px; margin-top: 4px; }
        .p-total-line { display: flex; justify-content: space-between; font-size: 8.5px; margin-bottom: 2px; }
        .p-total-line.iva { color: #555; }
        .p-total-final { display: flex; justify-content: space-between; font-size: 10px; font-weight: 900; color: #0d2244; border-top: 2px solid #0d2244; padding-top: 3px; margin-top: 2px; }
        .p-total-mxn { display: flex; justify-content: space-between; font-size: 8px; font-weight: 700; color: #555; margin-top: 2px; padding-top: 2px; border-top: 1px dashed #ddd; }
        /* ── Letras y observaciones ── */
        .p-letras { font-size: 7.5px; font-style: italic; color: #444; margin: 3px 0 5px 0; }
        .p-obs-two-col { display: flex; gap: 14px; margin: 4px 0; }
        .p-obs-two-col > div { flex: 1; }
        .p-obs-pre { font-family: Arial, sans-serif; font-size: 7.5px; white-space: pre-wrap; color: #444; margin: 2px 0; line-height: 1.4; }
        /* ── Políticas ── */
        .p-policies { margin: 4px 0; }
        .p-policy-line { font-size: 7.5px; font-weight: 700; color: #c0392b; margin-bottom: 1px; }
        /* ── Footer ── */
        .p-footer { border-top: 1px solid #ddd; padding-top: 5px; margin-top: 8px; display: flex; flex-direction: row; align-items: center; justify-content: space-between; gap: 10px; }
        .p-footer-logo { flex: 1; display: flex; align-items: center; justify-content: center; order: 2; }
        .p-footer-info { flex: 1; font-size: 7.5px; order: 1; }
        .p-footer-name { font-weight: 900; color: #0d2244; font-size: 8.5px; }
        .p-footer-detail { color: #555; margin-top: 1px; }
        .p-footer-web { font-size: 7.5px; color: #c0392b; font-weight: 700; margin-top: 2px; }
        /* ── QR ── */
        .p-footer-qr { flex: 1; display: flex; flex-direction: column; align-items: flex-end; gap: 2px; order: 3; }
        .p-qr-img { width: 70px; height: 70px; display: block; }
        .p-qr-label { font-size: 6px; color: #888; text-align: center; }
      `}</style>
    </div>
  );
}
