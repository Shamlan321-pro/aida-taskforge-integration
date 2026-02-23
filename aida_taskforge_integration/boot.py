import frappe

def boot_session(bootinfo):
    """Called during login to set up session info"""
    bootinfo["aida_enabled"] = True
    
    # Add AIDA menu item to navbar
    if not bootinfo.get("navbar_items"):
        bootinfo["navbar_items"] = []
    
    bootinfo["navbar_items"].append({
        "label": "AIDA AI",
        "route": "/aida-chat",
        "icon": "fa fa-robot"
    })
    
    # Check if AIDA is configured
    try:
        if frappe.db.exists("AIDA AI Settings", "AIDA AI Settings"):
            settings = frappe.get_single("AIDA AI Settings")
            bootinfo["aida_configured"] = bool(getattr(settings, 'enable_floating_widget', False))
        else:
            bootinfo["aida_configured"] = False
    except:
        bootinfo["aida_configured"] = False
    
    try:
        # Check if AIDA settings exist and widget is enabled
        if frappe.db.exists("DocType", "AIDA AI Settings"):
            if frappe.db.exists("AIDA AI Settings", "AIDA AI Settings"):
                settings = frappe.get_single("AIDA AI Settings")
                if getattr(settings, 'enable_floating_widget', 1):
                    bootinfo.aida_widget_enabled = True
                    bootinfo.aida_api_url = getattr(settings, 'api_server_url', 'http://localhost:5000')
                else:
                    bootinfo.aida_widget_enabled = False
            else:
                bootinfo.aida_widget_enabled = True  # Default to enabled
        else:
            bootinfo.aida_widget_enabled = False
            
    except Exception as e:
        frappe.log_error(f"AIDA boot session error: {str(e)}")
        bootinfo.aida_widget_enabled = False
