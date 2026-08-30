# Contexto del proyecto — People Analytics DAX Kit

> Documento de orientación para iniciar trabajo en el repositorio. Actualizarlo cuando cambie la arquitectura, el alcance o el flujo de distribución.

## Propósito y alcance actual

**People Analytics DAX Kit** es un producto de People Analytics para Power BI que permite convertir datos de RR. HH. desde Excel a un modelo Power BI preparado para analizar plantilla, movimientos, rotación y absentismo.

El producto se compone de tres piezas:

1. Una landing web para presentar y distribuir el kit gratuito.
2. Un importador de escritorio para Windows que procesa Excel localmente.
3. Plantillas Power BI en formato PBIP, con ediciones Free y Plus.

El procesamiento de los datos es local: no se suben Excel ni CSV a un servicio externo. La landing no requiere una base de datos para su funcionamiento actual.

### Usuarios objetivo

- Profesionales de RR. HH., People Analytics y responsables de negocio.
- Usuarios de Power BI que necesitan métricas temporales correctas de plantilla, bajas y absentismo.

### Lo que ya entrega

- Importación de archivos `.xlsx` o `.xls` mediante selector o arrastrar y soltar.
- Detección de hojas, cabeceras y mapeo inicial basado en sinónimos en español e inglés.
- Mapeo manual y perfiles reutilizables de mapeo.
- Normalización de fechas a `YYYY-MM-DD` y limpieza de campos de texto.
- Validación de datos, exclusión de filas inválidas y generación de `filas_rechazadas.csv` con el motivo.
- Generación de CSV y creación/apertura de un proyecto PBIP con las rutas de fuente actualizadas.
- Personalización de la paleta visual de Power BI desde el importador.
- Edición Free con medidas DAX base y edición Plus con informe ampliado.

### Límites de alcance actuales

- No es todavía una plataforma de análisis automático ni un chat con datos.
- No hay autenticación, cuentas de usuario, pagos, API pública ni backend de datos activo.
- La aplicación de escritorio está dirigida a Windows x64.
- El PBIP se abre en Power BI Desktop instalado en el equipo del usuario.

## Arquitectura

```text
Excel del usuario
    │
    ▼
Importador Electron (Windows, procesamiento local)
    ├─ analiza hojas y propone mapeos
    ├─ valida y normaliza los datos
    ├─ escribe personas.csv, bajas_medicas.csv y filas_rechazadas.csv
    ├─ copia la plantilla PBIP Free o Plus
    ├─ actualiza las fuentes CSV y la paleta
    └─ abre el archivo .pbip en Power BI Desktop

Landing React/Vite ──► descarga el ZIP del kit gratuito
```

La landing y el importador son aplicaciones independientes. El importador incorpora/copia las plantillas Power BI desde `kit-free/PowerBI` o `kit-plus/PowerBI`.

## Estructura del repositorio

| Ruta | Contenido y responsabilidad |
| --- | --- |
| `app/` | Landing: página principal, layout global y estilos. |
| `components/` | Componentes de la landing, incluido el botón de descarga; `components/ui/` contiene componentes de interfaz reutilizables. |
| `public/` | Recursos estáticos y el ZIP distribuible en `public/downloads/`. |
| `importer-desktop/` | Aplicación Electron: importación, mapeo, validación, generación de CSV y apertura de Power BI. |
| `kit-free/` | Kit gratuito: medidas DAX, diccionario, ejemplo de datos y proyecto PBIP de dos páginas. |
| `kit-plus/` | Kit Plus: datos sintéticos y proyecto PBIP de ocho páginas. |
| `scripts/` | Automatizaciones de compilación, generación de datos de ejemplo y empaquetado del ZIP. |
| `tests/` | Pruebas de la landing y su HTML renderizado. |
| `db/`, `drizzle/`, `examples/d1/`, `worker/` | Base preparada para Cloudflare D1/Drizzle, pero sin tablas ni funcionalidad de producto activa. |
| `CHECKS_Y_PENDIENTES.md` | Checklist de publicación y roadmap funcional priorizado. |

No editar manualmente `node_modules/`, `dist/`, `.wrangler/` ni `.sites-runtime/`: son dependencias o artefactos generados.

## Aplicaciones y archivos clave

### Landing web

- `app/page.tsx`: contenido de la landing y propuesta de valor.
- `app/globals.css`: estilos visuales globales.
- `components/kit-download-button.tsx`: interacción de descarga.
- `package.json`: comandos y dependencias de la web.
- `vite.config.ts`: Vite + Vinext + integración Cloudflare; el desarrollo escucha en todas las interfaces y mantiene el estado de Wrangler dentro del proyecto.

La landing usa React 19, TypeScript, Tailwind CSS, Vite/Vinext y Cloudflare Workers. Aunque existen `next` y estructura `app/`, el flujo actual se ejecuta mediante Vite/Vinext, no mediante `next dev`.

### Importador de escritorio

- `importer-desktop/main.js`: proceso principal de Electron, IPC, perfiles, copia de PBIP y apertura de Power BI.
- `importer-desktop/preload.js`: puente seguro entre el renderer y Electron.
- `importer-desktop/core.js`: lógica de negocio comprobable: análisis de Excel, mapeo, validación, CSV y paletas.
- `importer-desktop/renderer/`: HTML, JavaScript y CSS de la interfaz de escritorio.
- `importer-desktop/test-core.js`: pruebas unitarias de la conversión y la paleta.
- `importer-desktop/package.json`: empaquetado portable Windows x64 con Electron Builder.

