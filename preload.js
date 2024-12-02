const { contextBridge, ipcRenderer } = require('electron');
const { version } = require('./package.json');

contextBridge.exposeInMainWorld('electronAPI', {
    // 視窗控制
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),
    fullscreenWindow: () => {
        console.log('Sending toggle-fullscreen event'); 
        ipcRenderer.send('toggle-fullscreen');
    },
    // 菜單視窗
    openMenuWindow: () => {
        console.log('Sending open-menu-window event');
        ipcRenderer.send('open-menu-window');
    },
    // 菜單視窗控制
    menuWindow: {
        minimize: () => ipcRenderer.send('minimize-menu-window'),
        close: () => ipcRenderer.send('close-menu-window')
    },
    adBlock: {
        toggle: (enabled) => ipcRenderer.send('toggle-ad-blocking', enabled)
    },
    returnHome: () => ipcRenderer.send('return-home')
});

// 外部連結
contextBridge.exposeInMainWorld('electron', {
    openExternalLink: (url) => ipcRenderer.send('open-external-link', url)
});

// 日誌和版本信息
contextBridge.exposeInMainWorld('appInfo', {
    version: version
});

// 監聽事件
ipcRenderer.on('menu-window-status', (event, status) => {
    console.log('Menu window status:', status);
});

contextBridge.exposeInMainWorld('gameAPI', {
    checkInstalled: (gameId) => ipcRenderer.invoke('check-game-installed', gameId),
    launch: (gameId) => ipcRenderer.invoke('launch-game', gameId)
});


















ipcRenderer.on('log-update', (event, logMessage) => {
    console.log("收到日誌：", logMessage);
    const logElement = document.getElementById('logDisplay');
    if (logElement) {
        logElement.innerText += logMessage + "\n";
    }
});
