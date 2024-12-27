// Copyright (c) 2024, Sanskar Technolab and contributors
// For license information, please see license.txt

frappe.ui.form.on("Long Term QC", {
	refresh (frm) {
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
        if (frm.doc.sample_retain_for_qc) {
            // frm.set_df_property('sample_retain_for_qc', 'read_only', 1);
        }          
	},
    after_save (frm) {
        if (frm.doc.sample_retain_for_qc) {
            frappe.model.with_doctype('Stock Entry', () => {
                let stock_entry = frappe.model.get_new_doc('Stock Entry');
                stock_entry.stock_entry_type = 'R&D';
                stock_entry.custom_long_term_qc = frm.doc.name;

                // let child_item = frappe.model.add_child(stock_entry, 'items');
                // child_item.item_code = frm.doc.item;
                // child_item.batch_no = frm.doc.batch_no;
                // async function getStockUOM(item) {
                //     let { message } = await frappe.call({
                //         method: "frappe.client.get_value",
                //         args: { doctype: "Item", filters: { name: item }, fieldname: "stock_uom" }
                //     });
                //     return message?.stock_uom || "No value found";
                // }                
                // // Use an immediately invoked function to handle async/await
                // (async () => {
                //     let stock_uom = await getStockUOM(frm.doc.item);
                //     // console.log(stock_uom); // Correctly logs the value after resolving
                //     child_item.stock_uom = stock_uom;
                //     child_item.uom = stock_uom;
                // })();
                frappe.set_route('Form', 'Stock Entry', stock_entry.name);
            });
        }                
    }
});
