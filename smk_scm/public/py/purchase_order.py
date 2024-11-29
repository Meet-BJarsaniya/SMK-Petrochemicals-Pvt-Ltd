import frappe
import json
from datetime import datetime
from frappe.email.queue import flush
from frappe.utils import get_url

@frappe.whitelist()
def send_email(name, doctype, company, supplier, acc_id, acc_name, payment_terms_template, payment_schedule, logi_id, logi_name, prod_name, prod_id, custom_delivery_terms, custom_delivery_term_description, po_details, custom_company_users, etd, eta, email_subject):
    # Convert ETD and ETA to dd-mm-yyyy format
    def format_date(date_string):
        try:
            return datetime.strptime(date_string, "%Y-%m-%d").strftime("%d-%m-%Y")
        except ValueError:
            return date_string  # Return the original if parsing fails

    etd = format_date(etd)
    eta = format_date(eta)
    # Construct the schedule details if data exists
    schedule_details = ""
    if etd or eta:
        schedule_details = "<p style='margin: 2em 0 0 0 !important;'><b>Schedule:</b></p><ul style='margin: 0 !important;'>"
        if etd:
            schedule_details += f"<li>Estimated Time of Departure (ETD): {etd}</li>"
        if eta:
            schedule_details += f"<li>Estimated Time of Arrival (ETA): {eta}</li>"
        schedule_details += "</ul>"
    supplier_id = frappe.get_value("Supplier", supplier, "email_id")
    logo_url = get_url("/private/files/SMK logo.jpg")
    doctype_slug = frappe.scrub(doctype).replace("_", "-")
    document_url = frappe.utils.get_url(f"app/{doctype_slug}/{name}")
    
    #Supplier mail
    message = f"""
    <p>Dear {supplier},</p>
    <p>I hope this message finds you well.
    <br>We are pleased to place a purchase order with your company for the following items. Please review the details and confirm the order.</p>
    <b>Item Details:</b>
    <p>{po_details}</p>
    <p>Please confirm the receipt of this order and share the expected dispatch details. If there are any questions or clarifications required, feel free to contact us.
    <br>Thank you for your prompt attention to this order. We look forward to receiving the goods as per the agreed terms.</p>
    <p>Best regards,<br>{company}</p>
    <img src="{logo_url}" alt="SMK Petrochemicals" width="200" />
    """
    frappe.sendmail(
        recipients=[supplier_id],
        # subject="Purchase Order is confirmed.",
        subject=email_subject,
        message=message
    )
    flush()
    
    # #Acc team mail
    # message = f"""
    # <p>Dear {acc_name},</p>
    # <p>I hope this message finds you well.
    # <br>A new Purchase Order { name } has been created for { supplier }. Please review the payment terms below for your reference:
    # <br>Click <a href="{document_url}">here</a> to open the Purchase Order.</p>
    # <b>Item Details:</b>
    # <p>{po_details}</p>
    # <p><b>Payment Term Details:</b></p>
    # <p>{payment_terms_template}</p>
    # <p>{payment_schedule}</p>
    # <p>Kindly ensure that the payment is processed according to the agreed terms. Please feel free to reach out if any additional information is needed.</p>
    # <p>Best regards,<br>{company}</p>
    # <img src="{logo_url}" alt="SMK Petrochemicals" width="200" />
    # """
    # frappe.sendmail(
    #     recipients=[acc_id],
    #     subject="Payment Terms for Purchase Order - '" + name + "'",
    #     message=message
    # )
    # flush()
    
    # #Logi team mail
    # message = f"""
    # <p>Dear {logi_name},</p>
    # <p>I hope this message finds you well.
    # <br>A new Purchase Order { name } has been created for { supplier }. Please review the delivery terms below for your reference:
    # <br>Click <a href="{document_url}">here</a> to open the Purchase Order.</p>
    # <b>Item Details:</b>
    # <p>{po_details}</p>
    # <p><b>Delivery Term Details:</b>
    # <br>Delivery Terms: {custom_delivery_terms}
    # <br>Delivery Terms Description: {custom_delivery_term_description}</p>
    # <p>Please ensure that the logistics are coordinated accordingly. If you need further information, feel free to contact us.</p>
    # <p>Best regards,<br>{company}</p>
    # <img src="{logo_url}" alt="SMK Petrochemicals" width="200" />
    # """
    # frappe.sendmail(
    #     recipients=[logi_id],
    #     subject="Delivery Terms for Purchase Order - '" + name + "'",
    #     message=message
    # )
    # flush()
    
    # #Prod team mail
    # if prod_id != "":
    #     message = f"""
    #     <p>Dear {prod_name},</p>
    #     <p>I hope this message finds you well.
    #     <br>A new Purchase Order { name } has been created for { supplier }. Please review the delivery terms below for your reference:
    #     <br>Click <a href="{document_url}">here</a> to open the Purchase Order.</p>
    #     <b>Item Details:</b>
    #     <p>{po_details}</p>
    #     <p><b>Delivery Term Details:</b>
    #     <br>Delivery Terms: {custom_delivery_terms}
    #     <br>Delivery Terms Description: {custom_delivery_term_description}</p>
    #     <p>Please ensure that the logistics are coordinated accordingly. If you need further information, feel free to contact us.</p>
    #     <p>Best regards,<br>{company}</p>
    #     <img src="{logo_url}" alt="SMK Petrochemicals" width="200" />
    #     """
    #     frappe.sendmail(
    #         recipients=[prod_id],
    #         subject="Delivery Terms for Purchase Order - '" + name + "'",
    #         message=message
    #     )
    #     flush()


    #Company Users mail
    if isinstance(custom_company_users, str):
        try:
            custom_company_users = json.loads(custom_company_users)
        except json.JSONDecodeError:
            frappe.throw("Invalid JSON format for custom_company_users.")
    # Extract all email IDs from custom_company_users
    recipients = [user.get("user") for user in custom_company_users if user.get("user")]
    message = f"""
    <p>Dear Sir/Ma'am,</p>
    <p>I hope this message finds you well.
    <br>A new Purchase Order { name } has been created for { supplier }. Please find the details below for your reference:
    <br>Click <a href="{document_url}">here</a> to open the Purchase Order.</p>
    <p style='margin: 2em 0 0 0 !important;'><b>Item Details:</b></p>
    {po_details}
    <p style='margin: 2em 0 0 0 !important;'><b>Payment Term Details:</b>
    <br>{payment_terms_template}</p>
    {payment_schedule}
    <p style='margin: 2em 0 0 0 !important;'><b>Delivery Term Details:</b>
    <br>Delivery Terms: {custom_delivery_terms}
    <br>Delivery Terms Description: {custom_delivery_term_description}</p>
    {schedule_details}
    <p>Kindly ensure the payment is processed according to the agreed terms and logistics are coordinated accordingly. Please feel free to reach out if any additional information is needed.</p>
    <p>Best regards,<br>{company}</p>
    <img src="{logo_url}" alt="SMK Petrochemicals" width="200" />
    """
    frappe.sendmail(
        recipients=recipients,
        # subject="Delivery Terms for Purchase Order - '" + name + "'",
        subject=email_subject,
        message=message,
        attachments=[(frappe.attach_print(doctype, name, name, 'Purchase Order'))]
    )
    flush()



