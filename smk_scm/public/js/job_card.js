frappe.ui.form.on('Job Card', {
    // employee: function(frm) {
    //     frm.set_value("custom_no_of_workers", frm.doc.employee.length);
    // },
    before_submit: async function (frm) {
        // Ensure Quality Inspection is linked
        if (!frm.doc.quality_inspection) {
            frappe.throw(__('Please select a Quality Inspection before submitting.'));
        }
        // Fetch the status of the linked Quality Inspection
        const { message } = await frappe.db.get_value('Quality Inspection', frm.doc.quality_inspection, ['status', 'docstatus']);
        const status = message?.status;
        const docstatus = message?.docstatus;

        // Validate both status and docstatus
        if (status !== 'Accepted' || docstatus !== 1) {
            frappe.throw(__('The selected Quality Inspection is not accepted. Please ensure it is accepted before submitting.'));
        }
    }
});