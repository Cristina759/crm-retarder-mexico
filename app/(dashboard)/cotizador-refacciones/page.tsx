'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import QRCode from 'qrcode';
import { Loader2, RefreshCw, Check, FileText, Plus, Trash2, Printer, Search, BookOpen, X, ChevronDown } from 'lucide-react';
import { crearCotizacion, buscarEmpresas, type EmpresaBusquedaResult } from '@/app/actions/cotizaciones';
import { obtenerRefacciones } from '@/app/actions/catalogos';
import { obtenerClientes } from '@/app/actions/clientes';
import type { RefaccionRow } from '@/app/actions/catalogos';

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface LineaRefaccion {
  id: string;
  descripcion: string;
  numeroParte: string;
  cantidad: number;
  precioMXN: number;
}

const CATS_REF = ['TODOS', 'ELÉCTRICO', 'NEUMÁTICO', 'TORNILLERÍA', 'MECÁNICO'];

const catColor: Record<string, string> = {
  'ELÉCTRICO':   'bg-yellow-100 text-yellow-800',
  'NEUMÁTICO':   'bg-blue-100 text-blue-800',
  'MECÁNICO':    'bg-gray-100 text-gray-700',
  'TORNILLERÍA': 'bg-orange-100 text-orange-800',
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
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);
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

