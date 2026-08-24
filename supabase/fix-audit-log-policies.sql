-- F6-M: Corregir políticas RLS de audit_log
-- 
-- ⚠️ EJECUTAR EN: STAGING (bjuqqtkiqnfyejitmowc)
-- 📍 DÓNDE: https://supabase.com/dashboard/project/bjuqqtkiqnfyejitmowc/sql
-- 🎯 PROPÓSITO: Permitir que usuarios vean logs de sus pacientes (via membresía)
-- ⏱️ TIEMPO ESTIMADO: 5 segundos
-- ⚠️ IMPORTANTE: Solo ejecutar si el script de verificación muestra problemas

-- 1. Eliminar políticas antiguas (si existen)
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_log;
DROP POLICY IF EXISTS "Users can insert own audit logs" ON public.audit_log;

-- 2. Nueva política SELECT: usuarios pueden ver logs de sus pacientes
-- Un usuario puede ver logs si:
-- a) El log es de su propia acción (user_id = auth.uid())
-- b) El log es de un paciente de su clínica (via miembros_clinica + pacientes)
CREATE POLICY "Users can view audit logs of their clinic"
  ON public.audit_log
  FOR SELECT
  USING (
    -- Caso 1: el usuario realizó la acción
    user_id = auth.uid()
    OR
    -- Caso 2: el log es de un paciente de la clínica del usuario
    (
      table_name = 'pacientes' AND
      EXISTS (
        SELECT 1 
        FROM public.pacientes p
        JOIN public.miembros_clinica mc ON p.clinica_id = mc.clinica_id
        WHERE p.id::text = record_id 
          AND mc.user_id = auth.uid() 
          AND mc.activo = true
      )
    )
    OR
    -- Caso 3: el log es de una tabla relacionada con pacientes de su clínica
    (
      table_name IN ('citas', 'evoluciones_clinicas', 'recetas', 'presupuestos') AND
      EXISTS (
        SELECT 1 
        FROM public.miembros_clinica mc
        WHERE mc.user_id = auth.uid() 
          AND mc.activo = true
      )
    )
  );

-- 3. Nueva política INSERT: usuarios pueden registrar sus propias acciones
CREATE POLICY "Users can insert their own audit logs"
  ON public.audit_log
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 4. Verificar que las políticas se crearon
SELECT 
  'Políticas actualizadas' AS check_name,
  COUNT(*)::text || ' políticas' AS status
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'audit_log';

-- 5. Mostrar las políticas nuevas
SELECT 
  policyname,
  cmd,
  qual AS using_condition,
  with_check AS insert_condition
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'audit_log';
