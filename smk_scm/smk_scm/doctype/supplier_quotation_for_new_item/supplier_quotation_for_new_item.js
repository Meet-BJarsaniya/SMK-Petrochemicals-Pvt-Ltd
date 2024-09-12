// Copyright (c) 2024, Sanskar Technolab and contributors
// For license information, please see license.txt

frappe.ui.form.on("Supplier Quotation for New Item", {
	// setup: function (frm) {
	// 	frm.custom_make_buttons = {
	// 		"Purchase Order": "Purchase Order",
	// 		Quotation: "Quotation",
	// 	};
	// },

	refresh: function (frm) {
		// var me = this;
		// super.refresh();
		// if (frm.doc.__islocal && !frm.doc.valid_till) {
		// 	frm.set_value("valid_till", frappe.datetime.add_months(frm.doc.transaction_date, 1));
		// }
        if (frm.doc.docstatus === 1) {
            frm.add_custom_button(__("Purchase Order"), function() {
                frm.events.make_purchase_order(frm);
            }, __("Create"));
            frm.page.set_inner_btn_group_as_primary(__("Create"));
            // frm.add_custom_button(__("Quotation"), function() {
            //     frm.events.make_quotation(frm);
            // }, __("Create"));
		} else if (frm.doc.docstatus === 0) {
			// frm.add_custom_button(
			// 	__("Material Request"),
			// 	function () {
			// 		erpnext.utils.map_current_doc({
			// 			method: "erpnext.stock.doctype.material_request.material_request.make_supplier_quotation",
			// 			source_doctype: "Material Request",
			// 			target: frm,
			// 			setters: {
			// 				schedule_date: undefined,
			// 				status: undefined,
			// 			},
			// 			get_query_filters: {
			// 				material_request_type: "Purchase",
			// 				docstatus: 1,
			// 				status: ["!=", "Stopped"],
			// 				per_ordered: ["<", 100],
			// 				company: frm.doc.company,
			// 			},
			// 		});
			// 	},
			// 	__("Get Items From")
			// );

			// // Link Material Requests
			// frm.add_custom_button(
			// 	__("Link to Material Requests"),
			// 	function () {
			// 		erpnext.buying.link_to_mrs(frm);
			// 	},
			// 	__("Tools")
			// );

			frm.add_custom_button(
				__("Request for Quotation"),
				function () {
					if (!frm.doc.supplier) {
						frappe.throw({ message: __("Please select a Supplier"), title: __("Mandatory") });
					}
					erpnext.utils.map_current_doc({
						method: "smk_scm.smk_scm.doctype.rfq_for_new_item.rfq_for_new_item.make_supplier_quotation_from_rfq",
						source_doctype: "RFQ for New Item",
						target: frm,
						setters: {
							transaction_date: null,
						},
						get_query_filters: {
							supplier: frm.doc.supplier,
							company: frm.doc.company,
						},
						get_query_method:
							"smk_scm.smk_scm.doctype.rfq_for_new_item.rfq_for_new_item.get_rfq_containing_supplier",
					});
				},
				__("Get Items From")
			);
		}
	},

	make_purchase_order: function (frm) {
		frappe.model.open_mapped_doc({
			method: "smk_scm.smk_scm.doctype.supplier_quotation_for_new_item.supplier_quotation_for_new_item.make_purchase_order",
			frm: cur_frm,
		});
	},
// 	make_quotation: function (frm) {
// 		frappe.model.open_mapped_doc({
// 			method: "smk_scm.smk_scm.doctype.supplier_quotation_for_new_item.supplier_quotation_for_new_item.make_quotation",
// 			frm: cur_frm,
// 		});
// 	},
//     before_save: function(frm) {
//         frm.doc.items.forEach(item => {
//             if (item.custom_rfq_for_new_item == '' || item.custom_rfq_for_new_item == null) {
//                 item.custom_rfq_for_new_item = item.request_for_quotation;
//                 item.request_for_quotation = '';
//             }
//         });
//     },
    after_save: function(frm) {
        if (frm.doc.custom_approved_for_purchase_order) {
            let supplier_quotation_details = `
                <table border="1" cellpadding="5" cellspacing="0">
                    <thead>
                        <tr>
                            <th>Item Name</th>
                            <th>Quantity</th>
                            <th>UOM</th>
                            <th>Rate</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            frm.doc.items.forEach(item => {
                const formattedRate = item.rate.toLocaleString('en-US', { 
                    style: 'currency', 
                    currency: frm.doc.currency
                });
                supplier_quotation_details += `
                    <tr>
                        <td>${item.item_code}</td>
                        <td>${item.qty}</td>
                        <td>${item.uom}</td>
                        <td>${formattedRate}</td>
                    </tr>
                `;
            });
            supplier_quotation_details += `
                    </tbody>
                </table>
            `;

            // Call the server-side method to send emails
            frappe.call({
                method: 'smk_scm.public.py.supplier_quotation.send_email_to_owners',
                args: {
                    recipient_id: frm.doc.owner,
                    name: frm.doc.name,
                    doctype: frm.doc.doctype,
                    supplier_quotation_details: supplier_quotation_details,
                    company: frm.doc.company
                },
                callback: function(response) {
                    if (response.message) {
                        frappe.msgprint('An Email sent successfully');
                    }
                }
            });
        }
    },
});

frappe.ui.form.on("Supplier Quotation for New Item Items", {
    qty: function (frm, cdt, cdn) {
        updateAmount(frm, cdt, cdn);
        updateTotal(frm);
        updateTax(frm)
    },
    rate: function (frm, cdt, cdn) {
        updateAmount(frm, cdt, cdn);
        updateTotal(frm);
        updateTax(frm)
    },
    items_remove: function (frm) {
        updateTotal(frm);
        updateTax(frm)
    }
});

function updateAmount(frm, cdt, cdn) {
    var row = locals[cdt][cdn];
    frappe.model.set_value(cdt, cdn, {'amount': row.qty * row.rate});
}

function updateTotal(frm) {
    var total_qty = 0;
    var total_amount = 0;
    frm.doc.items.forEach(function (row) {
        total_qty += row.qty;
        total_amount += row.amount;
    });
    frm.set_value("total_qty", total_qty);
    frm.set_value("total", total_amount);
    frm.set_value("net_total", total_amount);
}

frappe.ui.form.on("Purchase Taxes and Charges", {
    rate: function (frm, cdt, cdn) {
        updateTax(frm, cdt, cdn);
    },
    taxes_remove: function (frm, cdt, cdn) {
        updateTax(frm, cdt, cdn);
    }
});

function updateTax(frm) {
    let total_tax = 0;
    let total_amount = frm.doc.total;

    frm.doc.taxes.forEach((row, idx) => {
        frappe.model.set_value(row.doctype, row.name, 'tax_amount', total_amount / 100 * row.rate);
        total_tax += row.tax_amount;
        frappe.model.set_value(row.doctype, row.name, 'total', total_amount + total_tax);
    });
    let grand_total = total_amount + total_tax
    frm.refresh_fields('taxes');
    frm.set_value("taxes_and_charges_added", total_tax);
    frm.set_value("total_taxes_and_charges", total_tax);
    frm.set_value("grand_total", grand_total);
    rounded_total = Math.round(grand_total);
    frm.set_value("rounded_total", rounded_total);
    frm.set_value("rounding_adjustment", rounded_total-grand_total);
}