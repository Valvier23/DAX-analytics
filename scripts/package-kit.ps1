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

$staging = Join-Path ([System.IO.Path]::GetTempPath()) "people-analytics-kit-package"
if (Test-Path -LiteralPath $staging) { Remove-Item -LiteralPath $staging -Recurse -Force }
New-Item -ItemType Directory -Force -Path $staging | Out-Null
$resources = Join-Path $staging "recursos"
New-Item -ItemType Directory -Force -Path $resources | Out-Null
Copy-Item -LiteralPath $importer -Destination (Join-Path $staging "PeopleAnalyticsImporter-Desktop.exe")
Copy-Item -LiteralPath (Join-Path $root "importer-desktop\Abrir importador desde esta carpeta.cmd") -Destination (Join-Path $resources "Abrir importador desde esta carpeta.cmd")
Copy-Item -LiteralPath (Join-Path $root "kit-free\medidas.dax") -Destination (Join-Path $resources "medidas.dax")
Copy-Item -LiteralPath (Join-Path $root "kit-free\diccionario-datos.md") -Destination (Join-Path $resources "diccionario-datos.md")
Copy-Item -LiteralPath (Join-Path $root "kit-free\README.md") -Destination (Join-Path $resources "LEEME.md")
Copy-Item -LiteralPath (Join-Path $root "kit-free\datos-ejemplo") -Destination (Join-Path $staging "datos-ejemplo") -Recurse
Copy-Item -LiteralPath (Join-Path $root "kit-plus\datos-ejemplo") -Destination (Join-Path $staging "datos-ejemplo-plus") -Recurse

$destinationDirectory = Split-Path -Parent $destination
New-Item -ItemType Directory -Force -Path $destinationDirectory | Out-Null
if (Test-Path -LiteralPath $destination) { Remove-Item -LiteralPath $destination -Force }
Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $destination -CompressionLevel Optimal
Remove-Item -LiteralPath $staging -Recurse -Force
