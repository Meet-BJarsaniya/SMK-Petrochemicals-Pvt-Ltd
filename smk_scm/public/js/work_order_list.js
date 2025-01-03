frappe.listview_settings["Work Order"] = {
	add_fields: [
		"bom_no",
		"status",
		"sales_order",
		"qty",
		"produced_qty",
		"expected_delivery_date",
		"planned_start_date",
		"planned_end_date",
	],
	filters: [["status", "!=", "Stopped"]],
	get_indicator: function (doc) {
		if (doc.status === "Submitted") {
			return [__("Not Started"), "orange", "status,=,Submitted"];
		} else if (doc.status === "Released") {
			return ["Released", "blue", "status,=,Released"];
		} else {
			return [
				__(doc.status),
				{
					Draft: "red",
					Stopped: "red",
					"Not Started": "red",
					"In Process": "orange",
					Completed: "green",
					Cancelled: "gray",
				}[doc.status],
				"status,=," + doc.status,
			];
		}
	},
    onload: function(listview) {
		frappe.call({
            method: "smk_scm.public.py.work_order.update_work_order_status",
			callback: function() {
				listview.refresh();
			}
		});
		// Check if the user has no "R&D Manager" role
		if (!(frappe.user_roles.includes("R&D User") || frappe.user_roles.includes("R&D Manager"))) {
            listview.filter_area.add([
                ['Work Order', 'custom_is_rd', '==', '0']
            ]);
        }		
    }
};
