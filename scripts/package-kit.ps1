param([string]$Output = "public/downloads/people-analytics-dax-kit-free.zip")

$root = Split-Path -Parent $PSScriptRoot
$destination = Join-Path $root $Output
$importer = Join-Path $root "importer-desktop\dist\PeopleAnalyticsImporter-Desktop-next.exe"
if (-not (Test-Path -LiteralPath $importer)) {
  $importer = Join-Path $root "importer-desktop\dist\PeopleAnalyticsImporter-Desktop-combinedfilter.exe"
}
if (-not (Test-Path -LiteralPath $importer)) {
  $importer = Join-Path $root "importer-desktop\dist\PeopleAnalyticsImporter-Desktop-layout.exe"
}
if (-not (Test-Path -LiteralPath $importer)) {
  $importer = Join-Path $root "importer-desktop\dist\PeopleAnalyticsImporter-Desktop-final.exe"
}
if (-not (Test-Path -LiteralPath $importer)) {
  $importer = Join-Path $root "importer-desktop\dist\PeopleAnalyticsImporter-Desktop-web.exe"
}
if (-not (Test-Path -LiteralPath $importer)) {
  $importer = Join-Path $root "importer-desktop\dist\PeopleAnalyticsImporter-Desktop-updated2.exe"
}
if (-not (Test-Path -LiteralPath $importer)) {
  $importer = Join-Path $root "importer-desktop\dist\PeopleAnalyticsImporter-Desktop-updated.exe"
}
if (-not (Test-Path -LiteralPath $importer)) {
  throw "No existe el ejecutable portable. Ejecuta 'npm run dist:win' en importer-desktop antes de crear el ZIP."
}

$exeHash=(Get-FileHash -LiteralPath $importer -Algorithm SHA256).Hash
$evidence=Get-Content -LiteralPath (Join-Path $root 'outputs/compiled-app-verification/packaged-verification.json') -Raw | ConvertFrom-Json
if(-not $evidence.passed -or $evidence.executableSha256 -ne $exeHash){throw 'El ejecutable no coincide con la compilación verificada.'}
$tempRoot=[IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd('\','/')
$staging = Join-Path $tempRoot ('axzify-release-'+[guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force -Path $staging | Out-Null
$resources = Join-Path $staging "recursos"
New-Item -ItemType Directory -Force -Path $resources | Out-Null
Copy-Item -LiteralPath $importer -Destination (Join-Path $staging "PeopleAnalyticsImporter-Desktop.exe")
Copy-Item -LiteralPath (Join-Path $root "importer-desktop\Abrir importador desde esta carpeta.cmd") -Destination (Join-Path $resources "Abrir importador desde esta carpeta.cmd")
Copy-Item -LiteralPath (Join-Path $root "kit-free\medidas.dax") -Destination (Join-Path $resources "medidas.dax")
Copy-Item -LiteralPath (Join-Path $root "kit-free\diccionario-datos.md") -Destination (Join-Path $resources "diccionario-datos.md")
Copy-Item -LiteralPath (Join-Path $root "kit-free\README.md") -Destination (Join-Path $resources "LEEME.md")
Copy-Item -LiteralPath (Join-Path $root 'docs/report-methodology.md') -Destination (Join-Path $resources 'Metodologia.md')
Set-Content -LiteralPath (Join-Path $staging 'SHA256SUMS.txt') -Value "$exeHash  PeopleAnalyticsImporter-Desktop.exe"
Set-Content -LiteralPath (Join-Path $staging 'LEEME.txt') -Value @('People Analytics — actualización del 7 de octubre de 2026','','Extrae todo el ZIP y abre PeopleAnalyticsImporter-Desktop.exe.','Selecciona tu Excel, revisa el mapeo y elige Demo o Plus.','Demo: una página. Plus: nueve páginas principales y páginas adicionales según los campos detectados.','Requiere Power BI Desktop instalado. Pulsa Actualizar si el informe necesita cargar los CSV.','Los ejemplos incluidos son sintéticos. El procesamiento es local.','Consulta recursos/Metodologia.md antes de interpretar las tasas y comparaciones.')
Copy-Item -LiteralPath (Join-Path $root "kit-free\datos-ejemplo") -Destination (Join-Path $staging "datos-ejemplo") -Recurse
Copy-Item -LiteralPath (Join-Path $root "kit-plus\datos-ejemplo") -Destination (Join-Path $staging "datos-ejemplo-plus") -Recurse

$destinationDirectory = Split-Path -Parent $destination
New-Item -ItemType Directory -Force -Path $destinationDirectory | Out-Null
if (Test-Path -LiteralPath $destination) { Remove-Item -LiteralPath $destination -Force }
Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $destination -CompressionLevel Optimal
$resolvedStage=[IO.Path]::GetFullPath($staging)
if(-not $resolvedStage.StartsWith($tempRoot+[IO.Path]::DirectorySeparatorChar) -or -not (Split-Path -Leaf $resolvedStage).StartsWith('axzify-release-')){throw 'Ruta temporal inesperada.'}
Remove-Item -LiteralPath $resolvedStage -Recurse -Force
