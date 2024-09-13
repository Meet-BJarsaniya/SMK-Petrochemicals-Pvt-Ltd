// Copyright (c) 2024, Sanskar Technolab and contributors
// For license information, please see license.txt

cur_frm.add_fetch("contact", "email_id", "email_id");

erpnext.buying.setup_buying_controller();

frappe.ui.form.on("RFQ for New Item", {
	setup: function (frm) {
		frm.custom_make_buttons = {
			"Supplier Quotation": "Create",
		};

		frm.fields_dict["suppliers"].grid.get_field("contact").get_query = function (doc, cdt, cdn) {
			let d = locals[cdt][cdn];
			return {
				query: "frappe.contacts.doctype.contact.contact.contact_query",
				filters: {
					link_doctype: "Supplier",
					link_name: d.supplier || "",
				},
			};
		};

		frm.set_query("warehouse", "items", () => ({
			filters: {
				company: frm.doc.company,
				is_group: 0,
			},
		}));
	},

	company: function (frm) {
		frm.set_query("billing_address", function() {
            return {
                filters: {
					address_title: frm.doc.company,
					is_your_company_address: 1,
                }
            };
        });
	},

	refresh: function (frm, cdt, cdn) {
		if (frm.doc.docstatus === 1) {
			frm.add_custom_button(
				__("Supplier Quotation"),
				function () {
					frm.trigger("make_supplier_quotation");
				},
				__("Create")
			);

			frm.page.set_inner_btn_group_as_primary(__("Create"));
		}
	},

	make_supplier_quotation: function (frm) {
		var doc = frm.doc;
		var dialog = new frappe.ui.Dialog({
			title: __("Create Supplier Quotation"),
			fields: [
				{
					fieldtype: "Link",
					label: __("Supplier"),
					fieldname: "supplier",
					options: "Supplier",
					reqd: 1,
					get_query: () => {
						return {
							filters: [
								[
									"Supplier",
									"name",
									"in",
									frm.doc.suppliers.map((row) => {
										return row.supplier;
									}),
								],
							],
						};
					},
				},
			],
			primary_action_label: __("Create"),
			primary_action: (args) => {
				if (!args) return;
				dialog.hide();

				return frappe.call({
					type: "GET",
					method: "smk_scm.smk_scm.doctype.rfq_for_new_item.rfq_for_new_item.make_supplier_quotation_from_rfq",
					args: {
						source_name: doc.name,
						for_supplier: args.supplier,
					},
					freeze: true,
					callback: function (r) {
						if (!r.exc) {
							var doc = frappe.model.sync(r.message);
							frappe.set_route("Form", r.message.doctype, r.message.name);
						}
					},
				});
			},
		});

		dialog.show();
	},

	schedule_date(frm) {
		if (frm.doc.schedule_date) {
			frm.doc.items.forEach((item) => {
				item.schedule_date = frm.doc.schedule_date;
			});
		}
		refresh_field("items");
	},
	preview: (frm) => {
		let dialog = new frappe.ui.Dialog({
			title: __("Preview Email"),
			fields: [
				{
					label: __("Supplier"),
					fieldtype: "Select",
					fieldname: "supplier",
					options: frm.doc.suppliers.map((row) => row.supplier),
					reqd: 1,
				},
				{
					fieldtype: "Column Break",
					fieldname: "col_break_1",
				},
				{
					label: __("Subject"),
					fieldtype: "Data",
					fieldname: "subject",
					read_only: 1,
					depends_on: "subject",
				},
				{
					fieldtype: "Section Break",
					fieldname: "sec_break_1",
					hide_border: 1,
				},
				{
					label: __("Email"),
					fieldtype: "HTML",
					fieldname: "email_preview",
				},
				{
					fieldtype: "Section Break",
					fieldname: "sec_break_2",
				},
				{
					label: __("Note"),
					fieldtype: "HTML",
					fieldname: "note",
				},
			],
		});

		dialog.fields_dict["supplier"].df.onchange = () => {
			frm.call("get_supplier_email_preview", {
				supplier: dialog.get_value("supplier"),
			}).then(({ message }) => {
				dialog.fields_dict.email_preview.$wrapper.empty();
				dialog.fields_dict.email_preview.$wrapper.append(message.message);
				dialog.set_value("subject", message.subject);
			});
		};

		dialog.fields_dict.note.$wrapper
			.append(`<p class="small text-muted">This is a preview of the email to be sent. A PDF of the document will
			automatically be attached with the email.</p>`);

		dialog.show();
	},
    on_submit(frm) {
        let rfq_details = `
            <table border="1" cellpadding="5" cellspacing="0">
                <thead>
                    <tr>
                        <th>Item Name</th>
                        <th>Quantity</th>
                        <th>UOM</th>
                        <th>Required By</th>
                    </tr>
                </thead>
                <tbody>
        `;
        frm.doc.items.forEach(item => {
            var inputDate = item.schedule_date;
            var parts = inputDate.split("-");
            var year = parts[0];
            var month = parts[1];
            var day = parts[2];
            var formattedDate = day ? `${day}-${month}-${year}` : `${year}`;
            rfq_details += `
                <tr>
                    <td>${item.item_code}</td>
                    <td>${item.qty}</td>
                    <td>${item.uom}</td>
                    <td>${formattedDate}</td>
                </tr>
            `;
        });
        rfq_details += `
                </tbody>
            </table>
        `;

        frm.doc.suppliers.forEach(supplier => {
            frappe.call({
                method: 'smk_scm.public.py.request_for_quotation.send_email',
                args: {
                    name: frm.doc.name,
                    company: frm.doc.company,
                    recipient_id: supplier.email_id,
                    recipient: supplier.supplier,
                    rfq_details
                },
                callback: function(response) {
                    if (response.message) {
                        frappe.msgprint('An Email sent successfully');
                    }
                }
            });
        });
    }
});
frappe.ui.form.on("Request for Quotation Item", {
	items_add(frm, cdt, cdn) {
		if (frm.doc.schedule_date) {
			frappe.model.set_value(cdt, cdn, "schedule_date", frm.doc.schedule_date);
		}
	},
});
frappe.ui.form.on("Request for Quotation Supplier", {
	supplier: function (frm, cdt, cdn) {
		var d = locals[cdt][cdn];
		frappe.call({
			method: "erpnext.accounts.party.get_party_details",
			args: {
				party: d.supplier,
				party_type: "Supplier",
			},
			callback: function (r) {
				if (r.message) {
					frappe.model.set_value(cdt, cdn, "contact", r.message.contact_person);
					frappe.model.set_value(cdt, cdn, "email_id", r.message.contact_email);
				}
			},
		});
	},
});

