param([string]$PortFile,[string]$AdomdPath,[string]$OutputPath="$PSScriptRoot/../outputs/report-review/live-dax-validation.json")
$ErrorActionPreference='Stop'
Get-ChildItem -LiteralPath $AdomdPath -Filter '*.dll' | ForEach-Object { Add-Type -Path $_.FullName }
$port=(Get-Content -LiteralPath $PortFile -Raw -Encoding Unicode).Trim()
$connection=[Microsoft.AnalysisServices.AdomdClient.AdomdConnection]::new("Data Source=localhost:$port")
$connection.Open()
$measures=@('Plantilla al inicio','Plantilla al cierre','Altas del periodo','Bajas del periodo','Cambio neto','Plantilla media diaria','Exposicion persona dias','Rotacion del periodo %','Retencion cohorte inicial %','Días de baja','Personas con baja médica','Episodios de baja médica','Tasa absentismo %','Salario medio','Salario mediano','Coste salarial anual','Cobertura salarial %','Edad media','Antiguedad media','Mujeres %','Brecha salarial %','Cambio rotacion pp','Cambio ausencia pp','Bajas antes de un ano')
$pairs=($measures | ForEach-Object { '"'+$_+'",['+$_+']' }) -join ','
$expected=@(
 @{Year=2025;Month=12;Day=31;Dept='';Close=822;Start=849;Hires=64;Exits=91;Exposure=308916;Absent=1700;Affected=133;Episodes=142;Mass=42923100},
 @{Year=2025;Month=12;Day=31;Dept='Personas';Close=105;Start=115;Hires=6;Exits=16;Exposure=40147;Absent=256;Affected=18;Episodes=20;Mass=5293800},
 @{Year=2025;Month=12;Day=31;Dept='Ventas';Close=106;Start=103;Hires=14;Exits=11;Exposure=39303;Absent=174;Affected=12;Episodes=13;Mass=5303900},
 @{Year=2026;Month=3;Day=31;Dept='';Close=820;Start=822;Hires=0;Exits=2;Exposure=73925;Absent=0;Affected=0;Episodes=0;Mass=42842100},
 @{Year=2026;Month=3;Day=31;Dept='Personas';Close=104;Start=105;Hires=0;Exits=1;Exposure=9402;Absent=0;Affected=0;Episodes=0;Mass=5250900},
 @{Year=2026;Month=3;Day=31;Dept='Ventas';Close=106;Start=106;Hires=0;Exits=0;Exposure=9540;Absent=0;Affected=0;Episodes=0;Mass=5303900}
)
$evidence=@()
$sourcePeople=Import-Csv -LiteralPath "$PSScriptRoot/../kit-plus/datos-ejemplo/personas.csv"
try {
 foreach($case in $expected){
  $filter=if($case.Dept){',TREATAS({"'+$case.Dept+'"},Personas[Departamento])'}else{''}
  $query='EVALUATE CALCULATETABLE(ROW('+$pairs+'),DATESBETWEEN(Calendario[Fecha],DATE('+$case.Year+',1,1),DATE('+$case.Year+','+$case.Month+','+$case.Day+'))'+$filter+')'
  $command=$connection.CreateCommand();$command.CommandText=$query
  $reader=$command.ExecuteReader();$values=@{}
  while($reader.Read()){for($i=0;$i -lt $reader.FieldCount;$i++){$values[$reader.GetName($i).Trim('[',']')]=if($reader.IsDBNull($i)){$null}else{$reader.GetValue($i)}}};$reader.Close()
  $checks=@{'Plantilla al cierre'=$case.Close;'Plantilla al inicio'=$case.Start;'Altas del periodo'=$case.Hires;'Bajas del periodo'=$case.Exits;'Exposicion persona dias'=$case.Exposure;'Días de baja'=$case.Absent;'Personas con baja médica'=$case.Affected;'Episodios de baja médica'=$case.Episodes;'Coste salarial anual'=$case.Mass}
  foreach($key in $checks.Keys){if([math]::Abs([double]$values[$key]-[double]$checks[$key]) -gt 0.000001){throw "Mismatch $($case.Year) $($case.Dept) $key actual=$($values[$key]) expected=$($checks[$key])"}}
  $days=if($case.Year -eq 2025){365}else{90}
  if([math]::Abs($values['Rotacion del periodo %']-($case.Exits/($case.Exposure/$days))) -gt 0.000000001){throw 'Rotación incorrecta'}
  if([math]::Abs($values['Tasa absentismo %']-($case.Absent/$case.Exposure)) -gt 0.000000001){throw 'Ausencia incorrecta'}
  $command.CommandText='EVALUATE CALCULATETABLE(SUMMARIZECOLUMNS(TramosEdad[Tramo],TramosEdad[Desde],TramosEdad[Hasta],"Personas",[Plantilla por tramo de edad]),DATESBETWEEN(Calendario[Fecha],DATE('+$case.Year+',1,1),DATE('+$case.Year+','+$case.Month+','+$case.Day+'))'+$filter+')'
  $reader=$command.ExecuteReader();$bands=@();$sum=0
  $cut=[datetime]::new($case.Year,$case.Month,$case.Day)
  $population=@($sourcePeople | Where-Object { [datetime]$_.FechaAlta -le $cut -and (-not $_.FechaBajaEmpresa -or [datetime]$_.FechaBajaEmpresa -gt $cut) -and (-not $case.Dept -or $_.Departamento -eq $case.Dept) })
  while($reader.Read()){
   $label=$reader.GetString(0);$lower=[int]$reader.GetValue(1);$upper=[int]$reader.GetValue(2);$actual=[int]$reader.GetValue(3);$reference=0
   foreach($person in $population){
    $valid=$person.FechaNacimiento -and [datetime]$person.FechaNacimiento -le $cut
    if(-not $valid){if($lower -eq -1){$reference++};continue}
    $birth=[datetime]$person.FechaNacimiento;$age=$cut.Year-$birth.Year
    if($birth.AddYears($age) -gt $cut){$age--}
    if($lower -ne -1 -and $age -ge $lower -and $age -le $upper){$reference++}
   }
   if($actual -ne $reference){throw "Tramo $label no coincide: $actual / $reference"}
   $sum+=$actual;$bands+=@{band=$label;actual=$actual;expected=$reference}
  };$reader.Close()
  if($sum -ne $case.Close){throw 'Los tramos no reconcilian con la plantilla'}
  $command.CommandText='EVALUATE CALCULATETABLE(ROW("Lectura",[Lectura de calidad]),DATESBETWEEN(Calendario[Fecha],DATE('+$case.Year+',1,1),DATE('+$case.Year+','+$case.Month+','+$case.Day+'))'+$filter+')'
  $reader=$command.ExecuteReader();$quality=if($reader.Read()){$reader.GetString(0)}else{''};$reader.Close();if([string]::IsNullOrWhiteSpace($quality)){throw 'Lectura de calidad vacía'}
  $evidence+=@{year=$case.Year;endMonth=$case.Month;department=$case.Dept;passed=$true;measures=$values;ageBands=$bands;quality=$quality}
 }
 $evidence | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $OutputPath
 Write-Output "6 escenarios nativos DAX, 24 medidas por escenario; 66 comprobaciones numéricas, tramos de edad reconciliados y lectura de calidad: OK. $OutputPath"
} finally { $connection.Close() }
