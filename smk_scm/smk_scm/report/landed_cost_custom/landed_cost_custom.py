# Copyright (c) 2024, Sanskar Technolab and contributors
# For license information, please see license.txt

import frappe
from frappe import _

def execute(filters=None):
	columns = [
		{"label": _('<b>Purchase Receipt</b>'), "fieldtype":"Link", "options":"Purchase Receipt", "fieldname":"name" },
		{"label": _('<b>LCV Created</b>'), "fieldtype":"Check", "fieldname":"custom_lcv_created" },
		{"label": _('<b>Receipt Date</b>'), "fieldtype":"Date", "fieldname":"posting_date" },
		{"label": _('<b>Item</b>'), "fieldtype":"Link", "options":"Item", "fieldname":"item_code" },
		{"label": _('<b>Qty</b>'), "fieldtype":"Float", "fieldname":"qty" },
		{"label": _('<b>Grand Total</b>'), "fieldtype":"Currency", "fieldname":"grand_total" },
		{"label": _('<b>Purchase Invoice</b>'), "fieldtype":"Link", "options":"Purchase Invoice", "fieldname":"pi", "width":220, "text-align":'Left'},
		{"label": _('<b>Landed Cost Voucher</b>'), "fieldtype":"Link", "options":"Landed Cost Voucher", "fieldname":"lcv" },
	]

	sql = f"""
		SELECT 
			PR.name,
			PR.posting_date,
			PR.custom_lcv_created,
			PR.grand_total,
			PRI.item_code,
			PRI.qty,
			PI.name AS pi,
			LCV.name AS lcv
		FROM `tabPurchase Receipt` AS PR
		JOIN `tabPurchase Receipt Item` AS PRI ON PR.name = PRI.parent
		LEFT JOIN `tabPurchase Invoice` AS PI ON PR.name = PI.custom_purchase_receipt AND PI.docstatus = 1
		LEFT JOIN `tabLanded Cost Purchase Receipt` AS LCPR ON PR.name = LCPR.receipt_document 
		LEFT JOIN `tabLanded Cost Voucher` AS LCV ON LCV.name = LCPR.parent AND LCV.docstatus != 2
		WHERE PR.docstatus = 1
	"""
	if filters.get('from_date') and filters.get('to_date'):
		sql += f"AND PR.posting_date BETWEEN '{filters.get('from_date')}' AND '{filters.get('to_date')}'"

	if filters.get('item_code'):
		sql += f"AND PRI.item_code  = '{filters.get('item_code')}'"

	if filters.get('custom_lcv_created'):
		sql += f"AND PR.custom_lcv_created = {1 if filters.get('custom_lcv_created') == 'Yes' else 0}"

	sql += f"\n	ORDER BY PR.name"
	data = frappe.db.sql(sql,as_dict = True)
	return columns, data
