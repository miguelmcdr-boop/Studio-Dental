#!/bin/bash
# ============================================================================
# F7-34: Despliegue de Edge Functions corregidas a PRODUCCION
# Proyecto: nagduvivilmzupdpoayo (studio-dental)
#
# Requiere autorizacion explicita: cambia comportamiento real
# Toggle Verify JWT: DESACTIVADO (necesario para cron F7-32 con X-Internal-Secret)
# ============================================================================
set -e

PROJECT_REF="nagduvivilmzupdpoayo"

echo "Desplegando 7 Edge Functions a PRODUCCION..."
for fn in r2-upload-url r2-delete r2-download-url r2-list-deleted r2-restore archivos-purge r2-health-check; do
  echo "--- $fn ---"
  supabase functions deploy "$fn" --project-ref "$PROJECT_REF" --no-verify-jwt
done

echo ""
echo "=== Verificacion ==="
supabase functions list --project-ref "$PROJECT_REF"
