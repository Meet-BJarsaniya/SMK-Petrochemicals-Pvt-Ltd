# Copyright (c) 2024, Sanskar Technolab and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe import _
from frappe.model.mapper import get_mapped_doc
from frappe.utils import flt, getdate, nowdate, get_url

from erpnext.buying.utils import validate_for_items
from erpnext.controllers.buying_controller import BuyingController
from frappe.email.queue import flush



class SupplierQuotationforNewItem(Document):
	pass

@frappe.whitelist()
def make_purchase_order(source_name, target_doc=None):
	def set_missing_values(source, target):
		target.run_method("set_missing_values")
		target.run_method("get_schedule_dates")
		target.run_method("calculate_taxes_and_totals")

	def update_item(obj, target, source_parent):
		target.stock_qty = flt(obj.qty) * flt(obj.conversion_factor)

	doclist = get_mapped_doc(
		"Supplier Quotation for New Item",
		source_name,
		{
			"Supplier Quotation for New Item": {
				"doctype": "Purchase Order",
				"validation": {
					"docstatus": ["=", 1],
				},
			},
			"Supplier Quotation Item": {
				"doctype": "Purchase Order Item",
				"field_map": [
					["name", "supplier_quotation_item"],
					["parent", "supplier_quotation"],
					["material_request", "material_request"],
					["material_request_item", "material_request_item"],
					["sales_order", "sales_order"],
				],
				"postprocess": update_item,
			},
			"Purchase Taxes and Charges": {
				"doctype": "Purchase Taxes and Charges",
			},
		},
		target_doc,
		set_missing_values,
	)

	return doclist

@frappe.whitelist()
def make_quotation(source_name, target_doc=None):
	doclist = get_mapped_doc(
		"Supplier Quotation for New Item",
		source_name,
		{
			"Supplier Quotation for New Item": {
				"doctype": "Quotation",
				"field_map": {
					"name": "supplier_quotation",
				},
			},
			"Supplier Quotation Item": {
				"doctype": "Quotation Item",
				"condition": lambda doc: frappe.db.get_value("Item", doc.item_code, "is_sales_item") == 1,
				"add_if_empty": True,
			},
		},
		target_doc,
	)

	return doclist


form_grid_templates = {"items": "templates/form_grid/item_grid.html"}

@frappe.whitelist()
def send_email_to_owners(recipient_id, name, doctype, supplier_quotation_details, company):
    # recipient_id='purchasemanager@smk.com'
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