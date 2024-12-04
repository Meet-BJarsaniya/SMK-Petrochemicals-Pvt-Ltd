// Copyright (c) 2024, Sanskar Technolab and contributors
// For license information, please see license.txt

frappe.query_reports["Delivery Note Analysis"] = {
	filters: [
		{
			fieldname: "company",
			label: __("Company"),
			fieldtype: "Link",
			width: "80",
			options: "Company",
			reqd: 1,
			default: frappe.defaults.get_default("company"),
		},
		{
			fieldname: "from_date",
			label: __("From Date"),
			fieldtype: "Date",
			width: "80",
			reqd: 1,
			default: frappe.datetime.add_months(frappe.datetime.get_today(), -1),
		},
		{
			fieldname: "to_date",
			label: __("To Date"),
			fieldtype: "Date",
			width: "80",
			reqd: 1,
			default: frappe.datetime.get_today(),
		},
		{
			fieldname: "sales_order",
			label: __("Sales Order"),
			fieldtype: "MultiSelectList",
			width: "80",
			options: "Sales Order",
			get_data: function (txt) {
				return frappe.db.get_link_options("Sales Order", txt);
			},
			get_query: () => {
				return {
					filters: { docstatus: 1 },
				};
			},
		},
	],

	formatter: function (value, row, column, data, default_formatter) {
		value = default_formatter(value, row, column, data);
		let format_fields = ["delivered_qty", "billed_amount"];

		if (in_list(format_fields, column.fieldname) && data && data[column.fieldname] > 0) {
			value = "<span style='color:green;'>" + value + "</span>";
		}

		if (column.fieldname == "delay" && data && data[column.fieldname] > 0) {
			value = "<span style='color:red;'>" + value + "</span>";
		}

		// Check for work_order_status being "Completed" and apply green color
		if (column.fieldname == "work_order_status" && data && data.work_order_status == "Completed") {
			value = "<span style='color:green;'>" + value + "</span>";
		}
		return value;
	},
};
