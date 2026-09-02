#!/usr/bin/env python3
"""
F7-20: Pen-test de aislamiento multi-tenant contra Supabase PRODUCCIÓN

Usa los 6 usuarios E2E existentes (creados en F7-21):
  Clínica 1: e2e_admin, e2e_dentista, e2e_asistente, e2e_recepcion
  Clínica 2: e2e_admin_clinica2, e2e_dentista_clinica2

Variables de entorno requeridas (en .env):
  VITE_SUPABASE_URL          - URL de Supabase
  VITE_SUPABASE_ANON_KEY     - API key pública
  SUPABASE_SERVICE_ROLE_KEY  - Service role key (solo para limpieza)
  F720_PASSWORD_E2E          - Contraseña de usuarios E2E

Ataques probados:
  1. dentista_clinica2 intenta ver evoluciones de clínica 1 (por user_id)
  2. dentista_clinica2 intenta ver recetas de clínica 1 (por paciente_id)
  3. dentista_clinica2 intenta ver pacientes de clínica 1 (por ID)
  4. dentista_clinica2 intenta ver pacientes de clínica 1 (por clinica_id)
  5. dentista_clinica2 intenta INSERT evolución en paciente de clínica 1
  6. dentista_clinica2 intenta INSERT receta en paciente de clínica 1
  7. dentista_clinica2 intenta UPDATE receta de clínica 1
  8. dentista_clinica2 intenta DELETE receta de clínica 1
  9. dentista_clinica2 intenta agregarse como miembro de clínica 1
 10. dentista_clinica2 intenta ver audit_log de clínica 1

Resultado esperado: TODOS los ataques deben fallar (0 filas o HTTP 403).
"""
import sys
import os
import json
import base64

# Cargar variables de entorno desde .env
def load_env():
    env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
    if not os.path.exists(env_path):
        print(f"❌ Archivo {env_path} no encontrado")
        print("Crea el archivo con las variables requeridas")
        sys.exit(1)
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()

load_env()

# Credenciales desde env (reutilizamos variables existentes de Vite)
SUPABASE_URL = os.environ.get('VITE_SUPABASE_URL')
ANON_KEY = os.environ.get('VITE_SUPABASE_ANON_KEY')
SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
PASSWORD_E2E = os.environ.get('F720_PASSWORD_E2E')

missing = []
if not SUPABASE_URL: missing.append('VITE_SUPABASE_URL')
if not ANON_KEY: missing.append('VITE_SUPABASE_ANON_KEY')
if not SERVICE_ROLE_KEY: missing.append('SUPABASE_SERVICE_ROLE_KEY')
if not PASSWORD_E2E: missing.append('F720_PASSWORD_E2E')

if missing:
    print(f"❌ Faltan variables de entorno en .env: {', '.join(missing)}")
    sys.exit(1)

# IDs de clínicas existentes (del seed E2E)
CLINICA_1 = "00000000-0000-0000-0000-000000000001"
CLINICA_2 = "00000000-0000-0000-0000-000000000002"

# Emails E2E existentes
USERS = {
    "admin1": "e2e_admin@studiodental.com",
    "dentista1": "e2e_dentista@studiodental.com",
    "dentista2": "e2e_dentista_clinica2@studiodental.com",
}


def call(method, path, token=None, body=None):
    """Hace request HTTP a Supabase REST API."""
    import urllib.request, urllib.error
    url = SUPABASE_URL + path
    r = urllib.request.Request(url, method=method)
    r.add_header("apikey", ANON_KEY)
    r.add_header("Content-Type", "application/json")
    r.add_header("Prefer", "return=representation")
    if token:
        r.add_header("Authorization", "Bearer " + token)
    data = json.dumps(body).encode() if body is not None else None
    try:
        with urllib.request.urlopen(r, data) as resp:
            txt = resp.read().decode()
            return resp.status, (json.loads(txt) if txt else None)
    except urllib.error.HTTPError as e:
        txt = e.read().decode()
        try:
            return e.code, json.loads(txt)
        except Exception:
            return e.code, txt


