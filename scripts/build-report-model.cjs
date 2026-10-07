// Rebuild measures, preserving source columns and importer source-replacement contract.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const integer='#,0', decimal='#,0.0', pct='0.0%;-0.0%;0.0%', euro='#,0 "€"';
const m=(name,expr,format=integer,folder='Indicadores')=>`\tmeasure '${name}' =\n${expr.split('\n').map(s=>'\t\t\t'+s).join('\n')}\n\t\tformatString: ${format}\n\t\tdisplayFolder: ${folder}\n\n`;
const active='Personas[FechaAlta] <= Corte && ( ISBLANK ( Personas[FechaBajaEmpresa] ) || Personas[FechaBajaEmpresa] > Corte )';
const atClose=expr=>`VAR Corte = MAX ( Calendario[Fecha] )\nRETURN ${expr}`;
const salaries=`FILTER ( Personas, ${active} && NOT ISBLANK ( Personas[SalarioAnual] ) && Personas[SalarioAnual] > 0 )`;
const validEpisodes=`FILTER ( BajasMedicas,
  VAR Desde = MAX ( Inicio, MAX ( BajasMedicas[FechaInicio], RELATED ( Personas[FechaAlta] ) ) )
  VAR Hasta = MIN ( Fin, MIN ( COALESCE ( BajasMedicas[FechaFin], Fin ), COALESCE ( RELATED ( Personas[FechaBajaEmpresa] ), Fin + 1 ) - 1 ) )
  RETURN Desde <= Hasta )`;
