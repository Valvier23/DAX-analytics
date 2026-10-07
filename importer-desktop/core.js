const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const PERSONAS_FIELDS = ["PersonaID", "FechaAlta", "FechaBajaEmpresa", "Departamento", "PuestoTrabajo", "Centro", "Sexo", "FechaNacimiento", "SalarioAnual", "NivelEducativo", "EstadoCivil", "NumeroHijos", "ModalidadTrabajo", "TipoContrato", "NivelPuesto", "Provincia", "Nacionalidad", "FechaInicioPuesto", "JornadaSemanal"];
const BAJAS_FIELDS = ["EpisodioID", "PersonaID", "FechaInicio", "FechaFin", "TipoBaja"];
const REQUIRED = { personas: ["PersonaID", "FechaAlta"], bajas: ["EpisodioID", "PersonaID", "FechaInicio"] };
const SYNONYMS = { PersonaID:["personaid","persona_id","empleadoid","empleado_id","idpersona","idempleado","employeeid","workerid"], FechaAlta:["fechaalta","fechaingreso","fechacontratacion","hiredate","startdate"], FechaBajaEmpresa:["fechabajaempresa","fechabaja","fechasalida","terminationdate","leavedate","enddate"], Departamento:["departamento","area","unidad","department","team"], PuestoTrabajo:["puestotrabajo","puesto","cargo","posicion","jobtitle","role","rol"], Centro:["centro","centrotrabajo","ubicacion","location","office"], Sexo:["sexo","genero","gender","sex"], FechaNacimiento:["fechanacimiento","nacimiento","birthdate","dateofbirth"], SalarioAnual:["salarioanual","salario","retribucionfija","annualsalary","salary"], NivelEducativo:["niveleducativo","estudios","educacion","educationlevel"], EstadoCivil:["estadocivil","civil","maritalstatus"], NumeroHijos:["numerohijos","hijos","nchildren","children"], ModalidadTrabajo:["modalidadtrabajo","modalidad","trabajohibrido","workmode"], TipoContrato:["tipocontrato","contrato","contracttype"], NivelPuesto:["nivelpuesto","nivel","seniority","joblevel"], Provincia:["provincia","province","region"], Nacionalidad:["nacionalidad","nationality"], FechaInicioPuesto:["fechainiciopuesto","fechapuesto","jobstartdate"], JornadaSemanal:["jornadasemanal","horassemanales","weeklyhours"], EpisodioID:["episodioid","bajaid","ausenciaid","absenceid","leaveid"], FechaInicio:["fechainicio","iniciobaja","startdate","from"], FechaFin:["fechafin","finbaja","enddate","to"], TipoBaja:["tipobaja","tipoausencia","motivo","leavetype","absencetype"] };
const DATE_FIELDS = new Set(["FechaAlta", "FechaBajaEmpresa", "FechaNacimiento", "FechaInicioPuesto", "FechaInicio", "FechaFin"]);
const normalize = (value) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
function guessMapping(headers, fields) { const normalized = headers.map((header) => ({ header, value: normalize(header) })); return Object.fromEntries(fields.map((field) => { const choices = [field, ...(SYNONYMS[field] || [])].map(normalize); const hit = normalized.find((item) => choices.includes(item.value)) || normalized.find((item) => item.value.length >= 8 && choices.some((choice) => choice.length >= 8 && (item.value.includes(choice) || choice.includes(item.value)))); return [field, hit?.header || ""]; })); }
function analyzeWorkbook(filePath) { const workbook = XLSX.readFile(filePath, { cellDates: true }); return { filePath, fileName: path.basename(filePath), sheets: workbook.SheetNames.map((name) => { const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: "", raw: false }); return { name, headers: rows.length ? Object.keys(rows[0]) : [], rowCount: rows.length }; }) }; }
function date(value) { if (value == null || value === "") return ""; if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10); if (typeof value === "number") { const d = XLSX.SSF.parse_date_code(value); if (d) return `${d.y}-${String(d.m).padStart(2,"0")}-${String(d.d).padStart(2,"0")}`; } const text = String(value).trim(); let m = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/); if (m) return `${m[1]}-${m[2].padStart(2,"0")}-${m[3].padStart(2,"0")}`; m = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/); return m ? `${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}` : ""; }
function value(field, raw) { if (DATE_FIELDS.has(field)) return date(raw); if (["SalarioAnual", "NumeroHijos", "JornadaSemanal"].includes(field) && raw !== "" && !Number.isFinite(Number(raw))) return ""; return raw == null ? "" : String(raw).replace(/\r?\n/g, " ").trim(); }
function sourceRows(workbook, sheet, fields, mapping) { if (!sheet || !workbook.Sheets[sheet]) return []; return XLSX.utils.sheet_to_json(workbook.Sheets[sheet], { defval:"", raw:true }).map((raw, i) => ({ line:i + 2, data:Object.fromEntries(fields.map((field) => [field, value(field, mapping[field] ? raw[mapping[field]] : "")])) })); }
function validate(kind, rows, people) { const seen = new Set(), accepted = [], rejected = []; for (const row of rows) { const errors = REQUIRED[kind].filter((field) => !row.data[field]).map((field) => `${field} es obligatorio`); const id = kind === "personas" ? row.data.PersonaID : row.data.EpisodioID; if (id && seen.has(id)) errors.push(`${kind === "personas" ? "PersonaID" : "EpisodioID"} duplicado`); seen.add(id); if (kind === "personas" && row.data.FechaBajaEmpresa && row.data.FechaBajaEmpresa < row.data.FechaAlta) errors.push("La baja de empresa es anterior al alta"); if (kind === "bajas") { if (people && !people.has(row.data.PersonaID)) errors.push("PersonaID no existe en Personas"); if (row.data.FechaFin && row.data.FechaFin < row.data.FechaInicio) errors.push("La fecha fin es anterior a la fecha inicio"); } (errors.length ? rejected : accepted).push(errors.length ? { ...row, reason:errors.join("; ") } : row); } return { accepted, rejected }; }
function escape(value) { const text = String(value ?? ""); return /[";,\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text; }
function writeCsv(file, fields, rows) { fs.writeFileSync(file, `\uFEFF${[fields.join(","), ...rows.map((row) => fields.map((field) => escape(row[field])).join(","))].join("\r\n")}`, "utf8"); }
const INSIGHT_FIELDS = ["InsightID", "Categoria", "Prioridad", "Titulo", "Detalle", "Metrica", "Periodo", "Segmento", "ValorActual", "ValorAnterior", "VariacionPct", "Impacto", "Urgencia", "Confianza", "Recomendacion", "Grafico", "PaginaValidacion"];
const KPI_FIELDS = ["KPIID", "KPI", "Categoria", "Definicion", "ValorActual", "Unidad", "Disponibilidad", "Fuente", "DimensionesSugeridas"];
const percent = (part, total) => total ? Math.round((part / total) * 1000) / 10 : 0;
const month = (dateText) => String(dateText || "").slice(0, 7);
const DYNAMIC_PAGE_RULES = [
  { key:"estructura", title:"Estructura organizativa", category:"Estructura", patterns:["manager","responsable","supervisor","jefe","reporta","teamlead"], numeric:false },
  { key:"talento", title:"Talento y desempeño", category:"Talento", patterns:["desempeno","performance","rendimiento","evaluacion","rating","potencial"], numeric:true },
  { key:"compromiso", title:"Clima y compromiso", category:"Compromiso", patterns:["engagement","clima","enps","satisfaccion","compromiso"], numeric:true },
  { key:"formacion", title:"Desarrollo y formación", category:"Formación", patterns:["formacion","curso","certificacion","learning","capacitacion"], numeric:false },
  { key:"variable", title:"Compensación avanzada", category:"Compensación", patterns:["bonus","variable","incentivo","comision","commission"], numeric:true }
];
function fieldId(header, used) { const base = `Extra_${normalize(header).slice(0, 42) || "campo"}`; let result = base, index = 2; while (used.has(result)) result = `${base}_${index++}`; used.add(result); return result; }
function extraNumber(raw) {
  const text=String(raw ?? '').trim().replace(/\s/g,'').replace(',','.');
  if(!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(text))return null;
  const number=Number(text);return Number.isFinite(number)?number:null;
}
function detectDynamicProfile(workbook, sheet, mapping, accepted) {
  if (!sheet || !workbook.Sheets[sheet]) return { fields:[], pages:[] };
  const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheet], { defval:"", raw:true });
  const headers = rawRows.length ? Object.keys(rawRows[0]) : [];
  const mapped = new Set(Object.values(mapping || {}).filter(Boolean));
  const used = new Set(PERSONAS_FIELDS), fields = [];
  for (const header of headers.filter((item) => !mapped.has(item))) {
    const rule = DYNAMIC_PAGE_RULES.find((item) => item.patterns.some((pattern) => normalize(header).includes(pattern)));
    if (!rule) continue;
    const values = accepted.map((row) => rawRows[row.line - 2]?.[header]).map((item) => String(item ?? "").trim()).filter(Boolean);
    const coverage = accepted.length ? values.length / accepted.length : 0;
    const distinct = new Set(values).size;
    const numericCount=values.filter(item=>extraNumber(item)!==null).length;
    const numericCoverage = values.length ? numericCount / values.length : 0;
    if (coverage < 0.7 || distinct < 2 || (!rule.numeric && distinct > 80) || (rule.numeric && numericCoverage < 0.7)) continue;
    const name = fieldId(header, used);
    const field = { name, source:header, label:header, type:rule.numeric ? "number" : "text", coverage:Math.round(coverage * 100), validCoverage:Math.round((rule.numeric?numericCount:values.length)/accepted.length*100), invalidCount:rule.numeric?values.length-numericCount:0, distinct, pageKey:rule.key, pageTitle:rule.title, category:rule.category };
    fields.push(field);
    accepted.forEach((row) => { const raw = rawRows[row.line - 2]?.[header]; row.data[name] = raw == null ? "" : (rule.numeric ? extraNumber(raw) ?? "" : String(raw).replace(/\r?\n/g, " ").trim()); });
  }
  const pages = DYNAMIC_PAGE_RULES.map((rule) => ({ ...rule, fields:fields.filter((field) => field.pageKey === rule.key) })).filter((page) => page.fields.length);
  return { fields, pages };
}
function generateKpiCatalog(personas, bajas, outputDir) {
  const {calculateMetrics,defaultPeriod}=require('./report-metrics');
  const period=defaultPeriod(personas,bajas), m=calculateMetrics(personas,bajas,period.startDate,period.endDate);
  const scope=period.startDate+' a '+period.endDate+'; instantánea estática, no acredita cobertura completa.';
  const specs=[
    ['KPI-001','Plantilla total','Plantilla',personas.length,'personas','Registros válidos del archivo.'],
    ['KPI-002','Plantilla al cierre','Plantilla',m.close,'personas','Activos en la fecha de cierre.'],
    ['KPI-003','Bajas del periodo','Rotación',m.exits,'personas','Salidas dentro de la ventana.'],
    ['KPI-004','Rotación del periodo','Rotación',m.turnover===null?null:m.turnover*100,'%','Bajas / plantilla media diaria; sin anualizar.'],
    ['KPI-005','Salario anual medio','Compensación',m.salaryMean,'EUR','Salario positivo informado; personas activas al cierre.'],
    ['KPI-006','Cobertura salarial','Calidad',m.salaryCoverage===null?null:m.salaryCoverage*100,'%','Personas con salario válido / plantilla al cierre.'],
    ['KPI-007','Episodios imputables','Ausencia',bajas.length?m.episodes:null,'episodios','Episodios con al menos un día de empleo en la ventana.'],
    ['KPI-008','Días de ausencia','Ausencia',bajas.length?m.absenceDays:null,'días','Días naturales únicos persona/día, limitados al empleo.'],
    ['KPI-009','Tasa de ausencia registrada','Ausencia',bajas.length&&m.absenceRate!==null?m.absenceRate*100:null,'%','Días únicos / exposición persona-día.'],
    ['KPI-010','Plantilla media diaria','Plantilla',m.average,'personas','Exposición persona-día / días del periodo.']
  ];
  const kpis=specs.map(([KPIID,KPI,Categoria,value,Unidad,definition])=>Object.fromEntries(KPI_FIELDS.map(f=>[f,({KPIID,KPI,Categoria,ValorActual:value??'',Unidad,Definicion:definition+' '+scope,Disponibilidad:value===null?'Sin dato':'Disponible',Fuente:'Personas y BajasMedicas',DimensionesSugeridas:'Departamento · PuestoTrabajo · Centro'})[f]??''])));
  const catalogPath=path.join(outputDir,'kpis_detectados.csv');writeCsv(catalogPath,KPI_FIELDS,kpis);return {count:kpis.length,path:catalogPath,rows:kpis};
}
function generateInsights(personas, bajas, outputDir) {
  const {calculateMetrics,defaultPeriod}=require('./report-metrics');
  const period=defaultPeriod(personas,bajas),m=calculateMetrics(personas,bajas,period.startDate,period.endDate);
  const scope=period.startDate+' a '+period.endDate+' · instantánea al importar';
  const rows=[];
  const add=data=>rows.push(Object.fromEntries(INSIGHT_FIELDS.map(f=>[f,({InsightID:'INS-'+String(rows.length+1).padStart(3,'0'),Periodo:scope,Prioridad:'Revisar',Segmento:'Global',PaginaValidacion:'Seleccionar exactamente el periodo indicado; estas filas no responden a filtros.',...data})[f]??''])));
  add({Categoria:'Cobertura',Titulo:'Confirmar la cobertura temporal de las fuentes',Detalle:'La ventana termina en la última fecha registrada; no prueba que los archivos estén completos. Un cero puede indicar falta de registros.',Metrica:'Cobertura de fuente',Recomendacion:'Confirmar con RR. HH. hasta qué fecha están completas las altas, salidas y ausencias antes de interpretar las tasas.'});
  if(m.salaryCoverage!==null&&m.salaryCoverage<1)add({Categoria:'Calidad de datos',Titulo:'Salarios incompletos en la plantilla activa',Detalle:'Se excluyen importes vacíos, no numéricos y no positivos.',Metrica:'Cobertura salarial',ValorActual:m.salaryCoverage*100,Recomendacion:'Completar salarios y revisar jornada antes de comparar remuneración.'});
  const departments=[...new Set(personas.map(p=>p.Departamento).filter(Boolean))];
  const stats=departments.map(name=>({name,...calculateMetrics(personas.filter(p=>p.Departamento===name),bajas,period.startDate,period.endDate)}));
  for(const s of stats.filter(s=>s.average>=20&&s.exits>=3&&m.turnover!==null&&s.turnover>m.turnover).sort((a,b)=>b.turnover-a.turnover).slice(0,3))add({Categoria:'Rotacion',Titulo:'Revisar salidas en '+s.name,Detalle:s.exits+' salidas / '+s.average.toFixed(1)+' personas de media. Comparación descriptiva; no identifica causa.',Metrica:'Rotación del periodo',Segmento:s.name,ValorActual:s.turnover*100,ValorAnterior:m.turnover*100,Recomendacion:'Contrastar puestos y antigüedad de salida con responsables del área; no se conoce el motivo de baja.'});
  for(const s of stats.filter(s=>s.average>=20&&s.affected>=5&&m.absenceRate!==null&&s.absenceRate>m.absenceRate).sort((a,b)=>b.absenceRate-a.absenceRate).slice(0,2))add({Categoria:'Absentismo',Titulo:'Revisar ausencia registrada en '+s.name,Detalle:s.absenceDays+' días únicos / '+s.exposure+' persona-días. '+s.affected+' personas afectadas. Confirmar cobertura.',Metrica:'Tasa de ausencia registrada',Segmento:s.name,ValorActual:s.absenceRate*100,ValorAnterior:m.absenceRate*100,Recomendacion:'Revisar cobertura y evolución de episodios de forma agregada, sin inferir causas médicas individuales.'});
  const insightsPath=path.join(outputDir,'insights.csv');writeCsv(insightsPath,INSIGHT_FIELDS,rows);return {count:rows.length,path:insightsPath,rows};
}
function convertWorkbook({ inputPath, personasSheet, personasMapping, bajasSheet, bajasMapping, outputDir }) { const workbook = XLSX.readFile(inputPath, { cellDates:true }); fs.mkdirSync(outputDir, { recursive:true }); const persons = validate("personas", sourceRows(workbook, personasSheet, PERSONAS_FIELDS, personasMapping)); const profile = detectDynamicProfile(workbook, personasSheet, personasMapping, persons.accepted); const leaves = validate("bajas", sourceRows(workbook, bajasSheet, BAJAS_FIELDS, bajasMapping), new Set(persons.accepted.map((row) => row.data.PersonaID))); const people = persons.accepted.map((row) => row.data), leavesData = leaves.accepted.map((row) => row.data); writeCsv(path.join(outputDir,"personas.csv"), [...PERSONAS_FIELDS, ...profile.fields.map((field) => field.name)], people); writeCsv(path.join(outputDir,"bajas_medicas.csv"), BAJAS_FIELDS, leavesData); fs.writeFileSync(path.join(outputDir, "perfil_dataset.json"), JSON.stringify(profile, null, 2), "utf8"); fs.writeFileSync(path.join(outputDir,'periodo_informe.json'),JSON.stringify(require('./report-metrics').defaultPeriod(people,leavesData),null,2)); const insightResult = generateInsights(people, leavesData, outputDir), kpiResult = generateKpiCatalog(people, leavesData, outputDir); const report = [...persons.rejected.map((row) => ({ Tipo:"Personas", Fila:row.line, Motivo:row.reason })), ...leaves.rejected.map((row) => ({ Tipo:"Bajas médicas", Fila:row.line, Motivo:row.reason }))]; const reportPath = path.join(outputDir,"filas_rechazadas.csv"); writeCsv(reportPath,["Tipo","Fila","Motivo"],report); return { personas:people.length, bajas:leavesData.length, rejected:report.length, insights:insightResult.count, insightsPath:insightResult.path, kpis:kpiResult.count, kpisPath:kpiResult.path, dynamicPages:profile.pages.map((page) => page.title), profilePath:path.join(outputDir, "perfil_dataset.json"), reportPath, outputDir }; }
function normalizeHex(value, fallback) { const hex = String(value || "").trim().replace(/^#/, ""); return /^[0-9a-f]{6}$/i.test(hex) ? `#${hex.toUpperCase()}` : fallback; }
function hexToRgb(hex) { const value = normalizeHex(hex, "#000000").slice(1); return [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16)); }
function rgbToHex(rgb) { return `#${rgb.map((value) => Math.round(Math.max(0, Math.min(255, value))).toString(16).padStart(2, "0")).join("").toUpperCase()}`; }
function mix(color, target, amount) { const source = hexToRgb(color), destination = hexToRgb(target); return rgbToHex(source.map((value, index) => value + (destination[index] - value) * amount)); }
function luminance(color) { const channels = hexToRgb(color).map((value) => { const normalized = value / 255; return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4; }); return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722; }
function contrast(colorA, colorB) { const [light, dark] = [luminance(colorA), luminance(colorB)].sort((a, b) => b - a); return (light + 0.05) / (dark + 0.05); }
function readableInk(primary) { const candidate = mix(primary, "#000000", 0.78); return contrast(candidate, "#FFFFFF") >= 4.5 ? candidate : "#102A43"; }
function createPalette(primaryInput, secondaryInput) {
  const primary = normalizeHex(primaryInput, "#123AA7"), secondary = normalizeHex(secondaryInput, "#3569D4");
  const ink = readableInk(primary), canvas = mix(primary, "#FFFFFF", 0.965), border = mix(primary, "#FFFFFF", 0.84), muted = mix(ink, "#FFFFFF", 0.57);
  return { primary, secondary, primaryDark: mix(primary, "#000000", 0.25), primaryMid: mix(primary, "#FFFFFF", 0.36), primaryLight: mix(primary, "#FFFFFF", 0.72), secondaryDark: mix(secondary, "#000000", 0.2), secondaryLight: mix(secondary, "#FFFFFF", 0.68), accent: mix(primary, secondary, 0.5), accentLight: mix(mix(primary, secondary, 0.5), "#FFFFFF", 0.56), ink, muted, canvas, border, grid: mix(primary, "#FFFFFF", 0.9) };
}
function setThemeValue(theme, path, value) { let target = theme; for (const key of path.slice(0, -1)) target = target?.[key]; if (target) target[path.at(-1)] = value; }
function applyPaletteToTheme(theme, palette) {
  theme.name = `People Analytics · ${palette.primary.slice(1)} / ${palette.secondary.slice(1)}`;
  theme.dataColors = [palette.primary, palette.secondary, palette.primaryMid, palette.secondaryLight, palette.accent, palette.primaryLight, palette.secondaryDark];
  Object.assign(theme, { firstLevelElements: palette.ink, secondLevelElements: palette.muted, thirdLevelElements: palette.grid, fourthLevelElements: palette.border, background: "#FFFFFF", secondaryBackground: palette.canvas, tableAccent: palette.primary });
  setThemeValue(theme, ["visualStyles", "*", "*", "title", 0, "fontColor"], palette.primary);
  setThemeValue(theme, ["visualStyles", "*", "*", "border", 0, "color", "solid", "color"], palette.border);
  setThemeValue(theme, ["visualStyles", "card", "*", "labels", 0, "color"], palette.primary);
  setThemeValue(theme, ["visualStyles", "card", "*", "categoryLabels", 0, "color"], palette.muted);
  setThemeValue(theme, ["visualStyles", "clusteredBarChart", "*", "categoryAxis", 0, "labelColor"], palette.ink);
  setThemeValue(theme, ["visualStyles", "clusteredBarChart", "*", "valueAxis", 0, "labelColor"], palette.muted);
  setThemeValue(theme, ["visualStyles", "clusteredBarChart", "*", "dataPoint", 0, "fill", "solid", "color"], palette.primary);
  setThemeValue(theme, ["visualStyles", "clusteredColumnChart", "*", "categoryAxis", 0, "labelColor"], palette.ink);
  setThemeValue(theme, ["visualStyles", "clusteredColumnChart", "*", "valueAxis", 0, "labelColor"], palette.muted);
  setThemeValue(theme, ["visualStyles", "clusteredColumnChart", "*", "dataPoint", 0, "fill", "solid", "color"], palette.secondary);
  setThemeValue(theme, ["visualStyles", "donutChart", "*", "legend", 0, "labelColor"], palette.ink);
  setThemeValue(theme, ["visualStyles", "donutChart", "*", "labels", 0, "color"], palette.ink);
  return theme;
}
function replacePaletteTokens(value, palette) {
  if (typeof value === "string" && /^'#[0-9a-f]{6}'$/i.test(value)) return "'" + replacePaletteTokens(value.slice(1,-1),palette) + "'";
  if (typeof value === "string") {
    const updated={"#157F73":palette.primary,"#386A9A":palette.secondary,"#16332F":palette.ink,"#526A65":palette.muted,"#F3F6F4":palette.canvas,"#DCE5E0":palette.border,"#EAF1ED":palette.grid};
    if(updated[value.toUpperCase()]) return updated[value.toUpperCase()];
  }
  if (typeof value === "string") return ({ "#123AA7": palette.primary, "#3569D4": palette.secondary, "#6392E6": palette.primaryMid, "#9DBBF1": palette.secondaryLight, "#12A89D": palette.accent, "#F0A22E": palette.accentLight, "#6B7893": palette.muted, "#102A6B": palette.ink, "#566682": palette.muted, "#E9EEF7": palette.grid, "#AAB6CA": palette.border, "#F4F6FA": palette.canvas, "#D8E1F0": palette.border }[value.toUpperCase()] || value);
  if (Array.isArray(value)) return value.map((item) => replacePaletteTokens(item, palette));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replacePaletteTokens(item, palette)]));
  return value;
}
function applyPowerBiPalette(projectDir, colors) {
  const palette = createPalette(colors?.primary, colors?.secondary);
  const reportDir = path.join(projectDir, "People Analytics DAX Kit.Report");
  const themePath = path.join(reportDir, "StaticResources", "SharedResources", "BaseThemes", "CY25SU03.json");
  const theme = applyPaletteToTheme(JSON.parse(fs.readFileSync(themePath, "utf8")), palette);
  fs.writeFileSync(themePath, JSON.stringify(theme), "utf8");
  const pagesDir = path.join(reportDir, "definition", "pages");
  const visit = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? visit(path.join(directory, entry.name)) : [path.join(directory, entry.name)]);
  for (const file of visit(pagesDir).filter((file) => file.endsWith(".json"))) fs.writeFileSync(file, JSON.stringify(replacePaletteTokens(JSON.parse(fs.readFileSync(file, "utf8")), palette)), "utf8");
  return palette;
}
module.exports = { PERSONAS_FIELDS, BAJAS_FIELDS, INSIGHT_FIELDS, KPI_FIELDS, analyzeWorkbook, guessMapping, convertWorkbook, generateInsights, generateKpiCatalog, detectDynamicProfile, createPalette, applyPowerBiPalette };
