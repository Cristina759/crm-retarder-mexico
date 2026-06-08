'use client';

import { useEffect, useRef, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  Loader2, FolderOpen, Upload, Trash2, Download, Search, X,
  FileText, File, FileImage, AlertCircle, Truck, Plus,
} from 'lucide-react';
import { listarDocsUnidades, subirDocUnidad, eliminarDocUnidad, type DocUnidad } from '@/app/actions/documentos-unidades';

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}
function fmtSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
function FileIcon({ nombre }: { nombre: string }) {
  const ext = nombre.split('.').pop()?.toLowerCase() ?? '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext))
    return <FileImage size={18} className="text-blue-500" />;
  if (['pdf'].includes(ext))
    return <FileText size={18} className="text-red-500" />;
  return <File size={18} className="text-gray-400" />;
}

const TIPOS_DOC = [
  'Verificación', 'Seguro', 'Tarjeta de Circulación', 'Factura Unidad',
  'Licencia', 'Mantenimiento', 'Contrato', 'Fotografías', 'Otro',
];

// ── Modal Subir ───────────────────────────────────────────────────────────────
function ModalSubir({ onClose, onSubido, userName }: { onClose: () => void; onSubido: () => void; userName: string }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDesc] = useState('');
  const [cliente, setCliente] = useState('');
  const [numUnidad, setNumUnidad] = useState('');
  const [tipoDoc, setTipoDoc] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivo) { setErr('Selecciona un archivo.'); return; }
    if (!nombre.trim()) { setErr('El nombre es requerido.'); return; }
    setSubiendo(true);
    setErr('');
    const fd = new FormData();
    fd.append('archivo', archivo);
    fd.append('nombre', nombre.trim());
    fd.append('descripcion', descripcion.trim());
    fd.append('cliente', cliente.trim());
    fd.append('numero_unidad', numUnidad.trim());
    fd.append('tipo_doc', tipoDoc);
    fd.append('subido_por', userName);
    const { error } = await subirDocUnidad(fd);
    setSubiendo(false);
    if (error) { setErr(error); return; }
    onSubido();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-black text-[#0f2d55] flex items-center gap-2">
            <Upload size={17} /> Subir Documento
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-3">
          {/* Archivo */}
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 transition-colors"
          >
            {archivo ? (
              <p className="text-sm font-semibold text-blue-700 truncate">{archivo.name}</p>
            ) : (
              <p className="text-sm text-gray-400">Haz clic para seleccionar archivo (PDF, imagen, Word…)</p>
            )}
            <input ref={fileRef} type="file" className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.zip,.rar"
              onChange={e => { const f = e.target.files?.[0]; if (f) { setArchivo(f); if (!nombre) setNombre(f.name.replace(/\.[^.]+$/, '')); } }}
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Nombre del documento *</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Verificación Unidad 5 - 2025"
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Cliente</label>
              <input value={cliente} onChange={e => setCliente(e.target.value)} placeholder="Nombre del cliente"
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">No. Unidad / Placa</label>
              <input value={numUnidad} onChange={e => setNumUnidad(e.target.value)} placeholder="Ej: UA-05 / ABC-123"
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Tipo de documento</label>
            <select value={tipoDoc} onChange={e => setTipoDoc(e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white">
              <option value="">— Seleccionar —</option>
              {TIPOS_DOC.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Descripción (opcional)</label>
            <textarea value={descripcion} onChange={e => setDesc(e.target.value)} rows={2}
              placeholder="Notas adicionales…"
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none" />
          </div>

          {err && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={subiendo}
              className="flex-1 px-4 py-2 rounded-xl bg-[#0f2d55] text-white text-sm font-black hover:bg-blue-900 transition-colors flex items-center justify-center gap-2">
              {subiendo ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
              {subiendo ? 'Subiendo…' : 'Subir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Tarjeta de documento ──────────────────────────────────────────────────────
function TarjetaDoc({ doc, esAdmin, onEliminar }: { doc: DocUnidad; esAdmin: boolean; onEliminar: (id: string) => void }) {
  const [eliminando, setEliminando] = useState(false);

  const handleEliminar = async () => {
    if (!confirm(`¿Eliminar "${doc.nombre}"? Esta acción no se puede deshacer.`)) return;
    setEliminando(true);
    await eliminarDocUnidad(doc.id);
    onEliminar(doc.id);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col gap-2 hover:border-blue-200 hover:shadow-sm transition-all">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
          <FileIcon nombre={doc.archivo_nombre} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800 leading-tight truncate" title={doc.nombre}>{doc.nombre}</p>
          {doc.descripcion && <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{doc.descripcion}</p>}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {doc.cliente && (
          <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
            {doc.cliente}
          </span>
        )}
        {doc.numero_unidad && (
          <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100 flex items-center gap-1">
            <Truck size={9} /> {doc.numero_unidad}
          </span>
        )}
        {doc.tipo_doc && (
          <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {doc.tipo_doc}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] text-gray-400">{fmtFecha(doc.created_at)}{doc.subido_por ? ` · ${doc.subido_por}` : ''}</span>
        <div className="flex items-center gap-1">
          <a
            href={doc.archivo_url}
            target="_blank"
            rel="noopener noreferrer"
            download={doc.archivo_nombre}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
            title="Descargar"
          >
            <Download size={14} />
          </a>
          {esAdmin && (
            <button
              onClick={handleEliminar}
              disabled={eliminando}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
              title="Eliminar"
            >
              {eliminando ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DocumentosUnidadesPage() {
  const { user } = useUser();
  const rol = (user?.publicMetadata?.role as string) ?? '';
  const esAdmin = rol === 'admin' || rol === 'administrativo';

  const [docs, setDocs] = useState<DocUnidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [modalSubir, setModalSubir] = useState(false);

  const cargar = async () => {
    setLoading(true);
    const { data, error: err } = await listarDocsUnidades();
    if (err) setError(err);
    else setDocs(data);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  // Filtros
  const clientes = [...new Set(docs.map(d => d.cliente).filter(Boolean))] as string[];
  const tipos = [...new Set(docs.map(d => d.tipo_doc).filter(Boolean))] as string[];

  const q = busqueda.toLowerCase().trim();
  const docsFiltrados = docs.filter(d => {
    const matchQ = !q || [d.nombre, d.cliente, d.numero_unidad, d.tipo_doc, d.descripcion, d.archivo_nombre]
      .some(v => v?.toLowerCase().includes(q));
    const matchCliente = !filtroCliente || d.cliente === filtroCliente;
    const matchTipo = !filtroTipo || d.tipo_doc === filtroTipo;
    return matchQ && matchCliente && matchTipo;
  });

  const handleEliminar = (id: string) => setDocs(prev => prev.filter(d => d.id !== id));

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-[#0f2d55]" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <AlertCircle className="w-8 h-8 text-red-500" />
      <p className="text-red-600 font-semibold">{error}</p>
    </div>
  );

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#0f2d55] flex items-center justify-center">
          <Truck size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-black text-[#0f2d55]">Documentos de Unidades</h1>
          <p className="text-[11px] text-gray-400">
            {docs.length} documento{docs.length !== 1 ? 's' : ''}
            {esAdmin ? ' · Solo admins pueden subir y eliminar' : ' · Solo lectura y descarga'}
          </p>
        </div>
        {esAdmin && (
          <button
            onClick={() => setModalSubir(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0f2d55] text-white rounded-xl text-sm font-bold shadow-sm hover:bg-blue-900 transition-all"
          >
            <Plus size={15} /> Subir Documento
          </button>
        )}
      </div>

      {/* Buscador + filtros */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, cliente, unidad, tipo…"
            className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>
        {clientes.length > 0 && (
          <select value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white">
            <option value="">Todos los clientes</option>
            {clientes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        {tipos.length > 0 && (
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white">
            <option value="">Todos los tipos</option>
            {tipos.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
      </div>

      {/* Grid de documentos */}
      {docsFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <FolderOpen size={40} strokeWidth={1.2} />
          <p className="text-sm font-semibold">
            {q || filtroCliente || filtroTipo ? 'Sin resultados para los filtros aplicados' : 'Aún no hay documentos subidos'}
          </p>
          {esAdmin && !q && !filtroCliente && !filtroTipo && (
            <button onClick={() => setModalSubir(true)}
              className="mt-2 px-4 py-2 bg-[#0f2d55] text-white rounded-xl text-sm font-bold hover:bg-blue-900 transition-colors flex items-center gap-2">
              <Upload size={14} /> Subir el primero
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {docsFiltrados.map(doc => (
            <TarjetaDoc key={doc.id} doc={doc} esAdmin={esAdmin} onEliminar={handleEliminar} />
          ))}
        </div>
      )}

      {/* Modal subir */}
      {modalSubir && (
        <ModalSubir
          onClose={() => setModalSubir(false)}
          onSubido={cargar}
          userName={user?.firstName ?? user?.username ?? 'Admin'}
        />
      )}
    </div>
  );
}
