# Copyright (c) 2024, Sanskar Technolab and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class QCWarehouseEntry(Document):
	pass

# @frappe.whitelist()
# def get_items_from_po(purchase_order):
# 	doc = frappe.get_doc('Purchase Order', purchase_order)
# 	td = []
# 	for row in doc.items:
# 		# qty = row.balance_qty1 if row.balance_qty1 >= 0 else row.qty
# 		tr = [row.item_code, row.item_name, qty, row.uom, doc.name]
# 		td.append(tr)
  
@frappe.whitelist()
def update_purchase_order_items(purchase_order, qc_items_dict):
    # Ensure qc_items_dict is correctly parsed from JSON to a dictionary
    if isinstance(qc_items_dict, str):
        import json
        qc_items_dict = json.loads(qc_items_dict)

    purchase_order_doc = frappe.get_doc("Purchase Order", purchase_order)
    for item in purchase_order_doc.items:
        if item.item_code in qc_items_dict:
            frappe.db.set_value("Purchase Order Item", item.name, "custom_qc_qty", qc_items_dict[item.item_code])
    frappe.db.commit()