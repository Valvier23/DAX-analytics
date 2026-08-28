param([string]$Output = "public/downloads/people-analytics-dax-kit-free.zip")

$root = Split-Path -Parent $PSScriptRoot
$destination = Join-Path $root $Output
$destinationDirectory = Split-Path -Parent $destination
New-Item -ItemType Directory -Force -Path $destinationDirectory | Out-Null
if (Test-Path -LiteralPath $destination) { Remove-Item -LiteralPath $destination -Force }
$items = @(
  (Join-Path $root "kit-free"),
  (Join-Path $root "importer-desktop\main.js"),
  (Join-Path $root "importer-desktop\preload.js"),
  (Join-Path $root "importer-desktop\core.js"),
  (Join-Path $root "importer-desktop\renderer"),
  (Join-Path $root "importer-desktop\package.json"),
  (Join-Path $root "importer-desktop\CHECKS_Y_PENDIENTES.md")
)
Compress-Archive -LiteralPath $items -DestinationPath $destination -CompressionLevel Optimal