const period='VAR Inicio = MIN ( Calendario[Fecha] )\nVAR Fin = MAX ( Calendario[Fecha] )';
let people='table Personas\n';
people+=m('Plantilla al cierre',atClose(`COALESCE ( COUNTROWS ( FILTER ( Personas, ${active} ) ), 0 )`));
people+=m('Plantilla al inicio',`VAR Corte = MIN ( Calendario[Fecha] ) - 1\nRETURN COALESCE ( COUNTROWS ( FILTER ( Personas, ${active} ) ), 0 )`);
for(const [name,col] of [['Altas del periodo','FechaAlta'],['Bajas del periodo','FechaBajaEmpresa']]) people+=m(name,`${period}\nRETURN COALESCE ( COUNTROWS ( FILTER ( Personas, NOT ISBLANK ( Personas[${col}] ) && Personas[${col}] >= Inicio && Personas[${col}] <= Fin ) ), 0 )`);
people+=m('Dias del periodo',`DATEDIFF ( MIN ( Calendario[Fecha] ), MAX ( Calendario[Fecha] ), DAY ) + 1`);
people+=m('Exposicion persona dias',`${period}\nRETURN COALESCE ( SUMX ( Personas, VAR Desde = MAX ( Inicio, Personas[FechaAlta] ) VAR Hasta = MIN ( Fin, COALESCE ( Personas[FechaBajaEmpresa], Fin + 1 ) - 1 ) RETURN MAX ( 0, INT ( Hasta - Desde ) + 1 ) ), 0 )`);
people+=m('Plantilla media diaria','DIVIDE ( [Exposicion persona dias], [Dias del periodo] )',decimal);
people+=m('Cambio neto','[Altas del periodo] - [Bajas del periodo]','+#,0;-#,0;0');
people+=m('Crecimiento neto %','DIVIDE ( [Cambio neto], [Plantilla al inicio] )',pct);
people+=m('Rotacion del periodo %','DIVIDE ( [Bajas del periodo], [Plantilla media diaria] )',pct);
people+=m('Rotacion anual %','[Rotacion del periodo %]',pct,'Compatibilidad; no anualizada');
people+=m('Retencion cohorte inicial %',`${period}\nVAR Cohorte = FILTER ( Personas, Personas[FechaAlta] < Inicio && ( ISBLANK ( Personas[FechaBajaEmpresa] ) || Personas[FechaBajaEmpresa] >= Inicio ) )\nRETURN DIVIDE ( COUNTROWS ( FILTER ( Cohorte, ISBLANK ( Personas[FechaBajaEmpresa] ) || Personas[FechaBajaEmpresa] > Fin ) ), COUNTROWS ( Cohorte ) )`,pct);
people+=m('Bajas antes de un ano',`${period}\nRETURN COALESCE ( COUNTROWS ( FILTER ( Personas, NOT ISBLANK ( Personas[FechaBajaEmpresa] ) && Personas[FechaBajaEmpresa] >= Inicio && Personas[FechaBajaEmpresa] <= Fin && Personas[FechaBajaEmpresa] < EDATE ( Personas[FechaAlta], 12 ) ) ), 0 )`);
people+=m('Salario medio',atClose(`AVERAGEX ( ${salaries}, Personas[SalarioAnual] )`),euro);
people+=m('Salario mediano',atClose(`MEDIANX ( ${salaries}, Personas[SalarioAnual] )`),euro);
people+=m('Coste salarial anual',atClose(`SUMX ( ${salaries}, Personas[SalarioAnual] )`),euro);
people+=m('Personas con salario',atClose(`COALESCE ( COUNTROWS ( ${salaries} ), 0 )`));
people+=m('Cobertura salarial %','DIVIDE ( [Personas con salario], [Plantilla al cierre] )',pct);
people+=m('Edad media',atClose(`AVERAGEX ( FILTER ( Personas, ${active} && NOT ISBLANK ( Personas[FechaNacimiento] ) && Personas[FechaNacimiento] <= Corte ), VAR Nacimiento = Personas[FechaNacimiento] RETURN YEAR ( Corte ) - YEAR ( Nacimiento ) - IF ( FORMAT ( Corte, "MMdd" ) < FORMAT ( Nacimiento, "MMdd" ), 1, 0 ) )`),decimal);
people+=m('Cobertura nacimiento %',atClose(`DIVIDE ( COUNTROWS ( FILTER ( Personas, ${active} && NOT ISBLANK ( Personas[FechaNacimiento] ) && Personas[FechaNacimiento] <= Corte ) ), [Plantilla al cierre] )`),pct);
people+=m('Lectura de calidad',`VAR Base = [Plantilla al cierre]\nVAR Salarios = Base - [Personas con salario]\nVAR Nacimientos = ROUND ( Base * ( 1 - [Cobertura nacimiento %] ), 0 )\nVAR Sexo = ROUND ( Base * ( 1 - [Cobertura sexo %] ), 0 )\nRETURN IF ( Base = 0, "Sin plantilla en el corte", IF ( Salarios + Nacimientos + Sexo = 0, "Campos analizados completos", "Hay campos por completar" ) )`,'General');
people+=m('Plantilla por tramo de edad',`VAR Corte = MAX ( Calendario[Fecha] )\nVAR Desde = SELECTEDVALUE ( TramosEdad[Desde], 0 )\nVAR Hasta = SELECTEDVALUE ( TramosEdad[Hasta], 999 )\nRETURN COALESCE ( COUNTROWS ( FILTER ( Personas, ${active} && VAR Nacimiento = Personas[FechaNacimiento] VAR Valida = NOT ISBLANK ( Nacimiento ) && Nacimiento <= Corte VAR EdadCorte = YEAR ( Corte ) - YEAR ( Nacimiento ) - IF ( FORMAT ( Corte, "MMdd" ) < FORMAT ( Nacimiento, "MMdd" ), 1, 0 ) RETURN IF ( Desde = -1, NOT Valida, Valida && EdadCorte >= Desde && EdadCorte <= Hasta ) ) ), 0 )`);
people+=m('Antiguedad media',atClose(`AVERAGEX ( FILTER ( Personas, ${active} ), DIVIDE ( DATEDIFF ( Personas[FechaAlta], Corte, DAY ), 365.25 ) )`),decimal);
people+=m('Mujeres en plantilla','CALCULATE ( [Plantilla al cierre], KEEPFILTERS ( Personas[Sexo] = "F" ) )');
people+=m('Mujeres %','DIVIDE ( [Mujeres en plantilla], [Plantilla al cierre] )',pct);
people+=m('Cobertura sexo %',atClose(`DIVIDE ( COUNTROWS ( FILTER ( Personas, ${active} && NOT ISBLANK ( Personas[Sexo] ) && Personas[Sexo] <> "" ) ), [Plantilla al cierre] )`),pct);
people+=m('Representacion mujeres comparable %','IF ( [Plantilla al cierre] >= 10, [Mujeres %] )',pct);
people+=m('Brecha salarial %',`VAR F = CALCULATE ( [Personas con salario], REMOVEFILTERS ( Personas[Sexo] ), Personas[Sexo] = "F" )\nVAR H = CALCULATE ( [Personas con salario], REMOVEFILTERS ( Personas[Sexo] ), Personas[Sexo] = "M" )\nVAR SF = CALCULATE ( [Salario medio], REMOVEFILTERS ( Personas[Sexo] ), Personas[Sexo] = "F" )\nVAR SH = CALCULATE ( [Salario medio], REMOVEFILTERS ( Personas[Sexo] ), Personas[Sexo] = "M" )\nRETURN IF ( F >= 8 && H >= 8, DIVIDE ( SH - SF, SH ) )`,pct);
people+=m('Rotacion anterior %',`${period}\nVAR Dias = INT ( Fin - Inicio ) + 1\nVAR Desde = Inicio - Dias\nVAR Cobertura = MINX ( ALL ( Calendario ), Calendario[Fecha] )\nRETURN IF ( Desde >= Cobertura, CALCULATE ( [Rotacion del periodo %], REMOVEFILTERS ( Calendario ), DATESBETWEEN ( Calendario[Fecha], Desde, Inicio - 1 ) ) )`,pct);
people+=m('Cambio rotacion pp','IF ( NOT ISBLANK ( [Rotacion anterior %] ), ( [Rotacion del periodo %] - [Rotacion anterior %] ) * 100 )','+0.0 "pp";-0.0 "pp";0.0 "pp"');
people+=m('Contexto del periodo',`"PERIODO · " & FORMAT ( MIN ( Calendario[Fecha] ), "dd/MM/yyyy" ) & " — " & FORMAT ( MAX ( Calendario[Fecha] ), "dd/MM/yyyy" ) & "  |  " & IF ( HASONEVALUE ( Personas[Departamento] ), SELECTEDVALUE ( Personas[Departamento] ), "Varios / todos los departamentos" )`,'General');
people+=m('Lectura ejecutiva',`"BALANCE · " & FORMAT ( [Plantilla al inicio], "#,0" ) & " al inicio + " & FORMAT ( [Altas del periodo], "#,0" ) & " altas − " & FORMAT ( [Bajas del periodo], "#,0" ) & " bajas = " & FORMAT ( [Plantilla al cierre], "#,0" ) & " al cierre.  |  Rotación: " & IF ( ISBLANK ( [Rotacion del periodo %] ), "sin base", FORMAT ( [Rotacion del periodo %], "0.0%" ) ) & ". Revisar tasas y tamaño de cada área."`,'General');
let medical='table BajasMedicas\n';
medical+=m('Episodios de baja médica',`${period}\nRETURN IF ( ISEMPTY ( ALL ( BajasMedicas ) ), BLANK (), COALESCE ( COUNTROWS ( ${validEpisodes} ), 0 ) )`);
medical+=m('Personas con baja médica',`${period}\nRETURN IF ( ISEMPTY ( ALL ( BajasMedicas ) ), BLANK (), COALESCE ( COUNTROWS ( SUMMARIZE ( ${validEpisodes}, BajasMedicas[PersonaID] ) ), 0 ) )`);
medical+=m('Días de baja',`${period}
RETURN IF ( ISEMPTY ( ALL ( BajasMedicas ) ), BLANK (),
  COALESCE ( SUMX ( CALENDAR ( Inicio, Fin ),
    VAR Dia = [Date]
    RETURN COALESCE ( CALCULATE ( DISTINCTCOUNT ( BajasMedicas[PersonaID] ),
      FILTER ( BajasMedicas, BajasMedicas[FechaInicio] <= Dia
        && ( ISBLANK ( BajasMedicas[FechaFin] ) || BajasMedicas[FechaFin] >= Dia )
        && RELATED ( Personas[FechaAlta] ) <= Dia
        && ( ISBLANK ( RELATED ( Personas[FechaBajaEmpresa] ) ) || RELATED ( Personas[FechaBajaEmpresa] ) > Dia ) ) ), 0 ) ), 0 ) )`);
