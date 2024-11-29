import frappe


@frappe.whitelist()
def update_work_order_status():
    frappe.db.sql("""
        UPDATE `tabWork Order`
        SET status = 'Released'
        WHERE status = 'In Process'
    """)
    frappe.db.commit()

@frappe.whitelist()
def update_qty_for_required_items(work_order_name):
    # Fetch the Work Order document
    work_order = frappe.get_doc("Work Order", work_order_name)
    # Update the qty in the child table
    for item in work_order.required_items:
        frappe.db.set_value(item.doctype, item.name, 'required_qty', item.transferred_qty)
    # Commit changes to the database
    frappe.db.commit()
    return "Quantities updated successfully."