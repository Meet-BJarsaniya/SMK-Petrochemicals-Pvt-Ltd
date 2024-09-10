frappe.ui.form.on("Material Request", {
    on_submit(frm) {
        let mr_details = `
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
            mr_details += `
                <tr>
                    <td>${item.item_name}</td>
                    <td>${item.qty}</td>
                    <td>${item.uom}</td>
                    <td>${item.schedule_date}</td>
                </tr>
            `;
        });
        mr_details += `
                </tbody>
            </table>
        `;
        frappe.call({
            method: 'smk_scm.public.py.material_request.send_email',
            args: {
                name: frm.doc.name,
                company: frm.doc.company,
                recipient_id: frm.doc.custom_user_id,
                recipient: frm.doc.custom_user_full_name,
                mr_details
            },
            callback: function(response) {
                if (response.message) {
                    frappe.msgprint('An Email sent successfully');
                }
            }
        });
    }
});