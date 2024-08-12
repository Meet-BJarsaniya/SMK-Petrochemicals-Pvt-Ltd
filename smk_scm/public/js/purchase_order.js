frappe.ui.form.on('Purchase Order', {
    onload: function(frm) {
        setTimeout(function() {
            frm.doc.items.forEach(item => {
                if (item.supplier_quotation && item.supplier_quotation.startsWith('SQ')) {
                    item.custom_supplier_quotation_for_new_item = item.supplier_quotation;
                    item.supplier_quotation = '';
                    item.conversion_factor = 0.0;
                }
            });
        }, 100);
    },
    supplier: function(frm) {
        setTimeout(function() {
            // frm.set_df_property('naming_series', 'hidden', 1);
        }, 1);
    },
	custom_purchase_type(frm) {
        if (frm.is_new()){
            // frm.set_df_property('naming_series', 'hidden', 1)
            if (frm.doc.custom_purchase_type == "Local"){
                frm.set_value("naming_series", "SMK/LO/PO/.FY./.###")
            }
            else if (frm.doc.custom_purchase_type == "Import"){
                frm.set_value("naming_series", "SMK/IM/PO/.FY./.###")
            }
            // frm.set_df_property('naming_series', 'hidden', 1)
        }
        update_terms_options(frm);
	},
    before_save: function(frm) {
        frm.doc.items.forEach(item => {
            if (item.supplier_quotation && item.supplier_quotation.startsWith('SQ')) {
                item.custom_supplier_quotation_for_new_item = item.supplier_quotation;
                item.supplier_quotation = '';
                item.conversion_factor = 0.0;
            }
        });
    },
    on_submit: function(frm) {
        frappe.call({
            method: 'smk_scm.public.py.purchase_order.send_email',
            args: {
                name: frm.doc.name,
                company: frm.doc.company
            },
            callback: function(response) {
                if (response.message) {
                    frappe.msgprint('Emails sent successfully');
                }
            }
        });
    },
    refresh: function(frm) {
        update_terms_options(frm);
		if (frm.doc.docstatus === 1) {
            frm.add_custom_button('QC Warehouse Entry', () => {
                // Create a new QC Warehouse Entry document
                frappe.model.with_doctype('QC Warehouse Entry', () => {
                    let new_doc = frappe.model.get_new_doc('QC Warehouse Entry');
                    new_doc.company = frm.doc.company;
                    new_doc.supplier = frm.doc.supplier;
                    new_doc.purchase_order = frm.doc.name;
                    frm.doc.items.forEach(item => {
                        let qc_item = frappe.model.add_child(new_doc, 'qc_item');
                        qc_item.item_code = item.item_code;
                        qc_item.item_name = item.item_name;
                        qc_item.item_group = item.item_group;
                        qc_item.uom = item.uom;
                        qc_item.purchase_order_qty = item.qty;
                        qc_item.received_qty = "0";
                        qc_item.pending_qty = item.qty;
                        qc_item.balanced_qty = "0";
                    });
            
                    // Refresh the field to show updated data
                    frappe.model.set_value(new_doc.doctype, new_doc.name, 'qc_item', new_doc.qc_item);
            
                    // Save the new document and navigate to it
                    // frappe.db.insert(new_doc).then(doc => {
                        frappe.set_route('Form', 'QC Warehouse Entry', new_doc.name);
                    // });
                });
            }, 'Create');            
        }
    },
});

function update_terms_options(frm) {
    if (frm.doc.custom_purchase_type == "Import") {
        frm.set_df_property('custom_delivery_terms', 'options', ['Ex-work', 'Delivered', 'Free Carrier', 'Free On Board']);
        frm.set_query('payment_terms_template', function() {
            return {};
        });
    } else {
        frm.set_df_property('custom_delivery_terms', 'options', ['Ex-work', 'Delivered']);
        frm.set_query('payment_terms_template', function() {
            return {
                filters: {
                    'name': ['in', ['Open Credit' , 'Advance Payment', 'Part Advance / Part Credit', 'Against Document']]
                }
            };
        });
    }
}