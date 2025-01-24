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
                    // Update custom field and link the Quality Inspection
                    frappe.db.set_value('Purchase Receipt', frm.doc.reference_name, 'custom_qc_verified', 1);
                    pr_item.quality_inspection = frm.doc.name;
                    // Fetch the parent warehouse to determine t_warehouse
                    frappe.db.get_value('Warehouse', pr_item.warehouse, 'parent_warehouse').then(parent_warehouse_result => {
                        let parent_warehouse = parent_warehouse_result.message.parent_warehouse;
                        // Fetch a warehouse with the same parent and warehouse_type = 'Raw Material'
                        frappe.db.get_list('Warehouse', {
                            filters: {
                                parent_warehouse: parent_warehouse,
                                warehouse_type: 'Raw Material'
                            },
                            fields: ['name']
                        }).then(warehouse_results => {
                            if (warehouse_results.length > 0) {
                                let target_warehouse = warehouse_results[0].name;
                                // Create a Stock Entry for the item
                                frappe.call({
                                    method: "frappe.client.insert",
                                    args: {
                                        doc: {
                                            doctype: "Stock Entry",
                                            stock_entry_type: "Material Transfer",
                                            items: [
                                                {
                                                    item_code: pr_item.item_code,
                                                    qty: pr_item.qty, // Adjust the quantity as per the Purchase Receipt item
                                                    s_warehouse: pr_item.warehouse,
                                                    t_warehouse: target_warehouse, // Dynamically set
                                                    reference_purchase_receipt: frm.doc.reference_name,
                                                    expense_account: pr_item.expense_account,
                                                    cost_center: pr_item.cost_center,
                                                    serial_and_batch_bundle: pr_item.serial_and_batch_bundle,
                                                    use_serial_batch_fields: pr_item.use_serial_batch_fields,
                                                    batch_no: pr_item.batch_no,
                                                    serial_no: pr_item.serial_no,
                                                }
                                            ],
                                            purpose: "Material Transfer",
                                            purchase_receipt: frm.doc.reference_name, // Add reference if needed
                                            remarks: `Stock Entry created for Quality Inspection ${frm.doc.name}`,
                                        }
                                    },
                                    callback: function(response) {
                                        if (response.message) {
                                            frappe.msgprint({
                                                title: __('Success'),
                                                message: __('Stock Entry <a href="/app/stock-entry/{0}" style="font-weight: bold; color: #007BFF;">{0}</a> created successfully.', [response.message.name]),
                                                indicator: 'green'
                                            });
                                        }
                                    }
                                });
                            } else {
                                frappe.msgprint({
                                    title: __('Error'),
                                    message: __('No target warehouse found with warehouse_type = "Raw Material" under parent {0}.', [parent_warehouse]),
                                    indicator: 'red'
                                });
                            }
                        });
                    });
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
    custom_plant_code: function(frm) {
        if (frm.doc.custom_plant_code) {
            frappe.call({
                method: "frappe.client.get_list",
                args: {
                    doctype: "Item",
                    filters: {
                        custom_plant_code: frm.doc.custom_plant_code
                    },
                    fields: ["name"]
                },
                callback: function(r) {
                    if (r.message && r.message.length > 0) {
                        // Assuming there's only one matching item
                        const item_name = r.message[0].name;
                        // Set the item in the current row of the child table
                        frm.set_value("item_code", item_name);
                        frappe.msgprint(__('Item found for the plant code.'));
                    }
                }
            });
        }
    },
});