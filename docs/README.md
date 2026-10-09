# Web de Axzify

Landing estática bilingüe de Axzify / People Analytics DAX Kit. Español es el idioma inicial; English se selecciona sin navegar ni cambiar la URL. La elección y el tema se guardan localmente. Presenta el importador para Windows x64 y los informes Demo y Plus. La demo utiliza datos ficticios: no procesa archivos ni integra Power BI.

## Publicar en GitHub Pages

En Settings → Pages selecciona Deploy from a branch, la rama main y la carpeta /docs. No requiere compilación ni dependencias. El ZIP se descarga desde public/downloads de la rama main mediante una URL absoluta de GitHub, compatible con la publicación de /docs.

## Cuentas de usuario

`cuenta.html` incorpora registro, login, recuperación y consulta del perfil mediante Supabase Auth. Antes de activarlo, seguir [la configuración del servicio](../supabase/README.md): proyecto Free, migración de perfiles, confirmación de email, SMTP y claves públicas. La configuración vacía deshabilita los formularios. El cliente oficial fijado se sirve desde `vendor`; no se almacenan contraseñas en GitHub. Las descargas siguen públicas.

## Dashboards tras iniciar sesión

Después de validar la sesión con Supabase, `cuenta.html` muestra Resumen, Plantilla y Absentismo. Los filtros de año, departamento y centro se comparten entre vistas; se mantienen idioma y tema. La recuperación de contraseña conserva su formulario y cerrar sesión oculta el panel.

El espacio de análisis incorpora navegación lateral en escritorio y pestañas en móvil, tarjetas con tendencias mensuales y diferencias frente al año natural anterior. Resumen muestra plantilla, movimientos y distribución; Plantilla añade composición por sexo, centros y tabla de departamentos; Absentismo incluye días por mes, ranking por departamento y tasas junto a volúmenes. Seleccionar un departamento en un gráfico o tabla aplica el filtro compartido. Restablecer elimina los filtros de organización y conserva el año.

`dashboard-charts.mjs` dibuja gráficos SVG locales sin dependencias de terceros. Los puntos y barras muestran valores con ratón o teclado; Escape cierra el valor emergente. Los gráficos temporales incluyen una tabla de datos desplegable y eje desde cero. Las comparativas se omiten si el archivo no tiene registros del dominio anteriores al año seleccionado; la existencia de registros no prueba cobertura histórica completa. Las tasas se comparan en puntos porcentuales; los conteos, en diferencia absoluta. Departamento, centro y sexo son atributos de la instantánea del CSV.

Los CSV sintéticos de `docs/data/` son copias de `kit-plus/datos-ejemplo/personas.csv` y `bajas_medicas.csv`. Son recursos públicos de demostración, identificados como datos de ejemplo; no contienen información de la cuenta. Para actualizar la demo, copiar ambos CSV del kit. El cálculo se ejecuta en el navegador mediante `dashboard-core.mjs` y sigue los límites temporales y solapamientos descritos en [la metodología](report-methodology.md). Se selecciona inicialmente el último año de inicio de episodio médico (2025 en estos datos); si no hay episodios, el último año de movimientos laborales. Otros años pueden seleccionarse en el filtro.

Verificar con `node tests/dashboard.test.mjs` y las pruebas web existentes. `tests/dashboard-browser.cjs` comprueba el flujo de login con un proveedor Auth simulado, gráficos, filtros por clic, teclado, Escape, idiomas, temas, las tres vistas a 320/375/1440px, recuperación, sesión no verificada, reintento de CSV y cierre de sesión; requiere Playwright. Las capturas se guardan en la raíz del checkout y no son archivos necesarios para publicar. Se puede seleccionar el ejecutable local con `DASHBOARD_BROWSER_PATH=/usr/bin/chromium`. No sustituye una prueba con las credenciales reales de Supabase.

## Editar la landing

Edita los textos de ambos idiomas en `docs/site-copy.js` y la composición en `scripts/build-website.cjs`. Ejecuta `node scripts/build-website.cjs` para regenerar `docs/index.html`, que incluye contenido español aunque JavaScript esté desactivado. La publicación sirve los archivos ya generados y no necesita ejecutar ese comando.

Los estilos están en `docs/site.css` y `docs/theme.css`. `docs/language.js` traduce texto y atributos accesibles dentro de la página; `docs/demo.js` mantiene la vista activa al cambiar idioma. `docs/en.html` conserva los enlaces antiguos mediante una redirección a la raíz con inglés seleccionado.

Pruebas: `node --test tests/web-language.test.cjs tests/web-theme.test.cjs`. `scripts/verify-website.cjs` usa Playwright y Edge sin ventana para comprobar URL, persistencia, demo y ausencia de desbordamiento en móvil y escritorio. No se conecta a sesiones del usuario.

La aplicación React de app/ es una landing independiente. Esta actualización afecta a la web estática de Axzify. Las funciones del roadmap se distinguen del kit actual.

