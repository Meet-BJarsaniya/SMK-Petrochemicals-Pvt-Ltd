# Copyright (c) 2024, Sanskar Technolab and contributors
# For license information, please see license.txt

import frappe
from erpnext.setup.utils import get_exchange_rate
from frappe.model.document import Document


class QuoteFromCHA(Document):
	pass

@frappe.whitelist()
def get_exchange_rate1(from_currency, to_currency):
    return get_exchange_rate(from_currency, to_currency)