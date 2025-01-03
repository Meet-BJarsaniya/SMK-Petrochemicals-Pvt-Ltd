frappe.ui.form.on('Quality Inspection', {
    validate: function (frm) {
        // Double-check during validation to prevent saving by unauthorized users
        if (!(frappe.user_roles.includes("R&D User") || frappe.user_roles.includes("R&D Manager")) && frm.doc.inspection_type == 'R&D') {
            frappe.throw(__("You are not authorized to view or modify this R&D Quality Inspection."));
        }
    },
    refresh (frm) {
        // Check if the user is NOT an R&D Manager and the Quality Inspection is R&D-related
        if (!(frappe.user_roles.includes("R&D User") || frappe.user_roles.includes("R&D Manager")) && frm.doc.inspection_type == 'R&D') {
            frappe.msgprint({
                title: __("Access Restricted"),
                message: __("You are not authorized to view this R&D Quality Inspection."),
                indicator: "red"
            });
            // Prevent loading the form and redirect
            frappe.set_route("List", "Quality Inspection");
        }
    },
    on_submit(frm) {
        if (frm.doc.reference_type == 'Purchase Receipt') {
            // Link QI to the Purchase Receipt
            frappe.db.get_doc('Purchase Receipt', frm.doc.reference_name).then(purchase_receipt => {
                let pr_item = purchase_receipt.items.find(d => d.item_code === frm.doc.item_code);
                if (pr_item) {
                    frappe.db.set_value('Purchase Receipt', frm.doc.reference_name, 'custom_qc_verified', 1);
                    pr_item.quality_inspection = frm.doc.name; // Link Quality Inspection
                }
            });
        }
    }
});
