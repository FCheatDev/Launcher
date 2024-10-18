// preload.js
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),
});

contextBridge.exposeInMainWorld('electron', {
    openExternalLink: (url) => ipcRenderer.send('open-external-link', url),
});