erpnext.buying.RequestforQuotationController = class RequestforQuotationController extends (
	erpnext.buying.BuyingController
) {
	calculate_taxes_and_totals() {
		return;
	}

	tc_name() {
		this.get_terms();
	}

	get_suppliers_button(frm) {
		var doc = frm.doc;
		var dialog = new frappe.ui.Dialog({
			title: __("Get Suppliers"),
			fields: [
				{
					fieldtype: "Select",
					label: __("Get Suppliers By"),
					fieldname: "search_type",
					options: ["Supplier Group", "Tag"],
					reqd: 1,
					onchange() {
						if (dialog.get_value("search_type") == "Tag") {
							frappe
								.call({
									method: "erpnext.buying.doctype.request_for_quotation.request_for_quotation.get_supplier_tag",
								})
								.then((r) => {
									dialog.set_df_property("tag", "options", r.message);
								});
						}
					},
				},
				{
					fieldtype: "Link",
					label: __("Supplier Group"),
					fieldname: "supplier_group",
					options: "Supplier Group",
					reqd: 0,
					depends_on: "eval:doc.search_type == 'Supplier Group'",
				},
				{
					fieldtype: "Select",
					label: __("Tag"),
					fieldname: "tag",
					reqd: 0,
					depends_on: "eval:doc.search_type == 'Tag'",
				},
			],
			primary_action_label: __("Add Suppliers"),
			primary_action: (args) => {
				if (!args) return;
				dialog.hide();

				//Remove blanks
				for (var j = 0; j < frm.doc.suppliers.length; j++) {
					if (!Object.prototype.hasOwnProperty.call(frm.doc.suppliers[j], "supplier")) {
						frm.get_field("suppliers").grid.grid_rows[j].remove();
					}
				}

				function load_suppliers(r) {
					if (r.message) {
						for (var i = 0; i < r.message.length; i++) {
							var exists = false;
							let supplier = "";
							if (r.message[i].constructor === Array) {
								supplier = r.message[i][0];
							} else {
								supplier = r.message[i].name;
							}

							for (var j = 0; j < doc.suppliers.length; j++) {
								if (supplier === doc.suppliers[j].supplier) {
									exists = true;
								}
							}
							if (!exists) {
								var d = frm.add_child("suppliers");
								d.supplier = supplier;
								frm.script_manager.trigger("supplier", d.doctype, d.name);
							}
						}
					}
					frm.refresh_field("suppliers");
				}

				if (args.search_type === "Tag" && args.tag) {
					return frappe.call({
						type: "GET",
						method: "frappe.desk.doctype.tag.tag.get_tagged_docs",
						args: {
							doctype: "Supplier",
							tag: "%" + args.tag + "%",
						},
						callback: load_suppliers,
					});
				} else if (args.supplier_group) {
					return frappe.call({
						method: "frappe.client.get_list",
						args: {
							doctype: "Supplier",
							order_by: "name",
							fields: ["name"],
							filters: [["Supplier", "supplier_group", "=", args.supplier_group]],
						},
						callback: load_suppliers,
					});
				}
			},
		});

		dialog.show();
	}
};

// for backward compatibility: combine new and previous states
// extend_cscript(cur_frm.cscript, new erpnext.buying.RequestforQuotationController({ frm: cur_frm }));
