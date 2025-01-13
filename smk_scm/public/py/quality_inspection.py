# import frappe

# def custom_get_template_details(template):
#     frappe.msgprint("AAAAAAAAAAAA")
#     if not template:
#         return []

#     # Custom logic, modify the original logic here if needed
#     # For example, you can modify filters, fields, or return something different
#     return frappe.get_all(
#         "Item Quality Inspection Parameter",
#         fields=[
#             "specification",
#             "value",
#             "acceptance_formula",
#             "numeric",
#             "formula_based_criteria",
#             "min_value",
#             "max_value",
# 			'custom_test_method',
# 			'custom_unit',
#         ],
#         filters={"parenttype": "Quality Inspection Template", "parent": template},
#         order_by="idx",
#     )




# import frappe

# def custom_get_template_details(template):
#     frappe.logger().info("Custom get_template_details called")
#     if not template:
#         return []

#     return frappe.get_all(
#         "Item Quality Inspection Parameter",
#         fields=[
#             "specification",
#             "value",
#             "acceptance_formula",
#             "numeric",
#             "formula_based_criteria",
#             "min_value",
#             "max_value",
#             "custom_test_method",
#             "custom_unit",
#         ],
#         filters={"parenttype": "Quality Inspection Template", "parent": template},
#         order_by="idx",
#     )



# import frappe
# import erpnext.stock.doctype.quality_inspection_template.quality_inspection_template as original_module

# def custom_get_template_details(template):
#     frappe.msgprint("Custom function executed via Monkey Patching!")
#     if not template:
#         return []

#     return frappe.get_all(
#         "Item Quality Inspection Parameter",
#         fields=[
#             "specification",
#             "value",
#             "acceptance_formula",
#             "numeric",
#             "formula_based_criteria",
#             "min_value",
#             "max_value",
#             "custom_test_method",
#             "custom_unit",
#         ],
#         filters={"parenttype": "Quality Inspection Template", "parent": template},
#         order_by="idx",
#     )

# # Monkey patching the original function
# original_module.get_template_details = custom_get_template_details
