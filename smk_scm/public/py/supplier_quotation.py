import frappe
from frappe.email.queue import flush

@frappe.whitelist()
def send_email_to_owners(owners_list, supplier_quotation_id, supplier_quotation_details, company):
    owners = frappe.parse_json(owners_list)
    for owner in owners:
        recipient = frappe.db.get_value("User", owner, "email")
        if recipient:
            message = f"""
            <p>Dear {frappe.db.get_value("User", owner, "first_name")},</p>
            <p>I just wanted to inform you that the Supplier Quotation with ID: {supplier_quotation_id} has been approved for making a Purchase Order.</p>
            <b>Details:</b>
            <p>{supplier_quotation_details}</p>
            <p>So, please create a Purchase Order for this Supplier Quotation.</p>
            <p>Best regards,<br>{company}</p>
            """
            frappe.sendmail(
                recipients=[recipient],
                subject="Supplier Quotation Approved",
                message=message
            )
            flush()