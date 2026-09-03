#!/usr/bin/env python3
"""
F7-22: Test E2E completo del flujo de archivos clínicos con R2
Tests: upload -> download -> delete + verificación audit_log

Requiere:
- JWT válido de un usuario admin/dentista de clínica 1
- Python 3.7+
- urllib (estándar, sin dependencias externas)

Uso:
  export JWT="eyJ..."
  python3 tests/e2e/test_r2_complete_flow.py
"""

import os
import sys
import json
import hashlib
import urllib.request
import urllib.error
import time
import random
import string

# ============================================================
# CONFIGURACIÓN
# ============================================================

SUPABASE_URL = "https://nagduvivilmzupdpoayo.supabase.co"
PACIENTE_ID = "a5d1fb43-1c5f-4c3d-bbb6-91c18992dd5d"
CLINICA_ID = "00000000-0000-0000-0000-000000000001"

JWT = os.environ.get("JWT", "").strip()
SERVICE_KEY = os.environ.get("SERVICE_KEY", "").strip()

# Cargar desde .env si no están en variables de entorno
if not JWT or not SERVICE_KEY:
    try:
        with open('.env', 'r') as f:
            for line in f:
                line = line.strip()
                if '=' in line and not line.startswith('#'):
                    key, value = line.split('=', 1)
                    if key == "SUPABASE_SERVICE_ROLE_KEY" and not SERVICE_KEY:
                        SERVICE_KEY = value.strip()
    except Exception as e:
        pass

if not JWT:
    print("ERROR: JWT no proporcionado")
    print("Uso: export JWT='eyJ...' && python3 tests/e2e/test_r2_complete_flow.py")
    sys.exit(1)

if not SERVICE_KEY:
    print("ERROR: SUPABASE_SERVICE_ROLE_KEY no encontrado en .env")
    sys.exit(1)

# Archivo de prueba
TEST_FILE = "/tmp/test_archivo_clinico.bin"
TEST_FILE_SIZE = 2048  # 2KB

# ============================================================
# HELPERS
# ============================================================

def api_request(method, url, headers=None, data=None, timeout=30):
    """Hace request HTTP y retorna (status_code, body_json, body_raw)"""
    if headers is None:
        headers = {}
    
    try:
        if data is not None:
            if isinstance(data, dict):
                data = json.dumps(data).encode('utf-8')
                headers['Content-Type'] = 'application/json'
            elif isinstance(data, str):
                data = data.encode('utf-8')
            elif isinstance(data, bytes):
                pass  # ya es bytes
        
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        with urllib.request.urlopen(req, timeout=timeout) as response:
            body_raw = response.read()
            status = response.getcode()
            try:
                body_json = json.loads(body_raw.decode('utf-8'))
            except:
                body_json = None
            return status, body_json, body_raw
    except urllib.error.HTTPError as e:
        body_raw = e.read()
        try:
            body_json = json.loads(body_raw.decode('utf-8'))
        except:
            body_json = None
        return e.code, body_json, body_raw
    except Exception as e:
        return 0, {"error": str(e)}, b""

def create_test_file():
    """Crea archivo binario de prueba con contenido aleatorio"""
    random_data = bytes([random.randint(0, 255) for _ in range(TEST_FILE_SIZE)])
    with open(TEST_FILE, 'wb') as f:
        f.write(random_data)
    return random_data

def md5_file(path):
    """Calcula MD5 de un archivo"""
    with open(path, 'rb') as f:
        return hashlib.md5(f.read()).hexdigest()

def print_section(title):
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)

def print_result(test_name, success, message=""):
    symbol = "✅" if success else "❌"
    print(f"\n{symbol} {test_name}")
    if message:
        print(f"   {message}")

# ============================================================
# TESTS
# ============================================================

def test_1_upload_request():
    """Solicita URL firmada de upload"""
    print_section("TEST 1: Solicitar URL de upload")
    
    status, body, _ = api_request(
        "POST",
        f"{SUPABASE_URL}/functions/v1/r2-upload-url",
        headers={
            "Authorization": f"Bearer {JWT}",
            "Content-Type": "application/json",
        },
        data={
            "paciente_id": PACIENTE_ID,
            "categoria": "radiografia",
            "nombre_archivo": "test_panoramica.jpg",
            "mime_type": "image/jpeg",
            "tamano_bytes": TEST_FILE_SIZE,
        }
    )
    
    if status == 200 and body and "upload_url" in body:
        print_result("Upload request exitoso", True)
        print(f"   archivo_id: {body['archivo_id']}")
        print(f"   r2_object_key: {body['r2_object_key'][:80]}...")
        print(f"   expires_in: {body['expires_in']}s")
        return body
    else:
        print_result("Upload request", False, f"Status: {status}, Body: {body}")
        return None

