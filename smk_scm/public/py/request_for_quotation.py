import frappe
from frappe.email.queue import flush
from frappe.utils import get_url

@frappe.whitelist()
def send_email(name, company, recipient_id, recipient, rfq_details, tc_name, terms):
    logo_url = get_url("/files/SMK logo.jpg")
    message = f"""
    <p>Dear {recipient},</p>
    <p>I hope this message finds you well.
    <br>We are currently in the process of reviewing our suppliers and would like to request a quotation for the following items. Please provide us with the item rates, including any applicable taxes, delivery charges, and terms of payment.</p>
    <b>Item Details:</b>
    <p>{rfq_details}</p>
    """
    if tc_name:
        message += f"<p><b>Terms: {tc_name}</b></p>"
    if terms:
        message += f"<p><b>Terms and Conditions:</b> {terms}</p>"
    message += f"""
    <p>Please provide us with a detailed quotation, and do not hesitate to contact me if you require any further information.
    <br>Thank you for your attention to this request. We look forward to your prompt response.</p>
    <p>Best regards,<br>{company}</p>
    <p><img src="{logo_url}" alt="SMK Petrochemicals" width="200" /></p>
    """
    frappe.sendmail(
        recipients=[recipient_id],
        subject="Request for Quotation for Items",
        message=message
    )
    flush()