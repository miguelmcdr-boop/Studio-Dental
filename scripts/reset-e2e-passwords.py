#!/usr/bin/env python3
"""
Resetea la contraseña de los 6 usuarios E2E a un valor fijo.
Usa las credenciales del .env (service_role) para acceso admin.
"""
import os
import sys
import json
import urllib.request
import urllib.error
import getpass

# Cargar .env
def load_env():
    with open('.env') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()

load_env()

SUPABASE_URL = os.environ.get('VITE_SUPABASE_URL')
SERVICE_ROLE = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SERVICE_ROLE:
    print("❌ Faltan VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env")
    sys.exit(1)

USERS_E2E = [
    "e2e_admin@studiodental.com",
    "e2e_dentista@studiodental.com",
    "e2e_asistente@studiodental.com",
    "e2e_recepcion@studiodental.com",
    "e2e_admin_clinica2@studiodental.com",
    "e2e_dentista_clinica2@studiodental.com",
]

# Pedir nueva contraseña al usuario
new_password = getpass.getpass("\n🔐 Nueva contraseña para usuarios E2E (mínimo 6 caracteres): ")
if len(new_password) < 6:
    print("❌ La contraseña debe tener al menos 6 caracteres")
    sys.exit(1)

def call_admin(method, path, body=None):
    """Llama al endpoint admin de Supabase Auth con service_role."""
    url = SUPABASE_URL + path
    r = urllib.request.Request(url, method=method)
    r.add_header("apikey", SERVICE_ROLE)
    r.add_header("Authorization", f"Bearer {SERVICE_ROLE}")
    r.add_header("Content-Type", "application/json")
    data = json.dumps(body).encode() if body else None
    try:
        with urllib.request.urlopen(r, data) as resp:
            txt = resp.read().decode()
            return resp.status, (json.loads(txt) if txt else None)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

# Listar usuarios E2E existentes
print("\n🔍 Buscando usuarios E2E...")
st, b = call_admin("GET", "/auth/v1/admin/users")
if st != 200 or not isinstance(b, dict):
    print(f"❌ Error al listar usuarios: {st}")
    sys.exit(1)

all_users = b.get("users", [])
e2e_users = [u for u in all_users if u.get("email") in USERS_E2E]

print(f"✓ Encontrados {len(e2e_users)} usuarios E2E de {len(USERS_E2E)} esperados\n")

# Actualizar contraseña de cada usuario
updated = 0
for user in e2e_users:
    email = user["email"]
    uid = user["id"]
    print(f"  🔄 Cambiando contraseña de {email}...")
    st, b = call_admin("PUT", f"/auth/v1/admin/users/{uid}", {"password": new_password})
    if st == 200:
        print(f"    ✓ OK")
        updated += 1
    else:
        print(f"    ❌ Error {st}: {b}")

print(f"\n✅ Contraseñas actualizadas: {updated}/{len(e2e_users)}")

if updated == len(e2e_users):
    # Actualizar F720_PASSWORD_E2E en .env
    with open('.env', 'r') as f:
        lines = f.readlines()

    # Buscar si ya existe la variable
    found = False
    new_lines = []
    for line in lines:
        if line.strip().startswith('F720_PASSWORD_E2E='):
            new_lines.append(f"F720_PASSWORD_E2E={new_password}\n")
            found = True
        else:
            new_lines.append(line)

    if not found:
        new_lines.append(f"\nF720_PASSWORD_E2E={new_password}\n")

    with open('.env', 'w') as f:
        f.writelines(new_lines)

    print(f"✅ Variable F720_PASSWORD_E2E actualizada en .env")
    print(f"\n🎉 Listo. Ahora puedes ejecutar el pen-test:")
    print(f"   python3 tests/e2e/multi_tenant_isolation_e2e.py")
else:
    print("\n⚠️  Algunos usuarios no se actualizaron. Verifica errores arriba.")
