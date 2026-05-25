import sys, requests, time
sys.stdout.reconfigure(encoding='utf-8')
URL = "https://vjbfuscugbbdpwynzecz.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqYmZ1c2N1Z2JiZHB3eW56ZWN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTUzMzkxMywiZXhwIjoyMDkxMTA5OTEzfQ.ScV7FbOY6ZJ-2mwn3_udkxfu5xVY-AGeJItJtZaUIig"
H  = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json", "Prefer": "return=minimal"}

EL = "ELÉCTRICO"
NE = "NEUMÁTICO"
ME = "MECÁNICO"

catalogo = [
  # ELECTRICO
  ("SERVICIO PREVENTIVO",                                                                       EL, 4250),
  ("CAMBIO Y RECONECTAR  RELEY DE CORTE O VELOCIDAD /RELEVADOR)",                              EL, 300),
  ("CAMBIO DE BULBO DE AIRE",                                                                   EL, 300),
  ("CAMBIO PALANCA",                                                                             EL, 300),
  ("CAMBIO CAJA DE CONTACTORES",                                                                EL, 600),
  ("CAMBIO CAJA ELECTRONICA",                                                                   EL, 800),
  ("CAMBIO DE FOCO PILOTO",                                                                     EL, 100),
  ("REPARACION ARNES SENSOR VELOCIDAD",                                                         EL, 150),
  ("CAMBIO DE SENSOR DE VELOCIDAD",                                                             EL, 350),
  ("CAMBIO ARNES CORRIENTE (CAL O) (CAJA CONTACTORES)(BATERIA POSITIVO)",                      EL, 250),
  ("CAMBIO ARNES DE TIERRA (CAL 8) REPARACION DE MAZA NEGATIVO",                              EL, 250),
  ("CAMBIO DE ARNES (7 VIAS)",                                                                  EL, 800),
  ("CAMBIO DE ARNES DE POTENCIA (4 VIAS)",                                                     EL, 350),
  ("CAMBIO DE ARNES TIERRA (DE FRENO A BATERIAS) REP. O FAB. MAZA NEGATIVO",                  EL, 250),
  ("REPARACION DE ARNES DE CONTROL (CAMBIO DE TERMINALES) 4 LINEAS BLOCK CONEXION",           EL, 150),
  ("SISTEMA DE CONTROL COMPLETO CAJA MECANICA",                                                EL, 2000),
  ("FABRICACION LINEAS SENSOR C/CONECTOR",                                                     EL, 150),
  ("SISTEMA DE CONTROL COMPLETO CAJA ELECTRONICA",                                             EL, 2500),
  ("CAMBIO DE INTERRUPTOR",                                                                     EL, 150),
  ("CAMBIO DE BLOCK CONEXIONES",                                                                EL, 400),
  ("REPARACION LINEAS DE TABLERO",                                                              EL, 200),
  ("REPARACION LINEAS DE TABLERO ALIMENTACION O PORT FUSIBLE",                                 EL, 200),
  ("REPARACION ARNES DE 7 VIAS (SIN Realizar cambio completo)",                               EL, 250),
  ("REPARACION CAJA CONTACTORES",                                                               EL, 300),
  ("CAMBIO DE MEGA FUSIBLE O PORTA MEGA FUSIBLE",                                              EL, 200),
  ("INSTALACION DE SISTEMA ELECTRICO COMPLETO",                                                EL, 3000),
  ("REVISION DE CONSUMOS",                                                                      EL, 500),
  # NEUMATICO
  ("INSTALACION SISTEMA NEUMATICO",                                                             NE, 1000),
  ("REPARACION SISTEMA NEUMATICO (BULBO)",                                                      NE, 300),
  ("CAMBIO MANGUERA",                                                                            NE, 250),
  # ESPECIAL (se guarda como ELECTRICO ya que no hay categoria ESPECIAL)
  ("PLATICAS CAPACITACION A CONDUCTORES O TECNICOS (dependera del arreglo al cual se llegue)", EL, 0),
  ("KIT DE LUCES LED",                                                                           EL, 4250),
  # MECANICO
  ("LIMPIEZA DE FRENOS SIN DESARMAR",                                                           ME, 400),
  ("INSTALACION MECANICA O REINSTALACION DE FRENO",                                             ME, 3500),
  ("SOLO BAJAR PURO FRENO",                                                                      ME, 1500),
  ("CAMBIO DE SOPORTE DE CHASIS TIPO L C/U",                                                    ME, 400),
  ("CAMBIO DE ROTOR FRENO INSTALADO C/U",                                                        ME, 600),
  ("MONTAJE DE FRENO (AXIAL) COMPLETO CON KIT DE CONTROL",                                      ME, 6000),
  ("CAMBIO DE SILENTBLOKS",                                                                      ME, 2500),
  ("CAMBIO DE RETEN DE FRENO",                                                                   ME, 700),
  ("CAMBIO O REPARACION DE ARNES INTERIOR (CONEXION)",                                          ME, 500),
  ("BAJAR CARDANES Y DESCONECTAR ARNESES DE FRENO",                                             ME, 750),
  ("MONTAJE DE CARDANES Y ARNESES DE FRENO",                                                     ME, 750),
  ("CAMBIO DE PLACAS LATERALES C/U",                                                             ME, 300),
  ("DESARMADO DE FRENO QUITANDO BOBINAS (SIEMPRE Y CUANDO SALGAN)",                             ME, 1000),
  ("REPARACION DE FRENO (BALEROS, RETENES Y CASQUILLOS, REPARACION ARMADO) SIN BOBINAS",        ME, 2500),
  ("CAMBIO O REPARACION ARNES INTERIOR (CONEXION)",                                             ME, 500),
  ("CAMBIO KIT DE ENGRASE SISTEMA DE LUBRICACION",                                               ME, 570),
  ("CAMBIO DE 1 KIT DE REPARACION DE BOBINA",                                                    ME, 200),
  ("REPARACION DE CUERDA DE FRENO O PLACA LATERAL C/U",                                         ME, 100),
  ("REFRESCO, CUERDAS DE TORNILLOS, DE CRUCETA C/U",                                            ME, 100),
  ("CAMBIO SEGUROS DE CRUCETAS",                                                                  ME, 200),
  ("CAMBIO DE CRUCETA",                                                                           ME, 500),
  ("CAMBIO DE BOBINA C/U",                                                                        ME, 300),
  ("CAMBIO DE PLACA POLAR C/U",                                                                   ME, 200),
  ("CALIBRACION ENTRE HIERRO ROTOR",                                                              ME, 550),
  ("BAJAR Y SUBIR CARDANES LADO DE FRENO CAJA Y DIFERENCIAL",                                    ME, 1500),
  ("CAMBIO TORNILLO PLATO ACOPLE C/U",                                                            ME, 75),
  ("DESINSTALACION FRENO (CON ARNES)",                                                            ME, 2500),
  ("CAMBIO DE TERMINALES",                                                                         ME, 200),
  ("RECONEXION ELECTRICA",                                                                         ME, 200),
  ("SUBIR FRENO",                                                                                  ME, 750),
  ("CAMBIO CORTA CORRIENTE",                                                                       ME, 350),
]

# 1. Borrar todo
del_r = requests.delete(
    f"{URL}/rest/v1/mano_de_obra?id=neq.00000000-0000-0000-0000-000000000000",
    headers=H
)
print(f"DELETE: {del_r.status_code}")

# 2. Insertar en orden
ok = 0
for i, (nombre, categoria, precio) in enumerate(catalogo):
    payload = {"nombre": nombre.strip(), "categoria": categoria, "precio": precio, "activo": True}
    r = requests.post(f"{URL}/rest/v1/mano_de_obra", headers=H, json=payload)
    if r.status_code in (200, 201):
        ok += 1
        print(f"  OK [{i+1:02d}] {nombre[:60]}")
    else:
        print(f"  ERROR [{i+1}] {nombre}: {r.status_code} {r.text[:80]}")
    time.sleep(0.04)

print(f"\nTotal: {ok}/{len(catalogo)}")
