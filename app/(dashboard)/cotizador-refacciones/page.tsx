'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import QRCode from 'qrcode';
import { Loader2, RefreshCw, Check, FileText, Plus, Trash2, Printer, Search, BookOpen, X, ChevronDown } from 'lucide-react';
import { crearCotizacion, buscarEmpresas, type EmpresaBusquedaResult } from '@/app/actions/cotizaciones';
import { obtenerRefacciones } from '@/app/actions/catalogos';
import { obtenerCatalogoGeneral } from '@/app/actions/catalogo-general';
import { obtenerClientes } from '@/app/actions/clientes';
import type { RefaccionRow } from '@/app/actions/catalogos';
import type { ItemCatalogoGeneral } from '@/app/actions/catalogo-general';

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface LineaRefaccion {
  id: string;
  descripcion: string;
  numeroParte: string;
  cantidad: number;
  precioMXN: number;
}

const CATS_REF = ['TODOS', 'ELÉCTRICO', 'NEUMÁTICO', 'TORNILLERÍA', 'MECÁNICO', 'SOPORTERÍA', 'CARDANES', 'MATERIAL ELÉCTRICO'];

const catColor: Record<string, string> = {
  'ELÉCTRICO':   'bg-yellow-100 text-yellow-800',
  'NEUMÁTICO':   'bg-blue-100 text-blue-800',
  'MECÁNICO':    'bg-gray-100 text-gray-700',
  'TORNILLERÍA': 'bg-orange-100 text-orange-800',
  'SOPORTERÍA':  'bg-green-100 text-green-800',
  'CARDANES':    'bg-purple-100 text-purple-800',
  'MATERIAL ELÉCTRICO': 'bg-red-100 text-red-800',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function generarFolio() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const r = Math.floor(Math.random() * 900) + 100;
  return `REF-${y}${m}${d}-${r}`;
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

// ── PriceInput: permite escribir decimales sin perder el punto ─────────────────
function PriceInput({ value, onChange, className }: { value: number; onChange: (v: number) => void; className?: string }) {
  const [raw, setRaw] = useState(value === 0 ? '' : String(value));
  const prevVal = useRef(value);

  useEffect(() => {
    if (value !== prevVal.current) {
      prevVal.current = value;
      if (parseFloat(raw) !== value) setRaw(value === 0 ? '' : String(value));
    }
  });

  return (
    <input
      type="text"
      inputMode="decimal"
      value={raw}
      placeholder="0.00"
      onChange={e => {
        const v = e.target.value;
        if (v !== '' && !/^-?\d*\.?\d*$/.test(v)) return;
        setRaw(v);
        const n = parseFloat(v);
        if (!isNaN(n)) onChange(n);
        else if (v === '') onChange(0);
      }}
      onBlur={() => {
        const n = parseFloat(raw) || 0;
        setRaw(n === 0 ? '' : String(n));
        onChange(n);
      }}
      className={className}
    />
  );
}

type TabRef = 'ref' | 'gen';

// ── Modal Catálogo ────────────────────────────────────────────────────────────
function ModalCatalogo({
  catalogo,
  catalogoGen,
  cargando,
  onAgregar,
  onAgregarGen,
  onClose,
}: {
  catalogo: RefaccionRow[];
  catalogoGen: ItemCatalogoGeneral[];
  cargando: boolean;
  onAgregar: (item: RefaccionRow) => void;
  onAgregarGen: (item: ItemCatalogoGeneral) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<TabRef>('ref');
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('TODOS');

  useEffect(() => {
    setBusqueda('');
    setCategoria('TODOS');
  }, [tab]);

  const filtrados = useMemo(() => {
    return catalogo.filter(item => {
      const matchCat  = categoria === 'TODOS' || item.categoria === categoria;
      const matchBusc = !busqueda ||
        item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        item.categoria.toLowerCase().includes(busqueda.toLowerCase()) ||
        (item.numero_parte ?? '').toLowerCase().includes(busqueda.toLowerCase());
      return matchCat && matchBusc;
    });
  }, [catalogo, busqueda, categoria]);

  const catsRef = useMemo(() => {
    const cats = Array.from(new Set(catalogo.map(i => i.categoria).filter(Boolean))) as string[];
    return ['TODOS', ...cats.sort()];
  }, [catalogo]);

  const catsGen = useMemo(() => {
    const cats = Array.from(new Set(catalogoGen.map(i => i.categoria).filter(Boolean))) as string[];
    return ['TODOS', ...cats.sort()];
  }, [catalogoGen]);

  const filtradosGen = useMemo(() => {
    return catalogoGen.filter(item => {
      const matchCat  = categoria === 'TODOS' || item.categoria === categoria;
      const matchBusc = !busqueda ||
        item.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
        (item.codigo ?? '').toLowerCase().includes(busqueda.toLowerCase()) ||
        (item.categoria ?? '').toLowerCase().includes(busqueda.toLowerCase()) ||
        (item.area ?? '').toLowerCase().includes(busqueda.toLowerCase());
      return matchCat && matchBusc;
    });
  }, [catalogoGen, busqueda, categoria]);

  const cats     = tab === 'gen' ? catsGen : catsRef;
  const cantidad = tab === 'gen' ? filtradosGen.length : filtrados.length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl" style={{ maxHeight: '85vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-[#0f2d55]" />
            <h2 className="font-black text-base text-[#0f2d55]">Catálogo</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setTab('ref')}
            className={`flex-1 py-3 text-xs font-bold transition-colors ${tab === 'ref' ? 'border-b-2 border-[#0f2d55] text-[#0f2d55]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Search size={12} className="inline mr-1" />Refacciones
          </button>
          <button
            onClick={() => setTab('gen')}
            className={`flex-1 py-3 text-xs font-bold transition-colors ${tab === 'gen' ? 'border-b-2 border-[#0f2d55] text-[#0f2d55]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <BookOpen size={12} className="inline mr-1" />Catálogo General
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
              placeholder={tab === 'gen' ? 'Buscar por descripción, código, área…' : 'Buscar por nombre, P/N o categoría…'}
              className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400"
              autoFocus
            />
            {busqueda && (
              <button onClick={() => setBusqueda('')} className="text-gray-400 hover:text-gray-600">
                <X size={13} />
              </button>
            )}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {cats.map(c => (
              <button
                key={c}
                onClick={() => setCategoria(c)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                  categoria === c ? 'bg-[#0f2d55] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
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
          {cargando ? (
            <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Cargando catálogo…</span>
            </div>
          ) : cantidad === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">No se encontraron resultados</div>
          ) : tab === 'ref' ? (
            filtrados.map(item => (
              <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 leading-snug">{item.nombre}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${catColor[item.categoria] ?? 'bg-gray-100 text-gray-600'}`}>
                      {item.categoria}
                    </span>
                    {item.numero_parte && <span className="text-[10px] text-gray-400">P/N: {item.numero_parte}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black text-[#0f2d55]">{fmtMXN(item.precio_venta)}</p>
                  <p className="text-[9px] text-gray-400">MXN</p>
                </div>
                <button onClick={() => onAgregar(item)} className="w-8 h-8 rounded-xl bg-[#0f2d55] hover:bg-[#1a4a7a] text-white flex items-center justify-center flex-shrink-0 transition-colors opacity-0 group-hover:opacity-100" title="Agregar">
                  <Plus size={15} strokeWidth={3} />
                </button>
              </div>
            ))
          ) : (
            filtradosGen.map(item => (
              <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition-colors group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 leading-snug">{item.descripcion}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.categoria && <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800">{item.categoria}</span>}
                    {item.area && <span className="text-[10px] text-gray-400">{item.area}</span>}
                    {item.codigo && <span className="text-[10px] text-gray-400">Cód: {item.codigo}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black text-[#0f2d55]">
                    {item.precio_venta != null ? fmtMXN(item.precio_venta) : '—'}
                  </p>
                  <p className="text-[9px] text-gray-400">MXN</p>
                </div>
                <button onClick={() => onAgregarGen(item)} className="w-8 h-8 rounded-xl bg-green-600 hover:bg-green-700 text-white flex items-center justify-center flex-shrink-0 transition-colors opacity-0 group-hover:opacity-100" title="Agregar">
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

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CotizadorRefaccionesPage() {
  const [cliente, setCliente] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [empresaId, setEmpresaId] = useState('');
  const [sugerenciasEmpresa, setSugerenciasEmpresa] = useState<EmpresaBusquedaResult[]>([]);
  const [buscandoEmpresa, setBuscandoEmpresa] = useState(false);
  const [todosLosClientes, setTodosLosClientes] = useState<EmpresaBusquedaResult[]>([]);
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [emailCliente, setEmailCliente] = useState('');
  const [sucursal, setSucursal] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [folio, setFolio] = useState('');

  const [lineas, setLineas] = useState<LineaRefaccion[]>([
    { id: uid(), descripcion: '', numeroParte: '', cantidad: 1, precioMXN: 0 },
  ]);

  const [traslado, setTraslado] = useState('0');
  const [observaciones, setObservaciones] = useState(
    `*PRECIOS EN PESOS MEXICANOS (MXN)\n*TIEMPO DE ENTREGA SUJETO A DISPONIBILIDAD DE INVENTARIO\n*SE REQUIERE PAGO ANTICIPADO DEL 50% PARA CONFIRMAR PEDIDO`
  );
  const [politicas, setPoliticas] = useState(
    `*COTIZACIÓN VÁLIDA POR 15 DÍAS\n*GARANTÍA DE 30 DÍAS EN REFACCIONES`
  );

  const [catalogo, setCatalogo] = useState<RefaccionRow[]>([]);
  const [catalogoGen, setCatalogoGen] = useState<ItemCatalogoGeneral[]>([]);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);

  const [qrDataUrl, setQrDataUrl] = useState('');
  const [imprimirAlGuardar, setImprimirAlGuardar] = useState(false);

  const imgToBase64Canvas = (src: string): Promise<string> => new Promise((resolve) => {
    const absSrc = src.startsWith('http') ? src : new URL(src, location.href).href;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d')!.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(absSrc);
      }
    };
    img.onerror = () => resolve(absSrc);
    img.src = absSrc;
  });

  const imprimirVentana = async () => {
    // Guardar datos para reimprimir
    try {
      const lineasActivas = lineas.filter(l => l.descripcion.trim());
      const datos = {
        cliente: empresa, atencionA: cliente, email: emailCliente, sucursal, descripcion,
        lineas: lineasActivas, observaciones, politicas,
        fechaImpresion: new Date().toISOString(),
      };
      localStorage.setItem('ultima_cotizacion_refacciones', JSON.stringify(datos));
      setUltimaFechaRef(datos.fechaImpresion);
    } catch { /* sin localStorage */ }
    // Guardar HTML con imágenes en base64 para reimpresión
    try {
      const printArea = document.getElementById('print-area');
      if (printArea) {
        printArea.style.display = 'block';
        await new Promise(resolve => setTimeout(resolve, 300));
        const clone = printArea.cloneNode(true) as HTMLElement;
        const imgs = Array.from(clone.querySelectorAll('img'));
        await Promise.all(imgs.map(async (el) => {
          if (el.src && !el.src.startsWith('data:')) el.src = await imgToBase64Canvas(el.src);
        }));
        const estilos = Array.from(document.styleSheets)
          .map(s => { try { return Array.from(s.cssRules).map(r => r.cssText).join(''); } catch { return ''; } })
          .join('');
        localStorage.setItem('reimprimir_refacciones', JSON.stringify({ html: clone.outerHTML, estilos, fecha: new Date().toISOString() }));
        printArea.style.display = 'none';
      }
    } catch { /* sin localStorage */ }
    // Imprimir con window.print() directo — igual que frenos, garantiza hoja completa
    window.print();
  };
  const [guardando, setGuardando] = useState(false);
  const [guardadoOk, setGuardadoOk] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);
  const [ultimaFechaRef, setUltimaFechaRef] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ultima_cotizacion_refacciones');
      if (raw) { const p = JSON.parse(raw); setUltimaFechaRef(p.fechaImpresion ?? null); }
    } catch { /* sin localStorage */ }
  }, []);

  const reimprimirRefacciones = () => {
    try {
      const raw = localStorage.getItem('ultima_cotizacion_refacciones');
      if (!raw) return;
      const d = JSON.parse(raw);
      setCliente(d.atencionA ?? '');
      setEmpresa(d.cliente ?? '');
      setEmailCliente(d.email ?? '');
      setSucursal(d.sucursal ?? '');
      setDescripcion(d.descripcion ?? '');
      if (d.lineas) setLineas(d.lineas);
      setObservaciones(d.observaciones ?? '');
      setPoliticas(d.politicas ?? '');
      setTimeout(() => imprimirVentana(), 100);
    } catch { /* sin localStorage */ }
  };

  useEffect(() => {
    setFolio(generarFolio());
    setFechaHoy(new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }));
    QRCode.toDataURL('https://tgrpentarmexico.com/', { width: 80, margin: 1 })
      .then(url => setQrDataUrl(url))
      .catch(() => {});

    setCargandoCatalogo(true);
    Promise.all([obtenerRefacciones(), obtenerCatalogoGeneral()]).then(([ref, gen]) => {
      setCatalogo(ref.data);
      setCatalogoGen(gen.data);
      setCargandoCatalogo(false);
    });
  }, []);

  // ── Cargar todos los clientes ────────────────────────────────────────────────
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

  // ── Helpers de líneas ───────────────────────────────────────────────────────
  const addLinea = () => {
    setLineas(prev => [...prev, { id: uid(), descripcion: '', numeroParte: '', cantidad: 1, precioMXN: 0 }]);
  };

  const removeLinea = (id: string) => {
    setLineas(prev => prev.filter(l => l.id !== id));
  };

  const changeLinea = (id: string, field: keyof Omit<LineaRefaccion, 'id'>, value: string) => {
    setLineas(prev => prev.map(l => {
      if (l.id !== id) return l;
      if (field === 'cantidad') return { ...l, cantidad: parseInt(value) || 1 };
      if (field === 'precioMXN') return { ...l, precioMXN: parseFloat(value) || 0 };
      return { ...l, [field]: value };
    }));
  };

  const agregarDesdeCatalogo = useCallback((item: RefaccionRow) => {
    setLineas(prev => {
      // 1. Buscar si ya existe la misma refacción en la lista
      const existente = prev.find(l => 
        l.descripcion.toLowerCase() === item.nombre.toLowerCase() && 
        l.numeroParte === (item.numero_parte ?? '')
      );

      if (existente) {
        // Sumar a la cantidad del existente
        return prev.map(l => l.id === existente.id 
          ? { ...l, cantidad: l.cantidad + 1 } 
          : l
        );
      }

      // 2. Si no existe, buscar una línea vacía para llenarla
      const vacia = prev.find(l => !l.descripcion && l.precioMXN === 0);
      if (vacia) {
        return prev.map(l => l.id === vacia.id
          ? { ...l, descripcion: item.nombre, numeroParte: item.numero_parte ?? '', precioMXN: item.precio_venta, cantidad: 1 }
          : l
        );
      }

      // 3. Si no hay vacías ni repetidas, añadir nueva línea
      return [...prev, { id: uid(), descripcion: item.nombre, numeroParte: item.numero_parte ?? '', cantidad: 1, precioMXN: item.precio_venta }];
    });
  }, []);

  const agregarDesdeCatalogoGen = useCallback((item: ItemCatalogoGeneral) => {
    setLineas(prev => {
      const existente = prev.find(l => l.descripcion.toLowerCase() === item.descripcion.toLowerCase());
      if (existente) {
        return prev.map(l => l.id === existente.id ? { ...l, cantidad: l.cantidad + 1 } : l);
      }
      const vacia = prev.find(l => !l.descripcion && l.precioMXN === 0);
      if (vacia) {
        return prev.map(l => l.id === vacia.id
          ? { ...l, descripcion: item.descripcion, numeroParte: item.codigo ?? '', precioMXN: item.precio_venta ?? 0, cantidad: 1 }
          : l
        );
      }
      return [...prev, { id: uid(), descripcion: item.descripcion, numeroParte: item.codigo ?? '', cantidad: 1, precioMXN: item.precio_venta ?? 0 }];
    });
  }, []);


  // ── Cálculos ─────────────────────────────────────────────────────────────────
  const trasladoN = parseFloat(traslado) || 0;
  const lineasActivas = lineas.filter(l => l.descripcion || l.precioMXN);
  const subtotalRef = lineasActivas.reduce((s, l) => s + l.precioMXN * l.cantidad, 0);
  const subtotal = subtotalRef + trasladoN;
  const iva = Math.round(subtotal * 0.16 * 100) / 100;
  const totalMXN = Math.round(subtotal * 1.16 * 100) / 100;
  const [fechaHoy, setFechaHoy] = useState('');

  // ── Guardar ──────────────────────────────────────────────────────────────────
  const handleGuardar = async () => {
    if (!cliente.trim()) { setErrorGuardar('Escribe el nombre del cliente.'); return; }
    if (lineasActivas.length === 0) { setErrorGuardar('Agrega al menos una refacción.'); return; }

    setGuardando(true);
    setErrorGuardar(null);
    setGuardadoOk(false);

    try {
      const { data, error } = await crearCotizacion({
        folio:          folio.trim() !== '' ? folio.trim() : undefined,
        empresa_id:     empresaId || undefined,
        empresa_nombre: empresa.trim() || cliente.trim(),
        vendedor_id: null,
        tipo: 'refacciones',
        subtotal: Math.round(subtotal * 100) / 100,
        iva,
        total_mxn: totalMXN,
        notas: [
          `Folio: ${folio}`,
          cliente.trim() ? `ATENCION_A: ${cliente.trim()}` : '',
          emailCliente.trim() ? `EMAIL: ${emailCliente.trim()}` : '',
          sucursal.trim() ? `SUCURSAL: ${sucursal.trim()}` : '',
          descripcion.trim() ? `DESCRIPCION: ${descripcion.trim()}` : '',
          `REFACCIONES:\n${lineasActivas.map(l => `  - ${l.descripcion}${l.numeroParte ? ` (${l.numeroParte})` : ''}: ${l.cantidad} × ${fmtMXN(l.precioMXN)}`).join('\n')}`,
          `OBSERVACIONES:\n${observaciones}`,
          politicas ? `POLITICAS:\n${politicas}` : '',
        ].filter(Boolean).join('\n'),
      });

      if (error) { setErrorGuardar(`Error al guardar: ${error}`); return; }

      console.log('[CotizadorRefacciones] cotización creada:', data?.folio);
      setGuardadoOk(true);
      setTimeout(() => setGuardadoOk(false), 4000);
      if (imprimirAlGuardar) imprimirVentana();

    } catch (e: unknown) {
      setErrorGuardar(`Error inesperado: ${e instanceof Error ? e.message : String(e)}`);
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
          <h1 className="text-3xl font-black text-[#0f2d55] tracking-tight">Cotizador de Refacciones</h1>
          <p className="text-gray-500 text-sm font-medium">Genera cotizaciones rápidas para refacciones</p>
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
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block mb-1">Email</label>
            <input 
              type="email" 
              value={emailCliente} 
              onChange={e => setEmailCliente(e.target.value)} 
              placeholder="correo@empresa.com" 
              className="w-full border border-gray-300 rounded-xl px-3 h-10 text-sm font-semibold text-gray-800 outline-none focus:border-red-400 transition-colors placeholder:text-gray-300" 
            />
          </div>
        </div>
      </div>

      {/* ── Lista de refacciones ── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-700">Refacciones</p>
          <div className="flex gap-2">
            <button
              onClick={() => setModalAbierto(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#0f2d55] text-[#0f2d55] text-xs font-bold rounded-xl hover:bg-[#0f2d55]/5 transition-colors"
            >
              <BookOpen size={12} /> Catálogo
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {/* Encabezados */}
          <div className="grid gap-2 text-[9px] font-bold uppercase tracking-wider text-gray-400 px-1"
            style={{ gridTemplateColumns: '1fr 110px 60px 160px 38px' }}>
            <span>Descripción</span>
            <span>No. Parte</span>
            <span className="text-center">Cant.</span>
            <span className="text-right">Precio MXN</span>
            <span />
          </div>

          {lineas.map((l, i) => (
            <div
              key={l.id}
              className="grid gap-2 items-center"
              style={{ gridTemplateColumns: '1fr 110px 60px 160px 38px' }}
            >
              <input
                type="text"
                value={l.descripcion}
                onChange={e => changeLinea(l.id, 'descripcion', e.target.value)}
                placeholder={`Refacción ${i + 1}...`}
                className="border border-gray-200 rounded-xl px-3 h-9 text-xs text-gray-800 outline-none focus:border-red-400 transition-colors placeholder:text-gray-300"
              />
              <input
                type="text"
                value={l.numeroParte}
                onChange={e => changeLinea(l.id, 'numeroParte', e.target.value)}
                placeholder="P/N..."
                className="border border-gray-200 rounded-xl px-3 h-9 text-xs text-gray-700 outline-none focus:border-red-400 transition-colors placeholder:text-gray-300"
              />
              <input
                type="number"
                min="1"
                value={l.cantidad}
                onChange={e => changeLinea(l.id, 'cantidad', e.target.value)}
                className="border border-gray-200 rounded-xl px-3 h-9 text-xs text-center text-gray-800 font-semibold outline-none focus:border-red-400 transition-colors"
              />
              <div className="flex items-center border border-gray-200 rounded-xl px-2 h-9 gap-1 focus-within:border-red-400 transition-colors min-w-0 overflow-hidden">
                <span className="text-[10px] text-gray-500 flex-shrink-0">$</span>
                <PriceInput
                  value={l.precioMXN}
                  onChange={v => changeLinea(l.id, 'precioMXN', String(v))}
                  className="min-w-0 w-full outline-none text-xs text-gray-800 font-semibold bg-transparent text-right"
                />
              </div>
              <button
                onClick={() => removeLinea(l.id)}
                disabled={lineas.length === 1}
                className="h-9 w-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Traslado */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-3">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 whitespace-nowrap">
            Gastos de traslado <span className="normal-case font-normal text-gray-500">(MXN)</span>
          </label>
          <div className="flex items-center gap-1 border border-gray-300 rounded-xl px-3 h-9 w-32 focus-within:border-red-400 transition-colors">
            <span className="text-xs text-gray-600 font-semibold">$</span>
            <input
              type="number" min="0" step="0.01"
              value={traslado}
              onChange={e => setTraslado(e.target.value)}
              placeholder="0"
              className="flex-1 outline-none text-sm text-gray-800 font-semibold bg-transparent"
            />
          </div>
        </div>
      </div>

      {/* ── Resumen + acciones ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Observaciones */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-700 block mb-2">
            Observaciones técnicas / logísticas
          </label>
          <textarea
            value={observaciones}
            onChange={e => setObservaciones(e.target.value)}
            rows={7}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-red-400 transition-colors resize-none font-mono"
          />
          <div className="mt-4">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-700 block mb-1">
              Políticas y Garantías
            </label>
            <textarea
              value={politicas}
              onChange={e => setPoliticas(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-[10px] text-gray-800 outline-none focus:border-red-400 transition-colors resize-none font-mono"
            />
          </div>
        </div>

        {/* Totales + botones */}
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-2xl p-5 text-white space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Resumen de cotización</p>

            <div className="space-y-1.5">
              {lineasActivas.map(l => (
                <div key={l.id} className="flex justify-between text-sm">
                  <span className="text-gray-300 truncate max-w-[180px]">{l.descripcion || 'Refacción'} ×{l.cantidad}</span>
                  <span className="font-semibold">{fmtMXN(l.precioMXN * l.cantidad)}</span>
                </div>
              ))}
              {trasladoN > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Traslado</span>
                  <span className="font-semibold">{fmtMXN(trasladoN)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-700 pt-3 space-y-1.5">
              <div className="flex justify-between text-sm text-gray-300">
                <span>IVA 16%</span>
                <span>{fmtMXN(iva)}</span>
              </div>
            </div>

            <div className="border-t border-gray-600 pt-3 flex items-center justify-between">
              <span className="font-bold text-base text-white">Total MXN</span>
              <span className="text-3xl font-black text-yellow-400">{fmtMXN(totalMXN)}</span>
            </div>

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
              onClick={imprimirVentana}
              disabled={!cliente.trim() || lineasActivas.length === 0}
              className="w-full h-11 bg-[#0f2d55] hover:bg-[#1a4a7a] text-white font-bold text-sm rounded-xl disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
            >
              <Printer size={16} /> Imprimir / PDF
            </button>


            <button
              onClick={handleGuardar}
              disabled={guardando || !cliente.trim() || lineasActivas.length === 0}
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

      {/* ── Modal catálogo ── */}
      {modalAbierto && (
        <ModalCatalogo
          catalogo={catalogo}
          catalogoGen={catalogoGen}
          cargando={cargandoCatalogo}
          onAgregar={item => { agregarDesdeCatalogo(item); }}
          onAgregarGen={item => { agregarDesdeCatalogoGen(item); }}
          onClose={() => setModalAbierto(false)}
        />
      )}

      {/* ── Área de impresión (oculta en pantalla) ── */}
      {cliente && lineasActivas.length > 0 && (
        <div id="print-area" style={{ display: 'none' }}>
          <div className="p-doc">

            {/* Header: logo izquierda + datos derecha */}
            <div className="p-header">
              <div className="p-logos-left">
                <div className="p-logo-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo-retarder.png"
                    alt="Retarder"
                    className="p-logo-img"
                    style={{ width: '300px', height: 'auto', objectFit: 'contain' }}
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
                <div className="p-doc-title">Cotización de Refacciones</div>
                <div className="p-fecha-line">Folio: {folio} &nbsp;|&nbsp; {fechaHoy}</div>
                {sucursal && <div className="p-fecha-line">Sucursal: <strong>{sucursal}</strong></div>}
              </div>
            </div>

            <hr className="p-redline" />

            {/* Bloque cliente */}
            <div className="p-client-block">
              <div className="p-client-name">{empresa || cliente}</div>
              {empresa && <div className="p-client-row"><span className="p-client-lbl">Atención a:</span> {cliente}</div>}
              {emailCliente && <div className="p-client-row"><span className="p-client-lbl">Email:</span> {emailCliente}</div>}
              {descripcion && <div className="p-client-row"><span className="p-client-lbl">Descripción:</span> {descripcion}</div>}
            </div>

            <hr className="p-hr" />

            {/* Dos columnas */}
            <div className="p-two-col">

              {/* Columna izquierda: refacciones */}
              <div className="p-col-works">
                <div className="p-section-title">Refacciones incluidas</div>
                {lineasActivas.map(l => (
                  <div key={l.id} className="p-work-item">
                    <span className="p-work-bullet">▸</span>
                    <span>
                      {l.descripcion}
                      {l.numeroParte ? ` — P/N: ${l.numeroParte}` : ''}
                      {` ×${l.cantidad}`}
                    </span>
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
                {lineasActivas.map(l => (
                  <div key={l.id} className="p-price-item">
                    <span className="p-price-desc">{l.descripcion || 'Refacción'} ×{l.cantidad}</span>
                    <span className="p-price-val">{fmtMXN(l.precioMXN * l.cantidad)}</span>
                  </div>
                ))}
                {trasladoN > 0 && (
                  <div className="p-price-item">
                    <span className="p-price-desc">Traslado</span>
                    <span className="p-price-val">{fmtMXN(trasladoN)}</span>
                  </div>
                )}
                <div className="p-totals">
                  <div className="p-total-line"><span>Subtotal</span><span>{fmtMXN(subtotal)}</span></div>
                  <div className="p-total-line iva"><span>IVA 16%</span><span>{fmtMXN(iva)}</span></div>
                  <div className="p-total-final"><span>TOTAL MXN</span><span>{fmtMXN(totalMXN)}</span></div>
                </div>
              </div>
            </div>

            {/* Importe en letras */}
            <div className="p-letras"><strong>SON: {numeroALetras(totalMXN)}</strong></div>


            <hr className="p-hr" />

            {/* Observaciones */}
            <div className="p-obs-two-col">
              <div>
                <div className="p-section-title">Observaciones técnicas / logísticas</div>
                <pre className="p-obs-pre">{observaciones}</pre>
              </div>
              <div>
                <div className="p-section-title">Políticas y Garantías</div>
                <pre className="p-obs-pre" style={{ color: '#c0392b', fontWeight: 700 }}>{politicas}</pre>
              </div>
            </div>

            <hr className="p-hr" />

            {/* Spacer — empuja el footer al fondo de la página */}
            <div className="p-spacer" />

            {/* Footer */}
            <div className="p-footer">
              <div className="p-footer-info">
                <div className="p-footer-name">Ing. Cristina Velasco</div>
                <div className="p-footer-detail">Área de Ventas &nbsp;|&nbsp; ventasyservicio@tgrpentarmexico.com</div>
                <div className="p-footer-detail">Tel: +52 55 7372 1633</div>
                <div className="p-footer-web">www.tgrpentarmexico.com</div>
              </div>
              <div className="p-footer-logo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-pentar.png" alt="Pentar Kloft" style={{ height: '50px', width: 'auto', display: 'block' }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <div className="p-footer-qr">
                {qrDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrDataUrl} alt="QR" className="p-qr-img" />
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
          html, body { margin: 0 !important; padding: 0 !important; }
          header, nav, footer, aside { display: none !important; }
          body * { visibility: hidden !important; }
          #print-area, #print-area * { visibility: visible !important; }
          #print-area {
            display: flex !important;
            flex-direction: column !important;
            position: fixed !important;
            top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
            width: 100% !important; height: 100% !important;
            margin: 0 !important; padding: 0 !important;
            box-sizing: border-box !important;
            background: white !important;
          }
          .p-doc {
            flex: 1 !important;
            display: flex !important; flex-direction: column !important;
            visibility: visible !important;
            width: 100% !important; max-width: 100% !important;
            margin: 0 !important; padding: 4px !important;
            box-sizing: border-box !important;
            min-height: calc(297mm - 10mm) !important;
          }
          .p-spacer { flex: 1 !important; display: block !important; max-height: 40mm !important; }
          .p-logo-img { width: 300px !important; max-width: 300px !important; height: auto !important; }
          .no-print { display: none !important; }
        }
        .p-doc { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 0; box-sizing: border-box; background: #fff; display: flex; flex-direction: column; min-height: calc(297mm - 10mm); width: 100%; }
        .p-spacer { flex: 1; min-height: 4mm; }
        .p-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .p-logos-left { display: flex; align-items: center; gap: 12px; }
        .p-logo-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .p-logo-img { width: 300px; height: auto; object-fit: contain; display: block; }
        .p-logo-fallback { font-size: 13px; font-weight: 900; color: #0d2244; text-align: center; line-height: 1.25; display: none; }
        .p-header-right { text-align: right; }
        .p-company { font-size: 32px; font-weight: 900; color: #0d2244; letter-spacing: 0.5px; }
        .p-doc-title { font-size: 18px; font-weight: 700; color: #0d2244; margin-top: 4px; }
        .p-fecha-line { font-size: 14px; color: #555; margin-top: 4px; }
        .p-redline { border: none; border-top: 3px solid #c0392b; margin: 8px 0; }
        .p-hr { border: none; border-top: 1px solid #ddd; margin: 8px 0; }
        .p-client-block { margin: 8px 0 10px 0; }
        .p-client-name { font-size: 15px; font-weight: 900; color: #c0392b; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.3px; }
        .p-client-row { font-size: 10px; color: #444; margin-bottom: 2px; line-height: 1.5; }
        .p-client-lbl { font-weight: 700; color: #222; }
        .p-two-col { display: flex; gap: 20px; margin: 8px 0; }
        .p-col-works { flex: 1.3; }
        .p-col-pricing { flex: 1; }
        .p-section-title { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; color: #0d2244; border-bottom: 1.5px solid #0d2244; padding-bottom: 3px; margin-bottom: 6px; }
        .p-work-item { display: flex; gap: 5px; font-size: 10.5px; margin-bottom: 4px; line-height: 1.5; }
        .p-work-bullet { color: #c0392b; font-weight: 900; flex-shrink: 0; }
        .p-price-item { display: flex; justify-content: space-between; font-size: 10.5px; margin-bottom: 4px; gap: 6px; }
        .p-price-desc { flex: 1; }
        .p-price-val { font-weight: 600; white-space: nowrap; }
        .p-totals { border-top: 1.5px solid #ddd; padding-top: 6px; margin-top: 6px; }
        .p-total-line { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px; }
        .p-total-line.iva { color: #555; }
        .p-total-final { display: flex; justify-content: space-between; font-size: 13px; font-weight: 900; color: #0d2244; border-top: 2px solid #0d2244; padding-top: 4px; margin-top: 3px; }
        .p-letras { font-size: 10px; font-style: italic; font-weight: 700; color: #444; margin: 6px 0 8px 0; }
        .p-obs-two-col { display: flex; gap: 20px; margin: 8px 0; }
        .p-obs-two-col > div { flex: 1; }
        .p-obs-pre { font-family: Arial, sans-serif; font-size: 10px; white-space: pre-wrap; color: #444; margin: 3px 0; line-height: 1.5; }
        .p-policy-line { font-size: 10px; font-weight: 700; color: #c0392b; margin-bottom: 2px; }
        .p-footer { border-top: 1px solid #ddd; padding-top: 10px; margin-top: 10px; display: flex; flex-direction: row; align-items: center; justify-content: space-between; gap: 14px; }
        .p-footer-logo { flex: 1; display: flex; align-items: center; justify-content: center; order: 2; }
        .p-footer-info { flex: 1; font-size: 11px; order: 1; }
        .p-footer-name { font-weight: 900; color: #0d2244; font-size: 13px; }
        .p-footer-detail { color: #555; margin-top: 2px; }
        .p-footer-web { font-size: 11px; color: #c0392b; font-weight: 700; margin-top: 3px; }
        .p-footer-qr { flex: 1; display: flex; flex-direction: column; align-items: flex-end; gap: 3px; order: 3; }
        .p-qr-img { width: 80px; height: 80px; display: block; }
        .p-qr-label { font-size: 9px; color: #888; text-align: center; }
      `}</style>
    </div>
  );
}
