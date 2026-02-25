import json
import urllib.request
import urllib.parse
import os
import time

PROVINCES = [
    ("06", "Buenos Aires"),
    ("10", "Catamarca"),
    ("14", "Córdoba"),
    ("18", "Corrientes"),
    ("22", "Chaco"),
    ("26", "Chubut"),
    ("30", "Entre Ríos"),
    ("34", "Formosa"),
    ("38", "Jujuy"),
    ("42", "La Pampa"),
    ("46", "La Rioja"),
    ("50", "Mendoza"),
    ("54", "Misiones"),
    ("58", "Neuquén"),
    ("62", "Río Negro"),
    ("66", "Salta"),
    ("70", "San Juan"),
    ("74", "San Luis"),
    ("78", "Santa Cruz"),
    ("82", "Santa Fe"),
    ("86", "Santiago del Estero"),
    ("90", "Tucumán"),
    ("94", "Tierra del Fuego, Antártida e Islas del Atlántico Sur"),
]

data_dir = os.path.join(os.getcwd(), "public", "data")
os.makedirs(data_dir, exist_ok=True)

def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))

# 1. Municipios
municipios_by_province = {}
print("=== Downloading municipios ===")
for prov_id, prov_name in PROVINCES:
    try:
        url = f"https://apis.datos.gob.ar/georef/api/municipios?provincia={urllib.parse.quote(prov_name)}&max=500"
        data = fetch_json(url)
        municipios = sorted(
            [{"id": str(m["id"]), "nombre": m["nombre"]} for m in data.get("municipios", [])],
            key=lambda x: x["nombre"]
        )
        municipios_by_province[prov_id] = municipios
        print(f"  {prov_name}: {len(municipios)}")
    except Exception as e:
        print(f"  ERROR {prov_name}: {e}")
        municipios_by_province[prov_id] = []
    time.sleep(0.3)

with open(os.path.join(data_dir, "municipios.json"), "w", encoding="utf-8") as f:
    json.dump(municipios_by_province, f, ensure_ascii=False)

total_mun = sum(len(v) for v in municipios_by_province.values())
print(f"Total municipios: {total_mun}")

# 2. Localidades
localidades_by_municipio = {}
print("\n=== Downloading localidades ===")
for prov_id, prov_name in PROVINCES:
    try:
        url = f"https://apis.datos.gob.ar/georef/api/localidades?provincia={urllib.parse.quote(prov_name)}&max=5000"
        data = fetch_json(url)
        localidades = data.get("localidades", [])
        for loc in localidades:
            mun = loc.get("municipio", {})
            mun_id = str(mun.get("id", "")) if mun else ""
            if not mun_id:
                continue
            if mun_id not in localidades_by_municipio:
                localidades_by_municipio[mun_id] = []
            localidades_by_municipio[mun_id].append({"id": str(loc["id"]), "nombre": loc["nombre"]})
        print(f"  {prov_name}: {len(localidades)}")
    except Exception as e:
        print(f"  ERROR {prov_name}: {e}")
    time.sleep(0.3)

for mun_id in localidades_by_municipio:
    localidades_by_municipio[mun_id].sort(key=lambda x: x["nombre"])

with open(os.path.join(data_dir, "localidades.json"), "w", encoding="utf-8") as f:
    json.dump(localidades_by_municipio, f, ensure_ascii=False)

total_loc = sum(len(v) for v in localidades_by_municipio.values())
print(f"Total localidades: {total_loc}")
print("\nDone!")
