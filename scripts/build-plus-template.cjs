const fs = require("fs");
const path = require("path");

const root = path.resolve("kit-plus", "PowerBI", "People Analytics DAX Kit.Report", "definition", "pages");
const schema = "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.9.0/schema.json";
const literal = (value) => ({ expr: { Literal: { Value: value } } });
const field = (table, column) => ({ Column: { Expression: { SourceRef: { Entity: table } }, Property: column } });
const measure = (table, name) => ({ Measure: { Expression: { SourceRef: { Entity: table } }, Property: name } });
const container = (title) => ({
  title: [{ properties: { show: literal("true"), text: literal(`'${title}'`) } }],
  background: [{ properties: { show: literal("true"), color: { solid: { color: "#FFFFFF" } }, transparency: literal("0D") } }],
  border: [{ properties: { show: literal("true"), color: { solid: { color: "#D8E1F0" } }, radius: literal("16D") } }],
  padding: [{ properties: { top: literal("8D"), bottom: literal("8D"), left: literal("8D"), right: literal("8D") } }]
});
const visual = (name, x, y, width, height, visualType, queryState, title, z = 1) => ({ $schema: schema, name, position: { x, y, z, width, height, tabOrder: z }, visual: { visualType, query: { queryState }, visualContainerObjects: container(title) } });
const card = (name, x, table, metric, title) => visual(name, x, 112, 280, 110, "card", { Values: { projections: [{ field: measure(table, metric), queryRef: `${table}.${metric}`, nativeQueryRef: metric }] } }, title, 2);
const chart = (name, type, x, y, width, height, categoryTable, category, metricTable, metric, title, z) => visual(name, x, y, width, height, type, {
  Category: { projections: [{ field: field(categoryTable, category), queryRef: `${categoryTable}.${category}`, nativeQueryRef: category, active: true }] },
  Y: { projections: [{ field: measure(metricTable, metric), queryRef: `${metricTable}.${metric}`, nativeQueryRef: metric }] }
}, title, z);
const text = (name, value, x, y, width, height, size, color, z) => ({
  $schema: schema, name, position: { x, y, z, width, height, tabOrder: z },
  visual: {
    visualType: "textbox",
    objects: { general: [{ properties: { paragraphs: [{ textRuns: [{ value, textStyle: { fontFamily: size > 15 ? "Segoe UI Semibold" : "Segoe UI", fontSize: `${size}px`, color } }], horizontalTextAlignment: "left" }] } }] },
    visualContainerObjects: { background: [{ properties: { show: literal("false") } }], border: [{ properties: { show: literal("false") } }], padding: [{ properties: { top: literal("0D"), bottom: literal("0D"), left: literal("0D"), right: literal("0D") } }] }
  }
});
const slicer = () => ({ $schema: schema, name: "filterDepartamento", position: { x: 950, y: 10, z: 22, width: 280, height: 88, tabOrder: 22 }, visual: { visualType: "slicer", query: { queryState: { Values: { projections: [{ field: field("Personas", "Departamento"), queryRef: "Personas.Departamento", nativeQueryRef: "Departamento", active: true }] } } }, objects: { data: [{ properties: { mode: literal("'Dropdown'") } }], header: [{ properties: { show: literal("true"), text: literal("'Departamento'") } }] }, visualContainerObjects: { title: [{ properties: { show: literal("false") } }], background: [{ properties: { show: literal("true"), color: { solid: { color: "#FFFFFF" } }, transparency: literal("0D") } }], border: [{ properties: { show: literal("true"), color: { solid: { color: "#D8E1F0" } }, radius: literal("12D") } }], padding: [{ properties: { top: literal("8D"), bottom: literal("8D"), left: literal("8D"), right: literal("8D") } }] } } });
function writePage(id, displayName, heading, subtitle, visuals) {
  const dir = path.join(root, id); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(path.join(dir, "visuals"), { recursive: true });
  fs.writeFileSync(path.join(dir, "page.json"), JSON.stringify({ $schema: "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.1.0/schema.json", name: id, displayName, displayOption: "FitToPage", height: 720, width: 1280 }));
  const fixed = [text("headerTitle", heading, 30, 14, 800, 48, 25, "#123AA7", 20), text("headerSubtitle", subtitle, 32, 62, 780, 30, 10, "#6B7893", 21), slicer(), ...visuals];
  for (const definition of fixed) { const visualDir = path.join(dir, "visuals", definition.name); fs.mkdirSync(visualDir, { recursive: true }); fs.writeFileSync(path.join(visualDir, "visual.json"), JSON.stringify(definition)); }
}

