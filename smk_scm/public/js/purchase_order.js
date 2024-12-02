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
            if (frm.doc.custom_purchase_type == "CHA"){
                frm.set_value("naming_series", "PO/CHA/.FY./.#####");
                frm.set_df_property('supplier', 'label', `Forwarder`);
                frm.set_query("supplier", function() {
                    return {
                        filters: {
                            supplier_type: "Forwarder"
                        }
                    };
                });
            }
            else {
                frm.set_df_property('supplier', 'label', `Supplier`);
                frm.set_query("supplier", function() {
                    return {
                        filters: {
                            supplier_type: ["!=", "Forwarder"]
                        }
                    };
                });
            }
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
                frm.set_value("naming_series", "PO/LO/.FY./.#####")
                frm.set_df_property('supplier', 'label', `Supplier`);
                frm.set_value("supplier", null);
                frm.set_query("supplier", function() {
                    return {
                        filters: {
                            supplier_type: ["!=", "Forwarder"]
                        }
                    };
                });
            }
            else if (frm.doc.custom_purchase_type == "Import"){
                frm.set_value("naming_series", "PO/IM/.FY./.#####")
                frm.set_df_property('supplier', 'label', `Supplier`);
                frm.set_value("supplier", null);
                frm.set_query("supplier", function() {
                    return {
                        filters: {
                            supplier_type: ["!=", "Forwarder"]
                        }
                    };
                });
            }
            else {
                frm.set_value("naming_series", "PO/CHA/.FY./.#####")
                frm.set_df_property('supplier', 'label', `Forwarder`);
                frm.set_value("supplier", null);
                frm.set_query("supplier", function() {
                    return {
                        filters: {
                            supplier_type: "Forwarder"
                        }
                    };
                });
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
    // after_save: function(frm) {
    on_submit: function(frm) {
        let po_details = `
            <table border="1" cellpadding="5" cellspacing="0">
                <thead>
                    <tr>
                        <th>Item Name</th>
                        <th>Quantity</th>
                        <th>UOM</th>
                        <th>Rate</th>
                        <th>Required By</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
        `;
        frm.doc.items.forEach(item => {
            let descriptionText = item.description.replace(/<\/?p[^>]*>/g, '').trim();
            const formattedRate = item.rate.toLocaleString('en-US', { 
                style: 'currency', 
                currency: frm.doc.currency
            });
            var inputDate = item.schedule_date;
            var parts = inputDate.split("-");
            var year = parts[0];
            var month = parts[1];
            var day = parts[2];
            var formattedDate = day ? `${day}-${month}-${year}` : `${year}`;
            po_details += `
                <tr>
                    <td>${item.item_name}</td>
                    <td>${item.qty}</td>
                    <td>${item.uom}</td>
                    <td>${formattedRate}</td>
                    <td>${formattedDate}</td>
                    <td>${descriptionText}</td>
                </tr>
            `;
        });
        po_details += `
                </tbody>
            </table>
        `;
        let payment_sch_details = `
            <table border="1" cellpadding="5" cellspacing="0">
                <thead>
                    <tr>
                        <th>Payment Term</th>
                        <th>Due Date</th>
                        <th>Invoice Portion (%)</th>
                        <th>Payment Amount (INR)</th>
                    </tr>
                </thead>
                <tbody>
        `;
        frm.doc.payment_schedule.forEach(ps => {
            const formattedRate = format_currency(ps.payment_amount, "INR", 3);
            // const formattedRate = ps.payment_amount.toLocaleString('en-US', { 
            //     style: 'currency', 
            //     currency: frm.doc.currency
            // });
            var inputDate = ps.due_date;
            var parts = inputDate.split("-");
            var year = parts[0];
            var month = parts[1];
            var day = parts[2];
            var formattedDate = day ? `${day}-${month}-${year}` : `${year}`;
            payment_sch_details += `
                <tr>
                    <td>${ps.payment_term}</td>
                    <td>${formattedDate}</td>
                    <td>${ps.invoice_portion}</td>
                    <td>${formattedRate}</td>
                </tr>
            `;
        });
        payment_sch_details += `
                </tbody>
            </table>
        `;
        frappe.call({
            method: 'smk_scm.public.py.purchase_order.send_email',
            args: {
                name: frm.doc.name,
                doctype: frm.doc.doctype,
                company: frm.doc.company,
                supplier: frm.doc.supplier,
                schedule_date: frm.doc.schedule_date,
                acc_id: frm.doc.custom_accounting_team,
                acc_name: frm.doc.custom_accounting_team_name,
                payment_terms_template: frm.doc.payment_terms_template,
                payment_schedule: payment_sch_details,
                logi_id: frm.doc.custom_logistics_team,
                logi_name: frm.doc.custom_logistics_team_name,
                prod_id: frm.doc.custom_production_user || "",
                prod_name: frm.doc.custom_production_user_name || "",
                custom_delivery_terms: frm.doc.custom_delivery_terms,
                custom_delivery_term_description: frm.doc.custom_delivery_term_description || '',
                po_details
            },
            callback: function(response) {
                if (response.message) {
                    frappe.msgprint('Emails sent successfully');
                }
            }
        });
        if (frm.doc.custom_quote_from_cha) {
            frappe.db.set_value('Quote From CHA', frm.doc.custom_quote_from_cha, {
                'any_po_approved': 1
            });
        }
    },
    after_cancel (frm) {
        if (frm.doc.custom_quote_from_cha) {
            frappe.db.set_value('Quote From CHA', frm.doc.custom_quote_from_cha, {
                'any_po_approved': 0
            });
        }
    },
    after_save: function(frm) {
        if (frm.doc.docstatus === 1) {
            frappe.call({
                method: 'smk_scm.public.py.purchase_order.send_schedule_email',
                args: {
                    name: frm.doc.name,
                    doctype: frm.doc.doctype,
                    company: frm.doc.company,
                    supplier: frm.doc.supplier,
                    schedule_date: frm.doc.schedule_date,
                    etd: frm.doc.custom_dispatch_date || "",
                    eta: frm.doc.custom_arrival_date || "",
                    email_subject: frm.doc.custom_email_subject,
                    custom_company_users: frm.doc.custom_company_users
                },
                callback: function(response) {
                    if (response.message) {
                        frappe.msgprint('Emails sent successfully');
                    }
                }
            });
            if (frm.doc.custom_quote_from_cha) {
                frappe.db.set_value('Quote From CHA', frm.doc.custom_quote_from_cha, {
                    'any_po_approved': 1
                });
            }
        }
    },
    // after_save: function(frm) {
    after_workflow_action: function(frm) {
		if (frm.doc.workflow_state === "Approved") {
            let po_details = `
                <table border="1" cellpadding="5" cellspacing="0">
                    <thead>
                        <tr>
                            <th>Item Name</th>
                            <th>Quantity</th>
                            <th>UOM</th>
                            <th>Rate</th>
                            <th>Required By</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            frm.doc.items.forEach(item => {
                let descriptionText = item.description.replace(/<\/?p[^>]*>/g, '').trim();
                const formattedRate = item.rate.toLocaleString('en-US', { 
                    style: 'currency', 
                    currency: frm.doc.currency
                });
                var inputDate = item.schedule_date;
                var parts = inputDate.split("-");
                var year = parts[0];
                var month = parts[1];
                var day = parts[2];
                var formattedDate = day ? `${day}-${month}-${year}` : `${year}`;
                po_details += `
                    <tr>
                        <td>${item.item_name}</td>
                        <td>${item.qty}</td>
                        <td>${item.uom}</td>
                        <td>${formattedRate}</td>
                        <td>${formattedDate}</td>
                        <td>${descriptionText}</td>
                    </tr>
                `;
            });
            po_details += `
                    </tbody>
                </table>
            `;
            let payment_sch_details = `
                <table border="1" cellpadding="5" cellspacing="0">
                    <thead>
                        <tr>
                            <th>Payment Term</th>
                            <th>Due Date</th>
                            <th>Invoice Portion (%)</th>
                            <th>Payment Amount (INR)</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            frm.doc.payment_schedule.forEach(ps => {
                const formattedRate = format_currency(ps.payment_amount, "INR", 3);
                // const formattedRate = ps.payment_amount.toLocaleString('en-US', { 
                //     style: 'currency', 
                //     currency: frm.doc.currency
                // });
                var inputDate = ps.due_date;
                var parts = inputDate.split("-");
                var year = parts[0];
                var month = parts[1];
                var day = parts[2];
                var formattedDate = day ? `${day}-${month}-${year}` : `${year}`;
                payment_sch_details += `
                    <tr>
                        <td>${ps.payment_term}</td>
                        <td>${formattedDate}</td>
                        <td>${ps.invoice_portion}</td>
                        <td>${formattedRate}</td>
                    </tr>
                `;
            });
            payment_sch_details += `
                    </tbody>
                </table>
            `;
            frappe.call({
                method: 'smk_scm.public.py.purchase_order.send_email',
                args: {
                    name: frm.doc.name,
                    doctype: frm.doc.doctype,
                    company: frm.doc.company,
                    supplier: frm.doc.supplier,
                    payment_terms_template: frm.doc.payment_terms_template,
                    payment_schedule: payment_sch_details,
                    custom_delivery_terms: frm.doc.custom_delivery_terms,
                    custom_delivery_term_description: frm.doc.custom_delivery_term_description || '',
                    po_details,
                    custom_company_users: frm.doc.custom_company_users,
                    etd: frm.doc.custom_dispatch_date || "",
                    eta: frm.doc.custom_arrival_date || "",
                    email_subject: frm.doc.custom_email_subject
                },
                callback: function(response) {
                    if (response.message) {
                        frappe.msgprint('Emails sent successfully');
                    }
                }
            });
            if (frm.doc.custom_quote_from_cha) {
                frappe.db.set_value('Quote From CHA', frm.doc.custom_quote_from_cha, {
                    'any_po_approved': 1
                });
            }
        }
    },
    refresh: function(frm) {
        update_terms_options(frm);
        if (!frm.is_new()) {
            frm.set_df_property('custom_purchase_type', 'read_only', 1);
        }
        if (frm.is_new()) {
            if (frm.doc.custom_purchase_type == "CHA"){
                frm.set_value("naming_series", "PO/CHA/.FY./.#####");
                frm.set_df_property('supplier', 'label', `Forwarder`);
                frm.set_query("supplier", function() {
                    return {
                        filters: {
                            supplier_type: "Forwarder"
                        }
                    };
                });
            }
            else {
                frm.set_df_property('supplier', 'label', `Supplier`);
                frm.set_query("supplier", function() {
                    return {
                        filters: {
                            supplier_type: ["!=", "Forwarder"]
                        }
                    };
                });
                if (frm.doc.custom_purchase_type == "Local"){
                    frm.set_value("naming_series", "PO/LO/.FY./.#####");
                } else {
                    frm.set_value("naming_series", "PO/IM/.FY./.#####");
                }
            }
        }
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
                        qc_item.grn_qty = item.received_qty;
                        qc_item.remaining_po_qty = item.qty - item.custom_qc_qty;
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