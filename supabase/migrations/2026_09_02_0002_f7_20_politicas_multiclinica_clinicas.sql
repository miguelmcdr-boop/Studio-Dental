-- ============================================================
-- F7-20 Fase 2: Eliminar políticas legacy y crear multiclinica seguras
-- ============================================================
--
-- BUG DETECTADO POR PEN-TEST (F7-20):
-- Las políticas legacy "Users can manage own [tabla]" validaban solo
-- user_id = auth.uid() sin verificar que el paciente_id pertenece a la
-- clínica actual del usuario. Esto permitía INSERT cross-tenant:
--   - dentista_clinica2 pudo crear evoluciones en paciente de clinica_1
--   - dentista_clinica2 pudo crear recetas en paciente de clinica_1
--
-- SOLUCIÓN:
-- 1. DROP POLICY de las 9 políticas legacy
-- 2. CREATE POLICY nuevas que validan:
--    - paciente_id pertenece a la clínica actual (subquery a pacientes)
--    - user_id = auth.uid() para INSERT
--    - rol permitido según operación
--
-- TABLAS AFECTADAS:
-- evoluciones_clinicas, recetas, odontogramas, periodontogramas,
-- periodontogramas_historial, dsd_configs, odontopediatria,
-- quirurgico_implantes, quirurgico_endodoncia
-- ============================================================

-- ============================================================
-- 1. EVOLUCIONES_CLINICAS
-- ============================================================
DROP POLICY IF EXISTS "Users can manage own evoluciones" ON evoluciones_clinicas;

DROP POLICY IF EXISTS "evoluciones_clinicas_select_clinica" ON evoluciones_clinicas;
CREATE POLICY evoluciones_clinicas_select_clinica ON evoluciones_clinicas FOR SELECT
  USING (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND tiene_rol_en_clinica(ARRAY['admin','dentista','asistente']::app_role[])
  );

DROP POLICY IF EXISTS "evoluciones_clinicas_insert_clinica" ON evoluciones_clinicas;
CREATE POLICY evoluciones_clinicas_insert_clinica ON evoluciones_clinicas FOR INSERT
  WITH CHECK (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND user_id = auth.uid()
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  );

DROP POLICY IF EXISTS "evoluciones_clinicas_update_clinica" ON evoluciones_clinicas;
CREATE POLICY evoluciones_clinicas_update_clinica ON evoluciones_clinicas FOR UPDATE
  USING (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  )
  WITH CHECK (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  );

DROP POLICY IF EXISTS "evoluciones_clinicas_delete_clinica" ON evoluciones_clinicas;
CREATE POLICY evoluciones_clinicas_delete_clinica ON evoluciones_clinicas FOR DELETE
  USING (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  );

-- ============================================================
-- 2. RECETAS
-- ============================================================
DROP POLICY IF EXISTS "Users can manage own recetas" ON recetas;

DROP POLICY IF EXISTS "recetas_select_clinica" ON recetas;
CREATE POLICY recetas_select_clinica ON recetas FOR SELECT
  USING (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND tiene_rol_en_clinica(ARRAY['admin','dentista','asistente','recepcion']::app_role[])
  );

DROP POLICY IF EXISTS "recetas_insert_clinica" ON recetas;
CREATE POLICY recetas_insert_clinica ON recetas FOR INSERT
  WITH CHECK (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND user_id = auth.uid()
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  );

DROP POLICY IF EXISTS "recetas_update_clinica" ON recetas;
CREATE POLICY recetas_update_clinica ON recetas FOR UPDATE
  USING (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  )
  WITH CHECK (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  );

DROP POLICY IF EXISTS "recetas_delete_clinica" ON recetas;
CREATE POLICY recetas_delete_clinica ON recetas FOR DELETE
  USING (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  );

-- ============================================================
-- 3. ODONTOGRAMAS
-- ============================================================
DROP POLICY IF EXISTS "Users can manage own odontogramas" ON odontogramas;

DROP POLICY IF EXISTS "odontogramas_select_clinica" ON odontogramas;
CREATE POLICY odontogramas_select_clinica ON odontogramas FOR SELECT
  USING (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND tiene_rol_en_clinica(ARRAY['admin','dentista','asistente','recepcion']::app_role[])
  );

DROP POLICY IF EXISTS "odontogramas_insert_clinica" ON odontogramas;
CREATE POLICY odontogramas_insert_clinica ON odontogramas FOR INSERT
  WITH CHECK (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND user_id = auth.uid()
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  );

DROP POLICY IF EXISTS "odontogramas_update_clinica" ON odontogramas;
CREATE POLICY odontogramas_update_clinica ON odontogramas FOR UPDATE
  USING (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  )
  WITH CHECK (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  );

