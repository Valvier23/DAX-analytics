const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const core = require("./core");
const {t} = require("./locale");

app.disableHardwareAcceleration();

function ensurePowerBiProject(projectDir, outputDir, edition = "demo", reportLanguage = "en") {
  const template = edition === "plus" ? "PowerBIPlus" : "PowerBI";
  const bundledDirs = app.isPackaged
    ? [path.join(process.resourcesPath, template), path.join(path.dirname(process.execPath), "resources", template)]
    : [path.resolve(__dirname, "..", edition === "plus" ? "kit-plus" : "kit-free", "PowerBI")];
  const templateDir = bundledDirs.find(dir => fs.existsSync(path.join(dir, "People Analytics DAX Kit.pbip")));
  if (!templateDir) throw new Error("No se encontró el proyecto Power BI incluido en el importador.");
  return require("./report-project").createPowerBiProject({templateDir, projectDir, outputDir, edition, reportLanguage});
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
  ipcMain.handle("profiles:save", (_event, name, profile, language) => {
    if (!/^[\p{L}\p{N} _.-]{1,60}$/u.test(name || "")) throw new Error(t("El nombre del perfil no es válido.",language));
    const profiles = readProfiles(); profiles[name] = profile;
    fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2), "utf8");
    return Object.keys(profiles).sort();
  });
  ipcMain.handle("choose-file", async (_event, language) => {
    const result = await dialog.showOpenDialog({
      title: t("Selecciona el Excel de People Analytics",language),
      properties: ["openFile"],
      filters: [{ name: t("Archivos Excel",language), extensions: ["xlsx", "xls"] }]
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle("analyze", async (_event, filePath, language) => {
    if (!filePath || !fs.existsSync(filePath)) throw new Error(t("No se encuentra el archivo seleccionado.",language));
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
    if (missingPeople.length) throw new Error(t("Falta mapear en Personas: {fields}.",config.appLanguage,{fields:missingPeople.map(f=>t(f,config.appLanguage)).join(", ")}));
    if (config.bajasSheet) {
      const requiredLeave = ["EpisodioID", "PersonaID", "FechaInicio"];
      const missingLeave = requiredLeave.filter((field) => !config.bajasMapping[field]);
      if (missingLeave.length) throw new Error(t("Falta mapear en Bajas médicas: {fields}.",config.appLanguage,{fields:missingLeave.map(f=>t(f,config.appLanguage)).join(", ")}));
    }
    const distributionDir = process.env.PORTABLE_EXECUTABLE_DIR || (app.isPackaged ? path.dirname(process.execPath) : path.resolve(__dirname, ".."));
    const outputDir = path.join(distributionDir, "datos-procesados");
    fs.mkdirSync(outputDir, {recursive:true});
    const reportDir = fs.mkdtempSync(path.join(outputDir, "PowerBI-"));
    const result = core.convertWorkbook({ ...config, outputDir });
    try {
      const pbip = ensurePowerBiProject(reportDir, outputDir, config.edition, config.reportLanguage);
      result.palette = core.applyPowerBiPalette(reportDir, config.colors);
      const openError = await shell.openPath(pbip);
      result.powerBiOpened = !openError;
      result.powerBiError = openError || "";
    } catch (error) {
      result.powerBiOpened = false;
      result.powerBiError = t("No se pudo crear el proyecto PBIP: {error}",config.appLanguage,{error:t(error.message || String(error),config.appLanguage)});
    }
    return result;
  });

  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.exit(0);
});
