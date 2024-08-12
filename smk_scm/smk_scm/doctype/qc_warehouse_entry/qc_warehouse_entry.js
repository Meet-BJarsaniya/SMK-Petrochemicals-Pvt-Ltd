// Copyright (c) 2024, Sanskar Technolab and contributors
// For license information, please see license.txt

frappe.ui.form.on("QC Warehouse Entry", {
	before_save (frm) {
        frm.doc.qc_item.forEach(row => {
            let po_qty = Number(row.purchase_order_qty);
            let received_qty = Number(row.received_qty);
            if (received_qty > po_qty) {
                frappe.throw("Received Qty is more than PO Qty.")
            }
        });
	},
    refresh: function (frm) {
        frm.add_custom_button(__('Purchase Order'), function () {
            open_purchase_order_dialog (frm);
        }, __('Get Items From'));
    }
});

frappe.ui.form.on("QC Warehouse Item", {
	received_qty(frm, cdt, cdn) {
        let row = locals [cdt] [cdn];
        let po_qty = Number(row.purchase_order_qty);
        let received_qty = Number(row.received_qty);
        if (received_qty > po_qty) {
            frappe.throw("Received Qty is more than PO Qty.")
        } else {
            frappe.model.set_value(cdt, cdn, {'pending_qty':po_qty - received_qty});        
        }
	},
});


function open_purchase_order_dialog (frm) {
    let d = new frappe.ui.Dialog({
        title: 'Select Purchase Order',
        fields: [
            {
                label: 'Purchase Order',
                fieldname: 'purchase_order',
                fieldtype: 'Link',
                options: 'Purchase Order',
                reqd: 1,
                filters: {
                    docstatus: 1,
                    status: ["in", ["To Receive and Bill", "To Receive"]]
                }
            }
        ],
        primary_action_label: 'Get Items',
        primary_action: function(data) {
            get_items_from_purchase_order(frm, data.purchase_order);
            d.hide();
        }
    });
    d.show();
}

function get_items_from_purchase_order(frm, purchase_order) {
    // // Logic to get items from the selected Purchase Order
    // frappe.call({
    //     method: "smk_scm.smk_scm.doctype.qc_warehouse_entry.qc_warehouse_entry.get_items_from_po",  // Update this to your method path
    //     args: {
    //         doc: frm.doc,
    //         purchase_order: purchase_order
    //     },
    // //     callback: function(response) {
    // //         // Handle the response and update the form accordingly
    // //         if (response.message) {
    // //             // Update the form with the retrieved items
    // //             // For example:
    // //             // frm.set_value('items', response.message);
    // //             console.log("UYG", response.message)
    // //         }
    // //     }

    // });
    // let po_doc = frappe.db.get_doc('Purchase Order', purchase_order);
    // console.log("po_doc", po_doc)
    // console.log("purchase_order", purchase_order)
    frappe.call({
        method: "frappe.client.get",
        args: {
            doctype: "Purchase Order",
            name: purchase_order
        },
        callback: function(response) {
            if (response.message.items) {
                let items = response.message.items;
                frm.set_value('purchase_order', response.message.name);
                frm.clear_table('qc_item');
                items.forEach(function(item) {
                    let new_row = frm.add_child('qc_item', {
                        item_code: item.item_code,
                        item_name: item.item_name,
                        item_group: item.item_group,
                        uom: item.uom,
                        purchase_order_qty: item.qty,
                    });
                });
                frm.refresh();
                // frappe.call({
                //     method: "frappe.client.set_value",
                //     args: {
                //         doctype: "Purchase Order",
                //         name: purchase_order,
                //         fieldname: "order_confirmation_no",
                //         value: 1000
                //     },
                //     callback: function(update_response) {
                //         if (!update_response.exc) {
                //             frappe.msgprint(__("Order Confirmation No updated to 1000"));
                //         }
                //     }
                // });
            }
        }
    });
}