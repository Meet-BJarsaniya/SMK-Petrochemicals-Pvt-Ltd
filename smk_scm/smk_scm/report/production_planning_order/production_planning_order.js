// Copyright (c) 2024, Sanskar Technolab and contributors
// For license information, please see license.txt

frappe.query_reports["Production Planning Order"] = {
	"filters": [
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
			"fieldname": "item_code",
			"label": __("Item"),
			"fieldtype": "Link",
			"options": "Item",
			"reqd": 0 
		},
		{
			"fieldname": "name",
			"label": __("Production Plan"),
			"fieldtype": "Link",
			"options": "Production Plan",
			"reqd": 0,
			"get_query": function() {
				return {
					"filters": {
						"docstatus": 1
					}
				};
			}
		},
	],
};
