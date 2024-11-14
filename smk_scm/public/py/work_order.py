import frappe


@frappe.whitelist()
def update_work_order_status():
    frappe.db.sql("""
        UPDATE `tabWork Order`
        SET status = 'Released'
        WHERE status = 'In Process'
    """)
    frappe.db.commit()