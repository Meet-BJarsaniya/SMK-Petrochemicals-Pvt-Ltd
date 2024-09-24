# Copyright (c) 2024, Sanskar Technolab and contributors
# For license information, please see license.txt

import frappe
from frappe import _

def execute(filters=None):
	columns = [
		{"label": _('<b>CHA RFQ</b>'), "fieldtype":"Link", "options":"Request for CHA Quote", "fieldname":"request_for_quotation_cha" },
		{"label": _('<b>Quote From CHA</b>'), "fieldtype":"Link", "options":"Quote From CHA", "fieldname":"name" },
		{"label": _('<b>Forwarder</b>'), "fieldtype":"Link", "options":"Supplier", "fieldname":"forwarder" },
		{"label": _('<b>Gross Weight</b>'), "fieldtype":"Float", "fieldname":"gross_weight" },
		{"label": _('<b>Total charges (INR)</b>'), "fieldtype":"Currency", "fieldname":"total_charges_in_inr" },
	]

	sql = f"""
		SELECT 
			CQ.forwarder,
			CQ.name,
			CQ.total_charges_in_inr,
			CQ.gross_weight,
			CQ.request_for_quotation_cha
		FROM `tabQuote From CHA` AS CQ
		WHERE CQ.docstatus == 1
	"""
	if filters.get('from_date') and filters.get('to_date'):
		sql += f"AND CQ.transaction_date BETWEEN '{filters.get('from_date')}' AND '{filters.get('to_date')}'"

	if filters.get('company'):
		sql += f"AND CQ.company  = '{filters.get('company')}'"

	if filters.get('request_for_quotation_cha'):
		sql += f"AND CQ.request_for_quotation_cha  = '{filters.get('request_for_quotation_cha')}'"
	data = frappe.db.sql(sql,as_dict = True)
	return columns, data
