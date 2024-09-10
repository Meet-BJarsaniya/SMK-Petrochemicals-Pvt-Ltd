import frappe
from frappe.email.queue import flush

@frappe.whitelist()
def send_email(name, company, recipient_id, recipient, mr_details):
    message = f"""
    <p>Dear {recipient},</p>
    <p>I hope this message finds you well.
    <br>We are currently in need of the following items for our operations and would like to request a quotation for the same.</p>
    <b>Item Details:</b>
    <p>{mr_details}</p>
    <p>Please feel free to contact us if any further details are needed.
    <br>Thank you for your prompt attention to this request. We look forward to your response.</p>
    <p>Best regards,<br>{company}</p>
    """
    frappe.sendmail(
        recipients=[recipient_id],
        subject="Material Request for Items",
        message=message
    )
    flush()