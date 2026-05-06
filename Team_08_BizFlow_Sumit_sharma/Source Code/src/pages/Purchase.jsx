import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";

const API = "http://localhost:3000/api/purchase";
const getHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const statusColor = {
  pending: "badge-yellow", approved: "badge-blue",
  received: "badge-green", cancelled: "badge-red",
};

export default function Purchase() {
  const [pos, setPOs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState(null);
  const [detail, setDetail] = useState(null);
  const [error, setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm]     = useState({
    party_id: "", po_number: "", order_date: "",
    items: [{ raw_material_id: "", quantity: "", price: "" }],
  });

  const fetchPOs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API, getHeaders());
      setPOs(res.data);
    } catch (err) { console.error(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPOs(); }, []);

  const openDetail = async (id) => {
    try {
      const res = await axios.get(`${API}/${id}`, getHeaders());
      setDetail(res.data);
      setModal("detail");
    } catch (err) { console.error(err.message); }
  };

  const handleGRN = async (id) => {
    if (!confirm("Mark this PO as received? Stock will be updated automatically.")) return;
    try {
      await axios.patch(`${API}/${id}/grn`, {}, getHeaders());
      setSuccess("GRN received. Stock updated.");
      fetchPOs();
      if (detail) setDetail({ ...detail, status: "received" });
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) { alert(err.response?.data?.message || "Failed"); }
  };

  const addItem = () => setForm({
    ...form,
    items: [...form.items, { raw_material_id: "", quantity: "", price: "" }],
  });

  const removeItem = (i) => setForm({
    ...form,
    items: form.items.filter((_, idx) => idx !== i),
  });

  const updateItem = (i, field, val) => {
    const items = [...form.items];
    items[i][field] = val;
    setForm({ ...form, items });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await axios.post(API, {
        ...form,
        party_id: Number(form.party_id),
        items: form.items.map(i => ({
          raw_material_id: Number(i.raw_material_id),
          quantity: Number(i.quantity),
          price: Number(i.price),
        })),
      }, getHeaders());
      setSuccess("Purchase order created successfully");
      setModal(null);
      fetchPOs();
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <Layout title="Purchase">
      <div className="page-header">
        <div>
          <div className="page-title">Purchase Orders</div>
          <div className="page-subtitle">Manage vendor purchase orders and GRN</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setModal("add"); setError(""); }}>
          + New PO
        </button>
      </div>

      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        {loading ? <div className="loading">Loading...</div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Vendor</th>
                  <th>Order Date</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pos.map(po => (
                  <tr key={po.po_id}>
                    <td className="mono">{po.po_number}</td>
                    <td>{po.vendor_name}</td>
                    <td>{po.order_date?.slice(0, 10)}</td>
                    <td className="mono">₹{Number(po.total_amount).toLocaleString()}</td>
                    <td><span className={`badge ${statusColor[po.status] || "badge-gray"}`}>{po.status}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openDetail(po.po_id)}>View</button>
                        {po.status !== "received" && po.status !== "cancelled" && (
                          <button className="btn btn-primary btn-sm" onClick={() => handleGRN(po.po_id)}>GRN</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add PO Modal */}
      {modal === "add" && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">New Purchase Order</div>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label>Party ID (Vendor)</label>
                  <input name="party_id" type="number" value={form.party_id}
                    onChange={e => setForm({ ...form, party_id: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>PO Number</label>
                  <input name="po_number" value={form.po_number}
                    onChange={e => setForm({ ...form, po_number: e.target.value })}
                    placeholder="PO-2024-005" required />
                </div>
              </div>
              <div className="form-group">
                <label>Order Date</label>
                <input type="date" value={form.order_date}
                  onChange={e => setForm({ ...form, order_date: e.target.value })} required />
              </div>

              <div style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ margin: 0 }}>Items</label>
                <button type="button" className="btn btn-ghost btn-sm" onClick={addItem}>+ Add Item</button>
              </div>

              {form.items.map((item, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8, marginBottom: 8 }}>
                  <input type="number" placeholder="Material ID" value={item.raw_material_id}
                    onChange={e => updateItem(i, "raw_material_id", e.target.value)} required />
                  <input type="number" placeholder="Quantity" value={item.quantity}
                    onChange={e => updateItem(i, "quantity", e.target.value)} required />
                  <input type="number" placeholder="Price/unit" value={item.price}
                    onChange={e => updateItem(i, "price", e.target.value)} required />
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(i)}>✕</button>
                </div>
              ))}

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create PO</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {modal === "detail" && detail && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{detail.po_number}</div>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div style={{ marginBottom: 16, display: "flex", gap: 12, fontSize: 13, color: "var(--text-secondary)" }}>
              <span>Vendor: <strong style={{ color: "var(--text-primary)" }}>{detail.vendor_name}</strong></span>
              <span>Date: <strong style={{ color: "var(--text-primary)" }}>{detail.order_date?.slice(0, 10)}</strong></span>
              <span><span className={`badge ${statusColor[detail.status]}`}>{detail.status}</span></span>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Material ID</th><th>Quantity</th><th>Price</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {detail.items?.map((item, i) => (
                    <tr key={i}>
                      <td className="mono">{item.material_name || item.raw_material_id}</td>
                      <td className="mono">{item.quantity} {item.unit}</td>
                      <td className="mono">₹{Number(item.price).toLocaleString()}</td>
                      <td className="mono">₹{(item.quantity * item.price).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 14 }}>
                Total: ₹{Number(detail.total_amount).toLocaleString()}
              </span>
              {detail.status !== "received" && detail.status !== "cancelled" && (
                <button className="btn btn-primary" onClick={() => handleGRN(detail.po_id)}>
                  Receive GRN
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}