medical+=m('Tasa absentismo %','DIVIDE ( [Días de baja], [Exposicion persona dias] )',pct);
medical+=m('Dias baja por persona','DIVIDE ( [Días de baja], [Personas con baja médica] )',decimal);
medical+=m('Ausencia anterior %',`${period}\nVAR Dias = INT ( Fin - Inicio ) + 1\nVAR Desde = Inicio - Dias\nVAR Cobertura = MINX ( ALL ( Calendario ), Calendario[Fecha] )\nRETURN IF ( Desde >= Cobertura, CALCULATE ( [Tasa absentismo %], REMOVEFILTERS ( Calendario ), DATESBETWEEN ( Calendario[Fecha], Desde, Inicio - 1 ) ) )`,pct);
medical+=m('Cambio ausencia pp','IF ( NOT ISBLANK ( [Ausencia anterior %] ), ( [Tasa absentismo %] - [Ausencia anterior %] ) * 100 )','+0.0 "pp";-0.0 "pp";0.0 "pp"');
medical+=m('Ultimo inicio registrado','CALCULATE ( MAX ( BajasMedicas[FechaInicio] ), REMOVEFILTERS ( Calendario ) )','dd/MM/yyyy');
medical+=m('Cobertura de ausencias',`VAR Ultima = CALCULATE ( MAX ( BajasMedicas[FechaInicio] ), REMOVEFILTERS ( Calendario ) )\nRETURN IF ( ISBLANK ( Ultima ), "SIN REGISTROS MÉDICOS · Cobertura no confirmada", "REGISTROS DE AUSENCIA · Última fecha de inicio: " & FORMAT ( Ultima, "dd/MM/yyyy" ) & " · Cobertura temporal no confirmada." )`,'General');
const calendar=`table Calendario
\tcolumn Fecha
\t\tdataType: dateTime
\t\tformatString: dd/MM/yyyy
\t\t\tsourceColumn: [Fecha]
\t\tsummarizeBy: none
\tcolumn Ano = YEAR ( Calendario[Fecha] )
\t\tdataType: int64
\tcolumn Mes = FORMAT ( Calendario[Fecha], "MMM" )
\t\tdataType: string
\t\tsortByColumn: MesNumero
\tcolumn MesNumero = MONTH ( Calendario[Fecha] )
\t\tdataType: int64
\t\tisHidden
\tcolumn AnoMes = FORMAT ( Calendario[Fecha], "yyyy-MM" )
\t\tdataType: string
\tcolumn MesEtiqueta = FORMAT ( Calendario[Fecha], "MMM yy", "es-ES" )
\t\tdataType: string
\t\tsortByColumn: AnoMes
\tpartition Calendario = calculated
\t\tmode: import
\t\tsource =
\t\t\t\tVAR Fechas = FILTER ( UNION ( SELECTCOLUMNS ( Personas, "Dia", Personas[FechaAlta] ), SELECTCOLUMNS ( Personas, "Dia", Personas[FechaBajaEmpresa] ), SELECTCOLUMNS ( BajasMedicas, "Dia", BajasMedicas[FechaInicio] ), SELECTCOLUMNS ( BajasMedicas, "Dia", BajasMedicas[FechaFin] ) ), NOT ISBLANK ( [Dia] ) )
\t\t\t\tVAR Desde = COALESCE ( MINX ( Fechas, [Dia] ), TODAY () )
\t\t\t\tVAR Hasta = MAX ( TODAY (), COALESCE ( MAXX ( Fechas, [Dia] ), TODAY () ) )
\t\t\t\tRETURN SELECTCOLUMNS ( CALENDAR ( Desde, Hasta ), "Fecha", [Date] )
`;
for(const kit of ['kit-free','kit-plus']) {
  const base=path.join(root,kit,'PowerBI','People Analytics DAX Kit.SemanticModel','definition');
  for(const [table,measures] of [['Personas',people],['BajasMedicas',medical]]) {
    const file=path.join(base,'tables',`${table}.tmdl`), old=fs.readFileSync(file,'utf8');
    let columns=old.slice(old.indexOf('\tcolumn '));
    if(table==='Personas') {
      columns=columns.replace(/\tcolumn Edad =[^\n]+/,'\tcolumn Edad = IF ( NOT ISBLANK ( Personas[FechaNacimiento] ), VAR Corte = TODAY () VAR Nacimiento = Personas[FechaNacimiento] RETURN YEAR ( Corte ) - YEAR ( Nacimiento ) - IF ( FORMAT ( Corte, "MMdd" ) < FORMAT ( Nacimiento, "MMdd" ), 1, 0 ) )');
      columns=columns.replace(/\tcolumn 'Antigüedad años' =[^\n]+/,"\tcolumn 'Antigüedad años' = DIVIDE ( DATEDIFF ( Personas[FechaAlta], COALESCE ( Personas[FechaBajaEmpresa], TODAY () ), DAY ), 365.25 )");
      if(!columns.includes("column 'Tramo antiguedad salida'")) columns=columns.replace('\tpartition Personas = m',`\tcolumn 'Tramo antiguedad salida' = IF ( ISBLANK ( Personas[FechaBajaEmpresa] ), BLANK (), VAR Meses = DATEDIFF ( Personas[FechaAlta], Personas[FechaBajaEmpresa], DAY ) / 365.25 RETURN SWITCH ( TRUE (), Meses < 1, "01 · Menos de 1 año", Meses < 3, "02 · 1–2 años", Meses < 5, "03 · 3–4 años", "04 · 5+ años" ) )\n\t\tdataType: string\n\n\tpartition Personas = m`);
    }
    if(table==='Personas') {
      columns=columns.replace(/(\tcolumn (?:Edad|'Tramo edad'|'Antigüedad años'|'Tramo antigüedad') =[^\n]+\n\t\tdataType: [^\n]+)(\n\t\tisHidden)?/g,'$1\n\t\tisHidden');
      columns=columns.replace(/column 'Tramo salarial' = SWITCH \( TRUE \(\),\s*(?:ISBLANK \( Personas\[SalarioAnual\] \) \|\| Personas\[SalarioAnual\] <= 0, "Sin dato",\s*)*/,"column 'Tramo salarial' = SWITCH ( TRUE (), ISBLANK ( Personas[SalarioAnual] ) || Personas[SalarioAnual] <= 0, \"Sin dato\", ");
    }
    fs.writeFileSync(file,measures+columns);
  }
  fs.writeFileSync(path.join(base,'tables','Calendario.tmdl'),calendar.replace('\t\t\tsourceColumn','\t\tsourceColumn'));
  fs.writeFileSync(path.join(base,'tables','TramosEdad.tmdl'),`table TramosEdad\n\tcolumn Tramo\n\t\tdataType: string\n\t\tsourceColumn: [Tramo]\n\t\tsortByColumn: Orden\n\tcolumn Desde\n\t\tdataType: int64\n\t\tsourceColumn: [Desde]\n\t\tisHidden\n\tcolumn Hasta\n\t\tdataType: int64\n\t\tsourceColumn: [Hasta]\n\t\tisHidden\n\tcolumn Orden\n\t\tdataType: int64\n\t\tsourceColumn: [Orden]\n\t\tisHidden\n\tpartition TramosEdad = calculated\n\t\tmode: import\n\t\tsource = DATATABLE ( "Tramo", STRING, "Desde", INTEGER, "Hasta", INTEGER, "Orden", INTEGER, { { "Menos de 30", 0, 29, 1 }, { "30–39", 30, 39, 2 }, { "40–49", 40, 49, 3 }, { "50–59", 50, 59, 4 }, { "60 o más", 60, 999, 5 }, { "Sin dato válido", -1, -1, 6 } } )\n`);
  fs.writeFileSync(path.join(base,'relationships.tmdl'),'relationship BajasMedicas_Personas\n\tfromColumn: BajasMedicas.PersonaID\n\ttoColumn: Personas.PersonaID\n\tfromCardinality: many\n\ttoCardinality: one\n\tcrossFilteringBehavior: oneDirection\n');
}
console.log('Modelos Free y Plus actualizados; ejecución DAX requiere Power BI.');
const manual=[people,medical].flatMap(source=>[...source.matchAll(/\tmeasure '([^']+)' =\n([\s\S]*?)(?=\t\tformatString:)/g)].map(match=>`-- Tabla: ${source.startsWith('table Personas')?'Personas':'BajasMedicas'}\n${match[1]} =\n${match[2].replace(/^\t\t\t/gm,'')}`));
fs.writeFileSync(path.join(root,'kit-free','medidas.dax'),'-- Selección continua MIN–MAX. Calendario desconectado; Personas 1 → * BajasMedicas.\n-- Baja de empresa excluida; fin médico incluido. Salarios: instantánea actual.\n\n'+manual.join('\n'));
