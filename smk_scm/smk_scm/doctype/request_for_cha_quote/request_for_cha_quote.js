// Copyright (c) 2024, Sanskar Technolab and contributors
// For license information, please see license.txt

frappe.ui.form.on("Request for CHA Quote", {
    on_submit (frm) {
        let rfq_details = `
            Pick up Address:</b> ${ frm.doc.pick_up_address }</p>
            <table border="1" cellpadding="5" cellspacing="0">
                <thead>
                    <tr>
                        <th>Required Date</th>
                        <th>Port of Loading</th>
                        <th>Port of Discharge</th>
                        <th>Terms</th>
                    </tr>
                </thead>
                <tbody>
                <tr>
                    <td>${frm.doc.schedule_date}</td>
                    <td>${frm.doc.port_of_loading}</td>
                    <td>${frm.doc.port_of_discharge}</td>
                    <td>${frm.doc.terms_}</td>
                </tr>
                </tbody>
            </table>
        `;
        let item_details = `  
            <table border="1" cellpadding="5" cellspacing="0">
                <thead>
                    <tr>
                        <th>Nature</th>
                        <th>Quantity</th>
                        <th>UOM</th>
                        <th>Net Weight (Kgs)</th>
                        <th>Tare Weight (Kgs/Qty)</th>
                        <th>Gross Weight (Kgs)</th>
                        <th>Dimensions in MM3</th>
                        <th>Volume in CBM</th>
                    </tr>
                </thead>
                <tbody>
                <tr>
                    <td>${frm.doc.nature}</td>
                    <td>${frm.doc.quantity}</td>
                    <td>${frm.doc.uom}</td>
                    <td>${frm.doc.net_weight_kgs}</td>
                    <td>${frm.doc.tare_weight}</td>
                    <td>${frm.doc.gross_weight_kgs}</td>
                    <td>${frm.doc.dimensions_in_mm3}</td>
                    <td>${frm.doc.volume_in_cbm_}</td>
                </tr>
                </tbody>
            </table>
        `;

        let terms = frm.doc.terms.replace(/<\/?[^>]+(>|$)/g, '').trim();
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
                        item_details,
                        tc_name : frm.doc.tc_name,
                        terms
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
