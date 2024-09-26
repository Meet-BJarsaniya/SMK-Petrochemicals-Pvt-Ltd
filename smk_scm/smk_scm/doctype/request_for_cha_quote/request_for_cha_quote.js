// Copyright (c) 2024, Sanskar Technolab and contributors
// For license information, please see license.txt

frappe.ui.form.on("Request for CHA Quote", {
    on_submit (frm) {
        let rfq_details = `
            <p>Pick up Address: ${ frm.doc.pick_up_address }
            <br>Required Date: ${ frm.doc.schedule_date }
            <br>Port of Loading: ${ frm.doc.port_of_loading }
            <br>Port of Discharge: ${ frm.doc.port_of_discharge }
            <br>Terms: ${ frm.doc.terms }</p>
        `;
        let item_details = `
            <p>Nature: ${ frm.doc.nature }
            <br>Quantity: ${ frm.doc.quantity }
            <br>UOM: ${ frm.doc.uom }
            <br>Net Weight (Kgs): ${ frm.doc.net_weight_kgs }
            <br>Tare Weight (Kgs/Qty): ${ frm.doc.tare_weight }
            <br>Gross Weight (Kgs): ${ frm.doc.gross_weight_kgs }
            <br>Dimensions in MM3: ${ frm.doc.dimensions_in_mm3 }
            <br>Volume in CBM: ${ frm.doc.volume_in_cbm_ }</p>
        `;

        frm.doc.forwarder.forEach(cha => {            
            if (cha.send_email) {                
                frappe.call({
                    method: 'smk_scm.smk_scm.doctype.request_for_cha_quote.request_for_cha_quote.send_email',
                    args: {
                        name: frm.doc.name,
                        company: frm.doc.company,
                        recipient_id: cha.email_id,
                        recipient: cha.forwarder,
                        rfq_details,
                        item_details
                    },
                    callback: function(response) {
                        if (response.message) {
                            frappe.msgprint('An Email sent successfully');
                        }
                    }
                });
            }
        });
    }
});