// ── Modal Catálogo ────────────────────────────────────────────────────────────
function ModalCatalogo({
  catalogo,
  cargando,
  onAgregar,
  onClose,
}: {
  catalogo: RefaccionRow[];
  cargando: boolean;
  onAgregar: (item: RefaccionRow) => void;
  onClose: () => void;
}) {
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('TODOS');

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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl" style={{ maxHeight: '85vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-[#0f2d55]" />
            <h2 className="font-black text-base text-[#0f2d55]">Catálogo de Refacciones</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={18} />
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
              placeholder="Buscar por nombre, P/N o categoría…"
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
            {CATS_REF.map(c => (
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
            <span className="ml-auto text-[10px] text-gray-400 self-center">{filtrados.length} item{filtrados.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1.5">
          {cargando ? (
            <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Cargando catálogo…</span>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">No se encontraron resultados</div>
          ) : (
            filtrados.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 leading-snug">{item.nombre}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${catColor[item.categoria] ?? 'bg-gray-100 text-gray-600'}`}>
                      {item.categoria}
                    </span>
                    {item.numero_parte && (
                      <span className="text-[10px] text-gray-400">P/N: {item.numero_parte}</span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black text-[#0f2d55]">
                    {fmtMXN(item.precio_venta)}
                  </p>
                  <p className="text-[9px] text-gray-400">MXN</p>
                </div>
                <button
                  onClick={() => onAgregar(item)}
                  className="w-8 h-8 rounded-xl bg-[#0f2d55] hover:bg-[#1a4a7a] text-white flex items-center justify-center flex-shrink-0 transition-colors opacity-0 group-hover:opacity-100"
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
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);

  const [qrDataUrl, setQrDataUrl] = useState('');
  const [imprimirAlGuardar, setImprimirAlGuardar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardadoOk, setGuardadoOk] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

  useEffect(() => {
    setFolio(generarFolio());
    setFechaHoy(new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }));
    QRCode.toDataURL('https://tgrpentarmexico.com/', { width: 80, margin: 1 })
      .then(url => setQrDataUrl(url))
      .catch(() => {});

    setCargandoCatalogo(true);
    obtenerRefacciones().then(({ data }) => {
      setCatalogo(data);
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
      const vacia = prev.find(l => !l.descripcion);
      if (vacia) {
        return prev.map(l => l.id === vacia.id
          ? { ...l, descripcion: item.nombre, numeroParte: item.numero_parte ?? '', precioMXN: item.precio_venta }
          : l
        );
      }
      return [...prev, { id: uid(), descripcion: item.nombre, numeroParte: item.numero_parte ?? '', cantidad: 1, precioMXN: item.precio_venta }];
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
        empresa_id:     empresaId || undefined,
        empresa_nombre: empresa.trim() || cliente.trim(),
        vendedor_id: null,
        tipo: 'refacciones',
        subtotal: Math.round(subtotal * 100) / 100,
        iva,
        total_mxn: totalMXN,
        notas: [
          `Folio: ${folio}`,
          `REFACCIONES:\n${lineasActivas.map(l => `  - ${l.descripcion}${l.numeroParte ? ` (${l.numeroParte})` : ''}: ${l.cantidad} × ${fmtMXN(l.precioMXN)}`).join('\n')}`,
          `OBSERVACIONES:\n${observaciones}`,
        ].filter(Boolean).join('\n'),
      });

      if (error) { setErrorGuardar(`Error al guardar: ${error}`); return; }

      console.log('[CotizadorRefacciones] cotización creada:', data?.folio);
      setGuardadoOk(true);
      setTimeout(() => setGuardadoOk(false), 4000);
      if (imprimirAlGuardar) window.print();

    } catch (e: unknown) {
      setErrorGuardar(`Error inesperado: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setGuardando(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-16">

      {/* ── Header: título + cliente ── */}
      <div className="space-y-2">
        <div>
          <h1 className="text-xl font-black text-[#0f2d55] leading-tight">Cotizador de Refacciones</h1>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs text-gray-400">Folio:</span>
            <input
              type="text"
              value={folio}
              onChange={e => setFolio(e.target.value)}
              className="text-xs font-semibold text-gray-600 outline-none border-b border-transparent hover:border-gray-300 focus:border-red-400 bg-transparent transition-colors px-0.5"
            />
            <button onClick={() => setFolio(generarFolio())} className="text-gray-400 hover:text-gray-600 transition-colors" title="Regenerar folio">
              <RefreshCw size={10} />
            </button>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 px-4 py-3 shadow-sm">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block mb-1">
            Atención a *
          </label>
          <input
            type="text"
            value={cliente}
            onChange={e => setCliente(e.target.value)}
            placeholder="Nombre de la persona a quien va dirigida..."
            className="w-full text-sm font-semibold text-gray-800 outline-none bg-transparent placeholder:text-gray-400"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-2xl border border-gray-200 px-3 py-2 shadow-sm relative">
            <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-0.5 flex items-center gap-1">
              Empresa
              {empresaId && <span className="text-[10px] font-bold text-green-600">✓</span>}
            </label>
            <div className="relative">
              <input
                type="text"
                value={empresa}
                onFocus={() => {
                  if (todosLosClientes.length === 0) cargarTodosLosClientes();
                  setMostrarTodos(true);
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
                className="w-full text-xs font-semibold text-gray-800 outline-none bg-transparent placeholder:text-gray-300 pr-8"
              />
              <button
                type="button"
                onClick={() => {
                  if (mostrarTodos || sugerenciasEmpresa.length > 0) {
                    setMostrarTodos(false);
                    setSugerenciasEmpresa([]);
                  } else {
                    if (todosLosClientes.length === 0) cargarTodosLosClientes();
                    setMostrarTodos(true);
                  }
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <ChevronDown size={14} className={`transition-transform ${mostrarTodos || sugerenciasEmpresa.length > 0 ? 'rotate-180 text-blue-500' : ''}`} />
              </button>
            </div>
            {buscandoEmpresa && <Loader2 size={11} className="absolute right-8 top-3 animate-spin text-gray-400" />}

            {/* Sugerencias por búsqueda */}
            {sugerenciasEmpresa.length > 0 && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                <div className="p-2 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Resultados</span>
                  <button onClick={() => setSugerenciasEmpresa([])} className="text-gray-400 hover:text-gray-600"><X size={12} /></button>
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
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors"
                  >
                    <p className="text-xs font-semibold text-gray-800">{emp.nombre_comercial}</p>
                    {emp.rfc && <p className="text-[10px] text-gray-400">{emp.rfc}</p>}
                  </button>
                ))}
              </div>
            )}

            {/* Lista completa de clientes */}
            {mostrarTodos && sugerenciasEmpresa.length === 0 && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                <div className="p-2 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Todos los clientes</span>
                  <button onClick={() => setMostrarTodos(false)} className="text-gray-400 hover:text-gray-600"><X size={12} /></button>
                </div>
                {todosLosClientes.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-400">Cargando clientes...</div>
                ) : (
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
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                    >
                      <p className="text-xs font-semibold text-gray-800">{emp.nombre_comercial}</p>
                      {emp.rfc && <p className="text-[10px] text-gray-400">{emp.rfc}</p>}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 px-3 py-2 shadow-sm">
            <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500 block mb-0.5">Email</label>
            <input type="email" value={emailCliente} onChange={e => setEmailCliente(e.target.value)} placeholder="correo@empresa.com" className="w-full text-xs font-semibold text-gray-800 outline-none bg-transparent placeholder:text-gray-300" />
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
            <button
              onClick={addLinea}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0f2d55] text-white text-xs font-bold rounded-xl hover:bg-[#1a4a7a] transition-colors"
            >
              <Plus size={12} /> Agregar
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {/* Encabezados */}
          <div className="grid gap-2 text-[9px] font-bold uppercase tracking-wider text-gray-400 px-1"
            style={{ gridTemplateColumns: '1fr 120px 60px 100px 32px' }}>
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
              style={{ gridTemplateColumns: '1fr 120px 60px 100px 32px' }}
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
              <div className="flex items-center border border-gray-200 rounded-xl px-2 h-9 gap-1 focus-within:border-red-400 transition-colors">
                <span className="text-[10px] text-gray-500">$</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={l.precioMXN}
                  onChange={e => changeLinea(l.id, 'precioMXN', e.target.value)}
                  className="flex-1 outline-none text-xs text-gray-800 font-semibold bg-transparent text-right"
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
              type="number" min="0" step="1"
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
              onClick={() => window.print()}
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
          cargando={cargandoCatalogo}
          onAgregar={item => { agregarDesdeCatalogo(item); setModalAbierto(false); }}
          onClose={() => setModalAbierto(false)}
        />
      )}

      {/* ── Área de impresión (oculta en pantalla) ── */}
      {cliente && lineasActivas.length > 0 && (
        <div id="print-area" style={{ display: 'none' }}>
          <div className="p-doc">

            {/* Header */}
            <div className="p-header">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-retarder.png" alt="Retarder México" className="p-logo" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div className="p-header-right">
                <div className="p-company">RETARDER MÉXICO</div>
                <div className="p-doc-title">Cotización de Refacciones</div>
                <div className="p-fecha-line">Folio: {folio} &nbsp;|&nbsp; {fechaHoy}</div>
              </div>
            </div>

            <hr className="p-redline" />

            {/* Bloque cliente */}
            <div className="p-client-block">
              <div className="p-client-name">{cliente}</div>
              {empresa && <div className="p-client-row"><span className="p-client-lbl">Empresa:</span> {empresa}</div>}
              {emailCliente && <div className="p-client-row"><span className="p-client-lbl">Email:</span> {emailCliente}</div>}
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
                      {l.cantidad > 1 ? ` (×${l.cantidad})` : ''}
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
            <div className="p-letras">SON: {numeroALetras(subtotal)}</div>

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

            {/* Footer */}
            <div className="p-footer">
              <div className="p-footer-info" style={{ order: 1 }}>
                <div className="p-footer-name">Ing. Cristina Velasco</div>
                <div className="p-footer-detail">Área de Ventas &nbsp;|&nbsp; ventas@retardermexico.com</div>
                <div className="p-footer-detail">Tel: 55 7372 1633 &nbsp;|&nbsp; www.tgrpentarmexico.com</div>
              </div>
              <div style={{ order: 2, textAlign: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-pentar.png" alt="Pentar" style={{ height: '50px', objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <div style={{ order: 3, textAlign: 'right' }}>
                {qrDataUrl
                  ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={qrDataUrl} alt="QR" style={{ width: 70, height: 70 }} />
                  : <div style={{ width: 70, height: 70, border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, color: '#999' }}>QR</div>
                }
                <div style={{ fontSize: '6.5px', color: '#888', marginTop: 2, textAlign: 'center' }}>Escanea para más info</div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── CSS de impresión ── */}
      <style>{`
        @page { size: A4; margin: 15mm 18mm; }
        @media print {
          header, nav, footer { display: none !important; }
          body * { visibility: hidden !important; }
          #print-area, #print-area * { visibility: visible !important; }
          #print-area { display: block !important; position: fixed; top: 0; left: 0; width: 100%; }
        }
        .p-doc { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 0; box-sizing: border-box; background: #fff; }
        .p-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .p-logo { height: 72px; object-fit: contain; }
        .p-header-right { text-align: right; }
        .p-company { font-size: 20px; font-weight: 900; color: #0d2244; letter-spacing: 0.5px; }
        .p-doc-title { font-size: 12px; font-weight: 700; color: #0d2244; margin-top: 2px; }
        .p-fecha-line { font-size: 10px; color: #555; margin-top: 3px; }
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
        .p-letras { font-size: 10px; font-style: italic; color: #444; margin: 6px 0 8px 0; }
        .p-obs-two-col { display: flex; gap: 20px; margin: 8px 0; }
        .p-obs-two-col > div { flex: 1; }
        .p-obs-pre { font-family: Arial, sans-serif; font-size: 10px; white-space: pre-wrap; color: #444; margin: 3px 0; line-height: 1.5; }
        .p-policy-line { font-size: 10px; font-weight: 700; color: #c0392b; margin-bottom: 2px; }
        .p-footer { border-top: 1px solid #ddd; padding-top: 8px; margin-top: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
        .p-footer-info { font-size: 10px; }
        .p-footer-name { font-weight: 900; color: #0d2244; font-size: 11px; }
        .p-footer-detail { color: #555; margin-top: 2px; }
      `}</style>
    </div>
  );
}
