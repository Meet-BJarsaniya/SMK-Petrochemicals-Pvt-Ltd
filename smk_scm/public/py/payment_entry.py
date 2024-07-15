
import frappe
from frappe.email.queue import flush
from frappe.utils import get_fullname

@frappe.whitelist()
def send_advance_payment_email(purchase_order, recipients):
    recipients = frappe.parse_json(recipients)
    try:
        # Construct email content
        subject = f"Advance Payment Notification for Purchase Order {purchase_order}"
        message = f"Dear Team,\n\nPlease be informed that an advance payment has been made for Purchase Order {purchase_order}.\nPlease take the necessary actions.\n\nThank you."

        # Send email to recipients
        frappe.sendmail(
            recipients=recipients,
            subject=subject,
            message=message
        )
        flush()

        return "Email sent successfully"
    
    except Exception as e:
        frappe.log_error(f"Failed to send email for Purchase Order {purchase_order}: {str(e)}")
        return "Failed to send email"