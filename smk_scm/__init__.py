__version__ = "0.0.1"


from erpnext.stock.doctype.quality_inspection.quality_inspection import QualityInspection
import frappe

def custom_validate_inspection_required(self):
    # Custom logic to skip validation or modify it
    pass

QualityInspection.validate_inspection_required = custom_validate_inspection_required