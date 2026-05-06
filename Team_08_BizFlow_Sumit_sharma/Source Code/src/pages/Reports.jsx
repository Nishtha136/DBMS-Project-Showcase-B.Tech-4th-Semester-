import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";

const API = "http://localhost:3000/api/reports";
const getHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const REPORTS = [
  {
    key: "top-vendors",
    title: "Top Vendors by Purchase Value",
    concept: "GROUP BY + HAVING",
    description: "Vendors whose total purchase value exceeds ₹10,000",
    columns: ["company_name", "phone", "total_orders", "total_purchased"],
    labels: ["Company", "Phone", "Total Orders", "Total Purchased"],
    money: ["total_purchased"],
  },
  {
    key: "sales-by-product",
    title: "Sales Revenue by Product",
    concept: "GROUP BY + Aggregate Functions",
    description: "Total quantity sold, revenue and average price per product",
    columns: ["product", "total_qty_sold", "total_revenue", "avg_selling_price", "orders_count"],
    labels: ["Product", "Qty Sold", "Total Revenue", "Avg Price", "Orders"],
    money: ["total_revenue", "avg_selling_price"],
  },
  {
    key: "below-average-stock",
    title: "Raw Materials Below Average Stock",
    concept: "Subquery — Scalar",
    description: "Materials whose stock is below the average stock level across all materials",
    columns: ["name", "unit", "current_stock", "reorder_level", "avg_stock"],
    labels: ["Material", "Unit", "Current Stock", "Reorder Level", "Avg Stock"],
    money: [],
  },
  {
    key: "employees-completed-orders",
    title: "Employees on Completed Production Orders",
    concept: "Subquery with IN",
    description: "Employees who have been assigned to completed production orders",
    columns: ["employee_id", "name", "designation", "completed_orders"],
    labels: ["ID", "Name", "Designation", "Completed Orders"],
    money: [],
  },
  {
    key: "machine-service-status",
    title: "Machine Service Status",
    concept: "Scalar Functions — DATEDIFF, UPPER, CHAR_LENGTH",
    description: "Days since last service and days until next service for each machine",
    columns: ["name", "location", "last_service_date", "days_since_service", "days_until_next_service"],
    labels: ["Machine", "Location", "Last Service", "Days Since Service", "Days Until Next"],
    money: [],
  },
  {
    key: "payment-summary",
    title: "Invoice Payment Summary",
    concept: "Aggregate + GROUP BY + COALESCE",
    description: "Total paid, balance due and payment count per invoice",
    columns: ["invoice_number", "invoice_total", "payment_count", "total_paid", "balance_due", "invoice_status"],
    labels: ["Invoice", "Total", "Payments", "Paid", "Balance Due", "Status"],
    money: ["invoice_total", "total_paid", "balance_due"],
  },
  {
    key: "production-requirements",
    title: "Production Material Requirements",
    concept: "Multi-table JOIN + GROUP BY",
    description: "Raw material units needed per production order based on BOM",
    columns: ["production_id", "product_name", "production_qty", "status", "materials_needed", "total_raw_units_needed"],
    labels: ["ID", "Product", "Qty", "Status", "Materials", "Total Raw Units"],
    money: [],
  },
  {
    key: "products-with-bom",
    title: "Products with BOM Defined",
    concept: "Subquery with EXISTS",
    description: "Products that have at least one BOM entry defined",
    columns: ["product_id", "name", "sku", "selling_price", "current_stock", "bom_components"],
    labels: ["ID", "Product", "SKU", "Price", "Stock", "BOM Components"],
    money: ["selling_price"],
  },
  {
    key: "full-sales-details",
    title: "Full Sales Order Details",
    concept: "5-table JOIN",
    description: "Sales orders joined with items, products, invoices and payments",
    columns: ["so_number", "product_name", "quantity", "price", "line_total", "invoice_number", "invoice_status", "amount_paid"],
    labels: ["SO Number", "Product", "Qty", "Price", "Line Total", "Invoice", "Invoice Status", "Paid"],
    money: ["price", "line_total", "amount_paid"],
  },
  {
    key: "shared-raw-materials",
    title: "Raw Materials in BOM",
    concept: "HAVING + COUNT",
    description: "Raw materials and how many products they are used in via BOM",
    columns: ["material_name", "unit", "current_stock", "used_in_products", "total_qty_required_across_bom"],
    labels: ["Material", "Unit", "Stock", "Used in Products", "Total Qty in BOM"],
    money: [],
  },
];

