# People Analytics DAX Kit — Free

Informe de una página: plantilla, balance, rotación y ausencia registrada, con evolución y comparación por departamento.

## Uso

Selecciona el Excel y la edición Free en el importador, revisa el mapeo y genera el PBIP. Abre y actualiza en Power BI Desktop. Confirma el periodo y la cobertura con RR. HH. El importador propone desde el 1 de enero hasta la última fecha registrada; no acredita integridad de la fuente.

## Instalación manual

Reutiliza preferentemente el PBIP y ajusta rutas CSV en Power Query. Contiene Personas (1) → BajasMedicas (*) en dirección única, Calendario desconectado y tabla auxiliar TramosEdad desconectada.

`medidas.dax` contiene medidas generadas desde el mismo modelo, con su tabla indicada; ya no son solo diez. Copiarlas requiere conservar nombres, relación, Calendario y TramosEdad. La definición auxiliar está en `PowerBI/People Analytics DAX Kit.SemanticModel/definition/tables/TramosEdad.tmdl`. No basta con copiar fórmulas sin dependencias.

## Convenciones

- Alta incluida y baja de empresa excluida: primer día fuera de plantilla.
- Inicio y fin médicos incluidos; fin vacío significa episodio abierto.
- Rotación = bajas / plantilla media diaria, sin anualizar.
- Ausencia = días naturales únicos persona/día / exposición persona/día, limitada al empleo.
- Personas y episodios cuentan solo si aportan días imputables; personas únicas no se suman entre meses.
- Salarios positivos informados de activos al cierre; organización y salarios del archivo actual, sin historia.

Un cero médico no confirma cobertura completa; sin registros médicos globales se presenta sin dato. Consulta [metodología](../docs/report-methodology.md) y [diccionario](diccionario-datos.md).

El ejemplo contiene 40 personas y 28 episodios. Los binarios/ZIP anteriores requieren recompilación para incorporar cambios fuente. Licencia del material: CC BY 4.0, atribución “People Analytics DAX Kit”.
