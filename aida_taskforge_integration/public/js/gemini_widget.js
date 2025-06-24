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
        this.currentView = 'chat';
        this.currentUser = frappe.session.user;
        
        this.init();
    }
    
    generateSessionId() {
        return 'aida_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    async init() {
        await this.loadUserSettings();
        
        if (this.isFloating) {
            this.createFloatingWidget();
        } else {
            this.initMainInterface();
        }
        
        // Use existing session or create new one
        if (this.settings && this.settings.current_session_id) {
            this.sessionId = this.settings.current_session_id;
        } else {
            this.sessionId = this.generateSessionId();
            await this.updateCurrentSession(this.sessionId);
        }
        
        await this.loadConversationHistory();
        
        // Auto-connect if configured
        if (this.settings && this.settings.configured) {
            this.connectToAPI();
        }
    }

    async updateCurrentSession(sessionId) {
        try {
            await frappe.call({
                method: 'aida_taskforge_integration.aida_taskforge_integration.doctype.aida_user_settings.aida_user_settings.update_current_session',
                args: { session_id: sessionId }
            });
        } catch (error) {
            console.error('Failed to update current session:', error);
        }
    }
    
    initMainInterface() {
        // For full-page interface
        this.messageContainer = document.getElementById('chat-messages');
        this.inputField = document.getElementById('main-input');
        this.sendButton = document.getElementById('main-send-btn');
        this.statusIndicator = document.querySelector('#chat-status .status-indicator');
        this.statusText = document.querySelector('#chat-status .status-text');
        
        if (this.inputField && this.sendButton) {
            this.setupMainInterfaceEvents();
        }
        
        // Load sessions in sidebar
        this.loadSessionsInSidebar();
    }

    async loadSessionsInSidebar() {
        try {
            const response = await frappe.call({
                method: 'aida_taskforge_integration.aida_taskforge_integration.doctype.aida_conversation.aida_conversation.get_user_sessions'
            });
            
            const sessionsList = document.getElementById('sessions-list');
            if (sessionsList && response.message) {
                sessionsList.innerHTML = '';
                
                response.message.forEach(session => {
                    const sessionItem = document.createElement('div');
                    sessionItem.className = `session-item ${session.session_id === this.sessionId ? 'active' : ''}`;
                    sessionItem.innerHTML = `
                        <div style="font-weight: 600; margin-bottom: 5px;">${session.preview}</div>
                        <div style="font-size: 12px; color: #666;">
                            ${session.message_count} messages • ${new Date(session.last_activity).toLocaleDateString()}
                        </div>
                    `;
                    
                    sessionItem.addEventListener('click', () => {
                        this.switchToSession(session.session_id);
                    });
                    
                    sessionsList.appendChild(sessionItem);
                });
            }
        } catch (error) {
            console.error('Failed to load sessions:', error);
        }
    }

    async switchToSession(sessionId) {
        this.sessionId = sessionId;
        await this.updateCurrentSession(sessionId);
        await this.loadConversationHistory();
        
        // Update active session in sidebar
        document.querySelectorAll('.session-item').forEach(item => {
            item.classList.remove('active');
        });
        event.target.closest('.session-item').classList.add('active');
        
        // Update session info
        this.updateSessionInfo();
    }

    updateSessionInfo() {
        const sessionInfo = document.querySelector('.session-info');
        if (sessionInfo) {
            sessionInfo.textContent = `Session: ${this.sessionId.substr(-8)}`;
        }
    }
    
    setupMainInterfaceEvents() {
        // Send button click
        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });
        
        // Enter key in textarea
        this.inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Auto-resize textarea
        this.inputField.addEventListener('input', () => {
            this.inputField.style.height = 'auto';
            this.inputField.style.height = this.inputField.scrollHeight + 'px';
        });
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
                    <span class="notification-dot" id="aida-notification" style="display: none;"></span>
                </button>
                <div class="aida-float-chat" id="aida-float-chat">
                    <div class="float-chat-header">
                        <div class="header-info">
                            <h4 id="aida-header-title"><i class="fa fa-robot"></i> AIDA Assistant</h4>
                            <span class="session-info">Session: ${this.sessionId.substr(-8)}</span>
                        </div>
                        <div class="header-controls">
                            <button class="header-btn" id="aida-sessions-btn" title="Sessions">
                                <i class="fa fa-history"></i>
                            </button>
                            <button class="header-btn" id="aida-settings-btn" title="Settings">
                                <i class="fa fa-cog"></i>
                            </button>
                            <button class="header-btn" id="aida-fullscreen-btn" title="Open Full Screen">
                                <i class="fa fa-expand"></i>
                            </button>
                            <button class="float-chat-close" id="float-chat-close">×</button>
                        </div>
                    </div>
                    
                    <!-- Chat View -->
                    <div class="chat-view" id="chat-view">
                        <div class="float-chat-messages" id="float-chat-messages">
                            <div class="welcome-message">
                                <div class="avatar-message ai">
                                    <div class="message-avatar"><i class="fa fa-robot"></i></div>
                                    <div class="message-content">
                                        <p>Hi! I'm AIDA, your ERPNext AI assistant.</p>
                                        <p>Click the settings icon ⚙️ to configure your API credentials.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="float-chat-input">
                            <div class="input-wrapper">
                                <textarea class="chat-input" id="float-chat-input" 
                                         placeholder="Configure settings first..." 
                                         disabled rows="1"></textarea>
                                <button class="send-btn" id="float-send-btn" disabled>
                                    <i class="fa fa-paper-plane"></i>
                                </button>
                            </div>
                            <div class="chat-controls">
                                <div class="connection-status" id="float-connection-status">
                                    <span class="status-indicator disconnected"></span>
                                    <span class="status-text">Not configured</span>
                                </div>
                                <button class="clear-btn" id="clear-chat-btn" title="Clear conversation">
                                    <i class="fa fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Settings View -->
                    <div class="settings-view" id="settings-view" style="display: none;">
                        <div class="settings-content">
                            ${this.getSettingsFormHTML()}
                        </div>
                    </div>
                    
                    <!-- Sessions View -->
                    <div class="sessions-view" id="sessions-view" style="display: none;">
                        <div class="sessions-content">
                            <div class="sessions-header">
                                <h5><i class="fa fa-history"></i> Chat Sessions</h5>
                                <button class="btn btn-sm btn-primary" id="new-session-btn">
                                    <i class="fa fa-plus"></i> New Session
                                </button>
                            </div>
                            <div class="sessions-list" id="sessions-list">
                                <!-- Sessions will be loaded here -->
                            </div>
                            <div class="sessions-actions">
                                <button type="button" class="btn btn-light" id="back-to-chat-from-sessions-btn">
                                    <i class="fa fa-arrow-left"></i> Back to Chat
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', widgetHtml);
        this.setupFloatingWidgetEvents();
    }

    setupFloatingWidgetEvents() {
        // Get references to floating widget elements
        this.messageContainer = document.getElementById('float-chat-messages');
        this.inputField = document.getElementById('float-chat-input');
        this.sendButton = document.getElementById('float-send-btn');
        this.statusIndicator = document.querySelector('#float-connection-status .status-indicator');
        this.statusText = document.querySelector('#float-connection-status .status-text');

        // Widget toggle
        document.getElementById('aida-float-btn')?.addEventListener('click', () => {
            this.toggleFloatingChat();
        });
        
        // Close button
        document.getElementById('float-chat-close')?.addEventListener('click', () => {
            this.hideFloatingChat();
        });
        
        // Settings button
        document.getElementById('aida-settings-btn')?.addEventListener('click', () => {
            this.showSettingsView();
        });
        
        // Sessions button
        document.getElementById('aida-sessions-btn')?.addEventListener('click', () => {
            this.showSessionsView();
        });
        
        // Fullscreen button
        document.getElementById('aida-fullscreen-btn')?.addEventListener('click', () => {
            window.open('/aida-chat', '_blank');
        });
        
        // Back to chat buttons
        document.getElementById('back-to-chat-btn')?.addEventListener('click', () => {
            this.showChatView();
        });
        
        document.getElementById('back-to-chat-from-sessions-btn')?.addEventListener('click', () => {
            this.showChatView();
        });
        
        // New session button
        document.getElementById('new-session-btn')?.addEventListener('click', () => {
            this.startNewSession();
        });
        
        // Clear chat button
        document.getElementById('clear-chat-btn')?.addEventListener('click', () => {
            this.clearCurrentConversation();
        });
        
        // Send message events
        this.sendButton?.addEventListener('click', () => {
            this.sendMessage();
        });
        
        this.inputField?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Auto-resize textarea
        this.inputField?.addEventListener('input', () => {
            this.inputField.style.height = 'auto';
            this.inputField.style.height = Math.min(this.inputField.scrollHeight, 120) + 'px';
        });
        
        // Setup settings form events
        this.setupSettingsFormEvents();
    }

    showSessionsView() {
        document.getElementById('chat-view').style.display = 'none';
        document.getElementById('settings-view').style.display = 'none';
        document.getElementById('sessions-view').style.display = 'block';
        document.getElementById('aida-header-title').innerHTML = '<i class="fa fa-history"></i> Chat Sessions';
        
        this.loadSessionsInWidget();
    }

    async loadSessionsInWidget() {
        try {
            const response = await frappe.call({
                method: 'aida_taskforge_integration.aida_taskforge_integration.doctype.aida_conversation.aida_conversation.get_user_sessions'
            });
            
            const sessionsList = document.getElementById('sessions-list');
            if (sessionsList && response.message) {
                sessionsList.innerHTML = '';
                
                response.message.forEach(session => {
                    const sessionItem = document.createElement('div');
                    sessionItem.className = `session-item ${session.session_id === this.sessionId ? 'active' : ''}`;
                    sessionItem.innerHTML = `
                        <div style="font-weight: 600; margin-bottom: 5px;">${session.preview}</div>
                        <div style="font-size: 12px; color: #666;">
                            ${session.message_count} messages • ${new Date(session.last_activity).toLocaleDateString()}
                        </div>
                    `;
                    
                    sessionItem.addEventListener('click', () => {
                        this.switchToSession(session.session_id);
                        this.showChatView();
                    });
                    
                    sessionsList.appendChild(sessionItem);
                });
            }
        } catch (error) {
            console.error('Failed to load sessions:', error);
        }
    }

    getSettingsFormHTML() {
        return `
            <div class="settings-header">
                <h5><i class="fa fa-cog"></i> AIDA Configuration</h5>
                <p class="settings-description">Configure your AIDA AI assistant settings</p>
            </div>
            
            <form id="aida-settings-form">
                <div class="form-group">
                    <label for="api-server-url">
                        <i class="fa fa-server"></i> API Server URL
                    </label>
                    <input type="text" class="form-control" id="api-server-url" 
                           value="http://localhost:5000" placeholder="http://localhost:5000">
                    <small class="form-text">URL where your AIDA API server is running</small>
                </div>
                
                <div class="form-group">
                    <label for="google-api-key">
                        <i class="fa fa-key"></i> Google API Key
                    </label>
                    <input type="password" class="form-control" id="google-api-key" 
                           placeholder="Enter your Google Gemini API key">
                    <small class="form-text">Required for AI functionality</small>
                </div>
                
                <div class="form-group">
                    <label for="erpnext-url">
                        <i class="fa fa-link"></i> ERPNext URL
                    </label>
                    <input type="text" class="form-control" id="erpnext-url" 
                           placeholder="Auto-detected from current site">
                    <small class="form-text">Usually auto-detected correctly</small>
                </div>
                
                <div class="auth-section">
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="use-manual-auth"> 
                            <span class="checkmark"></span>
                            Use Manual Login (instead of session)
                        </label>
                        <small class="form-text">Check this if session authentication doesn't work</small>
                    </div>
                    
                    <div class="manual-auth-fields" id="manual-auth-fields" style="display: none;">
                        <div class="form-group">
                            <label for="erpnext-username">
                                <i class="fa fa-user"></i> ERPNext Username
                            </label>
                            <input type="text" class="form-control" id="erpnext-username" 
                                   placeholder="Administrator" value="Administrator">
                        </div>
                        
                        <div class="form-group">
                            <label for="erpnext-password">
                                <i class="fa fa-lock"></i> ERPNext Password
                            </label>
                            <input type="password" class="form-control" id="erpnext-password" 
                                   placeholder="Enter your ERPNext password">
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="mongo-uri">
                        <i class="fa fa-database"></i> MongoDB URI (Optional)
                    </label>
                    <input type="text" class="form-control" id="mongo-uri" 
                           placeholder="mongodb://localhost:27017/aida">
                    <small class="form-text">For conversation history storage</small>
                </div>
                
                <div class="settings-actions">
                    <button type="button" class="btn btn-primary" id="save-settings-btn">
                        <i class="fa fa-save"></i> Save & Connect
                    </button>
                    <button type="button" class="btn btn-secondary" id="test-connection-btn">
                        <i class="fa fa-plug"></i> Test Connection
                    </button>
                    <button type="button" class="btn btn-light" id="back-to-chat-btn">
                        <i class="fa fa-arrow-left"></i> Back to Chat
                    </button>
                </div>
            </form>
        `;
    }

    setupSettingsFormEvents() {
        // Manual auth toggle
        const useManualAuth = document.getElementById('use-manual-auth');
        const manualAuthFields = document.getElementById('manual-auth-fields');
        
        if (useManualAuth && manualAuthFields) {
            useManualAuth.addEventListener('change', (e) => {
                manualAuthFields.style.display = e.target.checked ? 'block' : 'none';
            });
        }
        
        // Save settings button
        document.getElementById('save-settings-btn')?.addEventListener('click', () => {
            this.saveSettings();
        });
        
        // Test connection button
        document.getElementById('test-connection-btn')?.addEventListener('click', () => {
            this.testConnection();
        });
        
        // Auto-fill ERPNext URL
        const erpnextUrlField = document.getElementById('erpnext-url');
        if (erpnextUrlField && !erpnextUrlField.value) {
            erpnextUrlField.value = window.location.origin;
        }
    }

    async loadUserSettings() {
        try {
            const response = await frappe.call({
                method: 'aida_taskforge_integration.aida_taskforge_integration.doctype.aida_user_settings.aida_user_settings.get_user_settings'
            });
            
            if (response.message) {
                this.settings = response.message;
                this.populateSettingsForm();
            }
        } catch (error) {
            console.error('Failed to load user settings:', error);
            // Fallback to default settings
            this.settings = {
                api_server_url: 'http://localhost:5000',
                erpnext_url: window.location.origin,
                google_api_key: '',
                mongo_uri: '',
                use_manual_auth: false,
                username: 'Administrator',
                password: '',
                current_session_id: '',
                configured: false
            };
        }
    }

    populateSettingsForm() {
        if (!this.settings) return;
        
        const fields = {
            'api-server-url': this.settings.api_server_url || 'http://localhost:5000',
            'erpnext-url': this.settings.erpnext_url || window.location.origin,
            'google-api-key': this.settings.google_api_key || '',
            'mongo-uri': this.settings.mongo_uri || '',
            'erpnext-username': this.settings.username || 'Administrator',
            'erpnext-password': this.settings.password || ''
        };
        
        Object.keys(fields).forEach(id => {
            const field = document.getElementById(id);
            if (field) {
                field.value = fields[id];
            }
        });
        
        const useManualAuth = document.getElementById('use-manual-auth');
        const manualAuthFields = document.getElementById('manual-auth-fields');
        
        if (useManualAuth) {
            useManualAuth.checked = this.settings.use_manual_auth || false;
            if (manualAuthFields) {
                manualAuthFields.style.display = this.settings.use_manual_auth ? 'block' : 'none';
            }
        }
    }

    async saveSettings() {
        try {
            // Get values from form
            const useManualAuth = document.getElementById('use-manual-auth')?.checked || false;
            
            const settings = {
                api_server_url: document.getElementById('api-server-url')?.value?.trim() || '',
                erpnext_url: document.getElementById('erpnext-url')?.value?.trim() || '',
                google_api_key: document.getElementById('google-api-key')?.value?.trim() || '',
                mongo_uri: document.getElementById('mongo-uri')?.value?.trim() || '',
                use_manual_auth: useManualAuth,
                username: document.getElementById('erpnext-username')?.value?.trim() || 'Administrator',
                password: document.getElementById('erpnext-password')?.value?.trim() || '',
                current_session_id: this.sessionId
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
            
            if (useManualAuth && !settings.password) {
                frappe.show_alert({message: 'Password is required when using manual authentication', indicator: 'red'});
                return;
            }
            
            // Save to server
            const response = await frappe.call({
                method: 'aida_taskforge_integration.aida_taskforge_integration.doctype.aida_user_settings.aida_user_settings.save_user_settings',
                args: { settings: settings }
            });
            
            if (response.message && response.message.status === 'success') {
                this.settings = settings;
                this.settings.configured = true;
                frappe.show_alert({message: 'Settings saved successfully!', indicator: 'green'});
                
                // Try to connect
                this.showChatView();
                this.connectToAPI();
                
                // Close modal if in full page mode
                if (typeof closeSettingsModal === 'function') {
                    closeSettingsModal();
                }
            }
            
        } catch (error) {
            console.error('Failed to save settings:', error);
            frappe.show_alert({message: 'Failed to save settings', indicator: 'red'});
        }
    }

    async testConnection() {
        try {
            const response = await frappe.call({
                method: 'aida_taskforge_integration.aida_taskforge_integration.doctype.aida_user_settings.aida_user_settings.test_connection'
            });
            
            if (response.message) {
                if (response.message.status === 'success') {
                    frappe.show_alert({message: response.message.message, indicator: 'green'});
                } else {
                    frappe.show_alert({message: response.message.message, indicator: 'red'});
                }
            }
        } catch (error) {
            console.error('Connection test failed:', error);
            frappe.show_alert({message: 'Connection test failed', indicator: 'red'});
        }
    }

    async connectToAPI() {
        if (!this.settings || !this.settings.google_api_key) {
            this.updateConnectionStatus('disconnected', 'Settings required');
            return;
        }
        
        this.updateConnectionStatus('connecting', 'Connecting...');
        
        try {
            let payload;
            
            if (this.settings.use_manual_auth) {
                payload = {
                    erpnext_url: this.settings.erpnext_url,
                    username: this.settings.username,
                    password: this.settings.password,
                    google_api_key: this.settings.google_api_key,
                    mongo_uri: this.settings.mongo_uri
                };
            } else {
                payload = {
                    erpnext_url: this.settings.erpnext_url,
                    username: 'session_token',
                    password: 'session_token',
                    google_api_key: this.settings.google_api_key,
                    mongo_uri: this.settings.mongo_uri,
                    api_key: frappe.session.user,
                    api_secret: this.getCookie('sid')
                };
            }
            
            console.log('Connecting with payload:', {
                ...payload,
                google_api_key: '***',
                password: '***',
                api_secret: payload.api_secret ? '***' : undefined
            });
            
            const response = await fetch(`${this.settings.api_server_url}/init_session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.sessionId = data.session_id;
                this.isConnected = true;
                this.updateConnectionStatus('connected', 'Connected to AIDA');
                
                // Enable input
                if (this.inputField) {
                    this.inputField.disabled = false;
                    this.inputField.placeholder = 'Ask me anything...';
                }
                if (this.sendButton) {
                    this.sendButton.disabled = false;
                }
                
                // Show success message
                this.addMessage('✅ Connected to AIDA! Ready to help with ERPNext.', 'ai', false);
                
            } else {
                throw new Error(data.error || 'Connection failed');
            }
        } catch (error) {
            console.error('Connection failed:', error);
            this.updateConnectionStatus('disconnected', `Error: ${error.message}`);
        }
    }

    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    async sendMessage() {
        if (!this.isConnected || this.isTyping) return;
        
        const message = this.inputField.value.trim();
        if (!message) return;
        
        // Add user message
        this.addMessage(message, 'user');
        
        // Clear input
        this.inputField.value = '';
        this.inputField.style.height = 'auto';
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            const response = await fetch(`${this.settings.api_server_url}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: this.sessionId,
                    user_input: message
                })
            });
            
            const data = await response.json();
            
            this.hideTypingIndicator();
            
            if (response.ok) {
                this.addMessage(data.response, 'ai');
            } else {
                this.addMessage(`Error: ${data.error}`, 'ai');
            }
            
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage(`Error: ${error.message}`, 'ai');
        }
    }

    showTypingIndicator() {
        this.isTyping = true;
        const typingDiv = document.createElement('div');
        typingDiv.className = 'avatar-message ai typing-message';
        typingDiv.innerHTML = `
            <div class="message-avatar"><i class="fa fa-robot"></i></div>
            <div class="message-content typing-indicator">
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
        this.isTyping = false;
        const typingMessage = this.messageContainer.querySelector('.typing-message');
        if (typingMessage) {
            typingMessage.remove();
        }
    }

    addMessage(content, sender, saveToHistory = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `avatar-message ${sender}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = sender === 'user' ? 
            `<i class="fa fa-user"></i>` : 
            `<i class="fa fa-robot"></i>`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        // Handle markdown-like formatting
        const formattedContent = this.formatMessage(content);
        messageContent.innerHTML = formattedContent;
        
        const timestamp = document.createElement('div');
        timestamp.className = 'message-timestamp';
        timestamp.textContent = new Date().toLocaleTimeString();
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        messageContent.appendChild(timestamp);
        
        this.messageContainer.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Save to history
        if (saveToHistory) {
            this.saveMessage(content, sender);
        }
    }

    formatMessage(content) {
        // Basic markdown-like formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    async saveMessage(message, messageType) {
        try {
            await frappe.call({
                method: 'aida_taskforge_integration.aida_taskforge_integration.doctype.aida_conversation.aida_conversation.save_message',
                args: {
                    session_id: this.sessionId,
                    message_type: messageType,
                    message: message
                }
            });
        } catch (error) {
            console.error('Failed to save message:', error);
        }
    }

    async loadConversationHistory() {
        try {
            const response = await frappe.call({
                method: 'aida_taskforge_integration.aida_taskforge_integration.doctype.aida_conversation.aida_conversation.get_conversation_history',
                args: { session_id: this.sessionId }
            });
            
            if (response.message && response.message.length > 0) {
                this.messageContainer.innerHTML = '';
                response.message.forEach(msg => {
                    this.addMessage(msg.message, msg.message_type, false);
                });
            }
        } catch (error) {
            console.error('Failed to load conversation history:', error);
        }
    }

    updateConnectionStatus(status, text) {
        if (this.statusIndicator) {
            this.statusIndicator.className = `status-indicator ${status}`;
        }
        if (this.statusText) {
            this.statusText.textContent = text;
        }
    }

    scrollToBottom() {
        if (this.messageContainer) {
            this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
        }
    }

    // View management methods
    showChatView() {
        document.getElementById('chat-view').style.display = 'block';
        document.getElementById('settings-view').style.display = 'none';
        document.getElementById('sessions-view').style.display = 'none';
        document.getElementById('aida-header-title').innerHTML = '<i class="fa fa-robot"></i> AIDA Assistant';
    }
    
    showSettingsView() {
        document.getElementById('chat-view').style.display = 'none';
        document.getElementById('settings-view').style.display = 'block';
        document.getElementById('sessions-view').style.display = 'none';
        document.getElementById('aida-header-title').innerHTML = '<i class="fa fa-cog"></i> AIDA Settings';
    }
    
    toggleFloatingChat() {
        const chatWindow = document.getElementById('aida-float-chat');
        chatWindow.classList.toggle('show');
    }
    
    hideFloatingChat() {
        document.getElementById('aida-float-chat').classList.remove('show');
    }

    async clearCurrentConversation() {
        if (confirm('Are you sure you want to clear this conversation?')) {
            try {
                await frappe.call({
                    method: 'aida_taskforge_integration.aida_taskforge_integration.doctype.aida_conversation.aida_conversation.clear_conversation_history',
                    args: { session_id: this.sessionId }
                });
                
                // Clear UI
                if (this.messageContainer) {
                    this.messageContainer.innerHTML = `
                        <div class="welcome-message">
                            <div class="avatar-message ai">
                                <div class="message-avatar"><i class="fa fa-robot"></i></div>
                                <div class="message-content">
                                    <p>Conversation cleared!</p>
                                    <p>How can I help you today?</p>
                                </div>
                            </div>
                        </div>
                    `;
                }
                
                frappe.show_alert({message: 'Conversation cleared successfully!', indicator: 'green'});
                
                // Refresh sessions list
                if (!this.isFloating) {
                    this.loadSessionsInSidebar();
                }
                
            } catch (error) {
                console.error('Failed to clear conversation:', error);
                frappe.show_alert({message: 'Failed to clear conversation', indicator: 'red'});
            }
        }
    }

    async startNewSession() {
        this.sessionId = this.generateSessionId();
        await this.updateCurrentSession(this.sessionId);
        
        if (this.messageContainer) {
            this.messageContainer.innerHTML = `
                <div class="welcome-message">
                    <div class="avatar-message ai">
                        <div class="message-avatar"><i class="fa fa-robot"></i></div>
                        <div class="message-content">
                            <p>New conversation started!</p>
                            <p>How can I help you today?</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Update session info
        this.updateSessionInfo();
        
        // Refresh sessions list
        if (!this.isFloating) {
            this.loadSessionsInSidebar();
        } else {
            this.loadSessionsInWidget();
        }
        
        frappe.show_alert({message: 'New conversation started!', indicator: 'green'});
    }
}

// Enhanced global functions for full-page interface
function openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const container = document.getElementById('settings-form-container');
    
    if (window.aidaFullPageInterface) {
        // Create settings form HTML
        container.innerHTML = window.aidaFullPageInterface.getSettingsFormHTML();
        
        // Populate with current settings
        window.aidaFullPageInterface.populateSettingsForm();
        
        // Setup form events
        window.aidaFullPageInterface.setupSettingsFormEvents();
        
        modal.style.display = 'block';
    }
}

function closeSettingsModal() {
    document.getElementById('settings-modal').style.display = 'none';
}

function minimizeToWidget() {
    // Create floating widget if it doesn't exist
    if (!document.getElementById('aida-float-widget')) {
        new AidaChatInterface(true);
    }
    
    // Navigate back to previous page or home
    if (document.referrer) {
        window.location.href = document.referrer;
    } else {
        window.location.href = '/';
    }
}

function startNewChat() {
    if (window.aidaFullPageInterface) {
        window.aidaFullPageInterface.startNewSession();
    }
}

// Auto-initialize based on page context
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the AIDA chat page
    if (window.location.pathname.includes('aida-chat')) {
        // Initialize full-page interface
        window.aidaFullPageInterface = new AidaChatInterface(false);
        
        // Setup full-page specific events
        document.getElementById('settings-btn')?.addEventListener('click', openSettingsModal);
        document.getElementById('minimize-btn')?.addEventListener('click', minimizeToWidget);
        document.getElementById('new-chat-btn')?.addEventListener('click', startNewChat);
        
        // Close modal when clicking outside
        document.getElementById('settings-modal')?.addEventListener('click', function(e) {
            if (e.target === this) {
                closeSettingsModal();
            }
        });
    } else {
        // Initialize floating widget for other pages
        setTimeout(() => {
            if (typeof frappe !== 'undefined' && frappe.session.user !== 'Guest') {
                try {
                    window.aidaFloatingWidget = new AidaChatInterface(true);
                    console.log('AIDA floating widget initialized');
                } catch (error) {
                    console.error('Failed to initialize AIDA floating widget:', error);
                }
            }
        }, 2000);
    }
});

// Make AidaChatInterface globally available
window.AidaChatInterface = AidaChatInterface;
