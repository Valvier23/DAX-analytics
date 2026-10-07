# Idiomas de la aplicación y del informe

El importador ofrece dos selectores independientes, disponibles antes de cargar Excel:

- **App language / Idioma de la app:** inglés o español para interfaz, mapeo, mensajes y diálogos del importador.
- **Report language / Idioma del informe:** inglés o español para el nuevo informe Power BI.

Ambos comienzan en inglés y guardan la elección localmente. Cambiar el idioma de la app conserva el archivo, las hojas, los mapeos, los colores y el perfil seleccionado. Aplicar un perfil no cambia los idiomas. Durante la generación los selectores se bloquean hasta terminar.

El informe traduce nombres de páginas, títulos, etiquetas de visuales, encabezados de tablas, notas, mensajes calculados y categorías de edad generadas. Incluye las páginas automáticas de Plus. El inglés usa `en-GB` para presentación y meses, manteniendo las unidades monetarias originales.

Se conservan identificadores DAX, contratos CSV, valores de los archivos, nombres de columnas adicionales y nombres de hojas y perfiles. Los nombres técnicos del panel de campos y los archivos auxiliares no se renombran. El idioma de los menús y controles propios de Power BI depende de sus preferencias de aplicación. Los proyectos existentes no se sobrescriben: regenera el informe para cambiar su idioma.

## Generación por código

El JSON de `importer-desktop/generate-report.cjs` admite `"reportLanguage": "en"` o `"reportLanguage": "es"`. Si se omite, genera el informe en inglés. La función compartida `createPowerBiProject` admite el mismo parámetro.

## Validación

Las pruebas de informe comparan ES/EN, conservan las referencias y las consultas de origen, comprueban texto DAX localizado y protegen las etiquetas originales de campos adicionales incluso si coinciden con una entrada del diccionario.

`scripts/verify-importer-languages.cjs` comprueba las cuatro combinaciones en un navegador aislado sin ventana: carga de un perfil real, mapeos manuales, colores, selección de hojas y persistencia tras recarga. No controla la pantalla del usuario ni abre Power BI.

`scripts/verify-packaged-importer.cjs` compara los archivos empaquetados y genera Demo y Plus en los dos idiomas. La validación estructural del informe no sustituye una revisión de su render nativo en Power BI.
