const peopleFields = ["PersonaID", "FechaAlta", "FechaBajaEmpresa", "Departamento", "PuestoTrabajo", "Centro", "Sexo", "FechaNacimiento", "SalarioAnual"];
const leaveFields = ["EpisodioID", "PersonaID", "FechaInicio", "FechaFin", "TipoBaja"];
const requiredPeople = new Set(["PersonaID", "FechaAlta"]);
const requiredLeave = new Set(["EpisodioID", "PersonaID", "FechaInicio"]);
let analysis = null;
const locale = window.AppLocale;
function savedLanguage(key) { try { return locale.language(localStorage.getItem(key)); } catch { return 'en'; } }
let appLanguage = savedLanguage('axzify-app-language');
const T = (key, values) => locale.t(key, appLanguage, values);
function saveLanguage(key, value) { try { localStorage.setItem(key, value); } catch { /* Session selection still works. */ } }
function updateLanguage() {
  document.documentElement.lang = appLanguage;
  document.querySelectorAll('[data-i18n]').forEach(node => { node.textContent = T(node.dataset.i18n); });
  document.querySelector('.language-panel').setAttribute('aria-label', appLanguage === 'en' ? 'Language settings' : 'Opciones de idioma');
  if (analysis) {
    $('summary').textContent = analysis.sheets.map(s => T('{name}: {rows} filas, {columns} columnas', {name:s.name,rows:s.rowCount,columns:s.headers.length})).join('  •  ');
    for (const kind of ['personas','bajas']) for (const option of $(`${kind}Sheet`).options) {
      const sheet = analysis.sheets.find(s => s.name === option.value);
      if (sheet) option.textContent = T('{name} ({rows} filas)', {name:sheet.name,rows:sheet.rowCount});
    }
  }
  $('status').classList.add('hidden');
}

const $ = (id) => document.getElementById(id);
const showStatus = (message, type = "") => {
  const box = $("status");
  box.textContent = locale.error(message, appLanguage);
  box.className = `status ${type}`;
  setTimeout(() => box.classList.add("hidden"), type === "error" ? 7000 : 5000);
};

