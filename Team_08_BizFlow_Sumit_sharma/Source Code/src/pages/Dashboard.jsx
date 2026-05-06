import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";

const API = "http://localhost:3000/api";

const getHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
});

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalRawMaterials: 0,
    lowStockCount: 0,
    pendingPOs: 0,
    pendingSOs: 0,
    unpaidInvoices: 0,
    plannedProduction: 0,
    totalEmployees: 0,
  });

  const [lowStock, setLowStock]         = useState([]);
  const [recentPOs, setRecentPOs]       = useState([]);
  const [recentSOs, setRecentSOs]       = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [products, rawMats, lowStockRes, pos, sos, employees, production] = await Promise.all([
          axios.get(`${API}/inventory/products`, getHeaders()),
          axios.get(`${API}/inventory/raw-materials`, getHeaders()),
          axios.get(`${API}/inventory/low-stock`, getHeaders()),
          axios.get(`${API}/purchase`, getHeaders()),
          axios.get(`${API}/sales`, getHeaders()),
          axios.get(`${API}/hr`, getHeaders()),
          axios.get(`${API}/production`, getHeaders()),
        ]);

        const pendingPOs   = pos.data.filter(p => p.status === "pending").length;
        const pendingSOs   = sos.data.filter(s => s.status === "pending" || s.status === "processing").length;
        const plannedProd  = production.data.filter(p => p.status === "planned" || p.status === "in_progress").length;

        setStats({
          totalProducts:    products.data.length,
          totalRawMaterials:rawMats.data.length,
          lowStockCount:    lowStockRes.data.length,
          pendingPOs,
          pendingSOs,
          totalEmployees:   employees.data.length,
          plannedProduction: plannedProd,
        });

        setLowStock(lowStockRes.data.slice(0, 5));
        setRecentPOs(pos.data.slice(0, 5));
        setRecentSOs(sos.data.slice(0, 5));
      } catch (err) {
        console.error("Dashboard fetch error:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const statusBadge = (status) => {
    const map = {
      pending:     "badge-yellow",
      approved:    "badge-blue",
      received:    "badge-green",
      cancelled:   "badge-red",
      processing:  "badge-blue",
      dispatched:  "badge-blue",
      completed:   "badge-green",
      planned:     "badge-gray",
      in_progress: "badge-yellow",
    };
    return <span className={`badge ${map[status] || "badge-gray"}`}>{status}</span>;
  };

  if (loading) return (
    <Layout title="Dashboard">
      <div className="loading">Loading dashboard...</div>
    </Layout>
  );

  return (
    <Layout title="Dashboard">
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-label">Total Products</div>
          <div className="stat-value">{stats.totalProducts}</div>
          <div className="stat-sub">Finished goods</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Raw Materials</div>
          <div className="stat-value">{stats.totalRawMaterials}</div>
          <div className="stat-sub">In inventory</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Low Stock</div>
          <div className="stat-value">{stats.lowStockCount}</div>
          <div className="stat-sub">Below reorder level</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-label">Pending POs</div>
          <div className="stat-value">{stats.pendingPOs}</div>
          <div className="stat-sub">Awaiting approval</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-label">Active Sales</div>
          <div className="stat-value">{stats.pendingSOs}</div>
          <div className="stat-sub">Pending / processing</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">Production</div>
          <div className="stat-value">{stats.plannedProduction}</div>
          <div className="stat-sub">Planned / in progress</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Employees</div>
          <div className="stat-value">{stats.totalEmployees}</div>
          <div className="stat-sub">Total headcount</div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
        {/* Low Stock Alert */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">⚠ Low Stock Alerts</div>
          </div>
          {lowStock.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <div className="empty-state-text">All stock levels are healthy</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Current</th>
                    <th>Reorder</th>
                    <th>Shortage</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map(item => (
                    <tr key={item.raw_material_id}>
                      <td>{item.name}</td>
                      <td className="mono">{item.current_stock} {item.unit}</td>
                      <td className="mono">{item.reorder_level} {item.unit}</td>
                      <td className="mono" style={{ color: "var(--danger)" }}>
                        -{item.shortage} {item.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Purchase Orders */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Purchase Orders</div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Vendor</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPOs.map(po => (
                  <tr key={po.po_id}>
                    <td className="mono">{po.po_number}</td>
                    <td>{po.vendor_name}</td>
                    <td className="mono">₹{Number(po.total_amount).toLocaleString()}</td>
                    <td>{statusBadge(po.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Sales Orders */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Recent Sales Orders</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>SO Number</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentSOs.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--text-muted)" }}>No sales orders</td></tr>
              ) : recentSOs.map(so => (
                <tr key={so.so_id}>
                  <td className="mono">{so.so_number}</td>
                  <td>{so.order_date?.slice(0, 10)}</td>
                  <td className="mono">₹{Number(so.total_amount).toLocaleString()}</td>
                  <td>{statusBadge(so.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}