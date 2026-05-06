import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";

const API = "http://localhost:3000/api/inventory";
const getHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const EMPTY_RM = { name: "", unit: "", current_stock: "", reorder_level: "" };
const EMPTY_PR = { name: "", sku: "", unit: "", selling_price: "", current_stock: "" };

const normalizeRawMaterial = (item) => ({
  ...item,
  current_stock: Number(item.current_stock),
  reorder_level: Number(item.reorder_level),
});

export default function Inventory() {
  const [tab, setTab]           = useState("raw"); // "raw" | "products"
  const [rawMaterials, setRaw]  = useState([]);
  const [products, setProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null); // null | "add-rm" | "edit-rm" | "add-pr" | "edit-pr"
  const [form, setForm]         = useState({});
  const [editId, setEditId]     = useState(null);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [rm, pr, ls] = await Promise.all([
        axios.get(`${API}/raw-materials`, getHeaders()),
        axios.get(`${API}/products`, getHeaders()),
        axios.get(`${API}/low-stock`, getHeaders()),
      ]);
      setRaw(rm.data.map(normalizeRawMaterial));
      setProducts(pr.data);
      setLowStock(ls.data.map(normalizeRawMaterial));
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openAdd = (type) => {
    setForm(type === "rm" ? EMPTY_RM : EMPTY_PR);
    setEditId(null);
    setError("");
    setModal(type === "rm" ? "add-rm" : "add-pr");
  };

  const openEdit = (type, item) => {
    setForm({ ...item });
    setEditId(type === "rm" ? item.raw_material_id : item.product_id);
    setError("");
    setModal(type === "rm" ? "edit-rm" : "edit-pr");
  };

  const closeModal = () => { setModal(null); setForm({}); setEditId(null); setError(""); };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (modal === "add-rm") {
        await axios.post(`${API}/raw-materials`, form, getHeaders());
      } else if (modal === "edit-rm") {
        await axios.put(`${API}/raw-materials/${editId}`, form, getHeaders());
      } else if (modal === "add-pr") {
        await axios.post(`${API}/products`, form, getHeaders());
      } else if (modal === "edit-pr") {
        await axios.put(`${API}/products/${editId}`, form, getHeaders());
      }
      setSuccess("Saved successfully");
      closeModal();
      fetchAll();
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  const handleDelete = async (type, id) => {
    if (!confirm("Are you sure you want to delete this?")) return;
    try {
      if (type === "rm") await axios.delete(`${API}/raw-materials/${id}`, getHeaders());
      else await axios.delete(`${API}/products/${id}`, getHeaders());
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  const isRM = modal === "add-rm" || modal === "edit-rm";

  return (
    <Layout title="Inventory">
      <div className="page-header">
        <div>
          <div className="page-title">Inventory</div>
          <div className="page-subtitle">Manage raw materials and finished goods</div>
        </div>
      </div>

      {success && <div className="alert alert-success">{success}</div>}

      {/* Low stock banner */}
      {lowStock.length > 0 && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          ⚠ {lowStock.length} item{lowStock.length > 1 ? "s" : ""} below reorder level:{" "}
          {lowStock.map(i => i.name).join(", ")}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          className={`btn ${tab === "raw" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setTab("raw")}
        >📦 Raw Materials</button>
        <button
          className={`btn ${tab === "products" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setTab("products")}
        >🏷 Products</button>
      </div>

      {/* Raw Materials Tab */}
      {tab === "raw" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Raw Materials ({rawMaterials.length})</div>
            <button className="btn btn-primary btn-sm" onClick={() => openAdd("rm")}>+ Add Material</button>
          </div>
          {loading ? <div className="loading">Loading...</div> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Unit</th>
                    <th>Current Stock</th>
                    <th>Reorder Level</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rawMaterials.map(rm => (
                    <tr key={rm.raw_material_id}>
                      <td className="mono">{rm.raw_material_id}</td>
                      <td>{rm.name}</td>
                      <td>{rm.unit}</td>
                      <td className="mono">{rm.current_stock}</td>
                      <td className="mono">{rm.reorder_level}</td>
                      <td>
                        {Number(rm.current_stock) <= Number(rm.reorder_level)
                          ? <span className="badge badge-red">Low Stock</span>
                          : <span className="badge badge-green">OK</span>}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit("rm", rm)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete("rm", rm.raw_material_id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Products Tab */}
      {tab === "products" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Products ({products.length})</div>
            <button className="btn btn-primary btn-sm" onClick={() => openAdd("pr")}>+ Add Product</button>
          </div>
          {loading ? <div className="loading">Loading...</div> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>SKU</th>
                    <th>Unit</th>
                    <th>Selling Price</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(pr => (
                    <tr key={pr.product_id}>
                      <td className="mono">{pr.product_id}</td>
                      <td>{pr.name}</td>
                      <td className="mono">{pr.sku}</td>
                      <td>{pr.unit}</td>
                      <td className="mono">₹{Number(pr.selling_price).toLocaleString()}</td>
                      <td className="mono">{pr.current_stock}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit("pr", pr)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete("pr", pr.product_id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                {modal.startsWith("add") ? "Add" : "Edit"} {isRM ? "Raw Material" : "Product"}
              </div>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input name="name" value={form.name || ""} onChange={handleChange} required />
              </div>

              {!isRM && (
                <div className="form-group">
                  <label>SKU</label>
                  <input name="sku" value={form.sku || ""} onChange={handleChange} placeholder="PRD-001" />
                </div>
              )}

              <div className="form-group">
                <label>Unit</label>
                <input name="unit" value={form.unit || ""} onChange={handleChange} placeholder="kg / pcs / litre" required />
              </div>

              {isRM ? (
                <>
                  <div className="grid-2">
                    <div className="form-group">
                      <label>Current Stock</label>
                      <input name="current_stock" type="number" value={form.current_stock || ""} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Reorder Level</label>
                      <input name="reorder_level" type="number" value={form.reorder_level || ""} onChange={handleChange} />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid-2">
                    <div className="form-group">
                      <label>Selling Price (₹)</label>
                      <input name="selling_price" type="number" value={form.selling_price || ""} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                      <label>Current Stock</label>
                      <input name="current_stock" type="number" value={form.current_stock || ""} onChange={handleChange} />
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}