// Copyright (c) 2024, Sanskar Technolab and contributors
// For license information, please see license.txt

frappe.query_reports["Landed Cost Custom"] = {
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
			"fieldname": "custom_lcv_created",
			"label": __("LCV Created"),
			"fieldtype": "Select",
			"options": "\nYes\nNo",
			"reqd": 0 
		},
	],
    "onload": function(report) {
        // Apply the inline style to force left alignment for 'Purchase Invoice' column
        $("<style>")
            .prop("type", "text/css")
            .html(`
                .dt-instance-1 .dt-cell--col-7 {
                    text-align: left !important;
                }
            `)
            .appendTo("head");
    }
};