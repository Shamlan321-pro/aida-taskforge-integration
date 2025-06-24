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
    
    # Create AIDA Conversation DocType first
    if not frappe.db.exists("DocType", "AIDA Conversation"):
        print("Creating AIDA Conversation DocType...")
        
        conversation_doctype = {
            "doctype": "DocType",
            "name": "AIDA Conversation",
            "module": "Aida Taskforge Integration",
            "custom": 1,
            "fields": [
                {
                    "fieldname": "session_id",
                    "fieldtype": "Data",
                    "label": "Session ID",
                    "reqd": 1,
                    "in_list_view": 1
                },
                {
                    "fieldname": "user",
                    "fieldtype": "Link",
                    "options": "User",
                    "label": "User",
                    "reqd": 1,
                    "in_list_view": 1
                },
                {
                    "fieldname": "message_type",
                    "fieldtype": "Select",
                    "options": "user\nai",
                    "label": "Message Type",
                    "reqd": 1,
                    "in_list_view": 1
                },
                {
                    "fieldname": "message",
                    "fieldtype": "Long Text",
                    "label": "Message",
                    "reqd": 1
                },
                {
                    "fieldname": "timestamp",
                    "fieldtype": "Datetime",
                    "label": "Timestamp",
                    "default": "now",
                    "in_list_view": 1
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
                    "role": "All",
                    "read": 1,
                    "write": 1,
                    "create": 1
                }
            ]
        }
        
        doc = frappe.get_doc(conversation_doctype)
        doc.insert(ignore_permissions=True)
        frappe.db.commit()
        print("✓ AIDA Conversation DocType created successfully")
    else:
        print("✓ AIDA Conversation DocType already exists")

    # Create AIDA User Settings DocType
    if not frappe.db.exists("DocType", "AIDA User Settings"):
        print("Creating AIDA User Settings DocType...")
        
        user_settings_doctype = {
            "doctype": "DocType",
            "name": "AIDA User Settings",
            "module": "Aida Taskforge Integration",
            "custom": 1,
            "fields": [
                {
                    "fieldname": "user",
                    "fieldtype": "Link",
                    "options": "User",
                    "label": "User",
                    "reqd": 1,
                    "unique": 1
                },
                {
                    "fieldname": "api_server_url",
                    "fieldtype": "Data",
                    "label": "API Server URL",
                    "default": "http://localhost:5000"
                },
                {
                    "fieldname": "google_api_key",
                    "fieldtype": "Password",
                    "label": "Google API Key"
                },
                {
                    "fieldname": "current_session_id",
                    "fieldtype": "Data",
                    "label": "Current Session ID"
                },
                {
                    "fieldname": "configured",
                    "fieldtype": "Check",
                    "label": "Is Configured",
                    "default": 0
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
                    "role": "All",
                    "read": 1,
                    "write": 1,
                    "create": 1
                }
            ]
        }
        
        doc = frappe.get_doc(user_settings_doctype)
        doc.insert(ignore_permissions=True)
        frappe.db.commit()
        print("✓ AIDA User Settings DocType created successfully")
    else:
        print("✓ AIDA User Settings DocType already exists")
    
    # Check if AIDA AI Settings DocType exists
    if not frappe.db.exists("DocType", "AIDA AI Settings"):
        print("Creating AIDA AI Settings DocType...")
        
        # Create the DocType programmatically with minimal fields
        doctype_dict = {
            "doctype": "DocType",
            "name": "AIDA AI Settings",
            "module": "Aida Taskforge Integration",
            "issingle": 1,
            "custom": 1,
            "fields": [
                {
                    "fieldname": "api_server_url",
                    "fieldtype": "Data",
                    "label": "API Server URL",
                    "default": "http://localhost:5000",
                    "description": "URL where your AIDA API server is running"
                },
                {
                    "fieldname": "google_api_key",
                    "fieldtype": "Password",
                    "label": "Google API Key",
                    "description": "Your Google Gemini API key"
                },
                {
                    "fieldname": "erpnext_url",
                    "fieldtype": "Data",
                    "label": "ERPNext URL",
                    "description": "URL of your ERPNext instance"
                },
                {
                    "fieldname": "enable_floating_widget",
                    "fieldtype": "Check",
                    "label": "Enable Floating Widget",
                    "default": 1,
                    "description": "Show floating chat widget on all pages"
                }
            ],
            "permissions": [
                {
                    "role": "System Manager",
                    "read": 1,
                    "write": 1,
                    "create": 1,
                    "delete": 1
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
        settings.enable_floating_widget = 1
        settings.insert(ignore_permissions=True)
        frappe.db.commit()
        print("✓ Default AIDA AI Settings created")
    else:
        print("✓ AIDA AI Settings record already exists")

    frappe.clear_cache()
    print("\n🎉 Setup complete!")
    print("📍 Visit /aida-widget-test to test the widget.")
    print("📍 The widget should automatically appear on all pages.")
    print("📍 Configure settings by searching 'AIDA AI Settings' in the awesome bar.")

if __name__ == "__main__":
    setup_aida_app()
            workspace.public = 1
            workspace.module = "Aida Taskforge Integration"
            workspace.insert(ignore_permissions=True)
            frappe.db.commit()
            print("✓ AIDA AI Assistant workspace created")
        else:
            print("✓ AIDA AI Assistant workspace already exists")
    except Exception as e:
        print(f"Note: Could not create workspace (this is optional): {e}")

    frappe.clear_cache()
    print("\n🎉 Setup complete!")
    print("📍 Visit /aida-widget-test to test the widget.")
    print("📍 The widget should automatically appear on all pages.")

if __name__ == "__main__":
    setup_aida_app()
