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

def has_permission(doc, ptype, user):
    # Get the user's allowed item groups
    user_item_groups = frappe.get_all(
        "User Permission",
        filters={"user": user, "allow": "Item Group"},
        fields=["for_value"]
    )

    # Extract the list of allowed item groups
    allowed_item_groups = [d["for_value"] for d in user_item_groups]

    # Get the item group of the production item in the Job Card
    item_group = frappe.db.get_value("Item", doc.production_item, "item_group")

    # Check if the item's item group is allowed
    if item_group in allowed_item_groups:
        return True
    else:
        return False