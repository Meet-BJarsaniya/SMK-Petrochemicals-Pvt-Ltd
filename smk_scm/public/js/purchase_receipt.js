frappe.ui.form.on('Purchase Receipt', {
    onload: function(frm) {
        if (frm.doc.custom_branch) {
            // Fetch child warehouses based on custom_branch
            frappe.call({
                method: 'smk_scm.public.py.purchase_order.get_child_warehouses',
                args: {
                    branch: frm.doc.custom_branch
                },
                callback: function(response) {
                    if (response.message) {
                        const warehouse_list = response.message;
        
                        // Dynamically set the filter for "set_warehouse"
                        frm.set_query("set_warehouse", () => {
                            return {
                                filters: {
                                    name: ["in", warehouse_list],
                                    is_group: 0,
                                    warehouse_type: 'QC'
                                }
                            };
                        });
                    } else {
                        // Fallback if no data is returned
                        frm.set_query("set_warehouse", () => {
                            return {
                                filters: {
                                    company: frm.doc.company,
                                    is_group: 0,
                                    warehouse_type: 'QC'
                                }
                            };
                        });
                    }
                }
            });
        } else {
            // Fallback if no data is returned
            frm.set_query("set_warehouse", () => {
                return {
                    filters: {
                        company: frm.doc.company,
                        is_group: 0,
                        warehouse_type: 'QC'
                    }
                };
            });
        }
    },
    custom_branch(frm) {
        frm.set_value("set_warehouse", '');
        frm.set_value("rejected_warehouse", '');
    
        const default_query = () => ({
            filters: { company: frm.doc.company, is_group: 0, warehouse_type: 'QC' }
        });
    
        if (!frm.doc.custom_branch) {
            frm.set_query("set_warehouse", default_query);
            frm.set_query("rejected_warehouse", default_query);
            return;
        }
    
        frappe.call({
            method: 'smk_scm.public.py.purchase_order.get_child_warehouses',
            args: { branch: frm.doc.custom_branch },
            callback: function (response) {
                const warehouse_list = response.message || [];
                const dynamic_query = () => ({
                    filters: { name: ["in", warehouse_list], is_group: 0, warehouse_type: 'QC' }
                });
                frm.set_query("set_warehouse", dynamic_query);
                frm.set_query("rejected_warehouse", dynamic_query);
            }
        });
    },    
    custom_quality_inspection(frm) {
        // Iterate through each item in the Purchase Receipt
        frm.doc.items.forEach(item => {
            // Check if a Quality Inspection already exists for this item and reference
            frappe.db.get_value('Quality Inspection', {
                item_code: item.item_code,
                reference_name: frm.doc.name
            }, 'name').then(result => {
                if (result.message && result.message.name) {
                    // If a record is found, show an error message
                    frappe.msgprint({
                        title: __('Duplicate Quality Inspection'),
                        message: __('A Quality Inspection for Item {0} with reference {1} already exists: {2}', 
                                    [item.item_code, frm.doc.name, result.message.name]),
                        indicator: 'red'
                    });
                } else {
                    // Proceed to create a new Quality Inspection document
                    frappe.model.with_doctype('Quality Inspection', () => {
                        let new_doc = frappe.model.get_new_doc('Quality Inspection');
                        new_doc.inspection_type = 'Incoming';
                        new_doc.reference_type = 'Purchase Receipt';
                        new_doc.reference_name = frm.doc.name;

                        // Map item fields to the Quality Inspection document
                        new_doc.item_code = item.item_code;
                        new_doc.item_name = item.item_name;
                        new_doc.sample_size = item.qty;

                        // Save the new document
                        frappe.db.insert(new_doc).then(doc => {
                            frappe.msgprint({
                                title: __('Quality Inspection Created'),
                                message: __('A new Quality Inspection document <a href="/app/quality-inspection/{0}" style="font-weight: bold; color: #007BFF;">{0}</a> has been created for Item {1}', 
                                            [doc.name, item.item_code]),
                                indicator: 'green'
                            });
                        }).catch(err => {
                            frappe.msgprint({
                                title: __('Error'),
                                message: __('Failed to create Quality Inspection for Item {0}: {1}', 
                                            [item.item_code, err.message]),
                                indicator: 'red'
                            });
                        });
                    });
                }
            });
        });
    },
    refresh (frm) {
        let items_array = [];
        // Loop through the items and push the details into the array
        for (let item of frm.doc.items) {
            if (item.quality_inspection) {
                items_array.push({
                    quality_inspection: item.quality_inspection,
                    item_code: item.item_code,
                    qty: item.qty,
                    warehouse: item.warehouse,
                    uom: item.uom,
                    barcode: item.barcode,
                    description: item.description,
                    item_group: item.item_group,
                    gst_hsn_code: item.gst_hsn_code,
                    stock_uom: item.stock_uom,
                    conversion_factor: item.conversion_factor,
                    retain_sample: item.retain_sample,
                    basic_rate: item.basic_rate,
                    item_tax_template: item.item_tax_template,
                    use_serial_batch_fields: item.use_serial_batch_fields,
                    serial_no: item.serial_no,
                    batch_no: item.batch_no,
                    expense_account: item.expense_account,
                    cost_center: item.cost_center,
                    project: item.project,
                    allow_alternative_item: item.allow_alternative_item,
                    base_rate: item.base_rate,
                    qty_as_per_stock_uom: item.qty_as_per_stock_uom,
                });
            }
        }

        if (items_array.length > 0) {
            frm.add_custom_button('Transfer Material', function () {
                // Create a new Stock Entry document
                frappe.model.with_doctype('Stock Entry', () => {
                    let new_doc = frappe.model.get_new_doc('Stock Entry');
                    new_doc.stock_entry_type = 'Material Transfer';

                    // Add item details to the Stock Entry
                    items_array.forEach(item => {
                        let child_item = frappe.model.add_child(new_doc, 'items');
                        child_item.item_code = item.item_code;
                        child_item.qty = item.qty;
                        child_item.s_warehouse = item.warehouse;
                        child_item.uom = item.uom;
                        child_item.barcode = item.barcode;
                        child_item.description = item.description;
                        child_item.item_group = item.item_group;
                        child_item.gst_hsn_code = item.gst_hsn_code;
                        child_item.stock_uom = item.stock_uom;
                        child_item.transfer_qty = item.qty;
                        child_item.conversion_factor = item.conversion_factor;
                        child_item.retain_sample = item.retain_sample;
                        child_item.basic_rate = item.basic_rate;
                        child_item.item_tax_template = item.item_tax_template;
                        child_item.use_serial_batch_fields = item.use_serial_batch_fields;
                        child_item.serial_no = item.serial_no;
                        child_item.batch_no = item.batch_no;
                        child_item.expense_account = item.expense_account;
                        child_item.cost_center = item.cost_center;
                        child_item.project = item.project;
                        child_item.allow_alternative_item = item.allow_alternative_item;
                        child_item.basic_rate = item.base_rate;
                    });

                    // Save and navigate to the new document
                    frappe.set_route('Form', 'Stock Entry', new_doc.name);
                });
            }, 'Create');
        }
    }
// });



// frappe.ui.form.on('Purchase Receipt', {
//     custom_quality_inspection(frm) {
//         // Iterate through each item in the Purchase Receipt
//         frm.doc.items.forEach(item => {
//             // Ensure the 'Quality Inspection' doctype is loaded
//             frappe.model.with_doctype('Quality Inspection', () => {
//                 // Create a new 'Quality Inspection' document
//                 let new_doc = frappe.model.get_new_doc('Quality Inspection');
//                 new_doc.inspection_type = 'Incoming';
//                 new_doc.reference_type = 'Purchase Receipt';
//                 new_doc.reference_name = frm.doc.name;

//                 // Map item fields to the Quality Inspection document
//                 new_doc.item_code = item.item_code;
//                 new_doc.item_name = item.item_name;
//                 new_doc.sample_size = 0;

//                 // Save the document to the database
//                 frappe.db.insert(new_doc).then(doc => {
//                     frappe.msgprint({
//                         title: __('Quality Inspection Created'),
//                         message: __('A new Quality Inspection document {0} has been created for Item {1}', [doc.name, item.item_code]),
//                         indicator: 'green'
//                     });
//                 }).catch(err => {
//                     frappe.msgprint({
//                         title: __('Error'),
//                         message: __('Failed to create Quality Inspection for Item {0}: {1}', [item.item_code, err.message]),
//                         indicator: 'red'
//                     });
//                 });
//             });
//         });
//     }
});