@frappe.whitelist()
def send_schedule_email(name, doctype, company, supplier, custom_company_users, etd, eta, schedule_date, email_subject):
    # Convert ETD and ETA to dd-mm-yyyy format
    def format_date(date_string):
        try:
            return datetime.strptime(date_string, "%Y-%m-%d").strftime("%d-%m-%Y")
        except ValueError:
            return date_string  # Return the original if parsing fails

    etd = format_date(etd)
    eta = format_date(eta)
    schedule_date = format_date(schedule_date)
    # Construct the schedule details if data exists
    schedule_details = ""
    if etd or eta:
        schedule_details = "<p style='margin: 2em 0 0 0 !important;'><b>Schedule:</b></p><ul style='margin: 0 !important;'>"
        if schedule_date:
            schedule_details += f"<li>Required By Date: {schedule_date}</li>"
        if etd:
            schedule_details += f"<li>Estimated Time of Departure (ETD): {etd}</li>"
        if eta:
            schedule_details += f"<li>Estimated Time of Arrival (ETA): {eta}</li>"
        schedule_details += "</ul>"
    logo_url = get_url("/private/files/SMK logo.jpg")
    doctype_slug = frappe.scrub(doctype).replace("_", "-")
    document_url = frappe.utils.get_url(f"app/{doctype_slug}/{name}")

    #Company Users mail
    if isinstance(custom_company_users, str):
        try:
            custom_company_users = json.loads(custom_company_users)
        except json.JSONDecodeError:
            frappe.throw("Invalid JSON format for custom_company_users.")
    # Extract all email IDs from custom_company_users
    recipients = [user.get("user") for user in custom_company_users if user.get("user")]
    message = f"""
    <p>Dear Sir/Ma'am,</p>
    <p>I hope this message finds you well.
    <br>A new Purchase Order { name } has been created for { supplier }. Please find the details below for your reference:
    <br>Click <a href="{document_url}">here</a> to open the Purchase Order.</p>
    {schedule_details}
    <p>Kindly ensure the payment is processed according to the agreed terms and logistics are coordinated accordingly. Please feel free to reach out if any additional information is needed.</p>
    <p>Best regards,<br>{company}</p>
    <img src="{logo_url}" alt="SMK Petrochemicals" width="200" />
    """
    frappe.sendmail(
        recipients=recipients,
        # subject="Delivery Terms for Purchase Order - '" + name + "'",
        subject=email_subject,
        message=message
    )
    flush()