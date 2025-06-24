app_name = "aida_taskforge_integration"
app_title = "Aida Taskforge Integration"
app_publisher = "op"
app_description = "AIDA AI Assistant for ERPNext"
app_email = "op@op.com"
app_license = "mit"

# Apps
# ------------------

# required_apps = []

# Each item in the list will be shown as an app in the apps page
# add_to_apps_screen = [
# 	{
# 		"name": "aida_taskforge_integration",
# 		"logo": "/assets/aida_taskforge_integration/logo.png",
# 		"title": "Aida Taskforge Integration",
# 		"route": "/aida_taskforge_integration",
# 		"has_permission": "aida_taskforge_integration.api.permission.has_app_permission"
# 	}
# ]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
app_include_css = [
    "/assets/aida_taskforge_integration/css/aida_widget.css"
]

app_include_js = [
    "/assets/aida_taskforge_integration/js/aida_widget.js"
]

# include js, css files in header of web template
web_include_css = [
    "/assets/aida_taskforge_integration/css/aida_widget.css"
]

web_include_js = [
    "/assets/aida_taskforge_integration/js/aida_widget.js"
]

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "aida_taskforge_integration/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "aida_taskforge_integration/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# automatically load and sync documents of this doctype from downstream apps
# importable_doctypes = [doctype_1]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "aida_taskforge_integration.utils.jinja_methods",
# 	"filters": "aida_taskforge_integration.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "aida_taskforge_integration.install.before_install"
# after_install = "aida_taskforge_integration.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "aida_taskforge_integration.uninstall.before_uninstall"
# after_uninstall = "aida_taskforge_integration.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "aida_taskforge_integration.utils.before_app_install"
# after_app_install = "aida_taskforge_integration.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "aida_taskforge_integration.utils.before_app_uninstall"
# after_app_uninstall = "aida_taskforge_integration.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "aida_taskforge_integration.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
# 	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"aida_taskforge_integration.tasks.all"
# 	],
# 	"daily": [
# 		"aida_taskforge_integration.tasks.daily"
# 	],
# 	"hourly": [
# 		"aida_taskforge_integration.tasks.hourly"
# 	],
# 	"weekly": [
# 		"aida_taskforge_integration.tasks.weekly"
# 	],
# 	"monthly": [
# 		"aida_taskforge_integration.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "aida_taskforge_integration.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "aida_taskforge_integration.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "aida_taskforge_integration.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["aida_taskforge_integration.utils.before_request"]
# after_request = ["aida_taskforge_integration.utils.after_request"]

# Job Events
# ----------
# before_job = ["aida_taskforge_integration.utils.before_job"]
# after_job = ["aida_taskforge_integration.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"aida_taskforge_integration.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

# Boot session hook to initialize the widget
boot_session = "aida_taskforge_integration.boot.boot_session"

# Website route rules
website_route_rules = [
    {"from_route": "/aida-widget-test", "to_route": "aida-widget-test"},
    {"from_route": "/test-widget", "to_route": "test-widget"}
]

# Website context
website_context = {
    "favicon": "/assets/aida_taskforge_integration/images/favicon.ico",
    "splash_image": "/assets/aida_taskforge_integration/images/aida-logo.png"
}

