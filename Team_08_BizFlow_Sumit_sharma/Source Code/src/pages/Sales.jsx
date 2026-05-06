import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";

const API = "http://localhost:3000/api/sales";
const getHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const statusColor = {
  pending: "badge-yellow", processing: "badge-blue", dispatched: "badge-blue",
  completed: "badge-green", cancelled: "badge-red",
};

export default function Sales() {
  const [sos, setSOs]         = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [detail, setDetail]   = useState(null);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm]       = useState({
    so_number: "", order_date: "", cust_po_id: "",
    items: [{ product_id: "", quantity: "", price: "" }],
  });
  const [invoiceForm, setInvoiceForm]   = useState({ so_id: "", invoice_number: "", invoice_date: "", tax_amount: "", total_amount: "" });
  const [paymentForm, setPaymentForm]   = useState({ invoice_id: "", amount_paid: "", payment_date: "", payment_mode: "bank_transfer" });
  const [dispatchForm, setDispatchForm] = useState({ so_id: "", tracking_number: "", transport_name: "", dispatch_date: "" });

  const fetchSOs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API, getHeaders());
      setSOs(res.data);
    } catch (err) { console.error(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSOs(); }, []);

  const openDetail = async (id) => {
    try {
      const res = await axios.get(`${API}/${id}`, getHeaders());
      setDetail(res.data);
      setModal("detail");
    } catch (err) { console.error(err.message); }
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { product_id: "", quantity: "", price: "" }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i, field, val) => {
    const items = [...form.items]; items[i][field] = val; setForm({ ...form, items });
  };

  const handleCreateSO = async (e) => {
    e.preventDefault(); setError("");
    try {
      await axios.post(API, {
        ...form,
        cust_po_id: form.cust_po_id ? Number(form.cust_po_id) : null,
        items: form.items.map(i => ({ product_id: Number(i.product_id), quantity: Number(i.quantity), price: Number(i.price) })),
      }, getHeaders());
      setSuccess("Sales order created"); setModal(null); fetchSOs();
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) { setError(err.response?.data?.message || "Error"); }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault(); setError("");
    try {
      await axios.post(`${API}/invoice`, {
        ...invoiceForm,
        so_id: Number(invoiceForm.so_id),
        tax_amount: Number(invoiceForm.tax_amount),
        total_amount: Number(invoiceForm.total_amount),
      }, getHeaders());
      setSuccess("Invoice created"); setModal(null);
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) { setError(err.response?.data?.message || "Error"); }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault(); setError("");
    try {
      await axios.post(`${API}/payment`, {
        ...paymentForm,
        invoice_id: Number(paymentForm.invoice_id),
        amount_paid: Number(paymentForm.amount_paid),
      }, getHeaders());
      setSuccess("Payment recorded. Invoice status updated."); setModal(null);
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) { setError(err.response?.data?.message || "Error"); }
  };

  const handleDispatch = async (e) => {
    e.preventDefault(); setError("");
    try {
      await axios.post(`${API}/dispatch`, {
        ...dispatchForm,
        so_id: Number(dispatchForm.so_id),
      }, getHeaders());
      setSuccess("Dispatched. Sales order status updated."); setModal(null); fetchSOs();
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) { setError(err.response?.data?.message || "Error"); }
  };

  const openModal = (type) => { setError(""); setModal(type); };

  return (
    <Layout title="Sales">
      <div className="page-header">
        <div>
          <div className="page-title">Sales Orders</div>
          <div className="page-subtitle">Manage sales orders, invoices, payments and dispatch</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => openModal("invoice")}>+ Invoice</button>
          <button className="btn btn-ghost" onClick={() => openModal("payment")}>+ Payment</button>
          <button className="btn btn-ghost" onClick={() => openModal("dispatch")}>+ Dispatch</button>
          <button className="btn btn-primary" onClick={() => openModal("add")}>+ New SO</button>
        </div>
      </div>

      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        {loading ? <div className="loading">Loading...</div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>SO Number</th>
                  <th>Order Date</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sos.map(so => (
                  <tr key={so.so_id}>
                    <td className="mono">{so.so_number}</td>
                    <td>{so.order_date?.slice(0, 10)}</td>
                    <td className="mono">₹{Number(so.total_amount).toLocaleString()}</td>
                    <td><span className={`badge ${statusColor[so.status] || "badge-gray"}`}>{so.status}</span></td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => openDetail(so.so_id)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New SO Modal */}
      {modal === "add" && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">New Sales Order</div>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleCreateSO}>
              <div className="grid-2">
                <div className="form-group">
                  <label>SO Number</label>
                  <input value={form.so_number} onChange={e => setForm({ ...form, so_number: e.target.value })} placeholder="SO-2024-004" required />
                </div>
                <div className="form-group">
                  <label>Order Date</label>
                  <input type="date" value={form.order_date} onChange={e => setForm({ ...form, order_date: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label>Customer PO ID (optional)</label>
                <input type="number" value={form.cust_po_id} onChange={e => setForm({ ...form, cust_po_id: e.target.value })} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ margin: 0 }}>Items</label>
                <button type="button" className="btn btn-ghost btn-sm" onClick={addItem}>+ Add Item</button>
              </div>
              {form.items.map((item, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8, marginBottom: 8 }}>
                  <input type="number" placeholder="Product ID" value={item.product_id} onChange={e => updateItem(i, "product_id", e.target.value)} required />
                  <input type="number" placeholder="Quantity" value={item.quantity} onChange={e => updateItem(i, "quantity", e.target.value)} required />
                  <input type="number" placeholder="Price/unit" value={item.price} onChange={e => updateItem(i, "price", e.target.value)} required />
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(i)}>✕</button>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create SO</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {modal === "invoice" && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Create Invoice</div>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleCreateInvoice}>
              <div className="grid-2">
                <div className="form-group"><label>SO ID</label>
                  <input type="number" value={invoiceForm.so_id} onChange={e => setInvoiceForm({ ...invoiceForm, so_id: e.target.value })} required /></div>
                <div className="form-group"><label>Invoice Number</label>
                  <input value={invoiceForm.invoice_number} onChange={e => setInvoiceForm({ ...invoiceForm, invoice_number: e.target.value })} placeholder="INV-2024-004" required /></div>
              </div>
              <div className="grid-2">
                <div className="form-group"><label>Invoice Date</label>
                  <input type="date" value={invoiceForm.invoice_date} onChange={e => setInvoiceForm({ ...invoiceForm, invoice_date: e.target.value })} required /></div>
                <div className="form-group"><label>Tax Amount (₹)</label>
                  <input type="number" value={invoiceForm.tax_amount} onChange={e => setInvoiceForm({ ...invoiceForm, tax_amount: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>Total Amount (₹)</label>
                <input type="number" value={invoiceForm.total_amount} onChange={e => setInvoiceForm({ ...invoiceForm, total_amount: e.target.value })} required /></div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {modal === "payment" && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Record Payment</div>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleAddPayment}>
              <div className="grid-2">
                <div className="form-group"><label>Invoice ID</label>
                  <input type="number" value={paymentForm.invoice_id} onChange={e => setPaymentForm({ ...paymentForm, invoice_id: e.target.value })} required /></div>
                <div className="form-group"><label>Amount Paid (₹)</label>
                  <input type="number" value={paymentForm.amount_paid} onChange={e => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })} required /></div>
              </div>
              <div className="grid-2">
                <div className="form-group"><label>Payment Date</label>
                  <input type="date" value={paymentForm.payment_date} onChange={e => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} required /></div>
                <div className="form-group"><label>Payment Mode</label>
                  <select value={paymentForm.payment_mode} onChange={e => setPaymentForm({ ...paymentForm, payment_mode: e.target.value })}>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                    <option value="upi">UPI</option>
                  </select></div>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispatch Modal */}
      {modal === "dispatch" && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Create Dispatch</div>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleDispatch}>
              <div className="grid-2">
                <div className="form-group"><label>SO ID</label>
                  <input type="number" value={dispatchForm.so_id} onChange={e => setDispatchForm({ ...dispatchForm, so_id: e.target.value })} required /></div>
                <div className="form-group"><label>Dispatch Date</label>
                  <input type="date" value={dispatchForm.dispatch_date} onChange={e => setDispatchForm({ ...dispatchForm, dispatch_date: e.target.value })} required /></div>
              </div>
              <div className="grid-2">
                <div className="form-group"><label>Tracking Number</label>
                  <input value={dispatchForm.tracking_number} onChange={e => setDispatchForm({ ...dispatchForm, tracking_number: e.target.value })} /></div>
                <div className="form-group"><label>Transport Name</label>
                  <input value={dispatchForm.transport_name} onChange={e => setDispatchForm({ ...dispatchForm, transport_name: e.target.value })} /></div>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Dispatch</button>
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
              <div className="modal-title">{detail.so_number}</div>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 16, fontSize: 13, color: "var(--text-secondary)" }}>
              <span>Date: <strong style={{ color: "var(--text-primary)" }}>{detail.order_date?.slice(0, 10)}</strong></span>
              <span><span className={`badge ${statusColor[detail.status] || "badge-gray"}`}>{detail.status}</span></span>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {detail.items?.map((item, i) => (
                    <tr key={i}>
                      <td>{item.product_name || `Product #${item.product_id}`}</td>
                      <td className="mono">{item.quantity}</td>
                      <td className="mono">₹{Number(item.price).toLocaleString()}</td>
                      <td className="mono">₹{(item.quantity * item.price).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ textAlign: "right", marginTop: 12, fontFamily: "var(--font-mono)", fontSize: 14 }}>
              Total: ₹{Number(detail.total_amount).toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}