writePage("resumen", "Resumen ejecutivo", "People Analytics · Resumen ejecutivo", "Los indicadores clave para decidir con rapidez.", [
  card("cardPlantilla", 30, "Personas", "Plantilla al cierre", "Plantilla al cierre"), card("cardAltas", 330, "Personas", "Altas del periodo", "Altas del periodo"), card("cardBajas", 630, "Personas", "Bajas del periodo", "Bajas del periodo"), card("cardAbsentismo", 930, "BajasMedicas", "Tasa absentismo %", "Tasa de absentismo"),
  chart("trendPlantilla", "lineChart", 30, 250, 580, 410, "Calendario", "AnoMes", "Personas", "Plantilla al cierre", "Evolución mensual de la plantilla", 3),
  chart("trendBajas", "clusteredColumnChart", 650, 250, 580, 410, "Calendario", "AnoMes", "Personas", "Bajas del periodo", "Bajas por mes", 4)
]);
writePage("absentismo", "Absentismo", "Absentismo y salud laboral", "Volumen, duración, tipología y evolución mensual de las bajas.", [
  card("cardPersonas", 30, "BajasMedicas", "Personas con baja médica", "Personas con baja"), card("cardDias", 330, "BajasMedicas", "Días de baja", "Días perdidos"), card("cardTasa", 630, "BajasMedicas", "Tasa absentismo %", "Tasa de absentismo"), card("cardDuracion", 930, "BajasMedicas", "Dias baja por persona", "Días por persona"),
  chart("trendDias", "lineChart", 30, 250, 580, 190, "Calendario", "AnoMes", "BajasMedicas", "Días de baja", "Evolución mensual de días perdidos", 3),
  chart("trendPersonas", "clusteredColumnChart", 650, 250, 580, 190, "Calendario", "AnoMes", "BajasMedicas", "Personas con baja médica", "Personas afectadas por mes", 4),
  chart("tipoDias", "clusteredBarChart", 30, 470, 580, 190, "BajasMedicas", "TipoBaja", "BajasMedicas", "Días de baja", "Días perdidos por tipo de baja", 5),
  chart("tipoDuracion", "clusteredBarChart", 650, 470, 580, 190, "BajasMedicas", "TipoBaja", "BajasMedicas", "Dias baja por persona", "Duración media por tipo de baja", 6)
]);
writePage("rotacion", "Rotación y retención", "Rotación y retención", "Entradas, salidas y focos de atención por área.", [
  card("cardRotacion", 30, "Personas", "Rotacion anual %", "Rotación anual"), card("cardAltas", 330, "Personas", "Altas del periodo", "Altas"), card("cardBajas", 630, "Personas", "Bajas del periodo", "Bajas"), card("cardAntiguedad", 930, "Personas", "Antiguedad media", "Antigüedad media"),
  chart("trendAltas", "clusteredColumnChart", 30, 250, 380, 190, "Calendario", "AnoMes", "Personas", "Altas del periodo", "Altas por mes", 3),
  chart("trendBajas", "clusteredColumnChart", 450, 250, 380, 190, "Calendario", "AnoMes", "Personas", "Bajas del periodo", "Bajas por mes", 4),
  chart("deptBajas", "clusteredBarChart", 870, 250, 360, 190, "Personas", "Departamento", "Personas", "Bajas del periodo", "Salidas por departamento", 5),
  chart("tenureBajas", "clusteredBarChart", 30, 470, 1200, 190, "Personas", "Tramo antigüedad", "Personas", "Bajas del periodo", "Salidas por tramo de antigüedad", 6)
]);
writePage("compensacion", "Compensación", "Compensación y estructura salarial", "Coste, distribución y señal de equidad retributiva.", [
  card("cardSalario", 30, "Personas", "Salario medio", "Salario medio"), card("cardMediano", 330, "Personas", "Salario mediano", "Salario mediano"), card("cardCoste", 630, "Personas", "Coste salarial anual", "Coste salarial anual"), card("cardBrecha", 930, "Personas", "Brecha salarial %", "Brecha salarial"),
  chart("salaryDept", "clusteredBarChart", 30, 250, 580, 190, "Personas", "Departamento", "Personas", "Salario medio", "Salario medio por departamento", 3),
  chart("salaryLevel", "clusteredColumnChart", 650, 250, 580, 190, "Personas", "NivelPuesto", "Personas", "Salario medio", "Salario medio por nivel", 4),
  chart("costDept", "clusteredBarChart", 30, 470, 580, 190, "Personas", "Departamento", "Personas", "Coste salarial anual", "Coste salarial por departamento", 5),
  chart("salaryBand", "clusteredColumnChart", 650, 470, 580, 190, "Personas", "Tramo salarial", "Personas", "Plantilla al cierre", "Distribución de plantilla por tramo salarial", 6)
]);
writePage("diversidad", "Diversidad y equidad", "Diversidad y equidad", "Composición de la plantilla y representación por equipos.", [
  card("cardMujeres", 30, "Personas", "Mujeres %", "Mujeres en plantilla"), card("cardEdad", 330, "Personas", "Edad media", "Edad media"), card("cardAntiguedad", 630, "Personas", "Antiguedad media", "Antigüedad media"), card("cardPlantilla", 930, "Personas", "Plantilla al cierre", "Plantilla total"),
  chart("sexoDept", "clusteredBarChart", 30, 250, 580, 410, "Personas", "Departamento", "Personas", "Mujeres en plantilla", "Mujeres en plantilla por departamento", 3),
  chart("education", "clusteredColumnChart", 650, 250, 580, 410, "Personas", "NivelEducativo", "Personas", "Plantilla al cierre", "Distribución por nivel educativo", 4)
]);
writePage("centros", "Centros y departamentos", "Centros y departamentos", "Distribución territorial y organizativa de la plantilla.", [
  card("cardPlantilla", 30, "Personas", "Plantilla al cierre", "Plantilla al cierre"), card("cardAltas", 330, "Personas", "Altas del periodo", "Altas"), card("cardBajas", 630, "Personas", "Bajas del periodo", "Bajas"), card("cardAbsentismo", 930, "BajasMedicas", "Tasa absentismo %", "Tasa de absentismo"),
  chart("centro", "clusteredBarChart", 30, 250, 580, 410, "Personas", "Centro", "Personas", "Plantilla al cierre", "Plantilla por centro", 3),
  chart("provincia", "clusteredBarChart", 650, 250, 580, 410, "Personas", "Provincia", "Personas", "Plantilla al cierre", "Plantilla por provincia", 4)
]);

const metadata = { $schema: "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/pagesMetadata/1.0.0/schema.json", pageOrder: ["resumen", "plantilla", "demografia", "absentismo", "rotacion", "compensacion", "diversidad", "centros"], activePageName: "resumen" };
fs.writeFileSync(path.join(root, "pages.json"), JSON.stringify(metadata));
