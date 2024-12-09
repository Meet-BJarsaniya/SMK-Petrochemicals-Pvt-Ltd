import frappe
import json

@frappe.whitelist()
def update_user_permissions(users):
    success = []
    errors = []
    users = json.loads(users)
    for user in users:
        try:
            user_doc = frappe.get_doc('User', user['name'])
            if user_doc.location:
                warehouse = frappe.db.get_value('Warehouse', {'city': user_doc.location}, 'name')
                if warehouse:
                    # Create User Permission
                    user_permission = frappe.get_doc({
                        'doctype': 'User Permission',
                        'user': user_doc.name,
                        'allow': 'Warehouse',
                        'for_value': warehouse
                    })
                    user_permission.insert(ignore_permissions=True)
                    success.append(user_doc.name)
                else:
                    errors.append(f"No warehouse found for location: {user_doc.location}")
            else:
                errors.append(f"User {user_doc.name} has no location specified.")
        except Exception as e:
            errors.append(f"Error updating User {user}: {str(e)}")

    return {'success': success, 'errors': errors}
