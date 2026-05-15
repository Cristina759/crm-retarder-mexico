'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import QRCode from 'qrcode';
import { Loader2, RefreshCw, Check, FileText, Plus, Trash2, Shield, Wrench, Printer, Mail, X, Search, BookOpen, ChevronDown } from 'lucide-react';
import { crearCotizacion, buscarEmpresas, type EmpresaBusquedaResult } from '@/app/actions/cotizaciones';
import { obtenerClientes } from '@/app/actions/clientes';
import { obtenerUsuarios } from '@/app/actions/usuarios';
import { obtenerManoDeObra, obtenerRefacciones } from '@/app/actions/catalogos';
import type { UsuarioRow } from '@/app/actions/types';
import type { ManoDeObraRow, RefaccionRow } from '@/app/actions/catalogos';

// ── Constantes ────────────────────────────────────────────────────────────────
const PRECIO_PREVENTIVO_MXN = 4250; // precio fijo en PESOS MEXICANOS

const CHECKLIST_PREVENTIVO = [
  {
    categoria: 'SISTEMA MECÁNICO',
    items: [
      'Torque a tornillera',
      'Limpieza de panel de conexiones',
      'Placas laterales',
      'Hules y tornillera en general',
      'Revisión cardanes y crucetas',
    ],
  },
  {
    categoria: 'SISTEMA ELÉCTRICO',
    items: [
      'Palanca control',
      'Foco piloto',
      'Interruptor',
      'Relay de corte',
      'Arneses de control y terminales',
      'Sensor de velocidad',
      'Sistema neumático',
    ],
  },
  {
    categoria: 'SISTEMA DE BATERÍAS',
    items: ['Caja de contactores', 'Maza y positivo', 'Block de conexiones'],
  },
];

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface LineaServicio {
  id: string;
  descripcion: string;
  precio: number; // MXN por unidad
  cantidad: number;
}

type ModalTab = 'mo' | 'ref';

const CATS_MO  = ['TODOS', 'ELÉCTRICO', 'NEUMÁTICO', 'MECÁNICO'] as const;
const CATS_REF = ['TODOS', 'ELÉCTRICO', 'NEUMÁTICO', 'TORNILLERÍA'] as const;

