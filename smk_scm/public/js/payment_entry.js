frappe.ui.form.on('Payment Entry', {
    refresh: function(frm) {
        frm.doc.references.forEach(reference => {
            if (reference.reference_doctype === "Purchase Order" && reference.reference_name) {
                frappe.db.get_value("Purchase Order", reference.reference_name, ["payment_terms_template"], (r) => {
                    if (r && r.payment_terms_template === "Advance Payment") {
                        const recipients = ["purchase_team@gmail.com", "logistic_team@gmail.com"];

                        if (frm.doc.contact_email) {
                            recipients.push(frm.doc.contact_email);
                        }

                        frappe.call({
                            method: 'smk_scm.public.py.payment_entry.send_advance_payment_email',
                            args: {
                                purchase_order: reference.reference_name,
                                recipients: recipients
                            },
                            callback: function(response) {
                                if (response.message === 'Email sent successfully') {
                                    frappe.show_alert({
                                        message: 'Advance payment notification email sent.',
                                        indicator: 'green'
                                    });
                                } else {
                                    frappe.show_alert({
                                        message: 'Failed to send email.',
                                        indicator: 'red'
                                    });
                                }
                            }
                        });
                    }
                });
            }
        });
    }
});
