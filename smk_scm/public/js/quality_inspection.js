frappe.ui.form.on('Quality Inspection', {
    after_save(frm) {
        if (frm.doc.reference_type == 'Purchase Receipt') {
            // Fetch additional data from the Item Master   && frm.doc.status == 'Accepted'
            frappe.db.get_doc('Item', frm.doc.item_code).then(item_doc => {
                // Create a new Stock Entry document
                frappe.model.with_doctype('Stock Entry', () => {
                    let new_doc = frappe.model.get_new_doc('Stock Entry');
                    new_doc.stock_entry_type = 'Material Transfer';

                    // Add item details to the Stock Entry
                    let items = frappe.model.add_child(new_doc, 'items');
                    items.item_code = frm.doc.item_code;
                    items.qty = frm.doc.sample_size;
                    items.transfer_qty = frm.doc.sample_size;
                    items.conversion_factor = 1;
                    items.item_group = item_doc.item_group;
                    items.gst_hsn_code = item_doc.gst_hsn_code;
                    items.uom = item_doc.stock_uom;
                    items.stock_uom = item_doc.stock_uom;
                    items.basic_rate = item_doc.valuation_rate;
                    items.description = item_doc.description;
                    items.s_warehouse = 'QC Warehouse - SPIPL';
                    if (frm.doc.status == 'Accepted') {
                        items.t_warehouse = 'Stores - SPIPL';
                    }
                    if (frm.doc.status == 'Rejected') {
                        items.t_warehouse = 'Rejected goods W/H - SPIPL';
                    }
                    
                    // Refresh the field to show updated data
                    frappe.model.set_value(new_doc.doctype, new_doc.name, 'items', new_doc.items);

                    // Save the new document and navigate to it
                    frappe.set_route('Form', 'Stock Entry', new_doc.name);
                });
            }).catch(err => {
                frappe.msgprint({
                    title: __('Error'),
                    message: __('Failed to fetch data from Item Master for Item {0}: {1}', [frm.doc.item_code, err.message]),
                    indicator: 'red'
                });
            });
        }
    }
});
