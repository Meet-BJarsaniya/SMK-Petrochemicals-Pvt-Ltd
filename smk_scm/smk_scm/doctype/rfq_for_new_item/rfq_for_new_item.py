# Copyright (c) 2024, Sanskar Technolab and contributors
# For license information, please see license.txt

from frappe.model.document import Document
import json

import frappe
from frappe import _
from frappe.core.doctype.communication.email import make
from frappe.desk.form.load import get_attachments
from frappe.model.mapper import get_mapped_doc
from frappe.utils import get_url
from frappe.utils.print_format import download_pdf
from frappe.utils.user import get_user_fullname

from erpnext.accounts.party import get_party_account_currency, get_party_details
from erpnext.buying.utils import validate_for_items
from erpnext.controllers.buying_controller import BuyingController
from erpnext.stock.doctype.material_request.material_request import set_missing_values

STANDARD_USERS = ("Guest", "Administrator")



class RFQforNewItem(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		from erpnext.buying.doctype.request_for_quotation_item.request_for_quotation_item import (
			RequestforQuotationItem,
		)
		from erpnext.buying.doctype.request_for_quotation_supplier.request_for_quotation_supplier import (
			RequestforQuotationSupplier,
		)

		amended_from: DF.Link | None
		billing_address: DF.Link | None
		billing_address_display: DF.SmallText | None
		company: DF.Link
		email_template: DF.Link | None
		incoterm: DF.Link | None
		items: DF.Table[RequestforQuotationItem]
		letter_head: DF.Link | None
		message_for_supplier: DF.TextEditor
		named_place: DF.Data | None
		naming_series: DF.Literal["PUR-RFQ-.YYYY.-"]
		opportunity: DF.Link | None
		schedule_date: DF.Date | None
		select_print_heading: DF.Link | None
		send_attached_files: DF.Check
		send_document_print: DF.Check
		status: DF.Literal["", "Draft", "Submitted", "Cancelled"]
		suppliers: DF.Table[RequestforQuotationSupplier]
		tc_name: DF.Link | None
		terms: DF.TextEditor | None
		transaction_date: DF.Date
		vendor: DF.Link | None


@frappe.whitelist()
def make_supplier_quotation_from_rfq(source_name, target_doc=None, for_supplier=None):
	def postprocess(source, target_doc):
		if for_supplier:
			target_doc.supplier = for_supplier
			args = get_party_details(for_supplier, party_type="Supplier", ignore_permissions=True)
			target_doc.currency = args.currency or get_party_account_currency(
				"Supplier", for_supplier, source.company
			)
			target_doc.buying_price_list = args.buying_price_list or frappe.db.get_value(
				"Buying Settings", None, "buying_price_list"
			)
		set_missing_values(source, target_doc)

	doclist = get_mapped_doc(
		"RFQ for New Item",
		source_name,
		{
			"RFQ for New Item": {
				"doctype": "Supplier Quotation for New Item",
				"validation": {"docstatus": ["=", 1]},
			},
			"RFQ for New Item Items": {
				"doctype": "Supplier Quotation for New Item Items",
				"field_map": {"name": "request_for_quotation_item", "parent": "request_for_quotation"},
			},
		},
		target_doc,
		postprocess,
	)

	return doclist

@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs
def get_rfq_containing_supplier(doctype, txt, searchfield, start, page_len, filters):
	conditions = ""
	if txt:
		conditions += "and rfq.name like '%%" + txt + "%%' "

	if filters.get("transaction_date"):
		conditions += "and rfq.transaction_date = '{}'".format(filters.get("transaction_date"))

	rfq_data = frappe.db.sql(
		f"""
		select
			distinct rfq.name, rfq.transaction_date,
			rfq.company
		from
			`tabRFQ for New Item` rfq, `tabRequest for Quotation Supplier` rfq_supplier
		where
			rfq.name = rfq_supplier.parent
			and rfq_supplier.supplier = %(supplier)s
			and rfq.docstatus = 1
			and rfq.company = %(company)s
			{conditions}
		order by rfq.transaction_date ASC
		limit %(page_len)s offset %(start)s """,
		{
			"page_len": page_len,
			"start": start,
			"company": filters.get("company"),
			"supplier": filters.get("supplier"),
		},
		as_dict=1,
	)

	return rfq_data
