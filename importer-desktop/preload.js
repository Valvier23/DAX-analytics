const { contextBridge, ipcRenderer, webUtils } = require("electron");

contextBridge.exposeInMainWorld("peopleAnalytics", {
  chooseFile: () => ipcRenderer.invoke("choose-file"),
  analyze: (filePath) => ipcRenderer.invoke("analyze", filePath),
  convert: (config) => ipcRenderer.invoke("convert", config),
  filePath: (file) => webUtils.getPathForFile(file)
});
