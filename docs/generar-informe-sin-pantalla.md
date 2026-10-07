# Generar el informe desde PowerShell

El generador local usa el mismo código de conversión y las mismas plantillas que el importador. No carga Electron, no abre Power BI y no cambia una sesión de Desktop que ya esté abierta.

Instala las dependencias del importador si no están disponibles (`npm install --omit=dev` dentro de `importer-desktop`). Desde la raíz del repositorio:

```powershell
node importer-desktop/generate-report.cjs configuracion.json
```

Ejemplo de configuración (ajusta rutas y nombres de cabeceras):

```json
{
  "inputPath": "C:/Informes/personas.xlsx",
  "outputDir": "C:/Informes/resultado",
  "edition": "plus",
  "personasSheet": "Personas",
  "personasMapping": {
    "PersonaID": "ID empleado",
    "FechaAlta": "Fecha ingreso",
    "FechaBajaEmpresa": "Fecha salida",
    "Departamento": "Departamento",
    "PuestoTrabajo": "Puesto",
    "SalarioAnual": "Salario anual"
  },
  "bajasSheet": "Ausencias",
  "bajasMapping": {
    "EpisodioID": "ID episodio",
    "PersonaID": "ID empleado",
    "FechaInicio": "Inicio",
    "FechaFin": "Fin"
  }
}
```

Para archivos sin ausencias, omite `bajasSheet` y usa `bajasMapping: {}`. `edition` admite `plus` y `free` (también `demo` como alias de Free). Los campos adicionales reconocidos se detectan entre las columnas no mapeadas.

El comando devuelve JSON con la ruta `project` y `powerBiOpened: false`. Cada ejecución crea una carpeta PBIP nueva para conservar las definiciones de informes anteriores. Los CSV de `outputDir` se actualizan; usa otra carpeta de salida si necesitas conservar también una instantánea de los datos.

El periodo inicial va desde el 1 de enero hasta la última fecha registrada del mismo año. Es una propuesta; no demuestra que las fuentes estén completas. El informe PBIP necesita cargar los CSV mediante **Actualizar** cuando decidas abrirlo.

## Campos adicionales

Las páginas añadidas conservan el diseño, los filtros sincronizados y el contexto del informe principal. Su tabla incluye todos los campos detectados de la categoría y filtra personas activas al cierre. Son valores actuales del archivo, no un historial de evaluaciones.

Los campos numéricos aceptan punto o coma decimal y espacios. Valores como «Pendiente» quedan en blanco; no se convierten en cero. `perfil_dataset.json` conserva cobertura informada, cobertura válida y número de valores no numéricos. La nota del informe identifica expresamente que esa cobertura corresponde a la importación, sin filtros. No se suman automáticamente escalas de desempeño, clima o satisfacción.

Las tablas largas tienen desplazamiento vertical; muchos campos pueden requerir desplazamiento horizontal. La validación por código comprueba esquema, referencias, límites y generación, pero no certifica el render ni la exportación PDF de estas páginas nuevas.
