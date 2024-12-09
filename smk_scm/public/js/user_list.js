frappe.listview_settings['User'] = {
    onload: function (listview) {
        listview.page.add_action_item(__('Update User Permissions'), function () {
            const selected_users = listview.get_checked_items();

            if (selected_users.length === 0) {
                frappe.msgprint(__('Please select at least one user.'));
                return;
            }
            frappe.call({
                method: 'smk_scm.public.py.user.update_user_permissions',
                args: { users: selected_users },
                freeze: true,
                freeze_message: __('Updating User Permissions...'),
                callback: function (response) {
                    if (response.message.success) {
                        frappe.msgprint(__('User Permissions updated successfully.'));
                    } else {
                        frappe.msgprint({
                            title: __('Error'),
                            message: __('Some permissions could not be updated: {0}', [response.message.errors]),
                            indicator: 'red'
                        });
                    }
                }
            });
        });
    }
};
