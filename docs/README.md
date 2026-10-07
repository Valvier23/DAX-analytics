# Web de Axzify

Landing estática en español con demo interactiva de ventas, finanzas y operaciones. Los datos son ficticios. No procesa archivos ni genera informes reales de Power BI.

## Publicar en GitHub Pages

1. En el repositorio, abre Settings → Pages.
2. En Build and deployment, elige Deploy from a branch.
3. Selecciona la rama main y la carpeta /docs, y guarda.
4. GitHub mostrará la URL cuando termine el despliegue.

El repositorio es privado: Pages requiere un plan compatible para publicar desde repositorios privados. Si esa opción no está disponible, conecta el repositorio a un proveedor de hosting estático compatible con repositorios privados y selecciona docs como directorio de publicación, sin comando de compilación. No es necesario cambiar la visibilidad del repositorio.

La publicación puede hacer visible la web aunque el código permanezca privado. Comprueba la visibilidad que ofrece el proveedor antes de publicar.

## Editar y probar

La página completa está en docs/index.html, sin dependencias externas ni compilación. Abre el archivo en un navegador o ejecuta python -m http.server 8000 --directory docs desde la raíz del repositorio.

La aplicación original del repositorio y su configuración permanecen intactas. No se incluyen metadatos ni credenciales de ChatGPT Sites.
