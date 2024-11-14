# Copyright (c) 2024, Sanskar Technolab and contributors
# For license information, please see license.txt

import frappe
from frappe import _

def execute(filters=None):
	columns = [
		{"label": _('<b>Date</b>'), "fieldtype":"Date", "fieldname":"posting_date" },
		{"label": _('<b>Plan No.</b>'), "fieldtype":"Link", "options":"Production Plan", "fieldname":"name" },
		# {"label": _('<b>Batch No.</b>'), "fieldtype":"Data", "fieldname":"batch_no" },
		{"label": _('<b>Item</b>'), "fieldtype":"Link", "options":"Item", "fieldname":"item_code" },
		{"label": _('<b>Product Type</b>'), "fieldtype":"Data", "fieldname":"item_group", "width":100 },
		{"label": _('<b>Order Qty</b>'), "fieldtype":"Data", "fieldname":"ordered_qty" },
		{"label": _('<b>Plan Qty</b>'), "fieldtype":"Data", "fieldname":"planned_qty" },
		{"label": _('<b>ETP</b>'), "fieldtype":"Date", "fieldname":"planned_start_date" },
		{"label": _('<b>ETD</b>'), "fieldtype":"Date", "fieldname":"expected_delivery_date" },
		{"label": _('<b>Stock Remarks</b>'), "fieldtype":"Data", "fieldname":"status", "width":100 },
		{"label": _('<b>Qty Recvd from Production Ledger</b>'), "fieldtype":"Float", "fieldname":"total_required_qty", "width":100 },
		{"label": _('<b>Remarks 1</b>'), "fieldtype":"Data", "fieldname":"remarks_1", "width":100 },
		{"label": _('<b>Remarks 2</b>'), "fieldtype":"Data", "fieldname":"remarks_2", "width":100 },
	]

	sql = f"""
		SELECT 
			PR.posting_date,
			PR.name,
			PRI.item_code,
			I.item_group,
			CASE 
				WHEN PRI.ordered_qty = 0 THEN ''
				ELSE CONCAT(FORMAT(PRI.ordered_qty, 3), ' ', PRI.stock_uom)
			END AS ordered_qty,
			CONCAT(FORMAT(PRI.planned_qty, 3), ' ', PRI.stock_uom) AS planned_qty,
			PR.status,
			WO.planned_start_date,
			WO.expected_delivery_date,
			(SELECT SUM(WOI.required_qty)
				FROM `tabWork Order Item` AS WOI
				JOIN `tabWork Order` AS WO1 ON PR.name = WO1.production_plan
				WHERE WOI.parent = WO1.name
				AND WOI.item_code NOT IN 
				(SELECT WO2.production_item
					FROM `tabWork Order` AS WO2
					WHERE WO2.production_plan = PR.name)) AS total_required_qty
		FROM `tabProduction Plan` AS PR
		JOIN `tabProduction Plan Item` AS PRI ON PR.name = PRI.parent
		JOIN `tabItem` AS I ON I.name = PRI.item_code
		LEFT JOIN `tabWork Order` AS WO ON PR.name = WO.production_plan AND WO.production_item = PRI.item_code
		WHERE PR.docstatus = 1
	"""
	if filters.get('from_date') and filters.get('to_date'):
		sql += f"AND PR.posting_date BETWEEN '{filters.get('from_date')}' AND '{filters.get('to_date')}'"

	if filters.get('item_code'):
		sql += f"AND PRI.item_code  = '{filters.get('item_code')}'"

	if filters.get('name'):
		sql += f"AND PR.name  = '{filters.get('name')}'"

	sql += f"\n	ORDER BY PR.name"
	data = frappe.db.sql(sql,as_dict = True)
	return columns, data
