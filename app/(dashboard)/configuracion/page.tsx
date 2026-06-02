'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Settings, Users, BookOpen, Wrench, Plus, Pencil, Trash2,
  X, Check, Loader2, AlertCircle, ChevronDown, Package,
  Building2, Mail, Shield, RefreshCw, FileText, Upload,
  Download, ChevronRight, FolderOpen, Eye,
} from 'lucide-react';
import {
  obtenerManoDeObraCompleto, crearManoDeObra, actualizarManoDeObra, eliminarManoDeObra,
  obtenerRefaccionesCompleto, crearRefaccion, actualizarRefaccion, eliminarRefaccion,
  type ManoDeObraRow, type RefaccionRow,
} from '@/app/actions/catalogos';
import {
  obtenerUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario,
} from '@/app/actions/usuarios';
import {
  obtenerDocumentosUsuario, subirDocumentoUsuario, eliminarDocumentoUsuario, getDocumentoUrl,
  type DocumentoRow,
} from '@/app/actions/documentos';
import type { UsuarioRow } from '@/app/actions/types';

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtMXN(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

const ROL_LABELS: Record<string, { label: string; color: string }> = {
  admin:          { label: 'Admin',          color: 'bg-[#0f2d55] text-white' },
  administrativo: { label: 'Administrativo', color: 'bg-purple-100 text-purple-800' },
  tecnico:        { label: 'Técnico',        color: 'bg-yellow-100 text-yellow-800' },
  ventas:         { label: 'Ventas',         color: 'bg-green-100 text-green-800' },
};

const CAT_MO  = ['ELÉCTRICO', 'NEUMÁTICO', 'MECÁNICO', 'OTRO'] as const;
const CAT_REF = ['ELÉCTRICO', 'NEUMÁTICO', 'TORNILLERÍA', 'MECÁNICO'] as const;
const ROLES   = ['admin', 'administrativo', 'tecnico', 'ventas'] as const;

// ── Tab: Catálogos ────────────────────────────────────────────────────────────
function TabCatalogos() {
  const [sub, setSub]             = useState<'mo' | 'ref'>('mo');
  const [manoObra, setManoObra]   = useState<ManoDeObraRow[]>([]);
  const [refacciones, setRefacciones] = useState<RefaccionRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [editRow, setEditRow]     = useState<ManoDeObraRow | RefaccionRow | null>(null);
  const [saving, setSaving]       = useState(false);

  // form
  const [fNombre,   setFNombre]   = useState('');
  const [fCat,      setFCat]      = useState('');
  const [fPrecio,   setFPrecio]   = useState('');
  const [fNumParte, setFNumParte] = useState('');

  const loadAll = async () => {
    setLoading(true);
    const [{ data: mo }, { data: ref }] = await Promise.all([
      obtenerManoDeObraCompleto(),
      obtenerRefaccionesCompleto(),
    ]);
    setManoObra(mo);
    setRefacciones(ref);
    setLoading(false);
  };
  useEffect(() => { loadAll(); }, []);

  const openNew = () => {
    setEditRow(null);
    setFNombre(''); setFCat(''); setFPrecio(''); setFNumParte('');
    setModal(true);
  };

  const openEdit = (row: ManoDeObraRow | RefaccionRow) => {
    setEditRow(row);
    setFNombre(row.nombre);
    setFCat(row.categoria);
    if (sub === 'mo') {
      setFPrecio(String((row as ManoDeObraRow).precio));
      setFNumParte('');
    } else {
      setFPrecio(String((row as RefaccionRow).precio_venta));
      setFNumParte((row as RefaccionRow).numero_parte ?? '');
    }
    setModal(true);
  };

  const handleSave = async () => {
    if (!fNombre || !fCat || !fPrecio) return;
    setSaving(true);
    if (sub === 'mo') {
      if (editRow) {
        await actualizarManoDeObra(editRow.id, {
          nombre: fNombre,
          categoria: fCat as ManoDeObraRow['categoria'],
          precio: parseFloat(fPrecio),
        });
      } else {
        await crearManoDeObra({
          nombre: fNombre,
          categoria: fCat as ManoDeObraRow['categoria'],
          precio: parseFloat(fPrecio),
        });
      }
    } else {
      if (editRow) {
        await actualizarRefaccion(editRow.id, {
          nombre: fNombre,
          categoria: fCat as RefaccionRow['categoria'],
          precio_venta: parseFloat(fPrecio),
          numero_parte: fNumParte || null,
        });
      } else {
        await crearRefaccion({
          nombre: fNombre,
          categoria: fCat as RefaccionRow['categoria'],
          precio_venta: parseFloat(fPrecio),
          numero_parte: fNumParte || undefined,
        });
      }
    }
    await loadAll();
    setModal(false);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Desactivar este elemento del catálogo?')) return;
    if (sub === 'mo') await eliminarManoDeObra(id);
    else await eliminarRefaccion(id);
    await loadAll();
  };

  const cats = sub === 'mo' ? CAT_MO : CAT_REF;

  // Group by category
  const grouped: Record<string, { id: string; nombre: string; categoria: string; activo: boolean }[]> =
    cats.reduce((acc, cat) => {
      if (sub === 'mo') {
        acc[cat] = manoObra.filter(r => r.categoria === cat);
      } else {
        acc[cat] = refacciones.filter(r => r.categoria === cat);
      }
      return acc;
    }, {} as Record<string, { id: string; nombre: string; categoria: string; activo: boolean }[]>);

  const rows = sub === 'mo' ? manoObra : refacciones;

  return (
    <div className="space-y-5">
      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#0f2d55]">
                {editRow ? 'Editar' : 'Nuevo'} {sub === 'mo' ? 'Servicio' : 'Refacción'}
              </h3>
              <button onClick={() => setModal(false)} className="p-1.5 rounded-xl hover:bg-gray-100">
                <X size={15} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 block mb-1">Nombre *</label>
                <input
                  value={fNombre} onChange={e => setFNombre(e.target.value)}
                  placeholder={sub === 'mo' ? 'Ej. Revisión de frenos' : 'Ej. Válvula ABS'}
                  className="w-full border border-gray-200 rounded-xl px-3 h-9 text-sm outline-none focus:border-yellow-400"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 block mb-1">Categoría *</label>
                <div className="relative">
                  <select
                    value={fCat} onChange={e => setFCat(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 h-9 text-sm outline-none focus:border-yellow-400 bg-white appearance-none"
                  >
                    <option value="">— Seleccionar —</option>
                    {cats.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 block mb-1">
                  {sub === 'mo' ? 'Precio MXN *' : 'Precio venta MXN *'}
                </label>
                <input
                  type="number" value={fPrecio} onChange={e => setFPrecio(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-gray-200 rounded-xl px-3 h-9 text-sm outline-none focus:border-yellow-400"
                />
              </div>
              {sub === 'ref' && (
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">Número de parte</label>
                  <input
                    value={fNumParte} onChange={e => setFNumParte(e.target.value)}
                    placeholder="Ej. RT-2241"
                    className="w-full border border-gray-200 rounded-xl px-3 h-9 text-sm outline-none focus:border-yellow-400"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setModal(false)}
                className="flex-1 h-10 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
              >Cancelar</button>
              <button
                onClick={handleSave}
                disabled={saving || !fNombre || !fCat || !fPrecio}
                className="flex-1 h-10 bg-[#0f2d55] hover:bg-[#1a3d6e] text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => setSub('mo')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              sub === 'mo' ? 'bg-white text-[#0f2d55] shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Wrench size={14} /> Mano de Obra
          </button>
          <button
            onClick={() => setSub('ref')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              sub === 'ref' ? 'bg-white text-[#0f2d55] shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Package size={14} /> Refacciones
          </button>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-[#0f2d55] hover:bg-[#1a3d6e] text-white rounded-xl text-sm font-bold transition-colors"
        >
          <Plus size={14} /> Agregar {sub === 'mo' ? 'Servicio' : 'Refacción'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-[#0f2d55]" /></div>
      ) : (
        <div className="space-y-4">
          {cats.map(cat => (
            grouped[cat].length === 0 ? null : (
              <div key={cat} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0f2d55] uppercase tracking-wider">{cat}</span>
                  <span className="text-[10px] text-gray-400">{grouped[cat].length} elemento{grouped[cat].length !== 1 ? 's' : ''}</span>
                </div>
                <table className="w-full">
                  <tbody>
                    {grouped[cat].map((row, i) => (
                      <tr key={row.id} className={`${i !== 0 ? 'border-t border-gray-100' : ''} hover:bg-gray-50 transition-colors`}>
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-gray-800">{row.nombre}</p>
                          {sub === 'ref' && (row as RefaccionRow).numero_parte && (
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{(row as RefaccionRow).numero_parte}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-bold text-[#0f2d55]">
                            {sub === 'mo' ? fmtMXN((row as ManoDeObraRow).precio) : fmtMXN((row as RefaccionRow).precio_venta)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right w-20">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(row as ManoDeObraRow | RefaccionRow)}
                              className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                              <Pencil size={13} className="text-blue-400" />
                            </button>
                            <button
                              onClick={() => handleDelete(row.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={13} className="text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ))}
          {rows.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center text-gray-400 text-sm">
              Sin elementos en el catálogo
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Panel de documentos de un usuario ────────────────────────────────────────
function PanelDocumentos({ usuario, onClose }: { usuario: UsuarioRow; onClose: () => void }) {
  const [docs, setDocs]       = useState<DocumentoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const fileRef               = useRef<HTMLInputElement>(null);
  const [visorDoc, setVisorDoc] = useState<{ url: string; nombre: string; tipo: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await obtenerDocumentosUsuario(usuario.id);
    setDocs(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, [usuario.id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append('file', file);
    const { error: err } = await subirDocumentoUsuario(usuario.id, fd);
    if (err) { setError(err); }
    else { await load(); }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este documento?')) return;
    await eliminarDocumentoUsuario(id);
    setDocs(prev => prev.filter(d => d.id !== id));
  };

  const handleDownload = async (doc: DocumentoRow) => {
    const { url, error: err } = await getDocumentoUrl(doc.storage_path);
    if (err || !url) { alert('No se pudo generar el enlace.'); return; }
    window.open(url, '_blank');
  };

  const handleVer = async (doc: DocumentoRow) => {
    const { url, error: err } = await getDocumentoUrl(doc.storage_path);
    if (err || !url) { alert('No se pudo generar el enlace.'); return; }
    setVisorDoc({ url, nombre: doc.nombre, tipo: (doc.tipo ?? '').toUpperCase() });
  };

  const fmtSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const iconColor: Record<string, string> = {
    PDF: 'text-red-500', PNG: 'text-green-500', JPG: 'text-green-500',
    JPEG: 'text-green-500', DOC: 'text-blue-500', DOCX: 'text-blue-500',
    XLS: 'text-emerald-600', XLSX: 'text-emerald-600',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: '85vh' }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-full bg-[#0f2d55]/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-black text-[#0f2d55]">{usuario.nombre.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-[#0f2d55] truncate">{usuario.nombre}</p>
            <p className="text-[11px] text-gray-400">Documentos del usuario</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        {/* Subir archivo */}
        <div className="px-5 py-3 border-b border-gray-100">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
            onChange={handleUpload}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className={`flex items-center justify-center gap-2 w-full h-10 rounded-xl border-2 border-dashed cursor-pointer transition-colors text-sm font-semibold ${
              uploading
                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                : 'border-[#0f2d55]/30 text-[#0f2d55] hover:border-[#0f2d55] hover:bg-[#0f2d55]/5'
            }`}
          >
            {uploading
              ? <><Loader2 size={15} className="animate-spin" /> Subiendo...</>
              : <><Upload size={15} /> Subir documento</>
            }
          </label>
          {error && <p className="text-[11px] text-red-600 mt-1.5 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
          <p className="text-[10px] text-gray-400 mt-1">PDF, Word, Excel, imagen · máx. 20 MB</p>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-[#0f2d55]" /></div>
          ) : docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
              <FolderOpen size={32} strokeWidth={1.5} />
              <p className="text-sm">Sin documentos aún</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {docs.map(doc => (
                <div key={doc.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors group">
                  <FileText size={18} className={`flex-shrink-0 ${iconColor[doc.tipo ?? ''] ?? 'text-gray-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{doc.nombre}</p>
                    <p className="text-[10px] text-gray-400">
                      {doc.tipo} · {fmtSize(doc.tamanio)} · {new Date(doc.created_at).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleVer(doc)}
                      className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-400 transition-colors"
                      title="Ver documento"
                    >
                      <Eye size={13} />
                    </button>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-400 transition-colors"
                      title="Descargar"
                    >
                      <Download size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex justify-between items-center">
          <span className="text-[11px] text-gray-400">{docs.length} documento{docs.length !== 1 ? 's' : ''}</span>
          <button onClick={onClose} className="h-9 px-4 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
            Cerrar
          </button>
        </div>
      </div>

      {/* ── Modal visor de documento ─────────────────────────────────────── */}
      {visorDoc && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex flex-col items-center justify-center p-4" onClick={() => setVisorDoc(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full flex flex-col" style={{ maxWidth: 900, maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            {/* Header visor */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 flex-shrink-0">
              <FileText size={16} className="text-[#0f2d55]" />
              <p className="flex-1 text-sm font-bold text-[#0f2d55] truncate">{visorDoc.nombre}</p>
              <a
                href={visorDoc.url}
                download={visorDoc.nombre}
                className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-400 transition-colors"
                title="Descargar"
                onClick={e => e.stopPropagation()}
              >
                <Download size={14} />
              </a>
              <button onClick={() => setVisorDoc(null)} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400">
                <X size={16} />
              </button>
            </div>
            {/* Contenido */}
            <div className="flex-1 overflow-hidden rounded-b-2xl bg-gray-100" style={{ minHeight: 400 }}>
              {['PDF'].includes(visorDoc.tipo) ? (
                <iframe
                  src={visorDoc.url}
                  className="w-full h-full rounded-b-2xl"
                  style={{ minHeight: 500, border: 'none' }}
                  title={visorDoc.nombre}
                />
              ) : ['JPG', 'JPEG', 'PNG', 'WEBP', 'GIF'].includes(visorDoc.tipo) ? (
                <div className="flex items-center justify-center w-full h-full p-4" style={{ minHeight: 400 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={visorDoc.url}
                    alt={visorDoc.nombre}
                    className="max-w-full max-h-[70vh] rounded-xl object-contain shadow"
                  />
                </div>
              ) : (
                <iframe
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(visorDoc.url)}&embedded=true`}
                  className="w-full h-full rounded-b-2xl"
                  style={{ minHeight: 500, border: 'none' }}
                  title={visorDoc.nombre}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Usuarios ─────────────────────────────────────────────────────────────
function TabUsuarios() {
  const [usuarios, setUsuarios]   = useState<UsuarioRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [editRow, setEditRow]     = useState<UsuarioRow | null>(null);
  const [saving, setSaving]       = useState(false);
  const [fNombre,  setFNombre]    = useState('');
  const [fEmail,   setFEmail]     = useState('');
  const [fRol,     setFRol]       = useState('tecnico');
  const [usuarioDocumentos, setUsuarioDocumentos] = useState<UsuarioRow | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await obtenerUsuarios();
    setUsuarios(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditRow(null); setFNombre(''); setFEmail(''); setFRol('tecnico');
    setModal(true);
  };
  const openEdit = (u: UsuarioRow) => {
    setEditRow(u); setFNombre(u.nombre); setFEmail(u.email); setFRol(u.rol);
    setModal(true);
  };

  const handleSave = async () => {
    if (!fNombre || !fEmail) return;
    setSaving(true);
    if (editRow) await actualizarUsuario(editRow.id, { nombre: fNombre, email: fEmail, rol: fRol });
    else await crearUsuario({ nombre: fNombre, email: fEmail, rol: fRol });
    await load();
    setModal(false); setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este usuario del CRM? No afecta su acceso en Clerk.')) return;
    await eliminarUsuario(id);
    setUsuarios(prev => prev.filter(u => u.id !== id));
  };

  const byRol = ROLES.reduce((acc, r) => {
    acc[r] = usuarios.filter(u => u.rol === r);
    return acc;
  }, {} as Record<string, UsuarioRow[]>);

  return (
    <div className="space-y-5">
      {/* Modal editar/crear usuario */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#0f2d55]">
                {editRow ? 'Editar usuario' : 'Nuevo usuario'}
              </h3>
              <button onClick={() => setModal(false)} className="p-1.5 rounded-xl hover:bg-gray-100">
                <X size={15} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 block mb-1">Nombre completo *</label>
                <input
                  value={fNombre} onChange={e => setFNombre(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full border border-gray-200 rounded-xl px-3 h-9 text-sm outline-none focus:border-yellow-400"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 block mb-1">Correo electrónico *</label>
                <input
                  type="email" value={fEmail} onChange={e => setFEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  className="w-full border border-gray-200 rounded-xl px-3 h-9 text-sm outline-none focus:border-yellow-400"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 block mb-1">Rol *</label>
                <div className="relative">
                  <select
                    value={fRol} onChange={e => setFRol(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 h-9 text-sm outline-none focus:border-yellow-400 bg-white appearance-none"
                  >
                    {ROLES.map(r => (
                      <option key={r} value={r}>{ROL_LABELS[r]?.label ?? r}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-200">
              <p className="text-[11px] text-yellow-800 font-medium">
                ⚠️ Recuerda configurar el rol también en <strong>Clerk Dashboard</strong> para que apliquen los permisos de acceso.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setModal(false)} className="flex-1 h-10 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !fNombre || !fEmail}
                className="flex-1 h-10 bg-[#0f2d55] hover:bg-[#1a3d6e] text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panel de documentos */}
      {usuarioDocumentos && (
        <PanelDocumentos
          usuario={usuarioDocumentos}
          onClose={() => setUsuarioDocumentos(null)}
        />
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} registrado{usuarios.length !== 1 ? 's' : ''}</p>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-[#0f2d55] hover:bg-[#1a3d6e] text-white rounded-xl text-sm font-bold transition-colors"
        >
          <Plus size={14} /> Agregar usuario
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-[#0f2d55]" /></div>
      ) : (
        <div className="space-y-3">
          {ROLES.filter(r => byRol[r]?.length > 0).map(rol => (
            <div key={rol} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROL_LABELS[rol]?.color}`}>
                  {ROL_LABELS[rol]?.label}
                </span>
                <span className="text-[10px] text-gray-400">{byRol[rol].length} usuario{byRol[rol].length !== 1 ? 's' : ''}</span>
              </div>
              {byRol[rol].map((u, i) => (
                <div key={u.id} className={`${i !== 0 ? 'border-t border-gray-100' : ''} flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors`}>
                  <div className="w-9 h-9 rounded-full bg-[#0f2d55]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-black text-[#0f2d55]">{u.nombre.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{u.nombre}</p>
                    <p className="text-[11px] text-gray-400 truncate flex items-center gap-1">
                      <Mail size={10} className="flex-shrink-0" /> {u.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setUsuarioDocumentos(u)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors text-[11px] font-semibold"
                      title="Documentos"
                    >
                      <FolderOpen size={13} /> Docs
                    </button>
                    <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                      <Pencil size={13} className="text-blue-400" />
                    </button>
                    <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 size={13} className="text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab: General ──────────────────────────────────────────────────────────────
function TabGeneral() {
  const [tc, setTc]           = useState('');
  const [tcGuardado, setTcGuardado] = useState<string | null>(null);
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('tc_usd_mxn_override');
    if (stored) { setTc(stored); setTcGuardado(stored); }
  }, []);

  const handleSaveTC = () => {
    const val = parseFloat(tc);
    if (!val || val <= 0) return;
    localStorage.setItem('tc_usd_mxn_override', String(val));
    localStorage.setItem('tc_usd_mxn_override_ts', Date.now().toString());
    setTcGuardado(String(val));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResetTC = () => {
    localStorage.removeItem('tc_usd_mxn_override');
    localStorage.removeItem('tc_usd_mxn_override_ts');
    setTc(''); setTcGuardado(null);
  };

  return (
    <div className="space-y-5 max-w-xl">
      {/* Empresa */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={16} className="text-[#0f2d55]" />
          <h3 className="text-sm font-black text-[#0f2d55]">Datos de la empresa</h3>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Razón social', value: 'TGRPENTAR MÉXICO S.A. DE C.V.' },
            { label: 'Nombre comercial', value: 'Retarder México' },
            { label: 'Correo ventas', value: 'ventasyservicio@tgrpentarmexico.com' },
            { label: 'Correo administración', value: 'administracion@tgrpentarmexico.com' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-start justify-between gap-4">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide w-32 flex-shrink-0 pt-0.5">{label}</span>
              <span className="text-sm text-gray-700 text-right">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tipo de cambio */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-1">
          <RefreshCw size={16} className="text-[#0f2d55]" />
          <h3 className="text-sm font-black text-[#0f2d55]">Tipo de cambio USD/MXN</h3>
        </div>
        <p className="text-[11px] text-gray-400 mb-4">
          Sobreescribe el TC automático que usan los cotizadores. Se guarda localmente en este navegador.
        </p>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-mono">$</span>
            <input
              type="number"
              value={tc}
              onChange={e => setTc(e.target.value)}
              placeholder="Ej. 17.50"
              className="w-full border border-gray-200 rounded-xl pl-7 pr-14 h-10 text-sm outline-none focus:border-yellow-400"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">MXN</span>
          </div>
          <button
            onClick={handleSaveTC}
            disabled={!tc || parseFloat(tc) <= 0}
            className={`h-10 px-4 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2 ${
              saved ? 'bg-green-500 text-white' : 'bg-[#0f2d55] hover:bg-[#1a3d6e] text-white'
            }`}
          >
            {saved ? <Check size={14} /> : null}
            {saved ? 'Guardado' : 'Aplicar'}
          </button>
          {tcGuardado && (
            <button
              onClick={handleResetTC}
              className="h-10 px-3 rounded-xl text-sm text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
              title="Restaurar TC automático"
            >
              <X size={14} />
            </button>
          )}
        </div>
        {tcGuardado && (
          <p className="text-[11px] text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2 mt-3">
            TC manual activo: <strong>${parseFloat(tcGuardado).toFixed(2)} MXN</strong> por USD
          </p>
        )}
      </div>

      {/* Roles info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} className="text-[#0f2d55]" />
          <h3 className="text-sm font-black text-[#0f2d55]">Permisos por rol</h3>
        </div>
        <div className="space-y-3">
          {[
            { rol: 'admin',          desc: 'Acceso completo a todos los módulos, sin restricciones.' },
            { rol: 'administrativo', desc: 'Visualización completa. No puede mover estados ni editar.' },
            { rol: 'tecnico',        desc: 'Solo ve y opera el pipeline de Órdenes de Servicio.' },
            { rol: 'ventas',         desc: 'Cotizadores, pipeline de oportunidades y OS.' },
          ].map(({ rol, desc }) => (
            <div key={rol} className="flex items-start gap-3">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 flex-shrink-0 ${ROL_LABELS[rol]?.color}`}>
                {ROL_LABELS[rol]?.label}
              </span>
              <p className="text-[12px] text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
type Tab = 'catalogos' | 'usuarios' | 'general';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'catalogos', label: 'Catálogos',  icon: BookOpen },
  { id: 'usuarios',  label: 'Usuarios',   icon: Users    },
  { id: 'general',   label: 'General',    icon: Settings },
];

export default function ConfiguracionPage() {
  const [tab, setTab] = useState<Tab>('catalogos');

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#0f2d55] flex items-center justify-center">
          <Settings size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-black text-[#0f2d55]">Configuración</h1>
          <p className="text-[11px] text-gray-400">Catálogos, usuarios y ajustes del sistema</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-2xl border border-gray-200 p-1 gap-1 w-fit">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === t.id
                  ? 'bg-[#0f2d55] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {tab === 'catalogos' && <TabCatalogos />}
      {tab === 'usuarios'  && <TabUsuarios />}
      {tab === 'general'   && <TabGeneral />}
    </div>
  );
}
