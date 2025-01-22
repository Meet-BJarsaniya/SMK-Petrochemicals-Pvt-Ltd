frappe.ui.form.on('Job Card', {
    // employee: function(frm) {
    //     frm.set_value("custom_no_of_workers", frm.doc.employee.length);
    // },
    before_submit: async function (frm) {
        if (!frappe.user_roles.includes("R&D Manager") && frm.doc.custom_is_rd) {
            frappe.throw({
                title: __("Access Restricted"),
                message: __("You are not authorized to Submit this R&D Job Card."),
                indicator: "red"
            });
        }
        // Ensure Quality Inspection is linked
        if (!frm.doc.quality_inspection) {
            frappe.throw(__('Please select a Quality Inspection before submitting.'));
        }
        // Fetch the status of the linked Quality Inspection
        const { message } = await frappe.db.get_value('Quality Inspection', frm.doc.quality_inspection, ['status', 'docstatus']);
        const status = message?.status;
        const docstatus = message?.docstatus;

        // Validate both status and docstatus
        if (status !== 'Accepted' || docstatus !== 1) {
            frappe.throw(__('The selected Quality Inspection is not accepted. Please ensure it is accepted before submitting.'));
        }
    },
    validate: function (frm) {
        // Double-check during validation to prevent saving by unauthorized users
        if (!(frappe.user_roles.includes("R&D User") || frappe.user_roles.includes("R&D Manager")) && frm.doc.custom_is_rd) {
            frappe.throw(__("You are not authorized to view or modify this R&D Job Card."));
        }
    },
    refresh (frm) {
        // Check if the user is NOT an R&D Manager and the Job Card is R&D-related
        if (!(frappe.user_roles.includes("R&D User") || frappe.user_roles.includes("R&D Manager")) && frm.doc.custom_is_rd) {
            frappe.msgprint({
                title: __("Access Restricted"),
                message: __("You are not authorized to view this R&D Job Card."),
                indicator: "red"
            });
            // Prevent loading the form and redirect
            frappe.set_route("List", "Job Card");
        }
        if (!frappe.user_roles.includes("R&D Manager") && frm.doc.custom_is_rd && frm.doc.docstatus == 1) {
            frappe.msgprint({
                title: __("Access Restricted"),
                message: __("You are not authorized to view this R&D Job Card."),
                indicator: "red"
            });
            frappe.set_route("List", "Job Card");
        }
        if (frm.doc.docstatus == 0 && !frm.is_new()) {
            frappe.db.get_value('Quality Inspection', { name: frm.doc.quality_inspection }, 'docstatus')
                .then(response => {
                    const docstatus = response.message?.docstatus;
                    console.log(docstatus)    
                    if (docstatus === 1 || !frm.doc.quality_inspection) {
                        frm.add_custom_button('Create QC', () => {
                            // Proceed to create a new Quality Inspection document
                            frappe.model.with_doctype('Quality Inspection', () => {
                                let new_doc = frappe.model.get_new_doc('Quality Inspection');
                                new_doc.inspection_type = 'In Process';
                                new_doc.reference_type = 'Job Card';
                                new_doc.reference_name = frm.doc.name;

                                // Map item fields to the Quality Inspection document
                                new_doc.item_code = frm.doc.production_item;
                                // new_doc.item_name = item.item_name;
                                new_doc.sample_size = frm.doc.for_quantity;

                                // Save the new document
                                frappe.db.insert(new_doc).then(doc => {
                                    frappe.msgprint({
                                        title: __('Quality Inspection Created'),
                                        message: __('A new Quality Inspection document <a href="/app/quality-inspection/{0}" style="font-weight: bold; color: #007BFF;">{0}</a> has been created for Item {1}', 
                                                    [doc.name, new_doc.item_code]),
                                        indicator: 'green'
                                    });
                                    frm.set_value('quality_inspection', doc.name)
                                    frm.save()
                                }).catch(err => {
                                    frappe.msgprint({
                                        title: __('Error'),
                                        message: __('Failed to create Quality Inspection for Item {0}: {1}', 
                                                    [item.item_code, err.message]),
                                        indicator: 'red'
                                    });
                                });
                            });
                        })
                    }
                });
        }
    },
});

frappe.ui.form.on("Job Card Item", {
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