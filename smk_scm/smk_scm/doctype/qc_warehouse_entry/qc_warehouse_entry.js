// Copyright (c) 2024, Sanskar Technolab and contributors
// For license information, please see license.txt

frappe.ui.form.on("QC Warehouse Entry", {
    before_save(frm) {
        frm.doc.qc_item.forEach(row => {
            let po_qty = Number(row.remaining_po_qty);
            let received_qty = Number(row.received_qty);
            if (received_qty > po_qty) {
                frappe.throw("Received Qty is more than PO Qty.")
            } else if (received_qty < 0) {
                frappe.throw("Received Qty can't be Negative.")
            }
        });
    },
    refresh: function (frm) {
        if (frm.doc.docstatus==0){
            frm.add_custom_button(__('Purchase Order'), function () {
                open_purchase_order_dialog(frm);
            }, __('Get Items From'));
        }
		if (frm.doc.docstatus === 1) {
            frm.add_custom_button('Purchase Invoice', () => {
                make_purchase_invoice(cur_frm.doc.purchase_order)
            }, 'Create');
        }
    },
    on_submit(frm) {
        let purchase_order = frm.doc.purchase_order;
        let qc_items = frm.doc.qc_item;
        let qc_items_dict = {};
        let bal_items_dict = {};

        // Create a dictionary mapping item_code to received_qty
        qc_items.forEach(function (qc_item) {
            qc_items_dict[qc_item.item_code] = qc_item.received_qty;
            bal_items_dict[qc_item.item_code] = qc_item.balanced_qty;
        });

        frappe.call({
            method: "smk_scm.smk_scm.doctype.qc_warehouse_entry.qc_warehouse_entry.update_purchase_order_items",
            args: {
                purchase_order: purchase_order,
                qc_items_dict: qc_items_dict,
                bal_items_dict: bal_items_dict,
            },
            callback: function (response) {
                if (!response.exc) {
                    frappe.msgprint("Purchase Order items updated successfully.");
                    frm.refresh();
                }
            }
        });
    }
});

frappe.ui.form.on("QC Warehouse Item", {
    received_qty(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        let po_qty = Number(row.purchase_order_qty);
        let grn_qty = Number(row.grn_qty);
        let remaining_po_qty = Number(row.remaining_po_qty);
        let received_qty = Number(row.received_qty);
        if (received_qty > remaining_po_qty) {
            frappe.throw("Received Qty is more than PO Qty.")
        } else if (received_qty < 0) {
            frappe.throw("Received Qty can't be Negative.")
        } else {
            frappe.model.set_value(cdt, cdn, { 'pending_qty': remaining_po_qty - received_qty });
            frappe.model.set_value(cdt, cdn, { 'balanced_qty': po_qty + received_qty - grn_qty - remaining_po_qty});
        }
    },
});


function open_purchase_order_dialog(frm) {
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
        primary_action: function (data) {
            get_items_from_purchase_order(frm, data.purchase_order);
            d.hide();
        }
    });
    d.show();
}

function get_items_from_purchase_order(frm, purchase_order) {
    frappe.call({
        method: "frappe.client.get",
        args: {
            doctype: "Purchase Order",
            name: purchase_order
        },
        callback: function (response) {
            if (response.message.items) {
                let items = response.message.items;
                frm.set_value('purchase_order', response.message.name);
                frm.clear_table('qc_item');
                items.forEach(function (item) {
                    let new_row = frm.add_child('qc_item', {
                        item_code: item.item_code,
                        item_name: item.item_name,
                        item_group: item.item_group,
                        uom: item.uom,
                        purchase_order_qty: item.qty,
                        grn_qty: item.received_qty,
                        remaining_po_qty: item.qty - item.custom_qc_qty,
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

function make_purchase_invoice(purchase_order) {
    frappe.call({
        method: "erpnext.buying.doctype.purchase_order.purchase_order.make_purchase_invoice",
        args: {
            source_name: purchase_order // The Purchase Order name or ID
        },
        callback: function(response) {
            if (response && response.message) {
                console.log(response.message.items)
                // open the new Purchase Invoice form
                frappe.model.sync(response.message);
                frappe.set_route("Form", response.message.doctype, response.message.name);
                frappe.ui.form.on("Purchase Invoice", {
                    refresh: function(frm) {
                        // frm.set_value("custom_purchase_type", "Import");
                    }
                });
            } else {
                frappe.msgprint(__("Could not create Purchase Invoice from the selected Purchase Order."));
            }
        }
    });
}