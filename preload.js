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
    launch: (gameId) => ipcRenderer.invoke('launch-game', gameId),
    downloadExecutor: (gameId) => ipcRenderer.invoke('download-executor', gameId)
});
contextBridge.exposeInMainWorld('themeAPI', {
    // 發送主題變更事件
    changeTheme: (theme) => ipcRenderer.send('theme-change', theme),
    
    // 註冊主題變更監聽器
    onThemeChange: (callback) => {
        const handler = (event, theme) => callback(theme);
        ipcRenderer.on('theme-changed', handler);
        // 返回清理函數
        return () => ipcRenderer.removeListener('theme-changed', handler);
    },
    
    // 獲取初始主題
    getInitialTheme: async () => {
        try {
            const savedTheme = localStorage.getItem('fcheat-theme');
            if (savedTheme) return savedTheme;
            
            // 如果本地沒有保存的主題，從主窗口獲取
            return await ipcRenderer.invoke('get-initial-theme');
        } catch (error) {
            console.error('Failed to get initial theme:', error);
            return 'dark'; // 默認主題
        }
    }
});















ipcRenderer.on('log-update', (event, logMessage) => {
    console.log("收到日誌：", logMessage);
    const logElement = document.getElementById('logDisplay');
    if (logElement) {
        logElement.innerText += logMessage + "\n";
    }
});
