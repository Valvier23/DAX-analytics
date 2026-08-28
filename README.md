# People Analytics DAX Kit

Kit gratuito para analizar plantilla, altas, bajas, rotación y absentismo en Power BI sin errores de contexto temporal.

## Contenido y uso

El kit incluye diez medidas DAX, un proyecto Power BI de dos páginas, datos de ejemplo, un diccionario de datos y un importador local para Windows.

1. Abre el importador y selecciona o arrastra tu Excel.
2. Revisa el mapeo de Personas y Bajas médicas; puedes guardar perfiles para reutilizarlos.
3. Genera los CSV y abre el proyecto PBIP.

Los campos mínimos son `PersonaID` y `FechaAlta` en Personas, y `EpisodioID`, `PersonaID` y `FechaInicio` en Bajas médicas. Las filas con IDs duplicados, fechas incoherentes o personas inexistentes se excluyen y quedan detalladas en `filas_rechazadas.csv`.

Todo el procesamiento se hace localmente. Los CSV se guardan en `C:\PeopleAnalyticsDaxKit\datos-ejemplo`.

## Desarrollo y distribución

Se necesita Node.js 22.13 o posterior.

- `npm run dev`: inicia la landing.
- `npm test`: prueba la landing.
- `npm run lint`: comprueba estilo y tipos.
- `npm run package:kit`: crea `public/downloads/people-analytics-dax-kit-free.zip`.
- `cd importer-desktop; npm test`: prueba la conversión de Excel.
- `cd importer-desktop; npm run dist:win`: crea el ejecutable portable Windows x64.

Antes de publicar, falta firmar el ejecutable, validarlo visualmente en Windows 10 y 11, comprobar libros de más de 100.000 filas y configurar pago/soporte para la edición Pro.
