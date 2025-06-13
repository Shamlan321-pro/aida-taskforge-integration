// Copyright (c) 2024, op and contributors
// For license information, please see license.txt

frappe.ui.form.on('AIDA AI Settings', {
    refresh: function(frm) {
        // Add test connection button
        frm.add_custom_button(__('Test Connection'), function() {
            test_aida_connection(frm);
        }, __('Actions'));
        
        // Add debug button
        frm.add_custom_button(__('Debug Settings'), function() {
            debug_aida_settings(frm);
        }, __('Actions'));
        
        // Add open chat button
        frm.add_custom_button(__('Open Chat Interface'), function() {
            window.open('/aida-test', '_blank');
        }, __('Actions'));
    },
    
    api_server_url: function(frm) {
        // Remove trailing slash if present
        if (frm.doc.api_server_url && frm.doc.api_server_url.endsWith('/')) {
            frm.set_value('api_server_url', frm.doc.api_server_url.slice(0, -1));
        }
    },
    
    use_api_token_auth: function(frm) {
        // Toggle visibility of auth fields based on authentication method
        frm.toggle_display(['username', 'password'], !frm.doc.use_api_token_auth);
        frm.toggle_display(['api_key', 'api_secret'], frm.doc.use_api_token_auth);
    }
});

function test_aida_connection(frm) {
    frappe.call({
        method: 'aida_taskforge_integration.api.test_settings_connection',
        callback: function(r) {
            if (r.message) {
                if (r.message.status === 'success') {
                    frappe.msgprint({
                        title: __('Connection Test'),
                        message: r.message.message,
                        indicator: 'green'
                    });
                } else {
                    frappe.msgprint({
                        title: __('Connection Test Failed'),
                        message: r.message.message,
                        indicator: 'red'
                    });
                }
            }
        }
    });
}

function debug_aida_settings(frm) {
    // First test loading settings
    frappe.call({
        method: 'aida_taskforge_integration.api.get_settings',
        callback: function(r) {
            console.log('Debug - Settings API Response:', r);
            
            if (r.message) {
                const settings = r.message;
                
                // Create debug info
                const debugInfo = {
                    'API Server URL': settings.api_server_url || 'EMPTY',
                    'ERPNext URL': settings.erpnext_url || 'EMPTY', 
                    'Google API Key': settings.google_api_key ? `*** (${settings.google_api_key.length} chars)` : 'EMPTY',
                    'MongoDB URI': settings.mongo_uri || 'EMPTY',
                    'Use Token Auth': settings.use_api_token_auth,
                    'Enable Widget': settings.enable_floating_widget,
                    'Is Configured': settings.is_configured,
                    'Current User': frappe.session.user,
                    'Session ID': frappe.get_cookie('sid') ? '*** (present)' : 'MISSING'
                };
                
                let debugMessage = '<table class="table table-bordered"><tbody>';
                for (const [key, value] of Object.entries(debugInfo)) {
                    debugMessage += `<tr><td><strong>${key}:</strong></td><td>${value}</td></tr>`;
                }
                debugMessage += '</tbody></table>';
                
                // Test payload that would be sent to API server
                const testPayload = {
                    erpnext_url: settings.erpnext_url || window.location.origin,
                    username: 'session_token',
                    password: 'session_token', 
                    google_api_key: settings.google_api_key,
                    api_key: frappe.session.user,
                    api_secret: frappe.get_cookie('sid'),
                    mongo_uri: settings.mongo_uri || null
                };
                
                debugMessage += '<br><h5>Test Payload (what would be sent to API server):</h5>';
                debugMessage += '<pre>' + JSON.stringify({
                    ...testPayload,
                    google_api_key: testPayload.google_api_key ? '***' : 'MISSING',
                    api_secret: testPayload.api_secret ? '***' : 'MISSING'
                }, null, 2) + '</pre>';
                
                frappe.msgprint({
                    title: __('AIDA Debug Information'),
                    message: debugMessage,
                    wide: true
                });
                
                console.log('Debug - Full settings object:', settings);
                console.log('Debug - Test payload:', testPayload);
                
            } else {
                frappe.msgprint({
                    title: __('Debug Failed'),
                    message: 'Could not load settings. Check console for errors.',
                    indicator: 'red'
                });
            }
        },
        error: function(error) {
            console.error('Debug - Settings loading error:', error);
            frappe.msgprint({
                title: __('Debug Error'),
                message: `Settings loading failed: ${error.message}`,
                indicator: 'red'
            });
        }
    });
}
