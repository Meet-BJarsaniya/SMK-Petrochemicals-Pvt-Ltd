// Copyright (c) 2024, Sanskar Technolab and contributors
// For license information, please see license.txt

frappe.ui.form.on("Quote From CHA", {
	quantity(frm) {
        console.log()
        updateGrossWeight(frm);
	},
	net_weight(frm) {
        updateGrossWeight(frm);
	},
	tare_weight(frm) {
        updateGrossWeight(frm);
	},
    currency: function (frm) {
        updateExchangeRate(frm);
        frappe.db.get_value('Currency', frm.doc.currency, 'symbol', (r) => {
            if (r && r.symbol) {
                let currency_symbol = r.symbol;
                // Dynamically set the label of the rate field for this row in the child table
                frm.fields_dict['cha_quote_summary'].grid.update_docfield_property(
                    'amount_in_oth_curr', 'label', `Amount in (${currency_symbol})`
                );
                frm.refresh_field('cha_quote_summary');
            }
        });
    },
});

frappe.ui.form.on("CHA Quote Charges", {
    qty: function (frm, cdt, cdn) {
        updateAmount(frm, cdt, cdn);
        updateSummary(frm);
    },
    rate: function (frm, cdt, cdn) {
        updateAmount(frm, cdt, cdn);
        updateSummary(frm);
    },
    charges_remove: function (frm) {
        updateSummary(frm);
    },
    location: function (frm) {
        updateSummary(frm);
    },
    currency: function (frm, cdt, cdn) {
        updateSymbol(frm, cdt, cdn);
        // updateSummary(frm);
    },
});


function updateAmount(frm, cdt, cdn) {
    var row = locals[cdt][cdn];
    frappe.model.set_value(cdt, cdn, {'amount': row.qty * row.rate});
}


function updateGrossWeight(frm){
    frm.set_value('gross_weight', frm.doc.net_weight + frm.doc.tare_weight * frm.doc.quantity)
}


function updateExchangeRate(frm){
    getExchangeRate(frm.doc.currency, function(exchange_rate) {
        frm.set_value('exchange_rate', exchange_rate)
    });
}

function updateSummary(frm) {
    // Create a dictionary to store totals per location and currency
    let location_currency_totals = {};
    let total_in_inr = 0;  // Initialize the total amount in INR    

    // Loop through the "CHA Quote Charges" child table
    frm.doc.charges.forEach(function(row) {
        let key = row.location + "_" + row.currency;

        // Initialize if not already present
        if (!location_currency_totals[key]) {
            location_currency_totals[key] = {
                'location': row.location,
                'currency': row.currency,
                'amount': 0
            };
        }
        // Add the amount to the respective location and currency total
        location_currency_totals[key].amount += row.amount;
    });

    frm.clear_table("cha_quote_summary");
    // Add rows to the "summary" child table for each location and currency combination
    Object.keys(location_currency_totals).forEach(function(key) {
        let data = location_currency_totals[key];
        if (data.currency == 'INR'){
            total_in_inr += data.amount;
            let new_row = frm.add_child("cha_quote_summary");
            frappe.model.set_value(new_row.doctype, new_row.name, {
                'location': data.location,
                'currency': data.currency,
                'amount': data.amount,
                'amount_in_inr': data.amount,
                'amount_in_oth_curr': data.amount / frm.doc.exchange_rate
            });
        }
        else {
            total_in_inr += (data.amount * frm.doc.exchange_rate);
            let new_row = frm.add_child("cha_quote_summary");
            frappe.model.set_value(new_row.doctype, new_row.name, {
                'location': data.location,
                'currency': data.currency,
                'amount': data.amount,
                'amount_in_inr': data.amount * frm.doc.exchange_rate,
                'amount_in_oth_curr': data.amount
            });
        }
    });

    // Update the fields in the parent form
    frm.set_value("total_charges_in_inr", total_in_inr);
    // frm.set_value('total_charges_in_oth_curr', total_in_inr);
    frm.set_value('total_charges_in_oth_curr', total_in_inr / frm.doc.exchange_rate);
    frm.set_value('total_in_inr_per_kgs', total_in_inr / frm.doc.gross_weight);

    // Refresh the child table field to show the updated rows
    frm.refresh_field("cha_quote_summary");
}

//     // Track the number of rows processed for final total calculation
//     let row_count = Object.keys(location_currency_totals).length;
//     let processed_count = 0;

//     // Add rows to the "cha_quote_summary" child table for each location and currency combination
//     Object.keys(location_currency_totals).forEach(function(key) {
//         let data = location_currency_totals[key];

//         // Call getExchangeRate and pass the callback function to handle the exchange rate
//         // getExchangeRate(data.currency, function(exchange_rate) {
//             let new_row = frm.add_child("cha_quote_summary");
//             let amount_in_inr = data.amount * exchange_rate;