const conceptColor = {
  "GROUP BY + HAVING": "badge-yellow",
  "GROUP BY + Aggregate Functions": "badge-blue",
  "Subquery — Scalar": "badge-green",
  "Subquery with IN": "badge-green",
  "Scalar Functions — DATEDIFF, UPPER, CHAR_LENGTH": "badge-blue",
  "Aggregate + GROUP BY + COALESCE": "badge-yellow",
  "Multi-table JOIN + GROUP BY": "badge-blue",
  "Subquery with EXISTS": "badge-green",
  "5-table JOIN": "badge-blue",
  "HAVING + COUNT": "badge-yellow",
};

export default function Reports() {
  const [data, setData]         = useState({});
  const [loading, setLoading]   = useState({});
  const [expanded, setExpanded] = useState(null);
  const [error, setError]       = useState({});

  const fetchReport = async (key) => {
    if (data[key]) { setExpanded(expanded === key ? null : key); return; }
    setLoading(prev => ({ ...prev, [key]: true }));
    setError(prev => ({ ...prev, [key]: "" }));
    try {
      const res = await axios.get(`${API}/${key}`, getHeaders());
      setData(prev => ({ ...prev, [key]: res.data.data }));
      setExpanded(key);
    } catch (err) {
      setError(prev => ({ ...prev, [key]: err.response?.data?.message || "Failed to load" }));
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const formatVal = (val, isMoney) => {
    if (val === null || val === undefined) return "—";
    if (isMoney) return `₹${Number(val).toLocaleString()}`;
    if (typeof val === "string" && val.length === 10 && val.includes("-")) return val.slice(0, 10);
    return val;
  };

  return (
    <Layout title="Reports & Analytics">
      <div className="page-header">
        <div>
          <div className="page-title">Reports & Analytics</div>
          <div className="page-subtitle">
            SQL concepts demonstrated — GROUP BY, HAVING, Subqueries, JOINs, Functions
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {REPORTS.map((report) => (
          <div key={report.key} className="card" style={{ padding: 0, overflow: "hidden" }}>
            {/* Header — always visible */}
            <div
              style={{
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                borderBottom: expanded === report.key ? "1px solid var(--border)" : "none",
              }}
              onClick={() => fetchReport(report.key)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className={`badge ${conceptColor[report.concept] || "badge-gray"}`}>
                  {report.concept}
                </span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                    {report.title}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    {report.description}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {data[report.key] && (
                  <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    {data[report.key].length} rows
                  </span>
                )}
                {loading[report.key] ? (
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Loading...</span>
                ) : (
                  <span style={{ color: "var(--text-muted)", fontSize: 16 }}>
                    {expanded === report.key ? "▲" : "▼"}
                  </span>
                )}
              </div>
            </div>

            {/* Expanded table */}
            {expanded === report.key && (
              <div style={{ padding: "0 0 4px" }}>
                {error[report.key] && (
                  <div className="alert alert-error" style={{ margin: "12px 20px" }}>
                    {error[report.key]}
                  </div>
                )}
                {data[report.key] && data[report.key].length === 0 && (
                  <div className="empty-state">
                    <div className="empty-state-icon">📭</div>
                    <div className="empty-state-text">No data returned</div>
                  </div>
                )}
                {data[report.key] && data[report.key].length > 0 && (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          {report.labels.map((label, i) => (
                            <th key={i}>{label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data[report.key].map((row, ri) => (
                          <tr key={ri}>
                            {report.columns.map((col, ci) => (
                              <td
                                key={ci}
                                className={report.money.includes(col) ? "mono" : ""}
                              >
                                {formatVal(row[col], report.money.includes(col))}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Layout>
  );
}