import pandas as pd
import json
from zeep import Client, xsd
import os

# ==== Configuración de autenticación y constantes ====
AUTH = {
    'UserName': '2',
    'Password': 'modulo_python',
    'key': '_300.8P',
    'token': '8d4599e29b77ddde52a6cc12ab3a508b'
}
ID_EMPRESA = 1
ID_VERSION_PESV = 1
TABLA = 'empleado'
SOAP_URL = "http://192.168.90.20/WSAdministremos/administremos/wsdl"


# ==== Cliente y header SOAP ====
client = Client(SOAP_URL)

auth_header = xsd.Element(
    '{http://cmd-it.dk/}Auth',
    xsd.ComplexType([
        xsd.Element('{http://cmd-it.dk/}UserName', xsd.String()),
        xsd.Element('{http://cmd-it.dk/}Password', xsd.String()),
        xsd.Element('{http://cmd-it.dk/}key', xsd.String()),
        xsd.Element('{http://cmd-it.dk/}token', xsd.String()),
    ])
)

header_value = auth_header(**AUTH)

paginacion_type = xsd.Element(
    'paginacion',
    xsd.ComplexType([
        xsd.Element('paginaActual', xsd.Int())
    ])
)


# ==== Función para obtener datos paginados ====
def obtener_datos_pagados():
    pagina_actual = 1
    todos_los_datos = []

    while True:
        paginacion = paginacion_type(paginaActual=pagina_actual)
        try:
            response = client.service.getInfoTablasBasicasPaginadas(
                ID_EMPRESA, ID_VERSION_PESV, TABLA, paginacion, _soapheaders=[header_value]
            )
            data = json.loads(response)
            registros = data.get('response', [])

            if not registros:
                print(f"Página {pagina_actual}: sin más datos.")
                break

            todos_los_datos.extend(registros)
            print(f"Página {pagina_actual} procesada: {len(registros)} filas.")
            pagina_actual += 1

        except ValueError as e:
            print(f"❌ Error al procesar JSON en la página {pagina_actual}: {e}")
            print(f"Contenido crudo: {response}")
            break

    return todos_los_datos


# ==== Main: ejecución y procesamiento ====
def main():
    datos = obtener_datos_pagados()
    df = pd.DataFrame(datos)

    if df.empty:
        print("⚠️ No se recuperaron datos.")
        return

    print("\n✅ DataFrame listo:")
    print(df.head())

    # Guardado opcional, descomentar si se requiere
    # try:
    #     df.to_excel('empleados.xlsx', index=False)
    #     print("📁 Archivo guardado exitosamente.")
    # except Exception as e:
    #     print(f"❌ Error al guardar el archivo: {e}")

    print(f"\n📊 Total de registros: {len(df)}")
    print(f"📂 Directorio actual: {os.getcwd()}")


if __name__ == "__main__":
    main()
