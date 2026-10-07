param([string]$CachePath = (Join-Path $env:TEMP 'axzify-report-schemas.json'))
$ErrorActionPreference='Stop'
$queue=[System.Collections.Generic.Queue[string]]::new()
Get-ChildItem "$PSScriptRoot/../kit-*/PowerBI/*.Report/definition" -Recurse -Filter '*.json' | ForEach-Object {
  $doc=Get-Content -LiteralPath $_.FullName -Raw | ConvertFrom-Json
  if ($doc.'$schema') { $queue.Enqueue($doc.'$schema') }
}
$cache=@{}
while ($queue.Count) {
  $url=$queue.Dequeue()
  if ($cache.ContainsKey($url)) { continue }
  if (([uri]$url).Host -ne 'developer.microsoft.com') { throw "Unexpected schema host: $url" }
  $response=Invoke-WebRequest -Uri $url
  $cache[$url]=($response.Content | ConvertFrom-Json -AsHashtable)
  foreach ($match in [regex]::Matches($response.Content,'"\$ref"\s*:\s*"([^"]+)"')) {
    $ref=$match.Groups[1].Value
    if ($ref.StartsWith('#')) { continue }
    $resolved=[uri]::new([uri]$url,$ref)
    $queue.Enqueue($resolved.GetLeftPart([System.UriPartial]::Query).Split('#')[0])
  }
}
$cache | ConvertTo-Json -Depth 100 | Set-Content -LiteralPath $CachePath
Write-Output "$($cache.Count) schemas cached at $CachePath"
