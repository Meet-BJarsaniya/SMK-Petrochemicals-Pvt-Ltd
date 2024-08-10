import frappe
from frappe.email.queue import flush

@frappe.whitelist()
def send_email(name, company):
    recipients = frappe.get_all("User", filters={"role": "Purchase Manager"}, pluck="email")
    for recipient in recipients:
        print(recipients)
        if recipient:
            print(recipient)
            print(frappe.db.get_value("User", recipient, "first_name"))
            message = f"""
            <p>Dear {frappe.db.get_value("User", recipient, "first_name")},</p>
            <p>I just wanted to inform you that the PO with ID: {name} has been submitted.</p>
            <p>Best regards,<br>{company}</p>
            """
            frappe.sendmail(
                recipients=[recipient],
                subject="Purchase Order is confirmed.",
                message=message
            )
            flush()