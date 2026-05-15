'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useUser } from '@clerk/nextjs';

interface Message {
  id: string;
  mensaje: string;
  created_at: string;
  usuario_id: string;
  usuarios: {
    nombre: string;
    avatar_url: string | null;
  } | null;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [dbUser, setDbUser] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useUser();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sonido de notificación
  const playNotification = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
      audio.volume = 0.5;
      audio.play();
    } catch (e) {
      console.warn('No se pudo reproducir el sonido:', e);
    }
  };

  // Cargar usuario de DB y mensajes iniciales
  useEffect(() => {
    if (!user) return;

    const initChat = async () => {
      // 1. Obtener ID de usuario de nuestra DB
      const { data: userData } = await supabase
        .from('usuarios')
        .select('*')
        .eq('clerk_user_id', user.id)
        .single();
      
      setDbUser(userData);

      // 2. Cargar últimos 50 mensajes
      const { data: msgData } = await supabase
        .from('chat_messages')
        .select('*, usuarios(nombre, avatar_url)')
        .order('created_at', { ascending: true })
        .limit(50);
      
      if (msgData) setMessages(msgData as any);
    };

    initChat();

    // 3. Suscribirse a nuevos mensajes (Realtime)
    const channel = supabase
      .channel('public:chat_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, async (payload) => {
        // Recargar el mensaje con los datos del usuario
        const { data: fullMsg } = await supabase
          .from('chat_messages')
          .select('*, usuarios(nombre, avatar_url)')
          .eq('id', payload.new.id)
          .single();
        
        if (fullMsg) {
          setMessages(prev => [...prev, fullMsg as any]);
          
          // Solo notificar si no es mi mensaje y el chat está cerrado
          if (fullMsg.usuario_id !== dbUser?.id) {
            playNotification();
            setUnreadCount(prev => prev + 1);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Scroll al fondo cuando hay nuevos mensajes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    // Si abrimos el chat, limpiamos las notificaciones
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !dbUser || loading) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          usuario_id: dbUser.id,
          mensaje: newMessage.trim(),
        });

      if (error) throw error;
      setNewMessage('');
    } catch (err) {
      console.error('Error enviando mensaje:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end">
      {/* Ventana de Chat */}
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-[#0f2d55] p-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-[#0f2d55]">
                <MessageCircle size={18} />
              </div>
              <div>
                <p className="text-sm font-bold">Chat del Equipo</p>
                <p className="text-[10px] text-blue-200">En línea ahora</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={async () => {
                  const demoMsg = "Hola, soy Juan Pérez. Mi correo es juan@example.com y mi cel es 5512345678. Me interesa un servicio.";
                  const { error } = await supabase.from('chat_messages').insert({
                    usuario_id: messages.find(m => m.usuario_id !== dbUser?.id)?.usuario_id || dbUser?.id, // Simular otro usuario
                    mensaje: demoMsg,
                  });
                  if (error) console.error(error);
                }}
                className="text-[10px] bg-white/20 hover:bg-white/30 px-2 py-1 rounded-md transition-colors"
              >
                Simular Lead
              </button>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Mensajes */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 custom-scrollbar"
          >
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <MessageCircle size={40} className="mb-2 opacity-20" />
                <p className="text-xs">No hay mensajes aún. ¡Sé el primero!</p>
              </div>
            )}
            {messages.map((msg) => {
              const isMe = msg.usuario_id === dbUser?.id;
              // Detectar si parece un lead (contiene teléfono o email)
              const isLead = !isMe && (msg.mensaje.includes('@') || /\d{10}/.test(msg.mensaje));
              
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none'
                  }`}>
                    {!isMe && (
                      <p className="text-[10px] font-bold text-blue-600 mb-1">
                        {msg.usuarios?.nombre || 'Colega'}
                      </p>
                    )}
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.mensaje}</p>
                    
                    {isLead && !isMe && (
                      <button
                        onClick={async () => {
                          const nombre = msg.mensaje.split(' ')[0] || 'Nuevo Lead';
                          const { error } = await supabase.from('empresas').insert({
                            nombre_comercial: `Lead: ${nombre}`,
                            notas: `Registrado desde Chat: ${msg.mensaje}`,
                            activo: true
                          });
                          if (!error) alert('Lead dado de alta exitosamente en Empresas');
                        }}
                        className="mt-2 w-full bg-emerald-50 text-[10px] font-bold text-emerald-700 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1"
                      >
                        <User size={10} />
                        DAR DE ALTA COMO LEAD
                      </button>
                    )}

                    <p className={`text-[9px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || loading}
              className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md active:scale-95"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
        </div>
      )}

      {/* Botón Flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${
          isOpen ? 'bg-white text-[#0f2d55] rotate-90' : 'bg-[#0f2d55] text-white'
        }`}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={28} />}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[10px] font-bold text-white animate-bounce shadow-lg">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
