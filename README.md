# People Analytics DAX Kit

Producto local para convertir Excel de RR. HH. y analizar plantilla, movimientos, rotación y ausencia médica en Power BI. Free tiene una página; Plus, nueve.

## Uso

1. Abre el importador Windows y selecciona el Excel.
2. Revisa el mapeo de Personas y, opcionalmente, Bajas médicas.
3. Genera los CSV y abre/actualiza el PBIP en Power BI Desktop.
4. Confirma periodo y cobertura de fuentes antes de interpretar tasas.

Los resultados se guardan en `datos-procesados` junto a la distribución: CSV, filas rechazadas, insights, catálogo de KPI, perfil, periodo y proyecto PowerBI. El procesamiento es local; las filas inválidas se excluyen y se registran.

FechaBajaEmpresa es el primer día fuera de plantilla; FechaFin médica sí se incluye. Rotación usa plantilla media diaria, sin anualizar; ausencia cuenta días naturales únicos persona/día limitados al empleo. Salarios y organización son una instantánea.

Consulta [metodología](docs/report-methodology.md), [Free](kit-free/README.md), [Plus](kit-plus/README.md) y [diccionario](kit-free/diccionario-datos.md).

## Desarrollo y distribución

Para generar o revisar PBIP desde PowerShell sin abrir Power BI, consulta [Generar informe sin pantalla](docs/generar-informe-sin-pantalla.md). El mismo módulo genera los proyectos del importador y permite comprobar las páginas adicionales sin Electron.

Node.js 22.13 o posterior. `npm run dev`, `npm test`, `npm run lint` y `npm run build` corresponden a la landing. En `importer-desktop`, `npm test` comprueba conversión y `npm run dist:win` recompila el portable Windows x64. `npm run package:kit` requiere el ejecutable compilado y crea el ZIP Free.

Los cambios fuente no reconstruyen ejecutables ni ZIP anteriores. Recompilar y verificar la distribución antes de publicarla. Firma digital, pruebas Windows y rendimiento con grandes libros siguen siendo comprobaciones de publicación.
