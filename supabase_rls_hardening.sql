-- ====================================================================
-- ENDURECIMIENTO DINÁMICO DE RLS EN SUPABASE (A PRUEBA DE COLUMNAS)
-- ====================================================================

DO $$ 
DECLARE
  tbl text;
  col_name text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['personal_readings', 'wall_posts', 'chat_messages', 'proposals'])
  LOOP
    EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    
    EXECUTE format('DROP POLICY IF EXISTS "Public select %I" ON public.%I;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Auth insert %I" ON public.%I;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Owner update %I" ON public.%I;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Owner delete %I" ON public.%I;', tbl, tbl);

    EXECUTE format('CREATE POLICY "Public select %I" ON public.%I FOR SELECT USING (true);', tbl, tbl);
    EXECUTE format('CREATE POLICY "Auth insert %I" ON public.%I FOR INSERT WITH CHECK (true);', tbl, tbl);

    SELECT column_name INTO col_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = tbl 
      AND column_name IN ('user_id', 'email', 'user_email', 'usuario')
    LIMIT 1;

    IF col_name = 'user_id' THEN
      EXECUTE format('CREATE POLICY "Owner update %I" ON public.%I FOR UPDATE USING (auth.uid() = user_id);', tbl, tbl);
      EXECUTE format('CREATE POLICY "Owner delete %I" ON public.%I FOR DELETE USING (auth.uid() = user_id);', tbl, tbl);
    ELSIF col_name = 'email' OR col_name = 'user_email' THEN
      EXECUTE format('CREATE POLICY "Owner update %I" ON public.%I FOR UPDATE USING ((auth.jwt() ->> ''email'') = %I);', tbl, tbl, col_name);
      EXECUTE format('CREATE POLICY "Owner delete %I" ON public.%I FOR DELETE USING ((auth.jwt() ->> ''email'') = %I);', tbl, tbl, col_name);
    ELSE
      EXECUTE format('CREATE POLICY "Owner update %I" ON public.%I FOR UPDATE USING (auth.role() = ''authenticated'');', tbl, tbl);
      EXECUTE format('CREATE POLICY "Owner delete %I" ON public.%I FOR DELETE USING (auth.role() = ''authenticated'');', tbl, tbl);
    END IF;
  END LOOP;
END $$;