def test_2_upload_real(upload_data, file_data):
    """Sube archivo a R2 usando URL firmada"""
    print_section("TEST 2: Subir archivo real a R2")
    
    headers = {
        "Content-Type": "image/jpeg",
    }
    headers.update(upload_data.get("upload_headers", {}))
    
    status, _, body_raw = api_request(
        "PUT",
        upload_data["upload_url"],
        headers=headers,
        data=file_data,
        timeout=60
    )
    
    if status in (200, 201):
        print_result("Upload real exitoso", True, f"Status: {status}")
        return True
    else:
        print_result("Upload real", False, f"Status: {status}, Body: {body_raw[:500].decode('utf-8', errors='ignore')}")
        return False

def test_3_download_request(archivo_id):
    """Solicita URL firmada de download"""
    print_section("TEST 3: Solicitar URL de download")
    
    status, body, _ = api_request(
        "POST",
        f"{SUPABASE_URL}/functions/v1/r2-download-url",
        headers={
            "Authorization": f"Bearer {JWT}",
            "Content-Type": "application/json",
        },
        data={"archivo_id": archivo_id}
    )
    
    if status == 200 and body and "download_url" in body:
        print_result("Download request exitoso", True)
        print(f"   expires_in: {body['expires_in']}s")
        return body
    else:
        print_result("Download request", False, f"Status: {status}, Body: {body}")
        return None

def test_4_download_real(download_data):
    """Descarga archivo desde R2 usando URL firmada"""
    print_section("TEST 4: Descargar archivo real desde R2")
    
    download_file = "/tmp/downloaded_archivo_clinico.bin"
    
    headers = download_data.get("download_headers", {})
    
    status, _, body_raw = api_request(
        "GET",
        download_data["download_url"],
        headers=headers,
        timeout=60
    )
    
    if status == 200 and len(body_raw) == TEST_FILE_SIZE:
        with open(download_file, 'wb') as f:
            f.write(body_raw)
        
        md5_original = md5_file(TEST_FILE)
        md5_descargado = md5_file(download_file)
        
        if md5_original == md5_descargado:
            print_result("Download real exitoso", True, f"MD5 match: {md5_original}")
            return True
        else:
            print_result("Download real", False, f"MD5 NO match: {md5_original} != {md5_descargado}")
            return False
    else:
        print_result("Download real", False, f"Status: {status}, Body size: {len(body_raw)}")
        return False

def test_5_delete(archivo_id):
    """Elimina archivo de R2 + soft delete en metadata"""
    print_section("TEST 5: Eliminar archivo")
    
    status, body, _ = api_request(
        "POST",
        f"{SUPABASE_URL}/functions/v1/r2-delete",
        headers={
            "Authorization": f"Bearer {JWT}",
            "Content-Type": "application/json",
        },
        data={"archivo_id": archivo_id}
    )
    
    if status == 200 and body and body.get("success"):
        print_result("Delete exitoso", True, body.get("message", ""))
        return True
    else:
        print_result("Delete", False, f"Status: {status}, Body: {body}")
        return False

def test_6_verify_metadata(archivo_id):
    """Verifica metadata del archivo después de delete"""
    print_section("VERIFICACIÓN 1: Metadata en Supabase")
    
    url = f"{SUPABASE_URL}/rest/v1/archivos_clinicos?id=eq.{archivo_id}&select=id,estado,deleted_at,nombre_archivo"
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
    }
    
    status, body, _ = api_request("GET", url, headers=headers)
    
    if status == 200 and body and len(body) > 0:
        archivo = body[0]
        success = (archivo.get("estado") == "eliminado" and 
                   archivo.get("deleted_at") is not None)
        
        if success:
            print_result("Soft delete correcto", True,
                        f"estado: {archivo['estado']}, deleted_at: {archivo['deleted_at']}")
        else:
            print_result("Soft delete", False, f"Metadata: {archivo}")
        return success
    else:
        print_result("Verificar metadata", False, f"Status: {status}")
        return False

