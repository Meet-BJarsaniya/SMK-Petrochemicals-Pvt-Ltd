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
                    console.log(response)
                    if (response.message) {
                        const warehouse_list = response.message;
        
                        // Dynamically set the filter for "set_warehouse"
                        frm.set_query("set_warehouse", () => {
                            return {
                                filters: {
                                    name: ["in", warehouse_list],
                                    is_group: 0
                                }
                            };
                        });
                    } else {
                        // Fallback if no data is returned
                        frm.set_query("set_warehouse", () => {
                            return {
                                filters: {
                                    company: frm.doc.company,
                                    is_group: 0
                                }
                            };
                        });
                    }
                }
            });
        }
    },
    custom_branch(frm) {
        frm.set_value("set_warehouse", '');
        frm.set_value("rejected_warehouse", '');
    
        const default_query = () => ({
            filters: { company: frm.doc.company, is_group: 0 }
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
                    filters: { name: ["in", warehouse_list], is_group: 0 }
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
