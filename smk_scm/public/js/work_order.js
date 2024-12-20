// frappe.ui.form.on('Work Order', {
//     custom_change_qty (frm) {
//         if (frm.doc.status == 'In Process') {
//             frm.doc.required_items.forEach(item => {
//                 frappe.model.set_value(item.doctype, item.name, 'required_qty', item.transferred_qty);
//             });
//         }
//         frm.submit();
//     }
// });

frappe.ui.form.on('Work Order', {
    custom_change_qty: function (frm) {
        let custom_change_qty = true
        frm.doc.required_items.forEach(item => {
            if (item.transferred_qty == item.required_qty) {
                custom_change_qty = false
            }
        });
        if (frm.doc.status == 'In Process' && custom_change_qty) {
            frappe.confirm(
                __('Are you sure you want to update all quantities to 1? This will modify a submitted document.'),
                function () {
                    // Call the server method
                    frappe.call({
                        method: 'smk_scm.public.py.work_order.update_qty_for_required_items',
                        args: {
                            work_order_name: frm.doc.name
                        },
                        callback: function (response) {
                            if (!response.exc) {
                                frappe.msgprint(__('Quantities updated successfully.'));
                                frm.reload_doc(); // Reload the document to reflect changes
                            }
                        }
                    });
                }
            );
        }
    }
});
