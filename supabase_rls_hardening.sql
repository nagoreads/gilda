-- ====================================================================
-- AUDITORÍA Y ENDURECIMIENTO DE POLÍTICAS RLS (SUPABASE / POSTGRES)
-- ====================================================================

-- 1. TABLA: personal_readings (Lecturas de la habitación)
ALTER TABLE IF EXISTS public.personal_readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select readings" ON public.personal_readings;
DROP POLICY IF EXISTS "Owner insert readings" ON public.personal_readings;
DROP POLICY IF EXISTS "Owner update readings" ON public.personal_readings;
DROP POLICY IF EXISTS "Owner delete readings" ON public.personal_readings;

-- Lectura pública o para usuarios autenticados
CREATE POLICY "Public select readings" ON public.personal_readings
  FOR SELECT USING (true);

-- Solo el dueño puede crear sus lecturas
CREATE POLICY "Owner insert readings" ON public.personal_readings
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR (auth.jwt() ->> 'email') = email
  );

-- Solo el dueño puede editar sus lecturas
CREATE POLICY "Owner update readings" ON public.personal_readings
  FOR UPDATE USING (
    auth.uid() = user_id OR (auth.jwt() ->> 'email') = email
  );

-- Solo el dueño puede eliminar sus lecturas
CREATE POLICY "Owner delete readings" ON public.personal_readings
  FOR DELETE USING (
    auth.uid() = user_id OR (auth.jwt() ->> 'email') = email
  );


-- 2. TABLA: wall_posts (Muro / Publicaciones / Buzón)
ALTER TABLE IF EXISTS public.wall_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select wall_posts" ON public.wall_posts;
DROP POLICY IF EXISTS "Auth insert wall_posts" ON public.wall_posts;
DROP POLICY IF EXISTS "Owner update wall_posts" ON public.wall_posts;
DROP POLICY IF EXISTS "Owner delete wall_posts" ON public.wall_posts;

CREATE POLICY "Public select wall_posts" ON public.wall_posts
  FOR SELECT USING (true);

CREATE POLICY "Auth insert wall_posts" ON public.wall_posts
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' OR auth.uid() IS NOT NULL
  );

CREATE POLICY "Owner update wall_posts" ON public.wall_posts
  FOR UPDATE USING (
    auth.uid() = user_id OR (auth.jwt() ->> 'email') = email
  );

CREATE POLICY "Owner delete wall_posts" ON public.wall_posts
  FOR DELETE USING (
    auth.uid() = user_id OR (auth.jwt() ->> 'email') = email
  );


-- 3. TABLA: chat_messages (Chat público y mensajes privados)
ALTER TABLE IF EXISTS public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Auth insert chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Owner update chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Owner delete chat_messages" ON public.chat_messages;

CREATE POLICY "Public select chat_messages" ON public.chat_messages
  FOR SELECT USING (true);

CREATE POLICY "Auth insert chat_messages" ON public.chat_messages
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' OR auth.uid() IS NOT NULL
  );

CREATE POLICY "Owner update chat_messages" ON public.chat_messages
  FOR UPDATE USING (
    auth.uid() = user_id OR (auth.jwt() ->> 'email') = email
  );

CREATE POLICY "Owner delete chat_messages" ON public.chat_messages
  FOR DELETE USING (
    auth.uid() = user_id OR (auth.jwt() ->> 'email') = email
  );


-- 4. TABLA: proposals (Propuestas de lectura)
ALTER TABLE IF EXISTS public.proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select proposals" ON public.proposals;
DROP POLICY IF EXISTS "Auth insert proposals" ON public.proposals;
DROP POLICY IF EXISTS "Owner update proposals" ON public.proposals;
DROP POLICY IF EXISTS "Owner delete proposals" ON public.proposals;

CREATE POLICY "Public select proposals" ON public.proposals
  FOR SELECT USING (true);

CREATE POLICY "Auth insert proposals" ON public.proposals
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' OR auth.uid() IS NOT NULL
  );

CREATE POLICY "Owner update proposals" ON public.proposals
  FOR UPDATE USING (
    auth.uid() = user_id OR (auth.jwt() ->> 'email') = email
  );

CREATE POLICY "Owner delete proposals" ON public.proposals
  FOR DELETE USING (
    auth.uid() = user_id OR (auth.jwt() ->> 'email') = email
  );
