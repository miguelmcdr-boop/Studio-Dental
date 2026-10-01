#!/usr/bin/env python3
# F6-B3 matriz financiera/vademécum/audit — valida RLS de movimientos, pagos,
# presupuestos, items, inventario, vademécum y audit_log (31 checks)
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rbac_common import E2ERunner, call, SVC

def main():
    r = E2ERunner("f6b5fin")
    SENT = "F6B5-SENT"
    st, b = call("GET", "/rest/v1/presupuesto_items?prestacion_nombre=eq.X&select=id", SVC)
    for row in (b or []): call("DELETE", f"/rest/v1/presupuesto_items?id=eq.{row['id']}", SVC)
    st, b = call("GET", "/rest/v1/presupuestos?paciente_nombre=eq.X&select=id", SVC)
    for row in (b or []): call("DELETE", f"/rest/v1/presupuestos?id=eq.{row['id']}", SVC)
    st, b = call("GET", "/rest/v1/inventario?nombre=eq.X&categoria=eq.Y&select=id", SVC)
    for row in (b or []): call("DELETE", f"/rest/v1/inventario?id=eq.{row['id']}", SVC)
    st, b = call("GET", "/rest/v1/audit_log?table_name=eq.test&record_id=eq.1&select=id", SVC)
    for row in (b or []): call("DELETE", f"/rest/v1/audit_log?id=eq.{row['id']}", SVC)
    st, b = call("GET", "/rest/v1/pacientes?nombre=like.*F6B5FIN&select=id", SVC)
    for row in (b or []): call("DELETE", f"/rest/v1/pacientes?id=eq.{row['id']}", SVC)
    st, b = call("GET", "/rest/v1/profiles?email=like.f6b5fin-%25&select=id", SVC)
    for row in (b or []): call("DELETE", f"/rest/v1/profiles?id=eq.{row['id']}", SVC)
    st, b = call("GET", "/auth/v1/admin/users", SVC)
    for u in (b.get("users", []) if isinstance(b, dict) else []):
        if u["email"].startswith("f6b5fin-"):
            call("DELETE", f"/auth/v1/admin/users/{u['id']}", SVC)
    print(">> pre-limpieza OK")

    r.create_users(); r.login_users()

    st, b = call("POST", "/rest/v1/pacientes?select=id", r.T["dentista"],
                 {"user_id": r.IDS["dentista"], "nombre": "Pac F6B5FIN", "rut": "1-9"})
    if st != 201 or not b: raise SystemExit(f"PACIENTE FALLIDO: {st} {b}")
    PAC = b[0]["id"]

    MOV = {"fecha": "2026-08-18", "tipo": "Ingreso", "categoria": "Test", "monto": 1000, "metodo_pago": "Efectivo"}
    st,_ = call("POST","/rest/v1/movimientos_financieros",r.T["recepcion"],{**MOV,"user_id":r.IDS["recepcion"]}); r.check("fin_ins_recepcion", st, 403)
    st,_ = call("POST","/rest/v1/movimientos_financieros",r.T["asistente"],{**MOV,"user_id":r.IDS["asistente"]}); r.check("fin_ins_asistente", st, 403)
    st,b = call("POST","/rest/v1/movimientos_financieros?select=id",r.T["dentista"],{**MOV,"user_id":r.IDS["dentista"]}); r.check("fin_ins_dentista", st, 201)
    MOVID = b[0]["id"] if st == 201 and b else None
    r.check("fin_read_recepcion", r.nrows("recepcion", f"/rest/v1/movimientos_financieros?id=eq.{MOVID}"), 0)
    r.check("fin_read_asistente", r.nrows("asistente", f"/rest/v1/movimientos_financieros?id=eq.{MOVID}"), 0)
    r.check("fin_read_dentista", r.nrows("dentista", f"/rest/v1/movimientos_financieros?id=eq.{MOVID}"), 1)
    call("DELETE", f"/rest/v1/movimientos_financieros?id=eq.{MOVID}", r.T["dentista"])
    r.check("fin_del_dentista", r.nrows("dentista", f"/rest/v1/movimientos_financieros?id=eq.{MOVID}"), 0)

    st,_ = call("POST","/rest/v1/pagos",r.T["recepcion"],{"user_id":r.IDS["recepcion"],"paciente_id":PAC,"folio":f"F-{r.SUF}","monto":1000,"metodo_pago":"Efectivo"}); r.check("pag_ins_recepcion", st, 403)
    st,b = call("POST","/rest/v1/pagos?select=id",r.T["dentista"],{"user_id":r.IDS["dentista"],"paciente_id":PAC,"folio":f"F-{r.SUF}","monto":1000,"metodo_pago":"Efectivo"}); r.check("pag_ins_dentista", st, 201)
    PAGID = b[0]["id"] if st == 201 and b else None
    call("DELETE", f"/rest/v1/pagos?id=eq.{PAGID}", r.T["dentista"])
    r.check("pag_del_dentista", r.nrows("dentista", f"/rest/v1/pagos?id=eq.{PAGID}"), 0)

    st,b = call("POST","/rest/v1/presupuestos?select=id",r.T["recepcion"],{"user_id":r.IDS["recepcion"],"folio":f"PR-{r.SUF}","paciente_nombre":"X"}); r.check("pres_ins_recepcion", st, 201)
    PRESR = b[0]["id"] if st == 201 and b else None
    call("DELETE", f"/rest/v1/presupuestos?id=eq.{PRESR}", r.T["recepcion"])
    r.check("pres_del_recepcion (fila sigue)", r.nrows("recepcion", f"/rest/v1/presupuestos?id=eq.{PRESR}"), 1)
    st,b = call("POST","/rest/v1/presupuestos?select=id",r.T["dentista"],{"user_id":r.IDS["dentista"],"folio":f"PD-{r.SUF}","paciente_nombre":"X"}); r.check("pres_ins_dentista", st, 201)
    PRESD = b[0]["id"] if st == 201 and b else None
    call("DELETE", f"/rest/v1/presupuestos?id=eq.{PRESD}", r.T["dentista"])
    r.check("pres_del_dentista (fila borrada)", r.nrows("dentista", f"/rest/v1/presupuestos?id=eq.{PRESD}"), 0)
    st,_ = call("POST","/rest/v1/presupuesto_items",r.T["recepcion"],{"presupuesto_id":PRESR,"prestacion_nombre":"X","valor":1000}); r.check("items_ins_recepcion", st, 201)
    st,_ = call("POST","/rest/v1/presupuesto_items",r.T["asistente"],{"presupuesto_id":PRESR,"prestacion_nombre":"X","valor":1000}); r.check("items_ins_asistente (ajeno)", st, 403)

    st,_ = call("POST","/rest/v1/inventario",r.T["asistente"],{"user_id":r.IDS["asistente"],"nombre":"X","categoria":"Y","cantidad_actual":1}); r.check("inv_ins_asistente", st, 403)
    st,_ = call("POST","/rest/v1/inventario",r.T["recepcion"],{"user_id":r.IDS["recepcion"],"nombre":"X","categoria":"Y","cantidad_actual":1}); r.check("inv_ins_recepcion", st, 403)
    st,b = call("POST","/rest/v1/inventario?select=id",r.T["dentista"],{"user_id":r.IDS["dentista"],"nombre":"X","categoria":"Y","cantidad_actual":1}); r.check("inv_ins_dentista", st, 201)
    INVID = b[0]["id"] if st == 201 and b else None
    r.check("inv_read_asistente (ajeno)", r.nrows("asistente", f"/rest/v1/inventario?id=eq.{INVID}"), 0)

    txtcol = "nombre_generico"
    st, b = call("GET", f"/rest/v1/vademecum_urgencia?select=id,{txtcol}&limit=1")
    VAD = b[0]["id"] if st == 200 and b else None
    VADVAL = b[0][txtcol] if st == 200 and b else None
    r.check("vad_read_anon", 1 if VAD else 0, 1)
    call("PATCH", f"/rest/v1/vademecum_urgencia?id=eq.{VAD}", r.T["recepcion"], {txtcol: SENT})
    st, b = call("GET", f"/rest/v1/vademecum_urgencia?id=eq.{VAD}&select={txtcol}")
    r.check("vad_upd_recepcion (valor intacto)", b[0][txtcol], VADVAL)
    call("PATCH", f"/rest/v1/vademecum_urgencia?id=eq.{VAD}", r.T["asistente"], {txtcol: SENT})
    st, b = call("GET", f"/rest/v1/vademecum_urgencia?id=eq.{VAD}&select={txtcol}")
    r.check("vad_upd_asistente (valor intacto)", b[0][txtcol], VADVAL)
    call("PATCH", f"/rest/v1/vademecum_urgencia?id=eq.{VAD}", r.T["dentista"], {txtcol: SENT})
    st, b = call("GET", f"/rest/v1/vademecum_urgencia?id=eq.{VAD}&select={txtcol}")
    r.check("vad_upd_dentista (valor cambiado)", b[0][txtcol], SENT)
    call("PATCH", f"/rest/v1/vademecum_urgencia?id=eq.{VAD}", r.T["admin"], {txtcol: VADVAL})
    st, b = call("GET", f"/rest/v1/vademecum_urgencia?id=eq.{VAD}&select={txtcol}")
    r.check("vad_upd_admin (restaura)", b[0][txtcol], VADVAL)

    AUD = None
    for act in ["UPDATE", "INSERT", "DELETE", "CREATE", "SELECT"]:
        st, b = call("POST", "/rest/v1/audit_log?select=id", r.T["asistente"],
                     {"user_id": r.IDS["asistente"], "table_name": "test", "record_id": "1", "action": act})
        if st == 201 and b:
            AUD = b[0]["id"]; break
    r.check("audit_ins_asistente", 201 if AUD else 400, 201)
    r.check("audit_read_own", r.nrows("asistente", f"/rest/v1/audit_log?id=eq.{AUD}"), 1)
    r.check("audit_read_admin (ajeno)", r.nrows("admin", f"/rest/v1/audit_log?id=eq.{AUD}"), 1)
    r.check("audit_read_recepcion (ajeno)", r.nrows("recepcion", f"/rest/v1/audit_log?id=eq.{AUD}"), 0)
    call("PATCH", f"/rest/v1/audit_log?id=eq.{AUD}", r.T["asistente"], {"old_data": {"x": 1}})
    st, b = call("GET", f"/rest/v1/audit_log?id=eq.{AUD}&select=old_data", r.T["asistente"])
    r.check("audit_upd_asistente (old_data intacto)", b[0]["old_data"], None)
    call("DELETE", f"/rest/v1/audit_log?id=eq.{AUD}", r.T["asistente"])
    r.check("audit_del_asistente (fila sigue)", r.nrows("asistente", f"/rest/v1/audit_log?id=eq.{AUD}"), 1)

    call("DELETE", f"/rest/v1/presupuesto_items?presupuesto_id=eq.{PRESR}", SVC)
    call("DELETE", f"/rest/v1/presupuestos?id=eq.{PRESR}", SVC)
    call("DELETE", f"/rest/v1/inventario?id=eq.{INVID}", SVC)
    call("DELETE", f"/rest/v1/audit_log?id=eq.{AUD}", SVC)
    call("DELETE", f"/rest/v1/pacientes?id=eq.{PAC}", SVC)
    r.cleanup_users()
    ok = r.report()
    sys.exit(0 if ok else 1)

if __name__ == "__main__":
    main()
