# Metodología del informe People Analytics

## Población y cortes

Una fila por persona representa un único intervalo de empleo. Activo en día d: FechaAlta ≤ d y FechaBajaEmpresa vacía o > d. Baja de empresa es el primer día fuera de plantilla. Si la fuente entrega el último día trabajado, convertirlo al día siguiente antes de importar. No se representan múltiples recontrataciones.

Plantilla inicial = activos el día anterior al inicio; cierre = activos en la última fecha. Altas y bajas cuentan fechas dentro de la ventana inclusiva. Inicio + altas − bajas = cierre bajo ese contrato.

Calendario deriva de las fechas registradas y se extiende al menos hasta la actualización. Su existencia no acredita cobertura. Las medidas usan intervalo continuo MIN–MAX; no interpretar selecciones discontinuas como exclusión de días intermedios. El importador propone desde el 1 de enero del año de última fecha registrada hasta esa fecha y guarda la ventana para informe y diagnóstico. Confirmarla con RR. HH.

## Indicadores

| Indicador | Definición |
|---|---|
| Exposición persona/día | Suma de días activos dentro del periodo |
| Plantilla media diaria | Exposición / días naturales del periodo |
| Cambio neto | Altas − bajas |
| Crecimiento neto | Cambio neto / plantilla inicial |
| Rotación | Bajas / plantilla media diaria, sin anualizar |
| Retención de cohorte inicial | Activos iniciales que siguen al cierre / cohorte inicial |
| Salidas antes de un año | Salidas del periodo anteriores al primer aniversario |
| Días médicos | Días naturales únicos persona/día intersectados con empleo, episodio y periodo |
| Personas/episodios médicos | Únicos con al menos un día imputable |
| Tasa de ausencia registrada | Días médicos únicos / exposición |
| Días de baja por persona | Días únicos / afectados; no duración media de episodio |

Inicio y fin médicos inclusivos. Fin vacío: episodio abierto hasta corte o salida laboral. Solapamientos de la misma persona no duplican días. Personas únicas no son aditivas entre meses. No se calculan horas perdidas ni días laborales ajustados por jornada.

Comparaciones: ventana inmediatamente anterior de igual número de días; no necesariamente el mismo año/mes. Quedan en blanco si no existe calendario suficiente. Diferencias en puntos porcentuales. La existencia de calendario no confirma integridad de las fuentes.

## Compensación, perfil y diversidad

Salarios: positivos numéricos informados de activos al cierre. Media, mediana y masa anualizada excluyen blancos, ceros y negativos. Cobertura = activos con salario válido / activos. Masa anualizada no es gasto devengado del periodo.

Salario, departamento, puesto, centro y nivel son la instantánea del archivo actual. Un corte anterior cambia población; no reconstruye importes ni organización históricos.

Edad en años cumplidos al cierre, excluyendo nacimiento ausente/futuro. TramosEdad es auxiliar desconectada; incluye dato no válido. Antigüedad media = días desde alta al cierre / 365,25. Columnas antiguas a actualización están ocultas.

Brecha descriptiva = (media H − media M) / media H, dentro del contexto seleccionado retirando filtro de sexo. Mínimo ocho salarios válidos F y ocho M. Positiva: media H mayor; negativa: media F mayor. Sin ajuste por jornada/nivel: no prueba discriminación ni causalidad.

Mujeres % = activas F / plantilla total, incluidos campos sexo vacíos en denominador. Cobertura sexo mide campo informado, no validez de codificación. Comparación por área en blanco con menos de diez personas. Mínimos 8/10 son reglas del producto, no confianza estadística ni garantía de anonimato.

## Cobertura y decisiones

Sin registros médicos globales: sin dato. Con registros globales, cero en ventana/segmento significa ningún día imputable encontrado; no acredita ausencia real ni fuente completa. Último inicio registrado orienta revisión pero no certifica cierre. Confirmar integridad de altas, salidas y episodios con RR. HH.

Calidad mide campos presentes/válidos según reglas; no exactitud de origen. Sin motivo de salida no se distingue rotación voluntaria. Revisar tasas junto a volumen y población; ninguna señal prueba causa o riesgo individual.

Página Calidad y prioridades responde a filtros. `insights.csv` y `kpis_detectados.csv` son instantáneas estáticas con ventana explícita. Reconciliar usando idéntico periodo/segmento. No son predicción ni diagnóstico causal.

Las páginas adicionales detectadas al importar muestran todos los campos de su categoría sobre personas activas al cierre, con los mismos filtros de periodo y organización. Los valores adicionales son una instantánea actual. Su cobertura informada/válida se calcula al importar y se identifica como estática; no responde a los filtros. Los textos no numéricos de campos clasificados como numéricos quedan en blanco y se contabilizan en el perfil de importación. No se suman automáticamente escalas de evaluación o satisfacción. Su estructura y filtros se han validado por código; la ejecución nativa de las nuevas páginas requiere comprobación separada.

## Modelo, manual y evidencia

Free tiene una página. Plus nueve: Resumen ejecutivo, Plantilla y movimientos, Perfil de plantilla, Ausencia médica, Rotación y retención, Compensación, Composición y diversidad, Centros y departamentos, Calidad y prioridades.

Personas (1) filtra BajasMedicas (*) en una dirección. Calendario y TramosEdad desconectados. `kit-free/medidas.dax` se genera de las mismas medidas; uso manual requiere tablas, columnas y relación. Se recomienda reutilizar PBIP y ajustar rutas CSV.

`outputs/report-review/live-dax-validation.json` registra ejecución nativa mediante ADOMD en seis contextos: 2025 y primer trimestre 2026, global/Personas/Ventas. Incluye 24 medidas por contexto y 66 comprobaciones numéricas del script; seis tramos de edad por contexto coinciden con el cálculo independiente sobre CSV y suman la plantilla al cierre. Lectura de calidad se ejecutó y devuelve texto no vacío. La validación sustenta el contrato funcional comprobado; no cubre cualquier entrada ni sustituye la revisión visual o la verificación de los binarios distribuidos.

Cambiar fuentes PBIP/importador no reconstruye ejecutables ni ZIP publicados. Recompilar, empaquetar y verificar el distribuible antes de afirmar que incorpora mejoras.
