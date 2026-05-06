import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";

const API = "http://localhost:3000/api/maintenance";
const getHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const EMPTY_MACHINE = { name: "", location: "", last_service_date: "", next_service_date: "" };
const EMPTY_LOG = { machine_id: "", employee_id: "", description: "", cost: "", service_date: "" };

export default function Maintenance() {
  const [machines, setMachines] = useState([]);
  const [logs, setLogs]         = useState([]);
  const [tab, setTab]           = useState("machines");
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);
  const [form, setForm]         = useState({});
  const [editId, setEditId]     = useState(null);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [selectedMachine, setSelectedMachine] = useState(null);

  const fetchMachines = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/machines`, getHeaders());
      setMachines(res.data);
    } catch (err) { console.error(err.message); }
    finally { setLoading(false); }
  };

  const fetchLogs = async (machine_id) => {
    try {
      const res = await axios.get(`${API}/machines/${machine_id}/logs`, getHeaders());
      setLogs(res.data);
      setSelectedMachine(machine_id);
      setTab("logs");
    } catch (err) { console.error(err.message); }
  };

  useEffect(() => { fetchMachines(); }, []);

  const openAddMachine = () => { setForm(EMPTY_MACHINE); setEditId(null); setError(""); setModal("machine"); };
  const openEditMachine = (m) => { setForm({ ...m }); setEditId(m.machine_id); setError(""); setModal("machine"); };
  const openAddLog = () => { setForm(EMPTY_LOG); setError(""); setModal("log"); };

  const handleMachineSubmit = async (e) => {
    e.preventDefault(); setError("");
    try {
      if (editId) await axios.put(`${API}/machines/${editId}`, form, getHeaders());
      else await axios.post(`${API}/machines`, form, getHeaders());
      setSuccess(editId ? "Machine updated" : "Machine added");
      setModal(null); fetchMachines();
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) { setError(err.response?.data?.message || "Error"); }
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault(); setError("");
    try {
      await axios.post(`${API}/logs`, {
        ...form,
        machine_id: Number(form.machine_id),
        employee_id: form.employee_id ? Number(form.employee_id) : null,
        cost: Number(form.cost || 0),
      }, getHeaders());
      setSuccess("Maintenance log added. Machine service date updated.");
      setModal(null); fetchMachines();
      if (selectedMachine) fetchLogs(selectedMachine);
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) { setError(err.response?.data?.message || "Error"); }
  };

  return (
    <Layout title="Maintenance">
      <div className="page-header">
        <div>
          <div className="page-title">Maintenance</div>
          <div className="page-subtitle">Machine tracking and service logs</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={openAddLog}>+ Log Service</button>
          <button className="btn btn-primary" onClick={openAddMachine}>+ Add Machine</button>
        </div>
      </div>

      {success && <div className="alert alert-success">{success}</div>}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button className={`btn ${tab === "machines" ? "btn-primary" : "btn-ghost"}`} onClick={() => setTab("machines")}>
          🔧 Machines
        </button>
        {selectedMachine && (
          <button className={`btn ${tab === "logs" ? "btn-primary" : "btn-ghost"}`} onClick={() => setTab("logs")}>
            📋 Service Logs (Machine #{selectedMachine})
          </button>
        )}
      </div>

      {/* Machines Tab */}
      {tab === "machines" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Machines ({machines.length})</div>
          </div>
          {loading ? <div className="loading">Loading...</div> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Location</th>
                    <th>Last Service</th>
                    <th>Next Service</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {machines.map(m => (
                    <tr key={m.machine_id}>
                      <td className="mono">{m.machine_id}</td>
                      <td>{m.name}</td>
                      <td>{m.location || "—"}</td>
                      <td>{m.last_service_date?.slice(0, 10) || "—"}</td>
                      <td>{m.next_service_date?.slice(0, 10) || "—"}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => fetchLogs(m.machine_id)}>Logs</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEditMachine(m)}>Edit</button>
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

      {/* Logs Tab */}
      {tab === "logs" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Service Logs — Machine #{selectedMachine}</div>
            <button className="btn btn-ghost btn-sm" onClick={() => setTab("machines")}>← Back</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Technician</th>
                  <th>Description</th>
                  <th>Cost</th>
                  <th>Service Date</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)" }}>No logs found</td></tr>
                ) : logs.map(log => (
                  <tr key={log.maintenance_id}>
                    <td className="mono">{log.maintenance_id}</td>
                    <td>{log.technician_name || "—"}</td>
                    <td>{log.description}</td>
                    <td className="mono">₹{Number(log.cost || 0).toLocaleString()}</td>
                    <td>{log.service_date?.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Machine Modal */}
      {modal === "machine" && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editId ? "Edit Machine" : "Add Machine"}</div>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleMachineSubmit}>
              <div className="grid-2">
                <div className="form-group"><label>Machine Name</label>
                  <input value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="form-group"><label>Location</label>
                  <input value={form.location || ""} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
              </div>
              <div className="grid-2">
                <div className="form-group"><label>Last Service Date</label>
                  <input type="date" value={form.last_service_date?.slice(0, 10) || ""} onChange={e => setForm({ ...form, last_service_date: e.target.value })} /></div>
                <div className="form-group"><label>Next Service Date</label>
                  <input type="date" value={form.next_service_date?.slice(0, 10) || ""} onChange={e => setForm({ ...form, next_service_date: e.target.value })} /></div>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Modal */}
      {modal === "log" && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Log Service</div>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleLogSubmit}>
              <div className="grid-2">
                <div className="form-group"><label>Machine ID</label>
                  <input type="number" value={form.machine_id || ""} onChange={e => setForm({ ...form, machine_id: e.target.value })} required /></div>
                <div className="form-group"><label>Employee ID (Technician)</label>
                  <input type="number" value={form.employee_id || ""} onChange={e => setForm({ ...form, employee_id: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>Description</label>
                <textarea rows={2} value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid-2">
                <div className="form-group"><label>Cost (₹)</label>
                  <input type="number" value={form.cost || ""} onChange={e => setForm({ ...form, cost: e.target.value })} /></div>
                <div className="form-group"><label>Service Date</label>
                  <input type="date" value={form.service_date || ""} onChange={e => setForm({ ...form, service_date: e.target.value })} required /></div>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Log</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}