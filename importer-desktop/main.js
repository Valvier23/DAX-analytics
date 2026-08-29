const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const core = require("./core");

app.disableHardwareAcceleration();

function ensurePowerBiProject(projectDir, outputDir) {
  const targetPbip = path.join(projectDir, "People Analytics DAX Kit.pbip");
  const bundledDirs = app.isPackaged
    ? [path.join(process.resourcesPath, "PowerBI"), path.join(path.dirname(process.execPath), "resources", "PowerBI")]
    : [path.resolve(__dirname, "..", "kit-free", "PowerBI")];
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
  ];
  for (const [fileName, csvName] of sources) {
    const definition = path.join(projectDir, "People Analytics DAX Kit.SemanticModel", "definition", "tables", fileName);
    const source = fs.readFileSync(definition, "utf8");
    const updated = source.replace(/File\.Contents\("[^"]+"\)/, `File.Contents("${path.join(outputDir, csvName)}")`);
    fs.writeFileSync(definition, updated, "utf8");
  }
  if (!fs.existsSync(targetPbip)) throw new Error("No se pudo copiar el proyecto Power BI en la carpeta de datos.");
  return targetPbip;
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
    const projectDir = process.env.PORTABLE_EXECUTABLE_DIR || (app.isPackaged ? path.dirname(process.execPath) : path.resolve(__dirname, "..", "kit-free"));
    const outputDir = path.join(projectDir, "datos-ejemplo");
    const result = core.convertWorkbook({ ...config, outputDir });
    try {
      const pbip = ensurePowerBiProject(projectDir, outputDir);
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
