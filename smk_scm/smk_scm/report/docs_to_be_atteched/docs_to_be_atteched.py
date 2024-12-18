# Copyright (c) 2024, Sanskar Technolab and contributors
# For license information, please see license.txt

import frappe

def execute(filters=None):
    # Define the columns for the report
    columns = [
        {"label": "Document Type", "fieldname": "doctype", "fieldtype": "Data", "width": 150},
        {"label": "Document Name", "fieldname": "docname", "fieldtype": "Link", "options": filters.get("document_type"), "width": 300},
        {"label": "Customer", "fieldname": "customer", "fieldtype": "Data", "width": 200},
        {"label": "Transaction Date", "fieldname": "posting_date", "fieldtype": "Date", "width": 120},
        {"label": "Print Format PDF", "fieldname": "pdf_link", "fieldtype": "HTML", "width": 150},
    ]

    data = []

    # Check if a document type is selected in the filter
    if not filters or not filters.get("document_type"):
        frappe.msgprint("Please select a Document Type in the filter.")
        return columns, data

    # Get the document type from the filter
    document_type = filters.get("document_type")

    # Define fields to fetch based on the document type
    if document_type == "Sales Invoice":
        fields = ["name", "customer", "posting_date"]
    elif document_type == "Pick List":
        fields = ["name", "customer"]
    elif document_type == "Delivery Note":
        fields = ["name", "customer", "posting_date"]
    elif document_type == "E-Way Bill":
        fields = ["name", "posting_date"]
    else:
        frappe.msgprint("Invalid Document Type selected.")

    # Add condition for Sales Invoice and Delivery Note to filter by docstatus = 1
    filters_conditions = {}
    if document_type in ["Sales Invoice", "Delivery Note", "Pick List"]:
        filters_conditions = {"docstatus": 1}


    # Fetch the relevant documents
    documents = frappe.get_all(document_type, filters=filters_conditions, fields=fields)

    # Get the default print format for the selected document type
    default_print_format = frappe.db.get_value(
        "Property Setter",
        {"doc_type": document_type, "property": "default_print_format"},
        "value"
    )

    # Generate rows for the report
    for doc in documents:
        # Use the default print format or fallback to the Standard format
        print_format = default_print_format if default_print_format else "Standard"

        # Construct the PDF link
        pdf_link = (
            f"<a href='/api/method/frappe.utils.print_format.download_pdf?"
            f"doctype={document_type}&name={doc.name}&format={print_format}&no_letterhead=0' target='_blank'>"
            f"Download PDF</a>"
        )

        # Add data row
        data.append({
            "doctype": document_type,
            "docname": doc.name,
            "customer": doc.get("customer", "N/A"),
            "posting_date": doc.get("posting_date", "N/A"),
            "pdf_link": pdf_link,
        })

    return columns, data
