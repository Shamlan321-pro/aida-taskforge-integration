// Auto-initialize AIDA widget when Frappe is ready
(function() {
    // Wait for frappe to be available
    function initAidaWidget() {
        if (typeof frappe === 'undefined') {
            console.log('Frappe not loaded yet, retrying...');
            setTimeout(initAidaWidget, 1000);
            return;
        }
        
        // Only initialize for logged-in users
        if (!frappe.session || frappe.session.user === 'Guest') {
            console.log('AIDA Widget: User not logged in, skipping widget initialization');
            return;
        }
        
        // Check if widget already exists
        if (document.getElementById('aida-widget')) {
            console.log('AIDA Widget: Widget already exists');
            return;
        }
        
        // Check if AidaWidget class is available
        if (typeof AidaWidget === 'undefined') {
            console.log('AIDA Widget: AidaWidget class not loaded, retrying...');
            setTimeout(initAidaWidget, 2000);
            return;
        }
        
        try {
            console.log('AIDA Widget: Initializing widget...');
            window.aidaWidget = new AidaWidget();
            console.log('AIDA Widget: Widget initialized successfully');
        } catch (error) {
            console.error('AIDA Widget: Failed to initialize widget:', error);
        }
    }
    
    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initAidaWidget, 1000);
        });
    } else {
        setTimeout(initAidaWidget, 1000);
    }
    
    // Also try on window load as backup
    window.addEventListener('load', function() {
        setTimeout(initAidaWidget, 2000);
    });
})();
