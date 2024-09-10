import frappe
from frappe.email.queue import flush

@frappe.whitelist()
def send_email_to_owners(recipient_id, supplier_quotation_id, supplier_quotation_details, company):
    recipient_id='purchasemanager@smk.com'
    message = f"""
    <p>Dear Sir,</p>
    <p>I hope this message finds you well.
    <br>We are pleased to inform you that the Supplier Quotation you created for the following items has been approved:</p>
    <b>Item Details:</b>
    <p>{supplier_quotation_details}</p>
    <p>Please proceed with the next steps to ensure timely delivery. If you have any further questions or require any additional information, feel free to reach out.
    <br>Thank you for your prompt attention to this request. We look forward to your response.</p>
    <p>Best regards,<br>{company}</p>
    """
    frappe.sendmail(
        recipients=[recipient_id],
        subject="Supplier Quotation Approved - '" + supplier_quotation_id + "'",
        message=message
    )
    flush()