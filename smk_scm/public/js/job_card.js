frappe.ui.form.on('Job Card', {
    employee: function(frm) {
        frm.set_value("custom_no_of_workers", frm.doc.employee.length);
    }
});