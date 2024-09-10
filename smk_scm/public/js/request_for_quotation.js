frappe.ui.form.on('Request for Quotation', {
    validate: function(frm) {
        if (frm.doc.transaction_date > frm.doc.custom_rfq_deadline || frm.doc.custom_rfq_deadline >= frm.doc.schedule_date){
            frappe.throw("RFQ deadline is Invalid.");
        }
    }
});