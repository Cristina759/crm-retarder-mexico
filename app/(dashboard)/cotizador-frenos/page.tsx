'use client';

import { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import { 
  Loader2, RefreshCw, Check, FileText, Printer, Mail, 
  ChevronDown, X, Trash2, Plus, Search, AlertCircle 
} from 'lucide-react';
import { crearCotizacion, buscarEmpresas, type EmpresaBusquedaResult } from '@/app/actions/cotizaciones';
import { obtenerUsuarios } from '@/app/actions/usuarios';
import { obtenerClientes } from '@/app/actions/clientes';
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
    id: 'P10', nombre: 'P10', tonelaje: 'Vehículos 24 a 44 Ton',
    marcas: [
      { id: 'pentar',   label: 'PENTAR',   nm: 2605, componentes: mkComp(8842.73, 844.76, 779.03, 533.48) },
      { id: 'frenelsa', label: 'FRENELSA', nm: 3300, componentes: mkComp(8005.49, 802.00, 779.03, 533.48) },
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
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
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
          ? 'border-yellow-400 shadow-lg shadow-yellow-100'
          : 'border-gray-200 hover:border-yellow-300 hover:shadow-md'
      }`}
    >
      {/* Header oscuro */}
      <div className="bg-[#0f2d55] px-4 py-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {seleccionado && (
            <div className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0">
              <Check size={11} className="text-[#0f2d55]" strokeWidth={3} />
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

  const [folio,         setFolio]        = useState('');
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
  const [politicas, setPoliticas] = useState(
    `*COTIZACIÓN VÁLIDA POR 15 DÍAS\n*GARANTÍA DE 30 DÍAS EN MANO DE OBRA`
  );

  const [guardando,    setGuardando]    = useState(false);
  const [guardadoOk,   setGuardadoOk]  = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

  const [qrDataUrl,    setQrDataUrl]   = useState('');

  const [empresa,      setEmpresa]      = useState('');
  const [empresaId,    setEmpresaId]    = useState('');
  const [sugerenciasEmpresa, setSugerenciasEmpresa] = useState<EmpresaBusquedaResult[]>([]);
  const [buscandoEmpresa, setBuscandoEmpresa] = useState(false);
  const [rfc,          setRfc]          = useState('');
  const [direccion,    setDireccion]    = useState('');
  const [emailCliente, setEmailCliente] = useState('');
  const [sucursal,     setSucursal]     = useState('');
  const [descripcion,  setDescripcion]  = useState('');

  const [todosLosClientes, setTodosLosClientes] = useState<EmpresaBusquedaResult[]>([]);
  const [mostrarTodos, setMostrarTodos] = useState(false);

  void usuarios; // cargado para uso futuro (vendedores)

  const cargarTodosLosClientes = async () => {
    setBuscandoEmpresa(true);
    const { data, error } = await obtenerClientes();
    if (!error && data) {
      setTodosLosClientes(data.map(c => ({
        id: c.id,
        nombre_comercial: c.nombre_comercial || c.razon_social || 'Sin nombre',
        rfc: c.rfc,
        email: c.email,
        telefono: c.telefono
      })));
    }
    setBuscandoEmpresa(false);
  };

  // ── Fetch TC DOF — cascade: DOF → Banxico → paginasweb + caché localStorage ─
  const [modoResumido, setModoResumido] = useState(false);

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
    setFolio(generarFolio());
    setFechaHoy(new Date().toLocaleDateString('es-MX', { day:'2-digit', month:'long', year:'numeric' }));
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
  const [fechaHoy, setFechaHoy] = useState('');

  // ── Guardar ─────────────────────────────────────────────────────────────────
  const handleGuardar = async () => {
    if (!marcaActual)    { setErrorGuardar('Selecciona un modelo de freno.'); return; }

    setGuardando(true);
    setErrorGuardar(null);
    setGuardadoOk(false);

    try {
      const { data, error } = await crearCotizacion({
        folio:          folio.trim() !== '' ? folio.trim() : undefined,
        empresa_id:     empresaId || undefined,
        empresa_nombre: empresa.trim(),
        vendedor_id:    null,
        tipo:           `frenos-${modeloState!.id}-${modeloState!.marcaSelId}`,
        subtotal:       Math.round(baseIVA * 100) / 100,
        iva:            Math.round(iva * 100) / 100,
        total_mxn:      Math.round(totalMXN * 100) / 100,
        notas: [
          atencionA.trim()    ? `ATENCION_A: ${atencionA.trim()}`    : '',
          emailCliente.trim() ? `EMAIL: ${emailCliente.trim()}`       : '',
          descripcion.trim()  ? `DESCRIPCION: ${descripcion.trim()}`  : '',
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
          notasCot  ? `OBSERVACIONES:\n${notasCot}` : '',
          politicas ? `POLITICAS:\n${politicas}` : '',
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
      
      {/* Título de la página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#0f2d55] tracking-tight">Cotizador de Frenos</h1>
          <p className="text-gray-500 text-sm font-medium">Configura y genera cotizaciones premium para retardadores</p>
        </div>
        
        {/* Header: solo TC */}
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

        {/* Sucursal + Descripción */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block mb-1">Sucursal</label>
            <input
              type="text" value={sucursal} onChange={e => setSucursal(e.target.value)}
              placeholder="Ej. CDMX, Monterrey..."
              className="w-full border border-gray-300 rounded-xl px-3 h-10 text-sm font-semibold text-gray-800 outline-none focus:border-red-400 transition-colors placeholder:text-gray-300"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block mb-1">Descripción de la Cotización</label>
            <input
              type="text" value={descripcion} onChange={e => setDescripcion(e.target.value)}
              placeholder="Ej. Freno P10 para unidad..."
              className="w-full border border-gray-300 rounded-xl px-3 h-10 text-sm font-semibold text-gray-800 outline-none focus:border-red-400 transition-colors placeholder:text-gray-300"
            />
          </div>

        </div>


        {/* Datos adicionales del cliente */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1 flex items-center gap-1">
              Empresa / Razón social
              {empresaId && <span className="text-[10px] font-bold text-green-600">✓</span>}
            </label>
            <div className="relative">
              <input
                type="text"
                value={empresa}
                onFocus={() => {
                  if (todosLosClientes.length === 0) cargarTodosLosClientes();
                }}
                onChange={async e => {
                  const q = e.target.value;
                  setEmpresa(q);
                  setEmpresaId('');
                  setMostrarTodos(false);
                  if (q.length >= 2) {
                    setBuscandoEmpresa(true);
                    const res = await buscarEmpresas(q);
                    setSugerenciasEmpresa(res);
                    setBuscandoEmpresa(false);
                  } else {
                    setSugerenciasEmpresa([]);
                  }
                }}
                placeholder="Busca y selecciona un cliente..."
                className={`w-full border rounded-xl pl-3 pr-10 h-10 text-sm font-semibold outline-none transition-all ${
                  !empresaId && empresa.length > 0 
                    ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-400' 
                    : empresaId 
                      ? 'border-green-300 bg-green-50/10 text-gray-800 focus:border-green-400'
                      : 'border-gray-300 text-gray-800 focus:border-red-400'
                }`}
              />
              <button
                type="button"
                onClick={async () => {
                  if (sugerenciasEmpresa.length > 0) {
                    setSugerenciasEmpresa([]);
                  } else {
                    setBuscandoEmpresa(true);
                    const res = await buscarEmpresas('');
                    setSugerenciasEmpresa(res);
                    setBuscandoEmpresa(false);
                    setEmpresaId('');
                  }
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors p-1"
              >
                <ChevronDown size={18} className={`transition-transform ${sugerenciasEmpresa.length > 0 ? 'rotate-180 text-red-600' : ''}`} />
              </button>
              {buscandoEmpresa && <Loader2 size={13} className="absolute right-10 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}

              {/* Submenú: Sugerencias de búsqueda */}
              {sugerenciasEmpresa.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                  <div className="p-2 border-b border-gray-50 bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex justify-between items-center">
                    <span>Seleccionar Cliente</span>
                    <button onClick={() => setSugerenciasEmpresa([])} className="text-gray-400 hover:text-red-600"><X size={14} /></button>
                  </div>
                  {sugerenciasEmpresa.map(emp => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => {
                        setEmpresa(emp.nombre_comercial);
                        setEmpresaId(emp.id);
                        if (!emailCliente && emp.email) setEmailCliente(emp.email);
                        setSugerenciasEmpresa([]);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-red-50 group transition-colors flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-bold text-gray-800 group-hover:text-red-700">{emp.nombre_comercial}</p>
                        {emp.rfc && <p className="text-[10px] text-gray-400">{emp.rfc}</p>}
                      </div>
                      {empresaId === emp.id ? <Check size={14} className="text-red-500" /> : <Check size={14} className="text-red-500 opacity-0 group-hover:opacity-100" />}
                    </button>
                  ))}
                </div>
              )}

              {/* Submenú: Todos los clientes */}
              {mostrarTodos && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                  <div className="p-2 border-b border-gray-50 bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex justify-between items-center">
                    <span>Todos los clientes</span>
                    {buscandoEmpresa && <Loader2 size={10} className="animate-spin" />}
                  </div>
                  {todosLosClientes.length > 0 ? (
                    todosLosClientes.map(emp => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => {
                          setEmpresa(emp.nombre_comercial);
                          setEmpresaId(emp.id);
                          if (!emailCliente && emp.email) setEmailCliente(emp.email);
                          setMostrarTodos(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-red-50 group transition-colors border-b border-gray-50 last:border-0"
                      >
                        <p className="text-sm font-bold text-gray-800 group-hover:text-red-700">{emp.nombre_comercial}</p>
                        {emp.rfc && <p className="text-[10px] text-gray-400">{emp.rfc}</p>}
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-gray-400">Cargando clientes...</div>
                  )}
                </div>
              )}
            </div>
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

        {/* Políticas */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block mb-1">Políticas y Garantías</label>
          <textarea
            value={politicas}
            onChange={e => setPoliticas(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-[10px] text-gray-800 outline-none focus:border-red-400 transition-colors resize-none font-mono"
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
        <div className="flex flex-col gap-2">
          {!empresaId && empresa.trim().length > 0 && (
            <p className="text-[10px] text-red-600 font-bold text-right animate-pulse">Debes seleccionar un cliente de la lista para continuar</p>
          )}
          {!marcaActual && (
            <p className="text-[10px] text-amber-600 font-bold text-right">Selecciona una marca y modelo para cotizar</p>
          )}
          <button
            onClick={handleGuardar}
            disabled={guardando || !marcaActual || !empresaId}
            className={`w-full h-14 font-black text-base rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 ${
              guardando || !marcaActual || !empresaId
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                : 'bg-red-600 hover:bg-red-700 text-white shadow-red-200'
            }`}
          >
            {guardando
              ? <><Loader2 size={20} className="animate-spin" /> GUARDANDO...</>
              : <><FileText size={20} /> GENERAR COTIZACIÓN</>
            }
          </button>
        </div>
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
                    style={{ width: '200px', height: 'auto', objectFit: 'contain' }}
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
              {sucursal && <div className="p-fecha-line">Sucursal: <strong>{sucursal}</strong></div>}
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
              {descripcion && <div className="p-client-row"><span className="p-client-lbl">Descripción:</span> {descripcion}</div>}
            </div>

            <hr className="p-hr" />

            {/* Dos columnas */}
            <div className="p-two-col">

              {/* Columna izquierda: trabajos */}
              <div className="p-col-works">
                <div className="p-section-title">Incluye los siguientes trabajos</div>
                <div className="p-work-item">
                  <span className="p-work-bullet">▸</span>
                  <span><strong>{modoResumido ? `Kit de Freno Retarder ${modeloBaseData.nombre} — Instalación Completa` : `Freno Retarder ${modeloBaseData.nombre} — ${marcaActual.label} (${marcaActual.nm} Nm)`}</strong></span>
                </div>
                {!modoResumido && (
                  <>
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
                  </>
                )}

                {trasladoN > 0 && <div className="p-work-item"><span className="p-work-bullet">·</span><span>Traslado</span></div>}
                {manoObraN > 0 && <div className="p-work-item"><span className="p-work-bullet">·</span><span>Mano de obra (instalación)</span></div>}
                {kitLedN > 0 && <div className="p-work-item"><span className="p-work-bullet">·</span><span>Kit LED</span></div>}
                <div style={{ marginTop: '8px', fontSize: '13px', color: '#444' }}>
                  Unidades: <strong>{unidadesN}</strong>
                </div>
              </div>

              {/* Columna derecha: desglose económico */}
              <div className="p-col-pricing">
                <div className="p-section-title">Desglose económico</div>
                {modoResumido ? (
                  <div className="p-price-item">
                    <span className="p-price-desc">Kit Retarder Completo (Instalación e Insumos)</span>
                    <span className="p-price-val">${fmt(subtotalUSD)} USD</span>
                  </div>
                ) : (
                  marcaActual.componentes.filter(c => c.activo).map(c => (
                    <div key={c.id} className="p-price-item">
                      <span className="p-price-desc">{c.nombre}</span>
                      <span className="p-price-val">${fmt(c.precio * unidadesN)} USD</span>
                    </div>
                  ))
                )}

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
            <div className="p-letras"><strong>SON: {numeroALetras(totalFinalUSD)}</strong></div>


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
              <pre className="p-obs-pre" style={{ color: '#c0392b', fontWeight: 700 }}>{politicas}</pre>
            </div>

            <hr className="p-hr" />

            {/* Spacer para empujar footer al fondo */}
            <div className="p-spacer" />

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
                <div className="p-footer-name">Ing. Cristina Velasco</div>
                <div className="p-footer-detail">Área de Ventas &nbsp;|&nbsp; ventasyservicio@tgrpentarmexico.com</div>
                <div className="p-footer-detail">Tel: +52 55 7372 1633</div>
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
        @page { size: A4 portrait; margin: 5mm; }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
          }
          header, nav, footer, aside { display: none !important; }
          body * { visibility: hidden !important; }
          #print-area, #print-area * { visibility: visible !important; }
          #print-area {
            display: flex !important;
            flex-direction: column !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            background: white !important;
          }
          .p-doc {
            flex: 1 !important;
            display: flex !important;
            flex-direction: column !important;
            visibility: visible !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 4px !important;
            box-sizing: border-box !important;
          }
          .p-header { align-items: center !important; }
          .p-logo-img { max-width: 250px !important; width: 250px !important; }
          .p-spacer { flex: 1 !important; display: block !important; }
          .p-total-mxn { display: none !important; }
          .no-print { display: none !important; }
        }
        /* ── Documento ── */
        .p-doc { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 4px 0; box-sizing: border-box; background: #fff; width: 100%; display: flex; flex-direction: column; min-height: 277mm; }
        /* ── Header ── */
        .p-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .p-logos-left { display: flex; align-items: center; gap: 12px; }
        .p-logo-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .p-logo-img { width: 250px; height: auto; object-fit: contain; display: block; }
        .p-logo-fallback { font-size: 13px; font-weight: 900; color: #0d2244; text-align: center; line-height: 1.25; display: none; }
        .p-logo-divider { width: 1px; height: 60px; background: #ddd; margin: 0 6px; flex-shrink: 0; }
        .p-header-right { text-align: right; }
        .p-company { font-size: 24px; font-weight: 900; color: #0d2244; letter-spacing: 0.5px; }
        .p-doc-title { font-size: 14px; font-weight: 700; color: #0d2244; margin-top: 3px; }
        .p-fecha-line { font-size: 11px; color: #555; margin-top: 3px; }
        /* ── Separadores ── */
        .p-redline { border: none; border-top: 3px solid #c0392b; margin: 7px 0; }
        .p-hr { border: none; border-top: 1px solid #ddd; margin: 8px 0; }
        /* ── Cliente ── */
        .p-client-block { margin: 7px 0 10px 0; }
        .p-client-name { font-size: 16px; font-weight: 900; color: #c0392b; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.3px; }
        .p-client-row { font-size: 11px; color: #444; margin-bottom: 2px; line-height: 1.4; }
        .p-client-lbl { font-weight: 700; color: #222; }
        /* ── Dos columnas ── */
        .p-two-col { display: flex; gap: 20px; margin: 8px 0; }
        .p-col-works { flex: 1.3; }
        .p-col-pricing { flex: 1; }
        .p-section-title { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; color: #0d2244; border-bottom: 2px solid #0d2244; padding-bottom: 4px; margin-bottom: 8px; }
        .p-work-item { display: flex; gap: 6px; font-size: 11px; margin-bottom: 4px; line-height: 1.3; }
        .p-work-bullet { color: #c0392b; font-weight: 900; flex-shrink: 0; }
        /* ── Precios ── */
        .p-price-item { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; gap: 8px; }
        .p-price-desc { flex: 1; }
        .p-price-val { font-weight: 600; white-space: nowrap; }
        .p-totals { border-top: 2px solid #ddd; padding-top: 8px; margin-top: 8px; }
        .p-total-line { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 5px; }
        .p-total-line.iva { color: #555; }
        .p-total-final { display: flex; justify-content: space-between; font-size: 17px; font-weight: 900; color: #0d2244; border-top: 2.5px solid #0d2244; padding-top: 7px; margin-top: 5px; }
        .p-total-mxn { display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; color: #555; margin-top: 5px; padding-top: 5px; border-top: 1px dashed #ddd; }
        /* ── Letras y observaciones ── */
        .p-letras { font-size: 11px; font-style: italic; font-weight: 700; color: #444; margin: 6px 0 8px 0; }
        .p-obs-two-col { display: flex; gap: 20px; margin: 8px 0; }
        .p-obs-two-col > div { flex: 1; }
        .p-obs-pre { font-family: Arial, sans-serif; font-size: 11px; white-space: pre-wrap; color: #444; margin: 3px 0; line-height: 1.5; }
        /* ── Políticas ── */
        .p-policies { margin: 6px 0; }
        .p-policy-line { font-size: 11px; font-weight: 700; color: #c0392b; margin-bottom: 4px; }
        /* ── Footer ── */
        .p-footer { border-top: 1px solid #ddd; padding-top: 10px; margin-top: 10px; display: flex; flex-direction: row; align-items: center; justify-content: space-between; gap: 14px; }
        .p-footer-logo { flex: 1; display: flex; align-items: center; justify-content: center; order: 2; }
        .p-footer-info { flex: 1; font-size: 11px; order: 1; }
        .p-footer-name { font-weight: 900; color: #0d2244; font-size: 13px; }
        .p-footer-detail { color: #555; margin-top: 2px; }
        .p-footer-web { font-size: 11px; color: #c0392b; font-weight: 700; margin-top: 3px; }
        /* ── QR ── */
        .p-footer-qr { flex: 1; display: flex; flex-direction: column; align-items: flex-end; gap: 3px; order: 3; }
        .p-qr-img { width: 80px; height: 80px; display: block; }
        .p-qr-label { font-size: 9px; color: #888; text-align: center; }
        /* ── Spacer ── */
        .p-spacer { flex: 1; min-height: 4mm; }
      `}</style>
    </div>
  );
}
