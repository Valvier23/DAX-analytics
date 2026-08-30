const fs = require("fs");
const os = require("os");
const path = require("path");
const XLSX = require("xlsx");
const core = require("./core");

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "pa-importer-"));
const input = path.join(temp, "prueba.xlsx");
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([
  { "ID Empleado": "P-001", "Fecha ingreso": new Date("2024-01-15T00:00:00Z"), Área: "Ventas", Puesto: "Técnico, soporte", Género: "M", "Fecha nacimiento": "12/04/1988", Salario: 34000 },
  { "ID Empleado": "P-002", "Fecha ingreso": "01/02/2024", Área: "Operaciones", Puesto: "Responsable de equipo", Género: "F", "Fecha nacimiento": "1994-08-21", Salario: 41000 }
]), "Empleados");
XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([
  { "Ausencia ID": "A-001", "ID Empleado": "P-001", "Fecha inicio": "2025-01-03", "Fecha fin": "2025-01-05", Motivo: "Enfermedad" }
]), "Ausencias");
XLSX.writeFile(workbook, input);

const analysis = core.analyzeWorkbook(input);
const peopleMap = core.guessMapping(analysis.sheets[0].headers, core.PERSONAS_FIELDS);
const leaveMap = core.guessMapping(analysis.sheets[1].headers, core.BAJAS_FIELDS);
const output = path.join(temp, "datos-ejemplo");
const result = core.convertWorkbook({ inputPath: input, personasSheet: "Empleados", personasMapping: peopleMap, bajasSheet: "Ausencias", bajasMapping: leaveMap, outputDir: output });
if (result.personas !== 2 || result.bajas !== 1) throw new Error("El recuento convertido no es correcto.");
if (!result.insights || !fs.existsSync(result.insightsPath)) throw new Error("No se generÃ³ insights.csv.");
const insightsCsv = fs.readFileSync(result.insightsPath, "utf8");
if (!result.kpis || !fs.existsSync(result.kpisPath)) throw new Error("No se generó kpis_detectados.csv.");
const kpisCsv = fs.readFileSync(result.kpisPath, "utf8");
if (!kpisCsv.includes("KPIID") || !kpisCsv.includes("Plantilla total")) throw new Error("El catálogo de KPIs no tiene la estructura esperada.");
if (!insightsCsv.includes("InsightID") || !insightsCsv.includes("INS-001")) throw new Error("El archivo de insights no tiene la estructura esperada.");
if (!fs.readFileSync(path.join(output, "personas.csv"), "utf8").includes("P-001")) throw new Error("No se generó personas.csv correctamente.");
const peopleCsv = fs.readFileSync(path.join(output, "personas.csv"), "utf8");
if (!peopleCsv.includes("2024-01-15") || !peopleCsv.includes("1988-04-12")) throw new Error("Las fechas no se normalizaron a ISO.");
if (!peopleCsv.includes('"Técnico, soporte"')) throw new Error("El puesto con coma no se escapó correctamente.");
const palette = core.createPalette("#E8590C", "#5F3DC4");
if (palette.primary !== "#E8590C" || palette.secondary !== "#5F3DC4" || palette.border === palette.primary || palette.canvas === "#FFFFFF") throw new Error("La paleta derivada no se generó correctamente.");
const project = path.join(temp, "PowerBI");
fs.cpSync(path.resolve(__dirname, "..", "kit-free", "PowerBI"), project, { recursive: true });
core.applyPowerBiPalette(project, { primary: "#E8590C", secondary: "#5F3DC4" });
const theme = JSON.parse(fs.readFileSync(path.join(project, "People Analytics DAX Kit.Report", "StaticResources", "SharedResources", "BaseThemes", "CY25SU03.json"), "utf8"));
if (theme.dataColors[0] !== "#E8590C" || theme.dataColors[1] !== "#5F3DC4" || theme.tableAccent !== "#E8590C") throw new Error("El tema Power BI no recibió los colores personalizados.");
console.log(JSON.stringify({ ok: true, sheets: analysis.sheets, peopleMap, leaveMap, result }, null, 2));