// ── Modal Catálogo ────────────────────────────────────────────────────────────
function ModalCatalogo({
  tab,
  onTabChange,
  catalogoMO,
  catalogoRef,
  cargandoCatalogo,
  onAgregarMO,
  onAgregarRef,
  onClose,
}: {
  tab: ModalTab;
  onTabChange: (t: ModalTab) => void;
  catalogoMO: ManoDeObraRow[];
  catalogoRef: RefaccionRow[];
  cargandoCatalogo: boolean;
  onAgregarMO: (item: ManoDeObraRow) => void;
  onAgregarRef: (item: RefaccionRow) => void;
  onClose: () => void;
}) {
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState<string>('TODOS');

  // Reset filtros al cambiar tab
  useEffect(() => {
    setBusqueda('');
    setCategoria('TODOS');
  }, [tab]);

  const filtradosMO = useMemo(() => {
    return catalogoMO.filter(item => {
      const matchCat  = categoria === 'TODOS' || item.categoria === categoria;
      const matchBusc = !busqueda || item.nombre.toLowerCase().includes(busqueda.toLowerCase()) || item.categoria.toLowerCase().includes(busqueda.toLowerCase());
      return matchCat && matchBusc;
    });
  }, [catalogoMO, busqueda, categoria]);

  const filtradosRef = useMemo(() => {
    return catalogoRef.filter(item => {
      const matchCat  = categoria === 'TODOS' || item.categoria === categoria;
      const matchBusc = !busqueda || item.nombre.toLowerCase().includes(busqueda.toLowerCase()) || item.categoria.toLowerCase().includes(busqueda.toLowerCase());
      return matchCat && matchBusc;
    });
  }, [catalogoRef, busqueda, categoria]);

  const cats     = tab === 'mo' ? CATS_MO : CATS_REF;
  const items    = tab === 'mo' ? filtradosMO : filtradosRef;
  const cantidad = items.length;

  // Colores por categoría
  const catColor: Record<string, string> = {
    'ELÉCTRICO':   'bg-yellow-100 text-yellow-800',
    'NEUMÁTICO':   'bg-blue-100 text-blue-800',
    'MECÁNICO':    'bg-gray-100 text-gray-700',
    'TORNILLERÍA': 'bg-orange-100 text-orange-800',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl" style={{ maxHeight: '85vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-[#0f2d55]" />
            <h2 className="font-black text-base text-[#0f2d55]">Catálogo de Servicios</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => onTabChange('mo')}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${
              tab === 'mo'
                ? 'border-b-2 border-[#0f2d55] text-[#0f2d55]'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Wrench size={14} className="inline mr-1.5" />
            Mano de Obra
          </button>
          <button
            onClick={() => onTabChange('ref')}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${
              tab === 'ref'
                ? 'border-b-2 border-[#0f2d55] text-[#0f2d55]'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Shield size={14} className="inline mr-1.5" />
            Refacciones
          </button>
        </div>

        {/* Buscador */}
        <div className="px-4 pt-3 pb-2 space-y-2">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 h-10">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o categoría…"
              className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400"
            />
            {busqueda && (
              <button onClick={() => setBusqueda('')} className="text-gray-400 hover:text-gray-600">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filtros categoría */}
          <div className="flex gap-1.5 flex-wrap">
            {cats.map(c => (
              <button
                key={c}
                onClick={() => setCategoria(c)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                  categoria === c
                    ? 'bg-[#0f2d55] text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {c}
              </button>
            ))}
            <span className="ml-auto text-[10px] text-gray-400 self-center">{cantidad} item{cantidad !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1.5">
          {cargandoCatalogo ? (
            <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Cargando catálogo…</span>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              No se encontraron resultados
            </div>
          ) : tab === 'mo' ? (
            (items as ManoDeObraRow[]).map(item => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 leading-snug">{item.nombre}</p>
                  <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${catColor[item.categoria] ?? 'bg-gray-100 text-gray-600'}`}>
                    {item.categoria}
                  </span>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black text-[#0f2d55]">
                    {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(item.precio)}
                  </p>
                  <p className="text-[9px] text-gray-400">MXN</p>
                </div>
                <button
                  onClick={() => onAgregarMO(item)}
                  className="w-8 h-8 rounded-xl bg-[#0f2d55] hover:bg-[#1a4a7a] text-white flex items-center justify-center flex-shrink-0 transition-colors opacity-0 group-hover:opacity-100"
                  title="Agregar"
                >
                  <Plus size={15} strokeWidth={3} />
                </button>
              </div>
            ))
          ) : (
            (items as RefaccionRow[]).map(item => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/30 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 leading-snug">{item.nombre}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${catColor[item.categoria] ?? 'bg-gray-100 text-gray-600'}`}>
                      {item.categoria}
                    </span>
                    {item.numero_parte && (
                      <span className="text-[10px] text-gray-400">#{item.numero_parte}</span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black text-[#0f2d55]">
                    {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 }).format(item.precio_venta)}
                  </p>
                  <p className="text-[9px] text-gray-400">MXN s/IVA</p>
                </div>
                <button
                  onClick={() => onAgregarRef(item)}
                  className="w-8 h-8 rounded-xl bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center flex-shrink-0 transition-colors opacity-0 group-hover:opacity-100"
                  title="Agregar"
                >
                  <Plus size={15} strokeWidth={3} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function generarFolio() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const r = Math.floor(Math.random() * 900) + 100;
  return `SRV-${y}${m}${d}-${r}`;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function fmt(n: number, dec = 2) {
  return n.toLocaleString('es-MX', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function fmtMXN(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function numeroALetras(nInput: number): string {
  const n = Math.round(nInput * 100) / 100;
  const unidades = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE',
    'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS',
    'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
  function menor1000(x: number): string {
    if (x === 0) return '';
    if (x === 100) return 'CIEN';
    if (x < 20) return unidades[x];
    if (x < 100) {
      const dv = Math.floor(x / 10), uv = x % 10;
      return uv === 0 ? decenas[dv] : `${decenas[dv]} Y ${unidades[uv]}`;
    }
    const c = Math.floor(x / 100);
    const r = x % 100;
    return r === 0 ? centenas[c] : `${centenas[c]} ${menor1000(r)}`;
  }
  const entero = Math.floor(n);
  const cents = Math.round((n - entero) * 100);
  const miles = Math.floor(entero / 1000);
  const resto = entero % 1000;
  let letras = '';
  if (miles === 1) letras = 'MIL';
  else if (miles > 1) letras = `${menor1000(miles)} MIL`;
  if (resto > 0) letras += (letras ? ' ' : '') + menor1000(resto);
  if (!letras) letras = 'CERO';
  return `${letras} PESOS ${String(cents).padStart(2, '0')}/100 MXN`;
}

// ── Componente: tarjeta de líneas (mano de obra / refacciones) ────────────────
function CardLineas({
  titulo,
  lineas,
  onAdd,
  onRemove,
  onChange,
  onAbrirCatalogo,
  accentColor = 'blue',
}: {
  titulo: string;
  lineas: LineaServicio[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, field: 'descripcion' | 'precio' | 'cantidad', value: string) => void;
  onAbrirCatalogo?: () => void;
  accentColor?: 'blue' | 'orange';
}) {
  const btnCat = accentColor === 'orange'
    ? 'bg-orange-500 hover:bg-orange-600'
    : 'bg-[#0f2d55] hover:bg-[#1a4a7a]';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-700">{titulo}</p>
        <div className="flex items-center gap-1.5">
          {onAbrirCatalogo && (
            <button
              onClick={onAbrirCatalogo}
              className={`flex items-center gap-1 px-2.5 py-1.5 ${btnCat} text-white rounded-xl text-[11px] font-bold transition-colors`}
            >
              <BookOpen size={11} strokeWidth={2.5} /> Catálogo
            </button>
          )}
          <button
            onClick={onAdd}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-[11px] font-bold transition-colors"
          >
            <Plus size={11} strokeWidth={3} /> Manual
          </button>
        </div>
      </div>

      {lineas.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-3 italic">Sin líneas agregadas</p>
      ) : (
        <div className="space-y-2">
          {lineas.map(l => (
            <div key={l.id} className="flex items-center gap-2">
              <input
                type="text"
                value={l.descripcion}
                onChange={e => onChange(l.id, 'descripcion', e.target.value)}
                placeholder="Descripción..."
                className="flex-1 border border-gray-200 rounded-xl px-3 h-9 text-xs text-gray-800 outline-none focus:border-blue-400 transition-colors"
              />
              {/* Cantidad */}
              <div className="flex items-center gap-1 border border-gray-200 rounded-xl px-2 h-9 w-16 focus-within:border-blue-400 transition-colors">
                <span className="text-[9px] text-gray-400">×</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={l.cantidad || 1}
                  onChange={e => onChange(l.id, 'cantidad', e.target.value)}
                  className="flex-1 outline-none text-xs text-gray-800 font-semibold bg-transparent w-full"
                />
              </div>
              {/* Precio unitario */}
              <div className="flex items-center gap-1 border border-gray-200 rounded-xl px-2.5 h-9 w-28 focus-within:border-blue-400 transition-colors">
                <span className="text-[10px] text-gray-400 font-semibold">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={l.precio || ''}
                  onChange={e => onChange(l.id, 'precio', e.target.value)}
                  placeholder="0.00"
                  className="flex-1 outline-none text-xs text-gray-800 font-semibold bg-transparent"
                />
              </div>
              {/* Total línea */}
              <span className="text-[11px] font-bold text-gray-600 w-20 text-right whitespace-nowrap">
                {fmtMXN((l.precio || 0) * (l.cantidad || 1))}
              </span>
              <button
                onClick={() => onRemove(l.id)}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {lineas.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex justify-end">
          <span className="text-xs font-bold text-gray-700">
            Subtotal: {fmtMXN(lineas.reduce((s, l) => s + (l.precio || 0) * (l.cantidad || 1), 0))} MXN
          </span>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CotizadorServiciosPage() {
  const [tc, setTc] = useState<number>(0);
  const [tcFecha, setTcFecha] = useState('');
  const [cargandoTC, setCargandoTC] = useState(false);

  const [cliente, setCliente] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [empresaId, setEmpresaId] = useState('');
  const [sugerenciasEmpresa, setSugerenciasEmpresa] = useState<EmpresaBusquedaResult[]>([]);
  const [buscandoEmpresa, setBuscandoEmpresa] = useState(false);
  const [todosLosClientes, setTodosLosClientes] = useState<EmpresaBusquedaResult[]>([]);
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [rfc, setRfc] = useState('');
  const [direccion, setDireccion] = useState('');
  const [emailCliente, setEmailCliente] = useState('');
  const [sucursal, setSucursal] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [folio, setFolio] = useState('');

  // Tipos de servicio (pueden coexistir)
  const [tipoPreventivo, setTipoPreventivo] = useState(false);
  const [tipoCorrectivo, setTipoCorrectivo] = useState(false);

  // Líneas de mano de obra y refacciones
  const [lineasManoObra, setLineasManoObra] = useState<LineaServicio[]>([]);
  const [lineasRefacciones, setLineasRefacciones] = useState<LineaServicio[]>([]);

  // Personalizar servicio
  const [unidades, setUnidades] = useState('1');
  const [traslado, setTraslado] = useState('0');
  const [observaciones, setObservaciones] = useState(
    `*ESTE SERVICIO INCLUYE LOS PUNTOS DESCRITOS EN EL CHECKLIST\n*TIEMPO ESTIMADO DE REALIZACIÓN: 4 A 6 HORAS POR UNIDAD\n*EL CLIENTE DEBE PROPORCIONAR EL ESPACIO ADECUADO SI EL SERVICIO ES EN SITIO\n*SE REQUIERE CONFIRMACIÓN DE CITA CON 48 HORAS DE ANTICIPACIÓN`
  );
  const [politicas, setPoliticas] = useState(
    `*COTIZACIÓN VÁLIDA POR 15 DÍAS\n*GARANTÍA DE 30 DÍAS EN MANO DE OBRA`
  );

  const [imprimirAlGuardar, setImprimirAlGuardar] = useState(false);

  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);

  const [qrDataUrl, setQrDataUrl] = useState('');

  const [guardando, setGuardando] = useState(false);
  const [guardadoOk, setGuardadoOk] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

  // ── Catálogo (MO + Refacciones) ─────────────────────────────────────────────
  const [catalogoMO, setCatalogoMO] = useState<ManoDeObraRow[]>([]);
  const [catalogoRef, setCatalogoRef] = useState<RefaccionRow[]>([]);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalTab, setModalTab] = useState<ModalTab>('mo');

  // ── Fetch tipo de cambio DOF — igual que cotizador-frenos ──────────────────
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

  const cargarTodosLosClientes = async () => {
    setBuscandoEmpresa(true);
    const { data, error } = await obtenerClientes();
    if (!error && data) {
      setTodosLosClientes(data.map(c => ({
        id: c.id,
        nombre_comercial: c.nombre_comercial || c.razon_social || 'Sin nombre',
        rfc: c.rfc,
        email: c.email,
        telefono: c.telefono,
      })));
    }
    setBuscandoEmpresa(false);
  };

  useEffect(() => {
    setFolio(generarFolio());
    setFechaHoy(new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }));
    fetchTC();
    obtenerUsuarios().then(({ data }) => setUsuarios(data));
    QRCode.toDataURL('https://tgrpentarmexico.com/', { width: 140, margin: 1 }).then(setQrDataUrl);

    // Cargar catálogos al montar
    setCargandoCatalogo(true);
    Promise.all([obtenerManoDeObra(), obtenerRefacciones()]).then(([mo, ref]) => {
      setCatalogoMO(mo.data);
      setCatalogoRef(ref.data);
      setCargandoCatalogo(false);
    });
  }, [fetchTC]);

  // Evitar advertencia de variable no usada
  void usuarios;

  // ── Helpers modal catálogo ──────────────────────────────────────────────────
  const abrirModal = (tab: ModalTab) => {
    setModalTab(tab);
    setModalAbierto(true);
  };

  const agregarDesdeCatalogoMO = (item: ManoDeObraRow) => {
    setLineasManoObra(prev => [...prev, { id: uid(), descripcion: item.nombre, precio: item.precio, cantidad: 1 }]);
  };

  const agregarDesdeCatalogoRef = (item: RefaccionRow) => {
    setLineasRefacciones(prev => [...prev, { id: uid(), descripcion: item.nombre, precio: item.precio_venta, cantidad: 1 }]);
  };

  // ── Helpers de líneas ───────────────────────────────────────────────────────
  const addLinea = (setter: React.Dispatch<React.SetStateAction<LineaServicio[]>>) => {
    setter(prev => [...prev, { id: uid(), descripcion: '', precio: 0, cantidad: 1 }]);
  };

  const removeLinea = (setter: React.Dispatch<React.SetStateAction<LineaServicio[]>>, id: string) => {
    setter(prev => prev.filter(l => l.id !== id));
  };

  const changeLinea = (
    setter: React.Dispatch<React.SetStateAction<LineaServicio[]>>,
    id: string,
    field: 'descripcion' | 'precio' | 'cantidad',
    value: string
  ) => {
    setter(prev => prev.map(l =>
      l.id === id ? { ...l, [field]: field === 'descripcion' ? value : parseFloat(value) || 0 } : l
    ));
  };

  // ── Cálculos ─────────────────────────────────────────────────────────────────
  const unidadesN = Math.max(1, parseInt(unidades) || 1);
  const trasladoN = parseFloat(traslado) || 0;

  // Todo en MXN — sin conversión de divisas
  const subtotalPreventivoMXN = tipoPreventivo ? PRECIO_PREVENTIVO_MXN * unidadesN : 0;
  const subtotalManoObra      = lineasManoObra.reduce((s, l) => s + (l.precio || 0) * (l.cantidad || 1), 0);
  const subtotalRefacciones   = lineasRefacciones.reduce((s, l) => s + (l.precio || 0) * (l.cantidad || 1), 0);
  const subtotalTraslado       = trasladoN * unidadesN;
  const subtotalMXN           = subtotalPreventivoMXN + subtotalManoObra + subtotalRefacciones + subtotalTraslado;
  const iva                   = Math.round(subtotalMXN * 0.16 * 100) / 100;
  const totalMXN              = Math.round(subtotalMXN * 1.16 * 100) / 100;

  const tipoServicio = tipoPreventivo && tipoCorrectivo
    ? 'Servicio Mixto'
    : tipoPreventivo
    ? 'Preventivo'
    : tipoCorrectivo
    ? 'Correctivo'
    : null;

  const formularioVisible = tipoPreventivo || tipoCorrectivo;
  const [fechaHoy, setFechaHoy] = useState('');

  // ── Guardar ──────────────────────────────────────────────────────────────────
  const handleGuardar = async () => {
    if (!cliente.trim()) { setErrorGuardar('Escribe el nombre del cliente.'); return; }
    if (!tipoServicio)   { setErrorGuardar('Selecciona al menos un tipo de servicio.'); return; }

    setGuardando(true);
    setErrorGuardar(null);
    setGuardadoOk(false);

    const items = {
      preventivo: tipoPreventivo,
      correctivo: tipoCorrectivo,
      unidades: unidadesN,
      traslado_usd: trasladoN,
      mano_obra: lineasManoObra.map(({ descripcion, precio, cantidad }) => ({ descripcion, precio, cantidad: cantidad || 1 })),
      refacciones: lineasRefacciones.map(({ descripcion, precio, cantidad }) => ({ descripcion, precio, cantidad: cantidad || 1 })),
    };

    try {
      const { data, error } = await crearCotizacion({
        folio:          folio.trim() !== '' ? folio.trim() : undefined,
        empresa_id:     empresaId || undefined,
        empresa_nombre: empresa.trim() || cliente.trim(),
        vendedor_id:    null,
        tipo:           'servicios',
        subtotal:       Math.round(subtotalMXN * 100) / 100,
        iva,
        total_mxn:      totalMXN,
        notas: [
          `Folio: ${folio}`,
          `Tipo: ${tipoServicio}`,
          `Unidades: ${unidadesN}`,
          emailCliente ? `Email: ${emailCliente}` : '',
          sucursal ? `Sucursal: ${sucursal}` : '',
          descripcion ? `Descripcion: ${descripcion}` : '',
          `Subtotal MXN: $${fmt(subtotalMXN)}`,
          trasladoN > 0 ? `Traslado × ${unidadesN}: $${fmt(subtotalTraslado)} MXN` : '',
          `ITEMS: ${JSON.stringify(items)}`,
          observaciones ? `OBSERVACIONES:\n${observaciones}` : '',
          politicas ? `POLITICAS:\n${politicas}` : '',
        ].filter(Boolean).join('\n'),
      });

      if (error) {
        setErrorGuardar(`Error al guardar: ${error}`);
        return;
      }

      console.log('[CotizadorServicios] cotización creada:', data?.folio);
      setGuardadoOk(true);
      setTimeout(() => setGuardadoOk(false), 4000);

      if (imprimirAlGuardar) window.print();

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrorGuardar(`Error inesperado: ${msg}`);
    } finally {
      setGuardando(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-16">

      {/* Título de la página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#0f2d55] tracking-tight">Cotizador de Servicios</h1>
          <p className="text-gray-500 text-sm font-medium">Genera cotizaciones para servicios y mantenimientos</p>
        </div>

        {/* TC DOF */}
        <div className="bg-white rounded-2xl border border-gray-200 px-4 py-3 shadow-sm flex items-center gap-4">
          <div>
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
            className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors"
            title="Actualizar tipo de cambio"
          >
            {cargandoTC ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          </button>
        </div>
      </div>

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
              type="text" value={cliente} onChange={e => setCliente(e.target.value)}
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
              placeholder="Ej. Servicio preventivo..."
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
                        setMostrarTodos(false);
                      }}
                      className="w-full text-left px-3 py-2.5 hover:bg-red-50 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <p className="text-xs font-bold text-gray-800 group-hover:text-red-700">{emp.nombre_comercial}</p>
                        {emp.rfc && <p className="text-[10px] text-gray-400">{emp.rfc}</p>}
                      </div>
                      {empresaId === emp.id && <Check size={12} className="text-red-500" />}
                    </button>
                  ))}
                </div>
              )}
              {/* Lista completa de clientes */}
              {mostrarTodos && sugerenciasEmpresa.length === 0 && todosLosClientes.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                  <div className="p-2 border-b border-gray-50 bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex justify-between items-center">
                    <span>Todos los clientes</span>
                    <button onMouseDown={e => e.preventDefault()} onClick={() => setMostrarTodos(false)} className="text-gray-400 hover:text-red-600"><X size={14} /></button>
                  </div>
                  {todosLosClientes.map(emp => (
                    <button
                      key={emp.id}
                      type="button"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => {
                        setEmpresa(emp.nombre_comercial);
                        setEmpresaId(emp.id);
                        if (!emailCliente && emp.email) setEmailCliente(emp.email);
                        setMostrarTodos(false);
                      }}
                      className="w-full text-left px-3 py-2.5 hover:bg-red-50 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <p className="text-xs font-bold text-gray-800 group-hover:text-red-700">{emp.nombre_comercial}</p>
                        {emp.rfc && <p className="text-[10px] text-gray-400">{emp.rfc}</p>}
                      </div>
                      {empresaId === emp.id && <Check size={12} className="text-red-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block mb-1">Email</label>
              <input 
                type="email" 
                value={emailCliente} 
                onChange={e => setEmailCliente(e.target.value)} 
                placeholder="correo@empresa.com" 
                className="w-full border border-gray-300 rounded-xl px-3 h-10 text-sm font-semibold text-gray-800 outline-none focus:border-red-400 transition-colors placeholder:text-gray-300" 
              />
            </div>
            {emailCliente && (
              <a
                href={`mailto:${emailCliente}?subject=Cotización de Servicios ${folio} — Retarder México&body=Estimado/a ${cliente},%0D%0A%0D%0AAdjuntamos la cotización de servicios con folio ${folio}.%0D%0A%0D%0AQuedamos a sus órdenes.%0D%0A%0D%0AIng. Cristina Velasco%0D%0AÁrea de Ventas — Retarder México%0D%0Aventasyservicio@tgrpentarmexico.com%0D%0ATel: +52 55 7372 1633`}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#0f2d55] hover:bg-[#1a4a7a] text-white transition-colors"
                title="Enviar cotización por email"
              >
                <Mail size={16} />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Paso 1: Selección de tipo ── */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
          Paso 1 — Tipo de servicio
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          {/* PREVENTIVO */}
          <button
            onClick={() => setTipoPreventivo(v => !v)}
            className={`relative rounded-2xl border-2 p-5 text-left transition-all ${
              tipoPreventivo
                ? 'border-green-500 bg-green-50 shadow-lg shadow-green-100'
                : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md'
            }`}
          >
            {tipoPreventivo && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <Check size={13} className="text-white" strokeWidth={3} />
              </div>
            )}
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tipoPreventivo ? 'bg-green-500' : 'bg-green-100'}`}>
                <Shield size={20} className={tipoPreventivo ? 'text-white' : 'text-green-600'} />
              </div>
              <div>
                <p className="font-black text-base text-gray-900 uppercase tracking-wide">Preventivo</p>
                <p className="text-xs text-gray-500">Mantenimiento programado</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-green-200">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Precio por unidad</p>
              <p className="text-2xl font-black text-green-700">
                {fmtMXN(PRECIO_PREVENTIVO_MXN)}
                <span className="text-sm font-semibold"> MXN</span>
              </p>
            </div>
          </button>

          {/* CORRECTIVO */}
          <button
            onClick={() => setTipoCorrectivo(v => !v)}
            className={`relative rounded-2xl border-2 p-5 text-left transition-all ${
              tipoCorrectivo
                ? 'border-orange-500 bg-orange-50 shadow-lg shadow-orange-100'
                : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-md'
            }`}
          >
            {tipoCorrectivo && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                <Check size={13} className="text-white" strokeWidth={3} />
              </div>
            )}
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tipoCorrectivo ? 'bg-orange-500' : 'bg-orange-100'}`}>
                <Wrench size={20} className={tipoCorrectivo ? 'text-white' : 'text-orange-600'} />
              </div>
              <div>
                <p className="font-black text-base text-gray-900 uppercase tracking-wide">Correctivo</p>
                <p className="text-xs text-gray-500">Reparación y diagnóstico</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-orange-200">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Base</p>
              <p className="text-2xl font-black text-orange-700">$0.00 <span className="text-sm font-semibold">MXN</span></p>
              <p className="text-xs text-gray-400 mt-0.5">Solo mano de obra y refacciones</p>
            </div>
          </button>

        </div>

        {tipoPreventivo && tipoCorrectivo && (
          <div className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-purple-50 border border-purple-200 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
            <p className="text-xs font-bold text-purple-700">Servicio Mixto — Preventivo + Correctivo seleccionados</p>
          </div>
        )}
      </div>

      {/* ── Paso 2: Formulario ── */}
      {formularioVisible && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
            Paso 2 — Detalles del servicio
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* ── Columna izquierda ── */}
            <div className="space-y-4">

              {/* Checklist Preventivo (solo si preventivo activo) */}
              {tipoPreventivo && (
                <div className="bg-white rounded-2xl border border-green-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield size={14} className="text-green-600" />
                    <p className="text-xs font-bold uppercase tracking-wider text-green-700">Checklist Preventivo</p>
                  </div>
                  <div className="space-y-3">
                    {CHECKLIST_PREVENTIVO.map(cat => (
                      <div key={cat.categoria}>
                        <p className="text-[9px] font-black uppercase tracking-wider text-gray-500 mb-1.5 pl-1">
                          {cat.categoria}
                        </p>
                        <div className="space-y-1">
                          {cat.items.map(item => (
                            <div key={item} className="flex items-center gap-2 pl-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                              <span className="text-xs text-gray-600">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mano de Obra */}
              <CardLineas
                titulo="Mano de Obra"
                lineas={lineasManoObra}
                onAdd={() => addLinea(setLineasManoObra)}
                onRemove={id => removeLinea(setLineasManoObra, id)}
                onChange={(id, field, value) => changeLinea(setLineasManoObra, id, field, value)}
                onAbrirCatalogo={() => abrirModal('mo')}
                accentColor="blue"
              />

              {/* Refacciones */}
              <CardLineas
                titulo="Refacciones"
                lineas={lineasRefacciones}
                onAdd={() => addLinea(setLineasRefacciones)}
                onRemove={id => removeLinea(setLineasRefacciones, id)}
                onChange={(id, field, value) => changeLinea(setLineasRefacciones, id, field, value)}
                onAbrirCatalogo={() => abrirModal('ref')}
                accentColor="orange"
              />
            </div>

            {/* ── Columna derecha ── */}
            <div className="space-y-4">

              {/* Personalizar Servicio */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">Personalizar Servicio</p>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block mb-1">
                      Cantidad de unidades
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={unidades}
                      onChange={e => setUnidades(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 h-10 text-sm text-gray-800 font-semibold outline-none focus:border-blue-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block mb-1">
                      Gastos de traslado <span className="normal-case font-normal text-gray-500">(MXN)</span>
                    </label>
                    <div className="flex items-center gap-1 border border-gray-300 rounded-xl px-3 h-10 focus-within:border-blue-400 transition-colors">
                      <span className="text-xs text-gray-600 font-semibold">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={traslado}
                        onChange={e => setTraslado(e.target.value)}
                        placeholder="0"
                        className="flex-1 outline-none text-sm text-gray-800 font-semibold bg-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-1">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block mb-1">Sucursal</label>
                    <input
                      type="text"
                      value={sucursal}
                      onChange={e => setSucursal(e.target.value)}
                      placeholder="Ej. CDMX, Monterrey..."
                      className="w-full border border-gray-300 rounded-xl px-3 h-9 text-sm font-semibold text-gray-800 outline-none focus:border-blue-400 transition-colors placeholder:text-gray-300"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block mb-1">Descripción de la Cotización</label>
                    <input
                      type="text"
                      value={descripcion}
                      onChange={e => setDescripcion(e.target.value)}
                      placeholder="Ej. Servicio preventivo unidad..."
                      className="w-full border border-gray-300 rounded-xl px-3 h-9 text-sm font-semibold text-gray-800 outline-none focus:border-blue-400 transition-colors placeholder:text-gray-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block mb-1">
                    Notas adicionales / Observaciones
                  </label>
                  <textarea
                    value={observaciones}
                    onChange={e => setObservaciones(e.target.value)}
                    rows={6}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-blue-400 transition-colors resize-none font-mono"
                  />
                </div>

                <div className="mt-4">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block mb-1">
                    Políticas y Garantías
                  </label>
                  <textarea
                    value={politicas}
                    onChange={e => setPoliticas(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-[10px] text-gray-800 outline-none focus:border-blue-400 transition-colors resize-none font-mono"
                  />
                </div>
              </div>

              {/* Totales */}
              <div className="bg-gray-900 rounded-2xl p-5 text-white space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Resumen de cotización</p>

                <div className="space-y-1.5">
                  {tipoPreventivo && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Preventivo × {unidadesN} u.</span>
                      <span className="font-semibold text-green-400">{fmtMXN(subtotalPreventivoMXN)}</span>
                    </div>
                  )}
                  {subtotalManoObra > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Mano de obra</span>
                      <span className="font-semibold">{fmtMXN(subtotalManoObra)}</span>
                    </div>
                  )}
                  {subtotalRefacciones > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Refacciones</span>
                      <span className="font-semibold">{fmtMXN(subtotalRefacciones)}</span>
                    </div>
                  )}
                  {trasladoN > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Traslado × {unidadesN}</span>
                      <span className="font-semibold">{fmtMXN(subtotalTraslado)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-700 pt-3 space-y-1.5">
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-gray-300">Subtotal</span>
                    <span>{fmtMXN(subtotalMXN)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-300">
                    <span>IVA 16%</span>
                    <span>{fmtMXN(iva)}</span>
                  </div>
                </div>

                <div className="border-t border-gray-600 pt-3 flex items-center justify-between">
                  <span className="font-bold text-base text-white">Total MXN</span>
                  <span className="text-3xl font-black text-yellow-400">{fmtMXN(totalMXN)}</span>
                </div>

                {/* Checkbox imprimir al guardar */}
                <label className="flex items-center gap-2 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={imprimirAlGuardar}
                    onChange={e => setImprimirAlGuardar(e.target.checked)}
                    className="w-4 h-4 accent-yellow-400 cursor-pointer"
                  />
                  <span className="text-xs text-gray-400">Imprimir automáticamente al guardar</span>
                </label>
              </div>

              {/* Botones */}
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
                  onClick={() => window.print()}
                  disabled={!tipoServicio || !cliente.trim()}
                  className="w-full h-11 bg-[#0f2d55] hover:bg-[#1a4a7a] text-white font-bold text-sm rounded-xl disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
                >
                  <Printer size={16} /> Imprimir / Vista previa PDF
                </button>

                <button
                  onClick={handleGuardar}
                  disabled={guardando || !tipoServicio || !cliente.trim()}
                  className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-black text-base rounded-2xl disabled:opacity-40 transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  {guardando
                    ? <><Loader2 size={20} className="animate-spin" /> Guardando...</>
                    : <><FileText size={20} /> GUARDAR Y GENERAR PDF</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Área de impresión (oculta en pantalla) ── */}
      {formularioVisible && cliente && (
        <div id="print-area" style={{ display: 'none' }}>
          <div className="p-doc">

            {/* Header */}
            <div className="p-header">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-retarder.png" alt="Retarder México" className="p-logo" />
              <div className="p-header-right">
                <div className="p-company">RETARDER MÉXICO</div>
                <div className="p-doc-title">Cotización de Servicios</div>
                <div className="p-fecha-line">Folio: {folio} &nbsp;|&nbsp; {fechaHoy}</div>
                {sucursal && <div className="p-fecha-line">Sucursal: <strong>{sucursal}</strong></div>}
              </div>
            </div>

            <hr className="p-redline" />

            {/* Bloque cliente */}
            <div className="p-client-block">
              <div className="p-client-name">{cliente}</div>
              {empresa && <div className="p-client-row"><span className="p-client-lbl">Empresa:</span> {empresa}</div>}
              {emailCliente && <div className="p-client-row"><span className="p-client-lbl">Email:</span> {emailCliente}</div>}
              <div className="p-client-row"><span className="p-client-lbl">Tipo de servicio:</span> {tipoServicio} &nbsp;|&nbsp; Unidades: {unidadesN}</div>
              {descripcion && <div className="p-client-row"><span className="p-client-lbl">Descripción:</span> {descripcion}</div>}
            </div>

            <hr className="p-hr" />

            {/* Dos columnas */}
            <div className="p-two-col">

              {/* Columna izquierda: trabajos */}
              <div className="p-col-works">
                <div className="p-section-title">Incluye los siguientes trabajos</div>
                {tipoPreventivo && (
                  <>
                    <div className="p-work-item">
                      <span className="p-work-bullet">▸</span>
                      <span>Servicio Preventivo ({unidadesN} u.)</span>
                    </div>
                    {CHECKLIST_PREVENTIVO.map(cat => (
                      <div key={cat.categoria} style={{ marginBottom: '4px' }}>
                        <div className="p-checklist-cat">{cat.categoria}</div>
                        {cat.items.map(item => (
                          <div key={item} className="p-work-item" style={{ paddingLeft: '8px' }}>
                            <span className="p-work-bullet">•</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </>
                )}
                {lineasManoObra.filter(l => l.descripcion || l.precio).map(l => (
                  <div key={l.id} className="p-work-item">
                    <span className="p-work-bullet">·</span>
                    <span>{l.descripcion || '—'}{(l.cantidad || 1) > 1 ? ` × ${l.cantidad}` : ''}</span>
                  </div>
                ))}
                {lineasRefacciones.filter(l => l.descripcion || l.precio).map(l => (
                  <div key={l.id} className="p-work-item">
                    <span className="p-work-bullet">·</span>
                    <span>{l.descripcion || '—'}{(l.cantidad || 1) > 1 ? ` × ${l.cantidad}` : ''}</span>
                  </div>
                ))}
                {trasladoN > 0 && (
                  <div className="p-work-item">
                    <span className="p-work-bullet">·</span>
                    <span>Gastos de traslado</span>
                  </div>
                )}
              </div>

              {/* Columna derecha: desglose económico */}
              <div className="p-col-pricing">
                <div className="p-section-title">Desglose económico</div>
                {tipoPreventivo && (
                  <div className="p-price-item">
                    <span className="p-price-desc">Preventivo × {unidadesN}</span>
                    <span className="p-price-val">{fmtMXN(subtotalPreventivoMXN)} MXN</span>
                  </div>
                )}
                {lineasManoObra.filter(l => l.descripcion || l.precio).map(l => (
                  <div key={l.id} className="p-price-item">
                    <span className="p-price-desc">{l.descripcion || 'Mano de obra'}{(l.cantidad || 1) > 1 ? ` × ${l.cantidad}` : ''}</span>
                    <span className="p-price-val">{fmtMXN((l.precio || 0) * (l.cantidad || 1))}</span>
                  </div>
                ))}
                {lineasRefacciones.filter(l => l.descripcion || l.precio).map(l => (
                  <div key={l.id} className="p-price-item">
                    <span className="p-price-desc">{l.descripcion || 'Refacción'}{(l.cantidad || 1) > 1 ? ` × ${l.cantidad}` : ''}</span>
                    <span className="p-price-val">{fmtMXN((l.precio || 0) * (l.cantidad || 1))}</span>
                  </div>
                ))}
                {trasladoN > 0 && (
                  <div className="p-price-item">
                    <span className="p-price-desc">Traslado × {unidadesN}</span>
                    <span className="p-price-val">{fmtMXN(subtotalTraslado)}</span>
                  </div>
                )}
                <div className="p-totals">
                  <div className="p-total-line"><span>Subtotal</span><span>{fmtMXN(subtotalMXN)}</span></div>
                  <div className="p-total-line iva"><span>IVA 16%</span><span>{fmtMXN(iva)}</span></div>
                  <div className="p-total-final"><span>TOTAL MXN</span><span>{fmtMXN(totalMXN)}</span></div>
                </div>
              </div>
            </div>

            {/* Importe en letras */}
            <div className="p-letras"><strong>SON: {numeroALetras(totalMXN)}</strong></div>


            <hr className="p-hr" />

            {/* Observaciones técnicas */}
            <div className="p-obs-full">
              <div className="p-section-title">Observaciones técnicas</div>
              <pre className="p-obs-pre">{observaciones}</pre>
            </div>

            <hr className="p-hr" />

            {/* Políticas y garantías */}
            <div className="p-policies">
              <div className="p-section-title" style={{ color: '#c0392b', borderColor: '#c0392b' }}>Políticas y Garantías</div>
              <pre className="p-obs-pre" style={{ color: '#c0392b', fontWeight: 700 }}>{politicas}</pre>
            </div>

            <hr className="p-hr" />

            {/* Footer */}
            <div className="p-footer">
              {/* Izquierda: datos Juan Carlos */}
              <div className="p-footer-info" style={{ order: 1 }}>
                <div className="p-footer-name">Ing. Cristina Velasco</div>
                <div className="p-footer-detail">Área de Ventas &nbsp;|&nbsp; ventasyservicio@tgrpentarmexico.com</div>
                <div className="p-footer-detail">Tel: +52 55 7372 1633</div>
                <div className="p-footer-web">www.tgrpentarmexico.com</div>
              </div>
              {/* Centro: logo Pentar */}
              <div className="p-footer-logo" style={{ order: 2 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-pentar.png"
                  alt="Pentar Kloft"
                  style={{ height: '50px', width: 'auto', display: 'block' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fb = e.currentTarget.nextElementSibling as HTMLElement | null;
                    if (fb) fb.style.display = 'block';
                  }}
                />
                <div style={{ display: 'none', fontSize: '8px', fontWeight: 900, color: '#0d2244' }}>PENTAR KLOFT</div>
              </div>
              {/* Derecha: QR */}
              <div className="p-footer-qr" style={{ order: 3 }}>
                {qrDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrDataUrl} alt="QR" style={{ width: '60px', height: '60px', display: 'block' }} />
                )}
                <div style={{ fontSize: '6px', color: '#888', textAlign: 'center', marginTop: '2px' }}>Escanea para más info</div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Modal Catálogo ── */}
      {modalAbierto && (
        <ModalCatalogo
          tab={modalTab}
          onTabChange={setModalTab}
          catalogoMO={catalogoMO}
          catalogoRef={catalogoRef}
          cargandoCatalogo={cargandoCatalogo}
          onAgregarMO={(item) => { agregarDesdeCatalogoMO(item); }}
          onAgregarRef={(item) => { agregarDesdeCatalogoRef(item); }}
          onClose={() => setModalAbierto(false)}
        />
      )}

      {/* ── CSS de impresión ── */}
      <style>{`
        @page { size: A4 portrait; margin: 12mm 14mm; }

        @media print {
          /* ── Limitar body a UNA sola página ── */
          html, body {
            height: 100vh !important;
            max-height: 100vh !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          header, nav, footer { display: none !important; }
          body * { visibility: hidden !important; }
          #print-area, #print-area * { visibility: visible !important; }
          #print-area {
            display: block !important;
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 100% !important;
            margin: 0 !important;
          }
        }

        /* ── Documento ── */
        .p-doc {
          font-family: Arial, sans-serif;
          font-size: 14px;
          color: #111;
          padding: 6px 8px;
          box-sizing: border-box;
          background: #fff;
        }

        /* ── Header ── */
        .p-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .p-logo { height: 120px; width: 120px; object-fit: contain; }
        .p-header-right { text-align: right; }
        .p-company { font-size: 22px; font-weight: 900; color: #0d2244; letter-spacing: 0.5px; }
        .p-doc-title { font-size: 14px; font-weight: 700; color: #0d2244; margin-top: 2px; }
        .p-fecha-line { font-size: 12px; color: #555; margin-top: 2px; }

        /* ── Separadores ── */
        .p-redline { border: none; border-top: 2.5px solid #c0392b; margin: 5px 0; }
        .p-hr { border: none; border-top: 1px solid #ddd; margin: 5px 0; }

        /* ── Cliente ── */
        .p-client-block { margin: 4px 0; }
        .p-client-name { font-size: 17px; font-weight: 900; color: #c0392b; text-transform: uppercase; margin-bottom: 3px; }
        .p-client-row { font-size: 13px; color: #444; margin-bottom: 2px; line-height: 1.4; }
        .p-client-lbl { font-weight: 700; color: #222; }

        /* ── Dos columnas ── */
        .p-two-col { display: flex; gap: 24px; margin: 8px 0; }
        .p-col-works { flex: 2; }
        .p-col-pricing { flex: 1; min-width: 180px; }
        .p-section-title { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; color: #0d2244; border-bottom: 1.5px solid #0d2244; padding-bottom: 2px; margin-bottom: 5px; }
        .p-checklist-cat { font-size: 10px; font-weight: 700; color: #0d2244; text-transform: uppercase; margin-bottom: 2px; }
        .p-work-item { display: flex; gap: 4px; font-size: 13px; margin-bottom: 2px; line-height: 1.4; }
        .p-work-bullet { color: #c0392b; font-weight: 900; flex-shrink: 0; }

        /* ── Precios ── */
        .p-price-item { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 3px; gap: 8px; }
        .p-price-desc { flex: 1; }
        .p-price-val { font-weight: 600; white-space: nowrap; }
        .p-totals { border-top: 1.5px solid #ddd; padding-top: 5px; margin-top: 5px; }
        .p-total-line { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 3px; }
        .p-total-line.iva { color: #555; }
        .p-total-final { display: flex; justify-content: space-between; font-size: 16px; font-weight: 900; color: #0d2244; border-top: 2px solid #0d2244; padding-top: 4px; margin-top: 3px; }

        /* ── Letras y observaciones ── */
        .p-letras { font-size: 13px; font-style: italic; color: #444; margin: 6px 0; }
        .p-obs-full { margin: 8px 0; }
        .p-obs-pre { font-family: Arial, sans-serif; font-size: 14px; white-space: pre-wrap; color: #333; margin: 4px 0; line-height: 1.6; }

        /* ── Políticas ── */
        .p-policies { margin: 4px 0; }
        .p-policy-line { font-size: 13px; font-weight: 700; color: #c0392b; margin-bottom: 2px; }

        /* ── Footer ── */
        .p-footer { border-top: 1px solid #ddd; padding-top: 6px; margin-top: 10px; display: flex; flex-direction: row; align-items: center; justify-content: space-between; gap: 8px; }
        .p-footer-info { flex: 1; font-size: 12px; order: 1; }
        .p-footer-name { font-weight: 900; color: #0d2244; font-size: 13px; }
        .p-footer-detail { color: #555; margin-top: 1px; }
        .p-footer-web { font-size: 11px; color: #c0392b; font-weight: 700; margin-top: 2px; }
        .p-footer-logo { flex: 1; display: flex; justify-content: center; align-items: center; order: 2; }
        .p-footer-qr { flex: 1; display: flex; flex-direction: column; align-items: flex-end; order: 3; }
      `}</style>
    </div>
  );
}
