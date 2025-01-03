frappe.listview_settings["Job Card"] = {
    onload: function(listview) {
        // Check if the user has no "R&D Manager" role
        if (!(frappe.user_roles.includes("R&D User") || frappe.user_roles.includes("R&D Manager"))) {
            listview.filter_area.add([
                ['Job Card', 'custom_is_rd', '==', '0']
            ]);
        }		
    }
};
