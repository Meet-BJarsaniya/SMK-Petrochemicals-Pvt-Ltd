# Copyright (c) 2013, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt


import frappe
from frappe import _
from frappe.utils import getdate

from erpnext.stock.report.stock_analytics.stock_analytics import get_period, get_period_date_ranges


def execute(filters=None):
	columns, data = [], []
	data = get_data(filters)
	columns = get_columns(filters)
	chart_data = get_chart_data(data, filters)
	return columns, data, None, chart_data


def get_data(filters):
	query_filters = {
		"docstatus": ("<", 2),
		"posting_date": ("between", [filters.from_date, filters.to_date]),
	}

	fields = [
		"name",
		"status",
		"work_order",
		"production_item",
		"item_name",
		"posting_date",
		"total_completed_qty",
		"workstation",
		"operation",
		"total_time_in_mins",
		"for_quantity",
		"work_order.production_plan",
		"custom_no_of_workers",
	]

	for field in ["work_order", "production_item"]:
		if filters.get(field):
			query_filters[field] = ("in", filters.get(field))

	for field in ["workstation", "operation", "status", "company"]:
		if filters.get(field):
			query_filters[field] = filters.get(field)

	data = frappe.get_all("Job Card", fields=fields, filters=query_filters)

	# Loop through each job card in data
	for job_card in data:
		# Get all Job Card Items for the current job card
		job_card_items = frappe.get_all("Work Order Item", filters={"parent": job_card.work_order}, fields=["required_qty"])
		# Calculate the total required quantity for the current job card
		total_required_qty = sum(item['required_qty'] for item in job_card_items)		
		# Add total_required_qty to the job_card dictionary
		job_card['total_required_qty'] = total_required_qty

	if not data:
		return []

	job_cards = [d.name for d in data]

	job_card_time_filter = {
		"docstatus": ("<", 2),
		"parent": ("in", job_cards),
	}

	job_card_time_details = {}
	for job_card_data in frappe.get_all(
		"Job Card Time Log",
		fields=["min(from_time) as from_time", "max(to_time) as to_time", "parent"],
		filters=job_card_time_filter,
		group_by="parent",
	):
		job_card_time_details[job_card_data.parent] = job_card_data

	res = []
	for d in data:
		if d.status != "Completed":
			d.status = "Open"

		if job_card_time_details.get(d.name):
			d.from_time = job_card_time_details.get(d.name).from_time
			d.to_time = job_card_time_details.get(d.name).to_time

		res.append(d)

	return res


def get_chart_data(job_card_details, filters):
	labels, periodic_data = prepare_chart_data(job_card_details, filters)

	open_job_cards, completed = [], []
	datasets = []

	for d in labels:
		open_job_cards.append(periodic_data.get("Open").get(d))
		completed.append(periodic_data.get("Completed").get(d))

	datasets.append({"name": _("Open"), "values": open_job_cards})
	datasets.append({"name": _("Completed"), "values": completed})

	chart = {"data": {"labels": labels, "datasets": datasets}, "type": "bar"}

	return chart


def prepare_chart_data(job_card_details, filters):
	labels = []

	periodic_data = {"Open": {}, "Completed": {}}

	filters.range = "Monthly"

	ranges = get_period_date_ranges(filters)
	for from_date, end_date in ranges:
		period = get_period(end_date, filters)
		if period not in labels:
			labels.append(period)

		for d in job_card_details:
			if getdate(d.posting_date) > from_date and getdate(d.posting_date) <= end_date:
				status = "Completed" if d.status == "Completed" else "Open"

				if periodic_data.get(status).get(period):
					periodic_data[status][period] += 1
				else:
					periodic_data[status][period] = 1

	return labels, periodic_data


def get_columns(filters):
	columns = [
		{
			"label": _("Id"),
			"fieldname": "name",
			"fieldtype": "Link",
			"options": "Job Card",
			"width": 100,
		},
		{"label": _("Posting Date"), "fieldname": "posting_date", "fieldtype": "Date", "width": 100},
	]

	if not filters.get("status"):
		columns.append(
			{"label": _("Status"), "fieldname": "status", "width": 100},
		)

	columns.extend(
		[
			{
				"label": _("Plan No"),
				"fieldname": "production_plan",
				"fieldtype": "Link",
				"options": "Production Plan",
				"width": 100,
			},
			{
				"label": _("Work Order"),
				"fieldname": "work_order",
				"fieldtype": "Link",
				"options": "Work Order",
				"width": 100,
			},
			{
				"label": _("Production Item"),
				"fieldname": "production_item",
				"fieldtype": "Link",
				"options": "Item",
				"width": 110,
			},
			{"label": _("Item Name"), "fieldname": "item_name", "fieldtype": "Data", "width": 100},
			{
				"label": _("Qty To Manufacture"),
				"fieldname": "for_quantity",
				"fieldtype": "Float",
				"width": 110,
			},
			{
				"label": _("Total Completed Qty"),
				"fieldname": "total_completed_qty",
				"fieldtype": "Float",
				"width": 120,
			},
			{
				"label": _("RM Qty Charged"),
				"fieldname": "total_required_qty",
				"fieldtype": "Float",
				"width": 120,
			},
			{
				"label": _("No of Workers"),
				"fieldname": "custom_no_of_workers",
				"fieldtype": "Float",
				"width": 110,
			},
			{
				"label": _("Workstation"),
				"fieldname": "workstation",
				"fieldtype": "Link",
				"options": "Workstation",
				"width": 110,
			},
			{
				"label": _("Operation"),
				"fieldname": "operation",
				"fieldtype": "Link",
				"options": "Operation",
				"width": 110,
			},
			{"label": _("From Time"), "fieldname": "from_time", "fieldtype": "Datetime", "width": 120},
			{"label": _("To Time"), "fieldname": "to_time", "fieldtype": "Datetime", "width": 120},
			{
				"label": _("Time Required (In Mins)"),
				"fieldname": "total_time_in_mins",
				"fieldtype": "Float",
				"width": 100,
			},
		]
	)

	return columns