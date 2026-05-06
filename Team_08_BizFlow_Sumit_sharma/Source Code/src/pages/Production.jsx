import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";

const API = "http://localhost:3000/api/production";
const getHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const statusColor = {
  planned: "badge-gray", in_progress: "badge-yellow",
  completed: "badge-green", cancelled: "badge-red",
};

export default function Production() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm]       = useState({ product_id: "", quantity: "", employee_id: "", start_date: "", so_item_id: "" });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API, getHeaders());
      setOrders(res.data);
    } catch (err) { console.error(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleProcess = async (id) => {
    if (!confirm("Process this production order? Raw materials will be deducted via BOM.")) return;
    try {
      await axios.patch(`${API}/${id}/process`, {}, getHeaders());
      setSuccess("Production order processed. Stock updated.");
      fetchOrders();
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      alert(err.response?.data?.message || "Processing failed");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault(); setError("");
    try {
      await axios.post(API, {
        product_id: Number(form.product_id),
        quantity: Number(form.quantity),
        employee_id: form.employee_id ? Number(form.employee_id) : null,
        start_date: form.start_date || null,
        so_item_id: form.so_item_id ? Number(form.so_item_id) : null,
      }, getHeaders());
      setSuccess("Production order created"); setModal(null); fetchOrders();
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) { setError(err.response?.data?.message || "Error"); }
  };

  return (
    <Layout title="Production">
      <div className="page-header">
        <div>
          <div className="page-title">Production Orders</div>
          <div className="page-subtitle">BOM-based production with atomic stock deduction</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setModal("add"); setError(""); }}>
          + New Order
        </button>
      </div>

      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        {loading ? <div className="loading">Loading...</div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Assigned To</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.production_id}>
                    <td className="mono">{o.production_id}</td>
                    <td>{o.product_name}</td>
                    <td className="mono">{o.quantity}</td>
                    <td>{o.assigned_to || "—"}</td>
                    <td>{o.start_date?.slice(0, 10) || "—"}</td>
                    <td>{o.end_date?.slice(0, 10) || "—"}</td>
                    <td><span className={`badge ${statusColor[o.status] || "badge-gray"}`}>{o.status}</span></td>
                    <td>
                      {(o.status === "planned" || o.status === "in_progress") && (
                        <button className="btn btn-primary btn-sm" onClick={() => handleProcess(o.production_id)}>
                          Process
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal === "add" && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">New Production Order</div>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleCreate}>
              <div className="grid-2">
                <div className="form-group"><label>Product ID</label>
                  <input type="number" value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })} required /></div>
                <div className="form-group"><label>Quantity</label>
                  <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required /></div>
              </div>
              <div className="grid-2">
                <div className="form-group"><label>Employee ID (optional)</label>
                  <input type="number" value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} /></div>
                <div className="form-group"><label>Start Date</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}