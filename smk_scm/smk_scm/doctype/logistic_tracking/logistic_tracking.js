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
});
