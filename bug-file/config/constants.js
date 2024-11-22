// config/constants.js

const path = require('path');
const { app } = require('electron');

/**
 * 應用程式全局常量配置
 */
const CONFIG = {
    // 應用程式基本設定
    app: {
        name: 'FCheat Launcher',
        currentVersion: '0.0.0',
        maxInstances: 1,
        updateCheckInterval: 1000 * 60 * 60, // 1小時檢查一次更新
    },

    // 視窗設定
    window: {
        main: {
            default: {
                width: 1400,
                height: 1200,
                minWidth: 400,
                minHeight: 300,
            },
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: true,
                enableRemoteModule: false,
            }
        },
        menu: {
            default: {
                width: 165,
                height: 200,
            }
        }
    },

    // 檔案路徑設定
    paths: {
        // 主要資料夾
        root: path.join(__dirname, '..'),
        assets: path.join(__dirname, '..', 'assets'),
        config: path.join(__dirname, '..', 'Config'),
        preload: path.join(__dirname, '..', 'preload.js'),
        
        // 圖片資源
        images: {
            appIcon: path.join(__dirname, '..', 'assets/images/app-logo-nobg.ico'),
        },

        // 遊戲相關
        games: {
            main: './Games',
            subFolders: ['Roblox', 'GenshinImpact', 'Minecraft'],
        },

        // 外掛執行檔
        executables: {
            solara: path.join(__dirname, '..', 'assets/get-files/roblox/get_solara_exec_path.exe'),
            wave: path.join(__dirname, '..', 'assets/get-files/roblox/get_wave_exec_path.exe'),
            zorara: path.join(__dirname, '..', 'assets/get-files/roblox/get_zorara_exec_path.exe')
        },

        // 更新相關
        updates: path.join(app.getPath('userData'), 'updates'),
    },

    // GitHub 設定
    github: {
        repo: {
            owner: 'FCheatDev',
            name: 'Launcher',
            releaseUrl: 'https://api.github.com/repos/FCheatDev/Launcher/releases/latest',
        }
    },

    // 廣告阻擋設定
    adBlock: {
        enabled: false,
        filters: [
          '*://*.doubleclick.net/*',
          '*://*.googlesyndication.com/*',
          '*://*.adservice.google.com/*',
          '*://*.ads.yahoo.com/*',
          '*://*.adnxs.com/*',
          '*://*/*.ads/*',
          '*://*/*popup*',
          '*://*/*.ad',
        ],
        customFilters: [], // 用戶自定義過濾規則
    },

    // 錯誤訊息
    errorMessages: {
        update: {
            checkFailed: '檢查更新失敗',
            downloadFailed: '下載更新失敗',
            installFailed: '安裝更新失敗',
        },
        instance: {
            tooMany: (name) => `${name} Executror 查找過多,請等待當前查找系統查找完再執行`
        }
    },

    // 系統訊息
    messages: {
        update: {
            checking: '正在檢查更新...',
            available: (version) => `發現新版本: ${version}`,
            downloading: '正在下載更新...',
            installing: '正在安裝更新...',
            completed: '更新完成',
            notAvailable: '目前已是最新版本',
        },
        adBlock: {
            enabled: '廣告攔截已啟用。此功能還在開發中,只能擋掉一小部分',
            disabled: '廣告攔截已禁用',
        }
    },

    // 開發者工具快捷鍵
    shortcuts: {
        devTools: 'Control+Shift+I',
    }
};

// 凍結配置防止意外修改
Object.freeze(CONFIG);

module.exports = CONFIG;