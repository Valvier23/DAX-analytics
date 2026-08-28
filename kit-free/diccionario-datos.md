# Diccionario de datos

| Tabla | Campo | Tipo | Definición |
|---|---|---|---|
| Personas | PersonaID | Texto | Identificador anónimo único |
| Personas | FechaAlta | Fecha | Primer día en plantilla |
| Personas | FechaBajaEmpresa | Fecha | Último día en la empresa; vacío si sigue activa |
| Personas | Departamento | Texto | Unidad organizativa |
| Personas | Centro | Texto | Centro de trabajo |
| Personas | Sexo | Texto | Sexo declarado para segmentación |
| Personas | FechaNacimiento | Fecha | Fecha de nacimiento sintética |
| Personas | SalarioAnual | Decimal | Retribución fija anual ficticia |
| BajasMedicas | EpisodioID | Texto | Identificador único del episodio |
| BajasMedicas | PersonaID | Texto | Clave hacia Personas |
| BajasMedicas | FechaInicio | Fecha | Primer día del episodio |
| BajasMedicas | FechaFin | Fecha | Último día; vacío si continúa |
| BajasMedicas | TipoBaja | Texto | Contingencia simplificada |
