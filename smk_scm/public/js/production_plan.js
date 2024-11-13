frappe.ui.form.on('Production Plan', {
    custom_confirmation_mail: function(frm) {
        frm.doc.sales_orders.forEach(row => {
            frappe.call({
                method: 'smk_scm.public.py.production_plan.send_email',
                args: {
                    name: frm.doc.name,
                    doctype: frm.doc.doctype,
                    company: frm.doc.company,
                    so_name: row.sales_order,
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