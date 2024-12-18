// Copyright (c) 2024, Sanskar Technolab and contributors
// For license information, please see license.txt

frappe.query_reports["Docs to be Atteched"] = {
	"filters": [
		{
			"fieldname": "document_type",
			"label": "Document Type",
			"fieldtype": "Select",
			"options": "\nSales Invoice\nPick List\nDelivery Note",
			// \nE-Way Bill",
			"default": "Sales Invoice",
		}
	]
};