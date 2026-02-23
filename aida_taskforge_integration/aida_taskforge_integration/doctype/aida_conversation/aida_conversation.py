import frappe
from frappe import _
from frappe.model.document import Document

class AidaConversation(Document):
    pass

@frappe.whitelist()
def save_message(session_id, message_type, message, context_data=None):
    """Save a conversation message"""
    try:
        user = frappe.session.user
        
        doc = frappe.new_doc("AIDA Conversation")
        doc.user = user
        doc.session_id = session_id
        doc.message_type = message_type
        doc.message = message
        doc.timestamp = frappe.utils.now_datetime()
        doc.context_data = context_data
        
        doc.save(ignore_permissions=True)
        return doc.name
    except Exception as e:
        frappe.log_error(f"Failed to save AIDA message: {str(e)}")
        return None

@frappe.whitelist()
def get_conversation_history(session_id, limit=50):
    """Get conversation history for a session"""
    try:
        user = frappe.session.user
        
        messages = frappe.get_all(
            "AIDA Conversation",
            filters={
                "user": user,
                "session_id": session_id
            },
            fields=["message_type", "message", "timestamp", "context_data"],
            order_by="timestamp asc",
            limit=int(limit)
        )
        
        frappe.logger().info(f"Found {len(messages)} messages for user {user}, session {session_id}")
        return messages
    except Exception as e:
        frappe.log_error(f"Failed to get conversation history: {str(e)}")
        return []

@frappe.whitelist()
def get_user_sessions(limit=10):
    """Get recent sessions for current user"""
    try:
        user = frappe.session.user
        
        sessions = frappe.db.sql("""
            SELECT DISTINCT session_id, MAX(timestamp) as last_activity,
                   COUNT(*) as message_count
            FROM `tabAIDA Conversation`
            WHERE user = %s
            GROUP BY session_id
            ORDER BY last_activity DESC
            LIMIT %s
        """, (user, limit), as_dict=True)
        
        # Add preview of first message for each session
        for session in sessions:
            first_message = frappe.db.get_value(
                "AIDA Conversation",
                {"user": user, "session_id": session.session_id, "message_type": "user"},
                "message",
                order_by="timestamp asc"
            )
            session["preview"] = (first_message[:50] + "..." if first_message and len(first_message) > 50 else first_message) or "New conversation"
            session["session_short"] = session.session_id[-8:] if session.session_id else ""
        
        return sessions
    except Exception as e:
        frappe.log_error(f"Failed to get user sessions: {str(e)}")
        return []

@frappe.whitelist()
def clear_conversation_history(session_id):
    """Clear conversation history for a session"""
    try:
        user = frappe.session.user
        
        frappe.db.delete("AIDA Conversation", {
            "user": user,
            "session_id": session_id
        })
        
        return {"status": "success", "message": "Conversation history cleared"}
    except Exception as e:
        frappe.log_error(f"Failed to clear conversation history: {str(e)}")
        return {"status": "error", "message": str(e)}



