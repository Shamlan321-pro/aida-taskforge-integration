class AidaWidget {
    constructor() {
        this.sessionId = null;
        this.settings = this.getDefaultSettings();
        this.isConnect    createWidget() {
        // Remove existing widget if present
        const existing = document.getElementById('aida-widget');
        if (existing) existing.remove();
        
        // Inject responsive CSS styles
        this.injectResponsiveStyles();
        
        const widgetHTML = `
            <div id="aida-widget" class="aida-widget ${this.isMobile ? 'mobile' : 'desktop'}">
                <!-- Floating Button -->
                <div class="aida-float-btn" id="aida-float-btn">
                    <i class="fa fa-robot"></i>
                    <span class="aida-pulse"></span>
                </div>
                
                <!-- Chat Window -->
                <div class="aida-chat-window ${this.isMobile ? 'mobile' : 'desktop'}" id="aida-chat-window">`;     this.conversationLoaded = false;
        this.apiSessionId = null;
        this.isMobile = this.detectMobile();
        
        this.init();
    }
    
    detectMobile() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const screenWidth = window.innerWidth;
        
        // Check for mobile user agents and screen size
        const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        const isSmallScreen = screenWidth <= 768;
        
        return isMobileDevice || isSmallScreen;
    }
    
    generateSessionId() {
        return 'aida_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    getDefaultSettings() {
        return {
            api_server_url: 'http://localhost:5000',
            erpnext_url: window.location.origin,
            google_api_key: '',
            mongo_uri: '',
            use_manual_auth: false,
            username: frappe.session.user || 'Administrator',
            password: ''
        };
    }
    
    async init() {
        this.registerServiceWorker();
        await this.loadUserSession();
        await this.loadSettings();
        this.createWidget();
        this.bindEvents();
        this.handleOrientationChange();
        
        // Load conversation history first, then auto-connect if configured
        if (this.sessionId) {
            await this.loadConversationHistory();
        }
        
        if (this.settings.configured) {
            this.connectToAPI();
        }
    }
    
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered:', registration);
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }
    
    handleOrientationChange() {
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.isMobile = this.detectMobile();
                this.updateWidgetLayout();
            }, 100);
        });
        
        window.addEventListener('resize', () => {
            this.isMobile = this.detectMobile();
            this.updateWidgetLayout();
        });
    }
    
    updateWidgetLayout() {
        const widget = document.getElementById('aida-widget');
        const chatWindow = document.getElementById('aida-chat-window');
        if (widget && chatWindow) {
            widget.className = `aida-widget ${this.isMobile ? 'mobile' : 'desktop'}`;
            chatWindow.className = `aida-chat-window ${this.isMobile ? 'mobile' : 'desktop'}`;
        }
    }
    
    async loadUserSession() {
        try {
            const response = await frappe.call({
                method: 'aida_taskforge_integration.aida_taskforge_integration.doctype.aida_user_settings.aida_user_settings.get_user_settings'
            });
            
            if (response.message && response.message.current_session_id) {
                this.sessionId = response.message.current_session_id;
                console.log('Loaded existing session:', this.sessionId);
            } else {
                this.sessionId = this.generateSessionId();
                await this.saveUserSession();
                console.log('Created new session:', this.sessionId);
            }
        } catch (error) {
            console.error('Failed to load user session:', error);
            this.sessionId = localStorage.getItem('aida_session_id') || this.generateSessionId();
            localStorage.setItem('aida_session_id', this.sessionId);
        }
    }
    
    async saveUserSession() {
        try {
            await frappe.call({
                method: 'aida_taskforge_integration.aida_taskforge_integration.doctype.aida_user_settings.aida_user_settings.update_current_session',
                args: { session_id: this.sessionId }
            });
            localStorage.setItem('aida_session_id', this.sessionId);
        } catch (error) {
            console.error('Failed to save user session:', error);
            localStorage.setItem('aida_session_id', this.sessionId);
        }
    }
    
    async loadSettings() {
        const stored = localStorage.getItem('aida_widget_settings');
        if (stored) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(stored) };
                this.settings.configured = !!(this.settings.google_api_key && this.settings.api_server_url);
            } catch (e) {
                console.error('Failed to parse stored settings:', e);
            }
        }
    }
    
    async saveSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.settings.configured = !!(this.settings.google_api_key && this.settings.api_server_url);
        localStorage.setItem('aida_widget_settings', JSON.stringify(this.settings));
    }
    
    createWidget() {
        // Remove existing widget if present
        const existing = document.getElementById('aida-widget');
        if (existing) existing.remove();
        
        const widgetHTML = `
            <div id="aida-widget" class="aida-widget ${this.isMobile ? 'mobile' : 'desktop'}">
                <!-- Floating Button -->
                <div class="aida-float-btn" id="aida-float-btn">
                    <i class="fa fa-robot"></i>
                    <span class="aida-pulse"></span>
                </div>
                
                <!-- Chat Window -->
                <div class="aida-chat-window ${this.isMobile ? 'mobile' : 'desktop'}" id="aida-chat-window">
                    <div class="aida-header">
                        <div class="aida-title">
                            <i class="fa fa-robot"></i>
                            <span>AIDA Assistant</span>
                        </div>
                        <div class="aida-controls">
                            <button class="aida-btn" id="aida-settings-btn" title="Settings">
                                <i class="fa fa-cog"></i>
                            </button>
                            <button class="aida-btn" id="aida-clear-btn" title="Clear Chat">
                                <i class="fa fa-trash"></i>
                            </button>
                            <button class="aida-btn" id="aida-minimize-btn" title="Minimize">
                                <i class="fa fa-minus"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Chat View -->
                    <div class="aida-chat-view" id="aida-chat-view">
                        <div class="aida-messages" id="aida-messages">
                            <div class="aida-welcome">
                                <div class="aida-message aida-ai">
                                    <div class="aida-avatar">🤖</div>
                                    <div class="aida-content">
                                        <p>Hi! I'm AIDA, your AI assistant.</p>
                                        <p id="aida-status-msg">Click the settings icon ⚙️ to configure your credentials.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="aida-input-area">
                            <div class="aida-connection-status" id="aida-connection-status">
                                <span class="aida-status-dot aida-disconnected"></span>
                                <span class="aida-status-text">Not configured</span>
                            </div>
                            <div class="aida-input-wrapper">
                                <textarea 
                                    id="aida-input" 
                                    placeholder="Configure settings first..." 
                                    disabled
                                    rows="1"></textarea>
                                <button id="aida-send-btn" class="aida-send-btn" disabled>
                                    <i class="fa fa-paper-plane"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Settings View -->
                    <div class="aida-settings-view" id="aida-settings-view" style="display: none;">
                        <div class="aida-settings-header">
                            <h4><i class="fa fa-cog"></i> AIDA Configuration</h4>
                            <button class="aida-btn" id="aida-back-btn">
                                <i class="fa fa-arrow-left"></i>
                            </button>
                        </div>
                        
                        <div class="aida-settings-content">
                            <div class="aida-form-group">
                                <label><i class="fa fa-server"></i> API Server URL</label>
                                <input type="text" id="aida-api-url" placeholder="http://localhost:5000" value="http://localhost:5000">
                                <small>URL where your AIDA API server is running</small>
                            </div>
                            
                            <div class="aida-form-group">
                                <label><i class="fa fa-key"></i> Google API Key</label>
                                <input type="password" id="aida-api-key" placeholder="Enter your Google Gemini API key">
                                <small>Required for AI functionality</small>
                            </div>
                            
                            <div class="aida-form-group">
                                <label><i class="fa fa-link"></i> ERPNext URL</label>
                                <input type="text" id="aida-erpnext-url" placeholder="Auto-detected">
                                <small>Usually auto-detected correctly</small>
                            </div>
                            
                            <div class="aida-auth-section">
                                <label class="aida-checkbox-label">
                                    <input type="checkbox" id="aida-manual-auth">
                                    <span>Use Manual Login</span>
                                </label>
                                <small>Check if session authentication doesn't work</small>
                                
                                <div class="aida-manual-fields" id="aida-manual-fields" style="display: none;">
                                    <div class="aida-form-group">
                                        <label><i class="fa fa-user"></i> Username</label>
                                        <input type="text" id="aida-username" placeholder="Administrator" value="Administrator">
                                    </div>
                                    <div class="aida-form-group">
                                        <label><i class="fa fa-lock"></i> Password</label>
                                        <input type="password" id="aida-password" placeholder="Your ERPNext password">
                                    </div>
                                </div>
                            </div>
                            
                            <div class="aida-form-group">
                                <label><i class="fa fa-database"></i> MongoDB URI (Optional)</label>
                                <input type="text" id="aida-mongo-uri" placeholder="mongodb://localhost:27017/aida">
                                <small>For enhanced conversation history</small>
                            </div>
                            
                            <div class="aida-settings-actions">
                                <button class="aida-btn aida-btn-secondary" id="aida-test-btn">
                                    <i class="fa fa-plug"></i> Test Connection
                                </button>
                                <button class="aida-btn aida-btn-primary" id="aida-save-btn">
                                    <i class="fa fa-save"></i> Save & Connect
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', widgetHTML);
        console.log('AIDA widget created');
    }
    
    bindEvents() {
        console.log('🔗 Binding events...');
        
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
            // Widget toggle
            const floatBtn = document.getElementById('aida-float-btn');
            if (floatBtn) {
                floatBtn.addEventListener('click', () => {
                    console.log('🎯 Float button clicked');
                    this.toggleWidget();
                });
                console.log('✅ Float button bound');
            } else {
                console.error('❌ Float button not found');
            }
            
            // Minimize widget
            const minimizeBtn = document.getElementById('aida-minimize-btn');
            if (minimizeBtn) {
                minimizeBtn.addEventListener('click', () => {
                    console.log('🎯 Minimize clicked');
                    this.minimizeWidget();
                });
                console.log('✅ Minimize button bound');
            }
            
            // Clear chat
            const clearBtn = document.getElementById('aida-clear-btn');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    console.log('🎯 Clear chat clicked');
                    this.clearChat();
                });
                console.log('✅ Clear button bound');
            }
            
            // Settings view
            const settingsBtn = document.getElementById('aida-settings-btn');
            if (settingsBtn) {
                settingsBtn.addEventListener('click', () => {
                    console.log('🎯 Settings button clicked');
                    this.showSettings();
                });
                console.log('✅ Settings button bound');
            }
            
            const backBtn = document.getElementById('aida-back-btn');
            if (backBtn) {
                backBtn.addEventListener('click', () => {
                    console.log('🎯 Back button clicked');
                    this.showChat();
                });
                console.log('✅ Back button bound');
            }
            
            // Settings form
            const manualAuth = document.getElementById('aida-manual-auth');
            if (manualAuth) {
                manualAuth.addEventListener('change', (e) => {
                    console.log('🎯 Manual auth changed:', e.target.checked);
                    const fields = document.getElementById('aida-manual-fields');
                    if (fields) {
                        fields.style.display = e.target.checked ? 'block' : 'none';
                    }
                });
                console.log('✅ Manual auth checkbox bound');
            }
            
            const testBtn = document.getElementById('aida-test-btn');
            if (testBtn) {
                testBtn.addEventListener('click', () => {
                    console.log('🎯 Test connection clicked');
                    this.testConnection();
                });
                console.log('✅ Test button bound');
            }
            
            const saveBtn = document.getElementById('aida-save-btn');
            if (saveBtn) {
                saveBtn.addEventListener('click', () => {
                    console.log('🎯 Save & Connect clicked');
                    this.saveAndConnect();
                });
                console.log('✅ Save button bound');
            }
            
            // Chat functionality
            const sendBtn = document.getElementById('aida-send-btn');
            if (sendBtn) {
                sendBtn.addEventListener('click', () => {
                    console.log('🎯 Send button clicked');
                    this.sendMessage();
                });
                console.log('✅ Send button bound');
            }
            
            const input = document.getElementById('aida-input');
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        console.log('🎯 Enter pressed');
                        this.sendMessage();
                    }
                });
                
                input.addEventListener('input', () => {
                    this.autoResize();
                });
                
                // Mobile-specific: Prevent zoom on input focus
                if (this.isMobile) {
                    input.addEventListener('focus', () => {
                        // Scroll the input into view on mobile
                        setTimeout(() => {
                            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 100);
                    });
                }
                
                console.log('✅ Input events bound');
            }
            
            // Populate settings form
            this.populateSettings();
            console.log('✅ All events bound successfully');
            
        }, 100);
    }
    
    populateSettings() {
        document.getElementById('aida-api-url').value = this.settings.api_server_url || 'http://localhost:5000';
        document.getElementById('aida-erpnext-url').value = this.settings.erpnext_url || window.location.origin;
        document.getElementById('aida-api-key').value = this.settings.google_api_key || '';
        document.getElementById('aida-mongo-uri').value = this.settings.mongo_uri || '';
        document.getElementById('aida-username').value = this.settings.username || 'Administrator';
        document.getElementById('aida-password').value = this.settings.password || '';
        
        const manualAuth = document.getElementById('aida-manual-auth');
        manualAuth.checked = this.settings.use_manual_auth || false;
        
        const manualFields = document.getElementById('aida-manual-fields');
        manualFields.style.display = manualAuth.checked ? 'block' : 'none';
    }
    
    toggleWidget() {
        const chatWindow = document.getElementById('aida-chat-window');
        const isVisible = chatWindow.style.display === 'block';
        
        if (isVisible) {
            chatWindow.style.display = 'none';
            // Restore body scroll on mobile
            if (this.isMobile) {
                document.body.style.overflow = '';
            }
        } else {
            chatWindow.style.display = 'block';
            
            // Prevent body scroll on mobile when chat is open
            if (this.isMobile) {
                document.body.style.overflow = 'hidden';
            }
            
            // FIXED: Ensure proper scrolling when widget is opened
            if (!this.conversationLoaded) {
                this.loadConversationHistory();
            } else {
                // If conversation is already loaded, just scroll to bottom
                setTimeout(() => {
                    this.scrollToBottom();
                }, 100);
            }
        }
    }
    
    minimizeWidget() {
        document.getElementById('aida-chat-window').style.display = 'none';
        // Restore body scroll on mobile
        if (this.isMobile) {
            document.body.style.overflow = '';
        }
    }
    
    async clearChat() {
        if (confirm('Are you sure you want to clear this conversation?')) {
            try {
                // Clear from database
                await frappe.call({
                    method: 'aida_taskforge_integration.aida_taskforge_integration.doctype.aida_conversation.aida_conversation.clear_conversation_history',
                    args: { session_id: this.sessionId }
                });
                
                // Clear UI
                const messagesContainer = document.getElementById('aida-messages');
                messagesContainer.innerHTML = `
                    <div class="aida-welcome">
                        <div class="aida-message aida-ai">
                            <div class="aida-avatar">🤖</div>
                            <div class="aida-content">
                                <p>Conversation cleared!</p>
                                <p>How can I help you today?</p>
                            </div>
                        </div>
                    </div>
                `;
                
                this.conversationLoaded = false;
                alert('Conversation cleared successfully!');
            } catch (error) {
                console.error('Failed to clear conversation:', error);
                alert('Failed to clear conversation');
            }
        }
    }
    
    showSettings() {
        document.getElementById('aida-chat-view').style.display = 'none';
        document.getElementById('aida-settings-view').style.display = 'block';
    }
    
    showChat() {
        document.getElementById('aida-chat-view').style.display = 'block';
        document.getElementById('aida-settings-view').style.display = 'none';
    }
    
    async testConnection() {
        const apiUrl = document.getElementById('aida-api-url').value.trim();
        if (!apiUrl) {
            alert('Please enter API Server URL first');
            return;
        }
        
        try {
            const response = await fetch(`${apiUrl}/health`, {
                method: 'GET',
                headers: {
                    'Access-Control-Request-Private-Network': 'true'
                },
                mode: 'cors'
            });
            if (response.ok) {
                const data = await response.json();
                alert(`✅ API server is reachable!\nStatus: ${data.status}\nActive sessions: ${data.active_sessions}`);
            } else {
                alert(`❌ API server returned status ${response.status}`);
            }
        } catch (error) {
            alert(`❌ Cannot reach API server: ${error.message}`);
        }
    }
    
    async saveAndConnect() {
        console.log('🔧 Save and Connect clicked');
        
        const newSettings = {
            api_server_url: document.getElementById('aida-api-url').value.trim(),
            erpnext_url: document.getElementById('aida-erpnext-url').value.trim(),
            google_api_key: document.getElementById('aida-api-key').value.trim(),
            mongo_uri: document.getElementById('aida-mongo-uri').value.trim(),
            use_manual_auth: document.getElementById('aida-manual-auth').checked,
            username: document.getElementById('aida-username').value.trim(),
            password: document.getElementById('aida-password').value.trim()
        };
        
        console.log('📋 New settings:', {
            ...newSettings,
            google_api_key: newSettings.google_api_key ? '***HIDDEN***' : 'EMPTY',
            password: newSettings.password ? '***HIDDEN***' : 'EMPTY'
        });
        
        // Validate
        if (!newSettings.api_server_url) {
            alert('API Server URL is required');
            console.error('❌ Missing API Server URL');
            return;
        }
        
        if (!newSettings.google_api_key) {
            alert('Google API Key is required');
            console.error('❌ Missing Google API Key');
            return;
        }
        
        if (newSettings.use_manual_auth && !newSettings.password) {
            alert('Password is required when using manual authentication');
            console.error('❌ Missing password for manual auth');
            return;
        }
        
        try {
            await this.saveSettings(newSettings);
            console.log('✅ Settings saved successfully');
            this.showChat();
            
            // Add a small delay to ensure UI updates before connecting
            setTimeout(async () => {
                try {
                    await this.connectToAPI();
                } catch (connectError) {
                    console.error('❌ Connection error:', connectError);
                    this.updateStatus('error', 'Connection failed');
                    alert('Connection failed: ' + connectError.message);
                }
            }, 100);
            
        } catch (error) {
            console.error('❌ Error in saveAndConnect:', error);
            alert('Error saving settings: ' + error.message);
        }
    }
    
    async connectToAPI() {
        console.log('🔄 Starting API connection...');
        this.updateStatus('connecting', 'Connecting...');
        
        // Ensure settings are available
        if (!this.settings || !this.settings.api_server_url || !this.settings.google_api_key) {
            console.error('❌ Settings not properly loaded:', this.settings);
            this.updateStatus('error', 'Settings not configured');
            return;
        }
        
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
                console.log('🔐 Using manual authentication');
            } else {
                // Check if frappe session is available
                if (typeof frappe === 'undefined' || !frappe.session || !frappe.session.user) {
                    console.error('❌ Frappe session not available');
                    this.updateStatus('error', 'Session not available');
                    return;
                }
                
                const sessionCookie = this.getCookie('sid');
                if (!sessionCookie) {
                    console.error('❌ Session cookie not found');
                    this.updateStatus('error', 'Session cookie missing');
                    return;
                }
                
                payload = {
                    erpnext_url: this.settings.erpnext_url,
                    username: 'session_token',
                    password: 'session_token',
                    google_api_key: this.settings.google_api_key,
                    mongo_uri: this.settings.mongo_uri,
                    api_key: frappe.session.user,
                    api_secret: sessionCookie
                };
                console.log('🎫 Using session authentication for user:', frappe.session.user);
            }
            
            const url = `${this.settings.api_server_url}/init_session`;
            console.log('📡 Making request to:', url);
            console.log('📦 Payload (sanitized):', {
                ...payload,
                google_api_key: '***HIDDEN***',
                password: payload.password === 'session_token' ? 'session_token' : '***HIDDEN***',
                api_secret: payload.api_secret ? '***HIDDEN***' : undefined
            });
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Access-Control-Request-Private-Network': 'true'
                },
                mode: 'cors',
                body: JSON.stringify(payload)
            });
            
            console.log('📨 Response status:', response.status);
            console.log('📨 Response headers:', Object.fromEntries(response.headers.entries()));
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Response error:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const data = await response.json();
            console.log('📦 Response data:', data);
            
            if (data.session_id) {
                this.apiSessionId = data.session_id;
                this.isConnected = true;
                this.updateStatus('connected', 'Connected');
                this.enableInput();
                
                // Only show welcome message if no conversation history loaded
                if (!this.conversationLoaded) {
                    this.addMessage('✅ Connected to AIDA! How can I help you?', 'ai', false);
                }
                
                console.log('✅ Successfully connected, API session:', this.apiSessionId);
            } else {
                throw new Error('No session ID received from server');
            }
        } catch (error) {
            console.error('❌ Connection failed:', error);
            this.updateStatus('error', 'Connection failed: ' + error.message);
            this.showConfigPrompt();
            
            // Don't show alert here since it's handled in saveAndConnect
            console.error('Full error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
        }
    }
    
    updateStatus(type, message) {
        const dot = document.querySelector('.aida-status-dot');
        const text = document.querySelector('.aida-status-text');
        
        if (dot) {
            dot.className = `aida-status-dot aida-${type}`;
        }
        if (text) {
            text.textContent = message;
        }
    }
    
    enableInput() {
        const input = document.getElementById('aida-input');
        const sendBtn = document.getElementById('aida-send-btn');
        
        input.disabled = false;
        input.placeholder = 'Ask me anything...';
        sendBtn.disabled = false;
    }
    
    showConfigPrompt() {
        const statusMsg = document.getElementById('aida-status-msg');
        statusMsg.innerHTML = 'Please configure your settings by clicking the settings icon ⚙️ above.';
    }
    
    async sendMessage() {
        const input = document.getElementById('aida-input');
        const message = input?.value?.trim();
        
        console.log('📤 Send message called, message:', message ? message.substring(0, 50) + '...' : 'EMPTY');
        console.log('🔗 Connected:', this.isConnected, 'API Session:', this.apiSessionId);
        
        if (!message) {
            console.warn('⚠️ No message to send');
            return;
        }
        
        if (!this.isConnected || !this.apiSessionId) {
            console.error('❌ Not connected to API');
            alert('Please connect to AIDA first by configuring your settings.');
            return;
        }
        
        this.addMessage(message, 'user', true);
        input.value = '';
        this.autoResize();
        
        this.showTyping();
        
        try {
            const url = `${this.settings.api_server_url}/chat`;
            const payload = {
                session_id: this.apiSessionId,
                user_input: message
            };
            
            console.log('📤 Sending to:', url);
            console.log('📦 Payload:', payload);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Access-Control-Request-Private-Network': 'true'
                },
                mode: 'cors',
                body: JSON.stringify(payload)
            });
            
            console.log('📨 Response status:', response.status);
            
            this.hideTyping();
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Chat response error:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const data = await response.json();
            console.log('📦 Response data:', data);
            
            if (data.response) {
                this.addMessage(data.response, 'ai', true);
                console.log('✅ Message sent and response received');
            } else {
                throw new Error('No response from AI');
            }
        } catch (error) {
            this.hideTyping();
            console.error('❌ Send message error:', error);
            this.addMessage(`Error: ${error.message}`, 'ai', false);
            alert('Failed to send message: ' + error.message);
        }
    }
    
    addMessage(content, sender, saveToHistory = false) {
        const messagesContainer = document.getElementById('aida-messages');
        
        // Remove welcome message if it exists and we're adding a real message
        const welcome = messagesContainer.querySelector('.aida-welcome');
        if (welcome && saveToHistory) {
            welcome.remove();
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `aida-message aida-${sender}`;
        
        messageDiv.innerHTML = `
            <div class="aida-avatar">${sender === 'user' ? '👤' : '🤖'}</div>
            <div class="aida-content">
                <p>${this.formatMessage(content)}</p>
                <span class="aida-time">${new Date().toLocaleTimeString()}</span>
            </div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        
        // FIXED: Enhanced auto-scrolling after adding message
        this.scrollToBottom();
        
        // Save to database only for new messages
        if (saveToHistory) {
            this.saveMessage(content, sender);
        }
    }
    
    formatMessage(content) {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }
    
    showTyping() {
        const messagesContainer = document.getElementById('aida-messages');
        
        // Remove existing typing
        this.hideTyping();
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'aida-message aida-ai aida-typing';
        typingDiv.innerHTML = `
            <div class="aida-avatar">🤖</div>
            <div class="aida-content">
                <div class="aida-typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        messagesContainer.appendChild(typingDiv);
        
        // FIXED: Ensure scrolling after adding typing indicator
        this.scrollToBottom();
    }
    
    hideTyping() {
        const typing = document.querySelector('.aida-typing');
        if (typing) typing.remove();
    }
    
    scrollToBottom() {
        const messages = document.getElementById('aida-messages');
        if (!messages) {
            console.warn('⚠️ Messages container not found');
            return;
        }
        
        console.log('📜 Scrolling to bottom, container height:', messages.scrollHeight);
        
        // Force immediate scroll
        messages.scrollTop = messages.scrollHeight;
        
        // Also try with a delay to ensure DOM is updated
        setTimeout(() => {
            messages.scrollTop = messages.scrollHeight;
            
            // Fallback: scroll last message into view
            const lastMessage = messages.lastElementChild;
            if (lastMessage) {
                lastMessage.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'end',
                    inline: 'nearest'
                });
            }
        }, 100);
        
        console.log('📜 Scroll position set to:', messages.scrollTop, 'of', messages.scrollHeight);
    }
    
    autoResize() {
        const input = document.getElementById('aida-input');
        if (input) {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 80) + 'px';
        }
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
    
    async loadConversationHistory() {
        if (!this.sessionId) {
            console.log('No session ID available for loading history');
            return;
        }
        
        try {
            console.log('Loading conversation history for session:', this.sessionId);
            
            const response = await frappe.call({
                method: 'aida_taskforge_integration.aida_taskforge_integration.doctype.aida_conversation.aida_conversation.get_conversation_history',
                args: { session_id: this.sessionId, limit: 50 }
            });
            
            if (response.message && response.message.length > 0) {
                const messagesContainer = document.getElementById('aida-messages');
                messagesContainer.innerHTML = '';
                
                // Add all historical messages without saving them again
                response.message.forEach(msg => {
                    this.addMessage(msg.message, msg.message_type, false);
                });
                
                this.conversationLoaded = true;
                console.log(`✅ Loaded ${response.message.length} messages from conversation history`);
                
                // FIXED: Ensure scrolling after loading history
                setTimeout(() => {
                    this.scrollToBottom();
                }, 200);
            } else {
                this.conversationLoaded = false;
                console.log('No conversation history found for this session');
            }
        } catch (error) {
            console.error('Failed to load conversation history:', error);
            this.conversationLoaded = false;
        }
    }
    
    getCookie(name) {
        try {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) {
                const cookieValue = parts.pop().split(';').shift();
                console.log(`🍪 Cookie ${name}:`, cookieValue ? 'Found' : 'Not found');
                return cookieValue;
            }
            console.log(`🍪 Cookie ${name}: Not found`);
            return null;
        } catch (error) {
            console.error('❌ Error getting cookie:', error);
            return null;
        }
    }
    
    injectResponsiveStyles() {
        // Check if styles already injected
        if (document.getElementById('aida-responsive-styles')) return;
        
        const styles = `
            <style id="aida-responsive-styles">
            /* Responsive AIDA Widget Styles */
            
            /* Desktop positioning */
            .aida-widget.desktop {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 10000;
            }
            
            /* Mobile positioning */
            .aida-widget.mobile {
                position: fixed;
                bottom: 10px;
                right: 10px;
                z-index: 10000;
            }
            
            /* Toggle button - responsive */
            .aida-float-btn {
                background: #007bff;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0,123,255,0.3);
                color: white;
                transition: transform 0.2s;
                position: relative;
                touch-action: manipulation;
            }
            
            /* Desktop toggle button */
            .aida-widget.desktop .aida-float-btn {
                width: 60px;
                height: 60px;
            }
            
            /* Mobile toggle button */
            .aida-widget.mobile .aida-float-btn {
                width: 56px;
                height: 56px;
            }
            
            .aida-float-btn:hover {
                transform: scale(1.1);
            }
            
            /* Chat window - Desktop */
            .aida-chat-window.desktop {
                position: absolute;
                bottom: 80px;
                right: 0;
                width: 400px;
                height: 500px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                display: none;
                flex-direction: column;
                overflow: hidden;
            }
            
            /* Chat window - Mobile */
            .aida-chat-window.mobile {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                width: 100vw;
                height: 100vh;
                background: white;
                display: none;
                flex-direction: column;
                overflow: hidden;
                border-radius: 0;
                box-shadow: none;
            }
            
            /* Header styles */
            .aida-header {
                background: #007bff;
                color: white;
                display: flex;
                justify-content: space-between;
                align-items: center;
                min-height: 60px;
            }
            
            /* Desktop header */
            .aida-chat-window.desktop .aida-header {
                padding: 16px;
            }
            
            /* Mobile header with safe area */
            .aida-chat-window.mobile .aida-header {
                padding: max(16px, env(safe-area-inset-top) + 16px) 16px 16px 16px;
            }
            
            /* Messages container */
            .aida-messages {
                flex: 1;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
            }
            
            /* Desktop messages padding */
            .aida-chat-window.desktop .aida-messages {
                padding: 16px;
            }
            
            /* Mobile messages padding */
            .aida-chat-window.mobile .aida-messages {
                padding: 16px 12px;
            }
            
            /* Message content responsive sizing */
            .aida-message-content {
                word-wrap: break-word;
                line-height: 1.4;
            }
            
            /* Desktop message content */
            .aida-chat-window.desktop .aida-message-content {
                max-width: 280px;
            }
            
            /* Mobile message content */
            .aida-chat-window.mobile .aida-message-content {
                max-width: calc(100vw - 120px);
            }
            
            /* Input container */
            .aida-input-area {
                border-top: 1px solid #dee2e6;
                background: white;
            }
            
            /* Desktop input */
            .aida-chat-window.desktop .aida-input-area {
                padding: 16px;
            }
            
            /* Mobile input with safe area */
            .aida-chat-window.mobile .aida-input-area {
                padding: 16px 12px max(16px, env(safe-area-inset-bottom) + 12px) 12px;
            }
            
            /* Input field responsive */
            #aida-input {
                font-size: 16px !important; /* Prevents zoom on iOS */
                background: white;
                resize: none;
            }
            
            /* Button touch targets */
            .aida-btn {
                touch-action: manipulation;
                min-width: 44px; /* Minimum touch target size */
                min-height: 44px;
            }
            
            /* Send button responsive */
            .aida-send-btn {
                touch-action: manipulation;
                white-space: nowrap;
            }
            
            /* Landscape phone adjustments */
            @media screen and (max-height: 500px) and (orientation: landscape) {
                .aida-chat-window.mobile .aida-header {
                    padding: 8px 16px;
                    min-height: 50px;
                }
                
                .aida-chat-window.mobile .aida-messages {
                    padding: 8px 12px;
                }
                
                .aida-chat-window.mobile .aida-input-area {
                    padding: 8px 12px;
                }
            }
            
            /* Tablet adjustments */
            @media screen and (min-width: 768px) and (max-width: 1024px) {
                .aida-chat-window.desktop {
                    width: 350px;
                    height: 450px;
                }
            }
            
            /* PWA specific styles */
            @media (display-mode: standalone) {
                .aida-widget {
                    /* Adjust for PWA mode if needed */
                }
            }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
}

// Auto-initialize widget when page loads and user is authenticated
document.addEventListener('DOMContentLoaded', function() {
    // Wait for frappe to load
    function initWidget() {
        if (typeof frappe !== 'undefined' && frappe.session && frappe.session.user !== 'Guest') {
            console.log('Initializing AIDA widget for user:', frappe.session.user);
            window.aidaWidget = new AidaWidget();
        } else if (typeof frappe === 'undefined' || !frappe.session) {
            // Still loading, try again
            setTimeout(initWidget, 1000);
        }
        // If user is Guest, don't initialize widget
    }
    
    setTimeout(initWidget, 2000); // Give frappe time to load
});