def login_user(email):
    """Login de usuario E2E existente y retorna access_token."""
    st, b = call("POST", "/auth/v1/token?grant_type=password", None,
                 {"email": email, "password": PASSWORD_E2E})
    if not b or "access_token" not in b:
        raise SystemExit(f"❌ LOGIN FALLIDO {email}: {st} {b}")
    return b["access_token"], b["user"]["id"]


def extract_user_id(token):
    """Extrae user_id del JWT."""
    payload_part = token.split('.')[1]
    payload_part += '=' * (4 - len(payload_part) % 4)
    payload = json.loads(base64.b64decode(payload_part))
    return payload.get("sub")


def create_patient(token, clinica_id, nombre):
    """Crea paciente de prueba."""
    user_id = extract_user_id(token)
    st, b = call("POST", "/rest/v1/pacientes?select=id", token, {
        "nombre": nombre,
        "rut": f"F720-{nombre[-6:]}",
        "user_id": user_id,
        "clinica_id": clinica_id
    })
    if st not in (200, 201) or not b:
        raise SystemExit(f"❌ PACIENTE FALLIDO {nombre}: {st} {b}")
    return b[0]["id"]


def create_receta(token, paciente_id):
    """Crea receta de prueba."""
    user_id = extract_user_id(token)
    st, b = call("POST", "/rest/v1/recetas?select=id", token, {
        "paciente_id": paciente_id,
        "fecha": "2026-09-02",
        "medicamentos": [{"nombre": "Amoxicilina", "indicacion": "500mg"}],
        "user_id": user_id
    })
    if st not in (200, 201) or not b:
        raise SystemExit(f"❌ RECETA FALLIDA: {st} {b}")
    return b[0]["id"]


def create_evolucion(token, paciente_id):
    """Crea evolución de prueba."""
    user_id = extract_user_id(token)
    st, b = call("POST", "/rest/v1/evoluciones_clinicas?select=id", token, {
        "paciente_id": paciente_id,
        "texto": "Evolución F7-20 TEST",
        "fecha_hora": "2026-09-02T10:00:00Z",
        "tipo": "evolucion",
        "user_id": user_id
    })
    if st not in (200, 201) or not b:
        raise SystemExit(f"❌ EVOLUCIÓN FALLIDA: {st} {b}")
    return b[0]["id"]


