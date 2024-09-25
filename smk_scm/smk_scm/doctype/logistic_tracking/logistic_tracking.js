// Copyright (c) 2024, Sanskar Technolab and contributors
// For license information, please see license.txt

frappe.ui.form.on("Logistic Tracking", {
    type_of_format(frm) {
        if (frm.is_new()){
            if (frm.doc.type_of_format == "Import"){
                frm.set_value("naming_series", "LT/IM/.FY./.###")
            }
            else if (frm.doc.type_of_format == "Export"){
                frm.set_value("naming_series", "LT/EX/.FY./.###")
            }
        }
    },
});