#!/bin/bash
# ============================================================================
# F7-34: Tests de validacion multi-clinica en PRODUCCION
# Solo toca datos del paciente fantasma 99999999-9999-9999-9999-999999999999
#
# Uso (credenciales NUNCA se imprimen ni se guardan en el repo):
#   export SD_ANON_KEY="<anon key produccion>"
#   export SD_EMAIL_A="<email admin Clinica E2E Secundaria>"
#   export SD_PASS_A="<password>"
#   export SD_EMAIL_B="<email admin Clinica Studio Dental>"
#   export SD_PASS_B="<password>"
#   bash scripts/validacion/tests-f734-produccion.sh
# ============================================================================
set -u

BASE="https://nagduvivilmzupdpoayo.supabase.co"
FANTASMA="99999999-9999-9999-9999-999999999999"
BODY=/tmp/f734_body.json

: "${SD_ANON_KEY:?Falta SD_ANON_KEY}"
: "${SD_EMAIL_A:?Falta SD_EMAIL_A}"
: "${SD_PASS_A:?Falta SD_PASS_A}"
: "${SD_EMAIL_B:?Falta SD_EMAIL_B}"
: "${SD_PASS_B:?Falta SD_PASS_B}"

login() {
  curl -s -X POST "$BASE/auth/v1/token?grant_type=password" \
    -H "apikey: $SD_ANON_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$1\",\"password\":\"$2\"}" \
    | python3 -c 'import sys,json;print(json.load(sys.stdin).get("access_token",""))'
}

TOKEN_A=$(login "$SD_EMAIL_A" "$SD_PASS_A")
TOKEN_B=$(login "$SD_EMAIL_B" "$SD_PASS_B")

if [ -z "$TOKEN_A" ] || [ -z "$TOKEN_B" ]; then
  echo "ERROR: login fallo. Verifica credenciales."
  exit 1
fi
echo "Logins OK (tokens en memoria, no se imprimen)"
echo ""

post() {
  curl -s -o $BODY -w "%{http_code}" -X POST "$BASE/functions/v1/$1" \
    -H "Authorization: Bearer $2" \
    -H "Content-Type: application/json" \
    -d "$3"
}

show() { echo "  body: $(head -c 300 $BODY)"; }

echo "T1 upload-url como A (clinica del fantasma) -> esperado 200"
S=$(post r2-upload-url "$TOKEN_A" "{\"paciente_id\":\"$FANTASMA\",\"categoria\":\"pdf\",\"nombre_archivo\":\"prueba_f734.pdf\",\"mime_type\":\"application/pdf\",\"tamano_bytes\":1024}")
echo "  status: $S"; show
ARCHIVO_ID=$(python3 -c 'import json;print(json.load(open("/tmp/f734_body.json")).get("archivo_id",""))')
echo "  archivo_id: $ARCHIVO_ID"

echo ""
echo "T2 download-url como A (dueno) -> esperado 200"
S=$(post r2-download-url "$TOKEN_A" "{\"archivo_id\":\"$ARCHIVO_ID\"}")
echo "  status: $S"; show

echo ""
echo "T3 download-url como B (otra clinica) -> esperado 404 (tenant isolation)"
S=$(post r2-download-url "$TOKEN_B" "{\"archivo_id\":\"$ARCHIVO_ID\"}")
echo "  status: $S"; show

echo ""
echo "T4 upload-url como B sobre fantasma de A -> esperado 403 (tenant isolation)"
S=$(post r2-upload-url "$TOKEN_B" "{\"paciente_id\":\"$FANTASMA\",\"categoria\":\"pdf\",\"nombre_archivo\":\"ataque.pdf\",\"mime_type\":\"application/pdf\",\"tamano_bytes\":1024}")
echo "  status: $S"; show

echo ""
echo "T5 delete como A -> esperado 200 (soft delete)"
S=$(post r2-delete "$TOKEN_A" "{\"archivo_id\":\"$ARCHIVO_ID\"}")
echo "  status: $S"; show

echo ""
echo "T6 list-deleted como A -> esperado 200 y contiene archivo_id"
S=$(post r2-list-deleted "$TOKEN_A" "{}")
echo "  status: $S"
grep -q "$ARCHIVO_ID" $BODY && echo "  contiene archivo_id: SI (correcto)" || echo "  contiene archivo_id: NO (FALLO)"

echo ""
echo "T7 list-deleted como B -> esperado 200 y NO contiene archivo_id"
S=$(post r2-list-deleted "$TOKEN_B" "{}")
echo "  status: $S"
grep -q "$ARCHIVO_ID" $BODY && echo "  contiene archivo_id: SI (FALLO tenant isolation)" || echo "  contiene archivo_id: NO (correcto)"

echo ""
echo "T8 restore como A -> esperado 200"
S=$(post r2-restore "$TOKEN_A" "{\"archivo_id\":\"$ARCHIVO_ID\"}")
echo "  status: $S"; show

echo ""
echo "T9 delete como A (otra vez) -> esperado 200"
S=$(post r2-delete "$TOKEN_A" "{\"archivo_id\":\"$ARCHIVO_ID\"}")
echo "  status: $S"; show

echo ""
echo "T10 archivos-purge como A (DESTRUCTIVO, solo fantasma) -> esperado 200 purgados"
S=$(post archivos-purge "$TOKEN_A" "{\"archivo_ids\":[\"$ARCHIVO_ID\"]}")
echo "  status: $S"; show

echo ""
echo "T11 health-check (GET) -> esperado 200"
S=$(curl -s -o $BODY -w "%{http_code}" "$BASE/functions/v1/r2-health-check")
echo "  status: $S"; show

echo ""
echo "=== Fin de tests ==="
echo "Pegar SOLO status codes y cuerpos (sin tokens) en el chat."
echo "Limpieza: ejecutar DELETE del fantasma tras cerrar F7-34 (ver SQL fixture)."
