const { app, BrowserWindow, ipcMain, shell, globalShortcut, screen, dialog, webRequest, session } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { spawn } = require('child_process');




/*-----------------------------------參數 -------------------------------------------------*/ 

let adBlockEnabled = false;
let mainWindow;
let menuWindow = null;
let isUpdateAvailable = false;


const currentVersion = '0.0.0'; 
const installPath = path.join(app.getPath('userData'), 'updates');

/*-----------------------------------創建主視窗 -------------------------------------------------*/ 
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 1200,
        minHeight: 912,
        minWidth:1227,
        frame: false,
        movable: true,
        resizable:true,
        fullscreenable: true, 
        icon: path.join(__dirname, 'images/app-logo-nobg.ico'),
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
    mainWindow.on('resize', () => {
        const { width, height } = mainWindow.getBounds();
        //console.log(`Current window size: ${width}x${height}`);
    });

    // 註冊全局快捷鍵
    globalShortcut.register('Control+Shift+I', () => {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    });

    // 建立菜單視窗
    createMenuWindow();
}
/*-----------------------------------創建菜單視窗 -------------------------------------------------*/ 
function createMenuWindow() {
    menuWindow = new BrowserWindow({
        width: 165,
        height: 200,
        frame: false,
        transparent: true,
        icon: path.join(__dirname, 'images/app-logo-nobg.ico'),
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
/*-----------------------------------設定 IPC 事件處理邏輯 -------------------------------------------------*/ 
function setupIpcHandlers() {
    ipcMain.on('minimize-window', () => mainWindow.minimize());
    ipcMain.on('close-window', () => mainWindow.close());
    ipcMain.on('open-menu-window', () => {if (!menuWindow) createMenuWindow();});
    ipcMain.on('close-menu-window', () => {if (menuWindow) menuWindow.close();});
    ipcMain.on('return-home', () => mainWindow.loadFile('launcher.html'));
    ipcMain.on('open-external-link', (event, url) => shell.openExternal(url));
    ipcMain.on('toggle-ad-blocking', (event, shouldEnable) => {adBlockEnabled = shouldEnable;  setupAdBlock(); const message = adBlockEnabled ? "廣告攔截已啟用" : "廣告攔截已禁用";event.reply('ad-block-status', message); });
    ipcMain.on('toggle-fullscreen', () => {if (mainWindow) {const isMaximized = mainWindow.isMaximized();if (!isMaximized) {mainWindow.setFullScreen(false);  mainWindow.setResizable(true); mainWindow.maximize();mainWindow.setMenuBarVisibility(false); } else { mainWindow.unmaximize();mainWindow.setMenuBarVisibility(true);}}}); 
    mainWindow.on('resize', () => {const { width, height } = mainWindow.getBounds();/*console.log(`Current window size: ${width}x${height}`);*/mainWindow.webContents.send('window-resized', { width, height });});









}
/*-----------------------------------初始化並檢測菜單視窗的位置 -------------------------------------------------*/ 
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
/*-----------------------------------獲取版本號 -------------------------------------------------*/
function getLocalVersion() {
    const packagePath = path.join(__dirname, 'package.json'); // 指定package.json路径
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8')); // 读取并解析JSON
    return packageJson.version; // 返回版本号
}
const localVersion = getLocalVersion();
console.log(`Current Version: ${localVersion}`);

/*-----------------------------------ADBLOCK -------------------------------------------------*/
function setupAdBlock() {
    const adBlockList = [
        '*://*.doubleclick.net/*',
        '*://*.googlesyndication.com/*',
        '*://*.adservice.google.com/*',
        '*://*.ads.yahoo.com/*',
        '*://*.adnxs.com/*',
        '*://*/*.ads/*',
        '*://*/*popup*',
        '*://*/*.ad',
    ];

    // 清除之前的攔截器，以免重複設置
    session.defaultSession.webRequest.onBeforeRequest(null);

    // 判斷廣告攔截是否啟用
    if (adBlockEnabled) {
        session.defaultSession.webRequest.onBeforeRequest({ urls: adBlockList }, (details, callback) => {
            // 僅攔截廣告相關的外部連結請求
            callback({ cancel: true }); // 取消匹配的請求
        });

        dialog.showMessageBoxSync({
            type: 'info',
            title: '廣告攔截器',
            message: '廣告攔截已啟用'
        });
    } else {
        dialog.showMessageBoxSync({
            type: 'info',
            title: '廣告攔截器',
            message: '廣告攔截已禁用'
        });
    }
}

// 控制按鈕開關 adBlockEnabled 狀態，並重新加載攔截器
function toggleAdBlock() {
    adBlockEnabled = !adBlockEnabled;
    setupAdBlock();
}
/*-----------------------------------DOWNLOAD AND UPDATE APP -------------------------------------------------*/
async function checkForUpdates() {
    try {
        const response = await axios.get('https://api.github.com/repos/FCheatDev/Launcher/releases/latest');
        const latestRelease = response.data;
        const latestVersion = latestRelease.tag_name; // 例如 '1.1.1'
        const remoteVersion = latestVersion.replace('v', ''); // 去掉版本前的 'v'

        if (remoteVersion > localVersion) {
            console.log(`There is a new version: ${latestVersion}, prompting user...`);
            isUpdateAvailable = true; // 设置标志位为 true

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
/*-----------------------------------初始化應用 -------------------------------------------------*/
app.whenReady().then(async () => {
    await checkForUpdates(); // 等待更新检查完成

    if (!isUpdateAvailable) { // 只有在没有更新的情况下才执行以下操作
        createWindow();
        setupIpcHandlers();
        monitorMenuPosition();
    }
});
// 註銷所有全局快捷鍵
app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
