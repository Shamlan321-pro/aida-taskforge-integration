import frappe

def get_context(context):
    context.title = "AIDA AI Assistant"
    context.no_cache = 1
    
    # Check if user is logged in
    if frappe.session.user == "Guest":
        frappe.local.flags.redirect_location = "/login"
        raise frappe.Redirect
    
    # Get settings to check if configured
    try:
        settings = frappe.get_single("AIDA AI Settings")
        context.is_configured = bool(settings.google_api_key and settings.api_server_url)
    except:
        context.is_configured = False
    
    return context
