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