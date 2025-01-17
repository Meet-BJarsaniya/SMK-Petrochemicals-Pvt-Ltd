frappe.ui.form.on('BOM', {
    onload: function (frm) {        
        const allowed_roles = ['Product Manager', 'R&D Manager'];
        if (!frappe.user_roles.some(role => allowed_roles.includes(role))) {
            console.log('o')
            // Hide the specified fields
            frm.set_df_property('operating_cost', 'hidden', 1);
            frm.set_df_property('raw_material_cost', 'hidden', 1);
            frm.set_df_property('scrap_material_cost', 'hidden', 1);
            frm.set_df_property('total_cost', 'hidden', 1);
            frm.set_df_property('custom_total_future_cost', 'hidden', 1);
            frm.set_df_property('custom_total_future_cost', 'hidden', 1);
            frm.fields_dict['items'].grid.set_column_disp('item_code', false); // Hide item_code in BOM Item child table
        } else {
            // Make sure the fields are visible for allowed roles
            frm.set_df_property('operating_cost', 'hidden', 0);
            frm.set_df_property('raw_material_cost', 'hidden', 0);
            frm.set_df_property('scrap_material_cost', 'hidden', 0);
            frm.set_df_property('total_cost', 'hidden', 0);
            frm.set_df_property('custom_total_future_cost', 'hidden', 0);
            frm.set_df_property('custom_total_future_cost', 'hidden', 0);
        }
        frm.has_table_access = frappe.user_roles.some(role => allowed_roles.includes(role));
    },
    items_render: function (frm) {
        console.log('has_table_access')
    //     // console.log(frm.has_table_access)
    //     // if (!frm.has_table_access) {
    //     //     frappe.msgprint(__('You do not have permission to view the details of this table row.'));
            
    //     //     // Hide the row rendering for unauthorized users
    //     //     const row = locals[cdt][cdn];
    //     //     if (row) {
    //     //         frm.fields_dict['items'].grid.toggle_row(row.idx, false); // Hides the row
    //     //     }
    //     // }
    },
    validate: function (frm) {
        // Double-check during validation to prevent saving by unauthorized users
        if (!(frappe.user_roles.includes("R&D User") || frappe.user_roles.includes("R&D Manager")) && frm.doc.custom_is_rd) {
            frappe.throw(__("You are not authorized to view or modify this R&D BOM."));
        }
    },
    refresh (frm) {        
        const allowed_roles = ['Product Manager', 'R&D Manager'];
        if (!frappe.user_roles.some(role => allowed_roles.includes(role))) {
            console.log('r')
            // Hide the specified fields
            frm.set_df_property('operating_cost', 'hidden', 1);
            frm.set_df_property('raw_material_cost', 'hidden', 1);
            frm.set_df_property('scrap_material_cost', 'hidden', 1);
            frm.set_df_property('total_cost', 'hidden', 1);
            frm.set_df_property('custom_total_future_cost', 'hidden', 1);
            frm.set_df_property('custom_total_future_cost', 'hidden', 1);
            frm.fields_dict['items'].grid.set_column_disp('item_code', false); // Hide item_code in BOM Item child table
        } else {
            // Make sure the fields are visible for allowed roles
            frm.set_df_property('operating_cost', 'hidden', 0);
            frm.set_df_property('raw_material_cost', 'hidden', 0);
            frm.set_df_property('scrap_material_cost', 'hidden', 0);
            frm.set_df_property('total_cost', 'hidden', 0);
            frm.set_df_property('custom_total_future_cost', 'hidden', 0);
            frm.set_df_property('custom_total_future_cost', 'hidden', 0);
        }
        frm.has_table_access = frappe.user_roles.some(role => allowed_roles.includes(role));



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
    refresh: function(frm) {
            console.log('item ref')
        frm.toggle_display('item_code', false); // Hide item_code in the BOM Item form
    },
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
    form_render: function (frm, cdt, cdn) {
        if (!frm.has_table_access) {
            console.log('item frm render')
            frm.fields_dict['items'].grid.set_column_disp('item_code', false); // Hide item_code in BOM Item child table
        }
    }
});