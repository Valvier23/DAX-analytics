const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const core = require("./core");

app.disableHardwareAcceleration();

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
    const outputDir = path.join(process.env.SystemDrive || "C:", "PeopleAnalyticsDaxKit", "datos-ejemplo");
    const result = core.convertWorkbook({ ...config, outputDir });
    const base = app.isPackaged ? path.dirname(process.execPath) : path.resolve(__dirname, "..");
    const candidates = [
      path.join(base, "PowerBI", "People Analytics DAX Kit.pbip"),
      path.join(base, "kit-free", "PowerBI", "People Analytics DAX Kit.pbip"),
      path.join(base, "People Analytics DAX Kit.pbip")
    ];
    const pbip = candidates.find(fs.existsSync);
    if (pbip) {
      const openError = await shell.openPath(pbip);
      result.powerBiOpened = !openError;
      result.powerBiError = openError || "";
    } else {
      result.powerBiOpened = false;
      result.powerBiError = "No se encontró el archivo PBIP junto al ejecutable.";
    }
    return result;
  });

  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.exit(0);
});
