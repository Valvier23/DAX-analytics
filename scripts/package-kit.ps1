param([string]$Output = "public/downloads/people-analytics-dax-kit-free.zip")

$root = Split-Path -Parent $PSScriptRoot
$destination = Join-Path $root $Output
$importer = Join-Path $root "importer-desktop\dist\PeopleAnalyticsImporter-Desktop.exe"
if (-not (Test-Path -LiteralPath $importer)) {
  throw "No existe el ejecutable portable. Ejecuta 'npm run dist:win' en importer-desktop antes de crear el ZIP."
}

$staging = Join-Path ([System.IO.Path]::GetTempPath()) "people-analytics-kit-package"
if (Test-Path -LiteralPath $staging) { Remove-Item -LiteralPath $staging -Recurse -Force }
New-Item -ItemType Directory -Force -Path $staging | Out-Null
Copy-Item -LiteralPath $importer -Destination (Join-Path $staging "PeopleAnalyticsImporter-Desktop.exe")
Copy-Item -LiteralPath (Join-Path $root "kit-free\medidas.dax") -Destination (Join-Path $staging "medidas.dax")
Copy-Item -LiteralPath (Join-Path $root "kit-free\diccionario-datos.md") -Destination (Join-Path $staging "diccionario-datos.md")
Copy-Item -LiteralPath (Join-Path $root "kit-free\README.md") -Destination (Join-Path $staging "LEEME.md")
Copy-Item -LiteralPath (Join-Path $root "kit-free\datos-ejemplo") -Destination (Join-Path $staging "datos-ejemplo") -Recurse
Copy-Item -LiteralPath (Join-Path $root "kit-free\PowerBI") -Destination (Join-Path $staging "PowerBI") -Recurse

$destinationDirectory = Split-Path -Parent $destination
New-Item -ItemType Directory -Force -Path $destinationDirectory | Out-Null
if (Test-Path -LiteralPath $destination) { Remove-Item -LiteralPath $destination -Force }
Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $destination -CompressionLevel Optimal
Remove-Item -LiteralPath $staging -Recurse -Force
