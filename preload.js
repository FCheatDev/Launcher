// preload.js
const { contextBridge, ipcRenderer } = require('electron');
const { version } = require('./package.json');
// 暴露到渲染進程的 API
contextBridge.exposeInMainWorld('electronAPI', {
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),
    menuWindow: () => ipcRenderer.send('open-menu-window'), // 這裡修正 ipcRenderer
});

contextBridge.exposeInMainWorld('electron', {
    openExternalLink: (url) => ipcRenderer.send('open-external-link', url),
});
ipcRenderer.on('log-update', (event, logMessage) => {
    console.log("收到日誌：", logMessage);
    // 將日誌顯示在界面上
    const logElement = document.getElementById('logDisplay');
    logElement.innerText += logMessage + "\n";
});
/*Get Version*/ 
contextBridge.exposeInMainWorld('appInfo', {
    version: version
  });