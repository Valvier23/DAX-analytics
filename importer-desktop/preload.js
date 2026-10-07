const { contextBridge, ipcRenderer, webUtils } = require("electron");

contextBridge.exposeInMainWorld("peopleAnalytics", {
  chooseFile: (language) => ipcRenderer.invoke("choose-file", language),
  analyze: (filePath, language) => ipcRenderer.invoke("analyze", filePath, language),
  convert: (config) => ipcRenderer.invoke("convert", config),
  listProfiles: () => ipcRenderer.invoke("profiles:list"),
  loadProfile: (name) => ipcRenderer.invoke("profiles:load", name),
  saveProfile: (name, profile, language) => ipcRenderer.invoke("profiles:save", name, profile, language),
  filePath: (file) => webUtils.getPathForFile(file)
});