def test_7_verify_audit_log(archivo_id):
    """Verifica que audit_log tenga 3 entradas: upload, download, delete"""
    print_section("VERIFICACIÓN 2: Audit log")
    
    url = f"{SUPABASE_URL}/rest/v1/audit_log?record_id=eq.{archivo_id}&select=action,new_data,created_at&order=created_at"
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
    }
    
    status, body, _ = api_request("GET", url, headers=headers)
    
    if status == 200 and body:
        print(f"   Total entradas en audit_log: {len(body)}")
        
        acciones = set()
        for entrada in body:
            new_data = entrada.get("new_data", {})
            if isinstance(new_data, dict):
                evento = new_data.get("evento", "desconocido")
                acciones.add(evento)
                print(f"   - {evento}: {entrada.get('created_at')}")
        
        acciones_esperadas = {"upload", "download", "delete"}
        success = acciones_esperadas.issubset(acciones)
        
        if success:
            print_result("Audit log completo", True, f"Acciones: {sorted(acciones)}")
        else:
            faltan = acciones_esperadas - acciones
            print_result("Audit log", False, f"Faltan acciones: {faltan}")
        return success
    else:
        print_result("Verificar audit_log", False, f"Status: {status}")
        return False

# ============================================================
# MAIN
# ============================================================

def main():
    print("\n" + "=" * 60)
    print("  F7-22 TEST E2E: Flujo completo de archivos clínicos R2")
    print("=" * 60)
    print(f"\nUsuario JWT: {JWT[:20]}...")
    print(f"Paciente ID: {PACIENTE_ID}")
    print(f"Clínica ID: {CLINICA_ID}")
    print(f"Tamaño archivo test: {TEST_FILE_SIZE} bytes")
    
    # Crear archivo de prueba
    print("\nCreando archivo de prueba...")
    file_data = create_test_file()
    md5_original = md5_file(TEST_FILE)
    print(f"Archivo creado: {TEST_FILE}")
    print(f"MD5 original: {md5_original}")
    
    resultados = {}
    
    # Ejecutar tests secuenciales
    try:
        # Test 1
        upload_data = test_1_upload_request()
        if not upload_data:
            resultados["1_upload_request"] = False
            raise Exception("Test 1 falló, no se puede continuar")
        resultados["1_upload_request"] = True
        archivo_id = upload_data["archivo_id"]
        
        time.sleep(1)  # Pausa breve
        
        # Test 2
        upload_ok = test_2_upload_real(upload_data, file_data)
        resultados["2_upload_real"] = upload_ok
        if not upload_ok:
            raise Exception("Test 2 falló, no se puede continuar")
        
        time.sleep(1)
        
        # Test 3
        download_data = test_3_download_request(archivo_id)
        if not download_data:
            resultados["3_download_request"] = False
            raise Exception("Test 3 falló, no se puede continuar")
        resultados["3_download_request"] = True
        
        # Test 4
        download_ok = test_4_download_real(download_data)
        resultados["4_download_real"] = download_ok
        
        # Test 5
        delete_ok = test_5_delete(archivo_id)
        resultados["5_delete"] = delete_ok
        
        # Verificaciones
        verify_meta = test_6_verify_metadata(archivo_id)
        resultados["6_verify_metadata"] = verify_meta
        
        verify_log = test_7_verify_audit_log(archivo_id)
        resultados["7_verify_audit_log"] = verify_log
        
    except Exception as e:
        print(f"\n❌ Error durante tests: {e}")
    
    # Resumen final
    print_section("RESUMEN FINAL")
    
    total = len(resultados)
    passed = sum(1 for v in resultados.values() if v)
    
    for test, success in resultados.items():
        symbol = "✅" if success else "❌"
        print(f"{symbol} {test}")
    
    print(f"\n📊 Resultado: {passed}/{total} tests pasaron")
    
    if passed == total:
        print("\n🎉 TODOS LOS TESTS PASARON - Flujo completo validado")
    else:
        print(f"\n⚠️  {total - passed} tests fallaron")
    
    # Limpiar
    print("\nLimpiando archivos temporales...")
    for f in [TEST_FILE, "/tmp/downloaded_archivo_clinico.bin"]:
        try:
            if os.path.exists(f):
                os.remove(f)
                print(f"  ✓ {f}")
        except:
            pass
    
    print()
    return 0 if passed == total else 1

if __name__ == "__main__":
    sys.exit(main())
