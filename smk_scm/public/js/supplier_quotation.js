frappe.ui.form.on('Supplier Quotation', {
    after_save: function(frm) {
        if (frm.doc.custom_approved_for_purchase_order) {
            let rfq_set = new Set();
            frm.doc.items.forEach(item => {
                rfq_set.add(item.request_for_quotation);
            });
            
            // Function to get owners of RFQs
            const get_rfq_owners = (rfq_set) => {
                frappe.call({
                    method: 'frappe.client.get_list',
                    args: {
                        doctype: 'Request for Quotation',
                        filters: {
                            name: ['in', Array.from(rfq_set)]
                        },
                        fields: ['name', 'owner']
                    },
                    callback: function(response) {
                        if (response.message) {
                            let rfq_owners = response.message;
                            let owners = new Set();
                            rfq_owners.forEach(rfq_owner => {
                                owners.add(rfq_owner.owner);
                            });

                            // Convert the Set to an Array for the server call
                            let owners_array = Array.from(owners);
                            let supplier_quotation_id = frm.doc.name;
                            let supplier_quotation_details = `
                                Supplier: ${frm.doc.supplier}<br>
                                Total: ${frm.doc.total} ${frm.doc.currency}<br>
                            `;
                            // frm.doc.items.forEach(item => {
                            //     supplier_quotation_details += `
                            //         - ${item.item_name}: ${item.qty} ${item.uom} @ ${item.rate}<br>
                            //     `;
                            // });
                            supplier_quotation_details += `
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
                                    owners_list: JSON.stringify(owners_array),
                                    supplier_quotation_id: supplier_quotation_id,
                                    supplier_quotation_details: supplier_quotation_details,
                                    company: frm.doc.company
                                },
                                callback: function(response) {
                                    if (response.message) {
                                        frappe.msgprint('Emails sent successfully');
                                    }
                                }
                            });
                        }
                    }
                });
            };
            // Fetch owners for the RFQs
            get_rfq_owners(rfq_set);
        }
    },
});