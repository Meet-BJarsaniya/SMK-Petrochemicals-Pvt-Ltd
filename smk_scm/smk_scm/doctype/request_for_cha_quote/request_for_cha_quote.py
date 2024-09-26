# Copyright (c) 2024, Sanskar Technolab and contributors
# For license information, please see license.txt

import frappe
from frappe.email.queue import flush
from frappe.utils import get_url
from frappe.model.document import Document


class RequestforCHAQuote(Document):
	pass

@frappe.whitelist()
def send_email(name, company, recipient_id, recipient, rfq_details, item_details):
    logo_url = get_url("/private/files/SMK logo.jpg")
    message = f"""
    <p>Dear {recipient},</p>
    <p>I hope this message finds you well.
    <br>We are in the process of importing materials and would like to request a quotation for the logistics services required for the shipment mentioned below. Kindly provide us with a detailed quote for the services listed, including applicable charges.</p>
    <b>Shipment Details:</b>
    <p>{rfq_details}</p>
    <b>Item Details:</b>
    <p>{item_details}</p>
    <p>We would appreciate it if you could send us your detailed quotation. Please let us know if you need any further details.
    <br>Thank you for your prompt response and assistance.</p>
    <p>Best regards,<br>{company}</p>
    <p><img src="{logo_url}" alt="SMK Petrochemicals" width="200" /></p>
    """
    frappe.sendmail(
        recipients=[recipient_id],
        subject="Request for Quotation - Import Services for Shipment",
        message=message
    )
    flush()