async function loadFile(filePath) {
  if (!filePath || !/\.xlsx?$/i.test(filePath)) return showStatus("Selecciona un archivo .xlsx o .xls.", "error");
  try {
    showStatus("Leyendo hojas y cabeceras…");
    analysis = await window.peopleAnalytics.analyze(filePath, appLanguage);
    $("fileName").textContent = analysis.fileName;
    $("summary").textContent = analysis.sheets.map((s) => T('{name}: {rows} filas, {columns} columnas', {name:s.name,rows:s.rowCount,columns:s.headers.length})).join("  •  ");
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
  const empty = optional ? `<option value="" data-i18n="No importar bajas médicas">${T('No importar bajas médicas')}</option>` : "";
  return empty + analysis.sheets.map((s) => `<option value="${escapeHtml(s.name)}" ${s.name === selected ? "selected" : ""}>${escapeHtml(T('{name} ({rows} filas)',{name:s.name,rows:s.rowCount}))}</option>`).join("");
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
  if (!sheetName) { container.innerHTML = `<p data-i18n="No se generará el archivo de bajas médicas.">${T('No se generará el archivo de bajas médicas.')}</p>`; return; }
  const sheet = analysis.sheets.find((s) => s.name === sheetName);
  const guesses = analysis.guesses[sheetName][kind];
  container.innerHTML = fields.map((field) => `<label class="field"><span><span data-i18n="${field}">${T(field)}</span>${required.has(field) ? " <em>*</em>" : ""}</span><select data-field="${field}"><option value="" data-i18n="— Sin mapear —">${T("— Sin mapear —")}</option>${sheet.headers.map((header) => `<option value="${escapeHtml(header)}" ${header === guesses[field] ? "selected" : ""}>${escapeHtml(header)}</option>`).join("")}</select></label>`).join("");
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
  $("profileSelect").innerHTML = `<option value="" data-i18n="Selecciona un perfil">${T('Selecciona un perfil')}</option>` + names.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("");
}

$("saveProfileButton").onclick = async () => {
  const name = window.prompt(T("Nombre del perfil de mapeo:"));
  if (!name) return;
  try { await window.peopleAnalytics.saveProfile(name, { personasSheet: $("personasSheet").value, bajasSheet: $("bajasSheet").value, personasMapping: mapping("personas"), bajasMapping: mapping("bajas"), colors: colors() }, appLanguage); await refreshProfiles(); showStatus("Perfil guardado.", "ok"); } catch (error) { showStatus(error.message || String(error), "error"); }
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

$("chooseButton").onclick = $("changeButton").onclick = async () => loadFile(await window.peopleAnalytics.chooseFile(appLanguage));
$("personasSheet").onchange = () => renderFields("personas");
$("bajasSheet").onchange = () => renderFields("bajas");
$("primaryColor").oninput = $("secondaryColor").oninput = renderPalette;
async function generateReport(edition) {
  const button = edition === "plus" ? $("plusButton") : $("convertButton");
  const otherButton = edition === "plus" ? $("convertButton") : $("plusButton");
  button.disabled = true; otherButton.disabled = true; button.textContent = T("Generando archivos…");
  $("appLanguage").disabled = true; $("reportLanguage").disabled = true;
  try {
    const result = await window.peopleAnalytics.convert({
      inputPath: analysis.filePath,
      personasSheet: $("personasSheet").value,
      personasMapping: mapping("personas"),
      bajasSheet: $("bajasSheet").value,
      bajasMapping: mapping("bajas"),
      colors: colors(),
      edition, appLanguage, reportLanguage: $("reportLanguage").value
    });
    const end = result.powerBiOpened ? T("Power BI se está abriendo.") : locale.error(result.powerBiError, appLanguage);
    const rejected = result.rejected ? T("{count} fila(s) rechazada(s): consulta filas_rechazadas.csv.",{count:result.rejected}) : "";
    const dynamic = result.dynamicPages?.length ? T("Páginas añadidas: {pages}.",{pages:result.dynamicPages.map(name=>T(name)).join(", ")}) : "";
    showStatus([T("Listo: {people} personas y {leaves} bajas guardadas en {path}.",{people:result.personas,leaves:result.bajas,path:result.outputDir}),dynamic,rejected,end].filter(Boolean).join(" "), result.powerBiOpened ? "ok" : "");
  } catch (error) { showStatus(error.message || String(error), "error"); }
  finally { button.disabled = false; otherButton.disabled = false; button.textContent = T(edition === "plus" ? "Generar informe Plus" : "Generar informe Demo →"); $("appLanguage").disabled = false; $("reportLanguage").disabled = false; }
}
$("plusButton").onclick = () => generateReport("plus");
$("convertButton").onclick = () => generateReport("demo");

$('appLanguage').value = appLanguage;
$('reportLanguage').value = savedLanguage('axzify-report-language');
$('appLanguage').onchange = () => { appLanguage = locale.language($('appLanguage').value); saveLanguage('axzify-app-language',appLanguage); updateLanguage(); };
$('reportLanguage').onchange = () => saveLanguage('axzify-report-language',locale.language($('reportLanguage').value));
updateLanguage();
const drop = $("dropZone");
refreshProfiles();
renderPalette();
["dragenter", "dragover"].forEach((name) => drop.addEventListener(name, (event) => { event.preventDefault(); drop.classList.add("drag"); }));
["dragleave", "drop"].forEach((name) => drop.addEventListener(name, (event) => { event.preventDefault(); drop.classList.remove("drag"); }));
drop.addEventListener("drop", (event) => {
  const file = event.dataTransfer.files[0];
  if (file) loadFile(window.peopleAnalytics.filePath(file));
});
