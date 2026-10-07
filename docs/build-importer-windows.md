# Compilar el importador en Windows

Compilación verificada con Node 24, pnpm 11.19.0, Electron 37.2.6 y electron-builder 26.0.12.

Desde `importer-desktop`:

```powershell
pnpm install --frozen-lockfile --ignore-scripts
pnpm exec electron-builder --win portable --x64 --config.npmRebuild=false
```

`pnpm-workspace.yaml` usa dependencias aisladas, compatibles con el recolector de electron-builder. Fija `@electron/node-gyp` a la misma versión 10.2.0-electron.1 publicada en el registro, evitando su referencia Git transitiva. El paquete no contiene módulos nativos propios que requieran reconstrucción. electron-builder descarga el runtime Electron durante el empaquetado.

Resultado: `importer-desktop/dist/PeopleAnalyticsImporter-Desktop-next.exe`. Incluye el generador común, el motor de métricas y ambas plantillas PBIP. Compilar no actualiza por sí solo los ZIP de descargas ni publica la web.

## Comprobar sin abrir ventanas

Desde la raíz del repositorio, ejecutar `scripts/verify-packaged-importer.cjs` con el ejecutable de `dist/win-unpacked` en modo `ELECTRON_RUN_AS_NODE=1`. El script compara hashes de módulos y plantillas con sus fuentes y genera Demo y Plus a partir del Excel sintético. Restaurar la variable de entorno al terminar.

La evidencia de esta compilación está en `outputs/compiled-app-verification/packaged-verification.json`: seis módulos comparados, 236 archivos de plantilla, generación de una página Demo y catorce Plus, sin abrir Power BI. También registra la huella SHA-256 del portable y la prueba de integridad del contenedor.

Esta prueba verifica el código incluido en el paquete y sus recursos; no prueba interacción con la interfaz del importador ni el render nativo de los PBIP.
