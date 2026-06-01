'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Pencil, Trash2, Check, X, Loader2, Package } from 'lucide-react';
import {
  obtenerRefaccionesCompleto,
  crearRefaccion,
  actualizarRefaccion,
  eliminarRefaccion,
  type RefaccionRow,
} from '@/app/actions/catalogos';

const CATEGORIAS: RefaccionRow['categoria'][] = [
  'SOPORTERÍA', 'CARDANES', 'MATERIAL ELÉCTRICO', 'TORNILLERÍA', 'ELÉCTRICO', 'NEUMÁTICO', 'MECÁNICO',
];

const CAT_COLORS: Record<string, string> = {
  'SOPORTERÍA':        'bg-green-100 text-green-800',
  'CARDANES':          'bg-purple-100 text-purple-800',
  'MATERIAL ELÉCTRICO':'bg-red-100 text-red-800',
  'TORNILLERÍA':       'bg-orange-100 text-orange-800',
  'ELÉCTRICO':         'bg-yellow-100 text-yellow-800',
  'NEUMÁTICO':         'bg-blue-100 text-blue-800',
  'MECÁNICO':          'bg-gray-100 text-gray-700',
};

const CAT_LABELS: Record<string, string> = {
  'SOPORTERÍA':        'Soportería',
  'CARDANES':          'Cardanes',
  'MATERIAL ELÉCTRICO':'Material Eléctrico',
  'TORNILLERÍA':       'Tornillería',
  'ELÉCTRICO':         'Eléctrico',
  'NEUMÁTICO':         'Neumático',
  'MECÁNICO':          'Mecánico',
};

function fmtMXN(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 }).format(n);
}

