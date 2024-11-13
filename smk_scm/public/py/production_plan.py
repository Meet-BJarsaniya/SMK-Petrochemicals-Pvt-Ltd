import frappe
from frappe.email.queue import flush
from frappe.utils import get_url
from datetime import datetime


@frappe.whitelist()
def send_email(name, doctype, company, so_name):
    customer = frappe.get_value("Sales Order", so_name, "customer")
    customer_name = frappe.get_value("Sales Order", so_name, "customer_name")
    delivery_date = frappe.get_value("Sales Order", so_name, "delivery_date")

    # Convert to dd-mm-yyyy format
    delivery_date = delivery_date.strftime("%d-%m-%Y")
    # log(formatted_date)
    customer = frappe.get_value("Customer", customer, "email_id")
    logo_url = get_url("/private/files/SMK logo.jpg")
    doctype_slug = frappe.scrub(doctype).replace("_", "-")
    document_url = frappe.utils.get_url(f"app/{doctype_slug}/{name}")


    # mail to customer
    message = f"""
    <p>Dear {customer_name},</p>
    <p>I hope this message finds you well.
    <br>We are pleased to inform you that your order has been accepted. Please find the details below:</p>
    <p><b>Order Details:</b>
    <br><b>Production Plan Reference No: </b>{ name }
    <br><b>Sales Order No: </b>{ so_name }
    <br><b>Estimated Time of Departure (ETD): </b>{ delivery_date }</p>
    <p>Please feel free to contact us if any further details are needed.</p>
    <p>Best regards,<br>{company}</p>
    <img src="{logo_url}" alt="SMK Petrochemicals" width="200" />
    """
    frappe.sendmail(
        recipients=[customer],
        subject="Order Confirmation - Ref No: '" + name + "' | Order No: '" + so_name +  "'",
        message=message
    )
    flush()


    #mail to Sales manager
    # Get email addresses of users with the "Sales Manager" role
    users = frappe.get_list("User", fields=["name", "email"])
    sales_manager_emails = []
    for user in users:
        user_roles = frappe.get_all("Has Role", filters={"parent": user.name}, fields=["role"])
        for role in user_roles:
            if role.get("role") == "Sales Manager":
                sales_manager_emails.append(user.email)
    message = f"""
    <p>Dear Sir/Ma'am,</p>
    <p>I hope this message finds you well.
    <br>We are pleased to inform you that your order has been accepted. Please find the details below:
    <br>Click <a href="{document_url}">here</a> to open the Production Plan.</p>
    <p><b>Order Details:</b>
    <br><b>Production Plan Reference No: </b>{ name }
    <br><b>Sales Order No: </b>{ so_name }
    <br><b>Estimated Time of Departure (ETD): </b>{ delivery_date }</p>
    <p>Please feel free to contact us if any further details are needed.</p>
    <p>Best regards,<br>{company}</p>
    <img src="{logo_url}" alt="SMK Petrochemicals" width="200" />
    """
    frappe.sendmail(
        recipients=sales_manager_emails,
        subject="Order Confirmation - Ref No: '" + name + "' | Order No: '" + so_name +  "'",
        message=message
    )
    flush()
    frappe.msgprint('An Email sent successfully')