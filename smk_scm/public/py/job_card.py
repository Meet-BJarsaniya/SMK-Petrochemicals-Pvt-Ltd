import frappe


@frappe.whitelist()
def before_insert(self, doc):
    print(self.name)
    print(self.work_order)
    print(self.production_item)
    print("...................................................")
    print(doc)
    frappe.throw("b insert")