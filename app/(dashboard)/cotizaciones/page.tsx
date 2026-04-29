'use client';

import { useState, useEffect } from 'react';
import { FileText, Search, Loader2, Download, Trash2, ExternalLink } from 'lucide-react';
import { obtenerCotizaciones, eliminarCotizacion } from '@/app/actions/cotizaciones';
import type { CotizacionRow } from '@/app/actions/types';

export default function CotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState<CotizacionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const cargar = async () => {
    setLoading(true);
    const { data, error } = await obtenerCotizaciones();
    if (!error) setCotizaciones(data);
    setLoading(false);
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Seguro que quieres eliminar esta cotización?')) return;
    setDeletingId(id);
    const { error } = await eliminarCotizacion(id);
    if (error) alert('Error: ' + error);
    else setCotizaciones(prev => prev.filter(c => c.id !== id));
    setDeletingId(null);
  };

  const filtered = cotizaciones.filter(c => 
    (c.folio ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.empresas?.nombre_comercial?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function formatMXN(n: number) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Mis Cotizaciones</h1>
          <p className="text-gray-500 mt-1">Lista completa de presupuestos generados.</p>
        </div>
      </div>

      {/* ── Buscador ── */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400 group-focus-within:text-red-500 transition-colors" />
        </div>
        <input 
          type="text"
          placeholder="Buscar por folio o cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-14 pl-12 pr-4 bg-white border border-gray-200 rounded-2xl outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50/50 transition-all text-sm"
        />
      </div>

      {/* ── Listado ── */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-red-500 w-10 h-10" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="overflow-hidden bg-white border border-gray-200 rounded-3xl shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-4">Folio</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 font-black text-gray-900">{c.folio ?? '—'}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-800">{c.empresas?.nombre_comercial}</p>
                    <p className="text-[10px] text-gray-400 italic">Creada: {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-gray-100 text-gray-500 uppercase tracking-tighter">
                      {(c.tipo ?? '').replace('cotizador-', '')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-gray-900">{formatMXN(c.total_mxn ?? 0)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleEliminar(c.id)}
                        disabled={deletingId === c.id}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        {deletingId === c.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 px-4 bg-gray-50/50 rounded-[32px] border-2 border-dashed border-gray-200">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6">
            <FileText size={32} className="text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">No hay cotizaciones encontradas</h3>
          <p className="text-gray-500 mt-2 text-center max-w-xs">
            {searchTerm ? 'No coinciden resultados con tu búsqueda.' : 'Aún no has generado cotizaciones el día de hoy.'}
          </p>
        </div>
      )}
    </div>
  );
}
