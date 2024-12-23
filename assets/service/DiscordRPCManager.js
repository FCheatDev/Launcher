// assets/service/DiscordRPCManager.js
const DiscordRPC = require('discord-rpc');
const logger = require('./logger');

class DiscordRPCManager {
    constructor() {
        this.clientId = '1320720408911024128'; // 替換為你的 Discord 應用 ID
        this.client = new DiscordRPC.Client({ transport: 'ipc' });
        this.isConnected = false;
        this.startTimestamp = Date.now();
    }

    async initialize() {
     try {
         logger.system('Initializing Discord RPC');
         // 延遲 2 秒再連接，確保 Discord 客戶端已完全載入
         setTimeout(async () => {
             await this.connect();
             this.setupPresence();
             this.setupEventHandlers();
         }, 2000);
     } catch (error) {
         logger.error('Failed to initialize Discord RPC:', error);
     }
 }

 async connect() {
     try {
         logger.system('Attempting to connect to Discord RPC...');
         console.log('Checking Discord client status...');
         
         // 檢查 Discord 客戶端是否運行
         if (!this.client) {
             throw new Error('Discord RPC client not initialized');
         }
 
         console.log('Attempting login with Client ID:', this.clientId);
         await this.client.login({ clientId: this.clientId });
         
         // 成功連接後
         this.isConnected = true;
         logger.system('Discord RPC connected successfully');
         
         // 立即設置初始活動
         await this.updateActivity({
             details: 'Just launched',
             state: 'In main menu',
             startTimestamp: Date.now()
         });
         
     } catch (error) {
         logger.error('Discord RPC Connection Error:', {
             error: error.message,
             stack: error.stack
         });
         this.isConnected = false;
         
         // 嘗試重新連接
         setTimeout(() => {
             if (!this.isConnected) {
                 logger.system('Attempting to reconnect Discord RPC...');
                 this.connect();
             }
         }, 10000); // 10 秒後重試
     }
 }

    setupEventHandlers() {
        this.client.on('ready', () => {
            logger.system('Discord RPC is ready');
            // 立即更新活動
            this.updateActivity().catch(err => {
                logger.error('Failed to update initial activity:', err);
            });
        });

        this.client.on('disconnected', () => {
            logger.system('Discord RPC disconnected');
            this.isConnected = false;
        });
    }

    async updateActivity(activityData = {}) {
     if (!this.isConnected) {
         logger.system('Discord RPC not connected, skipping activity update');
         return;
     }

     try {
         const activity = {
             details: 'FCheat Launcher',           // 只顯示 FCheat Launcher
             largeImageKey: 'app_logo',            // 主圖示
             largeImageText: 'FCheat Launcher',    // 圖示提示文字
             startTimestamp: this.startTimestamp,  // 保留時間顯示
             instance: false
         };

         await this.client.setActivity(activity);
         logger.system('Discord RPC activity updated');
     } catch (error) {
         logger.error('Failed to update Discord RPC activity:', error);
     }
 }

    setupPresence() {
        logger.system('Setting up Discord RPC presence');
        this.defaultActivity = {
            details: 'Using FCheat Launcher',
            state: 'Browsing Scripts',
            startTimestamp: this.startTimestamp,
            largeImageKey: 'app_logo',
            largeImageText: 'FCheat Launcher',
            smallImageKey: 'status_icon',
            smallImageText: 'Online',
            instance: false
        };
        logger.system('Default activity set:', JSON.stringify(this.defaultActivity));
    }



    destroy() {
        if (this.client) {
            this.client.destroy();
            this.isConnected = false;
            logger.system('Discord RPC destroyed');
        }
    }
}

module.exports = new DiscordRPCManager();