frappe.ui.form.on('Quality Inspection', {
    validate (frm) {
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
    on_submit (frm) {
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
        if (frm.doc.reference_type === 'Delivery Note' && frm.doc.inspection_type === 'Outgoing') {
            // Fetch the Certificate of Analysis linked to the Delivery Note and Item Code
            frappe.db.get_list('Certificate of Analysis', {
                filters: {
                    delivery_note: frm.doc.reference_name,
                    item: frm.doc.item_code,
                    final_quality_inspection: ['=', ''] // Ensure CoA doesn't already have a linked QI
                },
                fields: ['name'] // Fetch only the name of the CoA
            }).then(coa_list => {
                if (coa_list && coa_list.length > 0) {
                    const coa_name = coa_list[0].name; // Take the first matching CoA
        
                    // Update the CoA with the current QI's name
                    frappe.db.set_value('Certificate of Analysis', coa_name, 'final_quality_inspection', frm.doc.name)
                        .then(() => {
                            frappe.msgprint({
                                title: __('Success'),
                                message: __('Linked Quality Inspection {0} to Certificate of Analysis {1}', [frm.doc.name, coa_name]),
                                indicator: 'green'
                            });
                        });
                } else {
                    frappe.msgprint({
                        title: __('No Match Found'),
                        message: __('No Certificate of Analysis found for Delivery Note {0} and Item {1} with no final Quality Inspection.', [frm.doc.reference_name, frm.doc.item_code]),
                        indicator: 'orange'
                    });
                }
            });
        }
    },
    quality_inspection_template (frm) {
        if (frm.doc.quality_inspection_template) {
            frappe.call({
                method: 'frappe.client.get',
                args: {
                    doctype: 'Quality Inspection Template',
                    name: frm.doc.quality_inspection_template
                },
                callback: (r) => {
                    parameters = r.message.item_quality_inspection_parameter
                    parameters.forEach(parameter => {
                        frm.doc.readings.forEach(reading => {
                            if (reading.specification == parameter.specification) {
                                reading.custom_unit = parameter.custom_unit;
                                reading.custom_test_method = parameter.custom_test_method;
                            }
                        });
                    });
                    frm.refresh_field('readings');
                }
            });
        }
    },
});
