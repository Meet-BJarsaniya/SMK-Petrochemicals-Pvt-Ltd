import frappe
from frappe.email.queue import flush

@frappe.whitelist()
def send_email(name, company, supplier, acc_id, acc_name, payment_terms_template, payment_schedule, logi_id, logi_name, custom_delivery_terms, custom_delivery_term_description, po_details):
    supplier_id = frappe.get_value("Supplier", supplier, "email_id")
    message = f"""
    <p>Dear {supplier},</p>
    <p>I hope this message finds you well.
    <br>We are pleased to place a purchase order with your company for the following items. Please review the details and confirm the order.</p>
    <b>Item Details:</b>
    <p>{po_details}</p>
    <p>Please confirm the receipt of this order and share the expected dispatch details. If there are any questions or clarifications required, feel free to contact us.
    <br>Thank you for your prompt attention to this order. We look forward to receiving the goods as per the agreed terms.</p>
    <p>Best regards,<br>{company}</p>
    """
    frappe.sendmail(
        recipients=[supplier_id],
        subject="Purchase Order is confirmed.",
        message=message
    )
    flush()
    
    #Acc team mail
    message = f"""
    <p>Dear {acc_name},</p>
    <p>I hope this message finds you well.
    <br>A new Purchase Order { name } has been created for { supplier }. Please review the payment terms below for your reference:</p>
    <b>Item Details:</b>
    <p>{po_details}</p>
    <p><b>Payment Term Details:</b></p>
    <p>{payment_terms_template}</p>
    <p>{payment_schedule}</p>
    <p>Kindly ensure that the payment is processed according to the agreed terms. Please feel free to reach out if any additional information is needed.</p>
    <p>Best regards,<br>{company}</p>
    """
    frappe.sendmail(
        recipients=[acc_id],
        subject="Payment Terms for Purchase Order - '" + name + "'",
        message=message
    )
    flush()
    
    #Logi team mail
    message = f"""
    <p>Dear {logi_name},</p>
    <p>I hope this message finds you well.
    <br>A new Purchase Order { name } has been created for { supplier }. Please review the delivery terms below for your reference:</p>
    <b>Item Details:</b>
    <p>{po_details}</p>
    <p><b>Delivery Term Details:</b></p>
    <p>{custom_delivery_terms}</p>
    <p>{custom_delivery_term_description}</p>
    <p>Please ensure that the logistics are coordinated accordingly. If you need further information, feel free to contact us.</p>
    <p>Best regards,<br>{company}</p>
    """
    frappe.sendmail(
        recipients=[logi_id],
        subject="Delivery Terms for Purchase Order - '" + name + "'",
        message=message
    )
    flush()