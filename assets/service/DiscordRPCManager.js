const DiscordRPC = require('discord-rpc');
const logger = require('./logger');
const Store = require('electron-store');
const store = new Store();

class DiscordRPCManager {
    constructor() {
        this.clientId = '1320720408911024128';
        this.client = null;
        this.isConnected = false;
        this.startTimestamp = Date.now();
        this.enabled = store.get('discord-rpc-enabled', true);
        this.lastToggleTime = 0;
        this.reconnectAttempts = 0;
    }

    async initialize() {
        if (!this.enabled) {
            logger.system('Discord RPC is disabled by user settings');
            return;
        }

        try {
            logger.system('Initializing Discord RPC');
            if (!this.client) {
                this.client = new DiscordRPC.Client({ transport: 'ipc' });
            }

            setTimeout(async () => {
                await this.connect();
                this.setupEventHandlers();
                this.setupPresence();
            }, 2000);
        } catch (error) {
            logger.error('Failed to initialize Discord RPC:', error);
            this.reconnectAttempts++;
            if (this.reconnectAttempts < 3) {
                setTimeout(() => this.initialize(), 5000);
            }
        }
    }

    async connect() {
        if (!this.enabled || !this.client) return;

        try {
            logger.system('Attempting to connect to Discord RPC...');
            await this.client.login({ clientId: this.clientId });
            
            this.isConnected = true;
            this.reconnectAttempts = 0;
            logger.system('Discord RPC connected successfully');
            
            await this.updateActivity();
        } catch (error) {
            logger.error('Discord RPC Connection Error:', error);
            this.isConnected = false;
            
            if (this.enabled) {
                setTimeout(() => {
                    if (!this.isConnected && this.reconnectAttempts < 3) {
                        this.reconnectAttempts++;
                        this.connect();
                    }
                }, 5000);
            }
        }
    }

    setupEventHandlers() {
        if (!this.client) return;

        this.client.on('ready', () => {
            logger.system('Discord RPC is ready');
            this.updateActivity();
        });

        this.client.on('disconnected', () => {
            logger.system('Discord RPC disconnected');
            this.isConnected = false;
            if (this.enabled && this.reconnectAttempts < 3) {
                this.reconnectAttempts++;
                setTimeout(() => this.connect(), 5000);
            }
        });
    }

    async updateActivity() {
        if (!this.isConnected || !this.client) {
            logger.system('Discord RPC not connected, skipping activity update');
            return;
        }

        try {
            const activity = {
                details: 'FCheat Launcher',
                largeImageKey: 'app_logo',
                largeImageText: 'FCheat Launcher',
                startTimestamp: this.startTimestamp,
                instance: false
            };

            await this.client.setActivity(activity);
            logger.system('Discord RPC activity updated');
        } catch (error) {
            logger.error('Failed to update Discord RPC activity:', error);
        }
    }

    async toggle(enabled) {
        const now = Date.now();
        if (now - this.lastToggleTime < 2000) {
            logger.system('Toggle request ignored - cooldown active');
            return;
        }
        this.lastToggleTime = now;

        this.enabled = enabled;
        store.set('discord-rpc-enabled', enabled);
        
        if (enabled) {
            logger.system('Enabling Discord RPC');
            this.destroy();
            this.reconnectAttempts = 0;
            await this.initialize();
        } else {
            logger.system('Disabling Discord RPC');
            this.destroy();
        }
    }

    destroy() {
        if (this.client) {
            this.client.destroy().catch(error => {
                logger.error('Error destroying Discord RPC client:', error);
            });
            this.client = null;
            this.isConnected = false;
            logger.system('Discord RPC destroyed');
        }
    }

    getStatus() {
        return {
            enabled: this.enabled,
            connected: this.isConnected
        };
    }
}

module.exports = new DiscordRPCManager();