Al distribuirse, el ejecutable incluye las carpetas Power BI de Free y Plus como recursos. En desarrollo, las obtiene desde `kit-free/PowerBI` y `kit-plus/PowerBI`.

### Plantillas Power BI

- `kit-free/PowerBI/`: PBIP gratuito, modelo semántico y definición del informe ejecutivo.
- `kit-plus/PowerBI/`: PBIP Plus, modelo semántico y definición del informe ampliado.
- `kit-free/medidas.dax`: medidas base reutilizables.
- `kit-free/diccionario-datos.md`: contrato/documentación de campos esperados.
- `*/datos-ejemplo/`: CSV y libro de ejemplo; los datos de Plus son sintéticos.

El modelo tiene tablas `Personas`, `BajasMedicas` y `Calendario`. Las medidas aplican explícitamente el período para evitar errores de contexto temporal y solapamiento de episodios.

La edición Free contiene un informe ejecutivo de una sola página. La edición Plus contiene: Resumen ejecutivo, Plantilla y movimientos, Demografía, Absentismo, Rotación y retención, Compensación, Diversidad y equidad, Centros y departamentos e Insights automáticos.

## Contrato de datos

### Personas

- Obligatorios: `PersonaID`, `FechaAlta`.
- Campos soportados: fechas de alta/baja, departamento, puesto, centro, sexo, nacimiento, salario, educación, estado civil, hijos, modalidad, contrato, nivel, provincia, nacionalidad, inicio de puesto y jornada semanal.
- Una fila representa una persona.
- Una `FechaBajaEmpresa` vacía representa una persona activa.

### Bajas médicas

- Obligatorios: `EpisodioID`, `PersonaID`, `FechaInicio`.
- Campos soportados: `FechaFin` y `TipoBaja`.
- Una fila representa un episodio.
- Una `FechaFin` vacía representa un episodio abierto.

### Validaciones aplicadas

- Campos obligatorios ausentes.
- IDs duplicados.
- Baja de empresa anterior a alta.
- Fecha fin anterior a fecha inicio.
- Episodios cuyo `PersonaID` no existe en Personas.
- Valores no numéricos en los campos numéricos soportados se vacían.

Las filas descartadas no bloquean la conversión: quedan registradas en `filas_rechazadas.csv`.

## Flujo de usuario

1. Descarga el ZIP desde la landing.
2. Abre el importador portable de Windows.
3. Selecciona o arrastra un Excel.
4. Revisa la hoja y el mapeo de Personas y, opcionalmente, Bajas médicas.
5. Guarda o carga un perfil si necesita reutilizar el mapeo.
6. Elige edición (Free o Plus) y, si procede, colores.
7. Genera los CSV; el importador crea/copia el PBIP y actualiza las fuentes.
8. Revisa `filas_rechazadas.csv` y abre/actualiza el informe en Power BI Desktop.

Por defecto los resultados se guardan en la carpeta `datos-ejemplo` del directorio de distribución. El lanzador `.cmd` existe para reducir problemas de espacio en `C:` cuando se usa el portable.

## Desarrollo, verificación y distribución

Requisito: Node.js `>= 22.13.0`.

| Objetivo | Comando |
| --- | --- |
| Desarrollo de landing | `npm run dev` |
| Compilar landing | `npm run build` |
| Pruebas de landing | `npm test` |
| Lint de landing | `npm run lint` |
| Pruebas del importador | `cd importer-desktop; npm test` |
| Generar portable Windows x64 | `cd importer-desktop; npm run dist:win` |
| Crear ZIP Free | `npm run package:kit` |

`npm run package:kit` requiere que exista antes el ejecutable generado en `importer-desktop/dist/PeopleAnalyticsImporter-Desktop-next.exe`. El resultado se publica como `public/downloads/people-analytics-dax-kit-free.zip`.

Antes de cambiar una plantilla PBIP o su modelo, comprobar que el importador siga localizando los nombres y rutas de archivos que actualiza: `Personas.tmdl`, `BajasMedicas.tmdl`, `personas.csv` y `bajas_medicas.csv`.

## Estado actual y prioridades

Consultar `CHECKS_Y_PENDIENTES.md` para el detalle vigente. Pendientes operativos conocidos:

- Firma digital del ejecutable (SmartScreen).
- Prueba visual en Windows 10 y Windows 11.
- Prueba de rendimiento con Excel de más de 100.000 filas.
- Configuración de pago y soporte antes de vender la edición Pro.

El roadmap ya registrado prioriza la evolución hacia un motor de análisis automático: comprensión semántica, perfilado y calidad de datos, detección/ranking de insights, resumen ejecutivo y gráficos automáticos (P0); análisis temporal, anomalías, causas, recomendaciones y priorización (P1); forecasting y modelos predictivos (P2); scores, historial y chat (P3); y benchmarking externo, planes e informes por rol (P4).

**Importante:** ese roadmap es intención de producto; no debe presentarse como funcionalidad existente hasta que esté implementado y probado.

## Convenciones de trabajo

- Mantener el procesamiento de Excel local y preservar la privacidad de los datos de RR. HH.
- Mantener compatibilidad con Windows x64 y con Power BI Desktop.
- Añadir pruebas para cambios en conversión, normalización, validación o generación de archivos.
- Tratar `kit-free` y `kit-plus` como productos relacionados pero con alcance y contenido diferenciados.
- No sustituir medidas temporales por conteos simples sin validar los casos de solapamiento.
- Actualizar este documento, el README y `CHECKS_Y_PENDIENTES.md` cuando se produzca un cambio estructural, de alcance o de distribución.
