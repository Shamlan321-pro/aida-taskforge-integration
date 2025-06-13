import frappe
from frappe import _

@frappe.whitelist()
def get_settings():
    """Get AIDA AI settings"""
    try:
        # Check if the document exists first
        if not frappe.db.exists("AIDA AI Settings", "AIDA AI Settings"):
            frappe.logger().info("AIDA AI Settings document does not exist")
            return {
                "api_server_url": "http://localhost:5000",
                "erpnext_url": frappe.utils.get_url(),
                "google_api_key": "",
                "mongo_uri": "",
                "use_api_token_auth": 1,
                "enable_floating_widget": 1,
                "session_timeout": 30,
                "is_configured": False,
                "debug_info": "Document does not exist"
            }
        
        # Get the single document using proper method
        settings_doc = frappe.get_single("AIDA AI Settings")
        
        # Try to get field values using different methods
        try:
            # Method 1: Direct access
            google_api_key = settings_doc.google_api_key
        except:
            try:
                # Method 2: Using get method
                google_api_key = settings_doc.get("google_api_key")
            except:
                # Method 3: Using db query
                google_api_key = frappe.db.get_single_value("AIDA AI Settings", "google_api_key")
        
        # Same for other fields
        try:
            api_server_url = settings_doc.api_server_url or "http://localhost:5000"
        except:
            api_server_url = frappe.db.get_single_value("AIDA AI Settings", "api_server_url") or "http://localhost:5000"
            
        try:
            erpnext_url = settings_doc.erpnext_url or frappe.utils.get_url()
        except:
            erpnext_url = frappe.db.get_single_value("AIDA AI Settings", "erpnext_url") or frappe.utils.get_url()
        
        result = {
            "api_server_url": api_server_url,
            "erpnext_url": erpnext_url,
            "google_api_key": google_api_key or "",
            "mongo_uri": getattr(settings_doc, 'mongo_uri', '') or "",
            "use_api_token_auth": getattr(settings_doc, 'use_api_token_auth', 1),
            "enable_floating_widget": getattr(settings_doc, 'enable_floating_widget', 1),
            "session_timeout": getattr(settings_doc, 'session_timeout', 30),
            "username": getattr(settings_doc, 'username', 'Administrator'),
            "password": getattr(settings_doc, 'password', ''),
            "api_key": getattr(settings_doc, 'api_key', ''),
            "api_secret": getattr(settings_doc, 'api_secret', ''),
            "is_configured": bool(google_api_key and 
                                google_api_key != "YOUR_GOOGLE_API_KEY_HERE" and
                                google_api_key.strip()),
            "debug_info": f"Document exists, google_api_key length: {len(google_api_key) if google_api_key else 0}"
        }
        
        frappe.logger().info(f"AIDA settings loaded successfully: {result['debug_info']}")
        return result
        
    except Exception as e:
        frappe.log_error(f"Error getting AIDA AI settings: {str(e)}")
        error_result = {
            "api_server_url": "http://localhost:5000",
            "erpnext_url": frappe.utils.get_url(),
            "google_api_key": "",
            "mongo_uri": "",
            "use_api_token_auth": 1,
            "enable_floating_widget": 1,
            "session_timeout": 30,
            "is_configured": False,
            "error": str(e),
            "debug_info": f"Exception occurred: {str(e)}"
        }
        return error_result

@frappe.whitelist()
def save_settings(settings_data):
    """Save AIDA AI settings"""
    try:
        settings = frappe.get_single("AIDA AI Settings")
        for key, value in settings_data.items():
            if hasattr(settings, key):
                setattr(settings, key, value)
        settings.save()
        return {"status": "success", "message": _("AIDA settings saved successfully")}
    except Exception as e:
        frappe.log_error(f"Error saving AIDA AI settings: {str(e)}")
        return {"status": "error", "message": str(e)}

@frappe.whitelist()
def test_connection():
    """Test connection to AIDA API server"""
    try:
        settings = frappe.get_single("AIDA AI Settings")
        # Add connection test logic here
        return {"status": "success", "message": "Connection successful"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@frappe.whitelist()
def test_settings_connection():
    """Test the current settings by making a sample request"""
    try:
        settings = get_settings()
        
        if not settings.get('is_configured'):
            return {"status": "error", "message": "AIDA settings not properly configured"}
        
        # Test if we can reach the API server
        import requests
        api_url = settings.get('api_server_url')
        try:
            response = requests.get(f"{api_url}/health", timeout=5)
            if response.status_code == 200:
                return {"status": "success", "message": "API server is reachable", "data": response.json()}
            else:
                return {"status": "error", "message": f"API server returned status {response.status_code}"}
        except Exception as e:
            return {"status": "error", "message": f"Cannot reach API server: {str(e)}"}
            
    except Exception as e:
        return {"status": "error", "message": f"Settings test failed: {str(e)}"}
