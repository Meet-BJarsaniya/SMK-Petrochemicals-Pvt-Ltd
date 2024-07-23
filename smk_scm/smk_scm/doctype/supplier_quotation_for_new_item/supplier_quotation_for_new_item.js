// Copyright (c) 2024, Sanskar Technolab and contributors
// For license information, please see license.txt

frappe.ui.form.on("Supplier Quotation for New Item", {
	setup: function (frm) {
		frm.custom_make_buttons = {
			"Purchase Order": "Purchase Order",
			Quotation: "Quotation",
		};
	},

	refresh: function (frm) {
		// var me = this;
		// super.refresh();
		if (frm.doc.__islocal && !frm.doc.valid_till) {
			frm.set_value("valid_till", frappe.datetime.add_months(frm.doc.transaction_date, 1));
		}
        if (frm.doc.docstatus === 1) {
            frm.add_custom_button(__("Purchase Order"), function() {
                frm.events.make_purchase_order(frm);
            }, __("Create"));
            frm.page.set_inner_btn_group_as_primary(__("Create"));
            frm.add_custom_button(__("Quotation"), function() {
                frm.events.make_quotation(frm);
            }, __("Create"));
		} else if (frm.doc.docstatus === 0) {
			frm.add_custom_button(
				__("Material Request"),
				function () {
					erpnext.utils.map_current_doc({
						method: "erpnext.stock.doctype.material_request.material_request.make_supplier_quotation",
						source_doctype: "Material Request",
						target: frm,
						setters: {
							schedule_date: undefined,
							status: undefined,
						},
						get_query_filters: {
							material_request_type: "Purchase",
							docstatus: 1,
							status: ["!=", "Stopped"],
							per_ordered: ["<", 100],
							company: frm.doc.company,
						},
					});
				},
				__("Get Items From")
			);

			// Link Material Requests
			frm.add_custom_button(
				__("Link to Material Requests"),
				function () {
					erpnext.buying.link_to_mrs(frm);
				},
				__("Tools")
			);

			frm.add_custom_button(
				__("Request for Quotation"),
				function () {
					if (!frm.doc.supplier) {
						frappe.throw({ message: __("Please select a Supplier"), title: __("Mandatory") });
					}
					erpnext.utils.map_current_doc({
						method: "erpnext.buying.doctype.request_for_quotation.request_for_quotation.make_supplier_quotation_from_rfq",
						source_doctype: "Request for Quotation",
						target: frm,
						setters: {
							transaction_date: null,
						},
						get_query_filters: {
							supplier: frm.doc.supplier,
							company: frm.doc.company,
						},
						get_query_method:
							"erpnext.buying.doctype.request_for_quotation.request_for_quotation.get_rfq_containing_supplier",
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
	make_quotation: function (frm) {
		frappe.model.open_mapped_doc({
			method: "smk_scm.smk_scm.doctype.supplier_quotation_for_new_item.supplier_quotation_for_new_item.make_quotation",
			frm: cur_frm,
		});
	},
    before_save: function(frm) {
        frm.doc.items.forEach(item => {
            if (item.custom_rfq_for_new_item == '' || item.custom_rfq_for_new_item == null) {
                item.custom_rfq_for_new_item = item.request_for_quotation;
                item.request_for_quotation = '';
            }
        });
    },
    after_save: function(frm) {
        if (frm.doc.custom_approved_for_purchase_order) {
            let rfq_set = new Set();
            frm.doc.items.forEach(item => {
                rfq_set.add(item.custom_rfq_for_new_item);
            });
            
            // Function to get owners of RFQs
            const get_rfq_owners = (rfq_set) => {
                frappe.call({
                    method: 'frappe.client.get_list',
                    args: {
                        doctype: 'RFQ for New Item',
                        filters: {
                            name: ['in', Array.from(rfq_set)]
                        },
                        fields: ['name', 'owner']
                    },
                    callback: function(response) {
                        if (response.message) {
                            let rfq_owners = response.message;
                            // console.log(rfq_owners);
                            let owners = new Set();
                            rfq_owners.forEach(rfq_owner => {
                                owners.add(rfq_owner.owner);
                            });
                            // console.log(owners);

                            // Convert the Set to an Array for the server call
                            let owners_array = Array.from(owners);
                            let supplier_quotation_id = frm.doc.name;
                            let supplier_quotation_details = `
                                Supplier: ${frm.doc.supplier}<br>
                                Total: ${frm.doc.total}<br>
                                Items: <br>
                            `;
                            frm.doc.items.forEach(item => {
                                supplier_quotation_details += `
                                    - ${item.item_name}: ${item.qty} ${item.uom} @ ${item.rate}<br>
                                `;
                                // console.log(supplier_quotation_details);
                            });

                            // Call the server-side method to send emails
                            frappe.call({
                                method: 'smk_scm.public.py.supplier_quotation.send_email_to_owners',
                                args: {
                                    owners_list: JSON.stringify(owners_array),
                                    supplier_quotation_id: supplier_quotation_id,
                                    supplier_quotation_details: supplier_quotation_details,
                                    company: frm.doc.company
                                },
                                callback: function(response) {
                                    if (response.message) {
                                        frappe.msgprint('Emails sent successfully');
                                    }
                                }
                            });
                        }
                    }
                });
            };
            // Fetch owners for the RFQs
            get_rfq_owners(rfq_set);
        }
    },
});

frappe.ui.form.on("Supplier Quotation Item", {
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

// erpnext.buying.setup_buying_controller();
// erpnext.buying.SupplierQuotationController = class SupplierQuotationController extends (
// 	erpnext.buying.BuyingController
// ) {
// 	setup() {
// 		this.frm.custom_make_buttons = {
// 			"Purchase Order": "Purchase Order",
// 			Quotation: "Quotation",
// 		};

// 		super.setup();
// 	}

// 	refresh() {
// 		var me = this;
// 		super.refresh();

// 		if (this.frm.doc.__islocal && !this.frm.doc.valid_till) {
// 			this.frm.set_value("valid_till", frappe.datetime.add_months(this.frm.doc.transaction_date, 1));
// 		}
// 		if (this.frm.doc.docstatus === 0) {
// 		// 	cur_frm.add_custom_button(__("Purchase Order"), this.make_purchase_order, __("Create"));
// 		// 	cur_frm.page.set_inner_btn_group_as_primary(__("Create"));
// 		// 	cur_frm.add_custom_button(__("Quotation"), this.make_quotation, __("Create"));
// 		// } else if (this.frm.doc.docstatus === 0) {
// 			this.frm.add_custom_button(
// 				__("Material Request"),
// 				function () {
// 					erpnext.utils.map_current_doc({
// 						method: "erpnext.stock.doctype.material_request.material_request.make_supplier_quotation",
// 						source_doctype: "Material Request",
// 						target: me.frm,
// 						setters: {
// 							schedule_date: undefined,
// 							status: undefined,
// 						},
// 						get_query_filters: {
// 							material_request_type: "Purchase",
// 							docstatus: 1,
// 							status: ["!=", "Stopped"],
// 							per_ordered: ["<", 100],
// 							company: me.frm.doc.company,
// 						},
// 					});
// 				},
// 				__("Get Items From")
// 			);

// 			// Link Material Requests
// 			this.frm.add_custom_button(
// 				__("Link to Material Requests"),
// 				function () {
// 					erpnext.buying.link_to_mrs(me.frm);
// 				},
// 				__("Tools")
// 			);

// 			this.frm.add_custom_button(
// 				__("RFQ for New Item"),
// 				function () {
// 					if (!me.frm.doc.supplier) {
// 						frappe.throw({ message: __("Please select a Supplier"), title: __("Mandatory") });
// 					}
// 					erpnext.utils.map_current_doc({
// 						method: "smk_scm.smk_scm.doctype.rfq_for_new_item.rfq_for_new_item.make_supplier_quotation_from_rfq",
// 						source_doctype: "RFQ for New Item",
// 						target: me.frm,
// 						setters: {
// 							transaction_date: null,
// 						},
// 						get_query_filters: {
// 							supplier: me.frm.doc.supplier,
// 							company: me.frm.doc.company,
// 						},
// 						get_query_method:
// 							"smk_scm.smk_scm.doctype.rfq_for_new_item.rfq_for_new_item.get_rfq_containing_supplier",
// 					});
// 				},
// 				__("Get Items From")
// 			);
// 		}
// 	}

// 	// make_purchase_order() {
// 	// 	frappe.model.open_mapped_doc({
//     //         method: "smk_scm.smk_scm.doctype.supplier_quotation_for_new_item.supplier_quotation_for_new_item.make_purchase_order",
//     //         frm: cur_frm,
// 	// 	});
// 	// }
// 	make_quotation() {
// 		frappe.model.open_mapped_doc({
//             method: "smk_scm.smk_scm.doctype.supplier_quotation_for_new_item.supplier_quotation_for_new_item.make_quotation",
//             frm: cur_frm,
// 		});
// 	}
// };

// // for backward compatibility: combine new and previous states
// extend_cscript(cur_frm.cscript, new erpnext.buying.SupplierQuotationController({ frm: cur_frm }));

// cur_frm.fields_dict["items"].grid.get_field("project").get_query = function (doc, cdt, cdn) {
// 	return {
// 		filters: [["Project", "status", "not in", "Completed, Cancelled"]],
// 	};
// };
