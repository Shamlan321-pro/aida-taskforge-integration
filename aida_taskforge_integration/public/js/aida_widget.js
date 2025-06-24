/**
 * AIDA AI Assistant Widget - Complete Implementation
 * Minimal monochromatic design, fully responsive, PWA-optimized
 * Works across all devices with reliable API connectivity
 */

class AidaWidget {
    constructor() {
        this.sessionId = null;
        this.apiSessionId = null;
        this.settings = this.getDefaultSettings();
        this.isConnected = false;
        this.isMobile = this.detectMobileDevice();
        this.isMinimized = true;
        this.typingTimeout = null;
        
        console.log('🚀 Initializing AIDA Widget...');
        this.init();
    }

    detectMobileDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        const isSmallScreen = window.innerWidth <= 768;
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        return isMobileUA || isSmallScreen || isTouchDevice;
    }

    getDefaultSettings() {
        // FIXED: Always use HTTPS API server as default
        return {
            apiUrl: 'https://api.taskforgehq.com',
            erpnextUrl: window.location.origin,
            googleApiKey: '',
            mongoUri: '',
            useManualAuth: false,
            username: frappe?.session?.user || 'Administrator',
            password: '',
            configured: false
        };
    }

    generateSessionId() {
        return 'aida_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async init() {
        try {
            // Remove service worker registration - not needed for this widget
            // await this.registerServiceWorker();
            await this.loadUserSession();
            await this.loadSettings();
            this.createWidget();
            this.bindEvents();
            this.setupResponsiveHandlers();
            
            if (this.settings.configured) {
                setTimeout(() => this.connectToAPI(), 1000);
            }
            
            console.log('✅ AIDA Widget initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize AIDA Widget:', error);
        }
    }

    // Remove the service worker registration method entirely
    // async registerServiceWorker() {
    //     if ('serviceWorker' in navigator) {
    //         try {
    //             const registration = await navigator.serviceWorker.register('/sw.js');
    //             console.log('✅ Service Worker registered');
    //         } catch (error) {
    //             console.log('⚠️ Service Worker registration failed:', error);
    //         }
    //     }
    // }

    async loadUserSession() {
        try {
            if (typeof frappe !== 'undefined' && frappe.call) {
                const response = await frappe.call({
                    method: 'aida_taskforge_integration.aida_taskforge_integration.doctype.aida_user_settings.aida_user_settings.get_user_settings'
                });
                
                if (response?.message?.current_session_id) {
                    this.sessionId = response.message.current_session_id;
                } else {
                    this.sessionId = this.generateSessionId();
                    await this.saveUserSession();
                }
            } else {
                this.sessionId = localStorage.getItem('aida_session_id') || this.generateSessionId();
                localStorage.setItem('aida_session_id', this.sessionId);
            }
        } catch (error) {
            console.error('Session load error:', error);
            this.sessionId = localStorage.getItem('aida_session_id') || this.generateSessionId();
            localStorage.setItem('aida_session_id', this.sessionId);
        }
    }

    async saveUserSession() {
        try {
            if (typeof frappe !== 'undefined' && frappe.call) {
                await frappe.call({
                    method: 'aida_taskforge_integration.aida_taskforge_integration.doctype.aida_user_settings.aida_user_settings.update_current_session',
                    args: { session_id: this.sessionId }
                });
            }
            localStorage.setItem('aida_session_id', this.sessionId);
        } catch (error) {
            localStorage.setItem('aida_session_id', this.sessionId);
        }
    }

    async loadSettings() {
        const stored = localStorage.getItem('aida_widget_settings');
        if (stored) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(stored) };
            } catch (e) {
                console.error('Failed to parse settings:', e);
            }
        }
        this.settings.configured = !!(this.settings.googleApiKey && this.settings.apiUrl);
    }

    async saveSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.settings.configured = !!(this.settings.googleApiKey && this.settings.apiUrl);
        localStorage.setItem('aida_widget_settings', JSON.stringify(this.settings));
    }

    createWidget() {
        // Remove existing widget
        const existing = document.getElementById('aida-widget');
        if (existing) existing.remove();

        // Inject CSS
        this.injectStyles();

        // Create widget HTML - floating button is outside the chat window overlay
        const widgetHTML = `
            <div id="aida-widget" class="aida-widget ${this.isMobile ? 'mobile' : 'desktop'}">
                <!-- Floating Button (always clickable) -->
                <div class="aida-float-btn" id="aida-float-btn" style="z-index:1000000;position:fixed;bottom:${this.isMobile ? 15 : 20}px;right:${this.isMobile ? 15 : 20}px;pointer-events:auto;">
                    <div class="aida-icon">AI</div>
                    <div class="aida-pulse-ring"></div>
                </div>
                <!-- Chat Window (overlay, only visible when not minimized) -->
                <div class="aida-chat-window ${this.isMobile ? 'mobile' : 'desktop'}" id="aida-chat-window" style="display:none;">
                    <!-- Header -->
                    <div class="aida-header">
                        <div class="aida-title">
                            <div class="aida-logo">AI</div>
                            <span>AIDA Assistant</span>
                        </div>
                        <div class="aida-controls">
                            <button class="aida-btn" id="aida-settings-btn" title="Settings">
                                <div class="aida-icon-settings"></div>
                            </button>
                            <button class="aida-btn" id="aida-clear-btn" title="Clear Chat">
                                <div class="aida-icon-clear"></div>
                            </button>
                            <button class="aida-btn" id="aida-minimize-btn" title="Close">
                                <div class="aida-icon-close"></div>
                            </button>
                        </div>
                    </div>
                    <!-- Chat Container -->
                    <div class="aida-container" id="aida-container" style="height:100%;display:flex;flex-direction:column;min-height:0;">
                        <!-- Chat View -->
                        <div class="aida-chat-view" id="aida-chat-view" style="height:100%;display:flex;flex-direction:column;min-height:0;">
                            <div class="aida-messages" id="aida-messages" style="flex:1;overflow-y:auto;overflow-x:hidden;padding:16px;background:#fafafa;-webkit-overflow-scrolling:touch;min-height:0;max-height:100%;">
                                <div class="aida-message aida-ai">
                                    <div class="aida-avatar">AI</div>
                                    <div class="aida-content">
                                        <p>Hello! I'm AIDA, your AI assistant.</p>
                                        <p class="aida-status-text" id="aida-status-text">
                                            ${this.settings.configured ? 'Ready to help!' : 'Please configure settings to get started. Note: For HTTPS sites, use HTTPS API server URL.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div class="aida-input-area">
                                <div class="aida-connection-status" id="aida-connection-status">
                                    <div class="aida-status-dot ${this.settings.configured ? 'connected' : 'disconnected'}"></div>
                                    <span class="aida-status-label">${this.settings.configured ? 'Ready' : 'Not configured'}</span>
                                </div>
                                <div class="aida-input-wrapper">
                                    <textarea 
                                        id="aida-input" 
                                        placeholder="${this.settings.configured ? 'Type your message...' : 'Configure settings first...'}"
                                        ${this.settings.configured ? '' : 'disabled'}
                                        rows="1"></textarea>
                                    <button id="aida-send-btn" class="aida-send-btn" ${this.settings.configured ? '' : 'disabled'}>
                                        <div class="aida-icon-send"></div>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <!-- Settings View -->
                        <div class="aida-settings-view" id="aida-settings-view" style="height:100%;overflow-y:auto;display:flex;flex-direction:column;min-height:0;">
                            <div class="aida-settings-header">
                                <h3>Configuration</h3>
                                <button class="aida-btn" id="aida-back-btn">
                                    <div class="aida-icon-back"></div>
                                </button>
                            </div>
                            <div class="aida-settings-content" style="flex:1;overflow-y:auto;">
                                <div class="aida-form-group">
                                    <label>API Server URL</label>
                                    <input type="text" id="aida-api-url" placeholder="https://api.taskforgehq.com" />
                                </div>
                                <div class="aida-form-group">
                                    <label>Google API Key</label>
                                    <input type="password" id="aida-api-key" placeholder="Enter your Gemini API key" />
                                    <small>Required for AI functionality</small>
                                </div>
                                <div class="aida-form-group">
                                    <label>ERPNext URL</label>
                                    <input type="text" id="aida-erpnext-url" readonly />
                                    <small>Auto-detected from current site</small>
                                </div>
                                <div class="aida-form-group">
                                    <label class="aida-checkbox">
                                        <input type="checkbox" id="aida-manual-auth" />
                                        <span class="aida-checkmark"></span>
                                        Use Manual Authentication
                                    </label>
                                </div>
                                <div class="aida-manual-fields" id="aida-manual-fields">
                                    <div class="aida-form-group">
                                        <label>Username</label>
                                        <input type="text" id="aida-username" placeholder="Administrator" />
                                    </div>
                                    <div class="aida-form-group">
                                        <label>Password</label>
                                        <input type="password" id="aida-password" placeholder="Your password" />
                                    </div>
                                </div>
                                <div class="aida-form-group">
                                    <label>MongoDB URI (Optional)</label>
                                    <input type="text" id="aida-mongo-uri" placeholder="mongodb://localhost:27017/aida" />
                                    <small>For enhanced conversation history</small>
                                </div>
                                <div class="aida-settings-actions" style="position:sticky;bottom:0;background:white;padding-bottom:8px;z-index:2;">
                                    <button class="aida-btn aida-btn-secondary" id="aida-test-btn">Test Connection</button>
                                    <button class="aida-btn aida-btn-primary" id="aida-save-btn">Save & Connect</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', widgetHTML);
        console.log('✅ Widget HTML created');
    }

    injectStyles() {
        if (document.getElementById('aida-widget-styles')) return;

        const styles = `
            <style id="aida-widget-styles">
            /* AIDA Widget - Minimal Monochromatic Design */
            :root {
                --aida-primary: #2c3e50;
                --aida-secondary: #34495e;
                --aida-accent: #3498db;
                --aida-light: #ecf0f1;
                --aida-dark: #2c3e50;
                --aida-border: #bdc3c7;
                --aida-success: #27ae60;
                --aida-error: #e74c3c;
                --aida-shadow: rgba(44, 62, 80, 0.1);
                --aida-shadow-dark: rgba(44, 62, 80, 0.2);
            }

            .aida-widget {
                position: fixed;
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                line-height: 1.4;
                color: var(--aida-dark);
                * { box-sizing: border-box; }
            }

            .aida-widget.desktop {
                bottom: 20px;
                right: 20px;
            }

            .aida-widget.mobile {
                bottom: 15px;
                right: 15px;
            }

            /* Floating Button */
            .aida-float-btn {
                width: 56px;
                height: 56px;
                background: var(--aida-primary);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 4px 16px var(--aida-shadow-dark);
                position: relative;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                user-select: none;
            }

            .aida-float-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px var(--aida-shadow-dark);
            }

            .aida-float-btn .aida-icon {
                color: white;
                font-weight: 700;
                font-size: 16px;
                letter-spacing: -0.5px;
            }

            .aida-pulse-ring {
                position: absolute;
                width: 56px;
                height: 56px;
                border: 2px solid var(--aida-accent);
                border-radius: 50%;
                animation: aida-pulse 2s infinite;
                opacity: 0;
            }

            @keyframes aida-pulse {
                0% { transform: scale(1); opacity: 0.5; }
                50% { transform: scale(1.1); opacity: 0.3; }
                100% { transform: scale(1.2); opacity: 0; }
            }

            /* Chat Window */
            .aida-chat-window {
                position: absolute;
                background: white;
                border-radius: 12px;
                box-shadow: 0 8px 32px var(--aida-shadow-dark);
                display: none;
                flex-direction: column;
                overflow: hidden;
                opacity: 0;
                transform: translateY(20px);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .aida-chat-window.show {
                opacity: 1;
                transform: translateY(0);
            }

            .aida-chat-window.desktop {
                bottom: 80px;
                right: 0;
                width: 380px;
                height: 600px;
                max-height: calc(100vh - 120px);
            }

            .aida-chat-window.mobile {
                position: fixed !important;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                width: 100vw;
                height: 100vh;
                max-height: 100vh;
                border-radius: 0;
                box-shadow: none;
                display: flex;
                flex-direction: column;
                min-height: 0;
                z-index: 999999;
                overflow: hidden;
            }

            /* Header */
            .aida-header {
                background: var(--aida-primary);
                color: white;
                padding: 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-shrink: 0;
            }

            .aida-chat-window.mobile .aida-header {
                padding: max(16px, env(safe-area-inset-top) + 8px) 16px 16px 16px;
            }

            .aida-title {
                display: flex;
                align-items: center;
                gap: 10px;
                font-weight: 600;
            }

            .aida-logo {
                width: 32px;
                height: 32px;
                background: var(--aida-accent);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 12px;
                color: white;
            }

            .aida-controls {
                display: flex;
                gap: 8px;
            }

            .aida-btn {
                width: 36px;
                height: 36px;
                background: rgba(255, 255, 255, 0.15);
                border: none;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s ease;
                touch-action: manipulation;
            }

            .aida-btn:hover {
                background: rgba(255, 255, 255, 0.25);
            }

            .aida-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            /* Container */
            .aida-container {
                flex: 1;
                display: flex;
                flex-direction: column;
                min-height: 0;
                position: relative;
                overflow: hidden;
            }

            /* Chat View */
            .aida-chat-view {
                flex: 1;
                display: flex;
                flex-direction: column;
                min-height: 0;
                overflow: hidden;
            }

            .aida-messages {
                flex: 1;
                overflow-y: auto;
                overflow-x: hidden;
                padding: 16px;
                background: #fafafa;
                -webkit-overflow-scrolling: touch;
                scrollbar-width: thin;
                scrollbar-color: #bbb #f1f1f1;
                min-height: 0;
            }

            .aida-messages::-webkit-scrollbar {
                width: 6px;
            }

            .aida-messages::-webkit-scrollbar-track {
                background: #f1f1f1;
            }

            .aida-messages::-webkit-scrollbar-thumb {
                background: #bbb;
                border-radius: 3px;
            }

            .aida-message {
                display: flex;
                gap: 12px;
                margin-bottom: 16px;
                animation: aida-fade-in 0.3s ease;
            }

            .aida-message.aida-user {
                flex-direction: row-reverse;
            }

            .aida-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 600;
                flex-shrink: 0;
            }

            .aida-message.aida-ai .aida-avatar {
                background: var(--aida-primary);
                color: white;
            }

            .aida-message.aida-user .aida-avatar {
                background: var(--aida-accent);
                color: white;
            }

            .aida-content {
                flex: 1;
                background: white;
                padding: 12px 16px;
                border-radius: 12px;
                box-shadow: 0 1px 3px var(--aida-shadow);
                word-wrap: break-word;
            }

            .aida-message.aida-user .aida-content {
                background: var(--aida-accent);
                color: white;
            }

            .aida-content p {
                margin: 0 0 8px 0;
            }

            .aida-content p:last-child {
                margin-bottom: 0;
            }

            @keyframes aida-fade-in {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            /* Typing Indicator */
            .aida-typing {
                display: flex;
                gap: 4px;
                padding: 8px 0;
            }

            .aida-typing-dot {
                width: 6px;
                height: 6px;
                background: var(--aida-border);
                border-radius: 50%;
                animation: aida-typing 1.4s infinite;
            }

            .aida-typing-dot:nth-child(2) { animation-delay: 0.2s; }
            .aida-typing-dot:nth-child(3) { animation-delay: 0.4s; }

            @keyframes aida-typing {
                0%, 60%, 100% { transform: scale(1); opacity: 0.5; }
                30% { transform: scale(1.2); opacity: 1; }
            }

            /* Input Area */
            .aida-input-area {
                border-top: 1px solid var(--aida-border);
                background: white;
                padding: 12px 16px;
                flex-shrink: 0;
            }

            .aida-chat-window.mobile .aida-input-area {
                position: sticky;
                bottom: 0;
                left: 0;
                right: 0;
                z-index: 10;
                padding: 12px 16px max(12px, env(safe-area-inset-bottom) + 8px) 16px;
                background: white;
                border-top: 1px solid var(--aida-border);
            }

            .aida-connection-status {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
                font-size: 12px;
                color: #666;
            }

            .aida-status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                animation: aida-status-pulse 2s infinite;
            }

            .aida-status-dot.connected {
                background: var(--aida-success);
            }

            .aida-status-dot.connecting {
                background: var(--aida-accent);
            }

            .aida-status-dot.disconnected {
                background: var(--aida-error);
            }

            @keyframes aida-status-pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            .aida-input-wrapper {
                display: flex;
                gap: 8px;
                align-items: flex-end;
            }

            #aida-input {
                flex: 1;
                border: 1px solid var(--aida-border);
                border-radius: 8px;
                padding: 10px 12px;
                font-family: inherit;
                font-size: 14px;
                resize: none;
                min-height: 40px;
                max-height: 120px;
                background: white;
                transition: border-color 0.2s ease;
            }

            #aida-input:focus {
                outline: none;
                border-color: var(--aida-accent);
            }

            #aida-input:disabled {
                background: #f8f9fa;
                color: #666;
            }

            .aida-send-btn {
                width: 40px;
                height: 40px;
                background: var(--aida-accent);
                border: none;
                border-radius: 8px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                touch-action: manipulation;
            }

            .aida-send-btn:hover:not(:disabled) {
                background: #2980b9;
                transform: translateY(-1px);
            }

            .aida-send-btn:disabled {
                background: #bdc3c7;
                cursor: not-allowed;
            }

            /* Settings View */
            .aida-settings-view {
                flex: 1;
                display: none;
                flex-direction: column;
                min-height: 0;
                overflow: hidden;
            }

            .aida-settings-header {
                padding: 16px;
                border-bottom: 1px solid var(--aida-border);
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: white;
                flex-shrink: 0;
            }

            .aida-settings-header h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                color: var(--aida-primary);
            }

            .aida-settings-content {
                flex: 1;
                overflow-y: auto;
                overflow-x: hidden;
                padding: 20px;
                -webkit-overflow-scrolling: touch;
                scrollbar-width: thin;
                scrollbar-color: #bbb #f1f1f1;
                min-height: 0;
            }

            .aida-chat-window.mobile .aida-settings-content {
                padding: 16px;
                padding-bottom: 100px;
            }

            .aida-settings-content::-webkit-scrollbar {
                width: 6px;
            }

            .aida-settings-content::-webkit-scrollbar-track {
                background: #f1f1f1;
            }

            .aida-settings-content::-webkit-scrollbar-thumb {
                background: #bbb;
                border-radius: 3px;
            }

            .aida-form-group {
                margin-bottom: 20px;
            }

            .aida-form-group label {
                display: block;
                margin-bottom: 6px;
                font-weight: 500;
                color: var(--aida-primary);
            }

            .aida-form-group input {
                width: 100%;
                padding: 10px 12px;
                border: 1px solid var(--aida-border);
                border-radius: 6px;
                font-family: inherit;
                font-size: 14px;
                transition: border-color 0.2s ease;
            }

            .aida-form-group input:focus {
                outline: none;
                border-color: var(--aida-accent);
            }

            .aida-form-group small {
                display: block;
                margin-top: 4px;
                color: #666;
                font-size: 12px;
            }

            .aida-checkbox {
                display: flex !important;
                align-items: center;
                gap: 10px;
                cursor: pointer;
            }

            .aida-checkbox input {
                width: auto !important;
                margin: 0 !important;
            }

            .aida-manual-fields {
                display: none;
                margin-top: 12px;
                padding-left: 24px;
                border-left: 2px solid var(--aida-border);
            }

            .aida-settings-actions {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: white;
                padding: 16px;
                border-top: 1px solid var(--aida-border);
                z-index: 100;
                display: flex;
                gap: 12px;
            }

            .aida-chat-window.mobile .aida-settings-actions {
                padding: 16px max(16px, env(safe-area-inset-left) + 8px) max(16px, env(safe-area-inset-bottom) + 8px) max(16px, env(safe-area-inset-right) + 8px);
            }

            .aida-chat-window.desktop .aida-settings-actions {
                position: sticky;
                bottom: 0;
                background: white;
                z-index: 2;
                padding: 20px 0 0 0;
                margin-top: 24px;
                border-top: 1px solid var(--aida-border);
            }

            .aida-btn-secondary {
                flex: 1;
                padding: 12px 20px;
                background: white;
                border: 1px solid var(--aida-border);
                color: var(--aida-primary);
                border-radius: 6px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .aida-btn-secondary:hover {
                background: #f8f9fa;
                border-color: var(--aida-accent);
            }

            .aida-btn-primary {
                flex: 1;
                padding: 12px 20px;
                background: var(--aida-accent);
                border: none;
                color: white;
                border-radius: 6px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .aida-btn-primary:hover {
                background: #2980b9;
                transform: translateY(-1px);
            }

            /* Icons using CSS */
            .aida-icon-settings::before { content: "⚙"; }
            .aida-icon-clear::before { content: "🗑"; }
            .aida-icon-close::before { content: "✕"; }
            .aida-icon-back::before { content: "←"; }
            .aida-icon-send::before { content: "→"; color: white; }

            /* Mobile optimizations */
            @media screen and (max-width: 768px) {
                .aida-widget.mobile .aida-float-btn {
                    width: 52px;
                    height: 52px;
                }
                
                .aida-messages {
                    padding: 12px;
                }
                
                .aida-input-area {
                    padding: 8px 12px;
                }
                
                .aida-settings-content {
                    padding: 16px;
                }
            }

            /* Prevent zoom on mobile */
            @media screen and (max-width: 768px) {
                input, textarea, select {
                    font-size: 16px !important;
                }
            }

            /* Ensure proper flex layout */
            .aida-container, .aida-chat-view, .aida-settings-view {
                height: 100%;
                min-height: 0;
                display: flex;
                flex-direction: column;
            }

            .aida-messages {
                flex: 1;
                overflow-y: auto;
                min-height: 0;
                max-height: 100%;
            }

            .aida-settings-content {
                flex: 1;
                overflow-y: auto;
                min-height: 0;
                max-height: 100%;
            }

            /* Mobile keyboard handling */
            @media screen and (max-width: 768px) {
                .aida-chat-window.mobile {
                    height: 100vh;
                    height: 100dvh;
                }
                
                .aida-chat-window.mobile .aida-input-area {
                    position: sticky;
                    bottom: 0;
                    background: white;
                    border-top: 1px solid var(--aida-border);
                }
                
                .aida-chat-window.mobile .aida-settings-actions {
                    position: fixed;
                    bottom: 0;
                    background: white;
                    border-top: 1px solid var(--aida-border);
                }
            }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    bindEvents() {
        console.log('🔗 Binding events...');
        
        // Use timeout to ensure DOM is ready
        setTimeout(() => {
            // Float button
            const floatBtn = document.getElementById('aida-float-btn');
            if (floatBtn) {
                floatBtn.addEventListener('click', () => this.toggleWidget());
            }

            // Header controls
            const minimizeBtn = document.getElementById('aida-minimize-btn');
            if (minimizeBtn) {
                minimizeBtn.addEventListener('click', () => this.hideWidget());
            }

            const settingsBtn = document.getElementById('aida-settings-btn');
            if (settingsBtn) {
                settingsBtn.addEventListener('click', () => this.showSettings());
            }

            const clearBtn = document.getElementById('aida-clear-btn');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => this.clearChat());
            }

            const backBtn = document.getElementById('aida-back-btn');
            if (backBtn) {
                backBtn.addEventListener('click', () => this.showChat());
            }

            // Input handling
            const input = document.getElementById('aida-input');
            if (input) {
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        this.sendMessage();
                    }
                });

                input.addEventListener('input', () => this.autoResizeInput());
            }

            const sendBtn = document.getElementById('aida-send-btn');
            if (sendBtn) {
                sendBtn.addEventListener('click', () => this.sendMessage());
            }

            // Settings
            const manualAuth = document.getElementById('aida-manual-auth');
            if (manualAuth) {
                manualAuth.addEventListener('change', (e) => {
                    const fields = document.getElementById('aida-manual-fields');
                    fields.style.display = e.target.checked ? 'block' : 'none';
                });
            }

            const testBtn = document.getElementById('aida-test-btn');
            if (testBtn) {
                testBtn.addEventListener('click', () => this.testConnection());
            }

            const saveBtn = document.getElementById('aida-save-btn');
            if (saveBtn) {
                saveBtn.addEventListener('click', () => this.saveAndConnect());
            }

            this.populateSettings();
            console.log('✅ Events bound successfully');
        }, 100);
    }

    setupResponsiveHandlers() {
        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                // Only update layout if widget is minimized (not open)
                if (this.isMinimized) {
                    this.isMobile = this.detectMobileDevice();
                    this.updateWidgetLayout();
                } else if (this.isMobile) {
                    // If widget is open on mobile, ensure it stays properly positioned
                    this.updateMobileLayout();
                }
            }, 100);
        });

        // Handle resize
        window.addEventListener('resize', () => {
            // Only update layout if widget is minimized (not open)
            if (this.isMinimized) {
                this.isMobile = this.detectMobileDevice();
                this.updateWidgetLayout();
            } else if (this.isMobile) {
                // If widget is open on mobile, ensure it stays properly positioned
                this.updateMobileLayout();
            }
        });

        // Handle visual viewport changes (keyboard open/close on mobile)
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                if (this.isMobile && !this.isMinimized) {
                    this.updateMobileLayout();
                }
            });
        }
    }

    updateWidgetLayout() {
        const widget = document.getElementById('aida-widget');
        const chatWindow = document.getElementById('aida-chat-window');
        
        if (widget && chatWindow) {
            widget.className = `aida-widget ${this.isMobile ? 'mobile' : 'desktop'}`;
            chatWindow.className = `aida-chat-window ${this.isMobile ? 'mobile' : 'desktop'}`;
        }
    }

    updateMobileLayout() {
        const chatWindow = document.getElementById('aida-chat-window');
        if (chatWindow && this.isMobile) {
            // Ensure the chat window stays properly positioned
            chatWindow.style.position = 'fixed';
            chatWindow.style.top = '0';
            chatWindow.style.left = '0';
            chatWindow.style.right = '0';
            chatWindow.style.bottom = '0';
            chatWindow.style.width = '100vw';
            chatWindow.style.height = '100vh';
            chatWindow.style.maxHeight = '100vh';
            chatWindow.style.zIndex = '999999';
            chatWindow.style.overflow = 'hidden';
        }
    }

    populateSettings() {
        const elements = {
            'aida-api-url': this.settings.apiUrl,
            'aida-erpnext-url': this.settings.erpnextUrl,
            'aida-api-key': this.settings.googleApiKey,
            'aida-mongo-uri': this.settings.mongoUri,
            'aida-username': this.settings.username,
            'aida-password': this.settings.password
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.value = value || '';
        });

        const manualAuth = document.getElementById('aida-manual-auth');
        if (manualAuth) {
            manualAuth.checked = this.settings.useManualAuth;
            const fields = document.getElementById('aida-manual-fields');
            fields.style.display = this.settings.useManualAuth ? 'block' : 'none';
        }
    }

    toggleWidget() {
        // Only open the chat window, not the whole widget overlay
        const chatWindow = document.getElementById('aida-chat-window');
        if (this.isMinimized) {
            this.showWidget();
        } else {
            this.hideWidget();
        }
    }

    showWidget() {
        const chatWindow = document.getElementById('aida-chat-window');
        const floatBtn = document.getElementById('aida-float-btn');
        chatWindow.style.display = 'flex';
        // On mobile, force full viewport height and keep visible
        if (this.isMobile) {
            this.updateMobileLayout();
        }
        setTimeout(() => {
            chatWindow.classList.add('show');
        }, 10);
        if (this.isMobile) {
            history.pushState(null, null, window.location.href);
        }
        this.isMinimized = false;
        // Hide floating button when widget is open
        if (floatBtn) floatBtn.style.display = 'none';
        // Show settings if not configured, chat if configured
        if (!this.settings.configured) {
            this.showSettings();
        } else {
            this.showChat();
        }
        this.scrollToBottom();
    }

    hideWidget() {
        const chatWindow = document.getElementById('aida-chat-window');
        const floatBtn = document.getElementById('aida-float-btn');
        chatWindow.classList.remove('show');
        setTimeout(() => {
            chatWindow.style.display = 'none';
            // On mobile, reset chat window style
            if (this.isMobile) {
                chatWindow.style.position = '';
                chatWindow.style.top = '';
                chatWindow.style.left = '';
                chatWindow.style.right = '';
                chatWindow.style.bottom = '';
                chatWindow.style.height = '';
                chatWindow.style.maxHeight = '';
                chatWindow.style.overflow = '';
                chatWindow.style.zIndex = '';
            }
        }, 300);
        // Restore body scroll
        if (this.isMobile) {
            document.body.style.overflow = '';
        }
        this.isMinimized = true;
        // Show floating button again when widget is closed
        if (floatBtn) floatBtn.style.display = 'flex';
    }

    showSettings() {
        document.getElementById('aida-chat-view').style.display = 'none';
        document.getElementById('aida-settings-view').style.display = 'flex';
    }

    showChat() {
        document.getElementById('aida-settings-view').style.display = 'none';
        document.getElementById('aida-chat-view').style.display = 'flex';
    }

    async clearChat() {
        if (!confirm('Clear conversation history?')) return;

        try {
            // Clear from server if possible
            if (typeof frappe !== 'undefined' && frappe.call) {
                await frappe.call({
                    method: 'aida_taskforge_integration.aida_taskforge_integration.doctype.aida_conversation.aida_conversation.clear_conversation_history',
                    args: { session_id: this.sessionId }
                });
            }

            // Clear UI
            const messages = document.getElementById('aida-messages');
            messages.innerHTML = `
                <div class="aida-message aida-ai">
                    <div class="aida-avatar">AI</div>
                    <div class="aida-content">
                        <p>Conversation cleared! How can I help you?</p>
                    </div>
                </div>
            `;

            console.log('✅ Chat cleared');
        } catch (error) {
            console.error('❌ Failed to clear chat:', error);
        }
    }

    async testConnection() {
        const apiUrl = document.getElementById('aida-api-url').value.trim();
        if (!apiUrl) {
            alert('Please enter API Server URL');
            return;
        }

        // FIXED: Better protocol checking and user guidance
        const isHTTPS = window.location.protocol === 'https:';
        const apiIsHTTPS = apiUrl.startsWith('https:');
        
        if (isHTTPS && !apiIsHTTPS) {
            alert('❌ Error: Cannot connect to HTTP API server from HTTPS site.\n\n' +
                  '🔧 Solutions:\n' +
                  '1. Use HTTPS API server URL (e.g., https://localhost:5001)\n' +
                  '2. Or access this site via HTTP instead of HTTPS\n' +
                  '3. Or use a tunneling service like ngrok\n\n' +
                  'This is blocked by browser security policies.');
            return;
        }

        const testBtn = document.getElementById('aida-test-btn');
        testBtn.textContent = 'Testing...';
        testBtn.disabled = true;

        try {
            console.log('Testing connection to:', apiUrl);
            
            // FIXED: Enhanced fetch with better error handling
            const response = await this.fetchWithPrivateNetworkSupport(`${apiUrl}/health`, {
                method: 'GET'
            });
            
            if (response.ok) {
                const data = await response.json();
                alert(`✅ Connection successful!\nStatus: ${data.status}\nServer Type: ${data.server_type || 'Unknown'}`);
                console.log('✅ Connection test successful:', data);
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('❌ Connection test failed:', error);
            
            let errorMsg = `❌ Connection failed: ${error.message}`;
            
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                errorMsg = '❌ Cannot connect to API server\n\n' +
                          '🔧 Possible solutions:\n' +
                          '1. Start API server: python aida_api_server.py\n' +
                          '2. Check URL is correct: ' + apiUrl + '\n';
                
                if (isHTTPS && !apiIsHTTPS) {
                    errorMsg += '3. Use HTTPS API server (browser blocks HTTP from HTTPS site)\n' +
                               '4. Or use ngrok: ngrok http 5000 (then use the https URL)\n';
                } else {
                    errorMsg += '3. Check firewall/antivirus is not blocking port 5000\n';
                }
            }
            
            alert(errorMsg);
        } finally {
            testBtn.textContent = 'Test Connection';
            testBtn.disabled = false;
        }
    }

    async connectToAPI() {
        // Defensive: Ensure 'this' context is correct
        if (typeof this.addMessage !== 'function') {
            console.error('AidaWidget: this.addMessage is not a function. Check context.');
            return;
        }
        if (!this.settings.configured) return;

        this.updateConnectionUI();
        console.log('🔄 Connecting to API:', this.settings.apiUrl);

        // FIXED: Protocol compatibility check with clear error message
        const isHTTPS = window.location.protocol === 'https:';
        const apiIsHTTPS = this.settings.apiUrl.startsWith('https:');
        
        if (isHTTPS && !apiIsHTTPS) {
            this.isConnected = false;
            this.updateConnectionUI();
            
            const message = '❌ Connection blocked by browser security\n\n' +
                          '🔧 Your site is HTTPS but API server is HTTP.\n' +
                          'Solutions:\n' +
                          '1. Use HTTPS API server URL\n' +
                          '2. Access site via HTTP instead\n' +
                          '3. Use ngrok tunnel for HTTPS API access';
            
            this.addMessage(message, 'ai');
            return;
        }

        try {
            let payload;

            if (this.settings.useManualAuth) {
                payload = {
                    erpnext_url: this.settings.erpnextUrl,
                    username: this.settings.username,
                    password: this.settings.password,
                    google_api_key: this.settings.googleApiKey,
                    mongo_uri: this.settings.mongoUri
                };
            } else {
                const sessionCookie = this.getCookie('sid');
                if (!sessionCookie) {
                    throw new Error('Session authentication failed. Please try manual login.');
                }

                payload = {
                    erpnext_url: this.settings.erpnextUrl,
                    username: 'session_token',
                    password: 'session_token',
                    google_api_key: this.settings.googleApiKey,
                    mongo_uri: this.settings.mongoUri,
                    api_key: frappe?.session?.user || 'Administrator',
                    api_secret: sessionCookie
                };
            }

            console.log('📤 Sending connection request...', {
                url: `${this.settings.apiUrl}/init_session`,
                auth_method: this.settings.useManualAuth ? 'manual' : 'session'
            });

            // FIXED: Use enhanced fetch method
            const response = await this.fetchWithPrivateNetworkSupport(`${this.settings.apiUrl}/init_session`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                let parsedError;
                try {
                    parsedError = JSON.parse(errorText);
                } catch {
                    parsedError = { error: errorText };
                }
                throw new Error(parsedError.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.session_id) {
                this.apiSessionId = data.session_id;
                this.isConnected = true;
                this.updateConnectionUI();
                this.addMessage('✅ Connected to AIDA! How can I help you?', 'ai');
                console.log('✅ Connected successfully, session:', this.apiSessionId);
            } else {
                throw new Error('No session ID received from server');
            }

        } catch (error) {
            console.error('❌ Connection failed:', error);
            this.isConnected = false;
            this.updateConnectionUI();
            
            let errorMsg = error.message;
            // If the error message looks like HTML, show a friendly message instead
            if (typeof errorMsg === 'string' && (errorMsg.startsWith('<!doctype html') || errorMsg.startsWith('<html') || errorMsg.length > 300)) {
                errorMsg = 'Connection failed, retrying...';
            }
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                errorMsg = `Connection failed: ${error.message}\n\n` +
                          '🔧 Check:\n' +
                          '1. API server is running\n' +
                          '2. URL is correct: ' + this.settings.apiUrl + '\n' +
                          '3. No firewall blocking connection';
                if (isHTTPS && !apiIsHTTPS) {
                    errorMsg += '\n4. Use HTTPS API server (browser security requirement)';
                }
            }
            this.addMessage(`❌ ${errorMsg}`, 'ai');
        }
    }

    addMessage(content, type, save = true) {
        const messages = document.getElementById('aida-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `aida-message aida-${type}`;
        
        messageDiv.innerHTML = `
            <div class="aida-avatar">${type === 'ai' ? 'AI' : 'U'}</div>
            <div class="aida-content">
                <p>${this.escapeHtml(content)}</p>
            </div>
        `;

        messages.appendChild(messageDiv);
        this.scrollToBottom();

        // Save to server if possible
        if (save && typeof frappe !== 'undefined' && frappe.call) {
            this.saveMessage(content, type).catch(console.error);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async saveMessage(message, type) {
        try {
            await frappe.call({
                method: 'aida_taskforge_integration.aida_taskforge_integration.doctype.aida_conversation.aida_conversation.save_message',
                args: {
                    session_id: this.sessionId,
                    message_type: type,
                    message: message
                }
            });
        } catch (error) {
            console.error('Failed to save message:', error);
        }
    }

    async sendMessage() {
        const input = document.getElementById('aida-input');
        const message = input.value.trim();

        if (!message || !this.isConnected) return;

        // Add user message
        this.addMessage(message, 'user');
        input.value = '';
        this.autoResizeInput();

        // Show typing
        this.showTyping();

        try {
            // FIXED: Use enhanced fetch method
            const response = await this.fetchWithPrivateNetworkSupport(`${this.settings.apiUrl}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: this.apiSessionId,
                    user_input: message
                })
            });

            this.hideTyping();

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            
            if (data.response) {
                this.addMessage(data.response, 'ai');
            } else {
                throw new Error('No response from AI');
            }

        } catch (error) {
            this.hideTyping();
            console.error('❌ Send message error:', error);
            
            let errorMsg = error.message;
            if (error.message.includes('Failed to fetch')) {
                errorMsg = 'Network error. Please check your connection and API server.';
            }
            
            this.addMessage(`❌ Error: ${errorMsg}`, 'ai');
        }
    }

    // FIXED: Enhanced fetch method that handles private network access issues
    fetchWithPrivateNetworkSupport(url, options = {}) {
        const defaultOptions = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            },
            body: options.body
        };

        // Check for protocol mismatch
        const isHTTPS = window.location.protocol === 'https:';
        const urlIsHTTPS = url.startsWith('https:');
        
        if (isHTTPS && !urlIsHTTPS) {
            // Return a rejected promise with clear error message
            return Promise.reject(new Error('BLOCKED: Cannot access HTTP API from HTTPS site. Use HTTPS API server or access site via HTTP.'));
        }

        return fetch(url, defaultOptions).catch(error => {
            // Enhanced error handling for specific browser errors
            if (error.message.includes('Failed to fetch')) {
                if (url.includes('localhost') && isHTTPS) {
                    throw new Error('PRIVATE_NETWORK_BLOCKED: Browser blocked localhost access from HTTPS site. Use HTTPS API server or HTTP site access.');
                } else {
                    throw new Error('FETCH_FAILED: API server unreachable. Check if server is running and URL is correct.');
                }
            }
            throw error;
        });
    }

    fetchWithMobileSupport(url, options = {}) {
        // Redirect to the enhanced method
        return this.fetchWithPrivateNetworkSupport(url, options);
    }

    updateConnectionUI() {
        const statusDot = document.getElementById('aida-connection-status').querySelector('.aida-status-dot');
        const statusLabel = document.getElementById('aida-connection-status').querySelector('.aida-status-label');
        const input = document.getElementById('aida-input');
        const sendBtn = document.getElementById('aida-send-btn');
        const statusText = document.getElementById('aida-status-text');

        if (this.settings.configured) {
            if (this.isConnected) {
                statusDot.className = 'aida-status-dot connected';
                statusLabel.textContent = 'Connected';
                input.disabled = false;
                input.placeholder = 'Type your message...';
                sendBtn.disabled = false;
                if (statusText) statusText.textContent = 'Ready to help!';
            } else {
                statusDot.className = 'aida-status-dot connecting';
                statusLabel.textContent = 'Connecting...';
                input.disabled = true;
                input.placeholder = 'Connecting...';
                sendBtn.disabled = true;
                if (statusText) statusText.textContent = 'Connecting to AIDA...';
            }
        } else {
            statusDot.className = 'aida-status-dot disconnected';
            statusLabel.textContent = 'Not configured';
            input.disabled = true;
            input.placeholder = 'Configure settings first...';
            sendBtn.disabled = true;
            if (statusText) statusText.textContent = 'Please configure settings to get started.';
        }
    }

    autoResizeInput() {
        const input = document.getElementById('aida-input');
        if (!input) return;
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    }

    scrollToBottom() {
        const messages = document.getElementById('aida-messages');
        if (!messages) return;
        messages.scrollTop = messages.scrollHeight;
        // Fallback: scroll last message into view for smoothness
        setTimeout(() => {
            const lastMessage = messages.lastElementChild;
            if (lastMessage) {
                lastMessage.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
            }
        }, 50);
    }

    showTyping() {
        const messages = document.getElementById('aida-messages');
        // Remove any existing typing indicator
        this.hideTyping();
        const typingDiv = document.createElement('div');
        typingDiv.className = 'aida-message aida-ai aida-typing';
        typingDiv.innerHTML = `
            <div class="aida-avatar">AI</div>
            <div class="aida-content">
                <div class="aida-typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        messages.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTyping() {
        const typing = document.querySelector('.aida-typing');
        if (typing) typing.remove();
    }

    async saveAndConnect() {
        const newSettings = {
            apiUrl: document.getElementById('aida-api-url').value.trim(),
            erpnextUrl: document.getElementById('aida-erpnext-url').value.trim(),
            googleApiKey: document.getElementById('aida-api-key').value.trim(),
            mongoUri: document.getElementById('aida-mongo-uri').value.trim(),
            useManualAuth: document.getElementById('aida-manual-auth').checked,
            username: document.getElementById('aida-username').value.trim(),
            password: document.getElementById('aida-password').value.trim()
        };

        if (!newSettings.apiUrl || !newSettings.googleApiKey) {
            alert('API Server URL and Google API Key are required');
            return;
        }

        if (newSettings.useManualAuth && !newSettings.password) {
            alert('Password required for manual authentication');
            return;
        }

        await this.saveSettings(newSettings);
        this.showChat();
        this.updateConnectionUI();
        
        // Use arrow function to preserve 'this', and check protocol before connecting
        if (window.location.protocol === 'https:' && !newSettings.apiUrl.startsWith('https:')) {
            this.addMessage('❌ Cannot connect: HTTPS site requires HTTPS API server URL.', 'ai');
            return;
        }
        setTimeout(() => this.connectToAPI(), 100);
    }

    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }
}

// Auto-initialize when ready
function initAidaWidget() {
    if (typeof frappe !== 'undefined' && frappe.session && frappe.session.user !== 'Guest') {
        console.log('🚀 Initializing AIDA Widget...');
        window.aidaWidget = new AidaWidget();
    } else if (typeof frappe === 'undefined') {
        setTimeout(initAidaWidget, 1000);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initAidaWidget, 2000));
} else {
    setTimeout(initAidaWidget, 2000);
}