DROP POLICY IF EXISTS "odontogramas_delete_clinica" ON odontogramas;
CREATE POLICY odontogramas_delete_clinica ON odontogramas FOR DELETE
  USING (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  );

-- ============================================================
-- 4. PERIODONTOGRAMAS
-- ============================================================
DROP POLICY IF EXISTS "Users can manage own periodontogramas" ON periodontogramas;

DROP POLICY IF EXISTS "periodontogramas_select_clinica" ON periodontogramas;
CREATE POLICY periodontogramas_select_clinica ON periodontogramas FOR SELECT
  USING (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND tiene_rol_en_clinica(ARRAY['admin','dentista','asistente','recepcion']::app_role[])
  );

DROP POLICY IF EXISTS "periodontogramas_insert_clinica" ON periodontogramas;
CREATE POLICY periodontogramas_insert_clinica ON periodontogramas FOR INSERT
  WITH CHECK (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND user_id = auth.uid()
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  );

DROP POLICY IF EXISTS "periodontogramas_update_clinica" ON periodontogramas;
CREATE POLICY periodontogramas_update_clinica ON periodontogramas FOR UPDATE
  USING (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  )
  WITH CHECK (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  );

DROP POLICY IF EXISTS "periodontogramas_delete_clinica" ON periodontogramas;
CREATE POLICY periodontogramas_delete_clinica ON periodontogramas FOR DELETE
  USING (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  );

-- ============================================================
-- 5. PERIODONTOGRAMAS_HISTORIAL
-- ============================================================
DROP POLICY IF EXISTS "Users can manage own periodontogramas_historial" ON periodontogramas_historial;

DROP POLICY IF EXISTS "periodontogramas_historial_select_clinica" ON periodontogramas_historial;
CREATE POLICY periodontogramas_historial_select_clinica ON periodontogramas_historial FOR SELECT
  USING (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND tiene_rol_en_clinica(ARRAY['admin','dentista','asistente','recepcion']::app_role[])
  );

DROP POLICY IF EXISTS "periodontogramas_historial_insert_clinica" ON periodontogramas_historial;
CREATE POLICY periodontogramas_historial_insert_clinica ON periodontogramas_historial FOR INSERT
  WITH CHECK (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND user_id = auth.uid()
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  );

DROP POLICY IF EXISTS "periodontogramas_historial_update_clinica" ON periodontogramas_historial;
CREATE POLICY periodontogramas_historial_update_clinica ON periodontogramas_historial FOR UPDATE
  USING (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  )
  WITH CHECK (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  );

DROP POLICY IF EXISTS "periodontogramas_historial_delete_clinica" ON periodontogramas_historial;
CREATE POLICY periodontogramas_historial_delete_clinica ON periodontogramas_historial FOR DELETE
  USING (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  );

-- ============================================================
-- 6. DSD_CONFIGS
-- ============================================================
DROP POLICY IF EXISTS "Users can manage own dsd_configs" ON dsd_configs;

DROP POLICY IF EXISTS "dsd_configs_select_clinica" ON dsd_configs;
CREATE POLICY dsd_configs_select_clinica ON dsd_configs FOR SELECT
  USING (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND tiene_rol_en_clinica(ARRAY['admin','dentista','asistente','recepcion']::app_role[])
  );

DROP POLICY IF EXISTS "dsd_configs_insert_clinica" ON dsd_configs;
CREATE POLICY dsd_configs_insert_clinica ON dsd_configs FOR INSERT
  WITH CHECK (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND user_id = auth.uid()
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  );

DROP POLICY IF EXISTS "dsd_configs_update_clinica" ON dsd_configs;
CREATE POLICY dsd_configs_update_clinica ON dsd_configs FOR UPDATE
  USING (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  )
  WITH CHECK (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  );

DROP POLICY IF EXISTS "dsd_configs_delete_clinica" ON dsd_configs;
CREATE POLICY dsd_configs_delete_clinica ON dsd_configs FOR DELETE
  USING (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  );

-- ============================================================
-- 7. ODONTOPEDIATRIA
-- ============================================================
DROP POLICY IF EXISTS "Users can manage own odontopediatria" ON odontopediatria;

DROP POLICY IF EXISTS "odontopediatria_select_clinica" ON odontopediatria;
CREATE POLICY odontopediatria_select_clinica ON odontopediatria FOR SELECT
  USING (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND tiene_rol_en_clinica(ARRAY['admin','dentista','asistente','recepcion']::app_role[])
  );

DROP POLICY IF EXISTS "odontopediatria_insert_clinica" ON odontopediatria;
CREATE POLICY odontopediatria_insert_clinica ON odontopediatria FOR INSERT
  WITH CHECK (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND user_id = auth.uid()
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  );

