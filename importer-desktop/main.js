const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const core = require("./core");

app.disableHardwareAcceleration();

function ensurePowerBiProject(projectDir, outputDir, edition = "demo") {
  fs.mkdirSync(projectDir, { recursive: true });
  const targetPbip = path.join(projectDir, "People Analytics DAX Kit.pbip");
  const template = edition === "plus" ? "PowerBIPlus" : "PowerBI";
  const bundledDirs = app.isPackaged
    ? [path.join(process.resourcesPath, template), path.join(path.dirname(process.execPath), "resources", template)]
    : [path.resolve(__dirname, "..", edition === "plus" ? "kit-plus" : "kit-free", "PowerBI")];
  const bundledDir = bundledDirs.find((dir) => fs.existsSync(path.join(dir, "People Analytics DAX Kit.pbip")));
  if (!bundledDir) {
    throw new Error("No se encontró el proyecto Power BI incluido en el importador.");
  }
  for (const entry of fs.readdirSync(bundledDir)) {
    fs.cpSync(path.join(bundledDir, entry), path.join(projectDir, entry), { recursive: true, force: true });
  }
  const sources = [
    ["Personas.tmdl", "personas.csv"],
    ["BajasMedicas.tmdl", "bajas_medicas.csv"],
    ...(edition === "plus" ? [["Insights.tmdl", "insights.csv"]] : []),
  ];
  for (const [fileName, csvName] of sources) {
    const definition = path.join(projectDir, "People Analytics DAX Kit.SemanticModel", "definition", "tables", fileName);
    const source = fs.readFileSync(definition, "utf8");
    const updated = source.replace(/File\.Contents\("[^"]+"\)/, `File.Contents("${path.join(outputDir, csvName)}")`);
    fs.writeFileSync(definition, updated, "utf8");
  }
  if (edition === "plus") {
    const profilePath = path.join(outputDir, "perfil_dataset.json");
    const profile = fs.existsSync(profilePath) ? JSON.parse(fs.readFileSync(profilePath, "utf8")) : { fields:[], pages:[] };
    applyDynamicPeoplePages(projectDir, profile);
  }
  if (!fs.existsSync(targetPbip)) throw new Error("No se pudo copiar el proyecto Power BI en la carpeta de datos.");
  return targetPbip;
}

function dynamicVisual(name, type, position, visual) {
  return { $schema:"https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.9.0/schema.json", name, position:{ ...position, z:1, tabOrder:1 }, visual:{ visualType:type, ...visual } };
}
function applyDynamicPeoplePages(projectDir, profile) {
  const fields = profile?.fields || [], pages = profile?.pages || [];
  const semanticDir = path.join(projectDir, "People Analytics DAX Kit.SemanticModel", "definition");
  const peoplePath = path.join(semanticDir, "tables", "Personas.tmdl");
  if (fields.length) {
    let model = fs.readFileSync(peoplePath, "utf8");
    const extraColumns = fields.map((field) => `\n\tcolumn ${field.name}\n\t\tdataType: ${field.type === "number" ? "double" : "string"}\n\t\tsourceColumn: ${field.name}\n\t\tsummarizeBy: ${field.type === "number" ? "sum" : "none"}\n`).join("");
    model = model.replace("\n\tpartition Personas = m", `${extraColumns}\n\tpartition Personas = m`);
    model = model.replace("Columns=19", `Columns=${19 + fields.length}`);
    const types = fields.map((field) => `{"${field.name}", ${field.type === "number" ? "type number" : "type text"}}`).join(",");
    model = model.replace('{"JornadaSemanal", Int64.Type}}, "en-US")', `{"JornadaSemanal", Int64.Type},${types}}, "en-US")`);
    fs.writeFileSync(peoplePath, model, "utf8");
  }
  const pagesDir = path.join(projectDir, "People Analytics DAX Kit.Report", "definition", "pages");
  const metadataPath = path.join(pagesDir, "pages.json");
  const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  metadata.pageOrder = metadata.pageOrder.filter((page) => !String(page).startsWith("auto-"));
  for (const page of pages) {
    const pageName = `auto-${page.key}`, pageDir = path.join(pagesDir, pageName), field = page.fields[0];
    fs.mkdirSync(path.join(pageDir, "visuals", "headerTitle"), { recursive:true });
    fs.mkdirSync(path.join(pageDir, "visuals", "headerSubtitle"), { recursive:true });
    fs.mkdirSync(path.join(pageDir, "visuals", "detailTable"), { recursive:true });
    fs.writeFileSync(path.join(pageDir, "page.json"), JSON.stringify({ $schema:"https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.1.0/schema.json", name:pageName, displayName:page.title, displayOption:"FitToPage", height:720, width:1280 }));
    const text = (value, size, color) => ({
      objects: {
        general: [{ properties: {
          paragraphs: [{
            textRuns: [{ value, textStyle:{ fontFamily:size > 20 ? "Segoe UI Semibold" : "Segoe UI", fontSize:`${size}px`, color } }],
            horizontalTextAlignment:"left"
          }]
        } }]
      }
    });
    fs.writeFileSync(path.join(pageDir, "visuals", "headerTitle", "visual.json"), JSON.stringify(dynamicVisual("headerTitle", "textbox", {x:30,y:14,width:1000,height:42}, text(page.title, 25, "#123AA7"))));
    fs.writeFileSync(path.join(pageDir, "visuals", "headerSubtitle", "visual.json"), JSON.stringify(dynamicVisual("headerSubtitle", "textbox", {x:30,y:62,width:1150,height:32}, text(`Página añadida automáticamente por el campo “${field.label}” (${field.coverage}% de cobertura).`, 12, "#566682"))));
    const tableFields = ["Departamento", "PuestoTrabajo", field.name, "PersonaID"].map((property) => ({ field:{ Column:{ Expression:{ SourceRef:{ Entity:"Personas" } }, Property:property } }, queryRef:`Personas.${property}` }));
    fs.writeFileSync(path.join(pageDir, "visuals", "detailTable", "visual.json"), JSON.stringify(dynamicVisual("detailTable", "table", {x:30,y:130,width:1220,height:520}, { query:{ queryState:{ Values:{ projections:tableFields } } } })));
    metadata.pageOrder.push(pageName);
  }
  fs.writeFileSync(metadataPath, JSON.stringify(metadata), "utf8");
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1080,
    height: 760,
    minWidth: 850,
    minHeight: 620,
    title: "People Analytics Importer",
    backgroundColor: "#08111f",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile(path.join(__dirname, "renderer", "index.html"));
  win.on("closed", () => {
    if (process.platform === "win32") app.exit(0);
  });
}

app.whenReady().then(() => {
  const profilesPath = path.join(app.getPath("userData"), "mapping-profiles.json");
  const readProfiles = () => {
    try { return JSON.parse(fs.readFileSync(profilesPath, "utf8")); } catch { return {}; }
  };
  ipcMain.handle("profiles:list", () => Object.keys(readProfiles()).sort());
  ipcMain.handle("profiles:load", (_event, name) => readProfiles()[name] || null);
  ipcMain.handle("profiles:save", (_event, name, profile) => {
    if (!/^[\p{L}\p{N} _.-]{1,60}$/u.test(name || "")) throw new Error("El nombre del perfil no es válido.");
    const profiles = readProfiles(); profiles[name] = profile;
    fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2), "utf8");
    return Object.keys(profiles).sort();
  });
  ipcMain.handle("choose-file", async () => {
    const result = await dialog.showOpenDialog({
      title: "Selecciona el Excel de People Analytics",
      properties: ["openFile"],
      filters: [{ name: "Archivos Excel", extensions: ["xlsx", "xls"] }]
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle("analyze", async (_event, filePath) => {
    if (!filePath || !fs.existsSync(filePath)) throw new Error("No se encuentra el archivo seleccionado.");
    const analysis = core.analyzeWorkbook(filePath);
    analysis.guesses = Object.fromEntries(analysis.sheets.map((sheet) => [sheet.name, {
      personas: core.guessMapping(sheet.headers, core.PERSONAS_FIELDS),
      bajas: core.guessMapping(sheet.headers, core.BAJAS_FIELDS)
    }]));
    return analysis;
  });

  ipcMain.handle("convert", async (_event, config) => {
    const requiredPeople = ["PersonaID", "FechaAlta"];
    const missingPeople = requiredPeople.filter((field) => !config.personasMapping[field]);
    if (missingPeople.length) throw new Error(`Falta mapear en Personas: ${missingPeople.join(", ")}.`);
    if (config.bajasSheet) {
      const requiredLeave = ["EpisodioID", "PersonaID", "FechaInicio"];
      const missingLeave = requiredLeave.filter((field) => !config.bajasMapping[field]);
      if (missingLeave.length) throw new Error(`Falta mapear en Bajas médicas: ${missingLeave.join(", ")}.`);
    }
    const distributionDir = process.env.PORTABLE_EXECUTABLE_DIR || (app.isPackaged ? path.dirname(process.execPath) : path.resolve(__dirname, ".."));
    const outputDir = path.join(distributionDir, "datos-procesados");
    const reportDir = path.join(outputDir, "PowerBI");
    const result = core.convertWorkbook({ ...config, outputDir });
    try {
      const pbip = ensurePowerBiProject(reportDir, outputDir, config.edition);
      result.palette = core.applyPowerBiPalette(reportDir, config.colors);
      const openError = await shell.openPath(pbip);
      result.powerBiOpened = !openError;
      result.powerBiError = openError || "";
    } catch (error) {
      result.powerBiOpened = false;
      result.powerBiError = `No se pudo crear el proyecto PBIP: ${error.message || String(error)}`;
    }
    return result;
  });

  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.exit(0);
});
