# Copyright (c) 2024, Sanskar Technolab and contributors
# For license information, please see license.txt

import frappe
from frappe import _

def execute(filters=None):
	columns = [
		{"label": _('<b>User</b>'), "fieldtype":"Data", "fieldname":"first_name", "width":200},
		{"label": _('<b>Avg Turnaround Time for MR (Hrs)</b>'), "fieldtype":"Data", "fieldname":"in_24hr_MR_per"},
		{"label": _('<b>MR w/o Error %</b>'), "fieldtype":"Data", "fieldname":"Err_MR"},
		{"label": _('<b>Response Rate to RFQs Sent</b>'), "fieldtype":"Data", "fieldname":"RFQS_to_SQ_per"},
		{"label": _('<b>Avg Time Taken to Receive Responses to RFQs (Hrs)</b>'), "fieldtype":"Data", "fieldname":"in_24hr_RFQS_to_SQ_per"},
		{"label": _('<b>SQ Approved %</b>'), "fieldtype":"Data", "fieldname":"SQ_appr_from_RFQ_per"},
		{"label": _('<b>Avg Time Taken to Approve SQ (Hrs)</b>'), "fieldtype":"Data", "fieldname":"sq_apr_avg_hr"},
		{"label": _('<b>Accuracy Rate of PO %</b>'), "fieldtype":"Data", "fieldname":"Err_PO"},
		{"label": _('<b>Quality of Mat. Received (Defect) %</b>'), "fieldtype":"Data", "fieldname":"Defect_per"},
		{"label": _('<b>Avg Time from MR to PO (Hrs)</b>'), "fieldtype":"Data", "fieldname":"MR_to_PO_avg_time"},
		{"label": _('<b>No of Delays in the Purchase Cycle</b>'), "fieldtype":"Data", "fieldname":"in_5DAY_PO_sum"},
	]

	sql = f"""
		SELECT 
			U.first_name,
			COALESCE(MR.in_24hr_MR_per, 0) AS in_24hr_MR_per,
			COALESCE(MR.Err_MR, 0) AS Err_MR,
			COALESCE(ROUND((COALESCE(RFQ_SUP.total_supplier_quotation, 0) / NULLIF(COALESCE(RFQ_SUP.total_rfq_supplier, 0), 0)) * 100, 2), 0) AS RFQS_to_SQ_per,
			COALESCE(ROUND(RFQ.in_24hr_RFQ_to_SQ, 2), 0) AS in_24hr_RFQS_to_SQ_per,
			COALESCE(ROUND((COALESCE(APR_SQ.approved_sq, 0) / NULLIF(COALESCE(RFQ_.total_rfq, 0), 0)) * 100, 2), 0) AS SQ_appr_from_RFQ_per,
			COALESCE(APR_SQ.sq_apr_avg_time, 0) AS sq_apr_avg_hr,
			COALESCE(POER.Err_PO, 0) AS Err_PO,
			COALESCE(ROUND(QC.Defect_per, 2), 0) AS Defect_per,
			COALESCE(P_CY.MR_to_PO_avg_time, 0) AS MR_to_PO_avg_time,
			COALESCE(P_CY.in_120hr_PO_sum, 0) AS in_5DAY_PO_sum
		FROM `tabUser` AS U
		LEFT JOIN (
			SELECT 
				MR.owner,
				AVG(TIMESTAMPDIFF(HOUR, MR.creation, MR.modified)) AS in_24hr_MR_per,
				COUNT(DISTINCT EL.reference_name) AS Err_MR
			FROM `tabMaterial Request` AS MR
			LEFT JOIN `tabError Log` AS EL ON MR.name = EL.reference_name
			WHERE MR.docstatus = 1
			GROUP BY MR.owner
		) AS MR ON U.name = MR.owner

		LEFT JOIN (
			SELECT
				RFQ.owner,
                COALESCE(SUM(RFQ_SUP1.total_rfq_supplier), 0) AS total_rfq_supplier,
                COALESCE((RFQ_SUP2.total_sq), 0) AS total_supplier_quotation
			FROM `tabRequest for Quotation` AS RFQ
            LEFT JOIN (
                SELECT
                    RFQS.parent,
                    COUNT(RFQS.name) AS total_rfq_supplier
                FROM `tabRequest for Quotation Supplier` AS RFQS
                GROUP BY RFQS.parent
            ) AS RFQ_SUP1 ON RFQ.name = RFQ_SUP1.parent
            LEFT JOIN (
                SELECT
                    SQI.request_for_quotation,
                    COUNT(SQ.name) AS total_sq
                FROM `tabSupplier Quotation` AS SQ
                JOIN `tabSupplier Quotation Item` AS SQI ON SQ.name = SQI.parent
                GROUP BY SQ.name
            ) AS RFQ_SUP2 ON RFQ.name = RFQ_SUP2.request_for_quotation
			WHERE RFQ.docstatus = 1
			GROUP BY RFQ.owner
		) AS RFQ_SUP ON U.name = RFQ_SUP.owner
		
		LEFT JOIN (
			SELECT
				RFQ.owner,
				COUNT(SQ.name) AS total_supplier_quotation,
				AVG(TIMESTAMPDIFF(HOUR, RFQ.creation, SQ.creation)) AS in_24hr_RFQ_to_SQ
			FROM `tabRequest for Quotation` AS RFQ
			LEFT JOIN `tabSupplier Quotation Item` AS SQI ON RFQ.name = SQI.request_for_quotation
			LEFT JOIN `tabSupplier Quotation` AS SQ ON SQI.parent = SQ.name AND SQ.docstatus = 1
			WHERE RFQ.docstatus = 1 
			GROUP BY RFQ.owner
		) AS RFQ ON U.name = RFQ.owner
		LEFT JOIN (
			SELECT
				SQ.owner,
				AVG(TIMESTAMPDIFF(HOUR, SQ.creation, SQ.modified)) AS sq_apr_avg_time,
				COUNT(SQ.name) AS approved_sq
			FROM `tabSupplier Quotation` AS SQ
			WHERE SQ.docstatus = 1 AND SQ.custom_approved_for_purchase_order = 1
			GROUP BY SQ.owner
		) AS APR_SQ ON U.name = APR_SQ.owner
		LEFT JOIN (
			SELECT
				RFQ.owner,
				COUNT(RFQ.name) AS total_rfq
			FROM `tabRequest for Quotation` AS RFQ
			WHERE RFQ.docstatus = 1
			GROUP BY RFQ.owner
		) AS RFQ_ ON U.name = RFQ_.owner
		LEFT JOIN (
			SELECT 
				PO.owner,
				COUNT(DISTINCT EL.reference_name) AS Err_PO
			FROM `tabPurchase Order` AS PO
			LEFT JOIN `tabError Log` AS EL ON PO.name = EL.reference_name
			WHERE PO.docstatus = 1
			GROUP BY PO.owner
		) AS POER ON U.name = POER.owner
		LEFT JOIN (
			SELECT 
				PO.owner,
				AVG(TIMESTAMPDIFF(HOUR, MR.creation, PO.creation)) AS MR_to_PO_avg_time,
				SUM(CASE WHEN TIMESTAMPDIFF(HOUR, MR.creation, PO.creation) >= 120 THEN 1 ELSE 0 END) AS in_120hr_PO_sum
			FROM `tabPurchase Order` AS PO
			JOIN `tabPurchase Order Item` AS POI ON PO.name = POI.parent
			JOIN `tabMaterial Request` AS MR ON MR.name = POI.material_request
			WHERE PO.docstatus = 1
			GROUP BY PO.owner
		) AS P_CY ON U.name = P_CY.owner
		LEFT JOIN (
			SELECT 
				PR.owner,
				SUM(PRI.rejected_qty) AS RJ,
				SUM(PRI.received_qty) AS RV,
				PR.total AS total,
				CASE 
					WHEN COUNT(PR.name) = 0 THEN 0
					ELSE (SUM(PRI.rejected_qty) / SUM(PRI.received_qty)) * 100
				END AS 'Defect_per'
			FROM `tabPurchase Receipt` AS PR
			JOIN `tabPurchase Receipt Item` AS PRI ON PR.name = PRI.parent
			WHERE PR.docstatus = 1
			GROUP BY PR.owner
		) AS QC ON U.name = QC.owner;
	"""
	if filters.get('from_date') and filters.get('to_date'):
		sql += f"AND DAD.posting_date BETWEEN '{filters.get('from_date')}' AND '{filters.get('to_date')}'"

	if filters.get('company'):
		sql += f"AND DAD.company  = '{filters.get('company')}'"

	if filters.get('compressor'):
		sql += f"AND DDAD.compressor  = '{filters.get('compressor')}'"

	if filters.get('drilling_machine'):
		sql += f"AND DDAD.drilling_machine  = '{filters.get('drilling_machine')}'"

	if filters.get('drilling_type'):
		sql += f"AND DDAD.drilling_type  = '{filters.get('drilling_type')}'"

	if filters.get('shift_type'):
		sql += f"AND DDAD.shift_type  = '{filters.get('shift_type')}'"
	data = frappe.db.sql(sql,as_dict = True)
	return columns, data
