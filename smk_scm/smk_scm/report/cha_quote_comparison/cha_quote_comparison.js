// Copyright (c) 2024, Sanskar Technolab and contributors
// For license information, please see license.txt

frappe.query_reports["CHA Quote Comparison"] = {
	"filters": [
		{
			"fieldname": "company",
			"label": __("Company"),
			"fieldtype": "Link",
			"options": "Company",
			"reqd": 0 
		},
		{
			"fieldname": "from_date",
			"label": __("From Date"),
			"fieldtype": "Date",
			"reqd": 0
		},
		{
			"fieldname": "to_date",
			"label": __("To Date"),
			"fieldtype": "Date",
			"reqd": 0
		},
		{
			"fieldname": "request_for_quotation_cha",
			"label": __("CHA RFQ"),
			"fieldtype": "Link",
			"options":"Request for CHA Quote",
			"reqd": 0
		},
		// {
		// 	"fieldname": "status",
		// 	"label": __("Status"),
		// 	"fieldtype": "Select",
		// 	"options": "\nOpen\nClosed\nPending", // options for the Select field
		// 	"default": "Open" // default value
		// }
	]
};
