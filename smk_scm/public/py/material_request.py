import frappe
from frappe.email.queue import flush
from frappe.utils import get_url

@frappe.whitelist()
def send_email(name, doctype, company, recipient_id, recipient, mr_details):
    logo_url = get_url("/files/SMK logo.jpg")
    doctype_slug = frappe.scrub(doctype).replace("_", "-")
    document_url = frappe.utils.get_url(f"app/{doctype_slug}/{name}")
    message = f"""
    <p>Dear {recipient},</p>
    <p>I hope this message finds you well.
    <br>We are currently in need of the following items for our operations and would like to request a quotation for the same.
    <br>Click <a href="{document_url}">here</a> to open the Material Request.</p>
    <b>Item Details:</b>
    <p>{mr_details}</p>
    <p>Please feel free to contact us if any further details are needed.
    <br>Thank you for your prompt attention to this request. We look forward to your response.</p>
    <p>Best regards,<br>{company}</p>
    <img src="{logo_url}" alt="SMK Petrochemicals" width="200" />
    """
    frappe.sendmail(
        recipients=[recipient_id],
        subject="Material Request - '" + name + "'",
        message=message
    )
    flush()