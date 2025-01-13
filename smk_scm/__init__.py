__version__ = "0.0.1"


from erpnext.stock.doctype.quality_inspection.quality_inspection import QualityInspection
import frappe

def custom_validate_inspection_required(self):
    # Custom logic to skip validation or modify it
    pass

QualityInspection.validate_inspection_required = custom_validate_inspection_required










from erpnext.stock.doctype.quality_inspection_template.quality_inspection_template import QualityInspectionTemplate


def custom_get_template_details(template):
    frappe.msgprint("AAAAAAAAAAAA")
    if not template:
        return []

    # Custom logic, modify the original logic here if needed
    # For example, you can modify filters, fields, or return something different
    return frappe.get_all(
        "Item Quality Inspection Parameter",
        fields=[
            "specification",
            "value",
            "acceptance_formula",
            "numeric",
            "formula_based_criteria",
            "min_value",
            "max_value",
			'custom_test_method',
			'custom_unit',
        ],
        filters={"parenttype": "Quality Inspection Template", "parent": template},
        order_by="idx",
    )

QualityInspectionTemplate.get_template_details = custom_get_template_details
