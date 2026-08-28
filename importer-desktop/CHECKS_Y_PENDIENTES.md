# Control de calidad y pendientes

Este archivo se actualiza en cada versión antes de publicar el ejecutable.

## Checks implementados

- [x] Aplicación de escritorio: no abre Chrome, Edge ni una URL local.
- [x] Cierre forzado del proceso al cerrar la ventana principal.
- [x] Selección manual de `.xlsx` y `.xls`.
- [x] Arrastrar y soltar el Excel dentro de la ventana.
- [x] Lectura de hojas, cabeceras y número de filas.
- [x] Propuesta automática de mapeo mediante sinónimos ES/EN.
- [x] Mapeo manual de campos inconsistentes.
- [x] Validación de campos obligatorios antes de exportar.
- [x] Fechas exportadas siempre como `YYYY-MM-DD`.
- [x] Conversión de fechas Excel, ISO y `DD/MM/YYYY`.
- [x] Puesto de trabajo exportado como texto y protegido si contiene comas, comillas o saltos de línea.
- [x] CSV UTF-8 con BOM para conservar acentos.
- [x] Esquema CSV alineado con el modelo semántico de Power BI.
- [x] Apertura del proyecto PBIP tras generar los datos.
- [x] Prueba automática del núcleo de conversión.

## Checks de compilación de esta versión

- [x] Prueba del núcleo: 2 personas, 1 episodio.
- [x] Fechas Excel, ISO y españolas convertidas a ISO.
- [x] Puesto con coma escapado correctamente.
- [x] Ejecutable portable Windows x64 generado.
- [x] Binario identificado como PE de interfaz gráfica.

## Pendientes

- [ ] Firma digital del ejecutable para evitar el aviso de SmartScreen (requiere certificado de pago).
- [ ] Prueba visual completa en Windows 10 y Windows 11 sobre una máquina real.
- [ ] Añadir un informe descargable de errores de filas concretas.
- [ ] Permitir guardar y reutilizar perfiles de mapeo.
- [ ] Prueba con Excels de más de 100.000 filas.

## Criterio de publicación

No se publica una versión si falla la prueba del núcleo, la compilación de Windows, la validación del proyecto Power BI o la compilación de la web.