export default function CatalogoRefaccionesPage() {
  const searchParams  = useSearchParams();
  const catParam      = searchParams.get('cat') as RefaccionRow['categoria'] | null;
  const catsVisibles  = catParam ? [catParam] : CATEGORIAS;

  const [items, setItems]           = useState<RefaccionRow[]>([]);
  const [cargando, setCargando]     = useState(true);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editData, setEditData]     = useState<Partial<RefaccionRow>>({});
  const [guardando, setGuardando]   = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [nuevo, setNuevo]       = useState({
    nombre: '', categoria: 'MECÁNICO' as RefaccionRow['categoria'],
    precio_venta: '', numero_parte: '',
  });

  const cargar = async () => {
    setCargando(true);
    const { data } = await obtenerRefaccionesCompleto();
    setItems(data);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const iniciarEdicion = (item: RefaccionRow) => {
    setEditandoId(item.id);
    setEditData({ nombre: item.nombre, categoria: item.categoria, precio_venta: item.precio_venta, numero_parte: item.numero_parte });
  };

  const cancelarEdicion = () => { setEditandoId(null); setEditData({}); };

  const guardarEdicion = async (id: string) => {
    setGuardando(true);
    const { error } = await actualizarRefaccion(id, {
      nombre:       editData.nombre,
      categoria:    editData.categoria,
      precio_venta: Number(editData.precio_venta),
      numero_parte: editData.numero_parte || null,
    });
    if (error) { setError(error); } else { await cargar(); setEditandoId(null); }
    setGuardando(false);
  };

  const toggleActivo = async (item: RefaccionRow) => {
    await actualizarRefaccion(item.id, { activo: !item.activo });
    await cargar();
  };

  const eliminar = async (id: string) => {
    if (!confirm('¿Desactivar esta refacción?')) return;
    await eliminarRefaccion(id);
    await cargar();
  };

  const crearNuevo = async () => {
    if (!nuevo.nombre.trim()) { setError('Escribe el nombre.'); return; }
    setGuardando(true);
    setError(null);
    const { error } = await crearRefaccion({
      nombre:       nuevo.nombre.trim(),
      categoria:    nuevo.categoria,
      precio_venta: parseFloat(nuevo.precio_venta) || 0,
      numero_parte: nuevo.numero_parte || undefined,
    });
    if (error) { setError(error); } else {
      setNuevo({ nombre: '', categoria: 'MECÁNICO', precio_venta: '', numero_parte: '' });
      setShowForm(false);
      await cargar();
    }
    setGuardando(false);
  };

  const grouped = CATEGORIAS.reduce<Record<string, RefaccionRow[]>>((acc, cat) => {
    acc[cat] = items.filter(i => i.categoria === cat);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
            <Package size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#0f2d55]">
              {catParam ? `Catálogo: ${CAT_LABELS[catParam] ?? catParam}` : 'Catálogo de Refacciones'}
            </h1>
            <p className="text-xs text-gray-500">
              {items.filter(i => i.activo && (!catParam || i.categoria === catParam)).length} items activos
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-colors"
        >
          <Plus size={16} /> Agregar refacción
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-xl flex items-center justify-between">
          {error}<button onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}

      {/* Formulario nuevo */}
      {showForm && (
        <div className="bg-white border-2 border-orange-400 rounded-2xl p-5 space-y-3">
          <p className="text-sm font-black text-orange-600">Nueva refacción</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Categoría</label>
              <select
                value={nuevo.categoria}
                onChange={e => setNuevo(p => ({ ...p, categoria: e.target.value as RefaccionRow['categoria'] }))}
                className="w-full border border-gray-300 rounded-xl px-3 h-10 text-sm outline-none focus:border-orange-400"
              >
                {CATEGORIAS.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Nombre</label>
              <input
                type="text" value={nuevo.nombre}
                onChange={e => setNuevo(p => ({ ...p, nombre: e.target.value }))}
                placeholder="Ej: Soportería lateral derecha"
                className="w-full border border-gray-300 rounded-xl px-3 h-10 text-sm outline-none focus:border-orange-400"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Precio MXN</label>
              <input
                type="number" min="0" step="0.01" value={nuevo.precio_venta}
                onChange={e => setNuevo(p => ({ ...p, precio_venta: e.target.value }))}
                placeholder="0.00"
                className="w-full border border-gray-300 rounded-xl px-3 h-10 text-sm outline-none focus:border-orange-400"
              />
            </div>
          </div>
          <div className="max-w-xs">
            <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">No. de parte (opcional)</label>
            <input
              type="text" value={nuevo.numero_parte}
              onChange={e => setNuevo(p => ({ ...p, numero_parte: e.target.value }))}
              placeholder="Ej: SPT-001"
              className="w-full border border-gray-300 rounded-xl px-3 h-10 text-sm outline-none focus:border-orange-400"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors">Cancelar</button>
            <button onClick={crearNuevo} disabled={guardando}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
            >
              {guardando ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Guardar
            </button>
          </div>
        </div>
      )}

      {/* Tabla por categoría */}
      {cargando ? (
        <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
          <Loader2 size={20} className="animate-spin" /> Cargando catálogo...
        </div>
      ) : (
        catsVisibles.map(cat => {
          const catItems = grouped[cat];
          return (
            <div key={cat} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 flex items-center gap-2 border-b border-gray-100">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${CAT_COLORS[cat]}`}>{CAT_LABELS[cat]}</span>
                <span className="text-xs text-gray-400">{catItems.length} item{catItems.length !== 1 ? 's' : ''}</span>
              </div>
              {catItems.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6 italic">Sin refacciones en esta categoría</p>
              ) : (
                <table className="w-full">
                  <tbody>
                    {catItems.map(item => (
                      <tr key={item.id} className={`border-b border-gray-50 last:border-0 ${!item.activo ? 'opacity-40' : ''}`}>
                        {editandoId === item.id ? (
                          <>
                            <td className="px-4 py-2">
                              <input type="text" value={editData.nombre ?? ''}
                                onChange={e => setEditData(p => ({ ...p, nombre: e.target.value }))}
                                className="w-full border border-orange-300 rounded-lg px-2 h-8 text-sm outline-none"
                              />
                            </td>
                            <td className="px-4 py-2 w-32">
                              <input type="text" value={editData.numero_parte ?? ''}
                                onChange={e => setEditData(p => ({ ...p, numero_parte: e.target.value }))}
                                placeholder="No. parte"
                                className="w-full border border-orange-300 rounded-lg px-2 h-8 text-xs outline-none"
                              />
                            </td>
                            <td className="px-4 py-2 w-36">
                              <select value={editData.categoria ?? cat}
                                onChange={e => setEditData(p => ({ ...p, categoria: e.target.value as RefaccionRow['categoria'] }))}
                                className="w-full border border-orange-300 rounded-lg px-2 h-8 text-xs outline-none"
                              >
                                {CATEGORIAS.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
                              </select>
                            </td>
                            <td className="px-4 py-2 w-32">
                              <input type="number" min="0" step="0.01" value={editData.precio_venta ?? ''}
                                onChange={e => setEditData(p => ({ ...p, precio_venta: parseFloat(e.target.value) || 0 }))}
                                className="w-full border border-orange-300 rounded-lg px-2 h-8 text-sm outline-none text-right"
                              />
                            </td>
                            <td className="px-4 py-2 w-24">
                              <div className="flex gap-1">
                                <button onClick={() => guardarEdicion(item.id)} disabled={guardando}
                                  className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                                >
                                  {guardando ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                </button>
                                <button onClick={cancelarEdicion} className="p-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors">
                                  <X size={12} />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 text-sm text-gray-800">{item.nombre}</td>
                            <td className="px-4 py-3 w-32 text-xs text-gray-400">{item.numero_parte ? `#${item.numero_parte}` : '—'}</td>
                            <td className="px-4 py-3 w-36">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${CAT_COLORS[item.categoria]}`}>
                                {CAT_LABELS[item.categoria]}
                              </span>
                            </td>
                            <td className="px-4 py-3 w-32 text-right text-sm font-black text-orange-600">{fmtMXN(item.precio_venta)}</td>
                            <td className="px-4 py-3 w-28">
                              <div className="flex items-center gap-1 justify-end">
                                <button onClick={() => toggleActivo(item)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                                    item.activo ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                  }`}
                                >
                                  {item.activo ? 'Activo' : 'Inactivo'}
                                </button>
                                <button onClick={() => iniciarEdicion(item)} className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
                                  <Pencil size={13} />
                                </button>
                                <button onClick={() => eliminar(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
