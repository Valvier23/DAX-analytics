const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const PERSONAS_FIELDS = ["PersonaID", "FechaAlta", "FechaBajaEmpresa", "Departamento", "PuestoTrabajo", "Centro", "Sexo", "FechaNacimiento", "SalarioAnual"];
const BAJAS_FIELDS = ["EpisodioID", "PersonaID", "FechaInicio", "FechaFin", "TipoBaja"];

const SYNONYMS = {
  PersonaID: ["personaid", "persona_id", "empleadoid", "empleado_id", "idpersona", "idempleado", "employeeid", "workerid"],
  FechaAlta: ["fechaalta", "fecha_alta", "fechaingreso", "fecha_ingreso", "fechacontratacion", "hiredate", "startdate"],
  FechaBajaEmpresa: ["fechabajaempresa", "fecha_baja_empresa", "fechabaja", "fecha_baja", "fechasalida", "fecha_salida", "terminationdate", "leavedate", "enddate"],
  Departamento: ["departamento", "area", "unidad", "department", "team"],
  PuestoTrabajo: ["puestotrabajo", "puesto_trabajo", "puesto", "cargo", "posicion", "posición", "jobtitle", "job_title", "role", "rol"],
  Centro: ["centro", "centrotrabajo", "centro_trabajo", "ubicacion", "ubicación", "location", "office"],
  Sexo: ["sexo", "genero", "género", "gender", "sex"],
  FechaNacimiento: ["fechanacimiento", "fecha_nacimiento", "nacimiento", "birthdate", "dateofbirth"],
  SalarioAnual: ["salarioanual", "salario_anual", "salario", "retribucionfija", "retribuciónfija", "annualsalary", "salary"],
  EpisodioID: ["episodioid", "episodio_id", "bajaid", "baja_id", "ausenciaid", "absenceid", "leaveid"],
  FechaInicio: ["fechainicio", "fecha_inicio", "iniciobaja", "inicio_baja", "startdate", "from"],
  FechaFin: ["fechafin", "fecha_fin", "finbaja", "fin_baja", "enddate", "to"],
  TipoBaja: ["tipobaja", "tipo_baja", "tipoausencia", "tipo_ausencia", "motivo", "leavetype", "absencetype"]
};

function normalize(value) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function guessMapping(headers, fields) {
  const normalized = headers.map((header) => ({ header, value: normalize(header) }));
  return Object.fromEntries(fields.map((field) => {
    const choices = [field, ...(SYNONYMS[field] || [])].map(normalize);
    const exact = normalized.find((item) => choices.includes(item.value));
    const partial = normalized.find((item) => choices.some((choice) => item.value.includes(choice) || choice.includes(item.value)));
    return [field, (exact || partial || {}).header || ""];
  }));
}

function analyzeWorkbook(filePath) {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const sheets = workbook.SheetNames.map((name) => {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: "", raw: false });
    const headers = rows.length ? Object.keys(rows[0]) : [];
    return { name, headers, rowCount: rows.length };
  });
  return { filePath, fileName: path.basename(filePath), sheets };
}

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  return /[";,\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const DATE_FIELDS = new Set(["FechaAlta", "FechaBajaEmpresa", "FechaNacimiento", "FechaInicio", "FechaFin"]);

function pad(value) { return String(value).padStart(2, "0"); }

function normalizeDate(value) {
  if (value == null || value === "") return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`;
  }
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return `${parsed.y}-${pad(parsed.m)}-${pad(parsed.d)}`;
  }
  const text = String(value).trim();
  let match = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (match) return `${match[1]}-${pad(match[2])}-${pad(match[3])}`;
  match = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (match) return `${match[3]}-${pad(match[2])}-${pad(match[1])}`;
  return text;
}

function normalizeValue(field, value) {
  if (DATE_FIELDS.has(field)) return normalizeDate(value);
  if (field === "SalarioAnual" && typeof value === "number") return String(value);
  return value == null ? "" : String(value).replace(/\r?\n/g, " ").trim();
}

function convertSheet(workbook, sheetName, fields, mapping) {
  if (!sheetName || !workbook.Sheets[sheetName]) return [];
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "", raw: true });
  return rows.map((row) => Object.fromEntries(fields.map((field) => [field, normalizeValue(field, mapping[field] ? row[mapping[field]] : "")])));
}

function writeCsv(filePath, fields, rows) {
  const lines = [fields.join(","), ...rows.map((row) => fields.map((field) => csvEscape(row[field])).join(","))];
  fs.writeFileSync(filePath, `\uFEFF${lines.join("\r\n")}`, "utf8");
}

function convertWorkbook({ inputPath, personasSheet, personasMapping, bajasSheet, bajasMapping, outputDir }) {
  const workbook = XLSX.readFile(inputPath, { cellDates: true });
  fs.mkdirSync(outputDir, { recursive: true });
  const personas = convertSheet(workbook, personasSheet, PERSONAS_FIELDS, personasMapping);
  const bajas = convertSheet(workbook, bajasSheet, BAJAS_FIELDS, bajasMapping);
  writeCsv(path.join(outputDir, "personas.csv"), PERSONAS_FIELDS, personas);
  writeCsv(path.join(outputDir, "bajas_medicas.csv"), BAJAS_FIELDS, bajas);
  return { personas: personas.length, bajas: bajas.length, outputDir };
}

module.exports = { PERSONAS_FIELDS, BAJAS_FIELDS, analyzeWorkbook, guessMapping, convertWorkbook };
