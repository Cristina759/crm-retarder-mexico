-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    mensaje TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Todos los usuarios pueden ver mensajes" 
ON public.chat_messages FOR SELECT 
USING (true);

CREATE POLICY "Los usuarios pueden insertar sus propios mensajes" 
ON public.chat_messages FOR INSERT 
WITH CHECK (auth.uid()::text = (SELECT clerk_user_id FROM public.usuarios WHERE id = usuario_id));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
    