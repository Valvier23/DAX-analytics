const fs = require("fs");
const path = require("path");
const XLSX = require("../importer-desktop/node_modules/xlsx");
const out = path.resolve("kit-plus", "datos-ejemplo");
fs.mkdirSync(out, { recursive: true });
let seed = 20260829;
const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const pick = (items) => items[Math.floor(random() * items.length)];
const date = (start, end) => { const value = new Date(start.getTime() + Math.floor(random() * (end - start))); return value.toISOString().slice(0, 10); };
const departments = ["Ventas", "Operaciones", "Tecnología", "Finanzas", "Personas", "Marketing", "Atención al cliente", "Legal"];
const centres = ["Madrid", "Barcelona", "Valencia", "Sevilla", "Bilbao"];
const provinces = ["Madrid", "Barcelona", "Valencia", "Sevilla", "Bizkaia"];
const levels = ["Junior", "Especialista", "Manager", "Dirección"];
const education = ["Bachillerato", "FP", "Grado", "Máster"];
const headers = ["PersonaID","FechaAlta","FechaBajaEmpresa","Departamento","PuestoTrabajo","Centro","Sexo","FechaNacimiento","SalarioAnual","NivelEducativo","EstadoCivil","NumeroHijos","ModalidadTrabajo","TipoContrato","NivelPuesto","Provincia","Nacionalidad","FechaInicioPuesto","JornadaSemanal"];
const people = [];
for (let index = 1; index <= 1000; index += 1) {
  const level = pick(levels), department = pick(departments), centreIndex = Math.floor(random() * centres.length);
  const hire = date(new Date("2015-01-01"), new Date("2025-10-01"));
  const exited = index > 820 ? date(new Date(Math.max(new Date(hire).getTime() + 180 * 86400000, new Date("2023-01-01").getTime())), new Date("2025-12-15")) : "";
  const base = { Junior: 27000, Especialista: 38000, Manager: 52000, Dirección: 74000 }[level];
  people.push([`EMP-${String(index).padStart(4, "0")}`, hire, exited, department, `${level} ${department}`, centres[centreIndex], random() < 0.49 ? "F" : "M", date(new Date("1965-01-01"), new Date("2002-01-01")), Math.round((base + random() * 9000) / 100) * 100, pick(education), pick(["Soltero/a", "Casado/a", "Otro"]), Math.floor(random() * 4), pick(["Presencial", "Híbrido", "Remoto"]), random() < 0.82 ? "Indefinido" : "Temporal", level, provinces[centreIndex], pick(["España", "Portugal", "Italia", "Colombia", "Argentina"]), hire, random() < 0.08 ? 30 : 40]);
}
const leaves = [];
for (let index = 1; index <= 540; index += 1) { const person = people[Math.floor(random() * 1000)]; const start = date(new Date("2023-01-01"), new Date("2025-11-20")); const finish = new Date(new Date(start).getTime() + (2 + Math.floor(random() * 19)) * 86400000).toISOString().slice(0, 10); leaves.push([`BAJA-${String(index).padStart(4, "0")}`, person[0], start, finish, pick(["Enfermedad común", "Accidente", "Maternidad/Paternidad", "Salud mental"])]); }
const csv = (columns, rows) => `\uFEFF${[columns, ...rows].map((row) => row.map((value) => String(value).includes(",") ? `"${String(value).replace(/"/g, '""')}"` : value).join(",")).join("\r\n")}`;
fs.writeFileSync(path.join(out, "personas.csv"), csv(headers, people), "utf8");
fs.writeFileSync(path.join(out, "bajas_medicas.csv"), csv(["EpisodioID","PersonaID","FechaInicio","FechaFin","TipoBaja"], leaves), "utf8");
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([headers, ...people]), "Personas");
XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["EpisodioID","PersonaID","FechaInicio","FechaFin","TipoBaja"], ...leaves]), "Bajas médicas");
XLSX.writeFile(workbook, path.join(out, "plantilla-demografica-ejemplo.xlsx"));
const managers = ["Ana Martín", "Luis García", "Marta López", "Carlos Ruiz", "Elena Soto", "Javier Pérez", "Laura Díaz", "Pablo Ramos"];
const advancedHeaders = [...headers, "Manager", "Desempeño", "Engagement", "HorasFormacion", "BonusAnual"];
const advancedPeople = people.map((person, index) => {
  const level = person[14];
  const bonusBase = { Junior: 500, Especialista: 1800, Manager: 6000, "Dirección": 14000 }[level] || 1000;
  return [...person, managers[index % managers.length], 2 + (index % 4), 55 + ((index * 7) % 41), 4 + ((index * 3) % 37), bonusBase + ((index % 6) * 350)];
});
const advancedWorkbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(advancedWorkbook, XLSX.utils.aoa_to_sheet([advancedHeaders, ...advancedPeople]), "Personas");
XLSX.utils.book_append_sheet(advancedWorkbook, XLSX.utils.aoa_to_sheet([["EpisodioID","PersonaID","FechaInicio","FechaFin","TipoBaja"], ...leaves]), "Bajas medicas");
XLSX.writeFile(advancedWorkbook, path.join(out, "plantilla-avanzada-ejemplo.xlsx"));
console.log(JSON.stringify({ people: people.length, active: people.filter((row) => !row[2]).length, leavers: people.filter((row) => row[2]).length, leaveEpisodes: leaves.length }));
