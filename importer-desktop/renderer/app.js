const peopleFields = ["PersonaID", "FechaAlta", "FechaBajaEmpresa", "Departamento", "PuestoTrabajo", "Centro", "Sexo", "FechaNacimiento", "SalarioAnual"];
const leaveFields = ["EpisodioID", "PersonaID", "FechaInicio", "FechaFin", "TipoBaja"];
const requiredPeople = new Set(["PersonaID", "FechaAlta"]);
const requiredLeave = new Set(["EpisodioID", "PersonaID", "FechaInicio"]);
let analysis = null;

const $ = (id) => document.getElementById(id);
const showStatus = (message, type = "") => {
  const box = $("status");
  box.textContent = message;
  box.className = `status ${type}`;
  setTimeout(() => box.classList.add("hidden"), type === "error" ? 7000 : 5000);
};

async function loadFile(filePath) {
  if (!filePath || !/\.xlsx?$/i.test(filePath)) return showStatus("Selecciona un archivo .xlsx o .xls.", "error");
  try {
    showStatus("Leyendo hojas y cabeceras…");
    analysis = await window.peopleAnalytics.analyze(filePath);
    $("fileName").textContent = analysis.fileName;
    $("summary").textContent = analysis.sheets.map((s) => `${s.name}: ${s.rowCount} filas, ${s.headers.length} columnas`).join("  •  ");
    fillSheetSelectors();
    $("dropZone").classList.add("hidden");
    $("workspace").classList.remove("hidden");
    showStatus("Excel analizado. Revisa el mapeo antes de continuar.", "ok");
  } catch (error) { showStatus(error.message || String(error), "error"); }
}

function bestSheet(kind) {
  const words = kind === "personas" ? ["persona", "empleado", "plantilla", "employee"] : ["baja", "ausencia", "absent", "leave"];
  return analysis.sheets.find((s) => words.some((w) => s.name.toLowerCase().includes(w)))?.name || (kind === "personas" ? analysis.sheets[0]?.name : analysis.sheets[1]?.name || "");
}

function sheetOptions(selected, optional = false) {
  const empty = optional ? '<option value="">No importar bajas médicas</option>' : "";
  return empty + analysis.sheets.map((s) => `<option value="${escapeHtml(s.name)}" ${s.name === selected ? "selected" : ""}>${escapeHtml(s.name)} (${s.rowCount} filas)</option>`).join("");
}

function fillSheetSelectors() {
  $("personasSheet").innerHTML = sheetOptions(bestSheet("personas"));
  $("bajasSheet").innerHTML = sheetOptions(bestSheet("bajas"), true);
  renderFields("personas"); renderFields("bajas");
}

function renderFields(kind) {
  const sheetName = $(`${kind}Sheet`).value;
  const fields = kind === "personas" ? peopleFields : leaveFields;
  const required = kind === "personas" ? requiredPeople : requiredLeave;
  const container = $(`${kind}Fields`);
  if (!sheetName) { container.innerHTML = '<p>No se generará el archivo de bajas médicas.</p>'; return; }
  const sheet = analysis.sheets.find((s) => s.name === sheetName);
  const guesses = analysis.guesses[sheetName][kind];
  container.innerHTML = fields.map((field) => `<label class="field"><span>${field}${required.has(field) ? " <em>*</em>" : ""}</span><select data-field="${field}"><option value="">— Sin mapear —</option>${sheet.headers.map((header) => `<option value="${escapeHtml(header)}" ${header === guesses[field] ? "selected" : ""}>${escapeHtml(header)}</option>`).join("")}</select></label>`).join("");
}

function mapping(kind) {
  return Object.fromEntries([...$(`${kind}Fields`).querySelectorAll("select[data-field]")].map((select) => [select.dataset.field, select.value]));
}
function colors() { return { primary: $("primaryColor").value, secondary: $("secondaryColor").value }; }
function renderPalette() {
  const palette = colors();
  $("primaryHex").textContent = palette.primary.toUpperCase();
  $("secondaryHex").textContent = palette.secondary.toUpperCase();
}