DROP POLICY IF EXISTS "odontopediatria_update_clinica" ON odontopediatria;
CREATE POLICY odontopediatria_update_clinica ON odontopediatria FOR UPDATE
  USING (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  )
  WITH CHECK (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  );

DROP POLICY IF EXISTS "odontopediatria_delete_clinica" ON odontopediatria;
CREATE POLICY odontopediatria_delete_clinica ON odontopediatria FOR DELETE
  USING (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  );

-- ============================================================
-- 8. QUIRURGICO_IMPLANTES
-- ============================================================
DROP POLICY IF EXISTS "Users can manage own quirurgico_implantes" ON quirurgico_implantes;

DROP POLICY IF EXISTS "quirurgico_implantes_select_clinica" ON quirurgico_implantes;
CREATE POLICY quirurgico_implantes_select_clinica ON quirurgico_implantes FOR SELECT
  USING (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND tiene_rol_en_clinica(ARRAY['admin','dentista','asistente','recepcion']::app_role[])
  );

DROP POLICY IF EXISTS "quirurgico_implantes_insert_clinica" ON quirurgico_implantes;
CREATE POLICY quirurgico_implantes_insert_clinica ON quirurgico_implantes FOR INSERT
  WITH CHECK (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND user_id = auth.uid()
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  );

DROP POLICY IF EXISTS "quirurgico_implantes_update_clinica" ON quirurgico_implantes;
CREATE POLICY quirurgico_implantes_update_clinica ON quirurgico_implantes FOR UPDATE
  USING (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  )
  WITH CHECK (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  );

DROP POLICY IF EXISTS "quirurgico_implantes_delete_clinica" ON quirurgico_implantes;
CREATE POLICY quirurgico_implantes_delete_clinica ON quirurgico_implantes FOR DELETE
  USING (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  );

-- ============================================================
-- 9. QUIRURGICO_ENDODONCIA
-- ============================================================
DROP POLICY IF EXISTS "Users can manage own quirurgico_endodoncia" ON quirurgico_endodoncia;

DROP POLICY IF EXISTS "quirurgico_endodoncia_select_clinica" ON quirurgico_endodoncia;
CREATE POLICY quirurgico_endodoncia_select_clinica ON quirurgico_endodoncia FOR SELECT
  USING (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND tiene_rol_en_clinica(ARRAY['admin','dentista','asistente','recepcion']::app_role[])
  );

DROP POLICY IF EXISTS "quirurgico_endodoncia_insert_clinica" ON quirurgico_endodoncia;
CREATE POLICY quirurgico_endodoncia_insert_clinica ON quirurgico_endodoncia FOR INSERT
  WITH CHECK (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND user_id = auth.uid()
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  );

DROP POLICY IF EXISTS "quirurgico_endodoncia_update_clinica" ON quirurgico_endodoncia;
CREATE POLICY quirurgico_endodoncia_update_clinica ON quirurgico_endodoncia FOR UPDATE
  USING (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  )
  WITH CHECK (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  );

DROP POLICY IF EXISTS "quirurgico_endodoncia_delete_clinica" ON quirurgico_endodoncia;
CREATE POLICY quirurgico_endodoncia_delete_clinica ON quirurgico_endodoncia FOR DELETE
  USING (
    paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = clinica_actual())
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  );

-- ============================================================
-- COMENTARIO FINAL
-- ============================================================
COMMENT ON TABLE evoluciones_clinicas IS 'F7-20 Fase 2: Políticas multiclinica aplicadas. Previene INSERT cross-tenant.';
COMMENT ON TABLE recetas IS 'F7-20 Fase 2: Políticas multiclinica aplicadas. Previene INSERT cross-tenant.';
COMMENT ON TABLE odontogramas IS 'F7-20 Fase 2: Políticas multiclinica aplicadas. Previene INSERT cross-tenant.';
COMMENT ON TABLE periodontogramas IS 'F7-20 Fase 2: Políticas multiclinica aplicadas. Previene INSERT cross-tenant.';
COMMENT ON TABLE periodontogramas_historial IS 'F7-20 Fase 2: Políticas multiclinica aplicadas. Previene INSERT cross-tenant.';
COMMENT ON TABLE dsd_configs IS 'F7-20 Fase 2: Políticas multiclinica aplicadas. Previene INSERT cross-tenant.';
COMMENT ON TABLE odontopediatria IS 'F7-20 Fase 2: Políticas multiclinica aplicadas. Previene INSERT cross-tenant.';
COMMENT ON TABLE quirurgico_implantes IS 'F7-20 Fase 2: Políticas multiclinica aplicadas. Previene INSERT cross-tenant.';
COMMENT ON TABLE quirurgico_endodoncia IS 'F7-20 Fase 2: Políticas multiclinica aplicadas. Previene INSERT cross-tenant.';
