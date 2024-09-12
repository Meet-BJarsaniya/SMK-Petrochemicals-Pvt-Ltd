import frappe
from frappe.email.queue import flush
from frappe.utils import get_url

@frappe.whitelist()
def send_email_to_owners(recipient_id, name, doctype, supplier_quotation_details, company):
    recipient_id='purchasemanager@smk.com'
    logo_url = get_url("/files/SMK logo.jpg")
    doctype_slug = frappe.scrub(doctype).replace("_", "-")
    document_url = frappe.utils.get_url(f"app/{doctype_slug}/{name}")
    message = f"""
    <p>Dear Sir,</p>
    <p>I hope this message finds you well.
    <br>We are pleased to inform you that the Supplier Quotation you created for the following items has been approved:
    <br>Click <a href="{document_url}">here</a> to open the Supplier Quotation.</p>
    <b>Item Details:</b>
    <p>{supplier_quotation_details}</p>
    <p>Please proceed with the next steps to ensure timely delivery. If you have any further questions or require any additional information, feel free to reach out.
    <br>Thank you for your prompt attention to this request. We look forward to your response.</p>
    <p>Best regards,<br>{company}</p>
    <img src= "{logo_url}" alt="SMK Petrochemicals" width="200" />
    """
    frappe.sendmail(
        recipients=[recipient_id],
        subject="Supplier Quotation Approved - '" + name + "'",
        message=message
    )
    flush()