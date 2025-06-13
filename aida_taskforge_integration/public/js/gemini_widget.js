class AidaChatInterface {
    constructor(isFloating = false) {
        this.isFloating = isFloating;
        this.sessionId = null;
        this.settings = null;
        this.messageContainer = null;
        this.inputField = null;
        this.sendButton = null;
        this.statusIndicator = null;
        this.statusText = null;
        this.isConnected = false;
        this.isTyping = false;
        this.currentView = 'chat'; // 'chat' or 'settings'
        
        this.init();
    }
    
    async init() {
        if (this.isFloating) {
            this.createFloatingWidget();
        } else {
            this.initMainInterface();
        }
        
        await this.loadUserSettings();
    }
    
    createFloatingWidget() {
        // Check if widget already exists
        if (document.getElementById('aida-float-widget')) {
            return;
        }
        
        const widgetHtml = `
            <div class="aida-float-widget" id="aida-float-widget">
                <button class="aida-float-button" id="aida-float-btn" title="AIDA AI Assistant">
                    <i class="fa fa-robot"></i>
                </button>
                <div class="aida-float-chat" id="aida-float-chat">
                    <div class="float-chat-header">
                        <h4 id="aida-header-title"><i class="fa fa-robot"></i> AIDA Assistant</h4>
                        <div class="header-controls">
                            <button class="header-btn" id="aida-settings-btn" title="Settings">
                                <i class="fa fa-cog"></i>
                            </button>
                            <button class="float-chat-close" id="float-chat-close">×</button>
                        </div>
                    </div>
                    
                    <!-- Chat View -->
                    <div class="chat-view" id="chat-view">
                        <div class="float-chat-messages" id="float-chat-messages">
                            <div class="welcome-message">
                                <p>Hi! I'm AIDA, your ERPNext AI assistant.</p>
                                <p>Click the settings icon ⚙️ to configure your API credentials.</p>
                            </div>
                        </div>
                        <div class="float-chat-input">
                            <div class="input-group input-group-sm">
                                <input type="text" class="form-control" id="float-chat-input" 
                                       placeholder="Configure settings first..." disabled>
                                <div class="input-group-append">
                                    <button class="btn btn-primary btn-sm" id="float-send-btn" disabled>
                                        <i class="fa fa-paper-plane"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="connection-status mt-2" id="float-connection-status">
                                <span class="status-indicator disconnected"></span>
                                <span class="status-text">Not configured</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Settings View -->
                    <div class="settings-view" id="settings-view" style="display: none;">
                        <div class="settings-content">
                            <form id="aida-settings-form">
                                <div class="form-group">
                                    <label for="api-server-url">API Server URL:</label>
                                    <input type="text" class="form-control" id="api-server-url" 
                                           value="http://localhost:5000" placeholder="http://localhost:5000">
                                    <small class="form-text text-muted">URL where your AIDA API server is running</small>
                                </div>
                                
                                <div class="form-group">
                                    <label for="google-api-key">Google API Key:</label>
                                    <input type="password" class="form-control" id="google-api-key" 
                                           placeholder="Enter your Google Gemini API key">
                                    <small class="form-text text-muted">Required for AI functionality</small>
                                </div>
                                
                                <div class="form-group">
                                    <label for="erpnext-url">ERPNext URL:</label>
                                    <input type="text" class="form-control" id="erpnext-url" 
                                           placeholder="Auto-detected from current site">
                                    <small class="form-text text-muted">Usually auto-detected correctly</small>
                                </div>
                                
                                <div class="form-group">
                                    <label for="mongo-uri">MongoDB URI (Optional):</label>
                                    <input type="text" class="form-control" id="mongo-uri" 
                                           placeholder="mongodb://localhost:27017/aida">
                                    <small class="form-text text-muted">For conversation history storage</small>
                                </div>
                                
                                <div class="settings-actions">
                                    <button type="button" class="btn btn-success btn-sm" id="save-settings-btn">
                                        <i class="fa fa-save"></i> Save & Connect
                                    </button>
                                    <button type="button" class="btn btn-secondary btn-sm" id="test-connection-btn">
                                        <i class="fa fa-plug"></i> Test Connection
                                    </button>
                                    <button type="button" class="btn btn-light btn-sm" id="back-to-chat-btn">
                                        <i class="fa fa-arrow-left"></i> Back to Chat
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', widgetHtml);
        this.setupFloatingWidgetEvents();
    }
    
    setupFloatingWidgetEvents() {
        this.messageContainer = document.getElementById('float-chat-messages');
        this.inputField = document.getElementById('float-chat-input');
        this.sendButton = document.getElementById('float-send-btn');
        this.statusIndicator = document.querySelector('#float-connection-status .status-indicator');
        this.statusText = document.querySelector('#float-connection-status .status-text');
        
        // Widget toggle
        document.getElementById('aida-float-btn').addEventListener('click', () => {
            this.toggleFloatingChat();
        });
        
        // Close button
        document.getElementById('float-chat-close').addEventListener('click', () => {
            this.hideFloatingChat();
        });
        
        // Settings button
        document.getElementById('aida-settings-btn').addEventListener('click', () => {
            this.showSettingsView();
        });
        
        // Back to chat button
        document.getElementById('back-to-chat-btn').addEventListener('click', () => {
            this.showChatView();
        });
        
        // Save settings button
        document.getElementById('save-settings-btn').addEventListener('click', () => {
            this.saveSettings();
        });
        
        // Test connection button
        document.getElementById('test-connection-btn').addEventListener('click', () => {
            this.testConnection();
        });
        
        // Auto-fill ERPNext URL
        document.getElementById('erpnext-url').value = window.location.origin;
        
        this.setupChatEventListeners();
    }
    
    initMainInterface() {
        this.messageContainer = document.getElementById('chat-messages');
        this.inputField = document.getElementById('chat-input');
        this.sendButton = document.getElementById('send-btn');
        this.statusIndicator = document.querySelector('#connection-status .status-indicator');
        this.statusText = document.querySelector('#connection-status .status-text');
        
        document.getElementById('clear-chat')?.addEventListener('click', () => {
            this.clearChat();
        });
        
        document.getElementById('settings-btn')?.addEventListener('click', () => {
            this.openSettings();
        });
        
        this.setupChatEventListeners();
    }
    
    setupChatEventListeners() {
        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });
        
        this.inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.inputField.addEventListener('input', () => {
            this.sendButton.disabled = !this.inputField.value.trim() || !this.isConnected;
        });
    }
    
    showSettingsView() {
        document.getElementById('chat-view').style.display = 'none';
        document.getElementById('settings-view').style.display = 'block';
        document.getElementById('aida-header-title').innerHTML = '<i class="fa fa-cog"></i> AIDA Settings';
        this.currentView = 'settings';
    }
    
    showChatView() {
        document.getElementById('settings-view').style.display = 'none';
        document.getElementById('chat-view').style.display = 'block';
        document.getElementById('aida-header-title').innerHTML = '<i class="fa fa-robot"></i> AIDA Assistant';
        this.currentView = 'chat';
    }
    
    async loadUserSettings() {
        try {
            // Load settings from user's local storage or server-side user preferences
            const savedSettings = localStorage.getItem('aida_user_settings');
            if (savedSettings) {
                this.settings = JSON.parse(savedSettings);
                this.populateSettingsForm();
                
                // Auto-connect if settings are complete
                if (this.settings.google_api_key && this.settings.api_server_url) {
                    this.connectToAPI();
                }
            } else {
                // Set default values
                this.settings = {
                    api_server_url: 'http://localhost:5000',
                    erpnext_url: window.location.origin,
                    google_api_key: '',
                    mongo_uri: ''
                };
            }
        } catch (error) {
            console.error('Failed to load user settings:', error);
            this.settings = {
                api_server_url: 'http://localhost:5000',
                erpnext_url: window.location.origin,
                google_api_key: '',
                mongo_uri: ''
            };
        }
    }
    
    populateSettingsForm() {
        if (document.getElementById('api-server-url')) {
            document.getElementById('api-server-url').value = this.settings.api_server_url || 'http://localhost:5000';
            document.getElementById('erpnext-url').value = this.settings.erpnext_url || window.location.origin;
            document.getElementById('google-api-key').value = this.settings.google_api_key || '';
            document.getElementById('mongo-uri').value = this.settings.mongo_uri || '';
        }
    }
    
    async saveSettings() {
        try {
            // Get values from form
            const settings = {
                api_server_url: document.getElementById('api-server-url').value.trim(),
                erpnext_url: document.getElementById('erpnext-url').value.trim(),
                google_api_key: document.getElementById('google-api-key').value.trim(),
                mongo_uri: document.getElementById('mongo-uri').value.trim()
            };
            
            // Validate required fields
            if (!settings.api_server_url) {
                frappe.show_alert({message: 'API Server URL is required', indicator: 'red'});
                return;
            }
            
            if (!settings.google_api_key) {
                frappe.show_alert({message: 'Google API Key is required', indicator: 'red'});
                return;
            }
            
            // Remove trailing slashes
            settings.api_server_url = settings.api_server_url.replace(/\/$/, '');
            settings.erpnext_url = settings.erpnext_url.replace(/\/$/, '');
            
            // Save to localStorage
            localStorage.setItem('aida_user_settings', JSON.stringify(settings));
            this.settings = settings;
            
            frappe.show_alert({message: 'Settings saved successfully!', indicator: 'green'});
            
            // Try to connect
            this.showChatView();
            this.connectToAPI();
            
        } catch (error) {
            console.error('Failed to save settings:', error);
            frappe.show_alert({message: 'Failed to save settings', indicator: 'red'});
        }
    }
    
    async testConnection() {
        const apiServerUrl = document.getElementById('api-server-url').value.trim();
        
        if (!apiServerUrl) {
            frappe.show_alert({message: 'Please enter API Server URL', indicator: 'red'});
            return;
        }
        
        try {
            const response = await fetch(`${apiServerUrl}/health`, {
                method: 'GET',
                timeout: 5000
            });
            
            if (response.ok) {
                const data = await response.json();
                frappe.show_alert({
                    message: `API server is reachable! Status: ${data.status}`, 
                    indicator: 'green'
                });
            } else {
                frappe.show_alert({
                    message: `API server returned status ${response.status}`, 
                    indicator: 'orange'
                });
            }
        } catch (error) {
            frappe.show_alert({
                message: `Cannot reach API server: ${error.message}`, 
                indicator: 'red'
            });
        }
    }
    
    async connectToAPI() {
        if (!this.settings) {
            this.updateConnectionStatus('disconnected', 'Settings not loaded');
            return;
        }
        
        // Validate required settings
        if (!this.settings.google_api_key || this.settings.google_api_key.trim() === '') {
            this.updateConnectionStatus('disconnected', 'Google API key required');
            return;
        }
        
        if (!this.settings.api_server_url) {
            this.updateConnectionStatus('disconnected', 'API server URL required');
            return;
        }
        
        this.updateConnectionStatus('connecting', 'Connecting to AIDA...');
        
        try {
            const payload = {
                erpnext_url: this.settings.erpnext_url || window.location.origin,
                username: 'session_token',
                password: 'session_token',
                google_api_key: this.settings.google_api_key,
                api_key: frappe.session.user,
                api_secret: frappe.get_cookie('sid'),
                mongo_uri: this.settings.mongo_uri || null
            };
            
            console.log('Connecting to AIDA with payload:', {
                erpnext_url: payload.erpnext_url,
                username: payload.username,
                password: '***',
                google_api_key: payload.google_api_key ? `*** (${payload.google_api_key.length} chars)` : 'MISSING',
                api_key: payload.api_key,
                api_secret: payload.api_secret ? '***' : 'MISSING',
                mongo_uri: payload.mongo_uri || 'null'
            });
            
            const response = await fetch(`${this.settings.api_server_url}/init_session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.sessionId = data.session_id;
                this.isConnected = true;
                this.updateConnectionStatus('connected', 'Connected to AIDA');
                this.enableChat();
                console.log('AIDA connection successful:', data.message);
                
                // Update welcome message
                this.messageContainer.innerHTML = `
                    <div class="welcome-message">
                        <p>✅ Connected to AIDA! I'm ready to help you with ERPNext.</p>
                        <p>Ask me anything about your system!</p>
                    </div>
                `;
            } else {
                console.error('API server error response:', data);
                throw new Error(data.error || 'Connection failed');
            }
        } catch (error) {
            console.error('AIDA connection failed:', error);
            this.updateConnectionStatus('disconnected', `Error: ${error.message}`);
            this.disableChat();
            
            if (error.message.includes('fetch')) {
                frappe.show_alert({
                    message: 'Cannot reach API server. Please check if it\'s running.',
                    indicator: 'red'
                });
            }
        }
    }
    
    showSettingsPrompt(message) {
        if (this.isFloating) {
            // For floating widget, show a simple message in the chat
            this.addMessage(`${message} Click here to open settings.`, 'ai', false, true);
        } else {
            // For main interface, show a modal or redirect
            frappe.msgprint({
                title: 'AIDA Configuration Required',
                message: `${message}<br><br><a href="/app/aida-ai-settings" class="btn btn-primary">Open AIDA Settings</a>`,
                indicator: 'orange'
            });
        }
    }
    
    async sendMessage() {
        const message = this.inputField.value.trim();
        if (!message || !this.isConnected) return;
        
        this.addMessage(message, 'user');
        this.inputField.value = '';
        this.sendButton.disabled = true;
        
        this.showTypingIndicator();
        
        try {
            const response = await fetch(`${this.settings.api_server_url}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: this.sessionId,
                    user_input: message
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.addMessage(data.response, 'ai');
            } else {
                throw new Error(data.error || 'Failed to get response');
            }
        } catch (error) {
            console.error('Chat error:', error);
            this.addMessage(`Sorry, I encountered an error: ${error.message}`, 'ai', true);
        } finally {
            this.hideTypingIndicator();
            this.sendButton.disabled = false;
        }
    }
    
    addMessage(content, sender, isError = false, isClickable = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = sender === 'user' ? 
            `<i class="fa fa-user"></i>` : 
            `<i class="fa fa-robot"></i>`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        if (isError) {
            messageContent.style.color = '#dc3545';
        }
        if (isClickable) {
            messageContent.style.cursor = 'pointer';
            messageContent.addEventListener('click', () => {
                window.open('/app/aida-ai-settings', '_blank');
            });
        }
        messageContent.textContent = content;
        
        if (sender === 'user') {
            messageDiv.appendChild(messageContent);
            messageDiv.appendChild(avatar);
        } else {
            messageDiv.appendChild(avatar);
            messageDiv.appendChild(messageContent);
        }
        
        this.messageContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    showTypingIndicator() {
        if (this.isTyping) return;
        
        this.isTyping = true;
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai typing-indicator-wrapper';
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fa fa-robot"></i>
            </div>
            <div class="typing-indicator">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        this.messageContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        if (!this.isTyping) return;
        
        this.isTyping = false;
        const typingIndicator = this.messageContainer.querySelector('.typing-indicator-wrapper');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    updateConnectionStatus(status, text) {
        this.statusIndicator.className = `status-indicator ${status}`;
        this.statusText.textContent = text;
    }
    
    enableChat() {
        this.inputField.disabled = false;
        this.inputField.placeholder = 'Ask me anything about ERPNext...';
    }
    
    disableChat() {
        this.inputField.disabled = true;
        this.sendButton.disabled = true;
        this.inputField.placeholder = 'Please configure settings first...';
    }
    
    toggleFloatingChat() {
        const chatWindow = document.getElementById('aida-float-chat');
        chatWindow.classList.toggle('show');
    }
    
    hideFloatingChat() {
        document.getElementById('aida-float-chat').classList.remove('show');
    }
    
    clearChat() {
        const messages = this.messageContainer.querySelectorAll('.message');
        messages.forEach(msg => msg.remove());
        
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'welcome-message';
        welcomeDiv.innerHTML = '<p>Chat cleared. How can I help you?</p>';
        this.messageContainer.appendChild(welcomeDiv);
    }
    
    scrollToBottom() {
        this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
    }
    
    openSettings() {
        frappe.set_route('Form', 'AIDA AI Settings', 'AIDA AI Settings');
    }
}

// Initialize floating widget on all pages
$(document).ready(function() {
    // Only create floating widget if not on specific pages
    if (!window.location.pathname.includes('aida-chat') && 
        !window.location.pathname.includes('aida-test')) {
        window.aidaFloatingWidget = new AidaChatInterface(true);
    }
});
