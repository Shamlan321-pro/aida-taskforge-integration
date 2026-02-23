import frappe
from frappe import _
from frappe.model.document import Document

class AidaUserSettings(Document):
    def before_insert(self):
        self.created_at = frappe.utils.now_datetime()
        
    def before_save(self):
        self.modified_at = frappe.utils.now_datetime()
        
        # Validate settings
        if self.api_server_url:
            self.api_server_url = self.api_server_url.rstrip('/')
        
        if self.erpnext_url:
            self.erpnext_url = self.erpnext_url.rstrip('/')
        
        if not self.google_api_key:
            frappe.throw(_("Google API Key is required"))

@frappe.whitelist()
def get_user_settings():
    """Get AIDA settings for current user"""
    user = frappe.session.user
    
    try:
        # Try to get from AIDA AI Settings first (existing DocType)
        settings = frappe.get_doc("AIDA AI Settings", "AIDA AI Settings")
        return {
            "api_server_url": settings.api_server_url or "http://localhost:5000",
            "erpnext_url": settings.erpnext_url or frappe.utils.get_url(),
            "google_api_key": settings.google_api_key or "",
            "mongo_uri": settings.mongo_uri or "",
            "use_manual_auth": getattr(settings, 'use_manual_auth', False),
            "username": getattr(settings, 'username', 'Administrator'),
            "password": getattr(settings, 'password', ''),
            "current_session_id": getattr(settings, 'current_session_id', ''),
            "configured": bool(settings.google_api_key and settings.api_server_url)
        }
    except frappe.DoesNotExistError:
        # Check if user has a personal session stored
        try:
            user_doc = frappe.get_doc("User", user)
            current_session = getattr(user_doc, 'aida_session_id', '')
        except:
            current_session = ''
        
        return {
            "api_server_url": "http://localhost:5000",
            "erpnext_url": frappe.utils.get_url(),
            "google_api_key": "",
            "mongo_uri": "",
            "use_manual_auth": False,
            "username": "Administrator",
            "password": "",
            "current_session_id": current_session,
            "configured": False
        }

@frappe.whitelist()
def save_user_settings(settings):
    """Save AIDA settings for current user"""
    try:
        doc = frappe.get_doc("AIDA AI Settings", "AIDA AI Settings")
    except frappe.DoesNotExistError:
        doc = frappe.new_doc("AIDA AI Settings")
        doc.name = "AIDA AI Settings"
    
    # Update settings
    doc.api_server_url = settings.get("api_server_url", "").strip()
    doc.erpnext_url = settings.get("erpnext_url", "").strip()
    doc.google_api_key = settings.get("google_api_key", "").strip()
    doc.mongo_uri = settings.get("mongo_uri", "").strip()
    
    # Set additional fields if they exist in the DocType
    if hasattr(doc, 'use_manual_auth'):
        doc.use_manual_auth = settings.get("use_manual_auth", False)
    if hasattr(doc, 'username'):
        doc.username = settings.get("username", "").strip()
    if hasattr(doc, 'password'):
        doc.password = settings.get("password", "").strip()
    if hasattr(doc, 'current_session_id'):
        doc.current_session_id = settings.get("current_session_id", "")
    
    doc.save(ignore_permissions=True)
    
    return {"status": "success", "message": "Settings saved successfully"}

@frappe.whitelist()
def update_current_session(session_id):
    """Update the current session ID for the user"""
    user = frappe.session.user
    
    try:
        # Store session ID in user's profile as a custom field
        user_doc = frappe.get_doc("User", user)
        user_doc.db_set('aida_session_id', session_id, update_modified=False)
        frappe.db.commit()
        return {"status": "success"}
    except Exception as e:
        frappe.log_error(f"Failed to update session: {str(e)}")
        return {"status": "error", "message": str(e)}

@frappe.whitelist()
def get_or_create_user_session():
    """Get existing session or create a new one for the user"""
    user = frappe.session.user
    
    try:
        # Check if user has any existing conversations
        existing_sessions = frappe.get_all(
            "AIDA Conversation",
            filters={"user": user},
            fields=["session_id", "timestamp"],
            order_by="timestamp desc",
            limit=1
        )
        
        if existing_sessions:
            latest_session = existing_sessions[0]['session_id']
            # Update current session
            update_current_session(latest_session)
            return {"session_id": latest_session, "is_new": False}
        else:
            # Create new session
            import uuid
            new_session = 'aida_' + str(int(time.time())) + '_' + str(uuid.uuid4())[-8:]
            update_current_session(new_session)
            return {"session_id": new_session, "is_new": True}
            
    except Exception as e:
        frappe.log_error(f"Failed to get/create user session: {str(e)}")
        # Fallback
        import uuid
        fallback_session = 'aida_' + str(int(time.time())) + '_' + str(uuid.uuid4())[-8:]
        return {"session_id": fallback_session, "is_new": True}

@frappe.whitelist()
def test_connection():
    """Test AIDA connection for current user"""
    import requests
    
    user_settings = get_user_settings()
    api_server_url = user_settings.get("api_server_url")
    
    if not api_server_url:
        return {"status": "error", "message": "API Server URL not configured"}
    
    try:
        response = requests.get(f"{api_server_url}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            return {
                "status": "success", 
                "message": f"API server is reachable! Status: {data.get('status', 'unknown')}"
            }
        else:
            return {
                "status": "error", 
                "message": f"API server returned status {response.status_code}"
            }
    except Exception as e:
        return {"status": "error", "message": f"Cannot reach API server: {str(e)}"}
