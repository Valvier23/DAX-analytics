# Web de Axzify

Landing estática bilingüe de Axzify / People Analytics DAX Kit. Español es el idioma inicial; English se selecciona sin navegar ni cambiar la URL. La elección y el tema se guardan localmente. Presenta el importador para Windows x64 y los informes Demo y Plus. La demo utiliza datos ficticios: no procesa archivos ni integra Power BI.

## Publicar en GitHub Pages

En Settings → Pages selecciona Deploy from a branch, la rama main y la carpeta /docs. No requiere compilación ni dependencias. El ZIP se descarga desde public/downloads de la rama main mediante una URL absoluta de GitHub, compatible con la publicación de /docs.

## Cuentas de usuario

`cuenta.html` incorpora registro, login, recuperación y consulta del perfil mediante Supabase Auth. Antes de activarlo, seguir [la configuración del servicio](../supabase/README.md): proyecto Free, migración de perfiles, confirmación de email, SMTP y claves públicas. La configuración vacía deshabilita los formularios. El cliente oficial fijado se sirve desde `vendor`; no se almacenan contraseñas en GitHub. Las descargas siguen públicas.

## Editar y probar la landing

Edita los textos de ambos idiomas en `docs/site-copy.js` y la composición en `scripts/build-website.cjs`. Ejecuta `node scripts/build-website.cjs` para regenerar `docs/index.html`, que incluye contenido español aunque JavaScript esté desactivado. La publicación sirve los archivos ya generados y no necesita ejecutar ese comando.

Los estilos están en `docs/site.css` y `docs/theme.css`. `docs/language.js` traduce texto y atributos accesibles dentro de la página; `docs/demo.js` mantiene la vista activa al cambiar idioma. `docs/en.html` conserva los enlaces antiguos mediante una redirección a la raíz con inglés seleccionado.

Pruebas: `node --test tests/web-language.test.cjs tests/web-theme.test.cjs`. `scripts/verify-website.cjs` usa Playwright y Edge sin ventana para comprobar URL, persistencia, demo y ausencia de desbordamiento en móvil y escritorio. No se conecta a sesiones del usuario.

La aplicación React de app/ es una landing independiente. Esta actualización afecta a la web estática de Axzify. Las funciones del roadmap se distinguen del kit actual.
