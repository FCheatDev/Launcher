console.log('Preload script loaded');
const { contextBridge, ipcRenderer } = require('electron');
const { version } = require('./package.json');

// 暴露到渲染進程的 API
contextBridge.exposeInMainWorld('electronAPI', {
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),
    menuWindow: () => ipcRenderer.send('open-menu-window'), 
    executePython: () => ipcRenderer.send('execute-python'),
    onPythonResponse: (callback) => ipcRenderer.on('execute-python-response', (event, response) => callback(response)),
    fullscreenWindow: () => {console.log('Sending toggle-fullscreen event'); ipcRenderer.send('toggle-fullscreen');},
    runFindSolara: () => ipcRenderer.send('run-find-solara'),
    runFindWave: () => ipcRenderer.send('run-find-wave'),
    runFindZorara: () => ipcRenderer.send('run-find-zorara')
});

contextBridge.exposeInMainWorld('electron', {
    openExternalLink: (url) => ipcRenderer.send('open-external-link', url),
});

ipcRenderer.on('log-update', (event, logMessage) => {
    console.log("收到日誌：", logMessage);
    const logElement = document.getElementById('logDisplay');
    if (logElement) {
        logElement.innerText += logMessage + "\n";
    } else {
        console.error("logDisplay element not found");
    }
});

/* Get Version */ 
contextBridge.exposeInMainWorld('appInfo', {
    version: version
});
