frappe.ui.form.on('Request for Quotation', {
    on_submit(frm) {
        let rfq_details = `
            <table border="1" cellpadding="5" cellspacing="0">
                <thead>
                    <tr>
                        <th>Item Name</th>
                        <th>Quantity</th>
                        <th>UOM</th>
                        <th>Required By</th>
                    </tr>
                </thead>
                <tbody>
        `;
        frm.doc.items.forEach(item => {
            var inputDate = item.schedule_date;
            var parts = inputDate.split("-");
            var year = parts[0];
            var month = parts[1];
            var day = parts[2];
            var formattedDate = day ? `${day}-${month}-${year}` : `${year}`;
            rfq_details += `
                <tr>
                    <td>${item.item_name}</td>
                    <td>${item.qty}</td>
                    <td>${item.uom}</td>
                    <td>${formattedDate}</td>
                </tr>
            `;
        });
        rfq_details += `
                </tbody>
            </table>
        `;

        frm.doc.suppliers.forEach(supplier => {
            frappe.call({
                method: 'smk_scm.public.py.request_for_quotation.send_email',
                args: {
                    name: frm.doc.name,
                    company: frm.doc.company,
                    recipient_id: supplier.email_id,
                    recipient: supplier.supplier,
                    rfq_details
                },
                callback: function(response) {
                    if (response.message) {
                        frappe.msgprint('An Email sent successfully');
                    }
                }
            });
        });
    }
});