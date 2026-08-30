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
const percent = (part, total) => total ? Math.round((part / total) * 1000) / 10 : 0;
const month = (dateText) => String(dateText || "").slice(0, 7);
function generateInsights(personas, bajas, outputDir) {
  const insights = [];
  const validationPage = { Rotacion:"Rotacion y retencion: filtrar Departamento", Absentismo:"Absentismo: filtrar Departamento", "Equidad salarial":"Compensacion: filtrar PuestoTrabajo y usar la fila del puesto, no la tarjeta total", Concentracion:"Plantilla y Centros: filtrar Departamento", "Calidad de datos":"Revisar datos-procesados", Cobertura:"Insights automaticos" };
  const add = (data) => insights.push(Object.fromEntries(INSIGHT_FIELDS.map((field) => [field, field === "PaginaValidacion" ? (data[field] || validationPage[data.Categoria] || "Resumen ejecutivo") : (data[field] ?? "")] )));
  const addInsight = (data) => add({ InsightID:`INS-${String(insights.length + 1).padStart(3, "0")}`, ...data });
  const incomplete = personas.filter((row) => !row.Departamento || !row.Centro || !row.Sexo).length;
  if (personas.length && incomplete / personas.length >= 0.15) {
    const rate = percent(incomplete, personas.length);
    addInsight({ Categoria:"Calidad de datos", Prioridad:"Riesgo", Titulo:"Campos de segmentacion incompletos", Detalle:`${rate}% de las personas no tiene departamento, centro o sexo informado.`, Metrica:"Registros incompletos", Periodo:"Dataset completo", Segmento:"Global", ValorActual:incomplete, Impacto:Math.min(90, Math.round(rate)), Urgencia:65, Confianza:100, Recomendacion:"Completar los campos de departamento, centro y sexo antes de comparar segmentos.", Grafico:"barra_calidad" });
  }
  const departments = new Map();
  personas.filter((row) => row.Departamento).forEach((row) => departments.set(row.Departamento, (departments.get(row.Departamento) || 0) + 1));
  if (departments.size >= 2) {
    const [segment, count] = [...departments.entries()].sort((a, b) => b[1] - a[1])[0], share = percent(count, personas.length);
    if (share >= 35) addInsight({ Categoria:"Concentracion", Prioridad:share >= 50 ? "Riesgo" : "Oportunidad", Titulo:`${segment} concentra el ${share}% de la plantilla`, Detalle:`${count} de ${personas.length} personas pertenecen a ${segment}.`, Metrica:"Plantilla", Periodo:"Dataset completo", Segmento:segment, ValorActual:count, VariacionPct:share, Impacto:Math.min(95, Math.round(share)), Urgencia:45, Confianza:100, Recomendacion:"Valorar el riesgo operativo y revisar los indicadores de este departamento de forma segmentada.", Grafico:"pareto_departamentos" });
  }
  const exits = new Map();
  personas.filter((row) => row.FechaBajaEmpresa).forEach((row) => { const key = month(row.FechaBajaEmpresa); if (key) exits.set(key, (exits.get(key) || 0) + 1); });
  const periods = [...exits.keys()].sort();
  if (periods.length >= 2) {
    const currentPeriod = periods.at(-1), previousPeriod = periods.at(-2), current = exits.get(currentPeriod), previous = exits.get(previousPeriod);
    if (previous && current > previous) { const change = percent(current - previous, previous); addInsight({ Categoria:"Rotacion", Prioridad:change >= 50 ? "Riesgo" : "Seguimiento", Titulo:`Las bajas aumentaron un ${change}% en ${currentPeriod}`, Detalle:`Se registraron ${current} bajas frente a ${previous} en ${previousPeriod}.`, Metrica:"Bajas de empresa", Periodo:currentPeriod, Segmento:"Global", ValorActual:current, ValorAnterior:previous, VariacionPct:change, Impacto:Math.min(95, 45 + Math.round(change / 2)), Urgencia:Math.min(95, 40 + Math.round(change / 2)), Confianza:90, Recomendacion:"Revisar las salidas por departamento, puesto y antiguedad para priorizar acciones de retencion.", Grafico:"tendencia_bajas" }); }
  }
  const leaveDepartments = new Map(), personsById = new Map(personas.map((row) => [row.PersonaID, row]));
  bajas.forEach((row) => { const segment = personsById.get(row.PersonaID)?.Departamento; if (segment) leaveDepartments.set(segment, (leaveDepartments.get(segment) || 0) + 1); });
  if (bajas.length && leaveDepartments.size >= 2) {
    const [segment, count] = [...leaveDepartments.entries()].sort((a, b) => b[1] - a[1])[0], share = percent(count, bajas.length);
    if (share >= 35) addInsight({ Categoria:"Absentismo", Prioridad:share >= 50 ? "Riesgo" : "Seguimiento", Titulo:`${segment} concentra el ${share}% de los episodios de baja`, Detalle:`${count} de ${bajas.length} episodios estan asociados a ${segment}.`, Metrica:"Episodios de baja", Periodo:"Dataset completo", Segmento:segment, ValorActual:count, VariacionPct:share, Impacto:Math.min(90, Math.round(share)), Urgencia:60, Confianza:95, Recomendacion:"Contrastar la concentracion con la plantilla del departamento y revisar los tipos de baja sin inferir causalidad.", Grafico:"pareto_bajas_departamento" });
  }
  const average = (values) => values.reduce((total, value) => total + value, 0) / values.length;
  const turnoverByDepartment = new Map();
  personas.filter((row) => row.Departamento).forEach((row) => { const stat = turnoverByDepartment.get(row.Departamento) || { people:0, exits:0 }; stat.people += 1; stat.exits += row.FechaBajaEmpresa ? 1 : 0; turnoverByDepartment.set(row.Departamento, stat); });
  const totalExitRate = percent(personas.filter((row) => row.FechaBajaEmpresa).length, personas.length);
  [...turnoverByDepartment.entries()].map(([segment, stat]) => ({ segment, ...stat, rate:percent(stat.exits, stat.people) })).filter((stat) => stat.people >= 20 && stat.exits >= 3 && stat.rate >= totalExitRate * 1.2).sort((a, b) => b.rate - a.rate).slice(0, 3).forEach((stat) => {
    const relative = percent(stat.rate - totalExitRate, totalExitRate);
    addInsight({ Categoria:"Rotacion", Prioridad:"Riesgo", Titulo:`Rotacion elevada en ${stat.segment}`, Detalle:`${stat.segment} registra un ${stat.rate}% de bajas de empresa en los datos, un ${relative}% por encima de la media global (${totalExitRate}%).`, Metrica:"Tasa de bajas de empresa", Periodo:"Dataset completo", Segmento:stat.segment, ValorActual:stat.rate, ValorAnterior:totalExitRate, VariacionPct:relative, Impacto:Math.min(95, 50 + Math.round(relative / 2)), Urgencia:70, Confianza:90, Recomendacion:"Revisar salidas, antiguedad y puestos del departamento. Esta señal identifica una diferencia; no demuestra la causa.", Grafico:"comparacion_rotacion_departamentos" });
  });
  const salariesByRoleAndGender = new Map();
  personas.forEach((row) => { const salary = Number(row.SalarioAnual), gender = String(row.Sexo || "").toUpperCase(); if (!row.PuestoTrabajo || !Number.isFinite(salary) || !["F", "M"].includes(gender)) return; const role = salariesByRoleAndGender.get(row.PuestoTrabajo) || { F:[], M:[] }; role[gender].push(salary); salariesByRoleAndGender.set(row.PuestoTrabajo, role); });
  [...salariesByRoleAndGender.entries()].map(([role, values]) => { const female = average(values.F), male = average(values.M), gap = percent(Math.abs(male - female), (male + female) / 2); return { role, female, male, gap, femaleCount:values.F.length, maleCount:values.M.length, higher:male >= female ? "hombres" : "mujeres" }; }).filter((item) => item.femaleCount >= 8 && item.maleCount >= 8 && item.gap >= 5).sort((a, b) => b.gap - a.gap).slice(0, 3).forEach((item) => {
    addInsight({ Categoria:"Equidad salarial", Prioridad:item.gap >= 8 ? "Riesgo" : "Seguimiento", Titulo:`Diferencia salarial dentro de ${item.role}`, Detalle:`Comparacion dentro del mismo puesto: el salario medio de ${item.higher} es un ${item.gap}% superior (€${Math.round(Math.max(item.female, item.male)).toLocaleString("es-ES")}) frente al otro grupo (€${Math.round(Math.min(item.female, item.male)).toLocaleString("es-ES")}). No equivale a la brecha agregada de todo el departamento.`, Metrica:"Salario anual medio dentro del puesto", Periodo:"Dataset completo", Segmento:item.role, ValorActual:Math.round(Math.max(item.female, item.male)), ValorAnterior:Math.round(Math.min(item.female, item.male)), VariacionPct:item.gap, Impacto:Math.min(95, 45 + Math.round(item.gap * 5)), Urgencia:65, Confianza:85, Recomendacion:"Validar con la fila del mismo puesto tras filtrar PuestoTrabajo. Revisar banda salarial, nivel, antiguedad, jornada y desempeño antes de concluir que existe una discriminacion salarial.", Grafico:"comparacion_salarial_genero_puesto" });
  });
  if (!insights.length) addInsight({ Categoria:"Cobertura", Prioridad:"Informacion", Titulo:"No se detectaron alertas con las reglas actuales", Detalle:"El dataset no presenta variaciones o concentraciones que superen los umbrales configurados.", Metrica:"Cobertura de reglas", Periodo:"Dataset completo", Segmento:"Global", ValorActual:0, Impacto:10, Urgencia:10, Confianza:80, Recomendacion:"Incorporar mas periodos historicos y dimensiones para ampliar la deteccion de patrones.", Grafico:"tabla_insights" });
  const insightsPath = path.join(outputDir, "insights.csv"); writeCsv(insightsPath, INSIGHT_FIELDS, insights);
  return { count:insights.length, path:insightsPath, rows:insights };
}
function convertWorkbook({ inputPath, personasSheet, personasMapping, bajasSheet, bajasMapping, outputDir }) { const workbook = XLSX.readFile(inputPath, { cellDates:true }); fs.mkdirSync(outputDir, { recursive:true }); const persons = validate("personas", sourceRows(workbook, personasSheet, PERSONAS_FIELDS, personasMapping)); const leaves = validate("bajas", sourceRows(workbook, bajasSheet, BAJAS_FIELDS, bajasMapping), new Set(persons.accepted.map((row) => row.data.PersonaID))); writeCsv(path.join(outputDir,"personas.csv"), PERSONAS_FIELDS, persons.accepted.map((row) => row.data)); writeCsv(path.join(outputDir,"bajas_medicas.csv"), BAJAS_FIELDS, leaves.accepted.map((row) => row.data)); const insightResult = generateInsights(persons.accepted.map((row) => row.data), leaves.accepted.map((row) => row.data), outputDir); const report = [...persons.rejected.map((row) => ({ Tipo:"Personas", Fila:row.line, Motivo:row.reason })), ...leaves.rejected.map((row) => ({ Tipo:"Bajas médicas", Fila:row.line, Motivo:row.reason }))]; const reportPath = path.join(outputDir,"filas_rechazadas.csv"); writeCsv(reportPath,["Tipo","Fila","Motivo"],report); return { personas:persons.accepted.length, bajas:leaves.accepted.length, rejected:report.length, insights:insightResult.count, insightsPath:insightResult.path, reportPath, outputDir }; }
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
module.exports = { PERSONAS_FIELDS, BAJAS_FIELDS, INSIGHT_FIELDS, analyzeWorkbook, guessMapping, convertWorkbook, generateInsights, createPalette, applyPowerBiPalette };
