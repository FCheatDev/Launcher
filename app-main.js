const { app, BrowserWindow, ipcMain, shell, globalShortcut, screen, dialog } = require('electron');

const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { spawn } = require('child_process');
const currentVersion = '0.0.0';  // 本地版本號
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
//-------------------------------------------------Start Wave Executor-------------------------------------------------

/*-----------------------------------GET VERSION -------------------------------------------------*/ 
// 获取本地版本号
function getLocalVersion() {
    const packagePath = path.join(__dirname, 'package.json'); // 指定package.json路径
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8')); // 读取并解析JSON
    return packageJson.version; // 返回版本号
}

// 示例：获取本地版本号
const localVersion = getLocalVersion();
console.log(`Current Version: ${localVersion}`);


/*-----------------------------------CHECK UPDATE -------------------------------------------------*/ 
async function checkForUpdates() {
    try {
        const response = await axios.get('https://api.github.com/repos/FCheatDev/Launcher/releases/latest');
        const latestRelease = response.data;
        const latestVersion = latestRelease.tag_name; // 例如 '1.1.1'
        const remoteVersion = latestVersion.replace('v', ''); // 去掉版本前的 'v'

        if (remoteVersion > localVersion) {
            console.log(`There is a new version: ${latestVersion}, prompting user...`);

            // 弹出对话框
            const result = await dialog.showMessageBox(mainWindow, {
                type: 'info',
                buttons: ['更新'],
                title: '發現新版本',
                message: `新版本: ${latestVersion}`,
            });
            await dialog.showMessageBox(mainWindow, {
                type: 'info',
                buttons: ['確定'],
                title: 'INFO',
                message: `請等待,APP正在更新....`,
            });
            // 当用户点击“更新”按钮时执行下载逻辑
            if (result.response === 0) { // 0 表示“更新”按钮
                await downloadAndUpdate(latestRelease);
            }
        } else {
            console.log('No update available.');
        }
    } catch (error) {
        console.error('Error checking for updates:', error);
    }
}

// 下载和更新的逻辑提取到一个新的函数中
async function downloadAndUpdate(latestRelease) {
    const asset = latestRelease.assets.find(asset => asset.name.endsWith('.exe'));
    if (asset) {
        const downloadUrl = asset.browser_download_url;

        if (!fs.existsSync(installPath)) {
            fs.mkdirSync(installPath);
        }

        const filePath = path.join(installPath, asset.name);
        const writer = fs.createWriteStream(filePath);

        const response = await axios.get(downloadUrl, { responseType: 'stream' });
        response.data.pipe(writer);

        writer.on('finish', () => {
            console.log('Download completed, start update...');

            const updateProcess = spawn(filePath, { detached: true, shell: true });

            updateProcess.on('error', (error) => {
                console.error('Error launching the update:', error);
            });

            updateProcess.on('exit', (code) => {
                console.log(`Update process exited with code: ${code}`);
            });

            updateProcess.unref(); // 允许主进程继续执行
            app.quit(); // 结束主进程
        });

        writer.on('error', (error) => {
            console.error('Download failed:', error);
        });
    } else {
        console.log('No .exe file found in the latest release.');
    }
}













// 初始化應用
app.whenReady().then(() => {
    createWindow();
    setupIpcHandlers();
    monitorMenuPosition();
    checkForUpdates();
});









// 註銷所有全局快捷鍵
app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

