// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// 暴露到渲染進程的 API
contextBridge.exposeInMainWorld('electronAPI', {
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),
    menuWindow: () => ipcRenderer.send('open-menu-window'), // 這裡修正 ipcRenderer
});

contextBridge.exposeInMainWorld('electron', {
    openExternalLink: (url) => ipcRenderer.send('open-external-link', url),
});
