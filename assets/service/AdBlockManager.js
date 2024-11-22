const { session, dialog } = require('electron');
const CONFIG = require('../../config/config');
const logger = require('./logger');
const windowManager = require('./WindowManager');

class AdBlockManager {
    constructor() {
        this.isEnabled = false;
        this.rules = CONFIG.AD_BLOCK.RULES;
    }

    /**
     * 初始化廣告攔截管理器
     */
    initialize() {
        this._setupRequestHandler();
        logger.adblock('Ad block manager initialized');
    }

    /**
     * 初始化請求處理器
     */
    _setupRequestHandler() {
        // 清除之前的攔截器
        session.defaultSession.webRequest.onBeforeRequest(null);
    }

    /**
     * 啟用廣告攔截
     */
    enable() {
        this.isEnabled = true;
        this._setupRequestHandler();

        // 設置請求攔截
        session.defaultSession.webRequest.onBeforeRequest(
            { urls: this.rules },
            (details, callback) => {
                logger.adblock(`Blocked request to: ${details.url}`);
                callback({ cancel: true });
            }
        );

        this._showStatusMessage(true);
        logger.adblock('Ad blocking enabled');
    }

    /**
     * 禁用廣告攔截
     */
    disable() {
        this.isEnabled = false;
        this._setupRequestHandler();
        this._showStatusMessage(false);
        logger.adblock('Ad blocking disabled');
    }

    /**
     * 切換廣告攔截狀態
     */
    toggle() {
        if (this.isEnabled) {
            this.disable();
        } else {
            this.enable();
        }
        return this.isEnabled;
    }

    /**
     * 顯示狀態消息
     * @param {boolean} enabled - 是否啟用
     */
    async _showStatusMessage(enabled) {
        // 保存當前菜單窗口的引用
        const menuWindow = windowManager.menuWindowInstance;
        
        try {
            await dialog.showMessageBox(windowManager.mainWindowInstance, {
                type: 'info',
                title: '廣告攔截器',
                message: enabled 
                    ? '廣告攔截已啟用。此功能還在開發中,只能擋掉一小部分'
                    : '廣告攔截已禁用'
            });
            
            // 如果之前菜單窗口存在，則重新創建
            if (menuWindow) {
                windowManager.createMenuWindow();
            }
        } catch (err) {
            logger.error('Error showing ad block status message:', err);
        }
    }

    /**
     * 添加自定義規則
     * @param {string} rule - 新規則
     */
    addRule(rule) {
        if (!this.rules.includes(rule)) {
            this.rules.push(rule);
            logger.adblock(`New ad blocking rule added: ${rule}`);
            if (this.isEnabled) {
                this.enable(); // 重新啟用以應用新規則
            }
        }
    }

    /**
     * 移除規則
     * @param {string} rule - 要移除的規則
     */
    removeRule(rule) {
        const index = this.rules.indexOf(rule);
        if (index > -1) {
            this.rules.splice(index, 1);
            logger.adblock(`Ad blocking rule removed: ${rule}`);
            if (this.isEnabled) {
                this.enable(); // 重新啟用以應用新規則
            }
        }
    }

    /**
     * 獲取當前狀態
     */
    getStatus() {
        return {
            enabled: this.isEnabled,
            rulesCount: this.rules.length,
            rules: this.rules
        };
    }

    /**
     * 重置為默認設置
     */
    resetToDefaults() {
        this.rules = CONFIG.AD_BLOCK.RULES;
        logger.adblock('Ad blocking rules reset to defaults');
        if (this.isEnabled) {
            this.enable(); // 重新啟用以應用默認規則
        }
    }
}

// 導出單例
module.exports = new AdBlockManager();