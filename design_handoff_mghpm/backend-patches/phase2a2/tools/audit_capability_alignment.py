# STATUS: DRAFT — NOT EXECUTED IN CLAUDE DESIGN
"""
Compara, para cada página del panel admin:
  - NAV_ITEM_CAPABILITY   (frontend/src/config/admin/navPermissions.ts)
  - ADMIN_ROUTE_CAPABILITY (frontend/src/config/admin/navPermissions.ts)
  - required_action real de la vista backend (back-mghpm/api/v1/**/views.py)

Uso (desde la raíz de MGHPM-Corecciones):
    python phase2a2/tools/audit_capability_alignment.py            # tabla Markdown
    python phase2a2/tools/audit_capability_alignment.py --json     # JSON

Solo lee archivos. No importa Django ni toca la BD.
Para vistas con required_action dinámico se toma la acción del GET (lectura) salvo que se indique método.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
NAV_TS = ROOT / "frontend/src/config/admin/navPermissions.ts"
API = ROOT / "back-mghpm/api/v1"

# Ruta frontend, clave de menú, clave de ruta, [(archivo backend, clase, método)]
PAGES = [
    ("Tasks",                       "tasks",                      "work-orders",                  [("tasks/views.py", "TaskListCreateView", "GET")]),
    ("Owners",                      "owners",                     "people/owners",                [("people/views.py", "PeopleListView", "GET")]),
    ("Directory",                   "directory",                  "people",                       [("people/views.py", "PeopleDirectoryView", "GET")]),
    ("Maintenance",                 "maintenance",                "work-orders/add",              [("work_orders/views.py", "WorkOrderListCreateView", "GET")]),
    ("Vendors",                     "vendors",                    "people/vendors",               [("work_orders/views.py", "VendorListCreateView", "GET")]),
    ("Dashboard",                   "dashboard",                  "dashboard",                    [("core/views.py", "DashboardSummaryView", "GET")]),
    ("Finance",                     "finances",                   "finance",                      [("reports/views.py", "ReportListCreateView", "GET")]),
    ("Reports",                     "reports",                    "reports",                      [("reports/views.py", "FinancialSummaryView", "GET")]),
    ("Documents",                   "documents",                  "documents",                    [("core/views.py", "DocumentListView", "GET")]),
    ("Identity Verification Review","identityVerificationReview", "identity-verification/review", [("users/identity_views.py", "IdentityVerificationPendingListView", "GET")]),
    ("Edit Payment",                None,                         "payments/:id/edit",            [("billing/views.py", "PaymentDetailView", "PATCH")]),
]


def parse_ts_map(text: str, const_name: str) -> dict[str, str]:
    m = re.search(rf"export const {const_name}[^=]*=\s*\{{(.*?)\n\}}", text, re.S)
    if not m:
        raise SystemExit(f"No se encontró {const_name} en {NAV_TS}")
    out = {}
    for k, v in re.findall(r"""^\s*['"]?([\w:/-]+)['"]?\s*:\s*['"]([^'"]+)['"]""", m.group(1), re.M):
        out[k] = v
    return out


def class_body(src: str, cls: str) -> str | None:
    m = re.search(rf"^class {cls}\b.*?(?=^class |\Z)", src, re.S | re.M)
    return m.group(0) if m else None


def backend_capability(rel: str, cls: str, method: str) -> str:
    path = API / rel
    if not path.exists():
        return f"? ({rel} no existe)"
    body = class_body(path.read_text(encoding="utf-8"), cls)
    if body is None:
        return f"? ({cls} no encontrada)"
    if "IsAdminUser" in body and "required_action" not in body:
        return "IsAdminUser"
    if method != "GET":
        m = re.search(rf"def {method.lower()}\(.*?self\.required_action = ['\"]([^'\"]+)", body, re.S)
        if m:
            return m.group(1)
    m = re.search(r"required_action = ['\"]([^'\"]+)['\"]", body)
    return m.group(1) if m else "? (sin required_action literal)"


def main() -> None:
    ts = NAV_TS.read_text(encoding="utf-8")
    nav = parse_ts_map(ts, "NAV_ITEM_CAPABILITY")
    route = parse_ts_map(ts, "ADMIN_ROUTE_CAPABILITY")
    rows = []
    for label, nav_key, route_key, backends in PAGES:
        menu_cap = nav.get(nav_key, "—") if nav_key else "—"
        route_cap = route.get(route_key, "—")
        back = ", ".join(f"{backend_capability(*b)} [{b[1]}]" for b in backends)
        back_caps = {backend_capability(*b) for b in backends}
        caps = {c for c in (menu_cap, route_cap) if c != "—"} | back_caps
        match = "YES" if len(caps) == 1 and "—" not in (menu_cap, route_cap) else "NO"
        rows.append({"route": f"{label} (/admin/{route_key})", "menu": menu_cap, "route_cap": route_cap, "backend": back, "match": match})

    if "--json" in sys.argv:
        print(json.dumps(rows, ensure_ascii=False, indent=2))
        return
    print("| Route | Menu Capability | Route Capability | Backend Capability | Match |")
    print("|---|---|---|---|---|")
    for r in rows:
        print(f"| {r['route']} | {r['menu']} | {r['route_cap']} | {r['backend']} | {r['match']} |")
    print("\nNota: 'Edit Payment' no tiene <Route> registrada en frontend/src/pages/admin/AdminApp.tsx (ver auditoría 360°).")


if __name__ == "__main__":
    main()
