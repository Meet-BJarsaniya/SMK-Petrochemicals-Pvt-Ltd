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
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
        `;
        frm.doc.items.forEach(item => {
            let descriptionText = item.description.replace(/<\/?p[^>]*>/g, '').trim();
            var inputDate = item.schedule_date;
            var parts = inputDate.split("-");
            var year = parts[0];
            var month = parts[1];
            var day = parts[2];
            var formattedDate = day ? `${day}-${month}-${year}` : `${year}`;
            mr_details += `
                <tr>
                    <td>${item.item_name}</td>
                    <td>${item.qty}</td>
                    <td>${item.uom}</td>
                    <td>${formattedDate}</td>
                    <td>${descriptionText}</td>
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
                doctype: frm.doc.doctype,
                company: frm.doc.company,
                recipient_id: frm.doc.custom_user_id || "",
                recipient: frm.doc.custom_user_full_name || "",
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
