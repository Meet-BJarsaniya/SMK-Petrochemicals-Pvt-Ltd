import frappe


@frappe.whitelist()
def after_insert(self, doc):
    quality_inspection = frappe.new_doc("Quality Inspection")
    quality_inspection.reference_type = "Job Card"
    quality_inspection.reference_name = self.name
    quality_inspection.item_code = self.production_item
    quality_inspection.sample_size = self.for_quantity
    # Temporarily bypass mandatory for 'inspected_by'
    quality_inspection.flags.ignore_mandatory = True
    quality_inspection.inspected_by = ""
    quality_inspection.inspection_type = "In Process"
    quality_inspection.insert()
    frappe.db.set_value("Job Card", self.name, "quality_inspection", quality_inspection.name)