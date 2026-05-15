'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Users, Plus, Pencil, Trash2, X, Check, Loader2, AlertCircle, 
  ChevronDown, Mail, FolderOpen, Eye, Download, Upload, FileText
} from 'lucide-react';
import {
  obtenerUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario,
} from '@/app/actions/usuarios';
import {
  obtenerDocumentosUsuario, subirDocumentoUsuario, eliminarDocumentoUsuario, getDocumentoUrl,
  type DocumentoRow,
} from '@/app/actions/documentos';
import type { UsuarioRow } from '@/app/actions/types';

const ROL_LABELS: Record<string, { label: string; color: string }> = {
  admin:          { label: 'Admin',          color: 'bg-[#0f2d55] text-white' },
  administrativo: { label: 'Administrativo', color: 'bg-purple-100 text-purple-800' },
  tecnico:        { label: 'Técnico',        color: 'bg-yellow-100 text-yellow-800' },
  ventas:         { label: 'Ventas',         color: 'bg-green-100 text-green-800' },
};
const ROLES = ['admin', 'administrativo', 'tecnico', 'ventas'] as const;

function PanelDocumentos({ usuario, onClose }: { usuario: UsuarioRow; onClose: () => void }) {
  const [docs, setDocs]       = useState<DocumentoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; tipo: string; nombre: string } | null>(null);
  const fileRef               = useRef<HTMLInputElement>(null);

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
    if (err) setError(err);
    else await load();
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

  const handlePreview = async (doc: DocumentoRow) => {
    const { url, error: err } = await getDocumentoUrl(doc.storage_path);
    if (err || !url) { alert('No se pudo generar el enlace.'); return; }
    const tipo = doc.tipo?.toUpperCase() || '';
    const isPreviewable = ['PDF', 'JPG', 'JPEG', 'PNG', 'WEBP'].includes(tipo);
    if (isPreviewable) setPreview({ url, tipo, nombre: doc.nombre });
    else window.open(url, '_blank');
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden" style={{ maxHeight: '85vh' }}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
          <div className="w-9 h-9 rounded-full bg-[#0f2d55] flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-black text-white">{usuario.nombre.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-[#0f2d55] truncate">{usuario.nombre}</p>
            <p className="text-[11px] text-gray-400 uppercase font-bold tracking-wider">Expediente Digital</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-200 text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5 border-b border-gray-100">
          <input ref={fileRef} type="file" onChange={handleUpload} className="hidden" id="file-upload-user" />
          <label htmlFor="file-upload-user" className={`flex flex-col items-center justify-center gap-2 w-full py-6 rounded-2xl border-2 border-dashed transition-all ${
            uploading ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed' : 'border-[#0f2d55]/20 text-[#0f2d55] hover:border-[#0f2d55] hover:bg-blue-50 cursor-pointer'
          }`}>
            {uploading ? <Loader2 size={24} className="animate-spin" /> : <Upload size={24} className="opacity-40" />}
            <span className="text-sm font-bold">{uploading ? 'Subiendo documento...' : 'Subir Documento (PDF, Imagen, Word)'}</span>
            <span className="text-[10px] opacity-60 uppercase font-bold">Límite 20MB por archivo</span>
          </label>
          {error && <p className="text-[11px] text-red-600 mt-2 flex items-center gap-1 font-bold"><AlertCircle size={12} /> {error}</p>}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-[#0f2d55]" /></div>
          ) : docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-300 gap-3">
              <FolderOpen size={48} strokeWidth={1} />
              <p className="text-sm font-medium">No hay documentos cargados en el expediente</p>
            </div>
          ) : docs.map(doc => (
            <div key={doc.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-gray-100 hover:border-[#0f2d55]/30 hover:bg-blue-50/30 transition-all group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-gray-100 shadow-sm ${iconColor[doc.tipo ?? ''] ?? 'text-gray-400'}`}>
                <FileText size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{doc.nombre}</p>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">
                  {doc.tipo} · {fmtSize(doc.tamanio)} · {new Date(doc.created_at).toLocaleDateString('es-MX')}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => handlePreview(doc)} className="p-2 rounded-xl hover:bg-blue-100 text-blue-600 transition-colors" title="Ver">
                  <Eye size={16} />
                </button>
                <button onClick={() => handleDownload(doc)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors" title="Descargar">
                  <Download size={16} />
                </button>
                <button onClick={() => handleDelete(doc.id)} className="p-2 rounded-xl hover:bg-red-100 text-red-600 transition-colors" title="Borrar">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {preview && (
          <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col p-4 md:p-8 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-4 text-white">
              <div className="min-w-0">
                <p className="text-sm font-black truncate">{preview.nombre}</p>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{preview.tipo}</p>
              </div>
              <button onClick={() => setPreview(null)} className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-all">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 bg-white rounded-3xl overflow-hidden shadow-2xl relative border-4 border-white/10">
              {preview.tipo === 'PDF' ? (
                <iframe src={preview.url} className="w-full h-full border-none" title="PDF Preview" />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img src={preview.url} alt={preview.nombre} className="max-w-full max-h-full object-contain" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UsuariosPage() {
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
    if (!confirm('¿Eliminar este usuario?')) return;
    await eliminarUsuario(id);
    setUsuarios(prev => prev.filter(u => u.id !== id));
  };

  const byRol = ROLES.reduce((acc, r) => {
    acc[r] = usuarios.filter(u => u.rol === r);
    return acc;
  }, {} as Record<string, UsuarioRow[]>);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0f2d55] flex items-center justify-center shadow-lg">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#0f2d55]">Gestión de Personal</h1>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Usuarios y Expedientes Digitales</p>
          </div>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-5 py-2.5 bg-[#0f2d55] hover:bg-[#1a3d6e] text-white rounded-2xl text-sm font-bold shadow-md transition-all active:scale-95">
          <Plus size={16} /> Registrar Empleado
        </button>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-[#0f2d55]">{editRow ? 'Editar Perfil' : 'Nuevo Registro'}</h3>
              <button onClick={() => setModal(false)} className="p-2 rounded-2xl hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1 mb-1 block">Nombre Completo</label>
                <input value={fNombre} onChange={e => setFNombre(e.target.value)} placeholder="Ej. Pedro Picapiedra" className="w-full border border-gray-200 rounded-2xl px-4 h-11 text-sm font-semibold outline-none focus:border-[#0f2d55] transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1 mb-1 block">Email Corporativo</label>
                <input type="email" value={fEmail} onChange={e => setFEmail(e.target.value)} placeholder="correo@retarder.mx" className="w-full border border-gray-200 rounded-2xl px-4 h-11 text-sm font-semibold outline-none focus:border-[#0f2d55] transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1 mb-1 block">Rol de Acceso</label>
                <div className="relative">
                  <select value={fRol} onChange={e => setFRol(e.target.value)} className="w-full border border-gray-200 rounded-2xl px-4 h-11 text-sm font-semibold outline-none focus:border-[#0f2d55] bg-white appearance-none transition-all">
                    {ROLES.map(r => <option key={r} value={r}>{ROL_LABELS[r]?.label}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setModal(false)} className="flex-1 h-11 border border-gray-200 rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSave} disabled={saving || !fNombre || !fEmail} className="flex-1 h-11 bg-[#0f2d55] hover:bg-[#1a3d6e] text-white rounded-2xl text-sm font-black shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {usuarioDocumentos && (
        <PanelDocumentos usuario={usuarioDocumentos} onClose={() => setUsuarioDocumentos(null)} />
      )}

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 size={32} className="animate-spin text-[#0f2d55] opacity-20" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {usuarios.map(u => (
            <div key={u.id} className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1.5 h-full ${ROL_LABELS[u.rol]?.color.split(' ')[0]}`} />
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#0f2d55]/5 flex items-center justify-center text-[#0f2d55] font-black text-xl">
                  {u.nombre.charAt(0).toUpperCase()}
                </div>
                <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${ROL_LABELS[u.rol]?.color}`}>
                  {ROL_LABELS[u.rol]?.label}
                </span>
              </div>
              <div className="space-y-1 mb-6">
                <p className="text-base font-black text-gray-800 truncate">{u.nombre}</p>
                <p className="text-xs text-gray-400 font-medium truncate flex items-center gap-1.5">
                  <Mail size={12} className="opacity-40" /> {u.email}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setUsuarioDocumentos(u)} className="flex items-center justify-center gap-2 h-10 rounded-2xl bg-[#0f2d55] text-white text-xs font-black hover:bg-[#1a3d6e] transition-all shadow-sm">
                  <FolderOpen size={14} /> Expediente
                </button>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(u)} className="flex-1 flex items-center justify-center rounded-2xl bg-gray-50 border border-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-all" title="Editar">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(u.id)} className="flex-1 flex items-center justify-center rounded-2xl bg-gray-50 border border-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all" title="Eliminar">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
