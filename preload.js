const { contextBridge, ipcRenderer } = require('electron');
const { version } = require('./package.json');
const path = require('path');

// Window Controls API
contextBridge.exposeInMainWorld('electronAPI', {
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),
    fullscreenWindow: () => {
        console.log('Sending toggle-fullscreen event'); 
        ipcRenderer.send('toggle-fullscreen');
    },
    openMenuWindow: () => {
        console.log('Sending open-menu-window event');
        ipcRenderer.send('open-menu-window');
    },
    menuWindow: {
        minimize: () => ipcRenderer.send('minimize-menu-window'),
        close: () => ipcRenderer.send('close-menu-window')
    },
    adBlock: {
        toggle: (enabled) => ipcRenderer.send('toggle-ad-blocking', enabled)
    },
    returnHome: () => ipcRenderer.send('return-home')
});

// External Links API
contextBridge.exposeInMainWorld('electron', {
    openExternalLink: (url) => ipcRenderer.send('open-external-link', url)
});

// App Info API
contextBridge.exposeInMainWorld('appInfo', {
    version: version,
    getPaths: () => ipcRenderer.invoke('get-install-paths'),
    openLogsFolder: () => ipcRenderer.invoke('open-logs-folder')
});

// Game API
contextBridge.exposeInMainWorld('gameAPI', {
    checkInstalled: (gameId) => ipcRenderer.invoke('check-game-installed', gameId),
    launch: (gameId) => ipcRenderer.invoke('launch-game', gameId),
    downloadExecutor: (gameId) => ipcRenderer.invoke('download-executor', gameId)
});

// Theme API
contextBridge.exposeInMainWorld('themeAPI', {
    changeTheme: (theme) => ipcRenderer.send('theme-change', theme),
    onThemeChange: (callback) => {
        const handler = (event, theme) => callback(theme);
        ipcRenderer.on('theme-changed', handler);
        return () => ipcRenderer.removeListener('theme-changed', handler);
    },
    getInitialTheme: async () => {
        try {
            const savedTheme = localStorage.getItem('fcheat-theme');
            if (savedTheme) return savedTheme;
            return await ipcRenderer.invoke('get-initial-theme');
        } catch (error) {
            console.error('Failed to get initial theme:', error);
            return 'dark';
        }
    }
});

// System API
contextBridge.exposeInMainWorld('systemAPI', {
    onOptimizeMemory: (callback) => {
        ipcRenderer.on('optimize-memory', () => callback());
    }
});

// Log API
ipcRenderer.on('log-update', (event, logMessage) => {
    console.log("收到日誌：", logMessage);
    const logElement = document.getElementById('logDisplay');
    if (logElement) {
        logElement.innerText += logMessage + "\n";
    }
});