'use client';

import { useEffect, useState, useMemo } from 'react';
import { obtenerCatalogoGeneral, type ItemCatalogoGeneral } from '@/app/actions/catalogo-general';
import { Loader2, Search, X, BookOpen } from 'lucide-react';


function fmtMXN(n: number | null) {
  if (n == null) return '—';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

const CAT_COLORS: Record<string, string> = {
  CARDANES:            'bg-purple-100 text-purple-800',
  'MATERIAL ELÉCTRICO': 'bg-yellow-100 text-yellow-800',
  SOPORTERÍA:          'bg-green-100 text-green-800',
  TORNILLERÍA:         'bg-orange-100 text-orange-800',
  ELÉCTRICO:           'bg-blue-100 text-blue-800',
  NEUMÁTICO:           'bg-cyan-100 text-cyan-800',
  MECÁNICO:            'bg-gray-100 text-gray-700',
};

export default function CatalogoGeneralPage() {
  const [items, setItems]     = useState<ItemCatalogoGeneral[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [catFiltro, setCatFiltro] = useState('TODOS');

  useEffect(() => {
    obtenerCatalogoGeneral().then(({ data }) => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  const categorias = useMemo(() => {
    const cats = Array.from(new Set(items.map(i => i.categoria ?? 'SIN CATEGORÍA'))).sort();
    return ['TODOS', ...cats];
  }, [items]);

  const filtrados = useMemo(() => {
    return items.filter(item => {
      const matchCat = catFiltro === 'TODOS' || (item.categoria ?? 'SIN CATEGORÍA') === catFiltro;
      const q = busqueda.toLowerCase();
      const matchBusc = !q ||
        item.descripcion.toLowerCase().includes(q) ||
        (item.codigo ?? '').toLowerCase().includes(q) ||
        (item.categoria ?? '').toLowerCase().includes(q) ||
        (item.area ?? '').toLowerCase().includes(q);
      return matchCat && matchBusc;
    });
  }, [items, busqueda, catFiltro]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0f2d55] flex items-center gap-2">
            <BookOpen size={22} /> Catálogo General
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? 'Cargando…' : `${filtrados.length} de ${items.length} artículos`}
          </p>
        </div>
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 h-11 shadow-sm">
        <Search size={15} className="text-gray-400 flex-shrink-0" />
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por descripción, código o categoría…"
          className="flex-1 text-sm outline-none placeholder:text-gray-400"
        />
        {busqueda && (
          <button onClick={() => setBusqueda('')} className="text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filtros categoría */}
      <div className="flex gap-1.5 flex-wrap">
        {categorias.map(cat => (
          <button
            key={cat}
            onClick={() => setCatFiltro(cat)}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors ${
              catFiltro === cat
                ? 'bg-[#0f2d55] text-white'
                : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="animate-spin text-[#0f2d55]" />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen size={36} strokeWidth={1.5} className="mx-auto mb-2" />
          <p className="text-sm">Sin resultados</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-[11px] font-black text-gray-500 uppercase tracking-wider">Código</th>
                  <th className="text-left px-4 py-3 text-[11px] font-black text-gray-500 uppercase tracking-wider">Descripción</th>
                  <th className="text-left px-4 py-3 text-[11px] font-black text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th className="text-left px-4 py-3 text-[11px] font-black text-gray-500 uppercase tracking-wider">Área</th>
                  <th className="text-right px-4 py-3 text-[11px] font-black text-gray-500 uppercase tracking-wider">Precio Compra</th>
                  <th className="text-right px-4 py-3 text-[11px] font-black text-gray-500 uppercase tracking-wider">Precio Venta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtrados.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                        {item.codigo ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{item.descripcion}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        CAT_COLORS[item.categoria ?? ''] ?? 'bg-gray-100 text-gray-600'
                      }`}>
                        {item.categoria ?? 'SIN CATEGORÍA'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-[12px]">{item.area ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600 font-mono text-[12px]">
                      {fmtMXN(item.precio_compra)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-[#0f2d55] font-mono text-[12px]">
                      {fmtMXN(item.precio_venta)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
