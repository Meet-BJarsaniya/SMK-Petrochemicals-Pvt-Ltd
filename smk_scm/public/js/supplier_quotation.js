frappe.ui.form.on('Supplier Quotation', {
    after_save: function(frm) {
        if (frm.doc.custom_approved_for_purchase_order) {
            let supplier_quotation_id = frm.doc.name;
            let supplier_quotation_details = `
                <table border="1" cellpadding="5" cellspacing="0">
                    <thead>
                        <tr>
                            <th>Item Name</th>
                            <th>Quantity</th>
                            <th>UOM</th>
                            <th>Rate</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            frm.doc.items.forEach(item => {
                supplier_quotation_details += `
                    <tr>
                        <td>${item.item_name}</td>
                        <td>${item.qty}</td>
                        <td>${item.uom}</td>
                        <td>${item.rate}</td>
                    </tr>
                `;
            });
            supplier_quotation_details += `
                    </tbody>
                </table>
            `;

            // Call the server-side method to send emails
            frappe.call({
                method: 'smk_scm.public.py.supplier_quotation.send_email_to_owners',
                args: {
                    recipient_id: frm.doc.owner,
                    supplier_quotation_id: supplier_quotation_id,
                    supplier_quotation_details: supplier_quotation_details,
                    company: frm.doc.company
                },
                callback: function(response) {
                    if (response.message) {
                        frappe.msgprint('An Email sent successfully');
                    }
                }
            });
        }
    },
});