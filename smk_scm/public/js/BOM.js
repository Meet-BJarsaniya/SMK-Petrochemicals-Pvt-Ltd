frappe.ui.form.on('BOM', {
    validate: function (frm) {
        // Double-check during validation to prevent saving by unauthorized users
        if (!(frappe.user_roles.includes("R&D User") || frappe.user_roles.includes("R&D Manager")) && frm.doc.custom_is_rd) {
            frappe.throw(__("You are not authorized to view or modify this R&D BOM."));
        }
    },
    refresh (frm) {
        // Check if the user is NOT an R&D Manager and the BOM is R&D-related
        if (!(frappe.user_roles.includes("R&D User") || frappe.user_roles.includes("R&D Manager")) && frm.doc.custom_is_rd) {
            frappe.msgprint({
                title: __("Access Restricted"),
                message: __("You are not authorized to view this R&D BOM."),
                indicator: "red"
            });
            // Prevent loading the form and redirect
            frappe.set_route("List", "BOM");
        }
        if (!frappe.user_roles.includes("R&D Manager") && frm.doc.custom_is_rd && frm.doc.docstatus == 1) {
            frappe.msgprint({
                title: __("Access Restricted"),
                message: __("You are not authorized to view this R&D BOM."),
                indicator: "red"
            });
            frappe.set_route("List", "BOM");
        }
    },
    before_submit: function(frm) {
        if (!frappe.user_roles.includes("R&D Manager") && frm.doc.custom_is_rd) {
            frappe.throw({
                title: __("Access Restricted"),
                message: __("You are not authorized to Submit this R&D BOM."),
                indicator: "red"
            });
        }
    },
});

frappe.ui.form.on("BOM Item", {
    custom_plant_code: function(frm, cdt, cdn) {
        const child_row = locals[cdt][cdn]; // Get the current row
        if (child_row.custom_plant_code) {
            frappe.call({
                method: "frappe.client.get_list",
                args: {
                    doctype: "Item",
                    filters: {
                        custom_plant_code: child_row.custom_plant_code
                    },
                    fields: ["name"]
                },
                callback: function(r) {
                    if (r.message && r.message.length > 0) {
                        // Assuming there's only one matching item
                        const item_name = r.message[0].name;
                        // Set the item in the current row of the child table
                        frappe.model.set_value(cdt, cdn, "item_code", item_name);
                        frappe.msgprint(__('Item found for the plant code.'));
                    }
                }
            });
        }
    },
});