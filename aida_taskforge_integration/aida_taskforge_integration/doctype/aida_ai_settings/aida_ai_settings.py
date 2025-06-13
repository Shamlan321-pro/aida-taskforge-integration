import frappe
from frappe import _
from frappe.model.document import Document

class AIDAAISettings(Document):
    def validate(self):
        """Validate settings before saving"""
        if self.api_server_url:
            # Ensure URL doesn't end with slash
            self.api_server_url = self.api_server_url.rstrip('/')
        
        if self.erpnext_url:
            # Ensure URL doesn't end with slash
            self.erpnext_url = self.erpnext_url.rstrip('/')
        
        # Validate that either username/password or API key/secret is provided
        if self.use_api_token_auth:
            if not self.api_key or not self.api_secret:
                frappe.throw(_("API Key and API Secret are required when using API Token Authentication"))
        else:
            if not self.username or not self.password:
                frappe.throw(_("Username and Password are required when not using API Token Authentication"))
        
        # Validate Google API Key
        if not self.google_api_key:
            frappe.throw(_("Google API Key is required"))
        
        if self.google_api_key == "YOUR_GOOGLE_API_KEY_HERE":
            frappe.throw(_("Please configure a valid Google API Key"))
    
    def on_update(self):
        """Called after the document is updated"""
        # Clear cache to ensure updated settings are loaded
        frappe.cache().delete_keys("aida_ai_settings")
    
    def test_connection(self):
        """Test connection to the AIDA API server"""
        import requests
        
        if not self.api_server_url:
            frappe.throw(_("API Server URL is required"))
        
        try:
            # Test basic connectivity to the API server
            response = requests.get(f"{self.api_server_url}/", timeout=10)
            
            if response.status_code == 200:
                return {"status": "success", "message": _("Connection to AIDA API server successful")}
            else:
                return {"status": "error", "message": _("API server returned status code: {0}").format(response.status_code)}
                
        except requests.exceptions.ConnectionError:
            return {"status": "error", "message": _("Could not connect to API server. Please check if the server is running.")}
        except requests.exceptions.Timeout:
            return {"status": "error", "message": _("Connection timeout. Please check the server URL.")}
        except Exception as e:
            return {"status": "error", "message": _("Connection test failed: {0}").format(str(e))}

@frappe.whitelist()
def test_aida_connection():
    """Test AIDA connection (can be called from frontend)"""
    settings = frappe.get_single("AIDA AI Settings")
    return settings.test_connection()

@frappe.whitelist()
def get_aida_settings():
    """Get AIDA settings (alternative API method)"""
    try:
        settings = frappe.get_single("AIDA AI Settings")
        return {
            "api_server_url": settings.api_server_url,
            "erpnext_url": settings.erpnext_url,
            "username": settings.username if not settings.use_api_token_auth else "",
            "api_key": settings.api_key if settings.use_api_token_auth else "",
            "google_api_key": "***" if settings.google_api_key else "",
            "mongo_uri": settings.mongo_uri,
            "use_api_token_auth": settings.use_api_token_auth,
            "session_timeout": settings.session_timeout,
            "enable_floating_widget": settings.enable_floating_widget,
            "configured": bool(settings.google_api_key and settings.api_server_url)
        }
    except Exception as e:
        frappe.log_error(f"Error getting AIDA AI settings: {str(e)}")
        return {}
