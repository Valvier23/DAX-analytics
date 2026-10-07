# Diccionario de datos

| Tabla | Campo | Tipo | Definición |
|---|---|---|---|
| Personas | PersonaID | Texto | Identificador anónimo único |
| Personas | FechaAlta | Fecha | Primer día en plantilla |
| Personas | FechaBajaEmpresa | Fecha | Primer día fuera de plantilla, excluido del empleo; vacío si sigue activa. Si la fuente usa último día trabajado, convertir al día siguiente |
| Personas | Departamento | Texto | Unidad organizativa |
| Personas | Centro | Texto | Centro de trabajo |
| Personas | Sexo | Texto | Sexo declarado para segmentación |
| Personas | FechaNacimiento | Fecha | Fecha de nacimiento; sintética en ejemplos |
| Personas | SalarioAnual | Decimal | Retribución anual de la instantánea; solo importes positivos informados, sin historia salarial |
| BajasMedicas | EpisodioID | Texto | Identificador único del episodio |
| BajasMedicas | PersonaID | Texto | Clave hacia Personas |
| BajasMedicas | FechaInicio | Fecha | Primer día del episodio |
| BajasMedicas | FechaFin | Fecha | Último día del episodio, incluido; vacío si continúa. Se recorta al empleo y periodo |
| BajasMedicas | TipoBaja | Texto | Contingencia simplificada |

Una fila por persona y por episodio. No se modelan múltiples recontrataciones ni cambios históricos de organización/salario. Campos opcionales: PuestoTrabajo, NivelEducativo, EstadoCivil, NumeroHijos, ModalidadTrabajo, TipoContrato, NivelPuesto, Provincia, Nacionalidad, FechaInicioPuesto y JornadaSemanal. La tasa médica usa días naturales, no horas laborales.

Sexo se conserva como texto; mujeres/brecha usan F/M. Revisar codificación de origen: cobertura significa informado, no validado. Consulta [metodología](../docs/report-methodology.md).
