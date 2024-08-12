# Copyright (c) 2024, Sanskar Technolab and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class QCWarehouseEntry(Document):
	pass

@frappe.whitelist()
def get_items_from_po(purchase_order):
	doc = frappe.get_doc('Purchase Order', purchase_order)
	td = []
	for row in doc.items:
		# qty = row.balance_qty1 if row.balance_qty1 >= 0 else row.qty
		tr = [row.item_code, row.item_name, qty, row.uom, doc.name]
		td.append(tr)