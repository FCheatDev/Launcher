// menu-preload.js
const { contextBridge, ipcRenderer } = require('electron');

console.log('Menu preload script loaded');

contextBridge.exposeInMainWorld('menuAPI', {
    minimize: () => ipcRenderer.send('minimize-menu-window'),
    close: () => ipcRenderer.send('close-menu-window'),
    toggleAdBlock: (enabled) => ipcRenderer.send('toggle-ad-blocking', enabled),
    returnHome: () => ipcRenderer.send('return-home'),
    onAdBlockStatus: (callback) => ipcRenderer.on('ad-block-status', callback)
});