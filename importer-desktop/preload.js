const { contextBridge, ipcRenderer, webUtils } = require("electron");

contextBridge.exposeInMainWorld("peopleAnalytics", {
  chooseFile: () => ipcRenderer.invoke("choose-file"),
  analyze: (filePath) => ipcRenderer.invoke("analyze", filePath),
  convert: (config) => ipcRenderer.invoke("convert", config),
  listProfiles: () => ipcRenderer.invoke("profiles:list"),
  loadProfile: (name) => ipcRenderer.invoke("profiles:load", name),
  saveProfile: (name, profile) => ipcRenderer.invoke("profiles:save", name, profile),
  filePath: (file) => webUtils.getPathForFile(file)
});
