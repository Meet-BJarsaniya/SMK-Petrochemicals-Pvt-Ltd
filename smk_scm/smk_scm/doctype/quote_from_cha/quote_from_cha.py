# Copyright (c) 2024, Sanskar Technolab and contributors
# For license information, please see license.txt

import frappe
from erpnext.setup.utils import get_exchange_rate
from frappe.model.document import Document
from frappe.utils import get_url
from frappe.email.queue import flush


class QuoteFromCHA(Document):
	pass

@frappe.whitelist()
def get_exchange_rate1(from_currency, to_currency):
    return get_exchange_rate(from_currency, to_currency)

@frappe.whitelist()
def send_email_to_owners(recipient_id, name, doctype, forwarder, gross_weight, total_charges_in_inr, company):
    # recipient_id='purchasemanager@smk.com'
    logo_url = get_url("/files/SMK_Logo.jpg")
    doctype_slug = frappe.scrub(doctype).replace("_", "-")
    document_url = frappe.utils.get_url(f"app/{doctype_slug}/{name}")
    message = f"""
    <p>Dear Sir,</p>
    <p>I hope this message finds you well.
    <br>This is to inform you that the quote from our CHA/Forwarder for the import process has been approved. Please find the approved details below:
    <br>Click <a href="{document_url}">here</a> to open the Supplier Quotation.</p>
    <p><b>Approved Quote Details:
    <br>Forwarder/CHA :</b> { forwarder }
    <br><b>Gross Weight :</b> { gross_weight } kg
    <br><b>Total Charges (INR) :</b> ₹{ total_charges_in_inr }</p>
    <p>Kindly proceed with the necessary arrangements and update the logistics team as needed.</p>
    <br>If there are any questions or clarifications, feel free to reach out.</p>
    <p>Best regards,<br>{company}</p>
    <img src= "{logo_url}" alt="SMK Petrochemicals" width="200" />
    """
    frappe.sendmail(
        recipients=[recipient_id],
        subject="Quote from CHA Approved - '" + name + "'",
        message=message
    )
    flush()