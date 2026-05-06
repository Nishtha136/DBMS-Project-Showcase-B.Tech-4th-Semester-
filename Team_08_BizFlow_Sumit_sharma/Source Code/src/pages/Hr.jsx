import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";

const API = "http://localhost:3000/api/hr";
const getHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const EMPTY = { user_id: "", name: "", email: "", phone: "", designation: "", salary: "", join_date: "", role_id: "" };

export default function HR() {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [editId, setEditId]       = useState(null);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");

  const fetchRoles = async () => {
    try {
      const res = await axios.get(`${API}/roles`, getHeaders());
      setRoles(res.data);
    } catch (err) { console.error("Failed to fetch roles:", err.message); }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API, getHeaders());
      setEmployees(res.data);
    } catch (err) { console.error(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { 
    fetchRoles();
    fetchEmployees();
  }, []);

  const openAdd = () => { setForm(EMPTY); setEditId(null); setError(""); setModal("form"); };
  const openEdit = (emp) => { setForm({ ...emp, user_id: emp.user_id || "", role_id: emp.role_id || "" }); setEditId(emp.employee_id); setError(""); setModal("form"); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    try {
      const payload = { 
        ...form, 
        salary: Number(form.salary), 
        user_id: form.user_id ? Number(form.user_id) : null,
        role_id: form.role_id ? Number(form.role_id) : null
      };
      if (editId) await axios.put(`${API}/${editId}`, payload, getHeaders());
      else await axios.post(API, payload, getHeaders());
      setSuccess(editId ? "Employee updated" : "Employee added");
      setModal(null); fetchEmployees();
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) { setError(err.response?.data?.message || "Error"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this employee?")) return;
    try {
      await axios.delete(`${API}/${id}`, getHeaders());
      fetchEmployees();
    } catch (err) { alert(err.response?.data?.message || "Delete failed"); }
  };

  const getRoleName = (roleId) => {
    const role = roles.find(r => r.role_id === roleId);
    return role ? role.role_name : "—";
  };

  return (
    <Layout title="HR">
      <div className="page-header">
        <div>
          <div className="page-title">Human Resources</div>
          <div className="page-subtitle">Manage employees and designations</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Employee</button>
      </div>

      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        {loading ? <div className="loading">Loading...</div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Designation</th>
                  <th>Salary</th>
                  <th>Role</th>
                  <th>Join Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.employee_id}>
                    <td className="mono">{emp.employee_id}</td>
                    <td>{emp.name}</td>
                    <td>{emp.email}</td>
                    <td>{emp.phone || "—"}</td>
                    <td>{emp.designation}</td>
                    <td className="mono">₹{Number(emp.salary || 0).toLocaleString()}</td>
                    <td>{emp.role_name || "—"}</td>
                    <td>{emp.join_date?.slice(0, 10) || "—"}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(emp)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(emp.employee_id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal === "form" && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editId ? "Edit Employee" : "Add Employee"}</div>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-group"><label>Full Name</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="form-group"><label>Email</label>
                  <input type="email" value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div className="grid-2">
                <div className="form-group"><label>Phone</label>
                  <input value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="form-group"><label>Designation</label>
                  <input value={form.designation || ""} onChange={e => setForm({ ...form, designation: e.target.value })} required /></div>
              </div>
              <div className="grid-2">
                <div className="form-group"><label>Salary (₹)</label>
                  <input type="number" value={form.salary || ""} onChange={e => setForm({ ...form, salary: e.target.value })} /></div>
                <div className="form-group"><label>Join Date</label>
                  <input type="date" value={form.join_date?.slice(0, 10) || ""} onChange={e => setForm({ ...form, join_date: e.target.value })} /></div>
              </div>
              <div className="grid-2">
                <div className="form-group"><label>User ID (optional)</label>
                  <input type="number" value={form.user_id || ""} onChange={e => setForm({ ...form, user_id: e.target.value })} /></div>
                <div className="form-group"><label>System Role (optional)</label>
                  <select value={form.role_id || ""} onChange={e => setForm({ ...form, role_id: e.target.value })}>
                    <option value="">-- Select Role --</option>
                    {roles.map(role => (
                      <option key={role.role_id} value={role.role_id}>{role.role_name}</option>
                    ))}
                  </select></div>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}