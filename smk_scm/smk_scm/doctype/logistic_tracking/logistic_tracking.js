frappe.ui.form.on("Logistic Tracking", {
    type_of_format(frm) {
        // Clear existing items in items child table
        frm.clear_table("items");
        frm.refresh_field("items");
        if (frm.is_new()) {
            if (frm.doc.type_of_format == "Import") {
                frm.set_value("naming_series", "LT/IM/.FY./.###");
            } else if (frm.doc.type_of_format == "Export") {
                frm.set_value("naming_series", "LT/EX/.FY./.###");
            }
        }
    },

    onload(frm) {
        // Function to fetch document list based on filters
        const fetch_order_list = (doctype, filter_field, field_name) => {
            return frappe.call({
                method: "frappe.client.get_list",
                args: {
                    doctype: doctype,
                    filters: { "type_of_format": filter_field },
                    fields: [field_name]
                }
            });
        };

        // Fetch Purchase Order numbers for 'Import' type_of_format
        fetch_order_list("Logistic Tracking", "Import", "purchase_order_no").then(response => {
            if (response && response.message) {
                let purchase_order_list = response.message.map(po => po.purchase_order_no);
                // Update the purchase_order_no field to ensure it is not in the fetched list
                frm.set_query("purchase_order_no", function() {
                    return {
                        filters: {
                            name: ["not in", purchase_order_list],
                            docstatus: 1
                        }
                    };
                });
            }
        });

        // Fetch Sales Order numbers for 'Export' type_of_format
        fetch_order_list("Logistic Tracking", "Export", "sales_order_no").then(response => {
            if (response && response.message) {
                let sales_order_list = response.message.map(so => so.sales_order_no);
                // Update the sales_order_no field to ensure it is not in the fetched list
                frm.set_query("sales_order_no", function() {
                    return {
                        filters: {
                            name: ["not in", sales_order_list],
                            docstatus: 1
                        }
                    };
                });
            }
        });
    },
    purchase_order_no(frm) {
        frappe.db.get_doc("Purchase Order", frm.doc.purchase_order_no)
            .then((po_doc) => {
                // Clear existing items in items child table
                frm.clear_table("items");
                // Loop through Purchase Order items and add them to items
                po_doc.items.forEach((item) => {
                    let row = frm.add_child("items");
                    row.item_code = item.item_code;
                    row.item_name = item.item_name;
                    row.qty = item.qty;
                    row.rate = item.rate;
                    row.amount = item.amount;
                    row.description = item.description;
                });
                // Refresh the field to update the UI
                frm.refresh_field("items");
            });
    },
    sales_order_no(frm) {
        frappe.db.get_doc("Sales Order", frm.doc.sales_order_no)
            .then((so_doc) => {
                frm.clear_table("items");
                so_doc.items.forEach((item) => {
                    let row = frm.add_child("items");
                    row.item_code = item.item_code;
                    row.item_name = item.item_name;
                    row.qty = item.qty;
                    row.rate = item.rate;
                    row.amount = item.amount;
                    row.description = item.description;
                });
                frm.refresh_field("items");
            });
    },
});
