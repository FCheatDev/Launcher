const { app, BrowserWindow, ipcMain, shell, globalShortcut, screen } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let menuWindow = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 1200,
        frame: false,
        movable: true,
        resizable: false,
        fullscreenable: false,
        icon: path.join(__dirname, 'images/app-logo.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: true,
        },
    });

    mainWindow.loadFile('launcher.html').catch(err => {
        console.error('Error loading HTML file:', err);
    });

    // 禁止最大化
    mainWindow.on('maximize', () => {
        mainWindow.unmaximize();
    });

    // 註冊全局快捷鍵
    globalShortcut.register('Control+Shift+I', () => {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    });

    // 建立菜單視窗
    createMenuWindow();
}

// 創建菜單視窗
function createMenuWindow() {
    menuWindow = new BrowserWindow({
        width: 165,
        height: 200,
        frame: false,
        transparent: true,
        fullscreenable: false,
        maximizable: false,
        alwaysOnTop: true,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    menuWindow.loadFile('menu.html').catch(err => {
        console.error('Error loading menu file:', err);
    });

    menuWindow.on('closed', () => {
        menuWindow = null;
    });
}

// 設定 IPC 事件處理邏輯
function setupIpcHandlers() {
    ipcMain.on('minimize-window', () => mainWindow.minimize());
    ipcMain.on('close-window', () => mainWindow.close());
    ipcMain.on('open-menu-window', () => {
        if (!menuWindow) createMenuWindow();
    });
    ipcMain.on('close-menu-window', () => {
        if (menuWindow) menuWindow.close();
    });
    ipcMain.on('return-home', () => mainWindow.loadFile('launcher.html'));
    ipcMain.on('open-external-link', (event, url) => shell.openExternal(url));
}

// 初始化並檢測菜單視窗的位置
function monitorMenuPosition() {
    setInterval(() => {
        if (menuWindow) {
            const { x, y, width, height } = menuWindow.getBounds();
            const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

            // 限制菜單視窗的位置在顯示器邊界內
            const newX = Math.min(Math.max(x, 0), screenWidth - width);
            const newY = Math.min(Math.max(y, 0), screenHeight - height);
            if (newX !== x || newY !== y) menuWindow.setBounds({ x: newX, y: newY });
        }
    }, 100);
}

// 初始化應用
app.whenReady().then(() => {
    createWindow();
    setupIpcHandlers();
    monitorMenuPosition();
});

// 註銷所有全局快捷鍵
app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});