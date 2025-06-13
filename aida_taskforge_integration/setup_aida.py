import frappe

def setup_aida_app():
    """Setup AIDA AI Settings DocType and initial configuration"""
    
    # Fix the patch first
    try:
        frappe.db.sql("INSERT IGNORE INTO `tabPatch Log` (patch) VALUES ('builder.builder.doctype.builder_page.patches.attach_client_script_to_builder_page')")
        frappe.db.commit()
        print("✓ Patch issue fixed")
    except Exception as e:
        print(f"Patch fix error (might be already fixed): {e}")
    
    # Check if DocType exists
    if not frappe.db.exists("DocType", "AIDA AI Settings"):
        print("Creating AIDA AI Settings DocType...")
        
        # Create the DocType programmatically
        doctype_dict = {
            "doctype": "DocType",
            "name": "AIDA AI Settings",
            "module": "Aida Taskforge Integration",
            "issingle": 1,
            "custom": 1,  # Mark as custom to avoid developer mode issues
            "fields": [
                {
                    "fieldname": "api_server_url",
                    "fieldtype": "Data",
                    "label": "API Server URL",
                    "reqd": 1,
                    "default": "http://localhost:5000",
                    "description": "URL where your AIDA API server is running"
                },
                {
                    "fieldname": "erpnext_url",
                    "fieldtype": "Data", 
                    "label": "ERPNext URL",
                    "reqd": 1,
                    "description": "URL of your ERPNext instance"
                },
                {
                    "fieldname": "google_api_key",
                    "fieldtype": "Password",
                    "label": "Google API Key",
                    "reqd": 1,
                    "description": "Your Google Gemini API key"
                },
                {
                    "fieldname": "mongo_uri",
                    "fieldtype": "Data",
                    "label": "MongoDB URI",
                    "description": "Optional: MongoDB connection string for conversation history"
                },
                {
                    "fieldname": "column_break_1",
                    "fieldtype": "Column Break"
                },
                {
                    "fieldname": "use_api_token_auth",
                    "fieldtype": "Check",
                    "label": "Use API Token Authentication",
                    "default": 1,
                    "description": "Use session tokens instead of username/password"
                },
                {
                    "fieldname": "enable_floating_widget",
                    "fieldtype": "Check",
                    "label": "Enable Floating Widget",
                    "default": 1,
                    "description": "Show floating chat widget on all pages"
                },
                {
                    "fieldname": "session_timeout",
                    "fieldtype": "Int",
                    "label": "Session Timeout (minutes)",
                    "default": 30,
                    "description": "How long to keep chat sessions active"
                }
            ],
            "permissions": [
                {
                    "role": "System Manager",
                    "read": 1,
                    "write": 1,
                    "create": 1,
                    "delete": 1
                },
                {
                    "role": "Administrator",
                    "read": 1,
                    "write": 1
                }
            ]
        }
        
        doc = frappe.get_doc(doctype_dict)
        doc.insert(ignore_permissions=True)
        frappe.db.commit()
        print("✓ AIDA AI Settings DocType created successfully")
    else:
        print("✓ AIDA AI Settings DocType already exists")

    # Create a default settings record
    if not frappe.db.exists("AIDA AI Settings", "AIDA AI Settings"):
        settings = frappe.new_doc("AIDA AI Settings")
        settings.name = "AIDA AI Settings"
        settings.api_server_url = "http://localhost:5000"
        settings.erpnext_url = frappe.utils.get_url()
        settings.google_api_key = "YOUR_GOOGLE_API_KEY_HERE"
        settings.use_api_token_auth = 1
        settings.enable_floating_widget = 1
        settings.session_timeout = 30
        settings.insert(ignore_permissions=True)
        frappe.db.commit()
        print("✓ Default AIDA AI Settings created")
    else:
        print("✓ AIDA AI Settings record already exists")

    # Create workspace if needed
    if not frappe.db.exists("Workspace", "AIDA AI Assistant"):
        workspace = frappe.new_doc("Workspace")
        workspace.name = "AIDA AI Assistant"
        workspace.title = "AIDA AI Assistant"
        workspace.icon = "robot"
        workspace.public = 1
        workspace.module = "Aida Taskforge Integration"
        workspace.insert(ignore_permissions=True)
        frappe.db.commit()
        print("✓ AIDA AI Assistant workspace created")
    else:
        print("✓ AIDA AI Assistant workspace already exists")

    frappe.clear_cache()
    print("\n🎉 Setup complete! You should now see AIDA AI Settings in your system.")
    print("📍 Search for 'AIDA AI Settings' in the awesome bar to configure the API.")
    print("🚀 Visit /aida-test to test the chat interface.")

if __name__ == "__main__":
    setup_aida_app()