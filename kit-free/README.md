# People Analytics DAX Kit — Free

Diez medidas base para construir un modelo de plantilla, rotación y absentismo en Power BI sin errores de solapamiento temporal.

## Instalación

### Opción rápida: informe incluido

1. Extrae todo el ZIP.
2. Haz doble clic en `PeopleAnalyticsImporter.exe`, situado en la raíz del ZIP.
3. Selecciona o arrastra tu Excel dentro del menú.
4. Revisa el mapeo y pulsa `Generar CSV y abrir Power BI`.

### Opción manual

1. Importa `personas.csv` (40 personas) y `bajas_medicas.csv` (28 episodios).
2. Crea una tabla calendario continua llamada `Calendario` con una columna `Fecha`.
3. Relaciona `Calendario[Fecha]` con ninguna de las fechas de Personas: las medidas aplican el periodo de forma explícita.
4. Relaciona `Personas[PersonaID]` (1) con `BajasMedicas[PersonaID]` (*).
5. Crea las medidas copiando cada bloque de `medidas.dax`.

## Supuestos

- Una fila por persona en `Personas`.
- Una fila por episodio en `BajasMedicas`.
- `FechaBajaEmpresa` vacía significa que la persona sigue activa.
- `FechaFin` vacía significa que el episodio médico sigue abierto.
- La rotación incluida es bajas del periodo / plantilla media diaria. Otras definiciones son posibles, pero deben declararse.

## Advertencia metodológica

`Personas con baja médica` no debe sumarse entre meses: una persona puede aparecer en varios meses si el episodio los atraviesa. Para acumulados únicos usa `Personas con baja médica (únicas)`.

Licencia: CC BY 4.0. Puedes usar y adaptar el material atribuyendo “People Analytics DAX Kit”.

## Qué permite comprobar el dataset

- Episodios que atraviesan dos meses.
- Episodios abiertos sin fecha de fin.
- Personas con más de un episodio.
- Altas y bajas de empresa dentro del periodo.
- Segmentación por departamento, centro, sexo, edad y salario.

## Importador gráfico

`PeopleAnalyticsImporter-Desktop.exe` abre una aplicación de escritorio independiente; no inicia Chrome, Edge, PowerShell ni un servidor web. Permite seleccionar o arrastrar un `.xlsx`, detecta sus hojas y cabeceras y propone un mapeo editable antes de generar los CSV.

Las fechas se normalizan a `YYYY-MM-DD` y el puesto de trabajo se conserva como texto aunque contenga acentos, comas o saltos de línea. Al cerrar la ventana se termina el proceso completo.
