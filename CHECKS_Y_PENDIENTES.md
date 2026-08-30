# Checks y pendientes del proyecto

## Roadmap de analitica e insights automaticos

### P0 — Imprescindible

- [ ] Comprension semantica automatica del dataset.
- [ ] Perfilado y calidad de datos.
- [-] Identificacion automatica de KPIs, dimensiones y fechas. — Catalogo inicial de KPIs y dimensiones sugeridas; pendiente deteccion generica de fechas y medidas no estandar.
- [ ] Analisis descriptivo inteligente.
- [-] Motor automatico de descubrimiento de insights. (5/5) — Implementacion inicial; revisar y pulir despues.
- [ ] Ranking de insights por relevancia e impacto. (5/5)
- [ ] Executive Summary automatico. (5/5)
- [ ] Graficos seleccionados automaticamente segun el hallazgo. (5/5)

### P1 — Alta prioridad

- [ ] Comparaciones temporales MoM, YoY y tendencias. (5/5)
- [ ] Deteccion automatica de anomalias. (5/5)
- [ ] Contribution analysis. (5/5)
- [ ] Root Cause Analysis automatico. (5/5)
- [ ] Pareto y analisis de concentracion. (4/5)
- [ ] Benchmarking interno entre segmentos. (4/5)
- [ ] Correlaciones y asociaciones entre variables. (4/5)
- [ ] Deteccion de relaciones no obvias. (5/5)
- [ ] Riesgos y oportunidades automaticos. (5/5)
- [ ] Recomendaciones basadas en los hallazgos. (5/5)
- [ ] Priorizacion por Impacto x Urgencia x Confianza. (5/5)
- [ ] Preguntas que los datos no pueden responder. (4/5)
- [ ] Datos adicionales recomendables para recopilar. (4/5)

### P2 — Prioridad media

- [ ] Cuantificacion economica de los hallazgos. (5/5)
- [ ] What-if y simulacion de escenarios. (5/5)
- [ ] Forecasting automatico. (4/5)
- [ ] Deteccion de estacionalidad. (4/5)
- [ ] Deteccion de change-point / structural break. (4/5)
- [ ] Segmentacion y clustering automatico. (4/5)
- [ ] Analisis de cohortes cuando proceda. (4/5)
- [ ] Deteccion automatica de targets predictivos. (3/5)
- [ ] Modelos predictivos automaticos. (4/5)
- [ ] Explicabilidad de modelos y drivers. (4/5)

### P3 — Evolucion

- [ ] Business Health Score (0-100). (3/5)
- [ ] Data Quality Score. (3/5)
- [ ] Opportunity Score. (4/5)
- [ ] Nivel de confianza de cada conclusion. (4/5)
- [ ] Comparacion entre diferentes ejecuciones del dataset. (5/5)
- [ ] Seguimiento de riesgos e insights en el tiempo. (4/5)
- [ ] Chat interactivo con los datos y el analisis. (5/5)

### P4 — Futuro

- [ ] Benchmarking con datos externos o sectoriales. (5/5)
- [ ] Generacion automatica de plan de 30/60/90 dias. (3/5)
- [ ] Generacion de presentacion para direccion. (4/5)
- [ ] Informe especifico para CEO, CFO, RR. HH. y otros perfiles. (4/5)

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
- [x] Perfiles de mapeo reutilizables.
- [x] Informe de filas rechazadas y motivo.
- [ ] Prueba de rendimiento con Excels de más de 100.000 filas.
- [ ] Configuración de pago y soporte antes de comercializar la versión Pro.