//             // Set values in the new row
//             frappe.model.set_value(new_row.doctype, new_row.name, {
//                 'location': data.location,
//                 'currency': data.currency,
//                 'amount': data.amount,
//                 'amount_in_inr': amount_in_inr,
//                 'amount_in_oth_curr': amount_in_inr / frm.doc.exchange_rate,
//             });

//             // Add to the total amount in INR
//             total_in_inr += amount_in_inr;

//             // Refresh the child table field to show the updated rows
//             frm.refresh_field("cha_quote_summary");

//             // Check if all rows are processed, and set the total
//             processed_count++;
//             if (processed_count === row_count) {
//                 frm.set_value('total_charges_in_inr', total_in_inr);
//                 frm.set_value('total_charges_in_oth_curr', total_in_inr / frm.doc.exchange_rate);
//                 frm.set_value('total_in_inr_per_kgs', total_in_inr / frm.doc.gross_weight);
//             }
//         // });
//     });
// }


// function updateSummary(frm) {
//     // Create a dictionary to store totals per location and currency
//     let location_currency_totals = {};
//     let total_in_inr = 0;  // Initialize the total amount in INR

//     // Loop through the "CHA Quote Charges" child table
//     frm.doc.charges.forEach(function(row) {
//         let key = row.location + "_" + row.currency;

//         // Initialize if not already present
//         if (!location_currency_totals[key]) {
//             location_currency_totals[key] = {
//                 'location': row.location,
//                 'currency': row.currency,
//                 'amount': 0
//             };
//         }
//         // Add the amount to the respective location and currency total
//         location_currency_totals[key].amount += row.amount;
//     });

//     frm.clear_table("cha_quote_summary");

//     // Track the number of rows processed for final total calculation
//     let row_count = Object.keys(location_currency_totals).length;
//     let processed_count = 0;

//     // Add rows to the "cha_quote_summary" child table for each location and currency combination
//     Object.keys(location_currency_totals).forEach(function(key) {
//         let data = location_currency_totals[key];

//         // Call getExchangeRate and pass the callback function to handle the exchange rate
//         getExchangeRate(data.currency, function(exchange_rate) {
//             let new_row = frm.add_child("cha_quote_summary");
//             let amount_in_inr = data.amount * exchange_rate;

//             // Set values in the new row
//             frappe.model.set_value(new_row.doctype, new_row.name, {
//                 'location': data.location,
//                 'currency': data.currency,
//                 'amount': data.amount,
//                 'amount_in_inr': amount_in_inr,
//                 'amount_in_oth_curr': amount_in_inr / frm.doc.exchange_rate,
//             });

//             // Add to the total amount in INR
//             total_in_inr += amount_in_inr;

//             // Refresh the child table field to show the updated rows
//             frm.refresh_field("cha_quote_summary");

//             // Check if all rows are processed, and set the total
//             processed_count++;
//             if (processed_count === row_count) {
//                 frm.set_value('total_charges_in_inr', total_in_inr);
//                 frm.set_value('total_charges_in_oth_curr', total_in_inr / frm.doc.exchange_rate);
//                 frm.set_value('total_in_inr_per_kgs', total_in_inr / frm.doc.gross_weight);
//             }
//         });
//     });
// }


// Modified getExchangeRate function to accept a callback
function getExchangeRate(currency, callback) {
    frappe.call({
        method: 'smk_scm.smk_scm.doctype.quote_from_cha.quote_from_cha.get_exchange_rate1',
        args: {
            from_currency: currency,
            to_currency: "INR",
        },
        callback: function(response) {
            if (response.message) {
                let exchange_rate = response.message;
                // Pass the exchange rate back to the callback function
                callback(exchange_rate);
                // if  (exchange_rate !== 1) {
                //     cur_frm.set_value('exchange_rate', exchange_rate)
                // }
            }
        }
    });
}


function updateSymbol(frm, cdt, cdn) {
    let row = locals[cdt][cdn]; // Get the row object
    // console.log(row)
    // if (row.currency) {
    //     // Set the currency symbol for the rate field dynamically
    //     let rate_field = frappe.meta.get_docfield('CHA Quote Charges', 'rate', frm.doc.name);
    //     console.log("fg",rate_field)
        // Update the rate field's currency based on the selected currency in the row
        // if (rate_field) {
        //     rate_field.options = row.currency;
        //     frm.refresh_field('charges');  // Replace with the actual child table fieldname
        // }
    // }
    if (row.currency) {
        // Fetch the symbol from the Currency doctype directly
        frappe.db.get_value('Currency', row.currency, 'symbol', (r) => {
            if (r && r.symbol) {
                // let currency_symbol = r.symbol;
                // frappe.model.set_currency_labels(cdt, cdn, "rate", currency_symbol)
                // frm.refresh_field('charges');
            }
        });
    }
}