async function refreshProfiles() {
  const names = await window.peopleAnalytics.listProfiles();
  $("profileSelect").innerHTML = '<option value="">Selecciona un perfil</option>' + names.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("");
}

$("saveProfileButton").onclick = async () => {
  const name = window.prompt("Nombre del perfil de mapeo:");
  if (!name) return;
  try { await window.peopleAnalytics.saveProfile(name, { personasSheet: $("personasSheet").value, bajasSheet: $("bajasSheet").value, personasMapping: mapping("personas"), bajasMapping: mapping("bajas"), colors: colors() }); await refreshProfiles(); showStatus("Perfil guardado.", "ok"); } catch (error) { showStatus(error.message || String(error), "error"); }
};
$("profileSelect").onchange = async (event) => {
  const profile = await window.peopleAnalytics.loadProfile(event.target.value); if (!profile) return;
  $("personasSheet").value = profile.personasSheet; $("bajasSheet").value = profile.bajasSheet; renderFields("personas"); renderFields("bajas");
  for (const [kind, saved] of [["personas", profile.personasMapping], ["bajas", profile.bajasMapping]]) for (const select of $(`${kind}Fields`).querySelectorAll("select[data-field]")) select.value = saved[select.dataset.field] || "";
  if (profile.colors?.primary) $("primaryColor").value = profile.colors.primary;
  if (profile.colors?.secondary) $("secondaryColor").value = profile.colors.secondary;
  renderPalette();
  showStatus("Perfil aplicado. Revisa las columnas antes de generar.", "ok");
};

function escapeHtml(value) { return String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char])); }

$("chooseButton").onclick = $("changeButton").onclick = async () => loadFile(await window.peopleAnalytics.chooseFile());
$("personasSheet").onchange = () => renderFields("personas");
$("bajasSheet").onchange = () => renderFields("bajas");
$("primaryColor").oninput = $("secondaryColor").oninput = renderPalette;
async function generateReport(edition) {
  const button = edition === "plus" ? $("plusButton") : $("convertButton");
  const otherButton = edition === "plus" ? $("convertButton") : $("plusButton");
  button.disabled = true; otherButton.disabled = true; button.textContent = "Generando archivos…";
  try {
    const result = await window.peopleAnalytics.convert({
      inputPath: analysis.filePath,
      personasSheet: $("personasSheet").value,
      personasMapping: mapping("personas"),
      bajasSheet: $("bajasSheet").value,
      bajasMapping: mapping("bajas"),
      colors: colors(),
      edition
    });
    const end = result.powerBiOpened ? " Power BI se está abriendo." : ` ${result.powerBiError}`;
    const rejected = result.rejected ? ` ${result.rejected} fila(s) rechazada(s): consulta filas_rechazadas.csv.` : "";
    const dynamic = result.dynamicPages?.length ? ` Páginas añadidas: ${result.dynamicPages.join(", ")}.` : "";
    showStatus(`Listo: ${result.personas} personas y ${result.bajas} bajas guardadas en ${result.outputDir}.${dynamic}${rejected}${end}`, result.powerBiOpened ? "ok" : "");
  } catch (error) { showStatus(error.message || String(error), "error"); }
  finally { button.disabled = false; otherButton.disabled = false; button.textContent = edition === "plus" ? "Generar informe Plus" : "Generar informe Demo →"; }
}
$("plusButton").onclick = () => generateReport("plus");
$("convertButton").onclick = () => generateReport("demo");

const drop = $("dropZone");
refreshProfiles();
renderPalette();
["dragenter", "dragover"].forEach((name) => drop.addEventListener(name, (event) => { event.preventDefault(); drop.classList.add("drag"); }));
["dragleave", "drop"].forEach((name) => drop.addEventListener(name, (event) => { event.preventDefault(); drop.classList.remove("drag"); }));
drop.addEventListener("drop", (event) => {
  const file = event.dataTransfer.files[0];
  if (file) loadFile(window.peopleAnalytics.filePath(file));
});
