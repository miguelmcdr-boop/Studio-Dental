import json, urllib.request, urllib.error, time

BASE = "http://127.0.0.1:54321"
ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
SVC  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
PW = "TestF6a2026!"
ROLES = ["admin", "dentista", "asistente", "recepcion"]

def call(method, path, token=None, body=None):
    r = urllib.request.Request(BASE + path, method=method)
    r.add_header("apikey", ANON)
    r.add_header("Content-Type", "application/json")
    r.add_header("Prefer", "return=representation")
    if token: r.add_header("Authorization", "Bearer " + token)
    data = json.dumps(body).encode() if body is not None else None
    try:
        with urllib.request.urlopen(r, data) as resp:
            txt = resp.read().decode()
            return resp.status, (json.loads(txt) if txt else None)
    except urllib.error.HTTPError as e:
        txt = e.read().decode()
        try: return e.code, json.loads(txt)
        except Exception: return e.code, txt

class E2ERunner:
    def __init__(self, prefix):
        self.prefix = prefix
        self.SUF = str(int(time.time()))
        self.IDS = {}
        self.T = {}
        self.out = []

    def email(self, r):
        return f"{self.prefix}-{r}-{self.SUF}@studiodental.com"

    def create_users(self):
        for r in ROLES:
            st, b = call("POST", "/auth/v1/admin/users", SVC, {"email": self.email(r), "password": PW,
                "email_confirm": True, "user_metadata": {"role": r}, "app_metadata": {"role": r}})
            if st != 200: raise SystemExit(f"CREATE FALLIDO {r}: {st} {b}")
            self.IDS[r] = b["id"]
        print(">> usuarios creados")

    def login_users(self):
        for r in ROLES:
            st, b = call("POST", "/auth/v1/token?grant_type=password", None,
                         {"email": self.email(r), "password": PW})
            if not b or "access_token" not in b: raise SystemExit(f"LOGIN FALLIDO {r}: {st} {b}")
            self.T[r] = b["access_token"]
        print(">> logins OK")

    def check(self, label, got, exp):
        self.out.append(f"{'PASS' if got == exp else 'FAIL'} | {label}: {got} (esperado {exp})")

    def nrows(self, role, path):
        st, b = call("GET", path, self.T[role])
        return len(b) if isinstance(b, list) else st

    def cleanup_users(self):
        for r in ROLES:
            call("DELETE", f"/rest/v1/profiles?id=eq.{self.IDS[r]}", SVC)
            call("DELETE", f"/auth/v1/admin/users/{self.IDS[r]}", SVC)
        print(">> limpieza de usuarios OK")

    def report(self):
        print("\n".join(self.out))
        fails = [l for l in self.out if l.startswith("FAIL")]
        print(f"\nRESULTADO: {len(self.out)-len(fails)}/{len(self.out)} PASS")
        return len(fails) == 0