def main():
    print("=" * 70)
    print("F7-20: Pen-test de aislamiento multi-tenant (PRODUCCIÓN)")
    print("=" * 70)
    print(f"\nURL: {SUPABASE_URL}")
    print(f"Clínica 1: {CLINICA_1}")
    print(f"Clínica 2: {CLINICA_2}")

    results = []

    def check(label, got, expected, description=""):
        status = "PASS" if got == expected else "FAIL"
        desc = f" | {description}" if description else ""
        results.append(f"{status} | {label}: {got} (esperado {expected}){desc}")

    # ============================================================
    # SETUP: login con usuarios E2E existentes
    # ============================================================
    print("\n[SETUP] Login con usuarios E2E existentes...")
    token_admin1, user_admin1 = login_user(USERS["admin1"])
    token_dentista1, user_dentista1 = login_user(USERS["dentista1"])
    token_dentista2, user_dentista2 = login_user(USERS["dentista2"])
    print(f"  ✓ admin1: {user_admin1}")
    print(f"  ✓ dentista1 (clínica 1): {user_dentista1}")
    print(f"  ✓ dentista2 (clínica 2): {user_dentista2}")

    # ============================================================
    # SETUP: crear datos de prueba en clínica 1
    # ============================================================
    print("\n[SETUP] Creando datos de prueba en clínica 1...")
    paciente_1 = create_patient(token_dentista1, CLINICA_1, "Paciente F720 Clinica 1")
    receta_1 = create_receta(token_dentista1, paciente_1)
    evolucion_1 = create_evolucion(token_dentista1, paciente_1)
    print(f"  ✓ Paciente clínica 1: {paciente_1}")
    print(f"  ✓ Receta clínica 1: {receta_1}")
    print(f"  ✓ Evolución clínica 1: {evolucion_1}")

    # ============================================================
    # TESTS: Ataques desde clínica 2 → clínica 1
    # ============================================================
    print("\n" + "=" * 70)
    print("[TESTS] Ejecutando ataques cross-tenant: clínica 2 → clínica 1")
    print("=" * 70)

    # Ataque 1: SELECT evoluciones de clínica 1 filtrando por user_id
    print("\n[1/10] SELECT evoluciones WHERE user_id = dentista1")
    st, b = call("GET", f"/rest/v1/evoluciones_clinicas?user_id=eq.{user_dentista1}&select=id", token_dentista2)
    nrows = len(b) if isinstance(b, list) else -1
    check("ataque_1_select_evoluciones_por_user", nrows, 0,
          "dentista2 no debe ver evoluciones de dentista1")

    # Ataque 2: SELECT recetas de clínica 1 filtrando por paciente_id
    print("\n[2/10] SELECT recetas WHERE paciente_id = paciente_1")
    st, b = call("GET", f"/rest/v1/recetas?paciente_id=eq.{paciente_1}&select=id", token_dentista2)
    nrows = len(b) if isinstance(b, list) else -1
    check("ataque_2_select_recetas_por_paciente", nrows, 0,
          "dentista2 no debe ver recetas de paciente de clínica 1")

    # Ataque 3: SELECT pacientes de clínica 1 por ID
    print("\n[3/10] SELECT pacientes WHERE id = paciente_1")
    st, b = call("GET", f"/rest/v1/pacientes?id=eq.{paciente_1}&select=id", token_dentista2)
    nrows = len(b) if isinstance(b, list) else -1
    check("ataque_3_select_paciente_por_id", nrows, 0,
          "dentista2 no debe ver paciente de clínica 1")

    # Ataque 4: SELECT pacientes filtrando por clinica_id de clínica 1
    print("\n[4/10] SELECT pacientes WHERE clinica_id = clínica_1")
    st, b = call("GET", f"/rest/v1/pacientes?clinica_id=eq.{CLINICA_1}&select=id", token_dentista2)
    nrows = len(b) if isinstance(b, list) else -1
    check("ataque_4_select_por_clinica_id", nrows, 0,
          "dentista2 no debe ver pacientes filtrando por clinica_id ajena")

    # Ataque 5: INSERT evolución en paciente de clínica 1 (cross-tenant)
    print("\n[5/10] INSERT evolución en paciente de clínica 1 desde clínica 2")
    st, b = call("POST", "/rest/v1/evoluciones_clinicas?select=id", token_dentista2, {
        "paciente_id": paciente_1,
        "texto": "INTENTO CROSS-TENANT F7-20",
        "fecha_hora": "2026-09-02T10:00:00Z",
        "tipo": "evolucion",
        "user_id": user_dentista2
    })
    check("ataque_5_insert_evolucion_cross", st, 403,
          "INSERT cross-tenant debe retornar 403")

    # Ataque 6: INSERT receta en paciente de clínica 1 (cross-tenant)
    print("\n[6/10] INSERT receta en paciente de clínica 1 desde clínica 2")
    st, b = call("POST", "/rest/v1/recetas?select=id", token_dentista2, {
        "paciente_id": paciente_1,
        "fecha": "2026-09-02",
        "medicamentos": [],
        "user_id": user_dentista2
    })
    check("ataque_6_insert_receta_cross", st, 403,
          "INSERT receta cross-tenant debe retornar 403")

    # Ataque 7: UPDATE receta de clínica 1 desde clínica 2
    print("\n[7/10] UPDATE receta de clínica 1 desde clínica 2")
    st, b = call("PATCH", f"/rest/v1/recetas?id=eq.{receta_1}", token_dentista2, {
        "indicaciones": "HACKEADO_F720"
    })
    # Verificar que NO se modificó (leyendo con dentista1 que sí tiene acceso)
    st2, b2 = call("GET", f"/rest/v1/recetas?id=eq.{receta_1}&select=indicaciones", token_dentista1)
    if isinstance(b2, list) and len(b2) > 0:
        indicacion_actual = b2[0].get("indicaciones")
    else:
        indicacion_actual = "NO_ACCESIBLE"
    check("ataque_7_update_receta_cross",
          indicacion_actual != "HACKEADO_F720",
          True,
          "UPDATE no debe modificar receta de clínica 1")

    # Ataque 8: DELETE receta de clínica 1 desde clínica 2
    print("\n[8/10] DELETE receta de clínica 1 desde clínica 2")
    st, b = call("DELETE", f"/rest/v1/recetas?id=eq.{receta_1}", token_dentista2)
    # Verificar que receta SIGUE existiendo
    st2, b2 = call("GET", f"/rest/v1/recetas?id=eq.{receta_1}&select=id", token_dentista1)
    nrows = len(b2) if isinstance(b2, list) else 0
    check("ataque_8_delete_receta_cross", nrows, 1,
          "DELETE no debe eliminar receta de clínica 1")

    # Ataque 9: INSERT en miembros_clinica intentando agregar dentista2 a clínica 1
    print("\n[9/10] INSERT en miembros_clinica de clínica 1 (escalación de privilegios)")
    st, b = call("POST", "/rest/v1/miembros_clinica?select=id", token_dentista2, {
        "clinica_id": CLINICA_1,
        "user_id": user_dentista2,
        "rol": "admin",
        "activo": True
    })
    check("ataque_9_escalacion_miembros", st, 403,
          "dentista2 no debe poder agregarse a clínica 1")

    # Ataque 10: SELECT en audit_log filtrando por clinica_id de clínica 1
    print("\n[10/10] SELECT audit_log de clínica 1 desde clínica 2")
    st, b = call("GET", f"/rest/v1/audit_log?clinica_id=eq.{CLINICA_1}&select=id", token_dentista2)
    nrows = len(b) if isinstance(b, list) else -1
    check("ataque_10_select_audit_log_cross", nrows, 0,
          "dentista2 no debe ver audit_log de clínica 1")

    # ============================================================
    # TEARDOWN: limpiar solo datos creados por el test
    # ============================================================
    print("\n" + "=" * 70)
    print("[TEARDOWN] Limpiando datos de prueba creados por el test...")
    print("=" * 70)

    # Usar service_role para limpieza garantizada
    call("DELETE", f"/rest/v1/evoluciones_clinicas?id=eq.{evolucion_1}", SERVICE_ROLE_KEY)
    call("DELETE", f"/rest/v1/recetas?id=eq.{receta_1}", SERVICE_ROLE_KEY)
    call("DELETE", f"/rest/v1/pacientes?id=eq.{paciente_1}", SERVICE_ROLE_KEY)
    # Limpiar cualquier registro residual que el test haya logrado crear
    call("DELETE", "/rest/v1/evoluciones_clinicas?texto=like.*F7-20*", SERVICE_ROLE_KEY)
    call("DELETE", "/rest/v1/miembros_clinica?user_id=eq." + user_dentista2 + "&clinica_id=eq." + CLINICA_1, SERVICE_ROLE_KEY)
    print("  ✓ Limpieza completada")

    # ============================================================
    # REPORTE
    # ============================================================
    print("\n" + "=" * 70)
    print("RESULTADOS F7-20: Aislamiento multi-tenant")
    print("=" * 70)
    for r in results:
        print(r)
    fails = [r for r in results if r.startswith("FAIL")]
    passes = [r for r in results if r.startswith("PASS")]
    print("\n" + "-" * 70)
    print(f"PASS: {len(passes)}/{len(results)}")
    print(f"FAIL: {len(fails)}/{len(results)}")
    print("-" * 70)

    if fails:
        print("\n⚠️  HAY BYPASSES CROSS-TENANT — requiere Fase 2 (eliminar políticas legacy)")
        print("\nPolíticas legacy problemáticas (auth.uid() = user_id sin validar clinica_id):")
        print("  - evoluciones_clinicas")
        print("  - recetas")
        print("  - odontogramas")
        print("  - periodontogramas, periodontogramas_historial")
        print("  - dsd_configs, odontopediatria")
        print("  - quirurgico_implantes, quirurgico_endodoncia")
    else:
        print("\n✅ TODOS los ataques fallaron — aislamiento multi-tenant FUNCIONA")
        print("Las políticas RLS bloquean correctamente el acceso cross-tenant.")
        print("F7-20 queda DONE — no requiere Fase 2.")

    sys.exit(0 if len(fails) == 0 else 1)


if __name__ == "__main__":
    main()
