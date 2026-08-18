#!/usr/bin/env python3
# F6-B2 matriz clínica — valida RLS de recetas, pacientes y profiles (17 checks)
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rbac_common import E2ERunner, call, SVC

def main():
    r = E2ERunner("f6b5cli")
    st, b = call("GET", "/rest/v1/pacientes?nombre=like.*F6B5CLI&select=id", SVC)
    for row in (b or []): call("DELETE", f"/rest/v1/pacientes?id=eq.{row['id']}", SVC)
    st, b = call("GET", "/rest/v1/profiles?email=like.f6b5cli-%25&select=id", SVC)
    for row in (b or []): call("DELETE", f"/rest/v1/profiles?id=eq.{row['id']}", SVC)
    st, b = call("GET", "/auth/v1/admin/users", SVC)
    for u in (b.get("users", []) if isinstance(b, dict) else []):
        if u["email"].startswith("f6b5cli-"):
            call("DELETE", f"/auth/v1/admin/users/{u['id']}", SVC)
    print(">> pre-limpieza OK")

    r.create_users(); r.login_users()

    st, b = call("POST", "/rest/v1/pacientes?select=id", r.T["dentista"],
                 {"user_id": r.IDS["dentista"], "nombre": "Pac F6B5CLI", "rut": "1-9"})
    if st != 201 or not b: raise SystemExit(f"PACIENTE FALLIDO: {st} {b}")
    PAC = b[0]["id"]
    st, b = call("POST", "/rest/v1/recetas?select=id", r.T["dentista"],
                 {"user_id": r.IDS["dentista"], "paciente_id": PAC, "fecha": "2026-08-18", "medicamentos": []})
    if st != 201 or not b: raise SystemExit(f"RECETA FALLIDO: {st} {b}")
    REC = b[0]["id"]

    r.check("rec_read_recepcion", r.nrows("recepcion", f"/rest/v1/recetas?id=eq.{REC}"), 0)
    r.check("rec_read_asistente (ajena)", r.nrows("asistente", f"/rest/v1/recetas?id=eq.{REC}"), 0)
    r.check("rec_read_dentista", r.nrows("dentista", f"/rest/v1/recetas?id=eq.{REC}"), 1)
    r.check("rec_read_admin (ajena)", r.nrows("admin", f"/rest/v1/recetas?id=eq.{REC}"), 0)

    st,_ = call("POST","/rest/v1/recetas",r.T["asistente"],{"user_id":r.IDS["asistente"],"paciente_id":PAC,"fecha":"2026-08-18","medicamentos":[]}); r.check("rec_ins_asistente", st, 403)
    st,_ = call("POST","/rest/v1/recetas",r.T["recepcion"],{"user_id":r.IDS["recepcion"],"paciente_id":PAC,"fecha":"2026-08-18","medicamentos":[]}); r.check("rec_ins_recepcion", st, 403)
    st,b = call("POST","/rest/v1/recetas?select=id",r.T["dentista"],{"user_id":r.IDS["dentista"],"paciente_id":PAC,"fecha":"2026-08-18","medicamentos":[]}); r.check("rec_ins_dentista", st, 201)
    NEWREC = b[0]["id"] if st==201 and b else None

    call("DELETE", f"/rest/v1/recetas?id=eq.{REC}", r.T["asistente"])
    r.check("rec_del_asistente (fila sigue)", r.nrows("dentista", f"/rest/v1/recetas?id=eq.{REC}"), 1)
    call("DELETE", f"/rest/v1/recetas?id=eq.{REC}", r.T["dentista"])
    r.check("rec_del_dentista (fila borrada)", r.nrows("dentista", f"/rest/v1/recetas?id=eq.{REC}"), 0)

    r.check("pac_read_recepcion (ajeno)", r.nrows("recepcion", f"/rest/v1/pacientes?id=eq.{PAC}"), 0)
    st,b = call("POST","/rest/v1/pacientes?select=id",r.T["recepcion"],{"user_id":r.IDS["recepcion"],"nombre":"Pac X F6B5CLI","rut":"2-2"}); r.check("pac_ins_recepcion", st, 201)
    NEWPAC = b[0]["id"] if st==201 and b else None
    r.check("pac_read_own_recepcion", r.nrows("recepcion", f"/rest/v1/pacientes?id=eq.{NEWPAC}"), 1)
    call("DELETE", f"/rest/v1/pacientes?id=eq.{PAC}", r.T["recepcion"])
    r.check("pac_del_recepcion (fila sigue)", r.nrows("dentista", f"/rest/v1/pacientes?id=eq.{PAC}"), 1)
    call("DELETE", f"/rest/v1/pacientes?id=eq.{PAC}", r.T["asistente"])
    r.check("pac_del_asistente (fila sigue)", r.nrows("dentista", f"/rest/v1/pacientes?id=eq.{PAC}"), 1)
    call("DELETE", f"/rest/v1/pacientes?id=eq.{PAC}", r.T["dentista"])
    r.check("pac_del_dentista (fila borrada)", r.nrows("dentista", f"/rest/v1/pacientes?id=eq.{PAC}"), 0)

    st,_ = call("PATCH", f"/rest/v1/profiles?id=eq.{r.IDS['asistente']}", r.T["asistente"], {"role":"admin","full_name":"HACK"})
    st,b = call("GET", f"/rest/v1/profiles?id=eq.{r.IDS['asistente']}&select=role,full_name", r.T["asistente"])
    r.check("profiles_role_bloqueado", b[0]["role"], "asistente")
    r.check("profiles_full_name_editable", b[0]["full_name"], "HACK")

    if NEWREC: call("DELETE", f"/rest/v1/recetas?id=eq.{NEWREC}", SVC)
    if NEWPAC: call("DELETE", f"/rest/v1/pacientes?id=eq.{NEWPAC}", SVC)
    call("DELETE", f"/rest/v1/pacientes?id=eq.{PAC}", SVC)
    r.cleanup_users()
    ok = r.report()
    sys.exit(0 if ok else 1)

if __name__ == "__main__":
    main()
