'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Check, X, Loader2, Hammer } from 'lucide-react';
import {
  obtenerManoDeObraCompleto,
  crearManoDeObra,
  actualizarManoDeObra,
  eliminarManoDeObra,
  type ManoDeObraRow,
} from '@/app/actions/catalogos';

const CATEGORIAS: ManoDeObraRow['categoria'][] = ['ELÉCTRICO', 'NEUMÁTICO', 'MECÁNICO', 'OTRO'];

const CAT_COLORS: Record<string, string> = {
  'ELÉCTRICO': 'bg-yellow-100 text-yellow-800',
  'NEUMÁTICO':  'bg-blue-100 text-blue-800',
  'MECÁNICO':   'bg-orange-100 text-orange-800',
  'OTRO':       'bg-purple-100 text-purple-700',
};

function fmtMXN(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);
}

export default function CatalogoManoDeObraPage() {
  const [items, setItems]         = useState<ManoDeObraRow[]>([]);
  const [cargando, setCargando]   = useState(true);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editData, setEditData]   = useState<Partial<ManoDeObraRow>>({});
  const [guardando, setGuardando] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // Nuevo item
  const [showForm, setShowForm]   = useState(false);
  const [nuevo, setNuevo]         = useState({ nombre: '', categoria: 'ELÉCTRICO' as ManoDeObraRow['categoria'], precio: '' });

  const cargar = async () => {
    setCargando(true);
    const { data } = await obtenerManoDeObraCompleto();
    setItems(data);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const iniciarEdicion = (item: ManoDeObraRow) => {
    setEditandoId(item.id);
    setEditData({ nombre: item.nombre, categoria: item.categoria, precio: item.precio });
  };

  const cancelarEdicion = () => { setEditandoId(null); setEditData({}); };

  const guardarEdicion = async (id: string) => {
    setGuardando(true);
    const { error } = await actualizarManoDeObra(id, {
      nombre:    editData.nombre,
      categoria: editData.categoria,
      precio:    Number(editData.precio),
    });
    if (error) { setError(error); } else { await cargar(); setEditandoId(null); }
    setGuardando(false);
  };

  const toggleActivo = async (item: ManoDeObraRow) => {
    await actualizarManoDeObra(item.id, { activo: !item.activo });
    await cargar();
  };

  const eliminar = async (id: string) => {
    if (!confirm('¿Desactivar este servicio?')) return;
    await eliminarManoDeObra(id);
    await cargar();
  };

  const crearNuevo = async () => {
    if (!nuevo.nombre.trim()) { setError('Escribe el nombre.'); return; }
    setGuardando(true);
    setError(null);
    const { error } = await crearManoDeObra({
      nombre:    nuevo.nombre.trim(),
      categoria: nuevo.categoria,
      precio:    parseFloat(nuevo.precio) || 0,
    });
    if (error) { setError(error); } else {
      setNuevo({ nombre: '', categoria: 'ELÉCTRICO', precio: '' });
      setShowForm(false);
      await cargar();
    }
    setGuardando(false);
  };

  const grouped = CATEGORIAS.reduce<Record<string, ManoDeObraRow[]>>((acc, cat) => {
    acc[cat] = items.filter(i => i.categoria === cat);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0f2d55] flex items-center justify-center">
            <Hammer size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#0f2d55]">Catálogo de Mano de Obra</h1>
            <p className="text-xs text-gray-500">{items.filter(i => i.activo).length} servicios activos</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0f2d55] hover:bg-[#1a4a7a] text-white rounded-xl text-sm font-bold transition-colors"
        >
          <Plus size={16} /> Agregar servicio
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-xl flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}

      {/* Formulario nuevo */}
      {showForm && (
        <div className="bg-white border-2 border-[#0f2d55] rounded-2xl p-5 space-y-3">
          <p className="text-sm font-black text-[#0f2d55]">Nuevo servicio de mano de obra</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Categoría</label>
              <select
                value={nuevo.categoria}
                onChange={e => setNuevo(p => ({ ...p, categoria: e.target.value as ManoDeObraRow['categoria'] }))}
                className="w-full border border-gray-300 rounded-xl px-3 h-10 text-sm outline-none focus:border-blue-400"
              >
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="sm:col-span-1">
              <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Nombre / Descripción</label>
              <input
                type="text"
                value={nuevo.nombre}
                onChange={e => setNuevo(p => ({ ...p, nombre: e.target.value }))}
                placeholder="Ej: Cambio de sensor de velocidad"
                className="w-full border border-gray-300 rounded-xl px-3 h-10 text-sm outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Precio (MXN)</label>
              <input
                type="number" min="0" step="0.01"
                value={nuevo.precio}
                onChange={e => setNuevo(p => ({ ...p, precio: e.target.value }))}
                placeholder="0.00"
                className="w-full border border-gray-300 rounded-xl px-3 h-10 text-sm outline-none focus:border-blue-400"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors">
              Cancelar
            </button>
            <button onClick={crearNuevo} disabled={guardando}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
            >
              {guardando ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Guardar
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
        CATEGORIAS.map(cat => {
          const catItems = grouped[cat];
          if (catItems.length === 0) return null;
          return (
            <div key={cat} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className={`px-5 py-3 flex items-center gap-2 border-b border-gray-100`}>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${CAT_COLORS[cat]}`}>{cat}</span>
                <span className="text-xs text-gray-400">{catItems.length} item{catItems.length !== 1 ? 's' : ''}</span>
              </div>
              <table className="w-full">
                <tbody>
                  {catItems.map(item => (
                    <tr key={item.id} className={`border-b border-gray-50 last:border-0 ${!item.activo ? 'opacity-40' : ''}`}>
                      {editandoId === item.id ? (
                        <>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={editData.nombre ?? ''}
                              onChange={e => setEditData(p => ({ ...p, nombre: e.target.value }))}
                              className="w-full border border-blue-300 rounded-lg px-2 h-8 text-sm outline-none"
                            />
                          </td>
                          <td className="px-4 py-2 w-36">
                            <select
                              value={editData.categoria ?? cat}
                              onChange={e => setEditData(p => ({ ...p, categoria: e.target.value as ManoDeObraRow['categoria'] }))}
                              className="w-full border border-blue-300 rounded-lg px-2 h-8 text-xs outline-none"
                            >
                              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-2 w-32">
                            <input
                              type="number" min="0" step="0.01"
                              value={editData.precio ?? ''}
                              onChange={e => setEditData(p => ({ ...p, precio: parseFloat(e.target.value) || 0 }))}
                              className="w-full border border-blue-300 rounded-lg px-2 h-8 text-sm outline-none text-right"
                            />
                          </td>
                          <td className="px-4 py-2 w-24">
                            <div className="flex gap-1">
                              <button onClick={() => guardarEdicion(item.id)} disabled={guardando}
                                className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                              >
                                {guardando ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                              </button>
                              <button onClick={cancelarEdicion}
                                className="p-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-sm text-gray-800">{item.nombre}</td>
                          <td className="px-4 py-3 w-36">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${CAT_COLORS[item.categoria]}`}>
                              {item.categoria}
                            </span>
                          </td>
                          <td className="px-4 py-3 w-32 text-right text-sm font-black text-[#0f2d55]">
                            {fmtMXN(item.precio)}
                          </td>
                          <td className="px-4 py-3 w-28">
                            <div className="flex items-center gap-1 justify-end">
                              <button onClick={() => toggleActivo(item)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                                  item.activo
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                              >
                                {item.activo ? 'Activo' : 'Inactivo'}
                              </button>
                              <button onClick={() => iniciarEdicion(item)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Pencil size={13} />
                              </button>
                              <button onClick={() => eliminar(item.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
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
            </div>
          );
        })
      )}
    </div>
  );
}
