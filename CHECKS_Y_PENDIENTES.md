# Checks y pendientes del proyecto

## Versión actual

- Aplicación de escritorio independiente, sin navegador externo.
- Importación por selector de archivos o arrastrar y soltar.
- Mapeo automático y manual de hojas y cabeceras.
- Fechas normalizadas a `YYYY-MM-DD` antes de crear los CSV.
- Puesto de trabajo conservado como texto y escapado según CSV.
- Modelo Power BI alineado con nueve columnas de Personas.
- Calendario expone `Calendario[Fecha]` en todo el modelo.
- El proceso termina al cerrar la ventana principal.

## Checks antes de publicar

- [x] `npm test` del importador: conversión, fechas y caracteres CSV.
- [x] Compilar el ejecutable portable para Windows x64.
- [x] Verificar que el archivo sea un PE de interfaz gráfica.
- [x] Validar estructura del proyecto PBIP y esquema de sus fuentes CSV.
- [x] Compilar y probar la web: 5/5 pruebas.
- [x] Comprobar integridad y contenido del ZIP descargable.

## Pendientes conocidos

- Firma digital del ejecutable para eliminar el aviso de SmartScreen.
- Prueba visual final en Windows 10 y Windows 11.
- Perfiles de mapeo reutilizables.
- Informe de filas rechazadas y motivo.
