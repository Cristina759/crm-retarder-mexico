"""
Re-siembra mano_de_obra en el orden EXACTO del Excel (tab Mano de Obra).
Lee la columna TGR como precio. Detecta categoria en col A o col B (sin precio).
"""
import openpyxl
import urllib.request, urllib.error, json, sys

EXCEL = r"C:\Users\cfdig\Downloads\COSTOS CRM Henry.xlsx"
URL   = "https://vjbfuscugbbdpwynzecz.supabase.co"
KEY   = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqYmZ1c2N1Z2JiZHB3eW56ZWN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTUzMzkxMywiZXhwIjoyMDkxMTA5OTEzfQ.ScV7FbOY6ZJ-2mwn3_udkxfu5xVY-AGeJItJtZaUIig"

CAT_MAP = {
    "ELECTRICO":        "ELECTRICO",
    "ELECTRICIO":       "ELECTRICO",
    "SISTEMA NEUMATICO":"NEUMATICO",
    "NEUMATICO":        "NEUMATICO",
    "MECANICO":         "MECANICO",
    "OTRO":             "OTRO",
}
# Mapa de categoria label a valor del check constraint de Supabase
CAT_DB = {
    "ELECTRICO":  "ELÉCTRICO",
    "NEUMATICO":  "NEUMÁTICO",
    "MECANICO":   "MECÁNICO",
    "OTRO":       "OTRO",
}

def supabase(method, path, body=None):
    req = urllib.request.Request(
        f"{URL}/rest/v1/{path}",
        data=json.dumps(body).encode() if body else None,
        method=method,
        headers={
            "apikey": KEY, "Authorization": f"Bearer {KEY}",
            "Content-Type": "application/json", "Prefer": "return=minimal"
        }
    )
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

def normalize(s):
    return (s or "").strip().upper()

def match_cat(text):
    t = normalize(text)
    for k, v in CAT_MAP.items():
        if t == k:
            return v
    return None

def read_excel():
    wb = openpyxl.load_workbook(EXCEL, data_only=True)
    ws = wb["Mano de Obra"]
    rows = list(ws.iter_rows(values_only=True))

    # Encontrar fila de encabezado con "TGR"
    tgr_col = None
    header_row = None
    for i, row in enumerate(rows):
        for j, cell in enumerate(row):
            if normalize(cell) == "TGR":
                tgr_col = j
                header_row = i
                break
        if tgr_col is not None:
            break

    # Columna CONCEPTO (usualmente col 1 = B, buscar "CONCEPTO" en header)
    concepto_col = 1
    for j, cell in enumerate(rows[header_row]):
        if "CONCEPTO" in normalize(cell):
            concepto_col = j
            break

    cve_col = 0  # Columna A siempre es CVE / categoria

    print(f"  Header fila {header_row+1}, TGR col {tgr_col+1}, CONCEPTO col {concepto_col+1}")

    items = []
    current_cat = "ELECTRICO"  # primera categoria del Excel

    for i, row in enumerate(rows):
        if i <= header_row:
            continue

        # Valores de cada columna relevante
        cve  = row[cve_col]      if cve_col < len(row) else None
        name = row[concepto_col] if concepto_col < len(row) else None
        precio_raw = row[tgr_col] if tgr_col < len(row) else None

        cve_str  = normalize(cve)
        name_str = normalize(name)
        precio   = None
        if precio_raw is not None:
            try:
                precio = float(precio_raw)
            except:
                pass
        if precio is not None and precio <= 0:
            precio = None

        # 1. Categoria en columna A (CVE): ELECTRICO, MECANICO, OTRO
        cat_a = match_cat(cve_str) if cve_str else None
        if cat_a:
            current_cat = cat_a
            print(f"  [ColA] Categoria: {CAT_DB[current_cat]}")
            continue

        # 2. Categoria en columna B (CONCEPTO) sin precio = encabezado de seccion
        if name_str and not precio:
            cat_b = match_cat(name_str)
            if cat_b:
                current_cat = cat_b
                print(f"  [ColB] Categoria: {CAT_DB[current_cat]}")
                continue

        # 3. Item: necesita nombre y precio
        if not name_str or not precio:
            continue

        items.append({
            "nombre": str(name or "").strip(),
            "categoria": CAT_DB[current_cat],
            "precio": precio
        })

    return items

print("Leyendo Excel...")
items = read_excel()

print(f"\nTotal: {len(items)} items")
# Mostrar resumen por categoria
from collections import Counter
cats = Counter(it["categoria"] for it in items)
for cat, n in cats.items():
    print(f"  {cat}: {n} items")
print("\nPrimeros 5:")
for it in items[:5]:
    print(f"  {it['nombre']} | {it['categoria']} | ${it['precio']}")

print("\nBorrando mano_de_obra existente...")
status, body = supabase("DELETE", "mano_de_obra?id=neq.00000000-0000-0000-0000-000000000000")
print(f"  DELETE -> {status}")

print("\nInsertando en orden exacto del Excel...")
ok = 0
fail = 0
for it in items:
    row = {"nombre": it["nombre"], "categoria": it["categoria"], "precio": it["precio"], "activo": True}
    status, body = supabase("POST", "mano_de_obra", row)
    if status in (200, 201):
        print(f"  OK  {it['categoria']:12} | {it['nombre']}")
        ok += 1
    else:
        print(f"  ERR {it['nombre']}: {status} {body[:120]}")
        fail += 1

print(f"\nListo: {ok} insertados, {fail} errores.")
