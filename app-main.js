const { app, BrowserWindow, ipcMain, shell, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let menuWindow;

function createWindow() {
    // 創建主視窗
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
            nodeIntegration: false
        },
    });

    // 加载 HTML 文件
    mainWindow.loadFile('launcher.html').catch(err => {
        console.error('加载 HTML 文件时发生错误:', err);
    });

    // 禁止最大化
    mainWindow.on('maximize', () => {
        mainWindow.unmaximize();
    });

    // 監聽縮小與關閉按鈕的事件
    ipcMain.on('minimize-window', () => {
        mainWindow.minimize();
    });

    ipcMain.on('close-window', () => {
        mainWindow.close();
    });

    // 創建菜單視窗
    createMenuWindow();

    // 註冊全局快捷鍵
    globalShortcut.register('Control+Shift+I', () => {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    });
}

// 创建菜單視窗
function createMenuWindow() {
    menuWindow = new BrowserWindow({
        width: 150,
        height: 50,
        frame: false,
        transparent: true,
        fullscreenable: false, 
        maximizable: false,
        alwaysOnTop: true, // 菜單總是顯示在最上層
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // 加载菜单 HTML 文件
    menuWindow.loadFile('menu.html').catch(err => {
        console.error('加载菜单文件时发生错误:', err);
    });
    // 監聽關閉菜單窗口的請求
    ipcMain.on('close-menu-window', () => {
        if (menuWindow) {
            menuWindow.close();
        }
    });

    // 在關閉時將 `menuWindow` 設置為 `null`
    menuWindow.on('closed', () => {
        menuWindow = null;
    });
    // 禁止最大化
    mainWindow.on('maximize', () => {
        mainWindow.unmaximize();
    });
}

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// 確保文件夾存在，若不存在則創建
const programFilesPath = process.env.PROGRAMFILES || process.env.ProgramFiles;
const launcherDir = path.join(programFilesPath, 'FCheatLauncher');
const filePath = path.join(launcherDir, 'launcher_path.txt');

if (!fs.existsSync(launcherDir)) {
    fs.mkdirSync(launcherDir, { recursive: true });
}

const launcherPath = app.getPath('exe');

fs.promises.writeFile(filePath, launcherPath, 'utf-8')
    .then(() => {
        console.log('File Save on:', filePath);
    })
    .catch(err => {
        console.error('error:', err);
    });
