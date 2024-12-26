// Copyright (c) 2024, Sanskar Technolab and contributors
// For license information, please see license.txt

frappe.ui.form.on("Long Term QC", {
	refresh(frm) {
        if (!frm.is_new()) {
            frm.add_custom_button(__("Create QC"), () => {
                // Proceed to create a new Quality Inspection document
                frappe.model.with_doctype('Quality Inspection', () => {
                    let new_doc = frappe.model.get_new_doc('Quality Inspection');
                    new_doc.inspection_type = 'R&D';
                    new_doc.reference_type = 'Long Term QC';
                    new_doc.reference_name = frm.doc.name;
                    new_doc.item_code = frm.doc.item;
                    new_doc.sample_size = 0;
                    // Save the new document and navigate to it
                    frappe.set_route('Form', 'Quality Inspection', new_doc.name);
                });
            });
        }
	},
});
