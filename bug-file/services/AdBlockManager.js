// services/AdBlockManager.js

const { session, dialog } = require('electron');
const CONFIG = require('../config/constants');

class AdBlockManager {
    constructor() {
        this.enabled = false;
        // 確保過濾規則的格式正確
        this.filters = {
            urls: CONFIG.adBlock.filters
        };
    }

    initialize() {
        console.log('Initializing AdBlock Manager...');
        this.setupBlocker();
    }

    toggle() {
        this.enabled = !this.enabled;
        this.setupBlocker();
        this.showStatusMessage();
        return this.enabled;
    }

    setupBlocker() {
        try {
            // 清除現有的請求攔截器
            session.defaultSession.webRequest.onBeforeRequest(null);

            if (this.enabled) {
                this.enableAdBlocking();
            }
        } catch (error) {
            console.error('Error setting up ad blocker:', error);
            this.enabled = false;
        }
    }

    enableAdBlocking() {
        try {
            // 確保過濾規則格式正確
            if (!this.filters.urls || !Array.isArray(this.filters.urls)) {
                throw new Error('Invalid filter format');
            }

            session.defaultSession.webRequest.onBeforeRequest(
                this.filters,
                (details, callback) => {
                    console.log('Blocked request:', details.url);
                    callback({ cancel: true });
                }
            );
        } catch (error) {
            console.error('Error enabling ad blocking:', error);
            this.enabled = false;
            this.showErrorMessage(error);
        }
    }

    showStatusMessage() {
        const message = this.enabled
            ? {
                type: 'info',
                title: '廣告攔截器',
                message: '廣告攔截已啟用。此功能還在開發中,只能擋掉一小部分'
            }
            : {
                type: 'info',
                title: '廣告攔截器',
                message: '廣告攔截已禁用'
            };

        dialog.showMessageBoxSync(message);
    }

    showErrorMessage(error) {
        dialog.showMessageBoxSync({
            type: 'error',
            title: '廣告攔截器錯誤',
            message: `啟用廣告攔截時發生錯誤: ${error.message}`
        });
    }

    // 新增廣告過濾規則
    addFilter(filter) {
        if (typeof filter === 'string' && !this.filters.urls.includes(filter)) {
            this.filters.urls.push(filter);
            if (this.enabled) {
                this.setupBlocker();
            }
        }
    }

    // 移除廣告過濾規則
    removeFilter(filter) {
        const index = this.filters.urls.indexOf(filter);
        if (index > -1) {
            this.filters.urls.splice(index, 1);
            if (this.enabled) {
                this.setupBlocker();
            }
        }
    }

    // 取得當前狀態
    getStatus() {
        return {
            enabled: this.enabled,
            filtersCount: this.filters.urls.length,
            activeFilters: this.filters.urls
        };
    }

    // 重置為預設設定
    reset() {
        this.enabled = false;
        this.filters = {
            urls: [...CONFIG.adBlock.filters]
        };
        this.setupBlocker();
    }

    // 清理方法
    cleanup() {
        try {
            session.defaultSession.webRequest.onBeforeRequest(null);
            console.log('AdBlock Manager cleaned up successfully');
        } catch (error) {
            console.error('Error cleaning up AdBlock Manager:', error);
        }
    }
}

module.exports = new AdBlockManager();