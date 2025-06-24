import frappe
import os
import json

def install_aida_doctypes():
    """Install AIDA DocTypes if they don't exist"""
    
    # Check if AIDA Conversation DocType exists
    if not frappe.db.exists("DocType", "AIDA Conversation"):
        print("Creating AIDA Conversation DocType...")
        
        # Create AIDA Conversation DocType
        doctype_doc = frappe.new_doc("DocType")
        doctype_doc.name = "AIDA Conversation"
        doctype_doc.module = "Aida Taskforge Integration"
        doctype_doc.custom = 1
        doctype_doc.is_submittable = 0
        doctype_doc.track_changes = 0
        
        # Add fields
        fields = [
            {
                "fieldname": "user",
                "fieldtype": "Link",
                "label": "User",
                "options": "User",
                "reqd": 1
            },
            {
                "fieldname": "session_id",
                "fieldtype": "Data",
                "label": "Session ID",
                "reqd": 1
            },
            {
                "fieldname": "message_type",
                "fieldtype": "Select",
                "label": "Message Type",
                "options": "user\nai",
                "reqd": 1
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
                "reqd": 1
            },
            {
                "fieldname": "context_data",
                "fieldtype": "JSON",
                "label": "Context Data"
            }
        ]
        
        for i, field in enumerate(fields):
            field["idx"] = i + 1
            doctype_doc.append("fields", field)
        
        # Add permissions
        doctype_doc.append("permissions", {
            "role": "All",
            "read": 1,
            "write": 1,
            "create": 1,
            "delete": 1
        })
        
        doctype_doc.save()
        print("AIDA Conversation DocType created successfully!")
    else:
        print("AIDA Conversation DocType already exists.")

if __name__ == "__main__":
    frappe.init()
    frappe.connect()
    install_aida_doctypes()
    frappe.db.commit()
    print("Installation complete!")
